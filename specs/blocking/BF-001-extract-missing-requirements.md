---
requirement_id: BF-001
title: Extract Missing Requirements from Original Specification
priority: MUST
severity: BLOCKING
version: 0.2.0
date: 2026-09-04
status: OPEN
found_in_review: SPECIFICATION-REVIEW.md
---

# BF-001: Extract Missing Requirements from Original Specification

**Requirement ID**: BF-001  
**Title**: Extract Missing Requirements from Original Specification  
**Priority**: MUST (blocking for completeness)  
**Severity**: 🔴 **BLOCKING**  
**Status**: OPEN  
**Date Identified**: 2026-09-04  

---

## Requirement Statement

The specification currently documents only **7 unique requirements** (REQ-005, REQ-007, REQ-020, REQ-NEW-E1 through E5, REQ-NEW-COLLISION-PREVENTION-1, REQ-027, REQ-028), but the original `SPECIFICATION.md` contains approximately **28 requirements** spanning REQ-001 through REQ-028.

The system **shall extract, refactor, and reorganize ALL missing requirements** from the original monolithic `SPECIFICATION.md` into individual requirement files following the modular specification format.

---

## Detailed Description

### Problem Statement

During refactoring to modular specification format, only 7 requirements were extracted into individual files:
- REQ-005: Signal Coordination
- REQ-007: Vehicle Lane Selection
- REQ-020: Configurable Frame Rate
- REQ-NEW-E1 through E5: Emergency Vehicle Features (5 requirements)
- REQ-NEW-COLLISION-PREVENTION-1: Safe Opposing-Green Operation
- REQ-027: UI Controls
- REQ-028: State Display

**Missing (~21 requirements)**:
- REQ-001 through REQ-004: Fundamental system properties (intersection geometry, traffic convention, signal basics, turn indicators)
- REQ-006: Vehicle physics and collision detection
- REQ-008 through REQ-019: Additional traffic simulation capabilities (14 requirements)
- REQ-021 through REQ-026: Additional capabilities (6 requirements)

### Expected Missing Requirements Categories

Based on typical traffic simulation systems, missing requirements likely include:

#### Core Infrastructure (REQ-001 to REQ-004)
- **REQ-001**: 4-way intersection geometry with 3 lanes per direction
- **REQ-002**: Left-hand traffic driving convention (vehicles drive on left side)
- **REQ-003**: Basic traffic signal states (RED, GREEN, AMBER) and transitions
- **REQ-004**: Turn indicators and lane change mechanics

#### Physics & Collision (REQ-006)
- **REQ-006**: Vehicle physics (speed calculations, acceleration, deceleration, collision detection)

#### Traffic Flow & Scenarios (REQ-008 to REQ-019)
- May include: Vehicle routing, queue management, traffic patterns, performance monitoring, etc.

#### Additional Features (REQ-021 to REQ-026)
- May include: Advanced scenarios, data logging, visualization features, etc.

### Extraction Approach

1. **Search original SPECIFICATION.md** for all requirement headings (REQ-XXX pattern)
2. **Catalog all discovered requirements** with their full content
3. **Create individual files** for each missing requirement following template:
   - File naming: `NNN-REQ-XXX-description.md`
   - Numbering: Continue from 013 onward (after existing 001-012 files)
4. **Validate completeness** against original source

---

## Inputs & Outputs

### Inputs

- **Source file**: `specs/SPECIFICATION.md` (original monolithic specification, ~531 lines)
- **Template format**: 01-create-specification.prompt.md (requirement file structure)
- **Target format**: Modular individual requirement files

### Outputs

- **New requirement files**: One file per extracted requirement
- **Catalog document**: `000-REQUIREMENTS-CATALOG.md` mapping original → new files
- **Updated numbering**: Sequential file numbering 013+ for new requirements
- **Updated cross-references**: All internal requirement references updated

### Data Types

| Item | Type | Format |
| --- | --- | --- |
| Missing requirement count | Integer | 20–25 estimated |
| File naming pattern | String | `NNN-REQ-XXX-description.md` |
| Requirement ID format | String | `REQ-NNN` or `REQ-NEW-XXX` |
| Content per file | Markdown | Section-based structure |

---

## Operating States & Transitions

### Extraction State Machine

```
[INITIAL STATE: 7 requirements documented]
    ↓ (identify missing requirements)
[REQUIREMENTS CATALOGED: 20+ discovered]
    ↓ (extract content from original)
[CONTENT EXTRACTED: Raw requirement text isolated]
    ↓ (refactor to template format)
[REFACTORED: Content structured per template]
    ↓ (create new files)
[FILES CREATED: All requirements in individual files]
    ↓ (validate completeness)
[EXTRACTION COMPLETE: All requirements accounted for]
```

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Extraction time | 2–4 hours | Manual review + refactoring |
| Number of new files | 20–25 | One per missing requirement |
| Validation time | 1–2 hours | Completeness check + cross-reference verification |
| Total effort | 3–6 hours | Full extraction + validation |
| Deadline | Before implementation starts | Required for implementation planning |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Original SPECIFICATION.md incomplete | Review git history for comprehensive version | Ensure full source material available |
| Requirement missing from original | Request from stakeholders | Prevent specification gaps |
| Duplicate requirements found | Consolidate into single requirement | Maintain unique requirement IDs |
| Content unclear or ambiguous | Flag for stakeholder clarification | Ensure quality before creating file |

