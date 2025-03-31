from datetime import datetime, timezone
import statistics
from typing import Dict, List, Optional, Any, Set

# Define category colors
CATEGORY_COLORS = {
    "Friend": "#1abc9c",    # Turquoise
    "Family": "#9b59b6",    # Amethyst
    "Romantic": "#e74c3c",  # Alizarin
    "Business": "#3498db",  # Peter River
    "Mentor": "#f1c40f",    # Sunflower
    "Mentee": "#f39c12",    # Orange
    "Acquaintance": "#bdc3c7", # Silver
    "Other": "#7f8c8d"      # Asbestos
}

def calculate_days_diff(date_str: Optional[str]) -> Optional[int]:
    """
    Calculate days difference between a date string and current date.
    Handles various date formats and timezone information.
    
    Args:
        date_str: ISO format date string, potentially with timezone info
        
    Returns:
        Number of days difference or None if date_str is None or parsing fails
    """
    if not date_str:
        return None
        
    try:
        # Try to parse the date with various formats
        date_obj = None
        
        # Handle different date formats
        if '+' in date_str:  # Has timezone info
            # Remove colon from timezone offset if present
            if len(date_str) > 6 and ':' == date_str[-3:-2]:
                date_str = date_str[:-3] + date_str[-2:]
                
            if '.' in date_str:  # Has microseconds
                date_obj = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S.%f%z")
            else:
                date_obj = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S%z")
        else:  # No timezone info, assume UTC
            if '.' in date_str:  # Has microseconds
                try:
                    date_obj = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S.%f")
                except ValueError:
                    # Try truncating microseconds
                    date_obj = datetime.strptime(date_str.split('.')[0], "%Y-%m-%dT%H:%M:%S")
            else:
                date_obj = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S")
            
            # Add UTC timezone
            date_obj = date_obj.replace(tzinfo=timezone.utc)
            
        if not date_obj:
            return None
            
        # Calculate difference
        now_aware = datetime.now(timezone.utc)
        time_difference = now_aware - date_obj
        return time_difference.days
        
    except Exception as e:
        print(f"Error parsing date '{date_str}': {e}")
        return None

def is_fading(days_since: Optional[int], interval: Optional[str]) -> bool:
    """
    Determine if a relationship is fading based on days since last interaction
    and the expected interaction interval.
    
    Args:
        days_since: Days since last interaction, or None if never interacted
        interval: Expected interaction interval (daily, weekly, etc.)
        
    Returns:
        True if relationship is considered fading, False otherwise
    """
    if days_since is None or not interval:
        return True  # Consider fading if never interacted or no interval set
    
    threshold_days = {
        'daily': 3,
        'weekly': 14,
        'biweekly': 28,
        'monthly': 60
    }.get(interval.lower(), 90)  # Default threshold if interval is unknown
    
    return days_since > threshold_days

