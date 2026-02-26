import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DEMO_PROJECTS, DEMO_TAGS } from '$lib/demo/data';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession, isDemoMode } }) => {
  const { user } = await safeGetSession();
  if (!user) throw redirect(303, '/login');

  if (isDemoMode) {
    return { projects: DEMO_PROJECTS, tags: DEMO_TAGS };
  }

  const [projectsResult, tagsResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, client_agency, contract_number')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('work_type_tags')
      .select('id, name, category')
      .order('category')
      .order('name')
  ]);

  return {
    projects: projectsResult.data ?? [],
    tags: tagsResult.data ?? []
  };
};

export const actions: Actions = {
  default: async ({ request, locals: { supabase, safeGetSession, isDemoMode } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });
    if (isDemoMode) throw redirect(303, '/dashboard?submitted=true');

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
      work_type_tags: formData.getAll('work_type_tags') as string[],
      submitted_at: new Date().toISOString()
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

    // Trigger embedding generation async (fire and forget)
    supabase.functions.invoke('generate-embeddings', {
      body: { wsr_id: inserted.id }
    });

    throw redirect(303, `/dashboard/wsr/${inserted.id}?submitted=true`);
  }
};
