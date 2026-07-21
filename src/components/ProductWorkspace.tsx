import type {DemoRuntimeView} from '../app/DemoRuntime';
import {COPY} from '../content/copy';
import {BlockedResultPanel} from './BlockedResultPanel';

type ProductState =
  | 'idle'
  | 'detecting'
  | 'protecting'
  | 'generating'
  | 'inspecting'
  | 'complete'
  | 'withheld';

const FLOW_STEPS = [
  ['detecting', '개인정보 찾기'],
  ['protecting', '유형별 보호'],
  ['generating', 'AI 상담 요약 작성'],
  ['inspecting', '전체 응답 검사'],
] as const;

function productState(view: DemoRuntimeView): ProductState {
  const frame = view.timeline?.frame ?? 0;
  if (view.timeline?.result?.kind === 'withheld') return 'withheld';
  if (view.runtime.phase === 'idle') return 'idle';
  if (view.runtime.phase === 'complete' || frame >= 690) return 'complete';
  if (frame < 180) return 'detecting';
  if (frame < 420) return 'protecting';
  if (frame < 540) return 'generating';
  return 'inspecting';
}

function stateIndex(state: ProductState): number {
  return FLOW_STEPS.findIndex(([key]) => key === state);
}

function progressBetween(frame: number, start: number, end: number): number {
  if (frame <= start) return 0;
  if (frame >= end) return 1;
  return (frame - start) / (end - start);
}

function ConsultationPanel({view, state}: {view: DemoRuntimeView; state: ProductState}) {
  if (view.bootstrap.kind !== 'ready' || view.timeline === null) return null;
  const frame = view.timeline.frame;
  const found = state === 'idle' ? 0 : Math.min(3, Math.ceil(progressBetween(frame, 0, 180) * 3));
  const canAdvanceManually = !view.recordingMode &&
    (view.runtime.phase === 'paused' || view.runtime.phase === 'manual');
  const isBusy = state !== 'idle' && !canAdvanceManually;

  const handlePrimary = () => {
    if (view.runtime.phase === 'idle') view.actions.start();
    else if (view.runtime.phase === 'paused') view.actions.resume();
    else if (view.runtime.phase === 'manual') view.actions.next();
    else if (view.runtime.phase === 'complete') view.actions.replay();
  };

  const buttonLabel = state === 'idle'
    ? COPY.workspace.start
    : state === 'complete' || state === 'withheld'
      ? '처리 완료'
      : view.runtime.phase === 'paused'
      ? '계속 진행'
      : view.runtime.phase === 'manual' && !view.recordingMode
        ? '다음 상태'
        : '단디가 처리하고 있어요';

  return (
    <article className="product-panel consultation-workspace" aria-labelledby="consultation-title">
      <div className="product-panel__heading">
        <div>
          <p className="panel__eyebrow">은행 상담 업무</p>
          <h2 id="consultation-title">고객 상담 메모</h2>
        </div>
        <span className="case-id">{view.bootstrap.fixture.case.caseId}</span>
      </div>

      <div className="consultation-document">
        <div className="document-toolbar">
          <span>상담 기록</span>
          <strong>저장됨</strong>
        </div>
        <p>{view.bootstrap.fixture.case.sourceText}</p>
        <div className="detected-entities" aria-label="개인정보 유형">
          {['이름', '연락처', '계좌정보'].map((label, index) => (
            <span key={label} className={found > index ? 'is-found' : ''}>
              <b aria-hidden="true">{found > index ? '✓' : '·'}</b>{label}
            </span>
          ))}
        </div>
      </div>

      <div className="workspace-intent">
        <span aria-hidden="true">AI</span>
        <div><strong>상담 요약</strong><p>상담 목적과 다음 조치를 업무 양식으로 정리합니다.</p></div>
      </div>

      <button
        type="button"
        className="button-primary workspace-primary"
        disabled={isBusy}
        onClick={handlePrimary}
      >
        {buttonLabel}<span aria-hidden="true">→</span>
      </button>
    </article>
  );
}

