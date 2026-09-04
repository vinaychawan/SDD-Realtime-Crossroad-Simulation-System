---
requirement_id: REQ-005
title: Signal Coordination - TWO MODES SUPPORTED
priority: MUST
version: 0.2.0
date: 2026-09-03
status: APPROVED
---

# REQ-005: Signal Coordination - TWO MODES SUPPORTED

**Requirement ID**: REQ-005  
**Title**: Signal Coordination - TWO MODES SUPPORTED  
**Priority**: MUST (blocking for safety)  
**Status**: APPROVED  
**Updated**: 2026-09-03  

---

## Requirement Statement

The system **shall support TWO signal coordination modes**, configurable at startup:

1. **Mode A: Strict Mutual Exclusion** (traditional, conservative)
2. **Mode B: Opposing Directions Simultaneous** (modern, higher throughput)

---

## Detailed Description

### Mode A: Strict Mutual Exclusion

**Configuration Value**: `STRICT_MUTUAL_EXCLUSION`

- At most ONE direction has green signal at any time
- NORTH and SOUTH alternate in priority
- EAST and WEST alternate in priority
- NORTH/SOUTH cycle independent from EAST/WEST cycle
- **Use case**: Conservative intersection management, simpler logic
- **Traffic throughput**: Moderate (one direction at a time)
- **Complexity**: Low (simple state machine)

### Mode B: Opposing Directions Simultaneous

**Configuration Value**: `OPPOSING_SIMULTANEOUS`

- NORTH and SOUTH can BOTH be green simultaneously
- EAST and WEST can BOTH be green simultaneously
- BUT cross-direction pairs are mutually exclusive:
  - If N/S green: E/W must be RED
  - If E/W green: N/S must be RED
- **Use case**: Higher throughput, balanced two-way traffic
- **Traffic throughput**: Higher (two directions can move simultaneously)
- **Complexity**: Medium (requires collision prevention logic per REQ-NEW-COLLISION-PREVENTION-1)

---

## Configuration Parameters

| Parameter | Type | Values | Default | Selection Timing |
| --- | --- | --- | --- | --- |
| `signal_coordination_mode` | String | `STRICT_MUTUAL_EXCLUSION` \| `OPPOSING_SIMULTANEOUS` | `STRICT_MUTUAL_EXCLUSION` | Startup only; cannot change mid-simulation |

---

## Inputs & Outputs

### Inputs

- **Configuration selection**: User selects signal coordination mode at simulation start
- **Traffic state**: Current vehicle positions, speed, destination direction

### Outputs

- **Signal state per direction**: NORTH, SOUTH, EAST, WEST each can be RED, GREEN, or AMBER
- **State update frequency**: 100 Hz (physics simulation tick rate)

### Constraints

- **Constraint C1**: Signal state must be updated deterministically based on mode selection
- **Constraint C2**: No mode switching during active simulation
- **Constraint C3**: Transitions between states must be smooth and coordinated

---

## Operating States & Transitions

### State Diagram: Mode A (Strict Mutual Exclusion)

```
[NORTH GREEN] → [NORTH AMBER] → [ALL RED] → [SOUTH GREEN] → [SOUTH AMBER] → [ALL RED] → [EAST GREEN] → ... → back to NORTH GREEN
```

**Timing**: Configurable green/red durations per direction (default 30 sec green, 30 sec red)

### State Diagram: Mode B (Opposing Simultaneous)

```
[N+S GREEN, E+W RED] → [N+S AMBER, E+W RED] → [ALL RED] → [E+W GREEN, N+S RED] → [E+W AMBER, N+S RED] → [ALL RED] → back to [N+S GREEN, E+W RED]
```

**Constraint**: N/S and E/W cycles are mutually exclusive; never both N/S green AND E/W green.

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Signal update frequency | 100 Hz (tied to physics tick) | Deterministic timing |
| Min green duration | 10 seconds | Sufficient for vehicle flow |
| Max green duration | 60 seconds | Prevents excessive queue buildup |
| Amber duration | 3 seconds (fixed) | Standard traffic light duration |
| Red/Green transition latency | ≤ 100 ms | Imperceptible to users |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Signal state machine stuck | Reset to ALL RED, then NORTH GREEN | Safety default (no movement in doubt) |
| Deadlock (vehicles waiting > 5 sec) | Flag in collision statistics; continue simulation | Logged for investigation; does not crash system |
| Invalid mode configuration | Reject at startup; display error; require user to reselect | Prevent configuration errors |

