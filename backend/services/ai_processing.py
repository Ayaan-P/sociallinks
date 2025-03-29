import os
from dotenv import load_dotenv
from anthropic import Anthropic
import json

load_dotenv()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY is not set in environment variables")

anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

def process_interaction_log_ai(interaction_log, current_level, current_categories):
    """
    Analyzes the interaction log using Anthropic Claude in a single call.
    Provides comprehensive analysis including sentiment, XP calculation,
    relationship evolution suggestions, and interaction suggestions.
    Args:
        interaction_log (str): The user's journal entry text.
        current_level (int): The current relationship level (1-10).
        current_categories (list[str]): List of current categories for the relationship.

    Returns:
        tuple: Contains sentiment analysis, XP score, reasoning, patterns detected,
               evolution suggestion, and interaction suggestion
    """
    try:
        # Corrected model name
        response = anthropic_client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=600,
            system="""You are the AI assistant for Dytto, a relationship journaling app. Your goal is to analyze user journal entries about interactions and provide insights based on the app's leveling and category evolution system.

CONTEXT:
- **Levels & XP:** Relationships level up from 1 to 10 based on XP.
- **XP Assignment:** Award XP based on interaction quality:
    * +1 XP: Surface-level logs, small talk, basic check-ins.
    * +2 XP: Demonstrates warmth, some depth, sharing personal updates, active listening.
    * +3 XP: Shows emotional vulnerability, discusses deep topics, provides/receives significant support, marks memorable moments or overcoming challenges together.
    * *Nuance:* While the core quality dictates XP, consider the current level slightly. Achieving +3 XP might require more significant interaction at higher levels (e.g., Level 8+) compared to lower levels (e.g., Level 2), but the primary driver is the interaction's substance.
- **Categories:** Relationships have 1-3 active categories.
    * **Base Categories:** Business, Acquaintance, Friend, Romantic, Mentor/Student, Intellectual Peer, Social Buddy, Family (Assume Family exists too).
    * **Evolution:** Categories evolve based on interaction patterns. AI suggests adding a *new* category if criteria *and level requirements* are met.
    * **Evolution Paths & Triggers (with Level Requirements):**
        * Business -> + Friend: 3+ personal logs, warm tone, shared non-work interests/activities, **Current Level > 4**.
        * Friend -> + Romantic: Flirty/intimate tone, deep emotional vulnerability, shared exclusive experiences, explicit romantic interest mentioned, **Current Level >= 6**.
        * Mentor -> + Friend: Increased mutuality, shift to informal/personal conversation topics beyond mentorship. (No specific level requirement mentioned, apply general judgment).
        * Acquaintance -> Friend: 3+ positive logs, consistent interaction over time, shared plans or interests, **Current Level > 2**.
        * Intellectual -> + Creative: 2+ logs involving collaboration, brainstorming, building on each other's ideas. (No specific level requirement mentioned, apply general judgment).
        * Friend -> + Emotional Support: 3+ logs involving significant vulnerability (by either party), strong empathy/care expressed, **Current Level >= 5**.
        * Romantic -> + Friend (Decay): Tone becomes consistently detached/distanced, 3+ logs with declining sentiment, focus shifts away from romance. (Suggest adding 'Friend' if not present, or just note the decay if 'Friend' is already there). (No specific level requirement mentioned).
- **AI Role:** Analyze the log, determine sentiment, calculate XP, suggest category evolution *only if applicable triggers and level requirements are met*, and provide an interaction suggestion.

YOUR TASK:
Given the journal entry, the relationship's current level, and its current categories, return a JSON object with the following keys:
- `sentiment_analysis`: (string) Detailed description of emotions and tone (e.g., "Positive and warm, discussed shared hobbies enthusiastically.")
- `xp_score`: (integer) 1, 2, or 3 based on the XP Assignment criteria.
- `reasoning`: (string) Brief justification for the `xp_score` based on the interaction quality described in the log.
- `patterns`: (string or null) Any recurring themes or patterns detected *in this specific log* compared to typical interactions for this relationship type/level (e.g., "Shift towards discussing future plans more often."). Null if none detected.
- `evolution_suggestion`: (string or null) If the log strongly suggests adding a new category based on the Evolution Paths, suggest the *new category to add* (e.g., "Friend"). Only suggest *one* new category per log. Check against `current_categories` - don't suggest adding a category that already exists. Return null if no evolution is strongly suggested by this log.
- `interaction_suggestion`: (string) A specific, actionable suggestion for a next interaction to deepen the bond, relevant to the log content and current level/categories.

EXAMPLE JSON OUTPUT:
```json
{
  "sentiment_analysis": "Positive and supportive. User expressed gratitude for friend's help during a stressful week.",
  "xp_score": 3,
  "reasoning": "Log describes significant emotional support provided during a challenging time.",
  "patterns": null,
  "evolution_suggestion": "Emotional Support",
  "interaction_suggestion": "Check in next week and see how they're doing after the stressful period."
}
```""",
            messages=[
                {
                    "role": "user",
                    "content": f"Analyze this journal entry. Current Level: {current_level}. Current Categories: {current_categories}. Return JSON. Journal Entry: '{interaction_log}'"
                }
            ]
        )
        response_json_str = response.content[0].text.strip()
        
        # Handle case where response is wrapped in markdown code blocks
        if response_json_str.startswith("```json") and response_json_str.endswith("```"):
            response_json_str = response_json_str[7:-3].strip()  # Remove ```json and ``` markers
        elif response_json_str.startswith("```") and response_json_str.endswith("```"):
            response_json_str = response_json_str[3:-3].strip()  # Remove ``` markers
            
        try:
            response_json = json.loads(response_json_str)
            sentiment_analysis = response_json.get('sentiment_analysis', "Sentiment analysis failed.")
            xp_score = response_json.get('xp_score', 1)
            reasoning = response_json.get('reasoning', "Reasoning not provided.")
            patterns = response_json.get('patterns', None)
            evolution_suggestion = response_json.get('evolution_suggestion', None)
            interaction_suggestion = response_json.get('interaction_suggestion', None)
            return sentiment_analysis, xp_score, reasoning, patterns, evolution_suggestion, interaction_suggestion
        except json.JSONDecodeError:
            print(f"Could not parse JSON response from Anthropic: {response_json_str}")
            return "JSON response parsing failed.", 1, "Could not parse JSON response.", None, None, None
    except Exception as e:
        print(f"Error processing interaction log with Anthropic: {e}")
        return f"AI processing failed: {e}", 1, f"Error during AI processing: {e}", None, None, None

