import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { DataCacheProvider } from '../context/DataCacheContext';
import { WorkoutProvider } from '../context/WorkoutContext';
import { TopHeader } from '../components/layout/TopHeader';
import { MobileNav } from '../components/layout/MobileNav';
import { MiniWorkoutBar } from '../components/workout/MiniWorkoutBar';
import { AiCoachChatbot } from '../components/workout/AiCoachChatbot';

const plusJakarta = localFont({
  src: [
    { path: '../fonts/PlusJakartaSans-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../fonts/PlusJakartaSans-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../fonts/PlusJakartaSans-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../fonts/PlusJakartaSans-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../fonts/PlusJakartaSans-ExtraBold.ttf', weight: '800', style: 'normal' },
  ],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const barlowCondensed = localFont({
  src: [
    { path: '../fonts/BarlowCondensed-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../fonts/BarlowCondensed-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../fonts/BarlowCondensed-ExtraBold.ttf', weight: '800', style: 'normal' },
    { path: '../fonts/BarlowCondensed-Black.ttf', weight: '900', style: 'normal' },
  ],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FITVANT - Home Workout Tracking & Social Gamification System',
  description: 'Khóa Luận Tốt Nghiệp: Hệ Thống Tập Luyện Calisthenics & Gamification Kỷ Luật',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${plusJakarta.variable} ${barlowCondensed.variable}`}
      suppressHydrationWarning
    >
      <body
        className="bg-[#F5F5F0] text-[#333333] min-h-screen antialiased flex flex-col font-sans selection:bg-[#C42126] selection:text-white"
        suppressHydrationWarning
      >
        <LanguageProvider>
          <AuthProvider>
            <DataCacheProvider>
              <WorkoutProvider>
                <div className="w-full min-h-screen flex flex-col pb-20 md:pb-0">
                  <TopHeader />
                  <main className="flex-1 w-full">{children}</main>
                  <MiniWorkoutBar />
                  <AiCoachChatbot />
                  <MobileNav />
                </div>
              </WorkoutProvider>
            </DataCacheProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
