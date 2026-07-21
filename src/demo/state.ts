import type {ValidatedFixture} from './schema';

export type SceneId =
  | 'overview'
  | 'gap'
  | 'detect'
  | 'protect'
  | 'route'
  | 'inspect'
  | 'result'
  | 'finish'
  | 'withheld';

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

export type VerifiedField = Readonly<ValidatedFixture['verifiedResult'][number]>;

export type TimelineResult =
  | null
  | {kind: 'verified'; fields: readonly VerifiedField[]}
  | {kind: 'withheld'; reason: string; helpExpanded: boolean};

export type TimelineState = {
  frame: number;
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
  result: TimelineResult;
};
