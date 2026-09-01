# Seed bytes and shape

The live Knowledge Base must match
`docs/agents/atmina-memory-template/` (KB-rooted). Copy bytes; do not
re-author.

```text
wiki/README.md
wiki/kb-profile.md          # intensity default middle; NOT wiki/meta/
wiki/nav.yaml               # schema: 2; first section Start here, no generated: marker
wiki/decisions/README.md    # directory card: schema 1, title==H1, summary, NO evidence
wiki/procedures/README.md
wiki/facts/README.md
wiki/preferences/README.md
wiki/relationships/README.md
wiki/open-questions/README.md
chronicle/README.md         # working layer; empty until Observe
```

Nav (new seed; omit `wiki/kb-profile.md` from `pages` when that file was not
written):

```yaml
schema: 2
sections:
  - label: Start here
    pages:
      - wiki/README.md
      - wiki/kb-profile.md
  # generate_nav owns the rest; do not hand-author primitive sections that the
  # generator will replace if marked generated.
```

Directory-card frontmatter is exactly:

```yaml
schema: 1
title: <same characters as the first body H1>
summary: <one line>
```

No `evidence:` key. Nav uses `schema: 2`; cards use `schema: 1`. Those
integers name different documents.

`applies_to` on later durable pages is a **scalar string**, not a list.
This seed does not put `applies_to` on the cards.
