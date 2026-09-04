---
requirement_id: MF-001
title: Define Precise Metric Calculations for State Display
priority: SHOULD
severity: MAJOR
version: 0.2.0
date: 2026-09-04
status: OPEN
found_in_review: SPECIFICATION-REVIEW.md
---

# MF-001: Define Precise Metric Calculations for State Display

**Requirement ID**: MF-001  
**Title**: Define Precise Metric Calculations for State Display  
**Priority**: SHOULD (should fix before testing)  
**Severity**: 🟠 **MAJOR**  
**Status**: OPEN  
**Date Identified**: 2026-09-04  

---

## Requirement Statement

REQ-028 (State Display) specifies three metrics with **ambiguous calculation definitions** making them misleading to users and untestable for QA:
1. **Throughput**: "Vehicles exiting per minute" (what time window?)
2. **Collision-Free Ratio**: Percentage (of what? time-based or vehicle-based?)
3. **Average Speed**: Speed calculation (what about stationary vehicles? emergencies?)

The system **shall define precise, unambiguous calculation formulas** for all state display metrics with:
- Explicit time windows and calculation methods
- Handling of edge cases (zero vehicles, all stopped, etc.)
- Consistent units and decimal precision
- Quantified accuracy tolerances

---

## Detailed Description

### Metric 1: Throughput

**Current definition**: "Vehicles exiting per minute"

**Ambiguities**:
1. **Time window**: Last 1 minute? Last 10 seconds? Since start?
2. **Exit point**: Leaving intersection? Leaving simulation area?
3. **Initial calculation**: What value displayed at simulation start (0 to 60 seconds)?
4. **Averaging**: Rolling window or fixed interval?

**Proposed precise definition**:
```
Throughput (vehicles/min) = (Number of vehicles exiting in last 60 seconds) / 1.0

Calculation method: Rolling 60-second window
- At time t, count all vehicles that exited between (t-60s) and (t)
- Exit event: vehicle reaches intersection exit, begins leaving intersection area
- Update frequency: Every physics tick (100 Hz), display at 10 Hz

Startup behavior:
- t < 60s: Display calculated value (incomplete window)
  Example: at t=30s with 10 exits: display "20 veh/min" (10 exits in 30s = 20/min rate)
- t ≥ 60s: Display full 60-second window value
```

**Edge cases**:
- No vehicles exited: Display "0 veh/min"
- Only partial data: Use available data (scaled proportionally)

---

### Metric 2: Collision-Free Ratio

**Current definition**: "Percentage" (undefined calculation)

**Ambiguities**:
1. **Basis**: Collision-free TIME or collision-free VEHICLES?
2. **Collision state**: Active collision at this instant, or any collision ever?
3. **Time measurement**: At 100 Hz physics vs 10 Hz display refresh?
4. **Calculation formula**: Not specified

**Proposed precise definition**:
```
Collision-Free Ratio (%) = (Time without active collisions / Total simulation time) × 100

Calculation method: Time-based metric
- Define "active collision": Vehicle pair in contact (distance ≤ 0 units)
- Track collision state at every physics tick (100 Hz)
- Collision-free time: Sum of ticks with zero active collisions
- Total time: Ticks since simulation start (or reset)

Formula:
  ratio = (collision_free_ticks / total_ticks) × 100

Example:
- Simulation running 600 seconds (total 60,000 ticks at 100 Hz)
- 200 ticks had collisions (2 seconds of collision)
- Collision-free ratio = (60,000 - 200) / 60,000 × 100 = 99.67%

Update frequency: Display at 10 Hz refresh rate (calculated from 100 Hz basis)
```

**Edge cases**:
- Simulation just started (< 1 second): Display "100%" (no collisions yet)
- Continuous collisions: Display "0%"
- After reset: Re-initialize counters (collision_free_ticks=0, total_ticks=0)

---

### Metric 3: Average Speed

**Current definition**: "Speed = sum(v_i) / n (vehicles average)"

