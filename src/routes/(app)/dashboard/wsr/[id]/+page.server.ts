import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ALL_WSRS, DEMO_TAGS, DEMO_PROJECTS, DEMO_USER_ID } from '$lib/demo/data';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession, isDemoMode } }) => {
  const { user } = await safeGetSession();
  if (!user) throw redirect(303, '/login');

  if (isDemoMode) {
    const wsr = ALL_WSRS.find(w => w.id === params.id);
    if (!wsr) throw error(404, 'WSR not found');
    return {
      wsr,
      tags: DEMO_TAGS,
      projects: DEMO_PROJECTS,
      canEdit: wsr.user_id === DEMO_USER_ID,
      isManagerView: wsr.user_id !== DEMO_USER_ID
    };
  }

  const { data: wsr, error: wsrError } = await supabase
    .from('weekly_status_reports')
    .select(`
      *,
      user:users(id, full_name, email, role),
      project:projects(id, name, client_agency, contract_number)
    `)
    .eq('id', params.id)
    .single();

  if (wsrError || !wsr) {
    throw error(404, 'WSR not found');
  }

  // Only allow viewing own WSRs or manager can view team WSRs
  const { data: appUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isOwner = wsr.user_id === user.id;
  const isManagerOrAdmin = ['manager', 'director', 'vp', 'admin'].includes(appUser?.role ?? '');

  if (!isOwner && !isManagerOrAdmin) {
    throw error(403, 'Access denied');
  }

  // Load tags for edit form
  const { data: tags } = await supabase
    .from('work_type_tags')
    .select('id, name, category')
    .order('category')
    .order('name');

  // Load projects for edit form
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, client_agency')
    .eq('is_active', true)
    .order('name');

  return {
    wsr,
    tags: tags ?? [],
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
      work_type_tags: formData.getAll('work_type_tags') as string[],
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('weekly_status_reports')
      .update(updates)
      .eq('id', params.id);

    if (updateError) {
      return fail(500, { error: updateError.message });
    }

    // Re-generate embedding
    supabase.functions.invoke('generate-embeddings', {
      body: { wsr_id: params.id }
    });

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
