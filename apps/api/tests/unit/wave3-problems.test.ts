import { describe, it, expect } from "vitest";
import vm from "node:vm";
import {
  CODING_PROBLEMS,
  WAVE_1_CODING_PROBLEMS,
  WAVE_2_CODING_PROBLEMS,
  WAVE_3_CODING_PROBLEMS,
  getCodingProblemBySlug,
  getRunnableProblemSlugs,
  type ProblemTestCase,
} from "@techquery/shared";
import { buildBatchCode, parseBatchStdout } from "../../src/modules/coding/batchHarness.js";
import { toCodingProblemDto } from "../../src/modules/coding/coding.service.js";

const WAVE_3_JS_SOLUTIONS: Record<string, string> = {
  "climbing-stairs": `var climbStairs = function(n) {
    let a = 1, b = 1;
    for (let i = 2; i <= n; i++) { const c = a + b; a = b; b = c; }
    return b;
  };`,
  "house-robber": `var rob = function(nums) {
    let p2 = 0, p1 = 0;
    for (const x of nums) { const cur = Math.max(p1, p2 + x); p2 = p1; p1 = cur; }
    return p1;
  };`,
  "longest-increasing-subsequence": `var lengthOfLIS = function(nums) {
    const tails = [];
    for (const x of nums) {
      let l = 0, r = tails.length;
      while (l < r) {
        const m = (l + r) >> 1;
        if (tails[m] < x) l = m + 1; else r = m;
      }
      tails[l] = x;
    }
    return tails.length;
  };`,
  "unique-paths": `var uniquePaths = function(m, n) {
    const dp = new Array(n).fill(1);
    for (let r = 1; r < m; r++) {
      for (let c = 1; c < n; c++) dp[c] += dp[c - 1];
    }
    return dp[n - 1];
  };`,
  "longest-common-subsequence": `var longestCommonSubsequence = function(text1, text2) {
    const m = text1.length, n = text2.length;
    let prev = new Array(n + 1).fill(0);
    for (let i = 1; i <= m; i++) {
      const cur = new Array(n + 1).fill(0);
      for (let j = 1; j <= n; j++) {
        cur[j] = text1[i - 1] === text2[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
      }
      prev = cur;
    }
    return prev[n];
  };`,
  "distinct-subsequences": `var numDistinct = function(s, t) {
    const m = s.length, n = t.length;
    const dp = new Array(n + 1).fill(0);
    dp[0] = 1;
    for (let i = 1; i <= m; i++) {
      for (let j = n; j >= 1; j--) {
        if (s[i - 1] === t[j - 1]) dp[j] += dp[j - 1];
      }
    }
    return dp[n];
  };`,
  "burst-balloons": `var maxCoins = function(nums) {
    const a = [1, ...nums, 1], n = a.length;
    const dp = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let len = 2; len < n; len++) {
      for (let l = 0; l + len < n; l++) {
        const r = l + len;
        for (let k = l + 1; k < r; k++) {
          dp[l][r] = Math.max(dp[l][r], a[l] * a[k] * a[r] + dp[l][k] + dp[k][r]);
        }
      }
    }
    return dp[0][n - 1];
  };`,
  "next-greater-element-i": `var nextGreaterElement = function(nums1, nums2) {
    const nxt = new Map(), st = [];
    for (const x of nums2) {
      while (st.length && st[st.length - 1] < x) nxt.set(st.pop(), x);
      st.push(x);
    }
    return nums1.map((x) => nxt.has(x) ? nxt.get(x) : -1);
  };`,
  "implement-stack-using-queues": `var MyStack = function() { this.q = []; };
  MyStack.prototype.push = function(x) {
    this.q.push(x);
    for (let i = 0; i < this.q.length - 1; i++) this.q.push(this.q.shift());
  };
  MyStack.prototype.pop = function() { return this.q.shift(); };
  MyStack.prototype.top = function() { return this.q[0]; };
  MyStack.prototype.empty = function() { return this.q.length === 0; };`,
  "daily-temperatures": `var dailyTemperatures = function(temperatures) {
    const res = new Array(temperatures.length).fill(0), st = [];
    for (let i = 0; i < temperatures.length; i++) {
      while (st.length && temperatures[st[st.length - 1]] < temperatures[i]) {
        const idx = st.pop();
        res[idx] = i - idx;
      }
      st.push(i);
    }
    return res;
  };`,
  "evaluate-reverse-polish-notation": `var evalRPN = function(tokens) {
    const st = [];
    for (const t of tokens) {
      if (t === "+" || t === "-" || t === "*" || t === "/") {
        const b = st.pop(), a = st.pop();
        if (t === "+") st.push(a + b);
        else if (t === "-") st.push(a - b);
        else if (t === "*") st.push(a * b);
        else st.push(Math.trunc(a / b));
      } else st.push(Number(t));
    }
    return st[0];
  };`,
  "largest-rectangle-in-histogram": `var largestRectangleArea = function(heights) {
    const st = [], h = [...heights, 0];
    let best = 0;
    for (let i = 0; i < h.length; i++) {
      while (st.length && h[st[st.length - 1]] > h[i]) {
        const height = h[st.pop()];
        const width = st.length ? i - st[st.length - 1] - 1 : i;
        best = Math.max(best, height * width);
      }
      st.push(i);
    }
    return best;
  };`,
  "subsets": `var subsets = function(nums) {
    const res = [], cur = [];
    const dfs = (i) => {
      if (i === nums.length) { res.push([...cur]); return; }
      dfs(i + 1);
      cur.push(nums[i]);
      dfs(i + 1);
      cur.pop();
    };
    dfs(0);
    return res;
  };`,
  "combination-sum": `var combinationSum = function(candidates, target) {
    const res = [], cur = [];
    const dfs = (i, rem) => {
      if (rem === 0) { res.push([...cur]); return; }
      if (rem < 0 || i === candidates.length) return;
      cur.push(candidates[i]);
      dfs(i, rem - candidates[i]);
      cur.pop();
      dfs(i + 1, rem);
    };
    dfs(0, target);
    return res;
  };`,
  "permutations": `var permute = function(nums) {
    const res = [], used = new Array(nums.length).fill(false), cur = [];
    const dfs = () => {
      if (cur.length === nums.length) { res.push([...cur]); return; }
      for (let i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true; cur.push(nums[i]);
        dfs();
        cur.pop(); used[i] = false;
      }
    };
    dfs();
    return res;
  };`,
  "letter-combinations-of-a-phone-number": `var letterCombinations = function(digits) {
    if (!digits.length) return [];
    const map = { "2":"abc","3":"def","4":"ghi","5":"jkl","6":"mno","7":"pqrs","8":"tuv","9":"wxyz" };
    const res = [];
    const dfs = (i, cur) => {
      if (i === digits.length) { res.push(cur); return; }
      for (const ch of map[digits[i]]) dfs(i + 1, cur + ch);
    };
    dfs(0, "");
    return res;
  };`,
  "unique-paths-iii": `var uniquePathsIII = function(grid) {
    const R = grid.length, C = grid[0].length;
    let sr = 0, sc = 0, walk = 0;
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      if (grid[r][c] !== -1) walk++;
      if (grid[r][c] === 1) { sr = r; sc = c; }
    }
    let ans = 0;
    const dfs = (r, c, rem) => {
      if (r < 0 || r >= R || c < 0 || c >= C || grid[r][c] === -1) return;
      if (grid[r][c] === 2) { if (rem === 1) ans++; return; }
      const tmp = grid[r][c];
      grid[r][c] = -1;
      dfs(r + 1, c, rem - 1); dfs(r - 1, c, rem - 1);
      dfs(r, c + 1, rem - 1); dfs(r, c - 1, rem - 1);
      grid[r][c] = tmp;
    };
    dfs(sr, sc, walk);
    return ans;
  };`,
  "assign-cookies": `var findContentChildren = function(g, s) {
    g.sort((a, b) => a - b); s.sort((a, b) => a - b);
    let i = 0, j = 0;
    while (i < g.length && j < s.length) {
      if (s[j] >= g[i]) i++;
      j++;
    }
    return i;
  };`,
  "lemonade-change": `var lemonadeChange = function(bills) {
    let fives = 0, tens = 0;
    for (const b of bills) {
      if (b === 5) fives++;
      else if (b === 10) { if (!fives) return false; fives--; tens++; }
      else {
        if (tens && fives) { tens--; fives--; }
        else if (fives >= 3) fives -= 3;
        else return false;
      }
    }
    return true;
  };`,
  "jump-game": `var canJump = function(nums) {
    let reach = 0;
    for (let i = 0; i < nums.length; i++) {
      if (i > reach) return false;
      reach = Math.max(reach, i + nums[i]);
    }
    return true;
  };`,
  "gas-station": `var canCompleteCircuit = function(gas, cost) {
    let total = 0, tank = 0, start = 0;
    for (let i = 0; i < gas.length; i++) {
      const diff = gas[i] - cost[i];
      total += diff; tank += diff;
      if (tank < 0) { start = i + 1; tank = 0; }
    }
    return total >= 0 ? start : -1;
  };`,
  "candy": `var candy = function(ratings) {
    const n = ratings.length, c = new Array(n).fill(1);
    for (let i = 1; i < n; i++) if (ratings[i] > ratings[i - 1]) c[i] = c[i - 1] + 1;
    for (let i = n - 2; i >= 0; i--) if (ratings[i] > ratings[i + 1]) c[i] = Math.max(c[i], c[i + 1] + 1);
    return c.reduce((a, b) => a + b, 0);
  };`,
  "meeting-rooms": `var canAttendMeetings = function(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < intervals.length; i++) if (intervals[i][0] < intervals[i - 1][1]) return false;
    return true;
  };`,
  "merge-intervals": `var merge = function(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);
    const res = [];
    for (const iv of intervals) {
      if (!res.length || res[res.length - 1][1] < iv[0]) res.push([...iv]);
      else res[res.length - 1][1] = Math.max(res[res.length - 1][1], iv[1]);
    }
    return res;
  };`,
  "non-overlapping-intervals": `var eraseOverlapIntervals = function(intervals) {
    intervals.sort((a, b) => a[1] - b[1]);
    let kept = 0, end = -Infinity;
    for (const [s, e] of intervals) {
      if (s >= end) { kept++; end = e; }
    }
    return intervals.length - kept;
  };`,
  "minimum-interval-to-include-each-query": `var minInterval = function(intervals, queries) {
    intervals.sort((a, b) => a[0] - b[0]);
    const qs = queries.map((q, i) => [q, i]).sort((a, b) => a[0] - b[0]);
    const heap = [];
    const push = (item) => {
      heap.push(item);
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (heap[p][0] <= heap[i][0]) break;
        [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
      }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        while (true) {
          let l = 2 * i + 1, r = 2 * i + 2, s = i;
          if (l < heap.length && heap[l][0] < heap[s][0]) s = l;
          if (r < heap.length && heap[r][0] < heap[s][0]) s = r;
          if (s === i) break;
          [heap[i], heap[s]] = [heap[s], heap[i]]; i = s;
        }
      }
      return top;
    };
    const res = new Array(queries.length).fill(-1);
    let idx = 0;
    for (const [q, qi] of qs) {
      while (idx < intervals.length && intervals[idx][0] <= q) {
        const [l, r] = intervals[idx++];
        push([r - l + 1, r]);
      }
      while (heap.length && heap[0][1] < q) pop();
      if (heap.length) res[qi] = heap[0][0];
    }
    return res;
  };`,
  "single-number": `var singleNumber = function(nums) {
    let ans = 0;
    for (const x of nums) ans ^= x;
    return ans;
  };`,
  "sum-of-two-integers": `var getSum = function(a, b) {
    while (b !== 0) {
      const carry = (a & b) << 1;
      a = a ^ b;
      b = carry;
    }
    return a;
  };`,
  "plus-one": `var plusOne = function(digits) {
    const res = [...digits];
    for (let i = res.length - 1; i >= 0; i--) {
      if (res[i] < 9) { res[i]++; return res; }
      res[i] = 0;
    }
    res.unshift(1);
    return res;
  };`,
  "powx-n": `var myPow = function(x, n) {
    let N = BigInt(n);
    if (N < 0n) { x = 1 / x; N = -N; }
    let ans = 1;
    while (N > 0n) {
      if (N & 1n) ans *= x;
      x *= x;
      N >>= 1n;
    }
    return ans;
  };`,
  "min-stack": `var MinStack = function() { this.st = []; };
  MinStack.prototype.push = function(val) {
    const mn = this.st.length ? Math.min(val, this.st[this.st.length - 1][1]) : val;
    this.st.push([val, mn]);
  };
  MinStack.prototype.pop = function() { this.st.pop(); };
  MinStack.prototype.top = function() { return this.st[this.st.length - 1][0]; };
  MinStack.prototype.getMin = function() { return this.st[this.st.length - 1][1]; };`,
  "sliding-window-maximum": `var maxSlidingWindow = function(nums, k) {
    const dq = [], res = [];
    for (let i = 0; i < nums.length; i++) {
      while (dq.length && dq[0] <= i - k) dq.shift();
      while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
      dq.push(i);
      if (i >= k - 1) res.push(nums[dq[0]]);
    }
    return res;
  };`,
};

