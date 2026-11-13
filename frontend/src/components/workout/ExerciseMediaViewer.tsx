'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Play, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';

interface ExerciseMediaViewerProps {
  mediaUrl?: string | null;
  exerciseName: string;
  instructions?: string | null;
}

export function ExerciseMediaViewer({
  mediaUrl,
  exerciseName,
  instructions,
}: ExerciseMediaViewerProps) {
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!mediaUrl || hasError) {
    return null;
  }

  const isVideoFormat = /\.(mp4|webm|ogg)(\?.*)?$/i.test(mediaUrl);

  return (
    <div className="w-full bg-[#EBEBE6] border border-[#D6D6D2] rounded-[14px] overflow-hidden select-none transition-all">
      {/* Header Bar */}
      <div className="px-3.5 py-2 bg-[#F5F5F0] border-b border-[#D6D6D2] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[#C42126] font-bold uppercase tracking-wider text-[11px]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('formGuideTitle')}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="text-[#5C5C5C] hover:text-[#333333] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          title={isCollapsed ? t('showFormAnimation') : t('hideFormAnimation')}
        >
          {isCollapsed ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>{t('showFormAnimation')}</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>{t('hideFormAnimation')}</span>
            </>
          )}
        </button>
      </div>

      {/* Media Content */}
      {!isCollapsed && (
        <div className="relative w-full bg-[#1A1A1A] flex items-center justify-center overflow-hidden min-h-[200px] max-h-[320px] aspect-[16/10]">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EBEBE6] space-y-2 z-10">
              <div className="w-6 h-6 border-2 border-[#C42126] border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] font-semibold text-[#5C5C5C]">
                Loading demonstration...
              </span>
            </div>
          )}

          {isVideoFormat ? (
            <video
              src={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              className="w-full h-full object-contain max-h-[320px]"
              aria-label={`Video demonstration of ${exerciseName}`}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={`Demonstration of ${exerciseName}`}
              loading="lazy"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              className="w-full h-full object-contain max-h-[320px]"
            />
          )}
        </div>
      )}

      {/* Optional Instructions caption if available */}
      {instructions && !isCollapsed && (
        <div className="px-3.5 py-2 bg-[#F5F5F0] border-t border-[#D6D6D2] text-xs text-[#5C5C5C] leading-relaxed">
          <strong className="text-[#333333]">Kỹ thuật:</strong> {instructions}
        </div>
      )}
    </div>
  );
}
