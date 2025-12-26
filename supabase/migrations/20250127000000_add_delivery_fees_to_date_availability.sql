/*
  # Add Delivery Fees to Date Availability

  Adds a delivery_fees column to store city-specific delivery fees for each date.
  Format: JSONB object with city names as keys and fee amounts as values.
  Example: {"Lapu-Lapu City": 50, "Cebu City": 100, "Mandaue City": 75}
*/

-- Add delivery_fees column to date_availability table
ALTER TABLE date_availability 
ADD COLUMN IF NOT EXISTS delivery_fees jsonb DEFAULT '{}'::jsonb;

-- Create index for faster queries on delivery_fees
CREATE INDEX IF NOT EXISTS idx_date_availability_delivery_fees 
ON date_availability USING gin (delivery_fees);

-- Add comment to explain the column
COMMENT ON COLUMN date_availability.delivery_fees IS 'JSONB object mapping city names to delivery fee amounts for this date. Example: {"Lapu-Lapu City": 50, "Cebu City": 100}';

