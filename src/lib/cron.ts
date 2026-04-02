import path from 'path';
import fs from 'fs';
import { fetchBusySlots } from './bookingReader';
import { getExistingEvents, createCalendarEvent } from './graphClient';
import { insertSyncLog } from './db';

interface SyncConfig {
  bookingUrl: string;
  accessToken: string;
}

const configPath = path.join(process.cwd(), 'data', 'sync-config.json');

export function saveSyncConfig(config: SyncConfig): void {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function loadSyncConfig(): SyncConfig | null {
  try {
    if (!fs.existsSync(configPath)) return null;
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data) as SyncConfig;
  } catch {
    return null;
  }
}

export async function runSync(bookingUrl: string, accessToken: string): Promise<{
  slotsFound: number;
  slotsCreated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let slotsFound = 0;
  let slotsCreated = 0;

  try {
    const busySlots = await fetchBusySlots(bookingUrl);
    slotsFound = busySlots.length;

    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const existingEvents = await getExistingEvents(
      accessToken,
      now.toISOString(),
      twoWeeksLater.toISOString()
    );

    const existingSet = new Set(
      existingEvents.map((e) => `${e.start.dateTime}_${e.end.dateTime}`)
    );

    for (const slot of busySlots) {
      const key = `${slot.start}_${slot.end}`;
      if (!existingSet.has(key)) {
        try {
          await createCalendarEvent(accessToken, slot);
          slotsCreated++;
        } catch (err) {
          errors.push(`Failed to create event at ${slot.start}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    insertSyncLog({
      timestamp: new Date().toISOString(),
      booking_url: bookingUrl,
      slots_found: slotsFound,
      slots_created: slotsCreated,
      status: 'success',
      error_message: errors.length > 0 ? errors.join('; ') : null,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    errors.push(errorMessage);
    insertSyncLog({
      timestamp: new Date().toISOString(),
      booking_url: bookingUrl,
      slots_found: slotsFound,
      slots_created: slotsCreated,
      status: 'error',
      error_message: errorMessage,
    });
  }

  return { slotsFound, slotsCreated, errors };
}

let cronStarted = false;

export function startCronJob(): void {
  if (cronStarted) return;
  const shouldRun =
    process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true';
  if (!shouldRun) return;

  cronStarted = true;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cron = require('node-cron');
  cron.schedule('0 * * * *', async () => {
    const config = loadSyncConfig();
    if (!config) return;

    try {
      await runSync(config.bookingUrl, config.accessToken);
    } catch {
      // Silent fail - logged in runSync
    }
  });
}
