'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SWRConfig } from 'swr';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { I18nProvider } from '@/lib/i18n/I18nProvider';

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
}

// SWR configuration
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: (error: any) => {
    // Don't retry on 4xx errors
    return error?.status >= 500;
  },
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  fetcher: async (url: string) => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = new Error('An error occurred while fetching the data.');
      (error as any).status = response.status;
      (error as any).info = await response.json();
      throw error;
    }

    return response.json();
  },
};

export function Providers({ children, locale }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SWRConfig value={swrConfig}>
      <ThemeProvider>
        <I18nProvider locale={locale}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </SWRConfig>
  );
}
