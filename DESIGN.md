# DESIGN.md — P-Zone International Unified Design System (`*.pzoneinternational.com` → `Project Control`)

> **Provenance & Evidence Grounding:** Reverse-engineered deterministically (100% read-only, zero live mutations) from compiled production bundles and Playwright captures of:
> 1. **Central SSO & Admin Hub (`P-Zone ERP`):** `https://erp.pzoneinternational.com` (Vite + React + Tailwind CSS `v4.3.3` + Radix/shadcn)
> 2. **HR, Organization & Payroll (`PZ-One v2.0 - Enterprise Portal`):** `https://workforce.pzoneinternational.com` (Next.js 16 Turbopack + Tailwind CSS `v4`)
> 3. **Attendance & Vacation Management (`PZone Attendance & Vacation Management System V2`):** `https://attendance.pzoneinternational.com` (Next.js 15 Webpack + Tailwind CSS `v4.3.3`)
> 4. **Field Labor & Wages (`SARAKY` / `labor`):** `https://labor.pzoneinternational.com` (React 19 + Vite + Tailwind CSS `v4`)
> 5. **Executive Analytics & Tender Log:** `https://analytics.pzoneinternational.com` & `https://tender-log.pzoneinternational.com` (React 19 + Vite + Tailwind CSS `v4`)

---

## 1. Visual Theme & Brand Atmosphere

P-Zone International's digital ecosystem combines **architectural water-engineering prestige** ("Only Results Matter" — coastal resorts, crystal lagoons, infinity pools, fountains) with **high-density clinical enterprise precision**:

- **Two Harmonized Surface Families Across the Ecosystem:**
  1. **Gateway & Central Hub (`erp.pzoneinternational.com` — "Deep Lagoon Teal + Clinical Radix"):**
     - **Entry Experience:** Full-bleed Mediterranean coastal lagoon video/photography (sunlit turquoise infinity pool by day; warm architectural dusk lighting by night) beneath a `backdrop-blur-2xl backdrop-saturate-150` frosted glass login card accented by a `2px` top cyan light-beam (`#26C6DA`), minimalist bottom-border (`border-b`) inputs, and an ocean-turquoise gradient CTA (`#26C6DA` → `#0E8FA3`).
     - **Workspace Surface:** Cool off-white ice canvas (`#F7FAFC`) in Light mode and Abyssal Navy (`#07131F` canvas / `#0D1F30` cards) in Dark mode, anchored by `1px` crisp structural rings (`ring-1 ring-foreground/10` on admin cards, `ring-foreground/15` on portal launcher cards) and Deep Lagoon Teal (`#0B7285` Light / `#26C6DA` Dark).
  2. **Operational Suites (`workforce` HR/Salary & `attendance` V2 — "PZv2 Carbon-Slate + Apple Glass"):**
     - **Workspace Surface:** Cool Alabaster-Slate (`#F7F8FC`) in Light mode and Obsidian Carbon (`#101114` canvas / `#24262B` cards / `#16171C` floating chrome) in Dark mode, with Workforce adding a fixed 4-radial ambient aura (`body:before`: `#818CF84D`, `#2DD4BF3D`, `#D8B4FE29`, `#FBBF241F` in Light; `#14B8A633`, `#6366F138`, `#8B5CF61F`, `#3B82F624` in Dark).
     - **Materiality:** Translucent `.apple-glass-card` containers (`#FFFFFFC7` with `blur(20px) saturate(160%)` in Light; `#0E0E0EE0` with `blur(24px) saturate(140%)` and `1px solid #FFFFFF12` specular borders in Dark), `.page-header-card` (`rounded-[20px]`), frosted `div[role=dialog]` (`blur(28px)` Light / `blur(32px)` Dark, `rounded-[20px]`), `JetBrains Mono` micro-uppercase table headers, pill search bars, and dark-mode breathing glow (`pulseGlow`) on active Emerald and Amber status pills.
- **Multicolor Ribbon-Diamond Brand Spectrum:**
  - All systems ship the same 4 brand assets (`horizontal-black` / `horizontal-white` used in headers and `/login` card header at `h-14 sm:h-16`; `vertical-black` / `vertical-white` defined at `h-28 sm:h-32` for vertical/splash slots).
  - Domain modules draw their accent color from the 4-wave P.ZONE mark while keeping **Aquatic Lagoon Cyan/Teal (`#0B7285` / `#26C6DA`)** as the unifying corporate spine:
    - **SSO Hub & Project Control Primary:** Lagoon Teal `#0B7285` (Light) / Lagoon Cyan `#26C6DA` (Dark)
    - **HR & SARAKY Field Labor (`workforce` / `labor`):** Carbon Monolith (`#2A2A2E` → `#18181B`) + Electric Indigo `#5B5CEB` & Violet `#8B5CF6`
    - **Attendance & Vacation V2 (`attendance`):** Electric Royal Blue `#2563EB` + Biometric Violet `#7F22FE` (`bg-violet-600`, Tailwind v4 `oklch(54.1% .281 293.009)`)
    - **Executive Analytics & Tenders (`analytics` / `tender-log`):** Executive Crimson `#BE123C` + Electric Indigo `#5B5CEB` + Liquid Cyan `#06B6D4` (`#0284C7` additionally in `analytics`)

