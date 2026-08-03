import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

import {chromium} from '@playwright/test';
import {PNG} from 'pngjs';
import {preview} from 'vite';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const BASE_URL = 'http://127.0.0.1:4174/privacy-gateway-demo/';
const CAPTURES = [
  ['SYN-NORMAL-001', 45, 'detected'],
  ['SYN-NORMAL-001', 180, 'protected'],
  ['SYN-NORMAL-001', 360, 'mocked'],
  ['SYN-NORMAL-001', 610, 'inspected'],
  ['SYN-NORMAL-001', 790, 'verified'],
  ['SYN-BLOCK-001', 180, 'request-blocked'],
  ['SYN-WITHHOLD-001', 610, 'response-withheld'],
];
const EXPECTED_RUN = new Map([
  ['detected', ['detected', 'DETECTED']],
  ['protected', ['protected', 'PROTECTED']],
  ['mocked', ['mocked', 'MOCKED']],
  ['inspected', ['inspected', 'INSPECTED']],
  ['verified', ['published', 'VERIFIED']],
  ['request-blocked', ['protected', 'REQUEST_BLOCKED_UNSUPPORTED']],
  ['response-withheld', ['inspected', 'RESPONSE_WITHHELD_MARKER']],
]);
const SUBMISSION_FILES = new Map([
  ['detected', '01-synthetic-source.png'],
  ['protected', '02-type-protection.png'],
  ['mocked', '03-local-mock-summary.png'],
  ['inspected', '04-full-response-inspection.png'],
  ['verified', '05-verified-result.png'],
  ['request-blocked', '06-request-blocked.png'],
  ['response-withheld', '07-response-withheld.png'],
]);
const REGRESSION_FILES = new Map([
  ['request-blocked', '06-request-blocked.png'],
  ['response-withheld', '07-response-withheld.png'],
]);
const BASELINE_DIR = path.join(ROOT, 'tests', 'visual', 'baselines');
const SUBMISSION_DIR = path.join(ROOT, 'artifacts', 'submission');
const REGRESSION_DIR = path.join(ROOT, 'artifacts', 'regression');

async function openRecordingPage(context, unexpectedRequests, caseId) {
  const page = await context.newPage();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== new URL(BASE_URL).origin || request.method() !== 'GET') {
      unexpectedRequests.push(`${request.method()}:${url.origin}${url.pathname}`);
    }
  });
  await page.goto(`${BASE_URL}?record=1&case=${caseId}`, {waitUntil: 'networkidle'});
  await page.waitForFunction(() => '__FPG_RECORDING_V1__' in window);
  await page.evaluate(() => window.__FPG_RECORDING_V1__.ready);
  return page;
}

async function capture(page, caseId, frame, stage) {
  const snapshot = await page.evaluate(async (value) => {
    const result = await window.__FPG_RECORDING_V1__.setFrame(value);
    return {result, state: window.__FPG_RECORDING_V1__.getState()};
  }, frame);
  assert.deepEqual(
    {
      frame: snapshot.result.frame,
      width: snapshot.result.width,
      height: snapshot.result.height,
      ready: snapshot.result.ready,
    },
    {frame, width: 1_920, height: 1_080, ready: true},
  );
  const [reachedStage, outcome] = EXPECTED_RUN.get(stage);
  assert.deepEqual(
    {
      caseId: snapshot.state.run.caseId,
      reachedStage: snapshot.state.run.reachedStage,
      outcome: snapshot.state.run.outcome,
    },
    {caseId, reachedStage, outcome},
  );
  return page.getByTestId('demo-stage').screenshot({type: 'png'});
}

function assertSameRgba(firstBytes, secondBytes, caseId, frame) {
  const first = PNG.sync.read(firstBytes);
  const second = PNG.sync.read(secondBytes);
  assert.equal(first.width, 1_920, `${caseId} frame ${frame}: first width`);
  assert.equal(first.height, 1_080, `${caseId} frame ${frame}: first height`);
  assert.equal(second.width, 1_920, `${caseId} frame ${frame}: second width`);
  assert.equal(second.height, 1_080, `${caseId} frame ${frame}: second height`);
  assert.equal(
    Buffer.from(first.data).equals(Buffer.from(second.data)),
    true,
    `${caseId} frame ${frame}: independent-context RGBA differs`,
  );
}

async function captureContextFrame(browser, contextOptions, unexpectedRequests, caseId, frame, stage) {
  const context = await browser.newContext(contextOptions);
  try {
    const page = await openRecordingPage(context, unexpectedRequests, caseId);
    return await capture(page, caseId, frame, stage);
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

  for (const [caseId, frame, stage] of CAPTURES) {
    const firstBytes = await captureContextFrame(
      browser,
      contextOptions,
      unexpectedRequests,
      caseId,
      frame,
      stage,
    );
    const secondBytes = await captureContextFrame(
      browser,
      contextOptions,
      unexpectedRequests,
      caseId,
      frame,
      stage,
    );
    assertSameRgba(firstBytes, secondBytes, caseId, frame);
    await writeFile(path.join(BASELINE_DIR, `${stage}.png`), firstBytes);
    await writeFile(path.join(SUBMISSION_DIR, SUBMISSION_FILES.get(stage)), firstBytes);

    const regressionName = REGRESSION_FILES.get(stage);
    if (regressionName !== undefined) {
      await writeFile(path.join(REGRESSION_DIR, regressionName), firstBytes);
    }
  }

  assert.deepEqual(unexpectedRequests, [], 'capture made a non-local or non-GET request');
  process.stdout.write(
    'Captured 7 reviewed scenario states, 7 submission images, and 2 failure regressions; independent-context RGBA is identical.\n',
  );
} finally {
  await browser.close();
  await new Promise((resolve, reject) => {
    server.httpServer.close((error) => error ? reject(error) : resolve());
  });
}
