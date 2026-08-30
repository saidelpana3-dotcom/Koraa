import { getMessaging, isSupported, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app, db, collection, doc, setDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, addDoc, handleFirestoreError, OperationType } from './firebase';
import { MatchSubscription, PushNotificationLog, Match, Language } from '../types';

let messagingInstance: Messaging | null = null;
let messagingChecked = false;

// Initialize FCM Messaging safely
export async function getFcmMessaging(): Promise<Messaging | null> {
  if (messagingChecked) return messagingInstance;
  messagingChecked = true;
  try {
    const supported = await isSupported();
    if (supported && typeof window !== 'undefined') {
      messagingInstance = getMessaging(app);
    }
  } catch (err) {
    console.warn('FCM Messaging is not supported in this browser context:', err);
  }
  return messagingInstance;
}

// Request Notification Permission and get FCM Token
export async function requestPushPermissionAndToken(): Promise<{ granted: boolean; token: string | null }> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, token: null };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('kora_mobile_push_granted', 'true');
      
      const messaging = await getFcmMessaging();
      let token: string | null = null;
      if (messaging) {
        try {
          token = await getToken(messaging);
        } catch (tokenErr) {
          console.warn('Could not retrieve FCM token, fallback to Web Push:', tokenErr);
        }
      }

      // Immediately trigger a native mobile confirmation push so user sees the phone notification!
      triggerNativeMobilePush({
        title: '📱 تم تفعيل إشعارات الهاتف بنجاح!',
        body: 'ستصلك إشعارات المباريات على موبايلك قبل اللقاء بيوم ويوم المباراة مع زر "اتوقع الان" 🎯',
        tag: 'kora-welcome-push'
      });

      return { granted: true, token };
    }
  } catch (err) {
    console.error('Error requesting notification permission:', err);
  }

  return { granted: false, token: null };
}

// Dedicated helper to trigger true Native OS / Phone push notification via Service Worker
export async function triggerNativeMobilePush(options: {
  title: string;
  body: string;
  matchId?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  ctaText?: string;
}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const iconUrl = options.icon || '/pwa-192x192.png';
  const badgeUrl = options.badge || '/favicon-32x32.png';
  const notifTag = options.tag || `kora-alert-${options.matchId || Date.now()}`;
  const cta = options.ctaText || '🎯 اتوقع الان';

  const notifOptions: any = {
    body: options.body,
    icon: iconUrl,
    badge: badgeUrl,
    tag: notifTag,
    renotify: true,
    requireInteraction: true,
    vibrate: [250, 100, 250, 100, 250],
    data: {
      matchId: options.matchId,
      url: options.matchId ? `/?predict=${options.matchId}#matches` : '/#matches'
    },
    actions: [
      { action: 'predict', title: cta }
    ]
  };

  // 1. Try Service Worker showNotification (Primary mechanism for Mobile OS & PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(options.title, notifOptions);
        return;
      }
    } catch (e) {
      console.warn('ServiceWorker ready showNotification notice:', e);
    }

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(options.title, notifOptions);
        return;
      }
    } catch (e) {
      console.warn('ServiceWorker getRegistration notice:', e);
    }

    // Try posting message to controller
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_MOBILE_NOTIFICATION',
        title: options.title,
        options: notifOptions
      });
    }
  }

  // 2. Fallback to window Notification (Desktop browsers)
  try {
    new Notification(options.title, {
      body: options.body,
      icon: iconUrl,
      tag: notifTag
    });
  } catch (err) {
    console.warn('Fallback Notification constructor notice:', err);
  }
}

// Smart Reminder Default Interval Helper (in minutes: 15, 30, 45, 60, 120)
export const DEFAULT_SMART_REMINDER_MINUTES = 30;

export function getGlobalSmartReminderInterval(): number {
  if (typeof window === 'undefined') return DEFAULT_SMART_REMINDER_MINUTES;
  const saved = localStorage.getItem('kora_smart_reminder_interval_minutes');
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_SMART_REMINDER_MINUTES;
}

