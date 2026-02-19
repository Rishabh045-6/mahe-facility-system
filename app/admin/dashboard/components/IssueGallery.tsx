'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getImageUrl } from '@/lib/storage/upload'

interface IssueGalleryProps {
  images: string[]
}

export default function IssueGallery({ images }: IssueGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const openLightbox = (index: number) => { setCurrentImageIndex(index); setLightboxOpen(true) }
  const closeLightbox = () => setLightboxOpen(false)
  const nextImage = () => setCurrentImageIndex(prev => (prev + 1) % images.length)
  const prevImage = () => setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length)

  return (
    <div>
      {/* Thumbnail grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
        gap: '10px',
      }}>
        {images.map((imagePath, index) => (
          <div
            key={index}
            onClick={() => openLightbox(index)}
            style={{
              aspectRatio: '1',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1.5px solid rgba(180,101,30,0.15)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#B4651E'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(180,101,30,0.2)'
              e.currentTarget.style.transform = 'scale(1.03)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(180,101,30,0.15)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <img
              src={getImageUrl(imagePath)}
              alt={`Issue image ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }}
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.88)',
            zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '900px', width: '100%' }}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              style={{
                position: 'absolute', top: '-48px', right: 0,
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: 'rgba(255,252,247,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,252,247,0.15)'}
            >
              <X size={18} />
            </button>

            {/* Image */}
            <img
              src={getImageUrl(images[currentImageIndex])}
              alt={`Image ${currentImageIndex + 1}`}
              style={{
                maxHeight: '80vh', width: '100%',
                objectFit: 'contain',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />

            {/* Prev / Next */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  style={{
                    position: 'absolute', left: '-52px', top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px', height: '40px', borderRadius: '50%',
                    backgroundColor: 'rgba(255,252,247,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,252,247,0.15)'}
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={nextImage}
                  style={{
                    position: 'absolute', right: '-52px', top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px', height: '40px', borderRadius: '50%',
                    backgroundColor: 'rgba(255,252,247,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,252,247,0.15)'}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Counter */}
            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <span style={{
                display: 'inline-block',
                backgroundColor: 'rgba(255,252,247,0.12)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '0.82rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.85)',
                fontFamily: "'DM Sans', sans-serif",
                backdropFilter: 'blur(4px)',
              }}>
                {currentImageIndex + 1} / {images.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}