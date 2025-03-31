import axios from 'axios';
// Import specific types including payloads
import { Relationship, CreateRelationshipPayload, UpdateRelationshipPayload, RelationshipDashboardItem, RelationshipOverview } from '../types/Relationship';
import { Interaction, CreateInteractionPayload } from '../types/Interaction';
import { Quest } from '../types/Quest';
import { GlobalTreeData } from '../types/GlobalTree'; // Import Global Tree types

// Define the base URL for the API
export const API_BASE_URL = 'http://dytto-net-env.eba-hkgapfkb.ap-south-1.elasticbeanstalk.com/'; // Update this with your actual backend URL

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log(`[API] Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    console.log(`[API] Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout:', error.config.url);
    }
    return Promise.reject(error);
  }
);

// API error handling helper
const handleApiError = (error: any, endpoint: string) => {
  console.log(`[API] Error calling ${endpoint}`);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error(`[API] Error Response for ${endpoint}:`, error.response.status, error.response.data);
    throw new Error(error.response.data.error || `API Error (${error.response.status}): ${endpoint}`);
  } else if (error.request) {
    // The request was made but no response was received
    console.error(`[API] No Response for ${endpoint}:`, error.request);
    console.error(`[API] Request details:`, {
      baseURL: API_BASE_URL,
      endpoint: endpoint,
      timeout: error.request.timeout || 'default'
    });
    throw new Error(`No response received from server: ${endpoint}`);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error(`[API] Setup Error for ${endpoint}:`, error.message);
    throw new Error(`Error setting up request: ${error.message}`);
  }
};

// Relationships API

export const getRelationships = async (): Promise<Relationship[]> => {
  try {
    console.log('[API] Fetching all relationships');
    const response = await api.get('/relationships');
    console.log('[API] Relationships fetched:', response.data.length);
    return response.data;
  } catch (error) {
    handleApiError(error, '/relationships');
    return [];
  }
};

export const getRelationship = async (id: string | number): Promise<Relationship> => {
  try {
    console.log(`[API] Fetching relationship: ${id}`);
    const response = await api.get(`/relationships/${id}`);
    console.log(`[API] Relationship ${id} fetched:`, response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, `/relationships/${id}`);
    throw error;
  }
};

// Update createRelationship to use CreateRelationshipPayload
export const createRelationship = async (relationshipData: CreateRelationshipPayload): Promise<Relationship> => {
  try {
    console.log('[API] Creating relationship:', relationshipData.name);
    
    // Log optional fields if present
    if (relationshipData.bio) console.log('[API] Bio provided');
    if (relationshipData.birthday) console.log('[API] Birthday provided');
    if (relationshipData.phone) console.log('[API] Phone provided');
    if (relationshipData.email) console.log('[API] Email provided');
    if (relationshipData.location) console.log('[API] Location provided');
    if (relationshipData.preferred_communication) console.log('[API] Preferred communication provided');
    if (relationshipData.meeting_frequency) console.log('[API] Meeting frequency provided');
    if (relationshipData.notes) console.log('[API] Notes provided');
    
    const response = await api.post('/relationships', relationshipData);
    console.log('[API] Relationship created:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, '/relationships (POST)');
    throw error;
  }
};

// Update updateRelationship to use UpdateRelationshipPayload
export const updateRelationship = async (
  id: string | number,
  relationshipData: UpdateRelationshipPayload
): Promise<void> => {
  try {
    console.log(`[API] Updating relationship ${id}:`, relationshipData);
    
    // Log categories if they're being updated
    if (relationshipData.categories) {
      console.log(`[API] Updating categories to:`, relationshipData.categories);
    }
    
    // Use a longer timeout for this specific request (30 seconds instead of 10)
    const response = await axios.put(`${API_BASE_URL}/relationships/${id}`, relationshipData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout for relationship updates
    });
    
    console.log(`[API] Relationship ${id} updated successfully:`, response.status);
  } catch (error) {
    console.error('[API] Detailed error:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('[API] Response data:', error.response.data);
      console.error('[API] Response status:', error.response.status);
      console.error('[API] Response headers:', error.response.headers);
    } else if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      console.error('[API] Request timed out. The server might be processing the update but not responding in time.');
    }
    handleApiError(error, `/relationships/${id} (PUT)`);
    throw error;
  }
};

