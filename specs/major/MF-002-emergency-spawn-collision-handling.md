---
requirement_id: MF-002
title: Specify Emergency Spawn Distribution Collision Handling
priority: SHOULD
severity: MAJOR
version: 0.2.0
date: 2026-09-04
status: OPEN
found_in_review: SPECIFICATION-REVIEW.md
---

# MF-002: Specify Emergency Spawn Distribution Collision Handling

**Requirement ID**: MF-002  
**Title**: Specify Emergency Spawn Distribution Collision Handling  
**Priority**: SHOULD (should fix before implementation)  
**Severity**: 🟠 **MAJOR**  
**Status**: OPEN  
**Date Identified**: 2026-09-04  

---

## Requirement Statement

REQ-NEW-E5 (Emergency Spawn Rate) allows independent configuration of three emergency types (0-20 veh/min each), but does NOT specify:
1. **Spawn collision handling**: What happens if two vehicles spawn simultaneously at same location?
2. **Spawn location distribution**: How are entry points chosen (random direction? round-robin)?
3. **Total spawn capacity**: Is there a maximum vehicle count limit?

The system **shall define explicit spawn distribution behavior** for emergency vehicles covering collision handling, entry point selection, and total vehicle capacity, ensuring deterministic and collision-free spawning.

---

## Detailed Description

### Problem 1: Spawn Collision Handling

**Scenario**: User configures:
- Ambulance spawn rate: 20 veh/min
- Police spawn rate: 20 veh/min
- Fire Brigade spawn rate: 20 veh/min
- **Total potential spawn**: 60 veh/min

**Questions**:
1. Can two vehicles spawn at identical (x, y, z) position simultaneously?
   - Yes? → Do they overlap? (undefined physics)
   - No? → How is overlap prevented?

2. What if spawn time coincides (within same simulation tick)?
   - Both want to spawn from NORTH entry at t=0.0
   - Allowed to overlap?
   - Queued behind each other?

3. Is there a per-entry spawn queue?
   - Each entry (NORTH, SOUTH, EAST, WEST) has dedicated spawn point?
   - Can two vehicles queue at same entry?

**Resolution options**:

**Option A: Serialized Spawning (Conservative)**
```
IF vehicle A spawn time = t:
  Spawn vehicle A at entry point
  Add to exit queue
ELSE IF vehicle B spawn time = t (same t):
  Queue vehicle B behind A (offset by 1 vehicle length)
  Spawn offset 1 length away
```

**Option B: Deterministic Distribution (Predictable)**
```
Each spawn event:
  Select entry direction: NORTH, SOUTH, EAST, WEST (cycle or random?)
  Check entry queue length
  IF queue < max_queue_length:
    Add vehicle to queue at entry point
  ELSE:
    Skip spawn (wait for next cycle)
```

**Option C: Spatial Collision Detection (Robust)**
```
Each spawn event:
  Check for existing vehicles within 2 meters of spawn point
  IF clear:
    Spawn vehicle immediately
  ELSE:
    Offset spawn position slightly (lane-based offset)
    IF still collision:
      Queue for next available time
```

---

### Problem 2: Spawn Location Distribution

**Scenario**: Ambulance spawns - which entry direction?
- Always NORTH? → Unrealistic bias
- Random (25% each)? → Non-deterministic
- Round-robin (N, S, E, W, N, S, ...)? → Predictable but less realistic
- Weighted by queue length? → Complex logic

**Current spec is silent on this.**

**Resolution options**:

**Option A: Uniform Random (33% each type)**
```
spawn_direction = random_choice([NORTH, SOUTH, EAST, WEST])
// Each direction equally probable (25% each)
```

**Option B: Round-Robin (Deterministic)**
```
spawn_counter = (spawn_counter + 1) % 4
spawn_direction = [NORTH, SOUTH, EAST, WEST][spawn_counter]
// Cycles through directions predictably
```

**Option C: Weighted by Queue Length (Load-Balancing)**
```
queue_lengths = {NORTH: 3, SOUTH: 1, EAST: 2, WEST: 0}
// Choose direction with smallest queue
spawn_direction = min(queue_lengths, key=queue_lengths.get)  // WEST (smallest)
```

---

### Problem 3: Total Spawn Capacity

