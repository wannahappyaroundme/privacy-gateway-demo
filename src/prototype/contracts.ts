export const SUPPORTED_MOCK_BEHAVIORS = ['valid', 'mutate-marker'] as const;
const SYNTHETIC_REQUEST_PURPOSE = /\] (?<purpose>.+)[을를] 요청했습니다\.$/u;

export function extractSyntheticRequestPurpose(customerRequest: string): string | null {
  return SYNTHETIC_REQUEST_PURPOSE.exec(customerRequest)?.groups?.purpose ?? null;
}

export type MockBehavior = (typeof SUPPORTED_MOCK_BEHAVIORS)[number];

export type SyntheticClassification = Readonly<{
  synthetic: true;
  fictional: true;
  publicReleaseApproved: true;
}>;

export type SyntheticCase = Readonly<{
  caseId: string;
  label: string;
  profileId: 'consultation-summary-demo';
  classification: SyntheticClassification;
  sourceText: string;
  task: 'consultation-summary';
  mockBehavior: MockBehavior;
  provenance: string;
}>;

export type SyntheticFixture = Readonly<{
  schemaVersion: '2.0';
  demoId: 'synthetic-consultation-v2';
  cases: readonly SyntheticCase[];
}>;
