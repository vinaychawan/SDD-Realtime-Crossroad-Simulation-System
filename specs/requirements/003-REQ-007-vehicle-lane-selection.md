---
requirement_id: REQ-007
title: Vehicle Lane Selection - TWO STRATEGIES SUPPORTED
priority: MUST
version: 0.2.0
date: 2026-09-03
status: APPROVED
---

# REQ-007: Vehicle Lane Selection - TWO STRATEGIES SUPPORTED

**Requirement ID**: REQ-007  
**Title**: Vehicle Lane Selection - TWO STRATEGIES SUPPORTED  
**Priority**: MUST (affects vehicle behavior and traffic flow)  
**Status**: APPROVED  
**Updated**: 2026-09-03

---

## Requirement Statement

The system **shall support TWO vehicle lane selection strategies**, configurable at startup:

1. **Strategy A: Random Lane Selection** - Vehicles randomly choose exit lane
2. **Strategy B: Intelligent Pre-Positioning** - Vehicles optimize lane choice before intersection

---

## Detailed Description

### Strategy A: Random Lane Selection

**Configuration Value**: `RANDOM`

- Vehicle randomly chooses exit lane (1, 2, or 3) upon spawn
- No correlation to current lane or intelligent pathfinding
- All lanes equally probable (33% each direction)
- **Use case**: Testing general traffic flow, baseline behavior
- **Rationale**: Simpler model; tests intersection capacity without driver intelligence
- **Implementation**: Uniform random distribution across 3 lanes

### Strategy B: Intelligent Pre-Positioning

**Configuration Value**: `INTELLIGENT`

- Vehicle analyzes current lane and desired exit direction BEFORE entering intersection
- Moves to optimal lane to exit in desired direction (if possible)
- **Example**: Vehicle in lane 1 wanting to exit East → pre-positions to lane 3 (rightmost for that direction)
- May perform multiple lane changes before intersection
- Lane changes occur at safe speeds (≤ 20 km/h)
- **Use case**: Realistic driver behavior, more efficient flow
- **Rationale**: Reduces intersection conflicts; models skilled/prepared drivers

---

## Configuration Parameters

| Parameter | Type | Values | Default | Selection Timing |
| --- | --- | --- | --- | --- |
| `lane_selection_strategy` | String | `RANDOM` \| `INTELLIGENT` | `RANDOM` | Startup only; applies to all subsequent vehicle spawns |

---

## Inputs & Outputs

### Inputs

- **Strategy selection**: User selects lane selection strategy at simulation start
- **Vehicle spawn event**: New vehicle created at entry point
- **Current traffic state**: Other vehicles' positions, lanes, speeds
- **Desired exit direction**: Vehicle's randomly assigned destination

### Outputs

- **Initial lane assignment**: Spawned vehicle assigned to lane (1, 2, or 3)
- **Lane change commands**: Vehicle performs lane changes (INTELLIGENT mode only)
- **Speed adjustment**: Vehicle may slow for safe lane changes

### Data Types

| Parameter | Type | Range | Unit |
| --- | --- | --- | --- |
| `lane_id` | Integer | 1–3 | Lane number (1=left, 2=center, 3=right) |
| `lane_change_speed` | Float | 5–20 | km/h (safe lane change speed) |
| `direction` | Enum | NORTH, SOUTH, EAST, WEST | Direction |
| `spawn_rate` | Float | 0–60 | vehicles/minute |

---

## Operating States & Transitions

### Strategy A: Random Lane Selection Flow

```
[VEHICLE SPAWNED] → [RANDOM(1-3)] → [ASSIGNED LANE] → [MOVE TO INTERSECTION] → [EXIT]
```

**No lane changes**: Vehicle maintains lane throughout simulation.

### Strategy B: Intelligent Pre-Positioning Flow

```
[VEHICLE SPAWNED] → [ANALYZE LANE] → [COMPUTE OPTIMAL LANE] → [EXECUTE LANE CHANGES (if needed)] → [ENTER INTERSECTION] → [EXIT]
```

