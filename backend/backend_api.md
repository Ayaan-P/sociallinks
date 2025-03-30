# Backend API Documentation

## Base URL

The base URL for all API endpoints is the root of the backend application (`/`).

## Endpoints

### Relationships

*   **POST /relationships**
    *   Description: Creates a new relationship.
    *   Request Body (JSON):
        ```json
        {
            "name": "string",                   // Required
            "relationship_type": "string",      // Required
            "reminder_interval": "string",      // Required
            "initial_category_name": "string",  // Required (e.g., "Friend", "Business") - Name of the first category
            "photo_url": "string",              // Optional
            "tags": ["string", "string"]        // Optional (e.g., ["High Priority", "Close Friend"]) - Note: Tags might move to a junction table later
        }
        ```
    *   Response (JSON):
        *   Success (201 Created): Returns the newly created relationship object, including a `categories` list with the initial category name.
        *   Error (400 Bad Request): Missing required fields.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **GET /relationships**
    *   Description: Retrieves all relationships.
    *   Response (JSON):
        *   Success (200 OK): Returns a list of relationship objects. Each object includes a `categories` field (array of strings).
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **GET /relationships/\<relationship_id>**
    *   Description: Retrieves a specific relationship by ID.
    *   Path Parameters:
        *   `relationship_id` (integer): The ID of the relationship to retrieve.
    *   Response (JSON):
        *   Success (200 OK): Returns the requested relationship object, including a `categories` field (array of strings).
        *   Error (404 Not Found): Relationship not found.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **PUT /relationships/\<relationship_id>**
    *   Description: Updates an existing relationship.
    *   Path Parameters:
        *   `relationship_id` (integer): The ID of the relationship to update.
    *   Request Body (JSON):
        ```json
        {
            // Any standard relationship fields can be updated
            "name": "string",
            "relationship_type": "string",
            "reminder_interval": "string",
            "photo_url": "string",
            "tags": ["string", "string"], // Note: Tags might move to a junction table later
            // To update categories, include the 'categories' field:
            "categories": ["Friend", "Business"] // Optional: Replaces ALL existing categories with this list (max 3)
        }
        ```
    *   Response (JSON):
        *   Success (200 OK): Returns a message indicating success.
        *   Error (400 Bad Request): No data provided for update.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **DELETE /relationships/\<relationship_id>**
    *   Description: Deletes a relationship.
    *   Path Parameters:
        *   `relationship_id` (integer): The ID of the relationship to delete.
    *   Response (JSON):
        *   Success (200 OK): Returns a message indicating success.
        *   Error (500 Internal Server Error): Supabase error or other server error.

### Interactions

*   **POST /interactions**
    *   Description: Creates a new interaction log for a relationship and processes it with AI to provide insights.
    *   Request Body (JSON):
        ```json
        {
            "relationship_id": integer,    // Required
            "interaction_log": "string",   // Required
            "tone_tag": "string"           // Optional
        }
        ```
    *   Response (JSON):
        *   Success (201 Created): Returns the newly created interaction log object with AI-generated insights:
            ```json
            {
                "id": integer,
                "relationship_id": integer,
                "created_at": "timestamp",
                "interaction_log": "string",
                "tone_tag": "string",
                "sentiment_analysis": "string",  // AI-generated sentiment analysis
                "xp_gain": integer,              // XP points awarded (1-3)
                "suggested_tone": "string",      // AI-suggested tone tag (often same as sentiment_analysis)
                "evolution_suggestion": "string" or null, // Name of *new* category suggested by AI (e.g., "Friend"). Backend attempts to add if valid & < 3 categories exist.
                "ai_reasoning": "string",        // Explanation for XP score
                "patterns": "string" or null,    // Detected recurring patterns in this log
                "interaction_suggestion": "string", // Suggestion for next interaction
                "processing_error": "string"     // Optional: Included if AI/Leveling/Evolution update failed internally
            }
            ```
        *   Error (400 Bad Request): Missing required fields.
        *   Error (500 Internal Server Error): Supabase error, AI processing error, or other server error.

