# PRD: PMI Handover Certificate Export, Retention Governance, Snag & DLP Tracking, and Full Tabs Unification

**Document Version:** 1.0.0  
**Date:** 2026-10-07  
**System:** P.ZONE ERP Portal (Post-Contract Project Management)  
**Author:** Eng. Hassan A. Soliman Mode & Super Gemini Engineering Protocol  
**Status:** Approved & In-Progress  

---

## 1. Executive Summary & Problem Statement

### 1.1 Context
In the previous iterations, the P.ZONE ERP Portal established the **PMI Construction Initial Handover Verification Gate** (`HandoverProjectModal`), allowing project managers to record the Taking-Over Certificate (TOC), snag list classification, testing & commissioning (T&C) reports, as-built drawings, O&M manuals, and warranty dates.

However, three critical operational requirements and one architectural discrepancy remained:
1. **Official Certificate Generation**: Project teams had no standardized, print-ready bilingual Taking-Over Certificate (TOC) with executive signatures matching FIDIC/PMI standards.
2. **Financial Retention Governance**: Construction retention money (محجوز ضمان حسن التنفيذ - typically 5% to 10%) withheld on IPCs lacked contractual governance linking 50% release to TOC and 50% to DLP completion.
3. **Snag & DLP Tracking**: Snag/punch list items and the 365-day Defects Liability Period (DLP) warranty countdown were not tracked interactively down to the item/discipline level.
4. **Quarantined Operational Tabs**: The project details view (`projects/[id]/page.tsx`) hid 5 essential operational tabs (`wbs`, `milestones`, `change_orders`, `invoices`, `documents`) that had already been built in `src/components/projects/tabs/`.

### 1.2 Target Objectives
1. **Unhide & Wire Up All Hidden Tabs**: Expose `wbs`, `milestones`, `change_orders`, `invoices`, and `documents` in `projects/[id]/page.tsx` with full ARIA tab navigation, responsive icons, and lazy loading.
2. **Official PMI Handover Certificate Export / PDF**: Build `HandoverCertificateModal` providing executive print/PDF output with P.ZONE branding, tri-party signatures, TOC reference, and snags schedule.
3. **Retention Release & IPC Closeout Governance**: Build `RetentionReleaseGovernanceCard` enforcing FIDIC Sub-Clause 14.9 (50% release on TOC, 50% release on Final Handover).
4. **Snag Lists & Defects Liability Period (DLP) Tracking Board**: Build `SnagListTrackingBoard` enabling itemized punch-list tracking, days-to-clearance countdown, and 365-day DLP warranty progress bar.

---

## 2. Requirements Matrix & Traceability

| ID | Feature / Component | Description | PMI / FIDIC Reference | Status | Verification Method |
|---|---|---|---|---|---|
| **REQ-01** | Tab Unification | Wire `wbs`, `milestones`, `change_orders`, `invoices`, `documents` in `projects/[id]/page.tsx` | PMBOK 7th Ed. Project Integration | PLANNED | Vitest + SSR Render Test |
| **REQ-02** | Official Handover Certificate | Printable bilingual Taking-Over Certificate (TOC) with P.ZONE branding and 3 signatures | FIDIC Red Book Sub-Clause 10.1 | PLANNED | Component Test + Print CSS |
| **REQ-03** | Retention Release Governance | Financial withholding & 50%/50% tranche release governance tied to TOC & DLP | FIDIC Red Book Sub-Clause 14.9 | PLANNED | Financial Math & Logic Test |
| **REQ-04** | Snag & DLP Tracking Board | Interactive punch list items, urgency filters, clearance countdown, and 365-day DLP bar | PMI Construction Extension Closeout | PLANNED | Component & State Test |

---

## 3. Detailed Architectural Specifications

