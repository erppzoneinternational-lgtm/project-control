# Site Engineer Workflow Enhancements (3D UI & Logistics)

## Goal
Fix operational gaps (Over-execution, Resources, Obstructions) while transforming the Site Engineer reporting interface using `3d-ui` spatial depth and interactive perspective principles.

## Tasks
- [ ] Task 1: Add BOQ Qty Validation (Block if `daily_qty` + `previousQty` > `contract_qty`) → Verify: Exceeding BOQ shows UI error and blocks submission.
- [ ] Task 2: Fast Grid Z-Axis Focus → Verify: Focusing a quantity input applies `scale(1.05) translateZ(10px)` and drops background opacity to 50% without tilting the table rows.
- [ ] Task 3: Add Manpower & Equipment fields to Wizard Step 2 → Verify: Fields render and save to form state.
- [ ] Task 4: Add Obstructions (عوائق) & Weather options to Wizard → Verify: Can flag task delay/blocker reasons.
- [ ] Task 5: 3D Wizard Transitions → Verify: Wizard steps transition spatially using `transform-style: preserve-3d` and `translateZ(-100px)`.
- [ ] Task 6: 3D Interactive Option Tiles → Verify: Weather and Shift option tiles use interactive `rotateX`/`rotateY` and 3D rendered PNGs (replacing flat emojis), including a gyroscope "Enable Motion" opt-in for iOS.
- [ ] Task 7: Update `DailyProgressService` payload to include new fields → Verify: API submission includes resources and obstructions.
- [ ] Task 8: Update `site_engineer.spec.ts` → Verify: `npx playwright test` passes for the new logic.

## Done When
- [ ] Over-execution is strictly blocked.
- [ ] Daily report captures resources and blockers.
- [ ] Fast Grid elevates active inputs using Z-axis depth.
- [ ] Wizard Modal utilizes 3D step transitions and interactive spatial tiles for options.
- [ ] Playwright E2E tests pass.
