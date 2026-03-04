import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { ADMIN_EMAILS } from '$lib/config';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
  const { session, user } = await safeGetSession();

  if (!session || !user) {
    throw redirect(303, '/login');
  }

  const { data: appUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!appUser) {
    throw redirect(303, '/login');
  }

  const isAdmin = appUser.role === 'admin' || ADMIN_EMAILS.includes(appUser.email);

  // Admins get all projects; PMs get matched projects
  let managedProjects;
  if (isAdmin) {
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    managedProjects = data ?? [];
  } else {
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .eq('pm_email', appUser.email)
      .eq('is_active', true)
      .order('name');
    managedProjects = data ?? [];
  }

  return { session, appUser, managedProjects, isAdmin };
};
