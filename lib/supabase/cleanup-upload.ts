import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Storage and database writes cannot share a transaction. Never hide a failed compensation.
export async function cleanupUpload(client: SupabaseClient<Database>, bucket: string, path: string) {
  try {
    const { error } = await client.storage.from(bucket).remove([path]);
    return !error;
  } catch {
    return false;
  }
}
