# Atmina plugins

*Memory, shared.*

Atmina is shared memory for coding agents. An agent forgets between sessions
and its context thins within one; Atmina is where the decisions, findings and
procedures worth keeping survive to the next prompt. This repository packages
that for Claude Code, Codex, Cursor, and Grok Build, with a separate setup
guide for Grok Bot.

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

The link in [`add-to-cursor.md`](add-to-cursor.md) adds only the MCP
connection. For skills, rules, and the before-prompt hook, install the full
plugin from this repository’s Cursor marketplace (`plugins/atmina-cursor`).

### Codex

```sh
codex plugin marketplace add latentminds-ai/atmina-plugins
codex plugin add atmina@atmina
```

This installs the Atmina plugin with its MCP connection, skills, and hooks.
Codex desktop supports lifecycle hooks only for manually installed plugins,
such as this marketplace installation. Plugins containing hooks are not
eligible for the public plugin directory.
Complete the browser-based authorization when prompted, then start a new
Codex task to load the plugin. In the Codex desktop app, open a local project
folder before looking at Settings > Hooks. Plugin hooks are hidden without one
(upstream issue https://github.com/openai/codex/issues/43123). Plugin hooks
must be reviewed and trusted via `/hooks` in the Codex CLI before they run.
Review them again when an upgrade changes their definitions. Each Atmina
Codex hook has a readable title and a 10-second timeout.

The separate `plugins/atmina-codex` directory is a legacy manual export. Its
`config.toml` registers only MCP; it does not install hooks. Use the marketplace
route above for the complete plugin.

### Grok Build (standalone CLI)

Review the plugin source, then install and trust the Grok-specific bundle:

```sh
grok plugin marketplace add latentminds-ai/atmina-plugins
grok plugin install latentminds-ai/atmina-plugins#plugins/atmina-grok --trust
grok plugin details atmina
```

Start a new Grok session, open `/mcps`, select Atmina, and complete the
browser sign-in. `grok inspect` shows discovered skills, hooks, and MCP
configuration; it does not prove that OAuth or a tool call succeeded.
Update with `grok plugin update atmina`, review changes, and start a new
session. To test an exact published release, use
`latentminds-ai/atmina-plugins@v0.381.0#plugins/atmina-grok`.

The Grok marketplace selects this bundle, not the Claude bundle. Grok reads
Claude-compatible manifests but discards session-start and prompt context.
Atmina therefore orients after the first successful tool call and again after
compaction. A compaction-without-write reminder arrives after the next tool
call. A turn with no tools gets no hook reminder. Skills are available from
the start; invoke `/memory-recall` when needed. No hook forces another turn.

Grok stores two counters and an orientation marker per session under
`GROK_PLUGIN_DATA`. They survive plugin updates and are never transmitted.
The session-end hook removes that session's counters and marker. A forced
process termination can leave them until the session is resumed and ends
normally. Orientation and any pending reminder share one handler. Once
oriented, ordinary Windows tool calls exit in the batch launcher without
starting the plugin's PowerShell handler; Grok's own runner still launches.
The batch session-ID check is a prefilter, not authoritative validation.
Lines outside its allowlist fall through to PowerShell even if an orientation
marker exists. PowerShell validates the session ID before accessing state.
The hooks count successful `atmina__` write tools, not failed MCP calls.
The Windows launcher uses built-in PowerShell; POSIX uses `sh`.

On Windows, keep the plugin checkout and Grok data directory short. Grok can
skip component paths near the Windows path-length limit; check that
`grok plugin details atmina` lists hooks. Grok's local-path installer can
copy instead of symlink on Windows, while its update command still reports
"local symlink, already live". For a local development copy, run
`grok plugin uninstall atmina --confirm --keep-data` and install it again
after changing it; use the Git repository route above for released versions.

### Grok Bot

Follow [Add to Grok Bot](add-to-grok-bot.md). Grok Bot uses account-level
connectors and its own skill library. A Grok CLI install on your Windows
computer does not install anything into your Bot.

## What you get

**An MCP connection** to your Atmina Knowledge Bases — search, read, write,
share, audit, and scheduled routines.

**6 agent skills** in each CLI/editor bundle that teach an agent when to use it:
`atmina-kb-mcp`, `memory-setup`, `memory-observe`, `memory-recall`, `memory-commit`, `memory-maintain`. They cover seeding a Knowledge Base, writing working notes,
recalling durable memory and verifying it before acting, committing decisions
with evidence, and an out-of-band maintenance pass.

**Editor hooks** (Claude Code, Codex and Grok Build), and a **local session
collector** in the Claude Code plugin that does nothing until you enable it.
These are the parts that run code on your machine, so they are documented in
full below.

## What the hooks do

Hooks ship POSIX scripts, polyglot launchers and a native Windows PowerShell
handler in `hooks/`. The orientation, counter and nudge hooks make no network
requests. Orientation reads only the repository binding; the other hooks
maintain two local counter files. The Claude Code plugin's capture command
hands session starts and ends to the local session collector, which stays off
until you enable it; see "Local session capture" below.

The orientation is a reminder, not a connection health check. It tells the
agent to discover the Atmina tools, consult memory, and disclose when missing
tools or failed authentication prevent a lookup. If access fails, reconnect
Atmina through your client and verify an authenticated Knowledge Base read.
An installed plugin or a successful hook does not establish that memory works.

| Hook | Fires on | What it does |
| --- | --- | --- |
| `orient.sh` | session start | Prints one paragraph: capture what is worth keeping, link it to the pages read and cite sources, and search memory before answering from training. Writes nothing. |
| `record-write.sh` | after an Atmina write tool | Increments a counter file. |
| `record-compaction.sh` | before context compaction | Increments a counter file. |
| `nudge.sh` / `nudge-prompt.sh` | end of turn (Claude Code) / next prompt (Codex) | If the session compacted without writing anything to Atmina, prints one sentence saying so, then resets the counter. Otherwise silent. |
| `capture.sh` | session start and session end (Claude Code only) | On a device where capture is not enabled, writes nothing and exits. Once enabled, copies the hook's input unchanged into the collector's local inbox and starts `collector.mjs`. It reads only SessionStart and SessionEnd input, parses nothing and makes no network request. |
| `capture-start.cmd` / `capture-end.cmd` | session start / session end (Claude Code only) | Launchers that name their event and run `capture.sh`, or the capture action of `atmina.ps1` on Windows without Git Bash. |
| `orient.cmd`, `record-write.cmd`, `record-compaction.cmd`, `nudge.cmd` | as their scripts (Claude Code) | Launchers that run the matching `.sh` script, or `atmina.ps1` on Windows without Git Bash. |
| `atmina.ps1` | as the launchers | The Windows PowerShell handler for orientation, the counters and the nudge. In the Claude Code plugin it also has the capture action, which does what `capture.sh` does. |
| `collector.mjs` | started by the capture command once enabled; run by you to enable it or read its status | The local session collector, run with Node.js. See "Local session capture" below. |
| `memory.sh`, `memory.ps1`, `post-tool.cmd`, `cleanup.cmd` | after tool calls, before compaction and at session end (Grok Build) | Grok's orientation, counters and per-session cleanup, described under Grok Build above. No network requests. |
| `hooks.json` / `codex.json` | — | The hook manifests. Only the Claude Code plugin's `hooks.json` registers the capture command. |

**Claude Code and Codex write** two small counter files, each holding a
number. They live in the plugin data directory your editor provides
(`CLAUDE_PLUGIN_DATA`, or `PLUGIN_DATA` on Codex), falling back to a
temporary directory. They are never transmitted.

Cursor gets orientation before each prompt, in both the IDE and Agents window,
using its native hook schema and context format. Each prompt re-reads the
repository binding, including after compaction; no hook state is stored.
Claude Code uses a small shell/batch launcher; Codex selects a separate hook
manifest with a Windows command override. The Windows handler uses built-in
Windows PowerShell 5.1, without global Node, Python, WSL, or Git Bash, for
orientation, the counters and the nudge. Only the local session collector
needs Node.js, and only once you enable it. Claude Code can also run the POSIX
scripts through its Git Bash shell. Git is optional
for ambient orientation, and required to locate a repository’s binding.

An organisation's PowerShell Group Policy (for example, AllSigned) overrides
the launcher's process-level execution policy. It can prevent unsigned hooks
from running while the editor continues normally. Check the hook log and ask
your administrator for an approved policy or signing route.

Windows command execution is regression-tested with spaces and Unicode in
plugin and data paths. Full authenticated client lifecycle verification and
fresh-install/upgrade verification are still pending; do not interpret command
tests as a claim that every client/version has passed those checks.

## Local session capture

The Claude Code plugin carries a local session collector, `collector.mjs`,
for teams that use Atmina's Sessions. **Nothing changes on your device until
you enable it.** Until then the capture command writes nothing and starts
nothing, and the collector makes no network request.

You enable it yourself, once per device, by running the collector's enable
step from the plugin's `hooks/` directory with Node.js 22 or later:

```sh
node collector.mjs enable --team <team> --root <project directory>
```

It works only for a team that has local capture turned on in Atmina and a
member enrolled in Sessions. It signs the device in through Atmina's device
sign-in, then shows a notice that names your team and the projects you chose,
says who can read what is captured and how long it is kept, and links the
privacy notice and the export and erasure controls. It enables capture only
if you type yes at a terminal, and writes nothing otherwise.
`node collector.mjs status` reports what the collector is doing.

On Windows the enable step refuses for now, as `windows_unverified`, so
capture stays off there. The Windows access control list protection described
below applies once capture has been verified on Windows.

Once enabled:

- **What it reads.** The capture command reads only the input of the
  SessionStart and SessionEnd hooks: the session id, the prompt id, the
  event's name, the working directory, the transcript path, the permission
  mode, the effort level, the reason a session started or ended, the time of
  the event and, when Claude Code sends them, the model, the agent type and
  the session's title. Those are the fields `session_id`, `prompt_id`,
  `hook_event_name`, `cwd`, `transcript_path`, `permission_mode`,
  `effort`, `source`, `reason`, `timestamp`, `model`, `agent_type` and
  `session_title`. It never runs on a hook whose input carries a prompt or a
  response.
  The collector reads the Claude Code transcripts of live interactive
  sessions in the projects you chose. Historical sessions and unattended runs
  are excluded.
- **What it writes.** Only in the plugin data directory
  (`CLAUDE_PLUGIN_DATA`): its configuration, the device's sign-in, a
  short-lived inbox of hook input, and a queue of protected session revisions
  waiting to upload, at most 64 MiB for the team for at most 30 days. On
  macOS and Linux these files are readable only by you. On Windows they are
  protected by your user profile's access control list rather than by file
  modes.
- **What it sends.** Only to the Atmina address you enabled it against, and
  to the short-lived upload addresses Atmina returns: it registers each
  session, uploads each protected revision and confirms it. Automatic
  protection runs on the device before anything is queued or uploaded, but it
  may miss sensitive information.

When your team turns local capture off or your enrollment ends, the collector
stops and clears its pending copies once it learns of the change.
Uninstalling the plugin removes the collector, and Claude Code deletes the
plugin data directory by default. Neither deletes Claude Code's own
transcripts.

Node.js 22 or later is required on every system. On Windows, Git for Windows
is optional: without it, Claude Code runs the hooks through PowerShell.
Capture cannot yet be enabled on Windows: the enable step refuses there until
capture has been verified on a real Windows machine.

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
