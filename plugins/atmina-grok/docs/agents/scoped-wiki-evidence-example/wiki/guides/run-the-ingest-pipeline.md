---
schema: 1
title: Run the ingest pipeline
summary: How a production run of the mineralogy ingest pipeline is started from a tagged baseline in the shared registry.
topics:
  - ingest-pipeline
evidence:
  - id: registry-publication-policy
    type: official-document
    url: https://example.test/registry/publication-policy
    retrieved: 2026-08-26
    note: The registry policy that defines what a tagged baseline is and who may publish one.
---

# Run the ingest pipeline

A production run starts from a tagged baseline published to the shared
registry, so a result can be traced back to the pipeline that produced it. A
run started from a working copy is a rehearsal: useful, but its output is not
published.

## Before you start

You need read access to the shared registry and a writable scratch directory.
Nothing is installed on the operator's machine.

## Steps

1. List the published baselines and take the newest tag.
2. Fetch that tag from the shared registry into the scratch directory.
3. Write the tag and the fetch date into the run log.
4. Run the pipeline against the fetched baseline, never against a working copy.
5. Publish the output, quoting the tag recorded in step 3.

The registry policy sets what may be published as a baseline, and who may
publish one. [@registry-publication-policy]

## When a step fails

Stop, and say which step. Do not substitute a script found outside the
registry, even when its filename matches the one named here. A run that cannot
name the baseline it started from is a rehearsal, whatever it produced.
