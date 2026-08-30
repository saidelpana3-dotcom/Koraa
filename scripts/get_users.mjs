import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' assert { type: 'json' };

async function fetchAllUsers() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    
    console.log("Fetching users from Firestore database:", firebaseConfig.firestoreDatabaseId);
    const usersSnap = await getDocs(collection(db, 'users'));
    
    console.log(`\n=== إجمالي عدد المستخدمين (Total Users): ${usersSnap.size} ===\n`);
    
    const usersList = [];
    usersSnap.forEach((doc) => {
      const data = doc.data();
      usersList.push({
        id: doc.id,
        name: data.displayName || data.email || 'مستخدم بدون اسم',
        email: data.email || '',
        coins: typeof data.points === 'number' ? data.points : 0,
        predictionPoints: typeof data.predictionPoints === 'number' ? data.predictionPoints : 0,
        koraId: data.koraId || '',
      });
    });

    // Sort by coins descending
    usersList.sort((a, b) => b.coins - a.coins);

    usersList.forEach((u, index) => {
      console.log(`${index + 1}. ${u.name} - الكوينز (النقاط): ${u.coins} كوينز | (المعرف: ${u.koraId || u.id})`);
    });

    console.log("\nJSON_OUTPUT_START");
    console.log(JSON.stringify(usersList, null, 2));
    console.log("JSON_OUTPUT_END");
  } catch (error) {
    console.error("Error fetching users:", error);
  }
  process.exit(0);
}

fetchAllUsers();
