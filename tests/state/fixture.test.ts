import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {describe, expect, it} from 'vitest';

import {loadSyntheticCases} from '@/demo/schema';

const rawCasesFixture = readFileSync(resolve('src/demo/fixtures/synthetic-cases-v2.json'), 'utf8');
const fewerCasesFixture = (() => {
  const fixture = JSON.parse(rawCasesFixture) as {cases: unknown[]};
  fixture.cases.pop();
  return JSON.stringify(fixture);
})();

describe('reviewed public synthetic input-only cases', () => {
  it('loads exactly three reviewed synthetic input-only cases', () => {
    const cases = loadSyntheticCases(rawCasesFixture);

    expect(cases.map(({caseId, mockBehavior}) => ({caseId, mockBehavior}))).toEqual([
      {caseId: 'SYN-NORMAL-001', mockBehavior: 'valid'},
      {caseId: 'SYN-BLOCK-001', mockBehavior: 'valid'},
      {caseId: 'SYN-WITHHOLD-001', mockBehavior: 'mutate-marker'},
    ]);
    expect(rawCasesFixture).not.toMatch(/protectedText|mockResponse|verifiedResult|expectedOutcome/u);
  });

  it.each([
    ['a changed case count', fewerCasesFixture],
    ['a changed profile', rawCasesFixture.replace('"consultation-summary-demo"', '"other-profile"')],
    ['a changed task', rawCasesFixture.replace('"consultation-summary"', '"other-task"')],
    ['a changed provenance', rawCasesFixture.replace('처음부터 작성한', '나중에 수정한')],
    ['an unapproved mock behavior', rawCasesFixture.replace('"mockBehavior": "valid"', '"mockBehavior": "other"')],
    ['a changed reviewed literal', rawCasesFixture.replace('"label": "정상 상담요약"', '"label": "변경된 상담요약"')],
  ])('rejects %s', (label, changed) => {
    expect(() => loadSyntheticCases(changed)).toThrow();
  });

  it.each(['synthetic', 'fictional', 'publicReleaseApproved'])(
    'rejects a changed %s classification',
    (field) => {
      expect(() => loadSyntheticCases(rawCasesFixture.replace(`"${field}": true`, `"${field}": false`))).toThrow();
    },
  );

  it.each([
    ['010', '1234', '5678'].join('-'),
    ['1002', '123', '456789'].join('-'),
    ['1234', '5678', '9012', '3456'].join('-'),
    ['123', '45', '6789012'].join('-'),
  ])('rejects identifier-like public value %s', (value) => {
    expect(() => loadSyntheticCases(rawCasesFixture.replace('가상고객-A', value))).toThrow(
      'Fixture failed public content rule',
    );
  });

  it.each(['protectedText', 'mockResponse', 'verifiedResult', 'expectedOutcome'])(
    'rejects forbidden completed-value field %s',
    (field) => {
      const changed = JSON.parse(rawCasesFixture) as {cases: Array<Record<string, unknown>>};
      changed.cases[0][field] = 'not-an-input';

      expect(() => loadSyntheticCases(JSON.stringify(changed))).toThrow();
    },
  );
});
