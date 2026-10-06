import React, { useState, useMemo } from 'react';
import { Trophy, Sparkles, Gift, ArrowRight, ShieldCheck, Flame, ListFilter, Radio, CheckCircle, CheckCircle2, Users, Flag } from 'lucide-react';
import { Language, ThemeMode, Match } from '../types';
import { MatchCard } from './MatchCard';
import { LeagueTournamentView } from './LeagueTournamentView';
import { FinishedTournamentsView } from './FinishedTournamentsView';

interface TournamentMatchItemProps {
  match: Match;
  language: Language;
  theme: ThemeMode;
  userPred?: { predictedHomeScore: number; predictedAwayScore: number };
  onOpenDetails?: (match: Match, tab?: 'lineup' | 'stats' | 'events' | 'predict') => void;
}

const TournamentMatchItem: React.FC<TournamentMatchItemProps> = ({
  match,
  language,
  theme,
  userPred,
  onOpenDetails,
}) => {
  return (
    <MatchCard
      match={match}
      language={language}
      theme={theme}
      isFavorite={false}
      onToggleFavorite={() => {}}
      userPrediction={userPred}
      onOpenDetails={(m, tab) => onOpenDetails && onOpenDetails(m, tab)}
    />
  );
};

interface FeaturedTournamentsProps {
  language: Language;
  theme?: ThemeMode;
  tournamentMatches?: Match[];
  allMatches?: Match[];
  onOpenDetails?: (match: Match, tab?: 'lineup' | 'stats' | 'events' | 'predict') => void;
  userPredictions?: Record<string, { predictedHomeScore: number; predictedAwayScore: number }>;
  onSavePrediction?: (match: Match, homeScore: number, awayScore: number) => void;
  userDiamonds?: number;
  onOpenGames?: () => void;
  onOpenRewards?: () => void;
  onClose?: () => void;
  onFootballSync?: () => void;
  isSyncingFootball?: boolean;
  user?: any;
}