---

## 2. Canonical Color Palette & Exact CSS Tokens

### 2.1 Central Hub & Unified Brand Spine (`erp.pzoneinternational.com` — All 33 `:root` / 32 `.dark` Vars Verbatim)

Declared on `:root` (`--radius: .625rem` = `10px`, inherited by `.dark`):

| Semantic Token | `:root` (Light Mode) | `.dark` (Dark Mode) | Role & Usage |
| :--- | :--- | :--- | :--- |
| `--background` | `#F7FAFC` (`#f7fafc`) | `#07131F` (`#07131f`) | App canvas background |
| `--foreground` | `#07131F` (`#07131f`) | `#F7FAFC` (`#f7fafc`) | Primary body, heading, and table key text |
| `--card` | `#FFFFFF` (`#fff`) | `#0D1F30` (`#0d1f30`) | Elevated card, KPI tile, and table container surface |
| `--card-foreground` | `#07131F` | `#F7FAFC` | Card primary text |
| `--popover` | `#FFFFFF` (`#fff`) | `#0D1F30` | Dropdowns, popovers, select menus, dialogs |
| `--popover-foreground` | `#07131F` | `#F7FAFC` | Popover/dialog text |
| `--primary` | `#0B7285` (`#0b7285`) | `#26C6DA` (`#26c6da`) | Primary brand actions, active indicators, links, focus accents |
| `--primary-foreground` | `#FFFFFF` (`#fff`) | `#07131F` | High-contrast text on `--primary` (white in Light, deep navy in Dark) |
| `--secondary` | `#E6EEF3` (`#e6eef3`) | `#16314A` (`#16314a`) | Secondary buttons, role pills, subtle chips |
| `--secondary-foreground` | `#0F2536` (`#0f2536`) | `#F7FAFC` | Text on `--secondary` |
| `--muted` | `#EDF2F6` (`#edf2f6`) | `#12283B` (`#12283b`) | Table row hover (`bg-muted/50`), skeleton fills, segmented tab track |
| `--muted-foreground` | `#4A5C6D` (`#4a5c6d`) | `#9DB1C3` (`#9db1c3`) | Secondary labels, hints, timestamps, inactive nav items |
| `--accent` | `#DCF3F6` (`#dcf3f6`) | `#143A4A` (`#143a4a`) | Dropdown/select item focus & calendar hover |
| `--accent-foreground` | `#07131F` | `#F7FAFC` | Text on `--accent` |
| `--destructive` | `#C23636` (`#c23636`) | `#F27A7A` (`#f27a7a`) | Destructive actions, validation errors, disabled/terminated status |
| `--success` | `#157A57` (`#157a57`) | `#3CC796` (`#3cc796`) | Active status badges, positive KPI counters, completed states |
| `--border` | `#D5DFE6` (`#d5dfe6`) | `oklch(100% 0 0/.12)` (`#FFFFFF1F`) | Hairline dividers, table borders, card outlines (~`#2A3A49` on card) |
| `--input` | `#D5DFE6` (`#d5dfe6`) | `oklch(100% 0 0/.16)` (`#FFFFFF29`) | Form input, select, and checkbox borders (~`#344351` on card) |
| `--ring` | `#0E8FA3` (`#0e8fa3`) | `#26C6DA` (`#26c6da`) | `3px` keyboard `focus-visible` halo (`ring-ring/50`) |
| `--chart-1` | `#26C6DA` (`#26c6da`) | `#26C6DA` | Chart series 1 — Lagoon Cyan |
| `--chart-2` | `#4C7DFF` (`#4c7dff`) | `#4C7DFF` | Chart series 2 — Royal Blue |
| `--chart-3` | `#20B8A6` (`#20b8a6`) | `#20B8A6` | Chart series 3 — Seafoam Teal |
| `--chart-4` | `#D91B73` (`#d91b73`) | `#D91B73` | Chart series 4 — Magenta-Crimson |
| `--chart-5` | `#F28A18` (`#f28a18`) | `#F28A18` | Chart series 5 — Amber-Orange |
| `--radius` | `.625rem` (`10px`) | *(Inherited `.625rem`)* | Base radius multiplier (`rounded-md` `8px`, `rounded-lg` `10px`, `rounded-xl` `14px`, `rounded-2xl` `18px`, `rounded-4xl` `26px`) |
| `--sidebar` | `#FFFFFF` (`#fff`) | `#0D1F30` (`#0d1f30`) | Sidebar rail surface |
| `--sidebar-foreground` | `#07131F` (`#07131f`) | `#F7FAFC` (`#f7fafc`) | Sidebar primary text |
| `--sidebar-primary` | `#0B7285` (`#0b7285`) | `#26C6DA` (`#26c6da`) | Sidebar active primary accent |
| `--sidebar-primary-foreground` | `#FFFFFF` (`#fff`) | `#07131F` (`#07131f`) | Text on `--sidebar-primary` |
| `--sidebar-accent` | `#DCF3F6` (`#dcf3f6`) | `#143A4A` (`#143a4a`) | Sidebar hover/active fill |
| `--sidebar-accent-foreground` | `#07131F` (`#07131f`) | `#F7FAFC` (`#f7fafc`) | Text on `--sidebar-accent` |
| `--sidebar-border` | `#D5DFE6` (`#d5dfe6`) | `oklch(100% 0 0/.12)` (`#FFFFFF1F`) | Sidebar edge divider |
| `--sidebar-ring` | `#0E8FA3` (`#0e8fa3`) | `#26C6DA` (`#26c6da`) | Sidebar keyboard focus ring |

