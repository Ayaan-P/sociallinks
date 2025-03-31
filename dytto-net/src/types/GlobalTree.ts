// Types for the Global Relationship Tree Visualization

/**
 * Represents a single branch on the Global Tree.
 * Each branch typically corresponds to a relationship category cluster.
 */
export interface GlobalBranch {
  id: string; // Unique identifier (e.g., category name like "Friend", "Work")
  category: string; // Name of the category
  color: string; // Color associated with this category
  totalLevelSum: number; // Aggregate level of all relationships in this category (influences thickness/length)
  relationshipCount: number; // Number of relationships in this category
  averageRecencyDays: number | null; // Average days since last interaction for this category (influences brightness)
  relationships: GlobalRelationshipNode[]; // Individual relationships within this branch
}

/**
 * Represents a single relationship node within a Global Branch.
 */
export interface GlobalRelationshipNode {
  id: number; // Relationship ID
  name: string;
  level: number; // Current level (influences size/position on branch)
  lastInteractionDays: number | null; // Days since last interaction (influences brightness/leaf status)
  isFading: boolean; // Calculated based on recency and reminder interval
  hasActiveQuest: boolean; // Indicates if there's an active quest (might add blossom)
}

/**
 * Represents a leaf on the Global Tree, signifying a memory or milestone.
 * Note: The spec is a bit ambiguous here. Leaves might be per-relationship or aggregated.
 * This structure assumes leaves are tied to specific relationships for potential tap interactions.
 */
export interface GlobalLeaf {
  id: number; // Interaction ID (milestone)
  relationshipId: number; // Which relationship this leaf belongs to
  summary: string; // Short summary of the memory
  date: string; // Date of the memory
}

/**
 * Represents a blossom on the Global Tree, signifying a completed quest or milestone.
 */
export interface GlobalBlossom {
  id: number; // Quest ID or other milestone identifier
  relationshipId: number; // Which relationship this blossom belongs to
  description: string; // e.g., "Completed 'Share a Belief' Quest"
  date: string; // Date completed
}

/**
 * Represents the overall data structure for the Global Tree visualization.
 */
export interface GlobalTreeData {
  userId: string; // Identifier for the user
  rootStrength: number; // Represents how grounded the user is (0-100)
  identityTags: string[]; // e.g., ["Emotional Support", "Professional Network"]
  branches: GlobalBranch[];
  // Optional aggregated leaves/blossoms if not tied to specific relationships
  // aggregatedLeaves?: GlobalLeaf[];
  // aggregatedBlossoms?: GlobalBlossom[];
  generatedAt: string; // Timestamp when the data was generated
}

// Placeholder for API response if needed, might be same as GlobalTreeData
export type GlobalTreeApiResponse = GlobalTreeData;
