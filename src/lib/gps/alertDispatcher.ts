import {
  ClientDemoInstance,
  DEFAULT_GPS_ALERTS_CONFIG,
  DIESEL_PRICE_MAD_PER_LITER,
  GpsAlertLogRow,
  GpsAlertsConfig,
  PlatformSystemConfig,
} from "@/lib/supabase/database";

const FALLBACK_SB_URL = "https://qosfrncehxnpxtrajpeo.supabase.co";
const FALLBACK_SB_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvc2ZybmNlaHhucHh0cmFqcGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyOTI1MTQsImV4cCI6MjExMDg2ODUxNH0.d8mVqTzzSz3Sgb1HHPPPGtEc_c7-vCjVA7OYoxJK6fM";

export function getSupabaseRestConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SB_URL)
    .trim()
    .replace(/\/+$/, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    FALLBACK_SB_ANON_KEY
  ).trim();
  return { url, key };
}

export function supabaseHeaders(extra?: Record<string, string>) {
  const { key } = getSupabaseRestConfig();
  return {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

export async function fetchInstanceAndGlobalSettings(slug: string): Promise<{
  instance: ClientDemoInstance | null;
  globalConfig: Partial<PlatformSystemConfig>;
}> {
  const { url } = getSupabaseRestConfig();
  const headers = supabaseHeaders();

  const [instRes, settingsRes] = await Promise.all([
    fetch(
      `${url}/rest/v1/demo_instances?slug=eq.${encodeURIComponent(slug)}&select=slug,payload`,
      { method: "GET", headers, cache: "no-store" }
    ),
    fetch(
      `${url}/rest/v1/platform_settings?id=eq.global_workspace&select=payload`,
      { method: "GET", headers, cache: "no-store" }
    ),
  ]);

  let instance: ClientDemoInstance | null = null;
  if (instRes.ok) {
    const rows = await instRes.json().catch(() => []);
    if (Array.isArray(rows) && rows[0]?.payload) {
      instance = rows[0].payload as ClientDemoInstance;
    }
  }

  let globalConfig: Partial<PlatformSystemConfig> = {};
  if (settingsRes.ok) {
    const rows = await settingsRes.json().catch(() => []);
    if (Array.isArray(rows) && rows[0]?.payload?.platformConfig) {
      globalConfig = rows[0].payload.platformConfig as Partial<PlatformSystemConfig>;
    }
  }

  return { instance, globalConfig };
}

export async function findInstanceByDeviceImei(
  imei: string
): Promise<ClientDemoInstance | null> {
  if (!imei.trim()) return null;
  const { url } = getSupabaseRestConfig();
  const res = await fetch(
    `${url}/rest/v1/demo_instances?select=slug,payload`,
    { method: "GET", headers: supabaseHeaders(), cache: "no-store" }
  );
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  if (!Array.isArray(rows)) return null;

  const target = imei.trim().toLowerCase();
  for (const row of rows) {
    const inst = row?.payload as ClientDemoInstance | undefined;
    const trucks = inst?.fleetData?.trucks || [];
    const hit = trucks.find(
      (t) =>
        (t.gpsDeviceImei && t.gpsDeviceImei.trim().toLowerCase() === target) ||
        t.code.trim().toLowerCase() === target ||
        t.plate.trim().toLowerCase() === target
    );
    if (hit && inst) return inst;
  }
  return null;
}

export function normalizeMoroccoPhone(rawPhone: string): string {
  let digits = (rawPhone || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }
  if (
    digits.length === 10 &&
    (digits.startsWith("06") || digits.startsWith("07") || digits.startsWith("05"))
  ) {
    digits = `212${digits.slice(1)}`;
  }
  return digits;
}

function escapeTelegramHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegramAlert(params: {
  botToken: string;
  chatId: string;
  text: string;
  lat?: number | null;
  lng?: number | null;
}): Promise<{ ok: boolean; detail: string }> {
  const token = params.botToken.trim();
  const chatId = params.chatId.trim();
  if (!token || !chatId) {
    return {
      ok: false,
      detail: "Missing Telegram Bot Token or Chat ID",
    };
  }

  const mapsUrl =
    typeof params.lat === "number" &&
    typeof params.lng === "number" &&
    !Number.isNaN(params.lat) &&
    !Number.isNaN(params.lng)
      ? `https://maps.google.com/?q=${params.lat.toFixed(6)},${params.lng.toFixed(6)}`
      : null;

  const body: Record<string, any> = {
    chat_id: chatId,
    text: escapeTelegramHtml(params.text),
    parse_mode: "HTML",
    disable_web_page_preview: false,
  };

  if (mapsUrl) {
    body.reply_markup = {
      inline_keyboard: [
        [
          {
            text: "📍 Open Truck Location in Google Maps",
            url: mapsUrl,
          },
        ],
      ],
    };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.ok) {
      return {
        ok: true,
        detail: `Telegram delivered to chat ${chatId} (msg_id=${data.result?.message_id ?? "ok"})`,
      };
    }
    return {
      ok: false,
      detail: `Telegram HTTP ${res.status}: ${data?.description || "Unknown error"}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      detail: `Telegram network error: ${err?.message || "Failed"}`,
    };
  }
}

export async function sendWhatsAppCloudAlert(params: {
  phoneNumberId: string;
  accessToken: string;
  toPhone: string;
  text: string;
  templateName?: string;
}): Promise<{ ok: boolean; detail: string }> {
  const phoneNumberId = params.phoneNumberId.trim();
  const accessToken = params.accessToken.trim();
  const normalizedPhone = normalizeMoroccoPhone(params.toPhone);

  if (!phoneNumberId || !accessToken || !normalizedPhone) {
    return {
      ok: false,
      detail: "Missing Meta Phone Number ID, Access Token, or recipient WhatsApp phone",
    };
  }

  const templateName = (params.templateName || "").trim();
  const payload = templateName
    ? {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "fr" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: params.text.slice(0, 900) }],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizedPhone,
        type: "text",
        text: {
          preview_url: true,
          body: params.text,
        },
      };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data?.messages) && data.messages[0]?.id) {
      return {
        ok: true,
        detail: `WhatsApp delivered to +${normalizedPhone} (wamid=${data.messages[0].id})`,
      };
    }
    return {
      ok: false,
      detail: `Meta WhatsApp HTTP ${res.status}: ${
        data?.error?.message || JSON.stringify(data).slice(0, 180)
      }`,
    };
  } catch (err: any) {
    return {
      ok: false,
      detail: `WhatsApp network error: ${err?.message || "Failed"}`,
    };
  }
}

export type AlertKind =
  | "idling_tier1"
  | "idling_tier2"
  | "idling_resolved"
  | "overspeed"
  | "fuel_drop"
  | "test_alert";

export function buildAlertMessage(params: {
  kind: AlertKind;
  companyName: string;
  truckCode: string;
  plate?: string;
  driverName?: string;
  driverPhone?: string;
  idleMinutes: number;
  wastedLiters: number;
  wastedMad: number;
  speedKmh?: number;
  fuelDropLiters?: number;
  lat?: number | null;
  lng?: number | null;
}): string {
  const {
    kind,
    companyName,
    truckCode,
    plate,
    driverName,
    driverPhone,
    idleMinutes,
    wastedLiters,
    wastedMad,
    speedKmh,
    fuelDropLiters,
    lat,
    lng,
  } = params;

  const hasCoords =
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng);
  const mapsLink = hasCoords
    ? `https://maps.google.com/?q=${lat!.toFixed(6)},${lng!.toFixed(6)}`
    : null;

  let header = "";
  let bodyDetail = "";

  switch (kind) {
    case "idling_tier1":
      header = `⚠️ ENGINE IDLING ALERT — ${companyName}`;
      bodyDetail =
        `Status: Engine ON & Parked (Speed ${Math.round(speedKmh ?? 0)} km/h)\n` +
        `Idle Duration: ${idleMinutes} min\n` +
        `Fuel Burned: ${wastedLiters.toFixed(1)} L (~${wastedMad.toFixed(0)} MAD wasted)`;
      break;
    case "idling_tier2":
      header = `🚨 CRITICAL ESCALATION: PROLONGED IDLING — ${companyName}`;
      bodyDetail =
        `Status: Ignition ON while stopped for ${idleMinutes} min!\n` +
        `Estimated Fuel Wasted: ${wastedLiters.toFixed(1)} L (${wastedMad.toFixed(0)} MAD)\n` +
        `Action: Manager intervention requested immediately.`;
      break;
    case "idling_resolved":
      header = `✅ IDLING RESOLVED — ${companyName}`;
      bodyDetail =
        `Truck is back in motion or engine turned OFF.\n` +
        `Previous Idle Session: ${idleMinutes} min (${wastedLiters.toFixed(1)} L / ${wastedMad.toFixed(0)} MAD)`;
      break;
    case "overspeed":
      header = `🚨 OVERSPEED ALERT — ${companyName}`;
      bodyDetail = `Recorded Speed: ${Math.round(speedKmh ?? 0)} km/h (Exceeded corridor limit)`;
      break;
    case "fuel_drop":
      header = `🛑 SUDDEN FUEL DROP / POSSIBLE THEFT — ${companyName}`;
      bodyDetail =
        `Fuel Tank Drop: -${(fuelDropLiters ?? 0).toFixed(1)} L while stopped (${Math.round(speedKmh ?? 0)} km/h)`;
      break;
    case "test_alert":
      header = `🧪 TEST GPS IDLING ALERT — ${companyName}`;
      bodyDetail =
        `Simulated Engine ON & Parked for ${idleMinutes} min\n` +
        `Simulated Waste: ${wastedLiters.toFixed(1)} L (~${wastedMad.toFixed(0)} MAD)`;
      break;
  }

  const lines = [
    header,
    `Truck: ${truckCode}${plate ? ` (${plate})` : ""}`,
    driverName
      ? `Driver: ${driverName}${driverPhone ? ` • ${driverPhone}` : ""}`
      : null,
    bodyDetail,
    mapsLink ? `📍 Google Maps: ${mapsLink}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}

export async function insertAlertLogRow(
  row: Omit<GpsAlertLogRow, "id" | "created_at">
): Promise<GpsAlertLogRow | null> {
  const { url } = getSupabaseRestConfig();
  try {
    const res = await fetch(`${url}/rest/v1/gps_alert_logs`, {
      method: "POST",
      headers: supabaseHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify([row]),
    });
    if (!res.ok) return null;
    const inserted = await res.json().catch(() => []);
    return Array.isArray(inserted) && inserted[0] ? inserted[0] : null;
  } catch {
    return null;
  }
}

export async function dispatchInstanceAlert(params: {
  instanceSlug: string;
  companyName: string;
  gpsConfig: GpsAlertsConfig;
  globalConfig: Partial<PlatformSystemConfig>;
  deviceImei: string;
  truckCode: string;
  plate?: string;
  driverName?: string;
  driverPhone?: string;
  kind: AlertKind;
  severity: "warning" | "critical" | "info" | "success";
  idleMinutes: number;
  wastedLiters: number;
  wastedMad: number;
  speedKmh?: number;
  fuelDropLiters?: number;
  lat?: number | null;
  lng?: number | null;
  forceChannel?: "telegram" | "whatsapp" | "both";
}): Promise<{
  channel: string;
  deliveryStatus: "sent" | "partial" | "failed" | "skipped";
  deliveryDetail: string;
  messageText: string;
  telegramResult: { ok: boolean; detail: string } | null;
  whatsappResult: { ok: boolean; detail: string } | null;
  logRow: GpsAlertLogRow | null;
}> {
  const cfg = { ...DEFAULT_GPS_ALERTS_CONFIG, ...params.gpsConfig };
  const messageText = buildAlertMessage({
    kind: params.kind,
    companyName: params.companyName,
    truckCode: params.truckCode,
    plate: params.plate,
    driverName: params.driverName,
    driverPhone: params.driverPhone,
    idleMinutes: params.idleMinutes,
    wastedLiters: params.wastedLiters,
    wastedMad: params.wastedMad,
    speedKmh: params.speedKmh,
    fuelDropLiters: params.fuelDropLiters,
    lat: params.lat,
    lng: params.lng,
  });

  const shouldTelegram =
    params.forceChannel === "telegram" ||
    params.forceChannel === "both" ||
    (!params.forceChannel && cfg.telegramEnabled);
  const shouldWhatsapp =
    params.forceChannel === "whatsapp" ||
    params.forceChannel === "both" ||
    (!params.forceChannel && cfg.whatsappEnabled);

  const isTier2OrCritical =
    params.kind === "idling_tier2" || params.kind === "fuel_drop";

  let telegramResult: { ok: boolean; detail: string } | null = null;
  let whatsappResult: { ok: boolean; detail: string } | null = null;

  // 1. Telegram Delivery
  if (shouldTelegram) {
    const botToken = (
      cfg.telegramCustomBotToken ||
      params.globalConfig.centralTelegramBotToken ||
      process.env.TELEGRAM_BOT_TOKEN ||
      ""
    ).trim();

    const chatTargets = new Set<string>();
    if (cfg.telegramChatId?.trim()) chatTargets.add(cfg.telegramChatId.trim());
    if (isTier2OrCritical && cfg.telegramManagerChatId?.trim()) {
      chatTargets.add(cfg.telegramManagerChatId.trim());
    }

    if (chatTargets.size === 0 || !botToken) {
      telegramResult = {
        ok: false,
        detail: !botToken
          ? "Telegram Bot Token not configured (set Central Bot Token in Admin -> Cloud & Security or custom token here)."
          : "Telegram Chat ID is empty.",
      };
    } else {
      const results = await Promise.all(
        Array.from(chatTargets).map((chatId) =>
          sendTelegramAlert({
            botToken,
            chatId,
            text: messageText,
            lat: params.lat,
            lng: params.lng,
          })
        )
      );
      const anyOk = results.some((r) => r.ok);
      telegramResult = {
        ok: anyOk,
        detail: results.map((r) => r.detail).join(" | "),
      };
    }
  }

  // 2. Meta WhatsApp Cloud API Delivery
  if (shouldWhatsapp) {
    const phoneNumberId = (
      cfg.whatsappCustomPhoneNumberId ||
      params.globalConfig.centralWhatsappPhoneNumberId ||
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      ""
    ).trim();
    const accessToken = (
      cfg.whatsappCustomAccessToken ||
      params.globalConfig.centralWhatsappAccessToken ||
      process.env.WHATSAPP_ACCESS_TOKEN ||
      ""
    ).trim();

    const phoneTargets = new Set<string>();
    const dispNorm = normalizeMoroccoPhone(cfg.whatsappDispatcherPhone || "");
    if (dispNorm) phoneTargets.add(dispNorm);
    if (isTier2OrCritical) {
      const mgrNorm = normalizeMoroccoPhone(cfg.whatsappManagerPhone || "");
      if (mgrNorm) phoneTargets.add(mgrNorm);
    }

    if (!phoneNumberId || !accessToken || phoneTargets.size === 0) {
      whatsappResult = {
        ok: false,
        detail:
          phoneTargets.size === 0
            ? "WhatsApp Dispatcher Phone is empty."
            : "Meta WhatsApp Phone Number ID or Access Token not configured.",
      };
    } else {
      const results = await Promise.all(
        Array.from(phoneTargets).map((toPhone) =>
          sendWhatsAppCloudAlert({
            phoneNumberId,
            accessToken,
            toPhone,
            text: messageText,
            templateName: cfg.whatsappTemplateName,
          })
        )
      );
      const anyOk = results.some((r) => r.ok);
      whatsappResult = {
        ok: anyOk,
        detail: results.map((r) => r.detail).join(" | "),
      };
    }
  }

  const channelsUsed = [
    telegramResult ? "telegram" : null,
    whatsappResult ? "whatsapp" : null,
  ].filter(Boolean);
  const channel = channelsUsed.join("+") || "none";

  const okCount = [telegramResult?.ok, whatsappResult?.ok].filter(
    (v) => v === true
  ).length;
  const attemptedCount = [telegramResult, whatsappResult].filter(Boolean).length;

  let deliveryStatus: "sent" | "partial" | "failed" | "skipped" = "skipped";
  if (attemptedCount === 0) {
    deliveryStatus = "skipped";
  } else if (okCount === attemptedCount) {
    deliveryStatus = "sent";
  } else if (okCount > 0) {
    deliveryStatus = "partial";
  } else {
    deliveryStatus = "failed";
  }

  const deliveryDetail = [
    telegramResult ? `[Telegram] ${telegramResult.detail}` : null,
    whatsappResult ? `[WhatsApp] ${whatsappResult.detail}` : null,
  ]
    .filter(Boolean)
    .join(" || ");

  const logRow = await insertAlertLogRow({
    instance_slug: params.instanceSlug,
    device_imei: params.deviceImei,
    truck_code: params.truckCode,
    driver_name: params.driverName || null,
    alert_type: params.kind,
    severity: params.severity,
    idle_minutes: Math.round(params.idleMinutes),
    wasted_fuel_liters: Math.round(params.wastedLiters * 100) / 100,
    wasted_fuel_mad: Math.round(params.wastedMad * 100) / 100,
    latitude: params.lat ?? null,
    longitude: params.lng ?? null,
    channel,
    delivery_status: deliveryStatus,
    delivery_detail: deliveryDetail || "No channels enabled",
    message_text: messageText,
    acknowledged: false,
  });

  return {
    channel,
    deliveryStatus,
    deliveryDetail,
    messageText,
    telegramResult,
    whatsappResult,
    logRow,
  };
}

export function getEffectiveFuelPriceMad(instance?: ClientDemoInstance | null) {
  return instance?.fuelPriceMad ?? DIESEL_PRICE_MAD_PER_LITER;
}
