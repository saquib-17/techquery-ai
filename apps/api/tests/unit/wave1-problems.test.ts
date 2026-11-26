import { describe, it, expect } from "vitest";
import vm from "node:vm";
import {
  WAVE_1_CODING_PROBLEMS,
  getCodingProblemBySlug,
  getRunnableProblemSlugs,
  type ProblemTestCase,
} from "@techquery/shared";
import { buildBatchCode, parseBatchStdout } from "../../src/modules/coding/batchHarness.js";
import {
  translateExecutionError,
  translateJudge0ServiceError,
} from "../../src/modules/coding/errorTranslator.js";

const JS_REFERENCE_SOLUTIONS: Record<string, string> = {
  "two-sum": `var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
      const need = target - nums[i];
      if (map.has(need)) return [map.get(need), i];
      map.set(nums[i], i);
    }
    return [-1, -1];
  };`,
  "contains-duplicate": `var containsDuplicate = function(nums) {
    return new Set(nums).size !== nums.length;
  };`,
  "valid-anagram": `var isAnagram = function(s, t) {
    if (s.length !== t.length) return false;
    const cnt = new Array(26).fill(0);
    for (let i = 0; i < s.length; i++) {
      cnt[s.charCodeAt(i) - 97]++;
      cnt[t.charCodeAt(i) - 97]--;
    }
    return cnt.every((c) => c === 0);
  };`,
  "group-anagrams": `var groupAnagrams = function(strs) {
    const map = new Map();
    for (const s of strs) {
      const key = s.split("").sort().join("");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return Array.from(map.values());
  };`,
  "top-k-frequent-elements": `var topKFrequent = function(nums, k) {
    const freq = new Map();
    for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map((e) => e[0]);
  };`,
  "longest-consecutive-sequence": `var longestConsecutive = function(nums) {
    const set = new Set(nums);
    let best = 0;
    for (const x of set) {
      if (!set.has(x - 1)) {
        let cur = x, len = 1;
        while (set.has(cur + 1)) { cur++; len++; }
        if (len > best) best = len;
      }
    }
    return best;
  };`,
  "first-missing-positive": `var firstMissingPositive = function(nums) {
    const n = nums.length;
    for (let i = 0; i < n; i++) {
      while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
        const tmp = nums[nums[i] - 1];
        nums[nums[i] - 1] = nums[i];
        nums[i] = tmp;
      }
    }
    for (let i = 0; i < n; i++) {
      if (nums[i] !== i + 1) return i + 1;
    }
    return n + 1;
  };`,
  "valid-palindrome": `var isPalindrome = function(s) {
    const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    let l = 0, r = clean.length - 1;
    while (l < r) {
      if (clean[l++] !== clean[r--]) return false;
    }
    return true;
  };`,
  "move-zeroes": `var moveZeroes = function(nums) {
    let w = 0;
    for (let r = 0; r < nums.length; r++) {
      if (nums[r] !== 0) {
        [nums[w], nums[r]] = [nums[r], nums[w]];
        w++;
      }
    }
  };`,
  "squares-of-a-sorted-array": `var sortedSquares = function(nums) {
    const res = new Array(nums.length);
    let l = 0, r = nums.length - 1, p = nums.length - 1;
    while (l <= r) {
      if (Math.abs(nums[l]) > Math.abs(nums[r])) {
        res[p--] = nums[l] * nums[l];
        l++;
      } else {
        res[p--] = nums[r] * nums[r];
        r--;
      }
    }
    return res;
  };`,
  "two-sum-ii-input-array-is-sorted": `var twoSum = function(numbers, target) {
    let l = 0, r = numbers.length - 1;
    while (l < r) {
      const sum = numbers[l] + numbers[r];
      if (sum === target) return [l + 1, r + 1];
      if (sum < target) l++; else r--;
    }
    return [-1, -1];
  };`,
  "three-sum": `var threeSum = function(nums) {
    nums.sort((a, b) => a - b);
    const res = [];
    for (let i = 0; i < nums.length - 2; i++) {
      if (i > 0 && nums[i] === nums[i - 1]) continue;
      let l = i + 1, r = nums.length - 1;
      while (l < r) {
        const s = nums[i] + nums[l] + nums[r];
        if (s === 0) {
          res.push([nums[i], nums[l], nums[r]]);
          while (l < r && nums[l] === nums[l + 1]) l++;
          while (l < r && nums[r] === nums[r - 1]) r--;
          l++; r--;
        } else if (s < 0) l++; else r--;
      }
    }
    return res;
  };`,
  "container-with-most-water": `var maxArea = function(height) {
    let l = 0, r = height.length - 1, best = 0;
    while (l < r) {
      best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
      if (height[l] < height[r]) l++; else r--;
    }
    return best;
  };`,
  "trapping-rain-water": `var trap = function(height) {
    let l = 0, r = height.length - 1, lMax = 0, rMax = 0, ans = 0;
    while (l < r) {
      if (height[l] < height[r]) {
        lMax = Math.max(lMax, height[l]);
        ans += lMax - height[l++];
      } else {
        rMax = Math.max(rMax, height[r]);
        ans += rMax - height[r--];
      }
    }
    return ans;
  };`,
  "best-time-to-buy-and-sell-stock": `var maxProfit = function(prices) {
    let minP = Infinity, best = 0;
    for (const p of prices) {
      if (p < minP) minP = p;
      else if (p - minP > best) best = p - minP;
    }
    return best;
  };`,
  "maximum-average-subarray-i": `var findMaxAverage = function(nums, k) {
    let sum = 0;
    for (let i = 0; i < k; i++) sum += nums[i];
    let best = sum;
    for (let i = k; i < nums.length; i++) {
      sum += nums[i] - nums[i - k];
      if (sum > best) best = sum;
    }
    return best / k;
  };`,
  "longest-substring-without-repeating-characters": `var lengthOfLongestSubstring = function(s) {
    const seen = new Map();
    let l = 0, best = 0;
    for (let r = 0; r < s.length; r++) {
      if (seen.has(s[r]) && seen.get(s[r]) >= l) l = seen.get(s[r]) + 1;
      seen.set(s[r], r);
      best = Math.max(best, r - l + 1);
    }
    return best;
  };`,
  "longest-repeating-character-replacement": `var characterReplacement = function(s, k) {
    const cnt = new Array(26).fill(0);
    let l = 0, maxF = 0, best = 0;
    for (let r = 0; r < s.length; r++) {
      const idx = s.charCodeAt(r) - 65;
      maxF = Math.max(maxF, ++cnt[idx]);
      while (r - l + 1 - maxF > k) cnt[s.charCodeAt(l++) - 65]--;
      best = Math.max(best, r - l + 1);
    }
    return best;
  };`,
  "permutation-in-string": `var checkInclusion = function(s1, s2) {
    if (s1.length > s2.length) return false;
    const c1 = new Array(26).fill(0), c2 = new Array(26).fill(0);
    for (let i = 0; i < s1.length; i++) {
      c1[s1.charCodeAt(i) - 97]++;
      c2[s2.charCodeAt(i) - 97]++;
    }
    const eq = () => c1.every((v, i) => v === c2[i]);
    if (eq()) return true;
    for (let i = s1.length; i < s2.length; i++) {
      c2[s2.charCodeAt(i) - 97]++;
      c2[s2.charCodeAt(i - s1.length) - 97]--;
      if (eq()) return true;
    }
    return false;
  };`,
  "minimum-size-subarray-sum": `var minSubArrayLen = function(target, nums) {
    let l = 0, sum = 0, best = Infinity;
    for (let r = 0; r < nums.length; r++) {
      sum += nums[r];
      while (sum >= target) {
        best = Math.min(best, r - l + 1);
        sum -= nums[l++];
      }
    }
    return best === Infinity ? 0 : best;
  };`,
  "minimum-window-substring": `var minWindow = function(s, t) {
    if (!t.length || s.length < t.length) return "";
    const need = new Map();
    for (const ch of t) need.set(ch, (need.get(ch) || 0) + 1);
    let req = need.size, formed = 0, l = 0, bestLen = Infinity, bestL = 0;
    const win = new Map();
    for (let r = 0; r < s.length; r++) {
      const c = s[r];
      win.set(c, (win.get(c) || 0) + 1);
      if (need.has(c) && win.get(c) === need.get(c)) formed++;
      while (l <= r && formed === req) {
        if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
        const lc = s[l++];
        win.set(lc, win.get(lc) - 1);
        if (need.has(lc) && win.get(lc) < need.get(lc)) formed--;
      }
    }
    return bestLen === Infinity ? "" : s.slice(bestL, bestL + bestLen);
  };`,
  "binary-search": `var search = function(nums, target) {
    let l = 0, r = nums.length - 1;
    while (l <= r) {
      const m = l + ((r - l) >> 1);
      if (nums[m] === target) return m;
      if (nums[m] < target) l = m + 1; else r = m - 1;
    }
    return -1;
  };`,
  "search-insert-position": `var searchInsert = function(nums, target) {
    let l = 0, r = nums.length - 1;
    while (l <= r) {
      const m = l + ((r - l) >> 1);
      if (nums[m] === target) return m;
      if (nums[m] < target) l = m + 1; else r = m - 1;
    }
    return l;
  };`,
  "search-a-2d-matrix": `var searchMatrix = function(matrix, target) {
    const m = matrix.length, n = matrix[0].length;
    let l = 0, r = m * n - 1;
    while (l <= r) {
      const mid = l + ((r - l) >> 1);
      const v = matrix[Math.floor(mid / n)][mid % n];
      if (v === target) return true;
      if (v < target) l = mid + 1; else r = mid - 1;
    }
    return false;
  };`,
  "koko-eating-bananas": `var minEatingSpeed = function(piles, h) {
    let l = 1, r = Math.max(...piles);
    while (l < r) {
      const m = Math.floor((l + r) / 2);
      let hrs = 0;
      for (const p of piles) hrs += Math.ceil(p / m);
      if (hrs <= h) r = m; else l = m + 1;
    }
    return l;
  };`,
  "find-minimum-in-rotated-sorted-array": `var findMin = function(nums) {
    let l = 0, r = nums.length - 1;
    while (l < r) {
      const m = l + ((r - l) >> 1);
      if (nums[m] > nums[r]) l = m + 1; else r = m;
    }
    return nums[l];
  };`,
  "search-in-rotated-sorted-array": `var search = function(nums, target) {
    let l = 0, r = nums.length - 1;
    while (l <= r) {
      const m = l + ((r - l) >> 1);
      if (nums[m] === target) return m;
      if (nums[l] <= nums[m]) {
        if (nums[l] <= target && target < nums[m]) r = m - 1; else l = m + 1;
      } else {
        if (nums[m] < target && target <= nums[r]) l = m + 1; else r = m - 1;
      }
    }
    return -1;
  };`,
  "median-of-two-sorted-arrays": `var findMedianSortedArrays = function(nums1, nums2) {
    if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);
    const m = nums1.length, n = nums2.length;
    let l = 0, r = m;
    while (l <= r) {
      const i = (l + r) >> 1, j = ((m + n + 1) >> 1) - i;
      const l1 = i === 0 ? -Infinity : nums1[i - 1];
      const r1 = i === m ? Infinity : nums1[i];
      const l2 = j === 0 ? -Infinity : nums2[j - 1];
      const r2 = j === n ? Infinity : nums2[j];
      if (l1 <= r2 && l2 <= r1) {
        return (m + n) % 2 === 1 ? Math.max(l1, l2) : (Math.max(l1, l2) + Math.min(r1, r2)) / 2;
      }
      if (l1 > r2) r = i - 1; else l = i + 1;
    }
    return 0;
  };`,
  "running-sum-of-1d-array": `var runningSum = function(nums) {
    const res = [];
    let s = 0;
    for (const x of nums) { s += x; res.push(s); }
    return res;
  };`,
  "longest-common-prefix": `var longestCommonPrefix = function(strs) {
    if (!strs.length) return "";
    for (let i = 0; i < strs[0].length; i++) {
      const c = strs[0][i];
      for (let j = 1; j < strs.length; j++) {
        if (i >= strs[j].length || strs[j][i] !== c) return strs[0].slice(0, i);
      }
    }
    return strs[0];
  };`,
  "product-of-array-except-self": `var productExceptSelf = function(nums) {
    const n = nums.length, res = new Array(n).fill(1);
    let pref = 1;
    for (let i = 0; i < n; i++) { res[i] = pref; pref *= nums[i]; }
    let suf = 1;
    for (let i = n - 1; i >= 0; i--) { res[i] *= suf; suf *= nums[i]; }
    return res.map((v) => (Object.is(v, -0) ? 0 : v));
  };`,
  "subarray-sum-equals-k": `var subarraySum = function(nums, k) {
    const map = new Map([[0, 1]]);
    let sum = 0, ans = 0;
    for (const x of nums) {
      sum += x;
      ans += map.get(sum - k) || 0;
      map.set(sum, (map.get(sum) || 0) + 1);
    }
    return ans;
  };`,
  "longest-palindromic-substring": `var longestPalindrome = function(s) {
    let bestL = 0, bestLen = 1;
    const expand = (l, r) => {
      while (l >= 0 && r < s.length && s[l] === s[r]) {
        if (r - l + 1 > bestLen) { bestL = l; bestLen = r - l + 1; }
        l--; r++;
      }
    };
    for (let i = 0; i < s.length; i++) { expand(i, i); expand(i, i + 1); }
    return s.slice(bestL, bestL + bestLen);
  };`,
  "longest-happy-prefix": `var longestPrefix = function(s) {
    const n = s.length, lps = new Array(n).fill(0);
    let len = 0;
    for (let i = 1; i < n; i++) {
      while (len > 0 && s[i] !== s[len]) len = lps[len - 1];
      if (s[i] === s[len]) len++;
      lps[i] = len;
    }
    return s.slice(0, lps[n - 1]);
  };`,
  "shortest-palindrome": `var shortestPalindrome = function(s) {
    const rev = s.split("").reverse().join("");
    const comb = s + "#" + rev;
    const lps = new Array(comb.length).fill(0);
    let len = 0;
    for (let i = 1; i < comb.length; i++) {
      while (len > 0 && comb[i] !== comb[len]) len = lps[len - 1];
      if (comb[i] === comb[len]) len++;
      lps[i] = len;
    }
    const palPref = lps[comb.length - 1];
    return rev.slice(0, s.length - palPref) + s;
  };`,
};

