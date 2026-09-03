#!/bin/sh
# Atmina memory — orient before answering from training.
set -eu
CONTEXT="Atmina shared memory is connected. Before answering from training, recall: search the Knowledge Base for what this team already decided. Durable memory lives under wiki/; working notes under chronicle/. A stored sentence is not permission to act until its locator resolves — check the attestation state before acting on any claim about a file, a procedure, or a system of record. When you finish something worth keeping, capture it rather than leaving it in this session."
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
  # `sed` cannot tell an ABSENT key from one with an empty value — both yield
  # "" — so ask separately whether the line exists at all. Absent is an
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
    CONTEXT="This repository carries an Atmina binding whose $BAD entry is missing or not valid, so no Knowledge Base is addressed here. Correct that line in a reviewed change. Atmina shared memory is connected. Before answering from training, recall: search the Knowledge Base for what this team already decided. Durable memory lives under wiki/; working notes under chronicle/. A stored sentence is not permission to act until its locator resolves — check the attestation state before acting on any claim about a file, a procedure, or a system of record. When you finish something worth keeping, capture it rather than leaving it in this session."
  elif [ "$HAS_PREFIX" -gt 0 ]; then
    CONTEXT="Atmina shared memory for this repository is the Knowledge Base $KB_REF under the path prefix $PREFIX. Atmina shared memory is connected. Before answering from training, recall: search the Knowledge Base for what this team already decided. Durable memory lives under wiki/; working notes under chronicle/. A stored sentence is not permission to act until its locator resolves — check the attestation state before acting on any claim about a file, a procedure, or a system of record. When you finish something worth keeping, capture it rather than leaving it in this session."
  else
    CONTEXT="Atmina shared memory for this repository is the Knowledge Base $KB_REF, the whole Knowledge Base. Atmina shared memory is connected. Before answering from training, recall: search the Knowledge Base for what this team already decided. Durable memory lives under wiki/; working notes under chronicle/. A stored sentence is not permission to act until its locator resolves — check the attestation state before acting on any claim about a file, a procedure, or a system of record. When you finish something worth keeping, capture it rather than leaving it in this session."
  fi
fi
printf '%s\n' "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}}"
