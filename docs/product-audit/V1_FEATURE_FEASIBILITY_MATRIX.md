# TechQuery AI — V1 Feature Feasibility Matrix (Zero-Cost Scope)

**Document ID:** TQ-AUDIT-005  
**Audit Date:** 2026-11-21  
**Auditor:** Senior SaaS Solutions Architect & Product Manager  
**Scope:** Rigorous Feature-by-Feature Feasibility Assessment  

---

## 1. Feasibility Classification Legend

- **FEASIBLE:** Fully achievable at ₹0 with standard open-source tools and zero cloud expenses.
- **FEASIBLE WITH LIMITATIONS:** Achievable at ₹0 with documented operational boundaries (e.g. rate limits, memory ceilings).
- **REQUIRES MODIFICATION:** Needs a specific architectural change to prevent cloud free-tier exhaustion or failure.
- **DEFER:** Technically possible, but deferred to V2/V3 to protect V1 velocity and prevent feature overload.
- **NOT FEASIBLE AT ₹0:** Requires commercial paid APIs, paid server compute, or credit cards; must be discarded or replaced.

---

## 2. Feature-by-Feature Feasibility Matrix

| Feature ID & Name | Classification | Current Approach | Zero-Cost Alternative / Workaround | Final Engineering Recommendation |
| :--- | :---: | :--- | :--- | :--- |
| **`AUTH-001` Production Auth** | **FEASIBLE** | bcrypt + JWT + HttpOnly cookies | Fully open-source; 100% free | **Approve for V1.** Implement console link output for Mode A local demos. |
| **`AUTH-002` Google OAuth** | **FEASIBLE WITH LIMITATIONS** | Google Identity Services | Free tier OAuth consent screen | **Approve for V1.** Require local email auth as default; OAuth as secondary. |
| **`ONBD-001` Onboarding Wizard** | **FEASIBLE** | React state wizard + PostgreSQL | Pure relational schema insert | **Approve for V1.** |
| **`RES-001` Resume Parser** | **REQUIRES MODIFICATION** | `pdf-parse` + `mammoth` + S3 storage | Store in local disk (Mode A) or Supabase/DB Bytea (Mode B) | **Approve with modification.** Do not use S3/R2. Reject scanned image PDFs gracefully. |
| **`RES-002` ATS Quality Audit** | **FEASIBLE** | Regex checks + Ollama / Groq | Deterministic + LLM qualitative | **Approve for V1.** |
| **`JD-001` JD Decomposition** | **FEASIBLE** | Zod extraction via Ollama / Groq | Free LLM structured output | **Approve for V1.** |
| **`MATCH-001` Match & Gap Analysis**| **FEASIBLE** | 50% deterministic + 50% LLM | Hybrid algorithm + disclaimers | **Approve for V1.** |
| **`QGEN-001` Question Synthesis** | **FEASIBLE** | Groq Llama-3.1-8B / Ollama 3.2 3B | Free tier inference | **Approve for V1.** Enforce strict Zod schema validation. |
| **`AGEN-001` Model Answers** | **FEASIBLE** | Structured answers cached in DB | PostgreSQL permanent cache | **Approve for V1.** Eliminates duplicate AI costs. |
| **`MOCK-001` Mock Interview Engine**| **FEASIBLE WITH LIMITATIONS** | Text-based conversational chat | Text-only dialogue via Redis/Memory | **Approve for V2.** Keep out of V1 to ensure focus on preparation studio. |
| **`MOCK-002` Adaptive Probing** | **FEASIBLE WITH LIMITATIONS** | Multi-turn context injection | Context buffer capped at 5 turns | **Approve for V2.** |
| **`EVAL-001` Rubric Scorecard** | **FEASIBLE** | Evidence quotation via LLM | Strict rubric scoring prompts | **Approve for V2.** |
| **`CODE-001` Coding Sandbox** | **REQUIRES MODIFICATION** | Proposes multi-language execution | **Python in-browser via Pyodide WebAssembly; JS in Web Worker** | **Approve for V3.** Live execution for Python/JS only; Java/C++ as syntax stubs. |
| **`CAREER-001` Career Roadmaps** | **FEASIBLE** | Milestone tree linked to questions | Relational milestone records | **Approve for V2.** |
| **`DASH-001` Preparation Dashboard**| **FEASIBLE** | Relational SQL aggregation | Real Prisma indexed counts | **Approve for V1.** Zero fabricated metrics. |
| **`LIB-001` Collections & PDF** | **FEASIBLE** | Client-side `jsPDF` generation | Browser memory compilation | **Approve for V1.** Zero server load. |
| **`NOTIF-001` Notifications** | **FEASIBLE WITH LIMITATIONS** | Resend Free (100 emails/day) | Resend Free + In-app notification bell | **Approve for V2.** |
| **`BILL-001` Tier Quota Tracking** | **FEASIBLE** | Redis / DB quota counters | Internal DB tier toggle (`FREE`/`PRO`) | **Approve for V1.** Zero payment dependencies. |
| **`BILL-002` Razorpay Payments** | **NOT FEASIBLE AT ₹0** | Commercial payment gateway | Simulated in-app Pro Demo upgrade | **DISCARD / REJECT.** Violates ₹0 project mandate. |

---

## 3. Summary of V1 Adjustments

1. **Approved for Immediate V1 Implementation:**
   - `AUTH-001`, `AUTH-002`, `ONBD-001`, `RES-001`, `RES-002`, `JD-001`, `MATCH-001`, `QGEN-001`, `AGEN-001`, `LIB-001`, `DASH-001`, `BILL-001`.
2. **Scheduled for V2 (Interactive Simulation):**
   - `MOCK-001`, `MOCK-002`, `EVAL-001`, `CAREER-001`, `NOTIF-001`.
3. **Scheduled for V3 (In-Browser Coding Mastery):**
   - `CODE-001` (Python via Pyodide WebAssembly and JavaScript via Web Worker).
4. **Permanently Discarded:**
   - Commercial payment processors (`BILL-002`), commercial voice APIs, paid OCR services, paid code execution runners.
