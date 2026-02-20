-- Room inspection support for marshal flow
CREATE TABLE IF NOT EXISTS room_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  block TEXT NOT NULL,
  floor TEXT NOT NULL,
  room_number TEXT NOT NULL,
  feature_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  has_issues BOOLEAN DEFAULT false,
  marshal_id TEXT NOT NULL,
  marshal_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, block, floor, room_number, marshal_id)
);

ALTER TABLE issues ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS room_inspection_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'issues_room_inspection_id_fkey'
      AND table_name = 'issues'
  ) THEN
    ALTER TABLE issues
      ADD CONSTRAINT issues_room_inspection_id_fkey
      FOREIGN KEY (room_inspection_id)
      REFERENCES room_inspections(id)
      ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE room_inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all inserts on room_inspections" ON room_inspections;
DROP POLICY IF EXISTS "Allow all reads on room_inspections" ON room_inspections;
DROP POLICY IF EXISTS "Allow all updates on room_inspections" ON room_inspections;

CREATE POLICY "Allow all inserts on room_inspections"
  ON room_inspections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all reads on room_inspections"
  ON room_inspections FOR SELECT
  USING (true);

CREATE POLICY "Allow all updates on room_inspections"
  ON room_inspections FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_room_inspections_date ON room_inspections(date);
CREATE INDEX IF NOT EXISTS idx_room_inspections_location ON room_inspections(block, floor, room_number);
