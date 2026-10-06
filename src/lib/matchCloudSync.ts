import { 
  db, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDocs, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { Match, MatchStatus } from '../types';
import { FINISHED_MATCHES_CATALOG, KNOWN_UPCOMING_MATCH_IDS, isMatchRemovedGlobally, isMatchObjectRemovedGlobally } from '../utils/predictionEvaluator';
import { isMatchFinished } from '../data/matchHelpers';
import { resolveFinalMatchScore, getPersistedMatchScore } from '../utils/matchScorePersistence';

/**
 * Subscribes to real-time updates for all matches stored in Firestore.
 * When any match result, score, or status is added or updated in the cloud,
 * this listener immediately notifies all connected clients in real-time.
 */
export function subscribeToCloudMatches(
  callback: (cloudMap: Record<string, Partial<Match>>) => void
): () => void {
  try {
    const matchesCol = collection(db, 'matches');
    const unsubscribe = onSnapshot(
      matchesCol,
      (snapshot) => {
        const cloudMap: Record<string, Partial<Match>> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && docSnap.id) {
            cloudMap[docSnap.id] = {
              ...data,
              id: docSnap.id,
              homeScore: typeof data.homeScore === 'number' ? data.homeScore : undefined,
              awayScore: typeof data.awayScore === 'number' ? data.awayScore : undefined,
              status: data.status || (data.isFinished ? 'FINISHED' : undefined),
              isFinished: data.isFinished || data.status === 'FINISHED',
              time: data.time || (data.status === 'FINISHED' ? 'انتهت' : undefined),
              minute: data.minute,
            } as Partial<Match>;
          }
        });
        callback(cloudMap);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'matches');
      }
    );

    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'matches');
    return () => {};
  }
}

/**
 * Merges live cloud matches from Firestore over local matches.
 * Cloud results take precedence so any score or status update is immediately reflected.
 */
