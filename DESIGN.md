# Aethel (Flow) — Personal OS Architecture Blueprint

This document serves as the living reference and architectural specifications for **Aethel**, a unified Personal OS designed specifically to replace fragmented productivity, note-taking, reading, and AI tools into a single, cohesive, free-tier-friendly web environment.

---

## 👁️ Core Vision

* **Anti-Fragmented**: Combine task tracking, journaling, information organization, article reading, and personal AI workspace into a single dashboard.
* **100% Personal & Free**: Built on top of the Firebase free tier and browser local storage/cache.
* **Tailored Aesthetics & Usability**: Clean HSL-based design system, modern micro-interactions, responsive grids, and focus-oriented states.

---

## 🗄️ Database Architecture: EAV+R Graph Model

To enable a future-proof **Knowledge Graph** where any concept (a Note, Task, Person, or Article) can connect to any other, Aethel uses an **Entity-Attribute-Value + Relation (EAV+R)** schema model mapped onto Cloud Firestore.

### 1. `entities` (Collection)
Every object in the OS is represented as an entity node.
```typescript
interface Entity {
  id: string;          // Unique ID (e.g. timestamp or UUID)
  type: 'task' | 'note' | 'journal' | 'source' | 'bucket' | 'event';
  title: string;       // Primary visual label
  content: string;     // Text contents, Markdown, JSON blocks, etc.
  createdAt: string;   // ISO Timestamp
  updatedAt: string;   // ISO Timestamp
  properties: {
    // Type-specific metadata fields
    status?: 'active' | 'archived' | 'done';
    order?: number;
    color?: string;    // Custom theme variables
    [key: string]: any;
  };
}
```

### 2. `relations` (Collection)
Relationships act as the edges connecting your entity nodes.
```typescript
interface Relation {
  id: string;          // composite: `${sourceId}_${type}_${targetId}`
  sourceId: string;    // ID of starting Entity
  targetId: string;    // ID of destination Entity
  type: 'belongs_to' | 'references' | 'blocks' | 'scheduled_for' | 'associated_with';
  createdAt: string;
}
```

---

## 🏗️ Application Structure

```
aethel/
├── DESIGN.md                 # This system specification document
├── src/
│   ├── store/                # Unified state management
│   │   └── useStore.js       # Zustand state, database CRUD, and Firestore sync
│   ├── modules/              # Pluggable features
│   │   ├── board/            # Kanban task manager
│   │   ├── schedule/         # Intention tracker and time budgeter
│   │   ├── journal/          # (Future) Note and document management
│   │   └── reader/           # (Future) Saved links and newsletter feed
```

### 1. Unified State Store (Zustand)
Instead of lifting state into a massive `App.jsx`, state is managed by a single store:
* Coordinates active Firebase sync listeners.
* Automatically creates, edits, deletes, and restores entities/relations.
* Exposes transactional history hooks for instant client-side Undo/Redo operations.

### 2. Registry-Based Modules
The UI features a shell layout containing a sidebar navigation menu and a viewport. The viewport loads modules dynamically based on a modular registry:
```javascript
const modules = {
  board: { name: 'Board', component: BoardView, icon: 'ph-kanban' },
  schedule: { name: 'Schedule', component: ScheduleView, icon: 'ph-calendar' },
};
```
Adding new apps (like a Journal or RSS Reader) is as simple as registering the module under this configuration.
