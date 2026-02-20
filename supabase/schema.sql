-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ISSUES TABLE (Main table)
-- ============================================
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block TEXT NOT NULL CHECK (block IN ('AB1', 'AB2', 'AB3', 'AB4', 'AB5')),
    floor TEXT NOT NULL,
    room_location TEXT,
    room_number TEXT,
    room_inspection_id UUID,
    issue_type TEXT NOT NULL CHECK (
        issue_type IN (
            'Electrical - Lights',
            'Electrical - Switches/Outlets',
            'Electrical - Wiring',
            'Fans/Ventilation',
            'Air Conditioning',
            'Projector/AV Equipment',
            'Furniture - Chairs',
            'Furniture - Desks',
            'Furniture - Boards',
            'Furniture - Others',
            'Plumbing/Washroom',
            'Doors/Locks',
            'Windows',
            'Cleanliness',
            'Safety Equipment',
            'Structural Damage',
            'Others'
        )
    ),
    description TEXT NOT NULL,
    is_movable BOOLEAN DEFAULT false,
    images TEXT[],
    marshal_id TEXT NOT NULL,  -- Just store the ID, no validation
    marshal_name TEXT,
    status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'denied')),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checklist_data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CHECKLIST ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    item_text TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MARSHAL CHECKLIST RESPONSES
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marshal_id TEXT NOT NULL,
    marshal_name TEXT,
    block TEXT NOT NULL,
    floor TEXT NOT NULL,
    checklist_item_id TEXT,
    response BOOLEAN,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(marshal_id, block, floor, checklist_item_id, date)
);

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ANALYTICS TABLE (Permanent Storage)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    block TEXT,
    issue_type TEXT,
    count INTEGER DEFAULT 1,
    UNIQUE(date, block, issue_type)
);

-- ============================================
-- FLOOR COVERAGE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS floor_coverage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    block TEXT NOT NULL CHECK (block IN ('AB1', 'AB2', 'AB3', 'AB4', 'AB5')),
    floor TEXT NOT NULL,
    marshal_id TEXT,  -- Just store the ID
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, block, floor)
);


-- ============================================
-- ROOM INSPECTIONS TRACKING
-- ============================================
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
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

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_issues_date ON issues(DATE(reported_at));
CREATE INDEX idx_issues_block ON issues(block);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_marshal ON issues(marshal_id);
CREATE INDEX idx_floor_coverage_date ON floor_coverage(date);
CREATE INDEX idx_analytics_date ON analytics(date);
CREATE INDEX idx_checklist_responses_date ON checklist_responses(date);
CREATE INDEX idx_room_inspections_date ON room_inspections(date);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_inspections ENABLE ROW LEVEL SECURITY;

-- Issues table: Public insert access
CREATE POLICY "Enable insert for issues"
    ON issues FOR INSERT
    WITH CHECK (true);

-- Issues table: Public read access
CREATE POLICY "Enable read access for issues"
    ON issues FOR SELECT
    USING (true);

-- Issues table: Update access for all
CREATE POLICY "Enable update for issues"
    ON issues FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Checklist items: Public read access
CREATE POLICY "Public read access for checklist items"
    ON checklist_items FOR SELECT
    USING (true);

-- Checklist responses: Public insert and read
CREATE POLICY "Enable insert for checklist responses"
    ON checklist_responses FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable read for checklist responses"
    ON checklist_responses FOR SELECT
    USING (true);

-- Floor coverage: Public insert and read
CREATE POLICY "Enable insert for floor coverage"
    ON floor_coverage FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable read for floor coverage"
    ON floor_coverage FOR SELECT
    USING (true);


-- Room inspections: Public insert and read
CREATE POLICY "Enable insert for room inspections"
    ON room_inspections FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable read for room inspections"
    ON room_inspections FOR SELECT
    USING (true);

-- Analytics: Public read access
CREATE POLICY "Enable read for analytics"
    ON analytics FOR SELECT
    USING (true);

