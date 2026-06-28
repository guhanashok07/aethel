import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDVHbinwIHJSywslHkNacI85soMsTYcL5s",
    authDomain: "flow-2026-1c372.firebaseapp.com",
    projectId: "flow-2026-1c372",
    storageBucket: "flow-2026-1c372.firebasestorage.app",
    messagingSenderId: "979216051731",
    appId: "1:979216051731:web:5676c5745c7b68974b99e6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const TARGET_UID = "uylt0NsWhJdWeljT6yui0cMkLAr1";

async function run() {
    try {
        console.log("Fetching tasks for TARGET_UID:", TARGET_UID);
        const snap = await getDocs(collection(db, 'users', TARGET_UID, 'tasks'));
        console.log(`Found ${snap.size} tasks.`);
        snap.forEach(doc => {
            console.log(doc.id, "=>", doc.data());
        });

        console.log("Fetching customBuckets for TARGET_UID:", TARGET_UID);
        const snapBuckets = await getDocs(collection(db, 'users', TARGET_UID, 'customBuckets'));
        console.log(`Found ${snapBuckets.size} customBuckets.`);
        snapBuckets.forEach(doc => {
            console.log(doc.id, "=>", doc.data());
        });
    } catch (err) {
        console.error("Error fetching Firestore:", err);
    }
    process.exit(0);
}

run();
