# Idle gate

Maintain is out of band. The gate is a **skill instruction**, not a
platform signal. There is no idle API. Do not invent one. Do not poll
presence, session state, or "the user went quiet."

## Run only when

- an operator explicitly asked to maintain this Knowledge Base, or
- the turn is labelled out-of-band (a scheduled attestation sweep, a
  named maintain session, "run Maintain on this KB").

## Do not run when

- the current turn is answering an in-band user task (a question, a
  lookup, a write the user asked for, Recall, Observe, or Commit);
- Maintain would be a `finally` after some other skill — **do not run as
  the task's `finally`**;
- nobody named Maintain, archive, claim repair, linkify, or an
  attestation sweep.

In-band → STOP before any `move_file` or `write_file`:

```
STOP — not running Maintain during an in-band user task.
Asked for: <what the user actually asked>
Not doing: claim repair, archive, linkify, trail write
To continue: an operator asks for Maintain out of band
```

A live user task is not racing a rewrite. That is the whole gate.