### 2.2 Operational HR, Payroll & Attendance V2 Palette (`workforce` & `attendance` — Verbatim)

Both `workforce.pzoneinternational.com` and `attendance.pzoneinternational.com` share the exact same 10 `:root` / `.dark` surface variables:

| Token | `:root` (Light) | `.dark` (Dark) | Operational Surface Notes |
| :--- | :--- | :--- | :--- |
| `--background` | `#F7F8FC` (`#f7f8fc`) | `#101114` | Cool alabaster canvas (Light) / Neutral carbon-obsidian (Dark) |
| `--foreground` | `#111827` | `#C9CCD4` (`#c9ccd4`) | Crisp charcoal (Light) / Low-glare silver-slate (Dark) |
| `--card` | `#FFFFFF` (`#fff`) | `#24262B` (`#24262b`) | Solid fallback; `.apple-glass-card` uses `#FFFFFFC7` (Light) / `#0E0E0EE0` (Dark) |
| `--card-foreground` | `#111827` | `#C9CCD4` (`#c9ccd4`) | Card content text |
| `--border` | `#E6E8EC` (`#e6e8ec`) | `#33363D` (`#33363d`) | Solid border; glass border uses `#FFFFFF99` (Light) / `#FFFFFF12` (Dark) |
| `--muted` | `#6B7280` (`#6b7280`) | `#6B7180` (`#6b7180`) | Muted text (in PZv2, `--muted` is text color and `--muted-bg` is surface) |
| `--muted-bg` | `#F6F7F9` (`#f6f7f9`) | `#1F2125` (`#1f2125`) | Muted strip / secondary background |
| `--popover` | `#FFFFFF` (`#fff`) | `#24262B` (`#24262b`) | Popover / dropdown surface |
| `--sidebar` | `#FFFFFF` (`#fff`) | `#1A1B1E` (`#1a1b1e`) | Fixed sidebar (`workforce`) or floating rail `#16171C`/85 (`attendance`) |
| `--navbar` | `#FFFFFFB3` (`70.2%`) | `#1C1D20E0` (`87.8%`) | Sticky translucent top navbar |

**Operational CTA, Shell & Status Tokens (`workforce` & `attendance`):**
- **Workforce Primary CTA (`.btn-primary`):** Light `linear-gradient(#2A2A2E 0%, #18181B 100%)` text `#FFFFFF` | Dark `linear-gradient(#F8F8F8 0%, #E8E8E8 100%)` text `#0A0A0A` (`border-radius: 10px`). Active sidebar pill (`aside a.flex.items-center.bg-card.text-foreground`) uses Carbon Graphite `linear-gradient(#2E2E32 0%, #1C1C1F 100%)` (Light) / `linear-gradient(#262626 0%, #1A1A1A 100%)` (Dark) with a `2.5px` white (`#FFFFFF` at `opacity: .7`) vertical `:before` bar.
- **Attendance Primary CTA (`.btn-primary`) & Shared `.btn-accent`:**
  - Attendance `.btn-primary`: Electric Royal Blue `#2563EB` (`border: 1px solid #1D4ED8`, radius `.75rem` / `12px`, Light hover `#1D4ED8` w/ `0 4px 12px #2563EB40`; Dark border `#3B82F6`, hover `#3B82F6` w/ `0 4px 12px #3B82F659`).
  - Shared `.btn-accent`: `#2563EB` (hover `#1D4ED8`, radius `10px`, rest shadow `0 1px 3px #2563EB40`).
  - Attendance Biometric Import CTA (`bg-violet-600`): `#7F22FE` (`--color-violet-600: oklch(54.1% .281 293.009)`).
