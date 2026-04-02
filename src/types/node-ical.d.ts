declare module 'node-ical' {
  export interface VEvent {
    type: string;
    summary?: string;
    start: Date;
    end: Date;
    uid?: string;
    description?: string;
    location?: string;
    [key: string]: unknown;
  }

  export type CalData = Record<string, VEvent | undefined>;

  export function parseICS(icsData: string): CalData;
  export function parseFile(filename: string, cb: (err: Error | null, data: CalData) => void): void;
  export function async(filename: string): Promise<CalData>;
}
