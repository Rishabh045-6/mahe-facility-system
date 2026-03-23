-- ============================================
-- ROOM ASSIGNMENTS (Planning Layer)
-- ============================================

CREATE TABLE IF NOT EXISTS room_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    block TEXT NOT NULL CHECK (block IN ('AB4', 'AB5')),
    floor TEXT NOT NULL,
    room_number TEXT NOT NULL,
    marshal_id TEXT NOT NULL,
    marshal_name TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by TEXT,
    copied_from_date DATE,
    copied_from_assignment_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT room_assignments_unique_room_per_date UNIQUE (date, block, floor, room_number)
);

CREATE INDEX IF NOT EXISTS idx_room_assignments_date
    ON room_assignments(date);

CREATE INDEX IF NOT EXISTS idx_room_assignments_date_marshal
    ON room_assignments(date, marshal_id);

CREATE INDEX IF NOT EXISTS idx_room_assignments_date_block_floor
    ON room_assignments(date, block, floor);

ALTER TABLE room_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on room_assignments" ON room_assignments;
