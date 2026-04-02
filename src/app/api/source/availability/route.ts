import { NextRequest, NextResponse } from 'next/server';
import { parseIcsContent } from '@/lib/bookingReader';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.endsWith('.ics') && file.type !== 'text/calendar') {
      return NextResponse.json({ error: 'Please upload a valid .ics calendar file' }, { status: 400 });
    }

    const content = await file.text();
    const slots = parseIcsContent(content);

    return NextResponse.json({ slots, count: slots.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
