import { z } from "zod";
import { ProblemDifficultySchema } from "./coding.js";

export const DsaSheetStatusSchema = z.enum(["UNSOLVED", "SOLVED", "REVISION"]);
export type DsaSheetStatus = z.infer<typeof DsaSheetStatusSchema>;

export const SheetSourceTagSchema = z.enum([
  "Blind 75",
  "NeetCode 150",
  "Striver SDE",
  "Striver A2Z",
  "Grind 169",
  "Apna College",
]);
export type SheetSourceTag = z.infer<typeof SheetSourceTagSchema>;

export const DSA_SHEET_CATEGORIES = [
  "1. Arrays & Matrix",
  "2. Prefix Sum & Difference Array",
  "3. Hashing & Frequency Maps",
  "4. Strings & Pattern Matching",
  "5. Two Pointers",
  "6. Sliding Window",
  "7. Stack & Monotonic Stack",
  "8. Queue & Monotonic Deque",
  "9. Binary Search",
  "10. Linked List",
  "11. Binary Trees",
  "12. Binary Search Trees",
  "13. Tries",
  "14. Heap / Priority Queue",
  "15. Recursion & Backtracking",
  "16. Graphs (BFS / DFS / Connected Components)",
  "17. Topological Sort, Shortest Path & DSU",
  "18. 1-D Dynamic Programming",
  "19. 2-D & Subsequence Dynamic Programming",
  "20. Greedy Algorithms",
  "21. Intervals",
  "22. Bit Manipulation & Math",
] as const;

export const DsaSheetCategorySchema = z.enum(DSA_SHEET_CATEGORIES);
export type DsaSheetCategory = z.infer<typeof DsaSheetCategorySchema>;

export const DsaSheetProblemItemSchema = z.object({
  order: z.number().int().positive(),
  title: z.string().min(1),
  slug: z.string().min(1),
  leetcodeUrl: z.string().url(),
  category: DsaSheetCategorySchema,
  subPattern: z.string().min(1),
  difficulty: ProblemDifficultySchema,
  companies: z.array(z.string()),
  sourceSheets: z.array(SheetSourceTagSchema),
  patternClue: z.string().min(1),
  arenaSlug: z.string().optional(),
});
export type DsaSheetProblemItem = z.infer<typeof DsaSheetProblemItemSchema>;

export const UpdateDsaSheetProgressSchema = z.object({
  status: DsaSheetStatusSchema,
  notes: z.string().max(2000).optional(),
});
export type UpdateDsaSheetProgressInput = z.infer<
  typeof UpdateDsaSheetProgressSchema
>;

export interface DsaSheetProblemWithProgress extends DsaSheetProblemItem {
  status: DsaSheetStatus;
  notes: string;
  updatedAt: string | null;
}

export interface DsaSheetWalkthroughDto {
  problemSlug: string;
  patternRecognition: string;
  bruteForceApproach: string;
  optimalApproach: string;
  timeComplexity: string;
  spaceComplexity: string;
  edgeCases: string[];
}

export interface DsaSheetCategorySummary {
  category: DsaSheetCategory;
  total: number;
  solved: number;
  revision: number;
}

export interface DsaSheetSummary {
  total: number;
  solved: number;
  revision: number;
  unsolved: number;
  byDifficulty: {
    EASY: { total: number; solved: number };
    MEDIUM: { total: number; solved: number };
    HARD: { total: number; solved: number };
  };
  byCategory: DsaSheetCategorySummary[];
}

const ARENA_SLUGS = new Set([
  "two-sum",
  "valid-parentheses",
  "best-time-to-buy-and-sell-stock",
  "binary-search",
  "longest-substring-without-repeating-characters",
  "three-sum",
  "search-in-rotated-sorted-array",
  "coin-change",
  "trapping-rain-water",
  "minimum-window-substring",
  "median-of-two-sorted-arrays",
  "edit-distance",
]);

const APNA_COLLEGE_SLUGS = new Set([
  "maximum-subarray",
  "next-permutation",
  "kth-largest-element-in-an-array",
  "maximum-product-subarray",
  "find-minimum-in-rotated-sorted-array",
  "container-with-most-water",
  "valid-palindrome",
  "valid-anagram",
  "longest-common-prefix",
  "longest-repeating-character-replacement",
  "group-anagrams",
  "longest-palindromic-substring",
  "palindromic-substrings",
  "set-matrix-zeroes",
  "spiral-matrix",
  "rotate-image",
  "word-search",
  "reverse-linked-list",
  "linked-list-cycle",
  "merge-two-sorted-lists",
  "remove-nth-node-from-end-of-list",
  "reorder-list",
  "merge-k-sorted-lists",
  "implement-stack-using-queues",
  "maximum-depth-of-binary-tree",
  "subtree-of-another-tree",
  "invert-binary-tree",
  "binary-tree-level-order-traversal",
  "same-tree",
  "construct-binary-tree-from-preorder-and-inorder-traversal",
  "binary-tree-maximum-path-sum",
  "serialize-and-deserialize-binary-tree",
  "lowest-common-ancestor-of-a-binary-search-tree",
  "validate-binary-search-tree",
  "kth-smallest-element-in-a-bst",
  "top-k-frequent-elements",
  "find-median-from-data-stream",
  "flood-fill",
  "clone-graph",
  "climbing-stairs",
  "longest-increasing-subsequence",
  "longest-common-subsequence",
  "word-break",
  "house-robber",
  "house-robber-ii",
  "decode-ways",
  "unique-paths",
  "jump-game",
]);

type RawEntry = [
  title: string,
  slug: string,
  subPattern: string,
  difficulty: "EASY" | "MEDIUM" | "HARD",
  companies: string[],
  sourceSheets: SheetSourceTag[],
  patternClue: string,
];

function buildCategory(
  category: DsaSheetCategory,
  entries: RawEntry[]
): Array<Omit<DsaSheetProblemItem, "order">> {
  return entries.map(
    ([title, slug, subPattern, difficulty, companies, sourceSheets, patternClue]) => {
      const mergedSources: SheetSourceTag[] =
        APNA_COLLEGE_SLUGS.has(slug) && !sourceSheets.includes("Apna College")
          ? [...sourceSheets, "Apna College"]
          : sourceSheets;
      return {
        title,
        slug,
        leetcodeUrl: `https://leetcode.com/problems/${slug}/`,
        category,
        subPattern,
        difficulty,
        companies,
        sourceSheets: mergedSources,
        patternClue,
        ...(ARENA_SLUGS.has(slug) ? { arenaSlug: slug } : {}),
      };
    }
  );
}