export function mergeCloudMatches(
  localMatches: Match[],
  cloudMap: Record<string, Partial<Match>>
): Match[] {
  const filteredLocal = localMatches.filter(
    (m) => !isMatchRemovedGlobally(m.id) && !isMatchObjectRemovedGlobally(m)
  );

  return filteredLocal.map((match) => {
    const cloudData = cloudMap ? cloudMap[match.id] : undefined;
    const catalogEntry = FINISHED_MATCHES_CATALOG[match.id];

    // Priority 1: If catalog entry exists, it is permanently FINISHED with exact score
    if (catalogEntry) {
      return {
        ...match,
        ...(cloudData || {}),
        homeScore: catalogEntry.homeScore,
        awayScore: catalogEntry.awayScore,
        status: 'FINISHED' as MatchStatus,
        isFinished: true,
        time: 'انتهت',
        minute: 'انتهت',
        pointsDistributed: true,
        customCoinsReward: catalogEntry.customCoinsReward ?? match.customCoinsReward,
      };
    }

    // Priority 2: If cloud data marks the match as finished, lock it as FINISHED
    if (cloudData && (cloudData.status === 'FINISHED' || cloudData.isFinished === true || cloudData.time === 'انتهت' || cloudData.minute === 'انتهت')) {
      const saved = getPersistedMatchScore(match.id);
      const savedHome = saved && typeof saved.homeScore === 'number' ? saved.homeScore : 0;
      const savedAway = saved && typeof saved.awayScore === 'number' ? saved.awayScore : 0;

      const bestHome = (typeof cloudData.homeScore === 'number' && cloudData.homeScore > 0)
        ? cloudData.homeScore
        : ((typeof match.homeScore === 'number' && match.homeScore > 0) ? match.homeScore : (savedHome > 0 ? savedHome : (cloudData.homeScore ?? match.homeScore ?? 0)));
      const bestAway = (typeof cloudData.awayScore === 'number' && cloudData.awayScore > 0)
        ? cloudData.awayScore
        : ((typeof match.awayScore === 'number' && match.awayScore > 0) ? match.awayScore : (savedAway > 0 ? savedAway : (cloudData.awayScore ?? match.awayScore ?? 0)));
      let finalHome = bestHome;
      let finalAway = bestAway;
      if (finalHome === 0 && finalAway === 0) {
        const resolved = resolveFinalMatchScore(match);
        finalHome = resolved.homeScore;
        finalAway = resolved.awayScore;
      }
      return {
        ...match,
        ...cloudData,
        homeScore: finalHome,
        awayScore: finalAway,
        status: 'FINISHED' as MatchStatus,
        isFinished: true,
        time: 'انتهت',
        minute: 'انتهت',
        pointsDistributed: true,
      };
    }

    // Priority 3: If local match itself is already finished, preserve it as FINISHED
    if (match.status === 'FINISHED' || match.isFinished === true || match.pointsDistributed === true || isMatchFinished(match)) {
      const saved = getPersistedMatchScore(match.id);
      const savedHome = saved && typeof saved.homeScore === 'number' ? saved.homeScore : 0;
      const savedAway = saved && typeof saved.awayScore === 'number' ? saved.awayScore : 0;

      const bestHome = (typeof match.homeScore === 'number' && match.homeScore > 0)
        ? match.homeScore
        : ((typeof cloudData?.homeScore === 'number' && cloudData.homeScore > 0) ? cloudData.homeScore : (savedHome > 0 ? savedHome : (match.homeScore ?? 0)));
      const bestAway = (typeof match.awayScore === 'number' && match.awayScore > 0)
        ? match.awayScore
        : ((typeof cloudData?.awayScore === 'number' && cloudData.awayScore > 0) ? cloudData.awayScore : (savedAway > 0 ? savedAway : (match.awayScore ?? 0)));
      let finalHome = bestHome;
      let finalAway = bestAway;
      if (finalHome === 0 && finalAway === 0) {
        const resolved = resolveFinalMatchScore(match);
        finalHome = resolved.homeScore;
        finalAway = resolved.awayScore;
      }
      return {
        ...match,
        ...(cloudData || {}),
        homeScore: finalHome,
        awayScore: finalAway,
        status: 'FINISHED' as MatchStatus,
        isFinished: true,
        time: 'انتهت',
        minute: 'انتهت',
        pointsDistributed: true,
      };
    }

    // Priority 4: If cloud data indicates LIVE or HALF_TIME
    if (cloudData && (cloudData.status === 'LIVE' || cloudData.status === 'HALF_TIME')) {
      return {
        ...match,
        ...cloudData,
        status: cloudData.status as MatchStatus,
      };
    }

    // Priority 5: Known unplayed upcoming match
    if (KNOWN_UPCOMING_MATCH_IDS.has(match.id) && !catalogEntry && !match.isFinished && !isMatchFinished(match)) {
      return {
        ...match,
        homeScore: 0,
        awayScore: 0,
        status: 'UPCOMING' as MatchStatus,
        isFinished: false,
        time: match.time || '20:00',
        minute: '',
        pointsDistributed: false,
      };
    }

    // Priority 6: Merge any other cloud updates
    if (cloudData) {
      // Guard: Do not allow an active or finished match to be reset to 0-0 UPCOMING
      const wasLive = (match.status as string) === 'LIVE' || Boolean(match.isFinished);
      if (wasLive && cloudData.status === 'UPCOMING' && cloudData.homeScore === 0 && cloudData.awayScore === 0) {
        return match;
      }
      const currentHome = typeof match.homeScore === 'number' ? match.homeScore : 0;
      const currentAway = typeof match.awayScore === 'number' ? match.awayScore : 0;
      const safeHome = (currentHome > 0 && (!cloudData.homeScore || cloudData.homeScore === 0)) ? currentHome : (cloudData.homeScore ?? currentHome);
      const safeAway = (currentAway > 0 && (!cloudData.awayScore || cloudData.awayScore === 0)) ? currentAway : (cloudData.awayScore ?? currentAway);
      return {
        ...match,
        ...cloudData,
        homeScore: safeHome,
        awayScore: safeAway,
      };
    }

    return match;
  }) as Match[];
}

/**
 * Updates a match result in Firestore and notifies the backend to evaluate all user predictions.
 * This guarantees the result is published instantly to ALL users without requiring a code rebuild.
 */
