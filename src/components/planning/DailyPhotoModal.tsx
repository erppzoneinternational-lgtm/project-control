'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ExternalLink, 
  Camera, 
  Calendar, 
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { DailyProgressPhoto } from '@/types/planning';

interface DailyPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: DailyProgressPhoto[];
  initialIndex?: number;
  reportNo?: number | string;
  progressDate?: string;
  disciplineLabel?: string;
}

export const DailyPhotoModal: React.FC<DailyPhotoModalProps> = ({
  isOpen,
  onClose,
  photos = [],
  initialIndex = 0,
  reportNo,
  progressDate,
  disciplineLabel,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Sync initialIndex when modal opens
  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement | null;
      setCurrentIndex(Math.max(0, Math.min(initialIndex, photos.length - 1)));
      setImageError(false);
      setImageLoaded(false);

      // Focus close button on next tick
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    } else {
      // Restore focus to trigger when closing
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus();
      }
    }
  }, [isOpen, initialIndex, photos.length]);

  // Reset image load state on photo switch
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [currentIndex]);

  const currentPhoto = photos[currentIndex];

  const handleNext = useCallback(() => {
    if (photos.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePrev = useCallback(() => {
    if (photos.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation & Focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
        return;
      }

      // Trap focus
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen || !currentPhoto) return null;

  // Rich accessible alt description
  const accessibleAltText = currentPhoto.caption
    ? `${currentPhoto.caption} — صورة توثيق موقع ليومية #${reportNo || 'بدون رقم'} (${progressDate || 'تاريخ غير محدد'})`
    : `صورة توثيق ميداني رقم ${currentIndex + 1} من إجمالي ${photos.length} ليومية #${reportNo || 'بدون رقم'} بتاريخ ${progressDate || 'غير محدد'}`;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-modal-title"
      aria-describedby="photo-modal-caption"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-900/80 border-b border-slate-800 text-white z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 id="photo-modal-title" className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>معاينة الصورة الميدانية</span>
              {photos.length > 1 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {currentIndex + 1} من {photos.length}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              {reportNo && (
                <span className="font-mono">يومية #{reportNo}</span>
              )}
              {progressDate && (
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{progressDate}</span>
                </span>
              )}
              {disciplineLabel && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                  {disciplineLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {currentPhoto.photo_url && (
            <a
              href={currentPhoto.photo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              title="فتح الصورة بحجمها الأصلي في علامة تبويب جديدة"
              aria-label="فتح الصورة بالحجم الكامل في نافذة جديدة"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">الحجم الأصلي</span>
            </a>
          )}

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 border border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-rose-500"
            title="إغلاق النافذة (Esc)"
            aria-label="إغلاق نافذة معاينة الصورة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Navigation Button: Previous (Right side in RTL) */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute end-4 sm:end-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="الصورة السابقة (سهم يمين)"
            title="الصورة السابقة"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Central Display */}
        <div className="relative max-w-5xl max-h-[75vh] w-full flex items-center justify-center">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">جاري تحميل الصورة بجودة عالية...</span>
            </div>
          )}

          {imageError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
              <AlertCircle className="w-12 h-12 text-rose-500" />
              <div className="font-bold text-white text-sm">تعذر تحميل هذه الصورة الميدانية</div>
              <p className="text-xs text-slate-400 max-w-sm">
                قد يكون مسار الصورة غير متوفر أو انتهت صلاحية الرابط المؤقت.
              </p>
            </div>
          ) : (
            <img
              src={currentPhoto.photo_url}
              alt={accessibleAltText}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>

        {/* Navigation Button: Next (Left side in RTL) */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute start-4 sm:start-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="الصورة التالية (سهم يسار)"
            title="الصورة التالية"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Caption & Thumbnail Strip */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 sm:px-6 py-3 shrink-0 space-y-3 z-10">
        {/* Caption */}
        <div id="photo-modal-caption" className="flex items-center justify-center text-center">
          {currentPhoto.caption ? (
            <p className="text-xs sm:text-sm text-slate-200 font-medium bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700 max-w-2xl truncate">
              {currentPhoto.caption}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">
              لا يوجد تعليق مضاف لهذه الصورة
            </p>
          )}
        </div>

        {/* Thumbnail Filmstrip */}
        {photos.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 max-w-3xl mx-auto">
            {photos.map((photo, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={photo.id || idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden border-2 transition duration-200 relative ${
                    isSelected
                      ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                      : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                  }`}
                  aria-label={`عرض الصورة ${idx + 1}`}
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || `صورة مصغرة ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
