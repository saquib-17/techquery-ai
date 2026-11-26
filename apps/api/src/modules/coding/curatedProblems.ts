import type { Prisma } from "@prisma/client";
import {
  CODING_PROBLEMS,
  type CuratedCodingProblem,
  type DsaPattern,
  type ProblemDifficulty,
  type ProblemExample,
  type ProblemTestCase,
  type StarterCodeMap,
} from "@techquery/shared";
import { prisma } from "../../core/database/index.js";

export interface CuratedProblemSeed {
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  pattern: DsaPattern;
  statement: string;
  constraints: string[];
  examples: ProblemExample[];
  hints: string[];
  starterCode: StarterCodeMap;
  driverCode: StarterCodeMap;
  sampleTestCases: ProblemTestCase[];
  hiddenTestCases: ProblemTestCase[];
}

function fromWave1Problem(p: CuratedCodingProblem): CuratedProblemSeed {
  return {
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    pattern: p.pattern,
    statement: p.statement,
    constraints: p.constraints,
    examples: p.examples,
    hints: p.hints,
    starterCode: p.starterCode,
    driverCode: p.driverCode,
    sampleTestCases: p.testCases
      .filter((tc) => !tc.isHidden)
      .map((tc) => ({
        id: tc.id,
        stdin: tc.stdin,
        expectedOutput: tc.expectedOutput,
        isSample: true,
      })),
    hiddenTestCases: p.testCases
      .filter((tc) => tc.isHidden)
      .map((tc) => ({
        id: tc.id,
        stdin: tc.stdin,
        expectedOutput: tc.expectedOutput,
        isSample: false,
      })),
  };
}

