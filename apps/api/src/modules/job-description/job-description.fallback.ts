import type { ParsedJdData, Seniority } from "./job-description.schemas.js";

/**
 * Deterministic taxonomy fallback for Job Description parsing.
 * Analyzes raw job description text to extract structured intelligence,
 * guaranteeing zero-cost and offline reliability when LLMs are unavailable.
 */
export function deterministicParseJd(title: string, rawText: string): ParsedJdData {
  const combined = `${title}\n${rawText}`;
  const lower = combined.toLowerCase();

  // 1. Role Title derivation
  const cleanTitle = title.trim();
  let roleTitle = cleanTitle.length >= 2 ? cleanTitle : "Software Engineer";
  const titleLower = roleTitle.toLowerCase();

  // 2. Seniority detection (title is primary indicator)
  let seniority: Seniority = "MID";
  if (/\b(?:intern|internship|trainee)\b/i.test(titleLower)) {
    seniority = "INTERN";
  } else if (/\b(?:lead|principal|staff|architect|director|head of)\b/i.test(titleLower)) {
    seniority = "LEAD";
  } else if (/\b(?:senior|sr\.?)\b/i.test(titleLower)) {
    seniority = "SENIOR";
  } else if (/\b(?:junior|jr\.?|fresher|entry|graduate)\b/i.test(titleLower)) {
    seniority = "ENTRY";
  } else {
    // Check body if title did not specify seniority
    if (/\b(?:intern|internship|trainee)\b/i.test(lower)) {
      seniority = "INTERN";
    } else if (/\b(?:fresher|entry[\s-]?level|graduate|junior|jr\.?)\b/i.test(lower)) {
      seniority = "ENTRY";
    } else if (/\b(?:team lead|tech lead|lead developer|lead engineer|principal|staff engineer)\b/i.test(lower)) {
      seniority = "LEAD";
    } else if (/\b(?:senior|sr\.?)\b/i.test(lower)) {
      seniority = "SENIOR";
    }
  }

  // 3. Experience Years Extraction
  let minYears = seniority === "INTERN" ? 0 : seniority === "ENTRY" ? 0 : seniority === "SENIOR" ? 5 : seniority === "LEAD" ? 8 : 2;
  let maxYears: number | null = seniority === "INTERN" ? 1 : seniority === "ENTRY" ? 2 : seniority === "SENIOR" ? 8 : seniority === "LEAD" ? null : 5;

  const rangeMatch = lower.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*\+?\s*years?/i);
  if (rangeMatch) {
    minYears = parseInt(rangeMatch[1], 10);
    maxYears = parseInt(rangeMatch[2], 10);
  } else {
    const plusMatch = lower.match(/(\d+)\+?\s*years?/i);
    if (plusMatch) {
      minYears = parseInt(plusMatch[1], 10);
      maxYears = null;
    }
  }

  // Adjust seniority if years indicate otherwise and seniority wasn't explicitly determined from title
  if ((seniority === "MID" || seniority === "ENTRY") && !/\b(?:senior|lead|intern|junior)\b/i.test(titleLower)) {
    if (minYears >= 8) seniority = "LEAD";
    else if (minYears >= 5) seniority = "SENIOR";
  }

  // 4. Skills Categorization Taxonomy
  const languages: string[] = [];
  const frameworks: string[] = [];
  const databases: string[] = [];
  const cloudAndDevops: string[] = [];
  const toolsAndOther: string[] = [];

  const langCatalog = [
    { name: "TypeScript", regex: /\btypescript\b|\bts\b/i },
    { name: "JavaScript", regex: /\bjavascript\b|\bjs\b/i },
    { name: "Python", regex: /\bpython\b/i },
    { name: "Java", regex: /\bjava\b/i },
    { name: "Go", regex: /\bgo\b|\bgolang\b/i },
    { name: "C++", regex: /\bc\+\+\b/i },
    { name: "C#", regex: /\bc#\b/i },
    { name: "Rust", regex: /\brust\b/i },
    { name: "SQL", regex: /\bsql\b/i },
    { name: "HTML/CSS", regex: /\bhtml5?\b|\bcss3?\b/i },
  ];
  for (const item of langCatalog) {
    if (item.regex.test(lower)) languages.push(item.name);
  }

  const fwCatalog = [
    { name: "Node.js", regex: /\bnode\.?js\b|\bnode\b/i },
    { name: "React", regex: /\breact(?:\.?js)?\b/i },
    { name: "Express", regex: /\bexpress(?:\.?js)?\b/i },
    { name: "Next.js", regex: /\bnext\.?js\b/i },
    { name: "NestJS", regex: /\bnest\.?js\b/i },
    { name: "Spring Boot", regex: /\bspring[\s-]?boot\b/i },
    { name: "Django", regex: /\bdjango\b/i },
    { name: "FastAPI", regex: /\bfastapi\b/i },
    { name: "Angular", regex: /\bangular\b/i },
    { name: "Vue", regex: /\bvue(?:\.?js)?\b/i },
  ];
  for (const item of fwCatalog) {
    if (item.regex.test(lower)) frameworks.push(item.name);
  }

  const dbCatalog = [
    { name: "PostgreSQL", regex: /\bpostgresql\b|\bpostgres\b/i },
    { name: "MySQL", regex: /\bmysql\b/i },
    { name: "MongoDB", regex: /\bmongodb\b|\bmongo\b/i },
    { name: "Redis", regex: /\bredis\b/i },
    { name: "Cassandra", regex: /\bcassandra\b/i },
    { name: "DynamoDB", regex: /\bdynamodb\b/i },
    { name: "Elasticsearch", regex: /\belasticsearch\b/i },
    { name: "Prisma ORM", regex: /\bprisma\b/i },
  ];
  for (const item of dbCatalog) {
    if (item.regex.test(lower)) databases.push(item.name);
  }

  const cloudCatalog = [
    { name: "Docker", regex: /\bdocker\b/i },
    { name: "Kubernetes", regex: /\bkubernetes\b|\bk8s\b/i },
    { name: "AWS", regex: /\baws\b|amazon web services/i },
    { name: "GCP", regex: /\bgcp\b|google cloud/i },
    { name: "Azure", regex: /\bazure\b/i },
    { name: "CI/CD", regex: /\bci[\/-]?cd\b|continuous integration/i },
    { name: "GitHub Actions", regex: /\bgithub actions\b/i },
    { name: "Terraform", regex: /\bterraform\b/i },
  ];
  for (const item of cloudCatalog) {
    if (item.regex.test(lower)) cloudAndDevops.push(item.name);
  }

  const toolsCatalog = [
    { name: "Git", regex: /\bgit\b/i },
    { name: "REST APIs", regex: /\brest(?:ful)?(?:\s*apis?)?\b/i },
    { name: "GraphQL", regex: /\bgraphql\b/i },
    { name: "Microservices", regex: /\bmicroservices\b/i },
    { name: "Kafka", regex: /\bkafka\b/i },
    { name: "RabbitMQ", regex: /\brabbitmq\b/i },
    { name: "Linux", regex: /\blinux\b/i },
    { name: "Agile / Scrum", regex: /\bagile\b|\bscrum\b/i },
  ];
  for (const item of toolsCatalog) {
    if (item.regex.test(lower)) toolsAndOther.push(item.name);
  }

  // Ensure baseline defaults if none detected
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

  // Divide skills into must-have and nice-to-have
  const splitIndex = Math.max(2, Math.ceil(allSkills.length * 0.6));
  const mustHaveSkills = allSkills.slice(0, splitIndex);
  const niceToHaveSkills = allSkills.slice(splitIndex);

  // 5. Responsibilities extraction
  const lines = rawText.split(/\r?\n/).map((l) => l.trim());
  const bulletCandidates: string[] = [];

  for (const line of lines) {
    const isBullet = /^[-*•–—]\s+(.+)/.test(line) || /^\d+\.\s+(.+)/.test(line);
    if (isBullet) {
      const cleanLine = line.replace(/^[-*•–—\d.]+\s*/, "").trim();
      if (cleanLine.length >= 15) {
        bulletCandidates.push(cleanLine);
      }
    }
  }

  const responsibilities =
    bulletCandidates.length >= 1
      ? bulletCandidates.slice(0, 8)
      : [
          `Design, architect, and deliver scalable systems aligned with ${roleTitle} specifications.`,
          `Write high-quality, maintainable code utilizing ${languages.slice(0, 2).join(" and ")}.`,
          `Collaborate with cross-functional engineering and product stakeholders to ship features.`,
          `Participate in code reviews, automated testing, and technical documentation.`,
        ];

  return {
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
}
