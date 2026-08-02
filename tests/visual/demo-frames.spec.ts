import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

import {expect, test, type Browser, type Page} from '@playwright/test';
import {PNG} from 'pngjs';

const BASE_URL = 'http://127.0.0.1:4173/privacy-gateway-demo/';
const CAPTURES = [
  ['SYN-NORMAL-001', 45, 'detected'],
  ['SYN-NORMAL-001', 180, 'protected'],
  ['SYN-NORMAL-001', 360, 'mocked'],
  ['SYN-NORMAL-001', 610, 'inspected'],
  ['SYN-NORMAL-001', 790, 'verified'],
  ['SYN-BLOCK-001', 180, 'request-blocked'],
  ['SYN-WITHHOLD-001', 610, 'response-withheld'],
] as const;
const REVIEWED_STATE = {
  detected: {product: 'detecting', reached: 'detected', outcome: 'DETECTED'},
  protected: {product: 'protecting', reached: 'protected', outcome: 'PROTECTED'},
  mocked: {product: 'summarizing', reached: 'mocked', outcome: 'MOCKED'},
  inspected: {product: 'inspecting', reached: 'inspected', outcome: 'INSPECTED'},
  verified: {product: 'verified', reached: 'published', outcome: 'VERIFIED'},
  'request-blocked': {
    product: 'request-blocked',
    reached: 'protected',
    outcome: 'REQUEST_BLOCKED_UNSUPPORTED',
  },
  'response-withheld': {
    product: 'response-withheld',
    reached: 'inspected',
    outcome: 'RESPONSE_WITHHELD_MARKER',
  },
} as const;
const EXACT_RGBA_BASELINE =
  process.platform === 'darwin' && process.env.FPG_VISUAL_MODE !== 'structure';
const BASELINE_DIR = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  'baselines',
);

test.use({
  viewport: {width: 1_920, height: 1_080},
  deviceScaleFactor: 1,
  colorScheme: 'light',
});

async function openCapture(page: Page, caseId: string, frame: number) {
  await page.emulateMedia({reducedMotion: 'no-preference', colorScheme: 'light'});
  await page.goto(`${BASE_URL}?record=1&case=${caseId}`);
  await page.waitForFunction(() => '__FPG_RECORDING_V1__' in window);
  const result = await page.evaluate(
    async (value) => window.__FPG_RECORDING_V1__!.setFrame(value),
    frame,
  );
  const state = await page.evaluate(() => window.__FPG_RECORDING_V1__!.getState());
  return {result, state};
}

async function screenshotInIndependentContext(
  browser: Browser,
  caseId: string,
  frame: number,
): Promise<Buffer> {
  const context = await browser.newContext({
    viewport: {width: 1_920, height: 1_080},
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  });
  try {
    const page = await context.newPage();
    await openCapture(page, caseId, frame);
    return await page.getByTestId('demo-stage').screenshot();
  } finally {
    await context.close();
  }
}

