import type {ReactNode} from 'react';

import type {SyntheticCase} from '../prototype/contracts';
import type {SyntheticDetection} from '../prototype/protect';
import {COPY} from '../content/copy';

type SyntheticCaseCardProps = {
  cases: readonly SyntheticCase[];
  selectedCase: SyntheticCase;
  detections: readonly SyntheticDetection[];
  highlightsVisible: boolean;
  actionLabel: string;
  actionDisabled: boolean;
  manualStep: number | null;
  onCaseChange(caseId: string): void;
  onAction(): void;
};

const TYPE_LABELS = COPY.functionalPrototype.case.typeLabels;

function HighlightedSource({
  sourceText,
  detections,
  visible,
}: {
  sourceText: string;
  detections: readonly SyntheticDetection[];
  visible: boolean;
}) {
  if (!visible) return <>{sourceText}</>;

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const detection of detections) {
    parts.push(sourceText.slice(cursor, detection.start));
    parts.push(
      <mark key={`${detection.type}-${detection.start}`} className={`source-highlight source-highlight--${detection.action}`}>
        {detection.rawValue}
      </mark>,
    );
    cursor = detection.end;
  }
  parts.push(sourceText.slice(cursor));
  return <>{parts}</>;
}

export function SyntheticCaseCard({
  cases,
  selectedCase,
  detections,
  highlightsVisible,
  actionLabel,
  actionDisabled,
  manualStep,
  onCaseChange,
  onAction,
}: SyntheticCaseCardProps) {
  return (
    <article className="product-panel consultation-workspace" aria-labelledby="consultation-title">
      <div className="product-panel__heading">
        <div>
          <p className="panel__eyebrow">{COPY.functionalPrototype.case.eyebrow}</p>
          <h2 id="consultation-title">{COPY.functionalPrototype.case.title}</h2>
        </div>
        <span className="case-id">{selectedCase.caseId}</span>
      </div>

      <label className="case-selector">
        <span>{COPY.functionalPrototype.case.selector}</span>
        <select value={selectedCase.caseId} onChange={(event) => onCaseChange(event.target.value)}>
          {cases.map((item) => <option key={item.caseId} value={item.caseId}>{item.label}</option>)}
        </select>
      </label>

      <div className="consultation-document">
        <div className="document-toolbar">
          <span>{COPY.functionalPrototype.case.sourceDisclosure}</span>
          <strong>{COPY.functionalPrototype.case.syntheticNotice}</strong>
        </div>
        <p>
          <HighlightedSource
            sourceText={selectedCase.sourceText}
            detections={detections}
            visible={highlightsVisible}
          />
        </p>
        <div className="detected-entities" aria-label={COPY.functionalPrototype.case.detectedTypesLabel}>
          {detections.map((detection) => (
            <span key={`${detection.type}-${detection.start}`} className={highlightsVisible ? 'is-found' : ''}>
              <b aria-hidden="true">{highlightsVisible ? '✓' : '·'}</b>
              {TYPE_LABELS[detection.type]}
            </span>
          ))}
        </div>
      </div>

      <div className="workspace-intent">
        <span aria-hidden="true">{COPY.functionalPrototype.case.summaryIcon}</span>
        <div>
          <strong>{COPY.functionalPrototype.case.summaryTitle}</strong>
          <p>{COPY.functionalPrototype.case.summaryDescription}</p>
        </div>
      </div>

      {manualStep !== null && (
        <p className="manual-progress">
          <span>{COPY.functionalPrototype.case.manualProgress}</span>
          <strong data-testid="manual-step">{manualStep}/5</strong>
        </p>
      )}

      <button
        type="button"
        className="button-primary workspace-primary"
        disabled={actionDisabled}
        onClick={onAction}
      >
        {actionLabel}<span aria-hidden="true">→</span>
      </button>
      <p className="workspace-helper">{COPY.scope.official}</p>
    </article>
  );
}
