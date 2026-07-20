import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

import {chromium} from '@playwright/test';
import {PNG} from 'pngjs';
import {preview} from 'vite';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const BASE_URL = 'http://127.0.0.1:4174/privacy-gateway-demo/';
const FRAMES = [45, 225, 360, 480, 610, 750, 855, 945];
const SUBMISSION_FILES = new Map([
  [45, '01-project-overview.png'],
  [225, '02-problem-gap.png'],
  [480, '03-type-protection-route.png'],
  [610, '04-output-withheld.png'],
  [750, '05-verified-result.png'],
  [855, '06-innovation-and-evaluation.png'],
]);
const REGRESSION_FILES = new Map([
  [360, '07-type-protection-detail.png'],
  [945, '08-explicit-block.png'],
]);
const BASELINE_DIR = path.join(ROOT, 'tests', 'visual', 'baselines');
const SUBMISSION_DIR = path.join(ROOT, 'artifacts', 'submission');
const REGRESSION_DIR = path.join(ROOT, 'artifacts', 'regression');

async function openRecordingPage(context, unexpectedRequests) {
  const page = await context.newPage();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== new URL(BASE_URL).origin || request.method() !== 'GET') {
      unexpectedRequests.push(`${request.method()}:${url.origin}${url.pathname}`);
    }
  });
  await page.goto(`${BASE_URL}?record=1`, {waitUntil: 'networkidle'});
  await page.waitForFunction(() => '__FPG_RECORDING_V1__' in window);
  await page.evaluate(() => window.__FPG_RECORDING_V1__.ready);
  await page.mouse.move(1_919, 1_079);
  return page;
}

async function capture(page, frame) {
  const result = await page.evaluate(
    (value) => window.__FPG_RECORDING_V1__.setFrame(value),
    frame,
  );
  assert.deepEqual(
    {frame: result.frame, width: result.width, height: result.height, ready: result.ready},
    {frame, width: 1_920, height: 1_080, ready: true},
  );
  return page.getByTestId('demo-stage').screenshot({type: 'png'});
}

function assertSameRgba(firstBytes, secondBytes, frame) {
  const first = PNG.sync.read(firstBytes);
  const second = PNG.sync.read(secondBytes);
  assert.equal(first.width, 1_920, `frame ${frame}: first width`);
  assert.equal(first.height, 1_080, `frame ${frame}: first height`);
  assert.equal(second.width, 1_920, `frame ${frame}: second width`);
  assert.equal(second.height, 1_080, `frame ${frame}: second height`);
  let differingPixels = 0;
  let minX = first.width;
  let minY = first.height;
  let maxX = -1;
  let maxY = -1;
  for (let offset = 0; offset < first.data.length; offset += 4) {
    if (
      first.data[offset] === second.data[offset] &&
      first.data[offset + 1] === second.data[offset + 1] &&
      first.data[offset + 2] === second.data[offset + 2] &&
      first.data[offset + 3] === second.data[offset + 3]
    ) continue;
    const pixel = offset / 4;
    const x = pixel % first.width;
    const y = Math.floor(pixel / first.width);
    differingPixels += 1;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  assert.equal(
    differingPixels,
    0,
    `frame ${frame}: ${differingPixels} RGBA pixels differ within (${minX},${minY})-(${maxX},${maxY})`,
  );
}

async function captureContextFrame(browser, contextOptions, unexpectedRequests, frame) {
  const context = await browser.newContext(contextOptions);
  try {
    const page = await openRecordingPage(context, unexpectedRequests);
    return await capture(page, frame);
  } finally {
    await context.close();
  }
}

const server = await preview({
  root: ROOT,
  logLevel: 'silent',
  preview: {host: '127.0.0.1', port: 4_174, strictPort: true},
});
const browser = await chromium.launch();

try {
  await mkdir(BASELINE_DIR, {recursive: true});
  await mkdir(SUBMISSION_DIR, {recursive: true});
  await mkdir(REGRESSION_DIR, {recursive: true});

  const contextOptions = {
    viewport: {width: 1_920, height: 1_080},
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  };
  const unexpectedRequests = [];

  for (const frame of FRAMES) {
    const firstBytes = await captureContextFrame(browser, contextOptions, unexpectedRequests, frame);
    const secondBytes = await captureContextFrame(browser, contextOptions, unexpectedRequests, frame);
    assertSameRgba(firstBytes, secondBytes, frame);
    await writeFile(path.join(BASELINE_DIR, `${frame}.png`), firstBytes);

    const submissionName = SUBMISSION_FILES.get(frame);
    if (submissionName !== undefined) {
      await writeFile(path.join(SUBMISSION_DIR, submissionName), firstBytes);
    }

    const regressionName = REGRESSION_FILES.get(frame);
    if (regressionName !== undefined) {
      await writeFile(path.join(REGRESSION_DIR, regressionName), firstBytes);
    }
  }

  assert.deepEqual(unexpectedRequests, [], 'capture made a non-local or non-GET request');
  process.stdout.write(
    `Captured ${FRAMES.length} reviewed frames, ${SUBMISSION_FILES.size} submission images, and ${REGRESSION_FILES.size} named regression images; independent-context RGBA is identical.\n`,
  );
} finally {
  await browser.close();
  await new Promise((resolve, reject) => {
    server.httpServer.close((error) => error ? reject(error) : resolve());
  });
}
