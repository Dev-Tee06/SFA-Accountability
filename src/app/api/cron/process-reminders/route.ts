import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/lib/notifications/web-push';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: Request) {
  // 1. Authenticate the Cron request
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Need a service role client to query across all users
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Query all schedules
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*');

    if (scheduleError || !schedules) {
      console.error('Failed to fetch schedules', scheduleError);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    // 3. Process Reminders
    const now = new Date();
    
    // We will batch notifications to avoid timeouts
    let sentCount = 0;

    for (const schedule of schedules) {
      // Check notification preferences
      const { data: pref } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', schedule.user_id)
        .maybeSingle();

      if (!pref || !pref.push_enabled) continue;

      // Determine local time string "HH:mm" for user timezone. Assuming 'Africa/Lagos' default for now.
      // SFA users are predominantly in Nigeria, but we can respect schedule timezone if it existed.
      // Since schedule table doesn't have a timezone column currently, we default to Africa/Lagos.
      const timeZone = 'Africa/Lagos';
      
      const localTimeString = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now); // e.g. "07:05"

      const checks = [
        { 
          type: 'prayer', 
          time: schedule.prayer_time, // "HH:MM"
          enabled: pref.prayer_enabled,
          title: 'Prayer Time',
          message: 'It is time for your scheduled prayer. Take a moment to pray and stay accountable.'
        },
        { 
          type: 'bible_study', 
          time: schedule.bible_study_time, // "HH:MM"
          enabled: pref.bible_study_enabled,
          title: 'Bible Study Time',
          message: 'Your scheduled Bible study time has arrived.'
        }
      ];

      for (const check of checks) {
        if (!check.enabled || !check.time) continue;

        // Ensure time format matches "HH:MM". Usually HTML time input is "HH:mm"
        const cleanTime = check.time.substring(0, 5); // "07:00"

        // Allow a 5-minute window for the cron job (e.g., cron hits at 07:01, schedule is 07:00)
        // Convert to minutes from midnight
        const [localH, localM] = localTimeString.split(':').map(Number);
        const [schedH, schedM] = cleanTime.split(':').map(Number);
        
        const localMinutes = localH * 60 + localM;
        const schedMinutes = schedH * 60 + schedM;
        
        const diff = localMinutes - schedMinutes;
        
        // If current time is exactly the schedule time, or within 5 mins after
        if (diff >= 0 && diff < 5) {
          
          // Check if we already sent this today
          const todayString = new Intl.DateTimeFormat('en-CA', { timeZone }).format(now); // YYYY-MM-DD
          const startOfDay = new Date(`${todayString}T00:00:00Z`).toISOString();

          const { data: existingLog } = await supabase
            .from('notification_logs')
            .select('id')
            .eq('user_id', schedule.user_id)
            .eq('type', check.type)
            .gte('created_at', startOfDay) // Sent today
            .maybeSingle();

          if (existingLog) continue; // Already sent today

          // Get subscription
          const { data: subs } = await supabase
            .from('notification_subscriptions')
            .select('*')
            .eq('user_id', schedule.user_id);

          if (!subs || subs.length === 0) continue;

          let success = false;
          let errorMessage = null;

          for (const sub of subs) {
             if (sub.platform === 'web' || sub.platform === 'ios') {
                const pushResult = await sendPushNotification(sub.subscription_data, {
                  title: check.title,
                  body: check.message,
                  url: '/dashboard'
                });

                if (pushResult.success) {
                   success = true;
                } else if (pushResult.expired) {
                   // Delete expired subscription
                   await supabase.from('notification_subscriptions').delete().eq('id', sub.id);
                } else {
                   errorMessage = pushResult.error?.message || 'Unknown push error';
                }
             }
             // Android Capacitor push would go here if using a third-party service like FCM or OneSignal
             // Capacitor Local Notifications are handled purely on the device, not the server.
          }

          // Record log to prevent duplicates tomorrow
          await supabase.from('notification_logs').insert({
             user_id: schedule.user_id,
             type: check.type,
             title: check.title,
             message: check.message,
             status: success ? 'sent' : 'failed',
             error: errorMessage,
             sent_at: success ? new Date().toISOString() : null
          });

          if (success) sentCount++;
        }
      }
    }

    return NextResponse.json({ success: true, processed: schedules.length, sent: sentCount });

  } catch (error: any) {
    console.error('Cron Processor Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
