import type {InspectionCheck} from '../prototype/inspect';

type InspectionDashboardProps = {
  checks: readonly InspectionCheck[];
};

const CHECK_LABELS: Readonly<Record<InspectionCheck['code'], string>> = {
  OUTPUT_SCHEMA: '결과 형식',
  MARKER_INTEGRITY: '보호용 표시',
  RAW_RESIDUE: '원문 흔적',
  SOURCE_GROUNDING: '입력 근거',
  FINANCIAL_DECISION: '금융 판단 제외',
};

const STATUS_LABELS: Readonly<Record<InspectionCheck['status'], string>> = {
  'not-run': '대기',
  pass: '확인',
  fail: '확인 필요',
};

export function InspectionDashboard({checks}: InspectionDashboardProps) {
  return (
    <section className="inspection-compact" aria-labelledby="inspection-compact-title">
      <div className="compact-heading">
        <strong id="inspection-compact-title">5개 결과 검사</strong>
        <span>{checks.filter(({status}) => status === 'pass').length}/5 확인</span>
      </div>
      <ul className="inspection-compact__list">
        {checks.map((check, index) => (
          <li key={check.code} data-testid="inspection-check" data-check-status={check.status}>
            <span aria-hidden="true">{check.status === 'pass' ? '✓' : check.status === 'fail' ? '!' : index + 1}</span>
            <strong>{CHECK_LABELS[check.code]}</strong>
            <small>{STATUS_LABELS[check.status]}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
