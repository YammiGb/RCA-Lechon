-- Migration: Add public update policy for orders table
-- This allows the admin dashboard (using public key) to update order status

-- Add policy to allow public users to update orders
-- This is needed because the admin dashboard uses the public/anonymous key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename = 'orders' 
    AND policyname = 'Public can update orders'
  ) THEN
    CREATE POLICY "Public can update orders"
      ON orders FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

