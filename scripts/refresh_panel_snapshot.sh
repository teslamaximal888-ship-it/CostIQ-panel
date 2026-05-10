#!/usr/bin/env bash
set -euo pipefail

PANEL_DIR="/home/ClawdCostIQ/workspace/costiq-panel"
LOG_FILE="/home/ClawdCostIQ/.codex/telegram_context/panel-refresh.log"

cd "$PANEL_DIR"

{
  printf '[%s] refresh start\n' "$(date -Is)"
  python3 scripts/build_panel_data.py --quiet

  if git diff --quiet -- panel-data.json; then
    printf '[%s] no panel-data changes\n' "$(date -Is)"
    exit 0
  fi

  git add panel-data.json
  git commit -m "Refresh panel data snapshot"
  git push origin main
  printf '[%s] pushed panel-data snapshot\n' "$(date -Is)"
} >> "$LOG_FILE" 2>&1
