import {expect, test} from '@playwright/test';

test.use({
  viewport: {width: 1_920, height: 1_080},
  deviceScaleFactor: 1,
  colorScheme: 'light',
});

test('keeps the product workspace idle until click and completes the Mac recording walkthrough', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference', colorScheme: 'light'});
  await page.clock.install();
  await page.goto('./');

  await page.clock.fastForward(60_000);
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'idle');
  await expect(page.getByTestId('demo-stage')).toHaveAttribute('data-frame', '0');
  await expect(page.locator('.playback-bar, [data-testid="countdown"], [data-testid="elapsed-time"]')).toHaveCount(0);

  await page.getByRole('button', {name: 'AI 상담 요약 만들기'}).click();
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'detecting');
  await expect(page.getByRole('button', {name: '단디가 처리하고 있어요'})).toBeDisabled();

  await page.clock.fastForward(5_000);
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'protecting');
  await page.clock.fastForward(7_000);
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'generating');
  await page.clock.fastForward(4_000);
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'inspecting');
  await page.clock.fastForward(6_100);

  await expect(page.getByTestId('demo-stage')).toHaveAttribute('data-frame', '899');
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'complete');
  await expect(page.getByTestId('verified-result')).toBeVisible();
  await expect(page.getByRole('button', {name: '새 상담 요약'})).toBeVisible();

  await page.getByRole('button', {name: '새 상담 요약'}).click();
  await expect(page.getByTestId('demo-stage')).toHaveAttribute('data-frame', '0');
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'detecting');
});
