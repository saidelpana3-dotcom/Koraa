import React, { useState, useEffect } from 'react';
import { Match, Language, Prize, PrizeClaim, ThemeMode } from '../types';
import { 
  db, 
  doc, 
  setDoc, 
  collection, 
  getDocs,
  query,
  where,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import { 
  Award, 
  CheckCircle2, 
  ShoppingBag, 
  Clock, 
  Wallet,
  Sparkles,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Save,
  Check,
  AlertCircle,
  History,
  ArrowRight
} from 'lucide-react';

interface PredictionsAndRewardsProps {
  matches: Match[];
  language: Language;
  userPoints: number;
  setUserPoints: React.Dispatch<React.SetStateAction<number>>;
  userId: string;
  userDisplayName: string;
  theme?: ThemeMode;
  onOpenCoinsBreakdown?: () => void;
  onClose?: () => void;
}

// Cash & Wallet Prizes with Exclusive Limited-Time Discount Offers
const CASH_PRIZES: Prize[] = [
  {
    id: 'cash-50',
    title: '50 EGP Cash Transfer',
    titleAr: '50 جنيه كاش (إنستاباي / محفظة)',
    description: 'Instant 50 EGP cash payout sent directly to your InstaPay or mobile wallet.',
    descriptionAr: 'تحويل كاش فوري بقيمة 50 جنيه إلى حساب إنستاباي أو المحفظة الإلكترونية.',
    pointsCost: 400,
    category: 'Cards',
    categoryAr: 'كاش إنستاباي',
    image: '💵',
    stock: 250,
    claimedCount: 310,
  },
  {
    id: 'cash-100',
    title: '100 EGP Cash Transfer',
    titleAr: '100 جنيه كاش (إنستاباي / محفظة)',
    description: 'Instant 100 EGP cash payout sent directly to your InstaPay or mobile wallet.',
    descriptionAr: 'تحويل كاش فوري بقيمة 100 جنيه إلى حساب إنستاباي أو المحفظة الإلكترونية.',
    pointsCost: 600,
    category: 'Cards',
    categoryAr: 'كاش إنستاباي',
    image: '💸',
    stock: 150,
    claimedCount: 220,
  },
  {
    id: 'cash-150',
    title: '150 EGP Cash Transfer',
    titleAr: '150 جنيه كاش (إنستاباي / محفظة)',
    description: 'Instant 150 EGP cash payout sent directly to your InstaPay or mobile wallet.',
    descriptionAr: 'تحويل كاش فوري بقيمة 150 جنيه إلى حساب إنستاباي أو المحفظة الإلكترونية.',
    pointsCost: 750,
    category: 'Cards',
    categoryAr: 'كاش إنستاباي',
    image: '💰',
    stock: 80,
    claimedCount: 145,
  },
  {
    id: 'cash-200',
    title: '200 EGP Cash Transfer',
    titleAr: '200 جنيه كاش (إنستاباي / محفظة)',
    description: 'Instant 200 EGP cash payout sent directly to your InstaPay or mobile wallet.',
    descriptionAr: 'تحويل كاش فوري بقيمة 200 جنيه إلى حساب إنستاباي أو المحفظة الإلكترونية.',
    pointsCost: 900,
    category: 'Cards',
    categoryAr: 'كاش إنستاباي',
    image: '🤑',
    stock: 50,
    claimedCount: 98,
  },
  {
    id: 'cash-350',
    title: '350 EGP Cash Transfer',
    titleAr: '350 جنيه كاش (إنستاباي / محفظة)',
    description: 'Instant 350 EGP cash payout sent directly to your InstaPay or mobile wallet.',
    descriptionAr: 'تحويل كاش فوري بقيمة 350 جنيه إلى حساب إنستاباي أو المحفظة الإلكترونية.',
    pointsCost: 1200,
    originalPointsCost: 1500,
    isOffer: true,
    badgeLabel: 'HOT OFFER 🔥',
    badgeLabelAr: 'عرض خاص 🔥 بدل 1500',
    category: 'Cards',
    categoryAr: 'كاش إنستاباي',
    image: '💎',
    stock: 120,
    claimedCount: 185,
  },
  {
    id: 'cash-500',
    title: '500 EGP Cash Transfer',
    titleAr: '500 جنيه كاش (إنستاباي / محفظة)',
    description: 'Instant 500 EGP cash payout sent directly to your InstaPay or mobile wallet.',
    descriptionAr: 'تحويل كاش فوري بقيمة 500 جنيه إلى حساب إنستاباي أو المحفظة الإلكترونية.',
    pointsCost: 1600,
    originalPointsCost: 2000,
    isOffer: true,
    badgeLabel: 'SUPER OFFER 🔥',
    badgeLabelAr: 'عرض خاص 🔥 بدل 2000',
    category: 'Cards',
    categoryAr: 'كاش إنستاباي',
    image: '👑',
    stock: 75,
    claimedCount: 92,
  },
  {
    id: 'cash-1000',
    title: '1,000 EGP Cash Transfer',
    titleAr: '1000 جنيه كاش (إنستاباي / محفظة)',
    description: 'Instant 1,000 EGP VIP cash payout sent directly to your InstaPay or mobile wallet.',
    descriptionAr: 'تحويل كاش فوري فخم بقيمة 1000 جنيه إلى حساب إنستاباي أو المحفظة الإلكترونية.',
    pointsCost: 2500,
    originalPointsCost: 3200,
    isOffer: true,
    badgeLabel: 'MEGA VIP OFFER 🔥',
    badgeLabelAr: 'عرض سوبر حصري 🔥 بدل 3200',
    category: 'Cards',
    categoryAr: 'كاش إنستاباي',
    image: '🏆',
    stock: 40,
    claimedCount: 54,
  },
];

export type PayoutMethodType = 'INSTAPAY' | 'VODAFONE_CASH' | 'ETISALAT_CASH' | 'ORANGE_CASH' | 'WE_PAY' | 'BANK_TRANSFER';

export const PredictionsAndRewards: React.FC<PredictionsAndRewardsProps> = ({
  matches,
  language,
  userPoints,
  setUserPoints,
  userId,
  userDisplayName,
  theme = 'light',
  onOpenCoinsBreakdown,
  onClose,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  const isGuest = !userId || userId === 'guest-123' || userId.startsWith('guest');
  const displayCoins = isGuest ? 0 : userPoints;

  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [recentClaims, setRecentClaims] = useState<PrizeClaim[]>([]);
  const [submittingClaim, setSubmittingClaim] = useState<boolean>(false);

  // Cash Payout Profile Form State
  const [fullName, setFullName] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethodType>('INSTAPAY');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [savingPayout, setSavingPayout] = useState<boolean>(false);
  const [payoutSaved, setPayoutSaved] = useState<boolean>(false);

  // Modal Payout Data State
  const [modalFullName, setModalFullName] = useState<string>('');
  const [modalPayoutMethod, setModalPayoutMethod] = useState<PayoutMethodType>('INSTAPAY');
  const [modalAccountNumber, setModalAccountNumber] = useState<string>('');

  // Track User Predictions Count & Stats
  const [predictedMatchesCount, setPredictedMatchesCount] = useState<number>(0);
  const [exactMatchesCount, setExactMatchesCount] = useState<number>(0);

  // Load Saved Payout Profile & Claims & Predictions count
  useEffect(() => {
    if (isGuest) {
      setFullName('');
      setModalFullName('');
      setPayoutMethod('INSTAPAY');
      setModalPayoutMethod('INSTAPAY');
      setAccountNumber('');
      setModalAccountNumber('');
      setPayoutSaved(false);
      setRecentClaims([]);
      setPredictedMatchesCount(0);
      setExactMatchesCount(0);
      return;
    }

    const userKey = userId;
    const profileStorageKey = `kora_payout_profile_${userKey}`;
    const claimsStorageKey = `kora_my_claims_${userKey}`;
    const predsStorageKey = `kora_my_predictions_${userKey}`;

    const loadPayoutProfile = () => {
      const savedProfile = localStorage.getItem(profileStorageKey);
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed.fullName) {
            setFullName(parsed.fullName);
            setModalFullName(parsed.fullName);
          }
          if (parsed.payoutMethod) {
            setPayoutMethod(parsed.payoutMethod);
            setModalPayoutMethod(parsed.payoutMethod);
          }
          if (parsed.accountNumber) {
            setAccountNumber(parsed.accountNumber);
            setModalAccountNumber(parsed.accountNumber);
          }
          if (parsed.fullName && parsed.accountNumber) {
            setPayoutSaved(true);
          }
        } catch (e) {}
      } else {
        setFullName('');
        setModalFullName('');
        setPayoutMethod('INSTAPAY');
        setModalPayoutMethod('INSTAPAY');
        setAccountNumber('');
        setModalAccountNumber('');
        setPayoutSaved(false);
      }
    };

    const loadClaims = () => {
      const savedClaims = localStorage.getItem(claimsStorageKey);
      if (savedClaims) {
        try {
          const parsed = JSON.parse(savedClaims);
          if (Array.isArray(parsed)) {
            setRecentClaims(parsed);
          }
        } catch (e) {}
      } else {
        setRecentClaims([]);
      }
    };

    const loadPredictionStats = () => {
      const savedPredsStr = localStorage.getItem(predsStorageKey);
      
      let count = 0;
      let exactCount = 0;
      if (savedPredsStr) {
        try {
          const parsed = JSON.parse(savedPredsStr);
          if (Array.isArray(parsed)) {
            count = parsed.length;
            exactCount = parsed.filter((p: any) => p.status === 'EXACT_SCORE' || p.status === 'EXACT_WIN' || p.pointsEarned === 50).length;
          }
        } catch (e) {}
      }
      setPredictedMatchesCount(count);
      setExactMatchesCount(exactCount);
    };

    loadPayoutProfile();
    loadClaims();
    loadPredictionStats();

    // Listen to profile and predictions updates
    const handleProfileUpdate = () => {
      loadPayoutProfile();
      loadClaims();
      loadPredictionStats();
    };
    window.addEventListener('kora_payout_profile_updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('kora_payout_profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [userId]);

  const getPayoutLabel = (method: PayoutMethodType) => {
    switch (method) {
      case 'INSTAPAY':
        return isAr ? 'إنستاباي (InstaPay)' : 'InstaPay Direct';
      case 'VODAFONE_CASH':
        return isAr ? 'فودافون كاش' : 'Vodafone Cash';
      case 'ETISALAT_CASH':
        return isAr ? 'اتصالات كاش' : 'Etisalat Cash';
      case 'ORANGE_CASH':
        return isAr ? 'أورنج كاش' : 'Orange Cash';
      case 'WE_PAY':
        return isAr ? 'وي باي WE Pay' : 'WE Pay';
      case 'BANK_TRANSFER':
        return isAr ? 'تحويل بنكي / IBAN' : 'Bank Transfer';
    }
  };

  const getAccountFieldPlaceholder = (method: PayoutMethodType) => {
    switch (method) {
      case 'INSTAPAY':
        return isAr ? 'مثال: username@instapay أو رقم الهاتف المسجل' : 'e.g. username@instapay or phone';
      case 'VODAFONE_CASH':
        return isAr ? 'مثال: رقم محفظة فودافون كاش (01012345678)' : 'e.g. Vodafone Cash Wallet (01012345678)';
      case 'ETISALAT_CASH':
        return isAr ? 'مثال: رقم محفظة اتصالات كاش (01112345678)' : 'e.g. Etisalat Cash Wallet (01112345678)';
      case 'ORANGE_CASH':
        return isAr ? 'مثال: رقم محفظة أورنج كاش (01212345678)' : 'e.g. Orange Cash Wallet (01212345678)';
      case 'WE_PAY':
        return isAr ? 'مثال: رقم محفظة وي باي (01512345678)' : 'e.g. WE Pay Wallet (01512345678)';
      case 'BANK_TRANSFER':
        return isAr ? 'مثال: رقم الحساب البنكي أو رقم الـ IBAN' : 'e.g. Bank Account Number or IBAN';
    }
  };

  // Save Payout Details Directly From Prizes Page
  const handleSavePayoutProfile = async () => {
    if (!fullName.trim() || !accountNumber.trim()) {
      alert(isAr ? 'برجاء كتابة الاسم بالكامل ورقم المحفظة / عنوان إنستاباي' : 'Please enter your full name and account/wallet number');
      return;
    }

    setSavingPayout(true);
    const profileObj = {
      fullName: fullName.trim(),
      payoutMethod,
      accountNumber: accountNumber.trim(),
      updatedAt: new Date().toISOString(),
    };

    const userKey = userId || 'guest';
    const profileStorageKey = `kora_payout_profile_${userKey}`;
    localStorage.setItem(profileStorageKey, JSON.stringify(profileObj));

    if (userId && userId !== 'guest-123' && !userId.startsWith('guest')) {
      try {
        await setDoc(doc(db, 'userPaymentProfiles', userId), profileObj, { merge: true });
      } catch (e) {
        console.error('Error saving payout profile to Firestore:', e);
      }
    }

    setSavingPayout(false);
    setPayoutSaved(true);
    setModalFullName(fullName.trim());
    setModalPayoutMethod(payoutMethod);
    setModalAccountNumber(accountNumber.trim());

    // Dispatch custom event to notify other components (e.g. AccountPage)
    window.dispatchEvent(new Event('kora_payout_profile_updated'));
    alert(isAr ? 'تم حفظ وتأمين بيانات استلام الكاش بنجاح! ⚡' : 'Cash payout profile saved successfully! ⚡');
  };

  // Confirm Prize Claim Submission
  const handleConfirmClaim = async () => {
    if (!selectedPrize) return;

    if (userPoints < selectedPrize.pointsCost) {
      alert(isAr ? 'عذراً، نقاطك لا تكفي لاستبدال هذه الجائزة!' : 'Insufficient points for this reward.');
      return;
    }

    if (!modalFullName.trim() || !modalAccountNumber.trim()) {
      alert(isAr ? 'الرجاء إدخال الاسم ورقم المحفظة / عنوان إنستاباي لإتمام السحب.' : 'Please enter your full name and payout account number/handle.');
      return;
    }

    setSubmittingClaim(true);

    try {
      const userKey = userId || 'guest';
      const profileStorageKey = `kora_payout_profile_${userKey}`;
      const claimsStorageKey = `kora_my_claims_${userKey}`;

      // 1. Save / Update Payout Profile
      const payoutProfileObj = {
        fullName: modalFullName.trim(),
        payoutMethod: modalPayoutMethod,
        accountNumber: modalAccountNumber.trim(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(profileStorageKey, JSON.stringify(payoutProfileObj));
      setFullName(modalFullName.trim());
      setPayoutMethod(modalPayoutMethod);
      setAccountNumber(modalAccountNumber.trim());
      setPayoutSaved(true);

      // Save to Firestore payment profiles if user signed in
      if (userId && userId !== 'guest-123' && !userId.startsWith('guest')) {
        setDoc(doc(db, 'userPaymentProfiles', userId), payoutProfileObj, { merge: true }).catch(() => {});
      }

      // 2. Create Claim Record with status: "جاري التحويل الفوري"
      const claimStatusText = isAr ? 'جاري التحويل الفوري (خلال 24 ساعة)' : 'Processing Transfer (24h)';
      const newClaimRecord: PrizeClaim = {
        id: `claim_${Date.now()}`,
        userId: userId || 'guest',
        userDisplayName: userDisplayName || 'الكابتن',
        prizeId: selectedPrize.id,
        prizeTitle: selectedPrize.title,
        prizeTitleAr: selectedPrize.titleAr,
        pointsSpent: selectedPrize.pointsCost,
        status: claimStatusText,
        statusAr: claimStatusText,
        shippingAddress: `${getPayoutLabel(modalPayoutMethod)}: ${modalAccountNumber.trim()} (${modalFullName.trim()})`,
        claimedAt: new Date().toISOString(),
      };

      // Save to local storage claims history strictly for this user
      const existingClaims = localStorage.getItem(claimsStorageKey);
      let claimsArr: PrizeClaim[] = [];
      if (existingClaims) {
        try {
          claimsArr = JSON.parse(existingClaims);
          if (!Array.isArray(claimsArr)) claimsArr = [];
        } catch (e) {}
      }
      claimsArr.unshift(newClaimRecord);
      localStorage.setItem(claimsStorageKey, JSON.stringify(claimsArr));
      setRecentClaims(claimsArr);

      // 3. Deduct points
      const newPoints = userPoints - selectedPrize.pointsCost;
      setUserPoints(newPoints);
      localStorage.setItem(`kora_user_points_${userKey}`, newPoints.toString());

      // Save claim in Firestore
      if (userId && userId !== 'guest-123' && !userId.startsWith('guest')) {
        try {
          await setDoc(doc(db, 'prizeClaims', newClaimRecord.id), newClaimRecord);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'prizeClaims');
        }
      }

      setClaimSuccess(
        isAr
          ? `🎉 تم إرسال طلب استبدال ${selectedPrize.titleAr} بنجاح! سيتم التحويل إلى ${modalAccountNumber} خلال 24 ساعة.`
          : `🎉 Claim for ${selectedPrize.title} submitted! Payout will be sent to ${modalAccountNumber} within 24 hours.`
      );

      setSelectedPrize(null);
      window.dispatchEvent(new Event('kora_payout_profile_updated'));
    } catch (e) {
      alert(isAr ? 'حدث خطأ أثناء إتمام الطلب، يرجى المحاولة لاحقاً.' : 'Failed to submit claim, please try again.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* Top Header & Points Banner */}
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
      <div className={`relative overflow-hidden border-2 rounded-3xl p-4 sm:p-6 shadow-sm transition-colors ${
        isDark
          ? 'bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 border-amber-500/50 text-white'
          : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center md:text-right rtl:md:text-right">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-500 p-1 shadow-md shrink-0">
              <div className={`w-full h-full rounded-xl flex items-center justify-center text-3xl ${
                isDark ? 'bg-slate-950' : 'bg-white'
              }`}>
                🪙
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/40">
                  {isAr ? 'متجر تحويل الكوينز إلى كاش فوري' : 'Coins Cash Store'}
                </span>
              </div>
              <h2 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? 'استبدل الكوينز بفلوس كاش فوري' : 'Redeem Coins for Cash'}
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isAr
                  ? 'تحصل على ٥٠ كوينز عند التوقع الصحيح بالنتيجة بالضبط! املأ بياناتك بالأسفل واختر الجائزة لتحويل الكاش.'
                  : 'Get 50 Coins for every exact score prediction! Enter your details below and choose your cash reward.'}
              </p>
            </div>
          </div>

          {/* Points/Coins Counter Card & Predictions Progress */}
          <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
            <div 
              onClick={onOpenCoinsBreakdown}
              className={`border-2 px-5 py-3 rounded-2xl text-center min-w-[200px] shadow-sm cursor-pointer transition-all active:scale-95 group ${
                isDark ? 'bg-slate-900/90 border-amber-500/60 hover:border-amber-400' : 'bg-amber-50 border-amber-300 hover:border-amber-400'
              }`}
              title={isAr ? 'اضغط لعرض تفاصيل أرباح الكوينز والمباريات الرابحة' : 'Click to view coins earnings breakdown'}
            >
              <div className={`text-[10px] font-bold uppercase flex items-center justify-center gap-1 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                <span>{isAr ? 'رصيدك المتوفر من الكوينز' : 'Your Available Coins'}</span>
                <span className="text-[10px] underline text-amber-500 group-hover:translate-x-0.5 transition-transform">⚡</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-xl">🪙</span>
                <span>{displayCoins}</span>
                <span className="text-xs font-black text-amber-700 dark:text-amber-300">{isAr ? 'كوينز' : 'Coins'}</span>
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5 group-hover:underline">
                {isAr ? 'اضغط لكشف المباريات الرابحة 🔍' : 'Click for winnings breakdown 🔍'}
              </span>
            </div>

            {/* Predictions Progress Bar: عدد الماتشات اللي اتوقعتها من أصل كام */}
            <div className={`border px-3.5 py-2.5 rounded-2xl shadow-sm space-y-1.5 ${
              isDark ? 'bg-slate-950/80 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center justify-between text-xs font-black">
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                  <span>🎯</span>
                  <span>{isAr ? 'المباريات المتوقعة' : 'Predicted Matches'}</span>
                </span>
                <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {predictedMatchesCount} {isAr ? 'من أصل' : 'of'} {matches.length}
                </span>
              </div>

              {/* Progress bar line */}
              <div className={`w-full h-2 rounded-full overflow-hidden border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'
              }`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-500"
                  style={{
                    width: `${matches.length > 0 ? Math.min(100, Math.round((predictedMatchesCount / matches.length) * 100)) : 0}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-0.5">
                <span>
                  {matches.length > 0 ? Math.round((predictedMatchesCount / matches.length) * 100) : 0}% {isAr ? 'مكتمل' : 'completed'}
                </span>
                {exactMatchesCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                    <span>⚡</span>
                    <span>{exactMatchesCount} {isAr ? 'توقع صحيح (+50 كوينز)' : 'Exact'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Success Banner */}
      {claimSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/20 border-2 border-emerald-400 dark:border-emerald-500/50 rounded-2xl text-emerald-900 dark:text-emerald-300 text-xs font-black flex items-center justify-between shadow animate-bounce">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{claimSuccess}</span>
          </div>
          <button 
            onClick={() => setClaimSuccess(null)}
            className="text-xs text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-black/30 px-2.5 py-1 rounded-lg cursor-pointer font-bold"
          >
            {isAr ? 'إغلاق' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* 1. CASH PAYOUT DETAILS SETUP FORM */}
      <div className={`border-2 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 transition-colors ${
        isDark ? 'bg-slate-900 border-amber-500/40 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
              isDark ? 'bg-amber-500/20 border-amber-400/40 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              💸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isAr ? 'بيانات وطريقة استلام الكاش' : 'Cash Payout Info & Wallet Setup'}
                </h3>
                {payoutSaved ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{isAr ? 'محفوظ وجاهز ✓' : 'Ready ✓'}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-500/40">
                    {isAr ? 'مطلوب إدخاله' : 'Required'}
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isAr
                  ? 'املأ بياناتك هنا مرة واحدة لحفظها تلقائياً واستلام أرباحك على إنستاباي أو المحفظة الإلكترونية'
                  : 'Fill and save your details here to receive your cash payouts automatically via InstaPay or wallet'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* Full Name Field */}
          <div>
            <label className={`block font-bold text-xs mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {isAr ? 'الاسم بالكامل (مستلم التحويل):' : 'Full Name (Recipient):'}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setPayoutSaved(false);
              }}
              placeholder={isAr ? 'مثال: أحمد محمد عبد الفتاح' : 'e.g. Ahmed Mohamed'}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition-all ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-amber-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-emerald-500'
              }`}
            />
          </div>

          {/* Payout Method Grid Selector */}
          <div>
            <label className={`block font-bold text-xs mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {isAr ? 'طريقة الاستلام المفضلة:' : 'Payout Method:'}
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'INSTAPAY' as const, nameAr: 'إنستاباي (InstaPay)', nameEn: 'InstaPay Direct', icon: '⚡' },
                { id: 'VODAFONE_CASH' as const, nameAr: 'فودافون كاش', nameEn: 'Vodafone Cash', icon: '📱' },
                { id: 'ETISALAT_CASH' as const, nameAr: 'اتصالات كاش', nameEn: 'Etisalat Cash', icon: '📱' },
                { id: 'ORANGE_CASH' as const, nameAr: 'أورنج كاش', nameEn: 'Orange Cash', icon: '📱' },
                { id: 'WE_PAY' as const, nameAr: 'وي باي WE Pay', nameEn: 'WE Pay', icon: '📱' },
                { id: 'BANK_TRANSFER' as const, nameAr: 'تحويل بنكي / IBAN', nameEn: 'Bank Transfer', icon: '🏦' },
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

          {/* Account / Wallet / Handle Field */}
          <div>
            <label className={`block font-bold text-xs mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {isAr ? `رقم ${getPayoutLabel(payoutMethod)} / عنوان التحويل:` : `Account Number / Handle for ${getPayoutLabel(payoutMethod)}:`}
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                setPayoutSaved(false);
              }}
              placeholder={getAccountFieldPlaceholder(payoutMethod)}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none transition-all ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-amber-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-emerald-500'
              }`}
            />
          </div>

          {/* Save Payout Button */}
          <button
            onClick={handleSavePayoutProfile}
            disabled={savingPayout}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-200" />
            <span>
              {savingPayout
                ? (isAr ? 'جاري حفظ البيانات...' : 'Saving Payout Details...')
                : (isAr ? 'حفظ بيانات استلام الكاش' : 'Save Cash Payout Details')}
            </span>
          </button>

          {/* Saved Status Banner */}
          {payoutSaved && fullName && accountNumber && (
            <div className={`p-3 border rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
              isDark
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className={`font-extrabold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isAr ? 'تم حفظ بياناتك بنجاح وجاهزة للسحب!' : 'Payout details saved & ready for withdrawals!'}
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

      {/* 2. CASH PRIZES STORE SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className={`text-sm sm:text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>🎁</span>
              <span>{isAr ? 'جوائز الكاش المتاحة للاستبدال' : 'Available Cash Rewards'}</span>
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isAr ? 'اختر قيمة الكاش المطلوبة واضغط استبدال للتحويل الفوري' : 'Select your desired cash prize and click redeem'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CASH_PRIZES.map((prize) => {
            const canAfford = userPoints >= prize.pointsCost;
            const missingPts = prize.pointsCost - userPoints;
            const progressPercent = Math.min(100, Math.round((userPoints / prize.pointsCost) * 100));

            return (
              <div
                key={prize.id}
                className={`border-2 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-sm relative overflow-hidden ${
                  prize.isOffer
                    ? isDark
                      ? 'bg-gradient-to-b from-amber-950/20 to-slate-900/95 border-amber-500/80 shadow-lg ring-1 ring-amber-500/30'
                      : 'bg-gradient-to-b from-amber-50/60 to-white border-amber-400 shadow-md ring-1 ring-amber-400/30'
                    : canAfford
                      ? 'border-amber-400 dark:border-amber-500/60 shadow-md ring-1 ring-amber-400/20'
                      : isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                } ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                <div>
                  {/* Header Icon & Tag & Offer Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm border shrink-0 ${
                      prize.isOffer
                        ? isDark
                          ? 'bg-gradient-to-br from-amber-500/30 via-rose-500/20 to-slate-800 border-amber-400/60 shadow-amber-500/10'
                          : 'bg-amber-100 border-amber-300 shadow-amber-200/50'
                        : isDark
                          ? 'bg-gradient-to-br from-amber-500/20 via-emerald-500/20 to-slate-800 border-amber-500/40'
                          : 'bg-amber-50 border-amber-200'
                    }`}>
                      {prize.image}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {prize.isOffer && (
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm tracking-tight">
                          <span>🔥</span>
                          <span>{isAr ? (prize.badgeLabelAr || `عرض خاص`) : (prize.badgeLabel || `Special Offer`)}</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-[10px] font-black text-amber-800 dark:text-amber-300">
                        {isAr ? prize.categoryAr : prize.category}
                      </span>
                    </div>
                  </div>

                  <h3 className={`font-black text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isAr ? prize.titleAr : prize.title}
                  </h3>
                  <p className={`text-[11px] mb-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isAr ? prize.descriptionAr : prize.description}
                  </p>

                  {/* Points Progress Bar */}
                  <div className={`my-2 p-2 rounded-xl border ${
                    isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{isAr ? 'نسبة التقدم' : 'Progress'}</span>
                      <span className={canAfford ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-amber-700 dark:text-amber-400'}>
                        {progressPercent}%
                      </span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden border ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'
                    }`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          canAfford 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                            : 'bg-gradient-to-r from-amber-500 to-amber-300'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Price & Redeem Button */}
                <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div>
                    <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isAr ? 'التكلفة' : 'Cost'}</div>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      {prize.originalPointsCost && (
                        <span className="line-through text-xs font-mono text-slate-400 dark:text-slate-500">
                          {prize.originalPointsCost}
                        </span>
                      )}
                      <div className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>{prize.pointsCost}</span>
                      </div>
                    </div>
                    {prize.originalPointsCost && (
                      <span className="text-[10px] font-black text-rose-500 dark:text-rose-400 block -mt-0.5">
                        {isAr ? `بدل ${prize.originalPointsCost} كوينز` : `instead of ${prize.originalPointsCost}`}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedPrize(prize)}
                    disabled={!canAfford}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-teal-400 text-white shadow-md'
                        : isDark
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>
                      {canAfford
                        ? (isAr ? 'استبدل الآن' : 'Redeem')
                        : (isAr ? `ينقصك ${missingPts}` : `Need ${missingPts}`)}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. RECENT WITHDRAWALS / CLAIMS HISTORY */}
      <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 border ${
              isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`font-black text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? 'سجل طلبات السحب والمطالبات' : 'My Withdrawal Claims Log'}
              </h3>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isAr ? 'متابعة حالة تحويل الكاش عبر إنستاباي والمحافظ' : 'Track your cash transfer requests & current status'}
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold text-xs border border-amber-300 dark:border-amber-500/30">
            {recentClaims.length} {isAr ? 'عمليات' : 'claims'}
          </span>
        </div>

        {recentClaims.length === 0 ? (
          <div className={`p-6 text-center border rounded-2xl space-y-2 ${
            isDark ? 'bg-slate-950/60 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <Wallet className="w-8 h-8 mx-auto text-slate-400" />
            <p className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'لا توجد طلبات سحب حتى الآن' : 'No cash withdrawal claims yet'}
            </p>
            <p className="text-[10px] max-w-sm mx-auto">
              {isAr
                ? 'عند استبدال الكوينز بجائزة كاش، ستظهر هنا تفاصيل التحويل وحالة التنفيذ فوراً.'
                : 'When you redeem coins for cash, your transfer details and status will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {recentClaims.map((claim) => (
              <div
                key={claim.id}
                className={`border rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm ${
                  isDark ? 'bg-slate-950 border-amber-500/30 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-400/40 flex items-center justify-center text-lg text-amber-500 shadow shrink-0">
                    💸
                  </div>
                  <div>
                    <h4 className={`font-black text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? claim.prizeTitleAr || claim.prizeTitle : claim.prizeTitle}
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 font-mono mt-0.5 font-bold">
                      {isAr ? `عنوان/محفظة الاستلام: ${claim.shippingAddress}` : `Payout Handle: ${claim.shippingAddress}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-slate-200 dark:border-slate-800/80 pt-2 sm:pt-0">
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 font-black text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                    <span>{claim.statusAr || claim.status || (isAr ? 'جاري التحويل الفوري (خلال 24 ساعة)' : 'Processing Transfer (24h)')}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation & Payout Info Modal */}
      {selectedPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`border-2 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 relative overflow-hidden ${
            isDark ? 'bg-slate-900 border-amber-500/60 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3.5 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-600 flex items-center justify-center text-2xl shadow shrink-0 text-white">
                {selectedPrize.image}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30">
                  {isAr ? 'تأكيد طلب تحويل الكاش' : 'Confirm Cash Payout Request'}
                </span>
                <h3 className={`font-black text-base mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isAr ? selectedPrize.titleAr : selectedPrize.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {selectedPrize.originalPointsCost && (
                    <span className="text-xs line-through text-slate-400 font-mono font-bold">
                      {selectedPrize.originalPointsCost}
                    </span>
                  )}
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-black font-mono">
                    {isAr ? `تكلفة الطلب: ${selectedPrize.pointsCost} كوينز` : `Cost: ${selectedPrize.pointsCost} Coins`}
                  </p>
                  {selectedPrize.originalPointsCost && (
                    <span className="text-[10px] font-black bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded border border-rose-500/20">
                      {isAr ? `بدل ${selectedPrize.originalPointsCost}` : `instead of ${selectedPrize.originalPointsCost}`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Payout Details Section in Modal */}
            <div className="space-y-3">
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  {isAr 
                    ? 'يرجى مراجعة بيانات التحويل أدناه قبل التأكيد لضمان إرسال الكاش لحسابك الصحيح.'
                    : 'Please review your payout details below before confirming.'}
                </span>
              </div>

              {/* 1. Full Name */}
              <div>
                <label className={`block font-black text-xs mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isAr ? 'الاسم بالكامل (مستلم التحويل):' : 'Full Name (Recipient):'}
                </label>
                <input
                  type="text"
                  value={modalFullName}
                  onChange={(e) => setModalFullName(e.target.value)}
                  placeholder={isAr ? 'مثال: أحمد محمد عبد الفتاح' : 'e.g. Ahmed Mohamed'}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-amber-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-emerald-500'
                  }`}
                />
              </div>

              {/* 2. Payout Method */}
              <div>
                <label className={`block font-black text-xs mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isAr ? 'طريقة الاستلام المفضلة:' : 'Payout Method:'}
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'INSTAPAY' as const, nameAr: 'إنستاباي', icon: '⚡' },
                    { id: 'VODAFONE_CASH' as const, nameAr: 'فودافون كاش', icon: '📱' },
                    { id: 'ETISALAT_CASH' as const, nameAr: 'اتصالات كاش', icon: '📱' },
                    { id: 'ORANGE_CASH' as const, nameAr: 'أورنج كاش', icon: '📱' },
                    { id: 'WE_PAY' as const, nameAr: 'وي باي WE', icon: '📱' },
                    { id: 'BANK_TRANSFER' as const, nameAr: 'تحويل بنكي', icon: '🏦' },
                  ].map((m) => {
                    const isSelected = modalPayoutMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setModalPayoutMethod(m.id)}
                        className={`p-2 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-emerald-600 border-amber-400 text-white font-black shadow'
                            : isDark
                              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span>{m.icon}</span>
                        <span>{m.nameAr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Account / Wallet / Handle */}
              <div>
                <label className={`block font-black text-xs mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isAr ? `رقم ${getPayoutLabel(modalPayoutMethod)} / عنوان التحويل:` : `Account / Mobile Number for ${getPayoutLabel(modalPayoutMethod)}:`}
                </label>
                <input
                  type="text"
                  value={modalAccountNumber}
                  onChange={(e) => setModalAccountNumber(e.target.value)}
                  placeholder={getAccountFieldPlaceholder(modalPayoutMethod)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-amber-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-emerald-500'
                  }`}
                />
              </div>

              {/* Order Status Preview Notice */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isAr ? 'حالة الطلب:' : 'Order Status:'}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black border border-amber-300 dark:border-amber-500/40 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? 'جاري التحويل الفوري (خلال 24 ساعة)' : 'Processing Transfer (24h)'}</span>
                </span>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPrize(null)}
                disabled={submittingClaim}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmClaim}
                disabled={submittingClaim}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {submittingClaim ? (
                  <span>{isAr ? 'جاري التأكيد...' : 'Confirming...'}</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-200" />
                    <span>{isAr ? 'تأكيد طلب التحويل' : 'Confirm Transfer Request'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
