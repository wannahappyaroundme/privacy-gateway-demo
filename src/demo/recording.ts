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

export function isExactRecordingMode(location: LocationQuery): boolean {
  return location.search === '?record=1' && location.hash === '';
}

declare global {
  interface Window {
    __FPG_RECORDING_V1__?: FpgRecordingV1;
  }
}
