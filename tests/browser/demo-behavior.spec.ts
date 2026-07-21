import {expect, test, type Page} from '@playwright/test';

import {SUMMARIZE_BUTTON_BOUNDS} from '../../src/demo/timeline';

async function openRecordingFrame(page: Page, frame: number): Promise<void> {
  await page.setViewportSize({width: 1_920, height: 1_080});
  await page.goto('?record=1');
  await page.waitForFunction(() => '__FPG_RECORDING_V1__' in window);
  await page.evaluate(() => window.__FPG_RECORDING_V1__!.ready);
  await page.evaluate(
    async (value) => window.__FPG_RECORDING_V1__!.setFrame(value),
    frame,
  );
}

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

test('shows the four-part roundtrip overview and the two existing-method gaps', async ({page}) => {
  await openRecordingFrame(page, 45);
  await expect(page.getByTestId('overview-dashboard')).toBeVisible();
  await expect(page.getByTestId('overview-dashboard').getByRole('listitem')).toHaveCount(4);
  await expect(page.getByTestId('overview-dashboard')).toContainText('검증 예정');
  await expect(page.getByTestId('overview-dashboard')).toContainText('현업 대표 5명');
  await expect(page.getByTestId('overview-dashboard')).toContainText('1인당 합성 과업 10건 이상');
  await openRecordingFrame(page, 150);
  await expect(page.getByTestId('gap-comparison')).toContainText('직접 삭제');
  await expect(page.getByTestId('gap-comparison')).toContainText('요청 전체 차단');
});

