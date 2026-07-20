import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';

import {
  PlaybackController,
  countdownLabelAt,
  entryPhaseOnLoad,
  frameAt,
  nextStop,
  playableFrameAfter,
  previousStop,
} from '@/demo/playback';
import {createRecordingBridge} from '@/app/recordingBridge';
import {DemoRuntime, type DemoRuntimeView} from '@/app/DemoRuntime';
import {isExactRecordingMode, type FpgRecordingV1} from '@/demo/recording';
import {validateFixture, type ValidatedFixture} from '@/demo/schema';
import {stateAt} from '@/demo/timeline';

let fixture: ValidatedFixture;

afterEach(() => cleanup());

beforeAll(async () => {
  fixture = await validateFixture(
    readFileSync(resolve('src/demo/fixtures/synthetic-consultation-v1.json'), 'utf8'),
  );
});

describe('logical playback contract', () => {
  it('maps logical media time to the 900-frame automatic story', () => {
    expect(frameAt(0)).toBe(0);
    expect(frameAt(29_966.67)).toBe(899);
    expect(frameAt(30_000)).toBe(899);
    expect(frameAt(Number.POSITIVE_INFINITY)).toBe(899);
    expect(() => frameAt(-1)).toThrow(RangeError);
  });

  it('starts idle and exposes an exact three-second countdown', () => {
    expect(entryPhaseOnLoad()).toBe('idle');
    expect(countdownLabelAt(0)).toBe('3');
    expect(countdownLabelAt(999.99)).toBe('3');
    expect(countdownLabelAt(1_000)).toBe('2');
    expect(countdownLabelAt(2_000)).toBe('1');
    expect(countdownLabelAt(2_999.99)).toBe('1');
    expect(countdownLabelAt(3_000)).toBeNull();
    expect(() => countdownLabelAt(-1)).toThrow(RangeError);
  });

  it('navigates only between reviewed manual stops', () => {
    expect(nextStop(855)).toBe(945);
    expect(nextStop(945)).toBe(945);
    expect(previousStop(945)).toBe(855);
    expect(previousStop(45)).toBe(45);
    expect(playableFrameAfter(899, 1_000)).toBe(899);
    expect(playableFrameAfter(750, 1_000)).toBe(780);
  });
});

