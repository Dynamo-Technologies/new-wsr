import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  TEAM_WSRS, DEMO_PROJECTS, DEMO_MSRS, DIRECT_REPORTS,
  DEMO_USER_ID, DEMO_USERS
} from '$lib/demo/data';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession, isDemoMode } }) => {
  const { user } = await safeGetSession();
  if (!user) throw redirect(303, '/login');

  if (isDemoMode) {
    const teamIds = new Set(DIRECT_REPORTS.map(u => u.id));
    return {
      directReports: DIRECT_REPORTS,
      teamIds,
      teamWSRs: TEAM_WSRS,
      projects: DEMO_PROJECTS,
      msrs: DEMO_MSRS,
      allUsers: DIRECT_REPORTS
    };
  }

  // Verify manager/admin role
  const { data: appUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!appUser || !['manager', 'director', 'vp', 'admin'].includes(appUser.role)) {
    throw redirect(303, '/dashboard');
  }

  // Get direct reports (default manager relationship)
  const { data: directReports } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active')
    .eq('default_manager_id', user.id)
    .eq('is_active', true)
    .order('full_name');

  // Get users from manager overrides
  const { data: overrideUsers } = await supabase
    .from('manager_overrides')
    .select(`
      user:users(id, full_name, email, role),
      project:projects(id, name)
    `)
    .eq('override_manager_id', user.id);

  // Combine and deduplicate team members
  const allTeamIds = new Set([
    ...(directReports?.map((u) => u.id) ?? []),
    ...(overrideUsers?.map((o) => o.user?.id).filter(Boolean) ?? [])
  ]);

  // Get recent WSRs for team
  const teamIds = Array.from(allTeamIds);
  let teamWSRs: unknown[] = [];

  if (teamIds.length > 0) {
    const { data: wsrs } = await supabase
      .from('weekly_status_reports')
      .select(`
        id, week_ending, report_type, accomplishments, submitted_at, work_type_tags,
        user:users(id, full_name),
        project:projects(id, name, client_agency)
      `)
      .in('user_id', teamIds)
      .order('week_ending', { ascending: false })
      .limit(50);

    teamWSRs = wsrs ?? [];
  }

  // Get projects for MSR generation
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, client_agency')
    .eq('is_active', true)
    .order('name');

  // Get existing MSRs
  const { data: msrs } = await supabase
    .from('monthly_status_reports')
    .select(`
      id, month, status, ai_summary, human_edited_summary, created_at,
      project:projects(id, name, client_agency)
    `)
    .order('month', { ascending: false })
    .limit(12);

  // All users for filter
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', teamIds)
    .order('full_name');

  return {
    directReports: directReports ?? [],
    teamIds,
    teamWSRs,
    projects: projects ?? [],
    msrs: msrs ?? [],
    allUsers: allUsers ?? []
  };
};

export const actions: Actions = {
  generateMSR: async ({ request, locals: { supabase, safeGetSession, isDemoMode } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const projectId = formData.get('project_id') as string;
    const month = formData.get('month') as string;

    if (!projectId || !month) {
      return fail(400, { error: 'Project and month are required' });
    }

    if (isDemoMode) {
      // Simulate a brief delay and return success for demo
      await new Promise(r => setTimeout(r, 1800));
      return { success: true, msrId: 'ee000001' };
    }

    // Trigger MSR generation via Edge Function
    const { data, error } = await supabase.functions.invoke('generate-msr-summary', {
      body: {
        project_id: projectId,
        month,
        generated_by: user.id
      }
    });

    if (error) {
      return fail(500, { error: `Failed to generate MSR: ${error.message}` });
    }

    return { success: true, msrId: data?.msr_id };
  },

  saveMSR: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const msrId = formData.get('msr_id') as string;
    const editedSummary = formData.get('human_edited_summary') as string;
    const status = formData.get('status') as string;

    const { error } = await supabase
      .from('monthly_status_reports')
      .update({
        human_edited_summary: editedSummary,
        status: status ?? 'draft',
        updated_at: new Date().toISOString()
      })
      .eq('id', msrId);

    if (error) {
      return fail(500, { error: error.message });
    }

    return { success: true };
  }
};