**Ambiguities**:
1. **Empty scenario**: What if n=0 (no vehicles)? Display "0" or "N/A"?
2. **Stopped vehicles**: Include stationary vehicles (speed=0) in average?
3. **Emergency vehicles**: Weight equally with regular vehicles?
4. **Units**: Already specified as km/h ✓

**Proposed precise definition**:
```
Average Speed (km/h) = SUM(speed_i for all vehicles) / vehicle_count

Calculation method: Vehicle-based metric
- Include ALL vehicles (regular + emergency)
- Include stationary vehicles (speed = 0 km/h)
- Calculate at every physics tick (100 Hz)
- Convert from m/s (physics) to km/h for display: speed_kmh = speed_ms × 3.6

Formula:
  avg_speed = (sum of all v_i in km/h) / count(vehicles)

Example:
- 3 vehicles: speeds 60, 30, 0 km/h
- Average = (60 + 30 + 0) / 3 = 30 km/h

Edge case: No vehicles
- count(vehicles) = 0 → Display "—" or "N/A" (NOT "0")
- Rationale: 0 km/h means stationary; N/A means undefined

Update frequency: Display at 10 Hz refresh rate
Decimal precision: 1 decimal place (e.g., "34.5 km/h")
```

**Special cases**:
- Only emergency vehicles: Include equally in average
- No movement: Display "0 km/h" (not "N/A")
- All vehicles stopped: Display "0 km/h"

---

## Inputs & Outputs

### Inputs

- **REQ-028**: Current state display specification (source)
- **Physics engine data**: Vehicle speeds, positions, collision states at 100 Hz
- **Time tracking**: Simulation start time, reset points
- **Exit tracking**: Vehicle exit events from intersection

### Outputs

- **Updated REQ-028**: Precise metric definitions with formulas
- **Metric calculation pseudocode**: Algorithm for each metric
- **Test vectors**: Example scenarios with expected outputs
- **Edge case handling**: Specified behavior for all corner cases

### Data Types

| Metric | Input Type | Calculation | Output Format |
| --- | --- | --- | --- |
| Throughput | Integer count | Division by 1.0 | Float "XX.X veh/min" |
| Collision-free ratio | Boolean (collision yes/no) | Ratio × 100 | Integer "XX%" |
| Average speed | Float list (km/h) | Sum / count | Float "XX.X km/h" or "—" |

---

## Operating States & Transitions

### Metric Calculation State Machine

```
[SIMULATION START]
    ↓ (initialize counters)
[PHYSICS TICKING at 100 Hz]
    └─ [Collect vehicle data]
       └─ [Calculate metrics]
           ├─ Throughput: rolling window (last 60s)
           ├─ Collision-free: time-based ratio
           └─ Average speed: sum/count
    ↓ (every 10 Hz = 100 ms)
[DISPLAY REFRESH]
    └─ [Format and render metrics]
         ├─ Throughput: "XX.X veh/min"
         ├─ Collision-free: "XX%"
         └─ Avg speed: "XX.X km/h" or "—"
```

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Calculation frequency | 100 Hz (physics tick basis) | Real-time metric tracking |
| Display refresh frequency | 10 Hz (100 ms) | User-visible update rate |
| Throughput window | 60 seconds (rolling) | One-minute metric standard |
| Decimal precision | 1 place | Balance precision vs. readability |
| Memory overhead | <1 MB | Track 60s × 100 ticks = 6000 entries |
| Calculation latency | <1 ms | Per-tick overhead acceptable |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Division by zero (avg speed) | Display "—" or "N/A" | Prevent crash; indicate undefined |
| Throughput calculation underflow | Clamp to 0.0 | Negative throughput impossible |
| Collision state undefined | Assume no collision (conservative) | Errs on safety side |
| Metric calculation skipped | Use last valid value (stale) | Prevent visible glitches |
| Time window overflow | Reset counters if > max time | Prevent counter overflow |

### Error Handling

- **Invalid vehicle count**: Use 0 (no vehicles present)
- **Invalid speed**: Clamp to 0–200 km/h range
- **Collision state uncertain**: Treat as no collision

