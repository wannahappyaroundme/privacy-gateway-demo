# Task 6 Report: 3열 제품 UX와 전체 상태

## Status

Implemented and verified. The product UI now uses the real `RunSnapshot` outcome, reached stage, checks, model-call count, and verified fields. It does not derive outcomes from case IDs or frame numbers.

## Changed

- `src/app/App.tsx`
  - Added reviewed case selection state and keyed runtime reset.
  - Reset the live-region message on case changes.
  - Preserved manual-only mode when loading finishes or the case changes.
- `src/components/ProductWorkspace.tsx`
  - Rebuilt product state from `run.outcome`, `run.reachedStage`, and `run.verifiedFields`.
  - Added the five engine stages, three terminal outcomes, recovery actions, and model-call evidence attributes.
- `src/components/SyntheticCaseCard.tsx`
  - Added labeled native case selection, public synthetic source, engine detector highlights, CTA, and `1/5` manual progress.
- `src/components/EntityProtectionPanel.tsx`
  - Added the protected-text comparison using the protection engine result.
- `src/components/InspectionDashboard.tsx`
  - Added the five actual engine checks and pass/fail/not-run text states.
- `src/components/BlockedResultPanel.tsx`
  - Split request-blocked, response-withheld, and recoverable surfaces with exact recovery actions.
- `src/components/VerifiedResultPanel.tsx`
  - Renders exactly five engine-verified fields only after `VERIFIED`.
- `src/components/EvidenceStatusTable.tsx`
  - Added raw-content-free browser/storage/server/external-AI evidence.
- `src/components/DemoShell.tsx`
  - Removed dead navigation and added the permanent synthetic/browser/local-mock boundary.
- `src/content/copy.ts`
  - Added the approved Korean product, outcome, recovery, and boundary copy.
- `src/styles/index.css`
  - Preserved the polished three-column workflow and added responsive/manual/error-state styling, 44px controls, 12px helper and 14px body tokens, focus visibility, reduced-motion behavior, and accessible contrast.
- `tests/copy/copy.test.ts`
  - Added exact copy contracts and recorded the Task 7 font-subset expansion boundary.
- `tests/browser/demo-behavior.spec.ts`
  - Added case selection, five stages, result locking, three outcomes, resets, recovery, exact viewport, console, and overflow coverage.
- `tests/accessibility/demo-accessibility.spec.ts`
  - Added six viewport, keyboard order, live region, 44px, font token, reduced-motion, and axe coverage.
- `tests/browser/network-policy.spec.ts`, `tests/browser/recording-walkthrough.spec.ts`
  - Updated inherited browser contracts to the new reviewed CTA and explicit product-state names so the full suite continues to verify zero egress/storage and real terminal engine snapshots.

## TDD Evidence

### RED

Command:

```text
/Users/kyungsbook/.nvm/versions/node/v20.19.5/bin/node /Users/kyungsbook/.nvm/versions/node/v20.19.5/lib/node_modules/npm/bin/npm-cli.js run test:browser -- tests/browser/demo-behavior.spec.ts tests/accessibility/demo-accessibility.spec.ts
```

Observed before production changes:

```text
18 failed, 1 interrupted, 9 did not run
getByRole('combobox', { name: '합성 사례 선택' }): element(s) not found
getByTestId('stage-list').locator('li'): received 0 elements
getByTestId('manual-step'): element(s) not found
minimum control height: expected >= 44, received 14.84375
```

The recording helper URL in the new test was also corrected from an invalid generic recording query to the existing allowlisted exact query before GREEN.

Command:

```text
/Users/kyungsbook/.nvm/versions/node/v20.19.5/bin/node /Users/kyungsbook/.nvm/versions/node/v20.19.5/lib/node_modules/npm/bin/npm-cli.js test -- tests/copy/copy.test.ts
```

Observed before copy changes:

```text
Test Files 1 failed (1)
Tests 2 failed | 7 passed (9)
missing: 개인정보 보호 후 요약 만들기
missing: 이 합성 사례는 요약 요청 전에 멈췄어요
```

### GREEN

Focused behavior and accessibility:

```text
21 passed (12.0s)
```

Final required full browser command after inherited contract alignment:

```text
30 passed (13.3s)
```

Final static and unit verification:

```text
unit: 12 files passed, 198 tests passed
typecheck: exit 0
lint: exit 0
build: 116 modules transformed, exit 0
```

## Browser Viewports and Outcomes

Playwright rendered and inspected these fixed sizes with zero horizontal overflow:

- `1920x1080`
- `1440x900`
- `1280x800`
- `1023x1024`
- `767x1024`
- `390x844`

The final behavior suite directly ran normal, request-blocked, and response-withheld cases at both `1280x800` and `390x844`. It confirmed:

- Normal: five verified fields are visible.
- Request blocked: `modelCallCount=0`; verified-result DOM is absent.
- Response withheld: marker check is `fail`; verified-result DOM is absent.
- Browser console errors: `0`.
- Horizontal overflow: `0`.
- Mobile/reduced motion: manual `1/5` through `5/5`, no autoplay.
- Axe critical/serious violations across initial, processing, verified, blocked, and withheld states: `0`.

The in-app Browser connector reported no available browser, so visual inspection used the required local Playwright rendering path. No Task 7 screenshots or baselines were created or changed.

## Self-review

- No UI outcome branch uses `caseId` or a frame number.
- Case changes remount/reset the runtime, result DOM, and live announcement.
- Verified field DOM is gated by both `state === 'verified'` and non-null engine `verifiedFields`.
- Request-blocked and response-withheld paths never mount `verified-result`.
- The selector is native and labeled; first keyboard focus is selector, then primary action.
- Every interactive control tested at all six viewports is at least 44px high.
- Required boundary copy is visible in the header and footer, including loading/empty/invalid bootstrap surfaces.
- No dependency, network, storage, release, deployment, or visual-baseline change was made.

## Concerns / Follow-up

- Required new copy introduces six glyphs not present in the current release-managed custom font subset: `브`, `타`, `컬`, `버`, `른`, `췄`. The CSS stack renders them through the existing system Korean fallback. The copy test allows only this explicit set and rejects any additional missing glyph. Task 7 should expand the two font subset binaries before final visual capture/release, because Task 6 was explicitly barred from release-artifact changes.
- No production deployment was attempted.
