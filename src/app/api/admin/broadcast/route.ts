import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendPushNotification } from '@/lib/notifications/web-push';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (user.email !== 'babayodetestimony0318@gmail.com' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, message, target, url } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Use service role for retrieving all users if RLS prevents admins from seeing all subs
    // Wait, createClient inside an API route has the admin's session, so if RLS allows admins to view all, it's fine.
    // If not, we might need a service role client. Let's use service role just in case.
    const serviceClient = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!).trim()
    );

    const { data: subs, error } = await serviceClient
      .from('notification_subscriptions')
      .select('*');

    if (error || !subs) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    let sentCount = 0;

    for (const sub of subs) {
      if (sub.platform === 'web' || sub.platform === 'ios') {
        const pushResult = await sendPushNotification(sub.subscription_data, {
          title,
          body: message,
          url: url || '/dashboard'
        });

        if (pushResult.success) {
           sentCount++;
        } else if (pushResult.expired) {
           await serviceClient.from('notification_subscriptions').delete().eq('id', sub.id);
        }
      }
      
      // Log broadcast
      await serviceClient.from('notification_logs').insert({
         user_id: sub.user_id,
         type: 'broadcast',
         title,
         message,
         status: 'sent',
         sent_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (err: any) {
    console.error('Broadcast API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
