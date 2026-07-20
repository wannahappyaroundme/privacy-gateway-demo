import {COPY} from '../content/copy';
import type {InspectionState} from '../demo/state';
import {InspectionGate} from './InspectionGate';

type InspectionDashboardProps = {
  inspection: InspectionState;
};

const PRE_DISCLOSURE_THRESHOLDS = [0.1, 0.2, 0.3, 0.4, 0.5] as const;

export function InspectionDashboard({inspection}: InspectionDashboardProps) {
  const completedCount = inspection.complete
    ? COPY.inspection.checks.length
    : PRE_DISCLOSURE_THRESHOLDS.filter((threshold) => inspection.progress >= threshold).length;
  const activeIndex = inspection.complete
    ? -1
    : Math.min(completedCount, COPY.inspection.checks.length - 1);
  const percent = Math.round(inspection.progress * 100);

  return (
    <section className="inspection-dashboard" data-testid="inspection-dashboard">
      <article className="panel inspection-progress-card">
        <div className="inspection-progress-card__heading">
          <div>
            <p className="panel__eyebrow">검사 진행</p>
            <h2>전체 응답 확인</h2>
          </div>
          <strong aria-label={`${percent}% 진행`}>{percent}<small>%</small></strong>
        </div>
        <div
          className="inspection-progress-card__bar"
          role="progressbar"
          aria-label="전체 응답 검사 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <span style={{width: `${percent}%`}} />
        </div>
        <ol className="inspection-progress-list">
          {COPY.inspection.checks.map(([label], index) => {
            const complete = index < completedCount;
            const active = index === activeIndex;
            return (
              <li key={label} className={complete ? 'is-complete' : active ? 'is-active' : undefined}>
                <span aria-hidden="true">{complete ? '✓' : String(index + 1)}</span>
                <div>
                  <b>{label}</b>
                  <small>{complete ? '통과' : active ? '검사 중' : '검사 대기'}</small>
                </div>
              </li>
            );
          })}
        </ol>
      </article>

      <article className="panel inspection-detail-card">
        <div className="inspection-detail-card__heading">
          <div>
            <p className="panel__eyebrow">현재까지 요약</p>
            <h2>6개 공개 조건을 순서대로 확인합니다</h2>
          </div>
          <span>{completedCount}/6 통과</span>
        </div>
        <div className="inspection-summary" aria-label="검사 상태 요약">
          <p><span aria-hidden="true">✓</span><strong>{completedCount}</strong> 통과</p>
          <p><span aria-hidden="true">!</span><strong>0</strong> 위험</p>
          <p><span aria-hidden="true">×</span><strong>0</strong> 차단</p>
          <p><span aria-hidden="true">…</span><strong>{inspection.complete ? 0 : 1}</strong> 검사 중</p>
        </div>
        <div className="inspection-check-table" role="list" aria-label="전체 응답 검사 상세">
          {COPY.inspection.checks.map(([label, description], index) => {
            const complete = index < completedCount;
            const active = index === activeIndex;
            return (
              <div
                key={label}
                role="listitem"
                data-testid="inspection-check"
                className={complete ? 'is-complete' : active ? 'is-active' : undefined}
              >
                <span className="inspection-check-table__icon" aria-hidden="true">
                  {complete ? '✓' : active ? '…' : String(index + 1)}
                </span>
                <div><b>{label}</b><small>{description}</small></div>
                <strong>{complete ? '통과' : active ? '검사 중' : '대기'}</strong>
              </div>
            );
          })}
        </div>
        <p className="inspection-demo-note">{COPY.inspection.fixedDemoNotice}</p>
      </article>

      <InspectionGate inspection={inspection} />
    </section>
  );
}
