import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from supabase import create_client, Client
from services.ai_processing import analyze_sentiment, calculate_xp, get_relationship_level, update_relationship_level, process_interaction_log_ai, detect_patterns, suggest_evolution, suggest_interaction
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
    if not data or not all(k in data for k in ("name", "relationship_type", "reminder_interval", "category")):
        return jsonify({"error": "Missing required fields: name, relationship_type, reminder_interval, category"}), 400

    name = data['name']
    relationship_type = data['relationship_type']
    reminder_interval = data['reminder_interval']
    category = data['category'] # e.g., "Friend", "Business"
    photo_url = data.get('photo_url') # Optional photo URL
    tags = data.get('tags', []) # Optional tags, e.g., ["High Priority", "Close Friend"]

    try:
        # Insert data into Supabase 'relationships' table
        response = supabase.table('relationships').insert({
            'name': name,
            'relationship_type': relationship_type,
            'reminder_interval': reminder_interval,
            'category': category,
            'photo_url': photo_url,
            'tags': tags,
            'level': 1,  # Initialize level to 1
            'xp': 0      # Initialize XP to 0
        }).execute()

        if hasattr(response, 'error') and response.error:
            return jsonify({"error": response.error.message}), 500
        
        if not response.data:
            return jsonify({"error": "Failed to create relationship in database"}), 500

        return jsonify(response.data[0]), 201 # Return the newly created relationship

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API endpoint to get all relationships
@app.route('/relationships', methods=['GET'])
def get_relationships():
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    try:
        response = supabase.table('relationships').select("*").execute()
        if response.error:
            return jsonify({"error": response.error.message}), 500
        return jsonify([dict(row) for row in response.data]), 200 # Convert list of Row objects to list of dicts
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API endpoint to get a specific relationship by ID
@app.route('/relationships/<int:relationship_id>', methods=['GET'])
def get_relationship(relationship_id):
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    try:
        response = supabase.table('relationships').select("*").eq('id', relationship_id).execute()
        if response.error:
            return jsonify({"error": response.error.message}), 500
        if not response.data:
            return jsonify({"error": "Relationship not found"}), 404
        return jsonify(dict(response.data[0])), 200 # Return the relationship as a dict
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API endpoint to update an existing relationship
@app.route('/relationships/<int:relationship_id>', methods=['PUT'])
def update_relationship(relationship_id):
    if not supabase:
        return jsonify({"error": "Supabase is not initialized."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided for update"}), 400

    try:
        # Update data in Supabase 'relationships' table
        response = supabase.table('relationships').update(data).eq('id', relationship_id).execute()

        if response.error:
            return jsonify({"error": response.error.message}), 500

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

        # --- AI Processing ---
        # Get current relationship level
        current_level = get_relationship_level(relationship_id)
        
        # Process the interaction log with AI
        sentiment_analysis, xp_gain, reasoning, patterns, evolution_suggestion, interaction_suggestion = process_interaction_log_ai(interaction_log, current_level)
        
        # Use detailed sentiment analysis as suggested tone
        suggested_tone = sentiment_analysis

        # --- Level Up Logic ---
        current_level = get_relationship_level(relationship_id)
        new_level = current_level + int(xp_gain)
        # In a real application, update_relationship_level(relationship_id, new_level, new_level_value=new_level) # Assuming you want to update level in db

        interaction_data = response.data[0]
        interaction_data['sentiment_analysis'] = sentiment_analysis  # Detailed sentiment analysis from AI
        interaction_data['xp_gain'] = xp_gain  # XP gain from AI
        interaction_data['suggested_tone'] = suggested_tone
        interaction_data['evolution_suggestion'] = evolution_suggestion
        interaction_data['ai_reasoning'] = reasoning  # Include AI reasoning in response
        interaction_data['patterns'] = patterns  # Include detected patterns
        interaction_data['interaction_suggestion'] = interaction_suggestion  # Include interaction suggestion

        # Update the relationship level in the database
        try:
            # Get current relationship data
            relationship_response = supabase.table('relationships').select("*").eq('id', relationship_id).execute()
            if hasattr(relationship_response, 'error') and relationship_response.error:
                print(f"Error fetching relationship data: {relationship_response.error.message}")
            elif relationship_response.data:
                relationship_data = relationship_response.data[0]
                
                # Get current level and XP
                current_level = relationship_data.get('level', 1)
                current_xp = relationship_data.get('xp', 0)
                
                # Add new XP
                new_xp = current_xp + int(xp_gain)
                
                # Calculate new level (simple implementation - 100 XP per level)
                xp_per_level = 100
                new_level = 1 + (new_xp // xp_per_level)
                
                print(f"Updating relationship {relationship_id}: level {current_level}->{new_level}, XP {current_xp}->{new_xp}")
                
                # Update both level and XP
                update_data = {
                    'level': new_level,
                    'xp': new_xp
                }
                
                # Update in database
                update_response = supabase.table('relationships').update(update_data).eq('id', relationship_id).execute()
                
                if hasattr(update_response, 'error') and update_response.error:
                    print(f"Error updating relationship: {update_response.error.message}")
                else:
                    print(f"Successfully updated relationship: level={new_level}, xp={new_xp}")
                    
                    # Verify the update
                    verify_response = supabase.table('relationships').select("*").eq('id', relationship_id).execute()
                    if verify_response.data:
                        verify_data = verify_response.data[0]
                        print(f"Verified update: level={verify_data.get('level')}, xp={verify_data.get('xp')}")
            else:
                print(f"No relationship data found for ID: {relationship_id}")
        except Exception as e:
            print(f"Exception updating relationship: {str(e)}")

        return jsonify(interaction_data), 201  # Return the created interaction log with AI feedback

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
    """Fetches and processes data for the dashboard view."""
    relationships_response = supabase.table('relationships').select("*").execute()
    if hasattr(relationships_response, 'error') and relationships_response.error:
        raise Exception(f"Supabase error fetching relationships: {relationships_response.error.message}")
    relationships = relationships_response.data

    dashboard_items = []
    for relationship in relationships:
        last_interaction = None
        interactions_response = supabase.table('interactions').select("*").eq('relationship_id', relationship['id']).order('created_at', desc=True).limit(1).execute()
        if (not hasattr(interactions_response, 'error') or not interactions_response.error) and interactions_response.data:
            last_interaction = interactions_response.data[0]

        days_since_interaction = "Never"
        if last_interaction:
            last_interaction_date = datetime.strptime(last_interaction['created_at'], "%Y-%m-%dT%H:%M:%S.%f%z").replace(tzinfo=timezone.utc)
            time_difference = datetime.now(timezone.utc) - last_interaction_date
            days_since_interaction = time_difference.days

        dashboard_item = {
            "id": relationship['id'],
            "name": relationship['name'],
            "photo_url": relationship.get('photo_url'),
            "level": relationship.get('level', 1), # Default level to 1 if not set
            "days_since_interaction": days_since_interaction,
            "category": relationship['category'],
            "tags": relationship.get('tags', [])
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
        # Fetch relationship data
        relationship_response = supabase.table('relationships').select("*").eq('id', relationship_id).execute()
        if not relationship_response.data:
            return jsonify({"error": "Relationship not found"}), 404
        relationship_data = dict(relationship_response.data[0])
        print(f"Overview for relationship {relationship_id}: level = {relationship_data.get('level', 1)}")

        # Fetch last interaction log
        last_interaction_response = supabase.table('interactions').select("*").eq('relationship_id', relationship_id).order('created_at', desc=True).limit(1).execute()
        last_interaction_data = dict(last_interaction_response.data[0]) if last_interaction_response.data else None

        # Calculate XP bar value (XP progress within current level)
        xp_per_level = 100
        total_xp = relationship_data.get('xp', 0)
        level = relationship_data.get('level', 1)
        xp_bar = total_xp % xp_per_level  # XP progress within current level
        
        overview_data = {
            "photo_url": relationship_data.get('photo_url'),
            "name": relationship_data['name'],
            "level": level,
            "reminder_settings": relationship_data.get('reminder_interval'),
            "xp_bar": xp_bar,
            "total_xp": total_xp,  # Include total XP
            "last_interaction": last_interaction_data,
            "relationship_tags": relationship_data.get('tags', [])
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
