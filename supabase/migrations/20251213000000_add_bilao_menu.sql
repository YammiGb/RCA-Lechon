/*
  Migration: Add Bilao Menu Category and Items
  
  This migration:
  - Creates all necessary tables, functions, and policies
  - Removes all existing menu items and categories
  - Adds the new "Bilao" category
  - Populates the menu with Bilao items
*/

-- ============================================
-- Ensure required base extensions exist
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- Create tables if they don't exist
-- ============================================

-- Create categories table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '',
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

-- ============================================
-- Add discount pricing fields and sort_order to menu_items
-- ============================================

DO $$
BEGIN
  -- Add sort_order column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
  END IF;

  -- Add discount_price column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'discount_price'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN discount_price decimal(10,2);
  END IF;

  -- Add discount_start_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'discount_start_date'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN discount_start_date timestamptz;
  END IF;

  -- Add discount_end_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'discount_end_date'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN discount_end_date timestamptz;
  END IF;

  -- Add discount_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'discount_active'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN discount_active boolean DEFAULT false;
  END IF;
END $$;

-- ============================================
-- Create site_settings table
-- ============================================

CREATE TABLE IF NOT EXISTS site_settings (
  id text PRIMARY KEY,
  value text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'Anyone can read site settings'
  ) THEN
    CREATE POLICY "Anyone can read site settings"
      ON site_settings
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Create policies for authenticated admin access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'Authenticated users can manage site settings'
  ) THEN
    CREATE POLICY "Authenticated users can manage site settings"
      ON site_settings
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- Create helper functions
-- ============================================

-- Ensure trigger function to set updated_at exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger for site_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'update_site_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_site_settings_updated_at
      BEFORE UPDATE ON site_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create function to check if discount is active
