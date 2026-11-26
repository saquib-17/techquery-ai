import type { CuratedCodingProblem } from "../coding.js";
import { tc } from "./helpers.js";

const INT_2D_SORT_HELPERS = {
  java: `static String serialize2DCanonical(List<List<Integer>> res) {
    List<List<Integer>> copy = new ArrayList<>();
    for (List<Integer> row : res) {
      List<Integer> r = new ArrayList<>(row);
      Collections.sort(r);
      copy.add(r);
    }
    copy.sort((a, b) -> {
      for (int i = 0; i < Math.min(a.size(), b.size()); i++) {
        int c = Integer.compare(a.get(i), b.get(i));
        if (c != 0) return c;
      }
      return Integer.compare(a.size(), b.size());
    });
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < copy.size(); i++) {
      if (i > 0) sb.append(",");
      sb.append("[");
      for (int j = 0; j < copy.get(i).size(); j++) {
        if (j > 0) sb.append(",");
        sb.append(copy.get(i).get(j));
      }
      sb.append("]");
    }
    return sb.append("]").toString();
  }`,
  python: `def serialize_2d_canonical(res):
  norm = sorted([sorted(r) for r in res])
  return json.dumps(norm, separators=(",", ":"))`,
  cpp: `string serialize2DCanonical(vector<vector<int>> res) {
  for (auto& r : res) sort(r.begin(), r.end());
  sort(res.begin(), res.end());
  string out = "[";
  for (size_t i = 0; i < res.size(); i++) {
    if (i) out += ",";
    out += "[";
    for (size_t j = 0; j < res[i].size(); j++) { if (j) out += ","; out += to_string(res[i][j]); }
    out += "]";
  }
  return out + "]";
}`,
  javascript: `function serialize2DCanonical(res) {
  const norm = res.map((r) => [...r].sort((a, b) => a - b)).sort((a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
    return a.length - b.length;
  });
  return JSON.stringify(norm);
}`,
};

