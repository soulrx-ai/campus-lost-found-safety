import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type StaffDashboardMetric = {
  key: "items" | "claims" | "handovers" | "safety" | "tickets";
  count: number | null;
  error: string | null;
};

export async function loadStaffDashboard(
  supabase: Pick<SupabaseClient<Database>, "from">
): Promise<StaffDashboardMetric[]> {
  const results = await Promise.all([
    supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING_REVIEW"),
    supabase
      .from("claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING_REVIEW"),
    supabase
      .from("claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "APPROVED"),
    supabase
      .from("security_incidents")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING_REVIEW"),
    supabase
      .from("service_tickets")
      .select("id", { count: "exact", head: true })
      .in("status", ["OPEN", "IN_PROGRESS"]),
  ]);

  const keys: StaffDashboardMetric["key"][] = [
    "items",
    "claims",
    "handovers",
    "safety",
    "tickets",
  ];

  return results.map((result, index) => ({
    key: keys[index],
    count: result.error || result.count === null ? null : result.count,
    error:
      result.error?.message ??
      (result.count === null ? "Count unavailable." : null),
  }));
}
