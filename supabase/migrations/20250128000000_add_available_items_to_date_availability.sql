-- Add available_items column to date_availability table
-- This column stores detailed availability information including variations and add-ons
ALTER TABLE date_availability
ADD COLUMN IF NOT EXISTS available_items jsonb DEFAULT '[]'::jsonb;

-- Update RLS policies to include the new column
-- The existing policies should already cover this, but we'll ensure they're up to date
DROP POLICY IF EXISTS "Anyone can read date availability" ON date_availability;
CREATE POLICY "Anyone can read date availability"
  ON date_availability
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage date availability" ON date_availability;
CREATE POLICY "Authenticated users can manage date availability"
  ON date_availability
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

