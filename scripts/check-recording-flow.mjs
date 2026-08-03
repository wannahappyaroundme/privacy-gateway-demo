import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

import {chromium} from '@playwright/test';
import {preview} from 'vite';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const BASE_URL = 'http://127.0.0.1:4175/privacy-gateway-demo/';
const REPORT_PATH = path.join(ROOT, 'artifacts', 'recording-check.md');
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
  ['detected', ['detected', 'DETECTED', 'detecting']],
  ['protected', ['protected', 'PROTECTED', 'protecting']],
  ['mocked', ['mocked', 'MOCKED', 'summarizing']],
  ['inspected', ['inspected', 'INSPECTED', 'inspecting']],
  ['verified', ['published', 'VERIFIED', 'verified']],
  ['request-blocked', ['protected', 'REQUEST_BLOCKED_UNSUPPORTED', 'request-blocked']],
  ['response-withheld', ['inspected', 'RESPONSE_WITHHELD_MARKER', 'response-withheld']],
]);

function installBoundaryObservers() {
  const state = {apiCalls: [], storageWrites: []};
  window.__FPG_RECORDING_CHECK__ = state;
  const recordApi = (name) => state.apiCalls.push(name);
  for (const [name, constructor] of Object.entries({
    WebSocket: window.WebSocket,
    EventSource: window.EventSource,
  })) {
    if (typeof constructor === 'function') {
      Object.defineProperty(window, name, {
        configurable: true,
        value: new Proxy(constructor, {
          construct(target, args, newTarget) {
            recordApi(name);
            return Reflect.construct(target, args, newTarget);
          },
        }),
      });
    }
  }
  const originalFetch = window.fetch.bind(window);
  window.fetch = (...args) => {
    recordApi('fetch');
    return originalFetch(...args);
  };
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(...args) {
    recordApi('XMLHttpRequest');
    return originalOpen.apply(this, args);
  };
  const originalBeacon = navigator.sendBeacon?.bind(navigator);
  if (originalBeacon) {
    navigator.sendBeacon = (...args) => {
      recordApi('sendBeacon');
      return originalBeacon(...args);
    };
  }

  const observe = (name, target, method) => {
    const original = target?.[method];
    if (typeof original !== 'function') return;
    target[method] = function(...args) {
      state.storageWrites.push(name);
      return original.apply(this, args);
    };
  };
  observe('storage.setItem', Storage.prototype, 'setItem');
  observe('storage.removeItem', Storage.prototype, 'removeItem');
  observe('storage.clear', Storage.prototype, 'clear');
  observe('indexedDB.open', window.indexedDB, 'open');
  observe('indexedDB.deleteDatabase', window.indexedDB, 'deleteDatabase');
  observe('caches.open', window.caches, 'open');
  observe('caches.delete', window.caches, 'delete');
  observe('serviceWorker.register', navigator.serviceWorker, 'register');
  const cookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
  if (cookie?.set && cookie.get) {
    Object.defineProperty(Document.prototype, 'cookie', {
      configurable: true,
      get: cookie.get,
      set(value) {
        state.storageWrites.push('cookie');
        cookie.set.call(this, value);
      },
    });
  }
}

const server = await preview({
  root: ROOT,
  logLevel: 'silent',
  preview: {host: '127.0.0.1', port: 4_175, strictPort: true},
});
const browser = await chromium.launch();

