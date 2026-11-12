import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UserService,
  generateAdminWhatsAppUrl,
  generateAdminEmailUrl,
  generateUserContactWhatsAppUrl,
  ADMIN_WHATSAPP_NUMBER,
  ADMIN_EMAIL,
  ADMIN_DISPLAY_PHONE,
  PRIMARY_ADMIN_EMAILS,
} from '../userService';

const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../auditLog.service', () => ({
  AuditLogService: {
    logAction: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('UserService & WhatsApp Generators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAdminWhatsAppUrl', () => {
    it('generates a valid URL pointing to the Admin WhatsApp number', () => {
      const url = generateAdminWhatsAppUrl({
        fullName: 'أحمد محمود',
        email: 'ahmed@pzone.com',
      });

      expect(url).toContain(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}`);
      expect(url).toContain(encodeURIComponent('أحمد محمود'));
      expect(url).toContain(encodeURIComponent('ahmed@pzone.com'));
    });
  });

  describe('generateAdminEmailUrl', () => {
    it('generates a valid mailto URL pointing to the Admin Email', () => {
      const url = generateAdminEmailUrl({
        fullName: 'حسام مصطفى',
        email: 'hossam@pzone.com',
      });

      expect(url).toContain(`mailto:${ADMIN_EMAIL}`);
      expect(url).toContain(encodeURIComponent('حسام مصطفى'));
      expect(url).toContain(encodeURIComponent('hossam@pzone.com'));
    });
  });

  describe('Admin Constants & Primary Admins', () => {
    it('exposes correct official admin email and phone', () => {
      expect(ADMIN_EMAIL).toBe('hassansolimanofficial@gmail.com');
      expect(ADMIN_DISPLAY_PHONE).toBe('01229994728');
      expect(ADMIN_WHATSAPP_NUMBER).toBe('201229994728');
      expect(PRIMARY_ADMIN_EMAILS).toContain('hassansolimanofficial@gmail.com');
    });
  });

  describe('generateUserContactWhatsAppUrl', () => {
    it('returns null if user has no phone', () => {
      const url = generateUserContactWhatsAppUrl({
        fullName: 'سعيد عبد الله',
        email: 'saeed@pzone.com',
      });
      expect(url).toBeNull();
    });

    it('generates a clean WhatsApp URL when phone is provided with special chars', () => {
      const url = generateUserContactWhatsAppUrl({
        fullName: 'سعيد عبد الله',
        phone: '+20-100-123-4567',
      });

      expect(url).toBeDefined();
      expect(url).toContain('https://wa.me/201001234567');
      expect(url).toContain(encodeURIComponent('سعيد عبد الله'));
    });
  });

  describe('UserService.getUserAssignedProjectIds', () => {
    it('returns array of assigned project IDs', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'pm_user_project_access') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ project_id: 'proj-1' }, { project_id: 'proj-2' }],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const projectIds = await UserService.getUserAssignedProjectIds('user-123');
      expect(projectIds).toEqual(['proj-1', 'proj-2']);
    });

    it('safely returns empty array when database query fails', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'pm_user_project_access') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'RLS check failed' },
              }),
            }),
          };
        }
        return {};
      });

      const projectIds = await UserService.getUserAssignedProjectIds('user-123');
      expect(projectIds).toEqual([]);
    });
  });

  describe('UserService.updateUserAccess', () => {
    it('updates profile, fullName, and replaces project access successfully', async () => {
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'user-abc', full_name: 'Old Name' },
            error: null,
          }),
        }),
      });
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const deleteMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const insertMock = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: selectMock,
            update: updateMock,
          };
        }
        if (table === 'pm_user_project_access') {
          return {
            delete: deleteMock,
            insert: insertMock,
          };
        }
        return {};
      });

      await UserService.updateUserAccess({
        userId: 'user-abc',
        fullName: 'Omar M.',
        status: 'active',
        roles: ['project_manager'],
        assignedProjectIds: ['p1', 'p2'],
        priceAccessGranted: true,
        adminUserId: 'admin-1',
      });

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Omar M.',
          full_name_ar: 'Omar M.',
          full_name_en: 'Omar M.',
          is_active: true,
          roles: ['project_manager'],
        })
      );
      expect(deleteMock).toHaveBeenCalled();
      expect(insertMock).toHaveBeenCalled();
    });

    it('throws error and fails closed if project access deletion fails', async () => {
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'user-abc' },
            error: null,
          }),
        }),
      });
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const deleteMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Foreign key lock timeout' } }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: selectMock,
            update: updateMock,
          };
        }
        if (table === 'pm_user_project_access') {
          return { delete: deleteMock };
        }
        return {};
      });

      await expect(
        UserService.updateUserAccess({
          userId: 'user-abc',
          status: 'active',
          roles: ['project_manager'],
          assignedProjectIds: ['p1'],
          priceAccessGranted: false,
        })
      ).rejects.toThrow('Foreign key lock timeout');
    });
  });
});
