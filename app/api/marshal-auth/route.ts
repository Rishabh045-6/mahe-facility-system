// app/api/marshal-auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { marshal_id, name } = body

    if (!marshal_id || typeof marshal_id !== 'string' || !marshal_id.trim()) {
      return NextResponse.json(
        { success: false, error: 'Marshal ID is required' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch by marshal_id — use ilike for case-insensitive ID match
    const { data, error } = await supabase
      .from('marshals')
      .select('marshal_id, name, is_active')
      .ilike('marshal_id', marshal_id.trim())
      .single()

    if (error || !data) {
      // Deliberately vague — don't reveal whether the ID exists
      return NextResponse.json(
        { success: false, error: 'Invalid Marshal ID or name. Please check your credentials.' },
        { status: 401 }
      )
    }

    // Case-insensitive name comparison in code
    const submittedName = name.trim().toLowerCase()
    const registeredName = data.name.trim().toLowerCase()

    if (submittedName !== registeredName) {
      // Same deliberately vague message — don't confirm that the ID was valid
      return NextResponse.json(
        { success: false, error: 'Invalid Marshal ID or name. Please check your credentials.' },
        { status: 401 }
      )
    }

    if (!data.is_active) {
      return NextResponse.json(
        { success: false, error: 'This Marshal ID has been deactivated. Please contact your administrator.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      marshal_id: data.marshal_id,
      name: data.name, // Always return the name exactly as stored in DB
    })

  } catch (err) {
    console.error('Marshal auth error:', err)
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}