"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
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
  Menu,
  X,
  Sun,
  Moon,
  Lock,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  CheckSquare,
  Palette,
  Save,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Megaphone,
  CheckCircle2,
} from "lucide-react";
import {
  ARABIC_FONT_OPTIONS,
  ClientDemoInstance,
  ClientDemoTabId,
  CompanyProfile,
  computeInstanceFinancials30d,
  DEFAULT_BRAND_THEME,
  DEFAULT_PLATFORM_CONFIG,
  DIESEL_PRICE_MAD_PER_LITER,
  DriverEcoRecord,
  FleetOperationalTask,
  FuelPurchaseRecord,
  INITIAL_DEMO_INSTANCES,
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
import { TasksOperationsPage } from "@/components/TasksOperationsPage";
import { ClientBrandingStudioPage } from "@/components/ClientBrandingStudioPage";
import { PortalAccessGate } from "@/components/PortalAccessGate";
import { IbrahimAdminPortal } from "@/components/IbrahimAdminPortal";
import { SupabaseModal } from "@/components/SupabaseModal";

type NavTab = ClientDemoTabId;

const WORKSPACE_STORAGE_KEY = "atlaslogix_morocco_workspace_v4_zero";

function getDefaultFleetData(): InstanceFleetData {
  return {
    trucks: [],
    ltlTrucks: [],
    shipments: [],
    drivers: [],
    fuelPurchases: [],
    alerts: [],
    tasks: [],
  };
}

function hydrateInstancesWithFleet(
  list: ClientDemoInstance[]
): ClientDemoInstance[] {
  return list.map((inst) => {
    const existingTabs = Array.isArray(inst.allowedTabs)
      ? inst.allowedTabs
      : ["overview", "live-map", "ltl-optimizer", "driver-eco", "fleet-manager"];
    const mergedTabs: ClientDemoTabId[] = Array.from(
      new Set([
        ...existingTabs,
        "tasks",
        "fleet-manager",
        "company-branding",
      ] as ClientDemoTabId[])
    );

    return {
      ...inst,
      allowedTabs: mergedTabs,
      themeConfig: {
        ...DEFAULT_BRAND_THEME,
        ...(inst.themeConfig || {}),
      },
      fleetData: {
        trucks: Array.isArray(inst.fleetData?.trucks)
          ? inst.fleetData.trucks
          : [],
        ltlTrucks: Array.isArray(inst.fleetData?.ltlTrucks)
          ? inst.fleetData.ltlTrucks
          : [],
        shipments: Array.isArray(inst.fleetData?.shipments)
          ? inst.fleetData.shipments
          : [],
        drivers: Array.isArray(inst.fleetData?.drivers)
          ? inst.fleetData.drivers
          : [],
        fuelPurchases: Array.isArray(inst.fleetData?.fuelPurchases)
          ? inst.fleetData.fuelPurchases
          : [],
        alerts: Array.isArray(inst.fleetData?.alerts)
          ? inst.fleetData.alerts
          : [],
        tasks: Array.isArray(inst.fleetData?.tasks)
          ? inst.fleetData.tasks
          : [],
      },
    };
  });
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

  const [activeClientInstanceId, setActiveClientInstanceId] = useState<string>(
    INITIAL_DEMO_INSTANCES[0]?.id || ""
  );
  const [selectedEditInstanceId, setSelectedEditInstanceId] = useState<string>(
    INITIAL_DEMO_INSTANCES[0]?.id || ""
  );
  const [isAdminPreviewingClient, setIsAdminPreviewingClient] =
    useState<boolean>(false);
  const [initialSlugFromUrl, setInitialSlugFromUrl] = useState<string | null>(
    null
  );

  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isStreamRunning, setIsStreamRunning] = useState<boolean>(true);
  const [hydrated, setHydrated] = useState(false);

  // Strict Explicit Save Tracking & Baseline Snapshot for Undo/Discard
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [explicitSaveBannerMsg, setExplicitSaveBannerMsg] = useState<
    string | null
  >(null);
  const lastSavedSnapshotRef = useRef<{
    demoInstances: ClientDemoInstance[];
    platformConfig: PlatformSystemConfig;
  }>({
    demoInstances: [],
    platformConfig: DEFAULT_PLATFORM_CONFIG,
  });

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
        if (Array.isArray(parsed.demoInstances)) {
          const hydratedList = hydrateInstancesWithFleet(parsed.demoInstances);
          setDemoInstances(hydratedList);
          if (hydratedList[0]) {
            setActiveClientInstanceId((prev) => prev || hydratedList[0].id);
            setSelectedEditInstanceId((prev) => prev || hydratedList[0].id);
          }
          lastSavedSnapshotRef.current = {
            demoInstances: JSON.parse(JSON.stringify(hydratedList)),
            platformConfig: JSON.parse(JSON.stringify(localCfg)),
          };
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

    // Pull latest live state from Supabase PostgreSQL
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
        const hydratedCloud = Array.isArray(cloudDemos)
          ? hydrateInstancesWithFleet(cloudDemos)
          : [];
        setDemoInstances(hydratedCloud);
        if (hydratedCloud[0]) {
          setActiveClientInstanceId((prev) => prev || hydratedCloud[0].id);
          setSelectedEditInstanceId((prev) => prev || hydratedCloud[0].id);
        }
        const params = new URLSearchParams(window.location.search);
        const slugParam = params.get("demo");
        if (slugParam && hydratedCloud.length > 0) {
          const matched = hydratedCloud.find(
            (d) => d.slug.toLowerCase() === slugParam.toLowerCase()
          );
          if (matched) {
            setActiveClientInstanceId(matched.id);
            setSelectedEditInstanceId(matched.id);
          }
        }

        let resolvedCfg = localCfg;
        if (cloudSettings?.platformConfig) {
          resolvedCfg = {
            ...localCfg,
            ...cloudSettings.platformConfig,
            supabaseUrl: DEFAULT_PLATFORM_CONFIG.supabaseUrl,
            supabaseAnonKey: DEFAULT_PLATFORM_CONFIG.supabaseAnonKey,
          };
          setPlatformConfig(resolvedCfg);
        }

        lastSavedSnapshotRef.current = {
          demoInstances: JSON.parse(JSON.stringify(hydratedCloud)),
          platformConfig: JSON.parse(JSON.stringify(resolvedCfg)),
        };
        setHasUnsavedChanges(false);

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

  // Warn before closing browser tab if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Explicit Cloud Save Function (Commits staged changes to LocalStorage + Supabase PostgreSQL)
  const persistToSupabaseCloud = useCallback(
    async (
      instancesToSave: ClientDemoInstance[],
      configToSave: PlatformSystemConfig
    ) => {
      setSyncState((prev) => ({
        ...prev,
        status: "saving",
        message: "Saving progress to Supabase PostgreSQL...",
      }));

      try {
        window.localStorage.setItem(
          WORKSPACE_STORAGE_KEY,
          JSON.stringify({
            theme,
            locale,
            platformConfig: configToSave,
            demoInstances: instancesToSave,
          })
        );
      } catch {
        // ignore quota
      }

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
      lastSavedSnapshotRef.current = {
        demoInstances: JSON.parse(JSON.stringify(instancesToSave)),
        platformConfig: JSON.parse(JSON.stringify(configToSave)),
      };
      setHasUnsavedChanges(false);

      if (demosRes.ok && settingsRes.ok) {
        setSyncState({
          status: "synced",
          lastSavedTime: nowStr,
          message: `All progress saved to Supabase (${nowStr})`,
        });
        setExplicitSaveBannerMsg(
          `Progress saved to Supabase PostgreSQL at ${nowStr}`
        );
        setTimeout(() => setExplicitSaveBannerMsg(null), 4000);
      } else {
        setSyncState({
          status: "error",
          lastSavedTime: nowStr,
          message: demosRes.message || "Saved locally (Supabase sync warning)",
        });
      }
    },
    [theme, locale]
  );

  const handleExplicitSaveProgress = useCallback(async () => {
    await persistToSupabaseCloud(demoInstances, platformConfig);
  }, [demoInstances, platformConfig, persistToSupabaseCloud]);

  const handleDiscardUnsavedProgress = useCallback(() => {
    const snap = lastSavedSnapshotRef.current;
    setDemoInstances(JSON.parse(JSON.stringify(snap.demoInstances)));
    setPlatformConfig(JSON.parse(JSON.stringify(snap.platformConfig)));
    setHasUnsavedChanges(false);
    setExplicitSaveBannerMsg(
      "Discarded unsaved edits and restored last saved progress."
    );
    setTimeout(() => setExplicitSaveBannerMsg(null), 4000);
  }, []);

  // Helper to get or mutate any instance's isolated data (stages in draft + flags hasUnsavedChanges)
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
      setHasUnsavedChanges(true);
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
            nextFleet.trucks.length
          ),
          fleetData: nextFleet,
        };
      });
    },
    [updateSpecificInstance]
  );

  const clientId = activeClientDemo?.id || "";
  const clientFleet = useMemo(
    () => activeClientDemo?.fleetData || getDefaultFleetData(),
    [activeClientDemo]
  );
  const fuelPriceMad =
    activeClientDemo?.fuelPriceMad ?? DIESEL_PRICE_MAD_PER_LITER;

  const builderId = activeEditInstance?.id || "";
  const builderFleet = useMemo(
    () => activeEditInstance?.fleetData || getDefaultFleetData(),
    [activeEditInstance]
  );

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
        fuelPurchases: [
          { ...purchase, id: `fp-${Date.now()}` },
          ...f.fuelPurchases,
        ],
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
        ltlTrucks: f.ltlTrucks.filter((t) => t.id !== `ltl-${truckId}`),
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
    onAddTask: (newTask: FleetOperationalTask) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        tasks: [newTask, ...(f.tasks || [])],
      }));
    },
    onUpdateTask: (updatedTask: FleetOperationalTask) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        tasks: (f.tasks || []).map((t) =>
          t.id === updatedTask.id ? updatedTask : t
        ),
      }));
    },
    onDeleteTask: (taskId: string) => {
      updateSpecificInstanceFleet(targetId, (f) => ({
        ...f,
        tasks: (f.tasks || []).filter((t) => t.id !== taskId),
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
            tasks: f.tasks || [],
          };
        }

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
        tasks: [],
      }));
    },
  });

  const clientHandlers = makeInstanceHandlers(clientId);
  const builderHandlers = makeInstanceHandlers(builderId);

  // LTL Handlers for Active Client Demo View
  const handleAssignShipment = (
    shipmentId: string,
    truckId: string
  ): boolean => {
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
      shipments: f.shipments.map((s) => ({ ...s, assignedTruckId: null })),
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
    const firstTruck = clientFleet.trucks[0];
    if (!firstTruck) return;
    const nowStr = new Date().toTimeString().slice(0, 8);
    const newAlert: TelemetryAlert = {
      id: `sim-alt-${Date.now()}`,
      truckCode: firstTruck.code,
      truckId: firstTruck.id,
      type: "idling",
      severity: "warning",
      timestamp: nowStr,
      corridor: firstTruck.corridor,
      idleMinutes: 18,
      wastedFuelLiters: 5.4,
      wastedFuelMad: Math.round(5.4 * fuelPriceMad * 100) / 100,
      text: {
        en: `${firstTruck.code} - Idling extended to 18 mins on ${firstTruck.corridor}`,
        fr: `${firstTruck.code} - Ralenti prolongé à 18 min sur ${firstTruck.corridor}`,
        ar: `${firstTruck.code} - استمرار الخمول لمدة 18 دقيقة على ${firstTruck.corridor}`,
      },
      detail: {
        en: "Telemetry Alert • 5.4 L wasted",
        fr: "Alerte Télémétrie • 5,4 L gaspillés",
        ar: "تنبيه القياس عن بعد • هدر 5.4 لتر",
      },
      acknowledged: false,
    };
    updateSpecificInstanceFleet(clientId, (f) => ({
      ...f,
      alerts: [newAlert, ...f.alerts],
    }));
  };

  // Demo Instance CRUD Handlers for Ibrahim's Master Admin Portal
  const handleAddDemoInstance = (inst: ClientDemoInstance) => {
    const hydratedInst = hydrateInstancesWithFleet([inst])[0];
    const nextList = [hydratedInst, ...demoInstances];
    setDemoInstances(nextList);
    setActiveClientInstanceId(hydratedInst.id);
    setSelectedEditInstanceId(hydratedInst.id);
    // Creating a new instance explicitly saves to Supabase right away
    persistToSupabaseCloud(nextList, platformConfig);
  };

  const handleUpdateDemoInstance = (updatedInst: ClientDemoInstance) => {
    const hydratedUpdated = hydrateInstancesWithFleet([updatedInst])[0];
    const nextList = demoInstances.map((d) =>
      d.id === hydratedUpdated.id ? hydratedUpdated : d
    );
    setDemoInstances(nextList);
    persistToSupabaseCloud(nextList, platformConfig);
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
    const remaining = demoInstances.filter((d) => d.id !== id);
    setDemoInstances(remaining);
    if (selectedEditInstanceId === id) {
      setSelectedEditInstanceId(remaining[0]?.id || "");
    }
    if (activeClientInstanceId === id) {
      setActiveClientInstanceId(remaining[0]?.id || "");
    }
    persistToSupabaseCloud(remaining, platformConfig);
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
    const nextList = [cloned, ...demoInstances];
    setDemoInstances(nextList);
    setSelectedEditInstanceId(cloned.id);
    persistToSupabaseCloud(nextList, platformConfig);
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
        version: "4.0",
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
      const nextCfg = parsed.platformConfig
        ? { ...DEFAULT_PLATFORM_CONFIG, ...parsed.platformConfig }
        : platformConfig;
      const nextDemos = Array.isArray(parsed.demoInstances)
        ? hydrateInstancesWithFleet(parsed.demoInstances)
        : demoInstances;
      setPlatformConfig(nextCfg);
      setDemoInstances(nextDemos);
      persistToSupabaseCloud(nextDemos, nextCfg);
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
    demoInstances.forEach((inst) => {
      deleteDemoInstanceFromSupabase(
        platformConfig.supabaseUrl,
        platformConfig.supabaseAnonKey,
        inst.slug
      );
    });
    setDemoInstances([]);
    setPlatformConfig(DEFAULT_PLATFORM_CONFIG);
    setSelectedEditInstanceId("");
    setActiveClientInstanceId("");
    persistToSupabaseCloud([], DEFAULT_PLATFORM_CONFIG);
  };

  // Derived metrics for Active Client Demo View (100% real data, 0 when empty)
  const t = TRANSLATIONS[locale];
  const company: CompanyProfile = useMemo(
    () => ({
      id: activeClientDemo?.id || "clean-instance",
      code: activeClientDemo?.themeConfig.brandMonogram || "MA",
      name: activeClientDemo?.clientName || {
        en: "Client Instance",
        fr: "Instance Client",
        ar: "منصة العميل",
      },
      city: activeClientDemo?.city || {
        en: "Casablanca",
        fr: "Casablanca",
        ar: "الدار البيضاء",
      },
      defaultLocale: activeClientDemo?.defaultLocale || "fr",
      taxIce: activeClientDemo?.taxIce || "000000000000000",
      totalFleetCount:
        activeClientDemo?.totalFleetCount ?? clientFleet.trucks.length,
      activeTrucksCount: clientFleet.trucks.length,
    }),
    [activeClientDemo, clientFleet.trucks.length]
  );

  const dynamicFinancials30d = useMemo(
    () => computeInstanceFinancials30d(clientFleet, fuelPriceMad),
    [clientFleet, fuelPriceMad]
  );

  const fleetUtilizationPct = useMemo(() => {
    if (clientFleet.ltlTrucks.length === 0 && clientFleet.trucks.length === 0) {
      return 0;
    }
    if (clientFleet.ltlTrucks.length === 0) {
      const avg =
        clientFleet.trucks.reduce(
          (s, t) => s + (t.cargoUtilizationPct || 0),
          0
        ) / clientFleet.trucks.length;
      return Math.round(avg * 10) / 10;
    }

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

    const volRatio = totalMaxVol > 0 ? totalUsedVol / totalMaxVol : 0;
    const weightRatio =
      totalMaxWeight > 0 ? totalUsedWeight / totalMaxWeight : 0;
    return Math.min(
      100,
      Math.round((volRatio * 0.55 + weightRatio * 0.45) * 1000) / 10
    );
  }, [clientFleet.ltlTrucks, clientFleet.trucks, clientFleet.shipments]);

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

  // Dynamically computed sidebar highway corridor statuses (0 when no trucks on corridor)
  const sidebarCorridors = useMemo(() => {
    const axes = [
      { axis: "A1 Tanger-Rabat", match: "A1" },
      { axis: "A3 Casa-Rabat", match: "A3" },
      { axis: "A7 Casa-Agadir", match: "A7" },
      { axis: "N1 Laâyoune-Dakhla", match: "N1" },
    ];
    return axes.map((a) => {
      const trks = clientFleet.trucks.filter((t) =>
        (t.corridor || "").toUpperCase().includes(a.match)
      );
      const hasAlert = trks.some((t) => t.status === "alert");
      const hasIdle = trks.some((t) => t.status === "idling");
      return {
        axis: a.axis,
        status:
          trks.length === 0
            ? "0 Trucks"
            : `${trks.length} Truck${trks.length > 1 ? "s" : ""}`,
        dot:
          trks.length === 0
            ? "bg-slate-400"
            : hasAlert
            ? "bg-red-600"
            : hasIdle
            ? "bg-amber-500"
            : "bg-emerald-600",
      };
    });
  }, [clientFleet.trucks]);

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
  if (sessionRole === "admin" || !activeClientDemo) {
    return (
      <>
        {hasUnsavedChanges && (
          <div className="sticky top-0 z-50 bg-amber-500 text-slate-950 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold shadow-md">
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-950 text-amber-400 px-2 py-0.5 font-mono text-[11px]">
                UNSAVED PROGRESS
              </span>
              <span>
                You have unsaved changes in this session. Click &ldquo;Save Progress to Supabase&rdquo; to commit your work or &ldquo;Discard&rdquo; to undo.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscardUnsavedProgress}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900/15 hover:bg-slate-900/25 px-3 py-1.5 text-xs font-bold"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Discard / Undo</span>
              </button>
              <button
                type="button"
                onClick={handleExplicitSaveProgress}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white px-4 py-1.5 text-xs font-bold shadow-sm"
              >
                <Save className="h-3.5 w-3.5 text-emerald-400" />
                <span>Save Progress to Supabase</span>
              </button>
            </div>
          </div>
        )}
        <IbrahimAdminPortal
          locale={locale}
          onChangeLocale={setLocale}
          theme={theme}
          onToggleTheme={(next) =>
            setTheme((prev) => next || (prev === "light" ? "dark" : "light"))
          }
          t={t}
          config={platformConfig}
          onUpdateConfig={(nextCfg) => {
            setPlatformConfig(nextCfg);
            persistToSupabaseCloud(demoInstances, nextCfg);
          }}
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
      </>
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
      badge: clientFleet.drivers.length,
    },
    {
      id: "tasks",
      label:
        locale === "ar"
          ? "المهام والعمليات"
          : locale === "fr"
          ? "Tâches & Opérations"
          : "Tasks & Operations",
      desc:
        locale === "ar"
          ? "جدولة المهام والصيانة"
          : locale === "fr"
          ? "Dispatch, maintenance & suivi"
          : "Dispatch, maintenance & checklist",
      icon: CheckSquare,
      badge: (clientFleet.tasks || []).filter((x) => x.status !== "completed")
        .length,
    },
    {
      id: "fleet-manager",
      label: t.nav.fleetManager,
      desc: t.nav.fleetManagerDesc,
      icon: SlidersHorizontal,
      badge: `${clientFleet.trucks.length} / ${clientFleet.drivers.length}`,
    },
    {
      id: "company-branding",
      label:
        locale === "ar"
          ? "هوية الشركة والشعار"
          : locale === "fr"
          ? "Entreprise, Logo & En-tête"
          : "Company, Logo & Header/Footer",
      desc:
        locale === "ar"
          ? "الشعار والترويسة والتذييل"
          : locale === "fr"
          ? "Logo, en-tête, pied de page"
          : "Logo, header, footer & theme",
      icon: Palette,
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
        {/* Sticky Unsaved Progress Bar (Protects against accidental mistakes until explicit Save is clicked) */}
        {hasUnsavedChanges && (
          <div className="sticky top-0 z-50 bg-amber-500 text-slate-950 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold shadow-md">
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-950 text-amber-400 px-2 py-0.5 font-mono text-[11px]">
                UNSAVED CHANGES
              </span>
              <span>
                You have unsaved edits in{" "}
                <strong>{activeClientDemo.clientName[locale]}</strong>. Click{" "}
                <strong>&ldquo;Save Progress to Supabase&rdquo;</strong> to
                commit or <strong>&ldquo;Discard&rdquo;</strong> to undo.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscardUnsavedProgress}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900/15 hover:bg-slate-900/25 px-3 py-1.5 text-xs font-bold"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Discard / Undo</span>
              </button>
              <button
                type="button"
                onClick={handleExplicitSaveProgress}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white px-4 py-1.5 text-xs font-bold shadow-sm"
              >
                <Save className="h-3.5 w-3.5 text-emerald-400" />
                <span>Save Progress to Supabase</span>
              </button>
            </div>
          </div>
        )}

        {/* Explicit Save Confirmation Banner */}
        {explicitSaveBannerMsg && (
          <div className="bg-emerald-600 text-white px-4 sm:px-6 py-2 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{explicitSaveBannerMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setExplicitSaveBannerMsg(null)}
              className="underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Custom Client Top Announcement Bar (When configured in Header Studio) */}
        {effectiveTheme.headerAnnouncement && (
          <div
            style={{ backgroundColor: effectiveTheme.primaryHex }}
            className="text-white px-4 sm:px-6 py-1.5 flex items-center justify-center gap-2 text-xs font-semibold"
          >
            <Megaphone className="h-3.5 w-3.5 shrink-0" />
            <span>{effectiveTheme.headerAnnouncement}</span>
          </div>
        )}

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
                • PIN: <strong>{activeClientDemo.accessPin}</strong>)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExplicitSaveProgress}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 font-bold transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Progress to Supabase</span>
              </button>
              <button
                type="button"
                onClick={handleReturnToAdminFromPreview}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 px-3 py-1 font-bold transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>
                  Back to {platformConfig.adminOwnerName} Master Admin Portal
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Client Instance White-Labeled Collapsible Sidebar */}
          <aside
            className={`fixed inset-y-0 start-0 z-40 ${
              isSidebarCollapsed ? "lg:w-20" : "lg:w-72"
            } w-72 bg-white dark:bg-[#0E1017] border-e border-slate-200 dark:border-zinc-800/90 flex flex-col justify-between transition-all duration-300 lg:static lg:translate-x-0 ${
              mobileMenuOpen
                ? "translate-x-0"
                : t.meta.dir === "rtl"
                ? "translate-x-full lg:translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }`}
          >
            <div>
              {/* Brand Logo Header + Collapse Toggle */}
              <div className="p-4 border-b border-slate-200 dark:border-zinc-800/90 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {effectiveTheme.logoDataUrl ? (
                    <img
                      src={effectiveTheme.logoDataUrl}
                      alt={activeClientDemo.clientName[locale]}
                      className="h-10 w-10 rounded-lg object-contain bg-white border border-slate-200 p-1 shrink-0 shadow-sm"
                    />
                  ) : (
                    <div
                      style={{ backgroundColor: effectiveTheme.primaryHex }}
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-mono font-bold text-xs shadow-sm shrink-0"
                    >
                      {effectiveTheme.brandMonogram || "MA"}
                    </div>
                  )}

                  {!isSidebarCollapsed && (
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-zinc-100 truncate">
                          {effectiveTheme.headerTitle ||
                            activeClientDemo.clientName[locale]}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                        {effectiveTheme.headerSubtitle ||
                          effectiveTheme.brandTagline ||
                          t.meta.appSubtitle}
                      </p>
                    </div>
                  )}
                </div>

                {/* Desktop Collapse / Expand Button */}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed((v) => !v)}
                  title={
                    isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"
                  }
                  className="hidden lg:inline-flex rounded-lg p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-white shrink-0"
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Primary Navigation Tabs */}
              <nav className="p-2.5 space-y-1">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={item.label}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center ${
                        isSidebarCollapsed
                          ? "justify-center px-2 py-2.5"
                          : "justify-between px-3 py-2.5"
                      } rounded-lg text-start transition-all border ${
                        isActive
                          ? "bg-slate-900 dark:bg-zinc-800/90 border-slate-900 dark:border-zinc-700 text-white shadow-sm"
                          : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100/80 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-200 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                            isActive
                              ? "bg-white/15 border-white/20 text-white"
                              : "bg-slate-50 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-slate-500 dark:text-zinc-400"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {!isSidebarCollapsed && (
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-semibold block leading-tight truncate">
                              {item.label}
                            </span>
                            <span
                              className={`text-[11px] block mt-0.5 truncate ${
                                isActive
                                  ? "text-slate-300 dark:text-zinc-400"
                                  : "text-slate-400 dark:text-zinc-500"
                              }`}
                            >
                              {item.desc}
                            </span>
                          </div>
                        )}
                      </div>

                      {!isSidebarCollapsed && item.badge !== undefined && (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold border shrink-0 ${
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

              {/* Dynamic Moroccan Highway Corridor Status Pills (100% Real Computed) */}
              {!isSidebarCollapsed && (
                <div className="px-4 py-3 mt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                    {t.nav.corridorsTitle}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {sidebarCorridors.map((cor) => (
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
              )}
            </div>

            {/* Bottom Explicit Save & Supabase Status Card */}
            <div className="p-3 border-t border-slate-200 dark:border-zinc-800/90 space-y-2">
              <button
                type="button"
                onClick={handleExplicitSaveProgress}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold text-white shadow-sm transition-all ${
                  hasUnsavedChanges
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
                title="Save Progress to Supabase"
              >
                <Save className="h-3.5 w-3.5 shrink-0" />
                {!isSidebarCollapsed && (
                  <span>
                    {hasUnsavedChanges
                      ? "Save Unsaved Changes *"
                      : "Save Progress"}
                  </span>
                )}
              </button>

              {!isSidebarCollapsed && (
                <div
                  onClick={() => setIsDbModalOpen(true)}
                  className="cursor-pointer rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800 p-2.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 text-slate-600 dark:text-zinc-400" />
                      <span className="text-[11px] font-bold font-mono text-slate-900 dark:text-zinc-100">
                        Supabase Cloud
                      </span>
                    </div>
                    <span
                      className={`flex h-2 w-2 rounded-full ${
                        syncState.status === "saving"
                          ? "bg-amber-400 animate-ping"
                          : hasUnsavedChanges
                          ? "bg-amber-500"
                          : "bg-emerald-600 dark:bg-emerald-500"
                      }`}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                    {syncState.status === "saving"
                      ? "Saving to PostgreSQL..."
                      : hasUnsavedChanges
                      ? "Draft modified (Click Save)"
                      : `Saved @ ${syncState.lastSavedTime}`}
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* Main Client Dashboard Content Area */}
          <div className="flex-1 flex flex-col min-w-0 justify-between">
            <div>
              {/* Custom Client Header */}
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

                    {/* Client Company Identity & Logo Pill */}
                    <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5">
                      {effectiveTheme.logoDataUrl ? (
                        <img
                          src={effectiveTheme.logoDataUrl}
                          alt={activeClientDemo.clientName[locale]}
                          className="h-6 w-6 rounded object-contain bg-white border border-slate-200 p-0.5 shrink-0"
                        />
                      ) : (
                        <Building2 className="h-4 w-4 text-slate-500 dark:text-zinc-400 shrink-0" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500 leading-none">
                          {effectiveTheme.headerSubtitle ||
                            `Instance • ?demo=${activeClientDemo.slug}`}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                          {effectiveTheme.headerTitle ||
                            activeClientDemo.clientName[locale]}{" "}
                          — {activeClientDemo.city[locale]}
                        </span>
                      </div>
                    </div>

                    {/* Support / Dispatch Contact Phone Badge (If set in Header Studio) */}
                    {effectiveTheme.headerContactPhone && (
                      <div className="hidden xl:flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-mono text-slate-700 dark:text-zinc-300">
                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{effectiveTheme.headerContactPhone}</span>
                      </div>
                    )}

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

                  {/* Right: Prominent Save Progress Button + Light/Dark + Language + Exit */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExplicitSaveProgress}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all ${
                        hasUnsavedChanges
                          ? "bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-400/40"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      <Save
                        className={`h-3.5 w-3.5 ${
                          syncState.status === "saving" ? "animate-spin" : ""
                        }`}
                      />
                      <span>
                        {syncState.status === "saving"
                          ? "Saving..."
                          : hasUnsavedChanges
                          ? "Save Progress *"
                          : "Save Progress"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setTheme((prev) =>
                          prev === "light" ? "dark" : "light"
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
                    >
                      {theme === "light" ? (
                        <>
                          <Moon className="h-3.5 w-3.5 text-slate-600" />
                          <span className="hidden sm:inline">Dark</span>
                        </>
                      ) : (
                        <>
                          <Sun className="h-3.5 w-3.5 text-amber-400" />
                          <span className="hidden sm:inline">Light</span>
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
                        <span>Exit</span>
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
                        financials={dynamicFinancials30d}
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
                        onUpdateDriver={clientHandlers.onUpdateDriver}
                        onExplicitSaveToCloud={handleExplicitSaveProgress}
                      />
                    )}

                    {activeTab === "tasks" && (
                      <TasksOperationsPage
                        locale={locale}
                        tasks={clientFleet.tasks || []}
                        trucks={clientFleet.trucks}
                        drivers={clientFleet.drivers}
                        onAddTask={clientHandlers.onAddTask}
                        onUpdateTask={clientHandlers.onUpdateTask}
                        onDeleteTask={clientHandlers.onDeleteTask}
                        onExplicitSaveToCloud={handleExplicitSaveProgress}
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
                        onUpdateFuelPurchase={
                          clientHandlers.onUpdateFuelPurchase
                        }
                        onDeleteFuelPurchase={
                          clientHandlers.onDeleteFuelPurchase
                        }
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

                    {activeTab === "company-branding" && (
                      <ClientBrandingStudioPage
                        instance={activeClientDemo}
                        locale={locale}
                        onSaveInstance={async (updated) => {
                          const merged: ClientDemoInstance = {
                            ...updated,
                            fleetData: activeClientDemo.fleetData,
                          };
                          handleUpdateDemoInstance(merged);
                        }}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>

            {/* Custom Client White-Labeled Footer */}
            <footer className="bg-white dark:bg-[#0E1017] border-t border-slate-200 dark:border-zinc-800/90 px-4 sm:px-6 py-4 mt-8">
              <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
                <div className="flex flex-wrap items-center gap-3">
                  {effectiveTheme.logoDataUrl ? (
                    <img
                      src={effectiveTheme.logoDataUrl}
                      alt={activeClientDemo.clientName[locale]}
                      className="h-6 w-6 rounded object-contain bg-white border border-slate-200 p-0.5"
                    />
                  ) : (
                    <span
                      style={{ backgroundColor: effectiveTheme.primaryHex }}
                      className="h-6 w-6 rounded flex items-center justify-center text-white font-mono font-bold text-[10px]"
                    >
                      {effectiveTheme.brandMonogram || "MA"}
                    </span>
                  )}
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {effectiveTheme.footerCompanyLegal ||
                      activeClientDemo.clientName[locale]}
                  </span>
                  {effectiveTheme.footerAddress && (
                    <span>• {effectiveTheme.footerAddress}</span>
                  )}
                  {activeClientDemo.taxIce && (
                    <span className="font-mono text-[11px]">
                      • ICE: {activeClientDemo.taxIce}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    {effectiveTheme.footerCopyright ||
                      `© ${new Date().getFullYear()} ${activeClientDemo.clientName[locale]}. All rights reserved.`}
                  </span>
                  {(effectiveTheme.footerShowPoweredBy ?? true) && (
                    <span className="rounded-md bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2.5 py-1 text-[11px] font-mono text-slate-600 dark:text-zinc-400">
                      Powered by AtlasLogix • Managed by{" "}
                      {platformConfig.adminOwnerName}
                    </span>
                  )}
                </div>
              </div>
            </footer>
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
