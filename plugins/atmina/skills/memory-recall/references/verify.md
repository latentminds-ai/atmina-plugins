# Verify before acting — STOP shape and manual check

Folded into this skill so the pack is self-contained. Type catalogue, pin
recipe, and `[@id]` marker/link binding are **not** redefined here — they
are `docs/agents/atmina-memory-evidence.md` (W0-1).

A claim is a sentence that asserts something about an artifact outside the
sentence: where a contract lives, which record to update, what a procedure
requires. This recipe turns that sentence into a checked fact or an
explicit stop. It never turns it into a guess.

## Two modes, in this order

1. **Product-computed verdict.** If the `read_file` response carries an
   `attestation` key, find the entry whose `evidence_id` equals the `[@id]`
   marker next to the claim and act on its `state` —
   [states.md](states.md). An entry with `evaluated: false` has no `state`
   and is **not a pass** — fall through to mode 2.
2. **Manual check.** No `attestation` key, no entry for this id, no
   `state`, no `[@id]` marker, or `state: "external"`: resolve the locator
   yourself, below.

Mode 1 is cheaper, never a prerequisite. Absence of the block means mode 2,
not a pass.

## Three outcomes

- **Proceed** — the locator resolves and what it holds supports the claim.
  Act on the located text, not the sentence that paraphrased it.
- **STOP and surface** — the locator does not resolve, the cited span has
  drifted, the pin cannot be reached, or the located text contradicts the
  claim. Do not act. Do not substitute a nearby artifact with a similar
  name, path, or purpose; a near match is the failure this recipe exists to
  prevent.
- **Unlocated: say so and ask** — the claim names nothing resolvable.

## What a STOP must contain

This shape, every time, before doing anything else:

```
STOP — not acting on this claim.
Claim: "<the sentence as written>" — <page path>, evidence `<id>` (or: no evidence entry)
Note: <the entry's note, or "none">
Locator: <what the claim pointed at, exactly as recorded>
Result: <state, or the reason in one line — what was looked for, what was found>
Not doing: <the action you were about to take>; not substituting <the near match, if any>
To continue: <what would unblock — a person confirms the artifact, a claim-repair proposal re-points the record and a person applies it, the claim is re-pinned>
```

The reader must see the evidence id, the note, the state or reason, the
locator, and what you will not do, without a follow-up.

## Unlocated

```
UNVERIFIED — this claim carries no locator.
Claim: "<the sentence>" — <page path>
I cannot check it against anything. Do you want me to act on it as stated, or can you point me at the artifact?
```

Wait. Do not search for "something that fits" and act on what you find.
Confident prose without a locator is the loudest failure.

---

## Manual check, in order

Keep the `kb_id` you read the claim's page with.

Tools: `read_file` (`kb_id`, `path` or `file_id`; optional `version`),
`file_history` (`kb_id`, `path` or `file_id`), `list_files` (to confirm a
path exists without guessing).

### Step 1 — Find the locator

- **1a. `[@id]` marker** after the sentence — go to step 2.
- **1b. No marker, but the sentence names the artifact** — a wiki path, an
  `https` URL, a CRM record, a ticket, a calendar event, a ledger row. The
  locator is the name itself. Go to step 6.
- **1c. Neither.** Unlocated. Stop and ask, above.

### Step 2 — Find the entry

Frontmatter `evidence:` list; entry whose `id` equals the marker without
`[@` `]`. Must have `id`, `type`, and a non-empty `note`. Missing any →
STOP, `malformed — entry \`<id>\` is missing <field>`. No such entry →
STOP, `unresolved — marker \`[@<id>]\` has no evidence entry`. Record the
`note`; it goes in every STOP.

### Step 3 — Classify

Taught types are W0-1 §2 only. In-KB and pinnable, taught: `wiki-page`.
Every other taught type is external (recorded, not verified by Atmina).
`unattested` has no locator fields at all.

| Entry has | Locator kind | Then |
| --- | --- | --- |
| none of `path`, `url`, or other locator fields | **absent** | STOP, `unresolved — no source recorded on entry \`<id>\``. |
| `type: wiki-page` with `path: <p>` | **in-KB** | KB path is `wiki/<p>`, or any live path ending in `/wiki/<p>`. Reject `<p>` if it starts with `/`, contains `..`, or contains `\` — that is **absent**. Go to step 4. |
| a taught external type (`official-document`, `system-record`, `communication`, `regulatory-instrument`, `person-attestation`, `absence`, `measurement`, `dataset-slice`, `prior-version`, `derivation`) or a `url` | **external** | Go to step 6 with the `url` or other address the entry carries. |

Unknown type names are valid bytes (generic pill until LAT-1878). Treat an
unknown type with a `path` that looks wiki-relative as in-KB only when the
entry is actually `wiki-page`; otherwise treat it as external and resolve
the recorded address. Do not wait on LAT-1878.

To confirm an in-KB path, `list_files({ kb_id, path_prefix: "wiki/" })` or
`read_file` on it. Nothing matches → STOP,
`unresolved — \`<KB path>\` does not exist in this KB`.

