---
requirement_id: REQ-NEW-E1
title: Emergency Vehicle Types Support
priority: SHOULD
version: 0.2.0
date: 2026-09-03
status: APPROVED
---

# REQ-NEW-E1: Emergency Vehicle Types Support

**Requirement ID**: REQ-NEW-E1  
**Title**: Emergency Vehicle Types Support  
**Priority**: SHOULD (enhances scenario testing)  
**Status**: APPROVED  
**Updated**: 2026-09-03

---

## Requirement Statement

The system **shall support THREE emergency vehicle types**:

1. **Ambulance** (medical emergency)
2. **Police** (law enforcement)
3. **Fire Brigade** (fire/rescue emergency)

Each type shall spawn independently and be visually distinguishable (per REQ-NEW-E2).

---

## Detailed Description

### Ambulance

- **Purpose**: Simulate medical emergency response
- **Behavior**: Highest priority, can override signals
- **Visual**: White with red/blue lights (REQ-NEW-E2)
- **Use case**: Test emergency vehicle dispatch and traffic accommodation
- **Spawn rate**: Configurable 0–20 per minute (REQ-NEW-E5)

### Police

- **Purpose**: Simulate law enforcement response
- **Behavior**: Same priority as Ambulance, can override signals
- **Visual**: Blue with red/blue lights (REQ-NEW-E2)
- **Use case**: Test patrol vehicle scenarios
- **Spawn rate**: Configurable 0–20 per minute (REQ-NEW-E5)

### Fire Brigade

- **Purpose**: Simulate fire/rescue response
- **Behavior**: Same priority as Ambulance, can override signals
- **Visual**: Red with flashing lights (REQ-NEW-E2)
- **Use case**: Test large vehicle emergency scenarios
- **Spawn rate**: Configurable 0–20 per minute (REQ-NEW-E5)

---

## Configuration Parameters

| Parameter | Type | Values | Default | Scope |
| --- | --- | --- | --- | --- |
| `emergency_vehicle_types_enabled` | Boolean | true \| false | false | Global; enable/disable emergency vehicles |
| `ambulance_spawn_rate` | Float | 0–20 | 0 | Per-type spawn rate (veh/min) |
| `police_spawn_rate` | Float | 0–20 | 0 | Per-type spawn rate (veh/min) |
| `fire_brigade_spawn_rate` | Float | 0–20 | 0 | Per-type spawn rate (veh/min) |

---

## Inputs & Outputs

### Inputs

- **Spawn rate configuration**: User sets spawn rate for each vehicle type
- **Simulation time**: Time elapsed since start
- **Random seed**: For reproducible random spawn timing

### Outputs

- **Emergency vehicle spawned**: New emergency vehicle created at entry point
- **Vehicle type**: Identifies which type (Ambulance/Police/Fire)
- **Special behavior flags**: Enable signal override, yielding detection for nearby vehicles

### Data Types

| Parameter | Type | Range | Unit |
| --- | --- | --- | --- |
| `vehicle_type` | Enum | AMBULANCE, POLICE, FIRE_BRIGADE | Type |
| `spawn_rate` | Float | 0–20 | vehicles/minute |
| `spawn_interval` | Float | 3–∞ | seconds (inverse of spawn rate) |

---

## Operating States & Transitions

### Vehicle Lifecycle

```
[SPAWN] → [TYPE ASSIGNED] → [MOVING] → [AT INTERSECTION] → [SIGNAL OVERRIDE ACTIVE] → [EXITING] → [REMOVED]
```

**Type Assignment**: Determined at spawn time based on configured spawn rates.

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Max emergency vehicles active | Unlimited (resource-dependent) | No artificial cap |
| Spawn rate range | 0–20 vehicles/minute | Realistic emergency frequency |
| Spawn rate precision | 0.1 vehicles/minute | Fine-grained control |
| Type assignment determinism | Based on spawn rate configuration | Reproducible scenarios |
| Emergency vehicle lifespan | ~60 seconds (entry to exit) | Similar to regular vehicles |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Invalid spawn rate | Clamp to 0–20 range | Prevent out-of-bounds behavior |
| Type not recognized | Spawn as Ambulance (default) | Graceful degradation |
| Cannot spawn (queue full) | Retry next second | Eventual spawn once space available |

---

## Acceptance Criteria

### Type Support

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Three types supported** | Ambulance, Police, Fire Brigade spawn correctly with correct visual markers | Spawn test: enable each type separately; verify correct type appears |
| **Independent spawning** | Each type spawnable independently; spawn rate per type respected | Spawn rate test: set Ambulance=5, Police=0, Fire=0; verify only ambulances appear |
| **Type assignment** | Each spawned vehicle correctly identified as one of three types | Type verification: spawn 30 vehicles; verify all assigned correct type |

### Spawn Rate Configuration

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Spawn rate accuracy** | Configured rate matches actual spawn count (±10% tolerance) | Spawn test: set rate to 5 veh/min, run 1 min, count spawns; verify 4.5–5.5 vehicles |
| **Independent rates** | Each type has independent spawn rate; rates don't interfere | Spawn test: set Ambulance=5, Police=5, Fire=5; verify 5 of each per minute |
| **Default is disabled** | No emergency vehicles spawn if not explicitly configured | Startup test without emergency config |

---

## Verification Method

1. **Type Spawning Test**
   - Enable Ambulance type only; run 30s; verify only Ambulances appear
   - Enable Police type only; run 30s; verify only Police appear
   - Enable Fire Brigade type only; run 30s; verify only Fire appear
   - Enable all three; run 60s; verify all types appear

2. **Spawn Rate Test**
   - Configure each type to 5 vehicles/minute
   - Run for 1 minute
   - Count spawns per type
   - Verify within ±10% of configured rate (4.5–5.5 vehicles)

3. **Independence Test**
   - Set Ambulance=5, Police=10, Fire=2
   - Run for 1 minute
   - Verify Ambulance≈5, Police≈10, Fire≈2
   - Verify no correlation between types

4. **Visual Distinction Test**
   - Spawn one of each type
   - Verify correct color and labels (per REQ-NEW-E2)

---

## Dependencies & Relationships

| Related Requirement | Relationship | Notes |
| --- | --- | --- |
| **REQ-NEW-E2** | **REQUIRED BY** | Emergency types must be visually distinguishable |
| **REQ-NEW-E3** | **REQUIRED BY** | Emergency types override red signals |
| **REQ-NEW-E4** | **REQUIRED BY** | Other vehicles yield to emergency types |
| **REQ-NEW-E5** | **REQUIRED BY** | Spawn rate configured per emergency type |
| **REQ-027** | **REFERENCED BY** | Emergency type selector in UI controls |

---

## Unresolved Questions

| Question | Answer | Status |
| --- | --- | --- |
| Can emergency vehicles interact with each other? | No; no vehicle-to-vehicle priority logic between emergency types | CLARIFIED: All emergency types equal priority |
| Are there subtypes (e.g., ambulance vs. paramedic)? | No; exactly three types, no subtypes | CLARIFIED: Fixed types only |
| Can emergency spawn rate be changed mid-simulation? | Yes; change takes effect on next spawn | CLARIFIED: Runtime modifiable |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ✅ APPROVED | Requirement clear; three types well-defined |
| System Architect | ✅ APPROVED | Feasible; spawning logic straightforward |
| QA Lead | ✅ APPROVED | Test strategy clear; spawn rate verification defined |

**Requirement Status**: ✅ **APPROVED and READY FOR IMPLEMENTATION**
