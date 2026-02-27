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

#### F. Pattern Consistency & DRY Enforcement

Compare implementation against **reference module** (`products`) and detect deviations.

**Reference Module:** Use `products` module as the gold standard for:
- Repository method naming (`getMany()`/`getById()` NOT `findMany()`/`findById()`)
- Return types (`null` for not-found, not throwing)
- Organization filtering (`organizationId` in all queries)
- Soft delete patterns (`where("deletedAt", "is", null)`)
- TanStack Form + Zod patterns (schema location, form options, validation)
- Server Actions structure (useActionState, session helper usage)
- Clean Architecture compliance (layer dependencies)

**Pattern Areas to Verify:**

| Pattern Area | Reference Implementation | Check For |
|-------------|------------------------|-----------|
| **Repository Layer** | `products/infrastructure/repositories/` | Method naming, return types, org filtering, soft delete |
| **Form Handling** | `products/presentation/schemas/`, `lib/form-options.ts` | TanStack Form + Zod pattern, error handling |
| **Server Actions** | `products/presentation/actions/` | useActionState pattern, session helper imports |
| **Clean Architecture** | `products/` directory structure | Domain ← Application ← Infrastructure ← Presentation |
| **UI Components** | `@/shared/presentation/components/ui/` | Proper imports from shared, no local duplicates |

#### G. Shared Code Detection & DRY Enforcement

**Goal:** Detect code that should be extracted to `src/shared/` and enforce DRY principle.

**Decision Matrix: Should This Code Be Shared?**

Use this decision tree:

```
Is it used by 2+ modules?
├── YES → Move to shared/
│   ├── Infrastructure concern? → shared/infrastructure/
│   │   ├── Database access → persistence/
│   │   ├── Auth → auth/
│   │   ├── External APIs → external/
│   │   └── Other infra → infrastructure root
│   ├── Presentation concern? → shared/presentation/
│   │   ├── UI component → components/ui/
│   │   ├── Layout component → components/layout/
│   │   ├── Hook → hooks/
│   │   ├── Utility function → library/
│   │   ├── Auth helper → auth/
│   │   └── Config → config/
│   ├── Application concern? → shared/application/
│   │   ├── Base interface → application/
│   │   ├── Shared DTO → application/
│   │   └── Base service → application/
│   └── Cross-module type → src/types/ (root types folder)
└── NO → Keep in module
    └── Is it duplicated in another module?
        ├── YES → Extract to shared/ and refactor both
        └── NO → Keep module-specific
```

**Shared Code Categories & Locations:**

| Category | Location | Examples | Detection Pattern |
|----------|----------|----------|-------------------|
| **UI Components** | `shared/presentation/components/ui/` | Button, Input, Dialog, Table | JSX component used in forms/lists |
| **Layout Components** | `shared/presentation/components/layout/` | Sidebar, Header, Navigation | App shell components |
| **Icons** | `shared/presentation/components/icons.tsx` | Lucide icon exports | Direct Lucide imports in components |
| **Custom Hooks** | `shared/presentation/hooks/` | useMobile, useBreadcrumbs | useState + useEffect patterns |
| **Utilities** | `shared/presentation/library/utils.ts` | cn(), error normalizers | Pure functions, class merging |
| **Auth Helpers** | `shared/presentation/auth/` | getSessionAndOrg() | Session validation logic |
| **Configuration** | `shared/presentation/config/` | Navigation config | Static configuration objects |
| **Database Client** | `shared/infrastructure/persistence/` | db, DB types | Kysely queries |
| **Auth Config** | `shared/infrastructure/auth/` | auth, authClient | better-auth setup |
| **External Services** | `shared/infrastructure/external/` | Email service | API clients |
| **Base Types** | `src/types/` | Cross-module interfaces | TypeScript interfaces |

**DRY Violation Detection Rules (HIGH severity):**

