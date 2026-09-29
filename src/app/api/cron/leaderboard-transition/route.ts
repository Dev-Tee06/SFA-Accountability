import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { startOfWeek, endOfWeek, subWeeks, format, subMonths, startOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Basic security, can be passed as a bearer token when calling via cron
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // If testing without CRON_SECRET, you can comment this out or pass the correct token.
    // For safety, we only enforce if CRON_SECRET is set in the environment.
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = await createClient();
  const results = [];

  try {
    // 1. Transition the Previous Week
    // Calculate the start and end of the PREVIOUS week
    const now = new Date();
    const lastWeek = subWeeks(now, 1);
    const startOfLastWeek = format(startOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const endOfLastWeek = format(endOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    // Call the Postgres function to snapshot the week
    const { error: weekError } = await supabase.rpc('transition_leaderboard_week', {
      target_start_date: startOfLastWeek,
      target_end_date: endOfLastWeek
    });

    if (weekError) throw new Error(`Week transition failed: ${weekError.message}`);
    results.push(`Successfully transitioned week: ${startOfLastWeek} to ${endOfLastWeek}`);

    // 2. Transition the Previous Month (if we just crossed a month boundary)
    // We check if the previous week was in a different month than the current week.
    // Or we just run it for the previous month idempotently to ensure it's up to date.
    const lastMonth = subMonths(now, 1);
    const targetMonth = format(lastMonth, 'MMMM').trim();
    const targetYear = parseInt(format(lastMonth, 'yyyy'), 10);

    const { error: monthError } = await supabase.rpc('transition_leaderboard_month', {
      target_month: targetMonth,
      target_year: targetYear
    });

    if (monthError) throw new Error(`Month transition failed: ${monthError.message}`);
    results.push(`Successfully aggregated month: ${targetMonth} ${targetYear}`);

    // Also run for the current month just in case we are at the end of the month and want to see progress
    const currentMonthStr = format(now, 'MMMM').trim();
    const currentYearInt = parseInt(format(now, 'yyyy'), 10);
    await supabase.rpc('transition_leaderboard_month', {
      target_month: currentMonthStr,
      target_year: currentYearInt
    });
    
    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error('Leaderboard transition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