export const BACKTRACKING_PROBLEMS: CuratedCodingProblem[] = [
  // 1. Subsets (MEDIUM)
  {
    title: "Subsets",
    slug: "subsets",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Recursion & Backtracking",
    statement:
      "Given an integer array nums of unique elements, return all possible subsets (the power set).\n\nThe solution set must not contain duplicate subsets. Return the solution in any order.",
    constraints: ["1 <= nums.length <= 10", "-10 <= nums[i] <= 10", "All numbers of nums are unique."],
    examples: [
      { input: "nums = [1,2,3]", output: "[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]" },
      { input: "nums = [0]", output: "[[],[0]]" },
      { input: "nums = [1,2]", output: "[[],[1],[1,2],[2]]" },
    ],
    hints: [
      "At each index i, you have two choices: include nums[i] or skip nums[i].",
      "Backtrack with a current path and append a copy of path at each recursion node.",
    ],
    starterCode: {
      java: `class Solution {\n  public List<List<Integer>> subsets(int[] nums) {\n    return new ArrayList<>();\n  }\n}`,
      python: `class Solution:\n  def subsets(self, nums: list[int]) -> list[list[int]]:\n    return []`,
      cpp: `class Solution {\npublic:\n  vector<vector<int>> subsets(vector<int>& nums) {\n    return {};\n  }\n};`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar subsets = function(nums) {\n  return [];\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  ${INT_2D_SORT_HELPERS.java}\n  static int[] parseArr(String s) {\n    s = s.trim(); if (s.length() <= 2) return new int[0];\n    String[] p = s.substring(1, s.length()-1).split(",");\n    int[] a = new int[p.length];\n    for (int i = 0; i < p.length; i++) a[i] = Integer.parseInt(p[i].trim());\n    return a;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println(serialize2DCanonical(new Solution().subsets(parseArr(sc.nextLine()))));\n  }\n}`,
      python: `import json, sys\n{{USER_CODE}}\n${INT_2D_SORT_HELPERS.python}\nif __name__ == "__main__":\n  print(serialize_2d_canonical(Solution().subsets(json.loads(sys.stdin.read().strip()))))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\n${INT_2D_SORT_HELPERS.cpp}\nint main() {\n  string s; getline(cin, s);\n  vector<int> a; stringstream ss(s.substr(1, s.size()-2)); string tok;\n  while (getline(ss, tok, ',')) if (!tok.empty()) a.push_back(stoi(tok));\n  cout << serialize2DCanonical(Solution().subsets(a)) << "\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\n${INT_2D_SORT_HELPERS.javascript}\nconsole.log(serialize2DCanonical(subsets(JSON.parse(fs.readFileSync(0, "utf8").trim()))));`,
    },
    testCases: tc([
      ["[1,2,3]", "[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]"],
      ["[0]", "[[],[0]]"],
      ["[1,2]", "[[],[1],[1,2],[2]]"],
      ["[-1]", "[[],[-1]]"],
      ["[-1,1]", "[[],[-1],[-1,1],[1]]"],
      ["[3,2,1]", "[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]"],
      ["[5]", "[[],[5]]"],
      ["[1,4]", "[[],[1],[1,4],[4]]"],
      ["[-2,0,2]", "[[],[-2],[-2,0],[-2,0,2],[-2,2],[0],[0,2],[2]]"],
      ["[2,4,6]", "[[],[2],[2,4],[2,4,6],[2,6],[4],[4,6],[6]]"],
      ["[10,-10]", "[[],[-10],[-10,10],[10]]"],
      ["[7,8]", "[[],[7],[7,8],[8]]"],
      ["[1,2,4]", "[[],[1],[1,2],[1,2,4],[1,4],[2],[2,4],[4]]"],
      ["[9,0]", "[[],[0],[0,9],[9]]"],
      ["[4,5,6]", "[[],[4],[4,5],[4,5,6],[4,6],[5],[5,6],[6]]"],
      ["[-3,-1]", "[[],[-3],[-3,-1],[-1]]"],
      ["[10]", "[[],[10]]"],
      ["[0,1,3]", "[[],[0],[0,1],[0,1,3],[0,3],[1],[1,3],[3]]"],
      ["[2,3]", "[[],[2],[2,3],[3]]"],
      ["[1,5,9]", "[[],[1],[1,5],[1,5,9],[1,9],[5],[5,9],[9]]"],
    ]),
  },

  // 2. Combination Sum (MEDIUM)
  {
    title: "Combination Sum",
    slug: "combination-sum",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Recursion & Backtracking",
    statement:
      "Given an array of distinct integers candidates and a target integer target, return a list of all unique combinations of candidates where the chosen numbers sum to target. You may return the combinations in any order.\n\nThe same number may be chosen from candidates an unlimited number of times.",
    constraints: [
      "1 <= candidates.length <= 30",
      "2 <= candidates[i] <= 40",
      "All elements of candidates are distinct.",
      "1 <= target <= 40",
    ],
    examples: [
      { input: "candidates = [2,3,6,7], target = 7", output: "[[2,2,3],[7]]" },
      { input: "candidates = [2,3,5], target = 8", output: "[[2,2,2,2],[2,3,3],[3,5]]" },
      { input: "candidates = [2], target = 1", output: "[]" },
    ],
    hints: [
      "Sort candidates or pass a start index i so you only pick candidates[j] with j >= i (avoiding duplicate permutations).",
      "Because elements can be reused, recurse with index j (not j+1) and remaining target - candidates[j].",
    ],
    starterCode: {
      java: `class Solution {\n  public List<List<Integer>> combinationSum(int[] candidates, int target) {\n    return new ArrayList<>();\n  }\n}`,
      python: `class Solution:\n  def combinationSum(self, candidates: list[int], target: int) -> list[list[int]]:\n    return []`,
      cpp: `class Solution {\npublic:\n  vector<vector<int>> combinationSum(vector<int>& candidates, int target) {\n    return {};\n  }\n};`,
      javascript: `/**\n * @param {number[]} candidates\n * @param {number} target\n * @return {number[][]}\n */\nvar combinationSum = function(candidates, target) {\n  return [];\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  ${INT_2D_SORT_HELPERS.java}\n  static int[] parseArr(String s) {\n    s = s.trim(); if (s.length() <= 2) return new int[0];\n    String[] p = s.substring(1, s.length()-1).split(",");\n    int[] a = new int[p.length];\n    for (int i = 0; i < p.length; i++) a[i] = Integer.parseInt(p[i].trim());\n    return a;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int[] c = parseArr(sc.nextLine()); int t = Integer.parseInt(sc.nextLine().trim());\n    System.out.println(serialize2DCanonical(new Solution().combinationSum(c, t)));\n  }\n}`,
      python: `import json, sys\n{{USER_CODE}}\n${INT_2D_SORT_HELPERS.python}\nif __name__ == "__main__":\n  lines = sys.stdin.read().splitlines()\n  print(serialize_2d_canonical(Solution().combinationSum(json.loads(lines[0]), int(lines[1]))))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\n${INT_2D_SORT_HELPERS.cpp}\nint main() {\n  string s; getline(cin, s); int t; cin >> t;\n  vector<int> a; stringstream ss(s.substr(1, s.size()-2)); string tok;\n  while (getline(ss, tok, ',')) if (!tok.empty()) a.push_back(stoi(tok));\n  cout << serialize2DCanonical(Solution().combinationSum(a, t)) << "\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\n${INT_2D_SORT_HELPERS.javascript}\nconst lines = fs.readFileSync(0, "utf8").trim().split(/\\r?\\n/);\nconsole.log(serialize2DCanonical(combinationSum(JSON.parse(lines[0]), Number(lines[1]))));`,
    },
    testCases: tc([
      ["[2,3,6,7]\n7", "[[2,2,3],[7]]"],
      ["[2,3,5]\n8", "[[2,2,2,2],[2,3,3],[3,5]]"],
      ["[2]\n1", "[]"],
      ["[2]\n2", "[[2]]"],
      ["[2]\n4", "[[2,2]]"],
      ["[3,5]\n4", "[]"],
      ["[2,4,6]\n6", "[[2,2,2],[2,4],[6]]"],
      ["[3,4,5]\n8", "[[3,5],[4,4]]"],
      ["[7,3,2]\n18", "[[2,2,2,2,2,2,2,2,2],[2,2,2,2,2,2,3,3],[2,2,2,2,3,7],[2,2,2,3,3,3,3],[2,2,7,7],[2,3,3,3,7],[3,3,3,3,3,3]]"],
      ["[5,10]\n15", "[[5,5,5],[5,10]]"],
      ["[2,3]\n6", "[[2,2,2],[3,3]]"],
      ["[4,5]\n9", "[[4,5]]"],
      ["[2,5,10]\n10", "[[2,2,2,2,2],[5,5],[10]]"],
      ["[3,6,9]\n9", "[[3,3,3],[3,6],[9]]"],
      ["[8,7,4,3]\n11", "[[3,4,4],[3,8],[4,7]]"],
      ["[2,3,7]\n7", "[[2,2,3],[7]]"],
      ["[6,8]\n5", "[]"],
      ["[3,5,7]\n10", "[[3,7],[5,5]]"],
      ["[4]\n12", "[[4,4,4]]"],
      ["[2,6]\n8", "[[2,2,2,2],[2,6]]"],
    ]),
  },

  // 3. Permutations (MEDIUM)
  {
    title: "Permutations",
    slug: "permutations",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Recursion & Backtracking",
    statement:
      "Given an array nums of distinct integers, return all the possible permutations. You can return the answer in any order.",
    constraints: ["1 <= nums.length <= 6", "-10 <= nums[i] <= 10", "All the integers of nums are unique."],
    examples: [
      { input: "nums = [1,2,3]", output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]" },
      { input: "nums = [0,1]", output: "[[0,1],[1,0]]" },
      { input: "nums = [1]", output: "[[1]]" },
    ],
    hints: [
      "Track a boolean used[] array of length n while building a permutation of length n.",
      "Whenever path.length == nums.length, push a copy of path to results.",
    ],
    starterCode: {
      java: `class Solution {\n  public List<List<Integer>> permute(int[] nums) {\n    return new ArrayList<>();\n  }\n}`,
      python: `class Solution:\n  def permute(self, nums: list[int]) -> list[list[int]]:\n    return []`,
      cpp: `class Solution {\npublic:\n  vector<vector<int>> permute(vector<int>& nums) {\n    return {};\n  }\n};`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar permute = function(nums) {\n  return [];\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  static String serializePerms(List<List<Integer>> res) {\n    List<List<Integer>> copy = new ArrayList<>(res);\n    copy.sort((a, b) -> {\n      for (int i = 0; i < Math.min(a.size(), b.size()); i++) {\n        int c = Integer.compare(a.get(i), b.get(i));\n        if (c != 0) return c;\n      }\n      return Integer.compare(a.size(), b.size());\n    });\n    StringBuilder sb = new StringBuilder("[");\n    for (int i = 0; i < copy.size(); i++) {\n      if (i > 0) sb.append(","); sb.append("[");\n      for (int j = 0; j < copy.get(i).size(); j++) { if (j > 0) sb.append(","); sb.append(copy.get(i).get(j)); }\n      sb.append("]");\n    }\n    return sb.append("]").toString();\n  }\n  static int[] parseArr(String s) {\n    s = s.trim(); if (s.length() <= 2) return new int[0];\n    String[] p = s.substring(1, s.length()-1).split(",");\n    int[] a = new int[p.length];\n    for (int i = 0; i < p.length; i++) a[i] = Integer.parseInt(p[i].trim());\n    return a;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println(serializePerms(new Solution().permute(parseArr(sc.nextLine()))));\n  }\n}`,
      python: `import json, sys\n{{USER_CODE}}\nif __name__ == "__main__":\n  res = sorted(Solution().permute(json.loads(sys.stdin.read().strip())))\n  print(json.dumps(res, separators=(",", ":")))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\nint main() {\n  string s; getline(cin, s);\n  vector<int> a; stringstream ss(s.substr(1, s.size()-2)); string tok;\n  while (getline(ss, tok, ',')) if (!tok.empty()) a.push_back(stoi(tok));\n  auto res = Solution().permute(a);\n  sort(res.begin(), res.end());\n  cout << "[";\n  for (size_t i = 0; i < res.size(); i++) {\n    if (i) cout << ","; cout << "[";\n    for (size_t j = 0; j < res[i].size(); j++) { if (j) cout << ","; cout << res[i][j]; }\n    cout << "]";\n  }\n  cout << "]\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\nconst res = permute(JSON.parse(fs.readFileSync(0, "utf8").trim())).sort((a, b) => {\n  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];\n  return a.length - b.length;\n});\nconsole.log(JSON.stringify(res));`,
    },
    testCases: tc([
      ["[1,2,3]", "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]"],
      ["[0,1]", "[[0,1],[1,0]]"],
      ["[1]", "[[1]]"],
      ["[-1,1]", "[[-1,1],[1,-1]]"],
      ["[3,1,2]", "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]"],
      ["[5]", "[[5]]"],
      ["[-5]", "[[-5]]"],
      ["[2,4]", "[[2,4],[4,2]]"],
      ["[10,-10]", "[[-10,10],[10,-10]]"],
      ["[0,2,4]", "[[0,2,4],[0,4,2],[2,0,4],[2,4,0],[4,0,2],[4,2,0]]"],
      ["[-1,0,1]", "[[-1,0,1],[-1,1,0],[0,-1,1],[0,1,-1],[1,-1,0],[1,0,-1]]"],
      ["[7,8]", "[[7,8],[8,7]]"],
      ["[9,3]", "[[3,9],[9,3]]"],
      ["[1,4,7]", "[[1,4,7],[1,7,4],[4,1,7],[4,7,1],[7,1,4],[7,4,1]]"],
      ["[2,5,8]", "[[2,5,8],[2,8,5],[5,2,8],[5,8,2],[8,2,5],[8,5,2]]"],
      ["[0]", "[[0]]"],
      ["[6,1]", "[[1,6],[6,1]]"],
      ["[-3,-1]", "[[-3,-1],[-1,-3]]"],
      ["[4,9,2]", "[[2,4,9],[2,9,4],[4,2,9],[4,9,2],[9,2,4],[9,4,2]]"],
      ["[10,20]", "[[10,20],[20,10]]"],
    ]),
  },

  // 4. Letter Combinations of a Phone Number (MEDIUM)
  {
    title: "Letter Combinations of a Phone Number",
    slug: "letter-combinations-of-a-phone-number",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Recursion & Backtracking",
    statement:
      "Given a string containing digits from 2-9 inclusive, return all possible letter combinations that the number could represent. Return the answer in any order.\n\nA mapping of digits to letters (just like on the telephone buttons) is given below: 2->abc, 3->def, 4->ghi, 5->jkl, 6->mno, 7->pqrs, 8->tuv, 9->wxyz.",
    constraints: ["0 <= digits.length <= 4", "digits[i] is a digit in the range ['2', '9']."],
    examples: [
      { input: 'digits = "23"', output: '["ad","ae","af","bd","be","bf","cd","ce","cf"]' },
      { input: 'digits = ""', output: "[]" },
      { input: 'digits = "2"', output: '["a","b","c"]' },
    ],
    hints: [
      "If digits is empty, return [] immediately.",
      "Backtrack index by index, iterating over the 3 or 4 letters mapped to digits[idx].",
    ],
    starterCode: {
      java: `class Solution {\n  public List<String> letterCombinations(String digits) {\n    return new ArrayList<>();\n  }\n}`,
      python: `class Solution:\n  def letterCombinations(self, digits: str) -> list[str]:\n    return []`,
      cpp: `class Solution {\npublic:\n  vector<string> letterCombinations(string digits) {\n    return {};\n  }\n};`,
      javascript: `/**\n * @param {string} digits\n * @return {string[]}\n */\nvar letterCombinations = function(digits) {\n  return [];\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String d = sc.hasNextLine() ? sc.nextLine().trim() : "";\n    List<String> r = new ArrayList<>(new Solution().letterCombinations(d));\n    Collections.sort(r);\n    StringBuilder sb = new StringBuilder("[");\n    for (int i = 0; i < r.size(); i++) { if (i > 0) sb.append(","); sb.append("\\"").append(r.get(i)).append("\\""); }\n    System.out.println(sb.append("]").toString());\n  }\n}`,
      python: `import json, sys\n{{USER_CODE}}\nif __name__ == "__main__":\n  d = sys.stdin.read().strip()\n  r = sorted(Solution().letterCombinations(d))\n  print(json.dumps(r, separators=(",", ":")))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\nint main() {\n  string d; getline(cin, d);\n  auto r = Solution().letterCombinations(d);\n  sort(r.begin(), r.end());\n  cout << "["; for (size_t i = 0; i < r.size(); i++) { if (i) cout << ","; cout << "\\"" << r[i] << "\\""; } cout << "]\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\nconst d = fs.readFileSync(0, "utf8").trim();\nconsole.log(JSON.stringify(letterCombinations(d).sort()));`,
    },
    testCases: tc([
      ["23", '["ad","ae","af","bd","be","bf","cd","ce","cf"]'],
      ["", "[]"],
      ["2", '["a","b","c"]'],
      ["3", '["d","e","f"]'],
      ["7", '["p","q","r","s"]'],
      ["9", '["w","x","y","z"]'],
      ["22", '["aa","ab","ac","ba","bb","bc","ca","cb","cc"]'],
      ["29", '["aw","ax","ay","az","bw","bx","by","bz","cw","cx","cy","cz"]'],
      ["79", '["pw","px","py","pz","qw","qx","qy","qz","rw","rx","ry","rz","sw","sx","sy","sz"]'],
      ["4", '["g","h","i"]'],
      ["5", '["j","k","l"]'],
      ["6", '["m","n","o"]'],
      ["8", '["t","u","v"]'],
      ["34", '["dg","dh","di","eg","eh","ei","fg","fh","fi"]'],
      ["45", '["gj","gk","gl","hj","hk","hl","ij","ik","il"]'],
      ["56", '["jm","jn","jo","km","kn","ko","lm","ln","lo"]'],
      ["68", '["mt","mu","mv","nt","nu","nv","ot","ou","ov"]'],
      ["89", '["tw","tx","ty","tz","uw","ux","uy","uz","vw","vx","vy","vz"]'],
      ["24", '["ag","ah","ai","bg","bh","bi","cg","ch","ci"]'],
      ["35", '["dj","dk","dl","ej","ek","el","fj","fk","fl"]'],
    ]),
  },

  // 5. Unique Paths III (HARD)
  {
    title: "Unique Paths III",
    slug: "unique-paths-iii",
    difficulty: "HARD",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Recursion & Backtracking",
    statement:
      "You are given an m x n integer array grid where grid[i][j] could be:\n- 1 representing the starting square. There is exactly one starting square.\n- 2 representing the ending square. There is exactly one ending square.\n- 0 representing empty squares we can walk over.\n- -1 representing obstacles that we cannot walk over.\n\nReturn the number of 4-directional walks from the starting square to the ending square, that walk over every non-obstacle square exactly once.",
    constraints: ["m == grid.length", "n == grid[i].length", "1 <= m * n <= 20"],
    examples: [
      { input: "grid = [[1,0,0,0],[0,0,0,0],[0,0,2,-1]]", output: "2" },
      { input: "grid = [[1,0,0,0],[0,0,0,0],[0,0,0,2]]", output: "4" },
      { input: "grid = [[0,1],[2,0]]", output: "0" },
    ],
    hints: [
      "Count the total number of walkable cells (non-obstacle cells) and locate the start (1).",
      "Run DFS/backtracking marking visited cells as -1 temporarily, and increment the count when reaching (2) with remaining == 0.",
    ],
    starterCode: {
      java: `class Solution {\n  public int uniquePathsIII(int[][] grid) {\n    return 0;\n  }\n}`,
      python: `class Solution:\n  def uniquePathsIII(self, grid: list[list[int]]) -> int:\n    return 0`,
      cpp: `class Solution {\npublic:\n  int uniquePathsIII(vector<vector<int>>& grid) {\n    return 0;\n  }\n};`,
      javascript: `/**\n * @param {number[][]} grid\n * @return {number}\n */\nvar uniquePathsIII = function(grid) {\n  return 0;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  static int[][] parse2D(String s) {\n    s = s.trim(); if (s.length() <= 2) return new int[0][0];\n    List<int[]> rows = new ArrayList<>(); int i = 1;\n    while (i < s.length() - 1) {\n      int a = s.indexOf('[', i); if (a == -1) break;\n      int b = s.indexOf(']', a);\n      String[] parts = s.substring(a+1, b).trim().split(",");\n      int[] r = new int[parts.length];\n      for (int k = 0; k < parts.length; k++) r[k] = Integer.parseInt(parts[k].trim());\n      rows.add(r); i = b + 1;\n    }\n    return rows.toArray(new int[0][]);\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println(new Solution().uniquePathsIII(parse2D(sc.nextLine())));\n  }\n}`,
      python: `import json, sys\n{{USER_CODE}}\nif __name__ == "__main__":\n  print(Solution().uniquePathsIII(json.loads(sys.stdin.read().strip())))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\nint main() {\n  string s; getline(cin, s);\n  vector<vector<int>> g; size_t i = 1;\n  while (i + 1 < s.size()) {\n    size_t a = s.find('[', i); if (a == string::npos) break;\n    size_t b = s.find(']', a);\n    vector<int> row; stringstream ss(s.substr(a+1, b-a-1)); string tok;\n    while (getline(ss, tok, ',')) if (!tok.empty()) row.push_back(stoi(tok));\n    g.push_back(row); i = b + 1;\n  }\n  cout << Solution().uniquePathsIII(g) << "\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\nconsole.log(uniquePathsIII(JSON.parse(fs.readFileSync(0, "utf8").trim())));`,
    },
    testCases: tc([
      ["[[1,0,0,0],[0,0,0,0],[0,0,2,-1]]", "2"],
      ["[[1,0,0,0],[0,0,0,0],[0,0,0,2]]", "4"],
      ["[[0,1],[2,0]]", "0"],
      ["[[1,2]]", "1"],
      ["[[1,0,2]]", "1"],
      ["[[1,-1,2]]", "0"],
      ["[[1],[0],[2]]", "1"],
      ["[[1,0],[0,2]]", "0"],
      ["[[1,0],[2,-1]]", "0"],
      ["[[1,0,0],[0,0,2]]", "1"],
      ["[[1,0,0],[0,0,0],[0,0,2]]", "2"],
      ["[[2,0,1]]", "1"],
      ["[[1,0,0,2]]", "1"],
      ["[[1,0],[0,0],[0,2]]", "1"],
      ["[[1,0,-1],[0,0,0],[0,0,2]]", "0"],
      ["[[0,0,1],[0,0,0],[2,0,0]]", "2"],
      ["[[1,0,0],[2,0,0]]", "1"],
      ["[[1,0,0,0],[0,-1,-1,2]]", "0"],
      ["[[1,0,0],[0,-1,2]]", "0"],
      ["[[2,-1,1]]", "0"],
    ]),
  },
];
