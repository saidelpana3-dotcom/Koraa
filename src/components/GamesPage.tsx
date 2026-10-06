import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Lock, Volume2, VolumeX, Film, Sparkles, Flame, ShieldAlert } from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { getVastAdForVideo, fetchLiveVastAds, pingAdImpression, OFFICIAL_VAST_FEED_URL } from '../services/vastAdsService';
import { OrangeDiamondIcon } from './OrangeDiamondIcon';

interface GamesPageProps {
  language: Language;
  theme?: ThemeMode;
  user: any;
  userPoints: number;
  userDiamonds: number;
  onAddDiamonds: (amount: number) => void;
  onSignInRequired: () => void;
  onClose?: () => void;
}

type TargetZoneId = 'TL' | 'TC' | 'TR' | 'BL' | 'BR';

interface TargetZone {
  id: TargetZoneId;
  labelAr: string;
  labelEn: string;
  xPercent: number;
  yPercent: number;
  keeperDiveX: number;
  keeperDiveY: number;
  keeperRotate: number;
}

const TARGET_ZONES: TargetZone[] = [
  {
    id: 'TL',
    labelAr: 'مقص يسار ↖',
    labelEn: 'Top Left ↖',
    xPercent: 16,
    yPercent: 24,
    keeperDiveX: -96,
    keeperDiveY: -28,
    keeperRotate: -38,
  },
  {
    id: 'TC',
    labelAr: 'تحت العارضة ↑',
    labelEn: 'Top Center ↑',
    xPercent: 50,
    yPercent: 20,
    keeperDiveX: 0,
    keeperDiveY: -36,
    keeperRotate: 0,
  },
  {
    id: 'TR',
    labelAr: 'مقص يمين ↗',
    labelEn: 'Top Right ↗',
    xPercent: 84,
    yPercent: 24,
    keeperDiveX: 96,
    keeperDiveY: -28,
    keeperRotate: 38,
  },
  {
    id: 'BL',
    labelAr: 'أرضية يسار ↙',
    labelEn: 'Bottom Left ↙',
    xPercent: 18,
    yPercent: 76,
    keeperDiveX: -92,
    keeperDiveY: 18,
    keeperRotate: -52,
  },
  {
    id: 'BR',
    labelAr: 'أرضية يمين ↘',
    labelEn: 'Bottom Right ↘',
    xPercent: 82,
    yPercent: 76,
    keeperDiveX: 92,
    keeperDiveY: 18,
    keeperRotate: 52,
  },
];

interface GameCharacterMode {
  id: 'samba_street' | 'tango_corners' | 'atlas_sniper';
  gameNameAr: string;
  gameNameEn: string;
  characterNameAr: string;
  characterNameEn: string;
  badgeAr: string;
  badgeEn: string;
  jerseyPrimary: string;
  jerseySecondary: string;
  shortsColor: string;
  skinTone: string;
  hairColor: string;
  hasGlasses: boolean;
  hasHeadband: boolean;
}

const GAME_CHARACTER_MODES: GameCharacterMode[] = [
  {
    id: 'samba_street',
    gameNameAr: 'تحدي شوارع السامبا (ركلات الترجيح)',
    gameNameEn: 'Street Samba Shootout',
    characterNameAr: 'الحارس ريكاردو 🇧🇷',
    characterNameEn: 'Keeper Ricardo 🇧🇷',
    badgeAr: 'اللعبة الرئيسية 🔥',
    badgeEn: 'Main Game 🔥',
    jerseyPrimary: '#facc15',
    jerseySecondary: '#15803d',
    shortsColor: '#1e3a8a',
    skinTone: '#e59866',
    hairColor: '#271206',
    hasGlasses: true,
    hasHeadband: false,
  },
  {
    id: 'tango_corners',
    gameNameAr: 'قناص المقصات المستحيلة',
    gameNameEn: 'Top Bins Sniper',
    characterNameAr: 'الحارس مارتينيز 🇦🇷',
    characterNameEn: 'Keeper Martinez 🇦🇷',
    badgeAr: 'صعوبة عالية ⚡',
    badgeEn: 'Hard Mode ⚡',
    jerseyPrimary: '#38bdf8',
    jerseySecondary: '#0284c7',
    shortsColor: '#0f172a',
    skinTone: '#f1c27d',
    hairColor: '#1e1b18',
    hasGlasses: false,
    hasHeadband: true,
  },
  {
    id: 'atlas_sniper',
    gameNameAr: 'أسد الشباك الذهبي',
    gameNameEn: 'Golden Net Lion',
    characterNameAr: 'الحارس ياسين 🇲🇦',
    characterNameEn: 'Keeper Yassine 🇲🇦',
    badgeAr: 'تحدي المحترفين 🏆',
    badgeEn: 'Pro Challenge 🏆',
    jerseyPrimary: '#dc2626',
    jerseySecondary: '#15803d',
    shortsColor: '#14532d',
    skinTone: '#e0ac69',
    hairColor: '#111827',
    hasGlasses: false,
    hasHeadband: false,
  },
];

const MAX_DAILY_ROUNDS = 30;
const KICKS_PER_ROUND = 5;
// Hard cap: Users can NEVER get 5/5 in a round (max allowed goals per round is 3)
const MAX_ALLOWED_GOALS_PER_ROUND = 3;

function playGameSound(type: 'whistle' | 'kick' | 'goal' | 'save', muted: boolean) {
  if (muted || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    if (type === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.14);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'goal') {
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.06);
        gain.gain.setValueAtTime(0.18, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.36);
      });
    } else if (type === 'save') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(95, now + 0.25);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === 'whistle') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2800, now);
      osc.frequency.setValueAtTime(2950, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (_) {}
}

