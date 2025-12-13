/*
  DEPRECATED: this migration was merged into
  `20250101000000_add_discount_pricing_and_site_settings.sql`
  The combined migration is now the authoritative migration file. This
  file is kept as a lightweight marker to preserve history but the full
  original content is available at
  `20250102000000_add_just_cafe_menu.original.sql` in the same directory.
*/

-- Migration merged; see the combined migration file for actual SQL.

-- ============================================
-- BREAKFAST MEALS
-- ============================================

-- Filipino Breakfast items (all ₱220, served with rice, egg, and side dish)
DO $$
DECLARE
  beef_tapa_id uuid;
  bangus_belly_id uuid;
  tortang_talong_id uuid;
  spam_egg_id uuid;
  corned_beef_id uuid;
BEGIN
  beef_tapa_id := get_or_create_menu_item('Beef Tapa', 'Native beef tapa served with rice, egg, and side dish', 220.00, 'breakfast', false);
  bangus_belly_id := get_or_create_menu_item('Bangus Belly', 'Tender bangus belly served with rice, egg, and side dish', 220.00, 'breakfast', false);
  tortang_talong_id := get_or_create_menu_item('Tortang Talong', 'Eggplant omelet served with rice, egg, and side dish', 220.00, 'breakfast', false);
  spam_egg_id := get_or_create_menu_item('Spam & Egg', 'Classic spam with egg served with rice and side dish', 220.00, 'breakfast', false);
  corned_beef_id := get_or_create_menu_item('Corned Beef', 'Hearty corned beef served with rice, egg, and side dish', 220.00, 'breakfast', false);
END $$;

-- Egg, Spam and Toast
DO $$
DECLARE
  item_id uuid;
BEGIN
  item_id := get_or_create_menu_item('Egg, Spam and Toast', 'Caramelized spam with two eggs cooked your way, served alongside french toast', 195.00, 'breakfast', false);
END $$;

-- Double Ham Delight
DO $$
DECLARE
  item_id uuid;
BEGIN
  item_id := get_or_create_menu_item('Double Ham Delight', 'French toast paired with fried ham and cheese omelet, extra ham slices and a side dish to balance morning start', 180.00, 'breakfast', false);
END $$;

-- Classic Corned Beef Plate
DO $$
DECLARE
  item_id uuid;
BEGIN
  item_id := get_or_create_menu_item('Classic Corned Beef Plate', 'Canned Corned Beef with savory scrambled egg, pancakes and a side dish', 195.00, 'breakfast', false);
END $$;

-- ============================================
-- COFFEE-BASED DRINKS
-- ============================================

DO $$
DECLARE
  americano_id uuid;
  honey_americano_id uuid;
  caramel_macchiato_id uuid;
  salted_caramel_id uuid;
  cafe_latte_id uuid;
  cafe_mocha_id uuid;
  spanish_latte_id uuid;
  sea_salt_latte_id uuid;
  hazelnut_id uuid;
  iced_white_mocha_id uuid;
  peppermint_id uuid;
  peppermint_mocha_id uuid;
  dirty_matcha_id uuid;
