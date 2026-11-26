import type { CuratedCodingProblem } from "../coding.js";
import { ARRAYS_HASHING_PROBLEMS } from "./arraysHashing.js";
import { TWO_POINTERS_PROBLEMS } from "./twoPointers.js";
import { SLIDING_WINDOW_PROBLEMS } from "./slidingWindow.js";
import { BINARY_SEARCH_PROBLEMS } from "./binarySearch.js";
import { PREFIX_SUM_STRINGS_PROBLEMS } from "./prefixSumStrings.js";
import { TREES_PROBLEMS } from "./trees.js";
import { GRAPHS_PROBLEMS } from "./graphs.js";
import { LINKED_LIST_PROBLEMS } from "./linkedList.js";
import { HEAP_PROBLEMS } from "./heap.js";
import { TRIES_UNION_FIND_PROBLEMS } from "./triesUnionFind.js";
import { MATRIX_ADVANCED_GRAPHS_PROBLEMS } from "./matrixAdvancedGraphs.js";
import { DYNAMIC_PROGRAMMING_PROBLEMS } from "./dynamicProgramming.js";
import { STACK_MONOTONIC_PROBLEMS } from "./stackMonotonic.js";
import { BACKTRACKING_PROBLEMS } from "./backtracking.js";
import { GREEDY_INTERVALS_PROBLEMS } from "./greedyIntervals.js";
import { BIT_MATH_DESIGN_QUEUE_PROBLEMS } from "./bitMathDesignQueue.js";

export {
  ARRAYS_HASHING_PROBLEMS,
  TWO_POINTERS_PROBLEMS,
  SLIDING_WINDOW_PROBLEMS,
  BINARY_SEARCH_PROBLEMS,
  PREFIX_SUM_STRINGS_PROBLEMS,
  TREES_PROBLEMS,
  GRAPHS_PROBLEMS,
  LINKED_LIST_PROBLEMS,
  HEAP_PROBLEMS,
  TRIES_UNION_FIND_PROBLEMS,
  MATRIX_ADVANCED_GRAPHS_PROBLEMS,
  DYNAMIC_PROGRAMMING_PROBLEMS,
  STACK_MONOTONIC_PROBLEMS,
  BACKTRACKING_PROBLEMS,
  GREEDY_INTERVALS_PROBLEMS,
  BIT_MATH_DESIGN_QUEUE_PROBLEMS,
};

export * from "./helpers.js";

export const WAVE_1_CODING_PROBLEMS: CuratedCodingProblem[] = [
  ...ARRAYS_HASHING_PROBLEMS,
  ...TWO_POINTERS_PROBLEMS,
  ...SLIDING_WINDOW_PROBLEMS,
  ...BINARY_SEARCH_PROBLEMS,
  ...PREFIX_SUM_STRINGS_PROBLEMS,
];

export const WAVE_2_CODING_PROBLEMS: CuratedCodingProblem[] = [
  ...TREES_PROBLEMS,
  ...GRAPHS_PROBLEMS,
  ...LINKED_LIST_PROBLEMS,
  ...HEAP_PROBLEMS,
  ...TRIES_UNION_FIND_PROBLEMS,
  ...MATRIX_ADVANCED_GRAPHS_PROBLEMS,
];

export const WAVE_3_CODING_PROBLEMS: CuratedCodingProblem[] = [
  ...DYNAMIC_PROGRAMMING_PROBLEMS,
  ...STACK_MONOTONIC_PROBLEMS,
  ...BACKTRACKING_PROBLEMS,
  ...GREEDY_INTERVALS_PROBLEMS,
  ...BIT_MATH_DESIGN_QUEUE_PROBLEMS,
];

export const CODING_PROBLEMS: CuratedCodingProblem[] = [
  ...WAVE_1_CODING_PROBLEMS,
  ...WAVE_2_CODING_PROBLEMS,
  ...WAVE_3_CODING_PROBLEMS,
];

const PROBLEM_BY_SLUG = new Map<string, CuratedCodingProblem>(
  CODING_PROBLEMS.map((p) => [p.slug, p])
);

export function getCodingProblemBySlug(
  slug: string
): CuratedCodingProblem | undefined {
  return PROBLEM_BY_SLUG.get(slug);
}

export function getRunnableProblemSlugs(): string[] {
  return CODING_PROBLEMS.map((p) => p.slug);
}