export const deleteRelationship = async (id: string | number): Promise<void> => {
  try {
    console.log(`[API] Deleting relationship: ${id}`);
    await api.delete(`/relationships/${id}`);
    console.log(`[API] Relationship ${id} deleted`);
  } catch (error) {
    handleApiError(error, `/relationships/${id} (DELETE)`);
    throw error;
  }
};

// Interactions API

export const getInteractions = async (): Promise<Interaction[]> => {
  try {
    console.log('[API] Fetching all interactions');
    const response = await api.get('/interactions');
    console.log('[API] Interactions fetched:', response.data.length);
    return response.data;
  } catch (error) {
    handleApiError(error, '/interactions');
    return [];
  }
};

export const getInteraction = async (id: string | number): Promise<Interaction> => {
  try {
    console.log(`[API] Fetching interaction: ${id}`);
    const response = await api.get(`/interactions/${id}`);
    console.log(`[API] Interaction ${id} fetched`);
    return response.data;
  } catch (error) {
    handleApiError(error, `/interactions/${id}`);
    throw error;
  }
};

export const getRelationshipInteractions = async (relationshipId: string | number): Promise<Interaction[]> => {
  try {
    console.log(`[API] Fetching interactions for relationship: ${relationshipId}`);
    const response = await api.get(`/relationships/${relationshipId}/interactions`);
    console.log(`[API] Interactions for relationship ${relationshipId} fetched:`, response.data.length);
    return response.data;
  } catch (error) {
    handleApiError(error, `/relationships/${relationshipId}/interactions`);
    return [];
  }
};

// Update createInteraction to use CreateInteractionPayload
export const createInteraction = async (interactionData: CreateInteractionPayload): Promise<Interaction> => {
  try {
    console.log('[API] Creating interaction for relationship:', interactionData.relationship_id);
    // Use a longer timeout for this endpoint since it may involve AI processing
    const response = await axios.post(`${API_BASE_URL}/interactions`, interactionData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout for interaction creation
    });
    console.log('[API] Interaction created:', response.data);
    return response.data;
  } catch (error) {
    // If it's a timeout error, provide a more specific error message
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      console.error('[API] Interaction creation request timed out');
      throw new Error('The interaction is taking longer than expected to process. Please try again later.');
    }
    handleApiError(error, '/interactions (POST)');
    throw error;
  }
};

export const updateInteraction = async (
  id: string | number,
  interactionData: Partial<{
    relationship_id: string | number;
    interaction_log: string;
    tone_tag?: string;
  }>
): Promise<void> => {
  try {
    console.log(`[API] Updating interaction ${id}`);
    await api.put(`/interactions/${id}`, interactionData);
    console.log(`[API] Interaction ${id} updated`);
  } catch (error) {
    handleApiError(error, `/interactions/${id} (PUT)`);
    throw error;
  }
};

export const deleteInteraction = async (id: string | number): Promise<void> => {
  try {
    console.log(`[API] Deleting interaction: ${id}`);
    await api.delete(`/interactions/${id}`);
    console.log(`[API] Interaction ${id} deleted`);
  } catch (error) {
    handleApiError(error, `/interactions/${id} (DELETE)`);
    throw error;
  }
};

// Tree System API

export interface TreeLeaf {
  id: number;
  summary: string;
  sentiment: string;
  date: string;
  type: string;
}

export interface TreeBlossom {
  id: number;
  description: string;
  completed_on: string;
  category: string;
  milestone_level?: number;
}

export interface TreeFirefly {
  category: string;
  id: number;
  suggested_by_ai: boolean;
}

