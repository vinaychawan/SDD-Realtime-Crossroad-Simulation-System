---
requirement_id: REQ-NEW-E5
title: Configurable Emergency Vehicle Spawn Rate
priority: SHOULD
version: 0.2.0
date: 2026-09-03
status: APPROVED
---

# REQ-NEW-E5: Configurable Emergency Vehicle Spawn Rate

**Requirement ID**: REQ-NEW-E5  
**Title**: Configurable Emergency Vehicle Spawn Rate  
**Priority**: SHOULD (enables scenario flexibility)  
**Status**: APPROVED  
**Updated**: 2026-09-03

---

## Requirement Statement

The system **shall allow independent configuration of emergency vehicle spawn rate** for each emergency type:

- **Parameter**: `emergency_spawn_rate_per_minute`
- **Range**: 0–20 vehicles per minute (per type)
- **Default**: 0 (no emergency vehicles unless explicitly configured)
- **Per-Type Configuration**: Separate rates for Ambulance, Police, Fire Brigade
- **Timing**: Can be changed at startup or runtime (takes effect on next spawn)

---

## Detailed Description

### Spawn Rate Control

Emergency vehicles spawn independently based on configured rates:

- **Ambulance rate**: 0–20 ambulances/minute
- **Police rate**: 0–20 police/minute
- **Fire Brigade rate**: 0–20 fire brigade/minute

**Spawn Timing**: Vehicles spawn at random intervals (Poisson distribution) with mean interval = 60 / spawn_rate seconds.

### Example Scenarios

| Scenario | Ambulance | Police | Fire | Total |
| --- | --- | --- | --- | --- |
| No emergency | 0 | 0 | 0 | 0 |
| Light emergency mix | 2 | 1 | 0.5 | 3.5/min |
| Heavy emergency load | 5 | 5 | 5 | 15/min |
| Ambulance-heavy | 10 | 2 | 1 | 13/min |

---

## Configuration Parameters

| Parameter | Type | Values | Default | Selection Timing |
| --- | --- | --- | --- | --- |
| `ambulance_spawn_rate` | Float | 0–20 | 0 | Startup or runtime |
| `police_spawn_rate` | Float | 0–20 | 0 | Startup or runtime |
| `fire_brigade_spawn_rate` | Float | 0–20 | 0 | Startup or runtime |
| `emergency_spawn_mode` | Enum | UNIFORM, POISSON | POISSON | Startup only |

---

## Inputs & Outputs

### Inputs

- **Spawn rate configuration**: User sets rate for each type
- **Simulation time**: Current elapsed time
- **Random seed**: For reproducible random timing

### Outputs

- **Emergency vehicle spawned**: New emergency vehicle created
- **Vehicle type**: Which type spawned (Ambulance/Police/Fire)
- **Spawn timestamp**: When vehicle was created

### Data Types

| Parameter | Type | Range | Unit |
| --- | --- | --- |
| `spawn_rate` | Float | 0–20 | vehicles/minute |
| `spawn_interval` | Float | 3–∞ | seconds |
| `spawn_time` | Float | 0–simulation_duration | seconds |

---

## Operating States & Transitions

### Spawn State Machine

```
[SIMULATION START]
    ↓
[READ SPAWN RATES] → [CALCULATE SPAWN INTERVALS]
    ↓
[SPAWN TIMER ACTIVE] ← [Wait for spawn interval]
    ↓
[SPAWN VEHICLE] → [Next spawn interval calculated]
    ↓ (back to wait)
[repeat until simulation end]
```

