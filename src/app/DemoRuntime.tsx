import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {SyntheticCase} from '../prototype/contracts';
import type {RunOutcome} from '../prototype/run';
import {
  PlaybackController,
  type RuntimeState,
} from '../demo/playback';
import {isExactRecordingMode} from '../demo/recording';
import type {TimelineState} from '../demo/state';
import {stateAt} from '../demo/timeline';
import {
  createRecordingBridge,
  createRecordingReadiness,
  publishRecordingBridge,
} from './recordingBridge';

export type BootstrapState =
  | {kind: 'loading'}
  | {kind: 'empty'}
  | {kind: 'invalid'; rule: string}
  | {kind: 'ready'; cases: readonly SyntheticCase[]; selectedCaseId: string};

export type RuntimeActions = {
  start(): void;
  pause(): void;
  resume(): void;
  replay(): void;
  manual(): void;
  previous(): void;
  next(): void;
  goTo(frame: number): void;
};

export type DemoRuntimeView = {
  bootstrap: BootstrapState;
  runtime: RuntimeState;
  timeline: TimelineState | null;
  recordingMode: boolean;
  actions: RuntimeActions;
};

export type DemoRuntimeProps = {
  bootstrap: BootstrapState;
  reducedMotion?: boolean;
  manualOnly?: boolean;
  recordingReady?: Promise<void>;
  clock?: () => number;
  children(view: DemoRuntimeView): ReactNode;
};

const READY = Promise.resolve();
const PERFORMANCE_CLOCK = () => performance.now();

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest('button, a, input, select, textarea, summary, [contenteditable="true"]') !== null;
}

function isTerminalOutcome(outcome: RunOutcome): boolean {
  return outcome === 'VERIFIED' ||
    outcome === 'REQUEST_BLOCKED_UNSUPPORTED' ||
    outcome === 'RUN_FAILED' ||
    outcome.startsWith('RESPONSE_WITHHELD_');
}

