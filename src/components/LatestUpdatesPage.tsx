import React, { useState } from 'react';
import { Language } from '../types';
import { 
  Sparkles, 
  Pin, 
  Smartphone, 
  CheckCircle2, 
  Coins, 
  Bell, 
  History, 
  ChevronLeft, 
  ExternalLink,
  Download,
  Gift,
  ShieldCheck,
  Tag,
  ArrowRight,
  Info,
  Calendar,
  X
} from 'lucide-react';

interface LatestUpdatesPageProps {
  language: Language;
  onBack?: () => void;
  onInstallApp?: () => void;
}

export interface UpdateItem {
  id: string;
  isPinned?: boolean;
  date: string;
  titleAr: string;
  titleEn: string;
  type: 'FEATURE_ADDED' | 'FEATURE_REMOVED' | 'SYSTEM_UPDATE' | 'PRICE_CHANGE';
  typeAr: string;
  typeEn: string;
  summaryAr: string;
  summaryEn: string;
  detailsAr?: string[];
  detailsEn?: string[];
  showInstallScreenshot?: boolean;
}

const UPDATES_LOG: UpdateItem[] = [
  {
    id: 'install-guide-pwa',
    isPinned: true,
    date: 'خبر أزلي مثبت 📌',
    titleAr: 'طريقة تثبيت الموقع على الموبايل كـ تطبيق (إنشاء اختصار)',
    titleEn: 'How to Install Website on Mobile as an App (Add Shortcut)',
    type: 'FEATURE_ADDED',
    typeAr: 'دليل التثبيت 📲',
    typeEn: 'Install Guide 📲',
    summaryAr: 'خطوات سهلة لتثبيت موقع كورة على الشاشة الرئيسية لهاتفك وتصفحه بنقرة واحدة تماماً كأي تطبيق أندرويد أو آيفون.',
    summaryEn: 'Easy steps to pin Kora app to your mobile home screen for 1-tap instant access like a native app.',
    showInstallScreenshot: true,
    detailsAr: [
      'افتح قائمة خيارات المتصفح (الثلاث نقاط vertical ⋮ بالفي الأعلى على أندرويد أو زر المشاركة ⎋ على آيفون).',
      'ابحث عن خيار "التثبيت وإنشاء اختصار" (المعلم بالدائرة الحمراء في الصورة الموضحة بالأسفل).',
      'اضغط على "إضافة" أو "تثبيت" وسيتكون اللوجو على شاشة هاتفك فوراً.',
    ],
    detailsEn: [
      'Open browser menu (⋮ top right on Android or Share icon ⎋ on iOS).',
      'Locate and tap "Install & Create Shortcut" (circled in red in screenshot below).',
      'Tap "Add" or "Install" to add Kora directly to your mobile home screen.',
    ]
  },
  {
    id: 'update-anti-duplicate-matches-aug2026',
    date: '15 أغسطس 2026',
    titleAr: 'منع تكرار المباريات وفلترة دقيقة للمباريات والفرق',
    titleEn: 'Anti-Duplicate Match Engine & Enhanced Fixture Deduplication',
    type: 'SYSTEM_UPDATE',
    typeAr: 'تحديث برمجي 🛡️',
    typeEn: 'System Update 🛡️',
    summaryAr: 'تطبيق خوارزمية ذكية تضمن عدم تكرار أي مباراة لنفس الفريقين في نفس اليوم نهائياً، مع معالجة الأسماء المتباينة باللغتين العربية والإنجليزية.',
    summaryEn: 'Implemented intelligent fixture deduplication ensuring no two matches feature the same teams on the same day.',
    detailsAr: [
      'فحص شامل وحذف أي مواجهات مكررة أو مسجلة مرتين في نفس التاريخ.',
      'فلترة ديناميكية تلقائية تضمن بقاء جدول المباريات نقياً ودقيقاً 100%.',
      'مطابقة ذكية لأسماء الأندية حتى مع اختلاف التشكيل أو الحروف.'
    ],
    detailsEn: [
      'Full scan & removal of duplicate fixture entries across all leagues.',
      'Dynamic automated deduplication guaranteeing 100% clean schedules.',
      'Smart team name normalization across both Arabic and English.'
    ]
  },
  {
    id: 'update-featured-tournaments-aug2026',
    date: '15 أغسطس 2026',
    titleAr: 'إضافة قسم البطولات المميزة 🏆 وشريط التنقل الجديد',
    titleEn: 'Featured Tournaments Hub 🏆 Added to Navigation',
    type: 'FEATURE_ADDED',
    typeAr: 'ميزة جديدة 🏆',
    typeEn: 'New Feature 🏆',
    summaryAr: 'تم تدشين قسم «البطولات المميزة 🏆» بجوار قسم المباريات في شريط التنقل، مع بطاقة أنيقة لمتابعة جديد البطولات والجوائز فور إطلاقها.',
    summaryEn: 'Launched the new Featured Tournaments tab right next to Matches in the main navigation with upcoming event tracking.',
    detailsAr: [
      'إتاحة تبويب البطولات المميزة في شريط التنقل السفلي والعلوي.',
      'رسالة تفاعلية وإشعار استباقي بأحدث البطولات والمسابقات المرتقبة.'
    ],
    detailsEn: [
      'Integrated Featured Tournaments tab in both bottom and top navigation.',
      'Interactive hub keeping users ready for upcoming big tournament competitions.'
    ]
  },
  {
    id: 'update-compact-mobile-ui-aug2026',
    date: '15 أغسطس 2026',
    titleAr: 'تصغير وتحسين أبعاد وتصميم الموقع للشاشات (Mobile Compact UI)',
    titleEn: 'Optimized Mobile Compact Layout & Proportional Scaling',
    type: 'SYSTEM_UPDATE',
    typeAr: 'تحسين التصميم 📱',
    typeEn: 'Design Polish 📱',
    summaryAr: 'تم ضبط وتصغير العرض الداخلي للموقع وحجم بطاقات المباريات والشعارات لتقديم تجربة عرض مريحة وسريعة ومثالية لجميع الهواتف.',
    summaryEn: 'Refined container widths and scaled down match cards and logos for a super comfortable, compact mobile-first experience.',
    detailsAr: [
      'تصغير عرض الحاوية الرئيسية (max-w-lg) لمنع التمدد الزائد على الشاشات الكبيرة.',
      'ضبط مقاسات شعارات الأندية، الحشو، وأزرار التوقع لتكون مدمجة وأنيقة.',
      'تحسين المسافات الرأسية لتسهيل تصفح عدد أكبر من المباريات بلمحة واحدة.'
    ],
    detailsEn: [
      'Refined main container max-width to max-w-lg for sleek mobile ergonomics.',
      'Proportionally balanced team logos, padding, and predict action buttons.',
      'Optimized vertical rhythm to fit more match fixtures seamlessly in view.'
    ]
  },
  {
    id: 'update-stadium-audio-aug2026',
    date: '14 أغسطس 2026',
    titleAr: 'تأثيرات وأصوات الاستاد الحية والهتافات الجماهيرية 🔊',
    titleEn: 'Live Stadium Crowd Ambience Sound & Audio Atmosphere',
    type: 'FEATURE_ADDED',
    typeAr: 'ميزة جديدة 🔊',
    typeEn: 'New Feature 🔊',
    summaryAr: 'إمكانية تشغيل أصوات وهتافات الملاعب الحماسية مباشرة من شريط الرأس لتعيش أجواء مباريات كرة القدم الحقيقية أثناء التصفح.',
    summaryEn: 'Toggle live crowd chants & stadium atmosphere sound directly from the header while browsing match scores.',
    detailsAr: [
      'زر تحكم سريع في شريط الرأس لتشغيل وإيقاف صوت هتاف الجماهير.',
      'توليد أصوات ملاعب متناغمة وبجودة عالية خفيفة على الأجهزة.'
    ],
    detailsEn: [
      'Quick audio toggle button in the top header with active visual equalizer indicator.',
      'High-performance ambient crowd synthesizer designed for smooth browsing.'
    ]
  },
  {
    id: 'update-kora-ai-assistant-aug2026',
    date: '13 أغسطس 2026',
    titleAr: 'إطلاق محلل الذكاء الاصطناعي لكورة (Kora AI Soccer Analyst) 🤖',
    titleEn: 'Launched Kora AI Soccer Tactical Analyst 🤖',
    type: 'FEATURE_ADDED',
    typeAr: 'ميزة جديدة 🤖',
    typeEn: 'New Feature 🤖',
    summaryAr: 'مساعد ذكي متخصص في كرة القدم يقدم تحليلات تكتيكية، مقارنة التشكيلات، إحصائيات المباريات، وتوقعات رياضية متقدمة.',
    summaryEn: 'Specialized football AI assistant providing deep tactical analysis, lineup breakdowns, match stats, and smart predictions.',
    detailsAr: [
      'تحليل فني متكامل لكل مباراة في نافذة التفاصيل عبر الذكاء الاصطناعي.',
      'محادثة مباشرة مع روبوت كورة للإجابة عن التكتيكات وأخبار الأندية.'
    ],
    detailsEn: [
      'Deep AI-powered match analysis integrated directly into match details.',
      'Interactive chat assistant for football stats, tactics, and club insights.'
    ]
  },
  {
    id: 'update-prizes-reduction-aug2026',
    date: '12 أغسطس 2026',
    titleAr: 'تحديث جوائز الكاش وتخفيض أسعار الكوينز بـ 100 كوينز',
    titleEn: 'Cash Prize Costs Reduced by 100 Coins & Prize Tier Updates',
    type: 'PRICE_CHANGE',
    typeAr: 'تخفيض أسعار الجوائز 💸',
    typeEn: 'Prize Price Drop 💸',
    summaryAr: 'تم حذف جائزة الـ 25 جنيه كاش، مع تخفيض كلفة جميع جوائز الكاش المتبقية بمقدار 100 كوينز كاملة لتسريع عملية الاستبدال!',
    summaryEn: 'Removed 25 EGP reward and lowered all remaining cash rewards by 100 coins for easier redemption!',
    detailsAr: [
      'حذف جائزة الـ 25 جنيه كاش من المتجر.',
      'تخفيض كارت الـ 50 جنيه إلى 400 كوينز (بدلاً من 500 كوينز).',
      'تخفيض كارت الـ 100 جنيه إلى 600 كوينز (بدلاً من 700 كوينز).',
      'تخفيض كارت الـ 150 جنيه إلى 750 كوينز (بدلاً من 850 كوينز).',
      'تخفيض كارت الـ 200 جنيه إلى 900 كوينز (بدلاً من 1000 كوينز).'
    ],
    detailsEn: [
      'Removed 25 EGP cash tier.',
      'Reduced 50 EGP cash reward to 400 coins (was 500).',
      'Reduced 100 EGP cash reward to 600 coins (was 700).',
      'Reduced 150 EGP cash reward to 750 coins (was 850).',
      'Reduced 200 EGP cash reward to 900 coins (was 1000).'
    ]
  },
  {
    id: 'update-reset-coins-aug2026',
    date: '12 أغسطس 2026',
    titleAr: 'تصفير رصيد الكوينز لجميع الحسابات لضمان التكافؤ',
    titleEn: 'Resetting User Coins Balance to 0 for Fair Play',
    type: 'SYSTEM_UPDATE',
    typeAr: 'تصفير الكوينز 🪙',
    typeEn: 'Coins Reset 🪙',
    summaryAr: 'تم تصفير الكوينز لجميع المستخدمين لضمان انطلاقة جديدة ومنافسة عادلة ومتكافئة بين الجميع على جوائز الكاش.',
    summaryEn: 'Coins balance reset to 0 for all users to ensure a fresh, fair competitive start for cash prizes.',
    detailsAr: [
      'إعادة تعيين رصيد الكوينز الحلي إلى 0 كوينز للجميع.',
      'مكافآت التوقع الصحيح دقيق المباشر تمنحك +50 كوينز كربح فوري متكافئ.'
    ],
    detailsEn: [
      'Reset total coins balance to 0 for all registered & guest accounts.',
      'Exact match score predictions continue to grant +50 coins directly.'
    ]
  },
  {
    id: 'update-remove-daily-gift-aug2026',
    date: '10 أغسطس 2026',
    titleAr: 'إلغاء الهدية اليومية وتوحيد كسب الكوينز من التوقعات',
    titleEn: 'Removal of Daily Login Bonus in Favor of Match Predictions',
    type: 'FEATURE_REMOVED',
    typeAr: 'حذف ميزة ❌',
    typeEn: 'Feature Removed ❌',
    summaryAr: 'تم إزالة الهدية اليومية (+25 كوينز) نهائياً من جميع صفحات الموقع بما فيها صفحات التسجيل والدخول والبروفايل.',
    summaryEn: 'Daily login bonus (+25 coins) completely removed across all sign-in and profile pages.',
    detailsAr: [
      'إلغاء زر وبوب أب الهدية اليومية من كل صفحات التطبيق.',
      'التركيز الكامل على كسب الكوينز من خلال التوقع الصحيح لنتائج المباريات المباشرة.'
    ],
    detailsEn: [
      'Removed daily gift claim buttons & popups from app.',
      'All rewards now tied purely to accurate match predictions.'
    ]
  },
  {
    id: 'update-push-notifications-aug2026',
    date: '8 أغسطس 2026',
    titleAr: 'تفعيل إشعارات المتصفح الفورية للأهداف والمباريات المباشرة',
    titleEn: 'Instant Push Notifications for Goals & Kickoffs Enabled',
    type: 'FEATURE_ADDED',
    typeAr: 'ميزة جديدة 🔔',
    typeEn: 'New Feature 🔔',
    summaryAr: 'إضافة نظام تنبيهات وإشعارات المتصفح الفورية لتلقي إشعار فوري عند انطلاق أي مباراة أو تسجيل هدف.',
    summaryEn: 'Added real-time browser push notification alerts for match kickoffs and goals.',
    detailsAr: [
      'تفعيل زر الإشعارات الفورية في صفحة الحساب الشخصي.',
      'وصول تنبيهات صوتية ومصورة بالنتائج فور تغيرها.'
    ],
    detailsEn: [
      'Toggle push notifications from your Account settings.',
      'Receive instant alerts when goals are scored.'
    ]
  }
];

