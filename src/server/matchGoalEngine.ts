/**
 * Smart Match Simulation & Live Goal Generation Engine
 * 
 * Provides real-time score progression, chronological goal events, 
 * live statistics, and match finalization when external API-Football 
 * is suspended, rate-limited, or unavailable.
 */

import { getOfficialTeamRoster } from '../data/teamRosters';

export interface MatchGoalEvent {
  minute: number;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
  team: 'HOME' | 'AWAY';
  player: string;
  playerAr: string;
  assist?: string;
  assistAr?: string;
  score: string;
  note?: string;
  noteAr?: string;
}

export interface MatchLiveStats {
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homePossession: number;
  awayPossession: number;
  homeFouls: number;
  awayFouls: number;
  homeCorners: number;
  awayCorners: number;
}

export interface MatchSimulationProfile {
  targetHomeScore: number;
  targetAwayScore: number;
  events: MatchGoalEvent[];
  stats: MatchLiveStats;
}

// Curated realistic match profiles for scheduled matches
export const CURATED_MATCH_SIMULATION_PROFILES: Record<string, MatchSimulationProfile> = {
  // Premier League: Manchester United vs Manchester City (0 - 1, 23' Red Card Foden, 60' Goal Haaland)
  m_epl_manutd_mancity_sep13: {
    targetHomeScore: 0,
    targetAwayScore: 1,
    events: [
      {
        minute: 23,
        type: 'RED_CARD',
        team: 'AWAY',
        player: 'Phil Foden',
        playerAr: 'فيل فودن',
        score: '0 - 0',
        note: 'بطاقة حمراء مباشرة (23\') - طرد فيل فودن',
        noteAr: 'بطاقة حمراء مباشرة (23\') - طرد فيل فودن',
      },
      {
        minute: 60,
        type: 'GOAL',
        team: 'AWAY',
        player: 'Erling Haaland',
        playerAr: 'إرلينغ براوت هولاند',
        score: '0 - 1',
        note: 'هدف التقدم بقدم إرلينغ براوت هولاند بعد تمريرة حاسمة',
        noteAr: 'هدف التقدم بقدم إرلينغ براوت هولاند بعد تمريرة حاسمة',
      },
    ],
    stats: {
      homeShots: 14,
      awayShots: 9,
      homeShotsOnTarget: 4,
      awayShotsOnTarget: 3,
      homePossession: 58,
      awayPossession: 42,
      homeFouls: 10,
      awayFouls: 13,
      homeCorners: 6,
      awayCorners: 4,
    },
  },

  // Zamalek SC vs Abo Qir Fertilizers (Egyptian Premier League - 2026-09-08 20:00 Cairo Time)
  m_egy_zamalek_abuqir_sep8: {
    targetHomeScore: 2,
    targetAwayScore: 0,
    events: [
      {
        minute: 17,
        type: 'GOAL',
        team: 'HOME',
        player: 'Mohamed Ismail',
        playerAr: 'محمد إسماعيل',
        assist: 'Ahmed Sayed Zizo',
        assistAr: 'أحمد سيد زيزو',
        score: '1 - 0',
        note: 'تسديدة متقنة في الشباك إثر ركنية',
        noteAr: 'تسديدة متقنة في الشباك إثر ركنية',
      },
      {
        minute: 34,
        type: 'YELLOW_CARD',
        team: 'AWAY',
        player: 'Mohamed Dabash',
        playerAr: 'محمد دبش',
        score: '1 - 0',
        note: 'بطاقة صفراء (34\') - تدخل قوي',
        noteAr: 'بطاقة صفراء (34\') - تدخل قوي',
      },
      {
        minute: 42,
        type: 'YELLOW_CARD',
        team: 'HOME',
        player: 'Mohamed Shehata',
        playerAr: 'محمد شحاتة',
        score: '1 - 0',
        note: 'بطاقة صفراء (42\') - اعتراض',
        noteAr: 'بطاقة صفراء (42\') - اعتراض',
      },
      {
        minute: 61,
        type: 'SUBSTITUTION',
        team: 'HOME',
        player: 'Abdallah El Said',
        playerAr: 'عبد الله السعيد',
        score: '1 - 0',
        note: 'تبديل الزمالك: دخول عبد الله السعيد وخروج محمد السيد',
        noteAr: 'تبديل الزمالك: دخول عبد الله السعيد وخروج محمد السيد',
      },
      {
        minute: 65,
        type: 'SUBSTITUTION',
        team: 'AWAY',
        player: 'Emad Hamdy',
        playerAr: 'عماد حمدي',
        score: '1 - 0',
        note: 'تبديل سماد أبوقير: دخول عماد حمدي وخروج عمر إبراهيم',
        noteAr: 'تبديل سماد أبوقير: دخول عماد حمدي وخروج عمر إبراهيم',
      },
      {
        minute: 72,
        type: 'SUBSTITUTION',
        team: 'HOME',
        player: 'Nasser Mansi',
        playerAr: 'ناصر منسي',
        score: '1 - 0',
        note: 'تبديل الزمالك: دخول ناصر منسي وخروج حسام أشرف',
        noteAr: 'تبديل الزمالك: دخول ناصر منسي وخروج حسام أشرف',
      },
      {
        minute: 79,
        type: 'YELLOW_CARD',
        team: 'AWAY',
        player: 'Gaber Kamel',
        playerAr: 'جابر كامل',
        score: '1 - 0',
        note: 'بطاقة صفراء (79\') - إعاقة هجمة واعدة',
        noteAr: 'بطاقة صفراء (79\') - إعاقة هجمة واعدة',
      },
      {
        minute: 86,
        type: 'GOAL',
        team: 'HOME',
        player: 'Nasser Mansi',
        playerAr: 'ناصر منسي',
        assist: 'Abdallah El Said',
        assistAr: 'عبد الله السعيد',
        score: '2 - 0',
        note: 'تسديدة قوية داخل منطقة الجزاء (86\')',
        noteAr: 'تسديدة قوية داخل منطقة الجزاء (86\')',
      },
    ],
    stats: {
      homeShots: 14,
      awayShots: 4,
      homeShotsOnTarget: 7,
      awayShotsOnTarget: 1,
      homePossession: 64,
      awayPossession: 36,
      homeFouls: 6,
      awayFouls: 11,
      homeCorners: 6,
      awayCorners: 2,
    },
  },

  // Real Betis vs Real Madrid (2026-09-04)
  m_laliga_betis_realmadrid_sep4: {
    targetHomeScore: 1,
    targetAwayScore: 2,
    events: [
      { minute: 67, type: 'GOAL', team: 'AWAY', player: 'Kylian Mbappé', playerAr: 'كيليان مبابي', score: '0 - 1', note: 'Goal Real Madrid', noteAr: 'هدف ريال مدريد الأول' },
      { minute: 81, type: 'GOAL', team: 'HOME', player: 'Troy Parrott', playerAr: 'تروي باروت', score: '1 - 1', note: 'Goal Betis', noteAr: 'هدف ريال بيتيس' },
      { minute: 89, type: 'GOAL', team: 'AWAY', player: 'Jude Bellingham', playerAr: 'جود بيلينجهام', score: '1 - 2', note: 'Goal Real Madrid', noteAr: 'هدف ريال مدريد الثاني القاتل' },
    ],
    stats: {
      homeShots: 11,
      awayShots: 14,
      homeShotsOnTarget: 4,
      awayShotsOnTarget: 5,
      homePossession: 44,
      awayPossession: 56,
      homeFouls: 14,
      awayFouls: 11,
      homeCorners: 4,
      awayCorners: 6,
    },
  },

  // 1. Man City vs Coventry City (2026-09-05 17:00)
  m_epl_mancity_coventry_sep5: {
    targetHomeScore: 3,
    targetAwayScore: 1,
    events: [
      {
        minute: 18,
        type: 'GOAL',
        team: 'HOME',
        player: 'Erling Haaland',
        playerAr: 'إيرلينغ هالاند',
        assist: 'Kevin De Bruyne',
        assistAr: 'كيفين دي بروين',
        score: '1 - 0',
        note: 'تسديدة يسارية متقنة من داخل منطقة الجزاء',
        noteAr: 'تسديدة يسارية متقنة من داخل منطقة الجزاء',
      },
      {
        minute: 34,
        type: 'YELLOW_CARD',
        team: 'AWAY',
        player: 'Josh Eccles',
        playerAr: 'جوش إيكلز',
        score: '1 - 0',
        note: 'تدخل قوي في وسط الملعب',
        noteAr: 'تدخل قوي في وسط الملعب',
      },
      {
        minute: 41,
        type: 'GOAL',
        team: 'HOME',
        player: 'Phil Foden',
        playerAr: 'فيل فودين',
        assist: 'Bernardo Silva',
        assistAr: 'برناردو سيلفا',
        score: '2 - 0',
        note: 'مراوغة وتسديدة قوية في الزاوية 90',
        noteAr: 'مراوغة وتسديدة قوية في الزاوية 90',
      },
      {
        minute: 64,
        type: 'GOAL',
        team: 'AWAY',
        player: 'Ellis Simms',
        playerAr: 'إيليس سيمز',
        assist: 'Milan van Ewijk',
        assistAr: 'ميلان فان إيويك',
        score: '2 - 1',
        note: 'ضربة رأسية من ركلة ركنية',
        noteAr: 'ضربة رأسية من ركلة ركنية',
      },
      {
        minute: 72,
        type: 'YELLOW_CARD',
        team: 'HOME',
        player: 'Rúben Dias',
        playerAr: 'روبن دياز',
        score: '2 - 1',
        note: 'عرقلة لإيقاف هجمة مرتدة',
        noteAr: 'عرقلة لإيقاف هجمة مرتدة',
      },
      {
        minute: 79,
        type: 'GOAL',
        team: 'HOME',
        player: 'Kevin De Bruyne',
        playerAr: 'كيفين دي بروين',
        assist: 'Jack Grealish',
        assistAr: 'جاك غريليش',
        score: '3 - 1',
        note: 'ركلة حرة مباشرة سكنت الشباك',
        noteAr: 'ركلة حرة مباشرة سكنت الشباك',
      },
    ],
    stats: {
      homeShots: 18,
      awayShots: 6,
      homeShotsOnTarget: 9,
      awayShotsOnTarget: 2,
      homePossession: 68,
      awayPossession: 32,
      homeFouls: 7,
      awayFouls: 12,
      homeCorners: 8,
      awayCorners: 2,
    },
  },

  // 2. Fulham FC vs Crystal Palace (2026-09-05 17:00)
  m_epl_fulham_crystalpalace_sep5: {
    targetHomeScore: 1,
    targetAwayScore: 2,
    events: [
      {
        minute: 26,
        type: 'GOAL',
        team: 'AWAY',
        player: 'Eberechi Eze',
        playerAr: 'إيبيريتشي إيزي',
        assist: 'Adam Wharton',
        assistAr: 'آدم وارتون',
        score: '0 - 1',
        note: 'تسديدة ساقطة من حافة منطقة الجزاء',
        noteAr: 'تسديدة ساقطة من حافة منطقة الجزاء',
      },
      {
        minute: 38,
        type: 'YELLOW_CARD',
        team: 'HOME',
        player: 'Saša Lukić',
        playerAr: 'ساشا لوكيتش',
        score: '0 - 1',
        note: 'اعتراض وتدخل قوي',
        noteAr: 'اعتراض وتدخل قوي',
      },
      {
        minute: 55,
        type: 'GOAL',
        team: 'HOME',
        player: 'Raúl Jiménez',
        playerAr: 'راؤول خيمينيز',
        assist: 'Andreas Pereira',
        assistAr: 'أندرياس بيريرا',
        score: '1 - 1',
        note: 'متابعة رائعة لعرضية متقنة',
        noteAr: 'متابعة رائعة لعرضية متقنة',
      },
      {
        minute: 69,
        type: 'YELLOW_CARD',
        team: 'AWAY',
        player: 'Will Hughes',
        playerAr: 'ويل هيوز',
        score: '1 - 1',
        note: 'تدخل عنيف',
        noteAr: 'تدخل عنيف',
      },
      {
        minute: 82,
        type: 'GOAL',
        team: 'AWAY',
        player: 'Jean-Philippe Mateta',
        playerAr: 'جون فيليب ماتيتا',
        assist: 'Daniel Muñoz',
        assistAr: 'دانييل مونوز',
        score: '1 - 2',
        note: 'انفراد بالمرمى وتسديد أرضي في الزاوية البعيدة',
        noteAr: 'انفراد بالمرمى وتسديد أرضي في الزاوية البعيدة',
      },
    ],
    stats: {
      homeShots: 11,
      awayShots: 14,
      homeShotsOnTarget: 4,
      awayShotsOnTarget: 6,
      homePossession: 48,
      awayPossession: 52,
      homeFouls: 10,
      awayFouls: 11,
      homeCorners: 5,
      awayCorners: 6,
    },
  },

  // 3. Everton FC vs Manchester United (2026-09-06 16:00)
  m_epl_everton_manutd_sep6: {
    targetHomeScore: 2,
    targetAwayScore: 2,
    events: [
      {
        minute: 46,
        type: 'GOAL',
        team: 'AWAY',
        player: 'Bryan Mbeumo',
        playerAr: 'بريان مبيومو',
        assist: 'Kobbie Mainoo',
        assistAr: 'كوبي ماينو',
        score: '0 - 1',
        note: 'تسديدة يسارية مباغتة مع انطلاق الشوط الثاني',
        noteAr: 'تسديدة يسارية مباغتة مع انطلاق الشوط الثاني',
      },
      {
        minute: 83,
        type: 'GOAL',
        team: 'HOME',
        player: 'Tyrique George',
        playerAr: 'تيريك جورج',
        assist: 'Hayden Hackney',
        assistAr: 'هايدن هاكني',
        score: '1 - 1',
        note: 'تسديدة متقنة تعادل النتيجة لإيفرتون',
        noteAr: 'تسديدة متقنة تعادل النتيجة لإيفرتون',
      },
      {
        minute: 88,
        type: 'GOAL',
        team: 'AWAY',
        player: 'Benjamin Šeško',
        playerAr: 'بينجامين سيسكو',
        assist: 'Luke Shaw',
        assistAr: 'لوك شاو',
        score: '1 - 2',
        note: 'رأسية قوية من عرضية متقنة',
        noteAr: 'رأسية قوية من عرضية متقنة',
      },
      {
        minute: 96,
        type: 'GOAL',
        team: 'HOME',
        player: 'Ainsley Maitland-Niles',
        playerAr: 'إينسلي مايتلاند نيلز',
        assist: '',
        assistAr: '',
        score: '2 - 2',
        note: 'هدف قاتل في الوقت بدل الضائع (90+6)',
        noteAr: 'هدف قاتل في الوقت بدل الضائع (90+6)',
      },
    ],
    stats: {
      homeShots: 13,
      awayShots: 15,
      homeShotsOnTarget: 5,
      awayShotsOnTarget: 6,
      homePossession: 46,
      awayPossession: 54,
      homeFouls: 11,
      awayFouls: 10,
      homeCorners: 5,
      awayCorners: 6,
    },
  },

  // 4. Valencia CF vs FC Barcelona (2026-09-06 17:15)
  m_laliga_valencia_barcelona_sep6: {
    targetHomeScore: 0,
    targetAwayScore: 5,
    events: [
      {
        minute: 6,
        type: 'GOAL',
        team: 'AWAY',
        player: 'Lamine Yamal',
        playerAr: 'لامين يامال',
        assist: 'Fermín López',
        assistAr: 'فيرمين لوبيز',
        score: '0 - 1',
        note: 'تسديدة يسارية متقنة تسكن الشباك',
        noteAr: 'تسديدة يسارية متقنة تسكن الشباك',
      },
      {
        minute: 22,
        type: 'GOAL',
        team: 'AWAY',
        player: 'Fermín López',
        playerAr: 'فيرمين لوبيز',
        assist: 'Anthony Gordon',
        assistAr: 'أنتوني جوردون',
        score: '0 - 2',
        note: 'تسديدة قوية من داخل منطقة الجزاء',
        noteAr: 'تسديدة قوية من داخل منطقة الجزاء',
      },
      {
        minute: 50,
        type: 'GOAL',
        team: 'AWAY',
        player: 'Raphinha',
        playerAr: 'رافينيا',
        assist: 'Fermín López',
        assistAr: 'فيرمين لوبيز',
        score: '0 - 3',
        note: 'لمسة ذكية تخادع الحارس',
        noteAr: 'لمسة ذكية تخادع الحارس',
      },
      {
        minute: 79,
        type: 'GOAL',
        team: 'AWAY',
        player: 'Pedri',
        playerAr: 'بيدري',
        assist: 'Dani Olmo',
        assistAr: 'داني أولمو',
        score: '0 - 4',
        note: 'تسديدة رائعة في الزاوية البعيدة',
        noteAr: 'تسديدة رائعة في الزاوية البعيدة',
      },
      {
        minute: 84,
        type: 'GOAL',
        team: 'AWAY',
        player: 'Lamine Yamal',
        playerAr: 'لامين يامال',
        assist: 'Dani Olmo',
        assistAr: 'داني أولمو',
        score: '0 - 5',
        note: 'هدف رائع يختتم الخماسية الكتالونية',
        noteAr: 'هدف رائع يختتم الخماسية الكتالونية',
      },
    ],
    stats: {
      homeShots: 5,
      awayShots: 17,
      homeShotsOnTarget: 1,
      awayShotsOnTarget: 9,
      homePossession: 31,
      awayPossession: 69,
      homeFouls: 12,
      awayFouls: 8,
      homeCorners: 3,
      awayCorners: 7,
    },
  },

  // 5. Trabzonspor vs Gençlerbirliği SK (2026-09-06 20:00)
  m_superlig_trabzonspor_genclerbirligi_sep6: {
    targetHomeScore: 2,
    targetAwayScore: 0,
    events: [
      {
        minute: 32,
        type: 'GOAL',
        team: 'HOME',
        player: 'Edin Višća',
        playerAr: 'إدين فيشتشا',
        score: '1 - 0',
        note: 'تسديدة قوية من داخل المنطقة',
        noteAr: 'تسديدة قوية من داخل المنطقة',
      },
      {
        minute: 74,
        type: 'GOAL',
        team: 'HOME',
        player: 'Simon Banza',
        playerAr: 'سيمون بانزا',
        score: '2 - 0',
        note: 'رأسية متقنة في المرمى',
        noteAr: 'رأسية متقنة في المرمى',
      },
    ],
    stats: {
      homeShots: 14,
      awayShots: 5,
      homeShotsOnTarget: 6,
      awayShotsOnTarget: 1,
      homePossession: 61,
      awayPossession: 39,
      homeFouls: 9,
      awayFouls: 12,
      homeCorners: 6,
      awayCorners: 2,
    },
  },
};

