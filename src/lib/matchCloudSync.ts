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

  if (!cloudMap || Object.keys(cloudMap).length === 0) {
    return filteredLocal;
  }

  const merged = filteredLocal.map((match) => {
    // Scheduled upcoming matches must strictly remain UPCOMING with 0-0 score
    if (KNOWN_UPCOMING_MATCH_IDS.has(match.id) || (match.status === 'UPCOMING' && !match.isFinished)) {
      const cloudData = cloudMap[match.id];
      // Only accept cloud data if it is explicitly UPCOMING or a valid active LIVE match with in-progress scores
      if (cloudData && (cloudData.status === 'LIVE' || cloudData.status === 'HALF_TIME')) {
        return {
          ...match,
          ...cloudData,
          status: cloudData.status as MatchStatus,
        };
      }
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

    const cloudData = cloudMap[match.id];
    const catalogEntry = FINISHED_MATCHES_CATALOG[match.id];

    if (!cloudData && !catalogEntry) {
      return match;
    }

    // If cloud explicitly states the match is UPCOMING or not finished
    if (cloudData?.status === 'UPCOMING' || cloudData?.isFinished === false) {
      return {
        ...match,
        ...cloudData,
        homeScore: 0,
        awayScore: 0,
        status: 'UPCOMING' as MatchStatus,
        isFinished: false,
        time: match.time || '22:00',
        minute: '',
        pointsDistributed: false,
      };
    }

    const homeScore = cloudData?.homeScore !== undefined 
      ? cloudData.homeScore 
      : (catalogEntry?.homeScore !== undefined ? catalogEntry.homeScore : match.homeScore);

    const awayScore = cloudData?.awayScore !== undefined 
      ? cloudData.awayScore 
      : (catalogEntry?.awayScore !== undefined ? catalogEntry.awayScore : match.awayScore);

    const isFinished = cloudData?.isFinished || 
      cloudData?.status === 'FINISHED' || 
      match.status === 'FINISHED' || 
      Boolean(catalogEntry);

    const status: MatchStatus = isFinished 
      ? 'FINISHED' 
      : ((cloudData?.status as MatchStatus) || match.status);

    const time = status === 'FINISHED' 
      ? 'انتهت' 
      : (cloudData?.time || match.time);

    return {
      ...match,
      ...cloudData,
      homeScore,
      awayScore,
      status,
      isFinished,
      time,
      customCoinsReward: cloudData?.customCoinsReward || catalogEntry?.customCoinsReward || match.customCoinsReward || 50,
    };
  });

  return merged as Match[];
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
          customCoinsReward: catData.customCoinsReward || 50,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    }
  } catch (err) {
    // Non-blocking background sync
  }
}
