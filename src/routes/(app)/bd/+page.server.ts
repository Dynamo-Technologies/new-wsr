import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ADMIN_EMAILS } from '$lib/config';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (!user) throw redirect(303, '/login');

  // Get user profile
  const { data: appUser } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  if (!appUser) throw redirect(303, '/dashboard');

  const isAdmin = appUser.role === 'admin' || ADMIN_EMAILS.includes(appUser.email);

  // Check if user is a PM
  const { data: managedProjects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('pm_email', appUser.email)
    .eq('is_active', true)
    .order('name');

  // Must be a PM or admin to access BD page
  if (!isAdmin && (managedProjects ?? []).length === 0) {
    throw redirect(303, '/dashboard');
  }

  // PMs see only their projects, admins see all
  let projects;
  if (isAdmin) {
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    projects = data ?? [];
  } else {
    projects = managedProjects ?? [];
  }

  return {
    agencies: [],
    tags: [],
    projects
  };
};

export const actions: Actions = {
  search: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const projectId = formData.get('project_id') as string;
    const dateFrom = formData.get('date_from') as string;
    const dateTo = formData.get('date_to') as string;
    const workTags = formData.getAll('work_type_tags') as string[];
    const keyword = formData.get('keyword') as string;

    let query = supabase
      .from('weekly_status_reports')
      .select(`
        id, week_ending, report_type, accomplishments, this_week, blockers, next_week,
        work_type_tags, submitted_at,
        user:profiles(id, full_name),
        project:projects(id, name)
      `)
      .order('week_ending', { ascending: false })
      .limit(50);

    if (projectId) query = query.eq('project_id', projectId);
    if (dateFrom) query = query.gte('week_ending', dateFrom);
    if (dateTo) query = query.lte('week_ending', dateTo);
    if (workTags.length > 0) query = query.overlaps('work_type_tags', workTags);

    if (keyword) {
      query = query.or(
        `accomplishments.ilike.%${keyword}%,this_week.ilike.%${keyword}%,next_week.ilike.%${keyword}%`
      );
    }

    const { data: wsrs, error } = await query;

    if (error) {
      return fail(500, { error: error.message });
    }

    return { results: wsrs ?? [], keyword };
  },

  generatePastPerf: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const wsrIds = formData.getAll('wsr_ids') as string[];

    if (wsrIds.length === 0) {
      return fail(400, { error: 'No WSRs selected' });
    }

    // Fetch the selected WSRs with project and user info
    const { data: wsrs, error } = await supabase
      .from('weekly_status_reports')
      .select(`
        id, week_ending, accomplishments, this_week, blockers, work_type_tags,
        user:profiles(full_name),
        project:projects(name)
      `)
      .in('id', wsrIds)
      .order('week_ending');

    if (error) return fail(500, { error: error.message });
    if (!wsrs || wsrs.length === 0) return fail(400, { error: 'Selected WSRs not found' });

    const { generatePastPerformance } = await import('$lib/server/bedrock');

    try {
      const narrative = await generatePastPerformance(
        wsrs.map((w: any) => ({
          project_name: w.project?.name ?? 'Unknown',
          user_name: w.user?.full_name ?? 'Unknown',
          week_ending: w.week_ending,
          accomplishments: w.accomplishments,
          this_week: w.this_week,
          work_type_tags: w.work_type_tags ?? []
        }))
      );

      return { success: true, narrative };
    } catch (err: any) {
      console.error('Bedrock past performance error:', err);
      return fail(500, { error: `AI generation failed: ${err.message}` });
    }
  }
};
