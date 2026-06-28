import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

const defaultBuckets = {
    sleep: { name: "Sleep & Recovery", hours: 6.0, color: "accent-charcoal", bgClass: "bg-accent-charcoal/20", borderClass: "border-accent-charcoal", hex: "#4a433b", description: "Essential recovery block" },
    routine: { name: "Routine & Eating", hours: 4.5, color: "accent-ochre", bgClass: "bg-accent-ochre/20", borderClass: "border-accent-ochre", hex: "#a87834", description: "Morning ritual, cooking, eating, chores" },
    work: { name: "Work, Career & L&D", hours: 9.0, color: "accent-sage", bgClass: "bg-accent-sage/20", borderClass: "border-accent-sage", hex: "#5c6e4f", description: "Internship, research, career prep, writing" },
    fitness: { name: "Fitness & Movement", hours: 1.5, color: "accent-terracotta", bgClass: "bg-accent-terracotta/20", borderClass: "border-accent-terracotta", hex: "#bd5338", description: "Gym and workouts" },
    startup: { name: "Own Startup", hours: 2.0, color: "accent-clay", bgClass: "bg-accent-clay/20", borderClass: "border-accent-clay", hex: "#736253", description: "Building MVP, design, and outreach" },
    margin: { name: "Buffer Margin", hours: 1.0, color: "accent-sand", bgClass: "bg-accent-sand/20", borderClass: "border-accent-sand", hex: "#2b241e", description: "Miscellaneous logistics, emails, buffer" }
};

const defaultStartupTasks = [
    { id: "st-1", label: "Draft project proposal outlines", done: true },
    { id: "st-2", label: "Prepare slide decks for team review", done: false },
    { id: "st-3", label: "Refactor API request handling functions", done: false },
    { id: "st-4", label: "Schedule target outreach call windows", done: false }
];

const dailyScheduleTemplate = [
    { id: "sleep-block-1", bucket: "sleep", startHour: 2.0, endHour: 6.0, name: "Deep Sleep & Recovery" },
    { id: "morning-routine-block", bucket: "routine", startHour: 6.0, endHour: 7.5, name: "Morning Routine" },
    { id: "work-block-1", bucket: "work", startHour: 7.5, endHour: 11.5, name: "Internship & Research: Core Depth" },
    { id: "lunch-block", bucket: "routine", startHour: 11.5, endHour: 12.0, name: "Mindful Lunch" },
    { id: "work-block-2", bucket: "work", startHour: 12.0, endHour: 15.0, name: "Internship & Research: Execution" },
    { id: "misc-block", bucket: "margin", startHour: 15.0, endHour: 16.0, name: "Email Chores & Margin" },
    { id: "gym-block", bucket: "fitness", startHour: 16.0, endHour: 17.5, name: "Movement: Gym & Workout" },
    { id: "cook-dinner-block", bucket: "routine", startHour: 17.5, endHour: 19.5, name: "Kitchen Prep & Cooking" },
    { id: "eat-dinner-block", bucket: "routine", startHour: 19.5, endHour: 20.0, name: "Dinner Window" },
    { id: "career-block", bucket: "work", startHour: 20.0, endHour: 21.0, name: "Career Work: Resume & Outreach" },
    { id: "build-block", bucket: "startup", startHour: 21.0, endHour: 23.0, name: "Own Startup: MVP Code" },
    { id: "learning-block", bucket: "work", startHour: 23.0, endHour: 24.0, name: "Technical L&D (Systems)" },
    { id: "sleep-block-2", bucket: "sleep", startHour: 24.0, endHour: 26.0, name: "Night Rest & Sleep" }
];

async function main() {
    const docRef = doc(db, 'users', TARGET_UID, 'schedule', 'state');
    console.log("Writing new dynamic schedule data to Firestore...");
    await setDoc(docRef, {
        buckets: defaultBuckets,
        startupTasks: defaultStartupTasks,
        checklistDatabase: {},
        scheduleBlocks: dailyScheduleTemplate
    });
    console.log("Firestore successfully updated!");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
