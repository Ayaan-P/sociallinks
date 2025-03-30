import os
from dotenv import load_dotenv
from anthropic import Anthropic
import json
from datetime import datetime, timedelta

load_dotenv()

def get_relationship_tree_data(supabase, relationship_id):
    """
    Generates tree data for a relationship based on its categories, level, and interaction history.
    
    Args:
        supabase: Supabase client instance
        relationship_id: ID of the relationship
        
    Returns:
        dict: Tree data structure with trunk, branches, rings, leaves, blossoms, and fireflies
    """
    try:
        # Get relationship data
        rel_response = supabase.table('relationships').select("level, xp, name, created_at").eq('id', relationship_id).single().execute()
        if hasattr(rel_response, 'error') and rel_response.error:
            raise Exception(f"Error fetching relationship: {rel_response.error.message}")
        
        relationship_data = rel_response.data
        current_level = relationship_data.get('level', 1)
        current_xp = relationship_data.get('xp', 0)
        relationship_name = relationship_data.get('name', 'Person')
        relationship_start_date = relationship_data.get('created_at')
        
        # Get categories for this relationship
        rc_response = supabase.table('relationship_categories').select("categories(id, name)").eq('relationship_id', relationship_id).execute()
        if hasattr(rc_response, 'error') and rc_response.error:
            raise Exception(f"Error fetching categories: {rc_response.error.message}")
        
        active_categories = [link['categories']['name'] for link in rc_response.data if link.get('categories')]
        
        # Get milestone interactions (pinned or high XP)
        milestone_interactions_response = supabase.table('interactions').select("id, interaction_log, sentiment_analysis, created_at").eq('relationship_id', relationship_id).eq('is_milestone', True).order('created_at', desc=True).limit(10).execute()
        
        # If no explicit milestones, get high XP interactions
        if not milestone_interactions_response.data or len(milestone_interactions_response.data) == 0:
            milestone_interactions_response = supabase.table('interactions').select("id, interaction_log, sentiment_analysis, created_at, xp_gain").eq('relationship_id', relationship_id).order('xp_gain', desc=True).limit(10).execute()
        
        milestone_interactions = milestone_interactions_response.data if not hasattr(milestone_interactions_response, 'error') else []
        
        # Get category history to determine branches and their evolution
        category_history_response = supabase.table('category_history').select("category_id, categories(name), created_at").eq('relationship_id', relationship_id).order('created_at', asc).execute()
        category_history = category_history_response.data if not hasattr(category_history_response, 'error') else []
        
        # Get completed quests for blossoms
        completed_quests_response = supabase.table('quests').select("id, quest_description, completion_date, milestone_level").eq('relationship_id', relationship_id).eq('quest_status', 'completed').order('completion_date', desc=True).limit(10).execute()
        completed_quests = completed_quests_response.data if not hasattr(completed_quests_response, 'error') else []
        
        # Get level history for ring visualization
        level_history_response = supabase.table('level_history').select("old_level, new_level, created_at").eq('relationship_id', relationship_id).order('created_at', asc).execute()
        level_history = level_history_response.data if not hasattr(level_history_response, 'error') else []
        
        # Determine trunk (original category)
        trunk = None
        if category_history and len(category_history) > 0:
            first_category = category_history[0]
            if first_category.get('categories'):
                trunk = first_category['categories']['name']
        
        # If no history or couldn't determine trunk, use first active category
        if not trunk and active_categories:
            trunk = active_categories[0]
        
        # Determine branches (evolved categories) with their evolution history
        branches = []
        evolution_history = []
        
        if len(active_categories) > 1 and trunk:
            # Filter out the trunk category
            branch_categories = [cat for cat in active_categories if cat != trunk]
            
            # For each branch, find when it was added from category_history
            for branch in branch_categories:
                branch_history = next((ch for ch in category_history if ch.get('categories') and ch['categories']['name'] == branch), None)
                
                if branch_history:
                    # Calculate at what level this branch was added
                    branch_date = branch_history.get('created_at')
                    level_at_branch = 1  # Default
                    
                    # Find the level at the time this branch was added
                    for lh in level_history:
                        if lh.get('created_at') and lh['created_at'] <= branch_date:
                            level_at_branch = lh.get('new_level', 1)
                    
                    evolution_history.append({
                        'category': branch,
                        'unlocked_at': f"Level {level_at_branch}",
                        'date': branch_date
                    })
                
                branches.append(branch)
        
        # Generate leaves from milestone interactions
        leaves = []
        for interaction in milestone_interactions:
            if interaction.get('interaction_log'):
                # Create a short summary (first 50 chars)
                summary = interaction['interaction_log'][:50] + "..." if len(interaction['interaction_log']) > 50 else interaction['interaction_log']
                
                leaves.append({
                    'id': interaction.get('id'),
                    'summary': summary,
                    'sentiment': interaction.get('sentiment_analysis', 'Neutral'),
                    'date': interaction.get('created_at'),
                    'type': 'milestone'
                })
        
        # Generate blossoms from completed quests
        blossoms = []
        for quest in completed_quests:
            if quest.get('quest_description') and quest.get('completion_date'):
                # Determine which category this quest is most related to
                quest_category = trunk  # Default to trunk
                
                # If it's a milestone quest, it might be related to a specific category
                if quest.get('milestone_level'):
                    # Try to match with evolution history
                    for eh in evolution_history:
                        if eh.get('unlocked_at') == f"Level {quest.get('milestone_level')}":
                            quest_category = eh.get('category', trunk)
                            break
                
                blossoms.append({
                    'id': quest.get('id'),
                    'description': quest.get('quest_description'),
                    'completed_on': quest.get('completion_date'),
                    'category': quest_category,
                    'milestone_level': quest.get('milestone_level')
                })
        
        # Determine potential categories (fireflies)
        fireflies = []
        
        # Get all available categories
        all_categories_response = supabase.table('categories').select("id, name").execute()
        if not hasattr(all_categories_response, 'error') and all_categories_response.data:
            all_categories = all_categories_response.data
            
            # Filter out already active categories
            potential_categories = [cat for cat in all_categories if cat['name'] not in active_categories]
            
            # Get recent interactions for evolution suggestions
            recent_interactions_response = supabase.table('interactions').select("evolution_suggestion").eq('relationship_id', relationship_id).order('created_at', desc=True).limit(10).execute()
            recent_interactions = recent_interactions_response.data if not hasattr(recent_interactions_response, 'error') else []
            
            # Check for evolution suggestions in recent interactions
            suggested_categories = []
            for interaction in recent_interactions:
                if interaction.get('evolution_suggestion') and interaction['evolution_suggestion'] not in active_categories:
                    suggested_categories.append(interaction['evolution_suggestion'])
            
            # Get unique suggestions
            unique_suggestions = list(set(suggested_categories))
            
            # Prioritize suggested categories
            for suggestion in unique_suggestions:
                matching_category = next((cat for cat in potential_categories if cat['name'] == suggestion), None)
                if matching_category:
                    fireflies.append({
                        'category': matching_category['name'],
                        'id': matching_category['id'],
                        'suggested_by_ai': True
                    })
            
            # Add other potential categories (up to 3 total)
            remaining_slots = 3 - len(fireflies)
            if remaining_slots > 0:
                # Filter out categories already in fireflies
                firefly_names = [f['category'] for f in fireflies]
                remaining_categories = [cat for cat in potential_categories if cat['name'] not in firefly_names]
                
                # Add remaining categories (up to the limit)
                for cat in remaining_categories[:remaining_slots]:
                    fireflies.append({
                        'category': cat['name'],
                        'id': cat['id'],
                        'suggested_by_ai': False
                    })
        
        # Calculate rings data (level progression)
        rings = []
        for level in range(1, current_level + 1):
            # Find when this level was reached
            level_reached_date = None
            for lh in level_history:
                if lh.get('new_level') == level:
                    level_reached_date = lh.get('created_at')
                    break
            
            rings.append({
                'level': level,
                'date_reached': level_reached_date,
                'completed': True
            })
        
        # Add current level progress if not at max level
        if current_level < 10:
            # Calculate XP progress for current level
            from services.leveling_system import get_xp_progress_in_level
            xp_earned, xp_needed = get_xp_progress_in_level(current_xp, current_level)
            progress_percentage = (xp_earned / xp_needed) * 100 if xp_needed > 0 else 0
            
            rings.append({
                'level': current_level + 1,
                'progress_percentage': progress_percentage,
                'completed': False
            })
        
        # Build the complete tree data structure
        tree_data = {
            'person_id': relationship_id,
            'name': relationship_name,
            'base_category': trunk,
            'active_categories': active_categories,
            'level': current_level,
            'xp': current_xp,
            'trunk': trunk,
            'branches': branches,
            'rings': rings,
            'leaves': leaves,
            'blossoms': blossoms,
            'fireflies': fireflies,
            'evolution_history': evolution_history,
            'relationship_age_days': calculate_relationship_age(relationship_start_date),
            'is_complete': current_level >= 10
        }
        
        return tree_data
        
    except Exception as e:
        print(f"Error generating tree data: {str(e)}")
        # Return a basic structure even if there's an error
        return {
            'person_id': relationship_id,
            'trunk': active_categories[0] if 'active_categories' in locals() and active_categories else "Friend",
            'branches': active_categories[1:] if 'active_categories' in locals() and len(active_categories) > 1 else [],
            'level': current_level if 'current_level' in locals() else 1,
            'xp': current_xp if 'current_xp' in locals() else 0,
            'leaves': [],
            'blossoms': [],
            'fireflies': [],
            'rings': [{'level': 1, 'completed': True}],
            'evolution_history': [],
            'is_complete': False
        }

