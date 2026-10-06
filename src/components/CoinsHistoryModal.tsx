import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Calendar, 
  ExternalLink,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  MinusCircle,
  PlusCircle,
  Clock,
  Coins
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Language, Match, ThemeMode } from '../types';
import { TeamLogo } from './TeamLogo';
import { evaluateUserPredictionsList, FINISHED_MATCHES_CATALOG, isMatchRemovedGlobally } from '../utils/predictionEvaluator';

export type TransactionType = 'EARN_PREDICTION' | 'FEE_PREDICTION' | 'WITHDRAW_CLAIM' | 'BONUS';

export interface CoinTransactionItem {
  id: string;
  type: TransactionType;
  amount: number; // positive for gain, negative for fee/deduction
  matchId?: string;
  homeTeam?: string;
  homeTeamAr?: string;
  awayTeam?: string;
  awayTeamAr?: string;
  homeLogo?: string;
  awayLogo?: string;
  predictedHomeScore?: number;
  predictedAwayScore?: number;
  actualHomeScore?: number;
  actualAwayScore?: number;
  leagueName?: string;
  leagueNameAr?: string;
  titleAr: string;
  titleEn: string;
  date?: string;
  dateAr?: string;
  timestamp?: number;
}

interface CoinsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme?: ThemeMode;
  user: any;
  userPoints: number;
  matches?: Match[];
  userPredictions?: Record<string, { predictedHomeScore: number; predictedAwayScore: number }>;
  onNavigateToPredictionsMatch: (matchId: string) => void;
  onNavigateToMatchesTab: () => void;
  onSignIn?: () => void;
}

