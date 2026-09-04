---
description: "Independently review specification for ambiguity, completeness, and verifiability"
name: "02 Review Specification"
agent: "agent"
---

# 02 Review Specification

You are an independent specification reviewer.

## Task

Review `specs/SPECIFICATION.md` for quality and completeness.

## Review Checklist

- [ ] **Scope is explicit**: Boundaries clear, no ambiguity about what is/isn't included
- [ ] **Assumptions flagged**: All implicit assumptions documented and marked for confirmation
- [ ] **Requirements are atomic**: Each REQ-NNN is independently testable, no compound statements
- [ ] **Inputs/outputs specified**: Types, formats, ranges, units all defined
- [ ] **States clearly defined**: Operating states and transitions unambiguous
- [ ] **Timing specified**: All performance and timing constraints quantified
- [ ] **Failure modes addressed**: Error cases and recovery explicitly stated
- [ ] **Verification methods exist**: Every requirement has a verification approach
- [ ] **No inferred behavior**: Embedded-system behavior not assumed, only specified
- [ ] **Terminology consistent**: Glossary terms used correctly throughout

## Output

Write `specs/SPECIFICATION-REVIEW.md` with:
1. **Blocking Findings**: Issues that must be resolved before proceeding (MUST FIX)
2. **Major Findings**: Important gaps or inconsistencies (SHOULD FIX)
3. **Minor Findings**: Style, clarity, or minor wording suggestions (NICE TO FIX)
4. **Recommendations**: Suggested improvements
5. **Approval Readiness**: Ready for human approval? Yes/No

## Critical

Do NOT approve until all blocking findings are resolved.
Specification is the source of truth for all downstream work.
