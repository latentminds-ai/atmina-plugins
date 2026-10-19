# Applies-to match — exhaustive `list_files`, not `search`

Step 2 of recall. `list_files` is exhaustive over the catalog;
`search` filters only a relevance-candidate window and reports
`coverage: "relevance_candidates"`, `exhaustive: false`. Applies-to is a
deterministic match. Implementing it as `search` with a filter is a bug.

Wave 0 encoding is **one scalar string** per durable page. Array traversal
is not supported. Do not send a list as `value`.

## The call

When the task names an artifact key (a client slug, a record id, a document
name, a procedure key):

```
list_files({
  kb_id: "<this KB>",
  path_prefix: "wiki/",
  filters: [{ field: "/applies_to", op: "eq", value: "<the key, a string>" }],
  limit: 5
})
```

Read at most a handful. Cite the paths you use.

Do **not** add `/applies_to` to a `search` `filters` array and call that the
applies-to step.

## When the pointer cannot run — say so, then fall through

A custom pointer clause is honest only while `/applies_to` is registered
**and** the KB's query projection is `ready`. A registry write is a
projection attempt, not an instant ready.

| What the tool returns | What you say | What you do **not** say |
| --- | --- | --- |
| Error: `/applies_to` is not a registered pointer | `/applies_to` is **unregistered** on this KB; applies-to did not run | "no matches" |
| Error: `query projection is not ready (state …)` | Projection is **not ready**; applies-to did not run | "no matches" |
| Success, zero rows | No durable page currently carries this `applies_to` key | that the filter failed |
| Success, some rows | Cite them, then continue to durable search and verify | that they are already verified |

Empty success is a real answer (nothing tagged with that key). An error is
**not** an empty answer. Fall through to step 3 in every error case; do not
pretend the filter ran.

Built-in `list_files` filters (`event_date`, `created_at`, `updated_at`,
`mime_type`) do not require the registry. `/applies_to` does.

## Scalar string only

`value` is a string. One primary artifact key per durable page. Do not pass
an array, do not OR several keys in one clause, do not invent a list-valued
`/applies_to`. If the task names two keys, run two `list_files` calls (or
one per key) — still `eq` against a string — and union the paths yourself.
