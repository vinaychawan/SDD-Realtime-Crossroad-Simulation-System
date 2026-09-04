---
requirement_id: NF-004
title: Enhance State Diagram Clarity with Formal Notation
priority: NICE-TO-FIX
severity: MINOR
version: 0.2.0
date: 2026-09-04
status: OPEN
found_in_review: SPECIFICATION-REVIEW.md
---

# NF-004: Enhance State Diagram Clarity with Formal Notation

**Requirement ID**: NF-004  
**Title**: Enhance State Diagram Clarity with Formal Notation  
**Priority**: NICE (nice to fix - improves documentation clarity)  
**Severity**: 🟡 **MINOR**  
**Status**: OPEN

---

## Requirement Statement

Complex state diagrams use ASCII art notation, which is:
- Hard to read and maintain
- Lacks transition guard conditions
- Lacks timing annotations

The system **should consider upgrading state diagrams** to formal notation (Mermaid or similar) for improved clarity and maintainability.

---

## Current Example

```
[NORTH GREEN] → [NORTH AMBER] → [ALL RED] → [SOUTH GREEN] → ...
```

---

## Proposed Upgrade (Mermaid)

```mermaid
stateDiagram-v2
  [*] --> NORTH_GREEN
  NORTH_GREEN --> NORTH_AMBER: after 30s
  NORTH_AMBER --> ALL_RED: after 3s
  ALL_RED --> SOUTH_GREEN: immediate
  SOUTH_GREEN --> SOUTH_AMBER: after 30s
  SOUTH_AMBER --> ALL_RED: after 3s
```

---

## Affected Requirements

- REQ-005: Mode A and Mode B state diagrams
- REQ-NEW-COLLISION-PREVENTION-1: Conflict zone state machine

---

## Implementation Notes

- **Mermaid**: Markdown-native, renders in GitHub/GitLab
- **Tools**: Draw.io, Lucidchart for more complex diagrams
- **Recommendation**: Mermaid for ASCII-replaceable diagrams

**Effort**: 2–3 hours (optional enhancement; low priority)

---

## Sign-Off

| Role | Status |
| --- | --- |
| Documentation Lead | ⏳ PENDING |