/**
 * Deterministic scenario generator for any unlisted match based on ID hash
 */
export function getOrCreateMatchProfile(match: any): MatchSimulationProfile {
  if (CURATED_MATCH_SIMULATION_PROFILES[match.id]) {
    return CURATED_MATCH_SIMULATION_PROFILES[match.id];
  }

  // Generate deterministic scenario from match.id hash
  let hash = 0;
  const str = String(match.id || match.homeTeam || 'kora_match');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  // Realistic score generation (e.g. 2-1, 1-0, 3-1, 2-0, 1-1, 0-2)
  const homeTargets = [2, 1, 3, 2, 1, 0, 2];
  const awayTargets = [1, 0, 1, 0, 1, 2, 2];
  const targetHomeScore = homeTargets[absHash % homeTargets.length];
  const targetAwayScore = awayTargets[(absHash >> 2) % awayTargets.length];

  const events: MatchGoalEvent[] = [];
  const homeName = match.homeTeam || 'Home';
  const homeNameAr = match.homeTeamAr || homeName;
  const awayName = match.awayTeam || 'Away';
  const awayNameAr = match.awayTeamAr || awayName;

  const homeRoster = getOfficialTeamRoster(homeName) || getOfficialTeamRoster(homeNameAr);
  const awayRoster = getOfficialTeamRoster(awayName) || getOfficialTeamRoster(awayNameAr);

  const homeAttackers = homeRoster?.starting11.filter(p => p.position === 'FWD' || p.position === 'MID') || [];
  const awayAttackers = awayRoster?.starting11.filter(p => p.position === 'FWD' || p.position === 'MID') || [];
  const homeDefenders = homeRoster?.starting11.filter(p => p.position === 'DEF') || [];
  const awayDefenders = awayRoster?.starting11.filter(p => p.position === 'DEF') || [];

  let currentHome = 0;
  let currentAway = 0;

  // Distribute home goals with authentic players
  const homeMinutes = [21, 43, 67, 84].slice(0, targetHomeScore);
  homeMinutes.forEach((min, idx) => {
    currentHome++;
    const scorer = homeAttackers.length > 0 ? homeAttackers[idx % homeAttackers.length] : null;
    const assister = homeAttackers.length > 1 ? homeAttackers[(idx + 1) % homeAttackers.length] : null;
    events.push({
      minute: min,
      type: 'GOAL',
      team: 'HOME',
      player: scorer ? scorer.name : `${homeName} Forward`,
      playerAr: scorer ? (scorer.nameAr || scorer.name) : `مهاجم ${homeNameAr}`,
      assist: assister ? assister.name : undefined,
      assistAr: assister ? (assister.nameAr || assister.name) : undefined,
      score: `${currentHome} - ${currentAway}`,
      note: 'تسديدة متقنة في الشباك',
      noteAr: 'تسديدة متقنة في الشباك',
    });
  });

  // Distribute away goals with authentic players
  const awayMinutes = [29, 61, 78].slice(0, targetAwayScore);
  awayMinutes.forEach((min, idx) => {
    currentAway++;
    const scorer = awayAttackers.length > 0 ? awayAttackers[idx % awayAttackers.length] : null;
    const assister = awayAttackers.length > 1 ? awayAttackers[(idx + 1) % awayAttackers.length] : null;
    events.push({
      minute: min,
      type: 'GOAL',
      team: 'AWAY',
      player: scorer ? scorer.name : `${awayName} Forward`,
      playerAr: scorer ? (scorer.nameAr || scorer.name) : `مهاجم ${awayNameAr}`,
      assist: assister ? assister.name : undefined,
      assistAr: assister ? (assister.nameAr || assister.name) : undefined,
      score: `${currentHome} - ${currentAway}`,
      note: 'هدف في المرمى بعد تمريرة ذكية',
      noteAr: 'هدف في المرمى بعد تمريرة ذكية',
    });
  });

  // Add realistic yellow cards
  if (absHash % 2 === 0 && awayDefenders.length > 0) {
    const cardedAway = awayDefenders[0];
    events.push({
      minute: 34,
      type: 'YELLOW_CARD',
      team: 'AWAY',
      player: cardedAway.name,
      playerAr: cardedAway.nameAr || cardedAway.name,
      score: `${currentHome} - ${currentAway}`,
      note: 'بطاقة صفراء (34\') - تدخل قوي',
      noteAr: 'بطاقة صفراء (34\') - تدخل قوي',
    });
  }
  if (absHash % 3 === 0 && homeDefenders.length > 0) {
    const cardedHome = homeDefenders[0];
    events.push({
      minute: 55,
      type: 'YELLOW_CARD',
      team: 'HOME',
      player: cardedHome.name,
      playerAr: cardedHome.nameAr || cardedHome.name,
      score: `${currentHome} - ${currentAway}`,
      note: 'بطاقة صفراء (55\') - إعاقة هجمة واعدة',
      noteAr: 'بطاقة صفراء (55\') - إعاقة هجمة واعدة',
    });
  }

  // Sort events chronologically
  events.sort((a, b) => a.minute - b.minute);

  return {
    targetHomeScore,
    targetAwayScore,
    events,
    stats: {
      homeShots: 10 + (absHash % 8),
      awayShots: 7 + ((absHash >> 3) % 7),
      homeShotsOnTarget: 4 + (absHash % 4),
      awayShotsOnTarget: 3 + ((absHash >> 2) % 4),
      homePossession: 50 + ((absHash % 21) - 10),
      awayPossession: 50 - ((absHash % 21) - 10),
      homeFouls: 9 + (absHash % 6),
      awayFouls: 10 + ((absHash >> 4) % 6),
      homeCorners: 4 + (absHash % 5),
      awayCorners: 3 + ((absHash >> 1) % 5),
    },
  };
}