export interface TreeRing {
  level: number;
  date_reached?: string;
  completed: boolean;
  progress_percentage?: number;
}

export interface EvolutionHistoryItem {
  category: string;
  unlocked_at: string;
  date: string;
}

export interface TreeData {
  person_id: number;
  name: string;
  base_category: string;
  active_categories: string[];
  level: number;
  xp: number;
  trunk: string;
  branches: string[];
  rings: TreeRing[];
  leaves: TreeLeaf[];
  blossoms: TreeBlossom[];
  fireflies: TreeFirefly[];
  evolution_history: EvolutionHistoryItem[];
  relationship_age_days: number;
  is_complete: boolean;
}

export interface EvolutionSuggestion {
  category: string;
  date_suggested: string;
  sentiment_context: string;
}

export interface EvolutionTrigger {
  type: string;
  description: string;
  unlocks: string;
  milestone?: number;
}

export interface TreeEvolutionData {
  current_level: number;
  current_xp: number;
  current_categories: string[];
  suggested_categories: EvolutionSuggestion[];
  evolution_triggers: EvolutionTrigger[];
  can_evolve: boolean;
  max_categories_reached: boolean;
  next_evolution_level: number;
}

export interface TreeCompletionReward {
  type: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface TreeCompletionData {
  is_complete: boolean;
  level: number;
  name: string;
  total_interactions?: number;
  completed_quests?: number;
  categories?: string[];
  completion_percentage: number;
  completion_rewards: TreeCompletionReward[];
  can_export: boolean;
}

export const getRelationshipTree = async (relationshipId: string | number): Promise<TreeData> => {
  try {
    console.log(`[API] Fetching tree data for relationship: ${relationshipId}`);
    const response = await api.get(`/relationships/${relationshipId}/tree`);
    console.log(`[API] Tree data for relationship ${relationshipId} fetched`);
    return response.data;
  } catch (error) {
    handleApiError(error, `/relationships/${relationshipId}/tree`);
    throw error;
  }
};

export const getTreeEvolutionSuggestions = async (relationshipId: string | number): Promise<TreeEvolutionData> => {
  try {
    console.log(`[API] Fetching tree evolution suggestions for relationship: ${relationshipId}`);
    const response = await api.get(`/relationships/${relationshipId}/tree/evolution`);
    console.log(`[API] Tree evolution suggestions for relationship ${relationshipId} fetched`);
    return response.data;
  } catch (error) {
    handleApiError(error, `/relationships/${relationshipId}/tree/evolution`);
    throw error;
  }
};

export const markInteractionAsMilestone = async (interactionId: string | number): Promise<void> => {
  try {
    console.log(`[API] Marking interaction ${interactionId} as milestone`);
    await api.put(`/interactions/${interactionId}/milestone`);
    console.log(`[API] Interaction ${interactionId} marked as milestone`);
  } catch (error) {
    handleApiError(error, `/interactions/${interactionId}/milestone (PUT)`);
    throw error;
  }
};

export const getTreeCompletionStatus = async (relationshipId: string | number): Promise<TreeCompletionData> => {
  try {
    console.log(`[API] Fetching tree completion status for relationship: ${relationshipId}`);
    const response = await api.get(`/relationships/${relationshipId}/tree/completion`);
    console.log(`[API] Tree completion status for relationship ${relationshipId} fetched`);
    return response.data;
  } catch (error) {
    handleApiError(error, `/relationships/${relationshipId}/tree/completion`);
    throw error;
  }
};

// Dashboard API
// Update return type for getDashboardData
export const getDashboardData = async (): Promise<RelationshipDashboardItem[]> => {
  try {
    console.log('[API] Fetching dashboard data');
    const response = await api.get('/dashboard_data');
    console.log('[API] Dashboard data fetched:', response.data.length, 'items');
    return response.data;
  } catch (error) {
    handleApiError(error, '/dashboard_data');
    return [];
  }
};

// Profile View API
// Update return type for getRelationshipOverview
export const getRelationshipOverview = async (relationshipId: string | number): Promise<RelationshipOverview> => {
  try {
    console.log(`[API] Fetching overview for relationship: ${relationshipId}`);
    const response = await api.get(`/relationships/${relationshipId}/overview`);
    console.log(`[API] Overview for relationship ${relationshipId} fetched`);
    return response.data;
  } catch (error) {
    handleApiError(error, `/relationships/${relationshipId}/overview`);
    throw error;
  }
};

export const getRelationshipInteractionsThread = async (relationshipId: string | number): Promise<Interaction[]> => {
  try {
    console.log(`[API] Fetching interactions thread for relationship: ${relationshipId}`);
    const response = await api.get(`/relationships/${relationshipId}/interactions_thread`);
    console.log(`[API] Interactions thread for relationship ${relationshipId} fetched:`, response.data.length);
    return response.data;
  } catch (error) {
    handleApiError(error, `/relationships/${relationshipId}/interactions_thread`);
    return [];
  }
};

// Quests API

export const getRelationshipQuests = async (relationshipId: string | number): Promise<Quest[]> => {
  try {
    console.log(`[API] Fetching quests for relationship: ${relationshipId}`);
    const response = await api.get(`/relationships/${relationshipId}/quests`);
    console.log(`[API] Quests for relationship ${relationshipId} fetched:`, response.data.length);
    return response.data;
  } catch (error) {
    handleApiError(error, `/relationships/${relationshipId}/quests`);
    return [];
  }
};

export const getQuest = async (questId: string | number): Promise<Quest> => {
  try {
    console.log(`[API] Fetching quest: ${questId}`);
    const response = await api.get(`/quests/${questId}`);
    console.log(`[API] Quest ${questId} fetched`);
    return response.data;
  } catch (error) {
    handleApiError(error, `/quests/${questId}`);
    throw error;
  }
};

export const createQuest = async (questData: {
  relationship_id: string | number;
  quest_description: string;
  quest_status: string;
}): Promise<Quest> => {
  try {
    console.log('[API] Creating quest for relationship:', questData.relationship_id);
    const response = await api.post('/quests', questData);
    console.log('[API] Quest created:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, '/quests (POST)');
    throw error;
  }
};

export const updateQuest = async (
  questId: string | number,
  questData: Partial<{
    relationship_id: string | number;
    quest_description: string;
    quest_status: string;
  }>
): Promise<void> => {
  try {
    console.log(`[API] Updating quest ${questId}`);
    await api.put(`/quests/${questId}`, questData);
    console.log(`[API] Quest ${questId} updated`);
  } catch (error) {
    handleApiError(error, `/quests/${questId} (PUT)`);
    throw error;
  }
};

export const deleteQuest = async (questId: string | number): Promise<void> => {
  try {
    console.log(`[API] Deleting quest: ${questId}`);
    await api.delete(`/quests/${questId}`);
    console.log(`[API] Quest ${questId} deleted`);
  } catch (error) {
    handleApiError(error, `/quests/${questId} (DELETE)`);
    throw error;
  }
};

export const generateQuest = async (relationshipId: string | number): Promise<Quest> => {
  try {
    console.log(`[API] Generating quest for relationship: ${relationshipId}`);
    const response = await api.post(`/relationships/${relationshipId}/generate_quest`);
    console.log(`[API] Quest generated for relationship ${relationshipId}:`, response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, `/relationships/${relationshipId}/generate_quest (POST)`);
    throw error;
  }
};

// Global Tree API

export const getGlobalTreeData = async (): Promise<GlobalTreeData | null> => {
  try {
    console.log('[API] Fetching Global Tree data');
    // Assuming a new endpoint '/global_tree_data' exists on the backend
    const response = await api.get('/global_tree_data');
    console.log('[API] Global Tree data fetched');
    return response.data;
  } catch (error) {
    handleApiError(error, '/global_tree_data');
    // Return null or throw error depending on how you want to handle failures upstream
    return null;
  }
};


// Insights API

export interface InsightData {
  interaction_trends: {
    total_interactions: number;
    weekly_frequency: number;
    monthly_frequency: number;
    longest_streak: number;
    longest_gap: number;
    average_xp: number;
    trend_insight: string;
  };
  emotional_summary: {
    common_tone: string;
    tone_shift: string | null;
    emotional_keywords: string[];
    depth_ratio: {
      high: number;
      medium: number;
      low: number;
    };
    summary: string;
  };
  relationship_forecasts: {
    forecasts: Array<{
      path: string;
      confidence: number;
      reasoning: string;
    }>;
    not_enough_data: boolean;
  };
  smart_suggestions: {
    suggestions: Array<{
      type: string;
      content: string;
    }>;
  };
  generated_at: string;
}

export const fetchRelationshipInsights = async (relationshipId: string | number): Promise<InsightData> => {
  try {
    console.log(`[API] Fetching insights for relationship: ${relationshipId}`);
    // Use a longer timeout for this endpoint since it involves AI processing
    const response = await axios.get(`${API_BASE_URL}/relationships/${relationshipId}/insights`, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout for AI processing
    });
    console.log(`[API] Insights for relationship ${relationshipId} fetched`);
    return response.data;
  } catch (error) {
    // If it's a timeout error, provide a more specific error message
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      console.error(`[API] Insights request timed out for relationship ${relationshipId}`);
      throw new Error('The AI insights are taking longer than expected to generate. Please try again later.');
    }
    handleApiError(error, `/relationships/${relationshipId}/insights`);
    throw error;
  }
};

