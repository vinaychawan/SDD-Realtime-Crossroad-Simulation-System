---
title: Specification Review Findings and Resolution Requirements
version: 0.2.0
date: 2026-09-04
status: ACTIVE
---

# 📋 Specification Review Findings & Resolution Requirements

**Review Date**: 2026-09-04  
**Specification Version Reviewed**: v0.2.0  
**Total Findings**: 14 (3 Blocking + 6 Major + 5 Minor)  
**Total Recommendations**: 5  
**Grand Total**: 19 items requiring action

---

## 📊 Overview

This directory contains actionable requirements derived from the independent specification review documented in `SPECIFICATION-REVIEW.md`. Each finding has been converted into a formal requirement file specifying:
- What needs to be resolved
- Why it's important (priority/severity)
- Options for resolution
- Acceptance criteria
- Effort estimates

---

## 🔴 BLOCKING FINDINGS (Must Fix Before Implementation)

**Status**: ⚠️ **CRITICAL - Implementation Blocked**

These blocking issues **MUST be resolved** before implementation can proceed. They prevent execution of downstream work.

### BF-001: Extract Missing Requirements
- **File**: `blocking/BF-001-extract-missing-requirements.md`
- **Issue**: Only 7 of ~28 requirements documented; 20+ missing from original SPECIFICATION.md
- **Impact**: Specification incomplete; developers lack foundational requirements
- **Effort**: 3–6 hours
- **Deadline**: Before BF-002
- **Status**: 🔴 OPEN

### BF-002: Establish Consistent Numbering Scheme
- **File**: `blocking/BF-002-establish-numbering-scheme.md`
- **Issue**: Mixed numbering (REQ-005, REQ-NEW-E1, REQ-NEW-COLLISION-PREVENTION-1) creates traceability problems
- **Impact**: Developers confused; testing frameworks cannot properly index requirements
- **Effort**: 3–8 hours (depends on option selected)
- **Options**: 
  - A: Sequential (REQ-001 through REQ-NNN) — RECOMMENDED
  - B: Maintain with documented mapping
  - C: Hybrid with "NEW" prefix
- **Deadline**: Before implementation
- **Status**: 🔴 OPEN

### BF-003: Clarify Deadlock Definition and Recovery
- **File**: `blocking/BF-003-clarify-deadlock-semantics.md`
- **Issue**: Deadlock definition inconsistent; recovery behavior unclear (wait 5s? force exit at 10s? collision safe?)
- **Impact**: Cannot implement collision prevention safely; Mode B behavior undefined
- **Effort**: 2–4 hours
- **Options**:
  - A: Conservative recovery (50% speed, collision detection active)
  - B: Aggressive recovery (100% speed, collision detection disabled)
  - C: Hybrid recovery (adaptive speed and collision handling)
- **Deadline**: Before Mode B implementation
- **Status**: 🔴 OPEN

---

## 🟠 MAJOR FINDINGS (Should Fix Before Testing)

**Status**: ⚠️ **IMPORTANT - Recommend Resolution Before Testing**

These issues should be resolved before QA begins testing. They affect testability and implementation clarity.

### MF-001: Define Precise Metric Calculations
- **File**: `major/MF-001-precision-metric-calculations.md`
- **Issue**: Three metrics (throughput, collision-free ratio, average speed) have ambiguous definitions
- **Impact**: Metrics misleading to users; untestable for QA
- **Metrics affected**: 
  - Throughput: "vehicles exiting per minute" (what time window?)
  - Collision-free ratio: Percentage (of what? time or vehicles?)
  - Average speed: Calculation undefined (handle zero vehicles? emergencies?)
- **Effort**: 2–3 hours
- **Deadline**: Before QA testing begins
- **Status**: 🟠 OPEN

### MF-002: Specify Emergency Spawn Collision Handling
- **File**: `major/MF-002-emergency-spawn-collision-handling.md`
- **Issue**: REQ-NEW-E5 doesn't specify spawn collision handling or entry point distribution
- **Impact**: Developers unclear on spawn algorithm; simultaneous spawns undefined
- **Subissues**:
  - Spawn collision handling (serialized, distributed, or collision-detected?)
  - Entry point distribution (random, round-robin, weighted?)
  - Total spawn capacity (hard cap or soft cap?)
