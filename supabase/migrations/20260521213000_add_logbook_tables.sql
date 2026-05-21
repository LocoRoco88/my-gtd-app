-- Add completed_at and checklist to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;

-- Create time_logs table
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    duration_seconds INTEGER NOT NULL,
    log_type TEXT NOT NULL CHECK (log_type IN ('active', 'interrupted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_reflections table
CREATE TABLE IF NOT EXISTS daily_reflections (
    date DATE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    PRIMARY KEY (date, user_id)
);