export function setGlobalSmartReminderInterval(minutes: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kora_smart_reminder_interval_minutes', String(minutes));
}

export function isGlobalSmartReminderEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('kora_smart_reminder_enabled');
  return saved === null ? true : saved === 'true';
}

export function setGlobalSmartReminderEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kora_smart_reminder_enabled', enabled ? 'true' : 'false');
}

// Subscribe user to a specific match in Firestore with custom smart reminder options
export async function toggleMatchSubscription(
  userId: string,
  match: Match,
  currentSub: MatchSubscription | null,
  options: { 
    notifyGoals?: boolean; 
    notifyStart?: boolean; 
    notifyRedCards?: boolean; 
    notifySmartReminder?: boolean;
    reminderIntervalMinutes?: number;
  } = { 
    notifyGoals: true, 
    notifyStart: true, 
    notifyRedCards: true,
    notifySmartReminder: true,
    reminderIntervalMinutes: DEFAULT_SMART_REMINDER_MINUTES
  }
): Promise<MatchSubscription | null> {
  const docId = `${userId}_${match.id}`;
  const subRef = doc(db, 'matchSubscriptions', docId);

  if (currentSub) {
    // Already subscribed -> Unsubscribe
    await deleteDoc(subRef);
    return null;
  } else {
    // Request push permission
    const { token } = await requestPushPermissionAndToken();

    const newSub: MatchSubscription = {
      id: docId,
      userId,
      matchId: match.id,
      homeTeam: match.homeTeam,
      homeTeamAr: match.homeTeamAr,
      awayTeam: match.awayTeam,
      awayTeamAr: match.awayTeamAr,
      notifyGoals: options.notifyGoals ?? true,
      notifyStart: options.notifyStart ?? true,
      notifyRedCards: options.notifyRedCards ?? true,
      notifySmartReminder: options.notifySmartReminder ?? true,
      reminderIntervalMinutes: options.reminderIntervalMinutes || getGlobalSmartReminderInterval(),
      fcmToken: token || undefined,
      createdAt: new Date().toISOString()
    };

    await setDoc(subRef, newSub);
    return newSub;
  }
}

// Subscribe to real-time user match subscriptions
export function listenToUserSubscriptions(
  userId: string,
  onUpdate: (subs: MatchSubscription[]) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, 'matchSubscriptions'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const subs: MatchSubscription[] = [];
    snapshot.forEach((docSnap) => {
      subs.push(docSnap.data() as MatchSubscription);
    });
    onUpdate(subs);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'matchSubscriptions');
  });
}

// Subscribe to real-time notification logs
export function listenToNotificationLogs(
  userId: string,
  onUpdate: (logs: PushNotificationLog[]) => void
) {
  const q = query(
    collection(db, 'notifications'),
    orderBy('timestamp', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const logs: PushNotificationLog[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      logs.push({
        id: docSnap.id,
        ...data
      } as PushNotificationLog);
    });
    onUpdate(logs);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'notifications');
  });
}

export interface LiveNotificationPayload {
  userId?: string;
  matchId: string;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  type: 'SMART_REMINDER' | 'NEW_FEATURED_MATCH' | 'PRE_MATCH_DAY_BEFORE' | 'MATCH_DAY_MORNING' | 'PRE_MATCH_COUNTDOWN' | 'GOAL' | 'MATCH_START' | 'RED_CARD' | 'HALF_TIME' | 'FULL_TIME';
  homeTeam?: string;
  homeTeamAr?: string;
  awayTeam?: string;
  awayTeamAr?: string;
  homeLogo?: string;
  awayLogo?: string;
  ctaText?: string;
  ctaTextAr?: string;
  reminderMinutes?: number;
}

