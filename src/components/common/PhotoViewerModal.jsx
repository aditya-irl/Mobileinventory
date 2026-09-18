import React, { useEffect, useState, useRef } from 'react';
import { getSafeImageUrl } from '../../utils/formatters';
import { X, ChevronLeft, ChevronRight, FileText, Smartphone, Download, ZoomIn } from 'lucide-react';

export const PhotoViewerModal = ({
  isOpen,
  onClose,
  photos = [],
  initialIndex = 0,
  category = 'Document Photo', // 'Document Photo' | 'Device Photo'
  title = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, (photos.length || 1) - 1)));
    }
  }, [isOpen, initialIndex, photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, photos.length]);

  if (!isOpen || !photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const safeUrl = getSafeImageUrl(currentPhoto);
  const isDocument = category.toLowerCase().includes('document');

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || !e.changedTouches || !e.changedTouches[0]) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swipe Right -> Previous
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
      } else {
        // Swipe Left -> Next
        setCurrentIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
      }
    }
    touchStartX.current = null;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(8px)',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(12px, env(safe-area-inset-left))',
        paddingRight: 'max(12px, env(safe-area-inset-right))',
        userSelect: 'none'
      }}
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          color: '#fff',
          zIndex: 10
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Category Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              backgroundColor: isDocument ? 'rgba(5, 150, 105, 0.25)' : 'rgba(99, 102, 241, 0.25)',
              color: isDocument ? '#34d399' : '#818cf8',
              border: `1px solid ${isDocument ? 'rgba(5, 150, 105, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`
            }}
          >
            {isDocument ? <FileText size={14} /> : <Smartphone size={14} />}
            <span>{category}</span>
          </div>

          {title && (
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)' }}>
              {title}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Photo Counter */}
          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.85)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              padding: '4px 10px',
              borderRadius: '999px'
            }}
          >
            {currentIndex + 1} / {photos.length}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#fff',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            title="Close (Esc)"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '12px'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Button */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
            }}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
            title="Previous Photo (Left Arrow)"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* The Full Image */}
        <div
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            key={currentIndex}
            src={safeUrl}
            alt={`${category} ${currentIndex + 1}`}
            style={{
              maxWidth: '90vw',
              maxHeight: photos.length > 1 ? '70vh' : '80vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              animation: 'fadeIn 0.2s ease-in-out'
            }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        {/* Next Button */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
            }}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
            title="Next Photo (Right Arrow)"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnails Strip (if multiple photos exist) */}
      {photos.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            overflowX: 'auto',
            padding: '12px 16px',
            zIndex: 10
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((url, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '6px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: currentIndex === idx ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.25)',
                opacity: currentIndex === idx ? 1 : 0.5,
                transform: currentIndex === idx ? 'scale(1.08)' : 'scale(1)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <img
                src={getSafeImageUrl(url)}
                alt={`Thumb ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
