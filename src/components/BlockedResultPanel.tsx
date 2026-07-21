import {COPY} from '../content/copy';

type BlockedResultPanelProps = {
  reason: string;
  marker: string;
  helpExpanded: boolean;
  onPrevious(): void;
  onHelp(): void;
  onSuccess(): void;
};

export function BlockedResultPanel({
  reason,
  marker,
  helpExpanded,
  onPrevious,
  onHelp,
  onSuccess,
}: BlockedResultPanelProps) {
  return (
    <article className="panel blocked-result" data-testid="blocked-result">
      <header className="blocked-result__header">
        <div className="blocked-result__icon" aria-hidden="true">!</div>
        <div>
          <p className="panel__eyebrow">{COPY.blocked.eyebrow}</p>
          <h2>{COPY.blocked.title}</h2>
        </div>
      </header>
      <div className="blocked-result__reason">
        <strong>결과를 표시하지 않은 이유</strong>
        <p>{reason}</p>
      </div>
      <div className="blocked-result__marker" aria-label="변형된 보호용 표시 예시">
        <span>보호용 표시 확인</span>
        <code>{marker}</code>
        <strong>형태가 달라짐</strong>
      </div>

      <section className="blocked-result__next" aria-labelledby="blocked-next-title">
        <strong id="blocked-next-title">다음 행동</strong>
        <p>이전 단계를 확인하거나 확인된 내용만 직접 작성해 이어갈 수 있어요.</p>
        {helpExpanded && (
          <ol className="help-steps">
            {COPY.blocked.helpSteps.map((step, index) => (
              <li key={step}><span aria-hidden="true">{index + 1}</span>{step}</li>
            ))}
          </ol>
        )}
      </section>

      <div className="blocked-result__actions">
        <button type="button" onClick={onPrevious}>{COPY.blocked.previous}</button>
        <button type="button" onClick={onHelp}>{COPY.blocked.help}</button>
        <button type="button" className="button-primary" onClick={onSuccess}>{COPY.blocked.success}</button>
      </div>
    </article>
  );
}
