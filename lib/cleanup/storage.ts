import { createClient } from '@/lib/supabase/server'

export class StorageCleanup {
  private static STORAGE_BUCKET = 'facility-images'

  static async cleanupOldImages(daysOld: number = 5): Promise<void> {
    const supabase = await createClient()
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

      console.log(`🧹 Starting cleanup for images older than ${daysOld} days...`)

      const { data: folders } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .list('', { limit: 100, offset: 0 })

      let totalDeleted = 0

      for (const folder of folders || []) {
        if (folder.name < cutoffDateStr) {
          const { data: blocks } = await supabase.storage
            .from(this.STORAGE_BUCKET)
            .list(folder.name, { limit: 100 })

          for (const block of blocks || []) {
            const { data: issueIds } = await supabase.storage
              .from(this.STORAGE_BUCKET)
              .list(`${folder.name}/${block.name}`, { limit: 100 })

            for (const issueId of issueIds || []) {
              const { data: files } = await supabase.storage
                .from(this.STORAGE_BUCKET)
                .list(`${folder.name}/${block.name}/${issueId.name}`, { limit: 1000 })

              if (files && files.length > 0) {
                const paths = files.map(f => `${folder.name}/${block.name}/${issueId.name}/${f.name}`)
                const { error } = await supabase.storage
                  .from(this.STORAGE_BUCKET)
                  .remove(paths)

                if (error) {
                  console.error(`❌ Error deleting files:`, error)
                } else {
                  totalDeleted += files.length
                }
              }
            }
          }
        }
      }

      console.log(`✅ Cleanup complete. Total files deleted: ${totalDeleted}`)
    } catch (error) {
      console.error('❌ Error during cleanup:', error)
      throw error
    }
  }

  static async deleteIssueImages(issueId: string): Promise<void> {
    const supabase = await createClient()
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: blocks } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .list(today, { limit: 100 })

      for (const block of blocks || []) {
        const { data: files } = await supabase.storage
          .from(this.STORAGE_BUCKET)
          .list(`${today}/${block.name}/${issueId}`, { limit: 1000 })

        if (files && files.length > 0) {
          const paths = files.map(f => `${today}/${block.name}/${issueId}/${f.name}`)
          await supabase.storage.from(this.STORAGE_BUCKET).remove(paths)
          console.log(`✅ Deleted ${files.length} images for issue ${issueId}`)
        }
      }
    } catch (error) {
      console.error(`❌ Error deleting images for issue ${issueId}:`, error)
      throw error
    }
  }
}

export const storageCleanup = StorageCleanup