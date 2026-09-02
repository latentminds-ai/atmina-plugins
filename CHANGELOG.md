# Changelog

## v0.288.0

No plugin changes; republished for Atmina v0.288.0.

## v0.287.0

No plugin changes; republished for Atmina v0.287.0.

## v0.286.0

No plugin changes; republished for Atmina v0.286.0.

## v0.285.0

No plugin changes; republished for Atmina v0.285.0.

## v0.284.0

No plugin changes; republished for Atmina v0.284.0.

## v0.283.1

- feat(plugins): prove the published artifact from outside the publish job

## v0.283.0

No plugin changes; republished for Atmina v0.283.0.

## v0.282.8

- feat(plugins): retire "Total Recall", backfill the missing changelog entry, name the Windows limit

## v0.282.7

- fix(plugins): gate the changelog entry we write, not the history we inherit

## v0.282.6

- feat(plugins): license the public repo, scrub internal references, ship real releases
- fix(plugins): run bundled hooks through sh so a 644 checkout still fires

## v0.282.5

Release v0.282.5
Compare: https://github.com/latentminds-ai/atmina-mono/compare/v0.282.4...v0.282.5

Other:
- chore(auth): quieten the compat logging, keep the failure line (LAT-1463) (5de21ee9)

## v0.282.4

Release v0.282.4
Compare: https://github.com/latentminds-ai/atmina-mono/compare/v0.282.3...v0.282.4

⚠ Breaking changes:
- fix(auth)!: key the Delegated Grant on (family, client), not family alone (LAT-1463) (c3910289)

Bug fixes:
- fix(auth)!: key the Delegated Grant on (family, client), not family alone (LAT-1463) (c3910289)

Other:
- docs(site): curate the public release note for v0.282.4 (LAT-1463) (da7dee9b)

## v0.282.3

Release v0.282.3
Compare: https://github.com/latentminds-ai/atmina-mono/compare/v0.282.2...v0.282.3

Features:
- feat(auth): log the error a failed token exchange returned (LAT-1463) (dce57ae0)

## v0.282.2

Release v0.282.2
Compare: https://github.com/latentminds-ai/atmina-mono/compare/v0.282.1...v0.282.2

Features:
- feat(auth): log one line per OAuth loopback-compat decision (LAT-1463) (d2c4846c)

Bug fixes:
- fix(auth): accept private-use redirect schemes from native clients (LAT-1463) (75f5a564)

Other:
- docs(site): curate the public release note for v0.282.2 (LAT-1463) (53d97366)

## v0.282.1

Release v0.282.1
Compare: https://github.com/latentminds-ai/atmina-mono/compare/v0.282.0...v0.282.1

⚠ Breaking changes:
- fix(auth)!: restore client compatibility after the 1.7 cut (LAT-1463) (a3be66a7)

Bug fixes:
- fix(auth): rewrite localhost loopback redirects to the IP literal (LAT-1463) (23005271)
- fix(auth)!: restore client compatibility after the 1.7 cut (LAT-1463) (a3be66a7)

Other:
- docs(site): record the v0.282.1 publish decision in the ledger (04694cd5)
- docs(site): curate the public release note for v0.282.1 (LAT-1463) (a300631c)

## v0.282.0

Release v0.282.0
Compare: https://github.com/latentminds-ai/atmina-mono/compare/v0.281.0...v0.282.0

⚠ Breaking changes:
- fix(auth)!: close five defects the adversarial review confirmed (LAT-1463) (a6f806b2)
- fix(auth)!: defer the RFC 8628 device flow to LAT-1898 (LAT-1463) (e12cee2b)
- feat(auth)!: cut over the OAuth/MCP boundary to Better Auth 1.7 (LAT-1463) (d3b40888)

