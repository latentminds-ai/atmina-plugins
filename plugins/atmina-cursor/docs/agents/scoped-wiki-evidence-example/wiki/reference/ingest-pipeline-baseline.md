---
schema: 1
title: Ingest pipeline baseline
summary: What the ingest pipeline treats as its production baseline, and the pinned procedure step that says so.
topics:
  - ingest-pipeline
evidence:
  - id: run-procedure
    type: wiki-page
    path: guides/run-the-ingest-pipeline.md
    pinned_version: 3
    span_sha256: 3dfdc8048075493d73397656cae586469b9f320660b2e9d162e3463fa4ceca3d
    note: The run procedure, pinned at the version read on 2026-08-26; the span is its five numbered steps.
  - id: registry-policy
    type: official-document
    url: https://example.test/registry/publication-policy
    retrieved: 2026-08-26
    note: The registry policy that defines a published baseline. Outside Atmina, so it is recorded rather than resolved.
---

# Ingest pipeline baseline

The production baseline is the newest tag published to the shared registry.
Runs start from that tag; a run started from a working copy is a rehearsal and
its output is not published.

## What the procedure says

The run procedure fetches the newest published tag and runs the pipeline
against that fetched baseline rather than a working copy, and it records the
tag in the run log before publishing anything. [@run-procedure] The pinned
span is [the five numbered steps](../guides/run-the-ingest-pipeline.md#L29-L33).

## What the registry defines

A baseline is a tag published under the registry's publication policy, which
also names who may publish one. [@registry-policy]

## What this record does not settle

Whether any particular past run actually started from a published tag. This
record pins what the procedure requires; it says nothing about what happened on
a given day. A run log entry is the evidence for that, and there is none here.
