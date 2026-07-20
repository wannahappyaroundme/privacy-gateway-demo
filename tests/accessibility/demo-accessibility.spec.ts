import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Page} from '@playwright/test';

async function startDemo(page: Page): Promise<void> {
  await page.goto('./');
  await page.getByRole('button', {name: '시연 시작'}).click();
  await expect(page.getByTestId('countdown')).toHaveText('3');
}

async function waitForPlayback(page: Page): Promise<void> {
  await expect(page.getByRole('button', {name: '일시정지'})).toBeVisible({timeout: 5_000});
}

async function startPlayback(page: Page): Promise<void> {
  await page.clock.install();
  await startDemo(page);
  await page.clock.fastForward(3_100);
  await waitForPlayback(page);
}

async function focusPage(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });
}

const REVIEWED_STEP_FRAMES: Readonly<Record<string, number>> = {
  '기존 방식의 빈틈': 150,
  '정보 찾기': 225,
  '승인 경로': 480,
  '전체 응답 검사': 610,
  '확인된 결과': 750,
  '혁신과 검증 예정': 855,
};

async function selectStepWithoutAutoScroll(page: Page, name: string): Promise<void> {
  const step = page.locator('.step-rail button').filter({hasText: name});
  await step.dispatchEvent('click');
  await expect(page.getByTestId('demo-stage')).toHaveAttribute(
    'data-frame',
    String(REVIEWED_STEP_FRAMES[name]),
  );
}

async function recordingBridge(page: Page): Promise<{setFrame(frame: number): Promise<void>}> {
  await page.setViewportSize({width: 1_920, height: 1_080});
  await page.goto('?record=1');
  await page.waitForFunction(() => '__FPG_RECORDING_V1__' in window);
  await page.evaluate(() => window.__FPG_RECORDING_V1__?.ready);
  return {
    setFrame: async (frame) => {
      await page.evaluate((nextFrame) => window.__FPG_RECORDING_V1__!.setFrame(nextFrame), frame);
    },
  };
}

function criticalOrSerious(results: Awaited<ReturnType<AxeBuilder['analyze']>>) {
  return results.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? ''));
}

test('keeps the scope badge icons decorative', async ({page}) => {
  await page.goto('./');
  const icons = page.locator('.scope-badges span > svg');
  await expect(icons).toHaveCount(2);
  await expect(icons.first()).toHaveAttribute('aria-hidden', 'true');
  await expect(icons.last()).toHaveAttribute('aria-hidden', 'true');
});

test('has no critical or serious axe violations in the start and manual views', async ({page}) => {
  await page.goto('./');
  let results = await new AxeBuilder({page}).analyze();
  expect(results.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? ''))).toEqual([]);

  await page.setViewportSize({width: 390, height: 844});
  results = await new AxeBuilder({page}).analyze();
  expect(results.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? ''))).toEqual([]);
});

test('has no critical or serious axe violations in every major rendered state', async ({page}) => {
  await page.goto('./');
  expect(criticalOrSerious(await new AxeBuilder({page}).analyze())).toEqual([]);

  const bridge = await recordingBridge(page);
  for (const frame of [45, 225, 480, 610, 750, 855, 945, 975]) {
    await bridge.setFrame(frame);
    expect(criticalOrSerious(await new AxeBuilder({page}).analyze())).toEqual([]);
  }
});

test('exposes both inspection progress indicators without relying on color', async ({page}) => {
  const bridge = await recordingBridge(page);
  await bridge.setFrame(610);

  await expect(page.getByRole('progressbar')).toHaveCount(2);
  await expect(page.getByRole('progressbar', {name: '전체 응답 검사 진행률'}))
    .toHaveAttribute('aria-valuenow', '55');
  await expect(page.getByRole('progressbar', {name: '결과 공개 전 검사 진행률'}))
    .toHaveAttribute('aria-valuenow', '55');
  await expect(page.locator('.inspection-progress-list .is-active')).toContainText('검사 중');
  await expect(page.locator('.inspection-check-table .is-active')).toContainText('검사 중');
});

test('keeps the start control first, exposes pause first during playback, and announces countdown once', async ({page}) => {
  await page.clock.install();
  await page.goto('./');

  await focusPage(page);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', {name: '시연 시작'})).toBeFocused();

  await page.getByRole('button', {name: '시연 시작'}).click();
  const countdown = page.locator('.countdown-layout');
  await expect(countdown).toHaveAttribute('aria-live', 'assertive');
  await expect(countdown.getByTestId('countdown')).toHaveAttribute('aria-hidden', 'true');

  await page.clock.fastForward(3_100);
  await waitForPlayback(page);
  await expect(page.getByTestId('live-region')).toHaveText('');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', {name: '일시정지'})).toBeFocused();
});

