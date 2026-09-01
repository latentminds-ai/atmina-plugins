# Claim-repair pass (propose-only)

This is the **claim-repair pass** (an **attestation sweep** when it fires on
a cadence). Track A's sweep, performed by an agent: walk evidence, re-resolve
each locator, re-compare each pin, and report what drifted or went
unresolvable.

Type, pin recipe, marker/link binding, silent-drop cliffs, and attestation
states are defined in
[`docs/agents/atmina-memory-evidence.md`](../../../docs/agents/atmina-memory-evidence.md)
(W0-1). **Import** that file. Do not re-state the catalogue or invent a
second hash. Apply W0-1 §5.2 to bytes a `read_file` returned. Apply W0-1
§4 for which body link is the span. Apply W0-1 §9 for `attested` /
`drifted` / `unresolved` / `external`.

ADR 0038 ruling 2 / D-A7: auto-repoint **proposal** solely on exact content
match at a new offset; otherwise flag. Never silently reword a claim.
`applyReviewedRepairs` is REST, admin-on-KB, **not** an MCP tool — never
call it. The report is the staging area. Do **not** write `_staged/`.

## Walk

1. `list_files({ kb_id, path_prefix: "wiki/" })` — exhaustive catalog,
   not `search`. Durable claims live under `wiki/`.
2. For each evidence-carrying page, `read_file` at head. If the response
   carries `attestation`, use those states. Missing block → check the
   entry yourself with W0-1 (locator, pin, span). A missing `state` is
   not a pass.
3. Skip `chronicle/`, compiled views, and non-wiki paths as truth.

## For each evidence entry

**`attested`.** No repair. Record nothing unless a duplicate or
contradiction pass already named this page.

**`external`.** Recorded, not verified by Atmina. Do not auto-repoint.
Flag only if the recorded address is obviously gone (fetch failed at the
written `https` URL). Resolve against the live system of record (CRM,
ticket, calendar, ledger, official document) is a human's check, not a
silent rewrite.

**`unresolved`.** Flag. Say which of: no locator; wiki page missing; pin
pruned; pin unreadable; `unattested`. Do not substitute a nearby page
with a similar name. Do not guess a `wiki-page` path.

**`drifted` (or a manual check that the cited span at head no longer
hashes to `span_sha256`).** Attempt an auto-repoint **proposal**:

1. `file_history` on the target. If `pinned_version` is below
   `oldest_retained` or absent from `versions[]`, the pin is gone —
   flag `unresolved` (pruned). Do not invent bytes.
2. `read_file` the target at `version: <pinned_version>`. Apply W0-1
   §5.1 / §5.2 to the span the `[@id]` marker binds (nearest following
   body link whose resolved target matches). Keep those exact span
   bytes.
3. `read_file` the target at head (no `version`). Split stored lines
   the same way (W0-1 §5.1).
4. Find a contiguous head range whose joined bytes are **byte-identical**
   to the pinned span (same UTF-8, no trim, no restyle).
5. **Exactly one match at a new offset** → propose re-pointing the span
   link's `#Ln-Lm` to that range and `pinned_version` to the head's
   `version_n`. `span_sha256` is unchanged (same bytes). Leave the
   claim sentence untouched.
6. **Exact match at the same offset** → the hash mismatch is not a
   move; flag (do not reword).
7. **Zero matches, or more than one** → flag. Do not pick. Do not
   paraphrase. Do not "fix" the sentence to match the new text.

A proposal is text in the trail, for a human. It is not a `write_file`
on the citing page.

## Dedupe and contradictions

Same-intent durable pages (same artefact, same assertion): propose
keeping one. **`status: confirmed` wins.** `inferred` is never
auto-picked over `confirmed`. Two confirmed lines that disagree: flag
both; do not merge. Inferred updates are proposals; a human or an
explicit in-band Commit applies them.

## Never

- Silently reword a claim (D-A7 / ADR 0038 ruling 2).
- Call REST `applyReviewedRepairs`.
- Write `_staged/`.
- Write a live evidence entry, span link, or claim body.
- Teach a second type catalogue or a second pin recipe.
