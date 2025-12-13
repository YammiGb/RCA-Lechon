/*
  # Fix Storage Bucket for Menu Images
  
  This migration ensures the menu-images bucket exists and has proper policies
  for public read access and anonymous upload access (for admin dashboard).
  
  1. Storage Setup
    - Create 'menu-images' bucket if it doesn't exist
    - Set bucket to be publicly accessible for reading
    - Allow anonymous/public uploads (for admin dashboard without auth)
  
  2. Security
    - Public read access for menu images
    - Public upload access (for admin dashboard)
    - Public update access (for admin dashboard)
    - Public delete access (for admin dashboard)
*/

-- Create storage bucket for menu images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;
DROP POLICY IF EXISTS "public read menu-images" ON storage.objects;
DROP POLICY IF EXISTS "public upload menu-images" ON storage.objects;
DROP POLICY IF EXISTS "public update menu-images" ON storage.objects;
DROP POLICY IF EXISTS "public delete menu-images" ON storage.objects;

-- Allow public read access to menu images
CREATE POLICY "Public read access for menu images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-images');

-- Allow public upload access (for admin dashboard)
CREATE POLICY "Public upload access for menu images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'menu-images');

-- Allow public update access (for admin dashboard)
CREATE POLICY "Public update access for menu images"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'menu-images')
WITH CHECK (bucket_id = 'menu-images');

-- Allow public delete access (for admin dashboard)
CREATE POLICY "Public delete access for menu images"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'menu-images');

