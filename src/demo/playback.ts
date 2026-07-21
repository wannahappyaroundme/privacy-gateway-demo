import {MANUAL_STOPS} from './timeline';

export const AUTO_END_FRAME = 899;
export const AUTO_DURATION_MS = 22_000;
export const COUNTDOWN_DURATION_MS = 3_000;

export type EntryPhase =
  | 'idle'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'complete'
  | 'manual';

export type RuntimeState = Readonly<{
  phase: EntryPhase;
  frame: number;
  elapsedMs: number;
  countdownLabel: '3' | '2' | '1' | null;
}>;

export type DemoAction =
  | {type: 'START_DEMO'; now: number}
  | {type: 'ADVANCE'; now: number}
  | {type: 'PAUSE'}
  | {type: 'RESUME'; now: number}
  | {type: 'REPLAY'; now: number}
  | {type: 'VISIBILITY_HIDDEN'}
  | {type: 'ENTER_MANUAL'}
  | {type: 'GO_TO'; frame: number}
  | {type: 'NEXT'}
  | {type: 'PREVIOUS'};

export type PlaybackControllerOptions = {
  reducedMotion?: boolean;
  manualOnly?: boolean;
  onChange?: (state: RuntimeState) => void;
};

const INITIAL_STATE: RuntimeState = Object.freeze({
  phase: 'idle',
  frame: 0,
  elapsedMs: 0,
  countdownLabel: null,
});

function assertTimestamp(value: number): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError('Timestamp must be finite and non-negative');
}

function assertManualFrame(frame: number): void {
  if (!Number.isInteger(frame) || frame < 0 || frame > 989) {
    throw new RangeError('Manual frame must be an integer from 0 to 989');
  }
}

function freezeState(state: RuntimeState): RuntimeState {
  return Object.freeze({...state});
}

export function entryPhaseOnLoad(): 'idle' {
  return 'idle';
}

export function countdownLabelAt(elapsedMs: number): '3' | '2' | '1' | null {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new RangeError('Countdown time must be finite and non-negative');
  }
  if (elapsedMs < 1_000) return '3';
  if (elapsedMs < 2_000) return '2';
  if (elapsedMs < COUNTDOWN_DURATION_MS) return '1';
  return null;
}

export function frameAt(mediaTimeMs: number): number {
  if (Number.isNaN(mediaTimeMs) || mediaTimeMs < 0) {
    throw new RangeError('Media time must be non-negative');
  }
  if (!Number.isFinite(mediaTimeMs) || mediaTimeMs >= AUTO_DURATION_MS) return AUTO_END_FRAME;
  return Math.min(
    AUTO_END_FRAME,
    Math.floor((mediaTimeMs * (AUTO_END_FRAME + 1)) / AUTO_DURATION_MS),
  );
}

export function playableFrameAfter(frame: number, deltaMs: number): number {
  if (!Number.isInteger(frame) || frame < 0 || frame > AUTO_END_FRAME) {
    throw new RangeError('Playable frame must be an integer from 0 to 899');
  }
  if (Number.isNaN(deltaMs) || deltaMs < 0) throw new RangeError('Delta must be non-negative');
  if (!Number.isFinite(deltaMs)) return AUTO_END_FRAME;
  return Math.min(
    AUTO_END_FRAME,
    frame + Math.floor((deltaMs * (AUTO_END_FRAME + 1)) / AUTO_DURATION_MS),
  );
}

export function nextStop(frame: number): number {
  assertManualFrame(frame);
  return MANUAL_STOPS.find((stop) => stop > frame) ?? MANUAL_STOPS.at(-1)!;
}

export function previousStop(frame: number): number {
  assertManualFrame(frame);
  return [...MANUAL_STOPS].reverse().find((stop) => stop < frame) ?? MANUAL_STOPS[0];
}

export function nearestStopAtOrBefore(frame: number): number {
  assertManualFrame(frame);
  return [...MANUAL_STOPS].reverse().find((stop) => stop <= frame) ?? MANUAL_STOPS[0];
}

export class PlaybackController {
  #manualOnly: boolean;
  readonly #onChange?: (state: RuntimeState) => void;
  #state: RuntimeState = INITIAL_STATE;
  #countdownEpoch: number | null = null;
  #playbackEpoch: number | null = null;

  constructor(options: PlaybackControllerOptions = {}) {
    this.#manualOnly = Boolean(options.manualOnly || options.reducedMotion);
    this.#onChange = options.onChange;
  }

  getState(): RuntimeState {
    return this.#state;
  }

