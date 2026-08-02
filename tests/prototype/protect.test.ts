import {describe, expect, it} from 'vitest';

import {
  detectSyntheticIdentifiers,
  protectDetectedSpans,
  protectSyntheticText,
  type SyntheticDetection,
} from '@/prototype/protect';

describe('synthetic identifier detection and protection', () => {
  it('detects sorted name, contact, and account spans and protects each by its reviewed action', () => {
    const sourceText = '가상고객-A님이 합성연락처-001로 연락해 합성계좌-001 자동이체 오류 확인을 요청했습니다.';

    const result = protectSyntheticText(sourceText);

    expect(result.outcome).toBe('PROTECTED');
    expect(result.detections.map(({type, action, start, end}) => ({type, action, start, end}))).toEqual([
      {type: 'name', action: 'surrogate', start: 0, end: 6},
      {type: 'contact', action: 'placeholder', start: 9, end: 18},
      {type: 'account', action: 'placeholder', start: 24, end: 32},
    ]);
    expect(result.protectedText).toBe(
      '가상고객A님이 [합성_연락처_01]로 연락해 [합성_계좌_01] 자동이체 오류 확인을 요청했습니다.',
    );
  });

  it('reuses one placeholder for duplicate contact values in a request', () => {
    const result = protectSyntheticText('합성연락처-001로 연락했고 합성연락처-001로 다시 안내했습니다.');

    expect(result.outcome).toBe('PROTECTED');
    expect(result.protectedText).toBe('[합성_연락처_01]로 연락했고 [합성_연락처_01]로 다시 안내했습니다.');
    expect([...result.registry.entries()]).toEqual([['[합성_연락처_01]', '합성연락처-001']]);
  });

  it('allocates collision-safe placeholders for distinct account values', () => {
    const result = protectSyntheticText('합성계좌-001과 합성계좌-002를 확인했습니다.');

    expect(result.outcome).toBe('PROTECTED');
    expect(result.protectedText).toBe('[합성_계좌_01]과 [합성_계좌_02]를 확인했습니다.');
    expect([...result.registry.entries()]).toEqual([
      ['[합성_계좌_01]', '합성계좌-001'],
      ['[합성_계좌_02]', '합성계좌-002'],
    ]);
  });

  it('blocks unsupported credentials before creating protected content', () => {
    const result = protectSyntheticText('합성인증정보-001 확인을 요청했습니다.');

    expect(result).toEqual({
      outcome: 'REQUEST_BLOCKED_UNSUPPORTED',
      detections: [
        {
          type: 'credential',
          action: 'block',
          rawValue: '합성인증정보-001',
          start: 0,
          end: 10,
        },
      ],
      registry: new Map(),
    });
    expect('protectedText' in result).toBe(false);
  });

  it('fails when a reserved marker is already present in the source text', () => {
    expect(() => protectSyntheticText('가상고객-A님 [합성_연락처_01]')).toThrow('RUN_FAILED');
  });

  it('fails when caller-supplied spans overlap or escape the source bounds', () => {
    const overlapping: readonly SyntheticDetection[] = [
      {type: 'name', action: 'surrogate', rawValue: '가상고객-A', start: 0, end: 6},
      {type: 'contact', action: 'placeholder', rawValue: '고객-A', start: 2, end: 6},
    ];
    const outOfBounds: readonly SyntheticDetection[] = [
      {type: 'contact', action: 'placeholder', rawValue: '합성연락처-001', start: 0, end: 99},
    ];

    expect(() => protectDetectedSpans('가상고객-A님', overlapping)).toThrow('RUN_FAILED');
    expect(() => protectDetectedSpans('합성연락처-001', outOfBounds)).toThrow('RUN_FAILED');
  });

  it('fails rather than returning a protected string with synthetic raw-value residue', () => {
    const partialDetections: readonly SyntheticDetection[] = [
      {
        type: 'contact',
        action: 'placeholder',
        rawValue: '합성연락처-001',
        start: 0,
        end: 9,
      },
    ];

    expect(() => protectDetectedSpans('합성연락처-001와 합성연락처-001', partialDetections)).toThrow('RUN_FAILED');
  });

  it('normalizes empty and no-match input as a failed run instead of allowing a mock summary', () => {
    expect(() => protectSyntheticText('')).toThrow('RUN_FAILED');
    expect(() => protectSyntheticText('자동이체 오류 확인을 요청했습니다.')).toThrow('RUN_FAILED');
    expect(detectSyntheticIdentifiers('합성연락처-001')).toEqual([
      {
        type: 'contact',
        action: 'placeholder',
        rawValue: '합성연락처-001',
        start: 0,
        end: 9,
      },
    ]);
  });
});
