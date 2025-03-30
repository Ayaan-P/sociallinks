import os
from dotenv import load_dotenv
from anthropic import Anthropic
import json

load_dotenv()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY is not set in environment variables")

anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

def generate_quest(level, categories, recent_interactions=None):
    """
    Generates a personalized quest for a relationship based on level, categories, and recent interactions.
    
    Args:
        level (int): The current relationship level (1-10).
        categories (list[str]): List of current categories for the relationship.
        recent_interactions (list[str], optional): List of recent interaction logs.
        
    Returns:
        str: A personalized quest description.
    """
    try:
        # Determine if this is a milestone level
        is_milestone = level in [3, 5, 7, 10]
        
        # Prepare recent interactions context
        recent_context = ""
        if recent_interactions and len(recent_interactions) > 0:
            recent_context = "Recent interactions:\n" + "\n".join([f"- {interaction}" for interaction in recent_interactions])
        
        # Create the prompt for Claude
        response = anthropic_client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=300,
            system="""You are the AI assistant for Dytto, a relationship journaling app. Your task is to generate personalized quests for users to deepen their relationships.

QUEST TYPES:
1. Category-based Quests - Based on relationship type:
   - Friend: Focus on shared experiences, curiosity about their life, spontaneous activities
   - Romantic: Focus on vulnerability, future plans, appreciation, quality time
   - Business: Focus on feedback, professional growth, boundaries, mutual goals
   - Mentor: Focus on learning, gratitude, structured growth
   - Intellectual: Focus on debates, shared learning, challenging ideas
   - Emotional Support: Focus on checking in, acknowledging support, reciprocity

2. Milestone Quests - Based on relationship level:
   - Level 3: Open curiosity (e.g., "Ask a big question you've never asked before")
   - Level 5: Shared vulnerability (e.g., "Tell them a story you rarely share")
   - Level 7: Mutual impact (e.g., "Reflect: How has this person changed you?")
   - Level 10: Celebration/Honor (e.g., "Write a 'letter of meaning' to them")

3. Recurring/Contextual Quests - Based on recent interactions:
   - If they've been supportive: "Acknowledge a specific way they helped you recently"
   - If communication has been sparse: "Reach out just to say hi"
   - If they shared something personal: "Follow up on something important they mentioned"

GUIDELINES:
- Quests should be specific, actionable, and meaningful
- Adapt to the relationship's current level (deeper/more vulnerable at higher levels)
- Consider all categories if multiple exist (e.g., Friend + Business)
- Prioritize milestone quests if the relationship is at a milestone level (3, 5, 7, 10)
- Use recent interactions to make quests contextually relevant when possible
- Keep quest descriptions concise (1-2 sentences)
- Focus on deepening the relationship in an authentic way
- Avoid manipulative or transactional suggestions

Your response should be ONLY the quest description text, with no additional explanation or commentary.""",
            messages=[
                {
                    "role": "user",
                    "content": f"Generate a quest for a relationship with these details:\n\nLevel: {level}\nCategories: {', '.join(categories)}\nIs milestone level: {is_milestone}\n\n{recent_context}"
                }
            ]
        )
        
        quest_description = response.content[0].text.strip()
        return quest_description
        
    except Exception as e:
        print(f"Error generating quest: {e}")
        # Fallback quests based on level if AI fails
        fallback_quests = {
            1: "Reach out and schedule a time to catch up.",
            2: "Ask them about something they're passionate about.",
            3: "Share something you've been thinking about lately.",
            4: "Invite them to try something new together.",
            5: "Tell them something you appreciate about them.",
            6: "Ask for their perspective on a challenge you're facing.",
            7: "Reflect on how your relationship has evolved.",
            8: "Plan a meaningful experience together.",
            9: "Share a memory that's important to you.",
            10: "Express what this relationship means to you."
        }
        return fallback_quests.get(level, "Connect in a meaningful way this week.")