**Scenario**: With spawn rates at maximum:
- Regular vehicles: 60 veh/min × 4 directions = 240 veh/min total
- Emergency vehicles: 60 veh/min (20 each type)
- **Combined potential**: 300 veh/min spawn rate

**Questions**:
1. Is there a hard cap on total vehicles in simulation?
   - Example: Max 500 vehicles at any time?
   - What happens when limit reached?

2. Does spawn rate exceed exit rate?
   - If vehicles spawn faster than exit → queue grows unbounded
   - Should simulation cap spawning?

3. How are spawn events prioritized?
   - If exit rate = 100 veh/min, spawn = 300 veh/min
   - Which 100 vehicles are spawned? (priority: emergency? regular?)

**Resolution options**:

**Option A: Soft Cap with Graceful Degradation**
```
MAX_VEHICLES = 500
IF current_vehicle_count >= MAX_VEHICLES:
  Reduce spawn rate proportionally
  // Example: if 500 vehicles present, spawn 0 new vehicles
ELSE IF (current_count + new_spawns) > MAX_VEHICLES:
  Spawn only (MAX_VEHICLES - current_count) vehicles
  Log warning: "spawn cap reached"
```

**Option B: Hard Limit (Drop Excess Spawns)**
```
MAX_VEHICLES = 500
IF current_vehicle_count >= MAX_VEHICLES:
  Skip all spawn events this tick
  Log warning: "vehicle limit reached; spawning paused"
ELSE:
  Spawn vehicles normally
```

**Option C: Unbounded (No Cap)**
```
No artificial limit
// Vehicles spawn until memory exhausted
// Risk: Performance degradation
// Benefit: Unlimited scenario testing
```

---

## Inputs & Outputs

### Inputs

- **REQ-NEW-E5**: Spawn rate configuration (ambulance, police, fire)
- **REQ-NEW-E1**: Emergency vehicle types
- **Intersection geometry**: Entry points (NORTH, SOUTH, EAST, WEST)
- **Physics engine**: Collision detection, vehicle positioning

### Outputs

- **Updated REQ-NEW-E5**: Spawn distribution algorithm specified
- **Spawn pseudocode**: Algorithm for collision-free spawning
- **Capacity limits**: Hard limits or soft caps defined
- **Priority rules**: If capacity limited, priority order specified

### Data Types

| Item | Type | Format |
| --- | --- | --- |
| `spawn_direction` | Enum | NORTH \| SOUTH \| EAST \| WEST |
| `entry_queue` | List[Vehicle] | Queue of vehicles waiting at entry |
| `vehicle_count` | Integer | Current vehicles in simulation |
| `spawn_rate` | Float | vehicles per minute per type |

---

## Operating States & Transitions

### Spawn Distribution State Machine

```
[SPAWN TICK (100 Hz Physics)]
    ↓ (check spawn events)
    ├─ Ambulance spawn due? → Calculate spawn time
    ├─ Police spawn due? → Calculate spawn time
    └─ Fire spawn due? → Calculate spawn time
    ↓ (for each spawn event)
    ├─ [SELECT DIRECTION] (random, round-robin, or weighted)
    │   └─ Entry: NORTH, SOUTH, EAST, or WEST
    ├─ [CHECK COLLISION] (spatial collision detection)
    │   ├─ Clear? → [SPAWN VEHICLE]
    │   └─ Blocked? → [QUEUE or RETRY]
    ├─ [CHECK CAPACITY] (vehicle count limit)
    │   ├─ Under cap? → [ADD TO SIMULATION]
    │   └─ At cap? → [DROP SPAWN or QUEUE]
    └─ [UPDATE ENTRY QUEUE]
        └─ [NEXT TICK]
```

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Spawn attempt frequency | Per physics tick (100 Hz) | Poisson distribution sampling |
| Spawn collision check | <1 ms per vehicle | Spatial query performance |
| Entry queue max length | 5–10 vehicles (configurable) | Prevent excessive queuing at entry |
| Total vehicle cap | 500 vehicles (recommended) | Balance performance vs. throughput testing |
| Spawn priority latency | <10 ms | Quick decision if capacity limited |

---

## Failure & Recovery Behavior

### Spawn Collision Scenarios

