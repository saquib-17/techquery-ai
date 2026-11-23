# TechQuery AI — Product & Technical Glossary

**Document ID:** TQ-DOC-010  
**Version:** 1.0.0 (Production Rebuild)  
**Status:** Approved for Implementation  
**Author:** Product & Architecture Working Group  

---

## 1. Business & Domain Terminology

- **ATS (Applicant Tracking System):** Enterprise recruitment software (e.g., Greenhouse, Lever, Workday) used by employers to parse, filter, and score candidate resumes before human review.
- **Bar-Raiser:** An interviewer (popularized by Amazon) external to the hiring team whose role is to ensure that a candidate raises the company's overall hiring bar.
- **Candidate Skill Graph:** A normalized, structured data model representing an individual candidate's technical skills, experience depth, verified project competencies, and historical practice scores.
- **DPDPA (Digital Personal Data Protection Act, 2023):** India's comprehensive data privacy legislation regulating the collection, processing, storage, and erasure of digital personal data.
- **Fiduciary (Data Fiduciary):** Under DPDPA, the entity (TechQuery AI) that determines the purpose and means of processing personal data and bears legal responsibility for user privacy.
- **Google X-Y-Z Formula:** The premier resume bullet writing framework: *"Accomplished [X], as measured by [Y], by doing [Z]"*.
- **Job Description Decomposition:** The programmatic extraction and semantic categorization of unstructured job posting text into canonical competencies (Must-Have, Nice-to-Have, Seniority, Domain).
- **Match Index:** An algorithmic preparation metric (expressed as 0–100%) indicating the structural and semantic alignment between a candidate's resume and a target job description.
- **Mock Interview Simulator:** A synchronous or asynchronous conversational environment designed to recreate the pressure, topic progression, and evaluation criteria of real-world interviews.
- **STAR Method:** A structured framework for answering behavioral and situational interview questions: Situation, Task, Action, Result.
- **Weekly Active Preparation Session (WAPS):** The North Star engagement metric tracking unique users who complete meaningful preparation milestones in a 7-day window.

---

## 2. Technical & AI Architecture Terminology

- **AI Gateway:** A centralized, provider-agnostic internal service that manages prompt compilation, structured schema validation, fallback routing, and token telemetry across external LLM vendors.
- **Circuit Breaker:** A software design pattern that automatically detects failures and temporarily routes traffic away from an unhealthy downstream service (e.g., Groq API experiencing 429 errors).
- **Deterministic-AI Hybridization:** The architectural practice of using fast, rule-based algorithms for concrete tasks (e.g., skill overlap, experience calculations) while reserving LLMs for nuanced qualitative reasoning.
- **gVisor / Judge0:** Secure, lightweight container runtime sandboxes designed to execute untrusted user code safely without exposing the host operating system.
- **HttpOnly Cookie:** A secure HTTP response cookie flag that prevents client-side scripts from reading session tokens, mitigating Cross-Site Scripting (XSS) token theft.
- **Inference Latency:** The wall-clock time required for a machine learning model to process an input prompt and generate a complete output stream.
- **Magic Bytes:** The initial bytes of a file used by operating systems and security parsers to determine the true file format regardless of the file extension (e.g., `%PDF` for PDF files).
- **Monaco Editor:** The browser-based code editor powering Visual Studio Code, integrated into TechQuery AI for sandboxed coding practice.
- **Modular Monolith:** A software architecture where all application modules reside within a single codebase and deployment unit, but maintain strictly isolated domain boundaries and internal interfaces.
- **Prompt Injection:** An adversarial attack where malicious user input manipulates an LLM into ignoring system instructions or returning prohibited data.
- **Tokenomics / Token Budget:** The calculation and management of input and output tokens consumed per AI request to maintain healthy unit economic margins.
- **WAL (Write-Ahead Logging):** PostgreSQL's core persistence mechanism ensuring zero data loss during unforeseen database crashes.
- **Zod Schema Validation:** A TypeScript-first schema declaration and validation library used in TechQuery AI to guarantee that all AI outputs strictly conform to typed contracts before touching application logic.
