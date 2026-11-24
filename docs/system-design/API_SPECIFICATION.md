# TechQuery AI — REST API Specification & Contract Guide

**Document ID:** TQ-API-001  
**Version:** 1.0.0 (System Design Phase)  
**Author:** Senior Backend Engineer & API Architect  
**Status:** Approved for Implementation Planning  
**Base URL:** `/api/v1`  
**Protocol:** HTTPS / HTTP 1.1 + JSON  

---

## 1. Global API Conventions

### 1.1 Standard Response Envelope
All API endpoints return a standardized JSON envelope:

```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

// Error Response
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;       // e.g. "VALIDATION_ERROR", "UNAUTHORIZED", "NOT_FOUND"
    message: string;    // Human-readable message
    details?: unknown;  // Zod issue array or field errors
  };
}
```

### 1.2 Authentication Header
All protected endpoints require a Bearer token in the `Authorization` header:
`Authorization: Bearer <access_token>`

---

## 2. Authentication Module (`/api/v1/auth`)

### 2.1 Register User
- **Method / Route:** `POST /api/v1/auth/register`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "candidate@example.com",
    "password": "Password123!",
    "name": "Jane Doe"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "c2d3a9e0-8f1b-4f7d-9a6c-3e2b1a0d4f5e",
        "email": "candidate@example.com",
        "name": "Jane Doe",
        "role": "CANDIDATE",
        "tier": "FREE",
        "isVerified": false,
        "createdAt": "2026-11-23T22:30:00.000Z",
        "updatedAt": "2026-11-23T22:30:00.000Z"
      },
      "message": "Account created successfully. Please verify your email address.",
      "verificationUrl": "http://localhost:5173/verify-email?token=..." // Non-production only
    }
  }
  ```
- **Error Codes:** `400 VALIDATION_ERROR`, `409 EMAIL_ALREADY_EXISTS`.

### 2.2 Verify Email Address
- **Method / Route:** `POST /api/v1/auth/verify-email`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "token": "1f171dc897a79cbd8bda836b08b0ac38b2fe21d1e38a9af30f494aa945d8ec93"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Email address verified successfully",
      "user": {
        "id": "c2d3a9e0-8f1b-4f7d-9a6c-3e2b1a0d4f5e",
        "email": "candidate@example.com",
        "name": "Jane Doe",
        "role": "CANDIDATE",
        "tier": "FREE",
        "isVerified": true,
        "createdAt": "2026-11-23T22:30:00.000Z",
        "updatedAt": "2026-11-23T22:30:00.000Z"
      }
    }
  }
  ```
- **Error Codes:** `400 BAD_REQUEST` (invalid token, expired token, or token already consumed).

### 2.3 Resend Verification Email
- **Method / Route:** `POST /api/v1/auth/resend-verification`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "candidate@example.com"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "If an unverified account with this email exists, a new verification link has been sent."
    }
  }
  ```
- **Error Codes:** `400 BAD_REQUEST` (rate limit exceeded: max 3 requests per 15 minutes).

### 2.4 Login User
- **Method / Route:** `POST /api/v1/auth/login`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "candidate@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "c2d3a9e0-8f1b-4f7d-9a6c-3e2b1a0d4f5e",
        "email": "candidate@example.com",
        "name": "Jane Doe",
        "role": "CANDIDATE",
        "tier": "FREE"
      },
      "accessToken": "eyJhbGciOiJIUzI1Ni..."
    }
  }
  ```
- **Cookie Set:** `refreshToken` (HttpOnly, Secure, SameSite=Strict, 7 days TTL).
- **Error Codes:** `401 INVALID_CREDENTIALS`, `429 TOO_MANY_REQUESTS`.

