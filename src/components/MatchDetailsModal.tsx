import React, { useState, useEffect, useMemo } from 'react';
import { Match, Language } from '../types';
import { PitchView } from './PitchView';
import { TeamLogo } from './TeamLogo';
import { OrangeDiamondIcon } from './OrangeDiamondIcon';
import { generateFinishedMatchStats } from '../lib/matchStatsGenerator';
import { isMatchLive, getMatchPlayedMinute, getMatchCurrentMinuteNumber } from '../data/matchHelpers';
import { getOfficialTeamRoster } from '../data/teamRosters';
import { 
  X, 
  Shield, 
  Activity, 
  ListOrdered, 
  Sparkles, 
  Vote, 
  Clock, 
  MapPin, 
  User, 
  Flame, 
  Loader2, 
  Bell, 
  Users, 
  TrendingUp, 
  CheckCircle2,
  Award
} from 'lucide-react';

interface MatchDetailsModalProps {
  match: Match;
  initialTab?: 'lineup' | 'stats' | 'events' | 'predict';
  onClose: () => void;
  language: Language;
  onVotePrediction: (matchId: string, choice: 'HOME' | 'DRAW' | 'AWAY') => void;
  onSavePrediction?: (match: Match, homeScore: number, awayScore: number) => void;
  existingPrediction?: { predictedHomeScore: number; predictedAwayScore: number };
  isSubscribed?: boolean;
  onOpenSubscribeModal?: (match: Match) => void;
  userPoints?: number;
  userDiamonds?: number;
  onOpenGames?: () => void;
  onOpenProSubscriptions?: () => void;
  isFreePrediction?: boolean;
  remainingFreePredictions?: number;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  initialTab = 'lineup',
  onClose,
  language,
  onVotePrediction,
  onSavePrediction,
  existingPrediction,
  isSubscribed,
  onOpenSubscribeModal,
  userPoints = 0,
  userDiamonds = 0,
  onOpenGames,
  onOpenProSubscriptions,
  isFreePrediction = false,
  remainingFreePredictions = 0,
}) => {
  const isAr = language === 'ar';
  const isLive = isMatchLive(match);
  const isFinished = match.status === 'FINISHED' || match.pointsDistributed === true;
  const isUpcoming = !isFinished && !isLive && match.status === 'UPCOMING' && (!match.kickoffTimeMs || Date.now() < match.kickoffTimeMs);
  const playedMinute = getMatchPlayedMinute(match, isAr);
  const [activeTab, setActiveTab] = useState<'lineup' | 'stats' | 'events' | 'predict'>(initialTab);
  const [showFeeConfirmation, setShowFeeConfirmation] = useState<boolean>(false);

  // Lock background body scroll while modal is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow || '';
    };
  }, []);

  const [userVoted, setUserVoted] = useState<'HOME' | 'DRAW' | 'AWAY' | null>(null);

  // Exact Score Prediction state
  const [predHomeScore, setPredHomeScore] = useState<number>(() => existingPrediction ? existingPrediction.predictedHomeScore : 0);
  const [predAwayScore, setPredAwayScore] = useState<number>(() => existingPrediction ? existingPrediction.predictedAwayScore : 0);
  const [predictionSaved, setPredictionSaved] = useState<boolean>(false);

  // API-Football Live Events and Stats State
  const [isSyncingEvents, setIsSyncingEvents] = useState<boolean>(false);
  const [apiEventsList, setApiEventsList] = useState<any[]>([]);
  const [apiSyncedTime, setApiSyncedTime] = useState<string | null>(null);
  const [apiFootballData, setApiFootballData] = useState<any | null>(null);

  const handleSyncEventsWithApiFootball = async () => {
    setIsSyncingEvents(true);
    try {
      const apiRes = await fetch('/api/football/match-live-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          homeTeamAr: match.homeTeamAr,
          awayTeamAr: match.awayTeamAr,
          leagueName: match.leagueName,
          status: match.status,
          minute: playedMinute,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        }),
      });
      const apiData = await apiRes.json();
      if (apiData.success) {
        setApiFootballData(apiData);
        if (Array.isArray(apiData.events) && apiData.events.length > 0) {
          setApiEventsList(apiData.events);
        }
        setApiSyncedTime(new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US'));
      }
    } catch (err) {
      console.warn('API-Football events query notice:', err);
    } finally {
      setIsSyncingEvents(false);
    }
  };

  // Auto-fetch details from API-Football on open (lineups for upcoming, events/scores for live/finished)
  useEffect(() => {
    handleSyncEventsWithApiFootball();
  }, [match.id, match.status]);

  useEffect(() => {
    if (existingPrediction) {
      setPredHomeScore(existingPrediction.predictedHomeScore);
      setPredAwayScore(existingPrediction.predictedAwayScore);
    } else {
      setPredHomeScore(0);
      setPredAwayScore(0);
    }
  }, [existingPrediction, match.id]);

  // Prediction totals calculation
  const homeVotes = match?.prediction?.homeVotes || 0;
  const drawVotes = match?.prediction?.drawVotes || 0;
  const awayVotes = match?.prediction?.awayVotes || 0;
  const totalVotes = homeVotes + drawVotes + awayVotes;
  const homePct = totalVotes > 0 ? Math.round((homeVotes / totalVotes) * 100) : 33;
  const drawPct = totalVotes > 0 ? Math.round((drawVotes / totalVotes) * 100) : 33;
  const awayPct = totalVotes > 0 ? 100 - homePct - drawPct : 34;

  const handleVote = (choice: 'HOME' | 'DRAW' | 'AWAY') => {
    setUserVoted(choice);
    onVotePrediction(match.id, choice);
  };

  // Keyboard Escape listener to close modal effortlessly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 md:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full h-full sm:h-auto sm:max-h-[90vh] max-w-2xl bg-slate-900 border-0 sm:border border-emerald-500/30 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dedicated Top Bar: Prominent Close & Return (X) Button & Match Alert */}
        <div className="sticky top-0 w-full bg-slate-950 px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-50 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base sm:text-lg">{match.leagueIcon || '🏆'}</span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] sm:text-xs font-black text-white break-words whitespace-normal leading-tight">
                {isAr ? match.leagueNameAr : match.leagueName}
              </span>
              <span className="text-[10px] text-slate-400 font-bold truncate">
                {isAr ? (match.dateAr || match.date) : match.date}{match.status === 'UPCOMING' ? ` • ${match.time}` : ''}
              </span>
            </div>
            {isLive && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-black text-[10px] animate-pulse shrink-0">
                {isAr
                  ? playedMinute.includes('بين') || playedMinute.includes('HT')
                    ? playedMinute
                    : `مباشر (${playedMinute}) 🔴`
                  : `LIVE (${playedMinute}) 🔴`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenSubscribeModal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSubscribeModal(match);
                }}
                className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
                  isSubscribed
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:text-amber-300 hover:border-amber-500/50'
                }`}
                title={isAr ? 'تفعيل تنبيهات المباراة' : 'Match Alerts'}
              >
                <Bell className={`w-4 h-4 ${isSubscribed ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span className="hidden sm:inline">{isAr ? 'تنبيه' : 'Alert'}</span>
              </button>
            )}

            {/* Highly prominent red Close & Return (X) button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              aria-label={isAr ? 'إغلاق نافذة المباراة والرجوع للمباريات' : 'Close Match & Return to Matches'}
              title={isAr ? 'إغلاق نافذة المباراة والرجوع للمباريات (×)' : 'Close Match & Return to Matches (×)'}
              className="h-9 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 active:bg-rose-700 text-white font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95 cursor-pointer border border-rose-400/50 ring-2 ring-white/20 flex items-center gap-1.5 select-none"
            >
              <X className="w-4 h-4 text-white" strokeWidth={3} />
              <span>{isAr ? 'خروج ورجوع (×)' : 'Exit & Return (×)'}</span>
            </button>
          </div>
        </div>

        {/* Coins Distributed Banner */}
        {(match.status === 'FINISHED' || match.pointsDistributed) && (
          <div className="w-full bg-gradient-to-r from-emerald-950 via-emerald-900/90 to-emerald-950 border-b border-emerald-500/50 px-4 py-2 flex items-center justify-center gap-2 text-emerald-300 font-black text-xs sm:text-sm shadow-md tracking-wide shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{isAr ? '✨ تم توزيع ٥٠ كوينز لهذا الماتش' : '✨ 50 Coins Distributed for this Match'}</span>
          </div>
        )}

        {/* Modal Header: Scoreboard & Venue */}
        <div className="relative px-3 py-2.5 sm:px-5 sm:py-3.5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border-b border-slate-800 text-white shrink-0">

          {/* League name */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[9.5px] sm:text-[11px] font-semibold text-emerald-400 mb-1.5 pe-14 rtl:pe-0 rtl:ps-14 sm:pe-0 sm:rtl:ps-0 text-center">
            <span className="text-xs sm:text-sm shrink-0">{match.leagueIcon || '🏆'}</span>
            <span className="break-words whitespace-normal leading-tight">{isAr ? match.leagueNameAr : match.leagueName}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-bold">{isAr ? (match.dateAr || match.date) : match.date}{match.status === 'UPCOMING' ? ` ، ${match.time}` : ''}</span>
          </div>

          {/* Teams & Score */}
          <div className="grid grid-cols-7 items-center gap-1.5 max-w-xl mx-auto">
            {/* Home */}
            <div className="col-span-3 flex flex-col items-center text-center gap-0.5">
              <TeamLogo
                teamName={match.homeTeam}
                logo={match.homeLogo}
                sizeClassName="w-10 h-10 sm:w-14 sm:h-14"
                className="p-1 sm:p-1.5 bg-slate-800 border border-slate-700/80 rounded-xl shadow-md"
              />
              <h3 className="font-extrabold text-xs sm:text-sm text-white line-clamp-1">
                {match.homeTeam}
              </h3>
              {isAr && (
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium line-clamp-1">
                  {match.homeTeamAr}
                </span>
              )}
            </div>

            {/* Score */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              {isUpcoming ? (
                <div className="px-2 py-1 bg-slate-800/95 rounded-lg text-amber-400 text-xs sm:text-sm font-black tracking-wider border border-slate-700">
                  {match.time}
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-1.5 font-mono font-black text-xl sm:text-2xl text-white bg-slate-950 px-2.5 py-1 rounded-xl border border-emerald-500/30 shadow-inner">
                  <span>{match.homeScore}</span>
                  <span className="text-slate-600 text-lg">:</span>
                  <span>{match.awayScore}</span>
                </div>
              )}
              {isLive && (
                <span className="mt-1 text-[9px] sm:text-[10px] font-bold text-emerald-400 animate-pulse bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                  {isAr
                    ? playedMinute.includes('بين') || playedMinute.includes('HT')
                      ? playedMinute
                      : `د ${playedMinute.replace("'", '')}`
                    : `${playedMinute} LIVE`}
                </span>
              )}
              {/* User prediction or unpredicted notice right under live or final score */}
              {existingPrediction && !isUpcoming ? (
                <div className={`mt-1.5 px-2.5 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black border shadow-xs whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  isFinished
                    ? (Number(match.homeScore) === Number(existingPrediction.predictedHomeScore) && Number(match.awayScore) === Number(existingPrediction.predictedAwayScore))
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/90 text-slate-300 border-slate-700'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  <span>🎯</span>
                  <span>{isAr ? 'توقعك:' : 'Pred:'}</span>
                  <span className="font-mono font-black">{existingPrediction.predictedHomeScore}</span>
                  <span className="text-slate-400 font-bold">-</span>
                  <span className="font-mono font-black">{existingPrediction.predictedAwayScore}</span>
                  {isFinished && Number(match.homeScore) === Number(existingPrediction.predictedHomeScore) && Number(match.awayScore) === Number(existingPrediction.predictedAwayScore) && (
                    <span className="text-emerald-400 font-bold">✓ {isAr ? 'أصبت' : 'Exact'}</span>
                  )}
                  {isFinished && (Number(match.homeScore) !== Number(existingPrediction.predictedHomeScore) || Number(match.awayScore) !== Number(existingPrediction.predictedAwayScore)) && (
                    <span className="text-slate-400 font-bold">❌</span>
                  )}
                </div>
              ) : match.status !== 'UPCOMING' ? (
                <div className="mt-1.5 px-2 py-0.5 rounded-lg text-[9px] font-extrabold border shadow-xs whitespace-nowrap flex items-center justify-center gap-1 bg-slate-900/80 text-slate-400 border-slate-800">
                  <span className="text-rose-400">❌</span>
                  <span>{isAr ? 'لم تتوقع' : 'No pred'}</span>
                </div>
              ) : null}
            </div>

            {/* Away */}
            <div className="col-span-3 flex flex-col items-center text-center gap-0.5">
              <TeamLogo
                teamName={match.awayTeam}
                logo={match.awayLogo}
                sizeClassName="w-10 h-10 sm:w-14 sm:h-14"
                className="p-1 sm:p-1.5 bg-slate-800 border border-slate-700/80 rounded-xl shadow-md"
              />
              <h3 className="font-extrabold text-xs sm:text-sm text-white line-clamp-1">
                {match.awayTeam}
              </h3>
              {isAr && (
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium line-clamp-1">
                  {match.awayTeamAr}
                </span>
              )}
            </div>
          </div>

          {/* Match Meta (Venue & Referee) */}
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>{isAr ? match.venueAr : match.venue}</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-amber-400" />
              <span>{isAr ? `الحكم: ${match.refereeAr}` : `Ref: ${match.referee}`}</span>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/90 px-1 sm:px-3 overflow-x-auto no-scrollbar gap-1 text-xs sm:text-sm font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('lineup')}
            className={`py-2 px-2 sm:py-2.5 sm:px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
              activeTab === 'lineup'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isAr ? 'التشكيلة والميدان' : 'Tactical Pitch'}</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`py-2 px-2 sm:py-2.5 sm:px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
              activeTab === 'events'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>{isAr ? 'أحداث المباراة' : 'Events'}</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-2 sm:py-2.5 sm:px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
              activeTab === 'stats'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isAr ? 'الإحصائيات' : 'Stats'}</span>
          </button>

          <button
            onClick={() => setActiveTab('predict')}
            className={`py-2 px-2 sm:py-2.5 sm:px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
              activeTab === 'predict'
                ? 'border-amber-400 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Vote className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'توقعات الجمهور والنتيجة' : 'Predictions'}</span>
          </button>
        </div>

        {/* Tab Body Content with fluid scrolling */}
        <div 
          className="p-3.5 sm:p-6 pb-6 overflow-y-auto flex-1 text-slate-200"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          
          {/* TAB 1: Pitch Lineups */}
          {activeTab === 'lineup' && (
            <PitchView
              homeTeamName={match.homeTeam}
              homeTeamNameAr={match.homeTeamAr}
              homeColor={match.homeColor}
              homeLineup={apiFootballData?.homeLineup || match.homeLineup || getOfficialTeamRoster(match.homeTeamAr || match.homeTeam)}
              awayTeamName={match.awayTeam}
              awayTeamNameAr={match.awayTeamAr}
              awayColor={match.awayColor}
              awayLineup={apiFootballData?.awayLineup || match.awayLineup || getOfficialTeamRoster(match.awayTeamAr || match.awayTeam)}
              language={language}
              leagueName={match.leagueNameAr || match.leagueName}
              matchId={match.id}
            />
          )}

          {/* TAB 2: Match Events Timeline */}
          {activeTab === 'events' && (() => {
            // Aggregate, deduplicate, and normalize all events from API and curated data
            const rawEvents = [...apiEventsList, ...(match.events || [])];
            const dedupMap = new Map<string, any>();
            rawEvents.forEach((ev, idx) => {
              if (!ev) return;
              const min = ev.minute ?? 0;
              const p = ev.playerNameAr || ev.playerAr || ev.playerName || ev.player || ev.nameAr || ev.name || `evt_${idx}`;
              const t = ev.type || 'EVENT';
              const key = `${min}_${t}_${p}`;
              if (!dedupMap.has(key)) {
                dedupMap.set(key, ev);
              }
            });

            const sortedEvents = Array.from(dedupMap.values()).sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
            const isMatchEnded = match.status === 'FINISHED' || match.isFinished || match.pointsDistributed;
            const currentMinuteNum = getMatchCurrentMinuteNumber(match);
            const visibleEvents = isMatchEnded 
              ? sortedEvents 
              : isUpcoming 
              ? [] 
              : sortedEvents.filter((e) => (e.minute ?? 0) <= currentMinuteNum);

            return (
              <div className="space-y-4 max-w-2xl mx-auto">
                {isLive && (
                  <div className="flex items-center justify-between gap-2 p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <span>{isAr ? '🔴 بث مباشر للأحداث (الوقت الفعلي)' : '🔴 Live Match Events (Real-Time)'}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md font-mono font-black text-xs border border-emerald-500/30">
                      {isAr
                        ? playedMinute.includes('بين') || playedMinute.includes('HT')
                          ? playedMinute
                          : `د ${playedMinute.replace("'", '')}`
                        : playedMinute}
                    </span>
                  </div>
                )}

                {isUpcoming ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
                    <Clock className="w-10 h-10 mx-auto mb-3 text-amber-400/90 animate-pulse" />
                    <h4 className="font-extrabold text-white text-base mb-1">
                      {isAr ? 'المباراة مرتقبة' : 'Match Upcoming'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      {isAr
                        ? `تنطلق المباراة في تمام الساعة ${match.time}. ستظهر هنا جميع الأهداف، والبطاقات، والتبديلات، وأحداث اللقاء فور انطلاق صافرة البداية مع التحديث المباشر.`
                        : `Kickoff scheduled for ${match.time}. All live goals, cards, substitutions, and events will appear here in real time.`}
                    </p>
                  </div>
                ) : visibleEvents.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    <p className="font-medium text-sm text-slate-300">
                      {isAr 
                        ? `لا توجد أهداف أو بطاقات مسجلة حتى الدقيقة الحالية (${currentMinuteNum}').`
                        : `No goals or cards recorded yet up to the current minute (${currentMinuteNum}').`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {isAr ? 'يتم تحديث مجريات اللقاء والإنذارات والأهداف فور حدوثها في الوقت الفعلي.' : 'Match events and stats update as the game unfolds in real time.'}
                    </p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-800 rtl:border-l-0 rtl:border-r-2 ml-4 rtl:ml-0 rtl:mr-4 space-y-4">
                    {visibleEvents.map((evt, idx) => {
                      const isHome =
                        evt.team === 'HOME' ||
                        evt.team === 'home' ||
                        evt.team === match.homeTeam ||
                        evt.team === match.homeTeamAr;

                      const playerNameDisplay = isAr
                        ? (evt.playerNameAr || evt.playerAr || evt.nameAr || evt.playerName || evt.player || evt.name || 'لاعب')
                        : (evt.playerName || evt.player || evt.name || evt.playerNameAr || evt.playerAr || evt.nameAr || 'Player');

                      const assistDisplay = isAr
                        ? (evt.assistAr || evt.assist)
                        : (evt.assist || evt.assistAr);

                      const detailDisplay = isAr
                        ? (evt.detailAr || evt.detail)
                        : (evt.detail || evt.detailAr);

                      const isGoal = evt.type === 'GOAL' || evt.type === 'PENALTY_GOAL' || evt.type === 'OWN_GOAL';

                      return (
                        <div key={evt.id || idx} className="relative pl-6 rtl:pl-0 rtl:pr-6 flex items-start gap-3">
                          <span className={`absolute -left-3 rtl:-left-auto rtl:-right-3 top-1 w-6 h-6 rounded-full bg-slate-900 border-2 flex items-center justify-center text-[10px] font-mono font-bold shadow-md ${
                            isGoal
                              ? 'border-emerald-400 text-emerald-400'
                              : evt.type === 'RED_CARD'
                              ? 'border-rose-500 text-rose-400'
                              : evt.type === 'YELLOW_CARD'
                              ? 'border-amber-400 text-amber-300'
                              : 'border-slate-600 text-slate-400'
                          }`}>
                            {evt.minute}'
                          </span>

                          <div className={`border rounded-xl p-3.5 flex-1 flex items-center justify-between shadow-md transition-all ${
                            isGoal
                              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-emerald-950/30'
                              : evt.type === 'RED_CARD'
                              ? 'bg-rose-950/30 border-rose-500/50 shadow-rose-950/30'
                              : 'bg-slate-950 border-slate-800'
                          }`}>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-white text-sm sm:text-base">
                                  {playerNameDisplay}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                  {isHome ? (isAr ? match.homeTeamAr : match.homeTeam) : (isAr ? match.awayTeamAr : match.awayTeam)}
                                </span>
                                {evt.score && (
                                  <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                    {evt.score}
                                  </span>
                                )}
                              </div>

                              {assistDisplay && (
                                <p className="text-xs text-emerald-400/90 font-medium mt-1 flex items-center gap-1">
                                  <span>👟</span>
                                  <span>{isAr ? `صناعة: ${assistDisplay}` : `Assist: ${assistDisplay}`}</span>
                                </p>
                              )}

                              {detailDisplay && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {detailDisplay}
                                </p>
                              )}
                            </div>

                            <div className="text-2xl shrink-0 ps-3 rtl:ps-0 rtl:pe-3">
                              {(evt.type === 'GOAL' || evt.type === 'PENALTY_GOAL') && '⚽'}
                              {evt.type === 'OWN_GOAL' && '⚽ (عكسي)'}
                              {evt.type === 'YELLOW_CARD' && '🟨'}
                              {evt.type === 'RED_CARD' && '🟥'}
                              {evt.type === 'SUBSTITUTION' && '🔄'}
                              {evt.type === 'VAR' && '🖥️'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 3: Comprehensive Live & Post-Match Stats */}
          {activeTab === 'stats' && (() => {
            const hasRealData = (s?: any): boolean =>
              s &&
              ((s.possession?.[0] > 0 || s.possession?.[1] > 0) ||
               (s.shotsTotal?.[0] > 0 || s.shotsTotal?.[1] > 0));

            const stats = 
              (hasRealData(apiFootballData?.stats) ? apiFootballData.stats : null) ||
              (hasRealData(match.stats) ? match.stats : null) ||
              generateFinishedMatchStats(match);

            const isFinished = match.status === 'FINISHED';
            const motm = stats.manOfTheMatch;

            return (
              <div className="space-y-6 max-w-2xl mx-auto">
                {/* Man of the Match (رجل المباراة ⭐) for Finished Matches */}
                {isFinished && motm && (
                  <div className="p-4 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 rounded-2xl border border-amber-500/50 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500"></div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-2xl shrink-0 shadow-inner">
                          ⭐
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30">
                              {isAr ? 'رجل المباراة 🌟' : 'Man of the Match'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              ({motm.team === 'HOME' ? (isAr ? match.homeTeamAr : match.homeTeam) : (isAr ? match.awayTeamAr : match.awayTeam)})
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-black text-white truncate mt-0.5">
                            {isAr ? motm.nameAr : motm.name}
                          </h4>
                          <p className="text-[11px] text-amber-200/80 line-clamp-1 mt-0.5">
                            {isAr ? motm.statsSummaryAr : motm.statsSummary}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/40 shrink-0">
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-tight">{isAr ? 'التقييم' : 'Rating'}</span>
                        <span className="text-base sm:text-lg font-mono font-black text-white">{motm.rating}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Key Overview Cards: xG vs xG, Possession, Total Shots */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-slate-950 p-2.5 sm:p-3 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-400 font-bold mb-1">{isAr ? 'الاستحواذ' : 'Possession'}</span>
                    <div className="flex items-baseline gap-1 font-mono font-black text-sm sm:text-base text-white">
                      <span className="text-emerald-400">{stats.possession?.[0] ?? 50}%</span>
                      <span className="text-slate-600 text-xs">-</span>
                      <span className="text-teal-400">{stats.possession?.[1] ?? 50}%</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 sm:p-3 rounded-2xl border border-emerald-500/20 text-center flex flex-col items-center justify-center shadow-xs">
                    <span className="text-[10px] text-emerald-400 font-black mb-1">{isAr ? 'الأهداف المتوقعة xG' : 'Expected Goals xG'}</span>
                    <div className="flex items-baseline gap-1 font-mono font-black text-sm sm:text-base text-white">
                      <span className="text-emerald-400">{stats.xG?.[0] ?? 0}</span>
                      <span className="text-slate-600 text-xs">:</span>
                      <span className="text-teal-400">{stats.xG?.[1] ?? 0}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 sm:p-3 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-400 font-bold mb-1">{isAr ? 'إجمالي التسديدات' : 'Total Shots'}</span>
                    <div className="flex items-baseline gap-1 font-mono font-black text-sm sm:text-base text-white">
                      <span className="text-emerald-400">{stats.shotsTotal?.[0] ?? 0}</span>
                      <span className="text-slate-600 text-xs">-</span>
                      <span className="text-teal-400">{stats.shotsTotal?.[1] ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Section 1: الهجوم والفاعلية (Attacking) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider px-1">
                    <span>🎯</span>
                    <span>{isAr ? 'إحصائيات الهجوم والفاعلية' : 'Attacking Metrics'}</span>
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: isAr ? 'الأهداف المتوقعة (xG)' : 'Expected Goals (xG)', val0: stats.xG?.[0] ?? 0, val1: stats.xG?.[1] ?? 0, isFloat: true },
                      { label: isAr ? 'إجمالي التسديدات' : 'Shots Total', val0: stats.shotsTotal?.[0] ?? 0, val1: stats.shotsTotal?.[1] ?? 0 },
                      { label: isAr ? 'التسديدات على المرمى' : 'Shots on Target', val0: stats.shotsOnTarget?.[0] ?? 0, val1: stats.shotsOnTarget?.[1] ?? 0 },
                      { label: isAr ? 'التسديدات خارج المرمى' : 'Shots off Target', val0: stats.shotsOffTarget?.[0] ?? 0, val1: stats.shotsOffTarget?.[1] ?? 0 },
                      { label: isAr ? 'الفرص المحققة (Big Chances)' : 'Big Chances Created', val0: stats.bigChances?.[0] ?? 0, val1: stats.bigChances?.[1] ?? 0 },
                      { label: isAr ? 'التسللات' : 'Offsides', val0: stats.offsides?.[0] ?? 0, val1: stats.offsides?.[1] ?? 0 },
                    ].map(({ label, val0, val1, isFloat }) => {
                      const total = (Number(val0) + Number(val1)) || 1;
                      const homePct = Math.round((Number(val0) / total) * 100);

                      return (
                        <div key={label} className="bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-extrabold">
                            <span className="text-emerald-400 font-mono text-sm">{isFloat ? Number(val0).toFixed(2) : val0}</span>
                            <span className="text-slate-300 text-center text-[11px] sm:text-xs">{label}</span>
                            <span className="text-teal-400 font-mono text-sm">{isFloat ? Number(val1).toFixed(2) : val1}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden flex">
                            <div style={{ width: `${homePct}%` }} className="bg-emerald-500 h-full transition-all duration-500"></div>
                            <div style={{ width: `${100 - homePct}%` }} className="bg-teal-500 h-full transition-all duration-500"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: الاستحواذ والتمرير (Possession & Passing) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-teal-400 flex items-center gap-1.5 uppercase tracking-wider px-1">
                    <span>🔄</span>
                    <span>{isAr ? 'الاستحواذ وبناء اللعب والتمرير' : 'Possession & Passing Distribution'}</span>
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: isAr ? 'نسبة الاستحواذ %' : 'Possession %', val0: `${stats.possession?.[0] ?? 50}%`, val1: `${stats.possession?.[1] ?? 50}%`, pct0: stats.possession?.[0] ?? 50 },
                      { label: isAr ? 'إجمالي التمريرات' : 'Total Passes', val0: stats.passes?.[0] ?? 450, val1: stats.passes?.[1] ?? 450, pct0: stats.possession?.[0] ?? 50 },
                      { label: isAr ? 'دقة التمريرات %' : 'Pass Accuracy %', val0: `${stats.passAccuracy?.[0] ?? 80}%`, val1: `${stats.passAccuracy?.[1] ?? 80}%`, pct0: 50 },
                    ].map(({ label, val0, val1, pct0 }) => (
                      <div key={label} className="bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-extrabold">
                          <span className="text-emerald-400 font-mono text-sm">{val0}</span>
                          <span className="text-slate-300 text-center text-[11px] sm:text-xs">{label}</span>
                          <span className="text-teal-400 font-mono text-sm">{val1}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden flex">
                          <div style={{ width: `${pct0}%` }} className="bg-emerald-500 h-full transition-all duration-500"></div>
                          <div style={{ width: `${100 - pct0}%` }} className="bg-teal-500 h-full transition-all duration-500"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: الدفاع والانضباط والتصديات (Defending & Discipline) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-wider px-1">
                    <span>🛡️</span>
                    <span>{isAr ? 'الدفاع، التصديات والانضباط' : 'Defending, Saves & Discipline'}</span>
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: isAr ? 'تصديات الحراس (Saves)' : 'Goalkeeper Saves', val0: stats.saves?.[0] ?? 0, val1: stats.saves?.[1] ?? 0 },
                      { label: isAr ? 'التدخلات الناجحة (Tackles)' : 'Tackles Won', val0: stats.tackles?.[0] ?? 0, val1: stats.tackles?.[1] ?? 0 },
                      { label: isAr ? 'الضربات الركنية' : 'Corners', val0: stats.corners?.[0] ?? 0, val1: stats.corners?.[1] ?? 0 },
                      { label: isAr ? 'الأخطاء المرتكبة (Fouls)' : 'Fouls', val0: stats.fouls?.[0] ?? 0, val1: stats.fouls?.[1] ?? 0 },
                      { label: isAr ? 'البطاقات الصفراء 🟨' : 'Yellow Cards 🟨', val0: stats.yellowCards?.[0] ?? 0, val1: stats.yellowCards?.[1] ?? 0 },
                      { label: isAr ? 'البطاقات الحمراء 🟥' : 'Red Cards 🟥', val0: stats.redCards?.[0] ?? 0, val1: stats.redCards?.[1] ?? 0 },
                    ].map(({ label, val0, val1 }) => {
                      const total = (Number(val0) + Number(val1)) || 1;
                      const homePct = Math.round((Number(val0) / total) * 100);

                      return (
                        <div key={label} className="bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-extrabold">
                            <span className="text-emerald-400 font-mono text-sm">{val0}</span>
                            <span className="text-slate-300 text-center text-[11px] sm:text-xs">{label}</span>
                            <span className="text-teal-400 font-mono text-sm">{val1}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden flex">
                            <div style={{ width: `${homePct}%` }} className="bg-emerald-500 h-full transition-all duration-500"></div>
                            <div style={{ width: `${100 - homePct}%` }} className="bg-teal-500 h-full transition-all duration-500"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 4: Fan Predictions & Exact Score Entry */}
          {activeTab === 'predict' && (() => {
            const isFinished = match.status === 'FINISHED';
            const isStarted = match.status === 'LIVE' || match.status === 'HALF_TIME' || (match.kickoffTimeMs ? Date.now() >= match.kickoffTimeMs : false);
            const isPredictionLocked = isFinished || isStarted || match.isPredictionClosed;
            const coinsReward = typeof match.customCoinsReward === 'number' && match.customCoinsReward > 0 ? match.customCoinsReward : 50;
            const DIAMOND_PREDICTION_FEE = 50;
            const effectiveFee = existingPrediction ? 0 : DIAMOND_PREDICTION_FEE;

            // Popular community score distribution
            const scoreDistribution = [
              { score: '2 - 1', pct: 36, count: 432, color: 'bg-emerald-500' },
              { score: '1 - 0', pct: 24, count: 288, color: 'bg-teal-500' },
              { score: '1 - 1', pct: 18, count: 216, color: 'bg-amber-500' },
              { score: '2 - 0', pct: 14, count: 168, color: 'bg-blue-500' },
              { score: isAr ? 'أخرى' : 'Other', pct: 8, count: 96, color: 'bg-slate-600' },
            ];

            // Mock community live feed of predictions
            const communityPredictions = [
              { name: isAr ? 'أحمد سمير' : 'Ahmed Samir', badge: isAr ? 'خبير التوقعات' : 'Pro Predictor', score: '2 - 1', avatar: '🥇', time: isAr ? 'منذ دقيقتين' : '2m ago' },
              { name: isAr ? 'محمود إبراهيم' : 'Mahmoud I.', badge: isAr ? 'متصدر الترتيب' : 'Rank #1', score: '1 - 0', avatar: '👑', time: isAr ? 'منذ ٥ دقائق' : '5m ago' },
              { name: isAr ? 'سارة علي' : 'Sara Ali', badge: isAr ? 'مشارك مميز' : 'Top Fan', score: '1 - 1', avatar: '⚡', time: isAr ? 'منذ ٩ دقائق' : '9m ago' },
              { name: isAr ? 'كريم عادل' : 'Karim Adel', badge: isAr ? 'قناص النتائج' : 'Score Sniper', score: '2 - 0', avatar: '🎯', time: isAr ? 'منذ ١٢ دقيقة' : '12m ago' },
              { name: isAr ? 'يوسف طارق' : 'Youssef T.', badge: isAr ? 'محلل رياضي' : 'Analyst', score: '3 - 1', avatar: '🔥', time: isAr ? 'منذ ١٥ دقيقة' : '15m ago' },
            ];

            return (
            <div className="space-y-4 max-w-lg mx-auto text-center">
              {isFinished ? (
                <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-emerald-500/40 shadow-xl space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                    <span>🏆</span>
                    <span>{isAr ? 'النتيجة النهائية وتوزيع الجوائز' : 'Final Score & Coin Rewards'}</span>
                  </div>

                  <div className="flex items-center justify-center gap-4 py-1.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <div className="flex flex-col items-center gap-0.5">
                      <TeamLogo teamName={match.homeTeam} logo={match.homeLogo} sizeClassName="w-8 h-8" />
                      <span className="text-xs font-bold text-slate-200">{isAr ? match.homeTeamAr : match.homeTeam}</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                      <span>{match.homeScore}</span>
                      <span>-</span>
                      <span>{match.awayScore}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <TeamLogo teamName={match.awayTeam} logo={match.awayLogo} sizeClassName="w-8 h-8" />
                      <span className="text-xs font-bold text-slate-200">{isAr ? match.awayTeamAr : match.awayTeam}</span>
                    </div>
                  </div>

                  {/* User's prediction outcome */}
                  {existingPrediction ? (
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold ${
                      (match.homeScore === existingPrediction.predictedHomeScore && match.awayScore === existingPrediction.predictedAwayScore)
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>🎯</span>
                        <span>{isAr ? 'توقعك المسجل:' : 'Your Prediction:'}</span>
                        <div className="inline-flex items-center gap-1 font-mono font-black text-amber-300">
                          <span>{isAr ? (match.homeTeamAr || match.homeTeam) : match.homeTeam}</span>
                          <span className="text-emerald-400">{existingPrediction.predictedHomeScore}</span>
                          <span>-</span>
                          <span className="text-teal-400">{existingPrediction.predictedAwayScore}</span>
                          <span>{isAr ? (match.awayTeamAr || match.awayTeam) : match.awayTeam}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        (Number(match.homeScore) === Number(existingPrediction.predictedHomeScore) && Number(match.awayScore) === Number(existingPrediction.predictedAwayScore))
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {(Number(match.homeScore) === Number(existingPrediction.predictedHomeScore) && Number(match.awayScore) === Number(existingPrediction.predictedAwayScore))
                          ? (isAr ? 'صحيح (أصبت النتيجة الدقيقة) ✓' : 'Exact Prediction ✓')
                          : (isAr ? 'لم يصب التوقع ❌' : 'Missed ❌')}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                      <span className="text-rose-500 font-bold">❌</span>
                      <span>{isAr ? 'لم تقم بالتوقع لهذا الماتش قبل انطلاقه' : 'You did not predict this match before kickoff'}</span>
                    </div>
                  )}

                  <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/30 text-center space-y-0.5">
                    <div className="text-xl font-black text-emerald-400">1,120 {isAr ? 'مشترك أصابوا التوقع' : 'Winners'}</div>
                    <div className="text-xs font-bold text-emerald-300">
                      {isAr ? '🎯 تم احتساب التوقع الصحيح في لوحة النتائج والمتصدرين' : '🎯 Exact predictions counted towards Leaderboard'}
                    </div>
                  </div>
                </div>
              ) : isPredictionLocked ? (
                <div className="p-4 sm:p-5 bg-slate-950/90 rounded-2xl border border-amber-500/40 shadow-xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xl font-bold border border-amber-500/30">
                    🔒
                  </div>
                  <h4 className="font-extrabold text-white text-sm sm:text-base">
                    {isAr ? 'تم إغلاق باب التوقعات (المباراة جارية)' : 'Predictions Are Closed (Match in Progress)'}
                  </h4>

                  {existingPrediction ? (
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 flex-wrap">
                      <span>🎯</span>
                      <span>{isAr ? 'توقعك المسجل للمباراة:' : 'Your Active Prediction:'}</span>
                      <div className="inline-flex items-center gap-1 font-mono font-black text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                        <span>{isAr ? (match.homeTeamAr || match.homeTeam) : match.homeTeam}</span>
                        <span className="text-emerald-400">{existingPrediction.predictedHomeScore}</span>
                        <span>-</span>
                        <span className="text-teal-400">{existingPrediction.predictedAwayScore}</span>
                        <span>{isAr ? (match.awayTeamAr || match.awayTeam) : match.awayTeam}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                      <span className="text-rose-500 font-bold">❌</span>
                      <span>{isAr ? 'لم تقم بالتوقع لهذا الماتش' : 'You did not predict this match'}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isAr
                      ? 'تعتمد مسابقة Kora على التوقعات القبلية فقط! أُغلق التوقع لانطلاق المباراة.'
                      : 'Predictions close automatically as soon as a match kicks off.'}
                  </p>
                </div>
              ) : (
                /* Exact Score Predictor Section */
                <div className="p-3.5 sm:p-4 bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl border border-orange-500/40 shadow-xl space-y-3 relative">
                  {/* Fee & Balance Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[11px] font-black">
                      <OrangeDiamondIcon className="w-3.5 h-3.5" />
                      <span>
                        {isAr ? 'رسوم التوقع: 50 ماسة برتقالية' : 'Prediction Fee: 50 Orange Diamonds'}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-orange-300 border border-orange-500/30 text-[11px] font-black">
                      <span>{isAr ? 'رصيدك:' : 'Your Gems:'}</span>
                      <span className="font-mono text-white">{userDiamonds}</span>
                      <OrangeDiamondIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* 50 Diamonds Prediction Fee Banner */}
                  {!existingPrediction ? (
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold ${
                      userDiamonds >= DIAMOND_PREDICTION_FEE
                        ? 'bg-orange-950/40 border-orange-500/40 text-orange-200'
                        : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                    }`}>
                      <div className="flex items-center gap-1.5 text-right">
                        <OrangeDiamondIcon className="w-4 h-4 shrink-0" />
                        <span>
                          {userDiamonds >= DIAMOND_PREDICTION_FEE
                            ? (isAr ? 'توقع نتيجة أي ماتش بـ 50 ماسة (سيتم خصم 50 ماسة عند التأكيد)' : 'Predicting any match costs 50 Diamonds')
                            : (isAr ? `تحتاج إلى 50 ماسة لتوقع المباراة (متبقي لك ${Math.max(0, DIAMOND_PREDICTION_FEE - userDiamonds)} ماسة)` : `You need 50 Diamonds to predict (${Math.max(0, DIAMOND_PREDICTION_FEE - userDiamonds)} more needed)`)}
                        </span>
                      </div>
                      <span className="font-mono font-black text-orange-400 text-sm shrink-0 flex items-center gap-1">
                        <span>50</span>
                        <OrangeDiamondIcon className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30 flex items-center justify-between text-xs font-bold text-emerald-200">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">✓</span>
                        <span>{isAr ? 'تم دفع رسوم التوقع (50 ماسة) لهذا الماتش — يمكنك تعديل النتيجة قبل البداية' : '50 Diamonds fee paid — You can update score before kickoff'}</span>
                      </div>
                    </div>
                  )}

                  {/* Quick "ابدأ اللعب" CTA if user has less than 50 diamonds */}
                  {!existingPrediction && userDiamonds < DIAMOND_PREDICTION_FEE && onOpenGames && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenGames();
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                    >
                      <span>⚽</span>
                      <span>{isAr ? 'ابدأ اللعب الآن واجمع 50 ماسة للتوقع!' : 'Start Playing Now & Collect 50 Diamonds!'}</span>
                      <OrangeDiamondIcon className="w-4 h-4" />
                    </button>
                  )}

                  <h4 className="font-extrabold text-white text-sm sm:text-base">
                    {isAr ? 'ما هي نتيجة المباراة المتوقعة؟' : 'Enter Predicted Score'}
                  </h4>

                  {/* Interactive Score Steppers */}
                  <div className="grid grid-cols-7 items-center gap-1.5 py-1.5 bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-800">
                    {/* Home Team Score */}
                    <div className="col-span-3 flex flex-col items-center gap-1">
                      <TeamLogo teamName={match.homeTeam} logo={match.homeLogo} sizeClassName="w-8 h-8" />
                      <span className="font-extrabold text-[11px] sm:text-xs text-slate-200 line-clamp-1">
                        {isAr ? match.homeTeamAr : match.homeTeam}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <button
                          onClick={() => setPredHomeScore((s) => Math.max(0, s - 1))}
                          aria-label="Decrease home score"
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-white font-black text-lg border border-slate-700/80 cursor-pointer active:scale-90 flex items-center justify-center transition-all shadow-sm"
                        >
                          -
                        </button>
                        <span className="text-2xl font-black font-mono text-emerald-400 w-7 text-center">
                          {predHomeScore}
                        </span>
                        <button
                          onClick={() => setPredHomeScore((s) => s + 1)}
                          aria-label="Increase home score"
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-emerald-600 text-white font-black text-lg border border-slate-700/80 cursor-pointer active:scale-90 flex items-center justify-center transition-all shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="col-span-1 text-slate-500 font-black text-xl">:</div>

                    {/* Away Team Score */}
                    <div className="col-span-3 flex flex-col items-center gap-1">
                      <TeamLogo teamName={match.awayTeam} logo={match.awayLogo} sizeClassName="w-8 h-8" />
                      <span className="font-extrabold text-[11px] sm:text-xs text-slate-200 line-clamp-1">
                        {isAr ? match.awayTeamAr : match.awayTeam}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <button
                          onClick={() => setPredAwayScore((s) => Math.max(0, s - 1))}
                          aria-label="Decrease away score"
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-white font-black text-lg border border-slate-700/80 cursor-pointer active:scale-90 flex items-center justify-center transition-all shadow-sm"
                        >
                          -
                        </button>
                        <span className="text-2xl font-black font-mono text-emerald-400 w-7 text-center">
                          {predAwayScore}
                        </span>
                        <button
                          onClick={() => setPredAwayScore((s) => s + 1)}
                          aria-label="Increase away score"
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-emerald-600 text-white font-black text-lg border border-slate-700/80 cursor-pointer active:scale-90 flex items-center justify-center transition-all shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit / Edit Prediction Button */}
                  <button
                    onClick={() => {
                      if (!existingPrediction && userDiamonds < DIAMOND_PREDICTION_FEE) {
                        setShowFeeConfirmation(true);
                        return;
                      }
                      if (!existingPrediction) {
                        setShowFeeConfirmation(true);
                        return;
                      }
                      if (onSavePrediction) {
                        onSavePrediction(match, predHomeScore, predAwayScore);
                      }
                      setPredictionSaved(true);
                      setTimeout(() => {
                        onClose();
                      }, 400);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98 ${
                      predictionSaved
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-600 hover:from-orange-400 hover:to-emerald-500 text-white shadow-orange-950/40 ring-1 ring-orange-400/50'
                    }`}
                  >
                    <span className="text-base">🎯</span>
                    <span className="flex items-center gap-1.5">
                      {predictionSaved ? (
                        <span>{isAr ? '✓ تم حفظ توقعك بنجاح!' : '✓ Prediction Saved!'}</span>
                      ) : existingPrediction ? (
                        <span>{isAr ? 'تعديل وحفظ التوقع 🎯' : 'Update Prediction 🎯'}</span>
                      ) : (
                        <>
                          <span>{isAr ? 'تأكيد التوقع (رسوم 50 ماسة' : 'Confirm Prediction (50 Diamonds'}</span>
                          <OrangeDiamondIcon className="w-4 h-4" />
                          <span>)</span>
                        </>
                      )}
                    </span>
                  </button>

                  {/* Confirmation Modal for 50 Diamonds Deduction */}
                  {showFeeConfirmation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
                      <div className="bg-slate-900 border-2 border-orange-500/60 rounded-2xl p-5 max-w-sm w-full text-center space-y-4 shadow-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
                          <OrangeDiamondIcon className="w-7 h-7" />
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="text-base font-black text-white">
                            {isAr ? `تأكيد رسوم التوقع (${effectiveFee} ماسة برتقالية)` : `Confirm Prediction Fee (${effectiveFee} Orange Diamonds)`}
                          </h3>
                          <p className="text-xs text-slate-300 leading-relaxed font-bold">
                            {isAr
                              ? `رسوم توقع أي مباراة هي ${effectiveFee} ماسة برتقالية. وفي حال كانت نتيجة توقعك صحيحة تماماً ستكسب ${coinsReward} كوينز في محفظتك! 🏆`
                              : `Predicting any match costs ${effectiveFee} Orange Diamonds. An exact score prediction rewards you with ${coinsReward} coins! 🏆`}
                          </p>
                        </div>

                        {/* Balance Breakdown */}
                        <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-slate-300 font-bold">
                            <span>{isAr ? 'رصيدك الحالي من الماسات:' : 'Current Diamonds Balance:'}</span>
                            <span className="font-mono font-black text-orange-400 flex items-center gap-1">
                              <span>{userDiamonds}</span>
                              <OrangeDiamondIcon className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-rose-300 font-bold">
                            <span>{isAr ? 'رسوم التوقع (خصم):' : 'Prediction Fee:'}</span>
                            <span className="font-mono font-black text-rose-400 flex items-center gap-1">
                              <span>-{effectiveFee}</span>
                              <OrangeDiamondIcon className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <div className="h-px bg-slate-800 my-1" />
                          <div className="flex items-center justify-between text-emerald-300 font-black">
                            <span>{isAr ? 'الجائزة عند التوقع الصحيح:' : 'Reward on Exact Win:'}</span>
                            <span className="font-mono font-black text-emerald-400">+{coinsReward} 🪙</span>
                          </div>
                        </div>

                        {userDiamonds < effectiveFee ? (
                          <div className="p-3 bg-rose-950/60 rounded-xl border border-rose-500/40 text-xs font-black text-rose-300 space-y-2.5">
                            <div>
                              {isAr
                                ? `⚠️ رصيدك من الماسات غير كافٍ (لديك ${userDiamonds} ماسة، والمطلوب ${effectiveFee} ماسة لتوقع المباراة).`
                                : `⚠️ Insufficient diamonds (You have ${userDiamonds} diamonds, ${effectiveFee} needed to predict).`}
                            </div>
                            {onOpenGames && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowFeeConfirmation(false);
                                  onClose();
                                  onOpenGames();
                                }}
                                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                              >
                                <span>⚽</span>
                                <span>{isAr ? 'ابدأ اللعب واجمع الماسات الآن' : 'Start Playing to Earn Diamonds'}</span>
                                <OrangeDiamondIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : null}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => setShowFeeConfirmation(false)}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>

                          <button
                            disabled={userDiamonds < effectiveFee}
                            onClick={() => {
                              setShowFeeConfirmation(false);
                              if (onSavePrediction) {
                                onSavePrediction(match, predHomeScore, predAwayScore);
                              }
                              setPredictionSaved(true);
                              setTimeout(() => {
                                onClose();
                              }, 400);
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs cursor-pointer active:scale-95 transition-all shadow-md flex items-center justify-center gap-1 ${
                              userDiamonds < effectiveFee
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                : 'bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-400 hover:to-emerald-500 text-white shadow-orange-950/40'
                            }`}
                          >
                            <span>{isAr ? `موافق (خصم ${effectiveFee} ماسة)` : `Confirm (${effectiveFee} Gems)`}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: Community Breakdown of Exact Scores (توزيع توقعات المستخدمين) */}
              <div className="p-3.5 sm:p-4 bg-slate-950/90 rounded-2xl border border-slate-800 text-right rtl:text-right ltr:text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white font-extrabold text-xs sm:text-sm">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>{isAr ? 'توزيع توقعات المستخدمين للنتيجة' : 'User Score Predictions Breakdown'}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400/90 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    1,200 {isAr ? 'توقع' : 'preds'}
                  </span>
                </div>

                {/* Score percentage bars */}
                <div className="space-y-1.5 pt-1">
                  {scoreDistribution.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                        <span className="font-mono font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {item.score}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-normal">({item.count} {isAr ? 'مستخدم' : 'users'})</span>
                          <span className="font-mono font-black text-emerald-400">{item.pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: Live Community Predictions Feed (أحدث توقعات الجماهير) */}
              <div className="p-3.5 sm:p-4 bg-slate-950/90 rounded-2xl border border-slate-800 text-right rtl:text-right ltr:text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white font-extrabold text-xs sm:text-sm">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? 'أحدث توقعات الجماهير المباشرة' : 'Live Community Predictions'}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>{isAr ? 'مباشر الآن' : 'Live'}</span>
                  </span>
                </div>

                {/* Highlight current user prediction if existing */}
                {existingPrediction && (
                  <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-teal-500/15 border border-amber-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold border border-amber-500/40">
                        ✨
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white flex items-center gap-1">
                          <span>{isAr ? 'توقعك أنت' : 'Your Prediction'}</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40">
                            {isAr ? 'مسجل' : 'Saved'}
                          </span>
                        </div>
                        <div className="text-[10px] text-orange-300/90 font-medium flex items-center gap-1">
                          <span>{isAr ? 'رسوم التوقع: 50 ماسة' : 'Prediction Fee: 50 Diamonds'}</span>
                          <OrangeDiamondIcon className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-black text-sm text-emerald-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-emerald-500/40 shadow-inner">
                      {existingPrediction.predictedHomeScore} - {existingPrediction.predictedAwayScore}
                    </div>
                  </div>
                )}

                {/* Feed list */}
                <div className="divide-y divide-slate-800/80 space-y-1">
                  {communityPredictions.map((user, index) => (
                    <div key={index} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{user.avatar}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-200 text-xs">{user.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-300 border border-slate-700 font-medium">
                              {user.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">{user.time}</span>
                        </div>
                      </div>
                      <div className="font-mono font-black text-xs text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {user.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fan Voting Percentage Box */}
              <div className="p-3.5 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 text-center">
                <h4 className="font-extrabold text-white text-xs sm:text-sm">
                  {isAr ? 'تصويت الجمهور على هوية الفائز' : 'Who will win? (Fan Poll)'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isAr ? `إجمالي أصوات الجماهير: ${totalVotes} صوت` : `Total fan votes: ${totalVotes}`}
                </p>

                {/* Vote Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  <button
                    onClick={() => handleVote('HOME')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                      userVoted === 'HOME'
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-md ring-1 ring-emerald-400/30'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-emerald-500/60'
                    }`}
                  >
                    <TeamLogo teamName={match.homeTeam} logo={match.homeLogo} sizeClassName="w-6 h-6" />
                    <span className="font-bold text-[11px] truncate max-w-full">
                      {isAr ? match.homeTeamAr : match.homeTeam}
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-400">{homePct}%</span>
                  </button>

                  <button
                    onClick={() => handleVote('DRAW')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                      userVoted === 'DRAW'
                        ? 'bg-amber-600 border-amber-400 text-white shadow-md ring-1 ring-amber-400/30'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-amber-500/60'
                    }`}
                  >
                    <span className="text-lg">🤝</span>
                    <span className="font-bold text-[11px]">{isAr ? 'تعادل' : 'Draw'}</span>
                    <span className="text-xs font-mono font-black text-amber-400">{drawPct}%</span>
                  </button>

                  <button
                    onClick={() => handleVote('AWAY')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                      userVoted === 'AWAY'
                        ? 'bg-teal-600 border-teal-400 text-white shadow-md ring-1 ring-teal-400/30'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-teal-500/60'
                    }`}
                  >
                    <TeamLogo teamName={match.awayTeam} logo={match.awayLogo} sizeClassName="w-6 h-6" />
                    <span className="font-bold text-[11px] truncate max-w-full">
                      {isAr ? match.awayTeamAr : match.awayTeam}
                    </span>
                    <span className="text-xs font-mono font-black text-teal-400">{awayPct}%</span>
                  </button>
                </div>

                {userVoted && (
                  <p className="text-[11px] font-semibold text-emerald-400 animate-fade-in pt-0.5">
                    ✓ {isAr ? 'شكراً لتصويتك! تم تسجيل رأيك بنجاح.' : 'Thank you! Your vote has been recorded.'}
                  </p>
                )}
              </div>
            </div>
            );
          })()}
        </div>

        {/* Modal Bottom Bar: Quick Close Button */}
        <div className="w-full bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-400 font-bold">
            {isAr ? 'كورة لايف - تفاصيل التشكيل والإحصائيات الحية' : 'Kora Live - Lineups & Real-time stats'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 active:bg-rose-700 text-slate-200 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-rose-500 cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>{isAr ? 'إغلاق النافذة (×)' : 'Close Window (×)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
