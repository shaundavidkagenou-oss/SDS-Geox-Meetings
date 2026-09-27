import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { architectureTemplateElements } from '../src/templates/defaultTemplates.js';
import { BoardElement, BoardState, UserPresence, ChatMessage, ChecklistItem, TimerState, VotingState } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data', 'rooms');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface RoomData {
  state: BoardState;
  clients: Map<WebSocket, { userId: string; user: UserPresence }>;
  chatHistory: ChatMessage[];
  saveTimeout: NodeJS.Timeout | null;
}

const rooms = new Map<string, RoomData>();

function createDefaultBoardState(roomId: string): BoardState {
  const elementsRecord: Record<string, BoardElement> = {};
  for (const elem of architectureTemplateElements) {
    elementsRecord[elem.id] = { ...elem };
  }

  return {
    roomId,
    boardName: roomId === 'main' || roomId === 'sds-hq' ? 'SDS Geox Global Architecture & Strategy' : `SDS Workspace [${roomId}]`,
    elements: elementsRecord,
    timer: {
      active: false,
      durationSeconds: 300,
      remainingSeconds: 300,
    },
    voting: {
      active: false,
      durationSeconds: 120,
      remainingSeconds: 120,
      maxVotesPerUser: 3,
      topic: 'Prioritize Q4 Architecture & Product Milestones',
    },
    notes: `# 🚀 SDS Geox Meetings — Strategy Agenda\n\n## Objectives\n- Review distributed edge & real-time WebSocket topology\n- Validate sub-20ms latency SLA for multi-region teams\n- Cast dot-votes on high-impact strategic initiatives\n\n## Key Deliverables\n- Finalize ADR-01 (Low Latency streaming)\n- Align on magnetic connector UX spec\n- Deploy multi-tenant preview sandbox`,
    checklist: [
      { id: 'item-1', text: 'Benchmark WebSocket cluster connection scaling', done: true, assignee: 'Elena' },
      { id: 'item-2', text: 'Verify CRDT delta state synchronization', done: true, assignee: 'Marcus' },
      { id: 'item-3', text: 'Audit multi-region PostgreSQL failover latency', done: false, assignee: 'Sarah' },
      { id: 'item-4', text: 'Present laser-pointer collaborative demo to stakeholders', done: false, assignee: 'Elena' },
    ],
    updatedAt: Date.now(),
  };
}

