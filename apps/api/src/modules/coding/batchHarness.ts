import type {
  ExecutionVerdict,
  ProblemTestCase,
  SupportedCodeLanguage,
} from "@techquery/shared";

export interface BatchCaseResult {
  testCaseId: string;
  caseNumber: number;
  isHidden: boolean;
  passed: boolean;
  actualOutput: string;
  verdict: ExecutionVerdict;
}

const CASE_PREFIX = "__TQ_CASE_";
const CASE_END = "__TQ_END__";

function normalizeOutput(val: string): string {
  return val.trim().replace(/,\s+/g, ",").replace(/\s+,/g, ",");
}

/**
 * Wraps single-case driver+user code into a single-batch program that executes
 * all requested test cases in ONE Judge0 submission.
 */
export function buildBatchCode(
  language: SupportedCodeLanguage,
  singleCaseCode: string,
  testCases: ProblemTestCase[]
): string {
  const inputsJson = JSON.stringify(testCases.map((tc) => tc.stdin));

  switch (language) {
    case "python": {
      const indented = singleCaseCode
        .split(/\r?\n/)
        .map((line) => `  ${line}`)
        .join("\n");
      return `import io as __tq_io, json as __tq_json, sys as __tq_sys
def __tq_run_single():
${indented}

__tq_inputs = __tq_json.loads(${JSON.stringify(inputsJson)})
__tq_orig_stdin = __tq_sys.stdin
__tq_orig_stdout = __tq_sys.stdout
for __tq_i, __tq_in in enumerate(__tq_inputs):
  __tq_buf = __tq_io.StringIO()
  __tq_sys.stdin = __tq_io.StringIO(__tq_in)
  __tq_sys.stdout = __tq_buf
  try:
    __tq_run_single()
  finally:
    __tq_sys.stdin = __tq_orig_stdin
    __tq_sys.stdout = __tq_orig_stdout
  __tq_sys.stdout.write(f"${CASE_PREFIX}{__tq_i}__\\n{__tq_buf.getvalue().strip()}\\n${CASE_END}\\n")
`;
    }

    case "javascript": {
      const escapedCode = singleCaseCode
        .replace(/const\s+fs\s*=\s*require\(["']fs["']\);?/g, "")
        .replace(/fs\.readFileSync\s*\(\s*0\s*,\s*["']utf8["']\s*\)/g, "__tqCurrentInput");
      return `const __tqInputs = ${inputsJson};
const __tqOrigLog = console.log;
for (let __tqI = 0; __tqI < __tqInputs.length; __tqI++) {
  const __tqCurrentInput = __tqInputs[__tqI];
  const __tqLines = [];
  console.log = (...args) => __tqLines.push(args.map((a) => String(a)).join(" "));
  try {
    ${escapedCode}
  } finally {
    console.log = __tqOrigLog;
  }
  __tqOrigLog("${CASE_PREFIX}" + __tqI + "__");
  __tqOrigLog(__tqLines.join("\\n").trim());
  __tqOrigLog("${CASE_END}");
}
`;
    }

    case "java": {
      const renamed = singleCaseCode
        .replace(/\bpublic\s+class\s+Main\b/, "class SingleCaseRunner")
        .replace(/\bclass\s+Main\b/, "class SingleCaseRunner");
      const javaInputs = testCases
        .map((tc) => JSON.stringify(tc.stdin))
        .join(",\n      ");
      return `import java.io.*;
import java.nio.charset.StandardCharsets;
${renamed}
public class Main {
  public static void main(String[] args) throws Exception {
    String[] inputs = new String[] {
      ${javaInputs}
    };
    InputStream origIn = System.in;
    PrintStream origOut = System.out;
    for (int i = 0; i < inputs.length; i++) {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      System.setIn(new ByteArrayInputStream(inputs[i].getBytes(StandardCharsets.UTF_8)));
      System.setOut(new PrintStream(baos, true, StandardCharsets.UTF_8));
      try {
        SingleCaseRunner.main(new String[0]);
      } finally {
        System.setIn(origIn);
        System.setOut(origOut);
      }
      origOut.println("${CASE_PREFIX}" + i + "__");
      origOut.println(baos.toString(StandardCharsets.UTF_8).trim());
      origOut.println("${CASE_END}");
    }
  }
}
`;
    }

    case "cpp": {
      const renamed = singleCaseCode.replace(/\bint\s+main\s*\(\s*\)/, "int __tq_single_main()");
      const cppInputs = testCases
        .map((tc) => JSON.stringify(tc.stdin))
        .join(",\n    ");
      return `${renamed}
int main() {
  vector<string> __tq_inputs = {
    ${cppInputs}
  };
  streambuf* __tq_orig_cin = cin.rdbuf();
  streambuf* __tq_orig_cout = cout.rdbuf();
  for (size_t __tq_i = 0; __tq_i < __tq_inputs.size(); __tq_i++) {
    istringstream __tq_iss(__tq_inputs[__tq_i]);
    ostringstream __tq_oss;
    cin.rdbuf(__tq_iss.rdbuf());
    cout.rdbuf(__tq_oss.rdbuf());
    __tq_single_main();
    cin.rdbuf(__tq_orig_cin);
    cout.rdbuf(__tq_orig_cout);
    string __tq_out = __tq_oss.str();
    while (!__tq_out.empty() && (__tq_out.back() == '\\n' || __tq_out.back() == '\\r')) {
      __tq_out.pop_back();
    }
    cout << "${CASE_PREFIX}" << __tq_i << "__\\n" << __tq_out << "\\n${CASE_END}\\n";
  }
  return 0;
}
`;
    }
  }
}

/**
 * Parses delimited batch stdout and halts on the first failing test case.
 */
export function parseBatchStdout(
  stdout: string,
  testCases: ProblemTestCase[],
  overallVerdict: ExecutionVerdict
): {
  results: BatchCaseResult[];
  firstFailingCaseNumber?: number;
  verdict: ExecutionVerdict;
} {
  const outputs = new Map<number, string>();
  const regex = new RegExp(
    `${CASE_PREFIX}(\\d+)__\\r?\\n([\\s\\S]*?)\\r?\\n?${CASE_END}`,
    "g"
  );

  let match: RegExpExecArray | null;
  while ((match = regex.exec(stdout)) !== null) {
    const idx = Number(match[1]);
    outputs.set(idx, (match[2] ?? "").trim());
  }

  const results: BatchCaseResult[] = [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i]!;
    const caseNumber = i + 1;
    const isHidden = !tc.isSample;

    if (!outputs.has(i)) {
      const failVerdict: ExecutionVerdict =
        overallVerdict === "ACCEPTED" ? "RUNTIME_ERROR" : overallVerdict;
      results.push({
        testCaseId: tc.id,
        caseNumber,
        isHidden,
        passed: false,
        actualOutput: "",
        verdict: failVerdict,
      });
      return {
        results,
        firstFailingCaseNumber: caseNumber,
        verdict: failVerdict,
      };
    }

    const actual = outputs.get(i)!;
    const passed = normalizeOutput(actual) === normalizeOutput(tc.expectedOutput);
    results.push({
      testCaseId: tc.id,
      caseNumber,
      isHidden,
      passed,
      actualOutput: actual,
      verdict: passed ? "ACCEPTED" : "WRONG_ANSWER",
    });

    if (!passed) {
      return {
        results,
        firstFailingCaseNumber: caseNumber,
        verdict: "WRONG_ANSWER",
      };
    }
  }

  return {
    results,
    verdict: "ACCEPTED",
  };
}