### 2.3 Refresh Token
- **Method / Route:** `POST /api/v1/auth/refresh`
- **Auth Required:** No (Reads `refreshToken` HttpOnly cookie)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1Ni..."
    }
  }
  ```

### 2.4 Get Current User (`me`)
- **Method / Route:** `GET /api/v1/auth/me`
- **Auth Required:** Yes
- **Response (200 OK):** User and Profile object.

---

## 2.5 Candidate Profile Management (`/api/v1/profile`)

### 2.5.1 Get Profile
- **Method / Route:** `GET /api/v1/profile`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "profile": {
        "id": "c2d3a9e0-8f1b-4f7d-9a6c-3e2b1a0d4f5e",
        "userId": "u1d3a9e0-8f1b-4f7d-9a6c-3e2b1a0d4f5e",
        "headline": "Full Stack Engineer",
        "bio": "Passionate developer",
        "targetRole": "Backend Developer",
        "yearsOfExperience": 3,
        "location": "Bengaluru, India",
        "skills": ["TypeScript", "Node.js", "PostgreSQL"],
        "targetCompanies": ["Google", "Swiggy"],
        "linkedinUrl": "https://linkedin.com/in/example",
        "githubUrl": "https://github.com/example",
        "portfolioUrl": "https://example.com",
        "preferredRoles": ["Backend Engineer", "Full Stack Engineer"],
        "createdAt": "2026-11-24T08:00:00.000Z",
        "updatedAt": "2026-11-24T08:00:00.000Z"
      }
    }
  }
  ```

### 2.5.2 Create Profile
- **Method / Route:** `POST /api/v1/profile`
- **Auth Required:** Yes (Bearer JWT)
- **Response (201 Created):** Created profile object. Returns `409 Conflict` (`PROFILE_ALREADY_EXISTS`) if profile already exists.

### 2.5.3 Update Profile
- **Method / Route:** `PATCH /api/v1/profile`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** Updated profile object. Returns `404 Not Found` (`PROFILE_NOT_FOUND`) if no profile exists.

---

## 2.6 Onboarding Progress Management (`/api/v1/onboarding`)

### 2.6.1 Get Onboarding State
- **Method / Route:** `GET /api/v1/onboarding`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "onboarding": {
        "id": "e2d3a9e0-8f1b-4f7d-9a6c-3e2b1a0d4f5e",
        "userId": "u1d3a9e0-8f1b-4f7d-9a6c-3e2b1a0d4f5e",
        "isCompleted": false,
        "currentStep": 1,
        "stepData": {},
        "completedAt": null,
        "createdAt": "2026-11-24T08:00:00.000Z",
        "updatedAt": "2026-11-24T08:00:00.000Z"
      }
    }
  }
  ```

### 2.6.2 Update Onboarding State
- **Method / Route:** `PATCH /api/v1/onboarding`
- **Auth Required:** Yes (Bearer JWT)
- **Request Body:** Partial update fields (`currentStep`, `stepData`, `isCompleted`).
- **Response (200 OK):** Updated onboarding state.

---

## 3. Resume Management Module (`/api/v1/resumes`)

### 3.1 Upload Resume
- **Method / Route:** `POST /api/v1/resumes`
- **Auth Required:** Yes (Bearer JWT)
- **Content-Type:** `multipart/form-data`
- **Payload:** File field (`file`), max 5MB. Must be `.pdf` or `.docx`. Magic byte header validation enforced.
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "resume": {
        "id": "b1e2a3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "userId": "u1d3a9e0-8f1b-4f7d-9a6c-3e2b1a0d4f5e",
        "originalFileName": "jane_doe_sde_resume.pdf",
        "mimeType": "application/pdf",
        "fileSize": 45000,
        "processingStatus": "COMPLETED",
        "isPrimary": true,
        "hasExtractedText": true,
        "createdAt": "2026-11-24T08:00:00.000Z",
        "updatedAt": "2026-11-24T08:00:00.000Z"
      }
    }
  }
  ```

### 3.2 List Resumes
- **Method / Route:** `GET /api/v1/resumes`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** Array of candidate resumes (public projections; internal physical paths strictly omitted).

### 3.3 Get Resume by ID
- **Method / Route:** `GET /api/v1/resumes/:id`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** Resume metadata and `extractedText`. Enforces ownership (404/403 on IDOR attempts).

### 3.4 Download Resume
- **Method / Route:** `GET /api/v1/resumes/:id/download`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** Binary file stream with `Content-Type` and `Content-Disposition: attachment; filename="<originalFileName>"`.

### 3.5 Set Primary Resume
- **Method / Route:** `PATCH /api/v1/resumes/:id/primary`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** Updated resume set to `isPrimary: true`, atomically demoting prior primary resumes in a transaction.

### 3.6 Delete Resume
- **Method / Route:** `DELETE /api/v1/resumes/:id`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** Deletes database record and physical disk file idempotently. Auto-promotes newest remaining resume if primary was deleted.

