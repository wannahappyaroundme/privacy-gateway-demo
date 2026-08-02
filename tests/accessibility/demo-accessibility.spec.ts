import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Page} from '@playwright/test';

async function recordingBridge(page: Page): Promise<{setFrame(frame: number): Promise<void>}> {
  await page.setViewportSize({width: 1_920, height: 1_080});
  await page.goto('?record=1&case=SYN-NORMAL-001');
  await page.waitForFunction(() => '__FPG_RECORDING_V1__' in window);
  await page.evaluate(() => window.__FPG_RECORDING_V1__?.ready);
  return {
    setFrame: async (frame) => {
      await page.evaluate((nextFrame) => window.__FPG_RECORDING_V1__!.setFrame(nextFrame), frame);
    },
  };
}

function criticalOrSerious(results: Awaited<ReturnType<AxeBuilder['analyze']>>) {
  return results.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? ''));
}

test('has no critical or serious axe violations in initial, processing, verified, blocked, and withheld states', async ({page}) => {
  await page.goto('./');
  expect(criticalOrSerious(await new AxeBuilder({page}).analyze())).toEqual([]);

  const bridge = await recordingBridge(page);
  for (const frame of [45, 180, 360, 610, 790]) {
    await bridge.setFrame(frame);
    expect(criticalOrSerious(await new AxeBuilder({page}).analyze()), `frame ${frame}`).toEqual([]);
  }

  await page.goto('./');
  await page.getByRole('combobox', {name: '합성 사례 선택'}).selectOption('SYN-BLOCK-001');
  await page.getByRole('button', {name: '개인정보 보호 후 요약 만들기'}).click();
  await page.waitForFunction(() => document.querySelector('[data-product-state="request-blocked"]'));
  expect(criticalOrSerious(await new AxeBuilder({page}).analyze())).toEqual([]);

  await page.getByRole('combobox', {name: '합성 사례 선택'}).selectOption('SYN-WITHHOLD-001');
  await page.getByRole('button', {name: '개인정보 보호 후 요약 만들기'}).click();
  await page.waitForFunction(() => document.querySelector('[data-product-state="response-withheld"]'));
  expect(criticalOrSerious(await new AxeBuilder({page}).analyze())).toEqual([]);
});

test('puts the labeled case selector and primary action first in keyboard order', async ({page}) => {
  await page.goto('./');
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });

  await page.keyboard.press('Tab');
  await expect(page.getByRole('combobox', {name: '합성 사례 선택'})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', {name: '개인정보 보호 후 요약 만들기'})).toBeFocused();
});

test('announces start and completion and clears the announcement after case changes', async ({page}) => {
  await page.clock.install();
  await page.goto('./');
  const liveRegion = page.getByTestId('live-region');

  await page.getByRole('button', {name: '개인정보 보호 후 요약 만들기'}).click();
  await expect(liveRegion).toContainText('보호 처리를 시작');
  await page.clock.fastForward(8_100);
  await expect(liveRegion).toContainText('확인된 결과를 표시');
  await page.getByRole('combobox', {name: '합성 사례 선택'}).selectOption('SYN-BLOCK-001');
  await expect(liveRegion).toBeEmpty();
});

for (const viewport of [
  {width: 1_920, height: 1_080},
  {width: 1_440, height: 900},
  {width: 1_280, height: 800},
  {width: 1_023, height: 1_024},
  {width: 767, height: 1_024},
  {width: 390, height: 844},
] as const) {
  test(`keeps controls and content bounded at ${viewport.width}x${viewport.height}`, async ({page}) => {
    await page.setViewportSize(viewport);
    await page.goto('./');

    const documentMetrics = await page.evaluate(() => ({
      bodyWidth: document.body.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(documentMetrics.bodyWidth).toBeLessThanOrEqual(documentMetrics.viewportWidth);
    expect(documentMetrics.documentWidth).toBeLessThanOrEqual(documentMetrics.viewportWidth);

    for (const control of await page.locator('button, select, summary').all()) {
      const bounds = await control.boundingBox();
      expect(bounds, await control.getAttribute('aria-label') ?? await control.textContent() ?? 'control').not.toBeNull();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }

    if (viewport.width < 768) {
      await expect(page.getByTestId('manual-step')).toHaveText('1/5');
      await expect(page.getByRole('button', {name: '다음 단계'})).toBeVisible();
      await expect(page.getByRole('button', {name: '개인정보 보호 후 요약 만들기'})).toHaveCount(0);
    }
  });
}

test('uses five-step manual progression when reduced motion is requested', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('./');

  await expect(page.getByTestId('manual-step')).toHaveText('1/5');
  await page.getByRole('button', {name: '다음 단계'}).click();
  await expect(page.getByTestId('manual-step')).toHaveText('2/5');
  await page.getByRole('button', {name: '다음 단계'}).click();
  await expect(page.getByTestId('manual-step')).toHaveText('3/5');
  await page.getByRole('button', {name: '다음 단계'}).click();
  await expect(page.getByTestId('manual-step')).toHaveText('4/5');
  await page.getByRole('button', {name: '다음 단계'}).click();
  await expect(page.getByTestId('manual-step')).toHaveText('5/5');
  await expect(page.getByTestId('verified-result')).toBeVisible();
});

test('exposes visible focus and minimum readable helper and body text tokens', async ({page}) => {
  await page.goto('./');
  const selector = page.getByRole('combobox', {name: '합성 사례 선택'});
  await selector.focus();
  const focusStyle = await selector.evaluate((element) => getComputedStyle(element));
  expect(focusStyle.outlineStyle).not.toBe('none');

  const sizes = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      helper: Number.parseFloat(root.getPropertyValue('--font-helper')),
      body: Number.parseFloat(root.getPropertyValue('--font-body')),
    };
  });
  expect(sizes.helper).toBeGreaterThanOrEqual(12);
  expect(sizes.body).toBeGreaterThanOrEqual(14);
});

test('renders protected request and verified result values at body text size', async ({page}) => {
  const bridge = await recordingBridge(page);

  await bridge.setFrame(180);
  const protectedTextSize = await page.locator('.protected-text').evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  expect(protectedTextSize).toBeGreaterThanOrEqual(14);

  await bridge.setFrame(790);
  const verifiedValueSize = await page
    .locator('[data-testid="verified-result"] dl > div > dd:not(.result-evidence)')
    .first()
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(verifiedValueSize).toBeGreaterThanOrEqual(14);
});

test('keeps the invalid bootstrap alert accessible and bounded on a narrow screen', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('./?record=1&case=SYN-UNKNOWN-001');

  const alert = page.getByRole('alert');
  await expect(alert.getByRole('heading', {name: '검수된 시연 데이터를 확인하지 못했어요'})).toBeVisible();
  await expect(alert.getByRole('button', {name: '처음부터 다시 시작'})).toBeVisible();
  expect(criticalOrSerious(await new AxeBuilder({page}).analyze())).toEqual([]);

  const widths = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});
