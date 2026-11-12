'use client';

import React from 'react';
import { useRoleRedirect } from '@/lib/hooks/useRoleRedirect';
import { useLanguage } from '@/contexts/LanguageContext';
import { UiverseLoader } from '@/components/ui/UiverseLoader';

export default function HomePage() {
  const { isLoading, isRedirecting } = useRoleRedirect({
    autoRedirect: true,
    allowedSourcePaths: ['/'],
    fallbackPath: '/projects',
  });
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <UiverseLoader
        text="P.ZONE..."
        size="lg"
        subtitle={isAr ? 'جاري توجيهك إلى مساحة عمل دورك في المنظومة...' : 'Routing to your role workspace...'}
      />
    </div>
  );
}
