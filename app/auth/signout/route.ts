import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  // ✅ FIXED: Redirect to VALID route (home page)
  // Options:
  //   - '/' = Home page (recommended)
  //   - '/admin-login' = Admin login page
  return NextResponse.redirect(new URL('/', request.url))
}