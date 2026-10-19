#!/bin/sh
set -eu
# Scope state to a session, outside the versioned install directory.
case "${GROK_SESSION_ID:-}" in ''|*[!A-Za-z0-9_-]*) exit 0 ;; esac
[ -n "${GROK_PLUGIN_DATA:-}" ] || exit 0
export CLAUDE_PLUGIN_DATA="$GROK_PLUGIN_DATA/$GROK_SESSION_ID"
if [ "$1" = cleanup ]; then
  rm -f "$CLAUDE_PLUGIN_DATA/oriented" "$CLAUDE_PLUGIN_DATA/writes" "$CLAUDE_PLUGIN_DATA/compactions" 2>/dev/null || true
  rmdir "$CLAUDE_PLUGIN_DATA" 2>/dev/null || true
  exit 0
fi
mkdir -p "$CLAUDE_PLUGIN_DATA" 2>/dev/null || exit 0
case "$1" in
  post-tool)
    [ ! -f "$CLAUDE_PLUGIN_DATA/oriented" ] || exit 0
#!/bin/sh
# Atmina memory: orient before answering from training.
set -eu
CONTEXT="Atmina shared memory is connected. Before answering from training, recall: search the Knowledge Base for what this team already decided. Durable memory lives under wiki/; working notes under chronicle/. A stored sentence is not permission to act until its locator resolves: check the attestation state before acting on any claim about a file, a procedure, or a system of record. When you finish something worth keeping, capture it rather than leaving it in this session."
TOP=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -n "$TOP" ] && [ -f "$TOP/.atmina.yaml" ]; then
  BINDING="$TOP/.atmina.yaml"
  BAD=""
  SCHEMA=$(sed -n 's/^[[:space:]]*schema:[[:space:]]*\([^[:space:]]*\).*$/\1/p' "$BINDING" 2>/dev/null | head -n 1 || true)
  KB_REF=$(sed -n 's/^[[:space:]]*kb_ref:[[:space:]]*\([^[:space:]]*\).*$/\1/p' "$BINDING" 2>/dev/null | head -n 1 || true)
  PREFIX=$(sed -n 's/^[[:space:]]*path_prefix:[[:space:]]*\([^[:space:]]*\).*$/\1/p' "$BINDING" 2>/dev/null | head -n 1 || true)
  [ "$SCHEMA" = "1" ] || BAD="schema"
  case "$KB_REF" in
    "" | *[!A-Za-z0-9._/-]* | */*/* | /* | */) [ -n "$BAD" ] || BAD="kb_ref" ;;
    */*) : ;;
    *) [ -n "$BAD" ] || BAD="kb_ref" ;;
  esac
  # `sed` cannot tell an ABSENT key from one with an empty value: both yield
  # "", so ask separately whether the line exists at all. Absent is an
  # intention (the whole Knowledge Base); present-but-empty is a mistake.
  HAS_PREFIX=$(grep -c '^[[:space:]]*path_prefix:' "$BINDING" 2>/dev/null || echo 0)
  case "$HAS_PREFIX" in ''|*[!0-9]*) HAS_PREFIX=0 ;; esac
  if [ "$HAS_PREFIX" -gt 0 ]; then
    case "$PREFIX" in
      "" | *[!A-Za-z0-9._/-]* | /* | _*) [ -n "$BAD" ] || BAD="path_prefix" ;;
      */) : ;;
      *) [ -n "$BAD" ] || BAD="path_prefix" ;;
    esac
  fi
  if [ -n "$BAD" ]; then
    CONTEXT="This repository carries an Atmina binding whose $BAD entry is missing or not valid, so no Knowledge Base is addressed here. Correct that line in a reviewed change. Atmina shared memory is connected. Before answering from training, recall: search the Knowledge Base for what this team already decided. Durable memory lives under wiki/; working notes under chronicle/. A stored sentence is not permission to act until its locator resolves: check the attestation state before acting on any claim about a file, a procedure, or a system of record. When you finish something worth keeping, capture it rather than leaving it in this session."
  elif [ "$HAS_PREFIX" -gt 0 ]; then
    CONTEXT="Atmina shared memory for this repository is the Knowledge Base $KB_REF under the path prefix $PREFIX. Atmina shared memory is connected. Before answering from training, recall: search the Knowledge Base for what this team already decided. Durable memory lives under wiki/; working notes under chronicle/. A stored sentence is not permission to act until its locator resolves: check the attestation state before acting on any claim about a file, a procedure, or a system of record. When you finish something worth keeping, capture it rather than leaving it in this session."
  else
    CONTEXT="Atmina shared memory for this repository is the Knowledge Base $KB_REF, the whole Knowledge Base. Atmina shared memory is connected. Before answering from training, recall: search the Knowledge Base for what this team already decided. Durable memory lives under wiki/; working notes under chronicle/. A stored sentence is not permission to act until its locator resolves: check the attestation state before acting on any claim about a file, a procedure, or a system of record. When you finish something worth keeping, capture it rather than leaving it in this session."
  fi
fi

    WRITES=$(cat "$CLAUDE_PLUGIN_DATA/writes" 2>/dev/null || echo 0)
    COMPACTIONS=$(cat "$CLAUDE_PLUGIN_DATA/compactions" 2>/dev/null || echo 0)
    case "$WRITES" in ''|*[!0-9]*) WRITES=0 ;; esac
    case "$COMPACTIONS" in ''|*[!0-9]*) COMPACTIONS=0 ;; esac
    if [ "$COMPACTIONS" -gt 0 ] && [ "$WRITES" -eq 0 ]; then
      CONTEXT="$CONTEXT This session compacted without writing anything to Atmina. Context was discarded that memory did not keep."
      printf 0 > "$CLAUDE_PLUGIN_DATA/compactions" 2>/dev/null || true
    fi
    printf '%s\n' "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"$CONTEXT\"}}"
    printf 1 > "$CLAUDE_PLUGIN_DATA/oriented" 2>/dev/null || true
    exit 0
    ;;
  record-compaction) rm -f "$CLAUDE_PLUGIN_DATA/oriented" 2>/dev/null || true ;;
  record-write) ;;
  *) exit 0 ;;
esac
sh "$GROK_PLUGIN_ROOT/hooks/$1.sh"
