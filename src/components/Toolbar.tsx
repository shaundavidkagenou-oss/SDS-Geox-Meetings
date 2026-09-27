import React, { useState } from 'react';
import {
  MousePointer,
  Hand,
  PenTool,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Diamond,
  Triangle,
  Hexagon,
  Cloud,
  Database,
  Star,
  StickyNote,
  ArrowUpRight,
  Type,
  Kanban,
  Frame,
  Zap,
  ChevronDown,
  Palette
} from 'lucide-react';
import { ToolType, ShapeType } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  selectedShape: ShapeType;
  onSelectShape: (shape: ShapeType) => void;
  stickyColor: string;
  onSelectStickyColor: (color: string) => void;
}

export const STICKY_PALETTE = [
  { name: 'Canary Yellow', color: '#fef08a', border: '#facc15' },
  { name: 'Ocean Cyan', color: '#bae6fd', border: '#38bdf8' },
  { name: 'Mint Green', color: '#bbf7d0', border: '#4ade80' },
  { name: 'Rose Pink', color: '#fecdd3', border: '#fb7185' },
  { name: 'Lavender Purple', color: '#e9d5ff', border: '#c084fc' },
  { name: 'Sunset Peach', color: '#fed7aa', border: '#fb923c' },
  { name: 'Obsidian Dark', color: '#1e293b', border: '#475569' },
  { name: 'Crisp White', color: '#f8fafc', border: '#cbd5e1' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onSelectTool,
  selectedShape,
  onSelectShape,
  stickyColor,
  onSelectStickyColor,
}) => {
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [showStickyPalette, setShowStickyPalette] = useState(false);

  const shapesList: { type: ShapeType; label: string; icon: React.ReactNode }[] = [
    { type: 'rectangle', label: 'Rectangle', icon: <Square className="w-4 h-4" /> },
    { type: 'circle', label: 'Circle / Ellipse', icon: <Circle className="w-4 h-4" /> },
    { type: 'diamond', label: 'Decision Diamond', icon: <Diamond className="w-4 h-4" /> },
    { type: 'triangle', label: 'Triangle', icon: <Triangle className="w-4 h-4" /> },
    { type: 'hexagon', label: 'Hexagon', icon: <Hexagon className="w-4 h-4" /> },
    { type: 'cloud', label: 'Cloud Infrastructure', icon: <Cloud className="w-4 h-4" /> },
    { type: 'cylinder', label: 'Database / Storage', icon: <Database className="w-4 h-4" /> },
    { type: 'star', label: 'Star / Milestone', icon: <Star className="w-4 h-4" /> },
  ];

  const currentShapeObj = shapesList.find((s) => s.type === selectedShape) || shapesList[0];

  return (
    <div className="fixed top-18 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl shadow-black/50 select-none">
      {/* Select / Move */}
      <button
        onClick={() => onSelectTool('select')}
        className={`p-2.5 rounded-xl transition flex items-center justify-center relative group ${
          currentTool === 'select'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Select & Transform (V)"
      >
        <MousePointer className="w-4 h-4" />
        <span className="absolute -bottom-8 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
          Select (V)
        </span>
      </button>

      {/* Hand / Pan */}
      <button
        onClick={() => onSelectTool('pan')}
        className={`p-2.5 rounded-xl transition flex items-center justify-center relative group ${
          currentTool === 'pan'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Pan Canvas (H or Space+Drag)"
      >
        <Hand className="w-4 h-4" />
        <span className="absolute -bottom-8 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
          Pan (H)
        </span>
      </button>

      <div className="h-5 w-px bg-slate-800 my-auto" />

      {/* Freehand Pen */}
      <button
        onClick={() => onSelectTool('pen')}
        className={`p-2.5 rounded-xl transition flex items-center justify-center relative group ${
          currentTool === 'pen'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Vector Pen (P)"
      >
        <PenTool className="w-4 h-4" />
        <span className="absolute -bottom-8 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
          Pen (P)
        </span>
      </button>

      {/* Highlighter */}
      <button
        onClick={() => onSelectTool('highlighter')}
        className={`p-2.5 rounded-xl transition flex items-center justify-center relative group ${
          currentTool === 'highlighter'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Highlighter (M)"
      >
        <Highlighter className="w-4 h-4" />
        <span className="absolute -bottom-8 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
          Highlighter (M)
        </span>
      </button>

      {/* Eraser */}
      <button
        onClick={() => onSelectTool('eraser')}
        className={`p-2.5 rounded-xl transition flex items-center justify-center relative group ${
          currentTool === 'eraser'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Eraser (E)"
      >
        <Eraser className="w-4 h-4" />
        <span className="absolute -bottom-8 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
          Eraser (E)
        </span>
      </button>

      <div className="h-5 w-px bg-slate-800 my-auto" />

      {/* Shapes Dropdown */}
      <div className="relative">
        <div className="flex items-center">
          <button
            onClick={() => onSelectTool(selectedShape)}
            className={`p-2.5 rounded-l-xl transition flex items-center justify-center relative group ${
              currentTool === selectedShape
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={`Shape: ${currentShapeObj.label}`}
          >
            {currentShapeObj.icon}
          </button>
          <button
            onClick={() => setShowShapesMenu(!showShapesMenu)}
            className={`px-1 py-2.5 rounded-r-xl transition text-slate-400 hover:text-white hover:bg-slate-800 ${
              currentTool === selectedShape ? 'bg-indigo-600 text-white' : ''
            }`}
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {showShapesMenu && (
          <div className="absolute top-12 left-0 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 grid grid-cols-2 gap-1 z-50">
            {shapesList.map((shape) => (
              <button
                key={shape.type}
                onClick={() => {
                  onSelectShape(shape.type);
                  onSelectTool(shape.type);
                  setShowShapesMenu(false);
                }}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs transition text-left ${
                  selectedShape === shape.type
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {shape.icon}
                <span className="truncate">{shape.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Note */}
      <div className="relative">
        <div className="flex items-center">
          <button
            onClick={() => onSelectTool('sticky')}
            className={`p-2.5 rounded-l-xl transition flex items-center justify-center relative group ${
              currentTool === 'sticky'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Sticky Note (N)"
          >
            <StickyNote className="w-4 h-4" style={{ color: currentTool === 'sticky' ? '#fff' : stickyColor }} />
            <span className="absolute -bottom-8 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
              Sticky Note (N)
            </span>
          </button>
          <button
            onClick={() => setShowStickyPalette(!showStickyPalette)}
            className={`px-1 py-2.5 rounded-r-xl transition text-slate-400 hover:text-white hover:bg-slate-800 ${
              currentTool === 'sticky' ? 'bg-indigo-600 text-white' : ''
            }`}
            title="Choose Sticky Note Color"
          >
            <div
              className="w-2.5 h-2.5 rounded-full border border-slate-600"
              style={{ backgroundColor: stickyColor }}
            />
          </button>
        </div>

        {showStickyPalette && (
          <div className="absolute top-12 left-0 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 grid grid-cols-4 gap-2 z-50">
            {STICKY_PALETTE.map((pal) => (
              <button
                key={pal.color}
                onClick={() => {
                  onSelectStickyColor(pal.color);
                  onSelectTool('sticky');
                  setShowStickyPalette(false);
                }}
                className={`w-8 h-8 rounded-lg shadow-sm border-2 transition transform hover:scale-110 ${
                  stickyColor === pal.color ? 'border-white scale-105 ring-2 ring-indigo-500' : 'border-transparent'
                }`}
                style={{ backgroundColor: pal.color }}
                title={pal.name}
              />
            ))}
          </div>
        )}
      </div>

      {/* Connectors & Arrows */}
      <button
        onClick={() => onSelectTool('connector')}
        className={`p-2.5 rounded-xl transition flex items-center justify-center relative group ${
          currentTool === 'connector'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Connector & Arrows (A)"
      >
        <ArrowUpRight className="w-4 h-4" />
        <span className="absolute -bottom-8 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
          Connector (A)
        </span>
      </button>

      {/* Strategy Card */}
      <button
        onClick={() => onSelectTool('strategyCard')}
        className={`p-2.5 rounded-xl transition flex items-center justify-center relative group ${
          currentTool === 'strategyCard'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Agile / Strategy Card (C)"
      >
        <Kanban className="w-4 h-4" />
        <span className="absolute -bottom-8 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
          Strategy Card (C)
        </span>
      </button>

      {/* Rich Text */}
      <button
        onClick={() => onSelectTool('text')}
        className={`p-2.5 rounded-xl transition flex items-center justify-center relative group ${
          currentTool === 'text'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Rich Text Block (T)"
      >
        <Type className="w-4 h-4" />
        <span className="absolute -bottom-8 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
          Text (T)
        </span>
      </button>

      {/* Section Frame */}
      <button
        onClick={() => onSelectTool('frame')}
        className={`p-2.5 rounded-xl transition flex items-center justify-center relative group ${
          currentTool === 'frame'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Section Frame / Swimlane (F)"
      >
        <Frame className="w-4 h-4" />
        <span className="absolute -bottom-8 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
          Frame (F)
        </span>
      </button>

      <div className="h-5 w-px bg-slate-800 my-auto" />

      {/* Laser Pointer */}
      <button
        onClick={() => onSelectTool('laser')}
        className={`p-2.5 rounded-xl transition flex items-center justify-center relative group ${
          currentTool === 'laser'
            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 ring-1 ring-rose-400 animate-pulse'
            : 'text-rose-400 hover:text-rose-300 hover:bg-slate-800'
        }`}
        title="Live Laser Pointer (L)"
      >
        <Zap className="w-4 h-4" />
        <span className="absolute -bottom-8 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
          Laser Pointer (L)
        </span>
      </button>
    </div>
  );
};
