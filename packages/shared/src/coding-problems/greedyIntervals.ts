import type { CuratedCodingProblem } from "../coding.js";
import { tc } from "./helpers.js";

const MATRIX_INT_HELPERS = {
  java: `static int[][] parse2D(String s) {
    s = s.trim();
    if (s.length() <= 2) return new int[0][0];
    List<int[]> rows = new ArrayList<>();
    int i = 1;
    while (i < s.length() - 1) {
      int a = s.indexOf('[', i);
      if (a == -1) break;
      int b = s.indexOf(']', a);
      String inner = s.substring(a + 1, b).trim();
      if (inner.isEmpty()) rows.add(new int[0]);
      else {
        String[] parts = inner.split(",");
        int[] r = new int[parts.length];
        for (int k = 0; k < parts.length; k++) r[k] = Integer.parseInt(parts[k].trim());
        rows.add(r);
      }
      i = b + 1;
    }
    return rows.toArray(new int[0][]);
  }
  static String serialize2D(int[][] m) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < m.length; i++) {
      if (i > 0) sb.append(",");
      sb.append("[");
      for (int j = 0; j < m[i].length; j++) { if (j > 0) sb.append(","); sb.append(m[i][j]); }
      sb.append("]");
    }
    return sb.append("]").toString();
  }`,
  cpp: `vector<vector<int>> parse2D(const string& s) {
  vector<vector<int>> res;
  size_t i = 1;
  while (i + 1 < s.size()) {
    size_t a = s.find('[', i);
    if (a == string::npos) break;
    size_t b = s.find(']', a);
    string inner = s.substr(a + 1, b - a - 1);
    vector<int> row;
    stringstream ss(inner); string tok;
    while (getline(ss, tok, ',')) if (!tok.empty()) row.push_back(stoi(tok));
    res.push_back(row);
    i = b + 1;
  }
  return res;
}
string serialize2D(const vector<vector<int>>& m) {
  string out = "[";
  for (size_t i = 0; i < m.size(); i++) {
    if (i) out += ",";
    out += "[";
    for (size_t j = 0; j < m[i].size(); j++) { if (j) out += ","; out += to_string(m[i][j]); }
    out += "]";
  }
  return out + "]";
}`,
};

