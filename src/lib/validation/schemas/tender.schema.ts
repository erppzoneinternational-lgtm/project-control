import { z } from 'zod';

export const tenderSchema = z.object({
  tender_number: z.string().min(1, 'رقم المناقصة مطلوب / Tender number is required'),
  title_ar: z.string().min(1, 'العنوان بالعربية مطلوب / Arabic title is required'),
  title_en: z.string().min(1, 'العنوان بالإنجليزية مطلوب / English title is required'),
  client_name: z.string().min(1, 'اسم العميل مطلوب / Client name is required'),
  category: z.enum(['civil', 'mep', 'infrastructure', 'architectural', 'fitout', 'turnkey']),
  status: z.enum(['draft', 'open', 'under_evaluation', 'awarded', 'cancelled', 'closed']),
  estimated_budget: z.number().min(0),
  submission_deadline: z.string(),
  bond_amount: z.number().nullable(),
  bond_validity_days: z.number().nullable(),
  description: z.string().nullable()
});

export const tenderBidderSchema = z.object({
  tender_id: z.string().uuid(),
  bidder_name: z.string().min(1, 'اسم المقاول مطلوب / Bidder name is required'),
  submitted_at: z.string(),
  bid_amount: z.number().min(0),
  technical_score: z.number().nullable(),
  financial_score: z.number().nullable(),
  ranking: z.number().nullable(),
  status: z.enum(['shortlisted', 'evaluated', 'accepted', 'rejected'])
});

export type TenderInput = z.infer<typeof tenderSchema>;
export type TenderBidderInput = z.infer<typeof tenderBidderSchema>;
