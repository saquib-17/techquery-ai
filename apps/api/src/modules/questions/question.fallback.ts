import type {
  QuestionCategory,
  QuestionDifficulty,
  QuestionSetAIResponse,
  QuestionItemAI,
  DsaQuestionSetAIResponse,
  DsaProblemItemAI,
} from "./question.schemas.js";
import type { DsaPattern } from "@techquery/shared";

export interface FallbackQuestionContext {
  skills?: string[];
  topicFocus?: string;
  difficulty?: QuestionDifficulty;
  categories?: QuestionCategory[];
  count?: number;
  title?: string;
  jdTitle?: string;
  jdCompany?: string | null;
}

/**
 * Deterministic offline question generator fallback.
 * Generates an exact count of realistic, structured interview questions
 * aligned with the candidate's skills, target JD, difficulty, and requested categories.
 */
export function deterministicQuestionFallback(
  context: FallbackQuestionContext = {}
): QuestionSetAIResponse {
  const count = Math.max(3, Math.min(20, context.count ?? 10));
  const difficulty = context.difficulty || "MEDIUM";
  const topicFocus = context.topicFocus || "Core Software Engineering";

  const allCategories: QuestionCategory[] = [
    "THEORETICAL",
    "CODING",
    "SYSTEM_DESIGN",
    "BEHAVIORAL",
    "PROJECT_DEFENSE",
  ];
  const categories =
    context.categories && context.categories.length > 0
      ? context.categories
      : allCategories;

  const defaultSkills = [
    "TypeScript",
    "Node.js",
    "PostgreSQL",
    "Docker",
    "AWS",
    "REST APIs",
    "Redis",
    "System Design",
    "Git",
  ];

  const candidateSkills =
    context.skills && context.skills.length > 0 ? context.skills : defaultSkills;

  const questions: QuestionItemAI[] = [];

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const skill = candidateSkills[i % candidateSkills.length];

    let questionText = "";
    let interviewerIntent = "";
    let keyEvaluationPoints: string[] = [];

    switch (category) {
      case "THEORETICAL":
        questionText = `Explain how ${skill} handles memory management, concurrency, and performance bottlenecks under high throughput. What are the key architectural trade-offs to keep in mind?`;
        interviewerIntent = `Assesses candidate's deep conceptual foundation, memory mechanics, and trade-off evaluation in ${skill}.`;
        keyEvaluationPoints = [
          `Solid command of ${skill} runtime mechanics and concurrency model`,
          "Awareness of memory allocation, garbage collection, or resource leaks",
          "Ability to compare alternative solutions and explain technical trade-offs",
        ];
        break;

      case "CODING":
        questionText = `Design and implement an efficient algorithm or utility module using ${skill} that guarantees thread-safety and processes high-velocity batched requests with sub-linear complexity.`;
        interviewerIntent = `Evaluates algorithmic proficiency, modular code organization, error boundary handling, and time/space complexity optimization with ${skill}.`;
        keyEvaluationPoints = [
          `Production-grade, idiomatic usage of ${skill}`,
          "Edge-case identification (null values, buffer overflows, concurrency race conditions)",
          "Optimal time and space complexity with clear Big-O reasoning",
        ];
        break;

      case "SYSTEM_DESIGN":
        questionText = `Design a distributed, highly available subsystem utilizing ${skill} that handles sudden traffic spikes (50,000 RPM) while enforcing strict data consistency and zero single points of failure.`;
        interviewerIntent = `Tests high-level distributed systems decomposition, partitioning, caching strategies, and resilience patterns incorporating ${skill}.`;
        keyEvaluationPoints = [
          `Appropriate role and positioning of ${skill} in the overall architecture`,
          "Clear strategy for partitioning, replication, and failover recovery",
          "Understanding of CAP theorem trade-offs and latency SLAs",
        ];
        break;

      case "BEHAVIORAL":
        questionText = `Describe a complex project involving ${skill} where you faced an unexpected technical roadblock or severe timeline constraint. How did you diagnose the issue, manage team expectations, and deliver?`;
        interviewerIntent = `Evaluates engineering resilience, structured communication (STAR framework), collaboration, and pragmatism in delivery.`;
        keyEvaluationPoints = [
          "Structured narrative using Situation, Task, Action, and Result (STAR)",
          "Ownership and accountability rather than blaming team members or external tools",
          "Quantifiable impact and retrospective learnings from the challenge",
        ];
        break;

      case "PROJECT_DEFENSE":
        questionText = `In your past implementation involving ${skill}, what were the most critical scaling or architectural bottlenecks you encountered? If you were to redesign the system from scratch today, what would you change?`;
        interviewerIntent = `Validates authentic hands-on project experience, engineering maturity, critical reflection, and defensive reasoning under technical pressure.`;
        keyEvaluationPoints = [
          `Demonstrated deep hands-on ownership of ${skill} in the referenced project`,
          "Honest identification of technical debt and architectural trade-offs",
          "Clear rationale for why specific technologies and designs were chosen over alternatives",
        ];
        break;
    }

    questions.push({
      category,
      difficulty,
      targetedSkill: skill,
      questionText,
      interviewerIntent,
      keyEvaluationPoints,
    });
  }

  const generatedTitle =
    context.title ||
    (context.jdTitle
      ? `${context.jdTitle} Interview Practice Set`
      : `${topicFocus} (${difficulty}) - Practice Set`);

  return {
    title: generatedTitle,
    questions,
  };
}

