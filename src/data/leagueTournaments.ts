import { Match, LeagueTournament, LeagueTournamentParticipant, WonTournamentRankRecord, FinishedTournamentRecord } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAllCuratedMatches } from './mockMatches';
import { FINISHED_MATCHES_CATALOG } from '../utils/predictionEvaluator';

const LEAGUE_TOURNAMENT_STORAGE_KEY = 'kora_league_tournament_v6';
const FINISHED_TOURNAMENTS_STORAGE_KEY = 'kora_finished_tournaments_v1';
const DAILY_NOTIF_STORAGE_KEY = 'kora_league_tourn_daily_notif_date';

/**
 * The 4 dedicated matches for the League Tournament as specified by user:
 * 1. Liverpool FC vs Manchester City (10/11 - 18:30)
 * 2. Zamalek SC vs Al Ahly SC (10/11 - 20:00)
 * 3. Pyramids FC vs Ceramica Cleopatra FC (10/12 - 20:00)
 * 4. KuPS Kuopio vs Trabzonspor (10/15 - 19:45)
 */
export const DEDICATED_LEAGUE_TOURNAMENT_MATCH_IDS = [
  'm_epl_liverpool_mancity_oct11',
  'm_egy_zamalek_ahly_oct11',
  'm_egy_pyramids_ceramica_oct12',
  'm_uecl_kups_trabzonspor_oct15',
];

/**
 * Returns the 4 dedicated matches populated with current fixtures data
 */
export function getDedicatedLeagueTournamentMatches(): Match[] {
  const all = getAllCuratedMatches();
  const found = DEDICATED_LEAGUE_TOURNAMENT_MATCH_IDS
    .map(id => all.find(m => m.id === id))
    .filter((m): m is Match => Boolean(m));

  return found.map(m => ({ ...m, isTournamentMatch: true }));
}

// Initial matches list initialized with the 4 dedicated matches
export const INITIAL_LEAGUE_MATCHES: Match[] = getDedicatedLeagueTournamentMatches();

// Clean previous mock/seed keys from localStorage
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('kora_league_tournament_state_v1');
    localStorage.removeItem('kora_league_tournament_state_v2');
    localStorage.removeItem('kora_league_tournament_state_v3');
    localStorage.removeItem('kora_league_tournament_state_v4');
    localStorage.removeItem('kora_league_tournament_v5');
  } catch (_) {}
}

export function buildDefaultLeagueTournament(): LeagueTournament {
  const dedicatedMatches = getDedicatedLeagueTournamentMatches();
  return {
    id: 'league_tourn_premier_2026',
    title: 'Grand League Champions Tournament 🏆',
    titleAr: 'بطولة دوريات النخبة الكبرى 🏆',
    description: 'Dedicated league prediction championship. Free participation for all fans. 250 participants required to unlock predictions.',
    descriptionAr: 'مسابقة توقعات خاصة ومجانية بالكامل لمباريات الدوريات الكبرى. الحد الأدنى لانطلاق المسابقة 250 لاعباً.',
    leagueName: 'Premier League, Egyptian League & Conference League',
    leagueNameAr: 'الدوري الإنجليزي والمصري ودوري المؤتمر الأوروبي',
    minRequiredParticipants: 250,
    participantsCount: 0,
    isUnlocked: false,
    status: 'RECRUITING',
    startDate: '2026-10-11',
    endDate: '2026-10-15',
    matches: dedicatedMatches,
    prizes: {
      first: { coins: 200, label: '1st Place', labelAr: 'المركز الأول: 200 كوينز 🪙' },
      second: { coins: 150, label: '2nd Place', labelAr: 'المركز الثاني: 150 كوينز 🪙' },
      third: { coins: 100, label: '3rd Place', labelAr: 'المركز الثالث: 100 كوينز 🪙' },
    },
    prizesDistributed: false,
    participants: [], // Strictly 0 participants initially
  };
}

/**
 * Load the active League Tournament from local storage or fallback to default
 */
