# Health

The report's **Health** section. It describes the state of the store
itself, not of any one claim: what is durable but unused, and what is
structurally adrift. Everything here is observation. Health proposes
nothing, moves nothing, and writes nothing beyond the trail.

**This file defines the section's shape.** Later health signals extend it;
they do not redefine it. One section, one heading, one scope rule.

## Never recalled

A durable page that has never been returned by a search is memory the
organisation is paying to keep and getting nothing back from. Writing
discipline without recall discipline is half a system.

The step-5 walk already lists the catalog exhaustively
([repair.md](repair.md)). **Every catalog listing carries a
`Last seen in search` column**, and a page never returned by a search
reads `_never_`. Read the column that walk already returned.

Do not call `list_files` again for this. Do not reach for `search` — it is
relevance-scoped and not exhaustive, so a page missing from its results is
not evidence of anything.

Report, under `wiki/`:

- **how many** durable pages have never been recalled, and **which**;
- the same for pages not recalled since a date far enough back to matter,
  when the operator asked for that.

## Never recalled is not the same as not checked

Three states, and they must not collapse into one another:

| State | Means | Report as |
| --- | --- | --- |
| `_never_` in the column | The page has never been returned by a search | **Never recalled**, named |
| A timestamp | The page has been recalled, at that time | Not listed |
| The walk did not cover it | Outside `wiki/`, excluded, or the walk was scoped | **Not checked**, with the scope that excluded it |

A page the pass never looked at is never reported as healthy. Say what
was checked, then say what was found — in that order, so a number is
never read as covering more than it does.

## When everything has been recalled

Say so explicitly: *"Health — every durable page under `wiki/` has been
recalled at least once."* Do not omit the section.

An omitted section is indistinguishable from a pass that did not look,
and that ambiguity is the failure this section exists to prevent: a
Knowledge Base written to diligently, recalled never, and silent about it
for five days.

## Link health

Broken references and pages nothing links to. Both are computed by the
product already; this pass only has to ask for them.

```
get_context({ kb_id, include: ["link_health"] })
```

`include` is a list and `link_health` is Knowledge-Base scope only. The
block carries two whole-Knowledge-Base counts — `broken_reference_count`
and `unconnected_count`, never capped — plus lists clipped to ten entries
with their own `*_truncated` flags.

Report the two counts, the clipped examples, and whether each list was
truncated. A truncated list is reported as truncated, never as complete.

### Every count states what it did not check

**Binding, not a nicety.** Link health is computed over **content-origin
references only**. It cannot see references inside source-mirrored
content, and there is no option to widen it. On a Knowledge Base whose
material largely arrives through a connected source, it will therefore
report a clean bill of health it has not earned.

So every count carries its scope in the same breath:

> Broken references: 0 (content-origin references only; mirrored content
> not covered).

A count published without that qualifier is a defect. It is the same
failure as an omitted section, one layer down: a number that reads as
covering more than it does.

### An absent block is not a zero

Unrecognised `include` keys are dropped silently rather than refused, and
the block itself resolves to an honest empty when its dependency is
unavailable. Both look like calm.

If no `link_health` block comes back, report **not checked**, with the
reason if you have one. Never report zero broken references because the
tool returned nothing — that is asserting health from an absence of
evidence, which is exactly what the rest of this pack exists to prevent.
