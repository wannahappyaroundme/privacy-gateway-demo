import {COPY} from '../content/copy';
import {EvidenceStatusTable} from './EvidenceStatusTable';
import {ValidationPlan} from './ValidationPlan';

export function OverviewDashboard() {
  return (
    <section className="overview-dashboard" data-testid="overview-dashboard">
      <ol className="roundtrip-flow" aria-label="왕복 전체 보호 흐름">
        {COPY.finalFlow.map((step, index) => (
          <li key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{step}</strong>
            {index < COPY.finalFlow.length - 1 && <b aria-hidden="true">→</b>}
          </li>
        ))}
      </ol>
      <div className="overview-dashboard__grid">
        <EvidenceStatusTable />
        <ValidationPlan people={5} tasksPerPerson={10} />
      </div>
    </section>
  );
}
