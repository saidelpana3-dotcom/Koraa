import React, { useState } from 'react';
import { X, Sparkles, Crown, CheckCircle2, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';
import { Language } from '../types';
import { getUserOrGuestNumericId } from '../utils/userId';

export interface ProPackage {
  id: string;
  nameAr: string;
  nameEn: string;
  coins: number;
  priceEgp: number;
  matchesCount: number; // calculated at 5 coins per match
  tagAr?: string;
  tagEn?: string;
  popular?: boolean;
  vip?: boolean;
  icon: string;
}

export const PRO_PACKAGES: ProPackage[] = [
  {
    id: 'pkg_100',
    nameAr: 'باقة البداية (100 كوينز)',
    nameEn: 'Starter Pack (100 Coins)',
    coins: 100,
    priceEgp: 40,
    matchesCount: 20,
    tagAr: 'الأوفر للمبتدئين',
    tagEn: 'Starter Choice',
    icon: '⚡',
  },
  {
    id: 'pkg_200',
    nameAr: 'باقة الهداف (200 كوينز)',
    nameEn: 'Striker Pack (200 Coins)',
    coins: 200,
    priceEgp: 80,
    matchesCount: 40,
    tagAr: 'توفير ممتاز 💰',
    tagEn: 'Great Value',
    icon: '🔥',
  },
  {
    id: 'pkg_250',
    nameAr: 'باقة النجوم (250 كوينز)',
    nameEn: 'Stars Pack (250 Coins)',
    coins: 250,
    priceEgp: 100,
    matchesCount: 50,
    tagAr: 'الأكثر طلباً ⭐',
    tagEn: 'Most Popular ⭐',
    popular: true,
    icon: '🌟',
  },
  {
    id: 'pkg_350',
    nameAr: 'الباقة الملكية VIP (350 كوينز)',
    nameEn: 'Royal VIP Pack (350 Coins)',
    coins: 350,
    priceEgp: 150,
    matchesCount: 70,
    tagAr: 'أعلى قيمة وأقصى توفير 👑',
    tagEn: 'Max Value VIP 👑',
    vip: true,
    icon: '👑',
  },
];

interface ProSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme?: 'light' | 'dark';
  userPoints?: number;
  userDisplayName?: string | null;
  currentUser?: any;
  user?: any;
}

