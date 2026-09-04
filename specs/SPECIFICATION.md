---
status: APPROVED
title: Realtime Crossroad Simulation - Left-Hand Drive (Netherlands)
version: 0.2.0
date: 2026-09-03
---

**Status**: APPROVED (All blocking questions resolved by stakeholders)

---

## RESOLUTION SUMMARY: Blocking Questions Answered

### ✅ Q1: Target Frame Rate - RESOLVED

**Decision**: Frame rate configurable with options for 30 FPS and 60 FPS

- User can select target frame rate at startup or runtime
- Both 30 FPS and 60 FPS fully supported
- Physics maintains 100 Hz independent of render rate
- **Affected Requirements**: REQ-020 (UPDATED), REQ-023 (UPDATED)

### ✅ Q2: Lane Selection Strategy - RESOLVED

**Decision**: Lane selection configurable with both random and intelligent pre-positioning options

- Configuration option: `lane_selection_mode` (RANDOM | INTELLIGENT)
- **RANDOM Mode**: Vehicle randomly chooses exit lane regardless of current position
- **INTELLIGENT Mode**: Vehicle pre-positions in correct lane before intersection if possible
- **Affected Requirements**: REQ-007 (UPDATED), REQ-011 (UPDATED), REQ-012 (UPDATED)

### ✅ Q3: Yield/Priority Rules - RESOLVED

**Decision**: Priority rules for emergency vehicles ONLY (Ambulance, Police, Fire brigades)

- No generic vehicle-to-vehicle yield/priority enforcement
- All regular vehicles follow same movement rules (first-come-first-served at intersection)
- **Emergency vehicles get special handling**:
  - REQ-NEW-E1: Support for Ambulance, Police, Fire Brigade types
  - REQ-NEW-E2: Visual distinction (lights, color, label)
  - REQ-NEW-E3: Can override red signals (right-of-way)
  - REQ-NEW-E4: Other vehicles within 50m must yield
  - REQ-NEW-E5: Configurable emergency spawn rate
- **Affected Requirements**: REQ-013 (UPDATED), NEW REQ-E1 through REQ-E5

### ✅ Q4: Runtime Configuration & Test Scenarios - RESOLVED

**Decision**: User can configure traffic scenarios and test modes with full parameter exposure

- **Scenario Showcase Modes** (dropdown):
  - Normal Traffic: Regular vehicle mix and flow
  - Congestion Test: High vehicle spawn rates
  - Sparse Traffic: Low spawn rates
  - Priority Operations: Mix of emergency + regular vehicles
  - Custom: User-defined parameters
- **Configuration Scope**: FULL parameter exposure at runtime (spawn rates, signal timing, etc.)
- **Affected Requirements**: REQ-027 (UPDATED), REQ-028 (UPDATED)

### ✅ Q5: Opposing Directions Simultaneous Green - RESOLVED

**Decision**: Yes, opposing directions CAN both have green simultaneously, but collision prevention required

- North AND South can both be green at the same time
- East AND West can both be green at the same time
- BUT: N/S green blocks E/W from being green (and vice versa)
- **Collision Prevention Required**: REQ-NEW-COLLISION-PREVENTION-1
  - Define intersection conflict zone (~25m × 25m central area)
  - Track vehicles entering zone
  - Delay entry if zone occupied by opposing-direction vehicle
  - Max 5-second wait tolerance (3-vehicle queue limit)
- **Affected Requirements**: REQ-005 (UPDATED), REQ-013 (UPDATED), REQ-014 (UPDATED), NEW REQ-COLLISION-PREVENTION-1

---

## UPDATED REQUIREMENTS (Changes from Stakeholder Resolution)

### REQ-005 (UPDATED): Signal Coordination - TWO MODES SUPPORTED

The system shall support TWO signal coordination modes, configurable at startup:

**Mode A: Strict Mutual Exclusion** (traditional, conservative)

- At most ONE direction has green signal at any time
- NORTH and SOUTH alternate in priority
- EAST and WEST alternate in priority
- NORTH/SOUTH cycle independent from EAST/WEST cycle
- **Use case**: Conservative intersection management, simpler logic
- **Configuration value**: `STRICT_MUTUAL_EXCLUSION`

