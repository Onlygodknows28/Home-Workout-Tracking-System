'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { UserMinus, X } from 'lucide-react';

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
  const { t } = useLanguage();
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-rose-100 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-50 border border-slate-200 cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal content */}
        <div className="text-center py-2 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-600 mx-auto flex items-center justify-center shadow-inner">
            <UserMinus className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-black text-[#1B3815]">
              {t('unpairConfirmTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {t('unpairConfirmDesc')}
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-800 font-bold">
            Bạn và <strong>{partnerName}</strong> sẽ hủy kết nối đồng hành và chuyển về trạng thái tự do để ghép với người khác.
          </div>

          {/* Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full min-h-[50px] px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              className="w-full min-h-[44px] px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase transition-colors cursor-pointer"
            >
              {t('cancelBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
