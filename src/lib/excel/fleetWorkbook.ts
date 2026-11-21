import * as XLSX from "xlsx";
import {
  AxleConfig,
  calculateMoroccoRoute,
  DriverEcoRecord,
  FuelPurchaseRecord,
  InstanceFleetData,
  LtlShipment,
  LtlTruck,
  MapTruck,
  MOROCCO_CITY_COORDS,
  TrailerType,
} from "@/lib/supabase/database";

export interface ParsedExcelImportResult {
  fileName: string;
  trucks: MapTruck[];
  ltlTrucks: LtlTruck[];
  drivers: DriverEcoRecord[];
  shipments: LtlShipment[];
  fuelPurchases: FuelPurchaseRecord[];
  warnings: string[];
}

function matchMoroccoCityKey(rawInput?: string): string {
  if (!rawInput) return "Casablanca Zenata";
  const clean = String(rawInput).trim().toLowerCase();
  const keys = Object.keys(MOROCCO_CITY_COORDS);
  for (const k of keys) {
    if (
      k.toLowerCase() === clean ||
      k.toLowerCase().includes(clean) ||
      clean.includes(k.toLowerCase().split(" ")[0])
    ) {
      return k;
    }
  }
  if (clean.includes("tanger") || clean.includes("tangier")) return "Tanger Med Port";
  if (clean.includes("casa")) return "Casablanca Zenata";
  if (clean.includes("kenitra") || clean.includes("kénitra")) return "Kenitra AFZ";
  if (clean.includes("fes") || clean.includes("fès")) return "Fès";
  if (clean.includes("laayoune") || clean.includes("laâyoune")) return "Laâyoune";
  if (clean.includes("guerguerat") || clean.includes("lagouira")) return "El Guerguerat";
  return "Casablanca Zenata";
}

function pickField(row: Record<string, any>, candidates: string[]): any {
  const rowKeys = Object.keys(row);
  for (const cand of candidates) {
    const lowerCand = cand.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const rk of rowKeys) {
      const lowerRk = rk.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (lowerRk === lowerCand || lowerRk.includes(lowerCand)) {
        if (row[rk] !== undefined && row[rk] !== "") return row[rk];
      }
    }
  }
  return undefined;
}

/**
 * Generates and downloads a 4-sheet Excel (.xlsx) template for Ibrahim and his clients
 */
