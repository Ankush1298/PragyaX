-- PragyaX Database Schema (PostgreSQL / Supabase Compatible)
-- Owned by: Nagin (Supabase PostgreSQL Integration)

-- Enable UUID extension if on Supabase PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Preferences (Selected Subject, Profile Settings)
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    selected_subject_id VARCHAR(64) NOT NULL DEFAULT 'subj_python',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(64) NOT NULL DEFAULT 'code',
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    question_count INT NOT NULL DEFAULT 5,
    difficulty VARCHAR(32) NOT NULL DEFAULT 'Beginner to Intermediate'
);

-- 4. Assessment Questions Table
CREATE TABLE IF NOT EXISTS assessment_questions (
    id VARCHAR(64) PRIMARY KEY,
    subject_id VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE,
    question_number INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option VARCHAR(4) NOT NULL, -- 'A', 'B', 'C', 'D'
    explanation TEXT NOT NULL,
    topic VARCHAR(128) NOT NULL,
    difficulty VARCHAR(32) NOT NULL DEFAULT 'Intermediate'
);

-- 5. Learning Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(64) NOT NULL DEFAULT 'Python Programming',
    role VARCHAR(16) NOT NULL, -- 'user' | 'assistant'
    content TEXT NOT NULL,
    suggested_followups TEXT, -- JSON array
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Assessment Attempts (Persisted Evaluations)
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id VARCHAR(64) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    score INT NOT NULL,
    total INT NOT NULL,
    percentage DOUBLE PRECISION NOT NULL,
    proficiency_level VARCHAR(32) NOT NULL,
    summary_feedback TEXT NOT NULL,
    recommended_topics TEXT NOT NULL, -- JSON array
    user_answers TEXT NOT NULL, -- JSON object
    breakdown TEXT NOT NULL, -- JSON array
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Daily Challenges (Ankush's Module)
CREATE TABLE IF NOT EXISTS daily_challenges (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(128) NOT NULL,
    difficulty VARCHAR(32) NOT NULL DEFAULT 'Medium',
    description TEXT NOT NULL,
    code_snippet TEXT NOT NULL,
    question_type VARCHAR(32) NOT NULL DEFAULT 'multiple_choice',
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option VARCHAR(4) NOT NULL,
    explanation TEXT NOT NULL,
    points INT NOT NULL DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. User Challenge Submissions
CREATE TABLE IF NOT EXISTS user_challenge_submissions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id VARCHAR(64) NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
    submitted_answer VARCHAR(32) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    points_awarded INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_challenge UNIQUE (user_id, challenge_id)
);

-- 9. User Badges & Achievements
CREATE TABLE IF NOT EXISTS user_badges (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_key VARCHAR(64) NOT NULL,
    title VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(64) NOT NULL,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_key)
);

-- 10. Active Sessions (demo bearer tokens; replace with Supabase Auth in production)
CREATE TABLE IF NOT EXISTS active_sessions (
    token VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
