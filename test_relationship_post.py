import requests
import json

# Base URL for the Flask backend
BASE_URL = "https://lucky-llamas-clap.loca.lt"

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
    except json.JSONDecodeError:
        print("Response is not valid JSON:")
        print(response.text)
    
    return response

if __name__ == "__main__":
    print("Testing POST /relationships endpoint...")
    test_create_relationship()
