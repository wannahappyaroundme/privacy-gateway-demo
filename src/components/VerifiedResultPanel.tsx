import {COPY} from '../content/copy';
type ResultField = Readonly<{
  label: string;
  value: string;
  evidence: string;
}>;

type VerifiedResultPanelProps = {
  fields: readonly ResultField[];
  revealProgress: number;
};

export function VerifiedResultPanel({fields, revealProgress}: VerifiedResultPanelProps) {
  return (
    <article
      className="panel verified-result"
      data-testid="verified-result"
      style={{opacity: Math.max(0.2, revealProgress)}}
    >
      <div className="verified-result__heading">
        <div>
          <p className="panel__eyebrow">전체 응답 검사 완료</p>
          <h2>확인된 상담요약</h2>
        </div>
        <span className="verified-result__status"><span aria-hidden="true">✓</span> 결과 공개</span>
      </div>
      <dl className="result-fields" aria-label="확인된 상담요약 5개 항목">
        {fields.map((field) => (
          <div key={field.label} className={field.label === '직원이 확인할 항목' ? 'result-field result-field--review' : 'result-field'}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
            <dd className="result-field__evidence">{field.evidence}</dd>
          </div>
        ))}
      </dl>
      <p className="result-effect">{COPY.resultEffect}</p>
    </article>
  );
}
