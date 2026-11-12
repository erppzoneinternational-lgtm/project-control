import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { AuthGuard } from '../AuthGuard';

const mockUseAuth = vi.fn();
const mockUseRouter = vi.fn();
const mockUsePathname = vi.fn();
const mockUseUserRoles = vi.fn();
const mockUseModuleAccess = vi.fn();

vi.mock('@/lib/stores/useAuthStore', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  usePathname: () => mockUsePathname(),
}));

vi.mock('@/lib/hooks/useUserRoles', () => ({
  useUserRoles: () => mockUseUserRoles(),
}));

vi.mock('@/lib/hooks/useModuleAccess', () => ({
  useModuleAccess: () => mockUseModuleAccess(),
}));

describe('AuthGuard — Quarantine and RBAC Protection', () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ replace: mockReplace });
    mockUseModuleAccess.mockReturnValue({ data: [], isLoading: false });
  });

  it('renders quarantine screen for pending_activation user', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'pending@pzone.com' },
      loading: false,
      signOut: vi.fn(),
    });
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseUserRoles.mockReturnValue({
      roles: [],
      status: 'pending_activation',
      isActive: false,
      isPending: true,
      isSuspended: false,
      isAdmin: false,
      isLoading: false,
    });

    const html = ReactDOMServer.renderToString(
      <AuthGuard>
        <div id="protected-content">Content</div>
      </AuthGuard>
    );

    expect(html).toContain('عفواً، حسابك في انتظار تعيين الصلاحيات');
    expect(html).toContain('201229994728');
    expect(html).not.toContain('protected-content');
  });

  it('renders suspended screen for suspended user', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-2', email: 'suspended@pzone.com' },
      loading: false,
      signOut: vi.fn(),
    });
    mockUsePathname.mockReturnValue('/projects');
    mockUseUserRoles.mockReturnValue({
      roles: ['site_engineer'],
      status: 'suspended',
      isActive: false,
      isPending: false,
      isSuspended: true,
      isAdmin: false,
      isLoading: false,
    });

    const html = ReactDOMServer.renderToString(
      <AuthGuard>
        <div id="protected-content">Content</div>
      </AuthGuard>
    );

    expect(html).toContain('الحساب موقوف مؤقتاً');
    expect(html).toContain('201229994728');
    expect(html).not.toContain('protected-content');
  });

  it('renders 403 Forbidden screen when active user attempts unauthorized path', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-3', email: 'engineer@pzone.com' },
      loading: false,
      signOut: vi.fn(),
    });
    mockUsePathname.mockReturnValue('/user-management');
    mockUseUserRoles.mockReturnValue({
      roles: ['site_engineer'],
      status: 'active',
      isActive: true,
      isPending: false,
      isSuspended: false,
      isAdmin: false,
      isLoading: false,
    });

    const html = ReactDOMServer.renderToString(
      <AuthGuard>
        <div id="protected-content">Content</div>
      </AuthGuard>
    );

    expect(html).toContain('403');
    expect(html).toContain('غير مصرح بالدخول');
    expect(html).not.toContain('protected-content');
  });

  it('renders protected children when active user has authorized role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-4', email: 'admin@pzone.com' },
      loading: false,
      signOut: vi.fn(),
    });
    mockUsePathname.mockReturnValue('/user-management');
    mockUseUserRoles.mockReturnValue({
      roles: ['admin'],
      status: 'active',
      isActive: true,
      isPending: false,
      isSuspended: false,
      isAdmin: true,
      isLoading: false,
    });

    const html = ReactDOMServer.renderToString(
      <AuthGuard>
        <div id="protected-content">Admin Dashboard Content</div>
      </AuthGuard>
    );

    expect(html).toContain('Admin Dashboard Content');
    expect(html).not.toContain('403');
    expect(html).not.toContain('عفواً، حسابك في انتظار تعيين الصلاحيات');
  });
});
