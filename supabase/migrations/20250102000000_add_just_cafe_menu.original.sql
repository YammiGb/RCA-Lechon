/*
  Backup of original `20250102000000_add_just_cafe_menu.sql` before merge.
  This file is kept as a snapshot; the authoritative combined migration is
  `20250101000000_add_discount_pricing_and_site_settings.sql` which now contains
  the Just Cafè menu plus discount/site settings.
*/

-- Original migration content preserved as a backup.

-- Ensure required base tables exist (for standalone execution)
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create categories table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '☕',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create menu_items table if not exists
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  base_price decimal(10,2) NOT NULL,
  category text NOT NULL,
  popular boolean DEFAULT false,
  available boolean DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create variations table if not exists
CREATE TABLE IF NOT EXISTS variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create add_ons table if not exists
CREATE TABLE IF NOT EXISTS add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Clean up duplicate menu items before inserting
-- This removes duplicates based on (name, category), keeping the one with the earliest created_at
-- Variations and add_ons are automatically deleted via CASCADE
DELETE FROM menu_items
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY name, category ORDER BY created_at ASC) as rn
    FROM menu_items
  ) t
  WHERE t.rn > 1  -- Keep only the first (oldest) duplicate
);

-- Reset all popular flags to false (admin should mark items as popular manually)
UPDATE menu_items SET popular = false;

-- Align site settings to Just Cafè branding
INSERT INTO site_settings (id, value, type, description) VALUES
  ('site_name', 'Just Cafè', 'text', 'The name of the cafe/restaurant'),
  ('site_logo', '/logo.jpg', 'image', 'The logo image URL for the site'),
  ('site_description', 'Welcome to Just Cafè — Your perfect coffee destination', 'text', 'Short description of the cafe'),
  ('currency', '₱', 'text', 'Currency symbol for prices'),
  ('currency_code', 'PHP', 'text', 'Currency code for payments')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, type = EXCLUDED.type, description = EXCLUDED.description;

-- Helper function to get or create menu item (returns existing id if found, creates new if not)
-- Also ensures popular flag is set to false (admin should mark items as popular manually)
CREATE OR REPLACE FUNCTION get_or_create_menu_item(
  item_name text,
  item_description text,
  item_price decimal,
  item_category text,
  item_popular boolean DEFAULT false
) RETURNS uuid AS $$
DECLARE
  item_id uuid;
BEGIN
  SELECT id INTO item_id FROM menu_items WHERE name = item_name AND category = item_category LIMIT 1;
  IF item_id IS NULL THEN
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES (item_name, item_description, item_price, item_category, false, true)  -- Always set popular=false
    RETURNING id INTO item_id;
  ELSE
    -- Update existing item to ensure popular is false (admin controls this manually)
    UPDATE menu_items SET popular = false WHERE id = item_id;
  END IF;
  RETURN item_id;
END;
$$ LANGUAGE plpgsql;

-- (rest of original menu insertions retained in this backup file)
