import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { DataCacheProvider } from '../context/DataCacheContext';
import { WorkoutProvider } from '../context/WorkoutContext';
import { TopHeader } from '../components/layout/TopHeader';
import { MobileNav } from '../components/layout/MobileNav';
import { MiniWorkoutBar } from '../components/workout/MiniWorkoutBar';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700', '800', '900'],
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
        className="bg-[#0A0E07] text-white min-h-screen antialiased flex flex-col font-sans selection:bg-[#C8F135] selection:text-[#0A0E07]"
        suppressHydrationWarning
      >
        <LanguageProvider>
          <AuthProvider>
            <DataCacheProvider>
              <WorkoutProvider>
                <div className="w-full min-h-screen flex flex-col pb-20 md:pb-8">
                  <TopHeader />
                  <main className="flex-1 w-full">{children}</main>
                  <MiniWorkoutBar />
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
