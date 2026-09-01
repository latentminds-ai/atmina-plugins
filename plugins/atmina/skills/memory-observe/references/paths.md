# Where Observe writes

One file per task, dated on the day it is written. The date in the path is
the observation date (`YYYY-MM-DD`). The slug is a short kebab-case name for
the task, not a dump of the prompt.

## Org (this pack's default)

```
chronicle/YYYY-MM-DD-<slug>.md
```

Example: `chronicle/2026-08-27-renewal-task.md`.

A directory card at `chronicle/README.md` may already exist. Never overwrite
it. Session notes are the dated files, not the card.

## Personal / single-agent

`journal/YYYY-MM-DD-<slug>.md`, or one durable file the operator already uses
as their working layer. Do not invent a second personal tree.

The in-product Atmina skill still documents `journal/` on its own surface.
This pack does not change that skill. Organisation working layer **here** is
`chronicle/`.

A task that spans midnight gets a new dated file. Do not append yesterday's
path.

## Never write here

| Path | Why |
| --- | --- |
| `wiki/` | Durable primitives. Observe never writes them. |
| `_consolidated/` | Compiled convenience. Not durable memory. On conflict, source wins. |
| `_sources/` | Source mirrors. Not durable memory. |
| `_staged/` | Unreviewed machine drafts. |

`list_files` with `path_prefix: "chronicle/"` (or `"journal/"`) before
creating. Confirm the exact path. A same-named file under another prefix is
a different file. Do not guess a wiki path because a chronicle file is
missing.

## Provenance, not a locator

The path you write is what a later durable write may put in `source:`. It is
not an in-KB locator. Chronicle and journal paths must not be taught as
something an evidence reader can resolve. Binding: `docs/agents/atmina-memory-evidence.md`
§8 and §11.
