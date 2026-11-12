# Technical Requirements Document (TRD)
## Document ID: TRD-2026-004
## Title: Technical Architecture for User Lifecycle, WhatsApp Verification Gateway & RBAC Project Allocation
## Target Stack: Next.js 16 (App Router), Supabase (PostgreSQL + RLS), TanStack Query v5, Zustand, Tailwind CSS v4

---

## 1. Architecture Overview

The user onboarding and permission subsystem guarantees deterministic access controls across three orthogonal layers:
1. **Identity & Authentication (Supabase Auth)**: Handles encrypted credential storage, JWT issuance, and session cookies.
2. **Profile & Governance State (`public.profiles`)**: Stores user lifecycle status (`status`, `roles`, `price_access_granted`).
3. **Relational Scope Binding (`pm_user_project_access` & `project_stakeholders`)**: Binds an authenticated profile to specific project IDs.

```
                    ┌────────────────────────┐
                    │  Public Signup Page    │
                    │      (/signup)         │
                    └───────────┬────────────┘
                                │ 1. supabase.auth.signUp()
                                ▼
                    ┌────────────────────────┐
                    │     public.profiles    │
                    │ status='pending_act...'│
                    │ roles = []             │
                    └───────────┬────────────┘
                                │ 2. Show WhatsApp CTA (+201229994728)
                                ▼
                    ┌────────────────────────┐
                    │   WhatsApp Message     │
                    │ to System Administrator│
                    └───────────┬────────────┘
                                │ 3. Admin Reviews & Customizes
                                ▼
          ┌─────────────────────────────────────────────────────┐
          │     Admin Cockpit: /user-management                 │
          │     Granular User Access Customization Modal        │
          └───────────┬──────────────┬──────────────┬───────────┘
                      │              │              │
        4a. Set Status│ 4b. Set Roles│ 4c. Projects │ 4d. Price Gate
                      ▼              ▼              ▼              ▼
               ┌──────────┐   ┌────────────┐ ┌────────────┐ ┌────────────┐
               │ profiles │   │  profiles  │ │pm_user_proj│ │  profiles  │
               │ .status  │   │   .roles   │ │ _access    │ │.price_acc..│
               │='active' │   │  (text[])  │ │ (proj IDs) │ │ = true     │
               └──────────┘   └────────────┘ └────────────┘ └────────────┘
```

---

## 2. Database Schema & Migration Specifications

### 2.1 Table: `public.profiles`
Ensure the following columns exist and are strictly typed:
```sql
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending_activation' 
    CHECK (status IN ('pending_activation', 'active', 'suspended', 'rejected')),
  ADD COLUMN IF NOT EXISTS price_access_granted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_by uuid REFERENCES public.profiles(id);

-- Index for instant querying of pending requests
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
```

### 2.2 Table: `public.pm_user_project_access`
Table schema managing explicit project access grants:
```sql
CREATE TABLE IF NOT EXISTS public.pm_user_project_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.pm_projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_project_access_user ON public.pm_user_project_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_access_proj ON public.pm_user_project_access(project_id);
```

### 2.3 Row Level Security (RLS) Policy Axiom
1. `service_role` has full bypass (system automation & server actions).
2. Users with `status = 'pending_activation'` or `status = 'suspended'` are prohibited from SELECT / INSERT / UPDATE / DELETE on all operational tables (`pm_projects`, `pm_daily_progress`, `pm_site_tasks`, `pm_deliverables`, `pm_variation_orders`, etc.).
3. Only users with role `admin`, `ceo`, `coo`, or `chairman` can execute updates on `profiles.roles`, `profiles.status`, and `pm_user_project_access`.

---

## 3. Frontend Component & Hook Architecture

### 3.1 Signup Page (`src/app/(auth)/signup/page.tsx`)
- **State Additions**:
  ```typescript
  const [signupSuccess, setSignupSuccess] = useState<{
    fullName: string;
    email: string;
    registeredAt: string;
  } | null>(null);
  ```