- **Soft Tinted Danger Button (`.btn-danger`):** Light text `#BE123C`, bg `#FFF1F2`, border `#FFE4E6` (hover `#9F1239` on `#FFE4E6`) | Dark text `#FDA4AF`, bg `#BE123C1A`, border `#BE123C33`.
- **Dark-Mode Status Pill Remaps & Breathing Glow (`workforce` + `attendance`):**
  - **Success / Present / Paid (`emerald`):** Light `emerald-50` `#ECFDF5`, `emerald-700` `#007956` (`#007A55` sRGB OKLCH), `emerald-500` `#00BB7F` (`#00BC7D` sRGB OKLCH) | Dark `.dark .bg-emerald-50` → `#10B98126`, `.dark .text-emerald-700` → `#34D399` + `animation: 3.5s ease-in-out infinite pulseGlow` (`0 0 10px 2px #10B98140`).
  - **Warning / Late / On-Hold (`amber`):** Light `amber-50` `#FFFBEB`, `amber-700` `#B75000` (`#BB4D00` sRGB OKLCH), `amber-500` `#F99C00` (`#FE9A00` sRGB OKLCH) | Dark `.dark .bg-amber-50` → `#F59E0B26`, `.dark .text-amber-700` → `#FBBF24`, border `#F59E0B4D` + `animation: 3.5s ease-in-out infinite pulseGlowAmber` (`0 0 10px 2px #F59E0B40`).
  - **Danger / Absent / Deduction (`rose`):** Light `rose-50` `#FFF1F2`, `rose-700` `#C20039` (`#C70036` sRGB OKLCH) | Dark `.dark .bg-rose-50` → `#EF444426`, `.dark .text-rose-700` → `#F87171`, border `#EF44444D`.
  - **Info / Leave / Mission (`blue`):** Light `blue-50` `#EFF6FF`, `blue-700` `#1447E6` | Dark `#3B82F626` / `#60A5FA`.
  - **Compensation (`teal`) & HR Org (`indigo` — Workforce CSS only):** Teal `#F0FDFA` / `#00776E` (`#00786F` OKLCH; Dark `#14B8A626` / `#2DD4BF`); Workforce Indigo `#EEF2FF` / `#432DD7` (Dark `.dark .bg-indigo-50/50` → `#6366F126`, `.dark .text-indigo-700` → `#818CF8`).
- **Attendance V2 16-Code Status Dictionary (`attendance` Matrix):**
  - Presence: `P` (`bg-green-100 text-green-700`).
  - Anomalies & Penalties: `L` (`amber-100/700`), `E` (`orange-100/700`), `MI` (`rose-100/700`), `MO` (`pink-100/700`), `UNFOUND` & `A` (`red-100/700`), `U` salary deduction (`red-200 text-red-900`).
  - Leaves & Official: `V` & `V_HALF` (`emerald-100/700`), `CASUAL` (`purple-50/700`), `S` & `M` (`blue-100/700`), `C` (`teal-100/700`), `PR` (`cyan-100/700`), `H` (`sky-100/700`), `W` weekend (`gray-100 text-gray-500`).

### 2.3 Sibling Portals Reference Tokens (`labor`, `analytics`, `tender-log`)
- **SARAKY Field Labor (`labor`):** Light `#F8FAFC` / Dark `#08080A`, `.glass-panel` `#FFFFFFD1` / `#16171BD1`, Primary Indigo `#5B5CEB` + Violet `#8B5CF6`, shadow `0 12px 40px #2828500F`.
- **Analytics & Tender Log (`analytics`, `tender-log`):** Light `#F4F5F8` / Dark `#0B0D13`, card `#FFFFFF` / `#141722` (hover `#1C202E`), border `#E6E8EC` / `#232736`, Primary Crimson `#BE123C` (hover `#9F1239`, tint `#FFF1F2`) + Secondary Indigo `#5B5CEB` + `.ios-liquid-glass` Cyan `#06B6D4` (`#0284C7` also in `analytics` charts/waves).

---

## 3. Typography & Bilingual (RTL / LTR) Rules

### 3.1 Verbatim ERP Font Stacks + Monospace Telemetry Standard
- **Arabic Primary (`erp_bundle/index.css` Verbatim):**
  ```css
  html[lang=ar] { font-family: IBM Plex Sans Arabic, Manrope Variable, sans-serif; }
  ```
  - Self-hosted `@font-face` static weights: `400`, `500`, `600`, `700` (`font-display: swap`).
- **English / Default Primary (`erp_bundle/index.css` Verbatim):**
  ```css
  --font-sans: "Manrope Variable", "IBM Plex Sans Arabic", sans-serif;
  ```
  - Self-hosted variable `@font-face` axis: `200 800` (`erp` `@layer theme` exposes `400`, `500`, `600`; `700` is available in Arabic `@font-face` and `workforce`/`attendance`).
- **Monospace (`erp` System Stack + `attendance` `JetBrains Mono`):**
  - Verbatim `erp`: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
  - Verbatim `attendance` (`app.css` Google Fonts): `"JetBrains Mono", monospace` (`100..800`) — recommended for `Project Control` codes (`#PZ-...`), dates, quantities, and English `thead th`.

### 3.2 Type Scale & Mandatory BiDi Guardrails

