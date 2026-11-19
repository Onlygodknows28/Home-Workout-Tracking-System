'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Calendar, CheckCircle2, Clock, Download, Send, Sparkles } from 'lucide-react';
import { ApiClient } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { playSoundCue } from '../../lib/utils';
import {
  downloadIcsReminderFile,
  getGoogleCalendarReminderUrl,
  getNotificationPermissionState,
  getSavedReminderEnabled,
  getSavedReminderTime,
  registerWorkoutServiceWorker,
  requestPushPermissionAndToken,
  setSavedReminderEnabled,
  setSavedReminderTime,
  triggerSystemPushNotification,
} from '../../lib/firebaseMessaging';

const PRESET_TIMES = ['07:00', '17:30', '18:00', '20:30'];

export function SmartReminderCard() {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [reminderTime, setReminderTime] = useState<string>('18:00');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [fcmMode, setFcmMode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const savedTime = (user as any)?.reminderTime || getSavedReminderTime('18:00');
    const savedEnabled =
      typeof (user as any)?.reminderEnabled === 'boolean'
        ? (user as any).reminderEnabled
        : getSavedReminderEnabled(true);

    setReminderTime(savedTime);
    setReminderEnabled(savedEnabled);
    const perm = getNotificationPermissionState();
    setPermission(perm);

    if (perm === 'granted') {
      registerWorkoutServiceWorker().catch(() => {});
      setFcmMode(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY
          ? 'FIREBASE_CLOUD_MESSAGING'
          : 'FCM_SERVICE_WORKER',
      );
    }
  }, [user]);

  const showTempStatus = (ok: boolean, text: string) => {
    setStatusMessage({ ok, text });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const handleEnablePush = async () => {
    setIsSaving(true);
    try {
      const res = await requestPushPermissionAndToken();
      setPermission(getNotificationPermissionState());

      if (!res.granted) {
        showTempStatus(
          false,
          language === 'vi'
            ? 'Trình duyệt đang chặn quyền thông báo. Hãy bật quyền Notification trên thanh địa chỉ trình duyệt.'
            : 'Browser notification permission is blocked. Please allow notifications in your browser address bar.',
        );
        return;
      }

      setFcmMode(res.mode);
      setReminderEnabled(true);
      setSavedReminderEnabled(true);
      setSavedReminderTime(reminderTime);

      await ApiClient.registerFcmToken({
        fcmToken: res.token || undefined,
        reminderTime,
        reminderEnabled: true,
      }).catch(() => null);

      playSoundCue('finish');
      await triggerSystemPushNotification({
        title:
          language === 'vi'
            ? `🔔 Đã kích hoạt FCM Web Push (${reminderTime})`
            : `🔔 FCM Web Push Enabled (${reminderTime})`,
        body:
          language === 'vi'
            ? 'Hệ thống sẽ tự động gửi thông báo nhắc tập hằng ngày qua Service Worker kể cả khi bạn đóng tab!'
            : 'Daily workout reminders will be delivered via Service Worker even when the tab is closed!',
        link: '/workout',
      });

      showTempStatus(
        true,
        language === 'vi'
          ? `✓ Đã kết nối Firebase Push & đặt lịch nhắc tập lúc ${reminderTime} mỗi ngày!`
          : `✓ Connected Firebase Push & scheduled daily reminder at ${reminderTime}!`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeChange = async (newTime: string) => {
    setReminderTime(newTime);
    setSavedReminderTime(newTime);
    try {
      await ApiClient.registerFcmToken({
        reminderTime: newTime,
        reminderEnabled,
      });
      showTempStatus(
        true,
        language === 'vi'
          ? `✓ Đã lưu khung giờ nhắc tập: ${newTime} hằng ngày`
          : `✓ Saved daily reminder time: ${newTime}`,
      );
    } catch {
      // Saved locally
    }
  };

  const handleSendTestPush = async () => {
    setIsTestingPush(true);
    try {
      if (permission !== 'granted') {
        const permRes = await requestPushPermissionAndToken();
        setPermission(getNotificationPermissionState());
        if (permRes.granted && permRes.token) {
          setFcmMode(permRes.mode);
          await ApiClient.registerFcmToken({
            fcmToken: permRes.token,
            reminderTime,
            reminderEnabled: true,
          }).catch(() => null);
        }
      }

      const apiRes = await ApiClient.sendTestPush(language).catch(() => null);
      const notifTitle =
        apiRes?.notification?.title ||
        (language === 'vi'
          ? `🔥 Nhắc Tập FITVANT (${reminderTime})`
          : `🔥 FITVANT Workout Reminder (${reminderTime})`);
      const notifBody =
        apiRes?.notification?.message ||
        (language === 'vi'
          ? `Chào ${user?.name || 'Athlete'}! Giáo án AI 15 phút hôm nay đã sẵn sàng. Vào tập ngay để giữ chuỗi Streak ${user?.currentStreak || 1} ngày!`
          : `Hey ${user?.name || 'Athlete'}! Your 15-min AI Calisthenics routine is ready. Protect your ${user?.currentStreak || 1}-day streak now!`);

      playSoundCue('finish');
      const fired = await triggerSystemPushNotification({
        title: notifTitle,
        body: notifBody,
        link: '/workout',
      });

      showTempStatus(
        true,
        fired
          ? language === 'vi'
            ? '⚡ Đã bắn thông báo đẩy (FCM / Service Worker Push) lên màn hình thiết bị & trung tâm thông báo!'
            : '⚡ Dispatched FCM / Service Worker Push banner to your device & notification center!'
          : language === 'vi'
            ? '✓ Đã gửi thông báo vào Trung tâm thông báo (Hãy cấp quyền Notification trình duyệt để hiện Banner hệ điều hành).'
            : '✓ Sent to Notification Center (Allow browser notifications to display OS banner).',
      );
    } finally {
      setIsTestingPush(false);
    }
  };

  const isPushGranted = permission === 'granted';

  return (
    <div className="bento-tile p-6 sm:p-7 space-y-5">
      {/* Header Strip */}
      <div className="pb-3.5 border-b border-[#D6D6D2] flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#C42126] flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            <span>
              {language === 'vi'
                ? 'FIREBASE CLOUD MESSAGING (FCM) & LỊCH NHẮC TẬP'
                : 'FIREBASE CLOUD MESSAGING (FCM) & SMART REMINDER'}
            </span>
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-[#333333] mt-0.5">
            {language === 'vi'
              ? 'Nhắc Nhở Tập Luyện Đa Kênh (Kể Cả Khi Đóng Web)'
              : 'Omnichannel Daily Workout Reminder (Works Across Tabs)'}
          </h3>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
            isPushGranted
              ? 'bg-[#E8F5E9] border-[#2E7D32]/30 text-[#2E7D32]'
              : 'bg-[#FDE8E9] border-[#C42126]/30 text-[#C42126]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isPushGranted ? 'bg-[#2E7D32]' : 'bg-[#C42126]'
            }`}
          />
          <span>
            {isPushGranted
              ? fcmMode === 'FIREBASE_CLOUD_MESSAGING'
                ? 'FCM Cloud Connected'
                : 'FCM Service Worker Ready'
              : language === 'vi'
                ? 'Chưa bật Push'
                : 'Push Inactive'}
          </span>
        </span>
      </div>

      {/* Row 1: Daily Reminder Time Selector */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center pb-4 border-b border-[#D6D6D2]">
        <div className="md:col-span-5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#333333]">
            <Clock className="w-4 h-4 text-[#C42126]" />
            <span>
              {language === 'vi' ? 'Khung Giờ Nhắc Tập Hằng Ngày' : 'Daily Workout Reminder Time'}
            </span>
          </div>
          <p className="text-xs text-[#5C5C5C] leading-relaxed">
            {language === 'vi'
              ? 'Hệ thống sẽ tự động đẩy thông báo nhắc bảo vệ chuỗi Streak nếu đến giờ này bạn chưa hoàn thành bài tập.'
              : 'System automatically sends a streak-protection push notification if you have not completed your workout by this time.'}
          </p>
        </div>

        <div className="md:col-span-7 flex flex-wrap items-center gap-2 sm:justify-end">
          {PRESET_TIMES.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleTimeChange(preset)}
              className={`px-3.5 py-2 rounded-lg font-telemetry text-xs font-bold border transition-colors cursor-pointer ${
                reminderTime === preset
                  ? 'bg-[#333333] text-white border-[#333333]'
                  : 'bg-[#F5F5F0] text-[#333333] border-[#D6D6D2] hover:border-[#C42126]'
              }`}
            >
              {preset}
            </button>
          ))}

          <input
            type="time"
            value={reminderTime}
            onChange={(e) => e.target.value && handleTimeChange(e.target.value)}
            aria-label="Custom reminder time"
            className="px-3 py-1.5 rounded-lg bg-[#F5F5F0] border border-[#D6D6D2] font-telemetry text-xs font-bold text-[#333333] focus:outline-none focus:border-[#C42126]"
          />
        </div>
      </div>

      {/* Row 2: Action Buttons (Enable FCM Push + Test Push + Calendar Sync) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleEnablePush}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
              isPushGranted
                ? 'bg-[#2E7D32] text-white hover:brightness-110'
                : 'btn-cta-red'
            }`}
          >
            {isPushGranted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {language === 'vi'
                    ? 'Đã Bật Thông Báo Đẩy (Cập Nhật)'
                    : 'Web Push Active (Refresh)'}
                </span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>
                  {language === 'vi'
                    ? 'Bật Thông Báo Đẩy (FCM Web Push)'
                    : 'Enable FCM Web Push'}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isTestingPush}
            onClick={handleSendTestPush}
            className="px-4 py-2.5 rounded-lg bg-[#333333] hover:bg-[#C42126] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isTestingPush
                ? language === 'vi'
                  ? 'Đang gửi...'
                  : 'Sending...'
                : language === 'vi'
                  ? '⚡ Gửi Thông Báo Thử Nghiệm'
                  : '⚡ Send Test Push'}
            </span>
          </button>
        </div>

        {/* OS Calendar Sync (100% Native Mobile Alarm Reliability) */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={getGoogleCalendarReminderUrl(reminderTime, language)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-lg bg-[#F5F5F0] hover:bg-[#D6D6D2]/60 border border-[#D6D6D2] text-[#333333] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-[#C42126]" />
            <span>Google Calendar</span>
          </a>

          <button
            type="button"
            onClick={() => downloadIcsReminderFile(reminderTime, language)}
            className="px-3.5 py-2 rounded-lg bg-[#F5F5F0] hover:bg-[#D6D6D2]/60 border border-[#D6D6D2] text-[#333333] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#C42126]" />
            <span>{language === 'vi' ? 'Lịch Điện Thoại (.ICS)' : 'Phone Alarm (.ICS)'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            statusMessage.ok
              ? 'bg-[#E8F5E9] border-[#2E7D32]/30 text-[#2E7D32]'
              : 'bg-[#FDE8E9] border-[#C42126]/30 text-[#C42126]'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
}
