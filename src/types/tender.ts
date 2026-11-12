export type TenderStatus = 'draft' | 'open' | 'under_evaluation' | 'awarded' | 'cancelled' | 'closed';

export type TenderCategory = 'civil' | 'mep' | 'infrastructure' | 'architectural' | 'fitout' | 'turnkey';

export interface Tender {
  id: string;
  tender_number: string;
  title_ar: string;
  title_en: string;
  client_name: string;
  category: TenderCategory;
  status: TenderStatus;
  estimated_budget: number;
  submission_deadline: string;
  bond_amount: number | null;
  bond_validity_days: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenderBidder {
  id: string;
  tender_id: string;
  bidder_name: string;
  submitted_at: string;
  bid_amount: number;
  technical_score: number | null;
  financial_score: number | null;
  ranking: number | null;
  status: 'shortlisted' | 'evaluated' | 'accepted' | 'rejected';
}

export interface TenderSummary {
  totalTenders: number;
  activeTenders: number;
  totalPipelineValue: number;
  awardedValue: number;
  winRatePct: number;
}
