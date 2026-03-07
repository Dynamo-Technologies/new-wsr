import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseBrowserClient(): SupabaseClient {
  return createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
}

export function createSupabaseServerClient(
  cookies: {
    getAll: () => { name: string; value: string }[];
    setAll: (cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) => void;
  }
): SupabaseClient {
  return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, { cookies });
}

export { isBrowser };
