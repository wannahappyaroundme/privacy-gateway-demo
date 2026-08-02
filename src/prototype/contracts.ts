export const SUPPORTED_MOCK_BEHAVIORS = ['valid', 'mutate-marker'] as const;

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
