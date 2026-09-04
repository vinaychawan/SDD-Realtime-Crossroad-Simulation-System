---
requirement_id: REQ-027
title: Enhanced UI Controls & Configuration
priority: MUST
version: 0.2.0
date: 2026-09-03
status: APPROVED
---

# REQ-027: Enhanced UI Controls & Configuration

**Requirement ID**: REQ-027  
**Title**: Enhanced UI Controls & Configuration  
**Priority**: MUST (user interface for parameter control)  
**Status**: APPROVED  
**Updated**: 2026-09-03

---

## Requirement Statement

The system **shall provide comprehensive user interface controls** for scenario selection, configuration, and simulation management:

- Scenario presets (5 predefined options)
- Frame rate selection (30 or 60 FPS)
- Signal coordination mode selection
- Lane selection strategy selection
- Per-direction traffic parameter sliders
- Emergency vehicle controls
- Simulation playback controls

---

## Detailed Description

### UI Layout

The interface is organized into logical sections:

```
┌─────────────────────────────────────────────┐
│ Scenario Selection      [▼ Normal Traffic]  │
├─────────────────────────────────────────────┤
│ Frame Rate:  ☉ 30 FPS   ○ 60 FPS (default) │
├─────────────────────────────────────────────┤
│ Signal Mode: ☉ Strict    ○ Opposing (Mode) │
├─────────────────────────────────────────────┤
│ Lane Select: ☉ Random    ○ Intelligent      │
├─────────────────────────────────────────────┤
│ TRAFFIC CONTROLS (per direction):           │
│ NORTH: Spawn Rate [━━━○━] 20 veh/min      │
│        Green Duration [━━━○━] 30 sec       │
│        Red Duration [━━━○━] 30 sec         │
│ (same for SOUTH, EAST, WEST)               │
├─────────────────────────────────────────────┤
│ EMERGENCY CONTROLS (if enabled):            │
│ Emergency Spawn [━━━○━] 5 veh/min          │
│ Type: [▼ Ambulance, Police, Fire]          │
├─────────────────────────────────────────────┤
│ SIMULATION CONTROLS:                        │
│ [► Start]  [⏸ Pause]  [⏹ Reset]            │
│ Speed: [▼ 1x]  │  Fps: 60  │  Vehicles: 42  │
└─────────────────────────────────────────────┘
```

### Control Sections

#### 1. Scenario Selection (Dropdown)

| Option | Default Params | Use Case |
| --- | --- | --- |
| Normal Traffic | Regular spawn 20 veh/min; signal durations 30s each | Baseline traffic flow |
| Congestion Test | High spawn 60 veh/min; signal durations 30s | Test queue management |
| Sparse Traffic | Low spawn 5 veh/min; signal durations 40s | Test low-traffic behavior |
| Priority Operations | Regular 20 veh/min + Emergency 5 veh/min | Test emergency handling |
| Custom | User manual configuration | Researcher-defined scenario |

**Effect**: Selecting a scenario pre-populates all other controls with recommended values (user can override).

#### 2. Frame Rate Selection (Radio Buttons)

| Option | Effect | Impact |
| --- | --- | --- |
| 30 FPS | Render at 30 frames/second; lower GPU load | Lower smoothness, better for low-end systems |
| 60 FPS (default) | Render at 60 frames/second; higher quality | Smooth rendering, higher GPU load |

#### 3. Signal Coordination Mode (Radio Buttons)

| Option | Effect | Impact |
| --- | --- | --- |
| Strict Mutual Exclusion (default) | Only one direction green at a time | Conservative, simpler logic |
| Opposing Simultaneous | N/S and E/W can both be green | Higher throughput, requires collision prevention |

#### 4. Lane Selection Strategy (Radio Buttons)

| Option | Effect | Impact |
| --- | --- | --- |
| Random (default) | Vehicles randomly choose exit lane | Baseline behavior, simple |
| Intelligent Pre-Positioning | Vehicles optimize lane before intersection | Realistic behavior, more efficient |

#### 5. Per-Direction Traffic Controls (Sliders)

**For NORTH, SOUTH, EAST, WEST:**

- **Spawn Rate**: 0–60 vehicles/minute (slider)
- **Green Signal Duration**: 10–60 seconds (slider)
- **Red Signal Duration**: 10–60 seconds (slider)

