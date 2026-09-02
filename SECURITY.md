# Security policy

## Reporting a vulnerability

Email **security@atmina.ai** with enough detail to reproduce the issue. Please
do not open a public issue for a suspected vulnerability, and please do not
include working exploit code in the first message.

We aim to acknowledge a report within two business days (Australian Eastern
Time) and to tell you our assessment and intended fix within ten.

## Scope

This repository contains **generated client-side artifacts**: plugin
manifests, agent skills, and four short shell scripts that run as editor
hooks. Reports about those files belong here.

The hosted service at `https://atmina.ai` — authentication, tenancy, storage, and
search — is a separate system. Vulnerability reports about it go to the same
address, but they are not tracked in this repository's issues.

## What the hooks do

Every executable file in this repository is listed in README.md under "What
the hooks do", along with what it reads, what it writes, and where. Nothing
here makes a network request of its own; the plugin's only network
counterparty is the MCP endpoint declared in its manifest.
