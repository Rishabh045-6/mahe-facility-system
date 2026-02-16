import { supabase } from '@/lib/supabase/client'

export class StorageCleanup {
  private static STORAGE_BUCKET = 'facility-images'
  
  // Delete images older than specified days
  static async cleanupOldImages(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]
      
      console.log(`🧹 Starting cleanup for images older than ${daysOld} days...`)
      
      // List all folders (dates)
      const { data: folders } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .list('', {
          limit: 100,
          offset: 0,
        })
      
      let totalDeleted = 0
      
      // Process each date folder
      for (const folder of folders || []) {
        if (folder.name < cutoffDateStr) {
          console.log(`📁 Processing folder: ${folder.name}`)
          
          // List all files in this date folder
          const { data: files } = await supabase.storage
            .from(this.STORAGE_BUCKET)
            .list(folder.name, {
              limit: 1000,
              offset: 0,
            })
          
          if (files && files.length > 0) {
            const paths = files.map(file => `${folder.name}/${file.name}`)
            
            // Delete all files in this folder
            const { error } = await supabase.storage
              .from(this.STORAGE_BUCKET)
              .remove(paths)
            
            if (error) {
              console.error(`❌ Error deleting files from ${folder.name}:`, error)
            } else {
              console.log(`✅ Deleted ${files.length} files from ${folder.name}`)
              totalDeleted += files.length
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
  
  // Delete specific issue images
  static async deleteIssueImages(issueId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // List files in today's folder
      const { data: files } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .list(`${today}`, {
          limit: 1000,
          offset: 0,
        })
      
      if (files) {
        const issueFiles = files
          .filter(file => file.name.includes(issueId))
          .map(file => `${today}/${file.name}`)
        
        if (issueFiles.length > 0) {
          await supabase.storage
            .from(this.STORAGE_BUCKET)
            .remove(issueFiles)
          
          console.log(`✅ Deleted ${issueFiles.length} images for issue ${issueId}`)
        }
      }
      
    } catch (error) {
      console.error(`❌ Error deleting images for issue ${issueId}:`, error)
      throw error
    }
  }
  
  // Get storage usage statistics
  static async getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    oldestFileDate: string
    newestFileDate: string
  }> {
    try {
      const { data: folders } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .list('', {
          limit: 100,
          offset: 0,
        })
      
      let totalFiles = 0
      let oldestDate = new Date().toISOString().split('T')[0]
      let newestDate = '2000-01-01'
      
      for (const folder of folders || []) {
        const { data: files } = await supabase.storage
          .from(this.STORAGE_BUCKET)
          .list(folder.name, {
            limit: 1000,
            offset: 0,
          })
        
        if (files) {
          totalFiles += files.length
          
          if (folder.name < oldestDate) oldestDate = folder.name
          if (folder.name > newestDate) newestDate = folder.name
        }
      }
      
      return {
        totalFiles,
        totalSize: totalFiles * 300 * 1024, // Approx 300KB per file
        oldestFileDate: oldestDate,
        newestFileDate: newestDate,
      }
      
    } catch (error) {
      console.error('❌ Error getting storage stats:', error)
      throw error
    }
  }
}

// Export singleton instance
export const storageCleanup = StorageCleanup