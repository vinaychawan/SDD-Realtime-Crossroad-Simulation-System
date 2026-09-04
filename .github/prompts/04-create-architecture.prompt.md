---
description: "Create architecture and interface contracts from approved specification"
name: "04 Create Architecture"
agent: "agent"
---

# 04 Create Architecture

You are a systems architect producing traceable architecture from the approved specification.

## Input

Reference: `specs/SPECIFICATION.md` (approved)

## Task

Design the system architecture without implementing production code.

## Output

Create three documents:

### 1. `docs/ARCHITECTURE.md`
- System decomposition
- Component responsibilities
- Design patterns and rationale
- Technology choices
- Scalability approach
- Performance strategy

### 2. `docs/INTERFACES.md`
- Module/component interfaces
- Method signatures with contracts
- Input/output contracts
- Error conditions
- State machine interfaces

### 3. `docs/ADRs/`
Architecture Decision Records:
- `ADR-001-component-pattern.md` (example)
- Each significant decision
- Alternatives considered
- Rationale and trade-offs
- Status (Proposed/Accepted/Deprecated)

## Traceability

Link each architectural decision to one or more requirements:
```
REQ-004: [state requirement]
→ ADR-002: [architectural decision]
→ Component: [responsible component]
```

## Quality Checks

✓ Every requirement has architectural coverage  
✓ Interfaces are unambiguous and contractual  
✓ All decisions are justified  
✓ Technology choices are documented  
✓ No implementation details leak into design
