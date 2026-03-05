import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ADMIN_EMAILS } from '$lib/config';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (!user) throw redirect(303, '/login');

  // Verify admin role or admin email
  const { data: appUser } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  if (!appUser || (appUser.role !== 'admin' && !ADMIN_EMAILS.includes(appUser.email))) {
    throw redirect(303, '/dashboard');
  }

  const [projectsResult, usersResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, contract_number, start_date, end_date, program_manager_id, is_active, created_at, program_manager:profiles!program_manager_id(id, full_name)')
      .order('name'),
    supabase
      .from('profiles')
      .select('id, full_name, email, role, is_active, created_at')
      .order('full_name')
  ]);

  return {
    projects: projectsResult.data ?? [],
    users: usersResult.data ?? [],
    tags: [],
    overrides: []
  };
};

export const actions: Actions = {
  createProject: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const f = await request.formData();
    const pmId = f.get('program_manager_id') as string;
    const { error } = await supabase.from('projects').insert({
      name: f.get('name') as string,
      contract_number: (f.get('contract_number') as string) || null,
      program_manager_id: pmId || null,
      start_date: (f.get('start_date') as string) || null,
      end_date: (f.get('end_date') as string) || null,
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
    const pmId = f.get('program_manager_id') as string;
    const { error } = await supabase.from('projects').update({
      name: f.get('name') as string,
      contract_number: (f.get('contract_number') as string) || null,
      program_manager_id: pmId || null,
      start_date: (f.get('start_date') as string) || null,
      end_date: (f.get('end_date') as string) || null,
      is_active: f.get('is_active') === 'true'
    }).eq('id', id);
    if (error) return fail(500, { error: error.message });
    return { success: true, action: 'updateProject' };
  },

  updateUser: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const f = await request.formData();
    const id = f.get('id') as string;
    const { error } = await supabase.from('profiles').update({
      role: f.get('role') as string,
      is_active: f.get('is_active') === 'true'
    }).eq('id', id);
    if (error) return fail(500, { error: error.message });
    return { success: true, action: 'updateUser' };
  },

  createTag: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });
    return { success: true, action: 'createTag' };
  },

  deleteTag: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });
    return { success: true, action: 'deleteTag' };
  },

  createOverride: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });
    return { success: true, action: 'createOverride' };
  },

  deleteOverride: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });
    return { success: true, action: 'deleteOverride' };
  }
};
