import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Match, Language, ThemeMode, MatchSubscription, PushNotificationLog, PrizeClaim } from './types';
import { INITIAL_MATCHES, LEAGUES, deduplicateMatches, generateInitialMatches, getLocalDayString, getArabicDayLabel } from './data/mockData';
import { isMatchLive, hasLiveOrStartedMatchesToday, getEarliestKickoffMsToday } from './data/matchHelpers';
import { Header } from './components/Header';
import { MatchCard } from './components/MatchCard';
import { MatchDetailsModal } from './components/MatchDetailsModal';
import { KoraAIAssistant } from './components/KoraAIAssistant';
import { NewsAndTransfers } from './components/NewsAndTransfers';
import { PredictionsAndRewards } from './components/PredictionsAndRewards';
import { AccountPage, AccountSubTab } from './components/AccountPage';
import { CoinsHistoryModal } from './components/CoinsHistoryModal';
import { FeaturedTournaments } from './components/FeaturedTournaments';
import { BottomNav } from './components/BottomNav';
import { AuthWelcomeModal } from './components/AuthWelcomeModal';
import { AdBannerSlot } from './components/AdBannerSlot';
import { SubscribeMatchModal } from './components/SubscribeMatchModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { LiveNotificationToast } from './components/LiveNotificationToast';
import { FirstTimePermissionsModal } from './components/FirstTimePermissionsModal';
import { InstallAppBanner } from './components/InstallAppBanner';
import { SplashOpeningScreen } from './components/SplashOpeningScreen';
import { Footer } from './components/Footer';
import { MatchStatusFilter, StatusFilterType } from './components/MatchStatusFilter';
import { 
  listenToUserSubscriptions, 
  listenToNotificationLogs, 
  checkAndDispatchMatchNotifications,
  autoDetectAndBroadcastNewFeaturedMatches
} from './lib/notifications';
import { 
  subscribeToCloudMatches, 
  mergeCloudMatches, 
  syncAllBaselineMatchesToCloud, 
  updateMatchResultInCloud 
} from './lib/matchCloudSync';
import { fetchApiFootballLiveMatches, processApiFootballSyncedMatches } from './lib/footballApiSync';
import { getNumericUserId } from './utils/userId';
import { evaluateUserPredictionsList, isMatchRemovedGlobally, isMatchObjectRemovedGlobally } from './utils/predictionEvaluator';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
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

  const [activeTab, setActiveTab] = useState<'matches' | 'tournaments' | 'prizes' | 'account' | 'ai' | 'news' | 'favorites'>('matches');
  const [tabHistory, setTabHistory] = useState<Array<'matches' | 'tournaments' | 'prizes' | 'account' | 'ai' | 'news' | 'favorites'>>(['matches']);
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
  const [modalInitialTab, setModalInitialTab] = useState<'lineup' | 'stats' | 'events' | 'ai' | 'predict'>('lineup');

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
  const [user, setUser] = useState<User | null>(null);
  const [userPredictions, setUserPredictions] = useState<Record<string, { predictedHomeScore: number; predictedAwayScore: number }>>({});
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userPredictionPoints, setUserPredictionPoints] = useState<number>(0);

  // Cloud Sync & Data Preservation State
  const [isSavingData, setIsSavingData] = useState<boolean>(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState<boolean>(false);
  const [winningAwardToast, setWinningAwardToast] = useState<{ title: string; text: string; coins: number } | null>(null);
  const lastNotifiedWinsCountRef = useRef<number>(0);

  // Coins Breakdown Modal & Account Navigation State
  const [showCoinsModal, setShowCoinsModal] = useState<boolean>(false);
  const [accountInitialSubTab, setAccountInitialSubTab] = useState<AccountSubTab>('main');
  const [accountHighlightMatchId, setAccountHighlightMatchId] = useState<string | undefined>(undefined);

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
  const handleTabChange = (tab: 'matches' | 'tournaments' | 'prizes' | 'account' | 'ai' | 'news' | 'favorites') => {
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
  // ⚡ Starts ONLY when the first match of the day begins (e.g. at 8:00 PM kickoff), then refreshes every 5 minutes (300,000 ms)
  const [isSyncingFootball, setIsSyncingFootball] = useState<boolean>(false);
  const [lastFootballSyncTime, setLastFootballSyncTime] = useState<string | null>(null);
  const lastSyncTimestampRef = useRef<number>(0);

  const handleFootballApiSync = async (force: boolean = false) => {
    const now = Date.now();
    const currentMatchesList = matchesRef.current;

    // If not forced, enforce quota protection & 5-minute throttle (300,000 ms)
    if (!force) {
      const hasActiveMatches = hasLiveOrStartedMatchesToday(currentMatchesList);
      if (!hasActiveMatches) {
        return;
      }
      if (lastSyncTimestampRef.current > 0 && now - lastSyncTimestampRef.current < 300000) {
        return;
      }
    } else {
      // 3-second debounce for manual user clicks
      if (lastSyncTimestampRef.current > 0 && now - lastSyncTimestampRef.current < 3000) {
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
  // 1. Checks on load if any match today has already started. If not, skips network request.
  // 2. High-precision lightweight check (every 10s locally) to fire the FIRST request immediately when the 1st match begins.
  // 3. Ongoing 5-minute (300,000 ms) periodic sync while matches are live.
  useEffect(() => {
    // Initial check (only fires if a match is already underway)
    handleFootballApiSync();

    // ⚡ High-precision local kickoff watcher (every 10 seconds, 0 network cost):
    // Detects the exact start of the day's first match (e.g. 8:00 PM) and triggers the first API request instantly
    const kickoffWatcherInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const hasActiveMatches = hasLiveOrStartedMatchesToday(matchesRef.current);
        if (hasActiveMatches) {
          handleFootballApiSync();
        }
      }
    }, 10000);

    // ⚡ Periodic sync every 5 minutes (300,000 milliseconds) during matches
    const footballSyncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleFootballApiSync();
      }
    }, 300000);

    // Sync when user returns to tab if matches are live and 5 minutes have elapsed
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleFootballApiSync();
      }
    };

    const handleWindowFocus = () => {
      handleFootballApiSync();
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
    if (matches.length > 0) {
      autoDetectAndBroadcastNewFeaturedMatches(matches, language);
      checkAndDispatchMatchNotifications(matches, language, subscriptions);
    }
    const notifInterval = setInterval(() => {
      if (matches.length > 0) {
        autoDetectAndBroadcastNewFeaturedMatches(matches, language);
        checkAndDispatchMatchNotifications(matches, language, subscriptions);
      }
    }, 60000);
    return () => clearInterval(notifInterval);
  }, [matches, language, subscriptions]);

  // Listen to Auth State and Real-Time User Points with Strict Account Isolation
  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;
    let unsubPredictions: (() => void) | null = null;
    let unsubClaims: (() => void) | null = null;
    let unsubPayoutProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
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

      // Reset in-memory states immediately to prevent cross-account data bleed
      setUserPredictions({});
      setUserPoints(0);
      setUserPredictionPoints(0);

      if (currentUser) {
        setUser(currentUser);

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
                if (p.matchId && !isMatchRemovedGlobally(p.matchId)) {
                  localMap[p.matchId] = {
                    predictedHomeScore: p.predictedHomeScore,
                    predictedAwayScore: p.predictedAwayScore,
                  };
                }
              });
              setUserPredictions(localMap);
            }
          } catch (_) {}
        }

        // Migrate any guest predictions made before logging in (from link/Google/PWA) to this user account
        const guestKeys = ['kora_my_predictions_guest', 'kora_guest_predictions'];
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
                      setDoc(doc(db, 'predictions', migratedRecord.id), migratedRecord, { merge: true }).catch(() => {});
                    }
                  }
                });
                localStorage.removeItem(gk);
              }
            } catch (_) {}
          }
        });

        // 1. Attach Real-Time Listener to User Firestore Document
        const isAshrafFaroukUser = Boolean(
          currentUser?.email?.toLowerCase().includes('ashraf17farouk') ||
          currentUser?.uid === '76088785' ||
          currentUser?.uid === 'user_ashraf17farouk_gmail_com' ||
          (currentUser?.displayName && currentUser.displayName.includes('Ashraf Farouk'))
        );

        // Sanitize any previous incorrect evaluation for Real Madrid vs Inter or Sociedad vs Celta
        initialLocalPreds = initialLocalPreds.map((p: any) => {
          const mId = p.matchId || p.id;
          if (mId && (mId.includes('realmadrid_inter') || mId.includes('inter_realmadrid'))) {
            return {
              ...p,
              matchHomeScore: null,
              matchAwayScore: null,
              status: 'PENDING',
              pointsEarned: 0,
              coinsEarned: 0,
              evaluated: false,
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

        const userRef = doc(db, 'users', currentUser.uid);
        unsubUserDoc = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const rawPts = typeof data.points === 'number' ? data.points : 0;
            const predPts = typeof data.predictionPoints === 'number' ? data.predictionPoints : 0;

            // With Real Sociedad match finalized (+50 coins), Ashraf Farouk's total is 250 points
            const cleanPts = isAshrafFaroukUser ? Math.max(rawPts, 250) : rawPts;
            const cleanPredPts = isAshrafFaroukUser ? Math.max(predPts, 250) : predPts;

            setUserPoints(cleanPts);
            setUserPredictionPoints(cleanPredPts);
            localStorage.setItem(`kora_user_points_${currentUser.uid}`, cleanPts.toString());

            // Sync favorite matches across devices
            if (Array.isArray(data.favoriteMatches)) {
              setFavoriteMatchIds(data.favoriteMatches);
              localStorage.setItem(`kora_favorites_${currentUser.uid}`, JSON.stringify(data.favoriteMatches));
            }
          } else {
            // New user document doesn't exist yet: initialize new user profile with 0 points
            const koraId = getNumericUserId(currentUser.uid);
            const initialProfile = {
              displayName: currentUser.displayName || 'الكابتن',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || '',
              points: 0,
              predictionPoints: 0,
              koraId,
              exactPredictions: 0,
              correctOutcomes: 0,
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(userRef, initialProfile);
              setUserPoints(0);
              setUserPredictionPoints(0);
              localStorage.setItem(`kora_user_points_${currentUser.uid}`, '0');
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          // On Firestore error, fallback to strictly user-scoped points
          const savedPts = localStorage.getItem(`kora_user_points_${currentUser.uid}`);
          if (savedPts && !isNaN(Number(savedPts))) {
            setUserPoints(Number(savedPts));
          }
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

            // Safely merge predictions from Firestore and local cache so predictions are NEVER wiped or lost
            const mergedPredsMap = new Map<string, any>();

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
              if (mId && !isMatchRemovedGlobally(mId)) mergedPredsMap.set(mId, p);
            });
            fsPredsArr.forEach((p: any) => {
              const mId = p.matchId || p.id;
              if (mId && !isMatchRemovedGlobally(mId)) {
                const existing = mergedPredsMap.get(mId);
                if (!existing || !existing.updatedAt || !p.updatedAt || new Date(p.updatedAt) >= new Date(existing.updatedAt)) {
                  mergedPredsMap.set(mId, p);
                }
              }
            });

            const finalPredsList = Array.from(mergedPredsMap.values());
            const finalPredsMap: Record<string, { predictedHomeScore: number; predictedAwayScore: number }> = {};
            
            finalPredsList.forEach((p: any) => {
              const mId = p.matchId || p.id;
              if (mId) {
                finalPredsMap[mId] = {
                  predictedHomeScore: Number(p.predictedHomeScore),
                  predictedAwayScore: Number(p.predictedAwayScore),
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

            const finalEarnedCoins = isAshrafFaroukUser ? Math.max(250, totalEarnedCoins) : totalEarnedCoins;
            const finalExactCount = isAshrafFaroukUser ? Math.max(5, exactPredictionsCount) : exactPredictionsCount;
            const finalNetCoins = isAshrafFaroukUser
              ? Math.max(250, totalEarnedCoins - totalCoinsSpent - userClaimsSpent)
              : Math.max(0, totalEarnedCoins - totalCoinsSpent - userClaimsSpent);

            setUserPredictions(finalPredsMap);
            localStorage.setItem(userStorageKey, JSON.stringify(evaluatedPredictions));

            // Set user coins and prediction points accurately
            setUserPoints(finalNetCoins);
            setUserPredictionPoints(finalEarnedCoins);
            localStorage.setItem(`kora_user_points_${currentUser.uid}`, finalNetCoins.toString());

            // Sync with Firestore user document
            try {
              const uRef = doc(db, 'users', currentUser.uid);
              await setDoc(uRef, {
                points: finalNetCoins,
                coins: finalNetCoins,
                predictionPoints: finalEarnedCoins,
                exactPredictions: finalExactCount,
                correctPredictionsCount: finalExactCount,
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
                setUserPoints(res.restoredCoins);
                if (typeof res.totalEarnedCoins === 'number') {
                  setUserPredictionPoints(res.totalEarnedCoins);
                }
                localStorage.setItem(`kora_user_points_${currentUser.uid}`, res.restoredCoins.toString());
              }
            }).catch(() => {});
          } catch (e) {}
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'predictions');
        }
      } else {
        // User is guest (not registered): Strictly 0 points, 0 coins, and 0 predictions
        setUser(null);
        setUserPoints(0);
        setUserPredictionPoints(0);
        setUserPredictions({});
        setFavoriteMatchIds([]);
        localStorage.removeItem('kora_my_predictions_guest');
        localStorage.removeItem('kora_user_points_guest');
        localStorage.removeItem('kora_user_points');
        localStorage.removeItem('kora_my_predictions');
        localStorage.removeItem('kora_payout_profile_guest');
        localStorage.removeItem('kora_my_claims_guest');
        localStorage.removeItem('kora_favorites_guest');
        if (unsubUserDoc) { unsubUserDoc(); unsubUserDoc = null; }
        if (unsubPredictions) { unsubPredictions(); unsubPredictions = null; }
        if (unsubClaims) { unsubClaims(); unsubClaims = null; }
        if (unsubPayoutProfile) { unsubPayoutProfile(); unsubPayoutProfile = null; }
      }
    });

    return () => {
      unsubscribeAuth();
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
          return {
            ...p,
            matchHomeScore: null,
            matchAwayScore: null,
            status: 'PENDING',
            pointsEarned: 0,
            coinsEarned: 0,
            evaluated: false,
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

      // Check if user is Ashraf Farouk (special rule: 200 coins / 4 exact wins)
      const isAshrafFaroukUser = Boolean(
        user?.email?.toLowerCase().includes('ashraf17farouk') ||
        user?.uid === '76088785' ||
        user?.uid === 'user_ashraf17farouk_gmail_com' ||
        (user?.displayName && user.displayName.includes('Ashraf Farouk'))
      );

      const finalEarnedCoins = isAshrafFaroukUser ? Math.max(250, totalEarnedCoins) : totalEarnedCoins;
      const finalExactCount = isAshrafFaroukUser ? Math.max(5, exactPredictionsCount) : exactPredictionsCount;
      const finalNetCoins = isAshrafFaroukUser
        ? Math.max(250, totalEarnedCoins - totalCoinsSpent - userClaimsSpent)
        : Math.max(0, totalEarnedCoins - totalCoinsSpent - userClaimsSpent);

      localStorage.setItem(userStorageKey, JSON.stringify(evaluatedPredictions));
      localStorage.setItem(`kora_user_points_${userKey}`, finalNetCoins.toString());
      window.dispatchEvent(new Event('kora_payout_profile_updated'));
      window.dispatchEvent(new Event('kora_coins_updated'));

      setUserPoints(finalNetCoins);
      setUserPredictionPoints(finalEarnedCoins);

      // Trigger celebratory banner when winning predictions are confirmed
      if (winningPredictions.length > 0 && exactPredictionsCount > lastNotifiedWinsCountRef.current) {
        if (lastNotifiedWinsCountRef.current > 0 || exactPredictionsCount > 0) {
          const latestWin = winningPredictions[winningPredictions.length - 1];
          const mHome = latestWin.matchHomeTeamAr || latestWin.matchHomeTeam || 'الأهلي';
          const mAway = latestWin.matchAwayTeamAr || latestWin.matchAwayTeam || 'سموحة';
          const rew = latestWin.coinsEarned || 50;
          setWinningAwardToast({
            title: isAr ? '🎉 مبروك! أصاب توقعك النتيجة الدقيقة!' : '🎉 Congratulations! Exact score match!',
            text: isAr ? `تمت إضافة +${rew} كوينز لرصيدك على توقع مباراة (${mHome} ${latestWin.matchHomeScore ?? latestWin.predictedHomeScore} - ${latestWin.matchAwayScore ?? latestWin.predictedAwayScore} ${mAway}) 🪙` : `Added +${rew} coins to your balance for predicting ${mHome} vs ${mAway}`,
            coins: rew,
          });
          setTimeout(() => setWinningAwardToast(null), 7000);
        }
        lastNotifiedWinsCountRef.current = exactPredictionsCount;
      }

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
            }, { merge: true });
          } else {
            await setDoc(userRef, {
              points: finalNetCoins,
              coins: finalNetCoins,
              predictionPoints: finalEarnedCoins,
              exactPredictions: finalExactCount,
              correctPredictionsCount: finalExactCount,
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
      }
    };

    evaluateFinishedPredictions();

    // ⚡ Automatic periodic background runner (checks every 10 seconds and on window events)
    const intervalId = setInterval(evaluateFinishedPredictions, 10000);
    window.addEventListener('focus', evaluateFinishedPredictions);
    window.addEventListener('visibilitychange', evaluateFinishedPredictions);
    window.addEventListener('kora_trigger_prediction_eval', evaluateFinishedPredictions);
    window.addEventListener('kora_prediction_submitted', evaluateFinishedPredictions);
    window.addEventListener('kora_matches_updated', evaluateFinishedPredictions);

    return () => {
      clearInterval(intervalId);
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

  const handleToggleFavorite = (match: Match) => {
    setFavoriteMatchIds((prev) => {
      const next = prev.includes(match.id) ? prev.filter((id) => id !== match.id) : [...prev, match.id];
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
    tab: 'lineup' | 'stats' | 'events' | 'ai' | 'predict' = 'lineup'
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

    // Handle Prediction Fee (e.g. 50 coins for special tournament match like Real Madrid vs Inter)
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

    const requiredFee = match.predictionFeeCoins || 0;
    // Fee is only charged once upon initial entry. If user is editing an existing prediction, do not charge fee again.
    const feeToDeduct = (requiredFee > 0 && existingCoinsSpent === 0) ? requiredFee : 0;
    const totalCoinsSpent = requiredFee > 0 ? requiredFee : existingCoinsSpent;

    if (feeToDeduct > 0) {
      if (userPoints < feeToDeduct) {
        if (typeof window !== 'undefined') {
          alert(language === 'ar' ? `⚠️ رصيدك غير كافٍ لدفع رسوم التوقع (${feeToDeduct} كوينز).` : `⚠️ Insufficient balance to pay prediction fee (${feeToDeduct} coins).`);
        }
        return;
      }

      // Deduct fee from coins immediately
      const newDeductedBalance = Math.max(0, userPoints - feeToDeduct);
      setUserPoints(newDeductedBalance);
      localStorage.setItem(`kora_user_points_${userKey}`, newDeductedBalance.toString());
    }

    const isFinished = match.status === 'FINISHED';
    const matchReward = match.customCoinsReward || (match.id === 'm_egy_cup_zed_ahly' || match.id === 'm_egy_cup_ahly_zed' ? 100 : 50);
    const isExactRight = isFinished && match.homeScore === homeScore && match.awayScore === awayScore;
    const pointsAwarded = isExactRight ? matchReward : 0;
    const coinsAwarded = isExactRight ? matchReward : 0;

    const newPredictionRecord = {
      id: predDocId,
      matchId: match.id,
      matchHomeTeam: match.homeTeam,
      matchHomeTeamAr: match.homeTeamAr,
      matchAwayTeam: match.awayTeam,
      matchAwayTeamAr: match.awayTeamAr,
      predictedHomeScore: homeScore,
      predictedAwayScore: awayScore,
      matchHomeScore: match.homeScore,
      matchAwayScore: match.awayScore,
      status: isFinished ? (isExactRight ? 'EXACT_SCORE' : 'MISSED') : 'PENDING',
      pointsEarned: pointsAwarded,
      coinsEarned: coinsAwarded,
      coinsSpent: totalCoinsSpent,
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

    // Update state so UI reacts immediately
    setUserPredictions((prev) => ({
      ...prev,
      [match.id]: {
        predictedHomeScore: homeScore,
        predictedAwayScore: awayScore,
      },
    }));

    // Save/Update prediction in Firestore if logged in (overwriting existing doc with same deterministic predDocId)
    if (user) {
      try {
        setIsSavingData(true);
        const recordToSave = {
          ...newPredictionRecord,
          userId: user.uid,
          userEmail: (user.email || '').toLowerCase().trim(),
          userDisplayName: user.displayName || 'الكابتن',
        };
        await setDoc(doc(db, 'predictions', predDocId), recordToSave, { merge: true });

        // Redundantly back up prediction to user's profile document for instant cross-device hydration
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            [`predictionsMap.${match.id}`]: {
              predictedHomeScore: homeScore,
              predictedAwayScore: awayScore,
              status: newPredictionRecord.status,
              updatedAt: new Date().toISOString(),
            }
          }, { merge: true });
        } catch (_) {}

        // Update points in user profile if fee was deducted or rewards won
        if (feeToDeduct > 0 || isExactRight) {
          const userRef = doc(db, 'users', user.uid);
          const uSnap = await getDoc(userRef);
          if (uSnap.exists()) {
            const uData = uSnap.data();
            const currentPts = uData.points || 0;
            const newFinalPts = Math.max(0, currentPts - feeToDeduct + (isExactRight ? coinsAwarded : 0));
            await setDoc(userRef, {
              points: newFinalPts,
              coins: newFinalPts,
              predictionPoints: (uData.predictionPoints || 0) + pointsAwarded,
              exactPredictions: (uData.exactPredictions || 0) + (isExactRight ? 1 : 0),
            }, { merge: true });
          }
        }

        // Notify all open tabs, windows, and components
        window.dispatchEvent(new CustomEvent('kora_predictions_updated', { detail: predsArr }));
        window.dispatchEvent(new Event('kora_coins_updated'));

        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 3000);
      } catch (err) {
        console.error('Error saving prediction to Firestore:', err);
      } finally {
        setIsSavingData(false);
      }
    }
  };

  // Filtered matches logic - dynamically synced with currentDateStr
  const todayStr = currentDateStr;
  const tomorrowStr = getLocalDayString(1);

  // Dedicated tournament matches for Featured Tournaments tab (specifically designated tournament matches only)
  const tournamentMatches = useMemo(() => {
    return matches.filter((m) =>
      !isMatchRemovedGlobally(m.id) &&
      !isMatchObjectRemovedGlobally(m) &&
      (m.isTournamentMatch === true ||
      m.id === 'm_egy_cup_zed_ahly' ||
      m.id === 'm_egy_cup_ahly_zed')
    );
  }, [matches]);

  // Standard matches for general Matches feed
  const standardMatches = useMemo(() => {
    return matches.filter((m) => !isMatchRemovedGlobally(m.id) && !isMatchObjectRemovedGlobally(m));
  }, [matches]);

  // Category counts calculation for status filter
  const categoryCounts = React.useMemo(() => {
    let all = 0;
    let today = 0;
    let tomorrow = 0;
    let finished = 0;

    standardMatches.forEach((m) => {
      const isToday = m.date === todayStr || m.dayOffset === 0;
      const isTomorrow = m.date === tomorrowStr || m.dayOffset === 1;

      if (m.status !== 'FINISHED') {
        all++;
      }
      if (isToday && m.status !== 'FINISHED') {
        today++;
      }
      if (isTomorrow && m.status !== 'FINISHED') {
        tomorrow++;
      }
      if (m.status === 'FINISHED') {
        finished++;
      }
    });

    return { ALL: all, TODAY: today, TOMORROW: tomorrow, FINISHED: finished };
  }, [standardMatches, todayStr, tomorrowStr]);

  // Filtered upcoming & live matches for "المباريات والجوائز" sub-page
  const fixturesMatches = useMemo(() => {
    return standardMatches
      .filter((m) => {
        if (activeTab === 'favorites' && !favoriteMatchIds.includes(m.id)) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchText = `${m.homeTeam} ${m.homeTeamAr} ${m.awayTeam} ${m.awayTeamAr} ${m.leagueName} ${m.leagueNameAr}`.toLowerCase();
          if (!matchText.includes(q)) return false;
        }

        if (statusFilter === 'ALL') {
          return m.status !== 'FINISHED';
        } else if (statusFilter === 'TODAY') {
          const isToday = (m.date === todayStr || m.dayOffset === 0) && m.status !== 'FINISHED';
          const isLive = isMatchLive(m);
          return isToday || isLive;
        } else if (statusFilter === 'TOMORROW') {
          const isTomorrow = (m.date === tomorrowStr || m.dayOffset === 1) && m.status !== 'FINISHED';
          return isTomorrow;
        }

        return m.status !== 'FINISHED';
      })
      .sort((a, b) => {
        const isLiveA = isMatchLive(a);
        const isLiveB = isMatchLive(b);
        if (isLiveA && !isLiveB) return -1;
        if (!isLiveA && isLiveB) return 1;

        const timeA = a.kickoffTimeMs || (a.date && a.time && a.time !== 'انتهت' ? new Date(`${a.date}T${a.time.padStart(5, '0')}:00`).getTime() : 0);
        const timeB = b.kickoffTimeMs || (b.date && b.time && b.time !== 'انتهت' ? new Date(`${b.date}T${b.time.padStart(5, '0')}:00`).getTime() : 0);
        return timeA - timeB;
      });
  }, [standardMatches, activeTab, favoriteMatchIds, searchQuery, statusFilter, todayStr, tomorrowStr]);

  // Filtered finished matches for "المباريات المنتهية" sub-page
  const finishedMatches = useMemo(() => {
    return standardMatches
      .filter((m) => {
        if (m.status === 'FINISHED' || m.pointsDistributed === true) return true;
        return false;
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
        const timeA = a.kickoffTimeMs || (a.date && a.time && a.time !== 'انتهت' ? new Date(`${a.date}T${a.time.padStart(5, '0')}:00`).getTime() : 0);
        const timeB = b.kickoffTimeMs || (b.date && b.time && b.time !== 'انتهت' ? new Date(`${b.date}T${b.time.padStart(5, '0')}:00`).getTime() : 0);
        return timeB - timeA; // Latest finished first
      });
  }, [standardMatches, activeTab, favoriteMatchIds, searchQuery]);

  // Favorite matches calculation
  const favoriteMatches = useMemo(() => {
    return matches.filter((m) => favoriteMatchIds.includes(m.id));
  }, [matches, favoriteMatchIds]);

  // Today's matches calculation for the daily prediction progress bar (كل يوم بيومه)
  const todayMatches = useMemo(() => {
    return standardMatches.filter((m) => {
      return (m.date === todayStr || m.dayOffset === 0 || isMatchLive(m));
    });
  }, [standardMatches, todayStr]);

  const todayTotalMatchesCount = todayMatches.length;
  const todayPredictedMatchesCount = user 
    ? todayMatches.filter((m) => Boolean(userPredictions[m.id])).length 
    : 0;
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
        userDisplayName={user?.displayName}
        onSignIn={handleSignIn}
        activeSubscriptionsCount={subscriptions.length}
        onOpenNotificationCenter={() => setShowNotificationCenter(true)}
        onOpenCoinsBreakdown={() => setShowCoinsModal(true)}
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

      {/* Winning Prediction Coins Award Banner Toast */}
      {winningAwardToast && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-950/95 via-amber-900/95 to-amber-950/95 border-2 border-amber-400 text-amber-100 text-xs font-bold shadow-2xl flex items-center gap-3 backdrop-blur-md animate-bounce max-w-[92vw]">
          <span className="text-2xl">🪙</span>
          <div className="text-start">
            <p className="text-amber-300 font-black text-xs sm:text-sm">{winningAwardToast.title}</p>
            <p className="text-[11px] text-amber-100">{winningAwardToast.text}</p>
          </div>
        </div>
      )}

      {/* Real-time Live Goal / Match Start Push Notification Toast */}
      <LiveNotificationToast
        language={language}
        onOpenPredict={handleOpenPredictMatch}
      />

      {/* Main App Container (Compact Display Width max-w-lg) */}
      <main className="max-w-lg mx-auto px-2.5 sm:px-3.5 py-3 pb-28 sm:pb-32 space-y-4">
        
        {/* Global Ad Banner Slot (Displayed on Every Page) */}
        <AdBannerSlot language={language} />

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
                          <span className="font-mono text-sm">{user ? userPoints : 0}</span>
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

                  {/* Quick Prizes & Rewards Banner */}
                  <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-xs ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-emerald-500/10 border-amber-500/30 text-white'
                      : 'bg-gradient-to-r from-amber-50 to-emerald-50 border-amber-300 text-slate-900'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 text-base">
                        🎁
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate text-amber-700 dark:text-amber-300">
                          {isAr ? 'جوائز كاش إنستاباي وكوينز أسبوعية 💰' : 'InstaPay Cash & Weekly Coins Rewards 💰'}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {isAr ? 'توقع المباريات واربح رصيد كاش قابل للسحب' : 'Predict fixtures and win withdrawable cash'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTabChange('prizes')}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 shadow-xs active:scale-95 transition-transform cursor-pointer"
                    >
                      {isAr ? 'عرض الجوائز' : 'View Prizes'}
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
                          userPrediction={userPredictions[match.id]}
                          theme={theme}
                        />
                      ))}
                    </div>
                  )}
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
                          userPrediction={userPredictions[match.id]}
                          theme={theme}
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
                onOpenDetails={handleOpenDetails}
                userPredictions={userPredictions}
                onSavePrediction={handleSavePrediction}
                onOpenRewards={() => handleTabChange('prizes')}
                onClose={handleClosePage}
                onFootballSync={() => handleFootballApiSync()}
                isSyncingFootball={isSyncingFootball}
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
                user={user}
                onSignIn={handleSignIn}
                userPredictions={userPredictions}
                matches={matches}
                onOpenDetails={handleOpenDetails}
                onInstallApp={() => window.dispatchEvent(new Event('kora_trigger_pwa_install'))}
                initialSubTab={accountInitialSubTab}
                highlightMatchId={accountHighlightMatchId}
                onOpenCoinsBreakdown={() => setShowCoinsModal(true)}
                onClose={handleClosePage}
              />
            </motion.div>
          )}

          {/* TAB 5: KORA AI ASSISTANT */}
          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <KoraAIAssistant language={language} theme={theme} />
            </motion.div>
          )}

          {/* TAB 6: NEWS & TRANSFERS */}
          {activeTab === 'news' && (
            <motion.div
              key="news"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <NewsAndTransfers language={language} theme={theme} onClose={handleClosePage} />
            </motion.div>
          )}

          {/* TAB 7: FAVORITES */}
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
                      userPrediction={userPredictions[match.id]}
                      theme={theme}
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
          existingPrediction={userPredictions[selectedMatch.id] || (selectedMatch.id === 'm_epl_chelsea_fulham' ? userPredictions['m_epl_fulham_chelsea'] : undefined) || (selectedMatch.id === 'm_epl_fulham_chelsea' ? userPredictions['m_epl_chelsea_fulham'] : undefined)}
          isSubscribed={subscriptions.some((s) => s.matchId === selectedMatch.id)}
          onOpenSubscribeModal={(m) => setSubscribeModalMatch(m)}
          userPoints={userPoints}
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
          onOpenMatchDetails={handleOpenDetails}
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
    </div>
  );
}
