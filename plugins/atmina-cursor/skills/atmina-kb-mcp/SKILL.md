---
name: atmina-kb-mcp
description: Use when connected to the Atmina MCP server — your shared memory. Recall (search) before answering from training; capture decisions/findings; update existing memory; consolidate a KB's memory into a reviewed current-state view. Covers orientation, file writes/uploads, search, audit, and the run→review→promote routine loop.
---

# Atmina — your memory

*Memory, Shared. Total Recall.*

Atmina is where you keep the thoughts, decisions, and findings worth surviving
the next prompt. You forget between sessions and your context window thins
within one; Atmina is the durable store. This skill is the workflow guide — the
MCP server's own tool descriptors, its auto-injected server instructions, and
the `atmina://docs/agent-quickstart` resource are canonical. When this skill and
the live surface disagree, the live surface wins.

> The server splices its operating model into your system prompt at
> `initialize` time (the recall / capture / update / consolidate reflexes and
> the memory-trust rules). Read `atmina://docs/agent-quickstart` for the full
> operator's manual — chains, error catalog, tool & resource index.

## Orient once per session

1. `health` — server build + whether your team's AI Search instance is
   provisioned. A `[provisioning]` result means retry shortly / surface to the
   user.
2. `whoami` — identity, current team, role.
3. `list_kbs` (or read `atmina://my-kbs`) — the memory surfaces you can access.
   Copy the **`Ref`** column (the qualified `team-slug/kb-slug`) as the `kb_id`
   argument on KB-scoped tools. The `kb_id` UUID is the canonical form; a bare
   slug works only while it resolves to exactly one accessible KB.

On `POST /mcp/kb/{kb_id}` the URL pins the KB — omit KB selection from
arguments. On `POST /mcp` (bearer endpoint), KB-scoped tools take `kb_id`
unless you have exactly one accessible KB (auto-resolves).

## The four reflexes

| Reflex | When | Chain |
| --- | --- | --- |
| **Recall** | You'd otherwise answer from training, or the user implies a known fact (*"what did we decide"*, *"recall…"*, *"our take on…"*) | `search` (default discovery path) → answer from snippets; `read_file` the top `read_ref` only for authoritative detail |
| **Capture** | Save a thought / decision / finding (*"save this"*, *"for the record"*, *"decision:"*) — or a session note at a natural session end (offer first) → `journal/YYYY-MM-DD-<slug>.md` | `write_file` (single) / `write_files` (bulk, ≤50, inlined) with `expected_bytes` + `content_sha256` → `get_file_outline` to verify |
| **Update** | Edit existing memory (*"update the doc"*, *"correct X"*) | `get_file_outline` (etag) → `read_file` → `write_file(if_match)` → on `[conflict]` re-read, **re-draft** against the new content, retry with a little **jitter** (never blind-retry the same bytes or drop `if_match`) |
| **Consolidate** | Compile / refresh a KB's memory into one reviewed current-state view (*"consolidate this memory"*, *"refresh the current state"*) | `run_routine` → `get_routine_run` (poll) → `read_file` staged `report.md` + `proposed-current-state.md` → `promote_artifact` (admin) |

### Cite exact source spans

When authoring same-KB Markdown, use an ordinary link:

```markdown
[Pale evidence](archive/original/gardens-of-the-moon/book-01-pale.md#L1666-L1702)
```

The canonical shape is `[label](path.md#Lstart-Lend)`. `start` and `end` are
positive, 1-based, inclusive line numbers in the stored UTF-8 text body,
including YAML frontmatter. Use `#L1666` for one line. The citation follows
normal same-KB path resolution and addresses the current file head only.

### Session notes (`journal/`)