**Mode B: Opposing Directions Simultaneous** (modern, higher throughput)

- NORTH and SOUTH can BOTH be green simultaneously
- EAST and WEST can BOTH be green simultaneously
- BUT cross-direction pairs are mutually exclusive:
  - If N/S green: E/W must be RED
  - If E/W green: N/S must be RED
- **Use case**: Higher throughput, balanced two-way traffic
- **Configuration value**: `OPPOSING_SIMULTANEOUS`
- **Safety Requirement**: REQ-NEW-COLLISION-PREVENTION-1 mandates collision avoidance logic

**Priority**: MUST  
**Configuration Parameter**: `signal_coordination_mode` (STRICT_MUTUAL_EXCLUSION | OPPOSING_SIMULTANEOUS)  
**Selection Timing**: Chosen at simulation start; applies for entire run  
**Default**: STRICT_MUTUAL_EXCLUSION

---

### REQ-007 (UPDATED): Vehicle Lane Selection - TWO STRATEGIES SUPPORTED

The system shall support TWO vehicle lane selection strategies, configurable at startup:

#### Strategy A: Random Lane Selection

- Vehicle randomly chooses exit lane (1, 2, or 3) upon spawn
- No correlation to current lane or intelligent pathfinding
- All lanes equally probable (33% each direction)
- **Use case**: Testing general traffic flow, baseline behavior
- **Rationale**: Simpler model; tests intersection capacity without driver intelligence
- **Configuration value**: `RANDOM`

#### Strategy B: Intelligent Pre-Positioning

- Vehicle analyzes current lane and desired exit direction
- Moves to optimal lane BEFORE entering intersection (if possible)
- **Example**: Vehicle in lane 1 wanting to exit East → pre-positions to lane 3 (rightmost for that direction)
- May perform multiple lane changes before intersection
- Lane changes occur at safe speeds (< 20 km/h)
- **Use case**: Realistic driver behavior, more efficient flow
- **Rationale**: Reduces intersection conflicts; models skilled/prepared drivers
- **Configuration value**: `INTELLIGENT`

**Priority**: MUST  
**Configuration Parameter**: `lane_selection_strategy` (RANDOM | INTELLIGENT)  
**Selection Timing**: Chosen at simulation start; applies to all subsequent vehicle spawns  
**Default**: RANDOM

---

### REQ-020 (UPDATED): Configurable Rendering Frame Rate - TWO RATES SUPPORTED

The system shall support TWO target rendering frame rates, selectable at startup and changeable at runtime:

| Frame Rate | Frame Duration | Tolerance | GPU Load | Use Case |
| --- | --- | --- | --- | --- |
| **30 FPS** | 33.33 ms per frame | ±3 ms | Lower | Laptops, integrated GPU, high vehicle count (200+) |
| **60 FPS** | 16.67 ms per frame | ±2 ms | Higher | Desktops, dedicated GPU, medium vehicle count (50-150) |

**Priority**: MUST  
**Configuration Parameter**: `target_frame_rate` (30 | 60)  
**Selection Timing**: Can be set at startup or changed runtime (transitions to new rate on next frame)  
**Default**: 60 FPS  
**Critical Constraint**: Physics always ticks at 100 Hz independent of render rate (decoupled)

---

### REQ-NEW-E1: Emergency Vehicle Types Support

The system shall support THREE emergency vehicle types: Ambulance, Police, Fire Brigade.

**Rationale**: Enable testing of priority handling and emergency response scenarios  
**Priority**: SHOULD  
**Configuration**: User can spawn each type independently  
**Visual Distinction**: See REQ-NEW-E2

---

### REQ-NEW-E2: Emergency Vehicle Visual Markers

Emergency vehicles shall display distinguishing visual elements:

- **Lights**: Flashing red/blue lights on top
- **Color**: Distinct from regular vehicles (e.g., red for fire, white for ambulance, blue for police)
- **Label**: Text identifier on vehicle (AMBULANCE / POLICE / FIRE)
- **Siren Sound** (optional): Audio cue when emergency vehicle present

**Rationale**: Quickly identify emergency vehicles in visual display  
**Priority**: SHOULD

---

