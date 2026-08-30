import React, { useState, useEffect, useMemo } from 'react';
import { Match, Language } from '../types';
import { PitchView } from './PitchView';
import { TeamLogo } from './TeamLogo';
import { generateFinishedMatchStats } from '../lib/matchStatsGenerator';
import { updateMatchResultInCloud } from '../lib/matchCloudSync';
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
  initialTab?: 'lineup' | 'stats' | 'events' | 'ai' | 'predict';
  onClose: () => void;
  language: Language;
  onVotePrediction: (matchId: string, choice: 'HOME' | 'DRAW' | 'AWAY') => void;
  onSavePrediction?: (match: Match, homeScore: number, awayScore: number) => void;
  existingPrediction?: { predictedHomeScore: number; predictedAwayScore: number };
  isSubscribed?: boolean;
  onOpenSubscribeModal?: (match: Match) => void;
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
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'lineup' | 'stats' | 'events' | 'ai' | 'predict'>(initialTab);

  // Lock background body scroll while modal is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, []);

  // AI Tactical Analysis State
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [userVoted, setUserVoted] = useState<'HOME' | 'DRAW' | 'AWAY' | null>(null);

  // Exact Score Prediction state
  const [predHomeScore, setPredHomeScore] = useState<number>(() => existingPrediction ? existingPrediction.predictedHomeScore : 0);
  const [predAwayScore, setPredAwayScore] = useState<number>(() => existingPrediction ? existingPrediction.predictedAwayScore : 0);
  const [predictionSaved, setPredictionSaved] = useState<boolean>(false);

  // Admin / Publisher Result Broadcast State
  const [adminHomeScore, setAdminHomeScore] = useState<number>(() => match.homeScore !== undefined ? match.homeScore : 0);
  const [adminAwayScore, setAdminAwayScore] = useState<number>(() => match.awayScore !== undefined ? match.awayScore : 0);
  const [adminStatus, setAdminStatus] = useState<'FINISHED' | 'LIVE' | 'UPCOMING'>(() => match.status || 'FINISHED');
  const [isPublishingResult, setIsPublishingResult] = useState<boolean>(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (match.homeScore !== undefined) setAdminHomeScore(match.homeScore);
    if (match.awayScore !== undefined) setAdminAwayScore(match.awayScore);
    if (match.status) setAdminStatus(match.status);
  }, [match.id, match.homeScore, match.awayScore, match.status]);

  // Google Match Events Search Grounding State
  const [isSyncingGoogleEvents, setIsSyncingGoogleEvents] = useState<boolean>(false);
  const [googleCommentary, setGoogleCommentary] = useState<string | null>(null);
  const [googleEventsList, setGoogleEventsList] = useState<any[]>([]);
  const [googleSources, setGoogleSources] = useState<any[]>([]);
  const [googleSyncedTime, setGoogleSyncedTime] = useState<string | null>(null);

  const handleSyncEventsWithGoogle = async () => {
    setIsSyncingGoogleEvents(true);
    try {
      const res = await fetch('/api/google/sync-match-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          leagueName: match.leagueName || match.leagueNameAr,
          matchId: match.id,
          language,
        }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        if (result.data.liveCommentary) {
          setGoogleCommentary(result.data.liveCommentary);
        }
        if (Array.isArray(result.data.events) && result.data.events.length > 0) {
          setGoogleEventsList(result.data.events);
        }
        if (Array.isArray(result.sources)) {
          setGoogleSources(result.sources);
        }
        setGoogleSyncedTime(new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US'));
      }
    } catch (err) {
      console.warn('Google match events sync fallback:', err);
    } finally {
      setIsSyncingGoogleEvents(false);
    }
  };

  useEffect(() => {
    if (existingPrediction) {
      setPredHomeScore(existingPrediction.predictedHomeScore);
      setPredAwayScore(existingPrediction.predictedAwayScore);
    } else {
      setPredHomeScore(0);
      setPredAwayScore(0);
    }
  }, [existingPrediction, match.id]);

  useEffect(() => {
    if (activeTab === 'ai' && !aiReport && !aiLoading) {
      fetchAITacticalReport();
    }
  }, [activeTab, match.id]);

  const fetchAITacticalReport = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          league: match.leagueName,
          language,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiReport(data);
      } else {
        setAiError(data.error || 'Failed to generate AI analysis.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Error communicating with AI server.');
    } finally {
      setAiLoading(false);
    }
  };

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
              <span className="text-xs sm:text-sm font-black text-white truncate">
                {isAr ? match.leagueNameAr : match.leagueName}
              </span>
              <span className="text-[10px] text-slate-400 font-bold truncate">
                {isAr ? (match.dateAr || match.date) : match.date}{match.status === 'UPCOMING' ? ` • ${match.time}` : ''}
              </span>
            </div>
            {match.status === 'LIVE' && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-black text-[10px] animate-pulse shrink-0">
                {isAr ? 'مباشر الآن 🔴' : 'LIVE 🔴'}
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
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-400 mb-1.5 pe-14 rtl:pe-0 rtl:ps-14 sm:pe-0 sm:rtl:ps-0">
            <span className="text-xs sm:text-sm">{match.leagueIcon || '🏆'}</span>
            <span className="truncate max-w-[120px] sm:max-w-none">{isAr ? match.leagueNameAr : match.leagueName}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-bold">{isAr ? (match.dateAr || match.date) : match.date}{match.status === 'UPCOMING' ? ` ، ${match.time}` : ''}</span>
            {match.isGoogleSynced && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 font-extrabold text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <span>{isAr ? 'نتائج جوجل 🔴' : 'Google Live 🔴'}</span>
              </span>
            )}
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
              {match.status === 'UPCOMING' ? (
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
              {match.status === 'LIVE' && (
                <span className="mt-1 text-[9px] sm:text-[10px] font-bold text-emerald-400 animate-pulse bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                  {match.minute}' LIVE
                </span>
              )}
              {/* User prediction or unpredicted notice right under live or final score */}
              {existingPrediction && match.status !== 'UPCOMING' ? (
                <div className={`mt-1.5 px-2.5 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black border shadow-xs whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  match.status === 'FINISHED'
                    ? (match.homeScore === existingPrediction.predictedHomeScore && match.awayScore === existingPrediction.predictedAwayScore)
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/90 text-slate-300 border-slate-700'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  <span>🎯</span>
                  <span>{isAr ? 'توقعك:' : 'Pred:'}</span>
                  <span className="font-mono font-black">{existingPrediction.predictedHomeScore}</span>
                  <span className="text-slate-400 font-bold">-</span>
                  <span className="font-mono font-black">{existingPrediction.predictedAwayScore}</span>
                  {match.status === 'FINISHED' && match.homeScore === existingPrediction.predictedHomeScore && match.awayScore === existingPrediction.predictedAwayScore && (
                    <span className="text-emerald-400 font-bold">✓</span>
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
            onClick={() => {
              setActiveTab('ai');
              if (!aiReport && !aiLoading) fetchAITacticalReport();
            }}
            className={`py-2 px-2 sm:py-2.5 sm:px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
              activeTab === 'ai'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>{isAr ? 'كورة AI' : 'Kora AI'}</span>
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

        {/* Tab Body Content with strict touch scroll containment */}
        <div 
          className="p-3.5 sm:p-6 overflow-y-auto overscroll-contain flex-1 text-slate-200 touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          
          {/* TAB 1: Pitch Lineups */}
          {activeTab === 'lineup' && (
            <PitchView
              homeTeamName={match.homeTeam}
              homeTeamNameAr={match.homeTeamAr}
              homeColor={match.homeColor}
              homeLineup={match.homeLineup}
              awayTeamName={match.awayTeam}
              awayTeamNameAr={match.awayTeamAr}
              awayColor={match.awayColor}
              awayLineup={match.awayLineup}
              language={language}
              leagueName={match.leagueNameAr || match.leagueName}
              matchId={match.id}
            />
          )}

          {/* TAB 2: Match Events Timeline */}
          {activeTab === 'events' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Google Live Search Integration Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 rounded-2xl border border-blue-500/40 shadow-lg space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm text-blue-300">
                      {isAr ? 'مربوط بـ نتائج جوجل المباشرة (Google Search Grounding)' : 'Connected with Google Search Live Scores'}
                    </span>
                  </div>

                  <button
                    onClick={handleSyncEventsWithGoogle}
                    disabled={isSyncingGoogleEvents}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-xs flex items-center gap-1.5 border border-blue-300/40 cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-cyan-200 ${isSyncingGoogleEvents ? 'animate-spin' : ''}`} />
                    <span>
                      {isSyncingGoogleEvents
                        ? (isAr ? 'جاري البحث بـ Google...' : 'Searching Google...')
                        : (isAr ? 'جلب أحدث الأحداث من جوجل 🔴' : 'Fetch Google Events 🔴')}
                    </span>
                  </button>
                </div>

                {googleSyncedTime && (
                  <p className="text-[11px] text-cyan-300 font-semibold">
                    {isAr ? `✓ تم جلب أحداث جوجل المباشرة بنجاح عند: ${googleSyncedTime}` : `✓ Google Live Events fetched at: ${googleSyncedTime}`}
                  </p>
                )}

                {googleCommentary && (
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-blue-500/30 text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                    <span className="font-black text-cyan-400 block mb-1">
                      {isAr ? '🎙️ تغطية جوجل المباشرة:' : '🎙️ Live Coverage from Google:'}
                    </span>
                    {googleCommentary}
                  </div>
                )}

                {googleSources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold">{isAr ? 'مصادر نتائج جوجل الموثوقة:' : 'Google Sources:'}</span>
                    {googleSources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] bg-blue-500/10 text-blue-300 hover:text-blue-200 border border-blue-500/30 px-2 py-0.5 rounded-md truncate max-w-[180px]"
                      >
                        🌐 {src.title || src.uri}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {(!match.events || match.events.length === 0) && googleEventsList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                  <p>{isAr ? 'اضغط على زر جلب الأحداث أعلى لتحديث مجريات الماتش من جوجل.' : 'Click "Fetch Google Events" above to load match timeline.'}</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-800 rtl:border-l-0 rtl:border-r-2 ml-4 rtl:ml-0 rtl:mr-4 space-y-6">
                  {[...googleEventsList, ...(match.events || [])].map((evt, idx) => {
                    const isHome = evt.team === 'HOME';
                    return (
                      <div key={evt.id || idx} className="relative pl-6 rtl:pl-0 rtl:pr-6 flex items-start gap-3">
                        <span className="absolute -left-2.5 rtl:-left-auto rtl:-right-2.5 top-0 w-5 h-5 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-400">
                          {evt.minute}'
                        </span>
                        
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex-1 flex items-center justify-between shadow-md">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-sm">
                                {isAr ? (evt.playerNameAr || evt.playerName) : evt.playerName}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400">
                                ({isHome ? (isAr ? match.homeTeamAr : match.homeTeam) : (isAr ? match.awayTeamAr : match.awayTeam)})
                              </span>
                            </div>
                            {evt.detail && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                {isAr ? evt.detailAr || evt.detail : evt.detail}
                              </p>
                            )}
                          </div>

                          <div className="text-xl">
                            {evt.type === 'GOAL' && '⚽'}
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
          )}

          {/* TAB 3: Comprehensive Live & Post-Match Stats */}
          {activeTab === 'stats' && (() => {
            const stats = match.status === 'FINISHED'
              ? (match.stats?.manOfTheMatch ? match.stats : generateFinishedMatchStats(match))
              : (match.stats || generateFinishedMatchStats(match));

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

          {/* TAB 4: AI Tactical Analysis */}
          {activeTab === 'ai' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="p-4 bg-gradient-to-r from-teal-950/60 to-emerald-950/60 rounded-2xl border border-teal-500/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-base">
                      {isAr ? 'تحليل كورة التكتيكي الذكي (Gemini)' : 'Kora AI Match Engine'}
                    </h4>
                    <p className="text-xs text-teal-300/80">
                      {isAr ? 'رؤى تكتيكية مدعومة بذكاء جيميناي الاصطناعي' : 'Powered by Gemini AI Model'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={fetchAITacticalReport}
                  disabled={aiLoading}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {aiLoading ? (isAr ? 'جاري التحليل...' : 'Analyzing...') : (isAr ? 'تحديث التحليل' : 'Re-analyze')}
                </button>
              </div>

              {aiLoading && (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-teal-300">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-xs font-semibold">
                    {isAr ? 'جاري قراءة الخريطة الحرارية والخطط التكتيكية...' : 'Processing tactical formations & xG metrics...'}
                  </p>
                </div>
              )}

              {aiError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                  {aiError}
                </div>
              )}

              {aiReport && !aiLoading && (
                <div className="space-y-4 text-xs sm:text-sm">
                  {/* Overview */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <h5 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                      <Flame className="w-4 h-4" />
                      <span>{isAr ? 'السيناريو والأسلوب التكتيكي' : 'Tactical Overview'}</span>
                    </h5>
                    <p className="text-slate-300 leading-relaxed">
                      {typeof aiReport.tacticalOverview === 'object'
                        ? JSON.stringify(aiReport.tacticalOverview)
                        : String(aiReport.tacticalOverview || '')}
                    </p>
                  </div>

                  {/* Key Matchups */}
                  {Array.isArray(aiReport.keyMatchups) && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <h5 className="font-bold text-amber-400 mb-2">
                        {isAr ? 'أهم 3 مواجهات ثنائية حاسمة:' : 'Key Individual Duels:'}
                      </h5>
                      <ul className="space-y-2">
                        {aiReport.keyMatchups.map((m: any, i: number) => {
                          let text = '';
                          if (typeof m === 'string') {
                            text = m;
                          } else if (typeof m === 'object' && m !== null) {
                            if (m.matchup && m.description) {
                              text = `${m.matchup}: ${m.description}`;
                            } else if (m.matchup) {
                              text = m.matchup;
                            } else if (m.players || m.player1) {
                              text = `${m.players || `${m.player1} vs ${m.player2}`}${m.description ? `: ${m.description}` : ''}`;
                            } else {
                              text = Object.values(m).join(' - ');
                            }
                          } else {
                            text = String(m);
                          }
                          return (
                            <li key={i} className="flex items-start gap-2 text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{text}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Predicted Outcome */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <h5 className="font-bold text-teal-400 mb-1">
                      {isAr ? 'التوقع والتأثير التكتيكي (xG Factor)' : 'Predicted Outcome & X-Factor'}
                    </h5>
                    <p className="text-slate-300 mb-2">
                      {typeof aiReport.predictedOutcome === 'object'
                        ? JSON.stringify(aiReport.predictedOutcome)
                        : String(aiReport.predictedOutcome || '')}
                    </p>
                    {aiReport.xGFactor && (
                      <div className="mt-2 p-2.5 rounded bg-teal-500/10 border border-teal-500/20 text-teal-300 font-semibold text-xs">
                        🔑 {typeof aiReport.xGFactor === 'object' ? JSON.stringify(aiReport.xGFactor) : String(aiReport.xGFactor)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Fan Predictions & Exact Score Entry */}
          {activeTab === 'predict' && (() => {
            const isFinished = match.status === 'FINISHED';
            const isStarted = match.status === 'LIVE' || match.status === 'HALF_TIME' || (match.kickoffTimeMs ? Date.now() >= match.kickoffTimeMs : false);
            const isPredictionLocked = isFinished || isStarted || match.isPredictionClosed;
            const coinsReward = match.customCoinsReward || 50;

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
                        (match.homeScore === existingPrediction.predictedHomeScore && match.awayScore === existingPrediction.predictedAwayScore)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {(match.homeScore === existingPrediction.predictedHomeScore && match.awayScore === existingPrediction.predictedAwayScore)
                          ? (isAr ? 'صحيح (+50 كوينز) 🏆' : 'Exact (+50 Coins) 🏆')
                          : (isAr ? 'لم يصب التوقع' : 'Missed')}
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
                      {isAr
                        ? `🎉 حصل كل منهم على +${coinsReward} كوينز 🪙 في رصيد المحفظة`
                        : `🎉 Each winner earned +${coinsReward} Coins 🪙 in their wallet`}
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
                <div className="p-3.5 sm:p-4 bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl border border-amber-500/40 shadow-xl space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black">
                    <span className="animate-pulse">✨</span>
                    <span>{isAr ? `توقع النتيجة الدقيقة واكسب +${coinsReward} كوينز لرصيدك` : `Predict Exact Score (+${coinsReward} Coins)`}</span>
                  </div>

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
                        : 'bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 text-white shadow-amber-950/40 ring-1 ring-amber-400/50'
                    }`}
                  >
                    <span className="text-base">🎯</span>
                    <span>
                      {predictionSaved
                        ? (isAr ? '✓ تم حفظ توقعك بنجاح!' : '✓ Prediction Saved!')
                        : existingPrediction
                        ? (isAr ? 'تعديل وحفظ التوقع 🎯' : 'Update Prediction 🎯')
                        : (isAr ? `سجل توقعك الآن (+${coinsReward} كوينز عند صحة النتيجة) 🎯` : `Submit Prediction (+${coinsReward} Coins) 🎯`)}
                    </span>
                  </button>
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
                        <div className="text-[10px] text-amber-300/80 font-medium">
                          {isAr ? '+50 كوينز عند إصابة النتيجة' : '+50 Coins on match end'}
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

              {/* SECTION: Global Match Result Broadcaster (تحديث النتيجة لجميع المستخدمين فوراً) */}
              <div className="p-3.5 sm:p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/80 rounded-2xl border-2 border-indigo-500/40 shadow-xl space-y-3 text-right rtl:text-right ltr:text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white font-extrabold text-xs sm:text-sm">
                    <span className="text-base">📢</span>
                    <span>{isAr ? 'إدارة وتحديث النتيجة لجميع المستخدمين' : 'Global Match Result Broadcaster'}</span>
                  </div>
                  <span className="text-[10px] text-indigo-300 font-black bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/40">
                    {isAr ? 'تحديث سحابي مباشر 🌐' : 'Live Cloud Sync 🌐'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300">
                  {isAr 
                    ? 'عند تعديل النتيجة هنا والضغط على الزر، سيتم حفظ النتيجة وتحديثها لجميع المستخدمين في نفس اللحظة واحتساب الـ ٥٠ كوينز للتوقعات الصحيحة فوراً دون الحاجة لإعادة نشر.' 
                    : 'Updating the score here broadcasts the result globally to all users and evaluates 50 coins for winning predictions.'}
                </p>

                {/* Score Controls */}
                <div className="grid grid-cols-7 items-center gap-2 py-2 bg-slate-950 p-2.5 rounded-xl border border-indigo-500/30">
                  <div className="col-span-3 flex flex-col items-center gap-1">
                    <span className="font-bold text-[11px] text-slate-200 line-clamp-1">{isAr ? match.homeTeamAr : match.homeTeam}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAdminHomeScore(s => Math.max(0, s - 1))}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
                      >-</button>
                      <span className="text-xl font-black font-mono text-emerald-400 w-6 text-center">{adminHomeScore}</span>
                      <button
                        type="button"
                        onClick={() => setAdminHomeScore(s => s + 1)}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
                      >+</button>
                    </div>
                  </div>

                  <div className="col-span-1 text-center font-black text-slate-500">:</div>

                  <div className="col-span-3 flex flex-col items-center gap-1">
                    <span className="font-bold text-[11px] text-slate-200 line-clamp-1">{isAr ? match.awayTeamAr : match.awayTeam}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAdminAwayScore(s => Math.max(0, s - 1))}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
                      >-</button>
                      <span className="text-xl font-black font-mono text-teal-400 w-6 text-center">{adminAwayScore}</span>
                      <button
                        type="button"
                        onClick={() => setAdminAwayScore(s => s + 1)}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
                      >+</button>
                    </div>
                  </div>
                </div>

                {/* Match Status Selection */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminStatus('FINISHED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                      adminStatus === 'FINISHED'
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {isAr ? 'مباراة منتهية (انتهت) 🏆' : 'Finished 🏆'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminStatus('LIVE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                      adminStatus === 'LIVE'
                        ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {isAr ? 'مباشر الآن 🔴' : 'Live 🔴'}
                  </button>
                </div>

                {/* Broadcast Button */}
                <button
                  type="button"
                  disabled={isPublishingResult}
                  onClick={async () => {
                    setIsPublishingResult(true);
                    setPublishSuccessMsg(null);
                    try {
                      const res = await updateMatchResultInCloud({
                        matchId: match.id,
                        homeScore: adminHomeScore,
                        awayScore: adminAwayScore,
                        status: adminStatus,
                        isFinished: adminStatus === 'FINISHED',
                        homeTeamAr: match.homeTeamAr,
                        awayTeamAr: match.awayTeamAr,
                        homeTeam: match.homeTeam,
                        awayTeam: match.awayTeam,
                      });
                      if (res.success) {
                        setPublishSuccessMsg(isAr ? '✓ تم نشر النتيجة بنجاح وتحديثها لجميع المستخدمين وتوزيع الكوينز!' : '✓ Match result broadcasted to all users & points evaluated!');
                        setTimeout(() => setPublishSuccessMsg(null), 5000);
                      }
                    } catch (err: any) {
                      console.error(err);
                    } finally {
                      setIsPublishingResult(false);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer border border-indigo-400/50"
                >
                  {isPublishingResult ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{isAr ? 'جاري النشر لجميع المستخدمين...' : 'Broadcasting to all users...'}</span>
                    </>
                  ) : (
                    <>
                      <span>📢</span>
                      <span>{isAr ? 'حفظ ونشر النتيجة لجميع المستخدمين فوراً 🚀' : 'Broadcast Result to All Users Now 🚀'}</span>
                    </>
                  )}
                </button>

                {publishSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-extrabold text-xs text-center animate-fade-in">
                    {publishSuccessMsg}
                  </div>
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
