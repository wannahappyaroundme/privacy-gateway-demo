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
  if (state === 'verified') return '완료';
  if (state === 'request-blocked') {
    if (index < 1) return '완료';
    if (index === 1) return '멈춤';
    return index === 4 ? '잠김' : '실행 안 함';
  }
  if (state === 'response-withheld') {
    if (index < 3) return '완료';
    if (index === 3) return '확인 필요';
    return '잠김';
  }
  if (state === 'recoverable') return index <= reached ? '확인 필요' : index === 4 ? '잠김' : '대기';
  if (state === 'idle') return index === 4 ? '잠김' : '대기';
  if (index < reached) return '완료';
  if (index === reached) return index === 4 ? '완료' : '진행 중';
  return index === 4 ? '잠김' : '대기';
}

function GatewayActivity({state, run, protectedText}: {state: ProductState; run: RunSnapshot | null; protectedText?: string}) {
  const reachedStage = run?.reachedStage ?? 'idle';
  const protectionVisible = STAGE_INDEX[reachedStage] >= 1;
  const status = state === 'idle'
    ? '요약을 시작하면 다섯 단계를 순서대로 실행합니다.'
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
                ? '지원 범위를 확인해 요약 요청 전에 멈췄습니다.'
                : state === 'response-withheld'
                  ? '검사에서 확인할 항목을 찾아 결과를 잠갔습니다.'
                  : COPY.workspace.recoverableTitle;

  return (
    <section className="product-panel gateway-workspace" aria-labelledby="gateway-title">
      <div className="product-panel__heading">
        <div>
          <p className="panel__eyebrow">브라우저 내부 실행</p>
          <h2 id="gateway-title">개인정보 보호 흐름</h2>
        </div>
        <span className={state === 'idle' ? 'gateway-state' : 'gateway-state is-active'}>
          {state === 'idle' ? '대기' : state === 'verified' ? '완료' : state === 'request-blocked' || state === 'response-withheld' ? '멈춤' : '실행 중'}
        </span>
      </div>

      <p className="gateway-message" aria-live="polite">{status}</p>

      <ol className="gateway-steps" data-testid="stage-list">
        {COPY.stageNames.map((label, index) => {
          const itemStatus = stageStatus(index, state, reachedStage);
          const complete = itemStatus === '완료';
          const active = itemStatus === '진행 중';
          const warning = itemStatus === '멈춤' || itemStatus === '확인 필요';
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
    {label: '상담 목적', value: fields.purpose, evidence: '합성 상담 메모'},
    {label: '고객 요청', value: fields.customerRequest, evidence: '합성 상담 메모'},
    {label: '직원이 안내한 내용', value: fields.employeeGuidance, evidence: '입력 문장 근거 있음'},
    {label: '직원이 확인할 항목', value: fields.itemsToConfirm, evidence: '사람이 확인할 항목'},
    {label: '다음 조치', value: fields.nextAction, evidence: '정해진 다음 행동'},
  ];

  return (
    <article className="product-panel result-workspace" aria-labelledby="result-title">
      <div className="product-panel__heading">
        <div>
          <p className="panel__eyebrow">업무 결과</p>
          <h2 id="result-title">상담 요약</h2>
        </div>
        <span className={state === 'verified' ? 'result-state is-ready' : 'result-state'}>
          {state === 'verified' ? '확인됨' : state === 'request-blocked' ? '요청 멈춤' : state === 'response-withheld' ? '미공개' : '잠김'}
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
          <div className="locked-result__icon" aria-hidden="true">{state === 'idle' ? '잠금' : '확인'}</div>
          <strong>{state === 'idle' ? COPY.workspace.lockedTitle : '결과를 확인하고 있어요'}</strong>
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
    ? '처리 완료'
    : manual
      ? '다음 단계'
      : state === 'idle'
        ? COPY.workspace.start
        : '브라우저 내부에서 처리 중';

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
          <p className="panel__eyebrow">합성 상담 요약</p>
          <h1>{COPY.workspace.title}</h1>
          <p>{COPY.workspace.description}</p>
        </div>
        <span className="workspace-profile"><b aria-hidden="true">안</b> 브라우저 안에서만 실행</span>
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