export function downloadFleetExcelTemplate() {
  const wb = XLSX.utils.book_new();

  const trucksSample = [
    {
      Truck_Code: "Truck 101",
      Plate: "48291-A-1",
      Model: "Volvo FH16 540",
      Trailer_Type: "Tautliner 13.6m",
      Axle_Config: "4x2 + 3-Axle (40T)",
      Driver_Name: "Youssef El Amrani",
      Status: "moving",
      Origin_City: "Tanger Med Port",
      Destination_City: "Casablanca Zenata",
      Corridor: "A1 / A5",
      Max_Pallets: 33,
      Loaded_Pallets: 26,
      Max_Volume_m3: 90,
      Loaded_Volume_m3: 72,
      Max_Weight_kg: 24000,
      Loaded_Weight_kg: 19200,
      Fuel_Tank_L: 850,
      Fuel_Level_Pct: 80,
      Target_L_100km: 28.5,
    },
    {
      Truck_Code: "Truck 102",
      Plate: "71904-B-6",
      Model: "Scania R500 V8",
      Trailer_Type: "Reefer (Frigo ATP)",
      Axle_Config: "6x4 Heavy (44T)",
      Driver_Name: "Hassan Ait Brahim",
      Status: "moving",
      Origin_City: "Agadir",
      Destination_City: "Dakhla",
      Corridor: "N1 Sahara",
      Max_Pallets: 33,
      Loaded_Pallets: 30,
      Max_Volume_m3: 88,
      Loaded_Volume_m3: 81,
      Max_Weight_kg: 26000,
      Loaded_Weight_kg: 23500,
      Fuel_Tank_L: 1100,
      Fuel_Level_Pct: 74,
      Target_L_100km: 27.4,
    },
  ];

  const driversSample = [
    {
      Driver_Code: "DRV-101",
      Driver_Name: "Youssef El Amrani",
      Driver_Name_AR: "يوسف العمراني",
      Truck_Code: "Truck 101",
      Corridor: "A1 / A5",
      Fuel_Efficiency_L100km: 26.4,
      Idle_Minutes_30d: 85,
      Safety_Incidents_30d: 0,
      Eco_Score: 94,
    },
    {
      Driver_Code: "DRV-102",
      Driver_Name: "Hassan Ait Brahim",
      Driver_Name_AR: "حسن آيت إبراهيم",
      Truck_Code: "Truck 102",
      Corridor: "N1 Sahara",
      Fuel_Efficiency_L100km: 27.1,
      Idle_Minutes_30d: 110,
      Safety_Incidents_30d: 1,
      Eco_Score: 88,
    },
  ];

  const routesSample = [
    {
      Shipment_Code: "SHP-501",
      Origin_City: "Casablanca Zenata",
      Destination_City: "Marrakech",
      Corridor: "A7",
      Pallets: 6,
      Volume_m3: 17.1,
      Weight_kg: 4680,
      Revenue_MAD: 5900,
      Cargo_Type: "Retail & Industrial Palletized Goods",
      Is_Backhaul_Match: "YES",
      Recommended_Truck_Code: "Truck 101",
    },
    {
      Shipment_Code: "SHP-502",
      Origin_City: "Agadir",
      Destination_City: "Laâyoune",
      Corridor: "N1 Sahara",
      Pallets: 8,
      Volume_m3: 22.8,
      Weight_kg: 6240,
      Revenue_MAD: 9800,
      Cargo_Type: "Cold-Chain Food & Marine Products",
      Is_Backhaul_Match: "YES",
      Recommended_Truck_Code: "Truck 102",
    },
  ];

  const fuelSample = [
    {
      Invoice_No: "INV-MA-9001",
      Date_ISO: "2026-11-21",
      Truck_Code: "Truck 101",
      Station_Name: "Afriquia Tanger Med ZL",
      City: "Tanger Med Port",
      Liters: 420,
      Unit_Price_MAD: 15.9,
      Payment_Method: "Fleet Card",
    },
  ];

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(trucksSample),
    "Trucks"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(driversSample),
    "Drivers"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(routesSample),
    "Routes_Shipments"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(fuelSample),
    "Fuel_Purchases"
  );

  XLSX.writeFile(wb, "AtlasLogix_Fleet_Import_Template.xlsx");
}

/**
 * Exports an instance's current Trucks, Drivers, Routes/Shipments, and Fuel Purchases to an .xlsx workbook
 */
export function exportInstanceFleetToExcel(
  instanceSlug: string,
  fleetData: InstanceFleetData
) {
  const wb = XLSX.utils.book_new();

  const trucksRows = fleetData.trucks.map((t) => ({
    Truck_Code: t.code,
    Plate: t.plate,
    Model: t.model,
    Trailer_Type: t.trailerType || "Tautliner 13.6m",
    Axle_Config: t.axleConfig || "4x2 + 3-Axle (40T)",
    Driver_Name: t.driverName.en,
    Status: t.status,
    Origin_City: t.originCityKey || t.origin.en,
    Destination_City: t.destinationCityKey || t.destination.en,
    Corridor: t.corridor,
    Route_Distance_km: t.routeDistanceKm || 240,
    Max_Pallets: t.maxPallets ?? 33,
    Loaded_Pallets: t.loadedPallets ?? 24,
    Max_Volume_m3: t.maxVolumeM3 ?? 90,
    Loaded_Volume_m3: t.loadedVolumeM3 ?? 68,
    Max_Weight_kg: t.maxWeightKg ?? 24000,
    Loaded_Weight_kg: t.loadedWeightKg ?? 18000,
    Fuel_Tank_L: t.fuelTankCapacityL ?? 850,
    Fuel_Level_Pct: t.fuelLevelPct ?? 75,
    Target_L_100km: t.targetConsumptionL100km ?? 28.5,
  }));

  const driversRows = fleetData.drivers.map((d) => ({
    Driver_Code: d.driverCode,
    Driver_Name: d.name.en,
    Driver_Name_AR: d.name.ar,
    Truck_Code: d.truckCode,
    Corridor: d.corridor,
    Fuel_Efficiency_L100km: d.fuelEfficiencyL100km,
    Idle_Minutes_30d: d.totalIdleMinutes30d,
    Safety_Incidents_30d: d.safetyIncidents30d,
    Eco_Score: d.ecoScore,
  }));

  const routesRows = fleetData.shipments.map((s) => ({
    Shipment_Code: s.code,
    Origin_City: s.origin.en,
    Destination_City: s.destination.en,
    Corridor: s.corridor,
    Pallets: s.pallets,
    Volume_m3: s.volumeM3,
    Weight_kg: s.weightKg,
    Revenue_MAD: s.revenueMad,
    Cargo_Type: s.cargoType.en,
    Is_Backhaul_Match: s.isBackhaulMatch ? "YES" : "NO",
    Recommended_Truck_Code: s.recommendedTruckCode,
    Empty_Km_Saved: s.emptyKmSaved,
  }));

  const fuelRows = fleetData.fuelPurchases.map((p) => ({
    Invoice_No: p.invoiceNo,
    Date_ISO: p.dateIso,
    Truck_Code: p.truckCode,
    Station_Name: p.stationName,
    City: p.city,
    Liters: p.liters,
    Unit_Price_MAD: p.pricePerLiterMad,
    Payment_Method: p.paymentMethod,
  }));

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(trucksRows),
    "Trucks"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(driversRows),
    "Drivers"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(routesRows),
    "Routes_Shipments"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(fuelRows),
    "Fuel_Purchases"
  );

  XLSX.writeFile(wb, `${instanceSlug || "atlaslogix"}_fleet_export.xlsx`);
}

