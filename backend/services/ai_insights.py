import os
from dotenv import load_dotenv
from anthropic import Anthropic
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple

# Load environment variables
load_dotenv()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY is not set in environment variables")

anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

def generate_interaction_trends(
    relationship_id: int, 
    interactions: List[Dict[Any, Any]], 
    relationship_data: Dict[Any, Any]
) -> Dict[str, Any]:
    """
    Generates interaction trends data for a relationship.
    
    Args:
        relationship_id: The ID of the relationship
        interactions: List of interaction objects for the relationship
        relationship_data: Basic relationship data (name, level, etc.)
        
    Returns:
        Dictionary containing interaction trends data
    """
    # Calculate basic metrics
    total_interactions = len(interactions)
    
    if total_interactions == 0:
        return {
            "total_interactions": 0,
            "weekly_frequency": 0,
            "monthly_frequency": 0,
            "longest_streak": 0,
            "longest_gap": 0,
            "average_xp": 0,
            "trend_insight": "No interactions recorded yet."
        }
    
    # Sort interactions by date (newest first)
    sorted_interactions = sorted(
        interactions, 
        key=lambda x: datetime.fromisoformat(x['created_at'].replace('Z', '+00:00')), 
        reverse=True
    )
    
    # Calculate weekly and monthly frequencies
    now = datetime.now(timezone.utc)
    one_week_ago = now - timedelta(days=7)
    one_month_ago = now - timedelta(days=30)
    
    weekly_interactions = [
        i for i in sorted_interactions 
        if datetime.fromisoformat(i['created_at'].replace('Z', '+00:00')) > one_week_ago
    ]
    monthly_interactions = [
        i for i in sorted_interactions 
        if datetime.fromisoformat(i['created_at'].replace('Z', '+00:00')) > one_month_ago
    ]
    
    weekly_frequency = len(weekly_interactions)
    monthly_frequency = len(monthly_interactions)
    
    # Calculate streaks and gaps
    interaction_dates = [
        datetime.fromisoformat(i['created_at'].replace('Z', '+00:00')).date() 
        for i in sorted_interactions
    ]
    
    # Longest streak (consecutive days with interactions)
    longest_streak = 1
    current_streak = 1
    
    for i in range(1, len(interaction_dates)):
        if (interaction_dates[i-1] - interaction_dates[i]).days == 1:
            current_streak += 1
        else:
            longest_streak = max(longest_streak, current_streak)
            current_streak = 1
    
    longest_streak = max(longest_streak, current_streak)
    
    # Longest gap (days between interactions)
    longest_gap = 0
    
    for i in range(1, len(interaction_dates)):
        gap = (interaction_dates[i-1] - interaction_dates[i]).days - 1  # -1 because we want days between
        longest_gap = max(longest_gap, gap)
    
    # Calculate average XP
    xp_values = [i.get('xp_gain', 0) for i in sorted_interactions if i.get('xp_gain') is not None]
    average_xp = sum(xp_values) / len(xp_values) if xp_values else 0
    
    # Generate AI insight about the trend
    trend_insight = generate_trend_insight(
        relationship_data.get('name', ''),
        weekly_frequency,
        monthly_frequency,
        longest_streak,
        longest_gap,
        average_xp,
        sorted_interactions
    )
    
    return {
        "total_interactions": total_interactions,
        "weekly_frequency": weekly_frequency,
        "monthly_frequency": monthly_frequency,
        "longest_streak": longest_streak,
        "longest_gap": longest_gap,
        "average_xp": round(average_xp, 1),
        "trend_insight": trend_insight
    }

