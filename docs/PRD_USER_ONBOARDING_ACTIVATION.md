# Product Requirements Document (PRD)
## Document ID: PRD-2026-004
## Title: User Onboarding Lifecycle, WhatsApp Activation Gateway & Granular Access Customization Portal
## System: Pzone Portal (Bilingual Construction ERP)
## Target Audience: System Admin, Executive Leadership, All New Staff Registrants
## Status: Approved / Ready for Implementation

---

## 1. Executive Summary & Intent Lock

In construction enterprises operating with sensitive contract figures, confidential unit rates, and proprietary technical submittals, open self-registration without strict gatekeeping is an intolerable security hazard. 

This document defines the product requirements for a **zero-trust user onboarding lifecycle**:
1. **Public Signup Layer**: Users can register with name, email, and password. Upon submission, the account is placed in an explicit `pending_activation` quarantine state. The UI displays an official activation notice directing the user to contact the System Admin on WhatsApp (`+201229994728`) with pre-filled verification credentials.
2. **Access Barrier (Zero-Access Gate)**: Unactivated accounts cannot access any operational portal, project records, or financial figures.
3. **Administrative Governance Cockpit (`/user-management`)**:
   - A dedicated **"طلبات التفعيل المعلقة (Pending Activation Queue)"** showcasing all unverified registrants with request timestamps.
   - A unified **"Active Users Directory"** with status indicators and search.
   - An **"إعداد وتخصيص صلاحيات المستخدم (Granular User Access Customization Modal)"** enabling the Admin to configure the user's entire operational footprint in one atomic action:
     - Account Status: Active, Suspended, or Pending.
     - Role Assignments: Selection of one or more of the 22 canonical roles.
     - Project-Level Scope: Specific project allocation (`pm_user_project_access`) or unrestricted scope.
     - Commercial Price Gate: Toggle for viewing contract values and sensitive financial figures (`price_access_granted`).
     - Stakeholder Directory Linkage: Optional linkage to internal stakeholder profile.

---

## 2. User Personas & Problem Statement

### 2.1 Personas
| Persona | Role | Primary Goal |
|---|---|---|
| **Eng. Moamen (New Registrant)** | Candidate Site Engineer / PM | Signs up to access assigned project tasks and daily site progress. Needs clear, immediate instruction on how to get verified without confusion. |
| **Eng. Hassan (System Admin / Architect)** | Admin / Executive Authority | Needs complete visibility over who is requesting access, instant notification via WhatsApp, and a single screen to assign roles, projects, and price gates without running manual SQL. |
| **Eng. Tamer (Commercial Manager)** | Commercial Lead | Needs assurance that no new registrant can inspect project budgets, contract figures, or subcontractor IPCs without explicit commercial clearance. |

### 2.2 Current Problem
- Previously, signups either redirected directly to login or showed generic email confirmation alerts.
- If a user logged in without roles, the fallback screen lacked an integrated, automated WhatsApp action dial.
- The Admin in `/user-management` could only append roles to `profiles.roles`, but could not assign project-level access or price gates from that same interface, requiring disparate manual actions.

---

## 3. Requirement Traceability Matrix

| Req ID | Description | Priority | Source | Verification Method |
|---|---|---|---|---|
| **REQ-ONB-01** | Post-signup state replaces redirect with WhatsApp Activation Modal/Card | P0 | User Request | UI component test & manual walkthrough |
| **REQ-ONB-02** | WhatsApp deep link pre-fills User Name, Email, and Request Timestamp | P0 | User Request | URL generation unit test |
| **REQ-ONB-03** | AuthGuard blocks `pending_activation` accounts from all protected routes | P0 | Core Security | End-to-end route protection test |
| **REQ-ONB-04** | `/user-management` displays dedicated "Pending Requests" badge & tab | P0 | User Request | UI inspection & query test |
| **REQ-ONB-05** | Granular Customization Modal allows Status change (Active/Suspended) | P0 | User Request | Mutation test & audit log verification |
| **REQ-ONB-06** | Granular Customization Modal allows multi-role RBAC assignment | P0 | User Request | Role matrix synchronization test |
| **REQ-ONB-07** | Granular Customization Modal allows project assignment (`pm_user_project_access`) | P0 | User Request | Service integration test |
| **REQ-ONB-08** | Granular Customization Modal allows Price Gate grant toggle | P0 | User Request | `<PriceGate>` access test |
| **REQ-ONB-09** | Immutable audit log record created on user activation & access modifications | P1 | Enterprise Invariant | Audit trail table inspection |

---

## 4. Functional Specifications

