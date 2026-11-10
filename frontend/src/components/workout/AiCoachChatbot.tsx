'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useWorkout } from '../../context/WorkoutContext';
import { ApiClient, AiChatHistoryItem } from '../../lib/api';
import {
  formatInjuryList,
  getGoalLabel,
  formatPersonName,
} from '../../lib/catalogTranslations';
import {
  Sparkles,
  X,
  Send,
  KeyRound,
  Trash2,
  Bot,
  User as UserIcon,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const GEMINI_KEY_STORAGE = 'fit_gemini_api_key';

export function AiCoachChatbot() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const { isMiniBarVisibleOnPath } = useWorkout();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [activeEngine, setActiveEngine] = useState<string>('HYBRID_AI');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Hydrate optional client-side Gemini API key
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const k = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
      if (k) {
        setSavedKey(k);
        setApiKeyInput(k);
        setActiveEngine('GEMINI_2_5_FLASH');
      }
    } catch {
      // ignore
    }
  }, []);

  const name = formatPersonName(user?.name?.split(' ')[0] || 'Athlete', language);
  const bmi = user?.profile?.bmi || 22.5;
  const goal = getGoalLabel(user?.profile?.primaryGoal || 'MUSCLE_GAIN', language, 'short');
  const injuryBadgeText = formatInjuryList(user?.profile?.injuries, language);

  const welcomeMessage: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content:
      language === 'vi'
        ? `Xin chào **${name}**! Tôi là **FITVANT AI Coach** — huấn luyện viên cá nhân đã kết nối trực tiếp với hồ sơ thể chất của bạn (**BMI ${bmi} • Mục tiêu: ${goal}${injuryBadgeText ? ` • Lưu ý: ${injuryBadgeText}` : ''}**).\n\nBạn cần tôi phân tích giáo án hôm nay, điều chỉnh bài tập theo sức khỏe hay tính định mức Calo & Protein?`
        : `Hello **${name}**! I am your **FITVANT AI Coach**, connected to your live physical profile (**BMI ${bmi} • Goal: ${goal}${injuryBadgeText ? ` • Health Note: ${injuryBadgeText}` : ''}**).\n\nWould you like me to analyze today's workout, adapt exercises for your health condition, or calculate your daily Calories & Protein?`,
  };

  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isSending]);

  // Only show for authenticated athletes, and hide on login/register
  if (!isAuthenticated || pathname === '/login' || pathname === '/register') {
    return null;
  }

  // Check if MiniWorkoutBar is currently visible at the bottom-right so we shift the floating button up
  const isMiniBarVisible = isMiniBarVisibleOnPath(pathname);

  const defaultSuggestions =
    language === 'vi'
      ? [
          'Phân tích giáo án hôm nay của tôi',
          injuryBadgeText
            ? `Lưu ý an toàn cho: ${injuryBadgeText}`
            : 'Cách bảo vệ cổ tay & đầu gối khi tập',
          'Tính lượng Calo & Protein mỗi ngày cho tôi',
        ]
      : [
          "Analyze today's workout routine",
          injuryBadgeText
            ? `Safety tips for: ${injuryBadgeText}`
            : 'How to protect wrists & knees at home',
          'Calculate my daily Calories & Protein',
        ];

  const handleSaveApiKey = async () => {
    const cleaned = apiKeyInput.replace(/["'\s]/g, '');
    setIsVerifyingKey(true);
    setKeyStatusMsg(null);

    try {
      const res = await ApiClient.configureGeminiKey(cleaned || undefined);
      if (!cleaned) {
        setSavedKey('');
        setApiKeyInput('');
        localStorage.removeItem(GEMINI_KEY_STORAGE);
        setActiveEngine('HYBRID_AI');
        setKeyStatusMsg({
          ok: true,
          text:
            language === 'vi'
              ? 'Đã chuyển về chế độ Hybrid Medical Expert Engine.'
              : 'Switched to built-in Hybrid Medical Expert Engine.',
        });
        return;
      }

      if (res?.valid) {
        setSavedKey(cleaned);
        setApiKeyInput(cleaned);
        localStorage.setItem(GEMINI_KEY_STORAGE, cleaned);
        setActiveEngine('GEMINI_2_5_FLASH');
        setKeyStatusMsg({
          ok: true,
          text:
            language === 'vi'
              ? `✓ Đã kết nối Google Gemini (${res.model || 'Flash'}) thành công!`
              : `✓ Connected to Google Gemini (${res.model || 'Flash'})!`,
        });
        setTimeout(() => {
          setShowKeyConfig(false);
          setKeyStatusMsg(null);
        }, 1200);
      } else {
        setKeyStatusMsg({
          ok: false,
          text:
            res?.message ||
            (language === 'vi' ? 'API Key không hợp lệ.' : 'Invalid Gemini API Key.'),
        });
      }
    } catch (err: any) {
      // Even if endpoint wasn't reachable, save locally so chat request sends it
      if (cleaned) {
        setSavedKey(cleaned);
        localStorage.setItem(GEMINI_KEY_STORAGE, cleaned);
      }
      setKeyStatusMsg({
        ok: false,
        text:
          err?.message ||
          (language === 'vi'
            ? 'Không thể xác thực Key với máy chủ.'
            : 'Could not verify API Key with server.'),
      });
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isSending) return;

    // Automatically pick up typed key even if user forgot to click Save
    const effectiveKey = (savedKey || apiKeyInput).replace(/["'\s]/g, '');
    if (effectiveKey && effectiveKey !== savedKey) {
      setSavedKey(effectiveKey);
      try {
        localStorage.setItem(GEMINI_KEY_STORAGE, effectiveKey);
      } catch {
        // ignore
      }
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const historyForApi: AiChatHistoryItem[] = messages
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInput('');
    setIsSending(true);

    try {
      const res = await ApiClient.sendAiChatMessage({
        message: text,
        history: historyForApi,
        language,
        clientApiKey: effectiveKey || undefined,
      });

      if (res?.engine) {
        setActiveEngine(res.engine);
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content:
          res?.reply ||
          (language === 'vi'
            ? 'AI Coach đang bận xử lý. Vui lòng thử lại sau giây lát.'
            : 'AI Coach is currently busy. Please try again in a moment.'),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            language === 'vi'
              ? 'Không thể kết nối máy chủ AI Coach. Hãy kiểm tra lại kết nối mạng.'
              : 'Could not reach AI Coach server. Please check your connection.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  // Lightweight markdown bold (**text**) and inline code (`text`) formatter
  const renderFormattedContent = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, lineIdx) => {
      const segments = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
      return (
        <p
          key={lineIdx}
          className={`${line.trim() === '' ? 'h-2' : 'leading-relaxed'} ${lineIdx > 0 ? 'mt-1' : ''}`}
        >
          {segments.map((seg, segIdx) => {
            if (seg.startsWith('**') && seg.endsWith('**')) {
              return (
                <strong key={segIdx} className="font-bold text-[#333333]">
                  {seg.slice(2, -2)}
                </strong>
              );
            }
            if (seg.startsWith('`') && seg.endsWith('`')) {
              return (
                <code
                  key={segIdx}
                  className="px-1.5 py-0.5 rounded bg-[#FDE8E9] text-[#C42126] font-semibold text-[11px]"
                >
                  {seg.slice(1, -1)}
                </code>
              );
            }
            return <React.Fragment key={segIdx}>{seg}</React.Fragment>;
          })}
        </p>
      );
    });
  };

  const displayedMessages = [welcomeMessage, ...messages];

  return (
    <>
      {/* FLOATING LAUNCH BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`fixed right-4 md:right-6 z-40 btn-cta-red rounded-full px-4 py-3 shadow-lg flex items-center gap-2.5 cursor-pointer border border-[#F5F5F0]/30 transition-all ${
            isMiniBarVisible
              ? 'bottom-[148px] md:bottom-[96px]'
              : 'bottom-[74px] md:bottom-6'
          }`}
          aria-label="Open FITVANT AI Coach"
        >
          <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left pr-1">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-white/85 leading-none">
              {savedKey || activeEngine === 'GEMINI_2_5_FLASH' ? 'GEMINI LLM' : 'HYBRID AI'}
            </span>
            <span className="font-display text-base font-extrabold uppercase tracking-wide text-white leading-none">
              AI COACH
            </span>
          </div>
        </button>
      )}

      {/* CHATBOT PANEL (Single-Layer Editorial Ivory • Graphite • Crimson) */}
      {isOpen && (
        <div
          className={`fixed right-3 left-3 sm:left-auto sm:right-6 z-50 sm:w-[410px] max-h-[80vh] h-[560px] bg-[#F5F5F0] border border-[#D6D6D2] rounded-[14px] shadow-2xl flex flex-col overflow-hidden ${
            isMiniBarVisible
              ? 'bottom-[145px] md:bottom-[96px]'
              : 'bottom-[70px] md:bottom-6'
          }`}
        >
          {/* 1. HEADER */}
          <div className="px-4 py-3 bg-[#EBEBE6] border-b border-[#D6D6D2] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#C42126] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-lg font-extrabold text-[#333333] uppercase leading-none">
                    FITVANT AI COACH
                  </h3>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FDE8E9] text-[#C42126] border border-[#C42126]/25">
                    {savedKey || activeEngine === 'GEMINI_2_5_FLASH'
                      ? 'Gemini 2.5'
                      : 'Hybrid Engine'}
                  </span>
                </div>
                <p className="text-[11px] text-[#5C5C5C] truncate mt-0.5">
                  {language === 'vi'
                    ? 'Đồng bộ trực tiếp với hồ sơ & giáo án của bạn'
                    : 'Synced with your live biometrics & routine'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowKeyConfig((prev) => !prev)}
                title={
                  language === 'vi'
                    ? 'Cấu hình Gemini API Key (Tùy chọn)'
                    : 'Configure Gemini API Key (Optional)'
                }
                className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  savedKey
                    ? 'bg-[#E8F5E9] border-[#2E7D32]/30 text-[#2E7D32]'
                    : 'bg-[#F5F5F0] border-[#D6D6D2] text-[#5C5C5C] hover:text-[#333333]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleClearChat}
                title={language === 'vi' ? 'Làm mới hội thoại' : 'Reset chat'}
                className="p-1.5 rounded-lg bg-[#F5F5F0] border border-[#D6D6D2] text-[#5C5C5C] hover:text-[#C42126] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title={language === 'vi' ? 'Đóng' : 'Close'}
                className="p-1.5 rounded-lg bg-[#F5F5F0] border border-[#D6D6D2] text-[#333333] hover:border-[#C42126] hover:text-[#C42126] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. OPTIONAL GEMINI API KEY DRAWER */}
          {showKeyConfig && (
            <div className="px-4 py-2.5 bg-[#FDE8E9] border-b border-[#D6D6D2] space-y-2 shrink-0">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#C42126]">
                <span>
                  {language === 'vi'
                    ? '⚡ Google Gemini API Key (Tùy chọn cho Demo LLM):'
                    : '⚡ Google Gemini API Key (Optional for live LLM):'}
                </span>
                {savedKey && (
                  <span className="text-[#2E7D32] flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setKeyStatusMsg(null);
                  }}
                  placeholder="AIzaSy..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#F5F5F0] border border-[#D6D6D2] text-xs text-[#333333] focus:outline-none focus:border-[#C42126]"
                />
                <button
                  type="button"
                  disabled={isVerifyingKey}
                  onClick={handleSaveApiKey}
                  className="px-3 py-1.5 rounded-lg btn-cta-red text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingKey
                    ? language === 'vi'
                      ? 'Đang kiểm tra...'
                      : 'Verifying...'
                    : language === 'vi'
                      ? 'Lưu'
                      : 'Save'}
                </button>
              </div>
              {keyStatusMsg && (
                <p
                  className={`text-[11px] font-bold leading-snug ${
                    keyStatusMsg.ok ? 'text-[#2E7D32]' : 'text-[#C42126]'
                  }`}
                >
                  {keyStatusMsg.text}
                </p>
              )}
              <p className="text-[10px] text-[#5C5C5C] leading-snug">
                {language === 'vi'
                  ? 'Nếu để trống, hệ thống tự động sử dụng Hybrid Medical Expert Engine (100% không cần mạng/key).'
                  : 'If left blank, FITVANT automatically uses the built-in Hybrid Medical Expert Engine.'}
              </p>
            </div>
          )}

          {/* 3. ATHLETE CONTEXT TELEMETRY BAR */}
          {user?.profile && (
            <div className="px-4 py-1.5 bg-[#EBEBE6]/65 border-b border-[#D6D6D2] flex items-center justify-between gap-2 text-[10px] font-semibold text-[#5C5C5C] shrink-0">
              <span className="truncate">
                BMI <strong className="text-[#333333]">{user.profile.bmi}</strong> •{' '}
                <strong className="text-[#333333]">
                  {getGoalLabel(user.profile.primaryGoal, language, 'short')}
                </strong>
              </span>
              {injuryBadgeText ? (
                <span className="text-[#C42126] font-bold truncate max-w-[180px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span className="truncate">{injuryBadgeText}</span>
                </span>
              ) : (
                <span className="text-[#2E7D32] font-bold">
                  {language === 'vi' ? '✓ Khớp an toàn' : '✓ Joints clear'}
                </span>
              )}
            </div>
          )}

          {/* 4. MESSAGE LIST */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 exercise-scroll">
            {displayedMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                      isUser
                        ? 'bg-[#333333] border-[#333333] text-white'
                        : 'bg-[#EBEBE6] border-[#D6D6D2] text-[#C42126]'
                    }`}
                  >
                    {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-xs border ${
                      isUser
                        ? 'bg-[#333333] text-white border-[#333333]'
                        : 'bg-[#EBEBE6] text-[#333333] border-[#D6D6D2]'
                    }`}
                  >
                    {isUser ? (
                      <p className="leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="space-y-0.5">{renderFormattedContent(msg.content)}</div>
                    )}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-[#5C5C5C] pl-2">
                <div className="w-4 h-4 border-2 border-[#C42126] border-t-transparent rounded-full animate-spin" />
                <span>
                  {language === 'vi'
                    ? 'AI Coach đang phân tích hồ sơ thể chất...'
                    : 'AI Coach is analyzing your biometrics...'}
                </span>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>

          {/* 5. QUICK PROMPT SUGGESTION CHIPS */}
          <div className="px-3.5 py-2 bg-[#EBEBE6]/55 border-t border-[#D6D6D2] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {defaultSuggestions.map((promptText) => (
              <button
                key={promptText}
                type="button"
                disabled={isSending}
                onClick={() => handleSendMessage(promptText)}
                className="text-[11px] font-semibold whitespace-nowrap px-2.5 py-1 rounded-full bg-[#F5F5F0] hover:bg-[#FDE8E9] text-[#333333] hover:text-[#C42126] border border-[#D6D6D2] hover:border-[#C42126]/40 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* 6. INPUT FOOTER */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#EBEBE6] border-t border-[#D6D6D2] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
              placeholder={
                language === 'vi'
                  ? 'Hỏi AI Coach về bài tập, chấn thương, calo...'
                  : 'Ask AI Coach about workouts, injuries, calories...'
              }
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#F5F5F0] border border-[#D6D6D2] focus:border-[#C42126] focus:outline-none text-xs font-medium text-[#333333] placeholder:text-[#8A8A85]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="p-2.5 rounded-xl btn-cta-red disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
