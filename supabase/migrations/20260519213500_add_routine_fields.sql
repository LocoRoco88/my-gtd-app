-- Create routine_time_of_day type
CREATE TYPE public.routine_time_of_day AS ENUM ('morning', 'afternoon', 'evening');

-- Add routine columns to tasks
ALTER TABLE public.tasks
ADD COLUMN is_routine BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN routine_time_of_day public.routine_time_of_day;