const RAW_ITEMS: Array<Omit<DsaSheetProblemItem, "order">> = [
  // ── 1. Arrays & Matrix (12) ───────────────────────────────────────────────
  ...buildCategory("1. Arrays & Matrix", [
    ["Two Sum", "two-sum", "Hash Lookup / Pair Sum", "EASY", ["Amazon", "Google", "Meta"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Store value -> index in a map and check target - nums[i]."],
    ["Maximum Subarray", "maximum-subarray", "Kadane's Algorithm", "MEDIUM", ["Amazon", "Microsoft", "Meta"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Reset running sum to 0 whenever it drops below 0."],
    ["Sort Colors", "sort-colors", "Dutch National Flag", "MEDIUM", ["Amazon", "Microsoft", "Adobe"], ["Striver SDE", "Striver A2Z", "Grind 169"], "Partition 0s, 1s, and 2s in-place using low, mid, high pointers."],
    ["Next Permutation", "next-permutation", "Lexicographic Pivot Swap", "MEDIUM", ["Google", "Meta", "Amazon"], ["Striver SDE", "Striver A2Z"], "Find first decreasing index from right, swap with next larger, reverse suffix."],
    ["Set Matrix Zeroes", "set-matrix-zeroes", "In-Place Matrix Markers", "MEDIUM", ["Amazon", "Microsoft", "Meta"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z"], "Use first row and first column as O(1) space zero flags."],
    ["Rotate Image", "rotate-image", "Transpose + Reverse Rows", "MEDIUM", ["Amazon", "Microsoft", "Apple"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Transpose the matrix across diagonal, then reverse each row."],
    ["Spiral Matrix", "spiral-matrix", "Boundary Layer Traversal", "MEDIUM", ["Amazon", "Google", "Microsoft"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "Maintain top, bottom, left, right bounds and shrink inward."],
    ["Pascal's Triangle", "pascals-triangle", "Combinatorial Row DP", "EASY", ["Amazon", "Adobe", "Apple"], ["Striver SDE", "Striver A2Z"], "Each inner cell equals the sum of the two cells directly above it."],
    ["Majority Element", "majority-element", "Boyer-Moore Voting", "EASY", ["Amazon", "Google", "Microsoft"], ["Striver SDE", "Striver A2Z", "Grind 169"], "Cancel out different elements with a running candidate and counter."],
    ["Majority Element II", "majority-element-ii", "Extended Boyer-Moore", "MEDIUM", ["Google", "Amazon"], ["Striver SDE", "Striver A2Z"], "At most two elements can appear > n/3 times; track two candidates."],
    ["Merge Sorted Array", "merge-sorted-array", "Backward In-Place Merge", "EASY", ["Meta", "Amazon", "Microsoft"], ["Striver SDE", "Striver A2Z"], "Fill nums1 from the back to avoid overwriting unread elements."],
    ["Pascal's Triangle II", "pascals-triangle-ii", "O(k) Row Rolling DP", "EASY", ["Amazon", "Google"], ["Apna College"], "Update row in-place from right to left: row[j] += row[j-1]."],
    ["Find the Duplicate Number", "find-the-duplicate-number", "Floyd's Cycle on Array", "MEDIUM", ["Amazon", "Microsoft", "Meta"], ["NeetCode 150", "Striver SDE", "Apna College"], "Treat nums[i] as next pointer and detect cycle entry."],
    ["Spiral Matrix II", "spiral-matrix-ii", "Layer-by-Layer Fill", "MEDIUM", ["Amazon", "Apple"], ["Apna College"], "Fill 1..n^2 walking top, right, bottom, left bounds inward."],
    ["First Missing Positive", "first-missing-positive", "Cyclic Index Placement", "HARD", ["Amazon", "Google", "Meta"], ["Striver A2Z", "Grind 169"], "Place each value v in [1..n] at index v - 1, then scan for mismatch."],
  ]),

  // ── 2. Prefix Sum & Difference Array (10) ─────────────────────────────────
  ...buildCategory("2. Prefix Sum & Difference Array", [
    ["Running Sum of 1d Array", "running-sum-of-1d-array", "Basic Prefix Sum", "EASY", ["Google", "Amazon"], ["Striver A2Z"], "Accumulate prefix[i] = prefix[i-1] + nums[i]."],
    ["Find Pivot Index", "find-pivot-index", "Left vs Right Prefix", "EASY", ["Meta", "Amazon"], ["Striver A2Z"], "Compare leftSum against totalSum - leftSum - nums[i]."],
    ["Range Sum Query - Immutable", "range-sum-query-immutable", "1D Prefix Query", "EASY", ["Meta", "Google"], ["Grind 169"], "Precompute prefix sums so each range query runs in O(1)."],
    ["Range Sum Query 2D - Immutable", "range-sum-query-2d-immutable", "2D Inclusion-Exclusion", "MEDIUM", ["Meta", "Google", "Uber"], ["NeetCode 150"], "Use 2D prefix matrix pref[r][c] with inclusion-exclusion."],
    ["Subarray Sum Equals K", "subarray-sum-equals-k", "Prefix Sum + HashMap", "MEDIUM", ["Meta", "Amazon", "Google"], ["Striver A2Z", "Grind 169"], "Count occurrences of (currentPrefix - k) seen so far."],
    ["Contiguous Array", "contiguous-array", "0 -> -1 Prefix Balance", "MEDIUM", ["Meta", "Amazon", "Google"], ["Grind 169"], "Treat 0 as -1 and track earliest index of each prefix balance."],
    ["Subarray Sums Divisible by K", "subarray-sums-divisible-by-k", "Modulo Prefix Buckets", "MEDIUM", ["Amazon", "Flipkart"], ["Striver A2Z"], "Normalize negative remainders ((sum % k) + k) % k and count frequencies."],
    ["Product of Array Except Self", "product-of-array-except-self", "Prefix & Suffix Products", "MEDIUM", ["Amazon", "Meta", "Microsoft"], ["Blind 75", "NeetCode 150", "Grind 169"], "Multiply left-to-right prefix product with right-to-left suffix product."],
    ["Corporate Flight Bookings", "corporate-flight-bookings", "Difference Array", "MEDIUM", ["Google", "Uber"], ["Striver A2Z"], "Add +seats at start and -seats at end+1, then take prefix sum."],
    ["Count Number of Nice Subarrays", "count-number-of-nice-subarrays", "Odd Count Prefix Map", "MEDIUM", ["Amazon", "Microsoft"], ["Striver A2Z"], "Map each element to parity (0/1) and count prefix sums differing by k."],
    ["Range Sum Query - Mutable", "range-sum-query-mutable", "Fenwick / Segment Tree", "MEDIUM", ["Google", "Meta", "Amazon"], ["Apna College"], "Use a Binary Indexed Tree or Segment Tree for O(log n) update & sum."],
    ["Count of Smaller Numbers After Self", "count-of-smaller-numbers-after-self", "Merge Sort / BIT Inversion", "HARD", ["Google", "Amazon"], ["Apna College"], "Count right-half elements jumped during merge sort or query Fenwick Tree."],
    ["Count of Range Sum", "count-of-range-sum", "Prefix Merge-Sort Count", "HARD", ["Google", "Meta"], ["Apna College"], "Count prefix[j] - prefix[i] in [lower, upper] during merge sort."],
    ["Create Sorted Array through Instructions", "create-sorted-array-through-instructions", "Fenwick Tree Order Stats", "HARD", ["Google", "Amazon"], ["Apna College"], "Query strictly smaller and strictly larger counts in BIT before insert."],
  ]),

  // ── 3. Hashing & Frequency Maps (10) ──────────────────────────────────────
  ...buildCategory("3. Hashing & Frequency Maps", [
    ["Contains Duplicate", "contains-duplicate", "HashSet Membership", "EASY", ["Amazon", "Apple", "Adobe"], ["Blind 75", "NeetCode 150", "Grind 169"], "Insert elements into a HashSet and return true on first collision."],
    ["Valid Anagram", "valid-anagram", "26-Char Frequency Array", "EASY", ["Amazon", "Google", "Meta"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "Increment counts for s and decrement for t; verify all zeros."],
    ["Group Anagrams", "group-anagrams", "Canonical Signature Key", "MEDIUM", ["Amazon", "Meta", "Google"], ["Blind 75", "NeetCode 150", "Grind 169"], "Key each word by its 26-char frequency signature or sorted string."],
    ["Top K Frequent Elements", "top-k-frequent-elements", "Frequency Bucket Sort", "MEDIUM", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "Count frequencies then bucket elements by frequency from n down to 1."],
    ["Longest Consecutive Sequence", "longest-consecutive-sequence", "HashSet Sequence Start", "MEDIUM", ["Google", "Amazon", "Meta"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Only expand streaks from numbers x where (x - 1) is not in the set."],
    ["Valid Sudoku", "valid-sudoku", "Row/Col/Box HashSets", "MEDIUM", ["Amazon", "Apple", "Uber"], ["NeetCode 150", "Grind 169"], "Track seen digits per row, column, and 3x3 box (r/3, c/3)."],
    ["Ransom Note", "ransom-note", "Character Supply Map", "EASY", ["Meta", "Amazon"], ["Grind 169"], "Verify magazine has at least as many of each letter as ransomNote."],
    ["Isomorphic Strings", "isomorphic-strings", "Bijective Char Mapping", "EASY", ["Amazon", "Google"], ["Striver A2Z"], "Maintain two maps s->t and t->s to enforce a 1-to-1 bijection."],
    ["4Sum II", "4sum-ii", "Meet-in-the-Middle Map", "MEDIUM", ["Amazon", "Microsoft"], ["Striver A2Z"], "Store all A[i]+B[j] sums in a map and look up -(C[k]+D[l])."],
    ["Longest Harmonious Subsequence", "longest-harmonious-subsequence", "Adjacent Key Frequency", "EASY", ["Google", "Adobe"], ["Striver A2Z"], "For each key k in frequency map, check freq[k] + freq[k+1]."],
    ["First Unique Character in a String", "first-unique-character-in-a-string", "26-Char Frequency Scan", "EASY", ["Amazon", "Microsoft", "Bloomberg"], ["Apna College"], "Count character frequencies then return first index with count == 1."],
    ["Brick Wall", "brick-wall", "Edge Position Frequency", "MEDIUM", ["Meta", "Google"], ["Apna College"], "Maximize prefix brick edge frequency; answer is rows - maxEdges."],
    ["Design HashMap", "design-hashmap", "Separate Chaining Buckets", "EASY", ["Amazon", "Microsoft", "LinkedIn"], ["Striver A2Z", "Apna College"], "Use fixed bucket array with linked lists keyed by key % capacity."],
  ]),

  // ── 4. Strings & Pattern Matching (11) ────────────────────────────────────
  ...buildCategory("4. Strings & Pattern Matching", [
    ["Longest Common Prefix", "longest-common-prefix", "Vertical Character Scan", "EASY", ["Amazon", "Google", "Adobe"], ["Striver SDE", "Striver A2Z", "Grind 169"], "Compare character i across all strings until a mismatch or end."],
    ["Roman to Integer", "roman-to-integer", "Subtractive Pair Scan", "EASY", ["Amazon", "Meta", "Microsoft"], ["Striver SDE", "Grind 169"], "Subtract value if smaller numeral precedes a larger one."],
    ["Reverse Words in a String", "reverse-words-in-a-string", "Tokenize & Reverse", "MEDIUM", ["Microsoft", "Amazon", "Apple"], ["Striver SDE", "Striver A2Z"], "Trim extra spaces, split tokens, and join in reverse order."],
    ["String to Integer (atoi)", "string-to-integer-atoi", "State Machine + Overflow", "MEDIUM", ["Meta", "Microsoft", "Amazon"], ["Striver SDE", "Grind 169"], "Skip whitespace, read sign, and clamp before 32-bit overflow."],
    ["Longest Palindromic Substring", "longest-palindromic-substring", "Expand Around Center", "MEDIUM", ["Amazon", "Microsoft", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Expand odd and even centers from every index i in O(n^2) time, O(1) space."],
    ["Palindromic Substrings", "palindromic-substrings", "Center Expansion Count", "MEDIUM", ["Meta", "Google", "Amazon"], ["Blind 75", "NeetCode 150"], "Count valid palindromes while expanding around all 2n-1 centers."],
    ["Encode and Decode Strings", "encode-and-decode-strings", "Length-Prefixed Framing", "MEDIUM", ["Meta", "Google"], ["Blind 75", "NeetCode 150"], "Prefix each string with '<len>#' so arbitrary characters decode unambiguously."],
    ["Find the Index of the First Occurrence in a String", "find-the-index-of-the-first-occurrence-in-a-string", "KMP / LPS Array", "EASY", ["Amazon", "Google", "Microsoft"], ["Striver SDE", "Striver A2Z"], "Build KMP prefix-function LPS array to match in O(n + m)."],
    ["Repeated String Match", "repeated-string-match", "Rabin-Karp / KMP Bound", "MEDIUM", ["Google", "Amazon"], ["Striver SDE"], "Repeat a at most ceil(len(b)/len(a)) + 1 times and check substring."],
    ["Count and Say", "count-and-say", "Run-Length Encoding", "MEDIUM", ["Meta", "Amazon"], ["Striver SDE"], "Iteratively run-length encode the previous term n - 1 times."],
    ["Valid Palindrome II", "valid-palindrome-ii", "One-Skip Palindrome Check", "EASY", ["Meta", "Google", "Amazon"], ["Apna College"], "On first mismatch (l, r), check palindrome(l+1, r) || palindrome(l, r-1)."],
    ["Wildcard Matching", "wildcard-matching", "2D DP / Greedy Star Backtrack", "HARD", ["Google", "Meta", "Amazon"], ["Striver A2Z", "Apna College"], "Match '?' with any single char and '*' with empty or prefix extension."],
    ["Regular Expression Matching", "regular-expression-matching", "2D Regex State DP", "HARD", ["Google", "Meta", "Uber"], ["NeetCode 150", "Apna College"], "Handle 'x*' as zero occurrences (dp[i][j-2]) or >= 1 match."],
    ["Shortest Palindrome", "shortest-palindrome", "KMP on s + '#' + rev(s)", "HARD", ["Google", "Microsoft"], ["Striver A2Z"], "Longest palindromic prefix equals LPS of s + '#' + reverse(s)."],
  ]),

  // ── 5. Two Pointers (11) ──────────────────────────────────────────────────
  ...buildCategory("5. Two Pointers", [
    ["Valid Palindrome", "valid-palindrome", "Opposite-End Pointers", "EASY", ["Meta", "Amazon", "Microsoft"], ["Blind 75", "NeetCode 150", "Grind 169"], "Skip non-alphanumeric chars from both ends and compare lowercase."],
    ["Move Zeroes", "move-zeroes", "Read/Write Slow-Fast", "EASY", ["Meta", "Amazon", "Apple"], ["Striver A2Z", "Grind 169"], "Swap non-zero elements to the write pointer to preserve order."],
    ["Remove Duplicates from Sorted Array", "remove-duplicates-from-sorted-array", "In-Place Deduplication", "EASY", ["Meta", "Amazon", "Microsoft"], ["Striver SDE", "Striver A2Z"], "Advance write pointer only when nums[read] !== nums[write]."],
    ["Squares of a Sorted Array", "squares-of-a-sorted-array", "Outward-Inward Merge", "EASY", ["Meta", "Google", "Uber"], ["Grind 169"], "Compare |nums[left]| vs |nums[right]| and fill result from back."],
    ["Two Sum II - Input Array Is Sorted", "two-sum-ii-input-array-is-sorted", "Sorted Pair Shrink", "MEDIUM", ["Amazon", "Google", "Apple"], ["NeetCode 150"], "Move left++ if sum < target, right-- if sum > target."],
    ["3Sum", "three-sum", "Sort + Two Pointers", "MEDIUM", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Fix nums[i], solve Two Sum II on [i+1..n-1], and skip duplicates."],
    ["4Sum", "4sum", "Nested Fix + Two Pointers", "MEDIUM", ["Amazon", "Google"], ["Striver SDE", "Striver A2Z"], "Fix i and j with duplicate skips, then run two pointers with 64-bit sums."],
    ["Container With Most Water", "container-with-most-water", "Greedy Width Shrink", "MEDIUM", ["Amazon", "Google", "Meta"], ["Blind 75", "NeetCode 150", "Grind 169"], "Always advance the shorter wall inward to seek a taller boundary."],
    ["3Sum Closest", "3sum-closest", "Closest Target Tracking", "MEDIUM", ["Amazon", "Meta"], ["Grind 169"], "Track min |sum - target| while sweeping two pointers after sorting."],
    ["Rotate Array", "rotate-array", "Triple Array Reversal", "MEDIUM", ["Amazon", "Microsoft", "Apple"], ["Striver A2Z", "Grind 169"], "Reverse whole array, reverse [0..k-1], then reverse [k..n-1]."],
    ["Remove Element", "remove-element", "In-Place Filter Pointer", "EASY", ["Amazon", "Google"], ["Apna College"], "Copy elements != val to write pointer k."],
    ["Sort Array By Parity", "sort-array-by-parity", "Even/Odd Partition", "EASY", ["Meta", "Microsoft"], ["Apna College"], "Swap even elements to front and odd elements to back in one pass."],
    ["Next Greater Element III", "next-greater-element-iii", "Digit Next Permutation", "MEDIUM", ["Amazon", "Google"], ["Apna College"], "Apply next permutation on digit string and check 32-bit INT_MAX."],
    ["Trapping Rain Water", "trapping-rain-water", "Two-Pointer Max Walls", "HARD", ["Amazon", "Google", "Meta"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Track leftMax and rightMax; water at smaller side is maxWall - height."],
  ]),

  // ── 6. Sliding Window (11) ────────────────────────────────────────────────
  ...buildCategory("6. Sliding Window", [
    ["Best Time to Buy and Sell Stock", "best-time-to-buy-and-sell-stock", "One-Pass Min/Max Window", "EASY", ["Amazon", "Meta", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Maintain running min buy price and maximize price - minBuy."],
    ["Maximum Average Subarray I", "maximum-average-subarray-i", "Fixed-Size Window", "EASY", ["Google", "Meta"], ["Striver A2Z"], "Slide a fixed k-length window adding nums[r] and removing nums[r-k]."],
    ["Longest Substring Without Repeating Characters", "longest-substring-without-repeating-characters", "Variable Unique Window", "MEDIUM", ["Amazon", "Meta", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Jump left pointer to max(left, lastSeen[ch] + 1) on duplicates."],
    ["Longest Repeating Character Replacement", "longest-repeating-character-replacement", "Max-Freq Window", "MEDIUM", ["Google", "Amazon"], ["Blind 75", "NeetCode 150"], "Shrink window when (windowLen - maxCharFreq) > k."],
    ["Permutation in String", "permutation-in-string", "Fixed Anagram Match", "MEDIUM", ["Microsoft", "Amazon", "Meta"], ["NeetCode 150"], "Maintain a 26-char frequency diff over a window of size s1.length."],
    ["Find All Anagrams in a String", "find-all-anagrams-in-a-string", "Fixed Window Matches", "MEDIUM", ["Meta", "Amazon"], ["Grind 169"], "Record left index whenever window frequency matches p."],
    ["Max Consecutive Ones III", "max-consecutive-ones-iii", "At-Most-K-Zeros Window", "MEDIUM", ["Meta", "Google", "Microsoft"], ["Striver A2Z"], "Expand right; shrink left while zeroCount > k."],
    ["Fruit Into Baskets", "fruit-into-baskets", "At-Most-2-Distinct Window", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Track type frequencies in map and shrink while map.size > 2."],
    ["Minimum Size Subarray Sum", "minimum-size-subarray-sum", "Shortest Sum >= Target", "MEDIUM", ["Meta", "Amazon"], ["Striver A2Z"], "Since all nums > 0, shrink left greedily while sum >= target."],
    ["Subarray Product Less Than K", "subarray-product-less-than-k", "Multiplicative Sliding Window", "MEDIUM", ["Amazon", "Google"], ["Apna College"], "Divide out nums[left] while prod >= k; add (right - left + 1)."],
    ["Sliding Window Median", "sliding-window-median", "Two Heaps + Lazy Delete", "HARD", ["Google", "Meta", "Amazon"], ["Grind 169"], "Maintain balanced max/min heaps with a lazy-deletion frequency map."],
    ["Subarrays with K Different Integers", "subarrays-with-k-different-integers", "AtMost(K) - AtMost(K-1)", "HARD", ["Google", "Amazon"], ["Striver A2Z"], "Exact(K) subarrays = AtMostDistinct(K) - AtMostDistinct(K - 1)."],
    ["Minimum Window Substring", "minimum-window-substring", "Need/Have Counter Window", "HARD", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "Expand until all required chars satisfied, then contract left for min length."],
  ]),

  // ── 7. Stack & Monotonic Stack (11) ───────────────────────────────────────
  ...buildCategory("7. Stack & Monotonic Stack", [
    ["Valid Parentheses", "valid-parentheses", "Matching Bracket Stack", "EASY", ["Amazon", "Meta", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Push expected closing brackets and verify top on each close."],
    ["Min Stack", "min-stack", "Auxiliary Min Tracking", "MEDIUM", ["Amazon", "Google", "Bloomberg"], ["NeetCode 150", "Striver SDE", "Grind 169"], "Store (value, currentMin) pairs on the stack for O(1) getMin."],
    ["Implement Stack using Queues", "implement-stack-using-queues", "Queue Rotation", "EASY", ["Amazon", "Microsoft"], ["Striver SDE", "Striver A2Z"], "On push, rotate previous q.size - 1 elements behind the new element."],
    ["Evaluate Reverse Polish Notation", "evaluate-reverse-polish-notation", "Postfix Expression Eval", "MEDIUM", ["Amazon", "LinkedIn"], ["NeetCode 150", "Grind 169"], "Pop two operands on operator (b then a) and push a op b."],
    ["Daily Temperatures", "daily-temperatures", "Monotonic Decreasing Stack", "MEDIUM", ["Meta", "Amazon", "Google"], ["NeetCode 150", "Grind 169"], "Keep indices of unresolved cooler days; pop when warmer day arrives."],
    ["Next Greater Element I", "next-greater-element-i", "Monotonic Stack + Map", "EASY", ["Amazon", "Adobe"], ["Striver SDE", "Striver A2Z"], "Precompute next greater for nums2 into a map using a decreasing stack."],
    ["Next Greater Element II", "next-greater-element-ii", "Circular Monotonic Stack", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "Iterate 2 * n times using i % n to resolve circular wraparound."],
    ["Asteroid Collision", "asteroid-collision", "Collision Simulation Stack", "MEDIUM", ["Meta", "Amazon", "DoorDash"], ["Striver A2Z", "Grind 169"], "Only right-moving (+top) and left-moving (-cur) asteroids collide."],
    ["Car Fleet", "car-fleet", "Sorted Arrival Time Stack", "MEDIUM", ["Google", "Uber"], ["NeetCode 150"], "Sort by position descending; a car merges if arrivalTime <= fleetAhead."],
    ["Online Stock Span", "online-stock-span", "Monotonic Span Compression", "MEDIUM", ["Amazon", "Microsoft"], ["Striver SDE", "Striver A2Z"], "Pop (price, span) pairs <= current price and accumulate their spans."],
    ["Sum of Subarray Minimums", "sum-of-subarray-minimums", "Prev/Next Smaller Contribution", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "Each nums[i] contributes nums[i] * leftDist * rightDist to total sum."],
    ["Remove K Digits", "remove-k-digits", "Greedy Increasing Stack", "MEDIUM", ["Amazon", "Microsoft"], ["Striver A2Z", "Apna College"], "Pop larger previous digits while k > 0 and strip leading zeros."],
    ["Maximal Rectangle", "maximal-rectangle", "Histogram Stack per Row", "HARD", ["Google", "Amazon", "Meta"], ["Striver A2Z", "Apna College"], "Accumulate consecutive '1' heights per row and run histogram stack."],
    ["Basic Calculator", "basic-calculator", "Sign + Paren Stack", "HARD", ["Meta", "Google", "Uber"], ["Grind 169"], "Push running result and sign onto stack when entering '('."],
    ["Largest Rectangle in Histogram", "largest-rectangle-in-histogram", "Monotonic Increasing Stack", "HARD", ["Amazon", "Google", "Meta"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Pop bar when shorter bar arrives; width = right - leftSmaller - 1."],
  ]),

  // ── 8. Queue & Monotonic Deque (10) ───────────────────────────────────────
  ...buildCategory("8. Queue & Monotonic Deque", [
    ["Implement Queue using Stacks", "implement-queue-using-stacks", "Amortized Two-Stack Queue", "EASY", ["Amazon", "Microsoft"], ["Striver SDE", "Striver A2Z", "Grind 169"], "Pour inStack into outStack only when outStack is empty for O(1) amortized."],
    ["Number of Recent Calls", "number-of-recent-calls", "Sliding Time Queue", "EASY", ["Google", "Meta"], ["Striver A2Z"], "Enqueue t and dequeue timestamps < t - 3000."],
    ["Time Needed to Buy Tickets", "time-needed-to-buy-tickets", "Circular Queue / One-Pass", "EASY", ["Amazon", "Flipkart"], ["Striver A2Z"], "Each person before k contributes min(tickets[i], tickets[k]); after k min(t[i], t[k]-1)."],
    ["Design Circular Queue", "design-circular-queue", "Fixed Ring Buffer", "MEDIUM", ["Amazon", "Microsoft", "Apple"], ["Striver A2Z"], "Track head, size, and capacity using (head + size) % cap."],
    ["Design Circular Deque", "design-circular-deque", "Double-Ended Ring Buffer", "MEDIUM", ["Google", "Uber"], ["Striver A2Z"], "Wrap front pointer backward with (front - 1 + cap) % cap."],
    ["Dota2 Senate", "dota2-senate", "Dual Index Queues", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Pop min index from R and D queues; winner re-enqueues at idx + n."],
    ["Reveal Cards In Increasing Order", "reveal-cards-in-increasing-order", "Index Simulation Queue", "MEDIUM", ["Amazon", "Adobe"], ["Striver A2Z"], "Simulate card indices in queue to place sorted values in reveal order."],
    ["Sliding Window Maximum", "sliding-window-maximum", "Monotonic Decreasing Deque", "HARD", ["Amazon", "Google", "Meta"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Evict out-of-window front and smaller back elements; front is window max."],
    ["Shortest Subarray with Sum at Least K", "shortest-subarray-with-sum-at-least-k", "Prefix + Monotonic Deque", "HARD", ["Google", "Meta"], ["Striver A2Z"], "Maintain increasing prefix sums in deque to handle negative numbers."],
    ["Constrained Subsequence Sum", "constrained-subsequence-sum", "DP + Monotonic Deque", "HARD", ["Google", "Amazon"], ["Striver A2Z"], "Use a k-window max deque to pick best previous dp[j] in O(1)."],
    ["Jump Game VI", "jump-game-vi", "K-Window Max DP Deque", "MEDIUM", ["Google", "Amazon"], ["Apna College"], "Maintain decreasing dp[j] indices in deque within [i-k..i-1]."],
    ["Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit", "longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit", "Min & Max Deques Window", "MEDIUM", ["Google", "Uber"], ["Apna College"], "Track window max and min deques; shrink left when max - min > limit."],
  ]),

  // ── 9. Binary Search (12) ─────────────────────────────────────────────────
  ...buildCategory("9. Binary Search", [
    ["Binary Search", "binary-search", "Classic Midpoint Bisection", "EASY", ["Amazon", "Microsoft", "Google"], ["NeetCode 150", "Striver A2Z", "Grind 169"], "Bisect [lo, hi] using mid = lo + (hi - lo) / 2."],
    ["Search Insert Position", "search-insert-position", "Lower Bound Bisection", "EASY", ["Amazon", "Google"], ["Striver A2Z"], "Return the leftmost index where nums[i] >= target."],
    ["First Bad Version", "first-bad-version", "Leftmost Predicate True", "EASY", ["Meta", "Google", "Amazon"], ["Grind 169"], "Shrink hi = mid when isBadVersion(mid) is true."],
    ["Search a 2D Matrix", "search-a-2d-matrix", "Flattened 2D Binary Search", "MEDIUM", ["Amazon", "Meta", "Microsoft"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Map linear index mid to row = mid / cols, col = mid % cols."],
    ["Koko Eating Bananas", "koko-eating-bananas", "Binary Search on Answer", "MEDIUM", ["Google", "Amazon", "Meta"], ["NeetCode 150", "Striver A2Z"], "Binary search minimum speed k in [1..max(piles)] with feasibility check."],
    ["Find Minimum in Rotated Sorted Array", "find-minimum-in-rotated-sorted-array", "Pivot Boundary Search", "MEDIUM", ["Amazon", "Meta", "Microsoft"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "Compare nums[mid] with nums[hi] to discard the sorted higher half."],
    ["Search in Rotated Sorted Array", "search-in-rotated-sorted-array", "Sorted-Half Elimination", "MEDIUM", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Identify which half is sorted, then check if target lies inside it."],
    ["Find Peak Element", "find-peak-element", "Slope Ascent Search", "MEDIUM", ["Meta", "Google", "Amazon"], ["Striver A2Z"], "Move toward the higher neighbor (nums[mid] < nums[mid+1] -> lo = mid + 1)."],
    ["Capacity To Ship Packages Within D Days", "capacity-to-ship-packages-within-d-days", "Min Capacity on Answer", "MEDIUM", ["Amazon", "Meta", "Google"], ["Striver A2Z"], "Binary search ship capacity between max(weights) and sum(weights)."],
    ["Time Based Key-Value Store", "time-based-key-value-store", "Upper-Bound Timestamp", "MEDIUM", ["Amazon", "Apple", "Uber"], ["NeetCode 150", "Grind 169"], "Store (timestamp, value) list per key and binary search <= timestamp."],
    ["Find First and Last Position of Element in Sorted Array", "find-first-and-last-position-of-element-in-sorted-array", "Lower & Upper Bound", "MEDIUM", ["Meta", "Amazon", "Google"], ["Striver A2Z", "Apna College"], "Run two binary searches: leftmost == target and rightmost == target."],
    ["Single Element in a Sorted Array", "single-element-in-a-sorted-array", "Even/Odd Pair Parity", "MEDIUM", ["Amazon", "Microsoft"], ["Striver SDE", "Striver A2Z"], "Force mid even; if nums[mid] == nums[mid+1], single lies on right."],
    ["Magnetic Force Between Two Balls", "magnetic-force-between-two-balls", "Max-Min Distance on Answer", "MEDIUM", ["Amazon", "Flipkart"], ["Striver A2Z", "Apna College"], "Binary search minimum spacing d and greedily place m balls."],
    ["Split Array Largest Sum", "split-array-largest-sum", "Min-Max Partition Search", "HARD", ["Google", "Meta", "Amazon"], ["Striver A2Z"], "Binary search max subarray sum limit and count required subarrays."],
    ["Median of Two Sorted Arrays", "median-of-two-sorted-arrays", "Partition Index Bisection", "HARD", ["Google", "Amazon", "Meta"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Binary search cut i in smaller array so leftMax <= rightMin."],
  ]),

  // ── 10. Linked List (11) ──────────────────────────────────────────────────
  ...buildCategory("10. Linked List", [
    ["Reverse Linked List", "reverse-linked-list", "Iterative 3-Pointer Flip", "EASY", ["Amazon", "Meta", "Microsoft"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Track prev, curr, next and reverse curr.next = prev in O(1) space."],
    ["Merge Two Sorted Lists", "merge-two-sorted-lists", "Dummy Head Merge", "EASY", ["Amazon", "Microsoft", "Apple"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Attach smaller node to dummy tail until one list finishes."],
    ["Linked List Cycle", "linked-list-cycle", "Floyd's Tortoise & Hare", "EASY", ["Amazon", "Microsoft", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Advance slow by 1 and fast by 2; they meet iff a cycle exists."],
    ["Middle of the Linked List", "middle-of-the-linked-list", "Slow-Fast Halfway", "EASY", ["Amazon", "Google", "Meta"], ["Striver SDE", "Striver A2Z", "Grind 169"], "When fast reaches null, slow points to the middle node."],
    ["Palindrome Linked List", "palindrome-linked-list", "Reverse Second Half", "EASY", ["Meta", "Amazon"], ["Striver SDE", "Striver A2Z", "Grind 169"], "Find middle, reverse second half in-place, and compare both halves."],
    ["Remove Nth Node From End of List", "remove-nth-node-from-end-of-list", "Fixed-Gap Two Pointers", "MEDIUM", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Advance fast n+1 steps from dummy so slow stops before target."],
    ["Reorder List", "reorder-list", "Split + Reverse + Zip", "MEDIUM", ["Meta", "Amazon"], ["Blind 75", "NeetCode 150"], "Split at middle, reverse second half, and interleave nodes."],
    ["Linked List Cycle II", "linked-list-cycle-ii", "Cycle Entry Math", "MEDIUM", ["Amazon", "Microsoft"], ["Striver SDE", "Striver A2Z"], "Reset one pointer to head after meeting; advance both by 1 to find entry."],
    ["Add Two Numbers", "add-two-numbers", "Carry Propagation", "MEDIUM", ["Amazon", "Meta", "Microsoft"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Sum digits + carry node by node using a dummy head."],
    ["Copy List with Random Pointer", "copy-list-with-random-pointer", "Interleaved Clone / Map", "MEDIUM", ["Meta", "Amazon", "Microsoft"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Map original -> clone (or interleave clones) before wiring next and random."],
    ["LRU Cache", "lru-cache", "HashMap + Doubly Linked List", "MEDIUM", ["Amazon", "Meta", "Google"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Use O(1) HashMap lookup + O(1) DLL move-to-front / evict-tail."],
    ["Intersection of Two Linked Lists", "intersection-of-two-linked-lists", "Two-Pointer Head Swap", "EASY", ["Amazon", "Microsoft", "Meta"], ["Striver SDE", "Striver A2Z", "Apna College"], "Redirect pointer A->headB and B->headA on null to equalize lengths."],
    ["Sort List", "sort-list", "Bottom-Up / Top-Down Merge", "MEDIUM", ["Meta", "Amazon", "Microsoft"], ["Striver A2Z", "Apna College"], "Split list with slow/fast pointers and merge sorted halves."],
    ["Reverse Nodes in k-Group", "reverse-nodes-in-k-group", "K-Block In-Place Reversal", "HARD", ["Amazon", "Microsoft", "Meta"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Verify k nodes exist ahead, reverse k links, and connect prevGroupTail."],
    ["Merge k Sorted Lists", "merge-k-sorted-lists", "Min-Heap / Divide & Conquer", "HARD", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "Maintain a min-heap of k list heads or merge pairs bottom-up."],
  ]),

  // ── 11. Binary Trees (12) ─────────────────────────────────────────────────
  ...buildCategory("11. Binary Trees", [
    ["Invert Binary Tree", "invert-binary-tree", "Post/Pre-Order Child Swap", "EASY", ["Google", "Amazon"], ["Blind 75", "NeetCode 150", "Grind 169"], "Recursively swap node.left and node.right."],
    ["Maximum Depth of Binary Tree", "maximum-depth-of-binary-tree", "DFS Height Recursion", "EASY", ["Amazon", "Google", "LinkedIn"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Return 1 + max(depth(left), depth(right))."],
    ["Diameter of Binary Tree", "diameter-of-binary-tree", "Height + Global Max Path", "EASY", ["Meta", "Amazon", "Google"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "At each node update ans = max(ans, leftH + rightH)."],
    ["Balanced Binary Tree", "balanced-binary-tree", "Bottom-Up -1 Sentinel", "EASY", ["Amazon", "Meta"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Return -1 immediately if |leftH - rightH| > 1 for O(n) check."],
    ["Same Tree", "same-tree", "Lockstep DFS", "EASY", ["Amazon", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Verify p.val == q.val and recurse on both left and right subtrees."],
    ["Subtree of Another Tree", "subtree-of-another-tree", "Root Match + SameTree", "EASY", ["Meta", "Amazon"], ["Blind 75", "NeetCode 150", "Grind 169"], "Check isSameTree at every node matching subRoot.val."],
    ["Binary Tree Level Order Traversal", "binary-tree-level-order-traversal", "BFS Queue by Level Size", "MEDIUM", ["Meta", "Amazon", "Microsoft"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Snapshot q.size at the start of each level loop."],
    ["Binary Tree Right Side View", "binary-tree-right-side-view", "Last Node per Level / R-DFS", "MEDIUM", ["Meta", "Amazon", "Bloomberg"], ["NeetCode 150", "Striver A2Z", "Grind 169"], "Visit right child first in DFS and record first node at each depth."],
    ["Count Good Nodes in Binary Tree", "count-good-nodes-in-binary-tree", "Path-Max Preorder DFS", "MEDIUM", ["Microsoft", "Amazon"], ["NeetCode 150"], "Pass maxSoFar down DFS; increment when node.val >= maxSoFar."],
    ["Lowest Common Ancestor of a Binary Tree", "lowest-common-ancestor-of-a-binary-tree", "Post-Order Split Detection", "MEDIUM", ["Meta", "Amazon", "Google"], ["Striver SDE", "Striver A2Z", "Grind 169"], "If both left and right return non-null, current node is LCA."],
    ["Construct Binary Tree from Preorder and Inorder Traversal", "construct-binary-tree-from-preorder-and-inorder-traversal", "Preorder Root + Inorder Split", "MEDIUM", ["Amazon", "Microsoft", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "First preorder item is root; look up its index in inorder map to split sizes."],
    ["All Nodes Distance K in Binary Tree", "all-nodes-distance-k-in-binary-tree", "Parent Map + Undirected BFS", "MEDIUM", ["Meta", "Amazon", "Google"], ["Striver A2Z", "Apna College"], "Record parent pointers via DFS, then run BFS of radius K from target."],
    ["Vertical Order Traversal of a Binary Tree", "vertical-order-traversal-of-a-binary-tree", "(Col, Row, Val) Sort / BFS", "HARD", ["Meta", "Google", "Amazon"], ["Striver SDE", "Striver A2Z", "Apna College"], "Track (col, row, val) per node and sort by col, row, then value."],
    ["Maximum Width of Binary Tree", "maximum-width-of-binary-tree", "Indexed Level-Order BFS", "MEDIUM", ["Amazon", "Google", "Meta"], ["Striver SDE", "Striver A2Z"], "Normalize indices per level (idx - levelMin) to avoid 2^h overflow."],
    ["Flatten Binary Tree to Linked List", "flatten-binary-tree-to-linked-list", "Morris / Reverse Preorder", "MEDIUM", ["Meta", "Amazon", "Microsoft"], ["Striver SDE", "Striver A2Z", "Apna College"], "Connect rightmost node of left subtree to curr.right and move left to right."],
    ["Binary Tree Maximum Path Sum", "binary-tree-maximum-path-sum", "Max Gain + Split Update", "HARD", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Clamp negative gains to 0; update global max with val + left + right."],
    ["Serialize and Deserialize Binary Tree", "serialize-and-deserialize-binary-tree", "Preorder with Null Markers", "HARD", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "Emit 'N' for null nodes in preorder so a queue reconstructs uniquely."],
  ]),

  // ── 12. Binary Search Trees (10) ──────────────────────────────────────────
  ...buildCategory("12. Binary Search Trees", [
    ["Search in a Binary Search Tree", "search-in-a-binary-search-tree", "BST Directional Step", "EASY", ["Amazon", "Adobe"], ["Striver SDE", "Striver A2Z"], "Go left if val < root.val, else go right."],
    ["Lowest Common Ancestor of a Binary Search Tree", "lowest-common-ancestor-of-a-binary-search-tree", "BST Value Split", "MEDIUM", ["Meta", "Amazon", "LinkedIn"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Split occurs at first node whose value lies between p and q."],
    ["Insert into a Binary Search Tree", "insert-into-a-binary-search-tree", "Leaf Attachment", "MEDIUM", ["Amazon", "Microsoft"], ["Striver A2Z"], "Walk down BST comparisons and attach new TreeNode at null leaf."],
    ["Delete Node in a BST", "delete-node-in-a-bst", "Inorder Successor Replace", "MEDIUM", ["Amazon", "Google", "Meta"], ["Striver A2Z"], "For 2-child node, replace with inorder successor and delete successor."],
    ["Validate Binary Search Tree", "validate-binary-search-tree", "Min/Max Bounds Recursion", "MEDIUM", ["Amazon", "Meta", "Microsoft"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Pass strict (min, max) bounds down rather than checking immediate children."],
    ["Kth Smallest Element in a BST", "kth-smallest-element-in-a-bst", "Bounded Inorder Traversal", "MEDIUM", ["Amazon", "Meta", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Inorder traversal visits BST nodes in sorted order; stop at k."],
    ["Convert Sorted Array to Binary Search Tree", "convert-sorted-array-to-binary-search-tree", "Midpoint Root Divide", "EASY", ["Amazon", "Apple"], ["Striver SDE", "Grind 169"], "Pick mid as root and recursively build left and right halves."],
    ["Construct Binary Search Tree from Preorder Traversal", "construct-binary-search-tree-from-preorder-traversal", "Upper-Bound Preorder Build", "MEDIUM", ["Amazon", "Microsoft"], ["Striver SDE", "Striver A2Z"], "Advance index while val < upperBound; pass root.val as left bound."],
    ["Binary Search Tree Iterator", "binary-search-tree-iterator", "Controlled Left-Spine Stack", "MEDIUM", ["Meta", "Google", "Microsoft"], ["Striver SDE", "Striver A2Z"], "Push all left descendants on init and after popping a node with right child."],
    ["Recover Binary Search Tree", "recover-binary-search-tree", "Inorder Inversion Swap", "MEDIUM", ["Amazon", "Microsoft"], ["Striver A2Z"], "Find first and last inorder inversions and swap their values."],
    ["Two Sum IV - Input is a BST", "two-sum-iv-input-is-a-bst", "BST Iterator Two-Pointer", "EASY", ["Amazon", "Google"], ["Striver SDE", "Striver A2Z"], "Pair forward and backward BST iterators for O(h) space two-sum."],
    ["Inorder Successor in BST", "inorder-successor-in-bst", "BST Candidate Tracking", "MEDIUM", ["Meta", "Microsoft", "Google"], ["Striver A2Z", "Apna College"], "Whenever root.val > p.val, record root as candidate and step left."],
    ["Maximum Sum BST in Binary Tree", "maximum-sum-bst-in-binary-tree", "Bottom-Up (isBST, min, max, sum)", "HARD", ["Amazon", "Google"], ["Striver SDE", "Apna College"], "Return (minVal, maxVal, sum) tuple from post-order DFS."],
  ]),

  // ── 13. Tries (10) ────────────────────────────────────────────────────────
  ...buildCategory("13. Tries", [
    ["Implement Trie (Prefix Tree)", "implement-trie-prefix-tree", "26-Way Trie Node", "MEDIUM", ["Google", "Amazon", "Meta"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Each TrieNode holds children[26] and an isEnd boolean flag."],
    ["Design Add and Search Words Data Structure", "design-add-and-search-words-data-structure", "Wildcard '.' Trie DFS", "MEDIUM", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Grind 169"], "Branch across all non-null children when pattern character is '.'."],
    ["Longest Common Suffix Queries", "longest-common-suffix-queries", "Reversed Word Trie", "HARD", ["Google", "Amazon"], ["Striver A2Z"], "Insert reversed words into Trie storing best (shortest len, min idx)."],
    ["Replace Words", "replace-words", "Shortest Prefix Match", "MEDIUM", ["Uber", "Amazon"], ["Striver A2Z"], "Walk Trie per word and return on the first node with isEnd == true."],
    ["Search Suggestions System", "search-suggestions-system", "Trie / Sorted Prefix", "MEDIUM", ["Amazon", "Google"], ["NeetCode 150"], "Store up to 3 lexicographically smallest words at each Trie node."],
    ["Map Sum Pairs", "map-sum-pairs", "Prefix Sum Trie", "MEDIUM", ["Google", "Apple"], ["Striver A2Z"], "Track delta on key updates and add delta along the prefix path."],
    ["Maximum XOR of Two Numbers in an Array", "maximum-xor-of-two-numbers-in-an-array", "Bitwise Binary Trie", "MEDIUM", ["Google", "Amazon"], ["Striver SDE", "Striver A2Z"], "Insert 31-bit MSB-first; greedily take opposite bit at each level."],
    ["Maximum XOR With an Element From Array", "maximum-xor-with-an-element-from-array", "Offline Sorted Bit Trie", "HARD", ["Google", "Flipkart"], ["Striver A2Z"], "Sort nums and queries by limit m_i; insert nums <= m_i before querying."],
    ["Word Search II", "word-search-ii", "Trie + Grid Backtracking", "HARD", ["Amazon", "Microsoft", "Meta"], ["Blind 75", "NeetCode 150", "Grind 169"], "Build Trie of dictionary words so grid DFS prunes dead prefixes early."],
    ["Longest Word in Dictionary", "longest-word-in-dictionary", "All-Prefixes Trie BFS", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z", "Apna College"], "Only traverse Trie children whose isEnd == true."],
    ["Stream of Characters", "stream-of-characters", "Reversed Suffix Trie", "HARD", ["Google", "Meta"], ["Apna College"], "Insert reversed words into Trie and walk recent query suffix backward."],
    ["Concatenated Words", "concatenated-words", "Trie / Word-Break DP", "HARD", ["Amazon", "Meta"], ["Grind 169"], "Check if each word can be formed by >= 2 shorter words in the set."],
  ]),

  // ── 14. Heap / Priority Queue (10) ────────────────────────────────────────
  ...buildCategory("14. Heap / Priority Queue", [
    ["Kth Largest Element in a Stream", "kth-largest-element-in-a-stream", "Size-K Min-Heap", "EASY", ["Amazon", "Google"], ["NeetCode 150", "Striver A2Z"], "Keep a min-heap of size k; top() is always the kth largest."],
    ["Last Stone Weight", "last-stone-weight", "Max-Heap Simulation", "EASY", ["Amazon", "Nvidia"], ["NeetCode 150"], "Pop two heaviest stones and push |y - x| if non-zero."],
    ["K Closest Points to Origin", "k-closest-points-to-origin", "Max-Heap of Size K", "MEDIUM", ["Meta", "Amazon", "Apple"], ["NeetCode 150", "Grind 169"], "Maintain size-k max-heap by x^2 + y^2 to evict farthest points."],
    ["Kth Largest Element in an Array", "kth-largest-element-in-an-array", "Min-Heap / Quickselect", "MEDIUM", ["Meta", "Amazon", "Google"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Maintain size-k min-heap or partition around random pivot."],
    ["Task Scheduler", "task-scheduler", "Max-Heap + Cooldown Queue", "MEDIUM", ["Meta", "Amazon", "Uber"], ["NeetCode 150", "Striver A2Z", "Grind 169"], "Formula (maxFreq - 1) * (n + 1) + countOfMaxFreq, clamped to tasks.length."],
    ["Design Twitter", "design-twitter", "K-Way Merge Tweets", "MEDIUM", ["Amazon", "Uber"], ["NeetCode 150"], "Use a max-heap over head tweets of each followed user."],
    ["Reorganize String", "reorganize-string", "Greedy Max-Freq Heap", "MEDIUM", ["Amazon", "Google", "Meta"], ["Grind 169"], "Alternate popping top-2 most frequent chars so no two adjacent match."],
    ["Find K Pairs with Smallest Sums", "find-k-pairs-with-smallest-sums", "Min-Heap Frontier", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Seed heap with (nums1[i]+nums2[0], i, 0) and advance j+1 on pop."],
    ["IPO", "ipo", "Two Heaps (Cap + Profit)", "HARD", ["Google", "Microsoft"], ["Striver A2Z"], "Push affordable projects into max-profit heap as capital grows."],
    ["Top K Frequent Words", "top-k-frequent-words", "Freq + Lexicographic Heap", "MEDIUM", ["Amazon", "Google", "Meta"], ["Grind 169", "Apna College"], "Order min-heap by lower freq first, then reverse-lexicographic tiebreak."],
    ["Kth Smallest Element in a Sorted Matrix", "kth-smallest-element-in-a-sorted-matrix", "Min-Heap / Value Bisection", "MEDIUM", ["Meta", "Amazon", "Google"], ["Apna College"], "Push first column into min-heap or binary search count <= mid."],
    ["Smallest Range Covering Elements from K Lists", "smallest-range-covering-elements-from-k-lists", "K-Pointer Min-Heap + Max", "HARD", ["Google", "Amazon"], ["Grind 169", "Apna College"], "Track currentMax while popping min element from K-list heap."],
    ["Find Median from Data Stream", "find-median-from-data-stream", "Balanced Min/Max Heaps", "HARD", ["Amazon", "Google", "Meta"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Keep lower half in max-heap and upper half in min-heap within size diff 1."],
  ]),

  // ── 15. Recursion & Backtracking (11) ─────────────────────────────────────
  ...buildCategory("15. Recursion & Backtracking", [
    ["Subsets", "subsets", "Pick / Skip Power Set", "MEDIUM", ["Meta", "Amazon", "Google"], ["NeetCode 150", "Striver A2Z", "Grind 169"], "Recurse with index i choosing include vs exclude at each step."],
    ["Subsets II", "subsets-ii", "Sort + Skip Same-Level Dup", "MEDIUM", ["Amazon", "Meta"], ["NeetCode 150", "Striver SDE", "Striver A2Z"], "Sort nums; skip i > start when nums[i] == nums[i - 1]."],
    ["Combination Sum", "combination-sum", "Unbounded Pick / Next", "MEDIUM", ["Meta", "Amazon", "Airbnb"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Stay at index i on pick (reuse allowed) and advance to i+1 on skip."],
    ["Combination Sum II", "combination-sum-ii", "Bounded Unique Combos", "MEDIUM", ["Amazon", "Microsoft"], ["NeetCode 150", "Striver SDE", "Striver A2Z"], "Sort candidates, skip adjacent duplicates at the same depth, advance i+1."],
    ["Permutations", "permutations", "Used-Array / Swap DFS", "MEDIUM", ["Amazon", "Meta", "Microsoft"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Track visited[i] boolean array to build all n! orderings."],
    ["Generate Parentheses", "generate-parentheses", "Open/Close Count Guard", "MEDIUM", ["Amazon", "Google", "Meta"], ["NeetCode 150", "Striver A2Z", "Grind 169"], "Add '(' if open < n; add ')' only if close < open."],
    ["Letter Combinations of a Phone Number", "letter-combinations-of-a-phone-number", "Digit-to-Letters Cartesian", "MEDIUM", ["Amazon", "Meta", "Google"], ["NeetCode 150", "Striver A2Z", "Grind 169"], "Map digit at idx to its letters and recurse idx + 1."],
    ["Word Search", "word-search", "4-Dir Grid Backtrack", "MEDIUM", ["Amazon", "Meta", "Microsoft"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "Mark cell '#' temporarily during DFS and restore on backtrack."],
    ["Palindrome Partitioning", "palindrome-partitioning", "Prefix Palindrome Cut", "MEDIUM", ["Amazon", "Google"], ["NeetCode 150", "Striver SDE", "Striver A2Z"], "Slice [start..end] only when substring is a palindrome."],
    ["Permutations II", "permutations-ii", "Sorted Used-Flag Dedup", "MEDIUM", ["Amazon", "Microsoft"], ["Apna College"], "Skip nums[i] == nums[i-1] when !used[i-1] to avoid duplicate trees."],
    ["Combination Sum III", "combination-sum-iii", "K-Length Digit Backtrack", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z", "Apna College"], "Pick distinct digits 1..9 in increasing order with remaining sum & count."],
    ["Unique Paths III", "unique-paths-iii", "Hamiltonian Grid Backtrack", "HARD", ["Google", "Amazon"], ["Apna College"], "Count total walkable squares and require remaining == 0 at end cell."],
    ["N-Queens", "n-queens", "Col & Diagonal Bitsets", "HARD", ["Amazon", "Google", "Meta"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Track occupied cols, (r-c) diag1, and (r+c) diag2 in O(1)."],
    ["Sudoku Solver", "sudoku-solver", "Constraint Backtracking", "HARD", ["Amazon", "Google", "Uber"], ["Striver SDE", "Striver A2Z", "Grind 169"], "Try digits 1..9 in empty cells checking row, col, and 3x3 box."],
  ]),

  // ── 16. Graphs (BFS / DFS / Connected Components) (11) ────────────────────
  ...buildCategory("16. Graphs (BFS / DFS / Connected Components)", [
    ["Flood Fill", "flood-fill", "4-Directional Grid DFS", "EASY", ["Amazon", "Microsoft"], ["Striver A2Z", "Grind 169"], "Guard against newColor == originalColor to avoid infinite recursion."],
    ["Number of Islands", "number-of-islands", "Connected Grid Components", "MEDIUM", ["Amazon", "Meta", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Increment count on each unvisited '1' and sink its island via DFS/BFS."],
    ["Max Area of Island", "max-area-of-island", "Component Size Accumulation", "MEDIUM", ["Meta", "Amazon", "Google"], ["NeetCode 150"], "Return 1 + sum of 4 neighbors during grid DFS."],
    ["Clone Graph", "clone-graph", "DFS/BFS + Old-to-New Map", "MEDIUM", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Grind 169"], "Map original Node -> cloned Node before recursing on neighbors."],
    ["Rotting Oranges", "rotting-oranges", "Multi-Source BFS", "MEDIUM", ["Amazon", "Microsoft", "Meta"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Enqueue all initially rotten oranges at t=0 and spread level-by-level."],
    ["01 Matrix", "01-matrix", "Multi-Source Distance BFS", "MEDIUM", ["Amazon", "Google", "Meta"], ["Striver A2Z", "Grind 169"], "Start BFS simultaneously from all 0 cells to compute shortest distance."],
    ["Surrounded Regions", "surrounded-regions", "Border-Escape DFS", "MEDIUM", ["Amazon", "Google"], ["NeetCode 150", "Striver A2Z"], "Mark 'O's reachable from border as safe, then flip remaining 'O' -> 'X'."],
    ["Pacific Atlantic Water Flow", "pacific-atlantic-water-flow", "Reverse Ocean BFS/DFS", "MEDIUM", ["Google", "Meta", "Amazon"], ["Blind 75", "NeetCode 150", "Grind 169"], "Flow uphill from Pacific and Atlantic borders; intersect reachable sets."],
    ["Is Graph Bipartite?", "is-graph-bipartite", "2-Coloring BFS/DFS", "MEDIUM", ["Meta", "Google", "Amazon"], ["Striver SDE", "Striver A2Z"], "Assign alternating 0/1 colors; conflict on an edge means not bipartite."],
    ["Snakes and Ladders", "snakes-and-ladders", "Boustrophedon 6-Die BFS", "MEDIUM", ["Amazon", "Meta", "Google"], ["Apna College"], "Convert square index to (r, c), jump via board[r][c] if != -1, BFS."],
    ["Shortest Path in Binary Matrix", "shortest-path-in-binary-matrix", "8-Directional Grid BFS", "MEDIUM", ["Meta", "Amazon", "Google"], ["Striver A2Z"], "Run unweighted BFS across 8 directions from (0,0) to (n-1,n-1)."],
    ["Word Ladder", "word-ladder", "Shortest Unweighted BFS", "HARD", ["Amazon", "Meta", "Google"], ["NeetCode 150", "Striver A2Z", "Grind 169"], "Try 26 char substitutions per position and remove visited words from set."],
    ["Word Ladder II", "word-ladder-ii", "BFS Level DAG + Backtrack", "HARD", ["Amazon", "Meta"], ["Striver A2Z", "Apna College"], "Build shortest-distance predecessor DAG via BFS, then DFS paths."],
    ["Making A Large Island", "making-a-large-island", "Component ID + Bridge Sum", "HARD", ["Meta", "Google", "Uber"], ["Striver A2Z"], "Label each island with an ID & area, then test flipping each '0' cell."],
  ]),

  // ── 17. Topological Sort, Shortest Path & DSU (11) ────────────────────────
  ...buildCategory("17. Topological Sort, Shortest Path & DSU", [
    ["Course Schedule", "course-schedule", "Kahn's Cycle Detection", "MEDIUM", ["Amazon", "Meta", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Enqueue indegree-0 nodes; graph is acyclic iff processed == numCourses."],
    ["Course Schedule II", "course-schedule-ii", "Kahn's Topological Order", "MEDIUM", ["Amazon", "Google", "Meta"], ["NeetCode 150", "Striver A2Z", "Grind 169"], "Append popped indegree-0 nodes to topological order array."],
    ["Find Eventual Safe States", "find-eventual-safe-states", "Reverse Graph Kahn's BFS", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Reverse edges and run Kahn's from terminal (outdegree-0) nodes."],
    ["Redundant Connection", "redundant-connection", "Union-Find Cycle Edge", "MEDIUM", ["Google", "Amazon"], ["NeetCode 150", "Striver A2Z"], "Union endpoints; the first edge whose endpoints already share a root is redundant."],
    ["Number of Provinces", "number-of-provinces", "DSU / Adjacency Matrix", "MEDIUM", ["Amazon", "Microsoft"], ["Striver A2Z"], "Count distinct DSU roots across n vertices."],
    ["Accounts Merge", "accounts-merge", "Email-to-Index DSU", "MEDIUM", ["Meta", "Google", "Amazon"], ["Striver A2Z", "Grind 169"], "Union all emails belonging to the same account, then group by root."],
    ["Network Delay Time", "network-delay-time", "Dijkstra Min-Heap", "MEDIUM", ["Google", "Amazon", "Uber"], ["NeetCode 150", "Striver A2Z"], "Run Dijkstra from k and return max(dist) if all nodes are reachable."],
    ["Cheapest Flights Within K Stops", "cheapest-flights-within-k-stops", "Bellman-Ford / K-Stop BFS", "MEDIUM", ["Amazon", "Airbnb", "Google"], ["NeetCode 150", "Striver A2Z", "Grind 169"], "Relax edges k + 1 rounds using a snapshot copy of dist[] each round."],
    ["Path With Minimum Effort", "path-with-minimum-effort", "Minimax Dijkstra on Grid", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Minimize max(|h[u] - h[v]|) along path using Dijkstra priority queue."],
    ["Min Cost to Connect All Points", "min-cost-to-connect-all-points", "Prim's / Kruskal's MST", "MEDIUM", ["Amazon", "Microsoft"], ["NeetCode 150", "Striver A2Z"], "Build Minimum Spanning Tree over Manhattan distances."],
    ["Number of Operations to Make Network Connected", "number-of-operations-to-make-network-connected", "DSU Extra Cables Count", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z", "Apna College"], "Need edges >= n - 1; min ops equals (connectedComponents - 1)."],
    ["Most Stones Removed with Same Row or Column", "most-stones-removed-with-same-row-or-column", "Row/Col Bipartite DSU", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z", "Apna College"], "Union stone's row and ~(col); answer = stones.length - components."],
    ["Alien Dictionary", "alien-dictionary", "Char Precedence Topo Sort", "HARD", ["Meta", "Google", "Airbnb"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "Compare adjacent words for first differing char edge, then run Kahn's."],
    ["Swim in Rising Water", "swim-in-rising-water", "Minimax Dijkstra / DSU", "HARD", ["Google", "Meta"], ["NeetCode 150", "Striver A2Z"], "Pop lowest-elevation cell from min-heap tracking max elevation seen."],
  ]),

  // ── 18. 1-D Dynamic Programming (11) ──────────────────────────────────────
  ...buildCategory("18. 1-D Dynamic Programming", [
    ["Climbing Stairs", "climbing-stairs", "Fibonacci Recurrence", "EASY", ["Amazon", "Google", "Adobe"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "ways[i] = ways[i - 1] + ways[i - 2] with O(1) rolling variables."],
    ["Min Cost Climbing Stairs", "min-cost-climbing-stairs", "1D Min-Cost Step", "EASY", ["Amazon", "Microsoft"], ["NeetCode 150"], "dp[i] = cost[i] + min(dp[i-1], dp[i-2])."],
    ["House Robber", "house-robber", "Take / Skip Non-Adjacent", "MEDIUM", ["Amazon", "Google", "Cisco"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "dp[i] = max(dp[i-1], dp[i-2] + nums[i])."],
    ["House Robber II", "house-robber-ii", "Circular Linear Split", "MEDIUM", ["Google", "Amazon"], ["Blind 75", "NeetCode 150", "Striver A2Z"], "Take max(rob(0..n-2), rob(1..n-1)) to break circular adjacency."],
    ["Decode Ways", "decode-ways", "1-Digit / 2-Digit Split", "MEDIUM", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Grind 169"], "Check valid 1-digit ('1'..'9') and 2-digit ('10'..'26') transitions."],
    ["Coin Change", "coin-change", "Unbounded Min Coins", "MEDIUM", ["Amazon", "Google", "Meta"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "dp[a] = min(dp[a], dp[a - coin] + 1) initialized to amount + 1."],
    ["Maximum Product Subarray", "maximum-product-subarray", "Track Min & Max Product", "MEDIUM", ["Amazon", "LinkedIn", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Grind 169"], "Track both curMax and curMin because a negative number flips signs."],
    ["Word Break", "word-break", "Prefix Segmentation DP", "MEDIUM", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Grind 169"], "dp[i] is true if any j < i has dp[j] && dict.has(s[j..i])."],
    ["Longest Increasing Subsequence", "longest-increasing-subsequence", "Patience Sort / O(n log n)", "MEDIUM", ["Amazon", "Microsoft", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Maintain tails[] array and binary search lower_bound for each x."],
    ["Partition Equal Subset Sum", "partition-equal-subset-sum", "0/1 Subset Sum Bitset/DP", "MEDIUM", ["Meta", "Amazon", "Google"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Check if total/2 is reachable iterating target backward."],
    ["Jump Game II", "jump-game-ii", "BFS Level / DP Reach", "MEDIUM", ["Amazon", "Google"], ["NeetCode 150", "Striver A2Z", "Grind 169"], "Expand farthest reach per jump boundary to count min jumps in O(n)."],
    ["Combination Sum IV", "combination-sum-iv", "Order-Matters Coin Permutations", "MEDIUM", ["Google", "Meta"], ["Blind 75", "Apna College"], "Loop target outer and nums inner so different orderings count separately."],
    ["Maximum Length of Pair Chain", "maximum-length-of-pair-chain", "Pair Sort + LIS / Greedy", "MEDIUM", ["Amazon", "Google"], ["Apna College"], "Sort pairs by end value and greedily pick non-overlapping chains."],
    ["Perfect Squares", "perfect-squares", "Lagrange / Min Square DP", "MEDIUM", ["Google", "Microsoft", "Meta"], ["Grind 169", "Apna College"], "dp[i] = min(dp[i], dp[i - s*s] + 1) for all squares s*s <= i."],
  ]),

  // ── 19. 2-D & Subsequence Dynamic Programming (11) ────────────────────────
  ...buildCategory("19. 2-D & Subsequence Dynamic Programming", [
    ["Unique Paths", "unique-paths", "2D Grid Path Count", "MEDIUM", ["Google", "Amazon", "Meta"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "dp[r][c] = dp[r-1][c] + dp[r][c-1]."],
    ["Minimum Path Sum", "minimum-path-sum", "2D Min Cost Grid", "MEDIUM", ["Amazon", "Google"], ["Striver SDE", "Striver A2Z"], "dp[r][c] = grid[r][c] + min(dp[r-1][c], dp[r][c-1])."],
    ["Longest Common Subsequence", "longest-common-subsequence", "2D String Match DP", "MEDIUM", ["Amazon", "Google", "Meta"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z"], "If s1[i]==s2[j] take 1+dp[i-1][j-1], else max(dp[i-1][j], dp[i][j-1])."],
    ["Best Time to Buy and Sell Stock with Cooldown", "best-time-to-buy-and-sell-stock-with-cooldown", "State Machine DP", "MEDIUM", ["Google", "Amazon"], ["NeetCode 150", "Striver A2Z"], "Track hold, sold (cooldown), and rest states at each day."],
    ["Coin Change II", "coin-change-ii", "Unbounded Combinations", "MEDIUM", ["Amazon", "Bloomberg"], ["NeetCode 150", "Striver A2Z"], "Loop coins outer, amount inner to count combinations instead of permutations."],
    ["Target Sum", "target-sum", "Subset Difference Count", "MEDIUM", ["Meta", "Google"], ["NeetCode 150", "Striver A2Z"], "Convert +/- assignment into counting subsets summing to (total + target)/2."],
    ["Interleaving String", "interleaving-string", "2-Pointer Prefix DP", "MEDIUM", ["Amazon", "Google"], ["NeetCode 150"], "dp[i][j] = (dp[i-1][j] && s1[i-1]==s3[i+j-1]) || (dp[i][j-1] && s2[j-1]==s3[i+j-1])."],
    ["Longest Increasing Path in a Matrix", "longest-increasing-path-in-a-matrix", "Grid DAG Memoization", "HARD", ["Google", "Meta", "Amazon"], ["NeetCode 150"], "DFS + memo from each cell moving strictly to larger neighbors."],
    ["Distinct Subsequences", "distinct-subsequences", "String Count DP", "HARD", ["Google", "Amazon"], ["NeetCode 150", "Striver A2Z"], "On match s[i]==t[j], add both take (dp[i-1][j-1]) and skip (dp[i-1][j])."],
    ["Edit Distance", "edit-distance", "Levenshtein 2D DP", "HARD", ["Google", "Amazon", "Meta"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "On mismatch take 1 + min(insert, delete, replace) across dp[i][j]."],
    ["Burst Balloons", "burst-balloons", "Interval DP (Last Burst)", "HARD", ["Google", "Amazon"], ["NeetCode 150", "Striver A2Z"], "Choose k as the LAST balloon to burst in (left, right) so boundaries stay intact."],
    ["Minimum Cost to Cut a Stick", "minimum-cost-to-cut-a-stick", "Sorted-Cuts Interval DP", "HARD", ["Google", "Amazon"], ["Striver A2Z"], "Pad cuts with 0 and n; dp[i][j] tries each split k between i and j."],
    ["Maximal Square", "maximal-square", "2D Min-Neighbor Square DP", "MEDIUM", ["Amazon", "Google", "Meta"], ["Grind 169", "Apna College"], "dp[r][c] = 1 + min(top, left, topLeft) when matrix[r][c] == '1'."],
  ]),

  // ── 20. Greedy Algorithms (10) ────────────────────────────────────────────
  ...buildCategory("20. Greedy Algorithms", [
    ["Assign Cookies", "assign-cookies", "Two-Pointer Greedy Match", "EASY", ["Amazon", "Adobe"], ["Striver A2Z"], "Sort greed & cookies; satisfy smallest child with smallest valid cookie."],
    ["Lemonade Change", "lemonade-change", "Greedy Denomination Change", "EASY", ["Amazon", "Flipkart"], ["Striver A2Z"], "Prefer giving $10 + $5 over three $5s when making $15 change."],
    ["Jump Game", "jump-game", "Farthest Reachable Index", "MEDIUM", ["Amazon", "Microsoft", "Meta"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "Return false if i > maxReach; otherwise update maxReach = max(maxReach, i + nums[i])."],
    ["Gas Station", "gas-station", "Net Surplus Reset", "MEDIUM", ["Amazon", "Google", "Uber"], ["NeetCode 150", "Grind 169"], "If totalGas >= totalCost, unique start is right after tank dips < 0."],
    ["Hand of Straights", "hand-of-straights", "Min-Card Group Formation", "MEDIUM", ["Google", "Amazon"], ["NeetCode 150"], "Always start next straight from the smallest remaining card."],
    ["Partition Labels", "partition-labels", "Last-Occurrence Reach", "MEDIUM", ["Amazon", "Google"], ["NeetCode 150"], "Extend current partition end to max(lastSeen[ch]); cut when i == end."],
    ["Valid Parenthesis String", "valid-parenthesis-string", "Min/Max Open Balance", "MEDIUM", ["Meta", "Amazon"], ["NeetCode 150", "Striver A2Z"], "Track [lo, hi] possible '(' counts; clamp lo >= 0 and fail if hi < 0."],
    ["Merge Triplets to Form Target Triplet", "merge-triplets-to-form-target-triplet", "Domination Filter", "MEDIUM", ["Google"], ["NeetCode 150"], "Discard triplets exceeding target on any axis; check if all 3 target coords appear."],
    ["Minimum Number of Refueling Stops", "minimum-number-of-refueling-stops", "Greedy Max-Fuel Heap", "HARD", ["Google", "Amazon"], ["Striver A2Z"], "Push passed station fuels into max-heap and refuel only when tank runs dry."],
    ["Candy", "candy", "Two-Pass Slope Greedy", "HARD", ["Amazon", "Google", "Microsoft"], ["Striver A2Z"], "Left-to-right pass for increasing ratings, right-to-left max pass for decreasing."],
    ["Bag of Tokens", "bag-of-tokens", "Sort + Two-Pointer Greedy", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Play smallest token face-up for score, largest token face-down for power."],
    ["Two City Scheduling", "two-city-scheduling", "Cost-Delta Greedy Sort", "MEDIUM", ["Amazon", "Bloomberg"], ["Grind 169"], "Sort by (costA - costB) ascending; send first n to A and rest to B."],
    ["Queue Reconstruction by Height", "queue-reconstruction-by-height", "Tallest-First k-Insert", "MEDIUM", ["Google", "Amazon"], ["Apna College"], "Sort by height desc, k asc; insert each person at index k."],
  ]),

  // ── 21. Intervals (10) ────────────────────────────────────────────────────
  ...buildCategory("21. Intervals", [
    ["Meeting Rooms", "meeting-rooms", "Sort & Overlap Check", "EASY", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Grind 169"], "Sort by start time and verify prev.end <= curr.start."],
    ["Merge Intervals", "merge-intervals", "Sort Start + Extend End", "MEDIUM", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Sort by start; merge if curr.start <= last.end via max(last.end, curr.end)."],
    ["Insert Interval", "insert-interval", "Three-Phase Sweep", "MEDIUM", ["Google", "Meta", "Amazon"], ["Blind 75", "NeetCode 150", "Grind 169"], "Emit intervals before, merge all overlapping into newInterval, emit intervals after."],
    ["Non-overlapping Intervals", "non-overlapping-intervals", "Earliest-End Greedy", "MEDIUM", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "Sort by end time and keep intervals with start >= prevEnd."],
    ["Meeting Rooms II", "meeting-rooms-ii", "Min-Heap / Sweep Line", "MEDIUM", ["Meta", "Amazon", "Google"], ["Blind 75", "NeetCode 150", "Grind 169"], "Sort start and end arrays separately or track active end times in a min-heap."],
    ["Minimum Number of Arrows to Burst Balloons", "minimum-number-of-arrows-to-burst-balloons", "Earliest-End Intersection", "MEDIUM", ["Amazon", "Microsoft"], ["Striver A2Z"], "Sort by end; shoot arrow at current end and skip all overlapping balloons."],
    ["Interval List Intersections", "interval-list-intersections", "Two-Pointer Interval Merge", "MEDIUM", ["Meta", "Uber", "Google"], ["Grind 169"], "Overlap is [max(a0,b0), min(a1,b1)] if valid; advance interval with smaller end."],
    ["Car Pooling", "car-pooling", "Timeline Delta Sweep", "MEDIUM", ["Amazon", "Uber"], ["Striver A2Z"], "Add +passengers at from and -passengers at to, then sweep prefix sum."],
    ["My Calendar I", "my-calendar-i", "Balanced BST / Sorted Check", "MEDIUM", ["Google", "Amazon"], ["Grind 169"], "Two intervals [s1,e1) and [s2,e2) overlap iff max(s1,s2) < min(e1,e2)."],
    ["Minimum Interval to Include Each Query", "minimum-interval-to-include-each-query", "Offline Sort + Min-Heap", "HARD", ["Google", "Meta"], ["NeetCode 150"], "Sort queries & intervals; push intervals starting <= q, pop ending < q."],
    ["My Calendar II", "my-calendar-ii", "Overlap + Double-Booked List", "MEDIUM", ["Google", "Uber"], ["Apna College"], "Track double-booked overlaps separately and reject any triple overlap."],
  ]),

  // ── 22. Bit Manipulation & Math (11) ──────────────────────────────────────
  ...buildCategory("22. Bit Manipulation & Math", [
    ["Single Number", "single-number", "XOR Cancellation", "EASY", ["Amazon", "Google", "Apple"], ["NeetCode 150", "Striver A2Z", "Grind 169"], "XOR all elements; pairs cancel to 0 leaving the unique number."],
    ["Number of 1 Bits", "number-of-1-bits", "Brian Kernighan's n & (n-1)", "EASY", ["Amazon", "Microsoft", "Apple"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "n &= (n - 1) clears the lowest set bit in each iteration."],
    ["Counting Bits", "counting-bits", "DP Bits dp[i >> 1] + (i & 1)", "EASY", ["Amazon", "Google"], ["Blind 75", "NeetCode 150", "Grind 169"], "Reuse already-computed bit count of i >> 1 plus lowest bit."],
    ["Reverse Bits", "reverse-bits", "32-Bit Shift & Mask", "EASY", ["Apple", "Amazon"], ["Blind 75", "NeetCode 150", "Grind 169"], "Shift res left 1, OR with (n & 1), and unsigned-shift n right 1."],
    ["Missing Number", "missing-number", "XOR / Gauss Sum", "EASY", ["Amazon", "Microsoft", "Meta"], ["Blind 75", "NeetCode 150", "Striver A2Z", "Grind 169"], "XOR all indices 0..n with all array values."],
    ["Sum of Two Integers", "sum-of-two-integers", "Bitwise Adder (XOR + AND)", "MEDIUM", ["Meta", "Amazon"], ["Blind 75", "NeetCode 150"], "Repeat sum = a ^ b and carry = (a & b) << 1 until carry == 0."],
    ["Reverse Integer", "reverse-integer", "Overflow-Safe Digit Pop", "MEDIUM", ["Amazon", "Apple", "Bloomberg"], ["NeetCode 150", "Grind 169"], "Check bounds against INT_MAX/10 and INT_MIN/10 before multiplying by 10."],
    ["Pow(x, n)", "powx-n", "Binary Exponentiation", "MEDIUM", ["Meta", "Amazon", "Google"], ["NeetCode 150", "Striver SDE", "Striver A2Z", "Grind 169"], "Square base and halve exponent; handle negative n as 1/x with 64-bit exp."],
    ["Happy Number", "happy-number", "Floyd Cycle on Digit Sum", "EASY", ["Google", "Amazon"], ["NeetCode 150"], "Detect cycle in digit-square sum sequence using fast/slow or HashSet."],
    ["Plus One", "plus-one", "Trailing-9 Carry Scan", "EASY", ["Google", "Meta"], ["NeetCode 150"], "Increment first non-9 from right; if all 9s, prepend 1."],
    ["Single Number III", "single-number-iii", "Lowest Set Bit Partition", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "Use diff = xorAll & -xorAll to split numbers into two groups."],
    ["Power of Two", "power-of-two", "n > 0 && (n & (n - 1)) == 0", "EASY", ["Google", "Amazon"], ["Striver A2Z", "Apna College"], "Powers of two have exactly one set bit in binary."],
  ]),
];

export const DSA_SHEET_PROBLEMS: DsaSheetProblemItem[] = RAW_ITEMS.map(
  (item, idx) => ({
    order: idx + 1,
    ...item,
  })
);
