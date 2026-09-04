---
requirement_id: MF-004
title: Establish Signal State Naming Convention
priority: SHOULD
severity: MAJOR
version: 0.2.0
date: 2026-09-04
status: OPEN
found_in_review: SPECIFICATION-REVIEW.md
---

# MF-004: Establish Signal State Naming Convention

**Requirement ID**: MF-004  
**Title**: Establish Signal State Naming Convention  
**Priority**: SHOULD (should fix before implementation)  
**Severity**: 🟠 **MAJOR**  
**Status**: OPEN  
**Date Identified**: 2026-09-04  

---

## Requirement Statement

Signal state names are used inconsistently across the specification:
- REQ-005 uses: `RED`, `GREEN`, `AMBER` (uppercase constants)
- REQ-028 uses: Red, Green, Amber (title case in text display) + 🔴🟢🟡 (emoji)

This inconsistency creates **code ambiguity** (developers unsure which format to use), **testing confusion** (test assertions unclear), and **documentation fragmentation** (search difficulties).

The system **shall establish a single, standardized naming convention** for traffic signal states, enforced consistently across all specification files and code, with documented usage guidance.

---

## Detailed Description

### Current Inconsistencies

| Aspect | REQ-005 | REQ-028 | Issue |
| --- | --- | --- | --- |
| **Casing** | RED, GREEN, AMBER | Red, Green, Amber | Inconsistent casing |
| **Format** | Uppercase constants | Title case text | Code vs. display confusion |
| **Emoji** | None | 🔴 🟢 🟡 | One file uses emoji, other doesn't |
| **Usage** | State constants (code) | Display text (UI) | Context-dependent |

### Proposed Standard Convention

**Option A: Strict Uppercase Constants (RECOMMENDED for Code)**
```
Signal states: RED, GREEN, AMBER

Usage in code:
  if signal_state == RED:
      vehicle.stop()
  elif signal_state == GREEN:
      vehicle.proceed()
```

**Option B: Lowercase Constants (Python convention)**
```
Signal states: red, green, amber

Usage in code:
  if signal_state == red:
      vehicle.stop()
```

**Option C: Enum-based (Type-safe)**
```
enum SignalState:
  RED = 0
  GREEN = 1
  AMBER = 2

Usage:
  if signal_state == SignalState.RED:
```

---

## Standardization Plan

### For Code/Specification
- **Primary format**: `RED`, `GREEN`, `AMBER` (Option A)
- **Context**: Configuration, state machines, requirement specifications
- **Example**: `signal_coordination_mode = STRICT_MUTUAL_EXCLUSION`

### For Display/UI
- **Format**: Emoji + Text
- **Examples**: 🔴 RED (0 sec), 🟢 GREEN (25 sec), 🟡 AMBER (3 sec)
- **Rationale**: Emoji provides immediate visual clarity; text provides accessibility

### For Documentation
- **Reference format**: `RED` (constant) when discussing code
- **Display format**: "Red light" or "🔴 Red" when discussing user interface
- **Consistency**: Specify format per context in style guide

---

## Inputs & Outputs

### Inputs

- **Current requirement files**: 001-012 (source of inconsistencies)
- **Code conventions**: Project C/C++/Python standards (if applicable)
- **UI/UX guidelines**: Display formatting standards

### Outputs

- **Updated requirement files**: Consistent signal state naming
- **Style guide**: `000-SIGNAL-STATE-NAMING-CONVENTION.md`
- **Code templates**: Example usage of signal states in pseudocode
- **Linting rules**: Automated enforcement of convention (optional)

---

## Operating States & Transitions

### Convention Implementation State Machine

```
[REVIEW IDENTIFIED: Inconsistent naming]
    ↓ (select standard option)
[OPTION SELECTED: Uppercase (RED, GREEN, AMBER)]
    ↓ (plan updates)
[UPDATE PLAN: Map files to updates]
    ├─ REQ-005: Already correct ✓
    ├─ REQ-028: Clarify display format
    └─ Others: Verify consistency
    ↓ (execute)
[FILES UPDATED: Consistent naming]
    ├─ Code: RED, GREEN, AMBER
    └─ Display: 🔴 RED, 🟢 GREEN, 🟡 AMBER
    ↓ (document)
[STYLE GUIDE CREATED: Convention documented]
    └─ Specify usage by context (code vs. display)
```

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Convention selection | 30 minutes | Decision between options |
| File review and updates | 1–2 hours | Identify all signal state references |
| Style guide creation | 1 hour | Document convention and examples |
| Implementation guidance | 1 hour | Create code templates and examples |
| Total effort | 3–5 hours | Moderate effort for high impact |

---

## Acceptance Criteria

### Convention Selection

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Standard selected** | Convention chosen and documented | Stakeholder sign-off on convention |
| **Rationale documented** | Why this convention over alternatives | Review decision document |

### File Updates

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Consistency verified** | All signal state references use standard format | Grep: search for "RED", "GREEN", "AMBER" variants; verify standard format |
| **Display format consistent** | UI display uses emoji + text format consistently | Review REQ-028 and UI mockups |

### Documentation

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Style guide created** | `000-SIGNAL-STATE-NAMING-CONVENTION.md` with examples | Verify document completeness |
| **Code templates provided** | Pseudocode examples showing correct usage | Review example code blocks |
| **Transition examples** | State transition examples using standard names | Verify state diagram uses correct names |

---

## Verification Method

1. **Selection and Documentation**
   - Evaluate options A, B, C
   - Select standard (recommend Option A: RED, GREEN, AMBER)
   - Document rationale

2. **File Analysis**
   - Search all files for signal state references
   - Identify inconsistencies (lowercase, mixed case, emoji placement)
   - Catalog occurrences

3. **Updates**
   - REQ-005: Verify already uses `RED`, `GREEN`, `AMBER` ✓
   - REQ-028: Clarify display format (emoji + text)
   - Other files: Update any signal state references

4. **Style Guide Creation**
   - Create document with convention definition
   - Provide code examples
   - Provide display examples
   - Document context-specific usage (code vs. display)

5. **Validation**
   - Search specification for all state names
   - Verify consistency
   - Manual spot-check: read state diagrams and descriptions

---

## Dependencies & Relationships

| Related Item | Relationship | Notes |
| --- | --- | --- |
| **REQ-005** | **PRIMARY SOURCE** | Signal coordination requirement; uses correct names |
| **REQ-028** | **AFFECTED FILE** | State display specification; needs UI format clarification |
| **000-SIGNAL-STATE-NAMING-CONVENTION.md** | **OUTPUT** | Style guide documentation |
| **Code implementation** | **INFORMED BY** | Developers use this convention in implementation |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ⏳ PENDING | Approve naming convention |
| System Architect | ⏳ PENDING | Confirm convention compatible with design |
| Lead Developer | ⏳ PENDING | Confirm convention aligns with coding standards |

---

**Requirement Status**: 🟠 **OPEN - SHOULD FIX BEFORE IMPLEMENTATION**

*Recommended for resolution before development begins.*
