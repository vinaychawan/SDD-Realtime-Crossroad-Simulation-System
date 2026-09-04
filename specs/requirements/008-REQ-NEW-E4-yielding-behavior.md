---
requirement_id: REQ-NEW-E4
title: Automatic Yielding Behavior Near Emergency Vehicles
priority: SHOULD
version: 0.2.0
date: 2026-09-03
status: APPROVED
---

# REQ-NEW-E4: Automatic Yielding Behavior Near Emergency Vehicles

**Requirement ID**: REQ-NEW-E4  
**Title**: Automatic Yielding Behavior Near Emergency Vehicles  
**Priority**: SHOULD (realistic traffic behavior)  
**Status**: APPROVED  
**Updated**: 2026-09-03

---

## Requirement Statement

Other vehicles within **50m of an emergency vehicle** (in any direction) shall attempt to yield:

- **Speed Reduction**: Reduce speed by up to 50% to clear path
- **Lane Change**: Change lanes to create space for emergency vehicle passage
- **Reaction Distance**: 50m accounts for 0.5–1.5 second reaction time at 50 km/h approach speed

---

## Detailed Description

### Detection & Reaction

- **Detection range**: 50m in all directions from emergency vehicle
- **Reaction time**: Immediate upon detection (no delay)
- **Reaction type**: Speed reduction + lane change attempt
- **Speed reduction**: Up to 50% of current speed (varies with emergency proximity)
- **Lane change logic**: Attempt to move away from emergency vehicle

### Speed Reduction Behavior

```
Distance = 50m: Speed = 100% (no reduction)
Distance = 25m: Speed = 75% (25% reduction)
Distance = 0m (adjacent): Speed = 50% (50% reduction)
```

**Linear interpolation** from 100% speed at 50m to 50% speed at adjacent.

### Lane Change Behavior

- **Priority**: Create space for emergency vehicle
- **Direction**: Attempt to move perpendicular to emergency vehicle's path
- **Safety**: Perform lane change only if safe (no collision)
- **Timeout**: Abandon lane change attempt after 5 seconds

---

## Configuration Parameters

| Parameter | Type | Values | Default |
| --- | --- | --- |
| `emergency_detection_range` | Float | 10–100 | 50 (meters) |
| `max_speed_reduction` | Float | 0.25–0.75 | 0.50 (50% reduction) |
| `yielding_behavior_enabled` | Boolean | true \| false | true |

---

## Inputs & Outputs

### Inputs

- **Emergency vehicle position**: 3D location of emergency vehicle
- **Vehicle position**: 3D location of regular vehicle
- **Vehicle velocity**: Current speed and direction
- **Traffic state**: Other vehicles, lanes, obstacles

### Outputs

- **Speed adjustment**: New target speed (reduced)
- **Lane change command**: Move to adjacent lane
- **Behavior state**: YIELDING or NORMAL

### Data Types

| Parameter | Type | Range | Unit |
| --- | --- | --- |
| `detection_distance` | Float | 0–50 | meters |
| `speed_reduction_factor` | Float | 0.5–1.0 | multiplier |
| `target_speed` | Float | 0–100 | km/h |
| `lane_change_direction` | Enum | LEFT, RIGHT, NONE | Direction |

---

## Operating States & Transitions

### Yielding State Machine

```
[NORMAL DRIVING] 
    ↓ (emergency detected within 50m)
[DETECTING EMERGENCY]
    ↓
[REDUCE SPEED (interpolated)] ← [ATTEMPT LANE CHANGE]
    ↓ (emergency moves away beyond 50m)
[RETURN TO NORMAL]
```

**Timing**: Continuous speed adjustment as emergency approaches/recedes.

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Detection latency | ≤100 ms | Quick reaction |
| Speed adjustment latency | ≤500 ms | Gradual deceleration (not abrupt) |
| Lane change decision time | 1–2 seconds | Time to plan and execute |
| Lane change duration | 2–5 seconds | Safe lane change maneuver |
| Detection update frequency | 100 Hz (physics ticks) | Continuous monitoring |
| Maximum detection range | 50m | Per requirement |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Cannot detect emergency | Continue normal driving | No error; detection fail-safe |
| Lane change blocked | Maintain current lane; apply speed reduction only | Don't force lane change |
| Speed reduction exceeds max | Clamp to 50% reduction | Prevent over-reduction |
| Vehicle too close for safe lane change | Reduce speed aggressively (close to 50%) | Maximize space creation |