CREATE OR REPLACE FUNCTION is_discount_active(
  discount_active boolean,
  discount_start_date timestamptz,
  discount_end_date timestamptz
)
RETURNS boolean AS $$
BEGIN
  -- If discount is not active, return false
  IF NOT discount_active THEN
    RETURN false;
  END IF;
  
  -- If no dates are set, return the discount_active value
  IF discount_start_date IS NULL AND discount_end_date IS NULL THEN
    RETURN discount_active;
  END IF;
  
  -- Check if current time is within the discount period
  RETURN (
    (discount_start_date IS NULL OR now() >= discount_start_date) AND
    (discount_end_date IS NULL OR now() <= discount_end_date)
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get effective price (discounted or regular)
CREATE OR REPLACE FUNCTION get_effective_price(
  base_price decimal,
  discount_price decimal,
  discount_active boolean,
  discount_start_date timestamptz,
  discount_end_date timestamptz
)
RETURNS decimal AS $$
BEGIN
  -- If discount is active and within date range, return discount price
  IF is_discount_active(discount_active, discount_start_date, discount_end_date) AND discount_price IS NOT NULL THEN
    RETURN discount_price;
  END IF;
  
  -- Otherwise return base price
  RETURN base_price;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_discount_active ON menu_items(discount_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_discount_dates ON menu_items(discount_start_date, discount_end_date);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort_order ON menu_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_sort ON menu_items(category, sort_order);

-- ============================================
-- Helper function to prevent duplicates
-- ============================================

-- Drop function if it exists with any signature
DROP FUNCTION IF EXISTS insert_bilao_item_if_not_exists(text, text, numeric, text);
DROP FUNCTION IF EXISTS insert_bilao_item_if_not_exists(text, text, numeric, text, integer);

-- Function to insert menu item only if it doesn't already exist
CREATE FUNCTION insert_bilao_item_if_not_exists(
  item_name text,
  item_description text,
  item_price decimal,
  item_category text,
  item_sort_order integer DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Check if item already exists
  IF NOT EXISTS (
    SELECT 1 FROM menu_items 
    WHERE name = item_name AND category = item_category
  ) THEN
    INSERT INTO menu_items (name, description, base_price, category, popular, available, sort_order)
    VALUES (item_name, item_description, item_price, item_category, false, true, item_sort_order);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Ensure all existing items have sort_order values
-- ============================================

-- For items in lechon-belly, bilao, food-tray categories, they should have explicit sort_order
-- For other categories, assign based on creation order to maintain backward compatibility
UPDATE menu_items mi
SET sort_order = (
  SELECT row_number() OVER (PARTITION BY category ORDER BY created_at ASC) * 1000 + category_num
  FROM (
    SELECT 
      mi2.id,
      CASE 
        WHEN mi2.category = 'lechon-belly' THEN 0
        WHEN mi2.category = 'bilao' THEN 1000
        WHEN mi2.category = 'food-tray' THEN 2000
        ELSE 3000
      END as category_num
    FROM menu_items mi2
  ) subq
  WHERE subq.id = mi.id
)
WHERE mi.sort_order IS NULL;

-- Delete old items from the new categories to ensure clean data
DELETE FROM menu_items 
WHERE category IN ('lechon-belly', 'bilao', 'food-tray');

-- ============================================
-- Clear existing data (optional - comment out if you want to preserve existing items)
-- ============================================

-- Uncomment the lines below only if you want to delete all items and categories on each run
-- DELETE FROM menu_items;
-- DELETE FROM categories;

-- ============================================
-- Add Bilao Category (using ON CONFLICT to avoid duplicates)
-- ============================================

INSERT INTO categories (id, name, icon, sort_order, active) VALUES
  ('lechon-belly', 'Lechon Belly', '', 1, true),
  ('bilao', 'Bilao', '', 2, true),
  ('food-tray', 'Food Tray', '', 3, true),
  ('combo', 'Combo', '', 4, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- ============================================
-- Add Bilao Menu Items (using duplicate prevention function)
-- ============================================

DO $$
BEGIN
  -- RCA Budget Bilao (A) - sort_order 1
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Budget Bilao (A)',
    'Shrimp, Calamares, Fish Fillet, Special Baem-e, Lumpia 40pcs. Good for 10-12 pax',
    2100.00,
    'bilao',
    1
  );

  -- RCA Budget Bilao (B) - sort_order 2
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Budget Bilao (B)',
    'Scallops, Calamares, Fish Fillet, Cordon Bleu, Shrimp. Good for 10-12 pax',
    2400.00,
    'bilao',
    2
  );

  -- RCA Seafood Mini Bilao - sort_order 3
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Seafood Mini Bilao',
    'Sweet & Sour Fish, Sweet Chili Crab, Baked Scallops, Garlic Shrimp, Calamares. Good for 8-10 pax',
    1900.00,
    'bilao',
    3
  );

  -- RCA Fried Chicken Mini Bilao - sort_order 4
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Fried Chicken Mini Bilao',
    '2kg Lechon Belly, Special Bam-i, Garlic Shrimp, Lumpia 20pcs, Fried Chicken. Good for 8-10 pax',
    1900.00,
    'bilao',
    4
  );

  -- RCA Cordon Mini Bilao - sort_order 5
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Cordon Mini Bilao',
    '2kg Lechon Belly, Special Bam-i, Garlic Shrimp, Lumpia 20pcs, Cordon. Good for 8-10 pax',
    1900.00,
    'bilao',
    5
  );

  -- RCA Seafood Bilao - sort_order 6
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Seafood Bilao',
    'Sweet & Sour Fish, Sweet Chili Crab, Baked Scallops, Garlic Shrimp, Calamares. Good for 15 pax',
    2500.00,
    'bilao',
    6
  );

  -- RCA Scallops Bilao - sort_order 7
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Scallops Bilao',
    'Lechon Belly 3kg, Special Bam-e, Shrimp, Scallops, Fish Fillet. Good for 15 pax',
    2900.00,
    'bilao',
    7
  );

  -- RCA Lechon Manok Bilao - sort_order 8
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Lechon Manok Bilao',
    'Lechon Belly 3kg, Special Bam-e, Shrimp, Lumpia 40pcs, Lechon Manok. Good for 15 pax',
    2900.00,
    'bilao',
    8
  );

  -- RCA Fried Chicken Bilao - sort_order 9
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Fried Chicken Bilao',
    'Lechon Belly 3kg, Special Bam-e, Shrimp, Lumpia 40pcs, Fried Chicken. Good for 15 pax',
    2900.00,
    'bilao',
    9
  );

  -- RCA Cordon Bilao - sort_order 10
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Cordon Bilao',
    'Lechon Belly 3kg, Special Bam-e, Shrimp, Lumpia 40pcs, Cordon Bleu. Good for 15 pax',
    2900.00,
    'bilao',
    10
  );

END $$;

-- ============================================
-- Add Lechon Belly Menu Items (using duplicate prevention function)
-- ============================================

