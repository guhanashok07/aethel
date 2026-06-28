import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDVHbinwIHJSywslHkNacI85soMsTYcL5s",
    authDomain: "flow-2026-1c372.firebaseapp.com",
    projectId: "flow-2026-1c372",
    storageBucket: "flow-2026-1c372.firebasestorage.app",
    messagingSenderId: "979216051731",
    appId: "1:979216051731:web:5676c5745c7b68974b99e6",
    measurementId: "G-3YQ9ERDPKL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const TARGET_UID = "uylt0NsWhJdWeljT6yui0cMkLAr1";

async function main() {
    const docRef = doc(db, 'users', TARGET_UID, 'schedule', 'state');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        console.log("FIRESTORE DATA:");
        console.log(JSON.stringify(snap.data(), null, 2));
    } else {
        console.log("Document does not exist");
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
