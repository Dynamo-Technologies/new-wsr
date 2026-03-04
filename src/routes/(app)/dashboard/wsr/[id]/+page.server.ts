import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (!user) throw redirect(303, '/login');

  const { data: wsr, error: wsrError } = await supabase
    .from('weekly_status_reports')
    .select(`
      *,
      user:profiles(id, full_name, email, role),
      project:projects(id, name)
    `)
    .eq('id', params.id)
    .single();

  if (wsrError || !wsr) {
    throw error(404, 'WSR not found');
  }

  // Check access: own WSR or admin
  const { data: appUser } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isOwner = wsr.user_id === user.id;
  const isManagerOrAdmin = ['manager', 'director', 'admin'].includes(appUser?.role ?? '');

  if (!isOwner && !isManagerOrAdmin) {
    throw error(403, 'Access denied');
  }

  // Load projects for edit form
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  return {
    wsr,
    tags: [],
    projects: projects ?? [],
    canEdit: isOwner,
    isManagerView: isManagerOrAdmin && !isOwner
  };
};

export const actions: Actions = {
  update: async ({ params, request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();

    // Verify ownership
    const { data: existing } = await supabase
      .from('weekly_status_reports')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return fail(403, { error: 'Not authorized to edit this WSR' });
    }

    const updates = {
      accomplishments: formData.get('accomplishments') as string,
      blockers: formData.get('blockers') as string,
      this_week: formData.get('this_week') as string,
      next_week: formData.get('next_week') as string,
      hours_narrative: formData.get('hours_narrative') as string,
      work_type_tags: formData.getAll('work_type_tags') as string[]
    };

    const { error: updateError } = await supabase
      .from('weekly_status_reports')
      .update(updates)
      .eq('id', params.id);

    if (updateError) {
      return fail(500, { error: updateError.message });
    }

    return { success: true };
  },

  delete: async ({ params, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const { data: existing } = await supabase
      .from('weekly_status_reports')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return fail(403, { error: 'Not authorized to delete this WSR' });
    }

    await supabase.from('weekly_status_reports').delete().eq('id', params.id);

    throw redirect(303, '/dashboard');
  }
};