describe('PlaybackController', () => {
  it('waits for a click, counts down, plays, and completes without crossing frame 899', () => {
    const onChange = vi.fn();
    const controller = new PlaybackController({onChange});

    expect(controller.getState()).toMatchObject({phase: 'idle', frame: 0});
    controller.start(10_000);
    expect(controller.getState()).toMatchObject({phase: 'countdown', countdownLabel: '3'});
    controller.advance(11_000);
    expect(controller.getState()).toMatchObject({phase: 'countdown', countdownLabel: '2'});
    controller.advance(12_000);
    expect(controller.getState()).toMatchObject({phase: 'countdown', countdownLabel: '1'});
    controller.advance(13_000);
    expect(controller.getState()).toMatchObject({phase: 'playing', frame: 0, elapsedMs: 0});
    controller.advance(42_999.99);
    expect(controller.getState()).toMatchObject({phase: 'playing', frame: 899});
    controller.advance(43_000);
    expect(controller.getState()).toMatchObject({phase: 'complete', frame: 899, elapsedMs: 30_000});
    expect(onChange).toHaveBeenCalled();
  });

  it('shows frame zero even when the first paint after countdown is delayed', () => {
    const controller = new PlaybackController();
    controller.start(10_000);

    expect(controller.advance(13_250)).toMatchObject({
      phase: 'playing',
      frame: 0,
      elapsedMs: 0,
    });
    expect(controller.advance(14_250)).toMatchObject({phase: 'playing', frame: 30});
  });

  it('replays through the same countdown and never auto resumes after visibility loss', () => {
    const controller = new PlaybackController();
    controller.start(0);
    controller.advance(3_000);
    controller.advance(8_000);
    expect(controller.getState()).toMatchObject({phase: 'playing', frame: 150});

    controller.handleVisibilityHidden();
    const paused = controller.getState();
    expect(paused).toMatchObject({phase: 'paused', frame: 150});
    controller.advance(20_000);
    expect(controller.getState()).toEqual(paused);

    controller.resume(20_000);
    controller.advance(21_000);
    expect(controller.getState()).toMatchObject({phase: 'playing', frame: 180});

    controller.replay(30_000);
    expect(controller.getState()).toMatchObject({phase: 'countdown', frame: 0, countdownLabel: '3'});
    controller.handleVisibilityHidden();
    expect(controller.getState()).toMatchObject({phase: 'idle', frame: 0});
  });

  it('uses manual mode for reduced motion and supports reviewed navigation', () => {
    const controller = new PlaybackController({reducedMotion: true});
    controller.start(0);
    expect(controller.getState()).toMatchObject({phase: 'manual', frame: 45});
    controller.resume(500);
    expect(controller.getState()).toMatchObject({phase: 'manual', frame: 45});
    controller.next();
    expect(controller.getState()).toMatchObject({phase: 'manual', frame: 150});
    controller.goTo(945);
    expect(controller.getState()).toMatchObject({phase: 'manual', frame: 945});
    controller.previous();
    expect(controller.getState()).toMatchObject({phase: 'manual', frame: 855});
  });

  it('moves real-user interruption to the nearest reviewed stop and can resume manual playback', () => {
    const controller = new PlaybackController();
    controller.start(0);
    controller.advance(3_000);
    controller.advance(11_200);

    expect(controller.enterManual()).toMatchObject({phase: 'manual', frame: 225});
    expect(controller.resume(20_000)).toMatchObject({phase: 'playing', frame: 225});
    expect(controller.advance(21_000)).toMatchObject({phase: 'playing', frame: 255});

    controller.goTo(945);
    expect(controller.resume(22_000)).toMatchObject({phase: 'manual', frame: 945});
  });

  it('keeps a runtime manual after its environment tightens the motion policy', () => {
    const controller = new PlaybackController();
    controller.start(0);
    controller.advance(3_000);
    controller.advance(8_000);

    expect(controller.requireManualOnly()).toMatchObject({phase: 'manual', frame: 150});
    expect(controller.replay(20_000)).toMatchObject({phase: 'manual', frame: 45});
  });

  it('freezes the exact playing frame when the environment tightens the motion policy', () => {
    const controller = new PlaybackController();
    controller.start(0);
    controller.advance(3_000);
    const playing = controller.advance(3_080);

    expect(playing).toMatchObject({phase: 'playing', frame: 2, elapsedMs: 80});
    expect(controller.requireManualOnly()).toMatchObject({phase: 'manual', frame: 2, elapsedMs: 80});
    expect(controller.advance(10_000)).toMatchObject({phase: 'manual', frame: 2, elapsedMs: 80});
  });
});

describe('recording bridge contract', () => {
  it('recognizes only the exact recording query with no hash', () => {
    expect(isExactRecordingMode({search: '?record=1', hash: ''})).toBe(true);
    expect(isExactRecordingMode({search: '?record=1&x=1', hash: ''})).toBe(false);
    expect(isExactRecordingMode({search: '?RECORD=1', hash: ''})).toBe(false);
    expect(isExactRecordingMode({search: '?record=1', hash: '#frame'})).toBe(false);
  });

  it('commits a frame, loads both fonts, waits two paints, and verifies the stage', async () => {
    let currentState = stateAt(0, fixture);
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
        currentState = stateAt(frame, fixture);
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
    const currentState = stateAt(0, fixture);
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
    const currentState = stateAt(0, fixture);
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
  it('renders idle without advancing and enters manual mode on reduced-motion start', () => {
    render(
      createElement(DemoRuntime, {
        bootstrap: {kind: 'ready', fixture},
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
        bootstrap: {kind: 'ready', fixture},
        children,
      }),
    );
    fireEvent.click(screen.getByRole('button', {name: '시연 시작'}));
    expect(screen.getByTestId('phase')).toHaveTextContent('countdown:0');

    view.rerender(
      createElement(DemoRuntime, {
        bootstrap: {kind: 'ready', fixture},
        reducedMotion: true,
        children,
      }),
    );
    await waitFor(() => expect(screen.getByTestId('phase')).toHaveTextContent('manual:45'));
  });

  it('publishes a fail-closed recording bridge, ignores keys, and commits the same frame', async () => {
    window.history.replaceState(null, '', '/?record=1');
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
          bootstrap: {kind: 'ready', fixture},
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
