import type { CuratedCodingProblem, CuratedTestCase } from "../coding.js";

function tc(
  cases: Array<[stdin: string, expectedOutput: string]>
): CuratedTestCase[] {
  return cases.map(([stdin, expectedOutput], idx) => ({
    id: idx < 3 ? `sample-${idx + 1}` : `hidden-${idx - 2}`,
    stdin,
    expectedOutput,
    isHidden: idx >= 3,
  }));
}

export const ARRAYS_HASHING_PROBLEMS: CuratedCodingProblem[] = [
  // 1. Two Sum (EASY)
  {
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "EASY",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Arrays & Hashing",
    statement:
      "Given an array of integers nums and an integer target, return indices [i, j] (i < j) of the two numbers such that they add up to target. If no valid pair exists, return [-1, -1].",
    constraints: [
      "2 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "At most one valid pair is assumed when a solution exists.",
    ],
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "nums[0] + nums[1] == 9, so return [0, 1].",
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
        explanation: "nums[1] + nums[2] == 6, so return [1, 2].",
      },
      {
        input: "nums = [3, 3], target = 6",
        output: "[0, 1]",
        explanation: "nums[0] + nums[1] == 6, so return [0, 1].",
      },
    ],
    hints: [
      "A brute-force nested loop takes O(n^2) time. Can you look up the complement in O(1)?",
      "Store previously seen values and their indices in a hash map as you iterate.",
      "For each element x, check if (target - x) already exists in the map before inserting x.",
    ],
    starterCode: {
      java: `class Solution {
  public int[] twoSum(int[] nums, int target) {
    // Write your solution here
    return new int[]{-1, -1};
  }
}`,
      python: `class Solution:
  def twoSum(self, nums: list[int], target: int) -> list[int]:
    # Write your solution here
    return [-1, -1]`,
      cpp: `class Solution {
public:
  vector<int> twoSum(vector<int>& nums, int target) {
    // Write your solution here
    return {-1, -1};
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
  // Write your solution here
  return [-1, -1];
};`,
    },
    driverCode: {
      java: `import java.util.*;
{{USER_CODE}}
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    if (!sc.hasNextInt()) return;
    int n = sc.nextInt();
    int[] nums = new int[n];
    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
    int target = sc.nextInt();
    int[] res = new Solution().twoSum(nums, target);
    System.out.println("[" + res[0] + "," + res[1] + "]");
  }
}`,
      python: `import json, sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(json.dumps(Solution().twoSum(data[1:1 + n], data[1 + n]), separators=(",", ":")))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  int target;
  cin >> target;
  vector<int> res = Solution().twoSum(nums, target);
  cout << "[" << res[0] << "," << res[1] << "]\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(JSON.stringify(twoSum(data.slice(1, 1 + n), data[1 + n])));
}`,
    },
    testCases: tc([
      ["4\n2 7 11 15\n9", "[0,1]"],
      ["3\n3 2 4\n6", "[1,2]"],
      ["2\n3 3\n6", "[0,1]"],
      ["4\n-3 4 3 90\n0", "[0,2]"],
      ["2\n0 0\n0", "[0,1]"],
      ["5\n1 5 7 -1 5\n6", "[0,1]"],
      ["4\n10 20 30 40\n70", "[2,3]"],
      ["3\n-10 -20 -30\n-50", "[1,2]"],
      ["6\n1 2 3 4 5 6\n11", "[4,5]"],
      ["2\n1000000000 -1000000000\n0", "[0,1]"],
      ["4\n5 5 11 15\n10", "[0,1]"],
      ["5\n8 1 4 7 2\n10", "[0,4]"],
      ["4\n1 2 3 4\n100", "[-1,-1]"],
      ["6\n9 8 7 6 5 4\n9", "[4,5]"],
      ["3\n0 4 0\n0", "[0,2]"],
      ["5\n-5 -2 0 3 7\n5", "[1,4]"],
      ["4\n100 200 300 400\n300", "[0,1]"],
      ["7\n11 22 33 44 55 66 77\n143", "[5,6]"],
      ["2\n-1 -2\n-3", "[0,1]"],
      ["5\n4 7 1 9 3\n12", "[3,4]"],
    ]),
  },

  // 2. Contains Duplicate (EASY)
  {
    title: "Contains Duplicate",
    slug: "contains-duplicate",
    difficulty: "EASY",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Arrays & Hashing",
    statement:
      "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9",
    ],
    examples: [
      { input: "nums = [1, 2, 3, 1]", output: "true" },
      { input: "nums = [1, 2, 3, 4]", output: "false" },
      { input: "nums = [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]", output: "true" },
    ],
    hints: [
      "Sorting puts duplicates next to each other in O(n log n) time.",
      "Using a HashSet lets you detect a duplicate in O(n) average time.",
      "Compare set size against array length or return true on the first collision.",
    ],
    starterCode: {
      java: `class Solution {
  public boolean containsDuplicate(int[] nums) {
    return false;
  }
}`,
      python: `class Solution:
  def containsDuplicate(self, nums: list[int]) -> bool:
    return False`,
      cpp: `class Solution {
public:
  bool containsDuplicate(vector<int>& nums) {
    return false;
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var containsDuplicate = function(nums) {
  return false;
};`,
    },
    driverCode: {
      java: `import java.util.*;
{{USER_CODE}}
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    if (!sc.hasNextInt()) return;
    int n = sc.nextInt();
    int[] nums = new int[n];
    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
    System.out.println(new Solution().containsDuplicate(nums) ? "true" : "false");
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print("true" if Solution().containsDuplicate(data[1:1 + n]) else "false")`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  cout << (Solution().containsDuplicate(nums) ? "true" : "false") << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(containsDuplicate(data.slice(1, 1 + n)) ? "true" : "false");
}`,
    },
    testCases: tc([
      ["4\n1 2 3 1", "true"],
      ["4\n1 2 3 4", "false"],
      ["10\n1 1 1 3 3 4 3 2 4 2", "true"],
      ["1\n42", "false"],
      ["2\n0 0", "true"],
      ["2\n-1 1", "false"],
      ["5\n-5 -4 -3 -2 -5", "true"],
      ["5\n10 20 30 40 50", "false"],
      ["3\n1000000000 -1000000000 1000000000", "true"],
      ["4\n1000000000 -1000000000 0 1", "false"],
      ["6\n5 4 3 2 1 0", "false"],
      ["6\n5 4 3 2 1 5", "true"],
      ["7\n7 7 7 7 7 7 7", "true"],
      ["8\n1 3 5 7 9 11 13 15", "false"],
      ["4\n-100 -200 -300 -100", "true"],
      ["3\n0 1 2", "false"],
      ["2\n99 99", "true"],
      ["5\n2 4 6 8 10", "false"],
      ["6\n-1 0 1 2 3 -1", "true"],
      ["1\n-1000000000", "false"],
    ]),
  },

  // 3. Valid Anagram (EASY)
  {
    title: "Valid Anagram",
    slug: "valid-anagram",
    difficulty: "EASY",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Arrays & Hashing",
    statement:
      "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
    constraints: [
      "1 <= s.length, t.length <= 5 * 10^4",
      "s and t consist of lowercase English letters.",
    ],
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true" },
      { input: 's = "rat", t = "car"', output: "false" },
      { input: 's = "a", t = "a"', output: "true" },
    ],
    hints: [
      "If s and t have different lengths, they cannot be anagrams.",
      "Count character frequencies using a fixed-size array of length 26.",
      "Increment for s and decrement for t, then check that every bucket is 0.",
    ],
    starterCode: {
      java: `class Solution {
  public boolean isAnagram(String s, String t) {
    return false;
  }
}`,
      python: `class Solution:
  def isAnagram(self, s: str, t: str) -> bool:
    return False`,
      cpp: `class Solution {
public:
  bool isAnagram(string s, string t) {
    return false;
  }
};`,
      javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
var isAnagram = function(s, t) {
  return false;
};`,
    },
    driverCode: {
      java: `import java.util.*;
{{USER_CODE}}
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    if (!sc.hasNextLine()) return;
    String s = sc.nextLine();
    String t = sc.hasNextLine() ? sc.nextLine() : "";
    System.out.println(new Solution().isAnagram(s, t) ? "true" : "false");
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  lines = sys.stdin.read().splitlines()
  if lines:
    s = lines[0]
    t = lines[1] if len(lines) > 1 else ""
    print("true" if Solution().isAnagram(s, t) else "false")`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  string s, t;
  if (!getline(cin, s)) return 0;
  getline(cin, t);
  cout << (Solution().isAnagram(s, t) ? "true" : "false") << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const lines = fs.readFileSync(0, "utf8").split(/\\r?\\n/);
if (lines.length) {
  console.log(isAnagram(lines[0] || "", lines[1] || "") ? "true" : "false");
}`,
    },
    testCases: tc([
      ["anagram\nnagaram", "true"],
      ["rat\ncar", "false"],
      ["a\na", "true"],
      ["a\nab", "false"],
      ["ab\nba", "true"],
      ["aacc\nccac", "false"],
      ["listen\nsilent", "true"],
      ["triangle\nintegral", "true"],
      ["hello\nbello", "false"],
      ["zzzzz\nzzzzz", "true"],
      ["zzzzz\nzzzzy", "false"],
      ["abcdefg\ngfedcba", "true"],
      ["aaabbb\nababab", "true"],
      ["aaabbb\naaabbc", "false"],
      ["cinema\niceman", "true"],
      ["dormitory\ndirtyroom", "true"],
      ["x\ny", "false"],
      ["programming\ngrammingpro", "true"],
      ["interview\nviewinter", "true"],
      ["abcd\nabce", "false"],
    ]),
  },

  // 4. Group Anagrams (MEDIUM)
  {
    title: "Group Anagrams",
    slug: "group-anagrams",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Arrays & Hashing",
    statement:
      "Given an array of strings strs, group the anagrams together. Return the groups sorted canonically (each group sorted alphabetically, and groups sorted by their first word).",
    constraints: [
      "1 <= strs.length <= 10^4",
      "0 <= strs[i].length <= 100",
      "strs[i] consists of lowercase English letters.",
    ],
    examples: [
      {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        output: '[["ate","eat","tea"],["bat"],["nat","tan"]]',
      },
      { input: 'strs = [""]', output: '[[""]]' },
      { input: 'strs = ["a"]', output: '[["a"]]' },
    ],
    hints: [
      "Two strings are anagrams if and only if their sorted character strings are identical.",
      "Use a HashMap from canonical key (sorted word or 26-char frequency signature) to list of words.",
      "Sort each group and sort the groups list for deterministic output.",
    ],
    starterCode: {
      java: `class Solution {
  public List<List<String>> groupAnagrams(String[] strs) {
    return new ArrayList<>();
  }
}`,
      python: `class Solution:
  def groupAnagrams(self, strs: list[str]) -> list[list[str]]:
    return []`,
      cpp: `class Solution {
public:
  vector<vector<string>> groupAnagrams(vector<string>& strs) {
    return {};
  }
};`,
      javascript: `/**
 * @param {string[]} strs
 * @return {string[][]}
 */
var groupAnagrams = function(strs) {
  return [];
};`,
    },
    driverCode: {
      java: `import java.util.*;
{{USER_CODE}}
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    if (!sc.hasNextLine()) return;
    int n = Integer.parseInt(sc.nextLine().trim());
    String[] strs = new String[n];
    for (int i = 0; i < n; i++) strs[i] = sc.hasNextLine() ? sc.nextLine() : "";
    List<List<String>> res = new Solution().groupAnagrams(strs);
    for (List<String> g : res) Collections.sort(g);
    res.sort((a, b) -> a.get(0).compareTo(b.get(0)));
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < res.size(); i++) {
      if (i > 0) sb.append(",");
      sb.append("[");
      for (int j = 0; j < res.get(i).size(); j++) {
        if (j > 0) sb.append(",");
        sb.append("\\"").append(res.get(i).get(j)).append("\\"");
      }
      sb.append("]");
    }
    sb.append("]");
    System.out.println(sb.toString());
  }
}`,
      python: `import json, sys
{{USER_CODE}}
if __name__ == "__main__":
  lines = sys.stdin.read().splitlines()
  if lines:
    n = int(lines[0])
    strs = [lines[i + 1] if i + 1 < len(lines) else "" for i in range(n)]
    res = [sorted(g) for g in Solution().groupAnagrams(strs)]
    res.sort(key=lambda g: g[0] if g else "")
    print(json.dumps(res, separators=(",", ":")))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  string line;
  if (!getline(cin, line)) return 0;
  int n = stoi(line);
  vector<string> strs(n);
  for (int i = 0; i < n; i++) getline(cin, strs[i]);
  auto res = Solution().groupAnagrams(strs);
  for (auto& g : res) sort(g.begin(), g.end());
  sort(res.begin(), res.end(), [](const auto& a, const auto& b) { return a[0] < b[0]; });
  cout << "[";
  for (size_t i = 0; i < res.size(); i++) {
    if (i) cout << ",";
    cout << "[";
    for (size_t j = 0; j < res[i].size(); j++) {
      if (j) cout << ",";
      cout << "\\"" << res[i][j] << "\\"";
    }
    cout << "]";
  }
  cout << "]\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const lines = fs.readFileSync(0, "utf8").split(/\\r?\\n/);