**Lane change sequence**:
1. Detect current lane
2. Compute optimal exit lane
3. Plan lane change path (avoid collisions)
4. Execute lane change at ≤ 20 km/h
5. Stabilize in new lane
6. Proceed to intersection

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Lane change duration | 2–5 seconds | Realistic vehicle maneuver time |
| Lane change speed (max) | 20 km/h | Safety margin for vehicle stability |
| Pre-positioning distance | ≥50m before intersection | Sufficient distance to perform lane changes |
| Strategy switch-over time | Immediate (next spawn) | New vehicles follow selected strategy |
| Lane change collision check | Every 100 ms (physics tick) | Continuous safety monitoring |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Cannot find safe lane change | Vehicle stays in current lane, proceeds to intersection | Better to proceed than deadlock |
| Lane change blocked by traffic | Delay lane change, try again in next cycle | Gradual retry mechanism |
| Invalid strategy configuration | Reject at startup; default to RANDOM | Prevent undefined behavior |
| Strategy change mid-simulation | Ignored; applies only to NEW spawns | Consistency: don't change active vehicles |

### Error Handling

- **Strategy not recognized**: Log error; default to `RANDOM`
- **Lane ID out of range**: Clamp to 1–3
- **Unsafe lane change**: Vehicle delays; retries when safe

---

## Acceptance Criteria

### Strategy A: Random Lane Selection

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Equal probability** | Each lane selected for 27–37% of spawns (±10% tolerance) | Statistical test: spawn 300 vehicles, count per lane |
| **No lane changes** | Vehicle maintains initial lane throughout | Observation test: track 10 vehicles, verify lane consistency |
| **Independent spawns** | Each spawn independent; no correlation with previous | Correlation analysis over 100 spawns |

### Strategy B: Intelligent Pre-Positioning

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Optimal lane achieved** | Vehicle in correct lane before intersection entry (≥95% success rate) | Behavior test: spawn 100 vehicles with known destinations; verify lane correctness |
| **Safe lane change speed** | Lane changes executed at ≤ 20 km/h | Speed constraint test: monitor speed during lane change; verify max 20 km/h |
| **Pre-positioning completion** | Lane changes complete ≥50m before intersection | Distance test: measure lane change completion distance from intersection |
| **Collision avoidance** | No collisions during lane changes | Collision detection test: verify zero collisions during lane change maneuvers |

### General Acceptance

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Strategy selection** | Both strategies selectable at startup; take effect immediately | Configuration test: select each strategy; verify behavior correct |
| **Default strategy** | If not specified, default to `RANDOM` | Startup test without explicit strategy config |
| **Consistency over time** | Selected strategy applies to all subsequent spawns for entire simulation | Duration test: run 10 min with INTELLIGENT mode; verify all new vehicles pre-position |

---

## Verification Method

1. **Statistical Verification (Strategy A)**
   - Spawn 300+ vehicles with RANDOM mode
   - Record lane assignment per vehicle
   - Verify distribution: each lane 27–37% of spawns
   - Verify no lane changes occur

2. **Behavioral Verification (Strategy B)**
   - Spawn 100 vehicles with INTELLIGENT mode
   - Each vehicle assigned random destination (N/S/E/W)
   - Verify vehicle reaches optimal lane before intersection
   - Verify lane changes at safe speed (≤ 20 km/h)
   - Verify no collisions during lane changes

3. **Configuration Verification**
   - Test both strategies via configuration UI
   - Verify mode switches at startup
   - Verify mid-simulation change rejected

4. **Performance Verification**
   - Run full scenario for 10 minutes with each strategy
   - Measure collision count, throughput, avg speed
   - Compare strategy impact on traffic flow

---

## Dependencies & Relationships

| Related Requirement | Relationship | Notes |
| --- | --- | --- |
| **REQ-027** | **REFERENCED BY** | Lane selection strategy selection exposed in UI controls |
| **REQ-028** | **REFERENCED BY** | Lane selection strategy displayed in state display |
| **REQ-005** | **NO DEPENDENCY** | Orthogonal: independent of signal coordination mode |

---

## Unresolved Questions

| Question | Answer | Status |
| --- | --- | --- |
| What if vehicle cannot reach optimal lane before intersection? | Vehicle proceeds in current lane (graceful degradation) | CLARIFIED: No deadlock |
| Can lane selection strategy be changed per vehicle? | No; global strategy selection at startup | CLARIFIED: System-wide, not per-vehicle |
| How many lane changes can a vehicle perform? | Unlimited (within physical constraints) | CLARIFIED: No artificial limit |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ✅ APPROVED | Requirement clear; strategies well-defined |
| System Architect | ✅ APPROVED | Both strategies feasible; lane change logic straightforward |
| QA Lead | ✅ APPROVED | Test strategies clear; statistical verification method defined |

**Requirement Status**: ✅ **APPROVED and READY FOR IMPLEMENTATION**
