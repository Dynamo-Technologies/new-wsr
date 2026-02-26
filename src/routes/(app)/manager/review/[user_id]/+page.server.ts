import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DEMO_USERS, DEMO_REVIEWS, DEMO_USER_ID } from '$lib/demo/data';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession, isDemoMode } }) => {
  const { user } = await safeGetSession();
  if (!user) throw redirect(303, '/login');

  if (isDemoMode) {
    const employee = DEMO_USERS.find(u => u.id === params.user_id);
    if (!employee) throw error(404, 'Employee not found');
    const reviews = DEMO_REVIEWS.filter(r => r.user_id === params.user_id);
    return { employee, reviews };
  }

  // Verify manager role
  const { data: appUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!appUser || !['manager', 'director', 'vp', 'admin'].includes(appUser.role)) {
    throw redirect(303, '/dashboard');
  }

  // Get the employee
  const { data: employee } = await supabase
    .from('users')
    .select('id, full_name, email, role, default_manager_id')
    .eq('id', params.user_id)
    .single();

  if (!employee) {
    throw error(404, 'Employee not found');
  }

  // Get existing quarterly reviews for this employee
  const { data: reviews } = await supabase
    .from('quarterly_reviews')
    .select('id, quarter, status, ai_summary, manager_notes, start_date, end_date, created_at')
    .eq('user_id', params.user_id)
    .order('created_at', { ascending: false });

  return {
    employee,
    reviews: reviews ?? []
  };
};

export const actions: Actions = {
  generate: async ({ params, request, locals: { supabase, safeGetSession, isDemoMode } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const quarter = formData.get('quarter') as string;
    const startDate = formData.get('start_date') as string;
    const endDate = formData.get('end_date') as string;

    if (!quarter || !startDate || !endDate) {
      return fail(400, { error: 'Quarter, start date, and end date are required' });
    }

    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 2000));
      return { success: true, reviewId: 'ff000001' };
    }

    const { data, error: fnError } = await supabase.functions.invoke('generate-quarterly-review', {
      body: {
        user_id: params.user_id,
        manager_id: user.id,
        quarter,
        start_date: startDate,
        end_date: endDate
      }
    });

    if (fnError) {
      return fail(500, { error: `Generation failed: ${fnError.message}` });
    }

    return { success: true, reviewId: data?.review_id };
  },

  save: async ({ request, locals: { supabase, safeGetSession, isDemoMode } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const reviewId = formData.get('review_id') as string;
    const managerNotes = formData.get('manager_notes') as string;
    const status = formData.get('status') as string;

    if (isDemoMode) return { success: true };

    const { error } = await supabase
      .from('quarterly_reviews')
      .update({
        manager_notes: managerNotes,
        status: status ?? 'draft',
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .eq('manager_id', user.id);

    if (error) {
      return fail(500, { error: error.message });
    }

    return { success: true };
  }
};
