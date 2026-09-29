import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subscription, platform } = body;

    if (!subscription || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert subscription (using unique constraint on user_id + platform)
    const { error: dbError } = await supabase
      .from('notification_subscriptions')
      .upsert({
        user_id: user.id,
        platform: platform,
        subscription_data: subscription,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, platform' });

    if (dbError) {
      console.error('Error saving subscription:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Subscription API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
