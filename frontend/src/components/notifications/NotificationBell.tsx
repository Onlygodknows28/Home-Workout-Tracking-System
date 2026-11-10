'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Trash2,
  Dumbbell,
  Sparkles,
  Gift,
  Users,
  Coins,
  Flame,
  Check,
  Inbox,
  ExternalLink,
} from 'lucide-react';
import { ApiClient } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

function formatRelativeTime(dateString: string, lang: 'vi' | 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 60) {
    return lang === 'vi' ? 'Vừa xong' : 'Just now';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return lang === 'vi' ? `${diffMin} phút trước` : `${diffMin}m ago`;
  }
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return lang === 'vi' ? `${diffHour} giờ trước` : `${diffHour}h ago`;
  }
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) {
    return lang === 'vi' ? `${diffDay} ngày trước` : `${diffDay}d ago`;
  }
  return date.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'WORKOUT':
      return <Dumbbell className="w-4 h-4 text-[#C42126]" />;
    case 'LEVEL_UP':
      return <Sparkles className="w-4 h-4 text-[#C42126]" />;
    case 'BUDDY_GIFT':
      return <Gift className="w-4 h-4 text-[#2E7D32]" />;
    case 'BUDDY_SYNC':
      return <Users className="w-4 h-4 text-[#2E7D32]" />;
    case 'SHOP':
      return <Coins className="w-4 h-4 text-[#C42126]" />;
    case 'STREAK':
      return <Flame className="w-4 h-4 text-[#C42126]" />;
    default:
      return <Bell className="w-4 h-4 text-[#5C5C5C]" />;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { language, t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await ApiClient.getNotifications();
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount ?? res.notifications.filter((n) => !n.isRead).length);
      }
    } catch {
      // Ignore background fetch errors
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 25000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await ApiClient.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent error
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await ApiClient.markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silent error
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const target = notifications.find((n) => n.id === id);
      await ApiClient.deleteNotification(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Silent error
    }
  };

  const handleClearAll = async () => {
    try {
      await ApiClient.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // Silent error
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    if (notif.link) {
      setIsOpen(false);
      router.push(notif.link);
    }
  };

  if (!isAuthenticated) return null;

  const displayedNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative w-9 h-9 rounded-lg bg-[#EBEBE6] border border-[#D6D6D2] text-[#333333] flex items-center justify-center hover:border-[#C42126] hover:text-[#C42126] transition-colors cursor-pointer"
        aria-label={t('notificationsTitle')}
        title={t('notificationsTitle')}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-4 bg-[#C42126] text-white text-[10px] font-bold rounded-full px-1 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[350px] sm:w-[400px] max-w-[calc(100vw-24px)] bg-[#F5F5F0] rounded-[14px] border border-[#D6D6D2] z-50 overflow-hidden flex flex-col text-[#333333]">
          {/* Header */}
          <div className="bg-[#EBEBE6] px-4 py-3 flex items-center justify-between border-b border-[#D6D6D2]">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-wide uppercase text-[#333333]">
                {t('notificationsTitle')}
              </span>
              {unreadCount > 0 && (
                <span className="text-xs font-bold text-[#C42126]">
                  ({unreadCount} {t('notificationsUnread').toLowerCase()})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[#5C5C5C] hover:text-[#333333] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title={t('notificationsMarkAllRead')}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('notificationsMarkAllRead')}</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[#5C5C5C] hover:text-[#C42126] text-xs font-semibold p-1 cursor-pointer transition-colors"
                  title={t('notificationsClearAll')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center px-4 py-2 border-b border-[#D6D6D2] bg-[#F5F5F0] text-xs font-semibold gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`pb-1 transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'text-[#333333] font-bold border-b-2 border-[#C42126]'
                  : 'text-[#5C5C5C] hover:text-[#333333]'
              }`}
            >
              {t('notificationsAll')} ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`pb-1 transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'text-[#333333] font-bold border-b-2 border-[#C42126]'
                  : 'text-[#5C5C5C] hover:text-[#333333]'
              }`}
            >
              {t('notificationsUnread')} ({unreadCount})
            </button>
          </div>

          {/* Notifications List (1px Hairline Rows — Zero nested cards) */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[#D6D6D2]">
            {displayedNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <Inbox className="w-6 h-6 text-[#5C5C5C] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#333333]">{t('notificationsEmpty')}</p>
                <p className="text-xs text-[#5C5C5C] mt-1 max-w-xs mx-auto">
                  {t('notificationsEmptyDesc')}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group relative ${
                    notif.isRead
                      ? 'bg-transparent hover:bg-[#EBEBE6]/60'
                      : 'bg-[#FDE8E9]/60 hover:bg-[#FDE8E9] border-l-2 border-[#C42126]'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getNotificationIcon(notif.type)}</div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5">
                      <h4
                        className={`text-xs font-bold truncate ${
                          notif.isRead ? 'text-[#5C5C5C]' : 'text-[#333333]'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C42126] shrink-0" />
                      )}
                    </div>

                    <p className="text-xs mt-1 leading-relaxed line-clamp-2 text-[#5C5C5C]">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-[#5C5C5C]">
                        {formatRelativeTime(notif.createdAt, language)}
                      </span>
                      {notif.link && (
                        <span className="text-[11px] text-[#C42126] font-semibold flex items-center gap-0.5 hover:underline">
                          <span>{t('notificationsViewDetail')}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="absolute right-3 top-3 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="p-1 rounded text-[#5C5C5C] hover:text-[#2E7D32] cursor-pointer"
                        title={t('notificationsMarkRead')}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notif.id, e)}
                      className="p-1 rounded text-[#5C5C5C] hover:text-[#C42126] cursor-pointer"
                      title={t('notificationsDelete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
