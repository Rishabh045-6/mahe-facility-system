-- Create function to update analytics
CREATE OR REPLACE FUNCTION update_analytics(p_date TEXT, p_block TEXT, p_issue_type TEXT)
RETURNS VOID AS $$
BEGIN
  -- Try to update existing record
  UPDATE analytics
  SET count = count + 1
  WHERE date = p_date::DATE
    AND block = p_block
    AND issue_type = p_issue_type;
  
  -- If no record exists, insert new one
  IF NOT FOUND THEN
    INSERT INTO analytics (date, block, issue_type, count)
    VALUES (p_date::DATE, p_block, p_issue_type, 1);
  END IF;
END;
$$ LANGUAGE plpgsql;