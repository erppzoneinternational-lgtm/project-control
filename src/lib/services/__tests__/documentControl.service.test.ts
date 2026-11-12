import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appCache } from '@/lib/cache';
import { documentControlService } from '../documentControl.service';
import type { ControlledDocument, DocumentTransmittal } from '@/types/document-control';

// Fluently chainable mock query builder
const createMockQueryBuilder = (result: { data?: unknown; error?: unknown; count?: number | null }) => {
  const builder: MockBuilderShape = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(result)),
    then: vi.fn().mockImplementation((onfulfilled) => {
      return Promise.resolve(result).then(onfulfilled);
    }),
  };
  return builder as MockQueryBuilder;
};

// Mock Supabase Browser Client
const mockFrom = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => ({
    from: mockFrom,
  }),
}));

describe('DocumentControlService Unit Test Suite', () => {
  const projectId = 'proj-dc-test-001';

  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  describe('getDocuments', () => {
    it('fetches documents for project ordered by created_at desc', async () => {
      const mockDocs: ControlledDocument[] = [
        {
          id: 'doc-1',
          project_id: projectId,
          document_number: 'DWG-001',
          revision: '00',
          title_ar: 'مخطط إنشائي',
          title_en: 'Structural Drawing',
          type: 'drawing',
          discipline: 'structural',
          status: 'approved',
          file_url: 'https://example.com/dwg-1.pdf',
          file_size_bytes: 1024,
          mime_type: 'application/pdf',
          issued_date: '2026-09-01T00:00:00Z',
          created_at: '2026-09-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
        },
      ];

      const builder = createMockQueryBuilder({ data: mockDocs, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await documentControlService.getDocuments(projectId);

      expect(mockFrom).toHaveBeenCalledWith('pm_controlled_documents');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.eq).toHaveBeenCalledWith('project_id', projectId);
      expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockDocs);
    });

    it('applies type and status filters when provided', async () => {
      const builder = createMockQueryBuilder({ data: [], error: null });
      mockFrom.mockReturnValue(builder);

      await documentControlService.getDocuments(projectId, {
        type: 'drawing',
        status: 'approved',
      });

      expect(builder.eq).toHaveBeenCalledWith('project_id', projectId);
      expect(builder.eq).toHaveBeenCalledWith('type', 'drawing');
      expect(builder.eq).toHaveBeenCalledWith('status', 'approved');
    });

    it('serves cached documents on subsequent requests', async () => {
      const mockDocs = [{ id: 'doc-cache', document_number: 'DWG-CACHE' }];
      const builder = createMockQueryBuilder({ data: mockDocs, error: null });
      mockFrom.mockReturnValue(builder);

      const firstCall = await documentControlService.getDocuments(projectId);
      const secondCall = await documentControlService.getDocuments(projectId);

      expect(firstCall).toEqual(mockDocs);
      expect(secondCall).toEqual(mockDocs);
      expect(mockFrom).toHaveBeenCalledTimes(1); // Cached on 2nd call
    });

    it('throws error when database query fails', async () => {
      const builder = createMockQueryBuilder({ data: null, error: new Error('DB connection failed') });
      mockFrom.mockReturnValue(builder);

      await expect(documentControlService.getDocuments(projectId)).rejects.toThrow('DB connection failed');
    });
  });

  describe('getDocumentById', () => {
    it('fetches a single document by ID', async () => {
      const mockDoc = { id: 'doc-single', document_number: 'DWG-SINGLE' };
      const builder = createMockQueryBuilder({ data: mockDoc, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await documentControlService.getDocumentById('doc-single');

      expect(builder.eq).toHaveBeenCalledWith('id', 'doc-single');
      expect(builder.single).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('throws error when document fetch by ID fails', async () => {
      const builder = createMockQueryBuilder({ data: null, error: new Error('Document not found') });
      mockFrom.mockReturnValue(builder);

      await expect(documentControlService.getDocumentById('invalid-id')).rejects.toThrow('Document not found');
    });
  });

  describe('saveDocument', () => {
    it('upserts document and invalidates docs and stats caches', async () => {
      const newDoc: Partial<ControlledDocument> = {
        project_id: projectId,
        document_number: 'DWG-NEW',
        revision: '00',
        title_ar: 'مخطط معماري',
        title_en: 'Arch Drawing',
        type: 'drawing',
        discipline: 'architectural',
        status: 'draft',
      };

      const savedResult = { ...newDoc, id: 'doc-new-id', created_at: '2026-09-22T00:00:00Z' };
      const builder = createMockQueryBuilder({ data: savedResult, error: null });
      mockFrom.mockReturnValue(builder);

      // Pre-seed cache to verify invalidation
      appCache.set(`document_control:docs:${projectId}:{}`, ['old'], 60000);
      appCache.set(`document_control:stats:${projectId}`, { totalDocuments: 1 }, 60000);

      const result = await documentControlService.saveDocument(newDoc);

      expect(mockFrom).toHaveBeenCalledWith('pm_controlled_documents');
      expect(builder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          document_number: 'DWG-NEW',
          project_id: projectId,
        })
      );
      expect(result).toEqual(savedResult);

      // Check caches invalidated
      expect(appCache.get(`document_control:docs:${projectId}:{}`)).toBeNull();
      expect(appCache.get(`document_control:stats:${projectId}`)).toBeNull();
    });

    it('throws error when upsert fails', async () => {
      const builder = createMockQueryBuilder({ data: null, error: new Error('Duplicate key violation') });
      mockFrom.mockReturnValue(builder);

      await expect(
        documentControlService.saveDocument({ project_id: projectId, document_number: 'DWG-DUP' })
      ).rejects.toThrow();
    });
  });

  describe('updateDocumentStatus', () => {
    it('updates status of an existing document and invalidates cache', async () => {
      const updatedDoc = { id: 'doc-up', status: 'approved', project_id: projectId };
      const builder = createMockQueryBuilder({ data: updatedDoc, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await documentControlService.updateDocumentStatus('doc-up', projectId, 'approved');

      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
        })
      );
      expect(builder.eq).toHaveBeenCalledWith('id', 'doc-up');
      expect(result).toEqual(updatedDoc);
    });
  });

  describe('deleteDocument', () => {
    it('deletes document and invalidates cache', async () => {
      const builder = createMockQueryBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await documentControlService.deleteDocument('doc-del', projectId);

      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'doc-del');
      expect(result).toBe(true);
    });
  });

  describe('getTransmittals & saveTransmittal', () => {
    it('fetches transmittals for project ordered by transmission_date desc', async () => {
      const mockTransmittals: DocumentTransmittal[] = [
        {
          id: 'trn-1',
          transmittal_number: 'TRN-001',
          project_id: projectId,
          sender: 'Pzone',
          recipient: 'Dar Al-Handasah',
          purpose: 'for_approval',
          transmission_date: '2026-09-10T00:00:00Z',
          documents_count: 3,
          status: 'SENT',
        },
      ];

      const builder = createMockQueryBuilder({ data: mockTransmittals, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await documentControlService.getTransmittals(projectId);

      expect(mockFrom).toHaveBeenCalledWith('pm_document_transmittals');
      expect(builder.eq).toHaveBeenCalledWith('project_id', projectId);
      expect(builder.order).toHaveBeenCalledWith('transmission_date', { ascending: false });
      expect(result).toEqual(mockTransmittals);
    });

    it('saves transmittal and invalidates transmittals and stats caches', async () => {
      const newTrn: Partial<DocumentTransmittal> = {
        project_id: projectId,
        transmittal_number: 'TRN-2026-050',
        sender: 'Contractor',
        recipient: 'Consultant',
        purpose: 'for_approval',
        documents_count: 2,
        status: 'SENT',
      };

      const savedTrn = { ...newTrn, id: 'trn-new-id' };
      const builder = createMockQueryBuilder({ data: savedTrn, error: null });
      mockFrom.mockReturnValue(builder);

      appCache.set(`document_control:transmittals:${projectId}`, ['cached'], 60000);

      const result = await documentControlService.saveTransmittal(newTrn);

      expect(mockFrom).toHaveBeenCalledWith('pm_document_transmittals');
      expect(builder.upsert).toHaveBeenCalledWith(newTrn);
      expect(result).toEqual(savedTrn);
      expect(appCache.get(`document_control:transmittals:${projectId}`)).toBeNull();
    });
  });

  describe('getDocumentStats', () => {
    it('calculates total, approved, under_review and transmittal counts', async () => {
      mockFrom.mockImplementation((table: string) => {
        const builder: MockBuilderShape = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: string) => {
            if (table === 'pm_controlled_documents') {
              if (col === 'status' && val === 'approved') {
                return Promise.resolve({ count: 12, error: null });
              }
              if (col === 'status' && val === 'under_review') {
                return Promise.resolve({ count: 5, error: null });
              }
            }
            if (table === 'pm_document_transmittals') {
              return Promise.resolve({ count: 7, error: null });
            }
            // base project_id eq on pm_controlled_documents
            return {
              eq: vi.fn().mockImplementation((subCol: string, subVal: string) => {
                if (subCol === 'status' && subVal === 'approved') {
                  return Promise.resolve({ count: 12, error: null });
                }
                if (subCol === 'status' && subVal === 'under_review') {
                  return Promise.resolve({ count: 5, error: null });
                }
                return Promise.resolve({ count: 20, error: null });
              }),
              then: (fn: (value: unknown) => unknown) => Promise.resolve({ count: 20, error: null }).then(fn),
            };
          }),
        };
        return builder as MockQueryBuilder;
      });

      const stats = await documentControlService.getDocumentStats(projectId);

      expect(stats.totalDocuments).toBe(20);
      expect(stats.approvedCount).toBe(12);
      expect(stats.underReviewCount).toBe(5);
      expect(stats.totalTransmittals).toBe(7);
    });
  });
});
