import {expect, test, type Page} from '@playwright/test';

const CASES = {
  normal: 'SYN-NORMAL-001',
  blocked: 'SYN-BLOCK-001',
  withheld: 'SYN-WITHHOLD-001',
} as const;

async function openRecordingFrame(page: Page, frame: number): Promise<void> {
  await page.setViewportSize({width: 1_920, height: 1_080});
  await page.goto('?record=1&case=SYN-NORMAL-001');
  await page.waitForFunction(() => '__FPG_RECORDING_V1__' in window);
  await page.evaluate(() => window.__FPG_RECORDING_V1__!.ready);
  await page.evaluate(
    async (value) => window.__FPG_RECORDING_V1__!.setFrame(value),
    frame,
  );
}

async function finishAutomaticRun(page: Page): Promise<void> {
  await page.getByRole('button', {name: '개인정보 보호 후 요약 만들기'}).click();
  await page.clock.fastForward(8_100);
}

async function selectCase(page: Page, caseId: string): Promise<void> {
  await page.getByRole('combobox', {name: '합성 사례 선택'}).selectOption(caseId);
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-case-id', caseId);
}

test('opens as a three-column browser-only synthetic consultation workspace', async ({page}) => {
  await page.goto('./');

  await expect(page.locator('.brand-name')).toHaveText('단디 DANDI');
  await expect(page.getByTestId('product-workspace')).toBeVisible();
  await expect(page.getByRole('button', {name: '개인정보 보호 후 요약 만들기'})).toBeVisible();
  await expect(page.locator('.product-panel')).toHaveCount(3);
  await expect(page.locator('.header-boundary')).toHaveText('합성데이터 전용 브라우저 프로토타입 | 로컬 모의 요약 | 서버·외부 AI 없음');
  await expect(page.getByText('보호 정책')).toHaveCount(0);
  await expect(page.getByText('처리 이력')).toHaveCount(0);
  await expect(page.getByText('승인된 AI 업무 경로')).toHaveCount(0);
  await expect(page.getByText('AI 상담 요약 작성')).toHaveCount(0);
});

test('offers the three reviewed cases in a native labeled selector', async ({page}) => {
  await page.goto('./');
  const selector = page.getByRole('combobox', {name: '합성 사례 선택'});

  await expect(selector).toHaveValue(CASES.normal);
  await expect(selector.locator('option')).toHaveText([
    '정상 상담요약',
    '요청 단계 차단',
    '결과 미공개',
  ]);
});

test('runs the five engine stages and publishes exactly five verified fields', async ({page}) => {
  await page.clock.install();
  await page.goto('./');

  await expect(page.getByTestId('verified-result')).toHaveCount(0);
  await expect(page.getByTestId('stage-list').locator('li')).toHaveText([
    /1합성 개인정보 찾기대기/u,
    /2유형별 보호대기/u,
    /3로컬 모의 요약대기/u,
    /4전체 결과 검사대기/u,
    /5확인된 결과 공개잠김/u,
  ]);

  await page.getByRole('button', {name: '개인정보 보호 후 요약 만들기'}).click();
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'detecting');
  await page.clock.fastForward(1_700);
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'protecting');
  await page.clock.fastForward(1_500);
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'summarizing');
  await page.clock.fastForward(1_800);
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'inspecting');
  await page.clock.fastForward(3_100);

  const workspace = page.getByTestId('product-workspace');
  await expect(workspace).toHaveAttribute('data-product-state', 'verified');
  await expect(workspace).toHaveAttribute('data-run-outcome', 'VERIFIED');
  await expect(workspace).toHaveAttribute('data-model-call-count', '1');
  const result = page.getByTestId('verified-result');
  await expect(result).toBeVisible();
  await expect(result).toContainText('전체 검사 완료');
  await expect(result.locator('dl > div')).toHaveCount(5);
  await expect(result.locator('dt')).toHaveText([
    '상담 목적',
    '고객 요청',
    '직원이 안내한 내용',
    '직원이 확인할 항목',
    '다음 조치',
  ]);
  await expect(page.getByTestId('evidence-status')).toContainText('원문 내용 저장 없음');
});

test('blocks an unsupported request before the local mock summary', async ({page}) => {
  await page.clock.install();
  await page.goto('./');
  await selectCase(page, CASES.blocked);
  await finishAutomaticRun(page);

  const workspace = page.getByTestId('product-workspace');
  await expect(workspace).toHaveAttribute('data-product-state', 'request-blocked');
  await expect(workspace).toHaveAttribute('data-run-outcome', 'REQUEST_BLOCKED_UNSUPPORTED');
  await expect(workspace).toHaveAttribute('data-model-call-count', '0');
  await expect(page.getByTestId('verified-result')).toHaveCount(0);
  await expect(page.getByTestId('request-blocked-result')).toContainText('이 합성 사례는 요약 요청 전에 멈췄어요');
  await expect(page.getByTestId('request-blocked-result')).toContainText('지원하지 않는 고위험 정보 유형을 확인해 모의 요약 단계로 보내지 않았습니다.');
});

