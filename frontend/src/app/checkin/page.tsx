'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ApiClient } from '../../lib/api';
import { GiantButton } from '../../components/ui/GiantButton';
import { Utensils, CheckCircle2, Coins } from 'lucide-react';

export default function CheckinPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { t } = useLanguage();

  const [selectedCalorie, setSelectedCalorie] = useState<string>('MAINTENANCE');
  const [energyLevel, setEnergyLevel] = useState<number>(4);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const calorieChoices = [
    {
      id: 'DEFICIT',
      title: t('deficitFull'),
      icon: '🥗',
      subtitle: t('deficitDesc'),
      color: 'border-[#52B72B] bg-[#EAF6E5] text-[#1B3815]',
    },
    {
      id: 'MAINTENANCE',
      title: t('maintenanceFull'),
      icon: '🍱',
      subtitle: t('maintenanceDesc'),
      color: 'border-[#F59E0B] bg-[#FEF3C7] text-[#1B3815]',
    },
    {
      id: 'SURPLUS',
      title: t('surplusFull'),
      icon: '🥩',
      subtitle: t('surplusDesc'),
      color: 'border-[#DC2626] bg-[#FEE2E2] text-[#1B3815]',
    },
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await ApiClient.submitCheckin({
        calorieType: selectedCalorie,
        energyLevel,
        notes,
      });
      await refreshUser();
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (e) {
      console.error(e);
      alert('Failed to submit check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-[#52B72B] mb-1">
          <Utensils className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-wider">
            {t('nutritionOneTap')}
          </span>
        </div>
        <h1 className="text-3xl font-black text-[#1B3815]">{t('energyLevel')}</h1>
        <p className="text-sm text-slate-600 mt-1 font-medium">
          {t('nutritionSubtitle')} <strong className="text-[#D97706]">{t('checkinBonus')}</strong>!
        </p>
      </div>

      {/* 3 Giant Calorie Selection Buttons (Flat solid colors) */}
      <div className="space-y-3">
        {calorieChoices.map((choice) => {
          const isSelected = selectedCalorie === choice.id;
          return (
            <div
              key={choice.id}
              onClick={() => setSelectedCalorie(choice.id)}
              className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between min-h-[80px] ${
                isSelected
                  ? `${choice.color} ring-2 ring-[#52B72B]`
                  : 'bg-white border-[#D8EACF] hover:border-slate-400 text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className="text-4xl">{choice.icon}</span>
                <div>
                  <h4 className="font-black text-base sm:text-lg text-[#1B3815]">{choice.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">{choice.subtitle}</p>
                </div>
              </div>
              {isSelected && <CheckCircle2 className="w-7 h-7 text-[#52B72B] shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Energy Level Selection */}
      <div className="bg-white border-2 border-[#D8EACF] rounded-3xl p-6 space-y-3 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-slate-600 uppercase">{t('energyLevel')}</span>
          <span className="text-lg font-black text-[#D97706]">{energyLevel} / 5</span>
        </div>
        <div className="flex justify-between text-3xl px-2 py-1">
          {['🥱', '😐', '🙂', '⚡', '🔥'].map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => setEnergyLevel(idx + 1)}
              className={`p-3 rounded-2xl transition-transform active:scale-95 cursor-pointer ${
                energyLevel === idx + 1 ? 'bg-[#FEF3C7] scale-125' : 'opacity-50 hover:opacity-100'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Optional Note */}
      <div className="space-y-1.5">
        <label className="block text-xs font-black text-[#1B3815]">{t('nutritionNotes')}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('nutritionNotesPlaceholder')}
          className="w-full bg-white border-2 border-[#D8EACF] rounded-2xl p-4 text-sm text-[#1B3815] focus:outline-none focus:border-[#52B72B] min-h-[90px]"
        />
      </div>

      <GiantButton
        variant="primary"
        size="giant"
        icon={<Coins className="w-6 h-6 text-[#1B3815]" />}
        badge={t('checkinBonus')}
        isLoading={isSubmitting}
        onClick={handleSubmit}
      >
        {isSuccess ? t('checkinSaved') : t('completeCheckin')}
      </GiantButton>
    </div>
  );
}
