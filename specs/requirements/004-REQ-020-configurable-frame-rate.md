---
requirement_id: REQ-020
title: Configurable Rendering Frame Rate - TWO RATES SUPPORTED
priority: MUST
version: 0.2.0
date: 2026-09-03
status: APPROVED
---

# REQ-020: Configurable Rendering Frame Rate - TWO RATES SUPPORTED

**Requirement ID**: REQ-020  
**Title**: Configurable Rendering Frame Rate - TWO RATES SUPPORTED  
**Priority**: MUST (critical for performance and user experience)  
**Status**: APPROVED  
**Updated**: 2026-09-03

---

## Requirement Statement

The system **shall support TWO target rendering frame rates**, selectable at startup and changeable at runtime:

- **30 FPS** (for lower-end systems)
- **60 FPS** (for higher-end systems)

**Critical Constraint**: Physics simulation ALWAYS ticks at 100 Hz independent of render frame rate (decoupled).

---

## Detailed Description

### 30 FPS Mode

- **Frame Duration**: 33.33 ms per frame
- **Tolerance**: ±3 ms (acceptable range: 30.33–36.33 ms)
- **GPU Load**: Lower
- **Target System**: Laptops, integrated GPU, high vehicle count (200+)
- **Use case**: Maximize vehicle spawn count on constrained hardware
- **Visual impact**: Slightly lower smoothness but acceptable for simulation

### 60 FPS Mode

- **Frame Duration**: 16.67 ms per frame
- **Tolerance**: ±2 ms (acceptable range: 14.67–18.67 ms)
- **GPU Load**: Higher
- **Target System**: Desktops, dedicated GPU, medium vehicle count (50-150)
- **Use case**: Smooth visual experience, reference implementation
- **Visual impact**: Smooth, high-quality rendering
- **Default**: 60 FPS

### Physics Decoupling

**CRITICAL REQUIREMENT**: Physics simulation operates at **100 Hz** regardless of render frame rate:

- Physics tick rate: ALWAYS 100 Hz (10 ms per physics tick)
- Rendering: 30 FPS OR 60 FPS (user selectable)
- **Implication**: Physics state updates faster than screen refresh
- **Rendering**: Display shows latest available physics state (interpolated if necessary)
- **Determinism**: Physics results independent of render frame rate

---

## Configuration Parameters

| Parameter | Type | Values | Default | Selection Timing |
| --- | --- | --- | --- | --- |
| `target_frame_rate` | Integer | 30 \| 60 | 60 | Startup or runtime (transitions on next frame) |

---

## Inputs & Outputs

### Inputs

- **Frame rate selection**: User selects 30 or 60 FPS
- **System clock**: Provides actual elapsed time for frame timing
- **Physics state**: Latest physics tick results (100 Hz)

### Outputs

- **Rendered frame**: Displayed on screen at selected frame rate
- **Frame time telemetry**: Actual frame duration for performance monitoring
- **Physics tick count**: How many physics ticks completed since last render

### Data Types

| Parameter | Type | Range | Unit |
| --- | --- | --- | --- |
| `target_frame_rate` | Integer | 30 or 60 | FPS |
| `actual_frame_rate` | Float | 25–65 | FPS (measured) |
| `frame_duration` | Float | 10–40 | milliseconds |
| `physics_tick_rate` | Float | 98–102 | Hz (target 100) |

---

## Operating States & Transitions

### Frame Rate State Machine

```
[STARTUP] → [SET TO 60 FPS (default)] → [RENDERING 60 FPS]
    ↓
[USER SELECTS 30 FPS] → [TRANSITION ON NEXT FRAME] → [RENDERING 30 FPS]
    ↓
[USER SELECTS 60 FPS] → [TRANSITION ON NEXT FRAME] → [RENDERING 60 FPS]
```

**Transition Timing**: Change takes effect on next frame (no mid-frame transition).

### Physics Tick State (Independent)

```
[STARTUP] → [PHYSICS TICKS AT 100 HZ] → [CONTINUOUS 100 HZ]
    ↑                                           ↓
    ← [ALWAYS, regardless of render FPS] ←
```

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Render frame rate (30 FPS) | 33.33 ms ± 3 ms | Acceptable tolerance for smooth visual experience |
| Render frame rate (60 FPS) | 16.67 ms ± 2 ms | Stricter tolerance for high-refresh display |
| Physics tick rate | 100 Hz (10 ms) | Fixed independent of render rate |
| Frame rate transition latency | ≤ 1 frame | Change visible within 1 rendered frame |
| Acceptable frame rate variance | ±5% of target | Permit minor fluctuations due to system load |
| Maximum frame skew | ≤ 50 ms | Physics and rendering never more than 50 ms apart |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Cannot maintain target FPS | Log warning; display actual FPS to user; continue simulation | User informed of performance issue; simulation continues |
| Render lagging behind physics | Interpolate physics state for smooth display; no physics skip | Smoother visual, no determinism loss |
| Physics falling below 100 Hz | Log critical error; attempt to resume at 100 Hz on next tick | Rare event; physics recovery attempted |
| Invalid frame rate selection | Reject; retain previous frame rate; display error | Prevent undefined behavior |