// Play notification sound chime using Web Audio API
export function playNotificationChime(type: 'GOAL' | 'MATCH_START' | 'CARD' | 'PREDICTION' | 'REMINDER' = 'GOAL') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const playTone = (freq: number, start: number, duration: number, volume: number = 0.2) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(volume, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    if (type === 'GOAL') {
      // High energetic stadium fan tone (3 ascending notes)
      playTone(523.25, 0, 0.15, 0.3); // C5
      playTone(659.25, 0.15, 0.15, 0.3); // E5
      playTone(783.99, 0.3, 0.4, 0.4); // G5
    } else if (type === 'MATCH_START') {
      // Referee whistle simulation (double beep)
      playTone(2800, 0, 0.1, 0.25);
      playTone(2800, 0.15, 0.2, 0.25);
    } else if (type === 'REMINDER' || type === 'PREDICTION') {
      // Harmonic alert tone for kickoff countdown and smart reminders
      playTone(587.33, 0, 0.12, 0.25); // D5
      playTone(739.99, 0.12, 0.12, 0.25); // F#5
      playTone(880.00, 0.24, 0.28, 0.3); // A5
    } else {
      // Neutral notification ding
      playTone(880, 0, 0.25, 0.2);
    }
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
}

// Dispatch a live push alert (Native push + In-app Toast + Firestore Log)
export async function sendMatchLiveNotification(payload: LiveNotificationPayload) {
  const timestamp = new Date().toISOString();

  // 1. Play audio chime
  const chimeType = payload.type === 'SMART_REMINDER'
    ? 'REMINDER'
    : payload.type.startsWith('PRE_MATCH') || payload.type === 'MATCH_DAY_MORNING' 
    ? 'PREDICTION' 
    : payload.type === 'GOAL' 
    ? 'GOAL' 
    : payload.type === 'MATCH_START' 
    ? 'MATCH_START' 
    : 'CARD';
  playNotificationChime(chimeType);

  // 2. Dispatch native mobile phone push notification if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const displayTitle = payload.titleAr || payload.title;
      const displayBody = `${payload.homeTeamAr || payload.homeTeam || ''} ⚔️ ${payload.awayTeamAr || payload.awayTeam || ''}\n${payload.bodyAr || payload.body}\n${payload.ctaTextAr || '🎯 اتوقع الان'}`;
      
      triggerNativeMobilePush({
        title: displayTitle,
        body: displayBody,
        matchId: payload.matchId,
        icon: payload.homeLogo || '/pwa-192x192.png',
        badge: '/favicon-32x32.png',
        tag: `kora-notif-${payload.matchId}-${payload.type}`,
        ctaText: payload.ctaTextAr || '🎯 اتوقع الان'
      });
    } catch (err) {
      console.warn('Native mobile notification trigger notice:', err);
    }
  }

  // 3. Dispatch window custom event for live in-app UI Toast Banner
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kora-live-notification', { detail: payload }));
  }

  // 4. Save to Firestore notifications collection
  try {
    await addDoc(collection(db, 'notifications'), {
      ...payload,
      timestamp,
      read: false
    });
  } catch (err) {
    console.error('Failed to log notification to Firestore:', err);
  }
}

/**
 * ⏰ Smart Throttled Match Notification Scheduler:
 * Prevents notification flooding and guarantees spaced-out delivery:
 * 
 * 1. Smart Kickoff Reminder (تذكير ذكي مخصص قبل صافرة البداية: 15، 30، 45، 60 دقيقة).
 * 2. 1 Day Before Match (قبل الماتش بيوم): Sent for tomorrow's clashes, staggered at 1-hour intervals.
 * 3. Match Day Morning (يوم الماتش الصبح): Sent during morning hours, staggered at 1-hour intervals.
 */
export const MIN_NOTIF_INTERVAL_MS = 60 * 60 * 1000; // 1 hour minimum spacing between non-urgent match alerts
export const MIN_SMART_REMINDER_INTERVAL_MS = 10 * 60 * 1000; // 10 mins minimum spacing between kickoff smart reminders

