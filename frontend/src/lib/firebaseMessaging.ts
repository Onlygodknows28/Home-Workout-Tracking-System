'use client';

export interface PushNotificationPayload {
  title: string;
  body: string;
  link?: string;
}

const REMINDER_TIME_KEY = 'fit_reminder_time';
const REMINDER_ENABLED_KEY = 'fit_reminder_enabled';
const LAST_FIRED_DATE_KEY = 'fit_reminder_last_fired_date';

export function getSavedReminderTime(fallback = '18:00'): string {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(REMINDER_TIME_KEY) || fallback;
}

export function setSavedReminderTime(time: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REMINDER_TIME_KEY, time);
}

export function getSavedReminderEnabled(fallback = true): boolean {
  if (typeof window === 'undefined') return fallback;
  const val = localStorage.getItem(REMINDER_ENABLED_KEY);
  return val === null ? fallback : val === 'true';
}

export function setSavedReminderEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REMINDER_ENABLED_KEY, String(enabled));
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function registerWorkoutServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    return reg;
  } catch (err) {
    console.warn('Service Worker registration warning:', err);
    return null;
  }
}

async function loadFirebaseMessagingTokenFromCloud(
  swReg: ServiceWorkerRegistration | null,
): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  if (!apiKey || !projectId || !messagingSenderId || !appId) {
    return null;
  }

  try {
    const win = window as any;
    if (!win.firebase) {
      await new Promise<void>((resolve, reject) => {
        const s1 = document.createElement('script');
        s1.src = 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js';
        s1.onload = () => {
          const s2 = document.createElement('script');
          s2.src = 'https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js';
          s2.onload = () => resolve();
          s2.onerror = () => reject(new Error('Failed to load firebase-messaging'));
          document.head.appendChild(s2);
        };
        s1.onerror = () => reject(new Error('Failed to load firebase-app'));
        document.head.appendChild(s1);
      });
    }

    const firebase = (window as any).firebase;
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey,
        projectId,
        messagingSenderId,
        appId,
      });
    }

    const messaging = firebase.messaging();
    const token = await messaging.getToken({
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: swReg || undefined,
    });
    return token || null;
  } catch (err) {
    console.warn('Firebase Cloud Messaging SDK fallback to Hybrid Service Worker:', err);
    return null;
  }
}

/**
 * Requests browser Notification permission, registers `firebase-messaging-sw.js`,
 * and returns either a live Google FCM Cloud Token or a deterministic Hybrid Service Worker Token.
 */
export async function requestPushPermissionAndToken(): Promise<{
  granted: boolean;
  token: string | null;
  mode: 'FIREBASE_CLOUD_MESSAGING' | 'HYBRID_SERVICE_WORKER' | 'BLOCKED';
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, token: null, mode: 'BLOCKED' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { granted: false, token: null, mode: 'BLOCKED' };
  }

  const swReg = await registerWorkoutServiceWorker();
  const cloudToken = await loadFirebaseMessagingTokenFromCloud(swReg);
  if (cloudToken) {
    return {
      granted: true,
      token: cloudToken,
      mode: 'FIREBASE_CLOUD_MESSAGING',
    };
  }

  // Deterministic Hybrid Service Worker token when running without external Firebase cloud keys
  let localToken = localStorage.getItem('fit_fcm_device_token');
  if (!localToken) {
    localToken = `sw_local_${Math.random().toString(36).slice(2, 12)}_${Date.now()}`;
    localStorage.setItem('fit_fcm_device_token', localToken);
  }

  return {
    granted: true,
    token: localToken,
    mode: 'HYBRID_SERVICE_WORKER',
  };
}

/**
 * Fires an immediate OS-level Notification banner via the active Service Worker
 * (or Browser Notification constructor fallback).
 */
