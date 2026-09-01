#!/bin/sh
# Atmina memory — count durable writes for this session.
set -eu
DIR="${CLAUDE_PLUGIN_DATA:-${PLUGIN_DATA:-${TMPDIR:-/tmp}/atmina-memory}}"
mkdir -p "$DIR" 2>/dev/null || exit 0
COUNT=0
[ -f "$DIR/writes" ] && COUNT=$(cat "$DIR/writes" 2>/dev/null || echo 0)
case "$COUNT" in ''|*[!0-9]*) COUNT=0 ;; esac
echo $((COUNT + 1)) > "$DIR/writes" 2>/dev/null || true
exit 0