function formatIntervalText(minutes: number, isAr: boolean): string {
  if (minutes === 15) return isAr ? '١٥ دقيقة' : '15 minutes';
  if (minutes === 30) return isAr ? 'نصف ساعة' : '30 minutes';
  if (minutes === 45) return isAr ? '٤٥ دقيقة' : '45 minutes';
  if (minutes === 60) return isAr ? 'ساعة واحدة' : '1 hour';
  if (minutes === 120) return isAr ? 'ساعتين' : '2 hours';
  return isAr ? `${minutes} دقيقة` : `${minutes} minutes`;
}

function getMatchImportanceRank(match: Match): number {
  let score = 0;
  const nameEn = `${match.homeTeam} ${match.awayTeam}`.toLowerCase();
  const nameAr = `${match.homeTeamAr || ''} ${match.awayTeamAr || ''}`;
  const comp = `${match.leagueName || ''} ${match.leagueNameAr || ''}`.toLowerCase();

  // Top Global & Regional Giants
  if (/real madrid|barcelona/.test(nameEn) || /ريال مدريد|برشلونة/.test(nameAr)) score += 120;
  if (/liverpool|manchester|arsenal/.test(nameEn) || /ليفربول|مانشستر|ارسنال|أرسنال/.test(nameAr)) score += 100;
  if (/ahly|zamalek/.test(nameEn) || /الأهلي|الاهلي|الزمالك/.test(nameAr)) score += 110;
  if (/hilal|nassr|ittihad/.test(nameEn) || /الهلال|النصر|الاتحاد/.test(nameAr)) score += 90;
  if (/bayern|psg|juventus/.test(nameEn) || /بايرن|باريس|يوفنتوس/.test(nameAr)) score += 80;

  // Prestigious Competitions
  if (/champions league/.test(comp) || /دوري أبطال|دوري ابطال/.test(comp)) score += 60;
  if (/premier league/.test(comp) || /الدوري الإنجليزي|الدوري الانجليزي/.test(comp)) score += 50;
  if (/la liga/.test(comp) || /الدوري الإسباني|الدوري الاسباني/.test(comp)) score += 45;
  if (/egyptian/.test(comp) || /الدوري المصري/.test(comp)) score += 40;
  if (/saudi/.test(comp) || /الدوري السعودي|روشن/.test(comp)) score += 40;

  return score;
}

