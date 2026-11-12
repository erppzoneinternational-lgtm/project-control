export type DocType = 'drawing' | 'specification' | 'contract' | 'submittal' | 'correspondence' | 'report' | 'certificate' | 'other';
export type DocStatus = 'draft' | 'under_review' | 'approved' | 'superseded' | 'archived';

export interface ControlledDocument {
  id: string;
  project_id: string;
  document_number: string;
  revision: string;
  title_ar: string;
  title_en: string;
  type: DocType;
  discipline: string;
  status: DocStatus;
  file_url: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  issued_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentTransmittal {
  id: string;
  transmittal_number: string;
  project_id: string;
  sender: string;
  recipient: string;
  purpose: string;
  transmission_date: string;
  documents_count: number;
  status: string;
}

export interface DocumentStats {
  totalDocuments: number;
  approvedCount: number;
  underReviewCount: number;
  totalTransmittals: number;
}
