import {COPY} from '../content/copy';

type SyntheticCaseCardProps = {
  caseId: string;
  sourceText: string;
  protectedText: string;
  scene: string;
  summarySelected: boolean;
  detectionProgress: number;
  stageScrollY: number;
  onSummarize(): void;
};

const ENTITY_LABELS = [
  {type: '이름', value: '가상고객-A'},
  {type: '연락처', value: '합성연락처-001'},
  {type: '계좌', value: '합성계좌-001'},
] as const;

export function SyntheticCaseCard({
  caseId,
  sourceText,
  protectedText,
  scene,
  summarySelected,
  detectionProgress,
  stageScrollY,
  onSummarize,
}: SyntheticCaseCardProps) {
  const showProtected = ['protect', 'route', 'inspect', 'result'].includes(scene);
  const showGap = scene === 'gap';

  return (
    <article className="panel case-card">
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

      <div className="case-card__viewport">
        <div className="case-card__scroll" style={{transform: `translateY(${stageScrollY}px)`}}>
          <section className="case-copy">
            <p className="case-copy__label">{showProtected ? COPY.case.protectedLabel : COPY.case.sourceLabel}</p>
            <p>{showProtected ? protectedText : sourceText}</p>
          </section>

          {showGap && (
            <div className="problem-cards">
              <p><span>1</span>{COPY.problem.manual}</p>
              <p><span>2</span>{COPY.problem.blockAll}</p>
            </div>
          )}

          {(scene === 'detect' || scene === 'protect') && (
            <div className="entity-list" aria-label="합성 정보 유형">
              {ENTITY_LABELS.map((entity, index) => (
                <span
                  key={entity.type}
                  className={detectionProgress * 3 > index ? 'entity-chip is-found' : 'entity-chip'}
                >
                  <b>{entity.type}</b>{entity.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        className={summarySelected ? 'source-action is-selected' : 'source-action'}
        aria-pressed={summarySelected}
        onClick={onSummarize}
      >
        {summarySelected ? '상담 정리 선택됨' : COPY.controls.summarize}
      </button>
    </article>
  );
}