export const fetchInteractionTrends = async (relationshipId: string | number): Promise<InsightData['interaction_trends']> => {
  try {
    console.log(`[API] Fetching interaction trends for relationship: ${relationshipId}`);
    const response = await api.get(`/relationships/${relationshipId}/insights/interaction_trends`);
    console.log(`[API] Interaction trends for relationship ${relationshipId} fetched`);
    return response.data;
  } catch (error) {
    handleApiError(error, `/relationships/${relationshipId}/insights/interaction_trends`);
    throw error;
  }
};

export const fetchEmotionalSummary = async (relationshipId: string | number): Promise<InsightData['emotional_summary']> => {
  try {
    console.log(`[API] Fetching emotional summary for relationship: ${relationshipId}`);
    const response = await api.get(`/relationships/${relationshipId}/insights/emotional_summary`);
    console.log(`[API] Emotional summary for relationship ${relationshipId} fetched`);
    return response.data;
  } catch (error) {
    handleApiError(error, `/relationships/${relationshipId}/insights/emotional_summary`);
    throw error;
  }
};

export const fetchRelationshipForecasts = async (relationshipId: string | number): Promise<InsightData['relationship_forecasts']> => {
  try {
    console.log(`[API] Fetching relationship forecasts for relationship: ${relationshipId}`);
    const response = await api.get(`/relationships/${relationshipId}/insights/relationship_forecasts`);
    console.log(`[API] Relationship forecasts for relationship ${relationshipId} fetched`);
    return response.data;
  } catch (error) {
    handleApiError(error, `/relationships/${relationshipId}/insights/relationship_forecasts`);
    throw error;
  }
};

export const fetchSmartSuggestions = async (relationshipId: string | number): Promise<InsightData['smart_suggestions']> => {
  try {
    console.log(`[API] Fetching smart suggestions for relationship: ${relationshipId}`);
    const response = await api.get(`/relationships/${relationshipId}/insights/smart_suggestions`);
    console.log(`[API] Smart suggestions for relationship ${relationshipId} fetched`);
    return response.data;
  } catch (error) {
    handleApiError(error, `/relationships/${relationshipId}/insights/smart_suggestions`);
    throw error;
  }
};
