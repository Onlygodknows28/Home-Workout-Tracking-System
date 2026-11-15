'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client-side errors for debugging
    console.error('FitVant Client Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bento-tile p-8 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FDE8E9] border border-[#F5C2C4] flex items-center justify-center text-[#C42126]">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-2xl font-black text-[#333333] tracking-tight">
            ĐÃ XẢY RA LỖI TẠM THỜI
          </h2>
          <p className="text-xs text-[#5C5C5C] leading-relaxed">
            Ứng dụng gặp sự cố tải trang hoặc gián đoạn kết nối. Dữ liệu tài khoản và tiến trình tập luyện của bạn vẫn an toàn.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 btn-cta-red py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>
          <Link
            href="/"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[#D6D6D2] hover:bg-[#EBEBE6] text-[#333333] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
