---
description: Perform a post-implementation spec compliance review to verify delivered behavior matches the feature specification.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Run a **read-only** review of implementation quality against `spec.md` only after implementation is complete.

This command MUST run **after** `/speckit.implement` and MUST refuse analysis if implementation is not complete.

## Operating Constraints

- **STRICTLY READ-ONLY**: Never edit project files.
- **Hard gate**: If implementation completion checks fail, stop immediately and return a blocked report.
- **Constitution authority**: `.specify/memory/constitution.md` principles are non-negotiable; any violation is at least HIGH severity.

## Execution Steps

### 1. Initialize Review Context

Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` once from repo root and parse JSON for:

- `FEATURE_DIR`
- `AVAILABLE_DOCS`

Derive absolute paths:

- `SPEC = FEATURE_DIR/spec.md`
- `PLAN = FEATURE_DIR/plan.md`
- `TASKS = FEATURE_DIR/tasks.md`

Abort with a clear prerequisite error if any required file is missing.
For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

### 2. Enforce "Implementation Done" Gate (Mandatory)

Parse `tasks.md` checklist items:

- Total items: `- [ ]`, `- [x]`, `- [X]`
- Completed items: `- [x]`, `- [X]`
- Incomplete items: `- [ ]`

If **any** incomplete items remain:

1. Stop immediately (do not run spec analysis).
2. Output blocked status with:
   - Completion percentage
   - Count of incomplete tasks
   - First 10 incomplete task IDs/lines
3. Instruct user to finish `/speckit.implement` and rerun `/speckit.review`.

### 3. Load Minimal Review Inputs

Required:

- `spec.md`: functional requirements, non-functional requirements, user stories, acceptance/success criteria, edge cases
- `tasks.md`: task IDs, task descriptions, referenced files
- `plan.md`: architecture constraints and planned technical decisions

Optional if present:

- `data-model.md`
- `contracts/`
- `research.md`
- `quickstart.md`
- `.specify/memory/constitution.md`

Implementation evidence loading strategy:

- Extract referenced file paths from `tasks.md`
- Load only existing, relevant implementation files and tests for evidence
- If path list is noisy, prioritize files tied to P1/P2 requirements and acceptance criteria

### 4. Build Traceability Model

Internally construct:

- **Requirement inventory**: stable key for each FR/NFR/acceptance criterion
- **Task mapping**: task IDs mapped to requirement keys
- **Evidence mapping**: files/tests/contracts mapped to requirement keys
- **Gap map**: requirements with no credible implementation evidence

### 5. Run Post-Implementation Review Passes

#### A. Requirement Coverage

- Requirement implemented with direct evidence
- Partial implementations missing required behavior
- Requirements with no implementation evidence

#### B. Acceptance Criteria Fidelity

- Verify acceptance criteria are testable against current implementation artifacts
- Flag criteria that remain ambiguous or unvalidated

#### C. Non-Functional & Constraint Alignment

- Performance, security, reliability, accessibility, and compliance requirements (if specified)
- Verify plan constraints and constitution MUST statements are not violated

#### D. Edge Cases & Failure Handling

- Validate specified edge/error/recovery cases are covered by implementation and/or tests

#### E. Drift & Overbuild Detection

- Terminology drift between spec and implementation
- Implemented behavior not present in spec (scope creep)
- Planned entities/components missing from delivered code paths

### 6. Severity Rules

- **CRITICAL**: Missing core requirement with no evidence, or direct constitution MUST violation
- **HIGH**: Partial core flow, unverified security/privacy requirement, acceptance criterion not satisfiable
- **MEDIUM**: Missing non-functional coverage, notable terminology drift, incomplete edge-case handling
- **LOW**: Minor wording/traceability improvements with low delivery risk

### 7. Output Report (No File Writes)

Produce a compact markdown report:

## Post-Implementation Spec Review

### Gate Status

- Implementation completion: PASS/FAIL
- Tasks complete: X/Y (Z%)

### Findings

| ID | Requirement Key | Severity | Status | Evidence | Summary | Recommendation |
|----|------------------|----------|--------|----------|---------|----------------|

Status values: `Implemented`, `Partial`, `Missing`, `Conflicting`, `Unverified`.

### Coverage Summary

| Requirement Key | Has Task Mapping | Has Implementation Evidence | Has Test Evidence | Overall |
|-----------------|------------------|-----------------------------|-------------------|---------|

### Out-of-Spec Implementations (if any)

| Item | Evidence | Risk | Suggested Action |
|------|----------|------|------------------|

### Final Verdict

- **PASS**: No CRITICAL/HIGH findings and all core requirements are implemented
- **FAIL**: Any CRITICAL finding, or unresolved HIGH findings in core flows
- **CONDITIONAL PASS**: Only MEDIUM/LOW findings remain

### Recommended Next Command

- If FAIL: `/speckit.implement` (target missing requirements)
- If PASS/CONDITIONAL PASS: proceed with release/review workflow

## Rules of Engagement

- Never silently reinterpret the specification to fit implementation gaps.
- Clearly mark inferred conclusions as inference.
- Keep output focused on actionable gaps and evidence, not narrative summaries.