Features:
- feat(write): tell the writer, on the response, when a durable claim carries no locator — and count it (LAT-1926) (4b63c72d)
- feat(evidence): diagnose the entries on a page that carry no resolvable locator (LAT-1926) (b670cee7)
- feat(check): conformance-test the pack invariants in check:pack-skills (LAT-1925) (f3ae101c)
- feat(move): report the pages that cite a moved memory as evidence (LAT-1927 AC 3) (92688344)
- feat(versioning): retain a pin its citing page can no longer resolve (LAT-1927 AC 2) (47304b20)
- feat(auth): scope ceiling at the tool boundary, grant activation and revocation routes (LAT-1463) (753e2774)
- feat(auth)!: cut over the OAuth/MCP boundary to Better Auth 1.7 (LAT-1463) (d3b40888)

Bug fixes:
- fix(ci): move migration segmentation to a side-effect-free lib module (LAT-1463) (ca244db8)
- fix(ci): stop a mentioned statement-breakpoint from splitting a migration (LAT-1463) (65dc2946)
- fix(auth)!: close five defects the adversarial review confirmed (LAT-1463) (a6f806b2)
- fix(auth)!: defer the RFC 8628 device flow to LAT-1898 (LAT-1463) (e12cee2b)
- fix(auth): reconcile the trusted-client seed and the 1.7 erasure path (LAT-1463) (1c0945f4)

Other:
- docs(site): tell connected agents they will re-authorise once after v0.282.0 (LAT-1463) (31ec424e)
- docs(site): add the move, write-diagnostic and operating-model lines to the v0.282.0 note (LAT-1925) (7faffeb8)
- docs(site): curate the public release note for v0.282.0 (LAT-1902) (4da51862)
- docs(operating-model): OM-17 — the write diagnostic says structure, never truth, on every surface (LAT-1926) (358dc110)
- test(mcp): conformance-test the baseline invariants on every surface that carries them (LAT-1925) (5947092c)
- docs(skills): declare the same on the pack side and gate the session note on consent (LAT-1925) (60f9f7c2)
- docs(mcp): declare the scope differences and rulings on every baseline surface (LAT-1925) (3454f988)
- docs(adr): 0061 — operating-model invariants are conformance-tested per surface (LAT-1925) (2615d3da)
- docs(skills): let the archive step check its scan against evidence_citers (LAT-1927 AC 5) (1d97455e)
- docs(move): say what a move does to other pages, exactly (LAT-1927 AC 4) (02c33011)
- test(move): establish the evidence-citer blast radius of a move (LAT-1927 AC 1) (cafb95b5)
- test(web): make the disconnected-date assertion locale-independent (LAT-1463) (b3b18ec7)
- chore(deps): waive the 1.7.2 release-age gate on Markus's overrule (LAT-1463) (169b8735)
- docs(auth): record the adversarial review and Markus's ratifications (LAT-1463) (9b74ad32)
- docs(auth): record the device-flow deferral (LAT-1463) (138dcf11)

## v0.281.0

Release v0.281.0
Compare: https://github.com/latentminds-ai/atmina-mono/compare/v0.280.0...v0.281.0

Features:
- feat(release): enforce reviewed-head delegation (LAT-1918) (574a1b31)
- feat(plugins): task-boundary hooks across the three clients (LAT-1910, LAT-1911) (f13f17f9)
- feat(plugins): publish the atmina-memory pack to all three clients (LAT-1908) (46215dda)
- feat(skills): Maintain reports link health with the scope it did not check (LAT-1909) (e2116571)

Bug fixes:
- fix(mcp): bound rebuild continuations under paid Worker envelope (LAT-1918) (9bcc80c4)
- fix(web): move the local-dev invitation fixture dates past the calendar (LAT-1919) (d7771c27)

Other:
- ci: prove rebuild limits and eval waiver in staged releases (LAT-1918) (348c6d02)
- docs(agents): vendor the jakubkrehel interface skills at a pinned ref (0425f033)
- docs: rescue three more stranded documents from feature worktrees (ee74d1dc)
- docs: commit 20 plans, research notes, and lore entries stranded in the primary tree (5a635df7)

## v0.280.0

Release v0.280.0
Compare: https://github.com/latentminds-ai/atmina-mono/compare/v0.279.1...v0.280.0

Bug fixes:
- fix(kb): serve wiki/README.md as a published KB's home route (LAT-1916) (11014a23)

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