describe("Wave 1 Problem Bank (35 Problems × 20 Test Cases = 700 Cases) & Error Translator", () => {
  it("validates 35 unique Wave-1 problems with 20 test cases, constraints, hints, and 4 language harnesses", () => {
    expect(WAVE_1_CODING_PROBLEMS).toHaveLength(35);
    expect(getRunnableProblemSlugs().length).toBeGreaterThanOrEqual(35);

    for (const p of WAVE_1_CODING_PROBLEMS) {
      expect(getCodingProblemBySlug(p.slug)?.slug).toBe(p.slug);
      expect(p.constraints.length).toBeGreaterThanOrEqual(1);
      expect(p.hints.length).toBeGreaterThanOrEqual(2);
      expect(p.testCases).toHaveLength(20);
      expect(p.testCases.filter((t) => !t.isHidden)).toHaveLength(3);
      expect(p.testCases.filter((t) => t.isHidden)).toHaveLength(17);
      for (const lang of ["java", "python", "cpp", "javascript"] as const) {
        expect(p.starterCode[lang].length).toBeGreaterThan(10);
        expect(p.driverCode[lang]).toContain("{{USER_CODE}}");
      }
    }
  });

  it("passes all 700 test cases (35 × 20) using JS reference solutions and single-batch harness", () => {
    for (const p of WAVE_1_CODING_PROBLEMS) {
      const refCode = JS_REFERENCE_SOLUTIONS[p.slug];
      expect(refCode, `Missing JS reference for ${p.slug}`).toBeDefined();

      const singleCaseCode = p.driverCode.javascript.replace("{{USER_CODE}}", refCode!);
      const testCases: ProblemTestCase[] = p.testCases.map((tc) => ({
        id: tc.id,
        stdin: tc.stdin,
        expectedOutput: tc.expectedOutput,
        isSample: !tc.isHidden,
      }));

      const batchSource = buildBatchCode("javascript", singleCaseCode, testCases);
      const logs: string[] = [];
      const context = vm.createContext({
        console: {
          log: (...args: unknown[]) =>
            logs.push(args.map((a) => String(a)).join(" ")),
        },
        require: () => ({}),
      });
      vm.runInContext(batchSource, context);

      const parsed = parseBatchStdout(logs.join("\n"), testCases, "ACCEPTED");
      const lastRes = parsed.results[parsed.results.length - 1];
      const expected = lastRes ? testCases[lastRes.caseNumber - 1]?.expectedOutput : "";
      expect(
        parsed.verdict,
        `Failed on ${p.slug} case #${parsed.firstFailingCaseNumber}: expected=${expected} actual=${lastRes?.actualOutput}`
      ).toBe("ACCEPTED");
      expect(parsed.results).toHaveLength(20);
      expect(parsed.results.every((r) => r.passed)).toBe(true);
    }
  });

  it("translates compilation, TLE, runtime, wrong answer, and Judge0 network errors into plain English", () => {
    expect(
      translateExecutionError({
        verdict: "COMPILATION_ERROR",
        compileOutput: "Main.java:4: error: ';' expected",
      })
    ).toContain("Compilation Error");

    expect(
      translateExecutionError({
        verdict: "TIME_LIMIT_EXCEEDED",
        caseNumber: 12,
      })
    ).toBe(
      "Time Limit Exceeded on Test Case #12 — your solution may be too slow for the problem constraints."
    );

    expect(
      translateExecutionError({
        verdict: "RUNTIME_ERROR",
        caseNumber: 5,
      })
    ).toBe(
      "Runtime Error on Test Case #5 — check array bounds, null/empty inputs, or integer overflow."
    );

    expect(
      translateJudge0ServiceError(new Error("AbortError: The operation timed out"))
    ).toBe(
      "Code runner is temporarily busy — your code is safely saved. Try running again in a moment."
    );
  });
});
