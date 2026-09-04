---
requirement_id: MF-003
title: Standardize Terminology - Conflict Zone Definition
priority: SHOULD
severity: MAJOR
version: 0.2.0
date: 2026-09-04
status: OPEN
found_in_review: SPECIFICATION-REVIEW.md
---

# MF-003: Standardize Terminology - Conflict Zone Definition

**Requirement ID**: MF-003  
**Title**: Standardize Terminology - Conflict Zone Definition  
**Priority**: SHOULD (should fix before implementation)  
**Severity**: 🟠 **MAJOR**  
**Status**: OPEN  
**Date Identified**: 2026-09-04  

---

## Requirement Statement

The specification uses **inconsistent terminology** for the same concept across multiple files:
- "Conflict zone" (REQ-NEW-COLLISION-PREVENTION-1)
- "Intersection zone" (REQ-NEW-E3)
- "Intersection center" (REQ-NEW-COLLISION-PREVENTION-1)
- "Intersection area" (implied in multiple files)

This terminological fragmentation creates **documentation confusion, search/indexing problems, and maintenance burden**.

The system **shall establish a single, standardized term** for the intersection collision area, enforce it consistently across all requirement files, and document it in a project glossary.

---

## Detailed Description

### Problem Analysis

**Current usage**:

| Term | File | Context | Meaning |
| --- | --- | --- | --- |
| **Conflict zone** | REQ-NEW-COLLISION-PREVENTION-1 | "Conflict zone definition"; "zone occupied" | Central intersection area where collisions possible in Mode B |
| **Intersection zone** | REQ-NEW-E3 | "If intersection occupied, slow down..." | Same concept (implied, not explicit) |
| **Intersection center** | REQ-NEW-COLLISION-PREVENTION-1 | "Centered at intersection center" | Geometric center point (part of conflict zone definition) |
| **Intersection area** | (multiple) | General references | Ambiguous (could mean entire intersection or collision area) |
| **Intersection occupied** | REQ-NEW-E3 | Safety constraint during emergency override | Undefined (occupied by what? single vehicle? any vehicle?) |

**Consequences**:
1. **Documentation fragmentation**: Searching for "conflict zone" misses "intersection zone" references
2. **Developer confusion**: Are these same thing or different?
3. **Testing complexity**: Test plans must use multiple terms
4. **Maintenance burden**: Future updates must search multiple terms
5. **Cross-reference breaks**: Link resolution becomes ambiguous

### Standardization Options

**Option A: Use "Conflict Zone" (RECOMMENDED)**
- **Definition**: "Central intersection area (~25m × 25m) where vehicle collisions are possible when opposing directions have simultaneous green signals (Mode B)"
- **Rationale**: 
  - Already used in REQ-NEW-COLLISION-PREVENTION-1
  - Semantically accurate (conflict specifically means collision potential)
  - Short and memorable
- **Changes required**:
  - REQ-NEW-E3: Replace "intersection occupied" → "conflict zone occupied"
  - All other files: Use "conflict zone" consistently
  - Add glossary entry: "Conflict Zone"

**Option B: Use "Intersection Conflict Zone"**
- **Definition**: "Explicitly qualified to indicate intersection-specific nature"
- **Rationale**:
  - More explicit (avoids ambiguity with other "zones")
  - Could support multiple intersection types in future
- **Downside**: More verbose; rarely needs qualification

**Option C: Use "Intersection Occupancy Zone"**
- **Definition**: "Zone where vehicle occupancy is tracked for collision prevention"
- **Rationale**: 
  - Emphasizes tracking aspect
  - Explicit about purpose (occupancy detection)
- **Downside**: Longer name; less standard terminology

---

## Standardization Plan

### Phase 1: Select Term

**Recommended**: Option A - "Conflict Zone"
- Use single term throughout specification
- Add glossary entry with definition and context

### Phase 2: Update Requirement Files

