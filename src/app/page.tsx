"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MapPinned,
  Boxes,
  Award,
  SlidersHorizontal,
  Database,
  Globe,
  Building2,
  Fuel,
  Radio,
  Menu,
  X,
  Sun,
  Moon,
  Lock,
  ShieldCheck,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import {
  ARABIC_FONT_OPTIONS,
  ClientDemoInstance,
  COMPANIES,
  CompanyProfile,
  DAILY_FINANCIALS_30D,
  DEFAULT_BRAND_THEME,
  DEFAULT_PLATFORM_CONFIG,
  DIESEL_PRICE_MAD_PER_LITER,
  DriverEcoRecord,
  FuelPurchaseRecord,
  INITIAL_DEMO_INSTANCES,
  INITIAL_DRIVER_ECO_SCORES,
  INITIAL_FUEL_PURCHASES,
  INITIAL_LTL_SHIPMENTS,
  INITIAL_LTL_TRUCKS,
  INITIAL_MAP_TRUCKS,
  INITIAL_TELEMETRY_ALERTS,
  InstanceFleetData,
  LATIN_FONT_OPTIONS,
  Locale,
  LtlShipment,
  LtlTruck,
  MapTruck,
  MONO_FONT_OPTIONS,
  PlatformSystemConfig,
  TelemetryAlert,
} from "@/lib/supabase/database";
import {
  deleteDemoInstanceFromSupabase,
  fetchDemoInstancesFromSupabase,
  fetchWorkspaceSettingsFromSupabase,
  syncDemoInstancesToSupabase,
  syncWorkspaceSettingsToSupabase,
} from "@/lib/supabase/demoSync";
import { ParsedExcelImportResult } from "@/lib/excel/fleetWorkbook";
import { TRANSLATIONS } from "@/lib/i18n/translations";
import { OverviewPage } from "@/components/OverviewPage";
import { LiveMapPage } from "@/components/LiveMapPage";
import { LtlOptimizerPage } from "@/components/LtlOptimizerPage";
import { DriverEcoPage } from "@/components/DriverEcoPage";
import { FleetFuelManagerPage } from "@/components/FleetFuelManagerPage";
import { PortalAccessGate } from "@/components/PortalAccessGate";
import { IbrahimAdminPortal } from "@/components/IbrahimAdminPortal";
import { SupabaseModal } from "@/components/SupabaseModal";

type NavTab =
  | "overview"
  | "live-map"
  | "ltl-optimizer"
  | "driver-eco"
  | "fleet-manager";

const WORKSPACE_STORAGE_KEY = "atlaslogix_morocco_workspace_v3";

function getDefaultFleetData(): InstanceFleetData {
  return {
    trucks: INITIAL_MAP_TRUCKS,
    ltlTrucks: INITIAL_LTL_TRUCKS,
    shipments: INITIAL_LTL_SHIPMENTS,
    drivers: INITIAL_DRIVER_ECO_SCORES,
    fuelPurchases: INITIAL_FUEL_PURCHASES,
    alerts: INITIAL_TELEMETRY_ALERTS,
  };
}

function hydrateInstancesWithFleet(
  list: ClientDemoInstance[]
): ClientDemoInstance[] {
  return list.map((inst) => ({
    ...inst,
    themeConfig: {
      ...DEFAULT_BRAND_THEME,
      ...(inst.themeConfig || {}),
    },
    fleetData: {
      trucks: Array.isArray(inst.fleetData?.trucks)
        ? inst.fleetData.trucks
        : INITIAL_MAP_TRUCKS,
      ltlTrucks: Array.isArray(inst.fleetData?.ltlTrucks)
        ? inst.fleetData.ltlTrucks
        : INITIAL_LTL_TRUCKS,
      shipments: Array.isArray(inst.fleetData?.shipments)
        ? inst.fleetData.shipments
        : INITIAL_LTL_SHIPMENTS,
      drivers: Array.isArray(inst.fleetData?.drivers)
        ? inst.fleetData.drivers
        : INITIAL_DRIVER_ECO_SCORES,
      fuelPurchases: Array.isArray(inst.fleetData?.fuelPurchases)
        ? inst.fleetData.fuelPurchases
        : INITIAL_FUEL_PURCHASES,
      alerts: Array.isArray(inst.fleetData?.alerts)
        ? inst.fleetData.alerts
        : INITIAL_TELEMETRY_ALERTS,
    },
  }));
}

