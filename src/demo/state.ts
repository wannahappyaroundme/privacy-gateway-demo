import type {RunSnapshot, RunStage} from '../prototype/run';

export type SceneId = 'detect' | 'protect' | 'route' | 'inspect' | 'result';

export type PointerPhase = 'hidden' | 'moving' | 'holding' | 'pressed' | 'released';

export type VirtualPointerState = {
  visible: boolean;
  x: number;
  y: number;
  pressed: boolean;
  phase: PointerPhase;
};

export type EntityProgress = {
  name: number;
  contact: number;
  account: number;
};

export type RouteState = {
  externalState: 'not-shown' | 'blocked';
  internalState: 'not-shown' | 'activating' | 'approved';
  internalProgress: number;
  externalPayloadProgress: 0;
};

export type InspectionState = {
  progress: number;
  complete: boolean;
  disclosureAllowed: boolean;
};

export type TimelineState = {
  frame: number;
  runStage: Exclude<RunStage, 'idle'>;
  scene: SceneId;
  pointer: VirtualPointerState;
  stageScrollY: number;
  summarySelected: boolean;
  detectionProgress: number;
  entityProtection: EntityProgress;
  protectionProgress: number;
  route: RouteState;
  inspection: InspectionState;
  resultRevealProgress: number;
  accessibilityStatus: string;
  run: RunSnapshot;
};
