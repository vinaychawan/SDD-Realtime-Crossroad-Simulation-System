---
requirement_id: REQ-NEW-COLLISION-PREVENTION-1
title: Safe Opposing-Green Operation
priority: MUST
version: 0.2.0
date: 2026-09-03
status: APPROVED
---

# REQ-NEW-COLLISION-PREVENTION-1: Safe Opposing-Green Operation

**Requirement ID**: REQ-NEW-COLLISION-PREVENTION-1  
**Title**: Safe Opposing-Green Operation  
**Priority**: MUST (safety-critical for Mode B)  
**Status**: APPROVED  
**Updated**: 2026-09-03

---

## Requirement Statement

When `signal_coordination_mode = OPPOSING_SIMULTANEOUS` and opposing directions both have green signals, the system **shall prevent vehicle-vehicle collisions** in the intersection zone through controlled entry management.

---

## Detailed Description

### Problem Statement

**Mode B (Opposing Simultaneous)** allows:
- NORTH + SOUTH both GREEN simultaneously
- EAST + WEST both GREEN simultaneously

**Safety Issue**: Vehicles from opposite directions could collide in the intersection center.

**Solution**: Define a **conflict zone** (intersection center) and prevent simultaneous occupancy by opposing-direction vehicles.

### Conflict Zone Definition

- **Location**: Centered at intersection center
- **Dimensions**: ~25m × 25m rectangle (configurable)
- **Coordinate system**: Intersection center = (0, 0)
- **Occupancy tracking**: Real-time list of vehicles in zone

### Collision Prevention Mechanism

```
[VEHICLE APPROACHING INTERSECTION]
    ↓
[NORTH or SOUTH?] → Check if opposite direction in conflict zone
    └─ YES → [STOP at stop line] → [Wait for zone to clear]
    └─ NO → [PROCEED]

[EAST or WEST?] → Check if opposite direction in conflict zone
    └─ YES → [STOP at stop line] → [Wait for zone to clear]
    └─ NO → [PROCEED]
```

### Entry Control Logic

1. **Detect**: Vehicle approaches conflict zone (lookahead 50m)
2. **Check**: Is opposite-direction vehicle in conflict zone?
3. **Decision**:
   - If **YES**: Vehicle stops at stop line; waits
   - If **NO**: Vehicle proceeds
4. **Monitor**: Continuous check; proceed when zone clears
5. **Timeout**: If waiting > 5 seconds, flag deadlock

---

## Configuration Parameters

| Parameter | Type | Values | Default |
| --- | --- | --- |
| `conflict_zone_size` | Float | 20–50 | 25 (meters) |
| `conflict_zone_enabled` | Boolean | true \| false | true (when Mode B active) |
| `max_wait_time` | Float | 2–10 | 5 (seconds) |
| `stop_line_distance` | Float | 10–50 | 20 (meters before intersection) |

---

## Inputs & Outputs

### Inputs

- **Vehicle position**: Current 3D location
- **Vehicle direction**: NORTH, SOUTH, EAST, WEST
- **Conflict zone occupancy**: Vehicles currently in zone
- **Signal state**: Current light status (GREEN/RED/AMBER)
- **Simulation mode**: Confirm OPPOSING_SIMULTANEOUS mode active

### Outputs

- **Entry decision**: PROCEED or STOP
- **Stop line position**: Where to stop (if needed)
- **Zone occupancy list**: Vehicles in conflict zone
- **Deadlock flag**: If vehicle waiting > 5 seconds

### Data Types

| Parameter | Type | Range | Unit |
| --- | --- | --- |
| `zone_position` | Vector3 | Intersection coords | meters |
| `zone_size` | Float | 20–50 | meters |
| `vehicles_in_zone` | List[Vehicle] | 0–100+ | vehicle count |
| `wait_time` | Float | 0–10+ | seconds |

---

## Operating States & Transitions

### Conflict Zone State Machine

```
[ZONE EMPTY] 
    ↓ (vehicle from N/S enters)
[N/S OCCUPANT] → (can proceed if E/W approaches)
    ├─ E/W approaches → [BLOCK E/W] → [E/W STOPS at stop line]
    └─ N/S occupant exits → [ZONE EMPTY] → [E/W CAN PROCEED]

[ZONE EMPTY]
    ↓ (vehicle from E/W enters)
[E/W OCCUPANT] → (can proceed if N/S approaches)
    └─ (similar to above)
```

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Zone occupancy check frequency | 100 Hz (physics ticks) | Real-time monitoring |
| Entry decision latency | ≤100 ms | Quick response |
| Max vehicle wait time | 5 seconds | Prevent indefinite waiting |
| Zone clearance time | Typically 2–3 seconds (depends on vehicle speed) | Normal intersection traverse time |
| Queue limit | 3 vehicles max before stop line | Prevent excessive congestion |
| Deadlock detection interval | 1 second | Check for timeout |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Conflict zone size = 0 | Default to 25m | Prevent invalid configuration |
| Occupancy detection fails | Assume zone occupied (conservative) | Errs on safety side |
| Vehicle stuck in zone | Force exit after 10s (emergency release) | Prevent permanent deadlock |
| Wait time > 5s | Log deadlock event; continue simulation | Investigable event; doesn't crash system |
| Opposite direction not detected | Proceed (worst case: collision) | Log error; alert to developer |

