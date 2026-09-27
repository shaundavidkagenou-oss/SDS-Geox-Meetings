import React, { useState } from 'react';
import { X, Vote, Trophy, Clock, CheckCircle2, Play, Square } from 'lucide-react';
import confetti from 'canvas-confetti';
import { VotingState, BoardElement } from '../types';

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  voting: VotingState;
  onStartVoting: (topic: string, durationSeconds: number, maxVotes: number) => void;
  onEndVoting: () => void;
  elements: Record<string, BoardElement>;
  currentUserId: string;
}

export const VotingModal: React.FC<VotingModalProps> = ({
  isOpen,
  onClose,
  voting,
  onStartVoting,
  onEndVoting,
  elements,
  currentUserId,
}) => {
  const [topic, setTopic] = useState(voting.topic || 'Prioritize High-Impact Initiatives');
  const [durationMinutes, setDurationMinutes] = useState(2);
  const [maxVotes, setMaxVotes] = useState(3);

  if (!isOpen) return null;

  // Calculate vote leaderboards from sticky notes and strategy cards
  const itemsWithVotes: { id: string; title: string; type: string; votesCount: number; hasVoted: boolean }[] = [];

  for (const elem of Object.values(elements)) {
    if (elem.type === 'sticky') {
      const votes = (elem as any).votes || [];
      if (votes.length > 0) {
        itemsWithVotes.push({
          id: elem.id,
          title: (elem as any).text.slice(0, 70),
          type: 'Sticky Note',
          votesCount: votes.length,
          hasVoted: votes.includes(currentUserId),
        });
      }
    } else if (elem.type === 'strategyCard') {
      const votes = (elem as any).votes || [];
      if (votes.length > 0) {
        itemsWithVotes.push({
          id: elem.id,
          title: (elem as any).title,
          type: 'Strategy Card',
          votesCount: votes.length,
          hasVoted: votes.includes(currentUserId),
        });
      }
    }
  }

  itemsWithVotes.sort((a, b) => b.votesCount - a.votesCount);

  const handleEndWithCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    onEndVoting();
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStartVoting(topic, durationMinutes * 60, maxVotes);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Collaborative Dot Voting
              </h2>
              <p className="text-xs text-slate-400">
                Prioritize ideas & strategic initiatives together in real-time
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
        <div className="p-6 space-y-5">
          {voting.active ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">
                    ACTIVE VOTING SESSION
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    {voting.topic}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Click the <span className="text-amber-300 font-bold">👍 / Vote</span> button on any sticky note or card on the canvas to cast your votes.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">Remaining</span>
                  <div className="font-mono text-xl font-extrabold text-amber-400">
                    {Math.floor(voting.remainingSeconds / 60)}:
                    {(voting.remainingSeconds % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* Leaderboard */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Real-time Vote Leaderboard</span>
                </div>

                {itemsWithVotes.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    No votes cast yet. Click "+1" on any sticky note to cast the first vote!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {itemsWithVotes.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-bold text-amber-400 w-5">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <span className="truncate text-slate-200">
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30">
                            {item.votesCount} {item.votesCount === 1 ? 'vote' : 'votes'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={handleEndWithCelebration}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-emerald-600/30"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Conclude Session & Celebrate 🎉</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleStart} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Session Topic or Objective
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Duration
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value={1}>1 Minute</option>
                    <option value={2}>2 Minutes (Recommended)</option>
                    <option value={3}>3 Minutes</option>
                    <option value={5}>5 Minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Max Votes / Person
                  </label>
                  <select
                    value={maxVotes}
                    onChange={(e) => setMaxVotes(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value={3}>3 Votes</option>
                    <option value={5}>5 Votes</option>
                    <option value={10}>Unlimited</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                💡 During a voting session, a vote button appears directly on every sticky note and strategy card. Results update in real-time for all connected team members.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-amber-600/30"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Live Voting Round</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