**Rate Change**: Takes effect on next spawn after configuration change.

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Spawn rate range | 0–20 vehicles/minute | Realistic emergency frequency |
| Spawn rate precision | 0.1 vehicles/minute | Fine-grained control |
| Spawn timing distribution | Poisson (default) | Realistic random intervals |
| Max active emergencies | Unlimited (resource-dependent) | No artificial cap |
| Configuration change latency | On next spawn | Immediate effect on spawn timing |
| Total emergency cap | 60 vehicles/minute (20 × 3 types) | System-wide maximum |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Invalid spawn rate | Clamp to 0–20 range | Prevent out-of-bounds |
| Rate > 20 per type | Reject or clamp to 20 | Prevent DoS |
| Cannot spawn (queue full) | Retry next second | Eventual spawn |
| Negative spawn rate | Convert to 0 (no spawn) | Safe default |

---

## Acceptance Criteria

### Spawn Rate Accuracy

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Rate accuracy** | Actual spawn count matches configured rate ±10% | Spawn test: set rate to 5 veh/min; run 1 min; count spawns; verify 4.5–5.5 |
| **Per-type independence** | Each type has independent spawn rate; rates don't interfere | Spawn test: set Ambulance=5, Police=10, Fire=2; run 1 min; verify 5, 10, 2 respectively |
| **Rate range** | Rates 0–20 all functional | Range test: test rates 0, 5, 10, 15, 20; verify all work |

### Runtime Configuration

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Rate change effect** | Changing rate takes effect on next spawn | Runtime test: change rate mid-simulation; verify next spawn uses new rate |
| **No retroactive change** | In-flight vehicles unaffected by rate changes | Behavior test: change rate; verify active vehicles unaffected |
| **Immediate feedback** | Rate change visible in spawn pattern quickly (within 1 min) | Observation test: change rate; observe spawn pattern change |

### Default Behavior

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Default disabled** | No emergency vehicles spawn unless explicitly configured | Startup test without emergency config; verify no emergencies |
| **Config persistence** | Configured rates remain until explicitly changed | Duration test: run 10 min with configured rates; verify rates constant |

---

## Verification Method

1. **Spawn Rate Accuracy Test**
   - Configure Ambulance=5 veh/min
   - Run simulation for 1 minute
   - Count spawned ambulances
   - Verify count = 5 ± 0.5 (±10%)
   - Repeat for other rates (10, 15, 20)

2. **Independence Test**
   - Configure Ambulance=5, Police=10, Fire=2
   - Run for 1 minute
   - Count each type separately
   - Verify each type spawns at configured rate

3. **Runtime Change Test**
   - Start with Ambulance=5
   - After 30 seconds, change to Ambulance=10
   - Verify spawn rate increases after change
   - Measure time to detect rate change (should be <1 spawn interval)

4. **Distribution Test**
   - Generate spawn intervals at rate=5
   - Verify distribution matches Poisson (optional)
   - Verify no clustering or patterns

5. **Edge Case Test**
   - Configure rate=0 (no spawn); verify no emergencies
   - Configure rate=0.1 (very low); verify sparse spawning
   - Configure rate=20 (maximum); verify sustainable performance

---

## Dependencies & Relationships

| Related Requirement | Relationship | Notes |
| --- | --- | --- |
| **REQ-NEW-E1** | **REQUIRED BY** | Spawn rate configured per emergency type |
| **REQ-027** | **REFERENCED BY** | Emergency spawn rate sliders in UI controls |
| **REQ-028** | **REFERENCED BY** | Emergency vehicle count displayed in state display |

---

## Unresolved Questions

| Question | Answer | Status |
| --- | --- | --- |
| Can spawn rate exceed 20/minute per type? | No; 20 is hard limit per type | CLARIFIED: Hard cap |
| What if total spawn rate exceeds available spawn points? | Vehicles wait in queue; spawn when point available | CLARIFIED: Queuing behavior |
| Can spawn rates be negative? | No; clamped to 0–20 | CLARIFIED: Non-negative |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ✅ APPROVED | Requirement clear; spawn rate mechanics well-defined |
| System Architect | ✅ APPROVED | Feasible; rate control straightforward |
| QA Lead | ✅ APPROVED | Verification method clear; statistical testing defined |

**Requirement Status**: ✅ **APPROVED and READY FOR IMPLEMENTATION**