- **Effort**: 2–4 hours
- **Deadline**: Before spawn module implementation
- **Status**: 🟠 OPEN

### MF-003: Standardize Terminology (Conflict Zone)
- **File**: `major/MF-003-terminology-standardization.md`
- **Issue**: Multiple terms used for same concept ("conflict zone," "intersection zone," "intersection occupied")
- **Impact**: Search fragmentation; developer confusion; maintenance burden
- **Recommended**: Standardize on "Conflict Zone"
- **Effort**: 2–4 hours
- **Deadline**: During specification finalization
- **Status**: 🟠 OPEN

### MF-004: Establish Signal State Naming Convention
- **File**: `major/MF-004-signal-state-naming.md`
- **Issue**: Signal states named inconsistently (RED vs Red, with/without emoji)
- **Impact**: Code ambiguity; testing confusion
- **Recommended**: Uppercase (RED, GREEN, AMBER) for code; emoji + text for display
- **Effort**: 3–5 hours
- **Deadline**: Before development begins
- **Status**: 🟠 OPEN

### MF-005: Complete Scenario Preset Definitions
- **File**: `major/MF-005-scenario-preset-completeness.md`
- **Issue**: REQ-027 scenario presets incomplete (missing signal mode, lane strategy, exact spawn rates)
- **Impact**: UI implementation blocked; QA cannot validate presets
- **Missing**:
  - Is spawn rate per-direction or total?
  - Which signal mode per preset?
  - Which lane strategy per preset?
  - Signal timing (green/red duration) for each
- **Effort**: 2–3 hours
- **Deadline**: Before UI implementation
- **Status**: 🟠 OPEN

### MF-006: Clarify Emergency Vehicle UI Configuration
- **File**: `major/MF-006-emergency-ui-consistency.md`
- **Issue**: Ambiguity about UI model: single type dropdown vs. three independent sliders
- **Impact**: UI implementation blocked; cannot spawn multiple emergency types simultaneously
- **Options**:
  - A: Three independent sliders (RECOMMENDED)
  - B: Single dropdown + rate slider
  - C: Hybrid with advanced UI
- **Recommended**: Option A (three sliders, matches REQ-NEW-E5 requirement)
- **Effort**: 4–8 hours
- **Deadline**: Before UI implementation
- **Status**: 🟠 OPEN

---

## 🟡 MINOR FINDINGS (Nice to Fix)

**Status**: ℹ️ **INFORMATIONAL - Low Priority, High Impact When Fixed**

These issues improve maintainability, clarity, and future automation. Address when time permits.

### NF-001: Standardize Speed Unit Usage
- **File**: `minor/NF-001-speed-unit-consistency.md`
- **Issue**: Speed units vary (km/h, %, unspecified)
- **Recommendation**: Standardize on km/h for display, m/s for physics
- **Effort**: 1–2 hours
- **Status**: 🟡 OPEN

### NF-002: Standardize Acceptance Criteria Formatting
- **File**: `minor/NF-002-acceptance-criteria-formatting.md`
- **Issue**: Acceptance criteria have inconsistent detail levels (some vague, some precise)
- **Recommendation**: Use consistent template with quantified conditions
- **Effort**: 2–3 hours
- **Status**: 🟡 OPEN

### NF-003: Document Configuration Parameter Constraints
- **File**: `minor/NF-003-parameter-constraints-documentation.md`
- **Issue**: Some parameters lack range/constraint documentation
- **Recommendation**: Document type, range, defaults, units for all parameters
- **Effort**: 1–2 hours
- **Status**: 🟡 OPEN

### NF-004: Enhance State Diagram Clarity
- **File**: `minor/NF-004-state-diagram-clarity.md`
- **Issue**: ASCII art state diagrams hard to maintain; lack guard conditions and timing
- **Recommendation**: Upgrade to Mermaid or similar formal notation
- **Effort**: 2–3 hours (optional)
- **Status**: 🟡 OPEN

### NF-005: Standardize Cross-Reference Format
- **File**: `minor/NF-005-cross-reference-standardization.md`
- **Issue**: Cross-references to requirements lack consistent markdown link format
- **Recommendation**: Use markdown links: `[REQ-005](file.md)`
- **Effort**: 2–3 hours (enables automation)
- **Status**: 🟡 OPEN

