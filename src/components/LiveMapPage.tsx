"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  Radio,
  Flame,
  PowerOff,
  PlusCircle,
  Pause,
  Play,
  MapPin,
  Truck,
  Route,
  ExternalLink,
  Compass,
  Boxes,
  KeyRound,
  BellRing,
  MessageCircle,
} from "lucide-react";
import {
  calculateMoroccoRoute,
  DriverEcoRecord,
  GpsTelemetryLatestRow,
  Locale,
  MapTruck,
  MOROCCO_CITY_COORDS,
  TelemetryAlert,
} from "@/lib/supabase/database";
import { TranslationDictionary } from "@/lib/i18n/translations";

interface LiveMapPageProps {
  locale: Locale;
  t: TranslationDictionary;
  theme: "light" | "dark";
  fuelPriceMad: number;
  trucks: MapTruck[];
  alerts: TelemetryAlert[];
  drivers?: DriverEcoRecord[];
  liveTelemetry?: GpsTelemetryLatestRow[];
  isStreamRunning: boolean;
  onToggleStream: () => void;
  onSimulateAlert: () => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onStopTruckIdle: (truckId: string) => void;
  onNavigateGpsStudio?: () => void;
}

interface MoroccoHub {
  id: string;
  lat: number;
  lng: number;
  isPort?: boolean;
  labelAlign?: "start" | "end";
  label: Record<Locale, string>;
}

