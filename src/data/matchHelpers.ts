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
  const h = isNaN(hours) ? 20 : hours;
  const m = isNaN(mins) ? 0 : mins;
  const pad = (n: number) => String(n).padStart(2, '0');
  // Match kickoff is specified in Cairo / Egypt Time (UTC+3 summer broadcast time)
  const kickoff = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(h)}:${pad(m)}:00+03:00`);

  const dayName = ARABIC_DAYS[matchDate.getDay()];
  const monthName = ARABIC_MONTHS[matchDate.getMonth()];
  const dayNum = matchDate.getDate();
  const dateAr = dateArOverride || `${dayName}، ${monthName} ${dayNum}`;

  const isFinished = 
    base.status === 'FINISHED' || 
    base.isFinished === true || 
    base.pointsDistributed === true || 
    timeStr === 'انتهت' || 
    timeStr === 'FT' || 
    base.minute === 'انتهت' || 
    base.minute === 'FT';

  return {
    ...base,
    date: dateStr,
    dateAr,
    time: isFinished ? 'انتهت' : timeStr,
    minute: isFinished ? (base.minute || 'انتهت') : base.minute,
    status: isFinished ? 'FINISHED' : (base.status || 'UPCOMING'),
    isFinished: isFinished,
    dayOffset: diffDays,
    kickoffTimeMs: isNaN(kickoff.getTime()) ? undefined : kickoff.getTime(),
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
    // Only compute if not already set, and strictly parse using Cairo / Egypt Time (+03:00)
    if (!kickoffTimeMs && m.time && m.time !== 'انتهت' && m.time !== 'FT') {
      const [hours, mins] = m.time.split(':').map(Number);
      const h = isNaN(hours) ? 20 : hours;
      const min = isNaN(mins) ? 0 : mins;
      const pad = (n: number) => String(n).padStart(2, '0');
      const kickoff = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(h)}:${pad(min)}:00+03:00`);
      kickoffTimeMs = isNaN(kickoff.getTime()) ? undefined : kickoff.getTime();
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

/**
 * Constant for match broadcast sync lag:
 * Set to 0 for exact real-time live synchronization (الوقت الفعلي) as requested by user.
 */
export const MATCH_BROADCAST_DELAY_MINUTES = 0;

/**
 * Determines whether a match has ended/finished
 */
export function isMatchFinished(match: Match): boolean {
  if (
    match.status === 'FINISHED' ||
    match.pointsDistributed === true ||
    match.isFinished === true ||
    match.minute === 'انتهت' ||
    match.minute === 'FT' ||
    match.time === 'انتهت' ||
    match.time === 'FT'
  ) {
    return true;
  }

  // Check if kickoff time + 132 mins elapsed
  let kickoffMs = match.kickoffTimeMs;
  if (!kickoffMs && match.date && match.time) {
    try {
      const [year, month, day] = match.date.split('-').map(Number);
      const [h, m] = match.time.replace(/[^0-9:]/g, '').split(':').map(Number);
      if (year && month && day && !isNaN(h)) {
        const pad = (n: number) => String(n).padStart(2, '0');
        const dt = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(h)}:${pad(m || 0)}:00+03:00`);
        if (!isNaN(dt.getTime())) kickoffMs = dt.getTime();
      }
    } catch (_) {}
  }

  if (kickoffMs) {
    const diffMinutes = Math.floor((Date.now() - kickoffMs) / 60000);
    if (diffMinutes >= 132) {
      return true;
    }
  }

  return false;
}

/**
 * Determines whether a match is currently live based on explicit status or real-time kickoff timestamp.
 * Switches to LIVE immediately at kickoff time (e.g. 8:00 sharp).
 */
export function isMatchLive(match: Match): boolean {
  if (isMatchFinished(match)) return false;
  if (match.status === 'LIVE' || match.status === 'HALF_TIME') return true;

  // Resolve kickoff ms either directly or from date & time
  let kickoffMs = match.kickoffTimeMs;
  if (!kickoffMs && match.date && match.time) {
    try {
      const [year, month, day] = match.date.split('-').map(Number);
      const [h, m] = match.time.replace(/[^0-9:]/g, '').split(':').map(Number);
      if (year && month && day && !isNaN(h)) {
        const pad = (n: number) => String(n).padStart(2, '0');
        const dt = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(h)}:${pad(m || 0)}:00+03:00`);
        if (!isNaN(dt.getTime())) kickoffMs = dt.getTime();
      }
    } catch (_) {}
  }

  // If explicitly UPCOMING, transition to LIVE as soon as kickoff time is reached
  if (kickoffMs) {
    const diffMinutes = Math.floor((Date.now() - kickoffMs) / 60000);
    if (diffMinutes >= 0 && diffMinutes < 132) {
      return true;
    }
  }
  return false;
}

/**
 * Calculates current played elapsed minute string for live match display in actual real-time (الوقت الفعلي).
 * Calibrated accurately to television broadcast time with pre-match entry and realistic halftime break.
 */
