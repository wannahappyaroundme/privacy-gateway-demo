import {readFileSync} from 'node:fs';

import {describe, expect, it} from 'vitest';

import {REVIEWED_CASES} from '@/demo/schema';
import {CHECK_ORDER} from '@/prototype/inspect';
import {runAtStage, type RunStage} from '@/prototype/run';

const [normalCase, blockCase, withheldCase] = REVIEWED_CASES;
const stages = ['idle', 'detected', 'protected', 'mocked', 'inspected', 'published'] as const;

describe('fail-closed staged synthetic runner', () => {
  it('publishes restored fields only at the published stage', () => {
    for (const stage of stages.slice(0, -1) as readonly Exclude<RunStage, 'published'>[]) {
      expect(runAtStage(normalCase, stage).verifiedFields, stage).toBeNull();
    }

    const published = runAtStage(normalCase, 'published');
    expect(published.outcome).toBe('VERIFIED');
    expect(published.reachedStage).toBe('published');
    expect(published.modelCallCount).toBe(1);
    expect(published.verifiedFields?.customerRequest).toContain('합성계좌-001');
  });

  it('computes only through the requested stage and leaves unexecuted checks not-run', () => {
    const expected = [
      {stage: 'idle', outcome: 'IDLE', modelCallCount: 0},
      {stage: 'detected', outcome: 'DETECTED', modelCallCount: 0},
      {stage: 'protected', outcome: 'PROTECTED', modelCallCount: 0},
      {stage: 'mocked', outcome: 'MOCKED', modelCallCount: 1},
    ] as const;

    for (const {stage, outcome, modelCallCount} of expected) {
      const snapshot = runAtStage(normalCase, stage);
      expect(snapshot).toMatchObject({requestedStage: stage, reachedStage: stage, outcome, modelCallCount});
      expect(snapshot.checks).toEqual(CHECK_ORDER.map((code) => ({code, status: 'not-run'})));
    }

    const inspected = runAtStage(normalCase, 'inspected');
    expect(inspected).toMatchObject({
      requestedStage: 'inspected',
      reachedStage: 'inspected',
      outcome: 'INSPECTED',
      modelCallCount: 1,
      verifiedFields: null,
    });
    expect(inspected.checks).toEqual(CHECK_ORDER.map((code) => ({code, status: 'pass'})));
  });

  it('blocks unsupported requests before a model call at every later requested stage', () => {
    for (const stage of ['protected', 'mocked', 'inspected', 'published'] as const) {
      expect(runAtStage(blockCase, stage)).toMatchObject({
        requestedStage: stage,
        reachedStage: 'protected',
        outcome: 'REQUEST_BLOCKED_UNSUPPORTED',
        modelCallCount: 0,
        verifiedFields: null,
      });
    }
  });

  it('withholds a marker-mutated response after one model call and never publishes fields', () => {
    const inspected = runAtStage(withheldCase, 'inspected');
    const published = runAtStage(withheldCase, 'published');

    expect(inspected).toMatchObject({
      reachedStage: 'inspected',
      outcome: 'RESPONSE_WITHHELD_MARKER',
      modelCallCount: 1,
      verifiedFields: null,
    });
    expect(published).toMatchObject({
      reachedStage: 'inspected',
      outcome: 'RESPONSE_WITHHELD_MARKER',
      modelCallCount: 1,
      verifiedFields: null,
    });
  });

  it('applies input and mock-behavior rules independently of case identity and expected labels', () => {
    const renamedNormal = {...normalCase, caseId: 'RENAMED-CASE', label: '결과 미공개'};
    const renamedBlock = {...blockCase, caseId: 'RENAMED-NORMAL', label: '정상 상담요약'};
    const behaviorChanged = {...normalCase, caseId: 'RENAMED-BEHAVIOR', mockBehavior: 'mutate-marker' as const};

    expect(runAtStage(renamedNormal, 'published').outcome).toBe('VERIFIED');
    expect(runAtStage(renamedBlock, 'published').outcome).toBe('REQUEST_BLOCKED_UNSUPPORTED');
    expect(runAtStage(behaviorChanged, 'published').outcome).toBe('RESPONSE_WITHHELD_MARKER');
  });

  it('contains no case-id or expected-outcome branching policy in the runner source', () => {
    const source = readFileSync('src/prototype/run.ts', 'utf8');

    expect(source).not.toMatch(/SYN-(?:NORMAL|BLOCK|WITHHOLD)/u);
    expect(source).not.toMatch(/(?:if|switch)[^\n]*(?:caseId|label)/u);
  });

  it('returns an exact safe public snapshot shape with no protected intermediates', () => {
    for (const caseData of REVIEWED_CASES) {
      for (const stage of stages) {
        const snapshot = runAtStage(caseData, stage);
        expect(Object.keys(snapshot)).toEqual([
          'caseId',
          'requestedStage',
          'reachedStage',
          'outcome',
          'modelCallCount',
          'checks',
          'verifiedFields',
        ]);
        const publicJson = JSON.stringify(snapshot);
        expect(publicJson).not.toContain('chunks');
        expect(publicJson).not.toContain('registry');
        expect(publicJson).not.toContain('protectedText');
        expect(publicJson).not.toContain('[합성_');
      }
    }
  });
});
