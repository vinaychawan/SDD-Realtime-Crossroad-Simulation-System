---
requirement_id: REQ-028
title: Enhanced Real-Time State Display
priority: SHOULD
version: 0.2.0
date: 2026-09-03
status: APPROVED
---

# REQ-028: Enhanced Real-Time State Display

**Requirement ID**: REQ-028  
**Title**: Enhanced Real-Time State Display  
**Priority**: SHOULD (monitoring and analysis)  
**Status**: APPROVED  
**Updated**: 2026-09-03

---

## Requirement Statement

The system **shall display current simulation state on-screen** with real-time metrics organized into logical panels:

- Configuration Display Panel
- Traffic Metrics Panel
- Signal Status Panel
- Collision Statistics Panel
- Performance Metrics Panel

All panels updated in real-time (100 Hz physics tick rate).

---

## Detailed Description

### Display Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ CONFIGURATION          │ TRAFFIC METRICS     │ COLLISION STATS   │
│ Scenario: Congestion   │ Vehicles: 42        │ Total Collisions: 3│
│ Frame Rate: 60 FPS     │ Emergencies: 2      │ Active: 0          │
│ Signal Mode: Opposing  │ Avg Speed: 38 km/h  │ Collision-free: 96%│
│ Lane Strategy: Random  │ Throughput: 18/min  │ Deadlocks: 0       │
└────────────────────────┴─────────────────────┴────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│ SIGNAL STATUS          │ PERFORMANCE METRICS                      │
│ ● NORTH: 25 sec       │ Rendered FPS: 60                        │
│ ● SOUTH: 45 sec       │ Physics: 100 Hz                         │
│ ● EAST: 10 sec        │ Memory: 256 MB                          │
│ ● WEST: Red           │ CPU: 35%                                │
└──────────────────────────────────────────────────────────────────┘
```

### Panel Descriptions

#### 1. Configuration Display Panel

**Purpose**: Show active configuration parameters

| Item | Display Format | Update Rate |
| --- | --- | --- |
| Active scenario mode | Text: "Normal Traffic", "Congestion Test", etc. | On change |
| Selected frame rate | "30 FPS" or "60 FPS" | On change |
| Selected signal coordination mode | "Strict Mutual Exclusion" or "Opposing Simultaneous" | On change |
| Selected lane selection strategy | "Random" or "Intelligent Pre-Positioning" | On change |

#### 2. Traffic Metrics Panel

**Purpose**: Real-time traffic flow monitoring

| Metric | Display Format | Range | Unit |
| --- | --- | --- | --- |
| Active vehicle count (regular) | Integer | 0–500+ | vehicles |
| Emergency vehicle count | Integer | 0–50 | vehicles |
| Average vehicle speed | Float | 0–100 | km/h |
| Throughput (exiting per minute) | Float | 0–60 | veh/min |

**Calculation**:
- **Avg speed**: Sum of all vehicle speeds / vehicle count (or 0 if no vehicles)
- **Throughput**: Vehicles exiting per minute (counted over 1-minute window)

#### 3. Signal Status Panel

**Purpose**: Display current signal state for each direction

| Direction | Display Format | Color Indicator | Time Remaining |
| --- | --- | --- | --- |
| NORTH | "● NORTH: 25 sec" | Red/Green/Amber circle | Time until next transition (seconds) |
| SOUTH | "● SOUTH: 45 sec" | Red/Green/Amber circle | Time until next transition (seconds) |
| EAST | "● EAST: 10 sec" | Red/Green/Amber circle | Time until next transition (seconds) |
| WEST | "● WEST: Red" (if < 1 sec) | Red circle | Seconds or "Red"/"Green"/"Amber" |

**Color Legend**:
- 🔴 RED: Stop
- 🟢 GREEN: Go
- 🟡 AMBER: Proceed to clear intersection

**Timing**: Time remaining until signal changes (accurate to nearest second).

#### 4. Collision Statistics Panel

**Purpose**: Track collision events and deadlocks

| Statistic | Display Format | Range | Reset |
| --- | --- | --- | --- |
| Total collisions (cumulative) | Integer | 0–1000+ | On reset simulation |
| Active collisions (current) | Integer | 0–50 | Real-time count |
| Collision-free ratio | Percentage | 0–100% | Based on total vs. collision-free time |

**Definitions**:
- **Collision**: Vehicle-to-vehicle contact or vehicle-to-infrastructure contact
- **Deadlock**: Vehicle waiting > 5 seconds for conflict zone to clear (REQ-NEW-COLLISION-PREVENTION-1)

#### 5. Performance Metrics Panel

**Purpose**: Monitor system performance and resource usage

| Metric | Display Format | Target | Unit |
| --- | --- | --- | --- |
| Current FPS (rendered) | Integer | 30 or 60 (configured) | FPS |
| Physics ticks per second | Float | 100 | Hz |
| Memory usage | Integer | <500 | MB |
| CPU usage | Float | <80 | % |

**Display Format**:
- FPS: "60 FPS" or "30 FPS"
- Physics: "100 Hz" or "98–102 Hz" (if showing range)
- Memory: "256 MB" or "256/512 MB" (if showing used/total)
- CPU: "35%" or "35% (warning!)" (if threshold exceeded)

---

## Configuration Parameters

| Parameter | Type | Default |
| --- | --- | --- |
| `display_panels_enabled` | Boolean | true |
| `panel_update_frequency` | Integer | 10 Hz (rendered; physics at 100 Hz) |
| `metric_decimal_places` | Integer | 1 (e.g., 45.3 km/h) |
| `warning_thresholds` | Dict | CPU>80%, Memory>80%, Collisions>10 |

---

## Inputs & Outputs

### Inputs

- **Configuration state**: Current parameter selections
- **Simulation state**: Vehicle positions, speeds, signal states
- **Collision events**: When collisions occur
- **Performance metrics**: FPS, CPU, memory from system

### Outputs

- **Rendered panels**: Text and graphics displayed on screen
- **Color indicators**: Signal colors (R/G/A)
- **Metric values**: Numerical displays updating in real-time
- **Warnings**: Color changes or alerts for threshold breaches

### Data Types

| Parameter | Type | Range | Unit |
| --- | --- | --- |
| `vehicle_count` | Integer | 0–500+ | count |
| `avg_speed` | Float | 0–100 | km/h |
| `collision_count` | Integer | 0–1000+ | count |
| `fps` | Integer | 0–120 | FPS |
| `memory_usage` | Integer | 0–1024 | MB |
| `cpu_usage` | Float | 0–100 | % |

---

## Operating States & Transitions

### Display State Machine

```
[SIMULATION STOPPED]
    ↓ (show initial state: 0 vehicles, signals RED)
