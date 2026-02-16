interface QueuedSubmission {
  id: string
  type: 'issue' | 'checklist'
  data: any
  timestamp: number
  retryCount: number
  status: 'pending' | 'uploading' | 'failed' | 'completed'
}

class OfflineQueue {
  private queue: QueuedSubmission[] = []
  private isSyncing = false
  
  constructor() {
    this.loadFromStorage()
    // Start background sync
    this.startBackgroundSync()
  }
  
  // Load queue from IndexedDB/localStorage
  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('offlineQueue')
      if (saved) {
        this.queue = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load queue:', error)
    }
  }
  
  // Save queue to storage
  private saveToStorage() {
    try {
      localStorage.setItem('offlineQueue', JSON.stringify(this.queue))
    } catch (error) {
      console.error('Failed to save queue:', error)
    }
  }
  
  // Add submission to queue
  addToQueue(type: 'issue' | 'checklist', data: any): string {
    const id = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const submission: QueuedSubmission = {
      id,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    }
    
    this.queue.push(submission)
    this.saveToStorage()
    
    // Try to sync immediately
    this.syncQueue()
    
    return id
  }
  
  // Remove from queue
  removeFromQueue(id: string) {
    this.queue = this.queue.filter(item => item.id !== id)
    this.saveToStorage()
  }
  
  // Get queue status
  getQueueStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.status === 'pending').length,
      uploading: this.queue.filter(i => i.status === 'uploading').length,
      failed: this.queue.filter(i => i.status === 'failed').length,
    }
  }
  
  // Sync queue with server
  async syncQueue() {
    if (this.isSyncing || this.queue.length === 0) return
    
    this.isSyncing = true
    
    const pendingItems = this.queue.filter(i => i.status === 'pending')
    
    for (const item of pendingItems) {
      try {
        item.status = 'uploading'
        this.saveToStorage()
        
        // Submit based on type
        if (item.type === 'issue') {
          await this.submitIssue(item.data)
        } else if (item.type === 'checklist') {
          await this.submitChecklist(item.data)
        }
        
        item.status = 'completed'
        this.removeFromQueue(item.id)
        
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error)
        item.status = 'failed'
        item.retryCount++
        
        // Remove after 3 retries
        if (item.retryCount >= 3) {
          this.removeFromQueue(item.id)
        }
        
        this.saveToStorage()
      }
    }
    
    this.isSyncing = false
  }
  
  // Submit issue to API
  private async submitIssue(data: any) {
    const response = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to submit issue')
    }
    
    return await response.json()
  }
  
  // Submit checklist to API
  private async submitChecklist(data: any) {
    const response = await fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to submit checklist')
    }
    
    return await response.json()
  }
  
  // Start background sync
  private startBackgroundSync() {
    // Sync every 30 seconds when online
    setInterval(() => {
      if (navigator.onLine) {
        this.syncQueue()
      }
    }, 30000)
    
    // Sync when connection is restored
    window.addEventListener('online', () => {
      console.log('Connection restored, syncing queue...')
      this.syncQueue()
    })
  }
  
  // Clear completed items
  clearCompleted() {
    this.queue = this.queue.filter(item => item.status !== 'completed')
    this.saveToStorage()
  }
}

// Export singleton instance
export const offlineQueue = typeof window !== 'undefined' ? new OfflineQueue() : null