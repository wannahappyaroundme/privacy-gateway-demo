import {COPY} from '../content/copy';

type BlockedResultPanelProps = {
  kind: 'request' | 'response' | 'recoverable';
  onNormal(): void;
  onAnother(): void;
  onRetry(): void;
};

export function BlockedResultPanel({kind, onNormal, onAnother, onRetry}: BlockedResultPanelProps) {
  const isRequest = kind === 'request';
  const isRecoverable = kind === 'recoverable';
  const title = isRecoverable
    ? COPY.workspace.recoverableTitle
    : isRequest
      ? COPY.blocked.requestTitle
      : COPY.blocked.responseTitle;
  const description = isRecoverable
    ? COPY.workspace.recoverableDescription
    : isRequest
      ? COPY.blocked.requestDescription
      : COPY.blocked.responseDescription;

  return (
    <article
      className={`result-state-card result-state-card--${kind}`}
      data-testid={isRecoverable ? 'recoverable-result' : isRequest ? 'request-blocked-result' : 'response-withheld-result'}
      role="status"
    >
      <div className="result-state-card__icon" aria-hidden="true">{isRecoverable ? '↻' : '!'}</div>
      <p className="panel__eyebrow">
        {isRecoverable
          ? COPY.functionalPrototype.recoverableEyebrow
          : isRequest
            ? COPY.blocked.requestEyebrow
            : COPY.blocked.responseEyebrow}
      </p>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="result-state-card__actions">
        <button type="button" onClick={onNormal}>{COPY.workspace.normal}</button>
        <button type="button" onClick={onAnother}>{COPY.workspace.another}</button>
        <button type="button" className="button-primary" onClick={onRetry}>{COPY.workspace.reset}</button>
      </div>
    </article>
  );
}
