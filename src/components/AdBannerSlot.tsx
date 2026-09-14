import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Sparkles, Play, X, Coins } from 'lucide-react';
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

export const AdBannerSlot: React.FC<AdBannerSlotProps> = ({
  language = 'ar',
  theme = 'light',
  className = '',
  onEarnReward,
  todayBrowseCount,
  maxDailyBrowseCount = MAX_DAILY_BROWSE_LIMIT,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  const [adItem, setAdItem] = useState<VastAdItem>(DEFAULT_VAST_ADS[0]);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [justEarnedCoin, setJustEarnedCoin] = useState<boolean>(false);
  const [limitNotice, setLimitNotice] = useState<boolean>(false);
  const pendingVisitTimestamp = useRef<number>(0);

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
  }, []);

  const isLimitReached = dailyCount >= maxDailyBrowseCount;

  // Detect when user returns to app after visiting the sponsored ad link
  useEffect(() => {
    const checkAndAwardReturnReward = () => {
      let visitTime = pendingVisitTimestamp.current;
      if (!visitTime) {
        try {
          const stored = sessionStorage.getItem('kora_pending_ad_browse_reward');
          if (stored) visitTime = Number(stored);
        } catch (_) {}
      }

      if (visitTime && Date.now() - visitTime >= 800) {
        // Clear pending flag immediately to prevent duplicate rewards per visit
        pendingVisitTimestamp.current = 0;
        try {
          sessionStorage.removeItem('kora_pending_ad_browse_reward');
        } catch (_) {}

        const todayKey = new Date().toISOString().slice(0, 10);
        const uid = localStorage.getItem('kora_user_numeric_id') || 'guest';
        const countKey = `kora_browse_ads_count_${uid}_${todayKey}`;
        const currentLocal = Number(localStorage.getItem(countKey) || dailyCount || 0);

        // Check if user has already hit the 10 times daily limit
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

        // Award 1 coin to user balance
        if (onEarnReward) {
          onEarnReward(1);
        } else {
          // Self-contained fallback update
          try {
            const currentPts = Number(localStorage.getItem(`kora_user_points_${uid}`) || localStorage.getItem('kora_user_points') || 0);
            const newBalance = currentPts + 1;
            localStorage.setItem(`kora_user_points_${uid}`, newBalance.toString());
            localStorage.setItem('kora_user_points', newBalance.toString());
            window.dispatchEvent(new Event('kora_coins_updated'));
          } catch (_) {}
        }

        // Play celebratory audio chime and show reward banner
        playCoinChime();
        setJustEarnedCoin(true);
        setTimeout(() => {
          setJustEarnedCoin(false);
        }, 4500);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndAwardReturnReward();
      }
    };

    const handleWindowFocus = () => {
      checkAndAwardReturnReward();
    };

    const handlePageShow = () => {
      checkAndAwardReturnReward();
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [onEarnReward, dailyCount, maxDailyBrowseCount]);

  if (isDismissed) return null;

  const handleOpenAd = (e: React.MouseEvent) => {
    e.stopPropagation();
    pingAdImpression(adItem.impressionUrl);

    // If limit already reached, notify user
    if (isLimitReached) {
      setLimitNotice(true);
      setTimeout(() => setLimitNotice(false), 3500);
    }

    // Set pending visit timestamp
    const now = Date.now();
    pendingVisitTimestamp.current = now;
    try {
      sessionStorage.setItem('kora_pending_ad_browse_reward', now.toString());
    } catch (_) {}

    try {
      window.open(adItem.clickThroughUrl, '_blank', 'noopener,noreferrer');
    } catch (_) {}
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`relative overflow-hidden rounded-2xl border transition-all shadow-sm ${
        isDark
          ? 'bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-amber-500/20 text-white'
          : 'bg-gradient-to-r from-amber-50/80 via-white to-emerald-50/60 border-amber-300/80 text-slate-900'
      } ${className}`}
    >
      {/* Toast celebratory overlay when user returns with +1 Coin */}
      {justEarnedCoin && (
        <div className="absolute inset-0 z-20 bg-emerald-600 text-white flex items-center justify-center gap-2 px-3 py-2 shadow-lg transition-all animate-fadeIn">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span className="text-xs sm:text-sm font-black">
            {isAr ? `🎉 مبروك! تم إضافة 1 كوينز لرصيدك (${dailyCount}/10 اليوم)!` : `🎉 Congrats! +1 Coin added (${dailyCount}/10 today)!`}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm">
            <span>+1</span>
            <span>🪙</span>
          </span>
        </div>
      )}

      {/* Notice when 10 daily visits limit is reached */}
      {limitNotice && (
        <div className="absolute inset-0 z-20 bg-slate-900/95 text-white flex items-center justify-center gap-2 px-3 py-2 shadow-lg transition-all animate-fadeIn border border-amber-500/40">
          <span className="text-xs sm:text-sm font-black text-amber-400">
            {isAr ? '⚠️ استنفدت الحد اليومي (10 مرات كحد أقصى يومياً)! عد غداً لربح المزيد 🪙' : '⚠️ Daily limit of 10 ad visits reached! Come back tomorrow 🪙'}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2.5 p-3 sm:p-3.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Ad Icon Badge */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-amber-500/20">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                {isAr ? 'إعلان ممول' : 'Sponsored'}
              </span>
              <span className="text-[11px] font-black truncate text-slate-800 dark:text-slate-100">
                {isAr ? 'عرض خاص من الشريك الإعلاني الرسمي' : 'Special Offer from Official Partner'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {isAr ? 'انقر لتصفح أحدث العروض والخدمات الحصرية' : 'Click to explore exclusive offers & features'}
            </p>
          </div>
        </div>

        {/* Action Button with "اربح 1 كوينز لكل اعلان تشاهده" (10 times limit) & Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={handleOpenAd}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white text-xs font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>{isAr ? 'تصفح العرض' : 'Open'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {/* Note under button as requested by user with 10 times limit */}
            {!isLimitReached ? (
              <span className="text-[9px] sm:text-[9.5px] font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-0.5 whitespace-nowrap">
                <span>🪙</span>
                <span>{isAr ? `اربح 1 كوينز لكل إعلان تشاهده (${dailyCount}/10)` : `Earn 1 coin per ad (${dailyCount}/10)`}</span>
              </span>
            ) : (
              <span className="text-[8.5px] sm:text-[9px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center justify-center gap-0.5 whitespace-nowrap">
                <span>✅</span>
                <span>{isAr ? 'تم استنفاد 10/10 اليوم' : 'Daily 10/10 reached'}</span>
              </span>
            )}
          </div>

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