const PATTERN_TEMPLATES: Array<{
  pattern: DsaPattern;
  title: string;
  statement: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation: string }>;
  hints: string[];
  starterCode: { java: string; python: string; cpp: string; javascript: string };
  driverCode: { java: string; python: string; cpp: string; javascript: string };
  sampleTestCases: Array<{ stdin: string; expectedOutput: string }>;
  hiddenTestCases: Array<{ stdin: string; expectedOutput: string }>;
}> = [
  {
    pattern: "ARRAYS_TWO_POINTERS",
    title: "Pair Sum Target Indices",
    statement:
      "Given an array of integers nums and an integer target, return the 0-based indices [i, j] (i < j) of two elements that sum to target, or [-1, -1] if none exists.",
    constraints: ["2 <= nums.length <= 10^5", "-10^9 <= nums[i], target <= 10^9"],
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "nums[0] + nums[1] = 2 + 7 = 9.",
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
        explanation: "nums[1] + nums[2] = 2 + 4 = 6.",
      },
    ],
    hints: ["Use a hash map from value to index for O(n) single-pass lookup."],
    starterCode: {
      java: `class Solution {\n  public int[] twoSum(int[] nums, int target) {\n    // Write your solution here\n    return new int[]{-1, -1};\n  }\n}`,
      python: `class Solution:\n  def twoSum(self, nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    return [-1, -1]`,
      cpp: `class Solution {\npublic:\n  vector<int> twoSum(vector<int>& nums, int target) {\n    // Write your solution here\n    return {-1, -1};\n  }\n};`,
      javascript: `var twoSum = function(nums, target) {\n  // Write your solution here\n  return [-1, -1];\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    if (!sc.hasNextInt()) return;\n    int n = sc.nextInt();\n    int[] nums = new int[n];\n    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n    int target = sc.nextInt();\n    System.out.println(Arrays.toString(new Solution().twoSum(nums, target)));\n  }\n}`,
      python: `import json, sys\n\n{{USER_CODE}}\n\nif __name__ == "__main__":\n  data = list(map(int, sys.stdin.read().split()))\n  if data:\n    n = data[0]\n    print(json.dumps(Solution().twoSum(data[1:1 + n], data[1 + n])))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n  int n;\n  if (!(cin >> n)) return 0;\n  vector<int> nums(n);\n  for (int i = 0; i < n; i++) cin >> nums[i];\n  int target; cin >> target;\n  auto res = Solution().twoSum(nums, target);\n  cout << "[";\n  for (size_t i = 0; i < res.size(); i++) { if (i > 0) cout << ", "; cout << res[i]; }\n  cout << "]\\n";\n  return 0;\n}`,
      javascript: `const fs = require("fs");\n\n{{USER_CODE}}\n\nconst data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);\nif (data.length >= 2) {\n  const n = data[0];\n  console.log(JSON.stringify(twoSum(data.slice(1, 1 + n), data[1 + n])));\n}`,
    },
    sampleTestCases: [
      { stdin: "4\n2 7 11 15\n9", expectedOutput: "[0, 1]" },
      { stdin: "3\n3 2 4\n6", expectedOutput: "[1, 2]" },
    ],
    hiddenTestCases: [
      { stdin: "2\n3 3\n6", expectedOutput: "[0, 1]" },
      { stdin: "4\n-3 4 3 90\n0", expectedOutput: "[0, 2]" },
      { stdin: "3\n1 2 3\n10", expectedOutput: "[-1, -1]" },
    ],
  },
  {
    pattern: "SLIDING_WINDOW",
    title: "Maximum Sum Subarray of Size K",
    statement:
      "Given an integer array nums and an integer k, return the maximum sum of any contiguous subarray of length k.",
    constraints: ["1 <= k <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      {
        input: "nums = [2, 1, 5, 1, 3], k = 3",
        output: "9",
        explanation: "Subarray [5, 1, 3] has the maximum sum 9.",
      },
      {
        input: "nums = [2, 3, 4, 1, 5], k = 2",
        output: "7",
        explanation: "Subarray [3, 4] has the maximum sum 7.",
      },
    ],
    hints: ["Maintain a running window sum and slide by adding nums[i] and subtracting nums[i-k]."],
    starterCode: {
      java: `class Solution {\n  public int maxSubarraySum(int[] nums, int k) {\n    // Write your solution here\n    return 0;\n  }\n}`,
      python: `class Solution:\n  def maxSubarraySum(self, nums: list[int], k: int) -> int:\n    # Write your solution here\n    return 0`,
      cpp: `class Solution {\npublic:\n  int maxSubarraySum(vector<int>& nums, int k) {\n    // Write your solution here\n    return 0;\n  }\n};`,
      javascript: `var maxSubarraySum = function(nums, k) {\n  // Write your solution here\n  return 0;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    if (!sc.hasNextInt()) return;\n    int n = sc.nextInt(), k = sc.nextInt();\n    int[] nums = new int[n];\n    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n    System.out.println(new Solution().maxSubarraySum(nums, k));\n  }\n}`,
      python: `import sys\n\n{{USER_CODE}}\n\nif __name__ == "__main__":\n  data = list(map(int, sys.stdin.read().split()))\n  if data:\n    n, k = data[0], data[1]\n    print(Solution().maxSubarraySum(data[2:2 + n], k))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n  int n, k; if (!(cin >> n >> k)) return 0;\n  vector<int> nums(n);\n  for (int i = 0; i < n; i++) cin >> nums[i];\n  cout << Solution().maxSubarraySum(nums, k) << "\\n";\n  return 0;\n}`,
      javascript: `const fs = require("fs");\n\n{{USER_CODE}}\n\nconst data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);\nif (data.length >= 2) {\n  console.log(maxSubarraySum(data.slice(2, 2 + data[0]), data[1]));\n}`,
    },
    sampleTestCases: [
      { stdin: "5 3\n2 1 5 1 3", expectedOutput: "9" },
      { stdin: "5 2\n2 3 4 1 5", expectedOutput: "7" },
    ],
    hiddenTestCases: [
      { stdin: "1 1\n-5", expectedOutput: "-5" },
      { stdin: "4 2\n-1 -2 -3 -4", expectedOutput: "-3" },
      { stdin: "4 4\n1 2 3 4", expectedOutput: "10" },
    ],
  },
  {
    pattern: "BINARY_SEARCH",
    title: "Lower Bound in Sorted Array",
    statement:
      "Given a sorted array nums and a target x, return the smallest 0-based index i where nums[i] >= x, or -1 if all elements are smaller than x.",
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i], x <= 10^9"],
    examples: [
      { input: "nums = [1, 3, 5, 7, 9], x = 6", output: "3", explanation: "nums[3] = 7 is the first element >= 6." },
      { input: "nums = [1, 3, 5, 7, 9], x = 10", output: "-1", explanation: "All elements are < 10." },
    ],
    hints: ["Binary search the interval [0, n) tracking the leftmost valid midpoint."],
    starterCode: {
      java: `class Solution {\n  public int lowerBound(int[] nums, int x) {\n    // Write your solution here\n    return -1;\n  }\n}`,
      python: `class Solution:\n  def lowerBound(self, nums: list[int], x: int) -> int:\n    # Write your solution here\n    return -1`,
      cpp: `class Solution {\npublic:\n  int lowerBound(vector<int>& nums, int x) {\n    // Write your solution here\n    return -1;\n  }\n};`,
      javascript: `var lowerBound = function(nums, x) {\n  // Write your solution here\n  return -1;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    if (!sc.hasNextInt()) return;\n    int n = sc.nextInt();\n    int[] nums = new int[n];\n    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n    int x = sc.nextInt();\n    System.out.println(new Solution().lowerBound(nums, x));\n  }\n}`,
      python: `import sys\n\n{{USER_CODE}}\n\nif __name__ == "__main__":\n  data = list(map(int, sys.stdin.read().split()))\n  if data:\n    n = data[0]\n    print(Solution().lowerBound(data[1:1 + n], data[1 + n]))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n  int n; if (!(cin >> n)) return 0;\n  vector<int> nums(n);\n  for (int i = 0; i < n; i++) cin >> nums[i];\n  int x; cin >> x;\n  cout << Solution().lowerBound(nums, x) << "\\n";\n  return 0;\n}`,
      javascript: `const fs = require("fs");\n\n{{USER_CODE}}\n\nconst data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);\nif (data.length >= 2) {\n  const n = data[0];\n  console.log(lowerBound(data.slice(1, 1 + n), data[1 + n]));\n}`,
    },
    sampleTestCases: [
      { stdin: "5\n1 3 5 7 9\n6", expectedOutput: "3" },
      { stdin: "5\n1 3 5 7 9\n10", expectedOutput: "-1" },
    ],
    hiddenTestCases: [
      { stdin: "1\n5\n5", expectedOutput: "0" },
      { stdin: "4\n2 2 2 2\n2", expectedOutput: "0" },
      { stdin: "3\n-10 -5 0\n-12", expectedOutput: "0" },
    ],
  },
  {
    pattern: "STACK_HEAP",
    title: "Balanced Brackets Validator",
    statement:
      "Given a string s containing only '(', ')', '{', '}', '[', ']', return true if s is valid and properly nested, or false otherwise.",
    constraints: ["1 <= s.length <= 10^5"],
    examples: [
      { input: 's = "({[]})"', output: "true", explanation: "Every opening bracket is closed in order." },
      { input: 's = "([)]"', output: "false", explanation: "Mismatched nesting." },
    ],
    hints: ["Push expected closing brackets onto a stack and verify on each closing character."],
    starterCode: {
      java: `import java.util.*;\n\nclass Solution {\n  public boolean isValid(String s) {\n    // Write your solution here\n    return false;\n  }\n}`,
      python: `class Solution:\n  def isValid(self, s: str) -> bool:\n    # Write your solution here\n    return False`,
      cpp: `class Solution {\npublic:\n  bool isValid(string s) {\n    // Write your solution here\n    return false;\n  }\n};`,
      javascript: `var isValid = function(s) {\n  // Write your solution here\n  return false;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String s = sc.hasNext() ? sc.next() : "";\n    System.out.println(new Solution().isValid(s));\n  }\n}`,
      python: `import sys\n\n{{USER_CODE}}\n\nif __name__ == "__main__":\n  print("true" if Solution().isValid(sys.stdin.read().strip()) else "false")`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n  string s; if (!(cin >> s)) s = "";\n  cout << (Solution().isValid(s) ? "true" : "false") << "\\n";\n  return 0;\n}`,
      javascript: `const fs = require("fs");\n\n{{USER_CODE}}\n\nconsole.log(isValid(fs.readFileSync(0, "utf8").trim()) ? "true" : "false");`,
    },
    sampleTestCases: [
      { stdin: "({[]})", expectedOutput: "true" },
      { stdin: "([)]", expectedOutput: "false" },
    ],
    hiddenTestCases: [
      { stdin: "()", expectedOutput: "true" },
      { stdin: "(((", expectedOutput: "false" },
      { stdin: "]", expectedOutput: "false" },
    ],
  },
  {
    pattern: "DYNAMIC_PROGRAMMING",
    title: "Distinct Ways to Climb Stairs",
    statement:
      "Given an integer n representing staircase steps, you can climb 1 or 2 steps at a time. Return the total number of distinct ways to reach step n.",
    constraints: ["1 <= n <= 45"],
    examples: [
      { input: "n = 4", output: "5", explanation: "There are 5 distinct ways to climb 4 steps." },
      { input: "n = 2", output: "2", explanation: "1+1 or 2." },
    ],
    hints: ["ways[i] = ways[i - 1] + ways[i - 2] with O(1) space."],
    starterCode: {
      java: `class Solution {\n  public int climbStairs(int n) {\n    // Write your solution here\n    return 0;\n  }\n}`,
      python: `class Solution:\n  def climbStairs(self, n: int) -> int:\n    # Write your solution here\n    return 0`,
      cpp: `class Solution {\npublic:\n  int climbStairs(int n) {\n    // Write your solution here\n    return 0;\n  }\n};`,
      javascript: `var climbStairs = function(n) {\n  // Write your solution here\n  return 0;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    if (!sc.hasNextInt()) return;\n    System.out.println(new Solution().climbStairs(sc.nextInt()));\n  }\n}`,
      python: `import sys\n\n{{USER_CODE}}\n\nif __name__ == "__main__":\n  data = sys.stdin.read().split()\n  if data: print(Solution().climbStairs(int(data[0])))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n  int n; if (!(cin >> n)) return 0;\n  cout << Solution().climbStairs(n) << "\\n";\n  return 0;\n}`,
      javascript: `const fs = require("fs");\n\n{{USER_CODE}}\n\nconst n = parseInt(fs.readFileSync(0, "utf8").trim(), 10);\nif (!Number.isNaN(n)) console.log(climbStairs(n));`,
    },
    sampleTestCases: [
      { stdin: "4", expectedOutput: "5" },
      { stdin: "2", expectedOutput: "2" },
    ],
    hiddenTestCases: [
      { stdin: "1", expectedOutput: "1" },
      { stdin: "5", expectedOutput: "8" },
      { stdin: "10", expectedOutput: "89" },
    ],
  },
];

