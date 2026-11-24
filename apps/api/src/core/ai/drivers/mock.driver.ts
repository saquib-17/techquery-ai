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
}
