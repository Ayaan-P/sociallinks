import requests
import json

# Base URL for the Flask backend
BASE_URL = "http://localhost:5001"

def test_create_relationship():
    """Test the POST /relationships endpoint"""
    
    # Prepare the data for creating a new relationship
    relationship_data = {
        "name": "Test Person",
        "relationship_type": "Friend",
        "reminder_interval": "Weekly",
        "category": "Friend",
        "photo_url": "https://example.com/photo.jpg",
        "tags": ["Test", "Important"]
    }
    
    # Send the POST request
    response = requests.post(f"{BASE_URL}/relationships", json=relationship_data)
    
    # Print the status code
    print(f"Status Code: {response.status_code}")
    
    # Print the response body
    try:
        print("Response Body:")
        print(json.dumps(response.json(), indent=4))
        return response.json()
    except json.JSONDecodeError:
        print("Response is not valid JSON:")
        print(response.text)
        return None

def test_create_interaction(relationship_id):
    """Test the POST /interactions endpoint"""
    
    # Prepare the data for creating a new interaction
    interaction_data = {
        "relationship_id": relationship_id,
        "interaction_log": "Had a great conversation about work and family.",
        "tone_tag": "Positive"
    }
    
    # Send the POST request
    response = requests.post(f"{BASE_URL}/interactions", json=interaction_data)
    
    # Print the status code
    print(f"Status Code: {response.status_code}")
    
    # Print the response body
    try:
        print("Response Body:")
        print(json.dumps(response.json(), indent=4))
    except json.JSONDecodeError:
        print("Response is not valid JSON:")
        print(response.text)
    
    return response

if __name__ == "__main__":
    print("Testing POST /relationships endpoint...")
    relationship = test_create_relationship()
    
    if relationship and 'id' in relationship:
        print("\nTesting POST /interactions endpoint...")
        test_create_interaction(relationship['id'])
    else:
        print("\nSkipping interaction test because relationship creation failed.")
