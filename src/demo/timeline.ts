import {COPY} from '../content/copy';
import type {ValidatedFixture} from './schema';
import type {
  EntityProgress,
  InspectionState,
  RouteState,
  SceneId,
  TimelineResult,
  TimelineState,
  ValidationPlanState,
  VirtualPointerState,
} from './state';

export type {TimelineResult, TimelineState} from './state';

export const MANUAL_STOPS = [45, 150, 225, 360, 480, 610, 750, 855, 945] as const;

export const HOLD_RANGES = [
  [30, 60],
  [210, 240],
  [345, 375],
  [465, 495],
  [595, 631],
  [735, 765],
  [840, 900],
  [930, 960],
] as const;

export const SUMMARIZE_BUTTON_BOUNDS = {
  x: 321,
  y: 733,
  width: 192,
  height: 56,
} as const;

const POINTER_START = {x: 1_720, y: 960} as const;
const POINTER_TARGET = {
  x: SUMMARIZE_BUTTON_BOUNDS.x + SUMMARIZE_BUTTON_BOUNDS.width / 2,
  y: SUMMARIZE_BUTTON_BOUNDS.y + SUMMARIZE_BUTTON_BOUNDS.height / 2,
} as const;

const FRAME_ERROR = 'Frame must be an integer from 0 to 989';

function assertFrame(frame: number): void {
  if (!Number.isInteger(frame) || frame < 0 || frame > 989) throw new RangeError(FRAME_ERROR);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function progress(frame: number, start: number, end: number): number {
  if (frame <= start) return 0;
  if (frame >= end) return 1;
  return clamp01((frame - start) / (end - start));
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function sceneAt(frame: number): SceneId {
  if (frame < 90) return 'overview';
  if (frame < 180) return 'gap';
  if (frame < 300) return 'detect';
  if (frame < 420) return 'protect';
  if (frame < 540) return 'route';
  if (frame < 690) return 'inspect';
  if (frame < 810) return 'result';
  if (frame < 900) return 'finish';
  return 'withheld';
}

function pointerAt(frame: number): VirtualPointerState {
  if (frame < 120) {
    return {...POINTER_START, visible: false, pressed: false, phase: 'hidden'};
  }

  if (frame <= 143) {
    const amount = progress(frame, 120, 143);
    return {
      x: lerp(POINTER_START.x, POINTER_TARGET.x, amount),
      y: lerp(POINTER_START.y, POINTER_TARGET.y, amount),
      visible: true,
      pressed: false,
      phase: 'moving',
    };
  }

  if (frame <= 155) {
    return {...POINTER_TARGET, visible: true, pressed: false, phase: 'holding'};
  }

  if (frame <= 159) {
    return {...POINTER_TARGET, visible: true, pressed: true, phase: 'pressed'};
  }

  if (frame <= 165) {
    return {...POINTER_TARGET, visible: true, pressed: false, phase: 'released'};
  }

  return {...POINTER_TARGET, visible: false, pressed: false, phase: 'hidden'};
}

function entityProtectionAt(frame: number): EntityProgress {
  return {
    name: progress(frame, 300, 314),
    contact: progress(frame, 315, 329),
    account: progress(frame, 330, 344),
  };
}

function routeAt(frame: number): RouteState {
  const internalProgress = progress(frame, 420, 449);

  return {
    externalState: frame < 420 ? 'not-shown' : 'blocked',
    internalState:
      frame < 420 ? 'not-shown' : internalProgress < 1 ? 'activating' : 'approved',
    internalProgress,
    externalPayloadProgress: 0,
  };
}

function inspectionProgressAt(frame: number): number {
  if (frame < 540) return 0;
  if (frame <= 594) return lerp(0, 0.55, progress(frame, 540, 594));
  if (frame <= 630) return 0.55;
  if (frame <= 689) return lerp(0.55, 1, progress(frame, 631, 689));
  return 1;
}

function inspectionAt(frame: number): InspectionState {
  return {
    progress: inspectionProgressAt(frame),
    complete: frame >= 690,
    disclosureAllowed: frame >= 690 && frame <= 899,
  };
}

function validationAt(frame: number): ValidationPlanState {
  const validationProgress = progress(frame, 810, 834);
  return {
    progress: validationProgress,
    people: 5,
    tasksPerPerson: 10,
  };
}

function stageScrollAt(frame: number): number {
  const scrollProgress = progress(frame, 180, 209);
  return scrollProgress === 0 ? 0 : -80 * scrollProgress;
}

function resultAt(frame: number, fixture: ValidatedFixture): TimelineResult {
  if (frame < 690) return null;
  if (frame <= 899) {
    const fields = fixture.verifiedResult.map((field) => Object.freeze({...field}));
    return {kind: 'verified', fields: Object.freeze(fields)};
  }
  return {
    kind: 'withheld',
    reason: fixture.blockReason.description,
    helpExpanded: frame >= 960,
  };
}

function accessibilityStatusAt(scene: SceneId): string {
  return COPY.sceneHeadlines[scene];
}

export function stateAt(frame: number, fixture: ValidatedFixture): TimelineState {
  assertFrame(frame);
  const scene = sceneAt(frame);
  const entityProtection = entityProtectionAt(frame);

  return {
    frame,
    scene,
    pointer: pointerAt(frame),
    stageScrollY: stageScrollAt(frame),
    summarySelected: frame >= 160,
    detectionProgress: progress(frame, 180, 209),
    entityProtection,
    protectionProgress:
      (entityProtection.name + entityProtection.contact + entityProtection.account) / 3,
    route: routeAt(frame),
    inspection: inspectionAt(frame),
    resultRevealProgress: frame >= 690 && frame <= 899 ? progress(frame, 690, 734) : 0,
    validation: validationAt(frame),
    accessibilityStatus: accessibilityStatusAt(scene),
    result: resultAt(frame, fixture),
  };
}

export function stateSignature(state: TimelineState): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(state).filter(([key]) => key !== 'frame')),
  );
}
