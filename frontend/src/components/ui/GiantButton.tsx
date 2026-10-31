'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface GiantButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'dark' | 'success' | 'warning' | 'danger' | 'secondary' | 'outline';
  size?: 'normal' | 'large' | 'giant';
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: string;
  isLoading?: boolean;
}

export function GiantButton({
  children,
  variant = 'primary',
  size = 'large',
  icon,
  subtitle,
  badge,
  isLoading,
  className,
  disabled,
  ...props
}: GiantButtonProps) {
  const variantStyles = {
    primary:
      'bg-[#C8F135] hover:bg-[#D6F858] text-[#0B0F07] border-2 border-[#C8F135] shadow-[0_8px_28px_rgba(200,241,53,0.22)] active:scale-[0.98]',
    dark:
      'bg-[#141C0F] hover:bg-[#1C2715] text-white border-2 border-white/15 active:scale-[0.98]',
    success:
      'bg-[#C8F135] hover:bg-[#D6F858] text-[#0B0F07] border-2 border-[#C8F135] shadow-[0_8px_28px_rgba(200,241,53,0.22)] active:scale-[0.98]',
    warning:
      'bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0B0F07] border-2 border-[#FBBF24] active:scale-[0.98]',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white border-2 border-rose-500 active:scale-[0.98]',
    secondary:
      'bg-[#182211] hover:bg-[#212E18] text-white border-2 border-[#C8F135]/30 active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-white/5 text-white border-2 border-white/20 active:scale-[0.98]',
  };

  const sizeStyles = {
    normal: 'min-h-[48px] py-2.5 px-4 text-sm font-bold rounded-xl',
    large: 'min-h-[58px] py-3.5 px-6 text-base font-extrabold rounded-2xl',
    giant: 'min-h-[72px] py-4 px-6 text-lg font-black rounded-2xl',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'w-full flex items-center justify-between font-extrabold select-none transition-all duration-150 relative overflow-hidden cursor-pointer',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed transform-none shadow-none',
        className,
      )}
      {...props}
    >
      <div className="flex items-center space-x-3 text-left">
        {icon && <span className="text-2xl shrink-0">{icon}</span>}
        <div className="flex flex-col">
          <span className="tracking-wide uppercase leading-tight">{children}</span>
          {subtitle && (
            <span className="text-xs font-semibold opacity-80 tracking-normal mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {badge && (
        <span className="bg-black/20 text-current px-3 py-1 rounded-full text-xs font-black shrink-0 ml-2">
          {badge}
        </span>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="w-6 h-6 border-3 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
}
