-- Add chapter and verses columns to bible_study_records
ALTER TABLE public.bible_study_records 
ADD COLUMN IF NOT EXISTS chapter text,
ADD COLUMN IF NOT EXISTS verses text;

-- Create book_reading_records table
CREATE TABLE IF NOT EXISTS public.book_reading_records (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT current_date,
  book_name text NOT NULL,
  author_name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for book_reading_records
ALTER TABLE public.book_reading_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own book reading records." 
  ON public.book_reading_records FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all book reading records." 
  ON public.book_reading_records FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert their own book reading records." 
  ON public.book_reading_records FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own book reading records." 
  ON public.book_reading_records FOR UPDATE 
  USING (auth.uid() = user_id);

-- Optional: You can update get_weekly_leaderboard to ignore admins automatically.
-- If you created get_weekly_leaderboard via the Supabase dashboard, you can 
-- replace it with this version that only includes users where role = 'member'.
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(start_date date, end_date date)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  completed_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.full_name,
    COALESCE(prayer_counts.count, 0) + COALESCE(study_counts.count, 0) as completed_count
  FROM 
    profiles p
  LEFT JOIN (
    SELECT pr.user_id, COUNT(*) as count 
    FROM prayer_records pr
    WHERE pr.date >= start_date AND pr.date <= end_date AND pr.status = 'Completed'
    GROUP BY pr.user_id
  ) prayer_counts ON p.id = prayer_counts.user_id
  LEFT JOIN (
    SELECT br.user_id, COUNT(*) as count 
    FROM bible_study_records br
    WHERE br.date >= start_date AND br.date <= end_date AND br.status = 'Completed'
    GROUP BY br.user_id
  ) study_counts ON p.id = study_counts.user_id
  WHERE p.role = 'member'
  ORDER BY completed_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
