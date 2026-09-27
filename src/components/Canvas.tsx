import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ToolType,
  ShapeType,
  BoardElement,
  CanvasTransform,
  Point,
  UserPresence,
  ReactionBurst,
  ShapeElement,
  StickyElement,
  ConnectorElement,
  FreehandElement,
  TextElement,
  StrategyCardElement,
  FrameElement,
} from '../types';
import {
  getSvgPathFromPoints,
  getConnectorPath,
  getElementAnchorPoints,
  distance,
} from '../utils/geometry';
import { Heart, ThumbsUp, Sparkles, Check, Clock } from 'lucide-react';

interface CanvasProps {
  tool: ToolType;
  selectedShape: ShapeType;
  stickyColor: string;
  elements: Record<string, BoardElement>;
  selectedIds: string[];
  onSelectElements: (ids: string[]) => void;
  onAddElement: (element: BoardElement) => void;
  onUpdateElement: (updates: Partial<BoardElement> & { id: string }) => void;
  onBulkUpdateElements: (elements: (Partial<BoardElement> & { id: string })[]) => void;
  onDeleteElements: (ids: string[]) => void;
  onCastVote: (elementId: string) => void;
  transform: CanvasTransform;
  onTransformChange: (t: CanvasTransform) => void;
  gridType: 'dots' | 'lines' | 'none';
  users: Record<string, UserPresence>;
  currentUser: UserPresence;
  onCursorMove: (p: Point) => void;
  onLaserStroke: (p: Point) => void;
  reactions: ReactionBurst[];
  isDark: boolean;
  onResetTool: () => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export const Canvas: React.FC<CanvasProps> = ({
  tool,
  selectedShape,
  stickyColor,
  elements,
  selectedIds,
  onSelectElements,
  onAddElement,
  onUpdateElement,
  onBulkUpdateElements,
  onDeleteElements,
  onCastVote,
  transform,
  onTransformChange,
  gridType,
  users,
  currentUser,
  onCursorMove,
  onLaserStroke,
  reactions,
  isDark,
  onResetTool,
  svgRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Dragging elements
  const [isDraggingElements, setIsDraggingElements] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [dragInitialPositions, setDragInitialPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Marquee selection
  const [isMarquee, setIsMarquee] = useState(false);
  const [marqueeBox, setMarqueeBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Creating shape/frame
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeOrigin, setShapeOrigin] = useState<Point>({ x: 0, y: 0 });
  const [shapeCurrent, setShapeCurrent] = useState<Point>({ x: 0, y: 0 });

  // Freehand drawing
  const [isDrawingFreehand, setIsDrawingFreehand] = useState(false);
  const [freehandPoints, setFreehandPoints] = useState<Point[]>([]);

  // Connector drawing
  const [isDrawingConnector, setIsDrawingConnector] = useState(false);
  const [connectorStart, setConnectorStart] = useState<Point>({ x: 0, y: 0 });
  const [connectorCurrent, setConnectorCurrent] = useState<Point>({ x: 0, y: 0 });

  // Resizing element
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartElem, setResizeStartElem] = useState<BoardElement | null>(null);
  const [resizeStartMouse, setResizeStartMouse] = useState<Point>({ x: 0, y: 0 });

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Local laser points
  const [laserPoints, setLaserPoints] = useState<{ x: number; y: number; time: number }[]>([]);

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Clean old laser points
  useEffect(() => {
    if (laserPoints.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setLaserPoints((prev) => prev.filter((p) => now - p.time < 1200));
    }, 100);
    return () => clearInterval(interval);
  }, [laserPoints]);

  // Convert screen coords to world coords
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = screenX - rect.left;
      const clientY = screenY - rect.top;
      return {
        x: (clientX - transform.x) / transform.scale,
        y: (clientY - transform.y) / transform.scale,
      };
    },
    [transform]
  );

  // Wheel zoom / pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newScale = Math.min(Math.max(transform.scale * zoomFactor, 0.15), 4.0);

      const worldX = (mouseX - transform.x) / transform.scale;
      const worldY = (mouseY - transform.y) / transform.scale;

      const newX = mouseX - worldX * newScale;
      const newY = mouseY - worldY * newScale;

      onTransformChange({ x: newX, y: newY, scale: newScale });
    } else {
      // Pan
      onTransformChange({
        ...transform,
        x: transform.x - e.deltaX,
        y: transform.y - e.deltaY,
      });
    }
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isSpacePressed || tool === 'pan') {
      // Pan start
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      return;
    }

    if (e.button !== 0) return; // Only primary button
    const worldP = screenToWorld(e.clientX, e.clientY);

    // Freehand tool
    if (tool === 'pen' || tool === 'highlighter') {
      setIsDrawingFreehand(true);
      setFreehandPoints([worldP]);
      return;
    }

    // Laser pointer
    if (tool === 'laser') {
      onLaserStroke(worldP);
      setLaserPoints((prev) => [...prev, { ...worldP, time: Date.now() }]);
      return;
    }

    // Connector tool
    if (tool === 'connector') {
      setIsDrawingConnector(true);
      setConnectorStart(worldP);
      setConnectorCurrent(worldP);
      return;
    }

    // Shape tools or Frame
    const isShapeTool = [
      'rectangle',
      'circle',
      'diamond',
      'triangle',
      'hexagon',
      'cloud',
      'cylinder',
      'star',
      'frame',
    ].includes(tool);

    if (isShapeTool) {
      setIsDrawingShape(true);
      setShapeOrigin(worldP);
      setShapeCurrent(worldP);
      return;
    }

    // Sticky Note instant drop
    if (tool === 'sticky') {
      const newSticky: StickyElement = {
        id: `sticky_${Date.now()}`,
        type: 'sticky',
        x: worldP.x - 100,
        y: worldP.y - 75,
        width: 200,
        height: 150,
        color: stickyColor,
        text: 'Brainstorm idea here...\nDouble-click to edit',
        author: currentUser.userName,
        votes: [],
        angle: (Math.random() - 0.5) * 3,
        zIndex: 10,
        createdBy: currentUser.userId,
        updatedAt: Date.now(),
      };
      onAddElement(newSticky);
      onSelectElements([newSticky.id]);
      setEditingId(newSticky.id);
      setEditingText(newSticky.text);
      onResetTool();
      return;
    }

    // Strategy Card instant drop
    if (tool === 'strategyCard') {
      const newCard: StrategyCardElement = {
        id: `card_${Date.now()}`,
        type: 'strategyCard',
        x: worldP.x - 140,
        y: worldP.y - 80,
        width: 280,
        height: 160,
        title: 'New Strategic Initiative',
        description: 'Define scope, key deliverables and dependencies.',
        priority: 'high',
        status: 'backlog',
        points: 5,
        assignee: currentUser.userName,
        tags: ['Strategy', 'Roadmap'],
        votes: [],
        zIndex: 10,
        createdBy: currentUser.userId,
        updatedAt: Date.now(),
      };
      onAddElement(newCard);
      onSelectElements([newCard.id]);
      onResetTool();
      return;
    }

    // Text instant drop
    if (tool === 'text') {
      const newText: TextElement = {
        id: `text_${Date.now()}`,
        type: 'text',
        x: worldP.x,
        y: worldP.y,
        width: 200,
        height: 50,
        text: 'Heading or concept note',
        textColor: isDark ? '#ffffff' : '#0f172a',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'left',
        zIndex: 10,
        createdBy: currentUser.userId,
        updatedAt: Date.now(),
      };
      onAddElement(newText);
      onSelectElements([newText.id]);
      setEditingId(newText.id);
      setEditingText(newText.text);
      onResetTool();
      return;
    }

    // Select mode: check if clicking on canvas or resize handle
    if (tool === 'select') {
      // If clicking empty canvas area: start marquee
      setIsMarquee(true);
      setMarqueeBox({ x1: worldP.x, y1: worldP.y, x2: worldP.x, y2: worldP.y });
      if (!e.shiftKey) {
        onSelectElements([]);
      }
    }
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    const worldP = screenToWorld(e.clientX, e.clientY);
    onCursorMove(worldP);

    if (isPanning) {
      onTransformChange({
        ...transform,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (tool === 'laser' && (e.buttons & 1) === 1) {
      onLaserStroke(worldP);
      setLaserPoints((prev) => [...prev, { ...worldP, time: Date.now() }]);
      return;
    }

    if (isDrawingFreehand) {
      setFreehandPoints((prev) => [...prev, worldP]);
      return;
    }

    if (isDrawingConnector) {
      setConnectorCurrent(worldP);
      return;
    }

    if (isDrawingShape) {
      setShapeCurrent(worldP);
      return;
    }

    if (isMarquee && marqueeBox) {
      setMarqueeBox({ ...marqueeBox, x2: worldP.x, y2: worldP.y });
      return;
    }

    // Resizing element
    if (resizeHandle && resizeStartElem) {
      const dx = worldP.x - resizeStartMouse.x;
      const dy = worldP.y - resizeStartMouse.y;
      let newW = resizeStartElem.width;
      let newH = resizeStartElem.height;
      let newX = resizeStartElem.x;
      let newY = resizeStartElem.y;

      if (resizeHandle.includes('e')) newW = Math.max(30, resizeStartElem.width + dx);
      if (resizeHandle.includes('s')) newH = Math.max(30, resizeStartElem.height + dy);
      if (resizeHandle.includes('w')) {
        const potentialW = resizeStartElem.width - dx;
        if (potentialW > 30) {
          newW = potentialW;
          newX = resizeStartElem.x + dx;
        }
      }
      if (resizeHandle.includes('n')) {
        const potentialH = resizeStartElem.height - dy;
        if (potentialH > 30) {
          newH = potentialH;
          newY = resizeStartElem.y + dy;
        }
      }

      onUpdateElement({
        id: resizeStartElem.id,
        x: newX,
        y: newY,
        width: newW,
        height: newH,
      });
      return;
    }

    // Dragging elements
    if (isDraggingElements) {
      const dx = worldP.x - dragStartPoint.x;
      const dy = worldP.y - dragStartPoint.y;

      const updates = selectedIds
        .map((id) => {
          const init = dragInitialPositions[id];
          if (!init) return null;
          return {
            id,
            x: init.x + dx,
            y: init.y + dy,
          };
        })
        .filter(Boolean) as (Partial<BoardElement> & { id: string })[];

      onBulkUpdateElements(updates);
    }
  };

  // Mouse Up
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    const worldP = screenToWorld(e.clientX, e.clientY);

    // Freehand complete
    if (isDrawingFreehand && freehandPoints.length > 1) {
      const newFreehand: FreehandElement = {
        id: `draw_${Date.now()}`,
        type: tool === 'highlighter' ? 'highlighter' : 'pen',
        points: freehandPoints,
        stroke: tool === 'highlighter' ? '#fde047' : (isDark ? '#e2e8f0' : '#1e293b'),
        strokeWidth: tool === 'highlighter' ? 24 : 3,
        opacity: tool === 'highlighter' ? 0.35 : 1,
        zIndex: 5,
        createdBy: currentUser.userId,
        updatedAt: Date.now(),
        x: Math.min(...freehandPoints.map((p) => p.x)),
        y: Math.min(...freehandPoints.map((p) => p.y)),
        width: Math.max(...freehandPoints.map((p) => p.x)) - Math.min(...freehandPoints.map((p) => p.x)),
        height: Math.max(...freehandPoints.map((p) => p.y)) - Math.min(...freehandPoints.map((p) => p.y)),
      };
      onAddElement(newFreehand);
      setIsDrawingFreehand(false);
      setFreehandPoints([]);
      return;
    }

    // Shape / Frame complete
    if (isDrawingShape) {
      const minX = Math.min(shapeOrigin.x, shapeCurrent.x);
      const minY = Math.min(shapeOrigin.y, shapeCurrent.y);
      const w = Math.max(Math.abs(shapeCurrent.x - shapeOrigin.x), 50);
      const h = Math.max(Math.abs(shapeCurrent.y - shapeOrigin.y), 40);

      if (tool === 'frame') {
        const newFrame: FrameElement = {
          id: `frame_${Date.now()}`,
          type: 'frame',
          title: 'NEW SECTION FRAME',
          color: '#6366f1',
          x: minX,
          y: minY,
          width: w,
          height: h,
          zIndex: 1,
          createdBy: currentUser.userId,
          updatedAt: Date.now(),
        };
        onAddElement(newFrame);
        onSelectElements([newFrame.id]);
      } else {
        const newShape: ShapeElement = {
          id: `shape_${Date.now()}`,
          type: tool as ShapeType,
          x: minX,
          y: minY,
          width: w,
          height: h,
          fill: isDark ? '#1e293b' : '#f8fafc',
          stroke: '#6366f1',
          strokeWidth: 2,
          strokeStyle: 'solid',
          cornerRadius: 12,
          text: '',
          textColor: isDark ? '#f8fafc' : '#0f172a',
          fontSize: 14,
          textAlign: 'center',
          fontWeight: 'normal',
          zIndex: 5,
          createdBy: currentUser.userId,
          updatedAt: Date.now(),
        };
        onAddElement(newShape);
        onSelectElements([newShape.id]);
      }

      setIsDrawingShape(false);
      onResetTool();
      return;
    }

    // Connector complete
    if (isDrawingConnector) {
      const newConnector: ConnectorElement = {
        id: `conn_${Date.now()}`,
        type: 'connector',
        startX: connectorStart.x,
        startY: connectorStart.y,
        endX: connectorCurrent.x,
        endY: connectorCurrent.y,
        style: 'curved',
        stroke: '#818cf8',
        strokeWidth: 2,
        strokeStyle: 'solid',
        startArrow: 'none',
        endArrow: 'arrow',
        label: 'Flow Connector',
        zIndex: 4,
        createdBy: currentUser.userId,
        updatedAt: Date.now(),
        x: Math.min(connectorStart.x, connectorCurrent.x),
        y: Math.min(connectorStart.y, connectorCurrent.y),
        width: Math.abs(connectorCurrent.x - connectorStart.x),
        height: Math.abs(connectorCurrent.y - connectorStart.y),
      };
      onAddElement(newConnector);
      setIsDrawingConnector(false);
      onSelectElements([newConnector.id]);
      onResetTool();
      return;
    }

    // Marquee complete
    if (isMarquee && marqueeBox) {
      const left = Math.min(marqueeBox.x1, marqueeBox.x2);
      const top = Math.min(marqueeBox.y1, marqueeBox.y2);
      const right = Math.max(marqueeBox.x1, marqueeBox.x2);
      const bottom = Math.max(marqueeBox.y1, marqueeBox.y2);

      const selected = Object.values(elements)
        .filter((e) => {
          if (e.type === 'frame') return false; // Don't marquee select huge frames
          const ex = e.x || 0;
          const ey = e.y || 0;
          const ew = e.width || 50;
          const eh = e.height || 50;
          return ex >= left && ex + ew <= right && ey >= top && ey + eh <= bottom;
        })
        .map((e) => e.id);

      onSelectElements(selected);
      setIsMarquee(false);
      setMarqueeBox(null);
      return;
    }

    // Drag complete
    if (isDraggingElements) {
      setIsDraggingElements(false);
      setDragInitialPositions({});
    }

    // Resize complete
    if (resizeHandle) {
      setResizeHandle(null);
      setResizeStartElem(null);
    }
  };

  // Element Click / Select / Eraser
  const handleElementMouseDown = (e: React.MouseEvent, elem: BoardElement) => {
    e.stopPropagation();

    if (tool === 'eraser') {
      onDeleteElements([elem.id]);
      return;
    }

    if (tool === 'pan' || isSpacePressed) {
      return;
    }

    if (tool === 'select') {
      const isAlreadySelected = selectedIds.includes(elem.id);
      let newSelected = selectedIds;

      if (e.shiftKey) {
        newSelected = isAlreadySelected
          ? selectedIds.filter((id) => id !== elem.id)
          : [...selectedIds, elem.id];
      } else {
        if (!isAlreadySelected) {
          newSelected = [elem.id];
        }
      }

      onSelectElements(newSelected);

      // Prepare dragging
      setIsDraggingElements(true);
      const worldP = screenToWorld(e.clientX, e.clientY);
      setDragStartPoint(worldP);

      const initials: Record<string, { x: number; y: number }> = {};
      for (const id of newSelected) {
        const item = elements[id];
        if (item) {
          initials[id] = { x: item.x || 0, y: item.y || 0 };
        }
      }
      setDragInitialPositions(initials);
    }
  };

  // Double click for inline text editing
  const handleElementDoubleClick = (e: React.MouseEvent, elem: BoardElement) => {
    e.stopPropagation();
    if ('text' in elem) {
      setEditingId(elem.id);
      setEditingText((elem as any).text || '');
    } else if (elem.type === 'strategyCard') {
      setEditingId(elem.id);
      setEditingText((elem as StrategyCardElement).title);
    }
  };

  // Commit text editing
  const commitEditing = () => {
    if (!editingId) return;
    const elem = elements[editingId];
    if (elem) {
      if (elem.type === 'strategyCard') {
        onUpdateElement({ id: editingId, title: editingText } as any);
      } else {
        onUpdateElement({ id: editingId, text: editingText } as any);
      }
    }
    setEditingId(null);
  };

  // Render SVG Shape
  const renderShape = (elem: ShapeElement) => {
    const { x, y, width, height, fill, stroke, strokeWidth, strokeStyle, cornerRadius, text, textColor, fontSize, textAlign, fontWeight } = elem;

    const strokeDasharray =
      strokeStyle === 'dashed' ? '8 4' : strokeStyle === 'dotted' ? '3 3' : undefined;

    let shapeNode: React.ReactNode = null;

    switch (elem.type) {
      case 'rectangle':
        shapeNode = (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={cornerRadius ?? 8}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
        break;

      case 'circle':
        shapeNode = (
          <ellipse
            cx={x + width / 2}
            cy={y + height / 2}
            rx={width / 2}
            ry={height / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
        break;

      case 'diamond':
        const midX = x + width / 2;
        const midY = y + height / 2;
        shapeNode = (
          <polygon
            points={`${midX},${y} ${x + width},${midY} ${midX},${y + height} ${x},${midY}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
        break;

      case 'triangle':
        shapeNode = (
          <polygon
            points={`${x + width / 2},${y} ${x + width},${y + height} ${x},${y + height}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
        break;

      case 'hexagon':
        const hW = width / 4;
        shapeNode = (
          <polygon
            points={`${x + hW},${y} ${x + width - hW},${y} ${x + width},${y + height / 2} ${x + width - hW},${y + height} ${x + hW},${y + height} ${x},${y + height / 2}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
        break;

      case 'cylinder':
        const ch = Math.min(height * 0.25, 20);
        shapeNode = (
          <g>
            <path
              d={`M ${x} ${y + ch} L ${x} ${y + height - ch} A ${width / 2} ${ch} 0 0 0 ${x + width} ${y + height - ch} L ${x + width} ${y + ch} Z`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <ellipse
              cx={x + width / 2}
              cy={y + height - ch}
              rx={width / 2}
              ry={ch}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <ellipse
              cx={x + width / 2}
              cy={y + ch}
              rx={width / 2}
              ry={ch}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </g>
        );
        break;

      case 'cloud':
        shapeNode = (
          <path
            d={`M ${x + width * 0.2} ${y + height * 0.75}
               A ${width * 0.18} ${height * 0.25} 0 0 1 ${x + width * 0.3} ${y + height * 0.35}
               A ${width * 0.25} ${height * 0.35} 0 0 1 ${x + width * 0.7} ${y + height * 0.35}
               A ${width * 0.18} ${height * 0.25} 0 0 1 ${x + width * 0.85} ${y + height * 0.75}
               A ${width * 0.15} ${height * 0.18} 0 0 1 ${x + width * 0.2} ${y + height * 0.75} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );
        break;

      case 'star':
        const cx = x + width / 2;
        const cy = y + height / 2;
        const outerR = Math.min(width, height) / 2;
        const innerR = outerR * 0.45;
        let starPoints = '';
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          starPoints += `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)} `;
        }
        shapeNode = (
          <polygon
            points={starPoints.trim()}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );
        break;
    }

    return (
      <g key={elem.id} onMouseDown={(e) => handleElementMouseDown(e, elem)}>
        {shapeNode}
        {text && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            fill={textColor || '#ffffff'}
            fontSize={fontSize || 13}
            fontWeight={fontWeight || 'normal'}
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none select-none font-sans"
          >
            {text.split('\n').map((line, idx, arr) => (
              <tspan
                key={idx}
                x={x + width / 2}
                dy={idx === 0 ? `${-(arr.length - 1) * 0.6}em` : '1.2em'}
              >
                {line}
              </tspan>
            ))}
          </text>
        )}
      </g>
    );
  };

  // Render Sticky Note
  const renderSticky = (elem: StickyElement) => {
    const { id, x, y, width, height, color, text, author, votes, angle } = elem;
    const isSelected = selectedIds.includes(id);

    return (
      <g
        key={id}
        transform={`rotate(${angle || 0} ${x + width / 2} ${y + height / 2})`}
        onMouseDown={(e) => handleElementMouseDown(e, elem)}
        onDoubleClick={(e) => handleElementDoubleClick(e, elem)}
        className="cursor-move group"
      >
        {/* Soft shadow */}
        <rect
          x={x + 3}
          y={y + 5}
          width={width}
          height={height}
          rx={6}
          fill="rgba(0,0,0,0.25)"
          className="filter blur-[3px]"
        />

        {/* Note Body */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={6}
          fill={color}
          stroke={isSelected ? '#38bdf8' : 'rgba(0,0,0,0.1)'}
          strokeWidth={isSelected ? 2 : 1}
        />

        {/* Note Text */}
        <foreignObject x={x + 12} y={y + 12} width={width - 24} height={height - 48}>
          <div className="w-full h-full text-slate-900 text-xs font-medium leading-relaxed overflow-hidden pointer-events-none whitespace-pre-wrap select-none font-sans">
            {text}
          </div>
        </foreignObject>

        {/* Footer: Author & Dot Vote Counter */}
        <foreignObject x={x + 10} y={y + height - 32} width={width - 20} height={26}>
          <div className="w-full h-full flex items-center justify-between text-[10px] text-slate-700 select-none">
            <span className="font-semibold truncate max-w-[100px] opacity-75">
              {author}
            </span>

            {/* Dot Vote Badge */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCastVote(id);
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition transform hover:scale-110 active:scale-95 pointer-events-auto ${
                votes && votes.includes(currentUser.userId)
                  ? 'bg-amber-400 text-slate-950 shadow-sm ring-1 ring-amber-500'
                  : 'bg-black/10 hover:bg-black/20 text-slate-800'
              }`}
              title="Click to toggle vote"
            >
              <ThumbsUp className="w-2.5 h-2.5" />
              <span>{votes?.length || 0}</span>
            </button>
          </div>
        </foreignObject>
      </g>
    );
  };

  // Render Strategy Card
  const renderStrategyCard = (elem: StrategyCardElement) => {
    const { id, x, y, width, height, title, description, priority, status, points, assignee, tags, votes } = elem;
    const isSelected = selectedIds.includes(id);

    const priorityColors: Record<string, { bg: string; text: string }> = {
      critical: { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
      high: { bg: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
      medium: { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      low: { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    };

    const statusLabels: Record<string, string> = {
      backlog: 'Backlog',
      in_progress: 'In Progress',
      review: 'In Review',
      done: 'Completed',
    };

    return (
      <g
        key={id}
        onMouseDown={(e) => handleElementMouseDown(e, elem)}
        onDoubleClick={(e) => handleElementDoubleClick(e, elem)}
        className="cursor-move"
      >
        <foreignObject x={x} y={y} width={width} height={height}>
          <div
            className={`w-full h-full rounded-2xl p-3.5 flex flex-col justify-between shadow-xl transition backdrop-blur-md select-none border ${
              isSelected ? 'ring-2 ring-indigo-400 border-indigo-400' : 'border-slate-700/80'
            } ${isDark ? 'bg-slate-900/90 text-white' : 'bg-white/95 text-slate-900'}`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    priorityColors[priority]?.bg || priorityColors.medium.bg
                  }`}
                >
                  {priority}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {statusLabels[status] || status}
                </span>
              </div>

              <h4 className="font-bold text-xs leading-snug line-clamp-2">
                {title}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {points} pts
                </span>
                {assignee && (
                  <span className="text-slate-400 truncate max-w-[80px]">
                    {assignee}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCastVote(id);
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition transform hover:scale-105 ${
                  votes && votes.includes(currentUser.userId)
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
                title="Vote for this strategy item"
              >
                <ThumbsUp className="w-2.5 h-2.5" />
                <span>{votes?.length || 0}</span>
              </button>
            </div>
          </div>
        </foreignObject>
      </g>
    );
  };

  // Render Section Frame
  const renderFrame = (elem: FrameElement) => {
    const { id, x, y, width, height, title, color } = elem;
    const isSelected = selectedIds.includes(id);

    return (
      <g key={id} onMouseDown={(e) => handleElementMouseDown(e, elem)}>
        {/* Frame Box */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={16}
          fill="rgba(15, 23, 42, 0.35)"
          stroke={color || '#6366f1'}
          strokeWidth={isSelected ? 2.5 : 1.5}
          strokeDasharray="6 4"
        />

        {/* Header Banner */}
        <rect
          x={x}
          y={y}
          width={width}
          height={34}
          rx={16}
          fill={color || '#6366f1'}
          opacity={0.85}
        />
        <text
          x={x + 16}
          y={y + 22}
          fill="#ffffff"
          fontSize={11}
          fontWeight="bold"
          letterSpacing="0.08em"
          className="pointer-events-none select-none font-mono"
        >
          {title}
        </text>
      </g>
    );
  };

  // Render Connector
  const renderConnector = (elem: ConnectorElement) => {
    const { id, startX, startY, endX, endY, style, stroke, strokeWidth, strokeStyle, startArrow, endArrow, label } = elem;
    const isSelected = selectedIds.includes(id);

    const pathData = getConnectorPath(startX, startY, endX, endY, style);
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const strokeDash = strokeStyle === 'dashed' ? '6 4' : strokeStyle === 'dotted' ? '2 2' : undefined;

    return (
      <g
        key={id}
        onMouseDown={(e) => handleElementMouseDown(e, elem)}
        className="cursor-pointer"
      >
        {/* Invisible hit line for easier selection */}
        <path
          d={pathData}
          fill="none"
          stroke="transparent"
          strokeWidth={16}
        />

        {/* Visible line */}
        <path
          d={pathData}
          fill="none"
          stroke={isSelected ? '#38bdf8' : stroke}
          strokeWidth={isSelected ? strokeWidth + 1 : strokeWidth}
          strokeDasharray={strokeDash}
          markerEnd={endArrow === 'arrow' ? 'url(#arrowhead)' : undefined}
          markerStart={startArrow === 'arrow' ? 'url(#arrowhead-start)' : undefined}
        />

        {label && (
          <g>
            <rect
              x={midX - label.length * 3.5 - 6}
              y={midY - 10}
              width={label.length * 7 + 12}
              height={20}
              rx={6}
              fill="#0f172a"
              stroke="#334155"
              strokeWidth={1}
            />
            <text
              x={midX}
              y={midY + 4}
              fill="#94a3b8"
              fontSize={10}
              fontWeight="bold"
              textAnchor="middle"
              className="pointer-events-none select-none font-mono"
            >
              {label}
            </text>
          </g>
        )}
      </g>
    );
  };

  // Render Freehand Stroke
  const renderFreehand = (elem: FreehandElement) => {
    const { id, points, stroke, strokeWidth, opacity, type } = elem;
    const isSelected = selectedIds.includes(id);
    const d = getSvgPathFromPoints(points);

    return (
      <g key={id} onMouseDown={(e) => handleElementMouseDown(e, elem)}>
        <path
          d={d}
          fill="none"
          stroke={isSelected ? '#38bdf8' : stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={opacity ?? (type === 'highlighter' ? 0.35 : 1)}
        />
      </g>
    );
  };

  // Render Text Block
  const renderText = (elem: TextElement) => {
    const { id, x, y, width, height, text, textColor, fontSize, fontWeight, textAlign } = elem;
    const isSelected = selectedIds.includes(id);

    return (
      <g
        key={id}
        onMouseDown={(e) => handleElementMouseDown(e, elem)}
        onDoubleClick={(e) => handleElementDoubleClick(e, elem)}
        className="cursor-move"
      >
        <foreignObject x={x} y={y} width={width} height={height}>
          <div
            className={`w-full h-full p-2 select-none whitespace-pre-wrap leading-tight ${
              isSelected ? 'ring-1 ring-indigo-400 bg-indigo-500/10 rounded' : ''
            }`}
            style={{
              color: textColor || '#ffffff',
              fontSize: `${fontSize || 16}px`,
              fontWeight: fontWeight || 'bold',
              textAlign: textAlign || 'left',
            }}
          >
            {text}
          </div>
        </foreignObject>
      </g>
    );
  };

  // Active selection bounding box with resize handles
  const renderSelectionBoundingBox = () => {
    if (selectedIds.length === 0) return null;
    const selectedElements = selectedIds
      .map((id) => elements[id])
      .filter(Boolean);

    if (selectedElements.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const elem of selectedElements) {
      const ex = elem.x ?? 0;
      const ey = elem.y ?? 0;
      const ew = elem.width ?? 50;
      const eh = elem.height ?? 50;
      minX = Math.min(minX, ex);
      minY = Math.min(minY, ey);
      maxX = Math.max(maxX, ex + ew);
      maxY = Math.max(maxY, ey + eh);
    }

    const boxW = maxX - minX;
    const boxH = maxY - minY;

    return (
      <g className="selection-overlay pointer-events-none">
        {/* Bounding box outline */}
        <rect
          x={minX - 4}
          y={minY - 4}
          width={boxW + 8}
          height={boxH + 8}
          fill="none"
          stroke="#6366f1"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          rx={4}
        />

        {/* Resize Handles (interactive if single element selected) */}
        {selectedElements.length === 1 && selectedElements[0].type !== 'connector' && (
          <>
            {[
              { id: 'nw', x: minX - 4, y: minY - 4, cursor: 'nwse-resize' },
              { id: 'ne', x: maxX + 4, y: minY - 4, cursor: 'nesw-resize' },
              { id: 'se', x: maxX + 4, y: maxY + 4, cursor: 'nwse-resize' },
              { id: 'sw', x: minX - 4, y: maxY + 4, cursor: 'nesw-resize' },
            ].map((h) => (
              <circle
                key={h.id}
                cx={h.x}
                cy={h.y}
                r={5}
                fill="#ffffff"
                stroke="#6366f1"
                strokeWidth={2}
                className="pointer-events-auto"
                style={{ cursor: h.cursor }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setResizeHandle(h.id);
                  setResizeStartElem(selectedElements[0]);
                  setResizeStartMouse(screenToWorld(e.clientX, e.clientY));
                }}
              />
            ))}
          </>
        )}
      </g>
    );
  };

  // Render Remote Users' Cursors
  const renderRemoteCursors = () => {
    return Object.values(users).map((user) => {
      if (user.userId === currentUser.userId || !user.cursor) return null;

      return (
        <g
          key={user.userId}
          className="remote-cursor pointer-events-none transition-all duration-75"
          transform={`translate(${user.cursor.x}, ${user.cursor.y})`}
        >
          {/* Cursor SVG Arrow */}
          <path
            d="M 0 0 L 0 16 L 4 12 L 8 20 L 11 18 L 7 11 L 13 11 Z"
            fill={user.userColor}
            stroke="#ffffff"
            strokeWidth={1}
          />
          {/* User Name Tag */}
          <g transform="translate(12, 14)">
            <rect
              x={0}
              y={0}
              width={user.userName.length * 6.5 + 14}
              height={20}
              rx={6}
              fill={user.userColor}
              className="shadow-md"
            />
            <text
              x={7}
              y={14}
              fill="#ffffff"
              fontSize={10}
              fontWeight="bold"
              className="select-none font-sans"
            >
              {user.userName}
            </text>
          </g>
        </g>
      );
    });
  };

  // Render Laser Pointer Trails
  const renderLaserTrails = () => {
    if (laserPoints.length < 2) return null;
    const now = Date.now();

    return (
      <g className="laser-trail pointer-events-none">
        {laserPoints.map((pt, i) => {
          if (i === 0) return null;
          const prev = laserPoints[i - 1];
          const age = (now - pt.time) / 1200;
          if (age >= 1) return null;
          const opacity = 1 - age;

          return (
            <line
              key={i}
              x1={prev.x}
              y1={prev.y}
              x2={pt.x}
              y2={pt.y}
              stroke="#f43f5e"
              strokeWidth={4 * (1 - age) + 1}
              strokeLinecap="round"
              opacity={opacity}
              filter="url(#laser-glow)"
            />
          );
        })}
      </g>
    );
  };

  // Render Floating Reaction Bursts
  const renderReactions = () => {
    return reactions.map((rx) => (
      <div
        key={rx.id}
        className="absolute pointer-events-none animate-float-up text-3xl font-bold flex flex-col items-center"
        style={{
          left: `${rx.x * transform.scale + transform.x}px`,
          top: `${rx.y * transform.scale + transform.y}px`,
        }}
      >
        <span>{rx.emoji}</span>
        <span className="text-[10px] bg-slate-900/80 text-slate-200 px-1.5 py-0.5 rounded-full mt-1 border border-slate-700">
          {rx.userName}
        </span>
      </div>
    ));
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={`relative w-full h-full overflow-hidden select-none cursor-${
        isSpacePressed || tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair'
      }`}
      style={{
        backgroundColor: isDark ? '#080b11' : '#f8fafc',
      }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      >
        <defs>
          {/* Arrowhead markers */}
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX={8}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8" />
          </marker>
          <marker
            id="arrowhead-start"
            viewBox="0 0 10 10"
            refX={2}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto"
          >
            <path d="M 10 1 L 0 5 L 10 9 z" fill="#818cf8" />
          </marker>

          {/* Laser Glow Filter */}
          <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Grid Patterns */}
          {gridType === 'dots' && (
            <pattern
              id="canvas-grid-dots"
              width={24 * transform.scale}
              height={24 * transform.scale}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${transform.x}, ${transform.y})`}
            >
              <circle
                cx={2}
                cy={2}
                r={1.2}
                fill={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}
              />
            </pattern>
          )}

          {gridType === 'lines' && (
            <pattern
              id="canvas-grid-lines"
              width={32 * transform.scale}
              height={32 * transform.scale}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${transform.x}, ${transform.y})`}
            >
              <path
                d={`M ${32 * transform.scale} 0 L 0 0 0 ${32 * transform.scale}`}
                fill="none"
                stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                strokeWidth={1}
              />
            </pattern>
          )}
        </defs>

        {/* Canvas Background Grid */}
        {gridType === 'dots' && (
          <rect width="100%" height="100%" fill="url(#canvas-grid-dots)" />
        )}
        {gridType === 'lines' && (
          <rect width="100%" height="100%" fill="url(#canvas-grid-lines)" />
        )}

        {/* World Transform Layer */}
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Elements sorted by zIndex */}
          {Object.values(elements)
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map((elem) => {
              switch (elem.type) {
                case 'sticky':
                  return renderSticky(elem as StickyElement);
                case 'strategyCard':
                  return renderStrategyCard(elem as StrategyCardElement);
                case 'frame':
                  return renderFrame(elem as FrameElement);
                case 'connector':
                  return renderConnector(elem as ConnectorElement);
                case 'pen':
                case 'highlighter':
                  return renderFreehand(elem as FreehandElement);
                case 'text':
                  return renderText(elem as TextElement);
                default:
                  return renderShape(elem as ShapeElement);
              }
            })}

          {/* Active creation preview (Freehand) */}
          {isDrawingFreehand && freehandPoints.length > 1 && (
            <path
              d={getSvgPathFromPoints(freehandPoints)}
              fill="none"
              stroke={tool === 'highlighter' ? '#fde047' : '#6366f1'}
              strokeWidth={tool === 'highlighter' ? 24 : 3}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={tool === 'highlighter' ? 0.35 : 1}
            />
          )}

          {/* Active creation preview (Shape) */}
          {isDrawingShape && (
            <rect
              x={Math.min(shapeOrigin.x, shapeCurrent.x)}
              y={Math.min(shapeOrigin.y, shapeCurrent.y)}
              width={Math.abs(shapeCurrent.x - shapeOrigin.x)}
              height={Math.abs(shapeCurrent.y - shapeOrigin.y)}
              fill="rgba(99, 102, 241, 0.15)"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="4 2"
              rx={8}
            />
          )}

          {/* Active creation preview (Connector) */}
          {isDrawingConnector && (
            <path
              d={getConnectorPath(connectorStart.x, connectorStart.y, connectorCurrent.x, connectorCurrent.y, 'curved')}
              fill="none"
              stroke="#818cf8"
              strokeWidth={2}
              strokeDasharray="4 2"
              markerEnd="url(#arrowhead)"
            />
          )}

          {/* Marquee Selection Box */}
          {isMarquee && marqueeBox && (
            <rect
              x={Math.min(marqueeBox.x1, marqueeBox.x2)}
              y={Math.min(marqueeBox.y1, marqueeBox.y2)}
              width={Math.abs(marqueeBox.x2 - marqueeBox.x1)}
              height={Math.abs(marqueeBox.y2 - marqueeBox.y1)}
              fill="rgba(99, 102, 241, 0.12)"
              stroke="#6366f1"
              strokeWidth={1.5}
              strokeDasharray="4 2"
            />
          )}

          {/* Selection bounding box */}
          {renderSelectionBoundingBox()}

          {/* Laser Trails */}
          {renderLaserTrails()}

          {/* Remote Cursors */}
          {renderRemoteCursors()}
        </g>
      </svg>

      {/* Floating Reactions DOM Layer */}
      {renderReactions()}

      {/* Inline Text Editor Overlay */}
      {editingId && elements[editingId] && (
        <div
          className="absolute z-40"
          style={{
            left: `${elements[editingId].x * transform.scale + transform.x}px`,
            top: `${elements[editingId].y * transform.scale + transform.y}px`,
            width: `${(elements[editingId].width || 200) * transform.scale}px`,
            height: `${(elements[editingId].height || 100) * transform.scale}px`,
          }}
        >
          <textarea
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onBlur={commitEditing}
            onKeyDown={(e) => {
              if (e.key === 'Escape') commitEditing();
            }}
            autoFocus
            className="w-full h-full bg-slate-900/90 text-white p-2 text-xs rounded-xl border-2 border-indigo-500 focus:outline-none resize-none shadow-2xl font-sans"
          />
        </div>
      )}
    </div>
  );
};
