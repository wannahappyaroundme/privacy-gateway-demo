import {COPY} from '../content/copy';

type GapComparisonProps = {
  caseId: string;
  sourceText: string;
  summarySelected: boolean;
  onSummarize(): void;
};

export function GapComparison({
  caseId,
  sourceText,
  summarySelected,
  onSummarize,
}: GapComparisonProps) {
  return (
    <section className="gap-comparison" data-testid="gap-comparison">
      <article className="panel case-card gap-comparison__case">
        <div className="panel__heading">
          <div>
            <p className="panel__eyebrow">직원 업무</p>
            <h2>{COPY.panels.case}</h2>
          </div>
          <span className="case-id">{caseId}</span>
        </div>
        <p className="synthetic-label">
          <span aria-hidden="true">◆</span> {COPY.case.classification}
        </p>
        <section className="case-copy">
          <p className="case-copy__label">{COPY.case.sourceLabel}</p>
          <p>{sourceText}</p>
        </section>
        <button
          type="button"
          className={summarySelected ? 'source-action is-selected' : 'source-action'}
          aria-pressed={summarySelected}
          onClick={onSummarize}
        >
          {summarySelected ? '상담 정리 선택됨' : COPY.controls.summarize}
        </button>
      </article>

      <div className="gap-comparison__cards">
        {[COPY.problem.manual, COPY.problem.blockAll].map((problem, index) => (
          <article className="gap-card" key={problem}>
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <p className="panel__eyebrow">기존 방식 {index + 1}</p>
              <h2>{problem}</h2>
            </div>
          </article>
        ))}
        <p className="gap-comparison__core">{COPY.problem.core}</p>
      </div>
    </section>
  );
}
