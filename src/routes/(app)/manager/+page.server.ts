import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ADMIN_EMAILS } from '$lib/config';
import { getMonthRange } from '$lib/utils/dates';
import { generateMSRSummary } from '$lib/server/bedrock';
import { format, parseISO } from 'date-fns';

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

  // Check if user is a PM by matching email against projects.pm_email
  const { data: managedProjects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('pm_email', appUser.email)
    .eq('is_active', true)
    .order('name');

  const managedProjectIds = (managedProjects ?? []).map(p => p.id);

  // Must be a PM or admin to access this page
  if (!isAdmin && managedProjectIds.length === 0) {
    throw redirect(303, '/dashboard');
  }

  // Get WSRs scoped to managed projects (admins see all)
  let teamWSRs: unknown[] = [];
  let wsrQuery = supabase
    .from('weekly_status_reports')
    .select(`
      id, week_ending, report_type, accomplishments, submitted_at, work_type_tags,
      user:profiles(id, full_name),
      project:projects(id, name)
    `)
    .order('week_ending', { ascending: false })
    .limit(50);

  if (!isAdmin) {
    wsrQuery = wsrQuery.in('project_id', managedProjectIds);
  }

  const { data: wsrs } = await wsrQuery;
  teamWSRs = wsrs ?? [];

  // Get projects list (scoped for PMs, all for admins)
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

  // Get unique users who submitted WSRs to these projects
  const submitterIds = [...new Set((wsrs ?? []).map((w: any) => w.user?.id).filter(Boolean))];

  // Load existing MSRs (scoped to managed projects or all for admins)
  let msrQuery = supabase
    .from('monthly_status_reports')
    .select(`
      id, month, ai_summary, human_edited_summary, wsr_ids, status, created_at,
      project:projects(id, name)
    `)
    .order('month', { ascending: false })
    .limit(20);

  if (!isAdmin) {
    msrQuery = msrQuery.in('project_id', managedProjectIds);
  }

  const { data: msrs, error: msrError } = await msrQuery;
  if (msrError) console.error('MSR load error:', msrError);

  return {
    directReports: [],
    teamIds: new Set(submitterIds),
    teamWSRs,
    projects,
    msrs: msrs ?? [],
    allUsers: []
  };
};

export const actions: Actions = {
  generateMSR: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const projectId = formData.get('project_id') as string;
    const month = formData.get('month') as string;

    if (!projectId || !month) {
      return fail(400, { error: 'Project and month are required' });
    }

    // Get project name for the prompt
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    if (!project) return fail(400, { error: 'Project not found' });

    // Get WSRs for the selected month
    const { start, end } = getMonthRange(month);
    const { data: wsrs } = await supabase
      .from('weekly_status_reports')
      .select(`
        id, week_ending, accomplishments, this_week, blockers, next_week, work_type_tags,
        user:profiles(full_name)
      `)
      .eq('project_id', projectId)
      .gte('week_ending', start)
      .lte('week_ending', end)
      .order('week_ending');

    if (!wsrs || wsrs.length === 0) {
      return fail(400, { error: 'No WSRs found for this project and month. Make sure team members have submitted reports.' });
    }

    // Format WSRs for the AI prompt
    const wsrInputs = wsrs.map((w: any) => ({
      user_name: w.user?.full_name ?? 'Unknown',
      week_ending: w.week_ending,
      accomplishments: w.accomplishments,
      this_week: w.this_week,
      blockers: w.blockers,
      next_week: w.next_week,
      work_type_tags: w.work_type_tags ?? []
    }));

    const monthLabel = format(parseISO(month), 'MMMM yyyy');

    try {
      const aiSummary = await generateMSRSummary(wsrInputs, {
        projectName: project.name,
        monthLabel
      });

      // Upsert MSR (unique on project_id + month)
      const { error: upsertError } = await supabase
        .from('monthly_status_reports')
        .upsert(
          {
            project_id: projectId,
            month,
            generated_by: user.id,
            ai_summary: aiSummary,
            wsr_ids: wsrs.map((w: any) => w.id),
            status: 'draft'
          },
          { onConflict: 'project_id,month' }
        );

      if (upsertError) return fail(500, { error: upsertError.message });

      return { success: true, action: 'generateMSR' };
    } catch (err: any) {
      console.error('Bedrock MSR generation error:', err);
      return fail(500, { error: `AI generation failed: ${err.message}` });
    }
  },

  saveMSR: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const msrId = formData.get('msr_id') as string;
    const humanEditedSummary = formData.get('human_edited_summary') as string;
    const status = formData.get('status') as string;

    if (!msrId) return fail(400, { error: 'MSR ID is required' });

    const { error } = await supabase
      .from('monthly_status_reports')
      .update({
        human_edited_summary: humanEditedSummary,
        status: status || 'draft'
      })
      .eq('id', msrId);

    if (error) return fail(500, { error: error.message });

    return { success: true, action: 'saveMSR' };
  },

  deleteMSR: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const msrId = formData.get('msr_id') as string;

    if (!msrId) return fail(400, { error: 'MSR ID is required' });

    const { error } = await supabase
      .from('monthly_status_reports')
      .delete()
      .eq('id', msrId);

    if (error) return fail(500, { error: error.message });

    return { success: true, action: 'deleteMSR' };
  }
};
