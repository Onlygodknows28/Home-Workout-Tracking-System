'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache } from '../../context/DataCacheContext';
import { Flame, Shield, Coins, Menu, X, LogOut, ArrowUpRight } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';

export function TopHeader() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState<string>('');

  const handlePrefetch = (href: string, hash?: string) => {
    if (hash) return;
    try {
      router.prefetch(href);
    } catch {
      // Ignore prefetch errors
    }
  };

  // ScrollSpy & Hash listener for Landing Page
  useEffect(() => {
    if (isAuthenticated || pathname !== '/') {
      return;
    }

    const updateActiveFromHash = () => {
      const currentHash = window.location.hash;
      setActiveHash(currentHash);
    };

    // Initial check
    updateActiveFromHash();

    // ScrollSpy via IntersectionObserver for #about and #features
    const sections = ['about', 'features'];
    const observerOptions = {
      root: null,
      rootMargin: '-25% 0px -55% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveHash(`#${entry.target.id}`);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      if (window.scrollY < 250) {
        setActiveHash('');
      }
    };

    window.addEventListener('hashchange', updateActiveFromHash);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', updateActiveFromHash);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isAuthenticated, pathname]);

  // Hide top navigation during active giant-UI workout mode to prevent accidental exit
  if (pathname === '/workout/active') {
    return null;
  }

  const navLinks = isAuthenticated
    ? [
        { href: '/', label: t('navHome'), hash: '' },
        { href: '/workout', label: t('navWorkouts'), hash: '' },
        { href: '/buddy', label: t('navBuddy'), hash: '' },
        { href: '/shop', label: t('navShop'), hash: '' },
        { href: '/profile', label: t('navProfile'), hash: '' },
      ]
    : [
        { href: '/', label: t('navHome'), hash: '' },
        { href: '/#features', label: t('navServices'), hash: '#features' },
        { href: '/workout', label: t('navWorkouts'), hash: '' },
        { href: '/buddy', label: t('navBuddy'), hash: '' },
        { href: '/#about', label: t('navAbout'), hash: '#about' },
      ];

  const isLinkActive = (link: { href: string; hash: string }) => {
    if (isAuthenticated) {
      if (link.href === '/') return pathname === '/';
      return pathname === link.href || pathname.startsWith(`${link.href}/`);
    }

    // Guest mode active state logic with ScrollSpy / Hash support
    if (link.hash) {
      return pathname === '/' && activeHash === link.hash;
    }

    if (link.href === '/') {
      return pathname === '/' && activeHash === '';
    }

    return pathname === link.href || pathname.startsWith(`${link.href}/`);
  };

  const handleNavClick = (hash: string) => {
    setActiveHash(hash);
    setMobileMenuOpen(false);
    if (hash === '' && pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0E07]/90 backdrop-blur-xl text-white border-b border-white/[0.08]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
        {/* Left: FITVANT Geometric V-Delta Logo & Condensed Brand Name */}
        <Link
          href="/"
          onClick={() => handleNavClick('')}
          className="flex items-center gap-2.5 group shrink-0"
        >
          <svg
            width="34"
            height="30"
            viewBox="0 0 36 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform duration-200 group-hover:scale-105"
          >
            <path d="M2 4H10.5L18 20.5L25.5 4H34L20.5 30H15.5L2 4Z" fill="#C8F135" />
            <path d="M12.5 4H23.5L18 15L12.5 4Z" fill="#84B816" />
          </svg>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-black text-[26px] tracking-wider text-white leading-none">
              FITVANT
            </span>
            <span className="hidden xl:inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#C8F135] bg-[#C8F135]/10 border border-[#C8F135]/30 px-1.5 py-0.5 rounded">
              AI
            </span>
          </div>
        </Link>

        {/* Center: Clean Editorial Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const active = isLinkActive(link);
            return (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => handlePrefetch(link.href, link.hash)}
                onClick={() => handleNavClick(link.hash)}
                className={`relative py-2 text-[13px] font-bold tracking-wide transition-colors ${
                  active
                    ? 'text-[#C8F135]'
                    : 'text-[#A3AC9C] hover:text-white'
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C8F135] rounded-full shadow-[0_0_10px_#C8F135]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Language Switcher + Stats / Auth CTA + Notification + Mobile Menu */}
        <div className="flex items-center space-x-2.5">
          {/* Language Switcher (VI / EN) */}
          <div className="flex items-center bg-[#141C0F] rounded-full p-0.5 border border-white/10">
            <button
              onClick={() => setLanguage('vi')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                language === 'vi'
                  ? 'bg-[#C8F135] text-[#0B0F07] shadow-xs'
                  : 'text-[#9BA394] hover:text-white'
              }`}
            >
              VI
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-[#C8F135] text-[#0B0F07] shadow-xs'
                  : 'text-[#9BA394] hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {!isLoading && isAuthenticated && user ? (
            <div className="hidden sm:flex items-center space-x-2">
              {/* Level Badge */}
              <Link
                href="/profile"
                className="flex items-center space-x-1.5 bg-[#141C0F] hover:bg-[#1B2614] px-3 py-1.5 rounded-full text-xs font-extrabold border border-white/12 transition-colors"
              >
                <span className="text-[#0B0F07] font-black bg-[#C8F135] px-1.5 py-0.5 rounded-full text-[10px]">
                  LV.{user.level}
                </span>
                <span className="text-white">{user.name.split(' ')[0]}</span>
              </Link>

              {/* Streak */}
              <div className="flex items-center space-x-1 bg-[#141C0F] text-white px-3 py-1.5 rounded-full text-xs font-extrabold border border-white/12">
                <Flame className="w-4 h-4 text-[#C8F135] fill-[#C8F135]" />
                <span className="font-telemetry text-sm tracking-wide">{user.currentStreak}d</span>
                {user.streakFreezeCount > 0 && (
                  <Shield className="w-3.5 h-3.5 text-[#38BDF8] fill-[#38BDF8] ml-0.5" />
                )}
              </div>

              {/* FitCoins */}
              <Link
                href="/shop"
                className="flex items-center space-x-1 bg-[#C8F135]/15 hover:bg-[#C8F135]/25 text-[#C8F135] border border-[#C8F135]/35 px-3 py-1.5 rounded-full text-xs font-extrabold transition-colors"
              >
                <Coins className="w-3.5 h-3.5 text-[#C8F135]" />
                <span className="font-telemetry text-sm tracking-wide">{user.fitCoins}</span>
              </Link>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-2.5">
              <Link
                href="/login"
                className="bg-[#141C0F] hover:bg-[#1C2715] text-white/90 hover:text-white border border-white/12 text-xs font-extrabold uppercase tracking-wider px-4 py-2.5 rounded-full transition-colors"
              >
                {t('navLogin')}
              </Link>
              <Link
                href="/register"
                className="volt-pill-btn rounded-full pl-5 pr-1.5 py-1.5 flex items-center gap-2.5 font-extrabold text-[11px] tracking-wider uppercase"
              >
                <span>{t('navRegister')}</span>
                <span className="w-7 h-7 rounded-full bg-[#0B0F07] text-[#C8F135] flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </span>
              </Link>
            </div>
          )}

          {/* Notification Center */}
          <NotificationBell />

          {/* Circular Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-full bg-[#141C0F] border border-white/12 text-white flex items-center justify-center hover:border-[#C8F135]/50 hover:text-[#C8F135] transition-colors cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="bg-[#0E140A]/98 backdrop-blur-2xl text-white px-6 py-5 border-t border-white/10 space-y-4">
          <div className="space-y-1.5 pb-3 border-b border-white/10">
            {navLinks.map((link) => {
              const active = isLinkActive(link);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => handleNavClick(link.hash)}
                  className={`block py-2.5 px-4 rounded-xl text-sm font-extrabold transition-colors ${
                    active
                      ? 'bg-[#C8F135] text-[#0B0F07]'
                      : 'text-[#A3AC9C] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {isAuthenticated ? (
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 py-3 rounded-xl font-black text-xs uppercase cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('navLogout')}</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center bg-[#141C0F] border border-white/15 text-white py-3 rounded-xl font-black text-xs uppercase"
              >
                {t('navLogin')}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center bg-[#C8F135] text-[#0B0F07] py-3 rounded-xl font-black text-xs uppercase"
              >
                {t('navRegister')}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
