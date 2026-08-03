const RULES = [
  {type: 'credential', action: 'block', pattern: /합성인증정보-[0-9]{3}/gu},
  {type: 'contact', action: 'placeholder', pattern: /합성연락처-[0-9]{3}/gu},
  {type: 'account', action: 'placeholder', pattern: /합성계좌-[0-9]{3}/gu},
  {type: 'name', action: 'surrogate', pattern: /가상고객-[A-Z]/gu},
] as const;

type Rule = (typeof RULES)[number];

export type SyntheticIdentifierType = Rule['type'];
export type ProtectionAction = Rule['action'];

export type SyntheticDetection = Readonly<{
  type: SyntheticIdentifierType;
  action: ProtectionAction;
  rawValue: string;
  start: number;
  end: number;
}>;

export type ProtectionOutcome = 'PROTECTED' | 'REQUEST_BLOCKED_UNSUPPORTED';

export type ProtectionResult = Readonly<{
  outcome: ProtectionOutcome;
  detections: readonly SyntheticDetection[];
  registry: ReadonlyMap<string, string>;
  protectedText?: string;
}>;

const RESERVED_OUTPUT = /가상고객[A-Z]|\[합성_(?:연락처|계좌)_[0-9]+\]/u;

function runFailed(reason: string): never {
  throw new Error(`RUN_FAILED: ${reason}`);
}

function matchingRule(detection: SyntheticDetection): Rule | undefined {
  return RULES.find((rule) => rule.type === detection.type && rule.action === detection.action);
}

function matchesFullGrammar(rule: Rule, rawValue: string): boolean {
  const flagsWithoutGlobal = rule.pattern.flags.replace('g', '');
  return new RegExp(`^(?:${rule.pattern.source})$`, flagsWithoutGlobal).test(rawValue);
}

function hasSyntheticResidue(text: string): boolean {
  return RULES.some((rule) => new RegExp(rule.pattern.source, rule.pattern.flags).test(text));
}

function validateSourceText(sourceText: string): void {
  if (sourceText.length === 0) {
    runFailed('empty synthetic source text');
  }

  if (RESERVED_OUTPUT.test(sourceText)) {
    runFailed('reserved protection output in source text');
  }
}

function validateDetections(sourceText: string, detections: readonly SyntheticDetection[]): SyntheticDetection[] {
  const sorted = [...detections].sort((left, right) => left.start - right.start || left.end - right.end);
  let previousEnd = 0;

  for (const detection of sorted) {
    const rule = matchingRule(detection);
    if (
      !rule ||
      !matchesFullGrammar(rule, detection.rawValue) ||
      detection.start < 0 ||
      detection.end <= detection.start ||
      detection.end > sourceText.length ||
      sourceText.slice(detection.start, detection.end) !== detection.rawValue ||
      detection.start < previousEnd
    ) {
      runFailed('invalid synthetic detection range');
    }
    previousEnd = detection.end;
  }

  return sorted;
}

function protectedValueFor(
  detection: SyntheticDetection,
  valuesByRawIdentifier: Map<string, string>,
  counters: Map<'contact' | 'account', number>,
): string {
  const valueKey = `${detection.type}:${detection.rawValue}`;
  const existing = valuesByRawIdentifier.get(valueKey);
  if (existing) {
    return existing;
  }

  if (detection.type === 'name') {
    const surrogate = detection.rawValue.replace('-', '');
    valuesByRawIdentifier.set(valueKey, surrogate);
    return surrogate;
  }

  if (detection.type === 'contact' || detection.type === 'account') {
    const counter = (counters.get(detection.type) ?? 0) + 1;
    const placeholder = `[합성_${detection.type === 'contact' ? '연락처' : '계좌'}_${String(counter).padStart(2, '0')}]`;
    counters.set(detection.type, counter);
    valuesByRawIdentifier.set(valueKey, placeholder);
    return placeholder;
  }

  return runFailed('unsupported identifier cannot be transformed');
}

export function detectSyntheticIdentifiers(sourceText: string): readonly SyntheticDetection[] {
  return RULES.flatMap((rule) =>
    [...sourceText.matchAll(rule.pattern)].map((match) => ({
      type: rule.type,
      action: rule.action,
      rawValue: match[0],
      start: match.index ?? runFailed('detection without an index'),
      end: (match.index ?? runFailed('detection without an index')) + match[0].length,
    })),
  ).sort((left, right) => left.start - right.start || left.end - right.end);
}

export function protectDetectedSpans(
  sourceText: string,
  detections: readonly SyntheticDetection[],
): ProtectionResult {
  validateSourceText(sourceText);
  const sortedDetections = validateDetections(sourceText, detections);
  const registry = new Map<string, string>();

  if (sortedDetections.some((detection) => detection.action === 'block')) {
    return {
      outcome: 'REQUEST_BLOCKED_UNSUPPORTED',
      detections: sortedDetections,
      registry,
    };
  }

  if (sortedDetections.length === 0) {
    runFailed('no synthetic identifiers detected');
  }

  const valuesByRawIdentifier = new Map<string, string>();
  const counters = new Map<'contact' | 'account', number>();
  const protectedValues = sortedDetections.map((detection) => {
    const protectedValue = protectedValueFor(detection, valuesByRawIdentifier, counters);
    registry.set(protectedValue, detection.rawValue);
    return protectedValue;
  });
  let protectedText = sourceText;

  for (let index = sortedDetections.length - 1; index >= 0; index -= 1) {
    const detection = sortedDetections[index];
    const protectedValue = protectedValues[index];
    protectedText = `${protectedText.slice(0, detection.start)}${protectedValue}${protectedText.slice(detection.end)}`;
  }

  if (hasSyntheticResidue(protectedText)) {
    runFailed('synthetic raw-value residue after protection');
  }

  return {
    outcome: 'PROTECTED',
    detections: sortedDetections,
    protectedText,
    registry,
  };
}

export function protectSyntheticText(sourceText: string): ProtectionResult {
  return protectDetectedSpans(sourceText, detectSyntheticIdentifiers(sourceText));
}

export function protectedTextForDisplay(sourceText: string, visible: boolean): string | undefined {
  if (!visible) return undefined;
  const protection = protectSyntheticText(sourceText);

  try {
    return protection.protectedText;
  } finally {
    if (protection.registry instanceof Map) protection.registry.clear();
  }
}