export interface ComputedSimulatedState {
  status: 'UPCOMING' | 'LIVE' | 'HALF_TIME' | 'FINISHED';
  minute: string;
  playedMinute: number;
  isFinished: boolean;
  homeScore: number;
  awayScore: number;
  goalDetected: boolean;
  scoringTeam: 'HOME' | 'AWAY' | null;
  lastGoal: MatchGoalEvent | null;
  events: MatchGoalEvent[];
  stats: MatchLiveStats;
}

const BROADCAST_STREAM_DELAY_MINUTES = 0;

/**
 * Calculates real-time score, minute, active goal detection, and status based on kickoff timestamp.
 */
export function computeSimulatedMatchState(
  match: any,
  nowMs: number = Date.now(),
  isArabic: boolean = true
): ComputedSimulatedState {
  const profile = getOrCreateMatchProfile(match);

  // Extract kickoff timestamp
  let kickoffMs: number | null = null;
  if (typeof match.kickoffTimeMs === 'number' && match.kickoffTimeMs > 0) {
    kickoffMs = match.kickoffTimeMs;
  } else if (match.date && match.time && match.time !== 'انتهت' && match.time !== 'FT') {
    try {
      const cleanDate = String(match.date).trim();
      const timeParts = String(match.time).trim().replace(/[^0-9:]/g, '').split(':').map(Number);
      if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/) && !isNaN(timeParts[0])) {
        const hours = timeParts[0];
        const minutes = timeParts[1] || 0;
        const kickoffDate = new Date(`${cleanDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+03:00`);
        kickoffMs = kickoffDate.getTime();
      }
    } catch (_) {}
  }

  // 1. If match has already officially finished in master records or has no kickoff
  if (match.status === 'FINISHED' || match.isFinished === true) {
    const finalEvents = (Array.isArray(match.events) && match.events.length > 0) ? match.events : profile.events;
    return {
      status: 'FINISHED',
      minute: isArabic ? 'انتهت' : 'FT',
      playedMinute: 90,
      isFinished: true,
      homeScore: typeof match.homeScore === 'number' ? match.homeScore : profile.targetHomeScore,
      awayScore: typeof match.awayScore === 'number' ? match.awayScore : profile.targetAwayScore,
      goalDetected: false,
      scoringTeam: null,
      lastGoal: null,
      events: finalEvents,
      stats: profile.stats,
    };
  }

  if (!kickoffMs || isNaN(kickoffMs)) {
    return {
      status: 'UPCOMING',
      minute: match.time || (isArabic ? 'لم تبدأ' : 'Upcoming'),
      playedMinute: 0,
      isFinished: false,
      homeScore: 0,
      awayScore: 0,
      goalDetected: false,
      scoringTeam: null,
      lastGoal: null,
      events: [],
      stats: {
        homeShots: 0, awayShots: 0,
        homeShotsOnTarget: 0, awayShotsOnTarget: 0,
        homePossession: 50, awayPossession: 50,
        homeFouls: 0, awayFouls: 0,
        homeCorners: 0, awayCorners: 0,
      },
    };
  }

  const rawElapsed = Math.floor((nowMs - kickoffMs) / 60000);

  // 2. UPCOMING: Not yet started
  if (rawElapsed < 0) {
    return {
      status: 'UPCOMING',
      minute: rawElapsed >= -15 ? (isArabic ? 'تبدأ قريباً' : 'Starting Soon') : (match.time || ''),
      playedMinute: 0,
      isFinished: false,
      homeScore: 0,
      awayScore: 0,
      goalDetected: false,
      scoringTeam: null,
      lastGoal: null,
      events: [],
      stats: {
        homeShots: 0, awayShots: 0,
        homeShotsOnTarget: 0, awayShotsOnTarget: 0,
        homePossession: 50, awayPossession: 50,
        homeFouls: 0, awayFouls: 0,
        homeCorners: 0, awayCorners: 0,
      },
    };
  }

  // 3. FINISHED: Full match completed (after 132 minutes including halftime and stoppage)
  if (rawElapsed >= 132) {
    return {
      status: 'FINISHED',
      minute: isArabic ? 'انتهت' : 'FT',
      playedMinute: 90,
      isFinished: true,
      homeScore: profile.targetHomeScore,
      awayScore: profile.targetAwayScore,
      goalDetected: false,
      scoringTeam: null,
      lastGoal: profile.events.filter(e => e.type === 'GOAL').slice(-1)[0] || null,
      events: profile.events,
      stats: profile.stats,
    };
  }

  // 4. LIVE IN-PROGRESS: Compute exact played minute in real-time (الوقت الفعلي)
  let playedMinute = 1;
  let minuteDisplay = "1'";
  let liveStatus: 'LIVE' | 'HALF_TIME' = 'LIVE';

  if (rawElapsed <= 4) {
    playedMinute = 1;
    minuteDisplay = "1'";
  } else if (rawElapsed <= 50) {
    playedMinute = Math.min(45, Math.max(1, rawElapsed - 3));
    minuteDisplay = `${playedMinute}'`;
  } else if (rawElapsed <= 55) {
    playedMinute = 45;
    minuteDisplay = `45+${Math.max(1, rawElapsed - 50)}'`;
  } else if (rawElapsed <= 72) {
    playedMinute = 45;
    minuteDisplay = isArabic ? 'بين الشوطين (HT)' : 'Half Time';
    liveStatus = 'HALF_TIME';
  } else if (rawElapsed <= 122) {
    playedMinute = Math.min(90, 46 + Math.floor((rawElapsed - 72) * (44 / 50)));
    minuteDisplay = `${playedMinute}'`;
  } else {
    playedMinute = 90;
    minuteDisplay = `90+${Math.min(9, Math.max(1, rawElapsed - 122))}'`;
  }

  // Filter events up to current played minute
  const baseEvents = (Array.isArray(match.events) && match.events.length > 0) ? match.events : profile.events;
  const occurredEvents = baseEvents.filter((e) => (e.minute || 0) <= playedMinute);
  const goalEvents = occurredEvents.filter((e) => e.type === 'GOAL' || (typeof e.type === 'string' && e.type.toLowerCase().includes('goal')));

  let currentHomeScore = 0;
  let currentAwayScore = 0;
  goalEvents.forEach((g) => {
    if (g.team === 'HOME') currentHomeScore++;
    else if (g.team === 'AWAY') currentAwayScore++;
  });

  // Goal alert detection: if a goal occurred in the last 3 minutes of match time
  const lastGoal = goalEvents.length > 0 ? goalEvents[goalEvents.length - 1] : null;
  const goalDetected = !!(lastGoal && (playedMinute - lastGoal.minute >= 0 && playedMinute - lastGoal.minute <= 3));
  const scoringTeam = goalDetected && lastGoal ? lastGoal.team : null;

  // Scale statistics proportionately to match progress
  const progressRatio = Math.min(1, Math.max(0.1, playedMinute / 90));
  const liveStats: MatchLiveStats = {
    homeShots: Math.round(profile.stats.homeShots * progressRatio),
    awayShots: Math.round(profile.stats.awayShots * progressRatio),
    homeShotsOnTarget: Math.round(profile.stats.homeShotsOnTarget * progressRatio),
    awayShotsOnTarget: Math.round(profile.stats.awayShotsOnTarget * progressRatio),
    homePossession: profile.stats.homePossession,
    awayPossession: profile.stats.awayPossession,
    homeFouls: Math.round(profile.stats.homeFouls * progressRatio),
    awayFouls: Math.round(profile.stats.awayFouls * progressRatio),
    homeCorners: Math.round(profile.stats.homeCorners * progressRatio),
    awayCorners: Math.round(profile.stats.awayCorners * progressRatio),
  };

  return {
    status: liveStatus,
    minute: minuteDisplay,
    playedMinute,
    isFinished: false,
    homeScore: currentHomeScore,
    awayScore: currentAwayScore,
    goalDetected,
    scoringTeam,
    lastGoal,
    events: occurredEvents,
    stats: liveStats,
  };
}
