"use client";

import React, { useState } from "react";
import {
  Settings,
  Building2,
  Sliders,
  Database,
  CloudUpload,
  Copy,
  Check,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  ShieldCheck,
  Terminal,
  KeyRound,
  Fuel,
  Truck,
  Sparkles,
  Palette,
  Lock,
  ExternalLink,
  Eye,
  Share2,
  Type,
  LayoutGrid,
} from "lucide-react";
import {
  ARABIC_FONT_OPTIONS,
  ArabicFontId,
  BRAND_COLOR_PRESETS,
  BrandColorPresetId,
  BrandThemeConfig,
  ClientDemoInstance,
  ClientDemoTabId,
  CompanyProfile,
  LATIN_FONT_OPTIONS,
  LatinFontId,
  Locale,
  MONO_FONT_OPTIONS,
  MonoFontId,
  MOROCCO_CITY_COORDS,
  PlatformSystemConfig,
  SurfaceStyleId,
} from "@/lib/supabase/database";

interface SystemConfigPageProps {
  locale: Locale;
  theme: "light" | "dark";
  onToggleTheme: (nextTheme: "light" | "dark") => void;
  onChangeLocale: (nextLocale: Locale) => void;
  config: PlatformSystemConfig;
  onUpdateConfig: (nextConfig: PlatformSystemConfig) => void;
  fuelPriceMad: number;
  onUpdateFuelPrice: (price: number) => void;
  companies: CompanyProfile[];
  selectedCompanyId: string;
  onSelectCompany: (id: string) => void;
  onAddCompany: (company: CompanyProfile) => void;
  onUpdateCompany: (company: CompanyProfile) => void;
  onDeleteCompany: (id: string) => void;
  demoInstances: ClientDemoInstance[];
  onAddDemoInstance: (inst: ClientDemoInstance) => void;
  onUpdateDemoInstance: (inst: ClientDemoInstance) => void;
  onDeleteDemoInstance: (id: string) => void;
  onPreviewClientDemo: (inst: ClientDemoInstance) => void;
  onSyncDemosToSupabase: () => Promise<{ ok: boolean; message: string }>;
  onLockToPortalGate: () => void;
  onApplyThresholdsToFleet: () => void;
  onResetAllToFactory: () => void;
  onExportFullJson: () => string;
  onImportFullJson: (rawJson: string) => boolean;
  counts: {
    trucks: number;
    ltlTrucks: number;
    shipments: number;
    drivers: number;
    fuelPurchases: number;
  };
}

const SUPABASE_FULL_MIGRATION_SQL = `-- AtlasLogix Maroc — Complete Supabase PostgreSQL Schema (8 Tables + RLS)
create extension if not exists "pgcrypto";

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_fr text not null,
  name_ar text not null,
  default_locale text not null default 'fr' check (default_locale in ('en', 'fr', 'ar')),
  headquarters_city text not null,
  tax_ice text not null unique,
  diesel_tariff_mad_per_liter numeric(6, 2) not null default 15.90,
  created_at timestamptz not null default now()
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  driver_code text not null unique,
  full_name text not null,
  full_name_ar text not null,
  assigned_truck_code text not null,
  primary_corridor text not null,
  fuel_efficiency_l_per_100km numeric(5, 2) not null,
  total_idle_minutes_30d integer not null default 0,
  safety_incidents_30d integer not null default 0,
  eco_score integer not null check (eco_score between 0 and 100),
  eco_tier text not null check (eco_tier in ('green', 'yellow', 'red')),
  updated_at timestamptz not null default now()
);

create table if not exists public.trucks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  truck_code text not null unique,
  plate_number text not null unique,
  model text not null,
  trailer_type text not null default 'Tautliner 13.6m',
  axle_config text not null default '4x2 + 3-Axle (40T)',
  status text not null check (status in ('moving', 'idling', 'alert')),
  origin_city text not null,
  destination_city text not null,
  highway_corridor text not null,
  route_distance_km integer not null default 240,
  max_pallets integer not null default 33,
  used_pallets integer not null default 0,
  max_volume_m3 numeric(6, 2) not null default 90.00,
  used_volume_m3 numeric(6, 2) not null default 0.00,
  max_weight_kg integer not null default 24000,
  used_weight_kg integer not null default 0,
  fuel_tank_capacity_l integer not null default 850,
  fuel_level_pct integer not null default 75,
  updated_at timestamptz not null default now()
);

create table if not exists public.fuel_purchases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_ref text not null unique,
  purchase_date date not null default current_date,
  station_brand text not null,
  city text not null,
  truck_code text not null,
  liters numeric(8, 2) not null check (liters > 0),
  unit_price_mad numeric(6, 2) not null check (unit_price_mad > 0),
  payment_method text not null default 'Fleet Card',
  created_at timestamptz not null default now()
);

-- White-Label Client Demo Instances Table (Powers ?demo=<slug> across devices)
create table if not exists public.demo_instances (
  slug text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.companies enable row level security;
alter table public.drivers enable row level security;
alter table public.trucks enable row level security;
alter table public.fuel_purchases enable row level security;
alter table public.demo_instances enable row level security;

create policy "Anyone with link can read demo instances"
  on public.demo_instances for select
  to anon, authenticated
  using ( true );

create policy "Admin studio can upsert demo instances"
  on public.demo_instances for all
  to anon, authenticated
  using ( true )
  with check ( true );`;

