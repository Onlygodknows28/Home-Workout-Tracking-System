'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { GiantButton } from '../ui/GiantButton';
import { Gift, Shield, X, Heart } from 'lucide-react';

interface GiftFreezeModalProps {
  isOpen: boolean;
  partnerName: string;
  myFreezeCount: number;
  onClose: () => void;
  onSendGift: (note: string) => Promise<void>;
}

export function GiftFreezeModal({
  isOpen,
  partnerName,
  myFreezeCount,
  onClose,
  onSendGift,
}: GiftFreezeModalProps) {
  const { t } = useLanguage();
  const [note, setNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSendGift(note);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSending) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="w-full max-w-md bg-[#F5F5F0] border border-[#D6D6D2] rounded-[14px] p-6 sm:p-7 text-[#333333] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#5C5C5C] hover:text-[#C42126] rounded-lg hover:bg-[#EBEBE6] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div>
            <div className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#EBEBE6] border border-[#D6D6D2] text-[#C42126] mb-2.5">
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#333333] uppercase tracking-tight leading-none">
                {t('giftModalTitle')}
              </h3>
              <p className="text-xs text-[#5C5C5C] mt-1.5 leading-relaxed">
                {t('giftModalDesc')}
              </p>
            </div>

            {/* Inventory Status (Flush 1px Hairline Row) */}
            <div className="py-3.5 mb-4 border-y border-[#D6D6D2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#2E7D32]" />
                <span className="text-xs font-bold text-[#333333]">{t('myFreezesCount')}</span>
              </div>
              <span className="font-telemetry text-sm font-bold text-[#2E7D32]">
                {myFreezeCount} {t('freezes')}
              </span>
            </div>

            {/* Note input */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-[#333333] mb-1.5">
                {t('giftNoteLabel')} ({partnerName})
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('giftNotePlaceholder')}
                className="w-full bg-[#EBEBE6] border border-[#D6D6D2] rounded-lg p-3 text-sm text-[#333333] placeholder:text-[#5C5C5C]/70 focus:outline-none focus:border-[#C42126] min-h-[80px]"
              />
            </div>

            <GiantButton
              variant="primary"
              size="large"
              icon={<Heart className="w-5 h-5 fill-white" />}
              disabled={myFreezeCount <= 0 || isSending}
              isLoading={isSending}
              onClick={handleSend}
            >
              {myFreezeCount > 0 ? t('confirmGift') : t('outOfFreezes')}
            </GiantButton>
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EBEBE6] border border-[#D6D6D2] text-[#2E7D32] mb-1">
              <Gift className="w-6 h-6" />
            </div>
            <h4 className="font-display text-3xl font-extrabold text-[#333333] uppercase">
              {t('giftSuccessTitle')}
            </h4>
            <p className="text-xs text-[#5C5C5C] leading-relaxed">
              {t('giftSuccessDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
