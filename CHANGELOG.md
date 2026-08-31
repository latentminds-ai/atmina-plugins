# Changelog

## v0.277.0

Release v0.277.0
Compare: https://github.com/latentminds-ai/atmina-mono/compare/v0.276.1...v0.277.0

Features:
- feat(plugins): generate Codex skill, AGENTS.md, and MCP toml (LAT-953) (b5554605)
- feat(plugins): generate Cursor plugin, deeplink, and flip supportsPlugins (LAT-952) (a7d094bc)
- feat(chat): show Linear title; keep wire name as call key (f41c5ee7)
- feat(evals): pin retrieval eval to named provider profiles (LAT-1785) (0cbfba63)

Bug fixes:
- fix(plugins): keep version_n out of the live-tool-name parse (LAT-1873) (1aa0faeb)
- fix(mcp): reconcile pack contract claims (LAT-1873) (7af06bdb)
- fix(mcp): give the operator a force-abandon when the vendor misreports a dead rebuild (LAT-1876) (98223a98)

Other:
- docs: record W0 as closed — the four flips are executed and enforcing (LAT-1850) (4968e5ac)
- docs: correct sessions client locator (LAT-1850) (f258c392)
- docs: correct sessions execution boundary (LAT-1850) (8f1251d9)
- docs: reconcile sessions V1 plan with shipped W0 state (LAT-1850) (85097f65)
- docs: fix the sessions V1 close-off boundary and W0 prerequisites (LAT-1850) (86ca3ad9)

## v0.276.1

Release v0.276.1
Compare: https://github.com/latentminds-ai/atmina-mono/compare/v0.276.0...v0.276.1

Bug fixes:
- fix(plugins): authenticate atmina-plugins clone and allow first publish (LAT-956) (5ec9b826)