def calculate_relationship_age(start_date_str):
    """Calculate the age of a relationship in days"""
    if not start_date_str:
        return 0
    
    try:
        # Parse the date string (handle different formats)
        if 'T' in start_date_str:
            # ISO format with time
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        else:
            # Date only format
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        
        # Calculate days difference
        days_diff = (datetime.now() - start_date).days
        return max(0, days_diff)  # Ensure non-negative
    except Exception as e:
        print(f"Error calculating relationship age: {str(e)}")
        return 0

def suggest_tree_evolution(supabase, relationship_id):
    """
    Suggests potential evolution paths for the relationship tree.
    
    Args:
        supabase: Supabase client instance
        relationship_id: ID of the relationship
        
    Returns:
        dict: Evolution suggestions with reasoning
    """
    try:
        # Get relationship data
        rel_response = supabase.table('relationships').select("level, xp").eq('id', relationship_id).single().execute()
        if hasattr(rel_response, 'error') and rel_response.error:
            raise Exception(f"Error fetching relationship: {rel_response.error.message}")
        
        relationship_data = rel_response.data
        current_level = relationship_data.get('level', 1)
        current_xp = relationship_data.get('xp', 0)
        
        # Get categories for this relationship
        rc_response = supabase.table('relationship_categories').select("categories(name)").eq('relationship_id', relationship_id).execute()
        if hasattr(rc_response, 'error') and rc_response.error:
            raise Exception(f"Error fetching categories: {rc_response.error.message}")
        
        current_categories = [link['categories']['name'] for link in rc_response.data if link.get('categories')]
        
        # Get recent interactions
        interactions_response = supabase.table('interactions').select("interaction_log, sentiment_analysis, evolution_suggestion, created_at").eq('relationship_id', relationship_id).order('created_at', desc=True).limit(10).execute()
        
        recent_interactions = interactions_response.data if not hasattr(interactions_response, 'error') else []
        
        # Check for evolution suggestions in recent interactions
        evolution_suggestions = []
        for interaction in recent_interactions:
            if interaction.get('evolution_suggestion') and interaction['evolution_suggestion'] not in current_categories:
                evolution_suggestions.append({
                    'category': interaction['evolution_suggestion'],
                    'date_suggested': interaction.get('created_at'),
                    'sentiment_context': interaction.get('sentiment_analysis', 'Neutral')
                })
        
        # Get unique suggestions (keep the most recent for each category)
        unique_suggestions = {}
        for suggestion in evolution_suggestions:
            category = suggestion['category']
            if category not in unique_suggestions or suggestion['date_suggested'] > unique_suggestions[category]['date_suggested']:
                unique_suggestions[category] = suggestion
        
        # Convert back to list and sort by recency
        sorted_suggestions = sorted(
            unique_suggestions.values(), 
            key=lambda x: x['date_suggested'] if x.get('date_suggested') else '', 
            reverse=True
        )
        
        # Determine evolution triggers
        evolution_triggers = []
        
        # Level-based triggers
        if current_level >= 4 and len(current_categories) < 3:
            evolution_triggers.append({
                'type': 'level',
                'description': f"Reached Level {current_level}",
                'unlocks': "New category branch"
            })
        
        # XP milestone triggers
        xp_milestones = [50, 100, 200, 350, 500]
        for milestone in xp_milestones:
            if current_xp >= milestone and milestone not in [t.get('milestone') for t in evolution_triggers if t.get('type') == 'xp']:
                evolution_triggers.append({
                    'type': 'xp',
                    'milestone': milestone,
                    'description': f"Reached {milestone} XP",
                    'unlocks': "Category evolution opportunity"
                })
        
        # Build the evolution data
        evolution_data = {
            'current_level': current_level,
            'current_xp': current_xp,
            'current_categories': current_categories,
            'suggested_categories': sorted_suggestions[:3],  # Limit to 3 suggestions
            'evolution_triggers': evolution_triggers,
            'can_evolve': current_level >= 4 and len(current_categories) < 3,
            'max_categories_reached': len(current_categories) >= 3,
            'next_evolution_level': 4 if current_level < 4 else 7 if current_level < 7 else 10
        }
        
        return evolution_data
        
    except Exception as e:
        print(f"Error generating evolution suggestions: {str(e)}")
        return {
            'current_level': 1,
            'current_xp': 0,
            'current_categories': [],
            'suggested_categories': [],
            'evolution_triggers': [],
            'can_evolve': False,
            'max_categories_reached': False,
            'next_evolution_level': 4
        }

