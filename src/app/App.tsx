import {useEffect, useRef, useState} from 'react';

import rawFixture from '../demo/fixtures/synthetic-consultation-v1.json?raw';
import {nearestStopAtOrBefore} from '../demo/playback';
import {validateFixture} from '../demo/schema';
import type {TimelineState} from '../demo/state';
import {COPY} from '../content/copy';
import {BlockedResultPanel} from '../components/BlockedResultPanel';
import {DemoShell} from '../components/DemoShell';
import {EntityProtectionPanel} from '../components/EntityProtectionPanel';
import {EvidenceStatusTable} from '../components/EvidenceStatusTable';
import {GapComparison} from '../components/GapComparison';
import {InspectionDashboard} from '../components/InspectionDashboard';
import {InspectionGate} from '../components/InspectionGate';
import {OverviewDashboard} from '../components/OverviewDashboard';
import {PlaybackControls} from '../components/PlaybackControls';
import {PolicyBoundary} from '../components/PolicyBoundary';
import {ProtectionMatrix} from '../components/ProtectionMatrix';
import {StepRail} from '../components/StepRail';
import {SyntheticCaseCard} from '../components/SyntheticCaseCard';
import {ValidationPlan} from '../components/ValidationPlan';
import {VerifiedResultPanel} from '../components/VerifiedResultPanel';
import {VirtualPointer} from '../components/VirtualPointer';
import {
  DemoRuntime,
  type BootstrapState,
  type DemoRuntimeView,
} from './DemoRuntime';

function BootstrapMessage({bootstrap}: {bootstrap: BootstrapState}) {
  if (bootstrap.kind === 'loading') {
    return <section className="bootstrap-card" role="status"><span className="loading-ring" />{COPY.bootstrap.loading}</section>;
  }
  if (bootstrap.kind === 'empty') {
    return (
      <section className="bootstrap-card">
        <h1>{COPY.bootstrap.emptyTitle}</h1>
        <p>{COPY.bootstrap.emptyDescription}</p>
        <button type="button" onClick={() => window.location.reload()}>{COPY.bootstrap.emptyAction}</button>
      </section>
    );
  }
  return (
    <section className="bootstrap-card" role="alert">
      <h1>{COPY.bootstrap.invalidTitle}</h1>
      <p>{COPY.bootstrap.invalidDescription}</p>
      <button type="button" onClick={() => window.location.reload()}>{COPY.bootstrap.invalidAction}</button>
    </section>
  );
}

function StartCard({onStart}: {onStart(): void}) {
  return (
    <section className="start-layout" data-testid="demo-start">
      <div className="start-copy">
        <p className="start-copy__eyebrow">합성 상담 사례로 확인하는 보호 흐름</p>
        <h1>상담요약은 이어가고,<br /><span>고객정보는 내부에 남깁니다</span></h1>
        <p>{COPY.product.introduction}</p>
        <div className="start-flow" aria-label="시연 흐름">
          {COPY.finalFlow.map((step, index) => (
            <span key={step}>{step}{index < COPY.finalFlow.length - 1 && <b aria-hidden="true">→</b>}</span>
          ))}
        </div>
      </div>
      <div className="start-card">
        <div className="start-card__clock" aria-hidden="true">30</div>
        <p className="start-card__label">30초 시연</p>
        <h2>화면 녹화 준비가 되셨나요?</h2>
        <p>화면 녹화를 시작한 뒤 시연 버튼을 눌러주세요</p>
        <button type="button" className="button-primary start-button" onClick={onStart}>
          시연 시작 <span aria-hidden="true">→</span>
        </button>
        <small>3초 준비 뒤 자동으로 시작합니다</small>
      </div>
    </section>
  );
}

function Countdown({label}: {label: '3' | '2' | '1'}) {
  return (
    <section className="countdown-layout" aria-live="assertive">
      <p>시연을 준비하고 있어요</p>
      <strong data-testid="countdown" aria-hidden="true">{label}</strong>
      <span aria-hidden="true">곧 30초 안내가 시작됩니다</span>
    </section>
  );
}

function SceneHeading({timeline}: {timeline: TimelineState}) {
  const sceneNumber = timeline.frame < 900 ? Math.min(8, Math.floor(timeline.frame / 110) + 1) : 9;
  return (
    <div className="scene-heading">
      <span>{String(sceneNumber).padStart(2, '0')}</span>
      <h1>{timeline.accessibilityStatus}</h1>
    </div>
  );
}

