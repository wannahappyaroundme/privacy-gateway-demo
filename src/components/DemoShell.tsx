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
          {COPY.scope.badges.map((badge, index) => (
            <span key={badge}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                {index === 0 ? (
                  <>
                    <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21" />
                    <path d="m5.6 5.6 1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
                    <circle cx="12" cy="12" r="4" />
                  </>
                ) : (
                  <>
                    <path d="M12 3 5.5 5.8v5.4c0 4.2 2.6 7.8 6.5 9.3 3.9-1.5 6.5-5.1 6.5-9.3V5.8z" />
                    <path d="M9 12h6M12 9v6" />
                  </>
                )}
              </svg>
              {badge}
            </span>
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