### Error Handling

- **Invalid requirement format**: Log and flag for manual review
- **Missing sections in requirement**: Note gaps; create placeholder section for stakeholder input
- **Cross-reference inconsistencies**: Document and resolve during extraction

---

## Acceptance Criteria

### Extraction Completeness

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **All requirements extracted** | Every requirement in original SPECIFICATION.md has corresponding file in `specs/` | Automated count: grep "REQ-" in original vs. count of new files |
| **No duplicates** | Each REQ-XXX appears exactly once | Verify no two files contain same requirement ID |
| **Numbering sequential** | File numbers and requirement IDs follow sequential order with no gaps | Automated: check 001-NNN, 002-NNN, 003-NNN, etc. |
| **Content fidelity** | Extracted content matches original; no loss of information | Manual review: compare extracted vs. original for each requirement |

### File Quality

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Template compliance** | Each file includes all sections per 01-create-specification.prompt.md | Checklist: verify each section present |
| **Markdown validity** | Files pass markdown linting (no MD errors) | Run markdown linter on all extracted files |
| **Cross-references updated** | All internal REQ-XXX references point to correct files | Grep test: verify all references resolvable |

### Documentation

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Catalog created** | `000-REQUIREMENTS-CATALOG.md` documents all requirements | Verify catalog complete; all entries mapped |
| **Mapping complete** | Original requirement → new file mapping 1:1 | Cross-check: no orphaned requirements |

---

## Verification Method

1. **Source Analysis**
   - Open original `SPECIFICATION.md`
   - Extract all requirement IDs (grep "REQ-" pattern)
   - Create master list of all requirements (including missing)

2. **Extraction Execution**
   - For each missing requirement:
     - Copy content to new file
     - Refactor to template format
     - Validate completeness
     - Save with sequential numbering

3. **Completeness Validation**
   - Count total requirements: should match original count (~28)
   - Verify numbering: REQ-001 through REQ-028 all present
   - Verify no duplicates: each ID unique

4. **Cross-Reference Validation**
   - Search all 28 requirement files for references to other requirements
   - Verify each reference points to valid file
   - Update any broken references

5. **Quality Assurance**
   - Run markdown linter on all extracted files
   - Check for missing template sections
   - Verify acceptance criteria present for each requirement

6. **Documentation**
   - Create and validate `000-REQUIREMENTS-CATALOG.md`
   - Verify all requirements mapped
   - Document any non-standard requirements or naming

---

## Dependencies & Relationships

| Related Item | Relationship | Notes |
| --- | --- | --- |
| **BF-002** | **BLOCKS** | Cannot establish consistent numbering without knowing all requirements |
| **Original SPECIFICATION.md** | **SOURCE** | Primary source for extraction |
| **01-create-specification.prompt.md** | **TEMPLATE** | Template format for extracted files |
| **000-REQUIREMENTS-CATALOG.md** | **OUTPUT** | Master index of all requirements |

---

## Unresolved Questions

| Question | Impact | Status |
| --- | --- | --- |
| **Q1: Are all requirements in original SPECIFICATION.md?** | If missing from original, must request from stakeholders | Awaiting stakeholder confirmation |
| **Q2: Should "NEW-E" and "NEW-COLLISION" requirements be renumbered?** | Affects BF-002 (numbering consistency) | Blocked on BF-002 decision |
| **Q3: Are there version conflicts in original SPECIFICATION.md?** | May need to reconcile multiple versions | Awaiting access confirmation |
| **Q4: Should extraction prioritize original numbering or reformatting?** | Affects complexity and effort | Recommend maintaining original numbers for traceability |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ⏳ PENDING | Awaiting authorization to extract from original |
| System Architect | ⏳ PENDING | Need to validate extracted requirements align with system design |
| QA Lead | ⏳ PENDING | Will validate extraction quality and completeness |

---

## Mitigation Planning

**If extraction cannot be completed**:
1. Document which requirements are missing from original
2. Create placeholder files for missing requirements
3. Flag for stakeholder input in unresolved questions section
4. Proceed with BF-002 (numbering) using known requirements as foundation

**If requirements are unclear**:
1. Create requirement file with best-effort content
2. Flag ambiguities in "Unresolved Questions" section
3. Mark status as "DRAFT" pending clarification
4. Proceed with implementation on non-blocked requirements

---

**Requirement Status**: 🔴 **OPEN - BLOCKING IMPLEMENTATION**

*This requirement must be completed before BF-002 and BF-003 can be resolved.*
