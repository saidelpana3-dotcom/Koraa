import React, { useState, useEffect } from 'react';
import { Language, LeaderboardUser } from '../types';
import { Trophy, Clock, Medal, Award, Flame, Sparkles, User, Gift, CheckCircle2, Shield, ChevronRight } from 'lucide-react';

interface StandingsViewProps {
  language: Language;
  currentUserId?: string;
  currentUserDisplayName?: string;
  currentUserPredictionPoints?: number;
  userPoints?: number;
  setUserPoints?: React.Dispatch<React.SetStateAction<number>>;
}

export const StandingsView: React.FC<StandingsViewProps> = ({
  language,
  currentUserId,
  currentUserDisplayName = 'أنت (الكابتن)',
  currentUserPredictionPoints = 0,
  userPoints,
  setUserPoints,
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [usersList, setUsersList] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  // Community Predictors - Zeroed points & assigned coins per customer instructions
  const SAMPLE_COMMUNITY_PREDICTORS: { name: string; avatar: string; dailyPts: number; weeklyPts: number; monthlyPts: number; exacts: number; coins: number }[] = [
    { name: 'Koraa Web', avatar: '🥇', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 80 },
    { name: 'Ashraf Farouk', avatar: '🥇', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 200 },
    { name: 'مجدي فانتازي', avatar: '🥈', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 125 },
    { name: 'Said El Bana', avatar: '🥉', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 100 },
    { name: 'الكابتن طارق السعيد', avatar: '⚽', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 0 },
    { name: 'أحمد زيزو (الملك)', avatar: '👑', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 0 },
    { name: 'دكتور الكرة (محمد سلام)', avatar: '🔥', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 0 },
    { name: 'محمود الفارس', avatar: '⚡', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 0 },
    { name: 'سارة أسطورة التوقعات', avatar: '🌟', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 0 },
    { name: 'عمر شريف الكورة', avatar: '🎯', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 0 },
    { name: 'خالد التكتيكي', avatar: '🧠', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 0 },
    { name: 'علي الهداف', avatar: '🥇', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 0 },
    { name: 'ياسين الفائز', avatar: '🏆', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 0 },
    { name: 'كابتن هيثم', avatar: '⚽', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 0 },
    { name: 'كريم البوب', avatar: '🎩', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 0 },
    { name: 'مريم البرنسيسة', avatar: '💎', dailyPts: 0, weeklyPts: 0, monthlyPts: 0, exacts: 0, coins: 0 },
  ];

  // Dynamic Countdown Timer to the specific Reset Schedule
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      let target = new Date();

      if (activeTab === 'daily') {
        // Daily Reset at 2:00 AM next day
        target.setDate(now.getDate());
        target.setHours(2, 0, 0, 0);
        if (now >= target) {
          target.setDate(target.getDate() + 1);
        }
      } else if (activeTab === 'weekly') {
        // Weekly Reset every Thursday at 12:00 AM midnight
        // Day 4 is Thursday
        const dayOfWeek = now.getDay();
        let daysUntilThursday = (4 - dayOfWeek + 7) % 7;
        if (daysUntilThursday === 0 && now.getHours() >= 0) {
          daysUntilThursday = 7;
        }
        target.setDate(now.getDate() + daysUntilThursday);
        target.setHours(0, 0, 0, 0);
      } else {
        // Monthly Reset on the 1st of next month at 12:00 AM midnight
        target = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
      }

      const diffMs = target.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeftStr(isAr ? '00س : 00د : 00ث (جاري التصفير)' : '00h : 00m : 00s (Resetting)');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      const days = Math.floor(hours / 24);
      const remHours = hours % 24;

      if (days > 0) {
        setTimeLeftStr(
          isAr
            ? `${days} يوم و ${remHours}س : ${mins}د : ${secs}ث`
            : `${days}d ${remHours}h : ${mins}m : ${secs}s`
        );
      } else {
        setTimeLeftStr(
          `${remHours.toString().padStart(2, '0')}س : ${mins.toString().padStart(2, '0')}د : ${secs.toString().padStart(2, '0')}ث`
        );
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [activeTab, isAr]);

  // Load and generate rankings for the active tab purely client-side without database queries
  useEffect(() => {
    const fetchLeaderboard = () => {
      setLoading(true);
      try {
        // Build combined list
        let combined: LeaderboardUser[] = [];

        SAMPLE_COMMUNITY_PREDICTORS.forEach((p, idx) => {
          combined.push({
            id: `sample_${idx}`,
            displayName: p.name,
            points: 0,
            coins: p.coins,
            exactPredictions: p.exacts,
            correctOutcomes: Math.floor(p.exacts * 1.5),
            totalPredictions: p.exacts * 2,
            rankBadge: p.avatar,
          });
        });

        // Explicit assigned coins mapping per user request
        const ASSIGNED_COINS_MAP: Record<string, number> = {
          'Koraa Web': 80,
          'Ashraf Farouk': 200,
          'مجدي فانتازي': 125,
          'Said El Bana': 100,
        };

        // Add or update current logged in user with zeroed points while preserving assigned coins
        const currentInList = combined.find((u) => u.displayName === currentUserDisplayName);
        const currentUserCoins = ASSIGNED_COINS_MAP[currentUserDisplayName] ?? (userPoints || 0);
        if (!currentInList) {
          combined.push({
            id: currentUserId || 'me_current',
            displayName: currentUserDisplayName,
            points: 0,
            coins: currentUserCoins,
            exactPredictions: 0,
            correctOutcomes: 0,
            totalPredictions: 0,
            rankBadge: '⭐',
          });
        } else {
          currentInList.points = 0;
          currentInList.coins = ASSIGNED_COINS_MAP[currentUserDisplayName] ?? currentInList.coins ?? (userPoints || 0);
        }

        // Sort descending by coins
        combined.sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0));

        // Assign ranks (1-indexed)
        combined = combined.map((u, i) => ({
          ...u,
          rank: i + 1,
        }));

        setUsersList(combined);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab, currentUserPredictionPoints, currentUserDisplayName, currentUserId, userPoints]);

  // Prize calculation helper based on rank & tab & coins
  const getEstimatedPrize = (rank: number, tab: 'daily' | 'weekly' | 'monthly', coins: number = 0) => {
    if (coins <= 0) return null;

    if (tab === 'daily') {
      if (rank === 1) return '+100 كوينز 🥇';
      if (rank === 2) return '+75 كوينز 🥈';
      if (rank === 3) return '+50 كوينز 🥉';
      if (rank >= 4 && rank <= 10) return '+30 كوينز 🏅';
      if (rank >= 11 && rank <= 20) return '+20 كوينز 🎗️';
      return null;
    }
    if (tab === 'weekly') {
      if (rank === 1) return '+1000 كوينز 🥇';
      if (rank === 2) return '+750 كوينز 🥈';
      if (rank === 3) return '+500 كوينز 🥉';
      if (rank >= 4 && rank <= 10) return '+300 كوينز 🏅';
      if (rank >= 11 && rank <= 20) return '+200 كوينز 🎗️';
      return null;
    }
    if (tab === 'monthly') {
      if (rank === 1) return '+2000 كوينز 🥇';
      if (rank === 2) return '+1750 كوينز 🥈';
      if (rank === 3) return '+1500 كوينز 🥉';
      if (rank >= 4 && rank <= 10) return '+600 كوينز 🏅';
      if (rank >= 11 && rank <= 20) return '+400 كوينز 🎗️';
      if (rank >= 21 && rank <= 50) return '+200 كوينز 🎗️';
      return null;
    }
    return null;
  };

  // Auto-distribute rank reward coins (+50 coins) to user's wallet balance
  useEffect(() => {
    const userKey = currentUserId || 'guest';
    const autoDistKey = `kora_coins_auto_distributed_2am_${userKey}`;
    if (!localStorage.getItem(autoDistKey) && setUserPoints) {
      localStorage.setItem(autoDistKey, 'true');
      setUserPoints((prev) => {
        const next = prev + 50;
        localStorage.setItem('kora_user_points', next.toString());
        if (currentUserId) {
          localStorage.setItem(`kora_user_points_${currentUserId}`, next.toString());
        }
        return next;
      });
    }
  }, [currentUserId, setUserPoints]);

  const myUserObj = usersList.find((u) => u.displayName === currentUserDisplayName);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-amber-950 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center sm:text-right rtl:sm:text-right">
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black mb-2">
              <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>{isAr ? 'لوحة أبطال المتوقعين بالكوينز' : 'Official Predictor Coins Leaderboard'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {isAr ? 'ترتيب الأعضاء بالكوينز والجوائز' : 'User Coins Rankings & Rewards'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {isAr
                ? 'توقع النتيجة الدقيقة لكل مباراة يمنحك ٥٠ كوينز تضاف فوراً لرصيدك، ويمكنك استبدال الكوينز بجوائز كاش فورية.'
                : 'Predicting the exact score earns you 50 coins added directly to your balance, redeemable for instant cash prizes.'}
            </p>
          </div>

          {/* User's current rank card badge */}
          {myUserObj && (
            <div className="bg-slate-900/90 border-2 border-amber-400 p-4 rounded-2xl shadow-xl flex items-center gap-3 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 font-black text-2xl flex items-center justify-center border border-amber-400/40">
                #{myUserObj.rank}
              </div>
              <div className="text-right rtl:text-right">
                <span className="text-[10px] text-slate-400 font-extrabold block">
                  {isAr ? 'ترتيبك الحالي' : 'Your Current Rank'}
                </span>
                <span className="font-extrabold text-white text-sm block line-clamp-1">
                  {myUserObj.displayName}
                </span>
                <span className="text-xs font-black text-amber-400 flex items-center gap-1 mt-0.5">
                  🪙 {myUserObj.coins ?? 0} {isAr ? 'كوينز' : 'coins'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3 Main Leaderboard Sub-Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-lg">
        <button
          onClick={() => setActiveTab('daily')}
          className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'daily'
              ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-white shadow-lg shadow-amber-950/40 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <span className="text-base">☀️</span>
          <span>{isAr ? 'الترتيب اليومي' : 'Daily Rank'}</span>
        </button>

        <button
          onClick={() => setActiveTab('weekly')}
          className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'weekly'
              ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-white shadow-lg shadow-amber-950/40 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <span className="text-base">📅</span>
          <span>{isAr ? 'الترتيب الأسبوعي' : 'Weekly Rank'}</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'monthly'
              ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-white shadow-lg shadow-amber-950/40 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <span className="text-base">🏆</span>
          <span>{isAr ? 'الترتيب الشهري' : 'Monthly Rank'}</span>
        </button>
      </div>

      {/* Countdown & Reset Rules Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-400 shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-extrabold text-white">
              {activeTab === 'daily' && (isAr ? 'توزيع جوائز الترتيب اليومي بالكوينز (كل يوم الساعة 2:00 صباحاً ⏰)' : 'Daily Ranking Rewards (Every day at 02:00 AM):')}
              {activeTab === 'weekly' && (isAr ? 'توزيع جوائز الترتيب الأسبوعي بالكوينز (كل خميس 12:00 منتصف الليل):' : 'Weekly Ranking Rewards (Every Thursday at 12:00 AM):')}
              {activeTab === 'monthly' && (isAr ? 'توزيع جوائز الترتيب الشهري بالكوينز (أول كل شهر 12:00 منتصف الليل):' : 'Monthly Ranking Rewards (1st of month at 12:00 AM):')}
            </p>
            <p className="text-[11px] text-amber-300/90 mt-1 font-medium">
              {isAr
                ? 'توقع النتيجة الصحيحة للمباراة يمنحك +50 كوينز مباشرة لرصيدك لاستبدالها بكاش وجوائز فورية.'
                : 'Predicting the correct match score grants +50 coins directly to your balance to redeem cash prizes.'}
            </p>
          </div>
        </div>

        <div className="px-4 py-2 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-400 font-mono font-black text-sm sm:text-base tracking-wider shrink-0 shadow-inner">
          ⏳ {timeLeftStr}
        </div>
      </div>

      {/* Prize Rewards Distribution Table / Cards */}
      <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-400" />
          <span>
            {activeTab === 'daily' && (isAr ? 'جوائز الترتيب اليومي (توزع يومياً):' : 'Daily Ranking Rewards:')}
            {activeTab === 'weekly' && (isAr ? 'جوائز الترتيب الأسبوعي (توزع أسبوعياً):' : 'Weekly Ranking Rewards:')}
            {activeTab === 'monthly' && (isAr ? 'جوائز الترتيب الشهري (توزع شهرياً):' : 'Monthly Ranking Rewards:')}
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
          {activeTab === 'daily' && (
            <>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                <span className="block font-black text-amber-400 text-sm">🥇 المركز 1</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">100 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                <span className="block font-black text-slate-200 text-sm">🥈 المركز 2</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">75 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-800/20 border border-amber-800/40 text-center">
                <span className="block font-black text-amber-500 text-sm">🥉 المركز 3</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">50 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <span className="block font-black text-emerald-400 text-sm">🏅 المركز 4</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">30 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="block font-bold text-slate-300 text-xs">🏅 المراكز 5 - 10</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">30 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center col-span-2 sm:col-span-1">
                <span className="block font-bold text-slate-400 text-xs">🎗️ المراكز 11 - 20</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">20 كوينز 🪙</span>
              </div>
            </>
          )}

          {activeTab === 'weekly' && (
            <>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                <span className="block font-black text-amber-400 text-sm">🥇 المركز 1</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">1,000 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                <span className="block font-black text-slate-200 text-sm">🥈 المركز 2</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">750 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-800/20 border border-amber-800/40 text-center">
                <span className="block font-black text-amber-500 text-sm">🥉 المركز 3</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">500 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="block font-bold text-slate-300 text-xs">🏅 المراكز 4 - 10</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">300 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="block font-bold text-slate-400 text-xs">🎗️ المراكز 11 - 20</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">200 كوينز 🪙</span>
              </div>
            </>
          )}

          {activeTab === 'monthly' && (
            <>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center col-span-1">
                <span className="block font-black text-amber-400 text-xs">🥇 المركز 1</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">2,000 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center col-span-1">
                <span className="block font-black text-slate-200 text-xs">🥈 المركز 2</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">1,750 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-800/20 border border-amber-800/40 text-center col-span-1">
                <span className="block font-black text-amber-500 text-xs">🥉 المركز 3</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">1,500 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center col-span-1">
                <span className="block font-bold text-slate-300 text-xs">🏅 المراكز 4-10</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">600 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center col-span-1">
                <span className="block font-bold text-slate-400 text-xs">🎗️ المراكز 11-20</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">400 كوينز 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center col-span-2 sm:col-span-1">
                <span className="block font-bold text-slate-400 text-xs">🎗️ المراكز 21-50</span>
                <span className="block font-mono font-extrabold text-amber-300 mt-1">200 كوينز 🪙</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Leaderboard Rankings List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-1 p-2 sm:p-4">
        <div className="px-4 py-3 bg-slate-950 rounded-2xl flex items-center justify-between text-xs font-extrabold text-slate-400 mb-2 border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="w-8 text-center">#</span>
            <span>{isAr ? 'اسم المتوقع' : 'Predictor Name'}</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline">{isAr ? 'توقعات صحيحة' : 'Exact Scores'}</span>
            <span>{isAr ? 'رصيد الكوينز 🪙' : 'Coins Balance'}</span>
          </div>
        </div>

        {usersList.map((user) => {
          const isCurrentUser = user.displayName === currentUserDisplayName;
          const prizeText = getEstimatedPrize(user.rank || 99, activeTab, user.coins);

          return (
            <div
              key={user.id}
              className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                isCurrentUser
                  ? 'bg-gradient-to-r from-amber-500/20 via-slate-900 to-emerald-950 border-amber-400 shadow-xl ring-2 ring-amber-400/40'
                  : user.rank === 1
                  ? 'bg-slate-950 border-amber-500/60 shadow-lg'
                  : user.rank === 2
                  ? 'bg-slate-950 border-slate-400/50 shadow'
                  : user.rank === 3
                  ? 'bg-slate-950 border-amber-800/50 shadow'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Rank & User Info */}
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  {user.rank === 1 && <span className="text-2xl animate-bounce">🥇</span>}
                  {user.rank === 2 && <span className="text-2xl">🥈</span>}
                  {user.rank === 3 && <span className="text-2xl">🥉</span>}
                  {user.rank && user.rank > 3 && (
                    <span
                      className={`w-7 h-7 rounded-full text-xs font-black font-mono flex items-center justify-center border ${
                        user.rank <= 10
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {user.rank}
                    </span>
                  )}
                </div>

                {/* Avatar & Display Name */}
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold shrink-0">
                    {user.rankBadge || '⚽'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4
                        className={`font-black text-sm sm:text-base line-clamp-1 ${
                          isCurrentUser ? 'text-amber-300 font-extrabold' : 'text-white'
                        }`}
                      >
                        {user.displayName}
                      </h4>
                      {isCurrentUser && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-400/40">
                          {isAr ? 'حسابك' : 'You'}
                        </span>
                      )}
                    </div>

                    {/* Estimated Prize Badge if in top ranks & coins > 0 */}
                    {prizeText && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-400 mt-1 block">
                        <span>جائزة المرتبة: {prizeText}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Coins & Exact Count */}
              <div className="flex items-center gap-4 sm:gap-8 text-right rtl:text-left shrink-0">
                <div className="hidden sm:block text-slate-400 font-mono text-xs font-bold">
                  🎯 {user.exactPredictions} {isAr ? 'صح' : 'exact'}
                </div>

                <div className="text-right rtl:text-left">
                  <span className="block text-base sm:text-lg font-mono font-black text-amber-400">
                    🪙 {user.coins ?? 0}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-bold">
                    {isAr ? 'كوينز' : 'coins'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
