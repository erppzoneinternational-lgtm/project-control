import type { Metadata, Viewport } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from 'sonner';
import JsonLd, { pzoneOrganizationSchema, pzoneLocalBusinessSchema } from '@/components/seo/JsonLd';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import { DbKeepAlive } from '@/components/common/DbKeepAlive';
import { PwaRegister } from '@/components/common/PwaRegister';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { FontProvider } from '@/contexts/FontContext';
import { FontCustomizerModal } from '@/components/layout/FontCustomizerModal';

export const metadata: Metadata = {
  metadataBase: new URL('https://pzoneinternational.com'),
  applicationName: 'Pzone ERP Engine',
  title: {
    default: 'شركة بي زون للمنشآت المائية وحمامات السباحة | Pzoneinternational Engine',
    template: '%s | Pzoneinternational Engine',
  },
  description:
    'منصة شركة بي زون المتخصصة في إدارة وتصميم وتنفيذ مشاريع المنشآت المائية وحمامات السباحة والبحيرات الصناعية والنوافير في مصر والشرق الأوسط | Pzone Water Scope Construction Projects Management (Pools, Fountains, Lagoons)',
  keywords: [
    'water scope',
    'pools',
    'fountains',
    'lagoons',
    'Egypt construction',
    'حمامات سباحة',
    'بحيرات صناعية',
    'نوافير',
    'مشاريع مائية',
    'Pzone Enterprise',
  ],
  authors: [{ name: 'Pzone Engineering Team' }],
  creator: 'Pzone International',
  publisher: 'Pzone International',
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    alternateLocale: ['en_US'],
    siteName: 'Pzoneinternational Engine',
    title: 'شركة بي زون للمنشآت المائية وحمامات السباحة | Pzoneinternational Engine',
    description:
      'إدارة وتصميم وتنفيذ مشاريع المنشآت المائية وحمامات السباحة والبحيرات الصناعية والنوافير في مصر والشرق الأوسط | Pzone Water Projects Management',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Pzoneinternational Engine',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'شركة بي زون للمنشآت المائية وحمامات السباحة | Pzoneinternational Engine',
    description:
      'إدارة وتصميم وتنفيذ مشاريع المنشآت المائية وحمامات السباحة والبحيرات الصناعية والنوافير في مصر والشرق الأوسط',
    images: ['/images/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://pzoneinternational.com',
    languages: {
      'ar-EG': 'https://pzoneinternational.com',
      'en-US': 'https://pzoneinternational.com',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pzone ERP',
  },
  icons: {
    icon: [
      { url: '/pzone-emblem.png?v=3', sizes: '512x512', type: 'image/png' },
      { url: '/icon.png?v=3', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=3',
    apple: '/apple-icon.png?v=3',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#07131F' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var root = document.documentElement;

                  // 1. Locale early sync (prevents Flash of Wrong Language)
                  var storedLocale = localStorage.getItem('pzone_locale');
                  if (storedLocale === 'en') {
                    root.setAttribute('lang', 'en');
                    root.setAttribute('data-locale', 'en');
                    root.setAttribute('data-content-dir', 'ltr');
                  } else {
                    root.setAttribute('lang', 'ar');
                    root.setAttribute('data-locale', 'ar');
                    root.setAttribute('data-content-dir', 'rtl');
                  }
                  // Macro layout structure stays stably RTL
                  root.setAttribute('dir', 'rtl');

                  // 2. Theme & Color-Scheme early sync (prevents Flash of Unstyled Content)
                  // Default P.Zone portal theme is Dark Mode unless user explicitly chose Light Mode
                  var storedUserTheme = localStorage.getItem('pzone_theme_user_pref');
                  var isDark = storedUserTheme === 'light' ? false : true;
                  localStorage.setItem('pzone_theme', isDark ? 'dark' : 'light');

                  if (isDark) {
                    root.classList.add('dark');
                    root.classList.remove('light');
                    root.style.colorScheme = 'dark';
                    root.setAttribute('data-theme', 'dark');
                  } else {
                    root.classList.add('light');
                    root.classList.remove('dark');
                    root.style.colorScheme = 'light';
                    root.setAttribute('data-theme', 'light');
                  }

                  // 3. User Custom Font early sync (prevents Flash of Unstyled Font)
                  var storedFont = localStorage.getItem('pzone_font');
                  if (storedFont && storedFont !== 'default') {
                    root.setAttribute('data-font', storedFont);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <JsonLd data={[pzoneOrganizationSchema, pzoneLocalBusinessSchema]} />
      </head>
      <body className="antialiased bg-background text-foreground selection:bg-[#0B7285] selection:text-white dark:selection:bg-[#26C6DA] dark:selection:text-[#07131F]" suppressHydrationWarning>
        <GoogleAnalytics />
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider>
              <FontProvider>
                <DbKeepAlive />
                <PwaRegister />
                {children}
                <FontCustomizerModal />
                <Toaster position="top-center" richColors />
              </FontProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