def generate_trend_insight(
    name: str,
    weekly_frequency: int,
    monthly_frequency: int,
    longest_streak: int,
    longest_gap: int,
    average_xp: float,
    interactions: List[Dict[Any, Any]]
) -> str:
    """
    Generates an AI insight about interaction trends.
    
    Args:
        name: Name of the person
        weekly_frequency: Number of interactions in the past week
        monthly_frequency: Number of interactions in the past month
        longest_streak: Longest streak of consecutive days with interactions
        longest_gap: Longest gap between interactions (in days)
        average_xp: Average XP per interaction
        interactions: List of interaction objects
        
    Returns:
        String containing an insight about the interaction trends
    """
    # For small datasets, use simple rule-based insights
    if len(interactions) < 3:
        if len(interactions) == 0:
            return f"You haven't logged any interactions with {name} yet."
        elif len(interactions) == 1:
            return f"You've logged your first interaction with {name}. Keep building your connection!"
        else:
            return f"You're just getting started with logging interactions with {name}."
    
    # For larger datasets, use more sophisticated insights
    try:
        # Get previous month's frequency for comparison
        now = datetime.now(timezone.utc)
        one_month_ago = now - timedelta(days=30)
        two_months_ago = now - timedelta(days=60)
        
        prev_month_interactions = [
            i for i in interactions 
            if two_months_ago < datetime.fromisoformat(i['created_at'].replace('Z', '+00:00')) <= one_month_ago
        ]
        
        prev_monthly_frequency = len(prev_month_interactions)
        
        # Determine trend direction
        if monthly_frequency > prev_monthly_frequency:
            trend = "increasing"
        elif monthly_frequency < prev_monthly_frequency:
            trend = "decreasing"
        else:
            trend = "steady"
        
        # Generate insight based on trend
        if trend == "increasing":
            return f"Your interactions with {name} are more frequent than last month. This suggests your relationship is growing stronger."
        elif trend == "decreasing":
            return f"Your interactions with {name} are less frequent than last month. It might be time for a check-in."
        else:
            if longest_gap > 14:
                return f"While you maintain a steady relationship with {name}, there was a {longest_gap}-day gap in your interactions. Consider scheduling regular check-ins."
            else:
                return f"You maintain a consistent connection with {name}, with an average of {round(average_xp, 1)} XP per interaction."
    
    except Exception as e:
        # Fallback to simple insight if there's an error
        print(f"Error generating trend insight: {e}")
        return f"You've logged {len(interactions)} interactions with {name} so far."

def generate_emotional_summary(
    relationship_id: int, 
    interactions: List[Dict[Any, Any]], 
    relationship_data: Dict[Any, Any]
) -> Dict[str, Any]:
    """
    Generates an emotional summary for a relationship based on interaction logs.
    
    Args:
        relationship_id: The ID of the relationship
        interactions: List of interaction objects for the relationship
        relationship_data: Basic relationship data (name, level, etc.)
        
    Returns:
        Dictionary containing emotional summary data
    """
    if not interactions:
        return {
            "common_tone": "Not enough data",
            "tone_shift": None,
            "emotional_keywords": [],
            "depth_ratio": {"high": 0, "medium": 0, "low": 0},
            "summary": f"No interactions recorded with {relationship_data.get('name', '')} yet."
        }
    
    # Extract sentiment analyses and XP values
    sentiment_analyses = [i.get('sentiment_analysis', '') for i in interactions if i.get('sentiment_analysis')]
    xp_values = [i.get('xp_gain', 0) for i in interactions if i.get('xp_gain') is not None]
    
    # Count depth levels based on XP
    high_depth = sum(1 for xp in xp_values if xp == 3)
    medium_depth = sum(1 for xp in xp_values if xp == 2)
    low_depth = sum(1 for xp in xp_values if xp == 1)
    total_with_xp = high_depth + medium_depth + low_depth
    
    depth_ratio = {
        "high": round(high_depth / total_with_xp * 100) if total_with_xp > 0 else 0,
        "medium": round(medium_depth / total_with_xp * 100) if total_with_xp > 0 else 0,
        "low": round(low_depth / total_with_xp * 100) if total_with_xp > 0 else 0
    }
    
    # If we have enough data, use AI to generate a comprehensive emotional summary
    if len(interactions) >= 3 and sentiment_analyses:
        summary_data = generate_ai_emotional_summary(
            relationship_data.get('name', ''),
            sentiment_analyses,
            [i.get('interaction_log', '') for i in interactions if i.get('interaction_log')],
            depth_ratio,
            relationship_data.get('categories', [])
        )
        return summary_data
    else:
        # For limited data, generate a simple summary
        return {
            "common_tone": "Not enough data",
            "tone_shift": None,
            "emotional_keywords": [],
            "depth_ratio": depth_ratio,
            "summary": f"Starting to build emotional data with {relationship_data.get('name', '')}. Log more interactions to get deeper insights."
        }

