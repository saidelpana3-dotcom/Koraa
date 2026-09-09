import React, { useState, useEffect } from 'react';
import { Lineup, Player, Language } from '../types';
import { UserCheck } from 'lucide-react';
import { getOfficialTeamRoster } from '../data/teamRosters';

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

// Default 4-3-3 tactical layout positions on pitch
const DEFAULT_433_GRID = [
  { pos: 'GK', x: 50, y: 88, nameEn: 'Starting Goalkeeper', nameAr: 'حارس المرمى الأساسي', num: 1 },
  { pos: 'DEF', x: 18, y: 72, nameEn: 'Left Back', nameAr: 'ظهير أيسر', num: 3 },
  { pos: 'DEF', x: 38, y: 74, nameEn: 'Center Back', nameAr: 'قلب دفاع أيسر', num: 4 },
  { pos: 'DEF', x: 62, y: 74, nameEn: 'Center Back', nameAr: 'قلب دفاع أيمن', num: 5 },
  { pos: 'DEF', x: 82, y: 72, nameEn: 'Right Back', nameAr: 'ظهير أيمن', num: 2 },
  { pos: 'MID', x: 50, y: 56, nameEn: 'Defensive Midfielder', nameAr: 'ارتكاز دفاعي', num: 6 },
  { pos: 'MID', x: 28, y: 46, nameEn: 'Central Midfielder', nameAr: 'لاعب وسط متقدم', num: 8 },
  { pos: 'MID', x: 72, y: 46, nameEn: 'Playmaker & Attacking Mid', nameAr: 'صانع الألعاب', num: 10 },
  { pos: 'FWD', x: 20, y: 24, nameEn: 'Left Wing Forward', nameAr: 'جناح هجومي أيسر', num: 11 },
  { pos: 'FWD', x: 50, y: 16, nameEn: 'Center Striker', nameAr: 'رأس حربة صريح', num: 9 },
  { pos: 'FWD', x: 80, y: 24, nameEn: 'Right Wing Forward', nameAr: 'جناح هجومي أيمن', num: 7 },
];

const isGenericLineup = (lineup?: Lineup): boolean => {
  if (!lineup || !Array.isArray(lineup.starting11) || lineup.starting11.length === 0) return true;
  const sample = lineup.starting11[0]?.name || '';
  const sampleAr = lineup.starting11[0]?.nameAr || '';
  if (sample.includes('#') || sampleAr.includes('#') || sample.toLowerCase().includes('player') || sampleAr.includes('لاعب')) {
    return true;
  }
  return false;
};

const generateFallbackLineup = (teamName: string, teamNameAr: string): Lineup => ({
  formation: '4-3-3',
  coach: teamName,
  coachAr: teamNameAr || teamName,
  starting11: DEFAULT_433_GRID.map((slot, idx) => ({
    id: `fb_p_${teamName}_${idx}`,
    number: slot.num,
    name: `${teamName} - ${slot.nameEn}`,
    nameAr: `${teamNameAr || teamName} - ${slot.nameAr}`,
    position: slot.pos as 'GK' | 'DEF' | 'MID' | 'FWD',
    rating: 7.2,
    gridPos: { x: slot.x, y: slot.y },
  })),
  substitutes: [],
});

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

  // Dynamic API-Football Lineup State
  const [fetchedHomeLineup, setFetchedHomeLineup] = useState<Lineup | undefined>(homeLineup);
  const [fetchedAwayLineup, setFetchedAwayLineup] = useState<Lineup | undefined>(awayLineup);

  // Auto-fetch official lineups from API-Football seamlessly on mount
  useEffect(() => {
    let isMounted = true;
    const fetchOfficialLineup = async () => {
      if (!matchId && !homeTeamName && !awayTeamName) return;
      try {
        const apiRes = await fetch('/api/football/match-live-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId,
            homeTeam: homeTeamName,
            awayTeam: awayTeamName,
            homeTeamAr: homeTeamNameAr,
            awayTeamAr: awayTeamNameAr,
          }),
        });
        const apiData = await apiRes.json();
        if (isMounted && apiData.success) {
          if (apiData.homeLineup?.starting11?.length && !isGenericLineup(apiData.homeLineup)) {
            setFetchedHomeLineup(apiData.homeLineup);
          }
          if (apiData.awayLineup?.starting11?.length && !isGenericLineup(apiData.awayLineup)) {
            setFetchedAwayLineup(apiData.awayLineup);
          }
        }
      } catch (err) {
        console.warn('Auto API-Football lineup query:', err);
      }
    };

    fetchOfficialLineup();
    return () => {
      isMounted = false;
    };
  }, [matchId, homeTeamName, awayTeamName, homeTeamNameAr, awayTeamNameAr]);

  const resolvedHomeRoster = getOfficialTeamRoster(homeTeamName) || getOfficialTeamRoster(homeTeamNameAr);
  const resolvedAwayRoster = getOfficialTeamRoster(awayTeamName) || getOfficialTeamRoster(awayTeamNameAr);

  const effectiveHomeLineup = 
    (!isGenericLineup(fetchedHomeLineup) ? fetchedHomeLineup : undefined) || 
    (!isGenericLineup(homeLineup) ? homeLineup : undefined) || 
    resolvedHomeRoster || 
    generateFallbackLineup(homeTeamName, homeTeamNameAr);

  const effectiveAwayLineup = 
    (!isGenericLineup(fetchedAwayLineup) ? fetchedAwayLineup : undefined) || 
    (!isGenericLineup(awayLineup) ? awayLineup : undefined) || 
    resolvedAwayRoster || 
    generateFallbackLineup(awayTeamName, awayTeamNameAr);

  const activeLineup = selectedTeam === 'HOME' ? effectiveHomeLineup : effectiveAwayLineup;
  const activeTeamName = selectedTeam === 'HOME' ? (isAr ? homeTeamNameAr || homeTeamName : homeTeamName) : (isAr ? awayTeamNameAr || awayTeamName : awayTeamName);
  const activeTeamColor = selectedTeam === 'HOME' ? homeColor : awayColor;
  const starting11 = activeLineup?.starting11 || [];
  const substitutes = activeLineup?.substitutes || [];

  return (
    <div className="space-y-4">
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
          const gridX = player.gridPos?.x ?? 50;
          const gridY = player.gridPos?.y ?? 50;
          return (
            <div
              key={player.id}
              onClick={() => setSelectedPlayer(player)}
              style={{
                left: `${gridX}%`,
                top: `${gridY}%`,
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

      {/* Selected Player Detail Card */}
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
    </div>
  );
};