**Default**: Spawn=20, Green=30s, Red=30s

#### 6. Emergency Vehicle Controls (Conditional)

**Only visible if emergency vehicles enabled:**

- **Emergency vehicle spawn rate slider**: 0–20 vehicles/minute
- **Emergency vehicle type selector dropdown**: Ambulance | Police | Fire
- **Per-type spawn rate** (optional): Separate sliders for each type

#### 7. Simulation Controls (Buttons)

| Button | Function | State |
| --- | --- | --- |
| **▶ Play** | Start or resume simulation | Enabled when paused/stopped |
| **⏸ Pause** | Pause physics and rendering | Enabled when running |
| **⏹ Reset** | Clear all vehicles; return to empty state | Enabled always |
| **Speed Multiplier** | 1x, 2x, 4x physics speed | Dropdown; default 1x |

---

## Configuration Parameters

| Parameter | Type | UI Element | Constraints |
| --- | --- | --- | --- |
| `scenario_preset` | String | Dropdown | 5 options |
| `target_frame_rate` | Integer | Radio buttons | 30 or 60 |
| `signal_coordination_mode` | String | Radio buttons | STRICT_MUTUAL_EXCLUSION \| OPPOSING_SIMULTANEOUS |
| `lane_selection_strategy` | String | Radio buttons | RANDOM \| INTELLIGENT |
| `spawn_rate_N`, `_S`, `_E`, `_W` | Float | Slider | 0–60 veh/min |
| `green_duration_N`, `_S`, `_E`, `_W` | Float | Slider | 10–60 sec |
| `red_duration_N`, `_S`, `_E`, `_W` | Float | Slider | 10–60 sec |
| `emergency_spawn_rate` | Float | Slider | 0–20 veh/min |
| `emergency_vehicle_type` | String | Dropdown | Ambulance \| Police \| Fire |
| `simulation_speed` | Float | Dropdown | 1x, 2x, 4x |

---

## Inputs & Outputs

### Inputs

- **User interactions**: Mouse clicks, slider drags, dropdown selections
- **Simulation state**: Running, paused, or stopped
- **Configuration state**: Current parameter values

### Outputs

- **Configuration parameters**: Values sent to simulation engine
- **UI state**: Controls enabled/disabled based on simulation state
- **Scenario application**: Preset values applied when scenario selected

### Data Types

| Parameter | Type | Range | Unit |
| --- | --- | --- |
| `slider_value` | Float | 0–100 (normalized) | % |
| `dropdown_selection` | String | enum | Option |
| `radio_selection` | Boolean | true \| false | Boolean |
| `button_state` | Boolean | enabled \| disabled | State |

---

## Operating States & Transitions

### UI State Machine

```
[STARTUP]
    ↓ (user configures)
[CONFIGURATION ACTIVE] ← (can modify all controls)
    ↓ (user clicks Play)
[SIMULATION RUNNING] ← (some controls disabled; can modify spawn rates, emergency rates, speed)
    ↓ (user clicks Pause)
[SIMULATION PAUSED] ← (can modify any control)
    ↓ (user clicks Play)
[SIMULATION RUNNING]
    ↓ (user clicks Reset)
[CONFIGURATION ACTIVE]
```

**Control Availability**:
- **Configuration phase**: All controls editable
- **Running phase**: Spawn rates, emergency rates, speed multiplier editable; mode/strategy locked
- **Paused phase**: All controls editable

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| UI responsiveness | ≤100 ms input-to-action latency | User perceived responsiveness |
| Slider drag smoothness | 30 FPS (50 ms refresh) | Visual smoothness during drag |
| Dropdown animation | ≤200 ms open/close | Quick visual feedback |
| Control availability change | Immediate | Instant enable/disable |
| Scenario load time | ≤500 ms | Pre-populate all controls quickly |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Invalid parameter value | Clamp to valid range; show warning | Prevent configuration errors |
| Control not responding | Retry; log error | Handle UI lag gracefully |
| Scenario preset not found | Default to Custom mode | Graceful degradation |
| Configuration not saved | Use last valid values | Prevent data loss |

---

## Acceptance Criteria

### Scenario Selection

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Five scenarios available** | All 5 scenarios selectable (Normal, Congestion, Sparse, Priority, Custom) | UI test: click dropdown; verify all 5 options visible |
| **Preset application** | Selecting preset applies all recommended parameters | Config test: select "Congestion"; verify spawn rate = 60, others updated |
| **Custom override** | User can modify any parameter after scenario selection | Override test: select scenario; modify one control; verify change applied |

