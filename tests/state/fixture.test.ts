import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {describe, expect, it} from 'vitest';

import {validateFixture} from '@/demo/schema';

const fixturePath = resolve('src/demo/fixtures/synthetic-consultation-v1.json');
const manifestPath = resolve('release-manifest.json');
const rawFixture = readFileSync(fixturePath, 'utf8');

describe('reviewed public synthetic fixture', () => {
  it('accepts only the reviewed synthetic fixture', async () => {
    const fixture = await validateFixture(rawFixture);

    expect(fixture.case.caseId).toBe('SYN-DEMO-001');
    expect(fixture.classification).toEqual({
      synthetic: true,
      fictional: true,
      publicReleaseApproved: true,
    });
    expect(fixture.measured).toBe(false);
    expect(fixture.claimBasis).toBe('scripted-illustration');
  });

  it.each([
    ['010', '1234', '5678'].join('-'),
    ['1002', '123', '456789'].join('-'),
    'iM뱅크',
    'ChatGPT',
  ])(
    'rejects public value %s',
    async (value) => {
      await expect(validateFixture(rawFixture.replace('가상고객-A', value))).rejects.toThrow(
        'Fixture failed public content rule',
      );
    },
  );

  it.each([
    ['schema version', '"schemaVersion": "1.0"', '"schemaVersion": "1.1"'],
    ['synthetic classification', '"synthetic": true', '"synthetic": false'],
    ['fictional classification', '"fictional": true', '"fictional": false'],
    [
      'public release classification',
      '"publicReleaseApproved": true',
      '"publicReleaseApproved": false',
    ],
    ['measurement status', '"measured": false', '"measured": true'],
    [
      'claim basis',
      '"claimBasis": "scripted-illustration"',
      '"claimBasis": "measured-result"',
    ],
  ])('rejects a changed literal for %s', async (_label, expected, changed) => {
    await expect(validateFixture(rawFixture.replace(expected, changed))).rejects.toThrow();
  });

  it('rejects extra fields outside the reviewed fixture contract', async () => {
    const changed = rawFixture.replace(
      '"schemaVersion": "1.0",',
      '"schemaVersion": "1.0",\n  "unexpected": true,',
    );

    await expect(validateFixture(changed)).rejects.toThrow();
  });

  it('returns the exact reviewed five-field result', async () => {
    const fixture = await validateFixture(rawFixture);

    expect(fixture.verifiedResult).toEqual([
      {
        label: '상담 목적',
        value: '자동이체 오류 상담',
        evidence: '합성 상담 메모',
      },
      {
        label: '고객 요청',
        value: '오류 확인과 처리 결과 안내',
        evidence: '합성 상담 메모',
      },
      {
        label: '직원이 안내한 내용',
        value: '내부 조회 후 처리 결과를 안내하기로 함',
        evidence: '입력 문장 근거 있음',
      },
      {
        label: '직원이 확인할 항목',
        value: '정확한 오류 원인과 처리 완료 여부',
        evidence: '사람이 확인할 항목',
      },
      {
        label: '다음 조치',
        value: '내부 조회 후 합성연락처-001로 안내',
        evidence: '합성 상담 메모',
      },
    ]);
  });

  it('records current fixture bytes in a valid local or approved release state', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      status: string;
      fixtureSha256: string;
      approvedSourceSha256: string | null;
      reviewer: string | null;
      approvedAt: string | null;
    };
    const expectedHash = createHash('sha256').update(rawFixture).digest('hex');

    expect(['local-preflight-only', 'public-release-approved']).toContain(manifest.status);
    expect(manifest.fixtureSha256).toBe(expectedHash);
    expect(manifest.approvedSourceSha256).toMatch(/^[0-9a-f]{64}$/u);
    if (manifest.status === 'local-preflight-only') {
      expect(manifest.reviewer).toBeNull();
      expect(manifest.approvedAt).toBeNull();
    } else {
      expect(manifest.reviewer).toEqual(expect.any(String));
      expect(manifest.approvedAt).toEqual(expect.any(String));
    }
  });
});
