import {expect, test} from '@playwright/test';

test.use({
  viewport: {width: 1_920, height: 1_080},
  deviceScaleFactor: 1,
  colorScheme: 'light',
});

test('keeps the normal page idle until click and completes the Mac recording walkthrough', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference', colorScheme: 'light'});
  await page.clock.install();
  await page.goto('./');

  await page.clock.fastForward(60_000);
  await expect(page.getByTestId('demo-start')).toBeVisible();
  await expect(page.getByTestId('demo-stage')).toHaveAttribute('data-frame', '0');
  await expect(page.getByTestId('elapsed-time')).toHaveCount(0);

  await page.getByRole('button', {name: '시연 시작'}).click();
  await expect(page.getByTestId('countdown')).toHaveText('3');

  await page.clock.fastForward(1_000);
  await expect(page.getByTestId('countdown')).toHaveText('2');
  await page.clock.fastForward(1_000);
  await expect(page.getByTestId('countdown')).toHaveText('1');
  await page.clock.fastForward(1_000);

  await expect(page.getByTestId('demo-stage')).toHaveAttribute('data-frame', '0');
  await expect(page.getByTestId('elapsed-time')).toHaveText('00:00 / 00:30');

  await page.clock.fastForward(30_000);
  await expect(page.getByTestId('demo-stage')).toHaveAttribute('data-frame', '899');
  await expect(page.getByTestId('elapsed-time')).toHaveText('00:30 / 00:30');
  await expect(page.getByRole('heading', {name: '시연이 끝났어요'})).toBeVisible();
  await expect(page.getByRole('button', {name: '다시 시연'})).toBeVisible();

  await page.getByRole('button', {name: '다시 시연'}).click();
  await expect(page.getByTestId('countdown')).toHaveText('3');
});
