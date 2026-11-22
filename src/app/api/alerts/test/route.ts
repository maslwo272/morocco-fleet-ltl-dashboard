import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_GPS_ALERTS_CONFIG,
  GpsAlertsConfig,
  PlatformSystemConfig,
} from "@/lib/supabase/database";
import {
  dispatchInstanceAlert,
  fetchInstanceAndGlobalSettings,
  getEffectiveFuelPriceMad,
} from "@/lib/gps/alertDispatcher";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug || "").trim();
    if (!slug) {
      return NextResponse.json(
        { ok: false, error: "Missing instance slug" },
        { status: 400 }
      );
    }

    const { instance, globalConfig } =
      await fetchInstanceAndGlobalSettings(slug);

    const mergedGlobalConfig: Partial<PlatformSystemConfig> = {
      ...globalConfig,
      ...(body.overrideCentralConfig || {}),
    };

    const gpsConfig: GpsAlertsConfig = {
      ...DEFAULT_GPS_ALERTS_CONFIG,
      ...(instance?.gpsAlertsConfig || {}),
      ...(body.overrideGpsConfig || {}),
    };

    const trucks = instance?.fleetData?.trucks || [];
    const firstTruck = trucks[0];
    const truckCode = String(body.truckCode || firstTruck?.code || "Truck 01");
    const driverName = String(
      body.driverName || firstTruck?.driverName?.en || "Test Driver"
    );
    const idleMinutes = Math.max(1, Number(body.idleMinutes) || 15);
    const burnRate =
      gpsConfig.idleFuelBurnLph ||
      mergedGlobalConfig.idleFuelBurnLitersPerHour ||
      3.5;
    const fuelPriceMad = getEffectiveFuelPriceMad(instance);
    const wastedLiters =
      Math.round(((idleMinutes / 60) * burnRate) * 100) / 100;
    const wastedMad = Math.round(wastedLiters * fuelPriceMad * 100) / 100;

    const channel = (body.channel || "both") as
      | "telegram"
      | "whatsapp"
      | "both";

    const lat = Number.isFinite(Number(body.lat))
      ? Number(body.lat)
      : firstTruck?.lat ?? 35.8844;
    const lng = Number.isFinite(Number(body.lng))
      ? Number(body.lng)
      : firstTruck?.lng ?? -5.5026;

    const res = await dispatchInstanceAlert({
      instanceSlug: slug,
      companyName:
        String(body.companyName || "") ||
        instance?.clientName?.en ||
        slug,
      gpsConfig,
      globalConfig: mergedGlobalConfig,
      deviceImei: firstTruck?.gpsDeviceImei || "TEST-IMEI-001",
      truckCode,
      plate: firstTruck?.plate,
      driverName,
      driverPhone: firstTruck ? undefined : "+212 6 00 00 00 00",
      kind: "test_alert",
      severity: "warning",
      idleMinutes,
      wastedLiters,
      wastedMad,
      speedKmh: 0,
      lat,
      lng,
      forceChannel: channel,
    });

    return NextResponse.json({
      ok: res.deliveryStatus === "sent" || res.deliveryStatus === "partial",
      deliveryStatus: res.deliveryStatus,
      deliveryDetail: res.deliveryDetail,
      telegramResult: res.telegramResult,
      whatsappResult: res.whatsappResult,
      messagePreview: res.messageText,
      logRow: res.logRow,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to send test alert" },
      { status: 500 }
    );
  }
}
