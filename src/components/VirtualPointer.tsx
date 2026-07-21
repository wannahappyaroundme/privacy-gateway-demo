import {motion} from 'motion/react';

import type {VirtualPointerState} from '../demo/state';

type VirtualPointerProps = {
  pointer: VirtualPointerState;
  offsetY?: number;
};

export function VirtualPointer({pointer, offsetY = 0}: VirtualPointerProps) {
  if (!pointer.visible) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="virtual-pointer"
      data-phase={pointer.phase}
      data-testid="virtual-pointer"
      style={{
        left: pointer.x,
        top: pointer.y + offsetY,
        transform: pointer.pressed ? 'translate(-3px, -2px) scale(0.88)' : 'translate(-3px, -2px)',
      }}
    >
      <svg viewBox="0 0 34 42" aria-hidden="true">
        <path d="M3 2l25 22-12 2 7 12-7 3-7-13-7 9z" />
      </svg>
      {pointer.pressed && <span className="virtual-pointer__pulse" />}
    </motion.div>
  );
}