function LiveRegion({view}: {view: DemoRuntimeView}) {
  const [message, setMessage] = useState('');
  const previous = useRef<{
    phase: DemoRuntimeView['runtime']['phase'];
    result: TimelineState['result'] | null;
    helpExpanded: boolean;
  } | null>(null);

  useEffect(() => {
    const current = {
      phase: view.runtime.phase,
      result: view.timeline?.result ?? null,
      helpExpanded: Boolean(view.timeline?.result?.kind === 'withheld' && view.timeline.result.helpExpanded),
    };
    const before = previous.current;
    previous.current = current;
    if (before === null || view.timeline === null) return;

    if (current.phase === 'complete' && before.phase !== 'complete') {
      setMessage('시연이 끝났어요. 마지막 검증 상태를 확인할 수 있어요.');
    } else if (current.result?.kind === 'verified' && before.result?.kind !== 'verified') {
      setMessage('전체 응답 확인이 끝나 결과를 보여드립니다.');
    } else if (current.result?.kind === 'withheld' && before.result?.kind !== 'withheld') {
      setMessage('보호용 표시가 달라 결과를 표시하지 않았어요.');
    } else if (current.helpExpanded && !before.helpExpanded) {
      setMessage('직접 작성으로 이어가는 다음 행동을 보여드립니다.');
    } else if (current.phase === 'paused' && before.phase !== 'paused') {
      setMessage('시연을 일시정지했습니다.');
    } else if (current.phase === 'manual' && before.phase !== 'manual') {
      setMessage('수동 단계 보기로 전환했습니다.');
    }
  }, [view.runtime.phase, view.timeline]);

  return <p className="sr-only" data-testid="live-region" aria-live="polite" aria-atomic="true">{message}</p>;
}

function FinishView({timeline}: {timeline: TimelineState}) {
  return (
    <section className="finish-view">
      <ol className="roundtrip-flow" aria-label="왕복 전체 보호 흐름">
        {COPY.finalFlow.map((step, index) => (
          <li key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{step}</strong>
            {index < COPY.finalFlow.length - 1 && <b aria-hidden="true">→</b>}
          </li>
        ))}
      </ol>
      <div className="finish-grid">
        <EvidenceStatusTable />
        <ValidationPlan people={timeline.validation.people} tasksPerPerson={timeline.validation.tasksPerPerson} />
      </div>
    </section>
  );
}

