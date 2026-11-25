import type { Prisma } from "@prisma/client";
import type {
  DsaPattern,
  ProblemDifficulty,
  ProblemExample,
  ProblemTestCase,
  StarterCodeMap,
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

export const CURATED_CODING_PROBLEMS: CuratedProblemSeed[] = [
  // ── EASY (4) ──────────────────────────────────────────────────────────────
  {
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "EASY",
    pattern: "ARRAYS_TWO_POINTERS",
    statement:
      "Given an array of integers nums and an integer target, return indices [i, j] (i < j) of the two numbers such that they add up to target. If no valid pair exists, return [-1, -1].",
    constraints: ["2 <= nums.length <= 10^5", "-10^9 <= nums[i], target <= 10^9"],
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
    ],
    hints: [
      "Store previously seen values and their indices in a hash map.",
      "For each element x, check if (target - x) already exists in the map.",
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
    System.out.println(Arrays.toString(new Solution().twoSum(nums, target)));
  }
}`,
      python: `import json, sys

{{USER_CODE}}

if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(json.dumps(Solution().twoSum(data[1:1 + n], data[1 + n])))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

{{USER_CODE}}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  int target;
  cin >> target;
  vector<int> res = Solution().twoSum(nums, target);
  cout << "[";
  for (size_t i = 0; i < res.size(); i++) {
    if (i > 0) cout << ", ";
    cout << res[i];
  }
  cout << "]\\n";
  return 0;
}`,
      javascript: `const fs = require("fs");

{{USER_CODE}}

const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length >= 2) {
  const n = data[0];
  console.log(JSON.stringify(twoSum(data.slice(1, 1 + n), data[1 + n])));
}`,
    },
    sampleTestCases: [
      { id: "sample-1", stdin: "4\n2 7 11 15\n9", expectedOutput: "[0, 1]", isSample: true },
      { id: "sample-2", stdin: "3\n3 2 4\n6", expectedOutput: "[1, 2]", isSample: true },
    ],
    hiddenTestCases: [
      { id: "hidden-1", stdin: "2\n3 3\n6", expectedOutput: "[0, 1]", isSample: false },
      { id: "hidden-2", stdin: "4\n-3 4 3 90\n0", expectedOutput: "[0, 2]", isSample: false },
      { id: "hidden-3", stdin: "3\n1 2 3\n10", expectedOutput: "[-1, -1]", isSample: false },
    ],
  },
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
      java: `import java.util.*;

