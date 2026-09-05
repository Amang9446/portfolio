import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "./config";

// Cookie-free anon client for PUBLIC reads (posts, projects, site settings).
// The cookie-bound server client (./server) calls cookies(), which opts the
// whole route out of static rendering/ISR — never use it for public pages.
let client: ReturnType<typeof createSupabaseClient> | null = null;

export function createPublicClient() {
  if (!client) {
    client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
