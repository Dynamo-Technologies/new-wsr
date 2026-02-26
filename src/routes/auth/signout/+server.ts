import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, locals }) => {
  // Clear demo auth cookie
  cookies.delete('demo_auth', { path: '/' });

  // Also sign out from Supabase if applicable
  if (!locals.isDemoMode) {
    await locals.supabase.auth.signOut();
  }

  throw redirect(303, '/login');
};
