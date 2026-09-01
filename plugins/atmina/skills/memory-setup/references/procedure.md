# memory-setup procedure

Do the steps in order. Keep one `kb_id` for the whole run.

Seed bytes live at `docs/agents/atmina-memory-template/`.
Each live-KB path below is written with **those exact contents**. The fixture
and the Knowledge Base must match.

Tools: `whoami`, `list_kbs`, `get_context`, `write_file` / `write_files` with
`if_match` on overwrite, `generate_nav`, `update_kb`, `list_files`.

## 1. Orient

1. `whoami` — identity, current team, role.
2. `list_kbs` — pick the Knowledge Base the operator named. Copy its `kb_id`
   (the qualified `team-slug/kb-slug`, or the UUID). Note the caller's **role
   on that Knowledge Base**. Owning-team `admin` is required for step 8;
   editor is enough for writes and `generate_nav`.
3. `get_context` on that Knowledge Base — lay of the land. Do not treat
   compiled views or working notes as a reason to skip the seed.

If the operator did not name a Knowledge Base, stop and ask. Do not guess.

## 2. Inventory

```
list_files({ kb_id, path_prefix: "wiki/" })
list_files({ kb_id, path_prefix: "wiki/meta/" })
list_files({ kb_id, path_prefix: "chronicle/" })
```

Record every live path. A path that does not appear does not exist — there
are no empty folders. Later creates use `mode: "create"`.

Look specifically for:

- `wiki/meta/kb-profile.yaml`
- `wiki/meta/kb-profile.md`
- `wiki/kb-profile.md`
- `wiki/README.md`
- `wiki/nav.yaml`
- the seven directory cards listed in step 3

## 3. Directory cards — never empty folders

`generate_nav` only emits a section for an immediate child of `wiki/` that
already contains a markdown file. Creating a folder path is not a write.

Create each **missing** card with `write_file` `mode: "create"` (or one
`write_files` batch of new paths). Bytes come from the fixture:

| Live path | Fixture |
| --- | --- |
| `wiki/decisions/README.md` | `docs/agents/atmina-memory-template/wiki/decisions/README.md` |
| `wiki/procedures/README.md` | `docs/agents/atmina-memory-template/wiki/procedures/README.md` |
| `wiki/facts/README.md` | `docs/agents/atmina-memory-template/wiki/facts/README.md` |
| `wiki/preferences/README.md` | `docs/agents/atmina-memory-template/wiki/preferences/README.md` |
| `wiki/relationships/README.md` | `docs/agents/atmina-memory-template/wiki/relationships/README.md` |
| `wiki/open-questions/README.md` | `docs/agents/atmina-memory-template/wiki/open-questions/README.md` |
| `chronicle/README.md` | `docs/agents/atmina-memory-template/chronicle/README.md` |

Each card is `schema: 1` (integer), `title` matching the first body H1,
`summary`, **no `evidence:` block**. The body names the primitive (Chronicle:
the working layer) and says the folder is empty until the first Commit
(Chronicle: until Observe). Cards are not permission to act.

If a path already exists: **skip**. Do not `overwrite` without an explicit
operator yes. Report the skip.

## 4. Home page

If `wiki/README.md` is missing, create it from
`docs/agents/atmina-memory-template/wiki/README.md`.

If it exists: skip. Never overwrite durable prose without an operator yes.

## 5. kb-profile at wiki root, not under meta

**New seed.** Create `wiki/kb-profile.md` from
`docs/agents/atmina-memory-template/wiki/kb-profile.md`. Intensity default
is **middle**. Scope and the primitive map live on that page. It is not a
type registry.

**Existing meta profile.** If `wiki/meta/kb-profile.yaml` or
`wiki/meta/kb-profile.md` is already in the inventory:

- skip writing `wiki/kb-profile.md`
- **report the existing path loudly**
- do not overwrite the meta file
- do not also write the wiki-root path

A markdown file under `wiki/meta/` lights a generated Meta Menu section.
That is why new seeds never write there.

If `wiki/kb-profile.md` already exists and no meta profile does: skip the
wiki-root file (same overwrite rule).

## 6. Schema-2 Start here

The hand-curated section is first. It has **no** `generated:` marker.
`generate_nav` will never author it.

Desired shape when the wiki-root profile was written (or already exists at
`wiki/kb-profile.md`):

```yaml
schema: 2
sections:
  - label: Start here
    pages:
      - wiki/README.md
      - wiki/kb-profile.md
```

If step 5 skipped the wiki-root profile, omit `wiki/kb-profile.md` from
Start here (do not point at a page that was not written). Still create or
insert Start here with `wiki/README.md`.

### New manifest

