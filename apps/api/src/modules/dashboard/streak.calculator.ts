export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActiveDate: string | null;
  activityMatrix: Array<{ date: string; count: number }>;
}

/**
 * Normalizes a Date or date string to a UTC 'YYYY-MM-DD' calendar string.
 */
export function toUtcDateString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Computes calendar day difference between two YYYY-MM-DD strings (dateA - dateB in days).
 */
export function diffDays(dateStrA: string, dateStrB: string): number {
  const utcA = Date.UTC(
    Number(dateStrA.slice(0, 4)),
    Number(dateStrA.slice(5, 7)) - 1,
    Number(dateStrA.slice(8, 10))
  );
  const utcB = Date.UTC(
    Number(dateStrB.slice(0, 4)),
    Number(dateStrB.slice(5, 7)) - 1,
    Number(dateStrB.slice(8, 10))
  );
  return Math.round((utcA - utcB) / (1000 * 60 * 60 * 24));
}

/**
 * Pure, unit-testable calculator for candidate preparation streaks.
 * Handles duplicate activities on the same day, grace window for current day,
 * and tracks the longest continuous streak across all history.
 */
export function calculatePreparationStreak(
  activityDates: Date[],
  referenceDate: Date = new Date()
): StreakResult {
  if (!activityDates || activityDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      lastActiveDate: null,
      activityMatrix: [],
    };
  }

  // 1. Group and count activities by UTC date
  const countsByDate = new Map<string, number>();
  for (const date of activityDates) {
    const key = toUtcDateString(date);
    countsByDate.set(key, (countsByDate.get(key) || 0) + 1);
  }

  // 2. Sort unique dates in ascending order
  const uniqueDates = Array.from(countsByDate.keys()).sort();
  const totalActiveDays = uniqueDates.length;
  const lastActiveDate = uniqueDates[uniqueDates.length - 1];

  // 3. Compute activity matrix (sorted descending by date)
  const activityMatrix = Array.from(countsByDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date));

  // 4. Calculate longest streak across history
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDateStr: string | null = null;

  for (const dateStr of uniqueDates) {
    if (!prevDateStr) {
      runningStreak = 1;
    } else {
      const dayDiff = diffDays(dateStr, prevDateStr);
      if (dayDiff === 1) {
        runningStreak += 1;
      } else {
        runningStreak = 1;
      }
    }
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevDateStr = dateStr;
  }

  // 5. Calculate current streak based on referenceDate (today in UTC)
  const todayStr = toUtcDateString(referenceDate);
  const diffFromToday = diffDays(todayStr, lastActiveDate);

  let currentStreak = 0;

  // Active today (diff == 0) OR active yesterday (diff == 1, grace period for today)
  if (diffFromToday === 0 || diffFromToday === 1) {
    currentStreak = 1;
    // Walk backward from the last active date
    for (let i = uniqueDates.length - 1; i > 0; i--) {
      const currentDay = uniqueDates[i];
      const prevDay = uniqueDates[i - 1];
      if (diffDays(currentDay, prevDay) === 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  } else {
    // Gap >= 2 days, current streak is broken
    currentStreak = 0;
  }

  return {
    currentStreak,
    longestStreak,
    totalActiveDays,
    lastActiveDate,
    activityMatrix,
  };
}
