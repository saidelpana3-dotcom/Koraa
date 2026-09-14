import React, { useState, useEffect } from 'react';
import { Match, Language, ThemeMode } from '../types';
import { Sparkles, Activity, Clock, Shield, Heart, Bell, CheckCircle } from 'lucide-react';
import { TeamLogo } from './TeamLogo';
import { isMatchLive, isMatchFinished, getMatchPlayedMinute } from '../data/matchHelpers';

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
  isFreePrediction?: boolean;
  remainingFreePredictions?: number;
}

interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

function getCountdownParts(kickoffMs?: number): CountdownParts {
  if (!kickoffMs) {
    return { days: '05', hours: '12', minutes: '19', seconds: '46' };
  }
  const diff = kickoffMs - Date.now();
  if (diff <= 0) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00' };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
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
  isFreePrediction = false,
  remainingFreePredictions = 0,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  const isFinished = isMatchFinished(match);
  const isLive = !isFinished && isMatchLive(match);
  const isUpcoming = !isFinished && !isLive;
  const isStarted = isLive || isFinished || match.isPredictionClosed || (!!match.kickoffTimeMs && Date.now() >= match.kickoffTimeMs);
  const isPredictionAllowed = isUpcoming && !match.isPredictionClosed;
  const playedMinute = getMatchPlayedMinute(match, isAr);

  const [countdownParts, setCountdownParts] = useState<CountdownParts>(() => getCountdownParts(match.kickoffTimeMs));
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    // High-frequency 1s interval for countdown & automatic transition to LIVE at kickoff
    const interval = setInterval(() => {
      if (match.kickoffTimeMs) {
        if (Date.now() >= match.kickoffTimeMs) {
          // Force re-render to instantly switch to LIVE state
          setTick((t) => t + 1);
        } else {
          setCountdownParts(getCountdownParts(match.kickoffTimeMs));
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [match.kickoffTimeMs]);

  // Determine atmospheric side glow gradients based on team colors or stadium lights
  const homeGlowColor = match.homeColor || '#dc2626';
  const awayGlowColor = match.awayColor || '#2563eb';

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden ${
        isDark
          ? 'bg-slate-900/95 border-slate-800 hover:border-slate-700 text-white shadow-sm'
          : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-900 shadow-xs'
      }`}
    >
      {/* Team Atmospheric Stadium Glow Lighting */}
      <div
        className="absolute top-0 bottom-0 left-0 w-[35%] pointer-events-none rounded-l-2xl opacity-20 dark:opacity-15 transition-opacity"
        style={{
          background: `radial-gradient(ellipse at left center, ${homeGlowColor} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute top-0 bottom-0 right-0 w-[35%] pointer-events-none rounded-r-2xl opacity-20 dark:opacity-15 transition-opacity"
        style={{
          background: `radial-gradient(ellipse at right center, ${awayGlowColor} 0%, transparent 70%)`,
        }}
      />

      {/* Top Bar: Controls (Left), Time Pill (Center), League & Date (Right) */}
      <div className="relative z-10 px-3 sm:px-4 pt-2.5 pb-1 flex items-center justify-between gap-2">
        {/* Left Side: Circular Favorite & Push Notification Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(match);
            }}
            className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-90 ${
              isFavorite
                ? 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/50 dark:border-rose-800'
                : isDark
                ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-rose-400 hover:border-rose-400'
                : 'bg-white/90 border-slate-200 text-slate-600 hover:text-rose-500 hover:border-rose-300'
            }`}
            title={isAr ? 'إضافة للمفضلة' : 'Add to Favorites'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenSubscribeModal) onOpenSubscribeModal(match);
            }}
            className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-90 ${
              isSubscribed
                ? 'bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-950/50 dark:border-amber-700'
                : isDark
                ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-400'
                : 'bg-white/90 border-slate-200 text-slate-600 hover:text-amber-500 hover:border-amber-300'
            }`}
            title={isAr ? 'تفعيل تنبيهات الإشعارات المباشرة' : 'Subscribe to Push Alerts'}
          >
            <Bell className={`w-3.5 h-3.5 ${isSubscribed ? 'fill-amber-500 text-amber-500' : ''}`} />
          </button>
        </div>

        {/* Center: Kickoff Time / Live Status Pill Badge (Lime Theme matching screenshot) */}
        <div className="shrink-0">
          {isLive ? (
            <div className="bg-emerald-500/15 border border-emerald-500/50 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-xs animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>
                {isAr
                  ? playedMinute.includes('بين') || playedMinute.includes('HT')
                    ? playedMinute
                    : `مباشر (${playedMinute})`
                  : `LIVE (${playedMinute})`}
              </span>
            </div>
          ) : isFinished ? (
            <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 shadow-xs">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              <span>{isAr ? 'انتهت' : 'FT'}</span>
            </div>
          ) : (
            <div className="bg-[#f4fae2] dark:bg-[#2d3a12] border border-[#d9f99d] dark:border-[#4d7c0f]/60 text-[#3f6212] dark:text-[#bef264] px-3 py-0.5 rounded-full text-xs font-black flex items-center gap-1 shadow-xs">
              <span className="font-mono font-black">{match.time}</span>
              <Clock className="w-3 h-3 text-[#65a30d]" />
            </div>
          )}
        </div>

        {/* Right Side: Date & Competition Header */}
        <div className="text-right rtl:text-right ltr:text-left min-w-0">
          <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 truncate">
            {match.dayLabelAr || match.dateAr || match.date}
          </div>
          <div className="flex items-center justify-end gap-1 text-[11px] sm:text-xs font-black text-slate-900 dark:text-white truncate">
            <span className="truncate">{isAr ? match.leagueNameAr : match.leagueName}</span>
            <span className="text-sm shrink-0">{match.leagueIcon || '⚽'}</span>
          </div>
        </div>
      </div>

      {/* Main Scoreboard: Home Team | Center Board (Time/Countdown or Score) | Away Team */}
      <div
        onClick={() => onOpenDetails(match, isFinished ? 'stats' : 'lineup')}
        className="relative z-10 px-3 sm:px-4 py-2 cursor-pointer grid grid-cols-7 items-center gap-1.5 select-none"
      >
        {/* Home Team (Left side in LTR layout, right side in RTL or aligned) */}
        <div className="col-span-2 sm:col-span-2 flex flex-col items-center text-center gap-0.5 min-w-0">
          <div className="relative hover:scale-105 transition-transform duration-200">
            <TeamLogo
              teamName={match.homeTeam}
              logo={match.homeLogo}
              sizeClassName="w-11 h-11 sm:w-13 sm:h-13"
              className="drop-shadow-sm object-contain"
            />
          </div>
          <div className="w-full mt-0.5">
            <span className="block font-black text-[11px] sm:text-xs text-slate-900 dark:text-white tracking-tight line-clamp-1">
              {match.homeTeam}
            </span>
            {isAr && match.homeTeamAr && (
              <span className="block font-bold text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {match.homeTeamAr}
              </span>
            )}
          </div>
        </div>

        {/* Center Display: Date, Kickoff Time, and Mint Countdown Box (or Live/Final Scores) */}
        <div className="col-span-3 sm:col-span-3 flex flex-col items-center justify-center text-center gap-0.5">
          {isUpcoming ? (
            <div className="flex flex-col items-center w-full max-w-[170px]">
              <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300">
                {match.dayLabelAr || match.dateAr || 'اليوم'}
              </span>

              <div className="font-black text-2xl sm:text-3xl font-mono text-slate-900 dark:text-white tracking-tight my-0">
                {match.time}
              </div>

              {/* Mint Countdown Badge ("الوقت المتبقي") in a compact straight line */}
              <div className="border border-[#99f6e4] dark:border-[#115e59] bg-[#f0fdfa] dark:bg-[#042f2e]/70 rounded-full px-2.5 py-0.5 inline-flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap">
                <span className="text-[9px] sm:text-[10px] font-bold text-[#0d9488] dark:text-[#2dd4bf]">
                  {isAr ? 'الوقت المتبقي:' : 'Time Left:'}
                </span>
                <span className="font-mono text-[10px] sm:text-[11px] font-black text-[#0f766e] dark:text-[#5eead4] tracking-wider" dir="ltr">
                  {countdownParts.days}:{countdownParts.hours}:{countdownParts.minutes}:{countdownParts.seconds}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              {isLive && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 animate-pulse shadow-sm bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40">
                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                  <span>
                    {isAr
                      ? playedMinute.includes('بين') || playedMinute.includes('HT')
                        ? playedMinute
                        : `د ${playedMinute.replace("'", '')}`
                      : playedMinute}
                  </span>
                </span>
              )}

              {isFinished && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {isAr ? 'نهاية المباراة' : 'Full Time'}
                </span>
              )}

              <div className="flex items-center justify-center gap-1.5 font-black text-2xl sm:text-3xl font-mono text-slate-900 dark:text-white my-0.5">
                <span className={match.homeScore > match.awayScore ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                  {match.homeScore}
                </span>
                <span className="text-slate-300 dark:text-slate-600 font-light">-</span>
                <span className={match.awayScore > match.homeScore ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                  {match.awayScore}
                </span>
              </div>

              {/* User Prediction Summary Badge */}
              {userPrediction ? (
                <div
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-tight whitespace-nowrap flex items-center justify-center gap-1 border shadow-xs ${
                    isFinished
                      ? match.homeScore === userPrediction.predictedHomeScore &&
                        match.awayScore === userPrediction.predictedAwayScore
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 ring-1 ring-emerald-500/30'
                        : isDark
                        ? 'bg-slate-900 text-slate-300 border-slate-700'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                      : isDark
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  <span>🎯</span>
                  <span>{isAr ? 'توقعك:' : 'Pred:'}</span>
                  <span className="font-mono font-black">{userPrediction.predictedHomeScore}</span>
                  <span className="text-slate-400 font-bold">-</span>
                  <span className="font-mono font-black">{userPrediction.predictedAwayScore}</span>
                  {isFinished &&
                    match.homeScore === userPrediction.predictedHomeScore &&
                    match.awayScore === userPrediction.predictedAwayScore && (
                      <span className="text-emerald-500 font-bold">✓ (+٥٠ كوينز)</span>
                    )}
                </div>
              ) : (
                <div
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-tight whitespace-nowrap flex items-center justify-center gap-1 border ${
                    isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <span className="text-rose-400">❌</span>
                  <span>{isAr ? 'لم تتوقع' : 'No pred'}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Away Team (Right side in LTR layout) */}
        <div className="col-span-2 sm:col-span-2 flex flex-col items-center text-center gap-0.5 min-w-0">
          <div className="relative hover:scale-105 transition-transform duration-200">
            <TeamLogo
              teamName={match.awayTeam}
              logo={match.awayLogo}
              sizeClassName="w-11 h-11 sm:w-13 sm:h-13"
              className="drop-shadow-sm object-contain"
            />
          </div>
          <div className="w-full mt-0.5">
            <span className="block font-black text-[11px] sm:text-xs text-slate-900 dark:text-white tracking-tight line-clamp-1">
              {match.awayTeam}
            </span>
            {isAr && match.awayTeamAr && (
              <span className="block font-bold text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {match.awayTeamAr}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Row (Exact 3-button layout matching screenshot) */}
      <div className="relative z-10 px-3 sm:px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Stats Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(match, 'stats');
          }}
          className={`flex-1 py-1.5 px-2 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-xs flex items-center justify-center gap-1 text-[11px] sm:text-xs font-black ${
            isDark
              ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-amber-300'
              : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-500" />
          <span>{isAr ? 'الإحصائيات' : 'Stats'}</span>
        </button>

        {/* AI Analysis Button (Mint Highlighted Theme) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(match, 'ai');
          }}
          className={`flex-[1.1] py-1.5 px-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-xs flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-black ${
            isDark
              ? 'bg-[#042f2e]/80 border-[#14b8a6] text-[#5eead4] hover:bg-[#115e59]'
              : 'bg-[#f0fdfa] border-[#5eead4] text-[#0f766e] hover:bg-[#ccfbf1]'
          }`}
        >
          <span className="text-sm select-none">🤖</span>
          <span>{isAr ? 'تحليل AI' : 'AI Analysis'}</span>
          <Sparkles className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
        </button>

        {/* Lineups Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(match, 'lineup');
          }}
          className={`flex-1 py-1.5 px-2 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-xs flex items-center justify-center gap-1 text-[11px] sm:text-xs font-black ${
            isDark
              ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-emerald-300'
              : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isAr ? 'التشكيلة' : 'Lineup'}</span>
        </button>
      </div>

      {/* Bottom Prediction / Points Banner Row */}
      <div className="relative z-10 px-3 sm:px-4 pb-2.5 pt-0">
        {isPredictionAllowed ? (
          userPrediction ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(match, 'predict');
              }}
              className={`w-full py-2 px-3 border rounded-xl flex items-center justify-between gap-1.5 shadow-xs transition-all hover:scale-[1.01] active:scale-95 cursor-pointer font-black text-xs ${
                isDark
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-400 text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🎯</span>
                <span>{isAr ? 'توقعك المسجل للمباراة:' : 'Your Prediction:'}</span>
                <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">
                  {userPrediction.predictedHomeScore} - {userPrediction.predictedAwayScore}
                </span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                {isAr ? '(تعديل ✏️)' : '(Edit ✏️)'}
              </span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(match, 'predict');
              }}
              className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              <span className="text-sm animate-bounce">🎯</span>
              <span className="tracking-wide">
                {match.customCoinsReward && match.customCoinsReward > 0
                  ? (isAr
                      ? `توقع مجاناً بدون رسوم (الجائزة +${match.customCoinsReward} كوينز) 🏆`
                      : `Free Prediction (Win +${match.customCoinsReward} Coins) 🏆`)
                  : (isAr
                      ? 'توقع النتيجة الآن مجاناً 🎯'
                      : 'Predict Score Free 🎯')}
              </span>
            </button>
          )
        ) : isFinished ? (
          <div
            className={`w-full py-1.5 px-2.5 rounded-xl flex items-center justify-between border font-bold text-[11px] ${
              isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>{isAr ? '✨ تم توزيع النقاط والكوينز لهذه المباراة' : '✨ Points & Coins distributed for this match'}</span>
            </div>
            <span className="font-mono font-bold text-[10px] text-slate-500">
              {match.homeScore} - {match.awayScore}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