| Element / Role | Size / Line-Height | Weight & Tracking | Mandatory Arabic / BiDi Guardrail for `Project Control` |
| :--- | :--- | :--- | :--- |
| **Portal Welcome Display (`h2`)** | `30px–36px` (`text-3xl sm:text-4xl`) | `600` (`font-semibold`), `-0.025em` (EN) | Keep `Project Control`'s `[lang="ar"] { letter-spacing: normal !important }` |
| **Page Title (`h1`)** | `24px / 32px` (`text-2xl`) | `600` (`font-semibold`) | Never `font-black` (`900`) or `uppercase` in Arabic |
| **Card Title (`CardTitle`)** | `16px / 24px` (`text-base`; `sm`: `14px`) | `500` (`font-medium`) | `leading-normal` (`1.5`) |
| **KPI Metric Counter** | `24px–30px` (`text-2xl` / `text-3xl`) | `600` (`font-semibold`) + `tabular-nums` | Always `font-variant-numeric: tabular-nums` |
| **Body / Form / Table (`ERP`)** | `14px / 20px` (`text-sm`; inputs `text-base md:text-sm`) | `400` (`500` on labels/buttons) | Technical strings (`email`, `url`, `#code`) wrapped in `<bdi>` or `dir="ltr"` |
| **High-Density Table (`PZv2`)** | `thead th`: `11.2px` (`.7rem`), `td`: `13.5px` | `th`: `700` `JetBrains Mono` `0.07em` (EN) | Adopt `attendance`'s `thead th [lang=ar] { letter-spacing: normal !important; text-transform: none !important }` *(missing in `workforce`)* |
| **Form Label (`ERP` vs `Workforce` Trap)** | `ERP`: `14px` (`text-sm font-medium`); `Workforce`: `11px` | `500` (`ERP`) / `700` (`Workforce`) | **CRITICAL:** Do NOT copy `workforce`'s unguarded `label { letter-spacing: .05em !important; text-transform: uppercase !important }` without `:not(:lang(ar))` |

---

## 4. Shell & Navigation Architecture

### 4.1 SSO Coastal-Lagoon Glass Login (`erp.pzoneinternational.com/login` — Verbatim)
1. **Full-Bleed Backdrop (`pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background`):**
   - Desktop video (`>=1024px`, motion-safe): `/assets/water-day-BjPgVL1r.mp4` (Light) & `/assets/water-night-D1Y5-uDV.mp4` (Dark), `duration-[650ms]` opacity cross-fade.
   - Responsive posters: `/assets/poster-day-800--aP2QzmD.webp`, `/assets/poster-day-1600-icNhtJNG.webp` (Light) & `/assets/poster-night-800-C6vxIQ_g.webp`, `/assets/poster-night-1600-w3RvGY44.webp` (Dark).
   - Dual scrim: `bg-linear-to-b from-black/45 via-black/25 to-black/55 dark:from-black/55 dark:via-black/35 dark:to-black/65` + Light-only center radial veil `bg-[radial-gradient(ellipse_100%_65%_at_50%_50%,rgb(255_255_255/0.45),transparent)] dark:hidden`.
2. **Top-End Floating Control Pill:**
   - `flex items-center gap-0.5 rounded-full border border-white/20 bg-[#07131F]/40 p-1 shadow-[0_8px_24px_-12px_rgb(7_19_31/0.6)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#07131F]/35` with `h-11 min-w-11 rounded-full text-white hover:bg-white/15` `EN / ع` and `Sun / Moon` buttons.
3. **Frosted Glass Card (`sm:max-w-[400px] md:max-w-[440px]`):**
   - `relative w-full overflow-hidden rounded-2xl border border-white/20 bg-white/25 p-6 text-foreground shadow-[0_24px_60px_-24px_rgb(7_19_31/0.6)] backdrop-blur-2xl backdrop-saturate-150 sm:p-8 dark:border-white/10 dark:bg-[#07131F]/35`.
   - **Signature Top Cyan Hairline:** `pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-[#26C6DA] to-transparent`.
   - **Header:** Centered `<Logo variant="header" className="h-14 sm:h-16" />` (`horizontal-black` / `horizontal-white` swap) + `text-xl font-semibold tracking-tight` title + `text-sm text-foreground/90` subtitle.
   - **Minimalist Underline Inputs:** `h-12 rounded-none border-0 border-b border-foreground/55 bg-transparent px-0.5 text-base text-start text-foreground shadow-none placeholder:text-foreground/85 focus-visible:border-primary focus-visible:shadow-[0_1px_0_0_var(--primary)] focus-visible:ring-0` (`dir="ltr"` on email & password; password adds `ltr:pr-12 rtl:pl-12` + `w-10` rounded-full eye toggle).
   - **Ocean-Cyan Primary Submit CTA:** `h-12 w-full rounded-lg bg-linear-to-r from-[#26C6DA] to-[#0E8FA3] text-base font-semibold text-[#07131F] hover:brightness-105 disabled:opacity-80 rtl:bg-linear-to-l` with trailing `ArrowRight` (`group-hover/button:translate-x-1 rtl:rotate-180 rtl:group-hover/button:-translate-x-1`).

### 4.2 Workspace App Shells Across the Ecosystem & `Project Control` Target
- **ERP Sticky Header + Admin Sidebar + Mobile Tab Bar (`erp` Verbatim):**
  - Header (`Zr`): `sticky top-0 z-40 border-b bg-background/95 backdrop-blur` → inner `flex h-14 items-center gap-2 px-4`, `<Logo variant="header" />` (`h-7 sm:h-8`), nav links (`rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted`; active `bg-muted text-foreground`, inactive `text-muted-foreground`), end cluster (`ms-auto`) with Lang, Theme, and `w-60` User menu.
  - Admin Sidebar (`ti`): `hidden w-60 shrink-0 border-e p-4 md:block`.
  - Mobile Bottom Bar (`ii`): `fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden` (`grid-cols-2`, `min-h-14`) + bottom `SheetContent` (`rounded-t-2xl`).
  - Portal Launch Overlay: `.reveal-panel` clip-path reveal (`320ms cubic-bezier(.65, 0, .25, 1)`).
