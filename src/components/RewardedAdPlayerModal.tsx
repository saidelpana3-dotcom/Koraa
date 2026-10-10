import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertTriangle, CheckCircle2, Sparkles, ExternalLink, X, Globe, Video, Loader2 } from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { VastAdItem, DEFAULT_VAST_ADS, fetchLiveVastAds, getVastAdForVideo, pingAdImpression } from '../services/vastAdsService';

interface RewardedAdPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardEarned: () => void;
  language: Language;
  theme?: ThemeMode;
  adNumber?: number; // 1, 2, or 3
  adIndexToday?: number;
  maxDailyAds?: number;
  hasMatchesToday?: boolean;
  sponsorUrl?: string;
}

export const RewardedAdPlayerModal: React.FC<RewardedAdPlayerModalProps> = ({
  isOpen,
  onClose,
  onRewardEarned,
  language,
  theme = 'light',
  adNumber,
  adIndexToday,
  maxDailyAds = 3,
  hasMatchesToday = true,
  sponsorUrl,
}) => {
  const isAr = language === 'ar';
  const effectiveAdNumber = adNumber || adIndexToday || 1;
  const initialAd = getVastAdForVideo(effectiveAdNumber);

  const [currentAd, setCurrentAd] = useState<VastAdItem>(initialAd);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true); // start muted for browser autoplay compliance
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showExitWarning, setShowExitWarning] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(15);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const impressionPinged = useRef<boolean>(false);
  const rewardGrantedRef = useRef<boolean>(false);

  // Web Audio fanfare
  const playSuccessFanfare = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        setTimeout(() => {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
          } catch (_) {}
        }, i * 90);
      });
    } catch (_) {}
  };

  // Safely grant reward and defer parent state update so React never triggers setState during render
  const grantRewardSafely = () => {
    if (rewardGrantedRef.current) return;
    rewardGrantedRef.current = true;
    setIsCompleted(true);
    playSuccessFanfare();
    pingAdImpression(currentAd.completeTrackingUrl);
    setTimeout(() => {
      try {
        onRewardEarned();
        window.dispatchEvent(new Event('kora_coins_updated'));
      } catch (err) {
        console.error('Error in onRewardEarned:', err);
      }
    }, 0);
  };

  // Load live VAST ad for this specific video slot
  useEffect(() => {
    if (isOpen) {
      impressionPinged.current = false;
      rewardGrantedRef.current = false;
      setIsCompleted(false);
      setShowExitWarning(false);
      setTimeLeft(15);
      setCurrentTime(0);
      setIsLoadingVideo(true);
      setIsPlaying(true);

      const ad = getVastAdForVideo(effectiveAdNumber);
      setCurrentAd(ad);

      fetchLiveVastAds().then((ads) => {
        const freshAd = ads[(effectiveAdNumber - 1) % ads.length] || ad;
        if (freshAd && freshAd.videoUrl !== ad.videoUrl) {
          setCurrentAd(freshAd);
        }
      });
    }
  }, [isOpen, effectiveAdNumber]);

  // Handle video element playback & time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isOpen) return;

    const handleLoadedData = () => {
      setIsLoadingVideo(false);
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
      video.play().catch(() => {
        // If autoplay with sound is blocked, fallback to muted autoplay
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (!impressionPinged.current) {
        impressionPinged.current = true;
        pingAdImpression(currentAd.impressionUrl || currentAd.startTrackingUrl);
      }
    };

    const handlePause = () => setIsPlaying(false);

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const remainingSecs = Math.max(0, Math.ceil(15 - video.currentTime));
      setTimeLeft(remainingSecs);

      if (video.currentTime >= 15 && !isCompleted) {
        grantRewardSafely();
      }
    };

    const handleEnded = () => {
      if (!isCompleted) {
        grantRewardSafely();
      }
    };

    const handleError = () => {
      if (video.src.includes('/api/ads/video')) {
        video.src = currentAd.videoUrl;
        video.load();
        video.play().catch(() => {});
        return;
      }
      // If primary video failed, try fallback media file if available
      if (currentAd.mediaFiles && currentAd.mediaFiles.length > 1) {
        const nextMedia = currentAd.mediaFiles.find((m) => m.url !== currentAd.videoUrl);
        if (nextMedia) {
          video.src = nextMedia.url;
          video.load();
          video.play().catch(() => {});
          return;
        }
      }
      setIsLoadingVideo(false);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [isOpen, currentAd, isCompleted]);

  // Fallback timer in case video buffering lags or pauses
  useEffect(() => {
    if (!isOpen || isCompleted || showExitWarning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isCompleted, showExitWarning]);

  // When timer reaches 0, safely award the completion reward in an effect
  useEffect(() => {
    if (isOpen && !isCompleted && timeLeft <= 0) {
      grantRewardSafely();
    }
  }, [isOpen, isCompleted, timeLeft]);

  const handleSafeClose = () => {
    if (isCompleted && !rewardGrantedRef.current) {
      grantRewardSafely();
    }
    onClose();
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleOpenAdWebsite = () => {
    const targetUrl = currentAd.clickThroughUrl || sponsorUrl || 'https://vapid-size.com';
    try {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (_) {}
  };

  const handleAttemptClose = () => {
    if (isCompleted) {
      onClose();
    } else {
      setShowExitWarning(true);
    }
  };

  const confirmExitWithoutReward = () => {
    setShowExitWarning(false);
    onClose();
  };

  if (!isOpen) return null;

  if (!hasMatchesToday) {
    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
      >
        <div className="relative w-full max-w-md bg-slate-950 border border-rose-500/40 rounded-3xl p-6 text-center text-white shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-2xl">
            ⚽
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-rose-400">
              {isAr ? 'تعال بكره مفيش مباريات اليوم' : 'Come back tomorrow, no matches today'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {isAr
                ? 'مشاهدة إعلانات الكوينز غير مفعلة اليوم لعدم وجود مباريات قادمة. ننتظركم غداً لربح الكوينز وتوقع المباريات!'
                : 'Coin rewarded ads are unavailable today because there are no upcoming matches. Come back tomorrow!'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            {isAr ? 'حسناً، فهمت' : 'Understood'}
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round(((15 - timeLeft) / 15) * 100));

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[95vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black flex items-center gap-1.5 shadow-sm">
              <Video className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? `فيديو الإعلان (${effectiveAdNumber} من ${maxDailyAds})` : `Ad Video (${effectiveAdNumber}/${maxDailyAds})`}</span>
            </span>
            <span className="text-xs font-black text-slate-200">
              {isCompleted ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isAr ? 'اكتمل الإعلان (+5 كوينز) 🎉' : 'Completed (+5 Coins) 🎉'}
                </span>
              ) : (
                <span className="font-mono text-amber-300">
                  {isAr ? `متبقي: ${timeLeft} ثانية` : `${timeLeft}s left`}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle Button */}
            <button
              type="button"
              onClick={toggleMute}
              className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold ${
                isMuted
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
              title={isMuted ? (isAr ? 'اضغط لتشغيل الصوت' : 'Click to Unmute') : (isAr ? 'كتم الصوت' : 'Mute')}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">{isAr ? 'صامت' : 'Muted'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">{isAr ? 'صوت' : 'Sound'}</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleAttemptClose}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white'
              }`}
              title={isCompleted ? (isAr ? 'إغلاق ومتابعة' : 'Close') : (isAr ? 'إغلاق' : 'Close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 h-1.5 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-500 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Main Video Ad Player Stage */}
        <div className="relative flex-1 bg-black flex flex-col items-center justify-center min-h-[280px] sm:min-h-[360px] overflow-hidden">
          {/* Native HTML5 Video Element */}
          <video
            ref={videoRef}
            src={`/api/ads/video?url=${encodeURIComponent(currentAd.videoUrl)}`}
            playsInline
            autoPlay
            muted={isMuted}
            preload="auto"
            onClick={handleOpenAdWebsite}
            className="w-full h-full object-contain max-h-[50vh] cursor-pointer"
          />

          {/* Loading Spinner */}
          {isLoadingVideo && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 pointer-events-none z-10">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="text-xs font-bold text-slate-300">
                {isAr ? 'جاري تحميل فيديو الإعلان...' : 'Loading video ad...'}
              </span>
            </div>
          )}

          {/* Tap-to-visit overlay banner on video hover / tap */}
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
            <button
              type="button"
              onClick={handleOpenAdWebsite}
              className="pointer-events-auto py-1.5 px-3 rounded-xl bg-black/75 hover:bg-black/90 border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-sm transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'اضغط لزيارة صفحة الإعلان ↗' : 'Visit Ad Website ↗'}</span>
            </button>

            {/* Play/Pause control toggle */}
            <button
              type="button"
              onClick={togglePlayPause}
              className="pointer-events-auto p-2 rounded-xl bg-black/75 hover:bg-black/90 border border-white/20 text-white backdrop-blur-sm cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current text-emerald-400" />}
            </button>
          </div>

          {/* Early Exit Warning Overlay */}
          {showExitWarning && (
            <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h4 className="text-base font-black text-white">
                  {isAr ? '⚠️ لم ينتهِ وقت الإعلان بعد!' : '⚠️ Ad Not Finished!'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isAr
                    ? `متبقي ${timeLeft} ثانية فقط لكسب الـ 5 كوينز! إذا خرجت الآن فلن تُحسب المكافأة.`
                    : `Only ${timeLeft}s remaining. If you exit now, you won't receive the 5 coins!`}
                </p>
              </div>
              <div className="flex flex-col w-full max-w-xs gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitWarning(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  {isAr ? '▶️ متابعة المشاهدة (لربح 5 كوينز)' : '▶️ Keep Watching (+5 Coins)'}
                </button>
                <button
                  type="button"
                  onClick={confirmExitWithoutReward}
                  className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs cursor-pointer transition-all"
                >
                  {isAr ? 'خروج بدون المكافأة' : 'Exit without reward'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-3.5 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleOpenAdWebsite}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'فتح رابط العرض في نافذة جديدة' : 'Open Offer Link in New Tab'}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>

          <div>
            {isCompleted ? (
              <button
                type="button"
                onClick={handleSafeClose}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'تم استلام 5 كوينز! إغلاق ←' : 'Claimed +5 Coins! Close ←'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{isAr ? `جاري المشاهدة (${timeLeft}ث)` : `Watching (${timeLeft}s)`}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
