import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
// ADD after imports (line 2)
import { updateDailyMarshalCount } from '@/lib/analytics/marshal-counter'

// Runs daily at 2 AM IST via Vercel Cron
export async function GET(request: NextRequest) {
  // Optional security: Check authorization header
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // Calculate cutoff date (120 hours ago)
    const cutoffDate = new Date(Date.now() - 120 * 60 * 60 * 1000)
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

    console.log(`🧹 Starting AUTO-CLEANUP for data older than ${cutoffDateStr}...`)


    // 1. Delete old issues
    const { error: issuesError } = await supabase
      .from('issues')
      .delete()
      .lt('reported_at', `${cutoffDateStr}T00:00:00`)

    if (issuesError) throw issuesError
    console.log(`✅ Deleted old issues before ${cutoffDateStr}`)

    const datesToArchive = Array.from(
      { length: 2 },
      (_, i) => new Date(Date.now() - (48 + i * 24) * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    )

    for (const archiveDate of datesToArchive) {
      try {
        await updateDailyMarshalCount(archiveDate)
        console.log(`✅ Archived marshal count for ${archiveDate}`)
      } catch (err) {
        console.error(`❌ Failed to archive ${archiveDate}:`, err)
      }
    }

    // 2. Delete old checklist responses
    const { error: checklistError } = await supabase
      .from('checklist_responses')
      .delete()
      .lt('date', cutoffDateStr)

    if (checklistError) throw checklistError
    console.log(`✅ Deleted old checklist responses before ${cutoffDateStr}`)

    // 3. Delete old floor coverage
    const { error: coverageError } = await supabase
      .from('floor_coverage')
      .delete()
      .lt('date', cutoffDateStr)

    if (coverageError) throw coverageError
    console.log(`✅ Deleted old floor coverage before ${cutoffDateStr}`)

    // 4. Delete old images from Supabase Storage
    const { data: buckets } = await supabase.storage
      .from('facility-images')
      .list('', { limit: 100 })

   if (buckets) {
  const oldFolders = buckets
    .filter(folder => folder.name < cutoffDateStr && folder.name.match(/^\d{4}-\d{2}-\d{2}$/))

  for (const dateFolder of oldFolders) {
    // Level 1: date folders → list blocks
    const { data: blockFolders } = await supabase.storage
      .from('facility-images')
      .list(dateFolder.name, { limit: 100 })

    for (const blockFolder of blockFolders || []) {
      // Level 2: block folders → list issue IDs
      const { data: issueFolders } = await supabase.storage
        .from('facility-images')
        .list(`${dateFolder.name}/${blockFolder.name}`, { limit: 1000 })

      for (const issueFolder of issueFolders || []) {
        // Level 3: issue folders → list actual image files
        const { data: files } = await supabase.storage
          .from('facility-images')
          .list(`${dateFolder.name}/${blockFolder.name}/${issueFolder.name}`, { limit: 1000 })

        if (files && files.length > 0) {
          const paths = files.map(f =>
            `${dateFolder.name}/${blockFolder.name}/${issueFolder.name}/${f.name}`
          )

          const { error: deleteError } = await supabase.storage
            .from('facility-images')
            .remove(paths)

          if (deleteError) {
            console.error(`❌ Error deleting files:`, deleteError)
          } else {
            console.log(`✅ Deleted ${files.length} images from ${dateFolder.name}/${blockFolder.name}/${issueFolder.name}`)
          }
        }
      }
    }
  }
}

    console.log('✅ AUTO-CLEANUP completed successfully!')
    return NextResponse.json({
      success: true,
      message: `Cleanup completed for data before ${cutoffDateStr}`,
      cutoffDate: cutoffDateStr
    })

  } catch (error) {
    console.error('❌ AUTO-CLEANUP failed:', error)
    return NextResponse.json(
      { error: 'Cleanup failed', details: error },
      { status: 500 }
    )
  }
}