test('withholds a response when one of five engine checks fails', async ({page}) => {
  await page.clock.install();
  await page.goto('./');
  await selectCase(page, CASES.withheld);
  await finishAutomaticRun(page);

  const workspace = page.getByTestId('product-workspace');
  await expect(workspace).toHaveAttribute('data-product-state', 'response-withheld');
  await expect(workspace).toHaveAttribute('data-run-outcome', 'RESPONSE_WITHHELD_MARKER');
  await expect(workspace).toHaveAttribute('data-model-call-count', '1');
  await expect(page.getByTestId('verified-result')).toHaveCount(0);
  await expect(page.getByTestId('response-withheld-result')).toContainText('보호용 표시를 확인하기 어려워 결과를 열지 않았어요');
  await expect(page.getByTestId('inspection-check')).toHaveCount(5);
  await expect(page.getByTestId('inspection-check').filter({hasText: '보호용 표시'})).toContainText('확인 필요');
});

test('changing the case removes the previous result and live announcement', async ({page}) => {
  await page.clock.install();
  await page.goto('./');
  await finishAutomaticRun(page);
  await expect(page.getByTestId('verified-result')).toBeVisible();
  await expect(page.getByTestId('live-region')).not.toBeEmpty();

  await selectCase(page, CASES.blocked);
  await expect(page.getByTestId('verified-result')).toHaveCount(0);
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'idle');
  await expect(page.getByTestId('live-region')).toBeEmpty();
});

test('supports rerunning a case and moving to a recommended case', async ({page}) => {
  await page.clock.install();
  await page.goto('./');
  await finishAutomaticRun(page);

  await page.getByRole('button', {name: '같은 사례 다시 실행'}).click();
  await expect(page.getByTestId('verified-result')).toHaveCount(0);
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'detecting');
  await page.clock.fastForward(8_100);
  await page.getByRole('button', {name: '다른 합성 사례 실행'}).click();
  await expect(page.getByRole('combobox', {name: '합성 사례 선택'})).toHaveValue(CASES.blocked);
  await expect(page.getByTestId('product-workspace')).toHaveAttribute('data-product-state', 'idle');
});

test('keeps protected comparison and result body locked before verification', async ({page}) => {
  await openRecordingFrame(page, 610);
  await expect(page.getByTestId('protected-comparison')).toBeVisible();
  await expect(page.getByTestId('verified-result')).toHaveCount(0);
  await expect(page.getByTestId('locked-result')).toContainText('전체 검사가 끝나면 확인된 결과만 열 수 있어요.');

  await openRecordingFrame(page, 790);
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

for (const viewport of [
  {width: 1_280, height: 800, manual: false},
  {width: 390, height: 844, manual: true},
] as const) {
  test(`executes all three outcomes without console errors or horizontal overflow at ${viewport.width}x${viewport.height}`, async ({page}) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.setViewportSize(viewport);
    if (!viewport.manual) await page.clock.install();
    await page.goto('./');

    const runCurrentCase = async (manualClicks: number) => {
      if (viewport.manual) {
        for (let index = 0; index < manualClicks; index += 1) {
          await page.getByRole('button', {name: '다음 단계'}).click();
        }
      } else {
        await page.getByRole('button', {name: '개인정보 보호 후 요약 만들기'}).click();
        await page.clock.fastForward(8_100);
      }
    };
    const expectNoHorizontalOverflow = async () => {
      const overflow = await page.evaluate(() => Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
      ) - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    };

    await runCurrentCase(4);
    await expect(page.getByTestId('verified-result')).toBeVisible();
    await expectNoHorizontalOverflow();

    await selectCase(page, CASES.blocked);
    await runCurrentCase(1);
    await expect(page.getByTestId('request-blocked-result')).toBeVisible();
    await expect(page.getByTestId('verified-result')).toHaveCount(0);
    await expectNoHorizontalOverflow();

    await selectCase(page, CASES.withheld);
    await runCurrentCase(3);
    await expect(page.getByTestId('response-withheld-result')).toBeVisible();
    await expect(page.getByTestId('verified-result')).toHaveCount(0);
    await expectNoHorizontalOverflow();
    expect(pageErrors).toEqual([]);
  });
}