| File | Current Usage | Replacement | Example |
| --- | --- | --- | --- |
| REQ-NEW-E3 | "intersection occupied" | "conflict zone occupied" | "If conflict zone occupied, slow to 80% speed..." |
| REQ-NEW-COLLISION-PREVENTION-1 | "Conflict zone" | "Conflict zone" (no change) | ✓ Already correct |
| REQ-028 | (none - review needed) | Add clarity if mentioned | Update any ambiguous references |
| All others | Search for variations | Replace with "conflict zone" | Systematic replacement |

### Phase 3: Document in Glossary

Create `000-GLOSSARY.md` with entry:
```markdown
## Conflict Zone

**Definition**: Central intersection area (~25m × 25m, configurable via `conflict_zone_size` parameter) where vehicle collisions are possible when opposing directions have simultaneous green signals.

**Context**: Specific to Mode B (Opposing Simultaneous) signal coordination. In Mode A (Strict Mutual Exclusion), only one direction has green at a time, so collision zone is not applicable.

**Related concepts**:
- Conflict zone occupancy: Real-time tracking of vehicles in zone
- Conflict zone entry prevention: Blocking opposite-direction entry if zone occupied
- Conflict zone clearance: Waiting for zone to empty before proceeding

**Specification references**:
- REQ-NEW-COLLISION-PREVENTION-1: Primary definition and mechanism
- REQ-005: Signal coordination modes
- REQ-027: Configuration parameter (`conflict_zone_size`)
```

---

## Inputs & Outputs

### Inputs

- **Current requirement files**: 001-012 (source of terminological inconsistencies)
- **REQ-NEW-COLLISION-PREVENTION-1**: Authoritative source for concept
- **Glossary template**: Format for terminology documentation

### Outputs

- **Updated requirement files**: Consistent terminology throughout
- **Glossary entry**: `000-GLOSSARY.md` (or update existing)
- **Cross-reference verification**: All internal references use standard term
- **Terminology standard**: Documented guidance for future requirements

### Data Types

| Item | Type | Format |
| --- | --- | --- |
| Standard term | String | "Conflict Zone" |
| Definition | String | Formal definition (1-2 sentences) |
| Related terms | List[String] | Synonyms or related concepts |
| File references | List[String] | Specification files using term |

---

## Operating States & Transitions

### Terminology Standardization State Machine

```
[REVIEW IDENTIFIED: Inconsistent terminology]
    ↓ (select standardization option)
[OPTION SELECTED: "Conflict Zone" chosen]
    ↓ (plan replacement)
[REPLACEMENT PLAN: Create file update plan]
    ├─ Identify all occurrences of variant terms
    ├─ Map old terms to new term
    └─ Create replacement instructions
    ↓ (execute replacement)
[FILES UPDATED: Consistent terminology applied]
    ├─ REQ-NEW-E3: "intersection" → "conflict zone"
    ├─ REQ-028: Review and update if needed
    └─ All others: Verify consistency
    ↓ (document)
[GLOSSARY CREATED: Terminology documented]
    └─ Add entry: "Conflict Zone" with definition
    ↓ (validate)
[CONSISTENCY VERIFIED: All references use standard term]
```

---

## Timing & Resource Constraints

| Constraint | Value | Rationale |
| --- | --- | --- |
| Terminology selection time | 30 minutes | Decision between options |
| File updates time | 1–2 hours | Search/replace + verification |
| Glossary creation time | 30 minutes | Write entry + examples |
| Validation time | 1 hour | Verify all files updated |
| Total effort | 2–4 hours | Low effort for high impact |

---

## Failure & Recovery Behavior

### Update Failures

| Failure | Recovery | Rationale |
| --- | --- | --- |
| Replacement breaks reference | Restore from version control | Undo bad replacements |
| Variant term still used | Re-verify file completeness | Comprehensive search for all variants |
| Glossary entry ambiguous | Stakeholder clarification | Ensure definition matches implementation |
| Future requirements use old term | Add linting rule to catch | Prevent regression |

