#!/usr/bin/env bash
# sync_skill.sh — propagate the canonical pzone-erp skill to every consumer on this PC.
#
# CANONICAL SOURCE (edit HERE):
#   <repo>/.agents/skills/pzone-erp/            (versioned in git — shareable)
#
# CONSUMERS (auto-updated):
#   1. Hermes skills dir (this PC)  → ~/AppData/Local/hermes/skills/software-development/pzone-erp
#   2. Antigravity brain rules dir  → ~/.gemini/antigravity/  (if present)
#   3. Any future consumer: add a copy block below.
#
# Usage: bash ops-scripts/sync_skill.sh   (from repo root, or anywhere — it resolves the repo)

set -euo pipefail

# Resolve repo root from this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$REPO/.agents/skills/pzone-erp"

if [ ! -f "$SRC/SKILL.md" ]; then
  echo "ERROR: canonical skill not found at $SRC/SKILL.md" >&2
  exit 1
fi

echo "Canonical source: $SRC"

# ── 1. Hermes skills dir ─────────────────────────────────────────────
HERMES_DIR="$HOME/AppData/Local/hermes/skills/software-development/pzone-erp"
mkdir -p "$HERMES_DIR/references"
cp "$SRC/SKILL.md" "$HERMES_DIR/SKILL.md"
cp "$SRC"/references/*.md "$HERMES_DIR/references/" 2>/dev/null || true
echo "[ok] Hermes  → $HERMES_DIR"

# ── 2. Antigravity (Gemini CLI) rules dir ────────────────────────────
ANTIGRAVITY_DIR="$HOME/.gemini/antigravity/skills/pzone-erp"
if [ -d "$HOME/.gemini/antigravity" ]; then
  mkdir -p "$ANTIGRAVITY_DIR/references"
  cp "$SRC/SKILL.md" "$ANTIGRAVITY_DIR/SKILL.md"
  cp "$SRC"/references/*.md "$ANTIGRAVITY_DIR/references/" 2>/dev/null || true
  echo "[ok] Antigravity → $ANTIGRAVITY_DIR"
else
  echo "[skip] Antigravity dir not found (~/.gemini/antigravity)"
fi

echo "DONE — skill synced everywhere."
