'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Flame, Shield, Coins, Menu, X, LogOut } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { formatPersonName } from '../../lib/catalogTranslations';

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

  // Eagerly prefetch all primary route bundles right after initial mount for 0ms route transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      const coreRoutes = ['/', '/workout', '/buddy', '/shop', '/profile', '/login', '/register'];
      coreRoutes.forEach((route) => {
        try {
          router.prefetch(route);
        } catch {
          // Ignore prefetch errors
        }
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (isAuthenticated || pathname !== '/') {
      return;
    }

    const updateActiveFromHash = () => {
      const currentHash = window.location.hash;
      setActiveHash(currentHash);
    };

    updateActiveFromHash();

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
    <header className="sticky top-0 z-40 w-full bg-[#F5F5F0]/95 backdrop-blur-md text-[#333333] border-b border-[#D6D6D2]">
      <div className="max-w-[1220px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Left: FITVANT Wing Logo & Condensed Brand Name */}
        <Link
          href="/"
          onClick={() => handleNavClick('')}
          className="flex items-center gap-2 group shrink-0"
        >
          <svg
            className="w-6 h-6 text-[#C42126] transition-transform duration-200 group-hover:scale-105"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M2 7h6l3 5-3 5H2l3-5-3-5zm10 0h6l3 5-3 5h-6l3-5-3-5z" />
          </svg>
          <span className="font-display font-extrabold text-[26px] tracking-wider text-[#333333] leading-none">
            FITVANT
          </span>
        </Link>

        {/* Center: Clean Editorial Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium text-[#5C5C5C]">
          {navLinks.map((link) => {
            const active = isLinkActive(link);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={link.hash ? false : true}
                onMouseEnter={() => handlePrefetch(link.href, link.hash)}
                onClick={() => handleNavClick(link.hash)}
                className={`relative py-1.5 transition-colors ${
                  active
                    ? 'text-[#333333] font-semibold border-b-2 border-[#C42126]'
                    : 'text-[#5C5C5C] hover:text-[#333333]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Language Switcher + Flush Hairline Stats / Auth CTA + Notification + Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Language Switcher (VI / EN) — Single-layer segmented control */}
          <div className="flex items-center border border-[#D6D6D2] rounded-lg overflow-hidden divide-x divide-[#D6D6D2] bg-[#EBEBE6]">
            <button
              onClick={() => setLanguage('vi')}
              className={`px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                language === 'vi'
                  ? 'bg-[#333333] text-[#FFFFFF]'
                  : 'text-[#5C5C5C] hover:text-[#333333]'
              }`}
            >
              VI
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                language === 'en'
                  ? 'bg-[#333333] text-[#FFFFFF]'
                  : 'text-[#5C5C5C] hover:text-[#333333]'
              }`}
            >
              EN
            </button>
          </div>

          {!isLoading && isAuthenticated && user ? (
            <div className="hidden sm:flex items-center divide-x divide-[#D6D6D2] border-l border-[#D6D6D2] pl-3 text-xs font-semibold text-[#333333]">
              {/* Level & Name */}
              <Link
                href="/profile"
                className="pr-3 hover:text-[#C42126] transition-colors flex items-center gap-1.5"
              >
                <span className="font-telemetry font-bold text-[#C42126]">LV.{user.level}</span>
                <span>{formatPersonName(user.name.split(' ')[0], language)}</span>
              </Link>

              {/* Streak */}
              <div className="px-3 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#C42126] fill-[#C42126]" />
                <span className="font-telemetry font-bold">{user.currentStreak}d</span>
                {user.streakFreezeCount > 0 && (
                  <Shield className="w-3.5 h-3.5 text-[#2E7D32] ml-0.5" />
                )}
              </div>

              {/* FitCoins */}
              <Link
                href="/shop"
                className="pl-3 flex items-center gap-1 hover:text-[#C42126] transition-colors"
              >
                <Coins className="w-3.5 h-3.5 text-[#C42126]" />
                <span className="font-telemetry font-bold">{user.fitCoins}</span>
              </Link>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2.5">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg border border-[#D6D6D2] hover:bg-[#EBEBE6] text-[#333333] text-xs font-semibold transition-colors"
              >
                {t('navLogin')}
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 rounded-lg btn-cta-red text-xs font-semibold"
              >
                {t('navRegister')}
              </Link>
            </div>
          )}

          {/* Notification Center */}
          <NotificationBell />

          {/* Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 rounded-lg bg-[#EBEBE6] border border-[#D6D6D2] text-[#333333] flex items-center justify-center hover:border-[#C42126] hover:text-[#C42126] transition-colors cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile / Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="bg-[#F5F5F0] text-[#333333] px-6 py-4 border-t border-[#D6D6D2] space-y-3">
          <div className="divide-y divide-[#D6D6D2] border-b border-[#D6D6D2]">
            {navLinks.map((link) => {
              const active = isLinkActive(link);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => handleNavClick(link.hash)}
                  className={`block py-2.5 text-sm font-semibold transition-colors ${
                    active ? 'text-[#C42126] font-bold' : 'text-[#5C5C5C] hover:text-[#333333]'
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
              className="w-full flex items-center justify-center gap-2 bg-[#FDE8E9] hover:bg-[#C42126] text-[#C42126] hover:text-white py-2.5 rounded-lg font-semibold text-xs uppercase cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('navLogout')}</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center bg-[#EBEBE6] border border-[#D6D6D2] text-[#333333] py-2.5 rounded-lg font-semibold text-xs uppercase"
              >
                {t('navLogin')}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center btn-cta-red py-2.5 rounded-lg font-semibold text-xs uppercase"
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
