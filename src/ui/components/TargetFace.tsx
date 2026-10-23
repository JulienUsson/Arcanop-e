import { useRef } from 'react';
import { ACTION_ICONS, ACTION_LABELS, CLASSES } from '../../game/classes';
import { hitAt, RING_COLORS, type TargetHit } from '../../game/target';
import type { ClassId } from '../../game/types';

export interface Marker {
  x: number;
  y: number;
  label: string;
}

interface Props {
  classId: ClassId;
  markers: Marker[];
  disabled?: boolean;
  onHit: (hit: TargetHit, x: number, y: number) => void;
}

const LABEL_POSITIONS: [number, number][] = [
  [-50, -50],
  [50, -50],
  [-50, 50],
  [50, 50],
];

export function TargetFace({ classId, markers, disabled, onHit }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const cls = CLASSES[classId];

  const handle = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const pxPerUnit = svg.getBoundingClientRect().width / 220;
    const tolerance = Math.max(2.5, 8 / pxPerUnit) / 100;
    const x = pt.x / 100;
    const y = pt.y / 100;
    const hit = hitAt(x, y, tolerance);
    if (hit) onHit(hit, x, y);
  };

  return (
    <svg
      ref={svgRef}
      className={`target-face${disabled ? ' disabled' : ''}`}
      viewBox="-110 -110 220 220"
      onPointerDown={handle}
      role="img"
      aria-label={`Blason du ${cls.name}`}
    >
      {Array.from({ length: 10 }, (_, i) => {
        const score = i + 1;
        const colors = RING_COLORS[score];
        return (
          <circle
            key={score}
            r={(11 - score) * 10}
            fill={colors.fill}
            stroke={score === 3 || score === 4 ? '#bbb' : colors.line}
            strokeWidth={0.5}
          />
        );
      })}
      <circle r={5} fill="none" stroke="#111" strokeWidth={0.35} />
      {Array.from({ length: 10 }, (_, i) => {
        const score = i + 1;
        return (
          <text key={score} x={(10.5 - score) * 10} y={6} className="ring-label" fill={RING_COLORS[score].text}>
            {score}
          </text>
        );
      })}
      <g className="quadrant-lines">
        <line x1={0} y1={-100} x2={0} y2={100} stroke="#fff" strokeWidth={3.2} />
        <line x1={-100} y1={0} x2={100} y2={0} stroke="#fff" strokeWidth={3.2} />
        <line x1={0} y1={-100} x2={0} y2={100} stroke="#3a2a55" strokeWidth={1.6} />
        <line x1={-100} y1={0} x2={100} y2={0} stroke="#3a2a55" strokeWidth={1.6} />
      </g>
      {cls.quadrants.map((action, q) => {
        const [x, y] = LABEL_POSITIONS[q];
        return (
          <g key={q} className={`quadrant-label action-${action}`} transform={`translate(${x} ${y})`}>
            <rect x={-25} y={-10} width={50} height={20} rx={10} />
            <text y={1}>
              {ACTION_ICONS[action]} {ACTION_LABELS[action]}
            </text>
          </g>
        );
      })}
      {markers.map((m, i) => (
        <g key={i} className="arrow-marker" transform={`translate(${m.x * 100} ${m.y * 100})`}>
          <circle r={4.2} />
          <text y={0.3}>{m.label}</text>
        </g>
      ))}
    </svg>
  );
}