export function getActiveLeagueTournament(): LeagueTournament {
  if (typeof window === 'undefined') {
    return buildDefaultLeagueTournament();
  }

  try {
    const raw = localStorage.getItem(LEAGUE_TOURNAMENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) {
        // Guarantee the 4 dedicated matches are always set in the tournament
        parsed.matches = getDedicatedLeagueTournamentMatches();

        // Always sync updated tournament prizes (1st: 200, 2nd: 150, 3rd: 100 coins)
        parsed.prizes = {
          first: { coins: 200, label: '1st Place', labelAr: 'المركز الأول: 200 كوينز 🪙' },
          second: { coins: 150, label: '2nd Place', labelAr: 'المركز الثاني: 150 كوينز 🪙' },
          third: { coins: 100, label: '3rd Place', labelAr: 'المركز الثالث: 100 كوينز 🪙' },
        };

        // Recalculate isUnlocked based on count
        parsed.participantsCount = parsed.participants ? parsed.participants.length : (parsed.participantsCount || 0);
        parsed.isUnlocked = parsed.participantsCount >= parsed.minRequiredParticipants;
        if (parsed.isUnlocked && parsed.status === 'RECRUITING') {
          parsed.status = 'ACTIVE';
        }

        // CRITICAL RULE: If tournament is locked (< 250 participants), do NOT attach or keep predictions in tournament!
        if (!parsed.isUnlocked && Array.isArray(parsed.participants)) {
          parsed.participants.forEach((p: LeagueTournamentParticipant) => {
            p.predictions = {};
            p.totalPredictionsCount = 0;
          });
        }

        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load league tournament:', err);
  }

  const def = buildDefaultLeagueTournament();
  try {
    localStorage.setItem(LEAGUE_TOURNAMENT_STORAGE_KEY, JSON.stringify(def));
  } catch (_) {}
  return def;
}

/**
 * Save updated League Tournament state
 */
export function saveLeagueTournament(tournament: LeagueTournament): void {
  if (typeof window === 'undefined') return;
  tournament.participantsCount = tournament.participants.length;
  tournament.isUnlocked = tournament.participantsCount >= tournament.minRequiredParticipants;
  if (tournament.isUnlocked && tournament.status === 'RECRUITING') {
    tournament.status = 'ACTIVE';
  }
  // Guarantee no predictions in tournament until 250 participants is fulfilled
  if (!tournament.isUnlocked && Array.isArray(tournament.participants)) {
    tournament.participants.forEach((p: LeagueTournamentParticipant) => {
      p.predictions = {};
      p.totalPredictionsCount = 0;
    });
  }
  try {
    localStorage.setItem(LEAGUE_TOURNAMENT_STORAGE_KEY, JSON.stringify(tournament));
    window.dispatchEvent(new CustomEvent('kora_league_tournament_updated', { detail: tournament }));
  } catch (_) {}
}

/**
 * Helper to backfill participants' predictions once 250 participants threshold is reached
 */
function backfillParticipantsPredictions(participants: LeagueTournamentParticipant[]): LeagueTournamentParticipant[] {
  if (typeof window === 'undefined') return participants;
  return participants.map(participant => {
    try {
      const raw = localStorage.getItem(`kora_my_predictions_${participant.userId}`);
      if (raw) {
        const preds = JSON.parse(raw);
        if (Array.isArray(preds)) {
          const participantPreds: Record<string, { predictedHomeScore: number; predictedAwayScore: number; predictedAt: string }> = {};
          preds.forEach((p: any) => {
            if (p.matchId && DEDICATED_LEAGUE_TOURNAMENT_MATCH_IDS.includes(p.matchId)) {
              participantPreds[p.matchId] = {
                predictedHomeScore: Number(p.predictedHomeScore) || 0,
                predictedAwayScore: Number(p.predictedAwayScore) || 0,
                predictedAt: p.createdAt || p.updatedAt || new Date().toISOString(),
              };
            }
          });
          return {
            ...participant,
            predictions: participantPreds,
            totalPredictionsCount: Object.keys(participantPreds).length,
          };
        }
      }
    } catch (_) {}
    return participant;
  });
}

/**
 * Free join for users: Adds user to participants if not already joined.
 * Predictions are NOT added until the 250 participants threshold is reached!
 */
export function joinLeagueTournament(
  user: { uid?: string; displayName?: string; email?: string } | null,
  tournament: LeagueTournament
): { success: boolean; message: string; tournament: LeagueTournament; isNewlyUnlocked: boolean } {
  const userId = user?.uid || (typeof window !== 'undefined' ? (localStorage.getItem('kora_guest_uid') || `guest_${Date.now()}`) : 'guest');
  if (typeof window !== 'undefined' && !localStorage.getItem('kora_guest_uid')) {
    localStorage.setItem('kora_guest_uid', userId);
  }

  const userName = user?.displayName || user?.email?.split('@')[0] || 'مشجع كروي';

  const alreadyJoined = tournament.participants.some(p => p.userId === userId);
  if (alreadyJoined) {
    return {
      success: true,
      message: 'أنت منضم بالفعل إلى بطولة الدوريات!',
      tournament,
      isNewlyUnlocked: false,
    };
  }

  const wasUnlocked = tournament.isUnlocked;

  // Initial predictions stay completely empty while recruiting (< 250)
  const newParticipant: LeagueTournamentParticipant = {
    userId,
    userName,
    joinedAt: new Date().toISOString(),
    correctPredictionsCount: 0,
    exactPredictionsCount: 0,
    totalPredictionsCount: 0,
    predictions: {},
  };

  let updatedParticipants = [newParticipant, ...tournament.participants];
  const isUnlockedNow = updatedParticipants.length >= tournament.minRequiredParticipants;

  // Once 250 participants threshold is reached, backfill predictions for all players!
  if (isUnlockedNow && !wasUnlocked) {
    updatedParticipants = backfillParticipantsPredictions(updatedParticipants);
  }

  const updatedTournament: LeagueTournament = {
    ...tournament,
    participants: updatedParticipants,
    participantsCount: updatedParticipants.length,
    isUnlocked: isUnlockedNow,
    status: isUnlockedNow ? 'ACTIVE' : 'RECRUITING',
  };

  saveLeagueTournament(updatedTournament);

  const isNewlyUnlocked = !wasUnlocked && updatedTournament.isUnlocked;

  return {
    success: true,
    message: isNewlyUnlocked
      ? '🎉 تم انضمامك واكتمل النصاب المطلوب (250 لاعب)! فُتحت التوقعات الآن للجميع!'
      : '✅ تم انضمامك مجاناً بنجاح لبطولة الدوريات! ننتظر اكتمال 250 لاعباً لفتح التوقعات.',
    tournament: updatedTournament,
    isNewlyUnlocked,
  };
}

/**
 * Synchronize a prediction made on the main page to the League Tournament.
 * CRITICAL USER RULE:
 * - If the match is one of the 4 shared tournament matches AND the user is a participant:
 *   The prediction is automatically transferred to the tournament!
 * - If the user is NOT a participant, nothing is transferred ("ولو مشتركش في البطوله خلاص دا في المباريات المشتركه فقط").
 */
export function syncPredictionToLeagueTournament(
  user: { uid?: string } | null,
  matchId: string,
  homeScore: number,
  awayScore: number
): { synced: boolean; message?: string } {
  // Check if this match is one of the 4 dedicated tournament matches
  if (!DEDICATED_LEAGUE_TOURNAMENT_MATCH_IDS.includes(matchId)) {
    return { synced: false };
  }

  const tournament = getActiveLeagueTournament();

  // CRITICAL USER RULE: Do NOT add or sync predictions to the tournament until the 250 players count is complete!
  if (!tournament.isUnlocked) {
    return { synced: false };
  }

  const userId = user?.uid || (typeof window !== 'undefined' ? localStorage.getItem('kora_guest_uid') || 'guest' : 'guest');

  // Find if user is joined as participant
  const participantIndex = tournament.participants.findIndex(p => p.userId === userId);
  if (participantIndex === -1) {
    // User is NOT joined in tournament: strictly do not add to tournament!
    return { synced: false };
  }

  // User IS joined: automatically transfer prediction into tournament participant record!
  const participant = { ...tournament.participants[participantIndex] };
  participant.predictions = participant.predictions || {};
  participant.predictions[matchId] = {
    predictedHomeScore: homeScore,
    predictedAwayScore: awayScore,
    predictedAt: new Date().toISOString(),
  };
  participant.totalPredictionsCount = Object.keys(participant.predictions).length;

  const updatedParticipants = [...tournament.participants];
  updatedParticipants[participantIndex] = participant;

  const updatedTournament: LeagueTournament = {
    ...tournament,
    participants: updatedParticipants,
  };

  saveLeagueTournament(updatedTournament);

  return {
    synced: true,
    message: '🏆 تم نقل توقعك تلقائياً إلى بطولة الدوريات لأنك مشترك فيها!',
  };
}

/**
 * Check if a match has officially started / kicked off
 */
export function isLeagueMatchLocked(match: Match): boolean {
  if (match.status === 'LIVE' || match.status === 'FINISHED' || match.isFinished) {
    return true;
  }
  if (match.time === 'انتهت' || match.time === 'FT') {
    return true;
  }
  if (typeof match.kickoffTimeMs === 'number' && match.kickoffTimeMs > 0) {
    return Date.now() >= match.kickoffTimeMs;
  }
  if (match.date && match.time) {
    try {
      const cleanTime = String(match.time).replace(/[^0-9:]/g, '');
      if (cleanTime.includes(':')) {
        const parts = cleanTime.split(':').map(Number);
        const matchDate = new Date(`${match.date}T${String(parts[0]).padStart(2, '0')}:${String(parts[1] || 0).padStart(2, '0')}:00+03:00`);
        if (!isNaN(matchDate.getTime())) {
          return Date.now() >= matchDate.getTime();
        }
      }
    } catch (_) {}
  }
  return false;
}

/**
 * Submit score prediction for a league tournament match
 */
export function submitLeaguePrediction(
  tournament: LeagueTournament,
  matchId: string,
  userId: string,
  homeScore: number,
  awayScore: number
): { success: boolean; message: string; tournament: LeagueTournament } {
  if (!tournament.isUnlocked) {
    return {
      success: false,
      message: '🔒 التوقعات مقفولة حتى انضمام 250 لاعباً للمسابقة!',
      tournament,
    };
  }

  const targetMatch = tournament.matches.find(m => m.id === matchId);
  if (!targetMatch) {
    return { success: false, message: 'المباراة غير موجودة في البطولة', tournament };
  }

  if (isLeagueMatchLocked(targetMatch)) {
    return {
      success: false,
      message: '⚠️ انتهى وقت التوقع لهذه المباراة مع انطلاق صافرة البداية!',
      tournament,
    };
  }

  const participantIndex = tournament.participants.findIndex(p => p.userId === userId);
  if (participantIndex === -1) {
    return {
      success: false,
      message: 'يرجى الانضمام للمسابقة أولاً لتتمكن من حفظ توقعاتك!',
      tournament,
    };
  }

  const participant = { ...tournament.participants[participantIndex] };
  participant.predictions = participant.predictions || {};
  participant.predictions[matchId] = {
    predictedHomeScore: homeScore,
    predictedAwayScore: awayScore,
    predictedAt: new Date().toISOString(),
  };
  participant.totalPredictionsCount = Object.keys(participant.predictions).length;

  const updatedParticipants = [...tournament.participants];
  updatedParticipants[participantIndex] = participant;

  const updatedTournament: LeagueTournament = {
    ...tournament,
    participants: updatedParticipants,
  };

  saveLeagueTournament(updatedTournament);

  return {
    success: true,
    message: '🎯 تم حفظ توقعك للمباراة بنجاح!',
    tournament: updatedTournament,
  };
}

/**
 * Calculate standings: strictly based on correct predictions count!
 * "اللي اتوقع ماتشين صح يكون سابق اللي اتوقع ماتش واحد وهكذا"
 */
export function calculateLeagueStandings(tournament: LeagueTournament): LeagueTournamentParticipant[] {
  const finishedMatchMap = new Map<string, { homeScore: number; awayScore: number }>();

  // 1. From tournament.matches
  tournament.matches.forEach(m => {
    if (typeof m.homeScore === 'number' && typeof m.awayScore === 'number' && (m.status === 'FINISHED' || m.isFinished)) {
      finishedMatchMap.set(m.id, { homeScore: m.homeScore, awayScore: m.awayScore });
    }
  });

  // 2. From FINISHED_MATCHES_CATALOG (so results provided in catalog immediately evaluate standings)
  DEDICATED_LEAGUE_TOURNAMENT_MATCH_IDS.forEach(id => {
    const cat = FINISHED_MATCHES_CATALOG[id];
    if (cat && typeof cat.homeScore === 'number' && typeof cat.awayScore === 'number') {
      finishedMatchMap.set(id, { homeScore: cat.homeScore, awayScore: cat.awayScore });
    }
  });

  // 3. From localStorage completed scores if any
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('kora_completed_match_scores');
      if (raw) {
        const parsed = JSON.parse(raw);
        DEDICATED_LEAGUE_TOURNAMENT_MATCH_IDS.forEach(id => {
          const saved = parsed[id];
          if (saved && typeof saved.homeScore === 'number' && typeof saved.awayScore === 'number') {
            finishedMatchMap.set(id, { homeScore: saved.homeScore, awayScore: saved.awayScore });
          }
        });
      }
    } catch (_) {}
  }

  const rankedParticipants = tournament.participants.map(participant => {
    let correctCount = 0;
    let exactCount = 0;

    if (participant.predictions) {
      Object.entries(participant.predictions).forEach(([matchId, pred]) => {
        const matchData = finishedMatchMap.get(matchId);
        if (matchData && typeof matchData.homeScore === 'number' && typeof matchData.awayScore === 'number') {
          const actualHome = matchData.homeScore;
          const actualAway = matchData.awayScore;
          const predHome = Number(pred.predictedHomeScore);
          const predAway = Number(pred.predictedAwayScore);
          const isExact = predHome === actualHome && predAway === actualAway;

          const actualOutcome = actualHome > actualAway ? 'HOME' : actualHome < actualAway ? 'AWAY' : 'DRAW';
          const predOutcome = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'DRAW';
          const isCorrectOutcome = actualOutcome === predOutcome;

          if (isExact) {
            exactCount++;
            correctCount++;
          } else if (isCorrectOutcome) {
            correctCount++;
          }
        }
      });
    }

    return {
      ...participant,
      correctPredictionsCount: Math.max(participant.correctPredictionsCount || 0, correctCount),
      exactPredictionsCount: Math.max(participant.exactPredictionsCount || 0, exactCount),
    };
  });

  // Strict sorting: 1) Most correct predictions, 2) Most exact predictions, 3) Earlier join date
  rankedParticipants.sort((a, b) => {
    if (b.correctPredictionsCount !== a.correctPredictionsCount) {
      return b.correctPredictionsCount - a.correctPredictionsCount;
    }
    if (b.exactPredictionsCount !== a.exactPredictionsCount) {
      return b.exactPredictionsCount - a.exactPredictionsCount;
    }
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  return rankedParticipants.map((p, idx) => ({ ...p, rank: idx + 1 }));
}

/**
 * Distribute prizes to the TOP 3 ONLY (200 coins for 1st, 150 for 2nd, 100 for 3rd)
 * Updates user records and Firestore user profile.
 */
export async function distributeLeagueTournamentTop3Prizes(
  tournament: LeagueTournament,
  currentUserId?: string
): Promise<{
  success: boolean;
  message: string;
  tournament: LeagueTournament;
  winners: { rank: number; name: string; prizeCoins: number; userId: string }[];
}> {
  const standings = calculateLeagueStandings(tournament);
  if (standings.length < 3) {
    return {
      success: false,
      message: 'العدد الحالي لا يكفي لتحديد المراكز الثلاثة الأولى',
      tournament,
      winners: [],
    };
  }

  const top3 = standings.slice(0, 3);
  const prizeAmounts = [
    tournament.prizes?.first?.coins || 200,
    tournament.prizes?.second?.coins || 150,
    tournament.prizes?.third?.coins || 100,
  ];

  const winners = top3.map((player, idx) => ({
    rank: idx + 1,
    name: player.userName,
    prizeCoins: prizeAmounts[idx],
    userId: player.userId,
  }));

  // Update current user if they placed in top 3
  if (currentUserId) {
    const userWinner = winners.find(w => w.userId === currentUserId);
    if (userWinner) {
      awardTournamentWinToUser(currentUserId, tournament, userWinner.rank as 1 | 2 | 3, userWinner.prizeCoins);
    }
  }

  const updatedTournament: LeagueTournament = {
    ...tournament,
    prizesDistributed: true,
    status: 'FINISHED',
  };

  saveLeagueTournament(updatedTournament);

  // Archive to Finished Tournaments
  try {
    const finishedRecord: FinishedTournamentRecord = {
      id: `finished_${tournament.id}_${Date.now()}`,
      tournamentId: tournament.id,
      title: tournament.title,
      titleAr: tournament.titleAr,
      type: 'league',
      completedAt: new Date().toISOString(),
      totalParticipants: tournament.participants.length,
      podium: winners.map(w => {
        const p = standings.find(s => s.userId === w.userId);
        return {
          rank: w.rank as 1 | 2 | 3,
          userId: w.userId,
          userName: w.name,
          prizeCoins: w.prizeCoins,
          correctPredictionsCount: p?.correctPredictionsCount || 0,
        };
      }),
      finalStandings: standings.map(s => ({
        rank: s.rank,
        userId: s.userId,
        userName: s.userName,
        correctPredictionsCount: s.correctPredictionsCount || 0,
        exactPredictionsCount: s.exactPredictionsCount || 0,
      })),
      matches: tournament.matches.map(m => ({
        homeTeam: m.homeTeam,
        homeTeamAr: m.homeTeamAr,
        awayTeam: m.awayTeam,
        awayTeamAr: m.awayTeamAr,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: m.status,
        homeLogo: m.homeLogo,
        awayLogo: m.awayLogo,
      })),
      prizesDistributed: true,
    };
    saveFinishedTournament(finishedRecord);
  } catch (err) {
    console.warn('Failed to archive finished tournament:', err);
  }

  return {
    success: true,
    message: `🎉 تم توزيع الجوائز بنجاح على المراكز الثلاثة الأولى:\n1️⃣ ${winners[0].name}: ${winners[0].prizeCoins} كوينز\n2️⃣ ${winners[1].name}: ${winners[1].prizeCoins} كوينز\n3️⃣ ${winners[2].name}: ${winners[2].prizeCoins} كوينز`,
    tournament: updatedTournament,
    winners,
  };
}

/**
 * Finished Tournaments Persistence (البطولات المنتهية)
 */
export function getFinishedTournaments(): FinishedTournamentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FINISHED_TOURNAMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

export function saveFinishedTournament(record: FinishedTournamentRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getFinishedTournaments();
    const updated = [record, ...existing.filter(r => r.id !== record.id)];
    localStorage.setItem(FINISHED_TOURNAMENTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('kora_finished_tournaments_updated', { detail: updated }));
  } catch (_) {}
}

