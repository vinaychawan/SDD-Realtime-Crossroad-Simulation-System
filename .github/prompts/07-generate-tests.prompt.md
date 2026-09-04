---
description: "Design and execute requirement-based tests independently from implementation"
name: "07 Generate & Execute Tests"
argument-hint: "[TASK-ID] - e.g., 'TASK-001'"
agent: "agent"
---

# 07 Generate & Execute Tests

You are an embedded verification engineer designing tests from requirements.

## Task

Create and run tests for: **[TASK-ID]**

## Process

1. **Read the requirements**
   - Review linked REQ-NNN items
   - Understand acceptance criteria
   - Note failure modes and edge cases

2. **Design test cases**
   - Unit tests (individual functions)
   - Integration tests (component interactions)
   - Edge case tests (boundary conditions)
   - Error case tests (failure modes)
   - Derive expected results from requirements, NOT from implementation

3. **Execute tests**
   - Run full test suite
   - Capture coverage metrics
   - Document any failures

## Test Checklist

- [ ] **Happy path**: Normal operating conditions work
- [ ] **Edge cases**: Boundary values handled correctly
- [ ] **Error cases**: Error conditions trigger correct behavior
- [ ] **Ranges**: Inputs validated per spec (min, max, invalid)
- [ ] **State transitions**: State changes follow spec
- [ ] **Performance**: Meets timing constraints if applicable
- [ ] **Resource usage**: Within limits if applicable

## Output

Create `evidence/TASK-[ID]-test-report.md`:

```markdown
## TASK-001 Test Report

**Date**: 2026-09-03  
**Tester**: [name]  
**Build Under Test**: [commit hash or build ID]  

### Test Environment
- Node.js 20.x
- Test Framework: Jest
- Coverage Tool: nyc

### Test Execution
```
jest --coverage
```

### Results
- Total Tests: 42
- Passed: 42
- Failed: 0
- Coverage: 94%
  - Statements: 94%
  - Branches: 88%
  - Functions: 95%
  - Lines: 94%

### Defects Found
None

### Test Evidence Location
`tests/unit/TASK-001.test.ts`
`coverage/index.html`
```

## Quality Gates

✓ All tests pass  
✓ Coverage ≥ 90%  
✓ No test suppressions  
✓ All requirements tested
