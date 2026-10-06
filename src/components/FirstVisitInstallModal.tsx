import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  CheckCircle2, 
  Smartphone, 
  Sparkles, 
  Zap, 
  Bell, 
  Trophy,
  Share,
  PlusSquare,
  ChevronLeft
} from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { KORA_LOGO_BASE64 } from '../assets/logoBase64';

interface FirstVisitInstallModalProps {
  language: Language;
  theme?: ThemeMode;
}

export const FirstVisitInstallModal: React.FC<FirstVisitInstallModalProps> = ({
  language,
  theme = 'dark'
}) => {
  const isAr = language === 'ar';

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);
  const [installing, setInstalling] = useState<boolean>(false);

  useEffect(() => {
    // 1. Strictly check if running in standalone mode (already installed as PWA)
    // NEVER use document.referrer.includes('android-app://') as that matches any link from WhatsApp/Gmail/etc.
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) {
      return; // If already running as an installed PWA on the phone, never show install prompt
    }

    // 2. Detect platform
    const ua = window.navigator.userAgent || '';
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /Android/.test(ua);
    const detected = isIOSDevice ? 'ios' : isAndroidDevice ? 'android' : 'other';
    setPlatform(detected);

    // 3. Capture deferred install prompt
    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPwaPrompt = e;
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setInstalledSuccess(true);
      localStorage.setItem('kora_install_prompt_responded', 'installed');
      localStorage.removeItem('kora_show_install_after_logout');
      setTimeout(() => {
        setIsOpen(false);
      }, 1800);
    };

    // Open prompt on custom trigger
    const handleTriggerPrompt = () => {
      setShowGuide(false);
      setIsOpen(true);
    };

    // When user logs out, prepare for re-entry prompt
    const handleUserLogout = () => {
      localStorage.removeItem('kora_install_prompt_responded');
      localStorage.removeItem('kora_first_visit_install_prompt_responded');
      localStorage.setItem('kora_show_install_after_logout', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('kora_trigger_pwa_install', handleTriggerPrompt);
    window.addEventListener('kora_show_first_visit_install_prompt', handleTriggerPrompt);
    window.addEventListener('kora_user_signed_out', handleUserLogout);

    // Development console testing helper
    (window as any).showKoraInstallPrompt = () => {
      localStorage.removeItem('kora_install_prompt_responded');
      localStorage.removeItem('kora_show_install_after_logout');
      setShowGuide(false);
      setIsOpen(true);
    };

    // 4. Determine if we should display the install prompt automatically
    // Condition A: User has logged out previously and entered again ('kora_show_install_after_logout' === 'true')
    // Condition B: First-time visitor who hasn't responded yet
    const hasResponded = localStorage.getItem('kora_install_prompt_responded') || localStorage.getItem('kora_first_visit_install_prompt_responded');
    const showAfterLogout = localStorage.getItem('kora_show_install_after_logout') === 'true';

    if (!hasResponded || showAfterLogout) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('kora_trigger_pwa_install', handleTriggerPrompt);
        window.removeEventListener('kora_show_first_visit_install_prompt', handleTriggerPrompt);
        window.removeEventListener('kora_user_signed_out', handleUserLogout);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('kora_trigger_pwa_install', handleTriggerPrompt);
      window.removeEventListener('kora_show_first_visit_install_prompt', handleTriggerPrompt);
      window.removeEventListener('kora_user_signed_out', handleUserLogout);
    };
  }, []);

  // When user clicks "تثبيت التطبيق" (Install)
  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPwaPrompt;

    if (promptEvent) {
      try {
        setInstalling(true);
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setInstalledSuccess(true);
          localStorage.setItem('kora_install_prompt_responded', 'installed');
          localStorage.removeItem('kora_show_install_after_logout');
          setTimeout(() => {
            setIsOpen(false);
          }, 1800);
          return;
        } else {
          // User dismissed in native prompt
          localStorage.setItem('kora_install_prompt_responded', 'cancelled');
          localStorage.removeItem('kora_show_install_after_logout');
          setIsOpen(false);
          return;
        }
      } catch (err) {
        console.warn('Native PWA install prompt error:', err);
      } finally {
        setInstalling(false);
      }
    }

    // If native prompt isn't supported directly (e.g. iOS Safari) or hasn't fired yet
    setShowGuide(true);
  };

  // When user clicks "إلغاء" (Cancel / خلاص)
  const handleCancelClick = () => {
    localStorage.setItem('kora_install_prompt_responded', 'cancelled');
    localStorage.setItem('kora_first_visit_install_prompt_responded', 'cancelled');
    localStorage.removeItem('kora_show_install_after_logout');
    setIsOpen(false);
  };

  if (!isOpen || isStandalone) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={handleCancelClick}
    >
      <div 
        className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-5 shadow-2xl shadow-emerald-950/80 relative overflow-hidden text-right rtl:text-right transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient effects */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Top Close Button (Counts as Cancel) */}
        <button
          type="button"
          onClick={handleCancelClick}
          aria-label={isAr ? 'إلغاء' : 'Cancel'}
          title={isAr ? 'إلغاء' : 'Cancel'}
          className="absolute top-3.5 left-3.5 rtl:left-3.5 ltr:right-3.5 w-7 h-7 rounded-full bg-slate-800/80 hover:bg-rose-600 active:bg-rose-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>

        {/* State 1: Success message upon install */}
        {installedSuccess ? (
          <div className="py-4 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-white">
              {isAr ? '✅ تم تثبيت التطبيق بنجاح!' : '✅ App Installed Successfully!'}
            </h3>
            <p className="text-xs text-slate-300">
              {isAr 
                ? 'ستجد أيقونة تطبيق كورة الآن على شاشة هاتفك الرئيسية.' 
                : 'Kora app icon is now on your home screen.'}
            </p>
          </div>
        ) : showGuide ? (
          /* State 2: Immediate quick action guide (for iOS Safari or browsers without auto-prompt) */
          <div className="space-y-3 py-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shrink-0 bg-slate-950 overflow-hidden flex items-center justify-center">
                <img 
                  src={KORA_LOGO_BASE64 || "/kora-logo.png"} 
                  alt="كورة" 
                  className="w-full h-full object-cover rounded-[14px]" 
                />
              </div>
              <div>
                <h4 className="font-black text-white text-sm">
                  {platform === 'ios'
                    ? (isAr ? 'التثبيت على آيفون (Safari)' : 'Install on iPhone (Safari)')
                    : (isAr ? 'تثبيت التطبيق على هاتفك' : 'Install App on Phone')}
                </h4>
                <p className="text-[11px] text-emerald-400 font-semibold">
                  {isAr ? 'خطوات سريعة للإضافة للشاشة الرئيسية:' : 'Quick steps to add to home screen:'}
                </p>
              </div>
            </div>

            {platform === 'ios' ? (
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs text-slate-200">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <span>{isAr ? 'اضغط زر المشاركة (Share ⎋) أسفل شاشة Safari.' : 'Tap Share button (⎋) at the bottom of Safari.'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <span>{isAr ? 'مرر للأسفل واختر "إضافة إلى الصفحة الرئيسية" ➕' : 'Scroll down and tap "Add to Home Screen" ➕'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  <span>{isAr ? 'اضغط "إضافة" وسيفتح كتطبيق كامل بملء الشاشة.' : 'Tap "Add" and Kora will open as a native app.'}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs text-slate-200">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <span>{isAr ? 'افتح قائمة المتصفح (⋮) أعلى يمين الشاشة.' : 'Open browser menu (⋮) at top right.'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <span>{isAr ? 'اضغط "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".' : 'Select "Install App" or "Add to Home Screen".'}</span>
                </div>
              </div>
            )}

            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('kora_install_prompt_responded', 'guided');
                  localStorage.removeItem('kora_show_install_after_logout');
                  setIsOpen(false);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs text-center shadow-md cursor-pointer transition-all active:scale-95"
              >
                {isAr ? 'حسناً، فهمت' : 'Got it'}
              </button>
              <button
                type="button"
                onClick={handleCancelClick}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          /* State 3: Clean, direct Install Screen Message */
          <div className="space-y-3.5">
            {/* Header with App Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 p-0.5 shadow-lg shadow-emerald-950/60 shrink-0 bg-slate-950 overflow-hidden flex items-center justify-center">
                <img 
                  src={KORA_LOGO_BASE64 || "/kora-logo.png"} 
                  alt="كورة" 
                  className="w-full h-full object-cover rounded-[14px]" 
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                    {isAr ? 'تثبيت تطبيق كورة على الهاتف 📱' : 'Install Kora App on Mobile 📱'}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                  {isAr 
                    ? 'تصفح أسرع وإشعارات حية للمباريات وتوقع النتائج بدون فتح المتصفح!' 
                    : 'Faster browsing, live match alerts & predictions without opening browser!'}
                </p>
              </div>
            </div>

            {/* Quick Benefits Pills */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold text-slate-300">
              <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'فتح فوري' : 'Instant Open'}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-teal-400" />
                <span>{isAr ? 'إشعارات الأهداف' : 'Live Alerts'}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'جوائز وتوقعات' : 'Rewards'}</span>
              </div>
            </div>

            {/* Action Buttons: [تثبيت] و [إلغاء خلاص] */}
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border border-emerald-300"
              >
                <Download className="w-4 h-4 text-slate-950 animate-bounce shrink-0" />
                <span>
                  {installing 
                    ? (isAr ? 'جاري التثبيت...' : 'Installing...') 
                    : (isAr ? 'تثبيت التطبيق' : 'Install App')}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCancelClick}
                className="py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs sm:text-sm border border-slate-700/60 transition-colors cursor-pointer active:scale-95"
              >
                <span>{isAr ? 'إلغاء' : 'Cancel'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
