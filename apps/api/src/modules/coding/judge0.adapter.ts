import type {
  ExecutionVerdict,
  ProblemTestCase,
  SupportedCodeLanguage,
} from "@techquery/shared";
import { config } from "../../core/config/index.js";
import { AppError } from "../../core/errors/AppError.js";
import { buildBatchCode, parseBatchStdout, type BatchCaseResult } from "./batchHarness.js";
import { translateJudge0ServiceError } from "./errorTranslator.js";

export const JUDGE0_LANGUAGE_IDS: Record<SupportedCodeLanguage, number> = {
  java: 62,
  python: 71,
  cpp: 54,
  javascript: 63,
};

interface Judge0SubmissionResponse {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time?: string | null;
  memory?: number | null;
  status?: {
    id: number;
    description?: string;
  };
}

export interface Judge0BatchOutcome {
  verdict: ExecutionVerdict;
  results: BatchCaseResult[];
  firstFailingCaseNumber?: number;
  stderr?: string;
  compileOutput?: string;
  runtimeMs: number;
  memoryKb: number;
}

export interface Judge0ExecutionOutcome {
  verdict: ExecutionVerdict;
  passed: boolean;
  actualOutput: string;
  stderr?: string;
  compileOutput?: string;
  runtimeMs: number;
  memoryKb: number;
}

/**
 * HTTP adapter for Judge0 CE remote sandboxed code execution.
 * Never executes user code locally.
 */
export class Judge0Adapter {
  public async executeTestCase(params: {
    language: SupportedCodeLanguage;
    code: string;
    stdin: string;
    expectedOutput: string;
  }): Promise<Judge0ExecutionOutcome> {
    const baseUrl = config.JUDGE0_API_URL.replace(/\/+$/, "");
    const url = `${baseUrl}/submissions?base64_encoded=false&wait=true`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.JUDGE0_API_KEY) {
      headers["X-RapidAPI-Key"] = config.JUDGE0_API_KEY;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          language_id: JUDGE0_LANGUAGE_IDS[params.language],
          source_code: params.code,
          stdin: params.stdin,
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      throw new AppError(
        translateJudge0ServiceError(err),
        503,
        "JUDGE0_UNAVAILABLE"
      );
    }

    if (!response.ok) {
      throw new AppError(
        translateJudge0ServiceError(new Error(`HTTP ${response.status}`)),
        502,
        "JUDGE0_BAD_GATEWAY"
      );
    }

    const payload = (await response.json()) as Judge0SubmissionResponse;
    const statusId = payload.status?.id ?? 13;
    const stdout = (payload.stdout ?? "").trim();
    const stderr = payload.stderr ? payload.stderr.trim() : undefined;
    const compileOutput = payload.compile_output
      ? payload.compile_output.trim()
      : undefined;
    const runtimeMs = payload.time
      ? Math.max(0, Math.round(parseFloat(payload.time) * 1000))
      : 0;
    const memoryKb = payload.memory ? Math.max(0, Math.round(payload.memory)) : 0;

    const normalizeOut = (val: string) =>
      val.trim().replace(/,\s+/g, ",").replace(/\s+,/g, ",");

    let verdict: ExecutionVerdict;
    if (statusId === 6) {
      verdict = "COMPILATION_ERROR";
    } else if (statusId === 5) {
      verdict = "TIME_LIMIT_EXCEEDED";
    } else if (statusId >= 7) {
      verdict = "RUNTIME_ERROR";
    } else if (statusId === 3) {
      verdict =
        normalizeOut(stdout) === normalizeOut(params.expectedOutput)
          ? "ACCEPTED"
          : "WRONG_ANSWER";
    } else {
      verdict = "WRONG_ANSWER";
    }

    return {
      verdict,
      passed: verdict === "ACCEPTED",
      actualOutput: stdout,
      stderr,
      compileOutput,
      runtimeMs,
      memoryKb,
    };
  }

  /**
   * Executes all requested test cases in a single Judge0 CE submission.
   */
  public async executeBatch(params: {
    language: SupportedCodeLanguage;
    code: string;
    testCases: ProblemTestCase[];
  }): Promise<Judge0BatchOutcome> {
    const batchSource = buildBatchCode(
      params.language,
      params.code,
      params.testCases
    );
    const baseUrl = config.JUDGE0_API_URL.replace(/\/+$/, "");
    const url = `${baseUrl}/submissions?base64_encoded=false&wait=true`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.JUDGE0_API_KEY) {
      headers["X-RapidAPI-Key"] = config.JUDGE0_API_KEY;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          language_id: JUDGE0_LANGUAGE_IDS[params.language],
          source_code: batchSource,
          stdin: "",
        }),
        signal: AbortSignal.timeout(20000),
      });
    } catch (err) {
      throw new AppError(
        translateJudge0ServiceError(err),
        503,
        "JUDGE0_UNAVAILABLE"
      );
    }

    if (!response.ok) {
      throw new AppError(
        translateJudge0ServiceError(new Error(`HTTP ${response.status}`)),
        502,
        "JUDGE0_BAD_GATEWAY"
      );
    }

    const payload = (await response.json()) as Judge0SubmissionResponse;
    const statusId = payload.status?.id ?? 13;
    const stdout = payload.stdout ?? "";
    const stderr = payload.stderr ? payload.stderr.trim() : undefined;
    const compileOutput = payload.compile_output
      ? payload.compile_output.trim()
      : undefined;
    const runtimeMs = payload.time
      ? Math.max(0, Math.round(parseFloat(payload.time) * 1000))
      : 0;
    const memoryKb = payload.memory ? Math.max(0, Math.round(payload.memory)) : 0;

    if (statusId === 6) {
      return {
        verdict: "COMPILATION_ERROR",
        results: params.testCases.slice(0, 1).map((tc, idx) => ({
          testCaseId: tc.id,
          caseNumber: idx + 1,
          isHidden: !tc.isSample,
          passed: false,
          actualOutput: "",
          verdict: "COMPILATION_ERROR",
        })),
        firstFailingCaseNumber: 1,
        stderr,
        compileOutput,
        runtimeMs,
        memoryKb,
      };
    }

    const rawVerdict: ExecutionVerdict =
      statusId === 5
        ? "TIME_LIMIT_EXCEEDED"
        : statusId >= 7
          ? "RUNTIME_ERROR"
          : "ACCEPTED";

    const parsed = parseBatchStdout(stdout, params.testCases, rawVerdict);
    return {
      verdict: parsed.verdict,
      results: parsed.results,
      firstFailingCaseNumber: parsed.firstFailingCaseNumber,
      stderr,
      compileOutput,
      runtimeMs,
      memoryKb,
    };
  }
}

export const judge0Adapter = new Judge0Adapter();
