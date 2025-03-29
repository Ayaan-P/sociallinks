import os
import sys
from dotenv import load_dotenv
import json

# Add the parent directory to sys.path to import from services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from .env file
load_dotenv()

# Import AI processing functions
from services.ai_processing import process_interaction_log_ai

def test_ai_processing():
    """
    Test the AI processing functionality with sample interaction logs.
    """
    print("Testing AI Processing...")
    
    # Sample interaction logs for testing
    test_logs = [
        {
            "level": 1,
            "log": "Had coffee with Alex today. We talked about work and our weekend plans. It was a nice casual conversation."
        },
        {
            "level": 3,
            "log": "Met with Sarah for lunch. She opened up about her struggles with anxiety. I shared some of my experiences too. It felt like we really connected on a deeper level."
        },
        {
            "level": 6,
            "log": "John and I discussed a potential business partnership. We've been friends for years, but this is the first time we're considering working together professionally."
        }
    ]
    
    # Process each test log
    for i, test_case in enumerate(test_logs):
        print(f"\n--- Test Case {i+1}: Level {test_case['level']} ---")
        print(f"Interaction Log: {test_case['log']}")
        
        # Call the AI processing function
        sentiment_analysis, xp_score, reasoning, patterns, evolution_suggestion, interaction_suggestion = process_interaction_log_ai(
            test_case['log'], 
            test_case['level']
        )
        
        # Print the results
        print("\nResults:")
        print(f"Sentiment Analysis: {sentiment_analysis}")
        print(f"XP Score: {xp_score}")
        print(f"Reasoning: {reasoning}")
        print(f"Patterns: {patterns}")
        print(f"Evolution Suggestion: {evolution_suggestion}")
        print(f"Interaction Suggestion: {interaction_suggestion}")
        
        # Format as JSON for easy viewing
        result_json = {
            "sentiment_analysis": sentiment_analysis,
            "xp_score": xp_score,
            "reasoning": reasoning,
            "patterns": patterns,
            "evolution_suggestion": evolution_suggestion,
            "interaction_suggestion": interaction_suggestion
        }
        
        print("\nJSON Response:")
        print(json.dumps(result_json, indent=2))
        
        print("\n" + "-" * 50)

if __name__ == "__main__":
    test_ai_processing()
