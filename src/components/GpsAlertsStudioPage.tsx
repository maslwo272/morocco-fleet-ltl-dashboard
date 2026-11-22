"use client";

import React, { useState, useEffect } from "react";
import {
  Radio,
  BellRing,
  Flame,
  Send,
  Copy,
  Check,
  Save,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  Gauge,
  Droplets,
  Server,
  Play,
} from "lucide-react";
import {
  ClientDemoInstance,
  DEFAULT_GPS_ALERTS_CONFIG,
  DriverEcoRecord,
  GpsAlertLogRow,
  GpsAlertsConfig,
  GpsTelemetryLatestRow,
  MapTruck,
  PlatformSystemConfig,
} from "@/lib/supabase/database";

interface GpsAlertsStudioPageProps {
  instance: ClientDemoInstance;
  platformConfig: PlatformSystemConfig;
  trucks: MapTruck[];
  drivers: DriverEcoRecord[];
  liveTelemetry: GpsTelemetryLatestRow[];
  alertLogs: GpsAlertLogRow[];
  onSaveGpsConfig: (updatedConfig: GpsAlertsConfig) => Promise<void> | void;
  onRefreshLive: () => Promise<void> | void;
  onAcknowledgeAlertLog: (logId: string) => Promise<void> | void;
}

export function GpsAlertsStudioPage({
  instance,
  platformConfig,
  trucks,
  drivers,
  liveTelemetry,
  alertLogs,
  onSaveGpsConfig,
  onRefreshLive,
  onAcknowledgeAlertLog,
}: GpsAlertsStudioPageProps) {
  const [draft, setDraft] = useState<GpsAlertsConfig>(() => ({
    ...DEFAULT_GPS_ALERTS_CONFIG,
    ...(instance.gpsAlertsConfig || {}),
  }));
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Alert Tester State
  const [testTruckCode, setTestTruckCode] = useState(
    trucks[0]?.code || "Truck 01"
  );
  const [testIdleMins, setTestIdleMins] = useState("15");
  const [testChannel, setTestChannel] = useState<
    "telegram" | "whatsapp" | "both"
  >("telegram");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    detail: string;
    preview?: string;
  } | null>(null);

  // Mobile GPS Link Generator & Simulator State
  const [selectedPhoneTruckIdx, setSelectedPhoneTruckIdx] = useState("0");
  const [isSimulatingPing, setIsSimulatingPing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setDraft({
      ...DEFAULT_GPS_ALERTS_CONFIG,
      ...(instance.gpsAlertsConfig || {}),
    });
    setIsDirty(false);
  }, [instance.id, instance.gpsAlertsConfig]);

  useEffect(() => {
    if (trucks[0]?.code) {
      setTestTruckCode(trucks[0].code);
    }
  }, [trucks]);

  const updateDraft = (patch: Partial<GpsAlertsConfig>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveGpsConfig(draft);
      setIsDirty(false);
      setSaveToast(
        `GPS Tracking & Telegram/WhatsApp Rules for "${instance.clientName.en}" saved to Supabase!`
      );
      setTimeout(() => setSaveToast(null), 4500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft({
      ...DEFAULT_GPS_ALERTS_CONFIG,
      ...(instance.gpsAlertsConfig || {}),
    });
    setIsDirty(false);
    setSaveToast("Discarded unsaved GPS alert settings.");
    setTimeout(() => setSaveToast(null), 3500);
  };

  const copyText = (key: string, val: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(val);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://morocco-fleet-ltl-dashboard.vercel.app";

  const webhookUrl = `${origin}/api/gps/ingest?slug=${encodeURIComponent(
    instance.slug
  )}&secret=${encodeURIComponent(draft.webhookSecret || "")}`;

  const traccarXmlSnippet = `<entry key='forward.enable'>true</entry>
<entry key='forward.url'>${webhookUrl}</entry>
<entry key='forward.json'>true</entry>
<entry key='event.forward.enable'>true</entry>`;

  const selectedTruckForPhone = trucks[parseInt(selectedPhoneTruckIdx, 10) || 0];
  const phoneImei =
    selectedTruckForPhone?.gpsDeviceImei ||
    selectedTruckForPhone?.code?.replace(/\s+/g, "-").toUpperCase() ||
    "PHONE-GPS-01";
  const phoneTruckName = selectedTruckForPhone?.code || "Truck 01";
  const driverGpsUrl = `${origin}/driver-gps?slug=${encodeURIComponent(
    instance.slug
  )}&imei=${encodeURIComponent(phoneImei)}&truck=${encodeURIComponent(
    phoneTruckName
  )}&secret=${encodeURIComponent(draft.webhookSecret || "")}`;

  const handleSendRealTestAlert = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/alerts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: instance.slug,
          companyName: instance.clientName.en,
          channel: testChannel,
          truckCode: testTruckCode,
          idleMinutes: parseInt(testIdleMins, 10) || 15,
          overrideGpsConfig: draft,
          overrideCentralConfig: {
            centralTelegramBotToken: platformConfig.centralTelegramBotToken,
            centralWhatsappPhoneNumberId:
              platformConfig.centralWhatsappPhoneNumberId,
            centralWhatsappAccessToken:
              platformConfig.centralWhatsappAccessToken,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      setTestResult({
        ok: Boolean(data.ok),
        detail:
          data.deliveryDetail ||
          data.error ||
          `Delivery status: ${data.deliveryStatus || res.status}`,
        preview: data.messagePreview,
      });
      await onRefreshLive();
    } catch (err: any) {
      setTestResult({
        ok: false,
        detail: err?.message || "Failed to execute test alert request",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSimulateIngestPing = async () => {
    setIsSimulatingPing(true);
    try {
      const targetLat = selectedTruckForPhone?.lat ?? 35.8844;
      const targetLng = selectedTruckForPhone?.lng ?? -5.5026;
      const res = await fetch("/api/gps/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: instance.slug,
          secret: draft.webhookSecret,
          imei: phoneImei,
          truckCode: phoneTruckName,
          lat: targetLat,
          lng: targetLng,
          speedKmh: 0,
          ignition: true,
          simulatedIdleMinutes: Math.max(draft.idleTier1Mins + 2, 12),
          provider: "traccar_simulator",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setSaveToast(
          `Simulated GPS ping for ${phoneTruckName} (${data.idleMinutes} min idle, ${data.wastedMad} MAD wasted). Triggered ${
            data.triggeredAlerts?.length || 0
          } alert(s).`
        );
        await onRefreshLive();
      } else {
        setSaveToast(`Simulation failed: ${data.error || res.status}`);
      }
    } finally {
      setIsSimulatingPing(false);
    }
  };

  const hasCentralTelegram = Boolean(
    platformConfig.centralTelegramBotToken?.trim()
  );
  const hasCentralWhatsApp = Boolean(
    platformConfig.centralWhatsappPhoneNumberId?.trim() &&
      platformConfig.centralWhatsappAccessToken?.trim()
  );

  const normalizeWaPhone = (raw?: string | null) => {
    let digits = (raw || "").replace(/[^\d]/g, "");
    if (!digits) return "";
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.length === 10 && digits.startsWith("0")) {
      digits = `212${digits.slice(1)}`;
    }
    return digits;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner + Explicit Save */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-300">
            <Radio className="h-3.5 w-3.5" />
            HYBRID GPS TELEMETRY & WHATSAPP / TELEGRAM ALERTS
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
            {instance.clientName.en} — Real-Time GPS & Idling Fuel-Burn Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Connect Teltonika/Ruptela boxes via Traccar, Wialon webhooks, or the Driver Mobile GPS app to receive automatic Telegram & WhatsApp alerts when engines idle.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isDirty && (
            <button
              type="button"
              onClick={handleDiscard}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 px-3.5 py-2 text-xs font-bold"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Discard Edits</span>
            </button>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave()}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all ${
              isDirty
                ? "bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/30"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Save className="h-4 w-4" />
            <span>
              {isSaving
                ? "Saving..."
                : isDirty
                ? "Save GPS & Alert Configuration *"
                : "Save GPS & Alert Configuration to Supabase"}
            </span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-4 py-3 flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{saveToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            className="text-[11px] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Section 1 — Idling & Safety Rules + Section 2 — Telegram & WhatsApp Channels */}
        <div className="xl:col-span-7 space-y-6">
          {/* Section 1: Fuel-Burn Idling & Safety Thresholds */}
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-600" />
                <span>
                  1. Smart 2-Tier Idling & Fuel Waste Detection Rules
                </span>
              </h3>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(e) => updateDraft({ enabled: e.target.checked })}
                  className="h-4 w-4 rounded text-blue-600"
                />
                <span
                  className={
                    draft.enabled ? "text-emerald-600" : "text-slate-400"
                  }
                >
                  {draft.enabled
                    ? "Alert Engine ACTIVE"
                    : "Alert Engine PAUSED"}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Tier 1 Warning (Min Idle)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={draft.idleTier1Mins}
                  onChange={(e) =>
                    updateDraft({
                      idleTier1Mins: parseInt(e.target.value, 10) || 10,
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold text-amber-700 dark:text-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Tier 2 Manager Escalation (Min)
                </label>
                <input
                  type="number"
                  min="2"
                  max="360"
                  value={draft.idleTier2Mins}
                  onChange={(e) =>
                    updateDraft({
                      idleTier2Mins: parseInt(e.target.value, 10) || 25,
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold text-red-600 dark:text-red-400"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Anti-Spam Cooldown (Min)
                </label>
                <input
                  type="number"
                  min="1"
                  max="240"
                  value={draft.cooldownMins}
                  onChange={(e) =>
                    updateDraft({
                      cooldownMins: parseInt(e.target.value, 10) || 20,
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Idle Burn Rate (L / Hour)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="20"
                  value={draft.idleFuelBurnLph}
                  onChange={(e) =>
                    updateDraft({
                      idleFuelBurnLph: parseFloat(e.target.value) || 3.5,
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold"
                />
              </div>
            </div>

            {/* Bonus Safety Rules & Resolved Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-zinc-800 text-xs">
              <div className="rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3 space-y-2">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.sendResolvedNotice}
                    onChange={(e) =>
                      updateDraft({ sendResolvedNotice: e.target.checked })
                    }
                  />
                  <span>Send Resolved Summary</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Sends total idle time & MAD lost once driver shuts off engine or resumes driving.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3 space-y-2">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.overspeedEnabled}
                    onChange={(e) =>
                      updateDraft({ overspeedEnabled: e.target.checked })
                    }
                  />
                  <Gauge className="h-3.5 w-3.5 text-red-600" />
                  <span>Overspeed Limit (km/h)</span>
                </label>
                <input
                  type="number"
                  value={draft.overspeedThresholdKmh}
                  onChange={(e) =>
                    updateDraft({
                      overspeedThresholdKmh:
                        parseInt(e.target.value, 10) || 90,
                    })
                  }
                  className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2.5 py-1 font-mono font-bold"
                />
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3 space-y-2">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.fuelDropEnabled}
                    onChange={(e) =>
                      updateDraft({ fuelDropEnabled: e.target.checked })
                    }
                  />
                  <Droplets className="h-3.5 w-3.5 text-amber-600" />
                  <span>Fuel Theft Drop (L)</span>
                </label>
                <input
                  type="number"
                  value={draft.fuelDropThresholdLiters}
                  onChange={(e) =>
                    updateDraft({
                      fuelDropThresholdLiters:
                        parseInt(e.target.value, 10) || 15,
                    })
                  }
                  className="w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2.5 py-1 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Telegram Bot + Meta WhatsApp Cloud API */}
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3">
              <BellRing className="h-4 w-4 text-blue-600" />
              <span>2. Telegram Bot (Free) & Meta WhatsApp Cloud API</span>
            </h3>

            {/* Telegram Card */}
            <div className="rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/60 p-4 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 font-bold text-sky-900 dark:text-sky-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.telegramEnabled}
                    onChange={(e) =>
                      updateDraft({ telegramEnabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded text-sky-600"
                  />
                  <span>Enable Automated Telegram Bot Alerts</span>
                </label>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold border ${
                    draft.telegramCustomBotToken.trim() || hasCentralTelegram
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                  }`}
                >
                  {draft.telegramCustomBotToken.trim()
                    ? "Using Client Custom Bot Token"
                    : hasCentralTelegram
                    ? "✓ Using Ibrahim's Central Bot"
                    : "Need Central or Custom Bot Token"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Dispatcher / Group Chat ID (Tier 1 & 2) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. -100238910421 or 194820194"
                    value={draft.telegramChatId}
                    onChange={(e) =>
                      updateDraft({ telegramChatId: e.target.value })
                    }
                    className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Manager Escalation Chat ID (Tier 2 Only)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional Manager Telegram Chat ID"
                    value={draft.telegramManagerChatId}
                    onChange={(e) =>
                      updateDraft({ telegramManagerChatId: e.target.value })
                    }
                    className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Optional Client White-Label Bot Token (Leave blank to use Ibrahim&apos;s Central Bot)
                </label>
                <input
                  type="password"
                  placeholder="Optional: 71829301:AAH..."
                  value={draft.telegramCustomBotToken}
                  onChange={(e) =>
                    updateDraft({ telegramCustomBotToken: e.target.value })
                  }
                  className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 font-mono"
                />
              </div>
            </div>

            {/* Meta WhatsApp Cloud API Card */}
            <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 p-4 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.whatsappEnabled}
                    onChange={(e) =>
                      updateDraft({ whatsappEnabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded text-emerald-600"
                  />
                  <span>Enable Official Meta WhatsApp Cloud API Alerts</span>
                </label>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold border ${
                    (draft.whatsappCustomPhoneNumberId &&
                      draft.whatsappCustomAccessToken) ||
                    hasCentralWhatsApp
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {draft.whatsappCustomPhoneNumberId
                    ? "Custom Client Meta API"
                    : hasCentralWhatsApp
                    ? "✓ Using Central Meta API"
                    : "Optional (Configure Meta Credentials)"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Dispatcher WhatsApp (+212...)
                  </label>
                  <input
                    type="text"
                    placeholder="+212 6 61 00 00 00"
                    value={draft.whatsappDispatcherPhone}
                    onChange={(e) =>
                      updateDraft({ whatsappDispatcherPhone: e.target.value })
                    }
                    className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Manager Tier 2 WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+212 6 62 00 00 00"
                    value={draft.whatsappManagerPhone}
                    onChange={(e) =>
                      updateDraft({ whatsappManagerPhone: e.target.value })
                    }
                    className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Approved Template Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Blank = Direct text"
                    value={draft.whatsappTemplateName}
                    onChange={(e) =>
                      updateDraft({ whatsappTemplateName: e.target.value })
                    }
                    className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Optional Client Meta Phone Number ID
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank to use Ibrahim Central ID"
                    value={draft.whatsappCustomPhoneNumberId}
                    onChange={(e) =>
                      updateDraft({
                        whatsappCustomPhoneNumberId: e.target.value,
                      })
                    }
                    className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Optional Client Meta Permanent Token
                  </label>
                  <input
                    type="password"
                    placeholder="EAAG..."
                    value={draft.whatsappCustomAccessToken}
                    onChange={(e) =>
                      updateDraft({
                        whatsappCustomAccessToken: e.target.value,
                      })
                    }
                    className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Alert Tester + Hardware/Wialon/Phone Setup */}
        <div className="xl:col-span-5 space-y-6">
          {/* Live Alert Tester Card */}
          <div className="rounded-xl bg-slate-900 dark:bg-zinc-900 text-white border border-slate-800 p-5 shadow-md space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-400" />
              <span>Live Telegram & WhatsApp Test Dispatcher</span>
            </h3>
            <p className="text-xs text-slate-300">
              Send a real test idling alert immediately using your current settings above (works even before clicking Save so you can verify Chat IDs and Tokens).
            </p>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Truck Code
                </label>
                <input
                  type="text"
                  value={testTruckCode}
                  onChange={(e) => setTestTruckCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Simulated Idle (m)
                </label>
                <input
                  type="number"
                  value={testIdleMins}
                  onChange={(e) => setTestIdleMins(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Channel
                </label>
                <select
                  value={testChannel}
                  onChange={(e) => setTestChannel(e.target.value as any)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 font-semibold text-white"
                >
                  <option value="telegram">Telegram Only</option>
                  <option value="whatsapp">WhatsApp Only</option>
                  <option value="both">Telegram + WhatsApp</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={isSendingTest}
              onClick={handleSendRealTestAlert}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {isSendingTest
                  ? "Dispatching Real Test Alert..."
                  : "Send Real Test Alert Now →"}
              </span>
            </button>

            {testResult && (
              <div
                className={`rounded-xl p-3 text-xs border space-y-1.5 ${
                  testResult.ok
                    ? "bg-emerald-950/70 border-emerald-700 text-emerald-200"
                    : "bg-red-950/70 border-red-700 text-red-200"
                }`}
              >
                <p className="font-bold">
                  {testResult.ok ? "✓ Delivered!" : "✕ Delivery Issue"} —{" "}
                  {testResult.detail}
                </p>
                {testResult.preview && (
                  <pre className="whitespace-pre-wrap font-mono text-[10px] bg-black/30 rounded p-2 text-slate-200">
                    {testResult.preview}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Hardware (Teltonika / Traccar), Wialon & Mobile GPS Setup */}
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3">
              <Server className="h-4 w-4 text-blue-600" />
              <span>
                3. Connect Hardware Trackers (Teltonika / Traccar / Wialon) & Driver Phone
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">
                    Ingest Webhook Endpoint URL
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => copyText("webhook", webhookUrl)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 p-2 shrink-0"
                    >
                      {copiedKey === "webhook" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Webhook Secret Token
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={draft.webhookSecret}
                      onChange={(e) =>
                        updateDraft({ webhookSecret: e.target.value })
                      }
                      className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft({
                          webhookSecret: `atlas-${Math.random()
                            .toString(36)
                            .slice(2, 8)}`,
                        })
                      }
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 p-2 shrink-0"
                      title="Regenerate Secret"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold">
                    Traccar Server Forwarder (`traccar.xml` for Teltonika / Ruptela)
                  </label>
                  <button
                    type="button"
                    onClick={() => copyText("traccar", traccarXmlSnippet)}
                    className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {copiedKey === "traccar" ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Copied XML</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy traccar.xml</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="rounded-lg bg-slate-950 text-emerald-300 p-2.5 font-mono text-[10px] overflow-x-auto">
                  {traccarXmlSnippet}
                </pre>
              </div>

              {/* Driver Mobile GPS Link + Quick Simulator */}
              <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4" />
                    <span>Zero-Hardware Test & Driver Phone GPS Link</span>
                  </span>
                </div>

                {trucks.length > 0 && (
                  <select
                    value={selectedPhoneTruckIdx}
                    onChange={(e) => setSelectedPhoneTruckIdx(e.target.value)}
                    className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs font-semibold"
                  >
                    {trucks.map((t, idx) => (
                      <option key={t.id} value={String(idx)}>
                        {t.code} ({t.plate}) — IMEI:{" "}
                        {t.gpsDeviceImei || "Auto-ID"}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={driverGpsUrl}
                    className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2.5 py-1.5 font-mono text-[10px]"
                  />
                  <button
                    type="button"
                    onClick={() => copyText("phoneurl", driverGpsUrl)}
                    className="rounded-lg bg-blue-600 text-white px-2.5 py-1.5 text-[11px] font-bold shrink-0"
                  >
                    {copiedKey === "phoneurl" ? "Copied" : "Copy"}
                  </button>
                  <a
                    href={driverGpsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-slate-900 text-white p-2 shrink-0"
                    title="Open Mobile Tracker in New Tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <button
                  type="button"
                  disabled={isSimulatingPing}
                  onClick={handleSimulateIngestPing}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white py-2 text-xs font-bold shadow-sm transition-colors"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>
                    {isSimulatingPing
                      ? "Simulating Live Ingest..."
                      : `Simulate 12-Min Idling GPS Ping (${phoneTruckName})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Live Connected GPS Devices & Alert Delivery Audit Log */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Live GPS Devices Table */}
        <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Live Connected GPS Trackers ({liveTelemetry.length})
            </h3>
            <button
              type="button"
              onClick={async () => {
                setIsRefreshing(true);
                await onRefreshLive();
                setIsRefreshing(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>

          {liveTelemetry.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 p-8 text-center text-xs text-slate-500">
              No live GPS pings received for <strong>{instance.slug}</strong>{" "}
              yet. Open the <strong>Driver Phone GPS Link</strong> above or simulate a ping to see live telemetry appear here.
            </div>
          ) : (
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-2 px-2 text-start">Truck & IMEI</th>
                  <th className="py-2 px-2 text-start">Ignition & Speed</th>
                  <th className="py-2 px-2 text-start">Idle Burn</th>
                  <th className="py-2 px-2 text-end">Maps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800/70">
                {liveTelemetry.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2.5 px-2">
                      <span className="font-bold font-mono block">
                        {row.truck_code}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {row.device_imei} • {row.provider}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-mono">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                          row.ignition
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {row.ignition ? "IGNITION ON" : "ENGINE OFF"}
                      </span>
                      <span className="block text-[11px] mt-0.5">
                        {row.speed_kmh} km/h
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-mono">
                      <span
                        className={
                          row.idle_minutes >= draft.idleTier1Mins
                            ? "font-bold text-red-600"
                            : "text-slate-700 dark:text-zinc-300"
                        }
                      >
                        {row.idle_minutes} min
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {new Date(row.last_ping_at).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-end">
                      <a
                        href={`https://maps.google.com/?q=${row.latitude},${row.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                      >
                        <span>Pin</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Alert Delivery Audit Log */}
        <div className="xl:col-span-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-4">
            WhatsApp & Telegram Alert Delivery Log ({alertLogs.length})
          </h3>

          {alertLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 p-8 text-center text-xs text-slate-500">
              No WhatsApp or Telegram alert logs recorded yet. Send a Test Alert above to verify delivery!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pe-1">
              {alertLogs.map((log) => {
                const matchedDriver = drivers.find(
                  (d) =>
                    d.truckCode.toLowerCase() ===
                      log.truck_code.toLowerCase() ||
                    (log.driver_name &&
                      d.name.en.toLowerCase() === log.driver_name.toLowerCase())
                );
                const waDigits = normalizeWaPhone(
                  matchedDriver?.whatsapp || matchedDriver?.phone
                );
                const waText = encodeURIComponent(log.message_text);
                const waHref = waDigits
                  ? `https://wa.me/${waDigits}?text=${waText}`
                  : `https://wa.me/?text=${waText}`;

                return (
                  <div
                    key={log.id}
                    className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950 p-3 text-xs space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-900 dark:text-zinc-100">
                          {log.truck_code}
                        </span>
                        <span className="rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                          {log.alert_type}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            log.delivery_status === "sent"
                              ? "bg-emerald-100 text-emerald-700"
                              : log.delivery_status === "partial"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {log.channel}: {log.delivery_status}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                      {log.delivery_detail}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                        {log.idle_minutes}m idle • {log.wasted_fuel_liters}L (
                        {log.wasted_fuel_mad} MAD)
                      </span>

                      <div className="flex items-center gap-2">
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>WhatsApp Driver</span>
                        </a>

                        {!log.acknowledged ? (
                          <button
                            type="button"
                            onClick={() => onAcknowledgeAlertLog(log.id)}
                            className="rounded-md bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 px-2.5 py-1 text-[11px] font-semibold"
                          >
                            Acknowledge
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600">
                            ✓ Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
