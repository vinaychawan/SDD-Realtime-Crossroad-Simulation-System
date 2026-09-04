---
requirement_id: BF-002
title: Establish Consistent Requirement Numbering Scheme
priority: MUST
severity: BLOCKING
version: 0.2.0
date: 2026-09-04
status: OPEN
found_in_review: SPECIFICATION-REVIEW.md
---

# BF-002: Establish Consistent Requirement Numbering Scheme

**Requirement ID**: BF-002  
**Title**: Establish Consistent Requirement Numbering Scheme  
**Priority**: MUST (blocking for traceability)  
**Severity**: 🔴 **BLOCKING**  
**Status**: OPEN  
**Date Identified**: 2026-09-04  

---

## Requirement Statement

The current specification uses **inconsistent requirement numbering** mixing standard (REQ-005, REQ-027) with non-standard (REQ-NEW-E1, REQ-NEW-COLLISION-PREVENTION-1) formats, creating traceability and documentation problems.

The system **shall establish and enforce a consistent, sequential requirement numbering scheme** applicable to all requirements (REQ-001 through REQ-NNN) with documented mapping and rationale.

---

## Detailed Description

### Problem Statement

Current numbering scheme has multiple formats:

| Format | Example | Files | Issues |
| --- | --- | --- | --- |
| Standard numeric | REQ-005, REQ-007, REQ-020, REQ-027, REQ-028 | 5 files | Clean, sequential, expected |
| NEW-E prefix | REQ-NEW-E1, REQ-NEW-E2, REQ-NEW-E3, REQ-NEW-E4, REQ-NEW-E5 | 5 files | Non-standard, unclear suffix format (E1 vs 001) |
| NEW-feature prefix | REQ-NEW-COLLISION-PREVENTION-1 | 1 file | Non-standard, descriptive but verbose |

**Consequences**:
1. **Traceability loss**: Developers and QA cannot easily sort or index requirements
2. **Documentation fragmentation**: Cross-references inconsistent (REQ-NEW-E1 vs REQ-NEW-COLLISION-PREVENTION-1)
3. **Testing complexity**: Test frameworks struggle with non-standard naming
4. **Maintenance burden**: Future requirements unclear how to number them

### Numbering Options

**Option A: Consolidate to Sequential Numeric (RECOMMENDED)**
- All requirements: REQ-001 through REQ-NNN
- Maintain original requirement semantics
- Renumber emergency and collision-prevention requirements to fit sequence
- **Example**:
  - REQ-001: Intersection geometry
  - REQ-002: Left-hand driving convention
  - ...
  - REQ-005: Signal coordination (keep existing ID)
  - ...
  - REQ-015: Emergency vehicle types (renumber from REQ-NEW-E1)
  - REQ-016: Emergency visual markers (renumber from REQ-NEW-E2)
  - REQ-017: Signal override (renumber from REQ-NEW-E3)
  - REQ-018: Yielding behavior (renumber from REQ-NEW-E4)
  - REQ-019: Emergency spawn rate (renumber from REQ-NEW-E5)
  - REQ-020: Collision prevention (renumber from REQ-NEW-COLLISION-PREVENTION-1)
  - REQ-021: UI controls (renumber from REQ-027)
  - REQ-022: State display (renumber from REQ-028)

**Option B: Maintain Current Numbering with Documented Mapping (ALTERNATIVE)**
- Keep existing numbers (REQ-005, REQ-NEW-E1, etc.) unchanged
- Create comprehensive mapping document
- Add field to each requirement file: `normalized_id` for cross-reference
- **Advantage**: No file changes needed; explicit mapping provided
- **Disadvantage**: Complexity; requires discipline in new requirements

**Option C: Hybrid: Preserve "NEW" Requirements as Separate Prefix (ALTERNATIVE)**
- Create sequence: REQ-001 through REQ-028, with "NEW" as separate branch
- Example: REQ-NEW-001, REQ-NEW-002, etc. (for new features added in v0.2.0)
- Provides traceability of original vs. new requirements
- **Advantage**: Clear separation of v0.1 vs v0.2 features
- **Disadvantage**: Still non-standard; two parallel sequences

---

## Inputs & Outputs

### Inputs

- **Current specification files**: 12 files (001-012) with mixed numbering
- **Mapping source**: Original SPECIFICATION.md (for legacy numbering)
- **Stakeholder decision**: Which option to select (A, B, or C)

### Outputs

- **Mapping document**: `000-REQUIREMENTS-NUMBERING-SCHEME.md` documenting decision and rationale
- **Updated files**: All 28+ requirement files with consistent numbering
- **Cross-reference updates**: All internal REQ-XXX references corrected
- **Traceability matrix**: `000-REQUIREMENTS-TRACEABILITY-MATRIX.md` (per REC-001)

### Data Types

| Item | Type | Format |
| --- | --- | --- |
| Numbering scheme | Enum | Option A \| B \| C |
| Old-to-new mapping | Table | REQ-NEW-E1 → REQ-015 |
| File renaming | String | 005-REQ-005.md → 002-REQ-005.md |

---

## Operating States & Transitions

### Numbering Decision State Machine

