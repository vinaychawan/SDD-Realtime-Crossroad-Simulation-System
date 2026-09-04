---
requirement_id: REQ-NEW-E2
title: Emergency Vehicle Visual Markers
priority: SHOULD
version: 0.2.0
date: 2026-09-03
status: APPROVED
---

# REQ-NEW-E2: Emergency Vehicle Visual Markers

**Requirement ID**: REQ-NEW-E2  
**Title**: Emergency Vehicle Visual Markers  
**Priority**: SHOULD (enhances user experience)  
**Status**: APPROVED  
**Updated**: 2026-09-03

---

## Requirement Statement

Emergency vehicles **shall display distinguishing visual elements** to quickly identify their type and status:

1. **Lights** - Flashing red/blue lights on top
2. **Color** - Distinct color per vehicle type
3. **Label** - Text identifier (AMBULANCE / POLICE / FIRE)
4. **Siren Sound** (optional) - Audio cue when present

---

## Detailed Description

### Visual Markers by Type

#### Ambulance

| Marker | Specification |
| --- | --- |
| **Color** | White with red trim |
| **Lights** | Flashing red and blue (alternating, 1 Hz frequency) |
| **Label** | "AMBULANCE" in red text (40px font, readable from 100m) |
| **Audio** | Siren tone: 600 Hz + 900 Hz alternating (optional) |

#### Police

| Marker | Specification |
| --- | --- |
| **Color** | Blue with white trim |
| **Lights** | Flashing red and blue (alternating, 1 Hz frequency) |
| **Label** | "POLICE" in white text (40px font, readable from 100m) |
| **Audio** | Siren tone: 400 Hz + 600 Hz alternating (optional) |

#### Fire Brigade

| Marker | Specification |
| --- | --- |
| **Color** | Red with yellow trim |
| **Lights** | Flashing red and yellow (alternating, 1 Hz frequency) |
| **Label** | "FIRE" in yellow text (40px font, readable from 100m) |
| **Audio** | Siren tone: 500 Hz + 700 Hz alternating (optional) |

---

## Configuration Parameters

| Parameter | Type | Values | Default |
| --- | --- | --- | --- |
| `emergency_lights_enabled` | Boolean | true \| false | true |
| `emergency_labels_enabled` | Boolean | true \| false | true |
| `emergency_siren_enabled` | Boolean | true \| false | false |
| `emergency_light_frequency` | Float | 0.5–2.0 | 1.0 (Hz) |

---

## Inputs & Outputs

### Inputs

- **Vehicle type**: AMBULANCE, POLICE, or FIRE_BRIGADE
- **Simulation time**: For light flashing animation
- **Vehicle position**: For label placement

### Outputs

- **Rendered visual markers**: Lights, color, label displayed on screen
- **Audio signal**: Optional siren sound (if enabled)
- **Visibility**: Emergency vehicles visually distinguishable from regular vehicles

### Data Types

| Parameter | Type | Range | Unit |
| --- | --- | --- | --- |
| `vehicle_color` | RGB | 0–255 per channel | Color code |
| `light_color` | RGB | 0–255 per channel | Color code |
| `light_flash_frequency` | Float | 0.5–2.0 | Hz |
| `label_text` | String | "AMBULANCE" \| "POLICE" \| "FIRE" | Type identifier |
| `label_font_size` | Integer | 20–60 | pixels |
| `siren_frequency` | Float | 400–1000 | Hz |

---

## Operating States & Transitions

### Light Animation State Machine

```
[LIGHTS OFF (initializing)] → [LIGHTS ON] → [FLASH CYCLE: RED] → [FLASH CYCLE: BLUE] → back to RED
```

**Flash Frequency**: Default 1.0 Hz (0.5s RED, 0.5s BLUE)

