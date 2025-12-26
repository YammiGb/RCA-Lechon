-- Add delivery_fee column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_fee numeric(12,2) DEFAULT 0;

-- Add comment to document the column
COMMENT ON COLUMN orders.delivery_fee IS 'Delivery fee amount for delivery orders. Set to 0 for pickup orders or when no delivery fee applies.';

-- Update RLS policies if needed (they should already cover this column)
-- The existing policies should work, but we'll ensure they're up to date
DROP POLICY IF EXISTS "Public can insert orders" ON orders;
CREATE POLICY "Public can insert orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can select orders" ON orders;
CREATE POLICY "Public can select orders"
  ON orders
  FOR SELECT
  TO public
  USING (true);

