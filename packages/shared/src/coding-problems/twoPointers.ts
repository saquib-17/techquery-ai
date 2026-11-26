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

export const TWO_POINTERS_PROBLEMS: CuratedCodingProblem[] = [
  // 1. Valid Palindrome (EASY)
  {
    title: "Valid Palindrome",
    slug: "valid-palindrome",
    difficulty: "EASY",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Two Pointers",
    statement:
      "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, or false otherwise.",
    constraints: [
      "1 <= s.length <= 2 * 10^5",
      "s consists only of printable ASCII characters.",
    ],
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: "true" },
      { input: 's = "race a car"', output: "false" },
      { input: 's = " "', output: "true" },
    ],
    hints: [
      "Use two pointers starting at the left and right ends of the string.",
      "Skip non-alphanumeric characters on both sides before comparing.",
      "Compare lowercase characters; if any pair mismatches, return false.",
    ],
    starterCode: {
      java: `class Solution {
  public boolean isPalindrome(String s) {
    return false;
  }
}`,
      python: `class Solution:
  def isPalindrome(self, s: str) -> bool:
    return False`,
      cpp: `class Solution {
public:
  bool isPalindrome(string s) {
    return false;
  }
};`,
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isPalindrome = function(s) {
  return false;
};`,
    },
    driverCode: {
      java: `import java.util.*;
{{USER_CODE}}
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String s = sc.hasNextLine() ? sc.nextLine() : "";
    System.out.println(new Solution().isPalindrome(s) ? "true" : "false");
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  s = sys.stdin.read().splitlines()[0] if sys.stdin.read().splitlines() else ""
  print("true" if Solution().isPalindrome(s) else "false")`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  string s;
  getline(cin, s);
  cout << (Solution().isPalindrome(s) ? "true" : "false") << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const s = fs.readFileSync(0, "utf8").split(/\\r?\\n/)[0] ?? "";
console.log(isPalindrome(s) ? "true" : "false");`,
    },
    testCases: tc([
      ["A man, a plan, a canal: Panama", "true"],
      ["race a car", "false"],
      [" ", "true"],
      ["a", "true"],
      ["0P", "false"],
      ["12321", "true"],
      ["No 'x' in Nixon", "true"],
      ["Was it a car or a cat I saw?", "true"],
      [".,!@#", "true"],
      ["ab", "false"],
      ["aa", "true"],
      ["Madam, I'm Adam", "true"],
      ["Eva, can I see bees in a cave?", "true"],
      ["hello world", "false"],
      ["a1b2b1a", "true"],
      ["1a2", "false"],
      ["Able was I ere I saw Elba", "true"],
      ["Borrow or rob?", "true"],
      ["ab_a", "true"],
      ["xyzzy", "false"],
    ]),
  },

  // 2. Move Zeroes (EASY)
  {
    title: "Move Zeroes",
    slug: "move-zeroes",
    difficulty: "EASY",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Two Pointers",
    statement:
      "Given an integer array nums, move all 0's to the end of it while maintaining the relative order of the non-zero elements. Note that you must do this in-place without making a copy of the array.",
    constraints: [
      "1 <= nums.length <= 10^4",
      "-2^31 <= nums[i] <= 2^31 - 1",
    ],
    examples: [
      { input: "nums = [0, 1, 0, 3, 12]", output: "[1, 3, 12, 0, 0]" },
      { input: "nums = [0]", output: "[0]" },
      { input: "nums = [1, 2, 3]", output: "[1, 2, 3]" },
    ],
    hints: [
      "Maintain a write pointer for the next non-zero position.",
      "Whenever you see a non-zero element, swap it with the write pointer and advance both.",
      "This preserves relative order and runs in O(n) time, O(1) space.",
    ],
    starterCode: {
      java: `class Solution {
  public void moveZeroes(int[] nums) {
    // Modify nums in-place
  }
}`,
      python: `class Solution:
  def moveZeroes(self, nums: list[int]) -> None:
    # Modify nums in-place
    pass`,
      cpp: `class Solution {
public:
  void moveZeroes(vector<int>& nums) {
    // Modify nums in-place
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var moveZeroes = function(nums) {
  // Modify nums in-place
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
    new Solution().moveZeroes(nums);
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < n; i++) {
      if (i > 0) sb.append(",");
      sb.append(nums[i]);
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
    nums = data[1:1 + n]
    Solution().moveZeroes(nums)
    print(json.dumps(nums, separators=(",", ":")))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  Solution().moveZeroes(nums);
  cout << "[";
  for (int i = 0; i < n; i++) {
    if (i) cout << ",";
    cout << nums[i];
  }
  cout << "]\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  const nums = data.slice(1, 1 + n);
  moveZeroes(nums);
  console.log(JSON.stringify(nums));
}`,
    },
    testCases: tc([
      ["5\n0 1 0 3 12", "[1,3,12,0,0]"],
      ["1\n0", "[0]"],
      ["3\n1 2 3", "[1,2,3]"],
      ["1\n5", "[5]"],
      ["4\n0 0 0 0", "[0,0,0,0]"],
      ["4\n0 0 0 1", "[1,0,0,0]"],
      ["4\n1 0 0 0", "[1,0,0,0]"],
      ["5\n-1 0 -2 0 -3", "[-1,-2,-3,0,0]"],
      ["6\n0 0 1 2 0 3", "[1,2,3,0,0,0]"],
      ["2\n0 1", "[1,0]"],
      ["2\n1 0", "[1,0]"],
      ["7\n4 2 4 0 0 3 0", "[4,2,4,3,0,0,0]"],
      ["5\n10 0 20 0 30", "[10,20,30,0,0]"],
      ["3\n0 -5 0", "[-5,0,0]"],
      ["6\n1 0 2 0 3 0", "[1,2,3,0,0,0]"],
      ["4\n-100 0 100 0", "[-100,100,0,0]"],
      ["5\n0 0 5 0 0", "[5,0,0,0,0]"],
      ["6\n9 8 7 6 5 4", "[9,8,7,6,5,4]"],
      ["3\n0 0 9", "[9,0,0]"],
      ["4\n2 0 0 1", "[2,1,0,0]"],
    ]),
  },

  // 3. Squares of a Sorted Array (EASY)
  {
    title: "Squares of a Sorted Array",
    slug: "squares-of-a-sorted-array",
    difficulty: "EASY",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Two Pointers",
    statement:
      "Given an integer array nums sorted in non-decreasing order, return an array of the squares of each number sorted in non-decreasing order.",
    constraints: [
      "1 <= nums.length <= 10^4",
      "-10^4 <= nums[i] <= 10^4",
      "nums is sorted in non-decreasing order.",
    ],
    examples: [
      { input: "nums = [-4, -1, 0, 3, 10]", output: "[0, 1, 9, 16, 100]" },
      { input: "nums = [-7, -3, 2, 3, 11]", output: "[4, 9, 9, 49, 121]" },
      { input: "nums = [0]", output: "[0]" },
    ],
    hints: [
      "The largest squares are at the extreme ends (most negative or most positive).",
      "Use two pointers at left = 0 and right = n - 1, filling the result array from the back.",
      "Compare abs(nums[left]) and abs(nums[right]) at each step for O(n) time.",
    ],
    starterCode: {
      java: `class Solution {
  public int[] sortedSquares(int[] nums) {
    return new int[0];
  }
}`,
      python: `class Solution:
  def sortedSquares(self, nums: list[int]) -> list[int]:
    return []`,
      cpp: `class Solution {
public:
  vector<int> sortedSquares(vector<int>& nums) {
    return {};
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
var sortedSquares = function(nums) {
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
    int[] res = new Solution().sortedSquares(nums);
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
    print(json.dumps(Solution().sortedSquares(data[1:1 + n]), separators=(",", ":")))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  auto res = Solution().sortedSquares(nums);
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
  console.log(JSON.stringify(sortedSquares(data.slice(1, 1 + n))));
}`,
    },
    testCases: tc([
      ["5\n-4 -1 0 3 10", "[0,1,9,16,100]"],
      ["5\n-7 -3 2 3 11", "[4,9,9,49,121]"],
      ["1\n0", "[0]"],
      ["1\n-5", "[25]"],
      ["4\n1 2 3 4", "[1,4,9,16]"],
      ["4\n-4 -3 -2 -1", "[1,4,9,16]"],
      ["3\n-2 0 2", "[0,4,4]"],
      ["5\n-5 -5 0 5 5", "[0,25,25,25,25]"],
      ["2\n-10000 10000", "[100000000,100000000]"],
      ["3\n-1 0 1", "[0,1,1]"],
      ["4\n0 0 0 0", "[0,0,0,0]"],
      ["6\n-6 -4 -2 1 3 5", "[1,4,9,16,25,36]"],
      ["5\n-10 -3 -1 2 4", "[1,4,9,16,100]"],
      ["2\n-3 2", "[4,9]"],
      ["2\n-2 3", "[4,9]"],
      ["4\n2 2 2 2", "[4,4,4,4]"],
      ["5\n-8 -4 0 4 8", "[0,16,16,64,64]"],
      ["3\n-9 -8 -7", "[49,64,81]"],
      ["4\n-1 1 2 3", "[1,1,4,9]"],
      ["6\n-5 -3 -1 0 2 4", "[0,1,4,9,16,25]"],
    ]),
  },

  // 4. Two Sum II - Input Array Is Sorted (MEDIUM)
  {
    title: "Two Sum II - Input Array Is Sorted",
    slug: "two-sum-ii-input-array-is-sorted",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Two Pointers",
    statement:
      "Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number. Return the 1-based indices [index1, index2] as an integer array of length 2. Your solution must use only constant extra space.",
    constraints: [
      "2 <= numbers.length <= 3 * 10^4",
      "-1000 <= numbers[i] <= 1000",
      "numbers is sorted in non-decreasing order.",
      "Exactly one solution exists.",
    ],
    examples: [
      { input: "numbers = [2, 7, 11, 15], target = 9", output: "[1, 2]" },
      { input: "numbers = [2, 3, 4], target = 6", output: "[1, 3]" },
      { input: "numbers = [-1, 0], target = -1", output: "[1, 2]" },
    ],
    hints: [
      "Because the array is sorted, start with left = 0 and right = n - 1.",
      "If numbers[left] + numbers[right] < target, increment left to increase the sum.",
      "If numbers[left] + numbers[right] > target, decrement right to decrease the sum.",
    ],
    starterCode: {
      java: `class Solution {
  public int[] twoSum(int[] numbers, int target) {
    return new int[]{-1, -1};
  }
}`,
      python: `class Solution:
  def twoSum(self, numbers: list[int], target: int) -> list[int]:
    return [-1, -1]`,
      cpp: `class Solution {
public:
  vector<int> twoSum(vector<int>& numbers, int target) {
    return {-1, -1};
  }
};`,
      javascript: `/**
 * @param {number[]} numbers
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(numbers, target) {
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
  auto res = Solution().twoSum(nums, target);
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
      ["4\n2 7 11 15\n9", "[1,2]"],
      ["3\n2 3 4\n6", "[1,3]"],
      ["2\n-1 0\n-1", "[1,2]"],
      ["2\n0 0\n0", "[1,2]"],
      ["5\n-10 -3 0 4 12\n9", "[2,5]"],
      ["4\n1 2 3 4\n7", "[3,4]"],
      ["6\n-5 -2 1 3 6 10\n4", "[2,5]"],
      ["3\n5 25 75\n100", "[2,3]"],
      ["4\n-1000 -500 500 1000\n0", "[1,4]"],
      ["5\n1 3 5 7 9\n12", "[2,5]"],
      ["2\n1000 1000\n2000", "[1,2]"],
      ["4\n-4 -1 2 5\n1", "[1,4]"],
      ["6\n1 1 2 3 4 5\n9", "[5,6]"],
      ["5\n-9 -4 0 2 6\n-2", "[2,4]"],
      ["3\n10 20 30\n50", "[2,3]"],
      ["4\n-3 -2 -1 0\n-5", "[1,2]"],
      ["5\n2 4 6 8 10\n14", "[2,5]"],
      ["4\n0 1 2 3\n3", "[1,4]"],
      ["3\n-500 0 500\n0", "[1,3]"],
      ["5\n3 6 9 12 15\n21", "[2,5]"],
    ]),
  },

  // 5. 3Sum (MEDIUM)
  {
    title: "3Sum",
    slug: "three-sum",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Two Pointers",
    statement:
      "Given an integer array nums, return all unique triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, j != k, and nums[i] + nums[j] + nums[k] == 0.",
    constraints: [
      "3 <= nums.length <= 3000",
      "-10^5 <= nums[i] <= 10^5",
    ],
    examples: [
      {
        input: "nums = [-1, 0, 1, 2, -1, -4]",
        output: "[[-1, -1, 2], [-1, 0, 1]]",
      },
      { input: "nums = [0, 1, 1]", output: "[]" },
      { input: "nums = [0, 0, 0]", output: "[[0, 0, 0]]" },
    ],
    hints: [
      "Sort the array first so duplicate values sit adjacent to each other.",
      "Fix nums[i] and run a two-pointer search on [i + 1, n - 1] for target = -nums[i].",
      "Skip duplicate values for i, left, and right after recording a valid triplet.",
    ],
    starterCode: {
      java: `class Solution {
  public List<List<Integer>> threeSum(int[] nums) {
    return new ArrayList<>();
  }
}`,
      python: `class Solution:
  def threeSum(self, nums: list[int]) -> list[list[int]]:
    return []`,
      cpp: `class Solution {
public:
  vector<vector<int>> threeSum(vector<int>& nums) {
    return {};
  }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
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
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < res.size(); i++) {
      if (i > 0) sb.append(",");
      Collections.sort(res.get(i));
      sb.append("[");
      for (int j = 0; j < res.get(i).size(); j++) {
        if (j > 0) sb.append(",");
        sb.append(res.get(i).get(j));
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
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    res = sorted([sorted(t) for t in Solution().threeSum(data[1:1 + n])])
    print(json.dumps(res, separators=(",", ":")))`,
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
    if (i) cout << ",";
    cout << "[" << res[i][0] << "," << res[i][1] << "," << res[i][2] << "]";
  }
  cout << "]\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  const res = threeSum(data.slice(1, 1 + n)).map((t) => [...t].sort((a, b) => a - b));
  res.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  console.log(JSON.stringify(res));
}`,
    },
    testCases: tc([
      ["6\n-1 0 1 2 -1 -4", "[[-1,-1,2],[-1,0,1]]"],
      ["3\n0 1 1", "[]"],
      ["3\n0 0 0", "[[0,0,0]]"],
      ["4\n0 0 0 0", "[[0,0,0]]"],
      ["5\n-2 0 1 1 2", "[[-2,0,2],[-2,1,1]]"],
      ["3\n1 2 -3", "[[-3,1,2]]"],
      ["4\n-1 -1 2 0", "[[-1,-1,2]]"],
      ["5\n1 2 3 4 5", "[]"],
      ["5\n-5 -4 -3 -2 -1", "[]"],
      ["6\n-2 -2 0 0 2 2", "[[-2,0,2]]"],
      ["7\n-4 -2 -1 0 1 2 3", "[[-4,1,3],[-2,-1,3],[-2,0,2],[-1,0,1]]"],
      ["4\n-1 0 1 0", "[[-1,0,1]]"],
      ["6\n3 0 -2 -1 1 2", "[[-2,-1,3],[-2,0,2],[-1,0,1]]"],
      ["5\n-3 1 2 -1 4", "[[-3,-1,4],[-3,1,2]]"],
      ["3\n-100000 0 100000", "[[-100000,0,100000]]"],
      ["6\n-1 -1 -1 2 2 2", "[[-1,-1,2]]"],
      ["4\n-5 2 3 0", "[[-5,2,3]]"],
      ["5\n0 0 0 1 -1", "[[-1,0,1],[0,0,0]]"],
      ["6\n-2 1 1 -2 1 1", "[[-2,1,1]]"],
      ["4\n10 -5 -5 0", "[[-5,-5,10]]"],
    ]),
  },

  // 6. Container With Most Water (MEDIUM)
  {
    title: "Container With Most Water",
    slug: "container-with-most-water",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Two Pointers",
    statement:
      "You are given an integer array height of length n. Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.",
    constraints: [
      "2 <= height.length <= 10^5",
      "0 <= height[i] <= 10^4",
    ],
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49" },
      { input: "height = [1, 1]", output: "1" },
      { input: "height = [4, 3, 2, 1, 4]", output: "16" },
    ],
    hints: [
      "Start with the widest container: left = 0 and right = n - 1.",
      "The area is min(height[left], height[right]) * (right - left).",
      "Always move the pointer pointing to the shorter line inward.",
    ],
    starterCode: {
      java: `class Solution {
  public int maxArea(int[] height) {
    return 0;
  }
}`,
      python: `class Solution:
  def maxArea(self, height: list[int]) -> int:
    return 0`,
      cpp: `class Solution {
public:
  int maxArea(vector<int>& height) {
    return 0;
  }
};`,
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function(height) {
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
    System.out.println(new Solution().maxArea(h));
  }
}`,
      python: `import sys
{{USER_CODE}}
if __name__ == "__main__":
  data = list(map(int, sys.stdin.read().split()))
  if data:
    n = data[0]
    print(Solution().maxArea(data[1:1 + n]))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main() {
  int n;
  if (!(cin >> n)) return 0;
  vector<int> h(n);
  for (int i = 0; i < n; i++) cin >> h[i];
  cout << Solution().maxArea(h) << "\\n";
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(maxArea(data.slice(1, 1 + n)));
}`,
    },
    testCases: tc([
      ["9\n1 8 6 2 5 4 8 3 7", "49"],
      ["2\n1 1", "1"],
      ["5\n4 3 2 1 4", "16"],
      ["2\n0 0", "0"],
      ["2\n0 100", "0"],
      ["5\n1 2 3 4 5", "6"],
      ["5\n5 4 3 2 1", "6"],
      ["3\n1 2 1", "2"],
      ["4\n2 3 10 5", "6"],
      ["6\n1 3 2 5 25 24", "24"],
      ["5\n10 9 8 7 6", "24"],
      ["4\n10000 1 1 10000", "30000"],
      ["7\n2 3 4 5 18 17 6", "17"],
      ["3\n5 1 5", "10"],
      ["6\n0 1 0 2 1 0", "3"],
      ["5\n7 1 1 1 7", "28"],
      ["4\n3 9 3 4", "9"],
      ["5\n8 2 9 1 8", "32"],
      ["3\n100 1 100", "200"],
      ["6\n5 5 5 5 5 5", "25"],
    ]),
  },

  // 7. Trapping Rain Water (HARD)
  {
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    difficulty: "HARD",
    pattern: "ARRAYS_TWO_POINTERS",
    sheetPattern: "Two Pointers",
    statement:
      "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    constraints: [
      "1 <= height.length <= 2 * 10^4",
      "0 <= height[i] <= 10^5",
    ],
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" },
      { input: "height = [4,2,0,3,2,5]", output: "9" },
      { input: "height = [2,0,2]", output: "2" },
    ],
    hints: [
      "Water above index i depends on min(maxLeft, maxRight) - height[i].",
      "Use two pointers left and right with running leftMax and rightMax.",
      "Always advance the side with the smaller max wall in O(n) time and O(1) space.",
    ],
    starterCode: {
      java: `class Solution {
  public int trap(int[] height) {
    return 0;
  }
}`,
      python: `class Solution:
  def trap(self, height: list[int]) -> int:
    return 0`,
      cpp: `class Solution {
public:
  int trap(vector<int>& height) {
    return 0;
  }
};`,
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
var trap = function(height) {
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
}`,
      javascript: `const fs = require("fs");
{{USER_CODE}}
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
if (data.length && !Number.isNaN(data[0])) {
  const n = data[0];
  console.log(trap(data.slice(1, 1 + n)));
}`,
    },
    testCases: tc([
      ["12\n0 1 0 2 1 0 1 3 2 1 2 1", "6"],
      ["6\n4 2 0 3 2 5", "9"],
      ["3\n2 0 2", "2"],
      ["1\n5", "0"],
      ["2\n5 1", "0"],
      ["4\n1 2 3 4", "0"],
      ["4\n4 3 2 1", "0"],
      ["5\n3 0 0 0 3", "9"],
      ["5\n0 0 0 0 0", "0"],
      ["6\n5 4 1 2 4 5", "9"],
      ["7\n3 0 2 0 4 0 2", "9"],
      ["4\n1 0 0 1", "2"],
      ["5\n5 1 5 1 5", "8"],
      ["6\n2 1 0 1 2 1", "4"],
      ["3\n100000 0 100000", "100000"],
      ["6\n0 2 0 2 0 2", "4"],
      ["5\n1 3 2 4 1", "1"],
      ["8\n6 4 2 0 3 2 0 3", "8"],
      ["4\n4 2 3 4", "3"],
      ["7\n5 2 1 2 1 5 2", "14"],
    ]),
  },
];