If `wiki/nav.yaml` is missing, create it from
`docs/agents/atmina-memory-template/wiki/nav.yaml`, dropping
`wiki/kb-profile.md` from `pages` when that file was not written.

### Existing manifest — insert missing Start here at the top

Read `wiki/nav.yaml`. Keep generated sections byte-stable aside from the
insert.

- If a section labelled `Start here` is **missing**: insert it as the first
  `sections` entry. Do not rewrite other sections. If `schema` is `1`, bump
  it to `2` as part of that write (flat sections stay valid in schema 2; do
  not convert neighbourhood labels). `overwrite` with `if_match` set to the
  `sha256` from the read.
- If Start here already exists: leave the manifest alone. Do not move it.
  Do not restyle generated sections.

Never `overwrite` the manifest to "tidy" it. The only authorised mutation
without an operator yes is inserting a missing Start here (and the schema
bump that insert requires).

## 7. generate_nav — preview, then apply

Only after the directory cards exist **and** Start here exists.

Default preview writes nothing:

```
generate_nav({ kb_id, path_prefix: "wiki/", operation: "preview" })
```

Inspect `content`, `sections_added`, `sections_replaced`,
`sections_removed`, `sections_kept`. Start here must still be first and
must still have no `generated:` marker. If preview would strip Start here
or remove sections the operator did not ask to drop, **do not apply** —
report and stop.

Then:

```
generate_nav({ kb_id, path_prefix: "wiki/", operation: "apply", if_match: "<current_etag>" })
```

Files directly under `wiki/` stay out of generated sections. Primitive
folders that now have a card light as generated sections. Chronicle is
outside `wiki/` and is not a generated Menu section.

Re-sync is explicit. Do not apply on a loop.

## 8. Pointer registry — loud skip when not admin

`applies_to` Wave 0 encoding: **one scalar string per durable page**,
registered at `/applies_to` type `string`. A list in frontmatter would
reject the write once registered as string. Multiple artefact keys are out
of scope.

`stale_after` is an absolute date. Register `/stale_after` type `datetime`
in the same `update_kb` call.

`update_kb` is owning-team **admin** (share-grant admin cannot change
projection policy).

If the caller's role on this Knowledge Base is not owning-team admin:

```
SKIP — pointer registry not written.
KB: <kb_id>
Caller role: <role from list_kbs>
Needed: owning-team admin
Not doing: update_kb queryable_frontmatter_fields
Layout seed: continuing (cards, Start here, generate_nav are independent)
To register later: an owning-team admin re-runs this step
```

That skip is **not** a failed seed. Continue and include the note in the
final report.

If the caller is owning-team admin, read the current
`queryable_frontmatter_fields` from `list_kbs` / the Knowledge Base
descriptor. Merge (do not drop existing pointers):

```
update_kb({
  kb_id,
  queryable_frontmatter_fields: [
    // existing pointers unchanged,
    { path: "/applies_to", type: "string" },
    { path: "/stale_after", type: "datetime" }
  ]
})
```

Skip a pointer that is already registered at that path with that type.
If it is registered as a different type, **stop and report** — do not
change a live type without an operator yes.

After the call, report `query_projection_state` and
`query_projection_version`. Custom pointer filters are honest only while
projection is `ready`. **`rebuilding` is not "no matches"** — say the
projection is rebuilding and that `/applies_to` `eq` must wait.

This seed does not write `applies_to` onto the directory cards.

## 9. Report

Say, in this shape:

```
memory-setup on <kb_id>
Created: <paths>
Skipped (already present): <paths>
Skipped kb-profile: existing <wiki/meta/kb-profile.yaml|wiki/meta/kb-profile.md>
Start here: created | inserted at top (schema bumped 1→2 | already schema 2) | already present
generate_nav preview: added=N replaced=N removed=N kept=N
generate_nav apply: <etag> | not applied because <reason>
Pointer registry: written /applies_to string + /stale_after datetime, projection=<state>@v<n>
  | SKIP — not owning-team admin (see note)
Not seeded: evidence-type registry; wiki/meta/; concepts/ architecture/ guides/ as required tree
```

## Forbidden in this skill

- Describing this Knowledge Base as a source-control project, or pinning
  claims with source-control hashes. Systems of record are CRM rows, tickets,
  calendars, and ledgers.
- `concepts/`, `architecture/`, or `guides/` as the required tree.
  `decisions/` is a primitive here, not an imported neighbourhood.
- An evidence-type registry file.
- Registering `/applies_to` as a list or array.
- Teaching `journal/` as the organisation working layer. Organisation seed
  uses `chronicle/`.
- Overwriting durable prose, or a README that already exists, without an
  explicit operator yes.
- Failing the seed because the registry step was skipped.
