---
adr_id: ADR-009
title: Requirement Numbering and Code-Module Traceability Convention
status: PROPOSED
date: 2026-09-04
---

# ADR-009: Requirement Numbering and Code-Module Traceability Convention

**Status**: 🟡 PROPOSED
**Date**: 2026-09-04
**Deciders**: System Architect, Requirements Engineer

---

## Context

[BF-002](../../specs/blocking/BF-002-establish-numbering-scheme.md) identified inconsistent
requirement ID formats across the specification (`REQ-005`, `REQ-NEW-E1`,
`REQ-NEW-COLLISION-PREVENTION-1`), which complicates mapping requirements to code modules,
test files, and this architecture's traceability tables (see
[ARCHITECTURE.md §7](../ARCHITECTURE.md#7-requirement--architecture-traceability)).

## Decision

1. This architecture and its ADRs reference requirements **by their current documented IDs**
   (e.g., `REQ-005`, `REQ-NEW-E1`) rather than pre-empting BF-002's resolution — architecture
   traceability tables are ID-format-agnostic (a lookup table, not embedded in code).
2. **Code modules and interfaces are named by responsibility, never by requirement ID**
   (e.g., `SignalController`, `ConflictZoneManager` — not `Req005Module`). This decouples the
   codebase from whichever numbering scheme BF-002 ultimately selects, so BF-002's resolution
   requires **zero code changes** — only documentation/traceability-table updates.
3. Recommend (non-blocking for this architecture) that BF-002 adopt **Option A (sequential
   `REQ-001..NNN`)** per its own stated recommendation, since a single monotonic sequence is
   the simplest key for the traceability tables in [ARCHITECTURE.md §7](../ARCHITECTURE.md#7-requirement--architecture-traceability)
   and any future automated traceability tooling (per [REC-001](../../specs/recommendations/REC-001-traceability-matrix.md)).

## Options Considered

| Option | Pros | Cons |
| --- | --- | --- |
| **A: Name code/interfaces by responsibility; keep a separate ID lookup table** ✅ selected | Architecture is stable regardless of when/how BF-002 resolves; no rename churn in code when numbering changes | Requires maintaining a lookup table (already produced in ARCHITECTURE.md §7) |
| **B: Name code/interfaces directly after requirement IDs (e.g., `Req005SignalController`)** | Immediate traceability from filename to requirement | Brittle — renumbering (BF-002's entire purpose) would force cascading code renames; couples architecture stability to a documentation decision still pending stakeholder sign-off |

## Rationale

BF-002 is explicitly an **open, unresolved** decision (three options, no sign-off yet). An
architecture that structurally depends on the outcome of an unresolved documentation decision
would itself become blocked by BF-002, defeating the purpose of proceeding to the
architecture phase in parallel with requirement-numbering cleanup. Option A isolates that
dependency to a single, easily-updated table.

## Consequences

- (+) This architecture can be approved and implementation can begin before BF-002 is
  formally resolved.
- (+) When BF-002 resolves, only [ARCHITECTURE.md §7](../ARCHITECTURE.md#7-requirement--architecture-traceability)
  and this ADR's references need updating — no code or interface renames.
- (-) Traceability from a requirement ID to its implementing code requires one indirection
  (via the lookup table) rather than being directly encoded in a filename.

## Traceability

```
BF-002 (inconsistent requirement numbering scheme, unresolved)
→ ADR-009: Responsibility-based naming + separate traceability lookup table
→ Component: (documentation convention; applies to all components)
```
