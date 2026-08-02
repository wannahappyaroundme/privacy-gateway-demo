import {describe, expect, it} from 'vitest';

import {
  CHECK_ORDER,
  inspectAndRestoreResponse,
  inspectResponse,
  type InspectionInput,
} from '@/prototype/inspect';

const sourceText =
  '가상고객-A님이 합성연락처-001로 연락해 합성계좌-001 자동이체 오류 확인과 처리 결과 안내를 요청했습니다. 직원은 내부 조회 후 처리 결과를 안내하겠다고 설명했습니다.';
const protectedText =
  '가상고객A님이 [합성_연락처_01]로 연락해 [합성_계좌_01] 자동이체 오류 확인과 처리 결과 안내를 요청했습니다. 직원은 내부 조회 후 처리 결과를 안내하겠다고 설명했습니다.';
const protectedFields = {
  purpose: '자동이체 오류 확인과 처리 결과 안내를',
  customerRequest:
    '가상고객A님이 [합성_연락처_01]로 연락해 [합성_계좌_01] 자동이체 오류 확인과 처리 결과 안내를 요청했습니다.',
  employeeGuidance: '직원은 내부 조회 후 처리 결과를 안내하겠다고 설명했습니다.',
  itemsToConfirm: '',
  nextAction: '상담 내용을 확인해 후속 안내를 준비합니다.',
} as const;
const registry = new Map([
  ['가상고객A', '가상고객-A'],
  ['[합성_연락처_01]', '합성연락처-001'],
  ['[합성_계좌_01]', '합성계좌-001'],
]);

function inspectionInput(fields: object = protectedFields, chunks?: readonly string[]): InspectionInput {
  const canonicalJson = JSON.stringify(fields);
  return {
    chunks: chunks ?? [canonicalJson],
    registry,
    sourceText,
    protectedText,
  };
}

function expectSafeFailure(result: ReturnType<typeof inspectAndRestoreResponse>, outcome: string): void {
  expect(result.outcome).toBe(outcome);
  expect(result.verifiedFields).toBeNull();
  expect(Object.keys(result)).toEqual(['outcome', 'checks', 'verifiedFields']);
  expect(result.checks.map((check) => Object.keys(check))).toEqual(
    CHECK_ORDER.map(() => ['code', 'status']),
  );
  const publicJson = JSON.stringify(result);
  expect(publicJson).not.toContain('chunks');
  expect(publicJson).not.toContain('registry');
  expect(publicJson).not.toContain('합성연락처-001');
  expect(publicJson).not.toContain('[합성_연락처_01]');
}

