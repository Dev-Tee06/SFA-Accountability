-- ==========================================
-- SFA Version 2.0 Notifications Database
-- ==========================================

-- 1. Create Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  push_enabled boolean DEFAULT false,
  prayer_enabled boolean DEFAULT true,
  bible_study_enabled boolean DEFAULT true,
  accountability_enabled boolean DEFAULT true,
  streak_enabled boolean DEFAULT true,
  leaderboard_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences" 
ON public.notification_preferences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" 
ON public.notification_preferences FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" 
ON public.notification_preferences FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- 2. Create Notification Subscriptions Table (Stores Push Tokens)
CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL, -- 'web', 'android', 'ios'
  subscription_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform) -- Usually one active subscription per platform per user for simplicity
);

-- Enable RLS for subscriptions
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push subscriptions" 
ON public.notification_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own push subscriptions" 
ON public.notification_subscriptions FOR ALL 
USING (auth.uid() = user_id);


-- 3. Create Notification Logs Table (Prevents Duplicates and tracks delivery)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- 'prayer', 'bible_study', 'broadcast', etc.
  title text NOT NULL,
  message text NOT NULL,
  status text NOT NULL, -- 'sent', 'failed', 'expired', 'skipped'
  sent_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification logs" 
ON public.notification_logs FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Triggers to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_subscriptions_updated_at ON public.notification_subscriptions;
CREATE TRIGGER update_notification_subscriptions_updated_at
BEFORE UPDATE ON public.notification_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at);