*   **GET /interactions**
    *   Description: Retrieves all interaction logs.
    *   Response (JSON):
        *   Success (200 OK): Returns a list of interaction log objects.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **GET /relationships/\<relationship_id>/interactions**
    *   Description: Retrieves all interaction logs for a specific relationship.
    *   Path Parameters:
        *   `relationship_id` (integer): The ID of the relationship.
    *   Response (JSON):
        *   Success (200 OK): Returns a list of interaction log objects for the relationship.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **GET /interactions/\<interaction_id>**
    *   Description: Retrieves a specific interaction log by ID.
    *   Path Parameters:
        *   `interaction_id` (integer): The ID of the interaction log to retrieve.
    *   Response (JSON):
        *   Success (200 OK): Returns the requested interaction log object.
        *   Error (404 Not Found): Interaction log not found.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **PUT /interactions/\<interaction_id>**
    *   Description: Updates an existing interaction log.
    *   Path Parameters:
        *   `interaction_id` (integer): The ID of the interaction log to update.
    *   Request Body (JSON):
        ```json
        {
            "relationship_id": integer,
            "interaction_log": "string",
            "tone_tag": "string"
            // Include any fields you want to update
        }
        ```
    *   Response (JSON):
        *   Success (200 OK): Returns a message indicating success.
        *   Error (400 Bad Request): No data provided for update.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **DELETE /interactions/\<interaction_id>**
    *   Description: Deletes an interaction log.
    *   Path Parameters:
        *   `interaction_id` (integer): The ID of the interaction log to delete.
    *   Response (JSON):
        *   Success (200 OK): Returns a message indicating success.
        *   Error (500 Internal Server Error): Supabase error or other server error.

### Dashboard Data

*   **GET /dashboard_data**
    *   Description: Retrieves data for the dashboard view, including all relationships with their latest interaction information.
    *   Response (JSON):
        *   Success (200 OK): Returns a list of dashboard items:
            ```json
            [
                {
                    "id": integer,
                    "name": "string",
                    "photo_url": "string",
                    "level": integer,
                    "days_since_interaction": integer or "Never",
                    "categories": ["string", "string"], // List of current categories
                    "tags": ["string", "string"]        // Note: Tags might move to a junction table later
                },
                // More dashboard items...
            ]
            ```
        *   Error (500 Internal Server Error): Supabase error or other server error.

### Profile View Endpoints

*   **GET /relationships/\<relationship_id>/overview**
    *   Description: Retrieves the profile overview data for a specific relationship.
    *   Path Parameters:
        *   `relationship_id` (integer): The ID of the relationship.
    *   Response (JSON):
        ```json
        {
            "photo_url": "string",
            "name": "string",
            "level": integer,
            "reminder_settings": "string",
            "xp_bar": integer,                 // XP progress within current level (0-100 percentage)
            "xp_earned_in_level": integer,     // Raw XP earned within the current level
            "xp_needed_for_level": integer,    // Total XP needed to complete the current level
            "total_xp": integer,               // Total accumulated XP
            "last_interaction": { /* Interaction object or null */ },
            "categories": ["string", "string"] // List of current categories
        }
        ```
        *   Success (200 OK): Returns the profile overview data.
        *   Error (404 Not Found): Relationship not found.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **GET /relationships/\<relationship_id>/interactions_thread**
    *   Description: Retrieves the interaction thread for a specific relationship.
    *   Path Parameters:
        *   `relationship_id` (integer): The ID of the relationship.
    *   Response (JSON):
        *   Success (200 OK): Returns a list of interaction log objects, ordered by `created_at` in descending order.
        *   Error (404 Not Found): No interactions found for this relationship.
        *   Error (500 Internal Server Error): Supabase error or other server error.


### Quests

*   **POST /quests**
    *   Description: Creates a new quest for a relationship.
    *   Request Body (JSON):
        ```json
        {
            "relationship_id": integer,     // Required
            "quest_description": "string",  // Required
            "quest_status": "string",       // Required, e.g., "pending", "completed"
            "milestone_level": integer      // Optional, set for milestone quests (levels 3, 5, 7, 10)
        }
        ```
    *   Response (JSON):
        *   Success (201 Created): Returns the newly created quest object.
        *   Error (400 Bad Request): Missing required fields.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **GET /relationships/\<relationship_id>/quests**
    *   Description: Retrieves all quests for a specific relationship.
    *   Path Parameters:
        *   `relationship_id` (integer): The ID of the relationship.
    *   Response (JSON):
        *   Success (200 OK): Returns a list of quest objects for the relationship.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **GET /quests/\<quest_id>**
    *   Description: Retrieves a specific quest by ID.
    *   Path Parameters:
        *   `quest_id` (integer): The ID of the quest to retrieve.
    *   Response (JSON):
        *   Success (200 OK): Returns the requested quest object.
        *   Error (404 Not Found): Quest not found.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **PUT /quests/\<quest_id>**
    *   Description: Updates an existing quest.
    *   Path Parameters:
        *   `quest_id` (integer): The ID of the quest to update.
    *   Request Body (JSON):
        ```json
        {
            "relationship_id": integer,
            "quest_description": "string",
            "quest_status": "string",
            "milestone_level": integer
            // Include any fields you want to update
        }
        ```
    *   Response (JSON):
        *   Success (200 OK): Returns a message indicating success.
        *   Error (400 Bad Request): No data provided for update.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **DELETE /quests/\<quest_id>**
    *   Description: Deletes a quest.
    *   Path Parameters:
        *   `quest_id` (integer): The ID of the quest to delete.
    *   Response (JSON):
        *   Success (200 OK): Returns a message indicating success.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **POST /relationships/\<relationship_id>/generate_quest**
    *   Description: Generates and creates a new quest for a relationship using AI.
    *   Path Parameters:
        *   `relationship_id` (integer): The ID of the relationship.
    *   Response (JSON):
        *   Success (201 Created): Returns the newly created quest object with AI-generated quest description.
        *   Error (500 Internal Server Error): Supabase error, AI processing error, or other server error.

