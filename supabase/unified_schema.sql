-- UNIFIED PRODUCTION SCHEMA FOR MYGTD APP
-- Paste this script into the Supabase Dashboard SQL Editor and run it.

-- 1. ENUMS AND TYPES
CREATE TYPE project_status AS ENUM ('active', 'completed', 'someday');
CREATE TYPE task_status AS ENUM ('inbox', 'next_action', 'waiting', 'done', 'scheduled');
CREATE TYPE routine_interval AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE time_log_type AS ENUM ('active', 'interrupted');
CREATE TYPE project_reference_type AS ENUM ('text', 'image_url');
CREATE TYPE routine_time_of_day AS ENUM ('morning', 'afternoon', 'evening');

-- 2. TABLES

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    outcome_description TEXT,
    status project_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status task_status NOT NULL DEFAULT 'inbox',
    type TEXT NOT NULL DEFAULT 'standard',
    routine_interval routine_interval,
    context TEXT,
    time_estimate_minutes INTEGER,
    scheduled_date DATE,
    is_routine BOOLEAN NOT NULL DEFAULT false,
    routine_time_of_day routine_time_of_day,
    routine_exact_time TEXT,
    routine_day_of_week INTEGER,
    event_date DATE,
    event_start_time TEXT,
    event_end_time TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    checklist JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Time Logs
CREATE TABLE public.time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    duration_seconds INTEGER NOT NULL,
    log_type TEXT NOT NULL CHECK (log_type IN ('active', 'interrupted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal Plans
CREATE TABLE public.meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_title TEXT NOT NULL,
    recipe_text TEXT,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project References
CREATE TABLE public.project_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type project_reference_type NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily Reflections
CREATE TABLE public.daily_reflections (
    date DATE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    PRIMARY KEY (date, user_id)
);

-- 3. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own time logs" ON public.time_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own meal plans" ON public.meal_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own daily reflections" ON public.daily_reflections FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own project references" ON public.project_references FOR ALL 
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_references.project_id AND projects.user_id = auth.uid()));

-- 5. TRIGGER FOR USER CREATION (Copies user from auth.users to public.users)

CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