- **Attendance Floating Island Shell (`attendance` Verbatim + RTL Caveat):**
  - `h-screen w-screen overflow-hidden p-2 sm:p-2.5 gap-2 sm:gap-2.5`, floating header (`h-11 sm:h-12 bg-white/80 dark:bg-[#16171c]/80 backdrop-blur-md border rounded-2xl`) and hover-expandable floating rail (`w-[48px]` container / `188px` expanded). *Caveat:* `attendance` hardcodes physical `left-0` / `left-2.5` (LTR-only); any adoption in `Project Control` must use logical `start-0` / `ps-*`.
- **Workforce Collapsible Sidebar (`workforce` Verbatim):** Fixed `w-64` (`16rem`) expanded / `w-[72px]` collapsed (`lg:pl-[16rem]` / `lg:pr-[16rem]`).
- **Recommended `Project Control` Target Shell (Focused Project Management Release):**
  - Use ERP's RTL-safe `sticky top-0 z-40 border-b bg-background/95 backdrop-blur` (`h-14 px-4`) header with focused **Projects** links (`لوحة المشاريع`, `قائمة المشاريع`, `إضافة مشروع`), quick project search (`⌘K`), `EN / ع` & `Sun / Moon` icon buttons, and User profile dropdown.

---

## 5. Component Specifications & Verbatim Styling Recipes

### 5.1 Buttons (`useDocumentTitle-BXgUR8th.js` — Verbatim `Ll` `cva`)
- **Base (`group/button` REQUIRED for directional icon hover):**
  ```txt
  group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4
  ```
- **Variants:**
  - `default`: `bg-primary text-primary-foreground hover:bg-primary/80`
  - `outline`: `border-border bg-background shadow-xs hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50`
  - `secondary`: `bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]`
  - `ghost`: `hover:bg-muted hover:text-foreground dark:hover:bg-muted/50`
  - `destructive`: `bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40`
  - `link`: `text-primary underline-offset-4 hover:underline`
- **Sizes:** `default` (`h-9 gap-1.5 px-2.5`), `sm` (`h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5`), `xs` (`h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs`), `lg` (`h-10 gap-1.5 px-2.5`), `icon` (`size-9`), `icon-sm` (`size-8 rounded-[min(var(--radius-md),10px)]`), `icon-xs` (`size-6 rounded-[min(var(--radius-md),8px)]`), `icon-lg` (`size-10`).

### 5.2 Cards & KPI Summary Tiles (`card-C3B-n1_u.js` & `AdminHomePage-CiSgfhoV.js` — Verbatim)
- **Primitive `Card` (`erp`):**
  ```txt
  group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 [--card-spacing:--spacing(6)] data-[size=sm]:[--card-spacing:--spacing(4)]
  ```
  - Portal launcher card (`Da` / `Na`): uses `ring-1 ring-foreground/15`, hover `hover:shadow-md hover:ring-primary/50`, and top-start expanding cyan L-bracket (`h-0.5 w-0 group-hover:w-14 bg-primary` + `w-0.5 h-0 group-hover:h-14 bg-primary`).
- **Apple-Glass Card (`PZv2` Verbatim in `workforce` & `attendance`):**
  - Light: `background: #ffffffc7; backdrop-filter: blur(20px) saturate(160%); border: 1px solid #ffffff99; border-radius: 16px; box-shadow: 0 1px 3px #0000000d, 0 4px 16px #00000008, inset 0 1px #ffffffe0`
  - Dark: `background: #0e0e0ee0; backdrop-filter: blur(24px) saturate(140%); border: 1px solid #ffffff12; border-radius: 16px; box-shadow: 0 1px 3px #000000a6, 0 8px 32px #00000073, inset 0 1px #ffffff0f`
- **KPI Stat Tile (`AdminHomePage-CiSgfhoV.js` Verbatim):**
  - `flex flex-col gap-1 rounded-xl p-4 ring-1 ring-foreground/10 transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50`
  - Label: `text-sm text-muted-foreground`; Value: `text-3xl font-semibold tabular-nums` (`text-primary`, `text-success`, `text-muted-foreground`, `text-amber-600 dark:text-amber-400`, `text-violet-600 dark:text-violet-400`); Hint: `text-xs text-muted-foreground`.

### 5.3 Enterprise Data Tables (`table-JMAitpUT.js` vs `PZv2` Verbatim)
- **ERP Primitive Table (`table-JMAitpUT.js` + Page Frame):**
  - Outer frame: `rounded-xl ring-1 ring-foreground/10` → `relative w-full overflow-x-auto` → `w-full caption-bottom text-sm`.
  - `TableRow`: `border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted` (`[&_tr:last-child]:border-0`).
  - `TableHead` (`th`): `h-10 px-2 text-start align-middle font-medium whitespace-nowrap text-foreground` (sticky first column: `sticky start-0 z-10 border-e bg-background`).
  - `TableCell` (`td`): `p-2 align-middle whitespace-nowrap`.
