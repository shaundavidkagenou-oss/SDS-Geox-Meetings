import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Smile, User, MessageSquare } from 'lucide-react';
import { ChatMessage, UserPresence } from '../types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUser: UserPresence;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUser,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed top-14 right-0 bottom-24 w-80 md:w-96 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-30 flex flex-col select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-12 px-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Live Meeting Chat
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No messages yet. Say hello to your team! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUser.userId;
            const isSystem = msg.userId === 'system';

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] px-3 py-1.5 rounded-lg text-center"
                >
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                  <span
                    className="font-bold truncate max-w-[140px]"
                    style={{ color: msg.userColor }}
                  >
                    {isMe ? 'You' : msg.userName}
                  </span>
                  <span>•</span>
                  <span>{formatTimestamp(msg.timestamp)}</span>
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[85%] text-xs leading-relaxed select-text ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-slate-800 bg-slate-900/60"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
