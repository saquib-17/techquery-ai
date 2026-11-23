# TechQuery AI — Implementation Risks & Mitigation Playbooks

## Document Overview
This document identifies concrete technical risks that may emerge during the implementation of TechQuery AI, their early warning indicators, and actionable fallback playbooks to maintain zero-cost compliance, system stability, and development momentum.

---

## Risk Matrix

| Risk ID | Risk Description | Category | Prob. | Impact | Early Warning Indicator | Fallback / Mitigation Playbook |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **RSK-01** | Host RAM Starvation during local Ollama inference | Infrastructure | High | High | Host OS swapping, Docker container killed by OOM killer, slow response (>30s) | Pin local Ollama model to lightweight `llama3.2:3b` (Q4_K_M quant requires ~2.0 GB RAM). Document RAM allocation rules in README. |
| **RSK-02** | Neon PostgreSQL connection limit exhaustion | Database | Med | High | Prisma throws `Can't reach database server: connection limit exceeded` | Enforce PgBouncer connection pooling string with `connection_limit=5`. Ensure Prisma singleton is reused across requests. |
| **RSK-03** | Free-Tier Groq API rate-limit exhaustion (429) | AI Gateway | Med | Med | HTTP 429 response from Groq API with `retry-after` header | Implement exponential backoff with jitter in `GroqDriver`. Enforce daily user quota tracker in Mode B. Fall back to Gemini 1.5 Flash free tier or Mock. |
| **RSK-04** | LLM Output Schema Drift or Truncation | AI Gateway | High | Med | Zod validation throws `ZodError: missing required field` | Implement 3-tier recovery: regex JSON extraction, single auto-repair re-prompt, and deterministic regex skill fallback scanner. |
| **RSK-05** | Render Free-Tier 50-Second Spin-Up Delay | Cloud Deployment | High | Low | Initial frontend API requests time out with 504 Gateway Timeout | Frontend Axios interceptor detects timeout and displays "Backend waking up (free tier cold start, ~30s)..." with animated spinner. |
| **RSK-06** | Complex PDF Text Extraction Formatting Loss | Ingestion | Med | Low | Multi-column resume yields jumbled, unsegmented text blocks | Sanitize and normalize whitespace; strip non-printable characters. Fallback prompt instructs LLM to reconstruct section semantics from raw tokens. |
| **RSK-07** | Upstash Redis Free-Tier Command Burn | Queue | Med | Med | Daily 10,000 command limit depleted within hours of continuous polling | Eliminate Redis polling in Cloud Mode B. Use PostgreSQL `job_queue` table with `FOR UPDATE SKIP LOCKED` or direct synchronous queue. |

---

## Detailed Mitigation Playbooks

### Playbook 1: Host RAM Starvation (RSK-01)
- **Problem:** Developer's laptop runs out of memory when running Docker containers, Node backend, Vite dev server, and Ollama simultaneously.
- **Immediate Playbook:**
  1. Verify Ollama model: run `ollama list`. If `llama3:8b` or `mistral:7b` is running, run `ollama stop <model>` and pull the lighter model:
     `ollama run llama3.2:3b`
  2. If RAM is still constrained (<1 GB free), switch backend configuration to use `AI_PROVIDER=mock` for unit/integration testing and API development.
  3. Ollama is only required when testing actual semantic generation.

### Playbook 2: Neon Connection Limit Depletion (RSK-02)
- **Problem:** Neon free tier limits simultaneous connections to 20. High concurrency causes connection refusal.
- **Immediate Playbook:**
  1. Verify connection string in `.env.production` includes `-pooler` hostname and `pgbouncer=true`.
  2. Set Prisma connection pool limit explicitly: `?connection_limit=5`.
  3. Ensure no dangling Prisma client instances are created across tests; always call `await prisma.$disconnect()` in test teardown.

### Playbook 3: Groq Rate-Limit & Quota Mitigation (RSK-03)
- **Problem:** Frequent testing or concurrent users exceed Groq's 30 requests/minute free-tier threshold.
- **Immediate Playbook:**
  1. `GroqDriver` catches HTTP 429 and inspects the `retry-after` header. It pauses and retries up to 3 times with exponential backoff.
  2. If quota is completely exhausted for the day, AI Gateway activates secondary free tier: Google Gemini 1.5 Flash (free tier 15 RPM, 1,500 requests/day, no credit card required).
  3. If all external APIs are exhausted, system falls back to cached results and deterministic regex skill scanner.
