---
name: memory-recall
description: Recalls durable Atmina memory with verify-before-act. Orients, matches applies_to via exhaustive list_files (not search), searches wiki/ with recency boosts, reads the smallest set, and verifies artifact claims on the computed attestation block before acting — never substituting a near match, never writing memory. Use when recalling, looking up, or acting on a decision, procedure, fact, preference, relationship, or open question already on file in an Atmina Knowledge Base, or when the user asks to remember, look up, or bring them up to speed.
metadata:
  pack: atmina-memory
license: Apache-2.0
---

# Recall durable memory, then verify before acting

This skill reads organisational memory. It does not write it. A sentence in
the wiki is not permission to act until its locator is checked.

**Announce at start:** "I'm using the memory-recall skill to recall from
durable memory and verify before acting."

Taught types, the pin recipe, `[@id]` marker/link binding, silent-drop
cliffs, and attestation-state meanings are defined in
`docs/agents/atmina-memory-evidence.md`. This skill **imports** that
document. It does not teach a second catalogue.

## When it fires

When the task needs something the team already recorded, or before acting on
any artifact claim read from Atmina. Reading is free; acting needs the check.

## Procedure

Do these in this order. The full recipe is
[references/procedure.md](references/procedure.md).

1. **Orient.** `whoami`, `list_kbs`, this KB's `get_context`. Read
   `wiki/kb-profile.md` if present. Do not search everything first.
2. **Applies-to first.** If the task names an artifact, `list_files` with
   `/applies_to` `eq` that key — exhaustive catalog filter, **not** `search`.
   [references/applies-to.md](references/applies-to.md).
3. **Durable search.** `search` scoped to `wiki/`, with `ranking.boosts`
   recency on `event_date` else `updated_at`, small `max_files`.
4. **Smallest read.** Snippets if enough; else one `read_file`; a second only
   when the first names it as evidence or the user asks to compare.
5. **Verify before acting** on an artifact claim.
   [references/states.md](references/states.md), then
   [references/verify.md](references/verify.md).
6. **No writes.** Stale content is reported, not silently fixed.
7. **Zero durable hits** → say **durable memory has no maintained answer**
   and continue with systems of record. "Not in the wiki" is not "the world
   has no truth".

A Pulse, a Current State, a session note, or a directory-card README is not
permission to act. `wiki/` is durable; `chronicle/` is working;
`_consolidated/` is compiled; CRM / tickets / calendars / ledgers are live
systems of record.

## Outcomes

- **Proceed** — act on the located span or the live SoR record, never the
  paraphrase.
- **STOP** — the shape in [references/verify.md](references/verify.md). Never
  substitute a near match.
- **Unverified** — no evidence entry; say so and ask.

A worked STOP is
[references/incident-walkthrough.md](references/incident-walkthrough.md).
