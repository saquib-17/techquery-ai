# TechQuery AI — Entity Relationships & Domain Data Model

**Document ID:** TQ-ARCH-003  
**Version:** 1.0.0 (System Design Phase)  
**Author:** Principal Database Architect & Systems Engineering Group  
**Status:** Approved for Implementation Planning  

---

## 1. Domain Entity Rationale & Scope

To maintain engineering discipline and prevent schema bloat, only entities strictly required for the approved V1 preparation platform (with clean extension hooks for V2/V3 simulation) are defined.

### 1.1 V1 Core Entities
1. **`User`:** Root identity and authentication anchor.
2. **`UserProfile`:** Candidate background, education level, target roles, and onboarding status.
3. **`RefreshToken`:** Secure session management with rotation and reuse detection.
4. **`Resume`:** Document metadata, raw file storage reference (or DB byte buffer), and parsed structured JSON.
5. **`ResumeAnalysis`:** ATS quality metrics, Google X-Y-Z bullet audits, and formatting health score.
6. **`JobDescription`:** Ingested job posting text and extracted technical competencies.
7. **`JobMatch`:** Hybrid deterministic-AI gap analysis scorecard comparing a specific Resume to a JD.
8. **`Skill`:** Canonical taxonomy dictionary (prevents duplicates like "ReactJS" vs "React.js").
9. **`CandidateSkill`:** Join table linking verified skills to a specific resume with proficiency tags.
10. **`QuestionSet`:** Grouping container for synthesized questions generated from a specific context.
11. **`Question`:** Individual interview question with category, difficulty, interviewer intent, and evaluation points.
12. **`Answer`:** Multi-tiered model answer, code snippets, and time/space complexity analysis.
13. **`SavedCollection`:** User-defined folders for bookmarking and organizing questions.
14. **`CollectionItem`:** Join entity mapping questions into collections.
15. **`UserActivity`:** Granular log of user actions powering the authentic streak and dashboard metrics.
16. **`JobQueue`:** PostgreSQL-backed queue powering reliable asynchronous processing in Cloud Mode.
17. **`AIInferenceLog`:** Telemetry log tracking model performance, latency, token usage, and costs.

---