### Tree System

*   **GET /relationships/\<relationship_id>/tree**
    *   Description: Retrieves tree data for a specific relationship, including trunk, branches, rings, leaves, and buds.
    *   Path Parameters:
        *   `relationship_id` (integer): The ID of the relationship.
    *   Response (JSON):
        ```json
        {
            "trunk": "string",                // Primary category (e.g., "Friend")
            "branches": ["string", "string"], // Evolved categories (e.g., ["Business", "Mentor"])
            "level": integer,                 // Current relationship level (1-10)
            "leaves": [                       // Milestone interactions (memories)
                {
                    "id": integer,
                    "summary": "string",      // Short summary of the interaction
                    "sentiment": "string",    // Sentiment analysis of the interaction
                    "date": "timestamp"
                }
            ],
            "buds": ["string", "string"]      // Potential categories that could evolve
        }
        ```
        *   Success (200 OK): Returns the tree data structure.
        *   Error (404 Not Found): Relationship not found.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **GET /relationships/\<relationship_id>/tree/evolution**
    *   Description: Retrieves evolution suggestions for a relationship's tree.
    *   Path Parameters:
        *   `relationship_id` (integer): The ID of the relationship.
    *   Response (JSON):
        ```json
        {
            "current_level": integer,
            "current_categories": ["string", "string"],
            "suggested_categories": ["string", "string"],
            "can_evolve": boolean            // Whether the relationship meets criteria for evolution
        }
        ```
        *   Success (200 OK): Returns the evolution suggestions.
        *   Error (404 Not Found): Relationship not found.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **PUT /interactions/\<interaction_id>/milestone**
    *   Description: Marks an interaction as a milestone, which will appear as a leaf on the relationship tree.
    *   Path Parameters:
        *   `interaction_id` (integer): The ID of the interaction to mark as a milestone.
    *   Response (JSON):
        *   Success (200 OK): Returns a message indicating success.
        *   Error (404 Not Found): Interaction not found.
        *   Error (500 Internal Server Error): Supabase error or other server error.

**Note:**

*   All endpoints return JSON responses.
*   Error responses typically include an `error` key with a descriptive message.
*   Ensure your Supabase setup is correctly configured as described in the `.env` file for these endpoints to function correctly.

## AI Processing

The backend uses Anthropic's Claude AI model to analyze interaction logs and provide relationship insights. This functionality is automatically applied when creating a new interaction log through the `/interactions` POST endpoint.

### AI Processing Features

*   **Sentiment Analysis**: Analyzes the emotional tone of the interaction (positive, negative, neutral, mixed) and provides a nuanced description of emotions present.

*   **XP Calculation**: Awards experience points (1-3) based on the depth and quality of the interaction, taking into account the current relationship level:
    *   Level 1-3 relationships: Points awarded generously to encourage growth
    *   Level 4-7 relationships: Require more depth for the same XP
    *   Level 8-10 relationships: Require substantial effort and depth

*   **Relationship Evolution**: Suggests potential new relationship categories when appropriate (e.g., a "Friend" relationship might evolve to add "Business" if work topics become frequent).

*   **Interaction Suggestions**: Provides specific suggestions for deepening the relationship based on the entry. At milestone levels (2, 4, 6, etc.), suggests "quests" like "Ask about their childhood" or "Share a personal belief".

*   **Pattern Detection**: Identifies recurring themes or patterns in interactions over time.

### Configuration

The AI processing functionality requires an Anthropic API key to be set in the `.env` file:

```
ANTHROPIC_API_KEY="your-api-key-here"
```

Without this key, the AI processing features will not work.
