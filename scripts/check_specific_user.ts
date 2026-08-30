import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkSpecificUser() {
  const uid = "F1fS6KkudShEUgg1u65DyAVEMTe2";
  const userDoc = await getDoc(doc(db, "users", uid));
  console.log("=== USER DOC (F1fS6KkudShEUgg1u65DyAVEMTe2) ===");
  console.log(JSON.stringify(userDoc.data(), null, 2));

  // Get matches
  const matchesSnap = await getDocs(collection(db, "matches"));
  const matchesMap = new Map<string, any>();
  matchesSnap.forEach(d => {
    matchesMap.set(d.id, { id: d.id, ...d.data() });
  });

  // Get predictions
  const predsSnap = await getDocs(collection(db, "predictions"));
  const userPreds: any[] = [];
  predsSnap.forEach(d => {
    const data = d.data();
    if (data.userId === uid || data.userEmail === "af6728883@gmail.com") {
      userPreds.push({ id: d.id, ...data });
    }
  });

  userPreds.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  console.log(`\n=== TOTAL PREDICTIONS: ${userPreds.length} ===`);

  const aug18 = new Date("2026-08-18T00:00:00.000Z");

  const before18 = userPreds.filter(p => new Date(p.createdAt || 0) < aug18);
  const after18 = userPreds.filter(p => new Date(p.createdAt || 0) >= aug18);

  console.log(`Predictions created BEFORE Aug 18: ${before18.length}`);
  console.log(`Predictions created ON/AFTER Aug 18: ${after18.length}`);

  console.log("\n--- DETAILED PREDICTIONS ON / AFTER AUG 18 ---");
  let correctExactCount = 0;
  let correctOutcomeCount = 0;
  let finishedCount = 0;
  let pendingCount = 0;
  let totalCoinsEarned = 0;

  after18.forEach((p, idx) => {
    const match = matchesMap.get(p.matchId);
    const homeTeam = p.matchHomeTeamAr || p.matchHomeTeam || match?.homeTeamAr || match?.homeTeam || p.matchId;
    const awayTeam = p.matchAwayTeamAr || p.matchAwayTeam || match?.awayTeamAr || match?.awayTeam || p.matchId;

    const actualHome = match?.homeScore ?? p.matchHomeScore;
    const actualAway = match?.awayScore ?? p.matchAwayScore;
    const matchStatus = match?.status || p.matchStatus || (p.evaluated ? "FINISHED" : "PENDING");

    // Exact score check
    const isExact = (p.status === "CORRECT" || p.status === "WON") || 
      (matchStatus === "FINISHED" && actualHome !== undefined && actualAway !== undefined && actualHome !== null && actualAway !== null && p.predictedHomeScore === actualHome && p.predictedAwayScore === actualAway);

    // Outcome check (win / draw / loss)
    let isOutcome = false;
    if (matchStatus === "FINISHED" && actualHome !== null && actualAway !== null && actualHome !== undefined && actualAway !== undefined) {
      const predDiff = p.predictedHomeScore - p.predictedAwayScore;
      const actualDiff = actualHome - actualAway;
      if ((predDiff > 0 && actualDiff > 0) || (predDiff < 0 && actualDiff < 0) || (predDiff === 0 && actualDiff === 0)) {
        isOutcome = true;
      }
    }

    if (isExact) correctExactCount++;
    if (isOutcome) correctOutcomeCount++;
    if (matchStatus === "FINISHED" || p.evaluated) finishedCount++;
    else pendingCount++;

    totalCoinsEarned += (p.coinsEarned || 0);

    console.log(`[#${idx + 1}] Date: ${p.createdAt}
  Match: ${homeTeam} vs ${awayTeam} (${p.matchId})
  Prediction: ${p.predictedHomeScore} - ${p.predictedAwayScore}
  Match Result: ${actualHome !== null && actualHome !== undefined ? `${actualHome} - ${actualAway}` : "لم تلعب / غير منتهية"} (${matchStatus})
  Status: ${p.status} | Evaluated: ${p.evaluated}
  Result: ${isExact ? "🎯 نتيجة صحيحة بالمللي (Exact)" : isOutcome ? "✅ فائز صحيح (Outcome)" : "❌ غير صحيحة أو لم تنتهي"}`);
  });

  console.log("\n==========================================");
  console.log("             FINAL STATS REPORT           ");
  console.log("==========================================");
  console.log(`User Name: ${userDoc.data()?.displayName}`);
  console.log(`Email: ${userDoc.data()?.email}`);
  console.log(`UID: ${uid}`);
  console.log(`Account ID (koraId): ${userDoc.data()?.koraId || "32252730"}`);
  console.log(`Current Coins (رصيد الكوينز الحالي): ${userDoc.data()?.coins ?? 0}`);
  console.log(`Current Points: ${userDoc.data()?.points ?? 0}`);
  console.log(`Total Predictions (إجمالي التوقعات): ${userPreds.length}`);
  console.log(`Predictions Before Aug 18: ${before18.length}`);
  console.log(`Predictions After Aug 18: ${after18.length}`);
  console.log(`Correct Exact Matches After Aug 18 (توقع بالمللي): ${correctExactCount}`);
  console.log(`Correct Outcome Matches After Aug 18 (توقع فائز/تعادل): ${correctOutcomeCount}`);
  console.log(`Matches Finished & Evaluated: ${finishedCount}`);
  console.log(`Matches Pending / Not Started: ${pendingCount}`);
  console.log("==========================================");

  process.exit(0);
}

checkSpecificUser().catch(e => {
  console.error(e);
  process.exit(1);
});