---

## Acceptance Criteria

### Throughput Definition

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Time window specified** | Rolling 60-second window explicitly defined | Review definition; confirm 60s |
| **Exit point defined** | Vehicle exiting intersection point defined | Verify exit event logic clear |
| **Startup behavior** | Behavior for t < 60s specified with example | Check startup calculation example |
| **Accuracy** | Calculated value matches manual count ±1 vehicle | Test: count exits manually vs display |

### Collision-Free Ratio Definition

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Basis defined** | Time-based (not vehicle-based) clearly stated | Review definition; confirm basis |
| **Formula specified** | Collision_free_ticks / total_ticks × 100 formula explicit | Verify formula in updated spec |
| **Edge cases** | Startup (< 1s) and continuous collision cases specified | Check edge case behavior |
| **Accuracy** | Calculated ratio matches simulation state ±0.1% | Test: calculate manually vs display |

### Average Speed Definition

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Empty scenario** | Specified as "—" or "N/A" when no vehicles | Verify behavior in specification |
| **Stopped vehicles included** | Vehicles with speed=0 included in average | Test: spawn 1 stopped vehicle; verify affects average |
| **Units correct** | Converted to km/h (not m/s) | Verify conversion constant 3.6 |
| **Emergency vehicles included** | Emergencies weighted equally in average | Test: mix regular + emergency; verify average correct |

### General Metric Acceptance

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Precision specified** | Decimal places defined (1 place recommended) | Review updated specification |
| **Update frequency** | Display refresh rate specified (10 Hz recommended) | Verify in specification |
| **Test vectors** | Example scenarios with expected outputs provided | Review test case table |

---

## Verification Method

1. **Definition Review**
   - Stakeholders review proposed metric definitions
   - Confirm formulas are precise and unambiguous
   - Obtain sign-off on definitions

2. **Implementation Specification**
   - Update REQ-028 with precise formulas
   - Add calculation pseudocode for each metric
   - Add test vectors (example calculations)

3. **Edge Case Testing**
   - Test startup (< 60 seconds for throughput)
   - Test zero vehicles (average speed)
   - Test continuous collision (collision-free ratio)
   - Test metric rollover/reset scenarios

4. **Accuracy Validation**
   - Run 10-minute simulation
   - Manually verify each metric at multiple points
   - Compare calculated vs. displayed values
   - Verify accuracy within tolerance

5. **UI Acceptance**
   - Confirm metrics display in correct format
   - Verify precision (decimal places) matches spec
   - Verify edge cases display correctly (N/A vs 0)

---

## Dependencies & Relationships

| Related Item | Relationship | Notes |
| --- | --- | --- |
| **REQ-028** | **REFERENCED** | Primary source of ambiguity; will be updated |
| **Physics engine** | **DEPENDENCY** | Provides vehicle speed and collision data |
| **Display system** | **DEPENDENCY** | Renders formatted metric values |
| **Test strategy** | **INFORMED BY** | Metric precision drives test validation |

---

## Unresolved Questions

| Question | Impact | Status |
| --- | --- | --- |
| **Q1: Should throughput use 60s or 30s window?** | Affects metric frequency oscillation | Recommend 60s (standard) |
| **Q2: Should average speed round or truncate?** | Affects display consistency | Recommend round to 1 decimal place |
| **Q3: Should collision-free ratio include stopped time?** | Affects interpretation | Recommend YES (base on elapsed time) |
| **Q4: Should metrics support custom time windows (configurable)?** | Affects feature scope | Recommend NO for v0.2.0; fixed windows |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ⏳ PENDING | Review and approve metric definitions |
| QA Lead | ⏳ PENDING | Validate metric accuracy testing approach |
| Product Lead | ⏳ PENDING | Confirm metric precision acceptable for users |

---

**Requirement Status**: 🟠 **OPEN - SHOULD FIX BEFORE TESTING**

*Recommended for resolution before QA begins system testing.*
