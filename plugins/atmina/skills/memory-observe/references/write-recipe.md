# Write recipe — working layer only

Tools this skill uses:

| Tool | When |
| --- | --- |
| `list_files` | Confirm the prefix and the exact path before writing. |
| `write_file` | One note. `create` if the path is new; `append` mid-task; `overwrite` with `if_match` to compact the session note. |
| `write_files` | Same shape, several working-layer files in one call. Each file still follows this recipe. |

Keep one `kb_id` for the whole procedure. Bytes go through these tools
directly — no staged payload, no intermediate file for later upload.

## Step 0 — Notable?

If nothing is worth indexing, stop. Report: "Nothing notable to Observe."
That is success.

## Step 1 — Path

Pick the path from [paths.md](paths.md). Org default:
`chronicle/YYYY-MM-DD-<slug>.md`.

`list_files({ kb_id, path_prefix: "chronicle/" })` (or `"journal/"`). Find
the exact path, or confirm it is absent. Never take a `wiki/` hit as a
substitute. Never overwrite `chronicle/README.md`.

## Step 2 — Create or append (mid-task)

New path:

```
write_file({
  kb_id,
  path: "chronicle/2026-08-27-renewal-task.md",
  mode: "create",
  content: "<candidate bullets or the session-note body>"
})
```

Existing path, mid-task candidate:

```
write_file({
  kb_id,
  path: "chronicle/2026-08-27-renewal-task.md",
  mode: "append",
  content: "<one or more candidate bullets>"
})
```

`create` fails if the path exists; then `append` instead. `append` is the
contention-free escape and does not require `if_match`.

## Step 3 — Compact the session note (task end)

The file should end as the index in [session-note.md](session-note.md), not
as a transcript of every append.

If the path is still absent: `create` with the full note.

If the path exists: read it, keep `sha256`, compose the compact note, then

```
write_file({
  kb_id,
  path: "chronicle/2026-08-27-renewal-task.md",
  mode: "overwrite",
  if_match: "<that sha256>",
  content: "<the compact session note>"
})
```

`[conflict]` means someone wrote between the read and the write: re-read,
re-compose against the new content, retry with `if_match`. Never retry the
same bytes and never drop `if_match` on overwrite.

## Step 4 — Report

The path written, or that the write was a no-op. Do not claim the note is
organisational truth. Do not claim a later durable write happened.

## Refusals

- A path under `wiki/`, `_consolidated/`, `_sources/`, or `_staged/` — refuse.
- An `evidence:` block on the working-layer note — strip it; this skill
  does not record typed evidence.
- A request to treat gathering or a brief as a Commit — write the working
  layer at most, or no-op.
