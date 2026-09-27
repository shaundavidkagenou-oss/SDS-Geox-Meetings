export type ToolType =
  | 'select'
  | 'pan'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'triangle'
  | 'hexagon'
  | 'cloud'
  | 'cylinder'
  | 'star'
  | 'sticky'
  | 'connector'
  | 'text'
  | 'strategyCard'
  | 'frame'
  | 'laser';

export type ShapeType =
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'triangle'
  | 'hexagon'
  | 'cloud'
  | 'cylinder'
  | 'star';

export type ConnectorStyle = 'straight' | 'curved' | 'elbow';
export type ArrowHead = 'none' | 'arrow' | 'circle' | 'diamond';

export interface Point {
  x: number;
  y: number;
}

export interface AnchorPoint {
  elementId: string;
  side: 'top' | 'right' | 'bottom' | 'left' | 'center';
}

export interface BaseElement {
  id: string;
  type: ToolType | ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees
  zIndex: number;
  locked?: boolean;
  createdBy: string;
  creatorName?: string;
  updatedAt: number;
}

export interface ShapeElement extends BaseElement {
  type: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number;
  text?: string;
  textColor?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
}

export interface StickyElement extends BaseElement {
  type: 'sticky';
  color: string; // hex or color key
  text: string;
  textColor?: string;
  fontSize?: number;
  author: string;
  votes: string[]; // user ids
  angle?: number;
}

export interface ConnectorElement extends BaseElement {
  type: 'connector';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startAnchor?: AnchorPoint;
  endAnchor?: AnchorPoint;
  style: ConnectorStyle;
  stroke: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  startArrow: ArrowHead;
  endArrow: ArrowHead;
  label?: string;
}

export interface FreehandElement extends BaseElement {
  type: 'pen' | 'highlighter';
  points: Point[];
  stroke: string;
  strokeWidth: number;
  opacity?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'semibold' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  backgroundColor?: string;
  fontFamily?: 'sans' | 'mono' | 'serif';
}

export interface StrategyCardElement extends BaseElement {
  type: 'strategyCard';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  points: number;
  assignee?: string;
  tags: string[];
  votes: string[];
  colorTheme?: string;
}

export interface FrameElement extends BaseElement {
  type: 'frame';
  title: string;
  color: string; // border/tint color
  collapsed?: boolean;
}

export type BoardElement =
  | ShapeElement
  | StickyElement
  | ConnectorElement
  | FreehandElement
  | TextElement
  | StrategyCardElement
  | FrameElement;

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface UserPresence {
  userId: string;
  userName: string;
  userColor: string;
  avatar: string;
  role: 'Host' | 'Editor' | 'Viewer';
  cursor: Point | null;
  selectedElementIds: string[];
  laserPoints: { x: number; y: number; time: number }[];
  isSpeaking: boolean;
  isMuted: boolean;
  hasVideo: boolean;
  isScreenSharing: boolean;
  lastActive: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  assignee?: string;
}

export interface TimerState {
  active: boolean;
  durationSeconds: number;
  remainingSeconds: number;
  startedAt?: number;
}

export interface VotingState {
  active: boolean;
  durationSeconds: number;
  remainingSeconds: number;
  maxVotesPerUser: number;
  topic: string;
}

export interface ReactionBurst {
  id: string;
  emoji: string;
  x: number;
  y: number;
  userId: string;
  userName: string;
}

export interface BoardState {
  roomId: string;
  boardName: string;
  elements: Record<string, BoardElement>;
  timer: TimerState;
  voting: VotingState;
  notes: string;
  checklist: ChecklistItem[];
  updatedAt: number;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: 'architecture' | 'strategy' | 'agile' | 'product' | 'ideation';
  description: string;
  icon: string;
  elements: BoardElement[];
}
