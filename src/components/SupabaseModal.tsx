"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, ShieldCheck, X, Code2, FileJson } from "lucide-react";
import { TranslationDictionary } from "@/lib/i18n/translations";
import {
  DriverEcoRecord,
  LtlShipment,
  MapTruck,
  TelemetryAlert,
} from "@/lib/supabase/database";

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: TranslationDictionary;
  trucks: MapTruck[];
  alerts: TelemetryAlert[];
  shipments: LtlShipment[];
  drivers: DriverEcoRecord[];
}

const SQL_SNIPPET = `-- Supabase PostgreSQL Schema (public.trucks, public.ltl_shipments, public.telemetry_alerts, public.drivers)
-- Moroccan Commercial Gasoil Benchmark: 15.90 MAD / Liter

create table public.trucks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  truck_code text not null unique,
  plate_number text not null unique,
  status text not null check (status in ('moving', 'idling', 'alert')),
  highway_corridor text not null,
  idle_minutes integer not null default 0,
  max_volume_m3 numeric(6, 2) not null default 90.00,
  used_volume_m3 numeric(6, 2) not null default 0.00,
  max_weight_kg integer not null default 24000,
  used_weight_kg integer not null default 0
);

alter table public.trucks enable row level security;

create policy "Tenant dispatchers can read and update trucks"
  on public.trucks for all
  to authenticated
  using ( company_id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid )
  with check ( company_id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid );`;

export function SupabaseModal({
  isOpen,
  onClose,
  t,
  trucks,
  alerts,
  shipments,
  drivers,
}: SupabaseModalProps) {
  const [activeTab, setActiveTab] = useState<"schema" | "payload">("schema");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="w-full max-w-4xl rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                      {t.dbModal.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      {t.dbModal.rlsEnabledBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {t.dbModal.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab("schema")}
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === "schema"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Code2 className="h-4 w-4" />
                {t.dbModal.schemaTab}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("payload")}
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === "payload"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileJson className="h-4 w-4" />
                {t.dbModal.livePayloadTab}
              </button>
            </div>

            <div className="p-6 max-h-[65vh] overflow-y-auto bg-slate-950 font-mono text-xs text-slate-200">
              {activeTab === "schema" ? (
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {SQL_SNIPPET}
                </pre>
              ) : (
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(
                    {
                      supabase_channel: "realtime:public:morocco_fleet_telemetry",
                      diesel_tariff_mad_per_liter: 15.9,
                      tables: {
                        trucks_count: trucks.length,
                        active_telemetry_alerts: alerts.slice(0, 3),
                        ltl_shipments: shipments.map((s) => ({
                          code: s.code,
                          pallets: s.pallets,
                          assignedTruckId: s.assignedTruckId,
                          isBackhaulMatch: s.isBackhaulMatch,
                        })),
                        top_eco_drivers: drivers.slice(0, 3).map((d) => ({
                          driverCode: d.driverCode,
                          fuelEfficiencyL100km: d.fuelEfficiencyL100km,
                          ecoScore: d.ecoScore,
                          badge: d.badge,
                        })),
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </div>

            <div className="flex items-center justify-end px-6 py-3.5 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-zinc-900 transition-colors"
              >
                {t.dbModal.closeBtn}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
