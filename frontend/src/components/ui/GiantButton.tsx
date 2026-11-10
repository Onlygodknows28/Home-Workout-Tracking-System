'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface GiantButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
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
      'bg-[#C42126] hover:bg-[#A3191E] text-[#FFFFFF] border border-[#C42126] active:scale-[0.99]',
    secondary:
      'bg-[#EBEBE6] hover:bg-[#DFDFD8] text-[#333333] border border-[#D6D6D2] active:scale-[0.99]',
    outline:
      'bg-transparent hover:bg-[#EBEBE6] text-[#333333] border border-[#D6D6D2] active:scale-[0.99]',
  };

  const sizeStyles = {
    normal: 'min-h-[44px] py-2.5 px-4 text-xs font-semibold rounded-lg',
    large: 'min-h-[52px] py-3 px-5 text-sm font-bold rounded-xl',
    giant: 'min-h-[60px] py-3.5 px-6 text-base font-bold rounded-xl',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'w-full flex items-center justify-between select-none transition-all duration-150 relative overflow-hidden cursor-pointer',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed transform-none',
        className,
      )}
      {...props}
    >
      <div className="flex items-center space-x-3 text-left">
        {icon && <span className="text-xl shrink-0">{icon}</span>}
        <div className="flex flex-col">
          <span className="tracking-wide uppercase leading-tight">{children}</span>
          {subtitle && (
            <span className="text-xs font-normal opacity-85 tracking-normal mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {badge && (
        <span className="font-telemetry text-xs font-bold opacity-95 shrink-0 ml-2">
          {badge}
        </span>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
}