| Violation | Detection Criteria | Shared Location | Action |
|-----------|-------------------|-----------------|--------|
| **Duplicated session helper** | `getSessionAndOrg()` defined inline | `shared/presentation/auth/getSession.ts` | Remove, import from shared |
| **Duplicated form error builder** | `buildServerFormErrorState()` inline | `shared/presentation/library/utils.ts` | Remove, import `buildServerFormErrorState` |
| **Duplicated error normalizer** | `normalizeTanstackErrors()` inline | `shared/presentation/library/utils.ts` | Remove, import from shared |
| **Duplicated class merging** | `cn()` defined locally | `shared/presentation/library/utils.ts` | Remove, import `cn` |
| **Duplicated validation logic** | Same Zod schema shape in 2+ modules | `shared/presentation/schemas/common.ts` | Extract shared schema |
| **Duplicated hook logic** | Similar useState/useEffect pattern | `shared/presentation/hooks/[name].ts` | Extract to custom hook |
| **Duplicated pagination** | Same pagination logic | `shared/application/types/pagination.ts` | Create shared interface |
| **Duplicated API response type** | Same response shape | `shared/application/types/api.ts` | Create shared type |
| **Direct Lucide imports** | `lucide-react` imported in module | `shared/presentation/components/icons.tsx` | Use Icons export instead |
| **Duplicated date formatting** | Same date formatting logic | `shared/presentation/library/utils.ts` | Add to shared utils |
| **Duplicated string utils** | Truncate, capitalize, etc. | `shared/presentation/library/utils.ts` | Add to shared utils |
| **Duplicated fetch wrapper** | API call patterns | `shared/infrastructure/external/` | Create shared service |
| **Infrastructure in modules** | DB setup, auth config, external APIs | `shared/infrastructure/` | Move to appropriate shared location |

**AI Detection Guidelines - Auto-detect for Shared Code:**

**Infrastructure Patterns:**
```typescript
// Flag: Database client setup
const db = new Kysely<DB>({...})  // → shared/infrastructure/persistence/

// Flag: Auth configuration
export const auth = betterAuth({...})  // → shared/infrastructure/auth/

// Flag: External API setup
const resend = new Resend(...)  // → shared/infrastructure/external/

// Flag: Email service
export class EmailService  // → shared/infrastructure/external/email.service.ts
```

**Presentation Patterns:**
```typescript
// Flag: UI primitive component
export function Button({...})  // → shared/presentation/components/ui/button.tsx

// Flag: Layout component
export function AppSidebar({...})  // → shared/presentation/components/layout/

// Flag: Custom hook
export function useHookName() {  // → shared/presentation/hooks/use-hook-name.ts
  const [state, setState] = useState()
  useEffect(() => {...}, [])
  return state
}

// Flag: Utility function
export function helperFn() {  // → shared/presentation/library/utils.ts
  // Pure function logic
}

// Flag: Direct icon import
import { IconName } from "lucide-react"  // → Use Icons from shared instead
```

**Application Patterns:**
```typescript
// Flag: Base repository interface
export interface IRepository<T>  // → shared/application/repositories/

// Flag: Shared DTO
export interface PaginationParams  // → shared/application/types/

// Flag: Cross-module type
export type ApiResponse<T>  // → shared/application/types/ or src/types/
```

**Shared Code Compliance Checklist:**

- [ ] **No inline session helpers** - Must import `getSessionAndOrg` from shared
- [ ] **No inline form utilities** - Must import from `shared/presentation/library/utils`
- [ ] **No direct icon imports** - Must use `Icons` from `shared/presentation/components/icons`
- [ ] **No duplicated UI components** - Must use shadcn/ui from shared
- [ ] **No duplicated hooks** - Check if similar hook exists in `shared/presentation/hooks/`
- [ ] **No duplicated validation** - Check if schema can be shared
- [ ] **No duplicated types** - Check if type belongs in `shared/application/` or `src/types/`
- [ ] **No infrastructure in modules** - DB, auth, external APIs must be in shared
- [ ] **Proper imports** - Use `@/shared/` path alias, not relative paths

### 6. Static Analysis & Best Practice Verification

**MUST** verify these automated checks pass before manual review:

#### A. Type Safety Gates
- [ ] TypeScript strict mode: `bun run typecheck` or `tsc --noEmit`
- [ ] No `any` types (use `unknown` with type guards)
- [ ] No implicit `any` in function parameters
- [ ] Proper null/undefined handling with strictNullChecks

#### B. Linting & Code Quality
- [ ] ESLint passes: `bun run lint`
- [ ] React Hooks rules: No conditional hook calls
- [ ] No unused variables/imports
- [ ] Consistent naming conventions

