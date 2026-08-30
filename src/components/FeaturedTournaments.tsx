import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Sparkles, Gift, MapPin, User, ArrowRight, ShieldCheck, CheckCircle2, Flame, Coins, Clock, CheckCircle, AlertCircle, Award, ListFilter, Radio } from 'lucide-react';
import { Language, ThemeMode, Match } from '../types';
import { TeamLogo } from './TeamLogo';

// Countdown formatter helper function matching MatchCard
function formatCountdown(kickoffMs?: number): string {
  if (!kickoffMs) return '00:00:00';
  const diff = kickoffMs - Date.now();
  if (diff <= 0) return '00:00:00:00';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (days > 0) {
    return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

interface TournamentMatchItemProps {
  match: Match;
  language: Language;
  theme: ThemeMode;
  userPred?: { predictedHomeScore: number; predictedAwayScore: number };
  onOpenDetails?: (match: Match, tab?: 'lineup' | 'stats' | 'events' | 'ai' | 'predict') => void;
}

const TournamentMatchItem: React.FC<TournamentMatchItemProps> = ({
  match,
  language,
  theme,
  userPred,
  onOpenDetails,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  const isLive = match.status === 'LIVE' || match.status === 'HALF_TIME';
  const isFinished = match.status === 'FINISHED' || match.pointsDistributed === true;
  const isStarted = isLive || isFinished || match.isPredictionClosed || (!!match.kickoffTimeMs && Date.now() >= match.kickoffTimeMs);
  const isUpcoming = !isFinished && !isLive && match.status === 'UPCOMING';
  const coinsReward = match.customCoinsReward || 50;

  const [countdownStr, setCountdownStr] = useState<string>(() => formatCountdown(match.kickoffTimeMs));

  useEffect(() => {
    if (!isUpcoming) return;
    const interval = setInterval(() => {
      setCountdownStr(formatCountdown(match.kickoffTimeMs));
    }, 1000);
    return () => clearInterval(interval);
  }, [isUpcoming, match.kickoffTimeMs]);

  // Check if prediction is exact match
  const isExactPrediction = isFinished && userPred && 
    match.homeScore === userPred.predictedHomeScore && 
    match.awayScore === userPred.predictedAwayScore;

  // Extract goal events for preview in finished matches
  const goalEvents = useMemo(() => {
    if (!match.events || match.events.length === 0) return [];
    return match.events.filter((e) => {
      const type = (e.type || '').toUpperCase();
      return type.includes('GOAL') || type === 'PENALTY_GOAL';
    });
  }, [match.events]);

  return (
    <div
      className={`rounded-3xl border p-4 sm:p-5 transition-all shadow-sm ${
        isFinished
          ? isDark
            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-white'
            : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-900'
          : isDark
            ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50 text-white shadow-amber-950/10'
            : 'bg-white border-slate-200 hover:border-amber-400 text-slate-900 shadow-sm'
      }`}
    >
      {/* Top Header Row: League Tag, Coins Reward & Match Status */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 truncate">
          <span className="text-sm shrink-0">{match.leagueIcon || '🏆'}</span>
          <span className="truncate">{isAr ? match.leagueNameAr : match.leagueName}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status Badge: Finished / Distributed or Coins reward */}
          {isFinished ? (
            <div className="flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAr ? 'تم توزيع النقاط والكوينز 🪙' : 'Points & Coins Awarded 🪙'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300 shadow-xs">
              <Coins className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
              <span>{isAr ? `${coinsReward} كوينز 🪙` : `${coinsReward} Coins 🪙`}</span>
            </div>
          )}

          <div className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
            isFinished
              ? isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          }`}>
            <span>{isAr ? match.dateAr || match.dayLabelAr || 'الجمعة، 8/28' : match.date}</span>
            <span>•</span>
            <span>{match.time}</span>
          </div>
        </div>
      </div>

      {/* Special Banner */}
      {!isFinished ? (
        <div className="mb-3.5 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-black text-amber-700 dark:text-amber-300 truncate">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">
              {isAr ? `مكافأة خاصة لهذه المباراة: ${coinsReward} كوينز عند صحة التوقع!` : `Special Match Reward: ${coinsReward} Coins for correct score!`}
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 shrink-0">
            {isAr ? 'مباراة جارية 🔥' : 'Active Match 🔥'}
          </span>
        </div>
      ) : (
        <div className="mb-3.5 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 truncate">
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">
              {isAr ? `نتيجة معتمدة وموزع عليها ${coinsReward} كوينز للمتوقعين الفائزين` : `Final score approved with ${coinsReward} Coins awarded to winners`}
            </span>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
            {isAr ? 'منتهية 🏁' : 'Concluded 🏁'}
          </span>
        </div>
      )}

      {/* Teams & Scoreboard Display with Date, Time, and Countdown Timer */}
      <div 
        onClick={() => onOpenDetails && onOpenDetails(match, isFinished ? 'stats' : 'lineup')}
        className="grid grid-cols-7 items-center gap-2 py-2 cursor-pointer"
      >
        {/* Home Team */}
        <div className="col-span-3 flex flex-col items-center sm:items-start text-center sm:text-left rtl:sm:text-right gap-1.5 min-w-0">
          <div className="relative hover:scale-105 transition-transform duration-200">
            <TeamLogo
              teamName={match.homeTeam}
              logo={match.homeLogo}
              sizeClassName="w-12 h-12 sm:w-14 sm:h-14"
              className="drop-shadow-sm"
            />
          </div>
          <div className="w-full">
            <span className={`block font-black text-xs sm:text-sm line-clamp-1 tracking-tight ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>
              {isAr ? match.homeTeamAr || match.homeTeam : match.homeTeam}
            </span>
            {isAr && match.homeTeamAr && (
              <span className={`block text-[10px] font-semibold line-clamp-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {match.homeTeam}
              </span>
            )}
          </div>
        </div>

        {/* Center Countdown Timer Badge / Kickoff Time & Date or Score */}
        <div className="col-span-1 flex flex-col items-center justify-center text-center gap-1">
          {isUpcoming ? (
            <div className="flex flex-col items-center gap-1">
              <span className={`text-[10px] font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isAr ? (match.dateAr || match.dayLabelAr || 'اليوم') : match.date}
              </span>
              <div className={`text-base sm:text-lg font-black tracking-tight font-mono ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {match.time}
              </div>
              <div className={`px-2 py-0.5 font-mono font-black text-[9px] tracking-wider rounded-lg border shadow-inner whitespace-nowrap ${
                isDark ? 'bg-slate-950 text-cyan-400 border-cyan-500/30' : 'bg-teal-50 text-teal-800 border-teal-200'
              }`}>
                {countdownStr}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              {isLive && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 animate-pulse shadow-sm ${
                  isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{match.minute ? (isAr ? `د ${match.minute}'` : `${match.minute}'`) : (isAr ? 'مباشر' : 'LIVE')}</span>
                </span>
              )}
              {isFinished && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {isAr ? 'نهاية المباراة' : 'Full Time'}
                </span>
              )}
              <div className={`flex items-center gap-1.5 font-black text-2xl sm:text-3xl font-mono px-3 py-1 rounded-xl border shadow-inner ${
                isDark ? 'bg-slate-950 text-white border-slate-800' : 'bg-slate-100 text-slate-900 border-slate-200'
              }`}>
                <span className={match.homeScore > match.awayScore ? 'text-emerald-500 font-black' : isDark ? 'text-slate-200' : 'text-slate-800'}>
                  {match.homeScore}
                </span>
                <span className={`${isDark ? 'text-slate-600' : 'text-slate-400'} text-lg font-light`}>-</span>
                <span className={match.awayScore > match.homeScore ? 'text-emerald-500 font-black' : isDark ? 'text-slate-200' : 'text-slate-800'}>
                  {match.awayScore}
                </span>
              </div>

              {/* User prediction or Unpredicted status */}
              {userPred ? (
                <div className={`mt-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black border shadow-xs whitespace-nowrap flex items-center justify-center gap-1 ${
                  isFinished
                    ? isExactPrediction
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 ring-1 ring-emerald-500/40'
                      : isDark ? 'bg-slate-900 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                    : isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  <span>🎯</span>
                  <span>{isAr ? 'توقعك:' : 'Pred:'}</span>
                  <span className="font-mono font-black">{userPred.predictedHomeScore}</span>
                  <span className="text-slate-400 font-bold">-</span>
                  <span className="font-mono font-black">{userPred.predictedAwayScore}</span>
                  {isExactPrediction && (
                    <span className="text-emerald-400 font-bold">✓</span>
                  )}
                </div>
              ) : (
                <div className={`mt-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-tight whitespace-nowrap flex items-center justify-center gap-1 border ${
                  isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  <span className="text-rose-400">❌</span>
                  <span>{isAr ? 'لم تتوقع' : 'No pred'}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="col-span-3 flex flex-col items-center sm:items-end text-center sm:text-right rtl:sm:text-left gap-1.5 min-w-0">
          <div className="relative hover:scale-105 transition-transform duration-200">
            <TeamLogo
              teamName={match.awayTeam}
              logo={match.awayLogo}
              sizeClassName="w-12 h-12 sm:w-14 sm:h-14"
              className="drop-shadow-sm"
            />
          </div>
          <div className="w-full">
            <span className={`block font-black text-xs sm:text-sm line-clamp-1 tracking-tight ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>
              {isAr ? match.awayTeamAr || match.awayTeam : match.awayTeam}
            </span>
            {isAr && match.awayTeamAr && (
              <span className={`block text-[10px] font-semibold line-clamp-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {match.awayTeam}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Goal Scorers Snippet for Finished Matches */}
      {isFinished && goalEvents.length > 0 && (
        <div className="mt-2.5 p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-2 overflow-x-auto">
          <span className="font-black text-amber-500 shrink-0">⚽ {isAr ? 'الأهداف:' : 'Goals:'}</span>
          <div className="flex items-center gap-2 flex-wrap text-[10px]">
            {goalEvents.slice(0, 4).map((evt, idx) => (
              <span key={evt.id || idx} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold whitespace-nowrap">
                {isAr ? (evt.playerNameAr || evt.playerAr || evt.playerName || evt.player || 'هدف') : (evt.playerName || evt.player || 'Goal')} ({evt.minute}')
              </span>
            ))}
            {goalEvents.length > 4 && (
              <span className="text-slate-500 font-bold">+{goalEvents.length - 4}</span>
            )}
          </div>
        </div>
      )}

      {/* Venue & Referee */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{isAr ? match.venueAr || match.venue : match.venue}</span>
        </div>
        {(match.refereeAr || match.referee) && (
          <div className="flex items-center gap-1 shrink-0">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{isAr ? match.refereeAr || match.referee : match.referee}</span>
          </div>
        )}
      </div>

      {/* Prediction State & Quick Actions */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {userPred ? (
          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border flex-wrap ${
            isExactPrediction
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isExactPrediction ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span>{isAr ? 'توقعك للمباراة:' : 'Your Prediction:'}</span>
            <div className="inline-flex items-center gap-1 font-mono font-black text-amber-600 dark:text-amber-300">
              <span>{isAr ? (match.homeTeamAr || match.homeTeam) : match.homeTeam}</span>
              <span className="text-emerald-500 font-bold">{userPred.predictedHomeScore}</span>
              <span className="text-slate-400">-</span>
              <span className="text-teal-500 font-bold">{userPred.predictedAwayScore}</span>
              <span>{isAr ? (match.awayTeamAr || match.awayTeam) : match.awayTeam}</span>
            </div>
            {isExactPrediction && (
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-500 text-white shadow-xs">
                +{coinsReward} 🪙
              </span>
            )}
          </div>
        ) : isFinished ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-rose-500 font-bold">❌</span>
            <span>{isAr ? 'لم تقم بالتوقع لهذا الماتش' : 'You did not predict this match'}</span>
          </div>
        ) : (
          <button
            onClick={() => onOpenDetails && onOpenDetails(match, 'predict')}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:from-amber-400 hover:to-emerald-500 text-white font-black text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🎯</span>
            <span>
              {isAr ? `توقع النتيجة واربح ${coinsReward} كوينز 🪙` : `Predict & Win ${coinsReward} Coins 🪙`}
            </span>
          </button>
        )}

        <button
          onClick={() => onOpenDetails && onOpenDetails(match, isFinished ? 'stats' : 'lineup')}
          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors shrink-0 cursor-pointer ${
            isDark
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
              : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
          }`}
        >
          {isFinished ? (isAr ? 'الإحصائيات والنتيجة' : 'Stats & Summary') : (isAr ? 'التشكيل والتفاصيل' : 'Lineups & Info')}
        </button>
      </div>
    </div>
  );
};

interface FeaturedTournamentsProps {
  language: Language;
  theme?: ThemeMode;
  tournamentMatches?: Match[];
  onOpenDetails?: (match: Match, tab?: 'lineup' | 'stats' | 'events' | 'ai' | 'predict') => void;
  userPredictions?: Record<string, { predictedHomeScore: number; predictedAwayScore: number }>;
  onSavePrediction?: (match: Match, homeScore: number, awayScore: number) => void;
  onOpenRewards?: () => void;
  onClose?: () => void;
  onGoogleSync?: () => void;
  isSyncingGoogle?: boolean;
}

export const FeaturedTournaments: React.FC<FeaturedTournamentsProps> = ({
  language,
  theme = 'light',
  tournamentMatches = [],
  onOpenDetails,
  userPredictions = {},
  onSavePrediction,
  onOpenRewards,
  onClose,
  onGoogleSync,
  isSyncingGoogle = false,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  // Sub-tab filter state: 'all' | 'ongoing' | 'finished'
  const [filterTab, setFilterTab] = useState<'all' | 'ongoing' | 'finished'>('all');

  // Segregate matches into Ongoing and Finished
  const { ongoingMatches, finishedMatches } = useMemo(() => {
    const ongoing: Match[] = [];
    const finished: Match[] = [];

    tournamentMatches.forEach((m) => {
      const isFin = m.status === 'FINISHED' || m.pointsDistributed === true;
      if (isFin) {
        finished.push(m);
      } else {
        ongoing.push(m);
      }
    });

    return { ongoingMatches: ongoing, finishedMatches: finished };
  }, [tournamentMatches]);

  return (
    <div className="space-y-5 animate-fadeIn pb-16 pt-1">
      {/* Top Header Row with Close / Back Action */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'صفحة البطولات وقِمم الكؤوس 🏆' : 'Cups & Tournaments 🏆'}
            </h2>
            <p className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
              {isAr ? 'المباريات والقمم المخصصة للبطولة' : 'Dedicated Tournament Fixtures'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق والرجوع للمباريات' : 'Close & Back to Matches'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black text-xs shadow-sm transition-all cursor-pointer active:scale-95 border border-rose-400/40 select-none"
          >
            <span>✕</span>
            <span>{isAr ? 'إغلاق (×)' : 'Close (×)'}</span>
          </button>
        )}
      </div>

      {/* Tournament Top Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 border shadow-md transition-all ${
        isDark
          ? 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-indigo-950/70 border-amber-500/40 text-white shadow-amber-950/20'
          : 'bg-gradient-to-br from-amber-50 via-white to-amber-100/60 border-amber-300 text-slate-950 shadow-sm'
      }`}>
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="space-y-1.5 flex-1">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wide border shadow-xs ${
              isDark ? 'bg-amber-500/20 border-amber-400/50 text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-900'
            }`}>
              <Trophy className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'} animate-pulse`} />
              <span>{isAr ? 'البطولات وقِمم الكؤوس 🏆' : 'Featured Cups & Tournaments 🏆'}</span>
            </div>
            <h3 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
              {isAr ? 'مباريات وقِمم البطولات والكؤوس الرسمية' : 'Official Cup & Tournament Fixtures'}
            </h3>
            <p className={`text-xs font-bold leading-relaxed max-w-sm ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              {isAr
                ? 'توقع مباريات وقِمم البطولات واربح 50 إلى 100 كوينز وجوائز كاش فورية عبر إنستاباي!'
                : 'Predict top tournament fixtures to win 50-100 coins and instant InstaPay cash prizes!'}
            </p>
          </div>

          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-xl sm:text-2xl shadow-lg shrink-0 border border-amber-200/40">
            🏆
          </div>
        </div>

        {/* Prizes Teaser Pill */}
        <div className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 text-xs font-bold ${
          isDark ? 'border-amber-500/20 text-amber-400' : 'border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-1.5 font-bold">
            <Gift className={`w-4 h-4 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            <span>{isAr ? 'جوائز نقدية أسبوعية كاش عبر إنستاباي + كوينز للمتصدرين' : 'Weekly InstaPay Cash Prizes & Coins for Top Predictors'}</span>
          </div>
          {onOpenRewards && (
            <button
              onClick={onOpenRewards}
              className={`text-[11px] font-black underline flex items-center gap-1 cursor-pointer ${
                isDark ? 'text-amber-300 hover:text-amber-200' : 'text-amber-900 hover:text-amber-950'
              }`}
            >
              <span>{isAr ? 'تفاصيل الجوائز' : 'Prize Details'}</span>
              <ArrowRight className="w-3 h-3 rtl:rotate-180" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Google Live Score Connection Status Badge */}
      <div className={`py-2 px-3.5 rounded-2xl border flex items-center justify-between gap-2 shadow-xs transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className={`font-black truncate text-[11px] sm:text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            {isAr ? 'مُتصل ومُحدث بالوقت الفعلي تلقائياً' : 'Auto-synced with Live Matches in Real-Time'}
          </span>
        </div>
        <span className="text-[10px] font-black font-mono text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          LIVE
        </span>
      </div>

      {/* Modern Filter Tabs Switcher: [الكل] [المباريات الجارية ⏳] [المباريات المنتهية 🏁] */}
      <div className={`p-1.5 rounded-2xl border flex items-center justify-between gap-1 shadow-xs ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
      }`}>
        {/* All Tab */}
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            filterTab === 'all'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>{isAr ? 'الكل' : 'All'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            filterTab === 'all' ? 'bg-white/25 text-white' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
          }`}>
            {tournamentMatches.length}
          </span>
        </button>

        {/* Ongoing Tab */}
        <button
          type="button"
          onClick={() => setFilterTab('ongoing')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            filterTab === 'ongoing'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAr ? 'جارية ⏳' : 'Ongoing ⏳'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            filterTab === 'ongoing' ? 'bg-white/25 text-white' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
          }`}>
            {ongoingMatches.length}
          </span>
        </button>

        {/* Finished Tab */}
        <button
          type="button"
          onClick={() => setFilterTab('finished')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            filterTab === 'finished'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isAr ? 'منتهية 🏁' : 'Finished 🏁'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            filterTab === 'finished' ? 'bg-white/25 text-white' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
          }`}>
            {finishedMatches.length}
          </span>
        </button>
      </div>

      {/* SECTION 1: ONGOING MATCHES (المباريات الجارية والقادمة) */}
      {((filterTab === 'all' && ongoingMatches.length > 0) || filterTab === 'ongoing') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <h3 className={`text-sm font-black flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                <span>{isAr ? 'المباريات الجارية والقادمة ⏳' : 'Ongoing & Upcoming Matches ⏳'}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {ongoingMatches.length} {isAr ? 'مباراة' : 'matches'}
                </span>
              </h3>
            </div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              {isAr ? 'فرص التوقع متاحة 🪙' : 'Predictions Open 🪙'}
            </span>
          </div>

          {ongoingMatches.length > 0 ? (
            <div className="space-y-3">
              {ongoingMatches.map((match) => (
                <TournamentMatchItem
                  key={match.id}
                  match={match}
                  language={language}
                  theme={theme}
                  userPred={userPredictions[match.id]}
                  onOpenDetails={onOpenDetails}
                />
              ))}
            </div>
          ) : (
            <div className={`p-6 rounded-3xl border text-center space-y-3 ${
              isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="text-2xl">⏳</div>
              <p className="text-xs font-bold text-slate-300 dark:text-slate-300">
                {isAr ? 'لا توجد مباريات جارية حالياً في هذه البطولة' : 'No active ongoing matches currently in this tournament'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'جميع المباريات المضافة حالياً قد انتهت وتم اعتماد نتائجها وتوزيع كوينزها' : 'All currently added tournament matches have finished and awarded coins'}
              </p>
              {filterTab === 'ongoing' && (
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  {isAr ? 'عرض جميع المباريات والنتائج 🔄' : 'View All Matches & Results 🔄'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Divider if showing All and both ongoing and finished exist */}
      {filterTab === 'all' && ongoingMatches.length > 0 && finishedMatches.length > 0 && (
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-100 dark:bg-slate-900 px-3 py-0.5 text-[11px] font-black text-slate-500 rounded-full border border-slate-200 dark:border-slate-800 shadow-xs">
              {isAr ? 'نتائج المباريات وتوزيع الجوائز' : 'Results & Points Distribution'}
            </span>
          </div>
        </div>
      )}

      {/* SECTION 2: FINISHED MATCHES (المباريات المنتهية وتوزيع النقاط) */}
      {((filterTab === 'all' && finishedMatches.length > 0) || filterTab === 'finished') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <h3 className={`text-sm font-black flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                <span>{isAr ? 'المباريات المنتهية وتوزيع النقاط 🏁' : 'Finished & Evaluated Matches 🏁'}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  {finishedMatches.length} {isAr ? 'مباراة' : 'matches'}
                </span>
              </h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {isAr ? 'تم توزيع الكوينز ✓' : 'Coins Awarded ✓'}
            </span>
          </div>

          {finishedMatches.length > 0 ? (
            <div className="space-y-3">
              {finishedMatches.map((match) => (
                <TournamentMatchItem
                  key={match.id}
                  match={match}
                  language={language}
                  theme={theme}
                  userPred={userPredictions[match.id]}
                  onOpenDetails={onOpenDetails}
                />
              ))}
            </div>
          ) : (
            <div className={`p-6 rounded-3xl border text-center space-y-3 ${
              isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="text-2xl">🏁</div>
              <p className="text-xs font-bold">
                {isAr ? 'لا توجد مباريات منتهية مسجلة حتى الآن' : 'No finished matches recorded yet'}
              </p>
              {filterTab === 'finished' && (
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  {isAr ? 'عرض جميع المباريات 🔄' : 'View All Matches 🔄'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Global Empty State if absolutely no matches exist at all */}
      {tournamentMatches.length === 0 && (
        <div className={`p-8 rounded-3xl border text-center space-y-3 ${
          isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
        }`}>
          <Trophy className="w-12 h-12 mx-auto text-amber-400 animate-bounce" />
          <h3 className="font-black text-sm text-slate-900 dark:text-white">
            {isAr ? 'سيتم إضافة مباريات البطولة المميزة قريباً' : 'Featured Tournament Matches Coming Soon'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {isAr ? 'ترقبوا قمم الكؤوس والبطولات المحددة لمضاعفة أرباح الكوينز والجوائز الكاش!' : 'Stay tuned for top cup clashes to double your coin rewards and cash prizes!'}
          </p>
        </div>
      )}

      {/* Info notice about upcoming tournament additions */}
      <div className={`p-4 rounded-3xl border text-center text-xs space-y-1.5 ${
        isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center justify-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{isAr ? 'بطولات وجوائز متجددة باستمرار 🏆' : 'Regularly Updated Cups & Tournaments 🏆'}</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          {isAr
            ? 'تضاف نتائج وجولات الكؤوس والبطولات المجمعة فور صدورها واعتمادها رسمياً، مع توزيع فوري لـ 50 إلى 100 كوينز لكل توقع صحيح.'
            : 'Cup and tournament results are updated instantly upon official completion with immediate coins distribution for exact scores.'}
        </p>
      </div>
    </div>
  );
};
