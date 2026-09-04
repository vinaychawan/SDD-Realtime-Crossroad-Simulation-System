---
requirement_id: MF-005
title: Complete Scenario Preset Definitions
priority: SHOULD
severity: MAJOR
version: 0.2.0
date: 2026-09-04
status: OPEN
found_in_review: SPECIFICATION-REVIEW.md
---

# MF-005: Complete Scenario Preset Definitions

**Requirement ID**: MF-005  
**Title**: Complete Scenario Preset Definitions  
**Priority**: SHOULD (should fix before implementation)  
**Severity**: 🟠 **MAJOR**  
**Status**: OPEN  
**Date Identified**: 2026-09-04  

---

## Requirement Statement

REQ-027 (UI Controls) defines 5 scenario presets but lacks **complete specifications**, leaving critical questions unanswered:
1. Is spawn rate **per-direction** or **total**?
2. Which **signal coordination mode** for each preset?
3. Which **lane selection strategy** for each preset?
4. What **signal durations** (green/red times) for each?

Without these specifications, **UI implementation cannot proceed**, and **QA cannot validate preset behavior**.

The system **shall complete the scenario preset definitions** with exhaustive parameter values for all presets, ensuring deterministic preset application and testable scenarios.

---

## Detailed Description

### Current Gaps in REQ-027

| Preset | Spawn Rate | Signal Mode | Lane Strategy | Signal Timing | Emergency | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Normal Traffic | 20 veh/min | **Unspecified** | **Unspecified** | 30s / 30s (unclear if per-direction) | 0 | ❌ Incomplete |
| Congestion Test | 60 veh/min | **Unspecified** | **Unspecified** | 30s / 30s | 0 | ❌ Incomplete |
| Sparse Traffic | 5 veh/min | **Unspecified** | **Unspecified** | 40s / 40s | 0 | ❌ Incomplete |
| Priority Operations | 20 veh/min | **Unspecified** | **Unspecified** | **Unspecified** | 5 veh/min | ❌ Incomplete |
| Custom | User manual | User manual | User manual | User manual | User manual | ✓ Complete |

### Ambiguities to Resolve

**Ambiguity 1: Per-Direction Spawn Rate**
- Does "20 veh/min" mean 20 total, or 20 per direction?
- If total: 20 ÷ 4 = 5 veh/min per direction
- If per-direction: 20 × 4 = 80 total veh/min
- **Resolution**: Recommend **per-direction** (more typical specification)

**Ambiguity 2: Signal Coordination Mode**
- Should each preset specify preferred mode?
- Examples:
  - Normal Traffic: Mode A (conservative, lower traffic)
  - Congestion Test: Mode B (advanced, higher throughput)
  - Sparse: Mode A (simpler logic for low traffic)
- **Resolution**: Recommend preset-specific modes based on traffic pattern

**Ambiguity 3: Lane Selection Strategy**
- Should preset determine strategy?
- Examples:
  - Normal Traffic: Random (baseline)
  - Congestion: Intelligent (better utilization)
  - Sparse: Random (strategy less impactful with low traffic)
- **Resolution**: Recommend preset-specific strategies

**Ambiguity 4: Signal Durations**
- Are green/red durations per-direction or global?
- Can different directions have different durations?
- **Resolution**: Recommend per-direction configuration (more flexible); provide default per-direction values in preset

---

## Complete Preset Specifications (Proposed)

### Preset 1: Normal Traffic

**Description**: Baseline scenario for standard traffic flow

| Parameter | Value | Notes |
| --- | --- | --- |
| Spawn Rate (per direction) | 20 veh/min | NORTH=20, SOUTH=20, EAST=20, WEST=20 |
| Signal Mode | STRICT_MUTUAL_EXCLUSION | Conservative approach |
| Lane Strategy | RANDOM | Baseline behavior |
| Green Duration (all directions) | 30 seconds | Standard duration |
| Red Duration (all directions) | 30 seconds | Standard duration |
| Emergency Spawn Rate | 0 veh/min | No emergencies |
| Frame Rate | 60 FPS | Default |

### Preset 2: Congestion Test

**Description**: High-traffic scenario testing throughput and queue management

