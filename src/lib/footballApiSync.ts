import { Match, Language, MatchStatus } from '../types';
import { playNotificationChime, sendMatchLiveNotification } from './notifications';

export interface FootballApiLiveMatchResult {
  id: string;
  fixtureId?: number;
  homeScore: number;
  awayScore: number;
  status: 'LIVE' | 'FINISHED' | 'UPCOMING' | 'HALF_TIME' | string;
  minute?: string;
  isFinished?: boolean;
  goalDetected?: boolean;
  scoringTeam?: 'HOME' | 'AWAY' | null;
  matchNote?: string;
  source?: string;
  events?: any[];
  stats?: any;
}

export interface FootballApiSyncResponse {
  success: boolean;
  syncedMatches: FootballApiLiveMatchResult[];
  matchedCount?: number;
  source: string;
  timestamp?: string;
}

/**
 * Fetch real-time live matches from API-Football via our secure backend proxy
 */
export async function fetchApiFootballLiveMatches(
  matches: Match[],
  language: Language
): Promise<FootballApiSyncResponse> {
  try {
    const lightweightMatches = matches.map((m) => ({
      id: m.id,
      homeTeam: m.homeTeam,
      homeTeamAr: m.homeTeamAr,
      awayTeam: m.awayTeam,
      awayTeamAr: m.awayTeamAr,
      leagueName: m.leagueName,
      leagueNameAr: m.leagueNameAr,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      date: m.date,
      time: m.time,
      kickoffTimeMs: m.kickoffTimeMs,
    }));

    const response = await fetch('/api/football/sync-live', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matches: lightweightMatches, language }),
    });

    if (!response.ok) {
      throw new Error(`API-Football Sync HTTP Error ${response.status}`);
    }

    const data: FootballApiSyncResponse = await response.json();
    return data;
  } catch (err) {
    console.warn('API-Football client sync fetch notice:', err);
    return {
      success: false,
      syncedMatches: [],
      source: 'fallback',
    };
  }
}

/**
 * Fetch detailed live match statistics, lineups, and events from API-Football
 */
export async function fetchApiFootballMatchDetails(
  match: Match,
  language: Language
): Promise<any> {
  try {
    const response = await fetch('/api/football/match-live-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        matchId: match.id,
        homeTeam: match.homeTeam,
        homeTeamAr: match.homeTeamAr,
        awayTeam: match.awayTeam,
        awayTeamAr: match.awayTeamAr,
        leagueName: match.leagueName,
        kickoffTimeMs: match.kickoffTimeMs,
        status: match.status,
        minute: match.minute,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        date: match.date,
        time: match.time,
        language,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success) {
      return data;
    }
    return null;
  } catch (err) {
    console.warn('API-Football match details fetch notice:', err);
    return null;
  }
}

/**
 * Process synced matches from API-Football, trigger goal/end alarms, and return updated match objects
 */
export function processApiFootballSyncedMatches(
  currentMatches: Match[],
  syncedResults: FootballApiLiveMatchResult[],
  language: Language
): Match[] {
  const isAr = language === 'ar';
  const resultMap = new Map<string, FootballApiLiveMatchResult>();
  syncedResults.forEach((r) => resultMap.set(r.id, r));

  return currentMatches.map((match) => {
    const synced = resultMap.get(match.id);
    if (!synced) return match;

    const homeTeamName = isAr ? match.homeTeamAr || match.homeTeam : match.homeTeam;
    const awayTeamName = isAr ? match.awayTeamAr || match.awayTeam : match.awayTeam;

    const updatedHomeScore = typeof synced.homeScore === 'number' ? synced.homeScore : match.homeScore;
    const updatedAwayScore = typeof synced.awayScore === 'number' ? synced.awayScore : match.awayScore;

    let updatedStatus: MatchStatus = match.status;
    if (synced.status === 'LIVE') updatedStatus = 'LIVE';
    else if (synced.status === 'FINISHED' || synced.isFinished) updatedStatus = 'FINISHED';
    else if (synced.status === 'UPCOMING') updatedStatus = 'UPCOMING';
    else if (synced.status === 'HALF_TIME' || synced.status === 'HALFTIME') updatedStatus = 'HALF_TIME';

    const homeGoalScored = updatedHomeScore > match.homeScore;
    const awayGoalScored = updatedAwayScore > match.awayScore;

    // Detect Goal Event and dispatch sounds + push notifications
    if (homeGoalScored || awayGoalScored || synced.goalDetected) {
      const scoringTeamName = homeGoalScored
        ? homeTeamName
        : awayGoalScored
        ? awayTeamName
        : synced.scoringTeam === 'HOME'
        ? homeTeamName
        : awayTeamName;

      playNotificationChime('GOAL');
      sendMatchLiveNotification({
        matchId: match.id,
        title: '⚽ GOAL! GOAL! GOAL!',
        titleAr: `⚽ هـــدف! ${scoringTeamName}`,
        body: `Goal for ${scoringTeamName}! ${homeTeamName} ${updatedHomeScore} - ${updatedAwayScore} ${awayTeamName} (${synced.minute || 'LIVE'})`,
        bodyAr: `تم تسجيل هدف في مباراة ${homeTeamName} ضد ${awayTeamName}! النتيجة الآن (${updatedHomeScore} - ${updatedAwayScore})`,
        type: 'GOAL',
      });
    }

    // Detect Match Finished Event
    const justFinished = (match.status === 'LIVE' || match.status === 'UPCOMING' || match.status === 'HALF_TIME') && (updatedStatus === 'FINISHED' || synced.isFinished);
    if (justFinished) {
      playNotificationChime('MATCH_START');
      sendMatchLiveNotification({
        matchId: match.id,
        title: '🏁 FULL TIME!',
        titleAr: `🏁 انتهاء المباراة!`,
        body: `Match ended: ${homeTeamName} ${updatedHomeScore} - ${updatedAwayScore} ${awayTeamName}`,
        bodyAr: `انتهت المباراة بنتيجة: ${homeTeamName} (${updatedHomeScore} - ${updatedAwayScore}) ${awayTeamName}`,
        type: 'FULL_TIME',
      });
    }

    return {
      ...match,
      homeScore: updatedHomeScore,
      awayScore: updatedAwayScore,
      status: updatedStatus,
      time: (updatedStatus === 'FINISHED' || synced.isFinished) ? (isAr ? 'انتهت' : 'FT') : match.time,
      minute: synced.minute || (updatedStatus === 'FINISHED' ? (isAr ? 'انتهت' : 'FT') : match.minute),
      isFinished: updatedStatus === 'FINISHED' || synced.isFinished,
      events: (Array.isArray(synced.events) && synced.events.length > 0) ? synced.events : match.events,
      stats: synced.stats || match.stats,
      isGoogleSynced: true,
      lastSyncedAt: new Date().toISOString(),
    };
  });
}