export const ProSubscriptionModal: React.FC<ProSubscriptionModalProps> = ({
  isOpen,
  onClose,
  language,
  theme = 'light',
  userPoints = 0,
  userDisplayName,
  currentUser,
  user,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<ProPackage | null>(null);
  const [showConfirmAlert, setShowConfirmAlert] = useState<boolean>(false);

  if (!isOpen) return null;

  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  const activeUser = user || currentUser;
  const finalUserName = userDisplayName || (activeUser?.displayName) || (activeUser?.email ? activeUser.email.split('@')[0] : (isAr ? 'مستخدم كورة' : 'Kora User'));
  const numericId = getUserOrGuestNumericId(activeUser);

  const handleSelectPackage = (pkg: ProPackage) => {
    setSelectedPackage(pkg);
    setShowConfirmAlert(true);
  };

  const handleConfirmRedirectWhatsApp = () => {
    if (!selectedPackage) return;

    const packageName = isAr ? selectedPackage.nameAr : selectedPackage.nameEn;
    const waMessage = `مرحبا ${finalUserName}
id الحساب: ${numericId}
أود أن اشتري باقة ${packageName}`;

    const waUrl = `https://wa.me/message/FA7GVHEJ7Q7RH1?text=${encodeURIComponent(waMessage)}`;

    setShowConfirmAlert(false);
    onClose();

    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900 border-amber-500/40 text-slate-100 shadow-amber-950/40'
            : 'bg-white border-amber-400 text-slate-900 shadow-amber-500/20'
        }`}
      >
        {/* Modal Top Header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950/40 border border-amber-300/60 flex items-center justify-center text-xl shadow-inner">
              👑
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {isAr ? 'اشتراكات برو 👑 (شحن الكوينز)' : 'Kora PRO Subscriptions 👑'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black uppercase tracking-wider">
                  VIP
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                {isAr ? 'اشحن كوينز التوقعات وشارك في جميع مباريات اليوم ⚡' : 'Get coins instantly for all match predictions'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 active:scale-95 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Status Bar & Notice */}
        <div className={`px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-semibold ${
          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-amber-50/70 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">👤 {finalUserName}</span>
            <span className="text-slate-400">|</span>
            <span className="font-mono text-[11px] bg-slate-800/15 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              ID: {numericId}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>{isAr ? 'رصيدك الحالي:' : 'Current Balance:'}</span>
            <span className="font-mono font-black text-amber-500 dark:text-amber-400 text-sm">
              {userPoints} 🪙
            </span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="px-5 pt-3 pb-1">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-400/30 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-300">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{isAr ? 'كل توقع لأي مباراة يكلف ٥ كوينز فقط 🎯' : 'Every match prediction costs only 5 coins'}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {isAr
                ? 'وعند صحة النتيجة الدقيقة تربح ٥٠ كوينز مباشرة لرصيدك! اختر باقتك المفضلة وسيتم تحويلك فوراً للدعم لتفعيلها.'
                : 'Predict exact score and earn +50 coins to your balance! Select your preferred pack below.'}
            </p>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRO_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg)}
                className={`relative rounded-2xl p-4 border-2 transition-all cursor-pointer active:scale-98 flex flex-col justify-between group ${
                  pkg.vip
                    ? isDark
                      ? 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-yellow-950/50 border-amber-400 hover:border-amber-300 shadow-lg shadow-amber-950/30'
                      : 'bg-gradient-to-br from-amber-50 via-white to-amber-100/50 border-amber-500 hover:border-amber-600 shadow-md shadow-amber-500/15'
                    : pkg.popular
                    ? isDark
                      ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-400 hover:border-emerald-300 shadow-md'
                      : 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 border-emerald-500 hover:border-emerald-600 shadow-md'
                    : isDark
                    ? 'bg-slate-800/60 border-slate-700 hover:border-amber-400/60'
                    : 'bg-slate-50 border-slate-200 hover:border-amber-400'
                }`}
              >
                {/* Badge Tag */}
                {pkg.tagAr && (
                  <div className="absolute -top-2.5 right-4 rtl:right-4 rtl:left-auto left-auto px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-sm bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
                    {isAr ? pkg.tagAr : pkg.tagEn}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{pkg.icon}</span>
                      <h4 className="font-black text-sm sm:text-base">
                        {isAr ? pkg.nameAr : pkg.nameEn}
                      </h4>
                    </div>
                  </div>

                  {/* Coin Amount & Price */}
                  <div className="my-2.5 flex items-baseline justify-between">
                    <div className="flex items-center gap-1.5 font-black text-amber-500 dark:text-amber-400 text-xl sm:text-2xl font-mono">
                      <span>{pkg.coins}</span>
                      <span className="text-sm font-sans font-bold">🪙 {isAr ? 'كوينز' : 'Coins'}</span>
                    </div>
                    <div className="text-right rtl:text-left">
                      <span className="font-black text-lg sm:text-xl text-emerald-600 dark:text-emerald-400 font-mono">
                        {pkg.priceEgp}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 rtl:mr-1">
                        {isAr ? 'جنيه' : 'EGP'}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 py-2 border-t border-slate-700/20 dark:border-slate-700/60">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isAr ? `تكفي لتوقع ${pkg.matchesCount} مباراة كاملة ⚽` : `Sufficient for ${pkg.matchesCount} match predictions`}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{isAr ? 'تفعيل فوري وآمن خلال دقيقة واحدة' : 'Instant activation via WhatsApp'}</span>
                    </div>
                  </div>
                </div>

                {/* Choose Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPackage(pkg);
                  }}
                  className={`mt-3 w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                    pkg.vip
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-amber-500/20'
                      : pkg.popular
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                  }`}
                >
                  <span>{isAr ? 'اختيار هذه الباقة' : 'Select Pack'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            ))}
          </div>

          {/* Payment Methods Notice */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">💳</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'طرق الدفع المتاحة: إنستاباي (InstaPay) - فودافون كاش - محافظ إلكترونية' : 'Available Payment: InstaPay, Vodafone Cash & E-Wallets'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Alert Dialog (رسالة تنبيه على الشاشة: موافق وإلغاء) */}
      {showConfirmAlert && selectedPackage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className={`w-full max-w-sm rounded-3xl p-5 border-2 shadow-2xl space-y-4 text-center ${
            isDark ? 'bg-slate-900 border-amber-400 text-slate-100' : 'bg-white border-amber-500 text-slate-900'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-amber-500/30">
              🪙
            </div>

            <div>
              <h4 className="text-base font-black text-amber-500 dark:text-amber-400">
                {isAr ? 'تأكيد طلب باقة اشتراك برو' : 'Confirm Pro Subscription'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr ? 'مراجعة بيانات الحساب والباقة المختارة قبل التحويل' : 'Review account details before continuing'}
              </p>
            </div>

            {/* Static Review Details (User Name, Account ID, Package) */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-right rtl:text-right text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">{isAr ? 'اسم المستخدم:' : 'User Name:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {finalUserName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">{isAr ? 'الرقم التعريفي (الحساب):' : 'Account ID:'}</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  {numericId}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">{isAr ? 'الباقة المختارة:' : 'Selected Pack:'}</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {isAr ? selectedPackage.nameAr : selectedPackage.nameEn}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">{isAr ? 'السعر المطلوب:' : 'Total Price:'}</span>
                <span className="font-mono font-black text-base text-slate-900 dark:text-white">
                  {selectedPackage.priceEgp} {isAr ? 'جنيه مصري' : 'EGP'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'بالضغط على "موافق"، سيتم تحويلك فوراً إلى محادثة واتساب الرسمية مع الدعم الفني لإرسال كود فودافون كاش أو إنستاباي وتفعيل الكوينز في حسابك.'
                : 'Clicking "Confirm" will redirect you to official WhatsApp chat with support to complete payment and activate your coins.'}
            </p>

            {/* Actions: موافق (Confirm) & إلغاء (Cancel) */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmRedirectWhatsApp}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isAr ? 'موافق (واتساب 💬)' : 'Confirm (WhatsApp 💬)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmAlert(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
