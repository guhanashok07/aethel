// Flow - Main Application Component (Decoupled Zustand edition)
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from './store/useStore';

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

const START_DATE = new Date(2026, 5, 16); // June 16, 2026

export default function App() {
    // Navigation / View Switcher State
    const [activeView, setActiveView] = useState('board');
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

    // 2. Custom Columns / Buckets
    const customBucketsMapped = useMemo(() => {
        return entities
            .filter(e => e.type === 'bucket')
            .map(e => ({
                id: e.id,
                title: e.title,
                section: e.properties?.section || 'spaces',
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
                bucket: e.properties?.bucketKey,
                startHour: e.properties?.startHour,
                endHour: e.properties?.endHour,
                name: e.title
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
    const handleToggleZenItem = (itemId) => {
        const todayStr = new Date(2026, 5, 16).toISOString().split('T')[0];
        handleToggleZenItemFromModal(todayStr, itemId);
    };

    const handleToggleZenItemFromModal = (dateStr, itemId) => {
        const id = `checklist-${dateStr}`;
        const existing = entities.find(e => e.id === id);
        const items = existing
            ? JSON.parse(JSON.stringify(existing.properties?.items || []))
            : JSON.parse(JSON.stringify(defaultMorningItems));
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

    const handleMoveScheduleBlock = (blockId, newStart, newEnd) => {
        const e = entities.find(x => x.id === blockId);
        if (e) {
            saveEntity({
                ...e,
                updatedAt: new Date().toISOString(),
                properties: {
                    ...e.properties,
                    startHour: newStart,
                    endHour: newEnd
                }
            });
        }
    };

    const handleAddNewScheduleBlock = (name, bucketKey) => {
        const newBlock = {
            id: 'block-' + Date.now(),
            type: 'event',
            title: name || bucketsConfig[bucketKey]?.name || 'New Block',
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            properties: {
                bucketKey,
                startHour: 12.0,
                endHour: 13.0
            }
        };
        saveEntity(newBlock);
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
        if (activeView === 'board') {
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
                            onClick={() => setActiveView('board')}
                            className={`px-3 py-1 rounded font-semibold transition-all duration-200 ${activeView === 'board' ? 'bg-white text-charcoal shadow-sm' : 'text-gray-300 hover:text-white'}`}
                        >
                            Board
                        </button>
                        <button
                            onClick={() => setActiveView('schedule')}
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
                            disabled={undoStack.length === 0}
                        >
                            <i className="fa-solid fa-rotate-left"></i>
                        </button>
                        <button 
                            onClick={handleRedo} 
                            title="Redo (Ctrl+Y)"
                            className="hover:text-white transition flex items-center text-gray-300 disabled:opacity-30 disabled:hover:text-gray-300"
                            disabled={redoStack.length === 0}
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
                        tasks={tasksMapped}
                        customBuckets={customBucketsMapped}
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
                        onDropOnColumn={() => {}}
                        onDragBucketStart={handleDragBucketStart}
                        onDragBucketEnd={handleDragBucketEnd}
                        onDragBucketOver={handleDragBucketOver}
                        onDragBucketDrop={() => {}}
                    />
                ) : (
                    <ScheduleView
                        buckets={computedBuckets}
                        startupTasks={startupTasksMapped}
                        checklistDatabase={checklistDatabaseMapped}
                        defaultMorningItems={defaultMorningItems}
                        activeBlock={activeBlock}
                        currentFloatHour={currentFloatHour}
                        selectedDate={selectedDate}
                        currentView={currentScheduleView}
                        dailyScheduleTemplate={scheduleBlocksMapped}
                        onToggleZenItem={handleToggleZenItem}
                        onToggleStartupTask={handleToggleStartupTask}
                        onAddNewStartupTask={handleAddNewStartupTask}
                        onDeleteStartupTask={handleDeleteTask}
                        onResetBudgetDefaultsAndRefresh={handleResetBudgetDefaultsAndRefresh}
                        onMoveScheduleBlock={handleMoveScheduleBlock}
                        onResizeScheduleBlock={handleMoveScheduleBlock}
                        onDeleteScheduleBlock={deleteEntity}
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
                tasks={entities.filter(e => e.type === 'task' && e.properties?.status === 'archived').map(e => ({
                    id: e.id,
                    text: e.title,
                    bucketId: e.properties?.bucketId
                }))}
                onRestore={handleRestoreTask}
                onDelete={handleDeleteTask}
            />

            <RoutineModal
                isOpen={isRoutineOpen}
                onClose={() => setIsRoutineOpen(false)}
                day={routineModalDay}
                checklistDatabase={checklistDatabaseMapped}
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
                buckets={bucketsConfig}
                onSaveBudget={handleSaveBudget}
                onResetBudget={() => defaultBucketsConfig}
            />
        </div>
    );
}
