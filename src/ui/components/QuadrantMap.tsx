import { ACTION_ICONS, ACTION_LABELS, CLASSES } from '../../game/classes';
import type { ClassId } from '../../game/types';

export function QuadrantMap({ classId }: { classId: ClassId }) {
  const cls = CLASSES[classId];
  return (
    <div className="quadrant-map" aria-label={`Quadrants du ${cls.name}`}>
      {cls.quadrants.map((action, q) => (
        <div key={q} className={`qcell action-${action}`}>
          {ACTION_ICONS[action]} {ACTION_LABELS[action]}
        </div>
      ))}
    </div>
  );
}
