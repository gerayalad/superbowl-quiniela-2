-- Super Bowl Quiniela Database Schema
-- Run this in PostgreSQL to set up the database

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(20) UNIQUE NOT NULL,
    pin_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL,
    answer VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- Correct answers (set by admin)
CREATE TABLE IF NOT EXISTS correct_answers (
    question_id INTEGER PRIMARY KEY,
    answer VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Game settings
CREATE TABLE IF NOT EXISTS game_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    responses_visible BOOLEAN DEFAULT FALSE,
    predictions_locked BOOLEAN DEFAULT FALSE,
    CHECK (id = 1)
);

-- Initialize game settings with default values
INSERT INTO game_settings (id, responses_visible, predictions_locked)
VALUES (1, FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_question_id ON predictions(question_id);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