/**
 * Helpers to add/remove matches to the League Tournament
 */
export function addMatchesToLeagueTournament(matchesToAdd: Match[], existingTourn?: LeagueTournament): LeagueTournament {
  const current = existingTourn || getActiveLeagueTournament();
  const existingIds = new Set(current.matches.map(m => m.id));
  const newMatches = matchesToAdd.filter(m => !existingIds.has(m.id));
  const updatedMatches = [...current.matches, ...newMatches];
  const updatedTournament: LeagueTournament = {
    ...current,
    matches: updatedMatches,
  };
  saveLeagueTournament(updatedTournament);
  return updatedTournament;
}

export function removeMatchFromLeagueTournament(matchId: string, existingTourn?: LeagueTournament): LeagueTournament {
  const current = existingTourn || getActiveLeagueTournament();
  const updatedMatches = current.matches.filter(m => m.id !== matchId);
  const updatedTournament: LeagueTournament = {
    ...current,
    matches: updatedMatches,
  };
  saveLeagueTournament(updatedTournament);
  return updatedTournament;
}

export function resetLeagueTournamentToZero(): LeagueTournament {
  const fresh = buildDefaultLeagueTournament();
  saveLeagueTournament(fresh);
  return fresh;
}

/**
 * Award tournament win and rank to user profile (LocalStorage & Firestore)
 */
