"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Truck,
  Radio,
  Menu,
  X,
  Sun,
  Moon,
  Settings,
  Lock,
  ShieldCheck,
  ExternalLink,
  ArrowLeft,
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
  fetchDemoInstancesFromSupabase,
  syncDemoInstancesToSupabase,
} from "@/lib/supabase/demoSync";
import { TRANSLATIONS } from "@/lib/i18n/translations";
import { OverviewPage } from "@/components/OverviewPage";
import { LiveMapPage } from "@/components/LiveMapPage";
import { LtlOptimizerPage } from "@/components/LtlOptimizerPage";
import { DriverEcoPage } from "@/components/DriverEcoPage";
import { FleetFuelManagerPage } from "@/components/FleetFuelManagerPage";
import { SystemConfigPage } from "@/components/SystemConfigPage";
import { PortalAccessGate } from "@/components/PortalAccessGate";
import { SupabaseModal } from "@/components/SupabaseModal";

type NavTab =
  | "overview"
  | "live-map"
  | "ltl-optimizer"
  | "driver-eco"
  | "fleet-manager"
  | "system-config";

const WORKSPACE_STORAGE_KEY = "atlaslogix_morocco_workspace_v2";

export default function MoroccoFleetDashboard() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [locale, setLocale] = useState<Locale>("en");
  const [companiesList, setCompaniesList] = useState<CompanyProfile[]>(COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(COMPANIES[0].id);
  const [platformConfig, setPlatformConfig] =
    useState<PlatformSystemConfig>(DEFAULT_PLATFORM_CONFIG);
  const [demoInstances, setDemoInstances] =
    useState<ClientDemoInstance[]>(INITIAL_DEMO_INSTANCES);

  // Dual-Gate Protection State: "gate" | "admin" | "client_demo"
  const [sessionRole, setSessionRole] = useState<"gate" | "admin" | "client_demo">("gate");
  const [activeClientDemo, setActiveClientDemo] = useState<ClientDemoInstance | null>(null);
  const [isAdminPreviewingClient, setIsAdminPreviewingClient] = useState<boolean>(false);
  const [initialSlugFromUrl, setInitialSlugFromUrl] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Dynamic Fuel Price (MAD/L) & Fuel Purchases State
  const [fuelPriceMad, setFuelPriceMad] = useState<number>(DIESEL_PRICE_MAD_PER_LITER);
  const [fuelPurchases, setFuelPurchases] =
    useState<FuelPurchaseRecord[]>(INITIAL_FUEL_PURCHASES);

  // Dynamic Fleet (Trucks, Drivers, Alerts, LTL Shipments, LTL Trucks)
  const [mapTrucks, setMapTrucks] = useState<MapTruck[]>(INITIAL_MAP_TRUCKS);
  const [ltlTrucks, setLtlTrucks] = useState<LtlTruck[]>(INITIAL_LTL_TRUCKS);
  const [drivers, setDrivers] = useState<DriverEcoRecord[]>(INITIAL_DRIVER_ECO_SCORES);
  const [alerts, setAlerts] = useState<TelemetryAlert[]>(INITIAL_TELEMETRY_ALERTS);
  const [ltlShipments, setLtlShipments] = useState<LtlShipment[]>(INITIAL_LTL_SHIPMENTS);
  const [isStreamRunning, setIsStreamRunning] = useState<boolean>(true);
  const [simCounter, setSimCounter] = useState<number>(1);

  // Load persisted GUI workspace configuration & URL ?demo=<slug> on mount
  useEffect(() => {
    let loadedConfig = DEFAULT_PLATFORM_CONFIG;
    try {
      const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.locale) setLocale(parsed.locale);
        if (Array.isArray(parsed.companiesList) && parsed.companiesList.length > 0) {
          setCompaniesList(parsed.companiesList);
        }
        if (parsed.selectedCompanyId) setSelectedCompanyId(parsed.selectedCompanyId);
        if (parsed.platformConfig) {
          const cleanSbUrl =
            !parsed.platformConfig.supabaseUrl ||
            parsed.platformConfig.supabaseUrl.includes("atlaslogix-maroc.supabase.co")
              ? DEFAULT_PLATFORM_CONFIG.supabaseUrl
              : parsed.platformConfig.supabaseUrl;
          const cleanSbKey =
            !parsed.platformConfig.supabaseAnonKey
              ? DEFAULT_PLATFORM_CONFIG.supabaseAnonKey
              : parsed.platformConfig.supabaseAnonKey;
          loadedConfig = {
            ...DEFAULT_PLATFORM_CONFIG,
            ...parsed.platformConfig,
            supabaseUrl: cleanSbUrl,
            supabaseAnonKey: cleanSbKey,
            githubRepoUrl:
              parsed.platformConfig.githubRepoUrl?.includes("github.com/ibrahim")
                ? DEFAULT_PLATFORM_CONFIG.githubRepoUrl
                : parsed.platformConfig.githubRepoUrl ||
                  DEFAULT_PLATFORM_CONFIG.githubRepoUrl,
            dataMode: "supabase_live",
            activeTheme: {
              ...DEFAULT_BRAND_THEME,
              ...(parsed.platformConfig.activeTheme || {}),
            },
          };
          setPlatformConfig(loadedConfig);
        }
        if (Array.isArray(parsed.demoInstances) && parsed.demoInstances.length > 0) {
          setDemoInstances(parsed.demoInstances);
        }
        if (typeof parsed.fuelPriceMad === "number") setFuelPriceMad(parsed.fuelPriceMad);
        if (Array.isArray(parsed.fuelPurchases)) setFuelPurchases(parsed.fuelPurchases);
        if (Array.isArray(parsed.mapTrucks)) setMapTrucks(parsed.mapTrucks);
        if (Array.isArray(parsed.ltlTrucks)) setLtlTrucks(parsed.ltlTrucks);
        if (Array.isArray(parsed.drivers)) setDrivers(parsed.drivers);
        if (Array.isArray(parsed.ltlShipments)) setLtlShipments(parsed.ltlShipments);
      }

      // Check URL query string for ?demo=<slug>
      const params = new URLSearchParams(window.location.search);
      const demoParam = params.get("demo");
      if (demoParam) {
        setInitialSlugFromUrl(demoParam);
        setSessionRole("gate");
      } else if (!loadedConfig.requireGateOnRoot) {
        setSessionRole("admin");
      }
    } catch {
      // Ignore malformed storage
    } finally {
      setHydrated(true);
    }

    // Also pull latest cloud demo instances from Supabase if connected
    fetchDemoInstancesFromSupabase(
      loadedConfig.supabaseUrl,
      loadedConfig.supabaseAnonKey
    ).then((cloudDemos) => {
      if (cloudDemos && cloudDemos.length > 0) {
        setDemoInstances(cloudDemos);
      }
    });
  }, []);

  // Automatically persist all GUI configuration, themes, demo instances & fleet changes to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      const snapshot = {
        theme,
        locale,
        companiesList,
        selectedCompanyId,
        platformConfig,
        demoInstances,
        fuelPriceMad,
        fuelPurchases,
        mapTrucks,
        ltlTrucks,
        drivers,
        ltlShipments,
      };
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore quota errors
    }
  }, [
    hydrated,
    theme,
    locale,
    companiesList,
    selectedCompanyId,
    platformConfig,
    demoInstances,
    fuelPriceMad,
    fuelPurchases,
    mapTrucks,
    ltlTrucks,
    drivers,
    ltlShipments,
  ]);

  const t = TRANSLATIONS[locale];

  // When a prospect is logged into their protected Client Demo, override the active company & theme with their dedicated instance
  const company: CompanyProfile = useMemo(() => {
    if (sessionRole === "client_demo" && activeClientDemo) {
      return {
        id: activeClientDemo.id,
        code: activeClientDemo.themeConfig.brandMonogram || "MA",
        name: activeClientDemo.clientName,
        city: activeClientDemo.city,
        defaultLocale: activeClientDemo.defaultLocale,
        taxIce: activeClientDemo.taxIce,
        totalFleetCount: activeClientDemo.totalFleetCount,
        activeTrucksCount: activeClientDemo.activeTrucksCount,
      };
    }
    return (
      companiesList.find((c) => c.id === selectedCompanyId) || companiesList[0]
    );
  }, [sessionRole, activeClientDemo, companiesList, selectedCompanyId]);

  const effectiveTheme = useMemo(() => {
    if (sessionRole === "client_demo" && activeClientDemo) {
      return activeClientDemo.themeConfig;
    }
    return platformConfig.activeTheme || DEFAULT_BRAND_THEME;
  }, [sessionRole, activeClientDemo, platformConfig.activeTheme]);

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
      "--brand-700": effectiveTheme.primaryHoverHex || effectiveTheme.primaryHex,
      "--brand-400": effectiveTheme.primaryLightHex || effectiveTheme.primaryHex,
      "--brand-50": `${effectiveTheme.primaryHex}14`,
      "--brand-200": `${effectiveTheme.primaryHex}40`,
      "--active-font-sans": `${latinObj.cssStack}, ${arabicObj.cssStack}`,
      "--active-font-arabic": `${arabicObj.cssStack}, ${latinObj.cssStack}`,
      "--active-font-mono": `${monoObj.cssStack}, ${arabicObj.cssStack}`,
    } as React.CSSProperties;
  }, [effectiveTheme]);

  // --- Client Demo Instances CRUD & Session Handlers ---
  const handleAddDemoInstance = (inst: ClientDemoInstance) => {
    setDemoInstances((prev) => {
      const next = [inst, ...prev];
      syncDemoInstancesToSupabase(
        platformConfig.supabaseUrl,
        platformConfig.supabaseAnonKey,
        next
      );
      return next;
    });
  };

  const handleUpdateDemoInstance = (updatedInst: ClientDemoInstance) => {
    setDemoInstances((prev) => {
      const next = prev.map((d) => (d.id === updatedInst.id ? updatedInst : d));
      syncDemoInstancesToSupabase(
        platformConfig.supabaseUrl,
        platformConfig.supabaseAnonKey,
        next
      );
      return next;
    });
  };

  const handleDeleteDemoInstance = (id: string) => {
    setDemoInstances((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSyncDemosToSupabase = async () => {
    return syncDemoInstancesToSupabase(
      platformConfig.supabaseUrl,
      platformConfig.supabaseAnonKey,
      demoInstances
    );
  };

  const handleUnlockAdmin = () => {
    setSessionRole("admin");
    setActiveClientDemo(null);
    setIsAdminPreviewingClient(false);
  };

  const handleUnlockClientDemo = (inst: ClientDemoInstance) => {
    setActiveClientDemo(inst);
    setSessionRole("client_demo");
    setIsAdminPreviewingClient(false);
    setLocale(inst.defaultLocale);
    setTheme(inst.defaultColorMode);
    setFuelPriceMad(inst.fuelPriceMad);
    setActiveTab(inst.allowedTabs[0] || "overview");
  };

  const handlePreviewClientDemo = (inst: ClientDemoInstance) => {
    setActiveClientDemo(inst);
    setSessionRole("client_demo");
    setIsAdminPreviewingClient(true);
    setLocale(inst.defaultLocale);
    setTheme(inst.defaultColorMode);
    setFuelPriceMad(inst.fuelPriceMad);
    setActiveTab(inst.allowedTabs[0] || "overview");
  };

  const handleReturnToAdminFromPreview = () => {
    setSessionRole("admin");
    setActiveClientDemo(null);
    setIsAdminPreviewingClient(false);
    setActiveTab("system-config");
  };

  const handleSelectCompany = (compId: string) => {
    setSelectedCompanyId(compId);
    const found = companiesList.find((c) => c.id === compId);
    if (found) {
      setLocale(found.defaultLocale);
    }
  };

  // --- Company Profile CRUD & System Configuration Handlers ---
  const handleAddCompany = (newComp: CompanyProfile) => {
    setCompaniesList((prev) => [...prev, newComp]);
  };

  const handleUpdateCompany = (updatedComp: CompanyProfile) => {
    setCompaniesList((prev) =>
      prev.map((c) => (c.id === updatedComp.id ? updatedComp : c))
    );
  };

  const handleDeleteCompany = (compId: string) => {
    setCompaniesList((prev) => {
      const filtered = prev.filter((c) => c.id !== compId);
      if (selectedCompanyId === compId && filtered[0]) {
        setSelectedCompanyId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleApplyThresholdsToFleet = () => {
    setDrivers((prev) =>
      prev.map((d) => {
        const badge: "green" | "yellow" | "red" =
          d.ecoScore >= platformConfig.ecoGreenMinScore
            ? "green"
            : d.ecoScore >= platformConfig.ecoYellowMinScore
            ? "yellow"
            : "red";
        return {
          ...d,
          targetEfficiencyL100km: platformConfig.targetFleetConsumptionL100km,
          idleWastedMad30d: Math.round(
            (d.totalIdleMinutes30d / 60) *
              platformConfig.idleFuelBurnLitersPerHour *
              fuelPriceMad
          ),
          badge,
        };
      })
    );
  };

  const handleExportFullJson = (): string => {
    return JSON.stringify(
      {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        theme,
        locale,
        companiesList,
        selectedCompanyId,
        platformConfig,
        fuelPriceMad,
        fuelPurchases,
        mapTrucks,
        ltlTrucks,
        drivers,
        ltlShipments,
      },
      null,
      2
    );
  };

  const handleImportFullJson = (rawJson: string): boolean => {
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed || typeof parsed !== "object") return false;
      if (parsed.theme) setTheme(parsed.theme);
      if (parsed.locale) setLocale(parsed.locale);
      if (Array.isArray(parsed.companiesList)) setCompaniesList(parsed.companiesList);
      if (parsed.selectedCompanyId) setSelectedCompanyId(parsed.selectedCompanyId);
      if (parsed.platformConfig) {
        setPlatformConfig({ ...DEFAULT_PLATFORM_CONFIG, ...parsed.platformConfig });
      }
      if (typeof parsed.fuelPriceMad === "number") setFuelPriceMad(parsed.fuelPriceMad);
      if (Array.isArray(parsed.fuelPurchases)) setFuelPurchases(parsed.fuelPurchases);
      if (Array.isArray(parsed.mapTrucks)) setMapTrucks(parsed.mapTrucks);
      if (Array.isArray(parsed.ltlTrucks)) setLtlTrucks(parsed.ltlTrucks);
      if (Array.isArray(parsed.drivers)) setDrivers(parsed.drivers);
      if (Array.isArray(parsed.ltlShipments)) setLtlShipments(parsed.ltlShipments);
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
    setCompaniesList(COMPANIES);
    setSelectedCompanyId(COMPANIES[0].id);
    setPlatformConfig(DEFAULT_PLATFORM_CONFIG);
    setFuelPriceMad(DIESEL_PRICE_MAD_PER_LITER);
    setFuelPurchases(INITIAL_FUEL_PURCHASES);
    setMapTrucks(INITIAL_MAP_TRUCKS);
    setLtlTrucks(INITIAL_LTL_TRUCKS);
    setDrivers(INITIAL_DRIVER_ECO_SCORES);
    setAlerts(INITIAL_TELEMETRY_ALERTS);
    setLtlShipments(INITIAL_LTL_SHIPMENTS);
  };

  // --- Fuel Purchases CRUD Handlers ---
  const handleAddFuelPurchase = (purchase: Omit<FuelPurchaseRecord, "id">) => {
    const newEntry: FuelPurchaseRecord = {
      ...purchase,
      id: `fp-${Date.now()}`,
    };
    setFuelPurchases((prev) => [newEntry, ...prev]);
  };

  const handleUpdateFuelPurchase = (updated: FuelPurchaseRecord) => {
    setFuelPurchases((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleDeleteFuelPurchase = (id: string) => {
    setFuelPurchases((prev) => prev.filter((p) => p.id !== id));
  };

  // --- Trucks CRUD Handlers ---
  const handleAddTruck = (newTruck: MapTruck) => {
    setMapTrucks((prev) => [newTruck, ...prev]);
    // Also register the truck in the LTL Optimizer with its custom Pallets/Volume/Weight capacities
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
    setLtlTrucks((prev) => [...prev, ltlEntry]);
  };

  const handleUpdateLtlTruck = (updatedLtlTruck: LtlTruck) => {
    setLtlTrucks((prev) =>
      prev.map((trk) => (trk.id === updatedLtlTruck.id ? updatedLtlTruck : trk))
    );
  };

  const handleAddLtlShipment = (newShipment: LtlShipment) => {
    setLtlShipments((prev) => [newShipment, ...prev]);
  };

  const handleUpdateTruck = (updatedTruck: MapTruck) => {
    setMapTrucks((prev) =>
      prev.map((trk) => (trk.id === updatedTruck.id ? updatedTruck : trk))
    );
  };

  const handleDeleteTruck = (truckId: string) => {
    setMapTrucks((prev) => prev.filter((trk) => trk.id !== truckId));
  };

  // --- Drivers CRUD Handlers (with auto-rerank by Eco-Score) ---
  const rerankDrivers = (list: DriverEcoRecord[]): DriverEcoRecord[] => {
    return list
      .toSorted((a, b) => b.ecoScore - a.ecoScore)
      .map((d, idx) => ({ ...d, rank: idx + 1 }));
  };

  const handleAddDriver = (newDriver: DriverEcoRecord) => {
    setDrivers((prev) => rerankDrivers([...prev, newDriver]));
  };

  const handleUpdateDriver = (updatedDriver: DriverEcoRecord) => {
    setDrivers((prev) =>
      rerankDrivers(
        prev.map((d) => (d.id === updatedDriver.id ? updatedDriver : d))
      )
    );
  };

  const handleDeleteDriver = (driverId: string) => {
    setDrivers((prev) =>
      rerankDrivers(prev.filter((d) => d.id !== driverId))
    );
  };

  // Compute live Fleet Capacity Utilization (%) linked to LTL Optimizer state
  const fleetUtilizationPct = useMemo(() => {
    let totalMaxVol = 0;
    let totalUsedVol = 0;
    let totalMaxWeight = 0;
    let totalUsedWeight = 0;

    ltlTrucks.forEach((trk) => {
      const assigned = ltlShipments.filter((s) => s.assignedTruckId === trk.id);
      const addVol = assigned.reduce((acc, s) => acc + s.volumeM3, 0);
      const addWeight = assigned.reduce((acc, s) => acc + s.weightKg, 0);
      totalMaxVol += trk.maxVolumeM3;
      totalUsedVol += trk.baseVolumeM3 + addVol;
      totalMaxWeight += trk.maxWeightKg;
      totalUsedWeight += trk.baseWeightKg + addWeight;
    });

    const volRatio = totalUsedVol / totalMaxVol;
    const weightRatio = totalUsedWeight / totalMaxWeight;
    return Math.min(
      98.5,
      Math.round(((volRatio * 0.55 + weightRatio * 0.45) * 100 + 18.2) * 10) / 10
    );
  }, [ltlShipments, ltlTrucks]);

  // Dynamically scale LTL shipment fuel savings to active fuelPriceMad
  const scaledLtlShipments = useMemo(() => {
    return ltlShipments.map((s) => ({
      ...s,
      fuelMadSaved: Math.round(s.fuelLitersSaved * fuelPriceMad),
    }));
  }, [ltlShipments, fuelPriceMad]);

  const backhaulSavedMad = useMemo(() => {
    return scaledLtlShipments
      .filter((s) => s.assignedTruckId !== null)
      .reduce((sum, s) => sum + s.fuelMadSaved, 0);
  }, [scaledLtlShipments]);

  // LTL Handlers
  const handleAssignShipment = (shipmentId: string, truckId: string): boolean => {
    const shipment = ltlShipments.find((s) => s.id === shipmentId);
    const truck = ltlTrucks.find((trk) => trk.id === truckId);
    if (!shipment || !truck) return false;

    const existing = ltlShipments.filter((s) => s.assignedTruckId === truckId);
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

    setLtlShipments((prev) =>
      prev.map((s) => (s.id === shipmentId ? { ...s, assignedTruckId: truckId } : s))
    );
    return true;
  };

  const handleUnassignShipment = (shipmentId: string) => {
    setLtlShipments((prev) =>
      prev.map((s) => (s.id === shipmentId ? { ...s, assignedTruckId: null } : s))
    );
  };

  const handleAutoOptimizeBackhauls = () => {
    setLtlShipments((prev) => {
      const updated = prev.map((s) => ({ ...s }));
      updated.forEach((shp) => {
        if (shp.assignedTruckId !== null) return;
        const targetTruck = ltlTrucks.find(
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
      return updated;
    });
  };

  const handleResetLtl = () => {
    setLtlShipments(INITIAL_LTL_SHIPMENTS);
  };

  // Telemetry & Map Handlers
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  };

  const handleStopTruckIdle = (truckId: string) => {
    setMapTrucks((prev) =>
      prev.map((trk) =>
        trk.id === truckId
          ? { ...trk, status: "moving", speedKmh: 62, idleMinutes: 0, fuelRateLph: 22.4 }
          : trk
      )
    );
    setAlerts((prev) =>
      prev.map((a) =>
        a.truckId === truckId && a.type === "idling"
          ? { ...a, acknowledged: true }
          : a
      )
    );
  };

  const handleSimulateTelemetryEvent = () => {
    const nowStr = new Date().toTimeString().slice(0, 8);
    const simulatedTemplates: Omit<TelemetryAlert, "id" | "timestamp">[] = [
      {
        truckCode: "Truck 12",
        truckId: "trk-12",
        type: "idling",
        severity: "warning",
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
      },
      {
        truckCode: "Truck 08",
        truckId: "trk-08",
        type: "harsh_braking",
        severity: "critical",
        corridor: "A3",
        text: {
          en: "Truck 08 - Harsh Braking on A3 near Bouznika Toll",
          fr: "Camion 08 - Freinage brusque sur l'A3 près du péage Bouznika",
          ar: "شاحنة 08 - فرملة مفاجئة على الطريق السيار A3 قرب محطة بوزنيقة",
        },
        detail: {
          en: "ADAS Forward Collision Warning triggered • Speed 78 → 35 km/h",
          fr: "Alerte anticollision ADAS activée • Vitesse 78 → 35 km/h",
          ar: "تفعيل تنبيه الاصطدام الأمامي • السرعة من 78 إلى 35 كم/س",
        },
        acknowledged: false,
      },
      {
        truckCode: "Truck 36",
        truckId: "trk-36",
        type: "backhaul",
        severity: "info",
        corridor: "N1 Laâyoune-Dakhla",
        text: {
          en: "Truck 36 - Backhaul Match Assigned (Dakhla → Agadir - 5 Pallets)",
          fr: "Camion 36 - Fret retour LTL assigné (Dakhla → Agadir - 5 Palettes)",
          ar: "شاحنة 36 - تطابق شحنة عودة (الداخلة ← أكادير - 5 طبليات)",
        },
        detail: {
          en: "Prevents 480 empty km on N1 return leg",
          fr: "Évite 480 km à vide sur le retour N1",
          ar: "يمنع 480 كم فارغة على محور N1",
        },
        acknowledged: false,
      },
    ];

    const pick = simulatedTemplates[(simCounter - 1) % simulatedTemplates.length];
    setSimCounter((c) => c + 1);

    const newAlert: TelemetryAlert = {
      ...pick,
      id: `sim-alt-${Date.now()}`,
      timestamp: nowStr,
    };

    setAlerts((prev) => [newAlert, ...prev]);
  };

  useEffect(() => {
    if (!isStreamRunning) return;
    const interval = setInterval(() => {
      setMapTrucks((prev) =>
        prev.map((trk) => {
          if (trk.status === "moving") {
            const deltaSpeed = Math.round((Math.random() - 0.5) * 4);
            const nextSpeed = Math.max(68, Math.min(90, trk.speedKmh + deltaSpeed));
            return { ...trk, speedKmh: nextSpeed };
          }
          return trk;
        })
      );
    }, 4500);
    return () => clearInterval(interval);
  }, [isStreamRunning]);

  const navItems: {
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
      badge: alerts.filter((a) => !a.acknowledged).length,
    },
    {
      id: "ltl-optimizer",
      label: t.nav.ltlOptimizer,
      desc: t.nav.ltlOptimizerDesc,
      icon: Boxes,
      badge: `${ltlShipments.filter((s) => s.assignedTruckId === null).length} LTL`,
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
      badge: `${mapTrucks.length} / ${drivers.length}`,
    },
    {
      id: "system-config",
      label:
        locale === "ar"
          ? "إعدادات النظام والسحابة"
          : locale === "fr"
          ? "Studio Config & Cloud"
          : "GUI Config & Cloud",
      desc:
        locale === "ar"
          ? "Vercel • GitHub • Supabase"
          : locale === "fr"
          ? "Vercel • GitHub • Supabase"
          : "Vercel • GitHub • Supabase",
      icon: Settings,
      badge: "GUI",
    },
  ];

  const visibleNavItems = useMemo(() => {
    if (sessionRole === "client_demo" && activeClientDemo) {
      return navItems.filter(
        (item) =>
          item.id !== "system-config" &&
          activeClientDemo.allowedTabs.includes(item.id as any)
      );
    }
    return navItems;
  }, [navItems, sessionRole, activeClientDemo]);

  if (sessionRole === "gate") {
    return (
      <PortalAccessGate
        locale={locale}
        onChangeLocale={setLocale}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
        adminOwnerName={platformConfig.adminOwnerName}
        masterAdminPassword={platformConfig.masterAdminPassword}
        demoInstances={demoInstances}
        initialSlugFromUrl={initialSlugFromUrl}
        onUnlockAdmin={handleUnlockAdmin}
        onUnlockClientDemo={handleUnlockClientDemo}
      />
    );
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div
        dir={t.meta.dir}
        lang={locale}
        style={themeStyleVars}
        data-surface-style={effectiveTheme.surfaceStyle}
        className={`theme-root min-h-screen bg-[#F8FAFC] dark:bg-[#090A0F] text-slate-900 dark:text-zinc-100 flex flex-col lg:flex-row transition-colors duration-200 ${
          t.meta.dir === "rtl" ? "font-arabic" : "font-sans"
        }`}
      >
        {/* Executive Institutional Sidebar Navigation */}
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
                      {sessionRole === "client_demo" && activeClientDemo
                        ? activeClientDemo.clientName[locale]
                        : t.meta.appTitle}
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
                  { axis: "A1 Tanger-Rabat", status: "94% Flow", dot: "bg-emerald-600" },
                  { axis: "A3 Casa-Rabat", status: "Alert PK41", dot: "bg-red-600" },
                  { axis: "A7 Casa-Agadir", status: "Optimal", dot: "bg-emerald-600" },
                  { axis: "N1 Laâyoune-Dakhla", status: "Optimal", dot: "bg-blue-600" },
                ].map((cor) => (
                  <div
                    key={cor.axis}
                    className="rounded-lg bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 px-2.5 py-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${cor.dot}`} />
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
                    {t.nav.dbConnectionTitle}
                  </span>
                </div>
                <span className="flex h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                {t.nav.dbTablesSynced}
              </p>
              <div className="mt-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span>{t.meta.inspectDbButton} →</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Utility, Inline Fuel Tariff Editor, Light/Dark Toggle & Multilingual Switcher Bar */}
          <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0E1017]/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/90 px-4 sm:px-6 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Left: Mobile Menu Button + Active Company Selector + Inline Manual Fuel Price Entry */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 text-slate-700 dark:text-zinc-300"
                >
                  <Menu className="h-5 w-5" />
                </button>

                {/* Company Profile Selector (Locked to Client Name when in Client Demo mode) */}
                <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5">
                  <Building2 className="h-4 w-4 text-slate-500 dark:text-zinc-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500 leading-none">
                      {sessionRole === "client_demo"
                        ? "Dedicated Client Demo"
                        : t.meta.companySelectorLabel}
                    </span>
                    {sessionRole === "client_demo" && activeClientDemo ? (
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                        {activeClientDemo.clientName[locale]} — {activeClientDemo.city[locale]}
                      </span>
                    ) : (
                      <select
                        aria-label={t.meta.companySelectorLabel}
                        value={selectedCompanyId}
                        onChange={(e) => handleSelectCompany(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer mt-0.5"
                      >
                        {companiesList.map((comp) => (
                          <option
                            key={comp.id}
                            value={comp.id}
                            className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
                          >
                            {comp.name[locale]} — {comp.city[locale]} (
                            {comp.defaultLocale.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Inline Editable Gasoil Tariff Input + Quick Link to Fuel Purchases */}
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
                    aria-label="Manual Fuel Price MAD per Liter"
                    value={fuelPriceMad}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        setFuelPriceMad(Math.round(val * 100) / 100);
                      }
                    }}
                    className="w-16 rounded bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600"
                  />
                  <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                    MAD/L
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("fleet-manager")}
                    className="ms-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t.manager.tabFuel} →
                  </button>
                </div>
              </div>

              {/* Right: Light/Dark Mode Toggle + Language Switcher (EN | FR | العربية) + DB Inspector */}
              <div className="flex items-center gap-2">
                {/* Light / Dark Mode Toggle Button */}
                <button
                  type="button"
                  onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
                  aria-label="Toggle Light or Dark Theme"
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
                <div
                  role="group"
                  aria-label="Language Switcher"
                  className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-800"
                >
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

                {sessionRole === "client_demo" && activeClientDemo ? (
                  <>
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
                        <span>Exit Preview ({platformConfig.adminOwnerName})</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSessionRole("gate")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Lock Demo</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab("system-config")}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        activeTab === "system-config"
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200"
                      }`}
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">
                        {locale === "ar"
                          ? "الإعدادات"
                          : locale === "fr"
                          ? "Studio Admin"
                          : "Admin Studio"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSessionRole("gate")}
                      title="Lock Portal / View Client & Admin Login Gate"
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span className="hidden xl:inline">Gate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsDbModalOpen(true)}
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-mono font-semibold text-slate-700 dark:text-zinc-300 transition-colors"
                    >
                      <Radio className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Supabase</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Main Workspace Container */}
          <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${locale}`}
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
                    mapTrucks={mapTrucks}
                    alerts={alerts}
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
                    trucks={mapTrucks}
                    alerts={alerts}
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
                    trucks={ltlTrucks}
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
                    drivers={drivers}
                  />
                )}

                {activeTab === "fleet-manager" && (
                  <FleetFuelManagerPage
                    locale={locale}
                    t={t}
                    fuelPriceMad={fuelPriceMad}
                    onUpdateFuelPrice={setFuelPriceMad}
                    fuelPurchases={fuelPurchases}
                    onAddFuelPurchase={handleAddFuelPurchase}
                    onUpdateFuelPurchase={handleUpdateFuelPurchase}
                    onDeleteFuelPurchase={handleDeleteFuelPurchase}
                    trucks={mapTrucks}
                    onAddTruck={handleAddTruck}
                    onUpdateTruck={handleUpdateTruck}
                    onDeleteTruck={handleDeleteTruck}
                    drivers={drivers}
                    onAddDriver={handleAddDriver}
                    onUpdateDriver={handleUpdateDriver}
                    onDeleteDriver={handleDeleteDriver}
                  />
                )}

                {activeTab === "system-config" && sessionRole === "admin" && (
                  <SystemConfigPage
                    locale={locale}
                    theme={theme}
                    onToggleTheme={setTheme}
                    onChangeLocale={setLocale}
                    config={platformConfig}
                    onUpdateConfig={setPlatformConfig}
                    fuelPriceMad={fuelPriceMad}
                    onUpdateFuelPrice={setFuelPriceMad}
                    companies={companiesList}
                    selectedCompanyId={selectedCompanyId}
                    onSelectCompany={handleSelectCompany}
                    onAddCompany={handleAddCompany}
                    onUpdateCompany={handleUpdateCompany}
                    onDeleteCompany={handleDeleteCompany}
                    demoInstances={demoInstances}
                    onAddDemoInstance={handleAddDemoInstance}
                    onUpdateDemoInstance={handleUpdateDemoInstance}
                    onDeleteDemoInstance={handleDeleteDemoInstance}
                    onPreviewClientDemo={handlePreviewClientDemo}
                    onSyncDemosToSupabase={handleSyncDemosToSupabase}
                    onLockToPortalGate={() => setSessionRole("gate")}
                    onApplyThresholdsToFleet={handleApplyThresholdsToFleet}
                    onResetAllToFactory={handleResetAllToFactory}
                    onExportFullJson={handleExportFullJson}
                    onImportFullJson={handleImportFullJson}
                    counts={{
                      trucks: mapTrucks.length,
                      ltlTrucks: ltlTrucks.length,
                      shipments: ltlShipments.length,
                      drivers: drivers.length,
                      fuelPurchases: fuelPurchases.length,
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Supabase PostgreSQL Schema & JSON State Modal */}
        <SupabaseModal
          isOpen={isDbModalOpen}
          onClose={() => setIsDbModalOpen(false)}
          t={t}
          trucks={mapTrucks}
          alerts={alerts}
          shipments={scaledLtlShipments}
          drivers={drivers}
        />
      </div>
    </div>
  );
}
