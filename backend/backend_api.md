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
            "name": "string",             // Required
            "relationship_type": "string",  // Required
            "reminder_interval": "string", // Required
            "photo_url": "string"          // Optional
        }
        ```
    *   Response (JSON):
        *   Success (201 Created): Returns the newly created relationship object.
        *   Error (400 Bad Request): Missing required fields.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **GET /relationships**
    *   Description: Retrieves all relationships.
    *   Response (JSON):
        *   Success (200 OK): Returns a list of relationship objects.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **GET /relationships/\<relationship_id>**
    *   Description: Retrieves a specific relationship by ID.
    *   Path Parameters:
        *   `relationship_id` (integer): The ID of the relationship to retrieve.
    *   Response (JSON):
        *   Success (200 OK): Returns the requested relationship object.
        *   Error (404 Not Found): Relationship not found.
        *   Error (500 Internal Server Error): Supabase error or other server error.

*   **PUT /relationships/\<relationship_id>**
    *   Description: Updates an existing relationship.
    *   Path Parameters:
        *   `relationship_id` (integer): The ID of the relationship to update.
    *   Request Body (JSON):
        ```json
        {
            "name": "string",
            "relationship_type": "string",
            "reminder_interval": "string",
            "photo_url": "string"
            // Include any fields you want to update
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
    *   Description: Creates a new interaction log for a relationship.
    *   Request Body (JSON):
        ```json
        {
            "relationship_id": integer,    // Required
            "interaction_log": "string",   // Required
            "tone_tag": "string"           // Optional
        }
        ```
    *   Response (JSON):
        *   Success (201 Created): Returns the newly created interaction log object.
        *   Error (400 Bad Request): Missing required fields.
        *   Error (500 Internal Server Error): Supabase error or other server error.

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

### Quests

*   **POST /quests**
    *   Description: Creates a new quest for a relationship.
    *   Request Body (JSON):
        ```json
        {
            "relationship_id": integer,     // Required
            "quest_description": "string",    // Required
            "quest_status": "string"        // Required, e.g., "pending", "completed"
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
            "quest_status": "string"
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

**Note:**

*   All endpoints return JSON responses.
*   Error responses typically include an `error` key with a descriptive message.
*   Ensure your Supabase setup is correctly configured as described in the `.env` file for these endpoints to function correctly.
