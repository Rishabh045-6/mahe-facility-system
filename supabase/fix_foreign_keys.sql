-- Step 1: Drop ALL foreign key constraints on marshal_id
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_marshal_id_fkey;
ALTER TABLE checklist_responses DROP CONSTRAINT IF EXISTS checklist_responses_marshal_id_fkey;
ALTER TABLE floor_coverage DROP CONSTRAINT IF EXISTS floor_coverage_marshal_id_fkey;

-- Step 2: Add marshal_name column to store the name directly
ALTER TABLE issues ADD COLUMN IF NOT EXISTS marshal_name TEXT;
ALTER TABLE floor_coverage ADD COLUMN IF NOT EXISTS marshal_name TEXT;
ALTER TABLE checklist_responses ADD COLUMN IF NOT EXISTS marshal_name TEXT;

-- Step 3: Drop the marshals table completely (we don't need it)
DROP TABLE IF EXISTS marshals;

-- Step 4: Verify changes
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('issues', 'checklist_responses', 'floor_coverage')
    AND kcu.column_name = 'marshal_id';