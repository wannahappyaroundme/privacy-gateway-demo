import {useEffect, useRef, useState} from 'react';

import rawFixture from '../demo/fixtures/synthetic-consultation-v1.json?raw';
import {validateFixture} from '../demo/schema';
import type {TimelineResult} from '../demo/state';
import {COPY} from '../content/copy';
import {DemoShell} from '../components/DemoShell';
import {ProductWorkspace} from '../components/ProductWorkspace';
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

function LiveRegion({view}: {view: DemoRuntimeView}) {
  const [message, setMessage] = useState('');
  const previous = useRef<{
    phase: DemoRuntimeView['runtime']['phase'];
    result: TimelineResult;
  } | null>(null);

  useEffect(() => {
    const current = {
      phase: view.runtime.phase,
      result: view.timeline?.result ?? null,
    };
    const before = previous.current;
    previous.current = current;
    if (before === null || view.timeline === null) return;

    if (current.phase === 'playing' && before.phase === 'idle') {
      setMessage('단디가 상담 메모의 개인정보 보호 처리를 시작했습니다.');
    } else if (current.phase === 'complete' && before.phase !== 'complete') {
      setMessage('상담 요약이 준비되었습니다. 확인된 결과를 표시합니다.');
    } else if (current.result?.kind === 'withheld' && before.result?.kind !== 'withheld') {
      setMessage('확인이 필요한 결과는 표시하지 않았습니다.');
    } else if (current.phase === 'paused' && before.phase !== 'paused') {
      setMessage('처리가 일시정지되었습니다. 계속 진행 버튼으로 이어갈 수 있습니다.');
    }
  }, [view.runtime.phase, view.timeline]);

  return <p className="sr-only" data-testid="live-region" aria-live="polite" aria-atomic="true">{message}</p>;
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
          {view.bootstrap.kind === 'ready'
            ? <ProductWorkspace view={view} />
            : <BootstrapMessage bootstrap={view.bootstrap} />}
        </DemoShell>
      )}
    </DemoRuntime>
  );
}
