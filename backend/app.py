import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from supabase import create_client, Client
from services.ai_processing import analyze_sentiment, calculate_xp, get_relationship_level, update_relationship_level, process_interaction_log_ai, detect_patterns, suggest_evolution, suggest_interaction
from services.quest_generation import generate_quest, generate_milestone_quest, generate_recurring_quest
from services.leveling_system import calculate_level, get_xp_progress_in_level # Import the new leveling functions
from services.tree_system import get_relationship_tree_data, suggest_tree_evolution, get_tree_completion_status # Import tree system functions
from services.ai_insights import generate_interaction_trends, generate_emotional_summary, generate_relationship_forecasts, generate_smart_suggestions, generate_complete_insights, get_stored_insights, generate_and_store_insights
from services.global_tree_service import get_global_tree_data # Import the global tree service
from datetime import datetime, timezone, timedelta
import statistics # For calculating average

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Get Supabase credentials from environment variables
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# Check if Supabase credentials are provided
if not url or not key or url == "YOUR_SUPABASE_URL" or key == "YOUR_SUPABASE_KEY":
    print("Warning: SUPABASE_URL and SUPABASE_KEY are not set or are default values in the .env file.")
    # You might want to raise an error or handle this case differently depending on your needs
    # For now, we'll allow the app to run but Supabase operations will fail.
    supabase = None
else:
    # Initialize Supabase client
    supabase: Client = create_client(url, key)

# Basic route to check if the app is running
@app.route('/')
def home():
    return jsonify({"message": "Flask backend is running!"})

# --- Relationship Endpoints ---

@app.route('/relationships', methods=['POST'])
def create_relationship():
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    data = request.get_json()
    if not data or not all(k in data for k in ("name", "relationship_type", "reminder_interval", "initial_category_name")):
        return jsonify({"error": "Missing required fields: name, relationship_type, reminder_interval, initial_category_name"}), 400

    name = data['name']
    relationship_type = data['relationship_type']
    reminder_interval = data['reminder_interval']
    initial_category_name = data['initial_category_name']
    photo_url = data.get('photo_url')
    tags_input = data.get('tags', [])
    bio = data.get('bio')
    birthday = data.get('birthday')
    phone = data.get('phone')
    email = data.get('email')
    location = data.get('location')
    preferred_communication = data.get('preferred_communication')
    meeting_frequency = data.get('meeting_frequency')
    notes = data.get('notes')

    try:
        category_response = supabase.table('categories').select('id').eq('name', initial_category_name).limit(1).execute()
        if hasattr(category_response, 'error') and category_response.error:
             return jsonify({"error": f"Error finding category '{initial_category_name}': {category_response.error.message}"}), 500
        if not category_response.data:
            return jsonify({"error": f"Initial category '{initial_category_name}' not found."}), 400
        initial_category_id = category_response.data[0]['id']

        rel_response = supabase.table('relationships').insert({
            'name': name, 'bio': bio, 'birthday': birthday, 'phone': phone, 'email': email,
            'location': location, 'preferred_communication': preferred_communication,
            'meeting_frequency': meeting_frequency, 'notes': notes,
            'relationship_type': relationship_type, 'reminder_interval': reminder_interval,
            'category': initial_category_name, # Keep for now, might be redundant with junction table
            'photo_url': photo_url, 'level': 1, 'xp': 0
        }).execute()

        if hasattr(rel_response, 'error') and rel_response.error:
            return jsonify({"error": f"Error creating relationship: {rel_response.error.message}"}), 500
        if not rel_response.data:
            return jsonify({"error": "Failed to create relationship base record"}), 500

        new_relationship = rel_response.data[0]
        new_relationship_id = new_relationship['id']

        rc_response = supabase.table('relationship_categories').insert({
            'relationship_id': new_relationship_id, 'category_id': initial_category_id
        }).execute()

        if hasattr(rc_response, 'error') and rc_response.error:
            supabase.table('relationships').delete().eq('id', new_relationship_id).execute()
            return jsonify({"error": f"Error linking initial category: {rc_response.error.message}"}), 500

        new_relationship['categories'] = [initial_category_name]
        return jsonify(new_relationship), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/relationships', methods=['GET'])
def get_relationships():
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        rel_response = supabase.table('relationships').select("*").execute()
        if hasattr(rel_response, 'error') and rel_response.error: return jsonify({"error": f"Error fetching relationships: {rel_response.error.message}"}), 500
        relationships = rel_response.data

        rc_response = supabase.table('relationship_categories').select("relationship_id, categories(id, name)").execute()
        if hasattr(rc_response, 'error') and rc_response.error: return jsonify({"error": f"Error fetching relationship categories: {rc_response.error.message}"}), 500
        
        categories_map = {}
        for link in rc_response.data:
            rel_id = link['relationship_id']
            if rel_id not in categories_map: categories_map[rel_id] = []
            if link.get('categories'): categories_map[rel_id].append(link['categories']['name'])

        result_list = []
        for rel in relationships:
            rel_dict = dict(rel)
            rel_dict['categories'] = categories_map.get(rel['id'], [])
            rel_dict.pop('category', None)
            result_list.append(rel_dict)
        return jsonify(result_list), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/relationships/<int:relationship_id>', methods=['GET'])