export const GREEDY_INTERVALS_PROBLEMS: CuratedCodingProblem[] = [
  // 1. Assign Cookies (EASY - Greedy)
  {
    title: "Assign Cookies",
    slug: "assign-cookies",
    difficulty: "EASY",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Greedy Algorithms",
    statement:
      "Assume you are an awesome parent and want to give your children some cookies. But, you should give each child at most one cookie.\n\nEach child i has a greed factor g[i], which is the minimum size of a cookie that the child will be content with; and each cookie j has a size s[j]. If s[j] >= g[i], we can assign the cookie j to the child i, and the child i will be content. Your goal is to maximize the number of your content children and output the maximum number.",
    constraints: ["1 <= g.length <= 3 * 10^4", "0 <= s.length <= 3 * 10^4", "1 <= g[i], s[j] <= 2^31 - 1"],
    examples: [
      { input: "g = [1,2,3], s = [1,1]", output: "1" },
      { input: "g = [1,2], s = [1,2,3]", output: "2" },
      { input: "g = [10,9,8,7], s = [5,6,7,8]", output: "2" },
    ],
    hints: [
      "Sort both g and s in ascending order.",
      "Greedily satisfy the least greedy child first using the smallest cookie that fits.",
    ],
    starterCode: {
      java: `class Solution {\n  public int findContentChildren(int[] g, int[] s) {\n    return 0;\n  }\n}`,
      python: `class Solution:\n  def findContentChildren(self, g: list[int], s: list[int]) -> int:\n    return 0`,
      cpp: `class Solution {\npublic:\n  int findContentChildren(vector<int>& g, vector<int>& s) {\n    return 0;\n  }\n};`,
      javascript: `/**\n * @param {number[]} g\n * @param {number[]} s\n * @return {number}\n */\nvar findContentChildren = function(g, s) {\n  return 0;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  static int[] parseArr(String s) {\n    s = s.trim(); if (s.length() <= 2) return new int[0];\n    String[] p = s.substring(1, s.length()-1).split(",");\n    int[] a = new int[p.length];\n    for (int i = 0; i < p.length; i++) a[i] = Integer.parseInt(p[i].trim());\n    return a;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println(new Solution().findContentChildren(parseArr(sc.nextLine()), parseArr(sc.nextLine())));\n  }\n}`,
      python: `import json, sys\n{{USER_CODE}}\nif __name__ == "__main__":\n  lines = sys.stdin.read().splitlines()\n  print(Solution().findContentChildren(json.loads(lines[0]), json.loads(lines[1])))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\nvector<int> parseArr(const string& s) {\n  vector<int> a; if (s.size() <= 2) return a;\n  stringstream ss(s.substr(1, s.size()-2)); string tok;\n  while (getline(ss, tok, ',')) if (!tok.empty()) a.push_back(stoi(tok));\n  return a;\n}\nint main() {\n  string l1, l2; getline(cin, l1); getline(cin, l2);\n  auto g = parseArr(l1), s = parseArr(l2);\n  cout << Solution().findContentChildren(g, s) << "\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\nconst lines = fs.readFileSync(0, "utf8").trim().split(/\\r?\\n/);\nconsole.log(findContentChildren(JSON.parse(lines[0]), JSON.parse(lines[1])));`,
    },
    testCases: tc([
      ["[1,2,3]\n[1,1]", "1"],
      ["[1,2]\n[1,2,3]", "2"],
      ["[10,9,8,7]\n[5,6,7,8]", "2"],
      ["[1,2,3]\n[]", "0"],
      ["[5]\n[4]", "0"],
      ["[5]\n[5]", "1"],
      ["[1,2,3,4]\n[1,2,3,4]", "4"],
      ["[4,3,2,1]\n[1,1,1,1]", "1"],
      ["[2,3,4]\n[1,1,1]", "0"],
      ["[1,1,1]\n[2,2,2]", "3"],
      ["[3,3,3]\n[3,3]", "2"],
      ["[1,5,10]\n[2,6,11]", "3"],
      ["[2,4,6]\n[1,3,5]", "2"],
      ["[10,20,30]\n[15,25,35]", "3"],
      ["[5,6,7]\n[1,2,3,4]", "0"],
      ["[1,2,3]\n[3]", "1"],
      ["[2,2,2]\n[1,2,3]", "2"],
      ["[7,8,9,10]\n[5,6,7,8]", "2"],
      ["[1]\n[100]", "1"],
      ["[4,5,6]\n[6,5,4]", "3"],
    ]),
  },

  // 2. Lemonade Change (EASY - Greedy)
  {
    title: "Lemonade Change",
    slug: "lemonade-change",
    difficulty: "EASY",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Greedy Algorithms",
    statement:
      "At a lemonade stand, each lemonade costs $5. Customers are standing in a queue to buy from you and order one at a time (in the order specified by bills). Each customer will only buy one lemonade and pay with either a $5, $10, or $20 bill. You must provide the correct change to each customer so that the net transaction is that the customer pays $5.\n\nReturn true if you can provide every customer with the correct change, or false otherwise.",
    constraints: ["1 <= bills.length <= 10^5", "bills[i] is either 5, 10, or 20."],
    examples: [
      { input: "bills = [5,5,5,10,20]", output: "true" },
      { input: "bills = [5,5,10,10,20]", output: "false" },
      { input: "bills = [5,5,10]", output: "true" },
    ],
    hints: [
      "Track counts of $5 and $10 bills.",
      "For a $20 bill, greedily prefer giving one $10 + one $5 over three $5 bills, because $5 bills are more versatile.",
    ],
    starterCode: {
      java: `class Solution {\n  public boolean lemonadeChange(int[] bills) {\n    return false;\n  }\n}`,
      python: `class Solution:\n  def lemonadeChange(self, bills: list[int]) -> bool:\n    return False`,
      cpp: `class Solution {\npublic:\n  bool lemonadeChange(vector<int>& bills) {\n    return false;\n  }\n};`,
      javascript: `/**\n * @param {number[]} bills\n * @return {boolean}\n */\nvar lemonadeChange = function(bills) {\n  return false;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  static int[] parseArr(String s) {\n    s = s.trim(); if (s.length() <= 2) return new int[0];\n    String[] p = s.substring(1, s.length()-1).split(",");\n    int[] a = new int[p.length];\n    for (int i = 0; i < p.length; i++) a[i] = Integer.parseInt(p[i].trim());\n    return a;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println(new Solution().lemonadeChange(parseArr(sc.nextLine())));\n  }\n}`,
      python: `import json, sys\n{{USER_CODE}}\nif __name__ == "__main__":\n  print("true" if Solution().lemonadeChange(json.loads(sys.stdin.read().strip())) else "false")`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\nint main() {\n  string s; getline(cin, s);\n  vector<int> a; stringstream ss(s.substr(1, s.size()-2)); string tok;\n  while (getline(ss, tok, ',')) if (!tok.empty()) a.push_back(stoi(tok));\n  cout << (Solution().lemonadeChange(a) ? "true" : "false") << "\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\nconsole.log(lemonadeChange(JSON.parse(fs.readFileSync(0, "utf8").trim())) ? "true" : "false");`,
    },
    testCases: tc([
      ["[5,5,5,10,20]", "true"],
      ["[5,5,10,10,20]", "false"],
      ["[5,5,10]", "true"],
      ["[10,10]", "false"],
      ["[20]", "false"],
      ["[5]", "true"],
      ["[5,10,5,20]", "true"],
      ["[5,5,5,20]", "true"],
      ["[5,5,20]", "false"],
      ["[5,10,20]", "false"],
      ["[5,5,5,5,20,20]", "false"],
      ["[5,5,5,5,10,20,10,20]", "true"],
      ["[5,5,10,20,5,5,5,5,5,5,5,5,5,10,5,5,20,5,20,5]", "true"],
      ["[5,5,5,10,5,5,10,20,20,20]", "false"],
      ["[5,10,5,10,5,10]", "true"],
      ["[5,5,5,5,5]", "true"],
      ["[5,20]", "false"],
      ["[5,5,10,5,20]", "true"],
      ["[5,10,5,5,20,5,10]", "true"],
      ["[5,5,10,10,5,20,20]", "false"],
    ]),
  },

  // 3. Jump Game (MEDIUM - Greedy)
  {
    title: "Jump Game",
    slug: "jump-game",
    difficulty: "MEDIUM",
    pattern: "DYNAMIC_PROGRAMMING",
    sheetPattern: "Greedy Algorithms",
    statement:
      "You are given an integer array nums. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.\n\nReturn true if you can reach the last index, or false otherwise.",
    constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 10^5"],
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "true" },
      { input: "nums = [3,2,1,0,4]", output: "false" },
      { input: "nums = [0]", output: "true" },
    ],
    hints: [
      "Track the farthest reachable index `maxReach` as you scan left to right.",
      "If at any index i you have i > maxReach, return false immediately.",
    ],
    starterCode: {
      java: `class Solution {\n  public boolean canJump(int[] nums) {\n    return false;\n  }\n}`,
      python: `class Solution:\n  def canJump(self, nums: list[int]) -> bool:\n    return False`,
      cpp: `class Solution {\npublic:\n  bool canJump(vector<int>& nums) {\n    return false;\n  }\n};`,
      javascript: `/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar canJump = function(nums) {\n  return false;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  static int[] parseArr(String s) {\n    s = s.trim(); if (s.length() <= 2) return new int[0];\n    String[] p = s.substring(1, s.length()-1).split(",");\n    int[] a = new int[p.length];\n    for (int i = 0; i < p.length; i++) a[i] = Integer.parseInt(p[i].trim());\n    return a;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println(new Solution().canJump(parseArr(sc.nextLine())));\n  }\n}`,
      python: `import json, sys\n{{USER_CODE}}\nif __name__ == "__main__":\n  print("true" if Solution().canJump(json.loads(sys.stdin.read().strip())) else "false")`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\nint main() {\n  string s; getline(cin, s);\n  vector<int> a; stringstream ss(s.substr(1, s.size()-2)); string tok;\n  while (getline(ss, tok, ',')) if (!tok.empty()) a.push_back(stoi(tok));\n  cout << (Solution().canJump(a) ? "true" : "false") << "\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\nconsole.log(canJump(JSON.parse(fs.readFileSync(0, "utf8").trim())) ? "true" : "false");`,
    },
    testCases: tc([
      ["[2,3,1,1,4]", "true"],
      ["[3,2,1,0,4]", "false"],
      ["[0]", "true"],
      ["[2,0]", "true"],
      ["[0,1]", "false"],
      ["[1,1,1,1]", "true"],
      ["[1,0,1,0]", "false"],
      ["[2,0,0]", "true"],
      ["[1,2,3]", "true"],
      ["[4,0,0,0,0]", "true"],
      ["[3,0,0,0,1]", "false"],
      ["[5,9,3,2,1,0,2,3,3,1,0,0]", "true"],
      ["[1,1,0,1]", "false"],
      ["[2,5,0,0]", "true"],
      ["[0,2,3]", "false"],
      ["[1,0]", "true"],
      ["[3,0,8,2,0,0,1]", "true"],
      ["[2,1,0,0]", "false"],
      ["[10,0,0,0,0,0,0]", "true"],
      ["[1,2,0,1,0,0]", "false"],
    ]),
  },

  // 4. Gas Station (MEDIUM - Greedy)
  {
    title: "Gas Station",
    slug: "gas-station",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Greedy Algorithms",
    statement:
      "There are n gas stations along a circular route, where the amount of gas at the ith station is gas[i]. You have a car with an unlimited gas tank and it costs cost[i] of gas to travel from the ith station to its next (i + 1)th station.\n\nGiven two integer arrays gas and cost, return the starting gas station's index if you can travel around the circuit once in the clockwise direction, otherwise return -1.",
    constraints: ["n == gas.length == cost.length", "1 <= n <= 10^5", "0 <= gas[i], cost[i] <= 10^4"],
    examples: [
      { input: "gas = [1,2,3,4,5], cost = [3,4,5,1,2]", output: "3" },
      { input: "gas = [2,3,4], cost = [3,4,3]", output: "-1" },
      { input: "gas = [5,1,2,3,4], cost = [4,4,1,5,1]", output: "4" },
    ],
    hints: [
      "If total gas < total cost, no circular tour is possible (-1).",
      "Whenever running tank drops below 0 at index i, reset start = i + 1 and tank = 0.",
    ],
    starterCode: {
      java: `class Solution {\n  public int canCompleteCircuit(int[] gas, int[] cost) {\n    return -1;\n  }\n}`,
      python: `class Solution:\n  def canCompleteCircuit(self, gas: list[int], cost: list[int]) -> int:\n    return -1`,
      cpp: `class Solution {\npublic:\n  int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {\n    return -1;\n  }\n};`,
      javascript: `/**\n * @param {number[]} gas\n * @param {number[]} cost\n * @return {number}\n */\nvar canCompleteCircuit = function(gas, cost) {\n  return -1;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  static int[] parseArr(String s) {\n    s = s.trim(); if (s.length() <= 2) return new int[0];\n    String[] p = s.substring(1, s.length()-1).split(",");\n    int[] a = new int[p.length];\n    for (int i = 0; i < p.length; i++) a[i] = Integer.parseInt(p[i].trim());\n    return a;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println(new Solution().canCompleteCircuit(parseArr(sc.nextLine()), parseArr(sc.nextLine())));\n  }\n}`,
      python: `import json, sys\n{{USER_CODE}}\nif __name__ == "__main__":\n  lines = sys.stdin.read().splitlines()\n  print(Solution().canCompleteCircuit(json.loads(lines[0]), json.loads(lines[1])))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\nvector<int> parseArr(const string& s) {\n  vector<int> a; if (s.size() <= 2) return a;\n  stringstream ss(s.substr(1, s.size()-2)); string tok;\n  while (getline(ss, tok, ',')) if (!tok.empty()) a.push_back(stoi(tok));\n  return a;\n}\nint main() {\n  string l1, l2; getline(cin, l1); getline(cin, l2);\n  auto g = parseArr(l1), c = parseArr(l2);\n  cout << Solution().canCompleteCircuit(g, c) << "\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\nconst lines = fs.readFileSync(0, "utf8").trim().split(/\\r?\\n/);\nconsole.log(canCompleteCircuit(JSON.parse(lines[0]), JSON.parse(lines[1])));`,
    },
    testCases: tc([
      ["[1,2,3,4,5]\n[3,4,5,1,2]", "3"],
      ["[2,3,4]\n[3,4,3]", "-1"],
      ["[5,1,2,3,4]\n[4,4,1,5,1]", "4"],
      ["[4]\n[5]", "-1"],
      ["[5]\n[4]", "0"],
      ["[3,1,1]\n[1,2,2]", "0"],
      ["[5,8,2,8]\n[6,5,6,6]", "3"],
      ["[1,2,3,4,5]\n[3,4,5,1,3]", "-1"],
      ["[0,0,0]\n[0,0,0]", "0"],
      ["[2,0,1,2,3,4,0]\n[0,1,0,0,0,0,11]", "0"],
      ["[6,1,4,3,5]\n[3,8,2,4,2]", "2"],
      ["[1,2]\n[2,1]", "1"],
      ["[2,1]\n[1,2]", "0"],
      ["[4,5,2,6,5,3]\n[3,2,7,3,2,9]", "-1"],
      ["[7,1,0,11,4]\n[5,9,1,2,5]", "3"],
      ["[1,1,1,10]\n[2,2,2,2]", "3"],
      ["[3,3,4]\n[3,4,4]", "-1"],
      ["[5,5,1,3,4]\n[8,1,7,1,1]", "3"],
      ["[2,3,4,5]\n[2,3,4,5]", "0"],
      ["[1,3,5,2]\n[2,4,1,4]", "2"],
    ]),
  },

  // 5. Candy (HARD - Greedy)
  {
    title: "Candy",
    slug: "candy",
    difficulty: "HARD",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Greedy Algorithms",
    statement:
      "There are n children standing in a line. Each child is assigned a rating value given in the integer array ratings.\n\nYou are giving candies to these children subjected to the following requirements:\n- Each child must have at least one candy.\n- Children with a higher rating get more candies than their neighbors.\n\nReturn the minimum number of candies you need to have to distribute the candies to the children.",
    constraints: ["n == ratings.length", "1 <= n <= 2 * 10^4", "0 <= ratings[i] <= 2 * 10^4"],
    examples: [
      { input: "ratings = [1,0,2]", output: "5" },
      { input: "ratings = [1,2,2]", output: "4" },
      { input: "ratings = [1,3,2,2,1]", output: "7" },
    ],
    hints: [
      "Initialize every child with 1 candy.",
      "Do a left-to-right pass (if ratings[i] > ratings[i-1], candies[i] = candies[i-1] + 1), then a right-to-left pass (if ratings[i] > ratings[i+1], candies[i] = max(candies[i], candies[i+1] + 1)).",
    ],
    starterCode: {
      java: `class Solution {\n  public int candy(int[] ratings) {\n    return 0;\n  }\n}`,
      python: `class Solution:\n  def candy(self, ratings: list[int]) -> int:\n    return 0`,
      cpp: `class Solution {\npublic:\n  int candy(vector<int>& ratings) {\n    return 0;\n  }\n};`,
      javascript: `/**\n * @param {number[]} ratings\n * @return {number}\n */\nvar candy = function(ratings) {\n  return 0;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  static int[] parseArr(String s) {\n    s = s.trim(); if (s.length() <= 2) return new int[0];\n    String[] p = s.substring(1, s.length()-1).split(",");\n    int[] a = new int[p.length];\n    for (int i = 0; i < p.length; i++) a[i] = Integer.parseInt(p[i].trim());\n    return a;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println(new Solution().candy(parseArr(sc.nextLine())));\n  }\n}`,
      python: `import json, sys\n{{USER_CODE}}\nif __name__ == "__main__":\n  print(Solution().candy(json.loads(sys.stdin.read().strip())))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\nint main() {\n  string s; getline(cin, s);\n  vector<int> a; stringstream ss(s.substr(1, s.size()-2)); string tok;\n  while (getline(ss, tok, ',')) if (!tok.empty()) a.push_back(stoi(tok));\n  cout << Solution().candy(a) << "\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\nconsole.log(candy(JSON.parse(fs.readFileSync(0, "utf8").trim())));`,
    },
    testCases: tc([
      ["[1,0,2]", "5"],
      ["[1,2,2]", "4"],
      ["[1,3,2,2,1]", "7"],
      ["[1]", "1"],
      ["[1,2,3,4,5]", "15"],
      ["[5,4,3,2,1]", "15"],
      ["[2,2,2,2]", "4"],
      ["[1,3,4,5,2]", "11"],
      ["[1,2,87,87,87,2,1]", "13"],
      ["[0,1,2,3,2,1,0]", "16"],
      ["[3,2,1,2,3]", "11"],
      ["[1,6,10,8,7,3,2]", "18"],
      ["[29,51,87,87,72,12]", "12"],
      ["[1,2,3,1,0]", "9"],
      ["[4,2,3,4,1]", "9"],
      ["[10,10,10]", "3"],
      ["[0]", "1"],
      ["[1,2]", "3"],
      ["[2,1]", "3"],
      ["[1,3,2,1]", "7"],
    ]),
  },

  // 6. Meeting Rooms (EASY - Intervals)
  {
    title: "Meeting Rooms",
    slug: "meeting-rooms",
    difficulty: "EASY",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Intervals",
    statement:
      "Given an array of meeting time intervals where intervals[i] = [start_i, end_i], determine if a person could attend all meetings.",
    constraints: ["0 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start_i < end_i <= 10^6"],
    examples: [
      { input: "intervals = [[0,30],[5,10],[15,20]]", output: "false" },
      { input: "intervals = [[7,10],[2,4]]", output: "true" },
      { input: "intervals = []", output: "true" },
    ],
    hints: [
      "Sort the intervals by start time.",
      "Check if any interval starts strictly before the previous interval ends (intervals[i][0] < intervals[i-1][1]).",
    ],
    starterCode: {
      java: `class Solution {\n  public boolean canAttendMeetings(int[][] intervals) {\n    return false;\n  }\n}`,
      python: `class Solution:\n  def canAttendMeetings(self, intervals: list[list[int]]) -> bool:\n    return False`,
      cpp: `class Solution {\npublic:\n  bool canAttendMeetings(vector<vector<int>>& intervals) {\n    return false;\n  }\n};`,
      javascript: `/**\n * @param {number[][]} intervals\n * @return {boolean}\n */\nvar canAttendMeetings = function(intervals) {\n  return false;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  ${MATRIX_INT_HELPERS.java}\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println(new Solution().canAttendMeetings(parse2D(sc.nextLine())));\n  }\n}`,
      python: `import json, sys\n{{USER_CODE}}\nif __name__ == "__main__":\n  print("true" if Solution().canAttendMeetings(json.loads(sys.stdin.read().strip())) else "false")`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\n${MATRIX_INT_HELPERS.cpp}\nint main() {\n  string s; getline(cin, s);\n  auto m = parse2D(s);\n  cout << (Solution().canAttendMeetings(m) ? "true" : "false") << "\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\nconsole.log(canAttendMeetings(JSON.parse(fs.readFileSync(0, "utf8").trim())) ? "true" : "false");`,
    },
    testCases: tc([
      ["[[0,30],[5,10],[15,20]]", "false"],
      ["[[7,10],[2,4]]", "true"],
      ["[]", "true"],
      ["[[1,5]]", "true"],
      ["[[1,5],[5,10]]", "true"],
      ["[[1,5],[4,10]]", "false"],
      ["[[5,8],[6,8]]", "false"],
      ["[[10,20],[0,5],[5,10]]", "true"],
      ["[[0,1],[1,2],[2,3],[3,4]]", "true"],
      ["[[0,2],[1,3],[2,4]]", "false"],
      ["[[8,11],[17,20],[17,20]]", "false"],
      ["[[1,3],[4,6],[7,9]]", "true"],
      ["[[100,200],[50,100],[200,300]]", "true"],
      ["[[10,15],[12,18]]", "false"],
      ["[[1,100],[2,3]]", "false"],
      ["[[20,30],[10,15],[0,5]]", "true"],
      ["[[1,2],[2,3],[1,3]]", "false"],
      ["[[0,10],[10,20],[20,30]]", "true"],
      ["[[5,10],[0,6]]", "false"],
      ["[[3,7],[8,12],[13,15]]", "true"],
    ]),
  },

  // 7. Merge Intervals (MEDIUM - Intervals)
  {
    title: "Merge Intervals",
    slug: "merge-intervals",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Intervals",
    statement:
      "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    constraints: ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start_i <= end_i <= 10^4"],
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" },
      { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]" },
      { input: "intervals = [[1,4],[2,3]]", output: "[[1,4]]" },
    ],
    hints: [
      "Sort intervals by start time ascending.",
      "Maintain a merged list; if current[0] <= lastMerged[1], extend lastMerged[1] = max(lastMerged[1], current[1]), else push current.",
    ],
    starterCode: {
      java: `class Solution {\n  public int[][] merge(int[][] intervals) {\n    return new int[0][0];\n  }\n}`,
      python: `class Solution:\n  def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n    return []`,
      cpp: `class Solution {\npublic:\n  vector<vector<int>> merge(vector<vector<int>>& intervals) {\n    return {};\n  }\n};`,
      javascript: `/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nvar merge = function(intervals) {\n  return [];\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  ${MATRIX_INT_HELPERS.java}\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println(serialize2D(new Solution().merge(parse2D(sc.nextLine()))));\n  }\n}`,
      python: `import json, sys\n{{USER_CODE}}\nif __name__ == "__main__":\n  res = Solution().merge(json.loads(sys.stdin.read().strip()))\n  print(json.dumps(res, separators=(",", ":")))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\n${MATRIX_INT_HELPERS.cpp}\nint main() {\n  string s; getline(cin, s);\n  auto m = parse2D(s);\n  cout << serialize2D(Solution().merge(m)) << "\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\nconsole.log(JSON.stringify(merge(JSON.parse(fs.readFileSync(0, "utf8").trim()))));`,
    },
    testCases: tc([
      ["[[1,3],[2,6],[8,10],[15,18]]", "[[1,6],[8,10],[15,18]]"],
      ["[[1,4],[4,5]]", "[[1,5]]"],
      ["[[1,4],[2,3]]", "[[1,4]]"],
      ["[[1,4],[0,4]]", "[[0,4]]"],
      ["[[1,4],[0,0]]", "[[0,0],[1,4]]"],
      ["[[1,4],[0,2],[3,5]]", "[[0,5]]"],
      ["[[2,3],[4,5],[6,7],[8,9],[1,10]]", "[[1,10]]"],
      ["[[1,2]]", "[[1,2]]"],
      ["[[0,0]]", "[[0,0]]"],
      ["[[1,3],[5,7],[9,11]]", "[[1,3],[5,7],[9,11]]"],
      ["[[1,5],[2,3],[3,4]]", "[[1,5]]"],
      ["[[10,12],[1,3],[2,6]]", "[[1,6],[10,12]]"],
      ["[[0,5],[5,10],[10,15]]", "[[0,15]]"],
      ["[[3,3],[1,2],[2,3]]", "[[1,3]]"],
      ["[[1,4],[5,6]]", "[[1,4],[5,6]]"],
      ["[[2,6],[1,3],[15,18],[8,10]]", "[[1,6],[8,10],[15,18]]"],
      ["[[1,10],[2,3],[4,5],[6,7]]", "[[1,10]]"],
      ["[[0,1],[2,3],[0,3]]", "[[0,3]]"],
      ["[[5,7],[1,3],[2,5]]", "[[1,7]]"],
      ["[[1,2],[3,4],[2,3]]", "[[1,4]]"],
    ]),
  },

  // 8. Non-overlapping Intervals (MEDIUM - Intervals)
  {
    title: "Non-overlapping Intervals",
    slug: "non-overlapping-intervals",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Intervals",
    statement:
      "Given an array of intervals intervals where intervals[i] = [start_i, end_i], return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.",
    constraints: ["1 <= intervals.length <= 10^5", "intervals[i].length == 2", "-5 * 10^4 <= start_i < end_i <= 5 * 10^4"],
    examples: [
      { input: "intervals = [[1,2],[2,3],[3,4],[1,3]]", output: "1" },
      { input: "intervals = [[1,2],[1,2],[1,2]]", output: "2" },
      { input: "intervals = [[1,2],[2,3]]", output: "0" },
    ],
    hints: [
      "Sort intervals by end time ascending (classic activity selection).",
      "Always keep the interval that finishes earliest so you leave maximum room for subsequent intervals.",
    ],
    starterCode: {
      java: `class Solution {\n  public int eraseOverlapIntervals(int[][] intervals) {\n    return 0;\n  }\n}`,
      python: `class Solution:\n  def eraseOverlapIntervals(self, intervals: list[list[int]]) -> int:\n    return 0`,
      cpp: `class Solution {\npublic:\n  int eraseOverlapIntervals(vector<vector<int>>& intervals) {\n    return 0;\n  }\n};`,
      javascript: `/**\n * @param {number[][]} intervals\n * @return {number}\n */\nvar eraseOverlapIntervals = function(intervals) {\n  return 0;\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  ${MATRIX_INT_HELPERS.java}\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println(new Solution().eraseOverlapIntervals(parse2D(sc.nextLine())));\n  }\n}`,
      python: `import json, sys\n{{USER_CODE}}\nif __name__ == "__main__":\n  print(Solution().eraseOverlapIntervals(json.loads(sys.stdin.read().strip())))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\n${MATRIX_INT_HELPERS.cpp}\nint main() {\n  string s; getline(cin, s);\n  auto m = parse2D(s);\n  cout << Solution().eraseOverlapIntervals(m) << "\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\nconsole.log(eraseOverlapIntervals(JSON.parse(fs.readFileSync(0, "utf8").trim())));`,
    },
    testCases: tc([
      ["[[1,2],[2,3],[3,4],[1,3]]", "1"],
      ["[[1,2],[1,2],[1,2]]", "2"],
      ["[[1,2],[2,3]]", "0"],
      ["[[1,100],[11,22],[1,11],[2,12]]", "2"],
      ["[[0,2],[1,3],[2,4],[3,5],[4,6]]", "2"],
      ["[[1,2]]", "0"],
      ["[[-5,-1],[-3,0],[0,5]]", "1"],
      ["[[1,5],[2,3],[3,4],[4,5]]", "1"],
      ["[[1,10],[2,3],[3,4],[4,5]]", "1"],
      ["[[0,1],[3,4],[1,2]]", "0"],
      ["[[-100,-50],[-60,-40],[-40,0]]", "1"],
      ["[[1,3],[2,4],[3,5]]", "1"],
      ["[[1,4],[2,3],[3,5]]", "1"],
      ["[[1,2],[1,3],[1,4],[1,5]]", "3"],
      ["[[0,10],[2,5],[6,9]]", "1"],
      ["[[-2,0],[0,2],[-1,1]]", "1"],
      ["[[10,20],[20,30],[30,40]]", "0"],
      ["[[1,5],[1,5],[2,6]]", "2"],
      ["[[2,4],[1,3],[3,5],[4,6]]", "2"],
      ["[[0,5],[1,2],[2,3],[3,4]]", "1"],
    ]),
  },

  // 9. Minimum Interval to Include Each Query (HARD - Intervals)
  {
    title: "Minimum Interval to Include Each Query",
    slug: "minimum-interval-to-include-each-query",
    difficulty: "HARD",
    pattern: "BINARY_SEARCH",
    sheetPattern: "Intervals",
    statement:
      "You are given a 2D integer array intervals, where intervals[i] = [left_i, right_i] describes the ith interval starting at left_i and ending at right_i (inclusive). The size of an interval is defined as right_i - left_i + 1.\n\nYou are also given an integer array queries. The answer to the jth query is the size of the smallest interval i such that left_i <= queries[j] <= right_i. If no such interval exists, the answer is -1.\n\nReturn an array containing the answers to the queries.",
    constraints: [
      "1 <= intervals.length <= 10^5",
      "1 <= queries.length <= 10^5",
      "1 <= left_i <= right_i <= 10^7",
      "1 <= queries[j] <= 10^7",
    ],
    examples: [
      { input: "intervals = [[1,4],[2,4],[3,6],[4,4]], queries = [2,3,4,5]", output: "[3,3,1,4]" },
      { input: "intervals = [[2,3],[2,5],[1,8],[20,25]], queries = [2,19,5,22]", output: "[2,-1,4,6]" },
      { input: "intervals = [[1,5]], queries = [1,5,6]", output: "[5,5,-1]" },
    ],
    hints: [
      "Sort intervals by left_i and sort query indices by query value.",
      "Sweep queries in ascending order with a min-heap ordered by interval size: push intervals with left <= q, pop intervals with right < q.",
    ],
    starterCode: {
      java: `class Solution {\n  public int[] minInterval(int[][] intervals, int[] queries) {\n    return new int[0];\n  }\n}`,
      python: `class Solution:\n  def minInterval(self, intervals: list[list[int]], queries: list[int]) -> list[int]:\n    return []`,
      cpp: `class Solution {\npublic:\n  vector<int> minInterval(vector<vector<int>>& intervals, vector<int>& queries) {\n    return {};\n  }\n};`,
      javascript: `/**\n * @param {number[][]} intervals\n * @param {number[]} queries\n * @return {number[]}\n */\nvar minInterval = function(intervals, queries) {\n  return [];\n};`,
    },
    driverCode: {
      java: `import java.util.*;\n{{USER_CODE}}\npublic class Main {\n  ${MATRIX_INT_HELPERS.java}\n  static int[] parseArr(String s) {\n    s = s.trim(); if (s.length() <= 2) return new int[0];\n    String[] p = s.substring(1, s.length()-1).split(",");\n    int[] a = new int[p.length];\n    for (int i = 0; i < p.length; i++) a[i] = Integer.parseInt(p[i].trim());\n    return a;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int[] r = new Solution().minInterval(parse2D(sc.nextLine()), parseArr(sc.nextLine()));\n    StringBuilder sb = new StringBuilder("[");\n    for (int i = 0; i < r.length; i++) { if (i > 0) sb.append(","); sb.append(r[i]); }\n    System.out.println(sb.append("]").toString());\n  }\n}`,
      python: `import heapq, json, sys\n{{USER_CODE}}\nif __name__ == "__main__":\n  lines = sys.stdin.read().splitlines()\n  res = Solution().minInterval(json.loads(lines[0]), json.loads(lines[1]))\n  print(json.dumps(res, separators=(",", ":")))`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n{{USER_CODE}}\n${MATRIX_INT_HELPERS.cpp}\nvector<int> parseArr(const string& s) {\n  vector<int> a; if (s.size() <= 2) return a;\n  stringstream ss(s.substr(1, s.size()-2)); string tok;\n  while (getline(ss, tok, ',')) if (!tok.empty()) a.push_back(stoi(tok));\n  return a;\n}\nint main() {\n  string l1, l2; getline(cin, l1); getline(cin, l2);\n  auto iv = parse2D(l1); auto q = parseArr(l2);\n  auto r = Solution().minInterval(iv, q);\n  cout << "["; for (size_t i = 0; i < r.size(); i++) { if (i) cout << ","; cout << r[i]; } cout << "]\\n";\n}`,
      javascript: `const fs = require("fs");\n{{USER_CODE}}\nconst lines = fs.readFileSync(0, "utf8").trim().split(/\\r?\\n/);\nconsole.log(JSON.stringify(minInterval(JSON.parse(lines[0]), JSON.parse(lines[1]))));`,
    },
    testCases: tc([
      ["[[1,4],[2,4],[3,6],[4,4]]\n[2,3,4,5]", "[3,3,1,4]"],
      ["[[2,3],[2,5],[1,8],[20,25]]\n[2,19,5,22]", "[2,-1,4,6]"],
      ["[[1,5]]\n[1,5,6]", "[5,5,-1]"],
      ["[[1,1]]\n[1,2]", "[1,-1]"],
      ["[[5,10],[1,20]]\n[7,2,25]", "[6,20,-1]"],
      ["[[1,10],[2,3],[4,6]]\n[1,2,3,4,5,6,7]", "[10,2,2,3,3,3,10]"],
      ["[[4,5],[5,8],[1,9],[8,10],[1,6]]\n[7,9,3,9,3]", "[4,3,6,3,6]"],
      ["[[10,12],[1,100]]\n[11,50,101]", "[3,100,-1]"],
      ["[[2,2],[3,3],[4,4]]\n[1,2,3,4,5]", "[-1,1,1,1,-1]"],
      ["[[1,4],[2,3]]\n[2,3,4,1]", "[2,2,4,4]"],
      ["[[3,5],[1,10]]\n[3,4,5,6]", "[3,3,3,10]"],
      ["[[100,200]]\n[99,100,150,200,201]", "[-1,101,101,101,-1]"],
      ["[[1,2],[2,3],[3,4]]\n[2,3]", "[2,2]"],
      ["[[1,5],[2,4],[3,3]]\n[1,2,3,4,5]", "[5,3,1,3,5]"],
      ["[[5,6],[1,2]]\n[3,4]", "[-1,-1]"],
      ["[[1,8],[4,5],[4,6]]\n[4,5,6,7]", "[2,2,3,8]"],
      ["[[1,3],[2,6]]\n[1,2,3,4,5,6]", "[3,3,3,5,5,5]"],
      ["[[10,10]]\n[10]", "[1]"],
      ["[[2,8],[3,5],[6,7]]\n[3,5,6,7,8]", "[3,3,2,2,7]"],
      ["[[1,1000],[500,500]]\n[500,501]", "[1,1000]"],
    ]),
  },
];
