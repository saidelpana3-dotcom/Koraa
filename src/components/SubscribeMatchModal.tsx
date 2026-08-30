import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, ShieldAlert, Goal, Clock, Sparkles, Volume2, Timer } from 'lucide-react';
import { Match, Language, MatchSubscription } from '../types';
import { 
  toggleMatchSubscription, 
  playNotificationChime, 
  sendMatchLiveNotification, 
  getGlobalSmartReminderInterval 
} from '../lib/notifications';
import { TeamLogo } from './TeamLogo';

interface SubscribeMatchModalProps {
  match: Match;
  language: Language;
  userId: string | null;
  currentSubscription: MatchSubscription | null;
  onClose: () => void;
  onSignInRequired: () => void;
}

const REMINDER_INTERVAL_OPTIONS = [
  { value: 15, labelAr: '١٥ دقيقة', labelEn: '15 Mins' },
  { value: 30, labelAr: '٣٠ دقيقة', labelEn: '30 Mins' },
  { value: 45, labelAr: '٤٥ دقيقة', labelEn: '45 Mins' },
  { value: 60, labelAr: 'ساعة (60 د)', labelEn: '1 Hour' },
  { value: 120, labelAr: 'ساعتان (120 د)', labelEn: '2 Hours' },
];

export const SubscribeMatchModal: React.FC<SubscribeMatchModalProps> = ({
  match,
  language,
  userId,
  currentSubscription,
  onClose,
  onSignInRequired,
}) => {
  const isAr = language === 'ar';
  const [notifyGoals, setNotifyGoals] = useState(currentSubscription ? currentSubscription.notifyGoals : true);
  const [notifyStart, setNotifyStart] = useState(currentSubscription ? currentSubscription.notifyStart : true);
  const [notifyRedCards, setNotifyRedCards] = useState(currentSubscription ? currentSubscription.notifyRedCards : true);
  const [notifySmartReminder, setNotifySmartReminder] = useState(
    currentSubscription?.notifySmartReminder !== undefined ? currentSubscription.notifySmartReminder : true
  );
  const [reminderIntervalMinutes, setReminderIntervalMinutes] = useState(
    currentSubscription?.reminderIntervalMinutes || getGlobalSmartReminderInterval() || 30
  );
  const [loading, setLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [testReminderSent, setTestReminderSent] = useState(false);

  // Lock body scroll on mount
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const homeName = isAr ? match.homeTeamAr || match.homeTeam : match.homeTeam;
  const awayName = isAr ? match.awayTeamAr || match.awayTeam : match.awayTeam;

  const handleToggle = async () => {
    if (!userId) {
      onSignInRequired();
      return;
    }

    setLoading(true);
    try {
      await toggleMatchSubscription(userId, match, currentSubscription, {
        notifyGoals,
        notifyStart,
        notifyRedCards,
        notifySmartReminder,
        reminderIntervalMinutes
      });
      onClose();
    } catch (err) {
      console.error('Subscription error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAlert = () => {
    playNotificationChime('GOAL');
    sendMatchLiveNotification({
      matchId: match.id,
      title: '⚽ GOAL! GOAL! GOAL!',
      titleAr: `⚽ هدف! ${homeName} ضد ${awayName}`,
      body: `${homeName} scored! Live push alert test.`,
      bodyAr: `تم تسجيل هدف في مباراة ${homeName} ضد ${awayName}! تجربة إشعار مباشر.`,
      type: 'GOAL'
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleTestSmartReminder = () => {
    playNotificationChime('REMINDER');
    const intervalLabel = REMINDER_INTERVAL_OPTIONS.find(o => o.value === reminderIntervalMinutes);
    const intervalText = isAr ? intervalLabel?.labelAr : intervalLabel?.labelEn;

    sendMatchLiveNotification({
      matchId: match.id,
      title: `⏰ Smart Reminder (${reminderIntervalMinutes}m): ${match.homeTeam} vs ${match.awayTeam}`,
      titleAr: `⏰ تذكير ذكي (${intervalText}): ${homeName} ضد ${awayName}`,
      body: `Match starts in ${intervalText} (at ${match.time})! Predict now before kickoff.`,
      bodyAr: `انطلاق المباراة بعد ${intervalText} (الساعة ${match.time}) ⏳ بادر بتوقع النتيجة الآن قبل غلق التوقعات!`,
      ctaText: '🎯 Predict Now',
      ctaTextAr: '🎯 اتوقع الان',
      type: 'SMART_REMINDER',
      reminderMinutes: reminderIntervalMinutes,
      homeTeam: match.homeTeam,
      homeTeamAr: match.homeTeamAr,
      awayTeam: match.awayTeam,
      awayTeamAr: match.awayTeamAr,
      homeLogo: match.homeLogo,
      awayLogo: match.awayLogo,
    });
    setTestReminderSent(true);
    setTimeout(() => setTestReminderSent(false), 3000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close 'X' Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label={isAr ? 'إغلاق' : 'Close'}
          title={isAr ? 'إغلاق (×)' : 'Close (×)'}
          className="absolute top-3.5 left-3.5 rtl:left-auto rtl:right-auto rtl:left-3.5 w-9 h-9 rounded-full bg-slate-800/95 hover:bg-rose-600 active:bg-rose-700 text-white transition-all flex items-center justify-center border border-slate-700 cursor-pointer shadow-md active:scale-95 z-20"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              {isAr ? 'إشعارات وتذكيرات المباراة (Push Alerts)' : 'Live Match Alerts & Smart Reminder'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr ? 'تخصيص وقت التذكير الذكي وتنبيهات الأهداف الفورية' : 'Customize pre-match reminder interval and live alerts'}
            </p>
          </div>
        </div>

        {/* Teams Banner */}
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TeamLogo teamName={match.homeTeam} logo={match.homeLogo} sizeClassName="w-7 h-7" />
            <span className="text-xs font-bold text-slate-200">{homeName}</span>
          </div>
          <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            VS
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">{awayName}</span>
            <TeamLogo teamName={match.awayTeam} logo={match.awayLogo} sizeClassName="w-7 h-7" />
          </div>
        </div>

        {/* Smart Reminder Section (User requested feature) */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-extrabold text-amber-300">
                {isAr ? '⏰ التذكير الذكي قبل المباراة (Smart Reminder)' : '⏰ Smart Kickoff Reminder'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifySmartReminder}
                onChange={(e) => setNotifySmartReminder(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {notifySmartReminder && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] text-slate-300 font-medium">
                {isAr ? 'اختر الوقت الذي تفضله للتنبيه قبل انطلاق اللقاء:' : 'Select how many minutes before kickoff to be alerted:'}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {REMINDER_INTERVAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setReminderIntervalMinutes(opt.value)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center border cursor-pointer ${
                      reminderIntervalMinutes === opt.value
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {isAr ? opt.labelAr : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notification Options Toggles */}
        <div className="space-y-2">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
            <div className="flex items-center gap-2.5">
              <Goal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">
                {isAr ? 'إشعارات الأهداف المباشرة (⚽)' : 'Goal Alerts (⚽)'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyGoals}
              onChange={(e) => setNotifyGoals(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">
                {isAr ? 'صافرة بداية المباراة (🏁)' : 'Match Kickoff Whistle (🏁)'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyStart}
              onChange={(e) => setNotifyStart(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-slate-200">
                {isAr ? 'الكروت الحمراء والأحداث الكبرى (🟥)' : 'Red Cards & Key Events (🟥)'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyRedCards}
              onChange={(e) => setNotifyRedCards(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              currentSubscription
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {loading ? (
              <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
            ) : currentSubscription ? (
              <>
                <BellOff className="w-4 h-4" />
                <span>{isAr ? 'إلغاء الاشتراك في هذه المباراة' : 'Unsubscribe from Match'}</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>{isAr ? 'تفعيل الإشعارات والتذكير الذكي' : 'Subscribe to Alerts & Smart Reminder'}</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleTestSmartReminder}
              type="button"
              className="py-2 px-2 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {testReminderSent
                  ? (isAr ? 'تم إرسال التذكير! ⏰' : 'Reminder Sent! ⏰')
                  : (isAr ? 'تجربة التذكير الذكي ⏰' : 'Test Smart Reminder ⏰')}
              </span>
            </button>

            <button
              onClick={handleTestAlert}
              type="button"
              className="py-2 px-2 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {testSent
                  ? (isAr ? 'تم إرسال الهدف! ⚽' : 'Goal Sent! ⚽')
                  : (isAr ? 'تجربة إشعار الهدف ⚽' : 'Test Goal Chime ⚽')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

