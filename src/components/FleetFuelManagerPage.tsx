"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Fuel,
  Truck,
  Users,
  Plus,
  Pencil,
  Trash2,
  Check,
  RefreshCw,
  Receipt,
  Boxes,
  Route,
  ExternalLink,
  FileSpreadsheet,
  Upload,
  Download,
  Save,
  AlertCircle,
} from "lucide-react";
import {
  AxleConfig,
  calculateMoroccoRoute,
  DriverEcoRecord,
  FuelPurchaseRecord,
  getGoogleMapsDirectionsUrl,
  InstanceFleetData,
  Locale,
  LtlShipment,
  MapTruck,
  MOROCCO_CITY_COORDS,
  TrailerType,
} from "@/lib/supabase/database";
import {
  downloadFleetExcelTemplate,
  exportInstanceFleetToExcel,
  ParsedExcelImportResult,
  parseFleetExcelFile,
} from "@/lib/excel/fleetWorkbook";
import { TranslationDictionary } from "@/lib/i18n/translations";
import {
  ConfirmDeleteModal,
  DeleteConfirmationRequest,
} from "./ConfirmDeleteModal";

interface FleetFuelManagerPageProps {
  locale: Locale;
  t: TranslationDictionary;
  instanceSlug?: string;
  fuelPriceMad: number;
  onUpdateFuelPrice: (newPrice: number) => void;
  fuelPurchases: FuelPurchaseRecord[];
  onAddFuelPurchase: (purchase: Omit<FuelPurchaseRecord, "id">) => void;
  onUpdateFuelPurchase: (purchase: FuelPurchaseRecord) => void;
  onDeleteFuelPurchase: (id: string) => void;
  trucks: MapTruck[];
  onAddTruck: (truck: MapTruck) => void;
  onUpdateTruck: (truck: MapTruck) => void;
  onDeleteTruck: (id: string) => void;
  drivers: DriverEcoRecord[];
  onAddDriver: (driver: DriverEcoRecord) => void;
  onUpdateDriver: (driver: DriverEcoRecord) => void;
  onDeleteDriver: (id: string) => void;
  shipments?: LtlShipment[];
  onAddShipment?: (shipment: LtlShipment) => void;
  onUpdateShipment?: (shipment: LtlShipment) => void;
  onDeleteShipment?: (id: string) => void;
  onBulkImportExcel?: (
    parsed: ParsedExcelImportResult,
    mode: "merge" | "replace"
  ) => void;
  onClearAllInstanceFleet?: () => void;
}

