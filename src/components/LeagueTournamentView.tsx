import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Clock, 
  Award, 
  Sparkles, 
  Flame, 
  Calendar, 
  ChevronRight, 
  ShieldCheck, 
  Gift, 
  AlertCircle,
  HelpCircle,
  Coins
} from 'lucide-react';
import { Language, ThemeMode, Match, LeagueTournament } from '../types';
import { 
  getActiveLeagueTournament, 
  saveLeagueTournament, 
  joinLeagueTournament, 
  submitLeaguePrediction, 
  calculateLeagueStandings, 
  isLeagueMatchLocked
} from '../data/leagueTournaments';
import { TeamLogo } from './TeamLogo';
import { OrangeDiamondIcon } from './OrangeDiamondIcon';

interface LeagueTournamentViewProps {
  language: Language;
  theme?: ThemeMode;
  user: any;
  allMatches?: Match[];
  onOpenDetails?: (match: Match, tab?: 'lineup' | 'stats' | 'events' | 'predict') => void;
  onSavePrediction?: (match: Match, homeScore: number, awayScore: number) => void;
  userDiamonds?: number;
  onOpenGames?: () => void;
}

export type LeagueSubTab = 'matches' | 'standings' | 'prizes';

export const LeagueTournamentView: React.FC<LeagueTournamentViewProps> = ({
  language,
  theme = 'light',
  user,
  allMatches = [],
  onOpenDetails,
  onSavePrediction,
  userDiamonds = 0,
  onOpenGames,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  // Sub-tab: 'matches' | 'standings' | 'prizes'
  const [subTab, setSubTab] = useState<LeagueSubTab>('matches');

  // Active Tournament state
  const [tournament, setTournament] = useState<LeagueTournament>(() => getActiveLeagueTournament());

  // Listen to tournament updates from other views (e.g. when predicted on main matches screen)
  useEffect(() => {
    const handleTournamentUpdate = () => {
      setTournament(getActiveLeagueTournament());
    };
    window.addEventListener('kora_league_tournament_updated', handleTournamentUpdate);
    return () => {
      window.removeEventListener('kora_league_tournament_updated', handleTournamentUpdate);
    };
  }, []);

  // Prediction input state: Record<matchId, { home: number; away: number }>
  const [predictionInputs, setPredictionInputs] = useState<Record<string, { home: number; away: number }>>({});

  // Action status feedback
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const currentUserId = user?.uid || (typeof window !== 'undefined' ? localStorage.getItem('kora_guest_uid') || 'guest' : 'guest');
  const currentUserName = user?.displayName || user?.email?.split('@')[0] || (isAr ? 'أنت' : 'You');

  // Check if current user has joined
  const isUserJoined = useMemo(() => {
    return tournament.participants.some(p => p.userId === currentUserId);
  }, [tournament.participants, currentUserId]);

  // Current user participant record
  const userParticipant = useMemo(() => {
    return tournament.participants.find(p => p.userId === currentUserId);
  }, [tournament.participants, currentUserId]);

  // Standings list strictly ordered by correct predictions count
  const standings = useMemo(() => {
    return calculateLeagueStandings(tournament);
  }, [tournament]);

  // User rank in standings
  const userRankItem = useMemo(() => {
    return standings.find(p => p.userId === currentUserId);
  }, [standings, currentUserId]);

  // Progress percentage toward 250 participants
  const participantsProgress = useMemo(() => {
    return Math.min(100, Math.round((tournament.participantsCount / tournament.minRequiredParticipants) * 100));
  }, [tournament.participantsCount, tournament.minRequiredParticipants]);

  const remainingParticipants = Math.max(0, tournament.minRequiredParticipants - tournament.participantsCount);

  // Handle Free Joining
  const handleJoinTournament = () => {
    const res = joinLeagueTournament(user, tournament);
    setTournament(res.tournament);
    setStatusMessage(res.message);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Handle quick + / - score changes
  const handleScoreAdjust = (matchId: string, side: 'home' | 'away', delta: number) => {
    const existing = predictionInputs[matchId] || {
      home: userParticipant?.predictions?.[matchId]?.predictedHomeScore ?? 0,
      away: userParticipant?.predictions?.[matchId]?.predictedAwayScore ?? 0,
    };
    const nextVal = Math.max(0, Math.min(15, (existing[side] || 0) + delta));
    setPredictionInputs(prev => ({
      ...prev,
      [matchId]: {
        ...existing,
        [side]: nextVal,
      },
    }));
  };

  // Submit prediction for a match
  const handleSaveMatchPrediction = (matchId: string) => {
    const existingPred = userParticipant?.predictions?.[matchId];
    if (!existingPred && userDiamonds < 50) {
      setStatusMessage(
        isAr
          ? `⚠️ رسوم توقع أي مباراة هي 50 ماسة برتقالية (رصيدك الحالي: ${userDiamonds} ماسة). ابدأ اللعب في صفحة Games لجمع الماسات!`
          : `⚠️ Predicting any match requires 50 Orange Diamonds (Your balance: ${userDiamonds}). Play in Games to earn diamonds!`
      );
      setTimeout(() => setStatusMessage(null), 5000);
      return;
    }

    const scores = predictionInputs[matchId] || {
      home: userParticipant?.predictions?.[matchId]?.predictedHomeScore ?? 0,
      away: userParticipant?.predictions?.[matchId]?.predictedAwayScore ?? 0,
    };

    const res = submitLeaguePrediction(tournament, matchId, currentUserId, scores.home, scores.away);
    setStatusMessage(res.message);
    if (res.success) {
      setTournament(res.tournament);
      // Sync to main page prediction state (which also deducts 50 diamonds for new prediction)
      const targetMatch = tournament.matches.find(m => m.id === matchId);
      if (targetMatch && onSavePrediction) {
        onSavePrediction(targetMatch, scores.home, scores.away);
      }
    }
    setTimeout(() => setStatusMessage(null), 4500);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Banner / Header with 250 Participants Rule */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 text-white' 
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Trophy className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {isAr ? tournament.titleAr : tournament.title}
              </h3>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isAr ? tournament.descriptionAr : tournament.description}
            </p>
          </div>

          {/* Free Participation Action Badge */}
          <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
            {isUserJoined ? (
              <div className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'أنت منضم للمسابقة' : 'You are Joined'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleJoinTournament}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>{isAr ? 'انضم للمسابقة مجاناً 🚀' : 'Join Free 🚀'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 250 Participants Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-black">
            <div className="flex items-center gap-1.5">
              {tournament.isUnlocked ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{isAr ? 'التوقعات مفتوحة الآن!' : 'Predictions Unlocked!'}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isAr ? 'الحد الأدنى لفتح التوقعات: 250 لاعب' : '250 Players Needed to Unlock'}</span>
                </span>
              )}
            </div>
            <div className="font-mono text-slate-700 dark:text-slate-300">
              <span className="text-emerald-600 dark:text-emerald-400 font-black">{tournament.participantsCount}</span>
              <span className="text-slate-400"> / </span>
              <span>{tournament.minRequiredParticipants}</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-sans mx-1">
                ({isAr ? 'لاعب' : 'players'})
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                tournament.isUnlocked
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400'
              }`}
              style={{ width: `${participantsProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-bold">
            <span>
              {tournament.isUnlocked
                ? (isAr ? '🎉 اكتمل النصاب المطلوب وتم فتح التوقعات لجميع المسجلين' : 'Threshold reached! All participants can predict now.')
                : (isAr ? `متبقي ${remainingParticipants} لاعب لفتح التوقعات للمباريات` : `${remainingParticipants} more needed to open predictions`)}
            </span>
            <span className="font-mono text-slate-500">{participantsProgress}%</span>
          </div>
        </div>

        {/* Free Entry & Top 3 Prizes Summary Kicker */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="text-emerald-600 dark:text-emerald-400 font-black">
              {isAr ? '🎁 المشاركة مجانية 100%' : '🎁 100% Free Entry'}
            </span>
            <span>·</span>
            <span>
              {isAr
                ? `جوائز المراكز الـ 3 الأولى: ${tournament.prizes?.first?.coins || 200} و ${tournament.prizes?.second?.coins || 150} و ${tournament.prizes?.third?.coins || 100} كوينز 🪙`
                : `Top 3 Prizes: ${tournament.prizes?.first?.coins || 200}, ${tournament.prizes?.second?.coins || 150} & ${tournament.prizes?.third?.coins || 100} Coins 🪙`}
            </span>
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400">
            {isAr ? 'ينتهي التوقع مع انطلاق كل مباراة' : 'Predictions lock at kickoff'}
          </div>
        </div>
      </div>

      {/* Status Alert if any */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-black animate-fadeIn flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="whitespace-pre-line">{statusMessage}</span>
        </div>
      )}

      {/* 3 Sub-Pages Selector Tabs: [المباريات] [الترتيب] [الجوائز] */}
      <div className={`p-1 rounded-xl border flex items-center justify-between gap-1 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          type="button"
          onClick={() => setSubTab('matches')}
          className={`flex-1 py-2 px-3 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            subTab === 'matches'
              ? 'bg-emerald-600 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isAr ? 'المباريات' : 'Matches'}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20">
            {tournament.matches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('standings')}
          className={`flex-1 py-2 px-3 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            subTab === 'standings'
              ? 'bg-amber-600 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{isAr ? 'الترتيب' : 'Standings'}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20">
            {tournament.participants.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('prizes')}
          className={`flex-1 py-2 px-3 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            subTab === 'prizes'
              ? 'bg-indigo-600 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>{isAr ? 'الجوائز (المراكز الـ 3)' : 'Prizes (Top 3)'}</span>
        </button>
      </div>

      {/* SUB-PAGE 1: MATCHES (المباريات) */}
      {subTab === 'matches' && (
        <div className="space-y-3">
          {/* Locked Notice if < 250 */}
          {!tournament.isUnlocked && (
            <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
              isDark ? 'bg-amber-950/30 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <Lock className="w-5 h-5 shrink-0 text-amber-500" />
              <div className="text-xs space-y-0.5">
                <p className="font-black">
                  {isAr ? 'التوقعات مقفولة حتى اكتمال 250 لاعب' : 'Predictions locked until 250 players join'}
                </p>
                <p className="text-[11px] font-bold opacity-90">
                  {isAr 
                    ? `انضم الآن مجاناً وادعُ أصدقاءك! متبقي ${remainingParticipants} مشترك لفتح التوقعات فوراً.` 
                    : `Join free now! Only ${remainingParticipants} more spots needed to unlock.`}
                </p>
              </div>
            </div>
          )}

          {/* List of Dedicated Matches */}
          {tournament.matches.length === 0 ? (
            <div className={`p-8 sm:p-10 rounded-3xl border text-center space-y-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}>
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-3xl shadow-xs">
                ⚽
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isAr ? 'مباريات البطولة قيد الإعداد' : 'Tournament Matches in Preparation'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                  {isAr
                    ? 'سيتم تحديد وإدراج مباريات الجولة رسمياً في البطولة فور اكتمال نصاب المشتركين المطلوب (250 مشترك). انضم الآن لتسريع انطلاق المسابقة!'
                    : 'Official tournament fixtures will be scheduled once the 250 participants quota is reached. Join free now to help unlock the tournament!'}
                </p>
              </div>

              {!isUserJoined && (
                <button
                  type="button"
                  onClick={handleJoinTournament}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  <span>{isAr ? 'انضم للمسابقة مجاناً 🚀' : 'Join Free Now 🚀'}</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Matches Info Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-500">
                  {tournament.matches.length} {isAr ? 'مباريات في البطولة' : 'matches in tournament'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {tournament.matches.map((match) => {
                  const isLocked = isLeagueMatchLocked(match);
                  const userPred = userParticipant?.predictions?.[match.id];
                  const currentInput = predictionInputs[match.id] || {
                    home: userPred?.predictedHomeScore ?? 0,
                    away: userPred?.predictedAwayScore ?? 0,
                  };

                  return (
                    <div 
                      key={match.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        isDark 
                          ? 'bg-slate-900/90 border-slate-800 text-white' 
                          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                      }`}
                    >
                      {/* Top Match Header: Competition + Kickoff */}
                      <div className="flex items-start justify-between gap-2 text-xs pb-2 border-b border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-start gap-1.5 font-black text-slate-700 dark:text-slate-300 text-[10px] sm:text-[11px] min-w-0 flex-1">
                          <span className="text-xs shrink-0 mt-0.5">{match.leagueIcon || '⚽'}</span>
                          <span className="break-words whitespace-normal leading-tight text-right">
                            {isAr ? match.leagueNameAr : match.leagueName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] shrink-0 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{match.dayLabelAr || match.dateAr || match.date}</span>
                          <span>-</span>
                          <span className="font-mono font-black text-slate-800 dark:text-slate-200">{match.time}</span>
                        </div>
                      </div>

                  {/* Teams Row */}
                  <div className="py-3 flex items-center justify-between gap-2">
                    {/* Home Team */}
                    <div className="flex-1 flex flex-col items-center text-center gap-1">
                      <TeamLogo teamName={match.homeTeam} logo={match.homeLogo} sizeClassName="w-10 h-10" />
                      <span className="font-black text-xs line-clamp-1">
                        {isAr ? (match.homeTeamAr || match.homeTeam) : match.homeTeam}
                      </span>
                    </div>

                    {/* Center: Live / Final Score or VS */}
                    <div className="flex flex-col items-center px-2">
                      {match.status === 'FINISHED' || match.status === 'LIVE' ? (
                        <div className="font-mono font-black text-xl text-slate-900 dark:text-white">
                          <span>{match.homeScore}</span>
                          <span className="mx-1 text-slate-400">:</span>
                          <span>{match.awayScore}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-black text-slate-400 font-mono">VS</span>
                      )}
                      <span className={`text-[10px] font-bold mt-0.5 px-2 py-0.5 rounded-full ${
                        isLocked 
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                          : tournament.isUnlocked
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {isLocked 
                          ? (isAr ? 'انتهى التوقع 🔒' : 'Locked 🔒') 
                          : tournament.isUnlocked 
                          ? (isAr ? 'متاح للتوقع ✍️' : 'Open ✍️') 
                          : (isAr ? 'معلق للـ 250 لاعب' : 'Pending 250')}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex flex-col items-center text-center gap-1">
                      <TeamLogo teamName={match.awayTeam} logo={match.awayLogo} sizeClassName="w-10 h-10" />
                      <span className="font-black text-xs line-clamp-1">
                        {isAr ? (match.awayTeamAr || match.awayTeam) : match.awayTeam}
                      </span>
                    </div>
                  </div>

                  {/* Prediction Controls Section */}
                  <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800">
                    {!tournament.isUnlocked ? (
                      <div className="text-center py-2 space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-black">
                          <span>🔒</span>
                          <span>{isAr ? 'التوقعات مقفولة حتى اكتمال 250 لاعباً' : 'Locked until 250 players join'}</span>
                        </div>
                        {!isUserJoined ? (
                          <div>
                            <button
                              type="button"
                              onClick={handleJoinTournament}
                              className="text-xs font-black text-emerald-600 dark:text-emerald-400 underline cursor-pointer hover:text-emerald-500"
                            >
                              {isAr ? 'انضم مجاناً للمساهمة في فتح التوقعات' : 'Join free to help unlock predictions'}
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {isAr ? '✅ أنت مشترك! ستُفتح التوقعات فور وصول العدد إلى 250 لاعباً' : 'Joined! Predictions will unlock once 250 players join'}
                          </div>
                        )}
                      </div>
                    ) : isLocked ? (
                      <div className="flex items-center justify-between text-xs font-bold px-1">
                        <span className="text-slate-500">
                          {isAr ? 'انتهت فترة التوقع مع صافرة البداية' : 'Predictions closed at kickoff'}
                        </span>
                        {userPred ? (
                          <div className="flex items-center gap-1 font-mono font-black text-emerald-600 dark:text-emerald-400">
                            <span>{isAr ? 'توقعك:' : 'Your pick:'}</span>
                            <span>{userPred.predictedHomeScore} - {userPred.predictedAwayScore}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">{isAr ? 'لم تسجل توقعاً' : 'No prediction'}</span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {!isUserJoined ? (
                          <div className="text-center py-1">
                            <button
                              type="button"
                              onClick={handleJoinTournament}
                              className="text-xs font-black text-emerald-600 dark:text-emerald-400 underline cursor-pointer"
                            >
                              {isAr ? 'انضم للمسابقة أولاً لتسجيل توقعك مجاناً' : 'Join first to submit predictions'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            {/* Home Counter */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleScoreAdjust(match.id, 'home', -1)}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-sm flex items-center justify-center active:scale-90 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-mono font-black text-sm">
                                {currentInput.home}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleScoreAdjust(match.id, 'home', 1)}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-sm flex items-center justify-center active:scale-90 cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            {/* Center Save Action */}
                            <button
                              type="button"
                              onClick={() => handleSaveMatchPrediction(match.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
                            >
                              {userPred ? (
                                <span>{isAr ? 'تعديل التوقع' : 'Update'}</span>
                              ) : (
                                <>
                                  <span>{isAr ? 'توقع (50 ماسة' : 'Predict (50'}</span>
                                  <OrangeDiamondIcon className="w-3.5 h-3.5" />
                                  <span>)</span>
                                </>
                              )}
                            </button>

                            {/* Away Counter */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleScoreAdjust(match.id, 'away', -1)}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-sm flex items-center justify-center active:scale-90 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-mono font-black text-sm">
                                {currentInput.away}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleScoreAdjust(match.id, 'away', 1)}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-sm flex items-center justify-center active:scale-90 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}

                        {userPred && (
                          <div className="text-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {isAr ? '✅ تم حفظ توقعك:' : '✅ Saved pick:'} <span className="font-mono font-black">{userPred.predictedHomeScore} - {userPred.predictedAwayScore}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
              </div>
            </>
          )}
        </div>
      )}

      {/* SUB-PAGE 2: STANDINGS (الترتيب) */}
      {subTab === 'standings' && (
        <div className="space-y-3">
          {/* Rules Reminder: Strictly based on correct predictions count */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>
                {isAr 
                  ? 'الترتيب مبني بالكامل على عدد التوقعات الصحيحة' 
                  : 'Rankings strictly based on correct predictions count'}
              </span>
            </div>
            {userRankItem && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono font-black text-xs shrink-0" dir="ltr">
                  {userRankItem.correctPredictionsCount || 0} - 4
                </span>
                <div className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {isAr ? `مركزك: #${userRankItem.rank}` : `Your Rank: #${userRankItem.rank}`}
                </div>
              </div>
            )}
          </div>

          {/* Standings Table or Empty State if 0 participants */}
          {standings.length === 0 ? (
            <div className={`p-8 sm:p-10 rounded-3xl border text-center space-y-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}>
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center text-3xl shadow-xs">
                👥
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isAr ? 'لا يوجد مشتركون في البطولة حتى الآن' : 'No Participants Yet'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                  {isAr
                    ? 'العدد الحالي: 0 مشترك. تم حذف الأسماء والمشاركين الوهميين كما طلبت، وسيزيد العدد تصاعدياً وتلقائياً فور انضمام كل مشترك حقيقي!'
                    : 'Current count: 0 participants. Seeded players removed. Player counter increments organically as users join.'}
                </p>
              </div>

              {!isUserJoined && (
                <button
                  type="button"
                  onClick={handleJoinTournament}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  <span>{isAr ? 'كن أول المنضمين للبطولة مجاناً 🚀' : 'Be First to Join Free 🚀'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
            }`}>
              <div className="grid grid-cols-12 px-3 py-2.5 text-[11px] font-black border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <div className="col-span-2 text-center">{isAr ? 'المركز' : 'Rank'}</div>
                <div className="col-span-5">{isAr ? 'المتسابق' : 'Participant'}</div>
                <div className="col-span-3 text-center">{isAr ? 'التوقعات الصحيحة' : 'Correct'}</div>
                <div className="col-span-2 text-center">{isAr ? 'الجائزة' : 'Prize'}</div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[480px] overflow-y-auto">
                {standings.map((player) => {
                  const isMe = player.userId === currentUserId;
                  const isTop1 = player.rank === 1;
                  const isTop2 = player.rank === 2;
                  const isTop3 = player.rank === 3;

                  return (
                    <div 
                      key={player.userId}
                      className={`grid grid-cols-12 px-3 py-2.5 items-center text-xs transition-colors ${
                        isMe 
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/15 font-black' 
                          : isTop1 
                          ? 'bg-amber-500/5' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Rank */}
                      <div className="col-span-2 flex items-center justify-center font-black">
                        {isTop1 ? (
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] shadow-xs">
                            🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white text-[11px]">
                            🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white text-[11px]">
                            🥉
                          </span>
                        ) : (
                          <span className="font-mono text-slate-500 text-xs">#{player.rank}</span>
                        )}
                      </div>

                      {/* Participant Name with 1 - 4 Score Badge */}
                      <div className="col-span-5 font-bold truncate flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{player.userName}</span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500 text-white font-black shrink-0">
                            {isAr ? 'أنت' : 'You'}
                          </span>
                        )}
                        {/* Format: 1 - 4, 2 - 4 (واحد شرطة كده أربعة) */}
                        <span 
                          className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono font-black text-[11px] shrink-0 shadow-2xs" 
                          dir="ltr"
                          title={isAr ? `توقع ${player.correctPredictionsCount || 0} من 4 مباريات بشكل صحيح` : `Predicted ${player.correctPredictionsCount || 0} of 4 correctly`}
                        >
                          {player.correctPredictionsCount || 0} - 4
                        </span>
                      </div>

                      {/* Correct Count */}
                      <div className="col-span-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">
                        <span className="text-xs sm:text-sm font-black" dir="ltr">
                          {player.correctPredictionsCount || 0} - 4
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans block">
                          {isAr ? `(${player.correctPredictionsCount || 0} من 4 صح)` : `(${player.correctPredictionsCount || 0}/4)`}
                        </span>
                      </div>

                      {/* Prize Badge for Top 3 */}
                      <div className="col-span-2 text-center">
                        {isTop1 ? (
                          <span className="font-mono font-black text-[11px] text-amber-600 dark:text-amber-400">
                            {tournament.prizes?.first?.coins ?? 200} 🪙
                          </span>
                        ) : isTop2 ? (
                          <span className="font-mono font-black text-[11px] text-slate-600 dark:text-slate-300">
                            {tournament.prizes?.second?.coins ?? 150} 🪙
                          </span>
                        ) : isTop3 ? (
                          <span className="font-mono font-black text-[11px] text-amber-700 dark:text-amber-500">
                            {tournament.prizes?.third?.coins ?? 100} 🪙
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-PAGE 3: PRIZES (الجوائز - للمراكز الثلاثة الأولى فقط) */}
      {subTab === 'prizes' && (
        <div className="space-y-3">
          {/* Rules Banner: 3 Top Ranks Only */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-500" />
              <h4 className="text-sm font-black">
                {isAr ? 'جوائز المراكز الثلاثة الأولى فقط 🏆' : 'Top 3 Places Prizes Only 🏆'}
              </h4>
            </div>
            <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-400">
              {isAr 
                ? 'فقط أصحاب المراكز الثلاثة الأولى في جدول ترتيب البطولة يحصلون على جوائز الكوينز الرسمية عند اعتماد وتوزيع النتائج.'
                : 'Only the top 3 leaderboard ranks receive the official coins prize pool upon final settlement.'}
            </p>
          </div>

          {/* 3 Prize Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1st Place Card */}
            <div className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 ${
              isDark 
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' 
                : 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-xs">
                🥇
              </div>
              <div>
                <span className="text-xs font-black block">
                  {isAr ? 'المركز الأول' : '1st Place'}
                </span>
                <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 block mt-0.5">
                  {tournament.prizes?.first?.coins ?? 200} {isAr ? 'كوينز 🪙' : 'Coins 🪙'}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                {isAr ? 'المتصدر بعدد التوقعات الصحيحة' : 'Leader with most correct picks'}
              </p>
            </div>

            {/* 2nd Place Card */}
            <div className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 ${
              isDark 
                ? 'bg-slate-800/40 border-slate-700 text-slate-200' 
                : 'bg-slate-50 border-slate-300 text-slate-900 shadow-xs'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-slate-300/30 border border-slate-400/40 flex items-center justify-center text-2xl shadow-xs">
                🥈
              </div>
              <div>
                <span className="text-xs font-black block">
                  {isAr ? 'المركز الثاني' : '2nd Place'}
                </span>
                <span className="text-lg font-black font-mono text-slate-700 dark:text-slate-300 block mt-0.5">
                  {tournament.prizes?.second?.coins ?? 150} {isAr ? 'كوينز 🪙' : 'Coins 🪙'}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                {isAr ? 'صاحب المركز الثاني بالترتيب' : 'Runner-up in standings'}
              </p>
            </div>

            {/* 3rd Place Card */}
            <div className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 ${
              isDark 
                ? 'bg-amber-950/15 border-amber-700/30 text-amber-300' 
                : 'bg-amber-100/50 border-amber-300 text-amber-950 shadow-xs'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-700/20 border border-amber-700/30 flex items-center justify-center text-2xl shadow-xs">
                🥉
              </div>
              <div>
                <span className="text-xs font-black block">
                  {isAr ? 'المركز الثالث' : '3rd Place'}
                </span>
                <span className="text-lg font-black font-mono text-amber-700 dark:text-amber-500 block mt-0.5">
                  {tournament.prizes?.third?.coins ?? 100} {isAr ? 'كوينز 🪙' : 'Coins 🪙'}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                {isAr ? 'صاحب المركز الثالث بالترتيب' : '3rd place in standings'}
              </p>
            </div>
          </div>

          {/* Official Prize Info Card */}
          <div className={`p-4 rounded-2xl border text-center space-y-1.5 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400">
              <Trophy className="w-4 h-4" />
              <span>{isAr ? 'نظام الجوائز الرسمي' : 'Official Prize System'}</span>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {tournament.prizesDistributed
                ? (isAr ? '✅ تم اعتماد وتوزيع الجوائز الرسمية على أصحاب المراكز الثلاثة الأولى.' : 'Prizes officially awarded to top 3 winners.')
                : (isAr ? 'يتم اعتماد وتوزيع الكوينز للمراكز الثلاثة الأولى رسمياً بواسطة إدارة التطبيق فور انتهاء جميع مباريات الجولة.' : 'Prizes are officially verified and awarded by tournament admins after all matches conclude.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
