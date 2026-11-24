import { describe, it, expect } from "vitest";
import {
  calculatePreparationStreak,
  toUtcDateString,
  diffDays,
} from "../../src/modules/dashboard/streak.calculator.js";
import { QUOTA_LIMITS } from "../../src/modules/usage/quota.config.js";

describe("Preparation Streak Calculator Unit Tests (Phase J)", () => {
  const refDate = new Date("2026-11-24T12:00:00.000Z"); // Today: 2026-11-24

  it("1. returns zeroes and null for empty activity history", () => {
    const result = calculatePreparationStreak([], refDate);

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.totalActiveDays).toBe(0);
    expect(result.lastActiveDate).toBeNull();
    expect(result.activityMatrix).toEqual([]);
  });

  it("2. collapses multiple activities on the same calendar day into 1 active day", () => {
    const dates = [
      new Date("2026-11-24T02:00:00.000Z"),
      new Date("2026-11-24T10:30:00.000Z"),
      new Date("2026-11-24T18:45:00.000Z"),
    ];

    const result = calculatePreparationStreak(dates, refDate);

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.totalActiveDays).toBe(1);
    expect(result.lastActiveDate).toBe("2026-11-24");
    expect(result.activityMatrix).toHaveLength(1);
    expect(result.activityMatrix[0]).toEqual({ date: "2026-11-24", count: 3 });
  });

  it("3. preserves active streak when last activity was today", () => {
    const dates = [
      new Date("2026-11-22T08:00:00.000Z"),
      new Date("2026-11-23T14:00:00.000Z"),
      new Date("2026-11-24T09:00:00.000Z"),
    ];

    const result = calculatePreparationStreak(dates, refDate);

    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.totalActiveDays).toBe(3);
    expect(result.lastActiveDate).toBe("2026-11-24");
  });

  it("4. preserves active streak when user practiced yesterday but not yet today (grace period)", () => {
    const dates = [
      new Date("2026-11-21T08:00:00.000Z"),
      new Date("2026-11-22T12:00:00.000Z"),
      new Date("2026-11-23T16:00:00.000Z"),
    ];

    // Reference date is 2026-11-24, user last practiced on 2026-11-23 (yesterday)
    const result = calculatePreparationStreak(dates, refDate);

    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.totalActiveDays).toBe(3);
    expect(result.lastActiveDate).toBe("2026-11-23");
  });

  it("5. resets current streak to 0 when last activity was 2 or more days ago (broken streak)", () => {
    const dates = [
      new Date("2026-11-19T08:00:00.000Z"),
      new Date("2026-11-20T12:00:00.000Z"),
      new Date("2026-11-21T16:00:00.000Z"),
      new Date("2026-11-22T10:00:00.000Z"),
    ];

    // Reference date is 2026-11-24, last active was 2026-11-22 (2 days ago)
    const result = calculatePreparationStreak(dates, refDate);

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(4); // Longest streak preserved
    expect(result.totalActiveDays).toBe(4);
    expect(result.lastActiveDate).toBe("2026-11-22");
  });

  it("6. correctly identifies longest streak when an older streak exceeds the current streak", () => {
    const dates = [
      // Old streak of 5 continuous days
      new Date("2026-11-01T10:00:00.000Z"),
      new Date("2026-11-02T10:00:00.000Z"),
      new Date("2026-11-03T10:00:00.000Z"),
      new Date("2026-11-04T10:00:00.000Z"),
      new Date("2026-11-05T10:00:00.000Z"),
      // Gap
      // New streak of 2 days
      new Date("2026-11-23T10:00:00.000Z"),
      new Date("2026-11-24T10:00:00.000Z"),
    ];

    const result = calculatePreparationStreak(dates, refDate);

    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(5);
    expect(result.totalActiveDays).toBe(7);
  });

  it("7. correctly computes diffDays and toUtcDateString helpers", () => {
    expect(toUtcDateString(new Date("2026-11-24T23:59:59.999Z"))).toBe("2026-11-24");
    expect(diffDays("2026-11-24", "2026-11-23")).toBe(1);
    expect(diffDays("2026-11-24", "2026-11-20")).toBe(4);
    expect(diffDays("2026-11-20", "2026-11-24")).toBe(-4);
  });

  it("8. enforces exact Free vs Pro tier quota limits according to SAAS_BUSINESS_MODEL.md", () => {
    expect(QUOTA_LIMITS.FREE).toEqual({
      resumes: 3,
      jobDescriptions: 5,
      questionSetsMonthly: 5,
      maxQuestionsPerSet: 15,
      answersMonthly: 20,
    });

    expect(QUOTA_LIMITS.PRO).toEqual({
      resumes: 10,
      jobDescriptions: 50,
      questionSetsMonthly: 50,
      maxQuestionsPerSet: 25,
      answersMonthly: null, // Unlimited
    });
  });
});
