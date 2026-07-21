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
  await page.getByTestId('product-workspace').waitFor({state: 'visible'});
  assert.equal(await page.getByTestId('product-workspace').getAttribute('data-product-state'), 'idle');
  assert.equal(await page.getByTestId('demo-stage').getAttribute('data-frame'), '0');
  assert.equal(await page.getByTestId('elapsed-time').count(), 0);

  await page.getByRole('button', {name: 'AI 상담 요약 만들기'}).click();
  const states = [];
  states.push(await page.getByTestId('product-workspace').getAttribute('data-product-state'));
  await page.clock.fastForward(5_000);
  states.push(await page.getByTestId('product-workspace').getAttribute('data-product-state'));
  await page.clock.fastForward(7_000);
  states.push(await page.getByTestId('product-workspace').getAttribute('data-product-state'));
  await page.clock.fastForward(4_000);
  states.push(await page.getByTestId('product-workspace').getAttribute('data-product-state'));
  await page.clock.fastForward(6_100);
  states.push(await page.getByTestId('product-workspace').getAttribute('data-product-state'));
  assert.deepEqual(states, ['detecting', 'protecting', 'generating', 'inspecting', 'complete']);

  await page.getByRole('button', {name: '새 상담 요약'}).waitFor({state: 'visible'});
  assert.equal(await page.getByTestId('demo-stage').getAttribute('data-frame'), '899');
  assert.equal(await page.getByTestId('verified-result').count(), 1);
  assert.equal(await page.getByTestId('elapsed-time').count(), 0);

  await page.getByRole('button', {name: '새 상담 요약'}).click();
  assert.equal(await page.getByTestId('product-workspace').getAttribute('data-product-state'), 'detecting');
  assert.equal(await page.getByTestId('countdown').count(), 0);

  const storageWrites = await page.evaluate(() => window.__FPG_RECORDING_CHECK_WRITES__);
  assert.deepEqual(unexpectedRequests, [], 'normal walkthrough made a non-local or non-GET request');
  assert.deepEqual(storageWrites, [], 'normal walkthrough wrote browser storage');

  const report = `# 화면 녹화 자동 시연 점검\n\n` +
    `이 기록은 화면 상태와 제어 흐름만 포함하며, 입력·응답 원문을 저장하지 않습니다.\n\n` +
    `- 첫 화면 정지: 통과, 클릭 전 60초를 진행해도 제품 화면과 프레임 0 유지\n` +
    `- 사용자 시작: 통과, AI 상담 요약 만들기 버튼으로만 자동 처리 진입\n` +
    `- 화면 타임라인: 없음, 경과시간과 카운트다운을 표시하지 않음\n` +
    `- 제품 상태 전환: 통과, 탐지 → 보호 → AI 작성 → 응답 검사 → 결과 공개\n` +
    `- 자동 처리 종료: 통과, 약 22초 뒤 프레임 899와 상담 요약 결과 표시\n` +
    `- 새 상담 요약: 통과, 프레임 0의 탐지 상태로 재시작\n` +
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