function Workbench({
  view,
  manualOnly,
}: {
  view: DemoRuntimeView;
  manualOnly: boolean;
}) {
  const {bootstrap, runtime, timeline, recordingMode, actions} = view;
  if (bootstrap.kind !== 'ready' || timeline === null) return <BootstrapMessage bootstrap={bootstrap} />;

  const manualMode = runtime.phase === 'manual';
  const manualStop = nearestStopAtOrBefore(timeline.frame);
  const finish = timeline.scene === 'finish';
  const withheldResult = timeline.result?.kind === 'withheld' ? timeline.result : null;

  return (
    <>
      {!withheldResult && (
        <PlaybackControls
          phase={runtime.phase}
          elapsedMs={runtime.elapsedMs}
          recordingMode={recordingMode}
          manualOnly={manualOnly}
          onPause={actions.pause}
          onResume={actions.resume}
          onReplay={actions.replay}
          onPrevious={actions.previous}
          onNext={actions.next}
          onManual={() => actions.goTo(manualStop)}
          onBlockExample={() => actions.goTo(945)}
        />
      )}

      {!finish && <StepRail frame={timeline.frame} onSelect={actions.goTo} />}

      {runtime.phase === 'complete' && (
        <section className="end-banner">
          <div><span aria-hidden="true">✓</span><div><h2>시연이 끝났어요</h2><p>마지막 검증 상태를 확인한 뒤 다시 보거나 차단 사례를 살펴보세요.</p></div><output className="end-banner__time" data-testid="elapsed-time" aria-label="시연 경과 시간">00:30 / 00:30</output></div>
          <div className="end-banner__actions">
            <button type="button" data-testid="replay-demo" className="button-primary" onClick={actions.replay}>다시 시연</button>
            <button type="button" onClick={() => actions.goTo(945)}>확인이 필요한 경우</button>
          </div>
        </section>
      )}

      {manualMode && !recordingMode && <p className="manual-notice">{COPY.bootstrap.reducedMotion}</p>}

      <SceneHeading timeline={timeline} />

      {finish ? (
        <FinishView timeline={timeline} />
      ) : withheldResult !== null ? (
        <section className="blocked-layout">
          <InspectionGate inspection={timeline.inspection} />
          <BlockedResultPanel
            reason={withheldResult.reason}
            helpExpanded={withheldResult.helpExpanded}
            onPrevious={() => actions.goTo(610)}
            onHelp={() => actions.goTo(975)}
            onSuccess={() => actions.goTo(750)}
          />
        </section>
      ) : timeline.scene === 'overview' ? (
        <OverviewDashboard />
      ) : timeline.scene === 'gap' ? (
        <GapComparison
          caseId={bootstrap.fixture.case.caseId}
          sourceText={bootstrap.fixture.case.sourceText}
          summarySelected={timeline.summarySelected}
          onSummarize={() => actions.goTo(225)}
        />
      ) : timeline.scene === 'protect' ? (
        <ProtectionMatrix progress={timeline.entityProtection} />
      ) : timeline.scene === 'inspect' ? (
        <InspectionDashboard inspection={timeline.inspection} />
      ) : (
        <section className="workbench-grid">
          <SyntheticCaseCard
            caseId={bootstrap.fixture.case.caseId}
            sourceText={bootstrap.fixture.case.sourceText}
            protectedText={bootstrap.fixture.case.protectedText}
            scene={timeline.scene}
            summarySelected={timeline.summarySelected}
            detectionProgress={timeline.detectionProgress}
            stageScrollY={timeline.stageScrollY}
            onSummarize={() => actions.goTo(225)}
          />
          <div className="protection-column">
            <EntityProtectionPanel progress={timeline.entityProtection} detectionProgress={timeline.detectionProgress} />
            <PolicyBoundary route={timeline.route} />
          </div>
          {timeline.result?.kind === 'verified' ? (
            <VerifiedResultPanel fields={timeline.result.fields} revealProgress={timeline.resultRevealProgress} />
          ) : (
            <InspectionGate inspection={timeline.inspection} />
          )}
        </section>
      )}

      {!recordingMode && !manualOnly && runtime.phase !== 'idle' && runtime.phase !== 'countdown' && timeline.pointer.visible && (
        <VirtualPointer pointer={timeline.pointer} />
      )}
      {recordingMode && <VirtualPointer pointer={timeline.pointer} />}
    </>
  );
}

function useStickyManualOnly() {
  const requiresManualOnly = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 768;
  const [manualOnly, setManualOnly] = useState(requiresManualOnly);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      if (requiresManualOnly()) setManualOnly(true);
    };
    update();
    window.addEventListener('resize', update);
    media.addEventListener('change', update);
    return () => {
      window.removeEventListener('resize', update);
      media.removeEventListener('change', update);
    };
  }, []);

  return manualOnly;
}

export function App() {
  const [bootstrap, setBootstrap] = useState<BootstrapState>(() =>
    rawFixture.trim().length === 0 ? {kind: 'empty'} : {kind: 'loading'},
  );

  useEffect(() => {
    let active = true;
    if (rawFixture.trim().length === 0) return;
    validateFixture(rawFixture)
      .then((fixture) => {
        if (active) setBootstrap({kind: 'ready', fixture});
      })
      .catch((error: unknown) => {
        const type = error instanceof Error ? error.name : 'UnknownError';
        console.error('demo-bootstrap', {type, rule: 'fixture-validation'});
        if (active) setBootstrap({kind: 'invalid', rule: 'fixture-validation'});
      });
    return () => { active = false; };
  }, []);

  const manualOnly = useStickyManualOnly();

  return (
    <DemoRuntime bootstrap={bootstrap} manualOnly={manualOnly}>
      {(view) => (
        <DemoShell frame={view.runtime.frame} recordingMode={view.recordingMode}>
          <LiveRegion view={view} />
          {view.bootstrap.kind !== 'ready' ? (
            <BootstrapMessage bootstrap={view.bootstrap} />
          ) : view.runtime.phase === 'idle' && !view.recordingMode ? (
            <StartCard onStart={view.actions.start} />
          ) : view.runtime.phase === 'countdown' && view.runtime.countdownLabel !== null ? (
            <Countdown label={view.runtime.countdownLabel} />
          ) : (
            <Workbench view={view} manualOnly={manualOnly} />
          )}
        </DemoShell>
      )}
    </DemoRuntime>
  );
}
