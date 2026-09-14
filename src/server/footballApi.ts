/**
 * API-Football (v3.football.api-sports.io) Server-Side Integration Engine
 * Provides live score synchronization, elapsed match time, live stats, 
 * lineups, and events auto-refreshed every 5 minutes.
 */

import { GoogleGenAI } from "@google/genai";

export function getApiFootballKey(): string {
  return process.env.API_FOOTBALL_KEY || process.env.FOOTBALL_API_KEY || "9698875b9d7c25d77a05dab1e636da8a";
}
const API_SPORTS_BASE = "https://v3.football.api-sports.io";
const RAPIDAPI_BASE = "https://api-football-v1.p.rapidapi.com/v3";

interface ApiFootballFixture {
  fixture: {
    id: number;
    referee?: string;
    date: string;
    timestamp: number;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
      extra?: number | null;
    };
    venue?: {
      name?: string;
      city?: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    round?: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner?: boolean | null };
    away: { id: number; name: string; logo: string; winner?: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score?: {
    halftime?: { home: number | null; away: number | null };
    fulltime?: { home: number | null; away: number | null };
  };
  events?: any[];
  lineups?: any[];
  statistics?: any[];
}

// In-Memory Caches with 5-Minute Quota-Protection TTLs
let cachedLiveFixtures: { data: ApiFootballFixture[]; timestamp: number } | null = null;
let cachedDateFixtures: Record<string, { data: ApiFootballFixture[]; timestamp: number }> = {};
const fixtureDetailsCache: Record<string, { data: any; timestamp: number }> = {};

// Cache durations calibrated to preserve the 100 daily requests free quota
const LIVE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for live fixtures (300 seconds)
const DATE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes for daily fixtures list
const DETAILS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes for match details, stats & lineups

// Quota / Rate-limit backoff flag to avoid error spamming when daily API limit is reached
let quotaExhaustedUntil: number = 0;

export interface ApiFootballDiagnosticInfo {
  connected: boolean;
  status: 'active' | 'suspended' | 'quota_exhausted' | 'unsubscribed' | 'error' | 'not_configured';
  message: string;
  lastChecked: string;
  liveFixturesCount: number;
}

export let apiFootballDiagnostic: ApiFootballDiagnosticInfo = {
  connected: false,
  status: 'not_configured',
  message: 'Checking API status...',
  lastChecked: new Date().toISOString(),
  liveFixturesCount: 0,
};

/**
 * Fetch from API-Football with dual endpoint fallback (API-Sports -> RapidAPI)
 */
export async function fetchFromApiFootball(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  // If we know daily quota is exhausted, seamlessly fallback to internal state without network error spam
  if (Date.now() < quotaExhaustedUntil) {
    return null;
  }

  const queryStr = new URLSearchParams(params).toString();
  const urlPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullQuery = queryStr ? `${urlPath}?${queryStr}` : urlPath;

  const currentKey = getApiFootballKey();

  // Try direct API-Sports first
  try {
    const res = await fetch(`${API_SPORTS_BASE}${fullQuery}`, {
      headers: {
        'x-apisports-key': currentKey,
        'Accept': 'application/json',
      },
    });

    if (res.status === 429) {
      quotaExhaustedUntil = Date.now() + 10 * 60 * 1000;
      apiFootballDiagnostic = {
        connected: false,
        status: 'quota_exhausted',
        message: 'Rate limit / Daily quota reached on API-Sports (HTTP 429)',
        lastChecked: new Date().toISOString(),
        liveFixturesCount: 0,
      };
      return null;
    }

    if (res.ok) {
      const json = await res.json();
      const hasErrors = json?.errors && (
        (Array.isArray(json.errors) && json.errors.length > 0) ||
        (typeof json.errors === 'object' && Object.keys(json.errors).length > 0)
      );

      if (json && !hasErrors) {
        apiFootballDiagnostic = {
          connected: true,
          status: 'active',
          message: 'Connected successfully to API-Sports',
          lastChecked: new Date().toISOString(),
          liveFixturesCount: Array.isArray(json?.response) ? json.response.length : 0,
        };
        return json;
      }

      // Check if error is due to account suspension or quota
      const errStr = JSON.stringify(json?.errors || '');
      if (errStr.includes('suspended') || errStr.includes('Account is suspended')) {
        apiFootballDiagnostic = {
          connected: false,
          status: 'suspended',
          message: 'حساب API-Football معلّق (Your account is suspended - check dashboard.api-football.com)',
          lastChecked: new Date().toISOString(),
          liveFixturesCount: 0,
        };
        return null;
      }
      if (errStr.includes('request limit') || errStr.includes('requests') || errStr.includes('quota') || errStr.includes('Too Many Requests')) {
        quotaExhaustedUntil = Date.now() + 15 * 60 * 1000; // Backoff for 15 mins
        apiFootballDiagnostic = {
          connected: false,
          status: 'quota_exhausted',
          message: 'تم استهلاك الحد اليومي للطلبات على API-Football',
          lastChecked: new Date().toISOString(),
          liveFixturesCount: 0,
        };
        return null;
      }
    }
  } catch (_err) {
    // Silent catch for direct endpoint
  }

  // Try RapidAPI mirror endpoint if quota not blocked
  if (Date.now() < quotaExhaustedUntil) {
    return null;
  }

  try {
    const res = await fetch(`${RAPIDAPI_BASE}${fullQuery}`, {
      headers: {
        'x-rapidapi-key': currentKey,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const json = await res.json();
      if (json && (!json.errors || (Array.isArray(json.errors) && json.errors.length === 0) || Object.keys(json.errors).length === 0)) {
        if (!json.message || !json.message.includes('not subscribed')) {
          apiFootballDiagnostic = {
            connected: true,
            status: 'active',
            message: 'Connected via RapidAPI mirror',
            lastChecked: new Date().toISOString(),
            liveFixturesCount: Array.isArray(json?.response) ? json.response.length : 0,
          };
          return json;
        }
      }
      if (json?.message && json.message.includes('not subscribed')) {
        apiFootballDiagnostic = {
          connected: false,
          status: 'unsubscribed',
          message: 'المفتاح غير مشترك في باقة API-Football على RapidAPI',
          lastChecked: new Date().toISOString(),
          liveFixturesCount: 0,
        };
      }
    }
  } catch (_err) {
    // Silent catch for RapidAPI mirror
  }

  return null;
}

/**
 * Normalizes team names for fuzzy matching between Kora mock matches and API-Football
 */
export function normalizeName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s\-_.'’]/g, "")
    .replace(/fc|cf|sc|ac|club|de|el|al|the/g, "")
    .trim();
}

/**
 * Comprehensive Team Aliases Map (English & Arabic)
 */
const TEAM_ALIASES: Record<string, string[]> = {
  // English Premier League
  "mancity": ["manchestercity", "man city", "السيتي", "مانشستر سيتي", "مان سيتي"],
  "manunited": ["manchesterunited", "man utd", "اليونايتد", "مانشستر يونايتد", "مان يونايتد"],
  "arsenal": ["arsenal", "ارسنال", "الارسنال", "آرسنال", "المدفعجية"],
  "liverpool": ["liverpool", "ليفربول", "الريدز", "الليفربول"],
  "chelsea": ["chelsea", "تشيلسي", "البلوز"],
  "tottenham": ["tottenham", "spurs", "توتنهام", "السبيرز", "توتنهام هوتسبير"],
  "astonvilla": ["aston villa", "استون فيلا", "أستون فيلا", "الفيلانز"],
  "newcastle": ["newcastle", "نيوكاسل", "نيوكاسل يونايتد"],
  "fulham": ["fulham", "فولهام"],
  "crystalpalace": ["crystal palace", "كريستال بالاس"],
  "brighton": ["brighton", "برايتون", "برايتون اند هوف البيون"],
  "everton": ["everton", "ايفرتون", "إيفرتون"],
  "westham": ["west ham", "وست هام", "وست هام يونايتد"],
  "wolves": ["wolverhampton", "wolves", "وولفرهامبتون", "الذئاب"],
  "bournemouth": ["bournemouth", "بورنموث"],
  "brentford": ["brentford", "برينتفورد"],
  "nottingham": ["nottingham forest", "نوتنغهام", "نوتينجهام فورست"],
  "leicester": ["leicester city", "ليستر سيتي", "ليستر"],
  "southampton": ["southampton", "ساوثهامبتون"],
  "ipswich": ["ipswich town", "إيبسويتش", "ايبسويتش تاون"],

  // La Liga
  "realmadrid": ["real madrid", "ريال مدريد", "الريال", "الملكي"],
  "barcelona": ["barcelona", "برشلونة", "البارسا", "برشلونه"],
  "atletico": ["atletico madrid", "اتلتيكو مدريد", "أتلتيكو مدريد", "الاتلتي"],
  "athletic": ["athletic club", "athletic bilbao", "اتلتيك بيلباو", "أتلتيك بيلباو", "بيلباو"],
  "sociedad": ["real sociedad", "ريال سوسيداد", "سوسيداد"],
  "betis": ["real betis", "ريال بيتيس", "بيتيس"],
  "villarreal": ["villarreal", "فياريال", "الغواصات الصفراء"],
  "sevilla": ["sevilla", "اشبيلية", "إشبيلية"],
  "valencia": ["valencia", "فالنسيا", "الخفافيش"],
  "celta": ["celta vigo", "سلتا فيغو", "سيلتا فيغو", "سلتا"],
  "girona": ["girona", "جيرونا"],
  "osasuna": ["osasuna", "اوساسونا", "أوساسونا"],
  "getafe": ["getafe", "خيتافي"],
  "espanyol": ["espanyol", "اسبانيول", "إسبانيول"],
  "mallorca": ["mallorca", "مايوركا", "ريال مايوركا"],
  "rayo": ["rayo vallecano", "رايو فاليكانو", "رايو"],
  "laspalmas": ["las palmas", "لاس بالماس"],
  "leganes": ["leganes", "ليغانيس", "ليجانيس"],
  "alaves": ["alaves", "ديبورتيفو الافيس", "ألافيس"],
  "valladolid": ["real valladolid", "بلد الوليد", "ريال بلد الوليد"],

  // Champions League & European Giants
  "bayern": ["bayern munich", "بايرن ميونخ", "البايرن", "بايرن"],
  "dortmund": ["borussia dortmund", "بوروسيا دورتموند", "دورتموند"],
  "leverkusen": ["bayer leverkusen", "باير ليفركوزن", "ليفركوزن"],
  "psg": ["paris saint germain", "باريس سان جيرمان", "باريس", "بي اس جي"],
  "inter": ["inter milan", "انتر ميلان", "إنتر ميلان", "الانتر"],
  "milan": ["ac milan", "ميلان", "أي سي ميلان", "الروسونيري"],
  "juventus": ["juventus", "يوفنتوس", "اليوفي", "السيدة العجوز"],
  "atalanta": ["atalanta", "اتالانتا", "أتالانتا"],
  "napoli": ["napoli", "نابولي"],
  "monaco": ["monaco", "موناكو"],
  "lille": ["lille", "ليل"],
  "marseille": ["marseille", "مارسيليا", "أولمبيك مارسيليا"],
  "benfica": ["benfica", "بنفيكا"],
  "sporting": ["sporting cp", "سبورتينغ لشبونة", "سبورتنج لشبونة"],
  "porto": ["porto", "بورتو"],
  "ajax": ["ajax", "اياكس", "أياكس أمستردام"],

  // Egyptian League
  "ahly": ["al ahly", "الاهلي", "الأهلي", "المارد الاحمر", "الاهلي المصري"],
  "zamalek": ["zamalek", "الزمالك", "الفارس الابيض", "نادي الزمالك"],
  "pyramids": ["pyramids", "بيراميدز", "نادي بيراميدز"],
  "masry": ["al masry", "المصري", "المصري البورسعيدي"],
  "smouha": ["smouha", "سموحة"],
  "cleopatra": ["ceramica cleopatra", "سيراميكا كليوباترا", "سيراميكا"],
  "ismailia": ["ismailia", "ismaily", "الاسماعيلي", "الإسماعيلي", "الدراويش"],
  "ittihad_alex": ["al ittihad", "الاتحاد السكندري", "سيد البلد"],
  "enppi": ["enppi", "انبي", "إنبي"],
  "modern": ["modern sport", "future", "مودرن سبورت", "فيوتشر"],
  "zed": ["zed", "زد", "زد اف سي"],
  "bank_ahly": ["national bank", "البنك الاهلي", "البنك الأهلي"],
  "mahalla": ["ghazl el mahalla", "غزل المحلة"],
  "hodoud": ["haras el hodoud", "حرس الحدود"],
  "petrojet": ["petrojet", "بتروجيت"],
  "talaea": ["tala'ea el gaish", "طلائع الجيش"],

  // Saudi Pro League
  "hilal": ["al hilal", "الهلال", "الزعيم", "الهلال السعودي"],
  "nassr": ["al nassr", "النصر", "العالمي", "النصر السعودي"],
  "ittihad_ksa": ["al ittihad", "الاتحاد", "العميد", "الاتحاد السعودي"],
  "ahli_ksa": ["al ahli", "الاهلي السعودي", "الأهلي السعودي", "الراقي"],
  "shabab_ksa": ["al shabab", "الشباب", "الليث"],
  "ettifaq": ["al ettifaq", "الاتفاق"],
  "taawoun": ["al taawoun", "التعاون", "سكري القصيم"],
  "qadsiah": ["al qadsiah", "القادسية"],
  "fateh": ["al fateh", "الفتح"],
  "damac": ["damac", "ضمك"],
  "riyadh": ["al riyadh", "الرياض"],
  "kholood": ["al kholood", "الخلود"],
  "orubah": ["al orubah", "العروبة"],
  "raed": ["al raed", "الرائد"],
  "wehda_ksa": ["al wehda", "الوحدة"],

  // Turkish Super Lig & Cup
  "trabzonspor": ["trabzonspor", "طرابزون", "طرابزون سبور", "ترابزون"],
  "genclerbirligi": ["genclerbirligi", "غنتشليربيرليغي", "جينتشليربيرليجي", "جينكليربيرليجي"],
  "galatasaray": ["galatasaray", "غلطة سراي", "غالاطا سراي"],
  "fenerbahce": ["fenerbahce", "فنربخشة", "فنربخشه"],
  "besiktas": ["besiktas", "بشكتاش", "بيشكتاش"],

  // French Ligue 1 & 2
  "rennes": ["rennes", "stade rennais", "رين", "ستاد رين"],
  "brest": ["brest", "stade brestois", "بريست", "ستاد بريست"],
  "strasbourg": ["strasbourg", "ستراسبورغ", "ستراسبورج"],
  "auxerre": ["auxerre", "اوكسير", "أوكسير"],
  "lyon": ["lyon", "olympique lyonnais", "ليون", "أولمبيك ليون"],
  "lorient": ["lorient", "لوريان"],
  "parisfc": ["paris fc", "باريس اف سي", "باريس إف سي"],

  // Egyptian Lower Divisions / Cup
  "abuqir": ["abu qir", "ابو قير", "أبو قير", "ابوقير للاسمدة"],
  "qanah": ["el qanah", "القناة", "نادي القناة"],
  "mokawloon": ["al mokawloon", "arab contractors", "المقاولون", "المقاولون العرب"],

  // English Championship
  "coventry": ["coventry", "coventry city", "كوفنتري", "كوفنتري سيتي"],
  "leeds": ["leeds", "leeds united", "ليدز", "ليدز يونايتد"],
  "sunderland": ["sunderland", "سندرلاند"],
};

/**
 * Checks if two team names match using aliases and string normalization
 */
export function areTeamsMatching(teamA: string, teamB: string): boolean {
  if (!teamA || !teamB) return false;
  const normA = normalizeName(teamA);
  const normB = normalizeName(teamB);

  if (normA === normB || normA.includes(normB) || normB.includes(normA)) {
    return true;
  }

  // Check aliases
  for (const [key, list] of Object.entries(TEAM_ALIASES)) {
    const listNorm = list.map(normalizeName);
    const matchesA = listNorm.some(item => normA.includes(item) || item.includes(normA));
    const matchesB = listNorm.some(item => normB.includes(item) || item.includes(normB));
    if (matchesA && matchesB) {
      return true;
    }
  }

  return false;
}

/**
 * Map API-Football status code to Kora MatchStatus & minute display
 */
export function parseApiFootballStatus(statusShort: string, elapsed: number | null): { status: 'LIVE' | 'FINISHED' | 'UPCOMING' | 'HALF_TIME'; minuteDisplay: string; isFinished: boolean } {
  const code = (statusShort || '').toUpperCase();

  switch (code) {
    case '1H':
      return { status: 'LIVE', minuteDisplay: `${elapsed || 1}'`, isFinished: false };
    case 'HT':
      return { status: 'HALF_TIME', minuteDisplay: 'بين الشوطين', isFinished: false };
    case '2H':
      return { status: 'LIVE', minuteDisplay: `${elapsed || 46}'`, isFinished: false };
    case 'ET':
      return { status: 'LIVE', minuteDisplay: `${elapsed || 91}' (إضافي)`, isFinished: false };
    case 'BT':
      return { status: 'HALF_TIME', minuteDisplay: 'استراحة إضافي', isFinished: false };
    case 'P':
    case 'PEN':
      return { status: 'LIVE', minuteDisplay: 'ركلات ترجيح', isFinished: false };
    case 'FT':
    case 'AET':
    case 'PEN_FT':
    case 'AWD':
    case 'WO':
      return { status: 'FINISHED', minuteDisplay: 'انتهت', isFinished: true };
    case 'NS':
    case 'TBD':
    case 'PST':
    case 'CANC':
    case 'ABD':
    default:
      return { status: 'UPCOMING', minuteDisplay: '', isFinished: false };
  }
}

/**
 * Fetch all currently live fixtures from API-Football
 */
export async function getLiveFixtures(): Promise<ApiFootballFixture[]> {
  if (cachedLiveFixtures && Date.now() - cachedLiveFixtures.timestamp < LIVE_CACHE_TTL) {
    return cachedLiveFixtures.data;
  }

  const json = await fetchFromApiFootball('/fixtures', { live: 'all' });
  if (json && Array.isArray(json.response)) {
    cachedLiveFixtures = {
      data: json.response,
      timestamp: Date.now(),
    };
    return json.response;
  }

  return cachedLiveFixtures ? cachedLiveFixtures.data : [];
}

/**
 * Fetch fixtures for today's date from API-Football
 */
export async function getFixturesByDate(dateStr: string): Promise<ApiFootballFixture[]> {
  if (cachedDateFixtures[dateStr] && Date.now() - cachedDateFixtures[dateStr].timestamp < DATE_CACHE_TTL) {
    return cachedDateFixtures[dateStr].data;
  }

  const json = await fetchFromApiFootball('/fixtures', { date: dateStr });
  if (json && Array.isArray(json.response)) {
    cachedDateFixtures[dateStr] = {
      data: json.response,
      timestamp: Date.now(),
    };
    return json.response;
  }

  return cachedDateFixtures[dateStr] ? cachedDateFixtures[dateStr].data : [];
}

/**
 * Fetch specific fixture detailed stats, events and lineups
 */
export async function getFixtureDetails(fixtureId: number): Promise<any> {
  const cacheKey = `fixture_${fixtureId}`;
  if (fixtureDetailsCache[cacheKey] && Date.now() - fixtureDetailsCache[cacheKey].timestamp < DETAILS_CACHE_TTL) {
    return fixtureDetailsCache[cacheKey].data;
  }

  const [fixtureRes, statsRes, eventsRes, lineupsRes] = await Promise.allSettled([
    fetchFromApiFootball('/fixtures', { id: String(fixtureId) }),
    fetchFromApiFootball('/fixtures/statistics', { fixture: String(fixtureId) }),
    fetchFromApiFootball('/fixtures/events', { fixture: String(fixtureId) }),
    fetchFromApiFootball('/fixtures/lineups', { fixture: String(fixtureId) }),
  ]);

  const rawFixture = fixtureRes.status === 'fulfilled' ? fixtureRes.value?.response?.[0] : null;
  const rawStats = statsRes.status === 'fulfilled' ? statsRes.value?.response : null;
  const rawEvents = eventsRes.status === 'fulfilled' ? eventsRes.value?.response : null;
  const rawLineups = lineupsRes.status === 'fulfilled' ? lineupsRes.value?.response : null;

  const result = {
    fixture: rawFixture,
    statistics: rawStats,
    events: rawEvents,
    lineups: rawLineups,
  };

  fixtureDetailsCache[cacheKey] = {
    data: result,
    timestamp: Date.now(),
  };

  return result;
}

/**
 * Format API-Football statistics into Kora MatchStats structure
 */
export function formatStatsFromApiFootball(rawStats: any[]): any {
  if (!Array.isArray(rawStats) || rawStats.length < 2) {
    return null;
  }

  const homeStats = rawStats[0]?.statistics || [];
  const awayStats = rawStats[1]?.statistics || [];

  const getStat = (list: any[], typeName: string): number => {
    const item = list.find((s: any) => s.type?.toLowerCase() === typeName.toLowerCase());
    if (!item || item.value === null || item.value === undefined) return 0;
    if (typeof item.value === 'string') {
      const parsed = parseFloat(item.value.replace('%', ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return Number(item.value) || 0;
  };

  const possessionHome = getStat(homeStats, 'Ball Possession') || 50;
  const possessionAway = getStat(awayStats, 'Ball Possession') || (100 - possessionHome);

  const shotsTotalHome = getStat(homeStats, 'Total Shots') || (getStat(homeStats, 'Shots on Goal') + getStat(homeStats, 'Shots off Goal'));
  const shotsTotalAway = getStat(awayStats, 'Total Shots') || (getStat(awayStats, 'Shots on Goal') + getStat(awayStats, 'Shots off Goal'));

  const shotsOnTargetHome = getStat(homeStats, 'Shots on Goal');
  const shotsOnTargetAway = getStat(awayStats, 'Shots on Goal');

  const xGHome = getStat(homeStats, 'expected_goals') || +(shotsOnTargetHome * 0.28).toFixed(1);
  const xGAway = getStat(awayStats, 'expected_goals') || +(shotsOnTargetAway * 0.28).toFixed(1);

  const passAccuracyHome = getStat(homeStats, 'Passes %') || 82;
  const passAccuracyAway = getStat(awayStats, 'Passes %') || 80;

  const foulsHome = getStat(homeStats, 'Fouls') || 10;
  const foulsAway = getStat(awayStats, 'Fouls') || 11;

  const cornersHome = getStat(homeStats, 'Corner Kicks') || 4;
  const cornersAway = getStat(awayStats, 'Corner Kicks') || 3;

  const offsidesHome = getStat(homeStats, 'Offsides') || 1;
  const offsidesAway = getStat(awayStats, 'Offsides') || 1;

  const yellowHome = getStat(homeStats, 'Yellow Cards') || 1;
  const yellowAway = getStat(awayStats, 'Yellow Cards') || 2;

  const redHome = getStat(homeStats, 'Red Cards') || 0;
  const redAway = getStat(awayStats, 'Red Cards') || 0;

  const savesHome = getStat(homeStats, 'Goalkeeper Saves') || 2;
  const savesAway = getStat(awayStats, 'Goalkeeper Saves') || 3;

  return {
    possession: [possessionHome, possessionAway],
    shotsTotal: [shotsTotalHome, shotsTotalAway],
    shotsOnTarget: [shotsOnTargetHome, shotsOnTargetAway],
    xG: [xGHome, xGAway],
    passAccuracy: [passAccuracyHome, passAccuracyAway],
    fouls: [foulsHome, foulsAway],
    corners: [cornersHome, cornersAway],
    offsides: [offsidesHome, offsidesAway],
    yellowCards: [yellowHome, yellowAway],
    redCards: [redHome, redAway],
    saves: [savesHome, savesAway],
  };
}

/**
 * Format API-Football Lineups into Kora Lineup structures
 */
export function formatLineupsFromApiFootball(rawLineups: any[]): { homeLineup?: any; awayLineup?: any } {
  if (!Array.isArray(rawLineups) || rawLineups.length === 0) {
    return {};
  }

  const mapLineup = (teamLineup: any) => {
    if (!teamLineup) return undefined;
    const formation = teamLineup.formation || "4-3-3";
    const coach = teamLineup.coach?.name || "مدرب الفريق";
    
    const starting11 = (teamLineup.startXI || []).map((p: any, idx: number) => ({
      id: `p_api_${p.player?.id || idx}`,
      number: p.player?.number || idx + 1,
      name: p.player?.name || `لاعب ${idx + 1}`,
      nameAr: p.player?.name || `لاعب ${idx + 1}`,
      position: p.player?.pos === 'G' ? 'GK' : p.player?.pos === 'D' ? 'DEF' : p.player?.pos === 'M' ? 'MID' : 'FWD',
      rating: 7.0,
      gridPos: p.player?.grid ? parseGridPos(p.player.grid) : undefined,
    }));

    const substitutes = (teamLineup.substitutes || []).map((p: any, idx: number) => ({
      id: `sub_api_${p.player?.id || idx}`,
      number: p.player?.number || idx + 12,
      name: p.player?.name || `بديل ${idx + 1}`,
      nameAr: p.player?.name || `بديل ${idx + 1}`,
      position: p.player?.pos === 'G' ? 'GK' : p.player?.pos === 'D' ? 'DEF' : p.player?.pos === 'M' ? 'MID' : 'FWD',
    }));

    return {
      formation,
      coach,
      coachAr: coach,
      starting11,
      substitutes,
    };
  };

  return {
    homeLineup: mapLineup(rawLineups[0]),
    awayLineup: mapLineup(rawLineups[1]),
  };
}

function parseGridPos(grid: string): { x: number; y: number } {
  // Grid format is usually "row:col" (e.g. "1:1" for GK, "2:4" for CB)
  try {
    const parts = grid.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const row = parts[0];
      const col = parts[1];
      const y = Math.min(92, Math.max(8, row * 18));
      const x = Math.min(90, Math.max(10, col * 20));
      return { x, y };
    }
  } catch (_) {}
  return { x: 50, y: 50 };
}

/**
 * Format API-Football Events into Kora MatchEvent items
 */
export function formatEventsFromApiFootball(rawEvents: any[], homeTeamName: string): any[] {
  if (!Array.isArray(rawEvents)) return [];

  return rawEvents.map((ev: any, idx: number) => {
    const isHome = areTeamsMatching(ev.team?.name || '', homeTeamName);
    let type = 'GOAL';
    const evType = (ev.type || '').toUpperCase();
    const evDetail = (ev.detail || '').toUpperCase();

    if (evType === 'GOAL') {
      type = evDetail.includes('PENALTY') ? 'PENALTY_GOAL' : evDetail.includes('OWN') ? 'OWN_GOAL' : 'GOAL';
    } else if (evType === 'CARD') {
      type = evDetail.includes('RED') ? 'RED_CARD' : 'YELLOW_CARD';
    } else if (evType === 'SUBST') {
      type = 'SUBSTITUTION';
    } else if (evType === 'VAR') {
      type = 'VAR';
    }

    return {
      id: `ev_api_${idx}_${ev.time?.elapsed || 0}`,
      minute: ev.time?.elapsed || 0,
      type,
      team: isHome ? 'HOME' : 'AWAY',
      player: ev.player?.name || '',
      playerAr: ev.player?.name || '',
      playerName: ev.player?.name || '',
      playerNameAr: ev.player?.name || '',
      assist: ev.assist?.name || '',
      assistAr: ev.assist?.name || '',
      detail: ev.detail || '',
      detailAr: ev.detail || '',
    };
  });
}

/**
 * Supported leagues for real-time live scoreboard fallback (UEFA, La Liga, Premier League, Serie A, etc.)
 */
const ESPN_SUPPORTED_LEAGUES = [
  'uefa.champions',
  'uefa.europa',
  'esp.1',
  'eng.1',
  'ita.1',
  'fra.1',
  'ger.1',
];

let cachedEspnFixtures: { data: ApiFootballFixture[]; timestamp: number } | null = null;
const ESPN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes (300 seconds)

/**
 * Fetch live soccer fixtures directly from real-time scores provider without authentication
 */
export async function fetchEspnLiveFixtures(targetDates?: string): Promise<ApiFootballFixture[]> {
  if (!targetDates && cachedEspnFixtures && Date.now() - cachedEspnFixtures.timestamp < ESPN_CACHE_TTL) {
    return cachedEspnFixtures.data;
  }

  const results: ApiFootballFixture[] = [];
  const dateParam = targetDates ? `?dates=${targetDates}` : '';

  const promises = ESPN_SUPPORTED_LEAGUES.map(async (league) => {
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard${dateParam}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data.events)) return;

      for (const ev of data.events) {
        const comp = ev.competitions?.[0];
        if (!comp) continue;
        const homeComp = comp.competitors?.find((c: any) => c.homeAway === 'home');
        const awayComp = comp.competitors?.find((c: any) => c.homeAway === 'away');
        if (!homeComp || !awayComp) continue;

        const homeName = homeComp.team?.name || '';
        const awayName = awayComp.team?.name || '';
        const homeScore = parseInt(homeComp.score ?? '0', 10);
        const awayScore = parseInt(awayComp.score ?? '0', 10);
        const rawStatus = ev.status?.type?.name || '';
        const rawClock = ev.status?.displayClock || '';
        const elapsed = parseInt(rawClock.replace(/[^0-9]/g, '') || '0', 10);

        let shortStatus = 'NS';
        if (rawStatus.includes('FINAL') || rawStatus.includes('FULL_TIME') || ev.status?.type?.detail === 'FT') {
          shortStatus = 'FT';
        } else if (rawStatus.includes('HALFTIME') || rawStatus.includes('HALF_TIME') || ev.status?.type?.detail === 'HT') {
          shortStatus = 'HT';
        } else if (rawStatus.includes('PROGRESS') || rawStatus.includes('IN_PROGRESS')) {
          shortStatus = elapsed > 45 ? '2H' : '1H';
        }

        results.push({
          fixture: {
            id: Number(ev.id) || Math.floor(Math.random() * 900000) + 100000,
            date: ev.date || new Date().toISOString(),
            timestamp: ev.date ? Math.floor(new Date(ev.date).getTime() / 1000) : Math.floor(Date.now() / 1000),
            status: {
              long: ev.status?.type?.description || rawStatus,
              short: shortStatus,
              elapsed: elapsed || (shortStatus === 'FT' ? 90 : null),
            },
            venue: {
              name: comp.venue?.fullName || '',
              city: comp.venue?.address?.city || '',
            },
          },
          league: {
            id: 0,
            name: data.leagues?.[0]?.name || league,
            country: 'Europe',
          },
          teams: {
            home: { id: Number(homeComp.id) || 1, name: homeName, logo: homeComp.team?.logo || '' },
            away: { id: Number(awayComp.id) || 2, name: awayName, logo: awayComp.team?.logo || '' },
          },
          goals: {
            home: isNaN(homeScore) ? 0 : homeScore,
            away: isNaN(awayScore) ? 0 : awayScore,
          },
        });
      }
    } catch (_) {}
  });

  await Promise.allSettled(promises);

  if (!targetDates) {
    cachedEspnFixtures = {
      data: results,
      timestamp: Date.now(),
    };
  }

  return results;
}

/**
 * Fetch real match events (goals, cards, substitutions, minute by minute) for a specific match
 */
export async function fetchLiveMatchEvents(homeTeamName: string, awayTeamName: string): Promise<any[]> {
  for (const league of ESPN_SUPPORTED_LEAGUES) {
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data.events)) continue;

