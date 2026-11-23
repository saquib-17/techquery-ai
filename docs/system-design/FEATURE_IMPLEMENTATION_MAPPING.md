# TechQuery AI — Feature Implementation & Component Mapping

**Document ID:** TQ-MAP-001  
**Version:** 1.0.0 (System Design Phase)  
**Author:** Principal Software Architect & QA Lead  
**Status:** Approved for Implementation Planning  

---

## 1. Feature-to-Architecture Mapping Matrix

This matrix establishes 100% bidirectional traceability between PRD requirements, frontend modules, backend modules, database entities, AI workflows, and testing suites.

| PRD Req ID | Feature Name | Release Phase | Frontend Module | Backend Module | API Endpoints | Database Entities | AI Workflow | Background Job | Testing Suite |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`AUTH-001`** | Production Auth & Session | **V1** | `features/auth/` | `modules/auth/` | `POST /auth/register`<br>`POST /auth/login`<br>`POST /auth/refresh` | `User`<br>`RefreshToken` | None | None | Unit: Supertest auth<br>E2E: Playwright login |
| **`AUTH-002`** | Google OAuth | **V1** | `features/auth/` | `modules/auth/` | `POST /auth/google` | `User` | None | None | Integration: Mock Google token |
| **`ONBD-001`** | Progressive Onboarding | **V1** | `features/onboarding/` | `modules/onboarding/` | `POST /onboarding/profile`<br>`GET /onboarding/profile` | `UserProfile`<br>`User` | None | None | Component: Wizard step state |
| **`RES-001`** | Resume Parser (PDF/DOCX) | **V1** | `features/resumes/` | `modules/resumes/` | `POST /resumes/upload`<br>`GET /resumes`<br>`GET /resumes/:id` | `Resume`<br>`CandidateSkill`<br>`Skill` | `RESUME_PARSE` | `RESUME_PARSE_JOB` | Unit: `pdf-parse` buffer<br>Integration: Zod parse |
| **`RES-002`** | ATS Quality & Audit | **V1** | `features/resumes/` | `modules/resumes/` | `GET /resumes/:id/analysis` | `ResumeAnalysis` | `ATS_AUDIT` | `ATS_AUDIT_JOB` | Snapshot: Google X-Y-Z rules |
| **`JD-001`** | JD Decomposition | **V1** | `features/jd/` | `modules/jd/` | `POST /jd/analyze`<br>`GET /jd/:id` | `JobDescription` | `JD_DECOMPOSE` | None (Sync or Queue) | Unit: Competency extract |
| **`MATCH-001`**| Resume-JD Match & Gap | **V1** | `features/matching/` | `modules/matching/` | `POST /match/analyze`<br>`GET /match/:id` | `JobMatch` | `MATCH_ANALYSIS`| None | Unit: Deterministic overlap |
| **`QGEN-001`** | Question Studio | **V1** | `features/questions/` | `modules/questions/` | `POST /questions/generate`<br>`GET /questions/sets` | `QuestionSet`<br>`Question` | `QGEN` | `QGEN_JOB` | E2E: Full generation loop |
| **`AGEN-001`** | Model Answer Engine | **V1** | `features/questions/` | `modules/answers/` | `POST /answers/generate`<br>`GET /answers/:qId` | `Answer` | `AGEN` | None (Cached) | Unit: Complexity validator |
| **`LIB-001`** | Collections & PDF Export | **V1** | `features/library/` | `modules/library/` | `POST /collections`<br>`GET /collections` | `SavedCollection`<br>`CollectionItem` | None | None | Unit: `jsPDF` render test |
| **`DASH-001`** | Dashboard & Streaks | **V1** | `features/dashboard/` | `modules/dashboard/` | `GET /dashboard/summary`<br>`GET /dashboard/activity` | `UserActivity` | None | None | Unit: Streak calculation SQL |
| **`BILL-001`** | Tier Quotas & Demo Toggle | **V1** | `features/usage/` | `modules/usage/` | `GET /usage/limits`<br>`PATCH /usage/tier` | `User` | None | None | Integration: Quota blocks |
| **`MOCK-001`** | Conversational Mock Mocks | **V2** | `features/mock/` | `modules/mock/` | `POST /mock/sessions`<br>`POST /mock/turns` | `MockInterview`<br>`InterviewTurn` | `MOCK_DIALOGUE` | None (Streaming) | Integration: Session state |
| **`MOCK-002`** | Adaptive Follow-Up Probes | **V2** | `features/mock/` | `modules/mock/` | `POST /mock/turns` | `InterviewTurn` | `ADAPTIVE_PROBE` | None | Unit: Prompt turn memory |
| **`EVAL-001`** | Rubric Scorecard Engine | **V2** | `features/mock/` | `modules/mock/` | `GET /mock/:id/scorecard` | `InterviewEvaluation` | `EVAL_RUBRIC` | `EVAL_JOB` | Unit: Transcript quote check |
| **`CAREER-001`| Milestone Career Roadmap | **V2** | `features/career/` | `modules/career/` | `POST /career/roadmaps` | `PreparationPlan` | `ROADMAP_GEN` | None | Component: Tree node toggle |
| **`CODE-001`** | In-Browser Code Sandbox | **V3** | `features/coding/` | None (Client-Side) | `POST /practice/submit` | `CodingSubmission` | `CODE_HINT` | None (Client Worker)| Browser: Pyodide Web Worker |

---

## 2. Release Phase Scope Boundaries

### 2.1 Release V1 (Foundational Preparation Platform)
- Strictly limited to `AUTH-001`, `AUTH-002`, `ONBD-001`, `RES-001`, `RES-002`, `JD-001`, `MATCH-001`, `QGEN-001`, `AGEN-001`, `LIB-001`, `DASH-001`, and `BILL-001`.
- Delivers a production-quality, bug-free core user journey:
  **Register ➔ Onboard ➔ Upload Resume ➔ Add JD ➔ View Gap Report ➔ Generate Questions ➔ View Model Answers ➔ Save Collection ➔ Download PDF.**

### 2.2 Release V2 (Simulation & Roadmapping)
- Adds `MOCK-001`, `MOCK-002`, `EVAL-001`, and `CAREER-001`.
- Implements real-time text-based conversational interview simulation and multi-dimensional rubric scorecards.

### 2.3 Release V3 (In-Browser Algorithmic Mastery)
- Adds `CODE-001` (In-browser client-side Python execution via Pyodide WebAssembly and JavaScript via Web Worker).
- Adds progressive AI hints and browser-native voice mocks (Web Speech API).
