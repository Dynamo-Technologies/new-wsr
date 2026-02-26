import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { DEMO_USER } from '$lib/demo/data';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase, isDemoMode } }) => {
  const { session, user } = await safeGetSession();

  if (!session || !user) {
    throw redirect(303, '/login');
  }

  // Demo mode — return the hardcoded demo user
  if (isDemoMode) {
    return { session, appUser: DEMO_USER };
  }

  const { data: appUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!appUser) {
    throw redirect(303, '/login');
  }

  return { session, appUser };
};
