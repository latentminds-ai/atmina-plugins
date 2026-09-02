# Product-computed verdict — states and what to do

Imported from `docs/agents/atmina-memory-evidence.md` §9. That section
**defines** the four states. This file is the reader's follow-through. Do
not treat a second table here as a second authority.

Read this when a `read_file` response carries an `attestation` key.
The product returns the block on a head read of an evidence-carrying wiki
page. Do not re-request computed states. A version read and a
non-evidence page carry no block.

## The shape on the wire

```json
"attestation": {
  "entries": [
    { "evidence_id": "renewal-term", "evaluated": true, "state": "attested" },
    { "evidence_id": "crm-account", "evaluated": true, "state": "external" },
    { "evidence_id": "old-clause", "evaluated": false }
  ],
  "truncated": true,
  "resolution_bound": 50
}
```

- `entries` — one row per evidence entry, keyed by `evidence_id` (the
  frontmatter `id` and the `[@id]` marker text).
- `evaluated: true` rows carry a `state`. `evaluated: false` rows carry
  **no** `state` key. Do not read a missing key as anything.
- `truncated: true` means at least one entry was not evaluated. Say so
  whenever it is true, even if your own entry was evaluated.

## Follow-through (meanings as in the evidence convention §9)

| `state` | Do |
| --- | --- |
| `attested` | **Proceed on the span**, not the paraphrase. When the action turns on a detail, read the span through its body link and take the detail from there. `attested` says the lines did not move; it does not say the sentence paraphrased them correctly. |
| `drifted` | **STOP** in the [verify.md](verify.md) shape. Do not act on the new text either. A person or the record's owner decides whether the claim still holds. Never substitute a near match. |
| `unresolved` | **STOP** in the verify shape. Result names which of: no locator; file missing; pin pruned; pin unreadable — if you can tell from the entry; otherwise `unresolved — the claim's ground cannot be reached`. |
| `external` | Resolve the locator against the **live** system of record (CRM / tickets / calendars / ledgers / official documents). Not a stop by itself and not a pass by itself. The check is yours — [verify.md](verify.md) mode 2 for this entry. |

## Absent, and truncated

| Situation | Do |
| --- | --- |
| `evaluated: false` | The product did not look. **Manual check**, never a pass. Say `not evaluated by the read (bound: <resolution_bound>)`. |
| Missing `state` key | **Not a pass.** Manual check. |
| `truncated: true` | Say `this read evaluated only <n> of <m> entries`. Another claim on the same page needs its own check. |
| Your `[@id]` is not in `entries` | Malformed; the entry did not survive parsing. **STOP.** Result: `malformed — no verdict exists for evidence \`<id>\`; the entry did not survive parsing`. |
| No `attestation` key | Manual check, never a pass. |
| Claim with no `[@id]` | Unlocated unless the prose names a resolvable artefact. Ask. See [verify.md](verify.md). |

## Page-relative span links are not a product bug

Page-relative span links resolve relative to the
citing page on the read path, the same way the viewer does. A `drifted`
verdict is about the cited span, not a whole-file projection bug. Do not
re-check a `drifted` row in order to proceed as `attested`.

## Never

- Never treat a missing `state`, a missing block, or a missing entry as
  `attested`. Absence is not a verdict.
- Never act on `drifted` or `unresolved` because the page "still looks
  right". The page looking right is the whole problem.
- Never downgrade `external` to "fine, it's just external".
- Never substitute a nearby artefact when the locator does not resolve.