/**
 * Deterministic offline fallback for DSA_ALGORITHMS question generation.
 */
export function deterministicDsaQuestionFallback(context: {
  dsaPattern?: DsaPattern;
  difficulty?: QuestionDifficulty;
  count?: number;
  title?: string;
}): DsaQuestionSetAIResponse {
  const count = Math.max(3, Math.min(20, context.count ?? 5));
  const difficulty = context.difficulty || "MEDIUM";
  const requestedPattern = context.dsaPattern || "ALL_PATTERNS";

  const primary =
    requestedPattern !== "ALL_PATTERNS"
      ? PATTERN_TEMPLATES.filter((t) => t.pattern === requestedPattern)
      : PATTERN_TEMPLATES;
  const secondary =
    requestedPattern !== "ALL_PATTERNS"
      ? PATTERN_TEMPLATES.filter((t) => t.pattern !== requestedPattern)
      : [];
  const orderedPool = [...primary, ...secondary];

  const problems: DsaProblemItemAI[] = orderedPool
    .slice(0, Math.min(count, orderedPool.length))
    .map((base) => ({
      title: base.title,
      difficulty,
      pattern: base.pattern,
      statement: base.statement,
      constraints: base.constraints,
      examples: base.examples,
      hints: base.hints,
      starterCode: base.starterCode,
      driverCode: base.driverCode,
      sampleTestCases: base.sampleTestCases,
      hiddenTestCases: base.hiddenTestCases,
      targetedSkill: base.pattern,
      interviewerIntent: `Evaluates algorithmic problem solving and optimal complexity using ${base.pattern}.`,
      keyEvaluationPoints: [
        "Identifies optimal time and space complexity",
        "Handles boundary and edge cases cleanly",
      ],
    }));

  return {
    title: context.title || `DSA ${requestedPattern} (${difficulty}) Practice Set`,
    problems,
  };
}
