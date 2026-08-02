import type {FpgRecordingV1} from '../demo/recording';
import type {TimelineState} from '../demo/state';
import {stateSignature} from '../demo/timeline';

type FontLoader = {
  ready: PromiseLike<unknown>;
  load(description: string): PromiseLike<readonly unknown[]>;
  check(description: string): boolean;
};

type RecordingViewport = {
  width: number;
  height: number;
  devicePixelRatio: number;
};

export type RecordingBridgeDependencies = {
  ready: Promise<void>;
  commitFrame(frame: number): Promise<void>;
  getState(): TimelineState;
  getStage(): HTMLElement | null;
  fonts: FontLoader;
  getViewport(): RecordingViewport;
  requestAnimationFrame(callback: FrameRequestCallback): number;
};

function assertRecordingFrame(frame: number): void {
  if (!Number.isInteger(frame) || frame < 0 || frame > 899) {
    throw new RangeError('Recording frame must be an integer from 0 to 899');
  }
}

function nextPaint(requestFrame: RecordingBridgeDependencies['requestAnimationFrame']): Promise<void> {
  return new Promise((resolve) => {
    requestFrame(() => resolve());
  });
}

const REGULAR_FONT = '400 16px "Privacy Demo Sans"';
const BOLD_FONT = '700 16px "Privacy Demo Sans"';

async function requireRecordingFonts(fonts: FontLoader): Promise<void> {
  await fonts.ready;
  const regular = await fonts.load(REGULAR_FONT);
  const bold = await fonts.load(BOLD_FONT);
  if (
    regular.length === 0 ||
    bold.length === 0 ||
    !fonts.check(REGULAR_FONT) ||
    !fonts.check(BOLD_FONT)
  ) {
    throw new Error('Recording fonts are not ready');
  }
}

function requireRecordingEnvironment(
  getStage: RecordingBridgeDependencies['getStage'],
  getViewport: RecordingBridgeDependencies['getViewport'],
): HTMLElement {
  const stage = getStage();
  const bounds = stage?.getBoundingClientRect();
  const viewport = getViewport();
  if (
    stage === null ||
    bounds === undefined ||
    bounds.width !== 1_920 ||
    bounds.height !== 1_080 ||
    viewport.width !== 1_920 ||
    viewport.height !== 1_080 ||
    viewport.devicePixelRatio !== 1
  ) {
    throw new Error('Recording stage is not ready');
  }
  return stage;
}

export function createRecordingReadiness(
  dependencies: Pick<
    RecordingBridgeDependencies,
    'ready' | 'getStage' | 'fonts' | 'getViewport' | 'requestAnimationFrame'
  >,
): Promise<void> {
  return (async () => {
    await dependencies.ready;
    await requireRecordingFonts(dependencies.fonts);
    await nextPaint(dependencies.requestAnimationFrame);
    await nextPaint(dependencies.requestAnimationFrame);
    requireRecordingEnvironment(dependencies.getStage, dependencies.getViewport);
  })();
}

export function createRecordingBridge(
  dependencies: RecordingBridgeDependencies,
): FpgRecordingV1 {
  return {
    ready: dependencies.ready,
    getState: dependencies.getState,
    async setFrame(frame) {
      assertRecordingFrame(frame);
      await dependencies.ready;
      await dependencies.commitFrame(frame);
      await requireRecordingFonts(dependencies.fonts);
      await nextPaint(dependencies.requestAnimationFrame);
      await nextPaint(dependencies.requestAnimationFrame);

      const stage = requireRecordingEnvironment(
        dependencies.getStage,
        dependencies.getViewport,
      );
      const state = dependencies.getState();
      if (
        stage.dataset.frame !== String(frame) ||
        state.frame !== frame
      ) {
        throw new Error('Recording stage is not ready');
      }

      return {
        frame,
        stateSignature: stateSignature(state),
        width: 1_920,
        height: 1_080,
        ready: true,
      };
    },
  };
}

export function publishRecordingBridge(
  target: Window,
  bridge: FpgRecordingV1,
  enabled: boolean,
): () => void {
  if (enabled) target.__FPG_RECORDING_V1__ = bridge;
  else delete target.__FPG_RECORDING_V1__;

  return () => {
    if (target.__FPG_RECORDING_V1__ === bridge) delete target.__FPG_RECORDING_V1__;
  };
}
