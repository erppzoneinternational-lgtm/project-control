# Project: Public Project Name & Stacked Bilingual Display Across P-Zone Portal

## Architecture
- **Type & Data Layer**:
  - `src/types/index.ts`: Add `public_name?: string | null;` to `Project`.
  - `src/lib/validation/schemas/project.schema.ts`: Add `public_name: z.string().optional().nullable()` to `createProjectSchema`.
  - `src/lib/utils/project-draft.utils.ts`: Track `public_name` in `ProjectFormData`, `INITIAL_PROJECT_FORM_DATA`, and `isProjectFormDirty()`.
  - `src/lib/services/project.payload.ts`: Add `'public_name'` to `ALLOWED_PM_PROJECT_UPDATE_FIELDS`, map in `buildCreatePayload()` and dual-persist into `metadata.public_name`.
  - `supabase/migrations/059_add_public_name_to_projects.sql`: SQL migration adding `public_name TEXT` to `public.projects`, exposing on `pm_projects_with_manager` and `pm_projects`, and updating INSTEAD OF triggers.
- **Form UI Layer (`/projects/new`)**:
  - `src/app/(dashboard)/projects/new/page.tsx`: In Step 1, add dedicated "الاسم العام للمشروع (Public Project Name)" cell right below `project_name_en`.
  - Add "دمج الاسمين" / "Combine Names" helper button that concatenates `${ar} - ${en}` (or `${ar}`/`${en}` if single) while leaving the input fully customizable and editable.
  - Also display `public_name` in Step 5 review sheet.
- **Presentation & Table Display Layer (`/project-setup` & `/projects`)**:
  - `src/components/projects/ProjectBilingualNameCell.tsx`: Shared pure component and `resolveProjectBilingualNames(project)` helper.
    - Top row: Arabic name in bold typography (`dir="rtl"`).
    - Bottom row: English name in muted secondary typography (`dir="ltr"`).
    - Dynamic fallback: For existing projects without `public_name`, dynamically compute Arabic and English names without trailing delimiters, broken punctuation, or empty tags.
  - `src/app/(dashboard)/project-setup/page.tsx`: Update Project Name cell to use `<ProjectBilingualNameCell />`. Update search filter to include `public_name` and `project_name_en`.
  - `src/components/projects/ProjectsTable.tsx`: Update `visibleColumns.name` cell to use `<ProjectBilingualNameCell />`.
  - `src/components/ui/ProjectCard.tsx`: Update card title header to show stacked bilingual layout.
- **Testing & Quality Assurance**:
  - Fix single preexisting mock type issue in `src/lib/utils/__tests__/retention-bond-tracking.utils.test.ts`.
  - Add comprehensive unit test suite `src/components/__tests__/projects-bilingual-public-name.test.tsx`.
  - Verify `npx tsc --noEmit` exits with 0 errors.
  - Verify `npx vitest run` passes with 0 regressions.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Type Safety & Validation | Add `public_name` to `Project` interface and `createProjectSchema` | M1 | Survey |
| 2 | Form Draft & Dirty Checking | Add `public_name` to `ProjectFormData`, defaults, and dirty check | M1 | Survey |
| 3 | Payload Serialization & DB Migration | Allow and serialize `public_name` in payloads, dual-persist in metadata, create SQL migration | M1 | Survey |
| 4 | Step 1 Public Name Input Cell | Dedicated FloatingLabelInput in Step 1 of `/projects/new` | M2 | Survey |
| 5 | Combine Names Helper Button | "دمج الاسمين" button combining Arabic and English names with independent editability | M2 | Survey |
| 6 | Canonical Bilingual Name Utility | Pure `resolveProjectBilingualNames` and `ProjectBilingualNameCell` | M3 | Survey |
| 7 | Project Setup Table Display | Stacked cell in `/project-setup` with enhanced search matching | M3 | Survey |
| 8 | Main Projects Table & Cards Display | Stacked cell in `ProjectsTable` and `ProjectCard` | M3 | Survey |
| 9 | Comprehensive Unit Tests & Verifications | Unit tests for form combine, draft, cell rendering, `tsc` clean, `vitest` clean | M4 | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Types, Payload & Migration | `src/types/index.ts`, `project.schema.ts`, `project-draft.utils.ts`, `project.payload.ts`, `059_add_public_name_to_projects.sql` | none | IN_PROGRESS |
| 2 | Creation Form & Combine Action | Step 1 in `/projects/new/page.tsx`, combine helper button | M1 | IN_PROGRESS |
| 3 | Stacked Bilingual Table & Card Display | `ProjectBilingualNameCell.tsx`, `/project-setup/page.tsx`, `ProjectsTable.tsx`, `ProjectCard.tsx` | M1 | IN_PROGRESS |
| 4 | Testing & Zero-Regression Verification | `projects-bilingual-public-name.test.tsx`, `retention-bond-tracking.utils.test.ts`, typecheck and vitest | M1, M2, M3 | IN_PROGRESS |

## Code Layout
- `src/types/index.ts`: Global domain models
- `src/lib/validation/schemas/project.schema.ts`: Validation schemas
- `src/lib/utils/project-draft.utils.ts`: Form state & draft utilities
- `src/lib/services/project.payload.ts`: Serialization & API payload builders
- `src/components/projects/ProjectBilingualNameCell.tsx`: Stacked bilingual name presentation
- `src/app/(dashboard)/projects/new/page.tsx`: Multi-step project creation form
- `src/app/(dashboard)/project-setup/page.tsx`: Project Setup management table
- `src/components/projects/ProjectsTable.tsx`: Main projects table
- `src/components/ui/ProjectCard.tsx`: Main projects card view
- `supabase/migrations/059_add_public_name_to_projects.sql`: Database schema migration
- `src/components/__tests__/projects-bilingual-public-name.test.tsx`: Test suite for public name and bilingual rendering
