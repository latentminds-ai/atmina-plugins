---
name: memory-commit
description: Promotes working-layer notes into durable Atmina wiki primitives with typed evidence, pins in-KB spans, marks unlocated claims unattested, and reads the page back to prove the record survived. Use when committing a decision, fact, procedure, preference, relationship, or open question through write_file or write_files, including after a user correction, a surprising durable lesson, or a decision settled with a stated reason.
metadata:
  pack: atmina-memory
---

# Commit durable memory: pin what you can, then prove the write survived

Type and pin authority is
[`docs/agents/atmina-memory-evidence.md`](../../../docs/agents/atmina-memory-evidence.md)
(W0-1). This skill **imports** that binding. It does not re-define the taught
catalogue, invent a second pin recipe, or wait on LAT-1881. Nothing in the
product validates a word of this on write: a malformed record is dropped on
read, silently, and the page looks right.

**Announce at start:** "I'm using the memory-commit skill to promote this with
typed evidence and prove the write survived."

## When it fires

When something should still matter after this session — a decision, a fact, a
procedure, a preference, a relationship, or an open question. Capture triggers
and the commit bar are
[references/capture-triggers.md](references/capture-triggers.md). Nothing that
meets the bar: **no-op is success**. Selecting sources or writing a session
note is Observe, not this skill.

## Promote

Only into `wiki/decisions/`, `wiki/procedures/`, `wiki/facts/`,
`wiki/preferences/`, `wiki/relationships/`, or `wiki/open-questions/`.

Every durable page carries `source`, `observed`, and `status` (`confirmed` |
`inferred` | `unresolved`) plus **at least one** taught typed evidence entry
from W0-1 §2. Durable pages use evidence `schema: 1`. Wiki menus use `schema:
2`. Those integers name different documents — a durable page with `schema: 2`
yields no evidence at all.

`source:` **may** be a chronicle path. Typed evidence must **not** use
`type: wiki-page` for a chronicle path (it resolves under `wiki/` and comes
back unresolved). This skill does not teach `consented-session-note`. Durable
claims still need a taught typed evidence entry.

Unlocated artefact claims live as Open Questions (`status: unresolved` in
`wiki/open-questions/`), never as confirmed Facts or Procedures.

A Preference or Fact that contradicts the current durable line is **superseded
in place** (`overwrite` + `if_match` on that page). Do not accumulate two
active contradictory lines. Inferred content cannot replace a confirmed entry
without a new Commit.

Optional when they add information, not required on every page: `verified`
events, `stale_after`, `applies_to` (one scalar string), actor format
(`human:` / `process:` / `<agent>/<model>`).

## The write, in order

1. **Bar.** [references/capture-triggers.md](references/capture-triggers.md).
   Fail the bar → stop, success, write nothing durable.
2. **Pin when pinnable.**
   [references/pin-recipe.md](references/pin-recipe.md) — `file_history` →
   versioned `read_file` → `span_sha256` → `pinned_version` + body span link
   **after** the `[@id]` marker. A head `read_file` has no `version_n`. Never
   write `content_sha256`. Never use `from`/`to` for lines.
3. **External.** Taught external type + locator + `https` `url` + `retrieved`,
   **no pin**. Honestly `external`.
4. **Unlocated.** `type: unattested`, note beginning `UNATTESTED — `, no
   locator field, never a guessed `wiki-page` path, never ordinary prose.
5. **Compose** against [references/checklist.md](references/checklist.md) and
   [references/link-discipline.md](references/link-discipline.md).
6. **Write** with `write_file` (`create`; or `overwrite` + `if_match`). The
   write response field is `version_n`, not `version`.
7. **Read it back** — [references/self-check.md](references/self-check.md).
   Re-parse. STOP if it did not survive. Do not skip because LAT-1881 might
   land.
8. **Report** the page path, the new `version_n`, and each entry's read-back
   state. Or STOP.

## What a STOP must contain

A record that did not survive read-back is not "written with a warning". It
does not exist. Say so in this shape before doing anything else:

```
STOP — the write did not survive read-back.
Page: <KB path> in <kb_id>, written as version <version_n>, etag <etag>
Entry: `<id>` — <pinned span | external | unattested>
Expected: <evaluated: true, state: "attested" | "external" | "unresolved">
Read back: <the entry's row verbatim | absent from attestation.entries | no attestation block>
Re-parse: <the checklist item that fails, with the offending bytes>
Not doing: <reporting the claim as recorded; the next step that assumed it>
To continue: <rewrite with the item fixed and run the self-check again | a person confirms>
```

## What this skill does itself, and what it does not

- It **computes** the pin and **composes** the page. Atmina supplies bytes; it
  validates none of them.
- It **re-parses** the read-back: fence, `schema: 1`, `title`/H1, provenance,
  entry fields, marker/entry bijection, link position and target.
- It **reads** a verdict from `attestation` when the read-back carries one.
  No `attestation` block proves only the re-parse; say so.
- It **does not** verify the claim's truth against the world, repair another
  writer's record, or apply Maintain proposals. It does not wait on LAT-1881.
