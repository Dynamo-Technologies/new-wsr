import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LATTICE_API_KEY = Deno.env.get('LATTICE_API_KEY') ?? ''
const LATTICE_API_URL = Deno.env.get('LATTICE_API_URL') ?? 'https://api.latticehq.com/v1'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface LatticeUser {
  id: string
  email: string
  display_name: string
  manager_id?: string | null
  department?: string
  title?: string
  status?: 'active' | 'inactive'
}

async function fetchLatticeUsers(): Promise<LatticeUser[]> {
  if (!LATTICE_API_KEY) {
    // Return mock data if no API key (for development)
    console.warn('No LATTICE_API_KEY configured — skipping real Lattice sync')
    return []
  }

  const users: LatticeUser[] = []
  let cursor: string | null = null

  do {
    const url = new URL(`${LATTICE_API_URL}/people`)
    if (cursor) url.searchParams.set('cursor', cursor)
    url.searchParams.set('limit', '100')
    url.searchParams.set('expand', 'manager')

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${LATTICE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Lattice API error: ${response.status} — ${err}`)
    }

    const data = await response.json()
    users.push(...(data.data ?? []))
    cursor = data.pagination?.next_cursor ?? null
  } while (cursor)

  return users
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  let recordsUpdated = 0

  try {
    const latticeUsers = await fetchLatticeUsers()

    if (latticeUsers.length === 0) {
      // Log sync with 0 records (may be expected in dev)
      await supabase.from('lattice_sync_log').insert({
        records_synced: 0,
        status: 'success',
        error_message: 'No Lattice users returned (check API key or development mode)'
      })

      return new Response(
        JSON.stringify({ success: true, records_synced: 0, message: 'No users to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get existing users from Supabase to build email→ID map
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id, email, azure_id')

    const emailToId = new Map(existingUsers?.map((u) => [u.email.toLowerCase(), u.id]) ?? [])
    const azureToId = new Map(existingUsers?.map((u) => [u.azure_id, u.id]).filter(([k]) => k) ?? [])

    // Build Lattice ID → Supabase user ID map
    const latticeToSupabaseId = new Map<string, string>()
    for (const lu of latticeUsers) {
      const supaId = emailToId.get(lu.email.toLowerCase())
      if (supaId) {
        latticeToSupabaseId.set(lu.id, supaId)
      }
    }

    // Update manager relationships
    const updates: Array<{ id: string; default_manager_id: string | null }> = []

    for (const lu of latticeUsers) {
      const supaUserId = latticeToSupabaseId.get(lu.id)
      if (!supaUserId) continue

      let managerSupaId: string | null = null
      if (lu.manager_id) {
        managerSupaId = latticeToSupabaseId.get(lu.manager_id) ?? null
      }

      updates.push({
        id: supaUserId,
        default_manager_id: managerSupaId
      })
    }

    // Batch update users
    for (const update of updates) {
      const { error } = await supabase
        .from('users')
        .update({
          default_manager_id: update.default_manager_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)

      if (!error) recordsUpdated++
    }

    // Log successful sync
    await supabase.from('lattice_sync_log').insert({
      records_synced: recordsUpdated,
      status: 'success'
    })

    const duration = Date.now() - startTime
    console.log(`Lattice sync completed: ${recordsUpdated} users updated in ${duration}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        records_synced: recordsUpdated,
        total_lattice_users: latticeUsers.length,
        duration_ms: duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Lattice sync error:', error)

    // Log failure
    await supabase.from('lattice_sync_log').insert({
      records_synced: recordsUpdated,
      status: 'failed',
      error_message: error.message
    })

    return new Response(
      JSON.stringify({ error: error.message, records_synced: recordsUpdated }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
