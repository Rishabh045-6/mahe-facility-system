import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { AssignmentApiError, requireAdminUser } from '@/lib/assignments/service'
import { listAdminDropdownMarshals } from '@/lib/assignments/marshal-compat'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const authSupabase = await createClient()
    const adminSupabase = createAdminClient()
    await requireAdminUser(authSupabase)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim().toLowerCase() || ''
    const marshals = await listAdminDropdownMarshals(adminSupabase)

    const filtered = !query
      ? marshals
      : marshals.filter(marshal =>
          marshal.marshal_id.toLowerCase().includes(query) ||
          marshal.marshal_name.toLowerCase().includes(query)
        )

    return NextResponse.json({
      success: true,
      marshals: filtered,
    })
  } catch (error) {
    if (error instanceof AssignmentApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Marshal list error:', error)
    return NextResponse.json(
      { error: 'Failed to load marshals' },
      { status: 500 }
    )
  }
}
