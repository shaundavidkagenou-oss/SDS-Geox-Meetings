import React, { useRef } from 'react';
import { BoardElement, CanvasTransform } from '../types';

interface MiniMapProps {
  elements: Record<string, BoardElement>;
  transform: CanvasTransform;
  onNavigate: (x: number, y: number) => void;
  containerWidth: number;
  containerHeight: number;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  elements,
  transform,
  onNavigate,
  containerWidth,
  containerHeight,
}) => {
  const mapWidth = 180;
  const mapHeight = 110;
  const mapRef = useRef<HTMLDivElement>(null);

  // Compute bounding box of all elements
  const elemList = Object.values(elements);
  let minX = 0;
  let minY = 0;
  let maxX = 2000;
  let maxY = 1200;

  if (elemList.length > 0) {
    minX = Math.min(...elemList.map((e) => e.x || 0)) - 100;
    minY = Math.min(...elemList.map((e) => e.y || 0)) - 100;
    maxX = Math.max(...elemList.map((e) => (e.x || 0) + (e.width || 100))) + 100;
    maxY = Math.max(...elemList.map((e) => (e.y || 0) + (e.height || 100))) + 100;
  }

  const worldWidth = Math.max(maxX - minX, 1000);
  const worldHeight = Math.max(maxY - minY, 600);

  const scaleX = mapWidth / worldWidth;
  const scaleY = mapHeight / worldHeight;
  const mapScale = Math.min(scaleX, scaleY);

  // Viewport rectangle in world coords
  const viewWorldX = -transform.x / transform.scale;
  const viewWorldY = -transform.y / transform.scale;
  const viewWorldW = containerWidth / transform.scale;
  const viewWorldH = containerHeight / transform.scale;

  // Viewport in minimap coords
  const viewMapX = (viewWorldX - minX) * mapScale;
  const viewMapY = (viewWorldY - minY) * mapScale;
  const viewMapW = viewWorldW * mapScale;
  const viewMapH = viewWorldH * mapScale;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickMapX = e.clientX - rect.left;
    const clickMapY = e.clientY - rect.top;

    const targetWorldX = minX + clickMapX / mapScale;
    const targetWorldY = minY + clickMapY / mapScale;

    // Center viewport at this world coordinate
    const newTransX = containerWidth / 2 - targetWorldX * transform.scale;
    const newTransY = containerHeight / 2 - targetWorldY * transform.scale;

    onNavigate(newTransX, newTransY);
  };

  return (
    <div
      ref={mapRef}
      onClick={handleClick}
      className="fixed bottom-20 right-4 w-[180px] h-[110px] bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden cursor-crosshair z-20 select-none group"
      title="Mini-map navigator: click anywhere to pan"
    >
      <div className="absolute top-1 left-2 text-[9px] font-mono text-slate-500 font-semibold group-hover:text-indigo-400 transition">
        MAP
      </div>

      <svg width={mapWidth} height={mapHeight} className="w-full h-full">
        {/* Render elements miniature silhouettes */}
        {elemList.map((elem) => {
          const mx = (elem.x - minX) * mapScale;
          const my = (elem.y - minY) * mapScale;
          const mw = Math.max((elem.width || 10) * mapScale, 2);
          const mh = Math.max((elem.height || 10) * mapScale, 2);

          let color = '#6366f1';
          if (elem.type === 'frame') color = 'rgba(99, 102, 241, 0.2)';
          else if (elem.type === 'sticky') color = (elem as any).color || '#fef08a';
          else if (elem.type === 'strategyCard') color = '#ec4899';
          else if ('stroke' in elem) color = (elem as any).stroke || '#38bdf8';

          return (
            <rect
              key={elem.id}
              x={mx}
              y={my}
              width={mw}
              height={mh}
              fill={color}
              opacity={elem.type === 'frame' ? 0.3 : 0.7}
              rx={1}
            />
          );
        })}

        {/* Viewport Box */}
        <rect
          x={Math.max(0, viewMapX)}
          y={Math.max(0, viewMapY)}
          width={Math.min(mapWidth, Math.max(10, viewMapW))}
          height={Math.min(mapHeight, Math.max(10, viewMapH))}
          fill="rgba(56, 189, 248, 0.15)"
          stroke="#38bdf8"
          strokeWidth="1.5"
          rx="2"
        />
      </svg>
    </div>
  );
};