### Deadlock Recovery

If vehicle waits > 5 seconds:
1. Log deadlock event to telemetry
2. Display warning (if visual mode enabled)
3. Force vehicle to proceed (controlled) or skip
4. Continue simulation

---

## Acceptance Criteria

### Conflict Zone Definition

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Zone defined** | Central intersection area (~25m × 25m) designated as conflict zone | Visualization test: render conflict zone; verify rectangle shown at center |
| **Zone size correct** | Zone dimensions ±2m of 25m target | Measurement test: measure rendered zone size; verify 23–27m |
| **Zone persistence** | Zone defined for entire simulation duration | Duration test: run 10 min; verify zone consistently tracked |

### Occupancy Tracking

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Detect entry** | System detects when vehicle enters zone | Entry test: move vehicle into zone; verify system detects entry |
| **Detect exit** | System detects when vehicle leaves zone | Exit test: move vehicle out of zone; verify system detects exit |
| **Occupancy list** | Accurate list of vehicles in zone maintained | State test: spawn multiple vehicles in zone; verify accurate count |

### Entry Prevention

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Block opposite entry** | N vehicle in zone → S vehicle blocked (stops at stop line) | Blocking test: place N vehicle in zone; S approaches; verify S stops |
| **Allow same-direction entry** | N vehicle in zone → N vehicle can proceed | Same-direction test: N vehicle in zone; another N approaches; verify proceeds |
| **Release when clear** | When zone cleared, blocked vehicle proceeds | Release test: N vehicle in zone; N exits → S vehicle proceeds |

### Queue Limit

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **3-vehicle queue** | Max 3 vehicles waiting at stop line before stop line (queue limit) | Queue test: create scenario with multiple vehicles; verify queue ≤ 3 |
| **No deadlock** | Vehicles proceed within 5 seconds | Wait time test: measure wait time; verify ≤ 5 seconds |

### Timing Constraints

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Decision latency** | Entry decision made within 100 ms of reaching lookahead | Latency test: measure time from lookahead to decision; verify ≤ 100 ms |
| **Zone clearance time** | Typical clearance 2–3 seconds (vehicle transit time) | Timing test: measure zone occupancy duration; verify 2–3 sec typical |

---

## Verification Method

1. **Conflict Zone Test**
   - Enable Mode B (OPPOSING_SIMULTANEOUS)
   - Verify 25m × 25m zone rendered at intersection center
   - Measure zone dimensions; verify correct

2. **Occupancy Test**
   - Spawn vehicle; move into zone
   - Verify system detects entry
   - Move vehicle out; verify system detects exit

3. **Blocking Test**
   - Place NORTH vehicle in conflict zone
   - Approach with SOUTH vehicle
   - Verify SOUTH vehicle stops at stop line
   - Exit NORTH vehicle
   - Verify SOUTH vehicle proceeds

4. **Cross-Direction Test**
   - Place EAST vehicle in zone
   - Approach with WEST vehicle
   - Verify blocking behavior (same as N/S test)

5. **Queue Test**
   - Create scenario with 5 vehicles approaching same stop line
   - Verify queue limited to 3 vehicles
   - Verify no deadlock; all proceed within 5 sec

6. **Mode A Verification**
   - Switch to Mode A (STRICT_MUTUAL_EXCLUSION)
   - Verify collision prevention disabled (not needed in Mode A)

7. **Stress Test**
   - High traffic (150+ vehicles)
   - Verify collision prevention maintains 0 collisions
   - Verify no system lag or freezes

---

## Dependencies & Relationships

| Related Requirement | Relationship | Notes |
| --- | --- | --- |
| **REQ-005** | **BLOCKS** | Mode B cannot function safely without this collision prevention |
| **REQ-027** | **REFERENCED BY** | Conflict zone size configurable in UI |
| **REQ-028** | **REFERENCED BY** | Deadlock events displayed in collision statistics |

---

## Unresolved Questions

| Question | Answer | Status |
| --- | --- | --- |
| What if conflict zone too small? | Increase zone size or use Mode A | CLARIFIED: Configurable zone size |
| Can zone size be changed mid-simulation? | Yes; takes effect immediately | CLARIFIED: Runtime configurable |
| What if vehicle refuses to stop? | Force-stop or skip (emergency release) | CLARIFIED: Deadlock recovery procedure |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ✅ APPROVED | Requirement critical for Mode B safety; collision prevention well-defined |
| System Architect | ✅ APPROVED | Feasible design; zone tracking and entry control straightforward |
| QA Lead | ✅ APPROVED | Verification methods comprehensive; safety testing defined |

**Requirement Status**: ✅ **APPROVED and READY FOR IMPLEMENTATION**
