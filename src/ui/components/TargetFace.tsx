import { useRef, useState } from 'react';
import { ACTION_ICONS, ACTION_LABELS, CLASSES } from '../../game/classes';
import { hitAt, RING_COLORS, type TargetHit } from '../../game/target';
import type { ClassId, Quadrant } from '../../game/types';

export interface Marker {
  x: number;
  y: number;
}

interface Props {
  classId: ClassId;
  markers: Marker[];
  disabled?: boolean;
  readOnly?: boolean;
  onHit: (hit: TargetHit, x: number, y: number) => void;
}

interface Flash {
  key: number;
  score: number;
  quadrants: Quadrant[];
  x: number;
  y: number;
}

const LABEL_POSITIONS: [number, number][] = [
  [-50, -50],
  [50, -50],
  [-50, 50],
  [50, 50],
];

const QUADRANT_ANGLES: [number, number][] = [
  [180, 270],
  [270, 360],
  [90, 180],
  [0, 90],
];

function polar(r: number, deg: number): string {
  const rad = (deg * Math.PI) / 180;
  return `${(r * Math.cos(rad)).toFixed(2)} ${(r * Math.sin(rad)).toFixed(2)}`;
}

export function zonePath(score: number, quadrant: Quadrant): string {
  const outer = (11 - score) * 10;
  const inner = (10 - score) * 10;
  const [a0, a1] = QUADRANT_ANGLES[quadrant];
  const outerArc = `M ${polar(outer, a0)} A ${outer} ${outer} 0 0 1 ${polar(outer, a1)}`;
  if (inner === 0) return `${outerArc} L 0 0 Z`;
  return `${outerArc} L ${polar(inner, a1)} A ${inner} ${inner} 0 0 0 ${polar(inner, a0)} Z`;
}

export function TargetFace({ classId, markers, disabled, readOnly, onHit }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const cls = CLASSES[classId];

  const handle = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled || readOnly) return;
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const pxPerUnit = svg.getBoundingClientRect().width / 220;
    const tolerance = Math.max(2.5, 8 / pxPerUnit) / 100;
    const x = pt.x / 100;
    const y = pt.y / 100;
    const hit = hitAt(x, y, tolerance);
    if (!hit) return;
    setFlash({ key: Date.now(), score: hit.score, quadrants: hit.quadrants, x, y });
    onHit(hit, x, y);
  };

  const single = flash && flash.quadrants.length === 1 ? cls.quadrants[flash.quadrants[0]] : null;

  return (
    <svg
      ref={svgRef}
      className={`target-face${disabled ? ' disabled' : ''}${readOnly ? ' read-only' : ''}`}
      viewBox="-110 -110 220 220"
      onPointerDown={handle}
      role="img"
      aria-label={`Blason du ${cls.name}`}
    >
      <circle r={106} className="target-halo" />
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
      {flash && (
        <g key={flash.key} className="zone-flash">
          {flash.quadrants.map((q) => (
            <path key={q} d={zonePath(flash.score, q)} />
          ))}
        </g>
      )}
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
        <circle key={i} className="arrow-marker" cx={m.x * 100} cy={m.y * 100} r={2.6} />
      ))}
      {flash && single && (
        <text key={`t${flash.key}`} className="zone-float" x={flash.x * 100} y={flash.y * 100 - 8}>
          {flash.score} {ACTION_ICONS[single]}
        </text>
      )}
    </svg>
  );
}
