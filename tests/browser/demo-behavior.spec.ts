import {expect, test, type Page} from '@playwright/test';

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

test('opens as a bank consultation workspace without visible demo timeline controls', async ({page}) => {
  await page.goto('./');

  await expect(page.locator('.brand-name')).toHaveText('단디 DANDI');
  await expect(page.locator('.brand-promise')).toHaveText('금융 AI 개인정보 보호 게이트웨이');
  await expect(page.getByTestId('product-workspace')).toBeVisible();
  await expect(page.getByRole('button', {name: 'AI 상담 요약 만들기'})).toBeVisible();
  await expect(page.locator('.step-rail, .playback-bar, [data-testid="countdown"]')).toHaveCount(0);
  await expect(page.getByText('제품 콘셉트 데모 | 합성 예시 데이터')).toBeVisible();

  for (const removed of [
    '현업 대표 5명',
    '1인당 합성 과업 10건 이상',
    '실측 전 교차시험 설계',
    '검증 예정',
    '미실시',
    '30초 시연',
  ]) {
    await expect(page.getByText(removed, {exact: false})).toHaveCount(0);
  }
});

test('moves through protection, AI writing, inspection, and result states in one workspace', async ({page}) => {
  for (const [frame, state] of [
    [45, 'detecting'],
    [300, 'protecting'],
    [480, 'generating'],
    [610, 'inspecting'],
    [750, 'complete'],
    [945, 'withheld'],
  ] as const) {
    await openRecordingFrame(page, frame);
    await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', state);
  }

  await openRecordingFrame(page, 480);
  await expect(page.getByTestId('ai-activity')).toHaveAttribute('data-ai-state', 'writing');
  await expect(page.locator('.gateway-message')).toHaveText('AI가 상담 요약을 작성하고 있어요');

  await openRecordingFrame(page, 750);
  await expect(page.getByTestId('verified-result')).toBeVisible();
  await expect(page.getByTestId('verified-result')).toContainText('상담 요약이 준비되었습니다');
  await expect(page.getByTestId('verified-result').locator('dl > div')).toHaveCount(5);
});

test('runs the 22-second click flow without page errors', async ({page}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.clock.install();
  await page.goto('./');

  await page.getByRole('button', {name: 'AI 상담 요약 만들기'}).click();
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'detecting');
  await page.clock.fastForward(12_000);
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'generating');
  await page.clock.fastForward(10_100);
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'complete');
  await expect(page.getByRole('button', {name: '새 상담 요약'})).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('keeps result fields absent until the full response inspection finishes', async ({page}) => {
  await openRecordingFrame(page, 610);
  await expect(page.getByTestId('verified-result')).toHaveCount(0);
  await expect(page.getByText('자동이체 오류 상담')).toHaveCount(0);
  await expect(page.locator('.gateway-steps .is-active')).toContainText('전체 응답 검사');

  await openRecordingFrame(page, 750);
  await expect(page.getByText('자동이체 오류 상담')).toBeVisible();
  await expect(page.getByText('사람이 확인할 항목')).toBeVisible();
});

test('withholds the alternate result and provides fixed next actions', async ({page}) => {
  await openRecordingFrame(page, 945);
  await expect(page.getByTestId('blocked-result')).toBeVisible();
  await expect(page.getByTestId('verified-result')).toHaveCount(0);
  await expect(page.getByText('자동이체 오류 상담')).toHaveCount(0);

  await page.getByRole('button', {name: '직접 작성 방법 보기'}).click();
  await expect(page.getByText('확인된 내용만 직접 작성해요')).toBeVisible();
  await page.getByRole('button', {name: '이전 단계 확인'}).click();
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'inspecting');
  await openRecordingFrame(page, 945);
  await page.getByRole('button', {name: '성공 흐름으로 돌아가기'}).click();
  await expect(page.getByTestId('verified-result')).toBeVisible();
});

test('keeps the public page security metadata and synthetic identifiers', async ({page}) => {
  await page.goto('./');
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute(
    'content',
    /connect-src 'none'.*frame-src 'none'/u,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex,nofollow,nosnippet,noimageindex',
  );
  await expect(page.getByText('합성연락처-001', {exact: false})).toBeVisible();
  await expect(page.getByText('합성계좌-001', {exact: false})).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/010-\d{3,4}-\d{4}/u);
  await expect(page.locator('body')).not.toContainText(/\b\d{2,6}(?:-\d{2,6}){2,3}\b/u);
});

test('keeps detailed demo and hosting notices collapsed until requested', async ({page}) => {
  await page.goto('./');
  await expect(page.getByText(/실제 고객정보와 금융 시스템에는 연결되지 않습니다/u)).not.toBeVisible();
  await expect(page.getByText(/GitHub Pages 이용 과정/u)).not.toBeVisible();

  await page.getByText('데모 안내').click();
  await expect(page.getByText(/실제 고객정보와 금융 시스템에는 연결되지 않습니다/u)).toBeVisible();
  await page.getByText('호스팅 안내').click();
  await expect(page.getByText(/GitHub Pages 이용 과정/u)).toBeVisible();
});

test('publishes the deterministic recording bridge without visual recording controls', async ({page}) => {
  await openRecordingFrame(page, 480);
  await expect(page.getByTestId('demo-stage')).toHaveAttribute('data-recording', 'true');
  await expect(page.locator('.step-rail, .playback-bar')).toHaveCount(0);
  await expect(page.getByTestId('virtual-pointer')).toHaveCount(0);
  await expect(page.getByRole('button', {name: '단디가 처리하고 있어요'})).toBeDisabled();
  await expect(page.getByRole('button', {name: '다음 상태'})).toHaveCount(0);

  await openRecordingFrame(page, 945);
  await expect(page.getByText('[합성_계좌-01]', {exact: true})).toBeVisible();
  await expect(page.locator('body')).not.toContainText('FPG_ACCOUNT');
});
