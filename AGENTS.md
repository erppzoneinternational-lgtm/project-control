<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

Dual-tracked: AFK-agent tasks go in `.scratch/` (local markdown); team-visible bugs and features go in GitHub Issues (`github.com/HassanAhmed238/pzone-portal`). No external PRs as triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default mattpocock/skills labels — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo. Read `CONTEXT.md` at root (domain glossary + invariants) and `docs/adr/` (architecture decisions) before touching any domain code. See `docs/agents/domain.md`.
