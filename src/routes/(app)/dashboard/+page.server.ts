import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (!user) return { wsrs: [], projects: [], stats: null };

  // Load user's recent WSRs (last 20)
  const { data: wsrs, error: wsrError } = await supabase
    .from('weekly_status_reports')
    .select(`
      id, week_ending, report_type, accomplishments, submitted_at, work_type_tags, hours,
      project:projects(id, name)
    `)
    .eq('user_id', user.id)
    .order('week_ending', { ascending: false })
    .limit(20);

  if (wsrError) console.error('Dashboard WSR query error:', wsrError);

  // Load active projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  // Stats — count WSRs this quarter
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
