// Flow - Main Application Component
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { auth, db, getTasksCol, getBucketsCol, getScheduleDoc, isWorkspace, TARGET_UID } from './firebase';

import BoardView from './components/BoardView';
import ScheduleView from './components/ScheduleView';
import ArchiveModal from './components/ArchiveModal';
import RoutineModal from './components/RoutineModal';
import BudgetModal from './components/BudgetModal';

// Static Defaults
const defaultMorningItems = [
    { id: "water", label: "Drink big glass of water", done: true },
    { id: "exercise", label: "Mild exercise with music on", done: false },
    { id: "bath", label: "Bath (body wash & leave-in conditioner)", done: false },
    { id: "skincare_moisture", label: "Skincare: Moisturizer w/ Niacinamide", done: false },
    { id: "skincare_alt", label: "Skincare: Active Serum (Alternate days)", done: false },
    { id: "sunscreen", label: "Apply daily sunscreen", done: false },
    { id: "breakfast", label: "Cook & have clean breakfast", done: false }
];

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

const START_DATE = new Date(2026, 5, 16); // June 16, 2026
const initialToday = new Date();

export default function App() {
    // Navigation / View Switcher State
    const [activeView, setActiveView] = useState('board');

    // Global Database Sync States
    const [currentUser, setCurrentUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [customBuckets, setCustomBuckets] = useState([]);
    const [dateOffset, setDateOffset] = useState(0);

    // Schedule Grid States
    const [buckets, setBuckets] = useState(defaultBuckets);
    const [checklistDatabase, setChecklistDatabase] = useState({});
    const [startupTasks, setStartupTasks] = useState(defaultStartupTasks);
    const [selectedDate, setSelectedDate] = useState(new Date(2026, 5, 16));
    const [currentScheduleView, setCurrentScheduleView] = useState('week'); // 'week' | 'day'
    const [scheduleBlocks, setScheduleBlocks] = useState(dailyScheduleTemplate);

    // Reactively compute allocation bucket hours from active schedule blocks
    const computedBuckets = useMemo(() => {
        const copy = JSON.parse(JSON.stringify(buckets));
        // Reset all hours to 0
        Object.keys(copy).forEach(k => {
            copy[k].hours = 0;
        });
        // Sum up from active schedule blocks
        scheduleBlocks.forEach(block => {
            if (copy[block.bucket]) {
                copy[block.bucket].hours += (block.endHour - block.startHour);
            }
        });
        // round to 1 decimal place
        Object.keys(copy).forEach(k => {
            copy[k].hours = parseFloat(copy[k].hours.toFixed(1));
        });
        return copy;
    }, [scheduleBlocks, buckets]);

    // UI Indicator states
    const [syncing, setSyncing] = useState(false);
    const [currentFloatHour, setCurrentFloatHour] = useState(0);

    // Modals states
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [isRoutineOpen, setIsRoutineOpen] = useState(false);
    const [routineModalDay, setRoutineModalDay] = useState(new Date(2026, 5, 16));
    const [isBudgetOpen, setIsBudgetOpen] = useState(false);

    // HTML5 Drag-and-Drop States
    const [draggedTaskId, setDraggedTaskId] = useState(null);
    const [draggedBucketId, setDraggedBucketId] = useState(null);
    const originalParentRef = useRef(null);
    const originalSiblingRef = useRef(null);

    const switchView = (view) => {
        setActiveView(view);
    };

    // Undo/Redo History States and Refs
    const undoStackRef = useRef([]);
    const redoStackRef = useRef([]);
    const isSyncingHistoryRef = useRef(false);
    const [historyTrigger, setHistoryTrigger] = useState(0);
    const triggerHistoryRender = () => setHistoryTrigger(prev => prev + 1);

    const pushToUndoStack = () => {
        const snapshot = {
            tasks: JSON.parse(JSON.stringify(tasks)),
            customBuckets: JSON.parse(JSON.stringify(customBuckets))
        };
        undoStackRef.current.push(snapshot);
        if (undoStackRef.current.length > 4) {
            undoStackRef.current.shift();
        }
        redoStackRef.current = [];
        triggerHistoryRender();
    };

    const applySnapshot = async (snapshot) => {
        isSyncingHistoryRef.current = true;
        const { tasks: targetTasks, customBuckets: targetBuckets } = snapshot;

        const tasksToDelete = tasks.filter(t => !targetTasks.some(tt => tt.id === t.id));
        const tasksToSave = targetTasks.filter(tt => {
            const current = tasks.find(t => t.id === tt.id);
            return !current || current.text !== tt.text || current.status !== tt.status || current.bucketId !== tt.bucketId || current.order !== tt.order;
        });

        const bucketsToDelete = customBuckets.filter(b => !targetBuckets.some(tb => tb.id === b.id));
        const bucketsToSave = targetBuckets.filter(tb => {
            const current = customBuckets.find(b => b.id === tb.id);
            return !current || current.title !== tb.title || current.order !== tb.order || current.section !== tb.section;
        });

        setTasks(targetTasks);
        setCustomBuckets(targetBuckets);

        if (currentUser || !isWorkspace) {
            const tasksCol = getTasksCol(currentUser?.uid);
            const bucketsCol = getBucketsCol(currentUser?.uid);

            tasksToDelete.forEach(t => deleteDoc(doc(tasksCol, t.id)).catch(e => console.error(e)));
            tasksToSave.forEach(t => setDoc(doc(tasksCol, t.id), t).catch(e => console.error(e)));
            bucketsToDelete.forEach(b => deleteDoc(doc(bucketsCol, b.id)).catch(e => console.error(e)));
            bucketsToSave.forEach(b => setDoc(doc(bucketsCol, b.id), b).catch(e => console.error(e)));
        }
        triggerSyncIndicator();
        
        // Release the sync lock after a brief timeout to allow remote writes to settle
        setTimeout(() => {
            isSyncingHistoryRef.current = false;
        }, 1000);
    };

    const handleUndo = async () => {
        if (undoStackRef.current.length === 0) return;

        const currentSnapshot = {
            tasks: JSON.parse(JSON.stringify(tasks)),
            customBuckets: JSON.parse(JSON.stringify(customBuckets))
        };
        redoStackRef.current.push(currentSnapshot);
        if (redoStackRef.current.length > 4) {
            redoStackRef.current.shift();
        }

        const previousSnapshot = undoStackRef.current.pop();
        await applySnapshot(previousSnapshot);
        triggerHistoryRender();
    };

    const handleRedo = async () => {
        if (redoStackRef.current.length === 0) return;

        const nextSnapshot = redoStackRef.current.pop();

        const currentSnapshot = {
            tasks: JSON.parse(JSON.stringify(tasks)),
            customBuckets: JSON.parse(JSON.stringify(customBuckets))
        };
        undoStackRef.current.push(currentSnapshot);
        if (undoStackRef.current.length > 4) {
            undoStackRef.current.shift();
        }

        await applySnapshot(nextSnapshot);
        triggerHistoryRender();
    };

    // Keyboard event listener for Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tasks, customBuckets, currentUser]);

    // 1. Initialize Firebase Auth
    useEffect(() => {
        const initAuth = async () => {
            let token = undefined;
            try {
                if (typeof __initial_auth_token !== 'undefined') {
                    token = __initial_auth_token;
                } else if (typeof window !== 'undefined' && window.__initial_auth_token) {
                    token = window.__initial_auth_token;
                }
            } catch (e) {}

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
        };
        initAuth();

        const unsub = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return unsub;
    }, []);

    // 2. Setup Firestore Listeners
    useEffect(() => {
        if (!currentUser) return;

        const tasksCol = getTasksCol(currentUser?.uid);
        const bucketsCol = getBucketsCol(currentUser?.uid);
        const scheduleDocRef = getScheduleDoc(currentUser?.uid);

        const unsubTasks = onSnapshot(tasksCol, (snap) => {
            if (isSyncingHistoryRef.current) return;
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTasks(data);
            triggerSyncIndicator();
        });

        const unsubBuckets = onSnapshot(bucketsCol, (snap) => {
            if (isSyncingHistoryRef.current) return;
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
            setCustomBuckets(data);
            triggerSyncIndicator();
        });

        const unsubSchedule = onSnapshot(scheduleDocRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const isOldBuckets = data.buckets && Object.keys(data.buckets).length > 6;
                const hasOldBucketKeys = data.scheduleBlocks && data.scheduleBlocks.some(b => !['sleep', 'routine', 'work', 'fitness', 'startup', 'margin'].includes(b.bucket));

                if (isOldBuckets || hasOldBucketKeys) {
                    setBuckets(defaultBuckets);
                    setScheduleBlocks(dailyScheduleTemplate);
                    setDoc(scheduleDocRef, {
                        buckets: defaultBuckets,
                        startupTasks: data.startupTasks || defaultStartupTasks,
                        checklistDatabase: data.checklistDatabase || {},
                        scheduleBlocks: dailyScheduleTemplate
                    });
                } else {
                    if (data.buckets) setBuckets(data.buckets);
                    if (data.startupTasks) setStartupTasks(data.startupTasks);
                    if (data.checklistDatabase) setChecklistDatabase(data.checklistDatabase);
                    if (data.scheduleBlocks) setScheduleBlocks(data.scheduleBlocks);
                    else setScheduleBlocks(dailyScheduleTemplate);
                }
                triggerSyncIndicator();
            } else {
                // Initialize default doc
                setDoc(scheduleDocRef, {
                    buckets: defaultBuckets,
                    startupTasks: defaultStartupTasks,
                    checklistDatabase: {},
                    scheduleBlocks: dailyScheduleTemplate
                });
            }
        });

        return () => {
            unsubTasks();
            unsubBuckets();
            unsubSchedule();
        };
    }, [currentUser]);

    // 3. Keep currentFloatHour updated for Live Marker
    useEffect(() => {
        const updateHour = () => {
            const now = new Date();
            setCurrentFloatHour(now.getHours() + now.getMinutes() / 60);
        };
        updateHour();
        const interval = setInterval(updateHour, 15000); // refresh every 15s
        return () => clearInterval(interval);
    }, []);

    // Compute currently active block for zen focus card
    const activeBlock = useMemo(() => {
        let adjustedHour = currentFloatHour;
        if (adjustedHour < 2.0) {
            adjustedHour += 24.0;
        }
        let active = scheduleBlocks.find(b => adjustedHour >= b.startHour && adjustedHour < b.endHour);
        if (!active) {
            active = scheduleBlocks[0] || dailyScheduleTemplate[0]; // fallback
        }
        return active;
    }, [scheduleBlocks, currentFloatHour]);

    // Helpers
    const triggerSyncIndicator = () => {
        setSyncing(true);
        setTimeout(() => setSyncing(false), 2000);
    };

    const formatHour = (h) => {
        let displayHour = Math.floor(h);
        if (displayHour >= 24) {
            displayHour -= 24;
        }
        const mins = Math.round((h % 1) * 60);
        const suffix = displayHour >= 12 ? 'PM' : 'AM';
        let TwelveHour = displayHour;
        if (TwelveHour === 0) TwelveHour = 12;
        if (TwelveHour > 12) TwelveHour = TwelveHour - 12;
        return `${TwelveHour}:${mins.toString().padStart(2, '0')}${suffix}`;
    };

    const getWeekDays = (startDate) => {
        const current = new Date(startDate);
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
        const monday = new Date(current.setDate(diff));
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(new Date(monday));
            monday.setDate(monday.getDate() + 1);
        }
        return days;
    };

    const getTimelineStructure = () => {
        const cols = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(initialToday);
            d.setDate(d.getDate() + dateOffset + i);
            cols.push({
                id: `date-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
                title: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })
            });
        }
        return cols;
    };

    // ==========================================
    // Database Operations (Writes)
    // ==========================================
    const saveTaskDB = (t) => {
        if (currentUser || !isWorkspace) {
            setDoc(doc(getTasksCol(currentUser?.uid), t.id), t);
        }
    };

    const saveBucketDB = (b) => {
        if (currentUser || !isWorkspace) {
            setDoc(doc(getBucketsCol(currentUser?.uid), b.id), b);
        }
    };

    const saveScheduleDB = (updatedBuckets, updatedMilestones, updatedChecklists, updatedBlocks) => {
        if (currentUser || !isWorkspace) {
            const finalBuckets = updatedBuckets || computedBuckets;
            const finalBlocks = updatedBlocks || scheduleBlocks;
            setDoc(getScheduleDoc(currentUser?.uid), {
                buckets: finalBuckets,
                startupTasks: updatedMilestones || startupTasks,
                checklistDatabase: updatedChecklists || checklistDatabase,
                scheduleBlocks: finalBlocks
            }).catch(err => console.error("Firestore write error (schedule):", err));
        }
    };

    const handleMoveScheduleBlock = (blockId, newStart, newEnd) => {
        const updated = scheduleBlocks.map(b => 
            b.id === blockId ? { ...b, startHour: newStart, endHour: newEnd } : b
        );
        setScheduleBlocks(updated);
        saveScheduleDB(computedBuckets, startupTasks, checklistDatabase, updated);
    };

    const handleResizeScheduleBlock = (blockId, newStart, newEnd) => {
        const updated = scheduleBlocks.map(b => 
            b.id === blockId ? { ...b, startHour: newStart, endHour: newEnd } : b
        );
        setScheduleBlocks(updated);
        saveScheduleDB(computedBuckets, startupTasks, checklistDatabase, updated);
    };

    const handleDeleteScheduleBlock = (blockId) => {
        const updated = scheduleBlocks.filter(b => b.id !== blockId);
        setScheduleBlocks(updated);
        saveScheduleDB(computedBuckets, startupTasks, checklistDatabase, updated);
    };

    const handleAddNewScheduleBlock = (name, bucketKey) => {
        const newBlock = {
            id: 'block-' + Date.now(),
            bucket: bucketKey,
            startHour: 12.0,
            endHour: 13.0,
            name: name || computedBuckets[bucketKey]?.name || 'New Block'
        };
        const updated = [...scheduleBlocks, newBlock];
        setScheduleBlocks(updated);
        saveScheduleDB(computedBuckets, startupTasks, checklistDatabase, updated);
    };

    // ==========================================
    // Kanban Actions
    // ==========================================
    const handleAddNewTask = (text, bucketId) => {
        pushToUndoStack();
        const activeCount = tasks.filter(x => x.bucketId === bucketId && x.status === 'active').length;
        const newTask = {
            id: 't' + Date.now(),
            text: text,
            bucketId: bucketId,
            status: 'active',
            order: activeCount
        };
        const updated = [...tasks, newTask];
        setTasks(updated);
        saveTaskDB(newTask);
    };

    const handleUpdateTaskText = (id, text) => {
        const t = tasks.find(x => x.id === id);
        if (t && text.trim() && t.text !== text.trim()) {
            pushToUndoStack();
            t.text = text.trim();
            saveTaskDB(t);
        }
    };

    const handleCompleteTask = (id) => {
        const t = tasks.find(x => x.id === id);
        if (t) {
            pushToUndoStack();
            t.status = 'archived';
            saveTaskDB(t);
        }
    };

    const handleRestoreTask = (id) => {
        const t = tasks.find(x => x.id === id);
        if (t) {
            pushToUndoStack();
            const activeCount = tasks.filter(x => x.bucketId === 'focus' && x.status === 'active').length;
            t.status = 'active';
            t.bucketId = 'focus';
            t.order = activeCount;
            saveTaskDB(t);
        }
    };

    const handleDeleteTask = (id) => {
        if (confirm("Permanently delete this task?")) {
            pushToUndoStack();
            setTasks(prev => prev.filter(x => x.id !== id));
            if (currentUser || !isWorkspace) {
                deleteDoc(doc(getTasksCol(currentUser?.uid), id));
            }
        }
    };

    const handleAddNewSpace = (title, section = 'spaces') => {
        pushToUndoStack();
        const newSpace = {
            id: 'b' + Date.now(),
            title: title,
            section: section,
            order: customBuckets.length
        };
        setCustomBuckets(prev => [...prev, newSpace]);
        saveBucketDB(newSpace);
    };

    const handleUpdateSpaceTitle = (id, text) => {
        const b = customBuckets.find(x => x.id === id);
        if (b && text.trim() && b.title !== text.trim()) {
            pushToUndoStack();
            b.title = text.trim();
            saveBucketDB(b);
        }
    };

    const handleDeleteSpace = (id) => {
        if (confirm("Delete space?")) {
            pushToUndoStack();
            const tasksToDelete = tasks.filter(t => t.bucketId === id);
            setCustomBuckets(prev => prev.filter(x => x.id !== id));
            setTasks(prev => prev.filter(t => t.bucketId !== id));

            if (currentUser || !isWorkspace) {
                deleteDoc(doc(getBucketsCol(currentUser?.uid), id));
                tasksToDelete.forEach(t => {
                    deleteDoc(doc(getTasksCol(currentUser?.uid), t.id));
                });
            }
        }
    };

    // ==========================================
    // Timeline Schedule Actions
    // ==========================================
    const handleToggleZenItem = (itemId) => {
        const todayStr = new Date(2026, 5, 16).toISOString().split('T')[0];
        const nextChecklist = { ...checklistDatabase };
        if (!nextChecklist[todayStr]) {
            nextChecklist[todayStr] = JSON.parse(JSON.stringify(defaultMorningItems));
        }
        const item = nextChecklist[todayStr].find(i => i.id === itemId);
        if (item) {
            item.done = !item.done;
            setChecklistDatabase(nextChecklist);
            saveScheduleDB(buckets, startupTasks, nextChecklist);
        }
    };

    const handleToggleZenItemFromModal = (dateStr, itemId) => {
        const nextChecklist = { ...checklistDatabase };
        if (!nextChecklist[dateStr]) {
            nextChecklist[dateStr] = JSON.parse(JSON.stringify(defaultMorningItems));
        }
        const item = nextChecklist[dateStr].find(i => i.id === itemId);
        if (item) {
            item.done = !item.done;
            setChecklistDatabase(nextChecklist);
            saveScheduleDB(buckets, startupTasks, nextChecklist);
        }
    };

    const handleToggleStartupTask = (id) => {
        const updated = startupTasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
        setStartupTasks(updated);
        saveScheduleDB(buckets, updated, checklistDatabase);
    };

    const handleAddNewStartupTask = (label) => {
        const newTask = { id: 'st-' + Date.now(), label, done: false };
        const updated = [...startupTasks, newTask];
        setStartupTasks(updated);
        saveScheduleDB(buckets, updated, checklistDatabase);
    };

    const handleDeleteStartupTask = (id) => {
        const updated = startupTasks.filter(t => t.id !== id);
        setStartupTasks(updated);
        saveScheduleDB(buckets, updated, checklistDatabase);
    };

    const handleSaveBudget = (updatedBuckets) => {
        // Rebuild blocks sequentially based on new budget
        let startCursor = 2.0; // Start at 2 AM
        const rebuiltBlocks = scheduleBlocks.map(block => {
            const hours = updatedBuckets[block.bucket]?.hours ?? 0;
            const count = scheduleBlocks.filter(b => b.bucket === block.bucket).length || 1;
            const duration = hours / count;
            const start = startCursor;
            const end = Math.min(26.0, startCursor + duration);
            startCursor = end;
            return {
                ...block,
                startHour: start,
                endHour: end
            };
        });
        setBuckets(updatedBuckets);
        setScheduleBlocks(rebuiltBlocks);
        saveScheduleDB(updatedBuckets, startupTasks, checklistDatabase, rebuiltBlocks);
    };

    const handleResetBudget = () => {
        const resetBuckets = JSON.parse(JSON.stringify(defaultBuckets));
        return resetBuckets;
    };

    const handleResetBudgetDefaultsAndRefresh = () => {
        const resetBuckets = JSON.parse(JSON.stringify(defaultBuckets));
        setBuckets(resetBuckets);
        setScheduleBlocks(dailyScheduleTemplate);
        saveScheduleDB(resetBuckets, startupTasks, checklistDatabase, dailyScheduleTemplate);
    };

    const handleShowGenericBlockDetails = (block, day) => {
        const meta = buckets[block.bucket] || {};
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-6 right-6 bg-panel border border-border p-4 rounded-xl shadow-2xl z-50 flex flex-col gap-2 max-w-sm transition-all duration-300 transform translate-y-0 opacity-100';
        toast.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" style="background-color: ${meta.hex}"></span>
                    <h4 class="text-stone-900 font-semibold font-sans">${block.name}</h4>
                </div>
                <button class="text-xs text-muted hover:text-stone-900" onclick="this.parentElement.parentElement.remove()"><i class="ph ph-x"></i></button>
            </div>
            <p class="text-xs text-muted font-medium">${meta.description}</p>
            <div class="text-[10px] text-stone-600 bg-canvas px-2.5 py-1 rounded border border-border/60 self-start font-bold mt-1">
                Scheduled on ${day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <div class="text-[10px] text-muted self-end font-mono">
                <span class="text-stone-950">${formatHour(block.startHour)} - ${formatHour(block.endHour)}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 4000);
    };

    // ==========================================
    // Native HTML5 Drag and Drop Handlers (React Port)
    // ==========================================
    const handleDragStartTask = (ev, taskId) => {
        ev.stopPropagation();
        setDraggedTaskId(taskId);
        
        const draggedDOM = document.getElementById(taskId);
        if (draggedDOM) {
            originalParentRef.current = draggedDOM.parentElement;
            originalSiblingRef.current = draggedDOM.nextSibling;
        }

        ev.currentTarget.classList.add('dragging');
    };

    const handleDragEndTask = (ev) => {
        ev.currentTarget.classList.remove('dragging');
        
        const draggedDOM = document.getElementById(draggedTaskId);
        
        // 1. Gather all required state updates from the DOM structure
        const updates = [];
        document.querySelectorAll('.board-column').forEach(col => {
            const colId = col.id.replace('board-', '');
            col.querySelectorAll('.task-card').forEach((card, idx) => {
                const t = tasks.find(x => x.id === card.id);
                if (t && (t.bucketId !== colId || t.order !== idx)) {
                    updates.push({ task: t, newBucketId: colId, newOrder: idx });
                }
            });
        });

        // 2. Restore DOM to original state before state change to prevent React crash
        if (draggedDOM && originalParentRef.current) {
            const sibling = originalSiblingRef.current;
            if (sibling && sibling.parentNode === originalParentRef.current) {
                originalParentRef.current.insertBefore(draggedDOM, sibling);
            } else {
                originalParentRef.current.appendChild(draggedDOM);
            }
        }
        
        originalParentRef.current = null;
        originalSiblingRef.current = null;
        setDraggedTaskId(null);
        document.querySelectorAll('.board-container').forEach(c => c.classList.remove('drag-over'));

        // 3. Apply updates to state
        if (updates.length > 0) {
            pushToUndoStack();
            setTasks(prev => {
                const copy = [...prev];
                updates.forEach(({ task, newBucketId, newOrder }) => {
                    const t = copy.find(x => x.id === task.id);
                    if (t) {
                        t.bucketId = newBucketId;
                        t.order = newOrder;
                        saveTaskDB(t);
                    }
                });
                return copy;
            });
        }
    };

    const handleDragOverColumn = (ev, colId) => {
        ev.preventDefault();
        if (!draggedTaskId) return;
        ev.currentTarget.classList.add('drag-over');

        const colDOM = document.getElementById(`board-${colId}`);
        const cardDOMs = [...colDOM.querySelectorAll('.task-card:not(.dragging)')];
        const afterDOM = cardDOMs.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = ev.clientY - (box.top + box.height / 2);
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;

        const draggedDOM = document.getElementById(draggedTaskId);
        if (draggedDOM) {
            if (!afterDOM) colDOM.appendChild(draggedDOM);
            else colDOM.insertBefore(draggedDOM, afterDOM);
        }
    };

    const handleDragLeaveColumn = (ev) => {
        const container = ev.currentTarget;
        if (container && !container.contains(ev.relatedTarget)) {
            container.classList.remove('drag-over');
        }
    };

    const handleDropOnColumn = (ev) => {
        ev.preventDefault();
    };

    const handleDragBucketStart = (ev, bucketId) => {
        ev.stopPropagation();
        setDraggedBucketId(bucketId);
        ev.currentTarget.classList.add('opacity-40');
    };

    const handleDragBucketOver = (ev) => {
        ev.preventDefault();
        if (!draggedBucketId) return;

        const bucket = customBuckets.find(cb => cb.id === draggedBucketId);
        if (!bucket) return;
        const containerId = bucket.section === 'focus' ? 'focus-boards' : 'custom-boards';
        const container = document.getElementById(containerId);
        if (!container) return;

        const draggables = [...container.querySelectorAll('.board-container:not(.opacity-40)')];
        const afterDOM = draggables.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = ev.clientX - (box.left + box.width / 2);
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;

        const draggedDOM = container.querySelector(`[data-bucket="${draggedBucketId}"]`);
        const inputDOM = document.getElementById(bucket.section === 'focus' ? 'new-focus-container' : 'new-bucket-container');
        if (draggedDOM) {
            if (!afterDOM) container.insertBefore(draggedDOM, inputDOM);
            else container.insertBefore(draggedDOM, afterDOM);
        }
    };

    const handleDragBucketDrop = (ev) => {
        ev.preventDefault();
    };

    const handleDragBucketEnd = (ev) => {
        ev.currentTarget.classList.remove('opacity-40');
        
        const bucket = customBuckets.find(cb => cb.id === draggedBucketId);
        setDraggedBucketId(null);
        if (!bucket) return;

        const containerId = bucket.section === 'focus' ? 'focus-boards' : 'custom-boards';
        const boards = document.getElementById(containerId).querySelectorAll('.board-container[data-bucket]');
        
        let changed = false;
        boards.forEach((b, i) => {
            const bucketId = b.getAttribute('data-bucket');
            if (bucketId === 'focus') return;
            const cb = customBuckets.find(x => x.id === bucketId);
            if (cb && cb.order !== i) {
                changed = true;
            }
        });

        if (changed) {
            pushToUndoStack();
            let orderIndex = 0;
            boards.forEach((b) => {
                const bucketId = b.getAttribute('data-bucket');
                if (bucketId === 'focus') return;
                const cb = customBuckets.find(x => x.id === bucketId);
                if (cb) {
                    if (cb.order !== orderIndex) {
                        cb.order = orderIndex;
                        saveBucketDB(cb);
                    }
                    orderIndex++;
                }
            });
            setCustomBuckets(prev => [...prev].sort((a, b) => (a.order || 0) - (b.order || 0)));
        }
    };

    // Toggle stylesheet references / bg colors
    useEffect(() => {
        if (activeView === 'board') {
            document.body.style.backgroundColor = '#FDFDFC'; // Cream background
        } else {
            document.body.style.backgroundColor = '#fdfbfa'; // Canvas background
        }
    }, [activeView]);

    const timelineDays = getTimelineStructure();

    return (
        <div className="h-screen flex flex-col antialiased select-none overflow-hidden">
            {/* Unified Navbar */}
            <nav className="flex items-center justify-between px-8 py-3.5 bg-charcoal text-white sticky top-0 z-50 shadow-sm shrink-0">
                <div className="w-1/3 flex items-center justify-start gap-3">
                    <span className="text-[13px] font-medium" id="current-date-display">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                    <span
                        id="cloud-sync-indicator"
                        className={`text-[10px] text-gray-400 transition-opacity flex items-center gap-1 ${syncing ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <i className="fa-solid fa-cloud"></i> Synced
                    </span>
                </div>

                <div className="w-1/3 flex items-center justify-center gap-2 cursor-pointer group" onClick={() => location.reload()}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white group-hover:scale-125 transition-transform"></div>
                    <h1 className="text-[26px] font-caveat font-semibold tracking-wider text-white group-hover:text-gray-200 transition-colors mt-1">
                        Flow
                    </h1>
                </div>

                <div className="flex gap-6 items-center text-[17px] text-gray-300 w-1/3 justify-end">
                    {/* Switch View Buttons */}
                    <div className="flex bg-white/10 p-0.5 rounded-lg border border-white/5 text-xs mr-2">
                        <button
                            onClick={() => switchView('board')}
                            className={`px-3 py-1 rounded font-semibold transition-all duration-200 ${activeView === 'board' ? 'bg-white text-charcoal shadow-sm' : 'text-gray-300 hover:text-white'}`}
                        >
                            Board
                        </button>
                        <button
                            onClick={() => switchView('schedule')}
                            className={`px-3 py-1 rounded font-semibold transition-all duration-200 ${activeView === 'schedule' ? 'bg-white text-charcoal shadow-sm' : 'text-gray-300 hover:text-white'}`}
                        >
                            Schedule
                        </button>
                    </div>

                    {/* Undo/Redo Controls */}
                    <div className="flex gap-4 text-[15px] mr-2 border-r border-white/10 pr-4">
                        <button 
                            onClick={handleUndo} 
                            title="Undo (Ctrl+Z)"
                            className="hover:text-white transition flex items-center text-gray-300 disabled:opacity-30 disabled:hover:text-gray-300"
                            disabled={undoStackRef.current.length === 0}
                        >
                            <i className="fa-solid fa-rotate-left"></i>
                        </button>
                        <button 
                            onClick={handleRedo} 
                            title="Redo (Ctrl+Y)"
                            className="hover:text-white transition flex items-center text-gray-300 disabled:opacity-30 disabled:hover:text-gray-300"
                            disabled={redoStackRef.current.length === 0}
                        >
                            <i className="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>

                    <button onClick={() => setIsArchiveOpen(true)} title="Archive"><i className="fa-solid fa-box-archive"></i></button>
                    <button title="Settings"><i className="fa-solid fa-gear"></i></button>
                </div>
            </nav>

            {/* Layout Toggling */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {activeView === 'board' ? (
                    <BoardView
                        tasks={tasks}
                        customBuckets={customBuckets}
                        dateOffset={dateOffset}
                        timelineDays={timelineDays}
                        onShiftDate={setDateOffset}
                        onAddNewTask={handleAddNewTask}
                        onUpdateTaskText={handleUpdateTaskText}
                        onCompleteTask={handleCompleteTask}
                        onAddNewSpace={handleAddNewSpace}
                        onUpdateSpaceTitle={handleUpdateSpaceTitle}
                        onDeleteSpace={handleDeleteSpace}

                        onDragStartTask={handleDragStartTask}
                        onDragEndTask={handleDragEndTask}
                        onDragOverColumn={handleDragOverColumn}
                        onDragLeaveColumn={handleDragLeaveColumn}
                        onDropOnColumn={handleDropOnColumn}
                        onDragBucketStart={handleDragBucketStart}
                        onDragBucketEnd={handleDragBucketEnd}
                        onDragBucketOver={handleDragBucketOver}
                        onDragBucketDrop={handleDragBucketDrop}
                    />
                ) : (
                    <ScheduleView
                        buckets={computedBuckets}
                        startupTasks={startupTasks}
                        checklistDatabase={checklistDatabase}
                        defaultMorningItems={defaultMorningItems}
                        activeBlock={activeBlock}
                        currentFloatHour={currentFloatHour}
                        selectedDate={selectedDate}
                        currentView={currentScheduleView}
                        dailyScheduleTemplate={scheduleBlocks}
                        onToggleZenItem={handleToggleZenItem}
                        onToggleStartupTask={handleToggleStartupTask}
                        onAddNewStartupTask={handleAddNewStartupTask}
                        onDeleteStartupTask={handleDeleteStartupTask}
                        onResetBudgetDefaultsAndRefresh={handleResetBudgetDefaultsAndRefresh}
                        onMoveScheduleBlock={handleMoveScheduleBlock}
                        onResizeScheduleBlock={handleResizeScheduleBlock}
                        onDeleteScheduleBlock={handleDeleteScheduleBlock}
                        onAddScheduleBlock={handleAddNewScheduleBlock}

                        onChangeWeek={(dir) => {
                            setSelectedDate(prev => {
                                const next = new Date(prev);
                                const offset = currentScheduleView === 'day' ? 1 : 7;
                                next.setDate(next.getDate() + dir * offset);
                                return next;
                            });
                        }}
                        onGoToToday={() => setSelectedDate(new Date(START_DATE))}
                        onOpenRoutineModal={(day) => {
                            setRoutineModalDay(day);
                            setIsRoutineOpen(true);
                        }}
                        onOpenBudgetModal={() => setIsBudgetOpen(true)}
                        onShowGenericBlockDetails={handleShowGenericBlockDetails}
                        getWeekDays={getWeekDays}
                        formatHour={formatHour}
                        setView={setCurrentScheduleView}
                    />
                )}
            </div>

            {/* Modals Mounting */}
            <ArchiveModal
                isOpen={isArchiveOpen}
                onToggle={() => setIsArchiveOpen(false)}
                tasks={tasks.filter(t => t.status === 'archived')}
                onRestore={handleRestoreTask}
                onDelete={handleDeleteTask}
            />

            <RoutineModal
                isOpen={isRoutineOpen}
                onClose={() => setIsRoutineOpen(false)}
                day={routineModalDay}
                checklistDatabase={checklistDatabase}
                defaultMorningItems={defaultMorningItems}
                onToggleZenItem={handleToggleZenItemFromModal}
                onToggleSkincareDay={() => {
                    const dateStr = routineModalDay.toISOString().split('T')[0];
                    const textEl = document.getElementById('skincare-alt-text');
                    if (textEl) {
                        if (textEl.textContent.includes("Vitamin C")) {
                            textEl.textContent = "Today: Niacinamide Alternate overridden";
                        } else {
                            textEl.textContent = "Today: Vitamin C Serum overridden";
                        }
                    }
                }}
            />

            <BudgetModal
                isOpen={isBudgetOpen}
                onClose={() => setIsBudgetOpen(false)}
                buckets={buckets}
                onSaveBudget={handleSaveBudget}
                onResetBudget={handleResetBudget}
            />
        </div>
    );
}
