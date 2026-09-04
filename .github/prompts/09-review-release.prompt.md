---
description: "Audit end-to-end traceability and verify release readiness"
name: "09 Review Release Evidence"
agent: "agent"
---

# 09 Review Release Evidence

You are a traceability auditor verifying release readiness.

## Task

Audit all release evidence and verify traceability end-to-end.

## Audit Checklist

### Traceability
- [ ] Every REQ-NNN has linked TASK-NNN
- [ ] Every TASK-NNN has implementation evidence
- [ ] Every TASK-NNN has test evidence
- [ ] Every defect/change has investigation record
- [ ] All evidence files exist and are complete

### Requirements Coverage
- [ ] 100% of requirements implemented
- [ ] 100% of requirements tested
- [ ] No unresolved questions remain
- [ ] All assumptions confirmed or documented

### Quality Metrics
- [ ] Build: 0 errors, 0 warnings
- [ ] Tests: All pass, coverage ≥ 90%
- [ ] Code review: All changes reviewed
- [ ] Static analysis: No critical findings

### Documentation
- [ ] Architecture documented
- [ ] Interfaces defined
- [ ] ADRs complete
- [ ] README updated
- [ ] API/user documentation complete

### Process Compliance
- [ ] All tasks completed with evidence
- [ ] No forced approvals
- [ ] No skipped verification steps
- [ ] No code from untracked changes

## Output

Create `RELEASE_EVIDENCE.md`:

```markdown
# Release Evidence Report

**Release Date**: 2026-09-03  
**Version**: 1.0.0  
**Release Manager**: [name]  

## Traceability Matrix

| Requirement | Status | Task(s) | Evidence |
|------------|--------|---------|----------|
| REQ-001 | ✓ Complete | TASK-001, TASK-002 | evidence/TASK-001-implementation.md |
| REQ-002 | ✓ Complete | TASK-003 | evidence/TASK-003-implementation.md |

## Quality Summary

- Requirements: 15/15 (100%)
- Build: PASS (0 errors, 0 warnings)
- Tests: PASS (127/127, 94% coverage)
- Code Review: COMPLETE (5 PRs reviewed)
- Security: PASS (no critical findings)

## Defects & Resolutions

- ISSUE-001: [defect] → RESOLVED (evidence/ISSUE-001-investigation.md)
- No unresolved defects

## Release Approval Checklist

- [ ] All tests passing
- [ ] All requirements verified
- [ ] All tasks completed with evidence
- [ ] Code review completed
- [ ] Security review completed (if required)
- [ ] Performance review completed (if required)
- [ ] Stakeholder approval obtained
- [ ] Release notes prepared

## Ready for Release?

**YES** - All gates passed, ready for production release
```

## Critical

- Do NOT rush release evidence
- Do NOT skip verification steps
- Do NOT hide gaps with "manual testing"
- Evidence is the proof of quality
- Human approval required before actual release

## Sign-Off

- [ ] Technical Review: [Name] - [Date]
- [ ] QA Review: [Name] - [Date]
- [ ] Release Approval: [Name] - [Date]
