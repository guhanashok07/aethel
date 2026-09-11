import { create } from 'zustand';

// Default Buckets Configuration
const defaultBucketsConfig = {
    strategy: { name: "Product Strategy & Roadmapping", hours: 8.0, color: "accent-charcoal", bgClass: "bg-accent-charcoal/20", borderClass: "border-accent-charcoal", hex: "#4a433b", description: "0-to-1 roadmaps, positioning, GTM, vision" },
    discovery: { name: "Discovery & User Research", hours: 6.0, color: "accent-ochre", bgClass: "bg-accent-ochre/20", borderClass: "border-accent-ochre", hex: "#a87834", description: "Customer interviews, pain-point synthesis, surveys" },
    execution: { name: "Sprint Execution & Specs", hours: 8.0, color: "accent-sage", bgClass: "bg-accent-sage/20", borderClass: "border-accent-sage", hex: "#5c6e4f", description: "PRDs, user stories, edge cases, engineering syncs" },
    analytics: { name: "Product Analytics & Growth", hours: 4.0, color: "accent-terracotta", bgClass: "bg-accent-terracotta/20", borderClass: "border-accent-terracotta", hex: "#bd5338", description: "Cohort analysis, retention, funnels, North Star KPIs" },
    buffer: { name: "Buffer & Team Sync", hours: 2.0, color: "accent-sand", bgClass: "bg-accent-sand/20", borderClass: "border-accent-sand", hex: "#2b241e", description: "Standups, backlog grooming, cross-functional logistics" }
};

const defaultScheduleTemplate = [
    { id: "sched-1", bucket: "work", type: "block", startHour: 6.5, endHour: 7.5, name: "Product Metrics & Roadmap Review" },
    { id: "sched-2", bucket: "routine", type: "block", startHour: 7.5, endHour: 8.5, name: "Morning Routine & Breakfast" },
    { id: "sched-3", bucket: "work", type: "block", startHour: 8.5, endHour: 11.5, name: "Deep Work: PRD & Architecture Specs" },
    { id: "sched-4", bucket: "work", type: "meeting", startHour: 11.5, endHour: 12.5, name: "Daily Standup & Sprint Sync" },
    { id: "sched-5", bucket: "routine", type: "block", startHour: 12.5, endHour: 13.5, name: "Lunch & Walk" },
    { id: "sched-6", bucket: "work", type: "meeting", startHour: 13.5, endHour: 15.5, name: "Customer Discovery & User Testing Calls" },
    { id: "sched-7", bucket: "work", type: "meeting", startHour: 15.5, endHour: 16.5, name: "Design Critique: Prototype Review (Figma)" },
    { id: "sched-8", bucket: "fitness", type: "block", startHour: 16.5, endHour: 18.0, name: "Gym & Movement" },
    { id: "sched-9", bucket: "margin", type: "block", startHour: 18.0, endHour: 18.5, name: "Quick Buffer & Comms" },
    { id: "sched-10", bucket: "startup", type: "block", startHour: 18.5, endHour: 20.5, name: "Side Project MVP Building" },
    { id: "sched-11", bucket: "routine", type: "block", startHour: 21.0, endHour: 22.5, name: "Evening Wind Down & Reading" },
    { id: "sched-12", bucket: "sleep", type: "block", startHour: 23.5, endHour: 30.0, name: "Sleep & Recovery" }
];

