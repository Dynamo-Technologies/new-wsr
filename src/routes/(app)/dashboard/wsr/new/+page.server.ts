import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (!user) throw redirect(303, '/login');

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  return {
    projects: projects ?? []
  };
};

export const actions: Actions = {
  default: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();

    const data = {
      user_id: user.id,
      project_id: formData.get('project_id') as string,
      week_ending: formData.get('week_ending') as string,
      report_type: formData.get('report_type') as string,
      accomplishments: formData.get('accomplishments') as string,
      blockers: formData.get('blockers') as string,
      this_week: formData.get('this_week') as string,
      next_week: formData.get('next_week') as string,
      hours_narrative: formData.get('hours_narrative') as string,
      work_type_tags: formData.getAll('work_type_tags') as string[]
    };

    // Validate required fields
    if (!data.project_id || !data.week_ending || !data.report_type) {
      return fail(400, { error: 'Project, week ending, and report type are required' });
    }

    const { data: inserted, error } = await supabase
      .from('weekly_status_reports')
      .insert(data)
      .select('id')
      .single();

    if (error) {
      return fail(500, { error: error.message });
    }

    throw redirect(303, `/dashboard?submitted=true`);
  }
};