export async function updateMatchResultInCloud(params: {
  matchId: string;
  homeScore: number;
  awayScore: number;
  status?: 'FINISHED' | 'LIVE' | 'UPCOMING';
  isFinished?: boolean;
  time?: string;
  minute?: string;
  events?: any[];
  stats?: any;
  homeTeamAr?: string;
  awayTeamAr?: string;
  homeTeam?: string;
  awayTeam?: string;
  customCoinsReward?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { matchId, homeScore, awayScore } = params;
    const status = params.status || (params.isFinished !== false ? 'FINISHED' : 'LIVE');
    const isFinished = status === 'FINISHED' || params.isFinished === true;
    const time = isFinished ? 'انتهت' : (params.time || '');

    const matchDocRef = doc(db, 'matches', matchId);
    
    // 1. Direct real-time write to Firestore `matches` collection
    await setDoc(
      matchDocRef,
      {
        id: matchId,
        homeScore,
        awayScore,
        status,
        isFinished,
        time,
        minute: params.minute || (isFinished ? 'انتهت' : ''),
        events: params.events || [],
        stats: params.stats || null,
        homeTeamAr: params.homeTeamAr || '',
        awayTeamAr: params.awayTeamAr || '',
        homeTeam: params.homeTeam || '',
        awayTeam: params.awayTeam || '',
        customCoinsReward: params.customCoinsReward || 50,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. Notify backend endpoint to evaluate all existing predictions across all users in DB
    try {
      await fetch('/api/matches/update-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          homeScore,
          awayScore,
          status,
          isFinished,
          homeTeamAr: params.homeTeamAr,
          awayTeamAr: params.awayTeamAr,
        }),
      });
    } catch (_) {
      // Background server evaluation optional if firestore write already succeeded
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kora_trigger_prediction_eval'));
      window.dispatchEvent(new Event('kora_matches_updated'));
    }

    return { success: true };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `matches/${params.matchId}`);
    return { success: false, error: err?.message || 'Failed to update match in cloud' };
  }
}

/**
 * Initializes Firestore with all catalog finished matches and initial fixtures in the background.
 */
let isBaselineSynced = false;
export async function syncAllBaselineMatchesToCloud(initialMatches: Match[]): Promise<void> {
  if (isBaselineSynced) return;
  isBaselineSynced = true;

  try {
    // Sync all catalog matches to Firestore if not already present
    const entries = Object.entries(FINISHED_MATCHES_CATALOG);
    for (const [matchId, catData] of entries) {
      const matchDocRef = doc(db, 'matches', matchId);
      setDoc(
        matchDocRef,
        {
          id: matchId,
          homeScore: catData.homeScore,
          awayScore: catData.awayScore,
          status: 'FINISHED',
          isFinished: true,
          time: 'انتهت',
          homeTeamAr: catData.homeTeamAr || '',
          awayTeamAr: catData.awayTeamAr || '',
          customCoinsReward: typeof catData.customCoinsReward === 'number' ? catData.customCoinsReward : 0,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    }

    // Sync all initial curated fixtures to Firestore with merge
    if (Array.isArray(initialMatches)) {
      for (const match of initialMatches) {
        if (!match || !match.id) continue;
        // Do not overwrite matches that have finished or have active scores
        if (match.status === 'FINISHED' || match.isFinished === true || isMatchFinished(match)) continue;
        if (typeof match.homeScore === 'number' && match.homeScore > 0) continue;
        if (typeof match.awayScore === 'number' && match.awayScore > 0) continue;
        const matchDocRef = doc(db, 'matches', match.id);
        setDoc(
          matchDocRef,
          {
            id: match.id,
            homeScore: typeof match.homeScore === 'number' ? match.homeScore : 0,
            awayScore: typeof match.awayScore === 'number' ? match.awayScore : 0,
            status: match.status || 'UPCOMING',
            isFinished: Boolean(match.isFinished),
            time: match.time || '20:00',
            homeTeam: match.homeTeam || '',
            awayTeam: match.awayTeam || '',
            homeTeamAr: match.homeTeamAr || '',
            awayTeamAr: match.awayTeamAr || '',
            homeLogo: match.homeLogo || '',
            awayLogo: match.awayLogo || '',
            homeColor: match.homeColor || '#000000',
            awayColor: match.awayColor || '#000000',
            leagueId: match.leagueId || '',
            leagueName: match.leagueName || '',
            leagueNameAr: match.leagueNameAr || '',
            roundNameAr: match.roundNameAr || '',
            leagueIcon: match.leagueIcon || '⚽',
            date: match.date || '',
            dateAr: match.dateAr || '',
            venue: match.venue || '',
            venueAr: match.venueAr || '',
            customCoinsReward: typeof match.customCoinsReward === 'number' ? match.customCoinsReward : 0,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});
      }
    }
  } catch (err) {
    // Non-blocking background sync
  }
}
