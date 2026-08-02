import type {TimelineState} from './state';

export type RecordingResult = {
  frame: number;
  stateSignature: string;
  width: 1920;
  height: 1080;
  ready: true;
};

export type FpgRecordingV1 = {
  ready: Promise<void>;
  setFrame(frame: number): Promise<RecordingResult>;
  getState(): TimelineState;
};

export type LocationQuery = Pick<Location, 'search' | 'hash'>;

export const RECORDING_CASE_IDS = [
  'SYN-NORMAL-001',
  'SYN-BLOCK-001',
  'SYN-WITHHOLD-001',
] as const;

export type RecordingCaseId = (typeof RECORDING_CASE_IDS)[number];
export type RecordingSelection =
  | {kind: 'off'}
  | {kind: 'valid'; caseId: RecordingCaseId}
  | {kind: 'invalid'};

export function recordingSelection(location: LocationQuery): RecordingSelection {
  if (location.hash !== '') return location.search.includes('record=1') ? {kind: 'invalid'} : {kind: 'off'};
  if (!location.search.includes('record=1')) return {kind: 'off'};

  const matched = RECORDING_CASE_IDS.find(
    (caseId) => location.search === `?record=1&case=${caseId}`,
  );
  return matched ? {kind: 'valid', caseId: matched} : {kind: 'invalid'};
}

export function isExactRecordingMode(location: LocationQuery): boolean {
  return recordingSelection(location).kind === 'valid';
}

declare global {
  interface Window {
    __FPG_RECORDING_V1__?: FpgRecordingV1;
  }
}
