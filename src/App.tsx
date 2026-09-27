import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ToolType,
  ShapeType,
  BoardElement,
  CanvasTransform,
  Point,
  UserPresence,
  ChatMessage,
  ChecklistItem,
  TimerState,
  VotingState,
  ReactionBurst,
  TemplateDefinition,
} from './types';
import { TopNav } from './components/TopNav';
import { Toolbar, STICKY_PALETTE } from './components/Toolbar';
import { StyleBar } from './components/StyleBar';
import { Canvas } from './components/Canvas';
import { MeetingBar } from './components/MeetingBar';
import { ChatDrawer } from './components/ChatDrawer';
import { NotesDrawer } from './components/NotesDrawer';
import { MiniMap } from './components/MiniMap';
import { TemplatesModal } from './components/TemplatesModal';
import { VotingModal } from './components/VotingModal';
import { ShareModal } from './components/ShareModal';
import { RoomModal } from './components/RoomModal';
import { architectureTemplateElements } from './templates/defaultTemplates';
import { simulatedTeammatesList } from './utils/teammateSimulation';
import { exportBoardAsJson, exportSvgElementAsSvg, exportSvgElementAsPng } from './utils/export';

// Generate random user
function getInitialUser(): UserPresence {
  const names = ['Alex Mercer', 'Jordan Reed', 'Taylor Swift', 'Morgan Drake', 'Casey Vance'];
  const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  return {
    userId,
    userName: randomName,
    userColor: randomColor,
    avatar: '',
    role: 'Editor',
    cursor: null,
    selectedElementIds: [],
    laserPoints: [],
    isSpeaking: false,
    isMuted: true,
    hasVideo: false,
    isScreenSharing: false,
    lastActive: Date.now(),
  };
}

