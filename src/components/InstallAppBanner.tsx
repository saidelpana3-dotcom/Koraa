import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share, PlusSquare, ArrowDown, Sparkles, ExternalLink } from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { KORA_LOGO_BASE64 } from '../assets/logoBase64';

interface InstallAppBannerProps {
  language: Language;
  theme?: ThemeMode;
}

export const InstallAppBanner: React.FC<InstallAppBannerProps> = ({ language, theme = 'dark' }) => {
  const isAr = language === 'ar';
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [pwaMsg, setPwaMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [apkHelpNotice, setApkHelpNotice] = useState<boolean>(false);
  const [platformTab, setPlatformTab] = useState<'android' | 'ios'>('android');
  const [detectedPlatform, setDetectedPlatform] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    // Detect mobile OS environment
    const ua = window.navigator.userAgent || '';
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /Android/.test(ua);

    if (isIOSDevice) {
      setDetectedPlatform('ios');
      setPlatformTab('ios');
    } else if (isAndroidDevice) {
      setDetectedPlatform('android');
      setPlatformTab('android');
    } else {
      setDetectedPlatform('other');
      setPlatformTab('android');
    }

    // Check if already running in standalone PWA mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Catch PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPwaPrompt = e;
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      (window as any).deferredPwaPrompt = null;
      setIsStandalone(true);
    };

    // Listen for custom trigger event from Header or other buttons
    const handleTriggerCustom = () => {
      setIsDismissed(false);
      triggerDirectInstall();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('kora_trigger_pwa_install', handleTriggerCustom);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('kora_trigger_pwa_install', handleTriggerCustom);
    };
  }, []);

  const triggerDirectInstall = async () => {
    setIsDismissed(false);
    setShowGuideModal(true);

    // Try native PWA prompt if available
    const promptEvent = deferredPrompt || (window as any).deferredPwaPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setInstalledSuccess(true);
          setIsStandalone(true);
        }
        setDeferredPrompt(null);
        (window as any).deferredPwaPrompt = null;
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
    }
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleInstallClick = () => {
    triggerDirectInstall();
  };

  const handlePwaInstall = async () => {
    setPwaMsg(
      isAr
        ? '📲 إضافة إلى الشاشة الرئيسية: جاري طلب التثبيت! إذا لم تظهر النافذة المنبثقة التلقائية، افتح قائمة المتصفح (⋮) واضغط "إضافة إلى الشاشة الرئيسية"'
        : '📲 Add to Home Screen: Requesting installation! If auto prompt does not appear, open browser menu (⋮) and select "Add to Home Screen"'
    );

    const promptEvent = deferredPrompt || (window as any).deferredPwaPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setInstalledSuccess(true);
          setIsStandalone(true);
          setPwaMsg(
            isAr
              ? '✅ تم إضافة التطبيق بنجاح إلى الشاشة الرئيسية!'
              : '✅ App successfully added to Home Screen!'
          );
        }
        setDeferredPrompt(null);
        (window as any).deferredPwaPrompt = null;
      } catch (err) {
        console.error('PWA prompt error:', err);
      }
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        setPwaMsg(
          isAr
            ? '📲 إضافة إلى الشاشة الرئيسية (آيفون): اضغط زر المشاركة (Share 🔗) أسفل المتصفح ثم اختر "إضافة إلى الشاشة الرئيسية"'
            : '📲 Add to Home Screen (iOS): Tap Share button (🔗) in Safari then select "Add to Home Screen"'
        );
      }
    }
  };

  return (
    <>
      {/* Home Main Install Banner */}
      {!isStandalone && !isDismissed && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 p-3.5 sm:p-4 shadow-xl shadow-emerald-950/30 transition-all hover:border-emerald-500/60">
        {/* Glow background effects */}
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-right rtl:text-right ltr:text-left">
          {/* Left/Main info */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-900/50 shrink-0 overflow-hidden bg-slate-950 flex items-center justify-center">
              <img 
                src={KORA_LOGO_BASE64 || "/kora-logo.png"} 
                alt="كورة" 
                className="w-full h-full object-cover rounded-[14px]" 
                loading="eager"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-sm sm:text-base tracking-tight">
                  {isAr 
                    ? (detectedPlatform === 'ios' ? 'ثبت تطبيق كورة على آيفون 🍏' : detectedPlatform === 'android' ? 'ثبت تطبيق كورة على أندرويد 🤖' : 'ثبت تطبيق كورة على هاتفك 📱')
                    : (detectedPlatform === 'ios' ? 'Install Kora on iPhone 🍏' : detectedPlatform === 'android' ? 'Install Kora on Android 🤖' : 'Install Kora on Your Phone 📱')}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {isAr ? 'أندرويد وآيفون' : 'Android & iOS'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1 sm:line-clamp-none">
                {isAr
                  ? (detectedPlatform === 'ios' 
                      ? 'يعمل كتطبيق أصلي على آيفون وسفاري بملء الشاشة وسرعة فائقة'
                      : 'تطبيق سريع خفيف يدعم الإشعارات الفورية والتثبيت بنقرة واحدة')
                  : 'Fast install directly on Android and iPhone with fullscreen support'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-900/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-300"
            >
              <Download className="w-4 h-4 text-slate-950 animate-bounce" />
              <span>{isAr ? 'تثبيت التطبيق' : 'Install App'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              title={isAr ? 'إغلاق' : 'Close'}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Installation Guide Modal (For iOS & Android) */}
      {showGuideModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowGuideModal(false);
            }
          }}
        >
          <div 
            className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden text-right rtl:text-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shrink-0 overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img src={KORA_LOGO_BASE64 || "/kora-logo.png"} alt="كورة" className="w-full h-full object-cover rounded-[10px]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {isAr ? 'تثبيت تطبيق كورة على الهاتف' : 'Install Kora on Mobile'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr ? 'متوافق بالكامل مع هواتف أندرويد وآيفون' : 'Fully compatible with Android & iPhone'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGuideModal(false);
                }}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                title={isAr ? 'إغلاق (×)' : 'Close (×)'}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-600 active:bg-rose-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm shrink-0"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="pt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlatformTab('android')}
                className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  platformTab === 'android'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
              >
                <span>🤖</span>
                <span>{isAr ? 'أندرويد (Android)' : 'Android'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPlatformTab('ios')}
                className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  platformTab === 'ios'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
              >
                <span>🍏</span>
                <span>{isAr ? 'آيفون (iPhone / iOS)' : 'iPhone (iOS)'}</span>
              </button>
            </div>

            {/* Platform-Specific Body */}
            <div className="py-3.5 space-y-3.5 text-xs sm:text-sm text-slate-200">
              
              {/* ANDROID TAB */}
              {platformTab === 'android' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-white text-xs">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>{isAr ? 'تثبيت فوري على أجهزة أندرويد' : 'Instant Android Install'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Chrome / PWA ⚡
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePwaInstall}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs text-center shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <Smartphone className="w-4 h-4 text-slate-950" />
                      <span>{isAr ? 'اضغط هنا للتثبيت الفوري 📲' : 'Click Here for Instant Install 📲'}</span>
                    </button>

                    {pwaMsg && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold leading-relaxed animate-fadeIn">
                        {pwaMsg}
                      </div>
                    )}
                  </div>

                  {/* Manual Steps for Android */}
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <p className="font-bold text-slate-300 text-xs">
                      {isAr ? 'أو اتبع الخطوات اليدوية عبر متصفح Chrome:' : 'Or manually via Chrome browser:'}
                    </p>
                    <ol className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">1</span>
                        <span>{isAr ? 'افتح قائمة المتصفح بالضغط على زر الخيارات (⋮) أعلى اليمين.' : 'Tap the three-dots menu (⋮) in the top corner.'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">2</span>
                        <span>{isAr ? 'اختر "تثبيت التطبيق" (Install App) أو "إضافة إلى الشاشة الرئيسية".' : 'Select "Install App" or "Add to Home Screen".'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">3</span>
                        <span>{isAr ? 'اضغط "تثبيت" وستظهر أيقونة كورة الرسمية 🏆 على هاتفك فوراً.' : 'Tap "Install" to place the Kora app icon on your device.'}</span>
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {/* IOS TAB */}
              {platformTab === 'ios' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-white text-xs">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>{isAr ? 'طريقة التثبيت على آيفون وسفاري (iOS)' : 'Install on iPhone & Safari (iOS)'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Safari Ready 🍏
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isAr 
                        ? 'على هواتف آيفون يتيح متصفح Safari تثبيت كورة كتطبيق أصلي بملء الشاشة:'
                        : 'On iPhone, Safari allows installing Kora as a full-screen standalone app:'}
                    </p>

                    <ol className="space-y-2 text-xs text-slate-200">
                      <li className="flex items-start gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">1</span>
                        <div>
                          <span className="font-bold text-white">{isAr ? 'اضغط على زر المشاركة (Share):' : 'Tap the Share button:'}</span>
                          <span className="block text-slate-300 text-[11px] mt-0.5">
                            {isAr ? 'الأيقونة المربعة مع سهم للأعلى [ ⎋ ] أسفل شاشة Safari.' : 'The box icon with an arrow pointing up at the bottom of Safari.'}
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">2</span>
                        <div>
                          <span className="font-bold text-white">{isAr ? 'اختر "إضافة إلى الشاشة الرئيسية":' : 'Select "Add to Home Screen":'}</span>
                          <span className="block text-slate-300 text-[11px] mt-0.5">
                            {isAr ? 'مرر للأسفل في القائمة واضغط على [ ➕ إضافة إلى الصفحة الرئيسية ].' : 'Scroll down and tap [ ➕ Add to Home Screen ].'}
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">3</span>
                        <div>
                          <span className="font-bold text-white">{isAr ? 'اضغط على "إضافة" (Add):' : 'Tap "Add":'}</span>
                          <span className="block text-slate-300 text-[11px] mt-0.5">
                            {isAr ? 'في الزاوية العلوية، وسيفتح التطبيق من شاشتك بملء الشاشة وبدون شريط Safari.' : 'In the top corner. Kora will now open fullscreen without the URL bar.'}
                          </span>
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Open in new tab button */}
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs text-center border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'افتح التطبيق في نافذة مستقلة جديدة 🚀' : 'Open App in New Standalone Window 🚀'}</span>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer"
              >
                {isAr ? 'حسناً، فهمت' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for PWA Add to Home Screen */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirmModal(false);
            }
          }}
        >
          <div 
            className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center rtl:text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirmModal(false);
              }}
              aria-label={isAr ? 'إغلاق' : 'Close'}
              title={isAr ? 'إغلاق (×)' : 'Close (×)'}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-600 active:bg-rose-700 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>

            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-950/60 flex items-center justify-center mb-4 animate-bounce">
              <div className="w-full h-full bg-slate-950 rounded-[14px] overflow-hidden flex items-center justify-center">
                <img src={KORA_LOGO_BASE64 || "/kora-logo.png"} alt="كورة" className="w-full h-full object-cover rounded-[14px]" />
              </div>
            </div>

            <h3 className="text-lg font-black text-white mb-2 text-center">
              {isAr ? 'إضافة إلى الشاشة الرئيسية 📱' : 'Add to Home Screen 📱'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 mb-6 text-center leading-relaxed font-medium">
              {isAr
                ? 'هل تريد إضافة تطبيق كورة إلى الشاشة الرئيسية لجهازك لتصفح المباريات والنتائج فوراً بدون فتح المتصفح؟'
                : 'Do you want to add Kora App to your Home Screen for quick access?'}
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  handlePwaInstall();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{isAr ? 'إضافة إلى الشاشة الرئيسية' : 'Add to Home Screen'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white font-extrabold text-xs sm:text-sm border border-slate-700 flex items-center justify-center cursor-pointer transition-all active:scale-95"
              >
                <span>{isAr ? 'إلغاء' : 'Cancel'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