def generate_ai_emotional_summary(
    name: str,
    sentiment_analyses: List[str],
    interaction_logs: List[str],
    depth_ratio: Dict[str, int],
    categories: List[str]
) -> Dict[str, Any]:
    """
    Uses AI to generate a comprehensive emotional summary.
    
    Args:
        name: Name of the person
        sentiment_analyses: List of sentiment analysis strings from interactions
        interaction_logs: List of interaction log texts
        depth_ratio: Dictionary with percentages of high/medium/low depth interactions
        categories: List of relationship categories
        
    Returns:
        Dictionary with emotional summary data
    """
    try:
        # Prepare the prompt for Claude
        sentiment_text = "\n".join(sentiment_analyses[:10])  # Limit to most recent 10 for brevity
        log_samples = "\n".join(interaction_logs[:5])  # Limit to most recent 5 for brevity
        
        prompt = f"""
        Analyze the emotional patterns in these interactions with {name}, who is categorized as: {', '.join(categories)}.
        
        Recent sentiment analyses:
        {sentiment_text}
        
        Sample interaction logs:
        {log_samples}
        
        Depth ratio:
        High depth: {depth_ratio['high']}%
        Medium depth: {depth_ratio['medium']}%
        Low depth: {depth_ratio['low']}%
        
        Based on this data, provide:
        1. The most common emotional tone (e.g., "Reflective," "Supportive," "Joyful")
        2. Any notable shifts in tone (e.g., "Your tone has recently become more distant.")
        3. Top 3-5 emotional keywords that characterize this relationship
        4. A paragraph summarizing the emotional nature of this relationship
        
        Return your analysis as JSON with these keys:
        - common_tone
        - tone_shift (null if none detected)
        - emotional_keywords (array)
        - summary (paragraph)
        """
        
        response = anthropic_client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=600,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        response_text = response.content[0].text.strip()
        
        # Extract JSON from response
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].strip()
        else:
            json_str = response_text
        
        result = json.loads(json_str)
        
        # Ensure all expected keys are present
        result.setdefault("common_tone", "Mixed")
        result.setdefault("tone_shift", None)
        result.setdefault("emotional_keywords", [])
        result.setdefault("summary", f"Relationship with {name} shows a mix of emotions.")
        result["depth_ratio"] = depth_ratio
        
        return result
    
    except Exception as e:
        print(f"Error generating emotional summary: {e}")
        # Fallback to simple summary
        return {
            "common_tone": "Mixed",
            "tone_shift": None,
            "emotional_keywords": [],
            "depth_ratio": depth_ratio,
            "summary": f"Relationship with {name} shows a mix of emotions across {len(sentiment_analyses)} interactions."
        }

def generate_relationship_forecasts(
    relationship_id: int, 
    interactions: List[Dict[Any, Any]], 
    relationship_data: Dict[Any, Any]
) -> Dict[str, Any]:
    """
    Generates relationship forecasts based on interaction history.
    
    Args:
        relationship_id: The ID of the relationship
        interactions: List of interaction objects for the relationship
        relationship_data: Basic relationship data (name, level, etc.)
        
    Returns:
        Dictionary containing relationship forecast data
    """
    if len(interactions) < 5:
        return {
            "forecasts": [
                {
                    "path": "Need more data",
                    "confidence": 0,
                    "reasoning": "Log more interactions to generate forecasts."
                }
            ],
            "not_enough_data": True
        }
    
    # Extract relevant data for forecasting
    name = relationship_data.get('name', '')
    level = relationship_data.get('level', 1)
    categories = relationship_data.get('categories', [])
    xp_pace = sum(i.get('xp_gain', 0) for i in interactions if i.get('xp_gain') is not None) / len(interactions)
    
    # Get sentiment analyses and interaction logs
    sentiment_analyses = [i.get('sentiment_analysis', '') for i in interactions if i.get('sentiment_analysis')]
    interaction_logs = [i.get('interaction_log', '') for i in interactions if i.get('interaction_log')]
    
    # Generate forecasts using AI
    forecasts = generate_ai_forecasts(
        name,
        level,
        categories,
        xp_pace,
        sentiment_analyses,
        interaction_logs
    )
    
    return {
        "forecasts": forecasts,
        "not_enough_data": False
    }

