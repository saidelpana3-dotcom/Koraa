import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  setLogLevel,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from "firebase/firestore";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Server-Side Firebase Firestore
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const rawConfig = fs.readFileSync(configPath, "utf-8");
    const firebaseConfig = JSON.parse(rawConfig);
    const serverApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(serverApp, firebaseConfig.firestoreDatabaseId);
    try {
      setLogLevel('silent');
    } catch (_) {}
    console.log("Server Firestore initialized successfully!");
  }
} catch (e) {
  console.error("Failed to initialize Server Firestore:", e);
}

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// In-memory cache for Google Live Sync to optimize server performance and reduce API latency
const liveSyncCache: Record<string, { data: any; timestamp: number }> = {};
const eventsSyncCache: Record<string, { data: any; sources: any[]; timestamp: number }> = {};
const lineupsSyncCache: Record<string, { data: any; sources: any[]; timestamp: number }> = {};
let lastGlobalSyncCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 90000; // 90 seconds cache TTL
let geminiQuotaCooldownUntil = 0; // Cooldown timestamp when 429 quota is reached
let firestoreQuotaExceededUntil = 0; // Cooldown timestamp when Firestore free quota is exceeded
const evaluatedMatchesMemoryCache = new Set<string>(); // Cache of matchId_homeScore_awayScore to avoid duplicate Firestore queries

// Helper to check if error is a Firestore quota limit error
function isFirestoreQuotaError(err: any): boolean {
  const msg = (err?.message || String(err || '')).toLowerCase();
  return msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('resource exhausted') || msg.includes('free daily read units');
}

// Google & Ad Network Site Verification Endpoints
app.get("/google6645977368ee1987.html", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send("google-site-verification: google6645977368ee1987.html");
});

app.get("/googleee7cdccfe0a37629.html", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send("google-site-verification: googleee7cdccfe0a37629.html");
});

app.get(["/37936a22c08ac8e371cf", "/37936a22c08ac8e371cf.html", "/37936a22c08ac8e371cf.txt"], (_req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send("37936a22c08ac8e371cf");
});

app.get(["/0b75cf0a65b1651e5cd537936a22c08ac8e371cf", "/0b75cf0a65b1651e5cd537936a22c08ac8e371cf.html", "/0b75cf0a65b1651e5cd537936a22c08ac8e371cf.txt"], (_req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send("0b75cf0a65b1651e5cd537936a22c08ac8e371cf");
});

// Service Worker endpoints for Ad Networks and PWA Push Notifications
app.get(["/service-worker.js", "/sw.js"], (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Service-Worker-Allowed", "/");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  const fileName = req.path.includes("service-worker") ? "service-worker.js" : "sw.js";
  res.sendFile(path.join(process.cwd(), "public", fileName));
});

// API Health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Kora Football Hub Server Engine" });
});

// =========================================================================
// Match Prediction Evaluation Engine (+50 Points for Exact Score, +20 for Correct Outcome)
// =========================================================================
async function evaluateFinishedMatchesOnServer(
  finishedMatches: Array<{ id: string; homeScore: number; awayScore: number; homeTeamAr?: string; awayTeamAr?: string }>,
  forceReevaluate = false
) {
  if (!db || !Array.isArray(finishedMatches) || finishedMatches.length === 0) return [];
  if (Date.now() < firestoreQuotaExceededUntil) {
    // Firestore quota is in cooldown, return gracefully
    return [];
  }

  const results: any[] = [];

  for (const match of finishedMatches) {
    try {
      const matchId = match.id;
      const actualHome = Number(match.homeScore);
      const actualAway = Number(match.awayScore);

      if (isNaN(actualHome) || isNaN(actualAway)) continue;

      const evalCacheKey = `${matchId}_${actualHome}_${actualAway}`;
      if (!forceReevaluate && evaluatedMatchesMemoryCache.has(evalCacheKey)) {
        // Match already evaluated with this exact scoreline, skip redundant Firestore reads
        continue;
      }

      const actualWinner = actualHome > actualAway ? 'HOME' : actualAway > actualHome ? 'AWAY' : 'DRAW';

      // Query predictions for this matchId
      const q = query(collection(db, "predictions"), where("matchId", "==", matchId));
      const snapshot = await getDocs(q);

      for (const predDoc of snapshot.docs) {
        const p = predDoc.data();
        
        // If evaluated and not forcing re-evaluation, skip
        if (!forceReevaluate && p.evaluated && p.status !== "PENDING") continue;

        const predHome = Number(p.predictedHomeScore);
        const predAway = Number(p.predictedAwayScore);
        const predWinner = predHome > predAway ? 'HOME' : predAway > predHome ? 'AWAY' : 'DRAW';

        const isExactMatch = predHome === actualHome && predAway === actualAway;
        const isCorrectOutcome = !isExactMatch && (predWinner === actualWinner);

        let pointsAwarded = 0;
        let coinsAwarded = 0;
        let newStatus = "MISSED";

        if (isExactMatch) {
          pointsAwarded = 50;
          coinsAwarded = 50;
          newStatus = "EXACT_SCORE";
        } else {
          pointsAwarded = 0;
          coinsAwarded = 0;
          newStatus = isCorrectOutcome ? "CORRECT_OUTCOME" : "MISSED";
        }

        // Update prediction document
        await updateDoc(doc(db, "predictions", predDoc.id), {
          status: newStatus,
          pointsEarned: pointsAwarded,
          coinsEarned: coinsAwarded,
          matchHomeScore: actualHome,
          matchAwayScore: actualAway,
          evaluated: true,
          evaluatedAt: new Date().toISOString(),
        });

        if (p.userId) {
          const userRef = doc(db, "users", p.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            
            // Recalculate total coins directly across all user predictions to prevent any drift or duplication
            let totalExactWins = 0;
            let totalCoinsFromPredictions = 0;

            try {
              const allUserPredsSnap = await getDocs(query(collection(db, "predictions"), where("userId", "==", p.userId)));
              allUserPredsSnap.forEach((ds) => {
                const predData = ds.data();
                const mKey = predData.matchId;
                const mCatalog = MASTER_FINISHED_MATCHES_MAP[mKey];
                const ph = Number(predData.predictedHomeScore);
                const pa = Number(predData.predictedAwayScore);
                const isExact = (mCatalog && ph === mCatalog.homeScore && pa === mCatalog.awayScore) ||
                  predData.status === "EXACT_SCORE" || (typeof predData.coinsEarned === "number" && predData.coinsEarned >= 50);
                if (isExact) {
                  const rew = mCatalog?.customReward || (typeof predData.coinsEarned === "number" && predData.coinsEarned > 0 ? predData.coinsEarned : 50);
                  totalCoinsFromPredictions += rew;
                  totalExactWins += 1;
                }
              });
            } catch (calcErr) {
              totalCoinsFromPredictions = Math.max(userData.points || 0, pointsAwarded);
              totalExactWins = isExactMatch ? ((userData.exactPredictions || 0) + 1) : (userData.exactPredictions || 0);
            }

            const updatedPts = Math.max(userData.points || 0, totalCoinsFromPredictions);
            const updatedPredPts = Math.max(userData.predictionPoints || 0, totalCoinsFromPredictions);
            const updatedCoins = Math.max(userData.coins || 0, totalCoinsFromPredictions);

            await updateDoc(userRef, {
              points: updatedPts,
              predictionPoints: updatedPredPts,
              coins: updatedCoins,
              exactPredictions: Math.max(userData.exactPredictions || 0, totalExactWins),
              lastWinAt: pointsAwarded > 0 ? new Date().toISOString() : userData.lastWinAt || null,
            });

            // Send notification if coins were newly awarded
            if (pointsAwarded > 0) {
              const msgBody = isExactMatch
                ? `تهانينا! أصاب توقعك النتيجة الدقيقة لمباراة (${p.matchHomeTeamAr || p.matchHomeTeam || 'المباراة'}) بنتيجة ${actualHome}-${actualAway}! تم إضافة 50 كوينز لمحفظتك بنجاح! 🪙🎉`
                : `تهانينا! أصاب توقعك الصحيح للمباراة! تم إضافة الكوينز لحسابك! 👏`;

              await addDoc(collection(db, "notifications"), {
                userId: p.userId,
                title: isExactMatch ? "توقع ممتاز بالنتيجة! 🎯 (+50 كوينز 🪙)" : "توقع صحيح! ⚽",
                titleAr: isExactMatch ? "توقع ممتاز بالنتيجة! 🎯 (+50 كوينز 🪙)" : "توقع صحيح! ⚽",
                body: msgBody,
                bodyAr: msgBody,
                type: "GOAL",
                createdAt: new Date().toISOString(),
                read: false,
              });
            }
          }
        }

        results.push({
          predictionId: predDoc.id,
          userId: p.userId,
          userName: p.userName || p.userDisplayName || "مستخدم",
          predictedScore: `${predHome} - ${predAway}`,
          actualScore: `${actualHome} - ${actualAway}`,
          status: newStatus,
          pointsEarned: pointsAwarded,
        });
      }

      // Mark this match evaluation in memory as completed
      evaluatedMatchesMemoryCache.add(evalCacheKey);
    } catch (err: any) {
      if (isFirestoreQuotaError(err)) {
        firestoreQuotaExceededUntil = Date.now() + 300000; // 5 minute cooldown
        console.warn("Firestore daily free quota limit reached during match evaluation. Cooling down for 5 minutes.");
        break;
      } else {
        console.warn(`Evaluation notice for match ${match.id}:`, err?.message || err);
      }
    }
  }

  return results;
}