const LEGACY_NON_WAVE1_PROBLEMS: CuratedProblemSeed[] = [
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "EASY",
    pattern: "STACK_HEAP",
    statement:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Return true if every opening bracket is closed by the same type of bracket in the correct order, or false otherwise.",
    constraints: ["1 <= s.length <= 10^5"],
    examples: [
      { input: 's = "()[]{}"', output: "true", explanation: "All brackets match in order." },
      { input: 's = "(]"', output: "false", explanation: "Mismatched bracket pair." },
    ],
    hints: ["Use a stack to push opening brackets and pop on matching closing brackets."],
    starterCode: {
      java: `import java.util.*;\n\nclass Solution {\n  public boolean isValid(String s) {\n    // Write your solution here\n    return false;\n  }\n}`,
      python: `class Solution:\n  def isValid(self, s: str) -> bool:\n    # Write your solution here\n    return False`,
      cpp: `class Solution {\npublic:\n  bool isValid(string s) {\n    // Write your solution here\n    return false;\n  }\n};`,
      javascript: `/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n  // Write your solution here\n  return false;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String s = sc.hasNext() ? sc.next() : "";\n    System.out.println(new Solution().isValid(s));\n  }\n}`,
      python: `import sys\n\n{{USER_CODE}}\n\nif __name__ == "__main__":\n  s = sys.stdin.read().strip()\n  print("true" if Solution().isValid(s) else "false")`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n  string s;\n  if (!(cin >> s)) s = "";\n  cout << (Solution().isValid(s) ? "true" : "false") << "\\n";\n  return 0;\n}`,
      javascript: `const fs = require("fs");\n\n{{USER_CODE}}\n\nconst s = fs.readFileSync(0, "utf8").trim();\nconsole.log(isValid(s) ? "true" : "false");`,
    },
    sampleTestCases: [
      { id: "sample-1", stdin: "()[]{}", expectedOutput: "true", isSample: true },
      { id: "sample-2", stdin: "(]", expectedOutput: "false", isSample: true },
    ],
    hiddenTestCases: [
      { id: "hidden-1", stdin: "({[]})", expectedOutput: "true", isSample: false },
      { id: "hidden-2", stdin: "([)]", expectedOutput: "false", isSample: false },
      { id: "hidden-3", stdin: "(((", expectedOutput: "false", isSample: false },
    ],
  },
  {
    title: "Coin Change",
    slug: "coin-change",
    difficulty: "MEDIUM",
    pattern: "DYNAMIC_PROGRAMMING",
    statement:
      "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount, or -1 if that amount cannot be made up.",
    constraints: ["1 <= coins.length <= 12", "1 <= coins[i] <= 10^4", "0 <= amount <= 10^4"],
    examples: [
      { input: "coins = [1, 2, 5], amount = 11", output: "3", explanation: "11 = 5 + 5 + 1." },
      { input: "coins = [2], amount = 3", output: "-1", explanation: "Cannot form 3 using only 2s." },
    ],
    hints: ["Bottom-up DP: dp[a] = min(dp[a], dp[a - coin] + 1)."],
    starterCode: {
      java: `import java.util.*;\n\nclass Solution {\n  public int coinChange(int[] coins, int amount) {\n    // Write your solution here\n    return -1;\n  }\n}`,
      python: `class Solution:\n  def coinChange(self, coins: list[int], amount: int) -> int:\n    # Write your solution here\n    return -1`,
      cpp: `class Solution {\npublic:\n  int coinChange(vector<int>& coins, int amount) {\n    // Write your solution here\n    return -1;\n  }\n};`,
      javascript: `/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nvar coinChange = function(coins, amount) {\n  // Write your solution here\n  return -1;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    if (!sc.hasNextInt()) return;\n    int n = sc.nextInt();\n    int[] coins = new int[n];\n    for (int i = 0; i < n; i++) coins[i] = sc.nextInt();\n    int amount = sc.nextInt();\n    System.out.println(new Solution().coinChange(coins, amount));\n  }\n}`,
      python: `import sys\n\n{{USER_CODE}}\n\nif __name__ == "__main__":\n  data = list(map(int, sys.stdin.read().split()))\n  if data:\n    n = data[0]\n    print(Solution().coinChange(data[1:1 + n], data[1 + n]))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n  int n;\n  if (!(cin >> n)) return 0;\n  vector<int> coins(n);\n  for (int i = 0; i < n; i++) cin >> coins[i];\n  int amount;\n  cin >> amount;\n  cout << Solution().coinChange(coins, amount) << "\\n";\n  return 0;\n}`,
      javascript: `const fs = require("fs");\n\n{{USER_CODE}}\n\nconst data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);\nif (data.length >= 2) {\n  const n = data[0];\n  console.log(coinChange(data.slice(1, 1 + n), data[1 + n]));\n}`,
    },
    sampleTestCases: [
      { id: "sample-1", stdin: "3\n1 2 5\n11", expectedOutput: "3", isSample: true },
      { id: "sample-2", stdin: "1\n2\n3", expectedOutput: "-1", isSample: true },
    ],
    hiddenTestCases: [
      { id: "hidden-1", stdin: "1\n1\n0", expectedOutput: "0", isSample: false },
      { id: "hidden-2", stdin: "4\n1 3 4 5\n7", expectedOutput: "2", isSample: false },
      { id: "hidden-3", stdin: "2\n5 10\n3", expectedOutput: "-1", isSample: false },
    ],
  },
  {
    title: "Edit Distance",
    slug: "edit-distance",
    difficulty: "HARD",
    pattern: "DYNAMIC_PROGRAMMING",
    statement:
      "Given two strings word1 and word2, return the minimum number of operations (insert, delete, or replace a character) required to convert word1 to word2.",
    constraints: ["1 <= word1.length, word2.length <= 500"],
    examples: [
      { input: 'word1 = "horse", word2 = "ros"', output: "3", explanation: "horse -> rorse -> rose -> ros." },
      { input: 'word1 = "intention", word2 = "execution"', output: "5", explanation: "5 edit operations." },
    ],
    hints: ["2D DP table dp[i][j] representing edit distance between prefixes word1[0..i) and word2[0..j)."],
    starterCode: {
      java: `class Solution {\n  public int minDistance(String word1, String word2) {\n    // Write your solution here\n    return 0;\n  }\n}`,
      python: `class Solution:\n  def minDistance(self, word1: str, word2: str) -> int:\n    # Write your solution here\n    return 0`,
      cpp: `class Solution {\npublic:\n  int minDistance(string word1, string word2) {\n    // Write your solution here\n    return 0;\n  }\n};`,
      javascript: `/**\n * @param {string} word1\n * @param {string} word2\n * @return {number}\n */\nvar minDistance = function(word1, word2) {\n  // Write your solution here\n  return 0;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String w1 = sc.hasNext() ? sc.next() : "";\n    String w2 = sc.hasNext() ? sc.next() : "";\n    System.out.println(new Solution().minDistance(w1, w2));\n  }\n}`,
      python: `import sys\n\n{{USER_CODE}}\n\nif __name__ == "__main__":\n  parts = sys.stdin.read().split()\n  if len(parts) >= 2:\n    print(Solution().minDistance(parts[0], parts[1]))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n  string w1, w2;\n  if (!(cin >> w1 >> w2)) return 0;\n  cout << Solution().minDistance(w1, w2) << "\\n";\n  return 0;\n}`,
      javascript: `const fs = require("fs");\n\n{{USER_CODE}}\n\nconst parts = fs.readFileSync(0, "utf8").trim().split(/\\s+/);\nif (parts.length >= 2) {\n  console.log(minDistance(parts[0], parts[1]));\n}`,
    },
    sampleTestCases: [
      { id: "sample-1", stdin: "horse\nros", expectedOutput: "3", isSample: true },
      { id: "sample-2", stdin: "intention\nexecution", expectedOutput: "5", isSample: true },
    ],
    hiddenTestCases: [
      { id: "hidden-1", stdin: "abc\nabc", expectedOutput: "0", isSample: false },
      { id: "hidden-2", stdin: "a\nb", expectedOutput: "1", isSample: false },
      { id: "hidden-3", stdin: "kitten\nsitting", expectedOutput: "3", isSample: false },
    ],
  },
];