### 3.7 Trigger Resume Intelligence Analysis & ATS Audit
- **Method / Route:** `POST /api/v1/resumes/:id/analyze`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "analysis": {
        "id": "b1e2a3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "resumeId": "c2e3a4b5-d6e7-8f9a-0b1c-2d3e4f5a6b7c",
        "atsScore": 84,
        "sectionScores": {
          "contact": 90,
          "summary": 75,
          "experience": 85,
          "skills": 90,
          "education": 80
        },
        "strengths": [
          "Strong technical foundation evident in: TypeScript, Node.js, PostgreSQL.",
          "Clear professional chronology and readable layout formatting."
        ],
        "issues": [
          "Missing public GitHub repository link to showcase code and project defense."
        ],
        "improvements": [
          {
            "original": "Worked on backend services and APIs using modern frameworks.",
            "suggested": "Architected and delivered 12+ high-throughput REST microservices processing 50k+ daily transactions with 99.9% uptime.",
            "reason": "Applies Google X-Y-Z formula (Accomplished [X] as measured by [Y], by doing [Z])."
          }
        ],
        "providerUsed": "MOCK",
        "createdAt": "2026-11-24T18:00:00.000Z"
      },
      "parsedData": {
        "summary": "Dedicated Software Engineer with proven expertise...",
        "skills": {
          "technical": ["TypeScript", "Node.js", "PostgreSQL"],
          "tools": ["Git", "Docker", "VS Code"],
          "soft": ["Problem Solving", "Team Leadership"]
        },
        "experience": [],
        "education": [],
        "projects": []
      }
    }
  }
  ```

### 3.8 Get Resume ATS Analysis
- **Method / Route:** `GET /api/v1/resumes/:id/analysis`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** Stored ATS analysis record. Returns `404 Not Found` (`ANALYSIS_NOT_FOUND`) if resume has not been analyzed yet.

### 3.9 Get Structured Parsed Resume Data
- **Method / Route:** `GET /api/v1/resumes/:id/parsed-data`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** Extracted structured candidate career intelligence graph. Returns `404 Not Found` (`PARSED_DATA_NOT_FOUND`) if resume has not been analyzed yet.

---

## 4. Job Description Module (`/api/v1/job-descriptions`)

### 4.1 Create & Decompose Job Description
- **Method / Route:** `POST /api/v1/job-descriptions`
- **Auth Required:** Yes (Bearer JWT)
- **Request Body:**
  ```json
  {
    "title": "Senior Backend Engineer",
    "company": "TechQuery Innovations",
    "rawText": "Looking for a Senior Backend Engineer with strong experience in Node.js, PostgreSQL, and Redis..."
  }
  ```
- **Validation Rules:**
  - `title`: string, trim, 2-150 chars.
  - `company`: optional string, trim, max 150 chars.
  - `rawText`: string, trim, 100-25,000 chars.
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "jobDescription": {
        "id": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
        "userId": "u1d3a9e0-8f1b-4f7d-9a6c-3e2b1a0d4f5e",
        "title": "Senior Backend Engineer",
        "company": "TechQuery Innovations",
        "rawText": "Looking for a Senior Backend Engineer...",
        "structuredJson": {
          "roleTitle": "Senior Backend Engineer",
          "seniority": "SENIOR",
          "experienceYears": { "min": 5, "max": 8 },
          "mustHaveSkills": ["Node.js", "PostgreSQL", "Redis"],
          "niceToHaveSkills": ["Docker", "Kubernetes", "AWS"],
          "responsibilities": ["Design and implement distributed REST microservices."],
          "techStackCategories": {
            "languages": ["TypeScript", "SQL"],
            "frameworks": ["Node.js", "Express"],
            "databases": ["PostgreSQL", "Redis"],
            "cloudAndDevops": ["Docker", "AWS"],
            "toolsAndOther": ["Git", "REST APIs"]
          }
        },
        "providerUsed": "MOCK",
        "createdAt": "2026-11-24T19:00:00.000Z",
        "updatedAt": "2026-11-24T19:00:00.000Z"
      }
    }
  }
  ```

