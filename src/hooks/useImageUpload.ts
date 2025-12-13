import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = async (file: File): Promise<string> => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        console.error('Supabase storage upload error:', error);
        // Provide more helpful error messages
        if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
          throw new Error('Storage bucket not configured. Please contact administrator.');
        } else if (error.message?.includes('new row violates row-level security')) {
          throw new Error('Upload permission denied. Please check storage bucket policies.');
        } else if (error.message?.includes('duplicate')) {
          throw new Error('File with this name already exists. Please try again.');
        }
        throw new Error(error.message || 'Failed to upload image. Please try again.');
      }

      if (!data?.path) {
        throw new Error('Upload failed: No file path returned');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(data.path);

      if (!publicUrl) {
        throw new Error('Failed to get image URL');
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<void> => {
    try {
      if (!imageUrl) {
        return; // No image to delete
      }

      // Extract file path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/menu-images/[filename]
      let filePath = imageUrl;
      
      // If it's a full URL, extract the path
      if (imageUrl.includes('/storage/v1/object/public/menu-images/')) {
        const parts = imageUrl.split('/storage/v1/object/public/menu-images/');
        filePath = parts[1] || parts[0];
      } else if (imageUrl.includes('/menu-images/')) {
        const parts = imageUrl.split('/menu-images/');
        filePath = parts[1] || parts[0];
      } else {
        // Assume it's just the filename
        const urlParts = imageUrl.split('/');
        filePath = urlParts[urlParts.length - 1];
      }

      // Remove query parameters if any
      filePath = filePath.split('?')[0];

      if (!filePath) {
        console.warn('Could not extract file path from URL:', imageUrl);
        return;
      }

      const { error } = await supabase.storage
        .from('menu-images')
        .remove([filePath]);

      if (error) {
        console.error('Supabase storage delete error:', error);
        // Don't throw error if file doesn't exist (might have been already deleted)
        if (!error.message?.includes('not found') && !error.message?.includes('does not exist')) {
          throw new Error(error.message || 'Failed to delete image');
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw - allow deletion to fail silently in some cases
      if (error instanceof Error && !error.message.includes('not found')) {
        throw error;
      }
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading,
    uploadProgress
  };
};