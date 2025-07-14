import { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { dir } from 'i18next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    template: '%s | Antragsgrün',
    default: 'Antragsgrün - Motion and Amendment Management',
  },
  description: 'Modern motion and amendment management system for assemblies, associations, and decision-making organizations',
  keywords: ['motion management', 'amendment system', 'assembly tools', 'decision making', 'governance'],
  authors: [{ name: 'Antragsgrün Team' }],
  creator: 'Antragsgrün',
  publisher: 'Antragsgrün',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://antragsgruen.de'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
      'fa-IR': '/fa',
      'de-DE': '/de',
      'fr-FR': '/fr',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Antragsgrün',
    title: 'Antragsgrün - Motion and Amendment Management',
    description: 'Modern motion and amendment management system for assemblies, associations, and decision-making organizations',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Antragsgrün',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Antragsgrün - Motion and Amendment Management',
    description: 'Modern motion and amendment management system for assemblies, associations, and decision-making organizations',
    images: ['/og-image.png'],
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function RootLayout({
  children,
  params: { locale = 'en' },
}: RootLayoutProps) {
  const direction = dir(locale);

  return (
    <html 
      lang={locale} 
      dir={direction}
      className={`${inter.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#007AFF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Antragsgrün" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#007AFF" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
      </head>
      <body 
        className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${direction === 'rtl' ? 'rtl' : 'ltr'}`}
        dir={direction}
      >
        <Providers locale={locale}>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
