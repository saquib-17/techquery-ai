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

export const SLIDING_WINDOW_PROBLEMS: CuratedCodingProblem[] = [
  // 1. Best Time to Buy and Sell Stock (EASY)
  {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    difficulty: "EASY",
    pattern: "SLIDING_WINDOW",
    sheetPattern: "Sliding Window",
    statement:
      "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve, or 0 if no profit is possible.",
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4",
    ],
    examples: [
      { input: "prices = [7, 1, 5, 3, 6, 4]", output: "5" },
      { input: "prices = [7, 6, 4, 3, 1]", output: "0" },
      { input: "prices = [2, 4, 1]", output: "2" },
    ],
    hints: [
      "Track the minimum stock price seen so far as you scan left to right.",
      "At each day i, candidate profit is prices[i] - minPriceSoFar.",
      "Keep the maximum profit seen across all days in O(n) time and O(1) space.",
    ],
    starterCode: {
      java: `class Solution {
  public int maxProfit(int[] prices) {
    return 0;
  }
}`,
      python: `class Solution:
  def maxProfit(self, prices: list[int]) -> int:
    return 0`,
      cpp: `class Solution {
public:
  int maxProfit(vector<int>& prices) {
    return 0;
  }
};`,
      javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {
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
    int[] p = new int[n];
    for (int i = 0; i < n; i++) p[i] = sc.nextInt();
    System.out.println(new Solution().maxProfit(p));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(Solution().maxProfit(data[1:1 + n]))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> p(n);
  for (int i = 0; i < n; i++) cin >> p[i];
  cout << Solution().maxProfit(p) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(maxProfit(data.slice(1, 1 + n)));
}`,
    },
    testCases: tc([
      ["6\n7 1 5 3 6 4", "5"],
      ["5\n7 6 4 3 1", "0"],
      ["3\n2 4 1", "2"],
      ["1\n5", "0"],
      ["2\n1 2", "1"],
      ["2\n2 1", "0"],
      ["4\n3 3 3 3", "0"],
      ["5\n1 2 3 4 5", "4"],
      ["6\n3 2 6 5 0 3", "4"],
      ["5\n10 1 10 1 10", "9"],
      ["4\n0 10000 0 5000", "10000"],
      ["6\n5 4 3 2 1 10", "9"],
      ["4\n2 1 2 1", "1"],
      ["5\n8 6 4 2 2", "0"],
      ["6\n1 4 2 7 3 8", "7"],
      ["3\n10 5 1", "0"],
      ["4\n1 100 1 100", "99"],
      ["5\n9 2 7 1 6", "5"],
      ["3\n0 0 1", "1"],
      ["6\n100 90 80 70 60 65", "5"],
    ]),
  },

  // 2. Maximum Average Subarray I (EASY)
  {
    title: "Maximum Average Subarray I",
    slug: "maximum-average-subarray-i",
    difficulty: "EASY",
    pattern: "SLIDING_WINDOW",
    sheetPattern: "Sliding Window",
    statement:
      "You are given an integer array nums consisting of n elements, and an integer k. Find a contiguous subarray whose length is equal to k that has the maximum average value and return this value (printed to 5 decimal places, or exact float).",
    constraints: [
      "1 <= k <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
    ],
    examples: [
      { input: "nums = [1, 12, -5, -6, 50, 3], k = 4", output: "12.75000" },
      { input: "nums = [5], k = 1", output: "5.00000" },
      { input: "nums = [0, 4, 0, 3, 2], k = 1", output: "4.00000" },
    ],
    hints: [
      "Compute the sum of the first k elements.",
      "Slide the window one step at a time: add nums[i] and subtract nums[i - k].",
      "Track the maximum window sum, then divide by k once at the end.",
    ],
    starterCode: {
      java: `class Solution {
  public double findMaxAverage(int[] nums, int k) {
    return 0.0;
  }
}`,
      python: `class Solution:
  def findMaxAverage(self, nums: list[int], k: int) -> float:
    return 0.0`,
      cpp: `class Solution {
public:
  double findMaxAverage(vector<int>& nums, int k) {
    return 0.0;
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var findMaxAverage = function(nums, k) {
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
    System.out.printf(Locale.US, "%.5f%n", new Solution().findMaxAverage(nums, k));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(f"{Solution().findMaxAverage(data[1:1 + n], data[1 + n]):.5f}")`,
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
  cout << fixed << setprecision(5) << Solution().findMaxAverage(nums, k) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(findMaxAverage(data.slice(1, 1 + n), data[1 + n]).toFixed(5));
}`,
    },
    testCases: tc([
      ["6\n1 12 -5 -6 50 3\n4", "12.75000"],
      ["1\n5\n1", "5.00000"],
      ["5\n0 4 0 3 2\n1", "4.00000"],
      ["3\n-1 -2 -3\n2", "-1.50000"],
      ["4\n10 20 30 40\n4", "25.00000"],
      ["5\n4 2 1 3 3\n2", "3.00000"],
      ["4\n-10 -20 -30 -40\n1", "-10.00000"],
      ["6\n1 2 3 4 5 6\n3", "5.00000"],
      ["6\n6 5 4 3 2 1\n3", "5.00000"],
      ["5\n0 0 0 0 0\n3", "0.00000"],
      ["4\n-5 5 -5 5\n2", "0.00000"],
      ["5\n10000 10000 -10000 10000 10000\n2", "10000.00000"],
      ["4\n1 2 3 4\n2", "3.50000"],
      ["5\n7 4 5 8 8\n3", "7.00000"],
      ["3\n3 3 3\n3", "3.00000"],
      ["6\n-4 -1 0 3 10 -2\n3", "4.33333"],
      ["4\n5 -2 8 -1\n2", "3.50000"],
      ["5\n2 2 2 2 10\n2", "6.00000"],
      ["4\n9 7 5 3\n4", "6.00000"],
      ["5\n-1 1 -1 1 -1\n3", "0.33333"],
    ]),
  },

  // 3. Longest Substring Without Repeating Characters (MEDIUM)
  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "MEDIUM",
    pattern: "SLIDING_WINDOW",
    sheetPattern: "Sliding Window",
    statement:
      "Given a string s, find the length of the longest substring without repeating characters.",
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces.",
    ],
    examples: [
      { input: 's = "abcabcbb"', output: "3" },
      { input: 's = "bbbbb"', output: "1" },
      { input: 's = "pwwkew"', output: "3" },
    ],
    hints: [
      "Maintain a sliding window [left, right] with all unique characters.",
      "Store the latest index of each character in a map or array.",
      "When s[right] repeats inside the window, jump left to lastSeen[s[right]] + 1.",
    ],
    starterCode: {
      java: `class Solution {
  public int lengthOfLongestSubstring(String s) {
    return 0;
  }
}`,
      python: `class Solution:
  def lengthOfLongestSubstring(self, s: str) -> int:
    return 0`,
      cpp: `class Solution {
public:
  int lengthOfLongestSubstring(string s) {
    return 0;
  }
};`,
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
  return 0;
};`,
    },
    driverCode: {
      java: `import java.util.*;
{{USER_CODE}}
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String s = sc.hasNextLine() ? sc.nextLine() : "";
    System.out.println(new Solution().lengthOfLongestSubstring(s));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  lines = sys.stdin.read().splitlines()
  s = lines[0] if lines else ""
  print(Solution().lengthOfLongestSubstring(s))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  string s;
  getline(cin, s);
  cout << Solution().lengthOfLongestSubstring(s) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const s = fs.readFileSync(0, "utf8").split(/\\r?\\n/)[0] ?? "";
console.log(lengthOfLongestSubstring(s));`,
    },
    testCases: tc([
      ["abcabcbb", "3"],
      ["bbbbb", "1"],
      ["pwwkew", "3"],
      ["", "0"],
      [" ", "1"],
      ["au", "2"],
      ["dvdf", "3"],
      ["abba", "2"],
      ["tmmzuxt", "5"],
      ["abcdefg", "7"],
      ["aabaab!bb", "3"],
      ["anviaj", "5"],
      ["aab", "2"],
      ["cdd", "2"],
      ["ohvhjdml", "6"],
      ["ckilbkd", "5"],
      ["12345123", "5"],
      ["xxzqi", "4"],
      ["abcdeafbdgcbb", "7"],
      ["a", "1"],
    ]),
  },

  // 4. Longest Repeating Character Replacement (MEDIUM)
  {
    title: "Longest Repeating Character Replacement",
    slug: "longest-repeating-character-replacement",
    difficulty: "MEDIUM",
    pattern: "SLIDING_WINDOW",
    sheetPattern: "Sliding Window",
    statement:
      "You are given a string s and an integer k. You can choose any character of the string and change it to any other uppercase English character at most k times. Return the length of the longest substring containing the same letter you can get after performing the above operations.",
    constraints: [
      "1 <= s.length <= 10^5",
      "s consists of only uppercase English letters.",
      "0 <= k <= s.length",
    ],
    examples: [
      { input: 's = "ABAB", k = 2', output: "4" },
      { input: 's = "AABABBA", k = 1', output: "4" },
      { input: 's = "AAAA", k = 0', output: "4" },
    ],
    hints: [
      "A window [left, right] is valid if (windowLen - maxFreqInWindow) <= k.",
      "Keep a 26-letter frequency count and track maxFreq seen in the current window.",
      "Shrink left by 1 whenever windowLen - maxFreq > k.",
    ],
    starterCode: {
      java: `class Solution {
  public int characterReplacement(String s, int k) {
    return 0;
  }
}`,
      python: `class Solution:
  def characterReplacement(self, s: str, k: int) -> int:
    return 0`,
      cpp: `class Solution {
public:
  int characterReplacement(string s, int k) {
    return 0;
  }
};`,
      javascript: `/**
 * @param {string} s
 * @param {number} k
 * @return {number}
 */
var characterReplacement = function(s, k) {
  return 0;
};`,
    },
    driverCode: {
      java: `import java.util.*;
{{USER_CODE}}
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    if (!sc.hasNextLine()) return;
    String s = sc.nextLine().trim();
    int k = Integer.parseInt(sc.nextLine().trim());
    System.out.println(new Solution().characterReplacement(s, k));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  lines = sys.stdin.read().splitlines()
  if len(lines) >= 2:
    print(Solution().characterReplacement(lines[0].strip(), int(lines[1].strip())))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  string s;
  int k;
  if (!(cin >> s >> k)) return 0;
  cout << Solution().characterReplacement(s, k) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const lines = fs.readFileSync(0, "utf8").trim().split(/\\r?\\n/);
if (lines.length >= 2) {
  console.log(characterReplacement(lines[0].trim(), Number(lines[1].trim())));
}`,
    },
    testCases: tc([
      ["ABAB\n2", "4"],
      ["AABABBA\n1", "4"],
      ["AAAA\n0", "4"],
      ["A\n0", "1"],
      ["ABCDE\n1", "2"],
      ["ABCDE\n4", "5"],
      ["ABBB\n2", "4"],
      ["BAAAB\n2", "5"],
      ["KRSCDCSONAJNHLBMDQGIFCPEKPOHQIHLTDIQGEKLRLCQNBOHNDQGHJPNDQPERNFSSSRDEQLFPCCCARFMDLHADJADAGNNSBNCJQOF\n4", "7"],
      ["EOEMQLLQTRQDDCOERARHGAAARRBKCCMFTDAQOLOKARBIJBISTGNKBQGKKTALSQNFSABASNOPBMMGDIOETPTDICRBOMBAAHINTFLH\n7", "11"],
      ["ABAA\n0", "2"],
      ["AABB\n0", "2"],
      ["AABB\n1", "3"],
      ["AABB\n2", "4"],
      ["XYZXYZ\n2", "4"],
      ["ABABAB\n1", "3"],
      ["ABABAB\n3", "6"],
      ["CCCCAB\n2", "6"],
      ["Z\n1", "1"],
      ["ABACABA\n1", "3"],
    ]),
  },

  // 5. Permutation in String (MEDIUM)
  {
    title: "Permutation in String",
    slug: "permutation-in-string",
    difficulty: "MEDIUM",
    pattern: "SLIDING_WINDOW",
    sheetPattern: "Sliding Window",
    statement:
      "Given two strings s1 and s2, return true if s2 contains a permutation of s1, or false otherwise. In other words, return true if one of s1's permutations is a substring of s2.",
    constraints: [
      "1 <= s1.length, s2.length <= 10^4",
      "s1 and s2 consist of lowercase English letters.",
    ],
    examples: [
      { input: 's1 = "ab", s2 = "eidbaooo"', output: "true" },
      { input: 's1 = "ab", s2 = "eidboaoo"', output: "false" },
      { input: 's1 = "adc", s2 = "dcda"', output: "true" },
    ],
    hints: [
      "Any permutation of s1 has length s1.length and identical character frequencies.",
      "Slide a fixed-length window of size s1.length over s2.",
      "Compare the 26-letter frequency arrays (or maintain a matches counter) in O(n) time.",
    ],
    starterCode: {
      java: `class Solution {
  public boolean checkInclusion(String s1, String s2) {
    return false;
  }
}`,
      python: `class Solution:
  def checkInclusion(self, s1: str, s2: str) -> bool:
    return False`,
      cpp: `class Solution {
public:
  bool checkInclusion(string s1, string s2) {
    return false;
  }
};`,
      javascript: `/**
 * @param {string} s1
 * @param {string} s2
 * @return {boolean}
 */
var checkInclusion = function(s1, s2) {
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
    String s1 = sc.nextLine().trim();
    String s2 = sc.hasNextLine() ? sc.nextLine().trim() : "";
    System.out.println(new Solution().checkInclusion(s1, s2) ? "true" : "false");
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  lines = sys.stdin.read().splitlines()
  if len(lines) >= 2:
    print("true" if Solution().checkInclusion(lines[0].strip(), lines[1].strip()) else "false")`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  string s1, s2;
  if (!(cin >> s1 >> s2)) return 0;
  cout << (Solution().checkInclusion(s1, s2) ? "true" : "false") << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const lines = fs.readFileSync(0, "utf8").trim().split(/\\r?\\n/);
if (lines.length >= 2) {
  console.log(checkInclusion(lines[0].trim(), lines[1].trim()) ? "true" : "false");
}`,
    },
    testCases: tc([
      ["ab\neidbaooo", "true"],
      ["ab\neidboaoo", "false"],
      ["adc\ndcda", "true"],
      ["a\na", "true"],
      ["a\nb", "false"],
      ["abcd\nabc", "false"],
      ["hello\nooolleoooleh", "false"],
      ["abc\nbbbca", "true"],
      ["abc\nccccbbbbaaaa", "false"],
      ["ab\nba", "true"],
      ["xyz\nabcdef", "false"],
      ["aab\nbaa", "true"],
      ["aab\nabab", "true"],
      ["aab\naab", "true"],
      ["prosperity\nproperties", "false"],
      ["abc\nbcbca", "true"],
      ["trinitrophenylmethylnitramine\ndinitrophenylhydrazinetrinitrophenylmethylnitramine", "true"],
      ["z\nabcdefz", "true"],
      ["aa\na", "false"],
      ["cat\ntacocat", "true"],
    ]),
  },

  // 6. Minimum Size Subarray Sum (MEDIUM)
  {
    title: "Minimum Size Subarray Sum",
    slug: "minimum-size-subarray-sum",
    difficulty: "MEDIUM",
    pattern: "SLIDING_WINDOW",
    sheetPattern: "Sliding Window",
    statement:
      "Given an array of positive integers nums and a positive integer target, return the minimal length of a contiguous subarray of which the sum is greater than or equal to target. If there is no such subarray, return 0 instead.",
    constraints: [
      "1 <= target <= 10^9",
      "1 <= nums.length <= 10^5",
      "1 <= nums[i] <= 10^4",
    ],
    examples: [
      { input: "target = 7, nums = [2, 3, 1, 2, 4, 3]", output: "2" },
      { input: "target = 4, nums = [1, 4, 4]", output: "1" },
      { input: "target = 11, nums = [1, 1, 1, 1, 1, 1, 1, 1]", output: "0" },
    ],
    hints: [
      "Since all elements are positive, expanding right increases the sum and shrinking left decreases it.",
      "Expand right to grow windowSum, then shrink left in a while loop while windowSum >= target.",
      "Update minLen = min(minLen, right - left + 1) during the shrink step.",
    ],
    starterCode: {
      java: `class Solution {
  public int minSubArrayLen(int target, int[] nums) {
    return 0;
  }
}`,
      python: `class Solution:
  def minSubArrayLen(self, target: int, nums: list[int]) -> int:
    return 0`,
      cpp: `class Solution {
public:
  int minSubArrayLen(int target, vector<int>& nums) {
    return 0;
  }
};`,
      javascript: `/**
 * @param {number} target
 * @param {number[]} nums
 * @return {number}
 */
var minSubArrayLen = function(target, nums) {
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
    int target = sc.nextInt();
    int n = sc.nextInt();
    int[] nums = new int[n];
    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
    System.out.println(new Solution().minSubArrayLen(target, nums));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    target = data[0]
    n = data[1]
    print(Solution().minSubArrayLen(target, data[2:2 + n]))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int target, n;
  if (!(cin >> target >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  cout << Solution().minSubArrayLen(target, nums) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const target = data[0];
  const n = data[1];
  console.log(minSubArrayLen(target, data.slice(2, 2 + n)));
}`,
    },
    testCases: tc([
      ["7\n6\n2 3 1 2 4 3", "2"],
      ["4\n3\n1 4 4", "1"],
      ["11\n8\n1 1 1 1 1 1 1 1", "0"],
      ["1\n1\n1", "1"],
      ["5\n1\n3", "0"],
      ["15\n5\n1 2 3 4 5", "5"],
      ["15\n5\n5 1 3 5 10", "2"],
      ["6\n3\n10 2 3", "1"],
      ["9\n4\n2 3 4 5", "2"],
      ["10\n4\n2 2 2 2", "0"],
      ["8\n5\n1 2 3 4 1", "3"],
      ["100\n4\n25 25 25 25", "4"],
      ["20\n6\n2 16 14 15 1 2", "2"],
      ["7\n5\n1 1 1 1 7", "1"],
      ["12\n5\n3 4 5 2 1", "3"],
      ["5\n3\n2 3 1", "2"],
      ["3\n3\n1 1 1", "3"],
      ["10\n1\n10000", "1"],
      ["50\n5\n10 10 10 10 10", "5"],
      ["13\n6\n4 4 4 4 4 4", "4"],
    ]),
  },

  // 7. Minimum Window Substring (HARD)
  {
    title: "Minimum Window Substring",
    slug: "minimum-window-substring",
    difficulty: "HARD",
    pattern: "SLIDING_WINDOW",
    sheetPattern: "Sliding Window",
    statement:
      "Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such substring, return the empty string \"\".",
    constraints: [
      "1 <= s.length, t.length <= 10^5",
      "s and t consist of uppercase and lowercase English letters.",
    ],
    examples: [
      { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"' },
      { input: 's = "a", t = "a"', output: '"a"' },
      { input: 's = "a", t = "aa"', output: '""' },
    ],
    hints: [
      "Count the required frequency of each character in t.",
      "Expand right until all required characters (including counts) are satisfied.",
      "Shrink left while the window remains valid to minimize window length.",
    ],
    starterCode: {
      java: `class Solution {
  public String minWindow(String s, String t) {
    return "";
  }
}`,
      python: `class Solution:
  def minWindow(self, s: str, t: str) -> str:
    return ""`,
      cpp: `class Solution {
public:
  string minWindow(string s, string t) {
    return "";
  }
};`,
      javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {string}
 */
var minWindow = function(s, t) {
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
    String s = sc.nextLine();
    String t = sc.hasNextLine() ? sc.nextLine() : "";
    System.out.println(new Solution().minWindow(s, t));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  lines = sys.stdin.read().splitlines()
  if len(lines) >= 2:
    print(Solution().minWindow(lines[0], lines[1]))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  string s, t;
  if (!getline(cin, s)) return 0;
  getline(cin, t);
  cout << Solution().minWindow(s, t) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const lines = fs.readFileSync(0, "utf8").split(/\\r?\\n/);
if (lines.length >= 2) {
  console.log(minWindow(lines[0], lines[1]));
}`,
    },
    testCases: tc([
      ["ADOBECODEBANC\nABC", "BANC"],
      ["a\na", "a"],
      ["a\naa", ""],
      ["a\nb", ""],
      ["ab\na", "a"],
      ["ab\nb", "b"],
      ["abc\ncba", "abc"],
      ["aa\naa", "aa"],
      ["bba\nab", "ba"],
      ["cabwefgewcwaefgcf\ncae", "cwae"],
      ["aaaaaaaaaaaabbbbbcdd\nabcdd", "abbbbbcdd"],
      ["bdab\nab", "ab"],
      ["acbbaca\naba", "baca"],
      ["abcdef\nxyz", ""],
      ["XYZ\nZYX", "XYZ"],
      ["aaabbbccc\nabc", "abbbc"],
      ["abchelloabc\nabc", "abc"],
      ["geeksforgeeks\nork", "ksfor"],
      ["thisisateststring\ntist", "tstri"],
      ["AA\nAA", "AA"],
    ]),
  },
];