### REQ-NEW-E3: Signal Override for Emergency Vehicles

Emergency vehicles shall override traffic signals and proceed regardless of signal state.

- **Red Signal**: Emergency vehicles can cross intersection without stopping
- **Green Signal**: Normal (vehicles already have right-of-way)
- **Amber Signal**: Normal (vehicles can proceed to clear intersection)

**Rationale**: Simulate emergency vehicle right-of-way  
**Priority**: SHOULD  
**Safety Constraint**: Emergency vehicles must still avoid collisions with vehicles already in intersection; cannot recklessly enter occupied intersection

---

### REQ-NEW-E4: Automatic Yielding Behavior Near Emergency Vehicles

Other vehicles within 50m of an emergency vehicle (in any direction) shall attempt to yield:

- **Speed Reduction**: Reduce speed by up to 50% to clear path
- **Lane Change**: Change lanes to create space for emergency vehicle passage
- **Reaction Distance**: 50m accounts for 0.5–1.5 second reaction time at 50 km/h approach speed

**Rationale**: Model realistic traffic yielding behavior  
**Priority**: SHOULD  
**Reaction Logic**: Vehicle detects emergency vehicle within 50m range; begins yielding maneuver

---

### REQ-NEW-E5: Configurable Emergency Vehicle Spawn Rate

The system shall allow independent configuration of emergency vehicle spawn rate.

- **Parameter**: `emergency_spawn_rate_per_minute`
- **Range**: 0–20 vehicles per minute
- **Default**: 0 (no emergency vehicles unless explicitly configured)
- **Per-Type Configuration** (optional): Separate rates for Ambulance, Police, Fire

**Rationale**: Enable priority scenario testing  
**Priority**: SHOULD  
**Use Case**: Researcher wants to test how traffic flow changes with 5 ambulances/minute mixed in normal traffic

---

### REQ-NEW-COLLISION-PREVENTION-1: Safe Opposing-Green Operation

When `signal_coordination_mode = OPPOSING_SIMULTANEOUS` and opposing directions both have green signals, the system shall prevent vehicle-vehicle collisions in the intersection zone.

**Mechanism**:

1. Define intersection "conflict zone" (central rectangle, ~25m × 25m centered at intersection)
2. Track vehicles entering conflict zone
3. If vehicle from direction A is in conflict zone, prevent entry of vehicles from opposing direction (A opposite)
4. Vehicle approaching conflict zone stops at stop line (before entering zone)
5. Waits for conflict zone to clear before proceeding

**Timing Constraints**:

- Vehicle stop duration: ≤ 5 seconds (queue length ≤ 3 vehicles)
- If vehicle waits > 5 seconds, traffic is deadlocked → flag for investigation

**Priority**: MUST  
**Critical for**: REQ-005 Mode B operation safety

---

### REQ-027 (UPDATED): Enhanced UI Controls & Configuration

The system shall provide comprehensive user interface controls:

**Scenario Selection (Dropdown)**:

- ☐ Normal Traffic (baseline)
- ☐ Congestion Test (high spawn rate, default 60 veh/min)
- ☐ Sparse Traffic (low spawn rate, default 5 veh/min)
- ☐ Priority Operations (mix of emergency + regular vehicles)
- ☐ Custom (manual parameter entry)

**Frame Rate Selection (Radio Buttons)**:

- ☐ 30 FPS (lower GPU load)
- ☐ 60 FPS (higher quality, default)

**Signal Coordination Mode (Radio Buttons)**:

- ☐ Strict Mutual Exclusion (traditional, default)
- ☐ Opposing Simultaneous (modern, higher throughput)

**Lane Selection Strategy (Radio Buttons)**:

- ☐ Random (default)
- ☐ Intelligent Pre-Positioning

**Per-Direction Traffic Controls**:

- Spawn Rate slider (vehicles/minute): 0–60
- Green Signal Duration slider (seconds): 10–60
- Red Signal Duration slider (seconds): 10–60

**Emergency Vehicle Controls** (if enabled):

- Emergency vehicle spawn rate slider (vehicles/minute): 0–20
- Emergency vehicle type selector dropdown (Ambulance | Police | Fire)

**Simulation Controls**:

