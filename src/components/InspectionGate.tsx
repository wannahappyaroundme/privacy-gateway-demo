import {COPY} from '../content/copy';
import type {InspectionState} from '../demo/state';

type InspectionGateProps = {
  inspection: InspectionState;
};

export function InspectionGate({inspection}: InspectionGateProps) {
  const percent = Math.round(inspection.progress * 100);

  return (
    <section className="panel inspection-gate" data-testid="inspection-gate">
      <div className="inspection-gate__mark" aria-hidden="true">
        <svg viewBox="0 0 48 48"><path d="M24 4l16 7v12c0 10.5-6.7 17.2-16 21-9.3-3.8-16-10.5-16-21V11z" /><path d="M16 24l5 5 11-12" /></svg>
      </div>
      <p className="panel__eyebrow">결과 공개 전 마지막 단계</p>
      <h2>{COPY.inspection.title}</h2>
      <p className="inspection-gate__message">
        {inspection.complete ? COPY.inspection.complete : COPY.inspection.waiting}
      </p>
      <div
        className="inspection-gate__progress"
        role="progressbar"
        aria-label="결과 공개 전 검사 진행률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span style={{width: `${percent}%`}} />
      </div>
      <p className="inspection-gate__percent">전체 응답 확인 {percent}%</p>
      <div className="inspection-rules">
        <p className="inspection-rule inspection-rule--pass"><span>✓</span>{COPY.inspection.exact}</p>
        <p className="inspection-rule inspection-rule--withhold"><span>!</span>{COPY.inspection.changed}</p>
      </div>
    </section>
  );
}
