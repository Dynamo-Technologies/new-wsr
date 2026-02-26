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
    const { user_id, manager_id, quarter, start_date, end_date } = await req.json()

    if (!user_id || !manager_id || !quarter || !start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: 'user_id, manager_id, quarter, start_date, and end_date are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get employee info
    const { data: employee } = await supabase
      .from('users')
      .select('full_name, role, email')
      .eq('id', user_id)
      .single()

    if (!employee) {
      return new Response(
        JSON.stringify({ error: 'Employee not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch all WSRs for the employee in the date range
    const { data: wsrs, error: wsrError } = await supabase
      .from('weekly_status_reports')
      .select(`
        id, week_ending, report_type, accomplishments, blockers, this_week, next_week,
        hours_narrative, work_type_tags,
        project:projects(name, client_agency)
      `)
      .eq('user_id', user_id)
      .gte('week_ending', start_date)
      .lte('week_ending', end_date)
      .order('week_ending')

    if (wsrError) throw new Error(wsrError.message)

    if (!wsrs || wsrs.length === 0) {
      return new Response(
        JSON.stringify({ error: `No WSRs found for ${employee.full_name} in ${quarter}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format WSRs for Claude
    const formattedWSRs = wsrs.map((wsr) => {
      const parts = [
        `**Week Ending:** ${wsr.week_ending}`,
        `**Project:** ${wsr.project?.name ?? 'Unknown'} (${wsr.project?.client_agency ?? 'Internal'})`,
        `**Type:** ${wsr.report_type}`
      ]
      if (wsr.accomplishments) parts.push(`**Accomplishments:**\n${wsr.accomplishments}`)
      if (wsr.this_week) parts.push(`**This Week:**\n${wsr.this_week}`)
      if (wsr.blockers) parts.push(`**Blockers:**\n${wsr.blockers}`)
      if (wsr.next_week) parts.push(`**Next Week:**\n${wsr.next_week}`)
      if (wsr.work_type_tags?.length) parts.push(`**Skills/Tags:** ${wsr.work_type_tags.join(', ')}`)
      return parts.join('\n')
    }).join('\n\n---\n\n')

    // Count WSRs for context
    const wsrCount = wsrs.length
    const projectsWorked = [...new Set(wsrs.map((w) => w.project?.name).filter(Boolean))]

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a professional HR consultant helping a manager write a quarterly performance review summary for a federal government contractor employee.

Employee: ${employee.full_name}
Role: ${employee.role}
Quarter: ${quarter}
Period: ${start_date} to ${end_date}
WSRs Reviewed: ${wsrCount} weekly reports
Projects: ${projectsWorked.join(', ')}

Based on the weekly status reports below, write a comprehensive performance summary organized as follows:

## Major Accomplishments
[3-5 bullet points highlighting the most significant achievements]

## Technical Skills & Expertise Demonstrated
[Skills and competencies evidenced in the reports, with specific examples]

## Consistency & Work Quality
[Assessment of consistency, thoroughness, and quality of work documented]

## Collaboration & Communication
[Evidence of teamwork, stakeholder engagement, and communication from the reports]

## Blockers Addressed & Problem Solving
[How the employee handled challenges and obstacles]

## Areas for Development
[Suggestions for growth based on patterns in the reports, stated constructively]

## Overall Summary
[2-3 sentence holistic summary suitable for a performance review]

IMPORTANT: Base your assessment ONLY on what is documented in the WSRs. Do not make assumptions. Use specific examples from the reports. Write in a professional, balanced, constructive tone.

Weekly Status Reports for ${quarter}:

${formattedWSRs}

Generate the performance summary now:`
        }
      ]
    })

    const aiSummary = message.content[0].type === 'text' ? message.content[0].text : ''

    // Save quarterly review
    const wsr_ids = wsrs.map((w) => w.id)
    const { data: review, error: saveError } = await supabase
      .from('quarterly_reviews')
      .insert({
        user_id,
        manager_id,
        quarter,
        start_date,
        end_date,
        ai_summary: aiSummary,
        wsr_ids,
        status: 'draft'
      })
      .select('id')
      .single()

    if (saveError) throw new Error(saveError.message)

    return new Response(
      JSON.stringify({ review_id: review.id, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating quarterly review:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