def get_global_tree_data(supabase) -> Dict[str, Any]:
    """
    Generate the Global Tree data structure by processing relationship data,
    interactions, and quests from the database.
    
    Args:
        supabase: Initialized Supabase client
        
    Returns:
        Dictionary containing the Global Tree data structure
    """
    if not supabase:
        raise Exception("Supabase is not initialized.")

    # 1. Fetch all relationships with categories, level, reminder_interval
    rel_response = supabase.table('relationships').select(
        "id, name, level, reminder_interval, relationship_categories(categories(id, name))"
    ).execute()
    
    if hasattr(rel_response, 'error') and rel_response.error:
        raise Exception(f"Supabase error fetching relationships: {rel_response.error.message}")
    
    relationships_raw = rel_response.data

    # 2. Fetch all interactions (id, relationship_id, created_at)
    interactions_response = supabase.table('interactions').select(
        "id, relationship_id, created_at"
    ).order('created_at', desc=True).execute()
    
    if hasattr(interactions_response, 'error') and interactions_response.error:
        raise Exception(f"Supabase error fetching interactions: {interactions_response.error.message}")
    
    interactions_raw = interactions_response.data

    # 3. Fetch all active quests (relationship_id)
    quests_response = supabase.table('quests').select(
        "relationship_id"
    ).neq('quest_status', 'completed').execute()
    
    if hasattr(quests_response, 'error') and quests_response.error:
        raise Exception(f"Supabase error fetching quests: {quests_response.error.message}")
    
    active_quest_rel_ids = {q['relationship_id'] for q in quests_response.data}

    # --- Process Data ---

    # Find the latest interaction date for each relationship efficiently
    latest_interaction_dates = {}
    processed_rel_ids = set()
    
    for interaction in interactions_raw:  # Already sorted desc by created_at
        rel_id = interaction['relationship_id']
        if rel_id not in processed_rel_ids:
            latest_interaction_dates[rel_id] = interaction['created_at']
            processed_rel_ids.add(rel_id)

    # Group relationships by category
    relationships_by_category = {}
    all_levels = []  # For root strength calculation
    
    for rel_data in relationships_raw:
        rel_id = rel_data['id']
        level = rel_data.get('level', 1)
        reminder_interval = rel_data.get('reminder_interval')
        all_levels.append(level)

        # Calculate recency
        latest_date_str = latest_interaction_dates.get(rel_id)
        last_interaction_days = calculate_days_diff(latest_date_str)

        # Determine fading status
        fading = is_fading(last_interaction_days, reminder_interval)

        # Check for active quest
        has_active_quest = rel_id in active_quest_rel_ids

        # Prepare node data
        node_data = {
            "id": rel_id,
            "name": rel_data['name'],
            "level": level,
            "lastInteractionDays": last_interaction_days,
            "isFading": fading,
            "hasActiveQuest": has_active_quest
        }

        # Assign to categories
        categories = rel_data.get('relationship_categories', [])
        assigned_to_category = False
        
        if categories:
            for cat_link in categories:
                category_info = cat_link.get('categories')
                if category_info and category_info.get('name'):
                    category_name = category_info['name']
                    if category_name not in relationships_by_category:
                        relationships_by_category[category_name] = []
                    relationships_by_category[category_name].append(node_data)
                    assigned_to_category = True

        # Assign to 'Other' if no category or category data missing
        if not assigned_to_category:
            if "Other" not in relationships_by_category:
                relationships_by_category["Other"] = []
            relationships_by_category["Other"].append(node_data)

    # --- Build Branches ---
    branches = []
    
    for category_name, nodes in relationships_by_category.items():
        if not nodes:
            continue

        total_level_sum = sum(node['level'] for node in nodes)
        relationship_count = len(nodes)

        # Calculate average recency (ignoring None values)
        recencies = [node['lastInteractionDays'] for node in nodes if node['lastInteractionDays'] is not None]
        average_recency_days = round(statistics.mean(recencies), 1) if recencies else None

        branch_data = {
            "id": category_name,
            "category": category_name,
            "color": CATEGORY_COLORS.get(category_name, CATEGORY_COLORS["Other"]),
            "totalLevelSum": total_level_sum,
            "relationshipCount": relationship_count,
            "averageRecencyDays": average_recency_days,
            "relationships": nodes
        }
        branches.append(branch_data)

    # --- Calculate Root Strength & Identity Tags ---
    # Root strength based on average level (scaled to 0-100)
    root_strength = int(statistics.mean(all_levels) * 10) if all_levels else 50
    root_strength = max(0, min(100, root_strength))  # Clamp between 0-100

    # Identity tags based on top categories by count
    sorted_branches = sorted(branches, key=lambda b: b['relationshipCount'], reverse=True)
    identity_tags = [b['category'] for b in sorted_branches[:2]]  # Top 2 categories
    
    if not identity_tags:
        identity_tags = ["Developing Network"]

    # --- Construct Final Response ---
    global_tree_response = {
        "userId": "user_1",  # Placeholder - could be replaced with actual user ID
        "rootStrength": root_strength,
        "identityTags": identity_tags,
        "branches": branches,
        "generatedAt": datetime.now(timezone.utc).isoformat()
    }

    return global_tree_response