export function FleetFuelManagerPage({
  locale,
  t,
  instanceSlug = "atlaslogix",
  fuelPriceMad,
  onUpdateFuelPrice,
  fuelPurchases,
  onAddFuelPurchase,
  onUpdateFuelPurchase,
  onDeleteFuelPurchase,
  trucks,
  onAddTruck,
  onUpdateTruck,
  onDeleteTruck,
  drivers,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
  shipments = [],
  onAddShipment,
  onUpdateShipment,
  onDeleteShipment,
  onBulkImportExcel,
  onClearAllInstanceFleet,
}: FleetFuelManagerPageProps) {
  const [subTab, setSubTab] = useState<
    "trucks" | "drivers" | "routes" | "fuel" | "excel"
  >("trucks");

  const [savedBannerMsg, setSavedBannerMsg] = useState<string | null>(null);
  const [deleteRequest, setDeleteRequest] =
    useState<DeleteConfirmationRequest | null>(null);

  const notifySaved = (msg: string) => {
    setSavedBannerMsg(msg);
    setTimeout(() => setSavedBannerMsg(null), 3500);
  };

  // --- 1. Excel (.xlsx / .csv) Import & Preview State ---
  const [parsedExcel, setParsedExcel] =
    useState<ParsedExcelImportResult | null>(null);
  const [excelImportMode, setExcelImportMode] = useState<"merge" | "replace">(
    "merge"
  );
  const [excelError, setExcelError] = useState<string | null>(null);

  const handleExcelFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelError(null);
    try {
      const result = await parseFleetExcelFile(file, fuelPriceMad);
      setParsedExcel(result);
    } catch (err: any) {
      setExcelError(
        err?.message || "Could not parse Excel file. Please use .xlsx or .csv."
      );
    }
    e.target.value = "";
  };

  const handleConfirmExcelImport = () => {
    if (!parsedExcel || !onBulkImportExcel) return;
    onBulkImportExcel(parsedExcel, excelImportMode);
    notifySaved(
      `✓ Imported ${parsedExcel.trucks.length} Trucks, ${parsedExcel.drivers.length} Drivers, ${parsedExcel.shipments.length} Routes & ${parsedExcel.fuelPurchases.length} Fuel Logs to Supabase!`
    );
    setParsedExcel(null);
  };

  // --- 2. Fuel Tariff & Purchases State ---
  const [tariffInput, setTariffInput] = useState<string>(
    fuelPriceMad.toFixed(2)
  );
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(
    null
  );
  const [fpInvoice, setFpInvoice] = useState("INV-MA-8845");
  const [fpDate, setFpDate] = useState("2026-11-21");
  const [fpTruckCode, setFpTruckCode] = useState(
    trucks[0]?.code || "Truck 101"
  );
  const [fpStation, setFpStation] = useState("Afriquia Autoroute A3");
  const [fpCity, setFpCity] = useState("Casablanca Zenata");
  const [fpLiters, setFpLiters] = useState("400");
  const [fpUnitPrice, setFpUnitPrice] = useState(fuelPriceMad.toFixed(2));
  const [fpPayment, setFpPayment] = useState<
    "Fleet Card" | "Depot Bulk" | "Jawaz / Card"
  >("Fleet Card");

  useEffect(() => {
    setTariffInput(fuelPriceMad.toFixed(2));
  }, [fuelPriceMad]);

  const fuelSummary = useMemo(() => {
    const totalLiters = fuelPurchases.reduce((sum, p) => sum + p.liters, 0);
    const totalMad = fuelPurchases.reduce(
      (sum, p) => sum + p.liters * p.pricePerLiterMad,
      0
    );
    const weightedAvg = totalLiters > 0 ? totalMad / totalLiters : fuelPriceMad;
    return {
      totalLiters,
      totalMad: Math.round(totalMad * 100) / 100,
      weightedAvg: Math.round(weightedAvg * 100) / 100,
    };
  }, [fuelPurchases, fuelPriceMad]);

  const handleApplyManualTariff = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(tariffInput);
    if (!isNaN(parsed) && parsed > 1 && parsed < 100) {
      const next = Math.round(parsed * 100) / 100;
      onUpdateFuelPrice(next);
      notifySaved(`✓ Active Fuel Tariff saved (${next.toFixed(2)} MAD/L)`);
    }
  };

  const handleStartEditPurchase = (p: FuelPurchaseRecord) => {
    setEditingPurchaseId(p.id);
    setFpInvoice(p.invoiceNo);
    setFpDate(p.dateIso);
    setFpTruckCode(p.truckCode);
    setFpStation(p.stationName);
    setFpCity(p.city);
    setFpLiters(String(p.liters));
    setFpUnitPrice(p.pricePerLiterMad.toFixed(2));
    setFpPayment(p.paymentMethod);
  };

  const handleResetPurchaseForm = () => {
    setEditingPurchaseId(null);
    setFpInvoice(`INV-MA-${Math.floor(8850 + Math.random() * 140)}`);
    setFpDate("2026-11-21");
    setFpLiters("400");
    setFpUnitPrice(fuelPriceMad.toFixed(2));
  };

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const litersNum = Math.max(10, parseFloat(fpLiters) || 400);
    const priceNum = Math.max(1, parseFloat(fpUnitPrice) || fuelPriceMad);
    const matchedTruck = trucks.find((x) => x.code === fpTruckCode);
    const driverName = matchedTruck
      ? matchedTruck.driverName.en
      : "Fleet Driver";

    if (editingPurchaseId) {
      onUpdateFuelPurchase({
        id: editingPurchaseId,
        invoiceNo: fpInvoice.trim() || "INV-MA-8850",
        dateIso: fpDate,
        truckCode: fpTruckCode,
        driverName,
        stationName: fpStation.trim() || "Afriquia Station",
        city: fpCity,
        liters: Math.round(litersNum * 10) / 10,
        pricePerLiterMad: Math.round(priceNum * 100) / 100,
        paymentMethod: fpPayment,
      });
      notifySaved(`✓ Fuel invoice ${fpInvoice} updated and saved to Supabase.`);
    } else {
      onAddFuelPurchase({
        invoiceNo:
          fpInvoice.trim() ||
          `INV-MA-${Math.floor(8850 + Math.random() * 140)}`,
        dateIso: fpDate,
        truckCode: fpTruckCode,
        driverName,
        stationName: fpStation.trim() || "Afriquia Station",
        city: fpCity,
        liters: Math.round(litersNum * 10) / 10,
        pricePerLiterMad: Math.round(priceNum * 100) / 100,
        paymentMethod: fpPayment,
      });
      notifySaved(`✓ Fuel invoice ${fpInvoice} added and saved to Supabase.`);
    }
    handleResetPurchaseForm();
  };

  // --- 3. Trucks Registry CRUD State ---
  const [editingTruckId, setEditingTruckId] = useState<string | null>(null);
  const [trkCode, setTrkCode] = useState("Truck 101");
  const [trkPlate, setTrkPlate] = useState("94510-A-1");
  const [trkModel, setTrkModel] = useState("Volvo FH 500 Globetrotter");
  const [trkTrailerType, setTrkTrailerType] =
    useState<TrailerType>("Tautliner 13.6m");
  const [trkAxleConfig, setTrkAxleConfig] = useState<AxleConfig>(
    "4x2 + 3-Axle (40T)"
  );
  const [trkDriverName, setTrkDriverName] = useState("Tariq El Mansouri");
  const [trkStatus, setTrkStatus] = useState<"moving" | "idling" | "alert">(
    "moving"
  );
  const [trkHub, setTrkHub] = useState<string>("Casablanca Zenata");
  const [trkDestHub, setTrkDestHub] = useState<string>("Marrakech");
  const [trkCorridor, setTrkCorridor] = useState("A7");
  const [trkMaxPallets, setTrkMaxPallets] = useState("33");
  const [trkLoadedPallets, setTrkLoadedPallets] = useState("26");
  const [trkMaxVolume, setTrkMaxVolume] = useState("90");
  const [trkLoadedVolume, setTrkLoadedVolume] = useState("72.0");
  const [trkMaxWeight, setTrkMaxWeight] = useState("24000");
  const [trkLoadedWeight, setTrkLoadedWeight] = useState("19200");
  const [trkTankCapacity, setTrkTankCapacity] = useState("850");
  const [trkFuelLevelPct, setTrkFuelLevelPct] = useState("78");
  const [trkTargetL100, setTrkTargetL100] = useState("28.5");

  const trkRoutePreview = useMemo(() => {
    return calculateMoroccoRoute(
      trkHub,
      trkDestHub,
      fuelPriceMad,
      parseFloat(trkTargetL100) || 28.5
    );
  }, [trkHub, trkDestHub, fuelPriceMad, trkTargetL100]);

  const handleStartEditTruck = (trk: MapTruck) => {
    setEditingTruckId(trk.id);
    setTrkCode(trk.code);
    setTrkPlate(trk.plate);
    setTrkModel(trk.model);
    setTrkTrailerType(trk.trailerType ?? "Tautliner 13.6m");
    setTrkAxleConfig(trk.axleConfig ?? "4x2 + 3-Axle (40T)");
    setTrkDriverName(trk.driverName[locale]);
    setTrkStatus(trk.status);
    if (trk.originCityKey && MOROCCO_CITY_COORDS[trk.originCityKey]) {
      setTrkHub(trk.originCityKey);
    }
    if (trk.destinationCityKey && MOROCCO_CITY_COORDS[trk.destinationCityKey]) {
      setTrkDestHub(trk.destinationCityKey);
    }
    setTrkCorridor(trk.corridor);
    setTrkMaxPallets(String(trk.maxPallets ?? 33));
    setTrkLoadedPallets(String(trk.loadedPallets ?? 26));
    setTrkMaxVolume(String(trk.maxVolumeM3 ?? 90));
    setTrkLoadedVolume(String(trk.loadedVolumeM3 ?? 72));
    setTrkMaxWeight(String(trk.maxWeightKg ?? 24000));
    setTrkLoadedWeight(String(trk.loadedWeightKg ?? 19200));
    setTrkTankCapacity(String(trk.fuelTankCapacityL ?? 850));
    setTrkFuelLevelPct(String(trk.fuelLevelPct ?? 75));
    setTrkTargetL100(String(trk.targetConsumptionL100km ?? 28.5));
  };

  const handleResetTruckForm = () => {
    setEditingTruckId(null);
    setTrkCode(`Truck ${101 + trucks.length}`);
    setTrkPlate(`${Math.floor(10000 + Math.random() * 89000)}-B-6`);
    setTrkModel("Volvo FH 500 Globetrotter");
    setTrkTrailerType("Tautliner 13.6m");
    setTrkAxleConfig("4x2 + 3-Axle (40T)");
    setTrkDriverName("Tariq El Mansouri");
    setTrkStatus("moving");
    setTrkHub("Casablanca Zenata");
    setTrkDestHub("Marrakech");
    setTrkCorridor("A7");
    setTrkMaxPallets("33");
    setTrkLoadedPallets("26");
    setTrkMaxVolume("90");
    setTrkLoadedVolume("72.0");
    setTrkMaxWeight("24000");
    setTrkLoadedWeight("19200");
    setTrkTankCapacity("850");
    setTrkFuelLevelPct("78");
    setTrkTargetL100("28.5");
  };

  const handleSubmitTruck = (e: React.FormEvent) => {
    e.preventDefault();
    const hubInfo =
      MOROCCO_CITY_COORDS[trkHub] || MOROCCO_CITY_COORDS["Casablanca Zenata"];
    const destInfo =
      MOROCCO_CITY_COORDS[trkDestHub] || MOROCCO_CITY_COORDS["Marrakech"];

    const maxPal = Math.max(1, parseInt(trkMaxPallets, 10) || 33);
    const loadedPal = Math.min(
      maxPal,
      Math.max(0, parseInt(trkLoadedPallets, 10) || 0)
    );
    const maxVol = Math.max(10, parseFloat(trkMaxVolume) || 90);
    const loadedVol = Math.min(
      maxVol,
      Math.max(0, parseFloat(trkLoadedVolume) || 0)
    );
    const maxW = Math.max(1000, parseInt(trkMaxWeight, 10) || 24000);
    const loadedW = Math.min(
      maxW,
      Math.max(0, parseInt(trkLoadedWeight, 10) || 0)
    );

    const volRatio = (loadedVol / maxVol) * 100;
    const weightRatio = (loadedW / maxW) * 100;
    const palRatio = (loadedPal / maxPal) * 100;
    const cargoPct = Math.min(
      100,
      Math.max(0, Math.round(Math.max(volRatio, weightRatio, palRatio)))
    );

    const tankCap = Math.max(150, parseInt(trkTankCapacity, 10) || 850);
    const fuelLvl = Math.min(
      100,
      Math.max(5, parseInt(trkFuelLevelPct, 10) || 75)
    );
    const targetCons = Math.max(14, parseFloat(trkTargetL100) || 28.5);

    const isIdling = trkStatus === "idling";
    const wastedLiters = isIdling ? 3.5 : 0.4;

    if (editingTruckId) {
      const existing = trucks.find((x) => x.id === editingTruckId);
      if (existing) {
        onUpdateTruck({
          ...existing,
          code: trkCode.trim() || existing.code,
          plate: trkPlate.trim() || existing.plate,
          model: trkModel.trim() || existing.model,
          trailerType: trkTrailerType,
          axleConfig: trkAxleConfig,
          driverName: {
            en: trkDriverName,
            fr: trkDriverName,
            ar: trkDriverName,
          },
          status: trkStatus,
          originCityKey: trkHub,
          destinationCityKey: trkDestHub,
          origin: hubInfo.label,
          destination: destInfo.label,
          corridor: trkCorridor.trim() || trkRoutePreview.corridor,
          currentLocation: hubInfo.label,
          lat: hubInfo.lat,
          lng: hubInfo.lng,
          speedKmh: isIdling ? 0 : 82,
          idleMinutes: isIdling ? 14 : 0,
          wastedFuelLiters: wastedLiters,
          wastedFuelMad: Math.round(wastedLiters * fuelPriceMad * 100) / 100,
          cargoUtilizationPct: cargoPct,
          maxPallets: maxPal,
          loadedPallets: loadedPal,
          maxVolumeM3: maxVol,
          loadedVolumeM3: loadedVol,
          maxWeightKg: maxW,
          loadedWeightKg: loadedW,
          fuelTankCapacityL: tankCap,
          fuelLevelPct: fuelLvl,
          targetConsumptionL100km: targetCons,
          routeDistanceKm: trkRoutePreview.distanceKm,
          remainingDistanceKm: trkRoutePreview.distanceKm,
          temperatureC:
            trkTrailerType === "Reefer (Frigo ATP)" ? 3.5 : undefined,
        });
        notifySaved(`✓ Truck ${trkCode} updated and saved to Supabase.`);
      }
    } else {
      const newTruck: MapTruck = {
        id: `trk-custom-${Date.now()}`,
        code: trkCode.trim() || "Truck 101",
        plate: trkPlate.trim() || "94820-A-1",
        model: trkModel.trim() || "Volvo FH 500",
        trailerType: trkTrailerType,
        axleConfig: trkAxleConfig,
        driverName: {
          en: trkDriverName.trim() || "Tariq El Mansouri",
          fr: trkDriverName.trim() || "Tariq El Mansouri",
          ar: trkDriverName.trim() || "طارق المنصوري",
        },
        status: trkStatus,
        originCityKey: trkHub,
        destinationCityKey: trkDestHub,
        origin: hubInfo.label,
        destination: destInfo.label,
        currentLocation: hubInfo.label,
        corridor: trkCorridor.trim() || trkRoutePreview.corridor,
        lat: hubInfo.lat,
        lng: hubInfo.lng,
        speedKmh: isIdling ? 0 : 84,
        idleMinutes: isIdling ? 12 : 0,
        fuelRateLph: isIdling ? 3.5 : 24.6,
        wastedFuelLiters: wastedLiters,
        wastedFuelMad: Math.round(wastedLiters * fuelPriceMad * 100) / 100,
        cargoUtilizationPct: cargoPct,
        maxPallets: maxPal,
        loadedPallets: loadedPal,
        maxVolumeM3: maxVol,
        loadedVolumeM3: loadedVol,
        maxWeightKg: maxW,
        loadedWeightKg: loadedW,
        fuelTankCapacityL: tankCap,
        fuelLevelPct: fuelLvl,
        targetConsumptionL100km: targetCons,
        routeDistanceKm: trkRoutePreview.distanceKm,
        remainingDistanceKm: trkRoutePreview.distanceKm,
        temperatureC: trkTrailerType === "Reefer (Frigo ATP)" ? 3.5 : undefined,
      };
      onAddTruck(newTruck);
      notifySaved(`✓ Truck ${newTruck.code} added and saved to Supabase.`);
    }
    handleResetTruckForm();
  };

  // --- 4. Drivers Directory CRUD State ---
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [drvName, setDrvName] = useState("Amine Lahlou");
  const [drvCode, setDrvCode] = useState("DRV-101");
  const [drvTruckCode, setDrvTruckCode] = useState(
    trucks[0]?.code || "Truck 101"
  );
  const [drvCorridor, setDrvCorridor] = useState("A7");
  const [drvEfficiency, setDrvEfficiency] = useState("25.8");
  const [drvIdleMins, setDrvIdleMins] = useState("90");
  const [drvIncidents, setDrvIncidents] = useState("0");
  const [drvEcoScore, setDrvEcoScore] = useState("91");

  const handleStartEditDriver = (drv: DriverEcoRecord) => {
    setEditingDriverId(drv.id);
    setDrvName(drv.name[locale]);
    setDrvCode(drv.driverCode);
    setDrvTruckCode(drv.truckCode);
    setDrvCorridor(drv.corridor);
    setDrvEfficiency(String(drv.fuelEfficiencyL100km));
    setDrvIdleMins(String(drv.totalIdleMinutes30d));
    setDrvIncidents(String(drv.safetyIncidents30d));
    setDrvEcoScore(String(drv.ecoScore));
  };

  const handleResetDriverForm = () => {
    setEditingDriverId(null);
    setDrvName("Amine Lahlou");
    setDrvCode(`DRV-${101 + drivers.length}`);
    setDrvEfficiency("25.8");
    setDrvIdleMins("90");
    setDrvIncidents("0");
    setDrvEcoScore("91");
  };

  const handleSubmitDriver = (e: React.FormEvent) => {
    e.preventDefault();
    const eff = Math.max(15, parseFloat(drvEfficiency) || 26.5);
    const idleM = Math.max(0, parseInt(drvIdleMins, 10) || 90);
    const inc = Math.max(0, parseInt(drvIncidents, 10) || 0);
    const score = Math.min(100, Math.max(10, parseInt(drvEcoScore, 10) || 85));
    const badge: "green" | "yellow" | "red" =
      score >= 80 ? "green" : score >= 65 ? "yellow" : "red";

    const initials = drvName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "D")
      .join("");

    const matchedTruck = trucks.find((x) => x.code === drvTruckCode);

    if (editingDriverId) {
      const existing = drivers.find((d) => d.id === editingDriverId);
      if (existing) {
        onUpdateDriver({
          ...existing,
          name: {
            en: drvName,
            fr: drvName,
            ar: drvName,
          },
          avatarInitials: initials || existing.avatarInitials,
          driverCode: drvCode.trim() || existing.driverCode,
          truckCode: drvTruckCode,
          truckModel: matchedTruck?.model || existing.truckModel,
          corridor: drvCorridor,
          fuelEfficiencyL100km: Math.round(eff * 10) / 10,
          totalIdleMinutes30d: idleM,
          idleWastedMad30d: Math.round((idleM / 60) * 3.4 * fuelPriceMad),
          safetyIncidents30d: inc,
          harshBrakingCount: Math.ceil(inc / 2),
          overspeedCount: Math.floor(inc / 2),
          ecoScore: score,
          badge,
        });
        notifySaved(`✓ Driver ${drvName} updated and saved to Supabase.`);
      }
    } else {
      const newDriver: DriverEcoRecord = {
        id: `drv-custom-${Date.now()}`,
        rank: drivers.length + 1,
        driverCode: drvCode.trim() || `DRV-${101 + drivers.length}`,
        name: {
          en: drvName.trim() || "Amine Lahlou",
          fr: drvName.trim() || "Amine Lahlou",
          ar: drvName.trim() || "أمين لحلو",
        },
        avatarInitials: initials || "AL",
        truckCode: drvTruckCode,
        truckModel: matchedTruck?.model || "Volvo FH 500",
        corridor: drvCorridor,
        routeDescription: {
          en: `${drvCorridor} National Corridor`,
          fr: `Corridor National ${drvCorridor}`,
          ar: `المحور الوطني ${drvCorridor}`,
        },
        fuelEfficiencyL100km: Math.round(eff * 10) / 10,
        targetEfficiencyL100km: 29.5,
        totalIdleMinutes30d: idleM,
        idleWastedMad30d: Math.round((idleM / 60) * 3.4 * fuelPriceMad),
        safetyIncidents30d: inc,
        harshBrakingCount: Math.ceil(inc / 2),
        overspeedCount: Math.floor(inc / 2),
        kmDriven30d: 9650,
        ecoScore: score,
        badge,
      };
      onAddDriver(newDriver);
      notifySaved(`✓ Driver ${newDriver.name.en} added and saved to Supabase.`);
    }
    handleResetDriverForm();
  };

  // --- 5. Routes & LTL Shipments Manual CRUD State ---
  const [editingShipmentId, setEditingShipmentId] = useState<string | null>(
    null
  );
  const [shpCode, setShpCode] = useState("SHP-501");
  const [shpOriginKey, setShpOriginKey] = useState("Casablanca Zenata");
  const [shpDestKey, setShpDestKey] = useState("Marrakech");
  const [shpPallets, setShpPallets] = useState("6");
  const [shpVolume, setShpVolume] = useState("17.1");
  const [shpWeight, setShpWeight] = useState("4680");
  const [shpRevenue, setShpRevenue] = useState("5800");
  const [shpCargo, setShpCargo] = useState("Commercial Palletized Freight");
  const [shpBackhaul, setShpBackhaul] = useState(true);
  const [shpRecTruckCode, setShpRecTruckCode] = useState(
    trucks[0]?.code || "Truck 101"
  );

  const shpRouteCalc = useMemo(
    () => calculateMoroccoRoute(shpOriginKey, shpDestKey, fuelPriceMad, 28.5),
    [shpOriginKey, shpDestKey, fuelPriceMad]
  );

  const handleStartEditShipment = (s: LtlShipment) => {
    setEditingShipmentId(s.id);
    setShpCode(s.code);
    setShpPallets(String(s.pallets));
    setShpVolume(String(s.volumeM3));
    setShpWeight(String(s.weightKg));
    setShpRevenue(String(s.revenueMad));
    setShpCargo(s.cargoType[locale]);
    setShpBackhaul(s.isBackhaulMatch);
    setShpRecTruckCode(s.recommendedTruckCode);
  };

  const handleResetShipmentForm = () => {
    setEditingShipmentId(null);
    setShpCode(`SHP-${501 + shipments.length}`);
    setShpPallets("6");
    setShpVolume("17.1");
    setShpWeight("4680");
    setShpRevenue("5800");
    setShpCargo("Commercial Palletized Freight");
    setShpBackhaul(true);
  };

  const handleSubmitShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddShipment || !onUpdateShipment) return;
    const origHub =
      MOROCCO_CITY_COORDS[shpOriginKey] ||
      MOROCCO_CITY_COORDS["Casablanca Zenata"];
    const destHub =
      MOROCCO_CITY_COORDS[shpDestKey] || MOROCCO_CITY_COORDS["Marrakech"];
    const pal = Math.max(1, parseInt(shpPallets, 10) || 4);
    const vol = Math.max(1, parseFloat(shpVolume) || pal * 2.85);
    const wt = Math.max(100, parseInt(shpWeight, 10) || pal * 780);
    const rev = Math.max(
      200,
      parseInt(shpRevenue, 10) || shpRouteCalc.distanceKm * 15
    );

    if (editingShipmentId) {
      const existing = shipments.find((x) => x.id === editingShipmentId);
      if (existing) {
        onUpdateShipment({
          ...existing,
          code: shpCode.trim() || existing.code,
          origin: origHub.label,
          destination: destHub.label,
          corridor: shpRouteCalc.corridor,
          pallets: pal,
          volumeM3: Math.round(vol * 10) / 10,
          weightKg: wt,
          revenueMad: rev,
          cargoType: { en: shpCargo, fr: shpCargo, ar: shpCargo },
          isBackhaulMatch: shpBackhaul,
          recommendedTruckCode: shpRecTruckCode,
          emptyKmSaved: shpRouteCalc.distanceKm,
          fuelLitersSaved: shpRouteCalc.estimatedFuelLiters,
          fuelMadSaved: shpRouteCalc.estimatedFuelCostMad,
        });
        notifySaved(`✓ Route / Shipment ${shpCode} updated and saved to Supabase.`);
      }
    } else {
      const newShp: LtlShipment = {
        id: `shp-custom-${Date.now()}`,
        code: shpCode.trim() || `SHP-${501 + shipments.length}`,
        origin: origHub.label,
        destination: destHub.label,
        corridor: shpRouteCalc.corridor,
        pallets: pal,
        volumeM3: Math.round(vol * 10) / 10,
        weightKg: wt,
        revenueMad: rev,
        cargoType: { en: shpCargo, fr: shpCargo, ar: shpCargo },
        isBackhaulMatch: shpBackhaul,
        recommendedTruckId: "ltl-trk-1",
        recommendedTruckCode: shpRecTruckCode,
        emptyKmSaved: shpRouteCalc.distanceKm,
        fuelLitersSaved: shpRouteCalc.estimatedFuelLiters,
        fuelMadSaved: shpRouteCalc.estimatedFuelCostMad,
        assignedTruckId: null,
      };
      onAddShipment(newShp);
      notifySaved(`✓ Route / Shipment ${newShp.code} added and saved to Supabase.`);
    }
    handleResetShipmentForm();
  };

  return (
    <div className="space-y-6">
      {/* Universal Delete Confirmation Dialog Modal */}
      <ConfirmDeleteModal
        request={deleteRequest}
        onCancel={() => setDeleteRequest(null)}
      />

      {/* Explicit Save Confirmation Toast Banner */}
      {savedBannerMsg && (
        <div className="rounded-xl bg-emerald-600 text-white px-4 py-3 text-xs sm:text-sm font-bold shadow-md flex items-center justify-between">
          <span>{savedBannerMsg}</span>
          <button
            type="button"
            onClick={() => setSavedBannerMsg(null)}
            className="text-white/80 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & 5-Tab Navigation Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
            {t.manager.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Add or edit Trucks, Drivers, Routes, and Fuel manually, or bulk-import from an Excel (`.xlsx` / `.csv`) workbook.
          </p>
        </div>

        <div className="inline-flex flex-wrap rounded-xl bg-slate-100 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-800 gap-1">
          <button
            type="button"
            onClick={() => setSubTab("trucks")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              subTab === "trucks"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>
              {t.manager.tabTrucks} ({trucks.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("drivers")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              subTab === "drivers"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>
              {t.manager.tabDrivers} ({drivers.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("routes")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              subTab === "routes"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            }`}
          >
            <Route className="h-3.5 w-3.5" />
            <span>Routes & Shipments ({shipments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("fuel")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              subTab === "fuel"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            }`}
          >
            <Fuel className="h-3.5 w-3.5" />
            <span>
              {t.manager.tabFuel} ({fuelPurchases.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("excel")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              subTab === "excel"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Excel (.xlsx) Import / Export</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SUB-TAB: EXCEL (.XLSX / .CSV) BULK IMPORT, PREVIEW & EXPORT
      ===================================================================== */}
      {subTab === "excel" && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-6 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  <span>
                    Excel (`.xlsx` / `.csv`) Fleet, Drivers & Routes Importer
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Download the ready-to-fill 4-sheet Excel template (`Trucks`, `Drivers`, `Routes_Shipments`, `Fuel_Purchases`), fill in the client&apos;s real data, and upload it below.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => downloadFleetExcelTemplate()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-3.5 py-2 text-xs font-bold shadow-sm transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Excel Template (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    exportInstanceFleetToExcel(instanceSlug, {
                      trucks,
                      ltlTrucks: [],
                      shipments,
                      drivers,
                      fuelPurchases,
                      alerts: [],
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Export Current Data to Excel (.xlsx)</span>
                </button>

                {onClearAllInstanceFleet && (
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteRequest({
                        title: "Clear All Fleet Data in This Instance?",
                        itemName: `${trucks.length} Trucks, ${drivers.length} Drivers, ${shipments.length} Routes`,
                        description:
                          "This will remove all trucks, drivers, routes, and fuel logs from this instance so you can start 100% blank or import a fresh Excel workbook.",
                        confirmLabel: "Yes, Clear All Data to 0",
                        onConfirm: () => {
                          onClearAllInstanceFleet();
                          notifySaved(
                            "✓ Instance cleared to 0 records and saved to Supabase."
                          );
                        },
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 px-3 py-2 text-xs font-bold text-red-700 dark:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear Instance Data (0 Records)</span>
                  </button>
                )}
              </div>
            </div>

            {excelError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3 text-xs font-semibold text-red-700 dark:text-red-300">
                {excelError}
              </div>
            )}

            {/* File Dropzone */}
            <label className="cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-blue-600 dark:hover:border-blue-500 bg-slate-50/70 dark:bg-zinc-950/60 p-8 text-center transition-colors">
              <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2.5" />
              <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Click to Upload Excel Workbook (`.xlsx`, `.xls`) or `.csv`
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Supports multi-sheet workbooks (`Trucks`, `Drivers`, `Routes_Shipments`, `Fuel_Purchases`) or single-sheet files.
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelFileUpload}
                className="hidden"
              />
            </label>

            {/* Pre-Import Preview & Confirmation Panel */}
            {parsedExcel && (
              <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-600 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200 dark:border-emerald-800/70 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      Excel Preview Ready: {parsedExcel.fileName}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5">
                      Parsed{" "}
                      <strong>{parsedExcel.trucks.length} Trucks</strong>,{" "}
                      <strong>{parsedExcel.drivers.length} Drivers</strong>,{" "}
                      <strong>
                        {parsedExcel.shipments.length} Routes/Shipments
                      </strong>
                      , and{" "}
                      <strong>
                        {parsedExcel.fuelPurchases.length} Fuel Purchases
                      </strong>
                      .
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <select
                      value={excelImportMode}
                      onChange={(e) =>
                        setExcelImportMode(
                          e.target.value as "merge" | "replace"
                        )
                      }
                      className="rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 px-3 py-2 font-semibold"
                    >
                      <option value="merge">
                        Merge / Update with Existing Records
                      </option>
                      <option value="replace">
                        Replace All Existing Records with Excel File
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={handleConfirmExcelImport}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 font-bold shadow-sm"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Confirm & Save Import to Supabase</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setParsedExcel(null)}
                      className="rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 px-3 py-2 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Preview Sample Rows */}
                {parsedExcel.trucks.length > 0 && (
                  <div className="text-xs">
                    <span className="font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">
                      Parsed Trucks ({parsedExcel.trucks.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {parsedExcel.trucks.map((trk) => (
                        <span
                          key={trk.id}
                          className="rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2.5 py-1 font-mono"
                        >
                          <strong>{trk.code}</strong> ({trk.plate}) •{" "}
                          {trk.origin.en} → {trk.destination.en} (
                          {trk.routeDistanceKm} km) • {trk.loadedPallets}/
                          {trk.maxPallets} Pal.
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsedExcel.drivers.length > 0 && (
                  <div className="text-xs">
                    <span className="font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">
                      Parsed Drivers ({parsedExcel.drivers.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {parsedExcel.drivers.map((drv) => (
                        <span
                          key={drv.id}
                          className="rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2.5 py-1 font-mono"
                        >
                          <strong>{drv.driverCode}</strong>: {drv.name.en} (
                          {drv.truckCode}) • {drv.fuelEfficiencyL100km} L/100km •
                          Eco {drv.ecoScore}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsedExcel.shipments.length > 0 && (
                  <div className="text-xs">
                    <span className="font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">
                      Parsed Routes & Shipments ({parsedExcel.shipments.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {parsedExcel.shipments.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2.5 py-1 font-mono"
                        >
                          <strong>{s.code}</strong>: {s.origin.en} →{" "}
                          {s.destination.en} ({s.pallets} Pal •{" "}
                          {s.emptyKmSaved} km • {s.revenueMad} MAD)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 1: TRUCKS REGISTRY (MANUAL ADD, EDIT, DELETE WITH CONFIRMATION)
      ===================================================================== */}
      {subTab === "trucks" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Add / Edit Truck Form */}
          <form
            onSubmit={handleSubmitTruck}
            className="xl:col-span-5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4 h-fit"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {editingTruckId
                  ? t.manager.editTruckTitle
                  : t.manager.addTruckTitle}
              </h3>
              {editingTruckId && (
                <button
                  type="button"
                  onClick={handleResetTruckForm}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  {t.manager.cancelEditBtn}
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.truckCodeLabel}
                </label>
                <input
                  type="text"
                  value={trkCode}
                  onChange={(e) => setTrkCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.plateNumberLabel}
                </label>
                <input
                  type="text"
                  value={trkPlate}
                  onChange={(e) => setTrkPlate(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.statusLabel}
                </label>
                <select
                  value={trkStatus}
                  onChange={(e) => setTrkStatus(e.target.value as any)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs"
                >
                  <option value="moving">Moving (En route)</option>
                  <option value="idling">Idling (Ralenti)</option>
                  <option value="alert">Safety Alert</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.modelLabel}
                </label>
                <input
                  type="text"
                  value={trkModel}
                  onChange={(e) => setTrkModel(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.driverNameLabel}
                </label>
                <input
                  type="text"
                  value={trkDriverName}
                  onChange={(e) => setTrkDriverName(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Trailer Type
                </label>
                <select
                  value={trkTrailerType}
                  onChange={(e) =>
                    setTrkTrailerType(e.target.value as TrailerType)
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs"
                >
                  <option value="Tautliner 13.6m">
                    Tautliner 13.6m (Curtainsider)
                  </option>
                  <option value="Reefer (Frigo ATP)">
                    Reefer (Frigo ATP Cold-Chain)
                  </option>
                  <option value="Mega Box Van">Mega Box Van (100 m³)</option>
                  <option value="Container Chassis">
                    Container Chassis (40ft HC)
                  </option>
                  <option value="Rigid 19T">Rigid 19T (Porteur)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Axle & GVW Tonnage
                </label>
                <select
                  value={trkAxleConfig}
                  onChange={(e) =>
                    setTrkAxleConfig(e.target.value as AxleConfig)
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs"
                >
                  <option value="4x2 + 3-Axle (40T)">
                    4x2 + 3-Axle Semi (40T)
                  </option>
                  <option value="6x4 Heavy (44T)">
                    6x4 Heavy Tractor (44T)
                  </option>
                  <option value="4x2 Rigid (19T)">
                    4x2 Rigid Porteur (19T)
                  </option>
                </select>
              </div>
            </div>

            {/* Capacity, Pallets, Volume & Weight */}
            <div className="rounded-lg bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 p-3 space-y-2.5">
              <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Boxes className="h-3.5 w-3.5 text-blue-600" />
                Truck Capacity: Pallets (EPAL), Volume (m³) & Weight (kg)
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">
                    Pallets (Loaded / Max)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="66"
                      value={trkLoadedPallets}
                      onChange={(e) => setTrkLoadedPallets(e.target.value)}
                      className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono"
                    />
                    <span>/</span>
                    <input
                      type="number"
                      min="1"
                      max="66"
                      value={trkMaxPallets}
                      onChange={(e) => setTrkMaxPallets(e.target.value)}
                      className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">
                    Volume m³ (Used / Max)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="140"
                      value={trkLoadedVolume}
                      onChange={(e) => setTrkLoadedVolume(e.target.value)}
                      className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono"
                    />
                    <span>/</span>
                    <input
                      type="number"
                      step="1"
                      min="10"
                      max="140"
                      value={trkMaxVolume}
                      onChange={(e) => setTrkMaxVolume(e.target.value)}
                      className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">
                    Weight kg (Used / Max)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="100"
                      min="0"
                      max="44000"
                      value={trkLoadedWeight}
                      onChange={(e) => setTrkLoadedWeight(e.target.value)}
                      className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-1.5 py-1 text-[11px] font-mono"
                    />
                    <span>/</span>
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      max="44000"
                      value={trkMaxWeight}
                      onChange={(e) => setTrkMaxWeight(e.target.value)}
                      className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-1.5 py-1 text-[11px] font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">
                    Fuel Tank Cap. (L)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={trkTankCapacity}
                    onChange={(e) => setTrkTankCapacity(e.target.value)}
                    className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">
                    Fuel Level (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={trkFuelLevelPct}
                    onChange={(e) => setTrkFuelLevelPct(e.target.value)}
                    className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">
                    Target L/100km
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={trkTargetL100}
                    onChange={(e) => setTrkTargetL100(e.target.value)}
                    className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Origin, Destination & Google Maps Distance */}
            <div className="rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/50 p-3 space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">
                    Origin Hub
                  </label>
                  <select
                    value={trkHub}
                    onChange={(e) => {
                      setTrkHub(e.target.value);
                      const r = calculateMoroccoRoute(
                        e.target.value,
                        trkDestHub,
                        fuelPriceMad
                      );
                      setTrkCorridor(r.corridor);
                    }}
                    className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs"
                  >
                    {Object.keys(MOROCCO_CITY_COORDS).map((cityKey) => (
                      <option key={cityKey} value={cityKey}>
                        {cityKey}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">
                    Destination Hub
                  </label>
                  <select
                    value={trkDestHub}
                    onChange={(e) => {
                      setTrkDestHub(e.target.value);
                      const r = calculateMoroccoRoute(
                        trkHub,
                        e.target.value,
                        fuelPriceMad
                      );
                      setTrkCorridor(r.corridor);
                    }}
                    className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs"
                  >
                    {Object.keys(MOROCCO_CITY_COORDS).map((cityKey) => (
                      <option key={cityKey} value={cityKey}>
                        {cityKey}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">
                    {t.manager.corridorLabel}
                  </label>
                  <input
                    type="text"
                    value={trkCorridor}
                    onChange={(e) => setTrkCorridor(e.target.value)}
                    className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-slate-700 dark:text-zinc-300">
                <span>
                  Google Maps Distance:{" "}
                  <strong>{trkRoutePreview.distanceKm} km</strong> (
                  {trkRoutePreview.durationFormatted})
                </span>
                <span>
                  Est. Fuel:{" "}
                  <strong>{trkRoutePreview.estimatedFuelLiters} L</strong>
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold shadow-sm transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              <span>
                {editingTruckId
                  ? "Save Truck Changes to Supabase"
                  : "Save New Truck to Supabase"}
              </span>
            </button>
          </form>

          {/* Trucks Registry Table */}
          <div className="xl:col-span-7 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {t.manager.trucksRegistryTitle} ({trucks.length})
              </h3>
              <button
                type="button"
                onClick={() => setSubTab("excel")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Import Trucks from Excel (.xlsx) →</span>
              </button>
            </div>

            {trucks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 p-10 text-center space-y-2">
                <Truck className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                  No Trucks Registered in This Instance Yet (0 Records)
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  This is a clean real instance with no random demo data. Add a truck manually using the form on the left, or click &ldquo;Excel (.xlsx) Import / Export&rdquo; to upload your fleet workbook.
                </p>
              </div>
            ) : (
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold uppercase text-slate-500">
                    <th className="py-2.5 px-2.5 text-start">Truck & Plate</th>
                    <th className="py-2.5 px-2.5 text-start">
                      Trailer & Driver
                    </th>
                    <th className="py-2.5 px-2.5 text-start">
                      Route & Distance
                    </th>
                    <th className="py-2.5 px-2.5 text-start">
                      Pallets / Vol / Weight
                    </th>
                    <th className="py-2.5 px-2.5 text-start">Tank & Status</th>
                    <th className="py-2.5 px-2.5 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800/70">
                  {trucks.map((trk) => {
                    const gmapsUrl = getGoogleMapsDirectionsUrl(
                      trk.originCityKey || trk.origin.en,
                      trk.destinationCityKey || trk.destination.en
                    );
                    return (
                      <tr
                        key={trk.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/35"
                      >
                        <td className="py-3 px-2.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 block">
                            {trk.code}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 block">
                            {trk.plate}
                          </span>
                        </td>
                        <td className="py-3 px-2.5">
                          <span className="font-medium text-slate-800 dark:text-zinc-200 block">
                            {trk.model}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {trk.trailerType ?? "Tautliner 13.6m"} •{" "}
                            {trk.driverName[locale]}
                          </span>
                        </td>
                        <td className="py-3 px-2.5">
                          <span className="font-medium text-slate-800 dark:text-zinc-200 block">
                            {trk.origin[locale]} → {trk.destination[locale]}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-slate-500">
                            <span>
                              {trk.corridor} •{" "}
                              <strong>{trk.routeDistanceKm ?? 240} km</strong>
                            </span>
                            <a
                              href={gmapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>Maps</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-2.5 font-mono text-[11px]">
                          <div className="font-semibold">
                            {trk.loadedPallets ?? 24}/{trk.maxPallets ?? 33}{" "}
                            EPAL ({trk.cargoUtilizationPct}%)
                          </div>
                          <div className="text-slate-500">
                            {trk.loadedVolumeM3 ?? 68}/{trk.maxVolumeM3 ?? 90}{" "}
                            m³ •{" "}
                            {((trk.loadedWeightKg ?? 18000) / 1000).toFixed(1)}/
                            {((trk.maxWeightKg ?? 24000) / 1000).toFixed(1)} T
                          </div>
                        </td>
                        <td className="py-3 px-2.5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase border ${
                              trk.status === "alert"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : trk.status === "idling"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {trk.status}
                          </span>
                        </td>
                        <td className="py-3 px-2.5 text-end">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditTruck(trk)}
                              className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 px-2 py-1 text-[11px] font-medium"
                            >
                              <Pencil className="h-3 w-3" />
                              {t.manager.editBtn}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteRequest({
                                  title: "Delete Truck from Instance?",
                                  itemName: `${trk.code} (${trk.plate} • ${trk.model})`,
                                  description: `Are you sure you want to permanently delete ${trk.code} assigned to ${trk.driverName.en}? This change will be saved to Supabase immediately.`,
                                  onConfirm: () => {
                                    onDeleteTruck(trk.id);
                                    notifySaved(
                                      `✓ Deleted ${trk.code} and saved to Supabase.`
                                    );
                                  },
                                })
                              }
                              className="inline-flex items-center gap-1 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/40 px-2 py-1 text-[11px] font-medium text-red-700 dark:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: DRIVERS DIRECTORY (MANUAL ADD, EDIT, DELETE WITH CONFIRMATION)
      ===================================================================== */}
      {subTab === "drivers" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <form
            onSubmit={handleSubmitDriver}
            className="xl:col-span-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4 h-fit"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                {editingDriverId
                  ? t.manager.editDriverTitle
                  : t.manager.addDriverTitle}
              </h3>
              {editingDriverId && (
                <button
                  type="button"
                  onClick={handleResetDriverForm}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  {t.manager.cancelEditBtn}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium mb-1">
                  {t.manager.driverNameLabel}
                </label>
                <input
                  type="text"
                  value={drvName}
                  onChange={(e) => setDrvName(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  {t.manager.driverCodeLabel}
                </label>
                <input
                  type="text"
                  value={drvCode}
                  onChange={(e) => setDrvCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium mb-1">
                  {t.manager.truckCodeLabel}
                </label>
                <input
                  type="text"
                  value={drvTruckCode}
                  onChange={(e) => setDrvTruckCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  {t.manager.corridorLabel}
                </label>
                <input
                  type="text"
                  value={drvCorridor}
                  onChange={(e) => setDrvCorridor(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium mb-1">
                  {t.manager.efficiencyLabel}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={drvEfficiency}
                  onChange={(e) => setDrvEfficiency(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  {t.manager.idleMinsLabel}
                </label>
                <input
                  type="number"
                  value={drvIdleMins}
                  onChange={(e) => setDrvIdleMins(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium mb-1">
                  {t.manager.incidentsLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  value={drvIncidents}
                  onChange={(e) => setDrvIncidents(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  {t.manager.ecoScoreLabel}
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={drvEcoScore}
                  onChange={(e) => setDrvEcoScore(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              <span>
                {editingDriverId
                  ? "Save Driver Changes to Supabase"
                  : "Save New Driver to Supabase"}
              </span>
            </button>
          </form>

          <div className="xl:col-span-8 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm overflow-x-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-4">
              {t.manager.driversDirectoryTitle} ({drivers.length})
            </h3>

            {drivers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 p-10 text-center space-y-2">
                <Users className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                  No Drivers Registered Yet (0 Records)
                </p>
                <p className="text-xs text-slate-500">
                  Add a driver manually on the left or upload an Excel (`.xlsx`) workbook.
                </p>
              </div>
            ) : (
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold uppercase text-slate-500">
                    <th className="py-2.5 px-3 text-start">Driver</th>
                    <th className="py-2.5 px-3 text-start">Truck & Corridor</th>
                    <th className="py-2.5 px-3 text-start">L/100km</th>
                    <th className="py-2.5 px-3 text-start">Idle (30D)</th>
                    <th className="py-2.5 px-3 text-start">Eco-Score</th>
                    <th className="py-2.5 px-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800/70">
                  {drivers.map((drv) => (
                    <tr
                      key={drv.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/35"
                    >
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-zinc-100 block">
                          {drv.name[locale]}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {drv.driverCode}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {drv.truckCode} • {drv.corridor}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        {drv.fuelEfficiencyL100km} L/100km
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {drv.totalIdleMinutes30d} min
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        {drv.ecoScore}/100 ({drv.badge.toUpperCase()})
                      </td>
                      <td className="py-3 px-3 text-end">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditDriver(drv)}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 px-2 py-1 text-[11px] font-medium"
                          >
                            <Pencil className="h-3 w-3" />
                            {t.manager.editBtn}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteRequest({
                                title: "Delete Driver from Instance?",
                                itemName: `${drv.name.en} (${drv.driverCode})`,
                                description: `Are you sure you want to permanently delete driver ${drv.name.en} (${drv.driverCode})? This change will be saved to Supabase immediately.`,
                                onConfirm: () => {
                                  onDeleteDriver(drv.id);
                                  notifySaved(
                                    `✓ Deleted driver ${drv.name.en} and saved to Supabase.`
                                  );
                                },
                              })
                            }
                            className="inline-flex items-center gap-1 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/40 px-2 py-1 text-[11px] font-medium text-red-700 dark:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: ROUTES & LTL SHIPMENTS (MANUAL ADD, EDIT, DELETE WITH CONFIRMATION)
      ===================================================================== */}
      {subTab === "routes" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <form
            onSubmit={handleSubmitShipment}
            className="xl:col-span-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4 h-fit text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Route className="h-4 w-4 text-blue-600" />
                <span>
                  {editingShipmentId
                    ? "Edit Route / LTL Shipment"
                    : "Add New Route / LTL Shipment"}
                </span>
              </h3>
              {editingShipmentId && (
                <button
                  type="button"
                  onClick={handleResetShipmentForm}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">
                  Route / Shipment Code
                </label>
                <input
                  type="text"
                  value={shpCode}
                  onChange={(e) => setShpCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Recommended Truck
                </label>
                <input
                  type="text"
                  value={shpRecTruckCode}
                  onChange={(e) => setShpRecTruckCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">Origin Hub</label>
                <select
                  value={shpOriginKey}
                  onChange={(e) => setShpOriginKey(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5"
                >
                  {Object.keys(MOROCCO_CITY_COORDS).map((ck) => (
                    <option key={ck} value={ck}>
                      {ck}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Destination Hub
                </label>
                <select
                  value={shpDestKey}
                  onChange={(e) => setShpDestKey(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5"
                >
                  {Object.keys(MOROCCO_CITY_COORDS).map((ck) => (
                    <option key={ck} value={ck}>
                      {ck}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 p-2.5 font-mono text-[11px] flex items-center justify-between">
              <span>
                Google Maps: <strong>{shpRouteCalc.distanceKm} km</strong> (
                {shpRouteCalc.corridor})
              </span>
              <span>
                Est. Fuel Saved:{" "}
                <strong>{shpRouteCalc.estimatedFuelCostMad} MAD</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block font-medium mb-1">Pallets (EPAL)</label>
                <input
                  type="number"
                  min="1"
                  max="34"
                  value={shpPallets}
                  onChange={(e) => {
                    setShpPallets(e.target.value);
                    const p = parseInt(e.target.value, 10) || 4;
                    setShpVolume(String(Math.round(p * 2.85 * 10) / 10));
                    setShpWeight(String(p * 780));
                  }}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Volume (m³)</label>
                <input
                  type="number"
                  step="0.1"
                  value={shpVolume}
                  onChange={(e) => setShpVolume(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="100"
                  value={shpWeight}
                  onChange={(e) => setShpWeight(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">
                  Freight Revenue (MAD)
                </label>
                <input
                  type="number"
                  step="100"
                  value={shpRevenue}
                  onChange={(e) => setShpRevenue(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Cargo Description
                </label>
                <input
                  type="text"
                  value={shpCargo}
                  onChange={(e) => setShpCargo(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={shpBackhaul}
                onChange={(e) => setShpBackhaul(e.target.checked)}
              />
              <span>Highlight as Backhaul Match (Prevents Empty Miles)</span>
            </label>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              <span>
                {editingShipmentId
                  ? "Save Route Changes to Supabase"
                  : "Save New Route to Supabase"}
              </span>
            </button>
          </form>

          <div className="xl:col-span-8 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm overflow-x-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-4">
              Configured Routes & LTL Shipments ({shipments.length})
            </h3>

            {shipments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 p-10 text-center space-y-2">
                <Route className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                  No Routes or LTL Shipments Configured Yet (0 Records)
                </p>
                <p className="text-xs text-slate-500">
                  Add a route manually on the left or upload an Excel (`.xlsx`) workbook.
                </p>
              </div>
            ) : (
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold uppercase text-slate-500">
                    <th className="py-2.5 px-3 text-start">Code</th>
                    <th className="py-2.5 px-3 text-start">
                      Origin → Destination
                    </th>
                    <th className="py-2.5 px-3 text-start">
                      Pallets / Vol / Weight
                    </th>
                    <th className="py-2.5 px-3 text-start">
                      Distance & Revenue
                    </th>
                    <th className="py-2.5 px-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800/70">
                  {shipments.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/35"
                    >
                      <td className="py-3 px-3 font-mono font-bold">
                        {s.code}
                        <span className="block text-[10px] text-blue-600">
                          {s.corridor}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold block">
                          {s.origin[locale]} → {s.destination[locale]}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {s.cargoType[locale]}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {s.pallets} EPAL • {s.volumeM3} m³ •{" "}
                        {(s.weightKg / 1000).toFixed(1)} T
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                          +{s.revenueMad.toLocaleString()} MAD
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {s.emptyKmSaved} km • Rec: {s.recommendedTruckCode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-end">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditShipment(s)}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 px-2 py-1 text-[11px] font-medium"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          {onDeleteShipment && (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteRequest({
                                  title: "Delete Route / LTL Shipment?",
                                  itemName: `${s.code} (${s.origin.en} → ${s.destination.en})`,
                                  description: `Are you sure you want to permanently delete route ${s.code} (${s.pallets} pallets)? This change will be saved to Supabase immediately.`,
                                  onConfirm: () => {
                                    onDeleteShipment(s.id);
                                    notifySaved(
                                      `✓ Deleted route ${s.code} and saved to Supabase.`
                                    );
                                  },
                                })
                              }
                              className="inline-flex items-center gap-1 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/40 px-2 py-1 text-[11px] font-medium text-red-700 dark:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 4: FUEL TARIFF & PURCHASES CRUD (WITH DELETE CONFIRMATION)
      ===================================================================== */}
      {subTab === "fuel" && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm sm:text-base font-bold">
                    {t.manager.activeTariffTitle}
                  </h3>
                </div>
                <form
                  onSubmit={handleApplyManualTariff}
                  className="mt-4 flex flex-wrap items-end gap-3"
                >
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                      {t.manager.manualTariffInputLabel}
                    </label>
                    <div className="flex items-center rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 px-3 py-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="5"
                        max="50"
                        value={tariffInput}
                        onChange={(e) => setTariffInput(e.target.value)}
                        className="w-24 bg-transparent font-mono text-sm font-bold focus:outline-none"
                      />
                      <span className="text-xs font-mono text-slate-500">
                        MAD/L
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-sm"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Tariff to Supabase</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateFuelPrice(fuelSummary.weightedAvg);
                      notifySaved(
                        `✓ Synced Weighted Average (${fuelSummary.weightedAvg.toFixed(
                          2
                        )} MAD/L) to Supabase.`
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-semibold"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t.manager.syncWeightedAvgBtn} (
                    {fuelSummary.weightedAvg.toFixed(2)} MAD/L)
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <form
              onSubmit={handleSubmitPurchase}
              className="xl:col-span-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4 h-fit text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  {editingPurchaseId
                    ? t.manager.editFuelPurchaseTitle
                    : t.manager.addFuelPurchaseTitle}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    {t.manager.colInvoice}
                  </label>
                  <input
                    type="text"
                    value={fpInvoice}
                    onChange={(e) => setFpInvoice(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    {t.manager.dateLabel}
                  </label>
                  <input
                    type="date"
                    value={fpDate}
                    onChange={(e) => setFpDate(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    {t.manager.truckCodeLabel}
                  </label>
                  <input
                    type="text"
                    value={fpTruckCode}
                    onChange={(e) => setFpTruckCode(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    {t.manager.cityLabel}
                  </label>
                  <select
                    value={fpCity}
                    onChange={(e) => setFpCity(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5"
                  >
                    {Object.keys(MOROCCO_CITY_COORDS).map((cityKey) => (
                      <option key={cityKey} value={cityKey}>
                        {cityKey}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  {t.manager.stationLabel}
                </label>
                <input
                  type="text"
                  value={fpStation}
                  onChange={(e) => setFpStation(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    {t.manager.litersLabel}
                  </label>
                  <input
                    type="number"
                    value={fpLiters}
                    onChange={(e) => setFpLiters(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    {t.manager.unitPriceMadLabel}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={fpUnitPrice}
                    onChange={(e) => setFpUnitPrice(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono font-bold text-blue-600"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold shadow-sm"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Fuel Purchase to Supabase</span>
              </button>
            </form>

            <div className="xl:col-span-8 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm overflow-x-auto">
              <h3 className="text-sm font-bold mb-4">
                {t.manager.purchasesLedgerTitle} ({fuelPurchases.length})
              </h3>

              {fuelPurchases.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 p-10 text-center space-y-2">
                  <Fuel className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold">
                    No Fuel Purchases Logged Yet (0 Records)
                  </p>
                </div>
              ) : (
                <table className="w-full text-start border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold uppercase text-slate-500">
                      <th className="py-2.5 px-3 text-start">Invoice</th>
                      <th className="py-2.5 px-3 text-start">Date</th>
                      <th className="py-2.5 px-3 text-start">Truck</th>
                      <th className="py-2.5 px-3 text-start">Station</th>
                      <th className="py-2.5 px-3 text-start">Liters</th>
                      <th className="py-2.5 px-3 text-start">Unit Price</th>
                      <th className="py-2.5 px-3 text-start">Total MAD</th>
                      <th className="py-2.5 px-3 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800/70">
                    {fuelPurchases.map((p) => {
                      const totalCost =
                        Math.round(p.liters * p.pricePerLiterMad * 100) / 100;
                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/35"
                        >
                          <td className="py-3 px-3 font-mono font-semibold">
                            {p.invoiceNo}
                          </td>
                          <td className="py-3 px-3 font-mono">{p.dateIso}</td>
                          <td className="py-3 px-3 font-mono font-bold">
                            {p.truckCode}
                          </td>
                          <td className="py-3 px-3">
                            {p.stationName} ({p.city})
                          </td>
                          <td className="py-3 px-3 font-mono">{p.liters} L</td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-600">
                            {p.pricePerLiterMad.toFixed(2)} MAD/L
                          </td>
                          <td className="py-3 px-3 font-mono font-bold">
                            {totalCost.toLocaleString()} MAD
                          </td>
                          <td className="py-3 px-3 text-end">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditPurchase(p)}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 px-2 py-1 text-[11px] font-medium"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteRequest({
                                    title: "Delete Fuel Invoice?",
                                    itemName: `${p.invoiceNo} (${p.liters} L @ ${p.stationName})`,
                                    description: `Are you sure you want to permanently delete fuel purchase invoice ${p.invoiceNo}?`,
                                    onConfirm: () => {
                                      onDeleteFuelPurchase(p.id);
                                      notifySaved(
                                        `✓ Deleted fuel invoice ${p.invoiceNo} and saved to Supabase.`
                                      );
                                    },
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/40 px-2 py-1 text-[11px] font-medium text-red-700 dark:text-red-400"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
