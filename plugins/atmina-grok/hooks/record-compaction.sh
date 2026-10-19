#!/bin/sh
# Atmina memory — record that context was compacted.
set -eu
DIR="${CLAUDE_PLUGIN_DATA:-${PLUGIN_DATA:-${TMPDIR:-/tmp}/atmina-memory}}"
mkdir -p "$DIR" 2>/dev/null || exit 0
COUNT=0
[ -f "$DIR/compactions" ] && COUNT=$(cat "$DIR/compactions" 2>/dev/null || echo 0)
case "$COUNT" in ''|*[!0-9]*) COUNT=0 ;; esac
echo $((COUNT + 1)) > "$DIR/compactions" 2>/dev/null || true
exit 0
