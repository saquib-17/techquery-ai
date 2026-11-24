import type { AIGatewayProvider, CompletionOptions, AIProviderId } from "../ai.types.js";

/**
 * Deterministic Mock AI Driver for offline development and 100% reliable CI/Vitest runs.
 * Inspects prompt content to extract real candidate skill tokens and keywords,
 * producing realistic, strictly schema-valid responses without external network access or cost.
 */
export class MockDriver implements AIGatewayProvider {
  public readonly id: AIProviderId = "MOCK";

  public async isHealthy(): Promise<boolean> {
    return true;
  }

  public async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const taskType = options?.taskType;

    if (taskType === "ATS_AUDIT") {
      return this.generateMockAtsAudit(prompt);
    }

    if (taskType === "RESUME_PARSE") {
      return this.generateMockResumeParse(prompt);
    }

    if (taskType === "JD_DECOMPOSE") {
      return this.generateMockJdDecompose(prompt);
    }

    if (taskType === "MATCH_ANALYSIS") {
      return this.generateMockMatchAnalysis(prompt);
    }

    if (taskType === "QGEN") {
      return this.generateMockQuestionSet(prompt);
    }

    if (taskType === "AGEN") {
      return this.generateMockAnswer(prompt);
    }

    // Default generic valid JSON
    return JSON.stringify({
      message: "Mock completion generated",
      taskType: taskType || "UNKNOWN",
      timestamp: new Date().toISOString(),
    });
  }

  private generateMockAtsAudit(prompt: string): string {
    const lower = prompt.toLowerCase();
    const skillsFound: string[] = [];

    const commonSkills = [
      "typescript", "javascript", "node.js", "react", "postgresql", "python",
      "docker", "aws", "git", "rest", "graphql", "sql", "express", "prisma"
    ];

    for (const skill of commonSkills) {
      if (lower.includes(skill)) {
        skillsFound.push(skill);
      }
    }

    if (skillsFound.length === 0) {
      skillsFound.push("Software Engineering", "Full Stack Development");
    }

    const atsScore = Math.min(95, Math.max(65, 70 + skillsFound.length * 3));

    const mockResponse = {
      atsScore,
      sectionScores: {
        contact: 90,
        summary: 75,
        experience: 80,
        skills: 85,
        education: 85,
      },
      strengths: [
        `Strong technical foundation evident in: ${skillsFound.slice(0, 4).join(", ")}.`,
        "Clear professional chronology and readable layout formatting.",
        "Good alignment with modern web architecture and industry best practices.",
      ],
      issues: [
        "Some bullet points lack quantifiable business metrics or performance KPIs.",
        "Summary section could more sharply emphasize target senior roles and specialized domains.",
      ],
      improvements: [
        {
          original: "Worked on backend services and APIs using modern frameworks.",
          suggested: "Architected and delivered 12+ high-throughput REST microservices processing 50k+ daily transactions with 99.9% uptime.",
          reason: "Applies Google X-Y-Z formula (Accomplished [X] as measured by [Y], by doing [Z]).",
        },
        {
          original: "Responsible for database queries and schema updates.",
          suggested: "Optimized complex PostgreSQL queries and indexing strategies, reducing P95 query latency by 42%.",
          reason: "Quantifies performance gains with concrete benchmark metrics.",
        },
      ],
    };

    return JSON.stringify(mockResponse);
  }

  private generateMockResumeParse(prompt: string): string {
    const lower = prompt.toLowerCase();

    const technicalSkills: string[] = [];
    const tools: string[] = ["Git", "Docker", "VS Code", "Postman"];
    const softSkills: string[] = ["Problem Solving", "Team Leadership", "Agile Collaboration"];

    const techCatalog = [
      "TypeScript", "JavaScript", "Node.js", "React", "PostgreSQL", "Python",
      "Express", "Prisma", "Redis", "MongoDB", "Tailwind CSS", "Next.js"
    ];

    for (const tech of techCatalog) {
      if (lower.includes(tech.toLowerCase())) {
        technicalSkills.push(tech);
      }
    }

    if (technicalSkills.length === 0) {
      technicalSkills.push("TypeScript", "Node.js", "PostgreSQL");
    }

    const mockParsed = {
      summary: "Dedicated Software Engineer with proven expertise in building resilient backend systems, RESTful APIs, and scalable web applications.",
      skills: {
        technical: technicalSkills,
        tools,
        soft: softSkills,
      },
      experience: [
        {
          role: "Software Development Engineer",
          company: "TechQuery Solutions",
          duration: "2023 - Present",
          highlights: [
            `Engineered scalable backend services leveraging ${technicalSkills.slice(0, 2).join(" and ")}.`,
            "Implemented end-to-end automated testing suites boosting test coverage to 90%+.",
            "Designed least-privilege relational schemas and database indexing strategies.",
          ],
        },
      ],
      education: [
        {
          degree: "Bachelor of Technology in Computer Science",
          institution: "State University",
          year: "2023",
        },
      ],
      projects: [
        {
          name: "Autonomous Query & Assessment Platform",
          techStack: technicalSkills.slice(0, 3),
          description: "High-performance full-stack web application featuring deterministic AI orchestration and PostgreSQL database.",
        },
      ],
    };

    return JSON.stringify(mockParsed);
  }

  private generateMockJdDecompose(prompt: string): string {
    const jdMatch = prompt.match(/<job_description>([\s\S]*?)<\/job_description>/);
    const textToAnalyze = jdMatch ? jdMatch[1] : prompt;
    const lower = textToAnalyze.toLowerCase();

    // 1. Role identification
    let roleTitle = "Software Development Engineer";
    if (lower.includes("backend")) {
      roleTitle = lower.includes("senior") || lower.includes("sr.") ? "Senior Backend Engineer" : "Backend Engineer";
    } else if (lower.includes("frontend")) {
      roleTitle = lower.includes("senior") || lower.includes("sr.") ? "Senior Frontend Engineer" : "Frontend Engineer";
    } else if (lower.includes("full stack") || lower.includes("fullstack")) {
      roleTitle = "Full Stack Developer";
    } else if (lower.includes("devops") || lower.includes("cloud")) {
      roleTitle = "Cloud / DevOps Engineer";
    } else if (lower.includes("data engineer")) {
      roleTitle = "Data Engineer";
    }

    // 2. Seniority detection
    let seniority: "INTERN" | "ENTRY" | "MID" | "SENIOR" | "LEAD" | "UNKNOWN" = "MID";
    if (/\b(?:intern|internship|trainee)\b/i.test(lower)) {
      seniority = "INTERN";
    } else if (/\b(?:senior|sr\.?)\b/i.test(roleTitle) || (/\b(?:senior|sr\.?)\b/i.test(lower) && !/\b(?:lead|principal|staff)\b/i.test(lower))) {
      seniority = "SENIOR";
    } else if (/\b(?:lead|principal|staff|solutions architect)\b/i.test(lower) || /\b(?:lead|principal|staff)\b/i.test(roleTitle)) {
      seniority = "LEAD";
    } else if (/\b(?:junior|jr\.?|fresher|entry[\s-]?level|graduate)\b/i.test(lower)) {
      seniority = "ENTRY";
    }

    // 3. Experience years extraction
    let minYears = seniority === "INTERN" ? 0 : seniority === "ENTRY" ? 0 : seniority === "SENIOR" ? 5 : seniority === "LEAD" ? 8 : 2;
    let maxYears: number | null = seniority === "INTERN" ? 1 : seniority === "ENTRY" ? 2 : seniority === "SENIOR" ? 8 : seniority === "LEAD" ? null : 5;

    const rangeMatch = lower.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*\+?\s*years?/);
    if (rangeMatch) {
      minYears = parseInt(rangeMatch[1], 10);
      maxYears = parseInt(rangeMatch[2], 10);
    } else {
      const plusMatch = lower.match(/(\d+)\+?\s*years?/);
      if (plusMatch) {
        minYears = parseInt(plusMatch[1], 10);
        maxYears = null;
      }
    }

    // 4. Skills catalog categorization
    const languages: string[] = [];
    const frameworks: string[] = [];
    const databases: string[] = [];
    const cloudAndDevops: string[] = [];
    const toolsAndOther: string[] = [];

    const langDefs = [
      { name: "TypeScript", pattern: /typescript|\bts\b/ },
      { name: "JavaScript", pattern: /javascript|\bjs\b/ },
      { name: "Python", pattern: /python/ },
      { name: "Java", pattern: /\bjava\b/ },
      { name: "Go", pattern: /\bgo\b|\bgolang\b/ },
      { name: "C++", pattern: /c\+\+/ },
      { name: "C#", pattern: /c#/ },
      { name: "Rust", pattern: /rust/ },
      { name: "SQL", pattern: /\bsql\b/ },
    ];
    for (const l of langDefs) {
      if (l.pattern.test(lower)) languages.push(l.name);
    }

    const fwDefs = [
      { name: "Node.js", pattern: /node\.js|\bnode\b/ },
      { name: "React", pattern: /\breact\b/ },
      { name: "Express", pattern: /\bexpress\b/ },
      { name: "Next.js", pattern: /next\.js|\bnextjs\b/ },
      { name: "NestJS", pattern: /nestjs/ },
      { name: "Spring Boot", pattern: /spring boot|springboot/ },
      { name: "Django", pattern: /django/ },
      { name: "FastAPI", pattern: /fastapi/ },
      { name: "Angular", pattern: /angular/ },
      { name: "Vue", pattern: /\bvue\b/ },
    ];
    for (const f of fwDefs) {
      if (f.pattern.test(lower)) frameworks.push(f.name);
    }

    const dbDefs = [
      { name: "PostgreSQL", pattern: /postgresql|postgres/ },
      { name: "MongoDB", pattern: /mongodb|mongo/ },
      { name: "MySQL", pattern: /mysql/ },
      { name: "Redis", pattern: /redis/ },
      { name: "Cassandra", pattern: /cassandra/ },
      { name: "DynamoDB", pattern: /dynamodb/ },
      { name: "Elasticsearch", pattern: /elasticsearch/ },
    ];
    for (const d of dbDefs) {
      if (d.pattern.test(lower)) databases.push(d.name);
    }

    const cloudDefs = [
      { name: "Docker", pattern: /docker/ },
      { name: "Kubernetes", pattern: /kubernetes|k8s/ },
      { name: "AWS", pattern: /\baws\b|amazon web services/ },
      { name: "GCP", pattern: /\bgcp\b|google cloud/ },
      { name: "Azure", pattern: /azure/ },
      { name: "CI/CD", pattern: /ci\/cd|ci-cd|continuous integration/ },
      { name: "GitHub Actions", pattern: /github actions/ },
      { name: "Terraform", pattern: /terraform/ },
    ];
    for (const c of cloudDefs) {
      if (c.pattern.test(lower)) cloudAndDevops.push(c.name);
    }

    const toolsDefs = [
      { name: "Git", pattern: /\bgit\b/ },
      { name: "REST APIs", pattern: /rest api|restful|\brest\b/ },
      { name: "GraphQL", pattern: /graphql/ },
      { name: "Microservices", pattern: /microservices/ },
      { name: "Kafka", pattern: /kafka/ },
      { name: "RabbitMQ", pattern: /rabbitmq/ },
      { name: "Linux", pattern: /linux/ },
      { name: "Agile", pattern: /agile|scrum/ },
    ];
    for (const t of toolsDefs) {
      if (t.pattern.test(lower)) toolsAndOther.push(t.name);
    }

    // Ensure defaults if nothing detected
    if (languages.length === 0) languages.push("TypeScript", "JavaScript");
    if (frameworks.length === 0) frameworks.push("Node.js", "Express");
    if (databases.length === 0) databases.push("PostgreSQL");
    if (cloudAndDevops.length === 0) cloudAndDevops.push("Docker");
    if (toolsAndOther.length === 0) toolsAndOther.push("Git", "REST APIs");

    const allSkills = [
      ...languages,
      ...frameworks,
      ...databases,
      ...cloudAndDevops,
      ...toolsAndOther,
    ];

    // Must-have = primary skills (first half, at least 2)
    const splitIndex = Math.max(2, Math.ceil(allSkills.length * 0.6));
    const mustHaveSkills = allSkills.slice(0, splitIndex);
    const niceToHaveSkills = allSkills.slice(splitIndex);

    const responsibilities = [
      `Design, build, and maintain efficient, reusable, and reliable technical solutions using ${languages.slice(0, 2).join(", ")}.`,
      `Collaborate with cross-functional product and engineering teams to specify, design, and implement new features.`,
      `Ensure optimal performance, quality, and responsiveness of backend applications and data stores.`,
      `Identify bottlenecks and bugs, and devise solutions to these problems following clean architecture best practices.`,
    ];

    const mockResponse = {
      roleTitle,
      seniority,
      experienceYears: {
        min: minYears,
        max: maxYears,
      },
      mustHaveSkills,
      niceToHaveSkills,
      responsibilities,
      techStackCategories: {
        languages,
        frameworks,
        databases,
        cloudAndDevops,
        toolsAndOther,
      },
    };

    return JSON.stringify(mockResponse);
  }

  private generateMockMatchAnalysis(prompt: string): string {
    const lower = prompt.toLowerCase();

    // Check for matched skills in prompt context
    const matchedMatch = prompt.match(/Factual Matched Skills:\s*([^\n]+)/i);
    const missingMatch = prompt.match(/Identified Skill Gaps:\s*([^\n]+)/i);

    const matchedRaw = matchedMatch ? matchedMatch[1].trim() : "";
    const missingRaw = missingMatch ? missingMatch[1].trim() : "";

    const strengths: string[] = [
      matchedRaw && !matchedRaw.includes("None detected")
        ? `Strong technical alignment demonstrated in core stack: ${matchedRaw}.`
        : "Demonstrated solid foundation in core engineering principles and modern software architecture.",
      "Clear professional trajectory with hands-on development and implementation experience.",
      "Good synergy between verified candidate projects and target role responsibilities.",
    ];

    const weaknesses: string[] = [];
    if (missingRaw && !missingRaw.includes("None")) {
      weaknesses.push(`Noticeable skill gaps identified in target requirements: ${missingRaw}.`);
    } else {
      weaknesses.push("Minor lack of explicit metrics detailing business impact and system throughput in past roles.");
    }

    const recommendations: string[] = [
      missingRaw && !missingRaw.includes("None")
        ? `Dedicate focused revision to key missing competencies (${missingRaw}) before technical interviews.`
        : "Review distributed system design patterns and concurrency trade-offs.",
      "Prepare concrete project defense stories applying the STAR methodology (Situation, Task, Action, Result).",
      "Highlight architecture optimization metrics and performance improvements in discussions with hiring managers.",
    ];

    const mockEvaluation = {
      experienceMatch: lower.includes("intern")
        ? "Candidate possesses early-career / foundational experience suitable for entry-level and internship tracks."
        : "Candidate background and tenure align well with the expected complexity and technical ownership of this role.",
      projectRelevance: "Past project portfolio exhibits direct practical relevance to the engineering challenges outlined in the job description.",
      strengths,
      weaknesses,
      recommendations,
    };

    return JSON.stringify(mockEvaluation);
  }

  private generateMockQuestionSet(prompt: string): string {
    // 1. Extract requested count (default to 10)
    const countMatch = prompt.match(/Total Questions Required:\s*Generate exactly\s*(\d+)/i);
    const count = countMatch ? Math.max(1, parseInt(countMatch[1], 10)) : 10;

    // 2. Extract difficulty
    const diffMatch = prompt.match(/Target Difficulty:\s*([A-Z]+)/i);
    const difficulty = (diffMatch && ["EASY", "MEDIUM", "HARD"].includes(diffMatch[1].toUpperCase())
      ? diffMatch[1].toUpperCase()
      : "MEDIUM") as "EASY" | "MEDIUM" | "HARD";

    // 3. Extract allowed categories
    const validCategories = ["THEORETICAL", "CODING", "SYSTEM_DESIGN", "BEHAVIORAL", "PROJECT_DEFENSE"] as const;
    const catMatch = prompt.match(/Allowed Categories:\s*([^\n]+)/i);
    let allowedCategories: Array<typeof validCategories[number]> = [];

    if (catMatch) {
      const rawCats = catMatch[1].split(",").map((c) => c.trim().toUpperCase());
      allowedCategories = validCategories.filter((c) => rawCats.includes(c));
    }
    if (allowedCategories.length === 0) {
      allowedCategories = [...validCategories];
    }

    // 4. Extract topic focus
    const topicMatch = prompt.match(/Topic Focus:\s*([^\n]+)/i);
    const topicFocus = topicMatch ? topicMatch[1].trim() : "Full-Stack Software Engineering";

    // 5. Extract skills from prompt
    const candidateSkills: string[] = [];
    const skillTokens = [
      "typescript", "node.js", "postgresql", "docker", "aws", "react", "redis",
      "graphql", "kubernetes", "python", "golang", "microservices", "sql", "git"
    ];

    const lower = prompt.toLowerCase();
    for (const token of skillTokens) {
      if (lower.includes(token)) {
        // Pretty format token
        candidateSkills.push(
          token === "node.js" ? "Node.js" :
          token === "typescript" ? "TypeScript" :
          token === "postgresql" ? "PostgreSQL" :
          token === "docker" ? "Docker" :
          token === "aws" ? "AWS" :
          token === "react" ? "React" :
          token === "redis" ? "Redis" :
          token === "graphql" ? "GraphQL" :
          token === "kubernetes" ? "Kubernetes" :
          token === "sql" ? "SQL" :
          token.charAt(0).toUpperCase() + token.slice(1)
        );
      }
    }

    if (candidateSkills.length === 0) {
      candidateSkills.push("TypeScript", "Node.js", "PostgreSQL", "System Architecture", "Docker");
    }

    // 6. Generate exact requested count of questions
    const questions: Array<{
      category: string;
      difficulty: string;
      targetedSkill: string;
      questionText: string;
      interviewerIntent: string;
      keyEvaluationPoints: string[];
    }> = [];

    for (let i = 0; i < count; i++) {
      const category = allowedCategories[i % allowedCategories.length];
      const targetedSkill = candidateSkills[i % candidateSkills.length];

      let questionText = "";
      let interviewerIntent = "";

      switch (category) {
        case "THEORETICAL":
          questionText = `Explain the internal mechanics of ${targetedSkill} and discuss how it handles concurrency, memory allocation, and performance optimization in distributed environments.`;
          interviewerIntent = `Assesses candidate's foundational mastery, memory model knowledge, and execution dynamics in ${targetedSkill}.`;
          break;
        case "CODING":
          questionText = `Design and implement an efficient, thread-safe data structure or algorithm leveraging ${targetedSkill} that processes continuous data streams with optimal O(N) time and O(1) space complexity.`;
          interviewerIntent = `Tests algorithmic problem solving, edge-case validation, and idiomatic coding practices using ${targetedSkill}.`;
          break;
        case "SYSTEM_DESIGN":
          questionText = `Architect a fault-tolerant, horizontally scalable system using ${targetedSkill} that handles 50,000 requests/sec with sub-50ms p99 latency, zero single points of failure, and data consistency.`;
          interviewerIntent = `Evaluates high-level system decomposition, partitioning strategies, caching tiers, and failure isolation using ${targetedSkill}.`;
          break;
        case "BEHAVIORAL":
          questionText = `Describe a situation from your past engineering experience where a technical trade-off involving ${targetedSkill} caused disagreements within the team. How did you resolve it and deliver on time?`;
          interviewerIntent = `Assesses conflict resolution, engineering communication, collaborative decision-making, and pragmatic trade-off balancing.`;
          break;
        case "PROJECT_DEFENSE":
          questionText = `In your resume project featuring ${targetedSkill}, what were the most critical performance bottlenecks you diagnosed, and why did you choose that specific architectural approach over alternatives?`;
          interviewerIntent = `Probes candidate's genuine ownership, technical defense under scrutiny, and post-mortem reflection on real-world implementations.`;
          break;
      }

      questions.push({
        category,
        difficulty,
        targetedSkill,
        questionText,
        interviewerIntent,
        keyEvaluationPoints: [
          `Clear architectural and conceptual command of ${targetedSkill}`,
          "Identification of edge-cases, failure modes, and recovery paths",
          "Structured communication and reasoning under technical scrutiny",
        ],
      });
    }

    return JSON.stringify({
      title: `${topicFocus} (${difficulty}) - Interview Practice Set`,
      questions,
    });
  }

  private generateMockAnswer(prompt: string): string {
    const catMatch = prompt.match(/Category:\s*([A-Z_]+)/i);
    const category = catMatch ? catMatch[1].trim().toUpperCase() : "THEORETICAL";

    const skillMatch = prompt.match(/Targeted Skill:\s*([^\n]+)/i);
    const targetedSkill = skillMatch ? skillMatch[1].trim() : "Software Engineering";

    const isBehavioral =
      category === "BEHAVIORAL" || category === "PROJECT_DEFENSE";

    if (isBehavioral) {
      return JSON.stringify({
        shortSummary: `In my previous role, I demonstrated engineering leadership and proactive resolution when navigating architectural bottlenecks around ${targetedSkill}.`,
        detailedExplanation:
          `**Situation**: During a critical production rollout involving ${targetedSkill}, our distributed cluster experienced unexpected latency regressions impacting 15% of inbound checkout workflows.\n\n` +
          `**Task**: As lead developer on the incident response team, my responsibility was to immediately identify the root cause, mitigate the customer-facing slowdown, and implement a resilient long-term architectural solution within 48 hours.\n\n` +
          `**Action**: I analyzed distributed APM traces and database query logs to isolate lock contention on the ${targetedSkill} connection pool. I introduced an asynchronous event-driven queue with dead-letter buffering, implemented circuit breakers, and coordinated pair-debugging sessions with the infrastructure team.\n\n` +
          `**Result**: We restored P99 response times to under 35ms, achieved 100% message delivery guarantee, and successfully handled 2.5x traffic surges during the subsequent promotional event with zero service degradation.`,
        codeSnippet: null,
        timeComplexity: null,
        spaceComplexity: null,
        commonMistakes: [
          "Speaking in broad generalities without articulating individual technical ownership ('We fixed it' instead of 'I analyzed and implemented').",
          "Omitting measurable, quantifiable business results or performance metrics from the outcome.",
          "Failing to discuss post-incident learnings, automated testing, or long-term preventive measures.",
        ],
      });
    }

    // Technical categories: THEORETICAL, CODING, SYSTEM_DESIGN
    const isCoding = category === "CODING";
    const isSystemDesign = category === "SYSTEM_DESIGN";

    const codeSnippet = isCoding
      ? `// Optimized algorithmic solution for ${targetedSkill}\nexport function processBatch<T>(items: T[]): Map<string, T> {\n  const seen = new Map<string, T>();\n  for (let i = 0; i < items.length; i++) {\n    const item = items[i];\n    const key = (item as any)?.id ?? String(i);\n    if (!seen.has(key)) {\n      seen.set(key, item);\n    }\n  }\n  return seen;\n}`
      : `// Idiomatic implementation / architecture query for ${targetedSkill}\nSELECT id, status, updated_at\nFROM transactions\nWHERE tenant_id = $1 AND status = 'COMPLETED'\nORDER BY created_at DESC\nLIMIT 100;`;

    return JSON.stringify({
      shortSummary: `${targetedSkill} balances processing efficiency and memory usage through structured indexing, optimized caching tiers, and controlled concurrency primitives.`,
      detailedExplanation:
        `To address this question thoroughly, we evaluate the architectural design, failure modes, and operational trade-offs of ${targetedSkill}.\n\n` +
        `1. **Core Architectural Mechanism**: ${targetedSkill} manages state and execution by minimizing synchronization bottlenecks. In ${isSystemDesign ? "distributed system architectures" : "computational execution"}, maintaining low latency requires avoiding unindexed lookups and excessive memory allocations.\n\n` +
        `2. **Concurrency & Edge Cases**: Under concurrent load, we safeguard against race conditions and connection exhaustion by employing idempotency tokens, connection pooling, and circuit-breaker patterns.\n\n` +
        `3. **Trade-offs**: While this pattern achieves optimal lookup speeds (${isCoding ? "O(1) average lookup" : "sub-10ms response"}), it requires predictable auxiliary memory (${isCoding ? "O(N) heap space" : "cache storage overhead"}) that must be budgeted against system constraints.`,
      codeSnippet,
      timeComplexity: isCoding ? "O(N)" : "O(log N)",
      spaceComplexity: "O(N)",
      commonMistakes: [
        `Neglecting edge cases such as null/empty inputs or concurrent connection exhaustion in ${targetedSkill}.`,
        "Assuming infinite memory or neglecting garbage collection pressure under continuous high-volume workloads.",
        "Over-engineering a distributed solution when a simple in-memory or single-index pattern is sufficient.",
      ],
    });
  }
}
