import { NextRequest, NextResponse } from 'next/server';
import { runSync } from '@/lib/cron';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { bookingUrl?: string; accessToken?: string };
    const { bookingUrl, accessToken } = body;

    if (!bookingUrl || !accessToken) {
      return NextResponse.json(
        { error: 'bookingUrl and accessToken are required' },
        { status: 400 }
      );
    }

    const result = await runSync(bookingUrl, accessToken);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
