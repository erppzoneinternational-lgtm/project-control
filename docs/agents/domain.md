# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — domain glossary, critical invariants, portal map, key file index.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in. Check the index in `docs/adr/README.md`.

If any of these files don't exist, **proceed silently**. Don't flag their absence upfront.

## Layout

Single-context repo:

```
/
├── CONTEXT.md              ← domain glossary + invariants
├── docs/
│   ├── adr/                ← Architecture Decision Records (0001–NNNN)
│   │   ├── README.md       ← ADR index
│   │   └── 0001-*.md
│   ├── agents/             ← agent skill configuration (this dir)
│   │   ├── issue-tracker.md
│   │   ├── triage-labels.md
│   │   └── domain.md
│   ├── GAP_ANALYSIS_SITE_TASKS.md
│   ├── PLAN_Planning_Module.md
│   └── PRD_PROJECT_TASK_ONTOLOGY.md
├── PROJECT.md              ← feature inventory + milestone status
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

Key terms: **Site Task**, **Daily Progress Report**, **Deliverable**, **Deliverable Item**, **PM Soft Review**, **WIR**, **Code C**, **EVM**, **S-Curve**, **Silent Site**, **RBAC**, **service_role bypass**.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0002 (deliverable item status lifecycle) — but worth reopening because…_
