# Procedure — normative order

Do the steps in this order. Skip none — but §1 Orient is once per session,
not per recall: a recall of a known fact goes straight to `search` (§3). This
path never writes.


Shipped tools this skill may call: `whoami`, `health`, `list_kbs`,
`get_context`, `search` (`path_prefix`, `ranking.boosts`, `filters`),
`list_files`, `read_file`, `file_history`, `get_file_outline`, `related`.

Do not call `write_file`, `write_files`, `update_file`, `move_file`,
`generate_nav`, or `update_kb` on this path.

## 1. Orient

Do not search "everything" first.

1. `whoami` — who is calling, which team.
2. `list_kbs` — which Knowledge Bases this caller can read.
3. `get_context` on the KB in play — Menu / compiled state and Pulse, so you
   know the lay of the land before you dig.
4. If `wiki/kb-profile.md` is present, `read_file` it. Intensity, scope, and
   the primitive map live there.

`get_context`'s Pulse and Current State are compiled convenience. They are
not permission to act. Source in `wiki/` wins on conflict.

## 2. Applies-to match first

If the task names artifacts (a client, a record, a document, a procedure),
match them with `list_files` and `/applies_to` `eq` that key. This is an
exhaustive catalog filter, **not** `search`.

The call, the unregistered / not-`ready` fall-through, and the scalar-string
rule are in [applies-to.md](applies-to.md).

Read at most a handful of matches and cite them. Then continue — applies-to
hits do not skip verify-before-act.

If the task names no artifact key, skip this step.

## 3. Durable search

The product's `search` covers the whole KB, working notes included. This
skill scopes to `wiki/` on purpose: working notes are candidates, not truth.

```
search({

  query: "<the question>",
  scope: { path_prefix: "wiki/" },
  ranking: {
    boosts: [
      { field: "event_date", direction: "newer" },
      { field: "updated_at", direction: "newer" }
    ]
  },
  max_files: 5
})
```

- Scope is `wiki/`. Do not search `chronicle/` or `_consolidated/` as truth.
- Recency boosts are those two catalog fields, direction `newer`. `observed`
  is **not** a catalog boost field; do not send it.
- `event_date` else `updated_at`: both boosts are sent. A hit missing
  `event_date` contributes nothing on that field and still ranks on
  `updated_at`.
- Keep `max_files` small (5, default 8 is already a ceiling of 20).
- Compiled hits that happen to appear are convenience. Source wins on
  conflict.
- Waterline is ranking, not deletion. A historical question widens or drops
  the recency boost rather than treating an old confirmed decision as gone.

## 4. Smallest read

- Answer from search snippets when they are enough.
- Otherwise one `read_file` of the strongest durable hit.
- A second `read_file` only when the first names that file as evidence, or
  the user asks to compare.

Do not open a directory-card README as if it authorised the action. Setup
seeds describe the tree; they are not the claim.

## 5. Verify before acting

On any claim that asserts something about an artifact in the world (where a
contract lives, what a procedure requires, which record to update):

1. If the `read_file` response carries an `attestation` block, act on the
   entry's `state` — [states.md](states.md).
2. Otherwise the manual check in [verify.md](verify.md).

`attested` → proceed on the **span**, not the paraphrase.
`drifted` / `unresolved` → STOP in the verify shape; never substitute.
`external` → resolve the locator against the live SoR.
`evaluated: false` or missing `attestation` → manual check, **never a pass**.
No evidence entry → unverified; say so and ask.

Do not re-request computed states. LAT-1849 already ships them on a head
read of an evidence-carrying wiki page. A version read and a non-evidence
page carry no block.

## 6. No writes

Stale, contradictory, or drifted durable content is **reported**. It is not
silently rewritten mid-task. Commit and Maintain are other skills.

## 7. Zero durable hits

If applies-to (when it ran) and durable search both return nothing, say:

> durable memory has no maintained answer

Then continue with systems of record and the task's other tools. Not in the
wiki is not "the world has no truth".

## Surfaces, distinguished

| Surface | What it is | Permission to act? |
| --- | --- | --- |
| `wiki/` | Durable primitives | Only after verify-before-act |
| `chronicle/` | Working layer (Observe) | No |
| `_consolidated/` | Compiled views | No — source wins |
| Pulse / Current State | Compiled convenience | No |
| Directory-card README | Setup seed | No |
| CRM / tickets / calendars / ledgers | Live systems of record | Yes, as themselves |
