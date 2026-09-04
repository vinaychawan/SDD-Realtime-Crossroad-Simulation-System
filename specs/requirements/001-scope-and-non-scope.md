---
title: Scope & Non-Scope Overview
version: 0.2.0
date: 2026-09-03
status: APPROVED
---

# Scope & Non-Scope: Realtime Crossroad Simulation System

## Project Overview

**Title**: Realtime Crossroad Simulation - Left-Hand Drive (Netherlands)  
**Status**: APPROVED (All blocking questions resolved by stakeholders)  
**Version**: 0.2.0  
**Last Updated**: 2026-09-03

---

## Scope (INCLUDED)

### Original Scope Items

- **4-way crossroad intersection**, 3 lanes per direction
- **Left-hand traffic** (vehicles drive on left)
- **Traffic signals** (red/green/amber)
- **Turn signals and lane changes** (vehicle behavior)
- **Vehicle physics simulation** (collision detection, movement)
- **Collision detection** (vehicle-to-vehicle and vehicle-to-infrastructure)

### New Scope Items (from Stakeholder Resolution)

- **Configurable frame rate**: 30 or 60 FPS selection
- **Configurable lane selection strategy**: Random or Intelligent pre-positioning
- **Emergency vehicles**: Ambulance, Police, Fire Brigade with priority handling
- **Configurable signal coordination modes**: Strict mutual exclusion OR opposing simultaneous
- **Collision prevention for opposing green**: Safe intersection zone management
- **Scenario showcase modes**: Normal, Congestion, Sparse, Priority, Custom
- **Full parameter exposure at runtime**: Allow traffic scenario customization
- **Visual display & metrics**: Real-time state, performance, and collision statistics

---

## Non-Scope (EXPLICITLY EXCLUDED)

### Original Non-Scope Items

- **Multi-intersection networks** (single 4-way intersection only)
- **GPS/real-world mapping** (abstract simulation, no map data)
- **Weather effects** (no rain, snow, fog simulation)
- **Night driving** (no lighting model changes)
- **Pedestrians** (traffic only, no pedestrian simulation)
- **Public transport** (no buses, trams, trains)
- **Road construction/hazards** (static road environment)
- **Parking simulation** (vehicles exit at intersection boundaries)
- **Fuel/battery simulation** (infinite vehicle autonomy)

### Clarified Non-Scope Items (from Stakeholder Resolution)

- **Generic vehicle-to-vehicle priority rules**: Only emergency vehicles have priority; regular vehicles treated equally (first-come-first-served)
- **Police enforcement simulation**: No speeding tickets or traffic enforcement
- **Emergency vehicle routing intelligence**: Emergency vehicles follow same lane/signal rules as regular vehicles; only difference is red signal override
- **Realistic emergency vehicle pathing**: No GPS routing to hospitals or specific destinations
- **Multi-vehicle emergency convoys**: Emergency vehicles spawn and operate independently

---

## Key Assumptions Requiring Confirmation

### Architectural Assumptions

1. **Single Intersection Model**: System simulates ONE 4-way intersection only; no interconnected networks
2. **Physics Decoupling**: Rendering frame rate (30/60 FPS) is decoupled from physics simulation (always 100 Hz)
3. **Lane Count**: Fixed 3 lanes per direction (12 lanes total); no dynamic lane additions
4. **Coordinate System**: Left-hand traffic (vehicles drive on left side of road)

### Configuration Assumptions

1. **Runtime Modifiable**: All parameters except signal coordination mode CAN be changed during simulation
2. **Signal Coordination Mode**: Selected at startup; does NOT change mid-simulation
3. **Scenario Presets**: Five predefined scenarios; users can also manually configure parameters
4. **Emergency Vehicle Types**: Three types (Ambulance, Police, Fire Brigade); no additional types

### Behavior Assumptions

1. **Collision Handling**: Collisions are detected and logged; no physical damage simulation
2. **Vehicle Spawn**: Vehicles spawn at road entry points and exit at boundaries
3. **Lane Changes**: Vehicles perform lane changes at safe speeds (≤ 20 km/h in intelligent mode)
4. **Emergency Priority**: Emergency vehicles override red signals but still avoid collisions with vehicles already in intersection

---

## Blocking Questions - All RESOLVED

| # | Question | Resolution | Details |
| --- | --- | --- | --- |
| Q1 | What frame rates are supported? | **Configurable: 30 or 60 FPS** | Both rates supported; selectable at startup or runtime; physics always 100 Hz |
| Q2 | How do vehicles select lanes? | **Two strategies: Random or Intelligent** | Random = equal probability; Intelligent = pre-positioning in optimal lane |
| Q3 | Who has priority at intersection? | **Emergency vehicles only** | Ambulance, Police, Fire Brigade; regular vehicles first-come-first-served |
| Q4 | Can users configure scenarios? | **Yes, full parameter exposure** | Predefined scenarios + custom configuration allowed |
| Q5 | Can opposite directions both be green? | **Yes, with collision prevention** | N/S can be green together; E/W can be green together; but N/S and E/W mutually exclusive |

---

## Document Structure

This specification is organized as **individual requirement files** in the `specs/` folder:

- `001-scope-and-non-scope.md` — This file (overview and assumptions)
- `002-REQ-005-signal-coordination.md` — Signal coordination modes (TWO modes)
- `003-REQ-007-vehicle-lane-selection.md` — Lane selection strategies (TWO strategies)
- `004-REQ-020-configurable-frame-rate.md` — Frame rate configuration (30/60 FPS)
- `005-REQ-NEW-E1-emergency-vehicle-types.md` — Emergency vehicle type support
- `006-REQ-NEW-E2-emergency-visual-markers.md` — Emergency vehicle visual distinction
- `007-REQ-NEW-E3-signal-override.md` — Emergency signal override capability
- `008-REQ-NEW-E4-yielding-behavior.md` — Automatic yielding near emergency vehicles
- `009-REQ-NEW-E5-emergency-spawn-rate.md` — Configurable emergency spawn rate
- `010-REQ-NEW-COLLISION-PREVENTION-1-safe-opposing-green.md` — Collision prevention for opposing green
- `011-REQ-027-ui-controls.md` — Enhanced UI controls and configuration
- `012-REQ-028-state-display.md` — Enhanced real-time state display

Each requirement file includes: detailed description, inputs/outputs, constraints, acceptance criteria, verification method, and dependencies.

---

## Acceptance Criteria for Scope

| Criterion | Pass Condition | Verification |
| --- | --- | --- |
| Scope clarity | All scope items listed and non-scope explicitly excluded | Checklist validation |
| Requirement completeness | All 11 major requirements documented in separate files | File count = 12 (1 scope + 11 requirements) |
| Assumption identification | All implicit assumptions documented and numbered | Review by architect and PM |
| Blocking questions | All Q1–Q5 resolved with documented decisions | Stakeholder sign-off |

---

**Status**: ✅ APPROVED  
**Next Phase**: Requirements Analysis (per individual requirement files)