def generate_milestone_quest(level, categories, recent_interactions=None):
    """
    Generates a milestone-specific quest based on the relationship level, categories, and interaction history.
    Uses AI to create personalized milestone quests when possible.
    
    Args:
        level (int): The current relationship level (should be 3, 5, 7, or 10).
        categories (list[str]): List of current categories for the relationship.
        recent_interactions (list[str], optional): List of recent interaction logs.
        
    Returns:
        str: A personalized milestone quest description.
    """
    if level not in [3, 5, 7, 10]:
        return generate_quest(level, categories, recent_interactions)  # Not a milestone level, use regular quest
    
    # Define milestone themes for context
    milestone_themes = {
        3: "Open curiosity - asking meaningful questions to deepen understanding",
        5: "Shared vulnerability - revealing more personal aspects of yourself",
        7: "Mutual impact - reflecting on how you've influenced each other",
        10: "Celebration and honor - commemorating the significance of your relationship"
    }
    
    try:
        # Prepare recent interactions context
        recent_context = ""
        if recent_interactions and len(recent_interactions) > 0:
            recent_context = "Recent interactions:\n" + "\n".join([f"- {interaction}" for interaction in recent_interactions])
        
        # Create the prompt for Claude with milestone-specific guidance
        response = anthropic_client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=300,
            system=f"""You are the AI assistant for Dytto, a relationship journaling app. Your task is to generate a personalized milestone quest for a relationship that has reached level {level}.

MILESTONE LEVEL {level} THEME: {milestone_themes[level]}

MILESTONE QUEST GUIDELINES:
- Level 3 quests focus on open curiosity - asking meaningful questions that deepen understanding
- Level 5 quests focus on shared vulnerability - revealing more personal aspects of yourself
- Level 7 quests focus on mutual impact - reflecting on how you've influenced each other
- Level 10 quests focus on celebration and honor - commemorating the significance of your relationship

QUEST CREATION GUIDELINES:
- Create a quest that feels meaningful and appropriate for this milestone level
- Adapt to the relationship's categories: {', '.join(categories)}
- Use the recent interaction history to make the quest contextually relevant
- Make the quest specific and personalized, not generic
- Keep the quest description concise (1-2 sentences)
- Focus on deepening the relationship in an authentic way
- Avoid manipulative or transactional suggestions

Your response should be ONLY the quest description text, with no additional explanation or commentary.""",
            messages=[
                {
                    "role": "user",
                    "content": f"Generate a milestone quest for level {level} with these details:\n\nCategories: {', '.join(categories)}\nMilestone theme: {milestone_themes[level]}\n\n{recent_context}"
                }
            ]
        )
        
        quest_description = response.content[0].text.strip()
        return quest_description
        
    except Exception as e:
        print(f"Error generating milestone quest: {e}")
        # Fallback to predefined milestone quests if AI fails
        milestone_quests = {
            3: {
                "theme": "Open curiosity",
                "default": "Ask a big question you've never asked before.",
                "Friend": "Ask them about a childhood memory that shaped who they are today.",
                "Romantic": "Ask about a dream or aspiration they haven't shared with many people.",
                "Business": "Ask about their long-term vision beyond current projects.",
                "Mentor": "Ask them about a formative challenge in their career path.",
                "Intellectual": "Ask them about a belief they've changed their mind on.",
                "Emotional Support": "Ask what helps them feel supported during difficult times."
            },
            5: {
                "theme": "Shared vulnerability",
                "default": "Tell them a story you rarely share.",
                "Friend": "Share a personal insecurity or fear you don't often discuss.",
                "Romantic": "Share a vulnerability about your feelings or needs in relationships.",
                "Business": "Share a professional challenge you're struggling with.",
                "Mentor": "Share an area where you feel uncertain or inadequate.",
                "Intellectual": "Share a deeply held belief you're questioning.",
                "Emotional Support": "Share something difficult you're currently processing."
            },
            7: {
                "theme": "Mutual impact",
                "default": "Reflect: How has this person changed you?",
                "Friend": "Tell them specifically how their friendship has influenced your life.",
                "Romantic": "Share how this relationship has changed your perspective on love.",
                "Business": "Acknowledge how working with them has impacted your professional growth.",
                "Mentor": "Express how their guidance has shaped your path.",
                "Intellectual": "Describe how their ideas have influenced your thinking.",
                "Emotional Support": "Share how their support has helped you through challenges."
            },
            10: {
                "theme": "Celebration / Honor",
                "default": "Write a 'letter of meaning' expressing what this relationship means to you.",
                "Friend": "Create a meaningful gesture or gift that celebrates your friendship.",
                "Romantic": "Plan a special occasion to honor your relationship journey.",
                "Business": "Formally recognize your professional relationship's achievements.",
                "Mentor": "Create a tribute acknowledging their impact on your development.",
                "Intellectual": "Collaborate on something that represents your shared intellectual journey.",
                "Emotional Support": "Create a memento symbolizing the support you've given each other."
            }
        }
        
        # If multiple categories exist, choose the most appropriate one based on priority
        priority_order = ["Romantic", "Mentor", "Emotional Support", "Friend", "Business", "Intellectual"]
        selected_category = None
        
        for category in priority_order:
            if category in categories:
                selected_category = category
                break
        
        if selected_category and selected_category in milestone_quests[level]:
            return milestone_quests[level][selected_category]
        else:
            return milestone_quests[level]["default"]

def generate_recurring_quest(categories):
    """
    Generates a simple recurring quest based on relationship categories.
    
    Args:
        categories (list[str]): List of current categories for the relationship.
        
    Returns:
        str: A recurring quest description.
    """
    recurring_quests = {
        "Friend": [
            "Reach out just to say hi.",
            "Share something that made you think of them.",
            "Invite them for a casual hangout."
        ],
        "Romantic": [
            "Express appreciation for something specific they did recently.",
            "Plan a surprise date night.",
            "Share a memory of when you first met."
        ],
        "Business": [
            "Check in on their current projects.",
            "Share an article or resource relevant to their work.",
            "Offer specific feedback on a recent collaboration."
        ],
        "Mentor": [
            "Share an update on how you've applied their advice.",
            "Ask for their perspective on a current challenge.",
            "Express gratitude for a specific piece of guidance."
        ],
        "Intellectual": [
            "Share an interesting article or book you've discovered.",
            "Propose a thought experiment or debate topic.",
            "Ask their opinion on a complex issue."
        ],
        "Emotional Support": [
            "Check in on how they're doing.",
            "Remind them of a strength you admire.",
            "Offer support for something they're working through."
        ]
    }
    
    # If multiple categories exist, randomly select one
    import random
    available_quests = []
    
    for category in categories:
        if category in recurring_quests:
            available_quests.extend(recurring_quests[category])
    
    if available_quests:
        return random.choice(available_quests)
    else:
        return "Reach out and reconnect this week."
