# Propose-only linkify

W0-1 §7 item 11: every wiki-to-wiki reference is a markdown link or an
evidence entry — never a bare path in prose or inline code. Bare paths
render as text and do not traverse. Documents never embed app or
published URL schemes; friendly slugs are a render-time projection, not
content.

This pass **proposes**. It does not patch live pages.

## Find

1. `list_files({ kb_id })` — the catalog. A mention that does not appear
   as a live path is not a linkify candidate.
2. Read durable `wiki/` pages (and only those, unless the operator named
   a working-layer file).
3. Collect **bare-path mentions**: a catalog path written as prose or
   inline code, not already a markdown link `[label](target)` and not an
   evidence `path:` / `url:`.

A mention "resolves in the catalog" when `list_files` contains that
exact path, or the wiki-relative form (`facts/acme.md`) whose KB path is
`wiki/facts/acme.md`.

## Propose

For each hit, propose converting the bare path to a markdown link that
resolves **relative to the citing page's directory**, the way the viewer
opens it:

- from `wiki/reference/` to `wiki/guides/run.md` → `../guides/run.md`
- same directory → `sibling.md`

Span links (when the mention is a citation) still follow W0-1: filename
then `#Ln-Lm`, **after** the `[@id]` marker. A bare `#L…` is classified
external and opens nothing.

Do not propose app or published URL schemes. Do not invent a path that
is not in the catalog. Do not `write_file` the conversion.

List each proposal in the trail: page, the bare mention, the suggested
markdown link.
