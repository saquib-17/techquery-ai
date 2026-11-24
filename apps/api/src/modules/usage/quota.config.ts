export interface QuotaLimit {
  resumes: number;
  jobDescriptions: number;
  questionSetsMonthly: number;
  maxQuestionsPerSet: number;
  answersMonthly: number | null; // null = unlimited
}

export const QUOTA_LIMITS: Record<"FREE" | "PRO", QuotaLimit> = {
  FREE: {
    resumes: 3,
    jobDescriptions: 5,
    questionSetsMonthly: 5,
    maxQuestionsPerSet: 15,
    answersMonthly: 20,
  },
  PRO: {
    resumes: 10,
    jobDescriptions: 50,
    questionSetsMonthly: 50,
    maxQuestionsPerSet: 25,
    answersMonthly: null, // Unlimited for Pro
  },
};
