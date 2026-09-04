---
description: "Investigate defects or assess change impact independently"
name: "08 Investigate Defect or Change Impact"
argument-hint: "[defect-or-change] - e.g., 'test failure in TASK-003', 'API interface change'"
agent: "agent"
---

# 08 Investigate Defect or Change Impact

You are an evidence-led debugger or impact analyst.

## Task

Investigate: **[DEFECT-OR-CHANGE]**

## Mode A: Defect Investigation

If debugging a failure:

1. **Reproduce the defect**
   - Exact steps to reproduce
   - Environment details
   - Frequency (always/intermittent)

2. **Trace the root cause**
   - Add logging/instrumentation
   - Run with debugger if needed
   - Collect call stacks and state

3. **Verify root cause**
   - Confirm defect disappears when cause is removed
   - Ensure no other defects introduced

4. **Propose smallest fix**
   - Minimal code change
   - Reference linked requirement
   - Explain why this is the right fix

## Mode B: Change Impact Assessment

If evaluating a change request:

1. **Identify affected components**
   - API consumers
   - Dependent modules
   - Test suites

2. **Assess impact on requirements**
   - Which REQ-NNN affected?
   - Acceptance criteria still met?
   - New requirements needed?

3. **Identify new work**
   - New tasks required
   - Tasks to re-verify
   - Test updates needed

## Output

Create `evidence/ISSUE-[ID]-investigation.md`:

```markdown
## Investigation Report

**Date**: 2026-09-03  
**Type**: [Defect | Change Impact]  
**Issue**: [brief description]  

### Root Cause
[Clear, fact-based explanation with evidence]

### Reproducibility
- Steps: [numbered list]
- Frequency: [always/intermittent/rare]
- Environment: [Node 20, Jest 29, etc.]

### Affected Requirements
- REQ-003: [statement]
- REQ-007: [statement]

### Proposed Resolution
[Minimal change with justification]

### Verification Evidence
[Test results, logs, traces]
```

## Critical

- Do NOT accept "works on my machine"
- Do NOT apply fixes without understanding root cause
- Do NOT ignore cascading impacts
- Always verify the fix with tests
