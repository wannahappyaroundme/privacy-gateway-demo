import {COPY} from '../content/copy';

type BlockedResultPanelProps = {
  reason: string;
  helpExpanded: boolean;
  onPrevious(): void;
  onHelp(): void;
  onSuccess(): void;
};

export function BlockedResultPanel({
  reason,
  helpExpanded,
  onPrevious,
  onHelp,
  onSuccess,
}: BlockedResultPanelProps) {
  return (
    <article className="panel blocked-result" data-testid="blocked-result">
      <div className="blocked-result__icon" aria-hidden="true">!</div>
      <p className="panel__eyebrow">{COPY.blocked.eyebrow}</p>
      <h2>{COPY.blocked.title}</h2>
      <p>{reason}</p>
      <div className="blocked-result__marker" aria-label="변형된 보호용 표시 예시">
        <span>보호용 표시 확인</span>
        <code>__FPG_ACCOUNT_0001</code>
        <strong>형태가 달라짐</strong>
      </div>

      {helpExpanded && (
        <ol className="help-steps">
          {COPY.blocked.helpSteps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      )}

      <div className="blocked-result__actions">
        <button type="button" onClick={onPrevious}>{COPY.blocked.previous}</button>
        <button type="button" onClick={onHelp}>{COPY.blocked.help}</button>
        <button type="button" className="button-primary" onClick={onSuccess}>{COPY.blocked.success}</button>
      </div>
    </article>
  );
}
