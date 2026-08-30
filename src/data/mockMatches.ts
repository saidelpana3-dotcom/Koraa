import { Match } from '../types';
import { LALIGA_MATCHES } from './matches/laliga';
import { EGYPTIAN_LEAGUE_MATCHES } from './matches/egyptian';
import { PREMIER_LEAGUE_MATCHES } from './matches/epl';
import { SERIE_A_MATCHES } from './matches/serieA';
import { LIGUE1_MATCHES } from './matches/ligue1';
import { OTHER_MATCHES } from './matches/other';

/**
 * Returns all matches extracted precisely from the official fixtures screenshots:
 * - La Liga EA Sports (الدوري الإسباني)
 * - Egyptian Premier League (الدوري المصري الممتاز)
 * - Premier League (الدوري الإنجليزي الممتاز)
 * - Serie A (الدوري الإيطالي)
 * - Ligue 1 (الدوري الفرنسي)
 * - Joan Gamper Trophy (كأس خوان غامبر)
 */
export function getAllCuratedMatches(): Match[] {
  const allMatches: Match[] = [
    ...OTHER_MATCHES,
    ...LALIGA_MATCHES,
    ...EGYPTIAN_LEAGUE_MATCHES,
    ...PREMIER_LEAGUE_MATCHES,
    ...SERIE_A_MATCHES,
    ...LIGUE1_MATCHES,
  ];

  // Sort chronologically by date and kickoff timestamp
  return allMatches.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return (a.kickoffTimeMs || 0) - (b.kickoffTimeMs || 0);
  });
}

export const getCurated48Matches = getAllCuratedMatches;
export const generateInitialMatches = getAllCuratedMatches;
export const INITIAL_MATCHES = getAllCuratedMatches();