export function checkAndDispatchMatchNotifications(
  matches: Match[], 
  language: Language = 'ar',
  userSubscriptions: MatchSubscription[] = []
) {
  if (typeof window === 'undefined' || !Array.isArray(matches) || matches.length === 0) return;

  const isAr = language === 'ar';
  const now = Date.now();
  const currentHour = new Date().getHours(); // 0 to 23
  const isGlobalReminderOn = isGlobalSmartReminderEnabled();
  const globalReminderMinutes = getGlobalSmartReminderInterval();

  const lastGeneralTimeStr = localStorage.getItem('kora_last_general_notif_time');
  const lastGeneralTime = lastGeneralTimeStr ? parseInt(lastGeneralTimeStr, 10) : 0;
  const canSendGeneralNotif = !lastGeneralTime || (now - lastGeneralTime >= MIN_NOTIF_INTERVAL_MS);

  const lastReminderTimeStr = localStorage.getItem('kora_last_smart_reminder_time');
  const lastReminderTime = lastReminderTimeStr ? parseInt(lastReminderTimeStr, 10) : 0;
  const canSendSmartReminder = !lastReminderTime || (now - lastReminderTime >= MIN_SMART_REMINDER_INTERVAL_MS);

  // ----------------------------------------------------
  // Priority 1: Smart Kickoff Reminder (Based on custom interval: 15, 30, 45, 60, 120 mins)
  // ----------------------------------------------------
  if (canSendSmartReminder && (isGlobalReminderOn || userSubscriptions.length > 0)) {
    const upcomingMatches = matches.filter((m) => m.status === 'UPCOMING' && !m.isPredictionClosed && m.kickoffTimeMs);

    for (const match of upcomingMatches) {
      const kickoffMs = match.kickoffTimeMs || 0;
      const timeUntilKickoffMs = kickoffMs - now;

      // Find if user has a specific subscription for this match
      const userSub = userSubscriptions.find((s) => s.matchId === match.id);
      
      let targetIntervalMinutes = globalReminderMinutes;
      let shouldCheckReminder = isGlobalReminderOn;

      if (userSub) {
        if (userSub.notifySmartReminder !== false) {
          shouldCheckReminder = true;
          if (userSub.reminderIntervalMinutes && userSub.reminderIntervalMinutes > 0) {
            targetIntervalMinutes = userSub.reminderIntervalMinutes;
          }
        } else {
          shouldCheckReminder = false;
        }
      }

      if (!shouldCheckReminder) continue;

      const targetIntervalMs = targetIntervalMinutes * 60 * 1000;
      const reminderStorageKey = `kora_smart_reminder_${match.id}_${targetIntervalMinutes}`;
      const alreadySentReminder = localStorage.getItem(reminderStorageKey);

      // Trigger reminder if match starts within targetInterval and kickoff hasn't occurred yet
      if (timeUntilKickoffMs > 0 && timeUntilKickoffMs <= targetIntervalMs && !alreadySentReminder) {
        const homeName = isAr ? match.homeTeamAr || match.homeTeam : match.homeTeam;
        const awayName = isAr ? match.awayTeamAr || match.awayTeam : match.awayTeam;
        const intervalText = formatIntervalText(targetIntervalMinutes, isAr);

        localStorage.setItem(reminderStorageKey, 'true');
        localStorage.setItem('kora_last_smart_reminder_time', String(now));

        sendMatchLiveNotification({
          matchId: match.id,
          title: `⏰ Smart Reminder: ${match.homeTeam} vs ${match.awayTeam}`,
          titleAr: `⏰ تذكير ذكي: ${homeName} ضد ${awayName}`,
          body: `Kickoff in ${intervalText} (at ${match.time})! Submit your prediction now before kickoff.`,
          bodyAr: `انطلاق المباراة بعد ${intervalText} (الساعة ${match.time}) ⏳ بادر بتوقع النتيجة الآن قبل غلق التوقعات!`,
          ctaText: '🎯 Predict Now',
          ctaTextAr: '🎯 اتوقع الان',
          type: 'SMART_REMINDER',
          reminderMinutes: targetIntervalMinutes,
          homeTeam: match.homeTeam,
          homeTeamAr: match.homeTeamAr,
          awayTeam: match.awayTeam,
          awayTeamAr: match.awayTeamAr,
          homeLogo: match.homeLogo,
          awayLogo: match.awayLogo,
        });

        // Exit loop after sending 1 smart reminder to avoid spamming
        return;
      }
    }
  }

  // ----------------------------------------------------
  // Priority 2 & 3: Staggered General Match Notifications (1 Notification Per Hour)
  // ----------------------------------------------------
  if (!canSendGeneralNotif) {
    // Cooldown active: wait for the 1-hour interval before sending next match
    return;
  }

  interface CandidateNotification {
    match: Match;
    type: 'PRE_MATCH_DAY_BEFORE' | 'MATCH_DAY_MORNING';
    storageKey: string;
    rank: number;
  }

  const candidates: CandidateNotification[] = [];

  matches.forEach((match) => {
    if (match.status !== 'UPCOMING' || match.isPredictionClosed) return;

    const kickoffMs = match.kickoffTimeMs || 0;
    const timeUntilKickoffMs = kickoffMs > 0 ? kickoffMs - now : 0;
    const isToday = match.dayOffset === 0;
    const isTomorrow = match.dayOffset === 1;

    // Check Candidate: 1 Day Before Match (Tomorrow)
    const dayBeforeKey = `kora_notif_day_before_${match.id}`;
    if (isTomorrow && !localStorage.getItem(dayBeforeKey)) {
      candidates.push({
        match,
        type: 'PRE_MATCH_DAY_BEFORE',
        storageKey: dayBeforeKey,
        rank: getMatchImportanceRank(match) + 10 // Slightly higher priority for big tomorrow matches
      });
    }

    // Check Candidate: Match Day Morning (Today >= 8 AM)
    const morningKey = `kora_notif_morning_${match.id}`;
    if (isToday && currentHour >= 8 && (!kickoffMs || timeUntilKickoffMs > 90 * 60 * 1000) && !localStorage.getItem(morningKey)) {
      candidates.push({
        match,
        type: 'MATCH_DAY_MORNING',
        storageKey: morningKey,
        rank: getMatchImportanceRank(match)
      });
    }
  });

  if (candidates.length === 0) return;

  // Sort candidate matches by importance rank descending (send most prestigious/important match first)
  candidates.sort((a, b) => b.rank - a.rank);

  // Pick exactly ONE match for this hour
  const chosen = candidates[0];
  const chosenMatch = chosen.match;
  const homeName = isAr ? chosenMatch.homeTeamAr || chosenMatch.homeTeam : chosenMatch.homeTeam;
  const awayName = isAr ? chosenMatch.awayTeamAr || chosenMatch.awayTeam : chosenMatch.awayTeam;

  localStorage.setItem(chosen.storageKey, 'true');
  localStorage.setItem('kora_last_general_notif_time', String(now));

  if (chosen.type === 'PRE_MATCH_DAY_BEFORE') {
    sendMatchLiveNotification({
      matchId: chosenMatch.id,
      title: `🔥 Tomorrow's Clash: ${chosenMatch.homeTeam} vs ${chosenMatch.awayTeam}`,
      titleAr: `🔥 قمة الغد المرتقبة: ${homeName} ضد ${awayName}`,
      body: `Match tomorrow at ${chosenMatch.time}. Predict now and earn +50 coins!`,
      bodyAr: `المباراة غداً في تمام الساعة ${chosenMatch.time} ⏰ بادر بتوقع النتيجة الآن واكسب 50 كوينز!`,
      ctaText: '🎯 Predict Now',
      ctaTextAr: '🎯 اتوقع الان',
      type: 'PRE_MATCH_DAY_BEFORE',
      homeTeam: chosenMatch.homeTeam,
      homeTeamAr: chosenMatch.homeTeamAr,
      awayTeam: chosenMatch.awayTeam,
      awayTeamAr: chosenMatch.awayTeamAr,
      homeLogo: chosenMatch.homeLogo,
      awayLogo: chosenMatch.awayLogo,
    });
  } else {
    sendMatchLiveNotification({
      matchId: chosenMatch.id,
      title: `☀️ Matchday: ${chosenMatch.homeTeam} vs ${chosenMatch.awayTeam}`,
      titleAr: `☀️ مواجهة اليوم: ${homeName} ضد ${awayName}`,
      body: `Big match today at ${chosenMatch.time}! Don't forget to submit your score prediction.`,
      bodyAr: `مواجهة اليوم في تمام الساعة ${chosenMatch.time} 🏆 شارك توقعك قبل انطلاق صافرة البداية!`,
      ctaText: '🎯 Predict Now',
      ctaTextAr: '🎯 اتوقع الان',
      type: 'MATCH_DAY_MORNING',
      homeTeam: chosenMatch.homeTeam,
      homeTeamAr: chosenMatch.homeTeamAr,
      awayTeam: chosenMatch.awayTeam,
      awayTeamAr: chosenMatch.awayTeamAr,
      homeLogo: chosenMatch.homeLogo,
      awayLogo: chosenMatch.awayLogo,
    });
  }
}

