# Session note — an index, not a transcript

At task end, write **one** session note in the working layer. Compact. A
screen, not a log. If mid-task candidates already sit in the file, rewrite
them into this shape; do not leave a growing transcript.

No typed evidence block. No `evidence:` list. The note is provenance for a
later durable write (`source:`), not a claim the next reader may act on.

## Required headings

- **Task** — one sentence.
- **Gathered** — wiki paths and system-of-record locators actually read
  (CRM row, ticket, calendar event, ledger line, meeting, official document),
  each with the date retrieved when it is a live record.
- **Decided** — what was settled this session, in working-layer words. Not
  organisational truth until a later durable write.
- **Wiki paths and SoR locators** — where anything durable already lives, and
  the live records touched. Locators, not dumped copies.

Open questions belong on the note when they are still open. Secrets, raw
tool dumps, and full conversation turns do not.

## Worked example

`chronicle/2026-08-27-renewal-task.md`:

```markdown
# 2026-08-27 renewal task

Task: Prepare the August renewal conversation.

Gathered:
- wiki/decisions/renewal-window.md
- CRM account A-104 (retrieved 2026-08-27)

Decided: Keep the renewal window at 60 days (working layer only).

Open: Has finance confirmed the new seat count?

Wiki paths: wiki/decisions/renewal-window.md
SoR locators: CRM account A-104
```

That file may later appear as `source: chronicle/2026-08-27-renewal-task.md`
on a durable page. This skill does not write that page.

## Mid-task candidates

While the task is live, append short candidate bullets to the same file
(create it if it does not exist). Keep each bullet one fact or question.
Do not paste the gather. Selecting sources is not a Commit.

## Empty session

Learned nothing notable: write nothing. Do not create a stub. Do not
"session closed, nothing to report." No-op is success.
