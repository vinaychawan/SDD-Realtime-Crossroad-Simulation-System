# Spec-Driven Development Project

This project follows a rigorous **9-step spec-driven development workflow** using Spec Kit and GitHub Copilot.

## Workflow Overview

| Step | Task | Output | Status |
|------|------|--------|--------|
| 1 | Create Specification | `specs/SPECIFICATION.md` | Execute |
| 2 | Review Specification | `specs/SPECIFICATION-REVIEW.md` | Review |
| 3 | Obtain Approval | Stakeholder sign-off | Gate |
| 4 | Create Architecture | `docs/ARCHITECTURE.md`, ADRs | Execute |
| 5 | Create Tasks | `TASKS.md` | Planning |
| 6 | Implement Task | Code + Evidence | Development |
| 7 | Test & Verify | Test Reports + Coverage | QA |
| 8 | Investigate | Defect/Impact Reports | Debug |
| 9 | Review Release | `RELEASE_EVIDENCE.md` | Gate |

## Quick Start

### Prerequisites
- GitHub Copilot (or other supported agent from Spec Kit)
- Node.js 18+ (or your project's runtime)
- Build tools (make, npm, etc.)

### Running the Workflow

#### Using the Shell Script
```bash
cd my-project
chmod +x scripts/workflow.sh

# Show instructions for each step
./scripts/workflow.sh 1  # Step 1: Create Specification
./scripts/workflow.sh 2  # Step 2: Review Specification
# ... and so on
```

#### Using GitHub Actions
Go to **Actions** → **Spec-Driven Development Workflow** → **Run workflow**
- Select the step (1-9)
- Optionally provide TASK-ID for steps 6-7
- View logs and artifacts

#### Using Chat Prompts

In your coding agent chat, type:

```
/01-create-specification add user authentication
/02-review-specification
/04-create-architecture
/05-create-tasks
/06-implement-task TASK-001
/07-generate-tests TASK-001
/08-investigate-defect test failure in TASK-003
/09-review-release
```

## Detailed Steps

### Step 1: Create Specification

**Command**: `/01-create-specification [change description]`

**Output**: `specs/SPECIFICATION.md`

Creates a 10-section specification:
1. Scope & Non-Scope
2. Assumptions
3. Atomic Requirements (REQ-NNN)
4. Inputs/Outputs/Ranges
5. Operating States
6. Timing & Resources
7. Failure & Recovery
8. Acceptance Criteria
9. Verification Methods
10. Unresolved Questions

**Key**: Do NOT write code at this stage.

---

### Step 2: Review Specification

**Command**: `/02-review-specification`

**Input**: `specs/SPECIFICATION.md`  
**Output**: `specs/SPECIFICATION-REVIEW.md`

Independent review for:
- ✓ Scope clarity
- ✓ Assumption documentation
- ✓ Atomic requirements (no compound statements)
- ✓ Complete input/output specs
- ✓ State machine clarity
- ✓ Timing specification
- ✓ Failure mode coverage
- ✓ Verification methods
- ✓ No inferred embedded-system behavior
- ✓ Terminology consistency

**Gate**: Resolve all blocking findings before proceeding.

---

### Step 3: Obtain Approval

**Manual Gate**: Stakeholder review and sign-off on specification.

- [ ] Technical review complete
- [ ] Product review complete
- [ ] Stakeholder approval obtained

---

### Step 4: Create Architecture

**Command**: `/04-create-architecture`

**Input**: `specs/SPECIFICATION.md` (approved)  
**Output**: 
- `docs/ARCHITECTURE.md` - System design
- `docs/INTERFACES.md` - Component contracts
- `docs/ADRs/` - Architecture decision records

Creates traceable design:
- Component decomposition
- Module interfaces with contracts
- Design patterns and technology choices
- ADRs with alternatives and rationale
- Traceability: REQ-NNN → ADR-NNN → Component

**Key**: No production code at this stage.

---

### Step 5: Create Implementation Tasks

**Command**: `/05-create-tasks`

**Input**: `specs/SPECIFICATION.md`, `docs/ARCHITECTURE.md`  
**Output**: `TASKS.md`

Breaks work into atomic tasks:
- TASK-001, TASK-002, ... TASK-NNN
- Each task: 1-8 hours of work
- Linked requirements and ADRs
- Explicit acceptance criteria
- Test scope defined
- Dependencies noted

**Traceability**: REQ-NNN → TASK-NNN matrix

---

### Step 6: Implement Single Task

**Command**: `/06-implement-task TASK-001`

**Input**: `TASKS.md`  
**Output**: 
- Production code
- `evidence/TASK-001-implementation.md`

For each task:
1. Read the specification
2. Implement the code (following standards, with error handling)
3. Create unit tests (min 90% coverage)
4. Gather verification evidence

**Evidence includes**:
- Code changes (files and line counts)
- Build logs (0 errors, 0 warnings)
- Test results (pass count, coverage)
- Verification checklist

**Key**: One task at a time, complete evidence collection.

---

### Step 7: Generate & Execute Tests

**Command**: `/07-generate-tests TASK-001`

**Input**: Linked requirements (REQ-NNN)  
**Output**: `evidence/TASK-001-test-report.md`

Independent verification:
- Unit tests for all functions
- Edge case and error case coverage
- Coverage minimum: 90%
- All tests pass

**Test Report includes**:
- Test environment details
- All test results (count, pass/fail)
- Coverage breakdown (statements, branches, functions, lines)
- Any defects found
- Verification evidence location

---

### Step 8: Investigate Defect or Change Impact

**Command**: `/08-investigate-defect [defect description]`

**Output**: `evidence/ISSUE-[ID]-investigation.md`

Two modes:

**Mode A - Defect Investigation**:
- Reproduce with exact steps
- Trace root cause
- Verify fix resolves defect
- Propose smallest code change

**Mode B - Change Impact Assessment**:
- Identify affected components
- Assess impact on requirements
- Identify new tasks needed
- List test updates required

**Investigation Report includes**:
- Root cause explanation
- Reproducibility details
- Affected requirements
- Proposed resolution
- Verification evidence

---

### Step 9: Review Release Evidence

**Command**: `/09-review-release`

**Output**: `RELEASE_EVIDENCE.md`

Comprehensive audit:

**Traceability**:
- ✓ Every REQ-NNN → TASK-NNN
- ✓ Every task has implementation evidence
- ✓ Every task has test evidence
- ✓ All investigations documented

**Quality**:
- ✓ Build: 0 errors, 0 warnings
- ✓ Tests: All pass, ≥90% coverage
- ✓ Code review: All changes reviewed
- ✓ Static analysis: No critical findings

**Documentation**:
- ✓ Architecture complete
- ✓ Interfaces defined
- ✓ ADRs complete
- ✓ README updated
- ✓ User documentation ready

**Release Readiness Checklist**:
- [ ] All tests passing
- [ ] All requirements verified
- [ ] All tasks completed with evidence
- [ ] Code review completed
- [ ] Security review completed (if required)
- [ ] Performance review completed (if required)
- [ ] Stakeholder approval obtained
- [ ] Release notes prepared

**Gate**: Human approval required before actual release to production.

---

## Project Structure

```
my-project/
├── .github/
│   ├── workflows/
│   │   └── spec-workflow.yml          # GitHub Actions workflow
│   ├── prompts/
│   │   ├── 01-create-specification.prompt.md
│   │   ├── 02-review-specification.prompt.md
│   │   ├── 04-create-architecture.prompt.md
│   │   ├── 05-create-tasks.prompt.md
│   │   ├── 06-implement-task.prompt.md
│   │   ├── 07-generate-tests.prompt.md
│   │   ├── 08-investigate-defect.prompt.md
│   │   └── 09-review-release.prompt.md
│   ├── agents/                        # (from Spec Kit init)
│   ├── skills/                        # (from Spec Kit init)
│   └── copilot-instructions.md        # Engineering constitution
├── scripts/
│   └── workflow.sh                    # Workflow orchestrator
├── specs/
│   ├── SPECIFICATION.md               # (Generated in Step 1)
│   └── SPECIFICATION-REVIEW.md        # (Generated in Step 2)
├── docs/
│   ├── ARCHITECTURE.md                # (Generated in Step 4)
│   ├── INTERFACES.md                  # (Generated in Step 4)
│   └── ADRs/                          # Architecture Decision Records
├── evidence/
│   ├── TASK-001-implementation.md     # (Generated in Step 6)
│   ├── TASK-001-test-report.md        # (Generated in Step 7)
│   └── ISSUE-001-investigation.md     # (Generated in Step 8)
├── TASKS.md                           # (Generated in Step 5)
├── RELEASE_EVIDENCE.md                # (Generated in Step 9)
├── src/                               # Production code
├── tests/                             # Test files
├── README.md                          # This file
└── [your build/config files]
```

## Key Principles

1. **Specification-First**: Write specs before code
2. **Independent Review**: Specifications and implementations reviewed separately
3. **Complete Evidence**: Every decision and outcome documented
4. **Traceable Design**: Requirement → Architecture → Task → Code → Test
5. **No Vibe Coding**: Every change linked to approved requirements
6. **Atomic Requirements**: Requirements decomposed until independently testable
7. **Deterministic Verification**: Tests derived from requirements, not implementation
8. **Human Approval Gates**: Critical decisions require explicit human sign-off

## Code Standards

(From `.github/copilot-instructions.md`)

All code must:
- ✓ Compile/build without errors or warnings
- ✓ Meet 90% minimum test coverage
- ✓ Follow project coding standards
- ✓ Include error handling per specification
- ✓ Validate inputs per defined ranges
- ✓ Include descriptive comments for complex logic
- ✓ Be reviewed before merge

## Running Tests

```bash
# Unit tests
npm test
npm run test:coverage

# Build
npm run build

# Static analysis
npm run lint
npm run type-check
```

## Committing Changes

Every commit must:
- Link to at least one requirement (REQ-NNN) or task (TASK-NNN)
- Include evidence in commit message
- Pass all tests
- Have code review approval

Commit message format:
```
[TASK-001] Implement user authentication module

Implements REQ-003, REQ-005, REQ-007

Evidence:
- evidence/TASK-001-implementation.md
- evidence/TASK-001-test-report.md
```

## Troubleshooting

### "Specification has unresolved questions"
→ Go back to Step 2, resolve all blocking findings with stakeholders

### "Architecture conflicts with specification"
→ Run Step 4 again with stakeholder review

### "Test coverage below 90%"
→ Add missing tests before marking task complete

### "Unresolved defect in Step 8"
→ Run Step 8 investigation again, propose corrected fix, re-test

### "Release evidence incomplete"
→ Step 9 will identify gaps; go back to missing steps and complete evidence

## Support

Refer to:
- `.github/copilot-instructions.md` - Engineering constitution
- `.specify/` - Spec Kit framework documentation
- `docs/ARCHITECTURE.md` - Project architecture
- Individual step prompts (`.github/prompts/*.prompt.md`)

## Related Resources

- [Spec Kit](https://github.com/github/spec-kit) - Official toolkit
- [Spec-Driven Development](https://spec-driven.org) - Methodology
- [GitHub Copilot](https://github.com/features/copilot) - AI coding agent
- [Embedded SDD Workflow](https://github.com/github/embedded-sdd-workflow) - Template reference

---

**Last Updated**: 2026-09-03  
**Version**: 1.0.0  
**Maintained By**: [Your Team]
