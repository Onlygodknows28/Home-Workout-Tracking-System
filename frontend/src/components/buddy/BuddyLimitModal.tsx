'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Users, AlertTriangle, X, ArrowRight, UserMinus } from 'lucide-react';
import { formatPersonName } from '../../lib/catalogTranslations';

interface BuddyLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPartner?: {
    id?: string;
    name: string;
    avatar?: string;
    level?: number;
  } | null;
  errorMessage?: string;
  onViewCurrentPartner?: () => void;
  onUnpair?: () => Promise<void>;
}

export function BuddyLimitModal({
  isOpen,
  onClose,
  currentPartner,
  errorMessage,
  onViewCurrentPartner,
  onUnpair,
}: BuddyLimitModalProps) {
  const { t, language } = useLanguage();
  const [isConfirmingUnpair, setIsConfirmingUnpair] = useState(false);
  const [isUnpairing, setIsUnpairing] = useState(false);

  if (!isOpen) return null;

  const handleUnpair = async () => {
    if (!onUnpair) return;
    setIsUnpairing(true);
    try {
      await onUnpair();
      setIsConfirmingUnpair(false);
      onClose();
    } catch {
      // Bắt lỗi an toàn
    } finally {
      setIsUnpairing(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="w-full max-w-md bg-[#F5F5F0] border border-[#D6D6D2] rounded-[14px] p-6 sm:p-7 text-[#333333] relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#5C5C5C] hover:text-[#C42126] rounded-lg hover:bg-[#EBEBE6] cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!isConfirmingUnpair ? (
          <div>
            {/* Editorial Warning Header */}
            <div className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#EBEBE6] border border-[#D6D6D2] text-[#C42126] mb-2.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#333333] uppercase tracking-tight leading-none">
                {t('buddyLimitTitle')}
              </h3>
              <p className="text-xs text-[#5C5C5C] mt-2 leading-relaxed">
                {errorMessage || t('buddyLimitDesc')}
              </p>
            </div>

            {/* Current Partner Flush 1px Hairline Row (Zero nested card box!) */}
            {currentPartner && (
              <div className="py-3.5 mb-4 border-y border-[#D6D6D2] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      currentPartner.avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentPartner.name)}`
                    }
                    alt={currentPartner.name}
                    className="w-11 h-11 rounded-full border border-[#D6D6D2] object-cover bg-[#EBEBE6] shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#5C5C5C] uppercase tracking-wider block">
                      {t('currentPartnerLabel')}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <h4 className="font-bold text-[#333333] text-sm truncate">
                        {formatPersonName(currentPartner.name, language)}
                      </h4>
                      {currentPartner.level && (
                        <span className="font-telemetry text-xs font-bold text-[#C42126] shrink-0">
                          • L{currentPartner.level}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E7D32] shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                  <span>Active</span>
                </span>
              </div>
            )}

            {/* 1-1 Policy Notice */}
            <div className="bg-[#FDE8E9] border border-[#C42126]/25 rounded-lg p-3 mb-5">
              <p className="text-xs text-[#C42126] font-medium leading-relaxed">
                💡 {t('buddyLimitHint')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              {onViewCurrentPartner && (
                <button
                  onClick={() => {
                    onClose();
                    onViewCurrentPartner();
                  }}
                  className="w-full py-3 px-5 rounded-lg bg-[#333333] hover:bg-[#1F1F1F] text-[#FFFFFF] font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>{t('viewCurrentPartnerBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {onUnpair && currentPartner && (
                <button
                  onClick={() => setIsConfirmingUnpair(true)}
                  className="w-full py-2.5 px-5 rounded-lg bg-[#FDE8E9] hover:bg-[#C42126] text-[#C42126] hover:text-[#FFFFFF] border border-[#C42126]/30 font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserMinus className="w-4 h-4" />
                  <span>{t('unpairAndSwitchBtn')}</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 px-5 rounded-lg bg-[#EBEBE6] hover:bg-[#D6D6D2]/70 text-[#333333] font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-[#D6D6D2]"
              >
                {t('understandBtn')}
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation State for Unpairing */
          <div className="text-center py-1 space-y-4">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#FDE8E9] border border-[#C42126]/30 text-[#C42126]">
              <UserMinus className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display text-3xl font-extrabold text-[#333333] uppercase tracking-tight leading-none">
                {t('unpairConfirmTitle')}
              </h3>
              <p className="text-xs text-[#5C5C5C] leading-relaxed">
                {t('unpairConfirmDesc')}
              </p>
            </div>

            <div className="bg-[#FDE8E9] border border-[#C42126]/25 rounded-lg p-3 text-xs text-[#C42126] font-medium">
              {language === 'vi' ? (
                <>
                  Bạn và <strong>{formatPersonName(currentPartner?.name, language)}</strong> sẽ kết thúc kết nối đồng đội hiện tại.
                </>
              ) : (
                <>
                  You and <strong>{formatPersonName(currentPartner?.name, language)}</strong> will end your current buddy connection.
                </>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                onClick={handleUnpair}
                disabled={isUnpairing}
                className="w-full py-3 px-5 rounded-lg btn-cta-red font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUnpairing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserMinus className="w-4 h-4" />
                    <span>{t('confirmUnpairBtn')}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsConfirmingUnpair(false)}
                disabled={isUnpairing}
                className="w-full py-2.5 px-5 rounded-lg bg-[#EBEBE6] hover:bg-[#D6D6D2]/70 text-[#333333] border border-[#D6D6D2] font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
