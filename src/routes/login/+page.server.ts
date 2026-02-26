import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

const DEMO_EMAIL = 'admin.one@dynamo.works';
const DEMO_PASSWORD = 'password';

export const actions: Actions = {
  demo: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = (data.get('email') as string ?? '').trim().toLowerCase();
    const password = data.get('password') as string ?? '';

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      cookies.set('demo_auth', 'true', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      });
      throw redirect(303, '/dashboard');
    }

    return fail(401, { error: 'Invalid email or password. Try admin.one@dynamo.works / password' });
  }
};
