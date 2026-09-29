-- 1. Leaderboard Weeks Table
CREATE TABLE IF NOT EXISTS public.leaderboard_weeks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  start_date date NOT NULL,
  end_date date NOT NULL,
  month text NOT NULL,
  year integer NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  closed_at timestamp with time zone,
  UNIQUE(start_date, end_date)
);

-- Enable RLS for leaderboard_weeks
ALTER TABLE public.leaderboard_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view leaderboard weeks" ON public.leaderboard_weeks FOR SELECT USING (true);
CREATE POLICY "Only admins can modify leaderboard weeks" ON public.leaderboard_weeks FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2. Weekly Leaderboard (Historical Data)
CREATE TABLE IF NOT EXISTS public.weekly_leaderboards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_id uuid REFERENCES public.leaderboard_weeks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  completed_count bigint NOT NULL DEFAULT 0,
  rank integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(week_id, user_id)
);

-- Enable RLS for weekly_leaderboards
ALTER TABLE public.weekly_leaderboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view weekly leaderboards" ON public.weekly_leaderboards FOR SELECT USING (true);
CREATE POLICY "Only admins can modify weekly leaderboards" ON public.weekly_leaderboards FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- 3. Monthly Leaderboard (Historical Data)
CREATE TABLE IF NOT EXISTS public.monthly_leaderboards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  month text NOT NULL,
  year integer NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  completed_count bigint NOT NULL DEFAULT 0,
  rank integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(month, year, user_id)
);

-- Enable RLS for monthly_leaderboards
ALTER TABLE public.monthly_leaderboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view monthly leaderboards" ON public.monthly_leaderboards FOR SELECT USING (true);
CREATE POLICY "Only admins can modify monthly leaderboards" ON public.monthly_leaderboards FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Function: Transition Leaderboard Week
-- Idempotently closes the provided week and snapshots the data.
CREATE OR REPLACE FUNCTION public.transition_leaderboard_week(target_start_date date, target_end_date date)
RETURNS void AS $$
DECLARE
  v_week_id uuid;
  v_month text;
  v_year integer;
BEGIN
  -- Extract month and year from the end_date
  v_month := to_char(target_end_date, 'Month');
  v_year := extract(year from target_end_date);

  -- Insert or get the week record
  INSERT INTO public.leaderboard_weeks (start_date, end_date, month, year, status)
  VALUES (target_start_date, target_end_date, TRIM(v_month), v_year, 'active')
  ON CONFLICT (start_date, end_date) DO UPDATE SET status = 'active'
  RETURNING id INTO v_week_id;

  -- Delete existing snapshot data for this week if running again (idempotent)
  DELETE FROM public.weekly_leaderboards WHERE week_id = v_week_id;

  -- Calculate and insert the scores
  -- Using the existing logic from get_weekly_leaderboard
  INSERT INTO public.weekly_leaderboards (week_id, user_id, completed_count, rank)
  SELECT 
    v_week_id,
    user_id,
    completed_count,
    RANK() OVER (ORDER BY completed_count DESC) as rank
  FROM (
    SELECT 
      p.id as user_id,
      COALESCE(prayer_counts.count, 0) + COALESCE(study_counts.count, 0) as completed_count
    FROM 
      public.profiles p
    LEFT JOIN (
      SELECT pr.user_id, COUNT(*) as count 
      FROM public.prayer_records pr
      WHERE pr.date >= target_start_date AND pr.date <= target_end_date AND pr.status = 'Completed'
      GROUP BY pr.user_id
    ) prayer_counts ON p.id = prayer_counts.user_id
    LEFT JOIN (
      SELECT br.user_id, COUNT(*) as count 
      FROM public.bible_study_records br
      WHERE br.date >= target_start_date AND br.date <= target_end_date AND br.status = 'Completed'
      GROUP BY br.user_id
    ) study_counts ON p.id = study_counts.user_id
    WHERE p.role = 'member'
  ) aggregated;

  -- Mark the week as completed
  UPDATE public.leaderboard_weeks 
  SET status = 'completed', closed_at = now() 
  WHERE id = v_week_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Function: Transition Leaderboard Month
-- Aggregates all completed weeks for a specific month/year
CREATE OR REPLACE FUNCTION public.transition_leaderboard_month(target_month text, target_year integer)
RETURNS void AS $$
BEGIN
  -- Delete existing snapshot data for this month if running again (idempotent)
  DELETE FROM public.monthly_leaderboards WHERE month = target_month AND year = target_year;

  -- Calculate and insert the aggregated scores
  INSERT INTO public.monthly_leaderboards (month, year, user_id, completed_count, rank)
  SELECT 
    target_month,
    target_year,
    user_id,
    total_completed,
    RANK() OVER (ORDER BY total_completed DESC) as rank
  FROM (
    SELECT 
      wl.user_id,
      SUM(wl.completed_count) as total_completed
    FROM 
      public.weekly_leaderboards wl
    JOIN 
      public.leaderboard_weeks lw ON wl.week_id = lw.id
    WHERE 
      lw.month = target_month 
      AND lw.year = target_year 
      AND lw.status = 'completed'
    GROUP BY 
      wl.user_id
  ) aggregated;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
