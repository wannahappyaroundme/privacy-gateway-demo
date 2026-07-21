import {expect, test} from '@playwright/test';

type NetworkPolicyState = {
  calls: string[];
  storageWrites: string[];
};

declare global {
  interface Window {
    __FPG_NETWORK_POLICY_TEST__?: NetworkPolicyState;
  }
}

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    const state = {calls: [] as string[], storageWrites: [] as string[]};
    window.__FPG_NETWORK_POLICY_TEST__ = state;
    const record = (name: string) => state.calls.push(name);

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

test('makes no application egress or browser storage writes across automatic, result, block, and help states', async ({page}) => {
  const unexpectedRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    const allowedPath = /\/(?:|privacy-gateway-demo\/|privacy-gateway-demo\/[^?#]+\.(?:js|css|woff2|html))$/u;
    const allowedType = new Set(['document', 'script', 'stylesheet', 'font']);
    if (url.origin !== 'http://127.0.0.1:4173' || !allowedPath.test(url.pathname) || !allowedType.has(request.resourceType())) {
      unexpectedRequests.push(`${request.resourceType()}:${request.url()}`);
    }
  });

  await page.clock.install();
  await page.goto('./');
  await page.getByRole('button', {name: 'AI 상담 요약 만들기'}).click();
  await page.clock.fastForward(22_100);
  await expect(page.getByTestId('verified-result')).toBeVisible();
  await page.getByRole('button', {name: '확인이 필요한 경우 보기'}).click();
  await expect(page.getByTestId('blocked-result')).toBeVisible();
  await page.getByRole('button', {name: '직접 작성 방법 보기'}).click();
  await expect(page.locator('.help-steps')).toBeVisible();

  const state = await page.evaluate(() => window.__FPG_NETWORK_POLICY_TEST__);
  expect(unexpectedRequests).toEqual([]);
  expect(state?.calls).toEqual([]);
  expect(state?.storageWrites).toEqual([]);
});
