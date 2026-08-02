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

const TYPE_LABELS = {
  name: '이름',
  contact: '연락처',
  account: '계좌정보',
  credential: '인증정보',
} as const;

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
          <p className="panel__eyebrow">은행 상담 업무</p>
          <h2 id="consultation-title">합성 상담 메모</h2>
        </div>
        <span className="case-id">{selectedCase.caseId}</span>
      </div>

      <label className="case-selector">
        <span>합성 사례 선택</span>
        <select value={selectedCase.caseId} onChange={(event) => onCaseChange(event.target.value)}>
          {cases.map((item) => <option key={item.caseId} value={item.caseId}>{item.label}</option>)}
        </select>
      </label>

      <div className="consultation-document">
        <div className="document-toolbar">
          <span>공개 합성 원문</span>
          <strong>실제 고객정보 아님</strong>
        </div>
        <p>
          <HighlightedSource
            sourceText={selectedCase.sourceText}
            detections={detections}
            visible={highlightsVisible}
          />
        </p>
        <div className="detected-entities" aria-label="찾은 합성 정보 유형">
          {detections.map((detection) => (
            <span key={`${detection.type}-${detection.start}`} className={highlightsVisible ? 'is-found' : ''}>
              <b aria-hidden="true">{highlightsVisible ? '✓' : '·'}</b>
              {TYPE_LABELS[detection.type]}
            </span>
          ))}
        </div>
      </div>

      <div className="workspace-intent">
        <span aria-hidden="true">요약</span>
        <div><strong>로컬 모의 요약</strong><p>보호된 내용만 브라우저 안에서 정리합니다.</p></div>
      </div>

      {manualStep !== null && (
        <p className="manual-progress"><span>단계별 보기</span><strong data-testid="manual-step">{manualStep}/5</strong></p>
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
