'use client'

import { useState, useRef } from 'react'
import { Image as ImageIcon, X, Upload as UploadIcon } from 'lucide-react'
import { MAX_IMAGES_PER_ISSUE } from '@/lib/utils/constants'

interface ImageUploaderProps {
  images: File[]
  onUpload: (files: File[]) => void
  onRemove: (index: number) => void
  disabled?: boolean
}

export default function ImageUploader({
  images,
  onUpload,
  onRemove,
  disabled = false,
}: ImageUploaderProps) {
  // ✅ 1. State defined INSIDE the component
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    setCompressing(true) // ✅ Logic triggers here
    
    try {
      const fileArray = Array.from(files)
      
      // Validate file types
      const validFiles = fileArray.filter(file => 
        file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
      )
      
      if (validFiles.length < fileArray.length) {
        alert('Some files were skipped. Only images under 5MB are allowed.')
      }
      
      // Create preview URLs
      const newPreviews = validFiles.map(file => URL.createObjectURL(file))
      setPreviewUrls(prev => [...prev, ...newPreviews])
      
      // Simulate a small delay so the user sees the spinner (optional, but good UX)
      await new Promise(resolve => setTimeout(resolve, 500))

      onUpload(validFiles)
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setCompressing(false) // ✅ Logic ends here
    }
  }
  
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }
  
  const removeImage = (index: number) => {
    // Revoke preview URL to prevent memory leaks
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index])
    }
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
    onRemove(index)
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">Upload Images</h3>
        <span className="text-sm text-gray-500">
          {images.length}/{MAX_IMAGES_PER_ISSUE} images
        </span>
      </div>
      
      <p className="text-sm text-gray-700 mb-4">
        Upload photos of the issues found. Maximum {MAX_IMAGES_PER_ISSUE} images, each under 5MB.
        Images will be automatically compressed.
      </p>
      
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {images.map((file, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
              <img
                src={previewUrls[index] || URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {!disabled && (
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            <div className="mt-2 text-xs text-gray-700 truncate">
              {file.name.length > 15 ? `${file.name.slice(0, 15)}...` : file.name}
            </div>
          </div>
        ))}
        
        {images.length < MAX_IMAGES_PER_ISSUE && !disabled && (
          <button
            type="button"
            onClick={triggerFileInput}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <UploadIcon className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-500 mt-2">Upload</span>
          </button>
        )}
      </div>
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || images.length >= MAX_IMAGES_PER_ISSUE}
      />
      
      {/* Upload Button (Mobile Friendly) */}
      {images.length < MAX_IMAGES_PER_ISSUE && !disabled && (
        <button
          type="button"
          onClick={triggerFileInput}
          className="w-full flex items-center justify-center px-4 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50 mb-4"
          disabled={images.length >= MAX_IMAGES_PER_ISSUE}
        >
          <UploadIcon className="w-5 h-5 mr-2" />
          Select Images from Device
        </button>
      )}
      
      {/* Info Box */}
      <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
        <div className="flex items-start">
          <ImageIcon className="w-5 h-5 text-blue-400 mt-0.5 mr-2" />
          <div>
            <p className="text-sm font-medium text-blue-800">Image Tips:</p>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Take clear, well-lit photos</li>
              <li>• Show the issue from multiple angles if needed</li>
              <li>• Include context (room number, location)</li>
              <li>• Images will be compressed automatically</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ✅ 2. THE LOADING OVERLAY (Added here) */}
      {compressing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center max-w-sm mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-900 font-medium text-lg">Compressing images...</p>
            <p className="text-sm text-gray-600 mt-2">This may take a few seconds</p>
          </div>
        </div>
      )}
    </div>
  )
}