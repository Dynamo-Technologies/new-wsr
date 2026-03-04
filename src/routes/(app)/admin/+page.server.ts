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
      .select('id, name, is_active, created_at')
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
    const { error } = await supabase.from('projects').insert({
      name: f.get('name') as string,
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
