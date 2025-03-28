export interface Relationship {
  id: string; // Assuming the backend provides a unique ID
  name: string;
  photo?: string; // Optional photo URL
  level: number; // Level 1-10
  xp?: number; // Experience points towards next level
  lastInteraction: string; // ISO date string or similar format
  categories: string[]; // Array of category names (e.g., ["Friend", "Business"])
  reminderInterval?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom' | string; // Reminder frequency
  importance?: 'High' | 'Medium' | 'Low'; // Optional importance tag
  // photo?: string; // Optional photo URL - Removed duplicate

  // Frontend calculated/derived fields (optional)
  daysSinceLastInteraction?: number;
  isOverdue?: boolean; // Calculated based on lastInteraction and reminderInterval
}