export default function App() {
  // Room state
  const [roomId, setRoomId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('room') || 'sds-hq';
    }
    return 'sds-hq';
  });

  const [boardName, setBoardName] = useState('SDS Geox Global Architecture & Strategy');
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserPresence>(getInitialUser);
  const [users, setUsers] = useState<Record<string, UserPresence>>({});

  // Canvas elements & undo/redo
  const [elements, setElements] = useState<Record<string, BoardElement>>({});
  const [history, setHistory] = useState<Record<string, BoardElement>[]>([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Active Tool & Selection
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [stickyColor, setStickyColor] = useState<string>(STICKY_PALETTE[0].color);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Canvas Transform
  const [transform, setTransform] = useState<CanvasTransform>({ x: 40, y: 30, scale: 0.85 });
  const [gridType, setGridType] = useState<'dots' | 'lines' | 'none'>('dots');
  const [isDark, setIsDark] = useState(true);

  // Meeting Suite Features
  const [isMuted, setIsMuted] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [timer, setTimer] = useState<TimerState>({
    active: false,
    durationSeconds: 300,
    remainingSeconds: 300,
  });

  const [voting, setVoting] = useState<VotingState>({
    active: false,
    durationSeconds: 120,
    remainingSeconds: 120,
    maxVotesPerUser: 3,
    topic: 'Prioritize High-Impact Initiatives',
  });

  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [reactions, setReactions] = useState<ReactionBurst[]>([]);

  // Modals & Drawers
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRoomOpen, setIsRoomOpen] = useState(false);

  // Teammates Simulation
  const [simulateTeammates, setSimulateTeammates] = useState(true);
  const [followingUserId, setFollowingUserId] = useState<string | null>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerSizeRef = useRef<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Track window size for minimap
  useEffect(() => {
    const handleResize = () => {
      containerSizeRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // WebSocket Connection
  useEffect(() => {
    let isMounted = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log(`Connecting to WebSocket at ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted) return;
      console.log('Connected to SDS Geox Meetings server');
      setConnected(true);

      // Join room
      ws.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          roomId,
          user: currentUser,
        })
      );
    };

    ws.onmessage = (event) => {
      if (!isMounted) return;
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'INIT_STATE':
            setElements(msg.state.elements || {});
            setBoardName(msg.state.boardName || 'SDS Workspace');
            setTimer(msg.state.timer || timer);
            setVoting(msg.state.voting || voting);
            setNotes(msg.state.notes || '');
            setChecklist(msg.state.checklist || []);
            setUsers(msg.users || {});
            if (msg.chatHistory) setChatMessages(msg.chatHistory);
            break;

          case 'ROOM_STATE':
            setElements(msg.state.elements || {});
            break;

          case 'USER_JOINED':
            setUsers((prev) => ({ ...prev, [msg.user.userId]: msg.user }));
            break;

          case 'USER_LEFT':
            setUsers((prev) => {
              const copy = { ...prev };
              delete copy[msg.userId];
              return copy;
            });
            break;

          case 'USER_CURSOR':
            setUsers((prev) => {
              const u = prev[msg.userId];
              if (!u) return prev;
              return {
                ...prev,
                [msg.userId]: {
                  ...u,
                  cursor: msg.cursor,
                  selectedElementIds: msg.selectedIds || [],
                },
              };
            });
            // If following this user, adjust transform
            if (followingUserId === msg.userId && msg.cursor) {
              setTransform((prev) => ({
                ...prev,
                x: window.innerWidth / 2 - msg.cursor.x * prev.scale,
                y: window.innerHeight / 2 - msg.cursor.y * prev.scale,
              }));
            }
            break;

          case 'LASER_STROKE':
            // Add to remote user laser points
            break;

          case 'ELEMENT_CREATE':
            setElements((prev) => ({ ...prev, [msg.element.id]: msg.element }));
            break;

          case 'ELEMENT_UPDATE':
            setElements((prev) => ({ ...prev, [msg.element.id]: msg.element }));
            break;

          case 'ELEMENT_BULK_UPDATE':
            setElements((prev) => {
              const next = { ...prev };
              for (const elem of msg.elements) {
                next[elem.id] = elem;
              }
              return next;
            });
            break;

          case 'ELEMENT_DELETE':
            setElements((prev) => {
              const next = { ...prev };
              for (const id of msg.elementIds) {
                delete next[id];
              }
              return next;
            });
            break;

          case 'BOARD_CLEAR':
            setElements({});
            break;

          case 'TEMPLATE_LOAD':
            const newElemMap: Record<string, BoardElement> = {};
            for (const elem of msg.elements) {
              newElemMap[elem.id] = elem;
            }
            setElements(newElemMap);
            break;

          case 'REACTION_BURST':
            setReactions((prev) => [...prev, msg]);
            setTimeout(() => {
              setReactions((prev) => prev.filter((r) => r.id !== msg.id));
            }, 1900);
            break;

          case 'CHAT_MESSAGE':
            setChatMessages((prev) => [...prev, msg.message]);
            if (!isChatOpen) {
              setUnreadChatCount((prev) => prev + 1);
            }
            break;

          case 'TIMER_SYNC':
            setTimer(msg.timer);
            break;

          case 'VOTING_SESSION_SYNC':
            setVoting(msg.voting);
            break;

          case 'NOTES_UPDATE':
            setNotes(msg.notes);
            break;

          case 'CHECKLIST_UPDATE':
            setChecklist(msg.checklist);
            break;
        }
      } catch (err) {
        console.error('Error parsing ws message', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      if (isMounted) setConnected(false);
    };

    return () => {
      isMounted = false;
      ws.close();
    };
  }, [roomId]);

  // Send WS message helper
  const sendWs = (type: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  };

  // Timer interval
  useEffect(() => {
    if (!timer.active) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev.remainingSeconds <= 1) {
          sendWs('TIMER_SYNC', { timer: { ...prev, active: false, remainingSeconds: 0 } });
          return { ...prev, active: false, remainingSeconds: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timer.active]);

  // Voting session interval
  useEffect(() => {
    if (!voting.active) return;
    const interval = setInterval(() => {
      setVoting((prev) => {
        if (prev.remainingSeconds <= 1) {
          sendWs('VOTING_SESSION_SYNC', { voting: { ...prev, active: false, remainingSeconds: 0 } });
          return { ...prev, active: false, remainingSeconds: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [voting.active]);

  // Recording counter
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Simulated Teammates Loop
  useEffect(() => {
    if (!simulateTeammates) {
      // Remove simulated users
      setUsers((prev) => {
        const copy = { ...prev };
        for (const sim of simulatedTeammatesList) {
          delete copy[sim.user.userId];
        }
        return copy;
      });
      return;
    }

    // Add simulated users to active users
    setUsers((prev) => {
      const copy = { ...prev };
      for (const sim of simulatedTeammatesList) {
        copy[sim.user.userId] = { ...sim.user };
      }
      return copy;
    });

    const interval = setInterval(() => {
      const now = Date.now();
      for (const sim of simulatedTeammatesList) {
        // Smoothly interpolate towards target
        const dx = sim.targetX - sim.currentX;
        const dy = sim.targetY - sim.currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 15) {
          // Pick new random target around whiteboard elements
          sim.targetX = 150 + Math.random() * 1200;
          sim.targetY = 150 + Math.random() * 700;
        } else {
          sim.currentX += dx * sim.speed;
          sim.currentY += dy * sim.speed;
        }

        // Update presence
        setUsers((prev) => ({
          ...prev,
          [sim.user.userId]: {
            ...sim.user,
            cursor: { x: Math.round(sim.currentX), y: Math.round(sim.currentY) },
          },
        }));

        // Periodic simulated action (chat or reaction)
        if (now > sim.nextActionTime) {
          sim.nextActionTime = now + 12000 + Math.random() * 15000;
          const phrase = sim.chatPhrases[Math.floor(Math.random() * sim.chatPhrases.length)];
          const chatMsg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random()}`,
            userId: sim.user.userId,
            userName: sim.user.userName,
            userColor: sim.user.userColor,
            text: phrase,
            timestamp: Date.now(),
          };
          setChatMessages((prev) => [...prev, chatMsg]);
          if (!isChatOpen) setUnreadChatCount((prev) => prev + 1);

          // Emojis
          const emojis = ['🚀', '🎉', '💡', '👏', '❤️'];
          const rx: ReactionBurst = {
            id: `rx_${Date.now()}`,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            x: sim.currentX,
            y: sim.currentY,
            userId: sim.user.userId,
            userName: sim.user.userName.split(' ')[0],
          };
          setReactions((prev) => [...prev, rx]);
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== rx.id));
          }, 1900);
        }
      }
    }, 60);

    return () => clearInterval(interval);
  }, [simulateTeammates, isChatOpen]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in textarea or input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') setCurrentTool('select');
      if (e.key === 'h' || e.key === 'H') setCurrentTool('pan');
      if (e.key === 'p' || e.key === 'P') setCurrentTool('pen');
      if (e.key === 'm' || e.key === 'M') setCurrentTool('highlighter');
      if (e.key === 'e' || e.key === 'E') setCurrentTool('eraser');
      if (e.key === 'n' || e.key === 'N') setCurrentTool('sticky');
      if (e.key === 'a' || e.key === 'A') setCurrentTool('connector');
      if (e.key === 'c' || e.key === 'C') setCurrentTool('strategyCard');
      if (e.key === 't' || e.key === 'T') setCurrentTool('text');
      if (e.key === 'f' || e.key === 'F') setCurrentTool('frame');
      if (e.key === 'l' || e.key === 'L') setCurrentTool('laser');

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        handleRedo();
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          handleDeleteElements(selectedIds);
        }
      }

      // Duplicate (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
      }

      // Reset Zoom (0)
      if (e.key === '0') {
        setTransform({ x: 40, y: 30, scale: 1 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, historyIndex, history]);

  // Undo / Redo helpers
  const pushHistory = (newElems: Record<string, BoardElement>) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElems);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevElements = history[prevIndex];
      setElements(prevElements);
      sendWs('ELEMENT_BULK_UPDATE', { elements: Object.values(prevElements) });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextElements = history[nextIndex];
      setElements(nextElements);
      sendWs('ELEMENT_BULK_UPDATE', { elements: Object.values(nextElements) });
    }
  };

  // Element actions
  const handleAddElement = (newElement: BoardElement) => {
    const updated = { ...elements, [newElement.id]: newElement };
    setElements(updated);
    pushHistory(updated);
    sendWs('ELEMENT_CREATE', { element: newElement });
  };

  const handleUpdateElement = (updates: Partial<BoardElement> & { id: string }) => {
    if (!elements[updates.id]) return;
    const updatedElem = { ...elements[updates.id], ...updates };
    const updatedMap = { ...elements, [updates.id]: updatedElem };
    setElements(updatedMap);
    sendWs('ELEMENT_UPDATE', { element: updatedElem });
  };

  const handleBulkUpdateElements = (bulkUpdates: (Partial<BoardElement> & { id: string })[]) => {
    const updatedMap = { ...elements };
    for (const item of bulkUpdates) {
      if (updatedMap[item.id]) {
        updatedMap[item.id] = { ...updatedMap[item.id], ...item };
      }
    }
    setElements(updatedMap);
    sendWs('ELEMENT_BULK_UPDATE', { elements: bulkUpdates });
  };

  const handleDeleteElements = (ids: string[]) => {
    const copy = { ...elements };
    for (const id of ids) {
      delete copy[id];
    }
    setElements(copy);
    setSelectedIds([]);
    pushHistory(copy);
    sendWs('ELEMENT_DELETE', { elementIds: ids });
  };

  const handleDuplicate = () => {
    if (selectedIds.length === 0) return;
    const newElementsMap = { ...elements };
    const newSelectedIds: string[] = [];

    for (const id of selectedIds) {
      const original = elements[id];
      if (!original) continue;
      const dupId = `${original.type}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const duplicated: BoardElement = {
        ...original,
        id: dupId,
        x: (original.x || 0) + 30,
        y: (original.y || 0) + 30,
        updatedAt: Date.now(),
      } as BoardElement;
      newElementsMap[dupId] = duplicated;
      newSelectedIds.push(dupId);
      sendWs('ELEMENT_CREATE', { element: duplicated });
    }

    setElements(newElementsMap);
    setSelectedIds(newSelectedIds);
    pushHistory(newElementsMap);
  };

  const handleBringToFront = () => {
    if (selectedIds.length === 0) return;
    const maxZ = Math.max(...Object.values(elements).map((e) => e.zIndex || 0), 0);
    const updates = selectedIds.map((id) => ({ id, zIndex: maxZ + 1 }));
    handleBulkUpdateElements(updates);
  };

  const handleSendToBack = () => {
    if (selectedIds.length === 0) return;
    const minZ = Math.min(...Object.values(elements).map((e) => e.zIndex || 0), 0);
    const updates = selectedIds.map((id) => ({ id, zIndex: Math.max(0, minZ - 1) }));
    handleBulkUpdateElements(updates);
  };

  const handleCastVote = (elementId: string) => {
    const elem = elements[elementId];
    if (!elem || !('votes' in elem)) return;
    const votes = (elem as any).votes || [];
    const hasVoted = votes.includes(currentUser.userId);
    const action = hasVoted ? 'remove' : 'add';

    sendWs('VOTE_CAST', {
      elementId,
      userId: currentUser.userId,
      action,
    });
  };

  // Cursor Move
  const handleCursorMove = (p: Point) => {
    if (followingUserId) {
      setFollowingUserId(null); // Cancel following if local user moves
    }
    sendWs('CURSOR_MOVE', {
      cursor: p,
      selectedIds,
    });
  };

  const handleLaserStroke = (p: Point) => {
    sendWs('LASER_STROKE', { point: p });
  };

  // Reactions
  const handleSendReaction = (emoji: string) => {
    const centerWorldX = (window.innerWidth / 2 - transform.x) / transform.scale;
    const centerWorldY = (window.innerHeight / 2 - transform.y) / transform.scale;
    const rx: ReactionBurst = {
      id: `rx_${Date.now()}_${Math.random()}`,
      emoji,
      x: centerWorldX,
      y: centerWorldY,
      userId: currentUser.userId,
      userName: currentUser.userName.split(' ')[0],
    };
    sendWs('REACTION_BURST', rx);
  };

  // Template apply
  const handleApplyTemplate = (template: TemplateDefinition, replace: boolean) => {
    let nextElements: Record<string, BoardElement> = {};
    if (!replace) {
      nextElements = { ...elements };
    }
    for (const elem of template.elements) {
      const uniqueId = replace ? elem.id : `${elem.id}_${Date.now()}`;
      nextElements[uniqueId] = {
        ...elem,
        id: uniqueId,
        x: replace ? elem.x : elem.x + 100,
        y: replace ? elem.y : elem.y + 100,
      };
    }
    setElements(nextElements);
    pushHistory(nextElements);
    sendWs('TEMPLATE_LOAD', {
      templateId: template.id,
      elements: Object.values(nextElements),
    });
  };

  // Reset room
  const handleResetRoom = async () => {
    try {
      await fetch(`/api/rooms/${roomId}/reset`, { method: 'POST' });
      const nextMap: Record<string, BoardElement> = {};
      for (const elem of architectureTemplateElements) {
        nextMap[elem.id] = { ...elem };
      }
      setElements(nextMap);
      pushHistory(nextMap);
    } catch (e) {
      console.error('Failed to reset room', e);
    }
  };

  // Switch room
  const handleSwitchRoom = (newRoom: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', newRoom);
    window.history.pushState({}, '', url.toString());
    setRoomId(newRoom);
  };

  // Export handlers
  const handleExportPng = () => {
    if (svgRef.current) {
      exportSvgElementAsPng(svgRef.current, `SDS-Geox-${roomId}.png`);
    }
  };

  const handleExportSvg = () => {
    if (svgRef.current) {
      exportSvgElementAsSvg(svgRef.current, `SDS-Geox-${roomId}.svg`);
    }
  };

  const handleExportJson = () => {
    exportBoardAsJson(
      {
        roomId,
        boardName,
        elements,
        timer,
        voting,
        notes,
        checklist,
        updatedAt: Date.now(),
      },
      `SDS-Geox-${roomId}.json`
    );
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.elements) {
          setElements(data.elements);
          pushHistory(data.elements);
          sendWs('TEMPLATE_LOAD', {
            templateId: 'imported',
            elements: Object.values(data.elements),
          });
        }
      } catch (err) {
        alert('Invalid JSON board file');
      }
    };
    reader.readAsText(file);
  };

  const selectedElement = selectedIds.length === 1 ? elements[selectedIds[0]] : null;

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      {/* Top Navigation */}
      <TopNav
        boardName={boardName}
        onRenameBoard={(name) => {
          setBoardName(name);
          sendWs('BOARD_RENAME', { name });
        }}
        roomId={roomId}
        onSwitchRoom={handleSwitchRoom}
        onOpenRoomModal={() => setIsRoomOpen(true)}
        connected={connected}
        transform={transform}
        onZoomIn={() =>
          setTransform((t) => ({ ...t, scale: Math.min(t.scale * 1.15, 4.0) }))
        }
        onZoomOut={() =>
          setTransform((t) => ({ ...t, scale: Math.max(t.scale * 0.85, 0.15) }))
        }
        onResetZoom={() => setTransform((t) => ({ ...t, scale: 1.0 }))}
        onFitView={() => setTransform({ x: 40, y: 30, scale: 0.85 })}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        gridType={gridType}
        onCycleGrid={() =>
          setGridType((g) => (g === 'dots' ? 'lines' : g === 'lines' ? 'none' : 'dots'))
        }
        elementCount={Object.keys(elements).length}
        users={users}
        currentUser={currentUser}
        simulateTeammates={simulateTeammates}
        onToggleSimulateTeammates={() => setSimulateTeammates(!simulateTeammates)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onOpenShareModal={() => setIsShareOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onFollowUser={(u) => setFollowingUserId(u.userId)}
        followingUserId={followingUserId}
      />

      {/* Floating Canvas Toolbar */}
      <Toolbar
        currentTool={currentTool}
        onSelectTool={setCurrentTool}
        selectedShape={selectedShape}
        onSelectShape={setSelectedShape}
        stickyColor={stickyColor}
        onSelectStickyColor={setStickyColor}
      />

      {/* Floating Style Context Bar */}
      <StyleBar
        selectedElement={selectedElement}
        onUpdateElement={handleUpdateElement}
        onDuplicate={handleDuplicate}
        onDelete={() => handleDeleteElements(selectedIds)}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
      />

      {/* Main Interactive Canvas */}
      <Canvas
        tool={currentTool}
        selectedShape={selectedShape}
        stickyColor={stickyColor}
        elements={elements}
        selectedIds={selectedIds}
        onSelectElements={setSelectedIds}
        onAddElement={handleAddElement}
        onUpdateElement={handleUpdateElement}
        onBulkUpdateElements={handleBulkUpdateElements}
        onDeleteElements={handleDeleteElements}
        onCastVote={handleCastVote}
        transform={transform}
        onTransformChange={setTransform}
        gridType={gridType}
        users={users}
        currentUser={currentUser}
        onCursorMove={handleCursorMove}
        onLaserStroke={handleLaserStroke}
        reactions={reactions}
        isDark={isDark}
        onResetTool={() => setCurrentTool('select')}
        svgRef={svgRef}
      />

      {/* Interactive Mini-map */}
      <MiniMap
        elements={elements}
        transform={transform}
        onNavigate={(nx, ny) => setTransform((t) => ({ ...t, x: nx, y: ny }))}
        containerWidth={containerSizeRef.current.width}
        containerHeight={containerSizeRef.current.height}
      />

      {/* Bottom Meeting Suite Dock */}
      <MeetingBar
        isMuted={isMuted}
        onToggleMic={() => setIsMuted(!isMuted)}
        hasVideo={hasVideo}
        onToggleVideo={() => setHasVideo(!hasVideo)}
        isScreenSharing={isScreenSharing}
        onToggleScreenShare={() => setIsScreenSharing(!isScreenSharing)}
        isRecording={isRecording}
        onToggleRecording={() => {
          if (!isRecording) setRecordingSeconds(0);
          setIsRecording(!isRecording);
        }}
        recordingSeconds={recordingSeconds}
        timer={timer}
        onStartTimer={(duration) => {
          const secs = duration || timer.remainingSeconds;
          const next = { ...timer, active: true, durationSeconds: secs, remainingSeconds: secs };
          setTimer(next);
          sendWs('TIMER_SYNC', { timer: next });
        }}
        onPauseTimer={() => {
          const next = { ...timer, active: false };
          setTimer(next);
          sendWs('TIMER_SYNC', { timer: next });
        }}
        onResetTimer={() => {
          const next = { ...timer, active: false, remainingSeconds: timer.durationSeconds };
          setTimer(next);
          sendWs('TIMER_SYNC', { timer: next });
        }}
        voting={voting}
        onOpenVotingModal={() => setIsVotingOpen(true)}
        onSendReaction={handleSendReaction}
        unreadChatCount={unreadChatCount}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen) setUnreadChatCount(0);
        }}
        isChatOpen={isChatOpen}
        onToggleNotes={() => setIsNotesOpen(!isNotesOpen)}
        isNotesOpen={isNotesOpen}
      />

      {/* Video Preview Pill (when camera is on) */}
      {hasVideo && (
        <div className="fixed bottom-24 left-6 w-44 h-32 rounded-2xl bg-slate-900 border-2 border-indigo-500 shadow-2xl overflow-hidden z-30 select-none animate-in fade-in duration-200">
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-950 to-indigo-950">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shadow-lg"
              style={{ backgroundColor: currentUser.userColor }}
            >
              {currentUser.userName.charAt(0)}
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
              <span className="truncate">{currentUser.userName}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Drawers */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={(text) => {
          const msg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random()}`,
            userId: currentUser.userId,
            userName: currentUser.userName,
            userColor: currentUser.userColor,
            text,
            timestamp: Date.now(),
          };
          setChatMessages((prev) => [...prev, msg]);
          sendWs('CHAT_MESSAGE', {
            userId: currentUser.userId,
            userName: currentUser.userName,
            userColor: currentUser.userColor,
            text,
          });
        }}
        currentUser={currentUser}
      />

      <NotesDrawer
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        notes={notes}
        onUpdateNotes={(newNotes) => {
          setNotes(newNotes);
          sendWs('NOTES_UPDATE', { notes: newNotes });
        }}
        checklist={checklist}
        onUpdateChecklist={(newChecklist) => {
          setChecklist(newChecklist);
          sendWs('CHECKLIST_UPDATE', { checklist: newChecklist });
        }}
        onConvertItemToSticky={(text) => {
          const centerWorldX = (window.innerWidth / 2 - transform.x) / transform.scale;
          const centerWorldY = (window.innerHeight / 2 - transform.y) / transform.scale;
          handleAddElement({
            id: `sticky_${Date.now()}`,
            type: 'sticky',
            x: centerWorldX - 100,
            y: centerWorldY - 75,
            width: 200,
            height: 140,
            color: '#fef08a',
            text,
            author: currentUser.userName,
            votes: [],
            zIndex: 10,
            createdBy: currentUser.userId,
            updatedAt: Date.now(),
          });
        }}
      />

      {/* Modals */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      <VotingModal
        isOpen={isVotingOpen}
        onClose={() => setIsVotingOpen(false)}
        voting={voting}
        onStartVoting={(topic, duration, maxVotes) => {
          const nextVoting: VotingState = {
            active: true,
            durationSeconds: duration,
            remainingSeconds: duration,
            maxVotesPerUser: maxVotes,
            topic,
          };
          setVoting(nextVoting);
          sendWs('VOTING_SESSION_SYNC', { voting: nextVoting });
        }}
        onEndVoting={() => {
          const nextVoting = { ...voting, active: false };
          setVoting(nextVoting);
          sendWs('VOTING_SESSION_SYNC', { voting: nextVoting });
        }}
        elements={elements}
        currentUserId={currentUser.userId}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        roomId={roomId}
      />

      <RoomModal
        isOpen={isRoomOpen}
        onClose={() => setIsRoomOpen(false)}
        currentRoomId={roomId}
        onSwitchRoom={handleSwitchRoom}
        onResetRoom={handleResetRoom}
      />
    </div>
  );
}