function loadRoomState(roomId: string): BoardState {
  const filePath = path.join(DATA_DIR, `${roomId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error(`Error reading board file for ${roomId}, creating default`, err);
    }
  }
  const defaultState = createDefaultBoardState(roomId);
  saveRoomState(roomId, defaultState);
  return defaultState;
}

function scheduleSave(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  if (room.saveTimeout) {
    clearTimeout(room.saveTimeout);
  }
  room.saveTimeout = setTimeout(() => {
    saveRoomState(roomId, room.state);
    room.saveTimeout = null;
  }, 1000);
}

function saveRoomState(roomId: string, state: BoardState) {
  try {
    const filePath = path.join(DATA_DIR, `${roomId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error saving room ${roomId}:`, err);
  }
}

function getOrCreateRoom(roomId: string): RoomData {
  let room = rooms.get(roomId);
  if (!room) {
    const state = loadRoomState(roomId);
    room = {
      state,
      clients: new Map(),
      chatHistory: [
        {
          id: 'welcome-1',
          userId: 'system',
          userName: 'SDS Geox Bot',
          userColor: '#6366f1',
          text: `Welcome to SDS Geox Meetings workspace "${roomId}"! Live collaboration is active.`,
          timestamp: Date.now() - 60000,
        },
      ],
      saveTimeout: null,
    };
    rooms.set(roomId, room);
  }
  return room;
}

// App & Server
const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'SDS Geox Meetings',
    timestamp: Date.now(),
    activeRooms: rooms.size,
  });
});

// List rooms
app.get('/api/rooms', (req, res) => {
  const list = Array.from(rooms.entries()).map(([id, room]) => ({
    roomId: id,
    boardName: room.state.boardName,
    elementCount: Object.keys(room.state.elements).length,
    activeUsers: room.clients.size,
    updatedAt: room.state.updatedAt,
  }));
  res.json({ rooms: list });
});

// Room state endpoint
app.get('/api/rooms/:roomId', (req, res) => {
  const room = getOrCreateRoom(req.params.roomId);
  res.json({
    state: room.state,
    chatHistory: room.chatHistory,
  });
});

// Reset room endpoint
app.post('/api/rooms/:roomId/reset', (req, res) => {
  const roomId = req.params.roomId;
  const room = getOrCreateRoom(roomId);
  room.state = createDefaultBoardState(roomId);
  saveRoomState(roomId, room.state);

  // Broadcast to all active connections
  const payload = JSON.stringify({
    type: 'ROOM_STATE',
    state: room.state,
  });
  for (const client of room.clients.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }

  res.json({ success: true, message: `Room ${roomId} reset to default template` });
});

// Serve frontend static files
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  if (url.pathname === '/ws' || url.pathname.startsWith('/ws')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    // If upgraded on any path, still accept if it's a websocket
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', (ws: WebSocket, req) => {
  let currentRoomId = 'sds-hq';
  let currentUser: UserPresence | null = null;

  function broadcastToRoom(type: string, data: any, excludeSelf = false) {
    const room = rooms.get(currentRoomId);
    if (!room) return;
    const msg = JSON.stringify({ type, ...data });
    for (const [client] of room.clients.entries()) {
      if (excludeSelf && client === ws) continue;
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  }

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const room = getOrCreateRoom(currentRoomId);

      switch (msg.type) {
        case 'JOIN_ROOM': {
          currentRoomId = msg.roomId || 'sds-hq';
          const newRoom = getOrCreateRoom(currentRoomId);
          currentUser = msg.user;
          newRoom.clients.set(ws, { userId: currentUser.userId, user: currentUser });

          // Send full current room state + active users list + chat history
          const activeUsers: Record<string, UserPresence> = {};
          for (const c of newRoom.clients.values()) {
            activeUsers[c.userId] = c.user;
          }

          ws.send(
            JSON.stringify({
              type: 'INIT_STATE',
              state: newRoom.state,
              users: activeUsers,
              chatHistory: newRoom.chatHistory,
            })
          );

          // Broadcast new user to everyone else
          broadcastToRoom('USER_JOINED', { user: currentUser }, true);
          break;
        }

        case 'CURSOR_MOVE': {
          if (!currentUser) return;
          currentUser.cursor = msg.cursor;
          currentUser.selectedElementIds = msg.selectedIds || [];
          currentUser.lastActive = Date.now();
          broadcastToRoom('USER_CURSOR', {
            userId: currentUser.userId,
            cursor: msg.cursor,
            selectedIds: msg.selectedIds,
          }, true);
          break;
        }

        case 'LASER_STROKE': {
          if (!currentUser) return;
          broadcastToRoom('LASER_STROKE', {
            userId: currentUser.userId,
            userName: currentUser.userName,
            userColor: currentUser.userColor,
            point: msg.point,
          }, true);
          break;
        }

        case 'ELEMENT_CREATE': {
          const elem: BoardElement = msg.element;
          room.state.elements[elem.id] = elem;
          room.state.updatedAt = Date.now();
          scheduleSave(currentRoomId);
          broadcastToRoom('ELEMENT_CREATE', { element: elem }, true);
          break;
        }

        case 'ELEMENT_UPDATE': {
          const { id, ...updates } = msg.element;
          if (room.state.elements[id]) {
            room.state.elements[id] = { ...room.state.elements[id], ...updates, updatedAt: Date.now() };
            room.state.updatedAt = Date.now();
            scheduleSave(currentRoomId);
            broadcastToRoom('ELEMENT_UPDATE', { element: room.state.elements[id] }, true);
          }
          break;
        }

        case 'ELEMENT_BULK_UPDATE': {
          const elementsList = msg.elements as (Partial<BoardElement> & { id: string })[];
          const updated: BoardElement[] = [];
          for (const item of elementsList) {
            if (room.state.elements[item.id]) {
              room.state.elements[item.id] = { ...room.state.elements[item.id], ...item, updatedAt: Date.now() };
              updated.push(room.state.elements[item.id]);
            }
          }
          room.state.updatedAt = Date.now();
          scheduleSave(currentRoomId);
          broadcastToRoom('ELEMENT_BULK_UPDATE', { elements: updated }, true);
          break;
        }

        case 'ELEMENT_DELETE': {
          const ids: string[] = msg.elementIds || [];
          for (const id of ids) {
            delete room.state.elements[id];
          }
          room.state.updatedAt = Date.now();
          scheduleSave(currentRoomId);
          broadcastToRoom('ELEMENT_DELETE', { elementIds: ids }, true);
          break;
        }

        case 'BOARD_CLEAR': {
          room.state.elements = {};
          room.state.updatedAt = Date.now();
          scheduleSave(currentRoomId);
          broadcastToRoom('BOARD_CLEAR', {}, true);
          break;
        }

        case 'TEMPLATE_LOAD': {
          const elems: BoardElement[] = msg.elements || [];
          room.state.elements = {};
          for (const elem of elems) {
            room.state.elements[elem.id] = elem;
          }
          room.state.updatedAt = Date.now();
          scheduleSave(currentRoomId);
          broadcastToRoom('TEMPLATE_LOAD', { templateId: msg.templateId, elements: elems }, true);
          break;
        }

        case 'VOTE_CAST': {
          const { elementId, userId, action } = msg;
          const target = room.state.elements[elementId];
          if (target && ('votes' in target)) {
            const votes = new Set(target.votes || []);
            if (action === 'add') {
              votes.add(userId);
            } else {
              votes.delete(userId);
            }
            target.votes = Array.from(votes);
            target.updatedAt = Date.now();
            scheduleSave(currentRoomId);
            broadcastToRoom('ELEMENT_UPDATE', { element: target }, false);
          }
          break;
        }

        case 'REACTION_BURST': {
          broadcastToRoom('REACTION_BURST', {
            id: `rx_${Date.now()}_${Math.random()}`,
            emoji: msg.emoji,
            x: msg.x,
            y: msg.y,
            userId: msg.userId,
            userName: msg.userName,
          }, false);
          break;
        }

        case 'CHAT_MESSAGE': {
          const chatMsg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            userId: msg.userId,
            userName: msg.userName,
            userColor: msg.userColor,
            text: msg.text,
            timestamp: Date.now(),
          };
          room.chatHistory.push(chatMsg);
          if (room.chatHistory.length > 200) {
            room.chatHistory.shift();
          }
          broadcastToRoom('CHAT_MESSAGE', { message: chatMsg }, false);
          break;
        }

        case 'TIMER_SYNC': {
          room.state.timer = msg.timer;
          scheduleSave(currentRoomId);
          broadcastToRoom('TIMER_SYNC', { timer: msg.timer }, true);
          break;
        }

        case 'VOTING_SESSION_SYNC': {
          room.state.voting = msg.voting;
          scheduleSave(currentRoomId);
          broadcastToRoom('VOTING_SESSION_SYNC', { voting: msg.voting }, true);
          break;
        }

        case 'NOTES_UPDATE': {
          room.state.notes = msg.notes;
          scheduleSave(currentRoomId);
          broadcastToRoom('NOTES_UPDATE', { notes: msg.notes }, true);
          break;
        }

        case 'CHECKLIST_UPDATE': {
          room.state.checklist = msg.checklist;
          scheduleSave(currentRoomId);
          broadcastToRoom('CHECKLIST_UPDATE', { checklist: msg.checklist }, true);
          break;
        }

        case 'USER_STATUS_UPDATE': {
          if (!currentUser) return;
          Object.assign(currentUser, msg.updates);
          broadcastToRoom('USER_STATUS_UPDATE', { userId: currentUser.userId, updates: msg.updates }, true);
          break;
        }
      }
    } catch (e) {
      console.error('Error handling websocket message:', e);
    }
  });

  ws.on('close', () => {
    const room = rooms.get(currentRoomId);
    if (room && currentUser) {
      room.clients.delete(ws);
      broadcastToRoom('USER_LEFT', { userId: currentUser.userId }, true);
    }
  });
});

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 SDS Geox Meetings server running on http://${HOST}:${PORT}`);
  console.log(`📡 WebSocket server listening on ws://${HOST}:${PORT}/ws`);
});
