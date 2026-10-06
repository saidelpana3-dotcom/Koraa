import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award, 
  Calendar, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Flame, 
  ShieldCheck,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Language, ThemeMode, FinishedTournamentRecord } from '../types';
import { getFinishedTournaments } from '../data/leagueTournaments';
import { TeamLogo } from './TeamLogo';

interface FinishedTournamentsViewProps {
  language: Language;
  theme?: ThemeMode;
  onNavigateToLeagueTournaments?: () => void;
  onNavigateToMatchTournaments?: () => void;
}

export const FinishedTournamentsView: React.FC<FinishedTournamentsViewProps> = ({
  language,
  theme = 'light',
  onNavigateToLeagueTournaments,
  onNavigateToMatchTournaments,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  const [finishedList, setFinishedList] = useState<FinishedTournamentRecord[]>(() => {
    return getFinishedTournaments();
  });

  const [filterType, setFilterType] = useState<'all' | 'league' | 'match_cup'>('all');
  const [expandedTournamentId, setExpandedTournamentId] = useState<string | null>(null);

  // Listen to live updates if a tournament is finalized
  useEffect(() => {
    const handleUpdate = () => {
      setFinishedList(getFinishedTournaments());
    };
    window.addEventListener('kora_finished_tournaments_updated', handleUpdate);
    return () => window.removeEventListener('kora_finished_tournaments_updated', handleUpdate);
  }, []);

  const filteredTournaments = finishedList.filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const toggleExpand = (id: string) => {
    setExpandedTournamentId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Banner for Finished Tournaments */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800 text-white' 
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border-slate-700 text-white shadow-md'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'أرشيف وسجل الشرف 🏁' : 'Hall of Fame Archive 🏁'}</span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'البطولات المنتهية والأبطال المتوجون' : 'Finished Tournaments & Champions'}
            </h3>
            <p className="text-xs text-slate-300 font-bold max-w-md">
              {isAr
                ? 'نتائج البطولات المكتملة، منصة التتويج، وأصحاب المراكز الفائزة بجوائز الكوينز والكاش.'
                : 'Final standings, podium champions, and awarded prizes for completed tournaments.'}
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0">
            🏁
          </div>
        </div>

        {/* Filter sub-buttons */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isAr ? 'جميع البطولات' : 'All Tournaments'} ({finishedList.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('league')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'league'
                ? 'bg-emerald-500 text-white font-black shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isAr ? 'بطولات الدوريات' : 'League Tournaments'}
          </button>

          <button
            type="button"
            onClick={() => setFilterType('match_cup')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'match_cup'
                ? 'bg-indigo-500 text-white font-black shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isAr ? 'بطولات الماتشات' : 'Match Cups'}
          </button>
        </div>
      </div>

      {/* Finished Tournaments List or Empty State */}
      {filteredTournaments.length === 0 ? (
        <div className={`p-8 sm:p-10 rounded-3xl border text-center space-y-4 ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
        }`}>
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-3xl shadow-xs">
            🏆
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'لا توجد بطولات منتهية حالياً' : 'No Finished Tournaments Yet'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
              {isAr 
                ? 'البطولات الحالية ما زالت جارية وتنتظر انطلاق مبارياتها واكتمال منافساتها. فور انتهاء مباريات أي بطولة واعتماد جوائز المراكز الأولى، ستُؤرشف جميع تفاصيلها وقائمة الشرف هنا تلقائياً.'
                : 'Active tournaments are in progress. Once fixtures conclude and top 3 podium prizes are awarded, they will be permanently recorded here in the Hall of Fame.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {onNavigateToLeagueTournaments && (
              <button
                type="button"
                onClick={onNavigateToLeagueTournaments}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-sm hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isAr ? 'الانتقال لبطولة الدوريات الحالية' : 'Go to Current League Tournament'}</span>
              </button>
            )}

            {onNavigateToMatchTournaments && (
              <button
                type="button"
                onClick={onNavigateToMatchTournaments}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Trophy className="w-4 h-4" />
                <span>{isAr ? 'الانتقال لبطولات الماتشات' : 'Go to Match Tournaments'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTournaments.map((tourn) => {
            const isExpanded = expandedTournamentId === tourn.id;
            const top1 = tourn.podium.find(p => p.rank === 1);
            const top2 = tourn.podium.find(p => p.rank === 2);
            const top3 = tourn.podium.find(p => p.rank === 3);

            return (
              <div 
                key={tourn.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isDark 
                    ? 'bg-slate-900/90 border-slate-800 text-white' 
                    : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                }`}
              >
                {/* Tournament Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center text-xl shrink-0">
                      🏆
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          tourn.type === 'league' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {tourn.type === 'league' ? (isAr ? 'بطولة دوريات' : 'League Tournament') : (isAr ? 'بطولة ماتشات' : 'Match Cup')}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isAr ? 'منتهية وتم توزيع الجوائز' : 'Completed & Awarded'}</span>
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black mt-0.5">
                        {isAr ? tourn.titleAr : tourn.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-bold self-end sm:self-auto">
                    <div className="flex items-center gap-1 font-mono">
                      <Users className="w-3.5 h-3.5" />
                      <span>{tourn.totalParticipants} {isAr ? 'مشترك' : 'players'}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(tourn.completedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                    </div>
                  </div>
                </div>

                {/* PODIUM OF CHAMPIONS (منصة تتويج المراكز الثلاثة الأولى) */}
                <div className="p-4 sm:p-5 bg-gradient-to-b from-amber-500/5 to-transparent">
                  <div className="text-center mb-3">
                    <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                      {isAr ? '🌟 أصحاب المراكز الثلاثة الأولى المتوجون بالجوائز' : '🌟 Top 3 Podium Winners'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto">
                    {/* Rank 2 (Silver) */}
                    <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 order-1 ${
                      isDark ? 'bg-slate-950/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white flex items-center justify-center font-black text-sm shadow-xs">
                        🥈
                      </div>
                      <div className="w-full">
                        <span className="text-[10px] text-slate-500 font-bold block">{isAr ? 'المركز الثاني' : '2nd'}</span>
                        <h5 className="text-xs font-black truncate max-w-full">
                          {top2?.userName || '-'}
                        </h5>
                      </div>
                      <div className="w-full pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="text-xs font-black font-mono text-slate-600 dark:text-slate-300 block">
                          +{top2?.prizeCoins || 80} 🪙
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">
                          {top2?.correctPredictionsCount ?? 0} {isAr ? 'صحيح' : 'correct'}
                        </span>
                      </div>
                    </div>

                    {/* Rank 1 (Gold - Champion) */}
                    <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 order-2 -mt-2 shadow-md ${
                      isDark ? 'bg-slate-950 border-amber-500/40 ring-1 ring-amber-500/30' : 'bg-amber-50 border-amber-300'
                    }`}>
                      <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
                        🥇
                      </div>
                      <div className="w-full">
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-black block">{isAr ? 'البطل (الأول)' : 'Champion'}</span>
                        <h5 className="text-xs font-black truncate max-w-full">
                          {top1?.userName || '-'}
                        </h5>
                      </div>
                      <div className="w-full pt-1 border-t border-amber-200/60 dark:border-slate-800">
                        <span className="text-xs sm:text-sm font-black font-mono text-amber-600 dark:text-amber-400 block">
                          +{top1?.prizeCoins || 100} 🪙
                        </span>
                        <span className="text-[9px] text-amber-700 dark:text-amber-300 font-bold">
                          {top1?.correctPredictionsCount ?? 0} {isAr ? 'صحيح' : 'correct'}
                        </span>
                      </div>
                    </div>

                    {/* Rank 3 (Bronze) */}
                    <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 order-3 ${
                      isDark ? 'bg-slate-950/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
                        🥉
                      </div>
                      <div className="w-full">
                        <span className="text-[10px] text-amber-700 dark:text-amber-500 font-bold block">{isAr ? 'المركز الثالث' : '3rd'}</span>
                        <h5 className="text-xs font-black truncate max-w-full">
                          {top3?.userName || '-'}
                        </h5>
                      </div>
                      <div className="w-full pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="text-xs font-black font-mono text-amber-700 dark:text-amber-500 block">
                          +{top3?.prizeCoins || 60} 🪙
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">
                          {top3?.correctPredictionsCount ?? 0} {isAr ? 'صحيح' : 'correct'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expand Toggle Button */}
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleExpand(tourn.id)}
                    className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <span>{isExpanded ? (isAr ? 'إخفاء التفاصيل والنتائج' : 'Hide Details') : (isAr ? 'عرض جدول الترتيب ونتائج المباريات' : 'View Standings & Match Scores')}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {tourn.matches?.length || 0} {isAr ? 'مباريات' : 'matches'}
                  </span>
                </div>

                {/* Expanded Section: Full Standings & Match Scores */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-950/40 animate-fadeIn">
                    {/* Finished Matches in this tournament */}
                    {tourn.matches && tourn.matches.length > 0 && (
                      <div className="space-y-2">
                        <h6 className="text-xs font-black flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <span>⚽</span>
                          <span>{isAr ? 'نتائج مباريات البطولة' : 'Tournament Match Results'}</span>
                        </h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {tourn.matches.map((m, idx) => (
                            <div 
                              key={idx}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <TeamLogo teamName={m.homeTeam} logo={m.homeLogo} sizeClassName="w-6 h-6" />
                                <span className="text-xs font-bold truncate">
                                  {isAr ? (m.homeTeamAr || m.homeTeam) : m.homeTeam}
                                </span>
                              </div>

                              <div className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shrink-0">
                                {m.homeScore ?? 0} - {m.awayScore ?? 0}
                              </div>

                              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                <span className="text-xs font-bold truncate text-right">
                                  {isAr ? (m.awayTeamAr || m.awayTeam) : m.awayTeam}
                                </span>
                                <TeamLogo teamName={m.awayTeam} logo={m.awayLogo} sizeClassName="w-6 h-6" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Final Standings Table */}
                    {tourn.finalStandings && tourn.finalStandings.length > 0 && (
                      <div className="space-y-2">
                        <h6 className="text-xs font-black flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <span>📊</span>
                          <span>{isAr ? 'جدول الترتيب النهائي لجميع المشتركين' : 'Final Participants Standings'}</span>
                        </h6>
                        <div className={`rounded-xl border overflow-hidden ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                          <div className="grid grid-cols-12 px-3 py-2 text-[10px] font-black border-b border-slate-200/80 dark:border-slate-800 text-slate-500">
                            <div className="col-span-2 text-center">{isAr ? 'المركز' : 'Rank'}</div>
                            <div className="col-span-6">{isAr ? 'المتسابق' : 'Participant'}</div>
                            <div className="col-span-4 text-center">{isAr ? 'التوقعات الصحيحة' : 'Correct'}</div>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                            {tourn.finalStandings.map((p, idx) => (
                              <div key={idx} className="grid grid-cols-12 px-3 py-1.5 items-center text-xs">
                                <div className="col-span-2 text-center font-bold font-mono">
                                  {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}
                                </div>
                                <div className="col-span-6 font-bold truncate flex items-center gap-1.5 min-w-0">
                                  <span className="truncate">{p.userName}</span>
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono font-black text-[11px] shrink-0" dir="ltr">
                                    {p.correctPredictionsCount || 0} - 4
                                  </span>
                                </div>
                                <div className="col-span-4 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">
                                  <span dir="ltr">{p.correctPredictionsCount || 0} - 4</span>
                                  <span className="text-[10px] text-slate-400 font-sans block">
                                    {isAr ? `(${p.correctPredictionsCount || 0} من 4)` : `(${p.correctPredictionsCount || 0}/4)`}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
