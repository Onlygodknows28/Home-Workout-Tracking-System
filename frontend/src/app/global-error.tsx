'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('FitVant Root Layout Global Error:', error);
  }, [error]);

  return (
    <html lang="vi">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#F5F5F0', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ maxWidth: '440px', width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #D6D6D2', borderRadius: '16px', padding: '2rem', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '56px', height: '56px', margin: '0 auto 1.25rem', borderRadius: '16px', backgroundColor: '#FDE8E9', border: '1px solid #F5C2C4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C42126', fontSize: '24px', fontWeight: 'bold' }}>
              !
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#333333', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              ỨNG DỤNG GẶP SỰ CỐ TẢI
            </h2>
            <p style={{ fontSize: '13px', color: '#5C5C5C', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Đã xảy ra lỗi khởi tạo giao diện người dùng. Vui lòng thử tải lại hoặc quay về trang chủ.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => reset()}
                style={{ flex: 1, backgroundColor: '#C42126', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                Thử lại
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                style={{ flex: 1, backgroundColor: '#EBEBE6', color: '#333333', border: '1px solid #D6D6D2', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                Trang chủ
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