### 4.2 List User Job Descriptions
- **Method / Route:** `GET /api/v1/job-descriptions`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** Array of user's job descriptions (`id`, `userId`, `title`, `company`, `structuredJson`, `providerUsed`, `createdAt`, `updatedAt`). `rawText` is excluded from the summary listing for wire optimization.

### 4.3 Get Job Description by ID
- **Method / Route:** `GET /api/v1/job-descriptions/:id`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** Full job description record including `rawText` and `structuredJson`.
- **Security:** Strict BOLA/IDOR protection; returns `404 Not Found` if record does not exist or belongs to another candidate.

### 4.4 Re-analyze Job Description
- **Method / Route:** `POST /api/v1/job-descriptions/:id/reanalyze`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** Re-runs AI decomposition on stored `rawText` and returns updated `jobDescription`.
- **Security:** Strict BOLA/IDOR protection; returns `404 Not Found` if record does not exist or belongs to another candidate.

### 4.5 Delete Job Description
- **Method / Route:** `DELETE /api/v1/job-descriptions/:id`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** `{ "success": true, "message": "Job description deleted successfully" }`.
- **Security:** Strict BOLA/IDOR protection; returns `404 Not Found` if record does not exist or belongs to another candidate.

---

## 5. Resume-JD Matching Module (`/api/v1/matches` & `/api/v1/match`)

### 5.1 Evaluate / Upsert Match
- **Method / Route:** `POST /api/v1/matches` (also aliased at `POST /api/v1/match/analyze`)
- **Auth Required:** Yes (Bearer JWT)
- **Request Body:**
  ```json
  {
    "resumeId": "b1e2a3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "jdId": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b"
  }
  ```
- **Validation Rules:**
  - `resumeId`: UUID string, required.
  - `jdId`: UUID string, required.
- **Security:** Strict BOLA/IDOR protection; verifies that both `resumeId` and `jdId` exist and belong to the authenticated user (returns `404 Not Found` if either does not exist or belongs to another user).
- **Upsert Semantics:** If a match report already exists for the given `(resumeId, jdId)` pair, it is cleanly updated with fresh calculations and qualitative evaluation without duplicate key errors.
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "match": {
        "id": "m1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "userId": "u1d3a9e0-8f1b-4f7d-9a6c-3e2b1a0d4f5e",
        "resumeId": "b1e2a3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "jdId": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
        "matchScore": 84,
        "scoreBreakdown": {
          "mustHaveSkillsScore": 100,
          "niceToHaveSkillsScore": 67,
          "experienceScore": 100,
          "domainScore": 75
        },
        "matchedSkills": ["Node.js", "TypeScript", "PostgreSQL", "Docker"],
        "missingSkills": [
          { "skill": "Kubernetes", "importance": "MEDIUM", "category": "General" }
        ],
        "analysisJson": {
          "experienceMatch": "Candidate possesses 6 years of experience, exceeding the 5-year requirement.",
          "projectRelevance": "Demonstrated background in scalable microservices and cloud deployments directly aligns with core responsibilities.",
          "strengths": [
            "100% must-have core skill coverage (Node.js, TypeScript, PostgreSQL, Docker)",
            "Senior-level backend architecture experience"
          ],
          "weaknesses": [
            "Missing hands-on Kubernetes orchestration experience mentioned in nice-to-have requirements"
          ],
          "recommendations": [
            "Highlight container deployment pipelines in AWS ECS to compensate for Kubernetes",
            "Prepare for deep dive discussion on PostgreSQL indexing and query optimization"
          ]
        },
        "providerUsed": "MOCK",
        "createdAt": "2026-11-24T19:40:00.000Z",
        "updatedAt": "2026-11-24T19:40:00.000Z"
      }
    }
  }
  ```

### 5.2 List User Matches
- **Method / Route:** `GET /api/v1/matches`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "matches": [
        {
          "id": "m1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
          "userId": "u1d3a9e0-8f1b-4f7d-9a6c-3e2b1a0d4f5e",
          "resumeId": "b1e2a3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
          "jdId": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
          "matchScore": 84,
          "scoreBreakdown": { ... },
          "matchedSkills": ["Node.js", "TypeScript", "PostgreSQL", "Docker"],
          "missingSkills": [ ... ],
          "analysisJson": { ... },
          "providerUsed": "MOCK",
          "createdAt": "2026-11-24T19:40:00.000Z",
          "updatedAt": "2026-11-24T19:40:00.000Z",
          "resume": {
            "id": "b1e2a3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
            "originalFileName": "jane_doe_sde_resume.pdf",
            "isPrimary": true
          },
          "jobDescription": {
            "id": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
            "title": "Senior Backend Engineer",
            "company": "TechScale Inc."
          }
        }
      ]
    }
  }
  ```

