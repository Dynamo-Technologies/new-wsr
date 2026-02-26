import type { PageServerLoad } from './$types';
import { MY_WSRS, DEMO_STATS, DEMO_PROJECTS } from '$lib/demo/data';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession, isDemoMode } }) => {
  const { user } = await safeGetSession();
  if (!user) return { wsrs: [], projects: [], stats: null };

  if (isDemoMode) {
    return { wsrs: MY_WSRS, projects: DEMO_PROJECTS, stats: DEMO_STATS };
  }

  // Load user's recent WSRs (last 20)
  const { data: wsrs } = await supabase
    .from('weekly_status_reports')
    .select(`
      id, week_ending, report_type, accomplishments, submitted_at, created_at, work_type_tags,
      project:projects(id, name, client_agency)
    `)
    .eq('user_id', user.id)
    .order('week_ending', { ascending: false })
    .limit(20);

  // Load projects the user has access to
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, client_agency, contract_number')
    .eq('is_active', true)
    .order('name');

  // Stats
  const now = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

  const { count: quarterCount } = await supabase
    .from('weekly_status_reports')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('week_ending', quarterStart.toISOString().split('T')[0]);

  return {
    wsrs: wsrs ?? [],
    projects: projects ?? [],
    stats: {
      quarterCount: quarterCount ?? 0
    }
  };
};
