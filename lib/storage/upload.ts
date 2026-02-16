import { supabase } from '@/lib/supabase/client'
import Compressor from 'compressorjs'

const STORAGE_BUCKET = 'facility-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const TARGET_COMPRESSED_SIZE = 300 * 1024 // 300KB

// Compress image using browser-based compression
export const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 0.6,
      maxWidth: 1920,
      maxHeight: 1080,
      convertSize: TARGET_COMPRESSED_SIZE,
      success(result: Blob) {
        resolve(result)
      },
      error(err: Error) {
        reject(err)
      },
    })
  })
}

// Upload single image to Supabase Storage
export const uploadImage = async (
  file: File,
  block: string,
  issueId: string
): Promise<string> => {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`)
  }
  
  // Compress image
  const compressedFile = await compressImage(file)
  
  // Generate unique filename
  const timestamp = Date.now()
  const fileName = `${timestamp}-${file.name.replace(/\s+/g, '-')}`
  const today = new Date().toISOString().split('T')[0]
  const filePath = `${today}/${block}/${issueId}/${fileName}`
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, compressedFile, {
      cacheControl: '3600',
      upsert: false,
    })
  
  if (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload image')
  }
  
  return data.path
}

// Upload multiple images with progress tracking
export const uploadImages = async (
  files: File[],
  block: string,
  issueId: string,
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  const uploadedPaths: string[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    try {
      const path = await uploadImage(file, block, issueId)
      uploadedPaths.push(path)
      
      // Update progress
      if (onProgress) {
        onProgress(Math.round(((i + 1) / files.length) * 100))
      }
    } catch (error) {
      console.error(`Failed to upload image ${i + 1}:`, error)
      // Continue with other images
    }
  }
  
  return uploadedPaths
}

// Get public URL for an image
export const getImageUrl = (path: string): string => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)
  
  return data.publicUrl
}

// Delete image from storage
export const deleteImage = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path])
  
  if (error) {
    console.error('Delete error:', error)
    throw new Error('Failed to delete image')
  }
}

// Delete all images for a specific date
export const cleanupOldImages = async (daysOld: number = 30): Promise<void> => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0]
  
  // List all files older than cutoff date
  const { data: files } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(cutoffDateStr)
  
  if (files && files.length > 0) {
    const paths = files.map(file => `${cutoffDateStr}/${file.name}`)
    await supabase.storage.from(STORAGE_BUCKET).remove(paths)
  }
}