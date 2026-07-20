import {COPY} from '../content/copy';

export function EvidenceStatusTable() {
  const rows = [
    [COPY.evidence.externalLabel, COPY.evidence.externalValue],
    [COPY.evidence.beforeInspectionLabel, COPY.evidence.beforeInspectionValue],
    [COPY.evidence.operationalLabel, COPY.evidence.operationalValue],
  ] as const;

  return (
    <section className="evidence-table" data-testid="evidence-status">
      <p className="panel__eyebrow">원문 없는 상태표</p>
      <h2>{COPY.panels.evidence}</h2>
      <dl>
        {rows.map(([label, value], index) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd><span aria-hidden="true">{index === 0 ? '○' : index === 1 ? '✓' : '◇'}</span>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
