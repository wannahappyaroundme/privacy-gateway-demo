import {
  extractSyntheticRequestPurpose,
  type MockBehavior,
} from '@/prototype/contracts';

type MockSummary = Readonly<{
  purpose: string;
  customerRequest: string;
  employeeGuidance: string;
  itemsToConfirm: string;
  nextAction: string;
}>;

export type MockModelResponse = Readonly<{
  canonicalJson: string;
  chunks: readonly string[];
}>;

const ACCOUNT_MARKER = /\[합성_계좌_[0-9]{2}\]/u;
const RAW_SYNTHETIC_GRAMMAR = /가상고객-[A-Z]|합성(?:연락처|계좌|인증정보)-[0-9]{3}/u;
const SUMMARY_SENTENCE = /^(?<customerRequest>.+? 요청했습니다\.) (?<employeeGuidance>직원은 .+? 설명했습니다\.)$/u;
const REVIEWED_EMPLOYEE_GUIDANCE = new Set([
  '직원은 내부 조회 후 처리 결과를 안내하겠다고 설명했습니다.',
  '직원은 지원 범위를 확인하겠다고 설명했습니다.',
]);

function runFailed(reason: string): never {
  throw new Error(`RUN_FAILED: ${reason}`);
}

function createSummary(protectedText: string): MockSummary {
  const match = SUMMARY_SENTENCE.exec(protectedText);
  const customerRequest = match?.groups?.customerRequest ?? '';
  const employeeGuidanceSource = match?.groups?.employeeGuidance ?? '';
  const employeeGuidance = REVIEWED_EMPLOYEE_GUIDANCE.has(employeeGuidanceSource) ? employeeGuidanceSource : '';
  const purpose = extractSyntheticRequestPurpose(customerRequest) ?? '';

  return {
    purpose,
    customerRequest,
    employeeGuidance,
    itemsToConfirm: '',
    nextAction: '상담 내용을 확인해 후속 안내를 준비합니다.',
  };
}

function mutateOneAccountMarker(protectedText: string): string {
  if (!ACCOUNT_MARKER.test(protectedText)) {
    return runFailed('mock marker mutation requires a protected account marker');
  }

  return protectedText.replace(ACCOUNT_MARKER, '[합성_계좌-01]');
}

function fnv1a32(value: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function addBoundary(boundaries: Set<number>, candidate: number, length: number): void {
  for (let offset = 0; offset < length - 1; offset += 1) {
    const boundary = 1 + ((candidate - 1 + offset) % (length - 1));
    if (!boundaries.has(boundary)) {
      boundaries.add(boundary);
      return;
    }
  }

  runFailed('could not create deterministic mock chunks');
}

function forcedReassemblyBoundary(canonicalJson: string): number {
  const markerStart = canonicalJson.indexOf('[합성_');
  if (markerStart >= 0) {
    return markerStart + 5;
  }

  const jsonKeyStart = canonicalJson.indexOf('customerRequest');
  if (jsonKeyStart < 0) {
    return runFailed('canonical response is missing customer request key');
  }

  return jsonKeyStart + 4;
}

export function splitDeterministically(canonicalJson: string, seed: number): readonly string[] {
  const chunkCount = 4 + (seed % 4);
  if (canonicalJson.length < chunkCount) {
    return runFailed('canonical response is too short to split');
  }

  const boundaries = new Set<number>([forcedReassemblyBoundary(canonicalJson)]);
  for (let slot = 1; boundaries.size < chunkCount - 1; slot += 1) {
    addBoundary(boundaries, 1 + ((seed + slot * 97) % (canonicalJson.length - 1)), canonicalJson.length);
  }

  const orderedBoundaries = [...boundaries].sort((left, right) => left - right);
  const chunks: string[] = [];
  let start = 0;
  for (const end of [...orderedBoundaries, canonicalJson.length]) {
    const chunk = canonicalJson.slice(start, end);
    if (chunk.length === 0) {
      return runFailed('deterministic mock chunk is empty');
    }
    chunks.push(chunk);
    start = end;
  }

  if (chunks.length !== chunkCount || chunks.join('') !== canonicalJson) {
    return runFailed('deterministic mock chunks do not preserve canonical response');
  }

  return chunks;
}

export function generateMockResponse(protectedText: string, behavior: MockBehavior): MockModelResponse {
  if (RAW_SYNTHETIC_GRAMMAR.test(protectedText)) {
    return runFailed('raw synthetic grammar is not protected text');
  }

  const modelText = behavior === 'mutate-marker' ? mutateOneAccountMarker(protectedText) : protectedText;
  const canonicalJson = JSON.stringify(createSummary(modelText));

  return {
    canonicalJson,
    chunks: splitDeterministically(canonicalJson, fnv1a32(protectedText)),
  };
}
