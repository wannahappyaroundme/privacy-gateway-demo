import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {beforeAll, describe, expect, it} from 'vitest';

import type {ValidatedFixture} from '@/demo/schema';
import {validateFixture} from '@/demo/schema';
import {
  HOLD_RANGES,
  MANUAL_STOPS,
  SUMMARIZE_BUTTON_BOUNDS,
  stateAt,
  stateSignature,
} from '@/demo/timeline';

const rawFixture = readFileSync(
  resolve('src/demo/fixtures/synthetic-consultation-v1.json'),
  'utf8',
);

let fixture: ValidatedFixture;

beforeAll(async () => {
  fixture = await validateFixture(rawFixture);
});

describe('pure 990-frame timeline', () => {
  for (let frame = 0; frame <= 989; frame += 1) {
    it(`returns deterministic valid state for frame ${frame}`, () => {
      const first = stateAt(frame, fixture);
      const second = stateAt(frame, fixture);

      expect(first.frame).toBe(frame);
      expect(first).toEqual(second);
    });
  }

  it.each([-1, 990, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NaN])(
    'rejects invalid frame %s',
    (frame) => {
      expect(() => stateAt(frame, fixture)).toThrow('Frame must be an integer from 0 to 989');
    },
  );

  it.each([0.1, 44.5, 899.9])('rejects non-integer frame %s', (frame) => {
    expect(() => stateAt(frame, fixture)).toThrow('Frame must be an integer from 0 to 989');
  });

  it('exposes the exact approved manual stops', () => {
    expect(MANUAL_STOPS).toEqual([45, 150, 225, 360, 480, 610, 750, 855, 945]);
  });

  it.each([
    [0, 'overview'],
    [89, 'overview'],
    [90, 'gap'],
    [179, 'gap'],
    [180, 'detect'],
    [299, 'detect'],
    [300, 'protect'],
    [419, 'protect'],
    [420, 'route'],
    [539, 'route'],
    [540, 'inspect'],
    [689, 'inspect'],
    [690, 'result'],
    [809, 'result'],
    [810, 'finish'],
    [899, 'finish'],
    [900, 'withheld'],
    [989, 'withheld'],
  ] as const)('maps boundary frame %i to %s', (frame, scene) => {
    expect(stateAt(frame, fixture).scene).toBe(scene);
  });

  it('keeps one render signature throughout every approved hold', () => {
    for (const [start, end] of HOLD_RANGES) {
      const expected = stateSignature(stateAt(start, fixture));
      for (let frame = start + 1; frame < end; frame += 1) {
        expect(stateSignature(stateAt(frame, fixture)), `hold [${start}, ${end}) at ${frame}`).toBe(
          expected,
        );
      }
    }
  });

  it('never exposes a verified or withheld result before inspection', () => {
    for (let frame = 0; frame <= 689; frame += 1) {
      const state = stateAt(frame, fixture);
      expect(state.result).toBeNull();
      expect(state.inspection.complete).toBe(false);
      expect(state.inspection.disclosureAllowed).toBe(false);
    }
  });

  it('returns the exact verified result only for the success window', () => {
    for (let frame = 690; frame <= 899; frame += 1) {
      const state = stateAt(frame, fixture);
      expect(state.result).toEqual({kind: 'verified', fields: fixture.verifiedResult});
      expect(Object.keys(state.result ?? {}).sort()).toEqual(['fields', 'kind']);
      expect(state.inspection.complete).toBe(true);
      expect(state.inspection.disclosureAllowed).toBe(true);
      expect(state.resultRevealProgress).toBeGreaterThanOrEqual(0);
      expect(state.resultRevealProgress).toBeLessThanOrEqual(1);
    }
  });

  it('isolates verified fields from fixture and later timeline states', () => {
    const first = stateAt(750, fixture);
    expect(first.result?.kind).toBe('verified');
    if (first.result?.kind !== 'verified') throw new Error('Expected verified result');

    const originalValue = fixture.verifiedResult[0].value;
    const mutableField = first.result.fields[0] as {value: string};
    Reflect.set(mutableField, 'value', '변경 시도');

    const later = stateAt(750, fixture);
    expect(later.result?.kind).toBe('verified');
    if (later.result?.kind !== 'verified') throw new Error('Expected verified result');

    expect(fixture.verifiedResult[0].value).toBe(originalValue);
    expect(first.result.fields[0].value).toBe(originalValue);
    expect(later.result.fields[0].value).toBe(originalValue);
    expect(Object.isFrozen(first.result.fields)).toBe(true);
    expect(Object.isFrozen(first.result.fields[0])).toBe(true);
    expect(first.result.fields).not.toBe(fixture.verifiedResult);
    expect(first.result.fields[0]).not.toBe(fixture.verifiedResult[0]);
    expect(later.result.fields[0]).not.toBe(first.result.fields[0]);
  });

  it('returns the exact withheld state only for the block window', () => {
    for (let frame = 900; frame <= 989; frame += 1) {
      const state = stateAt(frame, fixture);
      expect(state.result).toEqual({
        kind: 'withheld',
        reason: fixture.blockReason.description,
        helpExpanded: frame >= 960,
      });
      expect(Object.keys(state.result ?? {}).sort()).toEqual(['helpExpanded', 'kind', 'reason']);
      expect(state.inspection.complete).toBe(true);
      expect(state.inspection.disclosureAllowed).toBe(false);
      expect(state.resultRevealProgress).toBe(0);
    }
  });

  it('uses the exact block-help windows', () => {
    expect(stateAt(959, fixture).result).toMatchObject({kind: 'withheld', helpExpanded: false});
    expect(stateAt(960, fixture).result).toMatchObject({kind: 'withheld', helpExpanded: true});
    expect(stateAt(975, fixture).result).toMatchObject({kind: 'withheld', helpExpanded: true});
    expect(stateAt(989, fixture).result).toMatchObject({kind: 'withheld', helpExpanded: true});
  });

  it('scrolls the internal stage exactly 80px without moving a stable capture frame', () => {
    expect(stateAt(179, fixture).stageScrollY).toBe(0);
    expect(stateAt(180, fixture).stageScrollY).toBe(0);
    expect(stateAt(195, fixture).stageScrollY).toBeLessThan(0);
    expect(stateAt(209, fixture).stageScrollY).toBe(-80);
    expect(stateAt(210, fixture).stageScrollY).toBe(-80);
    expect(stateAt(989, fixture).stageScrollY).toBe(-80);
  });

  it('moves, holds, presses, releases, and hides the virtual pointer on exact frames', () => {
    expect(stateAt(119, fixture).pointer.phase).toBe('hidden');
    expect(stateAt(120, fixture).pointer.phase).toBe('moving');
    expect(stateAt(143, fixture).pointer.phase).toBe('moving');
    expect(stateAt(144, fixture).pointer.phase).toBe('holding');
    expect(stateAt(155, fixture).pointer.phase).toBe('holding');
    expect(stateAt(156, fixture).pointer.phase).toBe('pressed');
    expect(stateAt(159, fixture).pointer.phase).toBe('pressed');
    expect(stateAt(160, fixture).pointer.phase).toBe('released');
    expect(stateAt(165, fixture).pointer.phase).toBe('released');
    expect(stateAt(166, fixture).pointer.phase).toBe('hidden');
    expect(stateAt(171, fixture).pointer.phase).toBe('hidden');
  });

  it('keeps the cursor hotspot inside the summarize target for every click frame', () => {
    for (let frame = 156; frame <= 165; frame += 1) {
      const {x, y} = stateAt(frame, fixture).pointer;
      expect(x).toBeGreaterThanOrEqual(SUMMARIZE_BUTTON_BOUNDS.x);
      expect(x).toBeLessThanOrEqual(
        SUMMARIZE_BUTTON_BOUNDS.x + SUMMARIZE_BUTTON_BOUNDS.width,
      );
      expect(y).toBeGreaterThanOrEqual(SUMMARIZE_BUTTON_BOUNDS.y);
      expect(y).toBeLessThanOrEqual(
        SUMMARIZE_BUTTON_BOUNDS.y + SUMMARIZE_BUTTON_BOUNDS.height,
      );
    }
  });

  it('keeps external payload progress at zero while activating only the approved route', () => {
    for (let frame = 0; frame <= 989; frame += 1) {
      const route = stateAt(frame, fixture).route;
      expect(route.externalPayloadProgress).toBe(0);
      expect(route.internalProgress).toBeGreaterThanOrEqual(0);
      expect(route.internalProgress).toBeLessThanOrEqual(1);
    }

    expect(stateAt(419, fixture).route.externalState).toBe('not-shown');
    expect(stateAt(420, fixture).route.externalState).toBe('blocked');
    expect(stateAt(465, fixture).route).toMatchObject({
      externalState: 'blocked',
      internalState: 'approved',
      internalProgress: 1,
    });
  });

  it('finishes inspection before any success result appears', () => {
    expect(stateAt(539, fixture).inspection.progress).toBe(0);
    expect(stateAt(540, fixture).inspection.progress).toBe(0);
    expect(stateAt(689, fixture).inspection.progress).toBe(1);
    expect(stateAt(689, fixture).result).toBeNull();
    expect(stateAt(690, fixture).inspection.progress).toBe(1);
    expect(stateAt(690, fixture).result?.kind).toBe('verified');
  });

  it('counts the validation plan once and holds its final planned values', () => {
    expect(stateAt(809, fixture).validation).toEqual({progress: 0, people: 0, tasksPerPerson: 0});
    expect(stateAt(810, fixture).validation.progress).toBe(0);
    expect(stateAt(820, fixture).validation.people).toBeGreaterThan(0);
    expect(stateAt(834, fixture).validation).toEqual({progress: 1, people: 5, tasksPerPerson: 10});
    expect(stateAt(835, fixture).validation).toEqual({progress: 1, people: 5, tasksPerPerson: 10});
    expect(stateAt(899, fixture).validation).toEqual({progress: 1, people: 5, tasksPerPerson: 10});
  });
});
