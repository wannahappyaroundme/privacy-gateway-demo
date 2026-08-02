import {expect, test, type Page} from '@playwright/test';

test.use({
  viewport: {width: 1_920, height: 1_080},
  deviceScaleFactor: 1,
  colorScheme: 'light',
});

async function setRecordingFrame(page: Page, frame: number) {
  await page.waitForFunction(() => window.__FPG_RECORDING_V1__ !== undefined);
  await page.evaluate((nextFrame) => window.__FPG_RECORDING_V1__!.setFrame(nextFrame), frame);
}

test('stops the normal runtime on its first published snapshot and replay removes the result', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference', colorScheme: 'light'});
  await page.clock.install();
  await page.goto('./');

  await page.getByRole('button', {name: 'AI 상담 요약 만들기'}).click();
  await page.clock.fastForward(7_000);

  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-run-outcome', 'VERIFIED');
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'complete');
  await expect(page.getByTestId('verified-result')).toBeVisible();
  const terminalFrame = Number(await page.getByTestId('demo-stage').getAttribute('data-frame'));
  expect(terminalFrame).toBeGreaterThanOrEqual(743);
  expect(terminalFrame).toBeLessThan(899);

  await page.getByRole('button', {name: '새 상담 요약'}).click();
  await expect(page.getByTestId('verified-result')).toHaveCount(0);
  await expect(page.getByTestId('product-workspace')).not.toHaveAttribute('data-run-outcome', 'VERIFIED');
});

for (const scenario of [
  {
    caseId: 'SYN-NORMAL-001',
    before: 742,
    terminal: 743,
    outcome: 'VERIFIED',
    productState: 'complete',
  },
  {
    caseId: 'SYN-BLOCK-001',
    before: 134,
    terminal: 135,
    outcome: 'REQUEST_BLOCKED_UNSUPPORTED',
    productState: 'withheld',
  },
  {
    caseId: 'SYN-WITHHOLD-001',
    before: 472,
    terminal: 473,
    outcome: 'RESPONSE_WITHHELD_MARKER',
    productState: 'withheld',
  },
] as const) {
  test(`records ${scenario.caseId} from its real terminal engine snapshot`, async ({page}) => {
    await page.goto(`./?record=1&case=${scenario.caseId}`);

    await setRecordingFrame(page, scenario.before);
    await expect(page.getByTestId('product-workspace')).not.toHaveAttribute(
      'data-run-outcome',
      scenario.outcome,
    );

    await setRecordingFrame(page, scenario.terminal);
    await expect(page.getByTestId('demo-stage')).toHaveAttribute(
      'data-frame',
      String(scenario.terminal),
    );
    await expect(page.getByTestId('product-workspace')).toHaveAttribute(
      'data-case-id',
      scenario.caseId,
    );
    await expect(page.getByTestId('product-workspace')).toHaveAttribute(
      'data-run-outcome',
      scenario.outcome,
    );
    await expect(page.getByTestId('product-workspace')).toHaveAttribute(
      'data-product-state',
      scenario.productState,
    );
  });
}

test('fails bootstrap closed for an unreviewed recording case query', async ({page}) => {
  await page.goto('./?record=1&case=SYN-UNKNOWN-001');

  await expect(page.getByRole('alert')).toContainText('검수된 시연 데이터를 확인하지 못했어요');
  await expect(page.getByTestId('product-workspace')).toHaveCount(0);
  expect(await page.evaluate(() => window.__FPG_RECORDING_V1__)).toBeUndefined();
});

test('fails bootstrap closed for encoded recording intent', async ({page}) => {
  await page.goto('./?record=%31&case=SYN-UNKNOWN-001');

  await expect(page.getByRole('alert')).toContainText('검수된 시연 데이터를 확인하지 못했어요');
  await expect(page.getByTestId('product-workspace')).toHaveCount(0);
  expect(await page.evaluate(() => window.__FPG_RECORDING_V1__)).toBeUndefined();
});
