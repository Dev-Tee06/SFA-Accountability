import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

// Initialize web-push with VAPID keys from environment variables
// The user must set these via `supabase secrets set`
const vapidPublicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY') || Deno.env.get('VAPID_PUBLIC_KEY')
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
const vapidSubject = Deno.env.get('VAPID_SUBJECT')

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  )
} else {
  console.warn('VAPID keys are not fully configured. Push notifications may fail.')
}

Deno.serve(async (req) => {
  // Edge functions are invoked by pg_net from our cron job.
  // We can securely verify the request by checking the authorization header.
  // Supabase provides SUPABASE_URL and SUPABASE_ANON_KEY natively.
  // The cron job will pass the service_role key as a Bearer token.
  
  const authHeader = req.headers.get('Authorization')
  
  // Basic sanity check to ensure it's not a public random invocation
  // (pg_net will send the service_role key we configure in cron.sql)
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Create a Supabase client with the provided Auth header (which gives it service_role privileges)
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: {
      headers: { Authorization: authHeader },
    },
  })

  try {
    console.log('Fetching schedules...')
    // 1. Query all schedules
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')

    if (scheduleError || !schedules) {
      console.error('Failed to fetch schedules', scheduleError)
      return new Response(JSON.stringify({ error: 'Failed to fetch schedules' }), { status: 500 })
    }

    // 2. Process Reminders
    const now = new Date()
    let sentCount = 0

    for (const schedule of schedules) {
      // Check notification preferences
      const { data: pref } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', schedule.user_id)
        .maybeSingle()

      if (!pref || !pref.push_enabled) continue

      // Timezone: Default to Africa/Lagos unless the user has a custom timezone in their schedule
      const timeZone = schedule.timezone && schedule.timezone !== 'UTC' ? schedule.timezone : 'Africa/Lagos'
      
      const localTimeString = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now) // e.g. "07:05"

      const checks = [
        { 
          type: 'prayer', 
          time: schedule.prayer_time, // "HH:MM:SS" from DB
          enabled: pref.prayer_enabled,
          title: 'Prayer Time',
          message: 'It is time for your scheduled prayer. Take a moment to pray and stay accountable.'
        },
        { 
          type: 'bible_study', 
          time: schedule.bible_study_time,
          enabled: pref.bible_study_enabled,
          title: 'Bible Study Time',
          message: 'Your scheduled Bible study time has arrived.'
        }
      ]

      for (const check of checks) {
        if (!check.enabled || !check.time) continue

        // Ensure time format matches "HH:MM". DB times are often "06:00:00"
        const cleanTime = check.time.substring(0, 5) // "06:00"

        // Allow a 5-minute window for the cron job
        const [localH, localM] = localTimeString.split(':').map(Number)
        const [schedH, schedM] = cleanTime.split(':').map(Number)
        
        const localMinutes = localH * 60 + localM
        const schedMinutes = schedH * 60 + schedM
        
        const diff = localMinutes - schedMinutes
        
        // If current time is exactly the schedule time, or within 5 mins after
        if (diff >= 0 && diff < 5) {
          
          // Check if we already sent this today using the user's timezone date
          const todayString = new Intl.DateTimeFormat('en-CA', { timeZone }).format(now) // YYYY-MM-DD
          const startOfDay = new Date(`${todayString}T00:00:00Z`).toISOString()

          const { data: existingLog } = await supabase
            .from('notification_logs')
            .select('id')
            .eq('user_id', schedule.user_id)
            .eq('type', check.type)
            .gte('created_at', startOfDay) // Sent today
            .maybeSingle()

          if (existingLog) continue // Already sent today

          // Get subscription
          const { data: subs } = await supabase
            .from('notification_subscriptions')
            .select('*')
            .eq('user_id', schedule.user_id)

          if (!subs || subs.length === 0) continue

          let success = false
          let errorMessage = null

          for (const sub of subs) {
             if (sub.platform === 'web' || sub.platform === 'ios' || sub.platform === 'android') {
                try {
                  await webpush.sendNotification(
                    sub.subscription_data,
                    JSON.stringify({
                      title: check.title,
                      body: check.message,
                      url: '/dashboard'
                    })
                  )
                  success = true
                } catch (pushError: any) {
                  if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                    // Subscription has expired or is no longer valid
                    await supabase.from('notification_subscriptions').delete().eq('id', sub.id)
                  } else {
                    errorMessage = pushError.message || 'Unknown push error'
                  }
                }
             }
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
          })

          if (success) sentCount++
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: schedules.length, sent: sentCount }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
