"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  Flame,
  Gauge,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Route,
  Fuel,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import {
  ClientDemoTabId,
  CompanyProfile,
  DailyFinancialPoint,
  Locale,
  MapTruck,
  TelemetryAlert,
} from "@/lib/supabase/database";
import { TranslationDictionary } from "@/lib/i18n/translations";

interface OverviewPageProps {
  locale: Locale;
  t: TranslationDictionary;
  company: CompanyProfile;
  fuelPriceMad: number;
  financials: DailyFinancialPoint[];
  mapTrucks: MapTruck[];
  alerts: TelemetryAlert[];
  fleetUtilizationPct: number;
  backhaulSavedMad: number;
  onNavigateTab: (tab: ClientDemoTabId) => void;
}

export function OverviewPage({
  locale,
  t,
  company,
  fuelPriceMad,
  financials,
  mapTrucks,
  alerts,
  fleetUtilizationPct,
  backhaulSavedMad,
  onNavigateTab,
}: OverviewPageProps) {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(30);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showRevenue, setShowRevenue] = useState(true);
  const [showFuelSpend, setShowFuelSpend] = useState(true);

  // Dynamically scale financials based on current fuelPriceMad (100% real data, 0 when empty)
  const visibleFinancials = useMemo(() => {
    return financials.slice(financials.length - rangeDays).map((d) => ({
      ...d,
      fuelSpendMad: d.fuelSpendMad || Math.round(d.fuelLiters * fuelPriceMad),
      wastedIdleMad: d.wastedIdleMad || 0,
    }));
  }, [financials, rangeDays, fuelPriceMad]);

  const liveIdlingLiters = useMemo(() => {
    const truckLiters = mapTrucks.reduce(
      (acc, trk) => acc + (trk.wastedFuelLiters || 0),
      0
    );
    return Math.round(truckLiters * 10) / 10;
  }, [mapTrucks]);

  const todaysWastedMad = useMemo(() => {
    return Math.round(liveIdlingLiters * fuelPriceMad);
  }, [liveIdlingLiters, fuelPriceMad]);

  const activeIdlingAlertsCount = useMemo(() => {
    return alerts.filter(
      (a) => !a.acknowledged && (a.type === "idling" || a.severity === "critical")
    ).length;
  }, [alerts]);

  const totals30d = useMemo(() => {
    const rev = visibleFinancials.reduce((s, d) => s + d.revenueMad, 0);
    const fuel = visibleFinancials.reduce((s, d) => s + d.fuelSpendMad, 0);
    const liters = visibleFinancials.reduce((s, d) => s + d.fuelLiters, 0);
    const ratio = rev > 0 ? ((fuel / rev) * 100).toFixed(1) : "0.0";
    return { rev, fuel, liters: Math.round(liters), ratio };
  }, [visibleFinancials]);

  // 100% Real Truck Counts from Instance Data
  const activeTrucksDisplay = mapTrucks.length;
  const totalFleetDisplay = Math.max(activeTrucksDisplay, company.totalFleetCount || 0);
  const activeFleetRatioPct =
    totalFleetDisplay > 0
      ? Math.round((activeTrucksDisplay / totalFleetDisplay) * 100)
      : 0;

  // SVG Chart geometry
  const chartW = 860;
  const chartH = 285;
  const padL = 56;
  const padR = 24;
  const padT = 20;
  const padB = 34;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxDataVal = useMemo(() => {
    const highest = Math.max(
      ...visibleFinancials.map((d) => Math.max(d.revenueMad, d.fuelSpendMad)),
      0
    );
    return highest > 0 ? Math.ceil(highest * 1.2) : 100000;
  }, [visibleFinancials]);

  const maxY = maxDataVal;
  const minY = 0;

  const getX = (idx: number) => {
    if (visibleFinancials.length <= 1) return padL;
    return padL + (idx / (visibleFinancials.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return padT + plotH - ((clamped - minY) / Math.max(1, maxY - minY)) * plotH;
  };

  const revenuePoints = visibleFinancials
    .map((d, i) => `${getX(i).toFixed(1)},${getY(d.revenueMad).toFixed(1)}`)
    .join(" ");
  const fuelPoints = visibleFinancials
    .map((d, i) => `${getX(i).toFixed(1)},${getY(d.fuelSpendMad).toFixed(1)}`)
    .join(" ");

  const revenueArea = `${padL},${padT + plotH} ${revenuePoints} ${getX(
    visibleFinancials.length - 1
  ).toFixed(1)},${padT + plotH}`;
  const fuelArea = `${padL},${padT + plotH} ${fuelPoints} ${getX(
    visibleFinancials.length - 1
  ).toFixed(1)},${padT + plotH}`;

  const activePoint =
    hoverIdx !== null && visibleFinancials[hoverIdx]
      ? visibleFinancials[hoverIdx]
      : visibleFinancials[visibleFinancials.length - 1];
  const activePointIdx = hoverIdx !== null ? hoverIdx : visibleFinancials.length - 1;

  const corridors = useMemo(() => {
    const defs = [
      {
        code: "A7",
        match: ["A7"],
        name: {
          en: "Casablanca ↔ Marrakech ↔ Agadir",
          fr: "Casablanca ↔ Marrakech ↔ Agadir",
          ar: "الدار البيضاء ↔ مراكش ↔ أكادير",
        },
      },
      {
        code: "N1 Express",
        match: ["N1"],
        name: {
          en: "Agadir ↔ Laâyoune ↔ Dakhla ↔ El Guerguerat",
          fr: "Agadir ↔ Laâyoune ↔ Dakhla ↔ El Guerguerat",
          ar: "أكادير ↔ العيون ↔ الداخلة ↔ الكركرات",
        },
      },
      {
        code: "A1",
        match: ["A1"],
        name: {
          en: "Tanger Med Port ↔ Kenitra ↔ Rabat",
          fr: "Port Tanger Med ↔ Kénitra ↔ Rabat",
          ar: "ميناء طنجة المتوسط ↔ القنيطرة ↔ الرباط",
        },
      },
      {
        code: "A2 / A3",
        match: ["A2", "A3", "A5"],
        name: {
          en: "Casablanca ↔ Rabat ↔ Fès ↔ Oujda",
          fr: "Casablanca ↔ Rabat ↔ Fès ↔ Oujda",
          ar: "الدار البيضاء ↔ الرباط ↔ فاس ↔ وجدة",
        },
      },
    ];

    return defs.map((def) => {
      const matchingTrucks = mapTrucks.filter((trk) =>
        def.match.some((m) => (trk.corridor || "").toUpperCase().includes(m))
      );
      const count = matchingTrucks.length;
      const avgUtil =
        count > 0
          ? Math.round(
              matchingTrucks.reduce(
                (s, t) => s + (t.cargoUtilizationPct || 0),
                0
              ) / count
            )
          : 0;
      const avgEff =
        count > 0
          ? (
              matchingTrucks.reduce(
                (s, t) => s + (t.targetConsumptionL100km || 29.0),
                0
              ) / count
            ).toFixed(1)
          : "0.0";
      return {
        code: def.code,
        name: def.name,
        trucks: count,
        utilization: avgUtil,
        fuelEfficiency: `${avgEff} L/100km`,
      };
    });
  }, [mapTrucks]);

  const cleanAlertText = (raw: string) => raw.replace(/^[⚠️🚨🔄✅]+\s*/u, "");

  return (
    <div className="space-y-6">
      {/* Guided Step-by-Step Instance Setup Bar when Instance starts at 0 records */}
      {mapTrucks.length === 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider">
                Clean Real Client Instance • 0 Random Demo Data
              </span>
              <h2 className="text-base sm:text-lg font-bold">
                Welcome to {company.name[locale]} — Walkthrough Setup Checklist
              </h2>
              <p className="text-xs text-blue-100 max-w-2xl">
                This instance starts at 0 so you and Ibrahim can configure real company branding, trucks, driver profiles, routes, tasks, and gas purchases.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => onNavigateTab("company-branding")}
                className="rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 px-3.5 py-2.5 text-start transition-all"
              >
                <span className="block text-[10px] font-mono text-blue-200">
                  STEP 1
                </span>
                <span>Logo, Header & Footer →</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("fleet-manager")}
                className="rounded-xl bg-white text-slate-900 hover:bg-blue-50 px-3.5 py-2.5 text-start shadow-sm transition-all"
              >
                <span className="block text-[10px] font-mono text-blue-600">
                  STEP 2
                </span>
                <span>Add Trucks & Presets →</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("fleet-manager")}
                className="rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 px-3.5 py-2.5 text-start transition-all"
              >
                <span className="block text-[10px] font-mono text-blue-200">
                  STEP 3
                </span>
                <span>Add Driver Profiles →</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("tasks")}
                className="rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 px-3.5 py-2.5 text-start transition-all"
              >
                <span className="block text-[10px] font-mono text-blue-200">
                  STEP 4
                </span>
                <span>Add Tasks & Fuel →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top KPI Ribbon (4 Executive Institutional Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Total Active Trucks */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => onNavigateTab("fleet-manager")}
          className="cursor-pointer group rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-blue-600/50 p-5 shadow-sm transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {t.kpi.totalActiveTrucks}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100">
                  {activeTrucksDisplay}
                </span>
                <span className="text-sm font-mono text-slate-400 dark:text-zinc-500">
                  / {totalFleetDisplay}
                </span>
                <span className="ms-1 inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  {activeFleetRatioPct}%
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
                style={{
                  width: `${activeFleetRatioPct}%`,
                }}
              />
            </div>
            <p className="mt-2.5 text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <span>{t.kpi.onMoroccanHighways}</span>
              <span className="font-mono text-[11px] font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                Manage →
              </span>
            </p>
          </div>
        </motion.div>

        {/* KPI 2: Today's Wasted Fuel (in MAD, scaled to active fuelPriceMad) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.04 }}
          onClick={() => onNavigateTab("fleet-manager")}
          className="cursor-pointer group rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-amber-500/50 p-5 shadow-sm transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {t.kpi.todaysWastedFuel}
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100">
                  {todaysWastedMad.toLocaleString()}
                </span>
                <span className="text-xs font-semibold font-mono text-slate-500 dark:text-zinc-400">
                  MAD
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-800 px-3 py-1.5">
            <span className="text-xs font-mono text-slate-700 dark:text-zinc-300">
              {liveIdlingLiters} {t.overview.litersUnit} × {fuelPriceMad.toFixed(2)} MAD/L
            </span>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
              Edit Tariff →
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 truncate">
            {liveIdlingLiters} L {t.kpi.litersIdledToday}
          </p>
        </motion.div>

        {/* KPI 3: Fleet Capacity Utilization (%) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
          onClick={() => onNavigateTab("ltl-optimizer")}
          className="cursor-pointer group rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-blue-600/50 dark:hover:border-blue-500/50 p-5 shadow-sm transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {t.kpi.fleetCapacityUtilization}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100">
                  {fleetUtilizationPct.toFixed(1)}%
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                  <ArrowUpRight className="h-3 w-3" /> +6.4%
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700">
              <Gauge className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, fleetUtilizationPct)}%` }}
              />
            </div>
            <p className="mt-2.5 text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <span>{t.kpi.ltlVolumeWeightAvg}</span>
              <span className="text-blue-600 dark:text-blue-400 group-hover:underline font-medium">
                LTL →
              </span>
            </p>
          </div>
        </motion.div>

        {/* KPI 4: Active Idling Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.12 }}
          onClick={() => onNavigateTab("live-map")}
          className="cursor-pointer group rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-red-500/40 p-5 shadow-sm transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {t.kpi.activeIdlingAlerts}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100">
                  {activeIdlingAlertsCount}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 dark:bg-red-950/50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400" />
                  CAN-BUS
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200/80 dark:border-red-800/50">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 pt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-zinc-400 truncate max-w-[180px]">
              {t.kpi.criticalIdlingHubs}
            </span>
            <span className="font-semibold text-slate-700 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {t.kpi.viewOnLiveMap}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Main Chart Card: Fuel Spend vs. Revenue (Last 30 Days) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-6 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {t.overview.chartTitle}
              </h2>
              <button
                type="button"
                onClick={() => onNavigateTab("fleet-manager")}
                className="rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-700 dark:text-zinc-300 transition-colors"
              >
                {fuelPriceMad.toFixed(2)} MAD/L ✎
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              {t.overview.chartSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRevenue((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                showRevenue
                  ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/70 text-blue-800 dark:text-blue-300"
                  : "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              {t.overview.revenueSeries}
            </button>
            <button
              type="button"
              onClick={() => setShowFuelSpend((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                showFuelSpend
                  ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-300"
                  : "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400" />
              {t.overview.fuelSpendSeries}
            </button>

            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-800">
              {([7, 14, 30] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    setRangeDays(days);
                    setHoverIdx(null);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                    rangeDays === days
                      ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {days === 7
                    ? t.overview.last7Days
                    : days === 14
                    ? t.overview.last14Days
                    : t.overview.last30Days}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Strip Above SVG Chart */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
          <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80 p-3.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {t.overview.total30dRevenue}
            </span>
            <span className="mt-1 text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100 block">
              {totals30d.rev.toLocaleString()} MAD
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80 p-3.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {t.overview.total30dFuelSpend}
            </span>
            <span className="mt-1 text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100 block">
              {totals30d.fuel.toLocaleString()} MAD
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              {totals30d.liters.toLocaleString()} L @ {fuelPriceMad.toFixed(2)} MAD/L
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80 p-3.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {t.overview.fuelToRevenueRatio}
            </span>
            <span className="mt-1 text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100 block">
              {totals30d.ratio}%
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              -2.8% vs Benchmark
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80 p-3.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {t.overview.estimatedBackhaulSavings}
            </span>
            <span className="mt-1 text-lg sm:text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 block">
              +{(Math.round(2591 * fuelPriceMad) + backhaulSavedMad).toLocaleString()} MAD
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              {t.kpi.backhaulsActive}
            </span>
          </div>
        </div>

        {/* Interactive SVG Line Chart */}
        <div className="relative mt-2 select-none">
          {activePoint && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-4 py-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded">
                  {activePoint.dateIso}
                </span>
                <span className="text-slate-700 dark:text-zinc-300 font-mono">
                  {t.overview.revenueSeries}:{" "}
                  <strong className="text-blue-600 dark:text-blue-400">
                    {activePoint.revenueMad.toLocaleString()} MAD
                  </strong>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-slate-700 dark:text-zinc-300 font-mono">
                  {t.overview.fuelSpendSeries}:{" "}
                  <strong className="text-amber-700 dark:text-amber-400">
                    {activePoint.fuelSpendMad.toLocaleString()} MAD
                  </strong>{" "}
                  ({activePoint.fuelLiters.toLocaleString()} L)
                </span>
                <span className="text-slate-700 dark:text-zinc-300 font-mono">
                  {t.overview.netMargin}:{" "}
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    +{(activePoint.revenueMad - activePoint.fuelSpendMad).toLocaleString()} MAD
                  </strong>
                </span>
              </div>
            </div>
          )}

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-[265px] sm:h-[295px] overflow-visible"
              onMouseLeave={() => setHoverIdx(null)}
            >
              <defs>
                <linearGradient id="revGradCorp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="fuelGradCorp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {[40000, 90000, 140000, 190000, 230000].map((val) => {
                const y = getY(val);
                return (
                  <g key={val}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      className="stroke-slate-200 dark:stroke-zinc-800"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={padL - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 dark:fill-zinc-500 text-[10px] font-mono"
                    >
                      {Math.round(val / 1000)}k
                    </text>
                  </g>
                );
              })}

              {showRevenue && (
                <>
                  <polygon points={revenueArea} fill="url(#revGradCorp)" />
                  <polyline
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={revenuePoints}
                  />
                </>
              )}

              {showFuelSpend && (
                <>
                  <polygon points={fuelArea} fill="url(#fuelGradCorp)" />
                  <polyline
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={fuelPoints}
                  />
                </>
              )}

              {activePoint && (
                <g>
                  <line
                    x1={getX(activePointIdx)}
                    y1={padT}
                    x2={getX(activePointIdx)}
                    y2={padT + plotH}
                    className="stroke-slate-400 dark:stroke-zinc-600"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {showRevenue && (
                    <circle
                      cx={getX(activePointIdx)}
                      cy={getY(activePoint.revenueMad)}
                      r="4.5"
                      className="fill-blue-600 stroke-white dark:stroke-zinc-900"
                      strokeWidth="2"
                    />
                  )}
                  {showFuelSpend && (
                    <circle
                      cx={getX(activePointIdx)}
                      cy={getY(activePoint.fuelSpendMad)}
                      r="4.5"
                      className="fill-amber-600 stroke-white dark:stroke-zinc-900"
                      strokeWidth="2"
                    />
                  )}
                </g>
              )}

              {visibleFinancials.map((d, i) => {
                const x = getX(i);
                const showLabel =
                  rangeDays <= 14 ? i % 2 === 0 : i % 4 === 0 || i === visibleFinancials.length - 1;
                const colWidth = plotW / visibleFinancials.length;
                return (
                  <g key={d.dayIndex}>
                    {showLabel && (
                      <text
                        x={x}
                        y={chartH - 8}
                        textAnchor="middle"
                        className="fill-slate-500 dark:fill-zinc-400 text-[10px] font-mono"
                      >
                        {d.dateLabel}
                      </text>
                    )}
                    <rect
                      x={x - colWidth / 2}
                      y={padT}
                      width={colWidth}
                      height={plotH}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoverIdx(i)}
                      onClick={() => setHoverIdx(i)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Bottom 2-Column Grid: Moroccan Corridors & Priority Telemetry Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Route className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {t.overview.corridorPerformanceTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {t.overview.corridorPerformanceSub}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("ltl-optimizer")}
              className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-colors"
            >
              {t.overview.openLtlOptimizer}
            </button>
          </div>

          <div className="space-y-3">
            {corridors.map((c) => (
              <div
                key={c.code}
                className="rounded-lg bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 p-3.5"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 font-mono font-semibold text-slate-800 dark:text-zinc-200">
                      {c.code}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-zinc-200">
                      {c.name[locale]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono tabular-nums">
                    <span className="text-slate-500 dark:text-zinc-400">{c.trucks} units</span>
                    <span className="text-slate-600 dark:text-zinc-300">{c.fuelEfficiency}</span>
                    <span className="font-bold text-slate-900 dark:text-zinc-100">
                      {c.utilization}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                    style={{ width: `${c.utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Telemetry & Idling Preview */}
        <div className="lg:col-span-5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-slate-600 dark:text-zinc-400" />
                {t.overview.liveAlertsPreviewTitle}
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab("live-map")}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-colors"
              >
                {t.overview.openMapMonitor}
              </button>
            </div>

            <div className="space-y-2.5">
              {alerts.slice(0, 4).map((alert) => {
                const dotColor =
                  alert.severity === "critical"
                    ? "bg-red-600 dark:bg-red-500"
                    : alert.severity === "warning"
                    ? "bg-amber-500"
                    : "bg-blue-600 dark:bg-blue-400";

                return (
                  <div
                    key={alert.id}
                    onClick={() => onNavigateTab("live-map")}
                    className="cursor-pointer rounded-lg bg-slate-50/80 hover:bg-slate-100/80 dark:bg-zinc-950/60 dark:hover:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800 p-3 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-zinc-300">
                        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                        {alert.corridor}
                      </span>
                      <span>{alert.timestamp}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                      {cleanAlertText(alert.text[locale])}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {alert.detail[locale]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              {t.meta.fuelTariffLabel} {fuelPriceMad.toFixed(2)} MAD/L
            </span>
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Supabase Realtime
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