BEGIN
  -- Americano (Hot 100, Iced 16oz 130, Iced 22oz 150)
  americano_id := get_or_create_menu_item('Americano', 'Classic espresso with hot water', 100.00, 'coffee-based', false);
  DELETE FROM variations WHERE menu_item_id = americano_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (americano_id, 'Hot 12oz', 0),
    (americano_id, 'Iced 16oz', 30),
    (americano_id, 'Iced 22oz', 50);

  -- Honey Americano (Hot 130, Iced 16oz 150, Iced 22oz 170)
  honey_americano_id := get_or_create_menu_item('Honey Americano', 'Americano sweetened with natural honey', 130.00, 'coffee-based', false);
  DELETE FROM variations WHERE menu_item_id = honey_americano_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (honey_americano_id, 'Hot 12oz', 0),
    (honey_americano_id, 'Iced 16oz', 20),
    (honey_americano_id, 'Iced 22oz', 40);

  -- Caramel Macchiato (Hot 150, Iced 16oz 165, Iced 22oz 185)
  caramel_macchiato_id := get_or_create_menu_item('Caramel Macchiato', 'Espresso with vanilla, caramel, and steamed milk', 150.00, 'coffee-based', false);
  DELETE FROM variations WHERE menu_item_id = caramel_macchiato_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (caramel_macchiato_id, 'Hot 12oz', 0),
    (caramel_macchiato_id, 'Iced 16oz', 15),
    (caramel_macchiato_id, 'Iced 22oz', 35);

  -- Salted Caramel (Hot 135, Iced 16oz 159, Iced 22oz 179)
  salted_caramel_id := get_or_create_menu_item('Salted Caramel', 'Rich espresso with salted caramel and milk', 135.00, 'coffee-based', false);
  DELETE FROM variations WHERE menu_item_id = salted_caramel_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (salted_caramel_id, 'Hot 12oz', 0),
    (salted_caramel_id, 'Iced 16oz', 24),
    (salted_caramel_id, 'Iced 22oz', 44);

  -- Cafe Latte (Hot 135, Iced 16oz 159, Iced 22oz 179)
  cafe_latte_id := get_or_create_menu_item('Cafe Latte', 'Smooth espresso with steamed milk', 135.00, 'coffee-based', false);
  DELETE FROM variations WHERE menu_item_id = cafe_latte_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (cafe_latte_id, 'Hot 12oz', 0),
    (cafe_latte_id, 'Iced 16oz', 24),
    (cafe_latte_id, 'Iced 22oz', 44);

  -- Cafe Mocha (Hot 150, Iced 16oz 175, Iced 22oz 195)
  cafe_mocha_id := get_or_create_menu_item('Cafe Mocha', 'Espresso with chocolate and steamed milk', 150.00, 'coffee-based', false);
  DELETE FROM variations WHERE menu_item_id = cafe_mocha_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (cafe_mocha_id, 'Hot 12oz', 0),
    (cafe_mocha_id, 'Iced 16oz', 25),
    (cafe_mocha_id, 'Iced 22oz', 45);

  -- Spanish Latte (Hot 150, Iced 16oz 165, Iced 22oz 185)
  spanish_latte_id := get_or_create_menu_item('Spanish Latte', 'Sweet condensed milk with espresso', 150.00, 'coffee-based', false);
  DELETE FROM variations WHERE menu_item_id = spanish_latte_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (spanish_latte_id, 'Hot 12oz', 0),
    (spanish_latte_id, 'Iced 16oz', 15),
    (spanish_latte_id, 'Iced 22oz', 35);

  -- Sea Salt Latte (Hot - unavailable, Iced 16oz 175, Iced 22oz 195)
  sea_salt_latte_id := get_or_create_menu_item('Sea Salt Latte', 'Espresso with sea salt caramel and milk', 175.00, 'coffee-based', false);
  DELETE FROM variations WHERE menu_item_id = sea_salt_latte_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (sea_salt_latte_id, 'Iced 16oz', 0),
    (sea_salt_latte_id, 'Iced 22oz', 20);

  -- Hazelnut (Hot 135, Iced 16oz 159, Iced 22oz 179)
  hazelnut_id := get_or_create_menu_item('Hazelnut', 'Espresso with hazelnut syrup and milk', 135.00, 'coffee-based', false);
  DELETE FROM variations WHERE menu_item_id = hazelnut_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (hazelnut_id, 'Hot 12oz', 0),
    (hazelnut_id, 'Iced 16oz', 24),
    (hazelnut_id, 'Iced 22oz', 44);

  -- Iced White Mocha (Hot 140, Iced 16oz 165, Iced 22oz 185)
  iced_white_mocha_id := get_or_create_menu_item('Iced White Mocha', 'White chocolate with espresso and milk', 140.00, 'coffee-based', false);
  DELETE FROM variations WHERE menu_item_id = iced_white_mocha_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (iced_white_mocha_id, 'Hot 12oz', 0),
    (iced_white_mocha_id, 'Iced 16oz', 25),
    (iced_white_mocha_id, 'Iced 22oz', 45);

  -- Peppermint (Hot 150, Iced 16oz 159, Iced 22oz 179)
  peppermint_id := get_or_create_menu_item('Peppermint', 'Refreshing peppermint with espresso and milk', 150.00, 'coffee-based', false);
  DELETE FROM variations WHERE menu_item_id = peppermint_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (peppermint_id, 'Hot 12oz', 0),
    (peppermint_id, 'Iced 16oz', 9),
    (peppermint_id, 'Iced 22oz', 29);

  -- Peppermint Mocha (Hot 150, Iced 16oz 170, Iced 22oz 190)
  peppermint_mocha_id := get_or_create_menu_item('Peppermint Mocha', 'Chocolate and peppermint with espresso', 150.00, 'coffee-based', false);
  DELETE FROM variations WHERE menu_item_id = peppermint_mocha_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (peppermint_mocha_id, 'Hot 12oz', 0),
    (peppermint_mocha_id, 'Iced 16oz', 20),
    (peppermint_mocha_id, 'Iced 22oz', 40);

  -- Dirty Matcha (Hot - unavailable, Iced 16oz 175, Iced 22oz 195)
  dirty_matcha_id := get_or_create_menu_item('Dirty Matcha', 'Matcha with a shot of espresso', 175.00, 'coffee-based', false);
  DELETE FROM variations WHERE menu_item_id = dirty_matcha_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (dirty_matcha_id, 'Iced 16oz', 0),
    (dirty_matcha_id, 'Iced 22oz', 20);
