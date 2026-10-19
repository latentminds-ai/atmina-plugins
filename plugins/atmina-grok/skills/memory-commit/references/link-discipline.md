# Link discipline

Every wiki-to-wiki reference is a markdown link or an evidence entry —
never a bare path in prose or inline code. Bare paths render as text and
do not traverse.

Durable pages never embed app or published URL schemes. Friendly slugs
are a render-time projection, not content. Write the wiki path as a
markdown link (`[label](other-page.md)`), or as a typed evidence entry
with a body citation.

Span links follow the pin recipe: the filename then `#Ln-Lm`, **after**
the `[@id]` marker. A bare `#L…` fragment is classified external and
opens nothing. A link that comes before its marker binds to nothing.

`source:` may name a chronicle path as prose provenance. That path is
still not a `wiki-page` locator, and a bare chronicle path in the body
is still not a link — if the body should point at the session note,
write a markdown link, not inline code.
