import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/', secure: false });
        });
      }
    }
  });

  event.locals.safeGetSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession();
    if (!session) return { session: null, user: null };
    const { data: { user }, error } = await event.locals.supabase.auth.getUser();
    if (error) return { session: null, user: null };
    return { session, user };
  };

  // Skip session check for the auth callback — calling getSession/getUser
  // before exchangeCodeForSession destroys the PKCE code verifier in storage
  if (event.url.pathname !== '/auth/callback') {
    const { session, user } = await event.locals.safeGetSession();
    event.locals.session = session;
    event.locals.user = user;

    const protectedPaths = ['/dashboard', '/manager', '/bd', '/admin'];
    const isProtected = protectedPaths.some((p) => event.url.pathname.startsWith(p));

    if (isProtected && !session) {
      throw redirect(303, '/login');
    }

    if (event.url.pathname === '/login' && session) {
      throw redirect(303, '/dashboard');
    }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};