export function getMatchPlayedMinute(match: Match, isAr: boolean = true): string {
  if (match.status === 'FINISHED' || match.pointsDistributed === true) {
    return isAr ? 'انتهت' : 'FT';
  }
  if (match.status === 'HALF_TIME') {
    return isAr ? 'بين الشوطين (HT)' : 'HT';
  }

  // 1. If match already has an explicit live minute string (from API-Football real-time sync)
  if (match.minute && match.minute !== 'انتهت' && match.minute !== 'FT' && match.minute !== match.time && String(match.minute).trim() !== '') {
    const minStr = String(match.minute).trim();
    if (minStr.includes("'") || minStr.includes('بين') || minStr.includes('HT') || minStr.includes('+')) {
      return minStr;
    }
    const num = parseInt(minStr, 10);
    if (!isNaN(num) && num > 0) {
      return `${num}'`;
    }
  }

  // 2. Real-Time Actual Football Match Timing:
  // - 0 to 4 min: Kickoff moment -> 1'
  // - 5 to 50 min: First Half (1' to 45')
  // - 51 to 55 min: First Half stoppage time (45+1' .. 45+5')
  // - 56 to 72 min: Half-Time break (HT) (16-18 mins)
  // - 73 to 122 min: Second Half (46' to 90')
  // - 123 to 132 min: Second Half stoppage (90+1' .. 90+9')
  // - >132 min: Full Time (FT)
  let kickoffMs = match.kickoffTimeMs;
  if (!kickoffMs && match.date && match.time) {
    try {
      const [year, month, day] = match.date.split('-').map(Number);
      const [h, m] = match.time.replace(/[^0-9:]/g, '').split(':').map(Number);
      if (year && month && day && !isNaN(h)) {
        const pad = (n: number) => String(n).padStart(2, '0');
        const dt = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(h)}:${pad(m || 0)}:00+03:00`);
        if (!isNaN(dt.getTime())) kickoffMs = dt.getTime();
      }
    } catch (_) {}
  }

  if (kickoffMs) {
    const rawElapsed = Math.floor((Date.now() - kickoffMs) / 60000);
    if (rawElapsed < 0) {
      return match.time || (isAr ? 'تبدأ قريباً' : 'Starting Soon');
    } else if (rawElapsed <= 4) {
      return "1'";
    } else if (rawElapsed <= 50) {
      const firstHalfMin = Math.min(45, Math.max(1, rawElapsed - 3));
      return `${firstHalfMin}'`;
    } else if (rawElapsed <= 55) {
      return `45+${Math.max(1, rawElapsed - 50)}'`;
    } else if (rawElapsed <= 72) {
      return isAr ? 'بين الشوطين (HT)' : 'HT';
    } else if (rawElapsed <= 122) {
      const secondHalfMin = Math.min(90, 46 + Math.floor((rawElapsed - 72) * (44 / 50)));
      return `${secondHalfMin}'`;
    } else if (rawElapsed <= 132) {
      return `90+${Math.min(9, Math.max(1, rawElapsed - 122))}'`;
    } else {
      return isAr ? 'انتهت' : 'FT';
    }
  }

  if (match.status === 'UPCOMING') {
    return match.time || (isAr ? 'تبدأ قريباً' : 'Starting Soon');
  }

  return isAr ? "1'" : "1'";
}

/**
 * Determines whether any match today is currently in-progress, live, or has started,
 * or is within 60 minutes of kickoff (when official club lineups are published).
 * Ensures live fetching begins with the first match of the day!
 */
export function hasLiveOrStartedMatchesToday(matches: Match[]): boolean {
  const todayStr = getLocalDayString(0);
  const now = Date.now();
  return matches.some((m) => {
    const isToday = m.date === todayStr || m.dayOffset === 0;
    if (!isToday && m.status !== 'LIVE' && m.status !== 'HALF_TIME') return false;

    // 1. In-progress or live
    if (isMatchLive(m)) return true;

    // 2. Upcoming match within 60 minutes of kickoff (official lineups published)
    let kickoffMs = m.kickoffTimeMs;
    if (!kickoffMs && m.date && m.time) {
      try {
        const [year, month, day] = m.date.split('-').map(Number);
        const [h, min] = m.time.replace(/[^0-9:]/g, '').split(':').map(Number);
        if (year && month && day && !isNaN(h)) {
          const pad = (n: number) => String(n).padStart(2, '0');
          const dt = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(h)}:${pad(min || 0)}:00+03:00`);
          if (!isNaN(dt.getTime())) kickoffMs = dt.getTime();
        }
      } catch (_) {}
    }

    if (kickoffMs) {
      const diffMs = kickoffMs - now;
      // Kickoff has reached/passed and match is not finished yet
      if (diffMs <= 0 && diffMs > -135 * 60 * 1000 && m.status !== 'FINISHED' && !m.pointsDistributed) {
        return true;
      }
      // Within 60 minutes before kickoff (lineup release window)
      if (diffMs > 0 && diffMs <= 60 * 60 * 1000) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Returns the earliest kickoff timestamp (epoch ms) among today's upcoming matches.
 */
export function getEarliestKickoffMsToday(matches: Match[]): number | null {
  const todayStr = getLocalDayString(0);
  const todayUpcoming = matches.filter((m) => {
    const isToday = m.date === todayStr || m.dayOffset === 0;
    return isToday && m.status !== 'FINISHED' && !m.pointsDistributed && !!m.kickoffTimeMs;
  });
  if (todayUpcoming.length === 0) return null;
  return Math.min(...todayUpcoming.map((m) => m.kickoffTimeMs!));
}
