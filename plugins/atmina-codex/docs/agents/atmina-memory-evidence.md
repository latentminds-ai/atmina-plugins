# The atmina-memory pack's evidence convention

**Status:** binding for the atmina-memory skills pack (LAT-1880 Wave 0).
Written for slice W0-1 ([LAT-1886](https://linear.app/latent-minds/issue/LAT-1886)).

**This file DEFINES the pack's writer/reader binding.** Later Wave 0 slices
**import** it and must not re-define the catalogue, the pin recipe, the
`[@id]` marker/link bijection, the silent-drop cliffs, the `unattested` row,
link discipline, or `version_n`:

- W0-4 `memory-recall` (reader / verify) imports this binding
- W0-5 `memory-commit` (writer / pin + read-back) imports this binding
- W0-6 `memory-maintain` (repair proposals) imports this binding

When two slices build the halves of a contract, one DEFINES and the others
import. Never both.

**Audience:** a business / organisational Knowledge Base. Systems of record are
CRM rows, tickets, calendars, ledgers, meetings, and official documents. Pins
are Atmina `pinned_version` + `span_sha256`. This file does not teach git,
default branches, commit hashes as the way to pin, repositories, or pull
requests as a required evidence type.

**Bound by, in this order:**

1. Wave 0 bounds in `docs/plans/2026-08-27-atmina-memory-pack-wave0.md`
   (grill closures G1, G11, G12).
2. `docs/notes/2026-09-27-memory-system-design-v2.md` and LAT-1880's settled
   decisions — not re-openable.
3. Decision log D-A2 / D-A3 / D-A4 / D-A7 / D-A8; ADR 0038 ruling 2; ADR 0048.

Do not rewrite `docs/agents/scoped-wiki-evidence.md` in place. That file is
LAT-1833's binding catalogue. Two pack conventions are the cost G-4 already
accepted. "No third vocabulary" means **this pack teaches the catalogue in
§2 only**.

The pin-recipe hash proof may keep using
`docs/agents/scoped-wiki-evidence-example/` as a **byte fixture** (algorithm
test, not a type catalogue). Stored lines 29–33 of
`wiki/guides/run-the-ingest-pipeline.md` must still hash to
`3dfdc8048075493d73397656cae586469b9f320660b2e9d162e3463fa4ceca3d`.

---

## 1. What this convention is for

An agent reading a company wiki must be able to answer, about any factual
claim: **what does this rest on, and can I still reach it?** An agent writing
must leave that question answerable.

This document defines the bytes that make that possible. It does not define
skill behaviour — that is W0-2 through W0-6 — and it introduces no product
change. Everything here is writable today through `write_file` /
`write_files` / `update_file`.

**Nothing in the product validates a word of this on write.** A malformed
record is dropped on read, silently. That is why commit reads the page back.

---

## 2. Taught types

This is the pack's catalogue. Skills cite these names. They do not cite a
second list.

| Type | Use | Pin? |
| --- | --- | --- |
| `wiki-page` | Another durable wiki page. `path` is wiki-relative (`guides/run.md` → `wiki/guides/run.md`). | Yes, when citing a span. |
| `official-document` | A document with standing, outside Atmina. `https` `url` + `retrieved`. | No. |
| `system-record` | A record in a system of record (CRM, ticket, ledger). Locator + `https` `url` + `retrieved`. | No. |
| `communication` | A message, thread, or meeting. | No. |
| `regulatory-instrument` | A regulation, policy instrument, or similar. | No. |
| `person-attestation` | Someone said so — the "a person confirmed this" rung, typed. | No. |
| `absence` | Evidence that something is *not* there ("no contract on file as of 2026-08-27"). | No. |
| `measurement` | A measured quantity. | No. |
| `dataset-slice` | A named slice of a dataset. | No. |
| `prior-version` | An earlier version of a record. | No. |
| `derivation` | A derived artefact. | No. |
| `unattested` | A factual claim about an artefact that has **no locator**. Profile addition. Note **must** begin `UNATTESTED — `. Reads back `unresolved`. | No locator fields at all. |

Unknown type names are valid bytes. The product treats `type` as an open
string and unknown types degrade to a generic label. This pack still **teaches
only the table above**. Do not invent a third vocabulary.

**In-KB and pinnable, taught:** `wiki-page` only.

**In-KB, not taught:** `consented-session-note`. Wave 0 does not use it.
Session notes live in `chronicle/` and are `source:` provenance on a later
Commit, never a `wiki-page` locator (see §8).

### Not taught

These names are valid bytes the product will parse. They are another pack's
problem. This pack does not teach them, does not require them, and must not
list them as the way a business wiki records a claim:

`repository-file`, `repository-directory`, `test`, `commit`, `commit-range`,
`pull-request`, `issue`, `accepted-decision`, `codex-session`.

---

## 3. The shape — write exactly this

| What | Where | Name |
| --- | --- | --- |
| Span | a **body markdown link** | `[label](page.md#L120-L126)` |
| Pinned version | frontmatter, on the evidence entry | `pinned_version` (number) |
| Span hash | frontmatter, on the evidence entry | `span_sha256` (64 lowercase hex) |

A complete minimal page:

```markdown
---
schema: 1
title: Ingest pipeline baseline
summary: What the ingest pipeline treats as its production baseline.
topics:
  - ingest-pipeline
evidence:
  - id: run-procedure
    type: wiki-page
    path: guides/run-the-ingest-pipeline.md
    pinned_version: 3
    span_sha256: 3dfdc8048075493d73397656cae586469b9f320660b2e9d162e3463fa4ceca3d
    note: The run procedure, pinned at the version read on 2026-08-26.
---

# Ingest pipeline baseline

Runs start from the newest published tag rather than a working copy.
[@run-procedure] The pinned span is
[the five numbered steps](../guides/run-the-ingest-pipeline.md#L29-L33).
```

Durable wiki pages use evidence **`schema: 1`** (integer). Wiki menus use
**`schema: 2`**. Those integers name different documents. A durable page
written with `schema: 2` yields no evidence at all (cliff 1).

### 3.1 Never write `content_sha256`

That field name already means something else. This pack writes
`span_sha256`, never `content_sha256`, under any circumstance.

### 3.2 Never use `from` / `to` for lines

Those field names are reserved for a different meaning. Line numbers live in
the body link fragment (`#L120-L126`) and nowhere else.

### 3.3 A span is written with the filename

Write `page.md#L120-L126`. Never `#L120-L126`.

A target that begins with `#` is classified **external** before anything else
looks at it. The citation renders as a working-looking link that opens
nothing, and nothing reports an error.

### 3.4 `[@id]` marker and entry form a bijection

Every inline `[@some-id]` marker must have an entry with that `id`; every
entry must be cited by at least one marker. Markers go immediately after the
sentence they support. They are not permitted in frontmatter, code spans,
code blocks, or link labels.

- **An orphan marker is loud.** No matching entry → a `?` badge.
- **An orphan entry is silent.** An entry no marker cites renders nothing.
  Only the pack's own check will find it.

Ids are **lowercase kebab-case** and unique on the page.

### 3.5 The first body H1 must match `title` exactly

Same characters, no trailing punctuation, no restyling. The product does not
enforce this.

---

## 4. One entry, one span — bound by the marker

The span rides in the body; the pin rides in frontmatter. They are bound
together **by the `[@id]` marker**, not by the link's target
([LAT-1861](https://linear.app/latent-minds/issue/LAT-1861)).

> For an entry with id `X`, its span is the **nearest body markdown link
> following the `[@X]` marker, in document order, whose resolved target is
> `X`'s target.** An entry carrying `span_sha256` SHOULD be followed by
> exactly one such link. An entry followed by none is a whole-file claim —
> a pin with no span — never a malformed record.

Write the marker first, then the link:

`[@run-procedure] The pinned span is [the five numbered steps](…#L29-L33).`

A link that comes **before** every marker of its entry binds to nothing.

- Two spans of the same page need **two entries**, two ids, two markers, two
  links.
- Several markers for one entry bind to the nearest qualifying link after
  the **first** marker.
- One link can be the nearest-following link for two entries with the same
  target.
- A marker inside a code span, code block, or link label anchors nothing.

**Where the link points is the viewer's rule, not the entry's.** The entry's
`path` is wiki-relative (`guides/run.md` → `wiki/guides/run.md`); `..` and a
leading `/` on that field are rejected. The span link is a Markdown link: it
resolves **relative to the citing page's directory**, the way the viewer
opens it. [LAT-1867](https://linear.app/latent-minds/issue/LAT-1867) **shipped**
(`a5ddb5bd`, v0.256.0). Page-relative span links are **not** an open product
bug. Write `../guides/x.md#L29-L33` from `wiki/reference/` and the read path
projects the span, the same way the viewer does.

The binding is asserted by code: `packages/evidence/src/span-link.ts` ›
`spanForEvidenceEntry`. If this section and that module disagree, the module
is what the read path does.

### 4.1 A span requires a pin

An in-KB locator that carries a span and no pin is invalid input, not a
state. **Span ⇒ pin.** A pin without a span is a whole-page claim.

An **external** locator — any taught type other than `wiki-page`, and any
`url` — takes **no pin**. It is recorded, reachable, and explicitly not
verified by Atmina.

---

## 5. Line numbers and the hash

### 5.1 Line 1 is the opening `---` of the stored file

Not the first line of prose. Count the stored file. An agent that counts
body lines after stripping frontmatter pins the wrong span, and the hash
matches those wrong lines perfectly.

Splitting:

1. replace every `\r\n` and bare `\r` with `\n`;
2. empty document → zero lines; otherwise split on `\n`;
3. if the last element is empty, drop it (a trailing newline does not create
   a final empty line);
4. ranges are 1-based and inclusive at both ends.

Asserted by `@atmina/kb-view/source-span` › `splitSourceLines`.

### 5.2 The `span_sha256` recipe

> Take the stored text of the target file at the pinned version. Apply §5.1.
> Take lines `startLine` through `endLine` inclusive. Join them with `\n`,
> with **no trailing newline**. Hash the UTF-8 bytes with SHA-256 and write
> the digest as **64 lowercase hex characters**.

Asserted by `packages/evidence/src/span-hash.ts` › `hashEvidenceSpan`. A
range that runs past the end of the file hashes to nothing (`null`), never
to the lines that survive — that is why a truncated target reads as
`drifted` rather than falsely attesting.

Worked-example digest, stored lines 29–33 of
`docs/agents/scoped-wiki-evidence-example/wiki/guides/run-the-ingest-pipeline.md`:

`3dfdc8048075493d73397656cae586469b9f320660b2e9d162e3463fa4ceca3d`

### 5.3 Getting `pinned_version` right

`pinned_version` is the `version_n` of the version actually read. A head
`read_file` does **not** return `version_n`.

The pinning read is two calls, in this order:

1. `file_history` on the target — take `head_version`;
2. `read_file` with `version: <head_version>` — the response carries
   `version_n`, `is_current`, and the bytes you hash.

Reading head first and asking for the version afterwards is racy.

The write response's new head number is also `version_n`, not `version`.
That is the citing page's own version. It is never a pin for any claim.

**Pins age out** after 20 later writes to the target
(`VERSION_RETENTION_KEEP_LAST = 20`). After that the pinned bytes are gone.
A claim-repair pass that **proposes** re-pointing a live pin (applied by a
human) is the mitigation. Track A's S11 retention exemption is platform
work, not this pack.

---

## 6. The silent-drop cliffs

There is no server-side validation. The write path accepts whatever bytes
you send. A malformed record is dropped **on read**. Write → read-back →
re-parse is mandatory for every durable write. LAT-1881 (write-path
diagnostics) is an optional parallel; do not skip read-back because it
might land.

### Cliff 1 — missing `schema: 1`, `title`, or `summary` yields no evidence at all

`schema` must be the **integer** `1`. The string `"1"` fails. Not one entry
survives — including well-formed ones. Every `[@id]` renders as literal text.

### Cliff 2 — an entry missing `id`, `type`, or `note`, or repeating an id, is dropped without trace

Ids must be lowercase kebab-case. On a duplicate id the **first** occurrence
wins. The orphan marker's `?` badge is the only visible symptom.

### Cliff 3 — a non-`https` `url` is dropped

Only the **field** is dropped, not the entry. The citation names nothing and
looks fine. Credential-bearing URLs and unparseable URLs fail the same way.

### Cliff 4 — a duplicate YAML key drops the whole page

Two `topics:` keys cost every claim on the page.

### Cliff 5 — the fence must be exact

The document must *start* with `---\n`. The closing `\n---` line must end in
a newline. A leading blank line, a BOM, or a CRLF fence means the page has
no evidence.

### Cliff 6 — a bare `#L…` fragment is external

§3.3.

Every cliff fails quietly and plausibly. A page that is wrong looks like a
page that is right.

---

## 7. Write-time checklist

For each durable page:

1. The document starts at byte zero with `---\n`, LF line endings, closing
   `---` line ends in a newline.
2. `schema: 1` (integer), non-empty `title`, non-empty `summary`.
3. No duplicate YAML keys.
4. First body H1 is exactly `# <title>`.
5. Every entry has `id` (lowercase kebab-case, unique), `type` from §2, and
   a non-empty `note`.
6. Every entry is cited by at least one `[@id]` marker; every marker
   resolves to an entry. Markers sit outside code spans, code blocks, and
   link labels.
7. Every `url` is an absolute, credential-free `https` URL.
8. Every entry carrying `span_sha256` also carries `pinned_version`, and its
   `[@id]` marker is **followed** by the one body link that resolves to that
   entry's target and carries a `#L…` fragment. A link that precedes the
   marker binds to nothing.
9. Every span link names its file — `page.md#L120-L126`, never `#L120-L126`.
10. `content_sha256` appears nowhere. `from` and `to` are not used for lines.
11. **Link discipline:** every wiki-to-wiki reference is a markdown link or
    an evidence entry — never a bare path in prose or inline code. Bare
    paths render as text and do not traverse. Documents never embed app or
    published URL schemes; friendly slugs are a render-time projection, not
    content.
12. Unlocated artefact claims are `type: unattested` with a note beginning
    `UNATTESTED — `, never ordinary prose, never a guessed `wiki-page` path.

Then read the page back and re-parse it, because §6 means nothing else will.
Confirm the evidence block parsed. When the read-back carries `attestation`,
a freshly written pin that does not come back `attested` is a malformed
write.

Nothing durable to write: **no-op is success**.

---

## 8. Locator trap — `wiki-page` resolves only under `wiki/`

`type: wiki-page` looks up `wiki/${path}` (or a `/wiki/<target>` suffix). A
`wiki-page` entry whose `path` is `chronicle/…` looks for
`wiki/chronicle/…` and comes back **unresolved**.

Observe writes `chronicle/YYYY-MM-DD-<slug>.md`. Commit may set `source:` to
that path. Typed evidence must **not** use `type: wiki-page` for a chronicle
path. Wave 0 does not teach `consented-session-note` as the workaround.
Durable claims still need at least one taught typed evidence entry.

The v2 spec's §18 example that cites a chronicle session note as
`type: wiki-page` is this trap. Do not copy it.

---

## 9. Computed attestation states (reader)

A head `read_file` of an evidence-carrying wiki page returns
`attestation.entries[]` with `evaluated` / `state`, plus `truncated` and
`resolution_bound`. [LAT-1849](https://linear.app/latent-minds/issue/LAT-1849)
already ships this. Do not re-request it. Version reads and non-evidence
pages carry **no** block.

| `state` | Meaning | Do |
| --- | --- | --- |
| `attested` | Locator resolves; pin retained; cited span at head hashes to `span_sha256`. | **Proceed on the span**, not the paraphrase. |
| `drifted` | Locator resolves but the span at head no longer matches the pin. | **STOP.** Do not act on the new text. |
| `unresolved` | No locator; file missing; pin pruned; pin unreadable. | **STOP.** |
| `external` | Recorded, not verified by Atmina. | Resolve against the live system of record. Not a pass by itself. |

Absent, and truncated:

| Situation | Do |
| --- | --- |
| `evaluated: false` | The product did not look. Manual check. **Not a pass.** |
| Missing `state` key | **Not a pass.** |
| `truncated: true` | Say so. Another claim on the same page needs its own check. |
| `[@id]` not in `entries` | Malformed; the entry did not survive parsing. **STOP.** |
| No `attestation` key | Manual check, never a pass. |
| Claim with no `[@id]` | Unlocated unless the prose names a resolvable artefact. Ask. |

Never treat a missing `state`, a missing block, or a missing entry as
`attested`. Never substitute a nearby artefact when the locator does not
resolve.

[LAT-1867](https://linear.app/latent-minds/issue/LAT-1867) is **not** an open
product bug. Do not copy the stale "known gap" paragraph that said
page-relative span links project whole-file.

---

## 10. `unattested`

A factual claim about an artefact in the world that carries **no resolver**
is an Open Question.

It may live in the working layer. It may be committed as
`status: unresolved` in `wiki/open-questions/`. It must not be committed as
a confirmed Fact or Procedure.

On the page it is an evidence entry:

```yaml
- id: missing-contract
  type: unattested
  note: UNATTESTED — no CRM row was found for account A-104 on 2026-08-27.
```

No `path`, no `url`, no pin. The read path decides row 1 (no locator →
`unresolved`) before it consults `type`, so the name never changes the
verdict. It is chosen because it is true; any of the real types would say
the claim rests on a kind of source it does not.

---

## 11. Optional provenance this pack accepts

Not required on every page. Use when they add information:

- `source:` — often a chronicle path (provenance, not a `wiki-page` locator).
- `observed:` — when the fact was observed.
- `status:` — `confirmed` | `inferred` | `unresolved`.
- `verified:` — optional confirmation events.
- `stale_after:` — absolute date; Maintain lists it for re-confirmation; it
  is not a deletion.
- `applies_to:` — **one scalar string** per durable page (ADR 0048 has no
  array traversal). Setup registers `/applies_to` as a queryable string
  pointer. A list in this field rejects the write once registered as string.
- Actor format when naming who wrote or confirmed: `human:`, `process:`,
  `<agent>/<model>`.

---

## 12. Open, and already closed

Closed for this pack:

- Minimum provenance, typed evidence (D-A8), unlocated claims as
  `unattested`, marker-anchored span binding (LAT-1861), page-relative span
  links (LAT-1867), computed states on `read_file` (LAT-1849), `span_sha256`
  recipe asserted by `hashEvidenceSpan`.

Still the pack's problem, not a reason to grow the model:

- **Nothing validates a durable page on write.** Read-back is the check.
- **Pins age out after 20 later writes.** Repair proposes; a human applies.
- **The worked-example hash has a CI gate in this repository** (LAT-1886):
  `packages/evidence/test/atmina-memory-worked-example-hash.test.ts`. Edit
  the cited fixture's lines 29–33 and that test goes red. Re-run the §5.2
  recipe after any such edit.
