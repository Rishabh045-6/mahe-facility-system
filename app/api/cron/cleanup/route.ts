import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateDailyMarshalCount } from '@/lib/analytics/marshal-counter'

// Runs daily at 2 AM IST via Vercel Cron
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // FIX: Two separate cutoffs based on simulation results:
    // - Database rows: 30 days (only 5.1 MB total, enables week/month analytics)
    // - Images: 7 days (max 236 MB worst case, well under 1 GB free tier)

    const getISTDateString = (daysAgo: number): string => {
      const d = new Date()
      d.setDate(d.getDate() - daysAgo)
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d)
    }

    const dbCutoffStr    = getISTDateString(30) // delete DB rows older than 30 days
    const imageCutoffStr = getISTDateString(7)  // delete images older than 7 days

    console.log(`🧹 Starting cleanup...`)
    console.log(`   Database rows older than: ${dbCutoffStr} (30 days)`)
    console.log(`   Images older than:        ${imageCutoffStr} (7 days)`)

    // ── 1. Archive marshal counts before deleting ──────────────────────────
    // Archive the 2 days that are falling out of the fresh window
    const datesToArchive = [
      getISTDateString(31),
      getISTDateString(32),
    ]

    for (const archiveDate of datesToArchive) {
      try {
        await updateDailyMarshalCount(archiveDate)
        console.log(`✅ Archived marshal count for ${archiveDate}`)
      } catch (err) {
        console.error(`❌ Failed to archive marshal count for ${archiveDate}:`, err)
      }
    }

    // ── 2. Delete old issues (30-day retention) ────────────────────────────
    const { error: issuesError } = await supabase
      .from('issues')
      .delete()
      .lt('reported_at', `${dbCutoffStr}T00:00:00+05:30`)

    if (issuesError) {
      console.error('❌ Error deleting old issues:', issuesError)
      throw issuesError
    }
    console.log(`✅ Deleted issues older than ${dbCutoffStr}`)

    // ── 3. Delete old checklist responses (30-day retention) ───────────────
    const { error: checklistError } = await supabase
      .from('checklist_responses')
      .delete()
      .lt('date', dbCutoffStr)

    if (checklistError) {
      console.error('❌ Error deleting old checklist responses:', checklistError)
      throw checklistError
    }
    console.log(`✅ Deleted checklist responses older than ${dbCutoffStr}`)

    // ── 4. Delete old floor coverage (30-day retention) ───────────────────
    const { error: coverageError } = await supabase
      .from('floor_coverage')
      .delete()
      .lt('date', dbCutoffStr)

    if (coverageError) {
      console.error('❌ Error deleting old floor coverage:', coverageError)
      throw coverageError
    }
    console.log(`✅ Deleted floor coverage older than ${dbCutoffStr}`)

    // ── 5. Delete old room inspections (30-day retention) ─────────────────
    const { error: roomInspError } = await supabase
      .from('room_inspections')
      .delete()
      .lt('date', dbCutoffStr)

    if (roomInspError) {
      console.error('❌ Error deleting old room inspections:', roomInspError)
      // Non-fatal — log and continue
    } else {
      console.log(`✅ Deleted room inspections older than ${dbCutoffStr}`)
    }

    // ── 6. Delete old images (7-day retention) ────────────────────────────
    // Images use a tighter 7-day window because at ~34 MB/day they'd
    // hit the 1 GB Supabase free tier limit at ~30 days (worst case).
    // 7 days keeps storage under 250 MB worst case.
    let imagesDeleted = 0
    let imageFolderErrors = 0

    const { data: dateFolders } = await supabase.storage
      .from('facility-images')
      .list('', { limit: 100 })

    if (dateFolders) {
      // Only process folders that are date-shaped AND older than imageCutoffStr
      const oldDateFolders = dateFolders.filter(
        folder =>
          /^\d{4}-\d{2}-\d{2}$/.test(folder.name) &&
          folder.name < imageCutoffStr
      )

      console.log(`🗂️ Found ${oldDateFolders.length} image date-folders to delete (older than ${imageCutoffStr})`)

      for (const dateFolder of oldDateFolders) {
        const { data: blockFolders } = await supabase.storage
          .from('facility-images')
          .list(dateFolder.name, { limit: 100 })

        for (const blockFolder of blockFolders || []) {
          const { data: issueFolders } = await supabase.storage
            .from('facility-images')
            .list(`${dateFolder.name}/${blockFolder.name}`, { limit: 1000 })

          for (const issueFolder of issueFolders || []) {
            const { data: files } = await supabase.storage
              .from('facility-images')
              .list(`${dateFolder.name}/${blockFolder.name}/${issueFolder.name}`, { limit: 1000 })

            if (files && files.length > 0) {
              const paths = files.map(
                f => `${dateFolder.name}/${blockFolder.name}/${issueFolder.name}/${f.name}`
              )

              const { error: deleteError } = await supabase.storage
                .from('facility-images')
                .remove(paths)

              if (deleteError) {
                console.error(`❌ Error deleting images in ${dateFolder.name}/${blockFolder.name}/${issueFolder.name}:`, deleteError)
                imageFolderErrors++
              } else {
                imagesDeleted += files.length
                console.log(`✅ Deleted ${files.length} images from ${dateFolder.name}/${blockFolder.name}/${issueFolder.name}`)
              }
            }
          }
        }
      }
    }

    console.log(`✅ Image cleanup complete — ${imagesDeleted} images deleted, ${imageFolderErrors} folder errors`)
    console.log('✅ AUTO-CLEANUP completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      dbCutoffDate: dbCutoffStr,
      imageCutoffDate: imageCutoffStr,
      imagesDeleted,
      imageFolderErrors,
    })

  } catch (error) {
    console.error('❌ AUTO-CLEANUP failed:', error)
    return NextResponse.json(
      { error: 'Cleanup failed', details: error },
      { status: 500 }
    )
  }
}