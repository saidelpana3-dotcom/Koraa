export type Language = 'en' | 'ar';
export type ThemeMode = 'light' | 'dark';

export type MatchStatus = 'LIVE' | 'FINISHED' | 'UPCOMING' | 'HALF_TIME';

export interface Player {
  id: string;
  number: number;
  name: string;
  nameAr: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  rating?: number;
  goals?: number;
  assists?: number;
  yellowCard?: boolean;
  redCard?: boolean;
  subbedOut?: boolean;
  gridPos?: { x: number; y: number }; // Percentage on pitch (0-100)
}

export interface Lineup {
  formation: string;
  coach: string;
  coachAr: string;
  starting11: Player[];
  substitutes: Player[];
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'VAR' | 'PENALTY' | 'PENALTY_GOAL' | 'OWN_GOAL';
  team: 'HOME' | 'AWAY' | 'home' | 'away';
  playerName?: string;
  playerNameAr?: string;
  player?: string;
  playerAr?: string;
  assist?: string;
  assistAr?: string;
  score?: string;
  detail?: string;
  detailAr?: string;
}

export interface MatchStats {
  possession: [number, number]; // [Home%, Away%]
  shotsTotal: [number, number];
  shotsOnTarget: [number, number];
  shotsOffTarget?: [number, number];
  blockedShots?: [number, number];
  xG: [number, number];
  passes?: [number, number];
  passAccuracy: [number, number];
  fouls: [number, number];
  corners: [number, number];
  offsides: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  saves?: [number, number];
  tackles?: [number, number];
  bigChances?: [number, number];
  manOfTheMatch?: {
    name: string;
    nameAr: string;
    team: 'HOME' | 'AWAY';
    rating: number;
    statsSummary?: string;
    statsSummaryAr?: string;
  };
}

export interface QuickOption {
  id: string;
  label: string;
  labelAr: string;
  icon?: string;
  predictedHomeScore?: number;
  predictedAwayScore?: number;
}

export interface Match {
  id: string;
  leagueId: string;
  leagueName: string;
  leagueNameAr: string;
  leagueIcon?: string;
  homeTeam: string;
  homeTeamAr: string;
  homeLogo: string;
  homeColor: string;
  awayTeam: string;
  awayTeamAr: string;
  awayLogo: string;
  awayColor: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  minute?: number | string;
  date: string; // ISO string or format YYYY-MM-DD
  dateAr?: string; // Arabic display date e.g. "الأربعاء، ١٩ أغسطس"
  dayOffset?: number; // Relative day offset (0 = today, 1 = tomorrow, 2 = day after, -1 = yesterday)
  time: string; // e.g., "21:00"
  kickoffTimeMs?: number; // Epoch timestamp for automated live status handling
  venue: string;
  venueAr: string;
  referee?: string;
  refereeAr?: string;
  homeLineup?: Lineup;
  awayLineup?: Lineup;
  events: MatchEvent[];
  stats: MatchStats;
  prediction: {
    homeVotes: number;
    drawVotes: number;
    awayVotes: number;
  };
  quickOptions?: QuickOption[];
  isGoogleSynced?: boolean;
  isPredictionClosed?: boolean;
  isFinished?: boolean;
  lastSyncedAt?: string;
  pointsDistributed?: boolean;
  customCoinsReward?: number;
  isTournamentMatch?: boolean;
}

export interface League {
  id: string;
  name: string;
  nameAr: string;
  country: string;
  countryAr: string;
  flag: string;
  badge: string;
}