---

## Acceptance Criteria

### Terminology Selection

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Term selected** | Standard term chosen (recommended: "Conflict Zone") | Stakeholder sign-off on selected term |
| **Definition approved** | Definition accurate and clear | Review definition with architects |

### File Updates

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **All occurrences replaced** | No instances of old terms remain | Grep search: verify no "intersection zone" or "intersection occupied" |
| **Correctness verified** | Replacements grammatically correct and accurate | Manual review of updated passages |
| **No over-replacement** | Legitimate uses of word "intersection" preserved | Context-aware search; verify legitimate uses unchanged |

### Documentation

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Glossary entry exists** | "Conflict Zone" entry in glossary with definition | Verify glossary file and entry completeness |
| **Definition matches spec** | Glossary definition consistent with requirement definitions | Compare glossary vs. REQ-NEW-COLLISION-PREVENTION-1 |
| **Related terms documented** | Related concepts and references listed | Verify comprehensive cross-reference list |

### Quality

| Criterion | Pass Condition | Verification Method |
| --- | --- | --- |
| **Markdown valid** | No linting errors in updated files | Run markdown linter on all updated files |
| **Cross-references work** | All internal references resolvable | Test reference links if implemented |

---

## Verification Method

1. **Terminology Selection**
   - Review options A, B, C
   - Select standard term with rationale
   - Document decision

2. **File Analysis**
   - Search all requirement files for variant terms:
     - "conflict zone"
     - "intersection zone"
     - "intersection occupied"
     - "intersection area"
     - "intersection center"
   - Catalog all occurrences with context

3. **Replacement Execution**
   - For each variant term:
     - Review context in file
     - Replace with standard term
     - Verify grammatical correctness
   - Specific file updates:
     - REQ-NEW-E3: "If intersection occupied" → "If conflict zone occupied"
     - Others: Review each occurrence

4. **Glossary Creation**
   - Create `000-GLOSSARY.md` (or add entry to existing)
   - Define "Conflict Zone"
   - Add related concepts and cross-references

5. **Validation**
   - Search entire `/specs/` directory for old terms
   - Verify 0 results (or only legitimate uses)
   - Manual spot-check: read updated passages for flow

6. **Linting**
   - Run markdown linter on all updated files
   - Verify no errors introduced by changes

---

## Dependencies & Relationships

| Related Item | Relationship | Notes |
| --- | --- | --- |
| **REQ-NEW-COLLISION-PREVENTION-1** | **PRIMARY SOURCE** | Authoritative definition of concept |
| **REQ-NEW-E3** | **AFFECTED FILE** | Primary target for terminology updates |
| **REQ-028** | **AFFECTED FILE** | Review for terminology consistency |
| **000-GLOSSARY.md** | **OUTPUT** | Terminology documentation |
| **REC-002** | **RELATED** | Glossary creation recommendation |

---

## Unresolved Questions

| Question | Impact | Status |
| --- | --- | --- |
| **Q1: Should "Intersection" be qualified in all contexts?** | Affects terminology scope | Recommend NO - "Conflict Zone" is sufficient |
| **Q2: Are there external systems using old terminology?** | May prevent terminology change | Recommend documenting mapping if change breaks compatibility |
| **Q3: Should glossary entry include diagram/visual?** | Affects documentation completeness | Recommend YES (if visual tools available) |

---

## Sign-Off

| Role | Status | Notes |
| --- | --- | --- |
| Requirements Engineer | ⏳ PENDING | Approve terminology selection and glossary entry |
| System Architect | ⏳ PENDING | Confirm terminology matches design documentation |
| Documentation Lead | ⏳ PENDING | Ensure glossary entry follows documentation standards |

---

**Requirement Status**: 🟠 **OPEN - SHOULD FIX BEFORE IMPLEMENTATION**

*Recommended for resolution during specification finalization phase.*
