import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Check if user exists in our users table; create if not
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', data.session.user.id)
        .single();

      if (!existingUser) {
        // Create user record from Azure AD data
        const azureUser = data.session.user;
        const fullName =
          azureUser.user_metadata?.full_name ||
          azureUser.user_metadata?.name ||
          azureUser.email?.split('@')[0] ||
          'Unknown';

        await supabase.from('users').insert({
          id: azureUser.id,
          email: azureUser.email ?? '',
          full_name: fullName,
          azure_id: azureUser.user_metadata?.provider_id ?? azureUser.id,
          role: 'employee', // Default role; admin can change
          is_active: true
        });
      }

      // Redirect based on role
      const role = existingUser?.role ?? 'employee';
      let redirectTo = '/dashboard';
      if (role === 'admin') redirectTo = '/admin';
      else if (['manager', 'director', 'vp'].includes(role)) redirectTo = '/manager';

      throw redirect(303, next !== '/dashboard' ? next : redirectTo);
    }
  }

  // Auth error - redirect to login with error
  throw redirect(303, '/login?error=auth_callback_failed');
};
