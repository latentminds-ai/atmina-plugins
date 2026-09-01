---
name: memory-observe
description: Records working-layer notes and end-of-task session notes in an Atmina Knowledge Base so candidates stay out of organisational truth. Org default is chronicle/YYYY-MM-DD-<slug>.md; personal or single-agent scope may use journal/ or one durable file; never writes wiki/, compiled views, or source mirrors. A session note is an index of the task, what was gathered, what was decided, and wiki paths and system-of-record locators — not a transcript. Gathering sources is not a durable write. Nothing notable is a successful no-op. Use when mid-task candidates or a session note need to land in the working layer, or when an agent would otherwise save a brief, finding, or transcript into the wiki.
metadata:
  pack: atmina-memory
---

# Observe: write the working layer, never the wiki

Working notes are candidates. They are not organisational truth. This skill
writes them only to the working layer, and only when something is worth
indexing. It never writes the wiki, never writes typed evidence, and never
treats a gathered brief as a durable record.

**Announce at start:** "I'm using the memory-observe skill to write this
working-layer note."

## When it fires

- Mid-task, a candidate, finding, or brief that must not be read as committed
  truth.
- Task end, when something notable happened: a decision, an open question, a
  path or locator worth finding again.
- Any moment an agent would otherwise save a session note, transcript, or
  gathered brief under `wiki/`.

If nothing notable was learned, **do not write**. No-op is success. Say so.

## The rule

1. **Working layer only.** Org default is
   `chronicle/YYYY-MM-DD-<slug>.md`. Personal or single-agent scope may use
   `journal/` or one durable file. Exact paths:
   [references/paths.md](references/paths.md).
2. **Mid-task: append candidates** to that file so they cannot be injected as
   truth. Selecting sources or finishing a gather is Observe at most; it is
   **not** a Commit.
3. **Task end: one session note** — the task, what was gathered, what was
   decided, wiki paths and system-of-record locators. The note is an **index**,
   not a transcript. Shape:
   [references/session-note.md](references/session-note.md).
4. **No typed evidence** on working-layer notes. A later durable write may set
   `source:` to this path. That path is provenance, not an in-KB locator —
   `docs/agents/atmina-memory-evidence.md` §8 and §11 (G5). Do not teach
   chronicle paths as something the evidence reader can resolve.
5. **Write with shipped tools.** `list_files`, then `write_file` /
   `write_files` with `if_match` on overwrite. Recipe:
   [references/write-recipe.md](references/write-recipe.md).

## What this skill does not

- It does **not** write `wiki/`, `_consolidated/`, `_sources/`, or `_staged/`.
- It does **not** mint organisational truth. Gathering is not a Commit.
- It does **not** retarget the in-product Atmina skill that still documents
  `journal/` for its own surface. Org working layer **in this pack** is
  `chronicle/`.
- It does **not** pin, repair, or verify claims. It does not write a catalogue
  of evidence types.
