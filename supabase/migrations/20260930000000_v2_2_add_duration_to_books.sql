-- Add duration_hours to book_reading_records
ALTER TABLE public.book_reading_records ADD COLUMN IF NOT EXISTS duration_hours numeric DEFAULT 0;
