import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ActivityEntry {
  actorId?: string | null;
  actorType: "user" | "system" | "ai";
  action: string;
  entityType: string;
  entityId?: string | null;
  clientId?: string | null;
  details?: Record<string, unknown>;
}

/** Appends to the activity log. Failures are reported but never block the action. */
export async function logActivity(supabase: SupabaseClient, entry: ActivityEntry | ActivityEntry[]): Promise<void> {
  const rows = (Array.isArray(entry) ? entry : [entry]).map((e) => ({
    actor_id: e.actorId ?? null,
    actor_type: e.actorType,
    action: e.action,
    entity_type: e.entityType,
    entity_id: e.entityId ?? null,
    client_id: e.clientId ?? null,
    details: e.details ?? {},
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("activity_log").insert(rows);
  if (error) console.error("activity_log insert failed", error.message);
}
