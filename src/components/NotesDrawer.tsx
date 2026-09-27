import React, { useState } from 'react';
import { X, FileText, CheckSquare, Plus, StickyNote, Trash2, CheckCircle2 } from 'lucide-react';
import { ChecklistItem } from '../types';

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: string;
  onUpdateNotes: (newNotes: string) => void;
  checklist: ChecklistItem[];
  onUpdateChecklist: (items: ChecklistItem[]) => void;
  onConvertItemToSticky: (text: string) => void;
}

export const NotesDrawer: React.FC<NotesDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  onUpdateNotes,
  checklist,
  onUpdateChecklist,
  onConvertItemToSticky,
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'checklist'>('notes');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newAssignee, setNewAssignee] = useState('');

  if (!isOpen) return null;

  const handleToggleCheck = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    onUpdateChecklist(updated);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk_${Date.now()}`,
      text: newChecklistText.trim(),
      done: false,
      assignee: newAssignee.trim() || undefined,
    };
    onUpdateChecklist([...checklist, newItem]);
    setNewChecklistText('');
    setNewAssignee('');
  };

  return (
    <div className="fixed top-14 right-0 bottom-24 w-80 md:w-96 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-30 flex flex-col select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-12 px-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Meeting Agenda & Notes
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 p-1.5 gap-1 bg-slate-950/50">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'notes'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Shared Notes</span>
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'checklist'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Action Items ({checklist.filter((i) => i.done).length}/{checklist.length})</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'notes' ? (
          <div className="h-full flex flex-col">
            <p className="text-[11px] text-slate-400 mb-2">
              Collaborative notes synced live with all meeting participants:
            </p>
            <textarea
              value={notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder="# Meeting Agenda&#10;- Point 1&#10;- Point 2"
              className="flex-1 w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 select-text"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <form onSubmit={handleAddChecklistItem} className="space-y-2 mb-4">
              <input
                type="text"
                placeholder="New action item..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Assignee (optional)"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newChecklistText.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border transition flex items-start gap-2.5 ${
                    item.done
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : 'bg-slate-800/60 border-slate-700/60'
                  }`}
                >
                  <button
                    onClick={() => handleToggleCheck(item.id)}
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition ${
                      item.done
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'border-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {item.done && <CheckCircle2 className="w-3 h-3" />}
                  </button>

                  <div className="flex-1 text-xs">
                    <p className={`select-text ${item.done ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                      {item.text}
                    </p>
                    {item.assignee && (
                      <span className="inline-block mt-1 text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-medium border border-indigo-500/30">
                        @{item.assignee}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onConvertItemToSticky(item.text)}
                      className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-700 transition"
                      title="Convert to Sticky Note on Whiteboard"
                    >
                      <StickyNote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700 transition"
                      title="Delete action item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