At a natural end of a working session — a decision reached, a task wrapped, the
user signing off — offer to capture a short session note; write only on a yes.
It lands at `journal/YYYY-MM-DD-<slug>.md` (the leading date becomes the
memory's `event_date`). Keep it compact — decisions, findings, open questions,
refs; a screen, not a transcript. `journal/` is ordinary, searchable memory:
the whole-KB current-state routine consolidates it automatically, so the
journal is the raw layer and the compiled view is its distillation.

### Transport discipline (non-negotiable)

**All bytes destined for Atmina arrive via MCP write tools — directly.** Never
stage payloads in `/tmp`, never emit a sync script, never write intermediate
JSON for later upload. Pass content inline through `write_file` / `write_files`,
or PUT to the presigned URLs `request_uploads` mints (the one sanctioned
shell-HTTP path, closed by `confirm_uploads`). The shell is for inspecting
*local source* files only.

## Typed filters: `list_files` is exhaustive, `search` is not

`search` and `list_files` share one filter grammar: AND-combined
`{ field, op, value }` clauses. `field` is either a **built-in** — `event_date`
(RFC 3339 datetime), `created_at` / `updated_at` (epoch-millisecond numbers), or
`mime_type` (exact string) — or a **registered pointer**, a non-root RFC 6901
JSON Pointer into the file's YAML frontmatter (`/release/stage`; escape `~` as
`~0` and `/` as `~1`). Each pointer declares one scalar type: `string` and
`boolean` take `eq` / `ne`; `number` and `datetime` add `gt` / `gte` / `lt` /
`lte`. Values are never coerced, and a missing value fails every predicate —
including `ne`.

**Coverage is the part that changes what you do.** `list_files` applies path
scope and every predicate to the KB's complete active catalog, so it is
exhaustive. `search` applies the same predicates authoritatively against
current-head rows, but only over that query's relevance candidates: it reports
`coverage: "relevance_candidates"` and `exhaustive: false`, and matches outside
that window are not returned. **When you need every match, a count, or an
audit, reach for `list_files`, not `search`.**

A filtered `search` resolves those candidates through at most **4 knowledge
bases**. The bound is on where the candidates land rather than on the scope you
asked for, so a wide unscoped search keeps working until relevance actually
spreads past four KBs — at which point it fails closed with `[conflict]`
instead of answering from part of the set. Select at most four KBs with
`kb_ids`, or filter one KB at a time.

Before using a pointer filter, read the KB's descriptor on `list_kbs` or
`atmina://kb/{kb_id}`: `queryable_frontmatter_fields` plus
`query_projection_version` and `query_projection_state`. A pointer clause needs
that state to be `ready`; while it is `rebuilding` or `error` only built-ins
run. Across several KBs, a pointer must be registered with the same type on
every selected KB.

Registering pointers is `update_kb` with `queryable_frontmatter_fields`,
**owning-team admin only** (a share-grant admin cannot). The rebuild is
synchronous. If it fails, the state is `error` and the usual cause is an
existing file whose frontmatter holds the wrong declared type — fix that file
and **resubmit the identical registry**, which retries the same version rather
than starting a new one. Pointer names are your KB's own information
architecture; Atmina owns only the four built-ins.

## Folder hub indexes for multi-phase extracts

Keep index maintenance separate from recall, capture, and consolidation. After
one bulk write/upload-confirmation phase:

1. Call `generate_hub_index` with the default `preview` operation; it writes
   nothing.
2. Inspect the exact returned `content` and all generated relative paths.
3. Call again with explicit `operation: "apply"`; optionally pin the inspected
   current etag with `if_match`.
4. Explicitly regenerate after later add, delete, or move phases.

The tool selects paths from one live catalog snapshot and does not read
candidate file bodies. Apply replaces only one inclusive managed block and
preserves authored bytes outside it. The result is a snapshot at generation,
not automatic, background, or permanently live navigation. Ambiguous or
malformed markers fail closed; repair the markers manually, preview again, and
only then apply.

`sort` defaults to `{ kind: "alpha" }` (title, NFKC-collated). Pass
`{ kind: "frontmatter", field, order? }` to order entries by a registered
queryable-frontmatter pointer instead — `field` must already be registered on
the KB (see the pointer-filter guidance above), or the call fails closed with
`[validation]`: pick a registered pointer, or register it first via
`update_kb`. The KB's query projection must also be `ready` at its exact
current version, or the call fails closed with `[conflict]`. Entries whose
frontmatter is missing that field always sort last (alpha-asc among
themselves), in both `asc` and `desc` order. If the projection is `error` or
its version has drifted, the usual recovery is the same as for pointer
filters: fix the offending file's frontmatter and resubmit the identical
registry via `update_kb`, which retries the same version instead of starting
a new one. A single stored file whose projection value is corrupt or
version-drifted fails the entire generation — the index is never built
partially.