const getSeedData = () => {
    const now = new Date().toISOString();
    const today = new Date();
    const formatDateStr = (offsetDays) => {
        const d = new Date(today);
        d.setDate(today.getDate() + offsetDays);
        return d.toLocaleDateString('sv-SE');
    };

    const entities = [
        // Buckets config
        {
            id: 'buckets_config',
            type: 'config',
            title: 'Buckets Config',
            createdAt: now,
            updatedAt: now,
            properties: { buckets: defaultBucketsConfig }
        },
        // Spaces / Buckets
        { id: 'focus', type: 'bucket', title: 'Sprint Focus', createdAt: now, updatedAt: now, properties: { section: 'spaces', order: 0 } },
        { id: 'discovery', type: 'bucket', title: 'Customer Discovery', createdAt: now, updatedAt: now, properties: { section: 'spaces', order: 1 } },
        { id: 'specs', type: 'bucket', title: 'PRDs & Specs', createdAt: now, updatedAt: now, properties: { section: 'spaces', order: 2 } },
        { id: 'analytics', type: 'bucket', title: 'Growth & Analytics', createdAt: now, updatedAt: now, properties: { section: 'spaces', order: 3 } },

        // Tasks - Sprint Focus
        { id: 'task-1', type: 'task', title: 'Draft PRD for AI Copilot multi-agent query routing', createdAt: now, updatedAt: now, properties: { bucketId: 'focus', status: 'active', order: 0, priority: 'high' } },
        { id: 'task-2', type: 'task', title: 'Review Q3 user interview insights with design lead', createdAt: now, updatedAt: now, properties: { bucketId: 'focus', status: 'active', order: 1, priority: 'medium' } },
        { id: 'task-3', type: 'task', title: 'Audit onboarding funnel drop-off at Step 3 in Mixpanel', createdAt: now, updatedAt: now, properties: { bucketId: 'focus', status: 'active', order: 2, priority: 'high' } },
        { id: 'task-4', type: 'task', title: 'Sprint 24 backlog grooming and story point estimation', createdAt: now, updatedAt: now, properties: { bucketId: 'focus', status: 'done', order: 3 } },

        // Tasks - Discovery
        { id: 'task-5', type: 'task', title: 'Synthesize 10 customer interviews on generative canvas UX', createdAt: now, updatedAt: now, properties: { bucketId: 'discovery', status: 'active', order: 0 } },
        { id: 'task-6', type: 'task', title: 'Build competitor feature matrix for automated reporting tools', createdAt: now, updatedAt: now, properties: { bucketId: 'discovery', status: 'active', order: 1 } },
        { id: 'task-7', type: 'task', title: 'Schedule 5 customer validation sessions for pilot release', createdAt: now, updatedAt: now, properties: { bucketId: 'discovery', status: 'done', order: 2 } },

        // Tasks - Specs
        { id: 'task-8', type: 'task', title: 'Finalize data schema contract with backend engineering', createdAt: now, updatedAt: now, properties: { bucketId: 'specs', status: 'active', order: 0 } },
        { id: 'task-9', type: 'task', title: 'Create latency SLA benchmark criteria (<150ms p95)', createdAt: now, updatedAt: now, properties: { bucketId: 'specs', status: 'active', order: 1 } },
        { id: 'task-10', type: 'task', title: 'Document error handling and fallback states for LLM guardrails', createdAt: now, updatedAt: now, properties: { bucketId: 'specs', status: 'done', order: 2 } },

        // Tasks - Analytics
        { id: 'task-11', type: 'task', title: 'Define North Star metric and input trees for activation', createdAt: now, updatedAt: now, properties: { bucketId: 'analytics', status: 'active', order: 0 } },
        { id: 'task-12', type: 'task', title: 'Prepare GTM positioning brief and sales battlecard', createdAt: now, updatedAt: now, properties: { bucketId: 'analytics', status: 'active', order: 1 } },
        { id: 'task-13', type: 'task', title: 'Weekly executive dashboard: cohort retention and churn', createdAt: now, updatedAt: now, properties: { bucketId: 'analytics', status: 'done', order: 2 } },

        // 1. Recurring Schedule Template Blocks (Monday-Friday)
        ...defaultScheduleTemplate.map((block) => ({
            id: block.id,
            type: 'event',
            title: block.name,
            createdAt: now,
            updatedAt: now,
            properties: {
                bucketKey: block.bucket,
                type: block.type || 'block',
                startHour: block.startHour,
                endHour: block.endHour,
                date: '',
                completed: false
            }
        })),

        // 2. Specific dated calendar events for today and surrounding days
        {
            id: 'event-today-1',
            type: 'event',
            title: 'Sprint 24 Planning & Backlog Grooming',
            createdAt: now,
            updatedAt: now,
            properties: {
                bucketKey: 'work',
                type: 'meeting',
                startHour: 10.0,
                endHour: 11.3,
                date: formatDateStr(0),
                completed: false
            }
        },
        {
            id: 'event-today-2',
            type: 'event',
            title: 'Design Review: Mobile IA & Navigation',
            createdAt: now,
            updatedAt: now,
            properties: {
                bucketKey: 'work',
                type: 'meeting',
                startHour: 14.0,
                endHour: 15.0,
                date: formatDateStr(0),
                completed: false
            }
        },
        {
            id: 'event-today-3',
            type: 'event',
            title: 'PRD Sign-off with Tech Lead',
            createdAt: now,
            updatedAt: now,
            properties: {
                bucketKey: 'work',
                type: 'deadline',
                startHour: 17.0,
                endHour: 17.5,
                date: formatDateStr(0),
                completed: false
            }
        },
        {
            id: 'event-tomorrow-1',
            type: 'event',
            title: 'Executive Demo: Multi-Agent Workflow',
            createdAt: now,
            updatedAt: now,
            properties: {
                bucketKey: 'work',
                type: 'meeting',
                startHour: 11.0,
                endHour: 12.0,
                date: formatDateStr(1),
                completed: false
            }
        },
        {
            id: 'event-tomorrow-2',
            type: 'event',
            title: 'Customer Validation: Enterprise Beta Cohort',
            createdAt: now,
            updatedAt: now,
            properties: {
                bucketKey: 'work',
                type: 'meeting',
                startHour: 14.5,
                endHour: 15.5,
                date: formatDateStr(1),
                completed: false
            }
        },
        {
            id: 'event-tomorrow-3',
            type: 'event',
            title: 'Release Candidate v1.2 Code Freeze',
            createdAt: now,
            updatedAt: now,
            properties: {
                bucketKey: 'work',
                type: 'deadline',
                startHour: 17.0,
                endHour: 17.5,
                date: formatDateStr(1),
                completed: false
            }
        },
        {
            id: 'event-past-1',
            type: 'event',
            title: 'Weekly Product All-Hands & Demo',
            createdAt: now,
            updatedAt: now,
            properties: {
                bucketKey: 'work',
                type: 'meeting',
                startHour: 10.0,
                endHour: 11.0,
                date: formatDateStr(-1),
                completed: true
            }
        },
        {
            id: 'event-future-1',
            type: 'event',
            title: 'Architecture Spike: Knowledge Graph Engine',
            createdAt: now,
            updatedAt: now,
            properties: {
                bucketKey: 'work',
                type: 'block',
                startHour: 9.5,
                endHour: 11.5,
                date: formatDateStr(2),
                completed: false
            }
        },
        {
            id: 'event-future-2',
            type: 'event',
            title: 'Weekend Trail Run & Fitness Recovery',
            createdAt: now,
            updatedAt: now,
            properties: {
                bucketKey: 'fitness',
                type: 'block',
                startHour: 9.0,
                endHour: 11.0,
                date: formatDateStr(3),
                completed: false
            }
        },

        // Notebooks
        { id: 'nb-1', type: 'notebook', title: 'Product Discovery Playbook', createdAt: now, updatedAt: now, properties: { order: 0 } },
        { id: 'nb-2', type: 'notebook', title: 'AI Systems Architecture', createdAt: now, updatedAt: now, properties: { order: 1 } },

        // Notes
        {
            id: 'note-1',
            type: 'note',
            title: 'Continuous Discovery Framework',
            createdAt: now,
            updatedAt: now,
            properties: {
                notebook: true,
                notebookId: 'nb-1',
                content: '# Continuous Discovery Framework\n\nWeekly cadence of 2-3 customer discovery interviews.\n\n## Core Questions\n- Walk me through the last time you ran this workflow.\n- Where did you experience the most friction or drop-off?\n- What workaround did you create to solve it?\n\n## Opportunity Solution Tree\nConnect business outcomes directly to unmet customer needs before committing engineering resources.'
            }
        },
        {
            id: 'note-2',
            type: 'note',
            title: 'LLM Guardrail Evaluation Checklist',
            createdAt: now,
            updatedAt: now,
            properties: {
                notebook: true,
                notebookId: 'nb-2',
                content: '# LLM Guardrail Evaluation Checklist\n\nBest practices for deploying agentic workflows in production.\n\n## Factual Faithfulness\n- Decompose outputs into atomic claims.\n- Verify each claim against retrieved source chunks.\n- Calibrate threshold for low-confidence fallback.'
            }
        },

        // Bookmarks / Knowledge Graph Categories
        { id: 'bm-fld-pm', type: 'bookmark_node', title: 'Product Strategy & Management', createdAt: now, updatedAt: now, properties: { parentId: '', kind: 'connector', order: 0 } },
        { id: 'bm-fld-ai', type: 'bookmark_node', title: 'AI & Intelligent Systems', createdAt: now, updatedAt: now, properties: { parentId: '', kind: 'connector', order: 1 } },
        { id: 'bm-fld-ux', type: 'bookmark_node', title: 'Design & User Research', createdAt: now, updatedAt: now, properties: { parentId: '', kind: 'connector', order: 2 } },
        { id: 'bm-fld-eng', type: 'bookmark_node', title: 'Engineering & Architecture', createdAt: now, updatedAt: now, properties: { parentId: '', kind: 'connector', order: 3 } },

        // PM Bookmarks
        { id: 'bm-pm-1', type: 'bookmark_node', title: 'Reforge Product Strategy Stack', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-pm', kind: 'link', url: 'https://www.reforge.com', order: 0 } },
        { id: 'bm-pm-2', type: 'bookmark_node', title: 'Lenny Newsletter Benchmarks', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-pm', kind: 'link', url: 'https://www.lennysnewsletter.com', order: 1 } },
        { id: 'bm-pm-3', type: 'bookmark_node', title: 'Amplitude Analytics Handbook', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-pm', kind: 'link', url: 'https://amplitude.com', order: 2 } },
        { id: 'bm-pm-4', type: 'bookmark_node', title: 'Continuous Discovery Framework', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-pm', kind: 'link', url: 'https://www.producttalk.org', order: 3 } },

        // AI Bookmarks
        { id: 'bm-ai-1', type: 'bookmark_node', title: 'Anthropic Building Effective Agents', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-ai', kind: 'link', url: 'https://anthropic.com/research/building-effective-agents', order: 0 } },
        { id: 'bm-ai-2', type: 'bookmark_node', title: 'Hugging Face Open LLM Leaderboard', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-ai', kind: 'link', url: 'https://huggingface.co/spaces/open-llm-leaderboard', order: 1 } },
        { id: 'bm-ai-3', type: 'bookmark_node', title: 'Google DeepMind Publications', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-ai', kind: 'link', url: 'https://deepmind.google/research', order: 2 } },
        { id: 'bm-ai-4', type: 'bookmark_node', title: 'Vercel AI SDK Core Concepts', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-ai', kind: 'link', url: 'https://sdk.vercel.ai', order: 3 } },

        // UX Bookmarks
        { id: 'bm-ux-1', type: 'bookmark_node', title: 'NN/g Usability Heuristics', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-ux', kind: 'link', url: 'https://www.nngroup.com/articles/ten-usability-heuristics/', order: 0 } },
        { id: 'bm-ux-2', type: 'bookmark_node', title: 'Mobbin Mobile Flow Patterns', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-ux', kind: 'link', url: 'https://mobbin.com', order: 1 } },
        { id: 'bm-ux-3', type: 'bookmark_node', title: 'Laws of UX Psychology Principles', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-ux', kind: 'link', url: 'https://lawsofux.com', order: 2 } },

        // Engineering Bookmarks
        { id: 'bm-eng-1', type: 'bookmark_node', title: 'System Design Primer', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-eng', kind: 'link', url: 'https://github.com/donnemartin/system-design-primer', order: 0 } },
        { id: 'bm-eng-2', type: 'bookmark_node', title: 'Martin Fowler Architecture Guide', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-eng', kind: 'link', url: 'https://martinfowler.com', order: 1 } },
        { id: 'bm-eng-3', type: 'bookmark_node', title: 'Tailwind CSS Component Docs', createdAt: now, updatedAt: now, properties: { parentId: 'bm-fld-eng', kind: 'link', url: 'https://tailwindcss.com', order: 2 } }
    ];

    const relations = [
        { id: 'rel-1', sourceId: 'task-1', targetId: 'note-2', type: 'references' },
        { id: 'rel-2', sourceId: 'task-5', targetId: 'note-1', type: 'references' },
        { id: 'rel-3', sourceId: 'bm-pm-1', targetId: 'nb-1', type: 'relates_to' },
        { id: 'rel-4', sourceId: 'bm-ai-1', targetId: 'nb-2', type: 'relates_to' }
    ];

    return { entities, relations };
};

const STORAGE_KEY_ENTITIES = 'aethel_entities_v2';
const STORAGE_KEY_RELATIONS = 'aethel_relations_v2';

export const useStore = create((set, get) => ({
    // Reactive States
    currentUser: { uid: 'guest-user', isAnonymous: true, displayName: 'Product Manager' },
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

    // Initialize Self-Storage
    initAuth: async () => {
        try {
            // Clean up legacy v1 storage and any old checklist caches to ensure sensitive data is purged
            try {
                localStorage.removeItem('aethel_entities_v1');
                localStorage.removeItem('aethel_relations_v1');
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && (k.startsWith('checklist-') || k.startsWith('aethel_tasks'))) {
                        keysToRemove.push(k);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
            } catch (e) {}

            const rawEntities = localStorage.getItem(STORAGE_KEY_ENTITIES);
            const rawRelations = localStorage.getItem(STORAGE_KEY_RELATIONS);

            if (!rawEntities) {
                const { entities, relations } = getSeedData();
                localStorage.setItem(STORAGE_KEY_ENTITIES, JSON.stringify(entities));
                localStorage.setItem(STORAGE_KEY_RELATIONS, JSON.stringify(relations));
                set({ entities, relations });
            } else {
                let parsedEntities = JSON.parse(rawEntities);
                // Ensure schedule events and rich bookmarks are present if migrating from previous seed
                const hasEvents = parsedEntities.some(e => e.type === 'event');
                const hasFolders = parsedEntities.some(e => e.type === 'bookmark_node' && e.properties?.parentId === '');
                if (!hasEvents || !hasFolders) {
                    const seed = getSeedData();
                    const nonExisting = seed.entities.filter(se => !parsedEntities.some(pe => pe.id === se.id));
                    parsedEntities = [...parsedEntities, ...nonExisting];
                    localStorage.setItem(STORAGE_KEY_ENTITIES, JSON.stringify(parsedEntities));
                }
                set({
                    entities: parsedEntities,
                    relations: rawRelations ? JSON.parse(rawRelations) : []
                });
            }
        } catch (err) {
            console.error('Failed to load from localStorage:', err);
            const { entities, relations } = getSeedData();
            set({ entities, relations });
        }
    },

    // Reset to pristine demo data
    resetToDemoData: () => {
        const { entities, relations } = getSeedData();
        try {
            localStorage.setItem(STORAGE_KEY_ENTITIES, JSON.stringify(entities));
            localStorage.setItem(STORAGE_KEY_RELATIONS, JSON.stringify(relations));
        } catch (e) {}
        set({ entities, relations, undoStack: [], redoStack: [] });
    },

    // Persistence helpers
    persistState: (newEntities, newRelations) => {
        try {
            if (newEntities !== undefined) {
                localStorage.setItem(STORAGE_KEY_ENTITIES, JSON.stringify(newEntities));
            }
            if (newRelations !== undefined) {
                localStorage.setItem(STORAGE_KEY_RELATIONS, JSON.stringify(newRelations));
            }
        } catch (e) {
            console.warn('localStorage write failed:', e);
        }
        get().triggerSyncIndicator();
    },

    // CRUD for Entities
    saveEntity: async (entity) => {
        get().pushToUndoStack();
        const current = get().entities;
        const exists = current.some(e => e.id === entity.id);
        const updated = exists 
            ? current.map(e => e.id === entity.id ? { ...e, ...entity, updatedAt: new Date().toISOString() } : e)
            : [...current, { ...entity, createdAt: entity.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }];
        
        set({ entities: updated });
        get().persistState(updated, undefined);
    },

    deleteEntity: async (id) => {
        get().pushToUndoStack();
        const updatedEntities = get().entities.filter(e => e.id !== id);
        const updatedRelations = get().relations.filter(r => r.sourceId !== id && r.targetId !== id);
        
        set({ entities: updatedEntities, relations: updatedRelations });
        get().persistState(updatedEntities, updatedRelations);
    },

    // CRUD for Relations
    saveRelation: async (relation) => {
        const current = get().relations;
        const exists = current.some(r => r.id === relation.id);
        const updated = exists 
            ? current.map(r => r.id === relation.id ? relation : r)
            : [...current, relation];
        
        set({ relations: updated });
        get().persistState(undefined, updated);
    },

    deleteRelation: async (id) => {
        const updated = get().relations.filter(r => r.id !== id);
        set({ relations: updated });
        get().persistState(undefined, updated);
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
        if (undoStack.length > 10) undoStack.shift();
        set({ undoStack, redoStack: [] });
    },

    applySnapshot: async (snapshot) => {
        set({ isSyncingHistory: true });
        const { entities: targetEntities, relations: targetRelations } = snapshot;
        set({ entities: targetEntities, relations: targetRelations });
        get().persistState(targetEntities, targetRelations);
        setTimeout(() => {
            set({ isSyncingHistory: false });
        }, 300);
    },

    handleUndo: async () => {
        const undoStack = [...get().undoStack];
        if (undoStack.length === 0) return;

        const currentSnapshot = {
            entities: JSON.parse(JSON.stringify(get().entities)),
            relations: JSON.parse(JSON.stringify(get().relations))
        };
        const redoStack = [...get().redoStack, currentSnapshot];
        if (redoStack.length > 10) redoStack.shift();

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
        if (undoStack.length > 10) undoStack.shift();

        set({ undoStack, redoStack });
        await get().applySnapshot(nextSnapshot);
    },

    triggerSyncIndicator: () => {
        set({ syncing: true });
        setTimeout(() => set({ syncing: false }), 800);
    }
}));
