"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Fuel,
  Truck,
  Users,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  RefreshCw,
  Receipt,
  Boxes,
  Route,
  ExternalLink,
} from "lucide-react";
import {
  AxleConfig,
  calculateMoroccoRoute,
  DriverEcoRecord,
  FuelPurchaseRecord,
  getGoogleMapsDirectionsUrl,
  Locale,
  MapTruck,
  MOROCCO_CITY_COORDS,
  TrailerType,
} from "@/lib/supabase/database";
import { TranslationDictionary } from "@/lib/i18n/translations";

interface FleetFuelManagerPageProps {
  locale: Locale;
  t: TranslationDictionary;
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
}

export function FleetFuelManagerPage({
  locale,
  t,
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
}: FleetFuelManagerPageProps) {
  const [subTab, setSubTab] = useState<"fuel" | "trucks" | "drivers">("fuel");

  // --- 1. Fuel Tariff & Purchases State ---
  const [tariffInput, setTariffInput] = useState<string>(fuelPriceMad.toFixed(2));
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [fpInvoice, setFpInvoice] = useState("INV-MA-8845");
  const [fpDate, setFpDate] = useState("2026-11-15");
  const [fpTruckCode, setFpTruckCode] = useState(trucks[0]?.code || "Truck 12");
  const [fpStation, setFpStation] = useState("Afriquia Autoroute A3");
  const [fpCity, setFpCity] = useState("Casablanca Zenata");
  const [fpLiters, setFpLiters] = useState("400");
  const [fpUnitPrice, setFpUnitPrice] = useState(fuelPriceMad.toFixed(2));
  const [fpPayment, setFpPayment] = useState<"Fleet Card" | "Depot Bulk" | "Jawaz / Card">(
    "Fleet Card"
  );

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
      onUpdateFuelPrice(Math.round(parsed * 100) / 100);
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
    setFpDate("2026-11-15");
    setFpLiters("400");
    setFpUnitPrice(fuelPriceMad.toFixed(2));
  };

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const litersNum = Math.max(10, parseFloat(fpLiters) || 400);
    const priceNum = Math.max(1, parseFloat(fpUnitPrice) || fuelPriceMad);
    const matchedTruck = trucks.find((x) => x.code === fpTruckCode);
    const driverName = matchedTruck ? matchedTruck.driverName.en : "Fleet Driver";

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
    } else {
      onAddFuelPurchase({
        invoiceNo: fpInvoice.trim() || `INV-MA-${Math.floor(8850 + Math.random() * 140)}`,
        dateIso: fpDate,
        truckCode: fpTruckCode,
        driverName,
        stationName: fpStation.trim() || "Afriquia Station",
        city: fpCity,
        liters: Math.round(litersNum * 10) / 10,
        pricePerLiterMad: Math.round(priceNum * 100) / 100,
        paymentMethod: fpPayment,
      });
    }
    handleResetPurchaseForm();
  };

  // --- 2. Trucks Registry CRUD State (With Capacity, Pallets, Trailer, Tank & Google Maps Route) ---
  const [editingTruckId, setEditingTruckId] = useState<string | null>(null);
  const [trkCode, setTrkCode] = useState("Truck 44");
  const [trkPlate, setTrkPlate] = useState("94510-A-1");
  const [trkModel, setTrkModel] = useState("Volvo FH 500 Globetrotter");
  const [trkTrailerType, setTrkTrailerType] = useState<TrailerType>("Tautliner 13.6m");
  const [trkAxleConfig, setTrkAxleConfig] = useState<AxleConfig>("4x2 + 3-Axle (40T)");
  const [trkDriverName, setTrkDriverName] = useState("Tariq El Mansouri");
  const [trkStatus, setTrkStatus] = useState<"moving" | "idling" | "alert">("moving");
  const [trkHub, setTrkHub] = useState<string>("Casablanca Zenata");
  const [trkDestHub, setTrkDestHub] = useState<string>("Marrakech");
  const [trkCorridor, setTrkCorridor] = useState("A7");
  const [trkMaxPallets, setTrkMaxPallets] = useState("33");
  const [trkLoadedPallets, setTrkLoadedPallets] = useState("28");
  const [trkMaxVolume, setTrkMaxVolume] = useState("90");
  const [trkLoadedVolume, setTrkLoadedVolume] = useState("75.6");
  const [trkMaxWeight, setTrkMaxWeight] = useState("24000");
  const [trkLoadedWeight, setTrkLoadedWeight] = useState("20160");
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
    setTrkCode(`Truck ${Math.floor(42 + Math.random() * 45)}`);
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
    setTrkLoadedPallets("28");
    setTrkMaxVolume("90");
    setTrkLoadedVolume("75.6");
    setTrkMaxWeight("24000");
    setTrkLoadedWeight("20160");
    setTrkTankCapacity("850");
    setTrkFuelLevelPct("78");
    setTrkTargetL100("28.5");
  };

  const handleSubmitTruck = (e: React.FormEvent) => {
    e.preventDefault();
    const hubInfo = MOROCCO_CITY_COORDS[trkHub] || MOROCCO_CITY_COORDS["Casablanca Zenata"];
    const destInfo = MOROCCO_CITY_COORDS[trkDestHub] || MOROCCO_CITY_COORDS["Marrakech"];

    const maxPal = Math.max(1, parseInt(trkMaxPallets, 10) || 33);
    const loadedPal = Math.min(maxPal, Math.max(0, parseInt(trkLoadedPallets, 10) || 0));
    const maxVol = Math.max(10, parseFloat(trkMaxVolume) || 90);
    const loadedVol = Math.min(maxVol, Math.max(0, parseFloat(trkLoadedVolume) || 0));
    const maxW = Math.max(1000, parseInt(trkMaxWeight, 10) || 24000);
    const loadedW = Math.min(maxW, Math.max(0, parseInt(trkLoadedWeight, 10) || 0));

    const volRatio = (loadedVol / maxVol) * 100;
    const weightRatio = (loadedW / maxW) * 100;
    const palRatio = (loadedPal / maxPal) * 100;
    const cargoPct = Math.min(
      100,
      Math.max(0, Math.round(Math.max(volRatio, weightRatio, palRatio)))
    );

    const tankCap = Math.max(150, parseInt(trkTankCapacity, 10) || 850);
    const fuelLvl = Math.min(100, Math.max(5, parseInt(trkFuelLevelPct, 10) || 75));
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
          temperatureC: trkTrailerType === "Reefer (Frigo ATP)" ? 3.5 : undefined,
        });
      }
    } else {
      const newTruck: MapTruck = {
        id: `trk-custom-${Date.now()}`,
        code: trkCode.trim() || "Truck 45",
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
    }
    handleResetTruckForm();
  };

  // --- 3. Drivers Directory CRUD State ---
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [drvName, setDrvName] = useState("Amine Lahlou");
  const [drvCode, setDrvCode] = useState("DRV-449");
  const [drvTruckCode, setDrvTruckCode] = useState(trucks[0]?.code || "Truck 12");
  const [drvCorridor, setDrvCorridor] = useState("A7");
  const [drvEfficiency, setDrvEfficiency] = useState("25.8");
  const [drvIdleMins, setDrvIdleMins] = useState("120");
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
    setDrvCode(`DRV-${Math.floor(450 + Math.random() * 49)}`);
    setDrvEfficiency("25.8");
    setDrvIdleMins("120");
    setDrvIncidents("0");
    setDrvEcoScore("91");
  };

  const handleSubmitDriver = (e: React.FormEvent) => {
    e.preventDefault();
    const eff = Math.max(15, parseFloat(drvEfficiency) || 26.5);
    const idleM = Math.max(0, parseInt(drvIdleMins, 10) || 120);
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
      }
    } else {
      const newDriver: DriverEcoRecord = {
        id: `drv-custom-${Date.now()}`,
        rank: drivers.length + 1,
        driverCode: drvCode.trim() || "DRV-450",
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
    }
    handleResetDriverForm();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
            {t.manager.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {t.manager.subtitle}
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setSubTab("fuel")}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              subTab === "fuel"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Fuel className="h-3.5 w-3.5" />
            <span>{t.manager.tabFuel}</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("trucks")}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              subTab === "trucks"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
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
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              subTab === "drivers"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>
              {t.manager.tabDrivers} ({drivers.length})
            </span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SUB-TAB 1: FUEL TARIFF MANUAL ENTRY & FUEL PURCHASES CRUD
      ===================================================================== */}
      {subTab === "fuel" && (
        <div className="space-y-6">
          {/* Manual Benchmark Fuel Tariff Control Card */}
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                    {t.manager.activeTariffTitle}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  {t.manager.activeTariffSubtitle}
                </p>

                <form
                  onSubmit={handleApplyManualTariff}
                  className="mt-4 flex flex-wrap items-end gap-3"
                >
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
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
                        className="w-24 bg-transparent font-mono text-sm font-bold text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                        MAD/L
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {t.manager.applyTariffBtn}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateFuelPrice(fuelSummary.weightedAvg)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t.manager.syncWeightedAvgBtn} ({fuelSummary.weightedAvg.toFixed(2)} MAD/L)
                  </button>
                </form>
              </div>

              {/* 3 Fuel Summary Metrics */}
              <div className="lg:col-span-5 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 p-3">
                  <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-zinc-400 block">
                    {t.kpi.calculatedAtTariff}
                  </span>
                  <span className="mt-1 text-lg font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 block">
                    {fuelPriceMad.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">MAD / L</span>
                </div>

                <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 p-3">
                  <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-zinc-400 block">
                    {t.manager.weightedAvgPurchasePrice}
                  </span>
                  <span className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100 block">
                    {fuelSummary.weightedAvg.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">MAD / L</span>
                </div>

                <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 p-3">
                  <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-zinc-400 block">
                    {t.manager.totalLoggedSpendMad}
                  </span>
                  <span className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100 block">
                    {Math.round(fuelSummary.totalMad).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    MAD ({fuelSummary.totalLiters} L)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Split View: Add/Edit Fuel Purchase Form (4 cols) + Fuel Purchases Table (8 cols) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <form
              onSubmit={handleSubmitPurchase}
              className="xl:col-span-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4 h-fit"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  {editingPurchaseId
                    ? t.manager.editFuelPurchaseTitle
                    : t.manager.addFuelPurchaseTitle}
                </h3>
                {editingPurchaseId && (
                  <button
                    type="button"
                    onClick={handleResetPurchaseForm}
                    className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    {t.manager.cancelEditBtn}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    {t.manager.colInvoice}
                  </label>
                  <input
                    type="text"
                    value={fpInvoice}
                    onChange={(e) => setFpInvoice(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    {t.manager.dateLabel}
                  </label>
                  <input
                    type="date"
                    value={fpDate}
                    onChange={(e) => setFpDate(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    {t.manager.truckCodeLabel}
                  </label>
                  <select
                    value={fpTruckCode}
                    onChange={(e) => setFpTruckCode(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100"
                  >
                    {trucks.map((trk) => (
                      <option key={trk.id} value={trk.code}>
                        {trk.code} ({trk.plate})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    {t.manager.cityLabel}
                  </label>
                  <select
                    value={fpCity}
                    onChange={(e) => setFpCity(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100"
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
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.stationLabel}
                </label>
                <input
                  type="text"
                  value={fpStation}
                  onChange={(e) => setFpStation(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    {t.manager.litersLabel}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    value={fpLiters}
                    onChange={(e) => setFpLiters(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    {t.manager.unitPriceMadLabel}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="5"
                    value={fpUnitPrice}
                    onChange={(e) => setFpUnitPrice(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-mono font-bold text-blue-600 dark:text-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    {t.manager.paymentMethodLabel}
                  </label>
                  <select
                    value={fpPayment}
                    onChange={(e) => setFpPayment(e.target.value as any)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100"
                  >
                    <option value="Fleet Card">Fleet Card</option>
                    <option value="Depot Bulk">Depot Bulk</option>
                    <option value="Jawaz / Card">Jawaz / Card</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                {editingPurchaseId ? t.manager.updatePurchaseBtn : t.manager.savePurchaseBtn}
              </button>
            </form>

            {/* Fuel Purchases Ledger Table */}
            <div className="xl:col-span-8 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm overflow-x-auto">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-4">
                {t.manager.purchasesLedgerTitle}
              </h3>

              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold uppercase text-slate-500 dark:text-zinc-400">
                    <th className="py-2.5 px-3 text-start">{t.manager.colInvoice}</th>
                    <th className="py-2.5 px-3 text-start">{t.manager.colDate}</th>
                    <th className="py-2.5 px-3 text-start">{t.eco.colTruckCorridor}</th>
                    <th className="py-2.5 px-3 text-start">{t.manager.colStationCity}</th>
                    <th className="py-2.5 px-3 text-start">{t.manager.colLiters}</th>
                    <th className="py-2.5 px-3 text-start">{t.manager.colUnitPrice}</th>
                    <th className="py-2.5 px-3 text-start">{t.manager.colTotalMad}</th>
                    <th className="py-2.5 px-3 text-end">{t.eco.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800/70">
                  {fuelPurchases.map((p) => {
                    const totalCost = Math.round(p.liters * p.pricePerLiterMad * 100) / 100;
                    const isBeingEdited = editingPurchaseId === p.id;
                    return (
                      <tr
                        key={p.id}
                        className={`${
                          isBeingEdited
                            ? "bg-blue-50/50 dark:bg-blue-950/25"
                            : "hover:bg-slate-50/80 dark:hover:bg-zinc-800/35"
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900 dark:text-zinc-100">
                          {p.invoiceNo}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-zinc-400">
                          {p.dateIso}
                        </td>
                        <td className="py-3 px-3">
                          <span className="rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 font-mono font-semibold text-slate-800 dark:text-zinc-200">
                            {p.truckCode}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-900 dark:text-zinc-100 block">
                            {p.stationName}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                            {p.city} • {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-slate-800 dark:text-zinc-200">
                          {p.liters} L
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                          {p.pricePerLiterMad.toFixed(2)} MAD/L
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums font-bold text-slate-900 dark:text-zinc-100">
                          {totalCost.toLocaleString()} MAD
                        </td>
                        <td className="py-3 px-3 text-end">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditPurchase(p)}
                              className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-zinc-300"
                            >
                              <Pencil className="h-3 w-3" />
                              {t.manager.editBtn}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteFuelPurchase(p.id)}
                              className="inline-flex items-center gap-1 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 px-2 py-1 text-[11px] font-medium text-red-700 dark:text-red-400"
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
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: TRUCKS REGISTRY (ADD, EDIT, REMOVE TRUCKS + CAPACITY, PALLETS & GOOGLE MAPS ROUTE)
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
                {editingTruckId ? t.manager.editTruckTitle : t.manager.addTruckTitle}
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

            {/* Section A: Identity & Powertrain */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.truckCodeLabel}
                </label>
                <input
                  type="text"
                  value={trkCode}
                  onChange={(e) => setTrkCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-100"
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
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-100"
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
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100"
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
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100"
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
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100"
                  required
                />
              </div>
            </div>

            {/* Section B: Trailer Type & Axle Configuration */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {locale === "ar"
                    ? "نوع المقطورة"
                    : locale === "fr"
                    ? "Type de Semi-Remorque"
                    : "Trailer Type"}
                </label>
                <select
                  value={trkTrailerType}
                  onChange={(e) => setTrkTrailerType(e.target.value as TrailerType)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100"
                >
                  <option value="Tautliner 13.6m">Tautliner 13.6m (Curtainsider)</option>
                  <option value="Reefer (Frigo ATP)">Reefer (Frigo ATP Cold-Chain)</option>
                  <option value="Mega Box Van">Mega Box Van (100 m³)</option>
                  <option value="Container Chassis">Container Chassis (40ft HC)</option>
                  <option value="Rigid 19T">Rigid 19T (Porteur Regional)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {locale === "ar"
                    ? "المحاور والحمولة الإجمالية"
                    : locale === "fr"
                    ? "Configuration Essieux / PTAC"
                    : "Axle & GVW Tonnage"}
                </label>
                <select
                  value={trkAxleConfig}
                  onChange={(e) => setTrkAxleConfig(e.target.value as AxleConfig)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100"
                >
                  <option value="4x2 + 3-Axle (40T)">4x2 + 3-Axle Semi (40T)</option>
                  <option value="6x4 Heavy (44T)">6x4 Heavy Tractor (44T)</option>
                  <option value="4x2 Rigid (19T)">4x2 Rigid Porteur (19T)</option>
                </select>
              </div>
            </div>

            {/* Section C: Capacity, Pallets (EPAL), Volume (m3) & Payload Weight (kg) */}
            <div className="rounded-lg bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  {locale === "ar"
                    ? "سعة الشاحنة والطبليات والحجم والوزن"
                    : locale === "fr"
                    ? "Capacités Camion : Palettes, Volume (m³) & Charge (kg)"
                    : "Truck Capacity: Pallets (EPAL), Volume (m³) & Weight (kg)"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    {locale === "ar" ? "الطبليات (محمل / أقصى)" : "Pallets (Loaded / Max)"}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="66"
                      value={trkLoadedPallets}
                      onChange={(e) => setTrkLoadedPallets(e.target.value)}
                      className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono text-slate-900 dark:text-zinc-100"
                      title="Loaded Pallets"
                    />
                    <span className="text-slate-400 font-mono text-xs">/</span>
                    <input
                      type="number"
                      min="1"
                      max="66"
                      value={trkMaxPallets}
                      onChange={(e) => setTrkMaxPallets(e.target.value)}
                      className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-zinc-100"
                      title="Max Euro-Pallets Capacity"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    {locale === "ar" ? "الحجم م³ (محمل / أقصى)" : "Volume m³ (Used / Max)"}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="140"
                      value={trkLoadedVolume}
                      onChange={(e) => setTrkLoadedVolume(e.target.value)}
                      className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono text-slate-900 dark:text-zinc-100"
                    />
                    <span className="text-slate-400 font-mono text-xs">/</span>
                    <input
                      type="number"
                      step="1"
                      min="10"
                      max="140"
                      value={trkMaxVolume}
                      onChange={(e) => setTrkMaxVolume(e.target.value)}
                      className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    {locale === "ar" ? "الوزن كغ (محمل / أقصى)" : "Weight kg (Used / Max)"}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="100"
                      min="0"
                      max="40000"
                      value={trkLoadedWeight}
                      onChange={(e) => setTrkLoadedWeight(e.target.value)}
                      className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-1.5 py-1 text-[11px] font-mono text-slate-900 dark:text-zinc-100"
                    />
                    <span className="text-slate-400 font-mono text-xs">/</span>
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      max="40000"
                      value={trkMaxWeight}
                      onChange={(e) => setTrkMaxWeight(e.target.value)}
                      className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-1.5 py-1 text-[11px] font-mono font-bold text-slate-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Tank Capacity, Fuel Level % & Target Consumption */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    {locale === "ar" ? "سعة الخزان (لتر)" : "Fuel Tank Cap. (L)"}
                  </label>
                  <input
                    type="number"
                    step="50"
                    min="150"
                    max="1600"
                    value={trkTankCapacity}
                    onChange={(e) => setTrkTankCapacity(e.target.value)}
                    className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono text-slate-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    {locale === "ar" ? "مستوى الوقود (%)" : "Fuel Level (%)"}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={trkFuelLevelPct}
                    onChange={(e) => setTrkFuelLevelPct(e.target.value)}
                    className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono text-slate-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    {locale === "ar" ? "الاستهلاك (ل/100كم)" : "Target L/100km"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="15"
                    max="50"
                    value={trkTargetL100}
                    onChange={(e) => setTrkTargetL100(e.target.value)}
                    className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>

            {/* Section D: Origin, Destination & Live Google Maps Distance Auto-Calculator */}
            <div className="rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/50 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Route className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  {locale === "ar"
                    ? "المسار وحساب المسافة عبر خرائط جوجل"
                    : locale === "fr"
                    ? "Itinéraire & Distance Google Maps"
                    : "Route & Google Maps Distance Calculator"}
                </span>
                <a
                  href={trkRoutePreview.googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    {locale === "ar" ? "مدينة الانطلاق" : "Origin Hub"}
                  </label>
                  <select
                    value={trkHub}
                    onChange={(e) => {
                      setTrkHub(e.target.value);
                      const r = calculateMoroccoRoute(e.target.value, trkDestHub, fuelPriceMad);
                      setTrkCorridor(r.corridor);
                    }}
                    className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs text-slate-900 dark:text-zinc-100"
                  >
                    {Object.keys(MOROCCO_CITY_COORDS).map((cityKey) => (
                      <option key={cityKey} value={cityKey}>
                        {cityKey}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    {locale === "ar" ? "مدينة الوجهة" : "Destination Hub"}
                  </label>
                  <select
                    value={trkDestHub}
                    onChange={(e) => {
                      setTrkDestHub(e.target.value);
                      const r = calculateMoroccoRoute(trkHub, e.target.value, fuelPriceMad);
                      setTrkCorridor(r.corridor);
                    }}
                    className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs text-slate-900 dark:text-zinc-100"
                  >
                    {Object.keys(MOROCCO_CITY_COORDS).map((cityKey) => (
                      <option key={cityKey} value={cityKey}>
                        {cityKey}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    {t.manager.corridorLabel}
                  </label>
                  <input
                    type="text"
                    value={trkCorridor}
                    onChange={(e) => setTrkCorridor(e.target.value)}
                    className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-slate-700 dark:text-zinc-300">
                <span>
                  Distance: <strong>{trkRoutePreview.distanceKm} km</strong> ({trkRoutePreview.durationFormatted})
                </span>
                <span>
                  Est. Fuel: <strong>{trkRoutePreview.estimatedFuelLiters} L</strong> (
                  {trkRoutePreview.estimatedFuelCostMad.toLocaleString()} MAD)
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {editingTruckId ? t.manager.updateTruckBtn : t.manager.saveTruckBtn}
            </button>
          </form>

          {/* Trucks Registry Table */}
          <div className="xl:col-span-7 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm overflow-x-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-4">
              {t.manager.trucksRegistryTitle} ({trucks.length})
            </h3>

            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold uppercase text-slate-500 dark:text-zinc-400">
                  <th className="py-2.5 px-2.5 text-start">{t.manager.truckCodeLabel}</th>
                  <th className="py-2.5 px-2.5 text-start">
                    {locale === "ar" ? "المقطورة والسائق" : "Trailer & Driver"}
                  </th>
                  <th className="py-2.5 px-2.5 text-start">
                    {locale === "ar" ? "المسار والمسافة" : "Route & Distance"}
                  </th>
                  <th className="py-2.5 px-2.5 text-start">
                    {locale === "ar" ? "الطبليات / الحجم / الوزن" : "Pallets / Vol / Weight"}
                  </th>
                  <th className="py-2.5 px-2.5 text-start">
                    {locale === "ar" ? "الخزان والحالة" : "Tank & Status"}
                  </th>
                  <th className="py-2.5 px-2.5 text-end">{t.eco.colActions}</th>
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
                        <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 block">
                          {trk.plate}
                        </span>
                        <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
                          {trk.axleConfig ?? "4x2 + 3-Axle (40T)"}
                        </span>
                      </td>
                      <td className="py-3 px-2.5">
                        <span className="font-medium text-slate-800 dark:text-zinc-200 block">
                          {trk.model}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                          {trk.trailerType ?? "Tautliner 13.6m"} • {trk.driverName[locale]}
                        </span>
                      </td>
                      <td className="py-3 px-2.5">
                        <span className="font-medium text-slate-800 dark:text-zinc-200 block">
                          {trk.origin[locale]} → {trk.destination[locale]}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                          <span>
                            {trk.corridor} • <strong>{trk.routeDistanceKm ?? 348} km</strong>
                          </span>
                          <a
                            href={gmapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                            title="Open Truck Route in Google Maps"
                          >
                            <span>Maps</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-2.5 font-mono text-[11px]">
                        <div className="text-slate-900 dark:text-zinc-100 font-semibold">
                          {trk.loadedPallets ?? 26}/{trk.maxPallets ?? 33} EPAL ({trk.cargoUtilizationPct}%)
                        </div>
                        <div className="text-slate-500 dark:text-zinc-400">
                          {trk.loadedVolumeM3 ?? 72}/{trk.maxVolumeM3 ?? 90} m³ •{" "}
                          {((trk.loadedWeightKg ?? 19200) / 1000).toFixed(1)}/
                          {((trk.maxWeightKg ?? 24000) / 1000).toFixed(1)} T
                        </div>
                      </td>
                      <td className="py-3 px-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase border ${
                              trk.status === "alert"
                                ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60"
                                : trk.status === "idling"
                                ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                                : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                            }`}
                          >
                            {trk.status}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 block">
                          Tank: {trk.fuelLevelPct ?? 75}% ({trk.fuelTankCapacityL ?? 850}L)
                        </span>
                      </td>
                      <td className="py-3 px-2.5 text-end">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditTruck(trk)}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-zinc-300"
                          >
                            <Pencil className="h-3 w-3" />
                            {t.manager.editBtn}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTruck(trk.id)}
                            className="inline-flex items-center gap-1 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 px-2 py-1 text-[11px] font-medium text-red-700 dark:text-red-400"
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
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: DRIVERS DIRECTORY (ADD, EDIT, REMOVE DRIVERS)
      ===================================================================== */}
      {subTab === "drivers" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Add / Edit Driver Form */}
          <form
            onSubmit={handleSubmitDriver}
            className="xl:col-span-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4 h-fit"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {editingDriverId ? t.manager.editDriverTitle : t.manager.addDriverTitle}
              </h3>
              {editingDriverId && (
                <button
                  type="button"
                  onClick={handleResetDriverForm}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  {t.manager.cancelEditBtn}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.driverNameLabel}
                </label>
                <input
                  type="text"
                  value={drvName}
                  onChange={(e) => setDrvName(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.driverCodeLabel}
                </label>
                <input
                  type="text"
                  value={drvCode}
                  onChange={(e) => setDrvCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.assignedTruckLabel}
                </label>
                <select
                  value={drvTruckCode}
                  onChange={(e) => setDrvTruckCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100"
                >
                  {trucks.map((trk) => (
                    <option key={trk.id} value={trk.code}>
                      {trk.code} ({trk.model})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.corridorLabel}
                </label>
                <input
                  type="text"
                  value={drvCorridor}
                  onChange={(e) => setDrvCorridor(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.efficiencyLabel}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={drvEfficiency}
                  onChange={(e) => setDrvEfficiency(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.idleMinsLabel}
                </label>
                <input
                  type="number"
                  value={drvIdleMins}
                  onChange={(e) => setDrvIdleMins(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.incidentsLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  value={drvIncidents}
                  onChange={(e) => setDrvIncidents(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.manager.ecoScoreLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={drvEcoScore}
                  onChange={(e) => setDrvEcoScore(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-mono font-bold text-blue-600 dark:text-blue-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {editingDriverId ? t.manager.updateDriverBtn : t.manager.saveDriverBtn}
            </button>
          </form>

          {/* Drivers Directory Table */}
          <div className="xl:col-span-8 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm overflow-x-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-4">
              {t.manager.driversDirectoryTitle} ({drivers.length})
            </h3>

            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold uppercase text-slate-500 dark:text-zinc-400">
                  <th className="py-2.5 px-3 text-start">{t.eco.colDriver}</th>
                  <th className="py-2.5 px-3 text-start">{t.eco.colTruckCorridor}</th>
                  <th className="py-2.5 px-3 text-start">{t.eco.colFuelEfficiency}</th>
                  <th className="py-2.5 px-3 text-start">{t.eco.colTotalIdleTime}</th>
                  <th className="py-2.5 px-3 text-start">{t.eco.colEcoScore}</th>
                  <th className="py-2.5 px-3 text-end">{t.eco.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800/70">
                {drivers.map((drv) => (
                  <tr
                    key={drv.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/35"
                  >
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 block">
                        {drv.name[locale]}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                        {drv.driverCode}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-zinc-300">
                      {drv.truckCode} • {drv.corridor}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900 dark:text-zinc-100">
                      {drv.fuelEfficiencyL100km.toFixed(1)} L/100km
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-zinc-400">
                      {drv.totalIdleMinutes30d} min (
                      {Math.round((drv.totalIdleMinutes30d / 60) * 3.4 * fuelPriceMad)} MAD)
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-zinc-100">
                      {drv.ecoScore}/100
                    </td>
                    <td className="py-3 px-3 text-end">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditDriver(drv)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-zinc-300"
                        >
                          <Pencil className="h-3 w-3" />
                          {t.manager.editBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDriver(drv.id)}
                          className="inline-flex items-center gap-1 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 px-2 py-1 text-[11px] font-medium text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
