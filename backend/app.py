import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from supabase import create_client, Client
from services.ai_processing import analyze_sentiment, calculate_xp, get_relationship_level, update_relationship_level, process_interaction_log_ai, detect_patterns, suggest_evolution, suggest_interaction
from services.leveling_system import calculate_level, get_xp_progress_in_level # Import the new leveling functions
from datetime import datetime, timezone

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

# --- Placeholder for API Endpoints ---

# API endpoint to create a new relationship
@app.route('/relationships', methods=['POST'])
def create_relationship():
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    data = request.get_json()
    # Updated required fields check - 'category' is now 'initial_category_name'
    if not data or not all(k in data for k in ("name", "relationship_type", "reminder_interval", "initial_category_name")):
        return jsonify({"error": "Missing required fields: name, relationship_type, reminder_interval, initial_category_name"}), 400

    name = data['name']
    relationship_type = data['relationship_type']
    reminder_interval = data['reminder_interval']
    initial_category_name = data['initial_category_name'] # e.g., "Friend", "Business"
    photo_url = data.get('photo_url') # Optional photo URL
    tags_input = data.get('tags', []) # Optional tags, e.g., ["High Priority", "Close Friend"]

    try:
        # 1. Find the category ID for the initial category name
        category_response = supabase.table('categories').select('id').eq('name', initial_category_name).limit(1).execute()
        if hasattr(category_response, 'error') and category_response.error:
             return jsonify({"error": f"Error finding category '{initial_category_name}': {category_response.error.message}"}), 500
        if not category_response.data:
            return jsonify({"error": f"Initial category '{initial_category_name}' not found."}), 400
        initial_category_id = category_response.data[0]['id']

        # 2. Insert base relationship data (without category column)
        rel_response = supabase.table('relationships').insert({
            'name': name,
            'relationship_type': relationship_type,
            'reminder_interval': reminder_interval,
            # 'category': category, # REMOVED - Use junction table
            'photo_url': photo_url,
            # 'tags': tags, # REMOVED - Use junction table for tags too eventually
            'level': 1,
            'xp': 0
        }).execute()

        if hasattr(rel_response, 'error') and rel_response.error:
            return jsonify({"error": f"Error creating relationship: {rel_response.error.message}"}), 500
        if not rel_response.data:
            return jsonify({"error": "Failed to create relationship base record"}), 500

        new_relationship = rel_response.data[0]
        new_relationship_id = new_relationship['id']

        # 3. Insert into relationship_categories junction table
        rc_response = supabase.table('relationship_categories').insert({
            'relationship_id': new_relationship_id,
            'category_id': initial_category_id
        }).execute()

        if hasattr(rc_response, 'error') and rc_response.error:
            # Attempt to clean up the relationship if category linking fails
            supabase.table('relationships').delete().eq('id', new_relationship_id).execute()
            return jsonify({"error": f"Error linking initial category: {rc_response.error.message}"}), 500

        # TODO: Handle tags similarly using relationship_tags junction table if needed

        # Add the initial category name back for the response
        new_relationship['categories'] = [initial_category_name]
        return jsonify(new_relationship), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API endpoint to get all relationships
