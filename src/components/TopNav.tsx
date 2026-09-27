import React, { useState } from 'react';
import {
  Layers,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Share2,
  Download,
  Grid,
  Bot,
  Users,
  Sun,
  Moon,
  Sparkles,
  FileCode,
  CheckCircle2,
  ChevronDown,
  FolderOpen,
  Volume2
} from 'lucide-react';
import { UserPresence, CanvasTransform } from '../types';

interface TopNavProps {
  boardName: string;
  onRenameBoard: (newName: string) => void;
  roomId: string;
  onSwitchRoom: (newRoom: string) => void;
  onOpenRoomModal: () => void;
  connected: boolean;
  transform: CanvasTransform;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitView: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  gridType: 'dots' | 'lines' | 'none';
  onCycleGrid: () => void;
  elementCount: number;
  users: Record<string, UserPresence>;
  currentUser: UserPresence;
  simulateTeammates: boolean;
  onToggleSimulateTeammates: () => void;
  onOpenTemplates: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenShareModal: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onFollowUser: (user: UserPresence) => void;
  followingUserId: string | null;
}

export const TopNav: React.FC<TopNavProps> = ({
  boardName,
  onRenameBoard,
  roomId,
  onOpenRoomModal,
  connected,
  transform,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitView,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  gridType,
  onCycleGrid,
  elementCount,
  users,
  currentUser,
  simulateTeammates,
  onToggleSimulateTeammates,
  onOpenTemplates,
  onExportPng,
  onExportSvg,
  onExportJson,
  onImportJson,
  onOpenShareModal,
  isDark,
  onToggleTheme,
  onFollowUser,
  followingUserId,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(boardName);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const userList = Object.values(users);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-slate-900/90 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 z-40 flex items-center justify-between shadow-lg select-none">
      {/* Left: Branding & Room */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/25 ring-1 ring-white/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-sm">
                SDS Geox
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Meetings
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800" />

        {/* Room Switcher Pill */}
        <button
          onClick={onOpenRoomModal}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition text-xs font-medium text-slate-300 hover:text-white"
          title="Switch or create whiteboard room"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-slate-200">{roomId}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Board Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={() => {
              setIsEditingTitle(false);
              if (tempTitle.trim()) onRenameBoard(tempTitle);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingTitle(false);
                if (tempTitle.trim()) onRenameBoard(tempTitle);
              }
            }}
            autoFocus
            className="bg-slate-800 border border-indigo-500/50 rounded px-2 py-1 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400 max-w-[200px]"
          />
        ) : (
          <button
            onClick={() => {
              setTempTitle(boardName);
              setIsEditingTitle(true);
            }}
            className="text-xs text-slate-300 hover:text-white font-medium hover:bg-slate-800/50 px-2 py-1 rounded transition max-w-[220px] truncate text-left"
            title="Click to rename board"
          >
            {boardName}
          </button>
        )}

        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded-full border border-slate-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Real-time Sync</span>
        </div>
      </div>

      {/* Center: Canvas Controls & Zoom */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-800/60 border border-slate-700/60 rounded-lg p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded hover:bg-slate-700/60 transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded hover:bg-slate-700/60 transition"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-800/60 border border-slate-700/60 rounded-lg p-0.5 text-xs">
          <button
            onClick={onZoomOut}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/60 transition"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            className="px-2 py-1 font-mono text-[11px] text-slate-300 hover:text-white font-medium rounded hover:bg-slate-700/60 transition"
            title="Reset Zoom to 100%"
          >
            {Math.round(transform.scale * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/60 transition"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onFitView}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/60 transition ml-0.5"
            title="Fit Canvas to View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grid Type Toggle */}
        <button
          onClick={onCycleGrid}
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white transition"
          title={`Canvas Grid: ${gridType} (Click to change)`}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        {/* Elements Count */}
        <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-slate-800/40 rounded-lg border border-slate-800 text-[11px] text-slate-400">
          <span className="font-mono text-slate-200">{elementCount}</span> items
        </div>
      </div>

      {/* Right: Multiplayer, Teammates Demo, Actions */}
      <div className="flex items-center gap-2">
        {/* Simulate Teammates Toggle */}
        <button
          onClick={onToggleSimulateTeammates}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
            simulateTeammates
              ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-indigo-500/30 ring-1 ring-white/30'
              : 'bg-slate-800/80 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50'
          }`}
          title="Toggle simulated AI teammates to see multi-user collaboration in real-time"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {simulateTeammates ? 'Teammates Active' : 'Simulate Teammates'}
          </span>
          {simulateTeammates && (
            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
          )}
        </button>

        {/* Active Collaborators Avatars */}
        <div className="flex items-center -space-x-2 overflow-hidden px-1">
          {userList.map((user) => {
            const isMe = user.userId === currentUser.userId;
            const isFollowing = followingUserId === user.userId;
            return (
              <div
                key={user.userId}
                onClick={() => !isMe && onFollowUser(user)}
                className={`relative group cursor-pointer transition transform hover:scale-110 hover:z-20 ${
                  isFollowing ? 'ring-2 ring-cyan-400 rounded-full' : ''
                }`}
                title={`${user.userName} (${user.role})${isMe ? ' - You' : ' - Click to follow viewport'}`}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md border-2 border-slate-900"
                  style={{ backgroundColor: user.userColor }}
                >
                  {user.userName.charAt(0).toUpperCase()}
                </div>
                {user.isSpeaking && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-1 ring-slate-950 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* Templates Button */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 transition text-xs font-medium"
          title="Open Strategy & Architecture Templates"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Templates</span>
        </button>

        {/* Share Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white transition text-xs font-medium"
          title="Share Whiteboard Invite"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Invite</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white transition text-xs font-medium"
            title="Export or backup board"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onExportPng();
                }}
                className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
              >
                <span>🖼️ High-Res PNG</span>
              </button>
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onExportSvg();
                }}
                className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
              >
                <span>📐 Clean Vector SVG</span>
              </button>
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onExportJson();
                }}
                className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
              >
                <span>💾 JSON Board Backup</span>
              </button>
              <div className="h-px bg-slate-800 my-1" />
              <label className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer">
                <span>📂 Import JSON Board</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    setShowExportMenu(false);
                    onImportJson(e);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