def get_relationship(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        rel_response = supabase.table('relationships').select("*").eq('id', relationship_id).maybe_single().execute()
        if hasattr(rel_response, 'error') and rel_response.error: return jsonify({"error": f"Error fetching relationship: {rel_response.error.message}"}), 500
        if not rel_response.data: return jsonify({"error": "Relationship not found"}), 404
        relationship_data = dict(rel_response.data)

        rc_response = supabase.table('relationship_categories').select("categories(id, name)").eq('relationship_id', relationship_id).execute()
        if hasattr(rc_response, 'error') and rc_response.error:
             print(f"Warning: Error fetching categories for relationship {relationship_id}: {rc_response.error.message}")
             relationship_data['categories'] = []
        else:
             relationship_data['categories'] = [link['categories']['name'] for link in rc_response.data if link.get('categories')]
        relationship_data.pop('category', None)
        return jsonify(relationship_data), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/relationships/<int:relationship_id>', methods=['PUT'])
def update_relationship(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    data = request.get_json()
    if not data: return jsonify({"error": "No data provided for update"}), 400

    # Log the incoming data for debugging
    print(f"Updating relationship {relationship_id} with data: {data}")
    
    # Extract categories before other updates
    category_names_to_set = data.pop('categories', None)
    relationship_updates = data

    try:
        # Step 1: Update relationship fields
        if relationship_updates:
            print(f"Updating relationship fields for {relationship_id}: {relationship_updates}")
            update_response = supabase.table('relationships').update(relationship_updates).eq('id', relationship_id).execute()
            if hasattr(update_response, 'error') and update_response.error: 
                print(f"Error updating relationship fields: {update_response.error.message}")
                return jsonify({"error": f"Error updating relationship fields: {update_response.error.message}"}), 500
            print(f"Successfully updated relationship fields for {relationship_id}")

        # Step 2: Handle categories if provided
        if category_names_to_set is not None:
            print(f"Updating categories for relationship {relationship_id}: {category_names_to_set}")
            cat_ids = []
            
            # Only look up categories if there are any to set
            if category_names_to_set:
                print(f"Looking up category IDs for: {category_names_to_set}")
                cat_response = supabase.table('categories').select('id, name').in_('name', category_names_to_set).execute()
                if hasattr(cat_response, 'error') and cat_response.error: 
                    print(f"Error finding category IDs: {cat_response.error.message}")
                    return jsonify({"error": f"Error finding category IDs: {cat_response.error.message}"}), 500
                
                found_cats = {cat['name']: cat['id'] for cat in cat_response.data}
                print(f"Found categories: {found_cats}")
                
                if len(found_cats) != len(category_names_to_set):
                    missing = [name for name in category_names_to_set if name not in found_cats]
                    print(f"Missing categories: {missing}")
                    return jsonify({"error": f"Could not find categories: {', '.join(missing)}"}), 400
                
                cat_ids = list(found_cats.values())
            
            # Delete existing categories
            print(f"Deleting existing categories for relationship {relationship_id}")
            del_response = supabase.table('relationship_categories').delete().eq('relationship_id', relationship_id).execute()
            if hasattr(del_response, 'error') and del_response.error: 
                print(f"Error clearing existing categories: {del_response.error.message}")
                return jsonify({"error": f"Error clearing existing categories: {del_response.error.message}"}), 500
            
            # Insert new categories if any
            if cat_ids:
                print(f"Inserting new categories for relationship {relationship_id}: {cat_ids}")
                rows_to_insert = [{'relationship_id': relationship_id, 'category_id': cat_id} for cat_id in cat_ids]
                ins_response = supabase.table('relationship_categories').insert(rows_to_insert).execute()
                if hasattr(ins_response, 'error') and ins_response.error: 
                    print(f"Error inserting new categories: {ins_response.error.message}")
                    return jsonify({"error": f"Error inserting new categories: {ins_response.error.message}"}), 500
                
                # Log category changes to history
                try:
                    history_rows = [{'relationship_id': relationship_id, 'category_id': cat_id, 'change_type': 'added', 'user_confirmed': True} for cat_id in cat_ids]
                    if history_rows:
                        hist_response = supabase.table('category_history').insert(history_rows).execute()
                        if hasattr(hist_response, 'error') and hist_response.error: 
                            print(f"Error logging category changes to history: {hist_response.error.message}")
                except Exception as hist_error:
                    print(f"Non-critical error logging category history: {str(hist_error)}")
            
            print(f"Category update completed for relationship {relationship_id}")
        
        # Return success response
        print(f"Relationship {relationship_id} updated successfully")
        return jsonify({"message": "Relationship updated successfully", "relationship_id": relationship_id}), 200
    except Exception as e: 
        print(f"Exception in update_relationship: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/relationships/<int:relationship_id>', methods=['DELETE'])
def delete_relationship(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        response = supabase.table('relationships').delete().eq('id', relationship_id).execute()
        if response.error: return jsonify({"error": response.error.message}), 500
        return jsonify({"message": "Relationship deleted successfully"}), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

# --- Interaction Endpoints ---

@app.route('/interactions', methods=['POST'])
def create_interaction_log():
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    data = request.get_json()
    if not data or not all(k in data for k in ("relationship_id", "interaction_log")): return jsonify({"error": "Missing required fields: relationship_id, interaction_log"}), 400

    relationship_id = data['relationship_id']
    interaction_log = data['interaction_log']
    tone_tag = data.get('tone_tag')

    try:
        response = supabase.table('interactions').insert({'relationship_id': relationship_id, 'interaction_log': interaction_log, 'tone_tag': tone_tag}).execute()
        if hasattr(response, 'error') and response.error: return jsonify({"error": response.error.message}), 500
        interaction_data = response.data[0]

        try:
            rel_response = supabase.table('relationships').select("level, xp").eq('id', relationship_id).single().execute()
            rc_response = supabase.table('relationship_categories').select("categories(name)").eq('relationship_id', relationship_id).execute()
            if hasattr(rel_response, 'error') and rel_response.error: return jsonify({"error": f"Could not fetch relationship data: {rel_response.error.message}"}), 500
            if hasattr(rc_response, 'error') and rc_response.error: return jsonify({"error": f"Could not fetch relationship categories: {rc_response.error.message}"}), 500

            relationship_data = rel_response.data
            current_level = relationship_data.get('level', 1)
            current_xp = relationship_data.get('xp', 0)
            current_categories = [link['categories']['name'] for link in rc_response.data if link.get('categories')]

            sentiment_analysis, xp_gain, reasoning, patterns, evolution_suggestion, interaction_suggestion = process_interaction_log_ai(interaction_log, current_level, current_categories)
            suggested_tone = sentiment_analysis

            interaction_data.update({
                'sentiment_analysis': sentiment_analysis, 'xp_gain': xp_gain, 'suggested_tone': suggested_tone,
                'evolution_suggestion': evolution_suggestion, 'ai_reasoning': reasoning, 'patterns': patterns,
                'interaction_suggestion': interaction_suggestion
            })

            new_xp = current_xp + int(xp_gain)
            new_level = calculate_level(new_xp)
            update_data = {'level': new_level, 'xp': new_xp}
            update_response = supabase.table('relationships').update(update_data).eq('id', relationship_id).execute()

            if hasattr(update_response, 'error') and update_response.error: print(f"Error updating relationship level/XP: {update_response.error.message}")
            else:
                print(f"Successfully updated relationship: level={new_level}, xp={new_xp}")
                if new_level > current_level:
                    try:
                        level_history_data = {'relationship_id': relationship_id, 'old_level': current_level, 'new_level': new_level, 'xp_gained': int(xp_gain), 'interaction_id': interaction_data['id']}
                        supabase.table('level_history').insert(level_history_data).execute()
                        if new_level in [3, 5, 7, 10]:
                            try:
                                milestone_quest_description = generate_milestone_quest(new_level, current_categories, [interaction_log])
                                milestone_quest_data = {'relationship_id': relationship_id, 'quest_description': milestone_quest_description, 'quest_status': 'pending', 'milestone_level': new_level}
                                supabase.table('quests').insert(milestone_quest_data).execute()
                                print(f"Generated milestone quest for level {new_level}")
                            except Exception as quest_error: print(f"Error generating milestone quest: {quest_error}")
                    except Exception as history_error: print(f"Error logging level history: {history_error}")
            if evolution_suggestion: print(f"AI suggested evolution to add category: {evolution_suggestion}. Frontend needs user confirmation.")
        except Exception as e:
            print(f"Exception during AI processing or leveling/evolution update: {str(e)}")
            interaction_data['processing_error'] = f"Error during AI/Leveling: {str(e)}"

        try:
             interaction_update_data = {k: interaction_data.get(k) for k in ['sentiment_analysis', 'xp_gain', 'suggested_tone', 'evolution_suggestion', 'ai_reasoning', 'patterns', 'interaction_suggestion'] if interaction_data.get(k) is not None}
             if interaction_update_data: supabase.table('interactions').update(interaction_update_data).eq('id', interaction_data['id']).execute()
        except Exception as e: print(f"Error updating interaction log with AI results: {str(e)}")

        try:
            print(f"Triggering background insights generation for relationship {relationship_id}")
            generate_and_store_insights(supabase, relationship_id)
        except Exception as insights_error: print(f"Error generating insights after interaction: {insights_error}")

        return jsonify(interaction_data), 201
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/relationships/<int:relationship_id>/interactions', methods=['GET'])
def get_relationship_interactions(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        response = supabase.table('interactions').select("*").eq('relationship_id', relationship_id).execute()
        if response.error: return jsonify({"error": response.error.message}), 500
        return jsonify([dict(row) for row in response.data]), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/interactions/<int:interaction_id>', methods=['GET'])
def get_interaction_log(interaction_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        response = supabase.table('interactions').select("*").eq('id', interaction_id).execute()
        if response.error: return jsonify({"error": response.error.message}), 500
        if not response.data: return jsonify({"error": "Interaction log not found"}), 404
        return jsonify(dict(response.data[0])), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/interactions/<int:interaction_id>', methods=['DELETE'])
def delete_interaction_log(interaction_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        response = supabase.table('interactions').delete().eq('id', interaction_id).execute()
        if response.error: return jsonify({"error": response.error.message}), 500
        return jsonify({"message": "Interaction deleted successfully"}), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

# --- Dashboard Data ---

# Helper function to calculate days difference, handling None dates
def calculate_days_diff(date_str):
    if not date_str:
        return None
    try:
        # Ensure correct parsing format including timezone offset
        # Initialize date_obj to None
        date_obj = None
        if '.' in date_str and '+' in date_str:
            fmt = "%Y-%m-%dT%H:%M:%S.%f%z"
        elif '+' in date_str:
            fmt = "%Y-%m-%dT%H:%M:%S%z"
        else: # Fallback or assume UTC if no offset
            fmt = "%Y-%m-%dT%H:%M:%S.%f" # Assuming microseconds, adjust if not
            try:
                # Try parsing without microseconds first if '.' is not present
                if '.' not in date_str:
                     date_obj = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
                else:
                     date_obj = datetime.strptime(date_str.split('.')[0], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc) # Basic UTC assumption
            except ValueError: # Handle case where format might be just date/time without microseconds
                 try:
                      date_obj = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
                 except ValueError as final_ve:
                      print(f"Fallback date parsing failed for '{date_str}': {final_ve}")
                      return None # Could not parse

        # If date_obj wasn't set in fallback, try parsing with timezone
        if date_obj is None and '+' in date_str: # If timezone info exists, parse it
            # Remove colon from timezone offset if present (strptime %z doesn't handle it)
            if len(date_str) > 6 and ':' == date_str[-3:-2]:
                date_str_no_colon = date_str[:-3] + date_str[-2:]
            else:
                date_str_no_colon = date_str

            try:
                 # Determine format based on microseconds presence again for timezone parsing
                 if '.' in date_str_no_colon:
                      fmt_tz = "%Y-%m-%dT%H:%M:%S.%f%z"
                 else:
                      fmt_tz = "%Y-%m-%dT%H:%M:%S%z"
                 date_obj = datetime.strptime(date_str_no_colon, fmt_tz) # Use parsed timezone
            except ValueError as tz_ve:
                 print(f"Timezone date parsing failed for '{date_str_no_colon}': {tz_ve}")
                 return None # Could not parse with timezone

        # If date_obj is still None after all attempts, return None
        if date_obj is None:
             print(f"Could not parse date string: {date_str}")
             return None

        # Ensure date_obj is timezone-aware for comparison
        if date_obj.tzinfo is None:
            date_obj = date_obj.replace(tzinfo=timezone.utc) # Assume UTC if naive

        now_aware = datetime.now(timezone.utc)
        time_difference = now_aware - date_obj
        return time_difference.days
    except Exception as e: # Catch any unexpected error during parsing/calculation
        print(f"Unexpected error parsing date '{date_str}': {e}")
        return None # Return None if parsing fails

@app.route('/dashboard_data', methods=['GET'])
def get_dashboard_data_endpoint():
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        dashboard_data = get_dashboard_data()
        return jsonify(dashboard_data), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

def get_dashboard_data():
    """Fetches and processes data for the dashboard view. (Updated for categories and XP data)"""
    rel_response = supabase.table('relationships').select("*, relationship_categories(categories(name))").execute()
    if hasattr(rel_response, 'error') and rel_response.error: raise Exception(f"Supabase error fetching relationships: {rel_response.error.message}")
    relationships = rel_response.data

    dashboard_items = []
    for rel_data in relationships:
        relationship = dict(rel_data)
        relationship_id = relationship['id']
        categories = [rc['categories']['name'] for rc in relationship.pop('relationship_categories', []) if rc.get('categories')]

        last_interaction = None
        interactions_response = supabase.table('interactions').select("created_at").eq('relationship_id', relationship_id).order('created_at', desc=True).limit(1).execute()
        if (not hasattr(interactions_response, 'error') or not interactions_response.error) and interactions_response.data:
            last_interaction = interactions_response.data[0]

        days_since_interaction = "Never"
        if last_interaction and last_interaction.get('created_at'):
             days_since_interaction = calculate_days_diff(last_interaction['created_at']) # Use helper
             if days_since_interaction is None: days_since_interaction = "Error" # Indicate parsing issue

        # Calculate XP data similar to profile view
        total_xp = relationship.get('xp', 0)
        level = relationship.get('level', 1)
        xp_earned_in_level, xp_needed_for_level = get_xp_progress_in_level(total_xp, level)
        xp_bar_percentage = int((xp_earned_in_level / xp_needed_for_level) * 100) if xp_needed_for_level > 0 else 100 if level >= 10 else 0

        dashboard_item = {
            "id": relationship_id, 
            "name": relationship['name'], 
            "photo_url": relationship.get('photo_url'),
            "level": level, 
            "days_since_interaction": days_since_interaction,
            "categories": categories, 
            "tags": relationship.get('tags', []),
            # Add XP data
            "total_xp": total_xp,
            "xp_earned_in_level": xp_earned_in_level,
            "xp_needed_for_level": xp_needed_for_level,
            "xp_bar_percentage": xp_bar_percentage
        }
        dashboard_items.append(dashboard_item)
    return dashboard_items

# --- Profile View Endpoints ---

@app.route('/relationships/<int:relationship_id>/overview', methods=['GET'])
def get_relationship_overview(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        rel_response = supabase.table('relationships').select("*").eq('id', relationship_id).maybe_single().execute()
        if hasattr(rel_response, 'error') and rel_response.error: return jsonify({"error": f"Error fetching relationship for overview: {rel_response.error.message}"}), 500
        if not rel_response.data: return jsonify({"error": "Relationship not found for overview"}), 404
        relationship_data = dict(rel_response.data)

        rc_response = supabase.table('relationship_categories').select("categories(id, name)").eq('relationship_id', relationship_id).execute()
        if hasattr(rc_response, 'error') and rc_response.error:
             print(f"Warning: Error fetching categories for overview {relationship_id}: {rc_response.error.message}")
             relationship_data['categories'] = []
        else:
             relationship_data['categories'] = [link['categories']['name'] for link in rc_response.data if link.get('categories')]
        relationship_data.pop('category', None)

        last_interaction_response = supabase.table('interactions').select("*").eq('relationship_id', relationship_id).order('created_at', desc=True).limit(1).execute()
        last_interaction_data = dict(last_interaction_response.data[0]) if last_interaction_response.data else None

        total_xp = relationship_data.get('xp', 0)
        level = relationship_data.get('level', 1)
        xp_earned_in_level, xp_needed_for_level = get_xp_progress_in_level(total_xp, level)
        xp_bar_percentage = int((xp_earned_in_level / xp_needed_for_level) * 100) if xp_needed_for_level > 0 else 100 if level >= 10 else 0

        overview_data = {
            "photo_url": relationship_data.get('photo_url'), "name": relationship_data['name'], "level": level,
            "reminder_settings": relationship_data.get('reminder_interval'), "xp_bar": xp_bar_percentage,
            "xp_earned_in_level": xp_earned_in_level, "xp_needed_for_level": xp_needed_for_level, "total_xp": total_xp,
            "last_interaction": last_interaction_data, "categories": relationship_data.get('categories', []),
            "relationship_tags": relationship_data.get('tags', [])
        }
        return jsonify(overview_data), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/relationships/<int:relationship_id>/interactions_thread', methods=['GET'])
def get_relationship_interaction_thread(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        interactions_response = supabase.table('interactions').select("*").eq('relationship_id', relationship_id).order('created_at', desc=True).execute()
        if not interactions_response.data: return jsonify({"error": "No interactions found for this relationship"}), 404
        interaction_thread_data = [dict(row) for row in interactions_response.data]
        return jsonify(interaction_thread_data), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

# --- Quest Endpoints ---

@app.route('/quests', methods=['POST'])
def create_quest():
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    data = request.get_json()
    if not data or not all(k in data for k in ("relationship_id", "quest_description", "quest_status")): return jsonify({"error": "Missing required fields: relationship_id, quest_description, quest_status"}), 400
    try:
        response = supabase.table('quests').insert(data).execute()
        if hasattr(response, 'error') and response.error: return jsonify({"error": response.error.message}), 500
        return jsonify(response.data[0]), 201
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/relationships/<int:relationship_id>/quests', methods=['GET'])
def get_relationship_quests(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        response = supabase.table('quests').select("*").eq('relationship_id', relationship_id).execute()
        if hasattr(response, 'error') and response.error: return jsonify({"error": response.error.message}), 500
        return jsonify([dict(row) for row in response.data]), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/quests/<int:quest_id>', methods=['GET'])
def get_quest(quest_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        response = supabase.table('quests').select("*").eq('id', quest_id).execute()
        if hasattr(response, 'error') and response.error: return jsonify({"error": response.error.message}), 500
        if not response.data: return jsonify({"error": "Quest not found"}), 404
        return jsonify(dict(response.data[0])), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/quests/<int:quest_id>', methods=['PUT'])
def update_quest(quest_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    data = request.get_json()
    if not data: return jsonify({"error": "No data provided for update"}), 400
    try:
        quest_response = supabase.table('quests').select("*").eq('id', quest_id).single().execute()
        if hasattr(quest_response, 'error') and quest_response.error: return jsonify({"error": f"Error fetching quest: {quest_response.error.message}"}), 500
        current_quest = quest_response.data
        is_completing_quest = (data.get('quest_status') == 'completed' and current_quest.get('quest_status') != 'completed')
        if is_completing_quest: data['completion_date'] = datetime.now(timezone.utc).isoformat()

        response = supabase.table('quests').update(data).eq('id', quest_id).execute()
        if hasattr(response, 'error') and response.error: return jsonify({"error": response.error.message}), 500

        if is_completing_quest:
            try:
                relationship_id = current_quest.get('relationship_id')
                xp_reward = 3 if current_quest.get('milestone_level') else 2
                rel_response = supabase.table('relationships').select("level, xp").eq('id', relationship_id).single().execute()
                if not (hasattr(rel_response, 'error') and rel_response.error):
                    relationship_data = rel_response.data
                    current_level = relationship_data.get('level', 1)
                    current_xp = relationship_data.get('xp', 0)
                    new_xp = current_xp + xp_reward
                    new_level = calculate_level(new_xp)
                    update_data = {'level': new_level, 'xp': new_xp}
                    update_response = supabase.table('relationships').update(update_data).eq('id', relationship_id).execute()
                    if hasattr(update_response, 'error') and update_response.error: print(f"Error updating relationship XP: {update_response.error.message}")
                    else:
                        print(f"Quest completion: Awarded {xp_reward} XP to relationship {relationship_id}")
                        if new_level > current_level:
                            try:
                                level_history_data = {'relationship_id': relationship_id, 'old_level': current_level, 'new_level': new_level, 'xp_gained': xp_reward, 'interaction_id': None}
                                supabase.table('level_history').insert(level_history_data).execute()
                                print(f"Quest completion triggered level up: {current_level} -> {new_level}")
                                if new_level in [3, 5, 7, 10]:
                                    rc_response = supabase.table('relationship_categories').select("categories(name)").eq('relationship_id', relationship_id).execute()
                                    if not (hasattr(rc_response, 'error') and rc_response.error):
                                        categories = [link['categories']['name'] for link in rc_response.data if link.get('categories')]
                                        milestone_quest_description = generate_milestone_quest(new_level, categories)
                                        milestone_quest_data = {'relationship_id': relationship_id, 'quest_description': milestone_quest_description, 'quest_status': 'pending', 'milestone_level': new_level}
                                        supabase.table('quests').insert(milestone_quest_data).execute()
                                        print(f"Generated milestone quest for level {new_level}")
                            except Exception as history_error: print(f"Error logging level history after quest completion: {history_error}")
            except Exception as xp_error: print(f"Error processing XP reward for quest completion: {xp_error}")
            try:
                print(f"Triggering background insights generation for relationship {relationship_id} after quest completion")
                generate_and_store_insights(supabase, relationship_id)
            except Exception as insights_error: print(f"Error generating insights after quest completion: {insights_error}")
        return jsonify({"message": "Quest updated successfully"}), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/quests/<int:quest_id>', methods=['DELETE'])
def delete_quest(quest_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        response = supabase.table('quests').delete().eq('id', quest_id).execute()
        if hasattr(response, 'error') and response.error: return jsonify({"error": response.error.message}), 500
        return jsonify({"message": "Quest deleted successfully"}), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/relationships/<int:relationship_id>/generate_quest', methods=['POST'])
def generate_relationship_quest(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        rel_response = supabase.table('relationships').select("level").eq('id', relationship_id).single().execute()
        if hasattr(rel_response, 'error') and rel_response.error: return jsonify({"error": f"Error fetching relationship: {rel_response.error.message}"}), 500
        rc_response = supabase.table('relationship_categories').select("categories(name)").eq('relationship_id', relationship_id).execute()
        if hasattr(rc_response, 'error') and rc_response.error: return jsonify({"error": f"Error fetching categories: {rc_response.error.message}"}), 500
        interactions_response = supabase.table('interactions').select("interaction_log").eq('relationship_id', relationship_id).order('created_at', desc=True).limit(3).execute()

        level = rel_response.data.get('level', 1)
        categories = [link['categories']['name'] for link in rc_response.data if link.get('categories')]
        recent_interactions = [interaction['interaction_log'] for interaction in interactions_response.data] if interactions_response.data else []

        if level in [3, 5, 7, 10]: quest_description = generate_milestone_quest(level, categories, recent_interactions)
        else: quest_description = generate_quest(level, categories, recent_interactions)

        quest_data = {'relationship_id': relationship_id, 'quest_description': quest_description, 'quest_status': 'pending', 'milestone_level': level if level in [3, 5, 7, 10] else None}
        quest_response = supabase.table('quests').insert(quest_data).execute()
        if hasattr(quest_response, 'error') and quest_response.error: return jsonify({"error": f"Error creating quest: {quest_response.error.message}"}), 500
        return jsonify(quest_response.data[0]), 201
    except Exception as e: return jsonify({"error": str(e)}), 500

# --- Tree System Endpoints ---

@app.route('/relationships/<int:relationship_id>/tree', methods=['GET'])
def get_relationship_tree(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        tree_data = get_relationship_tree_data(supabase, relationship_id)
        return jsonify(tree_data), 200
    except Exception as e: return jsonify({"error": f"Error generating tree data: {str(e)}"}), 500

@app.route('/relationships/<int:relationship_id>/tree/evolution', methods=['GET'])
def get_tree_evolution_suggestions(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        evolution_data = suggest_tree_evolution(supabase, relationship_id)
        return jsonify(evolution_data), 200
    except Exception as e: return jsonify({"error": f"Error generating evolution suggestions: {str(e)}"}), 500

@app.route('/interactions/<int:interaction_id>/milestone', methods=['PUT'])
def mark_interaction_as_milestone(interaction_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        response = supabase.table('interactions').update({'is_milestone': True}).eq('id', interaction_id).execute()
        if hasattr(response, 'error') and response.error: return jsonify({"error": f"Error marking interaction as milestone: {response.error.message}"}), 500
        return jsonify({"message": "Interaction marked as milestone successfully"}), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/relationships/<int:relationship_id>/tree/completion', methods=['GET'])
def get_tree_completion_status_endpoint(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        completion_data = get_tree_completion_status(supabase, relationship_id)
        return jsonify(completion_data), 200
    except Exception as e: return jsonify({"error": f"Error getting tree completion status: {str(e)}"}), 500

# --- Insights System Endpoints ---

@app.route('/relationships/<int:relationship_id>/insights', methods=['GET'])
def get_relationship_insights(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        rel_response = supabase.table('relationships').select("id").eq('id', relationship_id).maybe_single().execute()
        if hasattr(rel_response, 'error') and rel_response.error: return jsonify({"error": f"Error fetching relationship: {rel_response.error.message}"}), 500
        if not rel_response.data: return jsonify({"error": "Relationship not found"}), 404
        interactions_response = supabase.table('interactions').select("id").eq('relationship_id', relationship_id).limit(1).execute()
        if hasattr(interactions_response, 'error') and interactions_response.error: return jsonify({"error": f"Error fetching interactions: {interactions_response.error.message}"}), 500
        if not interactions_response.data: return jsonify({"error": "No interactions available yet. Log some interactions to generate insights."}), 404

        stored_insights = get_stored_insights(supabase, relationship_id)
        if stored_insights:
            print(f"Using stored insights for relationship {relationship_id}")
            return jsonify(stored_insights), 200

        print(f"No recent stored insights found for relationship {relationship_id}, generating new ones")
        success = generate_and_store_insights(supabase, relationship_id)
        if not success:
            interactions_count_response = supabase.table('interactions').select("id", count='exact').eq('relationship_id', relationship_id).execute()
            count = interactions_count_response.count if hasattr(interactions_count_response, 'count') else 0
            if count < 3: return jsonify({"error": "Not enough interactions to generate meaningful insights. Log more interactions."}), 404
            else: return jsonify({"error": "Failed to generate insights. Please try again later."}), 500

        new_insights = get_stored_insights(supabase, relationship_id, max_age_hours=1)
        if not new_insights: return jsonify({"error": "Failed to retrieve newly generated insights. Please try again later."}), 500
        return jsonify(new_insights), 200
    except Exception as e: return jsonify({"error": f"Error generating insights: {str(e)}"}), 500

@app.route('/relationships/<int:relationship_id>/insights/interaction_trends', methods=['GET'])
def get_relationship_interaction_trends(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        rel_response = supabase.table('relationships').select("*").eq('id', relationship_id).maybe_single().execute()
        if hasattr(rel_response, 'error') and rel_response.error: return jsonify({"error": f"Error fetching relationship: {rel_response.error.message}"}), 500
        if not rel_response.data: return jsonify({"error": "Relationship not found"}), 404
        relationship_data = dict(rel_response.data)
        interactions_response = supabase.table('interactions').select("*").eq('relationship_id', relationship_id).order('created_at', desc=True).execute()
        if hasattr(interactions_response, 'error') and interactions_response.error: return jsonify({"error": f"Error fetching interactions: {interactions_response.error.message}"}), 500
        interactions = [dict(row) for row in interactions_response.data]
        trends = generate_interaction_trends(relationship_id, interactions, relationship_data)
        return jsonify(trends), 200
    except Exception as e: return jsonify({"error": f"Error generating interaction trends: {str(e)}"}), 500

@app.route('/relationships/<int:relationship_id>/insights/emotional_summary', methods=['GET'])
def get_relationship_emotional_summary(relationship_id):
    if not supabase: return jsonify({"error": "Supabase is not initialized."}), 500
    try:
        rel_response = supabase.table('relationships').select("*").eq('id', relationship_id).maybe_single().execute()
        if hasattr(rel_response, 'error') and rel_response.error: return jsonify({"error": f"Error fetching relationship: {rel_response.error.message}"}), 500
        if not rel_response.data: return jsonify({"error": "Relationship not found"}), 404
        relationship_data = dict(rel_response.data)
        rc_response = supabase.table('relationship_categories').select("categories(name)").eq('relationship_id', relationship_id).execute()
        relationship_data['categories'] = [link['categories']['name'] for link in rc_response.data if link.get('categories')] if not (hasattr(rc_response, 'error') and rc_response.error) else []
        interactions_response = supabase.table('interactions').select("*").eq('relationship_id', relationship_id).order('created_at', desc=True).execute()
        if hasattr(interactions_response, 'error') and interactions_response.error: return jsonify({"error": f"Error fetching interactions: {interactions_response.error.message}"}), 500
        interactions = [dict(row) for row in interactions_response.data]
        summary = generate_emotional_summary(relationship_id, interactions, relationship_data)
        return jsonify(summary), 200
    except Exception as e: return jsonify({"error": f"Error generating emotional summary: {str(e)}"}), 500

@app.route('/relationships/<int:relationship_id>/insights/relationship_forecasts', methods=['GET'])
def get_relationship_forecasts(relationship_id):
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    try:
        # Fetch relationship data
        rel_response = supabase.table('relationships').select("*").eq('id', relationship_id).maybe_single().execute()
        if hasattr(rel_response, 'error') and rel_response.error:
            return jsonify({"error": f"Error fetching relationship: {rel_response.error.message}"}), 500
        if not rel_response.data:
            return jsonify({"error": "Relationship not found"}), 404
        
        relationship_data = dict(rel_response.data)
        
        # Fetch categories for this relationship
        rc_response = supabase.table('relationship_categories').select("categories(name)").eq('relationship_id', relationship_id).execute()
        if not (hasattr(rc_response, 'error') and rc_response.error):
            relationship_data['categories'] = [link['categories']['name'] for link in rc_response.data if link.get('categories')]
        else:
            relationship_data['categories'] = []
        
        # Fetch all interactions for this relationship
        interactions_response = supabase.table('interactions').select("*").eq('relationship_id', relationship_id).order('created_at', desc=True).execute()
        if hasattr(interactions_response, 'error') and interactions_response.error:
            return jsonify({"error": f"Error fetching interactions: {interactions_response.error.message}"}), 500
        
        interactions = [dict(row) for row in interactions_response.data]
        
        # Generate relationship forecasts
        forecasts = generate_relationship_forecasts(relationship_id, interactions, relationship_data)
        
        return jsonify(forecasts), 200
    except Exception as e:
        return jsonify({"error": f"Error generating relationship forecasts: {str(e)}"}), 500



# --- Global Tree Data Endpoint ---

@app.route('/global_tree_data', methods=['GET'])
def get_global_tree_data_endpoint():
    try:
        tree_data = get_global_tree_data(supabase)
        return jsonify(tree_data), 200
    except Exception as e:
        print(f"Error in /global_tree_data endpoint: {str(e)}") # Log the error
        return jsonify({"error": f"Failed to generate global tree data: {str(e)}"}), 500

if __name__ == '__main__':
    # Get port from environment variable for Elastic Beanstalk
    port = int(os.environ.get('PORT', 5000))
    # In production, debug should be False
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
