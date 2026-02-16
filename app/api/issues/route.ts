import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema for individual issue within submission
const issueItemSchema = z.object({
  issue_type: z.string().min(1, 'Issue type is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  is_movable: z.boolean().default(false),
  room_location: z.string().optional(),
})

// Schema for entire submission payload
const submissionSchema = z.object({
  marshal_id: z.string().min(1, 'Marshal ID is required'),
  block: z.enum(['AB1', 'AB2', 'AB3', 'AB4', 'AB5']),
  floor: z.string().min(1, 'Floor is required'),
  checklist_responses: z.array(
    z.object({
      item_id: z.string(),
      value: z.boolean(),
    })
  ).optional(),
  has_issues: z.boolean(),
  issues: z.array(issueItemSchema).optional(),
  images: z.array(z.string()).optional(),
  submitted_at: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Add marshal_name to schema validation
    const submissionSchema = z.object({
      marshal_id: z.string().min(1, 'Marshal ID is required'),
      marshal_name: z.string().min(1, 'Marshal name is required'), // NEW
      block: z.enum(['AB1', 'AB2', 'AB3', 'AB4', 'AB5']),
      floor: z.string().min(1, 'Floor is required'),
      checklist_responses: z.array(
        z.object({
          item_id: z.string(),
          value: z.boolean(),
        })
      ).optional(),
      has_issues: z.boolean(),
      issues: z.array(issueItemSchema).optional(),
      images: z.array(z.string()).optional(),
      submitted_at: z.string().optional(),
    })
    
    const validatedData = submissionSchema.parse(body)
    
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    
    // Save checklist responses with marshal_name
    if (validatedData.checklist_responses && validatedData.checklist_responses.length > 0) {
      const checklistPromises = validatedData.checklist_responses.map(response => 
        supabase.from('checklist_responses').upsert({
          marshal_id: validatedData.marshal_id,
          marshal_name: validatedData.marshal_name, // NEW
          block: validatedData.block,
          floor: validatedData.floor,
          checklist_item_id: response.item_id,
          response: response.value,
          date: today,
        }, {
          onConflict: 'marshal_id,block,floor,checklist_item_id,date'
        })
      )
      await Promise.all(checklistPromises)
    }
    
    // Process issues
    let insertedIssues: any[] = []
    
    if (validatedData.has_issues && validatedData.issues && validatedData.issues.length > 0) {
      for (const issue of validatedData.issues) {
        const { data: newIssue, error: insertError } = await supabase
          .from('issues')
          .insert({
            block: validatedData.block,
            floor: validatedData.floor,
            room_location: issue.room_location || null,
            issue_type: issue.issue_type,
            description: issue.description,
            is_movable: issue.is_movable,
            images: validatedData.images || [],
            marshal_id: validatedData.marshal_id,
            marshal_name: validatedData.marshal_name, // NEW - store name directly
            status: 'approved',
            reported_at: new Date().toISOString(),
            checklist_data: validatedData.checklist_responses || null,
          })
          .select()
          .single()
        
        if (insertError) throw insertError
        insertedIssues.push(newIssue)
        
        // Track floor coverage with name
        await supabase
          .from('floor_coverage')
          .upsert({
            date: today,
            block: validatedData.block,
            floor: validatedData.floor,
            marshal_id: validatedData.marshal_id,
            marshal_name: validatedData.marshal_name, // NEW
          }, {
            onConflict: 'date,block,floor'
          })
        
        // Update analytics
        await supabase.rpc('update_analytics', {
          p_date: today,
          p_block: validatedData.block,
          p_issue_type: issue.issue_type,
        })
      }
    } else {
      // Track coverage even without issues
      await supabase
        .from('floor_coverage')
        .upsert({
          date: today,
          block: validatedData.block,
          floor: validatedData.floor,
          marshal_id: validatedData.marshal_id,
          marshal_name: validatedData.marshal_name, // NEW
        }, {
          onConflict: 'date,block,floor'
        })
    }
    
    return NextResponse.json({
      success: true,
      message: `Report submitted successfully! ${insertedIssues.length} issue(s) recorded.`,
      data: {
        issues_count: insertedIssues.length,
        floor: `${validatedData.block} Floor ${validatedData.floor}`,
        marshal: validatedData.marshal_name,
      },
    })
    
  } catch (error) {
    // ... existing error handling ...
  }
}