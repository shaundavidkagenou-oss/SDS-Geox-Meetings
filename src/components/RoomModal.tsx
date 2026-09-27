import React, { useState } from 'react';
import { X, FolderOpen, Plus, RotateCcw, Check, Sparkles } from 'lucide-react';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomId: string;
  onSwitchRoom: (newRoomId: string) => void;
  onResetRoom: () => void;
}

const PRESET_ROOMS = [
  { id: 'sds-hq', name: 'Global Cloud Architecture (HQ)', desc: 'Enterprise microservices, edge routing & pub/sub topology' },
  { id: 'q4-strategy', name: 'Product Strategy & SWOT Matrix', desc: 'Q4 strategic positioning, strengths & market threats' },
  { id: 'sprint-retro', name: 'Engineering Sprint Retrospective', desc: 'Sprint 24 review, puzzles, and committed action items' },
  { id: 'brainstorm-lab', name: 'SDS Innovation & Idea Lab', desc: 'Open ideation canvas for cross-functional initiatives' },
];

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  currentRoomId,
  onSwitchRoom,
  onResetRoom,
}) => {
  const [customRoom, setCustomRoom] = useState('');

  if (!isOpen) return null;

  const handleJoinCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoom.trim()) return;
    const sanitized = customRoom.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    onSwitchRoom(sanitized);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Whiteboard Workspaces
              </h2>
              <p className="text-xs text-slate-400">
                Switch rooms or create a dedicated collaboration room
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Preset Whiteboard Rooms
            </label>
            {PRESET_ROOMS.map((r) => {
              const isActive = r.id === currentRoomId;
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    if (!isActive) {
                      onSwitchRoom(r.id);
                      onClose();
                    }
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                      : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{r.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                        {r.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{r.desc}</p>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Custom Room Form */}
          <form onSubmit={handleJoinCustom} className="pt-2 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Or Create / Join Custom Room
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. sprint-q4-backend"
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!customRoom.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Join</span>
              </button>
            </div>
          </form>

          {/* Reset Current Room */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Need a fresh start in current room?
            </span>
            <button
              onClick={() => {
                if (confirm('Reset this whiteboard to default architecture template?')) {
                  onResetRoom();
                  onClose();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-500/30 flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Board</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
