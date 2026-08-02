import {expect, test} from '@playwright/test';

type NetworkPolicyState = {
  apiCalls: string[];
  storageWrites: string[];
};

declare global {
  interface Window {
    __FPG_NETWORK_POLICY_TEST__?: NetworkPolicyState;
  }
}

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    const state = {apiCalls: [] as string[], storageWrites: [] as string[]};
    window.__FPG_NETWORK_POLICY_TEST__ = state;
    const record = (name: string) => state.apiCalls.push(name);

    for (const [name, constructor] of Object.entries({
      WebSocket: window.WebSocket,
      EventSource: window.EventSource,
      Worker: window.Worker,
      SharedWorker: window.SharedWorker,
      RTCPeerConnection: window.RTCPeerConnection,
    })) {
      if (typeof constructor === 'function') {
        Object.defineProperty(window, name, {
          configurable: true,
          value: new Proxy(constructor, {construct(target, args, newTarget) {
            record(name);
            return Reflect.construct(target, args, newTarget);
          }}),
        });
      }
    }

    const originalFetch = window.fetch.bind(window);
    window.fetch = (...args) => {
      record('fetch');
      return originalFetch(...args);
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    const observedOpen = function(
      this: XMLHttpRequest,
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null,
    ): void {
      record('XMLHttpRequest');
      originalOpen.call(this, method, url, async ?? true, username, password);
    };
    XMLHttpRequest.prototype.open = observedOpen;

    const originalBeacon = navigator.sendBeacon?.bind(navigator);
    if (originalBeacon) {
      navigator.sendBeacon = (...args) => {
        record('sendBeacon');
        return originalBeacon(...args);
      };
    }

    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      state.storageWrites.push('setItem');
      return setItem.call(this, key, value);
    };
    const removeItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function(key) {
      state.storageWrites.push('removeItem');
      return removeItem.call(this, key);
    };
    const clear = Storage.prototype.clear;
    Storage.prototype.clear = function() {
      state.storageWrites.push('clear');
      return clear.call(this);
    };

    const cookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    if (cookie?.set && cookie.get) {
      Object.defineProperty(Document.prototype, 'cookie', {
        configurable: true,
        get: cookie.get,
        set(value) {
          state.storageWrites.push('cookie');
          cookie.set!.call(this, value);
        },
      });
    }
    const indexedDb = window.indexedDB;
    const openIndexedDb = indexedDb.open.bind(indexedDb);
    indexedDb.open = (name, version) => {
      state.storageWrites.push('indexedDB.open');
      return openIndexedDb(name, version);
    };
    const deleteIndexedDb = indexedDb.deleteDatabase.bind(indexedDb);
    indexedDb.deleteDatabase = (name) => {
      state.storageWrites.push('indexedDB.deleteDatabase');
      return deleteIndexedDb(name);
    };
    if ('caches' in window) {
      const openCache = window.caches.open.bind(window.caches);
      window.caches.open = (name) => {
        state.storageWrites.push('caches.open');
        return openCache(name);
      };
      const deleteCache = window.caches.delete.bind(window.caches);
      window.caches.delete = (name) => {
        state.storageWrites.push('caches.delete');
        return deleteCache(name);
      };
    }
    const serviceWorker = navigator.serviceWorker;
    if (serviceWorker) {
      const register = serviceWorker.register.bind(serviceWorker);
      serviceWorker.register = (scriptUrl, options) => {
        state.storageWrites.push('serviceWorker.register');
        return register(scriptUrl, options);
      };
    }
  });
});

test('keeps every reviewed outcome free of egress, persistence, console content, and raw evidence', async ({page}) => {
  let unexpectedRequests: string[] = [];
  let consoleMessages: Array<Promise<string>> = [];
  let pageErrors: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    const allowedPath = /\/(?:|privacy-gateway-demo\/|privacy-gateway-demo\/[^?#]+\.(?:js|css|woff2|html|svg))$/u;
    const allowedType = new Set(['document', 'script', 'stylesheet', 'font', 'image']);
    if (
      request.method() !== 'GET' ||
      url.origin !== 'http://127.0.0.1:4173' ||
      !allowedPath.test(url.pathname) ||
      !allowedType.has(request.resourceType())
    ) {
      unexpectedRequests.push(`${request.method()}:${request.resourceType()}:${request.url()}`);
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

  await page.clock.install();
  for (const scenario of [
    {caseId: 'SYN-NORMAL-001', resultTestId: 'verified-result', modelCallCount: '1'},
    {caseId: 'SYN-BLOCK-001', resultTestId: 'request-blocked-result', modelCallCount: '0'},
    {caseId: 'SYN-WITHHOLD-001', resultTestId: 'response-withheld-result', modelCallCount: '1'},
  ] as const) {
    unexpectedRequests = [];
    consoleMessages = [];
    pageErrors = [];

    await page.goto('./');
    await page.getByRole('combobox', {name: '합성 사례 선택'}).selectOption(scenario.caseId);
    const sourceText = await page.locator('.consultation-document > p').innerText();
    await page.getByRole('button', {name: '개인정보 보호 후 요약 만들기'}).click();
    await page.clock.fastForward(8_100);
    await expect(page.getByTestId(scenario.resultTestId)).toBeVisible();
    await expect(page.getByTestId('product-workspace')).toHaveAttribute(
      'data-model-call-count',
      scenario.modelCallCount,
    );

    const protectedText = await page.locator('.protected-text').count() === 1
      ? await page.locator('.protected-text').innerText()
      : null;
    const evidenceText = await page.getByTestId('evidence-status').innerText();
    const state = await page.evaluate(() => window.__FPG_NETWORK_POLICY_TEST__);
    const consoleContent = (await Promise.all(consoleMessages)).join('\n');
    const forbiddenConsoleContent = [
      sourceText,
      protectedText,
    ].filter((value): value is string => Boolean(value));

    expect(unexpectedRequests, scenario.caseId).toEqual([]);
    expect(state?.apiCalls, scenario.caseId).toEqual([]);
    expect(state?.storageWrites, scenario.caseId).toEqual([]);
    expect(pageErrors, scenario.caseId).toEqual([]);
    for (const value of forbiddenConsoleContent) {
      expect(consoleContent, `${scenario.caseId}: console content leak`).not.toContain(value);
      expect(evidenceText, `${scenario.caseId}: evidence content leak`).not.toContain(value);
    }
    expect(consoleContent, scenario.caseId).not.toMatch(
      /가상고객(?:-[A-Z]|[A-Za-z0-9_-]+)|합성(?:연락처|계좌|인증정보)-\d{3}|\[합성_(?:연락처|계좌)[^\]\r\n]*\]|"(?:purpose|customerRequest|employeeGuidance|itemsToConfirm|nextAction)"\s*:/u,
    );
    expect(evidenceText, scenario.caseId).not.toMatch(
      /가상고객(?:-[A-Z]|[A-Za-z0-9_-]+)|합성(?:연락처|계좌|인증정보)-\d{3}|\[합성_(?:연락처|계좌)[^\]\r\n]*\]|\b(?:mapping|registry|chunks|protectedText|sourceText|purpose|customerRequest|employeeGuidance|itemsToConfirm|nextAction)\b/u,
    );
  }
});
