'use client';

import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useLanguage } from '../../context/LanguageContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();

  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'not-configured'}
      locale={language}
    >
      {children}
    </GoogleOAuthProvider>
  );
}
