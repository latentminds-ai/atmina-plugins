#!/bin/sh
# Atmina memory — notice work that was never written down. Never blocks.
set -eu
DIR="${CLAUDE_PLUGIN_DATA:-${PLUGIN_DATA:-${TMPDIR:-/tmp}/atmina-memory}}"
WRITES=0
COMPACTIONS=0
[ -f "$DIR/writes" ] && WRITES=$(cat "$DIR/writes" 2>/dev/null || echo 0)
[ -f "$DIR/compactions" ] && COMPACTIONS=$(cat "$DIR/compactions" 2>/dev/null || echo 0)
case "$WRITES" in ''|*[!0-9]*) WRITES=0 ;; esac
case "$COMPACTIONS" in ''|*[!0-9]*) COMPACTIONS=0 ;; esac
if [ "$COMPACTIONS" -gt 0 ] && [ "$WRITES" -eq 0 ]; then
  cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"This session compacted without writing anything to Atmina. Context was discarded that memory did not keep."}}
JSON
  echo 0 > "$DIR/compactions" 2>/dev/null || true
fi
exit 0
