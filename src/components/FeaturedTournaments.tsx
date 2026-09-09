import React, { useState, useMemo } from 'react';
import { Trophy, Sparkles, Gift, ArrowRight, ShieldCheck, Flame, ListFilter, Radio, CheckCircle, CheckCircle2 } from 'lucide-react';
import { Language, ThemeMode, Match } from '../types';
import { MatchCard } from './MatchCard';

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
  onOpenDetails?: (match: Match, tab?: 'lineup' | 'stats' | 'events' | 'ai' | 'predict') => void;
  userPredictions?: Record<string, { predictedHomeScore: number; predictedAwayScore: number }>;
  onSavePrediction?: (match: Match, homeScore: number, awayScore: number) => void;
  onOpenRewards?: () => void;
  onClose?: () => void;
  onFootballSync?: () => void;
  isSyncingFootball?: boolean;
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
  onFootballSync,
  isSyncingFootball = false,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  // Sub-tab filter state: 'all' | 'ongoing' | 'finished'
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
            {visibleTournamentMatches.length}
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
      {visibleTournamentMatches.length === 0 && (
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