### 5.3 Get Match by ID
- **Method / Route:** `GET /api/v1/matches/:id`
- **Auth Required:** Yes (Bearer JWT)
- **Security:** Strict BOLA/IDOR protection; returns `404 Not Found` if match does not exist or belongs to another user.
- **Response (200 OK):** Full match report including resume and job description metadata summaries.

### 5.4 Delete Match
- **Method / Route:** `DELETE /api/v1/matches/:id`
- **Auth Required:** Yes (Bearer JWT)
- **Security:** Strict BOLA/IDOR protection; returns `404 Not Found` if match does not exist or belongs to another user.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "success": true,
      "message": "Match report deleted successfully"
    }
  }
  ```

---

## 6. Question Studio Module (`/api/v1/questions` & `/api/v1/question-sets`)

### 6.1 Generate Personalized Questions
- **Method / Route:** `POST /api/v1/questions/generate` (aliased at `POST /api/v1/questions` & `POST /api/v1/question-sets`)
- **Auth Required:** Yes (Bearer JWT)
- **Request Body:**
  ```json
  {
    "resumeId": "b1e2a3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "jdId": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
    "matchId": "m1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "title": "Backend SDE-1 Prep (Swiggy)",
    "topicFocus": "Backend & System Design",
    "difficulty": "MEDIUM",
    "categories": ["THEORETICAL", "CODING", "SYSTEM_DESIGN", "BEHAVIORAL", "PROJECT_DEFENSE"],
    "count": 10
  }
  ```
- **Validation Rules:**
  - `resumeId`, `jdId`, `matchId`: optional UUID strings. If provided, user ownership is strictly verified (returns `404 Not Found` if missing or owned by another user).
  - `title`: optional string, min 3, max 200 chars.
  - `topicFocus`: optional string, min 3, max 100 chars (default: `"Full-Stack & Core Software Engineering"`).
  - `difficulty`: enum (`"EASY"` | `"MEDIUM"` | `"HARD"`), default `"MEDIUM"`.
  - `categories`: array of `QuestionCategory`, min 1 item (default: all 5 categories).
  - `count`: integer coerced, min 3, max 20, default 10.
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "questionSet": {
        "id": "f7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c",
        "userId": "u1d3a9e0-8f1b-4f7d-9a6c-3e2b1a0d4f5e",
        "resumeId": "b1e2a3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "jdId": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
        "matchId": "m1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "title": "Backend SDE-1 Prep (Swiggy)",
        "topicFocus": "Backend & System Design",
        "difficulty": "MEDIUM",
        "totalCount": 10,
        "providerUsed": "MOCK",
        "createdAt": "2026-11-24T20:00:00.000Z",
        "updatedAt": "2026-11-24T20:00:00.000Z",
        "questions": [
          {
            "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            "category": "THEORETICAL",
            "difficulty": "MEDIUM",
            "targetedSkill": "PostgreSQL",
            "questionText": "Explain how B-Tree indexing works in PostgreSQL and when a composite index should be preferred over separate single indexes.",
            "interviewerIntent": "Assesses query optimization knowledge and understanding of disk I/O.",
            "keyEvaluationPoints": ["Leftmost prefix rule", "Index scan vs Sequential scan", "Write overhead"]
          }
        ]
      }
    }
  }
  ```

