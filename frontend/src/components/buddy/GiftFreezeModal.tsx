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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#D8EACF] rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-[#1B3815] rounded-full bg-[#FAFCF8] border border-slate-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-[#EAF6E5] text-[#52B72B] mx-auto flex items-center justify-center mb-3">
                <Gift className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#1B3815]">{t('giftModalTitle')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                {t('giftModalDesc')}
              </p>
            </div>

            {/* Inventory Status */}
            <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-2xl p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Shield className="w-5 h-5 text-[#D97706]" />
                <span className="text-xs font-bold text-[#1B3815]">{t('myFreezesCount')}</span>
              </div>
              <span className="text-sm font-black text-[#D97706]">{myFreezeCount} {t('freezes')}</span>
            </div>

            {/* Note input */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-[#1B3815] mb-1.5">
                {t('giftNoteLabel')}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('giftNotePlaceholder')}
                className="w-full bg-[#FAFCF8] border border-[#D8EACF] rounded-xl p-3 text-sm text-[#1B3815] focus:outline-none focus:border-[#52B72B] min-h-[80px]"
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
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-[#EAF6E5] text-[#52B72B] mx-auto flex items-center justify-center mb-3">
              <Gift className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-[#1B3815]">{t('giftSuccessTitle')}</h4>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {t('giftSuccessDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
