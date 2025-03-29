export interface Interaction {
  id: string | number;
  relationship_id: string | number;
  created_at: string; // ISO date string
  interaction_log: string;
  tone_tag?: string;
  
  // AI-generated fields from backend
  sentiment_analysis?: string;
  xp_gain?: number;
  suggested_tone?: string;
  evolution_suggestion?: string;
  ai_reasoning?: string;
  patterns?: string;
  interaction_suggestion?: string;
}
