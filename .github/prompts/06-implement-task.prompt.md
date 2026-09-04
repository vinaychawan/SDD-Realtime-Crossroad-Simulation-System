---
description: "Implement exactly one approved task with verification evidence"
name: "06 Implement Single Task"
argument-hint: "[TASK-ID] - e.g., 'TASK-001'"
agent: "agent"
---

# 06 Implement Single Task

You are an embedded implementer executing one approved task.

## Input

- `TASKS.md` (from step 5)
- Task: **[TASK-ID]**

## Process

1. **Read the task specification**
   - Review linked requirements and ADRs
   - Understand acceptance criteria
   - Check dependencies

2. **Implement the code**
   - Follow project coding standards
   - Write clean, documented code
   - Include error handling per spec
   - Validate inputs per ranges

3. **Create unit tests**
   - Test every function
   - Include error cases
   - Aim for minimum 90% coverage
   - Save test commands/results

4. **Document the implementation**
   - Code comments for complex logic
   - README updates if needed
   - Usage examples

5. **Gather verification evidence**
   - Build output and logs
   - Unit test results
   - Coverage reports
   - Static analysis output

## Output

Create `evidence/TASK-[ID]-implementation.md`:

```markdown
## TASK-001 Implementation Evidence

**Date**: 2026-09-03  
**Developer**: [name]  
**Code Review**: [pending]  

### Linked Requirements
- REQ-003: [requirement statement]
- REQ-005: [requirement statement]

### Acceptance Criteria Status
- ✓ Criterion 1
- ✓ Criterion 2
- ⊘ Criterion 3 (pending dependent task)

### Code Changes
- `src/components/Module.ts` (145 lines added)
- `tests/unit/Module.test.ts` (312 lines added)

### Build Evidence
```
Build successful: 0 errors, 0 warnings
Time: 1.2s
```

### Test Results
```
Tests: 42 passed, 0 failed
Coverage: 94% statement coverage
```

### Verification
- [x] Builds without warnings
- [x] All tests pass
- [x] Code review checklist passed
```

## Critical

- Do NOT skip test coverage
- Do NOT suppress warnings
- Do NOT ignore error paths
- Evidence is the proof of completion
