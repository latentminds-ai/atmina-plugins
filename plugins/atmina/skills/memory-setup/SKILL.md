---
name: memory-setup
description: Seeds an organisation Knowledge Base with the atmina-memory layout — directory-card pages for the six durable primitives, a Chronicle working-layer card, a wiki home, a kb-profile at wiki root (intensity default middle), and a schema-2 wiki/nav.yaml whose first section is a hand-curated Start here. Registers applies_to as a scalar string pointer when the caller is owning-team admin. Use when standing up a new organisational wiki, seeding an empty Knowledge Base for the atmina-memory pack, or inserting a missing Start here section without overwriting durable pages.
license: Apache-2.0
compatibility: Requires Atmina MCP tools whoami, list_kbs, get_context, write_file, write_files, generate_nav, update_kb, and list_files. The final binding step also needs local file reads and writes plus git rev-parse, and is skipped loudly when those are unavailable.
metadata:
  pack: atmina-memory
allowed-tools: whoami list_kbs get_context write_file write_files generate_nav update_kb list_files Read Write Edit Bash(git rev-parse *)
---

# Memory setup: seed the organisation layout once

This skill stands up the atmina-memory layout on one Knowledge Base. It writes
directory cards, not empty folders. It does not Recall, Observe, Commit, or
Maintain. Typed evidence lives in later skills; this seed is not permission
to act.

**Announce at start:** "I'm using the memory-setup skill to seed this Knowledge Base."

## When it fires

Once per Knowledge Base, when the operator asks to seed organisational memory,
or when Start here is missing from an existing manifest. Not mid-task. Not
when the six primitive cards and Chronicle already exist unless the operator
asked to repair Start here.

## Do this, in order

Follow [references/procedure.md](references/procedure.md). Seed bytes are
[docs/agents/atmina-memory-template/](../../docs/agents/atmina-memory-template/)
— write those paths with those contents. They must match.

1. Orient: `whoami`, `list_kbs`, `get_context`. Keep one `kb_id`.
2. Inventory: `list_files` over `wiki/`, `wiki/meta/`, and `chronicle/`.
3. Directory cards: create each missing `README.md` under the six primitive
   folders plus `chronicle/README.md`. Never `overwrite` durable prose without
   an explicit operator yes.
4. Home: create `wiki/README.md` if missing.
5. Profile: create `wiki/kb-profile.md` (wiki root, not `wiki/meta/`). If
   `wiki/meta/kb-profile.yaml` or `wiki/meta/kb-profile.md` already exists,
   skip, report that path, and do not also write the new path.
6. Manifest: ensure schema-2 `wiki/nav.yaml` with **Start here** first
   (`wiki/README.md`, then `wiki/kb-profile.md` when that file was written).
   Insert a missing Start here at the top of an existing manifest; bump
   schema 1 → 2 when inserting. Do not rewrite generated sections.
7. After the cards and Start here exist: `generate_nav` **preview**, then
   `apply`, `path_prefix: "wiki/"`.
8. Pointers: owning-team **admin** registers `/applies_to` type `string` and
   `/stale_after` type `datetime` via `update_kb`. A non-admin skip is **loud,
   not fatal**. `applies_to` is one scalar string per durable page, never a
   list.
9. Bind the repository, when the operator is working in one. Follow
   [references/repository-binding.md](references/repository-binding.md): write
   `.atmina.yaml` at the git toplevel and one marked block in the root agent
   instructions, so a seeded Knowledge Base is one a session can find. **Show
   the complete diff and get an explicit yes before writing, and never stage or
   commit anything.** Not in a git repository, or already bound to this
   Knowledge Base? Report and skip — loud, not fatal.

## Never

- Seed an evidence-type registry, `wiki/meta/`, or `concepts/` /
  `architecture/` / `guides/` as the required tree.
- Describe this Knowledge Base as a source-control project, or pin claims
  with source-control hashes. Systems of record are CRM rows, tickets,
  calendars, and ledgers.
- Fail the whole seed because the pointer registry was skipped.
- Treat projection `rebuilding` as "no matches".
- Write a binding without showing the diff first, write a second marked block
  when one is already there, re-point a repository already bound to a different
  Knowledge Base, or stage or commit anything at all.

## Report

Every path created, skipped, or refused; the existing meta-profile path if
any; Start here inserted or already present; `generate_nav` preview counts
then apply; registry written or the loud non-admin skip; projection state.
