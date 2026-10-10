import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Volume2, VolumeX, Film, X, Loader2 } from 'lucide-react';
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
type GameModeType = 'penalties' | 'goalkeeper';
type ShotOutcome = 'SUCCESS' | 'FAIL' | null;

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
  characterNameAr: string;
  characterNameEn: string;
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
    characterNameAr: 'ريكاردو 🇧🇷',
    characterNameEn: 'Ricardo 🇧🇷',
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
    characterNameAr: 'مارتينيز 🇦🇷',
    characterNameEn: 'Martinez 🇦🇷',
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
    characterNameAr: 'ياسين 🇲🇦',
    characterNameEn: 'Yassine 🇲🇦',
    jerseyPrimary: '#dc2626',
    jerseySecondary: '#15803d',
    shortsColor: '#14532d',
    skinTone: '#e0ac69',
    hairColor: '#111827',
    hasGlasses: false,
    hasHeadband: false,
  },
];

const MAX_PENALTY_DAILY_ROUNDS = 30;
const MAX_KEEPER_DAILY_ROUNDS = 10;
const KICKS_PER_ROUND = 5;

/**
 * Generates a 5-shot round outcome plan with MEDIUM difficulty:
 * - Normal rounds (88%): User succeeds 2 or 3 times (45% chance for 2, 43% chance for 3)
 * - Rare cases (12%): User succeeds 4 times ("أو 4 في الحالات النادرة / مش علطول")
 * - Never 5/5!
 */
