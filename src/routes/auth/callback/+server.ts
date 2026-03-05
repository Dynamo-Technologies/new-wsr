import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ADMIN_EMAILS } from '$lib/config';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const authUser = data.session.user;
      const email = authUser.email ?? '';

      const fullName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        email.split('@')[0] ||
        'Unknown';

      // Determine role based on ADMIN_EMAILS and project PM assignments
      const isAdminEmail = ADMIN_EMAILS.includes(email);

      // Check if this user is a PM on any active project
      const { data: pmProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('pm_email', email)
        .eq('is_active', true)
        .limit(1);
      const isPM = (pmProjects?.length ?? 0) > 0;

      // Resolve role: admin > manager > existing > employee
      function resolveRole(currentRole?: string): string {
        if (isAdminEmail) return 'admin';
        if (isPM && (!currentRole || currentRole === 'employee')) return 'manager';
        return currentRole ?? 'employee';
      }

      // Check if profile already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', authUser.id)
        .single();

      if (!existing) {
        // First login — create profile
        await supabase.from('profiles').insert({
          id: authUser.id,
          email,
          full_name: fullName,
          role: resolveRole()
        });
      } else {
        // Returning user — update name and sync role
        const newRole = resolveRole(existing.role);
        const updates: Record<string, string> = { full_name: fullName };
        if (newRole !== existing.role) {
          updates.role = newRole;
        }
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', authUser.id);
      }

      throw redirect(303, next);
    }
  }

  // Auth error - redirect to login with error
  throw redirect(303, '/login?error=auth_callback_failed');
};