class Solution {
  public boolean isValid(String s) {
    // Write your solution here
    return false;
  }
}`,
      python: `class Solution:
  def isValid(self, s: str) -> bool:
    # Write your solution here
    return False`,
      cpp: `class Solution {
public:
  bool isValid(string s) {
    // Write your solution here
    return false;
  }
};`,
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
  // Write your solution here
  return false;
};`,
    },
    driverCode: {
      java: `import java.util.*;

{{USER_CODE}}

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String s = sc.hasNext() ? sc.next() : "";
    System.out.println(new Solution().isValid(s));
  }
}`,
      python: `import sys

{{USER_CODE}}

if __name__ == "__main__":
  s = sys.stdin.read().strip()
  print("true" if Solution().isValid(s) else "false")`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

{{USER_CODE}}

int main() {
  string s;
  if (!(cin >> s)) s = "";
  cout << (Solution().isValid(s) ? "true" : "false") << "\\n";
  return 0;
}`,
      javascript: `const fs = require("fs");

{{USER_CODE}}

const s = fs.readFileSync(0, "utf8").trim();
console.log(isValid(s) ? "true" : "false");`,
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
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    difficulty: "EASY",
    pattern: "SLIDING_WINDOW",
    statement:
      "You are given an array prices where prices[i] is the price of a given stock on the ith day. Maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell it. Return the maximum profit, or 0 if no profit is possible.",
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    examples: [
      { input: "prices = [7, 1, 5, 3, 6, 4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 5." },
      { input: "prices = [7, 6, 4, 3, 1]", output: "0", explanation: "No profitable transaction is possible." },
    ],
    hints: ["Track the minimum price seen so far and update maxProfit = max(maxProfit, price - minPrice)."],
    starterCode: {
      java: `class Solution {
  public int maxProfit(int[] prices) {
    // Write your solution here
    return 0;
  }
}`,
      python: `class Solution:
  def maxProfit(self, prices: list[int]) -> int:
    # Write your solution here
    return 0`,
      cpp: `class Solution {
public:
  int maxProfit(vector<int>& prices) {
    // Write your solution here
    return 0;
  }
};`,
      javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {
  // Write your solution here
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
    int[] prices = new int[n];
    for (int i = 0; i < n; i++) prices[i] = sc.nextInt();
    System.out.println(new Solution().maxProfit(prices));
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
  vector<int> prices(n);
  for (int i = 0; i < n; i++) cin >> prices[i];
  cout << Solution().maxProfit(prices) << "\\n";
  return 0;
}`,
      javascript: `const fs = require("fs");

{{USER_CODE}}

const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length >= 1) {
  console.log(maxProfit(data.slice(1, 1 + data[0])));
}`,
    },
    sampleTestCases: [
      { id: "sample-1", stdin: "6\n7 1 5 3 6 4", expectedOutput: "5", isSample: true },
      { id: "sample-2", stdin: "5\n7 6 4 3 1", expectedOutput: "0", isSample: true },
    ],
    hiddenTestCases: [
      { id: "hidden-1", stdin: "1\n10", expectedOutput: "0", isSample: false },
      { id: "hidden-2", stdin: "2\n1 100", expectedOutput: "99", isSample: false },
      { id: "hidden-3", stdin: "5\n3 3 3 3 3", expectedOutput: "0", isSample: false },
    ],
  },
  {
    title: "Binary Search",
    slug: "binary-search",
    difficulty: "EASY",
    pattern: "BINARY_SEARCH",
    statement:
      "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its 0-based index. Otherwise, return -1.",
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i], target <= 10^9"],
    examples: [
      { input: "nums = [-1, 0, 3, 5, 9, 12], target = 9", output: "4", explanation: "9 exists in nums at index 4." },
      { input: "nums = [-1, 0, 3, 5, 9, 12], target = 2", output: "-1", explanation: "2 does not exist in nums." },
    ],
    hints: ["Maintain left and right pointers and bisect the search space in O(log n)."],
    starterCode: {
      java: `class Solution {
  public int search(int[] nums, int target) {
    // Write your solution here
    return -1;
  }
}`,
      python: `class Solution:
  def search(self, nums: list[int], target: int) -> int:
    # Write your solution here
    return -1`,
      cpp: `class Solution {
public:
  int search(vector<int>& nums, int target) {
    // Write your solution here
    return -1;
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
  // Write your solution here
  return -1;
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
    System.out.println(new Solution().search(nums, target));
  }
}`,
      python: `import sys

{{USER_CODE}}

if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(Solution().search(data[1:1 + n], data[1 + n]))`,
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
  cout << Solution().search(nums, target) << "\\n";
  return 0;
}`,
      javascript: `const fs = require("fs");

{{USER_CODE}}

const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length >= 2) {
  const n = data[0];
  console.log(search(data.slice(1, 1 + n), data[1 + n]));
}`,
    },
    sampleTestCases: [
      { id: "sample-1", stdin: "6\n-1 0 3 5 9 12\n9", expectedOutput: "4", isSample: true },
      { id: "sample-2", stdin: "6\n-1 0 3 5 9 12\n2", expectedOutput: "-1", isSample: true },
    ],
    hiddenTestCases: [
      { id: "hidden-1", stdin: "1\n5\n5", expectedOutput: "0", isSample: false },
      { id: "hidden-2", stdin: "1\n5\n-5", expectedOutput: "-1", isSample: false },
      { id: "hidden-3", stdin: "5\n1 2 3 4 5\n1", expectedOutput: "0", isSample: false },
    ],
  },

  // ── MEDIUM (4) ────────────────────────────────────────────────────────────
  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "MEDIUM",
    pattern: "SLIDING_WINDOW",
    statement:
      "Given a string s, find the length of the longest substring without repeating characters.",
    constraints: ["1 <= s.length <= 10^5", "s consists of printable ASCII characters."],
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with length 3.' },
      { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with length 1.' },
    ],
    hints: ["Slide a window [left, right] and track the last seen index of each character."],
    starterCode: {
      java: `import java.util.*;

