import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json()
    
    if (!status || !['approved', 'denied'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { error } = await supabase
      .from('issues')
      .update({ status })
      .eq('id', (await params).id)

    if (error) {
      console.error('Database update error:', error)
      return NextResponse.json(
        { error: 'Failed to update issue status', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully'
    })
    
  } catch (error: any) {
    console.error('Status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}