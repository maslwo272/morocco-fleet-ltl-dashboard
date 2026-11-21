import { ClientDemoInstance } from "./database";

/**
 * Hybrid Supabase REST + LocalStorage sync for Ibrahim's Client Demo Instances.
 * Works with any NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (including keys entered dynamically in the GUI Configuration Studio).
 */
export async function syncDemoInstancesToSupabase(
  supabaseUrl: string,
  supabaseAnonKey: string,
  instances: ClientDemoInstance[]
): Promise<{ ok: boolean; message: string }> {
  const cleanUrl = supabaseUrl.trim().replace(/\/+$/, "");
  const cleanKey = supabaseAnonKey.trim();

  if (!cleanUrl || !cleanKey || cleanUrl.includes("atlaslogix-maroc.supabase.co")) {
    return {
      ok: false,
      message: "Local Sandbox active (enter live Supabase URL & Anon Key to sync to cloud).",
    };
  }

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
      return {
        ok: false,
        message: `Supabase HTTP ${res.status}: Ensure public.demo_instances table is created via schema.sql.`,
      };
    }

    return {
      ok: true,
      message: `Synced ${instances.length} demo instances to Supabase PostgreSQL.`,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || "Network error connecting to Supabase REST endpoint.",
    };
  }
}

export async function fetchDemoInstancesFromSupabase(
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<ClientDemoInstance[] | null> {
  const cleanUrl = supabaseUrl.trim().replace(/\/+$/, "");
  const cleanKey = supabaseAnonKey.trim();

  if (!cleanUrl || !cleanKey || cleanUrl.includes("atlaslogix-maroc.supabase.co")) {
    return null;
  }

  try {
    const res = await fetch(
      `${cleanUrl}/rest/v1/demo_instances?select=slug,payload&order=updated_at.desc`,
      {
        method: "GET",
        headers: {
          apikey: cleanKey,
          Authorization: `Bearer ${cleanKey}`,
        },
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
