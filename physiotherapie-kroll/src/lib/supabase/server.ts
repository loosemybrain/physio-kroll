import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Erstellt einen Supabase-Client für SSR/App Router mit Next.js-Cookie-Integration.
 * Auth-State wird automatisch über next/headers-cookies gemanagt.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (e) {
            // setAll aufgerufen aus z.B. Server Component → ignorierbar
          }
        },
      },
    }
  );
}

/**
 * Legacy-Export für Service-Role-Client (umgeht RLS!).
 * Für Admin-Tasks – NICHT für Endnutzer-Interaktion verwenden.
 */
export async function getSupabaseAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn(
      "Supabase server environment variables are not set. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
