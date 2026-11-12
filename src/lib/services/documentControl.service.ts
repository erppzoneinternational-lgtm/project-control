import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { appCache, TTL } from '@/lib/cache';
import { logger } from '@/lib/logger';
import type { ControlledDocument, DocumentTransmittal, DocumentStats, DocType, DocStatus } from '@/types/document-control';

class DocumentControlService {
  private readonly CACHE_KEY = 'document_control';

  async getDocuments(projectId: string, filters?: { type?: DocType; status?: DocStatus }): Promise<ControlledDocument[]> {
    try {
      const cacheKey = `${this.CACHE_KEY}:docs:${projectId}:${JSON.stringify(filters || {})}`;
      return await appCache.getOrFetch(cacheKey, async () => {
        const supabase = createSupabaseBrowserClient();
        let query = supabase
          .from('pm_controlled_documents')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as ControlledDocument[];
      }, TTL.planning);
    } catch (error) {
      logger.error('Failed to get documents', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async getDocumentById(id: string): Promise<ControlledDocument | null> {
    try {
      const cacheKey = `${this.CACHE_KEY}:doc:${id}`;
      return await appCache.getOrFetch(cacheKey, async () => {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('pm_controlled_documents')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data as ControlledDocument;
      }, TTL.planning);
    } catch (error) {
      logger.error('Failed to get document by id', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async saveDocument(doc: Partial<ControlledDocument>): Promise<ControlledDocument> {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('pm_controlled_documents')
        .upsert({ ...doc, updated_at: new Date().toISOString() })
        .select()
        .single();

      if (error) throw error;
      
      appCache.invalidate(`${this.CACHE_KEY}:docs:${doc.project_id}`);
      appCache.invalidate(`${this.CACHE_KEY}:stats:${doc.project_id}`);
      if (doc.id) {
        appCache.invalidate(`${this.CACHE_KEY}:doc:${doc.id}`);
      }
      
      return data as ControlledDocument;
    } catch (error) {
      logger.error('Failed to save document', { error });
      throw error;
    }
  }

  async updateDocumentStatus(id: string, projectId: string, status: DocStatus): Promise<ControlledDocument> {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('pm_controlled_documents')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      appCache.invalidate(`${this.CACHE_KEY}:docs:${projectId}`);
      appCache.invalidate(`${this.CACHE_KEY}:stats:${projectId}`);
      appCache.invalidate(`${this.CACHE_KEY}:doc:${id}`);
      return data as ControlledDocument;
    } catch (error) {
      logger.error('Failed to update document status', { error });
      throw error;
    }
  }

  async deleteDocument(id: string, projectId: string): Promise<boolean> {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('pm_controlled_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      appCache.invalidate(`${this.CACHE_KEY}:docs:${projectId}`);
      appCache.invalidate(`${this.CACHE_KEY}:stats:${projectId}`);
      appCache.invalidate(`${this.CACHE_KEY}:doc:${id}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete document', { error });
      throw error;
    }
  }

  async getTransmittals(projectId: string): Promise<DocumentTransmittal[]> {
    try {
      const cacheKey = `${this.CACHE_KEY}:transmittals:${projectId}`;
      return await appCache.getOrFetch(cacheKey, async () => {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('pm_document_transmittals')
          .select('*')
          .eq('project_id', projectId)
          .order('transmission_date', { ascending: false });

        if (error) throw error;
        return data as DocumentTransmittal[];
      }, TTL.planning);
    } catch (error) {
      logger.error('Failed to get transmittals', { error });
      throw error;
    }
  }

  async saveTransmittal(transmittal: Partial<DocumentTransmittal>): Promise<DocumentTransmittal> {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('pm_document_transmittals')
        .upsert({ ...transmittal })
        .select()
        .single();

      if (error) throw error;
      
      appCache.invalidate(`${this.CACHE_KEY}:transmittals:${transmittal.project_id}`);
      appCache.invalidate(`${this.CACHE_KEY}:stats:${transmittal.project_id}`);
      
      return data as DocumentTransmittal;
    } catch (error) {
      logger.error('Failed to save transmittal', { error });
      throw error;
    }
  }

  async getDocumentStats(projectId: string): Promise<DocumentStats> {
    try {
      const cacheKey = `${this.CACHE_KEY}:stats:${projectId}`;
      return await appCache.getOrFetch(cacheKey, async () => {
        const supabase = createSupabaseBrowserClient();
        const [{ count: totalDocuments }, { count: approvedCount }, { count: underReviewCount }, { count: totalTransmittals }] = await Promise.all([
          supabase.from('pm_controlled_documents').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
          supabase.from('pm_controlled_documents').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'approved'),
          supabase.from('pm_controlled_documents').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'under_review'),
          supabase.from('pm_document_transmittals').select('*', { count: 'exact', head: true }).eq('project_id', projectId)
        ]);

        return {
          totalDocuments: totalDocuments || 0,
          approvedCount: approvedCount || 0,
          underReviewCount: underReviewCount || 0,
          totalTransmittals: totalTransmittals || 0
        };
      }, TTL.planning);
    } catch (error) {
      logger.error('Failed to get document stats', { error });
      throw error;
    }
  }
}

export const documentControlService = new DocumentControlService();