| Scenario | Handling | Recovery |
| --- | --- | --- |
| **Spawn overlap detected** | Queue behind existing vehicle | Spawn offset by 1 vehicle length, try again next tick |
| **Entry queue full** | Defer spawn to next cycle | Retry spawn at future time (exponential backoff?) |
| **Vehicle capacity reached** | Drop spawn event | Log warning; skip this spawn (no retry) |
| **Spawn location blocked** | Choose adjacent spawn point | Offset spawn position; reattempt spawn |

---

## Acceptance Criteria

### Spawn Collision Handling

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **No overlaps** | No two vehicles occupy same position | Spatial test: spawn multiple vehicles; verify no overlaps |
| **Deterministic behavior** | Same config → same spawn results | Repeatability test: run twice with same seed; verify identical |
| **Queue handling** | Vehicles queue correctly when spawn point blocked | Queue test: fill entry point; verify next vehicle queues |

### Entry Direction Distribution

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Distribution consistent** | Chosen direction matches strategy (random/round-robin/weighted) | Spawn many vehicles; verify distribution matches strategy |
| **No bias** | All directions equally represented (if random) | Statistical test: chi-square test for uniform distribution |

### Capacity Management

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Cap enforced** | Vehicle count never exceeds configured cap | Stress test: run with high spawn rates; verify cap respected |
| **Graceful degradation** | If cap reached, new spawns dropped smoothly (no crash) | Limit test: fill to capacity; verify no errors |
| **Spawn resumption** | When vehicles exit, new spawns resume | Recovery test: exit vehicles; verify spawning resumes |

### Documentation

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Algorithm specified** | Spawn distribution algorithm documented in pseudocode | Review algorithm document; verify completeness |
| **Priority rules clear** | If capacity limited, priority order explicit | Verify priority specification in docs |
| **Test vectors** | Example scenarios with expected spawn results | Review test vector table |

---

## Verification Method

1. **Algorithm Selection**
   - Evaluate spawn collision options (A, B, C)
   - Select preferred approach
   - Document rationale

2. **Direction Distribution**
   - Evaluate distribution strategies (Random, Round-Robin, Weighted)
   - Select strategy consistent with simulation realism
   - Specify in REQ-NEW-E5

3. **Capacity Planning**
   - Determine max vehicle count (recommend 500)
   - Select capacity handling (soft cap vs. hard limit)
   - Document in REQ-NEW-E5

4. **Implementation Testing**
   - Spawn 20 ambulances + 20 police + 20 fire simultaneously
   - Verify no spawn collisions
   - Verify all vehicles appear correctly
   - Verify entry direction distribution

5. **Stress Testing**
   - Run simulation with maximum spawn rates (60 veh/min each type)
   - Verify vehicle count remains stable
   - Verify no performance degradation
   - Verify no memory leaks

6. **Edge Case Testing**
   - Test spawn when vehicle count at capacity
   - Test spawn when entry queue full
   - Test spawn with blocked entry points
   - Verify graceful degradation

---

## Dependencies & Relationships

| Related Item | Relationship | Notes |
| --- | --- | --- |
| **REQ-NEW-E5** | **REFERENCED** | Primary source; will be updated with spawn algorithm |
| **REQ-NEW-E1** | **DEPENDENCY** | Defines emergency vehicle types |
| **Physics engine** | **DEPENDENCY** | Provides collision detection and positioning |
| **Entry geometry** | **DEPENDENCY** | Defines spawn entry points |

---

## Unresolved Questions

| Question | Impact | Status |
| --- | --- | --- |
| **Q1: Prefer serialized or distributed spawning?** | Affects algorithm complexity | Recommend serialized (Option A) for simplicity |
| **Q2: Which direction distribution strategy?** | Affects realism | Recommend random (Option A) for variety |
| **Q3: What should MAX_VEHICLES be?** | Affects performance | Recommend 500 (empirical testing needed) |
| **Q4: Should vehicle spawn include "initial delay"?** | Affects startup | Recommend YES (avoid frame 1 overcrowding) |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ⏳ PENDING | Review spawn algorithm options and recommend |
| System Architect | ⏳ PENDING | Confirm spawn design compatible with physics engine |
| QA Lead | ⏳ PENDING | Validate test approach for spawn scenarios |

---

**Requirement Status**: 🟠 **OPEN - SHOULD FIX BEFORE IMPLEMENTATION**

*Recommended for resolution before coding spawn module.*
