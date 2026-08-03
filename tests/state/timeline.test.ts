import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {describe, expect, it} from 'vitest';

import {loadSyntheticCases} from '@/demo/schema';
import {
  MANUAL_STOPS,
  stageAtFrame,
  stateAt,
  stateSignature,
} from '@/demo/timeline';

const cases = loadSyntheticCases(
  readFileSync(resolve('src/demo/fixtures/synthetic-cases-v2.json'), 'utf8'),
);
const normalCase = cases.find(({caseId}) => caseId === 'SYN-NORMAL-001')!;
const blockedCase = cases.find(({caseId}) => caseId === 'SYN-BLOCK-001')!;
const withheldCase = cases.find(({caseId}) => caseId === 'SYN-WITHHOLD-001')!;

describe('engine-backed 900-frame timeline', () => {
  it('returns one deterministic runtime snapshot for every supported frame', () => {
    for (let frame = 0; frame <= 899; frame += 1) {
      const first = stateAt(frame, normalCase);
      const second = stateAt(frame, normalCase);

      expect(first.frame, `frame ${frame}`).toBe(frame);
      expect(first, `frame ${frame}`).toEqual(second);
      expect(first.run.caseId, `frame ${frame}`).toBe(normalCase.caseId);
    }
  });

  it('maps every supported frame to one monotonic engine stage', () => {
    const order = ['detected', 'protected', 'mocked', 'inspected', 'published'];
    let previous = 0;
    for (let frame = 0; frame <= 899; frame += 1) {
      const current = order.indexOf(stageAtFrame(frame));
      expect(current, `frame ${frame}`).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });

  it.each([
    [0, 'detected'],
    [134, 'detected'],
    [135, 'protected'],
    [269, 'protected'],
    [270, 'mocked'],
    [472, 'mocked'],
    [473, 'inspected'],
    [742, 'inspected'],
    [743, 'published'],
    [899, 'published'],
  ] as const)('maps boundary frame %i to engine stage %s', (frame, stage) => {
    expect(stageAtFrame(frame)).toBe(stage);
    expect(stateAt(frame, normalCase).runStage).toBe(stage);
  });

  it.each([-1, 900, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NaN, 44.5])(
    'rejects unsupported frame %s',
    (frame) => {
      expect(() => stageAtFrame(frame)).toThrow('Frame must be an integer from 0 to 899');
      expect(() => stateAt(frame, normalCase)).toThrow('Frame must be an integer from 0 to 899');
    },
  );

  it('exposes only the five reviewed manual snapshots', () => {
    expect(MANUAL_STOPS).toEqual([45, 180, 360, 610, 790]);
    expect(MANUAL_STOPS.map(stageAtFrame)).toEqual([
      'detected',
      'protected',
      'mocked',
      'inspected',
      'published',
    ]);
  });

  it('does not expose verified fields before the published stage', () => {
    for (const frame of [0, 134, 135, 269, 270, 472, 473, 742]) {
      const state = stateAt(frame, normalCase);
      expect(state.run.verifiedFields, `frame ${frame}`).toBeNull();
      expect(state).not.toHaveProperty('result');
    }

    expect(stateAt(743, normalCase).run).toMatchObject({
      reachedStage: 'published',
      outcome: 'VERIFIED',
      verifiedFields: expect.objectContaining({
        customerRequest: expect.stringContaining('합성계좌-001'),
      }),
    });
  });

  it('shows request blocking only when the protection engine reaches its terminal outcome', () => {
    expect(stateAt(134, blockedCase).run).toMatchObject({
      reachedStage: 'detected',
      outcome: 'DETECTED',
      modelCallCount: 0,
      verifiedFields: null,
    });
    expect(stateAt(135, blockedCase).run).toMatchObject({
      reachedStage: 'protected',
      outcome: 'REQUEST_BLOCKED_UNSUPPORTED',
      modelCallCount: 0,
      verifiedFields: null,
    });
  });

  it('shows response withholding only when inspection returns its terminal outcome', () => {
    expect(stateAt(472, withheldCase).run).toMatchObject({
      reachedStage: 'mocked',
      outcome: 'MOCKED',
      modelCallCount: 1,
      verifiedFields: null,
    });
    expect(stateAt(473, withheldCase).run).toMatchObject({
      reachedStage: 'inspected',
      outcome: 'RESPONSE_WITHHELD_MARKER',
      modelCallCount: 1,
      verifiedFields: null,
    });
  });

  it('keeps signatures case-aware while omitting the requested frame number', () => {
    const signature = stateSignature(stateAt(45, normalCase));
    expect(signature).not.toBe(
      stateSignature(stateAt(45, blockedCase)),
    );
    expect(JSON.parse(signature)).not.toHaveProperty('frame');
  });
});
