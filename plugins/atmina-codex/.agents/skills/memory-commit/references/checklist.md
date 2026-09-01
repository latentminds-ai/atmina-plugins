# The write-time checklist, as something to execute

Run this over the assembled page text **before** `write_file`, and again over
the `content` that `read_file` returns **after** it. Every item is a yes/no
you can decide from the bytes. Every item names the silent drop it prevents:
each cliff fails quietly, and the page looks right afterwards.

Convention reference:
[`docs/agents/atmina-memory-evidence.md`](../../../../docs/agents/atmina-memory-evidence.md)
§6 (the cliffs) and §7 (this list). Durable-page extras for this skill
(provenance, locator trap, link discipline) are in the same breath.

## Page level — one miss here and the page carries no evidence at all

| # | Check | Cliff it prevents |
| --- | --- | --- |
| 1 | The first four bytes of the file are `---` followed by a single `\n`. No blank line before it, no BOM, no `\r`. | **5** — a page that does not start with `---\n` has no frontmatter; every `[@id]` renders as literal text. |
| 2 | Every line ends in `\n` only. No `\r\n` anywhere, not even in the fences. | **5** — a CRLF fence is not a fence. |
| 3 | The closing `---` line ends in `\n`. There is a newline after it, even if the body is empty. | **5** — `parseFrontmatter` requires the closing line to end in a newline. |
| 4 | `schema: 1` is present as a bare integer. Not `"1"`, not `1.0`, not `2`. Nav is schema 2; a durable page with schema 2 yields no evidence. | **1** — a page whose `schema` is not the integer `1` yields no evidence. |
| 5 | `title:` is present and non-empty. Quote it if it contains `: ` or `#`. | **1** — no `title`, no evidence. |
| 6 | `summary:` is present and non-empty. Quote it the same way. | **1** — no `summary`, no evidence. |
| 7 | `source:`, `observed:`, and `status:` are present. `status` is exactly `confirmed`, `inferred`, or `unresolved`. | none in the product; this pack's Commit bar requires them. |
| 8 | No YAML key appears twice at the same level, anywhere in the frontmatter — including two `evidence:` lists, two `topics:` lists, or two `note:` lines on one entry. | **4** — one duplicate key anywhere drops the whole page. |
| 9 | No YAML anchors (`&x`), aliases (`*x`), merge keys (`<<:`), or tags (`!!str`). | **4** — aliases are refused at parse time, and the failure lands on cliff 1. |
| 10 | The first heading in the body is `# ` followed by exactly the `title` text — same characters, no trailing punctuation, no restyling. | none in the product; the contract requires it, and nothing else checks it. |

## Entry level — one miss here and that entry is gone, its marker an orphan

| # | Check | Cliff it prevents |
| --- | --- | --- |
| 11 | Every entry has `id`, and the id matches `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Lowercase, digits, single hyphens. | **2** — a malformed id is dropped for its shape alone. |
| 12 | No two entries share an `id`. | **2** — the first wins; the later one is discarded, and the marker cites bytes nobody wrote. |
| 13 | Every entry has a non-empty `type` from W0-1 §2. | **2** |
| 14 | Every entry has a non-empty `note`. | **2** |
| 15 | Every `url` is absolute `https://`, with no `user:pass@` in it, and parses as a URL. | **3** — the field is dropped, the entry survives, and the citation names nothing. |
| 16 | No entry carries `content_sha256`. Never write that field. | none in the product; it already means something else. |
| 17 | `from` and `to` are not used for lines. Line numbers live in the body link fragment only. | same — those field names are reserved for a different meaning. |
| 18 | The page has at least one taught typed evidence entry. | a durable claim with only `source:` is provenance without a locator. |

## Marker and link level — a miss here and the claim binds to nothing

| # | Check | Cliff it prevents |
| --- | --- | --- |
| 19 | Every entry's `id` appears in the body as `[@id]` at least once. | an orphan entry renders nothing and nothing reports it. |
| 20 | Every `[@id]` in the body has an entry with that `id`. | an orphan marker renders a `?` badge, `Evidence unavailable`. |
| 21 | No marker sits inside a code span, a fenced code block, or a link label. | the renderer and the reader both treat it as literal text there; it anchors nothing. |
| 22 | Every entry with `span_sha256` also has `pinned_version` as a bare positive integer, and every entry with `pinned_version` also has `span_sha256` as exactly 64 lowercase hex characters. | half a pin is no pin: the entry reads as unpinned and comes back `external`. |
| 23 | For every pinned entry with a span: the body link with the `#Ln-Lm` fragment comes **after** the entry's first `[@id]` marker in document order. | a link before the marker binds to nothing, and the claim silently becomes whole-file. |
| 24 | That link's target names a file — `page.md#L29-L33`, never `#L29-L33`. | **6** — a bare `#L…` is classified external; the link renders and opens nothing. |
| 25 | That link's target, resolved relative to the citing page's directory the way a Markdown reader resolves it, is exactly the file the entry's `path` names under `wiki/`. `../procedures/x.md` from `wiki/facts/` is `wiki/procedures/x.md`. | a link that resolves elsewhere — a different directory, a same-named file, above the KB root — binds nothing. |
| 26 | Between the marker and its link there is no other link to the same target with a `#L…` fragment. | the nearest following link is the one that binds; another one first steals it. |
| 27 | The fragment's line numbers are stored-line numbers (line 1 = the target's opening `---`), and the range exists in the target at the pinned version. | a body-relative count pins the wrong lines; a range past the end hashes to nothing and reads `drifted`. |
| 28 | [Link discipline](link-discipline.md): every wiki-to-wiki reference is a markdown link or an evidence entry — never a bare path in prose or inline code. Durable pages never embed app or published URL schemes. | a bare path does not traverse; a host URL is a render-time projection, not content. |

## Locator level — a miss here and the claim lies about what it rests on

| # | Check | What it prevents |
| --- | --- | --- |
| 29 | Every `wiki-page` entry has a `path` with no leading `/`, no `..`, no `\`, and no leading `wiki/`; and that path, under `wiki/`, was seen in `list_files`. | an unresolvable locator, `unresolved`, on a claim you could have located. |
| 30 | No `wiki-page` `path` is a chronicle path. Chronicle belongs in `source:` only. | the locator trap: `wiki-page` looks up `wiki/${path}` and `wiki/chronicle/…` is unresolved. |
| 31 | Every `wiki-page` entry with a span link has a pin. | a span with no pin is not checkable and reads as unpinned. |
| 32 | Every external-type entry has an `https` `url` (and any other locator that type takes) and **no** `pinned_version` / `span_sha256`. | a pin on an external is a pin on nothing. |
| 33 | Every `unattested` entry has **no** locator field, and its `note` begins `UNATTESTED — `. | a guessed `path` on an unlocated claim is a disguise; a locator-less entry of a real type is a broken record, not a marked one. |
| 34 | Every `unattested` claim lives on a page under `wiki/open-questions/` with `status: unresolved`. Never as a confirmed Fact or Procedure. | an unlocated artefact claim must not read as organisational truth. |
| 35 | Every sentence in the body that states a fact about an artefact ends with a marker. | the claim this pack exists to prevent: confident prose with nothing behind it. |

Then read the page back. Nothing on this list is checked by Atmina. Nothing
durable to write: **no-op is success**.
