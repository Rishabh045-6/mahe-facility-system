import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data: floorCoverage, error } = await supabase
    .from('floor_coverage')
    .select('*')
    .eq('date', today)
  
  return NextResponse.json({
    today,
    count: floorCoverage?.length || 0,
    data: floorCoverage,
    error: error?.message,
  })
}