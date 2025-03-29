import axios from 'axios';
import { Relationship } from '../types/Relationship';
import { Interaction } from '../types/Interaction';
import { Quest } from '../types/Quest';

// Define the base URL for the API
export const API_BASE_URL = 'https://heavy-ghosts-help.loca.lt'; // Update this with your actual backend URL

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

export const createRelationship = async (relationshipData: {
  name: string;
  relationship_type: string;
  reminder_interval: string;
  category: string;
  photo_url?: string;
  tags?: string[];
}): Promise<Relationship> => {
  try {
    console.log('[API] Creating relationship:', relationshipData.name);
    const response = await api.post('/relationships', relationshipData);
    console.log('[API] Relationship created:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, '/relationships (POST)');
    throw error;
  }
};

export const updateRelationship = async (
  id: string | number,
  relationshipData: Partial<{
    name: string;
    relationship_type: string;
    reminder_interval: string;
    category: string;
    photo_url?: string;
    tags?: string[];
  }>
): Promise<void> => {
  try {
    console.log(`[API] Updating relationship ${id}:`, relationshipData);
    await api.put(`/relationships/${id}`, relationshipData);
    console.log(`[API] Relationship ${id} updated`);
  } catch (error) {
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

export const createInteraction = async (interactionData: {
  relationship_id: string | number;
  interaction_log: string;
  tone_tag?: string;
}): Promise<Interaction> => {
  try {
    console.log('[API] Creating interaction for relationship:', interactionData.relationship_id);
    const response = await api.post('/interactions', interactionData);
    console.log('[API] Interaction created:', response.data);
    return response.data;
  } catch (error) {
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

// Dashboard API

export const getDashboardData = async (): Promise<any[]> => {
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

export const getRelationshipOverview = async (relationshipId: string | number): Promise<any> => {
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