def generate_ai_forecasts(
    name: str,
    level: int,
    categories: List[str],
    xp_pace: float,
    sentiment_analyses: List[str],
    interaction_logs: List[str]
) -> List[Dict[str, Any]]:
    """
    Uses AI to generate relationship forecasts.
    
    Args:
        name: Name of the person
        level: Current relationship level
        categories: List of relationship categories
        xp_pace: Average XP per interaction
        sentiment_analyses: List of sentiment analysis strings
        interaction_logs: List of interaction log texts
        
    Returns:
        List of forecast dictionaries
    """
    try:
        # Prepare the prompt for Claude
        sentiment_text = "\n".join(sentiment_analyses[:10])  # Limit to most recent 10
        log_samples = "\n".join(interaction_logs[:5])  # Limit to most recent 5
        
        prompt = f"""
        Forecast the potential future paths for this relationship with {name}.
        
        Current data:
        - Relationship level: {level} (on a scale of 1-10)
        - Categories: {', '.join(categories)}
        - Average XP per interaction: {round(xp_pace, 1)}
        
        Recent sentiment analyses:
        {sentiment_text}
        
        Sample interaction logs:
        {log_samples}
        
        Based on this data, predict 2-3 likely trajectories for this relationship.
        For each trajectory, provide:
        1. A clear path description (e.g., "Friendship continues deepening", "Romantic potential", "Professional collaboration")
        2. A confidence score (0-100%)
        3. Reasoning for this prediction
        
        Return your forecasts as a JSON array with objects containing:
        - path
        - confidence (integer percentage)
        - reasoning
        
        Ensure the forecasts are realistic, based on the data provided, and appropriate for the current relationship categories and level.
        """
        
        response = anthropic_client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=800,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        response_text = response.content[0].text.strip()
        
        # Extract JSON from response
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].strip()
        else:
            json_str = response_text
        
        forecasts = json.loads(json_str)
        
        # Validate and clean up forecasts
        cleaned_forecasts = []
        for forecast in forecasts:
            if isinstance(forecast, dict) and 'path' in forecast and 'confidence' in forecast and 'reasoning' in forecast:
                # Ensure confidence is an integer
                if isinstance(forecast['confidence'], str) and forecast['confidence'].endswith('%'):
                    forecast['confidence'] = int(forecast['confidence'].rstrip('%'))
                
                cleaned_forecasts.append({
                    "path": forecast['path'],
                    "confidence": int(forecast['confidence']),
                    "reasoning": forecast['reasoning']
                })
        
        # If something went wrong and we have no valid forecasts, provide a default
        if not cleaned_forecasts:
            cleaned_forecasts = [
                {
                    "path": f"Continued {categories[0] if categories else 'relationship'} at current level",
                    "confidence": 80,
                    "reasoning": f"Based on consistent interaction patterns with {name}."
                }
            ]
        
        return cleaned_forecasts
    
    except Exception as e:
        print(f"Error generating forecasts: {e}")
        # Fallback to simple forecast
        return [
            {
                "path": f"Continued {categories[0] if categories else 'relationship'} at current level",
                "confidence": 80,
                "reasoning": f"Based on consistent interaction patterns with {name}."
            }
        ]

