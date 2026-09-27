import React from 'react';
import {
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Sparkles
} from 'lucide-react';
import { BoardElement, ConnectorStyle, ArrowHead } from '../types';

interface StyleBarProps {
  selectedElement: BoardElement | null;
  onUpdateElement: (updates: Partial<BoardElement>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

const PRESET_COLORS = [
  'transparent',
  '#0f172a',
  '#1e293b',
  '#7f1d1d',
  '#c2410c',
  '#ca8a04',
  '#15803d',
  '#0e7490',
  '#1d4ed8',
  '#4338ca',
  '#6d28d9',
  '#be185d',
];

const PRESET_STROKE_COLORS = [
  '#ffffff',
  '#94a3b8',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
];

export const StyleBar: React.FC<StyleBarProps> = ({
  selectedElement,
  onUpdateElement,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
}) => {
  if (!selectedElement) return null;

  const isShape = [
    'rectangle',
    'circle',
    'diamond',
    'triangle',
    'hexagon',
    'cloud',
    'cylinder',
    'star',
  ].includes(selectedElement.type);
  const isConnector = selectedElement.type === 'connector';
  const isText = selectedElement.type === 'text';
  const isSticky = selectedElement.type === 'sticky';
  const isCard = selectedElement.type === 'strategyCard';
  const isFrame = selectedElement.type === 'frame';

  return (
    <div className="fixed top-32 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs select-none">
      {/* Fill Color Picker (Shapes / Cards) */}
      {(isShape || isText) && (
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
          <span className="text-[11px] text-slate-400 font-medium px-1">Fill:</span>
          <div className="flex items-center gap-1">
            {PRESET_COLORS.slice(0, 6).map((color) => {
              const currentFill = (selectedElement as any).fill;
              return (
                <button
                  key={color}
                  onClick={() => onUpdateElement({ fill: color } as any)}
                  className={`w-4 h-4 rounded-full border transition transform hover:scale-125 ${
                    currentFill === color ? 'ring-2 ring-indigo-400 border-white scale-110' : 'border-slate-700'
                  }`}
                  style={{
                    backgroundColor: color === 'transparent' ? 'transparent' : color,
                    backgroundImage:
                      color === 'transparent'
                        ? 'linear-gradient(45deg, #475569 25%, transparent 25%, transparent 75%, #475569 75%, #475569), linear-gradient(45deg, #475569 25%, transparent 25%, transparent 75%, #475569 75%, #475569)'
                        : 'none',
                    backgroundSize: '4px 4px',
                    backgroundPosition: '0 0, 2px 2px',
                  }}
                  title={color}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Stroke Color Picker */}
      {(isShape || isConnector) && (
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
          <span className="text-[11px] text-slate-400 font-medium px-1">Border:</span>
          <div className="flex items-center gap-1">
            {PRESET_STROKE_COLORS.slice(0, 6).map((color) => {
              const currentStroke = (selectedElement as any).stroke;
              return (
                <button
                  key={color}
                  onClick={() => onUpdateElement({ stroke: color } as any)}
                  className={`w-4 h-4 rounded-full border transition transform hover:scale-125 ${
                    currentStroke === color ? 'ring-2 ring-indigo-400 border-white scale-110' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Stroke Width */}
      {(isShape || isConnector) && (
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
          <span className="text-[11px] text-slate-400 font-medium px-1">Width:</span>
          {[1, 2, 4].map((w) => {
            const currentW = (selectedElement as any).strokeWidth || 2;
            return (
              <button
                key={w}
                onClick={() => onUpdateElement({ strokeWidth: w } as any)}
                className={`px-2 py-0.5 rounded font-mono text-[10px] transition ${
                  currentW === w ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {w}px
              </button>
            );
          })}
        </div>
      )}

      {/* Stroke Style */}
      {(isShape || isConnector) && (
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
          {(['solid', 'dashed', 'dotted'] as const).map((style) => {
            const currentStyle = (selectedElement as any).strokeStyle || 'solid';
            return (
              <button
                key={style}
                onClick={() => onUpdateElement({ strokeStyle: style } as any)}
                className={`px-2 py-0.5 rounded capitalize text-[10px] transition ${
                  currentStyle === style ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {style}
              </button>
            );
          })}
        </div>
      )}

      {/* Connector Specific: Style & Arrowheads */}
      {isConnector && (
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
          <span className="text-[11px] text-slate-400 font-medium px-1">Routing:</span>
          {(['straight', 'curved', 'elbow'] as ConnectorStyle[]).map((cStyle) => {
            const currentCStyle = (selectedElement as any).style;
            return (
              <button
                key={cStyle}
                onClick={() => onUpdateElement({ style: cStyle } as any)}
                className={`px-2 py-0.5 rounded capitalize text-[10px] transition ${
                  currentCStyle === cStyle ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cStyle}
              </button>
            );
          })}
        </div>
      )}

      {/* Text / Shape Font Formatting */}
      {(isShape || isText) && (
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
          <button
            onClick={() => {
              const currentWeight = (selectedElement as any).fontWeight || 'normal';
              onUpdateElement({ fontWeight: currentWeight === 'bold' ? 'normal' : 'bold' } as any);
            }}
            className={`p-1.5 rounded text-xs transition ${
              (selectedElement as any).fontWeight === 'bold'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Bold"
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            onClick={() => onUpdateElement({ textAlign: 'left' } as any)}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Align Left"
          >
            <AlignLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => onUpdateElement({ textAlign: 'center' } as any)}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Align Center"
          >
            <AlignCenter className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Strategy Card Priority */}
      {isCard && (
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
          <span className="text-[11px] text-slate-400 font-medium px-1">Priority:</span>
          {(['critical', 'high', 'medium', 'low'] as const).map((p) => {
            const currentP = (selectedElement as any).priority;
            return (
              <button
                key={p}
                onClick={() => onUpdateElement({ priority: p } as any)}
                className={`px-1.5 py-0.5 rounded capitalize text-[10px] font-semibold transition ${
                  currentP === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      )}

      {/* Frame / Container Color */}
      {isFrame && (
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
          <span className="text-[11px] text-slate-400 font-medium px-1">Tier Color:</span>
          {['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'].map((col) => {
            const currentC = (selectedElement as any).color;
            return (
              <button
                key={col}
                onClick={() => onUpdateElement({ color: col } as any)}
                className={`w-4 h-4 rounded-full border transition transform hover:scale-125 ${
                  currentC === col ? 'ring-2 ring-white border-white scale-110' : 'border-slate-700'
                }`}
                style={{ backgroundColor: col }}
              />
            );
          })}
        </div>
      )}

      {/* Actions: Duplicate, Order, Delete */}
      <div className="flex items-center gap-1">
        <button
          onClick={onDuplicate}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Duplicate (Ctrl+D)"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onBringToFront}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Bring to Front"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onSendToBack}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Send to Back"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition"
          title="Delete (Del / Backspace)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
