---
requirement_id: BF-003
title: Clarify Deadlock Definition and Recovery Semantics
priority: MUST
severity: BLOCKING
version: 0.2.0
date: 2026-09-04
status: OPEN
found_in_review: SPECIFICATION-REVIEW.md
---

# BF-003: Clarify Deadlock Definition and Recovery Semantics

**Requirement ID**: BF-003  
**Title**: Clarify Deadlock Definition and Recovery Semantics  
**Priority**: MUST (blocking for safety)  
**Severity**: 🔴 **BLOCKING**  
**Status**: OPEN  
**Date Identified**: 2026-09-04  

---

## Requirement Statement

The specification defines "deadlock" inconsistently across REQ-NEW-COLLISION-PREVENTION-1 and REQ-028, with ambiguous recovery behavior (wait 5 seconds? force exit at 10 seconds? collision validation needed?).

The system **shall provide a unified, precise definition of deadlock semantics**, recovery procedures, and metrics that are:
1. Consistent across all requirement files
2. Implementable without ambiguity
3. Testable with quantified acceptance criteria
4. Safe (collision-prevention maintained during recovery)

---

## Detailed Description

### Problem Statement

**Current ambiguities in deadlock definition**:

#### Ambiguity 1: Scope (Per-Vehicle vs. System-Wide)

**In REQ-NEW-COLLISION-PREVENTION-1**:
- "If waiting > 5 seconds, flag deadlock"
- "Vehicle stuck in zone → Force exit after 10s"
- Implies: Deadlock is **vehicle-level state** (individual vehicle waiting)

**In REQ-028 (State Display)**:
- "Deadlocks: 0" (displayed as count in collision panel)
- No definition of calculation
- Implies: Deadlock is **system-wide count** (cumulative events or current count?)

**Question**: Is "Deadlocks: 5" in display:
- A) 5 individual vehicles currently waiting? (per-vehicle state)
- B) 5 total deadlock events since simulation start? (cumulative events)
- C) 5 distinct deadlock situations? (system scenario count)

#### Ambiguity 2: Recovery Behavior Conflict

**In REQ-NEW-COLLISION-PREVENTION-1**:
- "Wait up to 5 seconds for zone to clear"
- "If waiting > 5s, flag deadlock"
- "Vehicle stuck in zone → Force exit after 10s"
- **Unspecified**: Does "force exit" mean:
  - Ignore collision prevention and proceed at full speed? (unsafe)
  - Proceed at reduced speed (50%?) with collision avoidance? (safe)
  - Skip vehicle? (data loss)

#### Ambiguity 3: Collision Safety During Recovery

**Critical question**: When vehicle is "forced to exit" after 10 seconds:
- **Can it cause collisions?** If conflict zone still occupied by opposite-direction vehicle, forcing exit violates Mode B safety
- **Must collision prevention still apply?** Or does emergency exit suspend safety checks?
- **What speed is used?** Full speed (unsafe), reduced speed (safe but unpredictable), or stopped (ineffective)?

---

## Inputs & Outputs

### Inputs

- **Current requirement definitions**: REQ-NEW-COLLISION-PREVENTION-1, REQ-028
- **Safety constraints**: Mode B requires collision prevention
- **Display expectations**: What metrics should be shown
- **Stakeholder guidance**: Deadlock priority and acceptable recovery

### Outputs

- **Unified deadlock definition**: Clear semantic definition
- **Updated requirement files**: BF-003-clarified definitions in REQ-NEW-COLLISION-PREVENTION-1 and REQ-028
- **Recovery procedure**: Step-by-step vehicle behavior during deadlock recovery
- **Metric definitions**: Precise formulas for "Deadlocks" count in display
- **Test cases**: Specific scenarios for deadlock detection and recovery

### Data Types

| Item | Type | Definition |
| --- | --- | --- |
| `deadlock_event` | Struct | Vehicle + wait_time + resolution_method |
| `deadlock_count` | Integer | Current or cumulative (to be defined) |
| `recovery_speed` | Float | % of normal speed during forced exit (e.g., 50%) |
| `max_wait_time` | Float | Hard timeout before forced exit (5s or 10s?) |

---

## Operating States & Transitions

### Vehicle Deadlock State Machine

```
[VEHICLE AT STOP LINE]
    ↓ (checks conflict zone)
    ├─ [ZONE EMPTY] → [PROCEEDS] (no deadlock)
    └─ [ZONE OCCUPIED] → [WAITING] → [TIME > 5s?]
        └─ YES → [DEADLOCK FLAGGED]
            ↓ (continues waiting)
            └─ [TIME > 10s?]
                └─ YES → [FORCED EXIT TRIGGERED]
                    ↓ (resolution method)
                    ├─ [COLLISION CHECK] → Safe? → [PROCEEDS at X% speed]
                    └─ [COLLISION CHECK] → Unsafe? → [CONTINUES WAITING] or [EMERGENCY STOP]
```

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Deadlock detection latency | ≤100 ms | Real-time identification |
| Deadlock wait timeout | 5 seconds (hard limit before flag) | Prevent indefinite waiting; matches current spec |
| Forced exit timeout | 10 seconds (absolute maximum) | Safety valve; prevent permanent deadlock |
| Recovery speed | TBD (50%? 20%?) | Must maintain collision avoidance |
| Deadlock resolution time | Typically 2–3 seconds (zone clearance) | Normal intersection traverse time |
| Event logging latency | ≤1 second | Record deadlock for metrics |

---

## Failure & Recovery Behavior

### Deadlock Detection & Recovery

