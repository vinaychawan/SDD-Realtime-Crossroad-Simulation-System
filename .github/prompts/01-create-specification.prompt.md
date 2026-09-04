---
description: "Create a baseline software specification from stakeholder needs"
name: "01 Create Specification"
argument-hint: "[change] - e.g., 'add user authentication', 'refactor API layer'"
agent: "agent"
---

# 01 Create Software Specification

You are a systems architect creating a detailed, unambiguous software specification.

## Task

Create a comprehensive software specification for: **[CHANGE]**

Before writing:
1. Review the project constitution (`.github/copilot-instructions.md`)
2. Check existing architecture (`docs/ARCHITECTURE.md`)
3. Review glossary and terminology
4. Identify relevant interfaces and dependencies

## Output Format

Create **one separate file per requirement** in `specs/` folder with incremental prefix numbering:

**File Naming Convention:**
- `specs/001-REQ-001-scope-and-non-scope.md` — Scope & Non-Scope overview
- `specs/002-REQ-001.md` — First requirement
- `specs/003-REQ-002.md` — Second requirement
- `specs/NNN-REQ-XXX-description.md` — Pattern for all requirements

**Each File Contains:**

### Scope & Non-Scope (File 001)
- What IS included
- What IS NOT included (explicit boundaries)
- Assumptions requiring confirmation

### Per-Requirement Files (Numbered 002+)
Each requirement file includes:

1. **Requirement ID & Title**
   - REQ-001, REQ-002, etc.
   - Clear, one-sentence statement
   - Measurable and testable

2. **Detailed Description**
   - Purpose and rationale
   - Business value

3. **Inputs, Outputs, Units & Ranges**
   - Data types and formats
   - Acceptable ranges and constraints
   - Physical/abstract units

4. **Operating States & Transitions**
   - System states affected
   - State transition conditions

5. **Timing & Resource Constraints**
   - Performance requirements (if applicable)
   - Resource limits
   - Scalability expectations

6. **Failure & Recovery Behavior**
   - Error handling
   - Recovery procedures
   - Graceful degradation

7. **Acceptance Criteria**
   - Concrete, testable conditions
   - Success metrics

8. **Verification Method**
   - How REQ-XXX will be verified
   - Unit/integration/manual validation
   - Test strategy

9. **Dependencies & Relationships**
   - Related requirements (cross-references)
   - Blocking/blocked-by relationships

10. **Unresolved Questions**
    - Ambiguities needing clarification
    - Pending decisions
    - Mitigation planning

**Numbering Rules:**
- New requirements automatically increment (e.g., if 5 requirements exist, next file is `006-REQ-006.md`)
- Scope file always starts at `001`
- Requirements start at `002` (REQ-001 in second file)
- Never skip numbers; maintain sequential order

## Key Constraints

✓ Do NOT write code — specification only  
✓ Be specific — vague language creates misunderstandings  
✓ Reference existing patterns and project conventions  
✓ Make each requirement independently testable  
✓ Flag all assumptions and unresolved questions
