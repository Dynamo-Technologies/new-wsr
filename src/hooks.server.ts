import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabaseHandle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key: string) => event.cookies.get(key),
      set: (key: string, value: string, options: Record<string, unknown>) => {
        event.cookies.set(key, value, { ...options, path: '/' });
      },
      remove: (key: string, options: Record<string, unknown>) => {
        event.cookies.delete(key, { ...options, path: '/' });
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

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};

const authGuard: Handle = async ({ event, resolve }) => {
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

  return resolve(event);
};

export const handle = sequence(supabaseHandle, authGuard);
