import { Interaction } from './Interaction'; // Assuming Interaction type exists

// Core Relationship data structure matching the backend API response
export interface Relationship {
  id: number; // Backend provides a numeric ID
  name: string;
  relationship_type: string;
  reminder_interval: string;
  categories: string[]; // Array of category names from backend
  photo_url?: string;
  tags?: string[]; // Note: Tags might move to junction table later
  level: number; // Level 1-10 provided by backend
  xp: number; // Total XP provided by backend
  created_at?: string; // Provided by backend
  updated_at?: string; // Provided by backend
}

// Type for data needed on the dashboard card (matches GET /dashboard_data response item)
export interface RelationshipDashboardItem {
  id: number;
  name: string;
  photo_url?: string;
  level: number;
  days_since_interaction: number | "Never";
  categories: string[]; // Array of category names
  tags?: string[]; // Note: Tags might move to junction table later
}

// Type for data needed on the profile overview (matches GET /relationships/{id}/overview response)
export interface RelationshipOverview {
  photo_url?: string;
  name: string;
  level: number;
  reminder_settings?: string; // Matches 'reminder_interval' in Relationship
  xp_bar: number; // XP progress percentage (0-100)
  xp_earned_in_level: number; // Raw XP in current level
  xp_needed_for_level: number; // XP needed to complete current level
  total_xp: number; // Total accumulated XP
  last_interaction?: Interaction | null; // Use Interaction type
  categories: string[]; // Array of category names
  relationship_tags?: string[]; // Kept for now, matches backend field name
}

// Type for creating a new relationship (matches POST /relationships request body)
export interface CreateRelationshipPayload {
    name: string;
    relationship_type: string;
    reminder_interval: string;
    initial_category_name: string; // Name of the first category
    photo_url?: string;
    tags?: string[];
}

// Type for updating a relationship (matches PUT /relationships/{id} request body)
export interface UpdateRelationshipPayload {
    name?: string;
    relationship_type?: string;
    reminder_interval?: string;
    photo_url?: string;
    tags?: string[];
    categories?: string[]; // Optional: Replaces ALL existing categories
}
