import {z} from 'zod';

export const CHECK_ORDER = [
  'OUTPUT_SCHEMA',
  'MARKER_INTEGRITY',
  'RAW_RESIDUE',
  'SOURCE_GROUNDING',
  'FINANCIAL_DECISION',
] as const;

export type CheckCode = (typeof CHECK_ORDER)[number];
export type CheckStatus = 'not-run' | 'pass' | 'fail';
export type InspectionOutcome =
  | 'INSPECTED'
  | 'VERIFIED'
  | 'RESPONSE_WITHHELD_SCHEMA'
  | 'RESPONSE_WITHHELD_MARKER'
  | 'RESPONSE_WITHHELD_RAW_RESIDUE'
  | 'RESPONSE_WITHHELD_SOURCE_GROUNDING'
  | 'RESPONSE_WITHHELD_FINANCIAL_DECISION';

export type InspectionCheck = Readonly<{
  code: CheckCode;
  status: CheckStatus;
}>;

export type VerifiedFields = Readonly<{
  purpose: string;
  customerRequest: string;
  employeeGuidance: string;
  itemsToConfirm: string;
  nextAction: string;
}>;

export type InspectionInput = Readonly<{
  chunks: readonly string[];
  registry: ReadonlyMap<string, string>;
  sourceText: string;
  protectedText: string;
}>;

export type InspectionResult = Readonly<{
  outcome: InspectionOutcome;
  checks: readonly InspectionCheck[];
  verifiedFields: VerifiedFields | null;
}>;

const ProtectedSummarySchema = z
  .object({
    purpose: z.string(),
    customerRequest: z.string(),
    employeeGuidance: z.string(),
    itemsToConfirm: z.string(),
    nextAction: z.string(),
  })
  .strict();

type ProtectedSummary = z.infer<typeof ProtectedSummarySchema>;

const RAW_SYNTHETIC_GRAMMAR = /가상고객-[A-Z]|합성(?:연락처|계좌|인증정보)-[0-9]{3}/u;
const PROTECTED_TOKEN_CANDIDATE = /\[[^\]\r\n]*합성[^\]\r\n]*\]|가상고객[A-Za-z0-9_-]+/gu;
const NEXT_ACTION = '상담 내용을 확인해 후속 안내를 준비합니다.';
const FINANCIAL_DECISION =
  /상품.{0,20}추천|승인|한도.{0,20}(?:결정|확정|승인|설정)|(?:결정|확정|승인|설정).{0,20}한도|금리.{0,20}(?:결정|확정|승인|적용)|(?:결정|확정|승인|적용).{0,20}금리/u;

const OUTCOME_BY_CHECK: Readonly<Record<CheckCode, InspectionOutcome>> = {
  OUTPUT_SCHEMA: 'RESPONSE_WITHHELD_SCHEMA',
  MARKER_INTEGRITY: 'RESPONSE_WITHHELD_MARKER',
  RAW_RESIDUE: 'RESPONSE_WITHHELD_RAW_RESIDUE',
  SOURCE_GROUNDING: 'RESPONSE_WITHHELD_SOURCE_GROUNDING',
  FINANCIAL_DECISION: 'RESPONSE_WITHHELD_FINANCIAL_DECISION',
};

type ValidInspection = Readonly<{
  result: InspectionResult;
  protectedFields: ProtectedSummary | null;
}>;

function checkList(status: CheckStatus = 'not-run'): InspectionCheck[] {
  return CHECK_ORDER.map((code) => ({code, status}));
}

function publicResult(
  outcome: InspectionOutcome,
  checks: readonly InspectionCheck[],
  verifiedFields: VerifiedFields | null = null,
): InspectionResult {
  return {outcome, checks, verifiedFields};
}

function failAt(checks: InspectionCheck[], index: number): ValidInspection {
  checks[index] = {code: CHECK_ORDER[index], status: 'fail'};
  return {
    result: publicResult(OUTCOME_BY_CHECK[CHECK_ORDER[index]], checks),
    protectedFields: null,
  };
}

function summaryText(fields: ProtectedSummary): string {
  return Object.values(fields).join('\n');
}

function markerInventoryIsExact(fields: ProtectedSummary, registry: ReadonlyMap<string, string>): boolean {
  const expected = [...registry.keys()].sort();
  const actual = summaryText(fields).match(PROTECTED_TOKEN_CANDIDATE)?.sort() ?? [];
  return expected.length > 0 && expected.length === actual.length && expected.every((token, index) => token === actual[index]);
}

function sourceGroundingIsApproved(fields: ProtectedSummary, sourceText: string, protectedText: string): boolean {
  const purposeGrounded = fields.purpose.length === 0 || protectedText.includes(fields.purpose);
  const requestGrounded = fields.customerRequest.length === 0 || protectedText.includes(fields.customerRequest);
  const guidanceGrounded = fields.employeeGuidance.length === 0 || sourceText.includes(fields.employeeGuidance);
  return purposeGrounded && requestGrounded && guidanceGrounded && fields.nextAction === NEXT_ACTION;
}

function validateResponse(input: InspectionInput): ValidInspection {
  const checks = checkList();
  let fields: ProtectedSummary;

  try {
    fields = ProtectedSummarySchema.parse(JSON.parse(input.chunks.join('')));
  } catch {
    return failAt(checks, 0);
  }
  checks[0] = {code: 'OUTPUT_SCHEMA', status: 'pass'};

  if (!markerInventoryIsExact(fields, input.registry)) {
    return failAt(checks, 1);
  }
  checks[1] = {code: 'MARKER_INTEGRITY', status: 'pass'};

  if (RAW_SYNTHETIC_GRAMMAR.test(summaryText(fields))) {
    return failAt(checks, 2);
  }
  checks[2] = {code: 'RAW_RESIDUE', status: 'pass'};

  if (!sourceGroundingIsApproved(fields, input.sourceText, input.protectedText)) {
    return failAt(checks, 3);
  }
  checks[3] = {code: 'SOURCE_GROUNDING', status: 'pass'};

  if (FINANCIAL_DECISION.test(summaryText(fields))) {
    return failAt(checks, 4);
  }
  checks[4] = {code: 'FINANCIAL_DECISION', status: 'pass'};

  return {result: publicResult('INSPECTED', checks), protectedFields: fields};
}

function restoreExactTokens(value: string, registry: ReadonlyMap<string, string>): string {
  let restored = value;
  for (const [protectedToken, rawValue] of registry) {
    restored = restored.split(protectedToken).join(rawValue);
  }
  return restored;
}

export function inspectResponse(input: InspectionInput): InspectionResult {
  return validateResponse(input).result;
}

export function inspectAndRestoreResponse(input: InspectionInput): InspectionResult {
  const inspection = validateResponse(input);
  if (!inspection.protectedFields) {
    return inspection.result;
  }

  const fields = inspection.protectedFields;
  return publicResult('VERIFIED', inspection.result.checks, {
    purpose: restoreExactTokens(fields.purpose, input.registry),
    customerRequest: restoreExactTokens(fields.customerRequest, input.registry),
    employeeGuidance: restoreExactTokens(fields.employeeGuidance, input.registry),
    itemsToConfirm: restoreExactTokens(fields.itemsToConfirm, input.registry),
    nextAction: restoreExactTokens(fields.nextAction, input.registry),
  });
}