// Endpoint to update a match result in Firestore and award points to all user predictions
app.post(["/api/matches/update-result", "/api/admin/evaluate-match"], async (req, res) => {
  const { matchId, homeScore, awayScore, homeTeamAr, awayTeamAr, status, isFinished } = req.body || {};
  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return res.status(400).json({ success: false, error: "Missing parameters (matchId, homeScore, awayScore)" });
  }
  try {
    const finalStatus = status || (isFinished !== false ? "FINISHED" : "LIVE");
    const finalIsFinished = finalStatus === "FINISHED" || isFinished === true;

    // 1. Update Match Document in Firestore
    if (db) {
      try {
        await setDoc(doc(db, "matches", String(matchId)), {
          id: String(matchId),
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
          status: finalStatus,
          isFinished: finalIsFinished,
          time: finalIsFinished ? "انتهت" : "",
          minute: finalIsFinished ? "انتهت" : "",
          homeTeamAr: homeTeamAr || "",
          awayTeamAr: awayTeamAr || "",
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (dbErr) {
        console.warn("Firestore match setDoc warning:", dbErr);
      }
    }

    // 2. Evaluate all predictions on server
    const evalResults = await evaluateFinishedMatchesOnServer([{
      id: String(matchId),
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      homeTeamAr,
      awayTeamAr,
    }], true);

    return res.json({ 
      success: true, 
      message: `Match ${matchId} updated and broadcast to all users! Score: ${homeScore}-${awayScore}.`, 
      evalResults 
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message });
  }
});

// Endpoint to force evaluate and distribute coins for ALL finished matches to all predictions
app.all(["/api/admin/distribute-all-coins", "/api/matches/distribute-all-coins"], async (req, res) => {
  try {
    const finishedMatchesArray = Object.entries(MASTER_FINISHED_MATCHES_MAP).map(([id, data]) => ({
      id,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
    }));
    const evalResults = await evaluateFinishedMatchesOnServer(finishedMatchesArray, true);
    return res.json({
      success: true,
      message: `تم تقييم جميع المباريات المنتهية بنجاح وتوزيع الكوينز على جميع التوقعات الصحيحة!`,
      evaluatedMatchesCount: finishedMatchesArray.length,
      evaluatedPredictionsCount: evalResults.length,
      evalResults,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message });
  }
});

// Cached leaderboard standings
let cachedLeaderboard: any[] = [];

// Master Catalog of all known finished matches with exact scorelines and coins rewards
const MASTER_FINISHED_MATCHES_MAP: Record<string, { homeScore: number; awayScore: number; customReward?: number }> = {
  // Premier League
  m_epl_palace_mancity: { homeScore: 1, awayScore: 4, customReward: 50 },
  m_epl_mancity_palace: { homeScore: 4, awayScore: 1, customReward: 50 },
  m_epl_fulham_chelsea: { homeScore: 3, awayScore: 2, customReward: 50 },
  m_epl_chelsea_fulham: { homeScore: 3, awayScore: 2, customReward: 50 },
  m_fri_coventry_arsenal: { homeScore: 0, awayScore: 3, customReward: 50 },
  m_epl_newcastle_mancity: { homeScore: 1, awayScore: 3, customReward: 50 },
  m_epl_tottenham_arsenal: { homeScore: 1, awayScore: 2, customReward: 50 },
  m_epl_liverpool_wolves: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_epl_everton_astonvilla: { homeScore: 0, awayScore: 1, customReward: 50 },
  // Egyptian League & Cup
  m_egy_cup_enppi_degla: { homeScore: 1, awayScore: 3, customReward: 50 },
  m_egy_cup_degla_enppi: { homeScore: 3, awayScore: 1, customReward: 50 },
  m_egy_cup_qanah_gouna: { homeScore: 1, awayScore: 1, customReward: 50 },
  m_egy_cup_gouna_qanah: { homeScore: 1, awayScore: 1, customReward: 50 },
  m_egy_cup_pyramids_aboqir: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_egy_cup_mokawloon_masry: { homeScore: 2, awayScore: 3, customReward: 50 },
  m_egy_cup_future_mahalla: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_egy_gouna_future: { homeScore: 1, awayScore: 1, customReward: 50 },
  m_egy_ahly_enppi: { homeScore: 3, awayScore: 2, customReward: 50 },
  m_egy_cup_smouha_petrol: { homeScore: 0, awayScore: 0, customReward: 50 },
  m_egy_cup_bank_zamalek: { homeScore: 0, awayScore: 3, customReward: 50 },
  m_egy_cup_petrojet_gaish: { homeScore: 2, awayScore: 3, customReward: 50 },
  m_egy_cup_zed_ahly: { homeScore: 0, awayScore: 2, customReward: 100 },
  m_egy_cup_ahly_zed: { homeScore: 2, awayScore: 0, customReward: 100 },
  m_egy_cup_ittihad_ceramica: { homeScore: 1, awayScore: 3, customReward: 50 },
  m_egy_cup_ceramica_ittihad: { homeScore: 3, awayScore: 1, customReward: 50 },
  m_sat_talaea_mokawloon: { homeScore: 1, awayScore: 0, customReward: 50 },
  m_sat_mahalla_pyramids: { homeScore: 0, awayScore: 3, customReward: 50 },
  m_sat_masry_smouha: { homeScore: 1, awayScore: 0, customReward: 50 },
  m_egy_zamalek_pyramids: { homeScore: 1, awayScore: 1, customReward: 50 },
  // La Liga
  m_laliga_alaves_villarreal: { homeScore: 1, awayScore: 0, customReward: 50 },
  m_laliga_villarreal_alaves: { homeScore: 0, awayScore: 1, customReward: 50 },
  m_laliga_racing_elche: { homeScore: 3, awayScore: 2, customReward: 50 },
  m_laliga_elche_racing: { homeScore: 2, awayScore: 3, customReward: 50 },
  m_laliga_celta_osasuna: { homeScore: 1, awayScore: 2, customReward: 50 },
  m_laliga_osasuna_celta: { homeScore: 2, awayScore: 1, customReward: 50 },
  m_laliga_barcelona_bilbao: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_laliga_bilbao_barcelona: { homeScore: 0, awayScore: 2, customReward: 50 },
  m_laliga_valencia_betis: { homeScore: 0, awayScore: 1, customReward: 50 },
  m_laliga_real_sociedad: { homeScore: 4, awayScore: 1, customReward: 50 },
  m_laliga_atletico_villarreal: { homeScore: 2, awayScore: 2, customReward: 50 },
  m_laliga_elche_barcelona: { homeScore: 0, awayScore: 5, customReward: 50 },
  m_wed_barcelona_alahly: { homeScore: 2, awayScore: 1, customReward: 50 },
  m_wed_malaga_atletico: { homeScore: 0, awayScore: 2, customReward: 50 },
  m_fri_betis_sociedad: { homeScore: 1, awayScore: 0, customReward: 50 },
  m_sat_athletic_sevilla: { homeScore: 1, awayScore: 3, customReward: 50 },
  m_sat_valencia_celta: { homeScore: 0, awayScore: 0, customReward: 50 },
  m_sat_espanyol_realmadrid: { homeScore: 1, awayScore: 2, customReward: 50 },
  m_laliga_realmadrid_barcelona: { homeScore: 2, awayScore: 1, customReward: 50 },
  // Ligue 1
  m_ligue1_lille_psg: { homeScore: 2, awayScore: 2, customReward: 50 },
  m_ligue1_psg_lille: { homeScore: 2, awayScore: 2, customReward: 50 },
  m_ligue1_lille_angers: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_ligue1_rennes_psg: { homeScore: 2, awayScore: 2, customReward: 50 },
  // Champions League & Other Tournaments
  m_ucl_psg_bayern: { homeScore: 2, awayScore: 2, customReward: 50 },
  m_afcon_egypt_senegal: { homeScore: 1, awayScore: 0, customReward: 50 },
};

// Endpoint to restore and sync user coins directly from their predictions in Firestore
app.post("/api/user/sync-coins", async (req, res) => {
  const { userId } = req.body || {};
  if (!userId || !db) {
    return res.status(400).json({ success: false, error: "Missing userId or database" });
  }

  try {
    const q = query(collection(db, "predictions"), where("userId", "==", userId));
    const predsSnap = await getDocs(q);

    let calculatedCoins = 0;
    let exactCount = 0;
    let totalCount = 0;

    for (const docSnap of predsSnap.docs) {
      const p = docSnap.data();
      totalCount++;
      const matchKey = p.matchId;
      const targetMatch = MASTER_FINISHED_MATCHES_MAP[matchKey] || 
        (matchKey === 'm_epl_fulham_chelsea' ? MASTER_FINISHED_MATCHES_MAP['m_epl_chelsea_fulham'] : null);

      const predHome = Number(p.predictedHomeScore);
      const predAway = Number(p.predictedAwayScore);
      const isExactByScore = targetMatch && predHome === targetMatch.homeScore && predAway === targetMatch.awayScore;
      const isExactByStatus = p.status === "EXACT_SCORE" || (typeof p.coinsEarned === "number" && p.coinsEarned >= 50);

      if (isExactByScore || isExactByStatus) {
        const reward = targetMatch?.customReward || (typeof p.coinsEarned === "number" && p.coinsEarned > 0 ? p.coinsEarned : 50);
        calculatedCoins += reward;
        exactCount++;

        // Ensure prediction doc has EXACT_SCORE and coinsEarned
        if (p.status !== "EXACT_SCORE" || !p.coinsEarned) {
          try {
            await updateDoc(doc(db, "predictions", docSnap.id), {
              status: "EXACT_SCORE",
              coinsEarned: reward,
              pointsEarned: reward,
              evaluated: true,
              evaluatedAt: new Date().toISOString(),
              matchHomeScore: targetMatch ? targetMatch.homeScore : predHome,
              matchAwayScore: targetMatch ? targetMatch.awayScore : predAway,
            });
          } catch (_) {}
        }
      }
    }

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const uData = userSnap.data();
      const currentCoins = typeof uData.coins === "number" ? uData.coins : (typeof uData.points === "number" ? uData.points : 0);
      const finalCoins = Math.max(currentCoins, calculatedCoins);

      await updateDoc(userRef, {
        coins: finalCoins,
        points: finalCoins,
        predictionPoints: finalCoins,
        exactPredictions: Math.max(uData.exactPredictions || 0, exactCount),
        updatedAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        userId,
        restoredCoins: finalCoins,
        exactPredictions: exactCount,
        totalPredictions: totalCount,
      });
    }

    return res.json({ success: true, userId, restoredCoins: calculatedCoins });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message });
  }
});

