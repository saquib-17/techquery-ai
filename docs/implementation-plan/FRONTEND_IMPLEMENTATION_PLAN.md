# TechQuery AI — Frontend Implementation Plan

## Document Overview
This document specifies the technical architecture, component organization, state management, API integration, routing, and operational error handling for the TechQuery AI frontend single-page application (SPA).

> [!IMPORTANT]
> **No Visual Design Decisions in this Phase:**
> This document specifies frontend technical architecture, routing, client-side data caching, form orchestration, and interceptors only. Specific UI visual themes, color schemes, component aesthetics, and layouts are explicitly reserved for subsequent user interface design exploration.

---

## 1. Technical Stack & Architecture

- **Core Framework:** React 18 with TypeScript.
- **Build Tooling:** Vite (fast ESM development and optimized production bundling).
- **Routing:** React Router v6 (nested layouts, protected route guards).
- **Server State Management:** TanStack Query v5 (React Query) for caching, background revalidation, and optimistic updates.
- **Client/UI State:** Zustand (lightweight stores for user session, active theme, and toast notifications).
- **Form Management:** React Hook Form with Zod resolver (shares validation schemas directly with backend).
- **HTTP Client:** Axios instance with request/response interceptors for automatic JWT refresh and cold-start detection.
- **Client-Side Document Export:** `@react-pdf/renderer` or `jspdf` for zero-cost, serverless cheat-sheet generation.

---

## 2. Directory Structure (Feature-Sliced Architecture)

The codebase is organized by business domain features rather than arbitrary technical types:

```
frontend/
├── src/
│   ├── app/                   # App-level routing and providers
│   │   ├── router.tsx         # Route definitions and protected wrappers
│   │   └── providers.tsx      # TanStack Query, Theme, Toast providers
│   ├── assets/                # Static images, SVG icons, fonts
│   ├── core/                  # Shared framework & infrastructure
│   │   ├── api/               # Axios client instance, endpoints config
│   │   ├── hooks/             # Generic hooks (useDebounce, useLocalStorage)
│   │   ├── store/             # Global stores (auth.store.ts, ui.store.ts)
│   │   └── utils/             # Formatters, date helpers, storage adapters
│   ├── components/            # Reusable primitive UI components
│   │   ├── feedback/          # Spinner, Alert, Modal, Skeleton, Toast
│   │   ├── forms/             # Input, Select, FileUpload, Checkbox, Textarea
│   │   └── layout/            # Navbar, Sidebar, PageContainer, Breadcrumbs
│   ├── features/              # Self-contained business modules
│   │   ├── auth/              # Login, Register, ForgotPassword forms & hooks
│   │   ├── onboarding/        # Profile setup wizard
│   │   ├── resumes/           # Resume list, file dropzone, parsed data preview
│   │   ├── job-descriptions/  # JD paste form, requirements viewer
│   │   ├── analysis/          # Match score meter, gap breakdown, summary
│   │   ├── questions/         # Question card, filter bar, answer generator
│   │   ├── collections/       # Collection manager, PDF exporter
│   │   └── dashboard/         # Progress cards, recent activity, readiness score
│   ├── types/                 # Shared TypeScript interfaces
│   ├── index.css              # Base resets and utility classes
│   └── main.tsx               # Application mount point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Server State Management (TanStack Query)

To avoid synchronization bugs and excessive network requests, server state is strictly managed via TanStack Query.

### Query Key Conventions
Query keys follow a structured hierarchical array convention:
- `['auth', 'me']`
- `['profile']`
- `['resumes']`
- `['resumes', resumeId]`
- `['job-descriptions']`
- `['job-descriptions', jdId]`
- `['analyses']`
- `['analyses', analysisId]`
- `['questions', { analysisId }]`
- `['collections']`
- `['dashboard', 'summary']`

### Cache Invalidation Rules
Mutations explicitly invalidate affected query keys upon success:
- Creating or deleting a resume invalidates `['resumes']` and `['dashboard', 'summary']`.
- Triggering an analysis invalidates `['analyses']` and `['dashboard', 'summary']`.
- Saving user notes on a question invalidates `['questions', questionId]`.

---

## 4. Axios Client & Token Lifecycle Interceptors

A central Axios instance (`src/core/api/client.ts`) handles credentials and seamless token refresh.

```typescript
// Token Refresh & Queue Logic
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Detect Free-Tier Cloud Cold Start (504 Gateway Timeout or >15s hang)
    if (error.code === "ECONNABORTED" || error.response?.status === 504) {
      useUIStore.getState().showColdStartBanner(true);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await apiClient.post("/auth/refresh");
        const newToken = data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

---

## 5. Protected Route Guards & Navigation Flow

The application routing implements two primary route guard tiers:

1. **GuestGuard (`<PublicRoute />`)**:
   - Protects `/login` and `/register`.
   - If user is already authenticated, redirects immediately to `/dashboard`.
2. **AuthGuard (`<ProtectedRoute />`)**:
   - Protects all application routes (`/dashboard`, `/resumes`, `/analysis`, `/questions`, etc.).
   - If user is unauthenticated, redirects to `/login` with `?redirect=<current_path>`.
3. **OnboardingGuard**:
   - Evaluates `profile.isOnboarded`.
   - If profile is incomplete, intercepts navigation and routes user to `/onboarding`.

---

## 6. Client-Side Document Generation (Zero-Cost PDF)

To ensure ₹0 operational costs, PDF export does not utilize paid serverless rendering services (e.g., Puppeteer, DocRaptor).

- **Implementation:** Curated question collections are rendered into a print-ready DOM structure and compiled client-side using `@react-pdf/renderer` or `jspdf + html2canvas`.
- **Output:** Clean, single-page or multi-page A4 cheat-sheet with candidate header, match summary, categorized interview questions, and STAR answer templates.
- **Zero Server Overhead:** 100% computed on the candidate's browser CPU.