/**
 * Parses an uploaded Excel (.xlsx / .xls / .csv) file into Trucks, Drivers, Routes/Shipments, and Fuel Purchases
 */
export async function parseFleetExcelFile(
  file: File,
  fuelPriceMad: number
): Promise<ParsedExcelImportResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });

  const trucks: MapTruck[] = [];
  const ltlTrucks: LtlTruck[] = [];
  const drivers: DriverEcoRecord[] = [];
  const shipments: LtlShipment[] = [];
  const fuelPurchases: FuelPurchaseRecord[] = [];
  const warnings: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
      defval: "",
    });
    if (!rows || rows.length === 0) continue;

    const firstRowKeys = Object.keys(rows[0]).join(" ").toLowerCase();
    const lowerSheet = sheetName.toLowerCase();

    const isTruckSheet =
      lowerSheet.includes("truck") ||
      lowerSheet.includes("camion") ||
      firstRowKeys.includes("plate") ||
      firstRowKeys.includes("matricule") ||
      firstRowKeys.includes("max_pallets");

    const isDriverSheet =
      lowerSheet.includes("driver") ||
      lowerSheet.includes("chauffeur") ||
      firstRowKeys.includes("eco_score") ||
      firstRowKeys.includes("driver_code") ||
      firstRowKeys.includes("efficiency");

    const isRouteSheet =
      lowerSheet.includes("route") ||
      lowerSheet.includes("shipment") ||
      lowerSheet.includes("expedition") ||
      firstRowKeys.includes("shipment_code") ||
      firstRowKeys.includes("revenue_mad") ||
      firstRowKeys.includes("backhaul");

    const isFuelSheet =
      lowerSheet.includes("fuel") ||
      lowerSheet.includes("carburant") ||
      firstRowKeys.includes("invoice") ||
      firstRowKeys.includes("liters") ||
      firstRowKeys.includes("station");

    if (isTruckSheet) {
      rows.forEach((r, idx) => {
        const code = String(
          pickField(r, ["Truck_Code", "Code", "Truck", "Camion"]) ||
            `Truck ${101 + idx}`
        ).trim();
        const plate = String(
          pickField(r, ["Plate", "Matricule", "Plate_Number"]) ||
            `${10000 + idx * 137}-A-1`
        ).trim();
        const model = String(
          pickField(r, ["Model", "Modele", "Tractor"]) || "Volvo FH 500"
        ).trim();
        const trailerType = (pickField(r, ["Trailer_Type", "Trailer", "Remorque"]) ||
          "Tautliner 13.6m") as TrailerType;
        const axleConfig = (pickField(r, ["Axle_Config", "Axle", "Essieux"]) ||
          "4x2 + 3-Axle (40T)") as AxleConfig;
        const driverStr = String(
          pickField(r, ["Driver_Name", "Driver", "Chauffeur"]) || "Fleet Driver"
        ).trim();
        const rawStatus = String(
          pickField(r, ["Status", "Statut"]) || "moving"
        )
          .trim()
          .toLowerCase();
        const status: "moving" | "idling" | "alert" =
          rawStatus === "idling" || rawStatus === "alert"
            ? rawStatus
            : "moving";

        const origKey = matchMoroccoCityKey(
          pickField(r, ["Origin_City", "Origin", "Depart", "Hub"])
        );
        const destKey = matchMoroccoCityKey(
          pickField(r, ["Destination_City", "Destination", "Arrivee"]) ||
            "Marrakech"
        );
        const origCoords = MOROCCO_CITY_COORDS[origKey];
        const destCoords = MOROCCO_CITY_COORDS[destKey];

        const maxPallets = Math.max(
          1,
          parseInt(pickField(r, ["Max_Pallets", "Pallets_Max"]), 10) || 33
        );
        const loadedPallets = Math.min(
          maxPallets,
          Math.max(
            0,
            parseInt(pickField(r, ["Loaded_Pallets", "Used_Pallets"]), 10) || 22
          )
        );
        const maxVolumeM3 = Math.max(
          10,
          parseFloat(pickField(r, ["Max_Volume_m3", "Volume_Max"])) || 90
        );
        const loadedVolumeM3 = Math.min(
          maxVolumeM3,
          Math.max(
            0,
            parseFloat(pickField(r, ["Loaded_Volume_m3", "Used_Volume"])) || 60
          )
        );
        const maxWeightKg = Math.max(
          1000,
          parseInt(pickField(r, ["Max_Weight_kg", "Weight_Max"]), 10) || 24000
        );
        const loadedWeightKg = Math.min(
          maxWeightKg,
          Math.max(
            0,
            parseInt(pickField(r, ["Loaded_Weight_kg", "Used_Weight"]), 10) ||
              16000
          )
        );
        const fuelTankCapacityL = Math.max(
          150,
          parseInt(pickField(r, ["Fuel_Tank_L", "Tank_L"]), 10) || 850
        );
        const fuelLevelPct = Math.min(
          100,
          Math.max(
            5,
            parseInt(pickField(r, ["Fuel_Level_Pct", "Fuel_Pct"]), 10) || 78
          )
        );
        const targetConsumptionL100km = Math.max(
          14,
          parseFloat(pickField(r, ["Target_L_100km", "Target_Consumption"])) ||
            28.5
        );

        const routeCalc = calculateMoroccoRoute(
          origKey,
          destKey,
          fuelPriceMad,
          targetConsumptionL100km
        );
        const corridor = String(
          pickField(r, ["Corridor", "Highway"]) || routeCalc.corridor
        ).trim();

        const cargoPct = Math.min(
          100,
          Math.round(
            Math.max(
              (loadedPallets / maxPallets) * 100,
              (loadedVolumeM3 / maxVolumeM3) * 100,
              (loadedWeightKg / maxWeightKg) * 100
            )
          )
        );

        const trkId = `trk-xl-${Date.now()}-${idx}`;
        const mapTrk: MapTruck = {
          id: trkId,
          code,
          plate,
          model,
          trailerType,
          axleConfig,
          driverName: { en: driverStr, fr: driverStr, ar: driverStr },
          status,
          originCityKey: origKey,
          destinationCityKey: destKey,
          origin: origCoords.label,
          destination: destCoords.label,
          currentLocation: origCoords.label,
          corridor,
          lat: origCoords.lat,
          lng: origCoords.lng,
          speedKmh: status === "idling" ? 0 : 82,
          idleMinutes: status === "idling" ? 14 : 0,
          fuelRateLph: status === "idling" ? 3.5 : 24.5,
          wastedFuelLiters: status === "idling" ? 3.5 : 0.3,
          wastedFuelMad:
            Math.round((status === "idling" ? 3.5 : 0.3) * fuelPriceMad * 100) /
            100,
          cargoUtilizationPct: cargoPct,
          maxPallets,
          loadedPallets,
          maxVolumeM3,
          loadedVolumeM3,
          maxWeightKg,
          loadedWeightKg,
          fuelTankCapacityL,
          fuelLevelPct,
          targetConsumptionL100km,
          routeDistanceKm: routeCalc.distanceKm,
          remainingDistanceKm: routeCalc.distanceKm,
        };

        trucks.push(mapTrk);
        ltlTrucks.push({
          id: `ltl-${trkId}`,
          code,
          name: {
            en: `${trailerType} (${corridor})`,
            fr: `${trailerType} (${corridor})`,
            ar: `${trailerType} (${corridor})`,
          },
          plate,
          model: `${model} • ${trailerType}`,
          route: {
            en: `${origCoords.label.en} → ${destCoords.label.en} (${routeCalc.distanceKm} km)`,
            fr: `${origCoords.label.fr} → ${destCoords.label.fr} (${routeCalc.distanceKm} km)`,
            ar: `${origCoords.label.ar} ← ${destCoords.label.ar} (${routeCalc.distanceKm} كم)`,
          },
          corridor,
          driverName: { en: driverStr, fr: driverStr, ar: driverStr },
          departureTime: "22:00",
          maxVolumeM3,
          baseVolumeM3: loadedVolumeM3,
          maxWeightKg,
          baseWeightKg: loadedWeightKg,
          maxPallets,
          basePallets: loadedPallets,
          returnHub: origCoords.label,
        });
      });
    } else if (isDriverSheet) {
      rows.forEach((r, idx) => {
        const driverCode = String(
          pickField(r, ["Driver_Code", "Code"]) || `DRV-${201 + idx}`
        ).trim();
        const nameEn = String(
          pickField(r, ["Driver_Name", "Name", "Nom", "Chauffeur"]) ||
            `Driver ${idx + 1}`
        ).trim();
        const nameAr = String(
          pickField(r, ["Driver_Name_AR", "Name_AR"]) || nameEn
        ).trim();
        const truckCode = String(
          pickField(r, ["Truck_Code", "Truck", "Camion"]) || `Truck ${101 + idx}`
        ).trim();
        const corridor = String(
          pickField(r, ["Corridor", "Route"]) || "A1 / A3"
        ).trim();
        const eff = Math.max(
          15,
          parseFloat(
            pickField(r, ["Fuel_Efficiency_L100km", "Efficiency", "L100km"])
          ) || 27.5
        );
        const idleM = Math.max(
          0,
          parseInt(pickField(r, ["Idle_Minutes_30d", "Idle_Minutes"]), 10) || 95
        );
        const inc = Math.max(
          0,
          parseInt(
            pickField(r, ["Safety_Incidents_30d", "Incidents"]),
            10
          ) || 0
        );
        const ecoScore = Math.min(
          100,
          Math.max(
            10,
            parseInt(pickField(r, ["Eco_Score", "Score"]), 10) || 88
          )
        );
        const badge: "green" | "yellow" | "red" =
          ecoScore >= 80 ? "green" : ecoScore >= 65 ? "yellow" : "red";
        const initials =
          nameEn
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() || "D")
            .join("") || "DR";

        drivers.push({
          id: `drv-xl-${Date.now()}-${idx}`,
          rank: idx + 1,
          driverCode,
          name: { en: nameEn, fr: nameEn, ar: nameAr },
          avatarInitials: initials,
          truckCode,
          truckModel: "Heavy Fleet Tractor",
          corridor,
          routeDescription: {
            en: `${corridor} Freight Axis`,
            fr: `Axe Fret ${corridor}`,
            ar: `محور الشحن ${corridor}`,
          },
          fuelEfficiencyL100km: Math.round(eff * 10) / 10,
          targetEfficiencyL100km: 29.5,
          totalIdleMinutes30d: idleM,
          idleWastedMad30d: Math.round((idleM / 60) * 3.5 * fuelPriceMad),
          safetyIncidents30d: inc,
          harshBrakingCount: Math.ceil(inc / 2),
          overspeedCount: Math.floor(inc / 2),
          kmDriven30d: 9800,
          ecoScore,
          badge,
        });
      });
    } else if (isRouteSheet) {
      rows.forEach((r, idx) => {
        const code = String(
          pickField(r, ["Shipment_Code", "Route_Code", "Code"]) ||
            `SHP-${601 + idx}`
        ).trim();
        const origKey = matchMoroccoCityKey(
          pickField(r, ["Origin_City", "Origin", "Depart"])
        );
        const destKey = matchMoroccoCityKey(
          pickField(r, ["Destination_City", "Destination", "Arrivee"]) ||
            "Marrakech"
        );
        const origHub = MOROCCO_CITY_COORDS[origKey];
        const destHub = MOROCCO_CITY_COORDS[destKey];
        const routeCalc = calculateMoroccoRoute(
          origKey,
          destKey,
          fuelPriceMad,
          28.5
        );
        const pallets = Math.max(
          1,
          parseInt(pickField(r, ["Pallets", "Palettes"]), 10) || 4
        );
        const volumeM3 =
          parseFloat(pickField(r, ["Volume_m3", "Volume"])) ||
          Math.round(pallets * 2.85 * 10) / 10;
        const weightKg =
          parseInt(pickField(r, ["Weight_kg", "Weight", "Poids"]), 10) ||
          pallets * 780;
        const revenueMad =
          parseInt(pickField(r, ["Revenue_MAD", "Revenue", "Tarif"]), 10) ||
          Math.round(routeCalc.distanceKm * 14 + pallets * 400);
        const cargoDesc = String(
          pickField(r, ["Cargo_Type", "Cargo", "Marchandise"]) ||
            "Commercial LTL Freight"
        ).trim();
        const backhaulStr = String(
          pickField(r, ["Is_Backhaul_Match", "Backhaul"]) || "YES"
        )
          .trim()
          .toUpperCase();
        const recTruckCode = String(
          pickField(r, ["Recommended_Truck_Code", "Truck_Code"]) || "Truck 101"
        ).trim();

        shipments.push({
          id: `shp-xl-${Date.now()}-${idx}`,
          code,
          origin: origHub.label,
          destination: destHub.label,
          corridor:
            String(pickField(r, ["Corridor"]) || "").trim() ||
            routeCalc.corridor,
          pallets,
          volumeM3,
          weightKg,
          revenueMad,
          cargoType: { en: cargoDesc, fr: cargoDesc, ar: cargoDesc },
          isBackhaulMatch: backhaulStr !== "NO" && backhaulStr !== "FALSE",
          recommendedTruckId: "ltl-trk-1",
          recommendedTruckCode: recTruckCode,
          emptyKmSaved: routeCalc.distanceKm,
          fuelLitersSaved: routeCalc.estimatedFuelLiters,
          fuelMadSaved: routeCalc.estimatedFuelCostMad,
          assignedTruckId: null,
        });
      });
    } else if (isFuelSheet) {
      rows.forEach((r, idx) => {
        const invoiceNo = String(
          pickField(r, ["Invoice_No", "Invoice", "Facture"]) ||
            `INV-XL-${910 + idx}`
        ).trim();
        const dateIso = String(
          pickField(r, ["Date_ISO", "Date"]) ||
            new Date().toISOString().slice(0, 10)
        ).trim();
        const truckCode = String(
          pickField(r, ["Truck_Code", "Truck", "Camion"]) || "Truck 101"
        ).trim();
        const stationName = String(
          pickField(r, ["Station_Name", "Station"]) || "Afriquia Station"
        ).trim();
        const city = matchMoroccoCityKey(pickField(r, ["City", "Ville"]));
        const liters = Math.max(
          10,
          parseFloat(pickField(r, ["Liters", "Litres"])) || 380
        );
        const pricePerLiterMad = Math.max(
          5,
          parseFloat(pickField(r, ["Unit_Price_MAD", "Price"])) || fuelPriceMad
        );

        fuelPurchases.push({
          id: `fp-xl-${Date.now()}-${idx}`,
          invoiceNo,
          dateIso,
          truckCode,
          driverName: "Fleet Driver",
          stationName,
          city,
          liters,
          pricePerLiterMad,
          paymentMethod: "Fleet Card",
        });
      });
    } else {
      warnings.push(
        `Sheet "${sheetName}" could not be automatically classified (expected Trucks, Drivers, Routes_Shipments, or Fuel_Purchases).`
      );
    }
  }

  return {
    fileName: file.name,
    trucks,
    ltlTrucks,
    drivers,
    shipments,
    fuelPurchases,
    warnings,
  };
}
