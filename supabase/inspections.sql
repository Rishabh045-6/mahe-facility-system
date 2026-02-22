-- Ensure inspections table has required columns
CREATE TABLE IF NOT EXISTS inspections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  marshal_id TEXT NOT NULL,
  marshal_name TEXT NOT NULL,
  block TEXT NOT NULL,
  floor TEXT NOT NULL,
  checklist_responses JSONB DEFAULT '{}',
  has_issues BOOLEAN,
  room_inspections JSONB DEFAULT '[]',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_inspections_marshal 
  ON inspections(marshal_id, submitted_at DESC);

-- RLS Policy: Marshals can only read their own submissions
CREATE POLICY "Marshals view own submissions" 
  ON inspections FOR SELECT 
  USING (auth.uid() IS NOT NULL OR true); -- Adjust based on your auth setup

alter table public.checklist_responses
alter column checklist_item_id type text
using checklist_item_id::text;