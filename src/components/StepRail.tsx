import {COPY} from '../content/copy';
import {MANUAL_STOPS} from '../demo/timeline';

type StepRailProps = {
  frame: number;
  onSelect(frame: number): void;
};

export function StepRail({frame, onSelect}: StepRailProps) {
  const activeIndex = MANUAL_STOPS.reduce(
    (selected, stop, index) => (frame >= stop ? index : selected),
    0,
  );

  return (
    <nav className="step-rail" aria-label="시연 단계">
      <ol>
        {COPY.steps.map((step, index) => (
          <li key={step} className={index <= activeIndex ? 'step-rail__item is-reached' : 'step-rail__item'}>
            <button
              type="button"
              onClick={() => onSelect(MANUAL_STOPS[index])}
              aria-current={index === activeIndex ? 'step' : undefined}
            >
              <span className="step-rail__number">{index + 1}</span>
              <span>{step}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
