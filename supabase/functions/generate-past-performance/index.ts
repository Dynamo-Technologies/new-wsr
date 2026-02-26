import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.0'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { wsr_ids, project_focus, agency_focus } = await req.json()

    if (!wsr_ids || wsr_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'wsr_ids array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch selected WSRs with project details
    const { data: wsrs, error: wsrError } = await supabase
      .from('weekly_status_reports')
      .select(`
        id, week_ending, report_type, accomplishments, this_week, blockers, next_week,
        work_type_tags,
        user:users(full_name, role),
        project:projects(name, client_agency, contract_number, project_type, start_date, end_date)
      `)
      .in('id', wsr_ids)
      .order('week_ending')

    if (wsrError) throw new Error(wsrError.message)
    if (!wsrs || wsrs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No WSRs found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Group by project for organized presentation
    const projectMap = new Map<string, { project: any; wsrs: typeof wsrs }>()
    for (const wsr of wsrs) {
      const key = wsr.project?.name ?? 'Unknown'
      if (!projectMap.has(key)) {
        projectMap.set(key, { project: wsr.project, wsrs: [] })
      }
      projectMap.get(key)!.wsrs.push(wsr)
    }

    // Format content for Claude
    const formattedContent = Array.from(projectMap.entries()).map(([projectName, { project, wsrs: projectWSRs }]) => {
      const contractInfo = [
        project?.contract_number ? `Contract: ${project.contract_number}` : null,
        project?.client_agency ? `Agency: ${project.client_agency}` : null,
        project?.project_type ? `Type: ${project.project_type}` : null
      ].filter(Boolean).join(' | ')

      const wstrContent = projectWSRs.map((wsr) => {
        const parts = [`[${wsr.week_ending}] ${wsr.user?.full_name ?? 'Unknown'}`]
        if (wsr.accomplishments) parts.push(wsr.accomplishments)
        if (wsr.this_week) parts.push(wsr.this_week)
        if (wsr.work_type_tags?.length) parts.push(`Skills: ${wsr.work_type_tags.join(', ')}`)
        return parts.join('\n')
      }).join('\n\n')

      return `### ${projectName}\n${contractInfo}\n\n${wstrContent}`
    }).join('\n\n===\n\n')

    // Collect unique work types and team roles
    const allTags = [...new Set(wsrs.flatMap((w) => w.work_type_tags ?? []))]
    const allRoles = [...new Set(wsrs.map((w) => w.user?.role).filter(Boolean))]
    const dateRange = {
      start: wsrs[0].week_ending,
      end: wsrs[wsrs.length - 1].week_ending
    }

    // Build context info
    const focusContext = [
      agency_focus ? `Target Agency/Client: ${agency_focus}` : null,
      project_focus ? `Project Focus: ${project_focus}` : null
    ].filter(Boolean).join('\n')

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are a business development professional writing a Past Performance narrative for a federal government proposal response.

Context:
- Work Period: ${dateRange.start} to ${dateRange.end}
- Total Weekly Reports: ${wsrs.length}
- Key Capabilities: ${allTags.join(', ')}
- Team: ${allRoles.join(', ')}
${focusContext}

Using the weekly status reports below, write a compelling Past Performance narrative that:

1. **Overview** (2-3 sentences): Briefly describe the overall scope and scale of work performed
2. **Key Technical Capabilities Demonstrated**: Specific technical skills and tools applied (reference WSR content)
3. **Mission Impact & Outcomes**: Concrete outcomes, deliverables, and impact achieved
4. **Quality & Performance Indicators**: Evidence of quality, consistency, and reliability
5. **Team Expertise**: Breadth of expertise and roles demonstrated
6. **Relevant Qualifications Summary**: A 1-paragraph executive summary suitable for a past performance reference section

Guidelines:
- Use action verbs and quantify where possible (e.g., "Developed 3 API integrations...", "Reduced processing time by...")
- Focus on outcomes and impact, not just activities
- Use formal, professional government proposal language
- If multiple projects are included, highlight the breadth of experience
- Do not include specific employee names (use "Dynamo team" or role titles)
- Ensure content is appropriate for federal proposal submissions

Weekly Status Reports:

${formattedContent}

Write the Past Performance narrative now:`
        }
      ]
    })

    const narrative = message.content[0].type === 'text' ? message.content[0].text : ''

    return new Response(
      JSON.stringify({ narrative, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating past performance narrative:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
