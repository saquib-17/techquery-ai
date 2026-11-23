# TechQuery AI — Backend Implementation Plan

## Document Overview
This document specifies the software architecture, design patterns, directory structure, error handling, validation, and operational patterns for the TechQuery AI backend. The backend is designed as a clean **Modular Monolith** in TypeScript on Node.js / Express, structured for zero-cost operation in both local development (Mode A) and free-tier cloud deployment (Mode B).

---

## 1. Architectural Pattern: Modular Monolith

To avoid the operational complexity and network latency of microservices while maintaining strict separation of concerns, the backend is organized into distinct feature modules with a shared core infrastructure.

```
backend/
├── src/
│   ├── core/                  # Shared framework & infrastructure code
│   │   ├── config/            # Typed environment variables (Zod)
│   │   ├── database/          # Prisma client instance & connection pool
│   │   ├── errors/            # AppError hierarchy & centralized handler
│   │   ├── middleware/        # Auth, tenant, rate-limit, validation
│   │   ├── logger/            # Pino structured logging
│   │   ├── queue/             # BullMQ (Local) / DB-queue (Cloud) abstraction
│   │   └── ai-gateway/        # AI provider drivers & prompt engine
│   ├── modules/               # Feature domains (encapsulated)
│   │   ├── auth/              # Registration, login, tokens, password reset
│   │   ├── profile/           # Candidate profile, preferences, skills
│   │   ├── resumes/           # Resume upload, storage, text extraction
│   │   ├── job-descriptions/  # JD paste/upload, classification, skills
│   │   ├── analysis/          # Resume-JD matching & gap calculation
│   │   ├── questions/         # AI question generation, catalog, answers
│   │   ├── collections/       # Question collections, bookmarking, PDF export
│   │   └── dashboard/         # Aggregated candidate metrics & analytics
│   ├── types/                 # Ambient TypeScript definitions
│   ├── app.ts                 # Express application factory & middleware chain
│   └── server.ts              # HTTP server entrypoint & graceful shutdown
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   ├── migrations/            # SQL migration history
│   └── seeds/                 # Taxonomy and test seeders
├── tests/
│   ├── unit/                  # Fast, isolated domain logic tests
│   ├── integration/           # Supertest API tests with real DB
│   └── fixtures/              # Reusable mock payloads & test files
├── Dockerfile                 # Multi-stage production container
├── docker-compose.yml         # Local stack (Postgres, Redis, Ollama mock)
├── package.json
└── tsconfig.json
```

---

## 2. Module Internal Architecture (Controller-Service-Repository)

Every feature module inside `src/modules/<feature>/` strictly adheres to a three-tier layered architecture:

```
src/modules/<feature>/
├── <feature>.controller.ts    # HTTP layer: extracts req params, calls service, returns standard JSON
├── <feature>.service.ts       # Domain business logic & orchestration
├── <feature>.repository.ts    # Database access layer (Prisma calls only)
├── <feature>.schemas.ts       # Zod schemas for input validation & response typing
├── <feature>.routes.ts        # Express router binding paths, middleware, and controllers
└── <feature>.types.ts         # Module-specific domain interfaces and types
```

### Layer Responsibilities & Rules
1. **Controller Layer**:
   - MUST NOT execute SQL queries, Prisma calls, or direct business logic.
   - Responsible only for unpacking HTTP parameters (`req.body`, `req.params`, `req.query`, `req.user`).
   - Delegates work immediately to the Service layer.
   - Envelopes return data in the standard `{ success: true, data: ... }` format.
2. **Service Layer**:
   - Contains 100% of the business logic, rule evaluations, calculations, and orchestration.
   - Interacts with AI Gateway, Queue drivers, and Repositories.
   - Throws semantic domain errors (`NotFoundError`, `ForbiddenError`, `ConflictError`) when invariants fail.
   - Completely agnostic of Express `req` and `res` objects.
3. **Repository Layer**:
   - Encapsulates all Prisma database operations.
   - Enforces tenant isolation in every query (`where: { id, userId }`).
   - Handles transactions (`prisma.$transaction`) for multi-step mutations.
   - Returns typed Prisma entities or null to the Service.

