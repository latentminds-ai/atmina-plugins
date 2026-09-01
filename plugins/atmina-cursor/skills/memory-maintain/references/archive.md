# Archive obsolete knowledge

Age is not deletion. Obsolete durable pages move; they are not erased.
`stale_after` is a review trigger, not an archive trigger — list those
in the trail for re-confirmation and do not move them for date alone.

## Destination

KB-root `archive/` — not `wiki/archive/`, not a `_` reserved prefix
(`_staged/`, `_sources/`, `_consolidated/`, `_pulse/`, `_system/`,
`_exports/` are refused).

`wiki/facts/acme-policy.md` → `archive/facts/acme-policy.md`

Keep the path under `wiki/` as the suffix, keep the extension. One file
per `move_file`. Bytes and `file_id` are unchanged; provenance stays in
the page.

```
move_file({ kb_id, file_id, to_path: "archive/facts/acme-policy.md" })
```

`file_id` comes from `read_file` / `list_files`. Do not guess it.

Do not `write_file` a copy. Do not delete.

## Skip the move and flag when cited as in-KB evidence

A path change would unresolve `wiki-page` locators. Markdown links may
follow a move; an evidence `path:` field does not.

Before each move:

1. Wiki-relative path of the candidate: `wiki/facts/acme-policy.md` →
   `facts/acme-policy.md`.
2. `list_files({ kb_id, path_prefix: "wiki/" })` — exhaustive. `search`
   is not exhaustive; do not treat a quiet search as "no citations."
3. For every other wiki page that might cite it, `read_file` and look
   for an evidence entry with `type: wiki-page` whose `path` is that
   wiki-relative path (no leading `wiki/`, no `..`).
4. **Any such entry** → skip the move, flag in the trail with the citing
   page and evidence `id`. A human re-points (claim-repair proposal) or
   applies a reviewed repair; this skill does not.
5. **Cannot finish the scan** → skip and flag. Fail closed.

A markdown link with no evidence entry is not, by itself, inbound
in-KB evidence for this skip. The skip exists to protect locators.

Do not archive `wiki/README.md` or `wiki/kb-profile.md` unless the
operator named that path. Do not archive `chronicle/` notes as
"obsolete truth" — they were never organisational truth.

## After a move

Record the old path, the new path, and `file_id` in the trail. Do not
rewrite live claim bodies to match.
