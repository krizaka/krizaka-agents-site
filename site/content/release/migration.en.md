---
title: "Krizaka Agents 1.0: environment variable migration (draft)"
description: "Unpublished draft listing every old-to-new environment variable alias in Krizaka Agents 1.0, checked against the contract."
---

**Draft notice** — This migration reference accompanies the [1.0 architecture and measures draft](/v1/). It is unpublished and describes an internal naming transition; there is nothing to buy or to request here.

### § 1 — Role prefixes and provider neutrality

Variables are named after the role a subsystem plays rather than the organisation prefix or the specific vendor behind an adapter. During the transition release, every legacy variable resolves through the single alias table with a warning pointing to the new name; after that release, legacy names are refused at startup.

### § 2 — Complete alias table

Every entry below is generated directly from the environment contract snapshot and sorted alphabetically by the legacy variable name.

<!--migration-aliases-->

### § 3 — Contract verification

An automated suite compares the site's structured migration table key for key against the environment contract source so no alias can drift silently or be omitted by hand.
