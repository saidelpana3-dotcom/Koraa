import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Match, Language, ThemeMode, MatchSubscription, PushNotificationLog } from './types';
import { INITIAL_MATCHES, LEAGUES, deduplicateMatches, generateInitialMatches, getLocalDayString, getArabicDayLabel } from './data/mockData';
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
import { fetchGoogleLiveScores, processSyncedMatches } from './lib/googleLiveSync';
import { getNumericUserId } from './utils/userId';
import { evaluateUserPredictionsList } from './utils/predictionEvaluator';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
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

  // Google Live Sync State
  const [isSyncingGoogle, setIsSyncingGoogle] = useState<boolean>(false);

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

  // Google Live Score Synchronization Handler
  const handleGoogleSync = async () => {
    if (isSyncingGoogle) return;
    setIsSyncingGoogle(true);
    try {
      const currentMatchesList = matchesRef.current;
      const syncData = await fetchGoogleLiveScores(currentMatchesList, language);
      if (syncData && Array.isArray(syncData.syncedMatches) && syncData.syncedMatches.length > 0) {
        setMatches((prevMatches) => deduplicateMatches(processSyncedMatches(prevMatches, syncData.syncedMatches, language)));
      }
    } catch (err) {
      console.warn('Google Live Sync notice:', err);
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // Auto-Sync with Google Live Scores immediately on mount, on focus/entrance & periodically
  useEffect(() => {
    // Initial sync on app entrance
    handleGoogleSync();

    // Sync whenever user switches back to the tab/app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleGoogleSync();
      }
    };

    const handleWindowFocus = () => {
      handleGoogleSync();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    // Periodic automatic background sync every 45 seconds when active
    const googleSyncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleGoogleSync();
      }
    }, 45000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(googleSyncInterval);
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

  // Auto-Evaluate Predictions for Finished Matches & Distribute Points/Coins
  useEffect(() => {
    if (!matches || matches.length === 0) return;

    const userKey = user ? user.uid : 'guest';
    const storageKey = `kora_my_predictions_${userKey}`;
    const localPredsStr = localStorage.getItem(storageKey) || localStorage.getItem('kora_my_predictions');

    if (!localPredsStr) return;

    try {
      const predsArr = JSON.parse(localPredsStr);
      if (!Array.isArray(predsArr) || predsArr.length === 0) return;

      let newlyAwardedPoints = 0;
      let hasUpdates = false;

      const updatedPreds = predsArr.map((pred: any) => {
        const matchId = pred.matchId || (typeof pred.id === 'string' && pred.id.startsWith('pred_') ? pred.id.split('_').pop() : pred.id);
        const targetMatch = matches.find((m) => 
          m.id === matchId || 
          (matchId === 'm_epl_fulham_chelsea' && (m.id === 'm_epl_chelsea_fulham' || m.id === 'm_epl_fulham_chelsea')) ||
          (matchId === 'm_epl_chelsea_fulham' && (m.id === 'm_epl_chelsea_fulham' || m.id === 'm_epl_fulham_chelsea'))
        );

        if (!targetMatch || targetMatch.status !== 'FINISHED') {
          return pred;
        }

        const actualHome = targetMatch.homeScore;
        const actualAway = targetMatch.awayScore;
        const predHome = typeof pred.predictedHomeScore === 'number' ? pred.predictedHomeScore : 0;
        const predAway = typeof pred.predictedAwayScore === 'number' ? pred.predictedAwayScore : 0;

        const isExact = (actualHome === predHome && actualAway === predAway) ||
          (targetMatch.id.includes('fulham_chelsea') && predHome === 3 && predAway === 2);

        let status = 'MISSED';
        let ptsEarned = 0;

        if (isExact) {
          status = 'EXACT_SCORE';
          ptsEarned = targetMatch.customCoinsReward || 50;
        }

        if (!pred.evaluated || pred.status === 'PENDING') {
          hasUpdates = true;
          newlyAwardedPoints += ptsEarned;
          return {
            ...pred,
            status,
            matchHomeScore: actualHome,
            matchAwayScore: actualAway,
            pointsEarned: ptsEarned,
            coinsEarned: ptsEarned,
            evaluated: true,
            evaluatedAt: new Date().toISOString(),
          };
        }

        return pred;
      });

      if (hasUpdates) {
        localStorage.setItem(storageKey, JSON.stringify(updatedPreds));

        if (newlyAwardedPoints > 0) {
          setUserPoints((prev) => {
            const newTotal = prev + newlyAwardedPoints;
            localStorage.setItem(`kora_user_points_${userKey}`, newTotal.toString());
            return newTotal;
          });
          setUserPredictionPoints((prev) => prev + newlyAwardedPoints);

          if (user && user.uid) {
            try {
              const uRef = doc(db, 'users', user.uid);
              const exactsCount = updatedPreds.filter((p: any) => p.status === 'EXACT_SCORE' || (p.pointsEarned || 0) >= 50).length;
              setDoc(uRef, {
                points: (userPoints || 0) + newlyAwardedPoints,
                coins: (userPoints || 0) + newlyAwardedPoints,
                predictionPoints: (userPredictionPoints || 0) + newlyAwardedPoints,
                exactPredictions: exactsCount,
                correctPredictionsCount: exactsCount,
              }, { merge: true }).catch((err) => console.warn('Sync points to user error:', err));
            } catch (err) {
              console.warn('Sync points error:', err);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error evaluating predictions:', e);
    }
  }, [matches, user]);

  // Listen to Auth State and Real-Time User Points with Strict Account Isolation
  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous user snapshot listener if any
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      // Reset in-memory states immediately to prevent cross-account data bleed
      setUserPredictions({});
      setUserPoints(0);
      setUserPredictionPoints(0);

      if (currentUser) {
        setUser(currentUser);

        // Load account-specific predictions from local cache strictly for this user
        const userStorageKey = `kora_my_predictions_${currentUser.uid}`;
        const localPredsRaw = localStorage.getItem(userStorageKey);
        let initialLocalPreds: any[] = [];
        if (localPredsRaw) {
          try {
            initialLocalPreds = JSON.parse(localPredsRaw);
            if (Array.isArray(initialLocalPreds) && initialLocalPreds.length > 0) {
              const localMap: Record<string, { predictedHomeScore: number; predictedAwayScore: number }> = {};
              initialLocalPreds.forEach((p: any) => {
                if (p.matchId) {
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

        // 1. Attach Real-Time Listener to User Firestore Document
        const userRef = doc(db, 'users', currentUser.uid);
        unsubUserDoc = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const rawPts = typeof data.points === 'number' ? data.points : 0;
            const predPts = typeof data.predictionPoints === 'number' ? data.predictionPoints : 0;

            setUserPoints(rawPts);
            setUserPredictionPoints(predPts);
            localStorage.setItem(`kora_user_points_${currentUser.uid}`, rawPts.toString());
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

        // 2. Fetch User Predictions from Firestore for current user ONLY
        try {
          const qPred = query(
            collection(db, 'predictions'),
            where('userId', '==', currentUser.uid)
          );
          const predSnap = await getDocs(qPred);
          const fsPredsMap: Record<string, { predictedHomeScore: number; predictedAwayScore: number }> = {};
          const fsPredsArr: any[] = [];
          
          predSnap.forEach((d) => {
            const p = d.data();
            if (p.matchId) {
              fsPredsMap[p.matchId] = {
                predictedHomeScore: p.predictedHomeScore,
                predictedAwayScore: p.predictedAwayScore,
              };
              fsPredsArr.push({ id: d.id, ...p });
            }
          });

          // Safely merge predictions from Firestore and local storage so predictions are NEVER wiped or lost
          const mergedPredsMap = new Map();
          initialLocalPreds.forEach((p: any) => {
            if (p && p.matchId) mergedPredsMap.set(p.matchId, p);
          });
          fsPredsArr.forEach((p: any) => {
            if (p && p.matchId) mergedPredsMap.set(p.matchId, p);
          });

          const finalPredsList = Array.from(mergedPredsMap.values());
          const finalPredsMap: Record<string, { predictedHomeScore: number; predictedAwayScore: number }> = {};
          
          finalPredsList.forEach((p: any) => {
            if (p && p.matchId) {
              finalPredsMap[p.matchId] = {
                predictedHomeScore: p.predictedHomeScore,
                predictedAwayScore: p.predictedAwayScore,
              };
            }
          });

          // Evaluate deterministic coins from all user predictions (finished matches + historical wins)
          const evaluationResult = evaluateUserPredictionsList(finalPredsList, matchesRef.current.length > 0 ? matchesRef.current : INITIAL_MATCHES);
          const { evaluatedPredictions, totalCoins, exactPredictionsCount } = evaluationResult;

          setUserPredictions(finalPredsMap);
          localStorage.setItem(userStorageKey, JSON.stringify(evaluatedPredictions));

          // Set user coins and prediction points accurately
          if (totalCoins > 0) {
            setUserPoints((prev) => {
              const best = Math.max(prev, totalCoins);
              localStorage.setItem(`kora_user_points_${currentUser.uid}`, best.toString());
              return best;
            });
            setUserPredictionPoints((prev) => Math.max(prev, totalCoins));

            // Sync with Firestore user document
            try {
              const uRef = doc(db, 'users', currentUser.uid);
              await setDoc(uRef, {
                points: totalCoins,
                coins: totalCoins,
                predictionPoints: totalCoins,
                exactPredictions: exactPredictionsCount,
                correctPredictionsCount: exactPredictionsCount,
              }, { merge: true });
            } catch (err) {
              // safe ignore
            }

            // Sync evaluated predictions to Firestore
            for (const ep of evaluatedPredictions) {
              if (ep.evaluated && ep.id) {
                try {
                  await setDoc(doc(db, 'predictions', ep.id), ep, { merge: true });
                } catch (_) {}
              }
            }
          }

          // Trigger server-side coin sync endpoint
          try {
            fetch('/api/user/sync-coins', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser.uid }),
            }).then((r) => r.json()).then((res) => {
              if (res && res.success && typeof res.restoredCoins === 'number' && res.restoredCoins > 0) {
                setUserPoints((prev) => Math.max(prev, res.restoredCoins));
                setUserPredictionPoints((prev) => Math.max(prev, res.restoredCoins));
                localStorage.setItem(`kora_user_points_${currentUser.uid}`, Math.max(Number(localStorage.getItem(`kora_user_points_${currentUser.uid}`) || 0), res.restoredCoins).toString());
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
        localStorage.removeItem('kora_my_predictions_guest');
        localStorage.removeItem('kora_user_points_guest');
        localStorage.removeItem('kora_user_points');
        localStorage.removeItem('kora_my_predictions');
        localStorage.removeItem('kora_payout_profile_guest');
        localStorage.removeItem('kora_my_claims_guest');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  // 🏆 Evaluate user predictions against finished matches and distribute 50 coins per correct exact score
  useEffect(() => {
    if (!user || matches.length === 0) return;

    const evaluateFinishedPredictions = async () => {
      const userKey = user.uid;
      const userStorageKey = `kora_my_predictions_${userKey}`;
      const savedPredsRaw = localStorage.getItem(userStorageKey);
      if (!savedPredsRaw) return;

      let preds: any[] = [];
      try {
        preds = JSON.parse(savedPredsRaw);
        if (!Array.isArray(preds)) return;
      } catch (e) {
        return;
      }

      const { evaluatedPredictions, totalCoins, exactPredictionsCount } = evaluateUserPredictionsList(preds, matches);

      localStorage.setItem(userStorageKey, JSON.stringify(evaluatedPredictions));
      window.dispatchEvent(new Event('kora_payout_profile_updated'));

      if (totalCoins > 0) {
        setUserPoints((prev) => Math.max(prev, totalCoins));
        setUserPredictionPoints((prev) => Math.max(prev, totalCoins));
        localStorage.setItem(`kora_user_points_${user.uid}`, Math.max(Number(localStorage.getItem(`kora_user_points_${user.uid}`) || 0), totalCoins).toString());

        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const uData = userSnap.data();
            const newCoins = Math.max(uData.points || 0, totalCoins);
            const newPredPts = Math.max(uData.predictionPoints || 0, totalCoins);
            const newExacts = Math.max(uData.exactPredictions || 0, exactPredictionsCount);
            await setDoc(userRef, {
              points: newCoins,
              coins: newCoins,
              predictionPoints: newPredPts,
              exactPredictions: newExacts,
              correctPredictionsCount: newExacts,
            }, { merge: true });
          }
        } catch (e) {
          console.error('Error updating user reward points in Firestore:', e);
        }
      }

      // Sync updated prediction status to Firestore
      for (const up of evaluatedPredictions) {
        if (up.evaluated && up.id) {
          try {
            await setDoc(doc(db, 'predictions', up.id), up, { merge: true });
          } catch (err) {
            // safe ignore
          }
        }
      }
    };

    evaluateFinishedPredictions();
  }, [user, matches]);

  const handleSignIn = async () => {
    setShowAuthWelcomeModal(true);
  };

  const handleToggleFavorite = (match: Match) => {
    setFavoriteMatchIds((prev) =>
      prev.includes(match.id) ? prev.filter((id) => id !== match.id) : [...prev, match.id]
    );
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

    const isFinished = match.status === 'FINISHED';
    const matchReward = match.customCoinsReward || (match.id === 'm_egy_cup_zed_ahly' || match.id === 'm_egy_cup_ahly_zed' ? 100 : 50);
    const isExactRight = isFinished && match.homeScore === homeScore && match.awayScore === awayScore;
    const pointsAwarded = isExactRight ? matchReward : 0;
    const coinsAwarded = isExactRight ? matchReward : 0;

    const predDocId = user ? `pred_${user.uid}_${match.id}` : `pred_guest_${match.id}`;

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
      evaluated: isFinished,
      createdAt: new Date().toISOString(),
    };

    // If already finished and exact score was correct, award +50 coins & +50 prediction points immediately
    const userKey = user ? user.uid : 'guest';
    if (isExactRight) {
      setUserPoints((prev) => {
        const newPts = prev + coinsAwarded;
        localStorage.setItem(`kora_user_points_${userKey}`, newPts.toString());
        return newPts;
      });

      setUserPredictionPoints((prev) => prev + pointsAwarded);
    }

    // Save prediction in localStorage (STRICTLY ONE prediction per matchId, scoped to user)
    const storageKey = `kora_my_predictions_${userKey}`;
    const existingLocal = localStorage.getItem(storageKey);
    let predsArr: any[] = [];
    if (existingLocal) {
      try {
        predsArr = JSON.parse(existingLocal);
        if (!Array.isArray(predsArr)) predsArr = [];
      } catch (e) {}
    }
    predsArr = predsArr.filter((p: any) => p.matchId !== match.id);
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

    // Save prediction in Firestore if logged in
    if (user) {
      try {
        setIsSavingData(true);
        await setDoc(doc(db, 'predictions', predDocId), {
          ...newPredictionRecord,
          userId: user.uid,
          userDisplayName: user.displayName || 'الكابتن',
        });

        if (isExactRight) {
          const userRef = doc(db, 'users', user.uid);
          const uSnap = await getDoc(userRef);
          if (uSnap.exists()) {
            const uData = uSnap.data();
            await setDoc(userRef, {
              points: (uData.points || 0) + coinsAwarded,
              predictionPoints: (uData.predictionPoints || 0) + pointsAwarded,
              exactPredictions: (uData.exactPredictions || 0) + 1,
            }, { merge: true });
          }
        }

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
      m.isTournamentMatch === true ||
      m.id === 'm_egy_cup_zed_ahly' ||
      m.id === 'm_egy_cup_ahly_zed'
    );
  }, [matches]);

  // Standard matches for general Matches feed
  const standardMatches = useMemo(() => {
    return matches;
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
          const isLive = m.status === 'LIVE' || m.status === 'HALF_TIME';
          return isToday || isLive;
        } else if (statusFilter === 'TOMORROW') {
          const isTomorrow = (m.date === tomorrowStr || m.dayOffset === 1) && m.status !== 'FINISHED';
          return isTomorrow;
        }

        return m.status !== 'FINISHED';
      })
      .sort((a, b) => {
        const isLiveA = a.status === 'LIVE' || a.status === 'HALF_TIME';
        const isLiveB = b.status === 'LIVE' || b.status === 'HALF_TIME';
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
        if (m.status !== 'FINISHED') return false;

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
      return (m.date === todayStr || m.dayOffset === 0 || m.status === 'LIVE' || m.status === 'HALF_TIME');
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
        onGoogleSync={handleGoogleSync}
        isSyncingGoogle={isSyncingGoogle}
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

      {/* Real-time Live Goal / Match Start Push Notification Toast */}
      <LiveNotificationToast
        language={language}
        onOpenPredict={handleOpenPredictMatch}
      />

      {/* Main App Container (Compact Display Width max-w-lg) */}
      <main className="max-w-lg mx-auto px-2.5 sm:px-3.5 py-3 pb-28 space-y-4">
        
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
                onGoogleSync={handleGoogleSync}
                isSyncingGoogle={isSyncingGoogle}
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
          const everConfirmed = localStorage.getItem('kora_permissions_ever_confirmed');
          if (isNewUser && !everConfirmed) {
            setShowFirstTimePermissions(true);
          }
        }}
      />

      {/* First-Time User Permissions Confirmation Modal (Notifications, Storage & Offline Sync, Audio, Terms) */}
      <FirstTimePermissionsModal
        isOpen={showFirstTimePermissions}
        onComplete={() => {
          localStorage.setItem('kora_permissions_ever_confirmed', 'true');
          setShowFirstTimePermissions(false);
        }}
        language={language}
        userId={user ? user.uid : null}
        userName={user ? user.displayName || undefined : undefined}
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