[DISPLAY READY]
    ↓ (simulation starts)
[METRICS UPDATING] ← (100 Hz physics; 10 Hz display refresh)
    ↓ (simulation paused)
[DISPLAY FROZEN] ← (show last state)
    ↓ (simulation reset)
[DISPLAY RESET] → (back to initial state)
```

**Update Frequency**:
- **Physics basis**: 100 Hz (vehicles, collisions, signals)
- **Display refresh**: 10 Hz (user-visible update; more frequent may be excessive)
- **Panel updates**: Independent per panel (config on-change; metrics 10 Hz)

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Display refresh rate | 10 Hz (100 ms) | Balance responsiveness with rendering load |
| Metric update latency | ≤500 ms | Acceptable delay for user observation |
| Display rendering overhead | <5% CPU | Minimal impact on physics simulation |
| Panel layout stability | Static | No UI flicker or moving elements |
| Color update latency | ≤100 ms | Quick signal color indication |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Metric not available | Display "N/A" or last known value | Prevent blank displays |
| Display update skipped | Show stale value until next update | Maintain visual continuity |
| Collision count overflow | Cap at max integer or reset to 0 | Prevent integer overflow |
| Memory query fails | Display warning; estimate from previous values | Still provide feedback |

---

## Acceptance Criteria

### Configuration Display Panel

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Scenario displayed** | Active scenario name shown | Config test: select scenario; verify displayed |
| **Frame rate displayed** | "30 FPS" or "60 FPS" shown | Frame rate test: change rate; verify display updates |
| **Signal mode displayed** | Mode name shown | Signal test: select mode; verify displayed |
| **Lane strategy displayed** | Strategy name shown | Lane test: select strategy; verify displayed |

### Traffic Metrics Panel

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Vehicle count accuracy** | Display = actual vehicle count | State test: spawn known number; verify count displayed |
| **Emergency count accuracy** | Display = actual emergency count | Emergency test: spawn emergencies; verify count |
| **Average speed calculation** | Speed = sum(v_i) / n (vehicles average) | Speed test: measure avg speed vs. display |
| **Throughput calculation** | Throughput = vehicles exiting per minute | Throughput test: measure exits over 1 min; verify display |

### Signal Status Panel

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Signal color correct** | Color matches signal state (R/G/A) | Signal test: change signals; verify colors match |
| **Time remaining accurate** | Time shown matches time until transition | Timing test: measure time; verify display accuracy ±1 sec |
| **All four directions** | All N/S/E/W displayed | Layout test: verify all 4 directions visible |

### Collision Statistics Panel

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Total collision count** | Counter increments on each collision | Collision test: create collision; verify count increases |
| **Active collision count** | Shows vehicles currently in collision | Collision test: maintain collision; verify count >0 |
| **Collision-free ratio** | Ratio = (time_no_collision / total_time) × 100% | Duration test: run 10 min; verify ratio calculation |
| **Counter reset** | Reset button clears collision count to 0 | Reset test: reset simulation; verify collisions = 0 |

### Performance Metrics Panel

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **FPS display** | Display matches actual rendered frame rate ±2 FPS | FPS test: measure actual FPS vs. display |
| **Physics display** | Display ~100 Hz | Physics test: measure ticks/sec; verify display ≈100 Hz |
| **Memory display** | Display ≤ actual system memory used | Memory test: log system memory; compare to display |
| **CPU display** | Display ≤ actual CPU usage (or warning above 80%) | CPU test: measure; verify threshold warnings |

---

## Verification Method

1. **Configuration Panel Test**
   - Change each configuration parameter
   - Verify display updates to reflect changes

2. **Traffic Metrics Test**
   - Spawn known vehicle count (e.g., 20)
   - Verify displayed count matches
   - Measure avg speed (sum all speeds / 20)
   - Verify display matches calculation

3. **Signal Status Test**
   - Observe signals changing (R→G→A→R cycle)
   - Verify colors and time remaining accurate
   - Check all 4 directions displayed

4. **Collision Test**
   - Create controlled collision scenario
   - Verify collision count increments
   - Verify collision-free ratio calculates correctly

5. **Performance Test**
   - Measure actual frame rate; compare to display
   - Measure physics tick rate; verify ≈100 Hz
   - Monitor CPU/memory; verify display within ±5%

6. **Stress Test**
   - Run full scenario with 200+ vehicles
   - Verify display remains responsive
   - Verify no visual lag or freezing

---

## Dependencies & Relationships

| Related Requirement | Relationship | Notes |
| --- | --- | --- |
| **REQ-027** | **RELATED** | UI controls and display panels work together |
| **REQ-005** | **REFERENCED BY** | Signal status panel displays REQ-005 states |
| **REQ-020** | **REFERENCED BY** | Performance panel displays frame rate from REQ-020 |
| **REQ-NEW-COLLISION-PREVENTION-1** | **REFERENCED BY** | Collision stats reflect REQ-NEW-COLLISION-PREVENTION-1 deadlock events |

---

## Unresolved Questions

| Question | Answer | Status |
| --- | --- | --- |
| Can panels be hidden/customized? | Future enhancement (not in this release) | CLARIFIED: All panels always visible |
| Can metrics be exported to file? | Future enhancement (not in this release) | CLARIFIED: Display-only in v0.2 |
| What is acceptable memory usage? | <500 MB for 200+ vehicles at 60 FPS | CLARIFIED: Benchmark established |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ✅ APPROVED | Display specification detailed; all metrics defined |
| System Architect | ✅ APPROVED | Display implementation feasible; metric calculations clear |
| QA Lead | ✅ APPROVED | Acceptance criteria comprehensive; visual verification methods defined |

**Requirement Status**: ✅ **APPROVED and READY FOR IMPLEMENTATION**
