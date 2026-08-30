import React, { useState, useEffect } from 'react';
import { BellRing, Smartphone, X, CheckCircle2, Flame } from 'lucide-react';
import { Language } from '../types';
import { requestPushPermissionAndToken } from '../lib/notifications';

interface MobileNotificationPromptProps {
  language: Language;
}

export const MobileNotificationPrompt: React.FC<MobileNotificationPromptProps> = ({ language }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isAr = language === 'ar';

  useEffect(() => {
    // Check if browser supports notifications
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // If already granted or dismissed in this session
    if (Notification.permission === 'granted') {
      return;
    }

    const dismissed = sessionStorage.getItem('kora_mobile_notif_prompt_dismissed');
    if (dismissed) return;

    // Show after 2.5 seconds on load so user gets oriented first
    const timer = setTimeout(() => {
      if (Notification.permission !== 'granted') {
        setShowPrompt(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleEnablePush = async () => {
    setIsActivating(true);
    try {
      const { granted } = await requestPushPermissionAndToken();
      if (granted) {
        setIsSuccess(true);
        setTimeout(() => {
          setShowPrompt(false);
        }, 3000);
      } else {
        setShowPrompt(false);
      }
    } catch (err) {
      console.warn('Push request error:', err);
      setShowPrompt(false);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('kora_mobile_notif_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-slate-100 relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 left-3 rtl:left-3 rtl:right-auto text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          title={isAr ? 'إغلاق (×)' : 'Close (×)'}
          aria-label={isAr ? 'إغلاق' : 'Close'}
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>

        {isSuccess ? (
          <div className="flex items-center gap-3 py-1 text-emerald-400">
            <CheckCircle2 className="w-7 h-7 flex-shrink-0 animate-bounce" />
            <div>
              <h4 className="font-bold text-sm text-emerald-300">
                {isAr ? '🎉 تم تفعيل إشعارات الهاتف بنجاح!' : '🎉 Mobile Notifications Enabled!'}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr
                  ? 'ستصلك إشعارات المباريات على هاتفك قبل الماتش بيوم ويوم الماتش مع زر اتوقع الان 🎯'
                  : 'You will receive phone notifications before matches with Predict Now CTA!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex-shrink-0 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="pr-6 rtl:pr-0 rtl:pl-6">
                <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                  <span>{isAr ? 'تفعيل إشعارات الموبايل' : 'Enable Mobile Notifications'}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {isAr ? 'مهم' : 'Important'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {isAr
                    ? 'لتصلك تنبيهات قمة الغد وقمة اليوم قبل الماتش مباشرة على هاتفك المحمول 📱 مع زر «اتوقع الان» لكسب النقاط!'
                    : 'Get phone push alerts before matches with the Predict Now button on your lock screen!'}
                </p>
              </div>
            </div>

            {/* Notification Schedule Preview Badges */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-1.5 text-center">
                <div className="text-amber-400 font-bold text-[10px]">{isAr ? 'قبل بيوم' : '1 Day Before'}</div>
                <div className="text-slate-400 text-[9px] mt-0.5">{isAr ? 'قمة الغد' : 'Match Preview'}</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-1.5 text-center">
                <div className="text-sky-400 font-bold text-[10px]">{isAr ? 'يوم الماتش' : 'Match Day'}</div>
                <div className="text-slate-400 text-[9px] mt-0.5">{isAr ? 'صباحاً' : 'Morning alert'}</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-1.5 text-center">
                <div className="text-emerald-400 font-bold text-[10px]">{isAr ? 'قبل الانطلاق' : 'Pre-Kickoff'}</div>
                <div className="text-slate-400 text-[9px] mt-0.5">{isAr ? 'اتوقع الان 🎯' : 'Predict CTA'}</div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleEnablePush}
                disabled={isActivating}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>{isActivating ? (isAr ? 'جاري التفعيل...' : 'Activating...') : (isAr ? 'تفعيل إشعارات الهاتف 📱' : 'Enable Mobile Push 📱')}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {isAr ? 'لاحقاً' : 'Later'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
