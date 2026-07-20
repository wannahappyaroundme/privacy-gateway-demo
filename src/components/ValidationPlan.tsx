import {COPY} from '../content/copy';

type ValidationPlanProps = {
  people: number;
  tasksPerPerson: number;
};

export function ValidationPlan({people, tasksPerPerson}: ValidationPlanProps) {
  const complete = people === 5 && tasksPerPerson === 10;
  const peopleLabel = complete ? COPY.validation.people : `현업 대표 ${people}명`;
  const taskLabel = complete ? COPY.validation.tasks : `1인당 합성 과업 ${tasksPerPerson}건`;

  return (
    <section className="validation-plan">
      <div>
        <p className="panel__eyebrow">실측 전 교차시험 설계</p>
        <h2>{COPY.validation.title}</h2>
        <p>{COPY.validation.comparison}</p>
      </div>
      <div className="validation-numbers">
        <p><strong>{peopleLabel}</strong></p>
        <span aria-hidden="true">×</span>
        <p><strong>{taskLabel}</strong></p>
      </div>
      <p className="validation-measures">측정: {COPY.validation.measures.join(' · ')}</p>
    </section>
  );
}
