import { Point, ConnectorStyle, ArrowHead } from '../types';

export function distance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Generate smooth path data from freehand points using Catmull-Rom or Bezier
export function getSvgPathFromPoints(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.5} ${points[0].y + 0.5}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y}, ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

// Generate connector path
export function getConnectorPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  style: ConnectorStyle
): string {
  if (style === 'straight') {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  if (style === 'curved') {
    const dx = endX - startX;
    const dy = endY - startY;
    const cx = startX + dx * 0.5;
    const cy = startY + dy * 0.1;
    return `M ${startX} ${startY} Q ${cx} ${cy}, ${endX} ${endY}`;
  }

  if (style === 'elbow') {
    const midX = (startX + endX) / 2;
    return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
  }

  return `M ${startX} ${startY} L ${endX} ${endY}`;
}

// Calculate angle of connector end for arrow heads
export function getAngleAtEnd(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  style: ConnectorStyle
): number {
  if (style === 'elbow') {
    const midX = (startX + endX) / 2;
    return Math.atan2(endY - endY, endX - midX);
  }
  return Math.atan2(endY - startY, endX - startX);
}

// Snap point to grid
export function snapToGrid(val: number, gridSize = 16): number {
  return Math.round(val / gridSize) * gridSize;
}

// Check if point is inside rectangle
export function pointInRect(p: Point, rect: { x: number; y: number; width: number; height: number }): boolean {
  return (
    p.x >= rect.x &&
    p.x <= rect.x + rect.width &&
    p.y >= rect.y &&
    p.y <= rect.y + rect.height
  );
}

// Get cardinal anchor points of a bounding box
export function getElementAnchorPoints(x: number, y: number, width: number, height: number) {
  return {
    top: { x: x + width / 2, y: y },
    right: { x: x + width, y: y + height / 2 },
    bottom: { x: x + width / 2, y: y + height },
    left: { x: x, y: y + height / 2 },
    center: { x: x + width / 2, y: y + height / 2 },
  };
}
