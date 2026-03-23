import { createClient } from '@/lib/supabase/server'
import type { AssignmentMarshal } from './types'

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>
type MarshalRecord = Record<string, unknown>

function normalizeMarshalRow(row: MarshalRecord, source: string): AssignmentMarshal | null {
  const marshalId = String(
    row.marshal_id ??
    row.id ??
    ''
  ).trim()

  const marshalName = String(
    row.marshal_name ??
    row.name ??
    ''
  ).trim()

  if (!marshalId) return null

  return {
    marshal_id: marshalId,
    marshal_name: marshalName || marshalId,
    is_active: row.is_active !== false,
    sources: [source],
  }
}

export async function listAssignableMarshals(
  supabase: ServerSupabaseClient
): Promise<AssignmentMarshal[]> {
  const merged = new Map<string, AssignmentMarshal>()

  const { data: registryRows } = await supabase
    .from('marshal_registry')
    .select('*')
    .order('last_seen', { ascending: false })

  for (const row of registryRows ?? []) {
    const normalized = normalizeMarshalRow(row as MarshalRecord, 'marshal_registry')
    if (!normalized) continue

    const existing = merged.get(normalized.marshal_id)
    if (existing) {
      existing.marshal_name = existing.marshal_name || normalized.marshal_name
      existing.is_active = existing.is_active && normalized.is_active
      existing.sources = Array.from(new Set([...existing.sources, ...normalized.sources]))
    } else {
      merged.set(normalized.marshal_id, normalized)
    }
  }

  const { data: marshalsRows, error: marshalsError } = await supabase
    .from('marshals')
    .select('*')

  if (!marshalsError) {
    for (const row of marshalsRows ?? []) {
      const normalized = normalizeMarshalRow(row as MarshalRecord, 'marshals')
      if (!normalized) continue

      const existing = merged.get(normalized.marshal_id)
      if (existing) {
        existing.marshal_name = normalized.marshal_name || existing.marshal_name
        existing.is_active = existing.is_active && normalized.is_active
        existing.sources = Array.from(new Set([...existing.sources, ...normalized.sources]))
      } else {
        merged.set(normalized.marshal_id, normalized)
      }
    }
  }

  return [...merged.values()]
    .filter(marshal => marshal.is_active)
    .sort((a, b) => {
      const nameCompare = a.marshal_name.localeCompare(b.marshal_name)
      if (nameCompare !== 0) return nameCompare
      return a.marshal_id.localeCompare(b.marshal_id)
    })
}


export async function listAdminDropdownMarshals(
  supabase: ServerSupabaseClient
): Promise<AssignmentMarshal[]> {
  const { data: marshalsRows, error } = await supabase
    .from('marshals')
    .select('*')
    .eq('is_active', true)

  if (error) {
    throw error
  }

  return (marshalsRows ?? [])
    .map(row => normalizeMarshalRow(row as MarshalRecord, 'marshals'))
    .filter((marshal): marshal is AssignmentMarshal => marshal !== null && marshal.is_active)
    .sort((a, b) => {
      const nameCompare = a.marshal_name.localeCompare(b.marshal_name)
      if (nameCompare !== 0) return nameCompare
      return a.marshal_id.localeCompare(b.marshal_id)
    })
}

export async function getAssignableMarshalById(
  supabase: ServerSupabaseClient,
  marshalId: string
): Promise<AssignmentMarshal | null> {
  const marshals = await listAssignableMarshals(supabase)
  return marshals.find(marshal => marshal.marshal_id === marshalId) ?? null
}
