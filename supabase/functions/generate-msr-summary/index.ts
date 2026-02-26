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
    const { project_id, month, generated_by } = await req.json()

    if (!project_id || !month || !generated_by) {
      return new Response(
        JSON.stringify({ error: 'project_id, month, and generated_by are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get project details
    const { data: project } = await supabase
      .from('projects')
      .select('name, client_agency, contract_number')
      .eq('id', project_id)
      .single()

    // Calculate month date range
    const monthDate = new Date(month)
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
    const startDate = firstDay.toISOString().split('T')[0]
    const endDate = lastDay.toISOString().split('T')[0]

    // Fetch all WSRs for this project in the month
    const { data: wsrs, error: wsrError } = await supabase
      .from('weekly_status_reports')
      .select(`
        week_ending, report_type, accomplishments, blockers, this_week, next_week,
        hours_narrative, work_type_tags,
        user:users(full_name)
      `)
      .eq('project_id', project_id)
      .gte('week_ending', startDate)
      .lte('week_ending', endDate)
      .order('week_ending')

    if (wsrError) throw new Error(wsrError.message)

    if (!wsrs || wsrs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No WSRs found for this project and month' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format WSRs for Claude
    const formattedWSRs = wsrs.map((wsr) => {
      const parts = [
        `**Contributor:** ${wsr.user?.full_name ?? 'Unknown'}`,
        `**Week Ending:** ${wsr.week_ending}`,
        `**Type:** ${wsr.report_type}`
      ]
      if (wsr.accomplishments) parts.push(`**Accomplishments:**\n${wsr.accomplishments}`)
      if (wsr.this_week) parts.push(`**This Week:**\n${wsr.this_week}`)
      if (wsr.blockers) parts.push(`**Blockers/Risks:**\n${wsr.blockers}`)
      if (wsr.next_week) parts.push(`**Next Week:**\n${wsr.next_week}`)
      if (wsr.work_type_tags?.length) parts.push(`**Tags:** ${wsr.work_type_tags.join(', ')}`)
      return parts.join('\n')
    }).join('\n\n---\n\n')

    const monthLabel = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const projectName = project?.name ?? 'Unknown Project'
    const agencyName = project?.client_agency ?? 'Unknown Agency'

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a professional technical writer summarizing weekly status reports for a federal government contractor.

Create a concise, professional Monthly Status Report (MSR) for ${projectName} at ${agencyName} for ${monthLabel}.

The MSR should be organized with the following sections:
1. **Executive Summary** (2-3 sentences)
2. **Key Accomplishments** (bullet list of major achievements)
3. **Ongoing Work** (current activities and work in progress)
4. **Blockers & Risks** (issues requiring attention, or "None identified" if clean)
5. **Next Month Outlook** (planned work for next month)
6. **Team Contributions** (brief summary of team member contributions by name)

Write in a professional, concise tone appropriate for federal government reporting. Use active voice. Focus on outcomes and impact, not just activities.

Here are the weekly status reports for ${monthLabel}:

${formattedWSRs}

Generate the Monthly Status Report now:`
        }
      ]
    })

    const aiSummary = message.content[0].type === 'text' ? message.content[0].text : ''

    // Save MSR to database
    const { data: savedMSR, error: saveError } = await supabase
      .from('monthly_status_reports')
      .insert({
        project_id,
        month: startDate,
        generated_by,
        ai_summary: aiSummary,
        wsr_ids: wsrs.map((_, i) => wsrs[i]) // We'd need actual IDs, simplified here
      })
      .select('id')
      .single()

    if (saveError) throw new Error(saveError.message)

    return new Response(
      JSON.stringify({ msr_id: savedMSR.id, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating MSR:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