END $$;

-- ============================================
-- NON-COFFEE (MILK BASED)
-- ============================================

DO $$
DECLARE
  nutella_id uuid;
  oreo_id uuid;
  biscoff_id uuid;
  matcha_id uuid;
  strawberry_matcha_id uuid;
  blueberry_matcha_id uuid;
  choco_strawberry_id uuid;
  choco_blueberry_id uuid;
BEGIN
  -- Nutella (Hot 130, 16oz 145, 22oz 165)
  nutella_id := get_or_create_menu_item('Nutella', 'Creamy Nutella with milk', 130.00, 'non-coffee-milk', false);
  DELETE FROM variations WHERE menu_item_id = nutella_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (nutella_id, 'Hot 12oz', 0),
    (nutella_id, '16oz', 15),
    (nutella_id, '22oz', 35);

  -- Oreo (Hot - unavailable, 16oz 145, 22oz 165)
  oreo_id := get_or_create_menu_item('Oreo', 'Crushed Oreo cookies with milk', 145.00, 'non-coffee-milk', false);
  DELETE FROM variations WHERE menu_item_id = oreo_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (oreo_id, '16oz', 0),
    (oreo_id, '22oz', 20);

  -- Biscoff (Hot 140, 16oz 150, 22oz 180)
  biscoff_id := get_or_create_menu_item('Biscoff', 'Speculoos cookie butter with milk', 140.00, 'non-coffee-milk', false);
  DELETE FROM variations WHERE menu_item_id = biscoff_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (biscoff_id, 'Hot 12oz', 0),
    (biscoff_id, '16oz', 10),
    (biscoff_id, '22oz', 40);

  -- Matcha (Hot 140, 16oz 150, 22oz 170)
  matcha_id := get_or_create_menu_item('Matcha', 'Premium matcha with milk', 140.00, 'non-coffee-milk', false);
  DELETE FROM variations WHERE menu_item_id = matcha_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (matcha_id, 'Hot 12oz', 0),
    (matcha_id, '16oz', 10),
    (matcha_id, '22oz', 30);

  -- Strawberry Matcha (Hot 150, 16oz 170, 22oz 170)
  strawberry_matcha_id := get_or_create_menu_item('Strawberry Matcha', 'Matcha with fresh strawberry', 150.00, 'non-coffee-milk', false);
  DELETE FROM variations WHERE menu_item_id = strawberry_matcha_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (strawberry_matcha_id, 'Hot 12oz', 0),
    (strawberry_matcha_id, '16oz', 20),
    (strawberry_matcha_id, '22oz', 20);

  -- Blueberry Matcha (Hot 150, 16oz 170, 22oz 170)
  blueberry_matcha_id := get_or_create_menu_item('Blueberry Matcha', 'Matcha with blueberry', 150.00, 'non-coffee-milk', false);
  DELETE FROM variations WHERE menu_item_id = blueberry_matcha_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (blueberry_matcha_id, 'Hot 12oz', 0),
    (blueberry_matcha_id, '16oz', 20),
    (blueberry_matcha_id, '22oz', 20);

  -- Choco Strawberry (Hot 150, 16oz 170, 22oz 170)
  choco_strawberry_id := get_or_create_menu_item('Choco Strawberry', 'Chocolate with fresh strawberry', 150.00, 'non-coffee-milk', false);
  DELETE FROM variations WHERE menu_item_id = choco_strawberry_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (choco_strawberry_id, 'Hot 12oz', 0),
    (choco_strawberry_id, '16oz', 20),
    (choco_strawberry_id, '22oz', 20);

  -- Choco Blueberry (Hot 150, 16oz 170, 22oz 170)
  choco_blueberry_id := get_or_create_menu_item('Choco Blueberry', 'Chocolate with blueberry', 150.00, 'non-coffee-milk', false);
  DELETE FROM variations WHERE menu_item_id = choco_blueberry_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (choco_blueberry_id, 'Hot 12oz', 0),
    (choco_blueberry_id, '16oz', 20),
    (choco_blueberry_id, '22oz', 20);
