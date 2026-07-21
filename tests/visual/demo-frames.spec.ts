import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

import {expect, test} from '@playwright/test';
import {PNG} from 'pngjs';

const REVIEWED_FRAMES = [45, 225, 360, 480, 610, 750, 855, 945] as const;
const REVIEWED_STATES = new Map<number, string>([
  [45, 'detecting'],
  [225, 'protecting'],
  [360, 'protecting'],
  [480, 'generating'],
  [610, 'inspecting'],
  [750, 'complete'],
  [855, 'complete'],
  [945, 'withheld'],
]);
const EXACT_RGBA_BASELINE =
  process.platform === 'darwin' && process.env.FPG_VISUAL_MODE !== 'structure';
const BASELINE_DIR = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  'baselines',
);
const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const NAMED_REGRESSION_IMAGES = [
  ['artifacts/regression/07-type-protection-detail.png', 360],
  ['artifacts/regression/08-explicit-block.png', 945],
] as const;

test.use({
  viewport: {width: 1_920, height: 1_080},
  deviceScaleFactor: 1,
  colorScheme: 'light',
});

for (const frame of REVIEWED_FRAMES) {
  test(`frame ${frame} meets the reviewed visual contract`, async ({page}) => {
    await page.emulateMedia({reducedMotion: 'no-preference', colorScheme: 'light'});
    await page.goto('?record=1');
    await page.waitForFunction(() => '__FPG_RECORDING_V1__' in window);
    const result = await page.evaluate(
      async (value) => window.__FPG_RECORDING_V1__!.setFrame(value),
      frame,
    );

    expect(result).toMatchObject({frame, width: 1_920, height: 1_080, ready: true});
    await page.mouse.move(1_919, 1_079);
    const screenshotBytes = await page.getByTestId('demo-stage').screenshot();
    const actual = PNG.sync.read(screenshotBytes);
    expect({width: actual.width, height: actual.height}).toEqual({width: 1_920, height: 1_080});
    if (EXACT_RGBA_BASELINE) {
      const baseline = PNG.sync.read(await readFile(path.join(BASELINE_DIR, `${frame}.png`)));
      expect(Buffer.from(actual.data).equals(Buffer.from(baseline.data))).toBe(true);
      return;
    }

    const layout = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>('[data-testid="demo-stage"]')!;
      const heading = document.querySelector<HTMLElement>('.workspace-heading')!;
      const surface = document.querySelector<HTMLElement>('.product-workspace')!;
      const footer = document.querySelector<HTMLElement>('.app-footer')!;
      const stageRect = stage.getBoundingClientRect();
      const headingRect = heading.getBoundingClientRect();
      const surfaceRect = surface.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      return {
        headingText: heading.querySelector('h1')?.textContent?.trim() ?? '',
        productState: surface.dataset.productState,
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
        overflow: {width: stage.scrollWidth - stage.clientWidth, height: stage.scrollHeight - stage.clientHeight},
      };
    });

    expect(screenshotBytes.byteLength).toBeGreaterThan(100_000);
    expect(layout.headingText).toBe('고객 상담 메모를 AI 상담 요약으로 정리합니다');
    expect(layout.productState).toBe(REVIEWED_STATES.get(frame));
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

test('recording mode freezes every wall-clock animation', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference', colorScheme: 'light'});
  await page.goto('?record=1');
  await page.waitForFunction(() => '__FPG_RECORDING_V1__' in window);

  for (const frame of [45, 480, 610]) {
    await page.evaluate(
      async (value) => window.__FPG_RECORDING_V1__!.setFrame(value),
      frame,
    );
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
    expect(runningAnimations).toEqual([]);
  }
});

test('named regression images preserve the required file contract', async () => {
  for (const [relativePath, frame] of NAMED_REGRESSION_IMAGES) {
    const artifactPath = path.join(ROOT, relativePath);
    const artifact = PNG.sync.read(await readFile(artifactPath));
    const baseline = PNG.sync.read(await readFile(path.join(BASELINE_DIR, `${frame}.png`)));

    expect((await stat(artifactPath)).size).toBeGreaterThan(100_000);
    expect({width: artifact.width, height: artifact.height}).toEqual({
      width: 1_920,
      height: 1_080,
    });
    expect(Buffer.from(artifact.data).equals(Buffer.from(baseline.data))).toBe(true);
  }
});
