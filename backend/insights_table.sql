-- Create insights table to store pre-generated insights
CREATE TABLE IF NOT EXISTS insights (
    id SERIAL PRIMARY KEY,
    relationship_id INTEGER NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    interaction_trends JSONB NOT NULL,
    emotional_summary JSONB NOT NULL,
    relationship_forecasts JSONB NOT NULL,
    smart_suggestions JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(relationship_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS insights_relationship_id_idx ON insights(relationship_id);

-- Add comment to explain the table's purpose
COMMENT ON TABLE insights IS 'Stores pre-generated AI insights for relationships to avoid on-demand processing';