test('renders the protection matrix with synthetic examples only', async ({page}) => {
  await openRecordingFrame(page, 360);
  const matrix = page.getByTestId('protection-matrix');
  await expect(matrix).toContainText('직접 식별자');
  await expect(matrix).toContainText('준식별자');
  await expect(matrix).toContainText('민감 정보');
  await expect(matrix).toContainText('비개인정보');
  await expect(matrix).toContainText('마스킹');
  await expect(matrix).toContainText('가명처리');
  await expect(matrix).toContainText('비식별화');
  await expect(matrix).toContainText('토큰화');
  await expect(matrix).toContainText('원문 제공');
  await expect(matrix).toContainText('합성연락처-001');
  await expect(matrix).toContainText('정책 시뮬레이션이며 실제 처리 성능을 뜻하지 않습니다');
  await expect(matrix.getByRole('row')).toHaveCount(5);
  await expect(matrix).not.toContainText(/010-\d{3,4}-\d{4}/u);
  await expect(matrix).not.toContainText(/\b\d{2,6}(?:-\d{2,6}){2,3}\b/u);
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

test('keeps result content absent while showing six inspection checks and withholds the block branch', async ({
  page,
}) => {
  await page.setViewportSize({width: 1_920, height: 1_080});
  const bridge = await recordingBridge(page);

  await bridge.setFrame(610);
  await expect(page.getByTestId('inspection-dashboard')).toBeVisible();
  await expect(page.locator('[data-testid="inspection-check"]')).toHaveCount(6);
  await expect(page.locator('.inspection-progress-list .is-complete')).toHaveCount(3);
  await expect(page.locator('.inspection-check-table .is-complete')).toHaveCount(3);
  await expect(page.locator('.inspection-progress-list .is-active')).toHaveCount(1);
  await expect(page.locator('.inspection-check-table .is-active')).toHaveCount(1);
  await expect(page.locator('.inspection-progress-list li:not(.is-complete):not(.is-active)')).toHaveCount(2);
  await expect(page.locator('.inspection-detail-card__heading')).toContainText('3/6 통과');
  await expect(page.locator('.inspection-summary')).toContainText('3 통과');
  await expect(page.getByTestId('inspection-gate')).toBeVisible();
  await expect(page.getByText('정확히 연결됨 → 결과 공개')).toBeVisible();
  await expect(page.getByText('형태가 달라짐 → 결과 미공개')).toBeVisible();
  await expect(page.getByTestId('verified-result')).toHaveCount(0);
  await expect(page.getByText('자동이체 오류 상담')).toHaveCount(0);

  await bridge.setFrame(689);
  await expect(page.locator('.inspection-detail-card__heading')).toContainText('5/6 통과');
  await expect(page.locator('.inspection-summary')).toContainText('1 검사 중');
  await expect(page.getByTestId('verified-result')).toHaveCount(0);

  await bridge.setFrame(750);
  await expect(page.getByTestId('verified-result')).toBeVisible();
  await expect(page.locator('.result-field')).toHaveCount(5);
  await expect(page.getByText('사람이 확인할 항목')).toBeVisible();
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
  await expect(page.getByText('이전 단계를 확인하거나 확인된 내용만 직접 작성해 이어갈 수 있어요.')).toBeVisible();

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

test('keeps the fixed future validation sample visible before its card reveal completes', async ({page}) => {
  await page.setViewportSize({width: 1_920, height: 1_080});
  const bridge = await recordingBridge(page);
  await bridge.setFrame(820);

  await expect(page.getByText('현업 대표 5명')).toBeVisible();
  await expect(page.getByText('1인당 합성 과업 10건 이상')).toBeVisible();
  await expect(page.locator('.validation-plan').getByText('미실시')).toBeVisible();
});

test('places the recorded pointer hotspot inside the rendered summarize button', async ({page}) => {
  await openRecordingFrame(page, 156);

  const bounds = await page.evaluate(() => {
    const button = document.querySelector<HTMLElement>('.source-action')!.getBoundingClientRect();
    const pointer = document.querySelector<HTMLElement>('[data-testid="virtual-pointer"]')!;
    return {
      button: {left: button.left, top: button.top, right: button.right, bottom: button.bottom},
      pointer: {
        x: Number.parseFloat(pointer.style.left),
        y: Number.parseFloat(pointer.style.top),
      },
    };
  });

  expect(bounds.button).toEqual({
    left: SUMMARIZE_BUTTON_BOUNDS.x,
    top: SUMMARIZE_BUTTON_BOUNDS.y,
    right: SUMMARIZE_BUTTON_BOUNDS.x + SUMMARIZE_BUTTON_BOUNDS.width,
    bottom: SUMMARIZE_BUTTON_BOUNDS.y + SUMMARIZE_BUTTON_BOUNDS.height,
  });
  expect(bounds.pointer.x).toBeGreaterThanOrEqual(bounds.button.left);
  expect(bounds.pointer.x).toBeLessThanOrEqual(bounds.button.right);
  expect(bounds.pointer.y).toBeGreaterThanOrEqual(bounds.button.top);
  expect(bounds.pointer.y).toBeLessThanOrEqual(bounds.button.bottom);
});

test('places the normal public-flow pointer hotspot inside the summarize button', async ({page}) => {
  await page.setViewportSize({width: 1_920, height: 1_080});
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.clock.install();
  await page.goto('./');
  await page.getByRole('button', {name: '시연 시작'}).click();
  await page.clock.fastForward(3_000);
  await expect(page.getByTestId('elapsed-time')).toHaveText('00:00 / 00:30');
  await page.clock.fastForward((156 * 1_000) / 30);
  await expect(page.getByTestId('demo-stage')).toHaveAttribute('data-frame', '156');

  const bounds = await page.evaluate(() => {
    const button = document.querySelector<HTMLElement>('.source-action')!.getBoundingClientRect();
    const pointer = document.querySelector<HTMLElement>('[data-testid="virtual-pointer"]')!;
    return {
      button: {left: button.left, top: button.top, right: button.right, bottom: button.bottom},
      pointer: {
        x: Number.parseFloat(pointer.style.left),
        y: Number.parseFloat(pointer.style.top),
      },
    };
  });

  expect(bounds.pointer.x).toBeGreaterThanOrEqual(bounds.button.left);
  expect(bounds.pointer.x).toBeLessThanOrEqual(bounds.button.right);
  expect(bounds.pointer.y).toBeGreaterThanOrEqual(bounds.button.top);
  expect(bounds.pointer.y).toBeLessThanOrEqual(bounds.button.bottom);
});

test('uses exact scene boundaries for heading numbers and the current rail step', async ({page}) => {
  await page.setViewportSize({width: 1_920, height: 1_080});
  const bridge = await recordingBridge(page);
  const boundaries = [
    [89, '01', '개요'],
    [90, '02', '기존 방식의 빈틈'],
    [179, '02', '기존 방식의 빈틈'],
    [180, '03', '정보 찾기'],
    [299, '03', '정보 찾기'],
    [300, '04', '유형별 보호'],
    [419, '04', '유형별 보호'],
    [420, '05', '승인 경로'],
    [539, '05', '승인 경로'],
    [540, '06', '전체 응답 검사'],
    [689, '06', '전체 응답 검사'],
    [690, '07', '확인된 결과'],
    [809, '07', '확인된 결과'],
    [810, '08', '혁신과 검증 예정'],
  ] as const;

  for (const [frame, number, label] of boundaries) {
    await bridge.setFrame(frame);
    await expect(page.locator('.scene-heading > span')).toHaveText(number);
    await expect(page.locator('.step-rail button[aria-current="step"]')).toContainText(label);
  }
});

test('shows only the current and adjacent steps on tablet without rail scrolling', async ({page}) => {
  await page.setViewportSize({width: 768, height: 1_024});
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto('./');
  await page.getByRole('button', {name: '시연 시작'}).click();
  await page.getByRole('button', {name: '다음'}).click();
  await page.getByRole('button', {name: '다음'}).click();
  await page.getByRole('button', {name: '다음'}).click();
  await page.getByRole('button', {name: '다음'}).click();

  await expect(page.locator('.step-rail__item:visible')).toHaveCount(3);
  await expect(page.locator('.step-rail__item.is-previous:visible')).toHaveCount(1);
  await expect(page.locator('.step-rail__item.is-current:visible')).toHaveCount(1);
  await expect(page.locator('.step-rail__item.is-next:visible')).toHaveCount(1);
  const railOverflow = await page.locator('.step-rail').evaluate(
    (rail) => rail.scrollWidth - rail.clientWidth,
  );
  expect(railOverflow).toBe(0);
});
