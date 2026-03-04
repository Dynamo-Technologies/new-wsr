import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const authUser = data.session.user;

      // Ensure profile exists (upsert so it's safe to call every login)
      const fullName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'Unknown';

      await supabase.from('profiles').upsert({
        id: authUser.id,
        email: authUser.email ?? '',
        full_name: fullName
      }, { onConflict: 'id', ignoreDuplicates: true });

      throw redirect(303, next);
    }
  }

  // Auth error - redirect to login with error
  throw redirect(303, '/login?error=auth_callback_failed');
};
