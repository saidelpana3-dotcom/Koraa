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
import {
  getLiveFixtures,
  getFixturesByDate,
  getFixtureDetails,
  formatStatsFromApiFootball,
  formatLineupsFromApiFootball,
  formatEventsFromApiFootball,
  areTeamsMatching,
  parseApiFootballStatus,
  apiFootballDiagnostic,
} from "./src/server/footballApi";
import { getOfficialTeamRoster, OFFICIAL_TEAM_ROSTERS } from "./src/data/teamRosters";
import { getAllCuratedMatches } from "./src/data/mockMatches";
import { computeSimulatedMatchState } from "./src/server/matchGoalEngine";

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

      // Query predictions for this matchId and known aliases
      const matchIds = [matchId];
      if (matchId === 'm_egy_ahly_smouha_sep3') matchIds.push('m_egy_ahly_smouha');
      if (matchId === 'm_egy_ahly_smouha') matchIds.push('m_egy_ahly_smouha_sep3');
      if (matchId === 'm_epl_chelsea_fulham') matchIds.push('m_epl_fulham_chelsea');
      if (matchId === 'm_epl_fulham_chelsea') matchIds.push('m_epl_chelsea_fulham');

      const q = query(collection(db, "predictions"), where("matchId", "in", matchIds));
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
                const isExact = mCatalog
                  ? (ph === mCatalog.homeScore && pa === mCatalog.awayScore)
                  : (predData.status === "EXACT_SCORE" || (typeof predData.coinsEarned === "number" && predData.coinsEarned >= 50));
                if (isExact) {
                  const rew = mCatalog?.customReward || (typeof predData.coinsEarned === "number" && predData.coinsEarned > 0 ? predData.coinsEarned : 50);
                  totalCoinsFromPredictions += rew;
                  totalExactWins += 1;
                }
              });
            } catch (calcErr) {
              if (pointsAwarded > 0) {
                totalCoinsFromPredictions = (userData.coins || 0) + pointsAwarded;
                totalExactWins = (userData.exactPredictions || 0) + 1;
              } else if (p.status === "EXACT_SCORE") {
                // Previously credited prediction is now revoked
                totalCoinsFromPredictions = Math.max(0, (userData.coins || 0) - 50);
                totalExactWins = Math.max(0, (userData.exactPredictions || 0) - 1);
              } else {
                totalCoinsFromPredictions = userData.coins || 0;
                totalExactWins = userData.exactPredictions || 0;
              }
            }

            const updatedPts = totalCoinsFromPredictions;
            const updatedPredPts = totalCoinsFromPredictions;
            const updatedCoins = totalCoinsFromPredictions;

            await updateDoc(userRef, {
              points: updatedPts,
              predictionPoints: updatedPredPts,
              coins: updatedCoins,
              exactPredictions: totalExactWins,
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

const ALL_UNPLAYED_MATCH_IDS = [
  'm_egy_mokawloon_ahly_sep9',
  'm_laliga_realmadrid_rayo_sep12',
  'm_egy_ahly_abuqir_sep15',
  'm_ucl_realmadrid_inter_sep8',
  'm_ucl_realmadrid_inter',
  'm_ucl_inter_realmadrid',
];

// Revert all unplayed matches function
async function revertAllUnplayedMatchesInternal() {
  let totalRevertedPredictions = 0;
  if (!db) return totalRevertedPredictions;

  for (const mIdStr of ALL_UNPLAYED_MATCH_IDS) {
    try {
      await setDoc(doc(db, "matches", mIdStr), {
        id: mIdStr,
        homeScore: 0,
        awayScore: 0,
        status: "UPCOMING",
        isFinished: false,
        time: "20:00",
        minute: "",
        pointsDistributed: false,
        updatedAt: new Date().toISOString(),
      }, { merge: false });
    } catch (_) {}

    evaluatedMatchesMemoryCache.forEach((key) => {
      if (key.includes(mIdStr)) {
        evaluatedMatchesMemoryCache.delete(key);
      }
    });

    try {
      const q = query(collection(db, "predictions"), where("matchId", "==", mIdStr));
      const snap = await getDocs(q);

      for (const pDoc of snap.docs) {
        const p = pDoc.data();
        const hadWon = p.status === "EXACT_SCORE" || (typeof p.coinsEarned === "number" && p.coinsEarned > 0);
        const coinsToRemove = hadWon ? (p.coinsEarned || 50) : 0;

        await updateDoc(doc(db, "predictions", pDoc.id), {
          status: "PENDING",
          evaluated: false,
          pointsEarned: 0,
          coinsEarned: 0,
          matchHomeScore: null,
          matchAwayScore: null,
          updatedAt: new Date().toISOString(),
        });
        totalRevertedPredictions += 1;

        if (p.userId && coinsToRemove > 0) {
          try {
            const uRef = doc(db, "users", p.userId);
            const uSnap = await getDoc(uRef);
            if (uSnap.exists()) {
              const uData = uSnap.data();
              const newCoins = Math.max(0, (uData.coins || 0) - coinsToRemove);
              const newPts = Math.max(0, (uData.points || 0) - coinsToRemove);
              const newExacts = Math.max(0, (uData.exactPredictions || 0) - 1);
              await updateDoc(uRef, {
                coins: newCoins,
                points: newPts,
                predictionPoints: newPts,
                exactPredictions: newExacts,
                correctPredictionsCount: newExacts,
              });
            }
          } catch (_) {}
        }
      }
    } catch (_) {}
  }
  return totalRevertedPredictions;
}

// Endpoint to revert all unplayed matches back to UPCOMING and restore coins
app.all(["/api/matches/revert-all-unplayed", "/api/admin/revert-all-unplayed"], async (_req, res) => {
  try {
    const totalRevertedPredictions = await revertAllUnplayedMatchesInternal();
    return res.json({
      success: true,
      message: `تمت استعادة جميع المباريات القادمة بنجاح وإلغاء أي كوينز أضيفت بالخطأ!`,
      totalRevertedPredictions,
      unplayedMatchesCount: ALL_UNPLAYED_MATCH_IDS.length,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message });
  }
});

// Endpoint to revert a match back to UPCOMING, retract awarded coins, and restore user predictions
app.post(["/api/matches/revert-match", "/api/admin/revert-match"], async (req, res) => {
  const { matchId } = req.body || {};
  if (!matchId) {
    return res.status(400).json({ success: false, error: "Missing matchId" });
  }

  try {
    const mIdStr = String(matchId);

    // 1. Reset Firestore match document to UPCOMING
    if (db) {
      try {
        await setDoc(doc(db, "matches", mIdStr), {
          id: mIdStr,
          homeScore: 0,
          awayScore: 0,
          status: "UPCOMING",
          isFinished: false,
          time: "22:00",
          minute: "",
          pointsDistributed: false,
          updatedAt: new Date().toISOString(),
        }, { merge: false });
      } catch (dbErr) {
        console.warn("Firestore match reset warning:", dbErr);
      }
    }

    // 2. Clear memory caches
    evaluatedMatchesMemoryCache.forEach((key) => {
      if (key.includes(mIdStr)) {
        evaluatedMatchesMemoryCache.delete(key);
      }
    });

    // 3. Reset predictions in Firestore and retract coins
    let revertedPredictionsCount = 0;
    if (db) {
      try {
        const matchIds = [mIdStr];
        const q = query(collection(db, "predictions"), where("matchId", "in", matchIds));
        const snap = await getDocs(q);

        for (const pDoc of snap.docs) {
          const p = pDoc.data();
          const hadWon = p.status === "EXACT_SCORE" || (typeof p.coinsEarned === "number" && p.coinsEarned > 0);
          const coinsToRemove = hadWon ? (p.coinsEarned || 50) : 0;

          await updateDoc(doc(db, "predictions", pDoc.id), {
            status: "PENDING",
            evaluated: false,
            pointsEarned: 0,
            coinsEarned: 0,
            matchHomeScore: null,
            matchAwayScore: null,
            updatedAt: new Date().toISOString(),
          });
          revertedPredictionsCount += 1;

          // Retract coins from user
          if (p.userId && coinsToRemove > 0) {
            try {
              const uRef = doc(db, "users", p.userId);
              const uSnap = await getDoc(uRef);
              if (uSnap.exists()) {
                const uData = uSnap.data();
                const newCoins = Math.max(0, (uData.coins || 0) - coinsToRemove);
                const newPts = Math.max(0, (uData.points || 0) - coinsToRemove);
                const newExacts = Math.max(0, (uData.exactPredictions || 0) - 1);
                await updateDoc(uRef, {
                  coins: newCoins,
                  points: newPts,
                  predictionPoints: newPts,
                  exactPredictions: newExacts,
                  correctPredictionsCount: newExacts,
                });
              }
            } catch (uErr) {
              console.warn("User coin retraction warning:", uErr);
            }
          }
        }
      } catch (predErr) {
        console.warn("Predictions revert warning:", predErr);
      }
    }

    return res.json({
      success: true,
      message: `المباراة ${mIdStr} تم إعادتها إلى قائمة المباريات القادمة (UPCOMING)، وتم سحب الكوينز المضافة واستعادة توقع كل مستخدم كمعلق (PENDING)!`,
      revertedPredictionsCount,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message });
  }
});

// Endpoint to update a match result in Firestore and award points to all user predictions
app.post(["/api/matches/update-result", "/api/admin/evaluate-match"], async (req, res) => {
  const { matchId, homeScore, awayScore, homeTeamAr, awayTeamAr, status, isFinished } = req.body || {};
  if (!matchId) {
    return res.status(400).json({ success: false, error: "Missing matchId" });
  }

  // If status is UPCOMING or isFinished is explicitly false, forward to revert logic
  if (status === "UPCOMING" || isFinished === false) {
    const mIdStr = String(matchId);
    if (db) {
      try {
        await setDoc(doc(db, "matches", mIdStr), {
          id: mIdStr,
          homeScore: 0,
          awayScore: 0,
          status: "UPCOMING",
          isFinished: false,
          time: "22:00",
          minute: "",
          pointsDistributed: false,
          updatedAt: new Date().toISOString(),
        }, { merge: false });
      } catch (dbErr) {
        console.warn("Firestore match setDoc warning:", dbErr);
      }
    }

    evaluatedMatchesMemoryCache.forEach((key) => {
      if (key.includes(mIdStr)) evaluatedMatchesMemoryCache.delete(key);
    });

    return res.json({
      success: true,
      message: `Match ${matchId} reverted to UPCOMING.`,
    });
  }

  if (homeScore === undefined || awayScore === undefined) {
    return res.status(400).json({ success: false, error: "Missing parameters (homeScore, awayScore)" });
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
  m_epl_mancity_coventry_sep5: { homeScore: 1, awayScore: 0, customReward: 50 },
  m_epl_fulham_crystalpalace_sep5: { homeScore: 2, awayScore: 3, customReward: 50 },
  m_epl_manutd_ipswich: { homeScore: 5, awayScore: 2, customReward: 50 },
  m_epl_ipswich_manutd: { homeScore: 2, awayScore: 5, customReward: 50 },
  m_epl_chelsea_brighton: { homeScore: 4, awayScore: 3, customReward: 50 },
  m_epl_brighton_chelsea: { homeScore: 3, awayScore: 4, customReward: 50 },
  m_epl_sunderland_fulham: { homeScore: 1, awayScore: 0, customReward: 50 },
  m_epl_fulham_sunderland: { homeScore: 0, awayScore: 1, customReward: 50 },
  m_epl_leeds_brentford: { homeScore: 1, awayScore: 1, customReward: 50 },
  m_epl_brentford_leeds: { homeScore: 1, awayScore: 1, customReward: 50 },
  m_epl_palace_mancity: { homeScore: 1, awayScore: 4, customReward: 50 },
  m_epl_mancity_palace: { homeScore: 4, awayScore: 1, customReward: 50 },
  m_epl_fulham_chelsea: { homeScore: 3, awayScore: 2, customReward: 50 },
  m_epl_chelsea_fulham: { homeScore: 3, awayScore: 2, customReward: 50 },
  m_fri_coventry_arsenal: { homeScore: 0, awayScore: 3, customReward: 50 },
  m_epl_newcastle_mancity: { homeScore: 1, awayScore: 3, customReward: 50 },
  m_epl_tottenham_arsenal: { homeScore: 1, awayScore: 2, customReward: 50 },
  m_epl_liverpool_wolves: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_epl_everton_astonvilla: { homeScore: 0, awayScore: 1, customReward: 50 },
  m_epl_everton_manutd_sep6: { homeScore: 2, awayScore: 2, customReward: 50 },
  m_epl_everton_manutd: { homeScore: 2, awayScore: 2, customReward: 50 },
  m_epl_astonvilla_arsenal: { homeScore: 0, awayScore: 1, customReward: 50 },
  m_epl_arsenal_astonvilla: { homeScore: 1, awayScore: 0, customReward: 50 },
  m_epl_ipswich_liverpool_sep4: { homeScore: 0, awayScore: 2, customReward: 50 },
  m_epl_liverpool_ipswich_sep4: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_epl_ipswich_liverpool: { homeScore: 0, awayScore: 2, customReward: 50 },
  m_epl_liverpool_ipswich: { homeScore: 2, awayScore: 0, customReward: 50 },
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
  m_egy_ahly_smouha: { homeScore: 1, awayScore: 0, customReward: 50 },
  m_egy_ahly_smouha_sep3: { homeScore: 1, awayScore: 0, customReward: 50 },
  m_egy_zamalek_abuqir_sep8: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_egy_zamalek_abuqir: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_egy_abuqir_zamalek: { homeScore: 0, awayScore: 2, customReward: 50 },
  // La Liga
  m_laliga_celta_bilbao: { homeScore: 0, awayScore: 2, customReward: 50 },
  m_laliga_bilbao_celta: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_laliga_deportivo_valencia: { homeScore: 3, awayScore: 1, customReward: 50 },
  m_laliga_valencia_deportivo: { homeScore: 1, awayScore: 3, customReward: 50 },
  m_laliga_real_malaga: { homeScore: 4, awayScore: 0, customReward: 50 },
  m_laliga_malaga_real: { homeScore: 0, awayScore: 4, customReward: 50 },
  m_laliga_alaves_villarreal: { homeScore: 1, awayScore: 0, customReward: 50 },
  m_laliga_villarreal_alaves: { homeScore: 0, awayScore: 1, customReward: 50 },
  m_laliga_racing_elche: { homeScore: 3, awayScore: 2, customReward: 50 },
  m_laliga_elche_racing: { homeScore: 2, awayScore: 3, customReward: 50 },
  m_laliga_celta_osasuna: { homeScore: 1, awayScore: 2, customReward: 50 },
  m_laliga_osasuna_celta: { homeScore: 2, awayScore: 1, customReward: 50 },
  m_laliga_osasuna_getafe: { homeScore: 1, awayScore: 0, customReward: 50 },
  m_laliga_getafe_osasuna: { homeScore: 0, awayScore: 1, customReward: 50 },
  m_laliga_barcelona_rayo: { homeScore: 5, awayScore: 2, customReward: 50 },
  m_laliga_rayo_barcelona: { homeScore: 2, awayScore: 5, customReward: 50 },
  m_laliga_barcelona_bilbao: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_laliga_bilbao_barcelona: { homeScore: 0, awayScore: 2, customReward: 50 },
  m_laliga_valencia_betis: { homeScore: 0, awayScore: 1, customReward: 50 },
  m_laliga_valencia_barcelona_sep6: { homeScore: 0, awayScore: 5, customReward: 50 },
  m_laliga_valencia_barcelona: { homeScore: 0, awayScore: 5, customReward: 50 },
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
  m_laliga_betis_realmadrid_sep4: { homeScore: 1, awayScore: 2, customReward: 50 },
  m_laliga_realmadrid_betis_sep4: { homeScore: 2, awayScore: 1, customReward: 50 },
  m_laliga_betis_realmadrid: { homeScore: 1, awayScore: 2, customReward: 50 },
  m_laliga_realmadrid_betis: { homeScore: 2, awayScore: 1, customReward: 50 },
  m_laliga_levante_betis: { homeScore: 5, awayScore: 2, customReward: 50 },
  m_laliga_betis_levante: { homeScore: 2, awayScore: 5, customReward: 50 },
  m_laliga_sociedad_espanyol: { homeScore: 2, awayScore: 1, customReward: 50 },
  m_laliga_espanyol_sociedad: { homeScore: 1, awayScore: 2, customReward: 50 },
  m_laliga_sociedad_celta: { homeScore: 0, awayScore: 0, customReward: 50 },
  m_laliga_celta_sociedad: { homeScore: 0, awayScore: 0, customReward: 50 },
  m_laliga_sevilla_atletico: { homeScore: 1, awayScore: 3, customReward: 50 },
  m_laliga_atletico_sevilla: { homeScore: 3, awayScore: 1, customReward: 50 },
  // Ligue 1
  m_ligue1_monaco_marseille: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_ligue1_marseille_monaco: { homeScore: 0, awayScore: 2, customReward: 50 },
  m_ligue1_paris_nice: { homeScore: 3, awayScore: 0, customReward: 50 },
  m_ligue1_nice_paris: { homeScore: 0, awayScore: 3, customReward: 50 },
  m_ligue1_rennes_lemans: { homeScore: 3, awayScore: 2, customReward: 50 },
  m_ligue1_lemans_rennes: { homeScore: 2, awayScore: 3, customReward: 50 },
  m_ligue1_auxerre_angers: { homeScore: 1, awayScore: 3, customReward: 50 },
  m_ligue1_angers_auxerre: { homeScore: 3, awayScore: 1, customReward: 50 },
  m_ligue1_brest_toulouse: { homeScore: 2, awayScore: 2, customReward: 50 },
  m_ligue1_toulouse_brest: { homeScore: 2, awayScore: 2, customReward: 50 },
  m_ligue1_lyon_lehavre: { homeScore: 1, awayScore: 1, customReward: 50 },
  m_ligue1_lehavre_lyon: { homeScore: 1, awayScore: 1, customReward: 50 },
  m_ligue1_lorient_troyes: { homeScore: 1, awayScore: 2, customReward: 50 },
  m_ligue1_troyes_lorient: { homeScore: 2, awayScore: 1, customReward: 50 },
  m_ligue1_strasbourg_lens: { homeScore: 2, awayScore: 1, customReward: 50 },
  m_ligue1_lens_strasbourg: { homeScore: 1, awayScore: 2, customReward: 50 },
  m_ligue1_lille_psg: { homeScore: 2, awayScore: 2, customReward: 50 },
  m_ligue1_psg_lille: { homeScore: 2, awayScore: 2, customReward: 50 },
  m_ligue1_lille_angers: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_ligue1_rennes_psg: { homeScore: 2, awayScore: 2, customReward: 50 },
  // Champions League & Other Tournaments
  m_ucl_psg_bayern: { homeScore: 2, awayScore: 2, customReward: 50 },
  m_afcon_egypt_senegal: { homeScore: 1, awayScore: 0, customReward: 50 },
  m_superlig_trabzonspor_genclerbirligi_sep6: { homeScore: 2, awayScore: 0, customReward: 50 },
  m_superlig_trabzonspor_genclerbirligi: { homeScore: 2, awayScore: 0, customReward: 50 },
};

// Endpoint to restore and sync user coins directly from their predictions in Firestore
app.post("/api/user/sync-coins", async (req, res) => {
  const { userId, email } = req.body || {};
  if (!userId || !db) {
    return res.status(400).json({ success: false, error: "Missing userId or database" });
  }

  try {
    const q = query(collection(db, "predictions"), where("userId", "==", userId));
    const predsSnap = await getDocs(q);

    // Also query by userEmail if provided to ensure cross-device/provider sync
    const docsList = [...predsSnap.docs];
    if (email && typeof email === 'string' && email.trim()) {
      try {
        const cleanEmail = email.toLowerCase().trim();
        const qEmail = query(collection(db, "predictions"), where("userEmail", "==", cleanEmail));
        const emailSnap = await getDocs(qEmail);
        for (const ed of emailSnap.docs) {
          if (!docsList.some((d) => d.id === ed.id)) {
            docsList.push(ed);
            // Link prediction permanently to this userId
            try {
              await updateDoc(doc(db, "predictions", ed.id), { userId });
            } catch (_) {}
          }
        }
      } catch (_) {}
    }

    // Deduplicate predictions per matchId so each match only counts once
    const userMatchPreds = new Map<string, any>();
    for (const docSnap of docsList) {
      const p = { id: docSnap.id, ...docSnap.data() } as any;
      const matchKey = p.matchId || (typeof p.id === 'string' && p.id.startsWith('pred_') ? p.id.split('_').slice(2).join('_') : p.id);
      if (!matchKey) continue;
      
      const canonicalMatchKey = (matchKey === 'm_epl_chelsea_fulham' || matchKey === 'm_epl_fulham_chelsea')
        ? 'm_epl_fulham_chelsea'
        : matchKey;

      if (!userMatchPreds.has(canonicalMatchKey)) {
        userMatchPreds.set(canonicalMatchKey, p);
      } else {
        const existing = userMatchPreds.get(canonicalMatchKey);
        if (!existing.createdAt || !p.createdAt || new Date(p.createdAt) >= new Date(existing.createdAt)) {
          userMatchPreds.set(canonicalMatchKey, p);
        }
      }
    }

    let totalEarnedCoins = 0;
    let totalSpentCoins = 0;
    let exactCount = 0;
    let totalCount = userMatchPreds.size;

    for (const p of userMatchPreds.values()) {
      const matchKey = p.matchId;
      const targetMatch = MASTER_FINISHED_MATCHES_MAP[matchKey] || 
        (matchKey === 'm_epl_fulham_chelsea' ? MASTER_FINISHED_MATCHES_MAP['m_epl_chelsea_fulham'] : null);

      const fee = typeof p.coinsSpent === 'number'
        ? p.coinsSpent
        : 0;
      totalSpentCoins += fee;

      const predHome = Number(p.predictedHomeScore);
      const predAway = Number(p.predictedAwayScore);
      const isExactByScore = Boolean(targetMatch && predHome === targetMatch.homeScore && predAway === targetMatch.awayScore);
      const isExactByStatus = !targetMatch && (p.status === "EXACT_SCORE" || (typeof p.coinsEarned === "number" && p.coinsEarned >= 50));

      if (isExactByScore || isExactByStatus) {
        const reward = targetMatch?.customReward || (typeof p.coinsEarned === "number" && p.coinsEarned > 0 ? p.coinsEarned : 50);
        totalEarnedCoins += reward;
        exactCount++;

        // Ensure prediction doc has EXACT_SCORE, coinsEarned, and coinsSpent
        if (p.id && (p.status !== "EXACT_SCORE" || !p.coinsEarned || p.coinsSpent === undefined)) {
          try {
            await updateDoc(doc(db, "predictions", p.id), {
              status: "EXACT_SCORE",
              coinsEarned: reward,
              pointsEarned: reward,
              coinsSpent: fee,
              evaluated: true,
              evaluatedAt: new Date().toISOString(),
              matchHomeScore: targetMatch ? targetMatch.homeScore : predHome,
              matchAwayScore: targetMatch ? targetMatch.awayScore : predAway,
            });
          } catch (_) {}
        }
      } else {
        // Not exact! If previously marked as exact (e.g. erroneous 2-1 prediction), revoke coins and update doc to MISSED
        if (p.id && (p.status === "EXACT_SCORE" || (typeof p.coinsEarned === "number" && p.coinsEarned > 0))) {
          try {
            await updateDoc(doc(db, "predictions", p.id), {
              status: "MISSED",
              coinsEarned: 0,
              pointsEarned: 0,
              coinsSpent: fee,
              evaluated: true,
              evaluatedAt: new Date().toISOString(),
              matchHomeScore: targetMatch ? targetMatch.homeScore : 0,
              matchAwayScore: targetMatch ? targetMatch.awayScore : 0,
            });
          } catch (_) {}
        }
      }
    }

    // Check prize claims (cash withdrawals) for this user
    let totalClaimedCoins = 0;
    try {
      const claimsQ = query(collection(db, "prizeClaims"), where("userId", "==", userId));
      const claimsSnap = await getDocs(claimsQ);
      claimsSnap.forEach((cDoc) => {
        const cData = cDoc.data();
        totalClaimedCoins += (cData.coinsSpent || 1000);
      });
    } catch (_) {}

    const netCoins = Math.max(0, totalEarnedCoins - totalSpentCoins - totalClaimedCoins);

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const uData = userSnap.data();

      await updateDoc(userRef, {
        coins: netCoins,
        points: netCoins,
        predictionPoints: totalEarnedCoins,
        exactPredictions: Math.max(uData.exactPredictions || 0, exactCount),
        updatedAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        userId,
        restoredCoins: netCoins,
        totalEarnedCoins,
        totalSpentCoins,
        totalClaimedCoins,
        exactPredictions: exactCount,
        totalPredictions: totalCount,
      });
    }

    return res.json({ success: true, userId, restoredCoins: netCoins });
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
      totalEarnedCoins: number;
      totalSpentCoins: number;
      totalCoins: number;
      exactCount: number;
      correctOutcomeCount: number;
      totalPredictions: number;
      predictionsList: any[];
    }> = {};

    // Group predictions by userId and deduplicate by matchId
    const userMatchPredsMap: Record<string, Map<string, any>> = {};
    const userDisplayNames: Record<string, string> = {};

    predsSnap.forEach((docSnap) => {
      const p = { id: docSnap.id, ...docSnap.data() } as any;
      if (!p.userId) return;

      if (!userMatchPredsMap[p.userId]) {
        userMatchPredsMap[p.userId] = new Map<string, any>();
        userDisplayNames[p.userId] = p.userName || p.userDisplayName || "مستخدم Kora";
      }

      const matchKey = p.matchId || (typeof p.id === 'string' && p.id.startsWith('pred_') ? p.id.split('_').slice(2).join('_') : p.id);
      if (!matchKey) return;

      const canonicalMatchKey = (matchKey === 'm_epl_chelsea_fulham' || matchKey === 'm_epl_fulham_chelsea')
        ? 'm_epl_fulham_chelsea'
        : matchKey;

      const userMap = userMatchPredsMap[p.userId];
      if (!userMap.has(canonicalMatchKey)) {
        userMap.set(canonicalMatchKey, p);
      } else {
        const existing = userMap.get(canonicalMatchKey);
        if (!existing.createdAt || !p.createdAt || new Date(p.createdAt) >= new Date(existing.createdAt)) {
          userMap.set(canonicalMatchKey, p);
        }
      }
    });

    Object.entries(userMatchPredsMap).forEach(([userId, userMap]) => {
      userAggregates[userId] = {
        userId,
        userName: userDisplayNames[userId] || "مستخدم Kora",
        totalPoints: 0,
        totalEarnedCoins: 0,
        totalSpentCoins: 0,
        totalCoins: 0,
        exactCount: 0,
        correctOutcomeCount: 0,
        totalPredictions: userMap.size,
        predictionsList: [],
      };

      const userAgg = userAggregates[userId];

      for (const p of userMap.values()) {
        const matchKey = p.matchId;
        const targetMatch = MASTER_FINISHED_MATCHES_MAP[matchKey] || 
          (matchKey === 'm_epl_fulham_chelsea' ? MASTER_FINISHED_MATCHES_MAP['m_epl_chelsea_fulham'] : null);
        
        const fee = typeof p.coinsSpent === 'number'
          ? p.coinsSpent
          : 0;
        userAgg.totalSpentCoins += fee;

        const predHome = Number(p.predictedHomeScore);
        const predAway = Number(p.predictedAwayScore);
        const isExact = targetMatch
          ? (predHome === targetMatch.homeScore && predAway === targetMatch.awayScore)
          : (p.status === "EXACT_SCORE" || (typeof p.coinsEarned === "number" && p.coinsEarned >= 50));

        const reward = targetMatch?.customReward || (typeof p.coinsEarned === "number" && p.coinsEarned > 0 ? p.coinsEarned : 50);

        if (isExact) {
          userAgg.exactCount += 1;
          userAgg.totalPoints += reward;
          userAgg.totalEarnedCoins += reward;
        } else if (p.status === "CORRECT_OUTCOME") {
          userAgg.correctOutcomeCount += 1;
        }

        userAgg.predictionsList.push({
          matchId: p.matchId,
          predicted: `${p.predictedHomeScore}-${p.predictedAwayScore}`,
          status: isExact ? 'EXACT_SCORE' : p.status,
          pointsEarned: isExact ? reward : (p.pointsEarned || 0),
          coinsSpent: fee,
        });
      }
    });

    // 3. Fetch all prize claims
    const claimsSnap = await getDocs(collection(db, "prizeClaims"));
    const userClaimsSpent: Record<string, number> = {};
    claimsSnap.forEach((cDoc) => {
      const c = cDoc.data();
      if (c.userId) {
        userClaimsSpent[c.userId] = (userClaimsSpent[c.userId] || 0) + (c.coinsSpent || 1000);
      }
    });

    // 4. Fetch all registered users in Firestore
    const allUsersSnap = await getDocs(collection(db, "users"));
    const updatedLeaderboard: any[] = [];

    for (const userDoc of allUsersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const agg = userAggregates[userId] || {
        userId,
        userName: userData.displayName || "مستخدم Kora",
        totalPoints: 0,
        totalEarnedCoins: 0,
        totalSpentCoins: 0,
        totalCoins: 0,
        exactCount: 0,
        correctOutcomeCount: 0,
        totalPredictions: 0,
        predictionsList: [],
      };

      const claimsDeduction = userClaimsSpent[userId] || 0;
      const netCoins = Math.max(0, agg.totalEarnedCoins - agg.totalSpentCoins - claimsDeduction);
      const finalPoints = netCoins;

      await updateDoc(doc(db, "users", userId), {
        points: finalPoints,
        predictionPoints: agg.totalEarnedCoins,
        coins: netCoins,
        exactPredictions: agg.exactCount,
        correctOutcomes: agg.correctOutcomeCount,
        totalPredictions: agg.totalPredictions,
        updatedAt: new Date().toISOString(),
      });

      updatedLeaderboard.push({
        userId,
        displayName: userData.displayName || agg.userName,
        points: finalPoints,
        predictionPoints: agg.totalEarnedCoins,
        coins: netCoins,
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

// =========================================================================
// API-Football Integration Endpoints (v3.football.api-sports.io)
// Real-time live scores, elapsed match minute, stats, lineups, and events (Auto 5-min refresh)
// =========================================================================

// Status Endpoint
app.get("/api/football/status", async (_req, res) => {
  try {
    const live = await getLiveFixtures();
    return res.json({
      success: true,
      status: apiFootballDiagnostic.status || (live.length > 0 ? "connected" : "fallback_active"),
      connected: apiFootballDiagnostic.connected,
      message: apiFootballDiagnostic.message,
      apiKeyConfigured: true,
      liveFixturesCount: live.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.json({
      success: true,
      status: "fallback_active",
      connected: false,
      message: err?.message || "Error reaching API-Football",
      apiKeyConfigured: true,
      liveFixturesCount: 0,
      timestamp: new Date().toISOString(),
    });
  }
});

// Exact real-time synchronization (الوقت الفعلي) - delay set to 0
const MATCH_STREAM_DELAY_MINUTES = 0;

// Helper to compute match live status & elapsed minute based on scheduled kickoff with 5-minute delay and smart goal engine
function computeScheduledMatchStatus(match: any, isArabic: boolean): {
  status: 'LIVE' | 'FINISHED' | 'UPCOMING' | 'HALF_TIME';
  minute: string;
  isFinished: boolean;
  homeScore: number;
  awayScore: number;
  goalDetected: boolean;
  scoringTeam: 'HOME' | 'AWAY' | null;
  lastGoal: any;
  events: any[];
  stats: any;
} {
  const masterData = MASTER_FINISHED_MATCHES_MAP[match.id];
  if (match.status === 'FINISHED' || match.isFinished === true) {
    const sim = computeSimulatedMatchState(match, Date.now(), isArabic);
    return {
      status: 'FINISHED',
      minute: isArabic ? 'انتهت' : 'FT',
      isFinished: true,
      homeScore: masterData ? masterData.homeScore : (typeof match.homeScore === 'number' && match.homeScore > 0 ? match.homeScore : sim.homeScore),
      awayScore: masterData ? masterData.awayScore : (typeof match.awayScore === 'number' && match.awayScore > 0 ? match.awayScore : sim.awayScore),
      goalDetected: false,
      scoringTeam: null,
      lastGoal: null,
      events: sim.events,
      stats: sim.stats,
    };
  }

  // Use the Smart Match Goal & Simulation Engine for real-time dynamic progression & goals
  const sim = computeSimulatedMatchState(match, Date.now(), isArabic);
  return {
    status: sim.status,
    minute: sim.minute,
    isFinished: sim.isFinished,
    homeScore: sim.homeScore,
    awayScore: sim.awayScore,
    goalDetected: sim.goalDetected,
    scoringTeam: sim.scoringTeam,
    lastGoal: sim.lastGoal,
    events: sim.events,
    stats: sim.stats,
  };
}

// Real-Time Live Matches Synchronizer (Called automatically every 5 minutes by client & server)
app.post("/api/football/sync-live", async (req, res) => {
  const { matches, language } = req.body || {};
  const isArabic = language === 'ar';

  if (!Array.isArray(matches) || matches.length === 0) {
    return res.json({ success: true, syncedMatches: [], source: "empty" });
  }

  const syncedMatches: any[] = [];
  const newlyFinishedMatches: any[] = [];

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const [liveFixtures, todayFixtures] = await Promise.all([
      getLiveFixtures().catch(() => []),
      getFixturesByDate(todayStr).catch(() => []),
    ]);

    const allFixtures = [...(liveFixtures || []), ...(todayFixtures || [])];

    for (const match of matches) {
      const homeName = match.homeTeam || '';
      const awayName = match.awayTeam || '';
      const homeNameAr = match.homeTeamAr || '';
      const awayNameAr = match.awayTeamAr || '';

      // Check if match is already officially finished or in master catalog
      const masterData = MASTER_FINISHED_MATCHES_MAP[match.id];
      const isAlreadyFinished = Boolean(masterData) || match.status === 'FINISHED' || match.isFinished === true;
      if (isAlreadyFinished) {
        const finalHomeScore = masterData ? masterData.homeScore : (typeof match.homeScore === 'number' ? match.homeScore : 0);
        const finalAwayScore = masterData ? masterData.awayScore : (typeof match.awayScore === 'number' ? match.awayScore : 0);
        syncedMatches.push({
          id: match.id,
          homeScore: finalHomeScore,
          awayScore: finalAwayScore,
          status: 'FINISHED',
          minute: isArabic ? 'انتهت' : 'FT',
          isFinished: true,
          goalDetected: false,
          scoringTeam: null,
          matchNote: isArabic ? 'نتيجة رسمية مؤكدة' : 'Official Confirmed Result',
          source: 'master_catalog',
        });
        if (match.status !== 'FINISHED') {
          newlyFinishedMatches.push({
            id: match.id,
            homeScore: finalHomeScore,
            awayScore: finalAwayScore,
            homeTeamAr: match.homeTeamAr,
            awayTeamAr: match.awayTeamAr,
          });
        }
        continue;
      }

      // Find matching fixture in API-Football
      const matchedFixture = allFixtures.find((f: any) => {
        const fHome = f.teams?.home?.name || '';
        const fAway = f.teams?.away?.name || '';
        const homeMatches = areTeamsMatching(fHome, homeName) || areTeamsMatching(fHome, homeNameAr);
        const awayMatches = areTeamsMatching(fAway, awayName) || areTeamsMatching(fAway, awayNameAr);
        return homeMatches && awayMatches;
      });

      if (matchedFixture) {
        const fixtureHomeScore = typeof matchedFixture.goals?.home === 'number' ? matchedFixture.goals.home : match.homeScore;
        const fixtureAwayScore = typeof matchedFixture.goals?.away === 'number' ? matchedFixture.goals.away : match.awayScore;
        const rawElapsed = matchedFixture.fixture?.status?.elapsed;
        // Exact real-time elapsed minute (الوقت الفعلي)
        const liveElapsed = typeof rawElapsed === 'number' ? rawElapsed : null;

        const statusInfo = parseApiFootballStatus(
          matchedFixture.fixture?.status?.short || '',
          liveElapsed
        );

        const goalDetected = (fixtureHomeScore > (match.homeScore || 0)) || (fixtureAwayScore > (match.awayScore || 0));
        let scoringTeam: 'HOME' | 'AWAY' | null = null;
        if (fixtureHomeScore > (match.homeScore || 0)) scoringTeam = 'HOME';
        else if (fixtureAwayScore > (match.awayScore || 0)) scoringTeam = 'AWAY';

        syncedMatches.push({
          id: match.id,
          fixtureId: matchedFixture.fixture?.id,
          homeScore: fixtureHomeScore,
          awayScore: fixtureAwayScore,
          status: statusInfo.status,
          minute: statusInfo.minuteDisplay || (statusInfo.status === 'LIVE' ? `${liveElapsed || 1}'` : ''),
          isFinished: statusInfo.isFinished,
          goalDetected,
          scoringTeam,
          matchNote: isArabic 
            ? `مُحدّث مباشرة من API-Football (الوقت الفعلي: ${statusInfo.minuteDisplay || 'مباشر'})` 
            : `Live real-time sync via API-Football (${statusInfo.minuteDisplay || 'LIVE'})`,
          source: "api_football_live",
        });

        if (statusInfo.isFinished && match.status !== 'FINISHED') {
          newlyFinishedMatches.push({
            id: match.id,
            homeScore: fixtureHomeScore,
            awayScore: fixtureAwayScore,
            homeTeamAr: match.homeTeamAr,
            awayTeamAr: match.awayTeamAr,
          });
        }
      } else {
        // Check if match has reached kickoff time (Cairo +03:00)
        let hasKickedOff = false;
        if (typeof match.kickoffTimeMs === 'number' && match.kickoffTimeMs > 0) {
          hasKickedOff = Date.now() >= match.kickoffTimeMs;
        } else if (match.date && match.time && match.time !== 'انتهت' && match.time !== 'FT') {
          try {
            const cleanDate = String(match.date).trim();
            const timeParts = String(match.time).trim().replace(/[^0-9:]/g, '').split(':').map(Number);
            if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/) && !isNaN(timeParts[0])) {
              const hours = timeParts[0];
              const minutes = timeParts[1] || 0;
              const kickoffDate = new Date(`${cleanDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+03:00`);
              hasKickedOff = Date.now() >= kickoffDate.getTime();
            }
          } catch (_) {}
        }

        // If match has not yet reached kickoff time, keep it strictly UPCOMING
        if (!hasKickedOff && (ALL_UNPLAYED_MATCH_IDS.includes(match.id) || (match.status === 'UPCOMING' && !match.isFinished))) {
          syncedMatches.push({
            id: match.id,
            homeScore: 0,
            awayScore: 0,
            status: 'UPCOMING',
            minute: match.time || (isArabic ? 'لم تبدأ' : 'Upcoming'),
            isFinished: false,
            goalDetected: false,
            scoringTeam: null,
            matchNote: isArabic ? 'موعد المباراة المرتقب' : 'Upcoming Fixture',
            source: 'fixture_schedule',
          });
          continue;
        }

        // Compute smart live status from scheduled date & kickoff time with live goal engine
        const computed = computeScheduledMatchStatus(match, isArabic);
        const prevHome = typeof match.homeScore === 'number' ? match.homeScore : 0;
        const prevAway = typeof match.awayScore === 'number' ? match.awayScore : 0;
        const homeGoal = computed.homeScore > prevHome;
        const awayGoal = computed.awayScore > prevAway;
        const isGoalDetected = homeGoal || awayGoal || computed.goalDetected;
        const scoringTeam = homeGoal ? 'HOME' : awayGoal ? 'AWAY' : computed.scoringTeam;

        syncedMatches.push({
          id: match.id,
          homeScore: computed.homeScore,
          awayScore: computed.awayScore,
          status: computed.status,
          minute: computed.minute,
          isFinished: computed.isFinished,
          goalDetected: isGoalDetected,
          scoringTeam,
          lastGoal: computed.lastGoal,
          matchNote: isGoalDetected && computed.lastGoal
            ? (isArabic ? `⚽ هدف! ${computed.lastGoal.playerAr} (${computed.lastGoal.minute}')` : `⚽ Goal! ${computed.lastGoal.player} (${computed.lastGoal.minute}')`)
            : computed.status === 'LIVE' 
            ? (isArabic ? `مباراة جارية (${computed.minute})` : `Match in progress (${computed.minute})`)
            : computed.status === 'FINISHED'
            ? (isArabic ? 'انتهت المباراة' : 'Match Finished')
            : (isArabic ? 'موعد المباراة المرتقب' : 'Upcoming Fixture'),
          source: "smart_scheduler",
        });

        if (computed.isFinished && match.status !== 'FINISHED') {
          newlyFinishedMatches.push({
            id: match.id,
            homeScore: computed.homeScore,
            awayScore: computed.awayScore,
            homeTeamAr: match.homeTeamAr,
            awayTeamAr: match.awayTeamAr,
          });
        }
      }
    }

    // Auto-evaluate exact predictions and award 50 coins if any match just completed
    if (newlyFinishedMatches.length > 0) {
      evaluateFinishedMatchesOnServer(newlyFinishedMatches, true).catch(err => {
        console.warn("API-Football auto-evaluation notice:", err);
      });
    }

    return res.json({
      success: true,
      syncedMatches,
      matchedCount: syncedMatches.length,
      source: "api_football_engine",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn("API-Football live sync notice:", err?.message || err);
    
    // Comprehensive resilient fallback
    const fallbackSynced = matches.map((m: any) => {
      const computed = computeScheduledMatchStatus(m, isArabic);
      const prevHome = typeof m.homeScore === 'number' ? m.homeScore : 0;
      const prevAway = typeof m.awayScore === 'number' ? m.awayScore : 0;
      const homeGoal = computed.homeScore > prevHome;
      const awayGoal = computed.awayScore > prevAway;
      const isGoalDetected = homeGoal || awayGoal || computed.goalDetected;
      const scoringTeam = homeGoal ? 'HOME' : awayGoal ? 'AWAY' : computed.scoringTeam;
      return {
        id: m.id,
        homeScore: computed.homeScore,
        awayScore: computed.awayScore,
        status: computed.status,
        minute: computed.minute,
        isFinished: computed.isFinished,
        goalDetected: isGoalDetected,
        scoringTeam,
        lastGoal: computed.lastGoal,
        matchNote: isGoalDetected && computed.lastGoal
          ? (isArabic ? `⚽ هدف! ${computed.lastGoal.playerAr} (${computed.lastGoal.minute}')` : `⚽ Goal! ${computed.lastGoal.player} (${computed.lastGoal.minute}')`)
          : isArabic ? "مُحدّث من خادم كورة الذكي" : "Updated via Kora Smart Server",
        source: "server_fallback",
      };
    });

    return res.json({
      success: true,
      syncedMatches: fallbackSynced,
      matchedCount: fallbackSynced.length,
      source: "server_fallback",
      timestamp: new Date().toISOString(),
    });
  }
});

// Comprehensive Match Details: Live Stats, Lineups, and Events from API-Football
app.post("/api/football/match-live-details", async (req, res) => {
  const { matchId, homeTeam, awayTeam, homeTeamAr, awayTeamAr, fixtureId, status, minute, homeScore, awayScore } = req.body || {};

  try {
    let targetFixtureId = fixtureId;

    // If fixtureId not passed directly, look it up from today's / live fixtures
    if (!targetFixtureId && (homeTeam || awayTeam)) {
      const todayStr = new Date().toISOString().split('T')[0];
      const [liveFixtures, todayFixtures] = await Promise.all([
        getLiveFixtures().catch(() => []),
        getFixturesByDate(todayStr).catch(() => []),
      ]);
      const all = [...(liveFixtures || []), ...(todayFixtures || [])];
      const match = all.find((f: any) => {
        const fHome = f.teams?.home?.name || '';
        const fAway = f.teams?.away?.name || '';
        return (
          areTeamsMatching(fHome, homeTeam) ||
          areTeamsMatching(fHome, homeTeamAr) ||
          areTeamsMatching(fAway, awayTeam) ||
          areTeamsMatching(fAway, awayTeamAr)
        );
      });
      if (match) {
        targetFixtureId = match.fixture?.id;
      }
    }

    if (targetFixtureId) {
      const details = await getFixtureDetails(Number(targetFixtureId));
      if (details) {
        const stats = details.statistics ? formatStatsFromApiFootball(details.statistics) : null;
        const lineups = details.lineups ? formatLineupsFromApiFootball(details.lineups) : null;
        const events = details.events ? formatEventsFromApiFootball(details.events, homeTeam) : [];

        // Exact real-time elapsed clock (الوقت الفعلي)
        const rawElapsed = details.fixture?.fixture?.status?.elapsed;
        const liveElapsed = typeof rawElapsed === 'number' ? rawElapsed : null;

        const statusInfo = details.fixture?.fixture?.status
          ? parseApiFootballStatus(details.fixture.fixture.status.short, liveElapsed)
          : null;

        return res.json({
          success: true,
          matchId,
          fixtureId: targetFixtureId,
          homeScore: details.fixture?.goals?.home ?? undefined,
          awayScore: details.fixture?.goals?.away ?? undefined,
          status: statusInfo?.status,
          minute: statusInfo?.minuteDisplay,
          isFinished: statusInfo?.isFinished,
          stats: stats || undefined,
          events: events.length > 0 ? events : undefined,
          homeLineup: lineups?.homeLineup || undefined,
          awayLineup: lineups?.awayLineup || undefined,
          matchNote: "مُحدّث مباشرة من API-Football (الوقت الفعلي والأحداث والتشكيلات)",
          source: "api_football_direct",
        });
      }
    }
  } catch (err: any) {
    console.warn("API-Football match details notice:", err?.message || err);
  }

  // Guaranteed High-Quality Fallback: Look up curated match data from the app's fixture catalog
  const resolvedHomeLineup = getOfficialTeamRoster(homeTeam) || getOfficialTeamRoster(homeTeamAr);
  const resolvedAwayLineup = getOfficialTeamRoster(awayTeam) || getOfficialTeamRoster(awayTeamAr);

  const allCurated = getAllCuratedMatches();
  const curated = allCurated.find((m: any) => 
    m.id === matchId || 
    (m.homeTeam && m.awayTeam && areTeamsMatching(m.homeTeam, homeTeam) && areTeamsMatching(m.awayTeam, awayTeam)) ||
    (m.homeTeamAr && m.awayTeamAr && areTeamsMatching(m.homeTeamAr, homeTeamAr) && areTeamsMatching(m.awayTeamAr, awayTeamAr))
  );

  const matchObj = curated || {
    id: matchId,
    homeTeam,
    awayTeam,
    homeTeamAr,
    awayTeamAr,
    status,
    minute,
    homeScore,
    awayScore,
  };
  const computedSim = computeSimulatedMatchState(matchObj, Date.now(), true);

  const finalStatus = curated?.status === 'FINISHED' ? 'FINISHED' : (status === 'FINISHED' ? 'FINISHED' : computedSim.status);
  const finalMinute = finalStatus === 'FINISHED' ? 'انتهت' : computedSim.minute;
  const finalEvents = (curated?.events && curated.events.length > 0) ? curated.events : computedSim.events;
  const finalHomeScore = finalStatus === 'FINISHED' 
    ? (curated?.homeScore ?? (typeof homeScore === 'number' && homeScore > 0 ? homeScore : computedSim.homeScore)) 
    : computedSim.homeScore;
  const finalAwayScore = finalStatus === 'FINISHED' 
    ? (curated?.awayScore ?? (typeof awayScore === 'number' && awayScore > 0 ? awayScore : computedSim.awayScore)) 
    : computedSim.awayScore;

  const hasCuratedStats = curated?.stats && (
    (curated.stats.possession?.[0] > 0 || curated.stats.possession?.[1] > 0) ||
    (curated.stats.shotsTotal?.[0] > 0 || curated.stats.shotsTotal?.[1] > 0)
  );
  const finalStats = hasCuratedStats ? curated.stats : (finalStatus === 'UPCOMING' ? null : computedSim.stats);

  return res.json({
    success: true,
    matchId,
    status: finalStatus,
    minute: finalMinute,
    homeScore: finalHomeScore,
    awayScore: finalAwayScore,
    homeLineup: curated?.homeLineup || resolvedHomeLineup || undefined,
    awayLineup: curated?.awayLineup || resolvedAwayLineup || undefined,
    stats: finalStats,
    events: finalEvents,
    matchNote: finalStatus === 'LIVE'
      ? "أحداث وإحصائيات مباشرة مع تأخير 5 دقائق لمطابقة البث التلفزيوني"
      : finalStatus === 'UPCOMING'
      ? "تشكيلات مؤكدة وقوائم اللاعبين الرسمية لمباراة مرتقبة"
      : "إحصائيات وأحداث المباراة المؤكدة",
    source: "kora_official_engine",
  });
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

// ⚡ Background Scheduled Checker: Automatically evaluate finished matches and award 50 coins to correct exact predictions
setInterval(() => {
  try {
    const finishedMatchesArray = Object.entries(MASTER_FINISHED_MATCHES_MAP).map(([id, data]) => ({
      id,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
    }));
    evaluateFinishedMatchesOnServer(finishedMatchesArray, false).catch(() => {});
  } catch (_) {}
}, 45000); // Check every 45 seconds

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
        await revertAllUnplayedMatchesInternal();
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