const ALL_DEMO_TABS: { id: ClientDemoTabId; label: string }[] = [
  { id: "overview", label: "Overview KPIs" },
  { id: "live-map", label: "Live Map & Idling" },
  { id: "ltl-optimizer", label: "LTL Optimizer" },
  { id: "driver-eco", label: "Driver Eco-Scores" },
  { id: "fleet-manager", label: "Fleet & Fuel CRUD" },
];

export function SystemConfigPage({
  locale,
  theme,
  onToggleTheme,
  onChangeLocale,
  config,
  onUpdateConfig,
  fuelPriceMad,
  onUpdateFuelPrice,
  companies,
  selectedCompanyId,
  onSelectCompany,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
  demoInstances,
  onAddDemoInstance,
  onUpdateDemoInstance,
  onDeleteDemoInstance,
  onPreviewClientDemo,
  onSyncDemosToSupabase,
  onLockToPortalGate,
  onApplyThresholdsToFleet,
  onResetAllToFactory,
  onExportFullJson,
  onImportFullJson,
  counts,
}: SystemConfigPageProps) {
  const [section, setSection] = useState<
    "demos" | "theme" | "company" | "thresholds" | "integrations" | "handover"
  >("demos");
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "valid"
  >("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);

  // New Prospect Demo Instance Generator State
  const [demoSlug, setDemoSlug] = useState("ctm-messagerie");
  const [demoNameEn, setDemoNameEn] = useState("CTM Messagerie & Logistique Maroc");
  const [demoNameAr, setDemoNameAr] = useState("ستيام للإرساليات واللوجستيك المغرب");
  const [demoCity, setDemoCity] = useState("Casablanca Zenata");
  const [demoPin, setDemoPin] = useState("5590");
  const [demoRequirePin, setDemoRequirePin] = useState(true);
  const [demoSandbox, setDemoSandbox] = useState(true);
  const [demoLocale, setDemoLocale] = useState<Locale>("fr");
  const [demoColorMode, setDemoColorMode] = useState<"light" | "dark">("light");
  const [demoAllowedTabs, setDemoAllowedTabs] = useState<ClientDemoTabId[]>([
    "overview",
    "live-map",
    "ltl-optimizer",
    "driver-eco",
    "fleet-manager",
  ]);
  const [demoCtaLabel, setDemoCtaLabel] = useState(
    "Contact Ibrahim — Request Full Production Rollout"
  );
  const [demoCtaUrl, setDemoCtaUrl] = useState("https://wa.me/212600000000");
  const [demoNotes, setDemoNotes] = useState(
    "Custom white-label instance prepared by Ibrahim for executive evaluation."
  );

  // New Company Form State
  const [compCode, setCompCode] = useState("IBRAHIM-LOGIX");
  const [compNameEn, setCompNameEn] = useState("Ibrahim Transport & LTL Maroc");
  const [compNameAr, setCompNameAr] = useState("إبراهيم للنقل واللوجستيك المغرب");
  const [compCity, setCompCity] = useState("Casablanca Zenata");
  const [compIce, setCompIce] = useState("003491827000042");
  const [compLocale, setCompLocale] = useState<Locale>("fr");
  const [compTotalFleet, setCompTotalFleet] = useState("52");
  const [compActiveFleet, setCompActiveFleet] = useState("48");

  const activeCompany =
    companies.find((c) => c.id === selectedCompanyId) || companies[0];

  const activeTheme = config.activeTheme;

  const updateTheme = (patch: Partial<BrandThemeConfig>) => {
    onUpdateConfig({
      ...config,
      activeTheme: {
        ...activeTheme,
        ...patch,
      },
    });
  };

  const handleSelectColorPreset = (
    presetId: Exclude<BrandColorPresetId, "custom">
  ) => {
    const preset = BRAND_COLOR_PRESETS[presetId];
    updateTheme({
      colorPresetId: presetId,
      primaryHex: preset.primaryHex,
      primaryHoverHex: preset.primaryHoverHex,
      primaryLightHex: preset.primaryLightHex,
    });
  };

  const handleToggleAllowedTab = (tabId: ClientDemoTabId) => {
    setDemoAllowedTabs((prev) => {
      if (prev.includes(tabId)) {
        if (prev.length === 1) return prev; // Keep at least 1 tab
        return prev.filter((x) => x !== tabId);
      }
      return [...prev, tabId];
    });
  };

  const handleCreateDemoInstance = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = demoSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-");
    const monogram =
      demoNameEn
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || "M")
        .join("") || "MA";

    const newDemo: ClientDemoInstance = {
      id: `demo-${Date.now()}`,
      slug: cleanSlug || `client-${Date.now()}`,
      clientName: {
        en: demoNameEn.trim() || "Prospect Logistics Maroc",
        fr: demoNameEn.trim() || "Prospect Logistique Maroc",
        ar: demoNameAr.trim() || "شركة النقل واللوجستيك المغرب",
      },
      city: {
        en: demoCity,
        fr: demoCity,
        ar: MOROCCO_CITY_COORDS[demoCity]?.label.ar || demoCity,
      },
      taxIce: "002948102000067",
      accessPin: demoPin.trim() || "1234",
      requirePin: demoRequirePin,
      isInteractiveSandbox: demoSandbox,
      allowedTabs: demoAllowedTabs,
      defaultLocale: demoLocale,
      defaultColorMode: demoColorMode,
      fuelPriceMad,
      totalFleetCount: 54,
      activeTrucksCount: 49,
      themeConfig: {
        ...activeTheme,
        brandMonogram: monogram,
      },
      contactCtaLabel: demoCtaLabel,
      contactCtaUrl: demoCtaUrl,
      notesForClient: demoNotes,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onAddDemoInstance(newDemo);
    setDemoSlug(`prospect-${Math.floor(100 + Math.random() * 899)}`);
  };

  const copyToClipboard = (key: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBadge(key);
      setTimeout(() => setCopiedBadge(null), 2200);
    }
  };

  const getOriginUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return `https://${config.vercelProjectName}.vercel.app`;
  };

  const generatedEnvLocal = `# AtlasLogix Maroc — Vercel & Local Environment Variables (.env.local)
# Maintainer / Admin: ${config.adminOwnerName}

NEXT_PUBLIC_SUPABASE_URL="${config.supabaseUrl}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${config.supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key"}"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="${config.googleMapsApiKey || "AIzaSy...your-google-maps-distance-matrix-key"}"
NEXT_PUBLIC_ADMIN_PASSWORD="${config.masterAdminPassword}"
NEXT_PUBLIC_DEFAULT_LOCALE="${locale}"
NEXT_PUBLIC_DEFAULT_DIESEL_MAD="${fuelPriceMad.toFixed(2)}"
`;

  const generatedGitCommands = `# Push project to ${config.adminOwnerName}'s GitHub & deploy to Vercel
git init
git add .
git commit -m "feat: Morocco Fleet & LTL SaaS with White-Label Demo Studio for ${config.adminOwnerName}"
git branch -M main
git remote add origin ${config.githubRepoUrl}
git push -u origin main

# Deploy directly to Vercel CLI (or import GitHub repo in vercel.com/new)
npx vercel --prod --name ${config.vercelProjectName}`;

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const newComp: CompanyProfile = {
      id: `comp-custom-${Date.now()}`,
      code: compCode.trim() || "MA-FLEET",
      name: {
        en: compNameEn.trim() || "Ibrahim Logistics Maroc",
        fr: compNameEn.trim() || "Ibrahim Logistique Maroc",
        ar: compNameAr.trim() || "إبراهيم للوجستيك المغرب",
      },
      city: {
        en: compCity,
        fr: compCity,
        ar: MOROCCO_CITY_COORDS[compCity]?.label.ar || compCity,
      },
      defaultLocale: compLocale,
      taxIce: compIce.trim() || "003491827000042",
      totalFleetCount: Math.max(1, parseInt(compTotalFleet, 10) || 45),
      activeTrucksCount: Math.max(1, parseInt(compActiveFleet, 10) || 40),
    };
    onAddCompany(newComp);
    onSelectCompany(newComp.id);
  };

  const handleDownloadFile = (filename: string, content: string, mime = "text/plain") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTestConnection = async () => {
    setConnectionStatus("testing");
    const res = await onSyncDemosToSupabase();
    setSyncMessage(res.message);
    setConnectionStatus("valid");
    setTimeout(() => setSyncMessage(null), 5000);
  };

  const handleRunJsonImport = () => {
    if (!importJsonText.trim()) return;
    const ok = onImportFullJson(importJsonText);
    setImportStatusMsg(
      ok
        ? "✅ Configuration, Themes, Demos & Fleet State successfully restored!"
        : "❌ Invalid JSON snapshot format. Please check the payload."
    );
    if (ok) setImportJsonText("");
    setTimeout(() => setImportStatusMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Ibrahim's Master Admin Studio */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
              {locale === "ar"
                ? `استوديو الإدارة وتوليد العروض التجريبية (${config.adminOwnerName})`
                : locale === "fr"
                ? `Studio Master Admin, Thèmes & Générateur de Démos Clients (${config.adminOwnerName})`
                : `${config.adminOwnerName}'s Master Admin, Theme & Client Demo Studio`}
            </h2>
            <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
              Admin Unlocked • {demoInstances.length} Client Demos Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Create PIN-protected white-label demo instances for transport companies, customize fonts/colors/styles, and sync to Supabase & Vercel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onLockToPortalGate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>View Portal Login Gate</span>
          </button>
        </div>
      </div>

      {/* 6-Tab Studio Navigation Bar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-white dark:bg-zinc-900 p-2 border border-slate-200/90 dark:border-zinc-800 shadow-sm">
        <button
          type="button"
          onClick={() => setSection("demos")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            section === "demos"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>1. Client Demo Instances & PINs ({demoInstances.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSection("theme")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            section === "theme"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          <span>2. Theme, Fonts, Colors & Styles</span>
        </button>

        <button
          type="button"
          onClick={() => setSection("company")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            section === "company"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>3. Companies & Tenants</span>
        </button>

        <button
          type="button"
          onClick={() => setSection("thresholds")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            section === "thresholds"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>4. Formulas & Capacities</span>
        </button>

        <button
          type="button"
          onClick={() => setSection("integrations")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            section === "integrations"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span>5. Supabase & API Keys</span>
        </button>

        <button
          type="button"
          onClick={() => setSection("handover")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            section === "handover"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
          }`}
        >
          <CloudUpload className="h-3.5 w-3.5" />
          <span>6. Vercel / GitHub / Snapshots</span>
        </button>
      </div>

      {/* =====================================================================
          SECTION 1: CLIENT DEMO INSTANCES & PROTECTED ADMIN SECURITY
      ===================================================================== */}
      {section === "demos" && (
        <div className="space-y-6">
          {/* Top Master Admin Security & Cloud Demo Sync Bar */}
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Master Admin Password & Portal Gate Protection
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Protect {config.adminOwnerName}&apos;s Master Admin Portal and require prospects to enter their assigned PIN before accessing their demo.
                </p>
              </div>

              <div className="lg:col-span-7 flex flex-wrap items-center justify-end gap-3 text-xs">
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">
                    Master Admin Password:
                  </span>
                  <input
                    type="text"
                    value={config.masterAdminPassword}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        masterAdminPassword: e.target.value,
                      })
                    }
                    className="w-28 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded px-2 py-0.5 font-mono font-bold text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <label className="inline-flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.requireGateOnRoot}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        requireGateOnRoot: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300"
                  />
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    Show Login Gate on Root (/)
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 font-semibold shadow-sm"
                >
                  <CloudUpload className="h-3.5 w-3.5" />
                  <span>Sync Demos to Supabase</span>
                </button>
              </div>
            </div>

            {syncMessage && (
              <div className="mt-3 rounded-lg bg-slate-100 dark:bg-zinc-800 px-3.5 py-2 text-xs font-mono text-slate-800 dark:text-zinc-200">
                {syncMessage}
              </div>
            )}
          </div>

          {/* Main Split: Provision New Client Demo Instance (5 cols) + Active Client Demos List (7 cols) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left: Create New Client Demo Instance Form */}
            <form
              onSubmit={handleCreateDemoInstance}
              className="xl:col-span-5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4 h-fit"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Create New Client Demo Instance</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  Uses Active Theme ({activeTheme.colorPresetId})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Prospect Company Name (EN / FR)
                  </label>
                  <input
                    type="text"
                    value={demoNameEn}
                    onChange={(e) => setDemoNameEn(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    اسم الشركة بالعربية (AR)
                  </label>
                  <input
                    type="text"
                    value={demoNameAr}
                    onChange={(e) => setDemoNameAr(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-arabic font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    URL Slug (?demo=...)
                  </label>
                  <input
                    type="text"
                    value={demoSlug}
                    onChange={(e) => setDemoSlug(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono text-xs font-bold text-blue-600 dark:text-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Access PIN
                  </label>
                  <input
                    type="text"
                    value={demoPin}
                    onChange={(e) => setDemoPin(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Primary Hub City
                  </label>
                  <select
                    value={demoCity}
                    onChange={(e) => setDemoCity(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2 py-1.5 text-xs"
                  >
                    {Object.keys(MOROCCO_CITY_COORDS).map((ck) => (
                      <option key={ck} value={ck}>
                        {ck}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Default Language
                  </label>
                  <select
                    value={demoLocale}
                    onChange={(e) => setDemoLocale(e.target.value as Locale)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs"
                  >
                    <option value="fr">Français (FR)</option>
                    <option value="en">English (EN)</option>
                    <option value="ar">العربية (AR - Naskh)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Default Theme Mode
                  </label>
                  <select
                    value={demoColorMode}
                    onChange={(e) =>
                      setDemoColorMode(e.target.value as "light" | "dark")
                    }
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs"
                  >
                    <option value="light">Executive Light Mode</option>
                    <option value="dark">Executive Dark Mode</option>
                  </select>
                </div>
              </div>

              {/* Client Permissions & Module Visibility Toggles */}
              <div className="rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3 space-y-2.5 text-xs">
                <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-300 block">
                  Visible Modules & Permissions for Prospect
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_DEMO_TABS.map((tab) => {
                    const checked = demoAllowedTabs.includes(tab.id);
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleToggleAllowedTab(tab.id)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                          checked
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-500"
                        }`}
                      >
                        {checked ? "✓ " : ""}
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800 flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={demoRequirePin}
                      onChange={(e) => setDemoRequirePin(e.target.checked)}
                    />
                    <span className="font-medium">Require Access PIN</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={demoSandbox}
                      onChange={(e) => setDemoSandbox(e.target.checked)}
                    />
                    <span className="font-medium">Interactive Sandbox CRUD</span>
                  </label>
                </div>
              </div>

              {/* Sales CTA Bar Config */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Header Sales CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={demoCtaLabel}
                    onChange={(e) => setDemoCtaLabel(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    WhatsApp / Booking Link
                  </label>
                  <input
                    type="text"
                    value={demoCtaUrl}
                    onChange={(e) => setDemoCtaUrl(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Protected Client Demo Instance</span>
              </button>
            </form>

            {/* Right: Active Client Demo Instances Directory */}
            <div className="xl:col-span-7 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Provisioned Prospect Demo Instances ({demoInstances.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Share any `?demo=&lt;slug&gt;` link and PIN with a logistics manager, or click &ldquo;Preview as Client&rdquo; to test their exact locked view.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                {demoInstances.map((inst) => {
                  const shareUrl = `${getOriginUrl()}/?demo=${inst.slug}`;
                  const pitchText = `Bonjour, voici votre accès dédié à la plateforme AtlasLogix Fleet & LTL (${inst.clientName.fr}) :\n🔗 Lien : ${shareUrl}\n🔑 Code PIN : ${inst.accessPin}`;

                  return (
                    <div
                      key={inst.id}
                      className="rounded-xl bg-slate-50/70 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm shrink-0"
                            style={{
                              backgroundColor: inst.themeConfig.primaryHex,
                            }}
                          >
                            {inst.themeConfig.brandMonogram}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                                {inst.clientName.en}
                              </h4>
                              <span className="rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                /?demo={inst.slug}
                              </span>
                              <span className="rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                {inst.requirePin
                                  ? `PIN: ${inst.accessPin}`
                                  : "Open Showcase"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                              {inst.city.en} • Locale:{" "}
                              <strong>{inst.defaultLocale.toUpperCase()}</strong> • Mode:{" "}
                              <strong>{inst.defaultColorMode}</strong> • Theme:{" "}
                              <strong>{inst.themeConfig.colorPresetId}</strong> (
                              {inst.themeConfig.latinFont} / {inst.themeConfig.arabicFont})
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPreviewClientDemo(inst)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-3 py-1.5 text-xs font-semibold transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Preview as Client</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(`url-${inst.id}`, shareUrl)
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-100 border border-slate-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200"
                          >
                            {copiedBadge === `url-${inst.id}` ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Copied URL</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(`pitch-${inst.id}`, pitchText)
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-100 border border-slate-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200"
                            title="Copy WhatsApp/Email invitation with Link & PIN"
                          >
                            {copiedBadge === `pitch-${inst.id}` ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Copied Invite</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="h-3.5 w-3.5" />
                                <span>Invite + PIN</span>
                              </>
                            )}
                          </button>

                          {demoInstances.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDeleteDemoInstance(inst.id)}
                              className="rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 p-1.5 text-red-600 dark:text-red-400"
                              title="Delete Demo Instance"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quick Apply Current Studio Theme to this Demo Instance */}
                      <div className="pt-2 border-t border-slate-200/70 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                        <span>
                          Allowed Tabs:{" "}
                          <strong className="font-mono text-slate-700 dark:text-zinc-300">
                            {inst.allowedTabs.join(", ")}
                          </strong>{" "}
                          •{" "}
                          {inst.isInteractiveSandbox
                            ? "Interactive Sandbox"
                            : "Read-Only View"}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateDemoInstance({
                              ...inst,
                              themeConfig: {
                                ...activeTheme,
                                brandMonogram: inst.themeConfig.brandMonogram,
                              },
                            })
                          }
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Apply Active Studio Theme & Fonts to {inst.slug} →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 2: WHITE-LABEL THEME, FONTS, COLORS & SURFACE STYLES STUDIO
      ===================================================================== */}
      {section === "theme" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left: Brand Color Palettes & Custom Hex Picker (6 cols) */}
          <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-5">
            <div className="border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Palette className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Executive Brand Color Palette & Custom Hex Picker</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Choose a curated corporate color scheme or pick any prospect&apos;s exact brand hex color.
              </p>
            </div>

            {/* 6 Curated Color Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                Object.keys(BRAND_COLOR_PRESETS) as Exclude<
                  BrandColorPresetId,
                  "custom"
                >[]
              ).map((presetKey) => {
                const preset = BRAND_COLOR_PRESETS[presetKey];
                const isSelected = activeTheme.colorPresetId === presetKey;
                return (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => handleSelectColorPreset(presetKey)}
                    className={`rounded-xl p-3.5 border text-start transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-slate-50 dark:bg-zinc-800 border-slate-900 dark:border-zinc-400 ring-1 ring-slate-900/15"
                        : "bg-white dark:bg-zinc-950/60 border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-8 w-8 rounded-lg shadow-sm shrink-0 border border-black/10"
                        style={{ backgroundColor: preset.primaryHex }}
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                          {preset.name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                          {preset.primaryHex}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-slate-900 dark:text-white shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Brand Hex Picker + Monogram + Light/Dark Mode */}
            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Custom Brand Hex Color
                </label>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5">
                  <input
                    type="color"
                    value={activeTheme.primaryHex}
                    onChange={(e) =>
                      updateTheme({
                        colorPresetId: "custom",
                        primaryHex: e.target.value,
                        primaryHoverHex: e.target.value,
                        primaryLightHex: e.target.value,
                      })
                    }
                    className="h-6 w-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={activeTheme.primaryHex}
                    onChange={(e) =>
                      updateTheme({
                        colorPresetId: "custom",
                        primaryHex: e.target.value,
                        primaryHoverHex: e.target.value,
                      })
                    }
                    className="w-full bg-transparent font-mono text-xs font-bold uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Brand Monogram Badge
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={activeTheme.brandMonogram}
                  onChange={(e) =>
                    updateTheme({
                      brandMonogram: e.target.value.toUpperCase() || "MA",
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono text-xs font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Active Luminance Mode
                </label>
                <select
                  value={theme}
                  onChange={(e) =>
                    onToggleTheme(e.target.value as "light" | "dark")
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 text-xs font-semibold"
                >
                  <option value="light">Crisp Light Mode (#F8FAFC)</option>
                  <option value="dark">Obsidian Dark Mode (#090A0F)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right: Typography Pairings (Latin, Arabic Naskh/Kufi, Mono) & Card Surface Styles (6 cols) */}
          <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-5">
            <div className="border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Type className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Typography Pairings (Latin + Arabic) & Card Surface Style</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Customize the Latin font, Arabic font (Droid Naskh, Cairo, Tajawal, Almarai), Monospace telemetry font, and card geometry.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Latin Interface Font (English & Français)
                </label>
                <select
                  value={activeTheme.latinFont}
                  onChange={(e) =>
                    updateTheme({ latinFont: e.target.value as LatinFontId })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 text-xs font-semibold"
                >
                  {LATIN_FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Arabic Interface Font (الخط العربي — RTL Mode)
                </label>
                <select
                  value={activeTheme.arabicFont}
                  onChange={(e) =>
                    updateTheme({ arabicFont: e.target.value as ArabicFontId })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 text-xs font-semibold"
                >
                  {ARABIC_FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Monospace Telemetry & KPI Numerals Font
                </label>
                <select
                  value={activeTheme.monoFont}
                  onChange={(e) =>
                    updateTheme({ monoFont: e.target.value as MonoFontId })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 text-xs font-semibold"
                >
                  {MONO_FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Card & Border Surface Style Selector */}
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                  <LayoutGrid className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>UI Card & Border Geometry Style</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      {
                        id: "sharp",
                        title: "Sharp Institutional",
                        desc: "Tight 6px radius & crisp 1px borders",
                      },
                      {
                        id: "modern",
                        title: "Modern B2B SaaS",
                        desc: "Balanced 12px radius & subtle shadow",
                      },
                      {
                        id: "glass",
                        title: "Executive Elevated",
                        desc: "16px smooth radius & deep elevation",
                      },
                    ] as { id: SurfaceStyleId; title: string; desc: string }[]
                  ).map((st) => {
                    const isSelected = activeTheme.surfaceStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => updateTheme({ surfaceStyle: st.id })}
                        className={`rounded-xl p-3 border text-start transition-all ${
                          isSelected
                            ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-600"
                            : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                          {st.title}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 block">
                          {st.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 3: COMPANY PROFILES, TENANTS & UI PREFERENCES GUI
      ===================================================================== */}
      {section === "company" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left: Edit Active Company or Add New Company Profile */}
          <div className="xl:col-span-5 space-y-5">
            {/* Active Company Quick Editor */}
            <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Edit Active Company Profile</span>
                </h3>
                <span className="rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300">
                  {activeCompany.code}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    Company Name (EN / FR)
                  </label>
                  <input
                    type="text"
                    value={activeCompany.name.en}
                    onChange={(e) =>
                      onUpdateCompany({
                        ...activeCompany,
                        name: {
                          ...activeCompany.name,
                          en: e.target.value,
                          fr: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    الاسم بالعربية (Arabic Name)
                  </label>
                  <input
                    type="text"
                    value={activeCompany.name.ar}
                    onChange={(e) =>
                      onUpdateCompany({
                        ...activeCompany,
                        name: {
                          ...activeCompany.name,
                          ar: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-arabic font-semibold text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    Moroccan Tax ICE
                  </label>
                  <input
                    type="text"
                    value={activeCompany.taxIce}
                    onChange={(e) =>
                      onUpdateCompany({
                        ...activeCompany,
                        taxIce: e.target.value,
                      })
                    }
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono text-xs text-slate-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    Total Fleet Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={activeCompany.totalFleetCount}
                    onChange={(e) =>
                      onUpdateCompany({
                        ...activeCompany,
                        totalFleetCount: Math.max(1, parseInt(e.target.value, 10) || 40),
                      })
                    }
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono text-xs text-slate-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    Active Trucks
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={activeCompany.activeTrucksCount}
                    onChange={(e) =>
                      onUpdateCompany({
                        ...activeCompany,
                        activeTrucksCount: Math.max(1, parseInt(e.target.value, 10) || 35),
                      })
                    }
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono text-xs text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>

            {/* Create New Company Profile Form */}
            <form
              onSubmit={handleCreateCompany}
              className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-3.5"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2.5">
                <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Add New Transportation Company Profile</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    Company Name (EN / FR)
                  </label>
                  <input
                    type="text"
                    value={compNameEn}
                    onChange={(e) => setCompNameEn(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    الاسم بالعربية (AR)
                  </label>
                  <input
                    type="text"
                    value={compNameAr}
                    onChange={(e) => setCompNameAr(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-arabic"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    Short Code
                  </label>
                  <input
                    type="text"
                    value={compCode}
                    onChange={(e) => setCompCode(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    HQ Hub City
                  </label>
                  <select
                    value={compCity}
                    onChange={(e) => setCompCity(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs"
                  >
                    {Object.keys(MOROCCO_CITY_COORDS).map((ck) => (
                      <option key={ck} value={ck}>
                        {ck}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    Default Language
                  </label>
                  <select
                    value={compLocale}
                    onChange={(e) => setCompLocale(e.target.value as Locale)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs"
                  >
                    <option value="en">English (EN)</option>
                    <option value="fr">Français (FR)</option>
                    <option value="ar">العربية (AR)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create & Activate Company Profile</span>
              </button>
            </form>
          </div>

          {/* Right: Multi-Tenant Companies Directory Table */}
          <div className="xl:col-span-7 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-4">
              Configured Company Profiles ({companies.length})
            </h3>

            <div className="space-y-3">
              {companies.map((comp) => {
                const isSelected = comp.id === selectedCompanyId;
                return (
                  <div
                    key={comp.id}
                    className={`rounded-xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-blue-50/50 dark:bg-blue-950/25 border-blue-600/70"
                        : "bg-slate-50/60 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800"
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold rounded bg-slate-200/80 dark:bg-zinc-800 px-2 py-0.5 text-slate-800 dark:text-zinc-200">
                          {comp.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                          {comp.name.en}
                        </h4>
                        <span className="text-xs font-arabic text-slate-600 dark:text-zinc-400">
                          ({comp.name.ar})
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 font-mono">
                        <span>HQ: {comp.city[locale]}</span>
                        <span>•</span>
                        <span>ICE: {comp.taxIce}</span>
                        <span>•</span>
                        <span>
                          Fleet: {comp.activeTrucksCount}/{comp.totalFleetCount} trucks
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectCompany(comp.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected ? "✓ Active Profile" : "Activate"}
                      </button>
                      {companies.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteCompany(comp.id)}
                          className="rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 p-1.5 text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 4: OPERATIONAL FORMULAS, ALERT THRESHOLDS & CAPACITY DEFAULTS
      ===================================================================== */}
      {section === "thresholds" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Fuel className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Fuel Tariff, Idling Burn & Highway Toll Formulas</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Benchmark Commercial Gasoil (MAD / Liter)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="5"
                  max="50"
                  value={fuelPriceMad}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v > 0) onUpdateFuelPrice(Math.round(v * 100) / 100);
                  }}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 px-3 py-2 font-mono text-sm font-bold text-blue-600 dark:text-blue-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Idling Alert Trigger Threshold (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={config.idlingAlertThresholdMins}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      idlingAlertThresholdMins: Math.max(1, parseInt(e.target.value, 10) || 10),
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Idling Engine Fuel Burn Rate (Liters / Hour)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="15"
                  value={config.idleFuelBurnLitersPerHour}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      idleFuelBurnLitersPerHour: Math.max(0.5, parseFloat(e.target.value) || 3.5),
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Target Fleet Fuel Efficiency (L / 100km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="15"
                  max="50"
                  value={config.targetFleetConsumptionL100km}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      targetFleetConsumptionL100km: Math.max(
                        15,
                        parseFloat(e.target.value) || 29.5
                      ),
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Avg Heavy-Truck Highway Cruise Speed (km/h)
                </label>
                <input
                  type="number"
                  min="45"
                  max="100"
                  value={config.avgTruckCruiseSpeedKmh}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      avgTruckCruiseSpeedKmh: Math.max(45, parseInt(e.target.value, 10) || 74),
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  ADM Highway Class-3 Toll Rate (MAD / km)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="5"
                  value={config.admHighwayTollMadPerKm}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      admHighwayTollMadPerKm: Math.max(0.1, parseFloat(e.target.value) || 0.85),
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono text-sm font-bold"
                />
              </div>
            </div>
          </div>

          <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Default Truck Capacities & Driver Eco-Score Cutoffs</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Default Max Pallets (EPAL)
                </label>
                <input
                  type="number"
                  min="6"
                  max="66"
                  value={config.defaultMaxPallets}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      defaultMaxPallets: Math.max(6, parseInt(e.target.value, 10) || 33),
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Default Max Volume (m³)
                </label>
                <input
                  type="number"
                  min="15"
                  max="140"
                  value={config.defaultMaxVolumeM3}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      defaultMaxVolumeM3: Math.max(15, parseFloat(e.target.value) || 90),
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Default Max Payload (kg)
                </label>
                <input
                  type="number"
                  step="500"
                  min="2000"
                  max="44000"
                  value={config.defaultMaxWeightKg}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      defaultMaxWeightKg: Math.max(2000, parseInt(e.target.value, 10) || 24000),
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Default Fuel Tank (Liters)
                </label>
                <input
                  type="number"
                  step="50"
                  min="200"
                  max="1600"
                  value={config.defaultFuelTankLiters}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      defaultFuelTankLiters: Math.max(200, parseInt(e.target.value, 10) || 850),
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                  Green Eco-Tier Min Score
                </label>
                <input
                  type="number"
                  min="50"
                  max="98"
                  value={config.ecoGreenMinScore}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      ecoGreenMinScore: Math.max(50, parseInt(e.target.value, 10) || 80),
                    })
                  }
                  className="w-full rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 px-3 py-2 font-mono text-sm font-bold text-emerald-800 dark:text-emerald-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">
                  Yellow Eco-Tier Min Score
                </label>
                <input
                  type="number"
                  min="30"
                  max="85"
                  value={config.ecoYellowMinScore}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      ecoYellowMinScore: Math.max(30, parseInt(e.target.value, 10) || 65),
                    })
                  }
                  className="w-full rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 px-3 py-2 font-mono text-sm font-bold text-amber-800 dark:text-amber-300"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                Propagate new target consumption ({config.targetFleetConsumptionL100km} L/100km) & Eco-Tier cutoffs across all active drivers:
              </span>
              <button
                type="button"
                onClick={onApplyThresholdsToFleet}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Apply Rules Across Entire Fleet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 5: SUPABASE, GOOGLE MAPS & ENVIRONMENT VARIABLES GUI
      ===================================================================== */}
      {section === "integrations" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Supabase PostgreSQL & Google Maps Platform Keys</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Enter {config.adminOwnerName}&apos;s Supabase project credentials and Google Maps API key.
                </p>
              </div>
              {connectionStatus === "valid" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Config Saved
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  NEXT_PUBLIC_SUPABASE_URL (Project Endpoint)
                </label>
                <input
                  type="url"
                  placeholder="https://your-project-ref.supabase.co"
                  value={config.supabaseUrl}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, supabaseUrl: e.target.value })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono text-xs text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY (Public Publishable Anon Key)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={config.supabaseAnonKey}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, supabaseAnonKey: e.target.value })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono text-xs text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (Distance Matrix & Directions API)
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy... (Optional — built-in Morocco road matrix & embed active by default)"
                  value={config.googleMapsApiKey}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, googleMapsApiKey: e.target.value })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono text-xs text-slate-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestConnection}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-4 py-2 text-xs font-semibold transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>
                  {connectionStatus === "testing"
                    ? "Syncing with Supabase..."
                    : "Test & Sync Demos to Supabase"}
                </span>
              </button>
              <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                {demoInstances.length} Demos • {counts.trucks} Trucks
              </span>
            </div>
          </div>

          <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Generated `.env.local` & Vercel Environment Variables</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard("env", generatedEnvLocal)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200"
                  >
                    {copiedBadge === "env" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy .env</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(".env.local", generatedEnvLocal)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .env.local</span>
                  </button>
                </div>
              </div>

              <pre className="mt-4 rounded-xl bg-slate-950 text-slate-200 p-4 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {generatedEnvLocal}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 6: IBRAHIM'S VERCEL / GITHUB / SUPABASE HANDOVER & SNAPSHOTS
      ===================================================================== */}
      {section === "handover" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <CloudUpload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>
                      1. Deploy to {config.adminOwnerName}&apos;s GitHub & Vercel
                    </span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard("git", generatedGitCommands)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200"
                >
                  {copiedBadge === "git" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copied Commands</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Git & Vercel CLI</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    {config.adminOwnerName}&apos;s GitHub Repo URL
                  </label>
                  <input
                    type="text"
                    value={config.githubRepoUrl}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, githubRepoUrl: e.target.value })
                    }
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    Vercel Project Name
                  </label>
                  <input
                    type="text"
                    value={config.vercelProjectName}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, vercelProjectName: e.target.value })
                    }
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono text-xs"
                  />
                </div>
              </div>

              <pre className="rounded-xl bg-slate-950 text-slate-200 p-4 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {generatedGitCommands}
              </pre>
            </div>

            <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>
                      2. Run PostgreSQL Schema in {config.adminOwnerName}&apos;s Supabase
                    </span>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard("sql", SUPABASE_FULL_MIGRATION_SQL)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200"
                  >
                    {copiedBadge === "sql" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copied SQL</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadFile("schema.sql", SUPABASE_FULL_MIGRATION_SQL)
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download schema.sql</span>
                  </button>
                </div>
              </div>

              <pre className="rounded-xl bg-slate-950 text-slate-200 p-4 font-mono text-xs overflow-y-auto max-h-60 leading-relaxed border border-slate-800">
                {SUPABASE_FULL_MIGRATION_SQL}
              </pre>
            </div>
          </div>

          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  3. Export, Share or Restore Full Workspace Configuration Snapshot (JSON)
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const json = onExportFullJson();
                    handleDownloadFile(
                      "atlaslogix-workspace-snapshot.json",
                      json,
                      "application/json"
                    );
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-semibold shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Full Config JSON</span>
                </button>

                <button
                  type="button"
                  onClick={onResetAllToFactory}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset All to Factory Demo Data</span>
                </button>
              </div>
            </div>

            {importStatusMsg && (
              <div className="rounded-lg bg-slate-100 dark:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-zinc-100">
                {importStatusMsg}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-9">
                <textarea
                  rows={3}
                  placeholder="Paste a previously exported atlaslogix-workspace-snapshot.json payload here..."
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3 font-mono text-xs text-slate-900 dark:text-zinc-100"
                />
              </div>
              <div className="lg:col-span-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleRunJsonImport}
                  disabled={!importJsonText.trim()}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 py-2.5 text-xs font-semibold transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Import & Restore JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
