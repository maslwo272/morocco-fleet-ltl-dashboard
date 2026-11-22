"use client";

import React, { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Radio,
  Navigation,
  Power,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Truck,
  MapPin,
  Gauge,
  RefreshCw,
} from "lucide-react";

function DriverGpsInner() {
  const searchParams = useSearchParams();

  const [slug, setSlug] = useState(
    () => searchParams.get("slug") || ""
  );
  const [imei, setImei] = useState(
    () => searchParams.get("imei") || "PHONE-GPS-01"
  );
  const [truckCode, setTruckCode] = useState(
    () => searchParams.get("truck") || "Truck 01"
  );
  const [secret, setSecret] = useState(
    () => searchParams.get("secret") || "atlas-gps-2026"
  );

  const [isTracking, setIsTracking] = useState(false);
  const [ignitionOn, setIgnitionOn] = useState(true);
  const [lat, setLat] = useState<number>(33.605);
  const [lng, setLng] = useState<number>(-7.53);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>(
    "Ready — Tap Start Live Tracking to stream phone GPS."
  );
  const [lastPingResult, setLastPingResult] = useState<{
    ok: boolean;
    message: string;
    time: string;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const coordsRef = useRef({ lat: 33.605, lng: -7.53, speedKmh: 0 });

  useEffect(() => {
    coordsRef.current = { lat, lng, speedKmh };
  }, [lat, lng, speedKmh]);

  const sendPing = useCallback(
    async (opts?: {
      simulatedIdleMinutes?: number;
      overrideSpeed?: number;
      overrideIgnition?: boolean;
    }) => {
      if (!slug.trim()) {
        setLastPingResult({
          ok: false,
          message: "Please enter the Client Instance Slug first (e.g. sdtm).",
          time: new Date().toLocaleTimeString(),
        });
        return;
      }

      setIsSending(true);
      try {
        const cur = coordsRef.current;
        const payload = {
          slug: slug.trim(),
          secret: secret.trim(),
          imei: imei.trim() || "PHONE-GPS-01",
          truckCode: truckCode.trim() || "Truck 01",
          lat: cur.lat,
          lng: cur.lng,
          speedKmh:
            opts?.overrideSpeed !== undefined ? opts.overrideSpeed : cur.speedKmh,
          ignition:
            opts?.overrideIgnition !== undefined
              ? opts.overrideIgnition
              : ignitionOn,
          provider: "mobile_gps",
          simulatedIdleMinutes: opts?.simulatedIdleMinutes ?? 0,
        };

        const res = await fetch("/api/gps/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          const alertsTriggered = Array.isArray(data.triggeredAlerts)
            ? data.triggeredAlerts.length
            : 0;
          setLastPingResult({
            ok: true,
            message:
              alertsTriggered > 0
                ? `Ping saved + ${alertsTriggered} Telegram/WhatsApp alert(s) triggered! (${data.idleMinutes} min idle)`
                : `GPS ping delivered (${data.truckCode} • ${
                    payload.ignition ? "Engine ON" : "Engine OFF"
                  } • ${payload.speedKmh} km/h)`,
            time: new Date().toLocaleTimeString(),
          });
        } else {
          setLastPingResult({
            ok: false,
            message: data.error || `HTTP ${res.status}`,
            time: new Date().toLocaleTimeString(),
          });
        }
      } catch (err: any) {
        setLastPingResult({
          ok: false,
          message: err?.message || "Network error",
          time: new Date().toLocaleTimeString(),
        });
      } finally {
        setIsSending(false);
      }
    },
    [slug, secret, imei, truckCode, ignitionOn]
  );

  useEffect(() => {
    if (!isTracking) {
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setGeoStatus("Acquiring GPS lock from smartphone sensor...");
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const nextLat = Math.round(pos.coords.latitude * 1000000) / 1000000;
          const nextLng = Math.round(pos.coords.longitude * 1000000) / 1000000;
          const rawSpeedMs = pos.coords.speed ?? 0;
          const nextKmh = Math.max(
            0,
            Math.round(rawSpeedMs * 3.6 * 10) / 10
          );
          setLat(nextLat);
          setLng(nextLng);
          setSpeedKmh(nextKmh);
          setAccuracyM(Math.round(pos.coords.accuracy || 0));
          setGeoStatus("Live GPS Lock Active — Streaming every 10s");
        },
        (err) => {
          setGeoStatus(
            `GPS fallback mode (${err.message}). Using manual/last coordinates.`
          );
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    } else {
      setGeoStatus("Browser Geolocation unavailable — streaming coordinates.");
    }

    // Immediate ping + 10s interval
    sendPing();
    const timer = setInterval(() => {
      sendPing();
    }, 10000);

    return () => {
      clearInterval(timer);
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTracking, sendPing]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        {/* Mobile Header */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Radio
                  className={`h-5 w-5 ${isTracking ? "animate-pulse" : ""}`}
                />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">
                  AtlasLogix Driver GPS
                </h1>
                <p className="text-[11px] font-mono text-slate-400">
                  Mobile Telemetry & Idling Beacon
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-mono font-bold border ${
                isTracking
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {isTracking ? "● LIVE 10s" : "STANDBY"}
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-300 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2">
            {geoStatus}
          </p>
        </div>

        {/* Connection Fields */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Instance Slug *
              </label>
              <input
                type="text"
                placeholder="e.g. ctm-maroc"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 font-mono font-bold text-blue-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Truck Code
              </label>
              <input
                type="text"
                value={truckCode}
                onChange={(e) => setTruckCode(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 font-mono font-bold text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Device IMEI / Phone ID
              </label>
              <input
                type="text"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 font-mono text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Webhook Secret
              </label>
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 font-mono text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Live Telemetry Readout + Ignition Toggle */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
              <MapPin className="h-4 w-4 text-blue-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 block">LAT / LNG</span>
              <span className="text-[11px] font-mono font-bold text-white block mt-0.5">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
              <Gauge className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 block">SPEED</span>
              <span className="text-sm font-mono font-bold text-white block mt-0.5">
                {speedKmh} km/h
              </span>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
              <Truck className="h-4 w-4 text-amber-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 block">ACCURACY</span>
              <span className="text-sm font-mono font-bold text-white block mt-0.5">
                {accuracyM !== null ? `±${accuracyM}m` : "Ready"}
              </span>
            </div>
          </div>

          {/* Ignition Engine ON/OFF Switch */}
          <button
            type="button"
            onClick={() => setIgnitionOn((v) => !v)}
            className={`w-full rounded-xl p-3.5 border flex items-center justify-between transition-all ${
              ignitionOn
                ? "bg-amber-500/15 border-amber-500/50 text-amber-200"
                : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2.5 text-start">
              <Power className="h-5 w-5 shrink-0" />
              <div>
                <span className="text-xs font-bold block">
                  Engine Ignition: {ignitionOn ? "ON (ACC Active)" : "OFF (Parked)"}
                </span>
                <span className="text-[10px] opacity-80 block">
                  {ignitionOn && speedKmh <= 2
                    ? "Warning: Engine ON while speed = 0 counts as fuel idling!"
                    : "Tap to toggle truck ignition ACC sensor simulation"}
                </span>
              </div>
            </div>
            <span className="rounded-lg bg-slate-950 px-2.5 py-1 font-mono text-[11px] font-bold">
              TOGGLE
            </span>
          </button>

          {/* Primary Start / Stop Button */}
          <div className="grid grid-cols-1 gap-2.5">
            <button
              type="button"
              onClick={() => setIsTracking((v) => !v)}
              className={`w-full rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                isTracking
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              <Navigation className="h-4 w-4" />
              <span>
                {isTracking
                  ? "Stop Live GPS Streaming"
                  : "Start Live Tracking (Every 10s)"}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isSending}
                onClick={() => sendPing()}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1.5"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isSending ? "animate-spin" : ""}`}
                />
                <span>Send Single Ping</span>
              </button>

              <button
                type="button"
                disabled={isSending}
                onClick={() =>
                  sendPing({
                    simulatedIdleMinutes: 15,
                    overrideSpeed: 0,
                    overrideIgnition: true,
                  })
                }
                className="rounded-xl bg-amber-600 hover:bg-amber-700 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Simulate 15m Idling Alert</span>
              </button>
            </div>
          </div>

          {lastPingResult && (
            <div
              className={`rounded-xl p-3 border text-xs flex items-start gap-2 ${
                lastPingResult.ok
                  ? "bg-emerald-950/60 border-emerald-700 text-emerald-200"
                  : "bg-red-950/60 border-red-700 text-red-200"
              }`}
            >
              {lastPingResult.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{lastPingResult.message}</p>
                <p className="text-[10px] font-mono opacity-75 mt-0.5">
                  {lastPingResult.time}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DriverGpsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-xs font-mono">
          Loading AtlasLogix Mobile GPS Tracker...
        </div>
      }
    >
      <DriverGpsInner />
    </Suspense>
  );
}
