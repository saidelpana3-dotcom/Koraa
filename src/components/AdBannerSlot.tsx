import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Sparkles, Play, X, Coins, Clock, AlertCircle, CheckCircle2, Globe, ArrowUpRight } from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { VastAdItem, DEFAULT_VAST_ADS, fetchLiveVastAds, pingAdImpression } from '../services/vastAdsService';

interface AdBannerSlotProps {
  language?: Language | string;
  theme?: ThemeMode;
  className?: string;
  onOpenVideoAd?: () => void;
  onEarnReward?: (coins: number) => Promise<{ success: boolean; newCount: number; maxReached: boolean }> | void;
  todayBrowseCount?: number;
  maxDailyBrowseCount?: number;
}

// Web Audio API helper for celebratory coin sound
function playCoinChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    
    // First tone (B5 ~ 987.77 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second tone (E6 ~ 1318.51 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.08);
    gain2.gain.setValueAtTime(0.3, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch (_) {}
}

const MAX_DAILY_BROWSE_LIMIT = 10;
const MIN_BROWSE_SECONDS = 5; // Minimum required seconds inside external ad browser to qualify for 1 coin

// Flag to pause 1-coin ads temporarily per user request until instructed to re-enable
export const IS_ONE_COIN_ADS_PAUSED = true;

interface BrowseSession {
  startedAt: number;
  leftAppAt?: number;
  hasLeftApp: boolean;
}

