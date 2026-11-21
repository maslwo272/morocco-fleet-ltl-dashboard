"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  Copy,
  Check,
  Share2,
  Eye,
  Trash2,
  Palette,
  Sliders,
  Database,
  Lock,
  RefreshCw,
  Layers,
  CopyPlus,
  Type,
  Sun,
  Moon,
  Globe,
  Download,
  RotateCcw,
  Save,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import {
  ARABIC_FONT_OPTIONS,
  ArabicFontId,
  BRAND_COLOR_PRESETS,
  BrandColorPresetId,
  BrandThemeConfig,
  ClientDemoInstance,
  ClientDemoTabId,
  DriverEcoRecord,
  FuelPurchaseRecord,
  InstanceFleetData,
  LATIN_FONT_OPTIONS,
  LatinFontId,
  Locale,
  LtlShipment,
  MapTruck,
  MONO_FONT_OPTIONS,
  MonoFontId,
  MOROCCO_CITY_COORDS,
  PlatformSystemConfig,
  SurfaceStyleId,
} from "@/lib/supabase/database";
import {
  downloadFleetExcelTemplate,
  ParsedExcelImportResult,
  parseFleetExcelFile,
} from "@/lib/excel/fleetWorkbook";
import { TranslationDictionary } from "@/lib/i18n/translations";
import { FleetFuelManagerPage } from "./FleetFuelManagerPage";
import {
  ConfirmDeleteModal,
  DeleteConfirmationRequest,
} from "./ConfirmDeleteModal";

interface IbrahimAdminPortalProps {
  locale: Locale;
  onChangeLocale: (loc: Locale) => void;
  theme: "light" | "dark";
  onToggleTheme: (next?: "light" | "dark") => void;
  t: TranslationDictionary;
  config: PlatformSystemConfig;
  onUpdateConfig: (nextConfig: PlatformSystemConfig) => void;
  demoInstances: ClientDemoInstance[];
  selectedEditInstanceId: string;
  onSelectEditInstanceId: (id: string) => void;
  onAddDemoInstance: (inst: ClientDemoInstance) => void;
  onUpdateDemoInstance: (inst: ClientDemoInstance) => void;
  onDeleteDemoInstance: (id: string) => void;
  onCloneDemoInstance: (inst: ClientDemoInstance) => void;
  onPreviewClientDemo: (inst: ClientDemoInstance) => void;
  // Per-instance fleet data getters & mutators for the currently edited instance
  activeEditInstanceFleet: InstanceFleetData;
  onUpdateEditInstanceFuelPrice: (newPrice: number) => void;
  onAddEditInstanceFuelPurchase: (p: Omit<FuelPurchaseRecord, "id">) => void;
  onUpdateEditInstanceFuelPurchase: (p: FuelPurchaseRecord) => void;
  onDeleteEditInstanceFuelPurchase: (id: string) => void;
  onAddEditInstanceTruck: (trk: MapTruck) => void;
  onUpdateEditInstanceTruck: (trk: MapTruck) => void;
  onDeleteEditInstanceTruck: (id: string) => void;
  onAddEditInstanceDriver: (drv: DriverEcoRecord) => void;
  onUpdateEditInstanceDriver: (drv: DriverEcoRecord) => void;
  onDeleteEditInstanceDriver: (id: string) => void;
  onAddEditInstanceShipment: (shp: LtlShipment) => void;
  onUpdateEditInstanceShipment: (shp: LtlShipment) => void;
  onDeleteEditInstanceShipment: (id: string) => void;
  onBulkImportEditInstanceExcel: (
    parsed: ParsedExcelImportResult,
    mode: "merge" | "replace"
  ) => void;
  onClearEditInstanceFleet: () => void;
  // Cloud Sync & Portal Gate
  syncState: {
    status: "synced" | "saving" | "error";
    lastSavedTime: string;
    message: string;
  };
  onForceCloudSync: () => Promise<void>;
  onLockToPortalGate: () => void;
  onResetAllToFactory: () => void;
  onExportFullJson: () => string;
  onImportFullJson: (rawJson: string) => boolean;
}

const ALL_DEMO_TABS: { id: ClientDemoTabId; label: string }[] = [
  { id: "overview", label: "Overview KPIs" },
  { id: "live-map", label: "Live Map & Idling" },
  { id: "ltl-optimizer", label: "LTL Optimizer" },
  { id: "driver-eco", label: "Driver Eco-Scores" },
  { id: "fleet-manager", label: "Fleet, Routes & Excel CRUD" },
];

