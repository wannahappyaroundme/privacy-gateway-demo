import {COPY} from '../content/copy';

export function EvidenceStatusTable() {
  const rows = [
    [COPY.evidence.storageLabel, COPY.evidence.storageValue],
    [COPY.evidence.serverLabel, COPY.evidence.serverValue],
    [COPY.evidence.externalLabel, COPY.evidence.externalValue],
    [COPY.evidence.executionLabel, COPY.evidence.executionValue],
  ] as const;

  return (
    <section className="evidence-compact" data-testid="evidence-status" aria-labelledby="evidence-title">
      <div className="compact-heading">
        <strong id="evidence-title">{COPY.functionalPrototype.evidence.title}</strong>
        <span>{COPY.functionalPrototype.evidence.currentSurface}</span>
      </div>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt><span aria-hidden="true">✓</span>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
