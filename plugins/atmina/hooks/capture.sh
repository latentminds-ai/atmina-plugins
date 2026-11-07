#!/bin/sh
# Atmina capture: hand this session's start or end to the local collector.
EVENT="${1:-}"
case "$EVENT" in
  SessionStart) TAG=s ;;
  SessionEnd) TAG=e ;;
  *) exit 0 ;;
esac
# The collector sits beside this script; invoked without a directory, there is
# nothing safe to start, so nothing is written either.
case "$0" in
  */*) HERE="${0%/*}" ;;
  *) exit 0 ;;
esac
[ -n "${CLAUDE_PLUGIN_DATA:-}" ] || exit 0
DIR="$CLAUDE_PLUGIN_DATA/collector"
[ -f "$DIR/config.json" ] || exit 0
umask 077
INBOX="$DIR/inbox"
mkdir -p "$INBOX" 2>/dev/null || exit 0
COUNT=0
for FILE in "$INBOX"/*.json; do
  [ -e "$FILE" ] && COUNT=$((COUNT + 1))
done
if [ "$COUNT" -lt 64 ]; then
  ID=$(od -An -N16 -tx1 /dev/urandom 2>/dev/null | tr -d ' \n')
  case "$ID" in
    ????????????????????????????????)
      PART="$INBOX/.$TAG-$ID.part"
      if cat > "$PART" 2>/dev/null; then
        mv -f "$PART" "$INBOX/$TAG-$ID.json" 2>/dev/null || rm -f "$PART" 2>/dev/null
      else
        rm -f "$PART" 2>/dev/null
      fi
      ;;
  esac
fi
RUNTIME=""
[ -f "$DIR/runtime" ] && read -r VERSION RUNTIME 2>/dev/null < "$DIR/runtime"
if [ -n "$RUNTIME" ] && [ -f "$RUNTIME" ]; then
  "$RUNTIME" "$HERE/collector.mjs" start </dev/null >/dev/null 2>&1
fi
exit 0
