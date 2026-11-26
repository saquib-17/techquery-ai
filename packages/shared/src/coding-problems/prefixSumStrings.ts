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

export const PREFIX_SUM_STRINGS_PROBLEMS: CuratedCodingProblem[] = [
  // 1. Running Sum of 1d Array (EASY)
  {
    title: "Running Sum of 1d Array",
    slug: "running-sum-of-1d-array",
    difficulty: "EASY",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Prefix Sum & String Algorithms",
    statement:
      "Given an array nums. We define a running sum of an array as runningSum[i] = sum(nums[0]...nums[i]). Return the running sum of nums.",
    constraints: [
      "1 <= nums.length <= 1000",
      "-10^6 <= nums[i] <= 10^6",
    ],
    examples: [
      { input: "nums = [1, 2, 3, 4]", output: "[1, 3, 6, 10]" },
      { input: "nums = [1, 1, 1, 1, 1]", output: "[1, 2, 3, 4, 5]" },
      { input: "nums = [3, 1, 2, 10, 1]", output: "[3, 4, 6, 16, 17]" },
    ],
    hints: [
      "Each running sum element equals the previous running sum plus nums[i].",
      "You can compute it in a single left-to-right pass in O(n) time.",
    ],
    starterCode: {
      java: `class Solution {
  public int[] runningSum(int[] nums) {
    return new int[0];
  }
}`,
      python: `class Solution:
  def runningSum(self, nums: list[int]) -> list[int]:
    return []`,
      cpp: `class Solution {
public:
  vector<int> runningSum(vector<int>& nums) {
    return {};
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
var runningSum = function(nums) {
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
    int[] res = new Solution().runningSum(nums);
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
    print(json.dumps(Solution().runningSum(data[1:1 + n]), separators=(",", ":")))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  auto res = Solution().runningSum(nums);
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
  console.log(JSON.stringify(runningSum(data.slice(1, 1 + n))));
}`,
    },
    testCases: tc([
      ["4\n1 2 3 4", "[1,3,6,10]"],
      ["5\n1 1 1 1 1", "[1,2,3,4,5]"],
      ["5\n3 1 2 10 1", "[3,4,6,16,17]"],
      ["1\n0", "[0]"],
      ["1\n-5", "[-5]"],
      ["4\n-1 -2 -3 -4", "[-1,-3,-6,-10]"],
      ["4\n10 -10 10 -10", "[10,0,10,0]"],
      ["3\n0 0 0", "[0,0,0]"],
      ["5\n5 4 3 2 1", "[5,9,12,14,15]"],
      ["2\n1000000 -1000000", "[1000000,0]"],
      ["6\n2 4 6 8 10 12", "[2,6,12,20,30,42]"],
      ["3\n-100 50 50", "[-100,-50,0]"],
      ["4\n7 0 -7 7", "[7,7,0,7]"],
      ["5\n-1 2 -3 4 -5", "[-1,1,-2,2,-3]"],
      ["2\n42 58", "[42,100]"],
      ["6\n1 0 1 0 1 0", "[1,1,2,2,3,3]"],
      ["4\n9 9 9 9", "[9,18,27,36]"],
      ["3\n-5 -5 10", "[-5,-10,0]"],
      ["5\n100 200 300 400 500", "[100,300,600,1000,1500]"],
      ["4\n-3 1 4 -2", "[-3,-2,2,0]"],
    ]),
  },

  // 2. Longest Common Prefix (EASY)
  {
    title: "Longest Common Prefix",
    slug: "longest-common-prefix",
    difficulty: "EASY",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Prefix Sum & String Algorithms",
    statement:
      "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string \"\".",
    constraints: [
      "1 <= strs.length <= 200",
      "0 <= strs[i].length <= 200",
      "strs[i] consists of only lowercase English letters if it is non-empty.",
    ],
    examples: [
      { input: 'strs = ["flower", "flow", "flight"]', output: '"fl"' },
      { input: 'strs = ["dog", "racecar", "car"]', output: '""' },
      { input: 'strs = ["interspecies", "interstellar", "interstate"]', output: '"inters"' },
    ],
    hints: [
      "Compare characters column-by-column across all strings starting at index 0.",
      "Stop as soon as any string ends or has a character different from strs[0][i].",
    ],
    starterCode: {
      java: `class Solution {
  public String longestCommonPrefix(String[] strs) {
    return "";
  }
}`,
      python: `class Solution:
  def longestCommonPrefix(self, strs: list[str]) -> str:
    return ""`,
      cpp: `class Solution {
public:
  string longestCommonPrefix(vector<string>& strs) {
    return "";
  }
};`,
      javascript: `/**
 * @param {string[]} strs
 * @return {string}
 */
var longestCommonPrefix = function(strs) {
  return "";
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
    System.out.println(new Solution().longestCommonPrefix(strs));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  lines = sys.stdin.read().splitlines()
  if lines:
    n = int(lines[0])
    strs = [lines[i + 1] if i + 1 < len(lines) else "" for i in range(n)]
    print(Solution().longestCommonPrefix(strs))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  string line;
  if (!getline(cin, line)) return 0;
  int n = stoi(line);
  vector<string> strs(n);
  for (int i = 0; i < n; i++) getline(cin, strs[i]);
  cout << Solution().longestCommonPrefix(strs) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const lines = fs.readFileSync(0, "utf8").split(/\\r?\\n/);
if (lines.length && lines[0] !== "") {
  const n = Number(lines[0]);
  const strs = Array.from({ length: n }, (_, i) => lines[i + 1] ?? "");
  console.log(longestCommonPrefix(strs));
}`,
    },
    testCases: tc([
      ["3\nflower\nflow\nflight", "fl"],
      ["3\ndog\nracecar\ncar", ""],
      ["3\ninterspecies\ninterstellar\ninterstate", "inters"],
      ["1\nabc", "abc"],
      ["1\n", ""],
      ["2\n\nabc", ""],
      ["2\nab\na", "a"],
      ["2\na\nab", "a"],
      ["3\naaa\naa\na", "a"],
      ["3\nreflower\nflow\nflight", ""],
      ["3\ncir\ncar\ncat", "c"],
      ["2\nsame\nsame", "same"],
      ["4\nprefix\npreach\nprevent\nprepare", "pre"],
      ["3\napple\nape\napricot", "ap"],
      ["2\nabcdef\nabcxyz", "abc"],
      ["3\nxyz\nabc\ndef", ""],
      ["4\naaaa\naaaa\naaaa\naaaa", "aaaa"],
      ["3\nthrone\nthrill\nthrough", "thr"],
      ["2\nhello\nhell", "hell"],
      ["3\ncoding\ncode\ncoder", "cod"],
    ]),
  },

  // 3. Product of Array Except Self (MEDIUM)
  {
    title: "Product of Array Except Self",
    slug: "product-of-array-except-self",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Prefix Sum & String Algorithms",
    statement:
      "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. You must write an algorithm that runs in O(n) time and without using the division operation.",
    constraints: [
      "2 <= nums.length <= 10^5",
      "-30 <= nums[i] <= 30",
      "The product of any prefix or suffix is guaranteed to fit in a 32-bit integer.",
    ],
    examples: [
      { input: "nums = [1, 2, 3, 4]", output: "[24, 12, 8, 6]" },
      { input: "nums = [-1, 1, 0, -3, 3]", output: "[0, 0, 9, 0, 0]" },
      { input: "nums = [2, 3]", output: "[3, 2]" },
    ],
    hints: [
      "answer[i] = (product of elements to the left of i) * (product of elements to the right of i).",
      "First pass left-to-right to store prefix products in answer[].",
      "Second pass right-to-left with a running suffix variable to multiply in O(1) extra space.",
    ],
    starterCode: {
      java: `class Solution {
  public int[] productExceptSelf(int[] nums) {
    return new int[0];
  }
}`,
      python: `class Solution:
  def productExceptSelf(self, nums: list[int]) -> list[int]:
    return []`,
      cpp: `class Solution {
public:
  vector<int> productExceptSelf(vector<int>& nums) {
    return {};
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
var productExceptSelf = function(nums) {
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
    int[] res = new Solution().productExceptSelf(nums);
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
    print(json.dumps(Solution().productExceptSelf(data[1:1 + n]), separators=(",", ":")))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  auto res = Solution().productExceptSelf(nums);
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
  console.log(JSON.stringify(productExceptSelf(data.slice(1, 1 + n))));
}`,
    },
    testCases: tc([
      ["4\n1 2 3 4", "[24,12,8,6]"],
      ["5\n-1 1 0 -3 3", "[0,0,9,0,0]"],
      ["2\n2 3", "[3,2]"],
      ["2\n0 0", "[0,0]"],
      ["3\n0 4 0", "[0,0,0]"],
      ["4\n-1 -2 -3 -4", "[-24,-12,-8,-6]"],
      ["3\n1 1 1", "[1,1,1]"],
      ["4\n5 0 2 3", "[0,30,0,0]"],
      ["4\n2 2 2 2", "[8,8,8,8]"],
      ["3\n-5 5 -5", "[-25,25,-25]"],
      ["5\n1 2 3 4 5", "[120,60,40,30,24]"],
      ["2\n-10 10", "[10,-10]"],
      ["4\n10 0 10 10", "[0,1000,0,0]"],
      ["5\n2 3 4 5 6", "[360,240,180,144,120]"],
      ["3\n-1 -1 -1", "[1,1,1]"],
      ["4\n3 1 4 1", "[4,12,3,12]"],
      ["3\n0 1 2", "[2,0,0]"],
      ["4\n4 3 2 1", "[6,8,12,24]"],
      ["5\n-2 1 -2 1 -2", "[4,-8,4,-8,4]"],
      ["2\n30 30", "[30,30]"],
    ]),
  },

  // 4. Subarray Sum Equals K (MEDIUM)
  {
    title: "Subarray Sum Equals K",
    slug: "subarray-sum-equals-k",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Prefix Sum & String Algorithms",
    statement:
      "Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k. A subarray is a contiguous non-empty sequence of elements within an array.",
    constraints: [
      "1 <= nums.length <= 2 * 10^4",
      "-1000 <= nums[i] <= 1000",
      "-10^7 <= k <= 10^7",
    ],
    examples: [
      { input: "nums = [1, 1, 1], k = 2", output: "2" },
      { input: "nums = [1, 2, 3], k = 3", output: "2" },
      { input: "nums = [1, -1, 0], k = 0", output: "3" },
    ],
    hints: [
      "Because nums can contain negative numbers, sliding window does not work here.",
      "Let prefixSum be the sum up to index i. A subarray (j..i] sums to k iff prefixSum[i] - prefixSum[j] == k.",
      "Store prefixSum frequencies in a HashMap (seeded with {0: 1}) and add map[prefixSum - k] at each step.",
    ],
    starterCode: {
      java: `class Solution {
  public int subarraySum(int[] nums, int k) {
    return 0;
  }
}`,
      python: `class Solution:
  def subarraySum(self, nums: list[int], k: int) -> int:
    return 0`,
      cpp: `class Solution {
public:
  int subarraySum(vector<int>& nums, int k) {
    return 0;
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var subarraySum = function(nums, k) {
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
    int k = sc.nextInt();
    System.out.println(new Solution().subarraySum(nums, k));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(Solution().subarraySum(data[1:1 + n], data[1 + n]))`,
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
  cout << Solution().subarraySum(nums, k) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(subarraySum(data.slice(1, 1 + n), data[1 + n]));
}`,
    },
    testCases: tc([
      ["3\n1 1 1\n2", "2"],
      ["3\n1 2 3\n3", "2"],
      ["3\n1 -1 0\n0", "3"],
      ["1\n1\n0", "0"],
      ["1\n5\n5", "1"],
      ["4\n0 0 0 0\n0", "10"],
      ["5\n3 4 7 2 -3\n7", "2"],
      ["6\n3 4 7 2 -3 1\n7", "3"],
      ["3\n-1 -1 1\n0", "1"],
      ["4\n1 -1 1 -1\n0", "4"],
      ["5\n2 2 2 2 2\n4", "4"],
      ["4\n10 2 -2 -20\n-10", "1"],
      ["6\n10 2 -2 -20 10 0\n-10", "5"],
      ["3\n-5 -5 -5\n-10", "2"],
      ["5\n1 2 1 2 1\n3", "4"],
      ["4\n5 -5 5 -5\n5", "3"],
      ["3\n1000 -1000 1000\n1000", "3"],
      ["4\n1 2 3 4\n10", "1"],
      ["4\n1 2 3 4\n11", "0"],
      ["5\n-2 4 -2 4 -2\n2", "5"],
    ]),
  },

  // 5. Longest Palindromic Substring (MEDIUM)
  {
    title: "Longest Palindromic Substring",
    slug: "longest-palindromic-substring",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Prefix Sum & String Algorithms",
    statement:
      "Given a string s, return the longest palindromic substring in s. If multiple answers of the same maximum length exist, return the earliest one.",
    constraints: [
      "1 <= s.length <= 1000",
      "s consists of only digits and English letters.",
    ],
    examples: [
      { input: 's = "babad"', output: '"bab"' },
      { input: 's = "cbbd"', output: '"bb"' },
      { input: 's = "a"', output: '"a"' },
    ],
    hints: [
      "Every palindrome expands symmetrically around its center.",
      "There are 2n - 1 possible centers (n odd-length centers and n - 1 even-length centers).",
      "Expand outward from each center in O(n^2) time and O(1) space.",
    ],
    starterCode: {
      java: `class Solution {
  public String longestPalindrome(String s) {
    return "";
  }
}`,
      python: `class Solution:
  def longestPalindrome(self, s: str) -> str:
    return ""`,
      cpp: `class Solution {
public:
  string longestPalindrome(string s) {
    return "";
  }
};`,
      javascript: `/**
 * @param {string} s
 * @return {string}
 */
var longestPalindrome = function(s) {
  return "";
};`,
    },
    driverCode: {
      java: `import java.util.*;
{{USER_CODE}}
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String s = sc.hasNextLine() ? sc.nextLine().trim() : "";
    System.out.println(new Solution().longestPalindrome(s));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  lines = sys.stdin.read().splitlines()
  s = lines[0].strip() if lines else ""
  print(Solution().longestPalindrome(s))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  string s;
  if (!(cin >> s)) return 0;
  cout << Solution().longestPalindrome(s) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const s = (fs.readFileSync(0, "utf8").split(/\\r?\\n/)[0] ?? "").trim();
console.log(longestPalindrome(s));`,
    },
    testCases: tc([
      ["babad", "bab"],
      ["cbbd", "bb"],
      ["a", "a"],
      ["ac", "a"],
      ["bb", "bb"],
      ["ccc", "ccc"],
      ["racecar", "racecar"],
      ["forgeeksskeegfor", "geeksskeeg"],
      ["abacdfgdcaba", "aba"],
      ["aaaa", "aaaa"],
      ["aacabdkacaa", "aca"],
      ["bananas", "anana"],
      ["abcdbbfcba", "bb"],
      ["12321", "12321"],
      ["abcba", "abcba"],
      ["abccba", "abccba"],
      ["xyzzyx123", "xyzzyx"],
      ["123abba456", "abba"],
      ["madam", "madam"],
      ["noon", "noon"],
    ]),
  },

  // 6. Longest Happy Prefix (HARD)
  {
    title: "Longest Happy Prefix",
    slug: "longest-happy-prefix",
    difficulty: "HARD",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Prefix Sum & String Algorithms",
    statement:
      "A string is called a happy prefix if it is a non-empty prefix which is also a suffix (excluding itself). Given a string s, return the longest happy prefix of s. Return an empty string \"\" if no such prefix exists.",
    constraints: [
      "1 <= s.length <= 10^5",
      "s contains only lowercase English letters.",
    ],
    examples: [
      { input: 's = "level"', output: '"l"' },
      { input: 's = "ababab"', output: '"abab"' },
      { input: 's = "a"', output: '""' },
    ],
    hints: [
      "This directly asks for the final value of the KMP prefix function (LPS array).",
      "Compute lps[i] = length of longest proper prefix of s[0..i] that is also a suffix.",
      "The answer is s.substring(0, lps[n - 1]).",
    ],
    starterCode: {
      java: `class Solution {
  public String longestPrefix(String s) {
    return "";
  }
}`,
      python: `class Solution:
  def longestPrefix(self, s: str) -> str:
    return ""`,
      cpp: `class Solution {
public:
  string longestPrefix(string s) {
    return "";
  }
};`,
      javascript: `/**
 * @param {string} s
 * @return {string}
 */
var longestPrefix = function(s) {
  return "";
};`,
    },
    driverCode: {
      java: `import java.util.*;
{{USER_CODE}}
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String s = sc.hasNextLine() ? sc.nextLine().trim() : "";
    System.out.println(new Solution().longestPrefix(s));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  lines = sys.stdin.read().splitlines()
  s = lines[0].strip() if lines else ""
  print(Solution().longestPrefix(s))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  string s;
  if (!(cin >> s)) return 0;
  cout << Solution().longestPrefix(s) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const s = (fs.readFileSync(0, "utf8").split(/\\r?\\n/)[0] ?? "").trim();
console.log(longestPrefix(s));`,
    },
    testCases: tc([
      ["level", "l"],
      ["ababab", "abab"],
      ["a", ""],
      ["leetcodeleet", "leet"],
      ["abcab", "ab"],
      ["aaaa", "aaa"],
      ["abcdef", ""],
      ["abba", "a"],
      ["aabaaab", "aab"],
      ["xyzxyz", "xyz"],
      ["acccbaaacccbaac", "ac"],
      ["abababab", "ababab"],
      ["racecar", "r"],
      ["aba", "a"],
      ["ab", ""],
      ["aa", "a"],
      ["abcabcabc", "abcabc"],
      ["abacaba", "aba"],
      ["mississippi", ""],
      ["blablabla", "blabla"],
    ]),
  },

  // 7. Shortest Palindrome (HARD)
  {
    title: "Shortest Palindrome",
    slug: "shortest-palindrome",
    difficulty: "HARD",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Prefix Sum & String Algorithms",
    statement:
      "You are given a string s. You can convert s to a palindrome by adding characters in front of it. Return the shortest palindrome you can find by performing this transformation.",
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of lowercase English letters only.",
    ],
    examples: [
      { input: 's = "aacecaaa"', output: '"aaacecaaa"' },
      { input: 's = "abcd"', output: '"dcbabcd"' },
      { input: 's = "racecar"', output: '"racecar"' },
    ],
    hints: [
      "Prepending characters means we want to find the longest palindromic prefix of s.",
      "Construct combined = s + '#' + reverse(s) and compute its KMP LPS array.",
      "lps[combined.length - 1] gives the length of the longest palindromic prefix.",
    ],
    starterCode: {
      java: `class Solution {
  public String shortestPalindrome(String s) {
    return "";
  }
}`,
      python: `class Solution:
  def shortestPalindrome(self, s: str) -> str:
    return ""`,
      cpp: `class Solution {
public:
  string shortestPalindrome(string s) {
    return "";
  }
};`,
      javascript: `/**
 * @param {string} s
 * @return {string}
 */
var shortestPalindrome = function(s) {
  return "";
};`,
    },
    driverCode: {
      java: `import java.util.*;
{{USER_CODE}}
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String s = sc.hasNextLine() ? sc.nextLine() : "";
    System.out.println(new Solution().shortestPalindrome(s));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  lines = sys.stdin.read().splitlines()
  s = lines[0] if lines else ""
  print(Solution().shortestPalindrome(s))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  string s;
  getline(cin, s);
  cout << Solution().shortestPalindrome(s) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const s = fs.readFileSync(0, "utf8").split(/\\r?\\n/)[0] ?? "";
console.log(shortestPalindrome(s));`,
    },
    testCases: tc([
      ["aacecaaa", "aaacecaaa"],
      ["abcd", "dcbabcd"],
      ["racecar", "racecar"],
      ["", ""],
      ["a", "a"],
      ["ab", "bab"],
      ["aa", "aa"],
      ["aba", "aba"],
      ["abb", "bbabb"],
      ["aabba", "abbaabba"],
      ["adcba", "abcdadcba"],
      ["banana", "ananabanana"],
      ["abac", "cabac"],
      ["xyz", "zyxyz"],
      ["noon", "noon"],
      ["aab", "baab"],
      ["abba", "abba"],
      ["abcba", "abcba"],
      ["cab", "bacab"],
      ["aaaaab", "baaaaab"],
    ]),
  },
];