class Solution {
  public int lengthOfLongestSubstring(String s) {
    // Write your solution here
    return 0;
  }
}`,
      python: `class Solution:
  def lengthOfLongestSubstring(self, s: str) -> int:
    # Write your solution here
    return 0`,
      cpp: `class Solution {
public:
  int lengthOfLongestSubstring(string s) {
    // Write your solution here
    return 0;
  }
};`,
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
  // Write your solution here
  return 0;
};`,
    },
    driverCode: {
      java: `import java.util.*;

{{USER_CODE}}

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String s = sc.hasNext() ? sc.next() : "";
    System.out.println(new Solution().lengthOfLongestSubstring(s));
  }
}`,
      python: `import sys

{{USER_CODE}}

if __name__ == "__main__":
  s = sys.stdin.read().strip()
  print(Solution().lengthOfLongestSubstring(s))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

{{USER_CODE}}

int main() {
  string s;
  if (!(cin >> s)) s = "";
  cout << Solution().lengthOfLongestSubstring(s) << "\\n";
  return 0;
}`,
      javascript: `const fs = require("fs");

{{USER_CODE}}

const s = fs.readFileSync(0, "utf8").trim();
console.log(lengthOfLongestSubstring(s));`,
    },
    sampleTestCases: [
      { id: "sample-1", stdin: "abcabcbb", expectedOutput: "3", isSample: true },
      { id: "sample-2", stdin: "bbbbb", expectedOutput: "1", isSample: true },
    ],
    hiddenTestCases: [
      { id: "hidden-1", stdin: "pwwkew", expectedOutput: "3", isSample: false },
      { id: "hidden-2", stdin: "dvdf", expectedOutput: "3", isSample: false },
      { id: "hidden-3", stdin: "abcdef", expectedOutput: "6", isSample: false },
    ],
  },
  {
    title: "3Sum",
    slug: "three-sum",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    statement:
      "Given an integer array nums, return all unique triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, j != k, and nums[i] + nums[j] + nums[k] == 0. The solution set must not contain duplicate triplets.",
    constraints: ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
    examples: [
      { input: "nums = [-1, 0, 1, 2, -1, -4]", output: "[[-1, -1, 2], [-1, 0, 1]]", explanation: "The distinct triplets that sum to 0 are [-1, -1, 2] and [-1, 0, 1]." },
      { input: "nums = [0, 1, 1]", output: "[]", explanation: "No triplet sums to 0." },
    ],
    hints: ["Sort the array, fix nums[i], and use two pointers (left, right) skipping duplicate values."],
    starterCode: {
      java: `import java.util.*;

class Solution {
  public List<List<Integer>> threeSum(int[] nums) {
    // Write your solution here
    return new ArrayList<>();
  }
}`,
      python: `class Solution:
  def threeSum(self, nums: list[int]) -> list[list[int]]:
    # Write your solution here
    return []`,
      cpp: `class Solution {
public:
  vector<vector<int>> threeSum(vector<int>& nums) {
    // Write your solution here
    return {};
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
  // Write your solution here
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
    List<List<Integer>> res = new Solution().threeSum(nums);
    for (List<Integer> t : res) Collections.sort(t);
    res.sort((a, b) -> {
      for (int i = 0; i < Math.min(a.size(), b.size()); i++) {
        int c = Integer.compare(a.get(i), b.get(i));
        if (c != 0) return c;
      }
      return Integer.compare(a.size(), b.size());
    });
    System.out.println(res.toString());
  }
}`,
      python: `import json, sys

{{USER_CODE}}

if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    res = [sorted(t) for t in Solution().threeSum(data[1:1 + n])]
    res.sort()
    print(json.dumps(res))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

{{USER_CODE}}

int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  auto res = Solution().threeSum(nums);
  for (auto& t : res) sort(t.begin(), t.end());
  sort(res.begin(), res.end());
  cout << "[";
  for (size_t i = 0; i < res.size(); i++) {
    if (i > 0) cout << ", ";
    cout << "[";
    for (size_t j = 0; j < res[i].size(); j++) {
      if (j > 0) cout << ", ";
      cout << res[i][j];
    }
    cout << "]";
  }
  cout << "]\\n";
  return 0;
}`,
      javascript: `const fs = require("fs");

{{USER_CODE}}

const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length >= 1) {
  const res = threeSum(data.slice(1, 1 + data[0]))
    .map((t) => [...t].sort((a, b) => a - b))
    .sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2]));
  console.log(JSON.stringify(res));
}`,
    },
    sampleTestCases: [
      { id: "sample-1", stdin: "6\n-1 0 1 2 -1 -4", expectedOutput: "[[-1, -1, 2], [-1, 0, 1]]", isSample: true },
      { id: "sample-2", stdin: "3\n0 1 1", expectedOutput: "[]", isSample: true },
    ],
    hiddenTestCases: [
      { id: "hidden-1", stdin: "3\n0 0 0", expectedOutput: "[[0, 0, 0]]", isSample: false },
      { id: "hidden-2", stdin: "4\n-2 0 1 1", expectedOutput: "[[-2, 1, 1]]", isSample: false },
      { id: "hidden-3", stdin: "5\n-1 -1 0 1 2", expectedOutput: "[[-1, -1, 2], [-1, 0, 1]]", isSample: false },
    ],
  },
  {
    title: "Search in Rotated Sorted Array",
    slug: "search-in-rotated-sorted-array",
    difficulty: "MEDIUM",
    pattern: "BINARY_SEARCH",
    statement:
      "There is an integer array nums sorted in ascending order (with distinct values) that is possibly rotated at an unknown pivot index. Given nums and an integer target, return the 0-based index of target if it is in nums, or -1 if it is not in nums. You must write an algorithm with O(log n) runtime complexity.",
    constraints: ["1 <= nums.length <= 5000", "-10^4 <= nums[i], target <= 10^4", "All values of nums are unique."],
    examples: [
      { input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 0", output: "4", explanation: "0 is at index 4." },
      { input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 3", output: "-1", explanation: "3 is not present." },
    ],
    hints: ["At least one half [left..mid] or [mid..right] is always sorted; check which half contains target."],
    starterCode: {
      java: `class Solution {
  public int search(int[] nums, int target) {
    // Write your solution here
    return -1;
  }
}`,
      python: `class Solution:
  def search(self, nums: list[int], target: int) -> int:
    # Write your solution here
    return -1`,
      cpp: `class Solution {
public:
  int search(vector<int>& nums, int target) {
    // Write your solution here
    return -1;
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
  // Write your solution here
  return -1;
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
    System.out.println(new Solution().search(nums, target));
  }
}`,
      python: `import sys

{{USER_CODE}}

if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(Solution().search(data[1:1 + n], data[1 + n]))`,
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
  cout << Solution().search(nums, target) << "\\n";
  return 0;
}`,
      javascript: `const fs = require("fs");

{{USER_CODE}}

const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length >= 2) {
  const n = data[0];
  console.log(search(data.slice(1, 1 + n), data[1 + n]));
}`,
    },
    sampleTestCases: [
      { id: "sample-1", stdin: "7\n4 5 6 7 0 1 2\n0", expectedOutput: "4", isSample: true },
      { id: "sample-2", stdin: "7\n4 5 6 7 0 1 2\n3", expectedOutput: "-1", isSample: true },
    ],
    hiddenTestCases: [
      { id: "hidden-1", stdin: "1\n1\n0", expectedOutput: "-1", isSample: false },
      { id: "hidden-2", stdin: "2\n3 1\n1", expectedOutput: "1", isSample: false },
      { id: "hidden-3", stdin: "5\n5 1 2 3 4\n5", expectedOutput: "0", isSample: false },
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
      java: `import java.util.*;

class Solution {
  public int coinChange(int[] coins, int amount) {
    // Write your solution here
    return -1;
  }
}`,
      python: `class Solution:
  def coinChange(self, coins: list[int], amount: int) -> int:
    # Write your solution here
    return -1`,
      cpp: `class Solution {
public:
  int coinChange(vector<int>& coins, int amount) {
    // Write your solution here
    return -1;
  }
};`,
      javascript: `/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
var coinChange = function(coins, amount) {
  // Write your solution here
  return -1;
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
    int[] coins = new int[n];
    for (int i = 0; i < n; i++) coins[i] = sc.nextInt();
    int amount = sc.nextInt();
    System.out.println(new Solution().coinChange(coins, amount));
  }
}`,
      python: `import sys

{{USER_CODE}}

if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(Solution().coinChange(data[1:1 + n], data[1 + n]))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

{{USER_CODE}}

int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> coins(n);
  for (int i = 0; i < n; i++) cin >> coins[i];
  int amount;
  cin >> amount;
  cout << Solution().coinChange(coins, amount) << "\\n";
  return 0;
}`,
      javascript: `const fs = require("fs");

