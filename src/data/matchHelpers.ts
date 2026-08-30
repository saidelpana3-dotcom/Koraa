import { Match } from '../types';

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/**
 * Returns formatted Arabic label for a given day offset (e.g., 'الأربعاء، أغسطس 19')
 */
export function getArabicDayLabel(dayOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const dayName = ARABIC_DAYS[d.getDay()];
  const monthName = ARABIC_MONTHS[d.getMonth()];
  const dayNum = d.getDate();
  return `${dayName}، ${monthName} ${dayNum}`;
}

/**
 * Returns formatted YYYY-MM-DD string for a local calendar day offset
 */
export function getLocalDayString(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates absolute Unix millisecond timestamp for match kickoff based on day offset and time HH:mm
 */
export function getKickoffTimestamp(dayOffset: number, timeStr: string): number {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
  } else {
    d.setHours(21, 0, 0, 0);
  }
  return d.getTime();
}

/**
 * Helper to generate calendar-date aligned match objects with accurate full Arabic date
 */
export function createCalendarMatch(
  base: Omit<Match, 'date' | 'dateAr' | 'time' | 'dayOffset' | 'kickoffTimeMs'>,
  dateStr: string, // e.g. '2026-08-21'
  timeStr: string, // e.g. '22:00'
  dateArOverride?: string
): Match {
  const [year, month, day] = dateStr.split('-').map(Number);
  const matchDate = new Date(year, month - 1, day);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((matchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const [hours, mins] = timeStr.split(':').map(Number);
  const kickoff = new Date(year, month - 1, day, isNaN(hours) ? 20 : hours, isNaN(mins) ? 0 : mins);

  const dayName = ARABIC_DAYS[matchDate.getDay()];
  const monthName = ARABIC_MONTHS[matchDate.getMonth()];
  const dayNum = matchDate.getDate();
  const dateAr = dateArOverride || `${dayName}، ${monthName} ${dayNum}`;

  return {
    ...base,
    date: dateStr,
    dateAr,
    time: timeStr,
    dayOffset: diffDays,
    kickoffTimeMs: kickoff.getTime(),
  };
}

/**
 * Recalculates day offsets and live timestamps for all matches relative to current today
 */
export function recalculateMatchOffsets(matches: Match[]): Match[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return matches.map((m) => {
    if (!m.date) return m;
    const [year, month, day] = m.date.split('-').map(Number);
    if (!year || !month || !day) return m;
    const matchDate = new Date(year, month - 1, day);
    const diffDays = Math.round((matchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let kickoffTimeMs = m.kickoffTimeMs;
    if (m.time && m.time !== 'انتهت') {
      const [hours, mins] = m.time.split(':').map(Number);
      kickoffTimeMs = new Date(year, month - 1, day, isNaN(hours) ? 20 : hours, isNaN(mins) ? 0 : mins).getTime();
    }

    return {
      ...m,
      dayOffset: diffDays,
      kickoffTimeMs,
    };
  });
}

/**
 * Helper to generate dynamically day-aligned match objects with accurate full Arabic date
 */
export function createDynamicMatch(
  base: Omit<Match, 'date' | 'dateAr' | 'time' | 'dayOffset' | 'kickoffTimeMs'>,
  dayOffset: number,
  timeStr: string,
  dateArOverride?: string
): Match {
  const date = getLocalDayString(dayOffset);
  const kickoffTimeMs = getKickoffTimestamp(dayOffset, timeStr);

  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const dayName = ARABIC_DAYS[d.getDay()];
  const monthName = ARABIC_MONTHS[d.getMonth()];
  const dayNum = d.getDate();
  
  // Format matches exactly: "الأربعاء، أغسطس 19" or provided override
  const dateAr = dateArOverride || `${dayName}، ${monthName} ${dayNum}`;

  return {
    ...base,
    dayOffset,
    date,
    dateAr,
    time: timeStr,
    kickoffTimeMs,
  };
}
