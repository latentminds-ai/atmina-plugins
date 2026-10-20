# Add Atmina to Grok Bot

Setup content version: 0.351.0.

Grok Bot is separate from Grok Build and Cursor IDE. Installing the CLI plugin
on Windows does not connect a Bot. Its remote MCP connections run on the Bot
backend and belong to the Cursor account signed in to Grok Bot.

## Connect Atmina

Ask your Bot:

> Add a custom remote HTTPS MCP server named atmina at https://mcp.atmina.ai/mcp.
> Use browser OAuth with dynamic client registration. Do not add a bearer
> token, client secret, or terminal command. Show me the sign-in request.

Confirm the connector addition when asked and complete Atmina's sign-in in
your browser. Installing a connector and authenticating it are separate steps.
For a Team Bot, its owner or manager can use the Bot's Plugins setup card and
Add custom → Remote HTTPS. Each teammate signs in with their own Atmina account.

After signing in, ask the Bot to call Atmina's whoami and list_kbs. Then name
the Knowledge Base you want and ask it to search that base. A connected badge
or a listed server alone is not a successful tool call.

## Add the memory skill

Open [the Atmina skill](grok-bot/skills/atmina-kb-mcp/SKILL.md), and provide its
contents to the Bot. Ask it to save a private skill named atmina-kb-mcp with
the description and Markdown body from that file. This is one self-contained
skill; it requires the connected Atmina MCP tools. Do not put access tokens
in the skill.

Check Connect apps → Your plugins → Manage plugins and skills → Private skills.
In a new conversation, select the skill with / and ask the Bot to search a
Knowledge Base you can access. Private skills are shared across your Bots.

The other memory-pack skills have supporting files and are not imported by
this route. Grok Bot's current tools do not import a local folder or URL as a
plugin package. Catalog plugins can contain skills, but publishing this
repository does not create a Grok Bot catalog listing. Catalog distribution
requires a separate provider submission and verification.

## Behavior and updates

This setup gives the Bot MCP tools and a skill you can invoke. It does not
register local SessionStart or PostToolUse hooks, enforce a first-turn recall,
read your Windows repository binding automatically, count writes, or issue
compaction reminders. Local CLI hooks and scheduled Bot routines are different
features. Hook execution inside catalog plugins remains unverified.

Name the Knowledge Base explicitly in a task. If repository context matters,
provide its reviewed .atmina.yaml binding to the Bot. A Windows path is not
automatically a path on the Bot's computer.

After a tagged Atmina release, replace the saved skill with that release's
file, keeping its name. Reconnect the MCP server if new tools do not appear,
then repeat whoami, list_kbs, and a scoped search in a new conversation.

References: [connect plugins](https://cursor.com/help/grok-bot/connect-plugins),
[Team Bot connectors](https://docs.x.ai/grok-bot/team-bots), and
[private skills](https://docs.x.ai/grok-bot/skills-routines-and-automations).