if (lines.length && lines[0] !== "") {
  const n = Number(lines[0]);
  const strs = Array.from({ length: n }, (_, i) => lines[i + 1] ?? "");
  const res = groupAnagrams(strs).map((g) => [...g].sort());
  res.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  console.log(JSON.stringify(res));
}`,
    },
    testCases: tc([
      ["6\neat\ntea\ntan\nate\nnat\nbat", '[["ate","eat","tea"],["bat"],["nat","tan"]]'],
      ["1\n", '[[""]]'],
      ["1\na", '[["a"]]'],
      ["2\nab\nba", '[["ab","ba"]]'],
      ["3\nabc\ncba\ndef", '[["abc","cba"],["def"]]'],
      ["2\n\n", '[["",""]]'],
      ["4\na\nb\nc\nd", '[["a"],["b"],["c"],["d"]]'],
      ["4\naaa\naaa\naa\na", '[["a"],["aa"],["aaa","aaa"]]'],
      ["3\nlisten\nsilent\nenlist", '[["enlist","listen","silent"]]'],
      ["4\ncar\narc\nrat\ntar", '[["arc","car"],["rat","tar"]]'],
      ["2\nz\ny", '[["y"],["z"]]'],
      ["5\ndog\ngod\nact\ncat\ntac", '[["act","cat","tac"],["dog","god"]]'],
      ["3\nxy\nyx\nxx", '[["xx"],["xy","yx"]]'],
      ["4\nflow\nwolf\nfowl\nlow", '[["flow","fowl","wolf"],["low"]]'],
      ["2\nabc\nabd", '[["abc"],["abd"]]'],
      ["5\na\na\na\nb\nb", '[["a","a","a"],["b","b"]]'],
      ["3\nstop\npost\ntops", '[["post","stop","tops"]]'],
      ["4\nnoon\nonno\nmoon\nmono", '[["mono","moon"],["noon","onno"]]'],
      ["2\ncode\ndeco", '[["code","deco"]]'],
      ["3\nabcdef\nfedcba\nzzzzzz", '[["abcdef","fedcba"],["zzzzzz"]]'],
    ]),
  },

  // 5. Top K Frequent Elements (MEDIUM)
  {
    title: "Top K Frequent Elements",
    slug: "top-k-frequent-elements",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Arrays & Hashing",
    statement:
      "Given an integer array nums and an integer k, return the k most frequent elements (sorted in ascending order for canonical output).",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
      "1 <= k <= number of unique elements in nums",
    ],
    examples: [
      { input: "nums = [1,1,1,2,2,3], k = 2", output: "[1, 2]" },
      { input: "nums = [1], k = 1", output: "[1]" },
      { input: "nums = [4,1,-1,2,-1,2,3], k = 2", output: "[-1, 2]" },
    ],
    hints: [
      "First count the frequency of every element using a HashMap.",
      "Bucket sort by frequency from n down to 1 to achieve O(n) time.",
      "Alternatively, maintain a min-heap of size k.",
    ],
    starterCode: {
      java: `class Solution {
  public int[] topKFrequent(int[] nums, int k) {
    return new int[0];
  }
}`,
      python: `class Solution:
  def topKFrequent(self, nums: list[int], k: int) -> list[int]:
    return []`,
      cpp: `class Solution {
public:
  vector<int> topKFrequent(vector<int>& nums, int k) {
    return {};
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
var topKFrequent = function(nums, k) {
  return [];
};`,
    },
    driverCode: {
      java: `import java.util.*;
{{USER_CODE}}
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    if (!sc.hasNextInt()) return;
    int n = sc.nextInt();
    int[] nums = new int[n];
    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
    int k = sc.nextInt();
    int[] res = new Solution().topKFrequent(nums, k);
    Arrays.sort(res);
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < res.length; i++) {
      if (i > 0) sb.append(",");
      sb.append(res[i]);
    }
    sb.append("]");
    System.out.println(sb.toString());
  }
}`,
      python: `import json, sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    res = sorted(Solution().topKFrequent(data[1:1 + n], data[1 + n]))
    print(json.dumps(res, separators=(",", ":")))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  int k;
  cin >> k;
  auto res = Solution().topKFrequent(nums, k);
  sort(res.begin(), res.end());
  cout << "[";
  for (size_t i = 0; i < res.size(); i++) {
    if (i) cout << ",";
    cout << res[i];
  }
  cout << "]\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  const res = topKFrequent(data.slice(1, 1 + n), data[1 + n]).sort((a, b) => a - b);
  console.log(JSON.stringify(res));
}`,
    },
    testCases: tc([
      ["6\n1 1 1 2 2 3\n2", "[1,2]"],
      ["1\n1\n1", "[1]"],
      ["7\n4 1 -1 2 -1 2 3\n2", "[-1,2]"],
      ["5\n5 5 5 5 5\n1", "[5]"],
      ["4\n1 2 3 4\n4", "[1,2,3,4]"],
      ["6\n-1 -1 -2 -2 -2 3\n1", "[-2]"],
      ["6\n-1 -1 -2 -2 -2 3\n2", "[-2,-1]"],
      ["8\n10 20 10 30 20 10 40 40\n2", "[10,20]"],
      ["5\n0 0 1 1 1\n1", "[1]"],
      ["7\n7 7 8 8 9 9 9\n2", "[7,9]"],
      ["6\n3 0 1 0 3 3\n2", "[0,3]"],
      ["3\n-10000 10000 -10000\n1", "[-10000]"],
      ["9\n1 2 3 1 2 3 1 2 3\n3", "[1,2,3]"],
      ["6\n5 1 5 2 5 3\n1", "[5]"],
      ["7\n2 2 3 3 3 4 4\n3", "[2,3,4]"],
      ["5\n9 8 7 8 9\n2", "[8,9]"],
      ["4\n-5 -5 5 5\n2", "[-5,5]"],
      ["8\n1 1 2 2 2 3 3 3\n2", "[2,3]"],
      ["6\n100 200 100 300 200 100\n2", "[100,200]"],
      ["4\n6 6 6 7\n1", "[6]"],
    ]),
  },

  // 6. Longest Consecutive Sequence (MEDIUM)
  {
    title: "Longest Consecutive Sequence",
    slug: "longest-consecutive-sequence",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Arrays & Hashing",
    statement:
      "Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence. You must write an algorithm that runs in O(n) time.",
    constraints: [
      "0 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9",
    ],
    examples: [
      { input: "nums = [100, 4, 200, 1, 3, 2]", output: "4" },
      { input: "nums = [0, 3, 7, 2, 5, 8, 4, 6, 0, 1]", output: "9" },
      { input: "nums = []", output: "0" },
    ],
    hints: [
      "Insert all numbers into a HashSet for O(1) lookup.",
      "Only start counting a streak from num if (num - 1) is NOT in the set.",
      "Each number is visited at most twice, giving O(n) overall time.",
    ],
    starterCode: {
      java: `class Solution {
  public int longestConsecutive(int[] nums) {
    return 0;
  }
}`,
      python: `class Solution:
  def longestConsecutive(self, nums: list[int]) -> int:
    return 0`,
      cpp: `class Solution {
public:
  int longestConsecutive(vector<int>& nums) {
    return 0;
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var longestConsecutive = function(nums) {
  return 0;
};`,
    },
    driverCode: {
      java: `import java.util.*;
{{USER_CODE}}
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    if (!sc.hasNextInt()) return;
    int n = sc.nextInt();
    int[] nums = new int[n];
    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
    System.out.println(new Solution().longestConsecutive(nums));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(Solution().longestConsecutive(data[1:1 + n]))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  cout << Solution().longestConsecutive(nums) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(longestConsecutive(data.slice(1, 1 + n)));
}`,
    },
    testCases: tc([
      ["6\n100 4 200 1 3 2", "4"],
      ["10\n0 3 7 2 5 8 4 6 0 1", "9"],
      ["0", "0"],
      ["1\n10", "1"],
      ["4\n1 2 0 1", "3"],
      ["5\n-3 -2 -1 0 1", "5"],
      ["5\n10 30 50 70 90", "1"],
      ["6\n5 4 3 2 1 0", "6"],
      ["7\n9 1 4 7 3 -1 0", "3"],
      ["4\n-1000000000 -999999999 1000000000 999999999", "2"],
      ["6\n1 1 1 2 2 3", "3"],
      ["8\n10 5 12 3 55 30 4 11", "3"],
      ["5\n2 4 6 8 10", "1"],
      ["6\n-5 -4 -2 -1 0 1", "4"],
      ["3\n0 0 0", "1"],
      ["7\n7 6 5 10 11 12 13", "4"],
      ["4\n100 101 102 103", "4"],
      ["6\n3 3 4 4 5 5", "3"],
      ["5\n-10 -9 -8 -5 -4", "3"],
      ["8\n8 7 6 5 4 3 2 1", "8"],
    ]),
  },

  // 7. First Missing Positive (HARD)
  {
    title: "First Missing Positive",
    slug: "first-missing-positive",
    difficulty: "HARD",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Arrays & Hashing",
    statement:
      "Given an unsorted integer array nums, return the smallest positive integer that is not present in nums. You must implement an algorithm that runs in O(n) time and uses O(1) auxiliary space.",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-2^31 <= nums[i] <= 2^31 - 1",
    ],
    examples: [
      { input: "nums = [1, 2, 0]", output: "3" },
      { input: "nums = [3, 4, -1, 1]", output: "2" },
      { input: "nums = [7, 8, 9, 11, 12]", output: "1" },
    ],
    hints: [
      "The answer must lie in the range [1, n + 1], where n is nums.length.",
      "Use cyclic sort: place each value v in [1..n] at index v - 1 by swapping.",
      "After placement, the first index i where nums[i] != i + 1 gives the answer i + 1.",
    ],
    starterCode: {
      java: `class Solution {
  public int firstMissingPositive(int[] nums) {
    return 1;
  }
}`,
      python: `class Solution:
  def firstMissingPositive(self, nums: list[int]) -> int:
    return 1`,
      cpp: `class Solution {
public:
  int firstMissingPositive(vector<int>& nums) {
    return 1;
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var firstMissingPositive = function(nums) {
  return 1;
};`,
    },
    driverCode: {
      java: `import java.util.*;
{{USER_CODE}}
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    if (!sc.hasNextInt()) return;
    int n = sc.nextInt();
    int[] nums = new int[n];
    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
    System.out.println(new Solution().firstMissingPositive(nums));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(Solution().firstMissingPositive(data[1:1 + n]))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  cout << Solution().firstMissingPositive(nums) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(firstMissingPositive(data.slice(1, 1 + n)));
}`,
    },
    testCases: tc([
      ["3\n1 2 0", "3"],
      ["4\n3 4 -1 1", "2"],
      ["5\n7 8 9 11 12", "1"],
      ["1\n1", "2"],
      ["1\n2", "1"],
      ["1\n-5", "1"],
      ["4\n1 2 3 4", "5"],
      ["4\n1 1 2 2", "3"],
      ["5\n5 4 3 2 1", "6"],
      ["3\n0 0 0", "1"],
      ["5\n2 3 4 5 6", "1"],
      ["6\n1 2 3 5 6 7", "4"],
      ["4\n-1 -2 -3 -4", "1"],
      ["3\n2147483647 -2147483648 1", "2"],
      ["6\n1 1 1 1 1 1", "2"],
      ["5\n1 3 5 2 4", "6"],
      ["6\n2 1 4 3 6 5", "7"],
      ["5\n10 1 2 3 4", "5"],
      ["4\n2 2 2 1", "3"],
      ["7\n1 2 3 4 5 6 8", "7"],
    ]),
  },
];