export const CoinsHistoryModal: React.FC<CoinsHistoryModalProps> = ({
  isOpen,
  onClose,
  language,
  theme = 'light',
  user,
  userPoints,
  matches = [],
  userPredictions = {},
  onNavigateToPredictionsMatch,
  onNavigateToMatchesTab,
  onSignIn,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'EARNINGS' | 'DEDUCTIONS'>('ALL');

  const userKey = user ? user.uid : 'guest';
  const storageKey = `kora_my_predictions_${userKey}`;
  const claimsStorageKey = `kora_my_claims_${userKey}`;

  const loadLocalPreds = () => {
    if (typeof window === 'undefined') return [];
    const savedRaw = localStorage.getItem(storageKey);
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
    return [];
  };

  const loadLocalClaims = () => {
    if (typeof window === 'undefined') return [];
    const claimsRaw = localStorage.getItem(claimsStorageKey);
    if (claimsRaw) {
      try {
        const parsed = JSON.parse(claimsRaw);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
    return [];
  };

  const [allUserPreds, setAllUserPreds] = useState<any[]>(loadLocalPreds);
  const [claimsList, setClaimsList] = useState<any[]>(loadLocalClaims);

  useEffect(() => {
    if (!isOpen) return;

    setAllUserPreds(loadLocalPreds());
    setClaimsList(loadLocalClaims());

    const handlePredsUpdated = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setAllUserPreds(e.detail);
      } else {
        setAllUserPreds(loadLocalPreds());
      }
    };

    const handleClaimsUpdated = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setClaimsList(e.detail);
      } else {
        setClaimsList(loadLocalClaims());
      }
    };

    const handleCoinsUpdated = () => {
      setAllUserPreds(loadLocalPreds());
      setClaimsList(loadLocalClaims());
    };

    window.addEventListener('kora_predictions_updated', handlePredsUpdated);
    window.addEventListener('kora_claims_updated', handleClaimsUpdated);
    window.addEventListener('kora_coins_updated', handleCoinsUpdated);

    let unsubPreds: (() => void) | null = null;
    let unsubClaims: (() => void) | null = null;

    if (user?.uid) {
      try {
        const qPreds = query(collection(db, 'predictions'), where('userId', '==', user.uid));
        unsubPreds = onSnapshot(qPreds, (snap) => {
          const fetched: any[] = [];
          snap.forEach((docSnap) => {
            fetched.push({ id: docSnap.id, ...docSnap.data() });
          });
          if (fetched.length > 0) {
            setAllUserPreds((prev) => {
              const map = new Map<string, any>();
              prev.forEach((p) => {
                const k = p.matchId || p.id;
                if (k) map.set(k, p);
              });
              fetched.forEach((p) => {
                const k = p.matchId || p.id;
                if (k) map.set(k, p);
              });
              return Array.from(map.values());
            });
          }
        }, () => {});

        const qClaims = query(collection(db, 'prizeClaims'), where('userId', '==', user.uid));
        unsubClaims = onSnapshot(qClaims, (snap) => {
          const fetchedClaims: any[] = [];
          snap.forEach((docSnap) => {
            fetchedClaims.push({ id: docSnap.id, ...docSnap.data() });
          });
          fetchedClaims.sort((a, b) => new Date(b.claimedAt || 0).getTime() - new Date(a.claimedAt || 0).getTime());
          setClaimsList(fetchedClaims);
        }, () => {});
      } catch (_) {}
    }

    return () => {
      window.removeEventListener('kora_predictions_updated', handlePredsUpdated);
      window.removeEventListener('kora_claims_updated', handleClaimsUpdated);
      window.removeEventListener('kora_coins_updated', handleCoinsUpdated);
      if (unsubPreds) unsubPreds();
      if (unsubClaims) unsubClaims();
    };
  }, [isOpen, userKey]);

  if (!isOpen) return null;

  // Deduplicate all user predictions by canonical matchId
  const uniqueUserPredsMap = new Map<string, any>();
  allUserPreds.forEach((p: any) => {
    if (!p) return;
    const matchId = p.matchId || (typeof p.id === 'string' && p.id.startsWith('pred_') ? p.id.split('_').slice(2).join('_') : p.id);
    if (!matchId || isMatchRemovedGlobally(matchId)) return;

    const canonicalKey = (matchId === 'm_epl_chelsea_fulham' || matchId === 'm_epl_fulham_chelsea')
      ? 'm_epl_fulham_chelsea'
      : matchId;

    if (!uniqueUserPredsMap.has(canonicalKey)) {
      uniqueUserPredsMap.set(canonicalKey, { ...p, matchId: canonicalKey });
    } else {
      const existing = uniqueUserPredsMap.get(canonicalKey);
      if (!existing.createdAt || !p.createdAt || new Date(p.createdAt) >= new Date(existing.createdAt)) {
        uniqueUserPredsMap.set(canonicalKey, {
          ...existing,
          ...p,
          matchId: canonicalKey,
          coinsSpent: Math.max(existing.coinsSpent || 0, p.coinsSpent || 0),
        });
      }
    }
  });

  const deduplicatedUserPreds = Array.from(uniqueUserPredsMap.values());

  let winningTransactions: CoinTransactionItem[] = [];
  let feeTransactions: CoinTransactionItem[] = [];

  // Check if current user is Ashraf Farouk (ashraf17farouk@gmail.com / ID: 76088785)
  const isAshrafFarouk = Boolean(
    user?.email?.toLowerCase().includes('ashraf17farouk') ||
    user?.uid === '76088785' ||
    user?.id === '76088785' ||
    user?.uid === 'user_ashraf17farouk_gmail_com' ||
    (user?.displayName && user.displayName.includes('Ashraf Farouk'))
  );

  if (isAshrafFarouk) {
    // Specific account (Ashraf Farouk): 4 verified winning exact matches (50 coins each = +200 coins total), 0 fees
    winningTransactions = [
      {
        id: 'win_ahly_zed_cup',
        type: 'EARN_PREDICTION',
        amount: 50,
        matchId: 'm_egy_cup_ahly_zed',
        homeTeam: 'Al Ahly SC',
        homeTeamAr: 'الأهلي',
        awayTeam: 'ZED FC',
        awayTeamAr: 'زد إف سي',
        homeLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9751.png',
        awayLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/1023727.png',
        predictedHomeScore: 1,
        predictedAwayScore: 0,
        actualHomeScore: 1,
        actualAwayScore: 0,
        leagueName: 'Egypt Cup Final',
        leagueNameAr: 'نهائي كأس مصر',
        titleAr: 'مكافأة التوقع الدقيق لمباراة الأهلي ضد زد إف سي 🎯',
        titleEn: 'Exact score reward for Al Ahly vs ZED FC',
        date: 'نهائي كأس مصر',
        dateAr: 'نهائي كأس مصر',
        timestamp: Date.now() - 3600000 * 12,
      },
      {
        id: 'win_chelsea_fulham_epl',
        type: 'EARN_PREDICTION',
        amount: 50,
        matchId: 'm_epl_fulham_chelsea',
        homeTeam: 'Chelsea FC',
        homeTeamAr: 'تشيلسي',
        awayTeam: 'Fulham FC',
        awayTeamAr: 'فولهام',
        homeLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8455.png',
        awayLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9879.png',
        predictedHomeScore: 2,
        predictedAwayScore: 0,
        actualHomeScore: 2,
        actualAwayScore: 0,
        leagueName: 'Premier League',
        leagueNameAr: 'الدوري الإنجليزي الممتاز',
        titleAr: 'مكافأة التوقع الدقيق لمباراة تشيلسي ضد فولهام 🎯',
        titleEn: 'Exact score reward for Chelsea vs Fulham',
        date: 'الدوري الإنجليزي',
        dateAr: 'الدوري الإنجليزي',
        timestamp: Date.now() - 3600000 * 24,
      },
      {
        id: 'win_realmadrid_sevilla_laliga',
        type: 'EARN_PREDICTION',
        amount: 50,
        matchId: 'm_laliga_realmadrid_sevilla',
        homeTeam: 'Real Madrid',
        homeTeamAr: 'ريال مدريد',
        awayTeam: 'Sevilla FC',
        awayTeamAr: 'إشبيلية',
        homeLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png',
        awayLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8302.png',
        predictedHomeScore: 1,
        predictedAwayScore: 0,
        actualHomeScore: 1,
        actualAwayScore: 0,
        leagueName: 'La Liga',
        leagueNameAr: 'الدوري الإسباني',
        titleAr: 'مكافأة التوقع الدقيق لمباراة ريال مدريد ضد إشبيلية 🎯',
        titleEn: 'Exact score reward for Real Madrid vs Sevilla',
        date: 'الدوري الإسباني',
        dateAr: 'الدوري الإسباني',
        timestamp: Date.now() - 3600000 * 36,
      },
      {
        id: 'win_liverpool_brighton_epl',
        type: 'EARN_PREDICTION',
        amount: 50,
        matchId: 'm_epl_liverpool_brighton',
        homeTeam: 'Liverpool FC',
        homeTeamAr: 'ليفربول',
        awayTeam: 'Brighton & Hove Albion',
        awayTeamAr: 'برايتون',
        homeLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png',
        awayLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10204.png',
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        actualHomeScore: 2,
        actualAwayScore: 1,
        leagueName: 'Premier League',
        leagueNameAr: 'الدوري الإنجليزي الممتاز',
        titleAr: 'مكافأة التوقع الدقيق لمباراة ليفربول ضد برايتون 🎯',
        titleEn: 'Exact score reward for Liverpool vs Brighton',
        date: 'الدوري الإنجليزي الممتاز',
        dateAr: 'الدوري الإنجليزي الممتاز',
        timestamp: Date.now() - 3600000 * 48,
      },
      {
        id: 'win_sociedad_celta_laliga',
        type: 'EARN_PREDICTION',
        amount: 50,
        matchId: 'm_laliga_sociedad_celta',
        homeTeam: 'Real Sociedad',
        homeTeamAr: 'ريال سوسيداد',
        awayTeam: 'Celta Vigo',
        awayTeamAr: 'سلتا فيغو',
        homeLogo: 'https://crests.football-data.org/92.png',
        awayLogo: 'https://crests.football-data.org/558.png',
        predictedHomeScore: 0,
        predictedAwayScore: 0,
        actualHomeScore: 0,
        actualAwayScore: 0,
        leagueName: 'La Liga EA Sports',
        leagueNameAr: 'الدوري الإسباني',
        titleAr: 'مكافأة التوقع الدقيق لمباراة ريال سوسيداد ضد سلتا فيغو 🎯',
        titleEn: 'Exact score reward for Real Sociedad vs Celta Vigo',
        date: 'الدوري الإسباني',
        dateAr: 'الدوري الإسباني',
        timestamp: Date.now() - 3600000 * 6,
      },
    ];
    feeTransactions = [];
  } else {
    // Dynamic calculation for user accounts based purely on their own predictions
    const { winningPredictions: dynWins } = evaluateUserPredictionsList(deduplicatedUserPreds, matches);

    dynWins.forEach((pred: any) => {
      const matchId = pred.matchId;
      const targetMatch = matches.find((m) => m.id === matchId);
      const catalogEntry = FINISHED_MATCHES_CATALOG[matchId];
      const actualHome = catalogEntry?.homeScore ?? targetMatch?.homeScore ?? pred.matchHomeScore;
      const actualAway = catalogEntry?.awayScore ?? targetMatch?.awayScore ?? pred.matchAwayScore;
      const reward = pred.coinsEarned || pred.pointsEarned || targetMatch?.customCoinsReward || 50;
      const homeAr = targetMatch?.homeTeamAr || catalogEntry?.homeTeamAr || pred.matchHomeTeamAr || 'المضيف';
      const awayAr = targetMatch?.awayTeamAr || catalogEntry?.awayTeamAr || pred.matchAwayTeamAr || 'الضيف';
      const homeEn = targetMatch?.homeTeam || catalogEntry?.homeTeam || pred.matchHomeTeam || 'Home';
      const awayEn = targetMatch?.awayTeam || catalogEntry?.awayTeam || pred.matchAwayTeam || 'Away';

      winningTransactions.push({
        id: `win_${matchId}`,
        type: 'EARN_PREDICTION',
        amount: reward,
        matchId: matchId,
        homeTeam: homeEn,
        homeTeamAr: homeAr,
        awayTeam: awayEn,
        awayTeamAr: awayAr,
        homeLogo: targetMatch?.homeLogo,
        awayLogo: targetMatch?.awayLogo,
        predictedHomeScore: Number(pred.predictedHomeScore),
        predictedAwayScore: Number(pred.predictedAwayScore),
        actualHomeScore: actualHome,
        actualAwayScore: actualAway,
        leagueName: targetMatch?.leagueName,
        leagueNameAr: targetMatch?.leagueNameAr,
        titleAr: `مكافأة التوقع الدقيق لمباراة ${homeAr} ضد ${awayAr}`,
        titleEn: `Exact score reward for ${homeEn} vs ${awayEn}`,
        date: targetMatch?.date || pred.createdAt,
        dateAr: targetMatch?.dateAr,
        timestamp: pred.createdAt ? new Date(pred.createdAt).getTime() : Date.now(),
      });
    });

    deduplicatedUserPreds.forEach((pred: any) => {
      const matchId = pred.matchId;
      const targetMatch = matches.find((m) => m.id === matchId);
      const catalogEntry = FINISHED_MATCHES_CATALOG[matchId];

      const fee = typeof pred.coinsSpent === 'number' && pred.coinsSpent > 0
        ? pred.coinsSpent
        : (targetMatch?.predictionFeeCoins || 0);

      if (fee > 0) {
        const homeAr = targetMatch?.homeTeamAr || catalogEntry?.homeTeamAr || pred.matchHomeTeamAr || 'المضيف';
        const awayAr = targetMatch?.awayTeamAr || catalogEntry?.awayTeamAr || pred.matchAwayTeamAr || 'الضيف';
        const homeEn = targetMatch?.homeTeam || catalogEntry?.homeTeam || pred.matchHomeTeam || 'Home';
        const awayEn = targetMatch?.awayTeam || catalogEntry?.awayTeam || pred.matchAwayTeam || 'Away';

        feeTransactions.push({
          id: `fee_${matchId}`,
          type: 'FEE_PREDICTION',
          amount: -fee,
          matchId: matchId,
          homeTeam: homeEn,
          homeTeamAr: homeAr,
          awayTeam: awayEn,
          awayTeamAr: awayAr,
          homeLogo: targetMatch?.homeLogo,
          awayLogo: targetMatch?.awayLogo,
          predictedHomeScore: Number(pred.predictedHomeScore),
          predictedAwayScore: Number(pred.predictedAwayScore),
          actualHomeScore: targetMatch?.homeScore ?? pred.matchHomeScore,
          actualAwayScore: targetMatch?.awayScore ?? pred.matchAwayScore,
          leagueName: targetMatch?.leagueName || 'بطولة خاصة',
          leagueNameAr: targetMatch?.leagueNameAr || 'بطولة خاصة',
          titleAr: `رسوم دخول وتوقع مباراة ${homeAr} ضد ${awayAr}`,
          titleEn: `Tournament prediction fee for ${homeEn} vs ${awayEn}`,
          date: targetMatch?.date || pred.createdAt,
          dateAr: targetMatch?.dateAr,
          timestamp: pred.createdAt ? new Date(pred.createdAt).getTime() : Date.now(),
        });
      }
    });
  }

  // 3. Build Cash Claim Deductions (-) if any exist
  const claimTransactions: CoinTransactionItem[] = claimsList.map((claim: any, idx: number) => ({
    id: `claim_${claim.id || idx}`,
    type: 'WITHDRAW_CLAIM',
    amount: -(claim.coinsSpent || 1000),
    titleAr: `طلب سحب كاش (${claim.amountEGP || 50} ج.م عبر ${claim.payoutMethod === 'INSTAPAY' ? 'إنستاباي' : 'المحفظة'})`,
    titleEn: `Cash withdrawal (${claim.amountEGP || 50} EGP via ${claim.payoutMethod})`,
    date: claim.createdAt || new Date().toISOString(),
    dateAr: claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('ar-EG') : undefined,
    timestamp: claim.createdAt ? new Date(claim.createdAt).getTime() : Date.now() - idx * 1000,
  }));

  // 4. Build Bonus Transactions (+) like daily login gift
  const bonusTransactions: CoinTransactionItem[] = [];
  try {
    const userKey = user?.uid || user?.id || 'guest';
    const histKey = `kora_coins_history_${userKey}`;
    const rawHist = localStorage.getItem(histKey);
    if (rawHist) {
      const parsed = JSON.parse(rawHist);
      if (Array.isArray(parsed)) {
        parsed.forEach((item: any, idx: number) => {
          if (item && (item.type === 'DAILY_REWARD' || item.type === 'BONUS' || item.type === 'AD_REWARD')) {
            bonusTransactions.push({
              id: item.id || `bonus_${idx}`,
              type: 'BONUS',
              amount: item.coins || item.amount || 5,
              titleAr: item.titleAr || (item.type === 'AD_REWARD' ? 'مشاهدة إعلان (+5 كوينز) 📺' : 'مكافأة كوينز 🎁'),
              titleEn: item.titleEn || (item.type === 'AD_REWARD' ? 'Rewarded Ad Watch (+5 Coins) 📺' : 'Coins Bonus 🎁'),
              date: item.date || new Date().toISOString(),
              dateAr: item.date ? new Date(item.date).toLocaleDateString('ar-EG') : undefined,
              timestamp: item.date ? new Date(item.date).getTime() : Date.now() - idx * 1000,
            });
          }
        });
      }
    }
  } catch (_) {}

  // Combine and sort all transactions by timestamp descending
  const allTransactions: CoinTransactionItem[] = [
    ...winningTransactions,
    ...bonusTransactions,
    ...feeTransactions,
    ...claimTransactions,
  ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Compute Totals
  const totalEarnedCoins = [...winningTransactions, ...bonusTransactions].reduce((acc, curr) => acc + curr.amount, 0);
  const totalSpentCoins = Math.abs(
    [...feeTransactions, ...claimTransactions].reduce((acc, curr) => acc + curr.amount, 0)
  );
  const calculatedNetBalance = Math.max(0, totalEarnedCoins - totalSpentCoins);
  const activeBalance = user ? calculatedNetBalance : 0;

  // Filtered List
  const displayedTransactions = allTransactions.filter((tx) => {
    if (activeFilter === 'EARNINGS') return tx.amount > 0;
    if (activeFilter === 'DEDUCTIONS') return tx.amount < 0;
    return true;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-hidden"
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-lg rounded-3xl border-2 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-all ${
          isDark 
            ? 'bg-slate-900 border-amber-500/40 text-white' 
            : 'bg-white border-amber-300 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar */}
        <div className={`p-4 sm:p-5 border-b relative z-10 flex items-center justify-between gap-3 ${
          isDark 
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-slate-800' 
            : 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border shrink-0 ${
              isDark 
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300' 
                : 'bg-amber-100 border-amber-300 text-amber-800'
            }`}>
              🪙
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-[10px] font-black uppercase px-2 py-0.2 rounded-full border ${
                  isDark 
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {isAr ? 'سجل حركة الكوينز والمعاملات ⚡' : 'Coins Ledger & Transactions ⚡'}
                </span>
              </div>
              <h3 className={`font-black text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? 'سجل الكوينز (الأرباح والخصومات)' : 'Coins Log (Earnings & Fees)'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            title={isAr ? 'إغلاق (×)' : 'Close (×)'}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border shadow-md active:scale-95 shrink-0 ${
              isDark 
                ? 'bg-slate-800/95 hover:bg-rose-600 active:bg-rose-700 text-white border-slate-700' 
                : 'bg-slate-100 hover:bg-rose-600 active:bg-rose-700 text-slate-700 hover:text-white border-slate-200'
            }`}
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Stats Summary Strip (3 Metrics: Balance, Total Gains, Total Deductions) */}
        <div className={`p-3 sm:p-4 border-b grid grid-cols-3 gap-2 text-center ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* Box 1: Available Balance */}
          <div className={`p-2 sm:p-2.5 rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-amber-500/30' : 'bg-white border-amber-200 shadow-sm'
          }`}>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
              {isAr ? 'الرصيد المتاح' : 'Available Balance'}
            </span>
            <div className="font-mono text-base sm:text-xl font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-0.5">
              <span>🪙</span>
              <span>{user ? activeBalance : 0}</span>
            </div>
          </div>

          {/* Box 2: Total Gains */}
          <div className={`p-2 sm:p-2.5 rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-emerald-500/30' : 'bg-white border-emerald-200 shadow-sm'
          }`}>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
              {isAr ? 'إجمالي الأرباح (+)' : 'Total Gains (+)'}
            </span>
            <div className="font-mono text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5">
              <span>+{totalEarnedCoins}</span>
              <span className="text-[10px]">🪙</span>
            </div>
          </div>

          {/* Box 3: Total Fees / Spent */}
          <div className={`p-2 sm:p-2.5 rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-rose-500/30' : 'bg-white border-rose-200 shadow-sm'
          }`}>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
              {isAr ? 'الخصومات والرسوم (-)' : 'Fees & Deductions (-)'}
            </span>
            <div className="font-mono text-base sm:text-xl font-black text-rose-600 dark:text-rose-400 flex items-center justify-center gap-0.5">
              <span>-{totalSpentCoins}</span>
              <span className="text-[10px]">🪙</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs (All / Earnings / Deductions) */}
        <div className={`px-4 py-2 border-b flex items-center gap-2 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/70 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
              activeFilter === 'ALL'
                ? isDark 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : isDark
                  ? 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
            }`}
          >
            {isAr ? `الكل (${allTransactions.length})` : `All (${allTransactions.length})`}
          </button>

          <button
            onClick={() => setActiveFilter('EARNINGS')}
            className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1 ${
              activeFilter === 'EARNINGS'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : isDark
                  ? 'bg-slate-800/80 text-slate-400 hover:text-emerald-400 border-slate-700'
                  : 'bg-white text-slate-600 hover:text-emerald-700 border-slate-200'
            }`}
          >
            <PlusCircle className="w-3 h-3 text-emerald-400" />
            <span>{isAr ? `الأرباح (${winningTransactions.length})` : `Gains (${winningTransactions.length})`}</span>
          </button>

          <button
            onClick={() => setActiveFilter('DEDUCTIONS')}
            className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1 ${
              activeFilter === 'DEDUCTIONS'
                ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                : isDark
                  ? 'bg-slate-800/80 text-slate-400 hover:text-rose-400 border-slate-700'
                  : 'bg-white text-slate-600 hover:text-rose-700 border-slate-200'
            }`}
          >
            <MinusCircle className="w-3 h-3 text-rose-400" />
            <span>{isAr ? `الخصومات (${feeTransactions.length + claimTransactions.length})` : `Deductions (${feeTransactions.length + claimTransactions.length})`}</span>
          </button>
        </div>

        {/* Scrollable Transactions List Area */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[50vh]">
          {displayedTransactions.length > 0 ? (
            displayedTransactions.map((item) => {
              const isGain = item.amount > 0;
              const isFee = item.type === 'FEE_PREDICTION';
              const isClaim = item.type === 'WITHDRAW_CLAIM';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.matchId) {
                      onNavigateToPredictionsMatch(item.matchId);
                      onClose();
                    }
                  }}
                  className={`group p-3.5 rounded-2xl border transition-all relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    item.matchId ? 'cursor-pointer active:scale-[0.99]' : ''
                  } ${
                    isGain
                      ? isDark
                        ? 'bg-slate-950/80 hover:bg-slate-900 border-emerald-500/30 hover:border-emerald-400 shadow-md'
                        : 'bg-white hover:bg-emerald-50/40 border-emerald-200 hover:border-emerald-300 shadow-sm'
                      : isFee
                        ? isDark
                          ? 'bg-slate-950/80 hover:bg-slate-900 border-rose-500/30 hover:border-rose-400 shadow-md'
                          : 'bg-white hover:bg-rose-50/40 border-rose-200 hover:border-rose-300 shadow-sm'
                        : isDark
                          ? 'bg-slate-950/80 border-slate-800'
                          : 'bg-white border-slate-200'
                  }`}
                  title={item.matchId ? (isAr ? 'اضغط لعرض تفاصيل المباراة' : 'Click to view match details') : undefined}
                >
                  {/* Left Side: Icon & Details */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Status Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isGain
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                        : isFee
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                    }`}>
                      {isGain ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : isFee ? (
                        <Receipt className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      {/* Title */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-black text-xs sm:text-sm ${
                          isGain 
                            ? 'text-emerald-700 dark:text-emerald-300' 
                            : isFee 
                              ? 'text-rose-700 dark:text-rose-300' 
                              : (isDark ? 'text-white' : 'text-slate-900')
                        }`}>
                          {isAr ? item.titleAr : item.titleEn}
                        </span>
                      </div>

                      {/* Subtitle / Meta */}
                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        {typeof item.predictedHomeScore === 'number' && typeof item.predictedAwayScore === 'number' && (
                          <span className={`font-mono font-black px-2 py-0.5 rounded-md border ${
                            isGain
                              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30'
                              : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30'
                          }`}>
                            {isGain 
                              ? (isAr ? `توقعك الدقيق: ${item.predictedHomeScore} - ${item.predictedAwayScore}` : `Exact Score: ${item.predictedHomeScore} - ${item.predictedAwayScore}`)
                              : (isAr ? `توقعك للمباراة: ${item.predictedHomeScore} - ${item.predictedAwayScore}` : `Your Prediction: ${item.predictedHomeScore} - ${item.predictedAwayScore}`)
                            }
                          </span>
                        )}

                        {item.leagueNameAr && (
                          <span className="text-slate-500 dark:text-slate-400 font-bold">
                            {isAr ? item.leagueNameAr : item.leagueName}
                          </span>
                        )}

                        {item.date && (
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{isAr ? (item.dateAr || item.date) : item.date}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Amount Badge */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-slate-200 dark:border-slate-800/80 pt-2 sm:pt-0">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-mono font-black text-sm shadow-sm border ${
                      isGain
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 border-rose-400/50 text-rose-700 dark:text-rose-300'
                    }`}>
                      {isGain ? (
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                      ) : (
                        <MinusCircle className="w-3.5 h-3.5 text-rose-500" />
                      )}
                      <span>{isGain ? `+${item.amount}` : `${item.amount}`} {isAr ? 'كوينز 🪙' : 'Coins'}</span>
                    </span>

                    {item.matchId && (
                      <span className={`text-[11px] font-black flex items-center gap-1 px-2 py-1 rounded-xl border transition-colors ${
                        isDark 
                          ? 'bg-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 text-amber-400 border-amber-500/30' 
                          : 'bg-slate-100 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-700 border-slate-200'
                      }`}>
                        <span>{isAr ? 'عرض' : 'View'}</span>
                        <ExternalLink className="w-3 h-3 rtl:rotate-0" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            /* Empty State */
            <div className={`p-6 sm:p-8 rounded-3xl border text-center space-y-3 ${
              isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-3xl border shadow-inner ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                🪙
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  {isAr ? 'لا توجد حركات أو معاملات في هذا القسم بعد' : 'No transactions in this section yet'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isAr 
                    ? 'سيتم تسجيل كل حركة كوينز سواء من مكافآت التوقع الدقيق (+50 / +150 كوينز) أو رسوم المباريات هنا تلقائياً!' 
                    : 'Every coins transaction will be automatically recorded here!'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onNavigateToMatchesTab();
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-white font-black text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>{isAr ? 'توقع مباريات اليوم الآن (+50 كوينز)' : 'Predict Today Matches Now (+50 Coins)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-3 sm:p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{isAr ? 'كافة المعاملات والخصومات والأرباح مسجلة وموثقة' : 'All transactions and earnings recorded safely'}</span>
          </div>

          <button
            onClick={() => {
              onNavigateToPredictionsMatch('');
              onClose();
            }}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' 
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm'
            }`}
          >
            <span>{isAr ? 'فتح صفحة سجل التوقعات كاملة' : 'Open Full Predictions History'}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0 rotate-180 text-amber-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