try {
  const unexpectedRequests = [];
  for (const caseId of ['SYN-NORMAL-001', 'SYN-BLOCK-001', 'SYN-WITHHOLD-001']) {
    const context = await browser.newContext({
      viewport: {width: 1_920, height: 1_080},
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
    });
    await context.addInitScript(installBoundaryObservers);
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.origin !== new URL(BASE_URL).origin || request.method() !== 'GET') {
        unexpectedRequests.push(`${request.method()}:${url.origin}${url.pathname}`);
      }
    });
    page.on('console', (message) => {
      consoleMessages.push((async () => {
        const values = await Promise.all(
          message.args().map(async (argument) => {
            try {
              return await argument.jsonValue();
            } catch {
              return message.text();
            }
          }),
        );
        return `${message.type()}:${JSON.stringify(values)}`;
      })());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(`${BASE_URL}?record=1&case=${caseId}`, {waitUntil: 'networkidle'});
    await page.waitForFunction(() => '__FPG_RECORDING_V1__' in window);
    const sourceText = await page.locator('.consultation-document > p').innerText();
    for (const [, frame, stage] of CAPTURES.filter(([captureCase]) => captureCase === caseId)) {
      const snapshot = await page.evaluate(async (value) => {
        const result = await window.__FPG_RECORDING_V1__.setFrame(value);
        return {result, state: window.__FPG_RECORDING_V1__.getState()};
      }, frame);
      const [reachedStage, outcome, productState] = EXPECTED_RUN.get(stage);
      assert.deepEqual(
        {
          frame: snapshot.result.frame,
          ready: snapshot.result.ready,
          caseId: snapshot.state.run.caseId,
          reachedStage: snapshot.state.run.reachedStage,
          outcome: snapshot.state.run.outcome,
          productState: await page.getByTestId('product-workspace').getAttribute('data-product-state'),
        },
        {frame, ready: true, caseId, reachedStage, outcome, productState},
      );
    }

    if (caseId === 'SYN-BLOCK-001') {
      assert.equal(
        await page.getByTestId('product-workspace').getAttribute('data-model-call-count'),
        '0',
      );
    }
    const protectedText = await page.locator('.protected-text').count() === 1
      ? await page.locator('.protected-text').innerText()
      : null;
    const evidenceText = await page.getByTestId('evidence-status').innerText();
    const consoleContent = (await Promise.all(consoleMessages)).join('\n');
    assert.equal(consoleContent.includes(sourceText), false, `${caseId}: console contains source text`);
    assert.equal(evidenceText.includes(sourceText), false, `${caseId}: evidence contains source text`);
    if (protectedText) {
      assert.equal(consoleContent.includes(protectedText), false, `${caseId}: console contains protected text`);
      assert.equal(evidenceText.includes(protectedText), false, `${caseId}: evidence contains protected text`);
    }
    assert.doesNotMatch(
      consoleContent,
      /가상고객(?:-[A-Z]|[A-Za-z0-9_-]+)|합성(?:연락처|계좌|인증정보)-\d{3}|\[합성_(?:연락처|계좌)[^\]\r\n]*\]|"(?:purpose|customerRequest|employeeGuidance|itemsToConfirm|nextAction)"\s*:/u,
    );
    assert.doesNotMatch(
      evidenceText,
      /가상고객(?:-[A-Z]|[A-Za-z0-9_-]+)|합성(?:연락처|계좌|인증정보)-\d{3}|\[합성_(?:연락처|계좌)[^\]\r\n]*\]|\b(?:mapping|registry|chunks|protectedText|sourceText|purpose|customerRequest|employeeGuidance|itemsToConfirm|nextAction)\b/u,
    );
    const observed = await page.evaluate(() => window.__FPG_RECORDING_CHECK__);
    assert.deepEqual(observed.apiCalls, [], `${caseId}: browser API call`);
    assert.deepEqual(observed.storageWrites, [], `${caseId}: browser storage write`);
    assert.deepEqual(pageErrors, [], `${caseId}: page error`);
    await context.close();
  }

  assert.deepEqual(unexpectedRequests, [], 'recording made a non-local or non-GET request');
  const report = `# 화면 녹화 자동 시연 점검\n\n` +
    `이 기록은 화면 상태와 제어 흐름만 포함하며, 입력·응답 원문을 저장하지 않습니다.\n\n` +
    `- 고정 녹화 주소: 통과, 검수된 3개 case query만 사용\n` +
    `- 대표 화면: 통과, 0..899 범위의 7개 상태 확인\n` +
    `- 정상 흐름: 통과, 탐지 → 보호 → 로컬 모의 요약 → 전체 검사 → 결과 공개\n` +
    `- 요청 차단: 통과, 모의 모델 호출 0회\n` +
    `- 결과 미공개: 통과, 검사 실패 뒤 결과 잠금\n` +
    `- 외부 요청: 0건\n` +
    `- 브라우저 API 호출: 0건\n` +
    `- 브라우저 저장소 쓰기: 0건\n` +
    `- 콘솔·실행 근거 원문 노출: 0건\n` +
    `- MP4 생성: 0건, Mac 화면 녹화용 고정 화면으로 확인\n`;
  await mkdir(path.dirname(REPORT_PATH), {recursive: true});
  await writeFile(REPORT_PATH, report, 'utf8');
  process.stdout.write('Recording walkthrough passed for 7 reviewed states; raw-content-free report written.\n');
} finally {
  await browser.close();
  await new Promise((resolve, reject) => {
    server.httpServer.close((error) => error ? reject(error) : resolve());
  });
}