export const CURATED_CODING_PROBLEMS: CuratedProblemSeed[] = [
  ...CODING_PROBLEMS.map(fromWave1Problem),
  ...LEGACY_NON_WAVE1_PROBLEMS,
];

let seededInProcess = false;

/**
 * Purges unreferenced legacy/variant duplicates and ensures all curated
 * LeetCode-style problems (35 Wave-1 + 3 legacy) exist with up-to-date
 * signatures and test cases.
 */
export async function ensureCuratedProblemsSeeded(): Promise<void> {
  if (seededInProcess) {
    const slugs = CURATED_CODING_PROBLEMS.map((p) => p.slug);
    const count = await prisma.codingProblem.count({
      where: { slug: { in: slugs } },
    });
    if (count === CURATED_CODING_PROBLEMS.length) {
      return;
    }
  }

  const curatedSlugs = CURATED_CODING_PROBLEMS.map((p) => p.slug);
  await prisma.codingProblem.deleteMany({
    where: {
      slug: { notIn: curatedSlugs },
      questions: { none: {} },
      assessmentProblems: { none: {} },
      submissions: { none: {} },
    },
  });

  for (const item of CURATED_CODING_PROBLEMS) {
    const payload = {
      title: item.title,
      difficulty: item.difficulty,
      pattern: item.pattern,
      statement: item.statement,
      constraints: item.constraints as unknown as Prisma.InputJsonValue,
      examples: item.examples as unknown as Prisma.InputJsonValue,
      starterCode: item.starterCode as unknown as Prisma.InputJsonValue,
      driverCode: item.driverCode as unknown as Prisma.InputJsonValue,
      sampleTestCases: item.sampleTestCases as unknown as Prisma.InputJsonValue,
      hiddenTestCases: item.hiddenTestCases as unknown as Prisma.InputJsonValue,
      hints: item.hints as unknown as Prisma.InputJsonValue,
    };

    await prisma.codingProblem.upsert({
      where: { slug: item.slug },
      update: payload,
      create: {
        userId: null,
        slug: item.slug,
        ...payload,
      },
    });
  }

  seededInProcess = true;
}
