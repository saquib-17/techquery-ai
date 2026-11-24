# Phase I Completion Report: Saved Collections & PDF Export Engine (Backend Only)

**Status:** Completed  
**Completed Date:** 2026-11-24  
**Workspace:** `F:\techquery-ai-main`  
**Execution Context:** Backend Only (`apps/api`)  

---

## 1. Executive Summary

Phase I delivered an enterprise-grade, ₹0-cost bookmarking and PDF export architecture for candidate interview preparation:
1. **Saved Collections Engine**: Users can curate custom question sets and preparation folders (`saved_collections` and `collection_items`), bookmark questions, manage collections with full CRUD endpoints, and prevent duplicate bookmarks via database unique constraints.
2. **Pure Node.js Streaming PDF Export**: Leveraging `pdfkit`, interview prep sheets and question collections are converted into styled, branded PDF documents directly piped to the Express HTTP response stream without spinning up heavy headless browsers (Puppeteer/Chromium) or consuming paid document generation APIs.
3. **Cross-Entity BOLA/IDOR Defense**: Collection operations, question bookmarking, and PDF streaming enforce strict cross-entity user ownership checks (`collection.userId === userId` and `question.questionSet.userId === userId`), completely neutralizing IDOR attacks.

---

## 2. Architecture & Design Implementation

### 2.1 Database Schema & Migrations
- **Table `saved_collections`**:
  - `id`: UUID (Primary Key, default `gen_random_uuid()`)
  - `user_id`: UUID (Foreign Key ➔ `users(id)` ON DELETE CASCADE)
  - `name`: VARCHAR(150) NOT NULL
  - `description`: VARCHAR(255) NULL
  - `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
  - `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
  - Index: `idx_saved_collections_user_created ON saved_collections(user_id, created_at DESC)`
- **Table `collection_items`**:
  - `id`: UUID (Primary Key, default `gen_random_uuid()`)
  - `collection_id`: UUID (Foreign Key ➔ `saved_collections(id)` ON DELETE CASCADE)
  - `question_id`: UUID (Foreign Key ➔ `questions(id)` ON DELETE CASCADE)
  - `added_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
  - Constraint: `UNIQUE(collection_id, question_id)` preventing duplicate items
  - Index: `idx_collection_items_collection_id`, `idx_collection_items_question_id`
- **Migration**: `apps/api/prisma/migrations/20261124215500_phase_i_collections/migration.sql` deployed cleanly to both `techquery_dev` and `techquery_test` environments under `techquery_migrator` credentials with grants to `techquery_runtime`.

### 2.2 Streaming PDF Generator Service (`PdfGeneratorService`)
- Implemented in `apps/api/src/core/export/pdf-generator.service.ts`:
  - **Zero Browser Footprint**: Pure vector layout using `pdfkit`.
  - **Design System Alignment**: Dark Slate brand palette (`#0F172A`, `#3B82F6`, `#64748B`, `#F8FAFC`).
  - **Dynamic Elements**: Document header, metadata bar, question categorization chips, difficulty indicators, interviewer intent callouts, evaluation bullet points, STAR/complexity breakdowns, and code snippet boxes.
  - **Multi-page & Footers**: Two-pass page numbering (`Page X of Y`) and confidentiality notices using `doc.bufferedPageRange()`.
  - **Dual Operational Modes**:
    - `streamToResponse(input, res, filename)`: Pipes PDF stream directly to Express HTTP response with sanitized `Content-Disposition`.
    - `generateBuffer(input)`: Generates binary buffer with complete `%PDF-` specification and document metadata for testing or offline rendering.

### 2.3 Layered Application Flow
- **Schemas (`collection.schemas.ts`)**: Zod schemas for input validation: `CreateCollectionSchema`, `UpdateCollectionSchema`, `AddCollectionItemSchema`, `CollectionIdParamSchema`, `CollectionItemParamSchema`.
- **Repository (`collection.repository.ts`)**: Clean Prisma abstraction for collection CRUD, cross-table ownership validation (`findOwnedQuestion`), and junction item management.
- **Service (`collection.service.ts`)**: Business logic, duplicate bookmark checking (`ALREADY_IN_COLLECTION`), BOLA/IDOR isolation, and export data normalization.
- **Controller (`collection.controller.ts`) & Routes (`collection.routes.ts`)**: Express route handlers registered at `/api/v1/collections`.
- **Question Set PDF Export**: Integrated `GET /api/v1/question-sets/:id/export/pdf` in `question.service.ts`, `question.controller.ts`, and `question.routes.ts`.

---

## 3. API Endpoints Delivered

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/collections` | Create a new saved collection | Bearer JWT |
| `GET` | `/api/v1/collections` | List user's collections with item counts | Bearer JWT |
| `GET` | `/api/v1/collections/:id` | Get collection details with questions & answers | Bearer JWT |
| `PATCH` | `/api/v1/collections/:id` | Update collection name/description | Bearer JWT |
| `DELETE` | `/api/v1/collections/:id` | Delete collection (cascade removes items) | Bearer JWT |
| `POST` | `/api/v1/collections/:id/items` | Bookmark question into collection (unique) | Bearer JWT |
| `DELETE` | `/api/v1/collections/:id/items/:questionId` | Remove question from collection | Bearer JWT |
| `GET` | `/api/v1/collections/:id/export/pdf` | Stream collection questions as PDF | Bearer JWT |
| `GET` | `/api/v1/question-sets/:id/export/pdf` | Stream question set questions as PDF | Bearer JWT |

---

## 4. Verification & Testing

### 4.1 Unit & Integration Test Suites
- `apps/api/tests/unit/pdf-generator.test.ts`:
  - 4 tests verifying binary PDF generation, `%PDF-` header, Latin-1 document metadata embedding, multi-item layout handling, and singleton export.
- `apps/api/tests/integration/collections-export.test.ts`:
  - 13 comprehensive tests covering:
    - Collection creation, listing, updating, deletion, and cascading.
    - Duplicate bookmark rejection (`409 Conflict` / `ALREADY_IN_COLLECTION`).
    - Adding and removing questions from collections.
    - BOLA/IDOR isolation: User A cannot read, update, delete, or export User B's collections.
    - Cross-ownership enforcement: User A cannot bookmark a question generated for User B's question set.
    - PDF export streaming for both Collections and Question Sets with valid `application/pdf` Content-Type and `Content-Disposition`.
    - Unauthenticated request rejection.

---

## 5. Constraint Compliance Check

| Constraint | Status | Notes |
| :--- | :--- | :--- |
| **₹0 Cost Rule** | Pass | Built with `pdfkit`; zero paid document generation APIs, zero headless browsers. |
| **No Redis / BullMQ** | Pass | Streaming PDF generation directly into Express response without background queues. |
| **Architecture Hierarchy** | Pass | Strict Controller -> Service -> Repository pattern with Zod & AppError. |
| **BOLA / IDOR Defense** | Pass | Both collection ownership and question-questionSet ownership validated on every write and read. |
| **Legacy Protection** | Pass | Zero modifications to `backend/` or `frontend/`. |
| **Git Hygiene** | Pass | Zero Git commits created. |
