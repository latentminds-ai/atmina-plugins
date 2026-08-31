# Changelog

## v0.279.1

Release v0.279.1
Compare: https://github.com/latentminds-ai/atmina-mono/compare/v0.279.0...v0.279.1

Bug fixes:
- fix(mcp): bound the rebuild reconcile pass and enforce its reservation (LAT-1913) (4b8f1336)
- fix(mcp): end an errored rebuild whose freeze has lapsed (LAT-1914) (3be2e44c)

Other:
- docs: de-gate retrieval region and record the LAT-1667 legal verdict (351df0c8)

## v0.279.0

Release v0.279.0
Compare: https://github.com/latentminds-ai/atmina-mono/compare/v0.278.0...v0.279.0

Features:
- feat(skills): Maintain reports durable pages that have never been recalled (LAT-1907) (e3285d57)

Bug fixes:
- fix(kb-view): derive menu sections for folders outside the CodeWiki set (LAT-1905) (9ef33901)
- fix(plugins): gate every publishable skill instead of only the master (LAT-1906) (775d0882)

Other:
- docs: split health wiring into 3a/3b and require the origin caveat (LAT-1902) (c216995f)
- docs: spec the atmina-memory pack distribution payload (LAT-1902) (f7e346eb)

## v0.278.0

Release v0.278.0
Compare: https://github.com/latentminds-ai/atmina-mono/compare/v0.277.0...v0.278.0

Bug fixes:
- fix(evals): treat keyword fallback hits as indexed despite incomplete notes (LAT-1785) (cdabb12a)
- fix(evals): wait out incomplete recall and treat 403 as erased (LAT-1785) (17210033)
- fix(site): link /docs from every public page, advertise the docs sitemap, and noindex the dev host (LAT-1904, LAT-1616) (f55af08b)

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
