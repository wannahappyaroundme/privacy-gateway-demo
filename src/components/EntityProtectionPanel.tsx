import {COPY} from '../content/copy';

type EntityProtectionPanelProps = {
  protectedText?: string;
  visible: boolean;
  requestBlocked: boolean;
};

export function EntityProtectionPanel({protectedText, visible, requestBlocked}: EntityProtectionPanelProps) {
  return (
    <section className="protected-comparison" data-testid="protected-comparison" aria-labelledby="protected-comparison-title">
      <div className="compact-heading">
        <strong id="protected-comparison-title">{COPY.functionalPrototype.protection.title}</strong>
        <span>
          {visible
            ? requestBlocked
              ? COPY.functionalPrototype.protection.requestStopped
              : COPY.functionalPrototype.protection.protected
            : COPY.functionalPrototype.gateway.states.waiting}
        </span>
      </div>
      {visible ? (
        requestBlocked ? (
          <p className="protected-comparison__message">
            {COPY.functionalPrototype.protection.requestBlockedMessage}
          </p>
        ) : (
          <p className="protected-text">{protectedText}</p>
        )
      ) : (
        <p className="protected-comparison__message">
          {COPY.functionalPrototype.protection.waitingMessage}
        </p>
      )}
    </section>
  );
}