// Endpoint to recalculate full user leaderboard standings from all evaluated predictions and restore coins
app.all("/api/admin/recalculate-standings", async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, error: "Database not initialized" });
  }

  if (Date.now() < firestoreQuotaExceededUntil && cachedLeaderboard.length > 0) {
    return res.json({
      success: true,
      message: "تم استرجاع ترتيب التوقعات من الذاكرة المؤقتة (حماية الحصة اليومية).",
      totalUsersEvaluated: cachedLeaderboard.length,
      leaderboard: cachedLeaderboard,
    });
  }

  try {
    // 1. Run evaluation engine for all finished matches in the master catalog
    const finishedMatchesArray = Object.entries(MASTER_FINISHED_MATCHES_MAP).map(([id, data]) => ({
      id,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
    }));
    await evaluateFinishedMatchesOnServer(finishedMatchesArray, false);

    // 2. Fetch all predictions from Firestore
    const predsSnap = await getDocs(collection(db, "predictions"));
    
    // Aggregate points & earned coins per user
    const userAggregates: Record<string, {
      userId: string;
      userName: string;
      totalPoints: number;
      totalCoins: number;
      exactCount: number;
      correctOutcomeCount: number;
      totalPredictions: number;
      predictionsList: any[];
    }> = {};

    predsSnap.forEach((docSnap) => {
      const p = docSnap.data();
      if (!p.userId) return;

      if (!userAggregates[p.userId]) {
        userAggregates[p.userId] = {
          userId: p.userId,
          userName: p.userName || p.userDisplayName || "مستخدم Kora",
          totalPoints: 0,
          totalCoins: 0,
          exactCount: 0,
          correctOutcomeCount: 0,
          totalPredictions: 0,
          predictionsList: [],
        };
      }

      const userAgg = userAggregates[p.userId];
      userAgg.totalPredictions += 1;

      const targetMatch = MASTER_FINISHED_MATCHES_MAP[p.matchId] || 
        (p.matchId === 'm_epl_fulham_chelsea' ? MASTER_FINISHED_MATCHES_MAP['m_epl_chelsea_fulham'] : null);
      
      const predHome = Number(p.predictedHomeScore);
      const predAway = Number(p.predictedAwayScore);
      const isExact = (targetMatch && predHome === targetMatch.homeScore && predAway === targetMatch.awayScore) ||
        p.status === "EXACT_SCORE" || (typeof p.coinsEarned === "number" && p.coinsEarned >= 50);

      const reward = targetMatch?.customReward || (typeof p.coinsEarned === "number" && p.coinsEarned > 0 ? p.coinsEarned : 50);

      if (isExact) {
        userAgg.exactCount += 1;
        userAgg.totalPoints += reward;
        userAgg.totalCoins += reward;
      } else if (p.status === "CORRECT_OUTCOME") {
        userAgg.correctOutcomeCount += 1;
      }

      userAgg.predictionsList.push({
        matchId: p.matchId,
        predicted: `${p.predictedHomeScore}-${p.predictedAwayScore}`,
        status: isExact ? 'EXACT_SCORE' : p.status,
        pointsEarned: isExact ? reward : (p.pointsEarned || 0),
      });
    });

    // 3. Fetch all registered users in Firestore
    const allUsersSnap = await getDocs(collection(db, "users"));
    const updatedLeaderboard: any[] = [];

    for (const userDoc of allUsersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const agg = userAggregates[userId] || {
        userId,
        userName: userData.displayName || "مستخدم Kora",
        totalPoints: 0,
        totalCoins: 0,
        exactCount: 0,
        correctOutcomeCount: 0,
        totalPredictions: 0,
        predictionsList: [],
      };

      const finalCoins = agg.totalCoins;
      const finalPoints = agg.totalPoints;

      await updateDoc(doc(db, "users", userId), {
        points: finalPoints,
        predictionPoints: finalPoints,
        coins: finalCoins,
        exactPredictions: agg.exactCount,
        correctOutcomes: agg.correctOutcomeCount,
        totalPredictions: agg.totalPredictions,
        updatedAt: new Date().toISOString(),
      });

      updatedLeaderboard.push({
        userId,
        displayName: userData.displayName || agg.userName,
        points: finalPoints,
        predictionPoints: finalPoints,
        coins: finalCoins,
        exactPredictions: agg.exactCount,
        correctOutcomes: agg.correctOutcomeCount,
        totalPredictions: agg.totalPredictions,
        details: agg.predictionsList,
      });
    }

    // Sort leaderboard by coins/points descending
    updatedLeaderboard.sort((a, b) => b.coins - a.coins);
    updatedLeaderboard.forEach((user, idx) => {
      user.rank = idx + 1;
    });

    cachedLeaderboard = updatedLeaderboard;

    return res.json({
      success: true,
      message: "تم استرجاع وتحديث كافة الكوينز ونقاط التوقعات للمستخدمين بنجاح!",
      totalUsersEvaluated: updatedLeaderboard.length,
      leaderboard: updatedLeaderboard,
    });
  } catch (err: any) {
    if (isFirestoreQuotaError(err)) {
      firestoreQuotaExceededUntil = Date.now() + 300000;
      return res.json({
        success: true,
        message: "تم استرجاع الترتيب (الحصة اليومية لفايربيس استنفدت، جاري العمل من الذاكرة)",
        leaderboard: cachedLeaderboard,
      });
    }
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Endpoint to get detailed stats of predictions for a match (or all matches)
app.get("/api/predictions/match-stats", async (req, res) => {
  const matchId = (req.query.matchId as string) || "m_fulham_cp";
  const actualHome = req.query.homeScore !== undefined ? Number(req.query.homeScore) : 1;
  const actualAway = req.query.awayScore !== undefined ? Number(req.query.awayScore) : 2;

  if (!db) {
    return res.status(500).json({ success: false, error: "Database not initialized" });
  }

  try {
    const q = matchId === "all" ? collection(db, "predictions") : query(collection(db, "predictions"), where("matchId", "==", matchId));
    const snapshot = await getDocs(q);
    
    let total = 0;
    let correct = 0;
    let missed = 0;
    const details: any[] = [];

    snapshot.forEach((docSnap) => {
      total++;
      const data = docSnap.data();
      const isExact = data.status === "EXACT_SCORE" || (Number(data.predictedHomeScore) === actualHome && Number(data.predictedAwayScore) === actualAway);
      if (isExact) {
        correct++;
      } else {
        missed++;
      }
      details.push({
        id: docSnap.id,
        matchId: data.matchId,
        userName: data.userName || data.userDisplayName || "مستخدم",
        userId: data.userId,
        predictedHomeScore: data.predictedHomeScore,
        predictedAwayScore: data.predictedAwayScore,
        status: data.status,
        isExact,
      });
    });

    return res.json({
      matchId,
      actualScore: `${actualHome} - ${actualAway}`,
      totalPredictions: total,
      correctPredictionsCount: correct,
      missedPredictionsCount: missed,
      details,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Google Live Match Score Sync Endpoint using Gemini + Google Search Grounding
app.post("/api/matches/google-live-sync", async (req, res) => {
  const { matches, language } = req.body || {};
  const isArabic = language === 'ar';

  if (!Array.isArray(matches) || matches.length === 0) {
    return res.json({ syncedMatches: [], source: "empty_request" });
  }

  // Create a cache key from match IDs and current scores
  const cacheKey = matches.map((m: any) => `${m.id}_${m.homeTeam}_vs_${m.awayTeam}_${m.homeScore}-${m.awayScore}_${m.status}`).join("|");
  const cached = liveSyncCache[cacheKey];

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json({ syncedMatches: cached.data, source: "server_cache", cachedAt: new Date(cached.timestamp).toISOString() });
  }

  // Check if we are in a rate-limit cooldown
  const inCooldown = Date.now() < geminiQuotaCooldownUntil;

  if (!inCooldown) {
    try {
      const ai = getGeminiClient();
      if (ai) {
        const matchDescriptions = matches.map((m: any) => 
          `Match ID: ${m.id} | ${m.homeTeam} vs ${m.awayTeam} | League: ${m.leagueName || m.league} | Status: ${m.status}`
        ).join("\n");

        const prompt = isArabic
          ? `استخدم محرك بحث جوجل (Google Search) لمعرفة آخر وأحدث النتايج المباشرة الآن للمباريات التالية اليوم:
${matchDescriptions}

قم بالبحث عن نتيجة كل مباراة بالوقت الفعلي من نتائج جوجل الرياضية (Google Football Live Scores).
أعد النتائج بتنسيق JSON حصرياً كقائمة كالتالي:
{
  "syncedMatches": [
    {
      "id": "match_id_here",
      "homeScore": number,
      "awayScore": number,
      "status": "LIVE" | "FINISHED" | "UPCOMING" | "HALFTIME",
      "minute": "مثال 75' أو انتهت أو بين الشوطين",
      "isFinished": boolean,
      "goalDetected": boolean (ضع true فقط إذا تم تسجيل هدف جديد للتو),
      "scoringTeam": "HOME" | "AWAY" | null,
      "scorerName": "اسم اللاعب إذا وُجد أو null",
      "matchNote": "ملاحظة سريعة باللغة العربية كالمُعلق"
    }
  ]
}`
          : `Search Google for current live football match scores and status right now for:
${matchDescriptions}

Fetch latest real-time scores from Google Live Scores. Return strictly a JSON object:
{
  "syncedMatches": [
    {
      "id": "match_id_here",
      "homeScore": number,
      "awayScore": number,
      "status": "LIVE" | "FINISHED" | "UPCOMING" | "HALFTIME",
      "minute": "e.g. 75' or FT",
      "isFinished": boolean,
      "goalDetected": boolean,
      "scoringTeam": "HOME" | "AWAY" | null,
      "scorerName": "player name or null",
      "matchNote": "brief note"
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        let responseText = response.text || "";
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          responseText = jsonMatch[0];
        }

        const parsedData = JSON.parse(responseText);
        const syncedMatches = parsedData.syncedMatches || [];

        // Trigger evaluation only for finished matches not yet evaluated in memory
        const finished = syncedMatches.filter((m: any) => m.isFinished || m.status === 'FINISHED' || m.status === 'FT');
        const unevaluatedFinished = finished.filter((m: any) => !evaluatedMatchesMemoryCache.has(`${m.id}_${m.homeScore}_${m.awayScore}`));
        if (unevaluatedFinished.length > 0) {
          evaluateFinishedMatchesOnServer(unevaluatedFinished, false).catch((e) => console.warn("Async prediction eval notice:", e?.message || e));
        }

        // Save to memory cache
        const cacheObj = {
          data: syncedMatches,
          timestamp: Date.now(),
        };
        liveSyncCache[cacheKey] = cacheObj;
        lastGlobalSyncCache = cacheObj;

        return res.json({
          syncedMatches,
          source: "google_search_grounding",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("quota")) {
        geminiQuotaCooldownUntil = Date.now() + 180000; // 3 minutes cooldown
        console.warn("Google Live Sync rate limit hit (429), activated 3-minute cooldown. Serving cached/fallback data.");
      } else {
        console.warn("Google Live Sync notice:", err?.message || err);
      }
    }
  }

  // If we have a previous successful global cache, reuse it gracefully
  if (lastGlobalSyncCache && Date.now() - lastGlobalSyncCache.timestamp < 600000) {
    return res.json({
      syncedMatches: lastGlobalSyncCache.data,
      source: "server_last_known_cache",
      cachedAt: new Date(lastGlobalSyncCache.timestamp).toISOString(),
    });
  }

  // Graceful Fallback if offline/API unavailable/quota limit
  const fallbackSynced = matches.map((m: any) => ({
    id: m.id,
    homeScore: m.homeScore ?? 0,
    awayScore: m.awayScore ?? 0,
    status: m.status || 'UPCOMING',
    minute: m.status === 'LIVE' ? (m.minute || "45'") : (m.status === 'FINISHED' ? 'انتهت' : undefined),
    isFinished: m.status === "FINISHED",
    goalDetected: false,
    scoringTeam: null,
    scorerName: null,
    matchNote: isArabic ? "مُحدّث من الخادم (سيرفر كورة المباشر)" : "Updated via Kora Server Live",
  }));

  // Trigger eval only for unevaluated finished matches in fallback
  const finishedFallback = fallbackSynced.filter((m: any) => m.isFinished);
  const unevaluatedFallback = finishedFallback.filter((m: any) => !evaluatedMatchesMemoryCache.has(`${m.id}_${m.homeScore}_${m.awayScore}`));
  if (unevaluatedFallback.length > 0) {
    evaluateFinishedMatchesOnServer(unevaluatedFallback, false).catch((e) => console.warn("Async prediction eval notice:", e?.message || e));
  }

  return res.json({
    syncedMatches: fallbackSynced,
    source: "fallback_server",
  });
});

// Explicit endpoint to trigger match predictions evaluation
app.post("/api/matches/evaluate", async (req, res) => {
  const { matches } = req.body || {};
  if (!Array.isArray(matches) || matches.length === 0) {
    return res.status(400).json({ success: false, message: "No matches provided" });
  }

  const finished = matches.filter((m: any) => m.status === 'FINISHED' || m.isFinished);
  await evaluateFinishedMatchesOnServer(finished);

  return res.json({ success: true, evaluatedCount: finished.length });
});

// AI Tactical Analysis Endpoint
app.post("/api/ai/tactics", async (req, res) => {
  const { homeTeam, awayTeam, league, language } = req.body;
  const isArabic = language === 'ar';

  try {
    const ai = getGeminiClient();
    if (ai) {
      const prompt = isArabic
        ? `قم بتحليل تكتيكي شامل ومثير لمباراة كرة القدم المرتقبة بين ${homeTeam} و ${awayTeam} في بطولة ${league}.
قدم التحليل بتنسيق JSON يحتوي على:
1. "tacticalOverview": ملخص الأسلوب والتكتيك المتوقع لكل فريق (فقرة مشوقة).
2. "keyMatchups": قائمة بأهم 3 مواجهات فردية ثنائية بين اللاعبين على أرض الملعب مع شرح بسيط.
3. "predictedOutcome": توقع سيناريو المباراة مع النتيجة المتوقعة وسبب التوقع.
4. "xGFactor": من سيكون المحرك الأساسي للأهداف والفرص.
تأكد من أن الرد بلغة عربية رياضية فصيحة وممتعة مثل معلقي قنوات الرياضة العربية.`
        : `Provide an in-depth tactical preview for the upcoming football match between ${homeTeam} and ${awayTeam} in ${league}.
Return a JSON object with:
1. "tacticalOverview": Brief tactical style analysis for both teams.
2. "keyMatchups": Array of 3 key individual player duels on the pitch with explanations.
3. "predictedOutcome": Match scenario analysis with predicted scoreline and rationale.
4. "xGFactor": Key tactical key or player who could be the difference maker.
Write in an engaging, professional sports journalism tone.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      let text = response.text || "{}";
      text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const data = JSON.parse(text);
      return res.json(data);
    }
  } catch (err: any) {
    console.error("Tactics AI Error:", err);
  }

  // Fallback if API key missing or external request fails
  return res.json({
    tacticalOverview: isArabic
      ? `تتجه الأنظار نحو موقعة ${homeTeam} ضد ${awayTeam} في ${league}. يتوقع أن يعتمد ${homeTeam} على الضغط العالي والتحضير من الخلف لخلق مساحات، بينما يركز ${awayTeam} على الهجمات المرتدة السريعة واستغلال الثغرات في أطراف الملعب.`
      : `High-stakes clash in ${league} featuring ${homeTeam} and ${awayTeam}. Expect ${homeTeam} to control possession with a high press, while ${awayTeam} relies on swift counter-attacks and wing exploitation.`,
    keyMatchups: isArabic
      ? [
          `صراع منتصف الملعب: افتكاك الكرة وتدوير اللعب بين محاور الفريقين`,
          `الأطراف الهجومية: مواجهة المهاجمين ضد أظهرة الدفاع`,
          `الكرات الثابتة: التعامل مع العرضيات والركلات الركنية داخل منطقة الجزاء`,
        ]
      : [
          `Midfield Battle: Controlling tempo and ball recovery`,
          `Wing Duels: Winger speed vs Fullback positioning`,
          `Set Pieces: Aerial superiority in penalty box`,
        ],
    predictedOutcome: isArabic
      ? `مباراة متكافئة تكتيكياً وحافلة بالإثارة، مع أرجحية طفيفة للضغط الهجومي والنتيجة المتوقعة تتراوح بين 2-1 أو 1-1.`
      : `Tactically balanced high-intensity match with slight edge for high pressure, expected scoreline 2-1 or 1-1.`,
    xGFactor: isArabic
      ? `حسم الفرص أمام المرمى والتركيز في الدقائق الـ 15 الأولى من كل شوط.`
      : `Clinical finishing and alertness in early phases of each half.`,
  });
});

// AI Assistant / Chat Endpoint
app.post("/api/ai/ask", async (req, res) => {
  const { prompt, language, enableSearch } = req.body;
  const isArabic = language === 'ar';

  try {
    const ai = getGeminiClient();
    if (ai) {
      const systemInstruction = isArabic
        ? "أنت 'كورة AI' - الخبير والتكتيكي والمحلل الرياضي الذكي المتخصص في عالم كرة القدم العالمية والعربية. أجِب بأسلوب ممتع، موثوق، ودقيق رياضياً باللغة العربية. استخدم المصطلحات الكروية الشائعة."
        : "You are 'Kora AI' - an expert football analyst, tactician, and statistics assistant for global and regional football. Respond with engaging, precise, and passionate football knowledge.";

      const config: any = {
        systemInstruction,
      };

      if (enableSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config,
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((c: any) => c.web)
        .filter(Boolean)
        .map((w: any) => ({ title: w.title, uri: w.uri }));

      return res.json({
        answer: response.text || (isArabic ? "عذراً، لم أستطع الحصول على إجابة الآن." : "Sorry, I could not generate an answer right now."),
        sources,
      });
    }
  } catch (err: any) {
    console.error("Ask AI Error:", err);
  }

  // Fallback response for AI chat
  return res.json({
    answer: isArabic
      ? `بناءً على التحليل الرياضي الذكي لسؤالك "${prompt}": تتطلب هذه المواجهة تركيزاً كبيراً في الجوانب التكتيكية، واستغلال المساحات الشاغرة وتنظيم خط الدفاع، مع أهمية اللياقة البدنية والسرعة في التحول من الدفاع للهجوم.`
      : `Based on tactical analysis regarding "${prompt}": Success in this scenario depends heavily on midfield discipline, exploiting transition spaces, and maintaining defensive structure throughout the 90 minutes.`,
    sources: [],
  });
});

// AI Match Commentary / Summary Endpoint
app.post("/api/ai/match-summary", async (req, res) => {
  const { matchData, language } = req.body || {};
  const isArabic = language === 'ar';
  const homeTeam = matchData?.homeTeam || 'Home';
  const awayTeam = matchData?.awayTeam || 'Away';
  const homeScore = matchData?.homeScore ?? 0;
  const awayScore = matchData?.awayScore ?? 0;
  const league = matchData?.league || '';

  try {
    const ai = getGeminiClient();
    if (ai && matchData) {
      const prompt = isArabic
        ? `أنت معلق رياضي حماسي. صغ ملخصاً للمباراة التالية كتقرير رياضي مثير مع إبراز اللحظات الحافلة والإحصائيات:
المباراة: ${homeTeam} ضد ${awayTeam} (${homeScore} - ${awayScore})
البطولة: ${league}
الأحداث الرئيسية: ${JSON.stringify(matchData.events || [])}
الإحصائيات: ${JSON.stringify(matchData.stats || {})}`
        : `You are an enthusiastic football commentator. Write an exciting match summary report for:
Match: ${homeTeam} vs ${awayTeam} (${homeScore} - ${awayScore})
League: ${league}
Events: ${JSON.stringify(matchData.events || [])}
Stats: ${JSON.stringify(matchData.stats || {})}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      if (response.text) {
        return res.json({ summary: response.text });
      }
    }
  } catch (err: any) {
    console.error("Match Summary AI Error:", err);
  }

  // Fallback summary
  return res.json({
    summary: isArabic
      ? `شهدت مباراة ${homeTeam} ضد ${awayTeam} في بطولة ${league} منافسة قوية وحافلة بالندية، وانتهت اللقاء بنتيجة (${homeScore} - ${awayScore}). تميز الأداء بالتكتيك المرتفع والتحركات المتبادلة بين الفريقين طوال التسعين دقيقة.`
      : `The clash between ${homeTeam} and ${awayTeam} in ${league} ended with a scoreline of (${homeScore} - ${awayScore}). Both teams showed intense tactical effort and determination throughout the 90 minutes.`,
  });
});

// Endpoint: Live Match Events and Score fetched directly from Google Search Grounding
app.post("/api/google/sync-match-events", async (req, res) => {
  const { homeTeam, awayTeam, leagueName, matchId, language } = req.body || {};
  const isArabic = language === 'ar';
  const eventCacheKey = `${matchId || 'm'}_${homeTeam}_${awayTeam}`;

  // Check event cache first
  const cachedEvent = eventsSyncCache[eventCacheKey];
  if (cachedEvent && Date.now() - cachedEvent.timestamp < 120000) {
    return res.json({
      success: true,
      matchId,
      data: cachedEvent.data,
      sources: cachedEvent.sources,
      source: "server_events_cache",
      syncedAt: new Date(cachedEvent.timestamp).toISOString(),
    });
  }

  // If in rate limit cooldown, return graceful fallback immediately
  if (Date.now() < geminiQuotaCooldownUntil) {
    return res.json({
      success: true,
      matchId,
      data: {
        liveCommentary: isArabic ? `مباراة حماسية بين ${homeTeam} و ${awayTeam}. جاري متابعة أهم الأحداث.` : `Live match between ${homeTeam} and ${awayTeam}.`,
        events: [],
      },
      sources: [],
      source: "fallback_cooldown",
    });
  }

  try {
    const ai = getGeminiClient();
    if (ai) {
      const prompt = isArabic
        ? `ابحث في نتائج جوجل الرياضية (Google Search Live Scores) بالوقت الفعلي عن أحداث ونتيجة وتفاصيل مباراة كرة القدم الحالية بين "${homeTeam}" و "${awayTeam}" في بطولة "${leagueName}".
أعد النتائج بتنسيق JSON يحتوي على:
{
  "homeScore": number,
  "awayScore": number,
  "status": "LIVE" | "FINISHED" | "UPCOMING" | "HALF_TIME",
  "minute": "الدقيقة الحالية أو انتهت",
  "liveCommentary": "ملخص مباشر ومثير لأبرز ما جرى في المباراة حتى الآن",
  "events": [
    {
      "id": "فريد",
      "minute": number,
      "type": "GOAL" | "YELLOW_CARD" | "RED_CARD" | "SUBSTITUTION" | "VAR",
      "team": "HOME" | "AWAY",
      "playerName": "اسم اللاعب باللغة العربية",
      "playerNameAr": "اسم اللاعب باللغة العربية",
      "detail": "تفاصيل الحدث"
    }
  ]
}`
        : `Search Google Live Scores right now for real-time match status, live scores, and events for: "${homeTeam}" vs "${awayTeam}" in "${leagueName}".
Return JSON format:
{
  "homeScore": number,
  "awayScore": number,
  "status": "LIVE" | "FINISHED" | "UPCOMING" | "HALF_TIME",
  "minute": "current minute or FT",
  "liveCommentary": "brief exciting commentary summary",
  "events": [
    {
      "id": "unique_string",
      "minute": number,
      "type": "GOAL" | "YELLOW_CARD" | "RED_CARD" | "SUBSTITUTION" | "VAR",
      "team": "HOME" | "AWAY",
      "playerName": "Player Name",
      "playerNameAr": "Player Name in Arabic",
      "detail": "Event details"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      let responseText = response.text || "{}";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }

      const parsedData = JSON.parse(responseText);

      // Extract Grounding Sources
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((c: any) => c.web)
        .filter(Boolean)
        .map((w: any) => ({ title: w.title, uri: w.uri }));

      // Store in event cache
      eventsSyncCache[eventCacheKey] = {
        data: parsedData,
        sources,
        timestamp: Date.now(),
      };

      return res.json({
        success: true,
        matchId,
        data: parsedData,
        sources,
        source: "google_search_grounding",
        syncedAt: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("quota")) {
      geminiQuotaCooldownUntil = Date.now() + 180000;
      console.warn("Google Sync Match Events rate limited (429), switching seamlessly to server match events fallback.");
    } else {
      console.warn("Google Sync Match Events notice:", err?.message || err);
    }
  }

  // Fallback response if API or network is unavailable
  return res.json({
    success: true,
    matchId,
    data: {
      liveCommentary: isArabic ? `مباراة حماسية بين ${homeTeam} و ${awayTeam}. التغطية مستمرة عبر الخادم.` : `Match coverage between ${homeTeam} and ${awayTeam}.`,
      events: [],
    },
    sources: [],
    source: "fallback_server",
  });
});

// Endpoint: Official Match Lineups dynamically fetched from Google Search Grounding prior to kickoff
app.post("/api/google/sync-match-lineups", async (req, res) => {
  const { homeTeam, awayTeam, leagueName, matchId, language } = req.body || {};
  const isArabic = language === 'ar';
  const lineupCacheKey = `${matchId || 'm'}_lineup_${homeTeam}_${awayTeam}`;

  // Check in-memory lineup cache first (5 minutes TTL)
  const cachedLineup = lineupsSyncCache[lineupCacheKey];
  if (cachedLineup && Date.now() - cachedLineup.timestamp < 300000) {
    return res.json({
      success: true,
      matchId,
      data: cachedLineup.data,
      sources: cachedLineup.sources,
      source: "server_lineup_cache",
      syncedAt: new Date(cachedLineup.timestamp).toISOString(),
    });
  }

  // If in rate limit cooldown, return graceful notice
  if (Date.now() < geminiQuotaCooldownUntil) {
    return res.json({
      success: true,
      matchId,
      data: {
        message: isArabic
          ? "⏳ التشكيل الرسمي يُنشر فور اعتماده من الجهاز الفني قبل اللقاء بساعة."
          : "⏳ Official starting lineups are confirmed 60 minutes before kickoff.",
      },
      sources: [],
      source: "fallback_cooldown",
    });
  }

  try {
    const ai = getGeminiClient();
    if (ai) {
      const prompt = isArabic
        ? `ابحث في نتائج جوجل (Google Search) عن التشكيل الرسمي المعتمد لمباراة كرة القدم بين "${homeTeam}" و "${awayTeam}" في بطولة "${leagueName}".
إذا كانت المباراة قادمة ولم يُعلن التشكيل الرسمي بعد (عادة يُعلن قبل اللقاء بساعة واحدة)، حدد ذلك بوضوح.
إذا كان التشكيل الرسمي معلناً، أعد البيانات بتنسيق JSON:
{
  "isAnnounced": boolean,
  "message": "نص توضيحي باللغة العربية",
  "homeLineup": {
    "formation": "4-3-3",
    "coach": "اسم المدرب",
    "coachAr": "اسم المدرب بالعربية",
    "starting11": [
      {
        "id": "فريد",
        "number": number,
        "name": "اسم اللاعب بالإنجليزية",
        "nameAr": "اسم اللاعب بالعربية",
        "position": "GK" | "DEF" | "MID" | "FWD",
        "rating": 7.0,
        "gridPos": { "x": number, "y": number }
      }
    ],
    "substitutes": [
      {
        "id": "فريد",
        "number": number,
        "name": "الاسم",
        "nameAr": "الاسم بالعربية",
        "position": "DEF"
      }
    ]
  },
  "awayLineup": {
    "formation": "4-3-3",
    "coach": "اسم المدرب",
    "coachAr": "اسم المدرب بالعربية",
    "starting11": [
      {
        "id": "فريد",
        "number": number,
        "name": "اسم اللاعب",
        "nameAr": "اسم اللاعب بالعربية",
        "position": "GK" | "DEF" | "MID" | "FWD",
        "rating": 7.0,
        "gridPos": { "x": number, "y": number }
      }
    ],
    "substitutes": []
  }
}`
        : `Search Google for official confirmed lineups for "${homeTeam}" vs "${awayTeam}" in "${leagueName}".
If not announced yet (usually published 60 mins before kickoff), set isAnnounced to false.
Return JSON with format:
{
  "isAnnounced": boolean,
  "message": "Lineup announcement status message",
  "homeLineup": { "formation": "4-3-3", "starting11": [], "substitutes": [] },
  "awayLineup": { "formation": "4-3-3", "starting11": [], "substitutes": [] }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      let responseText = response.text || "{}";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }

      const parsedData = JSON.parse(responseText);

      // Extract Grounding Sources
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((c: any) => c.web)
        .filter(Boolean)
        .map((w: any) => ({ title: w.title, uri: w.uri }));

      lineupsSyncCache[lineupCacheKey] = {
        data: parsedData,
        sources,
        timestamp: Date.now(),
      };

      return res.json({
        success: true,
        matchId,
        data: parsedData,
        sources,
        source: "google_search_grounding",
        syncedAt: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("quota")) {
      geminiQuotaCooldownUntil = Date.now() + 180000;
      console.warn("Google Sync Match Lineups rate limited (429), switching to lineup fallback.");
    } else {
      console.warn("Google Sync Match Lineups notice:", err?.message || err);
    }
  }

  return res.json({
    success: true,
    matchId,
    data: {
      isAnnounced: false,
      message: isArabic
        ? "⏳ التشكيل الرسمي يُنشر تلقائياً فور اعتماده قبل انطلاق المباراة بساعة."
        : "⏳ Official lineups will be published 1 hour before match start.",
    },
    sources: [],
    source: "fallback_server",
  });
});

// =========================================================================
// Server-Side Points Engine & 02:00 AM Daily/Weekly/Monthly Resets
// =========================================================================
const userDailyGiftClaims: Record<string, number> = {}; // userId -> timestamp
const userDailyScores: Record<string, { displayName: string; points: number }> = {};
let lastDailyResetDate = ''; // YYYY-MM-DD string of last 2:00 AM reset
let lastDailyWinners: Array<{ rank: number; userId: string; displayName: string; points: number }> = [];

// Endpoint to reset all user points and coins to 0 across Firestore
app.post("/api/admin/reset-all-user-points-and-coins", async (_req, res) => {
  if (!db) return res.json({ success: true, message: "Local reset completed." });
  try {
    const snap = await getDocs(collection(db, "users"));
    let count = 0;
    for (const uDoc of snap.docs) {
      await updateDoc(doc(db, "users", uDoc.id), {
        points: 0,
        predictionPoints: 0,
        coins: 0,
      });
      count++;
    }
    return res.json({ success: true, resetUsersCount: count, message: "تم تصفير جميع النقاط والكوينز لجميع المستخدمين بنجاح! 🧹" });
  } catch (err: any) {
    console.error("Error zeroing out all users:", err);
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Endpoint to broadcast a new featured match to all users via Firestore notifications
app.post("/api/notifications/broadcast-new-match", async (req, res) => {
  try {
    const { match } = req.body;
    if (!match || !match.id) {
      return res.status(400).json({ success: false, message: "Match data is required" });
    }

    const homeName = match.homeTeamAr || match.homeTeam;
    const awayName = match.awayTeamAr || match.awayTeam;
    const leagueTitle = match.leagueNameAr || match.leagueName || "البطولات المميزة";

    const payload = {
      matchId: match.id,
      title: `🔥 New Match Added: ${match.homeTeam} vs ${match.awayTeam}`,
      titleAr: `🔥 قمة جديدة في ${leagueTitle}: ${homeName} ضد ${awayName}`,
      body: `New match scheduled at ${match.time}! Predict now to earn +50 coins!`,
      bodyAr: `تمت إضافة قمة مرتقبة في جدول المباريات الساعة ${match.time} ⏰ بادر بتوقع النتيجة الآن واكسب الكوينز والجوائز!`,
      ctaText: "🎯 Predict Now",
      ctaTextAr: "🎯 اتوقع الان",
      type: "NEW_FEATURED_MATCH",
      homeTeam: match.homeTeam,
      homeTeamAr: match.homeTeamAr,
      awayTeam: match.awayTeam,
      awayTeamAr: match.awayTeamAr,
      homeLogo: match.homeLogo,
      awayLogo: match.awayLogo,
      timestamp: new Date().toISOString(),
      read: false,
      broadcast: true
    };

    if (db) {
      await addDoc(collection(db, "notifications"), payload);
    }

    return res.json({
      success: true,
      message: `تم إرسال إشعار قمة ${homeName} ضد ${awayName} لجميع المستخدمين بنجاح! 🚀`,
      payload
    });
  } catch (err: any) {
    console.error("Error broadcasting match notification:", err);
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Helper to get target 2:00 AM reset timestamp
function getNextDailyResetTime(): { nextResetMs: number; targetDateStr: string } {
  const now = new Date();
  const target = new Date(now);
  target.setHours(2, 0, 0, 0); // 02:00 AM

  if (now.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const targetDateStr = `${target.getFullYear()}-${(target.getMonth() + 1).toString().padStart(2, '0')}-${target.getDate().toString().padStart(2, '0')}`;
  return { nextResetMs: target.getTime(), targetDateStr };
}

// 1. Check Daily Gift Eligibility (Requires Matches Available Today)
app.get("/api/user/daily-gift-status", async (req, res) => {
  const userId = (req.query.userId as string) || "guest";
  const hasTodayMatches = req.query.hasMatches === "true";

  if (!hasTodayMatches) {
    return res.json({
      eligible: false,
      pointsReward: 0,
      msRemaining: 0,
      message: "اليوم لا توجد به مباريات، النقاط تبقى 0 ولا يمكن استلام نقاط يومية.",
    });
  }

  let lastClaim = userDailyGiftClaims[userId] || 0;

  if (db && userId !== "guest" && userId !== "guest_user") {
    try {
      const uSnap = await getDoc(doc(db, "users", userId));
      if (uSnap.exists()) {
        const uData = uSnap.data();
        if (uData.lastDailyGiftTimestamp && typeof uData.lastDailyGiftTimestamp === "number") {
          lastClaim = Math.max(lastClaim, uData.lastDailyGiftTimestamp);
        } else if (uData.lastDailyClaimDate) {
          const todayStr = new Date().toISOString().split("T")[0];
          if (uData.lastDailyClaimDate === todayStr) {
            lastClaim = Math.max(lastClaim, Date.now() - (1000 * 60 * 60));
          }
        }
      }
    } catch (e) {
      console.warn("Failed to check Firestore daily gift status:", e);
    }
  }

  const now = Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const timePassed = now - lastClaim;

  if (timePassed >= TWENTY_FOUR_HOURS_MS) {
    return res.json({
      eligible: true,
      pointsReward: 25,
      msRemaining: 0,
      message: "هدية الـ 25 كوينز اليومية جاهزة للاستلام الآن! 🎁",
    });
  }

  const msRemaining = TWENTY_FOUR_HOURS_MS - timePassed;
  return res.json({
    eligible: false,
    pointsReward: 25,
    msRemaining,
    nextClaimTimestamp: lastClaim + TWENTY_FOUR_HOURS_MS,
    message: "لقد استلمت الهدية اليومية بالفعل خلال الـ 24 ساعة الماضية.",
  });
});

// 2. Claim Daily Gift (Strict 25 Points, Blocked on Matchless Days)
app.post("/api/user/claim-daily-gift", async (req, res) => {
  const { userId, displayName, hasMatches } = req.body || {};
  if (!userId) {
    return res.status(400).json({ success: false, error: "missing_user_id", message: "المستخدم غير محدد" });
  }

  if (hasMatches === false) {
    return res.json({
      success: false,
      error: "no_matches_today",
      message: "عذراً، اليوم لا توجد مباريات! النقاط تبقى 0 ولا يتم توزيع نقاط في الأيام بدون مباريات.",
    });
  }

  let lastClaim = userDailyGiftClaims[userId] || 0;
  const now = Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  if (db && userId !== "guest" && userId !== "guest_user") {
    try {
      const uSnap = await getDoc(doc(db, "users", userId));
      if (uSnap.exists()) {
        const uData = uSnap.data();
        if (uData.lastDailyGiftTimestamp && typeof uData.lastDailyGiftTimestamp === "number") {
          lastClaim = Math.max(lastClaim, uData.lastDailyGiftTimestamp);
        }
      }
    } catch (e) {
      console.warn("Failed to check Firestore in claim-daily-gift:", e);
    }
  }

  const timePassed = now - lastClaim;

  if (timePassed < TWENTY_FOUR_HOURS_MS) {
    const msRemaining = TWENTY_FOUR_HOURS_MS - timePassed;
    const hours = Math.floor(msRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((msRemaining % (1000 * 60)) / 1000);

    return res.json({
      success: false,
      error: "claimed_within_24h",
      message: `عذراً، لقد استلمت هدية الـ 25 كوينز بالفعل! الهدية التالية بعد: ${hours}س : ${minutes}د : ${seconds}ث`,
      msRemaining,
      nextClaimTimestamp: lastClaim + TWENTY_FOUR_HOURS_MS,
    });
  }

  // Grant 25 Gift Coins
  userDailyGiftClaims[userId] = now;
  const todayStr = new Date().toISOString().split("T")[0];

  if (db && userId !== "guest" && userId !== "guest_user") {
    try {
      const userRef = doc(db, "users", userId);
      const uSnap = await getDoc(userRef);
      if (uSnap.exists()) {
        const curCoins = typeof uSnap.data().coins === "number" ? uSnap.data().coins : 0;
        await updateDoc(userRef, {
          coins: curCoins + 25,
          lastDailyClaimDate: todayStr,
          lastDailyGiftTimestamp: now,
        });
      }
    } catch (e) {
      console.error("Error updating Firestore in claim-daily-gift:", e);
    }
  }

  // Track daily coins
  if (!userDailyScores[userId]) {
    userDailyScores[userId] = { displayName: displayName || "الكابتن", points: 0 };
  }
  userDailyScores[userId].points += 25;

  return res.json({
    success: true,
    pointsAwarded: 25,
    message: "تهانينا! تم إضافة 25 كوينز كهدية يومية لحسابك بنجاح 🎁",
    nextClaimTimestamp: now + TWENTY_FOUR_HOURS_MS,
  });
});

// 3. Get Daily Leaderboard & 2:00 AM Reset Status
app.get("/api/leaderboard/daily-status", (_req, res) => {
  const { nextResetMs } = getNextDailyResetTime();
  const now = Date.now();
  const msRemaining = Math.max(0, nextResetMs - now);

  const sortedDailyLeaders = Object.entries(userDailyScores)
    .map(([uid, data]) => ({ userId: uid, displayName: data.displayName, points: data.points }))
    .sort((a, b) => b.points - a.points);

  return res.json({
    resetHour: "02:00 AM",
    nextResetMs,
    msRemaining,
    dailyLeaders: sortedDailyLeaders,
    lastWinners: lastDailyWinners,
  });
});

// Automated Daily Leaderboard Reset at 02:00 AM (Memory leaderboard points reset, user coins protected)
async function executeDailyLeaderboardResetAndPayouts(dateStr: string) {
  try {
    console.log(`[02:00 AM Reset] Executing daily leaderboard memory reset for ${dateStr}...`);

    // Reset internal in-memory leaderboard state without querying all user records in Firestore
    for (const uid in userDailyScores) {
      userDailyScores[uid].points = 0;
    }

    console.log(`[02:00 AM Reset] Daily leaderboard memory reset completed successfully!`);
  } catch (err: any) {
    console.warn("Notice during daily leaderboard reset:", err?.message || err);
  }
}

// Server Background Scheduled Checker for 02:00 AM Daily Reset
setInterval(() => {
  const now = new Date();
  const hour = now.getHours();
  const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

  if (hour === 2 && lastDailyResetDate !== dateStr) {
    lastDailyResetDate = dateStr;
    executeDailyLeaderboardResetAndPayouts(dateStr);
  }
}, 30000); // Check every 30 seconds

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Kora Football App server running on http://0.0.0.0:${PORT}`);
    // Run initial evaluation of finished matches to ensure points and coins are distributed
    setTimeout(async () => {
      try {
        const finishedMatchesArray = Object.entries(MASTER_FINISHED_MATCHES_MAP).map(([id, data]) => ({
          id,
          homeScore: data.homeScore,
          awayScore: data.awayScore,
        }));
        await evaluateFinishedMatchesOnServer(finishedMatchesArray, true);
      } catch (e) {
        console.warn("Initial finished matches evaluation notice:", e);
      }
    }, 2000);
  });
}

startServer();
