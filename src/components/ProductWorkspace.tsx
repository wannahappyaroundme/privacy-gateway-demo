import type {DemoRuntimeView} from '../app/DemoRuntime';
import {COPY} from '../content/copy';
import type {RunSnapshot, RunStage} from '../prototype/run';
import {detectSyntheticIdentifiers, protectSyntheticText} from '../prototype/protect';
import {BlockedResultPanel} from './BlockedResultPanel';
import {EntityProtectionPanel} from './EntityProtectionPanel';
import {EvidenceStatusTable} from './EvidenceStatusTable';
import {InspectionDashboard} from './InspectionDashboard';
import {SyntheticCaseCard} from './SyntheticCaseCard';
import {VerifiedResultPanel} from './VerifiedResultPanel';

type ProductState =
  | 'idle'
  | 'detecting'
  | 'protecting'
  | 'summarizing'
  | 'inspecting'
  | 'verified'
  | 'request-blocked'
  | 'response-withheld'
  | 'recoverable';

const STAGE_INDEX: Readonly<Record<RunStage, number>> = {
  idle: -1,
  detected: 0,
  protected: 1,
  mocked: 2,
  inspected: 3,
  published: 4,
};

const STAGE_STATUS = COPY.functionalPrototype.gateway.states;

function productState(view: DemoRuntimeView): ProductState {
  if (view.runtime.phase === 'idle' || view.timeline === null) return 'idle';
  const {run} = view.timeline;
  if (run.outcome === 'REQUEST_BLOCKED_UNSUPPORTED') return 'request-blocked';
  if (run.outcome.startsWith('RESPONSE_WITHHELD_')) return 'response-withheld';
  if (run.outcome === 'RUN_FAILED') return 'recoverable';
  if (run.outcome === 'VERIFIED' && run.verifiedFields !== null) return 'verified';
  if (run.reachedStage === 'protected') return 'protecting';
  if (run.reachedStage === 'mocked') return 'summarizing';
  if (run.reachedStage === 'inspected' || run.reachedStage === 'published') return 'inspecting';
  return 'detecting';
}

function stageStatus(index: number, state: ProductState, reachedStage: RunStage): string {
  const reached = STAGE_INDEX[reachedStage];
  if (state === 'verified') return STAGE_STATUS.complete;
  if (state === 'request-blocked') {
    if (index < 1) return STAGE_STATUS.complete;
    if (index === 1) return STAGE_STATUS.stopped;
    return index === 4 ? STAGE_STATUS.locked : STAGE_STATUS.skipped;
  }
  if (state === 'response-withheld') {
    if (index < 3) return STAGE_STATUS.complete;
    if (index === 3) return STAGE_STATUS.needsReview;
    return STAGE_STATUS.locked;
  }
  if (state === 'recoverable') {
    return index <= reached
      ? STAGE_STATUS.needsReview
      : index === 4
        ? STAGE_STATUS.locked
        : STAGE_STATUS.waiting;
  }
  if (state === 'idle') return index === 4 ? STAGE_STATUS.locked : STAGE_STATUS.waiting;
  if (index < reached) return STAGE_STATUS.complete;
  if (index === reached) return index === 4 ? STAGE_STATUS.complete : STAGE_STATUS.inProgress;
  return index === 4 ? STAGE_STATUS.locked : STAGE_STATUS.waiting;
}

