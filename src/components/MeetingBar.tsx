import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  CircleDot,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Vote,
  MessageSquare,
  FileText,
  Smile,
  Zap,
  Volume2,
  CheckCircle2,
  ChevronUp
} from 'lucide-react';
import { TimerState, VotingState, ReactionBurst } from '../types';

interface MeetingBarProps {
  isMuted: boolean;
  onToggleMic: () => void;
  hasVideo: boolean;
  onToggleVideo: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  recordingSeconds: number;
  timer: TimerState;
  onStartTimer: (durationSeconds?: number) => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  voting: VotingState;
  onOpenVotingModal: () => void;
  onSendReaction: (emoji: string) => void;
  unreadChatCount: number;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onToggleNotes: () => void;
  isNotesOpen: boolean;
}

const REACTION_EMOJIS = ['🎉', '🚀', '❤️', '💡', '🔥', '👏', '💯', '🎯'];

export const MeetingBar: React.FC<MeetingBarProps> = ({
  isMuted,
  onToggleMic,
  hasVideo,
  onToggleVideo,
  isScreenSharing,
  onToggleScreenShare,
  isRecording,
  onToggleRecording,
  recordingSeconds,
  timer,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  voting,
  onOpenVotingModal,
  onSendReaction,
  unreadChatCount,
  onToggleChat,
  isChatOpen,
  onToggleNotes,
  isNotesOpen,
}) => {
  const [showTimerPresets, setShowTimerPresets] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Simulate audio level meter fluctuation when unmuted
  useEffect(() => {
    if (isMuted) {
      setAudioLevel(0);
      return;
    }
    const interval = setInterval(() => {
      setAudioLevel(Math.floor(Math.random() * 5));
    }, 180);
    return () => clearInterval(interval);
  }, [isMuted]);

  // Format recording seconds mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl shadow-black/50 select-none max-w-[95vw] overflow-x-auto">
      {/* Mic & Audio Wave */}
      <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60">
        <button
          onClick={onToggleMic}
          className={`p-2 rounded-lg transition flex items-center gap-1.5 ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {!isMuted && (
            <div className="flex items-end gap-0.5 h-3 px-0.5">
              {[0, 1, 2, 3].map((bar) => (
                <div
                  key={bar}
                  className="w-1 bg-emerald-400 rounded-full transition-all duration-100"
                  style={{
                    height: `${audioLevel > bar ? (bar + 1) * 3 : 2}px`,
                  }}
                />
              ))}
            </div>
          )}
        </button>

        {/* Video Camera Toggle */}
        <button
          onClick={onToggleVideo}
          className={`p-2 rounded-lg transition ml-1 ${
            !hasVideo
              ? 'bg-slate-700/40 text-slate-400 hover:text-white'
              : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
          }`}
          title={hasVideo ? 'Stop Camera' : 'Start Camera'}
        >
          {hasVideo ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          className={`p-2 rounded-lg transition ml-1 ${
            isScreenSharing
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 animate-pulse'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
        >
          <ScreenShare className="w-4 h-4" />
        </button>
      </div>

      {/* Recording Indicator */}
      <button
        onClick={onToggleRecording}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-medium transition ${
          isRecording
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
            : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
        }`}
        title={isRecording ? 'Stop Recording' : 'Start Meeting Recording'}
      >
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isRecording ? 'bg-rose-500 animate-ping' : 'bg-slate-500'
          }`}
        />
        <span>{isRecording ? `REC ${formatTime(recordingSeconds)}` : 'Record'}</span>
      </button>

      <div className="h-6 w-px bg-slate-800 my-auto" />

      {/* Synced Meeting Timer */}
      <div className="relative flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60">
        <div className="flex items-center gap-2 px-2 py-1">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="font-mono text-xs font-bold text-white tracking-wider">
            {formatTime(timer.remainingSeconds)}
          </span>
        </div>

        {timer.active ? (
          <button
            onClick={onPauseTimer}
            className="p-1.5 rounded-lg text-amber-400 hover:bg-slate-700 transition"
            title="Pause Brainstorm Timer"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => onStartTimer()}
            className="p-1.5 rounded-lg text-emerald-400 hover:bg-slate-700 transition"
            title="Start Timer"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onResetTimer}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          title="Reset Timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setShowTimerPresets(!showTimerPresets)}
          className="px-1 py-1 rounded text-slate-400 hover:text-white transition"
          title="Timer Presets"
        >
          <ChevronUp className="w-3 h-3" />
        </button>

        {showTimerPresets && (
          <div className="absolute bottom-12 left-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 flex gap-1 z-50">
            {[60, 180, 300, 600].map((secs) => (
              <button
                key={secs}
                onClick={() => {
                  onStartTimer(secs);
                  setShowTimerPresets(false);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-xs font-mono text-slate-200 hover:text-white transition"
              >
                {secs / 60}m
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dot Voting Session */}
      <button
        onClick={onOpenVotingModal}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
          voting.active
            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 animate-pulse'
            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
        }`}
        title="Start or view Dot Voting session"
      >
        <Vote className="w-4 h-4 text-amber-400" />
        <span className="hidden sm:inline">
          {voting.active ? `Voting Active (${formatTime(voting.remainingSeconds)})` : 'Dot Voting'}
        </span>
      </button>

      <div className="h-6 w-px bg-slate-800 my-auto" />

      {/* Quick Reaction Emojis */}
      <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/60">
        {REACTION_EMOJIS.slice(0, 4).map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendReaction(emoji)}
            className="w-7 h-7 rounded-lg hover:bg-slate-700/80 flex items-center justify-center text-sm transition transform hover:scale-125 active:scale-95"
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}

        <div className="relative">
          <button
            onClick={() => setShowReactionsMenu(!showReactionsMenu)}
            className="w-7 h-7 rounded-lg hover:bg-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white transition"
            title="More Reactions"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {showReactionsMenu && (
            <div className="absolute bottom-12 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 grid grid-cols-4 gap-1 z-50">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSendReaction(emoji);
                    setShowReactionsMenu(false);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-lg transition transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-6 w-px bg-slate-800 my-auto" />

      {/* Live Chat Drawer Button */}
      <button
        onClick={onToggleChat}
        className={`p-2.5 rounded-xl transition relative ${
          isChatOpen
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
        }`}
        title="Toggle Meeting Chat"
      >
        <MessageSquare className="w-4 h-4" />
        {unreadChatCount > 0 && !isChatOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
            {unreadChatCount}
          </span>
        )}
      </button>

      {/* Notes & Agenda Drawer Button */}
      <button
        onClick={onToggleNotes}
        className={`p-2.5 rounded-xl transition ${
          isNotesOpen
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
        }`}
        title="Toggle Meeting Agenda & Notes"
      >
        <FileText className="w-4 h-4" />
      </button>
    </div>
  );
};
