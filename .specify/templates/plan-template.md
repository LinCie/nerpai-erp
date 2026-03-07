# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Required Verification:**

- [ ] **I. Type Safety**: Strict mode enabled, no `any` types
- [ ] **II. React Discipline**: Hooks rules followed, minimize manual memoization (React Compiler)
- [ ] **III. Next.js Standards**: App Router patterns, Elysia API mounted via catch-all route
- [ ] **IV. A11y & Performance**: Semantic HTML, Core Web Vitals targets
- [ ] **V. Code Quality**: Review process, security practices, better-auth on Elysia
- [ ] **VI. Documentation-First Research**: Context7 verification for all library research (resolve IDs, use specific versions, document references)
- [ ] **VII. Vertical Slice Architecture**: Code organized in `src/modules/[feature]/` with domain, application, infrastructure, presentation layers
- [ ] **VIII. Database Naming, Extensions & Integrity**: DB uses snake_case, app uses camelCase, migrations use `db:migrate:create`, extension changes are idempotent, and critical invariants have DB constraints
- [ ] **UUID v7 Compliance**: All primary keys use UUID v7 auto-generation, never auto-increment integers (VIII)
- [ ] **Soft Delete Enforcement**: All entities have `deleted_at` column, use soft delete methods, no hard deletes without approval (IX)
- [ ] **X. Multi-Tenancy**: organization_id present on all business entities, queries scoped to active org (X)
- [ ] **XI. Contract Fidelity**: API route behaviors match documented success + recoverable error contracts, and completion claims are evidence-backed
- [ ] **XII. Elysia REST API & Eden Treaty**: Route handlers define TypeBox or Zod request/response schemas; Eden Treaty client used for all client-side API calls; no `'use server'` directives or server actions
- [ ] **XIII. TanStack Query**: Client components use `useQuery`/`useMutation` for data fetching; query key factories in `presentation/queries/`; no `useEffect` + `setState` fetch patterns; server data not duplicated into Zustand

**Research Phase Check:**

- [ ] All library versions verified via Context7 (where available)
- [ ] Context7 library IDs documented in research.md
- [ ] Prior knowledge invalidated when Context7 data retrieved
- [ ] Performance/index claims include reproducible evidence (benchmark note or query plan)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
