import type {ReactNode} from 'react';

import {COPY} from '../content/copy';
import {ScopeNotice} from './ScopeNotice';

type DemoShellProps = {
  frame: number;
  recordingMode: boolean;
  children: ReactNode;
};

export function DemoShell({frame, recordingMode, children}: DemoShellProps) {
  return (
    <main
      className={recordingMode ? 'demo-stage demo-stage--recording' : 'demo-stage'}
      data-testid="demo-stage"
      data-frame={frame}
      data-recording={recordingMode ? 'true' : 'false'}
    >
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <path d="M20 3l14 6v10c0 9-5.8 15.1-14 18-8.2-2.9-14-9-14-18V9z" />
              <path d="M13 20l4.5 4.5L28 14" />
            </svg>
          </span>
          <div>
            <p className="brand-name">{COPY.product.name}</p>
            <p className="brand-promise">{COPY.product.memoryLine}</p>
          </div>
        </div>
        <div className="scope-badges" aria-label="시연 범위">
          {COPY.scope.badges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
      </header>

      <div className="stage-content">{children}</div>

      <footer className="app-footer">
        <ScopeNotice compact={recordingMode} />
      </footer>
    </main>
  );
}