| Scenario | Detection | Recovery | Outcome |
| --- | --- | --- | --- |
| **Normal Zone Clearance** | Vehicle waiting 2–4 seconds; zone clears | Vehicle proceeds normally (no deadlock flag) | ✅ No deadlock event |
| **Borderline Deadlock** | Vehicle waiting exactly 5 seconds | Flag deadlock event; continue waiting | ⚠️ Deadlock flagged; continue attempt |
| **Timeout at 10 Seconds** | Vehicle waiting > 10 seconds | Force exit procedure initiated | ⚠️ Deadlock resolved (forced) |
| **Collision Conflict** | During forced exit, conflict zone still occupied | DECISION NEEDED: proceed anyway? stop? | 🔴 SAFETY ISSUE - must specify |

### Recovery Procedures

**Procedure A: Conservative (Maintain Safety)**
- Forced exit proceeds at **50% speed**
- Collision detection still active
- If collision imminent: **revert to stopped** (continue waiting)
- Log as "deadlock with collision avoidance"

**Procedure B: Aggressive (Prioritize Flow)**
- Forced exit proceeds at **100% speed**
- Collision detection suspended during exit
- Assumes zone will clear due to timeout
- Log as "deadlock with forced exit"
- ⚠️ **RISK**: Could cause collisions

**Procedure C: Hybrid (Smart Clearing)**
- Forced exit proceeds at **75% speed**
- Collision detection active but with increased tolerance
- If immediate collision detected: **merge into adjacent lane** (if safe)
- Log as "deadlock with adaptive exit"

---

## Acceptance Criteria

### Deadlock Definition

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Unambiguous definition** | Definition written and agreed; covers per-vehicle and system-wide scope | Stakeholder sign-off on definition document |
| **Consistent across files** | REQ-NEW-COLLISION-PREVENTION-1 and REQ-028 use identical terminology | Grep search: verify "deadlock" definition consistent |

### Recovery Semantics

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Recovery procedure documented** | Step-by-step procedure for 5s and 10s timeouts specified | Review procedure document; verify completeness |
| **Safety specified** | Collision prevention behavior during recovery explicitly stated | Verify collision handling logic documented |
| **Speed specified** | Recovery speed (as % of normal) defined | Confirm speed percentage set (e.g., 50%) |

### Metric Definition

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **"Deadlocks" count defined** | Metric defined: cumulative events OR current count | Verify metric formula in REQ-028 |
| **Calculation formula** | Formula for "Deadlocks: N" explicitly specified with examples | Example: "Deadlocks = count of vehicles waiting > 5s during simulation" |

### Test Cases

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Test scenario 1: Normal clearance** | Vehicle waiting < 5s; zone clears; vehicle proceeds (no deadlock) | Run scenario; verify no deadlock flag |
| **Test scenario 2: Deadlock flagged** | Vehicle waiting > 5s; zone still occupied; deadlock flagged | Run scenario; verify flag at 5s mark |
| **Test scenario 3: Forced exit** | Vehicle waiting > 10s; exit forced at recovery speed; no collision | Run scenario; verify exit without crash |
| **Test scenario 4: Collision safety** | During forced exit, if collision would occur, verify avoidance | Run scenario; verify collision prevented |

---

## Verification Method

1. **Definition Review**
   - Stakeholders review proposed deadlock definition
   - Confirm per-vehicle vs. system-wide scope
   - Obtain written approval

2. **Recovery Procedure Selection**
   - Evaluate Procedures A, B, C
   - Select preferred approach (recommend A or C for safety)
   - Document rationale

3. **Specification Update**
   - Update REQ-NEW-COLLISION-PREVENTION-1 with unified definition
   - Update REQ-028 with metric formula
   - Add test cases to acceptance criteria

4. **Implementation Test**
   - Create test scenarios for each deadlock condition
   - Verify detection accuracy (5s threshold)
   - Verify recovery behavior (10s forced exit)
   - Verify collision avoidance maintained

5. **Metrics Validation**
   - Run 10-minute simulation with collision prevention enabled
   - Verify "Deadlocks" metric accurate
   - Verify all deadlock events logged

---

## Dependencies & Relationships

| Related Item | Relationship | Notes |
| --- | --- | --- |
| **REQ-NEW-COLLISION-PREVENTION-1** | **REFERENCED** | Primary source of deadlock definition; will be updated |
| **REQ-028** | **REFERENCED** | Deadlock metric displayed here; will be updated |
| **BF-001, BF-002** | **DEPENDS ON** | Once requirements extracted/numbered, can definitively update references |
| **Test Strategy** | **INFORMED BY** | Deadlock definition informs test plan design |

---

## Unresolved Questions

| Question | Impact | Status |
| --- | --- | --- |
| **Q1: Should deadlock recovery prioritize safety or flow?** | Affects procedure selection (A vs B vs C) | Awaiting stakeholder decision |
| **Q2: Is "forced exit" permitted to cause collisions?** | Safety-critical decision | Recommend NO (maintain collision prevention) |
| **Q3: What recovery speed is acceptable?** | Affects realism and throughput | Recommend 50% speed (conservative) |
| **Q4: Should deadlock events be logged/reported?** | Affects telemetry and debugging | Recommend YES (aids troubleshooting) |
| **Q5: Is 5-second threshold correct? Should it be configurable?** | Affects deadline | Recommend fixed 5s with config option for future |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ⏳ PENDING | Need to review definition options and recommend |
| System Architect | ⏳ PENDING | Need to confirm collision prevention approach during recovery |
| QA Lead | ⏳ PENDING | Need to validate test strategy for deadlock scenarios |
| Safety Lead | ⏳ PENDING | Need to approve collision safety during recovery (if applicable) |

---

**Requirement Status**: 🔴 **OPEN - BLOCKING IMPLEMENTATION**

*Critical safety definition required before Mode B (Opposing Simultaneous) implementation can proceed.*