test('uses global shortcuts outside interactive controls and native button behavior inside them', async ({page}) => {
  await startPlayback(page);

  await focusPage(page);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-testid="demo-stage"]')).toHaveAttribute('data-frame', '45');

  const next = page.getByRole('button', {name: '다음'});
  await next.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-testid="demo-stage"]')).toHaveAttribute('data-frame', '150');
  await expect(page.getByRole('button', {name: '이전'})).toBeVisible();

  await focusPage(page);
  await page.keyboard.press('Home');
  await expect(page.locator('[data-testid="demo-stage"]')).toHaveAttribute('data-frame', '45');
  await page.keyboard.press('End');
  await expect(page.locator('[data-testid="demo-stage"]')).toHaveAttribute('data-frame', '855');
});

test('keeps one current step and does not duplicate manual live announcements', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('./');

  const liveText = await page.locator('[aria-live="polite"]').allTextContents();
  expect(liveText.filter(Boolean)).toEqual([]);

  await page.getByRole('button', {name: '다음'}).click();
  const currentStep = page.locator('.step-rail button[aria-current="step"]');
  await expect(currentStep).toHaveCount(1);
  await expect(currentStep).toHaveText(/기존 방식의 빈틈/u);
  expect(await currentStep.evaluate((element) => getComputedStyle(element).borderTopWidth)).toBe('2px');

  const announcements = await page.locator('[aria-live="polite"]').allTextContents();
  expect(announcements.filter(Boolean)).toEqual([]);
});

test('switches permanently to manual controls after a narrow resize', async ({page}) => {
  await page.setViewportSize({width: 1_024, height: 900});
  await startPlayback(page);

  await page.setViewportSize({width: 767, height: 1_024});
  await expect(page.locator('.playback-bar button')).toHaveText(['이전', '다음']);

  await page.setViewportSize({width: 1_024, height: 900});
  await expect(page.locator('.playback-bar button')).toHaveText(['이전', '다음']);
});

test('keeps one persistent empty live region and announces unique manual, result, block, help, and completion changes', async ({page}) => {
  await startPlayback(page);
  const liveRegion = page.getByTestId('live-region');
  await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  await expect(liveRegion).toHaveText('');

  await focusPage(page);
  await page.keyboard.press('ArrowRight');
  await expect(liveRegion).toHaveText(/수동/u);

  await selectStepWithoutAutoScroll(page, '확인된 결과');
  await expect(liveRegion).toHaveText(/결과/u);
  await page.getByRole('button', {name: '확인이 필요한 경우'}).click();
  await expect(liveRegion).toHaveText(/표시하지/u);
  await page.getByRole('button', {name: '직접 작성 방법 보기'}).click();
  await expect(liveRegion).toHaveText(/다음 행동/u);
});

test('announces automatic completion exactly once', async ({page}) => {
  await page.clock.install();
  await page.goto('./');
  await page.evaluate(() => {
    const region = document.querySelector<HTMLElement>('[data-testid="live-region"]')!;
    const messages: string[] = [];
    new MutationObserver(() => {
      if (region.textContent) messages.push(region.textContent);
    }).observe(region, {childList: true, characterData: true, subtree: true});
    (window as Window & {__FPG_LIVE_MESSAGES__?: string[]}).__FPG_LIVE_MESSAGES__ = messages;
  });

  await page.getByRole('button', {name: '시연 시작'}).click();
  await page.clock.fastForward(3_100);
  await waitForPlayback(page);
  await page.clock.fastForward(30_100);
  await expect(page.getByTestId('live-region')).toHaveText(/시연이 끝났어요/u);
  const completionMessages = await page.evaluate(() =>
    (window as Window & {__FPG_LIVE_MESSAGES__?: string[]}).__FPG_LIVE_MESSAGES__?.filter(
      (message) => message.includes('시연이 끝났어요'),
    ),
  );
  expect(completionMessages).toHaveLength(1);
});

