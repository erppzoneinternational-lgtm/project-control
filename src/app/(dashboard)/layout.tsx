'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { EnterpriseAppShell } from '@/components/layout/EnterpriseAppShell';
import { GlobalTableResizeProvider } from '@/components/ui/ResizableTable';
import { UserActivityTracker } from '@/components/providers/UserActivityTracker';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

/**
 * Dashboard route group layout — protected by AuthGuard.
 * LanguageProvider is mounted once at the root layout (src/app/layout.tsx)
 * so language state propagates uniformly across the entire tree.
 * EnterpriseAppShell hosts TopNav and NavigationPersistence around {children}.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <UserActivityTracker showBadge={false}>
        <EnterpriseAppShell>
          <GlobalTableResizeProvider>
            <ErrorBoundary
              fallbackTitleAr="تعذر تحميل محتوى هذه الصفحة حالياً"
              fallbackTitleEn="Unable to load page content"
              showHomeButton={true}
            >
              {children}
            </ErrorBoundary>
          </GlobalTableResizeProvider>
        </EnterpriseAppShell>
      </UserActivityTracker>
    </AuthGuard>
  );
}