## Generating a Menu from folders (`generate_nav`)

`generate_nav` builds `wiki/nav.yaml` Menu sections from the KB's folder
layout — one section per immediate child folder under `path_prefix` (default
`wiki/`), listing every eligible Markdown file recursively beneath it. Files
sitting directly under `path_prefix` (e.g. `wiki/README.md`) belong to no
child folder and are deliberately left alone for a hand-curated section such
as "Start here".

1. Call `generate_nav` with the default `preview` operation; it writes
   nothing. Inspect the returned `content` and the `sections_added` /
   `sections_replaced` / `sections_removed` / `sections_kept` counts.
2. Call again with explicit `operation: "apply"`; optionally pin the inspected
   `current_etag` with `if_match`.
3. Re-sync explicitly after later add, delete, or move phases — the manifest
   is a snapshot at generation, not automatic, background, or live.

**The preservation boundary.** A sync only ever touches sections it owns (a
`generated:` marker naming a folder inside `path_prefix`); every hand-curated
section, its comments, and the overall section ordering survive untouched.
The one real loss: comments written **inside** a generator-owned section — on
the label line, above `pages:`, above or beside a page entry — are replaced
along with the section body on the next sync. Only the comment directly
**above** a generated section survives. Keep notes above a generated section,
not within it. If a sync's plan is empty for a given `path_prefix` (no
eligible folders left), it removes every section it previously owned there —
check `sections_removed` in preview before applying if that matters.

**Labels come from the live catalog, not the manifest.** Generated `pages`
entries are bare paths with no `label` key, so the client resolves each
page's display name from the catalog at render time — retitling a page needs
no re-sync. Section labels ARE generator-authored (folder name → title case).

**Grouping.** Pass `group_by: { field }` with a pointer already registered via
`update_kb` (see the pointer-filter guidance above) to sub-group each
section's pages by that frontmatter value. Requires the KB's query projection
`ready` at its exact current version, same as `generate_hub_index`'s
frontmatter sort — otherwise the call fails closed with `[conflict]`. Pages
with no value for the pointer are bucketed last in an "Ungrouped" group.

**Fail-closed repair.** A manifest the generator cannot model — an unknown
`schema`, YAML anchors/aliases, unparseable YAML, or two generated sections
claiming the same folder — makes the sync refuse rather than guess. Repair the
manifest by hand, preview again, and only then apply.

**Large KBs (100+ pages).** Sync once after finishing a bulk extract phase,
not per file. Keep a hand-curated "Start here" section at the top of the
manifest — it is never touched by a sync. Reach for `group_by` once a single
folder's section would otherwise exceed roughly 30 pages. Re-sync after any
later add, delete, or move phase, since the manifest is a point-in-time
snapshot rather than a live view.

## Live tool surface

**Orientation:** `whoami`, `health`

**Recall & read:** `search` (the default discovery path — file-grouped results
with snippets + a `read_ref`), `read_file`, `list_files`, `get_file_outline`,
`related` (a memory's linked memories — what it links to, what links to it,
and the references with no live file behind them; `depth: 2` reaches one
memory further, `type` narrows to a registered frontmatter `type`),
`get_context` (KB orientation — `state`/`pulse` by default; opt-in `actions`,
`source_snapshot`, and `link_health` for a self-audit of broken references /
unconnected memories / hubs before you consolidate)

**Capture & write:** `write_file`, `write_files` (text, path-addressed);
`request_uploads` → `confirm_uploads` (presigned bulk / binary / >1 MiB);
`upload_file`, `update_file` (binary, base64, ≤1 MiB)

**Index maintenance:** `generate_hub_index` (default no-write preview, explicit
apply, regenerate after later catalog changes), `generate_nav` (same
preview/apply loop; generates `wiki/nav.yaml` Menu sections from folders,
preserving hand-curated sections)

**Version history & rollback:** every head-changing write returns its `version_n`
(last ~20 kept per file); `file_history` (viewer) lists a file's versions,
`read_file(version: n)` reads a prior version, `restore_version` (editor) rolls
the head back as a new attributed write (history is never rewritten)

