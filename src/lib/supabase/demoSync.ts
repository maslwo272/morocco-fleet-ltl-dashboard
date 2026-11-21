import { ClientDemoInstance } from "./database";

const DEFAULT_SB_URL = "https://qosfrncehxnpxtrajpeo.supabase.co";
const DEFAULT_SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvc2ZybmNlaHhucHh0cmFqcGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyOTI1MTQsImV4cCI6MjExMDg2ODUxNH0.d8mVqTzzSz3Sgb1HHPPPGtEc_c7-vCjVA7OYoxJK6fM";

function resolveCredentials(supabaseUrl?: string, supabaseAnonKey?: string) {
  const cleanUrl = (
    !supabaseUrl || supabaseUrl.includes("atlaslogix-maroc.supabase.co")
      ? DEFAULT_SB_URL
      : supabaseUrl
  )
    .trim()
    .replace(/\/+$/, "");
  const cleanKey = (supabaseAnonKey || DEFAULT_SB_KEY).trim();
  return { cleanUrl, cleanKey };
}

/**
 * Upsert all Client Demo Instances (including per-instance trucks, fuel, shipments, drivers, and themes)
 * to Supabase PostgreSQL public.demo_instances.
 */
export async function syncDemoInstancesToSupabase(
  supabaseUrl: string,
  supabaseAnonKey: string,
  instances: ClientDemoInstance[]
): Promise<{ ok: boolean; message: string }> {
  const { cleanUrl, cleanKey } = resolveCredentials(supabaseUrl, supabaseAnonKey);

  try {
    const rows = instances.map((inst) => ({
      slug: inst.slug,
      payload: inst,
      updated_at: new Date().toISOString(),
    }));

    const res = await fetch(
      `${cleanUrl}/rest/v1/demo_instances?on_conflict=slug`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cleanKey,
          Authorization: `Bearer ${cleanKey}`,
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(rows),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        ok: false,
        message: `Supabase HTTP ${res.status}: ${errText || "Failed to upsert demo_instances"}`,
      };
    }

    return {
      ok: true,
      message: `Saved ${instances.length} instances to Supabase PostgreSQL (${new Date().toLocaleTimeString()}).`,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || "Network error connecting to Supabase REST endpoint.",
    };
  }
}

export async function deleteDemoInstanceFromSupabase(
  supabaseUrl: string,
  supabaseAnonKey: string,
  slug: string
): Promise<boolean> {
  const { cleanUrl, cleanKey } = resolveCredentials(supabaseUrl, supabaseAnonKey);
  try {
    const res = await fetch(
      `${cleanUrl}/rest/v1/demo_instances?slug=eq.${encodeURIComponent(slug)}`,
      {
        method: "DELETE",
        headers: {
          apikey: cleanKey,
          Authorization: `Bearer ${cleanKey}`,
        },
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchDemoInstancesFromSupabase(
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<ClientDemoInstance[] | null> {
  const { cleanUrl, cleanKey } = resolveCredentials(supabaseUrl, supabaseAnonKey);

  try {
    const res = await fetch(
      `${cleanUrl}/rest/v1/demo_instances?select=slug,payload&order=updated_at.desc`,
      {
        method: "GET",
        headers: {
          apikey: cleanKey,
          Authorization: `Bearer ${cleanKey}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    return rows
      .map((r: any) => r?.payload as ClientDemoInstance)
      .filter((x) => x && typeof x.slug === "string");
  } catch {
    return null;
  }
}

/**
 * Persist and load global workspace & admin configuration in public.platform_settings
 */
export async function syncWorkspaceSettingsToSupabase(
  supabaseUrl: string,
  supabaseAnonKey: string,
  workspacePayload: Record<string, any>
): Promise<{ ok: boolean; timestamp: string }> {
  const { cleanUrl, cleanKey } = resolveCredentials(supabaseUrl, supabaseAnonKey);
  const nowIso = new Date().toISOString();

  try {
    const res = await fetch(
      `${cleanUrl}/rest/v1/platform_settings?on_conflict=id`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cleanKey,
          Authorization: `Bearer ${cleanKey}`,
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify([
          {
            id: "global_workspace",
            payload: workspacePayload,
            updated_at: nowIso,
          },
        ]),
      }
    );
    return {
      ok: res.ok,
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch {
    return { ok: false, timestamp: new Date().toLocaleTimeString() };
  }
}

export async function fetchWorkspaceSettingsFromSupabase(
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<Record<string, any> | null> {
  const { cleanUrl, cleanKey } = resolveCredentials(supabaseUrl, supabaseAnonKey);

  try {
    const res = await fetch(
      `${cleanUrl}/rest/v1/platform_settings?id=eq.global_workspace&select=payload`,
      {
        method: "GET",
        headers: {
          apikey: cleanKey,
          Authorization: `Bearer ${cleanKey}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return rows[0]?.payload || null;
  } catch {
    return null;
  }
}