function projectLatLng(lat: number, lng: number): { x: number; y: number } {
  const minLng = -17.8;
  const maxLng = -0.8;
  const minLat = 20.2;
  const maxLat = 36.3;

  const x = 85 + ((lng - minLng) / (maxLng - minLng)) * 750;
  const y = 40 + ((maxLat - lat) / (maxLat - minLat)) * 680;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

const MOROCCO_BORDER_COORDS: [number, number][] = [
  [35.78, -5.92],
  [35.89, -5.50],
  [35.88, -5.35],
  [35.58, -5.32],
  [35.24, -3.93],
  [35.17, -2.93],
  [35.09, -2.21],
  [34.68, -1.91],
  [33.05, -2.00],
  [32.11, -1.23],
  [32.42, -1.96],
  [31.95, -3.60],
  [31.10, -4.01],
  [29.82, -5.72],
  [29.55, -7.20],
  [28.65, -8.67],
  [27.42, -8.67],
  [26.00, -11.99],
  [25.14, -12.00],
  [23.45, -12.00],
  [21.34, -13.00],
  [21.33, -16.95],
  [20.83, -17.09],
  [21.35, -16.98],
  [22.25, -16.75],
  [23.71, -15.93],
  [24.65, -14.88],
  [26.12, -14.48],
  [27.15, -13.20],
  [27.94, -12.92],
  [28.43, -11.10],
  [29.38, -10.17],
  [29.70, -9.73],
  [30.42, -9.60],
  [30.63, -9.88],
  [31.51, -9.77],
  [32.30, -9.24],
  [33.25, -8.50],
  [33.60, -7.62],
  [34.02, -6.84],
  [34.26, -6.58],
  [35.19, -6.15],
  [35.46, -6.03],
];

const MOROCCO_HUBS: MoroccoHub[] = [
  {
    id: "tanger-med",
    lat: 35.88,
    lng: -5.50,
    isPort: true,
    label: {
      en: "Tanger Med Port",
      fr: "Port Tanger Med",
      ar: "ميناء طنجة المتوسط",
    },
  },
  {
    id: "oujda",
    lat: 34.68,
    lng: -1.91,
    label: {
      en: "Oujda",
      fr: "Oujda",
      ar: "وجدة",
    },
  },
  {
    id: "fes",
    lat: 34.03,
    lng: -5.00,
    label: {
      en: "Fès",
      fr: "Fès",
      ar: "فاس",
    },
  },
  {
    id: "kenitra",
    lat: 34.26,
    lng: -6.58,
    labelAlign: "end",
    label: {
      en: "Kenitra AFZ",
      fr: "Kénitra ZFA",
      ar: "القنيطرة",
    },
  },
  {
    id: "rabat",
    lat: 34.02,
    lng: -6.84,
    labelAlign: "end",
    label: {
      en: "Rabat",
      fr: "Rabat",
      ar: "الرباط",
    },
  },
  {
    id: "casablanca",
    lat: 33.60,
    lng: -7.62,
    isPort: true,
    labelAlign: "end",
    label: {
      en: "Casablanca Zenata",
      fr: "Casablanca Zenata",
      ar: "الدار البيضاء زناتة",
    },
  },
  {
    id: "jorf-lasfar",
    lat: 33.12,
    lng: -8.62,
    isPort: true,
    labelAlign: "end",
    label: {
      en: "Jorf Lasfar Port",
      fr: "Port Jorf Lasfar",
      ar: "ميناء الجرف الأصفر",
    },
  },
  {
    id: "marrakech",
    lat: 31.63,
    lng: -8.00,
    label: {
      en: "Marrakech",
      fr: "Marrakech",
      ar: "مراكش",
    },
  },
  {
    id: "agadir",
    lat: 30.42,
    lng: -9.60,
    isPort: true,
    label: {
      en: "Agadir Port",
      fr: "Port d'Agadir",
      ar: "ميناء أكادير",
    },
  },
  {
    id: "guelmim-tantan",
    lat: 28.43,
    lng: -11.10,
    isPort: true,
    label: {
      en: "Guelmim / Tan-Tan",
      fr: "Guelmim / Tan-Tan",
      ar: "كلميم / طانطان",
    },
  },
  {
    id: "laayoune",
    lat: 27.15,
    lng: -13.20,
    isPort: true,
    label: {
      en: "Laâyoune",
      fr: "Laâyoune",
      ar: "العيون",
    },
  },
  {
    id: "boujdour",
    lat: 26.12,
    lng: -14.48,
    labelAlign: "end",
    label: {
      en: "Boujdour",
      fr: "Boujdour",
      ar: "بوجدور",
    },
  },
  {
    id: "dakhla",
    lat: 23.71,
    lng: -15.93,
    isPort: true,
    label: {
      en: "Dakhla Atlantic Port",
      fr: "Port Atlantique Dakhla",
      ar: "ميناء الداخلة الأطلسي",
    },
  },
  {
    id: "guerguerat-lagouira",
    lat: 20.95,
    lng: -17.02,
    isPort: true,
    label: {
      en: "El Guerguerat / Lagouira",
      fr: "El Guerguerat / Lagouira",
      ar: "الكركرات / الكويرة",
    },
  },
];

const CORRIDOR_ROUTES: {
  id: string;
  badge: string;
  badgeLat: number;
  badgeLng: number;
  coords: [number, number][];
}[] = [
  {
    id: "a1-a5",
    badge: "A1/A5",
    badgeLat: 34.9,
    badgeLng: -6.15,
    coords: [
      [35.88, -5.50],
      [35.19, -6.15],
      [34.26, -6.58],
      [34.02, -6.84],
      [33.60, -7.62],
      [33.12, -8.62],
    ],
  },
  {
    id: "a2",
    badge: "A2",
    badgeLat: 34.28,
    badgeLng: -3.55,
    coords: [
      [34.02, -6.84],
      [33.89, -5.55],
      [34.03, -5.00],
      [34.21, -4.01],
      [34.68, -1.91],
    ],
  },
  {
    id: "a3-a7",
    badge: "A7",
    badgeLat: 31.95,
    badgeLng: -8.05,
    coords: [
      [33.60, -7.62],
      [33.00, -7.62],
      [31.63, -8.00],
      [30.42, -9.60],
    ],
  },
  {
    id: "n1-sahara",
    badge: "N1 Express",
    badgeLat: 25.4,
    badgeLng: -14.8,
    coords: [
      [30.42, -9.60],
      [28.98, -10.05],
      [28.43, -11.10],
      [27.94, -12.92],
      [27.15, -13.20],
      [26.12, -14.48],
      [23.71, -15.93],
      [21.33, -16.95],
      [20.83, -17.09],
    ],
  },
];

type MapViewportMode = "full" | "north" | "south";

export function LiveMapPage({
  locale,
  t,
  theme,
  fuelPriceMad,
  trucks,
  alerts,
  drivers = [],
  liveTelemetry = [],
  isStreamRunning,
  onToggleStream,
  onSimulateAlert,
  onAcknowledgeAlert,
  onStopTruckIdle,
  onNavigateGpsStudio,
}: LiveMapPageProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "moving" | "idling" | "alert">("all");
  const [viewportMode, setViewportMode] = useState<MapViewportMode>("full");
  const [mapEngine, setMapEngine] = useState<"vector" | "google">("vector");
  const [selectedTruckId, setSelectedTruckId] = useState<string>("trk-12");
  const [shutoffSentIds, setShutoffSentIds] = useState<Record<string, boolean>>({});
  const [calcOriginKey, setCalcOriginKey] = useState<string>("Tanger Med Port");
  const [calcDestKey, setCalcDestKey] = useState<string>("Casablanca Zenata");
  const [googleApiKey, setGoogleApiKey] = useState<string>("");
  const [showApiKeyConfig, setShowApiKeyConfig] = useState<boolean>(false);

  const isDark = theme === "dark";
  const cityKeys = useMemo(() => Object.keys(MOROCCO_CITY_COORDS), []);

  const filteredTrucks = useMemo(() => {
    if (statusFilter === "all") return trucks;
    return trucks.filter((trk) => trk.status === statusFilter);
  }, [trucks, statusFilter]);

  const selectedTruck = useMemo(() => {
    return trucks.find((trk) => trk.id === selectedTruckId) || trucks[0];
  }, [trucks, selectedTruckId]);

  // Automatically sync Google Maps Distance Calculator when selecting a truck
  useEffect(() => {
    if (!selectedTruck) return;
    if (
      selectedTruck.originCityKey &&
      MOROCCO_CITY_COORDS[selectedTruck.originCityKey]
    ) {
      setCalcOriginKey(selectedTruck.originCityKey);
    }
    if (
      selectedTruck.destinationCityKey &&
      MOROCCO_CITY_COORDS[selectedTruck.destinationCityKey]
    ) {
      setCalcDestKey(selectedTruck.destinationCityKey);
    }
  }, [selectedTruck]);

  const routeMetrics = useMemo(() => {
    return calculateMoroccoRoute(
      calcOriginKey,
      calcDestKey,
      fuelPriceMad,
      selectedTruck?.targetConsumptionL100km ?? 29.0
    );
  }, [calcOriginKey, calcDestKey, fuelPriceMad, selectedTruck]);

  const totalIdlingCostMad = useMemo(() => {
    return (
      Math.round(
        trucks
          .filter((trk) => trk.status === "idling")
          .reduce((sum, trk) => sum + trk.wastedFuelLiters * fuelPriceMad, 0) * 100
      ) / 100
    );
  }, [trucks, fuelPriceMad]);

  const handleShutoffCommand = (truckId: string) => {
    setShutoffSentIds((prev) => ({ ...prev, [truckId]: true }));
    onStopTruckIdle(truckId);
  };

  const moroccoPolygonPath = useMemo(() => {
    return (
      MOROCCO_BORDER_COORDS.map(([lat, lng], idx) => {
        const { x, y } = projectLatLng(lat, lng);
        return `${idx === 0 ? "M" : "L"} ${x},${y}`;
      }).join(" ") + " Z"
    );
  }, []);

  const svgViewBox = useMemo(() => {
    if (viewportMode === "north") return "320 20 520 350";
    if (viewportMode === "south") return "50 280 540 460";
    return "0 0 900 760";
  }, [viewportMode]);

  const regionLabels = {
    full: {
      en: "Full Kingdom (Tanger – Lagouira)",
      fr: "Royaume Complet (Tanger – Lagouira)",
      ar: "المملكة كاملة (طنجة – الكويرة)",
    },
    north: {
      en: "North & Central (Tanger – Agadir)",
      fr: "Nord & Centre (Tanger – Agadir)",
      ar: "الشمال والوسط (طنجة – أكادير)",
    },
    south: {
      en: "Southern Provinces (Agadir – Dakhla – Lagouira)",
      fr: "Provinces du Sud (Agadir – Dakhla – Lagouira)",
      ar: "الأقاليم الجنوبية (أكادير – الداخلة – الكويرة)",
    },
  };

  const cleanAlertText = (raw: string) => raw.replace(/^[⚠️🚨🔄✅]+\s*/u, "");

  return (
    <div className="space-y-5">
      {/* Header & Filter Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isStreamRunning ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isStreamRunning ? "bg-emerald-600 dark:bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
              {t.liveMap.title}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {t.liveMap.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter Pills */}
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-800">
            {(
              [
                { id: "all", label: t.liveMap.filterAll, count: trucks.length },
                {
                  id: "moving",
                  label: t.liveMap.filterMoving,
                  count: trucks.filter((x) => x.status === "moving").length,
                },
                {
                  id: "idling",
                  label: t.liveMap.filterIdling,
                  count: trucks.filter((x) => x.status === "idling").length,
                },
                {
                  id: "alert",
                  label: t.liveMap.filterAlert,
                  count: trucks.filter((x) => x.status === "alert").length,
                },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all flex items-center gap-1.5 ${
                  statusFilter === f.id
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                <span>{f.label}</span>
                <span className="rounded bg-slate-200/70 dark:bg-zinc-900 px-1.5 py-0.2 font-mono text-[10px] text-slate-700 dark:text-zinc-300">
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Stream Pause/Resume */}
          <button
            type="button"
            onClick={onToggleStream}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
          >
            {isStreamRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isStreamRunning ? t.liveMap.liveStreamActive : t.liveMap.liveStreamPaused}
          </button>

          {/* Simulate Telemetry Event */}
          <button
            type="button"
            onClick={onSimulateAlert}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            {t.liveMap.simulateTelemetryBtn}
          </button>

          {onNavigateGpsStudio && (
            <button
              type="button"
              onClick={onNavigateGpsStudio}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-colors"
            >
              <BellRing className="h-3.5 w-3.5" />
              <span>Configure GPS & WhatsApp/Telegram Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Google Maps Distance & Route Matrix Bar */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-zinc-100">
              <Compass className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>
                {locale === "ar"
                  ? "محرك خرائط جوجل وحساب المسافات الطرقية"
                  : locale === "fr"
                  ? "Moteur Google Maps & Calculateur de Distances Routières"
                  : "Google Maps Route & Distance Matrix Engine"}
              </span>
            </div>

            {/* Map Engine Toggle: Vector Kingdom vs Google Maps Embed */}
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setMapEngine("vector")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  mapEngine === "vector"
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {locale === "ar"
                  ? "خريطة التتبع (المملكة كاملة)"
                  : locale === "fr"
                  ? "Carte Télémétrie (100% Maroc)"
                  : "Telemetry Map (100% Morocco)"}
              </button>
              <button
                type="button"
                onClick={() => setMapEngine("google")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  mapEngine === "google"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Route className="h-3.5 w-3.5" />
                <span>Google Maps Live Route</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Origin Selector */}
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs">
              <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-zinc-500">
                {locale === "ar" ? "الانطلاق:" : locale === "fr" ? "Départ:" : "Origin:"}
              </span>
              <select
                aria-label="Route Origin City"
                value={calcOriginKey}
                onChange={(e) => setCalcOriginKey(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                {cityKeys.map((ck) => (
                  <option key={ck} value={ck} className="bg-white dark:bg-zinc-900">
                    {MOROCCO_CITY_COORDS[ck].label[locale]}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-400 font-mono text-xs">→</span>

            {/* Destination Selector */}
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs">
              <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-zinc-500">
                {locale === "ar" ? "الوجهة:" : locale === "fr" ? "Destination:" : "Dest:"}
              </span>
              <select
                aria-label="Route Destination City"
                value={calcDestKey}
                onChange={(e) => setCalcDestKey(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                {cityKeys.map((ck) => (
                  <option key={ck} value={ck} className="bg-white dark:bg-zinc-900">
                    {MOROCCO_CITY_COORDS[ck].label[locale]}
                  </option>
                ))}
              </select>
            </div>

            {/* Open in Google Maps External Link */}
            <a
              href={routeMetrics.googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Google Maps ↗</span>
            </a>

            {/* API Key Config Toggle */}
            <button
              type="button"
              onClick={() => setShowApiKeyConfig((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs font-mono text-slate-600 dark:text-zinc-400"
              title="Configure Google Maps Distance Matrix API Key"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">API Key</span>
            </button>
          </div>
        </div>

        {/* Computed Distance, HGV Duration, ADM Toll & Fuel Cost Ribbon */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800 px-3 py-2 flex items-center justify-between">
            <span className="text-slate-500 dark:text-zinc-400">
              {locale === "ar" ? "المسافة الطرقية:" : locale === "fr" ? "Distance Routière:" : "Road Distance:"}
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
              {routeMetrics.distanceKm} km ({routeMetrics.corridor})
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800 px-3 py-2 flex items-center justify-between">
            <span className="text-slate-500 dark:text-zinc-400">
              {locale === "ar" ? "مدة رحلة الشاحنة:" : locale === "fr" ? "Temps Trajet PL:" : "HGV Transit ETA:"}
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
              {routeMetrics.durationFormatted}
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800 px-3 py-2 flex items-center justify-between">
            <span className="text-slate-500 dark:text-zinc-400">
              {locale === "ar" ? "وقود الرحلة المقدر:" : locale === "fr" ? "Gasoil Estimé:" : "Est. Trip Diesel:"}
            </span>
            <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
              {routeMetrics.estimatedFuelLiters} L ({routeMetrics.estimatedFuelCostMad.toLocaleString()} MAD)
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800 px-3 py-2 flex items-center justify-between">
            <span className="text-slate-500 dark:text-zinc-400">
              {locale === "ar" ? "رسوم الطريق السيار:" : locale === "fr" ? "Péage ADM (Classe 3):" : "ADM Highway Toll:"}
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
              {routeMetrics.admTollMad} MAD
            </span>
          </div>
        </div>

        {showApiKeyConfig && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 dark:text-zinc-400">
              Optional Google Maps Distance Matrix / Directions API Key (falls back to built-in Moroccan Highway Matrix + Google Embed when blank):
            </span>
            <input
              type="password"
              placeholder="AIzaSy... (Google Maps Platform Key)"
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
              className="w-full sm:w-72 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-zinc-100"
            />
          </div>
        )}
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Complete Map of the Kingdom of Morocco (Tangier to Lagouira) or Google Maps Live Route */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm">
            {/* Top Map Overlay Bar */}
            <div className="absolute top-3 inset-x-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs shadow-sm">
                <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  {mapEngine === "google"
                    ? `Google Maps: ${calcOriginKey} → ${calcDestKey} (${routeMetrics.distanceKm} km)`
                    : regionLabels[viewportMode][locale]}
                </span>
                {mapEngine === "vector" && (
                  <>
                    <span className="text-slate-300 dark:text-zinc-700">|</span>
                    {(["full", "north", "south"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setViewportMode(mode)}
                        className={`rounded px-2 py-0.5 text-[11px] font-mono font-semibold transition-colors ${
                          viewportMode === mode
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {mode === "full"
                          ? "100% Maroc"
                          : mode === "north"
                          ? "Zoom Nord"
                          : "Zoom Sud"}
                      </button>
                    ))}
                  </>
                )}
              </div>

              <div className="pointer-events-auto rounded-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-mono text-slate-700 dark:text-zinc-300 flex items-center gap-2 shadow-sm">
                <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>
                  {t.liveMap.totalLiveIdlingCost}:{" "}
                  <strong className="text-slate-900 dark:text-zinc-100">
                    {totalIdlingCostMad.toFixed(2)} MAD
                  </strong>
                </span>
              </div>
            </div>

            {mapEngine === "google" ? (
              <div className="w-full h-[510px] sm:h-[565px] pt-12 bg-slate-100 dark:bg-zinc-950 flex flex-col">
                <iframe
                  title={`Google Maps Route ${calcOriginKey} to ${calcDestKey}`}
                  src={routeMetrics.googleMapsEmbedUrl}
                  className="w-full flex-1 border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              /* Cartographic SVG Map of the Kingdom of Morocco */
              <svg
                viewBox={svgViewBox}
                className="w-full h-[510px] sm:h-[565px] select-none transition-all duration-500"
              >
                {/* Clean Cartographic Water Background */}
                <rect
                  width="900"
                  height="760"
                  fill={isDark ? "#0D1117" : "#EEF2F6"}
                />

                {/* Subtle Coordinate Graticules */}
                {Array.from({ length: 12 }, (_, i) => (
                  <line
                    key={`vg-${i}`}
                    x1={i * 80}
                    y1={0}
                    x2={i * 80}
                    y2={760}
                    stroke={isDark ? "#1E293B" : "#DCE3EC"}
                    strokeOpacity={isDark ? "0.4" : "0.7"}
                    strokeWidth="1"
                  />
                ))}
                {Array.from({ length: 10 }, (_, i) => (
                  <line
                    key={`hg-${i}`}
                    x1={0}
                    y1={i * 80}
                    x2={900}
                    y2={i * 80}
                    stroke={isDark ? "#1E293B" : "#DCE3EC"}
                    strokeOpacity={isDark ? "0.4" : "0.7"}
                    strokeWidth="1"
                  />
                ))}

                {/* Water Body Labels */}
                <text
                  x="140"
                  y="260"
                  fill={isDark ? "#475569" : "#94A3B8"}
                  className="text-[11px] font-mono tracking-[0.22em] uppercase"
                >
                  Atlantic Ocean
                </text>
                <text
                  x="660"
                  y="42"
                  fill={isDark ? "#475569" : "#94A3B8"}
                  className="text-[10px] font-mono tracking-[0.18em] uppercase"
                >
                  Mediterranean Sea
                </text>

                {/* Undivided Full Kingdom of Morocco Territory Polygon (Tangier to Lagouira) */}
                <path
                  d={moroccoPolygonPath}
                  fill={isDark ? "#161D2A" : "#FFFFFF"}
                  stroke={isDark ? "#334155" : "#94A3B8"}
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />

                {/* Moroccan Autoroutes & N1 National Expressway */}
                {CORRIDOR_ROUTES.map((route) => {
                  const pointsStr = route.coords
                    .map(([lat, lng]) => {
                      const { x, y } = projectLatLng(lat, lng);
                      return `${x},${y}`;
                    })
                    .join(" ");
                  const badgePos = projectLatLng(route.badgeLat, route.badgeLng);
                  const strokeColor = isDark ? "#3B82F6" : "#1D4ED8";

                  return (
                    <g key={route.id}>
                      <polyline
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="2.5"
                        strokeOpacity="0.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={pointsStr}
                      />
                      <g transform={`translate(${badgePos.x}, ${badgePos.y})`}>
                        <rect
                          x="-26"
                          y="-8"
                          width="52"
                          height="16"
                          rx="3"
                          fill={isDark ? "#1E293B" : "#F8FAFC"}
                          stroke={isDark ? "#475569" : "#CBD5E1"}
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill={isDark ? "#E2E8F0" : "#1E293B"}
                          className="text-[8.5px] font-mono font-semibold"
                        >
                          {route.badge}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Active Route Vector Line between Selected Origin & Destination */}
                {(() => {
                  const origHub = MOROCCO_CITY_COORDS[calcOriginKey];
                  const destHub = MOROCCO_CITY_COORDS[calcDestKey];
                  if (!origHub || !destHub || calcOriginKey === calcDestKey) return null;
                  const p1 = projectLatLng(origHub.lat, origHub.lng);
                  const p2 = projectLatLng(destHub.lat, destHub.lng);
                  const midX = (p1.x + p2.x) / 2;
                  const midY = (p1.y + p2.y) / 2;
                  return (
                    <g>
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="#059669"
                        strokeWidth="2"
                        strokeDasharray="5 4"
                      />
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-34"
                          y="-9"
                          width="68"
                          height="17"
                          rx="4"
                          fill="#059669"
                        />
                        <text
                          x="0"
                          y="2.5"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          className="text-[8.5px] font-mono font-bold"
                        >
                          {routeMetrics.distanceKm} km
                        </text>
                      </g>
                    </g>
                  );
                })()}

                {/* Major Moroccan Logistics Hubs & Ports */}
                {MOROCCO_HUBS.map((hub) => {
                  const { x, y } = projectLatLng(hub.lat, hub.lng);
                  const isEnd = hub.labelAlign === "end";
                  return (
                    <g key={hub.id} transform={`translate(${x}, ${y})`}>
                      <circle
                        r={hub.isPort ? 4 : 3}
                        fill={
                          hub.isPort
                            ? isDark
                              ? "#3B82F6"
                              : "#1D4ED8"
                            : isDark
                            ? "#94A3B8"
                            : "#475569"
                        }
                        stroke={isDark ? "#0F172A" : "#FFFFFF"}
                        strokeWidth="1.5"
                      />
                      <text
                        x={isEnd ? -8 : 8}
                        y={3.5}
                        textAnchor={isEnd ? "end" : "start"}
                        fill={isDark ? "#CBD5E1" : "#334155"}
                        className="text-[9.5px] font-medium"
                      >
                        {hub.label[locale]}
                      </text>
                    </g>
                  );
                })}

                {/* Active Fleet Truck Markers */}
                {filteredTrucks.map((trk) => {
                  const { x, y } = projectLatLng(trk.lat, trk.lng);
                  const isSelected = trk.id === selectedTruck?.id;
                  const dotColor =
                    trk.status === "alert"
                      ? "#DC2626"
                      : trk.status === "idling"
                      ? "#D97706"
                      : "#059669";

                  return (
                    <g
                      key={trk.id}
                      transform={`translate(${x}, ${y})`}
                      onClick={() => setSelectedTruckId(trk.id)}
                      className="cursor-pointer"
                    >
                      {isSelected && (
                        <circle
                          r={16}
                          fill={dotColor}
                          fillOpacity="0.18"
                          stroke={dotColor}
                          strokeWidth="1.25"
                        />
                      )}

                      <circle
                        r={isSelected ? 8.5 : 7}
                        fill={dotColor}
                        stroke={isDark ? "#090D16" : "#FFFFFF"}
                        strokeWidth="2"
                      />

                      <g transform="translate(0, -14)">
                        <rect
                          x="-27"
                          y="-8.5"
                          width="54"
                          height="14.5"
                          rx="3.5"
                          fill={isDark ? "#0F172A" : "#1E293B"}
                          stroke={isSelected ? "#3B82F6" : "#475569"}
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="1.5"
                          textAnchor="middle"
                          fill="#F8FAFC"
                          className="text-[8.5px] font-mono font-semibold"
                        >
                          {trk.code}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Bottom Map Legend & Coordinates Bar */}
            <div className="bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  {t.liveMap.selectTruckHint}
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                {selectedTruck
                  ? `${selectedTruck.code}: ${selectedTruck.lat.toFixed(
                      4
                    )}° N, ${Math.abs(selectedTruck.lng).toFixed(4)}° W • ${
                      selectedTruck.remainingDistanceKm ??
                      routeMetrics.distanceKm
                    } km rem.`
                  : "0 Active Trucks — Add trucks manually or import Excel (.xlsx) in Fleet Manager"}
              </span>
            </div>
          </div>

          {/* Selected Truck Telemetry & Full Capacity/Pallets Card */}
          {selectedTruck && (
            <motion.div
              key={selectedTruck.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 font-mono">
                        {selectedTruck.code}
                      </h3>
                      <span className="rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 text-xs font-mono text-slate-700 dark:text-zinc-300">
                        {selectedTruck.plate}
                      </span>
                      <span className="rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-300">
                        {selectedTruck.trailerType ?? "Tautliner 13.6m"} •{" "}
                        {selectedTruck.axleConfig ?? "40T"}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase border ${
                          selectedTruck.status === "alert"
                            ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60"
                            : selectedTruck.status === "idling"
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                            : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                        }`}
                      >
                        {selectedTruck.status}
                      </span>
                      {(selectedTruck.lastGpsPingAt ||
                        selectedTruck.gpsDeviceImei ||
                        liveTelemetry.some(
                          (lt) =>
                            lt.truck_code.toLowerCase() ===
                              selectedTruck.code.toLowerCase() ||
                            (selectedTruck.gpsDeviceImei &&
                              lt.device_imei === selectedTruck.gpsDeviceImei)
                        )) && (
                        <>
                          <span className="rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2 py-0.5 text-[10px] font-mono font-bold text-sky-700 dark:text-sky-300">
                            LIVE GPS
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold border ${
                              selectedTruck.ignitionOn ?? selectedTruck.status !== "moving"
                                ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                            }`}
                          >
                            {selectedTruck.ignitionOn === false
                              ? "ENGINE OFF"
                              : "IGNITION ON"}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {selectedTruck.model} • {selectedTruck.currentLocation[locale]}
                    </p>
                  </div>
                </div>

                {selectedTruck.status === "idling" && (
                  <button
                    type="button"
                    onClick={() => handleShutoffCommand(selectedTruck.id)}
                    disabled={!!shutoffSentIds[selectedTruck.id]}
                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold border transition-all ${
                      shutoffSentIds[selectedTruck.id]
                        ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 border-transparent shadow-sm"
                    }`}
                  >
                    <PowerOff className="h-3.5 w-3.5" />
                    {shutoffSentIds[selectedTruck.id]
                      ? t.liveMap.idleCommandSent
                      : t.liveMap.stopIdleCommandBtn}
                  </button>
                )}
              </div>

              {/* Row 1: Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
                <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 p-3">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    {t.liveMap.speedLabel}
                  </span>
                  <span className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100 block">
                    {selectedTruck.speedKmh} km/h
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 p-3">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    {t.liveMap.idleTimeLabel}
                  </span>
                  <span className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100 block">
                    {selectedTruck.idleMinutes} min
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 p-3">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    {t.liveMap.fuelBurnLabel}
                  </span>
                  <span className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100 block">
                    {selectedTruck.fuelRateLph} L/h
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 p-3">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    {t.liveMap.wastedCostLabel}
                  </span>
                  <span className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100 block">
                    {(selectedTruck.wastedFuelLiters * fuelPriceMad).toFixed(1)} MAD
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 p-3">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    {t.liveMap.cargoLoadLabel}
                  </span>
                  <span className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100 block">
                    {selectedTruck.cargoUtilizationPct}%
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 p-3">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    {t.liveMap.driverLabel}
                  </span>
                  <span className="mt-1 text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate block">
                    {selectedTruck.driverName[locale]}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                    {selectedTruck.corridor}
                  </span>
                </div>
              </div>

              {/* Row 2: Truck Pallets, Volume Capacity, Payload Weight, Tank & Route Distance */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                <div className="rounded-lg bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-200/70 dark:border-zinc-800/80 p-2.5">
                  <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                    <Boxes className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    {locale === "ar" ? "الطبليات (EPAL)" : locale === "fr" ? "Palettes (EPAL)" : "Pallets (EPAL)"}
                  </span>
                  <span className="mt-1 text-xs font-bold font-mono text-slate-900 dark:text-zinc-100 block">
                    {selectedTruck.loadedPallets ?? 26} / {selectedTruck.maxPallets ?? 33} Pal.
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-200/70 dark:border-zinc-800/80 p-2.5">
                  <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 block">
                    {locale === "ar" ? "سعة الحجم (م³)" : locale === "fr" ? "Volume (m³)" : "Volume Cap (m³)"}
                  </span>
                  <span className="mt-1 text-xs font-bold font-mono text-slate-900 dark:text-zinc-100 block">
                    {selectedTruck.loadedVolumeM3 ?? 72} / {selectedTruck.maxVolumeM3 ?? 90} m³
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-200/70 dark:border-zinc-800/80 p-2.5">
                  <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 block">
                    {locale === "ar" ? "الوزن الصافي" : locale === "fr" ? "Charge Utile (T)" : "Payload Weight"}
                  </span>
                  <span className="mt-1 text-xs font-bold font-mono text-slate-900 dark:text-zinc-100 block">
                    {((selectedTruck.loadedWeightKg ?? 19200) / 1000).toFixed(1)} /{" "}
                    {((selectedTruck.maxWeightKg ?? 24000) / 1000).toFixed(1)} T
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-200/70 dark:border-zinc-800/80 p-2.5">
                  <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 block">
                    {locale === "ar" ? "خزان الوقود" : locale === "fr" ? "Réservoir Gasoil" : "Fuel Tank Level"}
                  </span>
                  <span className="mt-1 text-xs font-bold font-mono text-slate-900 dark:text-zinc-100 block">
                    {selectedTruck.fuelLevelPct ?? 75}% ({selectedTruck.fuelTankCapacityL ?? 800} L)
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-200/70 dark:border-zinc-800/80 p-2.5">
                  <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 block">
                    {locale === "ar" ? "المسافة المتبقية" : locale === "fr" ? "Distance Restante" : "Route Distance"}
                  </span>
                  <span className="mt-1 text-xs font-bold font-mono text-blue-700 dark:text-blue-400 block">
                    {selectedTruck.remainingDistanceKm ?? routeMetrics.distanceKm} /{" "}
                    {selectedTruck.routeDistanceKm ?? routeMetrics.distanceKm} km
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Real-Time GPS Telemetry Feed */}
        <div className="xl:col-span-5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Radio className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {t.liveMap.telemetryFeedTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {t.liveMap.telemetryFeedSubtitle}
              </p>
            </div>
            <span className="rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2.5 py-1 font-mono text-xs text-slate-700 dark:text-zinc-300">
              {alerts.length} events
            </span>
          </div>

          <div className="mt-4 space-y-2.5 overflow-y-auto max-h-[640px] pe-1">
            <AnimatePresence initial={false}>
              {alerts.map((alert) => {
                const isSelected = alert.truckId === selectedTruck?.id;
                const statusBadge =
                  alert.severity === "critical"
                    ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60"
                    : alert.severity === "warning"
                    ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                    : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60";

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    onClick={() => setSelectedTruckId(alert.truckId)}
                    className={`cursor-pointer rounded-lg p-3.5 border transition-all ${
                      isSelected
                        ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-500/60"
                        : "bg-slate-50/70 dark:bg-zinc-950/50 border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-mono mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-bold border ${statusBadge}`}
                        >
                          {alert.truckCode}
                        </span>
                        <span className="text-slate-600 dark:text-zinc-400 font-medium">
                          {alert.corridor}
                        </span>
                      </div>
                      <span className="text-slate-400 dark:text-zinc-500">
                        {alert.timestamp}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-zinc-100 leading-snug">
                      {cleanAlertText(alert.text[locale])}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      {alert.detail[locale]}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-zinc-800/70">
                      {alert.wastedFuelLiters ? (
                        <span className="text-xs font-mono font-medium text-amber-800 dark:text-amber-400">
                          {(alert.wastedFuelLiters * fuelPriceMad).toFixed(2)} MAD ({alert.wastedFuelLiters} L @ {fuelPriceMad.toFixed(2)})
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                          CAN-BUS J1939
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const matchedDriver = drivers.find(
                            (d) =>
                              d.truckCode.toLowerCase() ===
                              alert.truckCode.toLowerCase()
                          );
                          let digits = (
                            matchedDriver?.whatsapp ||
                            matchedDriver?.phone ||
                            ""
                          ).replace(/[^\d]/g, "");
                          if (digits.startsWith("00")) digits = digits.slice(2);
                          if (digits.length === 10 && digits.startsWith("0")) {
                            digits = `212${digits.slice(1)}`;
                          }
                          const waMsg = encodeURIComponent(
                            `⚠️ ${alert.truckCode} (${alert.corridor}): ${cleanAlertText(
                              alert.text[locale]
                            )}${
                              alert.wastedFuelLiters
                                ? ` — ${(alert.wastedFuelLiters * fuelPriceMad).toFixed(
                                    0
                                  )} MAD wasted`
                                : ""
                            }`
                          );
                          const waHref = digits
                            ? `https://wa.me/${digits}?text=${waMsg}`
                            : `https://wa.me/?text=${waMsg}`;
                          return (
                            <a
                              href={waHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-semibold transition-colors"
                            >
                              <MessageCircle className="h-3 w-3" />
                              <span>WhatsApp Driver</span>
                            </a>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcknowledgeAlert(alert.id);
                          }}
                          disabled={alert.acknowledged}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            alert.acknowledged
                              ? "text-emerald-700 dark:text-emerald-400 cursor-default"
                              : "bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700"
                          }`}
                        >
                          {alert.acknowledged
                            ? `✓ ${t.liveMap.acknowledgedLabel}`
                            : t.liveMap.acknowledgeBtn}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
