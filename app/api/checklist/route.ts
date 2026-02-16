import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { responses, marshal_id, block, floor } = await request.json()
    
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    
    // Save each checklist response (NO VALIDATION)
    for (const response of responses) {
      await supabase
        .from('checklist_responses')
        .upsert({
          marshal_id,
          block,
          floor,
          checklist_item_id: response.item_id,
          response: response.value,
          date: today,
        }, {
          onConflict: 'marshal_id,block,floor,checklist_item_id,date'
        })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Checklist saved successfully',
    })
    
  } catch (error) {
    console.error('Error saving checklist:', error)
    return NextResponse.json(
      { error: 'Failed to save checklist' },
      { status: 500 }
    )
  }
}