- **PZv2 High-Density Table (`workforce` / `attendance` CSS):**
  - `border-collapse: separate; border-spacing: 0`; `thead th`: `JetBrains Mono`, `.7rem` (`11.2px`), `700`, `uppercase`, `letter-spacing: .07em`, `padding: 10px 16px`; `tbody td`: `padding: 13px 16px`, `13.5px`, `500`.

### 5.4 Badges (`useDocumentTitle-BXgUR8th.js` — Verbatim `Fl` + `ProjectControl` Status Mapping)
- **ERP Base `Badge` (`Fl`):** `group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap` (`default`: `bg-primary text-primary-foreground`, `secondary`: `bg-secondary text-secondary-foreground`, `destructive`: `bg-destructive/10 text-destructive dark:bg-destructive/20`, `outline`: `border-border text-foreground`; Active user override: `border-success/40 text-success`).
- **Prescriptive `ProjectStatus` Mapping for `Project Control`:**
  - `working` (جاري التنفيذ): Light `bg-[#DCF3F6] text-[#0B7285] border-[#0B7285]/30` | Dark `bg-[#26C6DA]/15 text-[#26C6DA] border-[#26C6DA]/30`
  - `finished` (مكتمل): Light `bg-[#ECFDF5] text-[#157A57] border-[#157A57]/30` | Dark `bg-[#3CC796]/15 text-[#3CC796] border-[#3CC796]/30`
  - `tender` (طرح / مناقصة): Light `bg-[#EEF2FF] text-[#432DD7] border-[#432DD7]/25` | Dark `bg-[#6366F1]/15 text-[#818CF8] border-[#6366F1]/30`
  - `handing_over` (تسليم ابتدائي): Light `bg-[#F0FDFA] text-[#00776E] border-[#00776E]/25` | Dark `bg-[#14B8A6]/15 text-[#2DD4BF] border-[#2DD4BF]/30`
  - `on_hold` (متوقف مؤقتاً): Light `bg-[#FFFBEB] text-[#B75000] border-[#F99C00]/30` | Dark `bg-[#F59E0B]/15 text-[#FBBF24] border-[#FBBF24]/30`
  - `not_started` (لم يبدأ): `bg-muted text-muted-foreground border-border`
  - `cancelled` (ملغي): Light `bg-[#FFF1F2] text-[#C23636] border-[#C23636]/30` | Dark `bg-[#F27A7A]/15 text-[#F27A7A] border-[#F27A7A]/30`

### 5.5 Form Controls, Dialogs, Skeletons & Empty States (`erp` Verbatim)
- **`Input` (`input-CpxwEGjM.js` — note `text-base md:text-sm` mobile zoom guard):**
  ```txt
  h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40
  ```
- **`Dialog` (`dialog-CKscw914.js`):**
  - `DialogOverlay`: `fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0`
  - `DialogContent`: `fixed top-1/2 start-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 rtl:translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-md` (wider dialogs pass `sm:max-w-lg`..`sm:max-w-3xl`).
- **`Skeleton` & Empty States:**
  - `Skeleton`: `animate-pulse rounded-md bg-muted`
  - Empty State: `rounded-xl border border-dashed p-10 text-center text-muted-foreground`

---

## 6. Motion, Print & Anti-Patterns

- **Motion Discipline:**
  - Default interactive transition: `150ms cubic-bezier(0.4, 0, 0.2, 1)`; modal entrance `fade-in-0 zoom-in-95 duration-100`; portal reveal `320ms cubic-bezier(0.65, 0, 0.25, 1)`.
  - Respect `@media (prefers-reduced-motion: reduce)` across all animations.
- **A4 Print Preservation (`@media print`):**
  - Keep existing `@page { size: A4 portrait; margin: 12mm 10mm }` monochrome print overrides in `src/app/globals.css` (`#FFFFFF` paper, `#0F172A` ink, `#CBD5E1` borders, strip nav/floating chrome).
- **Explicit Anti-Patterns (DO NOT USE in `Project Control`):**
  1. **No Emerald `#059669` / `#10B981` as Brand Primary:** Emerald is strictly reserved for `success` / `finished` semantic states; primary brand identity is **Lagoon Teal/Cyan (`#0B7285` Light / `#26C6DA` Dark)**.
  2. **No Warm `stone-*` Neutral Drift:** Never mix warm `stone-*` borders/dropdowns with cool `slate-*` / navy surfaces.
  3. **No Gaming / Sci-Fi Reactor Chrome:** Retire `FloatingCornerHub`'s spinning conic reactor orb, dual shockwave rings, and Web Audio synth chimes in favor of clean topbar `Sun/Moon` and `EN/ع` toggles.
  4. **No Decorative Fonts, Unguarded Uppercase Labels, or Physical `left-*` Offsets:** Never expose decorative `ZYAEA` fonts, never apply `letter-spacing` / `uppercase` to Arabic labels (`:not(:lang(ar))`), and always use logical `start-*` / `end-*` / `ps-*` / `pe-*` properties.
  5. **No Ad-Hoc Z-Index Escalation (`z-[99999]`):** Standardize header `z-40`, modals/drawers `z-50`, popovers/select portals `z-[60]`.

