import { NextRequest, NextResponse } from 'next/server';
import { BusySlot } from '@/lib/bookingReader';
import { getExistingEvents, createCalendarEvent } from '@/lib/graphClient';
import { insertSyncLog } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { slots?: BusySlot[]; accessToken?: string };
    const { slots, accessToken } = body;

    if (!slots?.length || !accessToken) {
      return NextResponse.json(
        { error: 'slots (array) and accessToken are required' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    let slotsCreated = 0;

    // Get existing events to avoid duplicates
    const earliest = slots.reduce((min, s) => s.start < min ? s.start : min, slots[0].start);
    const latest   = slots.reduce((max, s) => s.end   > max ? s.end   : max, slots[0].end);
    const existingEvents = await getExistingEvents(accessToken, earliest, latest);
    const existingSet = new Set(existingEvents.map((e) => `${e.start.dateTime}_${e.end.dateTime}`));

    for (const slot of slots) {
      const key = `${slot.start}_${slot.end}`;
      if (!existingSet.has(key)) {
        try {
          await createCalendarEvent(accessToken, slot);
          slotsCreated++;
        } catch (err) {
          errors.push(`Failed at ${slot.start}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    insertSyncLog({
      timestamp: new Date().toISOString(),
      booking_url: 'ICS Upload',
      slots_found: slots.length,
      slots_created: slotsCreated,
      status: errors.length === slots.length && slots.length > 0 ? 'error' : 'success',
      error_message: errors.length > 0 ? errors.slice(0, 3).join('; ') : null,
    });

    return NextResponse.json({ slotsFound: slots.length, slotsCreated, errors });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
