import {motion} from 'motion/react';

import {COPY} from '../content/copy';
import type {EntityProgress} from '../demo/state';

type EntityProtectionPanelProps = {
  progress: EntityProgress;
  detectionProgress: number;
};

export function EntityProtectionPanel({progress, detectionProgress}: EntityProtectionPanelProps) {
  const values = [progress.name, progress.contact, progress.account];

  return (
    <section className="flow-card protection-panel">
      <div className="flow-card__header">
        <span className="flow-card__step">01</span>
        <div>
          <p>{COPY.protection.detect}</p>
          <h3>{COPY.protection.protectByType}</h3>
        </div>
      </div>
      <div className="protection-list">
        {COPY.protection.entities.map((entity, index) => {
          const itemProgress = values[index];
          const found = detectionProgress * 3 > index;
          return (
            <motion.div
              key={entity.type}
              className={itemProgress > 0 ? 'protection-row is-protected' : 'protection-row'}
              style={{opacity: 1}}
            >
              <span className="protection-row__type">{entity.type}</span>
              <span className="protection-row__arrow" aria-hidden="true">→</span>
              <span className="protection-row__action">
                {itemProgress >= 1 ? entity.action : found ? '정보 유형 확인' : '확인 대기'}
              </span>
              <span className="status-symbol" aria-hidden="true">{itemProgress >= 1 ? '✓' : '·'}</span>
            </motion.div>
          );
        })}
      </div>
      <p className="flow-card__note">보호 방식은 정보 유형별로 다르게 적용하는 설계입니다.</p>
    </section>
  );
}
