import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  DEMO_PROJECTS, DEMO_USERS, DEMO_TAGS, DEMO_SYNC_LOGS, DEMO_OVERRIDES
} from '$lib/demo/data';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession, isDemoMode } }) => {
  const { user } = await safeGetSession();
  if (!user) throw redirect(303, '/login');

  if (isDemoMode) {
    return {
      projects: DEMO_PROJECTS,
      users: DEMO_USERS,
      tags: DEMO_TAGS,
      syncLogs: DEMO_SYNC_LOGS,
      overrides: DEMO_OVERRIDES
    };
  }

  // Verify admin role
  const { data: appUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!appUser || appUser.role !== 'admin') {
    throw redirect(303, '/dashboard');
  }

  // Load all data in parallel
  const [projectsResult, usersResult, tagsResult, syncLogsResult, overridesResult] = await Promise.all([
    supabase
      .from('projects')
      .select(`id, name, contract_number, client_agency, project_type, is_active, start_date, end_date, created_at,
        program_manager:users(id, full_name)`)
      .order('name'),
    supabase
      .from('users')
      .select('id, full_name, email, role, is_active, default_manager_id, created_at')
      .order('full_name'),
    supabase
      .from('work_type_tags')
      .select('id, name, category, description')
      .order('category')
      .order('name'),
    supabase
      .from('lattice_sync_log')
      .select('*')
      .order('sync_date', { ascending: false })
      .limit(10),
    supabase
      .from('manager_overrides')
      .select(`
        id, reason, created_at,
        user:users!manager_overrides_user_id_fkey(id, full_name),
        project:projects(id, name),
        override_manager:users!manager_overrides_override_manager_id_fkey(id, full_name)
      `)
      .order('created_at', { ascending: false })
  ]);

  return {
    projects: projectsResult.data ?? [],
    users: usersResult.data ?? [],
    tags: tagsResult.data ?? [],
    syncLogs: syncLogsResult.data ?? [],
    overrides: overridesResult.data ?? []
  };
};

export const actions: Actions = {
  // ─── Projects ────────────────────────────────────────────────
  createProject: async ({ request, locals: { supabase, safeGetSession, isDemoMode } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });
    if (isDemoMode) return { success: true, action: 'createProject' };

    const f = await request.formData();
    const { error } = await supabase.from('projects').insert({
      name: f.get('name') as string,
      contract_number: f.get('contract_number') as string || null,
      client_agency: f.get('client_agency') as string || null,
      project_type: f.get('project_type') as string || null,
      start_date: f.get('start_date') as string || null,
      end_date: f.get('end_date') as string || null,
      program_manager_id: f.get('program_manager_id') as string || null,
      is_active: true
    });
    if (error) return fail(500, { error: error.message });
    return { success: true, action: 'createProject' };
  },

  updateProject: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const f = await request.formData();
    const id = f.get('id') as string;
    const { error } = await supabase.from('projects').update({
      name: f.get('name') as string,
      contract_number: f.get('contract_number') as string || null,
      client_agency: f.get('client_agency') as string || null,
      project_type: f.get('project_type') as string || null,
      start_date: f.get('start_date') as string || null,
      end_date: f.get('end_date') as string || null,
      program_manager_id: f.get('program_manager_id') as string || null,
      is_active: f.get('is_active') === 'true'
    }).eq('id', id);
    if (error) return fail(500, { error: error.message });
    return { success: true, action: 'updateProject' };
  },

  // ─── Users ────────────────────────────────────────────────────
  updateUser: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const f = await request.formData();
    const id = f.get('id') as string;
    const { error } = await supabase.from('users').update({
      role: f.get('role') as string,
      default_manager_id: f.get('default_manager_id') as string || null,
      is_active: f.get('is_active') === 'true'
    }).eq('id', id);
    if (error) return fail(500, { error: error.message });
    return { success: true, action: 'updateUser' };
  },

  // ─── Work Type Tags ────────────────────────────────────────────
  createTag: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const f = await request.formData();
    const { error } = await supabase.from('work_type_tags').insert({
      name: f.get('name') as string,
      category: f.get('category') as string,
      description: f.get('description') as string || null
    });
    if (error) return fail(500, { error: error.message });
    return { success: true, action: 'createTag' };
  },

  deleteTag: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const f = await request.formData();
    const id = f.get('id') as string;
    const { error } = await supabase.from('work_type_tags').delete().eq('id', id);
    if (error) return fail(500, { error: error.message });
    return { success: true, action: 'deleteTag' };
  },

  // ─── Manager Overrides ────────────────────────────────────────
  createOverride: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const f = await request.formData();
    const { error } = await supabase.from('manager_overrides').insert({
      user_id: f.get('user_id') as string,
      project_id: f.get('project_id') as string,
      override_manager_id: f.get('override_manager_id') as string,
      reason: f.get('reason') as string || null,
      created_by: user.id
    });
    if (error) return fail(500, { error: error.message });
    return { success: true, action: 'createOverride' };
  },

  deleteOverride: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const f = await request.formData();
    await supabase.from('manager_overrides').delete().eq('id', f.get('id') as string);
    return { success: true, action: 'deleteOverride' };
  },

  // ─── Lattice Sync ─────────────────────────────────────────────
  triggerSync: async ({ locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const { data, error } = await supabase.functions.invoke('lattice-sync', {
      body: { triggered_by: user.id }
    });

    if (error) return fail(500, { error: `Sync failed: ${error.message}` });
    return { success: true, action: 'triggerSync', result: data };
  }
};
