---
requirement_id: NF-001
title: Standardize Speed Unit Usage
priority: NICE-TO-FIX
severity: MINOR
version: 0.2.0
date: 2026-09-04
status: OPEN
found_in_review: SPECIFICATION-REVIEW.md
---

# NF-001: Standardize Speed Unit Usage

**Requirement ID**: NF-001  
**Title**: Standardize Speed Unit Usage  
**Priority**: NICE (nice to fix - low impact)  
**Severity**: 🟡 **MINOR**  
**Status**: OPEN

---

## Requirement Statement

Speed units vary inconsistently across the specification:
- **REQ-NEW-E4**: "50 km/h approach speed" (km/h units)
- **REQ-NEW-E4**: Speed reduction (% without units specified)
- **REQ-028**: "Avg Speed: 38 km/h" (km/h units)

The system **shall standardize on consistent speed units** throughout all specifications with explicit unit documentation.

---

## Proposed Standard

| Domain | Unit | Context |
| --- | --- | --- |
| **Vehicle speeds** | km/h | User-visible metrics and specifications |
| **Physics calculations** | m/s (convert to km/h for display) | Internal physics engine |
| **Timing** | ms (milliseconds) or seconds | Frame rates and delays |

---

## Resolution

1. Search all specifications for speed references
2. Replace with standardized units: **km/h for display, m/s for physics**
3. Add conversion factors: 1 m/s = 3.6 km/h
4. Add note in methodology section explaining unit choices

**Effort**: 1–2 hours (low priority)

---

## Sign-Off

| Role | Status |
| --- | --- |
| Requirements Engineer | ⏳ PENDING |

