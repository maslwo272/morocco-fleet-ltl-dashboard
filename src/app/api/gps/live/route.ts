import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseRestConfig,
  supabaseHeaders,
} from "@/lib/gps/alertDispatcher";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const reqUrl = new URL(req.url);
    const slug = (reqUrl.searchParams.get("slug") || "").trim();
    if (!slug) {
      return NextResponse.json(
        { ok: false, error: "Missing slug query parameter" },
        { status: 400 }
      );
    }

    const { url } = getSupabaseRestConfig();
    const headers = supabaseHeaders();

    const [telRes, logRes] = await Promise.all([
      fetch(
        `${url}/rest/v1/gps_telemetry_latest?instance_slug=eq.${encodeURIComponent(
          slug
        )}&order=last_ping_at.desc`,
        { method: "GET", headers, cache: "no-store" }
      ),
      fetch(
        `${url}/rest/v1/gps_alert_logs?instance_slug=eq.${encodeURIComponent(
          slug
        )}&order=created_at.desc&limit=50`,
        { method: "GET", headers, cache: "no-store" }
      ),
    ]);

    const telemetry = telRes.ok ? await telRes.json().catch(() => []) : [];
    const alertLogs = logRes.ok ? await logRes.json().catch(() => []) : [];

    return NextResponse.json({
      ok: true,
      telemetry: Array.isArray(telemetry) ? telemetry : [],
      alertLogs: Array.isArray(alertLogs) ? alertLogs : [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load live GPS state" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing alert log id" },
        { status: 400 }
      );
    }

    const { url } = getSupabaseRestConfig();
    const res = await fetch(
      `${url}/rest/v1/gps_alert_logs?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders({ Prefer: "return=representation" }),
        body: JSON.stringify({ acknowledged: Boolean(body.acknowledged ?? true) }),
      }
    );

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: txt || "Failed to acknowledge alert" },
        { status: res.status }
      );
    }

    const updated = await res.json().catch(() => []);
    return NextResponse.json({
      ok: true,
      row: Array.isArray(updated) ? updated[0] : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to update alert log" },
      { status: 500 }
    );
  }
}
