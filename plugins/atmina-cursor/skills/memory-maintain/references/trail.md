# Maintain trail

Write a short trail so the pass is auditable. Working layer, not
organisational truth. Do not Commit the trail. Do not put typed evidence
on it.

## Path

Prefer `chronicle/YYYY-MM-DD-maintain-report.md`. A maintain-report
folder under chronicle is also allowed:
`chronicle/maintain-report/YYYY-MM-DD.md`. Use `write_file` `create`. If
the path exists, pick a distinct slug (`…-maintain-report-2.md`) rather
than overwriting.

This is the only Maintain `write_file` besides nothing. It is not a live
claim rewrite. Do not write `_staged/`.

## What to record

Keep it short. For this run, list:

- **Merged (proposed)** — same-intent duplicates, which page to keep,
  which to retire. Confirmed kept over inferred.
- **Refused as inferred** — inferred that was not auto-picked over
  confirmed.
- **Contradictions flagged** — the two (or more) durable lines.
- **Repairs proposed** — citing page, evidence `id`, current span,
  proposed `#Ln-Lm` and `pinned_version` when exact bytes matched at a
  new offset.
- **Repairs flagged** — no unique exact match; unresolved; pruned pin;
  would have required rewording.
- **`stale_after` listed** — page, date, still confirmed. Not deleted.
- **Archived** — old path → `archive/…`, `file_id`.
- **Archive skipped** — page still cited as in-KB evidence, with citing
  `[@id]`.
- **Linkify proposed** — page, bare mention, suggested markdown link.
- **Health** — durable pages never recalled; broken references and
  unconnected pages, each with the scope it covered; and what the pass did
  not check. [health.md](health.md). Record it even when there is nothing
  to report; an omitted line reads as a pass that did not look, and a
  count without its scope reads as covering more than it does.

No-op (nothing to propose, nothing to move) is success. Write a trail
that says so.

## After write

`read_file` the trail back. Report its path and `version_n` to the
operator. The human applies proposals; this skill does not.
