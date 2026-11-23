# TechQuery AI — SaaS Business Model & Zero-Cost Unit Economics

**Document ID:** TQ-DOC-005  
**Version:** 2.0.0 (Zero-Cost Rebuild)  
**Status:** Approved for Product Discovery  
**Author:** Product & Architecture Working Group  

---

## 1. Project Context & Positioning

TechQuery AI is architected primarily as an **advanced academic showcase and portfolio platform for MCA placements**. While it incorporates real-world SaaS design principles (multi-tenancy, tiered role-based access control, rate limiting, and quota enforcement), **it operates strictly at ₹0 cost**.

No commercial payment gateways (Razorpay, Stripe) or paid recurring billing infrastructure will be integrated. The monetization model is conceptualized to demonstrate commercial understanding to interviewers, while operational execution remains entirely free.

---

## 2. Conceptual Multi-Tiered Product Model

To demonstrate production SaaS architecture to evaluators, the platform maintains two distinct conceptual tiers managed internally via the database schema (`users.tier = 'FREE' | 'PRO'`):

```mermaid
flowchart TD
    subgraph Free Explorer Tier (Default)
        F1[Cost: ₹0 forever]
        F2[3 Resumes Stored]
        F3[5 Question Sets / month]
        F4[1 Mock Interview / month]
        F5[Local Ollama or Groq Free Tier]
    end

    subgraph Pro Ascend Tier (Demo & Showcase)
        P1[Simulated Pro Access - ₹0]
        P2[10 Resumes Stored]
        P3[50 Question Sets / month]
        P4[10 Mock Interviews / month]
        P5[Unlimited Code Runs via In-Browser Pyodide]
        P6[Clean PDF Export without Watermark]
    end

    Free Explorer Tier -->|User clicks 'Activate Pro Demo'| Pro Ascend Tier
```

### Tier Comparison Matrix

| Resource / Capability | Free Tier ("Explorer") | Pro Tier ("Ascend") | Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **Monetary Cost** | **₹0.00** | **₹0.00 (Demonstration)** | Internal DB state; no credit cards |
| **Resumes Stored** | 3 files | 10 files | Enforced via Prisma count query |
| **Saved Job Descriptions** | 5 postings | 50 postings | Enforced via Prisma count query |
| **Question Sets Generated** | 5 sets / month | 50 sets / month | Redis / In-memory atomic counter |
| **Questions per Set** | Up to 15 questions | Up to 25 questions | UI selector bound by user tier |
| **Model Answer Generations** | 20 answers / month | Unlimited | Redis / In-memory counter |
| **Mock Interview Sessions** | 1 session / month | 10 sessions / month | Relational session count query |
| **In-Browser Code Execution** | 30 runs / day | Unlimited runs | Client-side rate limiter (Pyodide) |
| **PDF Export Watermark** | "Generated via TechQuery AI Free" | Clean Branded PDF | Client-side jsPDF conditional banner |
| **Tier Upgrade Flow** | Default on signup | Instant 1-click Demo Upgrade | `PATCH /api/user/tier` mutation |

---

## 3. Zero-Cost Unit Economics & Resource Allocation

By eliminating commercial API and infrastructure costs, TechQuery AI achieves a true **Zero Cost of Goods Sold (COGS = ₹0.00)**:

### 3.1 Inference Cost Breakdown
- **Local Development / Offline Demo Mode:**
  - Inference Provider: **Ollama (`llama3.2:3b` / `qwen2.5-coder:7b`)**
  - Compute: Host CPU / GPU
  - Financial Cost: **₹0.00** (Zero network transmission, zero token charges).
- **Public Cloud Showcase Mode:**
  - Inference Provider: **Groq Cloud Free Tier (`llama-3.1-8b-instant`)**
  - Rate Limits: 30 Requests Per Minute (RPM), 14,400 Requests Per Day (RPD).
  - Financial Cost: **₹0.00**.
  - Fallback Provider: **Google Gemini 1.5 Flash Free Tier** (15 RPM free).
  - Financial Cost: **₹0.00**.

### 3.2 Cloud Infrastructure Cost Breakdown
- **Frontend Hosting:** Vercel Hobby Tier (Permanent Free) ➔ **₹0.00**
- **Backend API Hosting:** Render Free Web Service (Permanent Free) ➔ **₹0.00**
- **Database:** Neon Serverless PostgreSQL / Supabase Free Tier (0.5GB Free) ➔ **₹0.00**
- **Cache & Rate Limiting:** Upstash Redis Free Tier (10k requests/day) + Local In-Memory Fallback ➔ **₹0.00**
- **File Storage:** Cloudflare R2 Free (10GB) / Supabase Storage (1GB) / Local disk ➔ **₹0.00**
- **Code Execution:** Client-Side Pyodide (WebAssembly) in user's browser ➔ **₹0.00**
- **Total Monthly Operational Cost:** **₹0.00**

---

## 4. Abuse Prevention & Quota Safeguards (On Free Tiers)

Because public free cloud services have rate limits (e.g., Groq's 30 RPM or Upstash's 10,000 requests/day), strict architectural guardrails prevent service disruption:

1. **Sliding-Window IP Rate Limiting:** Max 1 question generation every 30 seconds per IP to prevent accidental multi-clicking.
2. **Deterministic Response Caching in PostgreSQL:** Standard interview questions and answers are cached in the relational database. When a duplicate question is requested, it is served directly from PostgreSQL without consuming external LLM quota.
3. **In-Memory Cache Fallback:** If Upstash Redis daily free limits are exhausted, the backend automatically falls back to an in-process LRU cache (`node-cache`), guaranteeing 100% platform availability.
4. **Token Truncation:** Prompts are capped at 2,000 input tokens and 1,200 output tokens to stay well within free-tier burst allowances.

---

## 5. Demonstration of SaaS Competence During Interviews

During placement interviews, the candidate can articulate:
- How multi-tenant RBAC and tier gating are implemented in relational schemas.
- How rate-limiting algorithms (Token Bucket / Sliding Window) protect upstream dependencies.
- How asynchronous queues and deterministic caching optimize infrastructure efficiency.
- Why client-side WebAssembly execution (Pyodide) was selected to eliminate expensive server-side compute infrastructure while enhancing security.