function GatewayActivity({state, run, protectedText}: {state: ProductState; run: RunSnapshot | null; protectedText?: string}) {
  const reachedStage = run?.reachedStage ?? 'idle';
  const protectionVisible = STAGE_INDEX[reachedStage] >= 1;
  const status = state === 'idle'
    ? COPY.functionalPrototype.gateway.idleMessage
    : state === 'detecting'
      ? COPY.workspace.detecting
      : state === 'protecting'
        ? COPY.workspace.protecting
        : state === 'summarizing'
          ? COPY.workspace.generating
          : state === 'inspecting'
            ? COPY.workspace.inspecting
            : state === 'verified'
              ? COPY.workspace.complete
              : state === 'request-blocked'
                ? COPY.functionalPrototype.gateway.requestBlockedMessage
                : state === 'response-withheld'
                  ? COPY.functionalPrototype.gateway.responseWithheldMessage
                  : COPY.workspace.recoverableTitle;

  return (
    <section className="product-panel gateway-workspace" aria-labelledby="gateway-title">
      <div className="product-panel__heading">
        <div>
          <p className="panel__eyebrow">{COPY.functionalPrototype.gateway.eyebrow}</p>
          <h2 id="gateway-title">{COPY.functionalPrototype.gateway.title}</h2>
        </div>
        <span className={state === 'idle' ? 'gateway-state' : 'gateway-state is-active'}>
          {state === 'idle'
            ? STAGE_STATUS.waiting
            : state === 'verified'
              ? STAGE_STATUS.complete
              : state === 'request-blocked' || state === 'response-withheld'
                ? STAGE_STATUS.stopped
                : STAGE_STATUS.running}
        </span>
      </div>

      <p className="gateway-message" aria-live="polite">{status}</p>

      <ol className="gateway-steps" data-testid="stage-list">
        {COPY.stageNames.map((label, index) => {
          const itemStatus = stageStatus(index, state, reachedStage);
          const complete = itemStatus === STAGE_STATUS.complete;
          const active = itemStatus === STAGE_STATUS.inProgress;
          const warning = itemStatus === STAGE_STATUS.stopped || itemStatus === STAGE_STATUS.needsReview;
          return (
            <li key={label} className={complete ? 'is-complete' : active ? 'is-active' : warning ? 'is-warning' : undefined}>
              <span aria-hidden="true">{complete ? '✓' : warning ? '!' : index + 1}</span>
              <strong>{label}</strong>
              <small>{itemStatus}</small>
            </li>
          );
        })}
      </ol>

      <EntityProtectionPanel
        protectedText={protectedText}
        visible={protectionVisible}
        requestBlocked={state === 'request-blocked'}
      />
      {run !== null && <InspectionDashboard checks={run.checks} />}
      <EvidenceStatusTable />
    </section>
  );
}

function ResultWorkspace({
  state,
  run,
  onNormal,
  onAnother,
  onRetry,
}: {
  state: ProductState;
  run: RunSnapshot | null;
  onNormal(): void;
  onAnother(): void;
  onRetry(): void;
}) {
  const fields = run?.verifiedFields;
  const verifiedFields = fields === null || fields === undefined ? null : [
    {
      label: COPY.verifiedResult[0].label,
      value: fields.purpose,
      evidence: COPY.functionalPrototype.result.evidence.syntheticMemo,
    },
    {
      label: COPY.verifiedResult[1].label,
      value: fields.customerRequest,
      evidence: COPY.functionalPrototype.result.evidence.syntheticMemo,
    },
    {
      label: COPY.verifiedResult[2].label,
      value: fields.employeeGuidance,
      evidence: COPY.functionalPrototype.result.evidence.inputSource,
    },
    {
      label: COPY.verifiedResult[3].label,
      value: fields.itemsToConfirm,
      evidence: COPY.functionalPrototype.result.evidence.humanReview,
    },
    {
      label: COPY.verifiedResult[4].label,
      value: fields.nextAction,
      evidence: COPY.functionalPrototype.result.evidence.nextAction,
    },
  ];

  return (
    <article className="product-panel result-workspace" aria-labelledby="result-title">
      <div className="product-panel__heading">
        <div>
          <p className="panel__eyebrow">{COPY.functionalPrototype.result.eyebrow}</p>
          <h2 id="result-title">{COPY.functionalPrototype.result.title}</h2>
        </div>
        <span className={state === 'verified' ? 'result-state is-ready' : 'result-state'}>
          {state === 'verified'
            ? COPY.functionalPrototype.result.states.verified
            : state === 'request-blocked'
              ? COPY.functionalPrototype.result.states.requestStopped
              : state === 'response-withheld'
                ? COPY.functionalPrototype.result.states.withheld
                : COPY.functionalPrototype.result.states.locked}
        </span>
      </div>

      {state === 'verified' && verifiedFields !== null ? (
        <VerifiedResultPanel fields={verifiedFields} onRetry={onRetry} onAnother={onAnother} />
      ) : state === 'request-blocked' ? (
        <BlockedResultPanel kind="request" onNormal={onNormal} onAnother={onAnother} onRetry={onRetry} />
      ) : state === 'response-withheld' ? (
        <BlockedResultPanel kind="response" onNormal={onNormal} onAnother={onAnother} onRetry={onRetry} />
      ) : state === 'recoverable' ? (
        <BlockedResultPanel kind="recoverable" onNormal={onNormal} onAnother={onAnother} onRetry={onRetry} />
      ) : (
        <div className={`locked-result locked-result--${state}`} data-testid="locked-result">
          <div className="locked-result__icon" aria-hidden="true">
            {state === 'idle'
              ? COPY.functionalPrototype.result.lockedIcon
              : COPY.functionalPrototype.result.checkingIcon}
          </div>
          <strong>
            {state === 'idle'
              ? COPY.workspace.lockedTitle
              : COPY.functionalPrototype.result.checkingTitle}
          </strong>
          <p>{COPY.workspace.lockedDescription}</p>
          {state !== 'idle' && <div className="result-skeleton" aria-hidden="true"><i /><i /><i /><i /></div>}
        </div>
      )}
    </article>
  );
}

