// NEW FILE: lib/analytics/marshal-counter.ts
import { createClient } from '@/lib/supabase/server'

export async function updateDailyMarshalCount(dateStr: string) {
  const supabase = await createClient()
  
  // Call database function we created
  const { error } = await supabase.rpc('update_daily_marshal_count', {
    p_date: dateStr
  })
  
  if (error) throw error
}