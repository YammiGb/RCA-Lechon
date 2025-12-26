/*
  # Add Date-Based Availability System

  1. New Table
    - `date_availability`
      - `id` (uuid, primary key)
      - `date` (date, unique) - the date for which availability is set
      - `available_item_ids` (uuid[]) - array of menu item IDs available on this date
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on date_availability table
    - Add policies for public read access
    - Add policies for authenticated admin access
*/

-- Create date_availability table
CREATE TABLE IF NOT EXISTS date_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  available_item_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE date_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read date availability"
  ON date_availability
  FOR SELECT
  TO public
  USING (true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage date availability"
  ON date_availability
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger for date_availability
CREATE TRIGGER update_date_availability_updated_at
  BEFORE UPDATE ON date_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster date lookups
CREATE INDEX IF NOT EXISTS idx_date_availability_date ON date_availability(date);


