-- Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create optional_tasks table
CREATE TABLE IF NOT EXISTS public.optional_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  task_date date NOT NULL DEFAULT current_date,
  start_time time NOT NULL,
  end_time time,
  duration_minutes integer,
  status text NOT NULL DEFAULT 'Completed',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.optional_tasks ENABLE ROW LEVEL SECURITY;

-- Policies for optional_tasks
CREATE POLICY "Users can view their own optional tasks." ON public.optional_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all optional tasks." ON public.optional_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can insert their own optional tasks." ON public.optional_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own optional tasks." ON public.optional_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own optional tasks." ON public.optional_tasks FOR DELETE USING (auth.uid() = user_id);

-- Update timestamp trigger for optional_tasks
CREATE TRIGGER update_optional_tasks_updated_at
BEFORE UPDATE ON public.optional_tasks
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Storage bucket for avatars (Create if not exists using a safe approach)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update their own avatar." ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete their own avatar." ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars');
