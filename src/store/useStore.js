import { create } from 'zustand';
import { onSnapshot, setDoc, doc, deleteDoc, getDocs, getDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import {
    auth,
    getEntitiesCol,
    getRelationsCol,
    getTasksCol,
    getBucketsCol,
    getScheduleDoc,
    isWorkspace
} from '../firebase';

let unsubEntities = null;
let unsubRelations = null;

// Default Static fallbacks
const defaultBucketsConfig = {
    sleep: { name: "Sleep & Recovery", hours: 6.0, color: "accent-charcoal", bgClass: "bg-accent-charcoal/20", borderClass: "border-accent-charcoal", hex: "#4a433b", description: "Essential recovery block" },
    routine: { name: "Routine & Eating", hours: 4.5, color: "accent-ochre", bgClass: "bg-accent-ochre/20", borderClass: "border-accent-ochre", hex: "#a87834", description: "Morning ritual, cooking, eating, chores" },
    work: { name: "Work, Career & L&D", hours: 9.0, color: "accent-sage", bgClass: "bg-accent-sage/20", borderClass: "border-accent-sage", hex: "#5c6e4f", description: "Internship, research, career prep, writing" },
    fitness: { name: "Fitness & Movement", hours: 1.5, color: "accent-terracotta", bgClass: "bg-accent-terracotta/20", borderClass: "border-accent-terracotta", hex: "#bd5338", description: "Gym and workouts" },
    startup: { name: "Own Startup", hours: 2.0, color: "accent-clay", bgClass: "bg-accent-clay/20", borderClass: "border-accent-clay", hex: "#736253", description: "Building MVP, design, and outreach" },
    margin: { name: "Buffer Margin", hours: 1.0, color: "accent-sand", bgClass: "bg-accent-sand/20", borderClass: "border-accent-sand", hex: "#2b241e", description: "Miscellaneous logistics, emails, buffer" }
};

const defaultScheduleTemplate = [
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
    { id: "sleep-block-2", bucket: "sleep", startHour: 24.0, endHour: 30.0, name: "Sleep & Recovery" }
];

export const useStore = create((set, get) => ({
    // Reactive States
    currentUser: null,
    entities: [],
    relations: [],
    selectedDate: new Date(),
    currentFloatHour: 0,
    currentScheduleView: 'week',
    syncing: false,

    // Undo / Redo stacks
    undoStack: [],
    redoStack: [],
    isSyncingHistory: false,

    // Initialize Auth
    initAuth: async () => {
        let token = undefined;
        try {
            if (typeof __initial_auth_token !== 'undefined') {
                token = __initial_auth_token;
            } else if (typeof window !== 'undefined' && window.__initial_auth_token) {
                token = window.__initial_auth_token;
            }
        } catch (e) {}

        const onLogin = (user) => {
            set({ currentUser: user });
            if (user) {
                get().syncDatabase(user.uid);
            }
        };

        onAuthStateChanged(auth, onLogin);

        if (token) {
            await signInWithCustomToken(auth, token).catch((err) => {
                console.error("Custom token sign in failed, falling back to anonymous:", err);
                return signInAnonymously(auth);
            });
        } else {
            await signInAnonymously(auth).catch((err) => {
                console.error("Anonymous sign in failed:", err);
            });
        }
    },

    // Sync Database Snapshots
    syncDatabase: (uid) => {
        if (unsubEntities) unsubEntities();
        if (unsubRelations) unsubRelations();

        const entitiesCol = getEntitiesCol(uid);
        const relationsCol = getRelationsCol(uid);

        // Active Listeners
        unsubEntities = onSnapshot(entitiesCol, async (snap) => {
            if (get().isSyncingHistory) return;
            
            // Check if database is empty to execute the one-time migration
            if (snap.empty) {
                const migrated = await get().checkAndRunMigration(uid);
                if (migrated) return; // Snapshot listener will re-fire with the new data
            }

            const entities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            set({ entities });
            get().triggerSyncIndicator();
        });

        unsubRelations = onSnapshot(relationsCol, (snap) => {
            if (get().isSyncingHistory) return;
            const relations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            set({ relations });
            get().triggerSyncIndicator();
        });
    },

    // One-Time Auto Migration logic
    checkAndRunMigration: async (uid) => {
        const tasksCol = getTasksCol(uid);
        const bucketsCol = getBucketsCol(uid);
        const scheduleDocRef = getScheduleDoc(uid);

        // Check if legacy data exists
        const [tasksSnap, bucketsSnap, scheduleSnap] = await Promise.all([
            getDocs(tasksCol),
            getDocs(bucketsCol),
            getDoc(scheduleDocRef)
        ]);

        if (tasksSnap.empty && bucketsSnap.empty && !scheduleSnap.exists()) {
            // No legacy data to migrate, initialize default project config
            const db = getEntitiesCol(uid);
            const defaultConfigEntity = {
                id: 'buckets_config',
                type: 'config',
                title: 'Buckets Config',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                properties: { buckets: defaultBucketsConfig }
            };
            await setDoc(doc(db, defaultConfigEntity.id), defaultConfigEntity);

            // Seed default events
            const batch = writeBatch(getEntitiesCol(uid).firestore);
            defaultScheduleTemplate.forEach((block) => {
                const entity = {
                    id: block.id,
                    type: 'event',
                    title: block.name,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    properties: {
                        bucketKey: block.bucket,
                        startHour: block.startHour,
                        endHour: block.endHour
                    }
                };
                batch.set(doc(getEntitiesCol(uid), entity.id), entity);
            });
            await batch.commit();
            return true;
        }

        console.log("Legacy data detected. Initiating auto-migration to EAV+R...");
        const dbEntities = getEntitiesCol(uid);
        const batch = writeBatch(dbEntities.firestore);

        // 1. Migrate custom buckets
        bucketsSnap.forEach(docSnap => {
            const data = docSnap.data();
            const entity = {
                id: docSnap.id,
                type: 'bucket',
                title: data.title || 'Untitled Space',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                properties: {
                    section: data.section || 'spaces',
                    order: data.order || 0
                }
            };
            batch.set(doc(dbEntities, entity.id), entity);
        });

        // 2. Migrate tasks
        tasksSnap.forEach(docSnap => {
            const data = docSnap.data();
            const entity = {
                id: docSnap.id,
                type: 'task',
                title: data.text || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                properties: {
                    bucketId: data.bucketId || 'focus',
                    status: data.status || 'active',
                    order: data.order || 0
                }
            };
            batch.set(doc(dbEntities, entity.id), entity);
        });

        // 3. Migrate schedule state document configurations
        if (scheduleSnap.exists()) {
            const data = scheduleSnap.data();

            // Config entity
            const configEntity = {
                id: 'buckets_config',
                type: 'config',
                title: 'Buckets Config',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                properties: { buckets: data.buckets || defaultBucketsConfig }
            };
            batch.set(doc(dbEntities, configEntity.id), configEntity);

            // Startup Tasks (mapped to type: 'task' under bucket: 'startup')
            const startupTasks = data.startupTasks || [];
            startupTasks.forEach((t) => {
                const entity = {
                    id: t.id || 'st-' + Date.now(),
                    type: 'task',
                    title: t.label,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    properties: {
                        bucketId: 'startup',
                        status: t.done ? 'done' : 'active',
                        order: 0
                    }
                };
                batch.set(doc(dbEntities, entity.id), entity);
            });

            // Checklist Database (mapped to type: 'journal' daily checklists)
            const checklistDb = data.checklistDatabase || {};
            Object.entries(checklistDb).forEach(([dateStr, items]) => {
                const entity = {
                    id: `checklist-${dateStr}`,
                    type: 'journal',
                    title: `Checklist for ${dateStr}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    properties: { items }
                };
                batch.set(doc(dbEntities, entity.id), entity);
            });

            // Schedule blocks (mapped to type: 'event')
            const blocks = data.scheduleBlocks || defaultScheduleTemplate;
            blocks.forEach((block) => {
                const entity = {
                    id: block.id,
                    type: 'event',
                    title: block.name,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    properties: {
                        bucketKey: block.bucket,
                        startHour: block.startHour,
                        endHour: block.endHour
                    }
                };
                batch.set(doc(dbEntities, entity.id), entity);
            });
        }

        // Commit all migrated documents to the new entities collection
        await batch.commit();
        console.log("Migration to EAV+R complete.");
        return true;
    },

    // CRUD Write Operations for Entities
    saveEntity: async (entity) => {
        const uid = get().currentUser?.uid;
        if (!uid && isWorkspace) return;
        
        const entitiesCol = getEntitiesCol(uid);
        await setDoc(doc(entitiesCol, entity.id), entity);
    },

    deleteEntity: async (id) => {
        const uid = get().currentUser?.uid;
        if (!uid && isWorkspace) return;
        
        get().pushToUndoStack();
        const entitiesCol = getEntitiesCol(uid);
        await deleteDoc(doc(entitiesCol, id));
    },

    // CRUD Write Operations for Relations
    saveRelation: async (relation) => {
        const uid = get().currentUser?.uid;
        if (!uid && isWorkspace) return;

        const relationsCol = getRelationsCol(uid);
        await setDoc(doc(relationsCol, relation.id), relation);
    },

    deleteRelation: async (id) => {
        const uid = get().currentUser?.uid;
        if (!uid && isWorkspace) return;

        const relationsCol = getRelationsCol(uid);
        await deleteDoc(doc(relationsCol, id));
    },

    // Local State Modifiers
    setSelectedDate: (date) => set({ selectedDate: date }),
    setCurrentFloatHour: (hour) => set({ currentFloatHour: hour }),
    setCurrentScheduleView: (view) => set({ currentScheduleView: view }),

    // History Transactions (Undo / Redo)
    pushToUndoStack: () => {
        const snapshot = {
            entities: JSON.parse(JSON.stringify(get().entities)),
            relations: JSON.parse(JSON.stringify(get().relations))
        };
        const undoStack = [...get().undoStack, snapshot];
        if (undoStack.length > 5) undoStack.shift(); // Cap history length
        set({ undoStack, redoStack: [] });
    },

    applySnapshot: async (snapshot) => {
        set({ isSyncingHistory: true });
        const { entities: targetEntities, relations: targetRelations } = snapshot;
        const uid = get().currentUser?.uid;

        if (uid || !isWorkspace) {
            const entitiesCol = getEntitiesCol(uid);
            const relationsCol = getRelationsCol(uid);

            const currentEntities = get().entities;
            const currentRelations = get().relations;

            // Compute deletions and edits
            const entitiesToDelete = currentEntities.filter(e => !targetEntities.some(te => te.id === e.id));
            const entitiesToSave = targetEntities.filter(te => {
                const current = currentEntities.find(e => e.id === te.id);
                return !current || JSON.stringify(current) !== JSON.stringify(te);
            });

            const relationsToDelete = currentRelations.filter(r => !targetRelations.some(tr => tr.id === r.id));
            const relationsToSave = targetRelations.filter(tr => {
                const current = currentRelations.find(r => r.id === tr.id);
                return !current || JSON.stringify(current) !== JSON.stringify(tr);
            });

            // Set local state immediately for visual snappiness
            set({ entities: targetEntities, relations: targetRelations });

            // Batch writes to Firestore
            entitiesToDelete.forEach(e => deleteDoc(doc(entitiesCol, e.id)).catch(err => console.error(err)));
            entitiesToSave.forEach(e => setDoc(doc(entitiesCol, e.id), e).catch(err => console.error(err)));
            relationsToDelete.forEach(r => deleteDoc(doc(relationsCol, r.id)).catch(err => console.error(err)));
            relationsToSave.forEach(r => setDoc(doc(relationsCol, r.id), r).catch(err => console.error(err)));
        }

        setTimeout(() => {
            set({ isSyncingHistory: false });
        }, 1000);
    },

    handleUndo: async () => {
        const undoStack = [...get().undoStack];
        if (undoStack.length === 0) return;

        const currentSnapshot = {
            entities: JSON.parse(JSON.stringify(get().entities)),
            relations: JSON.parse(JSON.stringify(get().relations))
        };
        const redoStack = [...get().redoStack, currentSnapshot];
        if (redoStack.length > 5) redoStack.shift();

        const previousSnapshot = undoStack.pop();
        set({ undoStack, redoStack });
        await get().applySnapshot(previousSnapshot);
    },

    handleRedo: async () => {
        const redoStack = [...get().redoStack];
        if (redoStack.length === 0) return;

        const nextSnapshot = redoStack.pop();
        const currentSnapshot = {
            entities: JSON.parse(JSON.stringify(get().entities)),
            relations: JSON.parse(JSON.stringify(get().relations))
        };
        const undoStack = [...get().undoStack, currentSnapshot];
        if (undoStack.length > 5) undoStack.shift();

        set({ undoStack, redoStack });
        await get().applySnapshot(nextSnapshot);
    },

    triggerSyncIndicator: () => {
        set({ syncing: true });
        setTimeout(() => set({ syncing: false }), 2000);
    }
}));