export default function MoroccoFleetDashboard() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [locale, setLocale] = useState<Locale>("fr");
  const [platformConfig, setPlatformConfig] =
    useState<PlatformSystemConfig>(DEFAULT_PLATFORM_CONFIG);
  const [demoInstances, setDemoInstances] = useState<ClientDemoInstance[]>(() =>
    hydrateInstancesWithFleet(INITIAL_DEMO_INSTANCES)
  );

  // Dual-Gate Session Role: "gate" | "admin" | "client_demo"
  const [sessionRole, setSessionRole] = useState<
    "gate" | "admin" | "client_demo"
  >("gate");

  // Which instance is currently active in Client Demo View or selected in Ibrahim's Admin Builder
  const [activeClientInstanceId, setActiveClientInstanceId] = useState<string>(
    INITIAL_DEMO_INSTANCES[0].id
  );
  const [selectedEditInstanceId, setSelectedEditInstanceId] = useState<string>(
    INITIAL_DEMO_INSTANCES[0].id
  );
  const [isAdminPreviewingClient, setIsAdminPreviewingClient] =
    useState<boolean>(false);
  const [initialSlugFromUrl, setInitialSlugFromUrl] = useState<string | null>(
    null
  );

  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isStreamRunning, setIsStreamRunning] = useState<boolean>(true);
  const [simCounter, setSimCounter] = useState<number>(1);
  const [hydrated, setHydrated] = useState(false);

  // Real-time Supabase Cloud Sync Status
  const [syncState, setSyncState] = useState<{
    status: "synced" | "saving" | "error";
    lastSavedTime: string;
    message: string;
  }>({
    status: "synced",
    lastSavedTime: "Live",
    message: "Connected to Supabase PostgreSQL",
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load from LocalStorage + Fetch Live from Supabase on Mount
  useEffect(() => {
    let localCfg = DEFAULT_PLATFORM_CONFIG;
    try {
      const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.locale) setLocale(parsed.locale);
        if (parsed.platformConfig) {
          localCfg = {
            ...DEFAULT_PLATFORM_CONFIG,
            ...parsed.platformConfig,
            supabaseUrl: DEFAULT_PLATFORM_CONFIG.supabaseUrl,
            supabaseAnonKey: DEFAULT_PLATFORM_CONFIG.supabaseAnonKey,
          };
          setPlatformConfig(localCfg);
        }
        if (
          Array.isArray(parsed.demoInstances) &&
          parsed.demoInstances.length > 0
        ) {
          const hydratedList = hydrateInstancesWithFleet(parsed.demoInstances);
          setDemoInstances(hydratedList);
        }
      }

      const params = new URLSearchParams(window.location.search);
      const demoParam = params.get("demo");
      if (demoParam) {
        setInitialSlugFromUrl(demoParam);
        setSessionRole("gate");
      }
    } catch {
      // ignore local storage parse errors
    }

    // Pull latest live state from Supabase PostgreSQL (public.demo_instances & public.platform_settings)
    Promise.all([
      fetchDemoInstancesFromSupabase(
        localCfg.supabaseUrl,
        localCfg.supabaseAnonKey
      ),
      fetchWorkspaceSettingsFromSupabase(
        localCfg.supabaseUrl,
        localCfg.supabaseAnonKey
      ),
    ])
      .then(([cloudDemos, cloudSettings]) => {
        if (cloudDemos && cloudDemos.length > 0) {
          const hydratedCloud = hydrateInstancesWithFleet(cloudDemos);
          setDemoInstances(hydratedCloud);
          const params = new URLSearchParams(window.location.search);
          const slugParam = params.get("demo");
          if (slugParam) {
            const matched = hydratedCloud.find(
              (d) => d.slug.toLowerCase() === slugParam.toLowerCase()
            );
            if (matched) {
              setActiveClientInstanceId(matched.id);
              setSelectedEditInstanceId(matched.id);
            }
          }
        }
        if (cloudSettings?.platformConfig) {
          setPlatformConfig((prev) => ({
            ...prev,
            ...cloudSettings.platformConfig,
            supabaseUrl: DEFAULT_PLATFORM_CONFIG.supabaseUrl,
            supabaseAnonKey: DEFAULT_PLATFORM_CONFIG.supabaseAnonKey,
          }));
        }
        setSyncState({
          status: "synced",
          lastSavedTime: new Date().toLocaleTimeString(),
          message: "Loaded live from Supabase PostgreSQL",
        });
      })
      .finally(() => {
        setHydrated(true);
      });
  }, []);

  // 2. Debounced Auto-Save to both LocalStorage AND Supabase PostgreSQL whenever demoInstances or platformConfig changes
  const persistToSupabaseCloud = useCallback(
    async (
      instancesToSave: ClientDemoInstance[],
      configToSave: PlatformSystemConfig
    ) => {
      setSyncState((prev) => ({
        ...prev,
        status: "saving",
        message: "Saving changes to Supabase PostgreSQL...",
      }));

      const [demosRes, settingsRes] = await Promise.all([
        syncDemoInstancesToSupabase(
          configToSave.supabaseUrl,
          configToSave.supabaseAnonKey,
          instancesToSave
        ),
        syncWorkspaceSettingsToSupabase(
          configToSave.supabaseUrl,
          configToSave.supabaseAnonKey,
          { platformConfig: configToSave }
        ),
      ]);

      const nowStr = new Date().toLocaleTimeString();
      if (demosRes.ok && settingsRes.ok) {
        setSyncState({
          status: "synced",
          lastSavedTime: nowStr,
          message: `All instances & fleet data saved to Supabase (${nowStr})`,
        });
      } else {
        setSyncState({
          status: "error",
          lastSavedTime: nowStr,
          message: demosRes.message || "Saved locally (Supabase sync warning)",
        });
      }
    },
    []
  );

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        WORKSPACE_STORAGE_KEY,
        JSON.stringify({
          theme,
          locale,
          platformConfig,
          demoInstances,
        })
      );
    } catch {
      // ignore local storage quota
    }

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      persistToSupabaseCloud(demoInstances, platformConfig);
    }, 450);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [hydrated, theme, locale, platformConfig, demoInstances, persistToSupabaseCloud]);

  // Helper to get or mutate any instance's isolated data
  const activeClientDemo = useMemo(() => {
    return (
      demoInstances.find((d) => d.id === activeClientInstanceId) ||
      demoInstances[0]
    );
  }, [demoInstances, activeClientInstanceId]);

  const activeEditInstance = useMemo(() => {
    return (
      demoInstances.find((d) => d.id === selectedEditInstanceId) ||
      demoInstances[0]
    );
  }, [demoInstances, selectedEditInstanceId]);

  const updateSpecificInstance = useCallback(
    (
      instanceId: string,
      updater: (inst: ClientDemoInstance) => ClientDemoInstance
    ) => {
      setDemoInstances((prev) =>
        prev.map((inst) => (inst.id === instanceId ? updater(inst) : inst))
      );
    },
    []
  );

  const updateSpecificInstanceFleet = useCallback(
    (
      instanceId: string,
      updater: (fleet: InstanceFleetData) => InstanceFleetData
    ) => {
      updateSpecificInstance(instanceId, (inst) => {
        const currentFleet = inst.fleetData || getDefaultFleetData();
        const nextFleet = updater(currentFleet);
        return {
          ...inst,
          activeTrucksCount: nextFleet.trucks.length,
          totalFleetCount: Math.max(
            inst.totalFleetCount,
            nextFleet.trucks.length + 4
          ),
          fleetData: nextFleet,
        };
      });
    },
    [updateSpecificInstance]
  );

  // Target instance ID for client dashboard views (activeClientDemo.id)
  const clientId = activeClientDemo?.id || INITIAL_DEMO_INSTANCES[0].id;
  const clientFleet = useMemo(
    () => activeClientDemo?.fleetData || getDefaultFleetData(),
    [activeClientDemo]
  );
  const fuelPriceMad = activeClientDemo?.fuelPriceMad ?? DIESEL_PRICE_MAD_PER_LITER;

  // Target instance ID for Ibrahim's Admin Builder Fleet Editor (activeEditInstance.id)
  const builderId = activeEditInstance?.id || INITIAL_DEMO_INSTANCES[0].id;
  const builderFleet = useMemo(
    () => activeEditInstance?.fleetData || getDefaultFleetData(),
    [activeEditInstance]
  );

  // Rerank driver helper
  const rerankDrivers = (list: DriverEcoRecord[]): DriverEcoRecord[] =>
    list
      .toSorted((a, b) => b.ecoScore - a.ecoScore)
      .map((d, idx) => ({ ...d, rank: idx + 1 }));

  // Build reusable fleet CRUD handlers for any target instance ID
  const makeInstanceHandlers = (targetId: string) => ({
    onUpdateFuelPrice: (newPrice: number) => {
      updateSpecificInstance(targetId, (inst) => ({
        ...inst,
        fuelPriceMad: Math.round(newPrice * 100) / 100,
      }));
    },
    onAddFuelPurchase: (purchase: Omit<FuelPurchaseRecord, "id">) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        fuelPurchases: [{ ...purchase, id: `fp-${Date.now()}` }, ...f.fuelPurchases],
      }));
    },
    onUpdateFuelPurchase: (updated: FuelPurchaseRecord) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        fuelPurchases: f.fuelPurchases.map((p) =>
          p.id === updated.id ? updated : p
        ),
      }));
    },
    onDeleteFuelPurchase: (id: string) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        fuelPurchases: f.fuelPurchases.filter((p) => p.id !== id),
      }));
    },
    onAddTruck: (newTruck: MapTruck) => {
      const ltlEntry: LtlTruck = {
        id: `ltl-${newTruck.id}`,
        code: newTruck.code,
        name: {
          en: `${newTruck.trailerType ?? "Tautliner 13.6m"} (${newTruck.corridor})`,
          fr: `${newTruck.trailerType ?? "Tautliner 13.6m"} (${newTruck.corridor})`,
          ar: `${newTruck.trailerType ?? "Tautliner 13.6m"} (${newTruck.corridor})`,
        },
        plate: newTruck.plate,
        model: `${newTruck.model} • ${newTruck.trailerType ?? "Tautliner 13.6m"}`,
        route: {
          en: `${newTruck.origin.en} → ${newTruck.destination.en} (${newTruck.routeDistanceKm ?? 240} km)`,
          fr: `${newTruck.origin.fr} → ${newTruck.destination.fr} (${newTruck.routeDistanceKm ?? 240} km)`,
          ar: `${newTruck.origin.ar} ← ${newTruck.destination.ar} (${newTruck.routeDistanceKm ?? 240} كم)`,
        },
        corridor: newTruck.corridor,
        driverName: newTruck.driverName,
        departureTime: "23:15",
        maxVolumeM3: newTruck.maxVolumeM3 ?? 90,
        baseVolumeM3: newTruck.loadedVolumeM3 ?? 45,
        maxWeightKg: newTruck.maxWeightKg ?? 24000,
        baseWeightKg: newTruck.loadedWeightKg ?? 12000,
        maxPallets: newTruck.maxPallets ?? 33,
        basePallets: newTruck.loadedPallets ?? 16,
        returnHub: newTruck.origin,
      };
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        trucks: [newTruck, ...f.trucks],
        ltlTrucks: [...f.ltlTrucks, ltlEntry],
      }));
    },
    onUpdateTruck: (updatedTruck: MapTruck) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        trucks: f.trucks.map((t) =>
          t.id === updatedTruck.id ? updatedTruck : t
        ),
      }));
    },
    onDeleteTruck: (truckId: string) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        trucks: f.trucks.filter((t) => t.id !== truckId),
      }));
    },
    onAddDriver: (newDriver: DriverEcoRecord) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        drivers: rerankDrivers([...f.drivers, newDriver]),
      }));
    },
    onUpdateDriver: (updatedDriver: DriverEcoRecord) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        drivers: rerankDrivers(
          f.drivers.map((d) => (d.id === updatedDriver.id ? updatedDriver : d))
        ),
      }));
    },
    onDeleteDriver: (driverId: string) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        drivers: rerankDrivers(f.drivers.filter((d) => d.id !== driverId)),
      }));
    },
    onAddShipment: (newShipment: LtlShipment) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        shipments: [newShipment, ...f.shipments],
      }));
    },
    onUpdateShipment: (updatedShipment: LtlShipment) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        shipments: f.shipments.map((s) =>
          s.id === updatedShipment.id ? updatedShipment : s
        ),
      }));
    },
    onDeleteShipment: (shipmentId: string) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        shipments: f.shipments.filter((s) => s.id !== shipmentId),
      }));
    },
    onBulkImportExcel: (
      parsed: ParsedExcelImportResult,
      mode: "merge" | "replace"
    ) => {
      updateSpecificInstanceFleet(targetId, (f) => {
        if (mode === "replace") {
          return {
            trucks: parsed.trucks,
            ltlTrucks: parsed.ltlTrucks,
            shipments: parsed.shipments,
            drivers: rerankDrivers(parsed.drivers),
            fuelPurchases: parsed.fuelPurchases,
            alerts: [],
          };
        }

        // Merge / Update by code or plate or id
        const mergedTrucks = [...f.trucks];
        parsed.trucks.forEach((incoming) => {
          const idx = mergedTrucks.findIndex(
            (existing) =>
              existing.code.toLowerCase() === incoming.code.toLowerCase() ||
              existing.plate.toLowerCase() === incoming.plate.toLowerCase()
          );
          if (idx >= 0) {
            mergedTrucks[idx] = { ...incoming, id: mergedTrucks[idx].id };
          } else {
            mergedTrucks.push(incoming);
          }
        });

        const mergedLtlTrucks = [...f.ltlTrucks];
        parsed.ltlTrucks.forEach((incoming) => {
          const idx = mergedLtlTrucks.findIndex(
            (existing) =>
              existing.code.toLowerCase() === incoming.code.toLowerCase() ||
              existing.plate.toLowerCase() === incoming.plate.toLowerCase()
          );
          if (idx >= 0) {
            mergedLtlTrucks[idx] = { ...incoming, id: mergedLtlTrucks[idx].id };
          } else {
            mergedLtlTrucks.push(incoming);
          }
        });

        const mergedDrivers = [...f.drivers];
        parsed.drivers.forEach((incoming) => {
          const idx = mergedDrivers.findIndex(
            (existing) =>
              existing.name.en.toLowerCase() === incoming.name.en.toLowerCase()
          );
          if (idx >= 0) {
            mergedDrivers[idx] = { ...incoming, id: mergedDrivers[idx].id };
          } else {
            mergedDrivers.push(incoming);
          }
        });

        const mergedShipments = [...f.shipments];
        parsed.shipments.forEach((incoming) => {
          const idx = mergedShipments.findIndex(
            (existing) =>
              existing.code.toLowerCase() === incoming.code.toLowerCase()
          );
          if (idx >= 0) {
            mergedShipments[idx] = { ...incoming, id: mergedShipments[idx].id };
          } else {
            mergedShipments.push(incoming);
          }
        });

        const mergedFuel = [...parsed.fuelPurchases, ...f.fuelPurchases];

        return {
          ...f,
          trucks: mergedTrucks,
          ltlTrucks: mergedLtlTrucks,
          drivers: rerankDrivers(mergedDrivers),
          shipments: mergedShipments,
          fuelPurchases: mergedFuel,
        };
      });
    },
    onClearAllInstanceFleet: () => {
      updateSpecificInstanceFleet(targetId, () => ({
        trucks: [],
        ltlTrucks: [],
        shipments: [],
        drivers: [],
        fuelPurchases: [],
        alerts: [],
      }));
    },
  });

  const clientHandlers = makeInstanceHandlers(clientId);
  const builderHandlers = makeInstanceHandlers(builderId);

  // LTL Handlers for Active Client Demo View
  const handleAssignShipment = (shipmentId: string, truckId: string): boolean => {
    const shipment = clientFleet.shipments.find((s) => s.id === shipmentId);
    const truck = clientFleet.ltlTrucks.find((trk) => trk.id === truckId);
    if (!shipment || !truck) return false;

    const existing = clientFleet.shipments.filter(
      (s) => s.assignedTruckId === truckId
    );
    const usedVol =
      truck.baseVolumeM3 + existing.reduce((sum, s) => sum + s.volumeM3, 0);
    const usedWeight =
      truck.baseWeightKg + existing.reduce((sum, s) => sum + s.weightKg, 0);
    const usedPallets =
      truck.basePallets + existing.reduce((sum, s) => sum + s.pallets, 0);

    if (
      usedVol + shipment.volumeM3 > truck.maxVolumeM3 ||
      usedWeight + shipment.weightKg > truck.maxWeightKg ||
      usedPallets + shipment.pallets > truck.maxPallets
    ) {
      return false;
    }

    updateSpecificInstanceFleet(clientId, (f) => ({
      ...f,
      shipments: f.shipments.map((s) =>
        s.id === shipmentId ? { ...s, assignedTruckId: truckId } : s
      ),
    }));
    return true;
  };

  const handleUnassignShipment = (shipmentId: string) => {
    updateSpecificInstanceFleet(clientId, (f) => ({
      ...f,
      shipments: f.shipments.map((s) =>
        s.id === shipmentId ? { ...s, assignedTruckId: null } : s
      ),
    }));
  };

  const handleAutoOptimizeBackhauls = () => {
    updateSpecificInstanceFleet(clientId, (f) => {
      const updated = f.shipments.map((s) => ({ ...s }));
      updated.forEach((shp) => {
        if (shp.assignedTruckId !== null) return;
        const targetTruck = f.ltlTrucks.find(
          (trk) => trk.id === shp.recommendedTruckId
        );
        if (!targetTruck) return;
        const alreadyOnTruck = updated.filter(
          (x) => x.assignedTruckId === targetTruck.id
        );
        const curVol =
          targetTruck.baseVolumeM3 +
          alreadyOnTruck.reduce((acc, x) => acc + x.volumeM3, 0);
        const curWeight =
          targetTruck.baseWeightKg +
          alreadyOnTruck.reduce((acc, x) => acc + x.weightKg, 0);
        const curPallets =
          targetTruck.basePallets +
          alreadyOnTruck.reduce((acc, x) => acc + x.pallets, 0);

        if (
          curVol + shp.volumeM3 <= targetTruck.maxVolumeM3 &&
          curWeight + shp.weightKg <= targetTruck.maxWeightKg &&
          curPallets + shp.pallets <= targetTruck.maxPallets
        ) {
          shp.assignedTruckId = targetTruck.id;
        }
      });
      return { ...f, shipments: updated };
    });
  };

  const handleResetLtl = () => {
    updateSpecificInstanceFleet(clientId, (f) => ({
      ...f,
      shipments: INITIAL_LTL_SHIPMENTS,
    }));
  };

  const handleUpdateLtlTruck = (updatedLtlTruck: LtlTruck) => {
    updateSpecificInstanceFleet(clientId, (f) => ({
      ...f,
      ltlTrucks: f.ltlTrucks.map((t) =>
        t.id === updatedLtlTruck.id ? updatedLtlTruck : t
      ),
    }));
  };

  const handleAddLtlShipment = (newShipment: LtlShipment) => {
    updateSpecificInstanceFleet(clientId, (f) => ({
      ...f,
      shipments: [newShipment, ...f.shipments],
    }));
  };

  // Telemetry & Map Handlers for Active Client Demo View
  const handleAcknowledgeAlert = (alertId: string) => {
    updateSpecificInstanceFleet(clientId, (f) => ({
      ...f,
      alerts: f.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
    }));
  };

  const handleStopTruckIdle = (truckId: string) => {
    updateSpecificInstanceFleet(clientId, (f) => ({
      ...f,
      trucks: f.trucks.map((trk) =>
        trk.id === truckId
          ? {
              ...trk,
              status: "moving",
              speedKmh: 64,
              idleMinutes: 0,
              fuelRateLph: 22.4,
            }
          : trk
      ),
      alerts: f.alerts.map((a) =>
        a.truckId === truckId && a.type === "idling"
          ? { ...a, acknowledged: true }
          : a
      ),
    }));
  };

  const handleSimulateTelemetryEvent = () => {
    const nowStr = new Date().toTimeString().slice(0, 8);
    const newAlert: TelemetryAlert = {
      id: `sim-alt-${Date.now()}`,
      truckCode: "Truck 12",
      truckId: "trk-12",
      type: "idling",
      severity: "warning",
      timestamp: nowStr,
      corridor: "Tanger Med Port",
      idleMinutes: 18,
      wastedFuelLiters: 5.4,
      wastedFuelMad: Math.round(5.4 * fuelPriceMad * 100) / 100,
      text: {
        en: "Truck 12 - Idling extended to 18 mins at Tanger Med Port",
        fr: "Camion 12 - Ralenti prolongé à 18 min au Port Tanger Med",
        ar: "شاحنة 12 - استمرار الخمول لمدة 18 دقيقة بميناء طنجة المتوسط",
      },
      detail: {
        en: "Scanner Queue • 5.4 L wasted",
        fr: "File Scanner • 5,4 L gaspillés",
        ar: "طابور الفحص • هدر 5.4 لتر",
      },
      acknowledged: false,
    };
    setSimCounter((c) => c + 1);
    updateSpecificInstanceFleet(clientId, (f) => ({
      ...f,
      alerts: [newAlert, ...f.alerts],
    }));
  };

  // Demo Instance CRUD Handlers for Ibrahim's Master Admin Portal
  const handleAddDemoInstance = (inst: ClientDemoInstance) => {
    const hydratedInst = hydrateInstancesWithFleet([inst])[0];
    setDemoInstances((prev) => [hydratedInst, ...prev]);
  };

  const handleUpdateDemoInstance = (updatedInst: ClientDemoInstance) => {
    setDemoInstances((prev) =>
      prev.map((d) => (d.id === updatedInst.id ? updatedInst : d))
    );
  };

  const handleDeleteDemoInstance = (id: string) => {
    const target = demoInstances.find((d) => d.id === id);
    if (target) {
      deleteDemoInstanceFromSupabase(
        platformConfig.supabaseUrl,
        platformConfig.supabaseAnonKey,
        target.slug
      );
    }
    setDemoInstances((prev) => {
      const remaining = prev.filter((d) => d.id !== id);
      if (selectedEditInstanceId === id && remaining[0]) {
        setSelectedEditInstanceId(remaining[0].id);
      }
      if (activeClientInstanceId === id && remaining[0]) {
        setActiveClientInstanceId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleCloneDemoInstance = (inst: ClientDemoInstance) => {
    const cloneSlug = `${inst.slug}-copy-${Math.floor(10 + Math.random() * 89)}`;
    const cloned: ClientDemoInstance = {
      ...JSON.parse(JSON.stringify(inst)),
      id: `demo-${Date.now()}`,
      slug: cloneSlug,
      clientName: {
        en: `${inst.clientName.en} (Clone)`,
        fr: `${inst.clientName.fr} (Copie)`,
        ar: `${inst.clientName.ar} (نسخة)`,
      },
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setDemoInstances((prev) => [cloned, ...prev]);
    setSelectedEditInstanceId(cloned.id);
  };

  const handleUnlockAdmin = () => {
    setSessionRole("admin");
    setIsAdminPreviewingClient(false);
  };

  const handleUnlockClientDemo = (inst: ClientDemoInstance) => {
    setActiveClientInstanceId(inst.id);
    setSessionRole("client_demo");
    setIsAdminPreviewingClient(false);
    setLocale(inst.defaultLocale);
    setTheme(inst.defaultColorMode);
    setActiveTab((inst.allowedTabs[0] as NavTab) || "overview");
  };

  const handlePreviewClientDemo = (inst: ClientDemoInstance) => {
    setActiveClientInstanceId(inst.id);
    setSessionRole("client_demo");
    setIsAdminPreviewingClient(true);
    setLocale(inst.defaultLocale);
    setTheme(inst.defaultColorMode);
    setActiveTab((inst.allowedTabs[0] as NavTab) || "overview");
  };

  const handleReturnToAdminFromPreview = () => {
    setSessionRole("admin");
    setIsAdminPreviewingClient(false);
  };

  const handleForceCloudSync = async () => {
    await persistToSupabaseCloud(demoInstances, platformConfig);
  };

  const handleExportFullJson = () =>
    JSON.stringify(
      {
        version: "3.0",
        exportedAt: new Date().toISOString(),
        platformConfig,
        demoInstances,
      },
      null,
      2
    );

  const handleImportFullJson = (rawJson: string): boolean => {
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed || typeof parsed !== "object") return false;
      if (parsed.platformConfig) {
        setPlatformConfig({
          ...DEFAULT_PLATFORM_CONFIG,
          ...parsed.platformConfig,
        });
      }
      if (
        Array.isArray(parsed.demoInstances) &&
        parsed.demoInstances.length > 0
      ) {
        setDemoInstances(hydrateInstancesWithFleet(parsed.demoInstances));
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleResetAllToFactory = () => {
    try {
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    } catch {
      // ignore
    }
    const freshDemos = hydrateInstancesWithFleet(INITIAL_DEMO_INSTANCES);
    setDemoInstances(freshDemos);
    setPlatformConfig(DEFAULT_PLATFORM_CONFIG);
    setSelectedEditInstanceId(freshDemos[0].id);
    setActiveClientInstanceId(freshDemos[0].id);
    persistToSupabaseCloud(freshDemos, DEFAULT_PLATFORM_CONFIG);
  };

  // Derived metrics for Active Client Demo View
  const t = TRANSLATIONS[locale];
  const company: CompanyProfile = useMemo(
    () => ({
      id: activeClientDemo.id,
      code: activeClientDemo.themeConfig.brandMonogram || "MA",
      name: activeClientDemo.clientName,
      city: activeClientDemo.city,
      defaultLocale: activeClientDemo.defaultLocale,
      taxIce: activeClientDemo.taxIce,
      totalFleetCount: activeClientDemo.totalFleetCount,
      activeTrucksCount: clientFleet.trucks.length,
    }),
    [activeClientDemo, clientFleet.trucks.length]
  );

  const fleetUtilizationPct = useMemo(() => {
    let totalMaxVol = 0;
    let totalUsedVol = 0;
    let totalMaxWeight = 0;
    let totalUsedWeight = 0;

    clientFleet.ltlTrucks.forEach((trk) => {
      const assigned = clientFleet.shipments.filter(
        (s) => s.assignedTruckId === trk.id
      );
      const addVol = assigned.reduce((acc, s) => acc + s.volumeM3, 0);
      const addWeight = assigned.reduce((acc, s) => acc + s.weightKg, 0);
      totalMaxVol += trk.maxVolumeM3;
      totalUsedVol += trk.baseVolumeM3 + addVol;
      totalMaxWeight += trk.maxWeightKg;
      totalUsedWeight += trk.baseWeightKg + addWeight;
    });

    const volRatio = totalMaxVol > 0 ? totalUsedVol / totalMaxVol : 0.75;
    const weightRatio =
      totalMaxWeight > 0 ? totalUsedWeight / totalMaxWeight : 0.75;
    return Math.min(
      98.5,
      Math.round(((volRatio * 0.55 + weightRatio * 0.45) * 100 + 18.2) * 10) / 10
    );
  }, [clientFleet.ltlTrucks, clientFleet.shipments]);

  const scaledLtlShipments = useMemo(
    () =>
      clientFleet.shipments.map((s) => ({
        ...s,
        fuelMadSaved: Math.round(s.fuelLitersSaved * fuelPriceMad),
      })),
    [clientFleet.shipments, fuelPriceMad]
  );

  const backhaulSavedMad = useMemo(
    () =>
      scaledLtlShipments
        .filter((s) => s.assignedTruckId !== null)
        .reduce((sum, s) => sum + s.fuelMadSaved, 0),
    [scaledLtlShipments]
  );

  const effectiveTheme = activeClientDemo?.themeConfig || DEFAULT_BRAND_THEME;

  const themeStyleVars = useMemo(() => {
    const latinObj =
      LATIN_FONT_OPTIONS.find((f) => f.id === effectiveTheme.latinFont) ||
      LATIN_FONT_OPTIONS[0];
    const arabicObj =
      ARABIC_FONT_OPTIONS.find((f) => f.id === effectiveTheme.arabicFont) ||
      ARABIC_FONT_OPTIONS[0];
    const monoObj =
      MONO_FONT_OPTIONS.find((f) => f.id === effectiveTheme.monoFont) ||
      MONO_FONT_OPTIONS[0];

    return {
      "--brand-600": effectiveTheme.primaryHex,
      "--brand-700":
        effectiveTheme.primaryHoverHex || effectiveTheme.primaryHex,
      "--brand-400":
        effectiveTheme.primaryLightHex || effectiveTheme.primaryHex,
      "--brand-50": `${effectiveTheme.primaryHex}14`,
      "--brand-200": `${effectiveTheme.primaryHex}40`,
      "--active-font-sans": `${latinObj.cssStack}, ${arabicObj.cssStack}`,
      "--active-font-arabic": `${arabicObj.cssStack}, ${latinObj.cssStack}`,
      "--active-font-mono": `${monoObj.cssStack}, ${arabicObj.cssStack}`,
    } as React.CSSProperties;
  }, [effectiveTheme]);

  // =========================================================================
  // VIEW 1: DUAL-GATE PORTAL LOGIN SCREEN (ROOT '/')
  // =========================================================================
  if (sessionRole === "gate") {
    return (
      <PortalAccessGate
        locale={locale}
        onChangeLocale={setLocale}
        theme={theme}
        onToggleTheme={() =>
          setTheme((prev) => (prev === "light" ? "dark" : "light"))
        }
        adminOwnerName={platformConfig.adminOwnerName}
        masterAdminPassword={platformConfig.masterAdminPassword}
        demoInstances={demoInstances}
        initialSlugFromUrl={initialSlugFromUrl}
        onUnlockAdmin={handleUnlockAdmin}
        onUnlockClientDemo={handleUnlockClientDemo}
      />
    );
  }

  // =========================================================================
  // VIEW 2: IBRAHIM'S DEDICATED MASTER ADMIN PORTAL (MULTI-INSTANCE CONTROL)
  // =========================================================================
  if (sessionRole === "admin") {
    return (
      <IbrahimAdminPortal
        locale={locale}
        onChangeLocale={setLocale}
        theme={theme}
        onToggleTheme={(next) =>
          setTheme((prev) => next || (prev === "light" ? "dark" : "light"))
        }
        t={t}
        config={platformConfig}
        onUpdateConfig={setPlatformConfig}
        demoInstances={demoInstances}
        selectedEditInstanceId={selectedEditInstanceId}
        onSelectEditInstanceId={setSelectedEditInstanceId}
        onAddDemoInstance={handleAddDemoInstance}
        onUpdateDemoInstance={handleUpdateDemoInstance}
        onDeleteDemoInstance={handleDeleteDemoInstance}
        onCloneDemoInstance={handleCloneDemoInstance}
        onPreviewClientDemo={handlePreviewClientDemo}
        activeEditInstanceFleet={builderFleet}
        onUpdateEditInstanceFuelPrice={builderHandlers.onUpdateFuelPrice}
        onAddEditInstanceFuelPurchase={builderHandlers.onAddFuelPurchase}
        onUpdateEditInstanceFuelPurchase={builderHandlers.onUpdateFuelPurchase}
        onDeleteEditInstanceFuelPurchase={builderHandlers.onDeleteFuelPurchase}
        onAddEditInstanceTruck={builderHandlers.onAddTruck}
        onUpdateEditInstanceTruck={builderHandlers.onUpdateTruck}
        onDeleteEditInstanceTruck={builderHandlers.onDeleteTruck}
        onAddEditInstanceDriver={builderHandlers.onAddDriver}
        onUpdateEditInstanceDriver={builderHandlers.onUpdateDriver}
        onDeleteEditInstanceDriver={builderHandlers.onDeleteDriver}
        onAddEditInstanceShipment={builderHandlers.onAddShipment}
        onUpdateEditInstanceShipment={builderHandlers.onUpdateShipment}
        onDeleteEditInstanceShipment={builderHandlers.onDeleteShipment}
        onBulkImportEditInstanceExcel={builderHandlers.onBulkImportExcel}
        onClearEditInstanceFleet={builderHandlers.onClearAllInstanceFleet}
        syncState={syncState}
        onForceCloudSync={handleForceCloudSync}
        onLockToPortalGate={() => setSessionRole("gate")}
        onResetAllToFactory={handleResetAllToFactory}
        onExportFullJson={handleExportFullJson}
        onImportFullJson={handleImportFullJson}
      />
    );
  }

  // =========================================================================
  // VIEW 3: CLIENT DEMO INSTANCE DASHBOARD (WHITE-LABELED PER PROSPECT)
  // =========================================================================
  const allClientNavItems: {
    id: NavTab;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }[] = [
    {
      id: "overview",
      label: t.nav.overview,
      desc: t.nav.overviewDesc,
      icon: LayoutDashboard,
    },
    {
      id: "live-map",
      label: t.nav.liveMap,
      desc: t.nav.liveMapDesc,
      icon: MapPinned,
      badge: clientFleet.alerts.filter((a) => !a.acknowledged).length,
    },
    {
      id: "ltl-optimizer",
      label: t.nav.ltlOptimizer,
      desc: t.nav.ltlOptimizerDesc,
      icon: Boxes,
      badge: `${
        clientFleet.shipments.filter((s) => s.assignedTruckId === null).length
      } LTL`,
    },
    {
      id: "driver-eco",
      label: t.nav.driverEco,
      desc: t.nav.driverEcoDesc,
      icon: Award,
    },
    {
      id: "fleet-manager",
      label: t.nav.fleetManager,
      desc: t.nav.fleetManagerDesc,
      icon: SlidersHorizontal,
      badge: `${clientFleet.trucks.length} / ${clientFleet.drivers.length}`,
    },
  ];

  const visibleNavItems = allClientNavItems.filter((item) =>
    activeClientDemo.allowedTabs.includes(item.id)
  );

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div
        dir={t.meta.dir}
        lang={locale}
        style={themeStyleVars}
        data-surface-style={effectiveTheme.surfaceStyle}
        className={`theme-root min-h-screen bg-[#F8FAFC] dark:bg-[#090A0F] text-slate-900 dark:text-zinc-100 flex flex-col transition-colors duration-200 ${
          t.meta.dir === "rtl" ? "font-arabic" : "font-sans"
        }`}
      >
        {/* Top Admin Preview Banner (Only shown when Ibrahim launches a Client View from his Admin Portal) */}
        {isAdminPreviewingClient && (
          <div className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="rounded bg-blue-600 px-2 py-0.5 font-mono text-[11px] font-bold">
                ADMIN PREVIEW
              </span>
              <span>
                Viewing Client Instance:{" "}
                <strong>{activeClientDemo.clientName.en}</strong> (
                <code className="text-blue-300">
                  /?demo={activeClientDemo.slug}
                </code>{" "}
                • PIN: <strong>{activeClientDemo.accessPin}</strong>) — All edits save live to this instance in Supabase.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-emerald-400">
                {syncState.status === "saving"
                  ? "Saving to Supabase..."
                  : `✓ Saved (${syncState.lastSavedTime})`}
              </span>
              <button
                type="button"
                onClick={handleReturnToAdminFromPreview}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 px-3 py-1 font-bold transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to {platformConfig.adminOwnerName} Master Admin Portal</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Client Instance White-Labeled Sidebar */}
          <aside
            className={`fixed inset-y-0 start-0 z-40 w-72 bg-white dark:bg-[#0E1017] border-e border-slate-200 dark:border-zinc-800/90 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
              mobileMenuOpen
                ? "translate-x-0"
                : t.meta.dir === "rtl"
                ? "translate-x-full lg:translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }`}
          >
            <div>
              {/* Brand Logo Header */}
              <div className="p-5 border-b border-slate-200 dark:border-zinc-800/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-mono font-bold text-xs shadow-sm">
                    {effectiveTheme.brandMonogram || "MA"}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-zinc-100 truncate max-w-[155px]">
                        {activeClientDemo.clientName[locale]}
                      </span>
                      <span className="rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-slate-600 dark:text-zinc-300">
                        {effectiveTheme.brandMonogram || "MA"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-[175px]">
                      {effectiveTheme.brandTagline || t.meta.appSubtitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Primary Navigation Tabs */}
              <nav className="p-3 space-y-1">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-start transition-all border ${
                        isActive
                          ? "bg-slate-900 dark:bg-zinc-800/90 border-slate-900 dark:border-zinc-700 text-white shadow-sm"
                          : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100/80 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-200 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-md border ${
                            isActive
                              ? "bg-white/15 border-white/20 text-white"
                              : "bg-slate-50 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-slate-500 dark:text-zinc-400"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-semibold block leading-tight">
                            {item.label}
                          </span>
                          <span
                            className={`text-[11px] block mt-0.5 ${
                              isActive
                                ? "text-slate-300 dark:text-zinc-400"
                                : "text-slate-400 dark:text-zinc-500"
                            }`}
                          >
                            {item.desc}
                          </span>
                        </div>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold border ${
                            isActive
                              ? "bg-white/15 border-white/20 text-white"
                              : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Moroccan Highway Corridor Status Pills */}
              <div className="px-4 py-3 mt-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                  {t.nav.corridorsTitle}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {[
                    {
                      axis: "A1 Tanger-Rabat",
                      status: "94% Flow",
                      dot: "bg-emerald-600",
                    },
                    {
                      axis: "A3 Casa-Rabat",
                      status: "Alert PK41",
                      dot: "bg-red-600",
                    },
                    {
                      axis: "A7 Casa-Agadir",
                      status: "Optimal",
                      dot: "bg-emerald-600",
                    },
                    {
                      axis: "N1 Laâyoune-Dakhla",
                      status: "Optimal",
                      dot: "bg-blue-600",
                    },
                  ].map((cor) => (
                    <div
                      key={cor.axis}
                      className="rounded-lg bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 px-2.5 py-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${cor.dot}`}
                        />
                        <span className="text-[10px] font-semibold text-slate-800 dark:text-zinc-200 truncate">
                          {cor.axis}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                        {cor.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Supabase PostgreSQL Realtime Status Card */}
            <div className="p-4 border-t border-slate-200 dark:border-zinc-800/90">
              <div
                onClick={() => setIsDbModalOpen(true)}
                className="cursor-pointer rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800 p-3 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-slate-600 dark:text-zinc-400" />
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-zinc-100">
                      Supabase Live Sync
                    </span>
                  </div>
                  <span
                    className={`flex h-2 w-2 rounded-full ${
                      syncState.status === "saving"
                        ? "bg-amber-400 animate-ping"
                        : "bg-emerald-600 dark:bg-emerald-500"
                    }`}
                  />
                </div>
                <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 mt-1 truncate">
                  {syncState.status === "saving"
                    ? "Saving to PostgreSQL..."
                    : `Saved @ ${syncState.lastSavedTime}`}
                </p>
              </div>
            </div>
          </aside>

          {/* Main Client Dashboard Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0E1017]/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/90 px-4 sm:px-6 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 text-slate-700 dark:text-zinc-300"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  {/* Locked Client Company Badge */}
                  <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5">
                    <Building2 className="h-4 w-4 text-slate-500 dark:text-zinc-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500 leading-none">
                        Dedicated Instance • ?demo={activeClientDemo.slug}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                        {activeClientDemo.clientName[locale]} —{" "}
                        {activeClientDemo.city[locale]}
                      </span>
                    </div>
                  </div>

                  {/* Inline Editable Gasoil Tariff Input */}
                  <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs">
                    <Fuel className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-slate-600 dark:text-zinc-400 font-medium">
                      {t.meta.fuelTariffLabel}
                    </span>
                    <input
                      type="number"
                      step="0.05"
                      min="5"
                      max="50"
                      value={fuelPriceMad}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          clientHandlers.onUpdateFuelPrice(val);
                        }
                      }}
                      className="w-16 rounded bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600"
                    />
                    <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                      MAD/L
                    </span>
                  </div>
                </div>

                {/* Right: Live Save Indicator + Light/Dark + Language + Sales CTA + Exit */}
                <div className="flex items-center gap-2">
                  <span className="hidden xl:inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1.5 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                    <RefreshCw
                      className={`h-3 w-3 ${
                        syncState.status === "saving" ? "animate-spin" : ""
                      }`}
                    />
                    <span>
                      {syncState.status === "saving"
                        ? "Saving..."
                        : `Supabase Synced`}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setTheme((prev) => (prev === "light" ? "dark" : "light"))
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
                  >
                    {theme === "light" ? (
                      <>
                        <Moon className="h-3.5 w-3.5 text-slate-600" />
                        <span>Dark</span>
                      </>
                    ) : (
                      <>
                        <Sun className="h-3.5 w-3.5 text-amber-400" />
                        <span>Light</span>
                      </>
                    )}
                  </button>

                  {/* Language Switcher */}
                  <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-800">
                    <Globe className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400 ms-2 me-1.5 hidden sm:inline" />
                    {(
                      [
                        { code: "en", label: "English", badge: "EN" },
                        { code: "fr", label: "Français", badge: "FR" },
                        { code: "ar", label: "العربية", badge: "عربي" },
                      ] as const
                    ).map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setLocale(lang.code)}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                          lang.code === "ar" ? "font-arabic" : ""
                        } ${
                          locale === lang.code
                            ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <span className="sm:hidden">{lang.badge}</span>
                        <span className="hidden sm:inline">{lang.label}</span>
                      </button>
                    ))}
                  </div>

                  {activeClientDemo.contactCtaLabel && (
                    <a
                      href={activeClientDemo.contactCtaUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors"
                    >
                      <span>{activeClientDemo.contactCtaLabel}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {isAdminPreviewingClient ? (
                    <button
                      type="button"
                      onClick={handleReturnToAdminFromPreview}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-3 py-1.5 text-xs font-semibold"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Admin Studio</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSessionRole("gate")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Exit Demo</span>
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* Main Client Dashboard Workspace */}
            <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeTab}-${locale}-${activeClientDemo.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {activeTab === "overview" && (
                    <OverviewPage
                      locale={locale}
                      t={t}
                      company={company}
                      fuelPriceMad={fuelPriceMad}
                      financials={DAILY_FINANCIALS_30D}
                      mapTrucks={clientFleet.trucks}
                      alerts={clientFleet.alerts}
                      fleetUtilizationPct={fleetUtilizationPct}
                      backhaulSavedMad={backhaulSavedMad}
                      onNavigateTab={setActiveTab}
                    />
                  )}

                  {activeTab === "live-map" && (
                    <LiveMapPage
                      locale={locale}
                      t={t}
                      theme={theme}
                      fuelPriceMad={fuelPriceMad}
                      trucks={clientFleet.trucks}
                      alerts={clientFleet.alerts}
                      isStreamRunning={isStreamRunning}
                      onToggleStream={() => setIsStreamRunning((v) => !v)}
                      onSimulateAlert={handleSimulateTelemetryEvent}
                      onAcknowledgeAlert={handleAcknowledgeAlert}
                      onStopTruckIdle={handleStopTruckIdle}
                    />
                  )}

                  {activeTab === "ltl-optimizer" && (
                    <LtlOptimizerPage
                      locale={locale}
                      t={t}
                      fuelPriceMad={fuelPriceMad}
                      trucks={clientFleet.ltlTrucks}
                      shipments={scaledLtlShipments}
                      onAssignShipment={handleAssignShipment}
                      onUnassignShipment={handleUnassignShipment}
                      onAutoOptimize={handleAutoOptimizeBackhauls}
                      onResetAssignments={handleResetLtl}
                      onUpdateLtlTruck={handleUpdateLtlTruck}
                      onAddShipment={handleAddLtlShipment}
                    />
                  )}

                  {activeTab === "driver-eco" && (
                    <DriverEcoPage
                      locale={locale}
                      t={t}
                      fuelPriceMad={fuelPriceMad}
                      drivers={clientFleet.drivers}
                    />
                  )}

                  {activeTab === "fleet-manager" && (
                    <FleetFuelManagerPage
                      locale={locale}
                      t={t}
                      fuelPriceMad={fuelPriceMad}
                      onUpdateFuelPrice={clientHandlers.onUpdateFuelPrice}
                      fuelPurchases={clientFleet.fuelPurchases}
                      onAddFuelPurchase={clientHandlers.onAddFuelPurchase}
                      onUpdateFuelPurchase={clientHandlers.onUpdateFuelPurchase}
                      onDeleteFuelPurchase={clientHandlers.onDeleteFuelPurchase}
                      trucks={clientFleet.trucks}
                      onAddTruck={clientHandlers.onAddTruck}
                      onUpdateTruck={clientHandlers.onUpdateTruck}
                      onDeleteTruck={clientHandlers.onDeleteTruck}
                      drivers={clientFleet.drivers}
                      onAddDriver={clientHandlers.onAddDriver}
                      onUpdateDriver={clientHandlers.onUpdateDriver}
                      onDeleteDriver={clientHandlers.onDeleteDriver}
                      shipments={clientFleet.shipments}
                      onAddShipment={clientHandlers.onAddShipment}
                      onUpdateShipment={clientHandlers.onUpdateShipment}
                      onDeleteShipment={clientHandlers.onDeleteShipment}
                      onBulkImportExcel={clientHandlers.onBulkImportExcel}
                      onClearAllInstanceFleet={
                        clientHandlers.onClearAllInstanceFleet
                      }
                      instanceSlug={activeClientDemo.slug}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>

        {/* Supabase PostgreSQL Schema & JSON State Modal */}
        <SupabaseModal
          isOpen={isDbModalOpen}
          onClose={() => setIsDbModalOpen(false)}
          t={t}
          trucks={clientFleet.trucks}
          alerts={clientFleet.alerts}
          shipments={scaledLtlShipments}
          drivers={clientFleet.drivers}
        />
      </div>
    </div>
  );
}