## 2. Complete Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o| UserProfile : "has profile"
    User ||--o{ RefreshToken : "owns sessions"
    User ||--o{ Resume : "uploads"
    User ||--o{ JobDescription : "saves"
    User ||--o{ QuestionSet : "generates"
    User ||--o{ SavedCollection : "creates"
    User ||--o{ UserActivity : "logs activity"
    User ||--o{ AIInferenceLog : "triggers"

    Resume ||--o| ResumeAnalysis : "evaluated in"
    Resume ||--o{ CandidateSkill : "contains"
    Skill ||--o{ CandidateSkill : "categorizes"

    Resume ||--o{ JobMatch : "matched against"
    JobDescription ||--o{ JobMatch : "matched with"

    QuestionSet ||--o{ Question : "contains"
    Question ||--o| Answer : "has model answer"
    Question ||--o{ CollectionItem : "included in"
    SavedCollection ||--o{ CollectionItem : "organizes"

    User {
        uuid id PK
        string email UK
        string password_hash
        string name
        enum role
        enum tier
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }

    UserProfile {
        uuid id PK
        uuid user_id FK,UK
        string education_level
        string experience_band
        string target_role
        string[] target_companies
        string[] primary_languages
        boolean onboarding_completed
        timestamp updated_at
    }

    RefreshToken {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        string family_id
        boolean is_revoked
        timestamp expires_at
        timestamp created_at
    }

    Resume {
        uuid id PK
        uuid user_id FK
        string original_filename
        string file_url
        bytea file_buffer
        string mime_type
        integer file_size_bytes
        jsonb parsed_json
        enum status
        timestamp created_at
    }

    ResumeAnalysis {
        uuid id PK
        uuid resume_id FK,UK
        integer ats_score
        jsonb strengths
        jsonb issues
        jsonb improvements
        timestamp created_at
    }

    JobDescription {
        uuid id PK
        uuid user_id FK
        string title
        string company
        text raw_text
        jsonb structured_json
        timestamp created_at
    }

    JobMatch {
        uuid id PK
        uuid resume_id FK
        uuid jd_id FK
        integer match_score
        jsonb matched_skills
        jsonb missing_skills
        jsonb analysis_json
        timestamp created_at
    }

    Skill {
        uuid id PK
        string name UK
        string category
    }

    CandidateSkill {
        uuid id PK
        uuid resume_id FK
        uuid skill_id FK
        string proficiency
    }

    QuestionSet {
        uuid id PK
        uuid user_id FK
        uuid resume_id FK
        uuid jd_id FK
        string title
        string topic_focus
        enum difficulty
        timestamp created_at
    }

    Question {
        uuid id PK
        uuid question_set_id FK
        text question_text
        enum category
        enum difficulty
        string targeted_skill
        text interviewer_intent
        jsonb key_evaluation_points
        timestamp created_at
    }

    Answer {
        uuid id PK
        uuid question_id FK,UK
        text short_summary
        text detailed_explanation
        text code_snippet
        string time_complexity
        string space_complexity
        jsonb common_mistakes
        timestamp created_at
    }

    SavedCollection {
        uuid id PK
        uuid user_id FK
        string name
        string description
        timestamp created_at
    }

    CollectionItem {
        uuid id PK
        uuid collection_id FK
        uuid question_id FK
        timestamp added_at
    }

    UserActivity {
        uuid id PK
        uuid user_id FK
        enum activity_type
        date activity_date
        jsonb metadata
        timestamp created_at
    }

    JobQueue {
        uuid id PK
        string queue_name
        string job_type
        jsonb payload
        enum status
        integer attempts
        integer max_attempts
        text error_message
        timestamp run_at
        timestamp locked_at
        string locked_by
        timestamp created_at
    }

    AIInferenceLog {
        uuid id PK
        uuid user_id FK
        string task_type
        string provider
        string model_name
        integer input_tokens
        integer output_tokens
        integer latency_ms
        boolean success
        timestamp created_at
    }
```

---

## 3. Entity Responsibility & Ownership Specifications

### 3.1 Identity & Session Cluster
- **`User` (Root Entity):** Holds core credentials and permissions. Owns all user-generated assets.
- **`UserProfile`:** 1-to-1 relationship with `User`. Stores career preferences and progressive onboarding selections.
- **`RefreshToken`:** 1-to-many relationship with `User`. Implements token family tracking (`family_id`). If an already-consumed refresh token is replayed, the entire family is revoked, protecting against token theft.

### 3.2 Resume & JD Intelligence Cluster
- **`Resume`:** Represents an uploaded document. Supports dual storage modes: `file_url` (path string for local disk or Supabase) and `file_buffer` (optional bytea buffer for zero-external-storage cloud deployments).
- **`ResumeAnalysis`:** 1-to-1 relationship with `Resume`. Holds the compiled ATS scorecard, action verb analysis, and line-by-line Google X-Y-Z rewrite recommendations.
- **`JobDescription`:** Represents an ingested target job spec. Stores raw text and structured extracted skills.
- **`JobMatch`:** Junction entity linking a specific `Resume` to a specific `JobDescription`. Holds the calculated match score (0–100) and categorized missing competencies.

### 3.3 Question Studio & Learning Library Cluster
- **`QuestionSet`:** Groups questions generated in a single batch. Links optionally to the source `Resume` and `JobDescription` used as context.
- **`Question`:** Individual question entity with full schema attributes (intent, key evaluation criteria).
- **`Answer`:** 1-to-1 relationship with `Question`. Stores multi-tiered explanations and complexity metrics permanently in PostgreSQL.
- **`SavedCollection` & `CollectionItem`:** Many-to-many relationship allowing users to bookmark questions into custom revision folders (e.g., "Google SDE-1 Prep") and export to PDF.

### 3.4 Operational & System Cluster
- **`UserActivity`:** Indexed by `(user_id, activity_date)` to compute authentic daily preparation streaks and mastery counts for the Dashboard.
- **`JobQueue`:** PostgreSQL-backed queue table using atomic `FOR UPDATE SKIP LOCKED` row locking to manage asynchronous document parsing and question synthesis in Cloud Mode without requiring paid Redis services.
- **`AIInferenceLog`:** Comprehensive observability log tracking token efficiency, latency, and provider fallback events.
