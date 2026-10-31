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
      return {
        bg: 'bg-[#C8F135]/15 border border-[#C8F135]/30',
        icon: <Dumbbell className="w-4 h-4 text-[#C8F135]" />,
      };
    case 'LEVEL_UP':
      return {
        bg: 'bg-amber-500/15 border border-amber-500/30',
        icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      };
    case 'BUDDY_GIFT':
      return {
        bg: 'bg-sky-500/15 border border-sky-500/30',
        icon: <Gift className="w-4 h-4 text-sky-400" />,
      };
    case 'BUDDY_SYNC':
      return {
        bg: 'bg-purple-500/15 border border-purple-500/30',
        icon: <Users className="w-4 h-4 text-purple-400" />,
      };
    case 'SHOP':
      return {
        bg: 'bg-yellow-500/15 border border-yellow-500/30',
        icon: <Coins className="w-4 h-4 text-yellow-400" />,
      };
    case 'STREAK':
      return {
        bg: 'bg-orange-500/15 border border-orange-500/30',
        icon: <Flame className="w-4 h-4 text-orange-400" />,
      };
    default:
      return {
        bg: 'bg-white/10 border border-white/15',
        icon: <Bell className="w-4 h-4 text-[#9BA394]" />,
      };
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

    // Poll every 25 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 25000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Click outside to close dropdown
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
      {/* Notification Bell Button */}
      <button
        onClick={handleToggle}
        className="relative w-10 h-10 rounded-full bg-[#141C0F] border border-white/12 text-white flex items-center justify-center hover:border-[#C8F135]/50 hover:text-[#C8F135] transition-colors cursor-pointer"
        aria-label={t('notificationsTitle')}
        title={t('notificationsTitle')}
      >
        <Bell className="w-4 h-4" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-[#C8F135] text-[#0B0F07] text-[10px] font-black rounded-full px-1.5 flex items-center justify-center shadow-sm border-2 border-[#0A0E07]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[350px] sm:w-[410px] max-w-[calc(100vw-24px)] bg-[#11170C]/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 z-50 overflow-hidden flex flex-col text-white animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="bg-[#161F10] text-white px-4 py-3.5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center space-x-2">
              <span className="font-display font-bold text-lg tracking-wide uppercase">
                {t('notificationsTitle')}
              </span>
              {unreadCount > 0 && (
                <span className="bg-[#C8F135] text-[#0B0F07] text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount} {t('notificationsUnread').toLowerCase()}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[#9BA394] hover:text-[#C8F135] text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-white/5"
                  title={t('notificationsMarkAllRead')}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('notificationsMarkAllRead')}</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[#9BA394] hover:text-rose-400 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors p-1 rounded hover:bg-white/5"
                  title={t('notificationsClearAll')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center px-4 py-2 border-b border-white/10 bg-[#0D1309] text-xs font-bold space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#C8F135] text-[#0B0F07] font-black'
                  : 'text-[#9BA394] hover:text-white hover:bg-white/5'
              }`}
            >
              {t('notificationsAll')} ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-[#C8F135] text-[#0B0F07] font-black'
                  : 'text-[#9BA394] hover:text-white hover:bg-white/5'
              }`}
            >
              {t('notificationsUnread')} ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/[0.07]">
            {displayedNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-[#9BA394]">
                  <Inbox className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-white">{t('notificationsEmpty')}</p>
                <p className="text-xs text-[#9BA394] mt-1 max-w-xs mx-auto">
                  {t('notificationsEmptyDesc')}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const iconInfo = getNotificationIcon(notif.type);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 flex items-start space-x-3 transition-colors cursor-pointer group relative ${
                      notif.isRead
                        ? 'bg-transparent hover:bg-white/[0.03]'
                        : 'bg-[#C8F135]/[0.06] hover:bg-[#C8F135]/[0.1] border-l-2 border-[#C8F135]'
                    }`}
                  >
                    {/* Icon Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl ${iconInfo.bg} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      {iconInfo.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center space-x-1.5">
                        <h4
                          className={`text-xs font-extrabold truncate ${
                            notif.isRead ? 'text-white/80' : 'text-white'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#C8F135] shrink-0" />
                        )}
                      </div>

                      <p
                        className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
                          notif.isRead ? 'text-[#8E9688]' : 'text-[#C2C9BC] font-medium'
                        }`}
                      >
                        {notif.message}
                      </p>

                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-[11px] text-[#7E8777] font-semibold">
                          {formatRelativeTime(notif.createdAt, language)}
                        </span>

                        {notif.link && (
                          <span className="text-[11px] text-[#C8F135] font-bold flex items-center space-x-0.5 hover:underline">
                            <span>{t('notificationsViewDetail')}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side individual action buttons */}
                    <div className="absolute right-3 top-3 flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="p-1 rounded text-[#8E9688] hover:text-[#C8F135] hover:bg-white/10 cursor-pointer"
                          title={t('notificationsMarkRead')}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="p-1 rounded text-[#8E9688] hover:text-rose-400 hover:bg-white/10 cursor-pointer"
                        title={t('notificationsDelete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