| Parameter | Value | Notes |
| --- | --- | --- |
| Spawn Rate (per direction) | 60 veh/min | NORTH=60, SOUTH=60, EAST=60, WEST=60 |
| Signal Mode | OPPOSING_SIMULTANEOUS | Advanced mode for higher throughput |
| Lane Strategy | INTELLIGENT | Optimize for congestion |
| Green Duration (per direction) | 30 seconds | Standard duration |
| Red Duration (per direction) | 30 seconds | Standard duration |
| Emergency Spawn Rate | 0 veh/min | No emergencies (focus on throughput test) |
| Frame Rate | 30 FPS | Lower frame rate (intense traffic) |

### Preset 3: Sparse Traffic

**Description**: Low-traffic scenario testing edge cases and behavior at minimal load

| Parameter | Value | Notes |
| --- | --- | --- |
| Spawn Rate (per direction) | 5 veh/min | NORTH=5, SOUTH=5, EAST=5, WEST=5 |
| Signal Mode | STRICT_MUTUAL_EXCLUSION | Simple logic sufficient for low traffic |
| Lane Strategy | RANDOM | Behavior irrelevant at low traffic |
| Green Duration (per direction) | 40 seconds | Longer duration (less frequent switching needed) |
| Red Duration (per direction) | 40 seconds | Symmetric timing |
| Emergency Spawn Rate | 0 veh/min | No emergencies |
| Frame Rate | 60 FPS | Standard frame rate |

### Preset 4: Priority Operations

**Description**: Mixed regular and emergency vehicle scenario for testing emergency handling

| Parameter | Value | Notes |
| --- | --- | --- |
| Spawn Rate (per direction) | 20 veh/min | NORTH=20, SOUTH=20, EAST=20, WEST=20 |
| Signal Mode | OPPOSING_SIMULTANEOUS | Mode B required for collision prevention testing |
| Lane Strategy | INTELLIGENT | Realistic scenario |
| Green Duration (per direction) | 30 seconds | Standard duration |
| Red Duration (per direction) | 30 seconds | Standard duration |
| Emergency Spawn Rate (total) | 5 veh/min | 5 emergency vehicles per minute (distributed across types) |
| Emergency Type Distribution | Ambulance: 2 veh/min, Police: 2 veh/min, Fire: 1 veh/min | Realistic emergency mix |
| Frame Rate | 60 FPS | Standard frame rate |

### Preset 5: Custom

**Description**: User-defined scenario (all parameters manually selectable)

| Parameter | Value | Notes |
| --- | --- | --- |
| All parameters | User manual | UI allows full configuration |

---

## Inputs & Outputs

### Inputs

- **REQ-027**: Current scenario preset specification
- **REQ-005, REQ-007, REQ-020**: Signal coordination, lane strategy, frame rate
- **REQ-NEW-E1, REQ-NEW-E5**: Emergency vehicle types and spawn rates
- **Traffic engineering data**: Realistic spawn rates and signal timing

### Outputs

- **Updated REQ-027**: Complete scenario preset specifications with all parameters
- **Preset configuration table**: Exhaustive parameter listing for each preset
- **UI implementation guide**: How to apply preset values to UI controls
- **Test scenarios**: Each preset with expected behavior descriptions

### Data Types

| Item | Type | Range | Unit |
| --- | --- | --- | --- |
| spawn_rate_per_direction | Float | 0–60 | vehicles/minute |
| signal_mode | Enum | STRICT_MUTUAL_EXCLUSION \| OPPOSING_SIMULTANEOUS | - |
| lane_strategy | Enum | RANDOM \| INTELLIGENT | - |
| green_duration | Integer | 10–60 | seconds |
| red_duration | Integer | 10–60 | seconds |
| emergency_spawn_rate | Float | 0–20 | vehicles/minute |

---

## Operating States & Transitions

### Preset Application State Machine

```
[USER SELECTS PRESET]
    ↓ (applies configuration)
[PRESET CONFIGURATION APPLIED]
    ├─ Spawn Rate → Set spawn rate slider values
    ├─ Signal Mode → Set signal mode radio button
    ├─ Lane Strategy → Set lane strategy radio button
    ├─ Signal Timing → Set green/red duration sliders
    └─ Emergency Rate → Set emergency spawn slider (if applicable)
    ↓ (user can override)
[UI CONTROLS POPULATED]
    └─ User can modify any control before starting simulation
```

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Preset definition completion | 2–3 hours | Research + specification writing |
| UI implementation | 3–4 hours | Implement preset application logic |
| Validation testing | 2–3 hours | Test each preset scenario |
| Documentation | 1 hour | Update REQ-027 with complete specs |
| Total effort | 8–11 hours | Moderate effort; high impact |

