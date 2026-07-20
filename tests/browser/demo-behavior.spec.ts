import {expect, test, type Page} from '@playwright/test';

type RecordingBridge = {
  ready: Promise<void>;
  setFrame(frame: number): Promise<{frame: number; ready: boolean}>;
};

async function recordingBridge(page: Page): Promise<RecordingBridge> {
  await page.goto('?record=1');
  await page.waitForFunction(() => '__FPG_RECORDING_V1__' in window);
  await page.evaluate(() => window.__FPG_RECORDING_V1__?.ready);
  return {
    ready: Promise.resolve(),
    setFrame: (frame) =>
      page.evaluate((nextFrame) => window.__FPG_RECORDING_V1__!.setFrame(nextFrame), frame),
  };
}

test('renders the sample-led cobalt shell with one current step', async ({page}) => {
  await page.clock.install();
  await page.goto('./');
  await expect(page.locator('.brand-name')).toHaveText('금융 AI 개인정보 보호 게이트웨이');
  await expect(page.locator('.scope-badges span')).toHaveCount(2);
  await page.getByRole('button', {name: '시연 시작'}).click();
  await page.clock.fastForward(3_100);
  const current = page.locator('.step-rail button[aria-current="step"]');
  await expect(current).toHaveCount(1);
  expect(await current.evaluate((element) => getComputedStyle(element).borderColor))
    .toBe('rgb(39, 104, 232)');
});

test('starts motionless, then shows the user-triggered countdown', async ({page}) => {
  await page.goto('./');

  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute(
    'content',
    /script-src-attr 'none'; style-src-elem 'self'; style-src-attr 'unsafe-inline';.*media-src 'none'; frame-src 'none'; worker-src 'none'; child-src 'none'; manifest-src 'none'/u,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex,nofollow,nosnippet,noimageindex',
  );

  await expect(page.getByTestId('demo-start')).toBeVisible();
  await expect(page.getByText('30초 시연')).toBeVisible();
  await expect(page.getByText('화면 녹화를 시작한 뒤 시연 버튼을 눌러주세요')).toBeVisible();
  await expect(page.getByTestId('virtual-pointer')).toHaveCount(0);
  await expect(page.getByTestId('elapsed-time')).toHaveCount(0);

  await page.getByRole('button', {name: '시연 시작'}).click();

  await expect(page.getByTestId('demo-start')).toHaveCount(0);
  await expect(page.getByTestId('countdown')).toHaveText('3');
});

test('keeps verified result absent until inspection and withholds the block branch', async ({
  page,
}) => {
  await page.setViewportSize({width: 1_920, height: 1_080});
  const bridge = await recordingBridge(page);

  await bridge.setFrame(610);
  await expect(page.getByTestId('inspection-gate')).toBeVisible();
  await expect(page.getByText('정확히 연결됨 → 결과 공개')).toBeVisible();
  await expect(page.getByText('형태가 달라짐 → 결과 미공개')).toBeVisible();
  await expect(page.getByTestId('verified-result')).toHaveCount(0);
  await expect(page.getByText('자동이체 오류 상담')).toHaveCount(0);

  await bridge.setFrame(750);
  await expect(page.getByTestId('verified-result')).toBeVisible();
  await expect(page.getByText('자동이체 오류 상담')).toBeVisible();

  await bridge.setFrame(945);
  await expect(page.getByTestId('verified-result')).toHaveCount(0);
  await expect(page.getByTestId('blocked-result')).toBeVisible();
  await expect(page.getByText('자동이체 오류 상담')).toHaveCount(0);
});

test('block actions navigate to reviewed frames and reveal fixed help', async ({page}) => {
  await page.setViewportSize({width: 1_920, height: 1_080});
  const bridge = await recordingBridge(page);
  await bridge.setFrame(945);

  await page.getByRole('button', {name: '직접 작성 방법 보기'}).click();
  await expect(page.getByTestId('demo-stage')).toHaveAttribute('data-frame', '975');
  await expect(page.getByText('확인된 내용만 직접 작성해요')).toBeVisible();

  await page.getByRole('button', {name: '이전 단계 확인'}).click();
  await expect(page.getByTestId('demo-stage')).toHaveAttribute('data-frame', '610');

  await bridge.setFrame(945);
  await page.getByRole('button', {name: '성공 흐름으로 돌아가기'}).click();
  await expect(page.getByTestId('demo-stage')).toHaveAttribute('data-frame', '750');
  await expect(page.getByTestId('verified-result')).toBeVisible();
});

