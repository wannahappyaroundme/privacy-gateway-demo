import {COPY} from '../content/copy';
import type {SyntheticCase} from '../prototype/contracts';
import {runAtStage, type RunStage} from '../prototype/run';
import type {
  EntityProgress,
  InspectionState,
  RouteState,
  SceneId,
  TimelineState,
  VirtualPointerState,
} from './state';

export type {TimelineState} from './state';

export const MANUAL_STOPS = [45, 180, 360, 610, 790] as const;

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
const FRAME_ERROR = 'Frame must be an integer from 0 to 899';

function assertFrame(frame: number): void {
  if (!Number.isInteger(frame) || frame < 0 || frame > 899) throw new RangeError(FRAME_ERROR);
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

export function stageAtFrame(frame: number): Exclude<RunStage, 'idle'> {
  assertFrame(frame);
  if (frame <= 134) return 'detected';
  if (frame <= 269) return 'protected';
  if (frame <= 472) return 'mocked';
  if (frame <= 742) return 'inspected';
  return 'published';
}

function sceneAt(runStage: Exclude<RunStage, 'idle'>): SceneId {
  if (runStage === 'detected') return 'detect';
  if (runStage === 'protected') return 'protect';
  if (runStage === 'mocked') return 'route';
  if (runStage === 'inspected') return 'inspect';
  return 'result';
}

function pointerAt(frame: number): VirtualPointerState {
  if (frame < 90) return {...POINTER_START, visible: false, pressed: false, phase: 'hidden'};
  if (frame <= 109) {
    const amount = progress(frame, 90, 109);
    return {
      x: lerp(POINTER_START.x, POINTER_TARGET.x, amount),
      y: lerp(POINTER_START.y, POINTER_TARGET.y, amount),
      visible: true,
      pressed: false,
      phase: 'moving',
    };
  }
  if (frame <= 119) return {...POINTER_TARGET, visible: true, pressed: false, phase: 'holding'};
  if (frame <= 124) return {...POINTER_TARGET, visible: true, pressed: true, phase: 'pressed'};
  if (frame <= 134) return {...POINTER_TARGET, visible: true, pressed: false, phase: 'released'};
  return {...POINTER_TARGET, visible: false, pressed: false, phase: 'hidden'};
}

function entityProtectionAt(frame: number): EntityProgress {
  return {
    name: progress(frame, 135, 179),
    contact: progress(frame, 180, 224),
    account: progress(frame, 225, 269),
  };
}

function routeAt(frame: number): RouteState {
  const internalProgress = progress(frame, 270, 472);
  return {
    externalState: frame < 270 ? 'not-shown' : 'blocked',
    internalState:
      frame < 270 ? 'not-shown' : internalProgress < 1 ? 'activating' : 'approved',
    internalProgress,
    externalPayloadProgress: 0,
  };
}

function inspectionAt(frame: number, disclosureAllowed: boolean): InspectionState {
  return {
    progress: progress(frame, 473, 742),
    complete: frame >= 742,
    disclosureAllowed,
  };
}

function accessibilityStatusAt(scene: SceneId): string {
  return COPY.sceneHeadlines[scene];
}

export function stateAt(frame: number, caseData: SyntheticCase): TimelineState {
  const runStage = stageAtFrame(frame);
  const run = runAtStage(caseData, runStage);
  const scene = sceneAt(runStage);
  const entityProtection = entityProtectionAt(frame);

  return {
    frame,
    runStage,
    scene,
    pointer: pointerAt(frame),
    stageScrollY: -80 * progress(frame, 135, 179),
    summarySelected: frame >= 125,
    detectionProgress: progress(frame, 0, 134),
    entityProtection,
    protectionProgress:
      (entityProtection.name + entityProtection.contact + entityProtection.account) / 3,
    route: routeAt(frame),
    inspection: inspectionAt(frame, run.outcome === 'VERIFIED'),
    resultRevealProgress: run.outcome === 'VERIFIED' ? progress(frame, 743, 790) : 0,
    accessibilityStatus: accessibilityStatusAt(scene),
    run,
  };
}

export function stateSignature(state: TimelineState): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(state).filter(([key]) => key !== 'frame')),
  );
}