// Detailed Character Head Avatar SVG ("مع وشكل راس")
const CharacterHeadAvatar: React.FC<{
  mode: GameCharacterMode;
  className?: string;
}> = ({ mode, className = 'w-11 h-11' }) => {
  return (
    <svg viewBox="0 0 80 80" className={`shrink-0 ${className}`}>
      <defs>
        <radialGradient id={`headGrad_${mode.id}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="37" fill={`url(#headGrad_${mode.id})`} stroke={mode.jerseyPrimary} strokeWidth="2.5" />
      {/* Shoulders preview */}
      <path d="M16,72 Q40,58 64,72" fill={mode.jerseyPrimary} stroke={mode.jerseySecondary} strokeWidth="3" />
      {/* Neck */}
      <rect x="33" y="50" width="14" height="12" rx="4" fill={mode.skinTone} />
      {/* Ears */}
      <circle cx="21" cy="40" r="4.5" fill={mode.skinTone} />
      <circle cx="59" cy="40" r="4.5" fill={mode.skinTone} />
      {/* Head / Face */}
      <rect x="23" y="21" width="34" height="34" rx="15" fill={mode.skinTone} stroke="#7c2d12" strokeWidth="1" />
      {/* Spiky / Sculpted Street Hair */}
      <path
        d="M21,33 Q19,14 32,15 L36,10 L42,14 L48,9 L52,15 Q62,15 59,33 Q52,22 40,23 Q28,22 21,33 Z"
        fill={mode.hairColor}
      />
      {/* Optional Headband */}
      {mode.hasHeadband && (
        <rect x="22" y="24" width="36" height="5" rx="2" fill={mode.jerseyPrimary} stroke="#ffffff" strokeWidth="1" />
      )}
      {/* Thick Expressive Eyebrows */}
      <path d="M28,32 Q33,29 37,32" stroke={mode.hairColor} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M43,32 Q47,29 52,32" stroke={mode.hairColor} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <circle cx="33" cy="36.5" r="2.3" fill="#0f172a" />
      <circle cx="47" cy="36.5" r="2.3" fill="#0f172a" />
      <circle cx="32.3" cy="35.8" r="0.8" fill="#ffffff" />
      <circle cx="46.3" cy="35.8" r="0.8" fill="#ffffff" />
      {/* Street Football Glasses (like the Brazil keeper in screenshot) */}
      {mode.hasGlasses && (
        <g>
          <rect x="26" y="33" width="13" height="8" rx="2.5" fill="#facc15" fillOpacity="0.28" stroke="#451a03" strokeWidth="1.6" />
          <rect x="41" y="33" width="13" height="8" rx="2.5" fill="#facc15" fillOpacity="0.28" stroke="#451a03" strokeWidth="1.6" />
          <line x1="39" y1="36.5" x2="41" y2="36.5" stroke="#451a03" strokeWidth="1.6" />
        </g>
      )}
      {/* Nose */}
      <path d="M40,37 L38.5,43 L41.5,43" stroke="#9a3412" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Confident Street Smirk */}
      <path d="M34,47.5 Q40,51 46,47" stroke="#7c2d12" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
};

export const GamesPage: React.FC<GamesPageProps> = ({
  language,
  theme = 'dark',
  user,
  userPoints,
  userDiamonds,
  onAddDiamonds,
  onSignInRequired,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  const [selectedCharacterMode, setSelectedCharacterMode] = useState<GameCharacterMode>(GAME_CHARACTER_MODES[0]);

  const getTodayKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const userKey = user?.uid || 'guest';
  const todayKey = getTodayKey();
  const roundsStorageKey = `kora_penalty_rounds_${userKey}_${todayKey}`;

  // Track completed rounds today (max 5 per account per day)
  const [roundsCompletedToday, setRoundsCompletedToday] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return Math.min(MAX_DAILY_ROUNDS, Number(localStorage.getItem(roundsStorageKey) || 0));
  });

  useEffect(() => {
    const saved = Math.min(MAX_DAILY_ROUNDS, Number(localStorage.getItem(roundsStorageKey) || 0));
    setRoundsCompletedToday(saved);
  }, [roundsStorageKey]);

  // Current Round State (5 kicks counter per round)
  const [hasStartedPlaying, setHasStartedPlaying] = useState<boolean>(false);
  const [kickResults, setKickResults] = useState<Array<'GOAL' | 'SAVED' | null>>([null, null, null, null, null]);
  const [currentKickIndex, setCurrentKickIndex] = useState<number>(0);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [selectedZone, setSelectedZone] = useState<TargetZone | null>(null);
  const [keeperZone, setKeeperZone] = useState<TargetZone | null>(null);
  const [lastShotOutcome, setLastShotOutcome] = useState<'GOAL' | 'SAVED' | null>(null);
  const [showFloatingDiamond, setShowFloatingDiamond] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [netRipple, setNetRipple] = useState<boolean>(false);

  // Round finished & Inter-round Ad Modal state
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);
  const [showInterRoundAd, setShowInterRoundAd] = useState<boolean>(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState<number>(10);
  const [adCanContinue, setAdCanContinue] = useState<boolean>(false);
  const adVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetchLiveVastAds().catch(() => {});
  }, []);

  // Pre-generate which kicks in this round are guaranteed saves so user NEVER scores 5/5
  // Out of 5 kicks, at least 2 kicks are pre-locked as guaranteed saves
  const [guaranteedSaveIndices, setGuaranteedSaveIndices] = useState<number[]>(() => {
    const indices = [0, 1, 2, 3, 4];
    const shuffled = [...indices].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  });

  // Inter-round Ad timer countdown
  useEffect(() => {
    if (!showInterRoundAd) return;
    setAdSecondsLeft(10);
    setAdCanContinue(false);
    const adItem = getVastAdForVideo(roundsCompletedToday + 1);
    if (adItem.impressionUrl) {
      pingAdImpression(adItem.impressionUrl);
    }

    const interval = setInterval(() => {
      setAdSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdCanContinue(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showInterRoundAd, roundsCompletedToday]);

  const isDailyLimitReached = roundsCompletedToday >= MAX_DAILY_ROUNDS;
  const goalsInCurrentRound = kickResults.filter((r) => r === 'GOAL').length;

  // Handle shooting at a target angle
  const handleShootZone = (zone: TargetZone) => {
    if (isShooting || isRoundFinished || isDailyLimitReached) return;

    // Require login so the 5 daily rounds per account and orange diamonds are tied to their account
    if (!user) {
      onSignInRequired();
      return;
    }

    setIsShooting(true);
    setSelectedZone(zone);
    setLastShotOutcome(null);
    playGameSound('kick', isMuted);

    // High difficulty rules ("نصعبها شويه ... مش عاوز المستخدمين يجبو الخمسه"):
    // 1. If user has already scored MAX_ALLOWED_GOALS_PER_ROUND (3 goals) -> 100% SAVE (Impossible to get 5/5 or 4/5!)
    // 2. If currentKickIndex is one of the pre-locked guaranteedSaveIndices -> 100% SAVE
    // 3. Otherwise, goalkeeper still has a 65% reflex save chance!
    const goalsSoFar = kickResults.filter((r) => r === 'GOAL').length;
    const isPreLockedSave = guaranteedSaveIndices.includes(currentKickIndex);
    const exceedsMaxGoals = goalsSoFar >= MAX_ALLOWED_GOALS_PER_ROUND;
    const randomReflexSave = Math.random() < 0.65;

    const willKeeperSave = exceedsMaxGoals || isPreLockedSave || randomReflexSave;

    let chosenKeeperZone: TargetZone;
    if (willKeeperSave) {
      chosenKeeperZone = zone;
    } else {
      const otherZones = TARGET_ZONES.filter((z) => z.id !== zone.id);
      chosenKeeperZone = otherZones[Math.floor(Math.random() * otherZones.length)];
    }

    setKeeperZone(chosenKeeperZone);

    setTimeout(() => {
      const outcome: 'GOAL' | 'SAVED' = willKeeperSave ? 'SAVED' : 'GOAL';
      setLastShotOutcome(outcome);

      if (outcome === 'GOAL') {
        playGameSound('goal', isMuted);
        setNetRipple(true);
        setShowFloatingDiamond(true);
        onAddDiamonds(1);
        setTimeout(() => setNetRipple(false), 700);
        setTimeout(() => setShowFloatingDiamond(false), 1400);
      } else {
        playGameSound('save', isMuted);
      }

      const updatedResults = [...kickResults];
      updatedResults[currentKickIndex] = outcome;
      setKickResults(updatedResults);

      setTimeout(() => {
        if (currentKickIndex + 1 >= KICKS_PER_ROUND) {
          const newCompleted = Math.min(MAX_DAILY_ROUNDS, roundsCompletedToday + 1);
          setRoundsCompletedToday(newCompleted);
          localStorage.setItem(roundsStorageKey, newCompleted.toString());
          setIsRoundFinished(true);
          setIsShooting(false);
          setSelectedZone(null);
          setKeeperZone(null);
        } else {
          setCurrentKickIndex((prev) => prev + 1);
          setIsShooting(false);
          setSelectedZone(null);
          setKeeperZone(null);
          setLastShotOutcome(null);
        }
      }, 1250);
    }, 520);
  };

  // Start next round after watching the mandatory inter-round Ad
  const handleStartNextRoundWithAd = () => {
    if (roundsCompletedToday >= MAX_DAILY_ROUNDS) return;
    setShowInterRoundAd(true);
  };

  const handleCompleteInterRoundAd = () => {
    const adItem = getVastAdForVideo(roundsCompletedToday + 1);
    if (adItem.completeTrackingUrl) {
      pingAdImpression(adItem.completeTrackingUrl);
    }
    setShowInterRoundAd(false);
    const indices = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
    setGuaranteedSaveIndices(indices.slice(0, 2));
    setKickResults([null, null, null, null, null]);
    setCurrentKickIndex(0);
    setIsRoundFinished(false);
    setHasStartedPlaying(true);
    setLastShotOutcome(null);
    setSelectedZone(null);
    setKeeperZone(null);
    playGameSound('whistle', isMuted);
  };

  const currentAd = getVastAdForVideo(roundsCompletedToday + 1);

  return (
    <div className="space-y-3.5 pb-12 select-none animate-fadeIn">
      {/* 1. MAIN CHARACTERS & GAMES NAMES HUB ("على صفحة الشخصيات الرئيسية أسماء الألعاب" + "مع وشكل راس") */}
      <div className={`p-3.5 rounded-3xl border shadow-lg transition-all ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/30 border-orange-500/40 text-white'
          : 'bg-white border-orange-200 text-slate-900 shadow-md'
      }`}>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-base">🎮</span>
            <h1 className="text-xs sm:text-sm font-black tracking-tight">
              {isAr ? 'الشخصيات الرئيسية وأسماء الألعاب (Games)' : 'Main Characters & Games Hub'}
            </h1>
          </div>
          <span className="text-[11px] font-bold text-orange-500 dark:text-orange-400 flex items-center gap-1">
            <OrangeDiamondIcon className="w-3.5 h-3.5" />
            <span>{isAr ? 'كل هدف = 1 ماسة برتقالي' : '1 Goal = 1 Orange Gem'}</span>
          </span>
        </div>

        {/* Character Head Cards & Game Titles Selector */}
        <div className="grid grid-cols-3 gap-2">
          {GAME_CHARACTER_MODES.map((mode) => {
            const isActive = selectedCharacterMode.id === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setSelectedCharacterMode(mode);
                  if (!user) {
                    onSignInRequired();
                    return;
                  }
                  if (!isDailyLimitReached && !isRoundFinished) {
                    setHasStartedPlaying(true);
                    playGameSound('whistle', isMuted);
                  }
                }}
                className={`p-2 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 flex flex-col items-center gap-1.5 ${
                  isActive
                    ? isDark
                      ? 'bg-orange-500/20 border-orange-400 shadow-md shadow-orange-950/50 ring-1 ring-orange-400/50'
                      : 'bg-orange-50 border-orange-500 shadow-sm ring-1 ring-orange-400'
                    : isDark
                      ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-85 hover:opacity-100'
                }`}
              >
                <CharacterHeadAvatar mode={mode} className="w-11 h-11 sm:w-12 sm:h-12" />
                <div className="min-w-0 w-full">
                  <div className={`text-[10px] sm:text-[11px] font-black truncate ${
                    isActive ? 'text-orange-500 dark:text-orange-300' : isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {isAr ? mode.gameNameAr : mode.gameNameEn}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 truncate mt-0.5">
                    {isAr ? mode.characterNameAr : mode.characterNameEn}
                  </div>
                </div>
                <span className={`mt-0.5 px-2.5 py-0.5 rounded-lg text-[9px] font-black transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-800 text-orange-300 border border-orange-500/30'
                }`}>
                  {isAr ? 'ابدأ اللعب ⚽' : 'Start Playing ⚽'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Prominent "ابدأ اللعب" Main Action Bar + 50 Diamonds Match Prediction Fee Info */}
        <div className="mt-2.5 pt-2.5 border-t border-orange-500/20 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-[10px] sm:text-[11px] font-black text-slate-400 flex items-center gap-1.5">
            <OrangeDiamondIcon className="w-3.5 h-3.5" />
            <span>
              {isAr
                ? `متاح ${MAX_DAILY_ROUNDS} مرة يومياً • توقع أي مباراة بـ 50 ماسة`
                : `${MAX_DAILY_ROUNDS} plays/day • Predict any match for 50 Gems`}
            </span>
          </div>
          {!hasStartedPlaying && !isRoundFinished && !isDailyLimitReached && (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  onSignInRequired();
                  return;
                }
                setHasStartedPlaying(true);
                playGameSound('whistle', isMuted);
              }}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <span>⚽</span>
              <span>{isAr ? 'ابدأ اللعب' : 'Start Playing'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SCOREBOARD HEADER WITH STACKED COINS & ORANGE DIAMONDS COUNTER + 5-SHOTS COUNTER */}
      <div className="p-3.5 rounded-3xl border border-orange-500/40 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <CharacterHeadAvatar mode={selectedCharacterMode} className="w-11 h-11" />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                {isAr ? selectedCharacterMode.gameNameAr : selectedCharacterMode.gameNameEn}
              </h2>
              <p className="text-[11px] font-bold text-orange-300 truncate flex items-center gap-1">
                <span>{isAr ? 'اضغط الزاوية للتسديد • الجون بـ 1 ماسة برتقالي' : 'Tap corner to shoot • 1 Goal = 1 Orange Gem'}</span>
                <OrangeDiamondIcon className="w-3.5 h-3.5" />
              </p>
            </div>
          </div>

          {/* Stacked Coins & Orange Diamonds Counter ("تحت عداد الكوينز عداد للماسات البرتقالية") */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-stretch gap-1">
              {/* Coins Counter */}
              <div className="flex items-center justify-between gap-1.5 px-2.5 py-0.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black tabular-nums">
                <span>🪙</span>
                <span className="font-mono">{user ? userPoints : 0}</span>
                <span className="text-[9px] text-amber-200">{isAr ? 'كوينز' : 'Coins'}</span>
              </div>
              {/* Orange Diamonds Counter Directly Under Coins */}
              <div className="flex items-center justify-between gap-1.5 px-2.5 py-0.5 rounded-xl bg-orange-500/25 border border-orange-400/70 text-orange-200 text-xs font-black shadow-sm shadow-orange-950 tabular-nums">
                <OrangeDiamondIcon className="w-3.5 h-3.5" />
                <span className="font-mono text-orange-300">{user ? userDiamonds : 0}</span>
                <span className="text-[9px] text-orange-200">{isAr ? 'ماسة' : 'Gems'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer active:scale-95"
              title={isMuted ? (isAr ? 'تشغيل الصوت' : 'Unmute') : (isAr ? 'كتم الصوت' : 'Mute')}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
            </button>
          </div>
        </div>

        {/* Round & 5-Kicks Counter Bar ("كل جولة مكونة من 5 عداد") */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/90 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-slate-300">
              {isAr ? 'الجولة اليومية:' : 'Daily Round:'}
            </span>
            <span className="font-mono text-xs font-black text-orange-400 tabular-nums">
              {Math.min(MAX_DAILY_ROUNDS, isRoundFinished ? roundsCompletedToday : roundsCompletedToday + 1)} / {MAX_DAILY_ROUNDS}
            </span>
          </div>

          {/* 5 Shots Counter Indicators */}
          <div className="flex items-center gap-1.5" dir="ltr">
            {kickResults.map((res, idx) => {
              const isCurrent = idx === currentKickIndex && !isRoundFinished && !isDailyLimitReached;
              return (
                <div
                  key={idx}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all tabular-nums ${
                    res === 'GOAL'
                      ? 'bg-orange-500 border-orange-200 text-slate-950 shadow-md shadow-orange-500/40 scale-105'
                      : res === 'SAVED'
                        ? 'bg-rose-600 border-rose-300 text-white shadow-md shadow-rose-600/30'
                        : isCurrent
                          ? 'bg-amber-400/25 border-orange-400 text-orange-300 animate-pulse scale-110'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                  title={
                    res === 'GOAL'
                      ? (isAr ? 'هدف (+1 ماسة برتقالي)' : 'Goal (+1 Orange Gem)')
                      : res === 'SAVED'
                        ? (isAr ? 'تصدى لها الحارس 🧤' : 'Saved by Keeper')
                        : `${idx + 1}`
                  }
                >
                  {res === 'GOAL' ? '⚽' : res === 'SAVED' ? '✖' : idx + 1}
                </div>
              );
            })}
          </div>

          <div className="text-[11px] font-black text-orange-300 flex items-center gap-1 tabular-nums">
            <span>{isAr ? 'ماسات الجولة:' : 'Round Gems:'}</span>
            <span className="font-mono text-sm text-white">+{goalsInCurrentRound}</span>
            <OrangeDiamondIcon className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. MAIN STREET FOOTBALL PENALTY SHOOTOUT ARENA (100% FAITHFUL TO UPLOADED IMAGE) */}
      <div className="relative w-full h-[550px] sm:h-[590px] rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl select-none">
        
        {/* A. SKY BACKGROUND & SOFT CLOUDS */}
        <div className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-[#0b2b68] via-[#1c5ec9] to-[#69a9ff]">
          <div className="absolute bottom-14 left-6 w-36 h-12 bg-white/35 rounded-full blur-md" />
          <div className="absolute bottom-16 right-10 w-44 h-14 bg-white/30 rounded-full blur-md" />
          <div className="absolute bottom-20 left-1/3 w-48 h-16 bg-white/25 rounded-full blur-lg" />
        </div>

        {/* B. HANGING INTERNATIONAL FLAGS BUNTING (Just like the uploaded screenshot) */}
        <svg
          viewBox="0 0 400 130"
          className="absolute top-0 inset-x-0 w-full h-36 pointer-events-none z-10 drop-shadow-md"
          preserveAspectRatio="none"
        >
          {/* Upper String of Flags */}
          <path d="M -10,42 Q 180,62 350,5" fill="none" stroke="#1e293b" strokeWidth="1.5" opacity="0.7" />
          <g transform="translate(22, 44) rotate(4)">
            <rect width="18" height="13" fill="#16a34a" />
            <rect x="6" width="6" height="13" fill="#ffffff" />
            <rect x="12" width="6" height="13" fill="#ea580c" />
          </g>
          <g transform="translate(55, 48) rotate(3)">
            <rect width="16" height="14" fill="#1d4ed8" />
            <path d="M0,0 L16,14 M16,0 L0,14 M8,0 L8,14 M0,7 L16,7" stroke="#ffffff" strokeWidth="2.5" />
            <path d="M8,0 L8,14 M0,7 L16,7" stroke="#dc2626" strokeWidth="1.5" />
          </g>
          <g transform="translate(88, 50) rotate(1)">
            <rect width="16" height="13" fill="#dc2626" />
            <rect y="4" width="16" height="4.5" fill="#ffffff" />
            <rect y="8.5" width="16" height="4.5" fill="#1d4ed8" />
          </g>
          <g transform="translate(120, 50) rotate(-2)">
            <rect width="16" height="7" fill="#2563eb" />
            <rect y="7" width="16" height="7" fill="#facc15" />
          </g>
          <g transform="translate(154, 48) rotate(-5)">
            <rect width="5.5" height="14" fill="#1d4ed8" />
            <rect x="5.5" width="5.5" height="14" fill="#ffffff" />
            <rect x="11" width="5.5" height="14" fill="#dc2626" />
          </g>
          <g transform="translate(188, 44) rotate(-8)">
            <rect width="16" height="14" fill="#2563eb" />
            <path d="M0,3.5 L16,3.5 M0,7.5 L16,7.5 M0,11.5 L16,11.5" stroke="#ffffff" strokeWidth="1.6" />
          </g>
          {/* Sweden Flag at top right */}
          <g transform="translate(310, 4) rotate(-22)">
            <rect width="34" height="22" fill="#1d4ed8" />
            <rect x="10" width="5" height="22" fill="#facc15" />
            <rect y="8.5" width="34" height="5" fill="#facc15" />
          </g>

          {/* Lower Prominent String of Flags (Finland, Switzerland, UK, Ireland) */}
          <path d="M -10,76 Q 150,94 340,22" fill="none" stroke="#0f172a" strokeWidth="1.8" opacity="0.85" />
          {/* Finland Flag */}
          <g transform="translate(58, 79) rotate(4)">
            <rect width="34" height="25" rx="1.5" fill="#ffffff" />
            <rect x="10" width="6" height="25" fill="#1e3a8a" />
            <rect y="9.5" width="34" height="6" fill="#1e3a8a" />
          </g>
          {/* Switzerland Red Flag */}
          <g transform="translate(128, 76) rotate(-8)">
            <rect width="34" height="26" rx="1.5" fill="#dc2626" />
            <rect x="14" y="5" width="6" height="16" fill="#ffffff" />
            <rect x="9" y="10" width="16" height="6" fill="#ffffff" />
          </g>
          {/* Great Britain Union Jack Flag */}
          <g transform="translate(202, 58) rotate(-24)">
            <rect width="40" height="28" rx="1.5" fill="#1e3a8a" />
            <path d="M0,0 L40,28 M40,0 L0,28" stroke="#ffffff" strokeWidth="5" />
            <path d="M0,0 L40,28 M40,0 L0,28" stroke="#dc2626" strokeWidth="2.2" />
            <path d="M20,0 L20,28 M0,14 L40,14" stroke="#ffffff" strokeWidth="7" />
            <path d="M20,0 L20,28 M0,14 L40,14" stroke="#dc2626" strokeWidth="4" />
          </g>
          {/* Ireland Large Flag */}
          <g transform="translate(274, 26) rotate(-32)">
            <rect width="42" height="28" rx="1.5" fill="#15803d" />
            <rect x="14" width="14" height="28" fill="#ffffff" />
            <rect x="28" width="14" height="28" fill="#ea580c" />
          </g>
        </svg>

        {/* C. DISTANT MOUNTAINS, FAVELA BUILDINGS, PALM TREES & GRAFFITI WALL */}
        <div className="absolute inset-x-0 top-[30%] h-[28%] pointer-events-none flex items-end justify-between overflow-hidden">
          <div
            className="absolute inset-x-0 bottom-8 h-28 bg-gradient-to-t from-[#2b579a]/80 to-[#3b6db5]/50"
            style={{ clipPath: 'polygon(0% 100%, 0% 45%, 22% 20%, 45% 52%, 72% 15%, 100% 40%, 100% 100%)' }}
          />

          {/* Left Colorful Street Building */}
          <div className="relative z-10 w-16 sm:w-20 h-36 bg-gradient-to-b from-[#d97757] to-[#b4533c] border-r-2 border-amber-950/40 flex flex-col justify-around p-2">
            <div className="w-6 h-8 bg-amber-950/70 rounded-t-md border border-amber-200/40 mx-auto" />
            <div className="w-6 h-8 bg-amber-950/70 rounded-t-md border border-amber-200/40 mx-auto" />
          </div>

          {/* Tropical Palm Tree Behind Left Goalpost */}
          <svg viewBox="0 0 120 140" className="w-28 h-32 -ml-8 mb-4 z-10 opacity-95">
            <path d="M58,140 Q62,90 55,48" stroke="#78350f" strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d="M55,48 Q20,35 5,58 Q30,48 55,52" fill="#15803d" />
            <path d="M55,48 Q18,20 10,32 Q35,32 55,48" fill="#16a34a" />
            <path d="M55,48 Q55,10 38,8 Q48,26 55,48" fill="#22c55e" />
            <path d="M55,48 Q90,18 105,34 Q80,32 55,48" fill="#16a34a" />
            <path d="M55,48 Q95,38 112,60 Q82,48 55,52" fill="#15803d" />
          </svg>

          {/* Right Colorful Street Building & Striped Awning */}
          <div className="relative z-10 w-16 sm:w-24 h-40 bg-gradient-to-b from-[#e07a5f] to-[#bc4749] border-l-2 border-amber-950/40 flex flex-col justify-between p-2">
            <div className="w-7 h-9 bg-slate-900/75 rounded-t-md border border-amber-100/40 mx-auto mt-2" />
            <div className="w-full h-4 bg-gradient-to-r from-red-600 via-white to-red-600 rounded-xs shadow-sm" />
            <div className="w-7 h-9 bg-slate-900/75 rounded-t-md border border-amber-100/40 mx-auto mb-4" />
          </div>
        </div>

        {/* Vibrant Graffiti Street Wall Directly Behind the Goal */}
        <div className="absolute inset-x-0 top-[47%] h-[11%] bg-gradient-to-r from-[#eab308] via-[#38bdf8] to-[#eab308] border-y-2 border-slate-900/60 overflow-hidden z-10">
          <div className="w-full h-full flex items-center justify-around opacity-85">
            <div className="w-20 h-12 bg-amber-400 rounded-full -rotate-12 border-2 border-slate-900" />
            <div className="w-28 h-14 bg-cyan-400/90 rotate-6 border-2 border-slate-900" />
            <div className="w-24 h-12 bg-purple-600/80 -rotate-6 rounded-lg border-2 border-slate-900" />
            <div className="w-28 h-14 bg-lime-400/90 rotate-12 border-2 border-slate-900" />
          </div>
        </div>

        {/* D. TERRACOTTA / RED STREET FOOTBALL COURT (Bottom 44% of Arena) */}
        <div className="absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-b from-[#d64531] via-[#b83222] to-[#4c0b09] z-10 overflow-hidden">
          <svg viewBox="0 0 400 220" className="w-full h-full pointer-events-none" preserveAspectRatio="none">
            {/* Goal Line */}
            <line x1="0" y1="8" x2="400" y2="8" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" />
            {/* Penalty Box Arc */}
            <path d="M 85,8 Q 200,38 315,8" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5" />
            {/* Wide Mid-Court Arc */}
            <path d="M -20,62 Q 200,35 420,62" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="3.5" />
            {/* Center Vertical Perspective Stripe */}
            <polygon points="196,48 204,48 214,132 186,132" fill="rgba(255,255,255,0.82)" />
            {/* Foreground Horizontal Baseline */}
            <line x1="0" y1="132" x2="400" y2="132" stroke="rgba(255,255,255,0.8)" strokeWidth="6" />
          </svg>
        </div>

        {/* E. 3D WHITE GOALPOST, NET MESH, GOALKEEPER WITH EXPRESSIVE HEAD & CLICKABLE TARGET ZONES */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[25%] w-[86%] sm:w-[82%] h-[33%] z-20">
          <div className="relative w-full h-full border-t-[9px] border-x-[9px] border-white rounded-t-sm shadow-[0_6px_25px_rgba(0,0,0,0.55)] bg-black/15 overflow-hidden">
            
            {/* Inner 3D Depth Goal Frame & Net Mesh */}
            <div
              className={`absolute inset-2 border-t-2 border-x-2 border-white/60 transition-transform duration-300 ${
                netRipple ? 'scale-[1.03]' : 'scale-100'
              }`}
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.28) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.28) 1px, transparent 1px)
                `,
                backgroundSize: '12px 12px',
              }}
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="14" y2="14" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
              <line x1="100%" y1="0" x2="calc(100% - 14px)" y2="14" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
            </svg>

            {/* ANIMATED GOALKEEPER WITH DETAILED EXPRESSIVE HEAD ("مع وشكل راس") */}
            <motion.div
              animate={{
                x: keeperZone ? keeperZone.keeperDiveX : 0,
                y: keeperZone ? keeperZone.keeperDiveY : 0,
                rotate: keeperZone ? keeperZone.keeperRotate : 0,
                scale: keeperZone ? 1.06 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 18,
              }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 sm:w-36 h-40 pointer-events-none z-20 flex items-end justify-center"
            >
              <svg viewBox="0 0 150 175" className="w-full h-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.65)]">
                {/* Ground Shadow */}
                <ellipse cx="75" cy="168" rx="30" ry="5.5" fill="rgba(0,0,0,0.48)" />
                {/* Athletic Bent Legs */}
                <path d="M56,120 L48,142 L50,156" stroke={selectedCharacterMode.skinTone} strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M94,120 L102,142 L100,156" stroke={selectedCharacterMode.skinTone} strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                {/* White Athletic Socks */}
                <path d="M49,145 L50,158" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
                <path d="M101,145 L100,158" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
                {/* Street Football Sneakers */}
                <rect x="39" y="156" width="17" height="8.5" rx="4" fill="#1e3a8a" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="94" y="156" width="17" height="8.5" rx="4" fill="#1e3a8a" stroke="#ffffff" strokeWidth="1.5" />
                {/* Shorts */}
                <path d="M50,104 L100,104 L105,125 L81,125 L75,114 L69,125 L45,125 Z" fill={selectedCharacterMode.shortsColor} stroke={selectedCharacterMode.jerseyPrimary} strokeWidth="1.5" />
                {/* Jersey Torso */}
                <path d="M47,58 L103,58 L98,106 L52,106 Z" fill={selectedCharacterMode.jerseyPrimary} />
                {/* Shoulders & Sleeves */}
                <path d="M47,58 L22,82 L30,90 L52,72 Z" fill={selectedCharacterMode.jerseySecondary} />
                <path d="M103,58 L128,82 L120,90 L98,72 Z" fill={selectedCharacterMode.jerseySecondary} />
                {/* Dark Forearm Guards */}
                <path d="M26,85 L13,100" stroke="#1e293b" strokeWidth="8.5" strokeLinecap="round" />
                <path d="M124,85 L137,100" stroke="#1e293b" strokeWidth="8.5" strokeLinecap="round" />
                {/* Spread Goalkeeper Hands with Detailed Fingers */}
                <g>
                  <circle cx="11" cy="103" r="6.5" fill={selectedCharacterMode.skinTone} stroke={selectedCharacterMode.jerseyPrimary} strokeWidth="1.2" />
                  <path d="M6,99 L2,96 M5,103 L1,102 M6,107 L2,108 M10,109 L8,113" stroke={selectedCharacterMode.skinTone} strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="139" cy="103" r="6.5" fill={selectedCharacterMode.skinTone} stroke={selectedCharacterMode.jerseyPrimary} strokeWidth="1.2" />
                  <path d="M144,99 L148,96 M145,103 L149,102 M144,107 L148,108 M140,109 L142,113" stroke={selectedCharacterMode.skinTone} strokeWidth="2.2" strokeLinecap="round" />
                </g>
                {/* Brazil / Crest Emblem on Chest */}
                <circle cx="75" cy="81" r="12" fill="#1e3a8a" stroke={selectedCharacterMode.jerseySecondary} strokeWidth="2.5" />
                <path d="M63,81 Q75,76 87,83" stroke="#ffffff" strokeWidth="2.6" fill="none" />

                {/* DETAILED PROMINENT CHARACTER HEAD ("مع وشكل راس") */}
                {/* Neck */}
                <rect x="68" y="46" width="14" height="14" rx="4" fill={selectedCharacterMode.skinTone} />
                {/* Ears */}
                <circle cx="54" cy="32" r="4.5" fill={selectedCharacterMode.skinTone} />
                <circle cx="96" cy="32" r="4.5" fill={selectedCharacterMode.skinTone} />
                {/* Sculpted Head & Jawline */}
                <rect x="56" y="12" width="38" height="38" rx="16" fill={selectedCharacterMode.skinTone} stroke="#7c2d12" strokeWidth="1.2" />
                {/* Spiky Street Hair */}
                <path
                  d="M54,26 Q52,5 66,7 L71,1 L76,6 L83,1 L87,8 Q98,8 96,26 Q88,14 75,15 Q62,14 54,26 Z"
                  fill={selectedCharacterMode.hairColor}
                />
                {selectedCharacterMode.hasHeadband && (
                  <rect x="55" y="16" width="40" height="5" rx="2" fill={selectedCharacterMode.jerseyPrimary} stroke="#ffffff" strokeWidth="1" />
                )}
                {/* Expressive Eyebrows */}
                <path d="M62,24 Q67,21 72,24" stroke={selectedCharacterMode.hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M78,24 Q83,21 88,24" stroke={selectedCharacterMode.hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Eyes */}
                <circle cx="67" cy="29" r="2.4" fill="#0f172a" />
                <circle cx="83" cy="29" r="2.4" fill="#0f172a" />
                <circle cx="66.3" cy="28.3" r="0.9" fill="#ffffff" />
                <circle cx="82.3" cy="28.3" r="0.9" fill="#ffffff" />
                {/* Street Sports Glasses */}
                {selectedCharacterMode.hasGlasses && (
                  <g>
                    <rect x="60" y="25" width="14" height="8" rx="2.5" fill="#facc15" fillOpacity="0.28" stroke="#451a03" strokeWidth="1.6" />
                    <rect x="76" y="25" width="14" height="8" rx="2.5" fill="#facc15" fillOpacity="0.28" stroke="#451a03" strokeWidth="1.6" />
                    <line x1="74" y1="29" x2="76" y2="29" stroke="#451a03" strokeWidth="1.6" />
                  </g>
                )}
                {/* Nose */}
                <path d="M75,30 L73.5,36 L76.5,36" stroke="#9a3412" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                {/* Dynamic Mouth Expression (Grin on Save, O-face on Goal, Confident Smirk idle) */}
                {lastShotOutcome === 'GOAL' ? (
                  <ellipse cx="75" cy="42" rx="4" ry="3.2" fill="#7c2d12" />
                ) : lastShotOutcome === 'SAVED' ? (
                  <path d="M68,40 Q75,46 82,40 Z" fill="#ffffff" stroke="#7c2d12" strokeWidth="1.5" />
                ) : (
                  <path d="M69,41 Q75,44.5 81,40.5" stroke="#7c2d12" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                )}
              </svg>
            </motion.div>

            {/* INTERACTIVE TARGET ZONES (CLICK THE ANGLE TO SHOOT) */}
            {hasStartedPlaying && !isRoundFinished && !isDailyLimitReached && TARGET_ZONES.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  disabled={isShooting}
                  onClick={() => handleShootZone(zone)}
                  style={{
                    left: `${zone.xPercent}%`,
                    top: `${zone.yPercent}%`,
                  }}
                  aria-label={isAr ? zone.labelAr : zone.labelEn}
                  title={isAr ? `سدد في ${zone.labelAr}` : `Shoot ${zone.labelEn}`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 group cursor-pointer focus:outline-none transition-transform ${
                    isShooting ? 'pointer-events-none opacity-40' : 'hover:scale-115 active:scale-90'
                  }`}
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                    isSelected
                      ? 'bg-orange-500/60 border-orange-200 scale-110 shadow-[0_0_20px_rgba(249,115,22,0.95)]'
                      : 'bg-orange-500/25 hover:bg-orange-500/45 border-white/85 hover:border-orange-300 shadow-[0_0_15px_rgba(0,0,0,0.6)] animate-pulse'
                  }`}>
                    <div className="w-6 h-6 rounded-full border-2 border-dashed border-orange-200 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-orange-400 group-hover:bg-white" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* F. FLOATING OUTCOME BANNER (GOAL +1 ORANGE DIAMOND OR SAVED!) */}
        <AnimatePresence>
          {lastShotOutcome && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="absolute top-[14%] left-1/2 -translate-x-1/2 z-40 pointer-events-none"
            >
              {lastShotOutcome === 'GOAL' ? (
                <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 border-2 border-white text-slate-950 font-black text-base sm:text-lg shadow-[0_10px_30px_rgba(249,115,22,0.8)] flex items-center gap-2">
                  <span>⚽ جـوووول رائع!</span>
                  <span className="px-2.5 py-0.5 rounded-xl bg-slate-950 text-orange-300 font-mono text-sm flex items-center gap-1">
                    <span>+1</span>
                    <OrangeDiamondIcon className="w-4 h-4" />
                  </span>
                </div>
              ) : (
                <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 border-2 border-rose-200 text-white font-black text-base sm:text-lg shadow-[0_10px_30px_rgba(225,29,72,0.7)] flex items-center gap-2">
                  <span>🧤 تصدى لها {isAr ? selectedCharacterMode.characterNameAr : selectedCharacterMode.characterNameEn}!</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating +1 Orange Diamond Animation */}
        <AnimatePresence>
          {showFloatingDiamond && (
            <motion.div
              initial={{ opacity: 1, y: 210, scale: 0.8 }}
              animate={{ opacity: 0, y: 40, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute left-1/2 -translate-x-1/2 z-40 pointer-events-none font-black text-2xl text-orange-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] flex items-center gap-1.5"
            >
              <span>+1 ماسة برتقالي</span>
              <OrangeDiamondIcon className="w-7 h-7" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* G. ANIMATED 3D SOCCER BALL (Sits on Red Court & Flies to Chosen Corner on Click) */}
        <motion.div
          animate={
            selectedZone
              ? {
                  x: (selectedZone.xPercent - 50) * 2.55,
                  y: -175 + (selectedZone.yPercent - 50) * 1.15,
                  scale: 0.46,
                  rotate: selectedZone.xPercent < 50 ? -540 : 540,
                }
              : {
                  x: 0,
                  y: 0,
                  scale: 1,
                  rotate: 0,
                }
          }
          transition={{
            duration: selectedZone ? 0.5 : 0.25,
            ease: selectedZone ? [0.16, 1, 0.3, 1] : 'easeOut',
          }}
          className="absolute bottom-[20%] left-1/2 -translate-x-1/2 z-30 w-20 h-20 sm:w-22 sm:h-22 pointer-events-none"
        >
          {!selectedZone && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/50 rounded-full blur-xs" />
          )}
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_16px_rgba(0,0,0,0.65)]">
            <defs>
              <radialGradient id="ballGrad" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="70%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#ballGrad)" stroke="#1e293b" strokeWidth="2" />
            <polygon points="50,32 67,44 60,64 40,64 33,44" fill="#0f172a" />
            <polygon points="38,7 62,7 58,18 42,18" fill="#0f172a" />
            <polygon points="10,28 24,16 28,28 16,40" fill="#0f172a" />
            <polygon points="90,28 76,16 72,28 84,40" fill="#0f172a" />
            <polygon points="14,72 28,66 35,80 22,88" fill="#0f172a" />
            <polygon points="86,72 72,66 65,80 78,88" fill="#0f172a" />
            <line x1="50" y1="32" x2="50" y2="18" stroke="#334155" strokeWidth="2" />
            <line x1="67" y1="44" x2="84" y2="40" stroke="#334155" strokeWidth="2" />
            <line x1="33" y1="44" x2="16" y2="40" stroke="#334155" strokeWidth="2" />
            <line x1="60" y1="64" x2="65" y2="80" stroke="#334155" strokeWidth="2" />
            <line x1="40" y1="64" x2="35" y2="80" stroke="#334155" strokeWidth="2" />
          </svg>
        </motion.div>

        {/* Bottom Prompt Banner or "ابدأ اللعب" (Start Playing) Button Inside Arena */}
        {!isRoundFinished && !isDailyLimitReached && (
          !hasStartedPlaying ? (
            <div className="absolute inset-x-0 bottom-6 z-40 flex flex-col items-center justify-center gap-2.5 px-4">
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    onSignInRequired();
                    return;
                  }
                  setHasStartedPlaying(true);
                  playGameSound('whistle', isMuted);
                }}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-base sm:text-lg shadow-[0_10px_30px_rgba(249,115,22,0.8)] border-2 border-white flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 transition-all animate-bounce"
              >
                <span>⚽</span>
                <span>{isAr ? 'ابدأ اللعب' : 'Start Playing'}</span>
                <OrangeDiamondIcon className="w-5 h-5" />
              </button>
              <div className="px-3.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-orange-500/40 text-orange-200 text-[11px] font-black shadow-md">
                {isAr
                  ? `متاح لك ${MAX_DAILY_ROUNDS} مرة يومياً • اجمع 50 ماسة برتقالية لتوقع أي مباراة!`
                  : `${MAX_DAILY_ROUNDS} plays per day • Collect 50 Orange Diamonds to predict any match!`}
              </div>
            </div>
          ) : (
            <div className="absolute bottom-4 inset-x-4 z-30 flex items-center justify-center pointer-events-none">
              <div className="px-4 py-2 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-orange-400/50 text-white text-xs font-black flex items-center gap-2 shadow-lg">
                <OrangeDiamondIcon className="w-4 h-4" />
                <span>
                  {isAr
                    ? `العداد (${currentKickIndex + 1} من 5): اضغط على الزاوية في الشبكة للتسديد بـ 1 ماسة برتقالي!`
                    : `Shot (${currentKickIndex + 1} of 5): Tap any target corner in the net to shoot for 1 Orange Gem!`}
                </span>
              </div>
            </div>
          )
        )}

        {/* H. ROUND SUMMARY OVERLAY OR DAILY 5-ROUNDS LIMIT OVERLAY */}
        {(isRoundFinished || isDailyLimitReached) && (
          <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-slate-900 border-2 border-orange-500/60 rounded-3xl p-5 text-center space-y-4 shadow-2xl">
              {isDailyLimitReached && !isRoundFinished ? (
                <>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    {isAr ? `اكتملت مرات اللعب الـ ${MAX_DAILY_ROUNDS} اليوم! 🔒` : `All ${MAX_DAILY_ROUNDS} Daily Plays Completed! 🔒`}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isAr
                      ? `لقد لعبت الحد الأقصى المتاح لكل حساب اليوم (${MAX_DAILY_ROUNDS} مرة يومياً). يتجدد العداد تلقائياً غداً لربح المزيد من الماسات البرتقالية!`
                      : `You have reached the maximum of ${MAX_DAILY_ROUNDS} daily plays per account. Come back tomorrow to earn more Orange Diamonds!`}
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-orange-500/40 flex items-center justify-center gap-2 text-sm font-black text-orange-300">
                    <OrangeDiamondIcon className="w-5 h-5" />
                    <span>{isAr ? `إجمالي رصيدك: ${userDiamonds} ماسة برتقالي` : `Your Total Orange Gems: ${userDiamonds}`}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-300 flex items-center justify-center text-3xl shadow-inner">
                    🏆
                  </div>
                  <h3 className="text-lg font-black text-white">
                    {isAr
                      ? `انتهت الجولة (${roundsCompletedToday} من ${MAX_DAILY_ROUNDS})!`
                      : `Round (${roundsCompletedToday} of ${MAX_DAILY_ROUNDS}) Complete!`}
                  </h3>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-400">
                      {isAr ? 'نتيجة الـ 5 ضربات في هذه الجولة:' : 'Your 5 Shots Result:'}
                    </div>
                    <div className="flex items-center justify-center gap-2" dir="ltr">
                      {kickResults.map((r, i) => (
                        <span
                          key={i}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border ${
                            r === 'GOAL'
                              ? 'bg-orange-500 border-orange-200 text-slate-950'
                              : 'bg-rose-600 border-rose-400 text-white'
                          }`}
                        >
                          {r === 'GOAL' ? '⚽' : '✖'}
                        </span>
                      ))}
                    </div>
                    <div className="pt-1 text-sm font-black text-orange-300 flex items-center justify-center gap-1.5">
                      <span>
                        {isAr
                          ? `سجلت ${goalsInCurrentRound} أهداف وربحت +${goalsInCurrentRound} ماسة برتقالي`
                          : `Scored ${goalsInCurrentRound} goals & earned +${goalsInCurrentRound} Orange Gems`}
                      </span>
                      <OrangeDiamondIcon className="w-4 h-4" />
                    </div>
                  </div>

                  {roundsCompletedToday < MAX_DAILY_ROUNDS ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-amber-300">
                        {isAr
                          ? `متبقي لك (${MAX_DAILY_ROUNDS - roundsCompletedToday}) جولات اليوم — شاهد إعلان الفاصل لبدء الجولة التالية`
                          : `${MAX_DAILY_ROUNDS - roundsCompletedToday} rounds left today — Watch the inter-round ad to start the next round`}
                      </p>
                      <button
                        type="button"
                        onClick={handleStartNextRoundWithAd}
                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                      >
                        <Film className="w-4 h-4" />
                        <span>
                          {isAr
                            ? `شاهد الإعلان وابدأ اللعب (${roundsCompletedToday + 1} من ${MAX_DAILY_ROUNDS}) 🎬`
                            : `Watch Ad & Start Playing (${roundsCompletedToday + 1}/${MAX_DAILY_ROUNDS}) 🎬`}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-black">
                      {isAr
                        ? `🎉 أتممت جميع المرات الـ ${MAX_DAILY_ROUNDS} المتاحة لحسابك اليوم! ننتظرك غداً في ${MAX_DAILY_ROUNDS} جولة جديدة.`
                        : `🎉 You completed all ${MAX_DAILY_ROUNDS} daily plays for today! Come back tomorrow for ${MAX_DAILY_ROUNDS} more.`}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* INTER-ROUND VIDEO AD MODAL (Mandatory between every round and the next) */}
      {showInterRoundAd && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-orange-500/60 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-orange-400">
                <Film className="w-4 h-4 animate-pulse" />
                <span>
                  {isAr
                    ? `إعلان بين الجولات (للانتقال للجولة ${roundsCompletedToday + 1}/${MAX_DAILY_ROUNDS})`
                    : `Inter-Round Ad (Unlocking Round ${roundsCompletedToday + 1}/${MAX_DAILY_ROUNDS})`}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 font-mono text-xs font-black tabular-nums">
                {adCanContinue ? (isAr ? 'جاهز ✓' : 'Ready ✓') : `${adSecondsLeft}s`}
              </span>
            </div>

            <div className="relative bg-black aspect-video w-full flex items-center justify-center">
              <video
                ref={adVideoRef}
                src={currentAd.videoUrl}
                autoPlay
                playsInline
                muted={isMuted}
                onEnded={() => setAdCanContinue(true)}
                className="w-full h-full object-contain"
              />
              <a
                href={currentAd.clickThroughUrl || OFFICIAL_VAST_FEED_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-orange-500/90 hover:bg-orange-400 text-slate-950 font-black text-[11px] shadow-lg"
              >
                {isAr ? 'زيارة الراعي الرسمي ↗' : 'Visit Sponsor ↗'}
              </a>
            </div>

            <div className="p-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-300 font-bold">
                {adCanContinue
                  ? (isAr ? '✅ اكتمل الإعلان! يمكنك الآن بدء الجولة التالية' : '✅ Ad finished! You can now start the next round')
                  : (isAr ? `يرجى الانتظار ${adSecondsLeft} ثوانٍ لفتح الجولة التالية...` : `Please wait ${adSecondsLeft}s to unlock the next round...`)}
              </p>
              <button
                type="button"
                disabled={!adCanContinue}
                onClick={handleCompleteInterRoundAd}
                className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all shrink-0 ${
                  adCanContinue
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 cursor-pointer shadow-lg active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isAr ? 'بدء الجولة التالية ⚽' : 'Start Next Round ⚽'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