function GatewayActivity({view, state}: {view: DemoRuntimeView; state: ProductState}) {
  const frame = view.timeline?.frame ?? 0;
  const currentIndex = stateIndex(state);
  const status = state === 'idle'
    ? 'AI 상담 요약을 요청하면 단디가 보호 흐름을 시작합니다'
    : state === 'detecting'
      ? COPY.workspace.detecting
      : state === 'protecting'
        ? COPY.workspace.protecting
        : state === 'generating'
          ? COPY.workspace.generating
          : state === 'inspecting'
            ? COPY.workspace.inspecting
            : state === 'complete'
              ? COPY.workspace.complete
              : '결과를 다시 확인하고 있어요';

  return (
    <section className="product-panel gateway-workspace" aria-labelledby="gateway-title">
      <div className="product-panel__heading">
        <div>
          <p className="panel__eyebrow">단디 보호 처리</p>
          <h2 id="gateway-title">AI 업무 보호 경로</h2>
        </div>
        <span className={state === 'idle' ? 'gateway-state' : 'gateway-state is-active'}>
          {state === 'idle' ? '대기' : state === 'complete' ? '처리 완료' : '처리 중'}
        </span>
      </div>

      <div className="gateway-core" aria-hidden="true">
        <span className="gateway-orbit gateway-orbit--outer" />
        <span className="gateway-orbit gateway-orbit--inner" />
        <span className="gateway-pulse" />
        <svg viewBox="0 0 64 64">
          <path d="M32 5 53 14v16c0 14-8.8 23.6-21 29C19.8 53.6 11 44 11 30V14z" />
          <path d="m22 32 7 7 14-17" />
        </svg>
      </div>

      <p className="gateway-message" aria-live="polite">{status}</p>

      <ol className="gateway-steps">
        {FLOW_STEPS.map(([key, label], index) => {
          const complete = state === 'complete' || state === 'withheld' || index < currentIndex;
          const active = key === state;
          return (
            <li key={key} className={complete ? 'is-complete' : active ? 'is-active' : ''}>
              <span aria-hidden="true">{complete ? '✓' : active ? '●' : '·'}</span>
              <strong>{label}</strong>
              <small>{complete ? '완료' : active ? '진행 중' : '대기'}</small>
            </li>
          );
        })}
      </ol>

      <div className="ai-route" data-testid="ai-activity" data-ai-state={state === 'generating' ? 'writing' : 'waiting'}>
        <span className="ai-route__mark" aria-hidden="true">AI</span>
        <div><strong>승인된 AI 업무 경로</strong><p>보호된 요청으로 상담 요약을 작성합니다.</p></div>
        <span className="ai-writing-dots" aria-hidden="true"><i /><i /><i /></span>
      </div>

      <progress max={899} value={Math.min(frame, 899)} aria-label="단디 보호 처리 진행률" />
    </section>
  );
}

function ResultWorkspace({view, state}: {view: DemoRuntimeView; state: ProductState}) {
  if (view.bootstrap.kind !== 'ready' || view.timeline === null) return null;
  const result = view.timeline.result;

  if (result?.kind === 'withheld') {
    return (
      <section className="product-panel result-workspace result-workspace--withheld">
        <BlockedResultPanel
          reason={result.reason}
          marker={view.bootstrap.fixture.blockReason.mutatedMarker}
          helpExpanded={result.helpExpanded}
          onPrevious={() => view.actions.goTo(610)}
          onHelp={() => view.actions.goTo(975)}
          onSuccess={() => view.actions.goTo(750)}
        />
      </section>
    );
  }

  const showResult = state === 'complete' && result?.kind === 'verified';
  const writing = state === 'generating';
  const inspecting = state === 'inspecting';

  return (
    <article className="product-panel result-workspace" aria-labelledby="result-title">
      <div className="product-panel__heading">
        <div>
          <p className="panel__eyebrow">AI 업무 결과</p>
          <h2 id="result-title">상담 요약</h2>
        </div>
        <span className={showResult ? 'result-state is-ready' : 'result-state'}>
          {showResult ? COPY.workspace.pass : writing ? '작성 중' : inspecting ? '응답 검사 중' : '결과 대기'}
        </span>
      </div>

      {showResult ? (
        <div className="product-result" data-testid="verified-result">
          <div className="product-result__success"><span aria-hidden="true">✓</span><div><strong>{COPY.workspace.complete}</strong><p>{COPY.workspace.completeDescription}</p></div></div>
          <dl>
            {result.fields.map((field) => (
              <div key={field.label} className={field.label === '직원이 확인할 항목' ? 'needs-review' : ''}>
                <dt>{field.label}</dt><dd>{field.value}</dd><dd className="result-evidence">{field.evidence}</dd>
              </div>
            ))}
          </dl>
          <div className="result-actions">
            <button type="button" className="button-primary" onClick={view.actions.replay}>{COPY.workspace.reset}</button>
            <button type="button" onClick={() => view.actions.goTo(945)}>{COPY.workspace.withheld}</button>
          </div>
        </div>
      ) : (
        <div className={writing ? 'result-preview is-writing' : inspecting ? 'result-preview is-inspecting' : 'result-preview'}>
          <div className="result-placeholder-icon" aria-hidden="true">AI</div>
          <strong>{writing ? COPY.workspace.generating : inspecting ? COPY.workspace.inspecting : 'AI 상담 요약이 여기에 표시됩니다'}</strong>
          <p>{inspecting ? '검사가 끝날 때까지 결과를 업무 화면에 표시하지 않습니다.' : '요청을 시작하면 상담 목적과 다음 조치를 정리합니다.'}</p>
          <div className="result-skeleton" aria-hidden="true"><i /><i /><i /><i /></div>
          {inspecting && <span className="inspection-scan" aria-hidden="true" />}
        </div>
      )}
    </article>
  );
}

export function ProductWorkspace({view}: {view: DemoRuntimeView}) {
  const state = productState(view);

  return (
    <section
      className="product-workspace"
      data-testid="product-workspace"
      data-product-state={state}
    >
      <header className="workspace-heading">
        <div>
          <p className="panel__eyebrow">상담 요약</p>
          <h1>{COPY.workspace.title}</h1>
          <p>{COPY.workspace.description}</p>
        </div>
        <span className="workspace-profile"><b aria-hidden="true">상</b> 상담업무 담당자</span>
      </header>
      <div className="product-workspace__grid">
        <ConsultationPanel view={view} state={state} />
        <GatewayActivity view={view} state={state} />
        <ResultWorkspace view={view} state={state} />
      </div>
    </section>
  );
}
