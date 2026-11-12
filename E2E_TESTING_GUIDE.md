# P-Zone Portal — Production E2E Automation & Verification Guide
**Author:** Eng. Hassan A. Soliman  
**Harness Protocol:** Super Gemini Execution Protocol & Hassan Soliman Mode  
**Test Framework:** Playwright Test 1.50+  
**Target URL:** Next.js Production Build (`localhost:3000`) & Production Environment  

---

## 1. Overview & Test Suite Architecture

The P-Zone Portal E2E testing harness ensures end-to-end reliability, contractual integrity, and UI/UX responsiveness across all modules.

### Coverage Matrix:

| Test Spec | Domain / Feature | Key Verification Points | Status |
|:---|:---|:---|:---:|
| [`e2e/pm_unification.spec.ts`](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/e2e/pm_unification.spec.ts) | Project Manager Governance | Single Source of Truth, Hero Banner, Verification Card, Succession Timeline | **PASSED** |
| [`e2e/resizable_table.spec.ts`](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/e2e/resizable_table.spec.ts) | Universal Table Resizing | Drag handles on table headers, RTL coordinate scaling, width persistence | **PASSED** |
| [`e2e/missing_data_overlay.spec.ts`](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/e2e/missing_data_overlay.spec.ts) | Missing Data UX Protection | Informative overlay pop-up, dynamic CSS blur (`blur-[7px]`), temporary preview toggle | **PASSED** |
| [`e2e/schedule_pulse_gate.spec.ts`](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/e2e/schedule_pulse_gate.spec.ts) | Security Gating & Canvas | Gated access away from public deployments; authorized E2E bypass verification | **PASSED** |
| [`e2e/geo_location_sync.spec.ts`](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/e2e/geo_location_sync.spec.ts) | Egypt Geo Location & Map Sync | Governorate-first gate, dynamic city cascade, reverse GPS geocoding | **PASSED** |
| [`e2e/planning_engineer.spec.ts`](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/e2e/planning_engineer.spec.ts) | Planning Workflows | Daily progress approval/rejection, EVM recalculation, lock/unlock logic | **PASSED** |
| [`e2e/technical_office.spec.ts`](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/e2e/technical_office.spec.ts) | Technical Office | Submittal reviews, drawing register, approval queues | **PASSED** |
| [`e2e/document_control.spec.ts`](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/e2e/document_control.spec.ts) | CDE & Transmittals | Drawing versions, ISO 19650 transmittals, metadata search | **PASSED** |
| [`e2e/pmo_governance.spec.ts`](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/e2e/pmo_governance.spec.ts) | Site Workspace & Obstructions | Site workspace aggregation, quick dials, daily obstruction EOT bridge | **PASSED** |
| [`e2e/modules_governance.spec.ts`](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/e2e/modules_governance.spec.ts) | Enterprise Modules | Tender pipeline, HSE safety metrics & PTW notices, Executive Board | **PASSED** |

---

## 2. Command Reference

### Local Execution:

```bash
# Run all E2E tests headless
npm run test:e2e

# Run tests in interactive UI mode (debugger & time-travel)
npm run test:e2e:ui

# View latest HTML test execution report
npm run test:e2e:report

# Run a specific test suite
npx playwright test e2e/pm_unification.spec.ts
```

---

## 3. CI/CD Matrix Automation (`ci/e2e-matrix.yml`)

The repository includes a production-grade GitHub Actions workflow matrix in `ci/e2e-matrix.yml`:
- **Triggers:** Pull requests and pushes to `master`, `main`, and `remediation/**` branches.
- **Environment:** Ubuntu-latest with Node.js 20.
- **Artifacts:** Full test reports and screenshots are preserved for 14 days upon test completion or failure.
- **Activation:** To activate in GitHub Actions directly, copy `ci/e2e-matrix.yml` to `.github/workflows/e2e-matrix.yml` in repository settings or via GitHub interface.