### 6.2 List User Question Sets
- **Method / Route:** `GET /api/v1/questions` (aliased at `GET /api/v1/question-sets`)
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "questionSets": [
        {
          "id": "f7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c",
          "userId": "u1d3a9e0-8f1b-4f7d-9a6c-3e2b1a0d4f5e",
          "title": "Backend SDE-1 Prep (Swiggy)",
          "topicFocus": "Backend & System Design",
          "difficulty": "MEDIUM",
          "totalCount": 10,
          "providerUsed": "MOCK",
          "createdAt": "2026-11-24T20:00:00.000Z"
        }
      ]
    }
  }
  ```

### 6.3 Get Question Set by ID
- **Method / Route:** `GET /api/v1/questions/:id` (aliased at `GET /api/v1/question-sets/:id`)
- **Auth Required:** Yes (Bearer JWT)
- **Security:** Strict BOLA/IDOR protection; returns `404 Not Found` if set does not exist or belongs to another candidate.
- **Response (200 OK):** Full question set including all nested questions.

### 6.4 Delete Question Set
- **Method / Route:** `DELETE /api/v1/questions/:id` (aliased at `DELETE /api/v1/question-sets/:id`)
- **Auth Required:** Yes (Bearer JWT)
- **Security:** Strict BOLA/IDOR protection; returns `404 Not Found` if set does not exist or belongs to another candidate. Cascades deletion to child questions.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "success": true,
      "message": "Question set deleted successfully"
    }
  }
  ```

---

## 7. Model Answer Engine (`/api/v1/answers`)

### 7.1 Generate or Fetch Model Answer
- **Method / Route:** `POST /api/v1/answers/generate` (also aliased at `POST /api/v1/answers`)
- **Auth Required:** Yes (Bearer JWT)
- **Request Body:**
  ```json
  {
    "questionId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "style": "INTERVIEW", // optional: "CONCISE" | "DETAILED" | "INTERVIEW" (default: "INTERVIEW")
    "regenerate": false    // optional: boolean (default: false)
  }
  ```
- **Caching & Upsert Semantics:**
  - If an answer already exists for `questionId` with matching `style` and `regenerate: false`, returns cached answer (`200 OK`).
  - If `regenerate: true` or `style` is changed, re-generates and updates the existing answer record (`200 OK`).
  - If generated for the first time, returns `201 Created`.
- **Security:** Strict BOLA/IDOR protection; verifies that the question belongs to the authenticated user via `question -> questionSet -> userId` (returns `404 Not Found` if not found or owned by another user).
- **Response (201 Created / 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "answer": {
        "id": "e9c1b2a3-f4d5-6e7a-8b9c-0d1e2f3a4b5c",
        "questionId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "shortSummary": "B-Tree indexes maintain a balanced tree of sorted keys allowing O(log N) lookup, insertion, and range queries.",
        "detailedExplanation": "PostgreSQL uses Lehman & Yao B-Tree algorithms to allow concurrent readers and writers without global tree locks...",
        "codeSnippet": "CREATE INDEX idx_user_created ON users(tenant_id, created_at DESC);",
        "timeComplexity": "O(log N)",
        "spaceComplexity": "O(N)",
        "commonMistakes": [
          "Indexing low-cardinality boolean columns",
          "Forgetting leftmost column rule in composite indexes"
        ],
        "style": "INTERVIEW",
        "providerUsed": "MOCK",
        "createdAt": "2026-11-24T21:00:00.000Z",
        "updatedAt": "2026-11-24T21:00:00.000Z"
      }
    }
  }
  ```
- **Behavioral Questions Format:** For `BEHAVIORAL` or `PROJECT_DEFENSE` questions, `detailedExplanation` is structured in 4-part STAR format (`**Situation**`, `**Task**`, `**Action**`, `**Result**`), and `codeSnippet`, `timeComplexity`, and `spaceComplexity` are strictly `null`.

### 7.2 Get Model Answer by Question ID
- **Method / Route:** `GET /api/v1/answers/:questionId`
- **Auth Required:** Yes (Bearer JWT)
- **Security:** Strict BOLA/IDOR protection; returns `404 Not Found` (`ANSWER_NOT_FOUND`) if answer has not yet been generated or if the question belongs to another candidate.
- **Response (200 OK):** Stored `answer` record.

### 7.3 Delete Model Answer
- **Method / Route:** `DELETE /api/v1/answers/:questionId`
- **Auth Required:** Yes (Bearer JWT)
- **Security:** Strict BOLA/IDOR protection; returns `404 Not Found` (`ANSWER_NOT_FOUND`) if answer does not exist or belongs to another candidate.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "success": true,
      "message": "Model answer deleted successfully"
    }
  }
  ```

---

## 8. Dashboard & Usage Management (`/api/v1/dashboard`, `/api/v1/usage`)

### 8.1 Get Dashboard Metrics
- **Method / Route:** `GET /api/v1/dashboard/summary`
- **Auth Required:** Yes
- **Response (200 OK):** Real database stats: questions generated, resumes parsed, active streak days.

