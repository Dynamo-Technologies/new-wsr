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

    // Shared fields
    const week_ending = formData.get('week_ending') as string;
    const report_type = formData.get('report_type') as string;
    const blockers = formData.get('blockers') as string;
    const next_week = formData.get('next_week') as string;
    const work_type_tags = formData.getAll('work_type_tags') as string[];

    if (!week_ending || !report_type) {
      return fail(400, { error: 'Week ending and report type are required' });
    }

    // Parse project entries
    const entryCount = parseInt(formData.get('entry_count') as string, 10) || 1;
    const entries = [];
    const seenProjects = new Set<string>();

    for (let i = 0; i < entryCount; i++) {
      const project_id = formData.get(`project_id_${i}`) as string;
      const hoursRaw = formData.get(`hours_${i}`) as string;
      const hours = parseFloat(hoursRaw);
      const description = formData.get(`description_${i}`) as string;

      if (!project_id) {
        return fail(400, { error: `Entry ${i + 1}: Please select a project` });
      }
      if (!description?.trim()) {
        return fail(400, { error: `Entry ${i + 1}: Please describe the work you did` });
      }
      if (isNaN(hours) || hours < 0 || hours > 168) {
        return fail(400, { error: `Entry ${i + 1}: Hours must be between 0 and 168` });
      }
      if (seenProjects.has(project_id)) {
        return fail(400, { error: 'Each project can only appear once per report' });
      }
      seenProjects.add(project_id);

      entries.push({ project_id, hours, description });
    }

    if (entries.length === 0) {
      return fail(400, { error: 'At least one project entry is required' });
    }

    // Check for existing WSRs for these project/week combos
    const { data: existing } = await supabase
      .from('weekly_status_reports')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('week_ending', week_ending)
      .in('project_id', entries.map(e => e.project_id));

    if (existing && existing.length > 0) {
      return fail(400, {
        error: `You already have a WSR for one or more of these projects for week ending ${week_ending}. Edit the existing report instead.`
      });
    }

    // Build insert rows
    const rows = entries.map(entry => ({
      user_id: user.id,
      project_id: entry.project_id,
      week_ending,
      report_type,
      accomplishments: entry.description,
      this_week: entry.description,
      blockers,
      next_week,
      hours: entry.hours,
      hours_narrative: `${entry.hours} hrs`,
      work_type_tags
    }));

    const { error } = await supabase
      .from('weekly_status_reports')
      .insert(rows);

    if (error) {
      if (error.code === '23505') {
        return fail(400, { error: 'A WSR already exists for one of these project/week combinations.' });
      }
      return fail(500, { error: error.message });
    }

    throw redirect(303, '/dashboard?submitted=true');
  }
};