export async function awardTournamentWinToUser(
  userId: string,
  tournament: LeagueTournament,
  rank: 1 | 2 | 3,
  prizeCoins: number
): Promise<void> {
  if (!userId) return;

  const wonRecord: WonTournamentRankRecord = {
    id: `won_${tournament.id}_${Date.now()}`,
    tournamentId: tournament.id,
    tournamentTitle: tournament.title,
    tournamentTitleAr: tournament.titleAr,
    rank,
    prizeCoins,
    wonAt: new Date().toISOString(),
  };

  // 1. LocalStorage
  const storageKey = `kora_user_tournament_wins_${userId}`;
  try {
    const existingRaw = localStorage.getItem(storageKey);
    const existing: WonTournamentRankRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [wonRecord, ...existing.filter(r => r.tournamentId !== tournament.id)];
    localStorage.setItem(storageKey, JSON.stringify(updated));
    localStorage.setItem(`kora_tournaments_won_count_${userId}`, String(updated.length));
  } catch (_) {}

  // 2. Add coins to local points
  try {
    const pointsKey = `kora_user_points_${userId}`;
    const currentPoints = Number(localStorage.getItem(pointsKey) || '0');
    localStorage.setItem(pointsKey, String(currentPoints + prizeCoins));
    window.dispatchEvent(new Event('kora_points_updated'));
  } catch (_) {}

  // 3. Firestore sync
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const prevWins: WonTournamentRankRecord[] = Array.isArray(data.wonTournamentRanks) ? data.wonTournamentRanks : [];
      const updatedWins = [wonRecord, ...prevWins.filter(r => r.tournamentId !== tournament.id)];
      await setDoc(userDocRef, {
        points: (data.points || 0) + prizeCoins,
        tournamentsWonCount: updatedWins.length,
        wonTournamentRanks: updatedWins,
      }, { merge: true });
    }
  } catch (err) {
    console.warn('Firestore tournament win sync notice:', err);
  }
}