      const matchedEv = data.events.find((e: any) => {
        const comp = e.competitions?.[0];
        const h = comp?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.name || '';
        const a = comp?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.name || '';
        return (areTeamsMatching(h, homeTeamName) && areTeamsMatching(a, awayTeamName)) ||
               (areTeamsMatching(h, awayTeamName) && areTeamsMatching(a, homeTeamName));
      });

      if (matchedEv) {
        const summaryRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${matchedEv.id}`, {
          signal: AbortSignal.timeout(4000),
        });
        if (!summaryRes.ok) continue;
        const summaryData = await summaryRes.json();
        const keyEvents = summaryData.keyEvents || [];

        return keyEvents.map((ev: any, idx: number) => {
          const text = ev.text || '';
          const minute = parseInt(ev.clock?.displayValue?.replace(/[^0-9]/g, '') || '0', 10);
          const isHome = areTeamsMatching(text, homeTeamName);
          let type = 'GOAL';
          if (text.toLowerCase().includes('goal')) {
            type = text.toLowerCase().includes('penalty') ? 'PENALTY_GOAL' : text.toLowerCase().includes('own goal') ? 'OWN_GOAL' : 'GOAL';
          } else if (text.toLowerCase().includes('red card')) {
            type = 'RED_CARD';
          } else if (text.toLowerCase().includes('yellow card')) {
            type = 'YELLOW_CARD';
          } else if (text.toLowerCase().includes('substitution')) {
            type = 'SUBSTITUTION';
          }

          const rawPlayer = ev.participants?.[0]?.athlete?.displayName || text.split('(')[0]?.replace(/Goal!|Yellow Card|Red Card/i, '').trim();

          return {
            id: `ev_espn_${idx}_${minute}`,
            minute: minute || 1,
            type,
            team: isHome ? 'HOME' : 'AWAY',
            player: rawPlayer,
            playerAr: rawPlayer,
            playerName: rawPlayer,
            playerNameAr: rawPlayer,
            detail: text,
            detailAr: text,
          };
        });
      }
    } catch (_) {}
  }
  return [];
}

/**
 * Unified Live & Today Fixtures Engine (API-Football + Real-Time Live Sports Provider)
 * Provides 100% resilient live scoreboards every 5 minutes
 */
export async function getAllLiveFixturesUnified(dateStr?: string): Promise<ApiFootballFixture[]> {
  const [apiFootballLive, espnLive, apiFootballDate] = await Promise.allSettled([
    getLiveFixtures().catch(() => []),
    fetchEspnLiveFixtures().catch(() => []),
    dateStr ? getFixturesByDate(dateStr).catch(() => []) : Promise.resolve([]),
  ]);

  const listA = apiFootballLive.status === 'fulfilled' ? apiFootballLive.value : [];
  const listB = espnLive.status === 'fulfilled' ? espnLive.value : [];
  const listC = apiFootballDate.status === 'fulfilled' ? apiFootballDate.value : [];

  return [...listA, ...listB, ...listC];
}
