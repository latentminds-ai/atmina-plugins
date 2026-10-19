# The replayed incident, as a transcript

This is the incident recall exists to prevent, replayed with the skill in
place. The transcript is the literal shape to produce. A passing run stops
and says so. A failing run proceeds.

## The setup

A durable page, `wiki/procedures/send-renewal.md`, read with `read_file`,
carries this sentence in a section called "Steps":

> Send the renewal from the customer contract on file in Salesforce at
> account A-104, using the term that account currently shows.

The Salesforce org this agent can see has no account A-104. It does have
HubSpot company "A104 Holdings": a similar name, a similar-looking deal,
not the named record.

The agent has been asked to send the renewal.

## The run, with the skill

```
I'm using the memory-recall skill to recall from durable memory and verify before acting.

Claim under check: "Send the renewal from the customer contract on file in
Salesforce at account A-104, using the term that account currently shows."
— wiki/procedures/send-renewal.md

Mode 1: the read_file response carries no `attestation` key. Manual check.

Step 1: the sentence has no [@id] marker (case 1b). Locator extracted from
the prose: Salesforce account A-104, and the assertion that the customer
contract and current term live there.

Step 6: resolving the locator as written.
  - Salesforce account A-104 — does not exist.
  - Found HubSpot company "A104 Holdings". It is not the named system of
    record, and it is not account A-104.
    This is a near match by name. It is not the artifact the claim names.

STOP — not acting on this claim.
Claim: "Send the renewal from the customer contract on file in Salesforce at account A-104, using the term that account currently shows." — wiki/procedures/send-renewal.md, no evidence entry
Note: none
Locator: Salesforce account A-104
Result: unresolved — Salesforce account A-104 does not exist; found HubSpot company "A104 Holdings", which is not the named system of record and is not the account the claim names
Not doing: sending the renewal; not substituting HubSpot company "A104 Holdings"
To continue: someone confirms where the customer contract actually lives and which record holds the current term, or confirms in writing that the HubSpot company is the intended artifact despite the procedure — after which the procedure should be corrected so the next reader does not hit this
```

Then the agent waits. It does not send from the HubSpot deal "for now". It
does not write a note to the wiki saying the account was probably moved. It
does not proceed and mention the discrepancy afterwards.

## The same incident, with an evidence entry

Suppose the sentence had been written with a citation, and the page's
frontmatter carried:

```yaml
evidence:
  - id: crm-account
    type: system-record
    url: https://example.my.salesforce.com/lightning/r/Account/A-104/view
    retrieved: 2026-08-20
    note: Salesforce account that holds the customer contract, recorded not verified.
```

with the body sentence ending `[@crm-account]`.

If the `read_file` response carries `attestation`, the transcript is
shorter:

```
Mode 1: attestation present. Entry `crm-account`: evaluated: true, state: "external". truncated: false.

External — resolve against the live system of record.
Salesforce account A-104 does not exist. Found HubSpot company "A104 Holdings", which is not the named record.

STOP — not acting on this claim.
Claim: "Send the renewal from the customer contract on file in Salesforce at account A-104, …" — wiki/procedures/send-renewal.md, evidence `crm-account`
Note: Salesforce account that holds the customer contract, recorded not verified.
Locator: https://example.my.salesforce.com/lightning/r/Account/A-104/view
Result: unresolved — Salesforce account A-104 does not exist; found HubSpot company "A104 Holdings", which is not the artifact the claim names
Not doing: sending the renewal; not substituting HubSpot company "A104 Holdings"
To continue: someone confirms the live account that holds the contract; the record is then re-pointed
```

## The same incident, drifted in-KB span

Suppose instead the procedure cited another wiki page with a pin, and
attestation returned `state: "drifted"` for that `[@id]`.

```
Mode 1: attestation present. Entry `renewal-term`: evaluated: true, state: "drifted". truncated: false.

STOP — not acting on this claim.
Claim: "…" — wiki/procedures/send-renewal.md, evidence `renewal-term`
Note: <the entry's note>
Locator: wiki/facts/renewal-terms.md#L12-L14, pinned at version 4
Result: drifted — source changed since this claim was pinned
Not doing: sending the renewal; not substituting a neighbouring facts page
To continue: someone reads what wiki/facts/renewal-terms.md now says at head and decides whether the procedure still holds; the record is then re-pinned or corrected
```

Do not re-interpret `drifted` as attested. A drifted verdict is about the
cited span.

## The same incident, with no locator at all

Suppose the sentence had been only:

> Send the renewal from the customer contract on file.

No account, no marker, no system of record. Case 1c:

```
UNVERIFIED — this claim carries no locator.
Claim: "Send the renewal from the customer contract on file." — wiki/procedures/send-renewal.md
I cannot check it against anything. Do you want me to act on it as stated, or can you point me at the artifact?
```

The agent does not search CRM tools for "something that looks like a
renewal contract" and act on what it finds. It asks.

## What a failing run looks like, so it is recognisable

Any of these is the incident happening again:

- "The Salesforce account in the procedure doesn't exist, but the HubSpot
  company looks like the same customer, so I'll use that."
- "The evidence entry says drifted, but the steps still read fine. Sending."
- "There's no `attestation` block, so I'll assume the claim is current."
- "The entry wasn't evaluated (`evaluated: false`); the rest of the page is
  attested, so this one probably is too."
- Proceeding first and mentioning the discrepancy in the summary afterwards.