export interface StandingRow {
  rank: number;
  teamName: string;
  teamNameAr: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface TopScorer {
  rank: number;
  playerName: string;
  playerNameAr: string;
  teamName: string;
  teamNameAr: string;
  teamLogo: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
  xG: number;
  photo: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  titleAr: string;
  summary: string;
  summaryAr: string;
  category: 'Transfers' | 'Champions League' | 'Tactics' | 'International' | 'Local';
  categoryAr: 'انتقالات' | 'دوري الأبطال' | 'تكتيك' | 'دولي' | 'محلية';
  imageUrl: string;
  date: string;
  readTime: string;
  fullContent?: string;
  fullContentAr?: string;
  isFeatured?: boolean;
}

export interface PredictionItem {
  id: string;
  userId: string;
  userDisplayName: string;
  matchId: string;
  matchHomeTeam: string;
  matchHomeTeamAr: string;
  matchAwayTeam: string;
  matchAwayTeamAr: string;
  matchHomeLogo?: string;
  matchAwayLogo?: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  matchHomeScore?: number;
  matchAwayScore?: number;
  status: 'PENDING' | 'EXACT_SCORE' | 'CORRECT_OUTCOME' | 'MISSED';
  pointsEarned: number;
  coinsEarned?: number;
  correctPredictionsCount?: number;
  evaluatedAt?: string;
  createdAt: string;
}

export interface Prize {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  pointsCost: number;
  originalPointsCost?: number;
  isOffer?: boolean;
  badgeLabel?: string;
  badgeLabelAr?: string;
  category: 'Gadgets' | 'Jerseys' | 'Tickets' | 'Cards' | 'Cash';
  categoryAr: 'إلكترونيات' | 'قمصان أندية' | 'تذاكر مباريات' | 'بطاقات هدايا' | 'كاش إنستاباي' | 'تحويل بنكي';
  image: string;
  stock: number;
  claimedCount: number;
}

export interface PrizeClaim {
  id: string;
  userId: string;
  userDisplayName?: string;
  prizeId: string;
  prizeTitle: string;
  prizeTitleAr?: string;
  pointsSpent: number;
  status: 'PENDING' | 'APPROVED' | 'SHIPPED' | string;
  statusAr?: string;
  shippingAddress?: string;
  phoneNumber?: string;
  claimedAt: string;
}

export interface LeaderboardUser {
  id: string;
  displayName: string;
  photoURL?: string;
  points: number;
  coins?: number;
  exactPredictions: number;
  correctPredictionsCount?: number;
  correctOutcomes: number;
  totalPredictions: number;
  rankBadge: string;
  rank?: number;
}

export interface MatchSubscription {
  id: string; // e.g., `${userId}_${matchId}`
  userId: string;
  matchId: string;
  homeTeam: string;
  homeTeamAr: string;
  awayTeam: string;
  awayTeamAr: string;
  notifyGoals: boolean;
  notifyStart: boolean;
  notifyRedCards: boolean;
  notifySmartReminder?: boolean;
  reminderIntervalMinutes?: number; // e.g., 15, 30, 45, 60, 120
  fcmToken?: string;
  createdAt: string;
}

export interface TournamentPrizeTier {
  rank: string; // '1st' | '2nd' | '3rd' | 'top10' | 'champion';
  rankLabel: string;
  rankLabelAr: string;
  prizeTitle: string;
  prizeTitleAr: string;
  cashAmount?: string; // e.g. "5,000 ج.م كاش إنستاباي"
  coinsReward?: number; // e.g. 100000
  icon?: string;
  badgeColor?: string;
}

export interface FeaturedTournament {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  tagline?: string;
  taglineAr?: string;
  badgeIcon: string;
  bannerGradient: string; // CSS gradient classes
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  startDate: string;
  endDate: string;
  matchIds: string[]; // List of specific match IDs included in this tournament
  prizes: TournamentPrizeTier[];
  totalPrizePool: string;
  totalPrizePoolAr: string;
  entryFeePoints?: number; // 0 for free entry
  rulesAr?: string[];
  rulesEn?: string[];
  isActive?: boolean;
  participantsCount?: number;
}

export interface PushNotificationLog {
  id: string;
  userId?: string;
  matchId: string;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  type: 'SMART_REMINDER' | 'NEW_FEATURED_MATCH' | 'PRE_MATCH_DAY_BEFORE' | 'MATCH_DAY_MORNING' | 'PRE_MATCH_COUNTDOWN' | 'GOAL' | 'MATCH_START' | 'RED_CARD' | 'HALF_TIME' | 'FULL_TIME';
  homeTeam?: string;
  homeTeamAr?: string;
  awayTeam?: string;
  awayTeamAr?: string;
  homeLogo?: string;
  awayLogo?: string;
  ctaText?: string;
  ctaTextAr?: string;
  reminderMinutes?: number;
  timestamp: string;
  read?: boolean;
}

