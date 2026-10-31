'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ApiClient } from '../../lib/api';
import { GiantButton } from '../../components/ui/GiantButton';
import {
  Check,
  Scale,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { t, language } = useLanguage();

  const [step, setStep] = useState(1);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(65);
  const [pushupBaseline, setPushupBaseline] = useState(12);
  const [primaryGoal, setPrimaryGoal] = useState('MUSCLE_GAIN');
  const [selectedInjuries, setSelectedInjuries] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'BODYWEIGHT',
    'CHAIR',
    'TOWEL',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const heightM = height / 100;
  const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;

  const getBmiStatus = (val: number) => {
    if (val < 18.5) return { label: language === 'vi' ? 'Thiếu cân / Gầy' : 'Underweight', color: 'text-[#FBBF24]' };
    if (val < 23) return { label: language === 'vi' ? 'Cân đối / Chuẩn thể hình' : 'Normal / Athletic', color: 'text-[#C8F135]' };
    if (val < 25) return { label: language === 'vi' ? 'Thừa cân nhẹ' : 'Slightly Overweight', color: 'text-[#FBBF24]' };
    return { label: language === 'vi' ? 'Cần giảm mỡ / Tiền béo phì' : 'Overweight', color: 'text-rose-400' };
  };

  const getFitnessCategory = (pushups: number) => {
    if (pushups < 8) return { label: language === 'vi' ? 'Mới bắt đầu' : 'Beginner', desc: language === 'vi' ? 'Cần bài tập tựa tường và quỳ gối an toàn' : 'Needs wall and knee-supported safe variations' };
    if (pushups < 20) return { label: language === 'vi' ? 'Nhập môn' : 'Novice', desc: language === 'vi' ? 'Sức mạnh cơ bản, đáp ứng bài tập chuẩn' : 'Solid foundation, standard calisthenics form' };
    if (pushups < 35) return { label: language === 'vi' ? 'Trung cấp' : 'Intermediate', desc: language === 'vi' ? 'Thể lực tốt, sẵn sàng biến thể nâng cao' : 'Strong endurance, ready for progressive overload' };
    return { label: language === 'vi' ? 'Nâng cao' : 'Advanced', desc: language === 'vi' ? 'Vận động viên thể hình tự do' : 'Elite athlete, master calisthenics moves' };
  };

  const injuryOptions = [
    { id: 'WRIST', label: language === 'vi' ? 'Cổ tay' : 'Wrist', desc: language === 'vi' ? 'Tránh chống đẩy phẳng sàn & Burpees' : 'Exclude floor push-ups & Burpees' },
    { id: 'KNEE', label: language === 'vi' ? 'Đầu gối' : 'Knee', desc: language === 'vi' ? 'Tránh Squat sâu & nhảy bật cao' : 'Exclude deep squats & high jumps' },
    { id: 'SHOULDER', label: language === 'vi' ? 'Bả vai' : 'Shoulder', desc: language === 'vi' ? 'Tránh Pike Pushup & gập sâu vai' : 'Exclude overhead pike pushups' },
    { id: 'LOWER_BACK', label: language === 'vi' ? 'Lưng dưới' : 'Lower Back', desc: language === 'vi' ? 'Tránh gập bụng nặng & uốn cong cột sống' : 'Exclude spinal flexion movements' },
    { id: 'NECK', label: language === 'vi' ? 'Cổ' : 'Neck', desc: language === 'vi' ? 'Tránh gồng gập cơ cổ' : 'Exclude neck tension movements' },
    { id: 'ELBOW', label: language === 'vi' ? 'Khuỷu tay' : 'Elbow', desc: language === 'vi' ? 'Tránh khoá khớp & Diamond Pushup' : 'Exclude joint hyperextensions' },
  ];

  const goalOptions = [
    { id: 'MUSCLE_GAIN', label: language === 'vi' ? 'Tăng Cơ' : 'Muscle Hypertrophy', icon: '💪', desc: language === 'vi' ? 'Tập trung khối lượng cơ ngực, lưng, tay và chân' : 'Focus on chest, back, arms, and leg mass' },
    { id: 'FAT_LOSS', label: language === 'vi' ? 'Đốt Mỡ' : 'Fat Loss & Shredding', icon: '🔥', desc: language === 'vi' ? 'Bài tập nhịp tim cao và tiêu hao calo mạnh' : 'High metabolic burn and conditioning' },
    { id: 'ENDURANCE', label: language === 'vi' ? 'Sức Bền Thể Lực' : 'Muscular Endurance', icon: '⚡', desc: language === 'vi' ? 'Tăng số reps và độ dẻo dai cơ bắp' : 'Higher reps capacity and stamina' },
    { id: 'MOBILITY', label: language === 'vi' ? 'Linh Hoạt & Phục Hồi' : 'Mobility & Recovery', icon: '🧘', desc: language === 'vi' ? 'Cải thiện biên độ vận động và phục hồi khớp' : 'Joint range of motion and restorative drills' },
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

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await ApiClient.submitOnboarding({
        height: Number(height),
        weight: Number(weight),
        pushupBaseline: Number(pushupBaseline),
        primaryGoal,
        injuries: selectedInjuries,
        availableEquipment: selectedEquipment,
      });

      await refreshUser();
      router.push('/');
    } catch (e) {
      console.error(e);
      alert('Failed to save onboarding profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 select-none">
      {/* Step Indicator */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs font-black">
          <span className="uppercase tracking-[0.14em] text-[#9BA394]">{t('onboardingHeader')}</span>
          <span className="text-[#C8F135] font-telemetry text-sm">
            {t('stepLabel')} {step} / 4
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 h-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i <= step ? 'bg-[#C8F135] shadow-[0_0_12px_rgba(200,241,53,0.4)]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: Body Metrics & BMI */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-4xl font-black text-white uppercase tracking-tight">
              {t('bmiSectionTitle')}
            </h2>
            <p className="text-sm text-[#9BA394] mt-1 font-medium">
              {t('bmiSectionDesc')}
            </p>
          </div>

          {/* Height Slider */}
          <div className="feature-card rounded-3xl p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-extrabold text-[#C2C9BC] uppercase tracking-wider">
                {t('heightLabel')}
              </span>
              <span className="font-telemetry text-4xl font-black text-[#C8F135]">{height} cm</span>
            </div>
            <input
              type="range"
              min="130"
              max="210"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full h-2.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#C8F135]"
            />
          </div>

          {/* Weight Slider */}
          <div className="feature-card rounded-3xl p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-extrabold text-[#C2C9BC] uppercase tracking-wider">
                {t('weightLabel')}
              </span>
              <span className="font-telemetry text-4xl font-black text-[#C8F135]">{weight} kg</span>
            </div>
            <input
              type="range"
              min="35"
              max="140"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full h-2.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#C8F135]"
            />
          </div>

          {/* Real-time BMI Result Display */}
          <div className="glass-hud border border-[#C8F135]/40 rounded-3xl p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-[#9BA394] uppercase tracking-wider">
                {t('bmiEstLabel')}
              </span>
              <div className="font-telemetry text-5xl font-black text-white mt-1">{bmi}</div>
              <span className={`text-xs font-extrabold uppercase tracking-wider mt-1 inline-block ${getBmiStatus(bmi).color}`}>
                {getBmiStatus(bmi).label}
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#C8F135] text-[#0B0F07] flex items-center justify-center shadow-[0_0_24px_rgba(200,241,53,0.3)]">
              <Scale className="w-7 h-7" />
            </div>
          </div>

          <GiantButton
            variant="primary"
            size="giant"
            onClick={() => setStep(2)}
          >
            {t('continueToTest')}
          </GiantButton>
        </div>
      )}

      {/* STEP 2: Baseline Push-Up Fitness Test */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-4xl font-black text-white uppercase tracking-tight">
              {t('fitnessTestTitle')}
            </h2>
            <p className="text-sm text-[#9BA394] mt-1 font-medium">
              {t('fitnessTestDesc')}
            </p>
          </div>

          <div className="feature-card rounded-3xl p-8 text-center space-y-5">
            <div className="font-telemetry text-7xl font-black text-[#C8F135]">
              {pushupBaseline}{' '}
              <span className="text-xl font-bold text-[#9BA394] font-sans">{t('reps')}</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={pushupBaseline}
              onChange={(e) => setPushupBaseline(Number(e.target.value))}
              className="w-full h-2.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#C8F135]"
            />

            <div className="bg-[#0B0F07]/90 rounded-2xl p-5 text-left border border-[#C8F135]/35">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#C8F135]" />
                <span className="text-xs font-black text-[#C8F135] uppercase tracking-wider">
                  {t('fitnessCategory')} {getFitnessCategory(pushupBaseline).label}
                </span>
              </div>
              <p className="text-xs text-[#C2C9BC] mt-1.5 font-medium">
                {getFitnessCategory(pushupBaseline).desc}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep(1)}
              className="min-h-[58px] px-8 rounded-2xl bg-[#141C0F] hover:bg-[#1C2715] border border-white/15 text-white font-black text-sm uppercase cursor-pointer transition-colors"
            >
              {t('backBtn')}
            </button>
            <GiantButton
              variant="primary"
              size="large"
              onClick={() => setStep(3)}
            >
              {t('continueToGoal')}
            </GiantButton>
          </div>
        </div>
      )}

      {/* STEP 3: Primary Goal */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-4xl font-black text-white uppercase tracking-tight">
              {t('goalSectionTitle')}
            </h2>
            <p className="text-sm text-[#9BA394] mt-1 font-medium">
              {t('goalSectionDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {goalOptions.map((goal) => {
              const isSelected = primaryGoal === goal.id;
              return (
                <div
                  key={goal.id}
                  onClick={() => setPrimaryGoal(goal.id)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#192310] border-[#C8F135] ring-1 ring-[#C8F135] shadow-[0_0_24px_rgba(200,241,53,0.15)]'
                      : 'feature-card border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl">{goal.icon}</span>
                    <div>
                      <h4 className="font-display font-bold text-xl text-white uppercase tracking-wide">
                        {goal.label}
                      </h4>
                      <p className="text-xs text-[#9BA394] mt-0.5 font-medium">{goal.desc}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-7 h-7 rounded-full bg-[#C8F135] text-[#0B0F07] flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep(2)}
              className="min-h-[58px] px-8 rounded-2xl bg-[#141C0F] hover:bg-[#1C2715] border border-white/15 text-white font-black text-sm uppercase cursor-pointer transition-colors"
            >
              {t('backBtn')}
            </button>
            <GiantButton
              variant="primary"
              size="large"
              onClick={() => setStep(4)}
            >
              {t('continueToInjury')}
            </GiantButton>
          </div>
        </div>
      )}

      {/* STEP 4: Injuries & Available Equipment */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-rose-400 mb-1">
              <ShieldAlert className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">
                {t('injurySectionBadge')}
              </span>
            </div>
            <h2 className="font-display text-4xl font-black text-white uppercase tracking-tight">
              {t('injurySectionTitle')}
            </h2>
            <p className="text-sm text-[#9BA394] mt-1 font-medium">
              {t('injurySectionDesc')}
            </p>
          </div>

          {/* Injuries Checklist */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {injuryOptions.map((inj) => {
              const isChecked = selectedInjuries.includes(inj.id);
              return (
                <div
                  key={inj.id}
                  onClick={() => toggleInjury(inj.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[96px] ${
                    isChecked
                      ? 'bg-rose-500/15 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.18)]'
                      : 'feature-card border-white/10 text-[#C2C9BC] hover:border-white/25'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-xs text-white uppercase tracking-wider">
                      {inj.label}
                    </span>
                    {isChecked && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                  </div>
                  <span className="text-[11px] text-[#9BA394] mt-2 leading-tight font-medium">
                    {inj.desc}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Equipment Available */}
          <div className="pt-3">
            <h3 className="text-xs font-black text-[#C8F135] uppercase tracking-[0.14em] mb-3">
              {t('householdEquipLabel')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {equipmentOptions.map((eq) => {
                const isChecked = selectedEquipment.includes(eq.id);
                return (
                  <div
                    key={eq.id}
                    onClick={() => toggleEquipment(eq.id)}
                    className={`p-3.5 rounded-2xl border flex items-center space-x-2.5 cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-[#192310] border-[#C8F135] text-white'
                        : 'feature-card border-white/10 text-[#9BA394] hover:border-white/25'
                    }`}
                  >
                    <span className="text-2xl">{eq.icon}</span>
                    <span className="text-xs font-extrabold">{eq.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => setStep(3)}
              className="min-h-[58px] px-8 rounded-2xl bg-[#141C0F] hover:bg-[#1C2715] border border-white/15 text-white font-black text-sm uppercase cursor-pointer transition-colors"
            >
              {t('backBtn')}
            </button>
            <GiantButton
              variant="primary"
              size="large"
              isLoading={isSubmitting}
              onClick={handleFinish}
            >
              {t('finishOnboardingBtn')}
            </GiantButton>
          </div>
        </div>
      )}
    </div>
  );
}
