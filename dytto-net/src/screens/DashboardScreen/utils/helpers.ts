/**
 * Helper functions for the Dashboard screen
 */

/**
 * Determines if a relationship is overdue for interaction based on days since last interaction and reminder interval
 * @param daysSince Number of days since last interaction or "Never"
 * @param interval Reminder interval (daily, weekly, biweekly, monthly)
 * @returns Boolean indicating if the relationship is overdue
 */
export const isOverdue = (daysSince: number | "Never", interval?: string): boolean => {
  if (daysSince === "Never" || !interval) return false;
  
  switch (interval) {
    case 'daily': return daysSince > 1;
    case 'weekly': return daysSince > 7;
    case 'biweekly': return daysSince > 14;
    case 'monthly': return daysSince > 30;
    // Add cases for other potential interval strings from backend if needed
    default: return false;
  }
};

/**
 * Formats days since last interaction in a user-friendly way
 * @param days Number of days since last interaction or "Never"
 * @returns Formatted string (e.g., "Today", "Yesterday", "3 days ago", "Never")
 */
export const formatDaysSince = (days: number | "Never"): string => {
  if (days === "Never") return 'Never';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};
