-- Migration: Update time_logs table for retroactive calendar logbook
ALTER TABLE public.time_logs ADD COLUMN start_time TIMESTAMPTZ;
ALTER TABLE public.time_logs ADD COLUMN end_time TIMESTAMPTZ;
ALTER TABLE public.time_logs ADD COLUMN date DATE;
ALTER TABLE public.time_logs ADD COLUMN checklist_item_id UUID;
