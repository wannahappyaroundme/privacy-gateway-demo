import {COPY} from '../content/copy';

type ValidationPlanProps = {
  people: number;
  tasksPerPerson: number;
};

export function ValidationPlan({people, tasksPerPerson}: ValidationPlanProps) {
  return (
    <section
      className="validation-plan"
      data-plan-people={people}
      data-plan-tasks-per-person={tasksPerPerson}
    >
      <div>
        <p className="panel__eyebrow">실측 전 교차시험 설계</p>
        <h2>{COPY.validation.title}</h2>
        <p>{COPY.validation.comparison}</p>
      </div>
      <div className="validation-numbers">
        <p><strong>{COPY.validation.people}</strong></p>
        <span aria-hidden="true">×</span>
        <p><strong>{COPY.validation.tasks}</strong></p>
      </div>
      <p className="validation-measures">측정: {COPY.validation.measures.join(' · ')}</p>
      <p className="validation-status"><span aria-hidden="true">i</span> 아직 검증하지 않은 계획입니다 <strong>{COPY.evidence.operationalValue}</strong></p>
    </section>
  );
}
