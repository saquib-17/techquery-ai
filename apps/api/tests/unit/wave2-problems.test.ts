import { describe, it, expect } from "vitest";
import vm from "node:vm";
import {
  CODING_PROBLEMS,
  WAVE_1_CODING_PROBLEMS,
  WAVE_2_CODING_PROBLEMS,
  getCodingProblemBySlug,
  getRunnableProblemSlugs,
  type ProblemTestCase,
} from "@techquery/shared";
import { buildBatchCode, parseBatchStdout } from "../../src/modules/coding/batchHarness.js";

const WAVE_2_JS_SOLUTIONS: Record<string, string> = {
  "invert-binary-tree": `var invertTree = function(root) {
    if (!root) return null;
    const tmp = root.left;
    root.left = invertTree(root.right);
    root.right = invertTree(tmp);
    return root;
  };`,
  "maximum-depth-of-binary-tree": `var maxDepth = function(root) {
    if (!root) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
  };`,
  "binary-tree-level-order-traversal": `var levelOrder = function(root) {
    if (!root) return [];
    const res = [], q = [root];
    while (q.length) {
      const sz = q.length, lvl = [];
      for (let i = 0; i < sz; i++) {
        const cur = q.shift();
        lvl.push(cur.val);
        if (cur.left) q.push(cur.left);
        if (cur.right) q.push(cur.right);
      }
      res.push(lvl);
    }
    return res;
  };`,
  "validate-binary-search-tree": `var isValidBST = function(root) {
    const dfs = (n, lo, hi) => {
      if (!n) return true;
      if (n.val <= lo || n.val >= hi) return false;
      return dfs(n.left, lo, n.val) && dfs(n.right, n.val, hi);
    };
    return dfs(root, -Infinity, Infinity);
  };`,
  "kth-smallest-element-in-a-bst": `var kthSmallest = function(root, k) {
    const st = [];
    let cur = root;
    while (cur || st.length) {
      while (cur) { st.push(cur); cur = cur.left; }
      cur = st.pop();
      if (--k === 0) return cur.val;
      cur = cur.right;
    }
    return -1;
  };`,
  "lowest-common-ancestor-of-a-binary-tree": `var lowestCommonAncestor = function(root, p, q) {
    if (!root || root === p || root === q) return root;
    const l = lowestCommonAncestor(root.left, p, q);
    const r = lowestCommonAncestor(root.right, p, q);
    if (l && r) return root;
    return l || r;
  };`,
  "binary-tree-maximum-path-sum": `var maxPathSum = function(root) {
    let best = -Infinity;
    const gain = (n) => {
      if (!n) return 0;
      const l = Math.max(0, gain(n.left));
      const r = Math.max(0, gain(n.right));
      best = Math.max(best, n.val + l + r);
      return n.val + Math.max(l, r);
    };
    gain(root);
    return best;
  };`,
  "flood-fill": `var floodFill = function(image, sr, sc, color) {
    const orig = image[sr][sc];
    if (orig === color) return image;
    const m = image.length, n = image[0].length;
    const dfs = (r, c) => {
      if (r < 0 || r >= m || c < 0 || c >= n || image[r][c] !== orig) return;
      image[r][c] = color;
      dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
    };
    dfs(sr, sc);
    return image;
  };`,
  "number-of-islands": `var numIslands = function(grid) {
    const m = grid.length, n = grid[0].length;
    let cnt = 0;
    const dfs = (r, c) => {
      if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== "1") return;
      grid[r][c] = "0";
      dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
    };
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        if (grid[i][j] === "1") { cnt++; dfs(i, j); }
    return cnt;
  };`,
  "rotting-oranges": `var orangesRotting = function(grid) {
    const m = grid.length, n = grid[0].length, q = [];
    let fresh = 0, mins = 0;
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++) {
        if (grid[i][j] === 2) q.push([i, j]);
        else if (grid[i][j] === 1) fresh++;
      }
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    while (q.length && fresh > 0) {
      const sz = q.length;
      for (let i = 0; i < sz; i++) {
        const [r, c] = q.shift();
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] === 1) {
            grid[nr][nc] = 2; fresh--; q.push([nr, nc]);
          }
        }
      }
      mins++;
    }
    return fresh === 0 ? mins : -1;
  };`,
  "course-schedule": `var canFinish = function(numCourses, prerequisites) {
    const adj = Array.from({ length: numCourses }, () => []);
    const ind = new Array(numCourses).fill(0);
    for (const [a, b] of prerequisites) { adj[b].push(a); ind[a]++; }
    const q = [];
    for (let i = 0; i < numCourses; i++) if (ind[i] === 0) q.push(i);
    let vis = 0;
    while (q.length) {
      const u = q.shift(); vis++;
      for (const v of adj[u]) if (--ind[v] === 0) q.push(v);
    }
    return vis === numCourses;
  };`,
  "course-schedule-ii": `var findOrder = function(numCourses, prerequisites) {
    const adj = Array.from({ length: numCourses }, () => []);
    const ind = new Array(numCourses).fill(0);
    for (const [a, b] of prerequisites) { adj[b].push(a); ind[a]++; }
    const q = [], ord = [];
    for (let i = 0; i < numCourses; i++) if (ind[i] === 0) q.push(i);
    while (q.length) {
      const u = q.shift(); ord.push(u);
      for (const v of adj[u]) if (--ind[v] === 0) q.push(v);
    }
    return ord.length === numCourses ? ord : [];
  };`,
  "word-ladder": `var ladderLength = function(beginWord, endWord, wordList) {
    const set = new Set(wordList);
    if (!set.has(endWord)) return 0;
    if (beginWord === endWord) return 1;
    const q = [[beginWord, 1]];
    while (q.length) {
      const [w, d] = q.shift();
      for (let i = 0; i < w.length; i++) {
        for (let c = 97; c <= 122; c++) {
          const nw = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
          if (nw === endWord) return d + 1;
          if (set.has(nw)) { set.delete(nw); q.push([nw, d + 1]); }
        }
      }
    }
    return 0;
  };`,
  "alien-dictionary": `var alienOrder = function(words) {
    const adj = new Map(), ind = new Map();
    for (const w of words) for (const c of w) {
      if (!adj.has(c)) adj.set(c, new Set());
      if (!ind.has(c)) ind.set(c, 0);
    }
    for (let i = 0; i < words.length - 1; i++) {
      const a = words[i], b = words[i + 1];
      if (a.length > b.length && a.startsWith(b)) return "";
      for (let j = 0; j < Math.min(a.length, b.length); j++) {
        if (a[j] !== b[j]) {
          if (!adj.get(a[j]).has(b[j])) {
            adj.get(a[j]).add(b[j]);
            ind.set(b[j], ind.get(b[j]) + 1);
          }
          break;
        }
      }
    }
    const q = [], res = [];
    for (const [c, d] of ind.entries()) if (d === 0) q.push(c);
    while (q.length) {
      const u = q.shift(); res.push(u);
      for (const v of adj.get(u)) {
        ind.set(v, ind.get(v) - 1);
        if (ind.get(v) === 0) q.push(v);
      }
    }
    return res.length === ind.size ? res.join("") : "";
  };`,
  "reverse-linked-list": `var reverseList = function(head) {
    let prev = null, cur = head;
    while (cur) { const nxt = cur.next; cur.next = prev; prev = cur; cur = nxt; }
    return prev;
  };`,
  "merge-two-sorted-lists": `var mergeTwoLists = function(list1, list2) {
    const dummy = new ListNode(0);
    let cur = dummy;
    while (list1 && list2) {
      if (list1.val <= list2.val) { cur.next = list1; list1 = list1.next; }
      else { cur.next = list2; list2 = list2.next; }
      cur = cur.next;
    }
    cur.next = list1 || list2;
    return dummy.next;
  };`,
  "remove-nth-node-from-end-of-list": `var removeNthFromEnd = function(head, n) {
    const dummy = new ListNode(0, head);
    let fast = dummy, slow = dummy;
    for (let i = 0; i <= n; i++) fast = fast.next;
    while (fast) { fast = fast.next; slow = slow.next; }
    slow.next = slow.next.next;
    return dummy.next;
  };`,
  "add-two-numbers": `var addTwoNumbers = function(l1, l2) {
    const dummy = new ListNode(0);
    let cur = dummy, carry = 0;
    while (l1 || l2 || carry) {
      const s = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry;
      carry = Math.floor(s / 10);
      cur.next = new ListNode(s % 10);
      cur = cur.next;
      if (l1) l1 = l1.next;
      if (l2) l2 = l2.next;
    }
    return dummy.next;
  };`,
  "merge-k-sorted-lists": `var mergeKLists = function(lists) {
    if (!lists.length) return null;
    const merge2 = (a, b) => {
      const d = new ListNode(0); let c = d;
      while (a && b) { if (a.val <= b.val) { c.next = a; a = a.next; } else { c.next = b; b = b.next; } c = c.next; }
      c.next = a || b; return d.next;
    };
    let step = 1;
    while (step < lists.length) {
      for (let i = 0; i + step < lists.length; i += step * 2) lists[i] = merge2(lists[i], lists[i + step]);
      step *= 2;
    }
    return lists[0];
  };`,
  "last-stone-weight": `var lastStoneWeight = function(stones) {
    const a = [...stones];
    while (a.length > 1) {
      a.sort((x, y) => x - y);
      const y = a.pop(), x = a.pop();
      if (y !== x) a.push(y - x);
    }
    return a.length ? a[0] : 0;
  };`,
  "kth-largest-element-in-an-array": `var findKthLargest = function(nums, k) {
    return [...nums].sort((a, b) => b - a)[k - 1];
  };`,
  "k-closest-points-to-origin": `var kClosest = function(points, k) {
    return [...points].sort((a, b) => (a[0]*a[0]+a[1]*a[1]) - (b[0]*b[0]+b[1]*b[1])).slice(0, k);
  };`,
  "task-scheduler": `var leastInterval = function(tasks, n) {
    const cnt = new Array(26).fill(0);
    for (const t of tasks) cnt[t.charCodeAt(0) - 65]++;
    const mx = Math.max(...cnt);
    const mxCnt = cnt.filter((c) => c === mx).length;
    return Math.max(tasks.length, (mx - 1) * (n + 1) + mxCnt);
  };`,
  "find-median-from-data-stream": `var MedianFinder = function() { this.arr = []; };
  MedianFinder.prototype.addNum = function(num) {
    let l = 0, r = this.arr.length;
    while (l < r) { const m = (l + r) >> 1; if (this.arr[m] < num) l = m + 1; else r = m; }
    this.arr.splice(l, 0, num);
  };
  MedianFinder.prototype.findMedian = function() {
    const n = this.arr.length, m = n >> 1;
    return n % 2 === 1 ? this.arr[m] : (this.arr[m - 1] + this.arr[m]) / 2;
  };`,
  "implement-trie-prefix-tree": `var Trie = function() { this.root = {}; };
  Trie.prototype.insert = function(word) {
    let cur = this.root;
    for (const c of word) cur = cur[c] || (cur[c] = {});
    cur.$ = true;
  };
  Trie.prototype.search = function(word) {
    let cur = this.root;
    for (const c of word) { if (!cur[c]) return false; cur = cur[c]; }
    return Boolean(cur.$);
  };
  Trie.prototype.startsWith = function(prefix) {
    let cur = this.root;
    for (const c of prefix) { if (!cur[c]) return false; cur = cur[c]; }
    return true;
  };`,
  "word-search-ii": `var findWords = function(board, words) {
    const root = {};
    for (const w of words) { let c = root; for (const ch of w) c = c[ch] || (c[ch] = {}); c.word = w; }
    const m = board.length, n = board[0].length, res = [];
    const dfs = (r, c, node) => {
      const ch = board[r][c];
      if (!node[ch]) return;
      const nxt = node[ch];
      if (nxt.word) { res.push(nxt.word); nxt.word = null; }
      board[r][c] = "#";
      if (r > 0 && board[r-1][c] !== "#") dfs(r-1, c, nxt);
      if (r+1 < m && board[r+1][c] !== "#") dfs(r+1, c, nxt);
      if (c > 0 && board[r][c-1] !== "#") dfs(r, c-1, nxt);
      if (c+1 < n && board[r][c+1] !== "#") dfs(r, c+1, nxt);
      board[r][c] = ch;
    };
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) dfs(i, j, root);
    return res;
  };`,
  "redundant-connection": `var findRedundantConnection = function(edges) {
    const p = Array.from({ length: edges.length + 1 }, (_, i) => i);
    const find = (x) => (p[x] === x ? x : (p[x] = find(p[x])));
    for (const [u, v] of edges) {
      const ru = find(u), rv = find(v);
      if (ru === rv) return [u, v];
      p[ru] = rv;
    }
    return [];
  };`,
  "making-a-large-island": `var largestIsland = function(grid) {
    const n = grid.length, area = new Map([[0, 0]]);
    let id = 2, best = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const dfs = (r, c, k) => {
      if (r < 0 || r >= n || c < 0 || c >= n || grid[r][c] !== 1) return 0;
      grid[r][c] = k;
      return 1 + dfs(r+1,c,k) + dfs(r-1,c,k) + dfs(r,c+1,k) + dfs(r,c-1,k);
    };
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (grid[i][j] === 1) { const a = dfs(i, j, id); area.set(id++, a); best = Math.max(best, a); }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (grid[i][j] === 0) {
        const seen = new Set(); let cur = 1;
        for (const [dr, dc] of dirs) {
          const nr = i + dr, nc = j + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && !seen.has(grid[nr][nc])) {
            seen.add(grid[nr][nc]); cur += area.get(grid[nr][nc]);
          }
        }
        best = Math.max(best, cur);
      }
    }
    return best;
  };`,
  "network-delay-time": `var networkDelayTime = function(times, n, k) {
    const adj = Array.from({ length: n + 1 }, () => []);
    for (const [u, v, w] of times) adj[u].push([v, w]);
    const dist = new Array(n + 1).fill(Infinity); dist[k] = 0;
    const pq = [[0, k]];
    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]);
      const [d, u] = pq.shift();
      if (d > dist[u]) continue;
      for (const [v, w] of adj[u]) {
        if (d + w < dist[v]) { dist[v] = d + w; pq.push([dist[v], v]); }
      }
    }
    let ans = 0;
    for (let i = 1; i <= n; i++) { if (dist[i] === Infinity) return -1; ans = Math.max(ans, dist[i]); }
    return ans;
  };`,
  "swim-in-rising-water": `var swimInWater = function(grid) {
    const n = grid.length, vis = Array.from({ length: n }, () => new Array(n).fill(false));
    const pq = [[grid[0][0], 0, 0]]; vis[0][0] = true;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]);
      const [t, r, c] = pq.shift();
      if (r === n - 1 && c === n - 1) return t;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n && !vis[nr][nc]) {
          vis[nr][nc] = true; pq.push([Math.max(t, grid[nr][nc]), nr, nc]);
        }
      }
    }
    return 0;
  };`,
  "transpose-matrix": `var transpose = function(matrix) {
    const m = matrix.length, n = matrix[0].length;
    return Array.from({ length: n }, (_, c) => Array.from({ length: m }, (_, r) => matrix[r][c]));
  };`,
  "spiral-matrix": `var spiralOrder = function(matrix) {
    let top = 0, bot = matrix.length - 1, left = 0, right = matrix[0].length - 1;
    const res = [];
    while (top <= bot && left <= right) {
      for (let c = left; c <= right; c++) res.push(matrix[top][c]);
      top++;
      for (let r = top; r <= bot; r++) res.push(matrix[r][right]);
      right--;
      if (top <= bot) { for (let c = right; c >= left; c--) res.push(matrix[bot][c]); bot--; }
      if (left <= right) { for (let r = bot; r >= top; r--) res.push(matrix[r][left]); left++; }
    }
    return res;
  };`,
  "rotate-image": `var rotate = function(matrix) {
    const n = matrix.length;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
    for (const row of matrix) row.reverse();
  };`,
};

describe("Wave 2 Problem Bank (33 Problems × 20 Test Cases = 660 Cases -> 68 Total)", () => {
  it("validates 68 cumulative problems (35 Wave 1 + 33 Wave 2), each with 20 test cases, constraints, hints, and 4 language harnesses", () => {
    expect(WAVE_1_CODING_PROBLEMS).toHaveLength(35);
    expect(WAVE_2_CODING_PROBLEMS).toHaveLength(33);
    expect(CODING_PROBLEMS.length).toBeGreaterThanOrEqual(68);
    expect(new Set(getRunnableProblemSlugs()).size).toBeGreaterThanOrEqual(68);

    for (const p of CODING_PROBLEMS) {
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

  it("passes all 660 Wave-2 test cases (33 × 20) using JS reference solutions and TreeNode/ListNode harnesses", () => {
    for (const p of WAVE_2_CODING_PROBLEMS) {
      const refCode = WAVE_2_JS_SOLUTIONS[p.slug];
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
});