**Transition**: Continuous loop while vehicle active.

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Light flash frequency | 1.0 Hz (default) | Recognizable; not distracting |
| Light update rate | Every 100 ms | Synchronized with physics ticks |
| Label update rate | Every frame | Position follows vehicle |
| Siren frequency | 400–1000 Hz | Audible range for humans |
| Label readability distance | ≥100m | Clear from intersection view distance |
| Rendering overhead | <5% CPU | Minimal impact on performance |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Light animation stops | Reset to flash cycle; continue animation | Graceful recovery |
| Label texture missing | Render text directly (fallback) | Ensure label always visible |
| Siren playback fails | Continue without audio; visual markers sufficient | Emergency identification via visual still works |
| Invalid vehicle type | Render default markers (white with generic label) | Prevent rendering errors |

---

## Acceptance Criteria

### Visual Distinction

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Ambulance appearance** | White body, red/blue flashing lights, "AMBULANCE" label | Visual inspection test: render Ambulance, verify colors and label |
| **Police appearance** | Blue body, red/blue flashing lights, "POLICE" label | Visual inspection test: render Police, verify colors and label |
| **Fire appearance** | Red body, red/yellow flashing lights, "FIRE" label | Visual inspection test: render Fire, verify colors and label |
| **Color distinctiveness** | Each type visually distinguishable from others and regular vehicles | Side-by-side comparison: render all types and regular vehicle; verify distinct |

### Light Animation

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Light flashing** | Red and blue lights alternate at 1 Hz (±0.1 Hz) | Timing test: measure light color change rate; verify 0.9–1.1 Hz |
| **Light consistency** | All emergency vehicles flash in sync | Rendering test: spawn multiple emergencies; verify synchronized flashing |
| **Light visibility** | Lights visible at distance (≥100m from vehicle) | Visual test: render at scale; verify readable from 100m view distance |

### Label Rendering

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Label text** | Correct type label ("AMBULANCE", "POLICE", "FIRE") | Text verification: spawn each type; verify label text correct |
| **Label readability** | Label readable at standard view distance | Visual inspection: 40px font at 100m distance |
| **Label positioning** | Label centered on vehicle | Rendering test: verify label position relative to vehicle body |

### Optional Audio

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Siren sound** | Audible when enabled; correct tone per type | Audio test: enable siren; listen for correct frequency tones |
| **Siren control** | Can be enabled/disabled via configuration | Configuration test: toggle siren on/off; verify sound activates/deactivates |

---

## Verification Method

1. **Visual Inspection Test**
   - Spawn one Ambulance, one Police, one Fire vehicle
   - Verify each has correct color, lights, and label
   - Verify lights flash at ~1 Hz

2. **Rendering Test**
   - Render emergency vehicle at various distances (50m, 100m, 200m)
   - Verify label readable at 100m
   - Verify lights visible at all distances

3. **Configuration Test**
   - Enable/disable lights: verify render matches configuration
   - Enable/disable labels: verify text appears/disappears
   - Enable/disable siren: verify audio plays/stops
   - Change light frequency: verify flash rate matches config

4. **Stress Test**
   - Spawn 20 emergency vehicles simultaneously
   - Verify all render correctly without glitches
   - Verify performance impact <5% CPU
   - Verify audio playback manageable (not cacophonous)

---

## Dependencies & Relationships

| Related Requirement | Relationship | Notes |
| --- | --- | --- |
| **REQ-NEW-E1** | **REQUIRED BY** | Visual markers identify the three emergency types |
| **REQ-NEW-E3** | **RELATED TO** | Signal override behavior paired with visual distinction |
| **REQ-NEW-E4** | **RELATED TO** | Visual cues help vehicles detect and yield to emergencies |

---

## Unresolved Questions

| Question | Answer | Status |
| --- | --- | --- |
| Can light colors be customized? | No; fixed colors per type | CLARIFIED: Fixed specification |
| What if siren audio is disabled? | Visual markers still identify emergency vehicles | CLARIFIED: Audio optional |
| Can multiple emergency vehicles have different light frequencies? | No; global frequency setting | CLARIFIED: All emergencies use same frequency |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ✅ APPROVED | Requirement detailed; visual specs clear |
| System Architect | ✅ APPROVED | Rendering feasible; animation logic straightforward |
| QA Lead | ✅ APPROVED | Visual verification methods defined |

**Requirement Status**: ✅ **APPROVED and READY FOR IMPLEMENTATION**