for (const [caseId, frame, stage] of CAPTURES) {
  test(`${caseId} frame ${frame} preserves the reviewed ${stage} state`, async ({browser, page}) => {
    const {result, state} = await openCapture(page, caseId, frame);
    const reviewed = REVIEWED_STATE[stage];

    expect(result).toMatchObject({frame, width: 1_920, height: 1_080, ready: true});
    expect(state.run).toMatchObject({
      caseId,
      reachedStage: reviewed.reached,
      outcome: reviewed.outcome,
    });
    await expect(page.getByTestId('product-workspace')).toHaveAttribute(
      'data-product-state',
      reviewed.product,
    );
    const screenshotBytes = await page.getByTestId('demo-stage').screenshot();
    const actual = PNG.sync.read(screenshotBytes);
    expect({width: actual.width, height: actual.height}).toEqual({width: 1_920, height: 1_080});
    if (stage === 'request-blocked') {
      const titleHeight = await page
        .getByTestId('request-blocked-result')
        .locator('h3')
        .evaluate((element) => element.getBoundingClientRect().height);
      expect(titleHeight).toBeLessThan(40);
    }

    if (EXACT_RGBA_BASELINE) {
      const secondBytes = await screenshotInIndependentContext(browser, caseId, frame);
      const second = PNG.sync.read(secondBytes);
      const baseline = PNG.sync.read(await readFile(path.join(BASELINE_DIR, `${stage}.png`)));
      expect(Buffer.from(actual.data).equals(Buffer.from(second.data))).toBe(true);
      expect(Buffer.from(actual.data).equals(Buffer.from(baseline.data))).toBe(true);
      return;
    }

    const layout = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>('[data-testid="demo-stage"]')!;
      const heading = document.querySelector<HTMLElement>('.workspace-heading')!;
      const surface = document.querySelector<HTMLElement>('.product-workspace__grid')!;
      const footer = document.querySelector<HTMLElement>('.app-footer')!;
      const stageRect = stage.getBoundingClientRect();
      const headingRect = heading.getBoundingClientRect();
      const surfaceRect = surface.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      return {
        headingText: heading.querySelector('h1')?.textContent?.trim() ?? '',
        stage: {width: stageRect.width, height: stageRect.height},
        heading: {left: headingRect.left, right: headingRect.right, top: headingRect.top},
        surface: {
          left: surfaceRect.left,
          right: surfaceRect.right,
          top: surfaceRect.top,
          bottom: surfaceRect.bottom,
          width: surfaceRect.width,
          height: surfaceRect.height,
        },
        footerTop: footerRect.top,
        overflow: {
          width: stage.scrollWidth - stage.clientWidth,
          height: stage.scrollHeight - stage.clientHeight,
        },
      };
    });

    expect(screenshotBytes.byteLength).toBeGreaterThan(100_000);
    expect(layout.headingText).toBe('고객 상담 메모를 보호해 요약합니다');
    expect(layout.stage).toEqual({width: 1_920, height: 1_080});
    expect(layout.overflow.width).toBeLessThanOrEqual(0);
    expect(layout.overflow.height).toBeLessThanOrEqual(0);
    expect(layout.heading.left).toBeGreaterThanOrEqual(0);
    expect(layout.heading.right).toBeLessThanOrEqual(1_920);
    expect(layout.heading.top).toBeGreaterThanOrEqual(0);
    expect(layout.surface.left).toBeGreaterThanOrEqual(0);
    expect(layout.surface.right).toBeLessThanOrEqual(1_920);
    expect(layout.surface.top).toBeGreaterThan(layout.heading.top);
    expect(layout.surface.bottom).toBeLessThanOrEqual(layout.footerTop);
    expect(layout.surface.width).toBeGreaterThan(500);
    expect(layout.surface.height).toBeGreaterThan(250);
  });
}

test('request-blocked select paint stays baseline-stable under independent-context load', async ({browser}) => {
  test.skip(!EXACT_RGBA_BASELINE, 'Exact RGBA baselines are reviewed on macOS');
  const baseline = PNG.sync.read(
    await readFile(path.join(BASELINE_DIR, 'request-blocked.png')),
  );
  const captures = await Promise.all(
    Array.from({length: 16}, () =>
      screenshotInIndependentContext(browser, 'SYN-BLOCK-001', 180),
    ),
  );

  for (const bytes of captures) {
    const actual = PNG.sync.read(bytes);
    expect(Buffer.from(actual.data).equals(Buffer.from(baseline.data))).toBe(true);
  }
});

test('recording mode freezes every wall-clock animation across the seven captures', async ({page}) => {
  for (const [caseId, frame] of CAPTURES) {
    await openCapture(page, caseId, frame);
    const runningAnimations = await page.locator('.demo-stage--recording *').evaluateAll(
      (elements) => elements
        .map((element) => ({
          className: element.getAttribute('class') ?? element.tagName,
          animationName: getComputedStyle(element).animationName,
          transitionDuration: getComputedStyle(element).transitionDuration,
        }))
        .filter(({animationName, transitionDuration}) =>
          animationName !== 'none' || transitionDuration !== '0s'),
    );
    expect(runningAnimations, `${caseId} frame ${frame}`).toEqual([]);
  }
});