-- ============================================
-- INITIAL CHECKLIST ITEMS DATA
-- ============================================
INSERT INTO checklist_items (category, item_text, order_index) VALUES
-- Daily Observations
('Daily Observations', 'All classrooms cleaned before 8:30 AM', 1),
('Daily Observations', 'Corridors, staircases, and lobbies mopped and dry', 2),
('Daily Observations', 'Dustbins cleaned and placed properly', 3),
('Daily Observations', 'Janitor room arranged and soft door closed', 4),
('Daily Observations', 'Washrooms cleaned (check every 2-3 hrs)', 5),
('Daily Observations', 'Mirrors, taps, and floor in washrooms cleaned', 6),
('Daily Observations', 'Fire extinguishers available and valid', 7),
('Daily Observations', 'No obstruction near exits or corridors', 8),
-- Classroom/Lab Upkeep
('Classroom/Lab Upkeep', 'Furniture arranged properly', 9),
('Classroom/Lab Upkeep', 'Fans, lights, and projectors working', 10),
('Classroom/Lab Upkeep', 'Windows, notice boards, and whiteboards cleaned', 11),
('Classroom/Lab Upkeep', 'No posters or stickers on walls', 12),
('Classroom/Lab Upkeep', 'Any maintenance issue reported', 13),
-- Washroom & Utility
('Washroom & Utility', 'Sufficient hand wash and tissue rolls available', 14),
('Washroom & Utility', 'Plumbing/leakage issues noted', 15),
('Washroom & Utility', 'Restroom door locks and lights working', 16),
-- Maintenance/Snag
('Maintenance/Snag', 'Daily snag list prepared and sent', 17),
('Maintenance/Snag', 'Follow-up on pending complaints', 18),
('Maintenance/Snag', 'Electrical and plumbing items checked', 19);

-- ============================================
-- MARSHAL REGISTRY (Persistent across cleanups)
-- ============================================
CREATE TABLE IF NOT EXISTS marshal_registry (
    marshal_id TEXT PRIMARY KEY,
    marshal_name TEXT,
    first_seen DATE NOT NULL DEFAULT CURRENT_DATE,
    last_seen DATE NOT NULL DEFAULT CURRENT_DATE,
    total_submissions INTEGER DEFAULT 1
);

-- ============================================
-- DAILY MARSHAL COUNTS (For activity chart)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_marshal_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    unique_count INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0
);

-- ============================================
-- RPC: Upsert marshal into registry
-- ============================================
CREATE OR REPLACE FUNCTION upsert_marshal_registry(p_marshal_id TEXT, p_marshal_name TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO marshal_registry (marshal_id, marshal_name, first_seen, last_seen, total_submissions)
  VALUES (p_marshal_id, p_marshal_name, CURRENT_DATE, CURRENT_DATE, 1)
  ON CONFLICT (marshal_id) DO UPDATE
    SET marshal_name = p_marshal_name,
        last_seen = CURRENT_DATE,
        total_submissions = marshal_registry.total_submissions + 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RPC: Update daily marshal count
-- ============================================
CREATE OR REPLACE FUNCTION update_daily_marshal_count(p_date TEXT)
RETURNS VOID AS $$
DECLARE
  v_unique INTEGER;
  v_total INTEGER;
BEGIN
  SELECT COUNT(DISTINCT marshal_id), COUNT(*)
  INTO v_unique, v_total
  FROM issues
  WHERE DATE(reported_at) = p_date::DATE;

  INSERT INTO daily_marshal_counts (date, unique_count, total_submissions)
  VALUES (p_date::DATE, v_unique, v_total)
  ON CONFLICT (date) DO UPDATE
    SET unique_count = v_unique,
        total_submissions = v_total;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE marshal_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_marshal_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on marshal_registry"
    ON marshal_registry FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on daily_marshal_counts"
    ON daily_marshal_counts FOR ALL
    USING (true)
    WITH CHECK (true);