### 8.2 Demo Pro Tier Toggle
- **Method / Route:** `PATCH /api/v1/usage/tier`
- **Auth Required:** Yes
- **Request Body:** `{ "tier": "PRO" }`
- **Response (200 OK):** `{ "success": true, "tier": "PRO" }`

---

## 9. Saved Collections & PDF Export (`/api/v1/collections`, `/api/v1/question-sets/:id/export/pdf`)

### 9.1 Create Collection
- **Method / Route:** `POST /api/v1/collections`
- **Auth Required:** Yes (Bearer JWT)
- **Request Body:**
  ```json
  {
    "name": "Stripe Systems Round Prep",
    "description": "High priority distributed systems & concurrency questions"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "userId": "uuid",
      "name": "Stripe Systems Round Prep",
      "description": "High priority distributed systems & concurrency questions",
      "createdAt": "2026-11-24T22:00:00.000Z",
      "updatedAt": "2026-11-24T22:00:00.000Z",
      "items": [],
      "_count": { "items": 0 }
    }
  }
  ```

### 9.2 List Collections
- **Method / Route:** `GET /api/v1/collections`
- **Auth Required:** Yes (Bearer JWT)
- **Security:** Returns only collections owned by authenticated user (`userId`).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "userId": "uuid",
        "name": "Stripe Systems Round Prep",
        "description": "High priority distributed systems & concurrency questions",
        "createdAt": "2026-11-24T22:00:00.000Z",
        "updatedAt": "2026-11-24T22:00:00.000Z",
        "_count": { "items": 5 }
      }
    ]
  }
  ```

### 9.3 Get Collection by ID
- **Method / Route:** `GET /api/v1/collections/:id`
- **Auth Required:** Yes (Bearer JWT)
- **Security:** Strict BOLA/IDOR protection; returns `404 Not Found` (`COLLECTION_NOT_FOUND`) if collection does not exist or belongs to another user.
- **Response (200 OK):** Collection entity with ordered items, questions, and model answers.

### 9.4 Update Collection
- **Method / Route:** `PATCH /api/v1/collections/:id`
- **Auth Required:** Yes (Bearer JWT)
- **Request Body:** `{ "name": "Updated Name", "description": "Updated Description" }`
- **Response (200 OK):** Updated collection entity.

### 9.5 Delete Collection
- **Method / Route:** `DELETE /api/v1/collections/:id`
- **Auth Required:** Yes (Bearer JWT)
- **Security:** Strict BOLA/IDOR protection; cascade deletes collection items.
- **Response (200 OK):** `{ "success": true, "message": "Collection deleted successfully" }`

### 9.6 Add Question to Collection
- **Method / Route:** `POST /api/v1/collections/:id/items`
- **Auth Required:** Yes (Bearer JWT)
- **Security:** Dual-ownership verification (`collection.userId === userId` and `question.questionSet.userId === userId`). Prevents duplicate bookmarking (`409 Conflict` / `ALREADY_IN_COLLECTION`).
- **Request Body:** `{ "questionId": "uuid" }`
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "collectionId": "uuid",
      "questionId": "uuid",
      "addedAt": "2026-11-24T22:00:00.000Z",
      "question": { "id": "uuid", "questionText": "..." }
    }
  }
  ```

### 9.7 Remove Question from Collection
- **Method / Route:** `DELETE /api/v1/collections/:id/items/:questionId`
- **Auth Required:** Yes (Bearer JWT)
- **Security:** Strict BOLA/IDOR protection; returns `404 Not Found` if item or collection does not belong to user.
- **Response (200 OK):** `{ "success": true, "message": "Question removed from collection" }`

### 9.8 Export Collection as PDF
- **Method / Route:** `GET /api/v1/collections/:id/export/pdf`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** Streaming `application/pdf` binary with `Content-Disposition: attachment; filename="<collection_name>.pdf"`.

### 9.9 Export Question Set as PDF
- **Method / Route:** `GET /api/v1/question-sets/:id/export/pdf`
- **Auth Required:** Yes (Bearer JWT)
- **Response (200 OK):** Streaming `application/pdf` binary with `Content-Disposition: attachment; filename="<question_set_title>.pdf"`.
