# The pin recipe, step by step

Read this when you are about to write a durable claim. Every step names the
exact tool call and the exact bytes. Do the steps in order; each later step
assumes the earlier ones.

Type and pin authority is
[`docs/agents/atmina-memory-evidence.md`](../../../docs/agents/atmina-memory-evidence.md)
(W0-1). This recipe **imports** that binding. It does not re-define the
taught catalogue and does not invent a second hash.

Tools used, with the arguments they take:

| Tool | Arguments | Returns what you need |
| --- | --- | --- |
| `file_history` | `kb_id`, and `path` or `file_id` (`path` wins) | `head_version`, `keep_last`, `oldest_retained`, `versions[]` each with `version_n`, `sha256`, `is_current` |
| `read_file` | `kb_id`, and `path` or `file_id`; optional `version` (integer) | `content`, `path`, `file_id`, `sha256`; on a `version` read also `version_n`, `is_current`, `head_version`; on a head read of an evidence-carrying page also `attestation` (and `attestation_warning` when anything is not fine) |
| `write_file` | `kb_id`, `path`, `mode` (`create` / `overwrite` / `append` / `patch`), `content`; optional `if_match` (the `sha256` from your last read), `mime_type`, `expected_bytes`, `idempotency_key` | `file_id`, `path`, `etag` (the new `sha256`), `version_n` (the new head version), `resource_link` |
| `write_files` | `kb_id`, `files[]` of the same shape | one result per file; run the self-check on every page written |
| `list_files` | `kb_id`; optional `path_prefix` | the KB's live paths, to confirm the target exists without guessing |

Keep one `kb_id` for the whole procedure; the target and the citing page live
in the same KB. (An entry cannot cite a page in another KB: `path` resolves in
the KB the page is read from.)

## Step 1 — Confirm the target exists, as named

`list_files({ kb_id, path_prefix: "wiki/" })` and find the exact path you
mean to cite. Do not cite a path you have not seen in the listing. A file
with the same name in another directory is a different file.

If the artefact is **outside Atmina** (a CRM row, a ticket, a meeting, an
official document), skip to step 6. If the claim rests on **nothing you can
name**, skip to step 7.

A chronicle path may be `source:` provenance. It is **not** a `wiki-page`
locator: `type: wiki-page` looks up `wiki/${path}`, so `path: chronicle/…`
resolves to `wiki/chronicle/…` and comes back unresolved.

## Step 2 — The pinning read: two calls, this order

2.1. `file_history({ kb_id, path: "<wiki/… target>" })`.
Take `head_version`. Also note `oldest_retained`: the pin you are about to
write will be pruned after `keep_last` (20) further writes to this file, and
nothing recovers it then. (`VERSION_RETENTION_KEEP_LAST = 20`. Track A's S11
exemption is platform work, not this pack.)

2.2. `read_file({ kb_id, path: "<wiki/… target>", version: <head_version> })`.
Confirm the response's `version_n` equals `head_version` and `is_current` is
`true`. Keep `content` — these are the bytes you hash — and `version_n` —
this is `pinned_version`.

Do not read the head first and ask for the version afterwards: a head read
returns no `version_n`, and a write between your two calls would pin a version
whose bytes you never saw. If `is_current` is `false`, someone wrote between
2.1 and 2.2; start step 2 again.

## Step 3 — Choose the span, counting stored lines

Number the lines of `content` from **1 at the opening `---`** of the target's
frontmatter (or its first line, if it has none). Body-relative counting pins
the wrong lines and the hash matches them perfectly. Choose the smallest
range `n..m` that holds what the claim rests on. Read those lines back to
yourself and confirm they say what the claim says.

## Step 4 — Compute `span_sha256` with the recipe

Apply the recipe below to `content` with the range `n..m`. The output is the
`span_sha256` you write. If the range cannot be produced, you have miscounted;
go back to step 3.

## The recipe: `span_sha256`

Follow this literally on the `content` string a `read_file` returned. Do not
strip frontmatter, do not trim, do not normalise anything the steps do not
name. Line numbers count from the first line of the stored file, which is the
opening `---` of the frontmatter when the file has one. This is W0-1 §5.2.

1. Replace every `\r\n` with `\n`. Then replace every remaining `\r` with
   `\n`.
2. If the result is the empty string, the file has zero lines. Otherwise split
   it on `\n` into a list of lines.
3. If the last element of the list is the empty string, remove it. (A file
   ending in a newline does not have an extra empty last line. Do this once.)
