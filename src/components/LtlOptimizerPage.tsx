"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes,
  Truck,
  Sparkles,
  RotateCcw,
  GripVertical,
  Weight,
  Box,
  CheckCircle2,
  X,
  Fuel,
  Route,
  AlertCircle,
  SlidersHorizontal,
  ExternalLink,
  Plus,
} from "lucide-react";
import {
  calculateMoroccoRoute,
  getGoogleMapsDirectionsUrl,
  Locale,
  LtlShipment,
  LtlTruck,
  MOROCCO_CITY_COORDS,
} from "@/lib/supabase/database";
import { TranslationDictionary } from "@/lib/i18n/translations";

interface LtlOptimizerPageProps {
  locale: Locale;
  t: TranslationDictionary;
  fuelPriceMad?: number;
  trucks: LtlTruck[];
  shipments: LtlShipment[];
  onAssignShipment: (shipmentId: string, truckId: string) => boolean;
  onUnassignShipment: (shipmentId: string) => void;
  onAutoOptimize: () => void;
  onResetAssignments: () => void;
  onUpdateLtlTruck?: (truck: LtlTruck) => void;
  onAddShipment?: (shipment: LtlShipment) => void;
}

export function LtlOptimizerPage({
  locale,
  t,
  fuelPriceMad = 15.9,
  trucks,
  shipments,
  onAssignShipment,
  onUnassignShipment,
  onAutoOptimize,
  onResetAssignments,
  onUpdateLtlTruck,
  onAddShipment,
}: LtlOptimizerPageProps) {
  const [draggedShipmentId, setDraggedShipmentId] = useState<string | null>(null);
  const [dragOverTruckId, setDragOverTruckId] = useState<string | null>(null);
  const [capacityWarningTruckId, setCapacityWarningTruckId] = useState<string | null>(null);

  // Inline Truck Capacity & Pallets Editor State
  const [editingTruckId, setEditingTruckId] = useState<string | null>(null);
  const [editMaxPallets, setEditMaxPallets] = useState("33");
  const [editBasePallets, setEditBasePallets] = useState("18");
  const [editMaxVol, setEditMaxVol] = useState("90");
  const [editBaseVol, setEditBaseVol] = useState("52");
  const [editMaxWeight, setEditMaxWeight] = useState("24000");
  const [editBaseWeight, setEditBaseWeight] = useState("13800");

  // Add Pending Shipment State (with Google Maps Distance Calculator)
  const [showAddShipment, setShowAddShipment] = useState(false);
  const [newOriginKey, setNewOriginKey] = useState("Casablanca Zenata");
  const [newDestKey, setNewDestKey] = useState("Marrakech");
  const [newPallets, setNewPallets] = useState("4");
  const [newCargoDesc, setNewCargoDesc] = useState("Industrial & Retail Palletized Cargo");
  const [newRecTruckId, setNewRecTruckId] = useState(trucks[0]?.id || "ltl-trk-1");

  const newShipmentRoute = useMemo(() => {
    return calculateMoroccoRoute(newOriginKey, newDestKey, fuelPriceMad, 28.5);
  }, [newOriginKey, newDestKey, fuelPriceMad]);

  const handleOpenTruckCapacityEditor = (truck: LtlTruck) => {
    if (editingTruckId === truck.id) {
      setEditingTruckId(null);
      return;
    }
    setEditingTruckId(truck.id);
    setEditMaxPallets(String(truck.maxPallets));
    setEditBasePallets(String(truck.basePallets));
    setEditMaxVol(String(truck.maxVolumeM3));
    setEditBaseVol(String(truck.baseVolumeM3));
    setEditMaxWeight(String(truck.maxWeightKg));
    setEditBaseWeight(String(truck.baseWeightKg));
  };

  const handleSaveTruckCapacity = (truck: LtlTruck) => {
    if (!onUpdateLtlTruck) {
      setEditingTruckId(null);
      return;
    }
    const maxP = Math.max(4, parseInt(editMaxPallets, 10) || 33);
    const baseP = Math.min(maxP, Math.max(0, parseInt(editBasePallets, 10) || 0));
    const maxV = Math.max(15, parseFloat(editMaxVol) || 90);
    const baseV = Math.min(maxV, Math.max(0, parseFloat(editBaseVol) || 0));
    const maxW = Math.max(2000, parseInt(editMaxWeight, 10) || 24000);
    const baseW = Math.min(maxW, Math.max(0, parseInt(editBaseWeight, 10) || 0));

    onUpdateLtlTruck({
      ...truck,
      maxPallets: maxP,
      basePallets: baseP,
      maxVolumeM3: maxV,
      baseVolumeM3: baseV,
      maxWeightKg: maxW,
      baseWeightKg: baseW,
    });
    setEditingTruckId(null);
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddShipment) return;
    const pal = Math.max(1, Math.min(33, parseInt(newPallets, 10) || 4));
    const vol = Math.round(pal * 2.85 * 10) / 10;
    const weight = pal * 780;
    const origHub = MOROCCO_CITY_COORDS[newOriginKey] || MOROCCO_CITY_COORDS["Casablanca Zenata"];
    const destHub = MOROCCO_CITY_COORDS[newDestKey] || MOROCCO_CITY_COORDS["Marrakech"];
    const recTruck = trucks.find((x) => x.id === newRecTruckId) || trucks[0];

    const newShp: LtlShipment = {
      id: `shp-custom-${Date.now()}`,
      code: `SHP-${Math.floor(910 + Math.random() * 89)}`,
      origin: origHub.label,
      destination: destHub.label,
      corridor: newShipmentRoute.corridor,
      pallets: pal,
      volumeM3: vol,
      weightKg: weight,
      revenueMad: Math.round(newShipmentRoute.distanceKm * 14 + pal * 420),
      cargoType: {
        en: newCargoDesc,
        fr: newCargoDesc,
        ar: newCargoDesc,
      },
      isBackhaulMatch: true,
      recommendedTruckId: recTruck.id,
      recommendedTruckCode: recTruck.code,
      emptyKmSaved: newShipmentRoute.distanceKm,
      fuelLitersSaved: newShipmentRoute.estimatedFuelLiters,
      fuelMadSaved: newShipmentRoute.estimatedFuelCostMad,
      assignedTruckId: null,
    };
    onAddShipment(newShp);
    setShowAddShipment(false);
  };

  const pendingShipments = shipments.filter((s) => s.assignedTruckId === null);
  const assignedShipments = shipments.filter((s) => s.assignedTruckId !== null);

  const totalEmptyKmSaved = assignedShipments.reduce((acc, s) => acc + s.emptyKmSaved, 0);
  const totalFuelMadSaved = assignedShipments.reduce((acc, s) => acc + s.fuelMadSaved, 0);
  const totalAddedRevenueMad = assignedShipments.reduce((acc, s) => acc + s.revenueMad, 0);

  const handleAssignWithFeedback = (shipmentId: string, truckId: string) => {
    const ok = onAssignShipment(shipmentId, truckId);
    if (!ok) {
      setCapacityWarningTruckId(truckId);
      setTimeout(() => setCapacityWarningTruckId(null), 2600);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Optimizer Control & Impact Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <Boxes className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
              {t.ltl.title}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {t.ltl.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onAutoOptimize}
            disabled={pendingShipments.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t.ltl.autoMatchBackhaulsBtn.replace(/^⚡\s*/, "")}
          </button>

          <button
            type="button"
            onClick={onResetAssignments}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t.ltl.resetAssignmentsBtn}
          </button>
        </div>
      </div>

      {/* Live Backhaul & Consolidation Savings Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {t.ltl.emptyKmSavedTotal}
            </span>
            <span className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100 block">
              {totalEmptyKmSaved.toLocaleString()} km
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-300">
            <Route className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {t.ltl.fuelSavedMadTotal}
            </span>
            <span className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-zinc-100 block">
              {totalFuelMadSaved.toLocaleString()} MAD
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-300">
            <Fuel className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {t.ltl.addedRevenueTotal}
            </span>
            <span className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 block">
              +{totalAddedRevenueMad.toLocaleString()} MAD
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <Boxes className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Main Split Interface: 3 Mock Trucks (Left 7 cols) + Pending Shipments Drag & Drop (Right 5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: 3 Mock Trucks */}
        <div className="xl:col-span-7 space-y-4">
          {trucks.map((truck) => {
            const truckShipments = shipments.filter((s) => s.assignedTruckId === truck.id);
            const addedVolume = truckShipments.reduce((sum, s) => sum + s.volumeM3, 0);
            const addedWeight = truckShipments.reduce((sum, s) => sum + s.weightKg, 0);
            const addedPallets = truckShipments.reduce((sum, s) => sum + s.pallets, 0);

            const currentVolume = Math.round((truck.baseVolumeM3 + addedVolume) * 10) / 10;
            const currentWeight = truck.baseWeightKg + addedWeight;
            const currentPallets = truck.basePallets + addedPallets;

            const volumePct = Math.min(100, Math.round((currentVolume / truck.maxVolumeM3) * 100));
            const weightPct = Math.min(100, Math.round((currentWeight / truck.maxWeightKg) * 100));

            const isDropTarget = dragOverTruckId === truck.id;
            const draggedShipment = shipments.find((s) => s.id === draggedShipmentId);
            const isRecommendedForDragged =
              draggedShipment && draggedShipment.recommendedTruckId === truck.id;
            const hasWarning = capacityWarningTruckId === truck.id;

            return (
              <motion.div
                key={truck.id}
                layout
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverTruckId !== truck.id) setDragOverTruckId(truck.id);
                }}
                onDragLeave={() => {
                  if (dragOverTruckId === truck.id) setDragOverTruckId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverTruckId(null);
                  const shpId = e.dataTransfer.getData("text/plain") || draggedShipmentId;
                  if (shpId) {
                    handleAssignWithFeedback(shpId, truck.id);
                  }
                  setDraggedShipmentId(null);
                }}
                className={`rounded-xl p-5 border transition-all shadow-sm ${
                  isDropTarget
                    ? "bg-blue-50/40 dark:bg-blue-950/25 border-blue-600 ring-1 ring-blue-500/40"
                    : isRecommendedForDragged
                    ? "bg-white dark:bg-zinc-900 border-blue-500/70"
                    : "bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800"
                }`}
              >
                {/* Truck Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                          {truck.code}
                        </span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                          {truck.name[locale]}
                        </span>
                        <span className="rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-700 dark:text-zinc-300">
                          {truck.corridor}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        {truck.route[locale]} • {truck.model}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1 text-slate-600 dark:text-zinc-400">
                      {t.ltl.palletsLoaded}:{" "}
                      <strong className="text-slate-900 dark:text-zinc-100">
                        {currentPallets}/{truck.maxPallets}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenTruckCapacityEditor(truck)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
                      title="Edit Truck Capacity, Pallets & Weight Limits"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                      <span>
                        {locale === "ar"
                          ? "تعديل السعة والطبليات"
                          : locale === "fr"
                          ? "Capacités & Palettes"
                          : "Capacity & Pallets"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Inline Truck Capacity, Pallets & Payload Editor */}
                {editingTruckId === truck.id && (
                  <div className="mt-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {locale === "ar"
                          ? `ضبط سعة الشاحنة والطبليات (${truck.code})`
                          : locale === "fr"
                          ? `Configuration Capacité, Palettes & Poids (${truck.code})`
                          : `Configure Truck Capacity, Pallets & Weight (${truck.code})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingTruckId(null)}
                        className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                          Base / Max Pallets (EPAL)
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="66"
                            value={editBasePallets}
                            onChange={(e) => setEditBasePallets(e.target.value)}
                            className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 font-mono"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            min="4"
                            max="66"
                            value={editMaxPallets}
                            onChange={(e) => setEditMaxPallets(e.target.value)}
                            className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                          Base / Max Volume (m³)
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="140"
                            value={editBaseVol}
                            onChange={(e) => setEditBaseVol(e.target.value)}
                            className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 font-mono"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            step="1"
                            min="15"
                            max="140"
                            value={editMaxVol}
                            onChange={(e) => setEditMaxVol(e.target.value)}
                            className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                          Base / Max Weight (kg)
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="500"
                            min="0"
                            max="40000"
                            value={editBaseWeight}
                            onChange={(e) => setEditBaseWeight(e.target.value)}
                            className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 font-mono"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            step="500"
                            min="2000"
                            max="40000"
                            value={editMaxWeight}
                            onChange={(e) => setEditMaxWeight(e.target.value)}
                            className="w-1/2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveTruckCapacity(truck)}
                        className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-semibold"
                      >
                        {locale === "ar"
                          ? "حفظ سعة الشاحنة"
                          : locale === "fr"
                          ? "Enregistrer les capacités"
                          : "Save Truck Capacities"}
                      </button>
                    </div>
                  </div>
                )}

                {hasWarning && (
                  <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t.ltl.overCapacityWarning}
                  </div>
                )}

                {/* Visual Trailer Pallet Slot Deck */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mb-1.5">
                    <span>Trailer Deck ({truck.maxPallets} Euro-Pallet Slots)</span>
                    <span className="font-mono text-slate-600 dark:text-zinc-400">
                      {truck.basePallets} base + {addedPallets} consolidated
                    </span>
                  </div>
                  <div className="grid grid-cols-11 gap-1 rounded-lg bg-slate-50 dark:bg-zinc-950 p-2 border border-slate-200/80 dark:border-zinc-800">
                    {Array.from({ length: truck.maxPallets }, (_, slotIdx) => {
                      const isBaseLoaded = slotIdx < truck.basePallets;
                      const isLtlLoaded =
                        slotIdx >= truck.basePallets && slotIdx < currentPallets;
                      return (
                        <div
                          key={slotIdx}
                          className={`h-3 rounded-[2px] transition-all duration-300 ${
                            isLtlLoaded
                              ? "bg-emerald-600 dark:bg-emerald-500"
                              : isBaseLoaded
                              ? "bg-blue-600/75 dark:bg-blue-500/75"
                              : "bg-slate-200 dark:bg-zinc-800"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Triple Progress Bars: Volume Utilization, Weight Utilization & Pallets Utilization */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {/* Volume Utilization Bar */}
                  <div className="rounded-lg bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 p-3">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Box className="h-3.5 w-3.5 text-slate-500" />
                        {t.ltl.volumeUtilization}
                      </span>
                      <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-zinc-100">
                        {volumePct}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                      <motion.div
                        initial={false}
                        animate={{ width: `${volumePct}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                        className={`h-full rounded-full ${
                          volumePct >= 92
                            ? "bg-amber-600 dark:bg-amber-500"
                            : "bg-blue-600 dark:bg-blue-500"
                        }`}
                      />
                    </div>
                    <span className="mt-1.5 block text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                      {currentVolume} / {truck.maxVolumeM3} m³
                    </span>
                  </div>

                  {/* Weight Utilization Bar */}
                  <div className="rounded-lg bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 p-3">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Weight className="h-3.5 w-3.5 text-slate-500" />
                        {t.ltl.weightUtilization}
                      </span>
                      <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-zinc-100">
                        {weightPct}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                      <motion.div
                        initial={false}
                        animate={{ width: `${weightPct}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                        className={`h-full rounded-full ${
                          weightPct >= 92
                            ? "bg-amber-600 dark:bg-amber-500"
                            : "bg-slate-700 dark:bg-zinc-300"
                        }`}
                      />
                    </div>
                    <span className="mt-1.5 block text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                      {(currentWeight / 1000).toFixed(1)} / {(truck.maxWeightKg / 1000).toFixed(1)} t
                    </span>
                  </div>

                  {/* Pallets Utilization Bar */}
                  <div className="rounded-lg bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 p-3">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Boxes className="h-3.5 w-3.5 text-slate-500" />
                        {t.ltl.palletsLoaded}
                      </span>
                      <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-zinc-100">
                        {Math.min(100, Math.round((currentPallets / truck.maxPallets) * 100))}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                      <motion.div
                        initial={false}
                        animate={{
                          width: `${Math.min(
                            100,
                            Math.round((currentPallets / truck.maxPallets) * 100)
                          )}%`,
                        }}
                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                        className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500"
                      />
                    </div>
                    <span className="mt-1.5 block text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                      {currentPallets} / {truck.maxPallets} EPAL
                    </span>
                  </div>
                </div>

                {/* Consolidated Shipments Manifest Inside Truck */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800">
                  {truckShipments.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                        {t.ltl.assignedShipmentsHeader} ({truckShipments.length})
                      </span>
                      {truckShipments.map((shp) => (
                        <div
                          key={shp.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="font-semibold text-slate-900 dark:text-zinc-100">
                              {shp.origin[locale]} → {shp.destination[locale]} - {shp.pallets}{" "}
                              {t.ltl.palletsUnit}
                            </span>
                            {shp.isBackhaulMatch && (
                              <span className="rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                                -{shp.emptyKmSaved} km empty • +{shp.fuelMadSaved} MAD
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => onUnassignShipment(shp.id)}
                            className="inline-flex items-center gap-1 rounded bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-[11px] text-slate-600 dark:text-zinc-300 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                          >
                            <X className="h-3 w-3" />
                            {t.ltl.unassignBtn}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30 py-2.5 px-3 text-center text-xs text-slate-400 dark:text-zinc-500">
                      {t.ltl.dragHereHint}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right: Pending Shipments Drag-and-Drop List */}
        <div className="xl:col-span-5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm flex flex-col">
          <div className="pb-4 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {t.ltl.pendingShipmentsTitle}
              </h3>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2.5 py-0.5 text-xs font-mono font-semibold text-slate-700 dark:text-zinc-300">
                  {pendingShipments.length} pending
                </span>
                {onAddShipment && (
                  <button
                    type="button"
                    onClick={() => setShowAddShipment((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 text-xs font-semibold transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>
                      {locale === "ar"
                        ? "شحنة جديدة"
                        : locale === "fr"
                        ? "Nouvelle Expédition"
                        : "Add Shipment"}
                    </span>
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {t.ltl.pendingShipmentsHint}
            </p>

            {/* Collapsible New Shipment Creator with Google Maps Distance Auto-Calc */}
            {showAddShipment && (
              <form
                onSubmit={handleCreateShipment}
                className="mt-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3.5 space-y-3 text-xs"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                      Origin Hub
                    </label>
                    <select
                      value={newOriginKey}
                      onChange={(e) => setNewOriginKey(e.target.value)}
                      className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs"
                    >
                      {Object.keys(MOROCCO_CITY_COORDS).map((ck) => (
                        <option key={ck} value={ck}>
                          {ck}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                      Destination Hub
                    </label>
                    <select
                      value={newDestKey}
                      onChange={(e) => setNewDestKey(e.target.value)}
                      className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs"
                    >
                      {Object.keys(MOROCCO_CITY_COORDS).map((ck) => (
                        <option key={ck} value={ck}>
                          {ck}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                      Pallets (EPAL)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={newPallets}
                      onChange={(e) => setNewPallets(e.target.value)}
                      className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                      Recommended Truck
                    </label>
                    <select
                      value={newRecTruckId}
                      onChange={(e) => setNewRecTruckId(e.target.value)}
                      className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-mono"
                    >
                      {trucks.map((trk) => (
                        <option key={trk.id} value={trk.id}>
                          {trk.code} ({trk.corridor})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-600 dark:text-zinc-400">
                  <span>
                    Google Maps Dist: <strong>{newShipmentRoute.distanceKm} km</strong> (
                    {newShipmentRoute.corridor})
                  </span>
                  <button
                    type="submit"
                    className="rounded bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs font-semibold"
                  >
                    + Add to Queue
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-4 space-y-3 flex-1">
            <AnimatePresence initial={false}>
              {pendingShipments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-8 text-center"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2.5" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    {t.ltl.allShipmentsAssigned}
                  </p>
                </motion.div>
              ) : (
                pendingShipments.map((shp) => (
                  <motion.div
                    key={shp.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    draggable
                    onDragStart={(e: any) => {
                      setDraggedShipmentId(shp.id);
                      if (e.dataTransfer) {
                        e.dataTransfer.setData("text/plain", shp.id);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedShipmentId(null);
                      setDragOverTruckId(null);
                    }}
                    className="cursor-grab active:cursor-grabbing rounded-lg bg-slate-50/70 dark:bg-zinc-950/60 border border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 p-4 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-slate-400" />
                        <span className="rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                          {shp.code} • {shp.corridor}
                        </span>
                      </div>

                      {shp.isBackhaulMatch && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {t.ltl.backhaulMatchBadge} ({shp.recommendedTruckCode})
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {shp.origin[locale]} to {shp.destination[locale]} - {shp.pallets}{" "}
                      {t.ltl.palletsUnit}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {shp.cargoType[locale]}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
                      <span className="rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 text-slate-700 dark:text-zinc-300">
                        {shp.volumeM3} m³
                      </span>
                      <span className="rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 text-slate-700 dark:text-zinc-300">
                        {(shp.weightKg / 1000).toFixed(1)} t
                      </span>
                      <span className="rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 font-semibold text-slate-900 dark:text-zinc-100">
                        +{shp.revenueMad.toLocaleString()} MAD
                      </span>
                      <span className="rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 text-emerald-700 dark:text-emerald-400">
                        -{shp.emptyKmSaved} km empty
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {t.ltl.assignToTruckLabel}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {trucks.map((trk) => {
                          const isRecommended = trk.id === shp.recommendedTruckId;
                          return (
                            <button
                              key={trk.id}
                              type="button"
                              onClick={() => handleAssignWithFeedback(shp.id, trk.id)}
                              className={`rounded-md px-2.5 py-1 text-xs font-mono font-semibold border transition-all ${
                                isRecommended
                                  ? "bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
                                  : "bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
                              }`}
                            >
                              + {trk.code}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
