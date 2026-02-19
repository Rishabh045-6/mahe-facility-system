'use client'

import { useState, useRef } from 'react'
import { Image as ImageIcon, X, Upload as UploadIcon, Camera } from 'lucide-react'
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
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setCompressing(true)
    try {
      const fileArray = Array.from(files)
      const validFiles = fileArray.filter(file =>
        file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
      )
      if (validFiles.length < fileArray.length) {
        alert('Some files were skipped. Only images under 5MB are allowed.')
      }
      const newPreviews = validFiles.map(file => URL.createObjectURL(file))
      setPreviewUrls(prev => [...prev, ...newPreviews])
      await new Promise(resolve => setTimeout(resolve, 500))
      onUpload(validFiles)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setCompressing(false)
    }
  }

  const triggerFileInput = () => fileInputRef.current?.click()

  const removeImage = (index: number) => {
    if (previewUrls[index]) URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
    onRemove(index)
  }

  const remaining = MAX_IMAGES_PER_ISSUE - images.length

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <h3 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#1a1208',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Camera size={18} color="#B4651E" />
          Upload Images
        </h3>
        <span style={{
          fontSize: '0.8rem',
          fontWeight: '600',
          color: images.length >= MAX_IMAGES_PER_ISSUE ? '#dc2626' : '#7a6a55',
          backgroundColor: images.length >= MAX_IMAGES_PER_ISSUE ? '#fee2e2' : '#fdf6ef',
          border: `1px solid ${images.length >= MAX_IMAGES_PER_ISSUE ? 'rgba(220,38,38,0.2)' : 'rgba(180,101,30,0.15)'}`,
          borderRadius: '20px',
          padding: '3px 10px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {images.length}/{MAX_IMAGES_PER_ISSUE}
        </span>
      </div>

      <p style={{
        fontSize: '0.85rem',
        color: '#7a6a55',
        margin: '0 0 20px',
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1.5,
      }}>
        Upload photos of the issues found. Maximum {MAX_IMAGES_PER_ISSUE} images, each under 5MB.
      </p>

      {/* Image grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {images.map((file, index) => (
          <div key={index} style={{ position: 'relative' }}>
            <div style={{
              aspectRatio: '1',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1.5px solid rgba(180, 101, 30, 0.15)',
              backgroundColor: '#fdf6ef',
            }}>
              <img
                src={previewUrls[index] || URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={() => removeImage(index)}
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              >
                <X size={13} />
              </button>
            )}

            <p style={{
              fontSize: '0.72rem',
              color: '#7a6a55',
              marginTop: '6px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {file.name.length > 14 ? `${file.name.slice(0, 14)}…` : file.name}
            </p>
          </div>
        ))}

        {/* Add more slot */}
        {images.length < MAX_IMAGES_PER_ISSUE && !disabled && (
          <button
            type="button"
            onClick={triggerFileInput}
            style={{
              aspectRatio: '1',
              border: '1.5px dashed rgba(180, 101, 30, 0.3)',
              borderRadius: '12px',
              backgroundColor: '#fdf6ef',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              color: '#B4651E',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#faeaD8'
              e.currentTarget.style.borderColor = '#B4651E'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fdf6ef'
              e.currentTarget.style.borderColor = 'rgba(180, 101, 30, 0.3)'
            }}
          >
            <UploadIcon size={22} color="#B4651E" />
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#B4651E',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Add
            </span>
          </button>
        )}
      </div>

      {/* Main upload button */}
      {images.length < MAX_IMAGES_PER_ISSUE && !disabled && (
        <button
          type="button"
          onClick={triggerFileInput}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            backgroundColor: 'transparent',
            border: '1.5px solid #B4651E',
            borderRadius: '10px',
            color: '#B4651E',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s',
            marginBottom: '16px',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fdf6ef'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <UploadIcon size={16} />
          Select Images from Device
          {remaining > 0 && (
            <span style={{
              fontSize: '0.75rem',
              color: '#7a6a55',
              fontWeight: '400',
            }}>
              ({remaining} remaining)
            </span>
          )}
        </button>
      )}

      {/* Tips */}
      <div style={{
        backgroundColor: '#fdf6ef',
        border: '1px solid rgba(180, 101, 30, 0.15)',
        borderLeft: '3px solid #B4651E',
        borderRadius: '0 10px 10px 0',
        padding: '14px 16px',
        display: 'flex',
        gap: '12px',
      }}>
        <ImageIcon size={18} color="#B4651E" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            color: '#B4651E',
            margin: '0 0 6px',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Image Tips
          </p>
          <ul style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}>
            {[
              'Take clear, well-lit photos',
              'Show the issue from multiple angles if needed',
              'Include context (room number, location)',
              'Images will be compressed automatically',
            ].map((tip, i) => (
              <li key={i} style={{
                fontSize: '0.8rem',
                color: '#7a6a55',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
              }}>
                <span style={{ color: '#B4651E', fontWeight: '700', flexShrink: 0 }}>·</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || images.length >= MAX_IMAGES_PER_ISSUE}
      />

      {/* Compressing overlay */}
      {compressing && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 252, 247, 0.98)',
            border: '1px solid rgba(180, 101, 30, 0.15)',
            borderRadius: '18px',
            padding: '36px 40px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '3px solid rgba(180,101,30,0.2)',
              borderTopColor: '#B4651E',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#1a1208',
              margin: '0 0 6px',
            }}>
              Processing images...
            </p>
            <p style={{
              fontSize: '0.85rem',
              color: '#7a6a55',
              margin: 0,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              This may take a few seconds
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  )
}