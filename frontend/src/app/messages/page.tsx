'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ApiClient } from '../../lib/api';
import {
  formatPersonName,
  getFitnessLevelLabel,
  getGoalLabel,
} from '../../lib/catalogTranslations';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Flame,
  MessageSquare,
  Search,
  Send,
  Users,
} from 'lucide-react';

interface ContactItem {
  userId: string;
  name: string;
  avatar: string;
  level: number;
  currentStreak: number;
  fitnessLevel: string;
  primaryGoal: string;
  isBuddy: boolean;
  unreadCount: number;
  lastMessage: {
    content: string;
    createdAt: string;
    fromMe: boolean;
  } | null;
}

interface DirectMessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  fromMe: boolean;
  isOptimistic?: boolean;
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatShortTime(iso: string, lang: 'vi' | 'en'): string {
  const d = new Date(iso);
  const diffMin = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (diffMin < 1) return lang === 'vi' ? 'Vừa xong' : 'Now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
  });
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUserParam = searchParams.get('user');

  const { user, isAuthenticated, isLoading, isAuthReady } = useAuth();
  const { language } = useLanguage();

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserParam);
  const [activePartner, setActivePartner] = useState<ContactItem | null>(null);
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isContactsLoading, setIsContactsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(Boolean(initialUserParam));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef<number>(0);

  const loadContacts = useCallback(
    async (silent = false) => {
      if (!isAuthenticated) return;
      if (!silent) setIsContactsLoading(true);
      try {
        const res = await ApiClient.getMessageContacts();
        if (res && Array.isArray(res.contacts)) {
          setContacts(res.contacts);
          setSelectedUserId((prev) => {
            if (prev) return prev;
            if (initialUserParam && res.contacts.some((c: ContactItem) => c.userId === initialUserParam)) {
              return initialUserParam;
            }
            return res.contacts.length > 0 ? res.contacts[0].userId : null;
          });
        }
      } catch {
        // ignore transient errors
      } finally {
        if (!silent) setIsContactsLoading(false);
      }
    },
    [isAuthenticated, initialUserParam],
  );

  const loadConversation = useCallback(
    async (partnerId: string, silent = false) => {
      if (!isAuthenticated || !partnerId) return;
      if (!silent) setIsChatLoading(true);
      try {
        const res = await ApiClient.getConversation(partnerId);
        if (res) {
          setMessages(res.messages || []);
          setContacts((prev) =>
            prev.map((c) => (c.userId === partnerId ? { ...c, unreadCount: 0 } : c)),
          );
        }
      } catch {
        // ignore transient polling errors
      } finally {
        if (!silent) setIsChatLoading(false);
      }
    },
    [isAuthenticated],
  );

  // Auth guard & initial contacts load
  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      loadContacts(false);
    }
  }, [isAuthenticated, isLoading, isAuthReady, router, loadContacts]);

  // Sync selected partner metadata & load conversation
  useEffect(() => {
    if (!selectedUserId || !isAuthenticated) return;
    const found = contacts.find((c) => c.userId === selectedUserId) || null;
    if (found) setActivePartner(found);
    loadConversation(selectedUserId, false);
  }, [selectedUserId, isAuthenticated, loadConversation]);

  // Keep activePartner updated when contacts refresh
  useEffect(() => {
    if (!selectedUserId) return;
    const found = contacts.find((c) => c.userId === selectedUserId);
    if (found) setActivePartner(found);
  }, [contacts, selectedUserId]);

  // Smart visibility-aware 3-second polling (Method A: REST + Smart Polling + FCM Push)
  useEffect(() => {
    if (!isAuthenticated) return;

    const poll = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      loadContacts(true);
      if (selectedUserId) {
        loadConversation(selectedUserId, true);
      }
    };

    const interval = setInterval(poll, 3000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, selectedUserId, loadContacts, loadConversation]);

  // Auto-scroll to newest message when count increases
  useEffect(() => {
    if (messages.length !== lastMessageCountRef.current) {
      lastMessageCountRef.current = messages.length;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSelectContact = (contact: ContactItem) => {
    setSelectedUserId(contact.userId);
    setActivePartner(contact);
    setMobileShowChat(true);
  };

  const handleSendMessage = async (textOverride?: string) => {
    if (!selectedUserId || !user) return;
    const content = (textOverride ?? inputText).trim();
    if (!content || isSending) return;

    if (!textOverride) setInputText('');
    setIsSending(true);

    // 0ms Optimistic UI update
    const tempId = `opt_${Date.now()}`;
    const optimisticMsg: DirectMessageItem = {
      id: tempId,
      senderId: user.id,
      receiverId: selectedUserId,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      fromMe: true,
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setContacts((prev) =>
      prev.map((c) =>
        c.userId === selectedUserId
          ? {
              ...c,
              lastMessage: {
                content,
                createdAt: optimisticMsg.createdAt,
                fromMe: true,
              },
            }
          : c,
      ),
    );

    try {
      const saved = await ApiClient.sendDirectMessage(selectedUserId, content);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
      loadContacts(true);
    } catch {
      // Remove failed optimistic message and restore input
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      if (!textOverride) setInputText(content);
    } finally {
      setIsSending(false);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  const quickChips =
    language === 'vi'
      ? [
          '🔥 Hôm nay bạn tập chưa?',
          '💪 Mình vừa hoàn thành bài tập!',
          '🛡️ Nhớ giữ chuỗi Streak nha!',
        ]
      : [
          '🔥 Worked out today yet?',
          '💪 Just finished my workout!',
          '🛡️ Protect your streak today!',
        ];

  if (isLoading || isContactsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-center">
        <div className="w-10 h-10 border-3 border-[#C42126] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#5C5C5C] font-semibold">
          {language === 'vi' ? 'Đang tải danh sách trò chuyện...' : 'Loading messages...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1220px] mx-auto px-4 sm:px-8 py-6 space-y-5">
      {/* Open-Canvas Header */}
      <div className="pb-4 border-b border-[#D6D6D2] flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#C42126] flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>
              {language === 'vi'
                ? 'TRÒ CHUYỆN CỘNG ĐỒNG & BẠN TẬP'
                : 'COMMUNITY & BUDDY DIRECT CHAT'}
            </span>
          </span>
          <h1 className="font-display text-[38px] sm:text-[44px] font-extrabold text-[#333333] leading-none mt-1 uppercase">
            {language === 'vi' ? 'TIN NHẮN TRỰC TIẾP' : 'DIRECT MESSAGES'}
          </h1>
        </div>
        <span className="text-xs text-[#5C5C5C] font-semibold">
          {contacts.length}{' '}
          {language === 'vi' ? 'vận động viên khả dụng' : 'athletes available'}
        </span>
      </div>

      {/* Main 12-Column Single-Layer Bento Chat Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 4 COLS: Contacts & Conversations Roster */}
        <div
          className={`lg:col-span-4 bento-tile p-4 sm:p-5 flex flex-col gap-3.5 ${
            mobileShowChat ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#5C5C5C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'vi' ? 'Tìm tên vận động viên...' : 'Search athletes by name...'
              }
              className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-[#F5F5F0] border border-[#D6D6D2] text-xs text-[#333333] placeholder-[#5C5C5C] focus:outline-none focus:border-[#C42126]"
            />
          </div>

          {/* Scrollable Contact List */}
          <div className="flex-1 max-h-[500px] overflow-y-auto pr-1 divide-y divide-[#D6D6D2] exercise-scroll">
            {filteredContacts.map((contact) => {
              const isSelected = contact.userId === selectedUserId;
              return (
                <button
                  key={contact.userId}
                  type="button"
                  onClick={() => handleSelectContact(contact)}
                  className={`w-full py-3 px-2.5 text-left flex items-center gap-3 transition-colors cursor-pointer rounded-lg ${
                    isSelected ? 'bg-[#F5F5F0]' : 'hover:bg-[#F5F5F0]/60'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      loading="lazy"
                      decoding="async"
                      className="w-10 h-10 rounded-full border border-[#D6D6D2] object-cover bg-[#F5F5F0]"
                    />
                    {contact.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C42126] text-white text-[10px] font-bold flex items-center justify-center">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-sm truncate ${
                            isSelected || contact.unreadCount > 0
                              ? 'font-bold text-[#333333]'
                              : 'font-semibold text-[#333333]'
                          }`}
                        >
                          {formatPersonName(contact.name, language)}
                        </span>
                        {contact.isBuddy && (
                          <span className="px-1.5 py-0.5 rounded bg-[#FDE8E9] text-[#C42126] text-[9px] font-extrabold uppercase shrink-0">
                            Buddy
                          </span>
                        )}
                      </div>
                      {contact.lastMessage && (
                        <span className="text-[10px] text-[#5C5C5C] shrink-0 font-telemetry">
                          {formatShortTime(contact.lastMessage.createdAt, language)}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs truncate mt-0.5 ${
                        contact.unreadCount > 0
                          ? 'text-[#333333] font-semibold'
                          : 'text-[#5C5C5C]'
                      }`}
                    >
                      {contact.lastMessage
                        ? `${contact.lastMessage.fromMe ? (language === 'vi' ? 'Bạn: ' : 'You: ') : ''}${contact.lastMessage.content}`
                        : `LV.${contact.level} • ${getFitnessLevelLabel(contact.fitnessLevel, language)}`}
                    </p>
                  </div>
                </button>
              );
            })}

            {filteredContacts.length === 0 && (
              <div className="py-10 text-center text-xs text-[#5C5C5C]">
                {language === 'vi'
                  ? 'Không tìm thấy vận động viên nào.'
                  : 'No athletes found.'}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 8 COLS: Active Chat Room */}
        <div
          className={`lg:col-span-8 bento-tile p-4 sm:p-6 flex flex-col justify-between min-h-[540px] ${
            mobileShowChat ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {activePartner ? (
            <>
              {/* Chat Header */}
              <div className="pb-3.5 border-b border-[#D6D6D2] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="lg:hidden w-8 h-8 rounded-lg bg-[#F5F5F0] border border-[#D6D6D2] flex items-center justify-center text-[#333333] cursor-pointer"
                    aria-label="Back to contacts"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <img
                    src={activePartner.avatar}
                    alt={activePartner.name}
                    className="w-10 h-10 rounded-full border border-[#D6D6D2] object-cover bg-[#F5F5F0] shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-base text-[#333333] truncate">
                        {formatPersonName(activePartner.name, language)}
                      </h2>
                      {activePartner.isBuddy && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FDE8E9] border border-[#C42126]/20 text-[#C42126] text-[10px] font-bold uppercase">
                          Active Buddy
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5C5C5C] truncate">
                      LV.{activePartner.level} •{' '}
                      {getGoalLabel(activePartner.primaryGoal, language)} •{' '}
                      <span className="inline-flex items-center gap-0.5 text-[#C42126] font-semibold">
                        <Flame className="w-3 h-3 inline" />
                        {activePartner.currentStreak}d
                      </span>
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2E7D32] bg-[#E8F5E9] border border-[#2E7D32]/20 px-2.5 py-1 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                  <span>FCM Push Enabled</span>
                </span>
              </div>

              {/* Message Feed */}
              <div className="flex-1 h-[380px] sm:h-[400px] overflow-y-auto py-4 pr-1 space-y-3 exercise-scroll">
                {isChatLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-7 h-7 border-2 border-[#C42126] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6 space-y-2 text-[#5C5C5C]">
                    <Users className="w-8 h-8 text-[#C42126]/60" />
                    <p className="text-sm font-bold text-[#333333]">
                      {language === 'vi'
                        ? `Bắt đầu trò chuyện với ${formatPersonName(activePartner.name, language)}`
                        : `Start chatting with ${formatPersonName(activePartner.name, language)}`}
                    </p>
                    <p className="text-xs max-w-sm">
                      {language === 'vi'
                        ? 'Nhắn tin trao đổi kinh nghiệm Calisthenics, rủ nhau tập luyện hoặc gửi lời cổ vũ giữ chuỗi Streak!'
                        : 'Share Calisthenics tips, coordinate workouts, or motivate each other to keep your streaks alive!'}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                          msg.fromMe
                            ? 'bg-[#333333] text-white rounded-br-sm'
                            : 'bg-[#F5F5F0] text-[#333333] border border-[#D6D6D2] rounded-bl-sm'
                        } ${msg.isOptimistic ? 'opacity-75' : ''}`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-telemetry ${
                            msg.fromMe ? 'text-white/70' : 'text-[#5C5C5C]'
                          }`}
                        >
                          <span>{formatMessageTime(msg.createdAt)}</span>
                          {msg.fromMe &&
                            (msg.isRead ? (
                              <CheckCheck className="w-3 h-3 text-[#81C784]" />
                            ) : (
                              <Check className="w-3 h-3" />
                            ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Motivation Chips + Input Form */}
              <div className="pt-3 border-t border-[#D6D6D2] space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {quickChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      disabled={isSending}
                      onClick={() => handleSendMessage(chip)}
                      className="px-2.5 py-1 rounded-full bg-[#F5F5F0] hover:bg-[#FDE8E9] border border-[#D6D6D2] hover:border-[#C42126]/40 text-[11px] font-semibold text-[#5C5C5C] hover:text-[#C42126] transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      language === 'vi'
                        ? `Nhắn tin cho ${formatPersonName(activePartner.name, language)}...`
                        : `Message ${formatPersonName(activePartner.name, language)}...`
                    }
                    maxLength={1000}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#F5F5F0] border border-[#D6D6D2] text-xs sm:text-sm text-[#333333] placeholder-[#5C5C5C] focus:outline-none focus:border-[#C42126]"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="px-4 py-2.5 rounded-xl btn-cta-red text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {language === 'vi' ? 'Gửi' : 'Send'}
                    </span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-[#5C5C5C] space-y-2">
              <MessageSquare className="w-8 h-8 text-[#C42126]/60" />
              <p className="text-sm font-semibold">
                {language === 'vi'
                  ? 'Chọn một vận động viên ở danh sách bên trái để bắt đầu trò chuyện.'
                  : 'Select an athlete from the list to start chatting.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-center">
          <div className="w-10 h-10 border-3 border-[#C42126] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