---

## 3. Centralized Error Handling Hierarchy

The backend implements a unified error taxonomy extending a base `AppError`. No unhandled exceptions reach the client as raw stack traces.

### Error Class Structure (`src/core/errors/`)
- `AppError` (abstract, status code, isOperational flag, error code string)
  - `BadRequestError` (400 - Invalid request format or malformed syntax)
  - `ValidationError` (422 - Zod schema validation failures with field errors)
  - `UnauthorizedError` (401 - Missing, invalid, or expired JWT token)
  - `ForbiddenError` (403 - IDOR defense: resource exists but does not belong to user)
  - `NotFoundError` (404 - Resource does not exist)
  - `ConflictError` (409 - Unique constraint violation, e.g., email already registered)
  - `RateLimitExceededError` (429 - User or IP exceeded quota/rate limit)
  - `InternalServerError` (500 - Unexpected runtime fault)
  - `AIGatewayError` (502/503 - Upstream AI provider failure or timeout)

### Global Error Handler Middleware
- Intercepts all rejected promises from asynchronous Express route handlers.
- Logs structured error details via Pino (redacting passwords, tokens, and PII).
- Emits standard JSON error envelopes:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address format"
      }
    ]
  }
}
```

---

## 4. Request Validation Middleware

All endpoints validate their incoming data using **Zod** before reaching the controller.

```typescript
// src/core/middleware/validate.middleware.ts
export const validateRequest = (schemas: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = await schemas.body.parseAsync(req.body);
      if (schemas.query) req.query = await schemas.query.parseAsync(req.query);
      if (schemas.params) req.params = await schemas.params.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError("Input validation failed", error.errors));
      } else {
        next(error);
      }
    }
  };
};
```

---

## 5. Security & Tenant Ownership Middleware

### Tenant Ownership Guard (`enforceOwnership`)
To eliminate Broken Object Level Authorization (BOLA/IDOR), a dedicated middleware enforces user ownership on parameterized routes before business logic executes:

```typescript
// src/core/middleware/tenant.middleware.ts
export const enforceOwnership = (
  modelName: keyof PrismaClient,
  idParamName = "id"
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const resourceId = req.params[idParamName];
    const userId = req.user?.id;

    if (!userId) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const record = await (prisma[modelName] as any).findUnique({
      where: { id: resourceId },
      select: { userId: true },
    });

    if (!record) {
      return next(new NotFoundError("Resource not found"));
    }

    if (record.userId !== userId) {
      // Intentionally return 404 or 403 to prevent enumeration
      return next(new ForbiddenError("Access to this resource is denied"));
    }

    next();
  };
};
```

---

## 6. Structured Logging & Auditing

- **Engine:** `pino` with `pino-http` for request logging.
- **Log Levels:** `debug` (local dev), `info` (normal operations), `warn` (degraded AI fallback, rate limits), `error` (handled application faults), `fatal` (process termination).
- **PII Redaction:** Passwords, refresh tokens, auth headers, and raw resume personal data are automatically scrubbed via Pino redact paths:
  `["req.headers.authorization", "req.headers.cookie", "req.body.password", "req.body.refreshToken"]`.

---

## 7. Dual Operating Mode Support (Mode A vs Mode B)

The backend inspects `APP_MODE` (`local` | `cloud`) at boot:
1. **Mode A (Local-First)**:
   - Queue: BullMQ backed by local Redis.
   - Storage: Local disk `./storage/` mounted volume.
   - AI: `OllamaDriver` targeting `http://localhost:11434`.
2. **Mode B (Cloud Showcase)**:
   - Queue: PostgreSQL-backed `job_queue` table with `FOR UPDATE SKIP LOCKED` (zero Redis dependency).
   - Storage: PostgreSQL `Bytea` binary storage or Supabase Storage Free Tier.
   - AI: `GroqDriver` (Free tier `llama-3.1-8b-instant`) with exponential backoff.