@app.route('/relationships', methods=['GET'])
def get_relationships():
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    # Updated to fetch categories from junction table
    try:
        # Fetch all relationships
        rel_response = supabase.table('relationships').select("*").execute()
        if hasattr(rel_response, 'error') and rel_response.error:
            return jsonify({"error": f"Error fetching relationships: {rel_response.error.message}"}), 500
        relationships = rel_response.data

        # Fetch all category links
        rc_response = supabase.table('relationship_categories').select("relationship_id, categories(id, name)").execute()
        if hasattr(rc_response, 'error') and rc_response.error:
             return jsonify({"error": f"Error fetching relationship categories: {rc_response.error.message}"}), 500
        
        # Map categories to relationships
        categories_map = {}
        for link in rc_response.data:
            rel_id = link['relationship_id']
            if rel_id not in categories_map:
                categories_map[rel_id] = []
            if link.get('categories'): # Check if category data exists (might be null if category deleted)
                 categories_map[rel_id].append(link['categories']['name'])

        # Combine data
        result_list = []
        for rel in relationships:
            rel_dict = dict(rel)
            rel_dict['categories'] = categories_map.get(rel['id'], [])
            # Remove the old single 'category' field if it exists in the dict
            rel_dict.pop('category', None)
            result_list.append(rel_dict)

        return jsonify(result_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API endpoint to get a specific relationship by ID
@app.route('/relationships/<int:relationship_id>', methods=['GET'])
def get_relationship(relationship_id):
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    # Updated to fetch categories from junction table
    try:
        # Fetch relationship
        rel_response = supabase.table('relationships').select("*").eq('id', relationship_id).maybe_single().execute()
        if hasattr(rel_response, 'error') and rel_response.error:
            return jsonify({"error": f"Error fetching relationship: {rel_response.error.message}"}), 500
        if not rel_response.data:
            return jsonify({"error": "Relationship not found"}), 404
        
        relationship_data = dict(rel_response.data)

        # Fetch categories for this relationship
        rc_response = supabase.table('relationship_categories').select("categories(id, name)").eq('relationship_id', relationship_id).execute()
        if hasattr(rc_response, 'error') and rc_response.error:
             # Log error but proceed, maybe relationship exists without categories yet
             print(f"Warning: Error fetching categories for relationship {relationship_id}: {rc_response.error.message}")
             relationship_data['categories'] = []
        else:
             relationship_data['categories'] = [link['categories']['name'] for link in rc_response.data if link.get('categories')]

        # Remove the old single 'category' field if it exists
        relationship_data.pop('category', None)
        return jsonify(relationship_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API endpoint to update an existing relationship
@app.route('/relationships/<int:relationship_id>', methods=['PUT'])
def update_relationship(relationship_id):
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    data = request.get_json()
    # Updated to handle category updates via junction table (if provided)
    if not data:
        return jsonify({"error": "No data provided for update"}), 400

    # Separate category updates from other relationship field updates
    category_names_to_set = data.pop('categories', None) # Expecting a list of category names
    relationship_updates = data # Remaining fields

    try:
        # Update standard relationship fields if any
        if relationship_updates:
            update_response = supabase.table('relationships').update(relationship_updates).eq('id', relationship_id).execute()
            if hasattr(update_response, 'error') and update_response.error:
                return jsonify({"error": f"Error updating relationship fields: {update_response.error.message}"}), 500

        # Handle category updates if provided
        if category_names_to_set is not None:
             # 1. Get IDs for the new category names
             cat_ids = []
             if category_names_to_set: # Only query if list is not empty
                 cat_response = supabase.table('categories').select('id, name').in_('name', category_names_to_set).execute()
                 if hasattr(cat_response, 'error') and cat_response.error:
                     return jsonify({"error": f"Error finding category IDs: {cat_response.error.message}"}), 500
                 
                 found_cats = {cat['name']: cat['id'] for cat in cat_response.data}
                 if len(found_cats) != len(category_names_to_set):
                      missing = [name for name in category_names_to_set if name not in found_cats]
                      return jsonify({"error": f"Could not find categories: {', '.join(missing)}"}), 400
                 cat_ids = list(found_cats.values())

             # 2. Delete existing category links for this relationship
             del_response = supabase.table('relationship_categories').delete().eq('relationship_id', relationship_id).execute()
             if hasattr(del_response, 'error') and del_response.error:
                 # Log error but maybe continue if inserts work? Or return error? Let's return error.
                 return jsonify({"error": f"Error clearing existing categories: {del_response.error.message}"}), 500

             # 3. Insert new category links if any
             if cat_ids:
                 rows_to_insert = [{'relationship_id': relationship_id, 'category_id': cat_id} for cat_id in cat_ids]
                 ins_response = supabase.table('relationship_categories').insert(rows_to_insert).execute()
                 if hasattr(ins_response, 'error') and ins_response.error:
                     return jsonify({"error": f"Error inserting new categories: {ins_response.error.message}"}), 500
                 else:
                     # Log changes to category_history
                     history_rows = [
                         {
                             'relationship_id': relationship_id,
                             'category_id': cat_id,
                             'change_type': 'added', # Assuming PUT replaces all, so these are effectively 'added' in this context
                             'user_confirmed': True # Change via PUT implies user confirmation
                         } for cat_id in cat_ids
                     ]
                     if history_rows:
                         hist_response = supabase.table('category_history').insert(history_rows).execute()
                         if hasattr(hist_response, 'error') and hist_response.error:
                              # Log error but don't fail the main update
                              print(f"Error logging category changes to history: {hist_response.error.message}")


        return jsonify({"message": "Relationship updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API endpoint to delete a relationship
@app.route('/relationships/<int:relationship_id>', methods=['DELETE'])
def delete_relationship(relationship_id):
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    try:
        response = supabase.table('relationships').delete().eq('id', relationship_id).execute()
        if response.error:
            return jsonify({"error": response.error.message}), 500
        return jsonify({"message": "Relationship deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API endpoint to log a new interaction
@app.route('/interactions', methods=['POST'])
def create_interaction_log():
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    data = request.get_json()
    if not data or not all(k in data for k in ("relationship_id", "interaction_log")):
        return jsonify({"error": "Missing required fields: relationship_id, interaction_log"}), 400

    relationship_id = data['relationship_id']
    interaction_log = data['interaction_log']
    tone_tag = data.get('tone_tag') # Optional tone tag

    try:
        # Insert interaction log into Supabase 'interactions' table
        response = supabase.table('interactions').insert({
            'relationship_id': relationship_id,
            'interaction_log': interaction_log,
            'tone_tag': tone_tag
        }).execute()

        if hasattr(response, 'error') and response.error:
            return jsonify({"error": response.error.message}), 500

        interaction_data = response.data[0] # Base interaction data

        # --- AI Processing & Level Up ---
        try:
            # Get current relationship data (level, xp, categories)
            rel_response = supabase.table('relationships').select("level, xp").eq('id', relationship_id).single().execute()
            rc_response = supabase.table('relationship_categories').select("categories(name)").eq('relationship_id', relationship_id).execute()

            if hasattr(rel_response, 'error') and rel_response.error:
                 print(f"Error fetching relationship data for AI processing: {rel_response.error.message}")
                 # Proceed without AI? Or return error? Let's return error for now.
                 return jsonify({"error": f"Could not fetch relationship data: {rel_response.error.message}"}), 500
            if hasattr(rc_response, 'error') and rc_response.error:
                 print(f"Error fetching categories for AI processing: {rc_response.error.message}")
                 return jsonify({"error": f"Could not fetch relationship categories: {rc_response.error.message}"}), 500

            relationship_data = rel_response.data
            current_level = relationship_data.get('level', 1)
            current_xp = relationship_data.get('xp', 0)
            current_categories = [link['categories']['name'] for link in rc_response.data if link.get('categories')]

            # Process the interaction log with AI (passing categories)
            sentiment_analysis, xp_gain, reasoning, patterns, evolution_suggestion, interaction_suggestion = process_interaction_log_ai(interaction_log, current_level, current_categories)

            # Use detailed sentiment analysis as suggested tone
            suggested_tone = sentiment_analysis # Or keep separate if needed

            # Add AI results to interaction data being returned
            interaction_data['sentiment_analysis'] = sentiment_analysis
            interaction_data['xp_gain'] = xp_gain
            interaction_data['suggested_tone'] = suggested_tone
            interaction_data['evolution_suggestion'] = evolution_suggestion # Keep suggestion in interaction log for history
            interaction_data['ai_reasoning'] = reasoning
            interaction_data['patterns'] = patterns
            interaction_data['interaction_suggestion'] = interaction_suggestion

            # --- Level Up Logic ---
            new_xp = current_xp + int(xp_gain)
            new_level = calculate_level(new_xp)
            print(f"Updating relationship {relationship_id}: level {current_level}->{new_level}, XP {current_xp}->{new_xp}")

            update_data = {'level': new_level, 'xp': new_xp}
            update_response = supabase.table('relationships').update(update_data).eq('id', relationship_id).execute()

            if hasattr(update_response, 'error') and update_response.error:
                print(f"Error updating relationship level/XP: {update_response.error.message}")
                # Decide if this is critical - maybe log error but still return interaction?
            else:
                print(f"Successfully updated relationship: level={new_level}, xp={new_xp}")
                 # Optionally log level change in level_history table here

            # --- Evolution Suggestion is returned, but NOT automatically applied ---
            # The frontend should handle displaying the suggestion and allowing the user
            # to accept/decline. Accepting would likely trigger a separate API call
            # (e.g., PUT /relationships/{id} with updated categories list, or a dedicated
            # POST /relationships/{id}/categories endpoint).
            if evolution_suggestion:
                 print(f"AI suggested evolution to add category: {evolution_suggestion}. Frontend needs user confirmation.")

        except Exception as e:
            # Log AI/Leveling specific errors but still return the base interaction data
            print(f"Exception during AI processing or leveling/evolution update: {str(e)}")
            # Add error info to the response?
            interaction_data['processing_error'] = f"Error during AI/Leveling: {str(e)}"


        # Update the interaction log record itself with AI results (optional, but good for history)
        try:
             interaction_update_data = {
                  'sentiment_analysis': interaction_data.get('sentiment_analysis'),
                  'xp_gain': interaction_data.get('xp_gain'),
                  'suggested_tone': interaction_data.get('suggested_tone'),
                  'evolution_suggestion': interaction_data.get('evolution_suggestion'),
                  'ai_reasoning': interaction_data.get('ai_reasoning'),
                  'patterns': interaction_data.get('patterns'),
                  'interaction_suggestion': interaction_data.get('interaction_suggestion')
             }
             # Filter out None values before updating
             interaction_update_data = {k: v for k, v in interaction_update_data.items() if v is not None}
             if interaction_update_data:
                  supabase.table('interactions').update(interaction_update_data).eq('id', interaction_data['id']).execute()
        except Exception as e:
             print(f"Error updating interaction log with AI results: {str(e)}")


        return jsonify(interaction_data), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API endpoint to get interactions for a specific relationship
@app.route('/relationships/<int:relationship_id>/interactions', methods=['GET'])
def get_relationship_interactions(relationship_id):
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    try:
        response = supabase.table('interactions').select("*").eq('relationship_id', relationship_id).execute()
        if response.error:
            return jsonify({"error": response.error.message}), 500
        return jsonify([dict(row) for row in response.data]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API endpoint to get a specific interaction log by ID
@app.route('/interactions/<int:interaction_id>', methods=['GET'])
def get_interaction_log(interaction_id):
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    try:
        response = supabase.table('interactions').select("*").eq('id', interaction_id).execute()
        if response.error:
            return jsonify({"error": response.error.message}), 500
        if not response.data:
            return jsonify({"error": "Interaction log not found"}), 404
        return jsonify(dict(response.data[0])), 200 # Return the interaction log as a dict
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API endpoint to delete an interaction
@app.route('/interactions/<int:interaction_id>', methods=['DELETE'])
def delete_interaction_log(interaction_id):
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    try:
        response = supabase.table('interactions').delete().eq('id', interaction_id).execute()
        if response.error:
            return jsonify({"error": response.error.message}), 500
        return jsonify({"message": "Interaction deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Dashboard Data ---
from datetime import datetime, timezone

@app.route('/dashboard_data', methods=['GET'])
def get_dashboard_data_endpoint():
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    try:
        dashboard_data = get_dashboard_data()
        return jsonify(dashboard_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_dashboard_data():
    """Fetches and processes data for the dashboard view. (Updated for categories)"""
    # Fetch relationships and categories together more efficiently
    rel_response = supabase.table('relationships').select("*, relationship_categories(categories(name))").execute()
    if hasattr(rel_response, 'error') and rel_response.error:
        raise Exception(f"Supabase error fetching relationships: {rel_response.error.message}")
    relationships = rel_response.data

    # Fetch last interaction for all relationships efficiently (if possible with Supabase py, otherwise loop)
    # For simplicity, looping remains acceptable for now
    dashboard_items = []
    for rel_data in relationships:
        relationship = dict(rel_data) # Convert from Supabase Row object if necessary
        relationship_id = relationship['id']

        # Extract categories
        categories = [rc['categories']['name'] for rc in relationship.pop('relationship_categories', []) if rc.get('categories')]

        # Fetch last interaction
        last_interaction = None
        interactions_response = supabase.table('interactions').select("created_at").eq('relationship_id', relationship_id).order('created_at', desc=True).limit(1).execute()
        if (not hasattr(interactions_response, 'error') or not interactions_response.error) and interactions_response.data:
            last_interaction = interactions_response.data[0]

        days_since_interaction = "Never"
        if last_interaction and last_interaction.get('created_at'):
            try:
                # Ensure correct parsing format including timezone offset
                last_interaction_date_str = last_interaction['created_at']
                # Handle potential variations in microseconds and timezone format
                if '.' in last_interaction_date_str and '+' in last_interaction_date_str:
                     fmt = "%Y-%m-%dT%H:%M:%S.%f%z"
                elif '+' in last_interaction_date_str:
                     fmt = "%Y-%m-%dT%H:%M:%S%z"
                else: # Fallback or assume UTC if no offset
                     fmt = "%Y-%m-%dT%H:%M:%S.%f" # Assuming microseconds, adjust if not
                     last_interaction_date = datetime.strptime(last_interaction_date_str.split('.')[0], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc) # Basic UTC assumption
                
                if '+' in last_interaction_date_str: # If timezone info exists, parse it
                    # Remove colon from timezone offset if present (strptime %z doesn't handle it)
                    if ':' == last_interaction_date_str[-3:-2]:
                        last_interaction_date_str = last_interaction_date_str[:-3] + last_interaction_date_str[-2:]
                    last_interaction_date = datetime.strptime(last_interaction_date_str, fmt) # Use parsed timezone
                
            except ValueError as dt_error:
                 print(f"Error parsing date '{last_interaction['created_at']}': {dt_error}")
                 last_interaction_date = None # Handle parsing error

            if last_interaction_date:
                 time_difference = datetime.now(timezone.utc) - last_interaction_date
                 days_since_interaction = time_difference.days

        dashboard_item = {
            "id": relationship_id,
            "name": relationship['name'],
            "photo_url": relationship.get('photo_url'),
            "level": relationship.get('level', 1),
            "days_since_interaction": days_since_interaction,
            "categories": categories, # Use the list of categories
            "tags": relationship.get('tags', []) # Keep existing tags logic (though should also use junction)
        }
        dashboard_items.append(dashboard_item)

    return dashboard_items

# --- Profile View Endpoints ---

# API endpoint to get relationship profile overview
@app.route('/relationships/<int:relationship_id>/overview', methods=['GET'])
def get_relationship_overview(relationship_id):
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    try:
        # Fetch relationship data directly (like in get_relationship)
        rel_response = supabase.table('relationships').select("*").eq('id', relationship_id).maybe_single().execute()
        if hasattr(rel_response, 'error') and rel_response.error:
            return jsonify({"error": f"Error fetching relationship for overview: {rel_response.error.message}"}), 500
        if not rel_response.data:
            return jsonify({"error": "Relationship not found for overview"}), 404
        relationship_data = dict(rel_response.data)

        # Fetch categories for this relationship
        rc_response = supabase.table('relationship_categories').select("categories(id, name)").eq('relationship_id', relationship_id).execute()
        if hasattr(rc_response, 'error') and rc_response.error:
             print(f"Warning: Error fetching categories for overview {relationship_id}: {rc_response.error.message}")
             relationship_data['categories'] = []
        else:
             relationship_data['categories'] = [link['categories']['name'] for link in rc_response.data if link.get('categories')]
        relationship_data.pop('category', None) # Remove old field if present

        print(f"Overview for relationship {relationship_id}: level = {relationship_data.get('level', 1)}")

        # Fetch last interaction log
        last_interaction_response = supabase.table('interactions').select("*").eq('relationship_id', relationship_id).order('created_at', desc=True).limit(1).execute()
        last_interaction_data = dict(last_interaction_response.data[0]) if last_interaction_response.data else None

        # Calculate XP bar value using the imported function (keep this part)
        total_xp = relationship_data.get('xp', 0)
        level = relationship_data.get('level', 1)
        xp_earned_in_level, xp_needed_for_level = get_xp_progress_in_level(total_xp, level)
        # Calculate progress percentage for the bar (0-100)
        xp_bar_percentage = int((xp_earned_in_level / xp_needed_for_level) * 100) if xp_needed_for_level > 0 else 100 if level >= 10 else 0

        overview_data = {
            "photo_url": relationship_data.get('photo_url'),
            "name": relationship_data['name'],
            "level": level,
            "reminder_settings": relationship_data.get('reminder_interval'),
            "xp_bar": xp_bar_percentage,
            "xp_earned_in_level": xp_earned_in_level,
            "xp_needed_for_level": xp_needed_for_level,
            "total_xp": total_xp,
            "last_interaction": last_interaction_data,
            "categories": relationship_data.get('categories', []), # Use fetched categories
            "relationship_tags": relationship_data.get('tags', []) # Keep tags for now
        }

        return jsonify(overview_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API endpoint to get relationship interaction thread
@app.route('/relationships/<int:relationship_id>/interactions_thread', methods=['GET'])
def get_relationship_interaction_thread(relationship_id):
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    try:
        # Fetch interaction logs ordered by created_at desc
        interactions_response = supabase.table('interactions').select("*").eq('relationship_id', relationship_id).order('created_at', desc=True).execute()
        if not interactions_response.data: # Check if data is empty
            return jsonify({"error": "No interactions found for this relationship"}), 404


        interaction_thread_data = [dict(row) for row in interactions_response.data]
        return jsonify(interaction_thread_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Run the Flask app
    # Use debug=True for development, allows auto-reloading
    # Use port 5001 to avoid potential conflicts with other services
    app.run(debug=True, port=5001)