export function DemoRuntime({
  bootstrap,
  reducedMotion = false,
  manualOnly = false,
  recordingReady = READY,
  clock = PERFORMANCE_CLOCK,
  children,
}: DemoRuntimeProps) {
  const [controller] = useState(
    () => new PlaybackController({reducedMotion, manualOnly}),
  );
  const [runtime, setRuntime] = useState<RuntimeState>(() =>
    manualOnly || reducedMotion
      ? controller.requireManualOnly()
      : controller.getState(),
  );
  const [recordingCommit, setRecordingCommit] = useState(0);
  const recordingMode =
    typeof window !== 'undefined' && isExactRecordingMode(window.location);

  const selectedCase = bootstrap.kind === 'ready'
    ? bootstrap.cases.find(({caseId}) => caseId === bootstrap.selectedCaseId) ?? null
    : null;
  const [activeCaseId, setActiveCaseId] = useState(selectedCase?.caseId ?? null);
  const timeline = selectedCase !== null && activeCaseId === selectedCase.caseId
    ? stateAt(runtime.frame, selectedCase)
    : null;
  const timelineRef = useRef<TimelineState | null>(null);

  const pendingCommit = useRef<{
    frame: number;
    resolve(): void;
  } | null>(null);

  useLayoutEffect(() => {
    timelineRef.current = timeline;
    const pending = pendingCommit.current;
    if (pending !== null && timeline?.frame === pending.frame) {
      pendingCommit.current = null;
      pending.resolve();
    }
  }, [recordingCommit, timeline]);

  useLayoutEffect(() => {
    const nextCaseId = selectedCase?.caseId ?? null;
    if (nextCaseId === activeCaseId) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setRuntime(controller.reset());
      setActiveCaseId(nextCaseId);
    });
    return () => {
      active = false;
    };
  }, [activeCaseId, controller, selectedCase]);

  useLayoutEffect(() => {
    if (
      timeline !== null &&
      runtime.phase !== 'complete' &&
      isTerminalOutcome(timeline.run.outcome)
    ) {
      let active = true;
      queueMicrotask(() => {
        if (active) setRuntime(controller.finish(runtime.frame));
      });
      return () => {
        active = false;
      };
    }
  }, [controller, runtime.frame, runtime.phase, timeline]);

  const actions = useMemo<RuntimeActions>(
    () => ({
      start: () => setRuntime(controller.start(clock())),
      pause: () => setRuntime(controller.pause()),
      resume: () => setRuntime(controller.resume(clock())),
      replay: () => setRuntime(controller.replay(clock())),
      manual: () => setRuntime(controller.enterManual()),
      previous: () => setRuntime(controller.previous()),
      next: () => setRuntime(controller.next()),
      goTo: (frame) => setRuntime(controller.goTo(frame)),
    }),
    [clock, controller],
  );

  useEffect(() => {
    if (recordingMode || (runtime.phase !== 'countdown' && runtime.phase !== 'playing')) {
      return;
    }
    let requestId = 0;
    const tick = () => {
      const next = controller.advance(clock());
      setRuntime(next);
      if (next.phase === 'countdown' || next.phase === 'playing') {
        requestId = requestAnimationFrame(tick);
      }
    };
    requestId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestId);
  }, [clock, controller, recordingMode, runtime.phase]);

  useEffect(() => {
    if (recordingMode || (!manualOnly && !reducedMotion)) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setRuntime(controller.requireManualOnly());
    });
    return () => {
      active = false;
    };
  }, [controller, manualOnly, recordingMode, reducedMotion]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) setRuntime(controller.handleVisibilityHidden());
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [controller]);

  useEffect(() => {
    if (recordingMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) return;
      let handled = true;
      if (event.key === ' ') {
        if (controller.getState().phase === 'playing') actions.manual();
        else if (
          controller.getState().phase === 'paused' ||
          (controller.getState().phase === 'manual' && !manualOnly && !reducedMotion)
        ) {
          actions.resume();
        }
        else handled = false;
      } else if (event.key === 'ArrowLeft') {
        if (controller.getState().phase === 'playing') actions.manual();
        else actions.previous();
      } else if (event.key === 'ArrowRight') {
        if (controller.getState().phase === 'playing') actions.manual();
        else actions.next();
      } else if (event.key === 'Home') {
        actions.goTo(45);
      } else if (event.key === 'End') {
        actions.goTo(855);
      } else {
        handled = false;
      }
      if (handled) event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actions, controller, manualOnly, recordingMode, reducedMotion]);

  useEffect(() => {
    if (recordingMode) return;
    const onPointerDown = (event: PointerEvent) => {
      if (
        controller.getState().phase === 'playing' &&
        !isInteractiveTarget(event.target)
      ) {
        actions.manual();
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [actions, controller, recordingMode]);

  useLayoutEffect(() => {
    if (!recordingMode || bootstrap.kind !== 'ready' || timelineRef.current === null) return;
    const fonts = document.fonts;
    const getStage = () =>
      document.querySelector<HTMLElement>('[data-testid="demo-stage"]');
    const getViewport = () => ({
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    });
    const requestFrame = window.requestAnimationFrame.bind(window);
    const ready = createRecordingReadiness({
      ready: recordingReady,
      getStage,
      fonts,
      getViewport,
      requestAnimationFrame: requestFrame,
    });
    const bridge = createRecordingBridge({
      ready,
      commitFrame: (frame) =>
        new Promise((resolve) => {
          pendingCommit.current = {frame, resolve};
          setRuntime(controller.goTo(frame));
          setRecordingCommit((value) => value + 1);
        }),
      getState: () => {
        const state = timelineRef.current;
        if (state === null) throw new Error('Recording state is not ready');
        return state;
      },
      getStage,
      fonts,
      getViewport,
      requestAnimationFrame: requestFrame,
    });
    return publishRecordingBridge(window, bridge, true);
  }, [
    bootstrap.kind,
    controller,
    recordingMode,
    recordingReady,
    selectedCase?.caseId,
    timeline?.run.caseId,
  ]);

  return children({bootstrap, runtime, timeline, recordingMode, actions});
}
