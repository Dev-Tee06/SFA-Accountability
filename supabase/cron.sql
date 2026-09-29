-- ==========================================
-- SFA Version 2.0 Scheduled Reminders (pg_cron)
-- ==========================================

-- Ensure extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- NOTE: You MUST replace 'YOUR_PROJECT_REF' and 'YOUR_SERVICE_ROLE_KEY' with your actual Supabase project reference and service role key.
-- A safer alternative is to store the key in Supabase Vault and retrieve it dynamically, but this is the simplest configuration.

SELECT cron.schedule(
  'process-sfa-reminders',
  '* * * * *', -- Every minute
  $$
    SELECT net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-reminders',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      )
    )
  $$
);

-- To view cron job status:
-- SELECT * FROM cron.job;

-- To unschedule if needed:
-- SELECT cron.unschedule('process-sfa-reminders');
