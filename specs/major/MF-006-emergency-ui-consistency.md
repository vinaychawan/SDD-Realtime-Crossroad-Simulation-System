---
requirement_id: MF-006
title: Clarify Emergency Vehicle UI Configuration
priority: SHOULD
severity: MAJOR
version: 0.2.0
date: 2026-09-04
status: OPEN
found_in_review: SPECIFICATION-REVIEW.md
---

# MF-006: Clarify Emergency Vehicle UI Configuration

**Requirement ID**: MF-006  
**Title**: Clarify Emergency Vehicle UI Configuration  
**Priority**: SHOULD (should fix before implementation)  
**Severity**: 🟠 **MAJOR**  
**Status**: OPEN  
**Date Identified**: 2026-09-04  

---

## Requirement Statement

REQ-027 (UI Controls) describes emergency vehicle configuration ambiguously:
- Shows "Emergency Type Selector: [▼ Ambulance, Police, Fire]" (single dropdown)
- But REQ-NEW-E5 requires **independent spawn rates** for all three types (ambulance_spawn_rate, police_spawn_rate, fire_brigade_spawn_rate)

**Fundamental question**: Can the user configure **all three emergency types simultaneously** or only **one type at a time**?

The UI design cannot proceed without clarity. The system **shall specify the exact UI interaction model** for emergency vehicle configuration, supporting simultaneous multi-type spawning as required by REQ-NEW-E5.

---

## Detailed Description

### Problem Analysis

**Current requirement statements**:

**REQ-027 (UI Controls)** shows:
```
EMERGENCY CONTROLS (if enabled):
Emergency Spawn [━━━○━] 5 veh/min
Type: [▼ Ambulance, Police, Fire]
```

**REQ-NEW-E5 (Spawn Rate)** specifies:
```
- Ambulance rate: 0–20 ambulances/minute
- Police rate: 0–20 police/minute
- Fire Brigade rate: 0–20 fire brigade/minute
```

**Contradiction**:
- REQ-027 implies single type selection (dropdown)
- REQ-NEW-E5 implies independent rates for all three types

**Questions**:
1. **UI Model A**: Single dropdown for TYPE selection + one spawn rate slider
   - User: Select "Ambulance" → Set spawn rate 10 veh/min → Only ambulances spawn
   - User: Select "Police" → Set spawn rate 5 veh/min → Only police spawn
   - **Implication**: User must reconfigure dropdown to spawn different type
   - **Issue**: Cannot spawn ambulances AND police simultaneously

2. **UI Model B**: Three independent sliders (one per type)
   - User: Set Ambulance rate: 10 veh/min
   - User: Set Police rate: 5 veh/min
   - User: Set Fire rate: 0 veh/min
   - **Implication**: All three types configured simultaneously
   - **Advantage**: Matches REQ-NEW-E5 requirement (independent rates)

3. **UI Model C**: Hybrid (dropdown + independent configuration)
   - Type dropdown selects which spinner to adjust
   - Three hidden sliders (Ambulance, Police, Fire)
   - Advanced UI; more complex but flexible

---

## Resolution Options

### Option A: Model B - Three Independent Sliders (RECOMMENDED)

**UI Layout**:
```
EMERGENCY CONTROLS (conditional):
┌────────────────────────────────┐
│ Emergency Spawn Rates:          │
│                                 │
│ Ambulance: [━━━○━] 5 veh/min   │
│ Police:    [━━━○━] 0 veh/min   │
│ Fire:      [━━━○━] 2 veh/min   │
└────────────────────────────────┘
```

**Advantages**:
- ✅ Matches REQ-NEW-E5 (independent rates)
- ✅ Clear and intuitive (one slider per type)
- ✅ Allows simultaneous spawning of all types
- ✅ Simple implementation

**Disadvantages**:
- Takes more UI space (three sliders vs. one dropdown)

### Option B: Model A - Single Type Dropdown + Rate Slider

**UI Layout**:
```
EMERGENCY CONTROLS (conditional):
Emergency Type: [▼ Ambulance]
Spawn Rate: [━━━○━] 5 veh/min
```

**Advantages**:
- ✅ Compact UI (fewer controls)
- ✅ Simpler for basic scenarios

**Disadvantages**:
- ❌ Conflicts with REQ-NEW-E5 (cannot set independent rates)
- ❌ User must reconfigure to change types
- ❌ Cannot spawn multiple types simultaneously
- ❌ Requires additional "Add Type" button complexity

### Option C: Model C - Hybrid with Advanced UI

**UI Layout**:
```
EMERGENCY CONTROLS (conditional):
┌────────────────────────────────┐
│ Emergency Spawn Rates:          │
│                                 │
│ Type: [▼ Ambulance ▲▼]         │
│ Rate: [━━━○━] 5 veh/min        │
│                                 │
│ [+ Add Type]                    │
│ • Ambulance: 5 veh/min          │
│ • Police: 0 veh/min             │
│ • Fire: 0 veh/min               │
└────────────────────────────────┘
```

**Advantages**:
- ✅ Matches REQ-NEW-E5
- ✅ Compact when collapsed
- ✅ Expands for multi-type configuration

**Disadvantages**:
- ❌ More complex UI logic
- ❌ Higher implementation effort

---

## Recommended Resolution

**Select Option A (Model B): Three Independent Sliders**

**Rationale**:
1. Directly implements REQ-NEW-E5 requirement (independent rates)
2. Simplest, most transparent UI
3. No hidden complexity or multi-step workflows
4. Supports simultaneous emergency type spawning
5. Clearest for both users and developers

