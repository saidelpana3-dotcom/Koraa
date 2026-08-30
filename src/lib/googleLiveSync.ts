import { Match, Language, MatchStatus } from '../types';
import { playNotificationChime, sendMatchLiveNotification } from './notifications';
import { generateFinishedMatchStats } from './matchStatsGenerator';

export interface SyncedMatchResult {
  id: string;
  homeScore: number;
  awayScore: number;
  status: 'LIVE' | 'FINISHED' | 'UPCOMING' | 'HALF_TIME' | string;
  minute?: string;
  isFinished?: boolean;
  goalDetected?: boolean;
  scoringTeam?: 'HOME' | 'AWAY' | null;
  scorerName?: string | null;
  matchNote?: string;
}

export interface GoogleSyncResponse {
  syncedMatches: SyncedMatchResult[];
  source: string;
  timestamp?: string;
}

// Function to call Express server endpoint which uses Gemini + Google Search Grounding to fetch live Google scores
export async function fetchGoogleLiveScores(matches: Match[], language: Language): Promise<GoogleSyncResponse> {
  try {
    // Only send the minimal fields needed for Gemini & search grounding to keep payload ultra lightweight
    const lightweightMatches = matches.map(m => ({
      id: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      leagueName: m.leagueName,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      date: m.date,
      time: m.time,
    }));

    const response = await fetch('/api/matches/google-live-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matches: lightweightMatches, language }),
    });

    if (!response.ok) {
      throw new Error(`Google Live Sync HTTP error ${response.status}`);
    }

    const data: GoogleSyncResponse = await response.json();
    return data;
  } catch (err) {
    console.warn('Google Live Sync fetch failed, falling back to local state:', err);
    return {
      syncedMatches: matches.map(m => ({
        id: m.id,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: m.status,
      })),
      source: 'local_fallback',
    };
  }
}

// Process synced matches, detect goals or match finish, trigger FCM alerts, and return updated match list
export function processSyncedMatches(
  currentMatches: Match[],
  syncedResults: SyncedMatchResult[],
  language: Language
): Match[] {
  const isAr = language === 'ar';
  const resultMap = new Map<string, SyncedMatchResult>();
  syncedResults.forEach(r => resultMap.set(r.id, r));

  return currentMatches.map((match) => {
    const synced = resultMap.get(match.id);
    if (!synced) return match;

    const homeTeamName = isAr ? match.homeTeamAr || match.homeTeam : match.homeTeam;
    const awayTeamName = isAr ? match.awayTeamAr || match.awayTeam : match.awayTeam;

    let updatedHomeScore = typeof synced.homeScore === 'number' ? synced.homeScore : match.homeScore;
    let updatedAwayScore = typeof synced.awayScore === 'number' ? synced.awayScore : match.awayScore;
    
    let updatedStatus: MatchStatus = match.status;
    if (synced.status === 'LIVE') updatedStatus = 'LIVE';
    else if (synced.status === 'FINISHED' || synced.isFinished) updatedStatus = 'FINISHED';
    else if (synced.status === 'UPCOMING') updatedStatus = 'UPCOMING';
    else if (synced.status === 'HALF_TIME' || synced.status === 'HALFTIME') updatedStatus = 'HALF_TIME';

    // Status is strictly driven by Google Search live sync result
    if (synced.minute) {
      match = { ...match, minute: synced.minute };
    }

    // Detect Goal Event (Score increased or goal flag from Google)
    const homeGoalScored = updatedHomeScore > match.homeScore;
    const awayGoalScored = updatedAwayScore > match.awayScore;

    if (homeGoalScored || awayGoalScored || synced.goalDetected) {
      const scoringTeamName = homeGoalScored
        ? homeTeamName
        : awayGoalScored
        ? awayTeamName
        : synced.scoringTeam === 'HOME'
        ? homeTeamName
        : awayTeamName;

      // Play audio chime and trigger FCM push notification
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

    // Detect Match End Event (Time ended in Google)
    const justFinished = (match.status === 'LIVE' || match.status === 'UPCOMING') && (updatedStatus === 'FINISHED' || synced.isFinished);

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

    // Build updated event log if new goal occurred
    const newEvents = [...match.events];
    if (homeGoalScored || awayGoalScored) {
      let minuteNum = 85;
      if (synced.minute) {
        const parsed = parseInt(synced.minute.replace(/\D/g, ''), 10);
        if (!isNaN(parsed)) minuteNum = parsed;
      }

      newEvents.unshift({
        id: `e_google_${Date.now()}`,
        minute: minuteNum,
        type: 'GOAL',
        team: homeGoalScored ? 'HOME' : 'AWAY',
        playerName: synced.scorerName || (isAr ? 'هدف' : 'Goal Scored'),
        playerNameAr: synced.scorerName || (isAr ? 'هدف' : 'Goal Scored'),
        detail: `Google Live Score update: ${updatedHomeScore} - ${updatedAwayScore}`,
      });
    }

    const finalMatch: Match = {
      ...match,
      homeScore: updatedHomeScore,
      awayScore: updatedAwayScore,
      status: updatedStatus,
      time: updatedStatus === 'FINISHED' ? (isAr ? 'انتهت' : 'FT') : (synced.minute || match.time),
      minute: updatedStatus === 'FINISHED' ? (isAr ? 'انتهت' : 'FT') : (synced.minute || match.minute),
      events: newEvents,
      isGoogleSynced: true,
      lastSyncedAt: new Date().toISOString(),
    };

    if (updatedStatus === 'FINISHED') {
      finalMatch.stats = generateFinishedMatchStats(finalMatch);
    }

    return finalMatch;
  });
}