export async function triggerSystemPushNotification(
  payload: PushNotificationPayload,
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return false;
  }

  try {
    const swReg = await registerWorkoutServiceWorker();
    if (swReg && 'showNotification' in swReg) {
      await swReg.showNotification(payload.title, {
        body: payload.body,
        tag: 'fitvant-workout-reminder',
        data: { url: payload.link || '/workout' },
      });
      return true;
    }
  } catch {
    // Fallback to direct Notification constructor
  }

  try {
    const notif = new Notification(payload.title, {
      body: payload.body,
      tag: 'fitvant-workout-reminder',
    });
    notif.onclick = () => {
      window.focus();
      window.location.href = payload.link || '/workout';
    };
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if the user's scheduled daily reminder time has arrived today and they haven't worked out yet.
 */
export function checkAndFireScheduledDailyReminder(params: {
  hasWorkedOutToday: boolean;
  streak: number;
  language: 'vi' | 'en';
}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (!getSavedReminderEnabled(true)) return;
  if (params.hasWorkedOutToday) return;

  const today = new Date().toISOString().split('T')[0];
  if (localStorage.getItem(LAST_FIRED_DATE_KEY) === today) return;

  const targetTime = getSavedReminderTime('18:00');
  const [targetH, targetM] = targetTime.split(':').map(Number);
  if (isNaN(targetH) || isNaN(targetM)) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = targetH * 60 + targetM;

  if (currentMinutes >= targetMinutes) {
    localStorage.setItem(LAST_FIRED_DATE_KEY, today);
    const title =
      params.language === 'vi'
        ? `🔥 Đã đến giờ tập FITVANT (${targetTime})!`
        : `🔥 FITVANT Workout Time (${targetTime})!`;
    const body =
      params.language === 'vi'
        ? `Hoàn thành 15 phút Calisthenics hôm nay để giữ vững chuỗi Streak ${params.streak || 1} ngày của bạn!`
        : `Complete your 15-min AI Calisthenics routine today to protect your ${params.streak || 1}-day streak!`;

    triggerSystemPushNotification({ title, body, link: '/workout' }).catch(() => {});
  }
}

/**
 * Generates a 1-click Google Calendar recurring daily workout reminder URL.
 */
export function getGoogleCalendarReminderUrl(reminderTime: string, lang: 'vi' | 'en'): string {
  const [hourStr, minStr] = (reminderTime || '18:00').split(':');
  const hour = parseInt(hourStr, 10) || 18;
  const minute = parseInt(minStr, 10) || 0;

  const start = new Date();
  start.setHours(hour, minute, 0, 0);
  const end = new Date(start.getTime() + 20 * 60 * 1000); // 20-min block

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dates = `${fmt(start)}/${fmt(end)}`;

  const appUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/workout`
      : 'https://home-workout-tracking-system-ten.vercel.app/workout';

  const title =
    lang === 'vi'
      ? '🔥 Tập Calisthenics 15 Phút & Giữ Chuỗi Streak (FITVANT)'
      : '🔥 15-Min AI Calisthenics & Streak Protection (FITVANT)';
  const details =
    lang === 'vi'
      ? `Giáo án AI thích ứng hằng ngày đã sẵn sàng. Mở ngay tại: ${appUrl}`
      : `Your adaptive daily AI workout is ready. Start now at: ${appUrl}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title,
  )}&dates=${dates}&details=${encodeURIComponent(details)}&recur=${encodeURIComponent(
    'RRULE:FREQ=DAILY',
  )}`;
}

/**
 * Generates and downloads an iCalendar (.ics) recurring alarm file for Apple Calendar / Outlook.
 */
export function downloadIcsReminderFile(reminderTime: string, lang: 'vi' | 'en') {
  if (typeof window === 'undefined') return;
  const [hourStr, minStr] = (reminderTime || '18:00').split(':');
  const hour = parseInt(hourStr, 10) || 18;
  const minute = parseInt(minStr, 10) || 0;

  const start = new Date();
  start.setHours(hour, minute, 0, 0);
  const end = new Date(start.getTime() + 20 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const appUrl = `${window.location.origin}/workout`;
  const summary =
    lang === 'vi'
      ? '🔥 Tập Calisthenics 15 Phút & Giữ Chuỗi Streak (FITVANT)'
      : '🔥 15-Min AI Calisthenics & Streak Protection (FITVANT)';
  const desc =
    lang === 'vi'
      ? `Vào tập giáo án AI hôm nay tại: ${appUrl}`
      : `Start your daily AI workout at: ${appUrl}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FITVANT//AI Workout Reminder//VI',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    `URL:${appUrl}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT5M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${summary}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fitvant-daily-workout-reminder.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