**Admin:** `create_kb`, `update_kb`, `delete_kb`, `delete_file` (destructive —
confirm with the user first); `audit_log`, `get_audit_event`,
`get_team_settings`, `update_team_settings`

**Memory routines (consolidation):** `list_routines` (viewer), `run_routine`
(editor), `list_routine_runs` (viewer), `get_routine_run` (viewer),
`promote_artifact` (admin)

**Chaining `related` for multi-hop exploration.** One call walks at most two
hops from wherever it's anchored. To go further — say, character → faction →
event → archive — chain calls: anchor the next call at a neighbour from the
previous call's `Linked memories` / `Linked from` list, one hop at a time.
References with no live file behind them still surface in every call; they're
honest dangles, not something to chase.

Text vs binary: plain UTF-8 (markdown, `.txt`, `.csv`, `.json`, `.yaml`) →
**always** `write_file` / `write_files`. Binary (PDF, images, audio) →
`upload_file` / `request_uploads`. Never use `upload_file` to dodge path syntax.

## Memory routines: the run → review → promote loop

A KB can keep a **compiled current-state view of its own memory** — one reviewed
summary the team can recall in a single shot. It's produced by a *memory
routine*: a background consolidation job that reads the KB's source files, asks
the model to compile them, and **stages** a draft for a human to review.

The trust spine — internalise it before touching a routine:

1. **Compiled views (`_consolidated/`) cite their sources.** A promoted
   `current-state.md` is a convenience summary, not ground truth.
2. **On conflict, the source files win.** When a compiled view disagrees with a
   source file, `read_file` the cited source and prefer it.
3. **Staged outputs (`_staged/`) are unreviewed machine drafts.** `read_file`
   them only when reviewing a run; never treat them as authoritative or cite
   them as memory. They're hard-excluded from `search`.

The loop:

1. **Run.** `run_routine` (editor+). Async-always — returns
   `{ run_id, status: "queued" }`. Short-circuits to outcome `no_op` when
   nothing changed; pass `force: true` to override.
2. **Poll.** `get_routine_run(run_id)` until `status` is `completed`. `status`
   (lifecycle) and `outcome` (verdict: succeeded/no_op/needs_review/partial/
   failed) are recorded independently — a `completed` run can be
   `needs_review` (model refused, malformed output, or out-of-snapshot
   citation). Don't promote `needs_review` blind.
3. **Review.** `read_file` the staged artifacts from `output_paths` (under
   `_staged/<date>/<run_id>/`). Read **`report.md` first** — it has a
   `## Sources used` section and a `## What changed vs current compiled state`
   delta — then `proposed-current-state.md`, the draft itself. Review them like
   a PR, not like memory.
4. **Promote (admin).** `promote_artifact(run_id)` — owning-team admin only,
   after reading `report.md`. Copies `proposed-current-state.md` into
   `_consolidated/current-state.md`, re-verifies the staged sha, writes with an
   etag guard. Re-promoting a current run is a no-op.

There is **no edit-then-promote.** To refine an almost-right draft, adjust the
routine's `instructions` (REST-only, owning-team admin) → `run_routine` again
(cents) → review → promote. `search` labels `_consolidated/` chunks
`compiled: true` + `stale`; a `stale` label is the signal to re-run the loop.

## Resources (read-only mirrors)

- `atmina://docs/agent-quickstart` — the full operator's manual.
- `atmina://my-kbs` — accessible KBs (same columns as `list_kbs`).
- `atmina://my-team` / `atmina://my-team-status` — team metadata + indexing.
- `atmina://kb/{kb_id}` / `…/files` / `…/files/{file_id}` /
  `…/indexing-status` / `…/audit` / `…/write-guide` — per-KB reads.
- `atmina://status` — anonymous build metadata.

## Not on the MCP surface

- **Sharing & membership** (`share_kb`, `invite_to_kb`, `revoke_share`) is
  **deprecated on MCP** and moving to Dashboard-only. Do not build agent flows
  around these; manage shares from the Dashboard.
- **Routine config CRUD** (create/enable/edit a routine's `instructions` and
  schedule) is **REST-only**, owning-team admin (`/api/v1/kbs/:kbId/routines`).
  The MCP surface runs, reviews, and promotes routines; it does not configure
  them.
