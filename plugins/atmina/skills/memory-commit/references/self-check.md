# The self-check: read it back, re-parse it, and believe only that

Run this after **every** write that carries a claim — `write_file`,
`write_files` (once per page). There is no server-side validation; a
malformed record is dropped on read with no error anywhere. This is the only
thing that will tell you the record exists. LAT-1881 (write-path diagnostics)
is an optional parallel; do not skip this because it might land.

Inputs: the `kb_id`, the page `path`, and the `etag` and `version_n` the
write returned. The write response field is `version_n`, not `version`.

`get_file_outline` (size + sha) confirms the bytes landed — that is the
product's transport check, and it says nothing about the claim. This read-back
checks the claim; only a head `read_file` says whether it is verifiable.

The write response may also carry `evidence_warning`, naming entries with no
resolvable locator. It checks structure, never truth: a page can pass it and
still be wrong. Act on it — fix the locator — but it does not replace this
read-back.



## Step 1 — Read the page back at head

`read_file({ kb_id, path })` — no `version`. Confirm:

- `sha256` equals the `etag` the write returned. If it does not, someone
  wrote after you; the bytes below are theirs, not yours. Re-read your intent
  against the new content before deciding anything.
- `content` is the page you sent, byte for byte. Compare; do not skim.

## Step 2 — Re-parse the returned bytes yourself

Run every item of [checklist.md](checklist.md) over the returned `content`,
not over what you meant to send. In particular, from the bytes:

1. Line 1 is `---`. Find the next line that is exactly `---`. Everything
   between is the frontmatter; everything after that line's newline is the
   body.
2. Parse the frontmatter as YAML. `schema` is the integer `1` (nav is schema
   2; that is a different document); `title` and `summary` are non-empty
   strings; `source`, `observed`, and `status` are present; no key repeats.
3. List every entry under `evidence:` that has an `id` of the right shape, a
   `type` from W0-1 §2, and a `note`. **Every entry you intended is in that
   list**, with the fields you wrote — `pinned_version` an integer,
   `span_sha256` 64 hex, `url` an `https` URL, an `unattested` entry with no
   locator. No `wiki-page` path is a chronicle path.
4. Collect every `[@id]` in the body outside code spans, code blocks, and link
   labels. Every intended id is there; every id found has an entry.
5. For each pinned entry with a span: find its first marker; find the first
   `[label](target#L…)` link after it; resolve `target` against the citing
   page's directory; confirm it is the file the entry's `path` names under
   `wiki/`, and that the fragment is the range you hashed.
6. The first body heading is `# <title>`.
7. Link discipline holds on the returned bytes:
   [link-discipline.md](link-discipline.md).

Any item that fails is a malformed write. **STOP** with the SKILL.md shape,
naming the item and the offending bytes. Do not proceed to step 3 to see
whether the product "still accepts it".

## Step 3 — Read the product's verdict, when there is one

If the response carries `attestation`, find the row whose `evidence_id` is
each entry you wrote and compare it with this table. This is what the read
path computed from the bytes you just re-parsed; it is the last word on
whether the record binds. States are W0-1 §9.

| You wrote | Required row |
| --- | --- |
| a `wiki-page` entry with a pin and a span link | `{ evidence_id, evaluated: true, state: "attested" }` |
| a `wiki-page` entry with a pin and no span link (whole-page) | `{ evidence_id, evaluated: true, state: "attested" }` |
| an external-type entry with a `url` and no pin | `{ evidence_id, evaluated: true, state: "external" }` |
| an `unattested` entry | `{ evidence_id, evaluated: true, state: "unresolved" }` |

Anything else for an entry you just wrote is a malformed write. **STOP.** The
reasons, by what came back:

| Came back | It means | Where to look |
| --- | --- | --- |
| No `attestation` key on a head read of a page you re-parsed as well-formed | The Atmina you are talking to does not compute verdicts on this transport. Step 2 is the whole check; say so: `no product verdict on this transport; record re-parsed as well-formed`. | — |
| No `attestation` key, and step 2 failed | Cliff 1, 4, or 5: the page is not an evidence-carrying page. | checklist 1–10 |
| The id is absent from `entries` | Cliff 2: the entry did not survive parsing. | checklist 11–14 |
| `drifted` on a pin you just wrote | The target changed between your pinning read and this read, or you hashed the wrong bytes: a body-relative line count, a trimmed `content`, a CRLF file, a range past the end. | pin-recipe steps 2–4; checklist 27 |
| `unresolved` on a `wiki-page` entry | The `path` does not resolve — wrong prefix, a leading `/`, `..`, a chronicle path, or a file that is not there — or the pin's version is already gone. | checklist 29–30; `file_history` on the target |
| `external` on a `wiki-page` entry you pinned | Half a pin: `pinned_version` quoted, zero, or missing; `span_sha256` not 64 lowercase hex. | checklist 22 |
| `external` where you expected `unresolved` on an `unattested` entry | The entry carries a locator field you did not mean to write. | checklist 33 |
| `{ evidence_id, evaluated: false }` (no `state`) | The read hit its `resolution_bound` before reaching this target; the product did not look. Not a malformed write, and not a pass. Go to step 4. | — |

`attestation_warning`, when present, is the same facts in one sentence,
leading the response. Read it; it does not replace the row-by-row check.

Never treat a missing `state`, a missing block, or a missing entry as
`attested`.

## Step 4 — When `truncated: true`

`truncated: true` means at least one entry on the page was not evaluated
(`evaluated: false`, no `state`). It happens when the page cites more than
`resolution_bound` (50) distinct targets. Two consequences:

- Your new entry's row is still required to be as the table says **if it
  carries a state**. Truncation excuses nothing that was evaluated.
- If your new entry is one of the unevaluated ones, the product has given you
  no verdict. Recompute it: `read_file` the target at head, apply the recipe
  in [pin-recipe.md](pin-recipe.md) to the span's range, and compare with
  the `span_sha256` you wrote. Equal: report
  `pin re-verified manually at head; product verdict unavailable (read truncated at <resolution_bound> targets)`.
  Not equal: STOP as `drifted`. Never report the entry as attested on the
  product's behalf.

A page that cites more than fifty distinct files is also a page a reader can
never fully verify in one read. Say that in your report.

## Step 5 — Report

For each page written, in the output:

```
Recorded: <KB path> in <kb_id> — version <version_n>, etag <etag>
  `<id>`: <pinned span Ln–Lm of <target> @ version <pinned_version> | external <url> | unattested> — read back <state, or "re-parsed as well-formed; no product verdict on this transport">
```

One line per entry. A reader of this report can open every locator you wrote
without asking you anything.

## What the self-check does not do

- It does not check that the claim is **true**. The span said what you read;
  whether your sentence paraphrased it faithfully is your responsibility at
  pin-recipe step 3, and the reader half of this pack at read time.
- It does not re-verify **other** entries on the page beyond their rows in
  `attestation`. An older entry that comes back `drifted` is information for
  Maintain, not a reason to rewrite it now — say it in the report and leave
  it.
- It does not undo a malformed write. A STOP leaves the page as written;
  the fix is a corrected `overwrite` with `if_match`, followed by this
  procedure again.
- It does not wait on LAT-1881.