test('supports every global shortcut, keeps focused controls isolated, and leaves unhandled keys alone', async ({page}) => {
  await startPlayback(page);
  await focusPage(page);

  for (const [key, frame] of [['ArrowRight', '45'], ['ArrowRight', '150'], ['ArrowLeft', '45'], ['End', '855'], ['Home', '45']] as const) {
    await page.keyboard.press(key);
    await expect(page.locator('[data-testid="demo-stage"]')).toHaveAttribute('data-frame', frame);
  }
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', {name: '일시정지'})).toBeVisible();
  await focusPage(page);
  await page.keyboard.press('Space');
  await expect(page.locator('[data-testid="demo-stage"]')).toHaveAttribute('data-frame', '45');

  await page.evaluate(() => {
    window.addEventListener('keydown', (event) => {
      document.body.dataset.unhandledDefaultPrevented = String(event.defaultPrevented);
    }, {once: true});
  });
  await page.keyboard.press('KeyQ');
  await expect(page.locator('body')).toHaveAttribute('data-unhandled-default-prevented', 'false');

  const next = page.getByRole('button', {name: '다음'});
  await next.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-testid="demo-stage"]')).toHaveAttribute('data-frame', '45');

  const currentStep = page.locator('.step-rail button[aria-current="step"]');
  await currentStep.focus();
  await page.keyboard.press('End');
  await expect(page.locator('[data-testid="demo-stage"]')).toHaveAttribute('data-frame', '45');
});

test('freezes frame and elapsed time when a playing desktop view is resized to manual mode', async ({page}) => {
  await page.setViewportSize({width: 1_024, height: 900});
  await startPlayback(page);
  const stage = page.locator('[data-testid="demo-stage"]');
  const elapsed = await page.getByTestId('elapsed-time').textContent();

  await page.setViewportSize({width: 767, height: 1_024});
  await expect(page.locator('.playback-bar button')).toHaveText(['이전', '다음']);
  await expect(page.getByTestId('elapsed-time')).toHaveCount(0);
  const frozenFrame = await stage.getAttribute('data-frame');
  await page.clock.fastForward(1_000);
  await expect(stage).toHaveAttribute('data-frame', frozenFrame!);
  await page.setViewportSize({width: 1_024, height: 900});
  await page.clock.fastForward(1_000);
  await expect(stage).toHaveAttribute('data-frame', frozenFrame!);
  expect(elapsed).toMatch(/^00:\d{2} \/ 00:30$/u);
});

test('keeps the 1280px completion validation copy horizontally readable', async ({page}) => {
  await page.clock.install();
  await page.setViewportSize({width: 1_280, height: 720});
  await page.goto('./');
  await page.getByRole('button', {name: '시연 시작'}).click();
  await page.clock.fastForward(3_100);
  await waitForPlayback(page);
  await selectStepWithoutAutoScroll(page, '혁신과 검증 예정');

  const metrics = await page.locator('.validation-plan').evaluate((panel) => {
    const heading = panel.querySelector<HTMLElement>('h2')!.getBoundingClientRect();
    const values = Array.from(panel.querySelectorAll<HTMLElement>('.validation-numbers strong'))
      .map((value) => value.getBoundingClientRect());
    return {
      headingWidth: heading.width,
      valueWidths: values.map((value) => value.width),
      valueHeights: values.map((value) => value.height),
    };
  });

  expect(metrics.headingWidth).toBeGreaterThanOrEqual(160);
  expect(metrics.valueWidths.every((width) => width >= 160)).toBe(true);
  expect(metrics.valueHeights.every((height) => height <= 100)).toBe(true);
});

test('keeps every recorded stable frame inside the 1920x1080 stage', async ({page}) => {
  const bridge = await recordingBridge(page);

  for (const frame of [45, 150, 225, 360, 480, 610, 750, 855, 945, 975]) {
    await bridge.setFrame(frame);
    const overflow = await page.getByTestId('demo-stage').evaluate((stage) => ({
      horizontal: stage.scrollWidth - stage.clientWidth,
      vertical: stage.scrollHeight - stage.clientHeight,
    }));
    expect(overflow.horizontal, `frame ${frame}`).toBe(0);
    expect(overflow.vertical, `frame ${frame}`).toBe(0);
  }
});

test('keeps both mobile step controls at least 44px square', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('./');

  for (const name of ['이전', '다음']) {
    const bounds = await page.getByRole('button', {name}).boundingBox();
    expect(bounds, name).not.toBeNull();
    expect(bounds!.width, name).toBeGreaterThanOrEqual(44);
    expect(bounds!.height, name).toBeGreaterThanOrEqual(44);
  }
});

