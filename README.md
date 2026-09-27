# SDS Geox Meetings 🚀
### Intelligent Real-Time Collaborative Whiteboards & Strategy Hub for Remote Teams

**SDS Geox Meetings** is an enterprise-grade, browser-based brainstorming canvas leveraging high-throughput WebSockets. Designed specifically for distributed engineering, product, and executive strategy teams to visually architect systems, map out roadmaps, conduct sprint retrospectives, and brainstorm together with zero lag.

---

## ✨ Core Highlights & Features

### 1. Real-Time Multiplayer Sync via WebSockets
- **Ultra-low latency delta streaming**: Sub-15ms broadcast for freehand drawing, shapes, connectors, and transformations.
- **Live Cursors & Presence Roster**: View teammates' real-time mouse cursors with name tags, color badges, and active element selection outlines.
- **Viewport Follow Mode**: Click on any team member's avatar in the top bar to lock your camera to their viewport and follow their screen during strategy presentations.
- **Simulate Teammates Mode (Demo AI)**: One-click interactive simulation with AI teammates (*Elena Rostova - Principal Architect*, *Marcus Vance - Product Director*, *Sarah Lin - Staff Frontend*) moving cursors, adding sticky notes, casting votes, and chatting in real time.
- **Live Floating Reaction Bursts**: Send floating emojis (`🎉`, `🚀`, `❤️`, `💡`, `🔥`, `👏`, `💯`, `🎯`) that animate upwards from your cursor position across all connected screens.

### 2. Comprehensive Visual Whiteboard Engine
- **Infinite Zoom & Pan Canvas**: Smooth hardware-accelerated transforms from 15% to 400% zoom with mouse wheel, trackpad gestures, and mini-map navigation.
- **Vector Pen & Highlighter**: Smooth Bezier/Catmull-Rom curves with variable stroke widths and semi-transparent chisel highlighters.
- **Geometric Shapes**: Rectangles, Circles/Ellipses, Decision Diamonds, Triangles, Hexagons, Cloud Infrastructure nodes, Database Cylinders, and Milestone Stars.
- **Interactive Sticky Notes**: 8 color themes (*Canary Yellow, Ocean Cyan, Mint Green, Rose Pink, Lavender Purple, Sunset Peach, Obsidian Dark, Crisp White*), live multiline markdown editing, and collaborative **Dot Voting** tally badges.
- **Smart Connectors & Arrows**: Straight, quadratic curved, and orthogonal elbow connectors with magnetic snap to shape cardinal anchor points.
- **Strategy & Agile Cards**: Prioritized cards with story points, assignee badges, status pills (Backlog, In Progress, In Review, Done), and priority levels (Critical, High, Medium, Low).
- **Section Frames & Swimlanes**: Visually organized tier grouping containers (e.g., Client Layer, API Gateway, Distributed Microservices, Persistence Tier).
- **Live Laser Pointer Mode**: Fading glowing neon laser trails for presenting architecture diagrams.
- **Interactive Mini-Map**: Dynamic thumbnail overview of all elements with draggable viewport box.

### 3. Integrated Meeting Suite
- **Synchronized Brainstorming Countdown Timer**: Shared Pomodoro / meeting timer (1m, 3m, 5m, 10m presets) with synchronized play, pause, and reset.
- **Collaborative Dot-Voting Session**: Configurable voting rounds with max votes per participant, real-time leaderboard ranking top ideas, and celebratory confetti blast!
- **Meeting Audio/Video Control Dock**: Simulated mic with live decibel audio wave visualization, webcam picture-in-picture video tile preview, screen share toggle, and meeting recording indicator.
- **Live Meeting Chat**: Persistent chat history with timestamps, user color badges, and unread counter.
- **Meeting Agenda & Collaborative Notes**: Synchronized markdown notes dock with interactive action item checklist (plus 1-click "Convert to Sticky on Whiteboard").

### 4. Enterprise Strategy Blueprints & Templates
- **Cloud & System Architecture**: Pre-loaded with distributed microservices, edge routing, Envoy API Gateway, Redis Sentinel, and PostgreSQL database cluster.
- **Product Strategy SWOT Matrix**: 4-quadrant strategic positioning framework with pre-populated stickies.
- **Agile Sprint Retrospective**: Multi-column sprint review with "What Went Well 🚀", "What Could Be Improved 🛠️", "Puzzles ❓", and "Action Items 🎯".

### 5. Export & Data Persistence
- **High-Resolution PNG**: Export retina-quality images with dark or transparent background.
- **Clean Vector SVG**: Export scalable vector graphics for documentation and PRDs.
- **JSON Board Backups**: 1-click export and import of entire board state.
- **Automatic Disk Persistence**: Rooms persist to disk in `data/rooms/{roomId}.json`.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Rendering Pipeline**: Hardware-accelerated SVG with dynamic coordinate mapping and Level of Detail (LOD).
- **Backend**: Node.js, Express 5, `ws` (WebSockets), JSON disk storage.
- **Networking**: Bidirectional WebSocket connection on `/ws` with automatic reconnect.

---

## 🚀 Getting Started

### Development
```bash
npm install
npm run build
npm start
```

Open `http://localhost:3000` in your browser. Join with query parameters to test multi-room collaboration:
```
http://localhost:3000/?room=sds-hq
http://localhost:3000/?room=q4-strategy
```

---

## ⌨️ Keyboard Shortcuts
- `V`: Select & Transform tool
- `H`: Pan tool (or hold `Space` + drag)
- `P`: Vector Pen
- `M`: Translucent Highlighter
- `E`: Eraser
- `N`: Sticky Note
- `A`: Arrow / Connector
- `C`: Strategy Card
- `T`: Rich Text Block
- `F`: Section Frame
- `L`: Laser Pointer
- `Ctrl / Cmd + Z`: Undo
- `Ctrl / Cmd + Y` or `Cmd + Shift + Z`: Redo
- `Ctrl / Cmd + D`: Duplicate selected
- `Delete` / `Backspace`: Delete selected
- `0`: Reset Zoom to 100%
