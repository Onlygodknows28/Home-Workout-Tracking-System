'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache, CACHE_KEYS } from '../../context/DataCacheContext';
import { ApiClient } from '../../lib/api';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Scale,
  ShieldAlert,
  Sparkles,
  HeartPulse,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const { invalidate } = useDataCache();

  const [step, setStep] = useState(1);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(65);
  const [pushupBaseline, setPushupBaseline] = useState(12);
  const [primaryGoal, setPrimaryGoal] = useState('MUSCLE_GAIN');
  const [selectedInjuries, setSelectedInjuries] = useState<string[]>([]);
  const [otherHealthText, setOtherHealthText] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'BODYWEIGHT',
    'CHAIR',
    'TOWEL',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hydratedProfile, setHydratedProfile] = useState(false);

  // Pre-fill existing profile data when recalibrating from Profile page
  useEffect(() => {
    if (user?.profile && !hydratedProfile) {
      const p = user.profile;
      if (typeof p.height === 'number' && p.height >= 130 && p.height <= 210) {
        setHeight(Math.round(p.height));
      }
      if (typeof p.weight === 'number' && p.weight >= 35 && p.weight <= 140) {
        setWeight(Math.round(p.weight));
      }
      if (typeof p.pushupBaseline === 'number' && p.pushupBaseline >= 0) {
        setPushupBaseline(Math.min(60, p.pushupBaseline));
      }
      if (p.primaryGoal) {
        setPrimaryGoal(p.primaryGoal);
      }
      if (Array.isArray(p.injuries)) {
        const standardIds: string[] = [];
        const customNotes: string[] = [];

        p.injuries.forEach((rawInj: string) => {
          const item = rawInj.trim();
          if (item.toUpperCase().startsWith('OTHER:')) {
            if (!standardIds.includes('OTHER')) standardIds.push('OTHER');
            const note = item.slice(6).replace(/;/g, ',').trim();
            if (note) customNotes.push(note);
          } else if (item.toUpperCase() === 'OTHER') {
            if (!standardIds.includes('OTHER')) standardIds.push('OTHER');
          } else if (item.toUpperCase() === 'ELBOW') {
            if (!standardIds.includes('OTHER')) standardIds.push('OTHER');
            customNotes.push(language === 'vi' ? 'Đau khuỷu tay' : 'Elbow pain');
          } else if (item) {
            standardIds.push(item.toUpperCase());
          }
        });

        setSelectedInjuries(standardIds);
        if (customNotes.length > 0) {
          setOtherHealthText(customNotes.join(', '));
        }
      }
      if (Array.isArray(p.availableEquipment) && p.availableEquipment.length > 0) {
        setSelectedEquipment(p.availableEquipment);
      }
      setHydratedProfile(true);
    }
  }, [user, hydratedProfile, language]);

  const heightM = height / 100;
  const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;

  const getBmiStatus = (val: number) => {
    if (val < 18.5) {
      return {
        label: language === 'vi' ? 'Thiếu cân / Gầy' : 'Underweight',
        badgeClass: 'text-[#B45309] bg-[#FEF3C7] border-[#F59E0B]/30',
      };
    }
    if (val < 23) {
      return {
        label: language === 'vi' ? 'Cân đối / Chuẩn thể hình' : 'Normal / Athletic',
        badgeClass: 'text-[#2E7D32] bg-[#E8F5E9] border-[#2E7D32]/25',
      };
    }
    if (val < 25) {
      return {
        label: language === 'vi' ? 'Thừa cân nhẹ' : 'Slightly Overweight',
        badgeClass: 'text-[#B45309] bg-[#FEF3C7] border-[#F59E0B]/30',
      };
    }
    return {
      label: language === 'vi' ? 'Cần giảm mỡ / Tiền béo phì' : 'Overweight',
      badgeClass: 'text-[#C42126] bg-[#FDE8E9] border-[#C42126]/25',
    };
  };

  const getFitnessCategory = (pushups: number) => {
    if (pushups < 8) {
      return {
        label: language === 'vi' ? 'Mới bắt đầu' : 'Beginner',
        desc:
          language === 'vi'
            ? 'Cần bài tập tựa tường và quỳ gối an toàn để xây dựng nền tảng khớp.'
            : 'Needs wall and knee-supported safe variations to build joint stability.',
      };
    }
    if (pushups < 20) {
      return {
        label: language === 'vi' ? 'Nhập môn' : 'Novice',
        desc:
          language === 'vi'
            ? 'Sức mạnh cơ bản tốt, đáp ứng các bài tập Calisthenics tiêu chuẩn.'
            : 'Solid foundation, ready for standard bodyweight calisthenics form.',
      };
    }
    if (pushups < 35) {
      return {
        label: language === 'vi' ? 'Trung cấp' : 'Intermediate',
        desc:
          language === 'vi'
            ? 'Thể lực tốt, sẵn sàng cho các biến thể nâng cao và tăng tải lũy tiến.'
            : 'Strong muscular endurance, ready for progressive overload variations.',
      };
    }
    return {
      label: language === 'vi' ? 'Nâng cao' : 'Advanced',
      desc:
        language === 'vi'
          ? 'Thể lực xuất sắc, mở khóa các tổ hợp bài tập cường độ cao.'
          : 'Elite conditioning, unlocks high-intensity calisthenics progressions.',
    };
  };

  const injuryOptions = [
    {
      id: 'WRIST',
      label: language === 'vi' ? 'Cổ tay' : 'Wrist',
      desc: language === 'vi' ? 'Tránh chống đẩy phẳng sàn & Burpees' : 'Exclude floor push-ups & Burpees',
    },
    {
      id: 'KNEE',
      label: language === 'vi' ? 'Đầu gối' : 'Knee',
      desc: language === 'vi' ? 'Tránh Squat sâu & nhảy bật cao' : 'Exclude deep squats & high jumps',
    },
    {
      id: 'SHOULDER',
      label: language === 'vi' ? 'Bả vai' : 'Shoulder',
      desc: language === 'vi' ? 'Tránh Pike Pushup & ép sâu vai' : 'Exclude overhead pike pushups',
    },
    {
      id: 'LOWER_BACK',
      label: language === 'vi' ? 'Lưng dưới' : 'Lower Back',
      desc: language === 'vi' ? 'Tránh gập bụng nặng & uốn cột sống' : 'Exclude spinal flexion movements',
    },
    {
      id: 'NECK',
      label: language === 'vi' ? 'Cổ' : 'Neck',
      desc: language === 'vi' ? 'Tránh bài gây căng cơ cổ' : 'Exclude neck tension movements',
    },
    {
      id: 'OTHER',
      label: language === 'vi' ? 'Khác / Sức khỏe' : 'Other / Health',
      desc:
        language === 'vi'
          ? 'Điền vấn đề sức khỏe (Tim mạch, Tiền đình, Khớp...)'
          : 'Specify health condition (Cardio, Vertigo, Joint...)',
    },
  ];

  const quickHealthSuggestions =
    language === 'vi'
      ? [
          'Đau cổ chân / Khuỷu tay',
          'Huyết áp cao / Tim mạch',
          'Rối loạn tiền đình / Chóng mặt',
          'Hen suyễn / Khó thở khi gắng sức',
          'Mới ốm dậy / Đang phục hồi',
        ]
      : [
          'Ankle / Elbow pain',
          'Hypertension / Cardiovascular',
          'Vertigo / Dizziness',
          'Asthma / Shortness of breath',
          'Post-illness recovery / Fatigue',
        ];

  const goalOptions = [
    {
      id: 'MUSCLE_GAIN',
      label: language === 'vi' ? 'Tăng Cơ' : 'Muscle Hypertrophy',
      icon: '💪',
      desc:
        language === 'vi'
          ? 'Tập trung phát triển cơ ngực, lưng, tay và chân'
          : 'Focus on chest, back, arms, and leg muscle mass',
    },
    {
      id: 'FAT_LOSS',
      label: language === 'vi' ? 'Đốt Mỡ' : 'Fat Loss & Shredding',
      icon: '🔥',
      desc:
        language === 'vi'
          ? 'Bài tập nhịp tim cao và đốt cháy calo mạnh mẽ'
          : 'High metabolic burn and full-body conditioning',
    },
    {
      id: 'ENDURANCE',
      label: language === 'vi' ? 'Sức Bền Thể Lực' : 'Muscular Endurance',
      icon: '⚡',
      desc:
        language === 'vi'
          ? 'Tăng số lần lặp (reps) và độ dẻo dai cơ bắp'
          : 'Higher rep capacity and athletic stamina',
    },
    {
      id: 'MOBILITY',
      label: language === 'vi' ? 'Linh Hoạt & Phục Hồi' : 'Mobility & Recovery',
      icon: '🧘',
      desc:
        language === 'vi'
          ? 'Cải thiện biên độ vận động và phục hồi khớp'
          : 'Joint range of motion and restorative drills',
    },
  ];

  const equipmentOptions = [
    { id: 'BODYWEIGHT', label: language === 'vi' ? 'Trọng lượng cơ thể' : 'Bodyweight only', icon: '🧍' },
    { id: 'CHAIR', label: language === 'vi' ? 'Ghế ngồi gia đình' : 'Dining Chair', icon: '🪑' },
    { id: 'TOWEL', label: language === 'vi' ? 'Khăn tắm' : 'Bath Towel', icon: '🧣' },
    { id: 'BACKPACK', label: language === 'vi' ? 'Balo tải trọng' : 'Weighted Backpack', icon: '🎒' },
    { id: 'DOOR_FRAME', label: language === 'vi' ? 'Khung cửa phòng' : 'Door Frame', icon: '🚪' },
    { id: 'WATER_BOTTLE', label: language === 'vi' ? 'Chai nước làm tạ' : 'Water Bottle Weights', icon: '🧴' },
  ];

  const toggleInjury = (id: string) => {
    setSelectedInjuries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleEquipment = (id: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const handleAddHealthSuggestion = (chip: string) => {
    setOtherHealthText((prev) => {
      const current = prev.trim();
      if (!current) return chip;
      if (current.toLowerCase().includes(chip.toLowerCase())) return current;
      return `${current}, ${chip}`;
    });
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const finalInjuries = selectedInjuries
        .filter((inj) => inj !== 'OTHER')
        .concat(
          selectedInjuries.includes('OTHER')
            ? [
                `OTHER:${
                  otherHealthText.trim()
                    ? otherHealthText.trim().replace(/,/g, ';')
                    : language === 'vi'
                      ? 'Vấn đề sức khỏe cần lưu ý'
                      : 'Custom health condition'
                }`,
              ]
            : [],
        );

      await ApiClient.submitOnboarding({
        height: Number(height),
        weight: Number(weight),
        pushupBaseline: Number(pushupBaseline),
        primaryGoal,
        injuries: finalInjuries,
        availableEquipment: selectedEquipment,
      });

      invalidate(CACHE_KEYS.RECOMMENDATION);
      invalidate(CACHE_KEYS.TODAY_STATUS);
      await refreshUser();
      router.push('/');
    } catch (e) {
      console.error(e);
      alert(
        language === 'vi'
          ? 'Không thể lưu hồ sơ thể chất. Vui lòng thử lại.'
          : 'Failed to save onboarding profile.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const bmiStatus = getBmiStatus(bmi);
  const fitnessCat = getFitnessCategory(pushupBaseline);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 select-none">
      {/* Step Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#5C5C5C]">
            {t('onboardingHeader')}
          </span>
          <span className="font-telemetry text-xs font-black uppercase tracking-wider text-[#C42126] bg-[#FDE8E9] border border-[#C42126]/20 px-2.5 py-0.5 rounded-full">
            {t('stepLabel')} {step} / 4
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 h-2">
          {[1, 2, 3, 4].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`Step ${i}`}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                i <= step ? 'bg-[#C42126]' : 'bg-[#D6D6D2] hover:bg-[#B8B8B2]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: Body Metrics & BMI */}
      {step === 1 && (
        <div className="space-y-3.5">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-[#333333] uppercase tracking-tight">
              {t('bmiSectionTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5C5C] mt-1 font-medium">
              {t('bmiSectionDesc')}
            </p>
          </div>

          {/* Single-Layer Bento Tile for Step 1 */}
          <div className="bento-tile divide-y divide-[#D6D6D2]">
            {/* Height Row */}
            <div className="p-5 space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-extrabold text-[#5C5C5C] uppercase tracking-wider">
                  {t('heightLabel')}
                </span>
                <span className="font-telemetry text-3xl sm:text-4xl font-black text-[#C42126]">
                  {height} <span className="text-lg font-bold text-[#333333]">cm</span>
                </span>
              </div>
              <input
                type="range"
                min="130"
                max="210"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="onboarding-slider"
              />
              <div className="flex justify-between text-[10px] font-bold text-[#8A8A85] uppercase tracking-wider">
                <span>130 cm</span>
                <span>170 cm</span>
                <span>210 cm</span>
              </div>
            </div>

            {/* Weight Row */}
            <div className="p-5 space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-extrabold text-[#5C5C5C] uppercase tracking-wider">
                  {t('weightLabel')}
                </span>
                <span className="font-telemetry text-3xl sm:text-4xl font-black text-[#C42126]">
                  {weight} <span className="text-lg font-bold text-[#333333]">kg</span>
                </span>
              </div>
              <input
                type="range"
                min="35"
                max="140"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="onboarding-slider"
              />
              <div className="flex justify-between text-[10px] font-bold text-[#8A8A85] uppercase tracking-wider">
                <span>35 kg</span>
                <span>85 kg</span>
                <span>140 kg</span>
              </div>
            </div>

            {/* Real-time BMI Result Display */}
            <div className="p-5 bg-[#F5F5F0]/65 flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black text-[#5C5C5C] uppercase tracking-wider block">
                  {t('bmiEstLabel')}
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-telemetry text-4xl sm:text-5xl font-black text-[#333333] leading-none">
                    {bmi}
                  </span>
                  <span
                    className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${bmiStatus.badgeClass}`}
                  >
                    {bmiStatus.label}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#FDE8E9] border border-[#C42126]/20 text-[#C42126] flex items-center justify-center shrink-0">
                <Scale className="w-6 h-6" />
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-[#EBEBE6]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 px-6 rounded-xl btn-cta-red font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('continueToTest')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Baseline Push-Up Fitness Test */}
      {step === 2 && (
        <div className="space-y-3.5">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-[#333333] uppercase tracking-tight">
              {t('fitnessTestTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5C5C] mt-1 font-medium">
              {t('fitnessTestDesc')}
            </p>
          </div>

          <div className="bento-tile divide-y divide-[#D6D6D2]">
            <div className="p-6 text-center space-y-4">
              <div className="inline-flex items-baseline gap-2">
                <span className="font-telemetry text-6xl sm:text-7xl font-black text-[#333333]">
                  {pushupBaseline}
                </span>
                <span className="text-base sm:text-lg font-extrabold text-[#C42126] uppercase tracking-wider">
                  {t('reps')}
                </span>
              </div>

              <div className="space-y-2 max-w-xl mx-auto">
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={pushupBaseline}
                  onChange={(e) => setPushupBaseline(Number(e.target.value))}
                  className="onboarding-slider"
                />
                <div className="flex justify-between text-[10px] font-bold text-[#8A8A85] uppercase tracking-wider">
                  <span>0</span>
                  <span>15</span>
                  <span>30</span>
                  <span>45</span>
                  <span>60+</span>
                </div>
              </div>
            </div>

            {/* AI Assessment Strip */}
            <div className="px-5 py-4 bg-[#FDE8E9] flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#C42126] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-[#C42126] uppercase tracking-wider block">
                  {t('fitnessCategory')} {fitnessCat.label}
                </span>
                <p className="text-xs text-[#333333] mt-0.5 font-medium leading-relaxed">
                  {fitnessCat.desc}
                </p>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="p-4 bg-[#EBEBE6] flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3.5 px-6 rounded-xl bg-[#F5F5F0] hover:bg-[#E2E2DC] border border-[#D6D6D2] text-[#333333] font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('backBtn')}</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 px-6 rounded-xl btn-cta-red font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('continueToGoal')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Primary Goal */}
      {step === 3 && (
        <div className="space-y-3.5">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-[#333333] uppercase tracking-tight">
              {t('goalSectionTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5C5C] mt-1 font-medium">
              {t('goalSectionDesc')}
            </p>
          </div>

          <div className="bento-tile divide-y divide-[#D6D6D2]">
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goalOptions.map((goal) => {
                const isSelected = primaryGoal === goal.id;
                return (
                  <div
                    key={goal.id}
                    onClick={() => setPrimaryGoal(goal.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#FDE8E9] border-[#C42126] ring-1 ring-[#C42126]'
                        : 'bg-[#F5F5F0] border-[#D6D6D2] hover:border-[#8A8A85]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-3xl shrink-0">{goal.icon}</span>
                      <div className="min-w-0">
                        <h4
                          className={`font-display font-black text-lg uppercase tracking-wide ${
                            isSelected ? 'text-[#C42126]' : 'text-[#333333]'
                          }`}
                        >
                          {goal.label}
                        </h4>
                        <p className="text-xs text-[#5C5C5C] mt-0.5 font-medium leading-snug">
                          {goal.desc}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-[#C42126] border-[#C42126] text-white'
                          : 'bg-[#EBEBE6] border-[#D6D6D2] text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-[#EBEBE6] flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3.5 px-6 rounded-xl bg-[#F5F5F0] hover:bg-[#E2E2DC] border border-[#D6D6D2] text-[#333333] font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('backBtn')}</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 py-3.5 px-6 rounded-xl btn-cta-red font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('continueToInjury')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Injuries & Available Equipment */}
      {step === 4 && (
        <div className="space-y-3.5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[#C42126] bg-[#FDE8E9] border border-[#C42126]/20 px-2.5 py-0.5 rounded-full mb-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                {t('injurySectionBadge')}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-[#333333] uppercase tracking-tight">
              {t('injurySectionTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5C5C] mt-0.5 font-medium">
              {t('injurySectionDesc')}
            </p>
          </div>

          <div className="bento-tile divide-y divide-[#D6D6D2]">
            {/* Injuries Checklist */}
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {injuryOptions.map((inj) => {
                  const isChecked = selectedInjuries.includes(inj.id);
                  return (
                    <div
                      key={inj.id}
                      onClick={() => toggleInjury(inj.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[76px] ${
                        isChecked
                          ? 'bg-[#FDE8E9] border-[#C42126] ring-1 ring-[#C42126]'
                          : 'bg-[#F5F5F0] border-[#D6D6D2] hover:border-[#8A8A85]'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span
                          className={`font-extrabold text-xs uppercase tracking-wider ${
                            isChecked ? 'text-[#C42126]' : 'text-[#333333]'
                          }`}
                        >
                          {inj.label}
                        </span>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            isChecked
                              ? 'bg-[#C42126] border-[#C42126] text-white'
                              : 'bg-[#EBEBE6] border-[#D6D6D2] text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>
                      <span className="text-[11px] text-[#5C5C5C] mt-1.5 leading-snug font-medium">
                        {inj.desc}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Inline Custom Health Condition Input when OTHER is selected */}
              {selectedInjuries.includes('OTHER') && (
                <div className="mt-3.5 pt-3.5 border-t border-[#D6D6D2] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-[#C42126] flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4" />
                      <span>
                        {language === 'vi'
                          ? 'Mô tả vấn đề sức khỏe hoặc chấn thương của bạn'
                          : 'Describe your health condition or injury'}
                      </span>
                    </label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D32] bg-[#E8F5E9] border border-[#2E7D32]/25 px-2 py-0.5 rounded-full">
                      Hybrid AI Adaptive
                    </span>
                  </div>

                  <input
                    type="text"
                    value={otherHealthText}
                    onChange={(e) => setOtherHealthText(e.target.value)}
                    maxLength={180}
                    placeholder={
                      language === 'vi'
                        ? 'VD: Đau cổ chân trái, huyết áp cao, tiền đình, hen suyễn, mới ốm dậy...'
                        : 'e.g., Left ankle sprain, high blood pressure, vertigo, asthma, post-surgery...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F0] border border-[#C42126]/40 focus:border-[#C42126] focus:outline-none text-xs sm:text-sm font-medium text-[#333333] placeholder:text-[#8A8A85]"
                  />

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#5C5C5C] uppercase mr-1">
                      {language === 'vi' ? 'Gợi ý nhanh:' : 'Quick add:'}
                    </span>
                    {quickHealthSuggestions.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleAddHealthSuggestion(chip)}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F5F5F0] hover:bg-[#FDE8E9] text-[#333333] hover:text-[#C42126] border border-[#D6D6D2] hover:border-[#C42126]/40 transition-colors cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-[#5C5C5C] leading-relaxed">
                    {language === 'vi'
                      ? '⚡ Hybrid AI (Medical Rule Engine + Gemini LLM) sẽ tự động loại bỏ bài tập chống chỉ định, điều chỉnh ngưỡng độ khó, giảm số reps hoặc tăng thời gian nghỉ phù hợp với thể trạng của bạn.'
                      : '⚡ Hybrid AI (Medical Rule Engine + Gemini LLM) automatically filters contraindicated drills, caps intensity, and adapts reps/rest intervals to protect your health.'}
                  </p>
                </div>
              )}
            </div>

            {/* Equipment Available */}
            <div className="p-4 sm:p-5">
              <h3 className="text-[11px] font-black text-[#5C5C5C] uppercase tracking-[0.14em] mb-2.5">
                {t('householdEquipLabel')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {equipmentOptions.map((eq) => {
                  const isChecked = selectedEquipment.includes(eq.id);
                  return (
                    <div
                      key={eq.id}
                      onClick={() => toggleEquipment(eq.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#FDE8E9] border-[#C42126] ring-1 ring-[#C42126] text-[#C42126]'
                          : 'bg-[#F5F5F0] border-[#D6D6D2] text-[#333333] hover:border-[#8A8A85]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{eq.icon}</span>
                        <span className="text-xs font-extrabold truncate">{eq.label}</span>
                      </div>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[#C42126] shrink-0 stroke-[3]" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="p-4 bg-[#EBEBE6] flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-3.5 px-6 rounded-xl bg-[#F5F5F0] hover:bg-[#E2E2DC] border border-[#D6D6D2] text-[#333333] font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('backBtn')}</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinish}
                className="flex-1 py-3.5 px-6 rounded-xl btn-cta-red font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{isSubmitting ? '...' : t('finishOnboardingBtn')}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
