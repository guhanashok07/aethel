import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc } from 'firebase/firestore';

const backupFirebaseConfig = {
    apiKey: "AIzaSyDVHbinwIHJSywslHkNacI85soMsTYcL5s",
    authDomain: "flow-2026-1c372.firebaseapp.com",
    projectId: "flow-2026-1c372",
    storageBucket: "flow-2026-1c372.firebasestorage.app",
    messagingSenderId: "979216051731",
    appId: "1:979216051731:web:5676c5745c7b68974b99e6",
    measurementId: "G-3YQ9ERDPKL"
};

// Pull dynamic config if defined in global scope or window context
let firebaseConfig = backupFirebaseConfig;
try {
    if (typeof __firebase_config !== 'undefined') {
        firebaseConfig = JSON.parse(__firebase_config);
    } else if (typeof window !== 'undefined' && window.__firebase_config) {
        firebaseConfig = JSON.parse(window.__firebase_config);
    }
} catch (e) {}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Constant targets
export const TARGET_UID = "uylt0NsWhJdWeljT6yui0cMkLAr1";

let resolvedAppId = 'default-app-id';
let resolvedIsWorkspace = false;
try {
    if (typeof __app_id !== 'undefined') {
        resolvedAppId = __app_id;
        resolvedIsWorkspace = true;
    } else if (typeof window !== 'undefined') {
        if (window.__app_id) {
            resolvedAppId = window.__app_id;
            resolvedIsWorkspace = true;
        }
        if (window.location.hostname.includes('usercontent.goog')) {
            resolvedIsWorkspace = true;
        }
    }
} catch (e) {}

export const appId = resolvedAppId;
export const isWorkspace = resolvedIsWorkspace;

export const getTasksCol = (uid) => {
    if (isWorkspace && uid) {
        return collection(db, 'artifacts', appId, 'users', uid, 'tasks');
    }
    return collection(db, 'users', TARGET_UID, 'tasks');
};

export const getBucketsCol = (uid) => {
    if (isWorkspace && uid) {
        return collection(db, 'artifacts', appId, 'users', uid, 'customBuckets');
    }
    return collection(db, 'users', TARGET_UID, 'customBuckets');
};

export const getScheduleDoc = (uid) => {
    if (isWorkspace && uid) {
        return doc(db, 'artifacts', appId, 'users', uid, 'schedule', 'state');
    }
    return doc(db, 'users', TARGET_UID, 'schedule', 'state');
};

export const getEntitiesCol = (uid) => {
    if (isWorkspace && uid) {
        return collection(db, 'artifacts', appId, 'users', uid, 'entities');
    }
    return collection(db, 'users', TARGET_UID, 'entities');
};

export const getRelationsCol = (uid) => {
    if (isWorkspace && uid) {
        return collection(db, 'artifacts', appId, 'users', uid, 'relations');
    }
    return collection(db, 'users', TARGET_UID, 'relations');
};

export { app, auth, db };