/**
 * 📢 Broadcast New Featured Match Notification:
 * Sends instant broadcast notification across Firestore and Mobile Push when a new single match is added.
 */
export async function broadcastNewFeaturedMatchNotification(match: Match, language: Language = 'ar') {
  if (!match || !match.id) return;
  const isAr = language === 'ar';
  const homeName = isAr ? match.homeTeamAr || match.homeTeam : match.homeTeam;
  const awayName = isAr ? match.awayTeamAr || match.awayTeam : match.awayTeam;
  const leagueTitle = isAr ? match.leagueNameAr || match.leagueName : match.leagueName;

  const notifKey = `kora_notif_new_match_broadcast_${match.id}`;
  if (typeof window !== 'undefined' && localStorage.getItem(notifKey)) {
    return;
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(notifKey, 'true');
  }

  await sendMatchLiveNotification({
    matchId: match.id,
    title: `🔥 New Match Added: ${match.homeTeam} vs ${match.awayTeam}`,
    titleAr: `🔥 قمة جديدة في ${leagueTitle}: ${homeName} ضد ${awayName}`,
    body: `New match scheduled at ${match.time}! Predict the outcome now to earn +50 coins!`,
    bodyAr: `تمت إضافة قمة مرتقبة في جدول المباريات الساعة ${match.time} ⏰ بادر بتوقع النتيجة الآن واكسب الكوينز والجوائز!`,
    ctaText: '🎯 Predict Now',
    ctaTextAr: '🎯 اتوقع الان',
    type: 'NEW_FEATURED_MATCH',
    homeTeam: match.homeTeam,
    homeTeamAr: match.homeTeamAr,
    awayTeam: match.awayTeam,
    awayTeamAr: match.awayTeamAr,
    homeLogo: match.homeLogo,
    awayLogo: match.awayLogo,
  });
}

