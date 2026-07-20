import {COPY} from '../content/copy';
import type {EntryPhase} from '../demo/playback';

type PlaybackControlsProps = {
  phase: EntryPhase;
  elapsedMs: number;
  recordingMode: boolean;
  manualOnly: boolean;
  onPause(): void;
  onResume(): void;
  onReplay(): void;
  onPrevious(): void;
  onNext(): void;
  onManual(): void;
  onBlockExample(): void;
};

function formatElapsed(elapsedMs: number): string {
  const seconds = Math.min(30, Math.max(0, Math.floor(elapsedMs / 1_000)));
  return `00:${String(seconds).padStart(2, '0')}`;
}

export function PlaybackControls({
  phase,
  elapsedMs,
  recordingMode,
  manualOnly,
  onPause,
  onResume,
  onReplay,
  onPrevious,
  onNext,
  onManual,
  onBlockExample,
}: PlaybackControlsProps) {
  if (recordingMode || phase === 'idle' || phase === 'countdown' || phase === 'complete') return null;

  if (manualOnly) {
    return (
      <section className="playback-bar playback-bar--manual" aria-label="시연 조작">
        <div className="playback-bar__buttons">
          <button type="button" onClick={onPrevious}>{COPY.controls.previous}</button>
          <button type="button" onClick={onNext}>{COPY.controls.next}</button>
        </div>
      </section>
    );
  }

  const progress = Math.min(30, elapsedMs / 1_000);
  const blockScene = phase === 'manual' && elapsedMs >= 30_000;

  return (
    <section className="playback-bar" aria-label="시연 조작">
      <div className="playback-bar__time">
        <output data-testid="elapsed-time" aria-label="시연 경과 시간">
          {formatElapsed(elapsedMs)} / 00:30
        </output>
        <progress
          data-testid="timeline-progress"
          max={30}
          value={progress}
          aria-label="30초 시연 진행률"
        />
      </div>
      <div className="playback-bar__buttons">
        {!blockScene && phase === 'playing' && (
          <button type="button" onClick={onPause}>{COPY.controls.pause}</button>
        )}
        {!blockScene && phase === 'paused' && (
          <button type="button" onClick={onResume}>{COPY.controls.continue}</button>
        )}
        {!blockScene && phase === 'manual' && (
          <button type="button" onClick={onResume}>{COPY.controls.play}</button>
        )}
        <button type="button" onClick={onPrevious}>{COPY.controls.previous}</button>
        <button type="button" onClick={onNext}>{COPY.controls.next}</button>
        <button type="button" onClick={onManual}>{COPY.controls.manual}</button>
        <button type="button" onClick={onReplay}>{COPY.controls.replay}</button>
        <button type="button" onClick={onBlockExample}>{COPY.controls.blockExample}</button>
      </div>
    </section>
  );
}
