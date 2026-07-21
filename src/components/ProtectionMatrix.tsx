import {COPY} from '../content/copy';
import type {EntityProgress} from '../demo/state';

type ProtectionMatrixProps = {
  progress: EntityProgress;
};

const categories = [
  {name: '직접 식별자', level: '고위험', policy: '연결 보호'},
  {name: '준식별자', level: '중위험', policy: '선택적 보호'},
  {name: '민감 정보', level: '고위험', policy: '강화 보호'},
  {name: '비개인정보', level: '저위험', policy: '일반 제공'},
] as const;

const candidates = [
  ['검토', '검토', '-', '검토', '-'],
  ['검토', '검토', '검토', '-', '-'],
  ['검토', '-', '-', '검토', '-'],
  ['-', '-', '-', '-', '검토'],
] as const;

const examples = ['가상고객-A', '합성연락처-001', '합성계좌-001', '-'] as const;

export function ProtectionMatrix({progress}: ProtectionMatrixProps) {
  const progressByCategory = [
    progress.name,
    progress.contact,
    progress.account,
    Math.min(progress.name, progress.contact, progress.account),
  ];

  return (
    <section className="protection-matrix" data-testid="protection-matrix">
      <header className="protection-matrix__header">
        <div className="flow-card__header">
          <span className="flow-card__step">02</span>
          <div>
            <p>{COPY.protection.matrix.eyebrow}</p>
            <h2>{COPY.protection.matrix.title}</h2>
          </div>
        </div>
        <p>{COPY.protection.matrix.description}</p>
      </header>

      <div className="protection-matrix__table-wrap">
        <table>
          <caption className="sr-only">정보 유형별 보호 방식 정책 예시</caption>
          <thead>
            <tr>
              <th scope="col">정보 유형</th>
              <th scope="col">위험</th>
              {COPY.protection.matrix.methods.map((method) => (
                <th key={method} scope="col">{method}</th>
              ))}
              <th scope="col">정책</th>
              <th scope="col">합성 예시</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, rowIndex) => (
              <tr
                key={category.name}
                className={progressByCategory[rowIndex] > 0 ? 'is-current' : undefined}
              >
                <th scope="row">
                  <span className="protection-matrix__type-icon" aria-hidden="true">
                    {String(rowIndex + 1).padStart(2, '0')}
                  </span>
                  {category.name}
                </th>
                <td><span className={`risk-badge risk-badge--${category.level}`}>{category.level}</span></td>
                {candidates[rowIndex].map((candidate, columnIndex) => (
                  <td key={`${category.name}-${COPY.protection.matrix.methods[columnIndex]}`}>
                    <span className={candidate === '검토' ? 'concept-cell is-reviewed' : 'concept-cell'}>
                      {candidate}
                    </span>
                  </td>
                ))}
                <td><strong className="policy-label">{category.policy}</strong></td>
                <td><code className="synthetic-example">{examples[rowIndex]}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="protection-matrix__note">
        <span aria-hidden="true">i</span>
        {COPY.protection.matrix.disclaimer}
      </p>
    </section>
  );
}
