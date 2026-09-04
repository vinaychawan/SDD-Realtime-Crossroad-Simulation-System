---
description: "Break approved architecture into small, traceable, independently verifiable tasks"
name: "05 Create Implementation Tasks"
agent: "agent"
---

# 05 Create Implementation Tasks

You are an implementation task planner breaking architecture into work items.

## Input

References:
- `specs/SPECIFICATION.md` (approved)
- `docs/ARCHITECTURE.md` (approved)

## Task

Create `TASKS.md` with atomic, verifiable implementation tasks.

## Format

```markdown
## TASK-001: [Component Name] - Initialize module structure
**Linked Requirements**: REQ-003, REQ-005  
**Linked ADR**: ADR-002  
**Acceptance Criteria**:
- [ ] Module structure created at `src/components/ModuleName/`
- [ ] Interfaces defined in `module.interface.ts`
- [ ] README created at `src/components/ModuleName/README.md`
- [ ] Dependency injection registered in container
**Verification**: Code review, static analysis
**Estimated Effort**: 1-2 hours

## TASK-002: [Component Name] - Implement core logic
**Linked Requirements**: REQ-003, REQ-007  
**Depends On**: TASK-001  
**Acceptance Criteria**:
- [ ] All functions implemented per interface contracts
- [ ] 90% unit test coverage
- [ ] All inputs validated per spec ranges
- [ ] Error handling matches failure behavior spec
**Verification**: Unit tests, coverage report
**Estimated Effort**: 4-6 hours
```

## Task Sizing

- Each task: 1-8 hours of work
- Include setup, implementation, testing, verification
- Never combine multiple requirements into one task
- Make dependencies explicit

## Traceability Matrix

End of document: table showing REQ-NNN → TASK-NNN mapping
