import { z } from "zod";
import {
  ProblemDifficultySchema,
  type SupportedCodeLanguage,
} from "./coding.js";

export const DsaSheetStatusSchema = z.enum(["UNSOLVED", "SOLVED", "REVISION"]);
export type DsaSheetStatus = z.infer<typeof DsaSheetStatusSchema>;

export const SheetSourceTagSchema = z.enum([
  "Blind 75",
  "NeetCode 150",
  "Striver SDE",
  "Striver A2Z",
  "Grind 169",
  "Apna College",
  "Top Interview 150",
  "Love Babbar 450",
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
  language: SupportedCodeLanguage;
  problemExplanation: string;
  patternRecognition: string;
  bruteForceApproach: string;
  bruteForceComplexity: { time: string; space: string };
  bruteForceCode: string;
  optimalApproach: string;
  optimalComplexity: { time: string; space: string };
  optimalCode: string;
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
    ["Game of Life", "game-of-life", "In-Place Bit Encoding", "MEDIUM", ["Meta", "Google", "Amazon"], ["Top Interview 150"], "Use bit 1 for next state and bit 0 for current state before right-shifting."],
    ["Maximum Sum Circular Subarray", "maximum-sum-circular-subarray", "Max(Kadane, Total - MinSubarray)", "MEDIUM", ["Amazon", "Google", "Microsoft"], ["Top Interview 150"], "Circular max is either standard Kadane or totalSum - minSubarraySum."],
    ["Diagonal Traverse", "diagonal-traverse", "r + c Diagonal Parity", "MEDIUM", ["Meta", "Amazon", "Google"], ["Top Interview 150"], "Group or walk diagonals flipping direction when (r + c) is even vs odd."],
    ["Maximum Points You Can Obtain from Cards", "maximum-points-you-can-obtain-from-cards", "Complement Min-Window", "MEDIUM", ["Google", "Amazon", "Flipkart"], ["Striver A2Z"], "Minimize the contiguous (n - k) unpicked middle window sum."],
    ["Find All Numbers Disappeared in an Array", "find-all-numbers-disappeared-in-an-array", "In-Place Sign Marking", "EASY", ["Google", "Amazon"], ["Apna College"], "Negate nums[|x| - 1] in-place; indices remaining positive are missing."],
    ["Third Maximum Number", "third-maximum-number", "3-Variable Distinct Tracking", "EASY", ["Amazon", "Meta"], ["Apna College"], "Track top 3 distinct maximums in one pass without sorting."],
    ["Max Consecutive Ones", "max-consecutive-ones", "Running Streak Counter", "EASY", ["Google", "Amazon"], ["Striver A2Z"], "Increment streak on 1, reset on 0, and track max streak."],
    ["Reshape the Matrix", "reshape-the-matrix", "Linear Index Mapping", "EASY", ["Google", "Microsoft"], ["Top Interview 150"], "Map linear index k to [k / c][k % c] when r * c matches original size."],
    ["Toeplitz Matrix", "toeplitz-matrix", "Top-Left Neighbor Check", "EASY", ["Meta", "Google"], ["Top Interview 150"], "Verify matrix[r][c] == matrix[r - 1][c - 1] for all r > 0, c > 0."],
    ["Transpose Matrix", "transpose-matrix", "Row-Col Swap Matrix", "EASY", ["Apple", "Amazon"], ["Striver A2Z"], "Assign res[c][r] = matrix[r][c] into an n x m output matrix."],
    ["Image Smoother", "image-smoother", "3x3 Neighbor Average", "EASY", ["Amazon", "Google"], ["Top Interview 150"], "Average valid 3x3 neighbors around each cell using floor division."],
    ["Set Mismatch", "set-mismatch", "In-Place Sign / XOR Pair", "EASY", ["Amazon", "Google"], ["Striver A2Z"], "Negate visited indices to spot duplicate, then find remaining positive index."],
    ["Find All Duplicates in an Array", "find-all-duplicates-in-an-array", "In-Place Index Negation", "MEDIUM", ["Amazon", "Microsoft", "Meta"], ["Striver A2Z", "Love Babbar 450"], "If nums[|x| - 1] is already negative, |x| appears twice."],
    ["H-Index", "h-index", "Counting Bucket Suffix", "MEDIUM", ["Google", "Meta", "Bloomberg"], ["Top Interview 150"], "Bucket citations >= n into bucket[n] and scan from n down until count >= h."],
    ["H-Index II", "h-index-ii", "Sorted Citation Bisection", "MEDIUM", ["Google", "Meta"], ["Striver A2Z"], "Binary search smallest mid where citations[mid] >= n - mid."],
    ["Wiggle Sort II", "wiggle-sort-ii", "Median + Virtual Index 3-Way", "MEDIUM", ["Google", "Amazon"], ["Love Babbar 450"], "Partition around median using virtual indexing (1 + 2*i) % (n | 1)."],
    ["Non-decreasing Array", "non-decreasing-array", "Greedy Valley Fix", "MEDIUM", ["Google", "Microsoft"], ["Apna College"], "On first inversion nums[i-1] > nums[i], lower nums[i-1] if safe else raise nums[i]."],
    ["Minimum Swaps to Group All 1's Together II", "minimum-swaps-to-group-all-1s-together-ii", "Circular Fixed-Window Zeros", "MEDIUM", ["Amazon", "Microsoft"], ["Striver A2Z"], "Slide window of size totalOnes over 2*n circular array minimizing zeros."],
    ["Reverse Pairs", "reverse-pairs", "Merge Sort Cross-Half Count", "HARD", ["Google", "Amazon"], ["Striver SDE", "Striver A2Z"], "Before merging halves, count pairs with nums[i] > 2L * nums[j]."],
    ["Global and Local Inversions", "global-and-local-inversions", "Prefix Max Bound Check", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "True iff no non-adjacent inversion exists: max(nums[0..i]) <= nums[i+2]."],
    ["Battleships in a Board", "battleships-in-a-board", "Top-Left Ship Head Count", "MEDIUM", ["Meta", "Microsoft"], ["Top Interview 150"], "Count 'X' cells that have neither an 'X' above nor an 'X' to the left."],
    ["Count Submatrices With All Ones", "count-submatrices-with-all-ones", "Row Histogram + Monotonic Stack", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Accumulate consecutive 1 heights per row and count valid rectangles via stack."],
    ["Number of Submatrices That Sum to Target", "number-of-submatrices-that-sum-to-target", "2D Row-Pair + 1D Prefix Map", "HARD", ["Google", "Meta"], ["Striver A2Z"], "Fix top and bottom rows, collapse columns, and count subarrays summing to target."],
    ["Max Sum of Rectangle No Larger Than K", "max-sum-of-rectangle-no-larger-than-k", "2D Prefix + TreeSet Ceiling", "HARD", ["Google", "Meta"], ["Love Babbar 450"], "Compress 2D columns into 1D array and binary search prefix - k in TreeSet."],
    ["Trapping Rain Water II", "trapping-rain-water-ii", "3D Boundary Min-Heap BFS", "HARD", ["Google", "Amazon", "Meta"], ["Love Babbar 450"], "Seed min-heap with matrix border cells and flood inward updating max boundary."],
    ["Rotating the Box", "rotating-the-box", "Gravity Shift + 90-Deg Rotate", "MEDIUM", ["Amazon", "Uber"], ["Top Interview 150"], "Slide stones right toward obstacles per row, then rotate matrix 90 degrees clockwise."],
    ["Array Nesting", "array-nesting", "In-Place Cycle Length", "MEDIUM", ["Apple", "Amazon"], ["Love Babbar 450"], "Walk permutation cycles marking visited elements -1 to find longest cycle."],
    ["K-diff Pairs in an Array", "k-diff-pairs-in-an-array", "Frequency Map / Sorted Scan", "MEDIUM", ["Amazon", "Uber"], ["Striver A2Z"], "Count unique keys x where (x + k) exists (or freq[x] > 1 when k == 0)."],
    ["Maximum Sum of Two Non-Overlapping Subarrays", "maximum-sum-of-two-non-overlapping-subarrays", "Prefix Max L-Before-M / M-Before-L", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Sweep prefix max of firstLen window before secondLen window and vice versa."],
    ["Candy Crush", "candy-crush", "Mark Negative + Gravity Drop", "MEDIUM", ["Google", "Bloomberg"], ["Grind 169"], "Mark 3+ horizontal/vertical matches negative, drop positives down, repeat."],
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
    ["Continuous Subarray Sum", "continuous-subarray-sum", "Modulo Prefix Earliest Index", "MEDIUM", ["Meta", "Amazon", "Google"], ["Top Interview 150"], "If prefixSum % k repeats at distance >= 2, a multiple-of-k subarray exists."],
    ["Product of the Last K Numbers", "product-of-the-last-k-numbers", "Resetting Prefix Product", "MEDIUM", ["Google", "Meta"], ["Top Interview 150"], "Reset prefix array to [1] whenever 0 is added; divide pref[n-1]/pref[n-1-k]."],
    ["Shifting Letters II", "shifting-letters-ii", "Modulo Difference Array", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Accumulate +1/-1 shifts in difference array, then sweep mod 26."],
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
    ["Word Pattern", "word-pattern", "Bijective Pattern-Word Map", "EASY", ["Meta", "Amazon", "Dropbox"], ["Top Interview 150"], "Check 1-to-1 bijection between pattern chars and space-split words."],
    ["Insert Delete GetRandom O(1)", "insert-delete-getrandom-o1", "Array + Index Map Swap-Pop", "MEDIUM", ["Meta", "Amazon", "Bloomberg"], ["Top Interview 150", "Grind 169"], "Swap target with last array element on remove so pop_back is O(1)."],
    ["Minimum Area Rectangle", "minimum-area-rectangle", "Diagonal Pair Point Set", "MEDIUM", ["Google", "Meta"], ["Grind 169"], "Iterate point pairs as diagonals and check if the other 2 corners exist in Set."],
    ["Bulls and Cows", "bulls-and-cows", "Digit Frequency Balance", "MEDIUM", ["Google", "Amazon"], ["Top Interview 150"], "Count exact matches as bulls; track unmatched digit counts for cows."],
    ["Max Points on a Line", "max-points-on-a-line", "Normalized Slope Map", "HARD", ["Google", "LinkedIn", "Apple"], ["Top Interview 150"], "Reduce (dy, dx) by gcd(dy, dx) per anchor point and count max collinear."],
    ["Find the Difference", "find-the-difference", "XOR / 26-Char Delta", "EASY", ["Google", "Amazon"], ["Apna College"], "XOR all characters of s and t; paired chars cancel leaving the added char."],
    ["Intersection of Two Arrays II", "intersection-of-two-arrays-ii", "Frequency Map Decrement", "EASY", ["Meta", "Amazon", "Google"], ["Top Interview 150"], "Count nums1 frequencies, then decrement and emit matches while scanning nums2."],
    ["Contains Duplicate II", "contains-duplicate-ii", "Last-Index Map / K-Set", "EASY", ["Meta", "Amazon", "Google"], ["Top Interview 150"], "Check i - lastSeen[nums[i]] <= k or maintain a sliding HashSet of size k."],
    ["Encode and Decode TinyURL", "encode-and-decode-tinyurl", "Bijective Counter / Hash Map", "MEDIUM", ["Amazon", "Google", "Meta"], ["NeetCode 150"], "Map incremental base-62 short codes to long URLs in O(1) lookup."],
    ["Detect Squares", "detect-squares", "Point Count + Diagonal Scan", "MEDIUM", ["Google", "Amazon"], ["NeetCode 150"], "Fix diagonal point (x2, y2) with |x-x2| == |y-y2| > 0 and multiply corner counts."],
    ["Number of Boomerangs", "number-of-boomerangs", "Squared-Distance Group Map", "MEDIUM", ["Google", "Amazon"], ["Apna College"], "For each anchor i, group points by dist^2 and add count * (count - 1)."],
    ["Pairs of Songs With Total Durations Divisible by 60", "pairs-of-songs-with-total-durations-divisible-by-60", "Mod-60 Complement Array", "MEDIUM", ["Amazon", "Salesforce"], ["Striver A2Z"], "Count rem = t % 60 and pair with (60 - rem) % 60 seen so far."],
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
    ["Compare Version Numbers", "compare-version-numbers", "Split Revision Integer Compare", "MEDIUM", ["Amazon", "Microsoft", "Apple"], ["Striver SDE", "Top Interview 150"], "Parse dot-separated segments as ints treating missing segments as 0."],
    ["Zigzag Conversion", "zigzag-conversion", "Row-Bounce String Builders", "MEDIUM", ["Amazon", "Paytm", "Adobe"], ["Top Interview 150"], "Append chars to current row and flip direction at row 0 and numRows - 1."],
    ["Integer to Roman", "integer-to-roman", "Greedy Value-Symbol Table", "MEDIUM", ["Amazon", "Meta", "Oracle"], ["Top Interview 150"], "Greedily subtract largest numeral from [1000, 900, 500, 400, ..., 1]."],
    ["Longest Happy Prefix", "longest-happy-prefix", "KMP LPS Final Value", "HARD", ["Google", "Amazon"], ["Striver A2Z", "Love Babbar 450"], "Compute KMP prefix table; answer is s.slice(0, lps[n - 1])."],
    ["Add Binary", "add-binary", "Reverse Digit Carry Sum", "EASY", ["Meta", "Amazon", "Google"], ["Grind 169", "Top Interview 150"], "Walk both strings from right to left adding bits + carry mod 2."],
    ["Multiply Strings", "multiply-strings", "Grade-School Digit Array", "MEDIUM", ["Meta", "Microsoft", "Google"], ["NeetCode 150", "Top Interview 150"], "Multiply num1[i] * num2[j] into pos[i + j + 1] and propagate carries."],
    ["Remove All Adjacent Duplicates in String II", "remove-all-adjacent-duplicates-in-string-ii", "Char + Count Stack", "MEDIUM", ["Meta", "Bloomberg", "Amazon"], ["Grind 169"], "Push (char, streak) onto stack and pop when streak reaches k."],
    ["Minimum Remove to Make Valid Parentheses", "minimum-remove-to-make-valid-parentheses", "Unmatched Index Removal", "MEDIUM", ["Meta", "Amazon", "Google"], ["Grind 169"], "Track unmatched '(' indices on stack, mark unmatched ')' as invalid, then rebuild."],
    ["Custom Sort String", "custom-sort-string", "Frequency-Ordered Rebuild", "MEDIUM", ["Meta", "Amazon"], ["Grind 169"], "Emit chars in order string using s frequencies, then append leftover chars."],
    ["Push Dominoes", "push-dominoes", "Left/Right Force Distance", "MEDIUM", ["Google", "Amazon"], ["NeetCode 150"], "Assign +n / -n net forces from R and L sweeps; sign determines final tilt."],
    ["Shifting Letters", "shifting-letters", "Reverse Suffix Modulo Sum", "MEDIUM", ["Google", "Amazon"], ["Apna College"], "Accumulate shifts[i] mod 26 from right to left and shift each char."],
    ["Text Justification", "text-justification", "Greedy Line Pack + Space Dist", "HARD", ["Google", "LinkedIn", "Airbnb"], ["Top Interview 150"], "Pack max words per line, then distribute spaces evenly (left-biased) except last line."],
    ["Valid Number", "valid-number", "Digit/Sign/Dot/Exp Flags", "HARD", ["Meta", "LinkedIn"], ["Top Interview 150"], "Validate seenDigit, seenDot, and seenExp rules across a single linear pass."],
    ["Integer to English Words", "integer-to-english-words", "3-Digit Chunk Recursion", "HARD", ["Meta", "Amazon", "Microsoft"], ["Grind 169"], "Convert number in 1000-base chunks (Billion, Million, Thousand) via helper(<1000)."],
    ["Substring With Largest Variance", "substring-with-largest-variance", "Pairwise Modified Kadane", "HARD", ["Amazon", "Google"], ["Striver A2Z"], "Run Kadane treating char a as +1 and char b as -1, resetting only if b remains."],
    ["Group Shifted Strings", "group-shifted-strings", "Normalized Diff-Key Map", "MEDIUM", ["Meta", "Google"], ["Grind 169"], "Shift every char relative to s[0] mod 26 to form a canonical group key."],
    ["Fraction to Recurring Decimal", "fraction-to-recurring-decimal", "Long Division Remainder Map", "MEDIUM", ["Google", "Meta", "Goldman Sachs"], ["Top Interview 150"], "Map each remainder to its output index to insert '(' when a remainder repeats."],
    ["Longest Substring with At Least K Repeating Characters", "longest-substring-with-at-least-k-repeating-characters", "Divide & Conquer on Rare Chars", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "Split string at any char with total freq < k and recurse on segments."],
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
    ["Sort Array By Parity II", "sort-array-by-parity-ii", "Even/Odd Index Pointers", "EASY", ["Amazon", "Microsoft"], ["Love Babbar 450"], "Advance even pointer by 2 and odd pointer by 2, swapping mismatches."],
    ["Backspace String Compare", "backspace-string-compare", "Reverse Skip-Counter Pointers", "EASY", ["Google", "Meta", "Amazon"], ["Grind 169"], "Scan backward counting '#' skips to compare effective chars in O(1) space."],
    ["Remove Duplicates from Sorted Array II", "remove-duplicates-from-sorted-array-ii", "At-Most-2 Write Pointer", "MEDIUM", ["Meta", "Amazon"], ["Top Interview 150"], "Write nums[i] only if writeIdx < 2 or nums[i] != nums[writeIdx - 2]."],
    ["Boats to Save People", "boats-to-save-people", "Sort + Heavy/Light Pair", "MEDIUM", ["Amazon", "Google", "Flipkart"], ["Top Interview 150"], "Pair lightest with heaviest if sum <= limit; otherwise heaviest goes alone."],
    ["Reverse String", "reverse-string", "In-Place Opposite Swap", "EASY", ["Amazon", "Microsoft", "Apple"], ["NeetCode 150"], "Swap s[left] and s[right] while left < right."],
    ["Merge Strings Alternately", "merge-strings-alternately", "Dual Index Zip", "EASY", ["Google", "Amazon"], ["Striver A2Z"], "Append word1[i] and word2[j] alternately until both strings finish."],
    ["Number of Subsequences That Satisfy the Given Sum Condition", "number-of-subsequences-that-satisfy-the-given-sum-condition", "Sort + Two-Pointer Power-of-2", "MEDIUM", ["Google", "Amazon"], ["NeetCode 150"], "When nums[l] + nums[r] <= target, add 2^(r - l) mod 1e9+7 and advance l."],
    ["Shortest Unsorted Continuous Subarray", "shortest-unsorted-continuous-subarray", "Out-of-Order Boundary Scan", "MEDIUM", ["Amazon", "Google", "Meta"], ["Love Babbar 450"], "Find rightmost element < prefixMax and leftmost element > suffixMin."],
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
    ["Binary Subarrays With Sum", "binary-subarrays-with-sum", "AtMost(goal) - AtMost(goal-1)", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "Count subarrays with sum <= goal minus subarrays with sum <= goal - 1."],
    ["Longest Subarray of 1's After Deleting One Element", "longest-subarray-of-1s-after-deleting-one-element", "At-Most-1-Zero Window", "MEDIUM", ["Meta", "Amazon"], ["Top Interview 150"], "Maintain window with <= 1 zero and return max (right - left)."],
    ["Grumpy Bookstore Owner", "grumpy-bookstore-owner", "Fixed Bonus Window", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Add fixed-k window of grumpy==1 customers onto baseline satisfied sum."],
    ["Maximum Erasure Value", "maximum-erasure-value", "Unique Element Sum Window", "MEDIUM", ["Amazon", "Microsoft"], ["Striver A2Z"], "Shrink left while nums[right] is in set, tracking max window sum."],
    ["Substring with Concatenation of All Words", "substring-with-concatenation-of-all-words", "Word-Stride Sliding Window", "HARD", ["Amazon", "Google", "Meta"], ["Top Interview 150"], "Run word-length-strided windows from each offset 0..wordLen-1."],
    ["Get Equal Substrings Within Budget", "get-equal-substrings-within-budget", "Cost-Bounded Sliding Window", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Add |s[r] - t[r]| to cost and shrink left while cost > maxCost."],
    ["Maximum Number of Vowels in a Substring of Given Length", "maximum-number-of-vowels-in-a-substring-of-given-length", "Fixed K-Length Vowel Window", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "Slide k-size window adding 1 for entering vowel and subtracting 1 for leaving vowel."],
    ["Count Complete Subarrays in an Array", "count-complete-subarrays-in-an-array", "Shrinkable Distinct-Match Window", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "Once window has all k distinct elements, add (n - right) and advance left."],
    ["Frequency of the Most Frequent Element", "frequency-of-the-most-frequent-element", "Sort + Cost Window", "MEDIUM", ["Meta", "Amazon"], ["NeetCode 150", "Striver A2Z"], "Sort nums; shrink left while nums[r] * len - windowSum > k."],
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
    ["Sum of Subarray Ranges", "sum-of-subarray-ranges", "Max Contribution - Min Contribution", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "Compute sum of subarray maximums minus sum of subarray minimums."],
    ["132 Pattern", "132-pattern", "Reverse Monotonic Stack + Mid", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "Scan right-to-left keeping max '2' popped when a larger '3' arrives."],
    ["Basic Calculator II", "basic-calculator-ii", "Precedence Operator Stack", "MEDIUM", ["Meta", "Amazon", "Microsoft"], ["Top Interview 150", "Grind 169"], "Evaluate * and / immediately with stack top; push +num / -num for + and -."],
    ["Decode String", "decode-string", "Count & String Stacks", "MEDIUM", ["Google", "Amazon", "Meta"], ["Grind 169"], "Push (prevStr, repeatCount) on '[' and repeat current string on ']'."],
    ["Simplify Path", "simplify-path", "Canonical Directory Stack", "MEDIUM", ["Meta", "Amazon", "Microsoft"], ["Top Interview 150"], "Split by '/', skip '.' and '', pop on '..', and join with '/'."],
    ["Exclusive Time of Functions", "exclusive-time-of-functions", "Call-Stack Elapsed Time", "MEDIUM", ["Meta", "LinkedIn", "Uber"], ["Grind 169"], "Charge elapsed time to stack top on 'start' and 'end' log events."],
    ["Longest Valid Parentheses", "longest-valid-parentheses", "Index-Base Stack / 2-Pass", "HARD", ["Amazon", "Google", "Meta"], ["Striver A2Z", "Love Babbar 450"], "Seed stack with -1; pop on ')' and update max with i - stack.peek()."],
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
    ["Moving Average from Data Stream", "moving-average-from-data-stream", "Fixed-Window Queue", "EASY", ["Google", "Meta", "Amazon"], ["Top Interview 150"], "Maintain running sum and queue of size <= windowSize."],
    ["Flatten Nested List Iterator", "flatten-nested-list-iterator", "Lazy Stack / Queue Flattener", "MEDIUM", ["Meta", "Google", "LinkedIn"], ["Top Interview 150"], "Unpack nested lists from back onto stack until top is an integer."],
    ["Task Scheduler II", "task-scheduler-ii", "Last-Day Map + Day Jump", "MEDIUM", ["Meta", "Google"], ["Striver A2Z"], "Advance day = max(day + 1, lastDone[task] + space + 1)."],
    ["Max Value of Equation", "max-value-of-equation", "Monotonic Deque (y - x)", "HARD", ["Google", "Amazon"], ["Striver A2Z"], "Pop front where x_i - x_j > k; maximize (y_i + x_i) + (y_j - x_j)."],
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
    ["Sqrt(x)", "sqrtx", "Integer Root Binary Search", "EASY", ["Meta", "Amazon", "Microsoft"], ["Top Interview 150", "Striver A2Z"], "Binary search largest integer m with m * m <= x using 64-bit product."],
    ["Minimum Number of Days to Make m Bouquets", "minimum-number-of-days-to-make-m-bouquets", "Answer-Space Day Bisection", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Binary search minimum day d and greedily count m adjacent k-flower bouquets."],
    ["Search a 2D Matrix II", "search-a-2d-matrix-ii", "Top-Right Staircase Search", "MEDIUM", ["Amazon", "Google", "Meta"], ["Striver A2Z", "Apna College"], "Start at top-right corner; move left if > target or down if < target in O(m + n)."],
    ["Find K Closest Elements", "find-k-closest-elements", "Window Left-Bound Binary Search", "MEDIUM", ["Meta", "Amazon", "Google"], ["NeetCode 150", "Grind 169"], "Binary search left bound mid comparing x - arr[mid] vs arr[mid + k] - x."],
    ["Find K-th Smallest Pair Distance", "find-k-th-smallest-pair-distance", "Sort + Distance-Space Bisection", "HARD", ["Google", "Meta"], ["Striver A2Z", "Love Babbar 450"], "Sort array and binary search distance d counting pairs with diff <= d via two pointers."],
    ["Valid Perfect Square", "valid-perfect-square", "64-Bit Midpoint Bisection", "EASY", ["LinkedIn", "Amazon"], ["NeetCode 150"], "Binary search [1, num/2] checking mid * mid == num."],
    ["Arranging Coins", "arranging-coins", "Triangular Sum Binary Search", "EASY", ["Amazon", "Adobe"], ["NeetCode 150"], "Binary search largest k where k * (k + 1) / 2 <= n."],
    ["Find Smallest Letter Greater Than Target", "find-smallest-letter-greater-than-target", "Circular Upper Bound", "EASY", ["LinkedIn", "Amazon"], ["Striver A2Z"], "Binary search first letter > target, wrapping to letters[0] if none."],
    ["Kth Missing Positive Number", "kth-missing-positive-number", "Missing-Count Bisection", "EASY", ["Meta", "Amazon", "Google"], ["Striver A2Z"], "At index mid, missing count is arr[mid] - (mid + 1); answer is lo + k."],
    ["Peak Index in a Mountain Array", "peak-index-in-a-mountain-array", "Bitonic Slope Bisection", "MEDIUM", ["Meta", "Google", "Amazon"], ["Striver A2Z", "Apna College"], "If arr[mid] < arr[mid + 1] move lo = mid + 1, else hi = mid."],
    ["Minimized Maximum of Products Distributed to Any Store", "minimized-maximum-of-products-distributed-to-any-store", "Minimax Load Binary Search", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Binary search max load x so sum(ceil(q / x)) <= n."],
    ["Find in Mountain Array", "find-in-mountain-array", "Peak Find + Dual Binary Search", "HARD", ["Google", "Meta", "Amazon"], ["Striver A2Z"], "Find peak index, binary search ascending left half, then descending right half."],
    ["Divide Chocolate", "divide-chocolate", "Maximize-Min Subarray Sum", "HARD", ["Google", "Amazon"], ["Striver A2Z"], "Binary search largest min-sweetness x allowing >= k + 1 contiguous chunks."],
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
    ["Odd Even Linked List", "odd-even-linked-list", "Dual Chain Weaving", "MEDIUM", ["Amazon", "Meta", "Microsoft"], ["Striver A2Z", "Grind 169"], "Link odd nodes and even nodes separately, then attach oddTail -> evenHead."],
    ["Rotate List", "rotate-list", "Circular Tail-to-Head Link", "MEDIUM", ["Amazon", "Microsoft"], ["Striver SDE", "Top Interview 150"], "Connect tail to head, then break at (len - k % len) steps."],
    ["Swapping Nodes in a Linked List", "swapping-nodes-in-a-linked-list", "Kth-From-Start & End Swap", "MEDIUM", ["Amazon", "Google"], ["Love Babbar 450"], "Locate kth node from front, advance fast to end for kth from back, swap vals."],
    ["LFU Cache", "lfu-cache", "Freq-Bucketed DLL + Map", "HARD", ["Amazon", "Google", "Meta"], ["Striver SDE", "Striver A2Z"], "Map freq -> DoublyLinkedList of keys and track minFreq for O(1) eviction."],
    ["Remove Linked List Elements", "remove-linked-list-elements", "Dummy-Head Value Filter", "EASY", ["Amazon", "Meta"], ["Apna College"], "Walk with dummy head and bypass any node where curr.next.val == val."],
    ["Remove Duplicates from Sorted List", "remove-duplicates-from-sorted-list", "Adjacent Duplicate Skip", "EASY", ["Amazon", "Microsoft"], ["Striver A2Z"], "If curr.val == curr.next.val, set curr.next = curr.next.next."],
    ["Delete Node in a Linked List", "delete-node-in-a-linked-list", "O(1) Next-Value Overwrite", "MEDIUM", ["Amazon", "Microsoft", "Apple"], ["Striver SDE", "Striver A2Z"], "Copy node.next.val into node and bypass node.next."],
    ["Remove Duplicates from Sorted List II", "remove-duplicates-from-sorted-list-ii", "Dummy + Group Skip Pointer", "MEDIUM", ["Amazon", "Microsoft"], ["Top Interview 150"], "When curr.next.val == curr.next.next.val, skip all nodes with that value."],
    ["Swap Nodes in Pairs", "swap-nodes-in-pairs", "Dummy Adjacent Pair Flip", "MEDIUM", ["Meta", "Amazon", "Microsoft"], ["Striver A2Z", "Grind 169"], "Rewire prev -> second -> first -> nextPair iteratively from dummy."],
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
    ["Count Complete Tree Nodes", "count-complete-tree-nodes", "Left/Right Height Bisection", "EASY", ["Google", "Amazon"], ["Striver A2Z", "Top Interview 150"], "If leftHeight == rightHeight, return (1 << h) - 1 in O(log^2 n)."],
    ["Binary Tree Zigzag Level Order Traversal", "binary-tree-zigzag-level-order-traversal", "Alternating Deque / Reverse BFS", "MEDIUM", ["Amazon", "Meta", "Microsoft"], ["Striver SDE", "Striver A2Z", "Top Interview 150"], "Toggle left-to-right flag each BFS level and index from back when reversed."],
    ["Path Sum III", "path-sum-iii", "Prefix Sum DFS on Tree", "MEDIUM", ["Meta", "Amazon", "Google"], ["Grind 169"], "Track running root-to-node prefix sum frequencies in HashMap during DFS."],
    ["Construct Binary Tree from Inorder and Postorder Traversal", "construct-binary-tree-from-inorder-and-postorder-traversal", "Postorder End Root + Inorder Split", "MEDIUM", ["Amazon", "Microsoft"], ["Striver A2Z", "Top Interview 150"], "Last postorder element is root; build right subtree before left subtree."],
    ["Symmetric Tree", "symmetric-tree", "Mirror Pair DFS / BFS", "EASY", ["Amazon", "Meta", "Microsoft"], ["Striver SDE", "Striver A2Z", "Top Interview 150"], "Check isMirror(left.left, right.right) && isMirror(left.right, right.left)."],
    ["Path Sum", "path-sum", "Root-to-Leaf Target Subtract", "EASY", ["Amazon", "Meta"], ["Top Interview 150", "Grind 169"], "Subtract node.val from targetSum and check leaf when both children are null."],
    ["Minimum Depth of Binary Tree", "minimum-depth-of-binary-tree", "First-Leaf BFS / DFS", "EASY", ["Amazon", "Meta"], ["Striver A2Z"], "Use BFS to return depth at the very first leaf node encountered."],
    ["Path Sum II", "path-sum-ii", "Root-to-Leaf Path Backtrack", "MEDIUM", ["Amazon", "Meta", "Google"], ["Grind 169"], "Maintain current path list during DFS and copy on matching leaf."],
    ["Sum Root to Leaf Numbers", "sum-root-to-leaf-numbers", "Preorder Digit Accumulation", "MEDIUM", ["Meta", "Amazon"], ["Top Interview 150"], "Pass running number cur = cur * 10 + node.val down to leaves."],
    ["Populating Next Right Pointers in Each Node", "populating-next-right-pointers-in-each-node", "O(1)-Space Level Link", "MEDIUM", ["Meta", "Amazon", "Microsoft"], ["Top Interview 150"], "Use already-linked parent.next pointers to wire child.next across each level."],
    ["Find Bottom Left Tree Value", "find-bottom-left-tree-value", "Right-to-Left Level BFS", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "Enqueue right child before left child in BFS; last popped node is bottom-left."],
    ["Step-By-Step Directions From a Binary Tree Node to Another", "step-by-step-directions-from-a-binary-tree-node-to-another", "LCA Path Prefix Trim", "MEDIUM", ["Google", "Meta"], ["NeetCode 150"], "Find root-to-start and root-to-dest paths, strip common prefix, map start to 'U'."],
    ["Distribute Coins in Binary Tree", "distribute-coins-in-binary-tree", "Post-Order Excess Flow", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Each subtree transfers |leftExcess| + |rightExcess| coins across its edges."],
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
    ["Minimum Absolute Difference in BST", "minimum-absolute-difference-in-bst", "Inorder Predecessor Diff", "EASY", ["Google", "Amazon"], ["Top Interview 150"], "Track prev node in sorted inorder traversal and minimize curr.val - prev.val."],
    ["Balance a Binary Search Tree", "balance-a-binary-search-tree", "Inorder Array + Midpoint Build", "MEDIUM", ["Meta", "Amazon"], ["Love Babbar 450"], "Collect sorted values via inorder DFS, then build height-balanced BST."],
    ["Trim a Binary Search Tree", "trim-a-binary-search-tree", "Range-Pruned BST Recursion", "MEDIUM", ["Amazon", "Microsoft"], ["Love Babbar 450"], "If val < low return trim(right); if val > high return trim(left)."],
    ["All Elements in Two Binary Search Trees", "all-elements-in-two-binary-search-trees", "Dual Iterative Inorder Merge", "MEDIUM", ["Meta", "Amazon"], ["Striver A2Z"], "Merge two BST inorder stacks on the fly in O(n + m) time."],
    ["Range Sum of BST", "range-sum-of-bst", "BST Range-Pruned DFS", "EASY", ["Meta", "Amazon", "Google"], ["Grind 169"], "Prune left branch when node.val <= low and right branch when node.val >= high."],
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
    ["Implement Magic Dictionary", "implement-magic-dictionary", "Single-Mismatch Trie DFS", "MEDIUM", ["Google", "Amazon"], ["Love Babbar 450"], "Walk Trie allowing exactly one character mismatch before reaching end."],
    ["Short Encoding of Words", "short-encoding-of-words", "Reversed Suffix Trie Leaves", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Insert reversed words into Trie; sum (depth + 1) for every leaf node."],
    ["Camelcase Matching", "camelcase-matching", "Uppercase-Sensitive Subsequence", "MEDIUM", ["Google", "Meta"], ["Top Interview 150"], "Match pattern as subsequence while rejecting unmatched uppercase letters."],
    ["Palindrome Pairs", "palindrome-pairs", "Reversed-Word Trie + Palindrome Suffix", "HARD", ["Airbnb", "Google", "Meta"], ["Grind 169"], "Split each word at k; if left is palindrome, look up reversed right."],
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
    ["Relative Ranks", "relative-ranks", "Sorted Index / Max-Heap Rank", "EASY", ["Google", "Amazon"], ["Love Babbar 450"], "Sort (score, idx) descending and assign medals to top 3."],
    ["Furthest Building You Can Reach", "furthest-building-you-can-reach", "Min-Heap of Ladder Climbs", "MEDIUM", ["Google", "Microsoft", "Amazon"], ["Striver A2Z"], "Use ladders for largest diffs; swap smallest diff to bricks when ladders full."],
    ["Single-Threaded CPU", "single-threaded-cpu", "Sort Enqueue + Min-Heap(Time, Idx)", "MEDIUM", ["Google", "Meta"], ["NeetCode 150"], "Push all tasks with enqueueTime <= curTime into (procTime, idx) min-heap."],
    ["Process Tasks Using Servers", "process-tasks-using-servers", "Free & Busy Min-Heaps", "MEDIUM", ["Google", "Amazon"], ["NeetCode 150"], "Keep (weight, idx) free heap and (freeTime, weight, idx) busy heap."],
    ["Meeting Rooms III", "meeting-rooms-iii", "Unused & Busy Room Heaps", "HARD", ["Google", "Uber", "Meta"], ["Grind 169"], "Assign lowest-index free room or delay meeting to earliest finishing room."],
    ["Seat Reservation Manager", "seat-reservation-manager", "Min-Heap / Marker Seat Pool", "MEDIUM", ["Amazon", "Google"], ["NeetCode 150"], "Pop smallest available seat from min-heap and push back on unreserve."],
    ["Maximum Subsequence Score", "maximum-subsequence-score", "Sort nums2 Desc + Size-K Min-Heap", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Sort pairs by nums2 descending and maintain top-k nums1 sum in a min-heap."],
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
    ["Binary Watch", "binary-watch", "Bit-Count Enumeration", "EASY", ["Google", "Apple"], ["Love Babbar 450"], "Enumerate (h, m) and keep pairs where popcount(h) + popcount(m) == turnedOn."],
    ["Restore IP Addresses", "restore-ip-addresses", "4-Segment Backtrack (0..255)", "MEDIUM", ["Amazon", "Meta", "Microsoft"], ["Striver A2Z", "Love Babbar 450"], "Split string into 4 parts of length 1..3 without leading zeros <= 255."],
    ["Partition to K Equal Sum Subsets", "partition-to-k-equal-sum-subsets", "Bucket Backtrack + Prune", "MEDIUM", ["LinkedIn", "Amazon", "Google"], ["NeetCode 150", "Love Babbar 450"], "Sort descending and assign each number to one of k target/k buckets."],
    ["Expression Add Operators", "expression-add-operators", "DFS with Prev Operand for '*'", "HARD", ["Meta", "Google"], ["Striver A2Z"], "Track prevTerm so '*' undoes +prevTerm and applies prevTerm * cur."],
    ["Word Break II", "word-break-ii", "Memoized Sentence Backtrack", "HARD", ["Meta", "Amazon", "Google"], ["Striver A2Z", "Love Babbar 450"], "Memoize all valid sentence suffixes from each start index."],
    ["Combinations", "combinations", "Bounded Choose-K Backtrack", "MEDIUM", ["Amazon", "Google", "Meta"], ["NeetCode 150", "Top Interview 150"], "Pick i from start..n - (k - cur.length) + 1 to prune insufficient tails."],
    ["Beautiful Arrangement", "beautiful-arrangement", "Divisibility Used-Flag DFS", "MEDIUM", ["Google", "Microsoft"], ["Love Babbar 450"], "Place numbers 1..n at index pos only if num % pos == 0 or pos % num == 0."],
    ["Split a String Into the Max Number of Unique Substrings", "split-a-string-into-the-max-number-of-unique-substrings", "HashSet Cut Backtracking", "MEDIUM", ["Google", "Amazon"], ["NeetCode 150"], "Try all end indices; only branch if substring is not yet in used Set."],
    ["Matchsticks to Square", "matchsticks-to-square", "4-Side Descending Backtrack", "MEDIUM", ["Amazon", "Meta"], ["NeetCode 150"], "Sort descending and assign each stick to one of 4 sides <= total / 4."],
    ["N-Queens II", "n-queens-ii", "Col & Diagonal Bitmask Count", "HARD", ["Amazon", "Google"], ["Top Interview 150"], "Count valid N-Queens placements using col, diag1, and diag2 bitsets."],
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
    ["Find if Path Exists in Graph", "find-if-path-exists-in-graph", "Basic Graph BFS/DFS/DSU", "EASY", ["Google", "Amazon"], ["Striver A2Z"], "Run BFS/DFS or Union-Find from source and check if destination is reached."],
    ["Number of Enclaves", "number-of-enclaves", "Boundary Flood-Fill Sink", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Sink all '1's connected to matrix borders, then count remaining '1's."],
    ["Open the Lock", "open-the-lock", "4-Wheel State-Space BFS", "MEDIUM", ["Google", "Amazon", "Meta"], ["NeetCode 150"], "Treat 4-digit states as graph nodes with 8 +/-1 transitions avoiding deadends."],
    ["Minimum Genetic Mutation", "minimum-genetic-mutation", "8-Char Gene BFS", "MEDIUM", ["Google", "Twitter"], ["Top Interview 150"], "Try A/C/G/T mutations at each of 8 positions in shortest-path BFS."],
    ["Keys and Rooms", "keys-and-rooms", "Reachability DFS/BFS", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "Start at room 0, visit unlocked rooms, and check visited.size == n."],
    ["Find the Town Judge", "find-the-town-judge", "In-Degree Minus Out-Degree", "EASY", ["Amazon", "Google"], ["Striver A2Z"], "Town judge has net trust score (inDegree - outDegree) equal to n - 1."],
    ["All Paths From Source to Target", "all-paths-from-source-to-target", "DAG Path Backtracking", "MEDIUM", ["Amazon", "Meta", "Google"], ["Striver A2Z"], "DFS from node 0 appending path copies whenever node == n - 1."],
    ["Evaluate Division", "evaluate-division", "Weighted Ratio Graph BFS/DFS", "MEDIUM", ["Google", "Meta", "Amazon"], ["Top Interview 150", "Grind 169"], "Build bidirectional graph with weights val and 1/val, then multiply along query path."],
    ["Reorder Routes to Make All Paths Lead to the City Zero", "reorder-routes-to-make-all-paths-lead-to-the-city-zero", "Directed-Edge Flip Count DFS", "MEDIUM", ["Amazon", "Microsoft"], ["NeetCode 150"], "Traverse undirected neighbors from 0 and count edges pointing away from 0."],
    ["Detonate the Maximum Bombs", "detonate-the-maximum-bombs", "Directed Radius Reachability DFS", "MEDIUM", ["Google", "Uber"], ["Striver A2Z"], "Add directed edge i -> j if dist^2 <= r_i^2, then run DFS from each bomb."],
    ["Shortest Bridge", "shortest-bridge", "DFS Island + Multi-Source BFS", "MEDIUM", ["Google", "Meta", "Amazon"], ["NeetCode 150"], "Sink first island via DFS into queue, then expand BFS until hitting second island."],
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
    ["Number of Ways to Arrive at Destination", "number-of-ways-to-arrive-at-destination", "Dijkstra + Shortest Path DP", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "On shorter dist reset ways[v] = ways[u]; on equal dist add ways[v] += ways[u]."],
    ["Satisfiability of Equality Equations", "satisfiability-of-equality-equations", "Two-Pass Union-Find", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Union all '==' pairs first, then check every '!=' pair has different roots."],
    ["Critical Connections in a Network", "critical-connections-in-a-network", "Tarjan's Bridges (tin/low)", "HARD", ["Amazon", "Meta", "Google"], ["Striver A2Z", "Love Babbar 450"], "Edge (u, v) is a bridge iff low[v] > tin[u] during DFS."],
    ["Reconstruct Itinerary", "reconstruct-itinerary", "Hierholzer's Eulerian Path", "HARD", ["Meta", "Google", "Uber"], ["NeetCode 150"], "Sort outgoing edges lexically and post-order append nodes in DFS."],
    ["Minimum Height Trees", "minimum-height-trees", "Topological Leaf Peeling", "MEDIUM", ["Google", "Amazon", "Meta"], ["Grind 169"], "Peel degree-1 leaves layer-by-layer until <= 2 centroid nodes remain."],
    ["Time Needed to Inform All Employees", "time-needed-to-inform-all-employees", "Tree Top-Down Max Time DFS", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Accumulate informTime[u] down manager-to-subordinate tree and take max."],
    ["Parallel Courses III", "parallel-courses-iii", "DAG Longest-Path Topo DP", "HARD", ["Google", "Meta"], ["Striver A2Z"], "Run Kahn's topological sort updating dist[v] = max(dist[v], dist[u] + time[v])."],
    ["Bus Routes", "bus-routes", "Stop-to-Route Bipartite BFS", "HARD", ["Google", "Uber", "Meta"], ["Grind 169"], "Map each stop to route IDs; BFS by bus routes visited to minimize transfers."],
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
    ["Integer Break", "integer-break", "Product Split DP / Math", "MEDIUM", ["Amazon", "Google"], ["NeetCode 150"], "dp[i] = max over j of max(j, dp[j]) * max(i - j, dp[i - j])."],
    ["Number of Longest Increasing Subsequence", "number-of-longest-increasing-subsequence", "LIS Length + Count Arrays", "MEDIUM", ["Google", "Amazon", "Meta"], ["Striver A2Z"], "Track both len[i] and cnt[i]; add cnt[j] whenever len[j] + 1 == len[i]."],
    ["Delete and Earn", "delete-and-earn", "Bucketed House Robber DP", "MEDIUM", ["Amazon", "Goldman Sachs"], ["Striver A2Z"], "Aggregate points per value into points[v], then run House Robber DP."],
    ["Minimum Cost For Tickets", "minimum-cost-for-tickets", "1/7/30-Day Travel DP", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "At travel day d, take min(dp[d-1]+c0, dp[d-7]+c1, dp[d-30]+c2)."],
    ["Russian Doll Envelopes", "russian-doll-envelopes", "Sort (w asc, h desc) + LIS", "HARD", ["Google", "Microsoft"], ["Striver A2Z", "Love Babbar 450"], "Sort width ascending, height descending to prevent equal-width nesting, then LIS on h."],
    ["Fibonacci Number", "fibonacci-number", "O(1) Rolling Recurrence", "EASY", ["Amazon", "Microsoft", "Apple"], ["Striver A2Z"], "Advance a, b = b, a + b in O(n) time and O(1) space."],
    ["N-th Tribonacci Number", "n-th-tribonacci-number", "3-Variable Rolling DP", "EASY", ["Amazon", "Google"], ["NeetCode 150"], "Maintain t0, t1, t2 and roll t3 = t0 + t1 + t2."],
    ["Divisor Game", "divisor-game", "Parity Game Theory DP", "EASY", ["Google", "Amazon"], ["Apna College"], "Alice wins iff N is even (since odd - odd divisor = even)."],
    ["Is Subsequence", "is-subsequence", "Two-Pointer / Follow-Up DP", "EASY", ["Amazon", "Google", "Meta"], ["Top Interview 150", "NeetCode 150"], "Advance s pointer only on char match with t; true iff sIdx == s.length."],
    ["Maximum Repeating Substring", "maximum-repeating-substring", "K-Concatenation / Suffix DP", "EASY", ["Google", "Amazon"], ["Striver A2Z"], "Check dp[i] = dp[i - m] + 1 wherever sequence matches word ending at i."],
    ["Unique Binary Search Trees", "unique-binary-search-trees", "Catalan Number 1D DP", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z", "Apna College"], "G[n] = sum_{i=1..n} G[i - 1] * G[n - i] choosing each i as root."],
    ["Knight Dialer", "knight-dialer", "10-State Transition DP", "MEDIUM", ["Google", "Meta", "Amazon"], ["Grind 169"], "Sum previous counts from valid knight-jump neighbor digits mod 1e9+7."],
    ["Champagne Tower", "champagne-tower", "Row-by-Row Overflow Flow", "MEDIUM", ["Google", "Amazon"], ["NeetCode 150"], "Split excess (flow[r][c] - 1) / 2 equally into (r+1, c) and (r+1, c+1)."],
    ["Frog Jump", "frog-jump", "Position -> Jump-Set DP", "HARD", ["Meta", "Amazon", "Google"], ["Striver A2Z"], "Map each stone position to reachable jump sizes k-1, k, k+1."],
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
    ["Unique Paths II", "unique-paths-ii", "Obstacle Grid Path DP", "MEDIUM", ["Amazon", "Google", "Meta"], ["Top Interview 150", "Striver A2Z"], "Zero out dp[r][c] on obstacle cells; otherwise sum top and left cells."],
    ["Triangle", "triangle", "Bottom-Up Min Path DP", "MEDIUM", ["Amazon", "Google"], ["Top Interview 150", "Striver A2Z"], "Collapse triangle from bottom row up: dp[c] = row[c] + min(dp[c], dp[c+1])."],
    ["Longest Palindromic Subsequence", "longest-palindromic-subsequence", "LCS(s, rev(s)) / Range DP", "MEDIUM", ["Amazon", "Google", "Meta"], ["Striver A2Z", "Love Babbar 450"], "Compute LCS of s with its reverse, or expand range dp[i][j] on endpoints."],
    ["Minimum Insertion Steps to Make a String Palindrome", "minimum-insertion-steps-to-make-a-string-palindrome", "Length Minus LPS", "HARD", ["Amazon", "Google"], ["Striver A2Z"], "Minimum insertions equals n - LPS(s), leaving longest palindromic subsequence intact."],
    ["Shortest Common Supersequence", "shortest-common-supersequence", "LCS Backtrack Reconstruction", "HARD", ["Google", "Amazon"], ["Striver A2Z"], "Build 2D LCS table then walk backwards emitting common chars once and both mismatches."],
    ["Best Time to Buy and Sell Stock III", "best-time-to-buy-and-sell-stock-iii", "At-Most-2-Tx State DP", "HARD", ["Amazon", "Google", "Microsoft"], ["Top Interview 150", "Striver A2Z"], "Track buy1, sell1, buy2, sell2 states across prices in O(n) time and O(1) space."],
    ["Stone Game", "stone-game", "Interval Minimax DP", "MEDIUM", ["Google", "Amazon"], ["NeetCode 150"], "dp[l][r] = max(piles[l] - dp[l+1][r], piles[r] - dp[l][r-1]) (or first player always wins)."],
    ["Stone Game II", "stone-game-ii", "Suffix Sum + M-Bound Minimax", "MEDIUM", ["Google", "Meta"], ["NeetCode 150"], "dp[i][M] = suffix[i] - min_{1<=x<=2M} dp[i + x][max(M, x)]."],
    ["Best Time to Buy and Sell Stock with Transaction Fee", "best-time-to-buy-and-sell-stock-with-transaction-fee", "Hold / Cash State Machine", "MEDIUM", ["Meta", "Amazon", "Google"], ["Striver A2Z"], "Track cash and hold states subtracting fee when selling."],
    ["Minimum Falling Path Sum", "minimum-falling-path-sum", "3-Neighbor Row Transition", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "dp[r][c] = matrix[r][c] + min(dp[r-1][c-1], dp[r-1][c], dp[r-1][c+1])."],
    ["Ones and Zeroes", "ones-and-zeroes", "2-Constraint 0/1 Knapsack", "MEDIUM", ["Google", "Amazon"], ["NeetCode 150"], "Iterate zero and one capacities backward to pack max strings within (m, n)."],
    ["Last Stone Weight II", "last-stone-weight-ii", "Min Subset Difference Knapsack", "MEDIUM", ["Google", "Amazon"], ["NeetCode 150"], "Maximize subset sum <= total / 2; answer is total - 2 * best."],
    ["Delete Operation for Two Strings", "delete-operation-for-two-strings", "m + n - 2 * LCS", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Minimum deletions equals len(w1) + len(w2) - 2 * LCS(w1, w2)."],
    ["Longest String Chain", "longest-string-chain", "Sort by Length + Predecessor DP", "MEDIUM", ["Google", "Amazon", "Meta"], ["Striver A2Z"], "Sort words by length and check deleting 1 char in dp HashMap."],
    ["Best Time to Buy and Sell Stock IV", "best-time-to-buy-and-sell-stock-iv", "K-Transaction State DP", "HARD", ["Google", "Amazon", "Meta"], ["Top Interview 150", "Striver A2Z"], "Maintain buy[t] and sell[t] for t = 1..k (or greedy if k >= n/2)."],
    ["Cherry Pickup", "cherry-pickup", "2-Person Synced Grid DP", "HARD", ["Google", "Uber"], ["Striver A2Z"], "Walk two robots simultaneously from (0,0) with step t = r1+c1 = r2+c2."],
    ["Cherry Pickup II", "cherry-pickup-ii", "3D Row + (c1, c2) DP", "HARD", ["Google", "Amazon"], ["Striver A2Z"], "Advance both robots down each row across 3x3 column transitions."],
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
    ["Maximum Units on a Truck", "maximum-units-on-a-truck", "Fractional Box-Unit Greedy", "EASY", ["Amazon", "Flipkart"], ["Striver A2Z"], "Sort box types by unitsPerBox descending and greedily load until truckSize is full."],
    ["Minimum Add to Make Parentheses Valid", "minimum-add-to-make-parentheses-valid", "Open/Unmatched Balance", "MEDIUM", ["Meta", "Amazon"], ["Striver A2Z"], "Track unmatched ')' when open == 0 plus remaining unclosed '(' at the end."],
    ["Broken Calculator", "broken-calculator", "Reverse Target Greedy", "MEDIUM", ["Google", "Amazon"], ["Striver A2Z"], "Work backwards from target to startValue: halve if even, else increment."],
    ["Patching Array", "patching-array", "Reachable Prefix Doubling", "HARD", ["Google", "Amazon"], ["Love Babbar 450"], "Track covered range [1, miss); if nums[i] > miss, patch with miss and double miss."],
    ["Maximum 69 Number", "maximum-69-number", "First-6-to-9 Greedy Flip", "EASY", ["Amazon", "Google"], ["Striver A2Z"], "Replace the leftmost '6' digit with '9' for maximum gain."],
    ["Minimum Deletions to Make Character Frequencies Unique", "minimum-deletions-to-make-character-frequencies-unique", "Used-Frequency Set Decrement", "MEDIUM", ["Microsoft", "Amazon"], ["Striver A2Z"], "Decrement each char frequency until it is not in usedFreqs Set."],
    ["Optimal Partition of String", "optimal-partition-of-string", "Greedy Seen-Char Reset", "MEDIUM", ["Amazon", "Microsoft"], ["NeetCode 150"], "Track seen chars in current substring; cut and clear bitmask on repeat."],
    ["Eliminate Maximum Number of Monsters", "eliminate-maximum-number-of-monsters", "Sort Arrival Time Greedy", "MEDIUM", ["Google", "Meta"], ["NeetCode 150"], "Sort monsters by arrival time dist[i] / speed[i] and shoot one per minute."],
    ["Minimum Number of Taps to Open to Water a Garden", "minimum-number-of-taps-to-open-to-water-a-garden", "Jump Game II Interval Cover", "HARD", ["Google", "Amazon"], ["Striver A2Z"], "Convert tap ranges to maxReach[left] = right and run Jump Game II greedy."],
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
    ["Determine if Two Events Have Conflict", "determine-if-two-events-have-conflict", "String Interval Overlap", "EASY", ["Amazon", "Google"], ["Striver A2Z"], "Two HH:MM intervals overlap iff event1[0] <= event2[1] && event2[0] <= event1[1]."],
    ["Divide Intervals Into Minimum Number of Groups", "divide-intervals-into-minimum-number-of-groups", "Max Concurrent Sweep Line", "MEDIUM", ["Amazon", "Meta"], ["NeetCode 150"], "Minimum groups equals maximum simultaneous overlapping intervals via min-heap or sweep."],
    ["Remove Covered Intervals", "remove-covered-intervals", "Sort (start asc, end desc)", "MEDIUM", ["Amazon", "Google"], ["Striver A2Z"], "Sort by start asc, end desc; an interval is covered iff curr.end <= maxEnd."],
    ["Data Stream as Disjoint Intervals", "data-stream-as-disjoint-intervals", "TreeMap / Ordered Interval Merge", "HARD", ["Google", "Meta"], ["Striver A2Z"], "Maintain disjoint intervals by start key and merge left/right neighbors on addNum."],
    ["Maximum Number of Events That Can Be Attended", "maximum-number-of-events-that-can-be-attended", "Day-by-Day Earliest-End Min-Heap", "MEDIUM", ["Amazon", "Google", "Meta"], ["Striver A2Z"], "Sort events by start day; each day push starting events to min-heap and attend earliest-ending."],
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
    ["Excel Sheet Column Number", "excel-sheet-column-number", "Base-26 Positional Accumulation", "EASY", ["Microsoft", "Amazon", "Meta"], ["Top Interview 150"], "Accumulate ans = ans * 26 + (ch - 'A' + 1) left to right."],
    ["Single Number II", "single-number-ii", "Bit-Count Modulo 3", "MEDIUM", ["Amazon", "Google"], ["Top Interview 150", "Striver A2Z"], "Count set bits at each of 32 positions mod 3, or use ones/twos bitmask states."],
    ["Bitwise AND of Numbers Range", "bitwise-and-of-numbers-range", "Common Binary Prefix Shift", "MEDIUM", ["Amazon", "Meta"], ["Top Interview 150", "Striver A2Z"], "Right-shift both m and n until equal to find their common binary prefix, then shift back."],
    ["Count Primes", "count-primes", "Sieve of Eratosthenes", "MEDIUM", ["Amazon", "Microsoft", "Google"], ["Striver A2Z", "Love Babbar 450"], "Mark multiples of each prime p starting from p * p up to n - 1."],
  ]),
];

const DIFFICULTY_RANK: Record<DsaSheetProblemItem["difficulty"], number> = {
  EASY: 0,
  MEDIUM: 1,
  HARD: 2,
};

const SORTED_RAW_ITEMS: Array<Omit<DsaSheetProblemItem, "order">> =
  DSA_SHEET_CATEGORIES.flatMap((cat) =>
    RAW_ITEMS.filter((item) => item.category === cat).sort(
      (a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]
    )
  );

export const DSA_SHEET_PROBLEMS: DsaSheetProblemItem[] = SORTED_RAW_ITEMS.map(
  (item, idx) => ({
    order: idx + 1,
    ...item,
  })
);