#### C. Security Best Practices
- [ ] No hardcoded secrets (env vars only)
- [ ] Parameterized queries (no SQL injection)
- [ ] Input validation with Zod on all user inputs
- [ ] XSS prevention (proper escaping, no dangerous HTML)
- [ ] CSRF protection for mutations

#### D. Performance Patterns
- [ ] No N+1 query patterns (check Kysely queries)
- [ ] Proper database indexes for search fields
- [ ] React keys in all list renders
- [ ] No unnecessary useEffect dependencies

#### E. Bug Prevention Patterns
Check for these common bug patterns:

| Bug Pattern | Detection | Prevention |
|-------------|-----------|------------|
| Missing null checks | Nullable DB columns without checks | Add explicit null handling |
| Race conditions | Async state without cleanup | Add AbortController or cleanup |
| Memory leaks | useEffect without cleanup | Add return cleanup function |
| Incorrect dependencies | useEffect/useCallback arrays | Verify all dependencies listed |
| State mutations | Direct array/object modification | Use immutable patterns |
| Missing error boundaries | No try/catch in async | Wrap in error handling |

#### F. Automated Tooling Commands

```bash
# Run these before review
bun run typecheck    # TypeScript compilation
bun run lint         # ESLint checks
bun test             # Unit tests (if applicable)
```

If any check fails, report as **HIGH severity** and require fixes.

### 7. Severity Rules

- **CRITICAL**: 
  - Missing core requirement with no evidence
  - Direct constitution MUST violation (UUID, soft delete, multi-tenancy)
  - Security vulnerability (SQL injection, XSS, auth bypass)
  
- **HIGH**: 
  - Partial core flow implementation
  - Unverified security/privacy requirement
  - Acceptance criterion not satisfiable
  - **DRY violation** (duplicated logic that should be shared)
  - **Pattern inconsistency** with reference module (`products`)
  - **Not using shared utilities** when available
  - TypeScript strict mode violation
  - Automated check failure (lint/typecheck)
  
- **MEDIUM**: 
  - Missing non-functional coverage
  - Notable terminology drift
  - Incomplete edge-case handling
  - Minor architectural boundary concern
  
- **LOW**: 
  - Minor wording/traceability improvements
  - Code style inconsistency
  - Documentation gaps

### 8. Output Report (No File Writes)

Produce a comprehensive markdown report:

## Post-Implementation Spec Review

### Gate Status

- Implementation completion: PASS/FAIL
- Tasks complete: X/Y (Z%)
- Static analysis: PASS/FAIL
- Pattern consistency: PASS/FAIL

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

### Pattern Consistency & DRY Findings

| ID | Pattern Area | Severity | Status | Evidence | Location | Recommendation |
|----|-------------|----------|--------|----------|----------|----------------|

### Cross-Module Comparison

| Pattern | Reference Module | Current Implementation | Consistent? | Notes |
|---------|-----------------|------------------------|-------------|-------|

### DRY Violations & Shared Code Recommendations

| ID | Violation Type | Severity | Location | Current Code | Should Be | Action |
|----|---------------|----------|----------|--------------|-----------|--------|

### Shared Code Inventory

| Resource | Location | Usage Count | Modules Using |
|----------|----------|-------------|---------------|

### Automated Check Results

| Check | Status | Details |
|-------|--------|---------|
| TypeScript (`tsc --noEmit`) | ✅ PASS / ❌ FAIL | Error count: X |
| ESLint (`bun run lint`) | ✅ PASS / ❌ FAIL | Warning count: X |
| Security scan | ✅ PASS / ❌ FAIL | Issues found: X |

### Best Practice Violations

| ID | Practice | Severity | Location | Issue | Recommended Fix |
|----|----------|----------|----------|-------|-----------------|

### Refactoring Action Items

**HIGH Priority (Block Review Approval):**
1. **[DRY-XX]** Description
   - File: `path/to/file.ts`
   - Remove: lines X-Y or specific code
   - Add: specific import or implementation

**MEDIUM Priority (Technical Debt):**
1. **[PC-XX]** Description

**LOW Priority (Future Improvement):**
1. **[BP-XX]** Description

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
- **DRY Enforcement**: Any code that could be shared MUST be flagged; suggest specific shared location and refactoring steps.
- **Pattern Consistency**: Compare against `products` module; deviations require justification or refactoring.
