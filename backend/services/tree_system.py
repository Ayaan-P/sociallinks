import os
from dotenv import load_dotenv
from anthropic import Anthropic
import json

load_dotenv()

def get_relationship_tree_data(supabase, relationship_id):
    """
    Generates tree data for a relationship based on its categories, level, and interaction history.
    
    Args:
        supabase: Supabase client instance
        relationship_id: ID of the relationship
        
    Returns:
        dict: Tree data structure with trunk, branches, rings, and leaves
    """
    try:
        # Get relationship data
        rel_response = supabase.table('relationships').select("level, xp").eq('id', relationship_id).single().execute()
        if hasattr(rel_response, 'error') and rel_response.error:
            raise Exception(f"Error fetching relationship: {rel_response.error.message}")
        
        relationship_data = rel_response.data
        current_level = relationship_data.get('level', 1)
        
        # Get categories for this relationship
        rc_response = supabase.table('relationship_categories').select("categories(id, name)").eq('relationship_id', relationship_id).execute()
        if hasattr(rc_response, 'error') and rc_response.error:
            raise Exception(f"Error fetching categories: {rc_response.error.message}")
        
        active_categories = [link['categories']['name'] for link in rc_response.data if link.get('categories')]
        
        # Get milestone interactions (pinned or high XP)
        milestone_interactions_response = supabase.table('interactions').select("id, interaction_log, sentiment_analysis, created_at").eq('relationship_id', relationship_id).eq('is_milestone', True).order('created_at', desc=True).limit(5).execute()
        
        # If no explicit milestones, get high XP interactions
        if not milestone_interactions_response.data or len(milestone_interactions_response.data) == 0:
            milestone_interactions_response = supabase.table('interactions').select("id, interaction_log, sentiment_analysis, created_at, xp_gain").eq('relationship_id', relationship_id).order('xp_gain', desc=True).limit(5).execute()
        
        milestone_interactions = milestone_interactions_response.data if not hasattr(milestone_interactions_response, 'error') else []
        
        # Get category history to determine branches
        category_history_response = supabase.table('category_history').select("category_id, categories(name), created_at").eq('relationship_id', relationship_id).order('created_at', asc).execute()
        category_history = category_history_response.data if not hasattr(category_history_response, 'error') else []
        
        # Determine trunk (original category)
        trunk = None
        if category_history and len(category_history) > 0:
            first_category = category_history[0]
            if first_category.get('categories'):
                trunk = first_category['categories']['name']
        
        # If no history or couldn't determine trunk, use first active category
        if not trunk and active_categories:
            trunk = active_categories[0]
        
        # Determine branches (evolved categories)
        branches = []
        if len(active_categories) > 1 and trunk:
            branches = [cat for cat in active_categories if cat != trunk]
        
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
                    'date': interaction.get('created_at')
                })
        
        # Determine potential categories (buds)
        potential_categories = []
        
        # Get all available categories
        all_categories_response = supabase.table('categories').select("name").execute()
        if not hasattr(all_categories_response, 'error') and all_categories_response.data:
            all_category_names = [cat['name'] for cat in all_categories_response.data]
            
            # Filter out already active categories
            potential_categories = [cat for cat in all_category_names if cat not in active_categories]
            
            # Limit to 3 potential categories
            potential_categories = potential_categories[:3]
        
        # Build the tree data structure
        tree_data = {
            'trunk': trunk,
            'branches': branches,
            'level': current_level,
            'leaves': leaves,
            'buds': potential_categories
        }
        
        return tree_data
        
    except Exception as e:
        print(f"Error generating tree data: {str(e)}")
        # Return a basic structure even if there's an error
        return {
            'trunk': active_categories[0] if active_categories else "Friend",
            'branches': active_categories[1:] if len(active_categories) > 1 else [],
            'level': current_level,
            'leaves': [],
            'buds': []
        }

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
        rel_response = supabase.table('relationships').select("level").eq('id', relationship_id).single().execute()
        if hasattr(rel_response, 'error') and rel_response.error:
            raise Exception(f"Error fetching relationship: {rel_response.error.message}")
        
        relationship_data = rel_response.data
        current_level = relationship_data.get('level', 1)
        
        # Get categories for this relationship
        rc_response = supabase.table('relationship_categories').select("categories(name)").eq('relationship_id', relationship_id).execute()
        if hasattr(rc_response, 'error') and rc_response.error:
            raise Exception(f"Error fetching categories: {rc_response.error.message}")
        
        current_categories = [link['categories']['name'] for link in rc_response.data if link.get('categories')]
        
        # Get recent interactions
        interactions_response = supabase.table('interactions').select("interaction_log, sentiment_analysis, evolution_suggestion").eq('relationship_id', relationship_id).order('created_at', desc=True).limit(5).execute()
        
        recent_interactions = interactions_response.data if not hasattr(interactions_response, 'error') else []
        
        # Check for evolution suggestions in recent interactions
        evolution_suggestions = []
        for interaction in recent_interactions:
            if interaction.get('evolution_suggestion') and interaction['evolution_suggestion'] not in current_categories:
                evolution_suggestions.append(interaction['evolution_suggestion'])
        
        # Get unique suggestions
        unique_suggestions = list(set(evolution_suggestions))
        
        # Build the evolution data
        evolution_data = {
            'current_level': current_level,
            'current_categories': current_categories,
            'suggested_categories': unique_suggestions[:3],  # Limit to 3 suggestions
            'can_evolve': current_level >= 4 and len(current_categories) < 3
        }
        
        return evolution_data
        
    except Exception as e:
        print(f"Error generating evolution suggestions: {str(e)}")
        return {
            'current_level': 1,
            'current_categories': [],
            'suggested_categories': [],
            'can_evolve': False
        }
