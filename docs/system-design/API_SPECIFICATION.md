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

## 3. Resume Intelligence Module (`/api/v1/resumes`)

### 3.1 Upload & Parse Resume
- **Method / Route:** `POST /api/v1/resumes/upload`
- **Auth Required:** Yes
- **Content-Type:** `multipart/form-data`
- **Payload:** File binary (`file`), max 5MB. Must be `.pdf` or `.docx`.
- **Response (202 Accepted / 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "resumeId": "b1e2a3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "originalFilename": "jane_doe_sde_resume.pdf",
      "status": "PROCESSING",
      "message": "Resume uploaded successfully. Extraction queued."
    }
  }
  ```

### 3.2 List Resumes
- **Method / Route:** `GET /api/v1/resumes`
- **Auth Required:** Yes
- **Response (200 OK):** Array of candidate resumes with status and ATS scores.

### 3.3 Get Resume ATS Analysis
- **Method / Route:** `GET /api/v1/resumes/:id/analysis`
- **Auth Required:** Yes
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "resumeId": "b1e2a3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "atsScore": 78,
      "strengths": ["Quantified metrics in project bullets", "Clear section headers"],
      "issues": ["Missing GitHub link", "Passive voice detected in work experience"],
      "improvements": [
        {
          "original": "Worked on backend payment system using Node.js.",
          "suggested": "Architected resilient Node.js payment gateway integration processing ₹15L+ monthly volume with zero transaction loss."
        }
      ]
    }
  }
  ```

---

## 4. Job Description Module (`/api/v1/jd`)

### 4.1 Ingest & Decompose Job Description
- **Method / Route:** `POST /api/v1/jd/analyze`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "title": "Backend SDE-1",
    "company": "Swiggy",
    "rawText": "Looking for a Backend SDE-1 with strong experience in Node.js, PostgreSQL, and Redis..."
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "jdId": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
      "title": "Backend SDE-1",
      "company": "Swiggy",
      "structured": {
        "seniority": "JUNIOR_MID",
        "mustHaveSkills": ["Node.js", "PostgreSQL", "Redis"],
        "niceToHaveSkills": ["Docker", "Kubernetes", "gRPC"],
        "responsibilities": ["Build high-throughput REST APIs", "Optimize SQL queries"]
      }
    }
  }
  ```

---

## 5. Resume-JD Matching Module (`/api/v1/match`)

### 5.1 Run Gap Analysis
- **Method / Route:** `POST /api/v1/match/analyze`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "resumeId": "b1e2a3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "jdId": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "matchScore": 72,
      "alignmentCategory": "STRONG_MATCH",
      "matchedSkills": ["Node.js", "PostgreSQL"],
      "missingSkills": [
        { "skill": "Redis", "importance": "HIGH" },
        { "skill": "Docker", "importance": "MEDIUM" }
      ],
      "analysis": {
        "experienceMatch": "Meets 1-2 years criteria",
        "projectRelevance": "High overlap with e-commerce payment project",
        "recommendation": "Brush up on Redis caching and distributed locks before technical round."
      }
    }
  }
  ```

---

## 6. Question Studio Module (`/api/v1/questions`)

### 6.1 Generate Personalized Questions
- **Method / Route:** `POST /api/v1/questions/generate`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "resumeId": "b1e2a3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "jdId": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
    "topicFocus": "Backend & System Design",
    "difficulty": "MEDIUM",
    "count": 15
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "setId": "f7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c",
      "title": "Backend SDE-1 Prep (Swiggy)",
      "total": 15,
      "questions": [
        {
          "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "category": "THEORETICAL",
          "targetedSkill": "PostgreSQL",
          "questionText": "Explain how B-Tree indexing works in PostgreSQL and when a composite index should be preferred over separate single indexes.",
          "interviewerIntent": "Assesses query optimization knowledge and understanding of disk I/O.",
          "keyEvaluationPoints": ["Leftmost prefix rule", "Index scan vs Sequential scan", "Write overhead"]
        }
      ]
    }
  }
  ```

---

## 7. Model Answer Engine (`/api/v1/answers`)

### 7.1 Generate or Fetch Model Answer
- **Method / Route:** `POST /api/v1/answers/generate`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "questionId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "questionId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "shortSummary": "B-Tree indexes maintain a balanced tree of sorted keys allowing O(log N) lookup, insertion, and range queries.",
      "detailedExplanation": "PostgreSQL uses Lehman & Yao B-Tree algorithms to allow concurrent readers and writers without global tree locks...",
      "codeSnippet": "CREATE INDEX idx_user_created ON users(tenant_id, created_at DESC);",
      "timeComplexity": "O(log N)",
      "spaceComplexity": "O(N)",
      "commonMistakes": ["Indexing low-cardinality boolean columns", "Forgetting leftmost column rule in composite indexes"]
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
