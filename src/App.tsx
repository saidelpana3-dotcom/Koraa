import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Match, MatchStatus, Language, ThemeMode, MatchSubscription, PushNotificationLog, PrizeClaim } from './types';
import { INITIAL_MATCHES, LEAGUES, deduplicateMatches, generateInitialMatches, getLocalDayString, getArabicDayLabel } from './data/mockData';
import { isMatchLive, isMatchFinished, hasLiveOrStartedMatchesToday, getEarliestKickoffMsToday } from './data/matchHelpers';
import { Header } from './components/Header';
import { MatchCard } from './components/MatchCard';
import { MatchDetailsModal } from './components/MatchDetailsModal';
import { PredictionsAndRewards } from './components/PredictionsAndRewards';
import { AccountPage, AccountSubTab } from './components/AccountPage';
import { CoinsHistoryModal } from './components/CoinsHistoryModal';
import { FeaturedTournaments } from './components/FeaturedTournaments';
import { BottomNav } from './components/BottomNav';
import { AuthWelcomeModal } from './components/AuthWelcomeModal';
import { AdBannerSlot, IS_ONE_COIN_ADS_PAUSED } from './components/AdBannerSlot';
import { SubscribeMatchModal } from './components/SubscribeMatchModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { FirstTimePermissionsModal } from './components/FirstTimePermissionsModal';
import { InstallAppBanner } from './components/InstallAppBanner';
import { FirstVisitInstallModal } from './components/FirstVisitInstallModal';
import { SplashOpeningScreen } from './components/SplashOpeningScreen';
import { ProSubscriptionModal } from './components/ProSubscriptionModal';
import { RewardedAdPlayerModal } from './components/RewardedAdPlayerModal';
import { RewardedAdsSection } from './components/RewardedAdsSection';
import { GamesPage } from './components/GamesPage';
import { OrangeDiamondIcon } from './components/OrangeDiamondIcon';
import { fetchLiveVastAds } from './services/vastAdsService';
import { Footer } from './components/Footer';
import { MatchStatusFilter, StatusFilterType } from './components/MatchStatusFilter';
import { 
  listenToUserSubscriptions, 
  listenToNotificationLogs, 
  checkAndDispatchMatchNotifications,
  autoDetectAndBroadcastNewFeaturedMatches,
  sendMatchLiveNotification,
  syncFavoriteMatchSubscription
} from './lib/notifications';
import { 
  getActiveLeagueTournament, 
  checkAndSendDailyTournamentNotification, 
  syncPredictionToLeagueTournament,
  syncLeagueTournamentWithServer,
  DEDICATED_LEAGUE_TOURNAMENT_MATCH_IDS
} from './data/leagueTournaments';
import { 
  subscribeToCloudMatches, 
  mergeCloudMatches, 
  syncAllBaselineMatchesToCloud, 
  updateMatchResultInCloud 
} from './lib/matchCloudSync';
import { fetchApiFootballLiveMatches, processApiFootballSyncedMatches } from './lib/footballApiSync';
import { getNumericUserId, getUserOrGuestNumericId } from './utils/userId';
import { evaluateUserPredictionsList, FINISHED_MATCHES_CATALOG, isMatchRemovedGlobally, isMatchObjectRemovedGlobally } from './utils/predictionEvaluator';
import { resolveFinalMatchScore } from './utils/matchScorePersistence';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  collection,
  where,
  getDocs,
  User,
  handleFirestoreError,
  OperationType
} from './lib/firebase';
import { Radio, Heart, Filter, Shield, Trophy, Flame, Volume2, Sparkles, UserCheck, Gift, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('kora_app_lang');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('kora_app_theme');
    return (saved === 'dark' || saved === 'light') ? (saved as ThemeMode) : 'light';
  });

  useEffect(() => {
    localStorage.setItem('kora_app_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Synchronize mobile browser status bar theme-color dynamically (Android Chrome & iOS Safari)
    const colorHex = theme === 'dark' ? '#020617' : '#f8fafc';
    const metaTags = document.querySelectorAll('meta[name="theme-color"]');
    metaTags.forEach((tag) => {
      tag.setAttribute('content', colorHex);
    });
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const [activeTab, setActiveTab] = useState<'matches' | 'tournaments' | 'games' | 'prizes' | 'account' | 'favorites'>('matches');
  const [tabHistory, setTabHistory] = useState<Array<'matches' | 'tournaments' | 'games' | 'prizes' | 'account' | 'favorites'>>(['matches']);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'FINISHED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Favorites state
  const [favoriteMatchIds, setFavoriteMatchIds] = useState<string[]>([]);

  // Main Matches State (initialized with dynamic list, synced live with Firestore Cloud DB & Google Search)
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => getLocalDayString(0));
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const matchesRef = useRef<Match[]>(INITIAL_MATCHES);
  const cloudMatchesRef = useRef<Record<string, Partial<Match>>>({});

  useEffect(() => {
    matchesRef.current = matches;
  }, [matches]);

  // 🌐 Real-time Firestore Cloud Matches Listener:
  // Whenever any match result is updated in Firestore by admin/system/sync, 
  // all users instantly receive the updated score and status in real time!
  useEffect(() => {
    const unsubscribeCloud = subscribeToCloudMatches((cloudMap) => {
      cloudMatchesRef.current = cloudMap;
      setMatches((prev) => mergeCloudMatches(prev, cloudMap));
    });

    // Sync all baseline & finished catalog matches to Firestore in background
    syncAllBaselineMatchesToCloud(INITIAL_MATCHES);

    return () => {
      unsubscribeCloud();
    };
  }, []);

  // 🕛 Automatic Midnight Rollover (12:00 AM Clock Transition)
  // When 12:00 AM arrives, tomorrow's matches automatically become today's matches
  useEffect(() => {
    const handleMidnightTransition = () => {
      const liveCurrentDay = getLocalDayString(0);
      if (liveCurrentDay !== currentDateStr) {
        console.log(`[Midnight Rollover 🕛] Date shifted from ${currentDateStr} to ${liveCurrentDay}. Promoting tomorrow's matches to today...`);
        setCurrentDateStr(liveCurrentDay);
        // Refresh match fixtures so dayOffset 0 is the new today and dayOffset 1 is the new tomorrow, merged with latest cloud scores
        const refreshed = deduplicateMatches(generateInitialMatches());
        setMatches(mergeCloudMatches(refreshed, cloudMatchesRef.current));
      }
    };

    // 1. High-frequency check every 3 seconds to catch midnight instant accurately
    const interval = setInterval(handleMidnightTransition, 3000);

    // 2. Exact scheduled timeout for the precise stroke of midnight (00:00:01)
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const msUntilMidnight = Math.max(500, nextMidnight.getTime() - now.getTime());
    const midnightTimeout = setTimeout(handleMidnightTransition, msUntilMidnight);

    // 3. Tab visibility change & focus event (handles waking up phone / unlocking screen the next day)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleMidnightTransition();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', handleMidnightTransition);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimeout);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', handleMidnightTransition);
    };
  }, [currentDateStr]);

  // Selected Match for Details Modal
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'lineup' | 'stats' | 'events' | 'predict'>('lineup');

  // FCM & Push Notification State
  const [subscriptions, setSubscriptions] = useState<MatchSubscription[]>([]);
  const [notificationsLog, setNotificationsLog] = useState<PushNotificationLog[]>([]);
  const [subscribeModalMatch, setSubscribeModalMatch] = useState<Match | null>(null);
  const [showNotificationCenter, setShowNotificationCenter] = useState<boolean>(false);

  // Stadium Ambiance Sound Simulation state
  const [stadiumAudioActive, setStadiumAudioActive] = useState<boolean>(false);

  // Auth Welcome Modal Gate
  const [showAuthWelcomeModal, setShowAuthWelcomeModal] = useState<boolean>(false);
  const [showFirstTimePermissions, setShowFirstTimePermissions] = useState<boolean>(false);

  // User Auth & Points State - Strict zero for unregistered guests
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedManual = localStorage.getItem('kora_manual_auth_user');
      if (savedManual) {
        const parsed = JSON.parse(savedManual);
        if (parsed && parsed.uid && parsed.email) {
          return parsed as unknown as User;
        }
      }
    } catch (_) {}
    return null;
  });
  const [userPredictions, setUserPredictions] = useState<Record<string, { predictedHomeScore: number; predictedAwayScore: number }>>({});
  const userPredictionsRef = useRef<Record<string, { predictedHomeScore: number; predictedAwayScore: number }>>({});
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userPredictionPoints, setUserPredictionPoints] = useState<number>(0);
  const [userDiamonds, setUserDiamonds] = useState<number>(0);
  const userDiamondsRef = useRef<number>(0);
  const lastDiamondsUpdateRef = useRef<number>(0);

  useEffect(() => {
    userDiamondsRef.current = userDiamonds;
  }, [userDiamonds]);

  const handleAddDiamonds = (amount: number): number => {
    const userKey = user?.uid || 'guest';
    const currentBalance =
      typeof userDiamondsRef.current === 'number'
        ? userDiamondsRef.current
        : Number(localStorage.getItem(`kora_user_diamonds_${userKey}`) || 0);
    const next = Math.max(0, currentBalance + amount);
    const nowTs = Date.now();
    userDiamondsRef.current = next;
    lastDiamondsUpdateRef.current = nowTs;
    setUserDiamonds(next);

    try {
      localStorage.setItem(`kora_user_diamonds_${userKey}`, next.toString());
      localStorage.setItem(`kora_user_diamonds_updated_at_${userKey}`, nowTs.toString());
      if (user?.uid) {
        fetch('/api/user/sync-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            email: user.email,
            displayName: user.displayName,
            localDiamonds: next,
          }),
        }).catch(() => {});
      }
    } catch (_) {}

    if (user?.uid && auth.currentUser?.uid === user.uid) {
      setDoc(
        doc(db, 'users', user.uid),
        { diamonds: next, updatedAt: new Date(nowTs).toISOString() },
        { merge: true }
      ).catch(() => {});
    }

    try {
      window.dispatchEvent(new CustomEvent('kora_diamonds_updated', { detail: next }));
    } catch (_) {}

    return next;
  };

  useEffect(() => {
    userPredictionsRef.current = userPredictions;
  }, [userPredictions]);

  // Cloud Sync & Data Preservation State
  const [isSavingData, setIsSavingData] = useState<boolean>(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState<boolean>(false);
  const lastNotifiedWinsCountRef = useRef<number>(0);

  // Coins Breakdown Modal & Account Navigation State
  const [showCoinsModal, setShowCoinsModal] = useState<boolean>(false);
  const [accountInitialSubTab, setAccountInitialSubTab] = useState<AccountSubTab>('main');
  const [accountHighlightMatchId, setAccountHighlightMatchId] = useState<string | undefined>(undefined);

  // Pro Subscription Modal State (4 packages with WhatsApp direct purchase)
  const [showProSubscriptionModal, setShowProSubscriptionModal] = useState<boolean>(false);

  // Rewarded ad celebration toast message
  const [rewardToastMessage, setRewardToastMessage] = useState<string | null>(null);

  // 3-Free Predictions per Day logic (First 3 match predictions today are free, subsequent cost 5 coins each)
  const [todayPredictionsCount, setTodayPredictionsCount] = useState<number>(0);

  const getTodayKeyStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const refreshTodayPredictionsCount = (userKey: string) => {
    const storageKey = `kora_my_predictions_${userKey}`;
    const todayPrefix = new Date().toISOString().slice(0, 10);
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setTodayPredictionsCount(0);
        return 0;
      }
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) {
        setTodayPredictionsCount(0);
        return 0;
      }
      const count = arr.filter((p: any) => {
        const pDate = p.createdAt ? p.createdAt.slice(0, 10) : '';
        return pDate === todayPrefix;
      }).length;
      setTodayPredictionsCount(count);
      return count;
    } catch (_) {
      setTodayPredictionsCount(0);
      return 0;
    }
  };

  // Rewarded Ads state (3 ads daily, 5 coins each after full watch)
  const [showRewardedAdModal, setShowRewardedAdModal] = useState<boolean>(false);
  const [selectedAdVideoNumber, setSelectedAdVideoNumber] = useState<number>(1);
  const [todayAdsWatchedCount, setTodayAdsWatchedCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const todayKey = new Date().toISOString().slice(0, 10);
    const uid = auth.currentUser?.uid || localStorage.getItem('kora_user_numeric_id') || 'guest';
    return Number(localStorage.getItem(`kora_ads_count_${uid}_${todayKey}`) || 0);
  });

  // Daily browse ads count (Max 10 per day, 1 coin each)
  const [todayBrowseAdsCount, setTodayBrowseAdsCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const todayKey = new Date().toISOString().slice(0, 10);
    const uid = auth.currentUser?.uid || localStorage.getItem('kora_user_numeric_id') || 'guest';
    return Number(localStorage.getItem(`kora_browse_ads_count_${uid}_${todayKey}`) || 0);
  });

  // Re-check predictions and ads counts when user changes, and prefetch live VAST video ads
  useEffect(() => {
    fetchLiveVastAds().catch(() => {});

    const userKey = user ? user.uid : (localStorage.getItem('kora_user_numeric_id') || 'guest');
    refreshTodayPredictionsCount(userKey);

    const todayKey = new Date().toISOString().slice(0, 10);
    const adCount = Number(localStorage.getItem(`kora_ads_count_${userKey}_${todayKey}`) || 0);
    setTodayAdsWatchedCount(adCount);

    const browseCount = Number(localStorage.getItem(`kora_browse_ads_count_${userKey}_${todayKey}`) || 0);
    setTodayBrowseAdsCount(browseCount);
  }, [user, currentDateStr]);

  // Listen to custom coin update events so userPoints is ALWAYS reactive to any coin change across the app
  useEffect(() => {
    const handleCoinsEvent = () => {
      if (user?.uid) {
        const stored = Number(localStorage.getItem(`kora_user_points_${user.uid}`) || '0');
        setUserPoints(stored);
      } else {
        const guestStored = Number(localStorage.getItem('kora_user_points_guest') || '0');
        setUserPoints(guestStored);
      }
    };

    window.addEventListener('kora_coins_updated', handleCoinsEvent);
    window.addEventListener('storage', handleCoinsEvent);
    return () => {
      window.removeEventListener('kora_coins_updated', handleCoinsEvent);
      window.removeEventListener('storage', handleCoinsEvent);
    };
  }, [user]);

  // Handler for completing a rewarded ad (earns 5 coins per ad)
  const handleCompleteRewardedAd = async () => {
    try {
      // Check if today has active or live matches (ads are disabled on days with no matches)
      const hasActiveMatchesToday = matches.some((m) => {
        if (isMatchRemovedGlobally(m.id) || isMatchObjectRemovedGlobally(m)) return false;
        const isToday = m.date === currentDateStr || m.dayOffset === 0 || isMatchLive(m);
        return isToday && (m.status !== 'FINISHED' || isMatchLive(m));
      });

      if (!hasActiveMatchesToday) {
        setRewardToastMessage(
          language === 'ar'
            ? '🔒 تعال بكره مفيش مباريات اليوم'
            : '🔒 Come back tomorrow, no matches today'
        );
        setTimeout(() => setRewardToastMessage(null), 4000);
        return;
      }

      const todayKey = new Date().toISOString().slice(0, 10);
      const userKey = user?.uid ? user.uid : 'guest';
      const adCountKey = `kora_ads_count_${userKey}_${todayKey}`;
      const currentCount = Number(localStorage.getItem(adCountKey) || todayAdsWatchedCount || 0);

      // Strict limit: maximum 3 ads in the entire day (15 coins total)
      if (currentCount >= 3) {
        setRewardToastMessage(
          language === 'ar'
            ? '⚠️ لقد وصلت للحد الأقصى اليومي (3 إعلانات فقط في اليوم). يتجدد غداً!'
            : '⚠️ You reached the daily limit (3 ads max per day). Resets tomorrow!'
        );
        setTimeout(() => setRewardToastMessage(null), 4000);
        return;
      }

      const newCount = Math.min(3, currentCount + 1);
      setTodayAdsWatchedCount(newCount);
      localStorage.setItem(adCountKey, newCount.toString());
      if (user?.uid) {
        localStorage.setItem(`kora_ads_count_${user.uid}_${todayKey}`, newCount.toString());
      }

      // Track persistent ad reward coins strictly per active user
      const adCoinsKey = `kora_ad_coins_${userKey}`;
      const currentAdCoins = Number(localStorage.getItem(adCoinsKey) || 0);
      const newAdCoins = currentAdCoins + 5;
      localStorage.setItem(adCoinsKey, newAdCoins.toString());

      // Calculate new balance strictly for active account
      const currentPts = user?.uid
        ? Number(localStorage.getItem(`kora_user_points_${user.uid}`) || 0)
        : Number(localStorage.getItem('kora_user_points_guest') || 0);
      const newBalance = currentPts + 5;

      // Update state immediately
      setUserPoints(newBalance);

      // Persist strictly to active account storage
      if (user?.uid) {
        localStorage.setItem(`kora_user_points_${user.uid}`, newBalance.toString());
      } else {
        localStorage.setItem('kora_user_points_guest', newBalance.toString());
      }
      try {
        localStorage.removeItem('kora_user_points');
      } catch (_) {}

      // Record in local history strictly for active user
      try {
        const histKey = `kora_coins_history_${userKey}`;
        const existingHist = JSON.parse(localStorage.getItem(histKey) || '[]');
        const rewardEntry = {
          id: `ad_reward_${todayKey}_${Date.now()}`,
          type: 'AD_REWARD',
          titleAr: `مكافأة مشاهدة إعلان كامل (+5 كوينز) 📺`,
          titleEn: `Rewarded Ad Completion (+5 Coins) 📺`,
          coins: 5,
          date: new Date().toISOString(),
          balanceAfter: newBalance,
        };
        const updatedHist = JSON.stringify([rewardEntry, ...existingHist].slice(0, 50));
        localStorage.setItem(histKey, updatedHist);
      } catch (_) {}

      // Sync to Firestore & Backend immediately if user logged in
      if (user?.uid) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            points: newBalance,
            coins: newBalance,
            lastAdWatchDate: todayKey,
            adsWatchedToday: newCount,
            adRewardCoins: newAdCoins,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (_) {}

        try {
          fetch('/api/user/add-ad-reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              email: user.email,
              rewardType: 'REWARDED_VIDEO',
              coinsToAdd: 5,
            }),
          }).catch(() => {});
        } catch (_) {}
      }

      // Trigger celebratory toast notification
      setRewardToastMessage(
        language === 'ar'
          ? (newCount >= 3
              ? `🎉 رائع! أكملت الحد الأقصى (3 من 3 إعلانات اليوم) وحصلت على +15 كوينز! رصيدك: ${newBalance} 🪙`
              : `🎉 تم إضافة 5 كوينز بنجاح! (${newCount} من 3 إعلانات اليوم) • رصيدك: ${newBalance} كوينز 🪙`)
          : (newCount >= 3
              ? `🎉 Fantastic! You completed the daily limit (3 of 3 ads) and earned +15 coins! Balance: ${newBalance} 🪙`
              : `🎉 +5 Coins added! (${newCount}/3 ads today) • Balance: ${newBalance} coins 🪙`)
      );
      setTimeout(() => setRewardToastMessage(null), 4500);

      window.dispatchEvent(new Event('kora_coins_updated'));
      window.dispatchEvent(new Event('kora_payout_profile_updated'));
    } catch (e) {
      console.error('Error recording rewarded ad:', e);
    }
  };

  // Handler for visiting/browsing sponsored ad from banner (earns 1 coin every time user enters and returns, max 10 times daily)
  const handleBrowseAdReward = async (coinsToAdd: number = 1): Promise<{ success: boolean; newCount: number; maxReached: boolean }> => {
    if (IS_ONE_COIN_ADS_PAUSED) {
      return { success: false, newCount: todayBrowseAdsCount, maxReached: true };
    }
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      const userKey = user?.uid ? user.uid : 'guest';
      const countKey = `kora_browse_ads_count_${userKey}_${todayKey}`;
      const currentCount = Number(localStorage.getItem(countKey) || todayBrowseAdsCount || 0);

      if (currentCount >= 10) {
        return { success: false, newCount: currentCount, maxReached: true };
      }

      const newCount = currentCount + 1;
      setTodayBrowseAdsCount(newCount);
      localStorage.setItem(countKey, newCount.toString());

      // Track persistent browse coins strictly for active user
      const browseCoinsKey = `kora_browse_ad_coins_${userKey}`;
      const currentBrowseCoins = Number(localStorage.getItem(browseCoinsKey) || 0);
      const newBrowseCoins = currentBrowseCoins + coinsToAdd;
      localStorage.setItem(browseCoinsKey, newBrowseCoins.toString());

      const currentPts = user?.uid
        ? Number(localStorage.getItem(`kora_user_points_${user.uid}`) || 0)
        : Number(localStorage.getItem('kora_user_points_guest') || 0);
      const newBalance = currentPts + coinsToAdd;
      setUserPoints(newBalance);
      if (user?.uid) {
        localStorage.setItem(`kora_user_points_${user.uid}`, newBalance.toString());
      } else {
        localStorage.setItem('kora_user_points_guest', newBalance.toString());
      }
      try {
        localStorage.removeItem('kora_user_points');
      } catch (_) {}

      // Record in coins transaction history
      try {
        const histKey = `kora_coins_history_${userKey}`;
        const existingHist = JSON.parse(localStorage.getItem(histKey) || '[]');
        const rewardEntry = {
          id: `ad_browse_${Date.now()}`,
          type: 'AD_BROWSE_REWARD',
          titleAr: `مكافأة تصفح الإعلان (${newCount}/10) (+${coinsToAdd} كوينز) 🪙`,
          titleEn: `Ad Visit Reward (${newCount}/10) (+${coinsToAdd} coin) 🪙`,
          coins: coinsToAdd,
          date: new Date().toISOString(),
          balanceAfter: newBalance,
        };
        localStorage.setItem(histKey, JSON.stringify([rewardEntry, ...existingHist].slice(0, 50)));
      } catch (_) {}

      // Sync to Firestore & Backend immediately if user logged in
      if (user?.uid) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            points: newBalance,
            coins: newBalance,
            browseAdCoins: newBrowseCoins,
            browseAdsToday: newCount,
            lastBrowseAdDate: todayKey,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (_) {}

        try {
          fetch('/api/user/add-ad-reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              email: user.email,
              rewardType: 'BROWSE',
              coinsToAdd,
            }),
          }).catch(() => {});
        } catch (_) {}
      }

      // Trigger celebratory toast notification
      setRewardToastMessage(
        language === 'ar'
          ? `🎉 تم التحقق من تصفح الإعلان بالمتصفح وإضافة ${coinsToAdd} كوينز! رصيدك الحالي: ${newBalance} كوينز 🪙`
          : `🎉 Ad verified in browser! +${coinsToAdd} Coin added! Current: ${newBalance} coins 🪙`
      );
      setTimeout(() => setRewardToastMessage(null), 3500);

      window.dispatchEvent(new Event('kora_coins_updated'));
      window.dispatchEvent(new Event('kora_payout_profile_updated'));
      return { success: true, newCount, maxReached: newCount >= 10 };
    } catch (e) {
      console.error('Error adding browse ad reward:', e);
      return { success: false, newCount: todayBrowseAdsCount, maxReached: false };
    }
  };

  // Matches Page Sub-Tabs: 1. المباريات والجوائز (Fixtures & Prizes) | 2. المباريات المنتهية (Finished Matches)
  const [matchesSubTab, setMatchesSubTab] = useState<'fixtures_prizes' | 'finished'>('fixtures_prizes');

  const isAr = language === 'ar';

  // Require Auth Guard Helper: Intercepts clicks for unauthenticated users
  const handleProtectedAction = (callback?: () => void) => {
    if (!user) {
      setShowAuthWelcomeModal(true);
      return;
    }
    if (callback) callback();
  };

  // Instant Tab Navigation Helper with History Support for Smooth Back Navigation
  const handleTabChange = (tab: 'matches' | 'tournaments' | 'games' | 'prizes' | 'account' | 'favorites') => {
    setSelectedMatch(null);
    setSubscribeModalMatch(null);
    setShowNotificationCenter(false);
    setShowAuthWelcomeModal(false);
    setShowCoinsModal(false);

    if (tab !== activeTab) {
      setTabHistory((prev) => {
        const filtered = prev.filter((t) => t !== tab);
        return [...filtered, activeTab];
      });
      setActiveTab(tab);
    }
    try {
      window.history.pushState({ tab }, '', `#${tab}`);
    } catch (e) {
      // Ignore iframe history push restrictions if any
    }
    try {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    } catch (_) {
      window.scrollTo(0, 0);
    }
  };

  // Smart Direct Exit/Back Function to return user to the last page they were on
  const handleClosePage = () => {
    if (selectedMatch) {
      setSelectedMatch(null);
      return;
    }
    if (subscribeModalMatch) {
      setSubscribeModalMatch(null);
      return;
    }
    if (showNotificationCenter) {
      setShowNotificationCenter(false);
      return;
    }
    if (showCoinsModal) {
      setShowCoinsModal(false);
      return;
    }
    if (showAuthWelcomeModal) {
      setShowAuthWelcomeModal(false);
      return;
    }

    // Return to the previous tab from navigation history
    if (tabHistory.length > 0) {
      const prevTab = tabHistory[tabHistory.length - 1];
      setTabHistory((prev) => prev.slice(0, -1));
      setActiveTab(prevTab);
      try {
        window.history.pushState({ tab: prevTab }, '', `#${prevTab}`);
      } catch (_) {}
    } else if (activeTab !== 'matches') {
      setActiveTab('matches');
      try {
        window.history.pushState({ tab: 'matches' }, '', '#matches');
      } catch (_) {}
    }

    try {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    } catch (_) {
      window.scrollTo(0, 0);
    }
  };

  // Browser Back Button & Hardware Swipe Navigation Handling
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (selectedMatch) {
        setSelectedMatch(null);
      } else if (subscribeModalMatch) {
        setSubscribeModalMatch(null);
      } else if (showNotificationCenter) {
        setShowNotificationCenter(false);
      } else if (showCoinsModal) {
        setShowCoinsModal(false);
      } else if (showAuthWelcomeModal) {
        setShowAuthWelcomeModal(false);
      } else if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else {
        handleClosePage();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedMatch, subscribeModalMatch, showNotificationCenter, showCoinsModal, showAuthWelcomeModal, activeTab, tabHistory]);

  // Synchronize document direction, html attributes, content-language meta tag, and persist language selection
  useEffect(() => {
    localStorage.setItem('kora_app_lang', language);
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    document.documentElement.setAttribute('xml:lang', language);
    document.documentElement.setAttribute('translate', 'no');
    document.documentElement.classList.add('notranslate');

    // Keep <meta http-equiv="content-language"> updated for Google Translate
    let metaLang = document.querySelector('meta[http-equiv="content-language"]');
    if (!metaLang) {
      metaLang = document.createElement('meta');
      metaLang.setAttribute('http-equiv', 'content-language');
      document.head.appendChild(metaLang);
    }
    metaLang.setAttribute('content', language);
  }, [language]);

  // Real-time Push Notification Subscriptions & Logs Listener
  useEffect(() => {
    syncLeagueTournamentWithServer(user).catch(() => {});
    const unsubSubs = listenToUserSubscriptions(user ? user.uid : '', (subs) => {
      setSubscriptions(subs);
    });
    const unsubLogs = listenToNotificationLogs(user ? user.uid : '', (logs) => {
      setNotificationsLog(logs);
    });
    return () => {
      unsubSubs();
      unsubLogs();
    };
  }, [user]);

  // API-Football Real-Time Match Synchronizer:
  // ⚡ Starts with the first match of the day and updates every 3 minutes (180,000 ms)
  const [isSyncingFootball, setIsSyncingFootball] = useState<boolean>(false);
  const [lastFootballSyncTime, setLastFootballSyncTime] = useState<string | null>(null);
  const lastSyncTimestampRef = useRef<number>(0);

  const handleFootballApiSync = async (force: boolean = false) => {
    const now = Date.now();
    const currentMatchesList = matchesRef.current;

    // If not forced, enforce quota protection & 3-minute throttle (180,000 ms)
    if (!force) {
      const hasActiveMatches = hasLiveOrStartedMatchesToday(currentMatchesList);
      if (!hasActiveMatches) {
        return;
      }
      if (lastSyncTimestampRef.current > 0 && now - lastSyncTimestampRef.current < 180000) {
        return;
      }
    } else {
      // 5-second debounce for entrance / manual triggers
      if (lastSyncTimestampRef.current > 0 && now - lastSyncTimestampRef.current < 5000) {
        return;
      }
    }

    if (isSyncingFootball) return;
    setIsSyncingFootball(true);
    lastSyncTimestampRef.current = now;

    try {
      const syncData = await fetchApiFootballLiveMatches(currentMatchesList, language);
      if (syncData && syncData.success && Array.isArray(syncData.syncedMatches) && syncData.syncedMatches.length > 0) {
        setMatches((prevMatches) => deduplicateMatches(processApiFootballSyncedMatches(prevMatches, syncData.syncedMatches, language)));
        setLastFootballSyncTime(new Date().toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US'));
      }
    } catch (err) {
      console.warn('API-Football Live Sync notice:', err);
    } finally {
      setIsSyncingFootball(false);
    }
  };

  // Auto-Sync with API-Football:
  // 1. Auto-updates immediately whenever the user enters the site (visibilitychange/focus).
  // 2. Starts live fetching as soon as the first match of the day kicks off.
  // 3. Ongoing 3-minute (180,000 ms) periodic sync during active matches.
  useEffect(() => {
    // Auto-update immediately upon site entrance/mount
    handleFootballApiSync(true);

    // ⚡ Kickoff watcher: triggers when today's 1st match begins (every 60s when visible)
    const kickoffWatcherInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const hasActiveMatches = hasLiveOrStartedMatchesToday(matchesRef.current);
        if (hasActiveMatches) {
          handleFootballApiSync();
        }
      }
    }, 60000);

    // ⚡ Periodic sync every 3 minutes (180,000 milliseconds) during matches to preserve connection
    const footballSyncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleFootballApiSync();
      }
    }, 180000);

    // ⚡ Auto-update whenever the user enters or returns to the application tab (60s throttle to avoid proxy 429)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastSyncTimestampRef.current > 60000) {
          handleFootballApiSync(true);
        }
      }
    };

    const handleWindowFocus = () => {
      const now = Date.now();
      if (now - lastSyncTimestampRef.current > 60000) {
        handleFootballApiSync(true);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(kickoffWatcherInterval);
      clearInterval(footballSyncInterval);
    };
  }, [language]);

  // Automated Match Notification & Broadcast Engine:
  // 1. Smart Kickoff Reminder (with customizable interval: 15, 30, 45, 60, 120 mins)
  // 2. Controlled Broadcast for Newly Added Featured Matches (staggered, 1 every 2 hours)
  // 3. 1 Day before match (dayOffset === 1 / Tomorrow)
  // 4. Match day morning (dayOffset === 0 / Today, morning >= 8 AM)
  // 5. Shortly before kickoff countdown alert
  useEffect(() => {
    const activeUserId = user ? user.uid : 'guest';
    if (matches.length > 0) {
      autoDetectAndBroadcastNewFeaturedMatches(matches, language);
      checkAndDispatchMatchNotifications(matches, language, subscriptions, favoriteMatchIds, activeUserId);
    }

    // Daily League Tournament Notification (Strictly throttled to 1 alert per day until tournament starts)
    try {
      const activeTourn = getActiveLeagueTournament();
      checkAndSendDailyTournamentNotification(activeTourn, (notif) => {
        sendMatchLiveNotification({
          matchId: activeTourn.id,
          title: notif.title,
          titleAr: notif.titleAr,
          body: notif.body,
          bodyAr: notif.bodyAr,
          type: 'SMART_REMINDER',
          ctaTextAr: '🏆 انضم للمسابقة الآن',
          ctaText: '🏆 Join League Tournament',
        });
      });
    } catch (_) {}
    const notifInterval = setInterval(() => {
      if (matches.length > 0) {
        autoDetectAndBroadcastNewFeaturedMatches(matches, language);
        checkAndDispatchMatchNotifications(matches, language, subscriptions, favoriteMatchIds, activeUserId);
      }
    }, 30000);
    return () => clearInterval(notifInterval);
  }, [matches, language, subscriptions, favoriteMatchIds, user]);

  const isSaidUserCheck = (u: any): boolean => {
    if (!u) return false;
    const email = (u.email || '').toLowerCase().trim();
    const name = (u.displayName || '').toLowerCase().trim();
    const uid = String(u.uid || u.userId || '').trim();
    return Boolean(
      email === 'saidelpana3@gmail.com' ||
      email === 'saidelbana520@gmail.com' ||
      email === 'elbanasaid79@gmail.com' ||
      email.startsWith('saidelpana') ||
      email.startsWith('saidelbana') ||
      uid === 'GVZ5QHmn5qeYgOYPaLdPcAXbcUg1' ||
      uid === 'user_saidelpana3_gmail_com' ||
      uid === 'user_saidelbana520_gmail_com' ||
      uid === 'user_said_el_bana' ||
      uid === '33074925' ||
      uid === '40057253' ||
      uid === '86600656' ||
      name.includes('said el bana') ||
      name.includes('saidelpana') ||
      name.includes('saidelbana') ||
      name.includes('سعيد البنا') ||
      name === 'kora win'
    );
  };

  // Helper to resolve a user's prediction for a match even if home/away IDs or aliases vary across devices
  const getPredictionForMatch = (match: Match | null | undefined, predsMap: Record<string, { predictedHomeScore: number; predictedAwayScore: number }> = userPredictions) => {
    if (!match || !predsMap) return undefined;
    if (predsMap[match.id]) return predsMap[match.id];

    // Check reversed home/away slug e.g. m_epl_chelsea_fulham <-> m_epl_fulham_chelsea
    const parts = match.id.split('_');
    if (parts.length >= 4 && parts[0] === 'm') {
      const leaguePrefix = parts.slice(0, 2).join('_');
      const teamA = parts[2];
      const teamB = parts.slice(3).join('_');
      const reversedId = `${leaguePrefix}_${teamB}_${teamA}`;
      if (predsMap[reversedId]) {
        return {
          predictedHomeScore: predsMap[reversedId].predictedAwayScore,
          predictedAwayScore: predsMap[reversedId].predictedHomeScore,
        };
      }
    }
    return undefined;
  };

  // Listen to Auth State and Real-Time User Points with Strict Account Isolation
  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;
    let unsubPredictions: (() => void) | null = null;
    let unsubClaims: (() => void) | null = null;
    let unsubPayoutProfile: (() => void) | null = null;
    let previousUserUid: string | null = null;

    const handleActiveUser = async (firebaseUser: User | null) => {
      let currentUser: User | null = firebaseUser;
      if (!currentUser) {
        try {
          const savedManual = localStorage.getItem('kora_manual_auth_user');
          if (savedManual) {
            const parsed = JSON.parse(savedManual);
            if (parsed && parsed.uid) {
              currentUser = parsed as unknown as User;
            }
          }
        } catch (_) {}
      }

      // If opened on mobile/PWA where localStorage is isolated from Google browser, restore active session from backend unless user explicitly signed out
      if (!currentUser) {
        const explicitlySignedOut = localStorage.getItem('kora_show_install_after_logout') === 'true';
        if (!explicitlySignedOut) {
          try {
            const activeRes = await fetch('/api/user/active-session');
            if (activeRes.ok) {
              const activeData = await activeRes.json();
              if (activeData?.success && activeData?.account?.userId) {
                const acc = activeData.account;
                const restoredUser = {
                  uid: acc.userId,
                  email: acc.email || '',
                  displayName: acc.displayName || 'الكابتن',
                  photoURL: acc.photoURL || '',
                  isManualAuth: true,
                };
                localStorage.setItem('kora_manual_auth_user', JSON.stringify(restoredUser));
                currentUser = restoredUser as unknown as User;
              }
            }
          } catch (_) {}
        }
      }

      // Clean up previous user snapshot listener if any
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }
      if (unsubPredictions) {
        unsubPredictions();
        unsubPredictions = null;
      }
      if (unsubClaims) {
        unsubClaims();
        unsubClaims = null;
      }
      if (unsubPayoutProfile) {
        unsubPayoutProfile();
        unsubPayoutProfile = null;
      }

      // Only reset in-memory states if switching accounts or logging out
      if (!currentUser || (previousUserUid && previousUserUid !== currentUser.uid)) {
        setUserPredictions({});
        userPredictionsRef.current = {};
        setUserPoints(0);
        setUserPredictionPoints(0);
        userDiamondsRef.current = 0;
        setUserDiamonds(0);
      }
      try {
        localStorage.removeItem('kora_user_points');
        localStorage.removeItem('kora_ad_coins');
        localStorage.removeItem('kora_browse_ad_coins');
        localStorage.removeItem('kora_coins_history');
      } catch (_) {}

      if (currentUser) {
        // If user was previously logged out and logged in again, trigger install prompt
        try {
          const hadLoggedOut = localStorage.getItem('kora_show_install_after_logout') === 'true';
          if (hadLoggedOut) {
            localStorage.removeItem('kora_install_prompt_responded');
            localStorage.removeItem('kora_first_visit_install_prompt_responded');
            localStorage.removeItem('kora_show_install_after_logout');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('kora_show_first_visit_install_prompt'));
            }, 1200);
          }
        } catch (_) {}
        previousUserUid = currentUser.uid;
        setUser(currentUser);

        // Immediate bulletproof coin restore for this specific account
        const userCoinsKey = `kora_user_points_${currentUser.uid}`;
        const isSaidUser = isSaidUserCheck(currentUser);
        const minAllowedCoins = isSaidUser ? 193 : 0;
        let cachedCoins = Math.max(minAllowedCoins, Number(localStorage.getItem(userCoinsKey) || 0));

        // Seamlessly migrate guest coins (e.g. earned from watching ads before logging in) to this user
        const guestCoins = Number(localStorage.getItem('kora_user_points_guest') || 0);
        const guestAdCoins = Number(localStorage.getItem('kora_ad_coins_guest') || 0);
        const guestBrowseCoins = Number(localStorage.getItem('kora_browse_ad_coins_guest') || 0);
        if (guestCoins > 0) {
          cachedCoins += guestCoins;
          localStorage.setItem(userCoinsKey, cachedCoins.toString());
          if (guestAdCoins > 0) {
            const curAd = Number(localStorage.getItem(`kora_ad_coins_${currentUser.uid}`) || 0);
            localStorage.setItem(`kora_ad_coins_${currentUser.uid}`, (curAd + guestAdCoins).toString());
          }
          if (guestBrowseCoins > 0) {
            const curBr = Number(localStorage.getItem(`kora_browse_ad_coins_${currentUser.uid}`) || 0);
            localStorage.setItem(`kora_browse_ad_coins_${currentUser.uid}`, (curBr + guestBrowseCoins).toString());
          }
          localStorage.removeItem('kora_user_points_guest');
          localStorage.removeItem('kora_ad_coins_guest');
          localStorage.removeItem('kora_browse_ad_coins_guest');
        }

        if (cachedCoins > 0) {
          setUserPoints(cachedCoins);
        }

        const rawCachedDiamonds = localStorage.getItem(`kora_user_diamonds_${currentUser.uid}`);
        const cachedDiamonds = rawCachedDiamonds !== null ? Math.max(0, Number(rawCachedDiamonds) || 0) : 0;
        userDiamondsRef.current = cachedDiamonds;
        setUserDiamonds(cachedDiamonds);

        // Load favorite matches from local cache for this user
        const userPermsConfirmed = localStorage.getItem(`kora_permissions_confirmed_${currentUser.uid}`);
        if (!userPermsConfirmed) {
          // If the account was created within the last 5 minutes, ensure notification prompt is displayed immediately
          const createdAt = currentUser.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).getTime() : 0;
          const isBrandNewUser = createdAt > 0 && (Date.now() - createdAt < 300000);
          if (isBrandNewUser) {
            setShowFirstTimePermissions(true);
          }
        }

        const localFavsRaw = localStorage.getItem(`kora_favorites_${currentUser.uid}`);
        if (localFavsRaw) {
          try {
            const parsedFavs = JSON.parse(localFavsRaw);
            if (Array.isArray(parsedFavs)) setFavoriteMatchIds(parsedFavs);
          } catch (_) {}
        }

        // Load account-specific predictions from local cache strictly for this user
        const userStorageKey = `kora_my_predictions_${currentUser.uid}`;
        const localPredsRaw = localStorage.getItem(userStorageKey);
        let initialLocalPreds: any[] = [];
        if (localPredsRaw) {
          try {
            const rawParsed = JSON.parse(localPredsRaw);
            if (Array.isArray(rawParsed)) {
              initialLocalPreds = rawParsed.filter((p: any) => {
                const mId = p.matchId || p.id;
                return !isMatchRemovedGlobally(mId);
              });
              if (initialLocalPreds.length !== rawParsed.length) {
                localStorage.setItem(userStorageKey, JSON.stringify(initialLocalPreds));
              }
            }
            if (Array.isArray(initialLocalPreds) && initialLocalPreds.length > 0) {
              const localMap: Record<string, { predictedHomeScore: number; predictedAwayScore: number }> = {};
              initialLocalPreds.forEach((p: any) => {
                const mId = p.matchId || p.id;
                if (mId && !isMatchRemovedGlobally(mId)) {
                  localMap[mId] = {
                    predictedHomeScore: Number(p.predictedHomeScore ?? 0),
                    predictedAwayScore: Number(p.predictedAwayScore ?? 0),
                  };
                }
              });
              userPredictionsRef.current = { ...userPredictionsRef.current, ...localMap };
              setUserPredictions((prev) => ({ ...prev, ...localMap }));
            }
          } catch (_) {}
        }

        // Migrate any guest predictions made before logging in (from link/Google/PWA) to this user account
        const guestKeys = ['kora_my_predictions_guest', 'kora_guest_predictions'];
        let migratedAnyGuestPred = false;
        guestKeys.forEach((gk) => {
          const gRaw = localStorage.getItem(gk);
          if (gRaw) {
            try {
              const gParsed = JSON.parse(gRaw);
              if (Array.isArray(gParsed) && gParsed.length > 0) {
                gParsed.forEach((gp: any) => {
                  const mId = gp.matchId || gp.id;
                  if (mId && !isMatchRemovedGlobally(mId)) {
                    if (!initialLocalPreds.some((p: any) => (p.matchId || p.id) === mId)) {
                      const migratedRecord = {
                        ...gp,
                        id: `pred_${currentUser.uid}_${mId}`,
                        matchId: mId,
                        userId: currentUser.uid,
                        userEmail: (currentUser.email || '').toLowerCase().trim(),
                        userDisplayName: currentUser.displayName || 'الكابتن',
                      };
                      initialLocalPreds.push(migratedRecord);
                      migratedAnyGuestPred = true;
                      setDoc(doc(db, 'predictions', migratedRecord.id), migratedRecord, { merge: true }).catch(() => {});
                    }
                  }
                });
                localStorage.removeItem(gk);
              }
            } catch (_) {}
          }
        });
        if (migratedAnyGuestPred && initialLocalPreds.length > 0) {
          const migratedMap: Record<string, { predictedHomeScore: number; predictedAwayScore: number }> = {};
          initialLocalPreds.forEach((p: any) => {
            const mId = p.matchId || p.id;
            if (mId && !isMatchRemovedGlobally(mId)) {
              migratedMap[mId] = {
                predictedHomeScore: Number(p.predictedHomeScore ?? 0),
                predictedAwayScore: Number(p.predictedAwayScore ?? 0),
              };
            }
          });
          userPredictionsRef.current = { ...userPredictionsRef.current, ...migratedMap };
          setUserPredictions((prev) => ({ ...prev, ...migratedMap }));
        }

        // 1. Attach Real-Time Listener to User Firestore Document
        const isAshrafFaroukUser = Boolean(
          currentUser?.email?.toLowerCase().includes('ashraf17farouk') ||
          currentUser?.uid === '76088785' ||
          currentUser?.uid === 'user_ashraf17farouk_gmail_com' ||
          (currentUser?.displayName && currentUser.displayName.includes('Ashraf Farouk'))
        );

        // Evaluate predictions according to official final match results
        initialLocalPreds = initialLocalPreds.map((p: any) => {
          const mId = p.matchId || p.id;
          if (mId && (mId.includes('realmadrid_inter') || mId.includes('inter_realmadrid'))) {
            const ph = Number(p.predictedHomeScore);
            const pa = Number(p.predictedAwayScore);
            const isExact = (mId.includes('inter_realmadrid') && ph === 1 && pa === 2) || (ph === 2 && pa === 1);
            return {
              ...p,
              matchHomeScore: mId.includes('inter_realmadrid') ? 1 : 2,
              matchAwayScore: mId.includes('inter_realmadrid') ? 2 : 1,
              status: isExact ? 'EXACT_SCORE' : 'MISSED',
              pointsEarned: isExact ? 150 : 0,
              coinsEarned: isExact ? 150 : 0,
              evaluated: true,
            };
          }
          if (mId && (mId.includes('mokawloon_ahly') || mId.includes('ahly_mokawloon'))) {
            const ph = Number(p.predictedHomeScore);
            const pa = Number(p.predictedAwayScore);
            const isExact = ph === 1 && pa === 1;
            return {
              ...p,
              matchHomeScore: 1,
              matchAwayScore: 1,
              status: isExact ? 'EXACT_SCORE' : 'MISSED',
              pointsEarned: isExact ? 50 : 0,
              coinsEarned: isExact ? 50 : 0,
              evaluated: true,
            };
          }
          if (mId === 'm_laliga_sociedad_celta' || mId === 'm_laliga_celta_sociedad') {
            const isExact = Number(p.predictedHomeScore) === 0 && Number(p.predictedAwayScore) === 0;
            return {
              ...p,
              matchHomeScore: 0,
              matchAwayScore: 0,
              status: isExact ? 'EXACT_SCORE' : 'MISSED',
              pointsEarned: isExact ? 50 : 0,
              coinsEarned: isExact ? 50 : 0,
            };
          }
          return p;
        });
        localStorage.setItem(userStorageKey, JSON.stringify(initialLocalPreds));

        if (isAshrafFaroukUser) {
          const existingSocIndex = initialLocalPreds.findIndex((p: any) => p.matchId === 'm_laliga_sociedad_celta');
          const socPred = {
            id: `pred_${currentUser.uid}_m_laliga_sociedad_celta`,
            matchId: 'm_laliga_sociedad_celta',
            matchHomeTeam: 'Real Sociedad',
            matchHomeTeamAr: 'ريال سوسيداد',
            matchAwayTeam: 'Celta Vigo',
            matchAwayTeamAr: 'سلتا فيغو',
            predictedHomeScore: 0,
            predictedAwayScore: 0,
            matchHomeScore: 0,
            matchAwayScore: 0,
            status: 'EXACT_SCORE',
            pointsEarned: 50,
            coinsEarned: 50,
            evaluated: true,
            createdAt: '2026-09-03T20:00:00.000Z',
          };
          if (existingSocIndex >= 0) {
            initialLocalPreds[existingSocIndex] = socPred;
          } else {
            initialLocalPreds.push(socPred);
          }
          localStorage.setItem(userStorageKey, JSON.stringify(initialLocalPreds));

          setUserPredictions((prev) => ({
            ...prev,
            'm_laliga_sociedad_celta': { predictedHomeScore: 0, predictedAwayScore: 0 },
          }));
        }

        // 🌟 1. Instant Unified Cross-Device Account Sync from Backend Storage
        try {
          const syncRes = await fetch(`/api/user/sync-account?userId=${encodeURIComponent(currentUser.uid)}&email=${encodeURIComponent(currentUser.email || '')}&displayName=${encodeURIComponent(currentUser.displayName || '')}`);
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (syncData?.success && syncData?.account) {
              const acc = syncData.account;
              const isSaidUser = isSaidUserCheck(currentUser);
              const minAllowed = isSaidUser ? 209 : 0;
              const accCoins = Math.max(minAllowed, Number(acc.coins || acc.points || 0));
              const accPredPoints = Math.max(minAllowed, Number(acc.predictionPoints || 0));
              const currentLocalCoins = Number(localStorage.getItem(`kora_user_points_${currentUser.uid}`) || 0);

              // Sync adRewardCoins, browseAdCoins, dailyGiftCoins, and coinsHistory across devices
              if (typeof acc.adRewardCoins === 'number' && acc.adRewardCoins > 0) {
                const curAd = Number(localStorage.getItem(`kora_ad_coins_${currentUser.uid}`) || 0);
                if (acc.adRewardCoins > curAd) {
                  localStorage.setItem(`kora_ad_coins_${currentUser.uid}`, String(acc.adRewardCoins));
                }
              }
              if (typeof acc.browseAdCoins === 'number' && acc.browseAdCoins > 0) {
                const curBr = Number(localStorage.getItem(`kora_browse_ad_coins_${currentUser.uid}`) || 0);
                if (acc.browseAdCoins > curBr) {
                  localStorage.setItem(`kora_browse_ad_coins_${currentUser.uid}`, String(acc.browseAdCoins));
                }
              }
              if (typeof acc.dailyGiftCoins === 'number' && acc.dailyGiftCoins > 0) {
                const curDaily = Number(localStorage.getItem(`kora_daily_coins_${currentUser.uid}`) || 0);
                if (acc.dailyGiftCoins > curDaily) {
                  localStorage.setItem(`kora_daily_coins_${currentUser.uid}`, String(acc.dailyGiftCoins));
                }
              }
              if (Array.isArray(acc.coinsHistory) && acc.coinsHistory.length > 0) {
                const histKey = `kora_coins_history_${currentUser.uid}`;
                let localHist: any[] = [];
                try {
                  localHist = JSON.parse(localStorage.getItem(histKey) || '[]');
                } catch (_) {}
                const histMap = new Map<string, any>();
                localHist.forEach((h: any, idx: number) => histMap.set(h.id || `${h.type}_${h.date || idx}`, h));
                acc.coinsHistory.forEach((h: any, idx: number) => histMap.set(h.id || `${h.type}_${h.date || idx}`, h));
                localStorage.setItem(histKey, JSON.stringify(Array.from(histMap.values())));
              }

              const bestCoins = Math.max(accCoins, currentLocalCoins, minAllowed);
              if (bestCoins > 0) {
                setUserPoints(bestCoins);
                localStorage.setItem(`kora_user_points_${currentUser.uid}`, bestCoins.toString());
              }
              if (accPredPoints > 0) {
                setUserPredictionPoints(accPredPoints);
              }
              if (typeof acc.diamonds === 'number' && Date.now() - lastDiamondsUpdateRef.current >= 15000) {
                const rawLocalDiamonds = localStorage.getItem(`kora_user_diamonds_${currentUser.uid}`);
                const localDiamondsTs = Number(localStorage.getItem(`kora_user_diamonds_updated_at_${currentUser.uid}`) || 0);
                const serverUpdatedTs = acc.updatedAt ? new Date(acc.updatedAt).getTime() : 0;

                if (rawLocalDiamonds !== null && localDiamondsTs > 0 && localDiamondsTs > serverUpdatedTs) {
                  const localDiamondsVal = Math.max(0, Number(rawLocalDiamonds) || 0);
                  userDiamondsRef.current = localDiamondsVal;
                  setUserDiamonds(localDiamondsVal);
                  fetch('/api/user/sync-account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: currentUser.uid,
                      email: currentUser.email,
                      displayName: currentUser.displayName,
                      localDiamonds: localDiamondsVal,
                    }),
                  }).catch(() => {});
                } else {
                  const serverDiamondsVal = Math.max(0, Number(acc.diamonds) || 0);
                  userDiamondsRef.current = serverDiamondsVal;
                  setUserDiamonds(serverDiamondsVal);
                  localStorage.setItem(`kora_user_diamonds_${currentUser.uid}`, String(serverDiamondsVal));
                }
              }

              // Hydrate both predictionsMap and predictionsList into state and localStorage
              const serverPredsMap: Record<string, { predictedHomeScore: number; predictedAwayScore: number }> = {};
              if (acc.predictionsMap && typeof acc.predictionsMap === 'object') {
                Object.entries(acc.predictionsMap).forEach(([mId, val]: [string, any]) => {
                  if (mId && val && !isMatchRemovedGlobally(mId)) {
                    serverPredsMap[mId] = {
                      predictedHomeScore: Number(val.predictedHomeScore ?? 0),
                      predictedAwayScore: Number(val.predictedAwayScore ?? 0),
                    };
                  }
                });
              }

              const existingLocalRaw = localStorage.getItem(userStorageKey);
              let existingLocalList: any[] = [];
              try {
                existingLocalList = JSON.parse(existingLocalRaw || '[]');
              } catch (_) {}

              const mergedMap = new Map<string, any>();
              existingLocalList.forEach((p: any) => {
                const mId = p.matchId || p.id;
                if (mId && !isMatchRemovedGlobally(mId)) mergedMap.set(mId, p);
              });
              if (Array.isArray(acc.predictionsList)) {
                acc.predictionsList.forEach((p: any) => {
                  const mId = p.matchId || p.id;
                  if (mId && !isMatchRemovedGlobally(mId)) {
                    const ex = mergedMap.get(mId);
                    if (!ex || !ex.updatedAt || !p.updatedAt || new Date(p.updatedAt) >= new Date(ex.updatedAt)) {
                      mergedMap.set(mId, { ...ex, ...p, matchId: mId });
                    }
                    serverPredsMap[mId] = {
                      predictedHomeScore: Number(p.predictedHomeScore ?? 0),
                      predictedAwayScore: Number(p.predictedAwayScore ?? 0),
                    };
                  }
                });
              }

              if (Object.keys(serverPredsMap).length > 0) {
                setUserPredictions((prev) => {
                  const updated = { ...prev, ...serverPredsMap };
                  userPredictionsRef.current = updated;
                  return updated;
                });
              }

              if (mergedMap.size > 0) {
                const combinedList = Array.from(mergedMap.values());
                initialLocalPreds = combinedList;
                localStorage.setItem(userStorageKey, JSON.stringify(combinedList));
                window.dispatchEvent(new CustomEvent('kora_predictions_updated', { detail: combinedList }));
              }

              // If account has favoriteMatches, hydrate favorites
              if (Array.isArray(acc.favoriteMatches) && acc.favoriteMatches.length > 0) {
                setFavoriteMatchIds((prev) => Array.from(new Set([...prev, ...acc.favoriteMatches])));
              }

              window.dispatchEvent(new Event('kora_coins_updated'));
            }
          }
        } catch (syncErr) {
          console.warn("Notice during initial cross-device account sync:", syncErr);
        }

        const userRef = doc(db, 'users', currentUser.uid);
        unsubUserDoc = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const rawPts = Math.max(
              typeof data.coins === 'number' ? data.coins : 0,
              typeof data.points === 'number' ? data.points : 0
            );
            const fsDiamonds = typeof data.diamonds === 'number' ? Math.max(0, data.diamonds) : null;
            const rawLocalDiamonds = localStorage.getItem(`kora_user_diamonds_${currentUser.uid}`);
            if (rawLocalDiamonds === null && fsDiamonds !== null && Date.now() - lastDiamondsUpdateRef.current >= 15000) {
              userDiamondsRef.current = fsDiamonds;
              setUserDiamonds(fsDiamonds);
              localStorage.setItem(`kora_user_diamonds_${currentUser.uid}`, fsDiamonds.toString());
            }
            const predPts = typeof data.predictionPoints === 'number' ? data.predictionPoints : 0;
            const fsDaily = typeof data.dailyGiftCoins === 'number' ? data.dailyGiftCoins : 0;
            const localDaily = Number(localStorage.getItem(`kora_daily_coins_${currentUser.uid}`) || 0);
            const maxDaily = Math.max(fsDaily, localDaily);
            if (maxDaily > localDaily) {
              localStorage.setItem(`kora_daily_coins_${currentUser.uid}`, maxDaily.toString());
            }

            // Synchronize ad coins strictly
            const fsAdCoins = typeof data.adRewardCoins === 'number' ? data.adRewardCoins : 0;
            const localAdCoins = Number(localStorage.getItem(`kora_ad_coins_${currentUser.uid}`) || 0);
            const maxAdCoins = Math.max(fsAdCoins, localAdCoins);
            if (maxAdCoins > 0) {
              localStorage.setItem(`kora_ad_coins_${currentUser.uid}`, maxAdCoins.toString());
            }

            const fsBrowseCoins = typeof data.browseAdCoins === 'number' ? data.browseAdCoins : 0;
            const localBrowseCoins = Number(localStorage.getItem(`kora_browse_ad_coins_${currentUser.uid}`) || 0);
            const maxBrowseCoins = Math.max(fsBrowseCoins, localBrowseCoins);
            if (maxBrowseCoins > 0) {
              localStorage.setItem(`kora_browse_ad_coins_${currentUser.uid}`, maxBrowseCoins.toString());
            }

            // Lock and guarantee user's ID in database records
            const numericId = getUserOrGuestNumericId(currentUser);
            const koraId = data.koraId || data.numericId || numericId;
            if (!data.koraId || !data.numericId) {
              setDoc(userRef, { koraId, numericId: koraId, userId: currentUser.uid }, { merge: true }).catch(() => {});
            }
            localStorage.setItem(`kora_permanent_id_${currentUser.uid}`, koraId);
            localStorage.setItem(`kora_user_numeric_id_${currentUser.uid}`, koraId);
            localStorage.setItem('kora_user_numeric_id', koraId);

            // Synchronize ads watched today from Firestore
            const todayKey = getTodayKeyStr();
            if (data.lastAdWatchDate === todayKey && typeof data.adsWatchedToday === 'number') {
              setTodayAdsWatchedCount(data.adsWatchedToday);
              localStorage.setItem(`kora_ads_count_${currentUser.uid}_${todayKey}`, data.adsWatchedToday.toString());
            }
            refreshTodayPredictionsCount(currentUser.uid);

            const isSaidUser = isSaidUserCheck(currentUser);
            const minAllowedCoins = isSaidUser ? 193 : 0;
            const currentLocalCoins = Number(localStorage.getItem(`kora_user_points_${currentUser.uid}`) || 0);
            const safePts = Math.max(rawPts, currentLocalCoins, maxDaily, minAllowedCoins);
            const cleanPts = isAshrafFaroukUser ? Math.max(safePts, 250) : safePts;
            const cleanPredPts = isAshrafFaroukUser ? Math.max(predPts, 250) : Math.max(predPts, minAllowedCoins);

            setUserPoints(cleanPts);
            setUserPredictionPoints(cleanPredPts);
            localStorage.setItem(`kora_user_points_${currentUser.uid}`, cleanPts.toString());

            if (safePts > rawPts) {
              setDoc(userRef, {
                points: safePts,
                coins: safePts,
                adRewardCoins: maxAdCoins,
                browseAdCoins: maxBrowseCoins,
                updatedAt: new Date().toISOString(),
              }, { merge: true }).catch(() => {});
            }

            // Sync favorite matches across devices
            if (Array.isArray(data.favoriteMatches)) {
              setFavoriteMatchIds(data.favoriteMatches);
              localStorage.setItem(`kora_favorites_${currentUser.uid}`, JSON.stringify(data.favoriteMatches));
            }

            // Sync predictionsMap from user doc if present
            if (data.predictionsMap && typeof data.predictionsMap === 'object') {
              setUserPredictions((prev) => {
                const updated = { ...prev, ...data.predictionsMap };
                userPredictionsRef.current = updated;
                return updated;
              });
            }
          } else {
            // New user document doesn't exist yet: initialize user profile without losing existing coins
            const koraId = getNumericUserId(currentUser.uid);
            const isSaidUser = isSaidUserCheck(currentUser);
            const initialCoins = isSaidUser ? 193 : (Number(localStorage.getItem(`kora_user_points_${currentUser.uid}`) || 0));
            const initialProfile = {
              displayName: currentUser.displayName || 'الكابتن',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || '',
              points: initialCoins,
              predictionPoints: initialCoins,
              koraId,
              exactPredictions: isSaidUser ? 2 : 0,
              correctOutcomes: 0,
              createdAt: new Date().toISOString(),
            };
            try {
              setDoc(userRef, initialProfile).catch(() => {});
              setUserPoints(initialCoins);
              setUserPredictionPoints(initialCoins);
              localStorage.setItem(`kora_user_points_${currentUser.uid}`, initialCoins.toString());
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          // On Firestore error, fallback to strictly user-scoped points
          const isSaidUser = isSaidUserCheck(currentUser);
          const savedPts = localStorage.getItem(`kora_user_points_${currentUser.uid}`);
          const fallbackPts = Math.max(isSaidUser ? 193 : 0, savedPts && !isNaN(Number(savedPts)) ? Number(savedPts) : 0);
          setUserPoints(fallbackPts);
        });

        // 2. Real-Time Listener to User Predictions from Firestore across all devices/links/PWA
        try {
          const qPred = query(
            collection(db, 'predictions'),
            where('userId', '==', currentUser.uid)
          );

          unsubPredictions = onSnapshot(qPred, async (predSnap) => {
            const fsPredsArr: any[] = [];
            
            predSnap.forEach((d) => {
              const p = d.data();
              const mId = p.matchId || (typeof d.id === 'string' && d.id.startsWith('pred_') ? d.id.split('_').slice(2).join('_') : d.id);
              if (isMatchRemovedGlobally(mId) || isMatchRemovedGlobally(d.id)) {
                deleteDoc(doc(db, 'predictions', d.id)).catch(() => {});
                return;
              }
              if (mId) {
                fsPredsArr.push({ id: d.id, matchId: mId, ...p });
              }
            });

            // Also check by userEmail once to ensure cross-device/provider sync for the same account
            if (currentUser.email) {
              try {
                const cleanEmail = currentUser.email.toLowerCase().trim();
                const qEmail = query(collection(db, 'predictions'), where('userEmail', '==', cleanEmail));
                const emailSnap = await getDocs(qEmail);
                emailSnap.forEach((ed) => {
                  if (!fsPredsArr.some((item) => item.id === ed.id)) {
                    const ep = ed.data();
                    const emId = ep.matchId || (typeof ed.id === 'string' && ed.id.startsWith('pred_') ? ed.id.split('_').slice(2).join('_') : ed.id);
                    if (emId && !isMatchRemovedGlobally(emId)) {
                      fsPredsArr.push({ id: ed.id, matchId: emId, ...ep });
                      updateDoc(doc(db, 'predictions', ed.id), { userId: currentUser.uid }).catch(() => {});
                    }
                  }
                });
              } catch (_) {}
            }

            // Safely merge predictions from in-memory state, Firestore, and local cache so predictions are NEVER wiped or lost
            const mergedPredsMap = new Map<string, any>();

            // 1. Current in-memory predictions map (from server sync or user state) - use epoch fallback so real updatedAt timestamps win
            if (userPredictionsRef.current && typeof userPredictionsRef.current === 'object') {
              Object.entries(userPredictionsRef.current).forEach(([mId, pred]: [string, any]) => {
                if (mId && pred && !isMatchRemovedGlobally(mId)) {
                  mergedPredsMap.set(mId, {
                    id: `pred_${currentUser.uid}_${mId}`,
                    userId: currentUser.uid,
                    matchId: mId,
                    predictedHomeScore: Number(pred.predictedHomeScore ?? 0),
                    predictedAwayScore: Number(pred.predictedAwayScore ?? 0),
                    status: pred.status || 'PENDING',
                    createdAt: pred.createdAt || '1970-01-01T00:00:00.000Z',
                    updatedAt: pred.updatedAt || '1970-01-01T00:00:00.000Z',
                  });
                }
              });
            }

            // Read fresh local cache
            const currentLocalRaw = localStorage.getItem(userStorageKey);
            let currentLocalList: any[] = initialLocalPreds;
            if (currentLocalRaw) {
              try {
                const parsed = JSON.parse(currentLocalRaw);
                if (Array.isArray(parsed)) currentLocalList = parsed;
              } catch (_) {}
            }

            currentLocalList.forEach((p: any) => {
              const mId = p.matchId || p.id;
              if (mId && !isMatchRemovedGlobally(mId)) {
                const existing = mergedPredsMap.get(mId);
                if (!existing || !existing.updatedAt || !p.updatedAt || new Date(p.updatedAt) >= new Date(existing.updatedAt)) {
                  mergedPredsMap.set(mId, {
                    ...existing,
                    ...p,
                    matchId: mId,
                  });
                }
              }
            });
            fsPredsArr.forEach((p: any) => {
              const mId = p.matchId || p.id;
              if (mId && !isMatchRemovedGlobally(mId)) {
                const existing = mergedPredsMap.get(mId);
                if (!existing || !existing.updatedAt || !p.updatedAt || new Date(p.updatedAt) >= new Date(existing.updatedAt)) {
                  mergedPredsMap.set(mId, {
                    ...existing,
                    ...p,
                    matchId: mId,
                  });
                }
              }
            });

            const finalPredsList = Array.from(mergedPredsMap.values());
            const finalPredsMap: Record<string, { predictedHomeScore: number; predictedAwayScore: number }> = {};
            
            finalPredsList.forEach((p: any) => {
              const mId = p.matchId || p.id;
              if (mId) {
                finalPredsMap[mId] = {
                  predictedHomeScore: Number(p.predictedHomeScore ?? 0),
                  predictedAwayScore: Number(p.predictedAwayScore ?? 0),
                };
              }
            });

            // Evaluate deterministic coins from all user predictions (finished matches + historical wins)
            const evaluationResult = evaluateUserPredictionsList(finalPredsList, matchesRef.current.length > 0 ? matchesRef.current : INITIAL_MATCHES);
            const { evaluatedPredictions, totalEarnedCoins, totalCoinsSpent, exactPredictionsCount } = evaluationResult;

            // Deduct any cash claims
            let userClaimsSpent = 0;
            const claimsRaw = localStorage.getItem(`kora_my_claims_${currentUser.uid}`);
            if (claimsRaw) {
              try {
                const parsedClaims = JSON.parse(claimsRaw);
                if (Array.isArray(parsedClaims)) {
                  parsedClaims.forEach((c: any) => {
                    userClaimsSpent += (c.pointsSpent || c.coinsSpent || 1000);
                  });
                }
              } catch (_) {}
            } else {
              // If not cached on this device yet, fetch directly from Firestore
              try {
                const qDirect = query(collection(db, 'prizeClaims'), where('userId', '==', currentUser.uid));
                const sDirect = await getDocs(qDirect);
                const directList: any[] = [];
                sDirect.forEach((cd) => {
                  const cData = cd.data();
                  directList.push({ id: cd.id, ...cData });
                  userClaimsSpent += (cData.pointsSpent || cData.coinsSpent || 1000);
                });
                if (directList.length > 0) {
                  localStorage.setItem(`kora_my_claims_${currentUser.uid}`, JSON.stringify(directList));
                }
              } catch (_) {}
            }

            const numericUserId = getUserOrGuestNumericId(currentUser);
            const currentBonus = Number(localStorage.getItem(`kora_daily_coins_${currentUser.uid}`) || 0);

            // Compute persistent ad coins and bonuses strictly for this account
            const localUserPoints = Number(localStorage.getItem(`kora_user_points_${currentUser.uid}`) || 0);

            const adCoinsKey = `kora_ad_coins_${currentUser.uid}`;
            const browseCoinsKey = `kora_browse_ad_coins_${currentUser.uid}`;
            const storedAdCoins = Number(localStorage.getItem(adCoinsKey) || 0);
            const storedBrowseCoins = Number(localStorage.getItem(browseCoinsKey) || 0);
            let historyAdCoins = 0;
            try {
              const histKey = `kora_coins_history_${currentUser.uid}`;
              const existingHist = JSON.parse(localStorage.getItem(histKey) || '[]');
              if (Array.isArray(existingHist)) {
                existingHist.forEach((h: any) => {
                  if (h.type === 'AD_REWARD' || h.type === 'AD_BROWSE_REWARD' || h.type === 'BONUS') {
                    historyAdCoins += (Number(h.coins) || 0);
                  }
                });
              }
            } catch (_) {}
            const extraAdRewardCoins = Math.max(storedAdCoins + storedBrowseCoins, historyAdCoins);

            const isSaidUser = isSaidUserCheck(currentUser);
            const minAllowedCoins = isSaidUser ? 209 : 0;
            const finalEarnedCoins = Math.max(minAllowedCoins, (isAshrafFaroukUser ? Math.max(250, totalEarnedCoins) : totalEarnedCoins) + extraAdRewardCoins);
            const finalExactCount = isAshrafFaroukUser ? Math.max(5, exactPredictionsCount) : Math.max(isSaidUser ? 2 : 0, exactPredictionsCount);
            const calculatedNet = totalEarnedCoins - totalCoinsSpent - userClaimsSpent + currentBonus + extraAdRewardCoins;
            const finalNetCoins = isAshrafFaroukUser
              ? Math.max(250, calculatedNet, localUserPoints)
              : Math.max(minAllowedCoins, calculatedNet, localUserPoints);

            setUserPredictions(finalPredsMap);
            userPredictionsRef.current = finalPredsMap;
            localStorage.setItem(userStorageKey, JSON.stringify(evaluatedPredictions));

            // Set user coins and prediction points accurately
            setUserPoints(finalNetCoins);
            setUserPredictionPoints(finalEarnedCoins);
            localStorage.setItem(`kora_user_points_${currentUser.uid}`, finalNetCoins.toString());
            try {
              localStorage.removeItem('kora_user_points');
            } catch (_) {}

            // Sync with Firestore user document
            try {
              const uRef = doc(db, 'users', currentUser.uid);
              await setDoc(uRef, {
                points: finalNetCoins,
                coins: finalNetCoins,
                dailyGiftCoins: currentBonus,
                adRewardCoins: storedAdCoins,
                browseAdCoins: storedBrowseCoins,
                predictionPoints: finalEarnedCoins,
                exactPredictions: finalExactCount,
                correctPredictionsCount: finalExactCount,
                predictionsMap: finalPredsMap,
                predictionsList: evaluatedPredictions,
              }, { merge: true });
            } catch (err) {
              // safe ignore
            }

            // Sync evaluated predictions to Firestore
            for (const ep of evaluatedPredictions) {
              if (ep.id) {
                try {
                  await setDoc(doc(db, 'predictions', ep.id), ep, { merge: true });
                } catch (_) {}
              }
            }

            // Also synchronize with backend persistent store for cross-device consistency
            try {
              let coinsHistToSync: any[] = [];
              try {
                coinsHistToSync = JSON.parse(localStorage.getItem(`kora_coins_history_${currentUser.uid}`) || '[]');
              } catch (_) {}
              fetch('/api/user/sync-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: currentUser.uid,
                  email: currentUser.email,
                  displayName: currentUser.displayName,
                  localCoins: finalNetCoins,
                  localPredictionPoints: finalEarnedCoins,
                  localExactCount: finalExactCount,
                  adRewardCoins: storedAdCoins,
                  browseAdCoins: storedBrowseCoins,
                  dailyGiftCoins: currentBonus,
                  coinsHistory: coinsHistToSync,
                  predictions: evaluatedPredictions,
                  predictionsMap: finalPredsMap,
                }),
              }).catch(() => {});
            } catch (_) {}

            // Dispatch global synchronization events so all open views immediately update
            window.dispatchEvent(new CustomEvent('kora_predictions_updated', { detail: evaluatedPredictions }));
            window.dispatchEvent(new Event('kora_coins_updated'));
          }, (err) => {
            handleFirestoreError(err, OperationType.GET, 'predictions');
          });

          // 3. Real-Time Listener to User Prize Claims (Cash Withdrawals) across all devices
          try {
            const qClaims = query(
              collection(db, 'prizeClaims'),
              where('userId', '==', currentUser.uid)
            );

            unsubClaims = onSnapshot(qClaims, (claimsSnap) => {
              const claimsArr: PrizeClaim[] = [];
              claimsSnap.forEach((d) => {
                claimsArr.push({ id: d.id, ...d.data() } as PrizeClaim);
              });
              claimsArr.sort((a, b) => new Date(b.claimedAt || 0).getTime() - new Date(a.claimedAt || 0).getTime());
              localStorage.setItem(`kora_my_claims_${currentUser.uid}`, JSON.stringify(claimsArr));

              // Notify all components that claims have been updated
              window.dispatchEvent(new CustomEvent('kora_claims_updated', { detail: claimsArr }));
              window.dispatchEvent(new Event('kora_coins_updated'));
            }, (err) => {
              handleFirestoreError(err, OperationType.GET, 'prizeClaims');
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, 'prizeClaims');
          }

          // 4. Real-Time Listener to User Payment Profile across all devices
          try {
            const profileDocRef = doc(db, 'userPaymentProfiles', currentUser.uid);
            unsubPayoutProfile = onSnapshot(profileDocRef, (snap) => {
              if (snap.exists()) {
                const pData = snap.data();
                localStorage.setItem(`kora_payout_profile_${currentUser.uid}`, JSON.stringify(pData));
                window.dispatchEvent(new CustomEvent('kora_payout_profile_updated', { detail: pData }));
              }
            }, () => {});
          } catch (_) {}

          // Trigger server-side coin sync endpoint
          try {
            fetch('/api/user/sync-coins', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser.uid, email: currentUser.email || '' }),
            }).then((r) => r.json()).then((res) => {
              if (res && res.success && typeof res.restoredCoins === 'number') {
                const currentLocal = Number(localStorage.getItem(`kora_user_points_${currentUser.uid}`) || 0);
                const safeCoins = Math.max(res.restoredCoins, currentLocal);
                setUserPoints(safeCoins);
                if (typeof res.totalEarnedCoins === 'number') {
                  setUserPredictionPoints(res.totalEarnedCoins);
                }
                localStorage.setItem(`kora_user_points_${currentUser.uid}`, safeCoins.toString());
              }
            }).catch(() => {});
          } catch (e) {}
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'predictions');
        }
      } else {
        // If a previously logged in user just logged out, mark logout flag so re-entry shows install prompt
        if (previousUserUid) {
          try {
            localStorage.removeItem('kora_install_prompt_responded');
            localStorage.removeItem('kora_first_visit_install_prompt_responded');
            localStorage.setItem('kora_show_install_after_logout', 'true');
            window.dispatchEvent(new Event('kora_user_signed_out'));
          } catch (_) {}
        }
        previousUserUid = null;
        // User is guest (not registered): Load guest points, predictions, and preferences
        setUser(null);
        const guestId = getUserOrGuestNumericId(null);
        const guestSavedPts = Number(localStorage.getItem('kora_user_points_guest') || '0');
        setUserPoints(guestSavedPts);
        setUserPredictionPoints(0);
        const guestSavedDiamonds = Math.max(0, Number(localStorage.getItem('kora_user_diamonds_guest') || '0'));
        userDiamondsRef.current = guestSavedDiamonds;
        setUserDiamonds(guestSavedDiamonds);

        const guestPredsMap: Record<string, { predictedHomeScore: number; predictedAwayScore: number }> = {};
        try {
          const guestRaw = localStorage.getItem('kora_my_predictions_guest') || localStorage.getItem('kora_guest_predictions');
          if (guestRaw) {
            const parsedGuest = JSON.parse(guestRaw);
            if (Array.isArray(parsedGuest)) {
              parsedGuest.forEach((gp: any) => {
                const mId = gp.matchId || gp.id;
                if (mId && !isMatchRemovedGlobally(mId)) {
                  guestPredsMap[mId] = {
                    predictedHomeScore: Number(gp.predictedHomeScore ?? 0),
                    predictedAwayScore: Number(gp.predictedAwayScore ?? 0),
                  };
                }
              });
            }
          }
        } catch (_) {}
        setUserPredictions(guestPredsMap);
        userPredictionsRef.current = guestPredsMap;

        setFavoriteMatchIds([]);
        refreshTodayPredictionsCount(guestId);
        if (unsubUserDoc) { unsubUserDoc(); unsubUserDoc = null; }
        if (unsubPredictions) { unsubPredictions(); unsubPredictions = null; }
        if (unsubClaims) { unsubClaims(); unsubClaims = null; }
        if (unsubPayoutProfile) { unsubPayoutProfile(); unsubPayoutProfile = null; }
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      handleActiveUser(firebaseUser);
    });

    const onManualAuthChanged = () => {
      handleActiveUser(auth.currentUser);
    };
    window.addEventListener('kora_manual_auth_changed', onManualAuthChanged);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('kora_manual_auth_changed', onManualAuthChanged);
      if (unsubUserDoc) unsubUserDoc();
      if (unsubPredictions) unsubPredictions();
      if (unsubClaims) unsubClaims();
      if (unsubPayoutProfile) unsubPayoutProfile();
    };
  }, []);

  // 🏆 Evaluate user predictions against finished matches and distribute 50 coins per correct exact score automatically
  useEffect(() => {
    const evaluateFinishedPredictions = async () => {
      const userKey = user ? user.uid : 'guest';
      const userStorageKey = `kora_my_predictions_${userKey}`;
      let savedPredsRaw = localStorage.getItem(userStorageKey);
      
      // If user is logged in but hasn't migrated guest predictions yet, check guest storage
      if ((!savedPredsRaw || savedPredsRaw === '[]') && user) {
        const guestRaw = localStorage.getItem('kora_my_predictions_guest') || localStorage.getItem('kora_my_predictions');
        if (guestRaw && guestRaw !== '[]') {
          savedPredsRaw = guestRaw;
          localStorage.setItem(userStorageKey, guestRaw);
        }
      }

      if (!savedPredsRaw && Object.keys(userPredictions).length === 0) return;

      let preds: any[] = [];
      if (savedPredsRaw) {
        try {
          const raw = JSON.parse(savedPredsRaw);
          if (Array.isArray(raw)) {
            preds = raw.filter((p: any) => {
              const mId = p.matchId || p.id;
              return !isMatchRemovedGlobally(mId);
            });
          }
        } catch (e) {
          // ignore
        }
      }

      // Merge any predictions from state if not present in preds
      Object.entries(userPredictions).forEach(([mId, pScore]: [string, any]) => {
        if (!preds.some((p) => (p.matchId || p.id) === mId) && !isMatchRemovedGlobally(mId) && pScore) {
          const mObj = matches.find((m) => m.id === mId) || INITIAL_MATCHES.find((m) => m.id === mId);
          preds.push({
            id: user ? `pred_${user.uid}_${mId}` : `pred_guest_${mId}`,
            matchId: mId,
            matchHomeTeam: mObj?.homeTeam,
            matchHomeTeamAr: mObj?.homeTeamAr,
            matchAwayTeam: mObj?.awayTeam,
            matchAwayTeamAr: mObj?.awayTeamAr,
            predictedHomeScore: pScore.predictedHomeScore,
            predictedAwayScore: pScore.predictedAwayScore,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
          });
        }
      });

      if (preds.length === 0) return;

      preds = preds.map((p: any) => {
        const mId = p.matchId || p.id;
        if (mId && (mId.includes('realmadrid_inter') || mId.includes('inter_realmadrid'))) {
          const ph = Number(p.predictedHomeScore);
          const pa = Number(p.predictedAwayScore);
          const isExact = (mId.includes('inter_realmadrid') && ph === 1 && pa === 2) || (ph === 2 && pa === 1);
          return {
            ...p,
            matchHomeScore: mId.includes('inter_realmadrid') ? 1 : 2,
            matchAwayScore: mId.includes('inter_realmadrid') ? 2 : 1,
            status: isExact ? 'EXACT_SCORE' : 'MISSED',
            pointsEarned: isExact ? 150 : 0,
            coinsEarned: isExact ? 150 : 0,
            evaluated: true,
          };
        }
        if (mId && (mId.includes('mokawloon_ahly') || mId.includes('ahly_mokawloon'))) {
          const ph = Number(p.predictedHomeScore);
          const pa = Number(p.predictedAwayScore);
          const isExact = ph === 1 && pa === 1;
          return {
            ...p,
            matchHomeScore: 1,
            matchAwayScore: 1,
            status: isExact ? 'EXACT_SCORE' : 'MISSED',
            pointsEarned: isExact ? 50 : 0,
            coinsEarned: isExact ? 50 : 0,
            evaluated: true,
          };
        }
        if (mId && (mId.includes('liverpool_fulham') || mId.includes('fulham_liverpool'))) {
          const ph = Number(p.predictedHomeScore);
          const pa = Number(p.predictedAwayScore);
          const isExact = ph === 0 && pa === 0;
          return {
            ...p,
            matchHomeScore: 0,
            matchAwayScore: 0,
            status: isExact ? 'EXACT_SCORE' : 'MISSED',
            pointsEarned: isExact ? 50 : 0,
            coinsEarned: isExact ? 50 : 0,
            evaluated: true,
          };
        }
        if (mId && (mId.includes('alkhaleej_alnassr') || mId.includes('alnassr_alkhaleej'))) {
          const ph = Number(p.predictedHomeScore);
          const pa = Number(p.predictedAwayScore);
          const isExact = ph === 1 && pa === 1;
          return {
            ...p,
            matchHomeScore: 1,
            matchAwayScore: 1,
            status: isExact ? 'EXACT_SCORE' : 'MISSED',
            pointsEarned: isExact ? 50 : 0,
            coinsEarned: isExact ? 50 : 0,
            evaluated: true,
          };
        }
        if (mId && (mId.includes('realmadrid_rayo') || mId.includes('rayo_realmadrid'))) {
          const ph = Number(p.predictedHomeScore);
          const pa = Number(p.predictedAwayScore);
          const isExact = (mId.includes('rayo_realmadrid') && ph === 1 && pa === 4) || (ph === 4 && pa === 1);
          return {
            ...p,
            matchHomeScore: mId.includes('rayo_realmadrid') ? 1 : 4,
            matchAwayScore: mId.includes('rayo_realmadrid') ? 4 : 1,
            status: isExact ? 'EXACT_SCORE' : 'MISSED',
            pointsEarned: isExact ? 50 : 0,
            coinsEarned: isExact ? 50 : 0,
            evaluated: true,
          };
        }
        if (mId === 'm_laliga_sociedad_celta' || mId === 'm_laliga_celta_sociedad') {
          const isExact = Number(p.predictedHomeScore) === 0 && Number(p.predictedAwayScore) === 0;
          return {
            ...p,
            matchHomeScore: 0,
            matchAwayScore: 0,
            status: isExact ? 'EXACT_SCORE' : 'MISSED',
            pointsEarned: isExact ? 50 : 0,
            coinsEarned: isExact ? 50 : 0,
          };
        }
        return p;
      });

      const activeMatchesList = matches.length > 0 ? matches : INITIAL_MATCHES;
      const evaluationResult = evaluateUserPredictionsList(preds, activeMatchesList);
      const { evaluatedPredictions, totalEarnedCoins, totalCoinsSpent, exactPredictionsCount, winningPredictions } = evaluationResult;

      // Deduct any cash claims
      let userClaimsSpent = 0;
      const claimsRaw = localStorage.getItem(`kora_my_claims_${userKey}`);
      if (claimsRaw) {
        try {
          const parsedClaims = JSON.parse(claimsRaw);
          if (Array.isArray(parsedClaims)) {
            parsedClaims.forEach((c: any) => {
              userClaimsSpent += (c.coinsSpent || 1000);
            });
          }
        } catch (_) {}
      }

      // Compute persistent ad coins and bonuses strictly for this user
      const adCoinsKey = `kora_ad_coins_${userKey}`;
      const browseCoinsKey = `kora_browse_ad_coins_${userKey}`;
      const storedAdCoins = Number(localStorage.getItem(adCoinsKey) || 0);
      const storedBrowseCoins = Number(localStorage.getItem(browseCoinsKey) || 0);
      let historyAdCoins = 0;
      try {
        const histKey = `kora_coins_history_${userKey}`;
        const existingHist = JSON.parse(localStorage.getItem(histKey) || '[]');
        if (Array.isArray(existingHist)) {
          existingHist.forEach((h: any) => {
            if (h.type === 'AD_REWARD' || h.type === 'AD_BROWSE_REWARD' || h.type === 'BONUS') {
              historyAdCoins += (Number(h.coins) || 0);
            }
          });
        }
      } catch (_) {}
      const extraAdRewardCoins = Math.max(storedAdCoins + storedBrowseCoins, historyAdCoins);

      // Check if user is Ashraf Farouk (special rule: 250 coins / 5 exact wins)
      const isAshrafFaroukUser = Boolean(
        user?.email?.toLowerCase().includes('ashraf17farouk') ||
        user?.uid === '76088785' ||
        user?.uid === 'user_ashraf17farouk_gmail_com' ||
        (user?.displayName && user.displayName.includes('Ashraf Farouk'))
      );

      const currentBonus = Number(localStorage.getItem(`kora_daily_coins_${userKey}`) || 0);

      const localPts = Number(localStorage.getItem(`kora_user_points_${userKey}`) || 0);

      const isSaidUser = isSaidUserCheck(user);
      const minAllowed = isSaidUser ? 209 : 0;
      const finalEarnedCoins = Math.max(minAllowed, (isAshrafFaroukUser ? Math.max(250, totalEarnedCoins) : totalEarnedCoins) + extraAdRewardCoins);
      const finalExactCount = isAshrafFaroukUser ? Math.max(5, exactPredictionsCount) : Math.max(isSaidUser ? 2 : 0, exactPredictionsCount);
      const calculatedNet = totalEarnedCoins - totalCoinsSpent - userClaimsSpent + currentBonus + extraAdRewardCoins;
      const finalNetCoins = isAshrafFaroukUser
        ? Math.max(250, calculatedNet, localPts)
        : Math.max(minAllowed, calculatedNet, localPts);

      // Ensure userPredictions state has all evaluated predictions
      const syncedPredsMap: Record<string, { predictedHomeScore: number; predictedAwayScore: number }> = { ...userPredictionsRef.current };
      evaluatedPredictions.forEach((ep: any) => {
        const mId = ep.matchId || ep.id;
        if (mId && !isMatchRemovedGlobally(mId)) {
          syncedPredsMap[mId] = {
            predictedHomeScore: Number(ep.predictedHomeScore ?? 0),
            predictedAwayScore: Number(ep.predictedAwayScore ?? 0),
          };
        }
      });
      userPredictionsRef.current = syncedPredsMap;
      setUserPredictions(syncedPredsMap);

      localStorage.setItem(userStorageKey, JSON.stringify(evaluatedPredictions));
      localStorage.setItem(`kora_user_points_${userKey}`, finalNetCoins.toString());
      try {
        localStorage.removeItem('kora_user_points');
      } catch (_) {}
      window.dispatchEvent(new Event('kora_payout_profile_updated'));
      window.dispatchEvent(new Event('kora_coins_updated'));

      setUserPoints(finalNetCoins);
      setUserPredictionPoints(finalEarnedCoins);

      // Sync with Firestore if logged in
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const uData = userSnap.data();
            const newExacts = Math.max(uData.exactPredictions || 0, finalExactCount);
            await setDoc(userRef, {
              points: finalNetCoins,
              coins: finalNetCoins,
              predictionPoints: finalEarnedCoins,
              exactPredictions: newExacts,
              correctPredictionsCount: newExacts,
              predictionsList: evaluatedPredictions,
              predictionsMap: syncedPredsMap,
            }, { merge: true });
          } else {
            await setDoc(userRef, {
              points: finalNetCoins,
              coins: finalNetCoins,
              predictionPoints: finalEarnedCoins,
              exactPredictions: finalExactCount,
              correctPredictionsCount: finalExactCount,
              predictionsList: evaluatedPredictions,
              predictionsMap: syncedPredsMap,
            }, { merge: true });
          }
        } catch (e) {
          // safe ignore Firestore quota/network errors
        }

        // Sync updated prediction documents to Firestore
        for (const up of evaluatedPredictions) {
          if (up.evaluated && up.id) {
            try {
              await setDoc(doc(db, 'predictions', up.id), up, { merge: true });
            } catch (err) {
              // safe ignore
            }
          }
        }

        // Cross-device sync to server persistence store (throttled to 30s on background eval to avoid proxy 429 Rate exceeded)
        try {
          const nowSyncMs = Date.now();
          const lastEvalSyncMs = Number((window as any).__koraLastEvalSyncMs || 0);
          if (nowSyncMs - lastEvalSyncMs >= 30000) {
            (window as any).__koraLastEvalSyncMs = nowSyncMs;
            let coinsHistToSync: any[] = [];
            try {
              coinsHistToSync = JSON.parse(localStorage.getItem(`kora_coins_history_${userKey}`) || '[]');
            } catch (_) {}
            fetch('/api/user/sync-account', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.uid,
                email: user.email,
                displayName: user.displayName,
                localCoins: finalNetCoins,
                localPredictionPoints: finalEarnedCoins,
                localExactCount: finalExactCount,
                adRewardCoins: storedAdCoins,
                browseAdCoins: storedBrowseCoins,
                dailyGiftCoins: currentBonus,
                coinsHistory: coinsHistToSync,
                predictions: evaluatedPredictions,
                predictionsMap: syncedPredsMap,
              }),
            })
              .then((r) => r.json())
              .then((syncData) => {
                if (syncData?.success && syncData?.account) {
                  const acc = syncData.account;
                  if (acc.predictionsMap && typeof acc.predictionsMap === 'object') {
                    setUserPredictions((prev) => {
                      const next = { ...prev, ...acc.predictionsMap };
                      userPredictionsRef.current = next;
                      return next;
                    });
                  }
                  if (typeof acc.coins === 'number' && acc.coins > finalNetCoins) {
                    setUserPoints(acc.coins);
                    localStorage.setItem(`kora_user_points_${user.uid}`, String(acc.coins));
                  }
                }
              })
              .catch(() => {});
          }
        } catch (_) {}
      }
    };

    evaluateFinishedPredictions();

    // ⚡ Trigger evaluation on window focus and app events (without wasteful 10s intervals)
    window.addEventListener('focus', evaluateFinishedPredictions);
    window.addEventListener('visibilitychange', evaluateFinishedPredictions);
    window.addEventListener('kora_trigger_prediction_eval', evaluateFinishedPredictions);
    window.addEventListener('kora_prediction_submitted', evaluateFinishedPredictions);
    window.addEventListener('kora_matches_updated', evaluateFinishedPredictions);

    return () => {
      window.removeEventListener('focus', evaluateFinishedPredictions);
      window.removeEventListener('visibilitychange', evaluateFinishedPredictions);
      window.removeEventListener('kora_trigger_prediction_eval', evaluateFinishedPredictions);
      window.removeEventListener('kora_prediction_submitted', evaluateFinishedPredictions);
      window.removeEventListener('kora_matches_updated', evaluateFinishedPredictions);
    };
  }, [user, matches]);

  const handleSignIn = async () => {
    setShowAuthWelcomeModal(true);
  };

  const handleSignOut = async () => {
    try {
      if (user?.uid) {
        if (typeof userPoints === 'number') {
          localStorage.setItem(`kora_user_points_${user.uid}`, userPoints.toString());
        }
        // Fire-and-forget sync to backend without blocking signout
        fetch('/api/user/sync-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            email: user.email,
            displayName: user.displayName,
            localCoins: userPoints,
          }),
        }).catch(() => {});
      }

      // Mark logout flag for install prompt upon re-entry
      try {
        localStorage.removeItem('kora_manual_auth_user');
        localStorage.removeItem('kora_install_prompt_responded');
        localStorage.removeItem('kora_first_visit_install_prompt_responded');
        localStorage.setItem('kora_show_install_after_logout', 'true');
        localStorage.setItem('kora_guest_uid', `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
        window.dispatchEvent(new Event('kora_user_signed_out'));
        window.dispatchEvent(new Event('kora_manual_auth_changed'));
      } catch (_) {}

      // Immediately clear user state so UI updates instantly!
      setUser(null);
      const guestId = getUserOrGuestNumericId(null);
      const guestSavedPts = Number(localStorage.getItem('kora_user_points_guest') || '0');
      setUserPoints(guestSavedPts);
      setUserPredictionPoints(0);
      setUserPredictions({});
      userPredictionsRef.current = {};
      setFavoriteMatchIds([]);
      refreshTodayPredictionsCount(guestId);

      // Perform Firebase auth signOut
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error in App:', err);
      setUser(null);
      try {
        await signOut(auth);
      } catch (_) {}
    }
  };

  const handleToggleFavorite = (match: Match) => {
    setFavoriteMatchIds((prev) => {
      const isCurrentlyFav = prev.includes(match.id);
      const next = isCurrentlyFav ? prev.filter((id) => id !== match.id) : [...prev, match.id];
      const activeUserId = user ? user.uid : 'guest';
      syncFavoriteMatchSubscription(activeUserId, match, !isCurrentlyFav).catch(() => {});
      if (user) {
        localStorage.setItem(`kora_favorites_${user.uid}`, JSON.stringify(next));
        try {
          setDoc(doc(db, 'users', user.uid), { favoriteMatches: next }, { merge: true }).catch(() => {});
        } catch (_) {}
      } else {
        localStorage.setItem('kora_favorites_guest', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleOpenDetails = (
    match: Match,
    tab: 'lineup' | 'stats' | 'events' | 'predict' = 'lineup'
  ) => {
    setSelectedMatch(match);
    setModalInitialTab(tab);
  };

  const handleOpenPredictMatch = (matchId: string) => {
    const target = matches.find((m) => m.id === matchId);
    if (target) {
      setSelectedMatch(target);
      setModalInitialTab('predict');
    }
  };

  // Handle native mobile push notification click (opens match prediction modal immediately)
  useEffect(() => {
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'KORA_OPEN_PREDICT') {
        const matchId = event.data.matchId;
        if (matchId) {
          handleOpenPredictMatch(matchId);
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    // Check URL parameters for direct link from lock screen notification
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const matchParam = urlParams.get('predict') || urlParams.get('predictMatch');
      if (matchParam && matches.length > 0) {
        handleOpenPredictMatch(matchParam);
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (e) {
      // url parse safe
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [matches]);

  const handleVotePrediction = (matchId: string, choice: 'HOME' | 'DRAW' | 'AWAY') => {
    // Check if match already started
    const targetMatch = matches.find((m) => m.id === matchId);
    if (targetMatch) {
      const isStarted = targetMatch.status === 'LIVE' || targetMatch.status === 'HALF_TIME' || targetMatch.status === 'FINISHED' || targetMatch.isPredictionClosed || (!!targetMatch.kickoffTimeMs && Date.now() >= targetMatch.kickoffTimeMs);
      if (isStarted) return;
    }

    // Local increment vote feedback
    setMatches((prevMatches) =>
      prevMatches.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            prediction: {
              ...m.prediction,
              homeVotes: choice === 'HOME' ? m.prediction.homeVotes + 1 : m.prediction.homeVotes,
              drawVotes: choice === 'DRAW' ? m.prediction.drawVotes + 1 : m.prediction.drawVotes,
              awayVotes: choice === 'AWAY' ? m.prediction.awayVotes + 1 : m.prediction.awayVotes,
            },
          };
        }
        return m;
      })
    );
  };

  const handleSavePrediction = async (match: Match, homeScore: number, awayScore: number) => {
    // If user is not logged in, prompt auth modal to register/sign in
    if (!user) {
      setShowAuthWelcomeModal(true);
      return;
    }

    // 🔒 Strictly block prediction if the match is live, finished, closed, or kickoff time has passed
    const isStarted = match.status === 'LIVE' || match.status === 'HALF_TIME' || match.status === 'FINISHED' || match.isPredictionClosed || (!!match.kickoffTimeMs && Date.now() >= match.kickoffTimeMs);
    if (isStarted) {
      if (typeof window !== 'undefined') {
        alert(language === 'ar' ? '🔒 عذراً، تم إغلاق باب التوقعات لهذه المباراة لأنها بدأت بالفعل!' : '🔒 Predictions are closed as the match has already started!');
      }
      return;
    }

    const userKey = user ? user.uid : 'guest';
    const storageKey = `kora_my_predictions_${userKey}`;
    const predDocId = user ? `pred_${user.uid}_${match.id}` : `pred_guest_${match.id}`;

    // Handle Prediction Fee: 3 free predictions per day, 5 coins fee for subsequent predictions
    const existingLocal = localStorage.getItem(storageKey);
    let predsArr: any[] = [];
    let existingItem: any = null;
    let existingCoinsSpent = 0;

    if (existingLocal) {
      try {
        predsArr = JSON.parse(existingLocal);
        if (!Array.isArray(predsArr)) predsArr = [];
        existingItem = predsArr.find((p: any) => p.matchId === match.id || p.id === predDocId);
        if (existingItem && typeof existingItem.coinsSpent === 'number' && existingItem.coinsSpent > 0) {
          existingCoinsSpent = existingItem.coinsSpent;
        }
      } catch (e) {}
    }

    const isEditingExisting = Boolean(existingItem);
    // Prediction fee: 50 Orange Diamonds (50 ماسة رسوم التوقع) per match
    const DIAMOND_PREDICTION_FEE = 50;
    const existingDiamondsSpent = existingItem && typeof existingItem.diamondsSpent === 'number' ? existingItem.diamondsSpent : 0;
    const hasAlreadyPaidDiamonds = isEditingExisting && existingDiamondsSpent >= DIAMOND_PREDICTION_FEE;
    const diamondsFeeToDeduct = hasAlreadyPaidDiamonds ? 0 : DIAMOND_PREDICTION_FEE;

    const currentDiamondsBalance =
      typeof userDiamondsRef.current === 'number'
        ? userDiamondsRef.current
        : Number(localStorage.getItem(`kora_user_diamonds_${userKey}`) || userDiamonds || 0);

    if (diamondsFeeToDeduct > 0 && currentDiamondsBalance < diamondsFeeToDeduct) {
      setRewardToastMessage(
        language === 'ar'
          ? `⚠️ تحتاج إلى 50 ماسة لتوقع أي مباراة (رصيدك: ${currentDiamondsBalance} ماسة). ابدأ اللعب الآن لجمع الماسات!`
          : `⚠️ 50 Orange Diamonds required to predict any match (Balance: ${currentDiamondsBalance}). Start playing to earn diamonds!`
      );
      setTimeout(() => setRewardToastMessage(null), 4500);
      return;
    }

    let updatedDiamondsAfterFee = currentDiamondsBalance;
    if (diamondsFeeToDeduct > 0) {
      updatedDiamondsAfterFee = handleAddDiamonds(-diamondsFeeToDeduct);
      setRewardToastMessage(
        language === 'ar'
          ? `🎯 تم حفظ توقعك بنجاح (تم خصم ${diamondsFeeToDeduct} ماسة برتقالية نهائياً)`
          : `🎯 Prediction saved! (-${diamondsFeeToDeduct} Diamonds deducted permanently)`
      );
      setTimeout(() => setRewardToastMessage(null), 4000);
    }

    const feeToDeduct = 0;
    const totalCoinsSpent = existingCoinsSpent > 0 ? existingCoinsSpent : 0;
    const totalDiamondsSpent = Math.max(existingDiamondsSpent, diamondsFeeToDeduct, DIAMOND_PREDICTION_FEE);

    const isFinished = match.status === 'FINISHED';
    const matchReward = typeof match.customCoinsReward === 'number' ? match.customCoinsReward : 0;
    const isExactRight = isFinished && match.homeScore === homeScore && match.awayScore === awayScore;
    const pointsAwarded = isExactRight ? (matchReward > 0 ? matchReward : 10) : 0;
    const coinsAwarded = isExactRight ? matchReward : 0;

    const newPredictionRecord: Record<string, any> = {
      id: predDocId,
      matchId: match.id,
      matchHomeTeam: match.homeTeam || '',
      matchHomeTeamAr: match.homeTeamAr || match.homeTeam || '',
      matchAwayTeam: match.awayTeam || '',
      matchAwayTeamAr: match.awayTeamAr || match.awayTeam || '',
      predictedHomeScore: Number(homeScore),
      predictedAwayScore: Number(awayScore),
      ...(typeof match.homeScore === 'number' ? { matchHomeScore: match.homeScore } : {}),
      ...(typeof match.awayScore === 'number' ? { matchAwayScore: match.awayScore } : {}),
      status: isFinished ? (isExactRight ? 'EXACT_SCORE' : 'MISSED') : 'PENDING',
      pointsEarned: pointsAwarded,
      coinsEarned: coinsAwarded,
      coinsSpent: totalCoinsSpent,
      diamondsSpent: totalDiamondsSpent,
      evaluated: isFinished,
      createdAt: existingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If already finished and exact score was correct, award coins & points immediately
    if (isExactRight) {
      setUserPoints((prev) => {
        const newPts = prev + coinsAwarded;
        localStorage.setItem(`kora_user_points_${userKey}`, newPts.toString());
        return newPts;
      });

      setUserPredictionPoints((prev) => prev + pointsAwarded);
    }

    // Filter out previous prediction for this match so we strictly maintain a SINGLE updated record
    predsArr = predsArr.filter((p: any) => p.matchId !== match.id && p.id !== predDocId);
    predsArr.unshift(newPredictionRecord);
    localStorage.setItem(storageKey, JSON.stringify(predsArr));
    refreshTodayPredictionsCount(userKey);

    const updatedPredictionsMap = {
      ...userPredictionsRef.current,
      ...userPredictions,
      [match.id]: {
        predictedHomeScore: Number(homeScore),
        predictedAwayScore: Number(awayScore),
      },
    };
    userPredictionsRef.current = updatedPredictionsMap;
    setUserPredictions(updatedPredictionsMap);

    // Notify all open tabs, windows, and components immediately
    window.dispatchEvent(new CustomEvent('kora_predictions_updated', { detail: predsArr }));
    window.dispatchEvent(new Event('kora_coins_updated'));

    // Auto-sync prediction to League Tournament if user is a participant and match is one of the shared fixtures
    try {
      syncPredictionToLeagueTournament(user, match.id, homeScore, awayScore);
    } catch (_) {}

    // Save/Update prediction in backend & Firestore if logged in
    if (user) {
      setIsSavingData(true);

      // 1. Immediately push to server-side persistent store (guaranteed even if client Firestore is unauthenticated)
      try {
        fetch('/api/user/sync-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            email: user.email,
            displayName: user.displayName,
            localCoins: userPoints,
            localDiamonds: updatedDiamondsAfterFee,
            predictions: predsArr,
            predictionsMap: updatedPredictionsMap,
            favoriteMatches: favoriteMatchIds,
          }),
        }).catch(() => {});
      } catch (_) {}

      // 2. Save to Firestore (cleaned of any undefined properties)
      try {
        const recordToSave: Record<string, any> = {
          ...newPredictionRecord,
          userId: user.uid,
          userEmail: (user.email || '').toLowerCase().trim(),
          userDisplayName: user.displayName || 'الكابتن',
        };
        Object.keys(recordToSave).forEach((k) => {
          if (recordToSave[k] === undefined) delete recordToSave[k];
        });

        await setDoc(doc(db, 'predictions', predDocId), recordToSave, { merge: true }).catch(() => {});

        const userRef = doc(db, 'users', user.uid);
        await setDoc(
          userRef,
          {
            diamonds: updatedDiamondsAfterFee,
            predictionsMap: {
              ...updatedPredictionsMap,
              [match.id]: {
                predictedHomeScore: Number(homeScore),
                predictedAwayScore: Number(awayScore),
                status: newPredictionRecord.status,
                diamondsSpent: totalDiamondsSpent,
                updatedAt: new Date().toISOString(),
              },
            },
            predictionsList: predsArr,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});

        if (feeToDeduct > 0 || isExactRight) {
          const uSnap = await getDoc(userRef).catch(() => null);
          if (uSnap && uSnap.exists()) {
            const uData = uSnap.data();
            const currentPts = uData.points || 0;
            const newFinalPts = Math.max(0, currentPts - feeToDeduct + (isExactRight ? coinsAwarded : 0));
            await setDoc(
              userRef,
              {
                points: newFinalPts,
                coins: newFinalPts,
                predictionPoints: (uData.predictionPoints || 0) + pointsAwarded,
                exactPredictions: (uData.exactPredictions || 0) + (isExactRight ? 1 : 0),
              },
              { merge: true }
            ).catch(() => {});
          }
        }

        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 3000);
      } catch (err) {
        console.warn('Notice saving prediction to Firestore:', err);
      } finally {
        setIsSavingData(false);
      }
    }
  };

  // Filtered matches logic - dynamically synced with currentDateStr
  const todayStr = currentDateStr;
  const tomorrowStr = getLocalDayString(1);

  // Dedicated tournament matches for Featured Tournaments tab
  // (Removed all available matches in "بطولات الماتشات" per explicit user request)
  const tournamentMatches: Match[] = useMemo(() => {
    return [];
  }, []);

  // Standard matches for general Matches feed with guaranteed catalog score consistency
  // Note: League tournament matches are removed from the main page per user request:
  // ("بص بالنسبه للماتشات اللي انت ضفتها في البطوله اللي هي البطولات الدوريات تمام شيلها من من هناك شيلها من اللي هي الصفحه الرئيسيه")
  const standardMatches = useMemo(() => {
    return matches
      .filter((m) => 
        !isMatchRemovedGlobally(m.id) && 
        !isMatchObjectRemovedGlobally(m) &&
        !DEDICATED_LEAGUE_TOURNAMENT_MATCH_IDS.includes(m.id) &&
        !m.isTournamentMatch
      )
      .map((m) => {
        const cat = FINISHED_MATCHES_CATALOG[m.id];
        if (cat) {
          return {
            ...m,
            homeScore: cat.homeScore,
            awayScore: cat.awayScore,
            status: 'FINISHED' as MatchStatus,
            isFinished: true,
            time: 'انتهت',
            minute: 'انتهت',
            pointsDistributed: true,
            customCoinsReward: cat.customCoinsReward !== undefined ? cat.customCoinsReward : (m.customCoinsReward ?? 0),
          };
        }
        if (isMatchFinished(m) || m.status === 'FINISHED' || m.isFinished === true) {
          const resolved = resolveFinalMatchScore(m);
          return {
            ...m,
            homeScore: resolved.homeScore,
            awayScore: resolved.awayScore,
            status: 'FINISHED' as MatchStatus,
            isFinished: true,
            time: 'انتهت',
            minute: 'انتهت',
            pointsDistributed: true,
          };
        }
        return m;
      });
  }, [matches]);

  // Category counts calculation for status filter
  const categoryCounts = React.useMemo(() => {
    let all = 0;
    let today = 0;
    let tomorrow = 0;
    let finished = 0;

    standardMatches.forEach((m) => {
      const isFinishedMatch = m.status === 'FINISHED' || m.isFinished === true || m.pointsDistributed === true || Boolean(FINISHED_MATCHES_CATALOG[m.id]) || isMatchFinished(m);
      const isToday = m.date === todayStr || m.dayOffset === 0;
      const isTomorrow = m.date === tomorrowStr || m.dayOffset === 1;

      if (!isFinishedMatch) {
        all++;
        if (isToday) today++;
        if (isTomorrow) tomorrow++;
      } else {
        finished++;
      }
    });

    return { ALL: all, TODAY: today, TOMORROW: tomorrow, FINISHED: finished };
  }, [standardMatches, todayStr, tomorrowStr]);

  // Filtered upcoming & live matches for "المباريات والجوائز" sub-page
  const fixturesMatches = useMemo(() => {
    return standardMatches
      .filter((m) => {
        const isFinishedMatch = m.status === 'FINISHED' || m.isFinished === true || m.pointsDistributed === true || Boolean(FINISHED_MATCHES_CATALOG[m.id]) || isMatchFinished(m);
        if (isFinishedMatch) return false;

        if (activeTab === 'favorites' && !favoriteMatchIds.includes(m.id)) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchText = `${m.homeTeam} ${m.homeTeamAr} ${m.awayTeam} ${m.awayTeamAr} ${m.leagueName} ${m.leagueNameAr}`.toLowerCase();
          if (!matchText.includes(q)) return false;
        }

        if (statusFilter === 'ALL') {
          return true;
        } else if (statusFilter === 'TODAY') {
          const isToday = (m.date === todayStr || m.dayOffset === 0);
          const isLive = isMatchLive(m);
          return isToday || isLive;
        } else if (statusFilter === 'TOMORROW') {
          const isTomorrow = (m.date === tomorrowStr || m.dayOffset === 1);
          return isTomorrow;
        }

        return true;
      })
      .sort((a, b) => {
        const isLiveA = isMatchLive(a);
        const isLiveB = isMatchLive(b);
        if (isLiveA && !isLiveB) return -1;
        if (!isLiveA && isLiveB) return 1;

        const getSafeSortTime = (m: any): number => {
          if (typeof m.kickoffTimeMs === 'number' && !isNaN(m.kickoffTimeMs)) return m.kickoffTimeMs;
          if (!m.date || !m.time) return 0;
          const cleanTime = String(m.time).replace(/[^0-9:]/g, '');
          if (!cleanTime.includes(':')) return 0;
          try {
            const dt = new Date(`${m.date}T${cleanTime.padStart(5, '0')}:00`).getTime();
            return isNaN(dt) ? 0 : dt;
          } catch (_) {
            return 0;
          }
        };

        const timeA = getSafeSortTime(a);
        const timeB = getSafeSortTime(b);
        return timeA - timeB;
      });
  }, [standardMatches, activeTab, favoriteMatchIds, searchQuery, statusFilter, todayStr, tomorrowStr]);

  // Filtered finished matches for "المباريات المنتهية" sub-page
  const finishedMatches = useMemo(() => {
    return standardMatches
      .filter((m) => {
        const isFinishedMatch = m.status === 'FINISHED' || m.isFinished === true || m.pointsDistributed === true || Boolean(FINISHED_MATCHES_CATALOG[m.id]) || isMatchFinished(m);
        return isFinishedMatch;
      })
      .filter((m) => {
        if (activeTab === 'favorites' && !favoriteMatchIds.includes(m.id)) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchText = `${m.homeTeam} ${m.homeTeamAr} ${m.awayTeam} ${m.awayTeamAr} ${m.leagueName} ${m.leagueNameAr}`.toLowerCase();
          if (!matchText.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const getSafeSortTime = (m: any): number => {
          if (typeof m.kickoffTimeMs === 'number' && !isNaN(m.kickoffTimeMs)) return m.kickoffTimeMs;
          if (!m.date || !m.time) return 0;
          const cleanTime = String(m.time).replace(/[^0-9:]/g, '');
          if (!cleanTime.includes(':')) return 0;
          try {
            const dt = new Date(`${m.date}T${cleanTime.padStart(5, '0')}:00`).getTime();
            return isNaN(dt) ? 0 : dt;
          } catch (_) {
            return 0;
          }
        };

        const timeA = getSafeSortTime(a);
        const timeB = getSafeSortTime(b);
        return timeB - timeA; // Latest finished first
      });
  }, [standardMatches, activeTab, favoriteMatchIds, searchQuery]);

  // Favorite matches calculation (derived from standardMatches so tournament matches are kept only in tournaments)
  const favoriteMatches = useMemo(() => {
    return standardMatches.filter((m) => favoriteMatchIds.includes(m.id));
  }, [standardMatches, favoriteMatchIds]);

  // Today's matches calculation for the daily prediction progress bar (كل يوم بيومه)
  const todayMatches = useMemo(() => {
    return standardMatches.filter((m) => {
      return (m.date === todayStr || m.dayOffset === 0 || isMatchLive(m));
    });
  }, [standardMatches, todayStr]);

  // Check if today has matches scheduled (upcoming or live matches scheduled for today)
  const hasMatchesToday = useMemo(() => {
    if (!todayMatches || todayMatches.length === 0) return false;
    return todayMatches.some((m) => {
      const isDone = m.status === 'FINISHED' || m.isFinished === true || Boolean(FINISHED_MATCHES_CATALOG[m.id]);
      return !isDone || isMatchLive(m);
    });
  }, [todayMatches]);

  const todayTotalMatchesCount = todayMatches.length;
  const todayPredictedMatchesCount = todayMatches.filter((m) => Boolean(getPredictionForMatch(m))).length;
  const todayPredictionProgressPercent = todayTotalMatchesCount > 0 
    ? Math.min(100, Math.round((todayPredictedMatchesCount / todayTotalMatchesCount) * 100)) 
    : 0;

  return (
    <div 
      dir={isAr ? 'rtl' : 'ltr'} 
      className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/70 text-slate-900'} font-sans ${isAr ? 'rtl' : 'ltr'}`}
    >
      {/* Dynamic Animated Splash Opening Screen */}
      <SplashOpeningScreen minDurationMs={1200} />
      
      {/* First-Time Visitor Screen Install Prompt Modal */}
      <FirstVisitInstallModal language={language} theme={theme} />
      
      {/* Header Bar */}
      <Header
        language={language}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onClosePage={handleClosePage}
        previousTab={tabHistory.length > 0 ? tabHistory[tabHistory.length - 1] : 'matches'}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        favoriteCount={favoriteMatchIds.length}
        userPoints={userPoints}
        userDiamonds={userDiamonds}
        userDisplayName={user?.displayName}
        onSignIn={handleSignIn}
        activeSubscriptionsCount={subscriptions.length}
        onOpenNotificationCenter={() => setShowNotificationCenter(true)}
        onOpenCoinsBreakdown={() => setShowCoinsModal(true)}
        onOpenProSubscriptions={() => setShowProSubscriptionModal(true)}
        onFootballSync={() => handleFootballApiSync(true)}
        isSyncingFootball={isSyncingFootball}
        theme={theme}
      />

      {/* Cloud Sync / Saving Data Indicator Toast */}
      {isSavingData && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-pulse">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>{isAr ? '⚡ جاري مزامنة النقاط والتوقعات سحابياً...' : '⚡ Syncing points & predictions with cloud...'}</span>
        </div>
      )}

      {showSyncSuccess && !isSavingData && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-emerald-950/95 border border-emerald-400/80 text-emerald-100 text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-md">
          <span className="text-emerald-400 font-black text-sm">✓</span>
          <span>{isAr ? 'تم حفظ وتأمين نقاطك وتوقعاتك سحابياً' : 'Points and predictions safely saved to cloud!'}</span>
        </div>
      )}

      {/* Rewarded Ad Balance Update Toast Notification */}
      {rewardToastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border border-amber-400 text-amber-200 text-xs font-black shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce">
          <span className="text-base">🪙</span>
          <span>{rewardToastMessage}</span>
        </div>
      )}

      {/* Main App Container (Compact Display Width max-w-lg) */}
      <main className="max-w-lg mx-auto px-2.5 sm:px-3.5 py-3 pb-36 sm:pb-40 space-y-4">
        
        {/* Global Ad Banner Slot (Displayed on Every Page - Paused temporarily per user request) */}
        {!IS_ONE_COIN_ADS_PAUSED && (
          <AdBannerSlot
            language={language}
            theme={theme}
            onEarnReward={handleBrowseAdReward}
            todayBrowseCount={todayBrowseAdsCount}
            maxDailyBrowseCount={10}
          />
        )}

        <AnimatePresence mode="wait">
          {/* TAB 1: MATCHES CENTER */}
          {activeTab === 'matches' && (
            <motion.div
              key="matches"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-3.5"
            >
              {/* Dual Sub-Pages Switcher: 1. المباريات والجوائز | 2. المباريات المنتهية */}
              <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 shadow-sm transition-all relative ${
                theme === 'dark' ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <button
                  onClick={() => setMatchesSubTab('fixtures_prizes')}
                  className={`relative flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 z-10 ${
                    matchesSubTab === 'fixtures_prizes'
                      ? 'text-white'
                      : theme === 'dark'
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {matchesSubTab === 'fixtures_prizes' && (
                    <motion.div
                      layoutId="activeMatchesSubTabIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 rounded-xl shadow-md border border-emerald-400/40 z-0"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>{isAr ? 'المباريات والجوائز' : 'Matches & Prizes'}</span>
                  </span>
                </button>

                <button
                  onClick={() => setMatchesSubTab('finished')}
                  className={`relative flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 z-10 ${
                    matchesSubTab === 'finished'
                      ? 'text-white'
                      : theme === 'dark'
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {matchesSubTab === 'finished' && (
                    <motion.div
                      layoutId="activeMatchesSubTabIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 rounded-xl shadow-md border border-emerald-400/40 z-0"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>{isAr ? 'المباريات المنتهية' : 'Finished Matches'}</span>
                    {categoryCounts.FINISHED > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        matchesSubTab === 'finished'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {categoryCounts.FINISHED}
                      </span>
                    )}
                  </span>
                </button>
              </div>

              {/* SUB-PAGE 1: المباريات والجوائز (Fixtures & Prizes) */}
              {matchesSubTab === 'fixtures_prizes' && (
                <div className="space-y-3.5 animate-fadeIn">
                  {/* Predictions Progress & Coins Strip (شريط المباريات المتوقعة والكوينز) */}
                  <div className={`p-3 sm:p-3.5 rounded-2xl border shadow-sm transition-all ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-slate-900/95 via-emerald-950/40 to-slate-900/95 border-emerald-500/30 text-white'
                      : 'bg-gradient-to-r from-white via-emerald-50/60 to-amber-50/50 border-slate-200 text-slate-900'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => setShowCoinsModal(true)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-black transition-transform active:scale-95 cursor-pointer shrink-0 shadow-sm ${
                            theme === 'dark'
                              ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 hover:bg-amber-500/30'
                              : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                          }`}
                          title={isAr ? 'عرض رصيد الكوينز وتفاصيل المباريات الرابحة' : 'View Coins Earnings Breakdown'}
                        >
                          <span className="text-sm">🪙</span>
                          <span className="font-mono text-sm">{userPoints}</span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400">{isAr ? 'كوينز' : 'Coins'}</span>
                        </button>

                        <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 truncate">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                          <span className="truncate">{isAr ? '٥٠ كوينز لكل توقع صحيح' : '50 Coins per correct prediction'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleTabChange('prizes')}
                        className="flex items-center gap-1 text-[11px] font-black text-amber-700 dark:text-amber-300 hover:underline shrink-0"
                      >
                        <Gift className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isAr ? 'الجوائز 🎁' : 'Rewards 🎁'}</span>
                      </button>
                    </div>

                    {/* Predictions progress bar (عدد مباريات اليوم المتوقعة - كل يوم بيومه مثلاً 0/2 أو 1/2) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <span>🎯</span>
                          <span>{isAr ? 'توقعات مباريات اليوم:' : "Today's Predictions:"}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-400" dir="ltr">
                            {todayPredictedMatchesCount}/{todayTotalMatchesCount}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            ({todayPredictionProgressPercent}%)
                          </span>
                          {todayTotalMatchesCount > 0 && todayPredictedMatchesCount === todayTotalMatchesCount && (
                            <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded-md border border-amber-500/30">
                              {isAr ? 'مكتمل ✨' : 'Done ✨'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`w-full h-2 rounded-full overflow-hidden border ${
                        theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-200/80 border-slate-300'
                      }`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-500"
                          style={{ width: `${todayPredictionProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pro Subscriptions (باقات شحن الماسات 💎) Banner */}
                  <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-xs ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-orange-500/20 via-slate-900 to-amber-500/15 border-orange-500/40 text-white'
                      : 'bg-gradient-to-r from-orange-100/90 via-white to-amber-50 border-orange-400 text-slate-900 shadow-orange-500/10'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 shadow-inner">
                        <OrangeDiamondIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                          <span>{isAr ? 'باقات شحن الماسات 💎' : 'Diamonds Top-Up Packages 💎'}</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-orange-500 text-white font-black text-[9px] uppercase">VIP</span>
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                          {isAr ? 'اشحن ماسات التوقعات فوراً عبر واتساب (من 50 جنيه) ⚡' : 'Recharge prediction diamonds instantly via WhatsApp'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowProSubscriptionModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs shrink-0 shadow-sm active:scale-95 transition-transform cursor-pointer"
                    >
                      {isAr ? 'عرض الباقات' : 'View Packs'}
                    </button>
                  </div>

                  {/* Status Filter for Upcoming & Live Matches */}
                  <MatchStatusFilter
                    statusFilter={statusFilter as StatusFilterType}
                    setStatusFilter={(f) => setStatusFilter(f)}
                    language={language}
                    totalCount={fixturesMatches.length}
                    showFinishedOption={false}
                    categoryCounts={categoryCounts}
                    theme={theme}
                  />

                  {/* Upcoming / Live Match Cards Grid */}
                  {fixturesMatches.length === 0 ? (
                    <div className={`p-8 text-center rounded-3xl border ${
                      theme === 'dark' ? 'bg-slate-900/80 border-slate-800/80 text-slate-400' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                    }`}>
                      <Shield className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                      <p className="font-bold text-xs sm:text-sm">{isAr ? 'لا توجد مباريات قادمة تطابق هذا البحث.' : 'No upcoming matches found matching criteria.'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3.5">
                      {fixturesMatches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          language={language}
                          onOpenDetails={handleOpenDetails}
                          isFavorite={favoriteMatchIds.includes(match.id)}
                          onToggleFavorite={handleToggleFavorite}
                          isSubscribed={subscriptions.some((s) => s.matchId === match.id)}
                          onOpenSubscribeModal={(m) => setSubscribeModalMatch(m)}
                          userPrediction={getPredictionForMatch(match)}
                          theme={theme}
                          isFreePrediction={false}
                          remainingFreePredictions={0}
                        />
                      ))}
                    </div>
                  )}

                    {/* Watch Ad & Earn 5 Coins Section (Max 3 Ads Per Day) */}
                    <div className="pt-2">
                      <RewardedAdsSection
                        language={language}
                        theme={theme}
                        todayWatchedCount={todayAdsWatchedCount}
                        maxDailyAds={3}
                        hasMatchesToday={hasMatchesToday}
                        isPaused={true}
                        onWatchAd={(videoNum?: number) => {
                          setRewardToastMessage(
                            language === 'ar'
                              ? '⏸️ مشاهدة فيديوهات الإعلانات متوقفة مؤقتاً حالياً - ستعود مكافآت الكوينز قريباً عند عودة كوينز المباريات!'
                              : '⏸️ Video ads are temporarily paused - they will return soon along with match coins!'
                          );
                          setTimeout(() => setRewardToastMessage(null), 4000);
                        }}
                        adUrl="https://vapid-size.com/dhm.FWzzduGLN/v/Z/GoUP/FeNm/9Yu/Z/Utl/kfPDTecj0/MATCci0/MBzcMGtfNCzcQ_x/Noz/QPz_NrwP"
                      />
                    </div>
                </div>
              )}

              {/* SUB-PAGE 2: المباريات المنتهية (Finished Matches) */}
              {matchesSubTab === 'finished' && (
                <div className="space-y-3.5 animate-fadeIn">
                  {/* Finished Matches Banner Header */}
                  <div className={`p-3.5 rounded-2xl border shadow-sm flex items-center justify-between gap-3 ${
                    theme === 'dark' ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black">
                          {isAr ? 'نتائج المباريات المنتهية' : 'Finished Match Results'}
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {isAr ? 'استعرض النتائج النهائية والأهداف وتقييم نقاط توقعاتك' : 'Review final scores, goalscorers and your prediction points'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      {finishedMatches.length} {isAr ? 'مباراة' : 'matches'}
                    </span>
                  </div>

                  {/* Finished Match Cards Grid */}
                  {finishedMatches.length === 0 ? (
                    <div className={`p-8 text-center rounded-3xl border ${
                      theme === 'dark' ? 'bg-slate-900/80 border-slate-800/80 text-slate-400' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                    }`}>
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                      <p className="font-bold text-xs sm:text-sm">{isAr ? 'لا توجد مباريات منتهية مسجلة.' : 'No finished matches available.'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3.5">
                      {finishedMatches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          language={language}
                          onOpenDetails={handleOpenDetails}
                          isFavorite={favoriteMatchIds.includes(match.id)}
                          onToggleFavorite={handleToggleFavorite}
                          isSubscribed={subscriptions.some((s) => s.matchId === match.id)}
                          onOpenSubscribeModal={(m) => setSubscribeModalMatch(m)}
                          userPrediction={getPredictionForMatch(match)}
                          theme={theme}
                          isFreePrediction={false}
                          remainingFreePredictions={0}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: FEATURED TOURNAMENTS (البطولات المميزة) */}
          {activeTab === 'tournaments' && (
            <motion.div
              key="tournaments"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <FeaturedTournaments
                language={language}
                theme={theme}
                tournamentMatches={tournamentMatches}
                allMatches={matches}
                onOpenDetails={handleOpenDetails}
                userPredictions={userPredictions}
                onSavePrediction={handleSavePrediction}
                userDiamonds={userDiamonds}
                onOpenGames={() => handleTabChange('games')}
                onOpenRewards={() => handleTabChange('prizes')}
                onClose={handleClosePage}
                onFootballSync={() => handleFootballApiSync()}
                isSyncingFootball={isSyncingFootball}
                user={user}
              />
            </motion.div>
          )}

          {/* TAB 2.5: GAMES HUB (صفحة الألعاب وركلات الترجيح بالماسات البرتقالية) */}
          {activeTab === 'games' && (
            <motion.div
              key="games"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <GamesPage
                language={language}
                theme={theme}
                user={user}
                userPoints={userPoints}
                userDiamonds={userDiamonds}
                onAddDiamonds={handleAddDiamonds}
                onSignInRequired={handleSignIn}
                onClose={handleClosePage}
              />
            </motion.div>
          )}

          {/* TAB 3: CASH PRIZES & INSTAPAY STORE */}
          {activeTab === 'prizes' && (
            <motion.div
              key="prizes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <PredictionsAndRewards
                matches={matches}
                language={language}
                userPoints={userPoints}
                setUserPoints={setUserPoints}
                userDiamonds={userDiamonds}
                onOpenGames={() => handleTabChange('games')}
                userId={user ? user.uid : 'guest-123'}
                userDisplayName={user ? (user.displayName || 'الكابتن') : 'الكابتن'}
                theme={theme}
                onOpenCoinsBreakdown={() => setShowCoinsModal(true)}
                onClose={handleClosePage}
              />
            </motion.div>
          )}

          {/* TAB 4: ACCOUNT & PROFILE */}
          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <AccountPage
                language={language}
                onLanguageChange={setLanguage}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                setTheme={setTheme}
                userPoints={userPoints}
                setUserPoints={setUserPoints}
                userDiamonds={userDiamonds}
                onOpenGames={() => handleTabChange('games')}
                user={user}
                onSignIn={handleSignIn}
                onSignOut={handleSignOut}
                userPredictions={userPredictions}
                matches={matches}
                onOpenDetails={handleOpenDetails}
                onInstallApp={() => window.dispatchEvent(new Event('kora_trigger_pwa_install'))}
                initialSubTab={accountInitialSubTab}
                highlightMatchId={accountHighlightMatchId}
                onOpenCoinsBreakdown={() => setShowCoinsModal(true)}
                onOpenProSubscriptions={() => setShowProSubscriptionModal(true)}
                onClose={handleClosePage}
              />
            </motion.div>
          )}

          {/* TAB 5: FAVORITES */}
          {activeTab === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <span>{isAr ? 'مباريات وفرقك المفضلة' : 'Your Favorite Matches'}</span>
                </h2>
                <button
                  type="button"
                  onClick={handleClosePage}
                  aria-label={isAr ? 'إغلاق والرجوع للصفحة السابقة' : 'Close & Go Back'}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-sm transition-all cursor-pointer active:scale-95 border border-rose-400/50"
                >
                  <span>✕</span>
                  <span>{isAr ? 'إغلاق والرجوع (×)' : 'Close & Back (×)'}</span>
                </button>
              </div>

              {favoriteMatches.length === 0 ? (
                <div className={`p-12 text-center rounded-3xl border space-y-2 ${
                  theme === 'dark' ? 'bg-slate-900/80 border-slate-800/80 text-slate-400' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                }`}>
                  <Heart className="w-10 h-10 mx-auto text-slate-400" />
                  <p className="font-bold">{isAr ? 'لم تقم بتمييز أي مباراة كـ مفضلة بعد.' : 'No favorite matches saved yet.'}</p>
                  <p className="text-xs">{isAr ? 'اضغط على رمز القلب في بطاقة أي مباراة لحفظها هنا.' : 'Click the heart icon on any match card to bookmark it.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {favoriteMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      language={language}
                      onOpenDetails={handleOpenDetails}
                      isFavorite={true}
                      onToggleFavorite={handleToggleFavorite}
                      isSubscribed={subscriptions.some((s) => s.matchId === match.id)}
                      onOpenSubscribeModal={(m) => setSubscribeModalMatch(m)}
                      userPrediction={getPredictionForMatch(match)}
                      theme={theme}
                      isFreePrediction={false}
                      remainingFreePredictions={0}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Verified Publisher Footer with Compliance & Policy Modals */}
      <div className="pb-20">
        <Footer language={language} theme={theme} />
      </div>

      {/* Match Details Modal Dialog */}
      {selectedMatch && (
        <MatchDetailsModal
          match={selectedMatch}
          initialTab={modalInitialTab}
          onClose={() => setSelectedMatch(null)}
          language={language}
          onVotePrediction={handleVotePrediction}
          onSavePrediction={handleSavePrediction}
          existingPrediction={getPredictionForMatch(selectedMatch)}
          isSubscribed={subscriptions.some((s) => s.matchId === selectedMatch.id)}
          onOpenSubscribeModal={(m) => setSubscribeModalMatch(m)}
          userPoints={userPoints}
          userDiamonds={userDiamonds}
          onOpenGames={() => handleTabChange('games')}
          onOpenProSubscriptions={() => setShowProSubscriptionModal(true)}
          isFreePrediction={false}
          remainingFreePredictions={0}
        />
      )}

      {/* FCM Push Notification Subscribe Modal */}
      {subscribeModalMatch && (
        <SubscribeMatchModal
          match={subscribeModalMatch}
          language={language}
          userId={user ? user.uid : null}
          currentSubscription={subscriptions.find((s) => s.matchId === subscribeModalMatch.id) || null}
          onClose={() => setSubscribeModalMatch(null)}
          onSignInRequired={() => {
            setSubscribeModalMatch(null);
            setShowAuthWelcomeModal(true);
          }}
        />
      )}

      {/* Notification Center Modal */}
      {showNotificationCenter && (
        <NotificationCenterModal
          language={language}
          userId={user ? user.uid : null}
          subscriptions={subscriptions}
          notificationsLog={notificationsLog}
          onClose={() => setShowNotificationCenter(false)}
          onSignInRequired={() => {
            setShowNotificationCenter(false);
            setShowAuthWelcomeModal(true);
          }}
          onOpenMatchDetails={(matchId, tab) => {
            const targetMatch = matches.find(m => m.id === matchId);
            if (targetMatch) {
              handleOpenDetails(targetMatch, tab);
            }
          }}
        />
      )}

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav
        language={language}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        favoriteCount={favoriteMatchIds.length}
        theme={theme}
      />

      {/* Welcome Auth Gate Modal */}
      <AuthWelcomeModal
        isOpen={showAuthWelcomeModal}
        onClose={() => setShowAuthWelcomeModal(false)}
        language={language}
        onSuccessLogin={(isNewUser) => {
          setShowAuthWelcomeModal(false);
          // If user previously logged out and logged back in, show install prompt
          const hadLoggedOut = localStorage.getItem('kora_show_install_after_logout') === 'true';
          if (hadLoggedOut) {
            try {
              localStorage.removeItem('kora_install_prompt_responded');
              localStorage.removeItem('kora_first_visit_install_prompt_responded');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('kora_show_first_visit_install_prompt'));
              }, 1000);
            } catch (_) {}
          } else {
            // Every newly registered user MUST receive the notification activation prompt immediately
            if (isNewUser) {
              setShowFirstTimePermissions(true);
            } else {
              // Also if an existing user logs in and notifications aren't granted yet in the browser
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                const currentUid = user?.uid || auth.currentUser?.uid;
                const hasConfirmed = currentUid ? localStorage.getItem(`kora_permissions_confirmed_${currentUid}`) : null;
                if (!hasConfirmed) {
                  setShowFirstTimePermissions(true);
                }
              }
            }
          }
        }}
      />

      {/* First-Time User Permissions Confirmation Modal (Notifications, Storage & Offline Sync, Audio, Terms) */}
      <FirstTimePermissionsModal
        isOpen={showFirstTimePermissions}
        onComplete={() => {
          const currentUid = user?.uid || auth.currentUser?.uid;
          if (currentUid) {
            localStorage.setItem(`kora_permissions_confirmed_${currentUid}`, 'true');
          }
          localStorage.setItem('kora_permissions_ever_confirmed', 'true');
          setShowFirstTimePermissions(false);
        }}
        language={language}
        userId={user ? user.uid : auth.currentUser ? auth.currentUser.uid : null}
        userName={user ? user.displayName || undefined : auth.currentUser ? auth.currentUser.displayName || undefined : undefined}
      />

      {/* Coins Earnings History & Winning Matches Breakdown Modal */}
      <CoinsHistoryModal
        isOpen={showCoinsModal}
        onClose={() => setShowCoinsModal(false)}
        language={language}
        theme={theme}
        user={user}
        userPoints={userPoints}
        matches={matches}
        userPredictions={userPredictions}
        onNavigateToPredictionsMatch={(matchId) => {
          setShowCoinsModal(false);
          setAccountHighlightMatchId(matchId);
          setAccountInitialSubTab('predictions');
          handleTabChange('account');
        }}
        onNavigateToMatchesTab={() => {
          setShowCoinsModal(false);
          handleTabChange('matches');
        }}
        onSignIn={handleSignIn}
      />

      {/* Pro Subscriptions Modal (4 Diamonds Packages + WhatsApp Direct Activation) */}
      <ProSubscriptionModal
        isOpen={showProSubscriptionModal}
        onClose={() => setShowProSubscriptionModal(false)}
        language={language}
        theme={theme}
        user={user}
        userPoints={userPoints}
        userDiamonds={userDiamonds}
      />

      {/* Rewarded Ad Player Modal (Full-length ad player to earn 5 coins) */}
      <RewardedAdPlayerModal
        isOpen={showRewardedAdModal}
        onClose={() => setShowRewardedAdModal(false)}
        language={language}
        theme={theme}
        adNumber={selectedAdVideoNumber}
        adIndexToday={todayAdsWatchedCount + 1}
        maxDailyAds={3}
        hasMatchesToday={hasMatchesToday}
        sponsorUrl="https://vapid-size.com/dhm.FWzzduGLN/v/Z/GoUP/FeNm/9Yu/Z/Utl/kfPDTecj0/MATCci0/MBzcMGtfNCzcQ_x/Noz/QPz_NrwP"
        onRewardEarned={handleCompleteRewardedAd}
      />
    </div>
  );
}
