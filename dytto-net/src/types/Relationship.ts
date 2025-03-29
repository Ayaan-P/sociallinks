export interface Relationship {
  id: string | number; // Backend provides a numeric ID
  name: string;
  relationship_type: string;
  reminder_interval: string; // Renamed from reminderInterval to match backend
  category: string; // Single category from backend
  photo_url?: string; // Renamed from photo to match backend
  tags?: string[]; // Tags from backend (replaces categories array)
  level?: number; // Level 1-10 (may be calculated by frontend)
  xp?: number; // Experience points towards next level
  
  // Frontend calculated/derived fields (optional)
  lastInteraction?: string; // ISO date string from most recent interaction
  daysSinceLastInteraction?: number;
  isOverdue?: boolean; // Calculated based on lastInteraction and reminder_interval
  
  // For backward compatibility with existing frontend code
  categories?: string[]; // Derived from category and tags for UI display
  reminderInterval?: string; // Alias for reminder_interval
  photo?: string; // Alias for photo_url
}