---

## Acceptance Criteria

### Specification Completeness

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **All parameters specified** | Each preset defines all parameter values | Checklist: verify each preset complete |
| **Spawn rate clarified** | Per-direction vs. total explicitly stated | Review REQ-027; verify units documented |
| **Signal modes specified** | Each preset specifies signal coordination mode | Verify all presets have mode assignment |
| **Lane strategies specified** | Each preset specifies lane selection strategy | Verify all presets have strategy assignment |
| **Signal durations specified** | Green and red durations per direction defined | Verify all presets have timing values |

### UI Implementation

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Preset selection works** | Dropdown shows 5 options (4 presets + Custom) | UI test: verify dropdown functionality |
| **Preset applies values** | Selecting preset populates all controls correctly | Test each preset; verify all controls updated |
| **Override possible** | User can modify controls after preset selection | Test: select preset, change control, verify change applied |

### Validation Testing

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Normal Traffic scenario** | Verify 20 veh/min per direction, Mode A, Random strategy | Behavioral test: run preset, observe traffic flow |
| **Congestion Test scenario** | Verify 60 veh/min per direction, Mode B, Intelligent strategy | Behavioral test: run preset, verify high load handling |
| **Sparse Traffic scenario** | Verify 5 veh/min per direction, Mode A, Random strategy | Behavioral test: run preset, verify low-load behavior |
| **Priority Operations scenario** | Verify emergency vehicles and Mode B active | Behavioral test: observe emergency handling |

---

## Verification Method

1. **Parameter Specification**
   - Complete specification table for all presets
   - Resolve ambiguities (per-direction, mode, strategy, timing)
   - Document rationale for each parameter choice

2. **UI Mapping**
   - Create UI implementation guide
   - Map preset parameters to UI controls
   - Specify how preset values populate controls

3. **Implementation Testing**
   - Implement preset loading logic
   - Test each preset:
     - Normal Traffic: Standard flow
     - Congestion: High throughput
     - Sparse: Low load
     - Priority: Emergency handling
   - Verify controls populated correctly

4. **Behavioral Validation**
   - Run each preset scenario
   - Observe traffic behavior
   - Verify behavior matches intended pattern

5. **Documentation**
   - Update REQ-027 with complete specifications
   - Provide test case descriptions for each preset
   - Document any deviations from proposed values

---

## Dependencies & Relationships

| Related Item | Relationship | Notes |
| --- | --- | --- |
| **REQ-027** | **PRIMARY** | Source specification; will be updated |
| **REQ-005** | **DEPENDENCY** | Signal modes (STRICT vs OPPOSING) |
| **REQ-007** | **DEPENDENCY** | Lane strategies (RANDOM vs INTELLIGENT) |
| **REQ-020** | **DEPENDENCY** | Frame rate selection (30 vs 60 FPS) |
| **REQ-NEW-E5** | **DEPENDENCY** | Emergency spawn rates |

---

## Unresolved Questions

| Question | Impact | Status |
| --- | --- | --- |
| **Q1: Should spawn rate be per-direction?** | Affects all preset values | Recommend YES (standard practice) |
| **Q2: Should each preset have fixed mode or user-selectable?** | Affects UI flow | Recommend preset-specified (simplicity); user can change in Custom |
| **Q3: Should emergency types be split per preset?** | Affects emergency behavior | Recommend for Priority Operations only |
| **Q4: Should there be additional presets (e.g., "Merge Test")?** | Affects completeness | Recommend current 4 presets sufficient for v0.2.0 |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ⏳ PENDING | Review and approve preset specifications |
| Product Owner | ⏳ PENDING | Confirm presets meet use case expectations |
| QA Lead | ⏳ PENDING | Validate preset test scenarios |

---

**Requirement Status**: 🟠 **OPEN - SHOULD FIX BEFORE IMPLEMENTATION**

*Recommended for completion before UI implementation begins.*
