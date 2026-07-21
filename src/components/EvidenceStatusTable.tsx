import {COPY} from '../content/copy';

export function EvidenceStatusTable() {
  const rows = [
    [COPY.evidence.externalLabel, COPY.evidence.externalValue, 'link'],
    [COPY.evidence.beforeInspectionLabel, COPY.evidence.beforeInspectionValue, 'hidden'],
    [COPY.evidence.operationalLabel, COPY.evidence.operationalValue, 'planned'],
  ] as const;

  return (
    <section className="evidence-table" data-testid="evidence-status">
      <p className="panel__eyebrow">원문 없는 상태표</p>
      <h2>{COPY.panels.evidence}</h2>
      <dl>
        {rows.map(([label, value, state]) => (
          <div key={label} className={`evidence-row evidence-row--${state}`}>
            <dt>
              <span className="evidence-row__icon" aria-hidden="true">
                {state === 'link' ? '×' : state === 'hidden' ? '✓' : 'i'}
              </span>
              {label}
            </dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
