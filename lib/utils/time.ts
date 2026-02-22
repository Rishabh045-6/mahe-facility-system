// lib/utils/time.ts

export const REPORTING_DEADLINE_HOUR = 18 // 6 PM IST
export const REPORTING_DEADLINE_MINUTE = 0
export const GRACE_PERIOD_MINUTES = 15

/**
 * Returns the current time as a Date object normalised to IST (UTC+5:30).
 * This ensures all deadline comparisons are correct regardless of the
 * user's device timezone.
 */
const getNowInIST = (): Date => {
  const now = new Date()
  // Build an ISO string that represents the current moment in IST
  const istString = now.toLocaleString('en-CA', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  // en-CA locale gives us YYYY-MM-DD, HH:MM:SS – safe to parse
  return new Date(istString)
}

/**
 * Build an IST-normalised deadline Date for today at 18:00.
 */
const getDeadlineIST = (): Date => {
  const nowIST = getNowInIST()
  const deadline = new Date(nowIST)
  deadline.setHours(REPORTING_DEADLINE_HOUR, REPORTING_DEADLINE_MINUTE, 0, 0)
  return deadline
}

/**
 * Build an IST-normalised grace-period end Date for today at 18:15.
 */
const getGracePeriodEndIST = (): Date => {
  const deadline = getDeadlineIST()
  const gracePeriodEnd = new Date(deadline)
  gracePeriodEnd.setMinutes(gracePeriodEnd.getMinutes() + GRACE_PERIOD_MINUTES)
  return gracePeriodEnd
}

// Check if current IST time is before the 18:00 deadline
export const isBeforeDeadline = (): boolean => {
  return getNowInIST() < getDeadlineIST()
}

// Check if current IST time is within the 15-minute grace period
export const isWithinGracePeriod = (): boolean => {
  const nowIST = getNowInIST()
  return nowIST >= getDeadlineIST() && nowIST <= getGracePeriodEndIST()
}

// Check if form should be locked (past deadline AND past grace period)
export const shouldLockForm = (): boolean => {
  return !isBeforeDeadline() && !isWithinGracePeriod()
}

// Get time remaining until deadline as HH:MM:SS string
export const getTimeRemaining = (): string => {
  const nowIST = getNowInIST()
  const deadline = getDeadlineIST()

  if (nowIST >= deadline) {
    return '00:00:00'
  }

  const diff = deadline.getTime() - nowIST.getTime()
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

// Get today's date string in IST (YYYY-MM-DD)
export const getTodayDateString = (): string => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

// Check if a date string represents today in IST
export const isToday = (dateString: string): boolean => {
  return dateString === getTodayDateString()
}