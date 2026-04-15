/**
 * Centralized date utilities for consistent timezone handling.
 *
 * All dates in this app are treated as LOCAL dates (user's timezone).
 * WHOOP API returns ISO timestamps in UTC which must be converted to
 * local calendar dates before storage/comparison.
 */

/**
 * Returns the local midnight (start of day) for a given date.
 * This ensures all date comparisons are timezone-consistent.
 */
export function toLocalMidnight(d: Date | string): Date {
  const date = typeof d === "string" ? new Date(d) : new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Returns start and end of today in local time.
 */
export function getTodayRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Returns local date string in YYYY-MM-DD format.
 * Use this instead of toDateString() or toISOString().split("T")[0]
 * which can give wrong dates due to UTC conversion.
 */
export function toLocalDateString(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns days between two dates (ignoring time).
 */
export function daysBetween(a: Date | string, b: Date | string): number {
  const dateA = toLocalMidnight(a);
  const dateB = toLocalMidnight(b);
  return Math.round(Math.abs(dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Returns a date N days ago from now at local midnight.
 */
export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the Monday of the week containing the given date.
 */
export function getWeekStart(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  date.setDate(date.getDate() + diff);
  return date;
}

/**
 * Check if two dates are on the same local calendar day.
 */
export function isSameDay(a: Date | string, b: Date | string): boolean {
  return toLocalDateString(a) === toLocalDateString(b);
}
