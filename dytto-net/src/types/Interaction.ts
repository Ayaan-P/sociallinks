// Represents the data structure for an interaction log,
// matching the response from the backend POST /interactions endpoint.
export interface Interaction {
  id: number; // Backend provides a numeric ID
  relationship_id: number; // Backend provides a numeric ID
  created_at: string; // ISO date string
  interaction_log: string;
  tone_tag?: string; // User-provided tag

  // AI-generated fields from backend
  sentiment_analysis?: string;
  xp_gain?: number; // XP points awarded (1-3)
  suggested_tone?: string; // AI-suggested tone tag (often same as sentiment_analysis)
  evolution_suggestion?: string | null; // Name of *new* category suggested by AI (e.g., "Friend") or null
  ai_reasoning?: string; // Explanation for XP score
  patterns?: string | null; // Detected recurring patterns in this log or null
  interaction_suggestion?: string; // Suggestion for next interaction
  processing_error?: string; // Optional: Included if AI/Leveling/Evolution update failed internally
  is_milestone?: boolean; // From DB schema, might be added later
  updated_at?: string; // From DB schema, might be added later
}

// Type for creating a new interaction log (matches POST /interactions request body)
export interface CreateInteractionPayload {
    relationship_id: number;
    interaction_log: string;
    tone_tag?: string;
}