export function IbrahimAdminPortal({
  locale,
  onChangeLocale,
  theme,
  onToggleTheme,
  t,
  config,
  onUpdateConfig,
  demoInstances,
  selectedEditInstanceId,
  onSelectEditInstanceId,
  onAddDemoInstance,
  onUpdateDemoInstance,
  onDeleteDemoInstance,
  onCloneDemoInstance,
  onPreviewClientDemo,
  activeEditInstanceFleet,
  onUpdateEditInstanceFuelPrice,
  onAddEditInstanceFuelPurchase,
  onUpdateEditInstanceFuelPurchase,
  onDeleteEditInstanceFuelPurchase,
  onAddEditInstanceTruck,
  onUpdateEditInstanceTruck,
  onDeleteEditInstanceTruck,
  onAddEditInstanceDriver,
  onUpdateEditInstanceDriver,
  onDeleteEditInstanceDriver,
  onAddEditInstanceShipment,
  onUpdateEditInstanceShipment,
  onDeleteEditInstanceShipment,
  onBulkImportEditInstanceExcel,
  onClearEditInstanceFleet,
  syncState,
  onForceCloudSync,
  onLockToPortalGate,
  onResetAllToFactory,
  onExportFullJson,
  onImportFullJson,
}: IbrahimAdminPortalProps) {
  const [adminView, setAdminView] = useState<
    "instances" | "builder" | "formulas" | "cloud"
  >("instances");
  const [builderSubTab, setBuilderSubTab] = useState<
    "profile" | "theme" | "fleet"
  >("profile");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [deleteRequest, setDeleteRequest] =
    useState<DeleteConfirmationRequest | null>(null);
  const [importJsonText, setImportJsonText] = useState("");
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);

  const triggerSavedToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 3500);
  };

  // New Real Instance Creation Form State (Starts 100% Blank with 0 records by default, or optional Excel upload)
  const [newNameEn, setNewNameEn] = useState("");
  const [newNameAr, setNewNameAr] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newPin, setNewPin] = useState("4580");
  const [newCity, setNewCity] = useState("Casablanca Zenata");
  const [newLocale, setNewLocale] = useState<Locale>("fr");
  const [newColorPreset, setNewColorPreset] =
    useState<Exclude<BrandColorPresetId, "custom">>("navy");
  const [newInstanceExcel, setNewInstanceExcel] =
    useState<ParsedExcelImportResult | null>(null);

  const editInstance =
    demoInstances.find((d) => d.id === selectedEditInstanceId) ||
    demoInstances[0];

  // Explicit Draft State for Instance Profile & Theme (Committed only when clicking "Save Changes")
  const [draftInstance, setDraftInstance] = useState<ClientDemoInstance | null>(
    editInstance || null
  );
  const [hasUnsavedInstanceChanges, setHasUnsavedInstanceChanges] =
    useState(false);

  // Explicit Draft State for Global Formulas & Security
  const [draftConfig, setDraftConfig] = useState<PlatformSystemConfig>(config);
  const [hasUnsavedConfigChanges, setHasUnsavedConfigChanges] = useState(false);

  useEffect(() => {
    if (editInstance) {
      setDraftInstance(JSON.parse(JSON.stringify(editInstance)));
      setHasUnsavedInstanceChanges(false);
    }
  }, [selectedEditInstanceId, editInstance]);

  useEffect(() => {
    setDraftConfig(JSON.parse(JSON.stringify(config)));
    setHasUnsavedConfigChanges(false);
  }, [config]);

  const updateDraftInstance = (patch: Partial<ClientDemoInstance>) => {
    if (!draftInstance) return;
    setDraftInstance({ ...draftInstance, ...patch });
    setHasUnsavedInstanceChanges(true);
  };

  const updateDraftTheme = (patch: Partial<BrandThemeConfig>) => {
    if (!draftInstance) return;
    setDraftInstance({
      ...draftInstance,
      themeConfig: {
        ...draftInstance.themeConfig,
        ...patch,
      },
    });
    setHasUnsavedInstanceChanges(true);
  };

  const handleSaveDraftInstance = async () => {
    if (!draftInstance || !editInstance) return;
    // Preserve live fleetData from editInstance while saving profile/theme changes
    const merged: ClientDemoInstance = {
      ...draftInstance,
      fleetData: editInstance.fleetData,
    };
    onUpdateDemoInstance(merged);
    setHasUnsavedInstanceChanges(false);
    triggerSavedToast(
      `✓ Saved all changes for "${merged.clientName.en}" (?demo=${merged.slug}) to Supabase!`
    );
  };

  const handleDiscardDraftInstance = () => {
    if (editInstance) {
      setDraftInstance(JSON.parse(JSON.stringify(editInstance)));
      setHasUnsavedInstanceChanges(false);
    }
  };

  const handleSaveDraftConfig = async () => {
    onUpdateConfig(draftConfig);
    setHasUnsavedConfigChanges(false);
    triggerSavedToast("✓ Global settings & security saved to Supabase!");
  };

  const copyToClipboard = (key: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBadge(key);
      setTimeout(() => setCopiedBadge(null), 2200);
    }
  };

  const getOriginUrl = () => {
    if (typeof window !== "undefined") return window.location.origin;
    return "https://morocco-fleet-ltl-dashboard.vercel.app";
  };

  const handleNewInstanceExcelUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseFleetExcelFile(file, 15.9);
      setNewInstanceExcel(parsed);
    } catch {
      // ignore
    }
    e.target.value = "";
  };

  const handleCreateNewInstance = (e: React.FormEvent) => {
    e.preventDefault();
    const rawName = newNameEn.trim() || "New Transport Client";
    const autoSlug = (newSlug.trim() || rawName)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const preset = BRAND_COLOR_PRESETS[newColorPreset];
    const monogram =
      rawName
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || "M")
        .join("") || "MA";

    // Real, Clean Blank Fleet Data (0 records) unless an Excel workbook was uploaded during creation!
    const initialFleet: InstanceFleetData = newInstanceExcel
      ? {
          trucks: newInstanceExcel.trucks,
          ltlTrucks: newInstanceExcel.ltlTrucks,
          shipments: newInstanceExcel.shipments,
          drivers: newInstanceExcel.drivers,
          fuelPurchases: newInstanceExcel.fuelPurchases,
          alerts: [],
        }
      : {
          trucks: [],
          ltlTrucks: [],
          shipments: [],
          drivers: [],
          fuelPurchases: [],
          alerts: [],
        };

    const created: ClientDemoInstance = {
      id: `demo-${Date.now()}`,
      slug: autoSlug || `client-${Date.now()}`,
      clientName: {
        en: rawName,
        fr: rawName,
        ar: newNameAr.trim() || rawName,
      },
      city: {
        en: newCity,
        fr: newCity,
        ar: MOROCCO_CITY_COORDS[newCity]?.label.ar || newCity,
      },
      taxIce: `00${Math.floor(1500000000000 + Math.random() * 7000000000000)}`,
      accessPin: newPin.trim() || "1234",
      requirePin: true,
      isInteractiveSandbox: true,
      allowedTabs: [
        "overview",
        "live-map",
        "ltl-optimizer",
        "driver-eco",
        "fleet-manager",
      ],
      defaultLocale: newLocale,
      defaultColorMode: "light",
      fuelPriceMad: 15.9,
      totalFleetCount: initialFleet.trucks.length,
      activeTrucksCount: initialFleet.trucks.length,
      themeConfig: {
        colorPresetId: newColorPreset,
        primaryHex: preset.primaryHex,
        primaryHoverHex: preset.primaryHoverHex,
        primaryLightHex: preset.primaryLightHex,
        latinFont: "jakarta",
        arabicFont: "droid-naskh",
        monoFont: "jetbrains",
        surfaceStyle: "modern",
        brandMonogram: monogram,
        brandTagline: "Portail Exécutif Flotte & LTL Maroc",
      },
      contactCtaLabel: `Contact ${config.adminOwnerName} — Deploy Full Production Fleet`,
      contactCtaUrl: "https://wa.me/212600000000",
      notesForClient: `Dedicated client instance prepared by ${config.adminOwnerName}.`,
      createdAt: new Date().toISOString().slice(0, 10),
      fleetData: initialFleet,
    };

    onAddDemoInstance(created);
    onSelectEditInstanceId(created.id);
    setShowCreateModal(false);
    setNewNameEn("");
    setNewNameAr("");
    setNewSlug("");
    setNewInstanceExcel(null);
    setAdminView("builder");
    setBuilderSubTab("fleet");
    triggerSavedToast(
      newInstanceExcel
        ? `✓ Created "${created.clientName.en}" with ${initialFleet.trucks.length} Excel trucks & saved to Supabase!`
        : `✓ Created clean blank instance "${created.clientName.en}" (0 random records). Add trucks/drivers or import Excel below!`
    );
  };

  const toggleDraftTab = (tabId: ClientDemoTabId) => {
    if (!draftInstance) return;
    const current = draftInstance.allowedTabs;
    const next = current.includes(tabId)
      ? current.length > 1
        ? current.filter((x) => x !== tabId)
        : current
      : [...current, tabId];
    updateDraftInstance({ allowedTabs: next });
  };

  const handleDownloadFile = (
    filename: string,
    content: string,
    mime = "text/plain"
  ) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isRtl = locale === "ar";

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={`min-h-screen bg-[#F1F5F9] dark:bg-[#07090E] text-slate-900 dark:text-zinc-100 flex flex-col lg:flex-row transition-colors ${
          isRtl ? "font-arabic" : "font-sans"
        }`}
      >
        {/* Universal Delete Confirmation Dialog Modal */}
        <ConfirmDeleteModal
          request={deleteRequest}
          onCancel={() => setDeleteRequest(null)}
        />

        {/* Dedicated SaaS Master Admin Sidebar */}
        <aside className="w-full lg:w-72 bg-slate-900 dark:bg-[#0B0E17] text-white border-b lg:border-b-0 lg:border-e border-slate-800 flex flex-col justify-between shrink-0">
          <div>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-mono font-bold text-sm shadow-md">
                  IB
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-white">
                      {config.adminOwnerName} Control Plane
                    </span>
                    <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Multi-Instance SaaS & Demo Studio
                  </p>
                </div>
              </div>
            </div>

            <nav className="p-3 space-y-1.5">
              <button
                type="button"
                onClick={() => setAdminView("instances")}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-start transition-all ${
                  adminView === "instances"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">
                      1. Client Instances Hub
                    </span>
                    <span className="text-[11px] text-slate-300/80 block">
                      Manage all client instances
                    </span>
                  </div>
                </div>
                <span className="rounded-md bg-black/25 px-2 py-0.5 font-mono text-[11px] font-bold">
                  {demoInstances.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAdminView("builder")}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-start transition-all ${
                  adminView === "builder"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Palette className="h-4 w-4 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">
                      2. Instance Editor & Fleet
                    </span>
                    <span className="text-[11px] text-slate-300/80 block">
                      Theme, Excel import & trucks
                    </span>
                  </div>
                </div>
                <span className="rounded-md bg-black/25 px-2 py-0.5 font-mono text-[10px]">
                  {editInstance?.themeConfig.brandMonogram}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAdminView("formulas")}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-start transition-all ${
                  adminView === "formulas"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sliders className="h-4 w-4 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">
                      3. Global Formulas & Rules
                    </span>
                    <span className="text-[11px] text-slate-300/80 block">
                      Idling, ADM tolls & Eco-scores
                    </span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAdminView("cloud")}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-start transition-all ${
                  adminView === "cloud"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">
                      4. Supabase & Admin Security
                    </span>
                    <span className="text-[11px] text-slate-300/80 block">
                      Passwords, DB sync & backup
                    </span>
                  </div>
                </div>
              </button>
            </nav>

            {editInstance && (
              <div className="mx-3 mt-3 rounded-xl bg-slate-800/90 border border-slate-700 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Selected Instance
                  </span>
                  <span className="font-mono text-[11px] font-bold text-emerald-400">
                    PIN: {editInstance.accessPin}
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {editInstance.clientName[locale]}
                </div>
                <button
                  type="button"
                  onClick={() => onPreviewClientDemo(editInstance)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 py-2 text-xs font-bold shadow-sm transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Open Client Dashboard ↗</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 space-y-2.5">
            <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-bold font-mono text-white">
                    Supabase PostgreSQL
                  </span>
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    syncState.status === "saving"
                      ? "bg-amber-400 animate-ping"
                      : syncState.status === "error"
                      ? "bg-red-500"
                      : "bg-emerald-400"
                  }`}
                />
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                {syncState.message}
              </p>
              <button
                type="button"
                onClick={onForceCloudSync}
                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 text-[11px] font-semibold transition-colors"
              >
                <RefreshCw
                  className={`h-3 w-3 ${
                    syncState.status === "saving" ? "animate-spin" : ""
                  }`}
                />
                <span>Save All to Supabase Now</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onLockToPortalGate}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Lock Admin / View Login Gate</span>
            </button>
          </div>
        </aside>

        {/* Main SaaS Admin Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0E111A]/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>
                  {syncState.status === "saving"
                    ? "Syncing to Supabase..."
                    : `Supabase Live Synced (${syncState.lastSavedTime})`}
                </span>
              </span>

              <div className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1 text-xs">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">
                  Editing Instance:
                </span>
                <select
                  value={selectedEditInstanceId}
                  onChange={(e) => onSelectEditInstanceId(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                >
                  {demoInstances.map((inst) => (
                    <option
                      key={inst.id}
                      value={inst.id}
                      className="bg-white dark:bg-zinc-900"
                    >
                      {inst.clientName.en} (?demo={inst.slug})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ New Clean Client Instance</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleTheme()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-semibold"
              >
                {theme === "light" ? (
                  <>
                    <Moon className="h-3.5 w-3.5" />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-400" />
                    <span>Light</span>
                  </>
                )}
              </button>

              <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-800">
                <Globe className="h-3.5 w-3.5 text-slate-500 ms-1.5 me-1" />
                {(["en", "fr", "ar"] as const).map((lc) => (
                  <button
                    key={lc}
                    type="button"
                    onClick={() => onChangeLocale(lc)}
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      locale === lc
                        ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    {lc.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <main className="flex-1 p-5 sm:p-6 max-w-[1600px] w-full mx-auto space-y-6">
            {/* Explicit Save Confirmation Toast */}
            {savedToast && (
              <div className="rounded-xl bg-emerald-600 text-white px-4 py-3 text-xs sm:text-sm font-bold shadow-md flex items-center justify-between">
                <span>{savedToast}</span>
                <button
                  type="button"
                  onClick={() => setSavedToast(null)}
                  className="text-white/80 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Modal / Drawer for Creating a New Clean Client Instance (0 Random Demo Data + Optional Excel Upload) */}
            {showCreateModal && (
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border-2 border-blue-600 p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      Create New Real Client Instance (0 Random Demo Data)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      New instances start 100% clean (0 trucks, 0 drivers, 0 routes). You can optionally upload their Excel (`.xlsx` / `.csv`) file right now or enter records manually afterward.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    ✕ Close
                  </button>
                </div>

                <form onSubmit={handleCreateNewInstance} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Client Company Name (EN / FR) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CTM Messagerie Maroc"
                        value={newNameEn}
                        onChange={(e) => {
                          setNewNameEn(e.target.value);
                          if (!newSlug) {
                            setNewSlug(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/^-|-$/g, "")
                            );
                          }
                        }}
                        className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        الاسم بالعربية (Arabic Name)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: ستيام للإرساليات"
                        value={newNameAr}
                        onChange={(e) => setNewNameAr(e.target.value)}
                        className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-arabic font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        URL Slug (?demo=...) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ctm-messagerie"
                        value={newSlug}
                        onChange={(e) => setNewSlug(e.target.value)}
                        className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold text-blue-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Client Access PIN *
                      </label>
                      <input
                        type="text"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Headquarters Hub
                      </label>
                      <select
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2"
                      >
                        {Object.keys(MOROCCO_CITY_COORDS).map((ck) => (
                          <option key={ck} value={ck}>
                            {ck}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Default Language
                      </label>
                      <select
                        value={newLocale}
                        onChange={(e) => setNewLocale(e.target.value as Locale)}
                        className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2"
                      >
                        <option value="fr">Français (FR)</option>
                        <option value="en">English (EN)</option>
                        <option value="ar">العربية (AR)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Brand Color Palette
                      </label>
                      <select
                        value={newColorPreset}
                        onChange={(e) =>
                          setNewColorPreset(
                            e.target.value as Exclude<
                              BrandColorPresetId,
                              "custom"
                            >
                          )
                        }
                        className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2"
                      >
                        {(
                          Object.keys(BRAND_COLOR_PRESETS) as Exclude<
                            BrandColorPresetId,
                            "custom"
                          >[]
                        ).map((k) => (
                          <option key={k} value={k}>
                            {BRAND_COLOR_PRESETS[k].name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Optional Excel Fleet Upload (.xlsx)
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          <Upload className="h-3.5 w-3.5" />
                          <span className="truncate">
                            {newInstanceExcel
                              ? `${newInstanceExcel.trucks.length} Trk / ${newInstanceExcel.drivers.length} Drv`
                              : "Upload Excel (Optional)"}
                          </span>
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleNewInstanceExcelUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => downloadFleetExcelTemplate()}
                          className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 p-2 text-slate-700 dark:text-zinc-200"
                          title="Download Ready-to-Fill Excel Template (.xlsx)"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      {newInstanceExcel
                        ? `Ready to import ${newInstanceExcel.trucks.length} Trucks, ${newInstanceExcel.drivers.length} Drivers & ${newInstanceExcel.shipments.length} Routes from ${newInstanceExcel.fileName}`
                        : "Starts 100% clean with 0 trucks, 0 drivers, and 0 routes (no random demo data)."}
                    </span>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm"
                    >
                      <Save className="h-4 w-4" />
                      <span>
                        Create & Save Clean Instance to Supabase →
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* =================================================================
                ADMIN VIEW 1: CLIENT INSTANCES HUB (SAAS OVERVIEW)
            ================================================================= */}
            {adminView === "instances" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Total Client Instances
                    </span>
                    <span className="mt-2 text-3xl font-bold font-mono text-slate-900 dark:text-zinc-100 block">
                      {demoInstances.length}
                    </span>
                    <span className="mt-1 text-xs text-slate-500 block">
                      {demoInstances.filter((d) => d.requirePin).length}{" "}
                      PIN-Protected •{" "}
                      {demoInstances.filter((d) => !d.requirePin).length} Open
                      Showcase
                    </span>
                  </div>

                  <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Selected Instance Fleet
                    </span>
                    <span className="mt-2 text-3xl font-bold font-mono text-slate-900 dark:text-zinc-100 block">
                      {activeEditInstanceFleet.trucks.length} Trucks
                    </span>
                    <span className="mt-1 text-xs text-slate-500 block">
                      {activeEditInstanceFleet.drivers.length} Drivers •{" "}
                      {activeEditInstanceFleet.shipments.length} Routes
                    </span>
                  </div>

                  <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Excel Template & Import
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadFleetExcelTemplate()}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Download .xlsx Template</span>
                    </button>
                    <span className="mt-1.5 text-[11px] text-slate-500 block">
                      4-Sheet Workbook (Trucks, Drivers, Routes, Fuel)
                    </span>
                  </div>

                  <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Supabase Cloud Persistence
                    </span>
                    <span className="mt-2 text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
                      Connected & Live
                    </span>
                    <span className="mt-1 text-xs font-mono text-slate-500 block truncate">
                      qosfrncehxnpxtrajpeo.supabase.co
                    </span>
                  </div>
                </div>

                {/* Client Instances Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  {demoInstances.map((inst) => {
                    const shareUrl = `${getOriginUrl()}/?demo=${inst.slug}`;
                    const pitchText = `Bonjour, voici votre accès dédié à la plateforme AtlasLogix Fleet & LTL (${inst.clientName.fr}) :\n🔗 Lien : ${shareUrl}\n🔑 Code PIN : ${inst.accessPin}`;
                    const instTruckCount = inst.fleetData?.trucks?.length ?? 0;
                    const instDriverCount =
                      inst.fleetData?.drivers?.length ?? 0;
                    const instRouteCount =
                      inst.fleetData?.shipments?.length ?? 0;

                    return (
                      <div
                        key={inst.id}
                        className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col justify-between"
                      >
                        <div>
                          <div
                            className="h-2 w-full"
                            style={{
                              backgroundColor: inst.themeConfig.primaryHex,
                            }}
                          />

                          <div className="p-5 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm shrink-0"
                                  style={{
                                    backgroundColor:
                                      inst.themeConfig.primaryHex,
                                  }}
                                >
                                  {inst.themeConfig.brandMonogram}
                                </div>
                                <div>
                                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                                    {inst.clientName.en}
                                  </h3>
                                  <p className="text-xs font-arabic text-slate-500 dark:text-zinc-400">
                                    {inst.clientName.ar}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`rounded-md px-2.5 py-1 font-mono text-xs font-bold border ${
                                  inst.requirePin
                                    ? "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                                    : "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                                }`}
                              >
                                {inst.requirePin
                                  ? `PIN: ${inst.accessPin}`
                                  : "Open Showcase"}
                              </span>
                            </div>

                            <div className="rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200/80 dark:border-zinc-800 p-3.5 space-y-2 text-xs font-mono">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                  Client URL:
                                </span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                  /?demo={inst.slug}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                  HQ & Tariff:
                                </span>
                                <span className="text-slate-800 dark:text-zinc-200">
                                  {inst.city.en} •{" "}
                                  {inst.fuelPriceMad.toFixed(2)} MAD/L
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                  Instance Fleet:
                                </span>
                                <span className="text-slate-800 dark:text-zinc-200 font-bold">
                                  {instTruckCount} Trk • {instDriverCount} Drv •{" "}
                                  {instRouteCount} Routes
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                  Theme & Fonts:
                                </span>
                                <span className="text-slate-800 dark:text-zinc-200">
                                  {inst.themeConfig.colorPresetId} •{" "}
                                  {inst.themeConfig.latinFont} /{" "}
                                  {inst.themeConfig.arabicFont}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="px-5 py-3.5 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectEditInstanceId(inst.id);
                                setAdminView("builder");
                                setBuilderSubTab("fleet");
                              }}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-bold shadow-sm transition-colors"
                            >
                              <Sliders className="h-3.5 w-3.5" />
                              <span>Manage Fleet & Excel</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onPreviewClientDemo(inst)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 py-2 text-xs font-bold transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Launch View ↗</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(`url-${inst.id}`, shareUrl)
                              }
                              className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-100 border border-slate-200 dark:border-zinc-700 py-1.5 text-[11px] font-semibold"
                            >
                              {copiedBadge === `url-${inst.id}` ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span>Copied Link</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(`pitch-${inst.id}`, pitchText)
                              }
                              className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-100 border border-slate-200 dark:border-zinc-700 py-1.5 text-[11px] font-semibold"
                            >
                              {copiedBadge === `pitch-${inst.id}` ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span>Copied Invite</span>
                                </>
                              ) : (
                                <>
                                  <Share2 className="h-3 w-3" />
                                  <span>Invite + PIN</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => onCloneDemoInstance(inst)}
                              className="rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-100 border border-slate-200 dark:border-zinc-700 p-1.5 text-slate-600"
                              title="Clone Instance"
                            >
                              <CopyPlus className="h-3.5 w-3.5" />
                            </button>

                            {demoInstances.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteRequest({
                                    title:
                                      "Permanently Delete Client Instance?",
                                    itemName: `${inst.clientName.en} (?demo=${inst.slug})`,
                                    description: `Are you sure you want to permanently delete the client instance "${inst.clientName.en}" and all ${instTruckCount} trucks / ${instDriverCount} drivers inside it from Supabase?`,
                                    confirmLabel: "Yes, Delete Instance",
                                    onConfirm: () => {
                                      onDeleteDemoInstance(inst.id);
                                      triggerSavedToast(
                                        `✓ Deleted instance "${inst.clientName.en}" from Supabase.`
                                      );
                                    },
                                  })
                                }
                                className="rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 p-1.5 text-red-600 dark:text-red-400"
                                title="Delete Instance"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =================================================================
                ADMIN VIEW 2: DEEP INSTANCE EDITOR (PROFILE, THEME & FLEET/EXCEL)
            ================================================================= */}
            {adminView === "builder" && editInstance && draftInstance && (
              <div className="space-y-6">
                <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-mono font-bold text-base shadow-sm"
                      style={{
                        backgroundColor: draftInstance.themeConfig.primaryHex,
                      }}
                    >
                      {draftInstance.themeConfig.brandMonogram}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
                          Editing Instance: {draftInstance.clientName.en}
                        </h2>
                        <span className="rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2 py-0.5 font-mono text-xs font-bold text-blue-700 dark:text-blue-300">
                          /?demo={draftInstance.slug}
                        </span>
                        {hasUnsavedInstanceChanges && (
                          <span className="rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 px-2 py-0.5 text-[11px] font-bold">
                            ● Unsaved Changes
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Configure client profile, theme/fonts, or import an Excel (`.xlsx`) workbook of trucks, drivers, and routes.
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex flex-wrap rounded-xl bg-slate-100 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-800 gap-1">
                    <button
                      type="button"
                      onClick={() => setBuilderSubTab("fleet")}
                      className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                        builderSubTab === "fleet"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-zinc-400"
                      }`}
                    >
                      1. Fleet, Routes & Excel Import (
                      {activeEditInstanceFleet.trucks.length} Trk /{" "}
                      {activeEditInstanceFleet.drivers.length} Drv)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderSubTab("profile")}
                      className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                        builderSubTab === "profile"
                          ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-600 dark:text-zinc-400"
                      }`}
                    >
                      2. Access PIN, Modules & Info
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderSubTab("theme")}
                      className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                        builderSubTab === "theme"
                          ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-600 dark:text-zinc-400"
                      }`}
                    >
                      3. Theme, Fonts & Colors
                    </button>
                  </div>
                </div>

                {/* SUB-TAB 1: INSTANCE FLEET, ROUTES & EXCEL IMPORT */}
                {builderSubTab === "fleet" && (
                  <FleetFuelManagerPage
                    locale={locale}
                    t={t}
                    instanceSlug={editInstance.slug}
                    fuelPriceMad={editInstance.fuelPriceMad}
                    onUpdateFuelPrice={onUpdateEditInstanceFuelPrice}
                    fuelPurchases={activeEditInstanceFleet.fuelPurchases}
                    onAddFuelPurchase={onAddEditInstanceFuelPurchase}
                    onUpdateFuelPurchase={onUpdateEditInstanceFuelPurchase}
                    onDeleteFuelPurchase={onDeleteEditInstanceFuelPurchase}
                    trucks={activeEditInstanceFleet.trucks}
                    onAddTruck={onAddEditInstanceTruck}
                    onUpdateTruck={onUpdateEditInstanceTruck}
                    onDeleteTruck={onDeleteEditInstanceTruck}
                    drivers={activeEditInstanceFleet.drivers}
                    onAddDriver={onAddEditInstanceDriver}
                    onUpdateDriver={onUpdateEditInstanceDriver}
                    onDeleteDriver={onDeleteEditInstanceDriver}
                    shipments={activeEditInstanceFleet.shipments}
                    onAddShipment={onAddEditInstanceShipment}
                    onUpdateShipment={onUpdateEditInstanceShipment}
                    onDeleteShipment={onDeleteEditInstanceShipment}
                    onBulkImportExcel={onBulkImportEditInstanceExcel}
                    onClearAllInstanceFleet={onClearEditInstanceFleet}
                  />
                )}

                {/* SUB-TAB 2: ACCESS PIN, MODULES & CLIENT PROFILE (WITH EXPLICIT SAVE BUTTON) */}
                {builderSubTab === "profile" && (
                  <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-6 shadow-sm space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                          Client Name (EN / FR)
                        </label>
                        <input
                          type="text"
                          value={draftInstance.clientName.en}
                          onChange={(e) =>
                            updateDraftInstance({
                              clientName: {
                                ...draftInstance.clientName,
                                en: e.target.value,
                                fr: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                          الاسم بالعربية (Arabic Name)
                        </label>
                        <input
                          type="text"
                          value={draftInstance.clientName.ar}
                          onChange={(e) =>
                            updateDraftInstance({
                              clientName: {
                                ...draftInstance.clientName,
                                ar: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-arabic font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                          URL Slug (?demo=...)
                        </label>
                        <input
                          type="text"
                          value={draftInstance.slug}
                          onChange={(e) =>
                            updateDraftInstance({
                              slug: e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-_]/g, "-"),
                            })
                          }
                          className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold text-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                          Client Access PIN
                        </label>
                        <input
                          type="text"
                          value={draftInstance.accessPin}
                          onChange={(e) =>
                            updateDraftInstance({
                              accessPin: e.target.value,
                            })
                          }
                          className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                          Default Language
                        </label>
                        <select
                          value={draftInstance.defaultLocale}
                          onChange={(e) =>
                            updateDraftInstance({
                              defaultLocale: e.target.value as Locale,
                            })
                          }
                          className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-semibold"
                        >
                          <option value="fr">Français (FR)</option>
                          <option value="en">English (EN)</option>
                          <option value="ar">العربية (AR - Droid Naskh)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                          Default Theme Mode
                        </label>
                        <select
                          value={draftInstance.defaultColorMode}
                          onChange={(e) =>
                            updateDraftInstance({
                              defaultColorMode: e.target.value as
                                | "light"
                                | "dark",
                            })
                          }
                          className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-semibold"
                        >
                          <option value="light">Executive Light Mode</option>
                          <option value="dark">Executive Dark Mode</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                          Instance Diesel Tariff (MAD/L)
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={draftInstance.fuelPriceMad}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v) && v > 0) {
                              updateDraftInstance({ fuelPriceMad: v });
                            }
                          }}
                          className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold text-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                          Moroccan Tax ICE
                        </label>
                        <input
                          type="text"
                          value={draftInstance.taxIce}
                          onChange={(e) =>
                            updateDraftInstance({
                              taxIce: e.target.value,
                            })
                          }
                          className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-3 text-xs">
                      <span className="font-bold uppercase text-slate-700 dark:text-zinc-300 block">
                        Enabled Dashboard Tabs for{" "}
                        {draftInstance.clientName.en}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {ALL_DEMO_TABS.map((tb) => {
                          const enabled =
                            draftInstance.allowedTabs.includes(tb.id);
                          return (
                            <button
                              key={tb.id}
                              type="button"
                              onClick={() => toggleDraftTab(tb.id)}
                              className={`rounded-lg px-3.5 py-2 font-semibold border transition-all ${
                                enabled
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500"
                              }`}
                            >
                              {enabled ? "✓ " : ""}
                              {tb.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap items-center gap-6 pt-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer font-semibold">
                          <input
                            type="checkbox"
                            checked={draftInstance.requirePin}
                            onChange={(e) =>
                              updateDraftInstance({
                                requirePin: e.target.checked,
                              })
                            }
                          />
                          <span>
                            Require Access PIN ({draftInstance.accessPin}) on
                            Login Gate
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Explicit Save & Discard Action Bar */}
                    <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-3">
                      {hasUnsavedInstanceChanges && (
                        <button
                          type="button"
                          onClick={handleDiscardDraftInstance}
                          className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 px-4 py-2.5 text-xs font-semibold"
                        >
                          Discard Changes
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveDraftInstance}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save Profile & PIN Changes to Supabase</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: WHITE-LABEL THEME, FONTS & COLORS (WITH EXPLICIT SAVE BUTTON) */}
                {builderSubTab === "theme" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                      <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3">
                          <Palette className="h-4 w-4 text-blue-600" />
                          <span>
                            Brand Colors & Monogram for{" "}
                            {draftInstance.clientName.en}
                          </span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(
                            Object.keys(BRAND_COLOR_PRESETS) as Exclude<
                              BrandColorPresetId,
                              "custom"
                            >[]
                          ).map((presetKey) => {
                            const preset = BRAND_COLOR_PRESETS[presetKey];
                            const isSelected =
                              draftInstance.themeConfig.colorPresetId ===
                              presetKey;
                            return (
                              <button
                                key={presetKey}
                                type="button"
                                onClick={() =>
                                  updateDraftTheme({
                                    colorPresetId: presetKey,
                                    primaryHex: preset.primaryHex,
                                    primaryHoverHex: preset.primaryHoverHex,
                                    primaryLightHex: preset.primaryLightHex,
                                  })
                                }
                                className={`rounded-xl p-3.5 border text-start transition-all flex items-center justify-between ${
                                  isSelected
                                    ? "bg-slate-50 dark:bg-zinc-800 border-slate-900 dark:border-zinc-400"
                                    : "bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className="h-8 w-8 rounded-lg shadow-sm shrink-0"
                                    style={{
                                      backgroundColor: preset.primaryHex,
                                    }}
                                  />
                                  <div>
                                    <span className="text-xs font-bold block">
                                      {preset.name}
                                    </span>
                                    <span className="text-[11px] font-mono text-slate-500">
                                      {preset.primaryHex}
                                    </span>
                                  </div>
                                </div>
                                {isSelected && <Check className="h-4 w-4" />}
                              </button>
                            );
                          })}
                        </div>

                        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold mb-1">
                              Custom Hex Color
                            </label>
                            <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5">
                              <input
                                type="color"
                                value={draftInstance.themeConfig.primaryHex}
                                onChange={(e) =>
                                  updateDraftTheme({
                                    colorPresetId: "custom",
                                    primaryHex: e.target.value,
                                    primaryHoverHex: e.target.value,
                                    primaryLightHex: e.target.value,
                                  })
                                }
                                className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                              />
                              <span className="font-mono font-bold">
                                {draftInstance.themeConfig.primaryHex}
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">
                              Monogram Badge
                            </label>
                            <input
                              type="text"
                              maxLength={3}
                              value={draftInstance.themeConfig.brandMonogram}
                              onChange={(e) =>
                                updateDraftTheme({
                                  brandMonogram: e.target.value.toUpperCase(),
                                })
                              }
                              className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold uppercase"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">
                              Brand Tagline
                            </label>
                            <input
                              type="text"
                              value={draftInstance.themeConfig.brandTagline}
                              onChange={(e) =>
                                updateDraftTheme({
                                  brandTagline: e.target.value,
                                })
                              }
                              className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3">
                          <Type className="h-4 w-4 text-blue-600" />
                          <span>
                            Typography (Latin + Arabic Naskh/Kufi) & Card Style
                          </span>
                        </h3>

                        <div className="space-y-3.5 text-xs">
                          <div>
                            <label className="block font-semibold mb-1">
                              Latin Interface Font (EN / FR)
                            </label>
                            <select
                              value={draftInstance.themeConfig.latinFont}
                              onChange={(e) =>
                                updateDraftTheme({
                                  latinFont: e.target.value as LatinFontId,
                                })
                              }
                              className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-semibold"
                            >
                              {LATIN_FONT_OPTIONS.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">
                              Arabic Interface Font (الخط العربي — RTL)
                            </label>
                            <select
                              value={draftInstance.themeConfig.arabicFont}
                              onChange={(e) =>
                                updateDraftTheme({
                                  arabicFont: e.target.value as ArabicFontId,
                                })
                              }
                              className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-semibold"
                            >
                              {ARABIC_FONT_OPTIONS.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">
                              Monospace Telemetry Font
                            </label>
                            <select
                              value={draftInstance.themeConfig.monoFont}
                              onChange={(e) =>
                                updateDraftTheme({
                                  monoFont: e.target.value as MonoFontId,
                                })
                              }
                              className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-semibold"
                            >
                              {MONO_FONT_OPTIONS.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="pt-2">
                            <label className="block font-semibold mb-2">
                              Card & Surface Geometry Style
                            </label>
                            <div className="grid grid-cols-3 gap-2.5">
                              {(
                                [
                                  {
                                    id: "sharp",
                                    title: "Sharp Institutional",
                                    desc: "6px tight radius",
                                  },
                                  {
                                    id: "modern",
                                    title: "Modern B2B SaaS",
                                    desc: "12px balanced radius",
                                  },
                                  {
                                    id: "glass",
                                    title: "Executive Elevated",
                                    desc: "16px smooth radius",
                                  },
                                ] as {
                                  id: SurfaceStyleId;
                                  title: string;
                                  desc: string;
                                }[]
                              ).map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() =>
                                    updateDraftTheme({
                                      surfaceStyle: st.id,
                                    })
                                  }
                                  className={`rounded-xl p-3 border text-start ${
                                    draftInstance.themeConfig.surfaceStyle ===
                                    st.id
                                      ? "bg-blue-50 dark:bg-blue-950/30 border-blue-600"
                                      : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
                                  }`}
                                >
                                  <span className="font-bold block">
                                    {st.title}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {st.desc}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Explicit Save Theme Button Bar */}
                    <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 flex items-center justify-end gap-3">
                      {hasUnsavedInstanceChanges && (
                        <button
                          type="button"
                          onClick={handleDiscardDraftInstance}
                          className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 px-4 py-2.5 text-xs font-semibold"
                        >
                          Discard Changes
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveDraftInstance}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save Theme, Fonts & Colors to Supabase</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =================================================================
                ADMIN VIEW 3: GLOBAL FORMULAS & DEFAULT THRESHOLDS (WITH SAVE BUTTON)
            ================================================================= */}
            {adminView === "formulas" && (
              <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-6 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 border-b border-slate-200 dark:border-zinc-800 pb-3">
                  Global Operational Formulas & Default Trailer Capacities
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">
                      Idling Alert Threshold (Minutes)
                    </label>
                    <input
                      type="number"
                      value={draftConfig.idlingAlertThresholdMins}
                      onChange={(e) => {
                        setDraftConfig({
                          ...draftConfig,
                          idlingAlertThresholdMins:
                            parseInt(e.target.value, 10) || 10,
                        });
                        setHasUnsavedConfigChanges(true);
                      }}
                      className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">
                      Idling Fuel Burn Rate (L/Hour)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={draftConfig.idleFuelBurnLitersPerHour}
                      onChange={(e) => {
                        setDraftConfig({
                          ...draftConfig,
                          idleFuelBurnLitersPerHour:
                            parseFloat(e.target.value) || 3.5,
                        });
                        setHasUnsavedConfigChanges(true);
                      }}
                      className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">
                      Target Fleet Consumption (L/100km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={draftConfig.targetFleetConsumptionL100km}
                      onChange={(e) => {
                        setDraftConfig({
                          ...draftConfig,
                          targetFleetConsumptionL100km:
                            parseFloat(e.target.value) || 29.5,
                        });
                        setHasUnsavedConfigChanges(true);
                      }}
                      className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">
                      ADM Class-3 Highway Toll (MAD/km)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={draftConfig.admHighwayTollMadPerKm}
                      onChange={(e) => {
                        setDraftConfig({
                          ...draftConfig,
                          admHighwayTollMadPerKm:
                            parseFloat(e.target.value) || 0.85,
                        });
                        setHasUnsavedConfigChanges(true);
                      }}
                      className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDraftConfig}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Formulas to Supabase</span>
                  </button>
                </div>
              </div>
            )}

            {/* =================================================================
                ADMIN VIEW 4: SUPABASE CLOUD, SECURITY & JSON SNAPSHOTS
            ================================================================= */}
            {adminView === "cloud" && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 border-b border-slate-200 dark:border-zinc-800 pb-3">
                    Master Admin Security & Supabase Connection
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">
                        Master Admin Password ({draftConfig.adminOwnerName})
                      </label>
                      <input
                        type="text"
                        value={draftConfig.masterAdminPassword}
                        onChange={(e) => {
                          setDraftConfig({
                            ...draftConfig,
                            masterAdminPassword: e.target.value,
                          });
                          setHasUnsavedConfigChanges(true);
                        }}
                        className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">
                        Connected Supabase Project URL
                      </label>
                      <input
                        type="text"
                        value={draftConfig.supabaseUrl}
                        onChange={(e) => {
                          setDraftConfig({
                            ...draftConfig,
                            supabaseUrl: e.target.value,
                          });
                          setHasUnsavedConfigChanges(true);
                        }}
                        className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono"
                      />
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleSaveDraftConfig}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-bold shadow-sm"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Security Settings to Supabase</span>
                      </button>

                      <button
                        type="button"
                        onClick={onForceCloudSync}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 font-bold shadow-sm"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Force Sync All Instances Now</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      Workspace JSON Snapshot Backup & Restore
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadFile(
                            "ibrahim-saas-instances-backup.json",
                            onExportFullJson(),
                            "application/json"
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-bold"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export JSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteRequest({
                            title: "Reset Entire Workspace to Factory Defaults?",
                            itemName: "All Custom Client Instances & Edits",
                            description:
                              "Are you sure you want to reset the entire workspace back to factory defaults? All custom instances not exported to JSON/Excel will be replaced.",
                            confirmLabel: "Yes, Factory Reset",
                            onConfirm: () => {
                              onResetAllToFactory();
                              triggerSavedToast(
                                "✓ Workspace reset to factory defaults."
                              );
                            },
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 text-xs font-bold"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Factory Reset</span>
                      </button>
                    </div>
                  </div>

                  {importStatusMsg && (
                    <div className="rounded-lg bg-slate-100 dark:bg-zinc-800 p-2.5 text-xs font-semibold">
                      {importStatusMsg}
                    </div>
                  )}

                  <textarea
                    rows={3}
                    placeholder="Paste exported JSON snapshot here to restore all instances..."
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const ok = onImportFullJson(importJsonText);
                      setImportStatusMsg(
                        ok
                          ? "✅ Restored & synced to Supabase!"
                          : "❌ Invalid JSON"
                      );
                    }}
                    disabled={!importJsonText.trim()}
                    className="w-full rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white py-2 text-xs font-bold"
                  >
                    Import & Sync to Supabase
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
