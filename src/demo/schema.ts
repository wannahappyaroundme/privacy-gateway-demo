import {z} from 'zod';

const VerifiedResultFieldSchema = z
  .object({
    label: z.string(),
    value: z.string(),
    evidence: z.string(),
  })
  .strict();

export const DemoFixtureSchema = z
  .object({
    schemaVersion: z.literal('1.0'),
    demoId: z.literal('synthetic-consultation-v1'),
    profileId: z.literal('consultation-summary-demo'),
    classification: z
      .object({
        synthetic: z.literal(true),
        fictional: z.literal(true),
        publicReleaseApproved: z.literal(true),
      })
      .strict(),
    measured: z.literal(false),
    claimBasis: z.literal('scripted-illustration'),
    provenance: z.string(),
    case: z
      .object({
        caseId: z.literal('SYN-DEMO-001'),
        displayCustomer: z.string(),
        displayContact: z.string(),
        displayAccount: z.string(),
        sourceText: z.string(),
        protectedText: z.string(),
      })
      .strict(),
    mockResponse: z.string(),
    verifiedResult: z.tuple([
      VerifiedResultFieldSchema,
      VerifiedResultFieldSchema,
      VerifiedResultFieldSchema,
      VerifiedResultFieldSchema,
      VerifiedResultFieldSchema,
    ]),
    blockReason: z
      .object({
        mutatedMarker: z.string(),
        title: z.string(),
        description: z.string(),
      })
      .strict(),
  })
  .strict();

export type DemoFixture = z.infer<typeof DemoFixtureSchema>;

declare const validatedFixtureBrand: unique symbol;
export type ValidatedFixture = DemoFixture & {[validatedFixtureBrand]: true};

const REVIEWED_FIXTURE: DemoFixture = {
  schemaVersion: '1.0',
  demoId: 'synthetic-consultation-v1',
  profileId: 'consultation-summary-demo',
  classification: {
    synthetic: true,
    fictional: true,
    publicReleaseApproved: true,
  },
  measured: false,
  claimBasis: 'scripted-illustration',
  provenance:
    '실제 또는 가명 기록을 변형하지 않고 이 공개 시연을 위해 처음부터 작성한 가상 합성 문장입니다.',
  case: {
    caseId: 'SYN-DEMO-001',
    displayCustomer: '가상고객-A',
    displayContact: '합성연락처-001',
    displayAccount: '합성계좌-001',
    sourceText:
      '가상고객-A님이 합성연락처-001로 연락해 합성계좌-001 자동이체 오류와 처리 결과 안내를 요청했습니다. 직원은 내부 조회 후 처리 결과를 안내하겠다고 설명했습니다.',
    protectedText:
      '가상고객A님이 [합성_연락처_01]로 연락해 [합성_계좌_01] 자동이체 오류와 처리 결과 안내를 요청했습니다. 직원은 내부 조회 후 처리 결과를 안내하겠다고 설명했습니다.',
  },
  mockResponse:
    '가상고객A는 [합성_계좌_01] 자동이체 오류의 확인과 처리 결과 안내를 요청했습니다. 직원은 내부 조회 뒤 [합성_연락처_01]로 안내하기로 설명했습니다.',
  verifiedResult: [
    {label: '상담 목적', value: '자동이체 오류 상담', evidence: '합성 상담 메모'},
    {label: '고객 요청', value: '오류 확인과 처리 결과 안내', evidence: '합성 상담 메모'},
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
    {label: '다음 조치', value: '내부 조회 후 합성연락처-001로 안내', evidence: '합성 상담 메모'},
  ],
  blockReason: {
    mutatedMarker: '[합성_계좌-01]',
    title: '보호용 표시가 달라 결과를 열지 않았어요',
    description:
      '원래 값과 정확히 연결하기 어려워요. 이전 단계를 확인하거나 직접 작성으로 이어가세요.',
  },
};

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

function assertLiteralAllowlist(parsed: DemoFixture): void {
  if (JSON.stringify(parsed) !== JSON.stringify(REVIEWED_FIXTURE)) failPublicContentRule();
}

function assertNoFinancialIdentifierPatterns(raw: string): void {
  if (DISALLOWED_PUBLIC_PATTERNS.some((pattern) => pattern.test(raw))) failPublicContentRule();
}

export async function validateFixture(raw: string): Promise<ValidatedFixture> {
  const parsed = DemoFixtureSchema.parse(JSON.parse(raw));
  assertLiteralAllowlist(parsed);
  assertNoFinancialIdentifierPatterns(raw);
  return parsed as ValidatedFixture;
}
