'use client';

import React from 'react';
import { WifiLoader } from '@/components/ui/WifiLoader';

export default function RootLoading() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-6">
      <WifiLoader
        text="p.zone..."
        size="md"
        variant="emerald"
        subtitle="جاري الاتصال بالخادم وتحميل بيانات المنظومة..."
      />
    </div>
  );
}
