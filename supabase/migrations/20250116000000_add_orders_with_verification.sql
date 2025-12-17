-- Migration: Add orders table with verification fields for Google Sheets integration
-- This migration creates orders and order_items tables with admin verification support

-- Enable required extension for UUID if not already
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Orders table with verification fields
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  contact_number2 text,
  service_type text NOT NULL CHECK (service_type IN ('dine-in','pickup','delivery')),
  address text,
  landmark text,
  city text,
  pickup_date date,
  pickup_time text,
  delivery_date date,
  delivery_time text,
  dine_in_time timestamptz,
  payment_method text NOT NULL,
  reference_number text,
  notes text,
  total numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'synced')),
  verified_by text,
  verified_at timestamptz,
  synced_to_sheets boolean DEFAULT false,
  synced_at timestamptz,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id text NOT NULL,
  name text NOT NULL,
  variation jsonb,
  add_ons jsonb,
  unit_price numeric(12,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies: Allow public to insert orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Public can insert orders'
  ) THEN
    CREATE POLICY "Public can insert orders"
      ON orders FOR INSERT TO public WITH CHECK (true);
  END IF;
END $$;

-- Policies: Allow public to select their own orders (by IP or contact number)
-- For now, allow public to view all orders (admin can restrict later)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Public can select orders'
  ) THEN
    CREATE POLICY "Public can select orders"
      ON orders FOR SELECT TO public USING (true);
  END IF;
END $$;

-- Policies: Allow authenticated users (admins) to update orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Authenticated users can update orders'
  ) THEN
    CREATE POLICY "Authenticated users can update orders"
      ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Policies: Allow public to update orders (for admin dashboard)
-- Note: In production, you may want to restrict this or use proper authentication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Public can update orders'
  ) THEN
    CREATE POLICY "Public can update orders"
      ON orders FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Policies: Allow public to insert order items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'Public can insert order items'
  ) THEN
    CREATE POLICY "Public can insert order items"
      ON order_items FOR INSERT TO public WITH CHECK (true);
  END IF;
END $$;

-- Policies: Allow public to select order items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'Public can select order items'
  ) THEN
    CREATE POLICY "Public can select order items"
      ON order_items FOR SELECT TO public USING (true);
  END IF;
END $$;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_synced_to_sheets ON orders(synced_to_sheets);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_ip_created_at ON orders(ip_address, created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at_trigger ON orders;
CREATE TRIGGER update_orders_updated_at_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Create or replace function to enforce 1-minute cooldown per IP (optional spam prevention)
CREATE OR REPLACE FUNCTION prevent_spam_orders_per_ip()
RETURNS trigger AS $$
DECLARE
  recent_count int;
BEGIN
  IF NEW.ip_address IS NULL OR length(trim(NEW.ip_address)) = 0 THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO recent_count
  FROM orders
  WHERE ip_address = NEW.ip_address
    AND created_at >= (now() - interval '60 seconds');

  IF recent_count > 0 THEN
    RAISE EXCEPTION 'Rate limit: Please wait 60 seconds before placing another order.' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger (optional - comment out if you don't want rate limiting)
-- DROP TRIGGER IF EXISTS trg_prevent_spam_orders_per_ip ON orders;
-- CREATE TRIGGER trg_prevent_spam_orders_per_ip
--   BEFORE INSERT ON orders
--   FOR EACH ROW
--   EXECUTE FUNCTION prevent_spam_orders_per_ip();

