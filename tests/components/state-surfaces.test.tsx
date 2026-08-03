import axe from 'axe-core';
import {cleanup, render, screen, within} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {BootstrapMessage} from '@/app/App';
import {BlockedResultPanel} from '@/components/BlockedResultPanel';
import {COPY} from '@/content/copy';
import {protectedTextForDisplay} from '@/prototype/protect';

function seriousOrCritical(results: axe.AxeResults) {
  return results.violations.filter(({impact}) => impact === 'serious' || impact === 'critical');
}

async function expectNoSeriousOrCritical(container: HTMLElement) {
  const results = await axe.run(container, {rules: {'color-contrast': {enabled: false}}});
  expect(seriousOrCritical(results)).toEqual([]);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('bootstrap and recovery state surfaces', () => {
  it('renders loading as a named status without serious or critical axe violations', async () => {
    const {container} = render(<BootstrapMessage bootstrap={{kind: 'loading'}} />);
    const status = screen.getByRole('status');

    expect(within(status).getByRole('heading', {level: 1, name: COPY.bootstrap.loading})).toBeVisible();
    await expectNoSeriousOrCritical(container);
  });

  it('renders empty as a named status with a recovery action and clean axe result', async () => {
    const {container} = render(<BootstrapMessage bootstrap={{kind: 'empty'}} />);
    const status = screen.getByRole('status');

    expect(within(status).getByRole('heading', {level: 1, name: COPY.bootstrap.emptyTitle})).toBeVisible();
    expect(within(status).getByRole('button', {name: COPY.bootstrap.emptyAction})).toBeVisible();
    await expectNoSeriousOrCritical(container);
  });

  it('renders invalid as an alert with a heading, action, and clean axe result', async () => {
    const {container} = render(
      <BootstrapMessage bootstrap={{kind: 'invalid', rule: 'fixture-validation'}} />,
    );
    const alert = screen.getByRole('alert');

    expect(within(alert).getByRole('heading', {level: 1, name: COPY.bootstrap.invalidTitle})).toBeVisible();
    expect(within(alert).getByRole('button', {name: COPY.bootstrap.invalidAction})).toBeVisible();
    await expectNoSeriousOrCritical(container);
  });

  it('renders recoverable as a named status with all next actions and clean axe result', async () => {
    const {container} = render(
      <BlockedResultPanel
        kind="recoverable"
        onNormal={vi.fn()}
        onAnother={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    const status = screen.getByRole('status');

    expect(within(status).getByRole('heading', {name: COPY.workspace.recoverableTitle})).toBeVisible();
    for (const action of [COPY.workspace.normal, COPY.workspace.another, COPY.workspace.reset]) {
      expect(within(status).getByRole('button', {name: action})).toBeVisible();
    }
    await expectNoSeriousOrCritical(container);
  });
});

describe('protected display lifecycle', () => {
  it('does not create protection state while the protected comparison is hidden', () => {
    expect(protectedTextForDisplay('', false)).toBeUndefined();
  });

  it('clears the display-only registry before returning the protected string', () => {
    const clear = vi.spyOn(Map.prototype, 'clear');
    const sourceText =
      '가상고객-A님이 합성연락처-001로 연락해 합성계좌-001 확인을 요청했습니다.';

    expect(protectedTextForDisplay(sourceText, true)).toBe(
      '가상고객A님이 [합성_연락처_01]로 연락해 [합성_계좌_01] 확인을 요청했습니다.',
    );
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
