export const REPORTING_DEADLINE_HOUR = 18 // 6 PM IST
export const REPORTING_DEADLINE_MINUTE = 0
export const GRACE_PERIOD_MINUTES = 15

// Check if current time is before deadline
export const isBeforeDeadline = (): boolean => {
  const now = new Date()
  const deadline = new Date()
  deadline.setHours(REPORTING_DEADLINE_HOUR, REPORTING_DEADLINE_MINUTE, 0, 0)
  
  return now < deadline
}

// Check if within grace period
export const isWithinGracePeriod = (): boolean => {
  const now = new Date()
  const deadline = new Date()
  deadline.setHours(REPORTING_DEADLINE_HOUR, REPORTING_DEADLINE_MINUTE, 0, 0)
  
  const gracePeriodEnd = new Date(deadline)
  gracePeriodEnd.setMinutes(gracePeriodEnd.getMinutes() + GRACE_PERIOD_MINUTES)
  
  return now >= deadline && now <= gracePeriodEnd
}

// Check if form should be locked
export const shouldLockForm = (): boolean => {
  return false//!isBeforeDeadline() && !isWithinGracePeriod()
}

// Get time remaining until deadline
export const getTimeRemaining = (): string => {
  const now = new Date()
  const deadline = new Date()
  deadline.setHours(REPORTING_DEADLINE_HOUR, REPORTING_DEADLINE_MINUTE, 0, 0)
  
  if (now >= deadline) {
    return '00:00:00'
  }
  
  const diff = deadline.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Format date for display
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Format time for display
export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Get today's date string (YYYY-MM-DD)
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0]
}

// Check if date is today
export const isToday = (dateString: string): boolean => {
  const today = getTodayDateString()
  return dateString === today
}