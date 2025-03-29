import os
from dotenv import load_dotenv
from anthropic import Anthropic
import json

load_dotenv()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY is not set in environment variables")

anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

def process_interaction_log_ai(interaction_log, current_level):
    """
    Analyzes the interaction log using Anthropic Claude in a single call.
    Provides comprehensive analysis including sentiment, XP calculation, 
    relationship evolution suggestions, and interaction suggestions.
    
    Args:
        interaction_log (str): The user's journal entry text
        current_level (int): The current relationship level (1-10)
        
    Returns:
        tuple: Contains sentiment analysis, XP score, reasoning, patterns detected,
               evolution suggestion, and interaction suggestion
    """
    try:
        response = anthropic_client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=600,
            system="""You are the AI assistant for Dytto, a relationship journaling app that helps users track and grow their real-world relationships. The app uses a gamified approach with relationship levels (1-10), XP points, and relationship categories that can branch and evolve.

CONTEXT:
- Users log interactions with people they care about
- Each relationship has a level (1-10) that grows with XP
- Relationships can have multiple categories (Friend, Business, Romantic, etc.)
- Categories can evolve and branch based on interaction patterns
- The app aims to help users be more intentional about relationships

YOUR ROLE:
Analyze each journal entry to provide insights and growth metrics. For each entry:

1. SENTIMENT ANALYSIS:
   - Identify the emotional tone (positive, negative, neutral, mixed)
   - Provide a nuanced description of emotions present
   - Detect recurring emotional patterns if applicable

2. XP CALCULATION (1-3 points):
   - Level 1-3 relationships: Award points generously to encourage growth
     * 1 XP: Basic, surface-level interaction (quick chat, brief message)
     * 2 XP: Meaningful conversation with some depth
     * 3 XP: Vulnerable sharing, significant support, or memorable experience
   
   - Level 4-7 relationships: Require more depth for the same XP
     * 1 XP: Regular check-in or casual conversation
     * 2 XP: Personal topics, active listening, or quality time
     * 3 XP: Deep conversation, significant emotional support, or milestone event
   
   - Level 8-10 relationships: Require substantial effort and depth
     * 1 XP: Routine interaction that maintains the relationship
     * 2 XP: Meaningful support, quality time, or addressing challenges
     * 3 XP: Exceptional connection, relationship growth, or transformative experience

3. RELATIONSHIP EVOLUTION:
   - Suggest potential new relationship categories when appropriate
   - Identify when a relationship might be ready to branch into new dimensions
   - Example: A "Friend" relationship might evolve to add "Business" if work topics become frequent

4. INTERACTION SUGGESTIONS:
   - Provide a specific suggestion for deepening the relationship based on the entry
   - At milestone levels (2, 4, 6, etc.), suggest "quests" like "Ask about their childhood" or "Share a personal belief"

RESPONSE FORMAT:
Return a JSON object with these keys:
- sentiment_analysis: Detailed description of emotions and tone
- xp_score: Number 1-3 based on criteria above
- reasoning: Brief justification for the XP score
- patterns: Any recurring themes or patterns detected (or null if none)
- evolution_suggestion: Suggestion for relationship category evolution (or null if none)
- interaction_suggestion: Specific suggestion for next interaction""",
            messages=[
                {
                    "role": "user",
                    "content": f"Analyze this journal entry for sentiment and relationship growth, considering the current relationship level is {current_level}. Return a JSON object with all the required fields. Journal Entry: '{interaction_log}'"
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

def analyze_sentiment(interaction_log, current_level):
    """
    Analyzes sentiment using the combined AI function, passing current level.
    """
    sentiment_analysis, _, _, _, _, _ = process_interaction_log_ai(interaction_log, current_level)
    return sentiment_analysis

def calculate_xp(interaction_log, current_level):
    """
    Calculates XP using the combined AI function, passing current level.
    """
    _, xp_score, reasoning, _, _, _ = process_interaction_log_ai(interaction_log, current_level)
    return xp_score, reasoning

def detect_patterns(interaction_log, current_level):
    """
    Detects recurring patterns in interactions.
    """
    _, _, _, patterns, _, _ = process_interaction_log_ai(interaction_log, current_level)
    return patterns

def suggest_evolution(interaction_log, current_level):
    """
    Suggests potential relationship category evolution.
    """
    _, _, _, _, evolution_suggestion, _ = process_interaction_log_ai(interaction_log, current_level)
    return evolution_suggestion

def suggest_interaction(interaction_log, current_level):
    """
    Provides a suggestion for the next interaction.
    """
    _, _, _, _, _, interaction_suggestion = process_interaction_log_ai(interaction_log, current_level)
    return interaction_suggestion

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