  dispatch(action: DemoAction): RuntimeState {
    switch (action.type) {
      case 'START_DEMO':
        return this.start(action.now);
      case 'ADVANCE':
        return this.advance(action.now);
      case 'PAUSE':
        return this.pause();
      case 'RESUME':
        return this.resume(action.now);
      case 'REPLAY':
        return this.replay(action.now);
      case 'VISIBILITY_HIDDEN':
        return this.handleVisibilityHidden();
      case 'ENTER_MANUAL':
        return this.enterManual();
      case 'GO_TO':
        return this.goTo(action.frame);
      case 'NEXT':
        return this.next();
      case 'PREVIOUS':
        return this.previous();
    }
  }

  start(now: number): RuntimeState {
    assertTimestamp(now);
    if (this.#manualOnly) return this.#set({phase: 'manual', frame: 45, elapsedMs: 0, countdownLabel: null});
    this.#countdownEpoch = null;
    this.#playbackEpoch = now;
    return this.#set({phase: 'playing', frame: 0, elapsedMs: 0, countdownLabel: null});
  }

  advance(now: number): RuntimeState {
    assertTimestamp(now);
    if (this.#state.phase === 'countdown' && this.#countdownEpoch !== null) {
      const elapsed = now - this.#countdownEpoch;
      if (elapsed < 0) throw new RangeError('Timestamp cannot move backwards');
      const label = countdownLabelAt(elapsed);
      if (label !== null) {
        return this.#set({...this.#state, countdownLabel: label});
      }
      this.#playbackEpoch = now;
      this.#countdownEpoch = null;
    }

    if (this.#state.phase === 'countdown' || this.#state.phase === 'playing') {
      if (this.#playbackEpoch === null) return this.#state;
      const elapsedMs = now - this.#playbackEpoch;
      if (elapsedMs < 0) throw new RangeError('Timestamp cannot move backwards');
      if (elapsedMs >= AUTO_DURATION_MS) {
        this.#playbackEpoch = null;
        return this.#set({phase: 'complete', frame: AUTO_END_FRAME, elapsedMs: AUTO_DURATION_MS, countdownLabel: null});
      }
      return this.#set({phase: 'playing', frame: frameAt(elapsedMs), elapsedMs, countdownLabel: null});
    }

    return this.#state;
  }

  pause(): RuntimeState {
    if (this.#state.phase !== 'playing') return this.#state;
    this.#playbackEpoch = null;
    return this.#set({...this.#state, phase: 'paused'});
  }

  resume(now: number): RuntimeState {
    assertTimestamp(now);
    if (this.#manualOnly) return this.#state;
    if (
      this.#state.phase !== 'paused' &&
      !(this.#state.phase === 'manual' && this.#state.frame <= AUTO_END_FRAME)
    ) {
      return this.#state;
    }
    this.#playbackEpoch = now - this.#state.elapsedMs;
    return this.#set({...this.#state, phase: 'playing'});
  }

  replay(now: number): RuntimeState {
    return this.start(now);
  }

  handleVisibilityHidden(): RuntimeState {
    if (this.#state.phase === 'countdown') {
      this.#countdownEpoch = null;
      this.#playbackEpoch = null;
      return this.#set(INITIAL_STATE);
    }
    return this.pause();
  }

  goTo(frame: number): RuntimeState {
    assertManualFrame(frame);
    this.#countdownEpoch = null;
    this.#playbackEpoch = null;
    return this.#set({
      phase: 'manual',
      frame,
      elapsedMs: Math.min(
        AUTO_DURATION_MS,
        (frame * AUTO_DURATION_MS) / (AUTO_END_FRAME + 1),
      ),
      countdownLabel: null,
    });
  }

  enterManual(): RuntimeState {
    return this.goTo(nearestStopAtOrBefore(this.#state.frame));
  }

  requireManualOnly(): RuntimeState {
    this.#manualOnly = true;
    if (this.#state.phase === 'playing' || this.#state.phase === 'paused') {
      this.#countdownEpoch = null;
      this.#playbackEpoch = null;
      return this.#set({...this.#state, phase: 'manual', countdownLabel: null});
    }
    return this.enterManual();
  }

  next(): RuntimeState {
    return this.goTo(nextStop(this.#state.frame));
  }

  previous(): RuntimeState {
    return this.goTo(previousStop(this.#state.frame));
  }

  #set(next: RuntimeState): RuntimeState {
    const frozen = freezeState(next);
    if (
      frozen.phase === this.#state.phase &&
      frozen.frame === this.#state.frame &&
      frozen.elapsedMs === this.#state.elapsedMs &&
      frozen.countdownLabel === this.#state.countdownLabel
    ) {
      return this.#state;
    }
    this.#state = frozen;
    this.#onChange?.(frozen);
    return frozen;
  }
}