def generate_smart_suggestions(
    relationship_id: int, 
    interactions: List[Dict[Any, Any]], 
    relationship_data: Dict[Any, Any]
) -> Dict[str, Any]:
    """
    Generates smart suggestions for a relationship.
    
    Args:
        relationship_id: The ID of the relationship
        interactions: List of interaction objects for the relationship
        relationship_data: Basic relationship data (name, level, etc.)
        
    Returns:
        Dictionary containing smart suggestions
    """
    name = relationship_data.get('name', '')
    
    if not interactions:
        return {
            "suggestions": [
                {
                    "type": "Getting Started",
                    "content": f"Log your first interaction with {name} to start building insights."
                }
            ]
        }
    
    # Sort interactions by date (newest first)
    sorted_interactions = sorted(
        interactions, 
        key=lambda x: datetime.fromisoformat(x['created_at'].replace('Z', '+00:00')), 
        reverse=True
    )
    
    # Check for inactivity
    now = datetime.now(timezone.utc)
    last_interaction_date = datetime.fromisoformat(sorted_interactions[0]['created_at'].replace('Z', '+00:00'))
    days_since_last = (now - last_interaction_date).days
    
    # Generate suggestions based on relationship data
    suggestions = []
    
    # Add reconnection nudge if it's been a while
    if days_since_last > 14:
        suggestions.append({
            "type": "Reconnection Nudge",
            "content": f"You haven't logged anything about {name} in over {days_since_last} days. How are they doing?"
        })
    
    # If we have enough interactions, use AI to generate more sophisticated suggestions
    if len(interactions) >= 3:
        ai_suggestions = generate_ai_suggestions(
            name,
            relationship_data.get('level', 1),
            relationship_data.get('categories', []),
            [i.get('interaction_log', '') for i in sorted_interactions[:10] if i.get('interaction_log')],
            [i.get('sentiment_analysis', '') for i in sorted_interactions[:10] if i.get('sentiment_analysis')],
            days_since_last
        )
        suggestions.extend(ai_suggestions)
    else:
        # For limited data, add a simple reflection prompt
        suggestions.append({
            "type": "Reflection Prompt",
            "content": f"What do you value most about your relationship with {name}?"
        })
    
    # Limit to 4 suggestions maximum
    return {
        "suggestions": suggestions[:4]
    }

def generate_ai_suggestions(
    name: str,
    level: int,
    categories: List[str],
    interaction_logs: List[str],
    sentiment_analyses: List[str],
    days_since_last: int
) -> List[Dict[str, Any]]:
    """
    Uses AI to generate smart suggestions.
    
    Args:
        name: Name of the person
        level: Current relationship level
        categories: List of relationship categories
        interaction_logs: List of recent interaction logs
        sentiment_analyses: List of recent sentiment analyses
        days_since_last: Days since last interaction
        
    Returns:
        List of suggestion dictionaries
    """
    try:
        # Prepare the prompt for Claude
        log_samples = "\n".join(interaction_logs[:5])  # Limit to most recent 5
        sentiment_text = "\n".join(sentiment_analyses[:5])  # Limit to most recent 5
        
        prompt = f"""
        Generate smart suggestions for the relationship with {name}.
        
        Current data:
        - Relationship level: {level} (on a scale of 1-10)
        - Categories: {', '.join(categories)}
        - Days since last interaction: {days_since_last}
        
        Recent interaction logs:
        {log_samples}
        
        Recent sentiment analyses:
        {sentiment_text}
        
        Based on this data, provide 3 suggestions in these categories:
        1. A reflection prompt (a thoughtful question about the relationship)
        2. A memory reminder (referencing something from past interactions)
        3. An evolution opportunity (a suggestion to deepen or evolve the relationship)
        
        Return your suggestions as a JSON array with objects containing:
        - type (one of: "Reflection Prompt", "Memory Reminder", "Evolution Opportunity")
        - content (the actual suggestion text)
        
        Make the suggestions personal, specific to this relationship, and actionable.
        """
        
        response = anthropic_client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=600,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        response_text = response.content[0].text.strip()
        
        # Extract JSON from response
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].strip()
        else:
            json_str = response_text
        
        suggestions = json.loads(json_str)
        
        # Validate and clean up suggestions
        cleaned_suggestions = []
        for suggestion in suggestions:
            if isinstance(suggestion, dict) and 'type' in suggestion and 'content' in suggestion:
                # Ensure type is one of the expected values
                valid_types = ["Reflection Prompt", "Memory Reminder", "Evolution Opportunity", "Reconnection Nudge"]
                if suggestion['type'] not in valid_types:
                    suggestion['type'] = "Reflection Prompt"
                
                cleaned_suggestions.append({
                    "type": suggestion['type'],
                    "content": suggestion['content']
                })
        
        return cleaned_suggestions
    
    except Exception as e:
        print(f"Error generating suggestions: {e}")
        # Fallback to simple suggestions
        return [
            {
                "type": "Reflection Prompt",
                "content": f"What do you value most about your relationship with {name}?"
            },
            {
                "type": "Evolution Opportunity",
                "content": f"Consider planning a new type of activity with {name} to deepen your connection."
            }
        ]

