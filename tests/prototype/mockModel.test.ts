import {describe, expect, it} from 'vitest';

import {generateMockResponse} from '@/prototype/mockModel';

const protectedText =
  '가상고객A님이 [합성_연락처_01]로 연락해 [합성_계좌_01] 자동이체 오류 확인과 처리 결과 안내를 요청했습니다. 직원은 내부 조회 후 처리 결과를 안내하겠다고 설명했습니다.';

describe('deterministic protected-text mock summarizer', () => {
  it('creates the same five-field canonical response and marker-reassembling chunks from protected text alone', () => {
    const first = generateMockResponse(protectedText, 'valid');
    const second = generateMockResponse(protectedText, 'valid');
    let completedLength = 0;
    const chunkBoundaries = first.chunks.slice(0, -1).map((chunk) => {
      completedLength += chunk.length;
      return completedLength;
    });
    const splitsProtectedMarker = ['[합성_연락처_01]', '[합성_계좌_01]'].some((marker) => {
      const markerStart = first.canonicalJson.indexOf(marker);
      return chunkBoundaries.some((boundary) => boundary > markerStart && boundary < markerStart + marker.length);
    });

    expect(generateMockResponse.length).toBe(2);
    expect(first).toEqual(second);
    expect(first.chunks.length).toBeGreaterThanOrEqual(4);
    expect(first.chunks.length).toBeLessThanOrEqual(7);
    expect(first.chunks.every((chunk) => chunk.length > 0)).toBe(true);
    expect(first.chunks.join('')).toBe(first.canonicalJson);
    expect(splitsProtectedMarker).toBe(true);
    expect(Object.keys(JSON.parse(first.canonicalJson))).toEqual([
      'purpose',
      'customerRequest',
      'employeeGuidance',
      'itemsToConfirm',
      'nextAction',
    ]);
    expect(JSON.parse(first.canonicalJson).purpose).toBe('자동이체 오류 확인과 처리 결과 안내');
  });

  it('mutates exactly one account marker without generating raw synthetic grammar or financial advice', () => {
    const response = generateMockResponse(
      '가상고객A님이 [합성_연락처_01]로 연락해 [합성_계좌_01]과 [합성_계좌_02] 자동이체 오류 확인을 요청했습니다. 직원은 내부 조회 후 처리 결과를 안내하겠다고 설명했습니다.',
      'mutate-marker',
    );

    expect(response.canonicalJson).toContain('[합성_계좌-01]');
    expect(response.canonicalJson.match(/\[합성_계좌-01\]/gu)).toHaveLength(1);
    expect(response.canonicalJson).toContain('[합성_계좌_02]');
    expect(response.canonicalJson).not.toMatch(/합성(?:계좌|연락처)-[0-9]{3}/u);
    expect(response.canonicalJson).not.toMatch(/추천|승인|거절/u);
  });

  it('fails closed when a marker-mutation run has no protected account marker', () => {
    expect(() => generateMockResponse('가상고객A님이 [합성_연락처_01]로 연락했습니다.', 'mutate-marker')).toThrow(
      'RUN_FAILED',
    );
  });

  it('rejects raw synthetic grammar instead of echoing it into a mock response', () => {
    expect(() =>
      generateMockResponse(
        '가상고객-A님이 합성연락처-001로 연락해 합성계좌-001 자동이체 오류 확인을 요청했습니다. 직원은 내부 조회 후 처리 결과를 안내하겠다고 설명했습니다.',
        'valid',
      ),
    ).toThrow('RUN_FAILED');
  });

  it.each([
    '직원은 내부 조회 후 처리 결과를 안내하겠다고 설명했습니다.',
    '직원은 지원 범위를 확인하겠다고 설명했습니다.',
  ])('extracts the reviewed factual employee-guidance source span exactly: %s', (employeeGuidance) => {
    const response = generateMockResponse(
      `가상고객A님이 [합성_연락처_01]로 연락해 [합성_계좌_01] 처리 상태 확인을 요청했습니다. ${employeeGuidance}`,
      'valid',
    );

    expect(JSON.parse(response.canonicalJson).employeeGuidance).toBe(employeeGuidance);
  });

  it.each([
    '직원은 고객에게 특정 상품을 추천하겠다고 설명했습니다.',
    '직원은 대출 승인을 확정했다고 설명했습니다.',
    '직원은 대출 한도를 5천만원으로 결정했다고 설명했습니다.',
    '직원은 적용 금리를 3%로 확정했다고 설명했습니다.',
  ])('omits unapproved employee guidance from every emitted field: %s', (employeeSentence) => {
    const response = generateMockResponse(
      `가상고객A님이 [합성_연락처_01]로 연락해 [합성_계좌_01] 처리 상태 확인을 요청했습니다. ${employeeSentence}`,
      'valid',
    );
    const summary = JSON.parse(response.canonicalJson) as Record<string, string>;

    expect(summary.employeeGuidance).toBe('');
    expect(Object.values(summary).join(' ')).not.toMatch(/추천|승인|한도|금리/u);
  });

  it('keeps source-derived fields incomplete for an unknown sentence shape', () => {
    const response = generateMockResponse(
      '가상고객A님과 [합성_연락처_01]의 상담 기록입니다. 직원은 임의 상품을 안내했습니다.',
      'valid',
    );
    const summary = JSON.parse(response.canonicalJson) as Record<string, string>;

    expect(summary.purpose).toBe('');
    expect(summary.customerRequest).toBe('');
    expect(summary.employeeGuidance).toBe('');
    expect(Object.values(summary).join(' ')).not.toContain('임의 상품');
  });
});