for (const viewport of [
  {width: 1_920, height: 1_080},
  {width: 1_536, height: 900},
  {width: 1_535, height: 900},
  {width: 1_024, height: 900},
  {width: 1_023, height: 1_024},
  {width: 768, height: 1_024},
  {width: 767, height: 1_024},
  {width: 390, height: 844},
] as const) {
  test(`does not clip or overlap controls at ${viewport.width}x${viewport.height}`, async ({page}) => {
    await page.setViewportSize(viewport);
    await page.goto('./');

    const metrics = await page.evaluate(() => ({
      bodyWidth: document.body.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth);
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);

    const control = viewport.width < 768
      ? page.getByRole('button', {name: '다음'})
      : page.getByRole('button', {name: '시연 시작'});
    if (viewport.width >= 768) {
      await control.evaluate((element) => element.scrollIntoView({block: 'center'}));
    }
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(await control.evaluate((element) => document.elementFromPoint(
      element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2,
      element.getBoundingClientRect().top + element.getBoundingClientRect().height / 2,
    )?.closest('button') === element)).toBe(true);
  });
}

for (const viewport of [
  {width: 1_920, height: 1_080},
  {width: 1_536, height: 900},
  {width: 1_535, height: 900},
  {width: 1_024, height: 900},
  {width: 1_023, height: 1_024},
  {width: 768, height: 1_024},
  {width: 767, height: 1_024},
  {width: 390, height: 844},
] as const) {
  test(`keeps major stable-state cards bounded and non-overlapping at ${viewport.width}x${viewport.height}`, async ({page}) => {
    await page.clock.install();
    await page.setViewportSize(viewport);
    await page.goto('./');
    if (viewport.width >= 768) {
      await page.getByRole('button', {name: '시연 시작'}).click();
      await page.clock.fastForward(3_100);
      await expect(page.getByRole('button', {name: '일시정지'})).toBeVisible();
    }

    for (const name of ['기존 방식의 빈틈', '정보 찾기', '승인 경로', '전체 응답 검사', '확인된 결과', '혁신과 검증 예정']) {
      await selectStepWithoutAutoScroll(page, name);
      const bounds = await page.evaluate(() => {
        document.querySelector<HTMLElement>('.stage-content')?.scrollIntoView({block: 'start'});
        const cards = Array.from(document.querySelectorAll<HTMLElement>(
          '.panel, .flow-card, .evidence-table, .validation-plan',
        ));
        return cards.map((element, index) => {
          const rect = element.getBoundingClientRect();
          const parent = element.parentElement!.getBoundingClientRect();
          const textOverflows = Array.from(element.querySelectorAll<HTMLElement>('p, h1, h2, h3, dt, dd, span, strong'))
            .filter((text) => text.scrollWidth - text.clientWidth > 1 || text.scrollHeight - text.clientHeight > 1)
            .map((text) => ({
              tag: text.tagName,
              value: text.textContent?.trim().slice(0, 80),
              scrollWidth: text.scrollWidth,
              clientWidth: text.clientWidth,
              scrollHeight: text.scrollHeight,
              clientHeight: text.clientHeight,
            }));
          const overlaps = cards.some((other, otherIndex) => {
            if (index === otherIndex || element.contains(other) || other.contains(element)) return false;
            const candidate = other.getBoundingClientRect();
            return rect.left < candidate.right && rect.right > candidate.left && rect.top < candidate.bottom && rect.bottom > candidate.top;
          });
          return {
            left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
            className: element.className,
            width: rect.width, height: rect.height, parentWidth: parent.width, parentHeight: parent.height,
            parentTop: parent.top, parentBottom: parent.bottom,
            textOverflows, overlaps,
          };
        });
      });
      expect(bounds).not.toEqual([]);
      for (const bound of bounds) {
        const context = `${name}: ${bound.className}`;
        expect(bound.left, context).toBeGreaterThanOrEqual(-1);
        expect(bound.right, context).toBeLessThanOrEqual(viewport.width + 1);
        expect(bound.width, context).toBeLessThanOrEqual(bound.parentWidth + 1);
        expect(bound.height, context).toBeLessThanOrEqual(bound.parentHeight + 1);
        expect(bound.top, context).toBeGreaterThanOrEqual(bound.parentTop - 1);
        expect(bound.bottom, context).toBeLessThanOrEqual(bound.parentBottom + 1);
        expect(bound.textOverflows, context).toEqual([]);
        expect(bound.overlaps, context).toBe(false);
      }
    }

    if (viewport.width < 768) {
      await page.getByRole('button', {name: '다음'}).dispatchEvent('click');
    } else {
      await page.getByRole('button', {name: '확인이 필요한 경우'}).dispatchEvent('click');
    }
    await expect(page.getByTestId('blocked-result')).toBeVisible();
    await page.getByRole('button', {name: '직접 작성 방법 보기'}).dispatchEvent('click');
    await expect(page.locator('.help-steps')).toBeVisible();
  });
}