### 4.1 Signup Screen Workflow (`/signup`)
1. User enters: Full Name (`fullName`), Email Address (`email`), Password (`password`), Confirm Password.
2. User submits the form.
3. Client invokes `supabase.auth.signUp()`.
4. Account is recorded in Supabase Auth and `profiles` table with default `status = 'pending_activation'`.
5. Instead of auto-redirecting to `/login`, the card transitions smoothly into the **Account Activation Request Card**:
   - Status Icon: Animated Shield Clock (Amber/Cyan theme matching Pzone Industrial Chic).
   - Headline (Ar): `تم استلام طلب إنشاء الحساب بنجاح!`
   - Subtitle (Ar): `حسابك حالياً قيد المراجعة الإدارية. لتفعيل الحساب وتحديد صلاحيات المشاريع، يرجى إخطار إدارة النظام مباشرة عبر واتساب:`
   - Primary Call to Action Button:
     - Text: `تواصل لتفعيل الحساب عبر واتساب (WhatsApp)`
     - Icon: WhatsApp / MessageCircle.
     - Target: `https://wa.me/201229994728?text=<ENCODED_MESSAGE>`
     - Payload content:
       ```text
       مرحباً م/ حسن،
       لقد قمت بإنشاء حساب جديد على بوابة بي زون (Pzone Portal):
       - الاسم: [Full Name]
       - البريد: [Email]
       - التاريخ: [ISO Date]
       برجاء التكرم بتفعيل الحساب وتعيين الصلاحيات والمشاريع المخصصة.
       ```
   - Secondary Button: `الانتقال إلى صفحة تسجيل الدخول` (Return to Login).

### 4.2 AuthGuard & Login Interceptor
- When a user logs in with valid credentials:
  - If `profile.status === 'pending_activation'` or `profile.roles.length === 0`:
    - Hard navigation to `/login?status=pending_activation` or in-place modal rendering.
    - Explicit message indicating the account is awaiting Admin approval, repeating the WhatsApp button.
  - If `profile.status === 'suspended'`:
    - Access blocked: `تم تعليق هذا الحساب بواسطة إدارة النظام`.

### 4.3 Admin Portal (`/user-management`)

#### 4.3.1 Tabs & Queues
1. **طلبات التفعيل المعلقة (Pending Activation Queue)**:
   - Visible badge with count: e.g. `(3)` in amber.
   - Table columns:
     - Registrant Name & Avatar
     - Email Address
     - Signup Date & Time (Relative + Absolute)
     - Contact Action: Direct WhatsApp Chat link (`wa.me/`) with that user if phone available, or direct email mailto.
     - Quick Action: `تخصيص الصلاحيات والتفعيل (Customize & Activate)` button.
2. **المستخدمون المعتمدون (Active Users Directory)**:
   - Full list of approved personnel.
   - Search by name, email, role, or assigned project.
   - Quick action: `تعديل الصلاحيات (Edit Access)`.

#### 4.3.2 Granular User Access Customization Modal
When Admin clicks "Customize & Activate" on any user row, a slide-over or frosted spatial modal opens with 4 configurable sections:

1. **Section 1: الحالة العامة والاعتماد (Account Status & Lifecycle)**:
   - Radio buttons or Segmented control:
     - `قيد الانتظار (Pending Activation)`
     - `نشط ومعتمد (Active)`
     - `معلق مؤقتاً (Suspended)`
2. **Section 2: الأدوار والصلاحيات الوظيفية (Assigned RBAC Roles)**:
   - Multi-select pill selector featuring all 22 official roles:
     - High Executive: `admin`, `chairman`, `ceo`, `coo`, `coo_assistant`, `board_member`
     - Commercial & Finance: `commercial_manager`, `finance`, `contract_admin`, `cost_control`, `ipc_clerk`, `estimator`
     - Operational & Site: `project_manager`, `planning_manager`, `planning_engineer`, `site_engineer`, `technical_office`, `procurement`, `inventory`
   - Pre-selects existing roles.
3. **Section 3: نطاق المشاريع المتاحة (Project Scope Allocation)**:
   - Radio switch:
     - `الوصول لجميع المشاريع (Unrestricted / All Projects)` (Default for Admin, Commercial Manager, Planning Engineer, Executive).
     - `مشاريع محددة فقط (Restricted to Selected Projects)` (Mandatory for Project Managers & Site Engineers).
   - Searchable multi-checkbox list of all active projects (Code + Name + Client).
   - Saves directly to `pm_user_project_access`.
4. **Section 4: إتاحة الاطلاع على القيم المالية (Commercial Price Gate)**:
   - Toggle switch: `صلاحية الاطلاع على أسعار العقود والمستخلصات (Enable Price Gate Visibility)`.
   - Explanatory note: When disabled, user cannot see base contract values, margin estimates, or subcontractor unit rates.

---

## 5. Non-Functional Requirements
- **Security**: No client-side bypassing; Supabase RLS and server-side middleware enforce that users with `status = 'pending_activation'` have zero query capability on business tables.
- **Performance**: User list queries cached with TanStack Query with instant invalidation upon update.
- **Auditability**: Every role change, project assignment, or activation state transition writes an immutable log row into `pm_audit_logs`.
- **Accessibility & Design**: Mobile-responsive, full RTL Arabic alignment, WAI-ARIA labels, Industrial Chic dark-mode aesthetics.
