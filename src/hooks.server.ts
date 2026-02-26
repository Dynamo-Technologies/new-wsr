import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const DEMO_COOKIE = 'demo_auth';
const DEMO_USER_STUB = { id: 'aa000001-0000-0000-0000-000000000001' } as any;
const DEMO_SESSION_STUB = { user: DEMO_USER_STUB } as any;

const supabaseHandle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => event.cookies.get(key),
      set: (key, value, options) => {
        event.cookies.set(key, value, { ...options, path: '/' });
      },
      remove: (key, options) => {
        event.cookies.delete(key, { ...options, path: '/' });
      }
    }
  });

  event.locals.safeGetSession = async () => {
    if (event.cookies.get(DEMO_COOKIE) === 'true') {
      return { session: DEMO_SESSION_STUB, user: DEMO_USER_STUB };
    }
    const { data: { session } } = await event.locals.supabase.auth.getSession();
    if (!session) return { session: null, user: null };
    const { data: { user }, error } = await event.locals.supabase.auth.getUser();
    if (error) return { session: null, user: null };
    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};

const authGuard: Handle = async ({ event, resolve }) => {
  const isDemoMode = event.cookies.get(DEMO_COOKIE) === 'true';
  event.locals.isDemoMode = isDemoMode;

  if (isDemoMode) {
    event.locals.session = DEMO_SESSION_STUB;
    event.locals.user = DEMO_USER_STUB;
  } else {
    const { session, user } = await event.locals.safeGetSession();
    event.locals.session = session;
    event.locals.user = user;
  }

  const protectedPaths = ['/dashboard', '/manager', '/bd', '/admin'];
  const isProtected = protectedPaths.some((p) => event.url.pathname.startsWith(p));

  if (isProtected && !event.locals.session) {
    throw redirect(303, '/login');
  }

  if (event.url.pathname === '/login' && event.locals.session) {
    throw redirect(303, '/dashboard');
  }

  return resolve(event);
};

export const handle = sequence(supabaseHandle, authGuard);
