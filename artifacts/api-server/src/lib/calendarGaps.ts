import { logger } from "./logger";

export interface CalendarEvent {
  start: Date;
  end: Date;
  summary?: string;
}

export interface Gap {
  id: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  label: string | null;
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function gapLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} hr window`;
  return `${h}.${Math.round(m / 6)} hr window`;
}

/**
 * Detects gaps ≥ 60 minutes between 17:00 and 22:00 on weekdays (Mon–Fri).
 * Events should be sorted by start time ascending before calling this.
 */
export function detectGaps(events: CalendarEvent[], weekStart: Date, weekEnd: Date): Gap[] {
  const gaps: Gap[] = [];

  for (let d = new Date(weekStart); d <= weekEnd; d = new Date(d.getTime() + 86400000)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    const windowStart = new Date(d);
    windowStart.setHours(17, 0, 0, 0);
    const windowEnd = new Date(d);
    windowEnd.setHours(22, 0, 0, 0);

    // Get events that overlap with the 5–10 PM window on this day
    const dayEvents = events
      .filter((e) => e.start < windowEnd && e.end > windowStart)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    let cursor = windowStart;

    for (const event of dayEvents) {
      const eventStart = event.start < windowStart ? windowStart : event.start;
      const eventEnd = event.end > windowEnd ? windowEnd : event.end;

      if (cursor < eventStart) {
        const diffMinutes = Math.floor((eventStart.getTime() - cursor.getTime()) / 60000);
        if (diffMinutes >= 60) {
          gaps.push({
            id: `${formatDate(d)}-${formatTime(cursor)}`,
            date: formatDate(d),
            dayOfWeek: WEEKDAY_NAMES[dayOfWeek],
            startTime: formatTime(cursor),
            endTime: formatTime(eventStart),
            durationMinutes: diffMinutes,
            label: gapLabel(diffMinutes),
          });
        }
      }

      if (eventEnd > cursor) cursor = eventEnd;
    }

    // Check gap after last event
    if (cursor < windowEnd) {
      const diffMinutes = Math.floor((windowEnd.getTime() - cursor.getTime()) / 60000);
      if (diffMinutes >= 60) {
        gaps.push({
          id: `${formatDate(d)}-${formatTime(cursor)}`,
          date: formatDate(d),
          dayOfWeek: WEEKDAY_NAMES[dayOfWeek],
          startTime: formatTime(cursor),
          endTime: formatTime(windowEnd),
          durationMinutes: diffMinutes,
          label: gapLabel(diffMinutes),
        });
      }
    }
  }

  return gaps;
}

/**
 * Returns the Monday of the current week.
 */
export function getCurrentWeekBounds(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  return { weekStart: monday, weekEnd: friday };
}

/**
 * Generates dummy calendar events for testing gap detection.
 * Simulates a typical busy professional's week.
 */
export function getDummyCalendarEvents(weekStart: Date): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  function addEvent(dayOffset: number, startHour: number, startMin: number, endHour: number, endMin: number, summary: string) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayOffset);
    const start = new Date(d);
    start.setHours(startHour, startMin, 0, 0);
    const end = new Date(d);
    end.setHours(endHour, endMin, 0, 0);
    events.push({ start, end, summary });
  }

  // Monday: busy evening 6:30–8:00 PM
  addEvent(0, 18, 30, 20, 0, "Team dinner");
  // Tuesday: nothing in the evening — full gap 5–10 PM
  // Wednesday: back-to-back 5–6:30, then free after
  addEvent(2, 17, 0, 18, 30, "Client call");
  // Thursday: meeting 7–8 PM
  addEvent(3, 19, 0, 20, 0, "Board call");
  // Friday: early event 5–6 PM
  addEvent(4, 17, 0, 18, 0, "Happy hour");

  return events;
}
