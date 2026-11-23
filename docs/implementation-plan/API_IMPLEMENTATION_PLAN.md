# TechQuery AI — API Implementation Plan

## Document Overview
This document specifies the RESTful API architecture, HTTP conventions, request/response envelopes, authentication flow, error contract, and comprehensive endpoint catalog for TechQuery AI V1. All endpoints directly implement the specifications defined in `openapi.yaml`.

---

## 1. REST Conventions & Standards

- **Base URL:** `/api/v1`
- **Protocol:** HTTP/1.1 (Local) and HTTPS (Production/Cloud).
- **Format:** `application/json` for all request and response bodies (except file uploads which use `multipart/form-data`).
- **HTTP Methods:**
  - `GET`: Idempotent retrieval of resources. Never modifies server state.
  - `POST`: Creation of resources or execution of AI generation tasks.
  - `PUT`: Complete idempotent replacement of an existing resource.
  - `PATCH`: Partial update of an existing resource.
  - `DELETE`: Idempotent removal of a resource.
- **Resource Naming:** Lowercase, plural nouns for collections (e.g., `/resumes`, `/job-descriptions`, `/questions`).

---

## 2. Global Middleware Pipeline Order

Express executes middleware strictly in sequential order. The pipeline is structured to fail fast at the earliest possible stage:

```
[ Incoming HTTP Request ]
          │
          ▼
1. Helmet (Security Headers: CSP, HSTS, X-Frame-Options)
          │
          ▼
2. CORS (Restricted to FRONTEND_URL, credentials: true)
          │
          ▼
3. Rate Limiter (Sliding window memory/Redis limiter)
          │
          ▼
4. Body Parser (express.json({ limit: "1mb" }))
          │
          ▼
5. Cookie Parser (Extract HttpOnly refresh tokens)
          │
          ▼
6. Request Logger (Pino HTTP with PII redaction)
          │
          ▼
7. Authentication Guard (Extracts Bearer token, sets req.user) [Conditional]
          │
          ▼
8. Tenant Ownership Guard (Verifies resource belongs to req.user.id) [Conditional]
          │
          ▼
9. Input Validator (Zod parse on body/query/params)
          │
          ▼
10. Route Controller Handler (Business logic delegation)
          │
          ▼
11. Centralized Error Handler (AppError mapper & logger)
          │
          ▼
[ Outgoing HTTP Response ]
```

---

## 3. Standard Response Envelopes

Every API response follows a consistent contract to simplify frontend deserialization and error handling.

### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```
*(Note: `meta` is included only on paginated listing endpoints).*

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resume does not exist",
    "details": null
  }
}
```

---

## 4. Complete Endpoint Catalog (V1 Mapping to OpenAPI 3.1)

### 4.1 Authentication & Identity (`/auth`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | No | Register new user account with email & password |
| `POST` | `/api/v1/auth/login` | No | Authenticate user, return access token & set HttpOnly refresh cookie |
| `POST` | `/api/v1/auth/refresh` | No | Rotate refresh token and issue new access token |
| `POST` | `/api/v1/auth/logout` | Yes | Revoke refresh token and clear cookie |
| `GET` | `/api/v1/auth/me` | Yes | Return current authenticated user profile |

### 4.2 Candidate Profile (`/profile`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/profile` | Yes | Retrieve candidate career profile |
| `POST` | `/api/v1/profile` | Yes | Initial onboarding profile submission |
| `PUT` | `/api/v1/profile` | Yes | Update target role, experience, or skill declarations |
| `GET` | `/api/v1/profile/completion-status` | Yes | Check profile completeness percentage |

### 4.3 Resume Management (`/resumes`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/resumes/upload` | Yes | Upload PDF/DOCX file (multipart/form-data, max 5MB) |
| `GET` | `/api/v1/resumes` | Yes | List all resumes uploaded by user (paginated) |
| `GET` | `/api/v1/resumes/:id` | Yes | Retrieve resume metadata and raw extracted text |
| `POST` | `/api/v1/resumes/:id/parse` | Yes | Trigger AI parsing of resume into structured data |
| `GET` | `/api/v1/resumes/:id/parsed-data` | Yes | Retrieve parsed JSON (skills, experience, education) |
| `DELETE` | `/api/v1/resumes/:id` | Yes | Delete resume and cascade-delete associated analyses |

### 4.4 Job Description Management (`/job-descriptions`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/job-descriptions` | Yes | Submit raw JD text; triggers AI extraction of requirements |
| `GET` | `/api/v1/job-descriptions` | Yes | List saved JDs (paginated) |
| `GET` | `/api/v1/job-descriptions/:id` | Yes | Retrieve structured JD details |
| `DELETE` | `/api/v1/job-descriptions/:id` | Yes | Delete a saved JD |

### 4.5 Matching & Gap Analysis (`/analysis`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/analysis/match` | Yes | Execute matching between a resume and a JD |
| `GET` | `/api/v1/analysis` | Yes | List historical analyses (paginated) |
| `GET` | `/api/v1/analysis/:id` | Yes | Retrieve full analysis report (scores, gaps, summary) |

### 4.6 Question Generation & Answering (`/questions`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/questions/generate` | Yes | Generate tailored interview questions from an analysis |
| `GET` | `/api/v1/questions` | Yes | List generated questions with filtering (category, difficulty) |
| `GET` | `/api/v1/questions/:id` | Yes | Retrieve single question details |
| `POST` | `/api/v1/questions/:id/generate-answer` | Yes | Generate AI model answer (supports SSE streaming) |
| `PUT` | `/api/v1/questions/:id/user-notes` | Yes | Save candidate practice notes & custom answer draft |

### 4.7 Collections & PDF Export (`/collections`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/collections` | Yes | Create a new question collection |
| `GET` | `/api/v1/collections` | Yes | List user collections |
| `GET` | `/api/v1/collections/:id` | Yes | Retrieve collection with populated questions |
| `POST` | `/api/v1/collections/:id/items` | Yes | Add a question to collection |
| `DELETE` | `/api/v1/collections/:id/items/:itemId` | Yes | Remove question from collection |
| `DELETE` | `/api/v1/collections/:id` | Yes | Delete entire collection |

### 4.8 Dashboard & Health (`/dashboard`, `/health`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/dashboard/summary` | Yes | Aggregated dashboard stats (analyses, top gaps, readiness) |
| `GET` | `/api/v1/health` | No | Basic server uptime ping |
| `GET` | `/api/v1/health/ready` | No | Readiness check: validates DB connection and AI Gateway status |

---

## 5. Query Parameter & Pagination Standards

All collection endpoints support standard pagination, sorting, and filtering parameters:
- `page`: Positive integer, defaults to `1`.
- `limit`: Positive integer, defaults to `20`, maximum `50`.
- `sort`: Field and direction, format `createdAt:desc` (default).
- `search`: Case-insensitive text filter on title or name fields.