### Error Handling

- **Unsupported FPS value**: Log error; default to 60 FPS
- **System cannot achieve target FPS**: Reduce vehicle spawn rate or lower graphics complexity (future enhancement)
- **Frame rate drift**: Resync every 1 second to maintain target rate

---

## Acceptance Criteria

### 30 FPS Mode

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Frame rate achievement** | Average frame rate over 30s: 30 ± 5 FPS | Run at 30 FPS for 30s; measure avg frame rate; verify 25–35 FPS |
| **Frame timing consistency** | Frame duration variance ≤ 10 ms (±30% of 33.33 ms) | Log frame times; verify std dev ≤ 10 ms over 30s |
| **Physics decoupling** | Physics ticks at 100 Hz regardless of render rate | Measure physics tick rate independently; verify 98–102 Hz |

### 60 FPS Mode

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Frame rate achievement** | Average frame rate over 30s: 60 ± 5 FPS | Run at 60 FPS for 30s; measure avg frame rate; verify 55–65 FPS |
| **Frame timing consistency** | Frame duration variance ≤ 3 ms (±18% of 16.67 ms) | Log frame times; verify std dev ≤ 3 ms over 30s |
| **Physics decoupling** | Physics ticks at 100 Hz regardless of render rate | Measure physics tick rate independently; verify 98–102 Hz |

### Runtime Changes

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **30→60 FPS transition** | Frame rate transitions from 30 FPS to 60 FPS within 1 frame | Change FPS mid-simulation; observe transition on screen |
| **60→30 FPS transition** | Frame rate transitions from 60 FPS to 30 FPS within 1 frame | Change FPS mid-simulation; observe transition on screen |
| **Physics continuity** | Physics remains at 100 Hz during frame rate change; no jumps or skips | Monitor physics tick rate during transition; verify ≥98 Hz |
| **No visual artifacts** | Smooth transition; no flicker, black frames, or stuttering | Visual inspection during transition |

### Physics Decoupling

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Consistent physics** | Physics results identical whether render at 30 FPS or 60 FPS | Run same scenario at both rates; compare vehicle final positions, collisions |
| **100 Hz physics** | Physics ticks at 100 Hz in both 30 FPS and 60 FPS modes | Instrumentation: count physics ticks per second in both modes |
| **No physics skip** | No physics tick is skipped; all 100 ticks per second executed | Log each physics tick; verify no gaps in tick sequence |

---

## Verification Method

1. **Frame Rate Measurement**
   - Run simulation at 30 FPS for 30 seconds
   - Measure actual frame times and rates
   - Verify average ≈30 FPS, variance ≤10 ms

2. **Physics Verification**
   - Instrument physics engine to count ticks
   - Run at both 30 FPS and 60 FPS
   - Verify physics ticks at 100 Hz regardless of render rate

3. **Runtime Transition Test**
   - Start at 60 FPS
   - Change to 30 FPS mid-simulation
   - Verify smooth transition, no visual artifacts
   - Repeat reverse transition (30→60)

4. **Determinism Test**
   - Run scenario A at 30 FPS; record vehicle trajectories
   - Run scenario A at 60 FPS; record vehicle trajectories
   - Verify trajectories identical (physics deterministic)

5. **Stress Test**
   - Spawn 150+ vehicles at 60 FPS
   - Monitor frame rate; should remain ≥55 FPS
   - Verify no physics skips (100 Hz maintained)

---

## Dependencies & Relationships

| Related Requirement | Relationship | Notes |
| --- | --- | --- |
| **REQ-027** | **REFERENCED BY** | Frame rate selection exposed in UI controls |
| **REQ-028** | **REFERENCED BY** | Current frame rate displayed in performance metrics panel |
| **REQ-005** | **NO DEPENDENCY** | Orthogonal: independent of signal coordination mode |

---

## Unresolved Questions

| Question | Answer | Status |
| --- | --- | --- |
| What if system can't achieve target FPS? | Render at best effort; log warning; continue simulation | CLARIFIED: Graceful degradation |
| Can users select custom frame rates (e.g., 45 FPS)? | No; only 30 or 60 FPS supported | CLARIFIED: Fixed options |
| Does physics interpolation affect determinism? | No; physics state always at discrete 100 Hz ticks; interpolation visual only | CLARIFIED: Determinism preserved |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ✅ APPROVED | Requirement unambiguous; physics decoupling critical and explicit |
| System Architect | ✅ APPROVED | Feasible design; decoupled physics well-understood |
| QA Lead | ✅ APPROVED | Verification methods clear; instrumentation points identified |

**Requirement Status**: ✅ **APPROVED and READY FOR IMPLEMENTATION**
