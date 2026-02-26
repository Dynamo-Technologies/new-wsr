import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { AGENCIES, DEMO_TAGS, DEMO_PROJECTS, ALL_WSRS } from '$lib/demo/data';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession, isDemoMode } }) => {
  const { user } = await safeGetSession();
  if (!user) throw redirect(303, '/login');

  if (isDemoMode) {
    return { agencies: AGENCIES, tags: DEMO_TAGS, projects: DEMO_PROJECTS };
  }

  // Load filter options
  const [agenciesResult, tagsResult, projectsResult] = await Promise.all([
    supabase
      .from('projects')
      .select('client_agency')
      .not('client_agency', 'is', null)
      .order('client_agency'),
    supabase
      .from('work_type_tags')
      .select('id, name, category')
      .order('name'),
    supabase
      .from('projects')
      .select('id, name, client_agency')
      .eq('is_active', true)
      .order('name')
  ]);

  // Deduplicate agencies
  const agencies = [
    ...new Set(agenciesResult.data?.map((p) => p.client_agency).filter(Boolean) ?? [])
  ] as string[];

  return {
    agencies,
    tags: tagsResult.data ?? [],
    projects: projectsResult.data ?? []
  };
};

export const actions: Actions = {
  search: async ({ request, locals: { supabase, safeGetSession, isDemoMode } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const clientAgency = formData.get('client_agency') as string;
    const projectId = formData.get('project_id') as string;
    const dateFrom = formData.get('date_from') as string;
    const dateTo = formData.get('date_to') as string;
    const workTags = formData.getAll('work_type_tags') as string[];
    const keyword = formData.get('keyword') as string;

    if (isDemoMode) {
      // Filter demo WSRs client-side
      await new Promise(r => setTimeout(r, 600)); // simulate search latency
      let results = ALL_WSRS.slice();
      if (clientAgency) results = results.filter(w => w.project?.client_agency === clientAgency);
      if (projectId) results = results.filter(w => w.project_id === projectId);
      if (dateFrom) results = results.filter(w => w.week_ending >= dateFrom);
      if (dateTo) results = results.filter(w => w.week_ending <= dateTo);
      if (workTags.length) results = results.filter(w => workTags.some(t => w.work_type_tags?.includes(t)));
      if (keyword) results = results.filter(w =>
        [w.accomplishments, w.this_week, w.blockers, w.next_week]
          .some(f => f?.toLowerCase().includes(keyword.toLowerCase()))
      );
      return { results, keyword };
    }

    // Build query
    let query = supabase
      .from('weekly_status_reports')
      .select(`
        id, week_ending, report_type, accomplishments, this_week, blockers, next_week,
        work_type_tags, submitted_at,
        user:users(id, full_name),
        project:projects(id, name, client_agency, contract_number)
      `)
      .order('week_ending', { ascending: false })
      .limit(50);

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else if (clientAgency) {
      // Join filter through project
      const { data: agencyProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('client_agency', clientAgency);
      const ids = agencyProjects?.map((p) => p.id) ?? [];
      if (ids.length > 0) {
        query = query.in('project_id', ids);
      }
    }

    if (dateFrom) query = query.gte('week_ending', dateFrom);
    if (dateTo) query = query.lte('week_ending', dateTo);

    if (workTags.length > 0) {
      query = query.overlaps('work_type_tags', workTags);
    }

    // For keyword search, use pgvector similarity if we have an embedding
    // Otherwise fall back to text search
    if (keyword) {
      // Try to generate embedding for the keyword and use vector search
      const embeddingResult = await supabase.functions.invoke('generate-embeddings', {
        body: { text: keyword, return_only: true }
      });

      if (embeddingResult.data?.embedding) {
        // Use RPC for vector similarity search
        const { data: vectorResults } = await supabase.rpc('search_wsrs_by_embedding', {
          query_embedding: embeddingResult.data.embedding,
          match_threshold: 0.7,
          match_count: 30
        });

        // Merge with our query filters
        if (vectorResults?.length) {
          const vectorIds = vectorResults.map((r: { id: string }) => r.id);
          query = query.in('id', vectorIds);
        }
      } else {
        // Fallback: text search
        query = query.or(
          `accomplishments.ilike.%${keyword}%,this_week.ilike.%${keyword}%,next_week.ilike.%${keyword}%`
        );
      }
    }

    const { data: wsrs, error } = await query;

    if (error) {
      return fail(500, { error: error.message });
    }

    return { results: wsrs ?? [], keyword };
  },

  generatePastPerf: async ({ request, locals: { supabase, safeGetSession, isDemoMode } }) => {
    const { user } = await safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const wsrIds = formData.getAll('wsr_ids') as string[];
    const projectFocus = formData.get('project_focus') as string;
    const agencyFocus = formData.get('agency_focus') as string;

    if (wsrIds.length === 0) {
      return fail(400, { error: 'Select at least one WSR to include in the summary' });
    }

    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 2200)); // simulate AI generation
      return {
        success: true,
        narrative: `# Past Performance Narrative — DHS CISA Cyber Defense

## Overview
Dynamo provided comprehensive cybersecurity engineering and program management support to the Department of Homeland Security Cybersecurity and Infrastructure Security Agency (CISA) under Task Order 5 of Contract HSHQDC-20-D-00007. Over the reported period, the Dynamo team delivered mission-critical threat intelligence infrastructure, advanced SIEM detection capabilities, and sustained operational program management for CISA's national cyber defense mission.

## Key Technical Capabilities Demonstrated

**Threat Intelligence Engineering**: Designed and deployed a production-grade ETL pipeline ingesting 3 ISAC feeds (FS-ISAC, DIB-ISAC, MS-ISAC), processing over 8 million threat indicators per day with 99.7% uptime. Developed and delivered RESTful API endpoints (v2/threat-feeds, v2/ioc-ingest) handling 12,000 events per minute, enabling real-time threat intelligence sharing with CISA mission partners.

**SIEM Detection & Analytics**: Deployed 9 MITRE ATT&CK-aligned detection rules targeting advanced persistent threat techniques (T1078, T1566, lateral movement patterns). Achieved a 22% reduction in mean time to detect (MTTD) and a 31% reduction in false positive alert rate through systematic SIEM content tuning. Conducted proactive threat hunting across 45-day endpoint telemetry datasets, identifying suspicious behavioral patterns.

**FISMA & Compliance Management**: Completed 40% of CISA Annual FISMA Assessment ahead of schedule. Established standardized documentation frameworks for incident response, configuration management, and risk management, reducing documentation lead time by an estimated 25%.

## Mission Impact & Outcomes
- Delivered 4 of 6 CDRLs on or ahead of schedule during the reporting period
- Maintained 98.2% on-budget performance across a $1.2M monthly contract footprint
- Zero production security incidents during ETL pipeline and API deployment
- Achieved 99.1% DISA STIG compliance baseline across managed endpoint population

## Quality & Performance Indicators
Dynamo demonstrated consistent on-time delivery, 100% WSR submission compliance, and proactive risk escalation across the reporting period. All deliverables received government COR acceptance without major revision requests. The team proactively identified and documented technical blockers (CISA change freeze, legacy device exceptions) and proposed government-approved mitigations in advance of impact.

## Team Expertise
The Dynamo team supporting this effort includes certified cybersecurity engineers (CISSP, CEH), enterprise architects with zero trust experience, data engineers proficient in Python/Airflow/AWS, and senior program managers with 10+ years of federal contracting experience. Clearance levels support CISA Secret-level access requirements.

## Relevant Qualifications Summary
Dynamo brings demonstrated, production-proven capabilities in federal cybersecurity operations, threat intelligence platform engineering, FISMA compliance management, and large-program PM for DHS. This past performance directly demonstrates our ability to execute complex, mission-critical technology programs with a distributed team across classified and unclassified environments — making Dynamo a qualified, low-risk performer for future CISA and federal civilian agency requirements.`
      };
    }

    const { data, error } = await supabase.functions.invoke('generate-past-performance', {
      body: {
        wsr_ids: wsrIds,
        project_focus: projectFocus,
        agency_focus: agencyFocus
      }
    });

    if (error) {
      return fail(500, { error: `Generation failed: ${error.message}` });
    }

    return { narrative: data?.narrative ?? '', success: true };
  }
};
