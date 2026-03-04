import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (!user) throw redirect(303, '/login');

  // Verify manager/admin role
  const { data: appUser } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!appUser || !['manager', 'director', 'admin'].includes(appUser.role)) {
    throw redirect(303, '/dashboard');
  }

  // Get the employee
  const { data: employee } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', params.user_id)
    .single();

  if (!employee) {
    throw error(404, 'Employee not found');
  }

  return {
    employee,
    reviews: []
  };
};

export const actions: Actions = {
  generate: async ({ params, request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });
    return fail(501, { error: 'Review generation not configured yet' });
  },

  save: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });
    return fail(501, { error: 'Review saving not configured yet' });
  }
};