type ProductWorkspaceProps = {
  view: DemoRuntimeView;
  manualOnly: boolean;
  onCaseChange(caseId: string): void;
};

export function ProductWorkspace({view, manualOnly, onCaseChange}: ProductWorkspaceProps) {
  const bootstrap = view.bootstrap;
  if (bootstrap.kind !== 'ready') return null;
  const selectedCase = bootstrap.cases.find(({caseId}) => caseId === bootstrap.selectedCaseId);
  if (!selectedCase) return null;

  const state = productState(view);
  const run = view.timeline?.run ?? null;
  const detections = detectSyntheticIdentifiers(selectedCase.sourceText);
  const protection = protectSyntheticText(selectedCase.sourceText);
  const manual = !view.recordingMode && manualOnly;
  const manualStep = manual ? Math.max(1, STAGE_INDEX[run?.reachedStage ?? 'detected'] + 1) : null;
  const terminal = ['verified', 'request-blocked', 'response-withheld', 'recoverable'].includes(state);
  const nextCase = () => {
    const currentIndex = bootstrap.cases.findIndex(({caseId}) => caseId === selectedCase.caseId);
    const next = bootstrap.cases[(currentIndex + 1) % bootstrap.cases.length];
    if (next) onCaseChange(next.caseId);
  };
  const normalCase = () => onCaseChange(bootstrap.cases[0]!.caseId);
  const primaryAction = () => {
    if (terminal) return;
    if (view.runtime.phase === 'manual') view.actions.next();
    else if (view.runtime.phase === 'idle') view.actions.start();
  };
  const actionLabel = terminal
    ? COPY.functionalPrototype.workspace.actionComplete
    : manual
      ? COPY.functionalPrototype.workspace.actionNext
      : state === 'idle'
        ? COPY.workspace.start
        : COPY.functionalPrototype.workspace.actionBusy;

  return (
    <section
      className="product-workspace"
      data-testid="product-workspace"
      data-product-state={state}
      data-case-id={selectedCase.caseId}
      data-run-outcome={run?.outcome ?? 'IDLE'}
      data-model-call-count={run?.modelCallCount ?? 0}
    >
      <header className="workspace-heading">
        <div>
          <p className="panel__eyebrow">{COPY.functionalPrototype.workspace.eyebrow}</p>
          <h1>{COPY.workspace.title}</h1>
          <p>{COPY.workspace.description}</p>
        </div>
        <span className="workspace-profile">
          <b aria-hidden="true">{COPY.functionalPrototype.workspace.profileInitial}</b>
          {COPY.functionalPrototype.workspace.profile}
        </span>
      </header>
      <div className="product-workspace__grid">
        <SyntheticCaseCard
          cases={bootstrap.cases}
          selectedCase={selectedCase}
          detections={detections}
          highlightsVisible={state !== 'idle'}
          actionLabel={actionLabel}
          actionDisabled={terminal || (!manual && state !== 'idle')}
          manualStep={manualStep}
          onCaseChange={onCaseChange}
          onAction={primaryAction}
        />
        <GatewayActivity state={state} run={run} protectedText={protection.protectedText} />
        <ResultWorkspace state={state} run={run} onNormal={normalCase} onAnother={nextCase} onRetry={view.actions.replay} />
      </div>
    </section>
  );
}