# --- Helper functions now call the main processor with categories ---

def analyze_sentiment(interaction_log, current_level, current_categories):
    """
    Analyzes sentiment using the combined AI function.
    """
    sentiment_analysis, _, _, _, _, _ = process_interaction_log_ai(interaction_log, current_level, current_categories)
    return sentiment_analysis

def calculate_xp(interaction_log, current_level, current_categories):
    """
    Calculates XP using the combined AI function.
    """
    _, xp_score, reasoning, _, _, _ = process_interaction_log_ai(interaction_log, current_level, current_categories)
    return xp_score, reasoning

def detect_patterns(interaction_log, current_level, current_categories):
    """
    Detects recurring patterns in interactions.
    """
    _, _, _, patterns, _, _ = process_interaction_log_ai(interaction_log, current_level, current_categories)
    return patterns

def suggest_evolution(interaction_log, current_level, current_categories):
    """
    Suggests potential relationship category evolution.
    """
    _, _, _, _, evolution_suggestion, _ = process_interaction_log_ai(interaction_log, current_level, current_categories)
    return evolution_suggestion

def suggest_interaction(interaction_log, current_level, current_categories):
    """
    Provides a suggestion for the next interaction.
    """
    _, _, _, _, _, interaction_suggestion = process_interaction_log_ai(interaction_log, current_level, current_categories)
    return interaction_suggestion

# --- Placeholder DB functions (should be replaced or removed if handled in app.py) ---

def get_relationship_level(relationship_id):
    """
    Retrieves the current relationship level from the database.
    For now, returns a placeholder level.
    """
    # Replace with actual database retrieval logic
    return 1

def update_relationship_level(relationship_id, new_level):
    """
    Updates the relationship level in the database.
    For now, just prints the update.
    """
    # Replace with actual database update logic
    print(f"Updating relationship {relationship_id} level to {new_level}")
    return True
