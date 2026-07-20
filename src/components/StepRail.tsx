import {COPY} from '../content/copy';
import {MANUAL_STOPS, sceneStepIndexAt} from '../demo/timeline';

type StepRailProps = {
  frame: number;
  onSelect(frame: number): void;
};

export function StepRail({frame, onSelect}: StepRailProps) {
  const activeIndex = sceneStepIndexAt(frame);

  return (
    <nav className="step-rail" aria-label="시연 단계">
      <ol>
        {COPY.steps.map((step, index) => {
          const relation = index === activeIndex
            ? ' is-current is-adjacent'
            : index === activeIndex - 1
              ? ' is-previous is-adjacent'
              : index === activeIndex + 1
                ? ' is-next is-adjacent'
                : '';
          return (
          <li key={step} className={`step-rail__item${index <= activeIndex ? ' is-reached' : ''}${relation}`}>
            <button
              type="button"
              onClick={() => onSelect(MANUAL_STOPS[index])}
              aria-current={index === activeIndex ? 'step' : undefined}
            >
              <span className="step-rail__number">{index + 1}</span>
              <span>{step}</span>
            </button>
          </li>
          );
        })}
      </ol>
    </nav>
  );
}
