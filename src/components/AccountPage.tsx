import React, { useState, useEffect } from 'react';
import { Language, PrizeClaim, Match, ThemeMode } from '../types';
import { getNumericUserId } from '../utils/userId';
import { KORA_LOGO_BASE64 } from '../assets/logoBase64';
import { 
  db, 
  auth, 
  signOut,
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  setDoc,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  LogIn, 
  LogOut, 
  History, 
  Wallet, 
  ShieldCheck, 
  Sparkles,
  Target,
  Save,
  CreditCard,
  Smartphone,
  Globe,
  ChevronLeft,
  ArrowRight,
  FileText,
  Scale,
  Copy,
  Fingerprint,
  Check,
  MessageCircle,
  UserPlus,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  Palette,
  X
} from 'lucide-react';
import { TeamLogo } from './TeamLogo';
import { InstallAppBanner } from './InstallAppBanner';
import { LatestUpdatesPage } from './LatestUpdatesPage';

interface AccountPageProps {
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  setTheme?: (theme: ThemeMode) => void;
  userPoints: number;
  setUserPoints: React.Dispatch<React.SetStateAction<number>>;
  user: any;
  onSignIn: () => Promise<void>;
  userPredictions?: Record<string, { predictedHomeScore: number; predictedAwayScore: number }>;
  matches?: Match[];
  onOpenDetails?: (match: Match, tab?: 'lineup' | 'stats' | 'events' | 'ai' | 'predict') => void;
  onInstallApp?: () => void;
  initialSubTab?: AccountSubTab;
  highlightMatchId?: string;
  onOpenCoinsBreakdown?: () => void;
  onClose?: () => void;
}

interface UserPredictionRecord {
  id: string;
  userId?: string;
  matchId?: string;
  matchHomeTeam: string;
  matchHomeTeamAr: string;
  matchAwayTeam: string;
  matchAwayTeamAr: string;
  matchHomeScore?: number;
  matchAwayScore?: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  status: 'PENDING' | 'EXACT_WIN' | 'OUTCOME_WIN' | 'LOST' | 'EXACT_SCORE' | 'MISSED';
  pointsEarned: number;
  coinsEarned?: number;
  createdAt: string;
}

export type AccountSubTab = 'main' | 'updates' | 'predictions' | 'claims' | 'payout' | 'support' | 'social' | 'legal';