- ▶ Play button (start simulation)
- ⏸ Pause button (freeze physics)
- ⏹ Reset button (clear all vehicles, return to empty state)
- ⏩ Speed multiplier dropdown (1x, 2x, 4x)

**Priority**: MUST

---

### REQ-028 (UPDATED): Enhanced Real-Time State Display

The system shall display current simulation state on-screen with the following sections:

**Configuration Display Panel**:

- Active scenario mode
- Selected frame rate (30/60 FPS)
- Selected signal coordination mode
- Selected lane selection strategy

**Traffic Metrics Panel**:

- Active vehicle count (regular)
- Emergency vehicle count
- Average vehicle speed (km/h)
- Throughput (vehicles exiting per minute)

**Signal Status Panel** (one per direction):

- NORTH: Color indicator (R/G/A) + remaining time (s)
- SOUTH: Color indicator (R/G/A) + remaining time (s)
- EAST: Color indicator (R/G/A) + remaining time (s)
- WEST: Color indicator (R/G/A) + remaining time (s)

**Collision Statistics Panel**:

- Total collisions (cumulative)
- Active collisions (current)
- Collision-free ratio (%)

**Performance Metrics Panel**:

- Current FPS (rendered)
- Physics ticks per second (100 Hz target)
- Memory usage (MB)
- CPU usage (%)

**Priority**: SHOULD

---

## UPDATED SCOPE & NON-SCOPE

### Scope (INCLUDED)

**Original scope items**:

- 4-way crossroad intersection, 3 lanes per direction
- Left-hand traffic (vehicles drive on left)
- Traffic signals (red/green/amber)
- Turn signals and lane changes
- Vehicle physics simulation
- Collision detection

**NEW scope items** (from blocking question resolutions):

- **Configurable frame rate**: 30 or 60 FPS selection
- **Configurable lane selection strategy**: Random or Intelligent
- **Emergency vehicles**: Ambulance, Police, Fire Brigade with priority handling
- **Configurable signal coordination modes**: Strict mutual exclusion OR opposing simultaneous
- **Collision prevention for opposing green**: Safe intersection zone management
- **Scenario showcase modes**: Normal, Congestion, Sparse, Priority, Custom
- **Full parameter exposure at runtime**: Allow traffic scenario customization

### Non-Scope (EXPLICITLY EXCLUDED)

**Original non-scope items**:

- Multi-intersection networks
- GPS/real-world mapping
- Weather effects
- Night driving
- Pedestrians
- Public transport (buses, trams)
- Road construction/hazards
- Parking simulation
- Fuel/battery simulation

**CLARIFIED non-scope** (from blocking question resolution):

- **Generic vehicle-to-vehicle priority rules**: Only emergency vehicles have priority; regular vehicles treated equally (first-come-first-served)
- **Police enforcement simulation**: No speeding tickets, traffic enforcement
- **Emergency vehicle routing intelligence**: Emergency vehicles follow same lane/signal rules as regular vehicles; just ignore red signals
- **Realistic emergency vehicle pathing**: No GPS routing for ambulances to hospitals, etc.
- **Multi-vehicle emergency convoys**: Emergency vehicles spawn/operate independently

---

## TRACEABILITY: NEW REQUIREMENTS ADDED

| REQ ID | Title | Type | Rationale |
| --- | --- | --- | --- |
| REQ-NEW-E1 | Emergency vehicle type support | SHOULD | Priority scenario testing |
| REQ-NEW-E2 | Visual markers for emergency vehicles | SHOULD | Clear identification in display |
| REQ-NEW-E3 | Signal override for emergencies | SHOULD | Right-of-way simulation |
| REQ-NEW-E4 | Vehicle yielding near emergencies | SHOULD | Realistic traffic behavior |
| REQ-NEW-E5 | Configurable emergency spawn rate | SHOULD | Scenario flexibility |
| REQ-NEW-COLLISION-PREVENTION-1 | Safe opposing-green operation | MUST | Safety-critical for REQ-005 Mode B |

---

## UPDATED ACCEPTANCE CRITERIA: Changed Requirements

