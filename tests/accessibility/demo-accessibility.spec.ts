import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Page} from '@playwright/test';

async function recordingBridge(page: Page): Promise<{setFrame(frame: number): Promise<void>}> {
  await page.setViewportSize({width: 1_920, height: 1_080});
  await page.goto('?record=1');
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

test('has no critical or serious axe violations in every product state', async ({page}) => {
  await page.goto('./');
  expect(criticalOrSerious(await new AxeBuilder({page}).analyze())).toEqual([]);

  const bridge = await recordingBridge(page);
  for (const frame of [45, 300, 480, 610, 750, 945, 975]) {
    await bridge.setFrame(frame);
    expect(criticalOrSerious(await new AxeBuilder({page}).analyze()), `frame ${frame}`).toEqual([]);
  }
});

test('keeps the primary task first in keyboard order and exposes the compact notices', async ({page}) => {
  await page.goto('./');
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', {name: '상담 요약'})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', {name: 'AI 상담 요약 만들기'})).toBeFocused();

  await page.getByText('데모 안내').click();
  await expect(page.getByText(/실제 고객정보와 금융 시스템에는 연결되지 않습니다/u)).toBeVisible();
  await page.getByText('호스팅 안내').click();
  await expect(page.getByText(/GitHub Pages 이용 과정/u)).toBeVisible();
});

test('announces start, pause, and completion without a countdown', async ({page}) => {
  await page.clock.install();
  await page.goto('./');
  const liveRegion = page.getByTestId('live-region');

  await expect(page.getByTestId('countdown')).toHaveCount(0);
  await page.getByRole('button', {name: 'AI 상담 요약 만들기'}).click();
  await expect(liveRegion).toContainText('보호 처리를 시작');
  await page.clock.fastForward(22_100);
  await expect(liveRegion).toContainText('상담 요약이 준비되었습니다');
  await expect(page.getByRole('button', {name: '새 상담 요약'})).toBeVisible();
});

test('exposes product progress and text status without relying on color', async ({page}) => {
  const bridge = await recordingBridge(page);
  await bridge.setFrame(610);

  const progress = page.getByRole('progressbar', {name: '단디 보호 처리 진행률'});
  await expect(progress).toHaveAttribute('max', '899');
  await expect(progress).toHaveAttribute('value', '610');
  await expect(page.locator('.gateway-steps .is-active')).toContainText('전체 응답 검사');
  await expect(page.locator('.gateway-steps .is-active')).toContainText('진행 중');
});

test('keeps every recorded product state inside the 1920x1080 stage', async ({page}) => {
  const bridge = await recordingBridge(page);

  for (const frame of [0, 45, 300, 480, 610, 750, 945, 975]) {
    await bridge.setFrame(frame);
    const overflow = await page.getByTestId('demo-stage').evaluate((stage) => ({
      horizontal: stage.scrollWidth - stage.clientWidth,
      vertical: stage.scrollHeight - stage.clientHeight,
    }));
    expect(overflow.horizontal, `frame ${frame}`).toBe(0);
    expect(overflow.vertical, `frame ${frame}`).toBe(0);
  }
});

for (const viewport of [
  {width: 1_920, height: 1_080},
  {width: 1_440, height: 900},
  {width: 1_280, height: 800},
  {width: 1_023, height: 1_024},
  {width: 767, height: 1_024},
  {width: 390, height: 844},
] as const) {
  test(`keeps the product workspace bounded at ${viewport.width}x${viewport.height}`, async ({page}) => {
    await page.setViewportSize(viewport);
    await page.goto('./');

    const documentMetrics = await page.evaluate(() => ({
      bodyWidth: document.body.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(documentMetrics.bodyWidth).toBeLessThanOrEqual(documentMetrics.viewportWidth);
    expect(documentMetrics.documentWidth).toBeLessThanOrEqual(documentMetrics.viewportWidth);

    const button = viewport.width < 768
      ? page.getByRole('button', {name: '다음 상태'})
      : page.getByRole('button', {name: 'AI 상담 요약 만들기'});
    const buttonBounds = await button.boundingBox();
    expect(buttonBounds).not.toBeNull();
    expect(buttonBounds!.height).toBeGreaterThanOrEqual(44);

    const panels = await page.locator('.product-panel').evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom};
      }),
    );
    for (const panel of panels) {
      expect(panel.left).toBeGreaterThanOrEqual(-1);
      expect(panel.right).toBeLessThanOrEqual(viewport.width + 1);
    }
    for (let index = 0; index < panels.length; index += 1) {
      for (let candidate = index + 1; candidate < panels.length; candidate += 1) {
        const first = panels[index];
        const second = panels[candidate];
        const overlaps = first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
        expect(overlaps, `panels ${index} and ${candidate}`).toBe(false);
      }
    }
  });
}

test('uses static state changes when reduced motion is requested', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('./');

  const animationNames = await page.locator('.gateway-orbit--outer').evaluate((element) =>
    getComputedStyle(element).animationName,
  );
  expect(animationNames).toBe('none');
  await expect(page.getByRole('button', {name: '다음 상태'})).toBeVisible();
});