**Updated UI Specification**:
```
EMERGENCY CONTROLS (if emergency_vehicles_enabled):
Ambulance Spawn Rate:   [━━━○━] 0 veh/min  (0–20 range)
Police Spawn Rate:      [━━━○━] 0 veh/min  (0–20 range)
Fire Brigade Spawn Rate:[━━━○━] 0 veh/min  (0–20 range)
```

---

## Inputs & Outputs

### Inputs

- **REQ-027**: Current UI specification (ambiguous emergency section)
- **REQ-NEW-E1**: Emergency vehicle types (Ambulance, Police, Fire)
- **REQ-NEW-E5**: Spawn rate requirements (independent per type)

### Outputs

- **Updated REQ-027**: Clarified emergency vehicle UI section with Model B
- **UI mockup**: Visual representation of three sliders
- **Configuration mapping**: How UI values map to backend spawn parameters
- **Implementation guide**: Pseudocode for slider value handling

### Data Types

| Item | Type | Range | Unit |
| --- | --- | --- | --- |
| ambulance_spawn_rate | Float | 0–20 | vehicles/minute |
| police_spawn_rate | Float | 0–20 | vehicles/minute |
| fire_spawn_rate | Float | 0–20 | vehicles/minute |

---

## Operating States & Transitions

### Emergency Configuration State Machine

```
[USER OPENS EMERGENCY CONTROLS]
    ↓ (conditional: only if emergencies enabled)
[EMERGENCY UI DISPLAYED]
    ├─ Ambulance Rate Slider visible
    ├─ Police Rate Slider visible
    └─ Fire Brigade Rate Slider visible
    ↓ (user adjusts sliders)
[CONFIGURATION UPDATED]
    ├─ ambulance_spawn_rate = slider_1_value
    ├─ police_spawn_rate = slider_2_value
    └─ fire_spawn_rate = slider_3_value
    ↓ (when simulation starts)
[SPAWN RATES APPLIED]
    └─ All three types spawn at configured rates (independent)
```

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| UI design review | 30 minutes | Stakeholder approval of Model B |
| Implementation (UI) | 2–3 hours | Add two additional sliders + bindings |
| Backend integration | 1–2 hours | Map slider values to spawn configuration |
| Testing | 1–2 hours | Verify sliders control spawn rates |
| Total effort | 4–8 hours | Moderate effort; straightforward implementation |

---

## Acceptance Criteria

### Design Clarity

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **UI model specified** | Option A (Three sliders) explicitly documented | Review updated REQ-027; verify Model B chosen |
| **Parameter mapping clear** | How sliders map to spawn_rate parameters documented | Verify configuration mapping in implementation guide |
| **Default values specified** | All three sliders default to 0 veh/min | Verify defaults in UI specification |

### UI Implementation

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Three sliders present** | Ambulance, Police, Fire sliders all visible and functional | UI inspection: verify all three sliders present |
| **Value ranges correct** | Each slider ranges 0–20 veh/min | Slider test: verify min/max values |
| **Slider values update config** | Changing slider updates backend configuration | Integration test: change slider → verify spawn rate changed |

### Verification Testing

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Independent spawn rates** | Can set Ambulance=5, Police=10, Fire=2 simultaneously | Config test: set different values; verify all three spawn |
| **Spawn verification** | All three types spawn at configured rates | Behavior test: run scenario; verify count of each type matches rate |
| **Simultaneous spawning** | All three types can spawn in same simulation | Duration test: run 1 minute; verify all types appear |

---

## Verification Method

1. **Design Review**
   - Present Options A, B, C to stakeholders
   - Recommend Option A (Model B: three sliders)
   - Obtain approval

2. **UI Specification Update**
   - Update REQ-027 emergency section with Model B
   - Add visual mockup or ASCII diagram
   - Document parameter mappings

3. **Implementation**
   - Add three independent sliders to UI
   - Connect sliders to spawn configuration
   - Set default values (all 0)

4. **Integration Testing**
   - Verify slider values propagate to simulation engine
   - Test edge cases (min/max values)
   - Test simultaneous configuration

5. **Behavioral Testing**
   - Run scenario with Ambulance=5, Police=5, Fire=5
   - Verify all three types spawn
   - Count vehicles per type; verify matches spawn rate

---

## Dependencies & Relationships

| Related Item | Relationship | Notes |
| --- | --- | --- |
| **REQ-027** | **PRIMARY** | Source specification; will be updated with Model B |
| **REQ-NEW-E1** | **DEPENDENCY** | Defines emergency vehicle types (must have 3) |
| **REQ-NEW-E5** | **DEPENDENCY** | Requires independent spawn rates for all types |
| **UI implementation** | **IMPLEMENTATION** | Developers will implement Model B based on this specification |

---

## Unresolved Questions

| Question | Impact | Status |
| --- | --- | --- |
| **Q1: Should there be a "disable emergencies" toggle?** | Affects UI organization | Recommend YES (conditionally show emergency controls) |
| **Q2: Should sliders have individual "preset" buttons?** | Affects convenience | Recommend NO for v0.2.0 (simple implementation) |
| **Q3: Should there be an emergency scenario auto-configuration?** | Affects quick-start UX | Recommend as future enhancement (v0.3.0+) |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ⏳ PENDING | Approve Model B specification |
| UI/UX Designer | ⏳ PENDING | Confirm UI layout feasible and usable |
| Lead Developer | ⏳ PENDING | Confirm implementation straightforward |

---

**Requirement Status**: 🟠 **OPEN - SHOULD FIX BEFORE IMPLEMENTATION**

*Critical for UI implementation clarity. Recommend resolution before UI development begins.*
