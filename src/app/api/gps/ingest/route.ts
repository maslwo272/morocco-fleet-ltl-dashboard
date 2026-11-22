import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_GPS_ALERTS_CONFIG,
  GpsTelemetryLatestRow,
} from "@/lib/supabase/database";
import {
  dispatchInstanceAlert,
  fetchInstanceAndGlobalSettings,
  findInstanceByDeviceImei,
  getEffectiveFuelPriceMad,
  getSupabaseRestConfig,
  supabaseHeaders,
} from "@/lib/gps/alertDispatcher";

export const dynamic = "force-dynamic";

function parseBooleanFlexible(val: unknown): boolean | null {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "string") {
    const lower = val.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(lower)) return true;
    if (["false", "0", "no", "off"].includes(lower)) return false;
  }
  return null;
}

function parseNumberFlexible(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number(val);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function minutesBetween(isoA?: string | null, isoB?: Date): number {
  if (!isoA) return Infinity;
  const tA = new Date(isoA).getTime();
  const tB = (isoB || new Date()).getTime();
  if (Number.isNaN(tA)) return Infinity;
  return (tB - tA) / 60000;
}

interface NormalizedPing {
  slug: string;
  secret: string;
  imei: string;
  truckCode: string;
  provider: string;
  lat: number;
  lng: number;
  speedKmh: number;
  ignition: boolean;
  fuelLevelPct: number | null;
  fuelLiters: number | null;
  simulatedIdleMinutes: number;
  rawPayload: Record<string, any>;
}

function normalizeIncomingPayload(
  url: URL,
  body: Record<string, any> | null
): NormalizedPing | null {
  const sp = url.searchParams;
  const b = body || {};

  // Detect Traccar Forwarder JSON shape: { position: {...}, device: {...} }
  const isTraccarJson = Boolean(b.position && typeof b.position === "object");
  const pos = isTraccarJson ? b.position : {};
  const dev = isTraccarJson && b.device ? b.device : {};
  const attrs = pos.attributes && typeof pos.attributes === "object" ? pos.attributes : {};

  const slug = String(
    sp.get("slug") || b.slug || b.instanceSlug || b.instance_slug || ""
  ).trim();

  const secret = String(
    sp.get("secret") || b.secret || b.webhookSecret || ""
  ).trim();

  const imei = String(
    dev.uniqueId ||
      dev.id ||
      b.imei ||
      b.deviceImei ||
      b.device_imei ||
      b.uniqueId ||
      b.deviceId ||
      sp.get("id") ||
      sp.get("imei") ||
      sp.get("device_id") ||
      ""
  ).trim();

  const truckCode = String(
    b.truckCode ||
      b.truck_code ||
      dev.name ||
      sp.get("truck") ||
      sp.get("truckCode") ||
      imei ||
      "Unknown Truck"
  ).trim();

  const lat =
    parseNumberFlexible(pos.latitude) ??
    parseNumberFlexible(b.lat) ??
    parseNumberFlexible(b.latitude) ??
    parseNumberFlexible(sp.get("lat"));

  const lng =
    parseNumberFlexible(pos.longitude) ??
    parseNumberFlexible(b.lng) ??
    parseNumberFlexible(b.lon) ??
    parseNumberFlexible(b.longitude) ??
    parseNumberFlexible(sp.get("lon")) ??
    parseNumberFlexible(sp.get("lng"));

  if (lat === null || lng === null) {
    return null;
  }

  // Speed conversion rule:
  // Explicit speedKmh / speed_kmh is already in km/h.
  // Traccar JSON position.speed and Traccar OsmAnd ?speed= are in knots -> * 1.852.
  let speedKmh = 0;
  const explicitKmh =
    parseNumberFlexible(b.speedKmh) ??
    parseNumberFlexible(b.speed_kmh) ??
    parseNumberFlexible(sp.get("speedKmh"));
  if (explicitKmh !== null) {
    speedKmh = Math.max(0, explicitKmh);
  } else if (isTraccarJson && parseNumberFlexible(pos.speed) !== null) {
    speedKmh = Math.max(0, (parseNumberFlexible(pos.speed) || 0) * 1.852);
  } else if (sp.get("speed") !== null) {
    // OsmAnd URL param
    speedKmh = Math.max(0, (parseNumberFlexible(sp.get("speed")) || 0) * 1.852);
  } else if (parseNumberFlexible(b.speed) !== null) {
    // Generic JSON webhook (Wialon sends km/h)
    speedKmh = Math.max(0, parseNumberFlexible(b.speed) || 0);
  }

  const ignitionParsed =
    parseBooleanFlexible(attrs.ignition) ??
    parseBooleanFlexible(b.ignition) ??
    parseBooleanFlexible(b.acc) ??
    parseBooleanFlexible(b.engineOn) ??
    parseBooleanFlexible(sp.get("ignition")) ??
    parseBooleanFlexible(sp.get("acc"));

  // If device moves > 5 km/h and ignition wasn't explicitly false, treat ignition as true
  const ignition =
    ignitionParsed !== null ? ignitionParsed : speedKmh > 5 ? true : false;

  const fuelLevelPct =
    parseNumberFlexible(attrs.fuel) ??
    parseNumberFlexible(b.fuelLevelPct) ??
    parseNumberFlexible(b.fuel_level_pct) ??
    parseNumberFlexible(sp.get("fuel_pct"));

  const fuelLiters =
    parseNumberFlexible(b.fuelLiters) ??
    parseNumberFlexible(b.fuel_liters) ??
    parseNumberFlexible(attrs.fuelLiters) ??
    parseNumberFlexible(sp.get("fuel_liters"));

  const simulatedIdleMinutes = Math.max(
    0,
    parseNumberFlexible(b.simulatedIdleMinutes) ??
      parseNumberFlexible(sp.get("simulatedIdleMinutes")) ??
      0
  );

  const provider = String(
    b.provider ||
      sp.get("provider") ||
      (isTraccarJson ? "traccar" : sp.get("id") ? "traccar_osmand" : "webhook")
  );

  return {
    slug,
    secret,
    imei: imei || truckCode,
    truckCode,
    provider,
    lat,
    lng,
    speedKmh: Math.round(speedKmh * 100) / 100,
    ignition,
    fuelLevelPct,
    fuelLiters,
    simulatedIdleMinutes,
    rawPayload: isTraccarJson ? b : { query: Object.fromEntries(sp.entries()), body: b },
  };
}

async function handleGpsIngest(req: NextRequest) {
  try {
    const reqUrl = new URL(req.url);
    let jsonBody: Record<string, any> | null = null;
    if (req.method === "POST") {
      jsonBody = await req.json().catch(() => null);
    }

    const ping = normalizeIncomingPayload(reqUrl, jsonBody);
    if (!ping) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing valid latitude/longitude coordinates in GPS payload.",
        },
        { status: 400 }
      );
    }

    // Resolve instance either by slug or by matching truck IMEI across Supabase demo_instances
    let resolvedSlug = ping.slug;
    const initialFetched = resolvedSlug
      ? await fetchInstanceAndGlobalSettings(resolvedSlug)
      : { instance: null, globalConfig: {} };
    let instanceData = initialFetched.instance;
    let globalConfig = initialFetched.globalConfig;

    if (!instanceData && ping.imei) {
      const found = await findInstanceByDeviceImei(ping.imei);
      if (found) {
        instanceData = found;
        resolvedSlug = found.slug;
        const g = await fetchInstanceAndGlobalSettings(found.slug);
        globalConfig = g.globalConfig;
      }
    }

    if (!instanceData || !resolvedSlug) {
      return NextResponse.json(
        {
          ok: false,
          error: `No client instance found for slug="${ping.slug || "(none)"}" or IMEI="${ping.imei}".`,
        },
        { status: 404 }
      );
    }

    const gpsConfig = {
      ...DEFAULT_GPS_ALERTS_CONFIG,
      ...(instanceData.gpsAlertsConfig || {}),
    };

    const headerSecret = req.headers.get("x-webhook-secret") || "";
    const providedSecret = ping.secret || headerSecret;
    if (
      gpsConfig.webhookSecret &&
      providedSecret !== gpsConfig.webhookSecret
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid GPS webhook secret." },
        { status: 401 }
      );
    }

    // Match Truck & Driver inside instance fleetData
    const trucks = instanceData.fleetData?.trucks || [];
    const drivers = instanceData.fleetData?.drivers || [];
    const matchedTruck = trucks.find(
      (t) =>
        (t.gpsDeviceImei &&
          t.gpsDeviceImei.trim().toLowerCase() === ping.imei.toLowerCase()) ||
        t.code.trim().toLowerCase() === ping.truckCode.toLowerCase() ||
        t.plate.trim().toLowerCase() === ping.imei.toLowerCase()
    );

    const truckCode = matchedTruck?.code || ping.truckCode;
    const driverName = matchedTruck?.driverName?.en || undefined;
    const matchedDriver = drivers.find(
      (d) =>
        d.truckCode.toLowerCase() === truckCode.toLowerCase() ||
        (driverName && d.name.en.toLowerCase() === driverName.toLowerCase())
    );
    const driverPhone = matchedDriver?.phone || matchedDriver?.whatsapp;

    // Fetch previous telemetry row for state tracking
    const { url: sbUrl } = getSupabaseRestConfig();
    const prevRes = await fetch(
      `${sbUrl}/rest/v1/gps_telemetry_latest?instance_slug=eq.${encodeURIComponent(
        resolvedSlug
      )}&device_imei=eq.${encodeURIComponent(ping.imei)}&limit=1`,
      { method: "GET", headers: supabaseHeaders(), cache: "no-store" }
    );
    const prevRows = prevRes.ok ? await prevRes.json().catch(() => []) : [];
    const prevRow: GpsTelemetryLatestRow | null =
      Array.isArray(prevRows) && prevRows[0] ? prevRows[0] : null;

    const now = new Date();
    const nowIso = now.toISOString();
    const fuelPriceMad = getEffectiveFuelPriceMad(instanceData);
    const burnRateLph =
      gpsConfig.idleFuelBurnLph ||
      globalConfig.idleFuelBurnLitersPerHour ||
      3.5;

    // Idling rule: ignition ON && speed <= 2 km/h (and not exempted Reefer ATP)
    const isIdling =
      ping.ignition === true &&
      ping.speedKmh <= 2 &&
      !matchedTruck?.ignoreReeferIdleAlert;

    let idleStartedAt: string | null = prevRow?.idle_started_at || null;
    if (isIdling) {
      if (ping.simulatedIdleMinutes > 0) {
        idleStartedAt = new Date(
          now.getTime() - ping.simulatedIdleMinutes * 60000
        ).toISOString();
      } else if (!idleStartedAt) {
        idleStartedAt = nowIso;
      }
    }

    const idleMinutes = isIdling
      ? Math.max(
          ping.simulatedIdleMinutes,
          Math.floor(minutesBetween(idleStartedAt, now))
        )
      : 0;
    const wastedLiters =
      Math.round(((idleMinutes / 60) * burnRateLph) * 100) / 100;
    const wastedMad = Math.round(wastedLiters * fuelPriceMad * 100) / 100;

    let lastTier1AlertAt = prevRow?.last_tier1_alert_at || null;
    let lastTier2AlertAt = prevRow?.last_tier2_alert_at || null;
    let lastOverspeedAlertAt = prevRow?.last_overspeed_alert_at || null;
    let lastFuelDropAlertAt = prevRow?.last_fuel_drop_alert_at || null;

    const triggeredAlerts: any[] = [];
    const companyName =
      instanceData.clientName?.en || instanceData.slug || resolvedSlug;

    if (gpsConfig.enabled) {
      // A. Smart 2-Tier Fuel-Burn Idling State Machine
      if (isIdling) {
        const cooldown = Math.max(1, gpsConfig.cooldownMins || 20);
        const tier2Due =
          idleMinutes >= (gpsConfig.idleTier2Mins || 25) &&
          minutesBetween(lastTier2AlertAt, now) >= cooldown;
        const tier1Due =
          !tier2Due &&
          idleMinutes >= (gpsConfig.idleTier1Mins || 10) &&
          minutesBetween(lastTier1AlertAt, now) >= cooldown;

        if (tier2Due) {
          const res = await dispatchInstanceAlert({
            instanceSlug: resolvedSlug,
            companyName,
            gpsConfig,
            globalConfig,
            deviceImei: ping.imei,
            truckCode,
            plate: matchedTruck?.plate,
            driverName,
            driverPhone,
            kind: "idling_tier2",
            severity: "critical",
            idleMinutes,
            wastedLiters,
            wastedMad,
            speedKmh: ping.speedKmh,
            lat: ping.lat,
            lng: ping.lng,
          });
          lastTier2AlertAt = nowIso;
          triggeredAlerts.push({ type: "idling_tier2", ...res });
        } else if (tier1Due) {
          const res = await dispatchInstanceAlert({
            instanceSlug: resolvedSlug,
            companyName,
            gpsConfig,
            globalConfig,
            deviceImei: ping.imei,
            truckCode,
            plate: matchedTruck?.plate,
            driverName,
            driverPhone,
            kind: "idling_tier1",
            severity: "warning",
            idleMinutes,
            wastedLiters,
            wastedMad,
            speedKmh: ping.speedKmh,
            lat: ping.lat,
            lng: ping.lng,
          });
          lastTier1AlertAt = nowIso;
          triggeredAlerts.push({ type: "idling_tier1", ...res });
        }
      } else {
        // Not idling anymore -> Check if previous session triggered Tier 1 or Tier 2 alert
        const hadActiveIdleAlert = Boolean(
          prevRow?.last_tier1_alert_at || prevRow?.last_tier2_alert_at
        );
        if (hadActiveIdleAlert && gpsConfig.sendResolvedNotice) {
          const prevIdleMins = prevRow?.idle_minutes || 0;
          const prevLiters =
            Math.round(((prevIdleMins / 60) * burnRateLph) * 100) / 100;
          const prevMad = Math.round(prevLiters * fuelPriceMad * 100) / 100;
          const res = await dispatchInstanceAlert({
            instanceSlug: resolvedSlug,
            companyName,
            gpsConfig,
            globalConfig,
            deviceImei: ping.imei,
            truckCode,
            plate: matchedTruck?.plate,
            driverName,
            driverPhone,
            kind: "idling_resolved",
            severity: "success",
            idleMinutes: prevIdleMins,
            wastedLiters: prevLiters,
            wastedMad: prevMad,
            speedKmh: ping.speedKmh,
            lat: ping.lat,
            lng: ping.lng,
          });
          triggeredAlerts.push({ type: "idling_resolved", ...res });
        }
        idleStartedAt = null;
        lastTier1AlertAt = null;
        lastTier2AlertAt = null;
      }

      // B. Bonus Overspeed Check
      if (
        gpsConfig.overspeedEnabled &&
        ping.speedKmh > (gpsConfig.overspeedThresholdKmh || 90) &&
        minutesBetween(lastOverspeedAlertAt, now) >=
          Math.max(1, gpsConfig.cooldownMins || 20)
      ) {
        const res = await dispatchInstanceAlert({
          instanceSlug: resolvedSlug,
          companyName,
          gpsConfig,
          globalConfig,
          deviceImei: ping.imei,
          truckCode,
          plate: matchedTruck?.plate,
          driverName,
          driverPhone,
          kind: "overspeed",
          severity: "critical",
          idleMinutes: 0,
          wastedLiters: 0,
          wastedMad: 0,
          speedKmh: ping.speedKmh,
          lat: ping.lat,
          lng: ping.lng,
        });
        lastOverspeedAlertAt = nowIso;
        triggeredAlerts.push({ type: "overspeed", ...res });
      }

      // C. Bonus Sudden Fuel Drop / Theft Check (while stopped <= 5 km/h)
      if (
        gpsConfig.fuelDropEnabled &&
        prevRow?.fuel_liters !== null &&
        prevRow?.fuel_liters !== undefined &&
        ping.fuelLiters !== null &&
        ping.speedKmh <= 5 &&
        prevRow.fuel_liters - ping.fuelLiters >=
          (gpsConfig.fuelDropThresholdLiters || 15) &&
        minutesBetween(lastFuelDropAlertAt, now) >=
          Math.max(1, gpsConfig.cooldownMins || 20)
      ) {
        const dropped = prevRow.fuel_liters - ping.fuelLiters;
        const res = await dispatchInstanceAlert({
          instanceSlug: resolvedSlug,
          companyName,
          gpsConfig,
          globalConfig,
          deviceImei: ping.imei,
          truckCode,
          plate: matchedTruck?.plate,
          driverName,
          driverPhone,
          kind: "fuel_drop",
          severity: "critical",
          idleMinutes: 0,
          wastedLiters: dropped,
          wastedMad: Math.round(dropped * fuelPriceMad * 100) / 100,
          speedKmh: ping.speedKmh,
          fuelDropLiters: dropped,
          lat: ping.lat,
          lng: ping.lng,
        });
        lastFuelDropAlertAt = nowIso;
        triggeredAlerts.push({ type: "fuel_drop", ...res });
      }
    }

    // Upsert latest ping state into public.gps_telemetry_latest
    const upsertRow = {
      instance_slug: resolvedSlug,
      device_imei: ping.imei,
      truck_code: truckCode,
      driver_name: driverName || null,
      driver_phone: driverPhone || null,
      provider: ping.provider,
      latitude: ping.lat,
      longitude: ping.lng,
      speed_kmh: ping.speedKmh,
      ignition: ping.ignition,
      fuel_level_pct: ping.fuelLevelPct,
      fuel_liters: ping.fuelLiters,
      idle_started_at: idleStartedAt,
      idle_minutes: idleMinutes,
      last_tier1_alert_at: lastTier1AlertAt,
      last_tier2_alert_at: lastTier2AlertAt,
      last_overspeed_alert_at: lastOverspeedAlertAt,
      last_fuel_drop_alert_at: lastFuelDropAlertAt,
      last_ping_at: nowIso,
      raw_payload: ping.rawPayload,
    };

    const upsertRes = await fetch(
      `${sbUrl}/rest/v1/gps_telemetry_latest?on_conflict=instance_slug,device_imei`,
      {
        method: "POST",
        headers: supabaseHeaders({
          Prefer: "resolution=merge-duplicates,return=representation",
        }),
        body: JSON.stringify([upsertRow]),
      }
    );

    const savedRows = upsertRes.ok
      ? await upsertRes.json().catch(() => [upsertRow])
      : [upsertRow];

    return NextResponse.json({
      ok: true,
      instanceSlug: resolvedSlug,
      truckCode,
      isIdling,
      idleMinutes,
      wastedLiters,
      wastedMad,
      telemetry: Array.isArray(savedRows) ? savedRows[0] : upsertRow,
      triggeredAlerts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "GPS ingest error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleGpsIngest(req);
}

export async function GET(req: NextRequest) {
  return handleGpsIngest(req);
}
