import {z} from 'zod';

import {
  SUPPORTED_MOCK_BEHAVIORS,
  type SyntheticCase,
  type SyntheticFixture,
} from '../prototype/contracts';

export const SyntheticCaseSchema = z
  .object({
    caseId: z.string(),
    label: z.string(),
    profileId: z.literal('consultation-summary-demo'),
    classification: z
      .object({
        synthetic: z.literal(true),
        fictional: z.literal(true),
        publicReleaseApproved: z.literal(true),
      })
      .strict(),
    sourceText: z.string(),
    task: z.literal('consultation-summary'),
    mockBehavior: z.enum(SUPPORTED_MOCK_BEHAVIORS),
    provenance: z.string(),
  })
  .strict();

const SyntheticFixtureSchema = z
  .object({
    schemaVersion: z.literal('2.0'),
    demoId: z.literal('synthetic-consultation-v2'),
    cases: SyntheticCaseSchema.array().length(3),
  })
  .strict();

export const REVIEWED_CASES = [
  {
    caseId: 'SYN-NORMAL-001',
    label: '정상 상담요약',
    profileId: 'consultation-summary-demo',
    classification: {synthetic: true, fictional: true, publicReleaseApproved: true},
    sourceText:
      '가상고객-A님이 합성연락처-001로 연락해 합성계좌-001 자동이체 오류 확인과 처리 결과 안내를 요청했습니다. 직원은 내부 조회 후 처리 결과를 안내하겠다고 설명했습니다.',
    task: 'consultation-summary',
    mockBehavior: 'valid',
    provenance:
      '실제 또는 가명 기록을 변형하지 않고 공개 시연을 위해 처음부터 작성한 가상 합성 문장입니다.',
  },
  {
    caseId: 'SYN-BLOCK-001',
    label: '요청 단계 차단',
    profileId: 'consultation-summary-demo',
    classification: {synthetic: true, fictional: true, publicReleaseApproved: true},
    sourceText:
      '가상고객-B님이 합성연락처-002로 연락해 합성인증정보-001 확인과 상담 기록 요약을 요청했습니다. 직원은 지원 범위를 확인하겠다고 설명했습니다.',
    task: 'consultation-summary',
    mockBehavior: 'valid',
    provenance:
      '실제 또는 가명 기록을 변형하지 않고 공개 시연을 위해 처음부터 작성한 가상 합성 문장입니다.',
  },
  {
    caseId: 'SYN-WITHHOLD-001',
    label: '결과 미공개',
    profileId: 'consultation-summary-demo',
    classification: {synthetic: true, fictional: true, publicReleaseApproved: true},
    sourceText:
      '가상고객-C님이 합성연락처-003로 연락해 합성계좌-003 자동이체 해지 상태 확인과 처리 결과 안내를 요청했습니다. 직원은 내부 조회 후 처리 결과를 안내하겠다고 설명했습니다.',
    task: 'consultation-summary',
    mockBehavior: 'mutate-marker',
    provenance:
      '실제 또는 가명 기록을 변형하지 않고 공개 시연을 위해 처음부터 작성한 가상 합성 문장입니다.',
  },
] as const satisfies readonly SyntheticCase[];

const DISALLOWED_PUBLIC_PATTERNS = [
  /\b01[016789][ -]?\d{3,4}[ -]?\d{4}\b/u,
  /\b\d{6}[ -]?[1-4]\d{6}\b/u,
  /\b(?:\d{4}[ -]?){3}\d{4}\b/u,
  /\b\d{2,6}[ -]\d{2,6}[ -]\d{5,8}\b/u,
  /(?:ChatGPT|OpenAI|Aegis AI|iM금융|iM뱅크)/iu,
] as const;

function failPublicContentRule(): never {
  throw new Error('Fixture failed public content rule');
}

function assertReviewedCases(parsed: SyntheticFixture): void {
  if (JSON.stringify(parsed.cases) !== JSON.stringify(REVIEWED_CASES)) failPublicContentRule();
}

function assertNoFinancialIdentifierPatterns(raw: string): void {
  if (DISALLOWED_PUBLIC_PATTERNS.some((pattern) => pattern.test(raw))) failPublicContentRule();
}

export function loadSyntheticCases(raw: string): readonly SyntheticCase[] {
  const parsed = SyntheticFixtureSchema.parse(JSON.parse(raw)) as SyntheticFixture;
  assertReviewedCases(parsed);
  assertNoFinancialIdentifierPatterns(raw);
  return parsed.cases;
}
