# Atmina plugins

*Memory, Shared. Total Recall.*

Atmina is shared memory for coding agents. An agent forgets between sessions
and its context thins within one; Atmina is where the decisions, findings and
procedures worth keeping survive to the next prompt. This repository packages
that for three editors.

- **Product and sign-up:** https://atmina.ai
- **Server this plugin talks to:** `https://mcp.atmina.ai/mcp`

## Install

### Claude Code

```sh
claude plugin marketplace add latentminds-ai/atmina-plugins
claude plugin install atmina@atmina
```

Restart Claude Code, then run `/mcp` to authorize the connection. Sign-in is
browser-based OAuth; no credentials are stored in this repository or in the
plugin.

### Cursor

One-click: open [`add-to-cursor.md`](add-to-cursor.md) and follow the
install link. Or add the plugin directory `plugins/atmina-cursor` by hand.

### Codex

Copy the server block from
[`plugins/atmina-codex/config.toml`](plugins/atmina-codex/config.toml) into
your Codex configuration, and the skills from
`plugins/atmina-codex/.agents/skills/`.

## What you get

**An MCP connection** to your Atmina Knowledge Bases — search, read, write,
share, audit, and scheduled routines.

**6 agent skills** that teach an agent when to use it:
`atmina-kb-mcp`, `memory-setup`, `memory-observe`, `memory-recall`, `memory-commit`, `memory-maintain`. They cover seeding a Knowledge Base, writing working notes,
recalling durable memory and verifying it before acting, committing decisions
with evidence, and an out-of-band maintenance pass.

**Four editor hooks** (Claude Code and Codex). These are the part that runs
code on your machine, so they are documented in full below.

## What the hooks do

All four are POSIX shell scripts in `hooks/`, invoked by your editor. None
of them makes a network request, reads your source code, or sends anything
anywhere. Read them — they are about twenty lines each.

| Hook | Fires on | What it does |
| --- | --- | --- |
| `orient.sh` | session start | Prints one paragraph reminding the agent to search memory before answering from training. Writes nothing. |
| `record-write.sh` | after an Atmina write tool | Increments a counter file. |
| `record-compaction.sh` | before context compaction | Increments a counter file. |
| `nudge.sh` | end of turn (Claude Code) / next prompt (Codex) | If the session compacted without writing anything to Atmina, prints one sentence saying so, then resets the counter. Otherwise silent. |

**The only thing written to disk** is two small counter files, each holding a
number. They live in the plugin data directory your editor provides
(`CLAUDE_PLUGIN_DATA`, or `PLUGIN_DATA` on Codex), falling back to a
temporary directory. They are never transmitted.

Cursor gets orientation only, as an inline command, and ships no scripts.

## Versioning

Tags track the Atmina platform release the artifacts were generated from, so
version numbers move even when the plugin content does not; `CHANGELOG.md`
says which releases actually changed something here.

Editors cache plugins per version, so a fix reaches an existing install only
after `claude plugin update atmina` (or your editor's equivalent).

## Support

- **Questions and bugs about the plugin itself:** open an issue here.
- **Account, billing, data, or anything about the hosted service:**
  support@atmina.ai — an issue in this repository is public, so never paste
  Knowledge Base content, tokens, or personal data into one.

## This repository is generated

Every file here is emitted by a build in the Atmina source repository and
overwritten on each publish. A pull request against this repository cannot be
merged, because the next publish would revert it. **Please open an issue
instead** — describe what is wrong and we will fix it at the source.

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](LICENSE) and
[`NOTICE`](NOTICE).

You may use, modify and redistribute these artifacts, including commercially,
provided you retain the licence and attribution and state your changes.

### Trademarks

The licence grants no trademark rights (Apache-2.0 §6). "Atmina" and the
Atmina logo are trademarks of Latent Minds Pty Ltd.

You may say your project **works with Atmina**, or that it connects to
Atmina. You may not name your plugin, product or fork "Atmina", use the logo
as your own, or present a modified version in a way that suggests it is the
official one.

### The service is separate

These artifacts are a client. They are useful only against a running Atmina
server, and your use of the hosted service is governed by its own terms at
https://atmina.ai — not by this licence.
