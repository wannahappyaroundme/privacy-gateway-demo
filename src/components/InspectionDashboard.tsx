import type {InspectionCheck} from '../prototype/inspect';
import {COPY} from '../content/copy';

type InspectionDashboardProps = {
  checks: readonly InspectionCheck[];
};

const CHECK_LABELS: Readonly<Record<InspectionCheck['code'], string>> = {
  OUTPUT_SCHEMA: COPY.functionalPrototype.inspection.checkLabels.outputSchema,
  MARKER_INTEGRITY: COPY.functionalPrototype.inspection.checkLabels.markerIntegrity,
  RAW_RESIDUE: COPY.functionalPrototype.inspection.checkLabels.rawResidue,
  SOURCE_GROUNDING: COPY.functionalPrototype.inspection.checkLabels.sourceGrounding,
  FINANCIAL_DECISION: COPY.functionalPrototype.inspection.checkLabels.financialDecision,
};

const STATUS_LABELS: Readonly<Record<InspectionCheck['status'], string>> = {
  'not-run': COPY.functionalPrototype.inspection.statuses.waiting,
  pass: COPY.functionalPrototype.inspection.statuses.pass,
  fail: COPY.functionalPrototype.inspection.statuses.fail,
};

export function InspectionDashboard({checks}: InspectionDashboardProps) {
  return (
    <section className="inspection-compact" aria-labelledby="inspection-compact-title">
      <div className="compact-heading">
        <strong id="inspection-compact-title">{COPY.functionalPrototype.inspection.title}</strong>
        <span>
          {checks.filter(({status}) => status === 'pass').length}/5 {COPY.functionalPrototype.inspection.confirmed}
        </span>
      </div>
      <ul className="inspection-compact__list">
        {checks.map((check, index) => (
          <li key={check.code} data-testid="inspection-check" data-check-status={check.status}>
            <span aria-hidden="true">{check.status === 'pass' ? '✓' : check.status === 'fail' ? '!' : index + 1}</span>
            <strong>{CHECK_LABELS[check.code]}</strong>
            <small>{STATUS_LABELS[check.status]}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
