# Security policy

## Reporting a vulnerability

Email **security@atmina.ai** with enough detail to reproduce the issue. Please
do not open a public issue for a suspected vulnerability, and please do not
include working exploit code in the first message.

We aim to acknowledge a report within two business days (Australian Eastern
Time) and to tell you our assessment and intended fix within ten.

## Scope

This repository contains **generated client-side artifacts**: plugin
manifests, agent skills, the scripts and launchers that run as editor hooks,
and the Claude Code plugin's local session collector. Reports about those
files belong here.

The hosted service at `https://atmina.ai` — authentication, tenancy, storage, and
search — is a separate system. Vulnerability reports about it go to the same
address, but they are not tracked in this repository's issues.

## What the hooks do

Every executable file in this repository is listed in README.md under "What
the hooks do", along with what it reads, what it writes, and where. The
orientation, counter and nudge hooks make no network request of their own.

The Claude Code plugin also carries a local session collector,
`collector.mjs`, started by the capture command: `capture.sh`, its two
launchers `capture-start.cmd` and `capture-end.cmd`, and the capture action
of `atmina.ps1`. Nothing changes until a member enables the collector on a
device; until then the capture command writes nothing, starts nothing and
exits. Once a member enables it, the capture command reads only the input of
the SessionStart and SessionEnd hooks, and the collector reads that member's
live Claude Code transcripts in the projects they selected, writes a
protected local queue in the plugin data directory, and sends protected
session revisions to the Atmina address it was enabled against and to the
short-lived upload addresses Atmina returns for them. README.md under "Local
session capture" says exactly what it reads, writes and sends.

The collector requires Node.js 22 or later on every system; Git for Windows
is optional. On macOS and Linux its files are readable only by their owner.
On Windows they are protected by the user profile's access control list
rather than by file modes, once capture has been verified there; until then
the enable step refuses on Windows as `windows_unverified`, so the collector
stays off. Apart from the collector, the plugin's only
network counterparty is the MCP endpoint declared in its manifest.