DO $$
DECLARE
  lechon_belly_id uuid;
BEGIN
  -- RCA Lechon Belly (with variations for 3kg and 5kg) - sort_order 1
  -- First, check if item exists and insert if not
  IF NOT EXISTS (
    SELECT 1 FROM menu_items 
    WHERE name = 'RCA Lechon Belly' AND category = 'lechon-belly'
  ) THEN
    INSERT INTO menu_items (name, description, base_price, category, popular, available, sort_order)
    VALUES ('RCA Lechon Belly', 'Crispy lechon belly - choose your size', 1900.00, 'lechon-belly', false, true, 1)
    RETURNING id INTO lechon_belly_id;
    
    -- Add variations
    INSERT INTO variations (menu_item_id, name, price) VALUES
      (lechon_belly_id, '3kg', 0),
      (lechon_belly_id, '5kg', 1000);
  END IF;

  -- RCA Lechon Belly Package 3kg - sort_order 2
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Lechon Belly Package 3kg',
    'Lechon Belly with 5 different sauce options. Includes rice and side dishes. Good for 20-25 pax',
    4500.00,
    'lechon-belly',
    2
  );

  -- RCA Lechon Belly Package 5kg - sort_order 3
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Lechon Belly Package 5kg',
    'Lechon Belly with 5 different sauce options. Includes rice and side dishes. Good for 30-35 pax',
    5500.00,
    'lechon-belly',
    3
  );

END $$;

-- ============================================
-- Add Food Tray Menu Items (using duplicate prevention function)
-- ============================================

DO $$
BEGIN
  -- RCA Food Tray Set (Food Set A) - sort_order 1
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Food Tray Set - A',
    'Special Bam-i, Fried Chicken, Fish Fillet, Garlic Shrimp, Pork Menudo. Good for 20 pax. 1 kilo per food tray',
    2600.00,
    'food-tray',
    1
  );

  -- RCA Food Tray Set (Food Set B) - sort_order 2
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Food Tray Set - B',
    'Special Bam-i, Korean Style Fried Chicken, Pinakbet, Fish Fillet, Pork Hamonado. Good for 20 pax. 1 kilo per food tray',
    2600.00,
    'food-tray',
    2
  );

  -- RCA Food Tray Set (Food Set C) - sort_order 3
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Food Tray Set - C',
    'Spaghetti, Fried Chicken, Lumpia Shanghai, Grilled Bangus, Pork Steak. Good for 20 pax. 1 kilo per food tray. FREE DELIVERY',
    2600.00,
    'food-tray',
    3
  );

  -- RCA Food Tray Set (Food Set D) - sort_order 4
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Food Tray Set - D',
    'Special Bam-i, Fried Bihon, Lumpia Shanghai, Calamares, Pork Bola-bola. Good for 20 pax. 1 kilo per food tray',
    2600.00,
    'food-tray',
    4
  );

  -- RCA Food Tray Set (Food Set E) - sort_order 5
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Food Tray Set - E',
    'Fried Chicken, Baked Scallops, Lumpia Shanghai, Garlic Shrimp, Chopsuy. Good for 20 pax. 1 kilo per food tray',
    2600.00,
    'food-tray',
    5
  );

END $$;

-- ============================================
-- Add Combo Menu Items (using duplicate prevention function)
-- ============================================

DO $$
BEGIN
  -- Mini Bilao + Kakanin Bilao Combo - sort_order 1
  PERFORM insert_bilao_item_if_not_exists(
    'Mini Bilao + Kakanin Bilao Combo',
    'Delicious combination of Mini Bilao with Kakanin Bilao. Perfect for smaller gatherings.',
    2500.00,
    'combo',
    1
  );

  -- Budget Bilao + Kakanin Bilao Combo - sort_order 2
  PERFORM insert_bilao_item_if_not_exists(
    'Budget Bilao + Kakanin Bilao Combo',
    'Great value combo featuring Budget Bilao paired with Kakanin Bilao for a complete meal.',
    3000.00,
    'combo',
    2
  );

  -- RCA Bilao + Kakanin Bilao Combo - sort_order 3
  PERFORM insert_bilao_item_if_not_exists(
    'RCA Bilao + Kakanin Bilao Combo',
    'Premium combination of RCA Bilao with Kakanin Bilao. Ideal for larger celebrations.',
    3500.00,
    'combo',
    3
  );

END $$;
