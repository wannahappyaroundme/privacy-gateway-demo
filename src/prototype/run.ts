import type {SyntheticCase} from '@/prototype/contracts';
import {
  CHECK_ORDER,
  inspectAndRestoreResponse,
  inspectResponse,
  type InspectionCheck,
  type InspectionOutcome,
  type VerifiedFields,
} from '@/prototype/inspect';
import {generateMockResponse} from '@/prototype/mockModel';
import {detectSyntheticIdentifiers, protectDetectedSpans} from '@/prototype/protect';

export const RUN_STAGES = ['idle', 'detected', 'protected', 'mocked', 'inspected', 'published'] as const;

export type RunStage = (typeof RUN_STAGES)[number];
export type RunOutcome =
  | 'IDLE'
  | 'DETECTED'
  | 'PROTECTED'
  | 'MOCKED'
  | InspectionOutcome
  | 'REQUEST_BLOCKED_UNSUPPORTED'
  | 'RUN_FAILED';

export type RunSnapshot = Readonly<{
  caseId: string;
  requestedStage: RunStage;
  reachedStage: RunStage;
  outcome: RunOutcome;
  modelCallCount: number;
  checks: readonly InspectionCheck[];
  verifiedFields: VerifiedFields | null;
}>;

function notRunChecks(): readonly InspectionCheck[] {
  return CHECK_ORDER.map((code) => ({code, status: 'not-run'}));
}

function buildSnapshot(
  caseId: string,
  requestedStage: RunStage,
  reachedStage: RunStage,
  outcome: RunOutcome,
  modelCallCount: number,
  checks: readonly InspectionCheck[],
  verifiedFields: VerifiedFields | null = null,
): RunSnapshot {
  return {caseId, requestedStage, reachedStage, outcome, modelCallCount, checks, verifiedFields};
}

function failedSnapshot(
  caseId: string,
  requestedStage: RunStage,
  reachedStage: RunStage,
  modelCallCount: number,
  error: unknown,
): RunSnapshot {
  void error;
  return buildSnapshot(caseId, requestedStage, reachedStage, 'RUN_FAILED', modelCallCount, notRunChecks());
}

function stageRequested(requestedStage: RunStage, stage: RunStage): boolean {
  return RUN_STAGES.indexOf(requestedStage) >= RUN_STAGES.indexOf(stage);
}

export function runAtStage(caseData: SyntheticCase, requestedStage: RunStage): RunSnapshot {
  let registry: Map<string, string> | null = null;
  let reachedStage: RunStage = 'idle';
  let modelCallCount = 0;

  try {
    if (!stageRequested(requestedStage, 'detected')) {
      return buildSnapshot(caseData.caseId, requestedStage, reachedStage, 'IDLE', modelCallCount, notRunChecks());
    }

    const detections = detectSyntheticIdentifiers(caseData.sourceText);
    reachedStage = 'detected';
    if (!stageRequested(requestedStage, 'protected')) {
      return buildSnapshot(caseData.caseId, requestedStage, reachedStage, 'DETECTED', modelCallCount, notRunChecks());
    }

    const protection = protectDetectedSpans(caseData.sourceText, detections);
    registry = protection.registry instanceof Map ? protection.registry : new Map(protection.registry);
    reachedStage = 'protected';
    if (protection.outcome === 'REQUEST_BLOCKED_UNSUPPORTED') {
      return buildSnapshot(
        caseData.caseId,
        requestedStage,
        reachedStage,
        'REQUEST_BLOCKED_UNSUPPORTED',
        modelCallCount,
        notRunChecks(),
      );
    }
    if (!protection.protectedText) {
      throw new Error('RUN_FAILED');
    }
    if (!stageRequested(requestedStage, 'mocked')) {
      return buildSnapshot(caseData.caseId, requestedStage, reachedStage, 'PROTECTED', modelCallCount, notRunChecks());
    }

    modelCallCount += 1;
    const response = generateMockResponse(protection.protectedText, caseData.mockBehavior);
    reachedStage = 'mocked';
    if (!stageRequested(requestedStage, 'inspected')) {
      return buildSnapshot(caseData.caseId, requestedStage, reachedStage, 'MOCKED', modelCallCount, notRunChecks());
    }

    const inspectionInput = {
      chunks: response.chunks,
      registry,
      sourceText: caseData.sourceText,
      protectedText: protection.protectedText,
    };
    const inspection = stageRequested(requestedStage, 'published')
      ? inspectAndRestoreResponse(inspectionInput)
      : inspectResponse(inspectionInput);
    reachedStage = 'inspected';
    if (inspection.outcome !== 'INSPECTED' && inspection.outcome !== 'VERIFIED') {
      return buildSnapshot(
        caseData.caseId,
        requestedStage,
        reachedStage,
        inspection.outcome,
        modelCallCount,
        inspection.checks,
      );
    }
    if (!stageRequested(requestedStage, 'published')) {
      return buildSnapshot(
        caseData.caseId,
        requestedStage,
        reachedStage,
        'INSPECTED',
        modelCallCount,
        inspection.checks,
      );
    }

    reachedStage = 'published';
    return buildSnapshot(
      caseData.caseId,
      requestedStage,
      reachedStage,
      'VERIFIED',
      modelCallCount,
      inspection.checks,
      inspection.verifiedFields,
    );
  } catch (error: unknown) {
    return failedSnapshot(caseData.caseId, requestedStage, reachedStage, modelCallCount, error);
  } finally {
    registry?.clear();
  }
}