function generateMediumDifficultyRoundPlan(): boolean[] {
  const roll = Math.random();
  let targetSuccesses: number;
  if (roll < 0.12) {
    targetSuccesses = 4; // 12% rare case: 4 goals/saves
  } else if (roll < 0.55) {
    targetSuccesses = 3; // 43% normal case: 3 goals/saves
  } else {
    targetSuccesses = 2; // 45% normal case: 2 goals/saves
  }

  const plan: boolean[] = [
    ...Array(targetSuccesses).fill(true),
    ...Array(KICKS_PER_ROUND - targetSuccesses).fill(false),
  ];

  // Fisher-Yates shuffle so successes/fails happen on unpredictable kicks
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = plan[i];
    plan[i] = plan[j];
    plan[j] = temp;
  }
  return plan;
}

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
      {/* Street Football Glasses */}
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

  // Active Game Mode: 'penalties' ("البلنتيات") or 'goalkeeper' ("حارس المرمى - صد الكور")
  const [activeGameMode, setActiveGameMode] = useState<GameModeType>('penalties');
  const [selectedCharacterMode, setSelectedCharacterMode] = useState<GameCharacterMode>(GAME_CHARACTER_MODES[0]);

  const getTodayKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const userKey = user?.uid || 'guest';
  const todayKey = getTodayKey();
  const penaltyRoundsStorageKey = `kora_penalty_rounds_${userKey}_${todayKey}`;
  const keeperRoundsStorageKey = `kora_keeper_rounds_${userKey}_${todayKey}`;
  const pendingAdStorageKey = `kora_inter_round_ad_pending_${userKey}`;
  const penaltyUnlockedRoundKey = `kora_penalty_unlocked_round_${userKey}_${todayKey}`;
  const keeperUnlockedRoundKey = `kora_keeper_unlocked_round_${userKey}_${todayKey}`;

  // Track completed rounds today for Penalties (max 30/day)
  const [penaltyRoundsToday, setPenaltyRoundsToday] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return Math.min(MAX_PENALTY_DAILY_ROUNDS, Number(localStorage.getItem(penaltyRoundsStorageKey) || 0));
  });

  // Track completed rounds today for Goalkeeper Save Game (max 10/day)
  const [keeperRoundsToday, setKeeperRoundsToday] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return Math.min(MAX_KEEPER_DAILY_ROUNDS, Number(localStorage.getItem(keeperRoundsStorageKey) || 0));
  });

  // Track whether an inter-round ad is pending (if user finished a round and exited without watching the ad)
  const [hasPendingInterRoundAd, setHasPendingInterRoundAd] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(pendingAdStorageKey) === 'true';
  });

  const [penaltyUnlockedRound, setPenaltyUnlockedRound] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    return Math.max(1, Number(localStorage.getItem(penaltyUnlockedRoundKey) || 1));
  });

  const [keeperUnlockedRound, setKeeperUnlockedRound] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    return Math.max(1, Number(localStorage.getItem(keeperUnlockedRoundKey) || 1));
  });

  useEffect(() => {
    setPenaltyRoundsToday(
      Math.min(MAX_PENALTY_DAILY_ROUNDS, Number(localStorage.getItem(penaltyRoundsStorageKey) || 0))
    );
    setKeeperRoundsToday(
      Math.min(MAX_KEEPER_DAILY_ROUNDS, Number(localStorage.getItem(keeperRoundsStorageKey) || 0))
    );
    setHasPendingInterRoundAd(localStorage.getItem(pendingAdStorageKey) === 'true');
    setPenaltyUnlockedRound(Math.max(1, Number(localStorage.getItem(penaltyUnlockedRoundKey) || 1)));
    setKeeperUnlockedRound(Math.max(1, Number(localStorage.getItem(keeperUnlockedRoundKey) || 1)));
  }, [penaltyRoundsStorageKey, keeperRoundsStorageKey, pendingAdStorageKey, penaltyUnlockedRoundKey, keeperUnlockedRoundKey]);

  const maxDailyRounds = activeGameMode === 'penalties' ? MAX_PENALTY_DAILY_ROUNDS : MAX_KEEPER_DAILY_ROUNDS;
  const roundsCompletedToday = activeGameMode === 'penalties' ? penaltyRoundsToday : keeperRoundsToday;
  const unlockedRoundForActiveMode = activeGameMode === 'penalties' ? penaltyUnlockedRound : keeperUnlockedRound;

  // Current Round State (5 kicks counter per round)
  const [hasStartedPlaying, setHasStartedPlaying] = useState<boolean>(false);
  const [kickResults, setKickResults] = useState<ShotOutcome[]>([null, null, null, null, null]);
  const [currentKickIndex, setCurrentKickIndex] = useState<number>(0);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [isKeeperReturning, setIsKeeperReturning] = useState<boolean>(false);
  const [ballZone, setBallZone] = useState<TargetZone | null>(null);
  const [keeperZone, setKeeperZone] = useState<TargetZone | null>(null);
  const [lastShotOutcome, setLastShotOutcome] = useState<ShotOutcome>(null);
  const [showFloatingDiamond, setShowFloatingDiamond] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [netRipple, setNetRipple] = useState<boolean>(false);

  // Medium difficulty 5-shot round outcome plan (2 or 3 successes normally, 4 rarely, never 5)
  const [roundPlan, setRoundPlan] = useState<boolean[]>(() => generateMediumDifficultyRoundPlan());

  // Round finished & Inter-round Ad Modal state
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);
  const [showInterRoundAd, setShowInterRoundAd] = useState<boolean>(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState<number>(30);
  const [adCanContinue, setAdCanContinue] = useState<boolean>(false);
  const [adMuted, setAdMuted] = useState<boolean>(true); // Start muted so mobile browsers never block autoplay with a black screen
  const [adLoading, setAdLoading] = useState<boolean>(true);
  const [useDirectAdUrl, setUseDirectAdUrl] = useState<boolean>(false);
  const adVideoRef = useRef<HTMLVideoElement | null>(null);
  const arenaContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchLiveVastAds().catch(() => {});
  }, []);

  // Exit from Round Summary or Inter-Round Ad back to the main Games Page
  const handleExitToGamesPage = () => {
    if (adVideoRef.current) {
      try {
        adVideoRef.current.pause();
      } catch (_) {}
    }
    setShowInterRoundAd(false);
    setIsRoundFinished(false);
    setHasStartedPlaying(false);
    setIsShooting(false);
    setIsKeeperReturning(false);
    setRoundPlan(generateMediumDifficultyRoundPlan());
    setKickResults([null, null, null, null, null]);
    setCurrentKickIndex(0);
    setLastShotOutcome(null);
    setBallZone(null);
    setKeeperZone(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Switch between "البلنتيات" and "حارس المرمى" cleanly and scroll to the bottom arena to start playing
  const handleSwitchGameMode = (mode: GameModeType) => {
    if (isShooting || isKeeperReturning) return;
    setActiveGameMode(mode);
    setRoundPlan(generateMediumDifficultyRoundPlan());
    setKickResults([null, null, null, null, null]);
    setCurrentKickIndex(0);
    setIsRoundFinished(false);
    setIsShooting(false);
    setIsKeeperReturning(false);
    setLastShotOutcome(null);
    setBallZone(null);
    setKeeperZone(null);
    setHasStartedPlaying(false);
    setTimeout(() => {
      arenaContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  // Inter-round Ad timer countdown & guaranteed video playback
  useEffect(() => {
    if (!showInterRoundAd) return;
    setAdSecondsLeft(30);
    setAdCanContinue(false);
    setAdLoading(true);
    setUseDirectAdUrl(false);
    setAdMuted(true);

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

  const isDailyLimitReached = roundsCompletedToday >= maxDailyRounds;
  const successesInCurrentRound = kickResults.filter((r) => r === 'SUCCESS').length;
  const isReadyForNextShot = !isShooting && !isKeeperReturning && keeperZone === null && ballZone === null;
  const mustWatchAdBeforePlaying =
    !isDailyLimitReached &&
    (hasPendingInterRoundAd || (roundsCompletedToday > 0 && unlockedRoundForActiveMode <= roundsCompletedToday));

  // Handle clicking a target corner (either to shoot in "البلنتيات" or dive & save in "حارس المرمى")
  const handleActionOnZone = (chosenZone: TargetZone) => {
    if (!isReadyForNextShot || isRoundFinished || isDailyLimitReached) return;

    if (!user) {
      onSignInRequired();
      return;
    }

    setIsShooting(true);
    setIsKeeperReturning(false);
    setLastShotOutcome(null);
    playGameSound('kick', isMuted);

    // Check medium-difficulty plan for this shot index (2 or 3 per round normally, 4 rarely, never 5)
    const userSucceedsThisShot = Boolean(roundPlan[currentKickIndex]);
    const otherZones = TARGET_ZONES.filter((z) => z.id !== chosenZone.id);
    const randomOtherZone = otherZones[Math.floor(Math.random() * otherZones.length)];

    if (activeGameMode === 'penalties') {
      // GAME 1: "البلنتيات" (User is Shooter, AI is Goalkeeper)
      // Ball goes where user clicked
      setBallZone(chosenZone);
      // If user scores (SUCCESS), AI keeper dives to another corner; if AI saves (FAIL), AI keeper dives to chosenZone
      setKeeperZone(userSucceedsThisShot ? randomOtherZone : chosenZone);
    } else {
      // GAME 2: "حارس المرمى" (User is Goalkeeper, AI Striker shoots at user)
      // User's Goalkeeper dives where user clicked
      setKeeperZone(chosenZone);
      // If user saves (SUCCESS), AI striker shot to chosenZone and user blocks it; if user misses (FAIL), AI striker shot to another corner
      setBallZone(userSucceedsThisShot ? chosenZone : randomOtherZone);
    }

    setTimeout(() => {
      const outcome: ShotOutcome = userSucceedsThisShot ? 'SUCCESS' : 'FAIL';
      setLastShotOutcome(outcome);

      if (outcome === 'SUCCESS') {
        // User earned +1 Orange Diamond (either scored a penalty or saved a shot as goalkeeper!)
        playGameSound('goal', isMuted);
        if (activeGameMode === 'penalties') {
          setNetRipple(true);
          setTimeout(() => setNetRipple(false), 700);
        }
        setShowFloatingDiamond(true);
        onAddDiamonds(1);
        setTimeout(() => setShowFloatingDiamond(false), 1400);
      } else {
        playGameSound('save', isMuted);
        if (activeGameMode === 'goalkeeper') {
          // Ball went into the net against the user keeper
          setNetRipple(true);
          setTimeout(() => setNetRipple(false), 700);
        }
      }

      const updatedResults = [...kickResults];
      updatedResults[currentKickIndex] = outcome;
      setKickResults(updatedResults);

      setTimeout(() => {
        if (currentKickIndex + 1 >= KICKS_PER_ROUND) {
          if (activeGameMode === 'penalties') {
            const newCompleted = Math.min(MAX_PENALTY_DAILY_ROUNDS, penaltyRoundsToday + 1);
            setPenaltyRoundsToday(newCompleted);
            localStorage.setItem(penaltyRoundsStorageKey, newCompleted.toString());
          } else {
            const newCompleted = Math.min(MAX_KEEPER_DAILY_ROUNDS, keeperRoundsToday + 1);
            setKeeperRoundsToday(newCompleted);
            localStorage.setItem(keeperRoundsStorageKey, newCompleted.toString());
          }
          // Mark that the user must watch the inter-round ad before playing the next round (even if they exit/close the app)
          localStorage.setItem(pendingAdStorageKey, 'true');
          setHasPendingInterRoundAd(true);

          setIsRoundFinished(true);
          setIsShooting(false);
          setIsKeeperReturning(false);
          setBallZone(null);
          setKeeperZone(null);
        } else {
          // First return goalkeeper to center position and lock shooting until goalkeeper stands back in place
          setBallZone(null);
          setKeeperZone(null);
          setLastShotOutcome(null);
          setIsKeeperReturning(true);

          setTimeout(() => {
            setCurrentKickIndex((prev) => prev + 1);
            setIsKeeperReturning(false);
            setIsShooting(false);
          }, 700);
        }
      }, 1100);
    }, 520);
  };

  // Start next round after watching the mandatory inter-round Ad
  const handleStartNextRoundWithAd = () => {
    if (roundsCompletedToday >= maxDailyRounds) return;
    setShowInterRoundAd(true);
  };

  const handleCompleteInterRoundAd = () => {
    const adItem = getVastAdForVideo(roundsCompletedToday + 1);
    if (adItem.completeTrackingUrl) {
      pingAdImpression(adItem.completeTrackingUrl);
    }
    // Clear pending ad requirement and unlock the next round
    localStorage.removeItem(pendingAdStorageKey);
    setHasPendingInterRoundAd(false);
    if (activeGameMode === 'penalties') {
      const nextRoundNum = penaltyRoundsToday + 1;
      setPenaltyUnlockedRound(nextRoundNum);
      localStorage.setItem(penaltyUnlockedRoundKey, nextRoundNum.toString());
    } else {
      const nextRoundNum = keeperRoundsToday + 1;
      setKeeperUnlockedRound(nextRoundNum);
      localStorage.setItem(keeperUnlockedRoundKey, nextRoundNum.toString());
    }

    setShowInterRoundAd(false);
    setRoundPlan(generateMediumDifficultyRoundPlan());
    setKickResults([null, null, null, null, null]);
    setCurrentKickIndex(0);
    setIsRoundFinished(false);
    setIsShooting(false);
    setIsKeeperReturning(false);
    setHasStartedPlaying(true);
    setLastShotOutcome(null);
    setBallZone(null);
    setKeeperZone(null);
    playGameSound('whistle', isMuted);
  };

  const currentAd = getVastAdForVideo(roundsCompletedToday + 1);

  return (
    <div className="space-y-3.5 pb-12 select-none animate-fadeIn">
      {/* 1. GAMES & CHARACTERS HUB: 1) "البلنتيات" (30 rounds/day) AND 2) "حارس المرمى - صد البلنتيات" (10 rounds/day) */}
      <div className={`p-3.5 rounded-3xl border shadow-lg transition-all ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/30 border-orange-500/40 text-white'
          : 'bg-white border-orange-200 text-slate-900 shadow-md'
      }`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🎮</span>
            <h1 className="text-xs sm:text-sm font-black tracking-tight">
              {isAr ? 'اختر اللعبة والشخصية (Games)' : 'Choose Game & Character'}
            </h1>
          </div>
          <span className="text-[11px] font-bold text-orange-500 dark:text-orange-400 flex items-center gap-1">
            <OrangeDiamondIcon className="w-3.5 h-3.5" />
            <span>
              {activeGameMode === 'penalties'
                ? (isAr ? 'كل هدف = 1 ماسة برتقالي' : '1 Goal = 1 Orange Gem')
                : (isAr ? 'كل صدة = 1 ماسة برتقالي' : '1 Save = 1 Orange Gem')}
            </span>
          </span>
        </div>

        {/* TWO MAIN GAMES SELECTOR: 1. البلنتيات (Shooter) | 2. حارس المرمى (Goalkeeper) */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {/* Game 1: البلنتيات */}
          <button
            type="button"
            onClick={() => {
              handleSwitchGameMode('penalties');
            }}
            className={`p-2.5 sm:p-3 rounded-2xl border-2 text-right transition-all cursor-pointer active:scale-95 flex flex-col justify-between gap-2 ${
              activeGameMode === 'penalties'
                ? isDark
                  ? 'bg-gradient-to-br from-orange-500/25 via-amber-500/15 to-slate-900 border-orange-400 shadow-lg shadow-orange-950/50'
                  : 'bg-orange-50/90 border-orange-500 shadow-md ring-1 ring-orange-400/50'
                : isDark
                  ? 'bg-slate-900/85 border-slate-800 hover:border-slate-700 opacity-85 hover:opacity-100'
                  : 'bg-white border-slate-300 hover:border-orange-400 shadow-xs'
            }`}
          >
            {/* Expressive Game Illustration Banner: Penalty Shootout into Top Corner */}
            <div className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-orange-500/30 shadow-inner bg-gradient-to-b from-[#0b2b68] via-[#1d4ed8] to-[#b83222]">
              <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                {/* Stadium Sky & Turf */}
                <rect x="0" y="68" width="200" height="32" fill="#b83222" />
                <line x1="0" y1="68" x2="200" y2="68" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
                {/* Goalpost & Net */}
                <rect x="34" y="16" width="132" height="52" fill="rgba(0,0,0,0.25)" stroke="#ffffff" strokeWidth="4" />
                <line x1="56" y1="16" x2="56" y2="68" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="78" y1="16" x2="78" y2="68" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="100" y1="16" x2="100" y2="68" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="122" y1="16" x2="122" y2="68" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="144" y1="16" x2="144" y2="68" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="34" y1="33" x2="166" y2="33" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="34" y1="50" x2="166" y2="50" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                {/* Target Bullseye in Top-Right Corner */}
                <circle cx="148" cy="30" r="11" fill="rgba(249,115,22,0.45)" stroke="#fde047" strokeWidth="2" strokeDasharray="3 2" />
                {/* Diving Keeper on Left */}
                <g transform="translate(72, 46) rotate(-28)">
                  <rect x="-10" y="-6" width="20" height="14" rx="4" fill="#facc15" stroke="#15803d" strokeWidth="1.5" />
                  <circle cx="0" cy="-12" r="6" fill="#e59866" />
                  <line x1="-10" y1="-2" x2="-22" y2="-8" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
                  <line x1="10" y1="-2" x2="22" y2="-8" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
                </g>
                {/* Fiery Curved Shot Trail from Penalty Spot to Top-Right Corner */}
                <path d="M 100,88 Q 130,65 146,32" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="4 2" />
                {/* Soccer Ball at Top-Right Target */}
                <circle cx="148" cy="30" r="8" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
                <polygon points="148,26 152,29 150,34 146,34 144,29" fill="#0f172a" />
                {/* Foreground Shooter Boot / Penalty Spot */}
                <circle cx="100" cy="88" r="3.5" fill="#ffffff" />
              </svg>
              <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-slate-950/85 text-orange-300 font-mono text-[10px] font-black tabular-nums border border-orange-400/40">
                {penaltyRoundsToday}/{MAX_PENALTY_DAILY_ROUNDS} {isAr ? 'جولة يومياً' : 'rounds/day'}
              </span>
            </div>

            {/* Clear Black Text in Light Mode & Crisp White in Dark Mode */}
            <div className="space-y-1">
              <div className={`text-sm sm:text-base font-black ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}>
                {isAr ? 'البلنتيات ⚽' : 'Penalties ⚽'}
              </div>
              <div className={`text-[11px] font-extrabold leading-snug ${
                isDark ? 'text-slate-200' : 'text-slate-900'
              }`}>
                {isAr ? 'أنت المسدد • سجل في الزاوية (1 ماسة لكل هدف)' : 'You Shoot • Score in corners (1 Gem/goal)'}
              </div>
            </div>

            <div className={`w-full py-2 rounded-xl text-center text-xs font-black transition-all ${
              activeGameMode === 'penalties'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-white border border-orange-500/30'
            }`}>
              {isAr ? 'اختار اللعبة ⚽' : 'Choose Game ⚽'}
            </div>
          </button>

          {/* Game 2: حارس المرمى (Reverse Game - User is Goalkeeper) */}
          <button
            type="button"
            onClick={() => {
              handleSwitchGameMode('goalkeeper');
            }}
            className={`p-2.5 sm:p-3 rounded-2xl border-2 text-right transition-all cursor-pointer active:scale-95 flex flex-col justify-between gap-2 ${
              activeGameMode === 'goalkeeper'
                ? isDark
                  ? 'bg-gradient-to-br from-emerald-500/25 via-teal-500/15 to-slate-900 border-emerald-400 shadow-lg shadow-emerald-950/50'
                  : 'bg-emerald-50/90 border-emerald-500 shadow-md ring-1 ring-emerald-400/50'
                : isDark
                  ? 'bg-slate-900/85 border-slate-800 hover:border-slate-700 opacity-85 hover:opacity-100'
                  : 'bg-white border-slate-300 hover:border-emerald-500 shadow-xs'
            }`}
          >
            {/* Expressive Game Illustration Banner: Goalkeeper Diving & Saving the Ball with Gloves */}
            <div className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-emerald-500/30 shadow-inner bg-gradient-to-b from-[#064e3b] via-[#047857] to-[#1e293b]">
              <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                {/* Turf Floor */}
                <rect x="0" y="68" width="200" height="32" fill="#991b1b" />
                <line x1="0" y1="68" x2="200" y2="68" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
                {/* Goalpost & Net */}
                <rect x="34" y="16" width="132" height="52" fill="rgba(0,0,0,0.28)" stroke="#ffffff" strokeWidth="4" />
                <line x1="56" y1="16" x2="56" y2="68" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="78" y1="16" x2="78" y2="68" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="100" y1="16" x2="100" y2="68" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="122" y1="16" x2="122" y2="68" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="144" y1="16" x2="144" y2="68" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="34" y1="33" x2="166" y2="33" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="34" y1="50" x2="166" y2="50" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                {/* Hero Goalkeeper Leaping to Save */}
                <g transform="translate(105, 42) rotate(-22)">
                  <rect x="-12" y="-7" width="24" height="16" rx="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="0" cy="-14" r="7" fill="#f1c27d" />
                  <path d="M-7,-16 Q0,-22 7,-16" fill="#1e1b18" />
                  {/* Extended Arms Toward Top-Left Save */}
                  <line x1="-12" y1="-3" x2="-34" y2="-10" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
                  {/* Glowing Green Goalkeeper Gloves Blocking the Ball */}
                  <circle cx="-37" cy="-11" r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                </g>
                {/* Save Impact Burst & Blocked Ball */}
                <circle cx="66" cy="29" r="13" fill="rgba(16,185,129,0.4)" stroke="#6ee7b7" strokeWidth="2" strokeDasharray="3 2" />
                <circle cx="66" cy="29" r="7.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
                <polygon points="66,25 70,28 68,33 64,33 62,28" fill="#0f172a" />
              </svg>
              <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-slate-950/85 text-emerald-300 font-mono text-[10px] font-black tabular-nums border border-emerald-400/40">
                {keeperRoundsToday}/{MAX_KEEPER_DAILY_ROUNDS} {isAr ? 'جولات يومياً' : 'rounds/day'}
              </span>
            </div>

            {/* Clear Black Text in Light Mode & Crisp White in Dark Mode */}
            <div className="space-y-1">
              <div className={`text-sm sm:text-base font-black ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}>
                {isAr ? 'حارس المرمى (صد الكور) 🧤' : 'Goalkeeper Save 🧤'}
              </div>
              <div className={`text-[11px] font-extrabold leading-snug ${
                isDark ? 'text-slate-200' : 'text-slate-900'
              }`}>
                {isAr ? 'أنت الحارس • صد التسديدات (1 ماسة لكل صدة)' : 'You are the Keeper • Save shots (1 Gem/save)'}
              </div>
            </div>

            <div className={`w-full py-2 rounded-xl text-center text-xs font-black transition-all ${
              activeGameMode === 'goalkeeper'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-white border border-emerald-500/30'
            }`}>
              {isAr ? 'اختار اللعبة 🧤' : 'Choose Game 🧤'}
            </div>
          </button>
        </div>

        {/* Character Head Cards Selector ("الشخصيات الرئيسية مع شكل رأس") */}
        <div className="grid grid-cols-3 gap-2">
          {GAME_CHARACTER_MODES.map((mode) => {
            const isActive = selectedCharacterMode.id === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSelectedCharacterMode(mode)}
                className={`p-2 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 ${
                  isActive
                    ? isDark
                      ? 'bg-orange-500/20 border-orange-400 shadow-sm ring-1 ring-orange-400/40'
                      : 'bg-orange-50 border-orange-500 shadow-xs'
                    : isDark
                      ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                      : 'bg-white border-slate-300 hover:border-slate-400'
                }`}
              >
                <CharacterHeadAvatar mode={mode} className="w-9 h-9" />
                <div className="min-w-0 text-right">
                  <div className={`text-[10px] sm:text-[11px] font-black truncate ${
                    isDark ? (isActive ? 'text-orange-300' : 'text-slate-200') : 'text-slate-950'
                  }`}>
                    {isAr ? mode.characterNameAr : mode.characterNameEn}
                  </div>
                  <div className={`text-[9px] font-extrabold truncate ${
                    isDark ? 'text-slate-400' : 'text-slate-700'
                  }`}>
                    {activeGameMode === 'penalties'
                      ? (isAr ? 'حارس الخصم' : 'Rival Keeper')
                      : (isAr ? 'حارسك المختار' : 'Your Keeper')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SCOREBOARD HEADER WITH STACKED COINS & ORANGE DIAMONDS COUNTER + 5-SHOTS COUNTER */}
      <div className={`p-3.5 rounded-3xl border bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white shadow-xl ${
        activeGameMode === 'penalties' ? 'border-orange-500/40' : 'border-emerald-500/40'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <CharacterHeadAvatar mode={selectedCharacterMode} className="w-11 h-11" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-black text-white truncate">
                  {activeGameMode === 'penalties'
                    ? (isAr ? 'لعبة البلنتيات ⚽' : 'Penalties Game ⚽')
                    : (isAr ? 'لعبة حارس المرمى 🧤' : 'Goalkeeper Save Game 🧤')}
                </h2>
                <span className="text-[10px] font-bold text-slate-400">
                  · {isAr ? 'مستوى متوسط' : 'Medium Mode'}
                </span>
              </div>
              <p className={`text-[11px] font-bold truncate flex items-center gap-1 ${
                activeGameMode === 'penalties' ? 'text-orange-300' : 'text-emerald-300'
              }`}>
                <span>
                  {activeGameMode === 'penalties'
                    ? (isAr ? 'اضغط الزاوية للتسديد • كل هدف = 1 ماسة برتقالي' : 'Tap corner to shoot • 1 Goal = 1 Gem')
                    : (isAr ? 'اضغط الزاوية للقفز وصد الكرة • كل صدة = 1 ماسة برتقالي' : 'Tap corner to dive & save • 1 Save = 1 Gem')}
                </span>
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

        {/* Round & 5-Kicks Counter Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/90 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-slate-300">
              {isAr ? 'الجولات اليومية:' : 'Daily Rounds:'}
            </span>
            <span className={`font-mono text-xs font-black tabular-nums ${
              activeGameMode === 'penalties' ? 'text-orange-400' : 'text-emerald-400'
            }`}>
              {Math.min(maxDailyRounds, isRoundFinished ? roundsCompletedToday : roundsCompletedToday + 1)} / {maxDailyRounds}
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
                    res === 'SUCCESS'
                      ? activeGameMode === 'penalties'
                        ? 'bg-orange-500 border-orange-200 text-slate-950 shadow-md shadow-orange-500/40 scale-105'
                        : 'bg-emerald-500 border-emerald-200 text-slate-950 shadow-md shadow-emerald-500/40 scale-105'
                      : res === 'FAIL'
                        ? 'bg-rose-600 border-rose-300 text-white shadow-md shadow-rose-600/30'
                        : isCurrent
                          ? 'bg-amber-400/25 border-orange-400 text-orange-300 animate-pulse scale-110'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                  title={
                    res === 'SUCCESS'
                      ? activeGameMode === 'penalties'
                        ? (isAr ? 'هدف (+1 ماسة برتقالي)' : 'Goal (+1 Orange Gem)')
                        : (isAr ? 'صدة ناجحة (+1 ماسة برتقالي)' : 'Saved (+1 Orange Gem)')
                      : res === 'FAIL'
                        ? activeGameMode === 'penalties'
                          ? (isAr ? 'تصدى لها الحارس 🧤' : 'Saved by Keeper')
                          : (isAr ? 'هدف في مرماك ⚽' : 'Goal Conceded')
                        : `${idx + 1}`
                  }
                >
                  {res === 'SUCCESS'
                    ? activeGameMode === 'penalties'
                      ? '⚽'
                      : '🧤'
                    : res === 'FAIL'
                      ? '✖'
                      : idx + 1}
                </div>
              );
            })}
          </div>

          <div className="text-[11px] font-black text-orange-300 flex items-center gap-1 tabular-nums">
            <span>{isAr ? 'ماسات الجولة:' : 'Round Gems:'}</span>
            <span className="font-mono text-sm text-white">+{successesInCurrentRound}</span>
            <OrangeDiamondIcon className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. MAIN STREET FOOTBALL ARENA (SUPPORTS BOTH "البلنتيات" AND "حارس المرمى") */}
      <div
        ref={arenaContainerRef}
        className="relative w-full h-[550px] sm:h-[590px] rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl select-none"
      >
        
        {/* Top Game Mode Floating Indicator inside Arena */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className={`px-3.5 py-1 rounded-full backdrop-blur-md border text-[11px] font-black shadow-lg flex items-center gap-1.5 ${
            activeGameMode === 'penalties'
              ? 'bg-slate-950/80 border-orange-400/60 text-orange-300'
              : 'bg-slate-950/80 border-emerald-400/60 text-emerald-300'
          }`}>
            <span>{activeGameMode === 'penalties' ? '⚽' : '🧤'}</span>
            <span>
              {activeGameMode === 'penalties'
                ? (isAr ? 'لعبة البلنتيات: أنت المسدد' : 'Penalties: You are the Shooter')
                : (isAr ? 'لعبة حارس المرمى: أنت الحارس (صد الكور)' : 'Goalkeeper Mode: You are the Keeper')}
            </span>
          </div>
        </div>

        {/* A. SKY BACKGROUND & SOFT CLOUDS */}
        <div className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-[#0b2b68] via-[#1c5ec9] to-[#69a9ff]">
          <div className="absolute bottom-14 left-6 w-36 h-12 bg-white/35 rounded-full blur-md" />
          <div className="absolute bottom-16 right-10 w-44 h-14 bg-white/30 rounded-full blur-md" />
          <div className="absolute bottom-20 left-1/3 w-48 h-16 bg-white/25 rounded-full blur-lg" />
        </div>

        {/* B. HANGING INTERNATIONAL FLAGS BUNTING */}
        <svg
          viewBox="0 0 400 130"
          className="absolute top-0 inset-x-0 w-full h-36 pointer-events-none z-10 drop-shadow-md"
          preserveAspectRatio="none"
        >
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
          <g transform="translate(310, 4) rotate(-22)">
            <rect width="34" height="22" fill="#1d4ed8" />
            <rect x="10" width="5" height="22" fill="#facc15" />
            <rect y="8.5" width="34" height="5" fill="#facc15" />
          </g>

          <path d="M -10,76 Q 150,94 340,22" fill="none" stroke="#0f172a" strokeWidth="1.8" opacity="0.85" />
          <g transform="translate(58, 79) rotate(4)">
            <rect width="34" height="25" rx="1.5" fill="#ffffff" />
            <rect x="10" width="6" height="25" fill="#1e3a8a" />
            <rect y="9.5" width="34" height="6" fill="#1e3a8a" />
          </g>
          <g transform="translate(128, 76) rotate(-8)">
            <rect width="34" height="26" rx="1.5" fill="#dc2626" />
            <rect x="14" y="5" width="6" height="16" fill="#ffffff" />
            <rect x="9" y="10" width="16" height="6" fill="#ffffff" />
          </g>
          <g transform="translate(202, 58) rotate(-24)">
            <rect width="40" height="28" rx="1.5" fill="#1e3a8a" />
            <path d="M0,0 L40,28 M40,0 L0,28" stroke="#ffffff" strokeWidth="5" />
            <path d="M0,0 L40,28 M40,0 L0,28" stroke="#dc2626" strokeWidth="2.2" />
            <path d="M20,0 L20,28 M0,14 L40,14" stroke="#ffffff" strokeWidth="7" />
            <path d="M20,0 L20,28 M0,14 L40,14" stroke="#dc2626" strokeWidth="4" />
          </g>
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

          <div className="relative z-10 w-16 sm:w-20 h-36 bg-gradient-to-b from-[#d97757] to-[#b4533c] border-r-2 border-amber-950/40 flex flex-col justify-around p-2">
            <div className="w-6 h-8 bg-amber-950/70 rounded-t-md border border-amber-200/40 mx-auto" />
            <div className="w-6 h-8 bg-amber-950/70 rounded-t-md border border-amber-200/40 mx-auto" />
          </div>

          <svg viewBox="0 0 120 140" className="w-28 h-32 -ml-8 mb-4 z-10 opacity-95">
            <path d="M58,140 Q62,90 55,48" stroke="#78350f" strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d="M55,48 Q20,35 5,58 Q30,48 55,52" fill="#15803d" />
            <path d="M55,48 Q18,20 10,32 Q35,32 55,48" fill="#16a34a" />
            <path d="M55,48 Q55,10 38,8 Q48,26 55,48" fill="#22c55e" />
            <path d="M55,48 Q90,18 105,34 Q80,32 55,48" fill="#16a34a" />
            <path d="M55,48 Q95,38 112,60 Q82,48 55,52" fill="#15803d" />
          </svg>

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
            <line x1="0" y1="8" x2="400" y2="8" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" />
            <path d="M 85,8 Q 200,38 315,8" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5" />
            <path d="M -20,62 Q 200,35 420,62" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="3.5" />
            <polygon points="196,48 204,48 214,132 186,132" fill="rgba(255,255,255,0.82)" />
            <line x1="0" y1="132" x2="400" y2="132" stroke="rgba(255,255,255,0.8)" strokeWidth="6" />
          </svg>
        </div>

        {/* E. 3D WHITE GOALPOST, NET MESH, GOALKEEPER & CLICKABLE TARGET ZONES */}
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

            {/* ANIMATED GOALKEEPER WITH DETAILED EXPRESSIVE HEAD */}
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
              {/* "أنت الحارس" indicator badge when playing Goalkeeper Mode */}
              {activeGameMode === 'goalkeeper' && !keeperZone && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[9px] whitespace-nowrap shadow-md">
                  {isAr ? 'أنت الحارس 🧤' : 'YOU (Keeper) 🧤'}
                </div>
              )}
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
                {/* Spread Goalkeeper Hands / Gloves */}
                <g>
                  <circle
                    cx="11"
                    cy="103"
                    r="7"
                    fill={activeGameMode === 'goalkeeper' ? '#10b981' : selectedCharacterMode.skinTone}
                    stroke="#ffffff"
                    strokeWidth="1.4"
                  />
                  <path d="M6,99 L2,96 M5,103 L1,102 M6,107 L2,108 M10,109 L8,113" stroke={activeGameMode === 'goalkeeper' ? '#10b981' : selectedCharacterMode.skinTone} strokeWidth="2.4" strokeLinecap="round" />
                  <circle
                    cx="139"
                    cy="103"
                    r="7"
                    fill={activeGameMode === 'goalkeeper' ? '#10b981' : selectedCharacterMode.skinTone}
                    stroke="#ffffff"
                    strokeWidth="1.4"
                  />
                  <path d="M144,99 L148,96 M145,103 L149,102 M144,107 L148,108 M140,109 L142,113" stroke={activeGameMode === 'goalkeeper' ? '#10b981' : selectedCharacterMode.skinTone} strokeWidth="2.4" strokeLinecap="round" />
                </g>
                {/* Crest Emblem on Chest */}
                <circle cx="75" cy="81" r="12" fill="#1e3a8a" stroke={selectedCharacterMode.jerseySecondary} strokeWidth="2.5" />
                <path d="M63,81 Q75,76 87,83" stroke="#ffffff" strokeWidth="2.6" fill="none" />

                {/* DETAILED PROMINENT CHARACTER HEAD */}
                <rect x="68" y="46" width="14" height="14" rx="4" fill={selectedCharacterMode.skinTone} />
                <circle cx="54" cy="32" r="4.5" fill={selectedCharacterMode.skinTone} />
                <circle cx="96" cy="32" r="4.5" fill={selectedCharacterMode.skinTone} />
                <rect x="56" y="12" width="38" height="38" rx="16" fill={selectedCharacterMode.skinTone} stroke="#7c2d12" strokeWidth="1.2" />
                <path
                  d="M54,26 Q52,5 66,7 L71,1 L76,6 L83,1 L87,8 Q98,8 96,26 Q88,14 75,15 Q62,14 54,26 Z"
                  fill={selectedCharacterMode.hairColor}
                />
                {selectedCharacterMode.hasHeadband && (
                  <rect x="55" y="16" width="40" height="5" rx="2" fill={selectedCharacterMode.jerseyPrimary} stroke="#ffffff" strokeWidth="1" />
                )}
                <path d="M62,24 Q67,21 72,24" stroke={selectedCharacterMode.hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M78,24 Q83,21 88,24" stroke={selectedCharacterMode.hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <circle cx="67" cy="29" r="2.4" fill="#0f172a" />
                <circle cx="83" cy="29" r="2.4" fill="#0f172a" />
                <circle cx="66.3" cy="28.3" r="0.9" fill="#ffffff" />
                <circle cx="82.3" cy="28.3" r="0.9" fill="#ffffff" />
                {selectedCharacterMode.hasGlasses && (
                  <g>
                    <rect x="60" y="25" width="14" height="8" rx="2.5" fill="#facc15" fillOpacity="0.28" stroke="#451a03" strokeWidth="1.6" />
                    <rect x="76" y="25" width="14" height="8" rx="2.5" fill="#facc15" fillOpacity="0.28" stroke="#451a03" strokeWidth="1.6" />
                    <line x1="74" y1="29" x2="76" y2="29" stroke="#451a03" strokeWidth="1.6" />
                  </g>
                )}
                <path d="M75,30 L73.5,36 L76.5,36" stroke="#9a3412" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                {/* Dynamic Mouth Expression */}
                {(activeGameMode === 'penalties' && lastShotOutcome === 'SUCCESS') ||
                (activeGameMode === 'goalkeeper' && lastShotOutcome === 'FAIL') ? (
                  <ellipse cx="75" cy="42" rx="4" ry="3.2" fill="#7c2d12" />
                ) : lastShotOutcome ? (
                  <path d="M68,40 Q75,46 82,40 Z" fill="#ffffff" stroke="#7c2d12" strokeWidth="1.5" />
                ) : (
                  <path d="M69,41 Q75,44.5 81,40.5" stroke="#7c2d12" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                )}
              </svg>
            </motion.div>

            {/* INTERACTIVE TARGET ZONES (Shoot in "البلنتيات" OR Dive to Save in "حارس المرمى") */}
            {hasStartedPlaying && !isRoundFinished && !isDailyLimitReached && TARGET_ZONES.map((zone) => {
              const isSelected =
                (activeGameMode === 'penalties' && ballZone?.id === zone.id) ||
                (activeGameMode === 'goalkeeper' && keeperZone?.id === zone.id);

              return (
                <button
                  key={zone.id}
                  type="button"
                  disabled={!isReadyForNextShot}
                  onClick={() => handleActionOnZone(zone)}
                  style={{
                    left: `${zone.xPercent}%`,
                    top: `${zone.yPercent}%`,
                  }}
                  aria-label={isAr ? zone.labelAr : zone.labelEn}
                  title={
                    !isReadyForNextShot
                      ? (isAr ? 'انتظر حتى يقف الحارس في مكانه' : 'Wait for goalkeeper to stand in place')
                      : activeGameMode === 'penalties'
                      ? (isAr ? `سدد في ${zone.labelAr}` : `Shoot ${zone.labelEn}`)
                      : (isAr ? `اقفز لصد الكرة في ${zone.labelAr}` : `Dive to ${zone.labelEn}`)
                  }
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 group focus:outline-none transition-all ${
                    !isReadyForNextShot
                      ? 'pointer-events-none opacity-25 scale-90 cursor-not-allowed'
                      : 'cursor-pointer hover:scale-115 active:scale-90'
                  }`}
                >
                  {activeGameMode === 'penalties' ? (
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                      isSelected
                        ? 'bg-orange-500/60 border-orange-200 scale-110 shadow-[0_0_20px_rgba(249,115,22,0.95)]'
                        : 'bg-orange-500/25 hover:bg-orange-500/45 border-white/85 hover:border-orange-300 shadow-[0_0_15px_rgba(0,0,0,0.6)] animate-pulse'
                    }`}>
                      <div className="w-6 h-6 rounded-full border-2 border-dashed border-orange-200 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-orange-400 group-hover:bg-white" />
                      </div>
                    </div>
                  ) : (
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                      isSelected
                        ? 'bg-emerald-500/70 border-emerald-200 scale-110 shadow-[0_0_20px_rgba(16,185,129,0.95)]'
                        : 'bg-emerald-500/30 hover:bg-emerald-500/55 border-white/90 hover:border-emerald-300 shadow-[0_0_15px_rgba(0,0,0,0.65)] animate-pulse'
                    }`}>
                      <span className="text-lg sm:text-xl drop-shadow">🧤</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* F. FLOATING OUTCOME BANNER */}
        <AnimatePresence>
          {lastShotOutcome && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="absolute top-[13%] left-1/2 -translate-x-1/2 z-40 pointer-events-none w-max max-w-[92%]"
            >
              {lastShotOutcome === 'SUCCESS' ? (
                <div className={`px-5 py-2.5 rounded-2xl border-2 border-white text-slate-950 font-black text-sm sm:text-base shadow-2xl flex items-center gap-2 ${
                  activeGameMode === 'penalties'
                    ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600'
                    : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500'
                }`}>
                  <span>
                    {activeGameMode === 'penalties'
                      ? (isAr ? '⚽ جـوووول رائع!' : '⚽ Great Goal!')
                      : (isAr ? '🧤 صدة أسطورية يا وحش!' : '🧤 Epic Save!')}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-xl bg-slate-950 text-orange-300 font-mono text-sm flex items-center gap-1">
                    <span>+1</span>
                    <OrangeDiamondIcon className="w-4 h-4" />
                  </span>
                </div>
              ) : (
                <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 border-2 border-rose-200 text-white font-black text-sm sm:text-base shadow-[0_10px_30px_rgba(225,29,72,0.7)] flex items-center gap-2">
                  <span>
                    {activeGameMode === 'penalties'
                      ? (isAr ? `🧤 تصدى لها الحارس ${selectedCharacterMode.characterNameAr}!` : `🧤 Saved by ${selectedCharacterMode.characterNameEn}!`)
                      : (isAr ? '⚽ هدف في مرماك! سدد المهاجم في الزاوية الأخرى' : '⚽ Goal Conceded! Striker shot the other way')}
                  </span>
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

        {/* AI STRIKER CHARACTER ON THE PENALTY SPOT (Shown in "حارس المرمى" mode so user sees who shoots at them!) */}
        {activeGameMode === 'goalkeeper' && (
          <motion.div
            animate={
              isShooting
                ? { x: 14, y: -10, rotate: -12 }
                : { x: 0, y: 0, rotate: 0 }
            }
            transition={{ duration: 0.25 }}
            className="absolute bottom-[17%] left-[28%] sm:left-[34%] z-20 w-24 h-32 pointer-events-none"
          >
            <svg viewBox="0 0 110 150" className="w-full h-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.65)]">
              <ellipse cx="55" cy="142" rx="24" ry="5" fill="rgba(0,0,0,0.45)" />
              {/* Striker Legs (Kicking motion when shooting) */}
              <path d="M44,96 L40,136" stroke="#e0ac69" strokeWidth="9" strokeLinecap="round" />
              <path
                d={isShooting ? 'M64,96 L88,118' : 'M64,96 L68,136'}
                stroke="#e0ac69"
                strokeWidth="9"
                strokeLinecap="round"
              />
              {/* Striker Cleats */}
              <rect x="33" y="133" width="15" height="7" rx="3" fill="#f97316" />
              <rect
                x={isShooting ? '84' : '62'}
                y={isShooting ? '115' : '133'}
                width="15"
                height="7"
                rx="3"
                fill="#f97316"
              />
              {/* Striker Shorts */}
              <path d="M36,78 L74,78 L78,98 L32,98 Z" fill="#0f172a" stroke="#ffffff" strokeWidth="1.2" />
              {/* Striker Jersey (Back #9) */}
              <path d="M34,38 L76,38 L72,80 L38,80 Z" fill="#ef4444" stroke="#fca5a5" strokeWidth="1" />
              <text x="55" y="66" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="900" fontFamily="monospace">
                9
              </text>
              {/* Striker Head */}
              <circle cx="55" cy="22" r="13" fill="#e0ac69" />
              <path d="M42,20 Q55,6 68,20 Q60,14 42,20 Z" fill="#111827" />
            </svg>
          </motion.div>
        )}

        {/* G. ANIMATED 3D SOCCER BALL */}
        <motion.div
          animate={
            ballZone
              ? {
                  x: (ballZone.xPercent - 50) * 2.55,
                  y: -175 + (ballZone.yPercent - 50) * 1.15,
                  scale: 0.46,
                  rotate: ballZone.xPercent < 50 ? -540 : 540,
                }
              : {
                  x: 0,
                  y: 0,
                  scale: 1,
                  rotate: 0,
                }
          }
          transition={{
            duration: ballZone ? 0.5 : 0.25,
            ease: ballZone ? [0.16, 1, 0.3, 1] : 'easeOut',
          }}
          className="absolute bottom-[20%] left-1/2 -translate-x-1/2 z-30 w-20 h-20 sm:w-22 sm:h-22 pointer-events-none"
        >
          {!ballZone && (
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
                  if (mustWatchAdBeforePlaying) {
                    setShowInterRoundAd(true);
                    return;
                  }
                  setHasStartedPlaying(true);
                  playGameSound('whistle', isMuted);
                }}
                className={`px-8 py-3.5 rounded-2xl text-slate-950 font-black text-base sm:text-lg border-2 border-white flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 transition-all animate-bounce ${
                  activeGameMode === 'penalties'
                    ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 shadow-[0_10px_30px_rgba(249,115,22,0.8)]'
                    : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.8)]'
                }`}
              >
                <span>{mustWatchAdBeforePlaying ? '🎬' : activeGameMode === 'penalties' ? '⚽' : '🧤'}</span>
                <span>
                  {mustWatchAdBeforePlaying
                    ? (isAr
                        ? `شاهد الإعلان لبدء الجولة (${roundsCompletedToday + 1} من ${maxDailyRounds})`
                        : `Watch Ad to Start Round (${roundsCompletedToday + 1}/${maxDailyRounds})`)
                    : activeGameMode === 'penalties'
                    ? (isAr ? 'ابدأ اللعب (البلنتيات)' : 'Start Playing (Penalties)')
                    : (isAr ? 'ابدأ اللعب (حارس المرمى)' : 'Start Playing (Goalkeeper)')}
                </span>
                <OrangeDiamondIcon className="w-5 h-5" />
              </button>
              <div className="px-3.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-orange-500/40 text-orange-200 text-[11px] font-black shadow-md text-center">
                {mustWatchAdBeforePlaying
                  ? (isAr
                      ? '⚠️ يجب مشاهدة إعلان الفاصل (30 ثانية) أولاً لفتح الجولة التالية'
                      : '⚠️ You must watch the 30s inter-round ad first to unlock the next round')
                  : activeGameMode === 'penalties'
                  ? (isAr
                      ? `البلنتيات: متاح لك ${MAX_PENALTY_DAILY_ROUNDS} جولة يومياً • كل هدف بـ 1 ماسة!`
                      : `Penalties: ${MAX_PENALTY_DAILY_ROUNDS} rounds/day • 1 Goal = 1 Orange Gem!`)
                  : (isAr
                      ? `حارس المرمى: متاح لك ${MAX_KEEPER_DAILY_ROUNDS} جولات يومياً • كل صدة بـ 1 ماسة!`
                      : `Goalkeeper: ${MAX_KEEPER_DAILY_ROUNDS} rounds/day • 1 Save = 1 Orange Gem!`)}
              </div>
            </div>
          ) : (
            <div className="absolute bottom-4 inset-x-4 z-30 flex items-center justify-center pointer-events-none">
              <div className="px-4 py-2 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-orange-400/50 text-white text-xs font-black flex items-center gap-2 shadow-lg text-center">
                <OrangeDiamondIcon className="w-4 h-4 shrink-0" />
                <span>
                  {isKeeperReturning
                    ? (isAr
                        ? '⏳ انتظر حتى يقف الحارس في مكانه للتسديدة التالية...'
                        : '⏳ Wait for the goalkeeper to stand back in place...')
                    : isShooting
                    ? (isAr ? '⚽ جاري تنفيذ الكرة...' : '⚽ Shot in progress...')
                    : activeGameMode === 'penalties'
                    ? (isAr
                        ? `التسديدة (${currentKickIndex + 1} من 5): اضغط على الزاوية في الشبكة للتسديد بـ 1 ماسة!`
                        : `Shot (${currentKickIndex + 1} of 5): Tap a corner to shoot for 1 Gem!`)
                    : (isAr
                        ? `الكرة (${currentKickIndex + 1} من 5): اضغط على الزاوية للقفز وصد تسديدة المهاجم بـ 1 ماسة!`
                        : `Shot (${currentKickIndex + 1} of 5): Tap a corner to dive & save for 1 Gem!`)}
                </span>
              </div>
            </div>
          )
        )}

        {/* H. ROUND SUMMARY OVERLAY OR DAILY LIMIT OVERLAY */}
        {(isRoundFinished || isDailyLimitReached) && (
          <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="relative w-full max-w-sm bg-slate-900 border-2 border-orange-500/60 rounded-3xl p-5 text-center space-y-4 shadow-2xl">
              {/* Top '×' Close Button to exit to Games Page */}
              <button
                type="button"
                onClick={handleExitToGamesPage}
                title={isAr ? 'إغلاق والخروج لصفحة Games' : 'Close & return to Games'}
                className="absolute top-3.5 left-3.5 w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              {isDailyLimitReached && !isRoundFinished ? (
                <>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    {activeGameMode === 'penalties'
                      ? (isAr ? `اكتملت جولات البلنتيات الـ ${MAX_PENALTY_DAILY_ROUNDS} اليوم! 🔒` : `All ${MAX_PENALTY_DAILY_ROUNDS} Penalty Rounds Completed! 🔒`)
                      : (isAr ? `اكتملت جولات حارس المرمى الـ ${MAX_KEEPER_DAILY_ROUNDS} اليوم! 🔒` : `All ${MAX_KEEPER_DAILY_ROUNDS} Goalkeeper Rounds Completed! 🔒`)}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeGameMode === 'penalties'
                      ? (isAr
                          ? `لقد لعبت الحد الأقصى المتاح في لعبة البلنتيات اليوم (${MAX_PENALTY_DAILY_ROUNDS} جولة). يمكنك تجربة لعبة حارس المرمى بالأعلى أو العودة غداً!`
                          : `You reached the daily limit of ${MAX_PENALTY_DAILY_ROUNDS} penalty rounds. Try Goalkeeper mode above or come back tomorrow!`)
                      : (isAr
                          ? `لقد لعبت الحد الأقصى المتاح في لعبة حارس المرمى اليوم (${MAX_KEEPER_DAILY_ROUNDS} جولات يومياً). يمكنك لعب البلنتيات بالأعلى أو العودة غداً!`
                          : `You reached the daily limit of ${MAX_KEEPER_DAILY_ROUNDS} goalkeeper rounds. Play Penalties above or come back tomorrow!`)}
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-orange-500/40 flex items-center justify-center gap-2 text-sm font-black text-orange-300">
                    <OrangeDiamondIcon className="w-5 h-5" />
                    <span>{isAr ? `إجمالي رصيدك: ${userDiamonds} ماسة برتقالي` : `Your Total Orange Gems: ${userDiamonds}`}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-300 flex items-center justify-center text-3xl shadow-inner">
                    {activeGameMode === 'penalties' ? '🏆' : '🧤'}
                  </div>
                  <h3 className="text-lg font-black text-white">
                    {isAr
                      ? `انتهت الجولة (${roundsCompletedToday} من ${maxDailyRounds})!`
                      : `Round (${roundsCompletedToday} of ${maxDailyRounds}) Complete!`}
                  </h3>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-400">
                      {activeGameMode === 'penalties'
                        ? (isAr ? 'نتيجة الـ 5 تسديدات في لعبة البلنتيات:' : 'Your 5 Penalty Shots Result:')
                        : (isAr ? 'نتيجة الـ 5 كرات في لعبة حارس المرمى:' : 'Your 5 Goalkeeper Saves Result:')}
                    </div>
                    <div className="flex items-center justify-center gap-2" dir="ltr">
                      {kickResults.map((r, i) => (
                        <span
                          key={i}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border ${
                            r === 'SUCCESS'
                              ? activeGameMode === 'penalties'
                                ? 'bg-orange-500 border-orange-200 text-slate-950'
                                : 'bg-emerald-500 border-emerald-200 text-slate-950'
                              : 'bg-rose-600 border-rose-400 text-white'
                          }`}
                        >
                          {r === 'SUCCESS' ? (activeGameMode === 'penalties' ? '⚽' : '🧤') : '✖'}
                        </span>
                      ))}
                    </div>
                    <div className="pt-1 text-sm font-black text-orange-300 flex items-center justify-center gap-1.5">
                      <span>
                        {activeGameMode === 'penalties'
                          ? (isAr
                              ? `سجلت ${successesInCurrentRound} أهداف وربحت +${successesInCurrentRound} ماسة برتقالي`
                              : `Scored ${successesInCurrentRound} goals & earned +${successesInCurrentRound} Orange Gems`)
                          : (isAr
                              ? `تصديت لـ ${successesInCurrentRound} كرات وربحت +${successesInCurrentRound} ماسة برتقالي`
                              : `Saved ${successesInCurrentRound} shots & earned +${successesInCurrentRound} Orange Gems`)}
                      </span>
                      <OrangeDiamondIcon className="w-4 h-4" />
                    </div>
                  </div>

                  {roundsCompletedToday < maxDailyRounds ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-amber-300">
                        {isAr
                          ? `متبقي لك (${maxDailyRounds - roundsCompletedToday}) جولات اليوم — شاهد إعلان الفاصل لبدء الجولة التالية`
                          : `${maxDailyRounds - roundsCompletedToday} rounds left today — Watch the inter-round ad to start the next round`}
                      </p>
                      <button
                        type="button"
                        onClick={handleStartNextRoundWithAd}
                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                      >
                        <Film className="w-4 h-4" />
                        <span>
                          {isAr
                            ? `شاهد الإعلان وابدأ الجولة (${roundsCompletedToday + 1} من ${maxDailyRounds}) 🎬`
                            : `Watch Ad & Start Round (${roundsCompletedToday + 1}/${maxDailyRounds}) 🎬`}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExitToGamesPage}
                        className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <X className="w-3.5 h-3.5 text-rose-400" />
                        <span>{isAr ? 'خروج لصفحة Games' : 'Exit to Games Page'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-black">
                        {isAr
                          ? `🎉 أتممت جميع الجولات الـ ${maxDailyRounds} المتاحة لهذه اللعبة اليوم!`
                          : `🎉 You completed all ${maxDailyRounds} daily rounds for this game today!`}
                      </div>
                      <button
                        type="button"
                        onClick={handleExitToGamesPage}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <X className="w-4 h-4 text-rose-400" />
                        <span>{isAr ? 'العودة لصفحة Games' : 'Back to Games Page'}</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* INTER-ROUND VIDEO AD MODAL */}
      {showInterRoundAd && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-orange-500/60 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-orange-400 min-w-0">
                <Film className="w-4 h-4 shrink-0 animate-pulse" />
                <span className="truncate">
                  {isAr
                    ? `إعلان بين الجولات (للانتقال للجولة ${roundsCompletedToday + 1}/${maxDailyRounds})`
                    : `Inter-Round Ad (Unlocking Round ${roundsCompletedToday + 1}/${maxDailyRounds})`}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Sound Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !adMuted;
                    setAdMuted(nextMuted);
                    if (adVideoRef.current) {
                      adVideoRef.current.muted = nextMuted;
                    }
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  title={adMuted ? (isAr ? 'تشغيل الصوت' : 'Unmute') : (isAr ? 'كتم الصوت' : 'Mute')}
                >
                  {adMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                {/* Countdown Pill */}
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 font-mono text-xs font-black tabular-nums">
                  {adCanContinue ? (isAr ? 'جاهز ✓' : 'Ready ✓') : `${adSecondsLeft}s`}
                </span>

                {/* '×' Close Button to exit to Games Page if user doesn't want to play next round */}
                <button
                  type="button"
                  onClick={handleExitToGamesPage}
                  title={isAr ? 'إغلاق والخروج لصفحة Games' : 'Close & Exit to Games Page'}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative bg-black aspect-video w-full flex items-center justify-center overflow-hidden">
              <video
                ref={adVideoRef}
                key={useDirectAdUrl ? currentAd.videoUrl : `/api/ads/video?url=${encodeURIComponent(currentAd.videoUrl)}`}
                src={useDirectAdUrl ? currentAd.videoUrl : `/api/ads/video?url=${encodeURIComponent(currentAd.videoUrl)}`}
                autoPlay
                loop
                playsInline
                muted={adMuted}
                preload="auto"
                onLoadedData={(e) => {
                  setAdLoading(false);
                  const v = e.currentTarget;
                  v.play().catch(() => {
                    v.muted = true;
                    setAdMuted(true);
                    v.play().catch(() => {});
                  });
                }}
                onPlaying={() => setAdLoading(false)}
                onError={() => {
                  if (!useDirectAdUrl) {
                    setUseDirectAdUrl(true);
                  } else {
                    setAdLoading(false);
                  }
                }}
                className="w-full h-full object-contain"
              />

              {adLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 pointer-events-none">
                  <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
                  <span className="text-[11px] font-bold text-slate-300">
                    {isAr ? 'جاري تشغيل الإعلان...' : 'Starting ad video...'}
                  </span>
                </div>
              )}

              <a
                href={currentAd.clickThroughUrl || OFFICIAL_VAST_FEED_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-orange-500/90 hover:bg-orange-400 text-slate-950 font-black text-[11px] shadow-lg z-10"
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