END $$;

-- ============================================
-- COFFEE-FREEZE (BLENDED ICE, NO WHIP)
-- ============================================

DO $$
DECLARE
  caramel_vanilla_id uuid;
  mocha_freeze_id uuid;
  salted_caramel_freeze_id uuid;
  peppermint_mocha_freeze_id uuid;
BEGIN
  -- Caramel Vanilla (16oz 165, 22oz 185)
  caramel_vanilla_id := get_or_create_menu_item('Caramel Vanilla', 'Blended caramel vanilla coffee (no whip)', 165.00, 'coffee-freeze', false);
  DELETE FROM variations WHERE menu_item_id = caramel_vanilla_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (caramel_vanilla_id, '16oz', 0),
    (caramel_vanilla_id, '22oz', 20);

  -- Mocha (16oz 165, 22oz 185)
  mocha_freeze_id := get_or_create_menu_item('Mocha Freeze', 'Blended mocha coffee (no whip)', 165.00, 'coffee-freeze', false);
  DELETE FROM variations WHERE menu_item_id = mocha_freeze_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (mocha_freeze_id, '16oz', 0),
    (mocha_freeze_id, '22oz', 20);

  -- Salted Caramel (16oz 165, 22oz 185)
  salted_caramel_freeze_id := get_or_create_menu_item('Salted Caramel Freeze', 'Blended salted caramel coffee (no whip)', 165.00, 'coffee-freeze', false);
  DELETE FROM variations WHERE menu_item_id = salted_caramel_freeze_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (salted_caramel_freeze_id, '16oz', 0),
    (salted_caramel_freeze_id, '22oz', 20);

  -- Peppermint Mocha (16oz 175, 22oz 195)
  peppermint_mocha_freeze_id := get_or_create_menu_item('Peppermint Mocha Freeze', 'Blended peppermint mocha coffee (no whip)', 175.00, 'coffee-freeze', false);
  DELETE FROM variations WHERE menu_item_id = peppermint_mocha_freeze_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (peppermint_mocha_freeze_id, '16oz', 0),
    (peppermint_mocha_freeze_id, '22oz', 20);
