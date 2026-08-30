import { Match, MatchStats } from '../types';

/**
 * Generates or enriches complete, realistic post-match statistics for a finished match.
 * Ensures data consistency with the final score, goals, and team lineups.
 */
export function generateFinishedMatchStats(match: Match): MatchStats {
  const homeScore = match.homeScore || 0;
  const awayScore = match.awayScore || 0;
  const existing = match.stats;

  // Check if existing stats already have non-zero shots/possession
  const hasExistingData =
    existing &&
    (existing.possession?.[0] > 0 ||
      existing.shotsTotal?.[0] > 0 ||
      existing.shotsTotal?.[1] > 0);

  // Derive possession based on score balance and team weight
  let homePoss = 50;
  if (hasExistingData && existing.possession?.[0]) {
    homePoss = existing.possession[0];
  } else {
    if (homeScore > awayScore) {
      homePoss = 52 + Math.min(14, (homeScore - awayScore) * 4);
    } else if (awayScore > homeScore) {
      homePoss = 48 - Math.min(14, (awayScore - homeScore) * 4);
    } else {
      homePoss = 50 + ((match.id.charCodeAt(0) % 7) - 3);
    }
  }
  const awayPoss = 100 - homePoss;

  // Shots on target must be at least the goals scored
  const baseHomeTarget = Math.max(homeScore, Math.floor(homeScore * 1.6) + 3 + (match.id.charCodeAt(1) % 3));
  const baseAwayTarget = Math.max(awayScore, Math.floor(awayScore * 1.6) + 2 + (match.id.charCodeAt(2) % 3));

  const homeShotsOnTarget = hasExistingData && existing.shotsOnTarget?.[0] >= homeScore
    ? existing.shotsOnTarget[0]
    : baseHomeTarget;

  const awayShotsOnTarget = hasExistingData && existing.shotsOnTarget?.[1] >= awayScore
    ? existing.shotsOnTarget[1]
    : baseAwayTarget;

  const homeShotsTotal = hasExistingData && existing.shotsTotal?.[0] > homeShotsOnTarget
    ? existing.shotsTotal[0]
    : homeShotsOnTarget + 5 + (match.id.charCodeAt(3) % 5);

  const awayShotsTotal = hasExistingData && existing.shotsTotal?.[1] > awayShotsOnTarget
    ? existing.shotsTotal[1]
    : awayShotsOnTarget + 4 + (match.id.charCodeAt(4) % 5);

  const homeShotsOffTarget = Math.max(1, homeShotsTotal - homeShotsOnTarget - 2);
  const awayShotsOffTarget = Math.max(1, awayShotsTotal - awayShotsOnTarget - 2);

  const homeBlockedShots = Math.max(0, homeShotsTotal - homeShotsOnTarget - homeShotsOffTarget);
  const awayBlockedShots = Math.max(0, awayShotsTotal - awayShotsOnTarget - awayShotsOffTarget);

  // Calculate xG
  const homeXG = hasExistingData && existing.xG?.[0] > 0
    ? existing.xG[0]
    : parseFloat((homeScore * 0.72 + homeShotsOnTarget * 0.14 + (homePoss / 100) * 0.35).toFixed(2));

  const awayXG = hasExistingData && existing.xG?.[1] > 0
    ? existing.xG[1]
    : parseFloat((awayScore * 0.72 + awayShotsOnTarget * 0.14 + (awayPoss / 100) * 0.35).toFixed(2));

  // Passes & Pass Accuracy
  const totalPasses = 920;
  const homePasses = Math.round((totalPasses * homePoss) / 100);
  const awayPasses = totalPasses - homePasses;

  const homePassAcc = hasExistingData && existing.passAccuracy?.[0] > 0
    ? existing.passAccuracy[0]
    : Math.min(93, Math.max(74, 80 + Math.round((homePoss - 50) * 0.4)));

  const awayPassAcc = hasExistingData && existing.passAccuracy?.[1] > 0
    ? existing.passAccuracy[1]
    : Math.min(93, Math.max(74, 80 + Math.round((awayPoss - 50) * 0.4)));

  // Fouls & Cards
  const homeFouls = hasExistingData && existing.fouls?.[0] > 0
    ? existing.fouls[0]
    : 8 + (match.id.charCodeAt(0) % 7);

  const awayFouls = hasExistingData && existing.fouls?.[1] > 0
    ? existing.fouls[1]
    : 9 + (match.id.charCodeAt(1) % 8);

  const homeYellow = hasExistingData ? (existing.yellowCards?.[0] ?? 1) : Math.min(4, Math.floor(homeFouls / 5));
  const awayYellow = hasExistingData ? (existing.yellowCards?.[1] ?? 2) : Math.min(5, Math.floor(awayFouls / 4));
  const homeRed = hasExistingData ? (existing.redCards?.[0] ?? 0) : 0;
  const awayRed = hasExistingData ? (existing.redCards?.[1] ?? 0) : 0;

  const homeCorners = hasExistingData && existing.corners?.[0] > 0
    ? existing.corners[0]
    : Math.max(2, Math.round((homePoss / 10) + (homeScore > 0 ? 2 : 1)));

  const awayCorners = hasExistingData && existing.corners?.[1] > 0
    ? existing.corners[1]
    : Math.max(1, Math.round((awayPoss / 10) + (awayScore > 0 ? 2 : 0)));

  const homeOffsides = hasExistingData && existing.offsides?.[0] !== undefined
    ? existing.offsides[0]
    : 1 + (match.id.charCodeAt(2) % 3);

  const awayOffsides = hasExistingData && existing.offsides?.[1] !== undefined
    ? existing.offsides[1]
    : 1 + (match.id.charCodeAt(3) % 3);

  // Goalkeeper Saves: equal to opponent shots on target minus opponent goals
  const homeSaves = Math.max(0, awayShotsOnTarget - awayScore);
  const awaySaves = Math.max(0, homeShotsOnTarget - homeScore);

  const homeTackles = 14 + (match.id.charCodeAt(4) % 8);
  const awayTackles = 15 + (match.id.charCodeAt(5) % 8);

  const homeBigChances = Math.max(homeScore, Math.floor(homeScore + homeXG * 0.7));
  const awayBigChances = Math.max(awayScore, Math.floor(awayScore + awayXG * 0.7));

  // Determine Man of the Match (MOTM)
  let motm = existing?.manOfTheMatch;
  if (!motm) {
    const isHomeWinner = homeScore >= awayScore;
    const team: 'HOME' | 'AWAY' = isHomeWinner ? 'HOME' : 'AWAY';
    
    // Find goal scorers from events if available
    const winningEvents = (match.events || []).filter(e => e.type === 'GOAL' && e.team === team);
    
    if (winningEvents.length > 0) {
      const topScorer = winningEvents[0];
      const name = topScorer.playerName || (team === 'HOME' ? match.homeTeam : match.awayTeam);
      const nameAr = topScorer.playerNameAr || topScorer.playerName || (team === 'HOME' ? match.homeTeamAr : match.awayTeamAr);
      motm = {
        name,
        nameAr,
        team,
        rating: parseFloat((8.5 + (winningEvents.length > 1 ? 0.9 : 0.4)).toFixed(1)),
        statsSummary: `Goalscorer • xG Contribution ${team === 'HOME' ? homeXG : awayXG}`,
        statsSummaryAr: `سجل هدفاً حاسماً وقدم أداءً استثنائياً في المباراة`,
      };
    } else {
      // Pick star from lineup or captain
      const lineup = team === 'HOME' ? match.homeLineup : match.awayLineup;
      const starPlayer = lineup?.starting11?.[lineup.starting11.length - 1] || lineup?.starting11?.[0];
      motm = {
        name: starPlayer?.name || (team === 'HOME' ? `${match.homeTeam} Star` : `${match.awayTeam} Star`),
        nameAr: starPlayer?.nameAr || starPlayer?.name || (team === 'HOME' ? `نجم ${match.homeTeamAr}` : `نجم ${match.awayTeamAr}`),
        team,
        rating: 8.6,
        statsSummary: 'Highest passing accuracy & defensive key duels won',
        statsSummaryAr: 'الأعلى تقييماً وصاحب أفضل التمريرات والمراوغات الناجحة',
      };
    }
  }

  return {
    possession: [homePoss, awayPoss],
    shotsTotal: [homeShotsTotal, awayShotsTotal],
    shotsOnTarget: [homeShotsOnTarget, awayShotsOnTarget],
    shotsOffTarget: [homeShotsOffTarget, awayShotsOffTarget],
    blockedShots: [homeBlockedShots, awayBlockedShots],
    xG: [homeXG, awayXG],
    passes: [homePasses, awayPasses],
    passAccuracy: [homePassAcc, awayPassAcc],
    fouls: [homeFouls, awayFouls],
    corners: [homeCorners, awayCorners],
    offsides: [homeOffsides, awayOffsides],
    yellowCards: [homeYellow, awayYellow],
    redCards: [homeRed, awayRed],
    saves: [homeSaves, awaySaves],
    tackles: [homeTackles, awayTackles],
    bigChances: [homeBigChances, awayBigChances],
    manOfTheMatch: motm,
  };
}
