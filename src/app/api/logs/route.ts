import { NextResponse } from 'next/server';
import { getRecentLogs } from '@/lib/db';

export async function GET() {
  try {
    const logs = getRecentLogs(50);
    return NextResponse.json({ logs });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