4. Lines are numbered from 1. For a span `Ln-Lm`, if `n` or `m` is greater than
   the number of lines, the range **cannot be produced** — stop; that is the
   answer, not a smaller range. For a whole-file claim take every line.
5. Take lines `n` through `m` inclusive.
6. Join them with a single `\n` between consecutive lines, and **no** trailing
   newline.
7. Encode the joined string as UTF-8 and compute SHA-256.
8. Write the digest as 64 lowercase hexadecimal characters. Compare that string
   to `span_sha256` exactly.

Check yourself against W0-1's worked example. The byte fixture (algorithm
test, not this pack's folder tree) is
`docs/agents/scoped-wiki-evidence-example/wiki/guides/run-the-ingest-pipeline.md`.
Stored lines 29–33 (the five numbered steps, counted from the opening `---` as
line 1) give
`3dfdc8048075493d73397656cae586469b9f320660b2e9d162e3463fa4ceca3d`.
That digest is authoritative and is gated by a test on Atmina's side. If your
implementation of these eight steps does not reproduce it, your
implementation is wrong, not the example. Do not invent a second hash.

## Step 5 — Write the entry and the span link, exactly this

The entry, in the citing page's `evidence:` list. Every field shown is
required; the order is conventional:

```yaml
  - id: run-procedure
    type: wiki-page
    path: guides/run-the-ingest-pipeline.md
    pinned_version: 3
    span_sha256: 3dfdc8048075493d73397656cae586469b9f320660b2e9d162e3463fa4ceca3d
    note: The run procedure, pinned at the version read on 2026-08-26; the span is its five numbered steps.
```

The `path` here is the W0-1 byte fixture (algorithm test), not this pack's
primitive tree. A live Commit cites a page under `wiki/decisions/` /
`wiki/procedures/` / `wiki/facts/` / `wiki/preferences/` /
`wiki/relationships/` / `wiki/open-questions/` the same way.

- `id`: lowercase kebab-case, unique on the page. `Run_Procedure` is dropped.
- `type`: a name from W0-1 §2. In-KB and pinnable, taught: `wiki-page` only.
- `path`: the target's KB path **without** the leading `wiki/`. No leading
  `/`, no `..`, no leading `wiki/`. Never a `chronicle/` path.
- `pinned_version`: the `version_n` from step 2.2, as a bare integer. `"3"` in
  quotes is no pin.
- `span_sha256`: the 64 lowercase hex characters from step 4. Never write
  `content_sha256`.
- `note`: what the span is and when it was pinned. Non-empty, or the entry is
  dropped.

The sentence and its citation, in the body. The marker first, then the link:

```markdown
The procedure runs the pipeline against a fetched tagged baseline, never a
working copy. [@run-procedure] The pinned span is
[the five numbered steps](../guides/run-the-ingest-pipeline.md#L29-L33).
```

- The `[@run-procedure]` marker sits right after the sentence it supports,
  outside any code span, code block, or link label.
- The link comes **after** the marker. It is a Markdown link written relative
  to the citing page's directory — `../procedures/…` from `wiki/facts/`,
  `sibling.md` from the same directory, `/wiki/procedures/…` from the KB root —
  and it must resolve to exactly the file named by the entry's `path`.
- The link names the file. `#L29-L33` alone is an external link that opens
  nothing.
- The fragment is `#Ln-Lm` with the stored-line numbers from step 3, or `#Ln`
  for one line.

Two claims resting on different spans of one page are two entries, two ids,
two markers, two links. The link nearest after each marker is that marker's.
The binding key is the `[@id]` marker (LAT-1861 / W0-1 §4), not the link
target alone.

A `wiki-page` entry with a pin and no span link is a claim about the whole
page; the recipe then runs over every stored line. Use it only when the claim
is about the page as a whole. Span ⇒ pin.

## Step 6 — An external target: address and date, no pin

```yaml
  - id: crm-renewal
    type: system-record
    url: https://crm.example.test/accounts/A-104
    retrieved: 2026-08-27
    note: CRM account A-104 renewal dates as retrieved 2026-08-27. Outside Atmina, so it is recorded rather than resolved.
```

- `type` is a taught external name from W0-1 §2 (`official-document`,
  `system-record`, `communication`, `regulatory-instrument`,
  `person-attestation`, `absence`, `measurement`, `dataset-slice`,
  `prior-version`, `derivation`). This skill does not add names.
- `url` is absolute `https`, with no username or password in it. `http`, a
  bare hostname, or a credentialed URL loses the field silently and leaves a
  citation that names nothing.
