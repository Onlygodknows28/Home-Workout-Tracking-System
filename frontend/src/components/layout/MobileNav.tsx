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

  const navItems = [
    { href: '/', label: t('navHome'), icon: Home },
    { href: '/workout', label: t('navWorkouts'), icon: Dumbbell },
    { href: '/buddy', label: t('navBuddy'), icon: Users },
    { href: '/shop', label: t('navShop'), icon: ShoppingBag },
    { href: '/profile', label: t('navProfile'), icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F5F5F0]/95 backdrop-blur-md border-t border-[#D6D6D2] pb-safe">
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex flex-col items-center justify-center min-h-[50px] min-w-[58px] rounded-lg transition-colors select-none px-2',
                isActive
                  ? 'text-[#C42126] font-bold'
                  : 'text-[#5C5C5C] hover:text-[#333333] font-medium',
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
