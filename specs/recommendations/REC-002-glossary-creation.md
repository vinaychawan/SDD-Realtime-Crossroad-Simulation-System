---
requirement_id: REC-002
title: Create Project Glossary and Terminology Reference
priority: RECOMMENDED
severity: RECOMMENDATION
version: 0.2.0
date: 2026-09-04
status: OPEN
found_in_review: SPECIFICATION-REVIEW.md
---

# REC-002: Create Project Glossary and Terminology Reference

**Requirement ID**: REC-002  
**Title**: Create Project Glossary and Terminology Reference  
**Priority**: RECOMMENDED (enables clarity and consistency)  
**Severity**: 🔵 **RECOMMENDATION**  
**Status**: OPEN

---

## Requirement Statement

A **comprehensive glossary** would document all domain-specific terminology, providing a reference for developers, testers, and stakeholders. This is particularly valuable given the complex traffic simulation domain and identified terminology inconsistencies (BF-002, MF-003).

The system **should create** `000-GLOSSARY.md` defining key concepts with:
- Formal definitions
- Context/usage
- Related concepts
- Cross-references to requirements

---

## Proposed Glossary Structure

```markdown
# Project Glossary

## Conflict Zone
**Definition**: Central intersection area (~25m × 25m) where vehicle collisions are possible when opposing directions have simultaneous green signals (Mode B).

**Context**: Mode B (Opposing Simultaneous) signal coordination

**Related concepts**:
- Conflict zone occupancy
- Conflict zone entry prevention
- Stop line (vehicle stops before entering)

**Specification references**:
- REQ-NEW-COLLISION-PREVENTION-1 (primary)
- REQ-005 (signal modes)

---

## Emergency Vehicle
**Definition**: Vehicle type with signal override capability and traffic priority; one of: Ambulance, Police, Fire Brigade.

**Behavior**:
- Can override RED signals
- Receives automatic yielding from regular vehicles
- Spawns at configurable rate (0–20 veh/min per type)

**Specification references**:
- REQ-NEW-E1 (types)
- REQ-NEW-E3 (signal override)
- REQ-NEW-E4 (yielding behavior)

---

## [Additional glossary entries...]
```

---

## Key Terms to Include

- Conflict zone
- Deadlock
- Emergency vehicle (types: Ambulance, Police, Fire)
- Spawn rate
- Signal coordination mode (Strict, Opposing)
- Lane selection strategy (Random, Intelligent)
- Throughput
- Collision-free ratio
- Yielding behavior
- Signal states (RED, GREEN, AMBER)
- Mode A / Mode B

---

## Benefits

- **Shared vocabulary**: All stakeholders use same terminology
- **Documentation clarity**: Single reference point
- **Onboarding**: Accelerates new team member understanding
- **Reduced ambiguity**: Definitions eliminate interpretation variance

---

## Implementation Approach

1. Extract all unique terms from specifications
2. Group by domain (traffic, simulation, UI, metrics, etc.)
3. Write definitions in plain language
4. Add cross-references to requirements
5. Include visual diagrams where helpful

**Effort**: 3–4 hours (initial); 15 min/update (maintenance)

---

## Sign-Off

| Role | Status |
| --- | --- |
| Documentation Lead | ⏳ PENDING |