### Frame Rate Selection

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Radio buttons** | Two options: 30 FPS and 60 FPS | UI test: verify both radio buttons visible and selectable |
| **Default 60 FPS** | 60 FPS selected by default | Startup test: verify 60 FPS radio button pre-selected |
| **Selection effect** | Selecting 30 FPS changes frame rate; selecting 60 FPS changes frame rate | Config test: select each option; measure actual frame rate |

### Signal Mode & Lane Strategy

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Signal mode options** | Two options visible: Strict and Opposing | UI test: verify both radio buttons visible |
| **Lane strategy options** | Two options visible: Random and Intelligent | UI test: verify both radio buttons visible |
| **Default selections** | Strict Mutual Exclusion, Random strategy selected by default | Startup test: verify defaults pre-selected |

### Traffic Control Sliders

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Spawn rate range** | Slider 0–60 veh/min for each direction | Range test: drag slider; verify 0–60 range |
| **Signal duration range** | Sliders 10–60 sec for green and red durations | Range test: drag sliders; verify 10–60 range each |
| **Real-time effect** | Changing slider during simulation affects traffic immediately | Live test: adjust spawn rate mid-simulation; observe vehicle spawn rate change |

### Emergency Controls

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Spawn rate slider** | Emergency spawn rate 0–20 veh/min configurable | Range test: drag slider; verify 0–20 range |
| **Type selector** | All three emergency types selectable (Ambulance, Police, Fire) | UI test: click dropdown; verify 3 options visible |
| **Conditional visibility** | Emergency controls only visible if emergency vehicles enabled | Visibility test: without emergency enablement, controls hidden; with enablement, visible |

### Simulation Controls

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Play button** | Starts/resumes simulation | Control test: click Play; verify simulation starts |
| **Pause button** | Pauses simulation (freezes physics) | Control test: click Pause; verify physics stops |
| **Reset button** | Clears all vehicles; returns to empty state | Control test: click Reset; verify all vehicles removed |
| **Speed multiplier** | 1x, 2x, 4x options affect simulation speed | Speed test: select 2x; measure physics tick rate increase |

---

## Verification Method

1. **UI Rendering Test**
   - Launch application
   - Verify all controls visible and properly labeled
   - Verify layout matches specification

2. **Scenario Selection Test**
   - Select each of 5 scenarios
   - Verify all parameters update correctly
   - Verify user can override preset values

3. **Control Functionality Test**
   - Test each radio button: Verify effect on simulation
   - Test each slider: Verify value range and real-time effect
   - Test each dropdown: Verify options and selection effect

4. **State-Based Control Test**
   - Configuration phase: All controls enabled
   - Running phase: Spawn/emergency rates editable; mode/strategy locked
   - Paused phase: All controls editable

5. **Responsiveness Test**
   - Measure input-to-action latency (should be <100 ms)
   - Drag slider; measure frame rate (should be ≥30 FPS)

---

## Dependencies & Relationships

| Related Requirement | Relationship | Notes |
| --- | --- | --- |
| **REQ-005** | **REFERENCED** | Signal mode selection exposed in UI |
| **REQ-007** | **REFERENCED** | Lane strategy selection exposed in UI |
| **REQ-020** | **REFERENCED** | Frame rate selection exposed in UI |
| **REQ-NEW-E5** | **REFERENCED** | Emergency spawn rate slider in UI |
| **REQ-028** | **RELATED** | UI and display panels work together |

---

## Unresolved Questions

| Question | Answer | Status |
| --- | --- | --- |
| Can users save/load configurations? | Future enhancement (not in this release) | CLARIFIED: Out of scope for v0.2 |
| Are keyboard shortcuts available? | Future enhancement | CLARIFIED: Out of scope for v0.2 |
| Can UI be resized? | No; fixed resolution | CLARIFIED: Fixed layout |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ✅ APPROVED | UI specification detailed; control layout clear |
| System Architect | ✅ APPROVED | UI implementation feasible; control logic straightforward |
| QA Lead | ✅ APPROVED | Acceptance criteria comprehensive; functional testing defined |

**Requirement Status**: ✅ **APPROVED and READY FOR IMPLEMENTATION**
