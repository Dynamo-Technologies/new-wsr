import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// We use OpenAI's embedding API for text-embedding-3-small (1536 dims)
// Alternatively you can use Voyage or any other embedding provider
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''

async function generateEmbedding(text: string): Promise<number[]> {
  // Use OpenAI text-embedding-3-small for 1536-dim vectors
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text.slice(0, 8000), // Limit to avoid token limits
      model: 'text-embedding-3-small',
      dimensions: 1536
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI embedding error: ${err}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { wsr_id, text, return_only } = body

    // If return_only is true, just return the embedding for the given text
    if (return_only && text) {
      const embedding = await generateEmbedding(text)
      return new Response(
        JSON.stringify({ embedding }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!wsr_id) {
      return new Response(
        JSON.stringify({ error: 'wsr_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch the WSR
    const { data: wsr, error: wsrError } = await supabase
      .from('weekly_status_reports')
      .select('id, accomplishments, blockers, this_week, next_week, work_type_tags')
      .eq('id', wsr_id)
      .single()

    if (wsrError || !wsr) {
      return new Response(
        JSON.stringify({ error: 'WSR not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Construct text content for embedding
    const contentParts = [
      wsr.accomplishments,
      wsr.this_week,
      wsr.blockers,
      wsr.next_week,
      wsr.work_type_tags?.join(', ')
    ].filter(Boolean)

    const content = contentParts.join('\n\n')

    if (!content.trim()) {
      return new Response(
        JSON.stringify({ message: 'No content to embed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate embedding
    const embedding = await generateEmbedding(content)

    // Update WSR with embedding
    const { error: updateError } = await supabase
      .from('weekly_status_reports')
      .update({ content_embedding: embedding })
      .eq('id', wsr_id)

    if (updateError) {
      throw new Error(`Failed to update embedding: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true, wsr_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating embedding:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