function runJsBatch(driverCode: string, userCode: string, cases: ProblemTestCase[]): string {
  const singleCaseCode = driverCode.replace("{{USER_CODE}}", userCode);
  const sourceCode = buildBatchCode("javascript", singleCaseCode, cases);
  const outputs: string[] = [];
  const sandbox = {
    require: () => ({}),
    console: {
      log: (...args: unknown[]) => outputs.push(args.map(String).join(" ")),
    },
    JSON,
    Math,
    Number,
    String,
    Array,
    Object,
    Map,
    Set,
    BigInt,
    Infinity,
    NaN,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
  };
  vm.runInNewContext(sourceCode, sandbox, { timeout: 2500 });
  return outputs.join("\n");
}

describe("Wave 3 Coding Practice Bank (Final 100-Problem Milestone)", () => {
  it("contains 100 cumulative problems (35 Wave 1 + 33 Wave 2 + 32 Wave 3) with 2,000 test cases", () => {
    expect(WAVE_1_CODING_PROBLEMS).toHaveLength(35);
    expect(WAVE_2_CODING_PROBLEMS).toHaveLength(33);
    expect(WAVE_3_CODING_PROBLEMS).toHaveLength(32);
    expect(CODING_PROBLEMS).toHaveLength(100);

    const slugs = CODING_PROBLEMS.map((p) => p.slug);
    const titles = CODING_PROBLEMS.map((p) => p.title);
    expect(new Set(slugs).size).toBe(100);
    expect(new Set(titles).size).toBe(100);
    expect(getRunnableProblemSlugs()).toHaveLength(100);

    let totalTestCases = 0;
    for (const p of CODING_PROBLEMS) {
      expect(p.testCases).toHaveLength(20);
      expect(p.testCases.filter((t) => !t.isHidden)).toHaveLength(3);
      expect(p.testCases.filter((t) => t.isHidden)).toHaveLength(17);
      expect(p.constraints.length).toBeGreaterThan(0);
      expect(p.hints.length).toBeGreaterThanOrEqual(2);
      for (const lang of ["java", "python", "cpp", "javascript"] as const) {
        expect(p.starterCode[lang].trim().length).toBeGreaterThan(0);
        expect(p.driverCode[lang]).toContain("{{USER_CODE}}");
      }
      totalTestCases += p.testCases.length;
    }
    expect(totalTestCases).toBe(2000);
  });

  it("strips hidden test cases in toCodingProblemDto so hidden inputs never leak to clients", () => {
    const p = WAVE_3_CODING_PROBLEMS[0];
    const dto = toCodingProblemDto({
      id: "00000000-0000-0000-0000-000000000001",
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      pattern: p.pattern,
      statement: p.statement,
      constraints: p.constraints,
      examples: p.examples,
      starterCode: p.starterCode,
      driverCode: p.driverCode,
      sampleTestCases: p.testCases.filter((t) => !t.isHidden).map((t) => ({ id: t.id, stdin: t.stdin, expectedOutput: t.expectedOutput, isSample: true })),
      hiddenTestCases: p.testCases.filter((t) => t.isHidden).map((t) => ({ id: t.id, stdin: t.stdin, expectedOutput: t.expectedOutput, isSample: false })),
      hints: p.hints,
      createdAt: new Date(),
    } as never);

    expect(dto.sampleTestCases).toHaveLength(3);
    expect(dto.hiddenTestCaseCount).toBe(17);
    expect((dto as unknown as Record<string, unknown>).hiddenTestCases).toBeUndefined();
    expect(dto.sampleTestCases.every((t) => t.isSample)).toBe(true);
  });

  for (const p of WAVE_3_CODING_PROBLEMS) {
    it(`passes all 20 test cases in single-batch JS runner for ${p.slug}`, () => {
      const full = getCodingProblemBySlug(p.slug);
      expect(full).toBeDefined();
      const userCode = WAVE_3_JS_SOLUTIONS[p.slug];
      expect(userCode).toBeDefined();

      const cases: ProblemTestCase[] = p.testCases.map((tc) => ({
        id: tc.id,
        stdin: tc.stdin,
        expectedOutput: tc.expectedOutput,
        isSample: !tc.isHidden,
      }));

      const rawStdout = runJsBatch(p.driverCode.javascript, userCode, cases);
      const parsed = parseBatchStdout(rawStdout, cases, "ACCEPTED");
      const lastRes = parsed.results[parsed.results.length - 1];
      const expected = lastRes ? cases[lastRes.caseNumber - 1]?.expectedOutput : "";
      expect(
        parsed.verdict,
        `${p.slug} case #${parsed.firstFailingCaseNumber}: expected=${expected} actual=${lastRes?.actualOutput}`
      ).toBe("ACCEPTED");
      expect(parsed.results.every((r) => r.passed)).toBe(true);
    });
  }
});
