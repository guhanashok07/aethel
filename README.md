# Aethel

A minimalist, browser-native personal OS and modular workspace designed for product managers and builders. Built with React, Vite, and Tailwind CSS.

[**Live Interactive Demo**](https://guhanashok07.github.io/aethel/)

---

## Overview

Aethel combines daily timetable blocking, Kanban execution boards, markdown notebooks, and a visual knowledge vault into a unified, distraction-free workspace.

### Core Modules

* **Daily Timetable & Time Budgeting**: Continuous 24-hour visual schedule with time-budget allocation tracking across strategy, discovery, execution, and analytics.
* **Kanban Execution Board**: Streamlined task tracking organized by product spaces (Sprint Focus, Customer Discovery, PRDs & Specs, Growth & Analytics).
* **Notebooks**: Markdown documentation for continuous discovery frameworks, architecture decisions, and sprint retros.
* **Knowledge Vault**: Hierarchical bookmarking and relationship graph connecting notes, tasks, and reference material.
* **Client-Side Self-Storage**: Runs entirely in the browser using `localStorage`. Zero external database connections, instant responsiveness, and full data privacy.

---

## Tech Stack

* **Frontend**: React 19, Tailwind CSS
* **State Management**: Zustand
* **Build Tool**: Vite
* **Persistence**: Browser `localStorage` (Zero external network dependencies)

---

## Getting Started

### Prerequisites

* Node.js (v18 or higher)
* npm

### Installation

```bash
# Clone the repository
git clone https://github.com/guhanashok07/aethel.git
cd aethel

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) to view it in the browser.

### Building for Production

```bash
npm run build
```

The production assets will be output to the `dist/` directory.

---

## License

MIT
