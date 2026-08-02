import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {afterEach, describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';

import {
  AUTO_DURATION_MS,
  PlaybackController,
  entryPhaseOnLoad,
  frameAt,
  nextStop,
  playableFrameAfter,
  previousStop,
} from '@/demo/playback';
import {createRecordingBridge} from '@/app/recordingBridge';
import {DemoRuntime, type DemoRuntimeView} from '@/app/DemoRuntime';
import {isExactRecordingMode, type FpgRecordingV1} from '@/demo/recording';
import {loadSyntheticCases} from '@/demo/schema';
import {stateAt} from '@/demo/timeline';

const cases = loadSyntheticCases(
  readFileSync(resolve('src/demo/fixtures/synthetic-cases-v2.json'), 'utf8'),
);
const normalCase = cases.find(({caseId}) => caseId === 'SYN-NORMAL-001')!;

afterEach(() => cleanup());

describe('logical playback contract', () => {
  it('maps the product flow to an 8-second 900-frame runtime', () => {
    expect(AUTO_DURATION_MS).toBe(8_000);
    expect(frameAt(0)).toBe(0);
    expect(frameAt(7_999)).toBe(899);
    expect(frameAt(8_000)).toBe(899);
    expect(frameAt(Number.POSITIVE_INFINITY)).toBe(899);
    expect(() => frameAt(-1)).toThrow(RangeError);
  });

  it('starts idle without a countdown', () => {
    expect(entryPhaseOnLoad()).toBe('idle');
    const controller = new PlaybackController();
    expect(controller.start(1_000)).toMatchObject({
      phase: 'playing',
      frame: 0,
      elapsedMs: 0,
      countdownLabel: null,
    });
  });

  it('navigates only between reviewed manual stops', () => {
    expect(nextStop(610)).toBe(790);
    expect(nextStop(790)).toBe(790);
    expect(previousStop(790)).toBe(610);
    expect(previousStop(45)).toBe(45);
    expect(playableFrameAfter(899, 1_000)).toBe(899);
    expect(playableFrameAfter(750, 1_000)).toBe(862);
  });
});

describe('PlaybackController', () => {
  it('waits for a click, plays immediately, and completes without crossing frame 899', () => {
    const onChange = vi.fn();
    const controller = new PlaybackController({onChange});

    expect(controller.getState()).toMatchObject({phase: 'idle', frame: 0});
    controller.start(10_000);
    expect(controller.getState()).toMatchObject({phase: 'playing', frame: 0, countdownLabel: null});
    controller.advance(11_000);
    expect(controller.getState()).toMatchObject({phase: 'playing', frame: 112, elapsedMs: 1_000});
    controller.advance(17_999);
    expect(controller.getState()).toMatchObject({phase: 'playing', frame: 899});
    controller.advance(18_000);
    expect(controller.getState()).toMatchObject({phase: 'complete', frame: 899, elapsedMs: 8_000});
    expect(onChange).toHaveBeenCalled();
  });

  it('advances from the click epoch when the first paint is delayed', () => {
    const controller = new PlaybackController();
    controller.start(10_000);

    expect(controller.advance(13_250)).toMatchObject({
      phase: 'playing',
      frame: 365,
      elapsedMs: 3_250,
    });
    expect(controller.advance(14_250)).toMatchObject({phase: 'playing', frame: 478});
  });

  it('replays immediately and never auto resumes after visibility loss', () => {
    const controller = new PlaybackController();
    controller.start(0);
    controller.advance(4_000);
    expect(controller.getState()).toMatchObject({phase: 'playing', frame: 450});

    controller.handleVisibilityHidden();
    const paused = controller.getState();
    expect(paused).toMatchObject({phase: 'paused', frame: 450});
    controller.advance(20_000);
    expect(controller.getState()).toEqual(paused);

    controller.resume(20_000);
    controller.advance(21_000);
    expect(controller.getState()).toMatchObject({phase: 'playing', frame: 562});

    controller.replay(30_000);
    expect(controller.getState()).toMatchObject({phase: 'playing', frame: 0, countdownLabel: null});
    controller.handleVisibilityHidden();
    expect(controller.getState()).toMatchObject({phase: 'paused', frame: 0});
  });

  it('uses manual mode for reduced motion and supports reviewed navigation', () => {
    const controller = new PlaybackController({reducedMotion: true});
    controller.start(0);
    expect(controller.getState()).toMatchObject({phase: 'manual', frame: 45});
    controller.resume(500);
    expect(controller.getState()).toMatchObject({phase: 'manual', frame: 45});
    controller.next();
    expect(controller.getState()).toMatchObject({phase: 'manual', frame: 180});
    controller.goTo(790);
    expect(controller.getState()).toMatchObject({phase: 'manual', frame: 790});
    controller.previous();
    expect(controller.getState()).toMatchObject({phase: 'manual', frame: 610});
  });

  it('moves real-user interruption to the nearest reviewed stop and can resume manual playback', () => {
    const controller = new PlaybackController();
    controller.start(0);
    controller.advance(3_200);

    expect(controller.enterManual()).toMatchObject({phase: 'manual', frame: 360});
    expect(controller.resume(20_000)).toMatchObject({phase: 'playing', frame: 360});
    expect(controller.advance(20_500)).toMatchObject({phase: 'playing', frame: 416});

    controller.goTo(899);
    expect(controller.resume(22_000)).toMatchObject({phase: 'playing', frame: 899});
  });

  it('keeps a runtime manual after its environment tightens the motion policy', () => {
    const controller = new PlaybackController();
    controller.start(0);
    controller.advance(3_000);

    expect(controller.requireManualOnly()).toMatchObject({phase: 'manual', frame: 337});
    expect(controller.replay(20_000)).toMatchObject({phase: 'manual', frame: 45});
  });

  it('freezes the exact playing frame when the environment tightens the motion policy', () => {
    const controller = new PlaybackController();
    controller.start(0);
    controller.advance(3_000);
    const playing = controller.advance(3_080);

    expect(playing).toMatchObject({phase: 'playing', frame: 346, elapsedMs: 3_080});
    expect(controller.requireManualOnly()).toMatchObject({phase: 'manual', frame: 346, elapsedMs: 3_080});
    expect(controller.advance(10_000)).toMatchObject({phase: 'manual', frame: 346, elapsedMs: 3_080});
  });

  it('finishes at an exact terminal frame and ignores later advancement', () => {
    const controller = new PlaybackController();
    controller.start(1_000);

    expect(controller.finish(180)).toMatchObject({phase: 'complete', frame: 180});
    const complete = controller.getState();
    expect(controller.advance(9_000)).toBe(complete);
    expect(controller.dispatch({type: 'FINISH', frame: 240})).toBe(complete);
  });

  it('keeps terminal frames in manual and reduced-motion runtimes until replay resets', () => {
    const manual = new PlaybackController({manualOnly: true});
    manual.start(0);
    expect(manual.finish(135)).toMatchObject({phase: 'complete', frame: 135});
    expect(manual.advance(1_000)).toMatchObject({phase: 'complete', frame: 135});
    expect(manual.replay(2_000)).toMatchObject({phase: 'manual', frame: 45});

    const reduced = new PlaybackController({reducedMotion: true});
    reduced.start(0);
    expect(reduced.finish(473)).toMatchObject({phase: 'complete', frame: 473});
    expect(reduced.advance(1_000)).toMatchObject({phase: 'complete', frame: 473});
    expect(reduced.replay(2_000)).toMatchObject({phase: 'manual', frame: 45});
  });

  it('preserves timestamp-backward rejection before terminal completion', () => {
    const controller = new PlaybackController();
    controller.start(1_000);
    expect(() => controller.advance(999)).toThrow('Timestamp cannot move backwards');
  });
});

describe('recording bridge contract', () => {
  it('recognizes only the exact recording query with no hash', () => {
    expect(isExactRecordingMode({search: '?record=1&case=SYN-NORMAL-001', hash: ''})).toBe(true);
    expect(isExactRecordingMode({search: '?record=1&case=SYN-BLOCK-001', hash: ''})).toBe(true);
    expect(isExactRecordingMode({search: '?record=1&case=SYN-WITHHOLD-001', hash: ''})).toBe(true);
    expect(isExactRecordingMode({search: '?record=1', hash: ''})).toBe(false);
    expect(isExactRecordingMode({search: '?record=1&case=UNKNOWN', hash: ''})).toBe(false);
    expect(isExactRecordingMode({search: '?record=1&x=1', hash: ''})).toBe(false);
    expect(isExactRecordingMode({search: '?RECORD=1', hash: ''})).toBe(false);
    expect(isExactRecordingMode({search: '?record=1', hash: '#frame'})).toBe(false);
  });

  it('commits a frame, loads both fonts, waits two paints, and verifies the stage', async () => {
    let currentState = stateAt(0, normalCase);
    const order: string[] = [];
    const fonts = {
      ready: Promise.resolve(),
      load: vi.fn(async (description: string) => {
        order.push(`font:${description}`);
        return [{}];
      }),
      check: () => true,
    };
    const stage = document.createElement('main');
    stage.dataset.frame = '0';
    stage.getBoundingClientRect = () => ({width: 1_920, height: 1_080}) as DOMRect;

    const bridge = createRecordingBridge({
      ready: Promise.resolve(),
      commitFrame: async (frame) => {
        currentState = stateAt(frame, normalCase);
        stage.dataset.frame = String(frame);
        order.push(`commit:${frame}`);
      },
      getState: () => currentState,
      getStage: () => stage,
      fonts,
      getViewport: () => ({width: 1_920, height: 1_080, devicePixelRatio: 1}),
      requestAnimationFrame: (callback) => {
        order.push('paint');
        callback(0);
        return 1;
      },
    });

    const result = await bridge.setFrame(750);

    expect(result).toEqual({
      frame: 750,
      stateSignature: expect.any(String),
      width: 1_920,
      height: 1_080,
      ready: true,
    });
    expect(order).toEqual([
      'commit:750',
      'font:400 16px "Privacy Demo Sans"',
      'font:700 16px "Privacy Demo Sans"',
      'paint',
      'paint',
    ]);
    expect(bridge.getState().frame).toBe(750);
  });

  it('fails closed when the stage bounds or committed frame do not match', async () => {
    const stage = document.createElement('main');
    stage.dataset.frame = '0';
    stage.getBoundingClientRect = () => ({width: 1_919, height: 1_080}) as DOMRect;
    const currentState = stateAt(0, normalCase);
    const bridge = createRecordingBridge({
      ready: Promise.resolve(),
      commitFrame: async () => undefined,
      getState: () => currentState,
      getStage: () => stage,
      fonts: {ready: Promise.resolve(), load: async () => [{}], check: () => true},
      getViewport: () => ({width: 1_920, height: 1_080, devicePixelRatio: 1}),
      requestAnimationFrame: (callback) => {
        callback(0);
        return 1;
      },
    });

    await expect(bridge.setFrame(45)).rejects.toThrow('Recording stage is not ready');
  });

  it('fails closed when a required font or exact recording viewport is unavailable', async () => {
    const stage = document.createElement('main');
    stage.dataset.frame = '0';
    stage.getBoundingClientRect = () => ({width: 1_920, height: 1_080}) as DOMRect;
    const currentState = stateAt(0, normalCase);
    const bridge = createRecordingBridge({
      ready: Promise.resolve(),
      commitFrame: async () => undefined,
      getState: () => currentState,
      getStage: () => stage,
      fonts: {ready: Promise.resolve(), load: async () => [], check: () => false},
      getViewport: () => ({width: 1_920, height: 1_080, devicePixelRatio: 2}),
      requestAnimationFrame: (callback) => {
        callback(0);
        return 1;
      },
    });

    await expect(bridge.setFrame(0)).rejects.toThrow('Recording fonts are not ready');
  });
});

describe('DemoRuntime layering', () => {
  it('removes the previous case snapshot and resets playback when selection changes', async () => {
    const blockedCase = cases.find(({caseId}) => caseId === 'SYN-BLOCK-001')!;
    const children = ({runtime, timeline, actions}: DemoRuntimeView) =>
      createElement(
        'div',
        null,
        createElement('output', {'data-testid': 'phase'}, `${runtime.phase}:${runtime.frame}`),
        createElement('output', {'data-testid': 'case'}, timeline?.run.caseId ?? 'none'),
        createElement('button', {type: 'button', onClick: () => actions.goTo(360)}, '프레임 이동'),
      );
    const view = render(
      createElement(DemoRuntime, {
        bootstrap: {kind: 'ready', cases, selectedCaseId: normalCase.caseId},
        children,
      }),
    );
    fireEvent.click(screen.getByRole('button', {name: '프레임 이동'}));
    expect(screen.getByTestId('phase')).toHaveTextContent('manual:360');
    expect(screen.getByTestId('case')).toHaveTextContent(normalCase.caseId);

    view.rerender(
      createElement(DemoRuntime, {
        bootstrap: {kind: 'ready', cases, selectedCaseId: blockedCase.caseId},
        children,
      }),
    );

    await waitFor(() => expect(screen.getByTestId('phase')).toHaveTextContent('idle:0'));
    await waitFor(() => expect(screen.getByTestId('case')).toHaveTextContent(blockedCase.caseId));
    expect(screen.getByTestId('case')).not.toHaveTextContent(normalCase.caseId);
  });

  it('uses one injected clock instead of the animation-frame timestamp', () => {
    const callbacks: FrameRequestCallback[] = [];
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callbacks.push(callback);
        return callbacks.length;
      });
    const cancelFrame = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);
    const clock = vi
      .fn<() => number>()
      .mockReturnValueOnce(100.2)
      .mockReturnValueOnce(100.3);

    try {
      render(
        createElement(DemoRuntime, {
          bootstrap: {kind: 'ready', cases, selectedCaseId: normalCase.caseId},
          clock,
          children: ({runtime, actions}: DemoRuntimeView) =>
            createElement(
              'div',
              null,
              createElement('output', {'data-testid': 'phase'}, `${runtime.phase}:${runtime.frame}`),
              createElement('button', {type: 'button', onClick: actions.start}, 'AI 상담 요약 만들기'),
            ),
        }),
      );

      fireEvent.click(screen.getByRole('button', {name: 'AI 상담 요약 만들기'}));
      expect(callbacks).toHaveLength(1);
      expect(() => act(() => callbacks.shift()!(100.1))).not.toThrow();
      expect(clock).toHaveBeenCalledTimes(2);
    } finally {
      cleanup();
      requestFrame.mockRestore();
      cancelFrame.mockRestore();
    }
  });

  it('renders idle without advancing and enters manual mode on reduced-motion start', () => {
    render(
      createElement(DemoRuntime, {
        bootstrap: {kind: 'ready', cases, selectedCaseId: normalCase.caseId},
        reducedMotion: true,
        children: ({runtime, actions}: DemoRuntimeView) =>
          createElement(
            'div',
            null,
            createElement('output', {'data-testid': 'phase'}, `${runtime.phase}:${runtime.frame}`),
            createElement('button', {type: 'button', onClick: actions.start}, '시연 시작'),
          ),
      }),
    );

    expect(screen.getByTestId('phase')).toHaveTextContent('manual:45');
    fireEvent.keyDown(window, {key: ' '});
    expect(screen.getByTestId('phase')).toHaveTextContent('manual:45');
    fireEvent.click(screen.getByRole('button', {name: '시연 시작'}));
    expect(screen.getByTestId('phase')).toHaveTextContent('manual:45');
    cleanup();
  });

  it('tightens an active React runtime when reduced motion changes', async () => {
    const children = ({runtime, actions}: DemoRuntimeView) =>
      createElement(
        'div',
        null,
        createElement('output', {'data-testid': 'phase'}, `${runtime.phase}:${runtime.frame}`),
        createElement('button', {type: 'button', onClick: actions.start}, '시연 시작'),
      );
    const view = render(
      createElement(DemoRuntime, {
        bootstrap: {kind: 'ready', cases, selectedCaseId: normalCase.caseId},
        children,
      }),
    );
    fireEvent.click(screen.getByRole('button', {name: '시연 시작'}));
    expect(screen.getByTestId('phase')).toHaveTextContent('playing:0');

    view.rerender(
      createElement(DemoRuntime, {
        bootstrap: {kind: 'ready', cases, selectedCaseId: normalCase.caseId},
        reducedMotion: true,
        children,
      }),
    );
    await waitFor(() => expect(screen.getByTestId('phase')).toHaveTextContent('manual:0'));
  });

  it('publishes a fail-closed recording bridge, ignores keys, and commits the same frame', async () => {
    window.history.replaceState(null, '', '/?record=1&case=SYN-NORMAL-001');
    const bounds = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({width: 1_920, height: 1_080} as DOMRect);
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    Object.defineProperties(window, {
      innerWidth: {configurable: true, value: 1_920},
      innerHeight: {configurable: true, value: 1_080},
      devicePixelRatio: {configurable: true, value: 1},
    });
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        ready: Promise.resolve(),
        load: async () => [{}],
        check: () => true,
      },
    });

    try {
      render(
        createElement(DemoRuntime, {
          bootstrap: {kind: 'ready', cases, selectedCaseId: normalCase.caseId},
          children: ({runtime, timeline}: DemoRuntimeView) =>
            createElement(
              'main',
              {'data-testid': 'demo-stage', 'data-frame': timeline?.frame},
              createElement('output', {'data-testid': 'phase'}, `${runtime.phase}:${runtime.frame}`),
            ),
        }),
      );

      const bridge = window.__FPG_RECORDING_V1__;
      expect(bridge).toBeDefined();
      await act(async () => bridge!.ready);
      fireEvent.keyDown(window, {key: 'ArrowRight'});
      expect(screen.getByTestId('phase')).toHaveTextContent('idle:0');

      let framePromise: ReturnType<FpgRecordingV1['setFrame']> | undefined;
      await act(async () => {
        framePromise = bridge!.setFrame(0);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      await expect(framePromise).resolves.toMatchObject({frame: 0, ready: true});
      expect(screen.getByTestId('phase')).toHaveTextContent('manual:0');
    } finally {
      cleanup();
      bounds.mockRestore();
      requestFrame.mockRestore();
      window.history.replaceState(null, '', '/');
    }
  });
});
