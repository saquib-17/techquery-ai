# TechQuery AI

AI-Powered Career Preparation, Technical Interview Preparation & Interview Simulation Platform.

Rebuilding the academic prototype into a production-grade, zero-cost SaaS architecture for MCA placement demonstrations.

---

## 1. Monorepo Structure

```
techquery-ai/
├── apps/
│   ├── web/                    # Modern React SPA (Vite + TypeScript)
│   └── api/                    # Modular Monolith Backend (Node.js + Express + TypeScript)
├── packages/
│   └── shared/                 # Shared domain types, contracts & schemas
├── docs/                       # Comprehensive Architecture & Product Documentation
│   ├── product-discovery/      # 13 PRD and discovery documents
│   ├── product-audit/          # 7 technical feasibility audit reports
│   ├── system-design/          # 17 technical architecture documents
│   └── implementation-plan/    # 14 implementation roadmap & DoD documents
├── infrastructure/             # Docker Compose, environment configs, local service manifests
├── scripts/                    # Development scripts, database seeds, and verification tools
├── backend/                    # [Legacy Prototype] Preserved for reference only
├── frontend/                   # [Legacy Prototype] Preserved for reference only
├── .gitignore                  # Monorepo git ignore rules
├── package.json                # Root monorepo workspace configuration
└── README.md                   # Project overview & documentation
```

---

## 2. Workspaces Overview

- **`apps/api`**: Modular Monolith Node.js/Express backend service. Implements Controller-Service-Repository pattern, provider-independent AI Gateway, and PostgreSQL integration.
- **`apps/web`**: Single Page Application (SPA) built with React, Vite, and TypeScript. Implements feature-sliced architecture and client-side state caching.
- **`packages/shared`**: Shared TypeScript definitions, domain interfaces, and cross-application contracts.
- **`legacy/` (`backend/` & `frontend/`)**: Original bachelor's academic project preserved strictly for reference.

---

## 3. Strict Project Constraints

- **₹0 Budget Policy:** Fully functional development, testing, and deployment without paid APIs, paid databases, or paid hosting.
- **AI Gateway:** Provider-independent gateway supporting local Ollama (`llama3.2:3b`) for development and generous free-tier APIs (Groq) for cloud showcases.
- **Dual Operating Modes:**
  - **Mode A (Local-First):** React + Node.js + Local PostgreSQL + Local Redis + Local Ollama.
  - **Mode B (Cloud Showcase):** Vercel + Render + Neon PostgreSQL (Serverless) + Groq Cloud Free Tier.

---

## 4. Documentation

Detailed technical and architecture documentation is maintained under `docs/`:
- [Product Discovery](file:///f:/techquery-ai-main/docs/product-discovery/PRODUCT_VISION.md)
- [System Architecture](file:///f:/techquery-ai-main/docs/system-design/SYSTEM_ARCHITECTURE.md)
- [Implementation Strategy](file:///f:/techquery-ai-main/docs/implementation-plan/IMPLEMENTATION_STRATEGY.md)
- [Development Phases](file:///f:/techquery-ai-main/docs/implementation-plan/DEVELOPMENT_PHASES.md)
