---
name: memory-maintain
description: Runs an out-of-band report-only maintain pass over an Atmina Knowledge Base — idle-gated, proposing same-intent merges and claim repairs, flagging contradictions and stale_after, archiving obsolete pages to KB-root archive/ when they are not cited as in-KB evidence, proposing linkify of bare catalog paths, reporting durable pages that have never been recalled alongside broken references and unconnected pages (each count stating the scope it covered), and writing a short trail in chronicle/. Use when an operator asks to maintain memory, repair claims, archive obsolete knowledge, linkify wiki paths, review recall or link health, or run an attestation sweep — never during an in-band user task, and never as a task's finally.
metadata:
  pack: atmina-memory
---

# Maintain organisational memory (report-only)

Out of band. Report-only (G6), except archive via `move_file` and the trail
write. The claim-repair pass is carried here, in this skill; nothing else
needs to be installed for it. The product's consolidate routine compiles a
current-state view; it does not review, repair, or archive memory. This pass
is not that routine and does not run it.


**Announce at start:** "I'm using the memory-maintain skill to run an
out-of-band report-only maintain pass."

Type and pin authority is
[`docs/agents/atmina-memory-evidence.md`](../../../docs/agents/atmina-memory-evidence.md)
(W0-1). This skill **imports** that binding. It does not re-define the taught
catalogue, the pin recipe, the `[@id]` marker/link bijection, or
`unattested`. Audience is business / organisational. Pins are Atmina
`pinned_version` + `span_sha256`.

## Idle gate

Do **not** run during an in-band user task. Operator or explicitly
out-of-band only. There is no platform idle API; do not invent one. Do not
run as the task's `finally`. Recipe:
[references/idle-gate.md](references/idle-gate.md).

## When it fires

When an operator asks to maintain, repair claims, archive obsolete
knowledge, linkify bare paths, or run an attestation sweep — and the turn is
out of band. A live Recall / Observe / Commit is not this skill.

## Procedure

Keep one `kb_id`. Tools: `list_files`, `search`, `read_file`,
`file_history`, `move_file`, `get_context` (health only), `write_file`
(trail / report only — not live claim reword). Not assumed: apply-repairs
MCP, write-path diagnostics, a type registry.

1. **Idle gate.** In-band → STOP, write nothing.
2. **Orient.** Confirm the KB. Durable truth is `wiki/`. `chronicle/` is
   working. Compiled views are not organisational truth.
3. **Dedupe.** Same-intent duplicates: propose a merge. Keep confirmed over
   inferred. Inferred is never auto-picked over confirmed.
4. **Contradictions.** Flag. Do not auto-resolve.
5. **Claim-repair pass.** Propose-only.
   [references/repair.md](references/repair.md).
6. **`stale_after`.** List for re-confirmation. Not a deletion.
7. **Archive** obsolete pages with `move_file` to KB-root `archive/`.
   [references/archive.md](references/archive.md).
8. **Linkify.** Propose-only.
   [references/linkify.md](references/linkify.md).
9. **Health.** Durable pages never recalled, from the step-5 walk. Then
   `get_context` with `include: ["link_health"]` for broken references and
   unconnected pages. **Every count states what it did not check**; an
   absent block is "not checked", never zero.
   [references/health.md](references/health.md).
10. **Trail** in `chronicle/`.
    [references/trail.md](references/trail.md).

Proposals live in that report for a human to apply. Do **not** write
`_staged/`. Do **not** call REST `applyReviewedRepairs`. Do **not** silently
reword a live claim body.

## Outcomes

- **Report** — merges proposed, inferred refused, contradictions flagged,
  repairs proposed or flagged, `stale_after` listed, archives done or
  skipped, linkify proposed, **Health** section, trail path.
- **STOP** — the turn is in-band, or the operator did not ask for Maintain.
  Write nothing.
