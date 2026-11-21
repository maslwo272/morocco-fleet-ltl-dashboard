"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Search,
  Fuel,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  Trophy,
  Flame,
  GraduationCap,
} from "lucide-react";
import { DriverEcoRecord, Locale } from "@/lib/supabase/database";
import { TranslationDictionary } from "@/lib/i18n/translations";

interface DriverEcoPageProps {
  locale: Locale;
  t: TranslationDictionary;
  fuelPriceMad: number;
  drivers: DriverEcoRecord[];
}

type SortKey = "ecoScore" | "fuelEfficiencyL100km" | "totalIdleMinutes30d" | "safetyIncidents30d";

export function DriverEcoPage({ locale, t, fuelPriceMad, drivers }: DriverEcoPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [badgeFilter, setBadgeFilter] = useState<"all" | "green" | "yellow" | "red">("all");
  const [sortKey, setSortKey] = useState<SortKey>("ecoScore");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [actionTaken, setActionTaken] = useState<Record<string, string>>({});

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(key !== "ecoScore");
    }
  };

  const filteredAndSortedDrivers = useMemo(() => {
    return drivers
      .filter((d) => {
        if (badgeFilter !== "all" && d.badge !== badgeFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          d.name[locale].toLowerCase().includes(q) ||
          d.truckCode.toLowerCase().includes(q) ||
          d.corridor.toLowerCase().includes(q) ||
          d.routeDescription[locale].toLowerCase().includes(q)
        );
      })
      .toSorted((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [drivers, badgeFilter, searchQuery, locale, sortKey, sortAsc]);

  const fleetAvgFuel = useMemo(() => {
    if (drivers.length === 0) return "0.0";
    const sum = drivers.reduce((acc, d) => acc + d.fuelEfficiencyL100km, 0);
    return (sum / drivers.length).toFixed(1);
  }, [drivers]);

  const totalIdleWaste30d = useMemo(() => {
    return Math.round(
      drivers.reduce(
        (acc, d) => acc + (d.totalIdleMinutes30d / 60) * 3.4 * fuelPriceMad,
        0
      )
    );
  }, [drivers, fuelPriceMad]);

  const formatIdleHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${String(m).padStart(2, "0")}m`;
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {t.eco.fleetAvgEfficiency}
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100">
                {fleetAvgFuel} L/100km
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                ({t.eco.fleetTargetLabel})
              </span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-300">
            <Fuel className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {t.eco.monthlyIdleWasteTotal}
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100">
                {totalIdleWaste30d.toLocaleString()} MAD
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                @ {fuelPriceMad.toFixed(2)}/L
              </span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-300">
            <Flame className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {t.eco.topEcoDriver}
            </span>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
                {drivers[0]?.name[locale]}
              </span>
              <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                96/100
              </span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-300">
            <Trophy className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Main Leaderboard Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-6 shadow-sm"
      >
        {/* Header & Search/Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
                {t.eco.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {t.eco.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="h-4 w-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.eco.searchPlaceholder}
                className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 ps-9 pe-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Badge Tier Filter Pills (Green / Yellow / Red) */}
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-800">
              {(
                [
                  { id: "all", label: t.eco.filterAllTiers, dot: "bg-slate-400" },
                  { id: "green", label: t.eco.filterGreen, dot: "bg-emerald-600" },
                  { id: "yellow", label: t.eco.filterYellow, dot: "bg-amber-500" },
                  { id: "red", label: t.eco.filterRed, dot: "bg-red-600" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBadgeFilter(tab.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all flex items-center gap-1.5 ${
                    badgeFilter === tab.id
                      ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${tab.dot}`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Responsive Data Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <th className="py-3 px-3 text-start">{t.eco.colRank}</th>
                <th className="py-3 px-3 text-start">{t.eco.colDriver}</th>
                <th className="py-3 px-3 text-start">{t.eco.colTruckCorridor}</th>
                <th
                  onClick={() => handleSort("fuelEfficiencyL100km")}
                  className="py-3 px-3 text-start cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {t.eco.colFuelEfficiency}
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("totalIdleMinutes30d")}
                  className="py-3 px-3 text-start cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {t.eco.colTotalIdleTime}
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("safetyIncidents30d")}
                  className="py-3 px-3 text-start cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {t.eco.colSafetyIncidents}
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("ecoScore")}
                  className="py-3 px-3 text-start cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {t.eco.colEcoScore}
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </span>
                </th>
                <th className="py-3 px-3 text-start">{t.eco.colStatusBadge}</th>
                <th className="py-3 px-3 text-end">{t.eco.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800/70 text-xs">
              {filteredAndSortedDrivers.map((drv) => {
                const isOptimalEfficiency =
                  drv.fuelEfficiencyL100km <= drv.targetEfficiencyL100km;
                const efficiencyBarPct = Math.min(
                  100,
                  Math.round((drv.fuelEfficiencyL100km / 38) * 100)
                );

                return (
                  <tr
                    key={drv.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/35 transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 font-mono font-semibold text-slate-600 dark:text-zinc-400">
                      #{drv.rank}
                    </td>

                    {/* Driver Name & Code */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono text-xs font-bold text-slate-700 dark:text-zinc-300">
                          {drv.avatarInitials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-zinc-100 text-xs sm:text-sm">
                            {drv.name[locale]}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                            {drv.driverCode} • {drv.kmDriven30d.toLocaleString()} km
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Truck & Moroccan Corridor */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 font-mono font-semibold text-slate-800 dark:text-zinc-200">
                          {drv.truckCode}
                        </span>
                        <span className="rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                          {drv.corridor}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                        {drv.routeDescription[locale]}
                      </p>
                    </td>

                    {/* Fuel Efficiency (L/100km) */}
                    <td className="py-3.5 px-3">
                      <div className="w-36">
                        <div className="flex items-center justify-between font-mono tabular-nums mb-1">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">
                            {drv.fuelEfficiencyL100km.toFixed(1)} L/100km
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOptimalEfficiency
                                ? "bg-blue-600 dark:bg-blue-500"
                                : drv.badge === "yellow"
                                ? "bg-amber-500"
                                : "bg-red-600 dark:bg-red-500"
                            }`}
                            style={{ width: `${efficiencyBarPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                          {t.eco.fleetTargetLabel}
                        </span>
                      </div>
                    </td>

                    {/* Total Idle Time (30d) + Wasted MAD */}
                    <td className="py-3.5 px-3 font-mono tabular-nums">
                      <div className="flex items-center gap-1.5 text-slate-900 dark:text-zinc-100 font-semibold">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatIdleHoursMins(drv.totalIdleMinutes30d)}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                        {Math.round((drv.totalIdleMinutes30d / 60) * 3.4 * fuelPriceMad).toLocaleString()} MAD {t.eco.wastedLabel}
                      </span>
                    </td>

                    {/* Safety Incidents */}
                    <td className="py-3.5 px-3">
                      {drv.safetyIncidents30d === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t.eco.zeroIncidents}
                        </span>
                      ) : (
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                            {drv.safetyIncidents30d} incidents
                          </span>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                            <span>
                              {t.eco.harshBrakingShort}: {drv.harshBrakingCount}
                            </span>
                            <span>•</span>
                            <span>
                              {t.eco.overspeedShort}: {drv.overspeedCount}
                            </span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Eco-Score (0-100) */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-baseline gap-1 font-mono tabular-nums">
                        <span className="text-base font-bold text-slate-900 dark:text-zinc-100">
                          {drv.ecoScore}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                          /100
                        </span>
                      </div>
                    </td>

                    {/* Restrained Green / Yellow / Red Status Badge System */}
                    <td className="py-3.5 px-3">
                      {drv.badge === "green" && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                          {t.eco.badgeGreenLabel}
                        </span>
                      )}
                      {drv.badge === "yellow" && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {t.eco.badgeYellowLabel}
                        </span>
                      )}
                      {drv.badge === "red" && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400" />
                          {t.eco.badgeRedLabel}
                        </span>
                      )}
                    </td>

                    {/* Interactive Coaching / Eco Bonus Action */}
                    <td className="py-3.5 px-3 text-end">
                      {actionTaken[drv.id] ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {actionTaken[drv.id]}
                        </span>
                      ) : drv.badge === "green" ? (
                        <button
                          type="button"
                          onClick={() =>
                            setActionTaken((prev) => ({
                              ...prev,
                              [drv.id]: t.eco.bonusSentMsg,
                            }))
                          }
                          className="inline-flex items-center gap-1.5 rounded-md bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-colors"
                        >
                          {t.eco.sendEcoBonusBtn}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setActionTaken((prev) => ({
                              ...prev,
                              [drv.id]: t.eco.coachingScheduledMsg,
                            }))
                          }
                          className="inline-flex items-center gap-1.5 rounded-md bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-colors"
                        >
                          <GraduationCap className="h-3.5 w-3.5" />
                          {t.eco.scheduleCoachingBtn}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
