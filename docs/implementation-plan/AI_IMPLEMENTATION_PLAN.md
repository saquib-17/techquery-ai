# TechQuery AI — AI Implementation Plan

## Document Overview
This document specifies the architecture, interfaces, provider drivers, prompt registry, output validation, and fallback mechanisms for the **AI Gateway** in TechQuery AI. The platform is engineered to function reliably without paid AI APIs, leveraging local open-source LLMs (Ollama) in development and generous free-tier APIs (Groq) for cloud demonstrations.

---

## 1. AI Gateway Architecture & Driver Abstraction

The AI Gateway decouples all application business logic from specific model providers. The rest of the application interacts exclusively with the `AIGateway` interface.

```
                    ┌────────────────────────┐
                    │  Application Services  │
                    │ (Resume, JD, Questions)│
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │       AI Gateway       │
                    │  - Schema Validation   │
                    │  - Auto-Repair Loop    │
                    │  - Fallback Orchestrator│
                    └───────────┬────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   OllamaDriver   │  │    GroqDriver    │  │    MockDriver    │
│  (Mode A: Local) │  │  (Mode B: Cloud) │  │  (Automated CI)  │
│  - llama3.2:3b   │  │  - llama-3.1-8b  │  │  - Deterministic │
│  - qwen2.5-coder │  │  - Free Tier API │  │  - Zero Latency  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 2. Core Provider Interface

```typescript
// src/core/ai-gateway/types.ts
export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  systemPrompt?: string;
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
}

export interface AIGatewayProvider {
  id: string;
  isHealthy(): Promise<boolean>;
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  completeStream(
    prompt: string,
    options?: CompletionOptions
  ): AsyncIterable<StreamChunk>;
}
```

---

## 3. Concrete Driver Implementations

### 3.1 Local Ollama Driver (`OllamaDriver`)
- **Target URL:** `http://localhost:11434`
- **Default Model:** `llama3.2:3b` (Runs smoothly on standard 8GB RAM laptops via CPU/Metal; zero GPU requirement).
- **Secondary Model:** `qwen2.5-coder:7b` (For systems with 16GB+ RAM or dedicated GPUs, activated via config).
- **Format:** Native JSON mode (`format: "json"`).
- **Zero Cost:** 100% offline, zero network egress.

### 3.2 Cloud Showcase Groq Driver (`GroqDriver`)
- **API Engine:** Groq Cloud Free Tier (`https://api.groq.com/openai/v1`).
- **Target Model:** `llama-3.1-8b-instant`.
- **Free Quota:** 30 requests/minute, 14,400 requests/day, 500,000 tokens/day (more than sufficient for academic and placement presentations).
- **Rate-Limit Handling:** Exponential backoff with jitter on HTTP 429 (`retry-after` header parsed).

### 3.3 Mock Testing Driver (`MockDriver`)
- **Purpose:** Fast, 100% deterministic test execution for Vitest unit and integration suites without requiring Ollama or internet access.
- **Fixture Matching:** Returns canned, schema-valid JSON responses based on prompt keywords (e.g., `"RESUME_PARSER"` returns parsed candidate fixture).

---

## 4. Prompt Registry & Versioning

Prompts are stored as immutable, versioned TypeScript constants in `src/core/ai-gateway/prompts/`.

### 4.1 Resume Parser Prompt (`RESUME_PARSER_V1`)
```
You are an expert technical resume parser. Extract structured career intelligence from the raw resume text provided.
Return ONLY valid JSON matching this schema:
{
  "summary": "string",
  "skills": ["string"],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "highlights": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "graduationYear": "YYYY"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"]
    }
  ]
}

Do not include markdown fences, comments, or extra text. Output raw JSON only.
```

### 4.2 Job Description Intelligence Prompt (`JD_PARSER_V1`)
Extracts role title, seniority, required technical skills, preferred technical skills, and core responsibilities into typed JSON.

### 4.3 Personalized Question Generation Prompt (`QUESTION_GENERATOR_V1`)
Accepts candidate profile + parsed resume + parsed JD + identified skill gaps. Generates 10-15 targeted questions categorized as `TECHNICAL`, `SYSTEM_DESIGN`, or `BEHAVIORAL`.

### 4.4 STAR Framework Answer Guide Prompt (`ANSWER_GENERATOR_V1`)
Generates structured answers. For behavioral questions, strictly adheres to `Situation`, `Task`, `Action`, `Result` components. For technical questions, includes core theory, architectural trade-offs, and practical code snippets.

---

## 5. Output Validation, Auto-Repair & Fallback Pipeline

LLMs may occasionally emit malformed JSON, markdown fences, or omit required fields. The AI Gateway applies a strict 3-tier validation and recovery pipeline:

```
[ Raw LLM Output String ]
            │
            ▼
1. JSON Sanitization Regex (strip ```json fences, clean trailing commas)
            │
            ▼
2. JSON.parse()
            │
       ┌────┴────┐
     Pass       Fail
       │         │
       ▼         ▼
3. Zod Schema   Auto-Repair Turn (Re-prompt LLM with validation error)
   Validation         │
       │         ┌────┴────┐
     Pass      Pass       Fail
       │         │         │
       ▼         ▼         ▼
[ Valid Typed Entity ]   Deterministic Fallback Scanner
                         (Regex Skill Taxonomy Extraction)
```

### Step 1: JSON Sanitization
Extracts the substring between the first `{` and last `}` to eliminate any leading or trailing chatter.

### Step 2 & 3: Zod Validation & Auto-Repair Turn
If Zod parsing fails, the Gateway makes a single synchronous repair call:
> "Your previous output failed validation with this schema error: {error}. Return the corrected JSON matching the exact schema."

### Step 4: Deterministic Fallback Scanner
If the LLM is completely offline, crashing, or fails the repair turn, the system falls back to the **Deterministic Skill Taxonomy Scanner**:
- Scans raw text against the 150+ canonical skills seeded in the database.
- Constructs a baseline structured response so the user can continue their workflow without being blocked by an AI outage.
