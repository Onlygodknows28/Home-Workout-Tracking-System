'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SmartReminderCard } from '../../components/notifications/SmartReminderCard';
import { Settings, Globe, Smartphone, Sliders, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isAuthReady } = useAuth();
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, isAuthReady, router]);

  if (isLoading || !isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-center">
        <div className="w-10 h-10 border-3 border-[#C42126] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#5C5C5C] font-semibold">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1080px] mx-auto px-5 sm:px-8 py-6 sm:py-8 space-y-6 select-none">
      {/* Open-Canvas Header separated by 1px #D6D6D2 hairline */}
      <div className="pb-5 border-b border-[#D6D6D2] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#C42126] flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'CÀI ĐẶT HỆ THỐNG' : 'SYSTEM SETTINGS'}</span>
          </span>
          <h1 className="font-display text-[40px] sm:text-[48px] font-extrabold text-[#333333] leading-none mt-1 uppercase">
            {language === 'vi' ? 'CÀI ĐẶT & THÔNG BÁO' : 'SETTINGS & NOTIFICATIONS'}
          </h1>
          <p className="text-xs text-[#5C5C5C] mt-1.5">
            {language === 'vi'
              ? 'Quản lý thông báo đẩy Firebase Cloud Messaging (FCM), khung giờ nhắc tập hằng ngày và tùy chọn hiển thị.'
              : 'Manage Firebase Cloud Messaging (FCM) push notifications, daily workout reminder schedule, and display preferences.'}
          </p>
        </div>
      </div>

      {/* Main Feature: Notification & Daily Workout Reminder Settings */}
      <SmartReminderCard />

      {/* Mobile Notification Guide & System Preferences (Single-Layer 2-Column Bento Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 Cols: Mobile Phone Notification Delivery Guide (Android & iPhone) */}
        <div className="md:col-span-7 bento-tile p-6 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="pb-2.5 border-b border-[#D6D6D2] flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#333333]">
              <Smartphone className="w-4 h-4 text-[#C42126]" />
              <span>
                {language === 'vi'
                  ? 'Hướng Dẫn Nhận Thông Báo Trên Điện Thoại'
                  : 'Mobile Phone Notification Delivery Guide'}
              </span>
            </div>

            <div className="divide-y divide-[#D6D6D2] text-xs text-[#5C5C5C] leading-relaxed">
              <div className="py-2.5">
                <strong className="text-[#333333] block mb-0.5">
                  {language === 'vi'
                    ? '1. Điện thoại Android (Chrome / Edge / Samsung Internet)'
                    : '1. Android Phones (Chrome / Edge / Samsung Internet)'}
                </strong>
                <span>
                  {language === 'vi'
                    ? 'Chỉ cần bấm nút "Bật Thông Báo Đẩy (FCM Web Push)" ở trên và chọn Cho phép. Thông báo nhắc tập sẽ hiển thị trực tiếp trên Màn hình khóa & Thanh kéo thông báo của điện thoại.'
                    : 'Simply tap "Enable FCM Web Push" above and allow permissions. Workout reminders will appear directly on your phone Lock Screen & Notification Drawer.'}
                </span>
              </div>

              <div className="py-2.5">
                <strong className="text-[#333333] block mb-0.5">
                  {language === 'vi'
                    ? '2. Điện thoại iPhone / iOS (Safari PWA hoặc Lịch .ICS)'
                    : '2. iPhone / iOS Devices (Safari PWA or .ICS Alarm)'}
                </strong>
                <span>
                  {language === 'vi'
                    ? 'Trên Safari iPhone, hãy bấm nút Chia sẻ (Share) ➔ "Thêm vào màn hình chính" (Add to Home Screen) để bật Web Push trên màn hình khóa iOS, hoặc bấm nút "Lịch Điện Thoại (.ICS)" để đồng bộ báo thức gốc của iPhone.'
                    : 'On iPhone Safari, tap Share ➔ "Add to Home Screen" to enable iOS Lock Screen Web Push, or tap "Phone Alarm (.ICS)" to sync with Apple Calendar native alarms.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Language & Physical Profile Recalibration */}
        <div className="md:col-span-5 bento-tile p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="pb-2.5 border-b border-[#D6D6D2] flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#333333]">
              <Sliders className="w-4 h-4 text-[#C42126]" />
              <span>
                {language === 'vi' ? 'Tùy Chọn Hiển Thị & Hồ Sơ' : 'Display & Profile Preferences'}
              </span>
            </div>

            {/* Language Selector Row */}
            <div className="py-2 border-b border-[#D6D6D2] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#333333]">
                <Globe className="w-4 h-4 text-[#C42126]" />
                <span>{language === 'vi' ? 'Ngôn ngữ hiển thị' : 'Display Language'}</span>
              </div>

              <div className="flex items-center rounded-lg border border-[#D6D6D2] bg-[#F5F5F0] overflow-hidden text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLanguage('vi')}
                  className={`px-3 py-1.5 cursor-pointer transition-colors ${
                    language === 'vi'
                      ? 'bg-[#333333] text-white'
                      : 'text-[#5C5C5C] hover:text-[#333333]'
                  }`}
                >
                  Tiếng Việt
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 cursor-pointer transition-colors ${
                    language === 'en'
                      ? 'bg-[#333333] text-white'
                      : 'text-[#5C5C5C] hover:text-[#333333]'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Recalibrate Physical Profile Row */}
            <div className="py-1 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#333333]">
                  {language === 'vi'
                    ? 'Hiệu chuẩn chỉ số thể chất & chấn thương'
                    : 'Recalibrate Physical Profile & Injuries'}
                </p>
                <p className="text-[11px] text-[#5C5C5C] mt-0.5">
                  {language === 'vi'
                    ? 'Cập nhật chiều cao, cân nặng, mức Push-up hoặc vùng đau mỏi'
                    : 'Update height, weight, push-up baseline, or injury zones'}
                </p>
              </div>

              <Link
                href="/onboarding"
                className="px-3.5 py-2 rounded-lg bg-[#F5F5F0] hover:bg-[#333333] text-[#333333] hover:text-white border border-[#D6D6D2] text-xs font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 transition-colors"
              >
                <span>{language === 'vi' ? 'Cập nhật' : 'Update'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
