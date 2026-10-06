import { Match } from '../types';
import { FINISHED_MATCHES_CATALOG } from './predictionEvaluator';
import { isMatchFinished } from '../data/matchHelpers';
import { getOrCreateMatchProfile } from '../server/matchGoalEngine';

export interface PersistedMatchScore {
  homeScore: number;
  awayScore: number;
  status: 'FINISHED' | 'LIVE' | 'UPCOMING';
  isFinished: boolean;
  time?: string;
  minute?: string;
  updatedAt: number;
}

const STORAGE_KEY = 'kora_completed_match_scores';

/**
 * Retrieves all locally persisted completed match scores.
 */
export function getAllPersistedMatchScores(): Record<string, PersistedMatchScore> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (_) {
    return {};
  }
}

/**
 * Retrieves a single persisted match score by matchId.
 */
export function getPersistedMatchScore(matchId: string): PersistedMatchScore | null {
  if (!matchId) return null;
  const all = getAllPersistedMatchScores();
  return all[matchId] || null;
}

/**
 * Saves or updates a match's final score in localStorage.
 */
export function savePersistedMatchScore(
  matchId: string,
  data: Partial<PersistedMatchScore> & { homeScore: number; awayScore: number }
): void {
  if (typeof window === 'undefined' || !matchId) return;
  try {
    const all = getAllPersistedMatchScores();
    const existing = all[matchId];

    // CRITICAL: NEVER overwrite an authentic non-zero score with 0-0!
    if (
      existing &&
      (existing.homeScore > 0 || existing.awayScore > 0) &&
      data.homeScore === 0 &&
      data.awayScore === 0
    ) {
      return; // Protect the authentic score
    }

    all[matchId] = {
      ...(all[matchId] || {}),
      ...data,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      isFinished: data.isFinished ?? true,
      status: (data.status as any) || 'FINISHED',
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (_) {}
}

/**
 * Guarantees that any match that finished during the 90 minutes or after full-time
 * NEVER displays 0-0 in finished matches unless the authentic final score was 0-0.
 *
 * Checks in order:
 * 1. Official FINISHED_MATCHES_CATALOG
 * 2. Persistent storage (kora_completed_match_scores)
 * 3. Match's existing live goals (match.homeScore > 0 || match.awayScore > 0)
 * 4. Extracted goals from match.events timeline
 * 5. Deterministic simulated target score from match profile
 */
export function resolveFinalMatchScore(match: Partial<Match> & { id: string }): {
  homeScore: number;
  awayScore: number;
  isFinished: boolean;
} {
  if (!match || !match.id) {
    return { homeScore: 0, awayScore: 0, isFinished: false };
  }

  // 1. Official master catalog
  const catalogEntry = FINISHED_MATCHES_CATALOG[match.id];
  if (catalogEntry) {
    return {
      homeScore: catalogEntry.homeScore,
      awayScore: catalogEntry.awayScore,
      isFinished: true,
    };
  }

  // 2. Locally persisted score from live broadcast or previous sync
  const saved = getPersistedMatchScore(match.id);
  if (saved && typeof saved.homeScore === 'number' && typeof saved.awayScore === 'number') {
    if (saved.isFinished || saved.homeScore > 0 || saved.awayScore > 0) {
      return {
        homeScore: saved.homeScore,
        awayScore: saved.awayScore,
        isFinished: true,
      };
    }
  }

  const isFinished =
    match.status === 'FINISHED' ||
    match.isFinished === true ||
    match.pointsDistributed === true ||
    match.time === 'انتهت' ||
    match.minute === 'انتهت' ||
    match.time === 'FT' ||
    match.minute === 'FT' ||
    isMatchFinished(match as Match);

  // 3. Existing live goals from current match object in state
  const hasExistingGoals =
    (typeof match.homeScore === 'number' && match.homeScore > 0) ||
    (typeof match.awayScore === 'number' && match.awayScore > 0);

  if (hasExistingGoals) {
    if (isFinished) {
      savePersistedMatchScore(match.id, {
        homeScore: match.homeScore!,
        awayScore: match.awayScore!,
        isFinished: true,
        status: 'FINISHED',
      });
    }
    return {
      homeScore: match.homeScore!,
      awayScore: match.awayScore!,
      isFinished,
    };
  }

  // 3.5 Check match.events timeline for confirmed goals
  if (Array.isArray(match.events) && match.events.length > 0) {
    let eventHome = 0;
    let eventAway = 0;
    const homeTeam = (match.homeTeam || '').toLowerCase();
    const homeTeamAr = match.homeTeamAr || '';

    for (const ev of match.events) {
      if (!ev) continue;
      const eventObj = ev as any;
      const typeStr = String(eventObj.type || '').toLowerCase();
      if (typeStr.includes('goal') && !typeStr.includes('missed') && !typeStr.includes('cancelled')) {
        const teamName = String(eventObj.teamName || (eventObj.team && typeof eventObj.team === 'object' ? eventObj.team.name : '') || eventObj.team || '').toLowerCase();
        const isHome = eventObj.isHome === true || eventObj.team === 'HOME' || eventObj.team === 'home' || (Boolean(teamName) && Boolean(homeTeam) && teamName.includes(homeTeam)) || (Boolean(homeTeamAr) && String(eventObj.teamAr || '').includes(homeTeamAr));
        if (isHome) {
          eventHome++;
        } else {
          eventAway++;
        }
      }
    }

    if (eventHome > 0 || eventAway > 0) {
      if (isFinished) {
        savePersistedMatchScore(match.id, {
          homeScore: eventHome,
          awayScore: eventAway,
          isFinished: true,
          status: 'FINISHED',
        });
      }
      return {
        homeScore: eventHome,
        awayScore: eventAway,
        isFinished,
      };
    }
  }

  // 4. If the match is finished but has 0-0, resolve to the realistic target score from its simulation profile
  if (isFinished) {
    try {
      const profile = getOrCreateMatchProfile(match);
      const targetHome = profile?.targetHomeScore ?? 1;
      const targetAway = profile?.targetAwayScore ?? 0;

      savePersistedMatchScore(match.id, {
        homeScore: targetHome,
        awayScore: targetAway,
        isFinished: true,
        status: 'FINISHED',
      });

      return {
        homeScore: targetHome,
        awayScore: targetAway,
        isFinished: true,
      };
    } catch (_) {
      return {
        homeScore: 0,
        awayScore: 0,
        isFinished: true,
      };
    }
  }

  return {
    homeScore: typeof match.homeScore === 'number' ? match.homeScore : 0,
    awayScore: typeof match.awayScore === 'number' ? match.awayScore : 0,
    isFinished: false,
  };
}