---

## Acceptance Criteria

### Detection & Reaction

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Detection range** | Regular vehicle detects emergency up to 50m away | Detection test: place regular vehicle 50m from emergency; verify speed starts reducing |
| **Detection accuracy** | Detection works in all directions (front/side/rear) | Directional test: approach emergency from multiple angles; verify detection in all |
| **Reaction immediacy** | Speed reduction begins immediately upon detection | Latency test: measure time from detection to speed adjustment; verify ≤100 ms |

### Speed Reduction

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Speed reduction magnitude** | Speed reduces by up to 50% when adjacent to emergency | Speed test: position vehicle adjacent to emergency; measure speed; verify 50% of normal |
| **Speed reduction gradient** | Speed reduction interpolates smoothly from 0% at 50m to 50% at 0m | Gradient test: measure speed at various distances; verify linear interpolation |
| **No complete stop** | Vehicle never comes to complete stop (0 km/h) unless emergency reason | Motion test: verify vehicle maintains minimum safe speed (>5 km/h) |

### Lane Change

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Lane change attempt** | Vehicle attempts to change lanes when safe | Lane change test: emergency approaches from side; verify vehicle moves away |
| **Safe lane change** | Lane change only executed if safe (no collision) | Safety test: create blocked scenario; verify vehicle doesn't force lane change |
| **Yielding effect** | Overall effect creates space for emergency vehicle | Traffic test: observe emergency vehicle path; verify space cleared by regular vehicles |

### Non-Emergency Behavior

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Normal vehicles unaffected** | Regular vehicles don't yield to each other | Baseline test: two regular vehicles; no yielding behavior observed |

---

## Verification Method

1. **Detection Range Test**
   - Place regular vehicle 50m from emergency vehicle
   - Verify speed starts reducing
   - Move emergency away; verify speed returns to normal
   - Repeat at 60m (outside range); verify no detection

2. **Speed Reduction Test**
   - Position vehicles at various distances: 50m, 25m, 10m, 0m
   - Measure speed reduction at each distance
   - Verify linear interpolation from 0% to 50%

3. **Lane Change Test**
   - Position regular vehicle in lane
   - Approach with emergency from side
   - Verify lane change attempt
   - Create blocked scenario; verify graceful handling

4. **Direction Test**
   - Approach emergency from front, side, and rear
   - Verify detection and yielding in all directions

5. **Stress Test**
   - Multiple regular vehicles around one emergency
   - Verify all vehicles yield appropriately
   - Verify no deadlock or collision

---

## Dependencies & Relationships

| Related Requirement | Relationship | Notes |
| --- | --- | --- |
| **REQ-NEW-E1** | **REQUIRED BY** | Yielding behavior only triggered by emergency types |
| **REQ-NEW-E2** | **RELATED TO** | Visual markers help vehicles identify emergencies |
| **REQ-NEW-E3** | **RELATED TO** | Signal override paired with emergency approach behavior |

---

## Unresolved Questions

| Question | Answer | Status |
| --- | --- | --- |
| Do emergency vehicles yield to each other? | No; all emergencies equal priority; no mutual yielding | CLARIFIED: No inter-emergency priority |
| Can yielding behavior be disabled? | Yes; via `yielding_behavior_enabled` configuration | CLARIFIED: Runtime configurable |
| What if vehicle cannot reduce speed further? | Already at minimum; maintain current speed | CLARIFIED: Floor at safe minimum |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ✅ APPROVED | Requirement clear; behavior well-defined |
| System Architect | ✅ APPROVED | Feasible design; detection and speed logic straightforward |
| QA Lead | ✅ APPROVED | Verification methods comprehensive |

**Requirement Status**: ✅ **APPROVED and READY FOR IMPLEMENTATION**