export const FeaturedTournaments: React.FC<FeaturedTournamentsProps> = ({
  language,
  theme = 'light',
  tournamentMatches = [],
  allMatches = [],
  onOpenDetails,
  userPredictions = {},
  onSavePrediction,
  userDiamonds = 0,
  onOpenGames,
  onOpenRewards,
  onClose,
  onFootballSync,
  isSyncingFootball = false,
  user,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  // Main Page Tab: 'match_tournaments' (بطولات الماتشات) vs 'league_tournaments' (بطولات الدوريات) vs 'finished_tournaments' (البطولات المنتهية)
  const [mainTab, setMainTab] = useState<'match_tournaments' | 'league_tournaments' | 'finished_tournaments'>('match_tournaments');

  // Sub-tab filter state for match tournaments: 'all' | 'ongoing' | 'finished'
  const [filterTab, setFilterTab] = useState<'all' | 'ongoing' | 'finished'>('all');

  const visibleTournamentMatches = useMemo(() => {
    return tournamentMatches;
  }, [tournamentMatches]);

  // Segregate matches into Ongoing and Finished
  const { ongoingMatches, finishedMatches } = useMemo(() => {
    const ongoing: Match[] = [];
    const finished: Match[] = [];

    visibleTournamentMatches.forEach((m) => {
      const isFin = m.status === 'FINISHED' || m.pointsDistributed === true;
      if (isFin) {
        finished.push(m);
      } else {
        ongoing.push(m);
      }
    });

    return { ongoingMatches: ongoing, finishedMatches: finished };
  }, [visibleTournamentMatches]);

  return (
    <div className="space-y-4 animate-fadeIn pb-16 pt-1">
      {/* Top Header Row with Close / Back Action */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'صفحة مسابقات وبطولات كورة 🏆' : 'Cups & Tournaments Hub 🏆'}
            </h2>
            <p className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
              {isAr ? 'بطولات الماتشات، بطولات الدوريات، والبطولات المنتهية' : 'Match Tournaments, League Cups & Finished Archives'}
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

      {/* TOP THREE MAIN TABS: 1) بطولات الماتشات  2) بطولات الدوريات  3) البطولات المنتهية */}
      <div className={`p-1.5 rounded-2xl border grid grid-cols-3 gap-1.5 shadow-xs ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        {/* Tab 1: بطولات الماتشات */}
        <button
          type="button"
          onClick={() => setMainTab('match_tournaments')}
          className={`py-2 px-1.5 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            mainTab === 'match_tournaments'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{isAr ? 'بطولات الماتشات' : 'Match Cups'}</span>
        </button>

        {/* Tab 2: بطولات الدوريات */}
        <button
          type="button"
          onClick={() => setMainTab('league_tournaments')}
          className={`py-2 px-1.5 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            mainTab === 'league_tournaments'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{isAr ? 'بطولات الدوريات' : 'League Cups'}</span>
        </button>

        {/* Tab 3: البطولات المنتهية (طلب المستخدم الصريح) */}
        <button
          type="button"
          onClick={() => setMainTab('finished_tournaments')}
          className={`py-2 px-1.5 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            mainTab === 'finished_tournaments'
              ? 'bg-gradient-to-r from-indigo-600 to-slate-800 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="text-xs">🏁</span>
          <span className="truncate">{isAr ? 'البطولات المنتهية' : 'Finished'}</span>
        </button>
      </div>

      {/* RENDER VIEW ACCORDING TO SELECTED MAIN TAB */}
      {mainTab === 'league_tournaments' ? (
        <LeagueTournamentView
          language={language}
          theme={theme}
          user={user}
          allMatches={allMatches.length > 0 ? allMatches : tournamentMatches}
          onOpenDetails={onOpenDetails}
          onSavePrediction={onSavePrediction}
          userDiamonds={userDiamonds}
          onOpenGames={onOpenGames}
        />
      ) : mainTab === 'finished_tournaments' ? (
        <FinishedTournamentsView
          language={language}
          theme={theme}
          onNavigateToLeagueTournaments={() => setMainTab('league_tournaments')}
          onNavigateToMatchTournaments={() => setMainTab('match_tournaments')}
        />
      ) : (
        /* EXISTING MATCH TOURNAMENTS SYSTEM (بطولات الماتشات - PRESERVED EXACTLY AS IS) */
        <div className="space-y-4">
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
                  <span>{isAr ? 'بطولات الماتشات وقِمم الكؤوس 🏆' : 'Match Tournaments & Featured Cups 🏆'}</span>
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

            {/* Prizes Teaser */}
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

          {/* Real-time Connection Status */}
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
                {visibleTournamentMatches.length}
              </span>
            </button>

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

          {/* Matches List */}
          {ongoingMatches.length === 0 && finishedMatches.length === 0 ? (
            <div className={`p-8 sm:p-10 rounded-3xl border text-center space-y-3 shadow-xs ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-2xl shadow-inner">
                🏆
              </div>
              <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? 'لا توجد مباريات متاحة حالياً في بطولات الماتشات' : 'No Matches Available in Match Tournaments'}
              </h4>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-sm mx-auto leading-relaxed font-medium`}>
                {isAr 
                  ? 'تمت إزالة وتفريغ مباريات بطولات الماتشات حالياً، وسيتم إضافة وتحديث مواعيد مباريات الكؤوس والبطولات المجمعة قريباً فور اعتمادها رسمياً ⚽'
                  : 'All match tournament fixtures have been removed, and upcoming cup fixtures will be announced soon ⚽'}
              </p>
            </div>
          ) : (
            <>
              {((filterTab === 'all' && ongoingMatches.length > 0) || filterTab === 'ongoing') && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Flame className="w-4 h-4 text-emerald-500" />
                    <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isAr ? 'المباريات الجارية والقادمة في الكؤوس' : 'Live & Upcoming Cup Fixtures'}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {ongoingMatches.map((m) => (
                      <TournamentMatchItem
                        key={m.id}
                        match={m}
                        language={language}
                        theme={theme}
                        userPred={userPredictions[m.id]}
                        onOpenDetails={onOpenDetails}
                      />
                    ))}
                  </div>
                </div>
              )}

              {((filterTab === 'all' && finishedMatches.length > 0) || filterTab === 'finished') && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isAr ? 'المباريات المنتهية' : 'Finished Fixtures'}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {finishedMatches.map((m) => (
                      <TournamentMatchItem
                        key={m.id}
                        match={m}
                        language={language}
                        theme={theme}
                        userPred={userPredictions[m.id]}
                        onOpenDetails={onOpenDetails}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Info notice about regular tournament additions */}
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
      )}
    </div>
  );
};