{{USER_CODE}}

const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length >= 2) {
  const n = data[0];
  console.log(coinChange(data.slice(1, 1 + n), data[1 + n]));
}`,
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

  // ── HARD (4) ──────────────────────────────────────────────────────────────
  {
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    difficulty: "HARD",
    pattern: "ARRAYS_TWO_POINTERS",
    statement:
      "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    constraints: ["1 <= height.length <= 10^5", "0 <= height[i] <= 10^5"],
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6", explanation: "6 units of rainwater are trapped." },
      { input: "height = [4,2,0,3,2,5]", output: "9", explanation: "9 units trapped." },
    ],
    hints: ["Two pointers from both ends tracking leftMax and rightMax in O(n) time, O(1) space."],
    starterCode: {
      java: `class Solution {
  public int trap(int[] height) {
    // Write your solution here
    return 0;
  }
}`,
      python: `class Solution:
  def trap(self, height: list[int]) -> int:
    # Write your solution here
    return 0`,
      cpp: `class Solution {
public:
  int trap(vector<int>& height) {
    // Write your solution here
    return 0;
  }
};`,
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
var trap = function(height) {
  // Write your solution here
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
    int[] h = new int[n];
    for (int i = 0; i < n; i++) h[i] = sc.nextInt();
    System.out.println(new Solution().trap(h));
  }
}`,
      python: `import sys

{{USER_CODE}}

if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(Solution().trap(data[1:1 + n]))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

{{USER_CODE}}

int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> h(n);
  for (int i = 0; i < n; i++) cin >> h[i];
  cout << Solution().trap(h) << "\\n";
  return 0;
}`,
      javascript: `const fs = require("fs");

{{USER_CODE}}

const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length >= 1) {
  console.log(trap(data.slice(1, 1 + data[0])));
}`,
    },
    sampleTestCases: [
      { id: "sample-1", stdin: "12\n0 1 0 2 1 0 1 3 2 1 2 1", expectedOutput: "6", isSample: true },
      { id: "sample-2", stdin: "6\n4 2 0 3 2 5", expectedOutput: "9", isSample: true },
    ],
    hiddenTestCases: [
      { id: "hidden-1", stdin: "3\n3 0 3", expectedOutput: "3", isSample: false },
      { id: "hidden-2", stdin: "4\n1 2 3 4", expectedOutput: "0", isSample: false },
      { id: "hidden-3", stdin: "1\n5", expectedOutput: "0", isSample: false },
    ],
  },
  {
    title: "Minimum Window Substring",
    slug: "minimum-window-substring",
    difficulty: "HARD",
    pattern: "SLIDING_WINDOW",
    statement:
      'Given two strings s and t, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such substring, return "".',
    constraints: ["1 <= s.length, t.length <= 10^5", "s and t consist of uppercase and lowercase English letters."],
    examples: [
      { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"', explanation: 'The minimum window substring "BANC" includes A, B, and C from t.' },
      { input: 's = "a", t = "aa"', output: '""', explanation: "Both 'a's from t must be included, so no valid window exists." },
    ],
    hints: ["Expand the right pointer until all characters of t are covered, then contract the left pointer greedily."],
    starterCode: {
      java: `import java.util.*;

class Solution {
  public String minWindow(String s, String t) {
    // Write your solution here
    return "";
  }
}`,
      python: `class Solution:
  def minWindow(self, s: str, t: str) -> str:
    # Write your solution here
    return ""`,
      cpp: `class Solution {
public:
  string minWindow(string s, string t) {
    // Write your solution here
    return "";
  }
};`,
      javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {string}
 */
var minWindow = function(s, t) {
  // Write your solution here
  return "";
};`,
    },
    driverCode: {
      java: `import java.util.*;

{{USER_CODE}}

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String s = sc.hasNext() ? sc.next() : "";
    String t = sc.hasNext() ? sc.next() : "";
    System.out.println("\\"" + new Solution().minWindow(s, t) + "\\"");
  }
}`,
      python: `import json, sys

{{USER_CODE}}

if __name__ == "__main__":
  parts = sys.stdin.read().split()
  if len(parts) >= 2:
    print(json.dumps(Solution().minWindow(parts[0], parts[1])))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

{{USER_CODE}}

int main() {
  string s, t;
  if (!(cin >> s >> t)) return 0;
  cout << "\\"" << Solution().minWindow(s, t) << "\\"\\n";
  return 0;
}`,
      javascript: `const fs = require("fs");

{{USER_CODE}}

const parts = fs.readFileSync(0, "utf8").trim().split(/\\s+/);
if (parts.length >= 2) {
  console.log(JSON.stringify(minWindow(parts[0], parts[1])));
}`,
    },
    sampleTestCases: [
      { id: "sample-1", stdin: "ADOBECODEBANC\nABC", expectedOutput: '"BANC"', isSample: true },
      { id: "sample-2", stdin: "a\naa", expectedOutput: '""', isSample: true },
    ],
    hiddenTestCases: [
      { id: "hidden-1", stdin: "a\na", expectedOutput: '"a"', isSample: false },
      { id: "hidden-2", stdin: "aa\naa", expectedOutput: '"aa"', isSample: false },
      { id: "hidden-3", stdin: "cabwefgewcwaefgcf\ncae", expectedOutput: '"cwae"', isSample: false },
    ],
  },
  {
    title: "Median of Two Sorted Arrays",
    slug: "median-of-two-sorted-arrays",
    difficulty: "HARD",
    pattern: "BINARY_SEARCH",
    statement:
      "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)). Output is formatted to 5 decimal places.",
    constraints: ["0 <= m, n <= 1000", "1 <= m + n <= 2000", "-10^6 <= nums1[i], nums2[i] <= 10^6"],
    examples: [
      { input: "nums1 = [1, 3], nums2 = [2]", output: "2.00000", explanation: "Merged array = [1, 2, 3], median is 2." },
      { input: "nums1 = [1, 2], nums2 = [3, 4]", output: "2.50000", explanation: "Merged array = [1, 2, 3, 4], median is (2 + 3)/2 = 2.5." },
    ],
    hints: ["Binary search the partition index on the smaller array so left-half size == (m + n + 1) / 2."],
    starterCode: {
      java: `class Solution {
  public double findMedianSortedArrays(int[] nums1, int[] nums2) {
    // Write your solution here
    return 0.0;
  }
}`,
      python: `class Solution:
  def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:
    # Write your solution here
    return 0.0`,
      cpp: `class Solution {
public:
  double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
    // Write your solution here
    return 0.0;
  }
};`,
      javascript: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
var findMedianSortedArrays = function(nums1, nums2) {
  // Write your solution here
  return 0.0;
};`,
    },
    driverCode: {
      java: `import java.util.*;

{{USER_CODE}}

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    if (!sc.hasNextInt()) return;
    int m = sc.nextInt();
    int[] nums1 = new int[m];
    for (int i = 0; i < m; i++) nums1[i] = sc.nextInt();
    int n = sc.nextInt();
    int[] nums2 = new int[n];
    for (int i = 0; i < n; i++) nums2[i] = sc.nextInt();
    double ans = new Solution().findMedianSortedArrays(nums1, nums2);
    System.out.printf(Locale.US, "%.5f%n", ans);
  }
}`,
      python: `import sys

{{USER_CODE}}

if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    m = data[0]
    nums1 = data[1:1 + m]
    n = data[1 + m]
    nums2 = data[2 + m:2 + m + n]
    print(f"{Solution().findMedianSortedArrays(nums1, nums2):.5f}")`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

{{USER_CODE}}

int main() {
  int m;
  if (!(cin >> m)) return 0;
  vector<int> nums1(m);
  for (int i = 0; i < m; i++) cin >> nums1[i];
  int n;
  cin >> n;
  vector<int> nums2(n);
  for (int i = 0; i < n; i++) cin >> nums2[i];
  cout << fixed << setprecision(5) << Solution().findMedianSortedArrays(nums1, nums2) << "\\n";
  return 0;
}`,
      javascript: `const fs = require("fs");

{{USER_CODE}}

const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length >= 2) {
  const m = data[0];
  const nums1 = data.slice(1, 1 + m);
  const n = data[1 + m];
  const nums2 = data.slice(2 + m, 2 + m + n);
  console.log(findMedianSortedArrays(nums1, nums2).toFixed(5));
}`,
    },
    sampleTestCases: [
      { id: "sample-1", stdin: "2\n1 3\n1\n2", expectedOutput: "2.00000", isSample: true },
      { id: "sample-2", stdin: "2\n1 2\n2\n3 4", expectedOutput: "2.50000", isSample: true },
    ],
    hiddenTestCases: [
      { id: "hidden-1", stdin: "0\n1\n1", expectedOutput: "1.00000", isSample: false },
      { id: "hidden-2", stdin: "2\n0 0\n2\n0 0", expectedOutput: "0.00000", isSample: false },
      { id: "hidden-3", stdin: "3\n-5 -3 -1\n2\n2 4", expectedOutput: "-1.00000", isSample: false },
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
      java: `class Solution {
  public int minDistance(String word1, String word2) {
    // Write your solution here
    return 0;
  }
}`,
      python: `class Solution:
  def minDistance(self, word1: str, word2: str) -> int:
    # Write your solution here
    return 0`,
      cpp: `class Solution {
public:
  int minDistance(string word1, string word2) {
    // Write your solution here
    return 0;
  }
};`,
      javascript: `/**
 * @param {string} word1
 * @param {string} word2
 * @return {number}
 */
