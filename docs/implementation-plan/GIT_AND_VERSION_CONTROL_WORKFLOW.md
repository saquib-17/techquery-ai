# TechQuery AI — Git & Version Control Workflow

## Document Overview
This document specifies the branching model, commit conventions, pre-commit quality gates, pull request standards, and rollback protocols for TechQuery AI. The workflow enforces disciplined engineering standards suitable for high-tier MCA placement evaluations.

---

## 1. Branching Strategy: Trunk-Based Feature Branching

The project adheres to a clean, linear Git history with short-lived feature branches merging into the primary `main` branch.

```
main ─────────────────●──────────────────────────●───────── (Always Deployable)
                       \                        /
feature/phase-b-auth    ●─────●────────────────●             (Short-lived, <3 days)
```

### Branch Naming Conventions
- **Feature Branches:** `feature/phase-<phase-letter>-<brief-slug>`
  - Example: `feature/phase-a-db-init`
  - Example: `feature/phase-b-auth-jwt`
  - Example: `feature/phase-d-resume-upload`
- **Bug Fix Branches:** `fix/<issue-description>`
  - Example: `fix/token-refresh-race`
- **Documentation Branches:** `docs/<topic-slug>`
  - Example: `docs/system-design-updates`

---

## 2. Conventional Commit Standards

Every commit message MUST follow the **Conventional Commits** specification to enable automated changelog generation and clear auditability:

```
<type>(<scope>): <short imperative summary>

[optional body explaining technical motivation and context]

[optional footer referencing issue or breaking changes]
```

### Allowed Types
- `feat`: A new user-facing or architectural capability.
- `fix`: A bug fix or patch.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `test`: Adding missing tests or correcting existing tests.
- `docs`: Documentation updates only.
- `perf`: Code changes improving computational or query performance.
- `chore`: Build tooling, dependency updates, configuration adjustments.

### Examples
- `feat(auth): implement refresh token rotation with reuse detection`
- `fix(matching): correct floating-point rounding in overall score`
- `test(resumes): add integration tests for corrupted PDF uploads`
- `chore(prisma): add composite index on analyses table`

---

## 3. Pre-Commit Hooks & Quality Guardrails (Husky + Lint-Staged)

To prevent broken code or secrets from ever entering the Git repository, automated hooks execute on `git commit`:

1. **Secret Scanning:** Scans staged files to block accidental commits of `.env`, private keys, or raw credentials.
2. **Type Checking:** Runs `tsc --noEmit` to verify zero TypeScript compile errors.
3. **Linting & Formatting:** Runs ESLint and Prettier across staged files via `lint-staged`.
4. **Commit Linting:** Enforces Conventional Commit syntax via `@commitlint/cli`.

---

## 4. Pull Request (PR) Quality Checklist

Before merging any feature branch into `main`, the PR must satisfy the following checklist:

- [ ] **Tests Pass:** 100% of unit and integration tests succeed in local and CI environments.
- [ ] **Zero TypeScript Errors:** Strict typechecking passes without `@ts-ignore` hacks.
- [ ] **Tenant Isolation Enforced:** Any new database queries include user ownership filtering.
- [ ] **Schema Migrations Included:** If models were updated, a clean Prisma migration SQL file is committed.
- [ ] **No Secret Leaks:** No API keys, passwords, or test tokens hardcoded in source.
- [ ] **Zero Cost Preserved:** No paid external dependencies or services introduced.

---

## 5. Rollback Protocols

In the event of a breaking regression on `main`:

1. **Code Revert:**
   - Execute clean Git revert: `git revert -m 1 <commit-hash>`.
   - Never force-push (`git push --force`) to `main`.
2. **Database Migration Rollback:**
   - If a migration caused failures, write a forward-fixing migration rather than manually dropping tables.
   - For severe local development issues, run `npx prisma migrate reset` (in local development only).
