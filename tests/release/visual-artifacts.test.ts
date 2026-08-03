import {readdir, readFile, stat} from 'node:fs/promises';
import {resolve} from 'node:path';

import {describe, expect, it} from 'vitest';
import {PNG} from 'pngjs';

const ARTIFACTS = [
  ['tests/visual/baselines/detected.png', 'artifacts/submission/01-synthetic-source.png'],
  ['tests/visual/baselines/protected.png', 'artifacts/submission/02-type-protection.png'],
  ['tests/visual/baselines/mocked.png', 'artifacts/submission/03-local-mock-summary.png'],
  ['tests/visual/baselines/inspected.png', 'artifacts/submission/04-full-response-inspection.png'],
  ['tests/visual/baselines/verified.png', 'artifacts/submission/05-verified-result.png'],
  ['tests/visual/baselines/request-blocked.png', 'artifacts/submission/06-request-blocked.png'],
  ['tests/visual/baselines/response-withheld.png', 'artifacts/submission/07-response-withheld.png'],
  ['tests/visual/baselines/request-blocked.png', 'artifacts/regression/06-request-blocked.png'],
  ['tests/visual/baselines/response-withheld.png', 'artifacts/regression/07-response-withheld.png'],
] as const;

describe('reviewed visual artifact repository contract', () => {
  it('contains only the seven reviewed baselines, seven submissions, and two failure regressions', async () => {
    expect((await readdir(resolve('tests/visual/baselines'))).sort()).toEqual([
      'detected.png',
      'inspected.png',
      'mocked.png',
      'protected.png',
      'request-blocked.png',
      'response-withheld.png',
      'verified.png',
    ]);
    expect((await readdir(resolve('artifacts/submission'))).sort()).toEqual([
      '01-synthetic-source.png',
      '02-type-protection.png',
      '03-local-mock-summary.png',
      '04-full-response-inspection.png',
      '05-verified-result.png',
      '06-request-blocked.png',
      '07-response-withheld.png',
    ]);
    expect((await readdir(resolve('artifacts/regression'))).sort()).toEqual([
      '06-request-blocked.png',
      '07-response-withheld.png',
    ]);
  });

  it.each(ARTIFACTS)('%s and %s are exact 1920x1080 RGBA matches', async (baselinePath, artifactPath) => {
    const baseline = PNG.sync.read(await readFile(resolve(baselinePath)));
    const artifact = PNG.sync.read(await readFile(resolve(artifactPath)));

    expect((await stat(resolve(artifactPath))).size).toBeGreaterThan(100_000);
    expect({width: artifact.width, height: artifact.height}).toEqual({
      width: 1_920,
      height: 1_080,
    });
    expect(Buffer.from(artifact.data).equals(Buffer.from(baseline.data))).toBe(true);
  });
});