export const LatestUpdatesPage: React.FC<LatestUpdatesPageProps> = ({
  language,
  onBack,
  onInstallApp,
}) => {
  const isAr = language === 'ar';
  const [selectedScreenshotModal, setSelectedScreenshotModal] = useState<boolean>(false);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950/80 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-950/50">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400 text-2xl font-black">
                🚀
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {isAr ? 'آخر التحديثات والتغيرات' : 'Latest Updates & Changelog'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold animate-pulse">
                  {isAr ? 'تحديثات مستمرة ⚡' : 'Live Log ⚡'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {isAr 
                  ? 'سجل شامل بجميع الميزات المضافة، التعديلات، والتعليمات المهمة الخاصة بتطبيق كورة.'
                  : 'Complete history of added features, updates, and installation guides.'}
              </p>
            </div>
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label={isAr ? 'إغلاق الصفحة والرجوع' : 'Close & Back'}
              title={isAr ? 'إغلاق الصفحة والرجوع (×)' : 'Close & Back (×)'}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 active:bg-rose-700 text-white font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer border border-rose-400/50 flex items-center gap-1.5 active:scale-95 ring-1 ring-white/20 shrink-0 self-end sm:self-center"
            >
              <X className="w-4 h-4 text-white" strokeWidth={3} />
              <span>{isAr ? 'إغلاق (×)' : 'Close (×)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Updates Log Items */}
      <div className="space-y-5">
        {UPDATES_LOG.map((item) => (
          <div
            key={item.id}
            className={`rounded-3xl p-5 sm:p-6 transition-all shadow-xl relative overflow-hidden ${
              item.isPinned
                ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/90 border-2 border-emerald-400/60 shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Top Ribbon for Pinned Status */}
            {item.isPinned && (
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-500/30">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black flex items-center gap-1.5 shadow-md">
                  <Pin className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span>{isAr ? 'خبر أزلي مثبت (هام جداً 📌)' : 'Pinned Announcement 📌'}</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                  {item.date}
                </span>
              </div>
            )}

            {!item.isPinned && (
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className={`px-2.5 py-1 rounded-xl font-bold border ${
                  item.type === 'FEATURE_ADDED' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' :
                  item.type === 'PRICE_CHANGE' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' :
                  item.type === 'FEATURE_REMOVED' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' :
                  'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                }`}>
                  {isAr ? item.typeAr : item.typeEn}
                </span>

                <span className="text-slate-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.date}</span>
                </span>
              </div>
            )}

            {/* Title & Summary */}
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>{isAr ? item.titleAr : item.titleEn}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                {isAr ? item.summaryAr : item.summaryEn}
              </p>
            </div>

            {/* Detailed Bullet Points if available */}
            {((item.detailsAr && item.detailsAr.length > 0) || (item.detailsEn && item.detailsEn.length > 0)) && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs sm:text-sm">
                <p className="font-extrabold text-amber-300 text-xs mb-2 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'التفاصيل والخطوات المتبعة:' : 'Details & Actions:'}</span>
                </p>
                <ul className="space-y-2">
                  {(isAr ? item.detailsAr : item.detailsEn)?.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-slate-200 font-bold">
                      <span className="w-5 h-5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Installation Screenshot Section for Pinned Item */}
            {item.showInstallScreenshot && (
              <div className="mt-5 space-y-4 pt-4 border-t border-emerald-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-emerald-300 text-sm sm:text-base flex items-center gap-2">
                      <span>📸</span>
                      <span>{isAr ? 'الصورة الموضحة لزر التثبيت بالمتصفح:' : 'Browser Installation Screenshot:'}</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {isAr ? 'لاحظ الخيار المعلم بالدائرة الحمراء (التثبيت وإنشاء اختصار)' : 'Notice the red-circled menu item "التثبيت وإنشاء اختصار"'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (onInstallApp) onInstallApp();
                      // @ts-ignore
                      if (window.deferredPwaPrompt) {
                        try {
                          // @ts-ignore
                          window.deferredPwaPrompt.prompt();
                        } catch (e) {}
                      }
                      const evt = new CustomEvent('kora_trigger_pwa_install');
                      window.dispatchEvent(evt);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Smartphone className="w-4 h-4 text-slate-950" />
                    <span>{isAr ? 'اضغط هنا للتثبيت الآن 📲' : 'Click to Install Now 📲'}</span>
                  </button>
                </div>

                {/* Pixel-Perfect Mobile Browser UI Card displaying the Screenshot */}
                <div className="relative mx-auto max-w-sm rounded-3xl overflow-hidden border-2 border-emerald-400/50 shadow-2xl bg-slate-950 group">
                  {/* Browser Popup Overlay Card (Recreating the Exact Menu from User Screenshot) */}
                  <div className="p-4 bg-slate-900/95 space-y-3 border-b border-slate-800 text-right rtl:text-right">
                    {/* Top Browser Bar */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs">↻</span>
                        <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs">⬇</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-white text-xs">
                        <span>كورة ⚽</span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="p-2 rounded-lg hover:bg-slate-800 text-slate-300">نسخ الرابط</div>
                      <div className="p-2 rounded-lg hover:bg-slate-800 text-slate-300">عرض الصفحات المحفوظة</div>
                      <div className="p-2 rounded-lg hover:bg-slate-800 text-slate-300">إزالة النتيجة</div>
                      <div className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center justify-between">
                        <span>فتح في متصفَّح Chrome</span>
                        <span>↗</span>
                      </div>
                      <div className="p-2 rounded-lg hover:bg-slate-800 text-slate-300">سجل Chrome</div>
                      <div className="p-2 rounded-lg hover:bg-slate-800 text-slate-300">البحث في الصفحة</div>

                      {/* Encircled Menu Item - Exact Match to User Screenshot */}
                      <div className="relative my-2 p-3 rounded-2xl bg-slate-950 border-2 border-red-500 text-white font-black flex items-center justify-between shadow-xl ring-4 ring-red-500/20 animate-pulse">
                        <span className="text-sm text-amber-300">التثبيت وإنشاء اختصار</span>
                        <span className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px]">المعلم بالدائرة 🔴</span>

                        {/* Red Marker Circle Overlay */}
                        <div className="absolute -inset-1 border-2 border-dashed border-red-400 rounded-2xl pointer-events-none" />
                      </div>

                      <div className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center justify-between">
                        <span>موقع مصمَّم للكمبيوتر</span>
                        <input type="checkbox" readOnly className="rounded" />
                      </div>
                      <div className="p-2 rounded-lg hover:bg-slate-800 text-slate-300">ترجمة...</div>
                      <div className="p-2 rounded-lg hover:bg-slate-800 text-slate-300">عناصر التحكُّم في الموقع</div>
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="p-3 bg-slate-900 text-center text-xs font-bold text-emerald-300 border-t border-slate-800 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isAr ? 'افتح القائمة واضغط على الزر الموضح بالدائرة الحمراء' : 'Open menu & tap the red-encircled button'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
