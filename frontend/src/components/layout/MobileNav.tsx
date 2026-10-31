'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';
import { Home, Dumbbell, Users, ShoppingBag, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  if (pathname === '/workout/active') {
    return null;
  }

  const navItems = [
    { href: '/', label: t('navHome'), icon: Home },
    { href: '/workout', label: t('navWorkouts'), icon: Dumbbell },
    { href: '/buddy', label: t('navBuddy'), icon: Users },
    { href: '/shop', label: t('navShop'), icon: ShoppingBag },
    { href: '/profile', label: t('navProfile'), icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D1309]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl pb-safe">
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-h-[52px] min-w-[58px] rounded-xl transition-all select-none px-2',
                isActive
                  ? 'text-[#C8F135] font-black bg-[#C8F135]/12 border border-[#C8F135]/25'
                  : 'text-[#8E9688] hover:text-white font-bold',
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px] mt-0.5 tracking-tight font-extrabold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
