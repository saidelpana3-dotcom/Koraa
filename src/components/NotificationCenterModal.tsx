import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, CheckCircle2, ShieldAlert, Goal, Clock, Sparkles, Volume2, Trash2, Smartphone, ShieldCheck, Timer } from 'lucide-react';
import { Language, MatchSubscription, PushNotificationLog } from '../types';
import { 
  requestPushPermissionAndToken, 
  playNotificationChime, 
  sendMatchLiveNotification,
  getGlobalSmartReminderInterval,
  setGlobalSmartReminderInterval,
  isGlobalSmartReminderEnabled,
  setGlobalSmartReminderEnabled
} from '../lib/notifications';
import { db, doc, deleteDoc } from '../lib/firebase';

interface NotificationCenterModalProps {
  language: Language;
  userId: string | null;
  subscriptions: MatchSubscription[];
  notificationsLog: PushNotificationLog[];
  onClose: () => void;
  onSignInRequired: () => void;
  onOpenMatchDetails?: (matchId: string, tab?: 'lineup' | 'stats' | 'events' | 'ai' | 'predict') => void;
}

const REMINDER_OPTIONS = [
  { value: 15, labelAr: '١٥ دقيقة', labelEn: '15 Mins' },
  { value: 30, labelAr: '٣٠ دقيقة', labelEn: '30 Mins' },
  { value: 45, labelAr: '٤٥ دقيقة', labelEn: '45 Mins' },
  { value: 60, labelAr: 'ساعة (60 د)', labelEn: '1 Hour' },
  { value: 120, labelAr: 'ساعتان (120 د)', labelEn: '2 Hours' },
];

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  language,
  userId,
  subscriptions,
  notificationsLog,
  onClose,
  onSignInRequired,
  onOpenMatchDetails,
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'subs' | 'history' | 'settings'>('subs');
  const [permissionStatus, setPermissionStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [testSent, setTestSent] = useState(false);
  const [predTestSent, setPredTestSent] = useState(false);
  const [smartReminderSent, setSmartReminderSent] = useState(false);

  // Lock body scroll on mount
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Smart Reminder Settings State
  const [globalReminderOn, setGlobalReminderOn] = useState<boolean>(isGlobalSmartReminderEnabled());
  const [globalInterval, setGlobalInterval] = useState<number>(getGlobalSmartReminderInterval());

  const handleGlobalReminderToggle = (enabled: boolean) => {
    setGlobalReminderOn(enabled);
    setGlobalSmartReminderEnabled(enabled);
  };

  const handleGlobalIntervalChange = (minutes: number) => {
    setGlobalInterval(minutes);
    setGlobalSmartReminderInterval(minutes);
  };

  const handleRequestPermission = async () => {
    const { granted } = await requestPushPermissionAndToken();
    setPermissionStatus(granted ? 'granted' : 'denied');
  };

  const handleUnsubscribe = async (subId: string) => {
    try {
      await deleteDoc(doc(db, 'matchSubscriptions', subId));
    } catch (err) {
      console.error('Error deleting subscription:', err);
    }
  };

  const handleTestTrigger = () => {
    playNotificationChime('GOAL');
    sendMatchLiveNotification({
      matchId: 'demo-test',
      title: '⚽ GOAL TEST ALERT!',
      titleAr: '⚽ تجربة إشعار هدف مباشر!',
      body: 'Real Madrid 1 - 0 Barcelona (Benzema 24\')',
      bodyAr: 'تم تسجيل هدف! ريال مدريد 1 - 0 برشلونة (بنزيما دقيقة 24\')',
      type: 'GOAL'
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleTestSmartReminderTrigger = () => {
    playNotificationChime('REMINDER');
    const intervalLabel = REMINDER_OPTIONS.find(o => o.value === globalInterval);
    const intervalText = isAr ? intervalLabel?.labelAr : intervalLabel?.labelEn;

    sendMatchLiveNotification({
      matchId: 'demo-smart-reminder',
      title: `⏰ Smart Reminder (${globalInterval}m): Real Madrid vs Barcelona`,
      titleAr: `⏰ تذكير ذكي (${intervalText}): ريال مدريد ضد برشلونة`,
      body: `Match kicks off in ${intervalText} (at 21:00)! Submit your score prediction now.`,
      bodyAr: `المباراة تنطلق بعد ${intervalText} (الساعة 21:00) ⏳ شارك توقعك الآن قبل انطلاق صافرة البداية!`,
      homeTeam: 'Real Madrid',
      homeTeamAr: 'ريال مدريد',
      awayTeam: 'Barcelona',
      awayTeamAr: 'برشلونة',
      ctaText: '🎯 Predict Now',
      ctaTextAr: '🎯 اتوقع الان',
      type: 'SMART_REMINDER',
      reminderMinutes: globalInterval
    });
    setSmartReminderSent(true);
    setTimeout(() => setSmartReminderSent(false), 3000);
  };

  const handleTestPredictionTrigger = () => {
    sendMatchLiveNotification({
      matchId: 'demo-pred',
      title: '🔥 Tomorrow\'s Clash: Liverpool vs Arsenal',
      titleAr: '🔥 قمة الغد المرتقبة: ليفربول ضد أرسنال',
      body: 'Match tomorrow at 21:00. Predict now and earn +50 coins!',
      bodyAr: 'المباراة غداً في تمام الساعة 21:00 ⏰ بادر بتوقع النتيجة الآن واكسب 50 كوينز!',
      homeTeam: 'Liverpool',
      homeTeamAr: 'ليفربول',
      awayTeam: 'Arsenal',
      awayTeamAr: 'أرسنال',
      ctaText: '🎯 Predict Now',
      ctaTextAr: '🎯 اتوقع الان',
      type: 'PRE_MATCH_DAY_BEFORE'
    });
    setPredTestSent(true);
    setTimeout(() => setPredTestSent(false), 3000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {isAr ? 'مركز الإشعارات والتذكير الذكي (Push Alerts)' : 'Push Center & Smart Reminders'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'تنبيهات فورية وتذكيرات قبل انطلاق المباريات' : 'Manage your match alert subscriptions and kickoff reminders'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            title={isAr ? 'إغلاق (×)' : 'Close (×)'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800/95 hover:bg-rose-600 active:bg-rose-700 text-white border border-slate-700 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
          <button
            onClick={() => setActiveTab('subs')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'subs'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isAr ? 'المباريات المشترك بها' : 'Subscriptions'}</span>
            {subscriptions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black">
                {subscriptions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? 'سجل التنبيهات' : 'Alert History'}</span>
            {notificationsLog.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                {notificationsLog.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعدادات التذكير' : 'Reminder Settings'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 min-h-[300px]">
          
          {/* TAB 1: Subscriptions List */}
          {activeTab === 'subs' && (
            <div className="space-y-2.5">
              {!userId ? (
                <div className="p-6 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                  <BellOff className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-300">
                    {isAr ? 'قم بتسجيل الدخول لحفظ واشتراك إشعارات مبارياتك المفضلة وتخصيص وقت التذكير' : 'Sign in to save subscriptions and customize smart reminders'}
                  </p>
                  <button
                    onClick={onSignInRequired}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {isAr ? 'تسجيل الدخول' : 'Sign In'}
                  </button>
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <Goal className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">
                    {isAr ? 'لم تشترك في أي مباراة بعد' : 'No active match subscriptions yet'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? 'اضغط على أيقونة الجرس 🔔 على بطاقة أية مباراة لتفعيل التنبيهات المباشرة والتذكير الذكي' : 'Click the 🔔 bell icon on any match card to activate instant alerts and reminders'}
                  </p>
                </div>
              ) : (
                subscriptions.map((sub) => {
                  const reminderMins = sub.reminderIntervalMinutes || 30;
                  const intervalObj = REMINDER_OPTIONS.find(o => o.value === reminderMins);
                  const intervalStr = isAr ? intervalObj?.labelAr || `${reminderMins} د` : intervalObj?.labelEn || `${reminderMins}m`;

                  return (
                    <div
                      key={sub.id}
                      className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-100">
                          <span>{isAr ? sub.homeTeamAr || sub.homeTeam : sub.homeTeam}</span>
                          <span className="text-amber-400 text-[10px]">VS</span>
                          <span>{isAr ? sub.awayTeamAr || sub.awayTeam : sub.awayTeam}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-emerald-400 font-medium">
                          {sub.notifySmartReminder !== false && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-bold">
                              <Timer className="w-3 h-3 text-amber-400" />
                              <span>{isAr ? `تذكير قبل الماتش بـ ${intervalStr}` : `Reminder: ${intervalStr} before`}</span>
                            </span>
                          )}
                          {sub.notifyGoals && <span>⚽ {isAr ? 'أهداف' : 'Goals'}</span>}
                          {sub.notifyStart && <span>🏁 {isAr ? 'البداية' : 'Kickoff'}</span>}
                          {sub.notifyRedCards && <span>🟥 {isAr ? 'كروت' : 'Cards'}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnsubscribe(sub.id)}
                        title={isAr ? 'إلغاء الاشتراك' : 'Unsubscribe'}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: Notifications History Log */}
          {activeTab === 'history' && (
            <div className="space-y-2.5">
              {notificationsLog.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">
                    {isAr ? 'لا توجد تنبيهات مسجلة مؤخراً' : 'No recent match alerts recorded'}
                  </p>
                </div>
              ) : (
                notificationsLog.map((log) => {
                  const isSmartReminder = log.type === 'SMART_REMINDER';
                  const isPredType = isSmartReminder || log.type === 'PRE_MATCH_DAY_BEFORE' || log.type === 'MATCH_DAY_MORNING' || log.type === 'PRE_MATCH_COUNTDOWN';
                  const homeTxt = isAr ? log.homeTeamAr || log.homeTeam : log.homeTeam;
                  const awayTxt = isAr ? log.awayTeamAr || log.awayTeam : log.awayTeam;

                  return (
                    <div
                      key={log.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                        isSmartReminder
                          ? 'bg-slate-950 border-amber-500/50 shadow-sm shadow-amber-950/30'
                          : isPredType
                          ? 'bg-slate-950 border-amber-500/40 shadow-sm shadow-amber-950/30'
                          : 'bg-slate-800/60 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={`flex items-center gap-1.5 ${isSmartReminder ? 'text-amber-300 font-black' : isPredType ? 'text-amber-400 font-black' : 'text-emerald-400'}`}>
                          {log.type === 'SMART_REMINDER' ? '⏰' : log.type === 'GOAL' ? '⚽' : log.type === 'MATCH_START' ? '🏁' : '🎯'}
                          {isAr ? log.titleAr || log.title : log.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {homeTxt && awayTxt && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-100 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                          <span>{homeTxt}</span>
                          <span className="text-amber-400 text-[10px]">⚔️</span>
                          <span>{awayTxt}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-200">
                        {isAr ? log.bodyAr || log.body : log.body}
                      </p>

                      {/* Call to Action button for prediction/reminder notification */}
                      {isPredType && log.matchId && (
                        <button
                          onClick={() => {
                            if (onOpenMatchDetails) {
                              onOpenMatchDetails(log.matchId, 'predict');
                              onClose();
                            }
                          }}
                          className="w-full mt-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95 transition-all"
                        >
                          <span>🎯</span>
                          <span>{isAr ? 'اتوقع الان' : 'Predict Now'}</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: Settings & Permissions */}
          {activeTab === 'settings' && (
            <div className="space-y-3 text-xs">
              
              {/* SMART REMINDER CONFIGURATION CARD (User-Requested) */}
              <div className="p-3.5 bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl border border-amber-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Timer className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-amber-300 text-xs sm:text-sm">
                        {isAr ? '⏰ التذكير الذكي قبل صافرة البداية' : '⏰ Smart Kickoff Reminder'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {isAr ? 'حدد الفترة الزمنية المفضلة للتنبيه قبل بدء المباراة' : 'Set your preferred time interval before kickoff'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalReminderOn}
                      onChange={(e) => handleGlobalReminderToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {globalReminderOn && (
                  <div className="space-y-2 pt-1 border-t border-slate-800">
                    <label className="block text-[11px] text-slate-300 font-bold">
                      {isAr ? 'الوقت الافتراضي للتذكير قبل المباراة:' : 'Default reminder time before kickoff:'}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {REMINDER_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleGlobalIntervalChange(opt.value)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center border cursor-pointer ${
                            globalInterval === opt.value
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black scale-105'
                              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                        >
                          {isAr ? opt.labelAr : opt.labelEn}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      💡 {isAr 
                        ? `سيتم إرسال إشعار تذكيري مخصص قبل ${REMINDER_OPTIONS.find(o => o.value === globalInterval)?.labelAr} من صافرة بداية كل مباراة.` 
                        : `A custom push reminder will trigger ${globalInterval} mins before each match kickoff.`}
                    </p>
                  </div>
                )}
              </div>

              {/* Notification Schedule Explained */}
              <div className="p-3.5 bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl border border-emerald-500/30 space-y-2">
                <span className="font-black text-emerald-400 block text-xs sm:text-sm">
                  {isAr ? '📅 نظام وجدولة إشعارات المباريات والتوقعات' : '📅 Match Notification Schedule'}
                </span>
                <div className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">1.</span>
                    <span>{isAr ? '⏰ تذكير ذكي: قبل صافرة البداية بالمدة المحددة (15، 30، 45، 60 دقيقة).' : 'Smart Reminder: Custom interval before kickoff (15, 30, 45, 60 mins).'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">2.</span>
                    <span>{isAr ? '🔔 قبل الماتش بيوم: إشعار بقمة الغد والتذكير بالتوقع المبكر.' : '1 Day Before Match: Fixture details & prediction reminder.'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">3.</span>
                    <span>{isAr ? '☀️ يوم الماتش (صباحاً): إشعار تذكيري أول بمواجهات اليوم.' : 'Matchday Morning: First reminder for today\'s matches.'}</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] space-y-1">
                  <div>✨ {isAr ? 'جميع الإشعارات تحتوي على اسم الفريقين وزر "اتوقع الان" للوصول المباشر.' : 'All alerts feature team names and direct "Predict Now" CTA.'}</div>
                  <div className="text-[10px] text-amber-300 font-medium">⏱️ {isAr ? 'نظام التوزيع المنظم: عند إضافة مباريات جديدة لا يتم إرسالها دفعة واحدة، بل يتم إشعار مباراة تلو الأخرى بتوزيع زمني مدروس.' : 'Controlled Scheduling: Newly added matches are staggered smoothly instead of sending all at once.'}</div>
                </div>
              </div>

              {/* Browser Push Permission Card */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">
                    {isAr ? 'حالة إذن إشعارات المتصفح (Push Permission)' : 'Browser Push Permission'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    permissionStatus === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {permissionStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'تسمح إشعارات الدفع FCM بالوصول الفوري للتذكيرات والأهداف في الخلفية' : 'FCM Push allows receiving real-time alerts in background or foreground'}
                </p>
                {permissionStatus !== 'granted' && (
                  <button
                    onClick={handleRequestPermission}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer"
                  >
                    {isAr ? 'تفعيل إشعارات المتصفح الآن' : 'Enable Browser Push Notifications'}
                  </button>
                )}
              </div>

              {/* Test Notification Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleTestSmartReminderTrigger}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-400 text-slate-950 font-black rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Timer className="w-4 h-4 text-slate-950" />
                  <span>
                    {smartReminderSent
                      ? (isAr ? '✓ تم إرسال إشعار التذكير الذكي التجريبي!' : '✓ Smart Reminder Alert Sent!')
                      : (isAr ? `تجربة إشعار التذكير الذكي (${REMINDER_OPTIONS.find(o => o.value === globalInterval)?.labelAr})` : `Test Smart Reminder (${globalInterval}m)`)}
                  </span>
                </button>

                <button
                  onClick={handleTestPredictionTrigger}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="text-base">🎯</span>
                  <span>
                    {predTestSent
                      ? (isAr ? '✓ تم إرسال إشعار التوقع التجريبي!' : '✓ Prediction Alert Sent!')
                      : (isAr ? 'تجربة إشعار التوقع (مع زر اتوقع الان)' : 'Test Match Prediction Alert')}
                  </span>
                </button>

                <button
                  onClick={handleTestTrigger}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {testSent
                      ? (isAr ? 'تم إرسال إشعار هدف تجريبي! ⚽' : 'Test Goal Alert Triggered! ⚽')
                      : (isAr ? 'تجربة صوت إشعار الهدف المباشر' : 'Test Live Goal Chime')}
                  </span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

