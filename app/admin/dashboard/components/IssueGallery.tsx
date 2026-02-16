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
  
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index)
    setLightboxOpen(true)
  }
  
  const closeLightbox = () => {
    setLightboxOpen(false)
  }
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }
  
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((imagePath, index) => (
          <div
            key={index}
            className="aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => openLightbox(index)}
          >
            <img
              src={getImageUrl(imagePath)}
              alt={`Issue image ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.png'
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-600 hover:text-gray-800 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="relative">
              <img
                src={getImageUrl(images[currentImageIndex])}
                alt={`Image ${currentImageIndex + 1}`}
                className="max-h-[80vh] w-full object-contain"
              />
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-80 rounded-full text-gray-600 hover:text-gray-800"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-80 rounded-full text-gray-600 hover:text-gray-800"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
            
            <div className="mt-4 text-center text-white">
              <p className="text-lg font-semibold">
                Image {currentImageIndex + 1} of {images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}