export const AdBannerSlot: React.FC<AdBannerSlotProps> = ({
  language = 'ar',
  theme = 'light',
  className = '',
  onEarnReward,
  todayBrowseCount,
  maxDailyBrowseCount = MAX_DAILY_BROWSE_LIMIT,
}) => {
  // If 1-coin ads are temporarily paused per user request, do not render
  if (IS_ONE_COIN_ADS_PAUSED) {
    return null;
  }
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  const [adItem, setAdItem] = useState<VastAdItem>(DEFAULT_VAST_ADS[0]);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [justEarnedCoin, setJustEarnedCoin] = useState<boolean>(false);
  
  // Status states
  const [waitingForAdReturn, setWaitingForAdReturn] = useState<boolean>(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [limitNotice, setLimitNotice] = useState<boolean>(false);

  // Active browsing session tracking refs
  const currentSessionRef = useRef<BrowseSession | null>(null);
  const warningTimerRef = useRef<any>(null);

  // Daily counter (10 visits max per day)
  const [dailyCount, setDailyCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const todayKey = new Date().toISOString().slice(0, 10);
    const uid = localStorage.getItem('kora_user_numeric_id') || 'guest';
    const saved = Number(localStorage.getItem(`kora_browse_ads_count_${uid}_${todayKey}`) || 0);
    return typeof todayBrowseCount === 'number' ? Math.max(todayBrowseCount, saved) : saved;
  });

  useEffect(() => {
    if (typeof todayBrowseCount === 'number') {
      setDailyCount(todayBrowseCount);
    }
  }, [todayBrowseCount]);

  useEffect(() => {
    fetchLiveVastAds().then((ads) => {
      if (ads && ads.length > 0) {
        setAdItem(ads[0]);
      }
    }).catch(() => {});

    // Restore any active session from sessionStorage if user returns after mobile tab unload
    try {
      const stored = sessionStorage.getItem('kora_active_browse_ad_session');
      if (stored) {
        const parsed = JSON.parse(stored) as BrowseSession;
        if (parsed && Date.now() - parsed.startedAt < 1000 * 180) { // Valid within 3 minutes
          currentSessionRef.current = parsed;
          setWaitingForAdReturn(true);
        } else {
          sessionStorage.removeItem('kora_active_browse_ad_session');
        }
      }
    } catch (_) {}
  }, []);

  const isLimitReached = dailyCount >= maxDailyBrowseCount;

  const showWarning = (msg: string) => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setValidationWarning(msg);
    warningTimerRef.current = setTimeout(() => {
      setValidationWarning(null);
    }, 6000);
  };

  // Process the return when user refocuses the app after leaving for the ad browser
  const evaluateAdReturn = () => {
    const session = currentSessionRef.current;
    if (!session) return;

    const now = Date.now();

    // 1. RULE CHECK: Did the user actually leave the app and navigate to the external browser?
    if (!session.hasLeftApp || !session.leftAppAt) {
      // The user NEVER navigated out or left the app (e.g. popup blocked or they stayed in the app)
      showWarning(
        isAr
          ? '⚠️ لازم تدخل وتتنقل الأول على المتصفح بتاع الإعلان علشان تاخد الـ 1 كوينز!'
          : '⚠️ You must open and navigate to the ad browser first to earn the 1 coin!'
      );
      return;
    }

    // 2. RULE CHECK: Did the user spend at least MIN_BROWSE_SECONDS in the ad browser?
    const timeSpentOutsideMs = now - session.leftAppAt;
    const minRequiredMs = (MIN_BROWSE_SECONDS - 0.5) * 1000;

    if (timeSpentOutsideMs < minRequiredMs) {
      const secondsSpent = Math.max(1, Math.round(timeSpentOutsideMs / 1000));
      showWarning(
        isAr
          ? `⏱️ مدة تصفح الإعلان قصيرة جداً (${secondsSpent} ثوانٍ)! لازم تتصفح موقع الإعلان بالمتصفح لمدة 5 ثوانٍ على الأقل للحصول على الكوينز 🪙`
          : `⏱️ Ad browse time too short (${secondsSpent}s)! Please stay on the ad page for at least 5 seconds to earn the coin 🪙`
      );
      return;
    }

    // All conditions met! Clear session
    currentSessionRef.current = null;
    setWaitingForAdReturn(false);
    try {
      sessionStorage.removeItem('kora_active_browse_ad_session');
    } catch (_) {}

    // Check daily limit
    const todayKey = new Date().toISOString().slice(0, 10);
    const uid = localStorage.getItem('kora_user_numeric_id') || 'guest';
    const countKey = `kora_browse_ads_count_${uid}_${todayKey}`;
    const currentLocal = Number(localStorage.getItem(countKey) || dailyCount || 0);

    if (currentLocal >= maxDailyBrowseCount) {
      setLimitNotice(true);
      setTimeout(() => setLimitNotice(false), 4500);
      return;
    }

    const newCount = currentLocal + 1;
    setDailyCount(newCount);
    try {
      localStorage.setItem(countKey, newCount.toString());
    } catch (_) {}

    // Award the 1 coin!
    if (onEarnReward) {
      onEarnReward(1);
    } else {
      try {
        const currentPts = Number(localStorage.getItem(`kora_user_points_${uid}`) || 0);
        const newBalance = currentPts + 1;
        localStorage.setItem(`kora_user_points_${uid}`, newBalance.toString());
        window.dispatchEvent(new Event('kora_coins_updated'));
        if (uid && uid !== 'guest') {
          fetch('/api/user/add-ad-reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: uid, rewardType: 'BROWSE', coinsToAdd: 1 }),
          }).catch(() => {});
        }
      } catch (_) {}
    }

    // Play celebration audio and display success banner
    playCoinChime();
    setJustEarnedCoin(true);
    setTimeout(() => {
      setJustEarnedCoin(false);
    }, 5500);
  };

  // Global listeners for app lifecycle events (detecting when user leaves and returns)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User left the app to external browser!
        if (currentSessionRef.current) {
          currentSessionRef.current.hasLeftApp = true;
          currentSessionRef.current.leftAppAt = Date.now();
          try {
            sessionStorage.setItem('kora_active_browse_ad_session', JSON.stringify(currentSessionRef.current));
          } catch (_) {}
        }
      } else if (document.visibilityState === 'visible') {
        // User returned to the app!
        if (currentSessionRef.current && currentSessionRef.current.hasLeftApp) {
          evaluateAdReturn();
        }
      }
    };

    const handleWindowBlur = () => {
      // Window lost focus (user moved to ad browser tab / window)
      if (currentSessionRef.current && !currentSessionRef.current.hasLeftApp) {
        currentSessionRef.current.hasLeftApp = true;
        currentSessionRef.current.leftAppAt = Date.now();
        try {
          sessionStorage.setItem('kora_active_browse_ad_session', JSON.stringify(currentSessionRef.current));
        } catch (_) {}
      }
    };

    const handleWindowFocus = () => {
      // Returned from external window
      if (currentSessionRef.current && currentSessionRef.current.hasLeftApp) {
        evaluateAdReturn();
      }
    };

    const handlePageShow = () => {
      if (currentSessionRef.current && currentSessionRef.current.hasLeftApp) {
        evaluateAdReturn();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [onEarnReward, dailyCount, maxDailyBrowseCount]);

  if (isDismissed) return null;

  // Initiates navigation to the ad's browser page
  const handleStartBrowserAd = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (isLimitReached) {
      setLimitNotice(true);
      setTimeout(() => setLimitNotice(false), 3500);
      return;
    }

    pingAdImpression(adItem.impressionUrl);

    // Initialize active browse session
    const session: BrowseSession = {
      startedAt: Date.now(),
      hasLeftApp: false,
    };
    currentSessionRef.current = session;
    setWaitingForAdReturn(true);
    setValidationWarning(null);

    try {
      sessionStorage.setItem('kora_active_browse_ad_session', JSON.stringify(session));
    } catch (_) {}

    // Open target ad URL in external browser
    try {
      window.open(adItem.clickThroughUrl, '_blank', 'noopener,noreferrer');
    } catch (_) {
      // Fallback direct location change if popup is blocked
      window.location.href = adItem.clickThroughUrl;
    }
  };

  const handleCancelSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    currentSessionRef.current = null;
    setWaitingForAdReturn(false);
    setValidationWarning(null);
    try {
      sessionStorage.removeItem('kora_active_browse_ad_session');
    } catch (_) {}
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`relative overflow-hidden rounded-2xl border transition-all shadow-sm ${
        isDark
          ? 'bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-amber-500/25 text-white shadow-amber-950/20'
          : 'bg-gradient-to-r from-amber-50/90 via-white to-emerald-50/80 border-amber-300 text-slate-900 shadow-slate-200/50'
      } ${className}`}
    >
      {/* 1. Celebratory Success Overlay when user returns from browser with +1 Coin */}
      {justEarnedCoin && (
        <div className="absolute inset-0 z-30 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between gap-2 px-3 py-2 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black truncate">
                {isAr ? `🎉 مبروك! تم التحقق من تصفح الإعلان وإضافة 1 كوينز لرصيدك!` : `🎉 Congrats! Ad verified & +1 Coin added!`}
              </p>
              <p className="text-[10px] text-emerald-100 font-bold">
                {isAr ? `تم إكمال ${dailyCount} من 10 إعلانات اليوم` : `Completed ${dailyCount} of 10 ads today`}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm shrink-0 animate-bounce">
            <span>+1</span>
            <span>🪙</span>
          </span>
        </div>
      )}

      {/* 2. Validation Warning Notice (If user didn't enter browser or returned too quickly) */}
      {validationWarning && (
        <div className="absolute inset-0 z-30 bg-slate-950/95 text-white flex items-center justify-between gap-2 px-3 py-2 border-2 border-amber-500 shadow-2xl animate-fadeIn backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
            <p className="text-[11px] sm:text-xs font-black text-amber-200 leading-tight">
              {validationWarning}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleStartBrowserAd()}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black shrink-0 flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-md"
          >
            <span>{isAr ? 'فتح المتصفح الآن' : 'Open Browser Now'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Daily Limit Reached Notice */}
      {limitNotice && (
        <div className="absolute inset-0 z-30 bg-slate-900/95 text-white flex items-center justify-center gap-2 px-3 py-2 shadow-lg animate-fadeIn border border-amber-500/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-black text-amber-300">
            {isAr ? '⚠️ استنفدت الحد اليومي (10 من 10 مرات)! عد غداً لربح المزيد 🪙' : '⚠️ Daily limit (10 of 10 visits) reached! Come back tomorrow 🪙'}
          </span>
        </div>
      )}

      {/* Main Banner Content */}
      <div className="flex items-center justify-between gap-2.5 p-3 sm:p-3.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Ad Icon Badge */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-amber-500/20">
            {waitingForAdReturn ? (
              <Clock className="w-5 h-5 animate-pulse text-amber-200" />
            ) : (
              <Globe className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                {isAr ? 'إعلان ممول' : 'Sponsored'}
              </span>
              <span className="text-[11px] sm:text-xs font-black truncate text-slate-800 dark:text-slate-100">
                {isAr ? 'عرض الشريك الرسمي بالمتصفح' : 'Official Partner Browser Offer'}
              </span>
            </div>

            {/* Instruction text emphasizing navigating to the ad browser first */}
            <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-600 dark:text-slate-300 truncate mt-0.5">
              {waitingForAdReturn ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-black animate-pulse">
                  <span>⏳</span>
                  <span>{isAr ? 'جارٍ انتظار تصفحك للإعلان في المتصفح (5 ثوانٍ ثم ارجع)!' : 'Browsing ad in browser... stay 5s then return!'}</span>
                </span>
              ) : (
                <span>{isAr ? 'لازم تدخل وتتنقل في متصفح الإعلان (5 ثوانٍ) للحصول على 1 كوينز 🪙' : 'Navigate into ad browser (stay 5s) to earn 1 coin 🪙'}</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex flex-col items-center gap-1">
            {waitingForAdReturn ? (
              <div className="flex items-center gap-1">
                {/* Direct link anchor to ensure navigation opens reliably */}
                <a
                  href={adItem.clickThroughUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleStartBrowserAd()}
                  className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-xs font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <span>{isAr ? 'الانتقال للمتصفح ↗' : 'Go to Browser ↗'}</span>
                </a>
                <button
                  type="button"
                  onClick={handleCancelSession}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[10px]"
                  title={isAr ? 'إلغاء' : 'Cancel'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <a
                href={adItem.clickThroughUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (isLimitReached) {
                    e.preventDefault();
                    setLimitNotice(true);
                    setTimeout(() => setLimitNotice(false), 3500);
                  } else {
                    handleStartBrowserAd(e);
                  }
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                  isLimitReached
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-80'
                    : 'bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white'
                }`}
              >
                <span>{isAr ? 'ادخل لمتصفح الإعلان' : 'Open Ad Browser'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {/* Daily limit badge under button */}
            {!isLimitReached ? (
              <span className="text-[9px] sm:text-[9.5px] font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-0.5 whitespace-nowrap">
                <span>🪙</span>
                <span>{isAr ? `اربح 1 كوينز بالتصفح (${dailyCount}/10)` : `Earn 1 coin by browsing (${dailyCount}/10)`}</span>
              </span>
            ) : (
              <span className="text-[8.5px] sm:text-[9px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center justify-center gap-0.5 whitespace-nowrap">
                <span>✅</span>
                <span>{isAr ? 'تم استنفاد 10/10 اليوم' : 'Daily 10/10 completed'}</span>
              </span>
            )}
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer self-start mt-0.5"
            title={isAr ? 'إخفاء' : 'Dismiss'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdComponent = AdBannerSlot;
export default AdBannerSlot;
