import {COPY} from '../content/copy';

type ResultField = Readonly<{
  label: string;
  value: string;
  evidence: string;
}>;

type VerifiedResultPanelProps = {
  fields: readonly ResultField[];
  onRetry(): void;
  onAnother(): void;
};

export function VerifiedResultPanel({fields, onRetry, onAnother}: VerifiedResultPanelProps) {
  return (
    <div className="product-result" data-testid="verified-result">
      <div className="product-result__success" role="status">
        <span aria-hidden="true">✓</span>
        <div><strong>{COPY.workspace.complete}</strong><p>{COPY.workspace.completeDescription}</p></div>
      </div>
      <dl aria-label="확인된 상담 요약 5개 항목">
        {fields.map((field) => (
          <div key={field.label} className={field.label === '직원이 확인할 항목' ? 'needs-review' : undefined}>
            <dt>{field.label}</dt>
            <dd>{field.value || '-'}</dd>
            <dd className="result-evidence">{field.evidence}</dd>
          </div>
        ))}
      </dl>
      <div className="result-actions">
        <button type="button" className="button-primary" onClick={onRetry}>{COPY.workspace.reset}</button>
        <button type="button" onClick={onAnother}>{COPY.workspace.another}</button>
      </div>
    </div>
  );
}
