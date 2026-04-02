import { NextRequest, NextResponse } from 'next/server';
import { fetchBusySlots } from '@/lib/bookingReader';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookingUrl = searchParams.get('bookingUrl');

  if (!bookingUrl) {
    return NextResponse.json({ error: 'bookingUrl query parameter is required' }, { status: 400 });
  }

  try {
    const slots = await fetchBusySlots(bookingUrl);
    return NextResponse.json({ slots, count: slots.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
