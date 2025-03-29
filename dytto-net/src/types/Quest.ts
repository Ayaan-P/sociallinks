export interface Quest {
  id: string | number;
  relationship_id: string | number;
  quest_description: string;
  quest_status: string; // e.g., "pending", "completed"
  created_at?: string; // ISO date string
}
