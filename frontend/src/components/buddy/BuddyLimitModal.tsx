'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Users, AlertTriangle, X, ArrowRight, UserMinus } from 'lucide-react';

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
  const { t } = useLanguage();
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#D8EACF] rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-[#1B3815] rounded-full bg-[#FAFCF8] border border-slate-200 cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!isConfirmingUnpair ? (
          <div>
            {/* Warning Icon Badge */}
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-3xl bg-[#FEF3C7] border-2 border-[#FDE68A] text-[#D97706] mx-auto flex items-center justify-center mb-3 shadow-inner">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#1B3815]">
                {t('buddyLimitTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium leading-relaxed">
                {errorMessage || t('buddyLimitDesc')}
              </p>
            </div>

            {/* Current Partner Info Card (if available) */}
            {currentPartner && (
              <div className="bg-[#FAFCF8] border-2 border-[#D8EACF] rounded-2xl p-3.5 mb-4 flex items-center space-x-3">
                <div className="relative shrink-0">
                  <img
                    src={currentPartner.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentPartner.name)}`}
                    alt={currentPartner.name}
                    className="w-12 h-12 rounded-xl border-2 border-[#52B72B] object-cover bg-white"
                  />
                  {currentPartner.level && (
                    <span className="absolute -bottom-1 -right-1 bg-[#52B72B] text-[10px] font-black text-white px-1.5 py-0.2 rounded-md">
                      L{currentPartner.level}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {t('currentPartnerLabel')}
                  </span>
                  <h4 className="font-extrabold text-[#1B3815] text-sm truncate">
                    {currentPartner.name}
                  </h4>
                </div>
                <span className="bg-[#EAF6E5] text-[#1B3815] border border-[#52B72B] text-[11px] font-black px-2.5 py-1 rounded-full shrink-0">
                  Active
                </span>
              </div>
            )}

            {/* 1-1 Policy Notice */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-3 mb-5">
              <p className="text-xs text-[#92400E] font-medium leading-relaxed">
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
                  className="w-full min-h-[50px] px-5 rounded-2xl bg-[#52B72B] hover:bg-[#469F24] text-white font-black text-xs uppercase shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>{t('viewCurrentPartnerBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {onUnpair && currentPartner && (
                <button
                  onClick={() => setIsConfirmingUnpair(true)}
                  className="w-full min-h-[46px] px-5 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-black text-xs uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <UserMinus className="w-4 h-4 text-rose-500" />
                  <span>{t('unpairAndSwitchBtn')}</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full min-h-[44px] px-5 rounded-2xl bg-[#FAFCF8] hover:bg-[#EAF6E5] text-[#1B3815] font-bold text-xs uppercase transition-colors cursor-pointer border border-[#D8EACF]"
              >
                {t('understandBtn')}
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation State for Unpairing */
          <div className="text-center py-2 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-600 mx-auto flex items-center justify-center shadow-inner">
              <UserMinus className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-[#1B3815]">
                {t('unpairConfirmTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {t('unpairConfirmDesc')}
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 font-bold">
              Bạn và <strong>{currentPartner?.name}</strong> sẽ kết thúc kết nối đồng đội hiện tại.
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleUnpair}
                disabled={isUnpairing}
                className="w-full min-h-[50px] px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isUnpairing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserMinus className="w-4 h-4" />
                    <span>Xác Nhận Hủy Ghép Đôi</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsConfirmingUnpair(false)}
                disabled={isUnpairing}
                className="w-full min-h-[44px] px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase transition-colors cursor-pointer"
              >
                Quay Lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
