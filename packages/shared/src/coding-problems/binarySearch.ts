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

export const BINARY_SEARCH_PROBLEMS: CuratedCodingProblem[] = [
  // 1. Binary Search (EASY)
  {
    title: "Binary Search",
    slug: "binary-search",
    difficulty: "EASY",
    pattern: "BINARY_SEARCH",
    sheetPattern: "Binary Search",
    statement:
      "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1. You must write an algorithm with O(log n) runtime complexity.",
    constraints: [
      "1 <= nums.length <= 10^4",
      "-10^4 < nums[i], target < 10^4",
      "All integers in nums are unique and sorted in ascending order.",
    ],
    examples: [
      { input: "nums = [-1, 0, 3, 5, 9, 12], target = 9", output: "4" },
      { input: "nums = [-1, 0, 3, 5, 9, 12], target = 2", output: "-1" },
      { input: "nums = [5], target = 5", output: "0" },
    ],
    hints: [
      "Maintain search bounds left = 0 and right = nums.length - 1.",
      "Use mid = left + Math.floor((right - left) / 2) to avoid overflow.",
      "Compare nums[mid] with target and discard half the search space each step.",
    ],
    starterCode: {
      java: `class Solution {
  public int search(int[] nums, int target) {
    return -1;
  }
}`,
      python: `class Solution:
  def search(self, nums: list[int], target: int) -> int:
    return -1`,
      cpp: `class Solution {
public:
  int search(vector<int>& nums, int target) {
    return -1;
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
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
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(search(data.slice(1, 1 + n), data[1 + n]));
}`,
    },
    testCases: tc([
      ["6\n-1 0 3 5 9 12\n9", "4"],
      ["6\n-1 0 3 5 9 12\n2", "-1"],
      ["1\n5\n5", "0"],
      ["1\n5\n-5", "-1"],
      ["2\n2 5\n2", "0"],
      ["2\n2 5\n5", "1"],
      ["2\n2 5\n3", "-1"],
      ["5\n-10 -5 0 5 10\n-10", "0"],
      ["5\n-10 -5 0 5 10\n10", "4"],
      ["5\n-10 -5 0 5 10\n0", "2"],
      ["5\n-10 -5 0 5 10\n11", "-1"],
      ["5\n-10 -5 0 5 10\n-11", "-1"],
      ["7\n1 3 5 7 9 11 13\n7", "3"],
      ["7\n1 3 5 7 9 11 13\n8", "-1"],
      ["4\n-9999 -100 100 9999\n-100", "1"],
      ["6\n10 20 30 40 50 60\n50", "4"],
      ["6\n10 20 30 40 50 60\n15", "-1"],
      ["3\n-3 -2 -1\n-1", "2"],
      ["4\n0 1 2 3\n0", "0"],
      ["8\n2 4 6 8 10 12 14 16\n14", "6"],
    ]),
  },

  // 2. Search Insert Position (EASY)
  {
    title: "Search Insert Position",
    slug: "search-insert-position",
    difficulty: "EASY",
    pattern: "BINARY_SEARCH",
    sheetPattern: "Binary Search",
    statement:
      "Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order. You must write an algorithm with O(log n) runtime complexity.",
    constraints: [
      "1 <= nums.length <= 10^4",
      "-10^4 <= nums[i], target <= 10^4",
      "nums contains distinct values sorted in ascending order.",
    ],
    examples: [
      { input: "nums = [1, 3, 5, 6], target = 5", output: "2" },
      { input: "nums = [1, 3, 5, 6], target = 2", output: "1" },
      { input: "nums = [1, 3, 5, 6], target = 7", output: "4" },
    ],
    hints: [
      "This is equivalent to finding the lower bound: the first index i where nums[i] >= target.",
      "Run standard binary search with lo = 0 and hi = nums.length - 1.",
      "When the loop ends without finding target, lo points to the exact insertion index.",
    ],
    starterCode: {
      java: `class Solution {
  public int searchInsert(int[] nums, int target) {
    return 0;
  }
}`,
      python: `class Solution:
  def searchInsert(self, nums: list[int], target: int) -> int:
    return 0`,
      cpp: `class Solution {
public:
  int searchInsert(vector<int>& nums, int target) {
    return 0;
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var searchInsert = function(nums, target) {
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
    int target = sc.nextInt();
    System.out.println(new Solution().searchInsert(nums, target));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(Solution().searchInsert(data[1:1 + n], data[1 + n]))`,
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
  cout << Solution().searchInsert(nums, target) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(searchInsert(data.slice(1, 1 + n), data[1 + n]));
}`,
    },
    testCases: tc([
      ["4\n1 3 5 6\n5", "2"],
      ["4\n1 3 5 6\n2", "1"],
      ["4\n1 3 5 6\n7", "4"],
      ["4\n1 3 5 6\n0", "0"],
      ["1\n1\n0", "0"],
      ["1\n1\n1", "0"],
      ["1\n1\n2", "1"],
      ["2\n1 3\n2", "1"],
      ["5\n-10 -5 0 5 10\n-7", "1"],
      ["5\n-10 -5 0 5 10\n3", "3"],
      ["5\n-10 -5 0 5 10\n10", "4"],
      ["5\n-10 -5 0 5 10\n15", "5"],
      ["5\n-10 -5 0 5 10\n-15", "0"],
      ["3\n2 4 6\n1", "0"],
      ["3\n2 4 6\n6", "2"],
      ["6\n1 2 4 8 16 32\n10", "4"],
      ["6\n1 2 4 8 16 32\n32", "5"],
      ["4\n-4 -2 0 2\n-1", "2"],
      ["4\n-4 -2 0 2\n1", "3"],
      ["5\n10 20 30 40 50\n25", "2"],
    ]),
  },

  // 3. Search a 2D Matrix (MEDIUM)
  {
    title: "Search a 2D Matrix",
    slug: "search-a-2d-matrix",
    difficulty: "MEDIUM",
    pattern: "BINARY_SEARCH",
    sheetPattern: "Binary Search",
    statement:
      "You are given an m x n integer matrix where each row is sorted in non-decreasing order and the first integer of each row is greater than the last integer of the previous row. Given an integer target, return true if target is in matrix or false otherwise in O(log(m * n)) time.",
    constraints: [
      "1 <= m, n <= 100",
      "-10^4 <= matrix[i][j], target <= 10^4",
    ],
    examples: [
      {
        input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3",
        output: "true",
      },
      {
        input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13",
        output: "false",
      },
      { input: "matrix = [[1]], target = 1", output: "true" },
    ],
    hints: [
      "Treat the m x n matrix as a single sorted 1D array of length m * n.",
      "Convert 1D index mid into 2D coordinates: row = Math.floor(mid / n), col = mid % n.",
      "Run standard binary search over [0, m * n - 1].",
    ],
    starterCode: {
      java: `class Solution {
  public boolean searchMatrix(int[][] matrix, int target) {
    return false;
  }
}`,
      python: `class Solution:
  def searchMatrix(self, matrix: list[list[int]], target: int) -> bool:
    return False`,
      cpp: `class Solution {
public:
  bool searchMatrix(vector<vector<int>>& matrix, int target) {
    return false;
  }
};`,
      javascript: `/**
 * @param {number[][]} matrix
 * @param {number} target
 * @return {boolean}
 */
var searchMatrix = function(matrix, target) {
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
    int m = sc.nextInt(), n = sc.nextInt();
    int[][] mat = new int[m][n];
    for (int i = 0; i < m; i++)
      for (int j = 0; j < n; j++) mat[i][j] = sc.nextInt();
    int target = sc.nextInt();
    System.out.println(new Solution().searchMatrix(mat, target) ? "true" : "false");
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    m, n = data[0], data[1]
    mat = [data[2 + i * n:2 + (i + 1) * n] for i in range(m)]
    target = data[2 + m * n]
    print("true" if Solution().searchMatrix(mat, target) else "false")`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int m, n;
  if (!(cin >> m >> n)) return 0;
  vector<vector<int>> mat(m, vector<int>(n));
  for (int i = 0; i < m; i++)
    for (int j = 0; j < n; j++) cin >> mat[i][j];
  int target;
  cin >> target;
  cout << (Solution().searchMatrix(mat, target) ? "true" : "false") << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const m = data[0], n = data[1];
  const mat = [];
  for (let i = 0; i < m; i++) mat.push(data.slice(2 + i * n, 2 + (i + 1) * n));
  console.log(searchMatrix(mat, data[2 + m * n]) ? "true" : "false");
}`,
    },
    testCases: tc([
      ["3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n3", "true"],
      ["3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n13", "false"],
      ["1 1\n1\n1", "true"],
      ["1 1\n1\n0", "false"],
      ["1 4\n1 3 5 7\n7", "true"],
      ["1 4\n1 3 5 7\n4", "false"],
      ["4 1\n1\n3\n5\n7\n5", "true"],
      ["4 1\n1\n3\n5\n7\n6", "false"],
      ["2 2\n-5 -3\n0 4\n-3", "true"],
      ["2 2\n-5 -3\n0 4\n-1", "false"],
      ["3 3\n1 2 3\n4 5 6\n7 8 9\n1", "true"],
      ["3 3\n1 2 3\n4 5 6\n7 8 9\n9", "true"],
      ["3 3\n1 2 3\n4 5 6\n7 8 9\n10", "false"],
      ["3 3\n1 2 3\n4 5 6\n7 8 9\n0", "false"],
      ["2 3\n10 20 30\n40 50 60\n40", "true"],
      ["2 3\n10 20 30\n40 50 60\n35", "false"],
      ["3 2\n-10 -5\n0 5\n10 15\n15", "true"],
      ["3 2\n-10 -5\n0 5\n10 15\n-11", "false"],
      ["2 4\n2 4 6 8\n10 12 14 16\n12", "true"],
      ["2 4\n2 4 6 8\n10 12 14 16\n9", "false"],
    ]),
  },

  // 4. Koko Eating Bananas (MEDIUM)
  {
    title: "Koko Eating Bananas",
    slug: "koko-eating-bananas",
    difficulty: "MEDIUM",
    pattern: "BINARY_SEARCH",
    sheetPattern: "Binary Search",
    statement:
      "Koko loves to eat bananas. There are n piles of bananas, the ith pile has piles[i] bananas. The guards have gone and will come back in h hours. Koko can decide her bananas-per-hour eating speed k. Return the minimum integer k such that she can eat all the bananas within h hours.",
    constraints: [
      "1 <= piles.length <= 10^4",
      "piles.length <= h <= 10^9",
      "1 <= piles[i] <= 10^9",
    ],
    examples: [
      { input: "piles = [3, 6, 7, 11], h = 8", output: "4" },
      { input: "piles = [30, 11, 23, 4, 20], h = 5", output: "30" },
      { input: "piles = [30, 11, 23, 4, 20], h = 6", output: "23" },
    ],
    hints: [
      "The answer k lies between 1 and max(piles).",
      "For a given speed k, total hours needed is sum(ceil(p / k)).",
      "Binary search on the answer space [1, max(piles)] to find the smallest feasible k.",
    ],
    starterCode: {
      java: `class Solution {
  public int minEatingSpeed(int[] piles, int h) {
    return 1;
  }
}`,
      python: `class Solution:
  def minEatingSpeed(self, piles: list[int], h: int) -> int:
    return 1`,
      cpp: `class Solution {
public:
  int minEatingSpeed(vector<int>& piles, int h) {
    return 1;
  }
};`,
      javascript: `/**
 * @param {number[]} piles
 * @param {number} h
 * @return {number}
 */
var minEatingSpeed = function(piles, h) {
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
    int[] piles = new int[n];
    for (int i = 0; i < n; i++) piles[i] = sc.nextInt();
    int h = sc.nextInt();
    System.out.println(new Solution().minEatingSpeed(piles, h));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(Solution().minEatingSpeed(data[1:1 + n], data[1 + n]))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> piles(n);
  for (int i = 0; i < n; i++) cin >> piles[i];
  int h;
  cin >> h;
  cout << Solution().minEatingSpeed(piles, h) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(minEatingSpeed(data.slice(1, 1 + n), data[1 + n]));
}`,
    },
    testCases: tc([
      ["4\n3 6 7 11\n8", "4"],
      ["5\n30 11 23 4 20\n5", "30"],
      ["5\n30 11 23 4 20\n6", "23"],
      ["1\n10\n10", "1"],
      ["1\n10\n1", "10"],
      ["1\n10\n3", "4"],
      ["3\n1 1 1\n3", "1"],
      ["3\n1000000000 1000000000 1000000000\n3", "1000000000"],
      ["3\n1000000000 1000000000 1000000000\n6", "500000000"],
      ["4\n2 2 2 2\n8", "1"],
      ["4\n5 5 5 5\n4", "5"],
      ["4\n5 5 5 5\n5", "5"],
      ["4\n5 5 5 5\n8", "3"],
      ["2\n312884470 968709470\n968709470", "2"],
      ["3\n8 8 8\n6", "4"],
      ["5\n1 2 3 4 5\n5", "5"],
      ["5\n1 2 3 4 5\n15", "1"],
      ["4\n10 20 30 40\n10", "10"],
      ["3\n7 7 7\n4", "7"],
      ["4\n4 8 12 16\n10", "4"],
    ]),
  },

  // 5. Find Minimum in Rotated Sorted Array (MEDIUM)
  {
    title: "Find Minimum in Rotated Sorted Array",
    slug: "find-minimum-in-rotated-sorted-array",
    difficulty: "MEDIUM",
    pattern: "BINARY_SEARCH",
    sheetPattern: "Binary Search",
    statement:
      "Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Given the sorted rotated array nums of unique elements, return the minimum element of this array in O(log n) time.",
    constraints: [
      "1 <= nums.length <= 5000",
      "-5000 <= nums[i] <= 5000",
      "All integers of nums are unique.",
    ],
    examples: [
      { input: "nums = [3, 4, 5, 1, 2]", output: "1" },
      { input: "nums = [4, 5, 6, 7, 0, 1, 2]", output: "0" },
      { input: "nums = [11, 13, 15, 17]", output: "11" },
    ],
    hints: [
      "Compare nums[mid] with nums[right] to know which half contains the pivot.",
      "If nums[mid] > nums[right], the minimum must be strictly to the right of mid.",
      "Otherwise, the minimum is at mid or to the left of mid (set right = mid).",
    ],
    starterCode: {
      java: `class Solution {
  public int findMin(int[] nums) {
    return 0;
  }
}`,
      python: `class Solution:
  def findMin(self, nums: list[int]) -> int:
    return 0`,
      cpp: `class Solution {
public:
  int findMin(vector<int>& nums) {
    return 0;
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var findMin = function(nums) {
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
    System.out.println(new Solution().findMin(nums));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(Solution().findMin(data[1:1 + n]))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  cout << Solution().findMin(nums) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(findMin(data.slice(1, 1 + n)));
}`,
    },
    testCases: tc([
      ["5\n3 4 5 1 2", "1"],
      ["7\n4 5 6 7 0 1 2", "0"],
      ["4\n11 13 15 17", "11"],
      ["1\n1", "1"],
      ["2\n2 1", "1"],
      ["2\n1 2", "1"],
      ["3\n2 3 1", "1"],
      ["3\n3 1 2", "1"],
      ["5\n5 1 2 3 4", "1"],
      ["5\n2 3 4 5 1", "1"],
      ["6\n-3 -2 -1 -10 -5 -4", "-10"],
      ["4\n-1 0 1 -2", "-2"],
      ["6\n10 20 30 40 50 5", "5"],
      ["7\n7 8 9 10 1 2 3", "1"],
      ["5\n-5000 -1000 0 1000 5000", "-5000"],
      ["5\n0 1000 5000 -5000 -1000", "-5000"],
      ["4\n6 7 8 1", "1"],
      ["4\n8 1 2 3", "1"],
      ["6\n100 200 300 10 20 30", "10"],
      ["8\n4 5 6 7 8 1 2 3", "1"],
    ]),
  },

  // 6. Search in Rotated Sorted Array (MEDIUM)
  {
    title: "Search in Rotated Sorted Array",
    slug: "search-in-rotated-sorted-array",
    difficulty: "MEDIUM",
    pattern: "BINARY_SEARCH",
    sheetPattern: "Binary Search",
    statement:
      "Given a rotated sorted array nums of distinct integers and an integer target, return the index of target if it is in nums, or -1 if it is not in nums. You must write an algorithm with O(log n) runtime complexity.",
    constraints: [
      "1 <= nums.length <= 5000",
      "-10^4 <= nums[i], target <= 10^4",
      "All values of nums are unique.",
    ],
    examples: [
      { input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 0", output: "4" },
      { input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 3", output: "-1" },
      { input: "nums = [1], target = 0", output: "-1" },
    ],
    hints: [
      "At any midpoint mid, at least one of [left, mid] or [mid, right] is strictly sorted.",
      "Check which half is sorted by comparing nums[left] <= nums[mid].",
      "If target lies inside the sorted half's range, search there; otherwise search the other half.",
    ],
    starterCode: {
      java: `class Solution {
  public int search(int[] nums, int target) {
    return -1;
  }
}`,
      python: `class Solution:
  def search(self, nums: list[int], target: int) -> int:
    return -1`,
      cpp: `class Solution {
public:
  int search(vector<int>& nums, int target) {
    return -1;
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
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
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(search(data.slice(1, 1 + n), data[1 + n]));
}`,
    },
    testCases: tc([
      ["7\n4 5 6 7 0 1 2\n0", "4"],
      ["7\n4 5 6 7 0 1 2\n3", "-1"],
      ["1\n1\n0", "-1"],
      ["1\n1\n1", "0"],
      ["2\n3 1\n1", "1"],
      ["2\n3 1\n3", "0"],
      ["2\n3 1\n2", "-1"],
      ["3\n5 1 3\n5", "0"],
      ["3\n5 1 3\n3", "2"],
      ["3\n5 1 3\n1", "1"],
      ["6\n4 5 6 7 8 1\n8", "4"],
      ["6\n4 5 6 7 8 1\n1", "5"],
      ["5\n1 2 3 4 5\n4", "3"],
      ["5\n5 1 2 3 4\n1", "1"],
      ["5\n2 3 4 5 1\n5", "3"],
      ["4\n-2 -1 -5 -3\n-5", "2"],
      ["7\n6 7 1 2 3 4 5\n4", "5"],
      ["7\n6 7 1 2 3 4 5\n7", "1"],
      ["4\n10 20 30 5\n5", "3"],
      ["4\n10 20 30 5\n15", "-1"],
    ]),
  },

  // 7. Median of Two Sorted Arrays (HARD)
  {
    title: "Median of Two Sorted Arrays",
    slug: "median-of-two-sorted-arrays",
    difficulty: "HARD",
    pattern: "BINARY_SEARCH",
    sheetPattern: "Binary Search",
    statement:
      "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log(min(m, n))).",
    constraints: [
      "0 <= m, n <= 1000",
      "1 <= m + n <= 2000",
      "-10^6 <= nums1[i], nums2[i] <= 10^6",
    ],
    examples: [
      { input: "nums1 = [1, 3], nums2 = [2]", output: "2.00000" },
      { input: "nums1 = [1, 2], nums2 = [3, 4]", output: "2.50000" },
      { input: "nums1 = [0, 0], nums2 = [0, 0]", output: "0.00000" },
    ],
    hints: [
      "Binary search on the smaller array to partition both arrays into balanced left and right halves.",
      "Let i be the cut in nums1 and j = Math.floor((m + n + 1) / 2) - i in nums2.",
      "A valid partition satisfies nums1[i - 1] <= nums2[j] and nums2[j - 1] <= nums1[i].",
    ],
    starterCode: {
      java: `class Solution {
  public double findMedianSortedArrays(int[] nums1, int[] nums2) {
    return 0.0;
  }
}`,
      python: `class Solution:
  def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:
    return 0.0`,
      cpp: `class Solution {
public:
  double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
    return 0.0;
  }
};`,
      javascript: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
var findMedianSortedArrays = function(nums1, nums2) {
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
    int m = sc.nextInt();
    int[] a = new int[m];
    for (int i = 0; i < m; i++) a[i] = sc.nextInt();
    int n = sc.nextInt();
    int[] b = new int[n];
    for (int i = 0; i < n; i++) b[i] = sc.nextInt();
    System.out.printf(Locale.US, "%.5f%n", new Solution().findMedianSortedArrays(a, b));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    m = data[0]
    a = data[1:1 + m]
    n = data[1 + m]
    b = data[2 + m:2 + m + n]
    print(f"{Solution().findMedianSortedArrays(a, b):.5f}")`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int m, n;
  if (!(cin >> m)) return 0;
  vector<int> a(m);
  for (int i = 0; i < m; i++) cin >> a[i];
  cin >> n;
  vector<int> b(n);
  for (int i = 0; i < n; i++) cin >> b[i];
  cout << fixed << setprecision(5) << Solution().findMedianSortedArrays(a, b) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const m = data[0];
  const a = data.slice(1, 1 + m);
  const n = data[1 + m];
  const b = data.slice(2 + m, 2 + m + n);
  console.log(findMedianSortedArrays(a, b).toFixed(5));
}`,
    },
    testCases: tc([
      ["2\n1 3\n1\n2", "2.00000"],
      ["2\n1 2\n2\n3 4", "2.50000"],
      ["2\n0 0\n2\n0 0", "0.00000"],
      ["0\n1\n1", "1.00000"],
      ["1\n2\n0", "2.00000"],
      ["2\n1 2\n2\n1 2", "1.50000"],
      ["3\n-5 -3 -1\n2\n-4 -2", "-3.00000"],
      ["3\n1 3 5\n3\n2 4 6", "3.50000"],
      ["1\n100000\n1\n100001", "100000.50000"],
      ["4\n1 2 3 4\n3\n5 6 7", "4.00000"],
      ["3\n5 6 7\n4\n1 2 3 4", "4.00000"],
      ["2\n1 100\n3\n2 3 4", "3.00000"],
      ["2\n-10 10\n2\n-5 5", "0.00000"],
      ["3\n1 2 3\n0", "2.00000"],
      ["0\n4\n1 2 3 4", "2.50000"],
      ["4\n1 3 8 9\n5\n7 11 18 19 21", "9.00000"],
      ["5\n1 2 3 4 5\n5\n6 7 8 9 10", "5.50000"],
      ["2\n2 2\n3\n2 2 2", "2.00000"],
      ["3\n-1000000 0 1000000\n1\n500", "250.00000"],
      ["4\n1 4 7 10\n4\n2 5 8 11", "6.00000"],
    ]),
  },
];
