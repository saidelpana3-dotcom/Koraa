import React, { useState, useEffect } from 'react';
import { Match, Language, ThemeMode } from '../types';
import { Sparkles, Activity, Clock, Shield, Heart, Bell } from 'lucide-react';
import { TeamLogo } from './TeamLogo';

interface MatchCardProps {
  match: Match;
  language: Language;
  theme?: ThemeMode;
  onOpenDetails: (match: Match, tab?: 'lineup' | 'stats' | 'events' | 'ai' | 'predict') => void;
  isFavorite: boolean;
  onToggleFavorite: (match: Match) => void;
  isSubscribed?: boolean;
  onOpenSubscribeModal?: (match: Match) => void;
  userPrediction?: { predictedHomeScore: number; predictedAwayScore: number };
}

// Countdown formatter helper function
function formatCountdown(kickoffMs?: number): string {
  if (!kickoffMs) return '21:08:58:45';
  const diff = kickoffMs - Date.now();
  if (diff <= 0) return '00:00:00:00';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  language,
  theme = 'light',
  onOpenDetails,
  isFavorite,
  onToggleFavorite,
  isSubscribed = false,
  onOpenSubscribeModal,
  userPrediction,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  const isLive = match.status === 'LIVE' || match.status === 'HALF_TIME';
  const isStarted = isLive || match.status === 'FINISHED' || match.isPredictionClosed || (!!match.kickoffTimeMs && Date.now() >= match.kickoffTimeMs);
  const isUpcoming = match.status === 'UPCOMING' && !isStarted;
  const isPredictionAllowed = isUpcoming && !match.isPredictionClosed;

  const [countdownStr, setCountdownStr] = useState<string>(() => formatCountdown(match.kickoffTimeMs));

  useEffect(() => {
    if (!isUpcoming) return;
    const interval = setInterval(() => {
      setCountdownStr(formatCountdown(match.kickoffTimeMs));
    }, 1000);
    return () => clearInterval(interval);
  }, [isUpcoming, match.kickoffTimeMs]);

  return (
    <div className={`group relative rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${
      isDark
        ? isLive
          ? 'bg-slate-900/95 border-emerald-500/70 shadow-lg shadow-emerald-950/50 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/30 text-white'
          : 'bg-slate-900/95 border-slate-800 hover:border-slate-700 text-white'
        : isLive
          ? 'bg-white border-emerald-500 shadow-md shadow-emerald-100 bg-gradient-to-b from-white via-white to-emerald-50/40 text-slate-900'
          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-sm'
    }`}>
      {/* Points Distributed Banner */}
      {(match.status === 'FINISHED' || match.pointsDistributed) && (
        <div className={`w-full border-b px-3 py-1.5 flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm tracking-wide ${
          isDark
            ? 'bg-gradient-to-r from-emerald-950 via-emerald-900/90 to-emerald-950 border-emerald-500/50 text-emerald-300'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>{isAr ? '✨ تم توزيع النقاط لهذا الماتش' : '✨ Points Distributed for this Match'}</span>
        </div>
      )}

      {/* Top Banner: Date & League */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 border-b text-xs ${
        isDark ? 'bg-slate-950/90 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'
      }`}>
        <div className="flex items-center gap-2 font-bold min-w-0">
          <span className={`font-extrabold text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isAr ? (match.dateAr || match.date) : `${match.date}`}{isUpcoming ? ` • ${match.time}` : ''}
          </span>
          <span className={`${isDark ? 'text-slate-700' : 'text-slate-300'} font-light`}>•</span>
          <span className={`flex items-center gap-1.5 font-extrabold text-[11px] truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            <span className="text-sm">{match.leagueIcon || '⚽'}</span>
            <span className="truncate">{isAr ? match.leagueNameAr : match.leagueName}</span>
          </span>
        </div>

        {/* Favorite Toggle & Status */}
        <div className="flex items-center gap-1.5 shrink-0">
          {match.isGoogleSynced && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-black text-[9px] shadow-sm border ${
              isDark ? 'bg-blue-500/15 border-blue-500/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
            }`} title={isAr ? 'مُتصل ومُزامن بالوقت الفعلي مع نتائج جوجل المباشرة' : 'Synced with Google Live Scores'}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span>{isAr ? 'جوجل لايف' : 'Live'}</span>
            </span>
          )}

          {isLive ? (
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-black text-[10px] shadow-sm animate-pulse border ${
              isDark ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-800'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{isAr ? `مباشر (${match.minute ? match.minute + "'" : 'شغال'})` : `LIVE (${match.minute ? match.minute + "'" : 'Live'})`}</span>
            </div>
          ) : isUpcoming ? (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-mono font-black border ${
              isDark ? 'bg-slate-900 border-slate-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <Clock className="w-3 h-3 text-amber-500" />
              <span>{match.time}</span>
            </div>
          ) : (
            <div className={`px-2.5 py-0.5 rounded-full border font-black text-[10px] ${
              isDark ? 'bg-slate-800/90 text-slate-400 border-slate-700/60' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {isAr ? 'انتهت' : 'FT'}
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenSubscribeModal) onOpenSubscribeModal(match);
            }}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer active:scale-90 ${
              isSubscribed
                ? 'bg-amber-500/20 text-amber-500 border-amber-500/50 ring-1 ring-amber-400/30'
                : isDark
                  ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-300 hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-amber-600 hover:bg-slate-200'
            }`}
            title={isAr ? 'تفعيل تنبيهات الإشعارات المباشرة' : 'Subscribe to Push Alerts'}
          >
            <Bell className={`w-3.5 h-3.5 ${isSubscribed ? 'fill-amber-500 text-amber-500' : ''}`} />
          </button>

          <button
            onClick={() => onToggleFavorite(match)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer active:scale-90 ${
              isDark
                ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-rose-400 hover:bg-slate-800'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-rose-500 hover:bg-slate-200'
            }`}
            title={isAr ? 'إضافة للمفضلة' : 'Add to Favorites'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Scoreboard Content */}
      <div 
        onClick={() => onOpenDetails(match, 'lineup')}
        className={`p-3.5 sm:p-4 cursor-pointer grid grid-cols-7 items-center gap-2 transition-colors ${
          isDark
            ? 'bg-gradient-to-b from-slate-900/60 to-slate-950/90 hover:bg-slate-900/90'
            : 'bg-white hover:bg-slate-50/80'
        }`}
      >
        {/* Home Team */}
        <div className="col-span-3 flex flex-col items-center sm:items-start text-center sm:text-left rtl:sm:text-right gap-1.5 min-w-0">
          <div className="relative group-hover:scale-110 transition-transform duration-200">
            <TeamLogo
              teamName={match.homeTeam}
              logo={match.homeLogo}
              sizeClassName="w-12 h-12 sm:w-13 sm:h-13"
              className="drop-shadow-sm"
            />
          </div>
          <div className="w-full">
            <span className={`block font-black text-xs sm:text-sm line-clamp-1 tracking-tight ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>
              {match.homeTeam}
            </span>
            {isAr && match.homeTeamAr && (
              <span className={`block text-[10px] font-semibold line-clamp-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {match.homeTeamAr}
              </span>
            )}
          </div>
        </div>

        {/* Center Timer Badge / Versus / Score */}
        <div className="col-span-1 flex flex-col items-center justify-center text-center gap-1">
          {isUpcoming ? (
            <div className="flex flex-col items-center gap-1">
              <span className={`text-[10px] font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {match.dateAr || 'اليوم'}
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

              {/* User Prediction or Unpredicted status right under live / final score */}
              {userPrediction ? (
                <div className={`mt-1 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-tight whitespace-nowrap flex items-center justify-center gap-1 border shadow-xs ${
                  match.status === 'FINISHED'
                    ? (match.homeScore === userPrediction.predictedHomeScore && match.awayScore === userPrediction.predictedAwayScore)
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : isDark ? 'bg-slate-900 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                    : isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  <span>🎯</span>
                  <span>{isAr ? 'توقعك:' : 'Pred:'}</span>
                  <span className="font-mono font-black">{userPrediction.predictedHomeScore}</span>
                  <span className="text-slate-400 font-bold">-</span>
                  <span className="font-mono font-black">{userPrediction.predictedAwayScore}</span>
                  {match.status === 'FINISHED' && match.homeScore === userPrediction.predictedHomeScore && match.awayScore === userPrediction.predictedAwayScore && (
                    <span className="text-emerald-500 font-black">✓</span>
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
          <div className="relative group-hover:scale-110 transition-transform duration-200">
            <TeamLogo
              teamName={match.awayTeam}
              logo={match.awayLogo}
              sizeClassName="w-12 h-12 sm:w-13 sm:h-13"
              className="drop-shadow-sm"
            />
          </div>
          <div className="w-full">
            <span className={`block font-black text-xs sm:text-sm line-clamp-1 tracking-tight ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>
              {match.awayTeam}
            </span>
            {isAr && match.awayTeamAr && (
              <span className={`block text-[10px] font-semibold line-clamp-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {match.awayTeamAr}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Footer */}
      <div className={`px-3 py-2 border-t flex items-center justify-between text-[11px] font-black gap-2 ${
        isDark ? 'bg-slate-950/70 border-slate-800/80' : 'bg-slate-50/80 border-slate-100'
      }`}>
        <button
          onClick={() => onOpenDetails(match, 'lineup')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40 hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isAr ? 'التشكيلة' : 'Lineups'}</span>
        </button>

        <button
          onClick={() => onOpenDetails(match, 'ai')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border transition-all text-[11px] font-black cursor-pointer active:scale-95 shadow-sm ${
            isDark
              ? 'bg-teal-950/40 border-teal-500/40 text-teal-300 hover:text-teal-200 hover:bg-teal-900/50'
              : 'bg-teal-50 border-teal-200 text-teal-800 hover:text-teal-900 hover:bg-teal-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
          <span>{isAr ? 'تحليل AI 🤖' : 'AI Analyst 🤖'}</span>
        </button>

        <button
          onClick={() => onOpenDetails(match, 'stats')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-700 hover:text-amber-700 hover:border-amber-300 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-500" />
          <span>{isAr ? 'الإحصائيات' : 'Stats'}</span>
        </button>
      </div>

      {/* Prominent Predict Now Button */}
      <div className={`p-3 border-t ${
        isDark ? 'bg-gradient-to-b from-slate-950/95 to-slate-900/95 border-slate-800/80' : 'bg-slate-50 border-slate-200'
      }`}>
        {isPredictionAllowed ? (
          userPrediction ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(match, 'predict');
              }}
              className={`w-full py-2.5 px-3 border rounded-2xl flex items-center justify-center gap-2 shadow transition-all hover:scale-[1.01] active:scale-95 cursor-pointer font-black text-xs sm:text-sm ${
                isDark
                  ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-emerald-400/80 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-400 text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <span className="text-base">🎯</span>
              <span>
                {isAr
                  ? `توقعك: ${userPrediction.predictedHomeScore} - ${userPrediction.predictedAwayScore} (تعديل ✏️)`
                  : `Your Prediction: ${userPrediction.predictedHomeScore} - ${userPrediction.predictedAwayScore} (Edit ✏️)`}
              </span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(match, 'predict');
              }}
              className="w-full py-3 px-3 bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              <span className="text-base animate-bounce">🎯</span>
              <span className="tracking-wide">{isAr ? 'توقع الآن واربح ٥٠ كوينز 🪙' : 'Predict Now & Win +50 Coins 🪙'}</span>
            </button>
          )
        ) : (
          userPrediction ? (
            <div className={`w-full py-2.5 px-3 rounded-2xl flex items-center justify-between border font-black text-xs sm:text-sm gap-2 flex-wrap sm:flex-nowrap ${
              match.status === 'FINISHED'
                ? (match.homeScore === userPrediction.predictedHomeScore && match.awayScore === userPrediction.predictedAwayScore)
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                  : isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
            }`}>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>🎯</span>
                <span className="font-bold text-xs">
                  {isAr ? 'توقعك للمباراة:' : 'Your Prediction:'}
                </span>
                <div className="inline-flex items-center gap-1 font-mono font-black text-amber-600 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 text-xs">
                  <span>{isAr ? (match.homeTeamAr || match.homeTeam) : match.homeTeam}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{userPrediction.predictedHomeScore}</span>
                  <span className="text-slate-400">-</span>
                  <span className="text-teal-600 dark:text-teal-400 font-bold">{userPrediction.predictedAwayScore}</span>
                  <span>{isAr ? (match.awayTeamAr || match.awayTeam) : match.awayTeam}</span>
                </div>
              </div>
              {match.status === 'FINISHED' ? (
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-extrabold shadow-xs whitespace-nowrap ${
                  (match.homeScore === userPrediction.predictedHomeScore && match.awayScore === userPrediction.predictedAwayScore)
                    ? 'bg-emerald-500 text-white'
                    : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                }`}>
                  {(match.homeScore === userPrediction.predictedHomeScore && match.awayScore === userPrediction.predictedAwayScore)
                    ? (isAr ? 'توقع صحيح (+٥٠ كوينز) 🏆' : 'Exact (+50 Coins) 🏆')
                    : (isAr ? 'لم يصب التوقع' : 'Missed')}
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/30 whitespace-nowrap">
                  {isAr ? 'المباراة جارية' : 'Match Live'}
                </span>
              )}
            </div>
          ) : (
            <div className={`w-full py-2.5 px-3 rounded-2xl flex items-center justify-between border font-bold text-xs ${
              isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-rose-500 font-bold text-sm">❌</span>
                <span className="font-extrabold text-slate-200 dark:text-slate-300">
                  {isAr ? 'لم تقم بالتوقع لهذا الماتش' : 'You did not predict this match'}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-900 text-slate-400 border border-slate-800">
                {isAr ? 'التوقع مغلق 🔒' : 'Predictions Closed 🔒'}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
