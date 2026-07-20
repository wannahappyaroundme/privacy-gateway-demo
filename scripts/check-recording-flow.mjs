import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

import {chromium} from '@playwright/test';
import {preview} from 'vite';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const BASE_URL = 'http://127.0.0.1:4175/privacy-gateway-demo/';
const REPORT_PATH = path.join(ROOT, 'artifacts', 'recording-check.md');

const server = await preview({
  root: ROOT,
  logLevel: 'silent',
  preview: {host: '127.0.0.1', port: 4_175, strictPort: true},
});
const browser = await chromium.launch();

try {
  const context = await browser.newContext({
    viewport: {width: 1_920, height: 1_080},
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  const unexpectedRequests = [];

  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== new URL(BASE_URL).origin || request.method() !== 'GET') {
      unexpectedRequests.push(`${request.method()}:${url.origin}${url.pathname}`);
    }
  });
  await page.addInitScript(() => {
    const writes = [];
    window.__FPG_RECORDING_CHECK_WRITES__ = writes;
    const observe = (name, target, method) => {
      const original = target[method];
      if (typeof original !== 'function') return;
      target[method] = function(...args) {
        writes.push(name);
        return original.apply(this, args);
      };
    };
    observe('storage.setItem', Storage.prototype, 'setItem');
    observe('storage.removeItem', Storage.prototype, 'removeItem');
    observe('storage.clear', Storage.prototype, 'clear');
    observe('indexedDB.open', window.indexedDB, 'open');
    observe('indexedDB.deleteDatabase', window.indexedDB, 'deleteDatabase');
    if ('caches' in window) {
      observe('caches.open', window.caches, 'open');
      observe('caches.delete', window.caches, 'delete');
    }
  });

  await page.clock.install();
  await page.goto(BASE_URL, {waitUntil: 'networkidle'});

  await page.clock.fastForward(60_000);
  await page.getByTestId('demo-start').waitFor({state: 'visible'});
  assert.equal(await page.getByTestId('demo-stage').getAttribute('data-frame'), '0');
  assert.equal(await page.getByTestId('elapsed-time').count(), 0);

  await page.getByRole('button', {name: '시연 시작'}).click();
  const countdown = [];
  countdown.push(await page.getByTestId('countdown').textContent());
  await page.clock.fastForward(1_000);
  countdown.push(await page.getByTestId('countdown').textContent());
  await page.clock.fastForward(1_000);
  countdown.push(await page.getByTestId('countdown').textContent());
  assert.deepEqual(countdown, ['3', '2', '1']);

  await page.clock.fastForward(1_000);
  const playbackStart = await page.evaluate(() => ({
    frame: document.querySelector('[data-testid="demo-stage"]')?.getAttribute('data-frame'),
    elapsed: document.querySelector('[data-testid="elapsed-time"]')?.textContent,
  }));
  assert.deepEqual(playbackStart, {frame: '0', elapsed: '00:00 / 00:30'});

  await page.clock.fastForward(30_000);
  await page.getByRole('button', {name: '다시 시연'}).waitFor({state: 'visible'});
  assert.equal(await page.getByTestId('demo-stage').getAttribute('data-frame'), '899');
  assert.equal(await page.getByTestId('elapsed-time').textContent(), '00:30 / 00:30');
  assert.equal(await page.getByRole('heading', {name: '시연이 끝났어요'}).count(), 1);

  await page.getByRole('button', {name: '다시 시연'}).click();
  assert.equal(await page.getByTestId('countdown').textContent(), '3');

  const storageWrites = await page.evaluate(() => window.__FPG_RECORDING_CHECK_WRITES__);
  assert.deepEqual(unexpectedRequests, [], 'normal walkthrough made a non-local or non-GET request');
  assert.deepEqual(storageWrites, [], 'normal walkthrough wrote browser storage');

  const report = `# 화면 녹화 자동 시연 점검\n\n` +
    `이 기록은 화면 상태와 제어 흐름만 포함하며, 입력·응답 원문을 저장하지 않습니다.\n\n` +
    `- 첫 화면 정지: 통과, 클릭 전 60초를 진행해도 프레임 0 유지\n` +
    `- 사용자 시작: 통과, 시연 시작 버튼으로만 재생 진입\n` +
    `- 준비 카운트다운: 통과, 3 → 2 → 1\n` +
    `- 자동 안내 시작: 통과, 3.000초 뒤 프레임 0과 00:00 / 00:30 표시\n` +
    `- 자동 안내 종료: 통과, 30.000초 뒤 프레임 899와 00:30 / 00:30 표시\n` +
    `- 다시 시연: 통과, 동일한 3초 카운트다운으로 복귀\n` +
    `- 외부 요청: 0건\n` +
    `- 브라우저 저장소 쓰기: 0건\n` +
    `- MP4 생성: 0건, Mac 화면 녹화용 일반 페이지로 확인\n`;
  await mkdir(path.dirname(REPORT_PATH), {recursive: true});
  await writeFile(REPORT_PATH, report, 'utf8');
  process.stdout.write('Recording walkthrough passed; raw-content-free report written.\n');

  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve, reject) => {
    server.httpServer.close((error) => error ? reject(error) : resolve());
  });
}
