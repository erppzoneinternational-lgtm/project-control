<task>
Create exactly one documentation file: `.scratch/planning-redesign/antigravity-gap-audit.md`.

Audit how the implemented Antigravity role-workflow redesign diverged from the user's recorded requirements. Read and compare these primary sources:

- `../../PRODUCT_DISCOVERY_INTERVIEW.md`
- `docs/PRD_PROJECT_TASK_ONTOLOGY.md`
- `.agents/ORIGINAL_REQUEST.md`
- `.agents/handoff.md`
- `CONTEXT.md`
- relevant `docs/adr/*.md`
- migrations 023 through 035 and their directly related services/components/tests

Invoke `/superpower` before the audit if it is available in Antigravity. If unavailable, state that in the report and continue.

The report must contain:

1. Source hierarchy and dates.
2. A requirement traceability table with requirement, authoritative source, implementation status (`built`, `partial`, `missing`, `contradicted`, or `unverified`), evidence path and line, and operational impact.
3. A table of requirements Antigravity added or changed without support from the discovery record.
4. A table of completion claims that are not proven by repository or deployment evidence.
5. Domain contradictions, especially Daily Progress approval ownership, reported/approved/verified progress, QC/WIR gating, role count, fine-grained permissions, project/contract model, and Zone versus Component Instance.
6. A concise list of facts safe to carry into a replacement PRD.
7. Open product decisions only. Do not decide them.

Separate observed facts, inferences, and open questions. Cite exact files and lines. Do not treat passing unit tests or a successful build as proof that migrations were applied or production workflows work.

Do not modify code, migrations, tests, requirements, ADRs, CONTEXT.md, or any existing file. Do not access production services or run migrations.
</task>

<verification_loop>
Before finishing:
- Confirm `.scratch/planning-redesign/antigravity-gap-audit.md` exists and is non-empty.
- Confirm every material claim has a repository citation.
- Run `git status --short -- .scratch/planning-redesign/antigravity-gap-audit.md`.
- Confirm no file except `.scratch/planning-redesign/antigravity-gap-audit.md` was changed by this task.
</verification_loop>

<research_mode>
Separate observed facts, inferences, and open decisions. Never convert an inference into a requirement.
</research_mode>

<action_safety>
Keep changes strictly scoped to the single audit file. No code changes, refactors, migration execution, production access, dependency installation, git add, or git commit. Leave the audit uncommitted for orchestrator review.
</action_safety>

<structured_output_contract>
End with:
1. What changed and why
2. Files touched
3. Verification outcome
4. Deviations, unknowns, or decisions still required
</structured_output_contract>
