-- Migration script to add new fields to the relationships table

-- Add bio field
ALTER TABLE relationships ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add birthday field
ALTER TABLE relationships ADD COLUMN IF NOT EXISTS birthday VARCHAR(50);

-- Add contact information fields
ALTER TABLE relationships ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE relationships ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add location field
ALTER TABLE relationships ADD COLUMN IF NOT EXISTS location TEXT;

-- Add preferred communication field
ALTER TABLE relationships ADD COLUMN IF NOT EXISTS preferred_communication VARCHAR(100);

-- Add meeting frequency field
ALTER TABLE relationships ADD COLUMN IF NOT EXISTS meeting_frequency VARCHAR(100);

-- Add notes field
ALTER TABLE relationships ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update the dashboard view to include new fields
DROP VIEW IF EXISTS dashboard_view;
CREATE VIEW dashboard_view AS
SELECT 
    r.id,
    r.name,
    r.bio,
    r.photo_url,
    r.level,
    r.category,
    r.tags,
    r.birthday,
    r.phone,
    r.email,
    r.location,
    r.preferred_communication,
    r.meeting_frequency,
    r.notes,
    COALESCE(
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - MAX(i.created_at))),
        NULL
    ) AS days_since_interaction
FROM 
    relationships r
LEFT JOIN 
    interactions i ON r.id = i.relationship_id
GROUP BY 
    r.id, r.name, r.bio, r.photo_url, r.level, r.category, r.tags, 
    r.birthday, r.phone, r.email, r.location, r.preferred_communication, 
    r.meeting_frequency, r.notes;

-- Update the overdue reminders view to include new fields
DROP VIEW IF EXISTS overdue_reminders_view;
CREATE VIEW overdue_reminders_view AS
SELECT 
    rem.id AS reminder_id,
    r.id AS relationship_id,
    r.name,
    r.bio,
    r.photo_url,
    r.birthday,
    r.phone,
    r.email,
    r.location,
    r.preferred_communication,
    r.meeting_frequency,
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

-- Add comments to explain the new fields
COMMENT ON COLUMN relationships.bio IS 'Brief description of the person';
COMMENT ON COLUMN relationships.birthday IS 'Person''s birthday in MM/DD/YYYY format';
COMMENT ON COLUMN relationships.phone IS 'Contact phone number';
COMMENT ON COLUMN relationships.email IS 'Contact email address';
COMMENT ON COLUMN relationships.location IS 'Where the person lives or works';
COMMENT ON COLUMN relationships.preferred_communication IS 'How they prefer to be contacted';
COMMENT ON COLUMN relationships.meeting_frequency IS 'How often to meet with this person';
COMMENT ON COLUMN relationships.notes IS 'Additional notes about the relationship';
