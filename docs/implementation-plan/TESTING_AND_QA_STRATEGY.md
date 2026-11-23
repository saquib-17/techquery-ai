# TechQuery AI — Testing & QA Strategy

## Document Overview
This document specifies the testing pyramid, quality gates, test environment configuration, test data fixtures, security verification, and automated regression strategy for TechQuery AI. Testing is designed to be **100% zero-cost**, running locally and via standard GitHub Actions without paid test infrastructure.

---

## 1. Testing Pyramid & Target Coverage

```
        / \
       /   \        Playwright E2E Tests (15% coverage)
      / E2E \       - Full user journeys from signup to PDF export
     /───────\      
    /         \     API Integration Tests (35% coverage)
   / Integrat. \    - Supertest + Real PostgreSQL + Auth tokens
  /─────────────\   - Tenant isolation & BOLA verification
 /               \  
/   Unit Tests    \ Unit Tests (50% coverage)
─────────────────── - Pure domain logic, scoring math, Zod schemas, AI drivers
```

### Coverage Minimums
- **Core Domain Logic (Matching Engine, Scoring):** 90%+ branch coverage.
- **Security & Authorization Middleware:** 100% path coverage.
- **API Endpoints:** 80%+ endpoint coverage.
- **Frontend State & Parsers:** 75%+ component/hook coverage.

---

## 2. Test Tooling Stack

| Layer | Tool | Rationale | Cost |
| :--- | :--- | :--- | :---: |
| **Unit Testing** | Vitest | Extremely fast, native TypeScript & ESM support, Jest-compatible API | ₹0 |
| **API Integration** | Supertest + Vitest | Tests Express endpoints against real local database | ₹0 |
| **E2E Testing** | Playwright | Headless Chromium/Firefox testing of React SPA workflows | ₹0 |
| **AI Mocking** | Internal `MockDriver` | Deterministic responses without API rate limits or latency | ₹0 |
| **CI Automation** | GitHub Actions | Free 2,000 CI minutes/month for public/open-source repos | ₹0 |

---

## 3. Test Suites & Verification Focus Areas

### 3.1 Authentication & Token Lifecycle Tests (`tests/integration/auth.test.ts`)
- Registration rejects duplicate emails with HTTP 409.
- Passwords verified with Argon2id; plain passwords never saved.
- Access token expires in 15 minutes; expired tokens rejected with 401.
- Refresh token rotation (RTR): using an old refresh token invalidates all tokens for that user session (reuse detection).
- Logout revokes refresh token and clears HttpOnly cookie.

### 3.2 Tenant Isolation & IDOR Verification (`tests/integration/tenant-isolation.test.ts`)
- User B attempting `GET /api/v1/resumes/:userA_resume_id` receives HTTP 403 Forbidden.
- User B attempting `POST /api/v1/analysis/match` with User A's JD ID receives HTTP 403.
- User B cannot delete or update questions in User A's collection.

### 3.3 Resume & Document Ingestion Tests (`tests/unit/resumes/extractor.test.ts`)
- Valid 2-page PDF extracts clean raw text string.
- Corrupted binary file rejected with 400 Bad Request.
- File > 5MB rejected with 413 Payload Too Large.
- Non-PDF/DOCX magic bytes rejected regardless of file extension.

### 3.4 Deterministic Matching Engine Tests (`tests/unit/analysis/matcher.test.ts`)
- 100% skill overlap yields score >= 90%.
- 0% skill overlap yields score <= 20%.
- Mathematical determinism: running match 100 times on identical inputs yields identical scores.
- Missing skills correctly segmented into `Critical` (from required) and `Secondary` (from preferred).

### 3.5 AI Gateway Resilience Tests (`tests/unit/ai-gateway/gateway.test.ts`)
- Mock driver returns valid typed JSON for all prompt types.
- Auto-repair turn successfully triggers when initial JSON is slightly malformed.
- Deterministic regex fallback executes cleanly when provider throws 503 error.

---

## 4. Playwright End-to-End User Journey Tests

Playwright automates real browser sessions against the local development harness:

1. **Journey 1: User Onboarding Flow**
   - User signs up -> redirected to `/onboarding`.
   - Selects target role ("Backend Engineer"), experience ("1-3 Years"), declared skills.
   - Submits onboarding -> redirected to `/dashboard`.
2. **Journey 2: Resume Ingestion & Analysis Flow**
   - User uploads `sample_resume.pdf`.
   - Pastes sample Backend Developer Job Description.
   - Clicks "Run Matching & Analysis".
   - Verifies match score meter renders, missing skills appear, and executive summary displays.
3. **Journey 3: Question Practice & PDF Export Flow**
   - User navigates to generated questions.
   - Expands behavioral question and reviews STAR model answer.
   - Adds 3 questions to new collection "Backend Review".
   - Clicks "Export PDF" -> verifies PDF blob downloads with correct filename.

---

## 5. Zero-Cost CI/CD Pipeline (GitHub Actions)

A single GitHub Actions workflow (`.github/workflows/ci.yml`) validates all pull requests:

```yaml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: techquery_test
        ports:
          - 5432:5432
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Type Check & Lint
        run: |
          npm run typecheck
          npm run lint

      - name: Database Migrations
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/techquery_test
        run: npx prisma migrate deploy

      - name: Run Unit & Integration Tests
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/techquery_test
          AI_PROVIDER: mock
          JWT_SECRET: test_jwt_secret_must_be_32_characters_long
        run: npm run test:coverage
```
