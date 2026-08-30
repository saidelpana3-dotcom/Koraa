import React, { useState } from 'react';
import { 
  BellRing, 
  Database, 
  Volume2, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Smartphone, 
  Award,
  ChevronRight
} from 'lucide-react';
import { Language } from '../types';
import { requestPushPermissionAndToken, triggerNativeMobilePush } from '../lib/notifications';
import { db, doc, updateDoc } from '../lib/firebase';

interface FirstTimePermissionsModalProps {
  isOpen: boolean;
  onComplete: () => void;
  language: Language;
  userId?: string | null;
  userName?: string;
}

export const FirstTimePermissionsModal: React.FC<FirstTimePermissionsModalProps> = ({
  isOpen,
  onComplete,
  language,
  userId,
  userName
}) => {
  const isAr = language === 'ar';

  const [allowNotifications, setAllowNotifications] = useState(true);
  const [allowStorage, setAllowStorage] = useState(true);
  const [allowAudio, setAllowAudio] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [grantedPush, setGrantedPush] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleConfirmPermissions = async () => {
    setIsSubmitting(true);

    let pushGranted = false;

    // 1. Request Native Phone Push Notification Permission if selected
    if (allowNotifications) {
      try {
        const { granted } = await requestPushPermissionAndToken();
        pushGranted = granted;
        setGrantedPush(granted);
      } catch (err) {
        console.warn('Push permission request error:', err);
      }
    }

    // 2. Persist permissions in LocalStorage
    const storageKey = userId ? `kora_permissions_confirmed_${userId}` : 'kora_permissions_confirmed_guest';
    const permsPayload = {
      notifications: allowNotifications,
      pushGranted,
      storage: allowStorage,
      audio: allowAudio,
      agreedTerms: agreeTerms,
      confirmedAt: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(permsPayload));
    localStorage.setItem('kora_permissions_ever_confirmed', 'true');
    localStorage.setItem('kora_audio_enabled', allowAudio ? 'true' : 'false');

    // 3. Update User Document in Firestore if authenticated
    if (userId) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          permissionsConfirmed: true,
          permissions: permsPayload
        });
      } catch (e) {
        console.warn('Could not update permissions in user doc:', e);
      }
    }

    // 4. Trigger Welcome Push if granted
    if (pushGranted) {
      triggerNativeMobilePush({
        title: isAr ? '🎉 مرحباً بك في كورة!' : '🎉 Welcome to Kora!',
        body: isAr 
          ? 'تم تأكيد جميع الأذونات بنجاح. ستصلك إشعارات المباريات على هاتفك للتوقع وكسب الجوائز!'
          : 'Permissions confirmed! Match prediction alerts are now active on your phone.',
        tag: 'kora-onboarding-complete'
      });
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onComplete();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        dir={isAr ? 'rtl' : 'ltr'}
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto"
      >
        {/* Glow ambient effects */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Badge */}
        <div className="text-center space-y-2.5 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'خطوة الإعداد الأولى والتأكيد' : 'First-Time Setup & Permissions'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isAr 
              ? `أهلاً بك يا ${userName || 'كابتن'}! لنضبط أذوناتك ⚽` 
              : `Welcome ${userName || 'Captain'}! Let's set up permissions ⚽`}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {isAr
              ? 'يرجى تأكيد الأذونات التالية لضمان وصول إشعارات المباريات على هاتفك وحفظ نقاطك وتوقعاتك بأمان.'
              : 'Please confirm the following permissions to receive match alerts and safely store your prediction points.'}
          </p>
        </div>

        {/* Permissions List Cards */}
        <div className="space-y-3 mb-6">
          
          {/* 1. Mobile Push Notifications Permission Card */}
          <div 
            onClick={() => setAllowNotifications(!allowNotifications)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              allowNotifications
                ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                : 'bg-slate-800/40 border-slate-700/60 opacity-70'
            }`}
          >
            <div className={`p-2.5 rounded-xl flex-shrink-0 flex items-center justify-center ${
              allowNotifications ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              <Smartphone className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-white">
                    {isAr ? 'إشعارات الموبايل والمباريات' : 'Mobile Push Notifications'}
                  </h4>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {isAr ? 'موصى به' : 'Recommended'}
                  </span>
                </div>
                <input 
                  type="checkbox"
                  checked={allowNotifications}
                  onChange={(e) => setAllowNotifications(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {isAr
                  ? 'إشعارات قمة الغد، ويوم المباراة صباحاً، وتنبيه قبل انطلاق اللقاء مع زر «اتوقع الان» لكسب النقاط على شاشة القفل.'
                  : 'Receive matchday morning alerts, pre-match clash notices, and instant Predict Now buttons on your phone lock screen.'}
              </p>
            </div>
          </div>

          {/* 2. Local Storage & Cloud Sync Permission Card */}
          <div 
            onClick={() => setAllowStorage(!allowStorage)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              allowStorage
                ? 'bg-sky-950/40 border-sky-500/50 shadow-md shadow-sky-950/40'
                : 'bg-slate-800/40 border-slate-700/60 opacity-70'
            }`}
          >
            <div className={`p-2.5 rounded-xl flex-shrink-0 flex items-center justify-center ${
              allowStorage ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              <Database className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-white">
                  {isAr ? 'التخزين والمزامنة السحابية' : 'Local Storage & Cloud Sync'}
                </h4>
                <input 
                  type="checkbox"
                  checked={allowStorage}
                  onChange={(e) => setAllowStorage(e.target.checked)}
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {isAr
                  ? 'تخزين بياناتك، سجل توقعاتك، الكوينز، والفرق المفضلة محلياً وسحابياً لحمايتها من الضياع والعمل السريع بدون تقطيع.'
                  : 'Store predictions, coin wallet, favorite teams, and settings offline and in the cloud safely.'}
              </p>
            </div>
          </div>

          {/* 3. Audio & Stadium Chimes Permission Card */}
          <div 
            onClick={() => setAllowAudio(!allowAudio)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              allowAudio
                ? 'bg-teal-950/40 border-teal-500/50 shadow-md shadow-teal-950/40'
                : 'bg-slate-800/40 border-slate-700/60 opacity-70'
            }`}
          >
            <div className={`p-2.5 rounded-xl flex-shrink-0 flex items-center justify-center ${
              allowAudio ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              <Volume2 className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-white">
                  {isAr ? 'أصوات ونغمات الأهداف الحية' : 'Goal Chimes & Sound Effects'}
                </h4>
                <input 
                  type="checkbox"
                  checked={allowAudio}
                  onChange={(e) => setAllowAudio(e.target.checked)}
                  className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {isAr
                  ? 'تشغيل نغمة الملعب الحماسية وصافرة الحكم فور تسجيل أي هدف في المباريات المباشرة.'
                  : 'Play exciting stadium whistle and chime sounds whenever goals are scored.'}
              </p>
            </div>
          </div>

          {/* 4. Terms of Service & Fair Play Agreement */}
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center gap-2.5">
            <input 
              type="checkbox" 
              id="terms-check"
              checked={agreeTerms} 
              onChange={(e) => setAgreeTerms(e.target.checked)} 
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer flex-shrink-0"
            />
            <label htmlFor="terms-check" className="text-[11px] text-slate-300 cursor-pointer select-none">
              {isAr 
                ? 'أوافق على سياسة الخصوصية وشروط الاستخدام واللعب النظيف في توقعات كورة.'
                : 'I agree to the Privacy Policy, Terms of Service, and Fair Play guidelines.'}
            </label>
          </div>

        </div>

        {/* Confirm & Start Playing Button */}
        <div className="space-y-2">
          <button
            onClick={handleConfirmPermissions}
            disabled={isSubmitting || !agreeTerms}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin text-lg">⏳</span>
                <span>{isAr ? 'جاري تفعيل وتأكيد الأذونات...' : 'Activating Permissions...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>{isAr ? 'تأكيد الأذونات وبدء اللعب الآن 🚀' : 'Confirm Permissions & Start Playing 🚀'}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-slate-400">
            {isAr 
              ? 'يمكنك دائماً تعديل هذه الأذونات لاحقاً من مركز الإشعارات 🔔 والإعدادات'
              : 'You can change these permissions anytime in Settings & Notifications Center 🔔'}
          </p>
        </div>

      </div>
    </div>
  );
};
