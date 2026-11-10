'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { UserMinus, X } from 'lucide-react';
import { formatPersonName } from '../../lib/catalogTranslations';

interface UnpairConfirmModalProps {
  isOpen: boolean;
  partnerName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function UnpairConfirmModal({
  isOpen,
  partnerName,
  onClose,
  onConfirm,
}: UnpairConfirmModalProps) {
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // safe
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="w-full max-w-md bg-[#F5F5F0] border border-[#D6D6D2] rounded-[14px] p-6 sm:p-7 text-[#333333] relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 text-[#5C5C5C] hover:text-[#C42126] rounded-lg hover:bg-[#EBEBE6] cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal content */}
        <div className="text-center py-1 space-y-4">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#FDE8E9] border border-[#C42126]/30 text-[#C42126]">
            <UserMinus className="w-5 h-5" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#333333] uppercase tracking-tight leading-none">
              {t('unpairConfirmTitle')}
            </h3>
            <p className="text-xs text-[#5C5C5C] leading-relaxed">
              {t('unpairConfirmDesc')}
            </p>
          </div>

          <div className="bg-[#FDE8E9] border border-[#C42126]/25 rounded-lg p-3.5 text-xs text-[#C42126] font-medium">
            {language === 'vi' ? (
              <>
                Bạn và <strong>{formatPersonName(partnerName, language)}</strong> sẽ hủy kết nối đồng hành và chuyển về trạng thái tự do để ghép với người khác.
              </>
            ) : (
              <>
                You and <strong>{formatPersonName(partnerName, language)}</strong> will unpair and become free to connect with another training partner.
              </>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full py-3 px-5 rounded-lg btn-cta-red font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserMinus className="w-4 h-4" />
                  <span>{t('confirmUnpairBtn')}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full py-2.5 px-5 rounded-lg bg-[#EBEBE6] hover:bg-[#D6D6D2]/70 text-[#333333] border border-[#D6D6D2] font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              {t('cancelBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
