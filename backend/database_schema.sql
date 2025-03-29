-- Database Schema for Social Links Application

-- Relationships Table (Core table for people/connections)
CREATE TABLE relationships (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    relationship_type VARCHAR(100) NOT NULL, -- Initial relationship type
    reminder_interval VARCHAR(100) NOT NULL, -- Reminder frequency
    category VARCHAR(100) NOT NULL, -- Primary category (e.g., Friend, Business)
    level INTEGER DEFAULT 1, -- Current relationship level (1-10)
    xp INTEGER DEFAULT 0, -- Total experience points
    tags TEXT[], -- Array of tags for filtering and categorization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interactions Table (Logs of interactions with relationships)
CREATE TABLE interactions (
    id SERIAL PRIMARY KEY,
    relationship_id INTEGER REFERENCES relationships(id) ON DELETE CASCADE,
    interaction_log TEXT NOT NULL, -- The actual interaction content
    tone_tag VARCHAR(100), -- Optional user-provided tone/mood tag
    sentiment_analysis TEXT, -- AI-generated sentiment analysis
    xp_gain INTEGER, -- XP points awarded (1-3)
    suggested_tone TEXT, -- AI-suggested tone tag
    evolution_suggestion TEXT, -- Potential relationship category evolution
    ai_reasoning TEXT, -- Explanation for XP score
    patterns TEXT, -- Detected recurring patterns
    interaction_suggestion TEXT, -- Suggestion for next interaction
    is_milestone BOOLEAN DEFAULT FALSE, -- Whether this is a milestone interaction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quests Table (Suggested actions to deepen relationships)
CREATE TABLE quests (
    id SERIAL PRIMARY KEY,
    relationship_id INTEGER REFERENCES relationships(id) ON DELETE CASCADE,
    quest_description TEXT NOT NULL, -- Description of the quest
    quest_status VARCHAR(50) NOT NULL, -- e.g., pending, completed, skipped
    milestone_level INTEGER, -- Level at which this quest was suggested
    completion_date TIMESTAMP WITH TIME ZONE, -- When the quest was completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table (Types of relationships)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Friend', 'Personal friendship relationship'),
('Business', 'Professional or work-related connection'),
('Family', 'Family member or relative'),
('Romantic', 'Romantic relationship or partner'),
('Acquaintance', 'Someone you know but not closely'),
('Mentor', 'Someone who provides guidance or advice'),
('Mentee', 'Someone you mentor or guide');

-- RelationshipCategories Table (Junction table for many-to-many relationship)
CREATE TABLE relationship_categories (
    relationship_id INTEGER REFERENCES relationships(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (relationship_id, category_id)
);

-- Tags Table (For emotional tagging and filtering)
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50), -- e.g., emotion, topic, importance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tags
INSERT INTO tags (name, type) VALUES
('High Priority', 'importance'),
('Close Friend', 'relationship'),
('Inspiring', 'emotion'),
('Draining', 'emotion'),
('Fun', 'emotion'),
('Deep', 'emotion'),
('Work', 'topic'),
('Personal', 'topic');

-- RelationshipTags Table (Junction table for many-to-many relationship)
CREATE TABLE relationship_tags (
    relationship_id INTEGER REFERENCES relationships(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (relationship_id, tag_id)
);

-- InteractionTags Table (Junction table for tagging interactions)
CREATE TABLE interaction_tags (
    interaction_id INTEGER REFERENCES interactions(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (interaction_id, tag_id)
);

-- Reminders Table (For notification management)
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    relationship_id INTEGER REFERENCES relationships(id) ON DELETE CASCADE,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- LevelHistory Table (Track level progression over time)
CREATE TABLE level_history (
    id SERIAL PRIMARY KEY,
    relationship_id INTEGER REFERENCES relationships(id) ON DELETE CASCADE,
    old_level INTEGER NOT NULL,
    new_level INTEGER NOT NULL,
    xp_gained INTEGER NOT NULL,
    interaction_id INTEGER REFERENCES interactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reflections Table (For private thoughts and reflections)
CREATE TABLE reflections (
    id SERIAL PRIMARY KEY,
    relationship_id INTEGER REFERENCES relationships(id) ON DELETE CASCADE,
    interaction_id INTEGER REFERENCES interactions(id) ON DELETE SET NULL,
    reflection_text TEXT NOT NULL,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Milestones Table (Special relationship events)
CREATE TABLE milestones (
    id SERIAL PRIMARY KEY,
    relationship_id INTEGER REFERENCES relationships(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    milestone_date TIMESTAMP WITH TIME ZONE,
    interaction_id INTEGER REFERENCES interactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- UserSettings Table (For app configuration)
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE, -- For future multi-user support
    notifications_enabled BOOLEAN DEFAULT TRUE,
    ai_insights_enabled BOOLEAN DEFAULT TRUE,
    dark_mode BOOLEAN DEFAULT FALSE,
    data_sync_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_interactions_relationship_id ON interactions(relationship_id);
CREATE INDEX idx_interactions_created_at ON interactions(created_at);
CREATE INDEX idx_quests_relationship_id ON quests(relationship_id);
CREATE INDEX idx_relationship_categories_relationship_id ON relationship_categories(relationship_id);
CREATE INDEX idx_relationship_tags_relationship_id ON relationship_tags(relationship_id);
CREATE INDEX idx_reminders_relationship_id ON reminders(relationship_id);
CREATE INDEX idx_reminders_reminder_date ON reminders(reminder_date);

-- Category History Table (Track when categories are added/changed for a relationship)
CREATE TABLE category_history (
    id SERIAL PRIMARY KEY,
    relationship_id INTEGER REFERENCES relationships(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL, -- e.g., 'added', 'removed' (though current logic only adds/replaces)
    interaction_id INTEGER REFERENCES interactions(id) ON DELETE SET NULL, -- Optional: Link to interaction that triggered suggestion
    user_confirmed BOOLEAN DEFAULT TRUE, -- Assumes changes via PUT are user-confirmed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_category_history_relationship_id ON category_history(relationship_id);


-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_relationships_modtime
BEFORE UPDATE ON relationships
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_interactions_modtime
BEFORE UPDATE ON interactions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_quests_modtime
BEFORE UPDATE ON quests
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_reminders_modtime
BEFORE UPDATE ON reminders
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_reflections_modtime
BEFORE UPDATE ON reflections
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Views for common queries

-- Dashboard View (For home screen)
CREATE VIEW dashboard_view AS
SELECT 
    r.id,
    r.name,
    r.photo_url,
    r.level,
    r.category,
    r.tags,
    COALESCE(
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - MAX(i.created_at))),
        NULL
    ) AS days_since_interaction
FROM 
    relationships r
LEFT JOIN 
    interactions i ON r.id = i.relationship_id
GROUP BY 
    r.id, r.name, r.photo_url, r.level, r.category, r.tags;

-- Overdue Reminders View
CREATE VIEW overdue_reminders_view AS
SELECT 
    rem.id AS reminder_id,
    r.id AS relationship_id,
    r.name,
    r.photo_url,
    rem.reminder_date,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - rem.reminder_date)) AS days_overdue
FROM 
    reminders rem
JOIN 
    relationships r ON rem.relationship_id = r.id
WHERE 
    rem.reminder_date < CURRENT_TIMESTAMP
    AND rem.is_sent = FALSE
    AND rem.is_dismissed = FALSE;