describe('full-response inspection and selective restoration', () => {
  it('reassembles the full response and restores exactly the five reviewed fields', () => {
    const canonicalJson = JSON.stringify(protectedFields);
    const result = inspectAndRestoreResponse(
      inspectionInput(protectedFields, [canonicalJson.slice(0, 31), canonicalJson.slice(31, 89), canonicalJson.slice(89)]),
    );

    expect(result).toEqual({
      outcome: 'VERIFIED',
      checks: CHECK_ORDER.map((code) => ({code, status: 'pass'})),
      verifiedFields: {
        purpose: '자동이체 오류 확인과 처리 결과 안내를',
        customerRequest:
          '가상고객-A님이 합성연락처-001로 연락해 합성계좌-001 자동이체 오류 확인과 처리 결과 안내를 요청했습니다.',
        employeeGuidance: '직원은 내부 조회 후 처리 결과를 안내하겠다고 설명했습니다.',
        itemsToConfirm: '',
        nextAction: '상담 내용을 확인해 후속 안내를 준비합니다.',
      },
    });
  });

  it('reassembles every possible two-chunk split across JSON and protected-marker boundaries', () => {
    const canonicalJson = JSON.stringify(protectedFields);

    for (let boundary = 1; boundary < canonicalJson.length; boundary += 1) {
      const result = inspectAndRestoreResponse(
        inspectionInput(protectedFields, [canonicalJson.slice(0, boundary), canonicalJson.slice(boundary)]),
      );
      expect(result.outcome, `split at ${boundary}`).toBe('VERIFIED');
      expect(result.verifiedFields?.customerRequest, `split at ${boundary}`).toContain('합성계좌-001');
    }
  });

  it.each([
    {
      label: 'missing marker',
      fields: {...protectedFields, customerRequest: protectedFields.customerRequest.replace('[합성_계좌_01]', '해당 계좌')},
    },
    {
      label: 'hyphen-mutated marker',
      fields: {...protectedFields, customerRequest: protectedFields.customerRequest.replace('[합성_계좌_01]', '[합성_계좌-01]')},
    },
    {
      label: 'duplicated marker',
      fields: {...protectedFields, itemsToConfirm: '[합성_계좌_01] 확인'},
    },
    {
      label: 'unregistered marker',
      fields: {...protectedFields, customerRequest: protectedFields.customerRequest.replace('[합성_계좌_01]', '[합성_계좌_99]')},
    },
    {
      label: 'surrogate suffix mutation',
      fields: {...protectedFields, customerRequest: protectedFields.customerRequest.replace('가상고객A', '가상고객AA')},
    },
  ])('withholds a response with a $label', ({fields}) => {
    const result = inspectAndRestoreResponse(inspectionInput(fields));

    expectSafeFailure(result, 'RESPONSE_WITHHELD_MARKER');
    expect(result.checks).toEqual([
      {code: 'OUTPUT_SCHEMA', status: 'pass'},
      {code: 'MARKER_INTEGRITY', status: 'fail'},
      {code: 'RAW_RESIDUE', status: 'not-run'},
      {code: 'SOURCE_GROUNDING', status: 'not-run'},
      {code: 'FINANCIAL_DECISION', status: 'not-run'},
    ]);
  });

  it.each([
    {label: 'sixth field', fields: {...protectedFields, internalNote: '공개하면 안 되는 필드'}},
    {
      label: 'missing required field',
      fields: {
        purpose: protectedFields.purpose,
        customerRequest: protectedFields.customerRequest,
        employeeGuidance: protectedFields.employeeGuidance,
        itemsToConfirm: protectedFields.itemsToConfirm,
      },
    },
    {label: 'wrong field type', fields: {...protectedFields, purpose: 42}},
  ])('withholds a response with a strict-schema violation: $label', ({fields}) => {
    const result = inspectAndRestoreResponse(inspectionInput(fields));

    expectSafeFailure(result, 'RESPONSE_WITHHELD_SCHEMA');
    expect(result.checks[0]).toEqual({code: 'OUTPUT_SCHEMA', status: 'fail'});
    expect(result.checks.slice(1).every((check) => check.status === 'not-run')).toBe(true);
  });

  it('withholds supported synthetic raw-value residue after marker integrity passes', () => {
    const result = inspectAndRestoreResponse(
      inspectionInput({...protectedFields, itemsToConfirm: '합성계좌-777 확인'}),
    );

    expectSafeFailure(result, 'RESPONSE_WITHHELD_RAW_RESIDUE');
    expect(result.checks[2]).toEqual({code: 'RAW_RESIDUE', status: 'fail'});
  });

  it('withholds employee guidance that has no exact input source span', () => {
    const result = inspectAndRestoreResponse(
      inspectionInput({...protectedFields, employeeGuidance: '직원은 즉시 처리하겠다고 설명했습니다.'}),
    );

    expectSafeFailure(result, 'RESPONSE_WITHHELD_SOURCE_GROUNDING');
    expect(result.checks[3]).toEqual({code: 'SOURCE_GROUNDING', status: 'fail'});
  });

  it.each([
    '직원은 특정 상품을 추천했습니다.',
    '직원은 대출 승인을 확정했습니다.',
    '직원은 대출 한도를 5천만원으로 결정했습니다.',
    '직원은 적용 금리를 3%로 확정했습니다.',
  ])('withholds financial-decision language: %s', (itemsToConfirm) => {
    const result = inspectAndRestoreResponse(inspectionInput({...protectedFields, itemsToConfirm}));

    expectSafeFailure(result, 'RESPONSE_WITHHELD_FINANCIAL_DECISION');
    expect(result.checks[4]).toEqual({code: 'FINANCIAL_DECISION', status: 'fail'});
  });

  it('withholds malformed JSON without returning parser details or response content', () => {
    const malformed = '{"purpose":"합성연락처-001"';
    const result = inspectAndRestoreResponse(inspectionInput(protectedFields, [malformed]));

    expectSafeFailure(result, 'RESPONSE_WITHHELD_SCHEMA');
    expect(JSON.stringify(result)).not.toContain(malformed);
  });

  it('can complete all inspection checks without creating restored fields before publication', () => {
    const result = inspectResponse(inspectionInput());

    expect(result).toEqual({
      outcome: 'INSPECTED',
      checks: CHECK_ORDER.map((code) => ({code, status: 'pass'})),
      verifiedFields: null,
    });
  });
});
