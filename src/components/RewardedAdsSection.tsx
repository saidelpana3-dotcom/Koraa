import React, { useState, useEffect } from 'react';
import { Tv, Sparkles, CheckCircle2, Gift, Play, ShieldAlert, ArrowRight, ExternalLink, Video, Lock, Radio, PauseCircle } from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { VastAdItem, DEFAULT_VAST_ADS, getVastAdForVideo, fetchLiveVastAds } from '../services/vastAdsService';

export const OFFICIAL_AD_URL = 'https://vapid-size.com/dhm.FWzzduGLN/v/Z/GoUP/FeNm/9Yu/Z/Utl/kfPDTecj0/MATCci0/MBzcMGtfNCzcQ_x/Noz/QPz_NrwP';

interface RewardedAdsSectionProps {
  language: Language;
  theme?: ThemeMode;
  todayAdsCount?: number;
  todayWatchedCount?: number;
  maxDailyAds?: number;
  hasMatchesToday?: boolean;
  isPaused?: boolean;
  onStartWatchAd?: (videoNumber?: number) => void;
  onWatchAd?: (videoNumber?: number) => void;
  adUrl?: string;
}

export const RewardedAdsSection: React.FC<RewardedAdsSectionProps> = ({
  language,
  theme = 'light',
  todayAdsCount,
  todayWatchedCount,
  maxDailyAds = 3,
  hasMatchesToday = true,
  isPaused = true, // Temporarily paused per user request until match coins return
  onStartWatchAd,
  onWatchAd,
  adUrl = OFFICIAL_AD_URL,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  const effectiveWatchedCount = typeof todayWatchedCount === 'number' ? todayWatchedCount : (todayAdsCount || 0);
  const handleWatch = onWatchAd || onStartWatchAd || (() => {});
  const isAllWatched = effectiveWatchedCount >= maxDailyAds;
  const nextAdNumber = Math.min(maxDailyAds, effectiveWatchedCount + 1);

  const [liveAds, setLiveAds] = useState<VastAdItem[]>(DEFAULT_VAST_ADS);
  const [pausedNotice, setPausedNotice] = useState<boolean>(false);

  useEffect(() => {
    fetchLiveVastAds().then((ads) => {
      if (ads && ads.length > 0) {
        setLiveAds(ads);
      }
    }).catch(() => {});
  }, []);

  const triggerPausedNotice = () => {
    setPausedNotice(true);
    setTimeout(() => setPausedNotice(false), 4000);
  };

  const videoList = [
    { id: 1, titleAr: 'فيديو الإعلان الأول', titleEn: 'Ad Video 1', reward: 5 },
    { id: 2, titleAr: 'فيديو الإعلان الثاني', titleEn: 'Ad Video 2', reward: 5 },
    { id: 3, titleAr: 'فيديو الإعلان الثالث', titleEn: 'Ad Video 3', reward: 5 },
  ];

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`relative overflow-hidden rounded-3xl border p-4 sm:p-6 transition-all shadow-md mt-3 mb-2 ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-amber-500/25 text-white'
          : 'bg-gradient-to-br from-amber-50/50 via-white to-emerald-50/40 border-amber-200/80 text-slate-900 shadow-amber-500/5'
      }`}
    >
      {/* Background Ambience */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 relative z-1">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-1.5">
                <span>{isAr ? 'فيديوهات الإعلانات' : 'Rewarded Video Ads'}</span>
                <span className="text-base">🪙</span>
              </h3>
              {isPaused ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <PauseCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>{isAr ? 'متوقفة مؤقتاً' : 'Temporarily Paused'}</span>
                </span>
              ) : hasMatchesToday ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {isAr ? '3 فيديوهات يومياً' : '3 Videos Daily'}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-rose-500" />
                  <span>{isAr ? 'تعلا بكره مفيش مباريات اليوم' : 'Come back tomorrow, no matches today'}</span>
                </span>
              )}
            </div>
            {isPaused ? (
              <p className="text-[11px] font-semibold text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                {isAr
                  ? '⏸️ مشاهدة فيديوهات الإعلانات متوقفة مؤقتاً حالياً. سيتم إعادة تفعيلها ومكافآت الكوينز قريباً عند عودة كوينز المباريات.'
                  : '⏸️ Video ads are temporarily paused. They will be re-enabled soon when match coins return.'}
              </p>
            ) : hasMatchesToday ? (
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {isAr
                  ? 'شاهد الإعلان كاملاً (15 ثانية) داخل مشغل الفيديو لربح 5 كوينز فورية لكل فيديو - الحد الأقصى 3 إعلانات يومياً.'
                  : 'Watch the full video ad (15s) inside the player to earn 5 coins per video - up to 3 daily.'}
              </p>
            ) : (
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 leading-relaxed flex items-center gap-1">
                <span>{isAr ? '⚠️ غير متاحة اليوم: تعال بكره مفيش مباريات اليوم .. يتم تفعيل إعلانات الكوينز في أيام المباريات فقط.' : '⚠️ Unavailable today: Come back tomorrow, no matches today .. Coins ads activate on match days only.'}</span>
              </p>
            )}
          </div>
        </div>

        {/* Counter Badge */}
        <div className="shrink-0 text-center">
          {isPaused ? (
            <div className="px-2.5 sm:px-3 py-1.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30">
              <span className="font-black text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 block">
                {isAr ? 'متوقفة مؤقتاً' : 'Paused'}
              </span>
              <span className="block text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {isAr ? 'قريباً' : 'Soon'}
              </span>
            </div>
          ) : hasMatchesToday ? (
            <div className="px-3 py-1.5 rounded-2xl bg-slate-900/10 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700">
              <span className="font-mono font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                {effectiveWatchedCount}/{maxDailyAds}
              </span>
              <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-400">
                {isAr ? 'مكتمل اليوم' : 'Completed'}
              </span>
            </div>
          ) : (
            <div className="px-2.5 sm:px-3 py-1.5 rounded-2xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30">
              <span className="font-black text-[11px] sm:text-xs text-rose-600 dark:text-rose-400 block">
                {isAr ? 'مغلق' : 'Closed'}
              </span>
              <span className="block text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {isAr ? 'مفيش مباريات' : 'No Matches'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Notice when clicked while paused */}
      {pausedNotice && (
        <div className="mb-3.5 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-black flex items-center justify-center gap-2 animate-bounce shadow-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            {isAr
              ? '⏸️ مشاهدة فيديوهات الإعلانات متوقفة مؤقتاً حالياً - سيتم إعادة تفعيلها فور عودة كوينز المباريات!'
              : '⏸️ Video ads are temporarily paused - they will be re-enabled soon!'}
          </span>
        </div>
      )}

      {/* 3 Explicit Video Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5 relative z-1">
        {videoList.map((video) => {
          const isDone = effectiveWatchedCount >= video.id;
          const isCurrent = !isDone && effectiveWatchedCount === video.id - 1;
          const isLocked = !isDone && effectiveWatchedCount < video.id - 1;
          const adDetails = liveAds[(video.id - 1) % liveAds.length] || DEFAULT_VAST_ADS[(video.id - 1) % DEFAULT_VAST_ADS.length];

          return (
            <div
              key={video.id}
              onClick={() => {
                if (isPaused) {
                  triggerPausedNotice();
                  return;
                }
                if (!hasMatchesToday) {
                  triggerPausedNotice();
                  return;
                }
                if (isCurrent) {
                  handleWatch(video.id);
                }
              }}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all select-none ${
                isPaused
                  ? 'bg-slate-100/80 dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800 text-slate-500 cursor-pointer hover:border-amber-400/50'
                  : !hasMatchesToday
                  ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-65 cursor-not-allowed'
                  : isDone
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                  : isCurrent
                  ? (isDark ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/50 cursor-pointer hover:scale-[1.02]' : 'bg-amber-100/90 border-amber-400 text-amber-950 shadow-md ring-1 ring-amber-400/50 cursor-pointer hover:scale-[1.02]')
                  : (isDark ? 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60' : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60')
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    isPaused
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                      : !hasMatchesToday
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-400'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500'
                  }`}>
                    {isPaused ? <PauseCircle className="w-4 h-4" /> : !hasMatchesToday ? <Lock className="w-3.5 h-3.5" /> : isDone ? <CheckCircle2 className="w-4 h-4" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </div>
                  <div>
                    <span className="text-xs font-black block leading-tight">
                      {isAr ? video.titleAr : video.titleEn}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-0.5 mt-0.5">
                      <span>+{video.reward}</span>
                      <span>{isAr ? 'كوينز' : 'Coins'}</span>
                      <span>🪙</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const destUrl = adDetails?.clickThroughUrl || adUrl;
                    window.open(destUrl, '_blank', 'noopener,noreferrer');
                  }}
                  title={isAr ? 'زيارة صفحة المعلن' : 'Visit ad website'}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status or Play Button */}
              {isPaused ? (
                <div className="w-full py-2 px-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[11px] font-black flex items-center justify-center gap-1.5 border border-amber-400/30 select-none">
                  <PauseCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{isAr ? 'متوقفة مؤقتاً' : 'Temporarily Paused'}</span>
                </div>
              ) : !hasMatchesToday ? (
                <div className="w-full py-2 px-2.5 rounded-xl bg-slate-200/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 text-[10px] font-black flex items-center justify-center gap-1 border border-slate-300 dark:border-slate-700 select-none">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>{isAr ? 'تعلا بكره مفيش مباريات اليوم' : 'Come back tomorrow, no matches today'}</span>
                </div>
              ) : isDone ? (
                <div className="py-2 px-2.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isAr ? 'تم استلام 5 كوينز ✓' : '5 Coins Claimed ✓'}</span>
                </div>
              ) : isCurrent ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWatch(video.id);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white text-[11px] font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isAr ? 'بدء تشغيل الفيديو' : 'Play Video'}</span>
                </button>
              ) : (
                <div className="w-full py-2 px-2.5 rounded-xl bg-slate-200 dark:bg-slate-800/80 text-slate-500 dark:text-slate-500 text-[10px] font-bold flex items-center justify-center gap-1 select-none">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>{isAr ? 'قيد القفل (بعد السابق)' : 'Locked (After prev)'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Single CTA Action */}
      <div className="relative z-1 flex flex-col items-center gap-2.5">
        {isPaused ? (
          <div className="w-full space-y-2.5 text-center">
            <div className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border border-amber-400/30 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                <PauseCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{isAr ? 'مشاهدة الفيديوهات متوقفة مؤقتاً 🔒' : 'Video Ads Temporarily Paused 🔒'}</span>
              </div>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                {isAr
                  ? 'تم إيقاف فيديوهات الإعلانات مؤقتاً في الوقت الحالي. سيتم إعادة تفعيلها وتوزيع كوينز المشاهدة فور عودة كوينز المباريات!'
                  : 'Video ads are temporarily paused. They will be re-enabled along with match coins rewards soon!'}
              </p>
            </div>

            <button
              type="button"
              onClick={triggerPausedNotice}
              className="w-full py-3 px-5 rounded-2xl bg-amber-500/15 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-black text-xs sm:text-sm flex items-center justify-center gap-2 border border-amber-400/40 shadow-xs transition-all cursor-pointer active:scale-[0.99]"
            >
              <PauseCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{isAr ? 'الإعلانات متوقفة مؤقتاً (ستعود مع كوينز المباريات) 🔒' : 'Ads Paused (Returning soon with match coins) 🔒'}</span>
            </button>
          </div>
        ) : !hasMatchesToday ? (
          <div className="w-full space-y-2 text-center">
            <div className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-rose-500/15 border border-rose-500/30 text-rose-900 dark:text-rose-200 font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{isAr ? 'تعلا بكره مفيش مباريات اليوم ⚽' : 'Come back tomorrow, no matches today ⚽'}</span>
              </div>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                {isAr
                  ? 'مشاهدة إعلانات الكوينز متوقفة اليوم لعدم وجود مباريات. ننتظركم غداً لربح الكوينز والمشاركة في التوقعات!'
                  : 'Coin rewarded ads are unavailable today because there are no matches. See you tomorrow!'}
              </p>
            </div>

            <button
              type="button"
              onClick={triggerPausedNotice}
              className="w-full py-3 px-5 rounded-2xl bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-slate-300 dark:border-slate-700 select-none opacity-85"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>{isAr ? 'الإعلانات متوقفة (تعلا بكره مفيش مباريات اليوم)' : 'Ads Paused (No matches today)'}</span>
            </button>
          </div>
        ) : !isAllWatched ? (
          <>
            <button
              type="button"
              onClick={() => handleWatch(nextAdNumber)}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {isAr
                  ? `تشغيل فيديو الإعلان (${nextAdNumber} من 3) واربح 5 كوينز ⚡`
                  : `Play Ad Video (${nextAdNumber} of 3) & Earn 5 Coins ⚡`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                const currentAd = liveAds[(nextAdNumber - 1) % liveAds.length] || DEFAULT_VAST_ADS[0];
                window.open(currentAd.clickThroughUrl || adUrl, '_blank', 'noopener,noreferrer');
              }}
              className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 flex items-center gap-1 transition-colors pt-0.5 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{isAr ? 'زيارة صفحة الشريك الإعلاني المعتمد' : 'Visit Official Sponsor Page'}</span>
            </button>
          </>
        ) : (
          <div className="w-full space-y-2.5 text-center">
            <div className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>
                {isAr
                  ? '🎉 أحسنت! استنفدت الحد الأقصى اليومي (3 من 3 إعلانات) وحصلت على +15 كوينز بالكامل!'
                  : '🎉 Great job! You reached the daily limit of 3 ads and earned +15 coins!'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              {isAr
                ? '⏳ يتجدد عداد الإعلانات اليومية تلقائياً كل 24 ساعة (عند منتصف الليل) لربح 15 كوينز جديدة.'
                : '⏳ Daily ads reset every 24h at midnight for you to earn new coins.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
