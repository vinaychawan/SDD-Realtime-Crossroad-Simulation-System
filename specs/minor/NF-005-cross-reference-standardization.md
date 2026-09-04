---
requirement_id: NF-005
title: Standardize Cross-Reference Format
priority: NICE-TO-FIX
severity: MINOR
version: 0.2.0
date: 2026-09-04
status: OPEN
found_in_review: SPECIFICATION-REVIEW.md
---

# NF-005: Standardize Cross-Reference Format

**Requirement ID**: NF-005  
**Title**: Standardize Cross-Reference Format  
**Priority**: NICE (nice to fix - enables automation)  
**Severity**: 🟡 **MINOR**  
**Status**: OPEN

---

## Requirement Statement

Cross-references to other requirements vary in format:
- Inline text: "per REQ-NEW-E2"
- Dependencies table: Structured references
- No consistent markdown link format

The system **should standardize cross-reference format** to enable:
1. Automated link generation
2. Traceability reports
3. Broken reference detection

---

## Proposed Standard

### In-Text References
```markdown
[REQ-005](002-REQ-005-signal-coordination.md) specifies signal coordination modes.

OR

See REQ-005 for signal coordination details.
```

### Dependencies Table (Already Good)
```markdown
| Related Requirement | Relationship |
| --- | --- |
| [REQ-005](path) | BLOCKS |
```

---

## Benefits

- **Automated tools**: Can extract all requirements
- **Link validation**: Can verify references exist
- **Traceability**: Can generate dependency matrix
- **Navigation**: Users can click links

---

## Implementation

1. Define link format standard (relative or absolute paths)
2. Convert all inline "REQ-XXX" references to markdown links
3. Create automated validation script (optional)
4. Test all links work

**Effort**: 2–3 hours (optional; low priority)

---

## Sign-Off

| Role | Status |
| --- | --- |
| Documentation Lead | ⏳ PENDING |

