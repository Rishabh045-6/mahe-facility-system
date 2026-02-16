-- Drop existing policies on issues table
DROP POLICY IF EXISTS "Enable insert for issues" ON issues;
DROP POLICY IF EXISTS "Enable read access for issues" ON issues;
DROP POLICY IF EXISTS "Enable update for issues" ON issues;

-- Create new, more permissive policies
CREATE POLICY "Allow all inserts on issues"
    ON issues FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow all reads on issues"
    ON issues FOR SELECT
    USING (true);

CREATE POLICY "Allow all updates on issues"
    ON issues FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all deletes on issues"
    ON issues FOR DELETE
    USING (true);

-- Drop existing policies on checklist_responses table
DROP POLICY IF EXISTS "Enable insert for checklist responses" ON checklist_responses;
DROP POLICY IF EXISTS "Enable read for checklist responses" ON checklist_responses;

-- Create new policies for checklist_responses
CREATE POLICY "Allow all inserts on checklist_responses"
    ON checklist_responses FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow all reads on checklist_responses"
    ON checklist_responses FOR SELECT
    USING (true);

CREATE POLICY "Allow all updates on checklist_responses"
    ON checklist_responses FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Drop existing policies on floor_coverage table
DROP POLICY IF EXISTS "Enable insert for floor coverage" ON floor_coverage;
DROP POLICY IF EXISTS "Enable read for floor coverage" ON floor_coverage;

-- Create new policies for floor_coverage
CREATE POLICY "Allow all inserts on floor_coverage"
    ON floor_coverage FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow all reads on floor_coverage"
    ON floor_coverage FOR SELECT
    USING (true);

CREATE POLICY "Allow all updates on floor_coverage"
    ON floor_coverage FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Drop existing policies on analytics table
DROP POLICY IF EXISTS "Enable read for analytics" ON analytics;

-- Create new policies for analytics
CREATE POLICY "Allow all operations on analytics"
    ON analytics FOR ALL
    USING (true)
    WITH CHECK (true);

-- Drop existing policies on checklist_items table
DROP POLICY IF EXISTS "Public read access for checklist items" ON checklist_items;

-- Create new policies for checklist_items
CREATE POLICY "Allow all operations on checklist_items"
    ON checklist_items FOR ALL
    USING (true)
    WITH CHECK (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('issues', 'checklist_responses', 'floor_coverage', 'analytics', 'checklist_items')
ORDER BY tablename, policyname;