/**
 * ⚡ Automated System for Detecting & Broadcasting Newly Added Featured Matches:
 * Monitors match list updates and ensures NO BULK / MASS NOTIFICATIONS are sent simultaneously
 * when multiple matches are added.
 */
export const MIN_NEW_MATCH_BROADCAST_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours minimum spacing between new match broadcasts

export function autoDetectAndBroadcastNewFeaturedMatches(matches: Match[], language: Language = 'ar') {
  if (typeof window === 'undefined' || !Array.isArray(matches) || matches.length === 0) return;

  const KNOWN_MATCHES_KEY = 'kora_known_match_ids_registry';
  const storedRegistry = localStorage.getItem(KNOWN_MATCHES_KEY);

  let knownMatchIds: string[] = [];
  if (storedRegistry) {
    try {
      knownMatchIds = JSON.parse(storedRegistry);
    } catch {
      knownMatchIds = [];
    }
  }

  // First boot: populate registry with initial matches to avoid flooding on initial page load
  if (knownMatchIds.length === 0) {
    const initialIds = matches.map(m => m.id);
    localStorage.setItem(KNOWN_MATCHES_KEY, JSON.stringify(initialIds));
    return;
  }

  // Detect newly added matches that are not in the known registry
  const newlyAddedMatches = matches.filter(m => !knownMatchIds.includes(m.id) && m.status === 'UPCOMING');

  if (newlyAddedMatches.length > 0) {
    // 1. Immediately register ALL newly added match IDs in registry to prevent repeats
    const updatedIds = Array.from(new Set([...knownMatchIds, ...matches.map(m => m.id)]));
    localStorage.setItem(KNOWN_MATCHES_KEY, JSON.stringify(updatedIds));

    // 2. Controlled Throttle: Never blast notifications for all matches at once!
    // Pick at most ONE highest-ranked match if the 2-hour cooldown has elapsed.
    const now = Date.now();
    const lastBroadcastTimeStr = localStorage.getItem('kora_last_new_match_broadcast_time');
    const lastBroadcastTime = lastBroadcastTimeStr ? parseInt(lastBroadcastTimeStr, 10) : 0;

    if (!lastBroadcastTime || (now - lastBroadcastTime >= MIN_NEW_MATCH_BROADCAST_INTERVAL_MS)) {
      // Sort newly added matches by importance rank descending
      const sortedNew = [...newlyAddedMatches].sort((a, b) => getMatchImportanceRank(b) - getMatchImportanceRank(a));
      const topMatch = sortedNew[0];
      
      localStorage.setItem('kora_last_new_match_broadcast_time', String(now));
      broadcastNewFeaturedMatchNotification(topMatch, language);
    }
  }
}

