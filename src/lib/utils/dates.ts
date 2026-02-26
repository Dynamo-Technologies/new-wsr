import {
  format,
  addDays,
  nextFriday,
  isFriday,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  parseISO,
  isValid,
  differenceInWeeks
} from 'date-fns';

/**
 * Returns the upcoming Friday (or today if today is Friday)
 */
export function getUpcomingFriday(from: Date = new Date()): Date {
  if (isFriday(from)) return from;
  return nextFriday(from);
}

/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateStr: string, fmt = 'MMM d, yyyy'): string {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(d)) return 'Invalid date';
    return format(d, fmt);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format a date to YYYY-MM-DD for form inputs
 */
export function toInputDate(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get week label for a week-ending date
 */
export function getWeekLabel(weekEnding: string): string {
  try {
    const end = parseISO(weekEnding);
    const start = addDays(end, -6);
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  } catch {
    return weekEnding;
  }
}

/**
 * Get the quarter string (e.g. "Q4 2024") for a given date
 */
export function getQuarterLabel(date: Date = new Date()): string {
  const q = Math.ceil((date.getMonth() + 1) / 3);
  return `Q${q} ${date.getFullYear()}`;
}

/**
 * Get start/end dates for a quarter string like "Q4 2024"
 */
export function parseQuarterDates(quarter: string): { start: string; end: string } | null {
  const match = quarter.match(/^Q(\d)\s+(\d{4})$/);
  if (!match) return null;
  const q = parseInt(match[1]);
  const year = parseInt(match[2]);
  const monthStart = (q - 1) * 3;
  const start = new Date(year, monthStart, 1);
  const end = endOfQuarter(start);
  return {
    start: toInputDate(start),
    end: toInputDate(end)
  };
}

/**
 * Get all quarters available (last 8 quarters)
 */
export function getRecentQuarters(count = 8): string[] {
  const quarters: string[] = [];
  let date = new Date();
  for (let i = 0; i < count; i++) {
    quarters.push(getQuarterLabel(date));
    date = new Date(date.getFullYear(), date.getMonth() - 3, 1);
  }
  return quarters;
}

/**
 * Get list of last N months as { label, value } objects
 */
export function getRecentMonths(count = 12): Array<{ label: string; value: string }> {
  const months: Array<{ label: string; value: string }> = [];
  let date = new Date();
  for (let i = 0; i < count; i++) {
    months.push({
      label: format(date, 'MMMM yyyy'),
      value: toInputDate(startOfMonth(date))
    });
    date = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  }
  return months;
}

/**
 * Returns the start and end of the month for a given date string (YYYY-MM-DD)
 */
export function getMonthRange(monthStr: string): { start: string; end: string } {
  const d = parseISO(monthStr);
  return {
    start: toInputDate(startOfMonth(d)),
    end: toInputDate(endOfMonth(d))
  };
}

/**
 * Returns relative time label ("Today", "3 days ago", etc.)
 */
export function getRelativeTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    const weeks = differenceInWeeks(now, date);
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}