/**
 * Retrieve user's won tournament records
 */
export function getUserWonTournamentRanks(userId?: string | null): WonTournamentRankRecord[] {
  if (!userId) return [];
  try {
    const storageKey = `kora_user_tournament_wins_${userId}`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

/**
 * Check and send ONE notification per day until the tournament starts
 * "وعاوز اول ما تضيفها تبعت الاشعارات لجميع المستخدمين بس هوا اشعار واحد بس لكل يوم لحد بدأ البطوله"
 */
export function checkAndSendDailyTournamentNotification(
  tournament: LeagueTournament,
  onNotify?: (notification: {
    title: string;
    titleAr: string;
    body: string;
    bodyAr: string;
    type: 'SMART_REMINDER';
  }) => void
): boolean {
  if (typeof window === 'undefined') return false;

  const todayStr = new Date().toISOString().slice(0, 10);
  const lastNotifDate = localStorage.getItem(DAILY_NOTIF_STORAGE_KEY);

  // Send ONLY ONCE per day
  if (lastNotifDate === todayStr) {
    return false;
  }

  // Once tournament has started/finished, stop sending daily recruitment notification
  if (tournament.status === 'FINISHED') {
    return false;
  }

  // Update daily throttle
  try {
    localStorage.setItem(DAILY_NOTIF_STORAGE_KEY, todayStr);
  } catch (_) {}

  const remainingToUnlock = Math.max(0, tournament.minRequiredParticipants - tournament.participantsCount);
  const title = '🏆 League Tournament Alert!';
  const titleAr = '🏆 مسابقة بطولة الدوريات الكبرى!';
  const body = tournament.isUnlocked
    ? `Predictions are open! Predict top matches to win up to ${tournament.prizes.first.coins} coins!`
    : `Join now for free! ${tournament.participantsCount}/250 players joined. ${remainingToUnlock} spots left to unlock predictions!`;
  const bodyAr = tournament.isUnlocked
    ? `التوقعات مفتوحة الآن! توقع قمم الدوريات وتصدر الترتيب لربح ${tournament.prizes.first.coins} كوينز كبرى!`
    : `انضم الآن مجاناً! انضم حتى الآن ${tournament.participantsCount} من أصل 250 لاعب. متبقي ${remainingToUnlock} مشترك لفتح التوقعات!`;

  if (onNotify) {
    onNotify({
      title,
      titleAr,
      body,
      bodyAr,
      type: 'SMART_REMINDER',
    });
  }

  return true;
}