### REQ-005 (UPDATED): Signal Coordination Mode Support

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Mode A Implemented** | Strict mutual exclusion works (only one direction green) | State machine test: cycle through 2 min, verify max one GREEN at time |
| **Mode B Implemented** | Opposing simultaneous works (N/S and E/W can both be green) | State machine test: with Mode B, verify N GREEN + S GREEN simultaneously possible |
| **Cross-Direction Exclusion** | If N/S green, E/W must be red (and vice versa) | Invariant check: sample signal states @ 100 Hz for 5 min, verify N+S+E+W combination never has (N or S GREEN) AND (E or W GREEN) |
| **Mode Selection** | User can select mode at startup | Configuration test: select Mode A, run simulation, verify behavior; then select Mode B, verify changed behavior |
| **Consistency** | Selected mode applies for entire simulation run | Duration test: run 10 min with Mode B, verify mode does not switch mid-simulation |

**Verification Method**: Automated state machine verification test + configuration validation test

---

### REQ-007 (UPDATED): Configurable Lane Selection Strategy

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Random Strategy** | Vehicles randomly choose exit lane (33% each) | Statistical test: spawn 300 vehicles with RANDOM mode, record exit distribution, verify each lane 27–37% (±10% tolerance) |
| **Intelligent Strategy** | Vehicles pre-position before intersection | Behavior test: spawn vehicle in lane 1 wanting to exit East, verify vehicle moves to lane 3 (rightmost) before entering intersection |
| **Mode Selection** | User can select strategy at startup | Configuration test: select RANDOM, spawn vehicles, verify random distribution; select INTELLIGENT, spawn vehicles, verify pre-positioning |
| **Consistency** | Selected strategy applies to all subsequent spawns | Duration test: run with INTELLIGENT mode for 10 min, verify all vehicles exhibit pre-positioning |
| **Safe Lane Change Speed** | Lane changes in INTELLIGENT mode occur at ≤ 20 km/h | Speed constraint test: monitor vehicle speed during INTELLIGENT lane change, verify ≤ 20 km/h |

**Verification Method**: Statistical distribution test + behavior observation test + speed constraint test

---

### REQ-020 (UPDATED): Configurable Frame Rate

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **30 FPS Support** | When set to 30 FPS, average frame rate 30 ± 5 FPS | Frame rate test: set to 30 FPS, run 30s, measure average FPS, verify 25–35 FPS |
| **60 FPS Support** | When set to 60 FPS, average frame rate 60 ± 5 FPS | Frame rate test: set to 60 FPS, run 30s, measure average FPS, verify 55–65 FPS |
| **Runtime Change** | Frame rate can be changed during simulation (not just at startup) | Live config test: run at 60 FPS, change to 30 FPS mid-simulation, verify frame rate transitions to 30 FPS within 1 second |
| **Physics Decoupling** | Physics remains 100 Hz regardless of render frame rate | Decoupling test: set render to 30 FPS, measure physics tick rate, verify 100 ± 2 Hz |

**Verification Method**: Frame rate measurement test + runtime configuration test + physics decoupling test

---

### NEW: REQ-NEW-E1 through REQ-NEW-E5 (Emergency Vehicles)

#### REQ-NEW-E1: Emergency Vehicle Types

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Three Types Supported** | Ambulance, Police, Fire Brigade spawn correctly | Spawn test: configure spawn rate for each type, verify vehicles appear as specified types |
| **Independent Spawning** | Each type can spawn independently | Spawn test: set only Ambulance rate > 0; verify only ambulances appear (no police/fire) |

#### REQ-NEW-E2: Visual Distinction

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Color Differentiation** | Ambulance (white), Police (blue), Fire (red) | Visual inspection test: render each type, verify colors correct |
| **Label Visible** | Text label on vehicle identifies type | Visual inspection test: render emergency vehicles, verify text readable |
| **Lights Animated** | Flashing lights visible on emergency vehicle | Visual inspection test: render emergency vehicle, verify light animation |

#### REQ-NEW-E3: Signal Override

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Red Signal Override** | Emergency vehicle crosses red signal without stopping | Override test: approach red signal in emergency vehicle, verify vehicle enters intersection (does not stop) |
| **Regular Vehicle Stops** | Non-emergency vehicle stops at red signal | Baseline test: approach red signal in regular vehicle, verify vehicle stops before intersection |

