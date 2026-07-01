// Flow - Main Application Component (Decoupled Zustand edition)
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from './store/useStore';

import BoardView from './components/BoardView';
import ScheduleView from './components/ScheduleView';
import HomeView from './components/HomeView';
import ArchiveModal from './components/ArchiveModal';
import RoutineModal from './components/RoutineModal';
import BudgetModal from './components/BudgetModal';

// Static Defaults
const defaultHabitGroups = [
    {
        id: 'morning',
        label: 'Morning Routine',
        icon: '☀️',
        items: [
            { id: 'exercise', label: 'Quick exercise', done: false },
            { id: 'water_am', label: 'Water', done: false },
            { id: 'skincare_vitc', label: 'Skin care — Vitamin C / Niacinamide', done: false },
            { id: 'skincare_moist', label: 'Skin care — Moisturizer & sunscreen', done: false },
            { id: 'supplements', label: 'Supplements — Finasteride, Seeds, Gummies & Fish oil', done: false },
        ]
    },
    {
        id: 'food',
        label: 'Food',
        icon: '🥗',
        items: [
            { id: 'water_lots', label: 'Lot of water', done: false },
            { id: 'protein_shake', label: 'Protein shake', done: false },
            { id: 'eggs', label: '4–6 eggs', done: false },
            { id: 'meals', label: 'Healthy breakfast, lunch & dinner', done: false },
            { id: 'yogurt', label: 'Yogurt', done: false },
        ]
    },
    {
        id: 'career',
        label: 'Career',
        icon: '💼',
        items: [
            { id: 'portfolio', label: 'Portfolio', done: false },
            { id: 'building', label: 'Building', done: false },
            { id: 'product_prep', label: 'Product prep', done: false },
            { id: 'job_work', label: 'Job work — applications, interviews, networking', done: false },
            { id: 'tech_ld', label: 'Technical L&D', done: false },
            { id: 'vocab_comm', label: 'Vocab & communication', done: false },
        ]
    },
    {
        id: 'night',
        label: 'Night Routine',
        icon: '🌙',
        items: [
            { id: 'minoxidil', label: 'Minoxidil', done: false },
            { id: 'retinol', label: 'Retinol & moisturizer', done: false },
        ]
    }
];

// Flat list for backwards-compat (RoutineModal, etc.)
const defaultMorningItems = defaultHabitGroups.flatMap(g => g.items);


const defaultBucketsConfig = {
    sleep: { name: "Sleep & Recovery", hours: 6.0, color: "accent-charcoal", bgClass: "bg-accent-charcoal/20", borderClass: "border-accent-charcoal", hex: "#4a433b", description: "Essential recovery block" },
    routine: { name: "Routine & Eating", hours: 4.5, color: "accent-ochre", bgClass: "bg-accent-ochre/20", borderClass: "border-accent-ochre", hex: "#a87834", description: "Morning ritual, cooking, eating, chores" },
    work: { name: "Work, Career & L&D", hours: 9.0, color: "accent-sage", bgClass: "bg-accent-sage/20", borderClass: "border-accent-sage", hex: "#5c6e4f", description: "Internship, research, career prep, writing" },
    fitness: { name: "Fitness & Movement", hours: 1.5, color: "accent-terracotta", bgClass: "bg-accent-terracotta/20", borderClass: "border-accent-terracotta", hex: "#bd5338", description: "Gym and workouts" },
    startup: { name: "Own Startup", hours: 2.0, color: "accent-clay", bgClass: "bg-accent-clay/20", borderClass: "border-accent-clay", hex: "#736253", description: "Building MVP, design, and outreach" },
    margin: { name: "Buffer Margin", hours: 1.0, color: "accent-sand", bgClass: "bg-accent-sand/20", borderClass: "border-accent-sand", hex: "#2b241e", description: "Miscellaneous logistics, emails, buffer" }
};

