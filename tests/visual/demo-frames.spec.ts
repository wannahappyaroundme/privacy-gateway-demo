import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

import {expect, test} from '@playwright/test';
import {PNG} from 'pngjs';

const REVIEWED_FRAMES = [45, 225, 360, 480, 610, 750, 855, 945] as const;
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
  test(`frame ${frame} matches reviewed baseline`, async ({page}) => {
    await page.emulateMedia({reducedMotion: 'no-preference', colorScheme: 'light'});
    await page.goto('?record=1');
    await page.waitForFunction(() => '__FPG_RECORDING_V1__' in window);
    const result = await page.evaluate(
      async (value) => window.__FPG_RECORDING_V1__!.setFrame(value),
      frame,
    );

    expect(result).toMatchObject({frame, width: 1_920, height: 1_080, ready: true});
    await page.mouse.move(1_919, 1_079);
    const actual = PNG.sync.read(await page.getByTestId('demo-stage').screenshot());
    const baseline = PNG.sync.read(await readFile(path.join(BASELINE_DIR, `${frame}.png`)));
    expect({width: actual.width, height: actual.height}).toEqual({width: 1_920, height: 1_080});
    expect(Buffer.from(actual.data).equals(Buffer.from(baseline.data))).toBe(true);
  });
}

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