---

## 💡 RECOMMENDATIONS

**Status**: 💡 **SUGGESTED - High-Value, Moderate Effort**

These are meta-requirements for creating supporting documentation and processes.

### REC-001: Create Master Requirements Traceability Matrix
- **File**: `recommendations/REC-001-traceability-matrix.md`
- **Purpose**: Single authoritative source of all requirements with status, dependencies, and test mappings
- **Benefits**: Enables automated reports; prevents lost requirements
- **Effort**: 2–3 hours (initial); 30 min/update
- **Output**: `000-REQUIREMENTS-TRACEABILITY-MATRIX.md`
- **Status**: ⏳ RECOMMENDED

### REC-002: Create Project Glossary
- **File**: `recommendations/REC-002-glossary-creation.md`
- **Purpose**: Document all domain-specific terminology with definitions and cross-references
- **Benefits**: Shared vocabulary; accelerates onboarding; reduces ambiguity
- **Effort**: 3–4 hours (initial); 15 min/update
- **Output**: `000-GLOSSARY.md`
- **Status**: ⏳ RECOMMENDED

### REC-003: Create Architecture Decision Record
- **File**: `recommendations/REC-003-architecture-decisions.md`
- **Purpose**: Document key design decisions, options evaluated, and rationale (especially for blocking/major findings)
- **Benefits**: Design rationale captured; prevents re-discussion; supports change impact analysis
- **Effort**: 3–4 hours (initial); 1 hour/new decision
- **Output**: `000-ARCHITECTURE-DECISIONS.md`
- **Status**: ⏳ RECOMMENDED

### REC-004: Create Validation Checklist
- **File**: `recommendations/REC-004-validation-checklist.md`
- **Purpose**: Standardized checklist for future specification reviews (10-point criteria + blocking/major issues)
- **Benefits**: Consistent review; clear pass/fail criteria; training tool
- **Effort**: 2–3 hours (initial); 30 min/review
- **Output**: `000-VALIDATION-CHECKLIST.md`
- **Status**: ⏳ RECOMMENDED

### REC-005: Establish Review Cadence and Process
- **File**: `recommendations/REC-005-review-cadence.md`
- **Purpose**: Formal requirements review workflow with defined roles, timing, and approval gates
- **Benefits**: Consistent quality; stakeholder alignment; risk mitigation
- **Effort**: 4–6 hours (process setup); 2–4 hours/review
- **Output**: Process documentation + templates
- **Status**: ⏳ RECOMMENDED

---

## 📂 File Organization

```
specs/
├── SPECIFICATION.md (original monolithic spec - reference only)
├── SPECIFICATION-REVIEW.md (comprehensive review findings)
├── REVIEW-FINDINGS-INDEX.md (this navigation file)
│
├── requirements/ (Core requirements - add future requirements here)
│   ├── 001-scope-and-non-scope.md
│   ├── 002-REQ-005-signal-coordination.md
│   ├── 003-REQ-007-vehicle-lane-selection.md
│   ├── 004-REQ-020-configurable-frame-rate.md
│   ├── 005-REQ-NEW-E1-emergency-vehicle-types.md
│   ├── 006-REQ-NEW-E2-emergency-visual-markers.md
│   ├── 007-REQ-NEW-E3-signal-override.md
│   ├── 008-REQ-NEW-E4-yielding-behavior.md
│   ├── 009-REQ-NEW-E5-emergency-spawn-rate.md
│   ├── 010-REQ-NEW-COLLISION-PREVENTION-1-safe-opposing-green.md
│   ├── 011-REQ-027-ui-controls.md
│   └── 012-REQ-028-state-display.md
│
├── blocking/ (Issues blocking implementation)
│   ├── BF-001-extract-missing-requirements.md
│   ├── BF-002-establish-numbering-scheme.md
│   └── BF-003-clarify-deadlock-semantics.md
│
├── major/ (Issues affecting testing)
│   ├── MF-001-precision-metric-calculations.md
│   ├── MF-002-emergency-spawn-collision-handling.md
│   ├── MF-003-terminology-standardization.md
│   ├── MF-004-signal-state-naming.md
│   ├── MF-005-scenario-preset-completeness.md
│   └── MF-006-emergency-ui-consistency.md
│
├── minor/ (Quality improvements - low priority)
│   ├── NF-001-speed-unit-consistency.md
│   ├── NF-002-acceptance-criteria-formatting.md
│   ├── NF-003-parameter-constraints-documentation.md
│   ├── NF-004-state-diagram-clarity.md
│   └── NF-005-cross-reference-standardization.md
│
└── recommendations/ (Process improvements & supporting docs)
    ├── REC-001-traceability-matrix.md
    ├── REC-002-glossary-creation.md
    ├── REC-003-architecture-decisions.md
    ├── REC-004-validation-checklist.md
    └── REC-005-review-cadence.md
```