- **Success View**:
  When `supabase.auth.signUp()` succeeds without error:
  1. Record submission details into `signupSuccess`.
  2. Render the interactive **WhatsApp Verification Callout Card**:
     ```typescript
     const adminWhatsAppNumber = "201229994728";
     const waMessage = encodeURIComponent(
       `مرحباً م/ حسن،\nلقد قمت بإنشاء حساب جديد على بوابة Pzone ERP:\n• الاسم: ${signupSuccess.fullName}\n• البريد: ${signupSuccess.email}\nبرجاء التكرم بتفعيل الحساب وتعيين الصلاحيات والمشاريع المخصصة.`
     );
     const waLink = `https://wa.me/${adminWhatsAppNumber}?text=${waMessage}`;
     ```

### 3.2 Guard & Interceptor (`src/components/auth/AuthGuard.tsx`)
- Enhance `AuthGuard` to verify user status:
  ```typescript
  const isPending = profile?.status === 'pending_activation' || (!rolesLoading && roles.length === 0);
  const isSuspended = profile?.status === 'suspended';
  ```
- If `isPending`: Render high-fidelity pending activation screen with direct WhatsApp dial.
- If `isSuspended`: Render administrative suspension screen.

### 3.3 Admin User Management Cockpit (`src/app/(dashboard)/user-management/page.tsx`)
- **Queries & Mutations**:
  - `admin-pending-users`: Fetches profiles where `status = 'pending_activation'`.
  - `admin-active-users`: Fetches profiles where `status = 'active'` or `status IS NULL`.
  - `useUserProjectAccess(userId)`: Fetches project IDs assigned to user from `pm_user_project_access`.
  - `updateUserFullAccess`: Atomic mutation executing:
    ```typescript
    await Promise.all([
      // 1. Update Profile (status, roles, price_access_granted)
      supabase.from('profiles').update({
        status: newStatus,
        roles: selectedRoles,
        price_access_granted: priceAccess,
        activated_at: newStatus === 'active' ? new Date().toISOString() : undefined,
        activated_by: adminUser.id,
      }).eq('id', targetUserId),
      
      // 2. Synchronize Project Assignments
      syncUserProjectAccess(targetUserId, assignedProjectIds),
      
      // 3. Log Audit Trail
      AuditLogService.logAction({
        action_type: 'USER_ACCESS_CUSTOMIZATION',
        entity_name: 'user_profile',
        entity_id: targetUserId,
        details: { status: newStatus, roles: selectedRoles, projectsCount: assignedProjectIds.length, priceAccess }
      })
    ]);
    ```

### 3.4 User Access Customization Modal Component
Location: `src/components/users/UserAccessCustomizationModal.tsx`
- **Props**:
  - `user`: Profile row object.
  - `isOpen`: boolean.
  - `onClose`: () => void.
  - `onSaved`: () => void.
- **Sections**:
  1. Header with Avatar, Name, Email, and Current Status badge.
  2. Status Selector (`Active`, `Pending Activation`, `Suspended`).
  3. RBAC Roles Multi-Select (Grouped into Executive, Commercial/Finance, Operational/Site).
  4. Project Assignment Checklist (Searchable, Select All / Deselect All, Badge counter).
  5. Price Gate Grant Toggle.
  6. Save Changes Button (with loading spinner and optimistic cache invalidation).

---

## 4. Verification & Testing Protocol

1. **Vitest Unit Tests**:
   - `buildWhatsAppActivationUrl()` helper verification.
   - `fetchUserRoles()` status resolution.
   - `ProjectService.getUserAssignedProjectIds()` restricted vs unrestricted tests.
2. **End-to-End Simulation**:
   - User signs up on `/signup` -> Card transitions to WhatsApp action.
   - User attempts to navigate to `/projects` -> Blocked by `AuthGuard`.
   - Admin logs into `/user-management` -> Sees notification badge `(1)`.
   - Admin configures: Role `project_manager`, Projects `[Proj-2601, Proj-2602]`, Price Gate `false`.
   - Admin submits -> Mutation succeeds, audit log inserted.
   - User refreshes -> Greeted with active project portal displaying exactly the 2 assigned projects and masked prices.
