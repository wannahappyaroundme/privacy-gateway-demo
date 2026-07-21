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
            <p className="brand-promise">{COPY.product.category}</p>
          </div>
        </div>
        <nav className="product-nav" aria-label="단디 업무 메뉴">
          <a href="#consultation-title" aria-current="page">상담 요약</a>
          <span>보호 정책</span>
          <span>처리 이력</span>
        </nav>
        <div className="header-context"><span aria-hidden="true">은</span><strong>은행 상담 업무</strong></div>
      </header>

      <div className="stage-content">{children}</div>

      <footer className="app-footer">
        <ScopeNotice compact={recordingMode} />
      </footer>
    </main>
  );
}