```
[REVIEW COMPLETE: Inconsistency identified]
    ↓ (stakeholder decision)
[OPTION SELECTED: A, B, or C chosen]
    ├─ [OPTION A: Sequential] → [RENUMBERING] → [FILE REORGANIZATION]
    ├─ [OPTION B: Mapped] → [MAPPING DOC] → [GLOSSARY UPDATE]
    └─ [OPTION C: Hybrid] → [PREFIX SCHEME] → [FILE UPDATES]
    ↓ (after chosen path)
[CROSS-REFERENCES UPDATED: All REQ-XXX refs corrected]
    ↓ (validation)
[NUMBERING SCHEME FINAL: All files consistent]
```

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Decision time | 1–2 hours | Stakeholder review + decision |
| Effort (Option A) | 4–6 hours | Renumbering + file updates + cross-ref updates |
| Effort (Option B) | 2–3 hours | Create mapping + documentation |
| Effort (Option C) | 3–4 hours | Implement hybrid scheme + cross-ref updates |
| Validation time | 1–2 hours | Verify all references updated correctly |
| Total effort | 3–8 hours | Depends on option selected |
| Deadline | Before BF-001 completion | Required for consistency |

---

## Failure & Recovery Behavior

### Failure Scenarios

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Renumbering breaks cross-references | Automated find/replace with verification | Catch broken references in validation step |
| Old requirement IDs referenced externally | Create legacy mapping in glossary | Maintain external traceability |
| Git history loses old numbering | Document old numbering in changelog | Preserve audit trail |
| Inconsistent application | Linting rule to enforce format | Catch violations during review |

### Consistency Enforcement

- **Automated linting**: Requirement filename must match ID format
- **Template enforcement**: File template includes requirement ID field
- **CI/CD validation**: Reject pull requests with inconsistent numbering

---

## Acceptance Criteria

### Option A (Sequential) Acceptance

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Sequential numbering** | All REQ-001 through REQ-NNN with no gaps | Automated check: verify sequential file numbers |
| **No duplicates** | Each REQ-XXX ID unique | Grep for duplicates; verify count = file count |
| **Cross-references updated** | All internal references point to correct files | Search all files for "REQ-" references; verify valid |
| **Mapping document** | Traceability matrix showing old → new IDs | Verify all 28+ requirements mapped |

### Option B (Mapped) Acceptance

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Mapping document complete** | All 28+ requirements have old-to-new entry | Verify table completeness |
| **Files unchanged** | Original file numbers/names preserved | Confirm no file renames needed |
| **Glossary updated** | Both old and new IDs documented | Search glossary for all requirements |

### Option C (Hybrid) Acceptance

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Hybrid scheme documented** | REQ-001-NNN and REQ-NEW-001-NNN clearly defined | Review scheme document for clarity |
| **Separation clear** | v0.1 requirements vs v0.2 "NEW" requirements distinct | Verify schema enforced in files |
| **Cross-references consistent** | All internal refs use appropriate prefix | Grep test for correct usage |

### General Acceptance (All Options)

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Markdown valid** | No linting errors in updated files | Run markdown linter |
| **Decision documented** | Rationale for selected option recorded | Review decision doc |
| **Stakeholder approval** | Decision signed off by architect | Sign-off table complete |

---

## Verification Method

1. **Decision Documentation**
   - Stakeholder selects Option A, B, or C
   - Document rationale in `000-REQUIREMENTS-NUMBERING-SCHEME.md`
   - Obtain sign-off from Requirements Engineer + Architect

2. **Implementation** (depends on option)
   - **Option A**: Execute file renames + content updates + cross-ref updates
   - **Option B**: Create mapping document + update glossary
   - **Option C**: Define prefix rules + implement scheme + cross-ref updates

3. **Validation**
   - Count total requirements: should match total files
   - Verify no gaps in numbering
   - Verify no duplicate IDs
   - Test all cross-references resolve correctly

4. **Linting**
   - Run markdown linter on all files
   - Run custom linting rule for numbering consistency
   - Verify all sections present in each file

5. **Documentation**
   - Verify traceability matrix complete
   - Verify glossary updated
   - Verify schema documented

---

## Dependencies & Relationships

| Related Item | Relationship | Notes |
| --- | --- | --- |
| **BF-001** | **DEPENDS ON** | Must extract missing requirements first to know full scope |
| **BF-003** | **ENABLED BY** | Once numbering consistent, deadlock definitions can reference specific requirements |
| **000-REQUIREMENTS-NUMBERING-SCHEME.md** | **OUTPUT** | Documents final numbering scheme |
| **000-REQUIREMENTS-TRACEABILITY-MATRIX.md** | **OUTPUT** | Master list of all requirements with IDs |

---

## Unresolved Questions

| Question | Impact | Status |
| --- | --- | --- |
| **Q1: Which option (A, B, or C) preferred?** | Drives entire implementation approach | Awaiting stakeholder decision |
| **Q2: Should legacy numbering be preserved for external references?** | Affects compatibility and documentation | Recommend documenting mapping regardless of option |
| **Q3: Are there external systems depending on current numbering?** | May prevent renumbering (Option A) | Awaiting confirmation |
| **Q4: Should new requirements (013+) follow chosen scheme?** | Affects future requirements | Recommend applying scheme to all new requirements |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ⏳ PENDING | Need to evaluate options A/B/C and provide recommendation |
| System Architect | ⏳ PENDING | Need to confirm numbering scheme acceptable for design |
| QA Lead | ⏳ PENDING | Will validate numbering scheme supports testing |

---

**Requirement Status**: 🔴 **OPEN - BLOCKING IMPLEMENTATION**

*Decision required before implementation can proceed. Recommend Option A (Sequential) for clarity and maintainability.*