test('keeps recording result and evidence typography readable at reviewed frames', async ({page}) => {
  await page.setViewportSize({width: 1_920, height: 1_080});
  const bridge = await recordingBridge(page);

  await bridge.setFrame(750);
  await expect(page.getByTestId('verified-result')).toBeVisible();
  const resultTypography = await page.locator('.result-field').evaluateAll((rows) =>
    rows.map((row) => ({
      label: Number.parseFloat(getComputedStyle(row.querySelector('dt')!).fontSize),
      value: Number.parseFloat(getComputedStyle(row.querySelector('dd')!).fontSize),
    })),
  );
  expect(resultTypography.every(({label, value}) => label >= 22 && value >= 26)).toBe(true);
  const resultBounds = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('[data-testid="demo-stage"]')!.getBoundingClientRect();
    const result = document.querySelector<HTMLElement>('[data-testid="verified-result"]')!.getBoundingClientRect();
    const footer = document.querySelector<HTMLElement>('.app-footer')!.getBoundingClientRect();
    return {stage, result, footer};
  });
  expect(resultBounds.result.top).toBeGreaterThanOrEqual(resultBounds.stage.top);
  expect(resultBounds.result.bottom).toBeLessThanOrEqual(resultBounds.footer.top);

  await bridge.setFrame(855);
  const evidenceTypography = await page.locator('.evidence-table dl > div').evaluateAll((rows) =>
    rows.map((row) => ({
      label: Number.parseFloat(getComputedStyle(row.querySelector('dt')!).fontSize),
      value: Number.parseFloat(getComputedStyle(row.querySelector('dd')!).fontSize),
    })),
  );
  expect(evidenceTypography.every(({label, value}) => label >= 22 && value >= 22)).toBe(true);
  const finishBounds = await page.evaluate(() => {
    const roundtrip = document.querySelector<HTMLElement>('.roundtrip-flow')!.getBoundingClientRect();
    const grid = document.querySelector<HTMLElement>('.finish-grid')!.getBoundingClientRect();
    return {roundtrip, grid};
  });
  expect(finishBounds.roundtrip.bottom).toBeLessThanOrEqual(finishBounds.grid.top);
});

test('uses only previous and next controls after a mobile policy tightening', async ({page}) => {
  await page.setViewportSize({width: 1_024, height: 900});
  await page.goto('./');
  await page.getByRole('button', {name: '시연 시작'}).click();

  await page.setViewportSize({width: 767, height: 900});
  await expect(page.getByText('단계별로 편하게 확인할 수 있어요')).toBeVisible();
  await expect(page.getByTestId('virtual-pointer')).toHaveCount(0);
  await expect(page.locator('.playback-bar button')).toHaveText(['이전', '다음']);

  await page.setViewportSize({width: 1_024, height: 900});
  await expect(page.getByRole('button', {name: '일시정지'})).toHaveCount(0);
  await expect(page.locator('.playback-bar button')).toHaveText(['이전', '다음']);
});

test('uses only previous and next controls after a reduced-motion preference change', async ({page}) => {
  await page.goto('./');
  await page.getByRole('button', {name: '시연 시작'}).click();

  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect(page.getByText('단계별로 편하게 확인할 수 있어요')).toBeVisible();
  await expect(page.getByTestId('virtual-pointer')).toHaveCount(0);
  await expect(page.locator('.playback-bar button')).toHaveText(['이전', '다음']);

  await page.emulateMedia({reducedMotion: 'no-preference'});
  await expect(page.locator('.playback-bar button')).toHaveText(['이전', '다음']);
});

test('puts pause before steps, resumes manual playback, and removes controls in the block branch', async ({page}) => {
  await page.goto('./');
  await page.getByRole('button', {name: '시연 시작'}).click();
  await expect(page.getByRole('button', {name: '일시정지'})).toBeVisible({timeout: 5_000});

  const domOrder = await page.evaluate(() => {
    const controls = document.querySelector('.playback-bar');
    const steps = document.querySelector('.step-rail');
    return controls !== null && steps !== null && Boolean(controls.compareDocumentPosition(steps) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(domOrder).toBe(true);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', {name: '일시정지'})).toBeFocused();
  await page.getByRole('button', {name: '단계별 보기'}).click();
  await page.getByRole('button', {name: '재생'}).click();
  await expect(page.getByTestId('countdown')).toHaveCount(0);
  await expect(page.getByRole('button', {name: '일시정지'})).toBeVisible();

  await page.getByRole('button', {name: '단계별 보기'}).click();
  await page.getByRole('button', {name: '확인이 필요한 경우'}).click();
  await expect(page.getByTestId('blocked-result')).toBeVisible();
  await expect(page.locator('.playback-bar')).toHaveCount(0);
});

test('renders the approved validation copy from COPY.validation', async ({page}) => {
  await page.setViewportSize({width: 1_920, height: 1_080});
  const bridge = await recordingBridge(page);
  await bridge.setFrame(855);

  await expect(page.getByText('현업 대표 5명')).toBeVisible();
  await expect(page.getByText('1인당 합성 과업 10건 이상')).toBeVisible();
});

test('renders calculated validation progress before the plan is complete', async ({page}) => {
  await page.setViewportSize({width: 1_920, height: 1_080});
  const bridge = await recordingBridge(page);
  await bridge.setFrame(820);

  await expect(page.getByText('현업 대표 2명')).toBeVisible();
  await expect(page.getByText('1인당 합성 과업 4건')).toBeVisible();
  await expect(page.getByText('현업 대표 5명')).toHaveCount(0);
  await expect(page.getByText('1인당 합성 과업 10건 이상')).toHaveCount(0);
});