END $$;

-- ============================================
-- NON-COFFEE FREEZE (NEW)
-- ============================================

DO $$
DECLARE
  nutella_freeze_id uuid;
  oreo_freeze_id uuid;
  biscoff_freeze_id uuid;
BEGIN
  -- Nutella (16oz 165, 22oz 185)
  nutella_freeze_id := get_or_create_menu_item('Nutella Freeze', 'Blended Nutella (no whip)', 165.00, 'non-coffee-freeze', false);
  DELETE FROM variations WHERE menu_item_id = nutella_freeze_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (nutella_freeze_id, '16oz', 0),
    (nutella_freeze_id, '22oz', 20);

  -- Oreo (16oz 165, 22oz 185)
  oreo_freeze_id := get_or_create_menu_item('Oreo Freeze', 'Blended Oreo (no whip)', 165.00, 'non-coffee-freeze', false);
  DELETE FROM variations WHERE menu_item_id = oreo_freeze_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (oreo_freeze_id, '16oz', 0),
    (oreo_freeze_id, '22oz', 20);

  -- Biscoff (16oz 165, 22oz 185)
  biscoff_freeze_id := get_or_create_menu_item('Biscoff Freeze', 'Blended Biscoff (no whip)', 165.00, 'non-coffee-freeze', false);
  DELETE FROM variations WHERE menu_item_id = biscoff_freeze_id;
  INSERT INTO variations (menu_item_id, name, price) VALUES
    (biscoff_freeze_id, '16oz', 0),
    (biscoff_freeze_id, '22oz', 20);
END $$;

-- ============================================
-- PASTA
-- ============================================

DO $$
DECLARE
  creamy_pesto_id uuid;
  creamy_salted_egg_id uuid;
  carbonara_id uuid;
  tuna_pasta_id uuid;
  lunis_pasta_id uuid;
BEGIN
  creamy_pesto_id := get_or_create_menu_item('Creamy Pesto', 'Creamy pesto pasta', 230.00, 'pasta', false);
  creamy_salted_egg_id := get_or_create_menu_item('Creamy Salted Egg', 'Pasta with creamy salted egg sauce', 230.00, 'pasta', false);
  carbonara_id := get_or_create_menu_item('Carbonara', 'Classic carbonara pasta', 230.00, 'pasta', false);
  tuna_pasta_id := get_or_create_menu_item('Tuna Pasta', 'Pasta with real tuna fish', 280.00, 'pasta', false);
  lunis_pasta_id := get_or_create_menu_item('Luñis Pasta', 'Pasta with luñis', 280.00, 'pasta', false);
END $$;

-- ============================================
-- CHICKEN POPPERS (comes with rice and side dish)
-- ============================================

DO $$
DECLARE
  honey_garlic_id uuid;
  salted_egg_chicken_id uuid;
  classic_fried_chicken_id uuid;
  garlic_parmesan_id uuid;
BEGIN
  honey_garlic_id := get_or_create_menu_item('Honey Garlic', 'Honey garlic chicken poppers with rice and side dish', 210.00, 'chicken-poppers', false);
  salted_egg_chicken_id := get_or_create_menu_item('Salted Egg', 'Salted egg chicken poppers with rice and side dish', 210.00, 'chicken-poppers', false);
  classic_fried_chicken_id := get_or_create_menu_item('Classic Fried Chicken', 'Classic fried chicken poppers with rice and side dish', 210.00, 'chicken-poppers', false);
  garlic_parmesan_id := get_or_create_menu_item('Garlic Parmesan', 'Garlic parmesan chicken poppers with rice and side dish', 210.00, 'chicken-poppers', false);