`wiki-page` locators resolve only under `wiki/` (W0-1 §8). A `wiki-page`
`path` of `chronicle/…` looks up `wiki/chronicle/…` and comes back
unresolved.

### Step 4 — Pin and span

Pinned only when the entry carries **both** `pinned_version` (positive
integer, not a quoted string) and `span_sha256` (64 lowercase hex). One
without the other is no pin.

The span is bound **by the `[@id]` marker** (W0-1 §4): starting at the
marker, the **nearest following** body markdown link
`[label](target#Ln)` or `[label](target#Ln-Lm)` whose target — fragment
removed, resolved relative to the citing page — is the entry's target
file. Skip links inside code spans and fenced blocks. A heading-anchor
fragment or a bare `#L…` is not a span. LAT-1867 shipped: page-relative
targets such as `../facts/x.md#L12-L14` resolve on the read path.

| Pin | Span | Do |
| --- | --- | --- |
| yes | yes | Step 5 with lines `n..m`. |
| yes | no | Step 5 over the whole file (whole-page claim). |
| no | yes | Unpinned: step 6 on the whole file at head; say `unpinned — the span link cannot be checked without a pin`. |
| no | no | Step 6, whole file at head. |

### Step 5 — Verify the pin, then check head

5.1. `file_history({ kb_id, path: <KB path> })`. If `pinned_version` is
not in `versions[]` (including below `oldest_retained`) → STOP,
`unresolved — pinned version <n> is no longer retained (oldest retained: <m>)`.

5.2. `read_file({ kb_id, path: <KB path>, version: <pinned_version> })`.
A head read does **not** carry `version_n`; this versioned read does.
Not readable → STOP,
`unresolved — pinned version <n> is not readable`. Confirm `version_n`
equals `pinned_version`. Keep `content`.

5.3. Apply the `span_sha256` recipe in
`docs/agents/atmina-memory-evidence.md` §5.2 to that `content` with the
span's range (or the whole file). Do not re-derive the algorithm here.
Range past end of file, or digest ≠ `span_sha256` → STOP,
`pin does not verify — span_sha256 does not match lines <n>–<m> of version <pinned_version>`.

5.4. `read_file` the same path at head (no `version`). Apply §5.2 again.

| Head result | State | Do |
| --- | --- | --- |
| range cannot be produced | **drifted** | STOP: `drifted — cited lines <n>–<m> no longer exist at head`. |
| digest ≠ `span_sha256` | **drifted** | STOP: `drifted — source changed since this claim was pinned`. |
| digest = `span_sha256` | **attested** | Step 7 with the span text from 5.3. |

### Step 6 — Unpinned or external locator

Resolve the locator **as written**. Compare the claim to what is there
today.

- **In-KB, unpinned:** `read_file` at head. Say
  `verified at head today, not pinned` when you proceed.
- **A URL:** fetch it. If you cannot fetch, you have not resolved it.
- **A system of record:** open the CRM row, ticket, calendar event, or
  ledger line at the address the claim names, with the SoR tools you have.

Resolution by name is not resolution. A similarly named account, a
neighbouring ticket, a document that "covers the same ground" — none of
these is the artifact. If the named location does not hold it → STOP,
`unresolved — <locator> does not exist; found <near match> at <where>, which is not the artifact the claim names`.

Then step 7.

### Step 7 — Compare the claim to the text

- The text says what the claim says, or more precisely: **proceed**, acting
  on the text's detail.
- The text says something different: STOP,
  `contradiction — the claim says "<x>"; the cited text says "<y>"`.
- The text does not address the claim: STOP,
  `unsupported — the cited text does not say this`.

## What this recipe does, and what it does not

- It **reads** a verdict from `attestation` when present.
- It **computes** the manual check: entry lookup, span-link binding as in
  W0-1 §4, `file_history`, `read_file` at the pinned version, the W0-1 §5.2
  hash, the head comparison, and the claim-versus-text comparison.
- It **does not** validate a page, repair a record, or write anything.
- It **does not** teach another pack's type names as this pack's catalogue.

## Never

- Never proceed on `drifted` / `unresolved` / missing block / missing
  `state` / `evaluated: false` as if they were a pass.
- Never substitute a near match.
- Never write memory on this path.
