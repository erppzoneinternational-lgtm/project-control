# User Onboarding & Access Customization Workflow
## Document ID: WKF-2026-004
## Architecture Pattern: Zero-Trust Procedural Access Graph

---

## 1. Complete Workflow Diagram (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    actor User as New User (e.g. Site Eng / PM)
    participant UI as Signup Screen (/signup)
    participant Auth as Supabase Auth & Profiles
    participant WA as WhatsApp (+201229994728)
    actor Admin as System Administrator (Eng. Hassan)
    participant AdminUI as Admin Portal (/user-management)
    participant DB as Postgres (pm_user_project_access & RLS)
    participant Portal as Project Workspace (/projects)

    %% Registration Phase
    Note over User, UI: Phase 1: Self-Registration
    User->>UI: Enters Name, Email, Password
    UI->>Auth: supabase.auth.signUp()
    Auth-->>UI: User created (status='pending_activation', roles=[])
    UI->>UI: Render WhatsApp Activation Card
    
    %% Notification Phase
    Note over User, WA: Phase 2: Notification & Out-of-Band Verification
    User->>WA: Clicks WhatsApp CTA with prefilled message
    WA->>Admin: Receives registration notification with credentials
    
    %% Unactivated Login Attempt Check
    alt User tries to access portal before activation
        User->>Portal: Navigates to /projects
        Portal->>Auth: Check session & roles
        Auth-->>Portal: roles=[], status='pending_activation'
        Portal->>User: Displays AuthGuard Quarantine View + WA CTA
    end

    %% Administrative Governance Phase
    Note over Admin, AdminUI: Phase 3: Administrative Customization Cockpit
    Admin->>AdminUI: Opens /user-management
    AdminUI->>Auth: Queries pending users (status='pending_activation')
    Auth-->>AdminUI: Returns pending list (Moamen El-Dawwy, etc.)
    Admin->>AdminUI: Clicks "تخصيص الصلاحيات والتفعيل" (Customize Access)
    AdminUI->>Admin: Displays Granular Customization Modal
    
    Admin->>AdminUI: 1. Set Status = 'active'<br/>2. Select Roles: ['project_manager']<br/>3. Select Projects: ['Proj-A', 'Proj-B']<br/>4. Price Gate: Disabled (false)
    Admin->>AdminUI: Clicks "حفظ وتفعيل الحساب"
    
    AdminUI->>DB: Atomic Update: profiles + pm_user_project_access + pm_audit_logs
    DB-->>AdminUI: Confirmed (200 OK)
    AdminUI->>Admin: Success toast & queue refreshed
    
    %% Operational Phase
    Note over User, Portal: Phase 4: Active Authorized Execution
    User->>Portal: Logs into Pzone Portal
    Portal->>Auth: Check session & profile
    Auth-->>Portal: status='active', roles=['project_manager']
    Portal->>DB: Fetch assigned projects (ProjectService.getUserAssignedProjectIds)
    DB-->>Portal: Returns Proj-A and Proj-B
    Portal->>User: Renders Project Workspace with strictly assigned projects & price masked
```

---

## 2. User Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> FormSubmitted: User submits /signup
    FormSubmitted --> PendingActivation: Auth record created\nstatus='pending_activation'\nroles=[]
    
    state PendingActivation {
        [*] --> WAWaiting: WhatsApp CTA triggered (+201229994728)
        WAWaiting --> BlockedAtAuthGuard: Login attempt caught by AuthGuard
        BlockedAtAuthGuard --> WAWaiting: Clicks WA dial from AuthGuard
    }
    
    PendingActivation --> Active: Admin Approves & Customizes\n(Roles + Projects + Price Gate)
    PendingActivation --> Suspended: Admin Rejects / Denies
    
    state Active {
        [*] --> UnrestrictedAccess: Roles: [admin, commercial_manager, etc.]
        [*] --> ProjectScopedAccess: Roles: [project_manager, site_engineer]\npm_user_project_access filtered
    }
    
    Active --> Suspended: Admin Revokes or Suspends
    Suspended --> Active: Admin Reactivates
    Active --> [*]: Account Deleted
```

---

## 3. Procedural Execution Graph (Condition → Guidance → Pitfalls)

### Node 1: Public Registration Submission
- **Condition**: User completes signup form on `/signup` with valid email, strong password, and Arabic/English name.
- **Guidance**: 
  - Execute `supabase.auth.signUp()`.
  - Upon success, do not trigger generic redirection.
  - Persist user contact data in component state.
  - Present the dedicated **Activation Callout Box** displaying WhatsApp link `https://wa.me/201229994728` with pre-encoded credentials.
- **Pitfalls**:
  - *Do NOT* sign the user in as active immediately.
  - *Do NOT* leave user on an empty blank screen without clear confirmation that their request was received.

### Node 2: Zero-Trust Perimeter Check (AuthGuard)
- **Condition**: Any authenticated user navigates to a protected route (`/projects`, `/planning`, `/user-management`, etc.).
- **Guidance**:
  - Inspect `profiles.status` and `profiles.roles`.
  - If status is `pending_activation` OR roles array is empty, block page rendering immediately.
  - Show the centralized **Account Quarantine Card** containing user email and direct WhatsApp button to Admin.
- **Pitfalls**:
  - *Do NOT* rely solely on client-side state. The check must be grounded in server-side session cookies or RLS policies.

### Node 3: Administrative Customization Cockpit
- **Condition**: System Admin accesses `/user-management`.
- **Guidance**:
  - Display counter badge on the **Pending Requests** tab: e.g., `طلبات التفعيل (1)`.
  - When clicking on a user row, open the **Granular Customization Modal**:
    1. **Account Status**: Radio choice (`Active` / `Pending` / `Suspended`).
    2. **RBAC Roles**: 22 Canonical roles checkboxes.
    3. **Project Allocation**:
       - If roles include `admin`, `commercial_manager`, `ceo`, `coo`, default to All Projects.
       - If role is `project_manager` or `site_engineer`, display searchable project list and insert selections into `pm_user_project_access`.
    4. **Price Gate Grant**: Checkbox/Toggle for enabling contract figures visibility.
- **Pitfalls**:
  - *Do NOT* update roles without invalidating TanStack query caches (`admin-profiles`, `admin-user-roles`, `user-roles`).
  - *Do NOT* omit logging the modification in `pm_audit_logs`.
