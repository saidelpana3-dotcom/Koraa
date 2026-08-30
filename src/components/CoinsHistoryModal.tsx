import React from 'react';
import { 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Calendar, 
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { Language, Match, ThemeMode } from '../types';
import { TeamLogo } from './TeamLogo';
import { evaluateUserPredictionsList, FINISHED_MATCHES_CATALOG } from '../utils/predictionEvaluator';

export interface WonCoinItem {
  id: string;
  matchId: string;
  homeTeam: string;
  homeTeamAr: string;
  awayTeam: string;
  awayTeamAr: string;
  homeLogo?: string;
  awayLogo?: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  actualHomeScore?: number;
  actualAwayScore?: number;
  coinsEarned: number;
  pointsEarned: number;
  leagueName?: string;
  leagueNameAr?: string;
  date?: string;
  dateAr?: string;
  evaluatedAt?: string;
}

interface CoinsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme?: ThemeMode;
  user: any;
  userPoints: number;
  matches?: Match[];
  userPredictions?: Record<string, { predictedHomeScore: number; predictedAwayScore: number }>;
  onNavigateToPredictionsMatch: (matchId: string) => void;
  onNavigateToMatchesTab: () => void;
  onSignIn?: () => void;
}

export const CoinsHistoryModal: React.FC<CoinsHistoryModalProps> = ({
  isOpen,
  onClose,
  language,
  theme = 'light',
  user,
  userPoints,
  matches = [],
  userPredictions = {},
  onNavigateToPredictionsMatch,
  onNavigateToMatchesTab,
  onSignIn,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  // Retrieve user predictions list from localStorage or combine with current state
  const userKey = user ? user.uid : 'guest';
  const storageKey = `kora_my_predictions_${userKey}`;
  const savedRaw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
  let allUserPreds: any[] = [];
  if (savedRaw) {
    try {
      allUserPreds = JSON.parse(savedRaw);
      if (!Array.isArray(allUserPreds)) allUserPreds = [];
    } catch (_) {
      allUserPreds = [];
    }
  }

  // Evaluate user predictions to get all exact winning records
  const { winningPredictions, totalCoins: calculatedCoins } = evaluateUserPredictionsList(allUserPreds, matches);

  const winningRecords: WonCoinItem[] = winningPredictions.map((pred: any) => {
    const matchId = pred.matchId || (typeof pred.id === 'string' && pred.id.startsWith('pred_') ? pred.id.split('_').pop() : pred.id);
    const targetMatch = matches.find((m) => m.id === matchId);
    const catalogEntry = FINISHED_MATCHES_CATALOG[matchId];

    const actualHome = targetMatch?.homeScore ?? catalogEntry?.homeScore ?? pred.matchHomeScore ?? pred.predictedHomeScore;
    const actualAway = targetMatch?.awayScore ?? catalogEntry?.awayScore ?? pred.matchAwayScore ?? pred.predictedAwayScore;
    const coinsEarned = pred.coinsEarned || pred.pointsEarned || 50;

    return {
      id: pred.id || `won_${matchId}`,
      matchId: matchId,
      homeTeam: targetMatch?.homeTeam || catalogEntry?.homeTeam || pred.matchHomeTeam || 'Home Team',
      homeTeamAr: targetMatch?.homeTeamAr || catalogEntry?.homeTeamAr || pred.matchHomeTeamAr || 'الفريق المضيف',
      awayTeam: targetMatch?.awayTeam || catalogEntry?.awayTeam || pred.matchAwayTeam || 'Away Team',
      awayTeamAr: targetMatch?.awayTeamAr || catalogEntry?.awayTeamAr || pred.matchAwayTeamAr || 'الفريق الضيف',
      homeLogo: targetMatch?.homeLogo,
      awayLogo: targetMatch?.awayLogo,
      predictedHomeScore: Number(pred.predictedHomeScore),
      predictedAwayScore: Number(pred.predictedAwayScore),
      actualHomeScore: actualHome,
      actualAwayScore: actualAway,
      coinsEarned: coinsEarned,
      pointsEarned: coinsEarned,
      leagueName: targetMatch?.leagueName,
      leagueNameAr: targetMatch?.leagueNameAr,
      date: targetMatch?.date || pred.createdAt,
      dateAr: targetMatch?.dateAr,
      evaluatedAt: pred.evaluatedAt || pred.createdAt,
    };
  });

  const totalWonCoins = winningRecords.reduce((acc, curr) => acc + curr.coinsEarned, 0);
  const correctMatchesCount = winningRecords.length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-hidden"
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-lg rounded-3xl border-2 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-all ${
          isDark 
            ? 'bg-slate-900 border-amber-500/40 text-white' 
            : 'bg-white border-amber-300 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar */}
        <div className={`p-4 sm:p-5 border-b relative z-10 flex items-center justify-between gap-3 ${
          isDark 
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-slate-800' 
            : 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border shrink-0 ${
              isDark 
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300' 
                : 'bg-amber-100 border-amber-300 text-amber-800'
            }`}>
              🪙
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-[10px] font-black uppercase px-2 py-0.2 rounded-full border ${
                  isDark 
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {isAr ? 'كشف تفاصيل الأرباح ⚡' : 'Coins Earnings Log ⚡'}
                </span>
              </div>
              <h3 className={`font-black text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? 'تفاصيل أرباح الكوينز والمباريات' : 'Coins Breakdown & Matches'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            title={isAr ? 'إغلاق (×)' : 'Close (×)'}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border shadow-md active:scale-95 shrink-0 ${
              isDark 
                ? 'bg-slate-800/95 hover:bg-rose-600 active:bg-rose-700 text-white border-slate-700' 
                : 'bg-slate-100 hover:bg-rose-600 active:bg-rose-700 text-slate-700 hover:text-white border-slate-200'
            }`}
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Stats Summary Strip */}
        <div className={`p-3.5 sm:p-4 border-b grid grid-cols-2 gap-2.5 text-center ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* Box 1: Total Coins */}
          <div className={`p-2.5 sm:p-3 rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-amber-500/30' : 'bg-white border-amber-200 shadow-sm'
          }`}>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
              {isAr ? 'رصيد الكوينز المتوفر' : 'Available Coins'}
            </span>
            <div className="font-mono text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
              <span>🪙</span>
              <span>{user ? userPoints : 0}</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{isAr ? 'كوينز' : 'coins'}</span>
            </div>
          </div>

          {/* Box 2: Correct Predictions Count (عدد المباريات الصحيحة) */}
          <div className={`p-2.5 sm:p-3 rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-emerald-500/30' : 'bg-white border-emerald-200 shadow-sm'
          }`}>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
              {isAr ? 'عدد المباريات الصحيحة' : 'Correct Matches'}
            </span>
            <div className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
              <span>🎯</span>
              <span>{correctMatchesCount}</span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{isAr ? 'مباراة' : 'matches'}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Matches List Area */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[50vh]">
          {winningRecords.length > 0 ? (
            <>
              <div className="flex items-center justify-between text-[11px] font-black text-slate-500 dark:text-slate-400 px-1 mb-1">
                <span>{isAr ? 'المباريات التي كسبت منها +50 كوينز:' : 'Matches where you earned +50 Coins:'}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {winningRecords.length} {isAr ? 'توقع رابح' : 'wins'} (+{totalWonCoins} 🪙)
                </span>
              </div>

              {winningRecords.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onNavigateToPredictionsMatch(item.matchId);
                    onClose();
                  }}
                  className={`group p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 active:scale-[0.99] ${
                    isDark
                      ? 'bg-slate-950/80 hover:bg-slate-900 border-amber-500/30 hover:border-amber-400 shadow-md'
                      : 'bg-white hover:bg-amber-50/40 border-slate-200 hover:border-amber-300 shadow-sm'
                  }`}
                  title={isAr ? 'اضغط لعرض المباراة في سجل التوقعات' : 'Click to view in Predictions History'}
                >
                  {/* Left Side: Match Details & Teams */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`p-1.5 rounded-xl border flex items-center gap-1 shrink-0 ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <TeamLogo teamName={item.homeTeamAr || item.homeTeam} logo={item.homeLogo} sizeClassName="w-7 h-7 sm:w-8 sm:h-8" />
                      <span className="text-[10px] font-black text-slate-400">VS</span>
                      <TeamLogo teamName={item.awayTeamAr || item.awayTeam} logo={item.awayLogo} sizeClassName="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-extrabold text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {isAr ? `${item.homeTeamAr} ضد ${item.awayTeamAr}` : `${item.homeTeam} vs ${item.awayTeam}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-500/30">
                          {isAr ? `توقعك الدقيق: ${item.predictedHomeScore} - ${item.predictedAwayScore}` : `Exact Score: ${item.predictedHomeScore} - ${item.predictedAwayScore}`}
                        </span>
                        {item.date && (
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{isAr ? (item.dateAr || item.date) : item.date}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Coins Won Badge & Action Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-slate-200 dark:border-slate-800/80 pt-2 sm:pt-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-400/50 text-amber-800 dark:text-amber-300 font-mono font-black text-xs shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>+{item.coinsEarned} {isAr ? 'كوينز 🪙' : 'Coins'}</span>
                    </span>

                    <span className={`text-[11px] font-black flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 text-amber-400 border-amber-500/30' 
                        : 'bg-slate-100 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-700 border-slate-200'
                    }`}>
                      <span>{isAr ? 'عرض في السجل' : 'View in Log'}</span>
                      <ExternalLink className="w-3 h-3 rtl:rotate-0" />
                    </span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            /* Empty State: No winning predictions yet */
            <div className={`p-6 sm:p-8 rounded-3xl border text-center space-y-3 ${
              isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-3xl border shadow-inner ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                🎯
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  {isAr ? 'لم تكسب كوينز من المباريات بعد!' : 'No match coins earned yet!'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isAr 
                    ? 'كل توقع دقيق لنتيجة المباراة يمنحك +50 كوينز 🪙 تضاف فوراً لرصيدك لتسحبها كاش عبر إنستاباي والمحافظ!' 
                    : 'Every exact score prediction earns you +50 Coins directly to your balance to withdraw as cash!'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onNavigateToMatchesTab();
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-white font-black text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>{isAr ? 'توقع مباريات اليوم الآن (+50 كوينز)' : 'Predict Today Matches Now (+50 Coins)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-3 sm:p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{isAr ? 'البيانات والأرباح مؤمنة ومحفوظة سحابياً' : 'Earnings and stats safely synced to cloud'}</span>
          </div>

          <button
            onClick={() => {
              onNavigateToPredictionsMatch('');
              onClose();
            }}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' 
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm'
            }`}
          >
            <span>{isAr ? 'فتح صفحة سجل التوقعات كاملة' : 'Open Full Predictions History'}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0 rotate-180 text-amber-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