END $$;

-- ============================================
-- SNACKS
-- ============================================

DO $$
DECLARE
  potato_fries_id uuid;
  wakay_fries_id uuid;
  pancake_burger_id uuid;
  camote_delight_id uuid;
  camote_turon_id uuid;
BEGIN
  potato_fries_id := get_or_create_menu_item('Potato Fries', 'Crispy golden potato fries', 150.00, 'snacks', false);
  wakay_fries_id := get_or_create_menu_item('Wakay Fries', 'Fried cassava fries', 135.00, 'snacks', false);
  pancake_burger_id := get_or_create_menu_item('Pancake Burger', 'Unique pancake burger', 135.00, 'snacks', false);
  camote_delight_id := get_or_create_menu_item('Camote Delight', 'Sweet potato delight, per slice', 80.00, 'snacks', false);
  camote_turon_id := get_or_create_menu_item('Camote Turon', 'Sweet potato turon', 150.00, 'snacks', false);
END $$;

-- ============================================
-- RICE MEALS
-- ============================================

DO $$
DECLARE
  crispy_kare_kare_id uuid;
  pork_sisig_id uuid;
  creamy_meatballs_id uuid;
  cordon_bleu_bites_id uuid;
  crispy_tofu_id uuid;
BEGIN
  crispy_kare_kare_id := get_or_create_menu_item('Crispy Kare Kare', 'Crispy kare kare rice meal', 265.00, 'rice-meals', false);
  pork_sisig_id := get_or_create_menu_item('Pork Sisig', 'Sizzling pork sisig rice meal', 250.00, 'rice-meals', false);
  creamy_meatballs_id := get_or_create_menu_item('Creamy Meatballs', 'Creamy meatballs rice meal', 250.00, 'rice-meals', false);
  cordon_bleu_bites_id := get_or_create_menu_item('Cordon Bleu Bites', 'Cordon bleu bites rice meal', 250.00, 'rice-meals', false);
  crispy_tofu_id := get_or_create_menu_item('Crispy Tofu Square', 'Crispy tofu square rice meal', 200.00, 'rice-meals', false);
END $$;

-- ============================================
-- SANDWICHES AND BREADS (NEW)
-- ============================================

DO $$
DECLARE
  ham_egg_id uuid;
  chicken_cheese_id uuid;
  tuna_sandwich_id uuid;
  cheesy_egg_id uuid;
  french_toast_id uuid;
BEGIN
  ham_egg_id := get_or_create_menu_item('Ham and Egg', 'Ham and egg sandwich', 150.00, 'sandwiches', false);
  chicken_cheese_id := get_or_create_menu_item('Chicken and Cheese', 'Chicken and cheese sandwich', 160.00, 'sandwiches', false);
  tuna_sandwich_id := get_or_create_menu_item('Tuna', 'Tuna sandwich', 130.00, 'sandwiches', false);
  cheesy_egg_id := get_or_create_menu_item('Cheesy Egg', 'Cheesy egg sandwich', 130.00, 'sandwiches', false);
  french_toast_id := get_or_create_menu_item('French Toast', 'French toast, 3 pieces', 135.00, 'sandwiches', false);
END $$;

-- ============================================
-- IVAYVATANEN (IVATAN CLASSICS)
-- ============================================

DO $$
DECLARE
  uved_id uuid;
  lunis_id uuid;
  venes_id uuid;
BEGIN
  uved_id := get_or_create_menu_item('Uved', 'Ivatan dish wrapped in ahum leaves', 275.00, 'ivatan', false);
  lunis_id := get_or_create_menu_item('Luñis', 'Native pork cooked in low fire till golden brown', 350.00, 'ivatan', false);
  venes_id := get_or_create_menu_item('Venes', 'Dried gabbi leaves dish', 250.00, 'ivatan', false);
END $$;

