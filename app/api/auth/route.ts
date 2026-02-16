import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    const supabase = await createClient()
    
    // ✅ ONLY use Supabase Auth (NO database check needed)
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password.trim(),
    })

    if (authError) {
      console.error('Auth error details:', authError)
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          details: authError.message 
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        id: data.user?.id,
        email: data.user?.email,
      },
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    )
  }
}