def get_tree_completion_status(supabase, relationship_id):
    """
    Gets the completion status of a relationship tree.
    
    Args:
        supabase: Supabase client instance
        relationship_id: ID of the relationship
        
    Returns:
        dict: Tree completion status and rewards
    """
    try:
        # Get relationship data
        rel_response = supabase.table('relationships').select("level, name").eq('id', relationship_id).single().execute()
        if hasattr(rel_response, 'error') and rel_response.error:
            raise Exception(f"Error fetching relationship: {rel_response.error.message}")
        
        relationship_data = rel_response.data
        current_level = relationship_data.get('level', 1)
        name = relationship_data.get('name', 'Person')
        
        # Check if tree is complete (level 10)
        is_complete = current_level >= 10
        
        # Get total interactions count
        interactions_count_response = supabase.table('interactions').select("id").eq('relationship_id', relationship_id).execute()
        total_interactions = len(interactions_count_response.data) if not hasattr(interactions_count_response, 'error') else 0
        
        # Get completed quests count
        quests_count_response = supabase.table('quests').select("id").eq('relationship_id', relationship_id).eq('quest_status', 'completed').execute()
        completed_quests = len(quests_count_response.data) if not hasattr(quests_count_response, 'error') else 0
        
        # Get categories
        rc_response = supabase.table('relationship_categories').select("categories(name)").eq('relationship_id', relationship_id).execute()
        categories = [link['categories']['name'] for link in rc_response.data if link.get('categories')] if not hasattr(rc_response, 'error') else []
        
        # Build completion rewards
        completion_rewards = []
        
        if is_complete:
            completion_rewards = [
                {
                    'type': 'memory_book',
                    'title': f"Journey with {name}",
                    'description': "A complete record of your relationship journey",
                    'unlocked': True
                },
                {
                    'type': 'golden_tree',
                    'title': "Golden Tree Achievement",
                    'description': "Your relationship tree has reached its final form",
                    'unlocked': True
                },
                {
                    'type': 'reflection_prompt',
                    'title': "Deep Reflection",
                    'description': "Special AI-generated insights about your relationship journey",
                    'unlocked': True
                }
            ]
        
        # Build the completion data
        completion_data = {
            'is_complete': is_complete,
            'level': current_level,
            'name': name,
            'total_interactions': total_interactions,
            'completed_quests': completed_quests,
            'categories': categories,
            'completion_percentage': min(100, (current_level / 10) * 100),
            'completion_rewards': completion_rewards,
            'can_export': is_complete
        }
        
        return completion_data
        
    except Exception as e:
        print(f"Error getting tree completion status: {str(e)}")
        return {
            'is_complete': False,
            'level': 1,
            'completion_percentage': 10,
            'completion_rewards': [],
            'can_export': False
        }