def generate_complete_insights(
    relationship_id: int, 
    interactions: List[Dict[Any, Any]], 
    relationship_data: Dict[Any, Any]
) -> Dict[str, Any]:
    """
    Generates complete insights for a relationship, including all sections.
    
    Args:
        relationship_id: The ID of the relationship
        interactions: List of interaction objects for the relationship
        relationship_data: Basic relationship data (name, level, etc.)
        
    Returns:
        Dictionary containing all insight sections
    """
    # Generate each section
    interaction_trends = generate_interaction_trends(relationship_id, interactions, relationship_data)
    emotional_summary = generate_emotional_summary(relationship_id, interactions, relationship_data)
    relationship_forecasts = generate_relationship_forecasts(relationship_id, interactions, relationship_data)
    smart_suggestions = generate_smart_suggestions(relationship_id, interactions, relationship_data)
    
    # Combine all sections
    return {
        "interaction_trends": interaction_trends,
        "emotional_summary": emotional_summary,
        "relationship_forecasts": relationship_forecasts,
        "smart_suggestions": smart_suggestions,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

def store_insights(
    supabase_client,
    relationship_id: int, 
    insights_data: Dict[str, Any]
) -> bool:
    """
    Stores or updates insights in the database.
    
    Args:
        supabase_client: Supabase client instance
        relationship_id: The ID of the relationship
        insights_data: Complete insights data to store
        
    Returns:
        Boolean indicating success
    """
    try:
        # First, check if the insights table exists
        try:
            # This is a simple query to check if the table exists
            table_check = supabase_client.table('insights').select('count').limit(1).execute()
        except Exception as table_error:
            print(f"Error accessing insights table: {str(table_error)}")
            print("The insights table may not exist. Creating it now...")
            
            # Try to create the insights table if it doesn't exist
            # Note: This is a simplified approach - in production, you'd use migrations
            try:
                # This is a simplified table creation - in a real app, use proper migrations
                create_table_sql = """
                CREATE TABLE IF NOT EXISTS insights (
                    id SERIAL PRIMARY KEY,
                    relationship_id INTEGER NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
                    interaction_trends JSONB,
                    emotional_summary JSONB,
                    relationship_forecasts JSONB,
                    smart_suggestions JSONB,
                    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(relationship_id)
                );
                """
                # Execute raw SQL (if your Supabase client supports it)
                # If not, you'll need to create the table manually or through migrations
                print("Note: Table creation via API is not fully supported. You may need to create the table manually.")
                return False
            except Exception as create_error:
                print(f"Error creating insights table: {str(create_error)}")
                return False
        
        # Check if insights already exist for this relationship
        try:
            existing_response = supabase_client.table('insights').select('id').eq('relationship_id', relationship_id).maybe_single().execute()
            
            if hasattr(existing_response, 'error') and existing_response.error:
                print(f"Error checking for existing insights: {existing_response.error.message}")
                return False
            
            # Prepare data for storage
            storage_data = {
                'relationship_id': relationship_id,
                'interaction_trends': insights_data['interaction_trends'],
                'emotional_summary': insights_data['emotional_summary'],
                'relationship_forecasts': insights_data['relationship_forecasts'],
                'smart_suggestions': insights_data['smart_suggestions'],
                'generated_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Check if we have existing data
            has_existing_data = existing_response is not None and hasattr(existing_response, 'data') and existing_response.data is not None and len(existing_response.data) > 0
            
            if has_existing_data:
                # Update existing insights
                insight_id = existing_response.data['id']
                update_response = supabase_client.table('insights').update(storage_data).eq('id', insight_id).execute()
                
                if hasattr(update_response, 'error') and update_response.error:
                    print(f"Error updating insights: {update_response.error.message}")
                    return False
                    
                print(f"Updated insights for relationship {relationship_id}")
            else:
                # Insert new insights
                insert_response = supabase_client.table('insights').insert(storage_data).execute()
                
                if hasattr(insert_response, 'error') and insert_response.error:
                    print(f"Error inserting insights: {insert_response.error.message}")
                    return False
                    
                print(f"Stored new insights for relationship {relationship_id}")
            
            return True
        except Exception as query_error:
            print(f"Error querying insights: {str(query_error)}")
            return False
            
    except Exception as e:
        print(f"Error storing insights: {str(e)}")
        return False

def generate_and_store_insights(
    supabase_client,
    relationship_id: int
) -> bool:
    """
    Generates and stores insights for a relationship.
    
    Args:
        supabase_client: Supabase client instance
        relationship_id: The ID of the relationship
        
    Returns:
        Boolean indicating success
    """
    try:
        # Fetch relationship data
        rel_response = supabase_client.table('relationships').select("*").eq('id', relationship_id).maybe_single().execute()
        if hasattr(rel_response, 'error') and rel_response.error:
            print(f"Error fetching relationship data: {rel_response.error.message}")
            return False
        if not rel_response.data:
            print(f"Relationship {relationship_id} not found")
            return False
        
        relationship_data = dict(rel_response.data)
        
        # Fetch categories for this relationship
        rc_response = supabase_client.table('relationship_categories').select("categories(name)").eq('relationship_id', relationship_id).execute()
        if not (hasattr(rc_response, 'error') and rc_response.error):
            relationship_data['categories'] = [link['categories']['name'] for link in rc_response.data if link.get('categories')]
        else:
            relationship_data['categories'] = []
            print(f"Warning: Error fetching categories for relationship {relationship_id}")
        
        # Fetch all interactions for this relationship
        interactions_response = supabase_client.table('interactions').select("*").eq('relationship_id', relationship_id).order('created_at', desc=True).execute()
        if hasattr(interactions_response, 'error') and interactions_response.error:
            print(f"Error fetching interactions: {interactions_response.error.message}")
            return False
        
        interactions = [dict(row) for row in interactions_response.data]
        
        # Generate complete insights
        insights = generate_complete_insights(relationship_id, interactions, relationship_data)
        
        # Store insights in database
        return store_insights(supabase_client, relationship_id, insights)
    except Exception as e:
        print(f"Error generating and storing insights: {str(e)}")
        return False

def get_stored_insights(
    supabase_client,
    relationship_id: int,
    max_age_hours: int = 24
) -> Optional[Dict[str, Any]]:
    """
    Retrieves stored insights from the database if they exist and aren't too old.
    
    Args:
        supabase_client: Supabase client instance
        relationship_id: The ID of the relationship
        max_age_hours: Maximum age of insights in hours before regeneration is needed
        
    Returns:
        Insights data dictionary or None if not found or too old
    """
    try:
        # First check if the insights table exists
        try:
            # Try a simple query to check if the table exists
            table_check = supabase_client.table('insights').select('count').limit(1).execute()
        except Exception as table_error:
            print(f"Error accessing insights table: {str(table_error)}")
            print("The insights table may not exist.")
            return None
            
        # Fetch insights for this relationship
        try:
            insights_response = supabase_client.table('insights').select("*").eq('relationship_id', relationship_id).maybe_single().execute()
            
            if hasattr(insights_response, 'error') and insights_response.error:
                print(f"Error fetching insights: {insights_response.error.message}")
                return None
            
            # Check if we have data - ensure insights_response is not None and has data attribute
            if not insights_response or not hasattr(insights_response, 'data') or not insights_response.data:
                print(f"No stored insights found for relationship {relationship_id}")
                return None
            
            insights_data = dict(insights_response.data)
            
            # Check if insights are too old
            generated_at = datetime.fromisoformat(insights_data['generated_at'].replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            age_hours = (now - generated_at).total_seconds() / 3600
            
            if age_hours > max_age_hours:
                print(f"Stored insights for relationship {relationship_id} are {age_hours:.1f} hours old (max {max_age_hours})")
                return None
            
            # Format the response to match the API format
            return {
                "interaction_trends": insights_data['interaction_trends'],
                "emotional_summary": insights_data['emotional_summary'],
                "relationship_forecasts": insights_data['relationship_forecasts'],
                "smart_suggestions": insights_data['smart_suggestions'],
                "generated_at": insights_data['generated_at']
            }
        except Exception as query_error:
            print(f"Error querying insights: {str(query_error)}")
            return None
            
    except Exception as e:
        print(f"Error retrieving stored insights: {str(e)}")
        return None