var minDistance = function(word1, word2) {
  // Write your solution here
  return 0;
};`,
    },
    driverCode: {
      java: `import java.util.*;

{{USER_CODE}}

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String w1 = sc.hasNext() ? sc.next() : "";
    String w2 = sc.hasNext() ? sc.next() : "";
    System.out.println(new Solution().minDistance(w1, w2));
  }
}`,
      python: `import sys

{{USER_CODE}}

if __name__ == "__main__":
  parts = sys.stdin.read().split()
  if len(parts) >= 2:
    print(Solution().minDistance(parts[0], parts[1]))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

{{USER_CODE}}

int main() {
  string w1, w2;
  if (!(cin >> w1 >> w2)) return 0;
  cout << Solution().minDistance(w1, w2) << "\\n";
  return 0;
}`,
      javascript: `const fs = require("fs");

{{USER_CODE}}

const parts = fs.readFileSync(0, "utf8").trim().split(/\\s+/);
if (parts.length >= 2) {
  console.log(minDistance(parts[0], parts[1]));
}`,
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

let seededInProcess = false;

/**
 * Purges unreferenced legacy/variant duplicates and ensures all 12 curated
 * LeetCode-style problems exist with up-to-date signatures and test cases.
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

  // Safely purge any unreferenced CodingProblem rows not in the 12 curated slugs
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