---

## 🚀 Recommended Action Plan

### Phase 1: Unblock Implementation (1–2 weeks)
**Resolve blocking issues; enable downstream work**

1. [BF-001] Extract and document all missing requirements (3–6 hours)
2. [BF-002] Decide numbering scheme; update all requirement IDs (3–8 hours)
3. [BF-003] Define deadlock recovery procedure; update requirements (2–4 hours)
4. **Subtotal**: 8–18 hours

### Phase 2: Prepare for Testing (2–3 weeks)
**Resolve major issues; prepare for QA**

1. [MF-001] Define metric calculation formulas (2–3 hours)
2. [MF-002] Specify spawn collision handling algorithm (2–4 hours)
3. [MF-003] Standardize terminology (2–4 hours)
4. [MF-004] Establish signal state naming convention (3–5 hours)
5. [MF-005] Complete scenario preset specifications (2–3 hours)
6. [MF-006] Clarify emergency vehicle UI model (4–8 hours)
7. **Subtotal**: 15–27 hours

### Phase 3: Quality Infrastructure (1–2 weeks)
**Create supporting documentation and processes**

1. [REC-001] Create traceability matrix (2–3 hours)
2. [REC-002] Create glossary (3–4 hours)
3. [REC-003] Create architecture decision record (3–4 hours)
4. [REC-004] Create validation checklist (2–3 hours)
5. [REC-005] Establish review process (4–6 hours)
6. **Subtotal**: 14–20 hours

### Phase 4: Minor Improvements (Ongoing)
**Address minor findings as time permits**

- NF-001 through NF-005: 8–13 hours (low priority)

---

## 📊 Summary Statistics

| Category | Count | Blocking? | Effort (Hours) |
| --- | --- | --- | --- |
| **Blocking Findings** | 3 | Yes (implementation blocked) | 8–18 |
| **Major Findings** | 6 | No (but recommend before testing) | 15–27 |
| **Minor Findings** | 5 | No (nice to fix) | 8–13 |
| **Recommendations** | 5 | No (supporting infrastructure) | 14–20 |
| **TOTAL** | 19 | - | 45–78 hours |

**Recommended Priority**:
1. Blocking (must-fix): 8–18 hours
2. Major (should-fix): 15–27 hours
3. Recommendations (nice-to-do): 14–20 hours
4. Minor (optional): 8–13 hours

---

## ✅ Approval Gate

**Implementation can proceed when**:
- ✋ BF-001, BF-002, BF-003 resolved
- ✋ MF-001 through MF-006 resolved
- ℹ️ (Recommendations and minor findings can proceed in parallel)

---

## � Adding Future Requirements

**When a new requirement needs to be added**:

1. **Determine next sequence number**: Check highest numbered file in `requirements/` folder
   - Current highest: `012-REQ-028-state-display.md`
   - Next would be: `013-REQ-XXX-description.md`

2. **Follow the template**: Use the same YAML frontmatter and 10-section structure as existing files

3. **Place in correct folder**:
   - Core requirements → `specs/requirements/`
   - Issues from future reviews → appropriate folder (`specs/blocking/`, `specs/major/`, `specs/minor/`, `specs/recommendations/`)

4. **Cross-reference**: Update related requirement files with "Dependencies & Relationships" links

---

Refer to `SPECIFICATION-REVIEW.md` for detailed review findings and rationale.

---

**Last Updated**: 2026-09-04  
**Next Review**: After all blocking issues resolved (estimated 2–3 weeks)