### 3.1 Tab Architecture in `projects/[id]/page.tsx`
Expanded `TABS_CONFIG` and `ProjectTab` type:
- `overview`: Central telemetry, financial summary, location map, documents status.
- `wbs`: Work Breakdown Structure, EVM S-curves, activity progress (`WBSTab.tsx`).
- `milestones`: Payment & delivery milestones timeline (`MilestonesTab.tsx`).
- `change_orders`: Variation Orders (VOs) register & approvals (`ChangeOrdersTab.tsx`).
- `invoices`: Interim Payment Certificates (IPCs) & billing (`InvoicesTab.tsx`).
- `documents`: Contract documents, TOC, possession letters, files (`DocumentsTab.tsx`).
- `team`: Stakeholders, contacts, and roles (`TeamTab.tsx`).
- `org_chart`: Stakeholders visual hierarchy (`StakeholderOrgChart.tsx`).
- `snags_dlp`: Snag list manager and warranty period tracker (`SnagListTrackingBoard.tsx`).
- `audit_log`: Chronological system change history (`AuditLogTab.tsx`).
- `settings`: Project parameters and edit modal (`EditProjectModal`).

### 3.2 Handover Certificate Export Data Model
```ts
export interface HandoverCertificateData {
  certificateNumber: string;
  issueDate: string;
  projectNameAr: string;
  projectNameEn?: string;
  projectCode: string;
  clientName: string;
  consultantName?: string;
  contractorName: string; // P.ZONE
  contractDate?: string;
  substantialCompletionDate: string;
  tocReference: string;
  snagCount: number;
  snagClassification: 'no_snags' | 'minor_only' | 'critical_pending';
  snagClearanceDays: number;
  testingCommissioningApproved: boolean;
  asBuiltSubmitted: boolean;
  omManualsSubmitted: boolean;
  dlpStartDate: string;
  dlpDurationMonths: number; // 12 months default
  specialConditions?: string;
  signatories: {
    contractor: { name: string; title: string; signed: boolean; date?: string };
    consultant: { name: string; title: string; signed: boolean; date?: string };
    client: { name: string; title: string; signed: boolean; date?: string };
  };
}
```

### 3.3 Retention Release Governance Logic (FIDIC Sub-Clause 14.9)
```ts
// 1. Total Retention Withheld = Sum of (Claimed/Approved IPC * Retention Rate [e.g. 5%])
// 2. Tranche 1 (Initial Handover - 50%):
//    - Condition: Project status == 'handing_over' || 'finished' AND toc_letter != null
//    - Action: Releases 50% of accumulated retention
// 3. Tranche 2 (Final Handover - 50%):
//    - Condition: Project status == 'finished' AND DLP elapsed (now >= dlp_start_date + 365 days)
//    - Action: Releases remaining 50% of retention
```

### 3.4 Snag Lists & DLP Data Model (`metadata.snags_dlp`)
```ts
export interface SnagItem {
  id: string;
  code: string; // e.g. SNG-01
  discipline: 'civil' | 'mechanical' | 'electrical' | 'finishing' | 'water_features';
  location: string;
  descriptionAr: string;
  descriptionEn?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'rectified' | 'verified';
  targetDate: string;
  resolvedDate?: string;
  assignedTo?: string;
  notes?: string;
}
```

---

## 4. Phased Implementation Roadmap

- **Phase 1: Planning with Files Setup & Architectural Alignment**:
  - Update `task_plan.md`, `findings.md`, and `progress.md`.
- **Phase 2: Tab Unification in Project Details (`projects/[id]/page.tsx`)**:
  - Unhide `wbs`, `milestones`, `change_orders`, `invoices`, `documents`.
  - Wire lazy loaders with Suspense and ErrorBoundaries.
- **Phase 3: PMI Handover Certificate Export Component**:
  - Build `HandoverCertificateModal.tsx` with print/PDF styling and signatures.
- **Phase 4: Retention Release Governance Engine**:
  - Build `RetentionReleaseGovernanceCard.tsx` and integrate in `InvoicesTab`.
- **Phase 5: Snag Lists & DLP Tracking Board**:
  - Build `SnagListTrackingBoard.tsx` with itemized snags, countdown, and DLP warranty progress bar.
- **Phase 6: Verification, Typecheck & Testing**:
  - Unit tests for all components.
  - Run full test suite and TypeScript validation.
