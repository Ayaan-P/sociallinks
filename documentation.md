🧑‍💻 Full User Experience Description

🔐 Onboarding Flow

Welcome Screen: Logo + tagline: “Track and grow your real-world relationships.”

Core Idea Explainer: Carousel explaining:

Relationship levels (1–10)

Branching categories

How interaction logs fuel growth

Permissions: Request notification access for reminders

Create First Link: Prompt to add a person — enter name, relationship type, optional photo, reminder frequency

🏠 Home Dashboard

Displays all tracked people

Each card shows:

Name + photo

Current level with XP bar

Days since last interaction

Tags for categories (e.g., "Friend + Business")

“+ Add New Person” button (top & bottom)

Tapping a person opens their profile

➕ Add Person Flow

User enters:

Name (required)

Photo (optional)

Initial category (Friend, Business, etc.)

Reminder interval (weekly, monthly, custom)

Confirmation message: “Link created. Let’s build it together.”

📓 Logging an Interaction

From Dashboard or Profile → Tap “+ Log”

Write a journal-style entry (free text)

(Optional) Add tone tag: Happy, Deep, Draining, etc.

Submit log → AI processes it:

Sentiment analysis

XP score (1–3)

Suggested tone

Possible evolution suggestion (if applicable)

🆙 Level Up Experience

Celebratory animation: XP bar fills and flashes

Message: “You’ve reached Level X with [Name]!”

Prompt to add a memory, reflect, or view past entries

If a new relationship category is unlocked, a “new branch” appears in tree view

🧾 Profile View (Person Detail)

Tabs:

Overview

Photo, name, current level, reminder settings, XP bar, last interaction

Relationship tags with editable labels

Thread

Full scrollable list of interactions (most recent first)

Pinned or milestone-tagged logs highlighted

Tree View

Current categories

Locked potential branches greyed out (future goal)

Insights (v2+)

AI-generated recaps, suggestions, sentiment trends

🔔 Reminder UX

Users set reminder intervals per person

Notification: “Time to reconnect with [Name]?”

Tap → opens quick interaction log modal with CTA: “What did you talk about?”

🤖 AI Interaction (All Stages)

After every log:

Shows XP gain and reasoning

Predicts mood/tone

Detects recurring emotional patterns

If threshold is met, suggests evolving the category

At Milestones:

Generates short memory recap: “This friendship has grown through X shared experiences.”

Suggests next steps: “Ask about Y to deepen the bond.”

📅 Memory Thread UX

Timeline-style scroll with emoji + tone tags per entry

Entries groupable by theme (e.g. “vulnerable moments”)

Tapping an entry expands it with options:

Add reflection

Pin as milestone

Tag with emotion

🧭 Constellation View UX

Optional alternate map-based dashboard

Central “You” node with orbiting relationship nodes

Node size = XP Level

Distance = recency

Color = category blend

Filter toolbar:

Show only Friends / Romantic / Business

Highlight overdue connections

✍️ Emotional Tagging

Accessible via interaction log or person profile

Add tags like: “Inspiring,” “Draining,” “Confusing”

Private tags stored securely, not shown on dashboard

Vault section to browse emotional history

📅 Story Recap Carousel UX

Monthly or milestone-based memory reel

Includes:

Summarized relationships

Suggested reflections

Throwback entries with option to revisit or comment

🔮 Future Path View

Tab in Profile view

Shows top 2–3 predicted paths (AI-generated)

Example:

"Trending toward close friend"

"Possible romantic interest"

"Needs nurturing"

“What could help?” → AI suggests a micro-quest

🎮 Interaction Quests

Unlocked at levels 2, 4, 6, etc.

Suggested goals like:

Ask about their childhood

Invite to something new

Share a personal belief

Tapping a quest marks it as done or logs a confirming interaction

Optional “Quest Streak” tracker for encouragement

⚙️ Settings / Data UX

Minimalist menu:

Export Data (PDF or JSON)

Notification center

AI Insight toggle

Dark mode

Privacy vault for reflections and tags

🛠️ MVP Feature Set

1. Add a Person

Fields: Name, Photo (optional), Initial Relationship Type (e.g. Business, Friend, etc.)

Optionally tag importance (e.g., High Priority)

2. Log an Interaction

Freeform journal entry

Optional tags: mood, topic, type (call, in-person, event)

AI suggests XP gain (+1–3) and sentiment tone

3. Relationship Levels (1–10)

Levels increase with XP

Each level triggers:

Memory prompt

Recap screen

Potential relationship branching

4. Dashboard View

List of people showing:

Level

Last interaction

Overdue badge

Category badge(s)

5. Custom Reminders

User-defined frequency (e.g. biweekly)

Push notification when overdue

## 🔐 Privacy & Data Ownership

- Local-only journaling available
- End-to-end encryption for sensitive tags
- Exportable PDF summaries per person
- Optional data sync with cloud (toggleable)

---

## 🎯 Target Users
- People seeking more intentional relationships
- Fans of Persona-style mechanics
- Self-improvement & journaling enthusiasts
- Neurodivergent users who benefit from social structure

---

## 📈 Growth Hooks
- AI-delivered insights (surprise + delight)
- Personal memory storytelling
- Milestone recaps with optional private sharing
- Gamified XP feedback loop

---

## 🧪 Planned Experiments
- A/B test AI-scored vs. manual XP logging
- Add vs. evolve category flow
- Surprise stories: “You’ve known Alex for 100 days. Here's your memory book.”

---

## ⏳ Future Expansion
- Couples mode / Close friend journal
- Integration with calendar, WhatsApp, photos
- Relationship goal setting (“Reach Level 7 by June”)
- B2B: Team bonding / HR version

---

## 🧰 Tech Stack Suggestion
- React Native (Expo)
- Supabase or Firebase (realtime DB + auth)
- GPT-4o API for all AI interactions
- Local-first data with cloud opt-in

---

## 🧠 Next Steps
- Build onboarding flow
- Design database schema for people, logs, categories, scores
- Draft AI prompt set for scoring, category evolution, and memory recap
- Prototype core UI views (React Native)
- Internal test with 10–20 users