#### REQ-NEW-E4: Yielding Behavior

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Reaction Distance 50m** | Regular vehicle detects emergency vehicle up to 50m away | Detection test: place regular vehicle 50m from emergency vehicle, verify yielding behavior starts |
| **Speed Reduction** | Regular vehicle reduces speed when near emergency | Behavior test: regular vehicle approaching emergency vehicle, verify speed reduces by 25–50% |
| **Lane Change Attempt** | Regular vehicle attempts to change lanes to yield | Behavior test: emergency vehicle approaches; verify nearby regular vehicles attempt lane changes to clear path |

#### REQ-NEW-E5: Emergency Spawn Rate Configuration

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Rate Configuration** | User can set emergency spawn rate (0–20 veh/min) | Configuration test: set emergency_spawn_rate = 5, run 1 min, count emergencies, verify ≈5 ±1 |
| **Independent Rate** | Emergency rate independent from regular vehicle rate | Comparison test: set regular=20, emergency=5, spawn for 1 min, verify 20 ± 2 regular AND 5 ± 1 emergency |
| **Default Zero** | Emergency spawn rate defaults to 0 | Default test: startup without configuration, verify no emergency vehicles spawn |

---

### NEW: REQ-NEW-COLLISION-PREVENTION-1

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Conflict Zone Defined** | Central intersection area (~25m × 25m) designated as conflict zone | Visualization test: enable conflict zone display, verify rectangle shown at intersection center |
| **Zone Occupancy Tracking** | System tracks which vehicles are in conflict zone | State test: place vehicle in zone, verify system detects occupancy; vehicle exits zone, verify system detects clear |
| **Entry Prevention** | Vehicle from opposite direction cannot enter zone if occupied | Collision prevention test: N vehicle in zone, S vehicle approaches; verify S vehicle stops before entering zone |
| **Timeout** | Vehicle waits max 5 seconds at stop line; error if > 5 sec | Timeout test: create deadlock scenario, measure wait time, verify ≤ 5 sec or flag error |
| **Queue Limit** | Max 3 vehicles in queue before stop line | Queue test: create scenario with multiple opposing vehicles; verify queue does not exceed 3 vehicles |

**Verification Method**: Conflict zone state tracking test + entry prevention test + timeout test

---

## SPECIFICATION SIGN-OFF (UPDATED)

| Role | Authority | Status | Notes |
| --- | --- | --- | --- |
| **Requirements Engineer** | Specification completeness & requirements quality | ✅ APPROVED | All 11 sections complete; blocking questions resolved |
| **System Architect** | Feasibility & design feasibility | ⏳ IN REVIEW | Ready for architecture phase |
| **Product Manager** | Business requirements & stakeholder needs | ✅ APPROVED | Answers incorporated: Q1–Q5 all resolved |
| **Traffic Domain Expert** | Emergency vehicle & signal logic | ✅ APPROVED | Emergency vehicle rules defined; signal modes clarified |
| **QA Lead** | Verifiability & test design | ⏳ PENDING | Test strategies documented; test cases to follow in implementation phase |
| **Project Sponsor** | Final approval for proceeding | ⏳ PENDING ARCHITECTURE | Awaiting architecture review before release approval |

---

**Specification Status**: **✅ APPROVED (Ready for Architecture Phase)**

**Blocking Questions Status**: **✅ ALL RESOLVED**

- Q1 (Frame Rate) → Configurable 30/60 FPS ✅
- Q2 (Lane Selection) → Configurable random/intelligent ✅
- Q3 (Priority) → Emergency vehicles only ✅
- Q4 (Configuration) → Full scope + scenario presets ✅
- Q5 (Opposing Green) → Yes, with collision prevention ✅

**Next Phase**: **Step 4: Create Architecture** (`/04-create-architecture`)

- Design system components (Physics Engine, Signal Controller, Vehicle Manager, etc.)
- Define module interfaces
- Create Architecture Decision Records (ADRs)
- Establish design patterns and technology choices

---

**Document Version**: 0.2.0 (Blocking Questions Resolved)  
**Last Modified**: 2026-09-03  
**Status**: APPROVED  
**File**: `specs/SPECIFICATION.md`