---

## 7. Actionable Migration & Module-Gating Map for `pzoneinternational.projectcontrol` (`branch-1`)

### 7.1 Locked Module Visibility Scope (Focused Project Management Release)
Per product owner directive, gate navigation and routes via a centralized feature-visibility config (`src/lib/config/module-visibility.ts`) **without deleting any database tables, RLS policies, or backend services**:

- **ACTIVE & VISIBLE (`Project Management` / `إدارة المشاريع` ONLY):**
  1. **Projects Dashboard (`لوحة المشاريع`):** `/projects/dashboard` (total project count, status breakdown KPIs, portfolio overview) — set as post-login default landing route.
  2. **Projects List & Table (`قائمة المشاريع`):** `/projects` (search, filter, column pinning, status badges, export/print).
  3. **Create Project (`إضافة مشروع جديد`):** `/projects/new`.
  4. **Project Details & Edit (`تفاصيل وتعديل المشروع`):** `/projects/[id]` and `/projects/[id]/edit` (core project metadata, client/location/contract/dates/status editing).
  5. **Essential Auth & Account:** `/login`, `/unauthorized`, user profile/password modal, locale & theme toggles.
- **HIDDEN (Gated cleanly in `TopNav.tsx`, `EnterpriseSidebar.tsx`, `UiverseFloatingDock.tsx`, `ScrySearch`, and route guard):**
  - Secondary dashboards (`/dashboard`, `/schedule-pulse`, `/project-setup`)
  - `stakeholders` (`/stakeholders`, `/clients`)
  - `site` (`/site-workspace`, `/qc-dashboard`, `/boq`, `/my-tasks`, `/workflow`, `/hse`)
  - `planning` (`/planning/*`)
  - `technical` (`/technical-office`, `/to-dashboard`, `/deliverables`, `/coo/deliverables`, `/to-tasks`, `/document-control`)
  - `reports` (`/reports*`)
  - `contracts` (`/contracts*`, `/cost-control`, `/tender`, `/subcontractors`)
  - `admin` (`/board`, `/user-management`, `/system-admin` — unless explicitly toggled on by flag)

### 7.2 Four-Tier Implementation Sequence on `branch-1` (Local-First)
1. **Tier 1 — Global Token & Font Foundation (`src/app/globals.css`, `src/app/layout.tsx`):**
   - Define ERP `:root` (`#F7FAFC`, `#07131F`, `#0B7285`) and `.dark` (`#07131F`, `#0D1F30`, `#26C6DA`) semantic tokens in `globals.css`.
   - Use Tailwind v4 `@theme` palette aliasing to remap legacy `emerald-*` brand utilities and `stone-*` neutral drift across active Project screens instantaneously while preserving semantic green (`--success`) for `finished` badges.
   - Load `IBM Plex Sans Arabic`, `Manrope`, and `JetBrains Mono` cleanly via `next/font/google` (or local WOFF2) in `src/app/layout.tsx`.
2. **Tier 2 — SSO-Style Coastal Glass Login (`src/app/(auth)/login/page.tsx`):**
   - Replace standalone `#060B14` `MetaballHero` canvas with the official P-Zone Glassmorphic Login (`backdrop-blur-2xl`, top `#26C6DA` hairline, P.ZONE horizontal mark, `border-b` underline inputs with `focus-visible:ring-0`, `from-[#26C6DA] to-[#0E8FA3]` CTA, top-end `EN/ع` + `Sun/Moon` pill) supporting both Light and Dark modes.
3. **Tier 3 — Focused App Shell & Module Gating (`EnterpriseAppShell.tsx`, `TopNav.tsx`, `EnterpriseSidebar.tsx`, `module-visibility.ts`):**
   - Apply crisp `h-14` frosted header (`bg-background/95 backdrop-blur border-b`), expose only the **Projects** tabs (`لوحة المشاريع`, `قائمة المشاريع`, `إضافة مشروع`), hide `FloatingCornerHub` reactor orb, and redirect non-enabled routes safely to `/projects/dashboard`.
4. **Tier 4 — Active Project Screens Polish & Local Verification (`/projects/dashboard`, `/projects`, `/projects/new`, `/projects/[id]/edit`):**
   - Align `KPICard.tsx`, `ProjectCard.tsx`, `ProjectsTable.tsx`, `StatusBadge.tsx`, and project forms to the `rounded-xl ring-1 ring-foreground/10` clinical card + `JetBrains Mono` header anatomy.
   - Run `tsc --noEmit` (0 errors), `vitest run` (all tests green), and launch the isolated `branch-1` worktree dev server on `http://localhost:3001` (leaving existing `localhost:3000` untouched) for local review before any `merge` to `master`.