const defaultScheduleTemplate = [
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

const START_DATE = new Date(); // Current system time

// Configuration for serene floating dust particles
const dustMotes = [
    { id: 1, left: '12%', size: '10px', delay: '0s', duration: '16s' },
    { id: 2, left: '28%', size: '8px', delay: '-3s', duration: '20s' },
    { id: 3, left: '42%', size: '12px', delay: '-6s', duration: '18s' },
    { id: 4, left: '58%', size: '9px', delay: '-1.5s', duration: '22s' },
    { id: 5, left: '72%', size: '14px', delay: '-9s', duration: '15s' },
    { id: 6, left: '88%', size: '8px', delay: '-4.5s', duration: '24s' },
    { id: 7, left: '20%', size: '12px', delay: '-7.5s', duration: '19s' },
    { id: 8, left: '65%', size: '10px', delay: '-11s', duration: '17s' },
    { id: 9, left: '80%', size: '12px', delay: '-0.5s', duration: '21s' },
    { id: 10, left: '5%', size: '8px', delay: '-13.5s', duration: '18s' }
];

export default function App() {
    // Navigation / View Switcher State
    const [activeView, setActiveView] = useState('home');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Track mouse position for dynamic spotlight interaction
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({
                x: e.clientX,
                y: e.clientY
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    console.log("Aethel loaded successfully.");

    // Retrieve Zustand store states and actions
    const {
        entities,
        selectedDate,
        currentFloatHour,
        currentScheduleView,
        syncing,
        undoStack,
        redoStack,
        initAuth,
        saveEntity,
        deleteEntity,
        setSelectedDate,
        setCurrentFloatHour,
        setCurrentScheduleView,
        handleUndo,
        handleRedo,
        pushToUndoStack
    } = useStore();

    // Init Auth on mount
    useEffect(() => {
        initAuth();
    }, [initAuth]);

    // Automatic Migration check to clean up old sleep blocks from database
    useEffect(() => {
        if (!entities || entities.length === 0) return;
        const hasSleepBlock1 = entities.some(e => e.id === 'sleep-block-1');
        if (hasSleepBlock1) {
            console.log("Migrating sleep blocks in database...");
            deleteEntity('sleep-block-1');
            const sleepBlock2 = entities.find(e => e.id === 'sleep-block-2');
            if (sleepBlock2) {
                const updated = {
                    ...sleepBlock2,
                    title: 'Sleep & Recovery',
                    properties: {
                        ...sleepBlock2.properties,
                        startHour: 24.0,
                        endHour: 30.0
                    }
                };
                saveEntity(updated);
            }
        }
    }, [entities, deleteEntity, saveEntity]);

    // Keep currentFloatHour updated for Live Marker
    useEffect(() => {
        const updateHour = () => {
            const now = new Date();
            setCurrentFloatHour(now.getHours() + now.getMinutes() / 60);
        };
        updateHour();
        const interval = setInterval(updateHour, 15000); // refresh every 15s
        return () => clearInterval(interval);
    }, [setCurrentFloatHour]);

    // -------------------------------------------------------------
    // Data Mappings (Entities -> Component Formats)
    // -------------------------------------------------------------

    // 1. Board tasks (exclude startup tasks)
    const tasksMapped = useMemo(() => {
        return entities
            .filter(e => e.type === 'task' && e.properties?.bucketId !== 'startup')
            .map(e => ({
                id: e.id,
                text: e.title,
                bucketId: e.properties?.bucketId,
                status: e.properties?.status,
                order: e.properties?.order ?? 0
            }));
    }, [entities]);

    // 1.5. Continuous Notebook
    const quickNotesContent = useMemo(() => {
        return entities.find(e => e.id === 'focus-quick-notes')?.content || '';
    }, [entities]);

    // 2. Custom Columns / Buckets
    const customBucketsMapped = useMemo(() => {
        return entities
            .filter(e => e.type === 'bucket')
            .map(e => ({
                id: e.id,
                title: e.title,
                section: e.properties?.section || 'spaces',
                icon: e.properties?.icon || '',
                order: e.properties?.order ?? 0
            }));
    }, [entities]);

    // 3. Time Buckets Configuration
    const bucketsConfig = useMemo(() => {
        const configEntity = entities.find(e => e.id === 'buckets_config');
        return configEntity?.properties?.buckets || defaultBucketsConfig;
    }, [entities]);

    // 4. Reactive Allocation Buckets (sums block times dynamically)
    const computedBuckets = useMemo(() => {
        const copy = JSON.parse(JSON.stringify(bucketsConfig));
        // Reset all hours to 0
        Object.keys(copy).forEach(k => {
            copy[k].hours = 0;
        });
        // Sum from active blocks
        const blocks = entities.filter(e => e.type === 'event');
        blocks.forEach(block => {
            const bucketKey = block.properties?.bucketKey;
            if (copy[bucketKey]) {
                copy[bucketKey].hours += (block.properties?.endHour - block.properties?.startHour);
            }
        });
        // Round
        Object.keys(copy).forEach(k => {
            copy[k].hours = parseFloat(copy[k].hours.toFixed(1));
        });
        return copy;
    }, [entities, bucketsConfig]);

    // 5. Startup Tasks
    const startupTasksMapped = useMemo(() => {
        return entities
            .filter(e => e.type === 'task' && e.properties?.bucketId === 'startup')
            .map(e => ({
                id: e.id,
                label: e.title,
                done: e.properties?.status === 'done'
            }));
    }, [entities]);

    // 6. Checklist Database
    const checklistDatabaseMapped = useMemo(() => {
        const db = {};
        entities
            .filter(e => e.type === 'journal' && e.id.startsWith('checklist-'))
            .forEach(e => {
                const dateStr = e.id.replace('checklist-', '');
                db[dateStr] = e.properties?.items;
            });
        return db;
    }, [entities]);

    // 7. Schedule blocks
    const scheduleBlocksMapped = useMemo(() => {
        return entities
            .filter(e => e.type === 'event')
            .map(e => ({
                id: e.id,
                bucket: e.properties?.bucketKey || 'work',
                startHour: e.properties?.startHour ?? 9.0,
                endHour: e.properties?.endHour ?? 10.0,
                name: e.title,
                type: e.properties?.type || 'block',
                date: e.properties?.date || '',
                completed: e.properties?.completed || false,
                status: e.properties?.status || '',
                templateId: e.properties?.templateId || ''
            }));
    }, [entities]);

    // Compute currently active block for zen focus card
    const activeBlock = useMemo(() => {
        let adjustedHour = currentFloatHour;
        if (adjustedHour < 2.0) {
            adjustedHour += 24.0;
        }
        let active = scheduleBlocksMapped.find(b => adjustedHour >= b.startHour && adjustedHour < b.endHour);
        if (!active) {
            active = scheduleBlocksMapped[0] || { id: 'fallback', bucket: 'sleep', startHour: 2.0, endHour: 6.0, name: 'Deep Sleep' };
        }
        return active;
    }, [scheduleBlocksMapped, currentFloatHour]);

    // -------------------------------------------------------------
    // UI Helpers & Grid Controllers
    // -------------------------------------------------------------
    const [dateOffset, setDateOffset] = useState(0);

    const formatHour = (h) => {
        let displayHour = Math.floor(h);
        if (displayHour >= 24) displayHour -= 24;
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
        const diff = current.getDate() - day + (day === 0 ? -6 : 1);
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
            const d = new Date();
            d.setDate(d.getDate() + dateOffset + i);
            cols.push({
                id: `date-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
                title: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })
            });
        }
        return cols;
    };

    // -------------------------------------------------------------
    // Board Actions (CRUD Entity wrappers)
    // -------------------------------------------------------------
    const handleAddNewTask = (text, bucketId) => {
        pushToUndoStack();
        const activeCount = entities.filter(e => e.type === 'task' && e.properties?.bucketId === bucketId && e.properties?.status === 'active').length;
        const newEntity = {
            id: 't' + Date.now(),
            type: 'task',
            title: text,
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            properties: {
                bucketId,
                status: 'active',
                order: activeCount
            }
        };
        saveEntity(newEntity);
    };

    const handleUpdateTaskText = (id, text) => {
        const e = entities.find(x => x.id === id);
        if (e && text.trim() && e.title !== text.trim()) {
            pushToUndoStack();
            saveEntity({
                ...e,
                title: text.trim(),
                updatedAt: new Date().toISOString()
            });
        }
    };

    const handleCompleteTask = (id) => {
        const e = entities.find(x => x.id === id);
        if (e) {
            pushToUndoStack();
            saveEntity({
                ...e,
                updatedAt: new Date().toISOString(),
                properties: { ...e.properties, status: 'archived' }
            });
        }
    };

    const handleRestoreTask = (id) => {
        const e = entities.find(x => x.id === id);
        if (e) {
            pushToUndoStack();
            const activeCount = entities.filter(x => x.type === 'task' && x.properties?.bucketId === 'focus' && x.properties?.status === 'active').length;
            saveEntity({
                ...e,
                updatedAt: new Date().toISOString(),
                properties: {
                    ...e.properties,
                    status: 'active',
                    bucketId: 'focus',
                    order: activeCount
                }
            });
        }
    };

    const handleClearArchive = () => {
        if (confirm("Permanently delete all archived tasks? This action cannot be undone.")) {
            pushToUndoStack();
            const archivedTasks = entities.filter(e => e.type === 'task' && e.properties?.status === 'archived');
            archivedTasks.forEach(t => deleteEntity(t.id));
        }
    };

    const handleDeleteTask = (id) => {
        if (confirm("Permanently delete this task?")) {
            deleteEntity(id);
        }
    };

    const handleAddNewSpace = (title, section = 'spaces') => {
        pushToUndoStack();
        const bucketEntities = entities.filter(e => e.type === 'bucket');
        const newBucket = {
            id: 'b' + Date.now(),
            type: 'bucket',
            title,
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            properties: {
                section,
                order: bucketEntities.length
            }
        };
        saveEntity(newBucket);
    };

    const handleUpdateSpaceTitle = (id, text) => {
        const e = entities.find(x => x.id === id);
        if (e && text.trim() && e.title !== text.trim()) {
            pushToUndoStack();
            saveEntity({
                ...e,
                title: text.trim(),
                updatedAt: new Date().toISOString()
            });
        }
    };

    const handleUpdateSpaceIcon = (id, icon) => {
        const e = entities.find(x => x.id === id);
        if (e && e.properties?.icon !== icon) {
            pushToUndoStack();
            saveEntity({
                ...e,
                updatedAt: new Date().toISOString(),
                properties: {
                    ...e.properties,
                    icon
                }
            });
        }
    };

    const handleDeleteSpace = (id) => {
        if (confirm("Delete space?")) {
            pushToUndoStack();
            const childTasks = entities.filter(t => t.type === 'task' && t.properties?.bucketId === id);
            deleteEntity(id);
            childTasks.forEach(t => deleteEntity(t.id));
        }
    };

    // -------------------------------------------------------------
    // Schedule Actions (CRUD Entity wrappers)
    // -------------------------------------------------------------
    const handleToggleZenItemFromModal = (dateStr, itemId) => {
        const id = `checklist-${dateStr}`;
        const existing = entities.find(e => e.id === id);
        const savedItems = existing?.properties?.items || [];
        // Reconcile against current defaults so stale saved items (old ids, renamed/merged habits) don't drop new ones
        const items = defaultMorningItems.map(def => {
            const saved = savedItems.find(i => i.id === def.id);
            return saved ? { ...def, done: saved.done } : { ...def };
        });
        const item = items.find(i => i.id === itemId);
        if (item) {
            item.done = !item.done;
            saveEntity({
                id,
                type: 'journal',
                title: `Checklist for ${dateStr}`,
                createdAt: existing ? existing.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                properties: { items }
            });
        }
    };

    const handleToggleStartupTask = (id) => {
        const e = entities.find(x => x.id === id);
        if (e) {
            saveEntity({
                ...e,
                updatedAt: new Date().toISOString(),
                properties: {
                    ...e.properties,
                    status: e.properties?.status === 'done' ? 'active' : 'done'
                }
            });
        }
    };

    const handleAddNewStartupTask = (label) => {
        const newEntity = {
            id: 'st-' + Date.now(),
            type: 'task',
            title: label,
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            properties: {
                bucketId: 'startup',
                status: 'active',
                order: 0
            }
        };
        saveEntity(newEntity);
    };

    const handleMoveScheduleBlock = (blockId, newStart, newEnd, targetDateStr) => {
        const e = entities.find(x => x.id === blockId);
        if (e) {
            saveEntity({
                ...e,
                updatedAt: new Date().toISOString(),
                properties: {
                    ...e.properties,
                    startHour: newStart,
                    endHour: newEnd,
                    date: targetDateStr !== undefined ? targetDateStr : e.properties?.date
                }
            });
        }
    };

    const handleAddNewScheduleBlock = (eventData) => {
        const { name, bucket, type, date, startHour, endHour } = eventData;
        const newBlock = {
            id: 'block-' + Date.now(),
            type: 'event',
            title: name || 'New Event',
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            properties: {
                bucketKey: bucket || 'work',
                type: type || 'block',
                date: date || '',
                startHour: startHour ?? 9.0,
                endHour: endHour ?? 10.0,
                completed: false
            }
        };
        saveEntity(newBlock);
    };

    const handleUpdateScheduleBlock = (eventData) => {
        const { id, name, bucket, type, date, startHour, endHour } = eventData;
        const e = entities.find(x => x.id === id);
        if (e) {
            saveEntity({
                ...e,
                title: name,
                updatedAt: new Date().toISOString(),
                properties: {
                    ...e.properties,
                    bucketKey: bucket,
                    type,
                    date,
                    startHour,
                    endHour
                }
            });
        }
    };

    const handleDeleteScheduleBlock = (eventId, mode = 'all', dateStr = '') => {
        if (mode === 'only-this' && dateStr) {
            // Save a cancelled override event
            const overrideId = `${eventId}-cancelled-${dateStr}`;
            const overrideEntity = {
                id: overrideId,
                type: 'event',
                title: 'Cancelled Event Instance',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                properties: {
                    templateId: eventId,
                    date: dateStr,
                    status: 'cancelled'
                }
            };
            saveEntity(overrideEntity);
        } else {
            // Delete the template block or event series entirely
            deleteEntity(eventId);
        }
    };

    const handleUpdateQuickNotes = (content) => {
        const e = entities.find(x => x.id === 'focus-quick-notes');
        saveEntity({
            id: 'focus-quick-notes',
            type: 'note',
            title: 'Quick Notes',
            content,
            createdAt: e ? e.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    };

    const handleSaveBudget = (updatedBuckets) => {
        pushToUndoStack();
        let startCursor = 2.0;
        const blocks = entities.filter(e => e.type === 'event');

        blocks.forEach(block => {
            const hours = updatedBuckets[block.properties?.bucketKey]?.hours ?? 0;
            const count = blocks.filter(b => b.properties?.bucketKey === block.properties?.bucketKey).length || 1;
            const duration = hours / count;
            const start = startCursor;
            const end = Math.min(26.0, startCursor + duration);
            startCursor = end;

            saveEntity({
                ...block,
                updatedAt: new Date().toISOString(),
                properties: {
                    ...block.properties,
                    startHour: start,
                    endHour: end
                }
            });
        });

        saveEntity({
            id: 'buckets_config',
            type: 'config',
            title: 'Buckets Config',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            properties: { buckets: updatedBuckets }
        });
    };

    const handleResetBudgetDefaultsAndRefresh = () => {
        pushToUndoStack();
        // Reset Config
        saveEntity({
            id: 'buckets_config',
            type: 'config',
            title: 'Buckets Config',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            properties: { buckets: defaultBucketsConfig }
        });

        // Recreate default events
        const events = entities.filter(e => e.type === 'event');
        events.forEach(e => deleteEntity(e.id));

        defaultScheduleTemplate.forEach((block) => {
            saveEntity({
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
            });
        });
    };

    const handleShowGenericBlockDetails = (block, day) => {
        const meta = computedBuckets[block.bucket] || {};
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

    // -------------------------------------------------------------
    // Drag-and-Drop state handlers
    // -------------------------------------------------------------
    const [draggedTaskId, setDraggedTaskId] = useState(null);
    const [draggedBucketId, setDraggedBucketId] = useState(null);
    const originalParentRef = useRef(null);
    const originalSiblingRef = useRef(null);

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
        
        // Gather order updates from DOM structure
        const updates = [];
        document.querySelectorAll('.board-column').forEach(col => {
            const colId = col.id.replace('board-', '');
            col.querySelectorAll('.task-card').forEach((card, idx) => {
                const t = entities.find(x => x.id === card.id);
                if (t && (t.properties?.bucketId !== colId || t.properties?.order !== idx)) {
                    updates.push({ entity: t, newBucketId: colId, newOrder: idx });
                }
            });
        });

        // Restore DOM to original state before state change to prevent React crash
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

        if (updates.length > 0) {
            pushToUndoStack();
            updates.forEach(({ entity, newBucketId, newOrder }) => {
                saveEntity({
                    ...entity,
                    updatedAt: new Date().toISOString(),
                    properties: {
                        ...entity.properties,
                        bucketId: newBucketId,
                        order: newOrder
                    }
                });
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

    const handleDragBucketStart = (ev, bucketId) => {
        ev.stopPropagation();
        setDraggedBucketId(bucketId);
        ev.currentTarget.classList.add('opacity-40');
    };

    const handleDragBucketOver = (ev) => {
        ev.preventDefault();
        if (!draggedBucketId) return;

        const bucket = entities.find(cb => cb.id === draggedBucketId);
        if (!bucket) return;
        const containerId = bucket.properties?.section === 'focus' ? 'focus-boards' : 'custom-boards';
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
        const inputDOM = document.getElementById(bucket.properties?.section === 'focus' ? 'new-focus-container' : 'new-bucket-container');
        if (draggedDOM) {
            if (!afterDOM) container.insertBefore(draggedDOM, inputDOM);
            else container.insertBefore(draggedDOM, afterDOM);
        }
    };

    const handleDragBucketEnd = (ev) => {
        ev.currentTarget.classList.remove('opacity-40');
        const bucket = entities.find(cb => cb.id === draggedBucketId);
        setDraggedBucketId(null);
        if (!bucket) return;

        const containerId = bucket.properties?.section === 'focus' ? 'focus-boards' : 'custom-boards';
        const boards = document.getElementById(containerId).querySelectorAll('.board-container[data-bucket]');
        
        let changed = false;
        boards.forEach((b, i) => {
            const bucketId = b.getAttribute('data-bucket');
            if (bucketId === 'focus') return;
            const cb = entities.find(x => x.id === bucketId);
            if (cb && cb.properties?.order !== i) changed = true;
        });

        if (changed) {
            pushToUndoStack();
            let orderIndex = 0;
            boards.forEach((b) => {
                const bucketId = b.getAttribute('data-bucket');
                if (bucketId === 'focus') return;
                const cb = entities.find(x => x.id === bucketId);
                if (cb) {
                    if (cb.properties?.order !== orderIndex) {
                        saveEntity({
                            ...cb,
                            updatedAt: new Date().toISOString(),
                            properties: { ...cb.properties, order: orderIndex }
                        });
                    }
                    orderIndex++;
                }
            });
        }
    };

    // Toggle stylesheet references / bg colors
    useEffect(() => {
        if (activeView === 'home') {
            document.body.style.backgroundColor = '#FAF8F5';
        } else if (activeView === 'board') {
            document.body.style.backgroundColor = '#FDFDFC';
        } else {
            document.body.style.backgroundColor = '#fdfbfa';
        }
    }, [activeView]);

    const timelineDays = getTimelineStructure();

    // Keyboard event listener for Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) handleRedo();
                else handleUndo();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [isRoutineOpen, setIsRoutineOpen] = useState(false);
    const [routineModalDay, setRoutineModalDay] = useState(new Date(2026, 5, 16));
    const [isBudgetOpen, setIsBudgetOpen] = useState(false);

    return (
        <div className="h-screen flex flex-col antialiased select-none overflow-hidden relative bg-white">
            {/* SVG Noise/Grain Texture Overlay (Global) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.035] z-40 mix-blend-overlay">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <filter id="noiseFilterGlobal">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilterGlobal)" />
                </svg>
            </div>

            {/* Ambient Sunlight Dust Motes (Global Floating Background Layer) */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                {dustMotes.map((mote) => (
                    <div
                        key={mote.id}
                        className="absolute bottom-0 rounded-full bg-gradient-to-t from-amber-300/50 via-amber-400/40 to-orange-200/20 blur-[1px] animate-dust"
                        style={{
                            left: mote.left,
                            width: mote.size,
                            height: mote.size,
                            animationDelay: mote.delay,
                            animationDuration: mote.duration
                        }}
                    />
                ))}
            </div>

            {/* Interactive Mouse Cursor Spotlight Aura (Only on Home) */}
            {activeView === 'home' && (
                <div 
                    className="absolute pointer-events-none rounded-full w-[350px] h-[350px] bg-gradient-to-r from-amber-300/30 via-rose-300/25 to-indigo-300/30 blur-[70px] z-10 transition-transform duration-500 ease-out hidden md:block"
                    style={{
                        transform: `translate(${mousePos.x - 175}px, ${mousePos.y - 175}px)`,
                    }}
                />
            )}

            {/* Unified Full-Width Glassmorphic Navbar with Soft Aura Gradient */}
            {activeView !== 'home' && (
                <nav className="flex items-center justify-between px-8 py-3.5 bg-gradient-to-r from-rose-100/12 via-amber-100/8 to-indigo-100/12 backdrop-blur-2xl border-b border-stone-200/35 text-stone-700 fixed top-0 left-0 w-full z-50 shadow-sm shrink-0 select-none">
                    <div className="w-1/3 flex items-center justify-start gap-3">
                        <span className="text-[10px] font-mono tracking-wider uppercase text-stone-400 font-bold animate-pulse-slow" id="current-date-display">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                        <span
                            id="cloud-sync-indicator"
                            className={`text-[9px] font-mono tracking-wider uppercase text-stone-450 transition-opacity flex items-center gap-1 ${syncing ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <i className="fa-solid fa-cloud"></i> Synced
                        </span>
                    </div>

                    <div className="w-1/3 flex items-center justify-center gap-2.5 cursor-pointer group" onClick={() => setActiveView('home')}>
                        <div className="w-1.5 h-1.5 rounded-full animate-alive-dot translate-y-[2px] transition-transform duration-300"></div>
                        <h1 className="text-xl font-cormorant font-normal italic tracking-wide text-stone-850 group-hover:text-stone-600 transition-colors">
                            aethel
                        </h1>
                    </div>

                    <div className="flex gap-6 items-center text-[16px] text-stone-450 w-1/3 justify-end">
                        {/* Switch View Slash Tabs */}
                        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider mr-2">
                            <button
                                onClick={() => setActiveView('home')}
                                className={`transition-colors duration-205 ${activeView === 'home' ? 'text-stone-850 font-medium' : 'text-stone-400 hover:text-stone-750'}`}
                            >
                                home
                            </button>
                            <span className="text-stone-300 select-none">/</span>
                            <button
                                onClick={() => setActiveView('board')}
                                className={`transition-colors duration-205 ${activeView === 'board' ? 'text-stone-850 font-medium' : 'text-stone-400 hover:text-stone-750'}`}
                            >
                                board
                            </button>
                            <span className="text-stone-300 select-none">/</span>
                            <button
                                onClick={() => setActiveView('schedule')}
                                className={`transition-colors duration-205 ${activeView === 'schedule' ? 'text-stone-850 font-medium' : 'text-stone-400 hover:text-stone-750'}`}
                            >
                                schedule
                            </button>
                        </div>

                        {/* Undo/Redo Controls */}
                        <div className="flex gap-4 text-[14px] mr-2 border-r border-stone-200/50 pr-4">
                            <button 
                                onClick={handleUndo} 
                                title="Undo (Ctrl+Z)"
                                className="hover:text-stone-700 transition flex items-center text-stone-400 disabled:opacity-30 disabled:hover:text-stone-400"
                                disabled={undoStack.length === 0}
                            >
                                <i className="fa-solid fa-rotate-left"></i>
                            </button>
                            <button 
                                onClick={handleRedo} 
                                title="Redo (Ctrl+Y)"
                                className="hover:text-stone-700 transition flex items-center text-stone-400 disabled:opacity-30 disabled:hover:text-stone-400"
                                disabled={redoStack.length === 0}
                            >
                                <i className="fa-solid fa-rotate-right"></i>
                            </button>
                        </div>

                        <button onClick={() => setIsArchiveOpen(true)} className="hover:text-stone-700 transition" title="Archive"><i className="fa-solid fa-box-archive"></i></button>
                        <button className="hover:text-stone-700 transition" title="Settings"><i className="fa-solid fa-gear"></i></button>
                    </div>
                </nav>
            )}

            {/* Layout Toggling with Smooth Page Transitions */}
            <div className="flex-1 flex flex-col overflow-hidden relative animate-page-fade" key={activeView}>
                {activeView === 'home' && (
                    <HomeView onNavigate={setActiveView} />
                )}
                {activeView === 'board' && (
                    <BoardView
                        tasks={tasksMapped}
                        customBuckets={customBucketsMapped}
                        notesContent={quickNotesContent}
                        onUpdateNotes={handleUpdateQuickNotes}
                        dateOffset={dateOffset}
                        timelineDays={timelineDays}
                        onShiftDate={setDateOffset}
                        onAddNewTask={handleAddNewTask}
                        onUpdateTaskText={handleUpdateTaskText}
                        onCompleteTask={handleCompleteTask}
                        onAddNewSpace={handleAddNewSpace}
                        onUpdateSpaceTitle={handleUpdateSpaceTitle}
                        onUpdateSpaceIcon={handleUpdateSpaceIcon}
                        onDeleteSpace={handleDeleteSpace}

                        onDragStartTask={handleDragStartTask}
                        onDragEndTask={handleDragEndTask}
                        onDragOverColumn={handleDragOverColumn}
                        onDragLeaveColumn={handleDragLeaveColumn}
                        onDropOnColumn={() => {}}
                        onDragBucketStart={handleDragBucketStart}
                        onDragBucketEnd={handleDragBucketEnd}
                        onDragBucketOver={handleDragBucketOver}
                        onDragBucketDrop={() => {}}
                    />
                )}
                {activeView === 'schedule' && (
                    <ScheduleView
                        buckets={computedBuckets}
                        startupTasks={startupTasksMapped}
                        checklistDatabase={checklistDatabaseMapped}
                        defaultMorningItems={defaultMorningItems}
                        defaultHabitGroups={defaultHabitGroups}
                        activeBlock={activeBlock}
                        currentFloatHour={currentFloatHour}
                        selectedDate={selectedDate}
                        currentView={currentScheduleView}
                        dailyScheduleTemplate={scheduleBlocksMapped}
                        onToggleZenItem={handleToggleZenItemFromModal}
                        onToggleStartupTask={handleToggleStartupTask}
                        onAddNewStartupTask={handleAddNewStartupTask}
                        onDeleteStartupTask={handleDeleteTask}
                        onResetBudgetDefaultsAndRefresh={handleResetBudgetDefaultsAndRefresh}
                        onMoveScheduleBlock={handleMoveScheduleBlock}
                        onResizeScheduleBlock={handleMoveScheduleBlock}
                        onDeleteScheduleBlock={handleDeleteScheduleBlock}
                        onAddScheduleBlock={handleAddNewScheduleBlock}
                        onUpdateScheduleBlock={handleUpdateScheduleBlock}
                        onChangeWeek={setSelectedDate}
                        onGoToToday={() => setSelectedDate(new Date())}
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
                tasks={entities.filter(e => e.type === 'task' && e.properties?.status === 'archived').map(e => ({
                    id: e.id,
                    text: e.title,
                    bucketId: e.properties?.bucketId
                }))}
                onRestore={handleRestoreTask}
                onDelete={handleDeleteTask}
                onClearArchive={handleClearArchive}
                canUndo={undoStack.length > 0}
                onUndo={handleUndo}
            />

            <RoutineModal
                isOpen={isRoutineOpen}
                onClose={() => setIsRoutineOpen(false)}
                day={routineModalDay}
                checklistDatabase={checklistDatabaseMapped}
                defaultMorningItems={defaultMorningItems}
                onToggleZenItem={handleToggleZenItemFromModal}
                onToggleSkincareDay={() => {
                    const dateStr = routineModalDay.toLocaleDateString('sv-SE');
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
                buckets={bucketsConfig}
                onSaveBudget={handleSaveBudget}
                onResetBudget={() => defaultBucketsConfig}
            />
        </div>
    );
}