- `retrieved` is the date you read it, `YYYY-MM-DD`.
- No `pinned_version`, no `span_sha256`, no span link. There is nothing in
  Atmina to pin.
- The `note` says it was recorded, not verified. The body sentence ends with
  `[@crm-renewal]` like any other claim.

## Step 7 — An unlocated claim: marked, never disguised

You may write a claim you cannot locate. You may not write it as prose. It
lives as an Open Question (`status: unresolved` in `wiki/open-questions/`),
never as a confirmed Fact or Procedure.

```yaml
  - id: missing-contract
    type: unattested
    note: UNATTESTED — no CRM row was found for account A-104 on 2026-08-27. To attest, cite the contract record that names the account.
```

- `type: unattested`, and **no** `path`, `url`, or other locator field. A
  guessed `path` is a disguise.
- `note` begins with the exact bytes `UNATTESTED — ` (em dash), then what the
  claim rests on in words, the date, and what would locate it.
- The body sentence ends with `[@missing-contract]`.

It reads back as `evaluated: true, state: "unresolved"` and is named in
`attestation_warning`. That is correct, not a defect: the next reader stops
and asks, which is the only right thing to do with a claim nobody can check.

## Step 8 — Assemble the page and write it

The whole page, as bytes. Line 1 is `---`; every line ends in `\n`; the
closing `---` ends in `\n`; the first body heading is `# <title>` exactly.
`schema: 1` (integer) — nav is `schema: 2`; do not write 2 on a durable page.
Run [checklist.md](checklist.md) over the assembled text before writing.

A new page:

```
write_file({
  kb_id,
  path: "wiki/facts/account-a-104-renewal.md",
  mode: "create",
  content: "<the whole page>"
})
```

An existing page, including a supersede-in-place of a contradictory
Preference or Fact: `read_file({ kb_id, path })` first and keep its `sha256`,
then

```
write_file({
  kb_id,
  path: "wiki/facts/account-a-104-renewal.md",
  mode: "overwrite",
  if_match: "<that sha256>",
  content: "<the whole page, with the new entry and the new sentence>"
})
```

Do not create a second active page that contradicts the first. Inferred
content cannot replace a confirmed entry without a new Commit.

A `[conflict]` means someone wrote between your read and your write: re-read,
re-compose against the new content, retry. `append` cannot add an entry to
the frontmatter, so a claim added to an existing page is an `overwrite` of
the whole page. `patch` (`patch: { type: "find-replace", body: { old_string,
new_string } }`) is allowed for a body-only edit, but the self-check still
re-parses the whole page.

The response carries `file_id`, `path`, `etag`, and `version_n`. Keep all
three; the self-check reports them. `version_n` is the citing page's own new
head. It is never a pin for any claim.

## Step 9 — Read it back

Now [self-check.md](self-check.md), without exception. A write you did not
read back is a write you cannot say survived. Do not skip because LAT-1881
might land.

## Worked bytes — hash proof

The byte fixture
`docs/agents/scoped-wiki-evidence-example/wiki/guides/run-the-ingest-pipeline.md`
at the taught span, stored lines 29–33:

```
1. List the published baselines and take the newest tag.
2. Fetch that tag from the shared registry into the scratch directory.
3. Write the tag and the fetch date into the run log.
4. Run the pipeline against the fetched baseline, never against a working copy.
5. Publish the output, quoting the tag recorded in step 3.
```

Joined with `\n`, no trailing newline, SHA-256:
`3dfdc8048075493d73397656cae586469b9f320660b2e9d162e3463fa4ceca3d`.

That digest is the one LAT-1886 already gates. Do not invent a second hash.

## Worked bytes — a durable Commit page

```markdown
---
schema: 1
title: Renewal window for account A-104
summary: The contracted renewal window and the CRM row it rests on.
source: chronicle/2026-08-27-account-a-104-renewal.md
observed: 2026-08-27
status: confirmed
topics:
  - account-a-104
evidence:
  - id: crm-renewal
    type: system-record
    url: https://crm.example.test/accounts/A-104
    retrieved: 2026-08-27
    note: CRM account A-104 renewal dates as retrieved 2026-08-27. Outside Atmina, so it is recorded rather than resolved.
---

# Renewal window for account A-104

Account A-104 renews on a twelve-month cycle ending 30 September. [@crm-renewal]
```

`source:` is the chronicle path (provenance, not a locator). The typed
evidence is `system-record`, not `wiki-page`. Read back at head, this page's
`attestation` includes
`{ evidence_id: "crm-renewal", evaluated: true, state: "external" }`.