### Error Handling

- **Invalid mode value**: Reject during configuration; prompt user to select valid mode
- **Mode change mid-simulation**: Ignored (no-op); inform user in logs that change was rejected
- **Signal timing conflict**: Use fallback: all signals RED until resolved

---

## Acceptance Criteria

### Mode A: Strict Mutual Exclusion

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **One direction green at a time** | Sampled at 1 Hz for 10 min; never >1 direction GREEN simultaneously | State machine test: cycle through full sequence, verify invariant |
| **Directional alternation** | NORTH and SOUTH alternate in cycle; EAST and WEST alternate in cycle | Automated state verification over 10 cycles |
| **Independent cycles** | N/S cycle independent from E/W cycle; both cycle continuously | Observe cycle timing; verify not synchronized |

### Mode B: Opposing Simultaneous

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Opposing pairs allowed** | N GREEN + S GREEN (simultaneously); E GREEN + W GREEN (simultaneously) allowed | State snapshot: observe N+S both GREEN for ≥10s |
| **Cross-direction exclusion** | (N GREEN OR S GREEN) AND (E GREEN OR W GREEN) = FALSE always | Invariant check: sample state 1000 times over 5 min; never both TRUE |
| **Collision prevention active** | When Mode B active, REQ-NEW-COLLISION-PREVENTION-1 must also be active | Verify collision zone tracking enabled; verify vehicles stop as required |

### General Acceptance

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Mode selection at startup** | User can select mode before simulation starts | Configuration UI test: both modes selectable and accepted |
| **Mode persistence** | Selected mode applies for entire simulation duration | Run 10 min simulation; verify mode does not change |
| **Mode default** | If not specified, default to `STRICT_MUTUAL_EXCLUSION` | Startup test without explicit mode config |

---

## Verification Method

1. **Configuration Test**
   - Start simulation with Mode A → verify one-direction-at-a-time behavior
   - Start simulation with Mode B → verify opposing pairs allowed
   - Attempt to change mode mid-simulation → verify rejected/ignored

2. **State Machine Test**
   - Run state machine for 10 minutes at 100 Hz
   - Log all state transitions
   - Verify no invalid state combinations occur

3. **Simulation Test**
   - Load each mode with standard traffic scenario
   - Run 10 minutes
   - Verify no collisions in Mode A
   - Verify collision prevention working in Mode B (vehicles stop at conflict zone)

4. **Performance Test**
   - Verify signal updates do not exceed 100 ms latency
   - Verify no visual glitches during transitions
   - Verify memory usage stable over 10 min runtime

---

## Dependencies & Relationships

| Related Requirement | Relationship | Notes |
| --- | --- | --- |
| **REQ-NEW-COLLISION-PREVENTION-1** | **BLOCKS** | Mode B requires collision prevention logic to be active and functional |
| **REQ-027** | **REFERENCED BY** | Signal coordination mode selection exposed in UI controls |
| **REQ-028** | **REFERENCED BY** | Current signal state displayed in real-time state display |

---

## Unresolved Questions

| Question | Answer | Status |
| --- | --- | --- |
| What happens if collision prevention fails in Mode B? | System falls back to Mode A or ALL RED state | CLARIFIED: Fallback to safe state |
| Can vehicles in queue wait more than 5 seconds? | No; 5 seconds is hard limit before deadlock flag | CLARIFIED: Hard constraint per REQ-NEW-COLLISION-PREVENTION-1 |
| Is signal timing (green/red duration) configurable per direction? | Yes, in REQ-027 UI controls | CROSS-REF: REQ-027 |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ✅ APPROVED | Requirement unambiguous; testable acceptance criteria defined |
| System Architect | ✅ APPROVED | Design feasible; state machine well-defined |
| QA Lead | ✅ APPROVED | Test strategy clear; verification methods specified |

**Requirement Status**: ✅ **APPROVED and READY FOR IMPLEMENTATION**
