import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from supabase import create_client, Client
from services.ai_processing import analyze_sentiment, calculate_xp, get_relationship_level, update_relationship_level
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
            'tags': tags
        }).execute()

        if response.error:
            return jsonify({"error": response.error.message}), 500

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

        if response.error:
            return jsonify({"error": response.error.message}), 500

        # --- AI Processing ---
        sentiment = analyze_sentiment(interaction_log)
        xp_gain = calculate_xp(interaction_log)
        suggested_tone = sentiment # Placeholder for AI suggested tone
        evolution_suggestion = None # Placeholder for AI evolution suggestion

        # --- Level Up Logic ---
        current_level = get_relationship_level(relationship_id)
        new_level = current_level + xp_gain
        # In a real application, update the relationship level in the database
        # update_relationship_level(relationship_id, new_level)

        interaction_data = response.data[0]
        interaction_data['sentiment'] = sentiment
        interaction_data['xp_gain'] = xp_gain
        interaction_data['suggested_tone'] = suggested_tone
        interaction_data['evolution_suggestion'] = evolution_suggestion

        return jsonify(interaction_data), 201 # Return the created interaction log with AI feedback

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
        if not hasattr(interactions_response, 'error') or not interactions_response.error and interactions_response.data:
            last_interaction = interactions_response.data[0]

        days_since_interaction = "Never"
        if last_interaction:
            last_interaction_date = datetime.strptime(last_interaction['created_at'], "%Y-%m-%dT%H:%M:%S.%f%z").replace(tzinfo=timezone.utc)
            time_difference = datetime.now(timezone.utc) - last_interaction_date
            days_since_interaction = time_difference.days

        dashboard_item = {
            "id": relationship['id'],
            "name": relationship['name'],
            "photo_url": relationship['photo_url'],
            "level": relationship['level'], # Assuming level is directly available in relationship data
            "days_since_interaction": days_since_interaction,
            "category": relationship['category'],
            "tags": relationship['tags']
        }
        dashboard_items.append(dashboard_item)

    return dashboard_items

if __name__ == '__main__':
    # Run the Flask app
    # Use debug=True for development, allows auto-reloading
    # Use port 5001 to avoid potential conflicts with other services
    app.run(debug=True, port=5001)
