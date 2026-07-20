import {COPY} from '../content/copy';
import type {RouteState} from '../demo/state';

type PolicyBoundaryProps = {
  route: RouteState;
};

export function PolicyBoundary({route}: PolicyBoundaryProps) {
  const shown = route.externalState !== 'not-shown';

  return (
    <section className="flow-card boundary-panel">
      <div className="flow-card__header">
        <span className="flow-card__step">02</span>
        <div>
          <p>경로 선택</p>
          <h3>{COPY.panels.route}</h3>
        </div>
      </div>
      <div className="boundary-map">
        <div className={shown ? 'route-card route-card--closed' : 'route-card is-muted'}>
          <span className="route-card__icon" aria-hidden="true">×</span>
          <div>
            <b>{COPY.route.external}</b>
            <span>{shown ? COPY.route.externalState : '경로 확인 전'}</span>
          </div>
        </div>
        <div className={route.internalState === 'approved' ? 'route-card route-card--approved' : 'route-card is-muted'}>
          <span className="route-card__icon" aria-hidden="true">✓</span>
          <div>
            <b>{COPY.route.internal}</b>
            <span>{route.internalState === 'approved' ? COPY.route.internalState : '경로 확인 중'}</span>
          </div>
        </div>
      </div>
      <div className="payload-meter" aria-label={COPY.route.payloadState}>
        <span>외부 이동</span>
        <strong>{route.externalPayloadProgress}</strong>
        <small>{COPY.route.payloadState}</small>
      </div>
    </section>
  );
}
