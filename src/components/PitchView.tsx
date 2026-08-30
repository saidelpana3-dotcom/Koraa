import React, { useState } from 'react';
import { Lineup, Player, Language } from '../types';
import { Shield, Goal, AlertTriangle, UserCheck, Sparkles, Clock, RefreshCw } from 'lucide-react';

interface PitchViewProps {
  homeTeamName: string;
  homeTeamNameAr: string;
  homeColor: string;
  homeLineup?: Lineup;
  awayTeamName: string;
  awayTeamNameAr: string;
  awayColor: string;
  awayLineup?: Lineup;
  language: Language;
  leagueName?: string;
  matchId?: string;
}

export const PitchView: React.FC<PitchViewProps> = ({
  homeTeamName,
  homeTeamNameAr,
  homeColor,
  homeLineup,
  awayTeamName,
  awayTeamNameAr,
  awayColor,
  awayLineup,
  language,
  leagueName,
  matchId,
}) => {
  const isAr = language === 'ar';
  const [selectedTeam, setSelectedTeam] = useState<'HOME' | 'AWAY'>('HOME');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Dynamic Google Live Lineup State
  const [fetchedHomeLineup, setFetchedHomeLineup] = useState<Lineup | undefined>(homeLineup);
  const [fetchedAwayLineup, setFetchedAwayLineup] = useState<Lineup | undefined>(awayLineup);
  const [isFetchingGoogleLineups, setIsFetchingGoogleLineups] = useState<boolean>(false);
  const [googleLineupMessage, setGoogleLineupMessage] = useState<string | null>(null);

  const effectiveHomeLineup = fetchedHomeLineup || homeLineup;
  const effectiveAwayLineup = fetchedAwayLineup || awayLineup;
  const hasAnyLineup = Boolean(
    (effectiveHomeLineup?.starting11 && effectiveHomeLineup.starting11.length > 0) ||
    (effectiveAwayLineup?.starting11 && effectiveAwayLineup.starting11.length > 0)
  );

  const activeLineup = selectedTeam === 'HOME' ? effectiveHomeLineup : effectiveAwayLineup;
  const activeTeamName = selectedTeam === 'HOME' ? (isAr ? homeTeamNameAr || homeTeamName : homeTeamName) : (isAr ? awayTeamNameAr || awayTeamName : awayTeamName);
  const activeTeamColor = selectedTeam === 'HOME' ? homeColor : awayColor;
  const starting11 = activeLineup?.starting11 || [];
  const substitutes = activeLineup?.substitutes || [];

  const handleFetchOfficialLineupFromGoogle = async () => {
    setIsFetchingGoogleLineups(true);
    setGoogleLineupMessage(null);
    try {
      const res = await fetch('/api/google/sync-match-lineups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          leagueName: leagueName || 'الدوري المصري الممتاز',
          matchId,
          language,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.homeLineup?.starting11?.length) {
          setFetchedHomeLineup(data.data.homeLineup);
        }
        if (data.data.awayLineup?.starting11?.length) {
          setFetchedAwayLineup(data.data.awayLineup);
        }
        setGoogleLineupMessage(
          data.data.message ||
          (isAr ? '✓ تم فحص محرك بحث Google: سيتم نشر التشكيل الرسمي تلقائياً فور اعتماده قبل انطلاق المباراة بساعة.' : '✓ Checked Google: Official lineups publish 60 mins before kickoff.')
        );
      } else {
        setGoogleLineupMessage(
          isAr
            ? '⏳ التشكيل الرسمي لم يُعلن بعد من الأجهزة الفنية، يُنشر رسمياً قبل اللقاء بساعة.'
            : '⏳ Official starting lineup not announced yet. Published 1 hour before kickoff.'
        );
      }
    } catch (e) {
      setGoogleLineupMessage(
        isAr
          ? '⏳ يتم جلب التشكيل الرسمي فور إعلانه عبر محرك بحث Google قبل المباراة.'
          : '⏳ Official lineups are synced automatically via Google prior to kickoff.'
      );
    } finally {
      setIsFetchingGoogleLineups(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Official Google Lineup Checker Banner */}
      <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 rounded-2xl border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <span className="font-black text-white block text-xs sm:text-sm">
              {isAr ? 'التشكيلات الرسمية المعتمدة (Google Live Lineups)' : 'Official Confirmed Lineups (Google Live)'}
            </span>
            <span className="text-[11px] text-slate-400">
              {isAr ? 'تُعلن وتُجلب مباشرة من جوجل قبل انطلاق المباراة بـ 60 دقيقة.' : 'Announced & fetched live via Google 60 mins before match start.'}
            </span>
          </div>
        </div>

        <button
          onClick={handleFetchOfficialLineupFromGoogle}
          disabled={isFetchingGoogleLineups}
          className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 border border-blue-400/30 shadow-md transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingGoogleLineups ? 'animate-spin' : ''}`} />
          <span>
            {isFetchingGoogleLineups
              ? (isAr ? 'جاري الفحص في جوجل...' : 'Checking Google...')
              : (isAr ? 'جلب التشكيل الرسمي من جوجل 🔍' : 'Check Official Lineup 🔍')}
          </span>
        </button>
      </div>

      {googleLineupMessage && (
        <div className="p-3 bg-blue-950/60 border border-blue-500/40 rounded-xl text-xs text-blue-200 flex items-center gap-2 animate-fade-in">
          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{googleLineupMessage}</span>
        </div>
      )}

      {/* Empty State when no lineup has been announced yet */}
      {!hasAnyLineup ? (
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-3xl shadow-inner">
            📋
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="font-extrabold text-white text-base sm:text-lg">
              {isAr ? 'التشكيل الرسمي للمباراة قيد الاعتماد' : 'Official Lineup Awaiting Confirmation'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'لم يتم إعلان التشكيل الرسمي من جانب المديرين الفنيين حتى الآن. سيتم جلب التشكيل الأساسي والبدلاء وخطة اللعب على أرضية الملعب مباشرة من محرك بحث Google قبل المباراة بساعة واحدة.'
                : 'Starting XI has not been published yet by the coaching staff. Lineups and tactical formations will be synced directly from Google prior to kickoff.'}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>{isAr ? 'الموعد المتوقع لإعلان التشكيل: قبل اللقاء بساعة ⏰' : 'Expected Announcement: 1 hour before kickoff ⏰'}</span>
          </div>
        </div>
      ) : (
        <>
          {/* Team Switcher Header */}
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => { setSelectedTeam('HOME'); setSelectedPlayer(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedTeam === 'HOME'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full border border-white/40" style={{ backgroundColor: homeColor }}></span>
                <span>{isAr ? homeTeamNameAr || homeTeamName : homeTeamName}</span>
                <span className="text-[11px] font-mono opacity-80">({effectiveHomeLineup?.formation || '4-3-3'})</span>
              </button>

              <button
                onClick={() => { setSelectedTeam('AWAY'); setSelectedPlayer(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedTeam === 'AWAY'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full border border-white/40" style={{ backgroundColor: awayColor }}></span>
                <span>{isAr ? awayTeamNameAr || awayTeamName : awayTeamName}</span>
                <span className="text-[11px] font-mono opacity-80">({effectiveAwayLineup?.formation || '4-3-3'})</span>
              </button>
            </div>
          </div>

          {/* Realistic Grass Pitch Canvas Box */}
          <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-600/50 bg-emerald-900">
            {/* Grass Stripes Pattern */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-800 via-emerald-900 to-emerald-950">
              <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(0deg,#000_0px,#000_30px,transparent_30px,transparent_60px)]"></div>
            </div>

            {/* Tactical Pitch Lines & Markings */}
            <div className="absolute inset-3 border-2 border-white/40 rounded-lg pointer-events-none">
              {/* Halfway Line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40 transform -translate-y-1/2"></div>
              {/* Center Circle */}
              <div className="absolute top-1/2 left-1/2 w-28 h-28 border-2 border-white/40 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              {/* Center Dot */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/70 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

              {/* Top Penalty Area (Goal Box) */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3/5 h-1/5 border-b-2 border-x-2 border-white/40"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-1/10 border-b-2 border-x-2 border-white/40"></div>

              {/* Bottom Penalty Area */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/5 h-1/5 border-t-2 border-x-2 border-white/40"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 h-1/10 border-t-2 border-x-2 border-white/40"></div>
            </div>

            {/* Players on Pitch */}
            {starting11.map((player) => {
              const isSelected = selectedPlayer?.id === player.id;
              return (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  style={{
                    left: `${player.gridPos.x}%`,
                    top: `${player.gridPos.y}%`,
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                >
                  <div className="flex flex-col items-center">
                    {/* Player Rating Badge */}
                    {player.rating && (
                      <div
                        className={`px-1 py-0.2 rounded text-[9px] font-bold mb-0.5 shadow ${
                          player.rating >= 8.0
                            ? 'bg-emerald-500 text-slate-950'
                            : player.rating >= 7.0
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        {player.rating.toFixed(1)}
                      </div>
                    )}

                    {/* Player Jersey Circle */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-extrabold text-white text-xs sm:text-sm shadow-xl border-2 transition-transform duration-200 group-hover:scale-115 ${
                        isSelected ? 'ring-4 ring-amber-400 border-white scale-110' : 'border-white/80'
                      }`}
                      style={{ backgroundColor: activeTeamColor }}
                    >
                      {player.number}

                      {/* Overlays (Goal / Cards) */}
                      {player.goals && player.goals > 0 && (
                        <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1 rounded-full border border-slate-900 flex items-center">
                          ⚽{player.goals > 1 ? player.goals : ''}
                        </span>
                      )}
                      {player.yellowCard && (
                        <span className="absolute -bottom-1 -right-1 w-2.5 h-3 bg-amber-400 border border-black rounded-xs"></span>
                      )}
                    </div>

                    {/* Player Name Pill */}
                    <div className="mt-1 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur border border-white/20 text-white text-[10px] sm:text-xs font-semibold whitespace-nowrap shadow-md max-w-[90px] truncate text-center">
                      {isAr ? player.nameAr : player.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Player Detail Card (Modal or Bar) */}
          {selectedPlayer && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full font-black text-white text-lg flex items-center justify-center border-2 border-amber-400 shadow-md"
                  style={{ backgroundColor: activeTeamColor }}
                >
                  #{selectedPlayer.number}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-white text-base sm:text-lg">
                      {isAr ? selectedPlayer.nameAr : selectedPlayer.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/30">
                      {selectedPlayer.position}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeTeamName} • {isAr ? 'التشكيلة الأساسية' : 'Starting XI'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold bg-slate-950/60 px-4 py-2 rounded-lg border border-slate-800">
                {selectedPlayer.rating && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'التقييم' : 'Rating'}</span>
                    <span className="text-amber-400 font-bold text-sm">{selectedPlayer.rating.toFixed(1)}</span>
                  </div>
                )}
                {selectedPlayer.goals ? (
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'الأهداف' : 'Goals'}</span>
                    <span className="text-emerald-400 font-bold text-sm">⚽ {selectedPlayer.goals}</span>
                  </div>
                ) : null}
                {selectedPlayer.assists ? (
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'التمريرات' : 'Assists'}</span>
                    <span className="text-teal-400 font-bold text-sm">👟 {selectedPlayer.assists}</span>
                  </div>
                ) : null}
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="ml-auto text-slate-400 hover:text-white text-xs underline cursor-pointer"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          )}

          {/* Substitutes Section */}
          {substitutes.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'دكة البدلاء' : 'Substitutes Bench'}</span>
              </h5>
              <div className="flex flex-wrap gap-2">
                {substitutes.map((sub) => (
                  <div key={sub.id} className="px-2.5 py-1 bg-slate-800/90 rounded-lg text-xs font-medium text-slate-200 border border-slate-700/60 flex items-center gap-1.5">
                    <span className="font-mono text-emerald-400 text-[11px]">#{sub.number}</span>
                    <span>{isAr ? sub.nameAr : sub.name}</span>
                    <span className="text-[10px] text-slate-400">({sub.position})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

