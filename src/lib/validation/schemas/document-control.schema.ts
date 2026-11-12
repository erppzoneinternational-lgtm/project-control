import { z } from 'zod';
import { toSafeHttpUrl } from '@/lib/utils/security';

const docTypeSchema = z.enum(['drawing', 'specification', 'contract', 'submittal', 'correspondence', 'report', 'certificate', 'other']);
const docStatusSchema = z.enum(['draft', 'under_review', 'approved', 'superseded', 'archived']);

export const controlledDocumentSchema = z.object({
  id: z.string().optional(),
  project_id: z.string().min(1, 'Project ID is required'),
  document_number: z.string().min(1, 'Document number is required'),
  revision: z.string().min(1, 'Revision is required'),
  title_ar: z.string().min(1, 'Arabic title is required'),
  title_en: z.string().min(1, 'English title is required'),
  type: docTypeSchema,
  discipline: z.string().min(1, 'Discipline is required'),
  status: docStatusSchema,
  file_url: z
    .string()
    .trim()
    .url('Invalid URL')
    .refine((val) => toSafeHttpUrl(val) !== null, {
      message: 'Only http:// or https:// URLs are allowed',
    })
    .nullable()
    .optional()
    .or(z.literal(''))
    .or(z.literal(null)),
  file_size_bytes: z.number().nullable().optional(),
  mime_type: z.string().nullable().optional(),
  issued_date: z.string().nullable().optional(),
});

export const documentTransmittalSchema = z.object({
  id: z.string().optional(),
  transmittal_number: z.string().min(1, 'Transmittal number is required'),
  project_id: z.string().min(1, 'Project ID is required'),
  sender: z.string().min(1, 'Sender is required'),
  recipient: z.string().min(1, 'Recipient is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  transmission_date: z.string().min(1, 'Transmission date is required'),
  documents_count: z.number().min(1),
  status: z.string().min(1, 'Status is required'),
});

export type ControlledDocumentFormData = z.infer<typeof controlledDocumentSchema>;
export type DocumentTransmittalFormData = z.infer<typeof documentTransmittalSchema>;