export const AccountPage: React.FC<AccountPageProps> = ({
  language,
  onLanguageChange,
  theme = 'light',
  onToggleTheme,
  setTheme,
  userPoints,
  user,
  onSignIn,
  userPredictions,
  matches,
  onOpenDetails,
  onInstallApp,
  initialSubTab,
  highlightMatchId,
  onOpenCoinsBreakdown,
  onClose,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  const [activeSubTab, setActiveSubTab] = useState<AccountSubTab>(initialSubTab || 'main');
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms'>('privacy');
  const [predictionsList, setPredictionsList] = useState<UserPredictionRecord[]>([]);
  const [claimsList, setClaimsList] = useState<PrizeClaim[]>([]);
  const [, setLoadingHistory] = useState<boolean>(false);

  // Sync subtab if initialSubTab or highlightMatchId changes
  useEffect(() => {
    if (highlightMatchId) {
      setActiveSubTab('predictions');
    } else if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab, highlightMatchId]);

  // Auto-scroll to highlighted match card in predictions subtab
  useEffect(() => {
    if (activeSubTab === 'predictions' && highlightMatchId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`pred-card-${highlightMatchId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeSubTab, highlightMatchId]);

  // Pin to Home Screen State & Handler
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinSuccessMsg, setPinSuccessMsg] = useState<string | null>(null);

  // Push Notification State
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    return localStorage.getItem('kora_push_notifications_enabled') === 'true';
  });
  const [, setPushStatusMsg] = useState<string | null>(null);

  const handleTogglePushNotifications = async () => {
    if (pushEnabled) {
      setPushEnabled(false);
      localStorage.setItem('kora_push_notifications_enabled', 'false');
      setPushStatusMsg(isAr ? 'تم إيقاف الإشعارات الفورية' : 'Push notifications disabled');
      setTimeout(() => setPushStatusMsg(null), 3000);
      return;
    }

    if (!('Notification' in window)) {
      setPushStatusMsg(isAr ? 'المتصفح الحالي لا يدعم الإشعارات الفورية' : 'Browser does not support desktop notifications');
      setTimeout(() => setPushStatusMsg(null), 4000);
      return;
    }

    try {
      let perm = Notification.permission;
      if (perm !== 'granted' && perm !== 'denied') {
        perm = await Notification.requestPermission();
      }

      if (perm === 'granted') {
        setPushEnabled(true);
        localStorage.setItem('kora_push_notifications_enabled', 'true');
        setPushStatusMsg(isAr ? 'تم تفعيل إشعارات الأهداف والمباريات المباشرة بنجاح! 🔔⚽' : 'Push notifications for goals and live matches enabled! 🔔⚽');
        
        try {
          new Notification(isAr ? 'تطبيق كورة ⚽' : 'Kora App ⚽', {
            body: isAr ? 'أهلاً بك! ستصلك إشعارات فورية عند تسجيل الأهداف وبدء المباريات.' : 'Welcome! You will receive instant notifications for goals and match kickoffs.',
            icon: 'https://crests.football-data.org/66.png'
          });
        } catch (e) {
          console.log('Notification test error:', e);
        }
        setTimeout(() => setPushStatusMsg(null), 4000);
      } else {
        setPushEnabled(false);
        localStorage.setItem('kora_push_notifications_enabled', 'false');
        setPushStatusMsg(isAr ? 'يرجى السماح بالإشعارات من إعدادات المتصفح' : 'Please allow notifications in browser settings');
        setTimeout(() => setPushStatusMsg(null), 4000);
      }
    } catch (err) {
      console.error('Push notification error:', err);
    }
  };

  const handlePinApp = async () => {
    if (onInstallApp) {
      onInstallApp();
    }
    // @ts-ignore
    const promptEvent = window.deferredPwaPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setPinSuccessMsg(isAr ? 'تمت إضافة تطبيق كورة إلى شاشتك الرئيسية بنجاح! 📱' : 'Kora app pinned to home screen! 📱');
          // @ts-ignore
          window.deferredPwaPrompt = null;
        } else {
          setShowPinModal(true);
        }
      } catch (err) {
        setShowPinModal(true);
      }
    } else {
      setShowPinModal(true);
    }
  };

  useEffect(() => {
    const triggerHandler = () => {
      handlePinApp();
    };
    window.addEventListener('pwa_install_trigger', triggerHandler);
    window.addEventListener('kora_trigger_pwa_install', triggerHandler);
    return () => {
      window.removeEventListener('pwa_install_trigger', triggerHandler);
      window.removeEventListener('kora_trigger_pwa_install', triggerHandler);
    };
  }, []);

  // Cash Payout Form State
  const [fullName, setFullName] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<'INSTAPAY' | 'VODAFONE_CASH' | 'ETISALAT_CASH' | 'ORANGE_CASH' | 'WE_PAY' | 'BANK_TRANSFER'>('INSTAPAY');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [savingPayout, setSavingPayout] = useState<boolean>(false);
  const [payoutSaved, setPayoutSaved] = useState<boolean>(false);

  // User ID & Copy State
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [guestId] = useState<string>(() => {
    let saved = localStorage.getItem('kora_guest_id');
    if (!saved || !/^\d+$/.test(saved)) {
      saved = Math.floor(10000000 + Math.random() * 90000000).toString();
      localStorage.setItem('kora_guest_id', saved);
    }
    return saved;
  });

  const formattedUserId = user ? getNumericUserId(user.uid) : guestId;

  const handleCopyUserId = () => {
    const textToCopy = formattedUserId;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  // Load saved payout profile and account data on user change with Strict Isolation
  useEffect(() => {
    if (!user) {
      setFullName('');
      setPayoutMethod('INSTAPAY');
      setAccountNumber('');
      setPayoutSaved(false);
      setPredictionsList([]);
      setClaimsList([]);
      return;
    }

    const userKey = user.uid;
    const profileStorageKey = `kora_payout_profile_${userKey}`;
    const claimsStorageKey = `kora_my_claims_${userKey}`;
    const predsStorageKey = `kora_my_predictions_${userKey}`;

    const loadPayoutFromStorage = () => {
      const localProfile = localStorage.getItem(profileStorageKey);
      if (localProfile) {
        try {
          const parsed = JSON.parse(localProfile);
          if (parsed.fullName) setFullName(parsed.fullName);
          if (parsed.payoutMethod) setPayoutMethod(parsed.payoutMethod);
          if (parsed.accountNumber) setAccountNumber(parsed.accountNumber);
          if (parsed.fullName && parsed.accountNumber) setPayoutSaved(true);
        } catch (_) {}
      } else {
        setFullName('');
        setPayoutMethod('INSTAPAY');
        setAccountNumber('');
        setPayoutSaved(false);
      }
    };

    // Load claims from local storage strictly for this user
    const loadLocalClaims = () => {
      const localClaimsRaw = localStorage.getItem(claimsStorageKey);
      if (localClaimsRaw) {
        try {
          const parsed = JSON.parse(localClaimsRaw);
          if (Array.isArray(parsed)) {
            setClaimsList(parsed);
          }
        } catch (_) {}
      } else {
        setClaimsList([]);
      }
    };

    // Load predictions from local storage strictly for this user
    const loadLocalPredictions = () => {
      const saved = localStorage.getItem(predsStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setPredictionsList(parsed);
          }
        } catch (_) {}
      } else {
        setPredictionsList([]);
      }
    };

    setFullName('');
    setPayoutMethod('INSTAPAY');
    setAccountNumber('');
    setPayoutSaved(false);
    setPredictionsList([]);
    setClaimsList([]);

    loadPayoutFromStorage();
    loadLocalClaims();
    loadLocalPredictions();

    // Listen for cross-page profile updates (e.g. from Prizes page)
    const handleProfileUpdate = () => {
      loadPayoutFromStorage();
      loadLocalClaims();
      loadLocalPredictions();
    };
    window.addEventListener('kora_payout_profile_updated', handleProfileUpdate);

    if (!user) {
      return () => {
        window.removeEventListener('kora_payout_profile_updated', handleProfileUpdate);
      };
    }

    const fetchUserHistory = async () => {
      setLoadingHistory(true);
      try {
        const profileRef = doc(db, 'userPaymentProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setFullName(data.fullName || '');
          setPayoutMethod(data.payoutMethod || 'INSTAPAY');
          setAccountNumber(data.accountNumber || '');
          if (data.fullName && data.accountNumber) {
            setPayoutSaved(true);
          }
        }

        const qPred = query(
          collection(db, 'predictions'),
          where('userId', '==', user.uid)
        );
        const predSnap = await getDocs(qPred);
        const predsMap = new Map<string, UserPredictionRecord>();

        // Include existing local predictions strictly for this user
        const saved = localStorage.getItem(predsStorageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              parsed.forEach((item: UserPredictionRecord) => {
                const matchKey = item.matchId || (typeof item.id === 'string' && item.id.startsWith('pred_') ? item.id.split('_').slice(2).join('_') : item.id);
                if (matchKey) predsMap.set(matchKey, item);
              });
            }
          } catch (_) {}
        }

        predSnap.forEach((d) => {
          const item = { id: d.id, ...d.data() } as UserPredictionRecord;
          const matchKey = item.matchId || (typeof item.id === 'string' && item.id.startsWith('pred_') ? item.id.split('_').slice(2).join('_') : item.id);
          if (matchKey) {
            const existing = predsMap.get(matchKey);
            if (!existing || !existing.createdAt || !item.createdAt || new Date(item.createdAt) >= new Date(existing.createdAt)) {
              predsMap.set(matchKey, item);
            }
          }
        });
        const preds = Array.from(predsMap.values());
        setPredictionsList(preds);
        localStorage.setItem(predsStorageKey, JSON.stringify(preds));

        const qClaims = query(
          collection(db, 'prizeClaims'),
          where('userId', '==', user.uid)
        );
        const claimSnap = await getDocs(qClaims);
        const claims: PrizeClaim[] = [];
        claimSnap.forEach((d) => {
          claims.push({ id: d.id, ...d.data() } as PrizeClaim);
        });
        setClaimsList(claims);
        localStorage.setItem(claimsStorageKey, JSON.stringify(claims));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'userPaymentProfiles');
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchUserHistory();

    return () => {
      window.removeEventListener('kora_payout_profile_updated', handleProfileUpdate);
    };
  }, [user]);

  const handleSavePayoutProfile = async () => {
    if (!fullName.trim() || !accountNumber.trim()) {
      alert(isAr ? 'يرجى كتابة الاسم ورقم المحفظة / حساب إنستاباي بدقة' : 'Please enter full recipient name and wallet / InstaPay handle');
      return;
    }

    setSavingPayout(true);
    const profilePayload = {
      fullName: fullName.trim(),
      payoutMethod,
      accountNumber: accountNumber.trim(),
      updatedAt: new Date().toISOString(),
    };

    const userKey = user ? user.uid : 'guest';
    const profileStorageKey = `kora_payout_profile_${userKey}`;

    try {
      localStorage.setItem(profileStorageKey, JSON.stringify(profilePayload));
      window.dispatchEvent(new Event('kora_payout_profile_updated'));

      if (user) {
        const profileRef = doc(db, 'userPaymentProfiles', user.uid);
        await setDoc(profileRef, {
          ...profilePayload,
          userId: user.uid,
          userEmail: user.email || '',
        }, { merge: true });
      }

      setPayoutSaved(true);
      alert(isAr ? 'تم حفظ بيانات استلام الكاش بنجاح! ⚡' : 'Cash payout profile saved successfully! ⚡');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'userPaymentProfiles');
      alert(isAr ? 'حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى' : 'Failed to save payout profile, please retry');
    } finally {
      setSavingPayout(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const getPayoutLabel = (method: string) => {
    switch (method) {
      case 'INSTAPAY': return 'إنستاباي InstaPay';
      case 'VODAFONE_CASH': return 'فودافون كاش';
      case 'ETISALAT_CASH': return 'اتصالات كاش';
      case 'ORANGE_CASH': return 'أورنج كاش';
      case 'WE_PAY': return 'وي باي WE Pay';
      case 'BANK_TRANSFER': return 'تحويل بنكي / حساب IBAN';
      default: return 'المحفظة الإلكترونية';
    }
  };

  const getAccountFieldPlaceholder = () => {
    if (payoutMethod === 'INSTAPAY') return isAr ? 'مثال: username@instapay أو رقم الهاتف المسجل' : 'e.g. username@instapay or phone';
    if (payoutMethod === 'BANK_TRANSFER') return isAr ? 'أدخل رقم الحساب أو الآيبان IBAN البنكي' : 'Enter Bank Account / IBAN';
    return isAr ? 'أدخل رقم محفظة الهاتف المحمول (مثال: 010xxxxxxxx)' : 'Enter 11-digit mobile wallet number';
  };

  const renderSubPageHeader = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    badgeText?: string,
    badgeColor?: string
  ) => (
    <div className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-sm transition-colors ${
      isDark
        ? 'bg-slate-900/90 border-slate-800 text-white'
        : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${
          isDark
            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        }`}>
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-extrabold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
            {badgeText && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor || (isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 border-emerald-300')}`}>
                {badgeText}
              </span>
            )}
          </div>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setActiveSubTab('main')}
          aria-label={isAr ? 'إغلاق والرجوع' : 'Close & Return'}
          title={isAr ? 'إغلاق والرجوع (×)' : 'Close & Return (×)'}
          className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 active:bg-rose-700 text-white font-black text-xs shadow-md transition-all cursor-pointer border border-rose-400/50 flex items-center gap-1.5 active:scale-95 ring-1 ring-white/20"
        >
          <X className="w-4 h-4 text-white" strokeWidth={3} />
          <span>{isAr ? 'إغلاق (×)' : 'Close (×)'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3.5 max-w-4xl mx-auto pb-20">
      {/* 1. MAIN ACCOUNT DASHBOARD & SERVICES HUB */}
      {activeSubTab === 'main' && (
        <div className="space-y-3.5">
          {onClose && (
            <div className="flex items-center justify-end px-1">
              <button
                type="button"
                onClick={onClose}
                aria-label={isAr ? 'إغلاق والرجوع للصفحة السابقة' : 'Close & Go Back'}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-sm transition-all cursor-pointer active:scale-95 border border-rose-400/50"
              >
                <span>✕</span>
                <span>{isAr ? 'إغلاق والرجوع (×)' : 'Close & Back (×)'}</span>
              </button>
            </div>
          )}

          {/* TOP THEME TOGGLE & DISPLAY MODE HERO CARD (طلب المستخدم الصريح: زرار في الأعلى يخليها في الوضع الكلاسيكي الداكن أو الأبيض الرسمي) */}
          <div className={`rounded-2xl border-2 p-3.5 sm:p-4 shadow-sm relative overflow-hidden transition-all ${
            isDark
              ? 'bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-amber-500/40 text-white'
              : 'bg-white border-emerald-500/40 text-slate-900 shadow-md'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm shrink-0 border ${
                  isDark ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  {isDark ? '🌙' : '☀️'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30">
                      {isAr ? 'مظهر المنصة والتصميم' : 'Platform Theme'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isDark
                        ? 'bg-slate-800 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold'
                    }`}>
                      {isDark ? (isAr ? 'الوضع الكلاسيكي الداكن 🌙' : 'Classic Dark Mode 🌙') : (isAr ? 'الوضع الأبيض الرسمي ☀️' : 'Official White Mode ☀️')}
                    </span>
                  </div>
                  <h3 className={`text-base font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isAr ? 'التبديل بين الوضع الأبيض الرسمي والوضع الكلاسيكي' : 'Switch between Official White & Classic Dark'}
                  </h3>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {isAr ? 'الوضع الافتراضي الأبيض عالي التباين والوضوح لكل تفصيلة، أو الوضع الكلاسيكي الداكن.' : 'Official White for crisp contrast & high clarity, or Classic dark mode.'}
                  </p>
                </div>
              </div>

              {/* Theme Buttons Group */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={() => setTheme?.('light')}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border shadow-sm ${
                    !isDark
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-300" />
                  <span>{isAr ? 'الأبيض الرسمي (الافتراضي)' : 'Official White'}</span>
                  {!isDark && <Check className="w-3.5 h-3.5 text-white" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme?.('dark')}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border shadow-sm ${
                    isDark
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/40 font-black'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4 text-slate-950 dark:text-slate-950" />
                  <span>{isAr ? 'الوضع الكلاسيكي الداكن' : 'Classic Dark'}</span>
                  {isDark && <Check className="w-3.5 h-3.5 text-slate-950" />}
                </button>
              </div>
            </div>
          </div>

          {/* Account Profile Header Card */}
          <div className={`border-2 rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden transition-all ${
            isDark
              ? 'bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950 border-emerald-500/40 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-center sm:text-left rtl:sm:text-right">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl border-2 border-amber-400 shadow-md object-cover"
                  />
                ) : (
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 border-2 border-amber-400 flex items-center justify-center text-xl shadow-md text-white shrink-0">
                    👤
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/20 px-2 py-0.2 rounded-full border border-amber-300 dark:border-amber-500/30">
                      {isAr ? 'حساب متوقع محترف' : 'Pro Predictor Account'}
                    </span>
                  </div>
                  <h2 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {user ? user.displayName || 'الكابتن' : (isAr ? 'زائر (غير مسجل)' : 'Guest User')}
                  </h2>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {user ? user.email : (isAr ? 'قم بتسجيل الدخول لحفظ نقاطك وسحب الجوائز' : 'Sign in to save points and withdraw cash')}
                  </p>
                </div>
              </div>

              {/* Points & Sign In/Out Actions */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                <div className={`border px-3.5 py-1.5 rounded-xl shadow-inner text-center flex items-center gap-2 sm:block ${
                  isDark ? 'bg-slate-950/90 border-amber-500/50' : 'bg-amber-50 border-amber-300'
                }`}>
                  <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-amber-300/80' : 'text-amber-800'}`}>
                    {isAr ? 'رصيد الكوينز:' : 'Coins Balance:'}
                  </span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                    <span className="text-base">🪙</span>
                    <span>{user ? userPoints : 0}</span>
                    <span className="text-xs font-black text-amber-700 dark:text-amber-300">{isAr ? 'كوينز' : 'Coins'}</span>
                  </div>
                </div>

                {user ? (
                  <button
                    onClick={handleSignOut}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={onSignIn}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow transition-all flex items-center justify-center gap-1 cursor-pointer border border-emerald-400/30"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تسجيل الدخول' : 'Log In'}</span>
                    </button>
                    <button
                      onClick={onSignIn}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700 hover:border-emerald-500/50'
                          : 'bg-slate-100 hover:bg-slate-200 text-emerald-800 border-slate-300 hover:border-emerald-500'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isAr ? 'إنشاء حساب' : 'Sign Up'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* User ID Digital Card Block */}
            <div className={`relative z-10 mt-3 pt-2.5 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2.5 rounded-xl border ${
              isDark
                ? 'border-slate-800/80 bg-slate-950/80 border-cyan-500/30 text-white'
                : 'border-slate-200 bg-slate-50 border-cyan-300 text-slate-900'
            }`}>
              <div className="flex items-center gap-2.5 text-center sm:text-left rtl:sm:text-right">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow shrink-0">
                  <Fingerprint className="w-4 h-4 text-cyan-200" />
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <span className="text-[10px] font-black uppercase text-cyan-700 dark:text-cyan-400 tracking-wider">
                      {isAr ? 'معرّف الحساب (User ID)' : 'Account User ID'}
                    </span>
                    {user ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-black text-[9px] border border-emerald-500/30">
                        {isAr ? 'موثق 🟢' : 'Verified 🟢'}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-[9px] border border-amber-500/30">
                        {isAr ? 'مؤقت' : 'Guest'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                    <span className={`text-base font-black font-mono tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formattedUserId}
                    </span>
                    {user && (
                      <span className={`text-[9px] font-mono hidden md:inline-block px-1.5 py-0.2 rounded border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-300 text-slate-600'
                      }`}>
                        UID: {user.uid}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center">
                <button
                  onClick={handleCopyUserId}
                  className={`w-full sm:w-auto px-3 py-1.5 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow border ${
                    copiedId
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : isDark
                        ? 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
                        : 'bg-white hover:bg-slate-100 text-cyan-800 border-cyan-300 hover:border-cyan-500'
                  }`}
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>{isAr ? 'تم نسخ الـ ID! 📋' : 'ID Copied! 📋'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>{isAr ? 'نسخ ID الحساب' : 'Copy User ID'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* User Stats & Coins Overview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Correct Predictions Count (النتيجة الدقيقة) */}
            <div className={`border rounded-2xl p-3.5 shadow-sm space-y-1 ${
              isDark ? 'bg-slate-900/90 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">
                  {isAr ? 'المباريات الصحيحة' : 'Exact Matches'}
                </span>
                <span className="text-sm">🎯</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {predictionsList.filter((p) => p.status === 'EXACT_SCORE' || p.status === 'EXACT_WIN' || p.pointsEarned === 50 || p.coinsEarned === 50).length}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                {isAr ? 'توقع النتيجة بالمللي' : 'Exact score hits'}
              </p>
            </div>

            {/* 2. Total Predictions Count (إجمالي التوقعات) */}
            <div className={`border rounded-2xl p-3.5 shadow-sm space-y-1 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                  {isAr ? 'إجمالي التوقعات' : 'Total Predictions'}
                </span>
                <span className="text-sm">📝</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-white">
                {predictionsList.length}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                {isAr ? 'كل المباريات المتوقعة' : 'All submitted'}
              </p>
            </div>

            {/* 3. Available Coins + History Modal Opener */}
            <div className={`border rounded-2xl p-3.5 shadow-sm space-y-1 relative group cursor-pointer transition-all ${
              isDark ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-400' : 'bg-amber-50/80 border-amber-300 hover:border-amber-400'
            }`}
            onClick={onOpenCoinsBreakdown || (() => setActiveSubTab('predictions'))}
            title={isAr ? 'اضغط لعرض تفاصيل أرباح الكوينز والمباريات' : 'Click to view coins breakdown'}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                  {isAr ? 'رصيد الكوينز' : 'Coins Balance'}
                </span>
                <span className="text-sm">🪙</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span>{userPoints}</span>
                <span className="text-[10px] font-black">{isAr ? 'كوينز' : 'coins'}</span>
              </div>
              <p className="text-[10px] text-amber-700 dark:text-amber-300 font-bold underline flex items-center gap-0.5">
                <span>{isAr ? 'تفاصيل الأرباح' : 'View Breakdown'}</span>
                <span>←</span>
              </p>
            </div>

            {/* 4. Cash Claims Count (عمليات السحب) */}
            <div 
              onClick={() => setActiveSubTab('claims')}
              className={`border rounded-2xl p-3.5 shadow-sm space-y-1 cursor-pointer transition-all ${
                isDark ? 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/40' : 'bg-white border-slate-200 hover:border-cyan-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-cyan-700 dark:text-cyan-300">
                  {isAr ? 'عمليات السحب' : 'Cash Claims'}
                </span>
                <span className="text-sm">💵</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                {claimsList.length}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                {isAr ? 'إنستاباي ومحافظ' : 'InstaPay & Wallets'}
              </p>
            </div>
          </div>

          {/* App Language & Push Notification Compact Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Language Card */}
            <div className={`border rounded-2xl p-3 shadow-sm flex items-center justify-between gap-2 ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`font-extrabold text-xs flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <span>{isAr ? 'لغة التطبيق' : 'App Language'}</span>
                  </h3>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isAr ? 'العربية أو الإنجليزية' : 'Arabic or English'}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  onClick={() => onLanguageChange?.('ar')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                    isAr
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow border border-emerald-400/30'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🇪🇬</span>
                  <span>عربي</span>
                </button>

                <button
                  onClick={() => onLanguageChange?.('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                    !isAr
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow border border-emerald-400/30'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🇬🇧</span>
                  <span>EN</span>
                </button>
              </div>
            </div>

            {/* Push Notification Card */}
            <div className={`border rounded-2xl p-3 shadow-sm flex items-center justify-between gap-2 ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  <Bell className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className={`font-extrabold text-xs flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <span>{isAr ? 'إشعارات الأهداف' : 'Push Alerts'}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                      pushEnabled
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {pushEnabled ? (isAr ? 'مفعلة 🔔' : 'On 🔔') : (isAr ? 'معطلة 🔕' : 'Off 🔕')}
                    </span>
                  </h3>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isAr ? 'تنبيهات فورية عند الأهداف والمباريات' : 'Instant goal & kickoff alerts'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleTogglePushNotifications}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  pushEnabled
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/40 shadow'
                    : isDark ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40' : 'bg-slate-100 hover:bg-slate-200 text-amber-800 border-amber-300'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>
                  {pushEnabled
                    ? (isAr ? 'إيقاف 🔕' : 'Disable')
                    : (isAr ? 'تفعيل 🔔' : 'Enable')}
                </span>
              </button>
            </div>
          </div>

          {/* Install App Banner in Account Page */}
          <InstallAppBanner language={language} theme={theme} />

          {/* MAIN MENU / SERVICES CARDS LIST */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <h3 className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <span>📋</span>
                <span>{isAr ? 'أقسام وخدمات الحساب (اضغط لفتح الصفحة)' : 'Account Hub & Services'}</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Card 1: Latest Updates (آخر التحديثات) */}
              <div
                onClick={() => setActiveSubTab('updates')}
                className={`group border rounded-2xl p-3.5 shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3 active:scale-[0.99] ${
                  isDark
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/60 border-teal-500/40 hover:border-teal-400 hover:shadow-teal-950/50'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-teal-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 group-hover:scale-105 transition-transform border ${
                    isDark ? 'bg-teal-500/20 border-teal-400/40 text-teal-400' : 'bg-teal-50 border-teal-200 text-teal-700'
                  }`}>
                    🚀
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className={`font-black text-xs sm:text-sm group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {isAr ? 'آخر التحديثات ودليل التثبيت' : 'Latest Updates & Install'}
                      </h4>
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9px] font-black border border-emerald-500/40">
                        {isAr ? 'جديد 🔥' : 'NEW'}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAr ? 'سجل التعديلات ومميزات الإصدار ودليل التثبيت' : 'Changelog, features and installation guide'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 shrink-0">
                  <ChevronLeft className="w-4 h-4 rtl:rotate-0 rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Prediction History (سجل التوقعات) */}
              <div
                onClick={() => setActiveSubTab('predictions')}
                className={`group border rounded-2xl p-3.5 shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3 active:scale-[0.99] ${
                  isDark
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/60 border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-950/50'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 group-hover:scale-105 transition-transform border ${
                    isDark ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    🎯
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className={`font-black text-xs sm:text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {isAr ? 'سجل التوقعات والكوينز' : 'Predictions & Coins History'}
                      </h4>
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40">
                        {predictionsList.length} {isAr ? 'توقع' : 'preds'}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAr ? 'المباريات المتوقعة وحالة الكوينز والدقة' : 'Predicted scores, outcome checks & earned coins'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ChevronLeft className="w-4 h-4 rtl:rotate-0 rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Withdrawal Claims History (سجل السحب والمطالبات) */}
              <div
                onClick={() => setActiveSubTab('claims')}
                className={`group border rounded-2xl p-3.5 shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3 active:scale-[0.99] ${
                  isDark
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/60 border-amber-500/40 hover:border-amber-400 hover:shadow-amber-950/50'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 group-hover:scale-105 transition-transform border ${
                    isDark ? 'bg-amber-500/20 border-amber-400/40 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    💵
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className={`font-black text-xs sm:text-sm group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {isAr ? 'سجل السحب والمطالبات' : 'Withdrawals Log'}
                      </h4>
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
                        {claimsList.length} {isAr ? 'عملية' : 'claims'}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAr ? 'متابعة تحويل الكاش بالمحافظ وإنستاباي' : 'Track cash payout requests & transfer status'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 shrink-0">
                  <ChevronLeft className="w-4 h-4 rtl:rotate-0 rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 4: Cash Payout Details Setup (بيانات استلام الكاش) */}
              <div
                onClick={() => setActiveSubTab('payout')}
                className={`group border rounded-2xl p-3.5 shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3 active:scale-[0.99] ${
                  isDark
                    ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 border-emerald-500/40 hover:border-emerald-300'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 group-hover:scale-105 transition-transform border ${
                    isDark ? 'bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border-amber-400/40 text-amber-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    💸
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className={`font-black text-xs sm:text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {isAr ? 'بيانات وطريقة استلام الكاش' : 'Cash Payout Info'}
                      </h4>
                      {payoutSaved ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold border border-emerald-500/40">
                          {isAr ? 'جاهز ⚡' : 'Ready'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[9px] font-bold border border-amber-500/40">
                          {isAr ? 'إعداد' : 'Setup'}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAr ? 'إنستاباي، فودافون كاش، المحافظ، التحويل البنكي' : 'InstaPay, Vodafone Cash, Wallets & Bank details'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ChevronLeft className="w-4 h-4 rtl:rotate-0 rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 5: Technical Support (الدعم الفني والمساعدة) */}
              <div
                onClick={() => setActiveSubTab('support')}
                className={`group border rounded-2xl p-3.5 shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3 active:scale-[0.99] ${
                  isDark
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/60 border-emerald-500/30 hover:border-emerald-400'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border ${
                    isDark ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className={`font-black text-xs sm:text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {isAr ? 'الدعم الفني والمساعدة' : 'Technical Support'}
                      </h4>
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold border border-emerald-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{isAr ? 'متصل' : 'Live'}</span>
                      </span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAr ? 'تواصل مباشر عبر واتساب لحل أي مشكلة' : 'Direct WhatsApp chat for instant assistance'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ChevronLeft className="w-4 h-4 rtl:rotate-0 rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 6: Social Channels (قنوات التواصل الرسمية) */}
              <div
                onClick={() => setActiveSubTab('social')}
                className={`group border rounded-2xl p-3.5 shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3 active:scale-[0.99] ${
                  isDark
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-pink-950/40 border-pink-500/30 hover:border-pink-400'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-pink-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 group-hover:scale-105 transition-transform border ${
                    isDark ? 'bg-pink-500/20 border-pink-500/40 text-pink-400' : 'bg-pink-50 border-pink-200 text-pink-700'
                  }`}>
                    🌐
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className={`font-black text-xs sm:text-sm group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {isAr ? 'قنوات التواصل الرسمية' : 'Official Social Channels'}
                      </h4>
                      <span className="px-1.5 py-0.2 rounded-full bg-pink-500/15 text-pink-700 dark:text-pink-300 text-[9px] font-bold border border-pink-500/40">
                        TikTok & FB
                      </span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAr ? 'حساب تيك توك @koraa.web وصفحة فيسبوك' : 'Follow TikTok @koraa.web & Facebook page'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-pink-600 dark:text-pink-400 shrink-0">
                  <ChevronLeft className="w-4 h-4 rtl:rotate-0 rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 7: Legal, Privacy & Rules (الخصوصية والشروط) */}
              <div
                onClick={() => setActiveSubTab('legal')}
                className={`group border rounded-2xl p-3.5 shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3 active:scale-[0.99] sm:col-span-2 ${
                  isDark
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-700 hover:border-slate-500'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 group-hover:scale-105 transition-transform border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className={`font-black text-xs sm:text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {isAr ? 'الخصوصية، الأمان وشروط الاستخدام' : 'Privacy, Security & Legal Terms'}
                      </h4>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAr ? 'سياسة حماية البيانات، شروط وقوانين التوقعات والجوائز' : 'Data protection policy, prediction rules & user rights'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400 shrink-0">
                  <ChevronLeft className="w-4 h-4 rtl:rotate-0 rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUB-PAGE: LATEST UPDATES & INSTALLATION GUIDE */}
      {activeSubTab === 'updates' && (
        <LatestUpdatesPage
          language={language}
          onBack={() => setActiveSubTab('main')}
          onInstallApp={onInstallApp}
          theme={theme}
        />
      )}

      {/* 3. SUB-PAGE: PREDICTIONS HISTORY */}
      {activeSubTab === 'predictions' && (
        <div className="space-y-3.5">
          {renderSubPageHeader(
            isAr ? 'سجل توقعاتي والكوينز' : 'My Match Predictions History',
            isAr ? 'جميع المباريات التي توقعت نتائجها وحالة الكوينز' : 'All match score predictions and awarded coins',
            <span>🎯</span>,
            `${predictionsList.length} ${isAr ? 'توقع' : 'preds'}`
          )}

          {predictionsList.length === 0 ? (
            <div className={`p-10 text-center border rounded-3xl space-y-3 ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <History className="w-12 h-12 mx-auto text-slate-400" />
              <p className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? 'لم تقم بإدخال أي توقعات بعد.' : 'No predictions submitted yet.'}
              </p>
              <p className="text-xs max-w-md mx-auto text-slate-500">
                {isAr ? 'توجه لصفحة المباريات واضغط على "توقع الآن" تحت أي مباراة لاكتساب الكوينز!' : 'Go to Matches tab and click "Predict Now" under any match to earn coins!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {predictionsList.map((pred) => {
                const matchId = pred.matchId || (typeof pred.id === 'string' && pred.id.startsWith('pred_') ? pred.id.split('_').pop() : pred.id);
                const currentScore = (matchId && userPredictions?.[matchId])
                  ? userPredictions[matchId]
                  : { predictedHomeScore: pred.predictedHomeScore, predictedAwayScore: pred.predictedAwayScore };
                const targetMatch = matches?.find((m) => m.id === matchId);

                const isMatchFinished = targetMatch?.status === 'FINISHED' || pred.status === 'EXACT_SCORE' || pred.status === 'MISSED';
                const actualHome = targetMatch?.homeScore ?? pred.matchHomeScore;
                const actualAway = targetMatch?.awayScore ?? pred.matchAwayScore;
                const isExactRight = pred.status === 'EXACT_SCORE' || (isMatchFinished && typeof actualHome === 'number' && typeof actualAway === 'number' && actualHome === currentScore.predictedHomeScore && actualAway === currentScore.predictedAwayScore);
                const isMissed = (pred.status === 'MISSED' || isMatchFinished) && !isExactRight;

                const isHighlighted = Boolean(highlightMatchId && (highlightMatchId === matchId || pred.id === highlightMatchId));

                return (
                  <div
                    key={pred.id}
                    id={`pred-card-${matchId}`}
                    className={`border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all shadow-sm relative ${
                      isHighlighted
                        ? isDark
                          ? 'bg-amber-500/10 border-amber-400 ring-4 ring-amber-400/40 shadow-xl'
                          : 'bg-amber-50 border-amber-400 ring-4 ring-amber-400/30 shadow-xl'
                        : isDark
                          ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/40 text-white'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                    }`}
                  >
                    {isHighlighted && (
                      <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-md animate-bounce">
                        <span>🎯</span>
                        <span>{isAr ? 'المباراة المختارة من سجل الكوينز' : 'Selected Match from Coins Log'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className={`flex items-center gap-1.5 p-2 rounded-xl border shrink-0 ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <TeamLogo
                          teamName={pred.matchHomeTeamAr || pred.matchHomeTeam}
                          sizeClassName="w-8 h-8 sm:w-10 sm:h-10"
                        />
                        <span className="text-xs font-black text-slate-400">VS</span>
                        <TeamLogo
                          teamName={pred.matchAwayTeamAr || pred.matchAwayTeam}
                          sizeClassName="w-8 h-8 sm:w-10 sm:h-10"
                        />
                      </div>

                      <div className="space-y-1">
                        <h4 className={`font-black text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {isAr ? `${pred.matchHomeTeamAr || pred.matchHomeTeam} ضد ${pred.matchAwayTeamAr || pred.matchAwayTeam}` : `${pred.matchHomeTeam} vs ${pred.matchAwayTeam}`}
                        </h4>
                        <div className="text-xs flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-300 dark:border-amber-500/30">
                            {isAr ? `توقعك: ${currentScore.predictedHomeScore} - ${currentScore.predictedAwayScore}` : `Your Prediction: ${currentScore.predictedHomeScore} - ${currentScore.predictedAwayScore}`}
                          </span>
                          {isMatchFinished && typeof actualHome === 'number' && typeof actualAway === 'number' && (
                            <span className={`font-extrabold px-2.5 py-0.5 rounded-lg border ${
                              isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}>
                              {isAr ? `النتيجة النهائية: ${actualHome} - ${actualAway}` : `Final Score: ${actualHome} - ${actualAway}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto border-t sm:border-t-0 border-slate-200 dark:border-slate-800 pt-3 sm:pt-0">
                      {!isMatchFinished && targetMatch && onOpenDetails && (
                        <button
                          onClick={() => onOpenDetails(targetMatch, 'predict')}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-extrabold text-xs border border-amber-400 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تعديل التوقع' : 'Edit Prediction'}</span>
                        </button>
                      )}

                      {isExactRight ? (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-black text-xs flex items-center gap-1.5 shadow-sm">
                          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{isAr ? 'توقع النتيجة الدقيقة! 🎉 (+50 كوينز 🪙)' : 'Exact Score! (+50 Coins)'}</span>
                        </span>
                      ) : isMissed ? (
                        <span className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 ${
                          isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}>
                          <span>{isAr ? 'لم يصِب التوقع الدقيق ❌' : 'Missed Exact Score'}</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{isAr ? 'في انتظار النتيجة المباشرة ⏳' : 'Awaiting Result ⏳'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. SUB-PAGE: CASH CLAIMS & WITHDRAWALS */}
      {activeSubTab === 'claims' && (
        <div className="space-y-3.5">
          {renderSubPageHeader(
            isAr ? 'سجل السحب ومطالبات الكاش' : 'Cash Claims & Withdrawals Log',
            isAr ? 'متابعة وتتبع عمليات تحويل الكاش عبر المحافظ وإنستاباي' : 'Track cash transfers via InstaPay & Mobile Wallets',
            <span>💵</span>,
            `${claimsList.length} ${isAr ? 'عملية' : 'claims'}`,
            'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
          )}

          {claimsList.length === 0 ? (
            <div className={`p-10 text-center border rounded-3xl space-y-3 ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <Wallet className="w-12 h-12 mx-auto text-slate-400" />
              <p className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? 'لم تقم بطلب أي عمليات سحب كاش بعد.' : 'No cash withdrawals requested yet.'}
              </p>
              <p className="text-xs max-w-md mx-auto text-slate-500">
                {isAr ? 'جمع الكوينز واستبدلها بكاش فوري عبر إنستاباي والمحافظ الإلكترونية من صفحة الجوائز!' : 'Earn coins and redeem instant cash payouts from the Rewards store!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {claimsList.map((claim) => (
                <div
                  key={claim.id}
                  className={`border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${
                    isDark
                      ? 'bg-slate-900 border-amber-500/30 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-2xl text-white shadow-md shrink-0">
                      💸
                    </div>
                    <div>
                      <h4 className={`font-black text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {isAr ? claim.prizeTitleAr : claim.prizeTitle}
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-mono mt-0.5 font-bold">
                        {isAr ? `عنوان/محفظة الاستلام: ${claim.shippingAddress}` : `Payout Handle: ${claim.shippingAddress}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-slate-200 dark:border-slate-800 pt-3 sm:pt-0">
                    <span className="px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-400 font-extrabold text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>{isAr ? 'جاري التحويل الفوري (خلال 24 ساعة)' : 'Processing Transfer (24h)'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. SUB-PAGE: CASH PAYOUT ACCOUNT PROFILE */}
      {activeSubTab === 'payout' && (
        <div className="space-y-3.5">
          {renderSubPageHeader(
            isAr ? 'بيانات وطريقة استلام الكاش' : 'Cash Payout Account Setup',
            isAr ? 'تجهيز وحفظ الحساب لاستلام أرباح التوقعات فور الاستبدال' : 'Set up your handle or wallet to receive instant cash payouts',
            <span>💸</span>,
            payoutSaved ? (isAr ? 'مفعل وجاهز ✓' : 'Active ✓') : undefined,
            'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
          )}

          <div className={`border-2 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm ${
            isDark ? 'bg-slate-900 border-amber-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="space-y-3.5">
              {/* 1. Full Name Field */}
              <div>
                <label className={`block font-bold text-xs mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isAr ? 'الاسم بالكامل (كما في الحساب أو المحفظة):' : 'Full Name (Recipient):'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setPayoutSaved(false);
                  }}
                  placeholder={isAr ? 'مثال: أحمد محمد عبد الفتاح' : 'e.g. Ahmed Mohamed'}
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-amber-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-emerald-500'
                  }`}
                />
              </div>

              {/* 2. Payout Method Selector */}
              <div>
                <label className={`block font-bold text-xs mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isAr ? 'اختر طريقة استلام الكاش المجهزة:' : 'Select Cash Payout Method:'}
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'INSTAPAY' as const, nameAr: 'إنستاباي InstaPay', nameEn: 'InstaPay Direct', icon: '⚡' },
                    { id: 'VODAFONE_CASH' as const, nameAr: 'فودافون كاش', nameEn: 'Vodafone Cash', icon: '📱' },
                    { id: 'ETISALAT_CASH' as const, nameAr: 'اتصالات كاش', nameEn: 'Etisalat Cash', icon: '📱' },
                    { id: 'ORANGE_CASH' as const, nameAr: 'أورنج كاش', nameEn: 'Orange Cash', icon: '📱' },
                    { id: 'WE_PAY' as const, nameAr: 'وي باي WE Pay', nameEn: 'WE Pay Wallet', icon: '📱' },
                    { id: 'BANK_TRANSFER' as const, nameAr: 'تحويل بنكي / IBAN', nameEn: 'Bank IBAN', icon: '🏦' },
                  ].map((item) => {
                    const isSelected = payoutMethod === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setPayoutMethod(item.id);
                          setPayoutSaved(false);
                        }}
                        className={`p-2.5 rounded-xl border text-right rtl:text-right flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-emerald-600 border-amber-400 text-white font-black shadow ring-1 ring-amber-400'
                            : isDark
                              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        <div className="truncate">
                          <p className="text-[11px] font-bold truncate">{isAr ? item.nameAr : item.nameEn}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Account / Wallet / Handle Field */}
              <div>
                <label className={`block font-bold text-xs mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isAr ? `أدخل رقم ${getPayoutLabel(payoutMethod)}:` : `Enter Number/Handle for ${getPayoutLabel(payoutMethod)}:`}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    setPayoutSaved(false);
                  }}
                  placeholder={getAccountFieldPlaceholder()}
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-amber-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-emerald-500'
                  }`}
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSavePayoutProfile}
                disabled={savingPayout}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 text-white font-black text-xs shadow-md ring-1 ring-amber-400/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-200" />
                <span>
                  {savingPayout
                    ? (isAr ? 'جاري حفظ البيانات...' : 'Saving...')
                    : (isAr ? 'حفظ بيانات استلام الكاش' : 'Save Cash Payout Details')}
                </span>
              </button>

              {/* Active Payout Summary Box */}
              {payoutSaved && fullName && accountNumber && (
                <div className={`p-3 border rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
                  isDark
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className={`font-extrabold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? 'جاهز لتحويل الكاش!' : 'Ready for Instant Payouts!'}
                    </p>
                    <p className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {isAr
                        ? `الاسم: ${fullName} | الطريقة: ${getPayoutLabel(payoutMethod)} | الرقم/العنوان: ${accountNumber}`
                        : `Name: ${fullName} | Method: ${getPayoutLabel(payoutMethod)} | Handle: ${accountNumber}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. SUB-PAGE: TECHNICAL SUPPORT (الدعم الفني والمساعدة) */}
      {activeSubTab === 'support' && (
        <div className="space-y-3.5">
          {renderSubPageHeader(
            isAr ? 'الدعم الفني والمساعدة' : 'Technical Support & Help',
            isAr ? 'تواصل مباشر مع فريق الدعم الفني لحل أي استفسار أو مشكلة' : 'Direct support via WhatsApp for any technical or account queries',
            <MessageCircle className="w-5 h-5 text-emerald-500" />,
            isAr ? 'متصل الآن 🟢' : 'Live 24/7 🟢'
          )}

          <div className={`border rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border-emerald-500/40 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0 border ${
                  isDark ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  💬
                </div>
                <div>
                  <h3 className={`font-black text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isAr ? 'خدمة العملاء والدعم السريع' : 'Fast Technical Assistance'}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isAr ? 'فريق الدعم متواجد للرد على استفسارات تحويل الكاش والكوينز والمباريات.' : 'Our team is available 24/7 to assist with coins, claims & match predictions.'}
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <span className="font-bold">{isAr ? 'قناة التواصل:' : 'Support Channel:'}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Official</span>
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <span className="font-bold">{isAr ? 'زمن الاستجابة المتوقع:' : 'Response Time:'}</span>
                  <span className="text-amber-600 dark:text-amber-300 font-extrabold">{isAr ? 'خلال دقائق معدودة ⚡' : 'Within minutes ⚡'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold">{isAr ? 'مواعيد العمل:' : 'Working Hours:'}</span>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{isAr ? '24 ساعة / 7 أيام في الأسبوع' : '24/7 Available'}</span>
                </div>
              </div>

              <a
                href="https://wa.me/message/FA7GVHEJ7Q7RH1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-emerald-300/30"
              >
                <MessageCircle className="w-5 h-5 fill-slate-950" />
                <span>{isAr ? 'بدء المحادثة مع الدعم الفني عبر واتساب 💬' : 'Start WhatsApp Chat Now 💬'}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUB-PAGE: OFFICIAL SOCIAL CHANNELS */}
      {activeSubTab === 'social' && (
        <div className="space-y-3.5">
          {renderSubPageHeader(
            isAr ? 'قنوات التواصل الرسمية' : 'Official Social Media Channels',
            isAr ? 'تابع أحدث أخبار التطبيق، المسابقات، والنتائج عبر حساباتنا' : 'Follow our verified social accounts for news & prizes',
            <span>🌐</span>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* TikTok Official Channel Section */}
            <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between ${
              isDark
                ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-pink-500/30 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-pink-50 dark:bg-pink-500/20 border border-pink-300 dark:border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0 shadow-sm">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 003 15.68 6.34 6.34 0 009.34 22a6.34 6.34 0 006.34-6.34V9.17a8.16 8.16 0 004.91 1.62v-3.6a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? 'حساب تيك توك الرسمي' : 'Official TikTok Channel'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-500/20 border border-pink-300 dark:border-pink-500/30 text-pink-700 dark:text-pink-300 text-[10px] font-bold">
                      @koraa.web
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isAr ? 'تابع كل جديد وتوقعات المباريات اليومية' : 'Follow daily match predictions & videos'}
                  </p>
                </div>
              </div>

              <a
                href="https://www.tiktok.com/@koraa.web?_r=1&_t=ZS-98dJ9MR9MYO"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-pink-300/30"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 003 15.68 6.34 6.34 0 009.34 22a6.34 6.34 0 006.34-6.34V9.17a8.16 8.16 0 004.91 1.62v-3.6a4.85 4.85 0 01-1-.1z"/>
                </svg>
                <span>{isAr ? 'متابعة على تيك توك' : 'Follow on TikTok'}</span>
              </a>
            </div>

            {/* Facebook Official Page Section */}
            <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between ${
              isDark
                ? 'bg-gradient-to-br from-blue-950/90 via-slate-900 to-blue-950 border-blue-500/30 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? 'صفحة الفيسبوك الرسمية' : 'Official Facebook Page'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                      Facebook
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isAr ? 'أخبار الرياضة الحصرية ونتائج الجوائز والمسابقات' : 'Exclusive sports news, rewards and competitions'}
                  </p>
                </div>
              </div>

              <a
                href="https://www.facebook.com/share/1EEwKZED8v/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-blue-300/30"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>{isAr ? 'متابعة فيسبوك' : 'Follow on Facebook'}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 8. SUB-PAGE: LEGAL, PRIVACY POLICY & TERMS */}
      {activeSubTab === 'legal' && (
        <div className="space-y-3.5">
          {renderSubPageHeader(
            isAr ? 'الخصوصية والأمان والشروط' : 'Privacy Policy & Terms of Use',
            isAr ? 'سياسة حماية بياناتك وقواعد استخدام تطبيق كورة وحفظ الحقوق' : 'Data protection policies, terms of use, and rights for Kora app',
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          )}

          {/* Tab Selector */}
          <div className={`flex items-center gap-2 p-1.5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setLegalTab('privacy')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                legalTab === 'privacy'
                  ? 'bg-emerald-600 text-white shadow border border-emerald-400/30'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
            </button>

            <button
              onClick={() => setLegalTab('terms')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                legalTab === 'terms'
                  ? 'bg-amber-600 text-white shadow border border-amber-400/30'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>{isAr ? 'شروط وقواعد الاستخدام' : 'Terms of Use'}</span>
            </button>
          </div>

          <div className={`border rounded-3xl p-5 sm:p-6 space-y-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            {legalTab === 'privacy' ? (
              <>
                <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
                  isDark
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" />
                  <span>
                    {isAr
                      ? 'تطبيق كورة يلتزم بالحفاظ الكامل على خصوصية وحماية بيانات جميع المستخدمين والزوار.'
                      : 'Kora app is fully committed to preserving user privacy and data security.'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className={`font-bold text-sm mb-1.5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span className="text-emerald-500 font-mono">1.</span>
                      <span>{isAr ? 'البيانات التي نجمعها' : '1. Information We Collect'}</span>
                    </h4>
                    <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      {isAr
                        ? 'نجمع الحد الأدنى من المعلومات اللازمة لتشغيل التطبيق، مثل: الاسم، البريد الإلكتروني (عند تسجيل الدخول عبر حساب جوجل)، بالإضافة لبيانات استلام الجوائز الماليّة (مثل رقم المحفظة الإلكترونية أو عنوان إنستاباي).'
                        : 'We collect minimal necessary information including name, email (upon Google sign-in), and payout destination details (mobile wallet or InstaPay handle) for cash reward distribution.'}
                    </p>
                  </div>

                  <div>
                    <h4 className={`font-bold text-sm mb-1.5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span className="text-emerald-500 font-mono">2.</span>
                      <span>{isAr ? 'كيفية استخدام البيانات' : '2. How We Use Information'}</span>
                    </h4>
                    <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      {isAr
                        ? 'تُستخدم بياناتك حصرياً لأغراض توثيق الحساب، وحفظ كوينز التوقعات المكتسبة، ومعالجة وتحويل الجوائز المالية المطلوبة بأمان وفاعلية.'
                        : 'Your data is strictly utilized for user authentication, tracking earned prediction coins, and securely processing cash prize payout claims.'}
                    </p>
                  </div>

                  <div>
                    <h4 className={`font-bold text-sm mb-1.5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span className="text-emerald-500 font-mono">3.</span>
                      <span>{isAr ? 'حماية وأمان البيانات' : '3. Security & Data Protection'}</span>
                    </h4>
                    <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      {isAr
                        ? 'نستخدم خوادم موثوقة بروتوكولات تشفير Firebase ونظم حماية متطورة لمنع أي وصول غير مصرح به. لا نبيع ولا نتاجر ببياناتك الشخصية مع أي طرف ثالث لأغراض تسويقية.'
                        : 'We utilize encrypted Firebase infrastructure to prevent unauthorized access. We never sell or share user personal data with third parties for commercial marketing.'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
                  isDark
                    ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <Scale className="w-5 h-5 shrink-0 text-amber-500" />
                  <span>
                    {isAr
                      ? 'استخدامك لتطبيق كورة يعني موافقتك على القواعد والتعليمات الموضحة أدناه.'
                      : 'Using Kora app implies acceptance of all guidelines and prediction terms defined below.'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className={`font-bold text-sm mb-1.5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span className="text-amber-500 font-mono">1.</span>
                      <span>{isAr ? 'قواعد التوقعات والكوينز' : '1. Prediction Coins & Rules'}</span>
                    </h4>
                    <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      {isAr
                        ? 'يستحق المستخدم ٥٠ كوينز عند إصابة التوقع الدقيق لنتيجة المباراة أو المطالبة بالهدية اليومية. جميع الكوينز مجانية ومكتسبة نتيجة للتفاعل العادل داخل التطبيق.'
                        : 'Users earn 50 prediction coins by correctly forecasting match scores and claiming daily gifts. Coins are earned through active, fair app engagement.'}
                    </p>
                  </div>

                  <div>
                    <h4 className={`font-bold text-sm mb-1.5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span className="text-amber-500 font-mono">2.</span>
                      <span>{isAr ? 'نزاهة الاستخدام والحسابات' : '2. Fair Play & Anti-Fraud'}</span>
                    </h4>
                    <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      {isAr
                        ? 'يمنع استخدام أي برامج تلاعب أو إنشاء حسابات وهمية متعددة لاكتساب الكوينز بطرق غير مشروعة. يحق للتطبيق تعليق أو إلغاء أي حساب يخالف قواعد النزاهة.'
                        : 'Automated bots, fake accounts, or exploit attempts to manipulate coin balances are strictly forbidden and will result in account suspension.'}
                    </p>
                  </div>

                  <div>
                    <h4 className={`font-bold text-sm mb-1.5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span className="text-amber-500 font-mono">3.</span>
                      <span>{isAr ? 'مسؤولية صحة بيانات الدفع' : '3. Cash Payout Accuracy'}</span>
                    </h4>
                    <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      {isAr
                        ? 'يتوجب على المستخدم التأكد التام من كتابة رقم محفظة الهاتف أو عنوان إنستاباي بدقة. التطبيق غير مسؤول عن تحويلات الجوائز الموجهة لأرقام خاطئة أدخلها المستخدم.'
                        : 'Users must ensure accuracy when providing InstaPay handles or mobile wallet numbers. The app is not responsible for funds sent to incorrect user-provided numbers.'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pin App to Home Screen Instructions Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl relative animate-fadeIn ${
            isDark ? 'bg-slate-900 border-emerald-500/40 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setShowPinModal(false)}
              className={`absolute top-3.5 left-3.5 p-1 rounded-full ${
                isDark ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-500 hover:text-slate-900 bg-slate-100'
              }`}
            >
              ✕
            </button>

            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 shadow-md overflow-hidden bg-slate-950 flex items-center justify-center">
              <img src={KORA_LOGO_BASE64 || "/pwa-192x192.png"} alt="كورة" className="w-full h-full object-cover rounded-[12px]" />
            </div>

            <div>
              <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? 'تثبيت (كورة) على شاشتك الرئيسية' : 'Pin Kora App to Home Screen'}
              </h3>
              <p className={`text-xs font-medium mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isAr 
                  ? 'لتظهر أيقونة الكرة واسم "كورة" على شاشة هاتفك مباشرة:' 
                  : 'To add the football icon and "Kora" name onto your home screen:'}
              </p>
            </div>

            <div className={`rounded-2xl p-4 border text-right rtl:text-right space-y-3 text-xs ${
              isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-start gap-2.5">
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5 rounded-lg border border-emerald-500/30 text-[11px] shrink-0">1</span>
                <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isAr ? 'اضغط على قائمة المتصفح (الثلاث نقاط ⋮ بالفي الأعلى أو زر المشاركة ⎋ بأجهزة الآيفون)' : 'Open browser menu (⋮ top right or Share ⎋ icon on iPhone)'}
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5 rounded-lg border border-emerald-500/30 text-[11px] shrink-0">2</span>
                <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isAr ? 'اختر "الإضافة إلى الشاشة الرئيسية" (Add to Home Screen) أو "تثبيت التطبيق"' : 'Select "Add to Home screen" or "Install App"'}
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5 rounded-lg border border-emerald-500/30 text-[11px] shrink-0">3</span>
                <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isAr ? 'اضغط "إضافة" وستظهر أيكونة اللوجو واسم (كورة) على شاشتك فوراً' : 'Tap "Add" and the Kora icon & name will appear on your phone!'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPinModal(false)}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-md"
            >
              {isAr ? 'حسناً، فهمت الخطوات 👍' : 'Got it 👍'}
            </button>
          </div>
        </div>
      )}

      {/* Pin Success Toast */}
      {pinSuccessMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-extrabold px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400/50 flex items-center gap-3 animate-bounce">
          <span>📲</span>
          <span className="text-xs">{pinSuccessMsg}</span>
          <button onClick={() => setPinSuccessMsg(null)} className="text-xs bg-slate-900/40 px-2 py-0.5 rounded-lg">✕</button>
        </div>
      )}
    </div>
  );
};
