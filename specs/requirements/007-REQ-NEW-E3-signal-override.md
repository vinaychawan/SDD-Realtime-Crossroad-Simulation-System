---
requirement_id: REQ-NEW-E3
title: Signal Override for Emergency Vehicles
priority: SHOULD
version: 0.2.0
date: 2026-09-03
status: APPROVED
---

# REQ-NEW-E3: Signal Override for Emergency Vehicles

**Requirement ID**: REQ-NEW-E3  
**Title**: Signal Override for Emergency Vehicles  
**Priority**: SHOULD (core emergency behavior)  
**Status**: APPROVED  
**Updated**: 2026-09-03

---

## Requirement Statement

Emergency vehicles **shall override traffic signals** and proceed regardless of signal state:

- **Red Signal**: Emergency vehicles CAN cross intersection without stopping
- **Green Signal**: Normal (vehicles already have right-of-way)
- **Amber Signal**: Normal (vehicles can proceed to clear intersection)

**Safety Constraint**: Emergency vehicles must still avoid collisions with vehicles already in intersection (cannot recklessly enter occupied intersection).

---

## Detailed Description

### Signal Override Behavior

#### At Red Signal

- **Regular vehicles**: STOP at stop line; wait for green
- **Emergency vehicles**: PROCEED through intersection without stopping
- **Condition**: Must still check for vehicles already in intersection
- **Action**: If intersection occupied, slow down (but don't stop) and proceed when safe

#### At Green Signal

- **Both regular and emergency**: PROCEED (no difference)
- **Emergency behavior**: Normal; same priority as regular vehicles

#### At Amber Signal

- **Both regular and emergency**: PROCEED to clear intersection or STOP if safe
- **Emergency behavior**: Normal; no special treatment

---

## Configuration Parameters

| Parameter | Type | Values | Default |
| --- | --- | --- |
| `emergency_signal_override_enabled` | Boolean | true \| false | true |
| `emergency_slowdown_factor` | Float | 0.5–1.0 | 0.8 (80% speed) |

---

## Inputs & Outputs

### Inputs

- **Vehicle type**: AMBULANCE, POLICE, or FIRE_BRIGADE (identifies as emergency)
- **Current signal state**: RED, GREEN, or AMBER for current direction
- **Intersection occupancy**: Vehicles currently in intersection zone
- **Vehicle speed**: Current velocity

### Outputs

- **Movement decision**: PROCEED (ignore red signal) or STOP (respect signal)
- **Speed adjustment**: Reduce speed if intersection occupied
- **Collision avoidance**: Check for vehicles already crossing intersection

### Data Types

| Parameter | Type | Range | Unit |
| --- | --- | --- |
| `is_emergency_vehicle` | Boolean | true \| false | Boolean |
| `current_signal_state` | Enum | RED, GREEN, AMBER | Signal state |
| `slowdown_factor` | Float | 0.5–1.0 | Speed multiplier |
| `can_proceed_safely` | Boolean | true \| false | Safety check result |

---

## Operating States & Transitions

### Emergency Vehicle Signal Decision Tree

```
[APPROACHING INTERSECTION]
    ↓
[IS EMERGENCY VEHICLE?]
    ├─ NO → [FOLLOW NORMAL SIGNAL RULES] → [STOP at RED | PROCEED at GREEN]
    └─ YES → [CHECK INTERSECTION OCCUPANCY]
              ├─ CLEAR → [PROCEED REGARDLESS OF SIGNAL STATE]
              └─ OCCUPIED → [SLOW DOWN (80% speed) | PROCEED CAUTIOUSLY]
```

**Key Point**: Emergency vehicle ALWAYS makes forward progress; never completely stops.

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Signal override latency | ≤100 ms | Immediate response to signal state |
| Collision detection range | 50m ahead | Sufficient lookahead distance |
| Slowdown activation | Immediate | When vehicle in intersection zone detected |
| Slowdown factor | 80% of normal speed | Reduces speed for safety without stopping |
| Intersection occupancy timeout | 5 seconds max | Don't wait indefinitely (per REQ-NEW-COLLISION-PREVENTION-1) |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Cannot determine if emergency | Treat as regular vehicle (conservative default) | Prevent rogue vehicles |
| Intersection occupancy detection fails | Slow down (80% speed) and proceed | Err on side of caution |
| Signal state not available | Assume RED; apply override logic | Proceed with caution |
| Collision occurs | Log collision; continue simulation | Emergency still active; don't crash system |

---

## Acceptance Criteria

### Red Signal Override

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Proceed at red** | Emergency vehicle crosses red signal without stopping | Override test: approach red signal in emergency vehicle; verify vehicle enters intersection without stopping |
| **Regular vehicle stops** | Non-emergency vehicle stops at red signal | Baseline test: approach red signal in regular vehicle; verify vehicle stops |
| **No complete stop** | Emergency vehicle never comes to full stop (0 km/h) | Speed test: monitor emergency vehicle speed at red signal; verify speed ≥5 km/h |

### Intersection Occupancy Handling

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Detect occupancy** | Emergency vehicle detects other vehicles in intersection | Occupancy test: place vehicle in intersection; approaching emergency slows down |
| **Slow down** | Emergency vehicle reduces speed to 80% when intersection occupied | Speed test: emergency approaches occupied intersection; verify speed = 80% of normal |
| **Proceed safely** | Emergency vehicle eventually proceeds once intersection clears | Wait test: emergency waits max 5s; proceeds when zone clears |

### Non-Emergency Default

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Regular vehicles respect signals** | Regular vehicles STOP at red, PROCEED at green | Signal test: regular vehicle behavior unchanged; respects all signals |
| **Emergency distinction** | Emergency vehicles ignore red; regular vehicles don't | Comparison test: emergency passes red; regular vehicle stops |

---

## Verification Method

1. **Red Signal Test**
   - Place emergency vehicle approaching red signal
   - Verify vehicle proceeds without stopping
   - Repeat with regular vehicle; verify it stops

2. **Intersection Occupancy Test**
   - Create scenario with vehicle in intersection
   - Approach with emergency vehicle
   - Verify speed reduces to 80% when near occupied intersection
   - Wait for intersection to clear
   - Verify emergency proceeds once clear

3. **Signal State Test**
   - Test emergency at RED signal → proceeds
   - Test emergency at GREEN signal → proceeds (normal)
   - Test emergency at AMBER signal → proceeds (normal)

4. **Collision Avoidance Test**
   - Place vehicle in intersection
   - Approach with emergency vehicle at high speed
   - Verify collision prevented (emergency slows down or vehicle clears)

5. **Configuration Test**
   - Disable signal override → emergency respects red signals
   - Enable signal override → emergency ignores red signals
   - Verify configuration takes effect immediately

---

## Dependencies & Relationships

| Related Requirement | Relationship | Notes |
| --- | --- | --- |
| **REQ-NEW-E1** | **REQUIRED BY** | Only emergency types override signals |
| **REQ-NEW-COLLISION-PREVENTION-1** | **RELATED TO** | Collision prevention applies; emergency still avoids occupied intersection |
| **REQ-005** | **RELATED TO** | Works with both signal coordination modes |

---

## Unresolved Questions

| Question | Answer | Status |
| --- | --- | --- |
| What if emergency vehicle and regular vehicle both at red? | Emergency proceeds; regular vehicle stops | CLARIFIED: Different behavior by type |
| Can emergency vehicle damage other vehicles? | No; collision detection still active | CLARIFIED: Collision avoidance mandatory |
| Is signal override speed-dependent? | No; applies regardless of emergency speed | CLARIFIED: Speed-independent override |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ✅ APPROVED | Requirement clear; signal override logic well-defined |
| System Architect | ✅ APPROVED | Feasible design; collision avoidance integrated |
| QA Lead | ✅ APPROVED | Test strategy comprehensive; verification methods defined |

**Requirement Status**: ✅ **APPROVED and READY FOR IMPLEMENTATION**
