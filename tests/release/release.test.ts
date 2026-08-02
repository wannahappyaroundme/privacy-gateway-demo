import {execFileSync} from 'node:child_process';
import {readFileSync, existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

import {describe, expect, it} from 'vitest';

const EXPECTED_CSP =
  "default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src-elem 'self'; style-src-attr 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'none'; media-src 'none'; frame-src 'none'; worker-src 'none'; child-src 'none'; manifest-src 'none'; form-action 'none'; object-src 'none'; base-uri 'none'";

const REQUIRED_ACTIONS = new Map([
  ['actions/checkout', 'df4cb1c069e1874edd31b4311f1884172cec0e10'],
  ['actions/setup-node', '249970729cb0ef3589644e2896645e5dc5ba9c38'],
  ['actions/configure-pages', '45bfe0192ca1faeb007ade9deae92b16b8254a0d'],
  ['actions/upload-pages-artifact', 'fc324d3547104276b827a68afc52ff2a11cc49c9'],
  ['actions/deploy-pages', 'cd2ce8fcbc39b97be8ca5fce6e763baed58fa128'],
] as const);

type ReleasePolicy = {
  approvalStateFindings: (
    manifest: Record<string, unknown>,
    deployment: boolean,
  ) => Array<{file: string; rule: string; line: number}>;
  actionPinFindings: (file: string, source: string) => Array<{
    file: string;
    rule: string;
    line: number;
  }>;
  hashSourceEntries: (entries: Array<{path: string; bytes: Buffer}>) => string;
  isAllowedRepositoryPath: (path: string) => boolean;
  isAllowedSourcePath: (path: string) => boolean;
  scanText: (file: string, source: string) => Array<{
    file: string;
    rule: string;
    line: number;
  }>;
};

type NoticeModule = {
  selectLicenseFile(entries: readonly string[]): string | null;
  noticeDifferencePreview(current: string, expected: string): string;
};

async function loadReleasePolicy(): Promise<ReleasePolicy> {
  const url = pathToFileURL(resolve('scripts/release-policy.mjs')).href;
  return (await import(url)) as ReleasePolicy;
}

async function loadNoticeModule(): Promise<NoticeModule> {
  const url = pathToFileURL(resolve('scripts/dependency-notice-utils.mjs')).href;
  return (await import(url)) as NoticeModule;
}

function readOrEmpty(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

describe('public release policy', () => {
  it('selects the actual license filename independently of filesystem case rules', async () => {
    const notices = await loadNoticeModule();
    expect(notices.selectLicenseFile(['package.json', 'license', 'readme.md'])).toBe('license');
    expect(notices.selectLicenseFile(['LICENSE.md', 'license'])).toBe('license');
    expect(notices.selectLicenseFile(['NOTICE', 'LICENSE.txt'])).toBe('LICENSE.txt');
    expect(notices.selectLicenseFile(['package.json'])).toBeNull();
  });

  it('reports the first notice difference without printing package contents broadly', async () => {
    const notices = await loadNoticeModule();
    expect(notices.noticeDifferencePreview('one\ntwo\n', 'one\nthree\n')).toBe(
      'THIRD_PARTY_NOTICES.md first differs at line 2.\nCurrent: two\nExpected: three\n',
    );
  });

  it('keeps the exact reviewed CSP before every resource declaration', () => {
    const html = readFileSync('index.html', 'utf8');
    const match = html.match(
      /<meta http-equiv="Content-Security-Policy" content="([^"]+)" \/>/u,
    );

    expect(match?.[1]).toBe(EXPECTED_CSP);
    const cspOffset = html.indexOf('http-equiv="Content-Security-Policy"');
    const resourceOffsets = [
      html.indexOf('<script'),
      html.indexOf('<link'),
      html.indexOf('<style'),
      html.indexOf('<img'),
    ].filter((offset) => offset >= 0);
    expect(resourceOffsets.every((offset) => cspOffset < offset)).toBe(true);
  });

  it('declares a repository-scoped favicon that is included in the public release', async () => {
    const html = readFileSync('index.html', 'utf8');
    const policy = await loadReleasePolicy();

    expect(html).toContain(
      '<link rel="icon" type="image/svg+xml" href="/privacy-gateway-demo/favicon.svg" />',
    );
    expect(existsSync('public/favicon.svg')).toBe(true);
    expect(policy.isAllowedSourcePath('public/favicon.svg')).toBe(true);
  });

  it('provides every guarded release file', () => {
    for (const path of [
      '.github/CODEOWNERS',
      '.github/workflows/ci.yml',
      '.github/workflows/pages.yml',
      'README.md',
      'LICENSE',
      'scripts/release-policy.mjs',
      'scripts/make-release-manifest.mjs',
      'scripts/check-release.mjs',
      'scripts/check-copy.mjs',
      'scripts/check-bundle.mjs',
      'scripts/make-third-party-notices.mjs',
    ]) {
      expect(existsSync(path), `missing release file: ${path}`).toBe(true);
    }
  });

  it('keeps generated and private planning paths outside the public repository', () => {
    const ignore = readFileSync('.gitignore', 'utf8');
    expect(ignore).toContain('.superpowers/');
    expect(ignore).toContain('.DS_Store');
    expect(ignore).toContain('artifacts/tmp/');

    const tracked = execFileSync('git', ['ls-files', '-z'])
      .toString('utf8')
      .split('\0')
      .filter(Boolean);
    expect(tracked.filter((path) => path.startsWith('.superpowers/'))).toEqual([]);
  });

  it('keeps recording verification in verify and excludes video encoding', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(pkg.scripts.video).toBeUndefined();
    expect(existsSync('scripts/render-video.mjs')).toBe(false);
    expect(pkg.scripts.verify).toContain('npm run record:check');
    expect(pkg.scripts['release:notices']).toBe('node scripts/make-third-party-notices.mjs');
  });

  it('does not mutate pointer or hover state after the recording bridge settles a frame', () => {
    for (const path of [
      'scripts/capture-frames.mjs',
      'tests/visual/demo-frames.spec.ts',
    ]) {
      expect(readFileSync(path, 'utf8'), path).not.toContain('.mouse.move(');
    }
  });

  it('disables the unused module-preload fetch polyfill and source maps', () => {
    const vite = readFileSync('vite.config.ts', 'utf8');
    expect(vite).toContain('modulePreload: {polyfill: false}');
    expect(vite).toContain('sourcemap: false');
  });

  it('keeps nested Git worktrees outside unit-test discovery', () => {
    const vite = readFileSync('vite.config.ts', 'utf8');
    expect(vite).toContain("'.worktrees/**'");
  });

  it('uses only reviewed full-SHA action pins', () => {
    const workflows = [
      readOrEmpty('.github/workflows/ci.yml'),
      readOrEmpty('.github/workflows/pages.yml'),
    ].join('\n');

    for (const [action, sha] of REQUIRED_ACTIONS) {
      expect(workflows).toContain(`uses: ${action}@${sha}`);
    }
    for (const line of workflows.split('\n').filter((value) => /\buses:/u.test(value))) {
      expect(line).toMatch(/\buses:\s+actions\/[a-z0-9-]+@[0-9a-f]{40}(?:\s+#.*)?$/u);
    }
  });

  it('keeps CI read-only and excludes privileged triggers and runners', () => {
    const ci = readOrEmpty('.github/workflows/ci.yml');

    expect(ci).toContain('pull_request:');
    expect(ci).toContain('push:');
    expect(ci).toContain('contents: read');
    expect(ci).toContain('persist-credentials: false');
    expect(ci).toContain("node-version: '20.19.5'");
    expect(ci).toContain('package-manager-cache: false');
    expect(ci).toContain('npm run verify');
    expect(ci).not.toContain('pull_request_target');
    expect(ci).not.toContain('workflow_run');
    expect(ci).not.toContain('self-hosted');
    expect(ci).not.toContain('pages: write');
    expect(ci).not.toContain('id-token: write');
  });

  it('keeps Pages manual, commit-bound, protected, and permission-separated', () => {
    const pages = readOrEmpty('.github/workflows/pages.yml');

    expect(pages).toContain('workflow_dispatch:');
    expect(pages).not.toContain('pull_request:');
    expect(pages).not.toContain('push:');
    expect(pages).toContain('approved_commit_sha:');
    expect(pages).toContain('permissions: {}');
    expect(pages).toContain("CURRENT_REF: ${{ github.ref }}");
    expect(pages).toContain("REF_PROTECTED: ${{ github.ref_protected }}");
    expect(pages).toContain("CURRENT_COMMIT_SHA: ${{ github.sha }}");
    expect(pages).toContain("APPROVED_COMMIT_SHA: ${{ inputs.approved_commit_sha }}");
    expect(pages).toContain('node scripts/check-release.mjs --deployment');
    expect(pages).toContain('environment:');
    expect(pages).toContain('name: github-pages');
    expect(pages).toContain('pages: write');
    expect(pages).toContain('id-token: write');
    expect(pages).toContain("enablement: 'false'");
    expect(pages).toContain('cancel-in-progress: false');
    expect(pages).not.toContain('pull_request_target');
    expect(pages).not.toContain('self-hosted');
  });

  it('hashes a path-sorted byte stream without concatenation ambiguity', async () => {
    const policy = await loadReleasePolicy();
    const first = policy.hashSourceEntries([
      {path: 'b.txt', bytes: Buffer.from('two')},
      {path: 'a.txt', bytes: Buffer.from('one')},
    ]);
    const reordered = policy.hashSourceEntries([
      {path: 'a.txt', bytes: Buffer.from('one')},
      {path: 'b.txt', bytes: Buffer.from('two')},
    ]);
    const changed = policy.hashSourceEntries([
      {path: 'a.txt', bytes: Buffer.from('onet')},
      {path: 'b.txt', bytes: Buffer.from('wo')},
    ]);

    expect(first).toMatch(/^[0-9a-f]{64}$/u);
    expect(reordered).toBe(first);
    expect(changed).not.toBe(first);
  });

  it('rejects private paths and reports findings without matched content', async () => {
    const policy = await loadReleasePolicy();

    expect(policy.isAllowedSourcePath('src/app/App.tsx')).toBe(true);
    expect(policy.isAllowedSourcePath('src/prototype/run.ts')).toBe(true);
    expect(policy.isAllowedSourcePath('tests/components/state-surfaces.test.tsx')).toBe(true);
    expect(policy.isAllowedSourcePath('artifacts/regression/06-request-blocked.png')).toBe(true);
    expect(policy.isAllowedSourcePath('artifacts/regression/07-response-withheld.png')).toBe(true);
    expect(policy.isAllowedSourcePath('artifacts/regression/07-type-protection-detail.png')).toBe(false);
    expect(policy.isAllowedSourcePath('artifacts/regression/08-explicit-block.png')).toBe(false);
    expect(policy.isAllowedRepositoryPath('artifacts/submission/07-response-withheld.png')).toBe(true);
    expect(policy.isAllowedRepositoryPath('artifacts/submission/08-unreviewed.png')).toBe(false);
    expect(policy.isAllowedSourcePath('.superpowers/sdd/report.md')).toBe(false);
    expect(policy.isAllowedSourcePath('AGENTS.md')).toBe(false);

    const marker = ['ghp', 'A'.repeat(36)].join('_');
    const findings = policy.scanText('src/example.ts', `const value = '${marker}';`);
    expect(findings).toEqual([{file: 'src/example.ts', rule: 'github-token', line: 1}]);
    expect(JSON.stringify(findings)).not.toContain(marker);
  });

  it('rejects unreviewed or mutable action references', async () => {
    const policy = await loadReleasePolicy();

    expect(
      policy.actionPinFindings(
        '.github/workflows/example.yml',
        'steps:\n  - uses: actions/checkout@v6\n',
      ),
    ).toEqual([
      {file: '.github/workflows/example.yml', rule: 'unapproved-action-pin', line: 2},
    ]);
  });

  it('allows approved candidates through verify while keeping deployment closed by default', async () => {
    const policy = await loadReleasePolicy();
    const local = {
      status: 'local-preflight-only',
      reviewer: null,
      approvedAt: null,
    };
    const approved = {
      status: 'public-release-approved',
      reviewer: 'release-owner',
      approvedAt: '2026-07-20T10:00:00.000Z',
    };

    expect(policy.approvalStateFindings(local, false)).toEqual([]);
    expect(policy.approvalStateFindings(approved, false)).toEqual([]);
    expect(policy.approvalStateFindings(approved, true)).toEqual([]);
    expect(policy.approvalStateFindings(local, true).map(({rule}) => rule)).toEqual([
      'public-approval-required',
      'reviewer-required',
      'approval-date-required',
    ]);
  });

  it('records a complete dependency inventory and a valid release state', async () => {
    const policy = await loadReleasePolicy();
    const notices = readFileSync('THIRD_PARTY_NOTICES.md', 'utf8');
    const manifest = JSON.parse(readFileSync('release-manifest.json', 'utf8')) as {
      status: string;
      approvedSourceSha256: string | null;
      reviewer: string | null;
      approvedAt: string | null;
    };

    expect(notices).toContain('<!-- BEGIN GENERATED NPM DEPENDENCIES -->');
    expect(notices).toContain('react@19.2.7');
    expect(notices).toContain('motion@12.42.2');
    expect(notices).not.toContain('UNKNOWN');
    expect(policy.approvalStateFindings(manifest, false)).toEqual([]);
    expect(manifest.approvedSourceSha256).toMatch(/^[0-9a-f]{64}$/u);
  });

  it('documents the local-only deployment boundary and Darwin visual baseline limit', () => {
    const readme = readOrEmpty('README.md');

    expect(readme).toContain('GitHub Pages 배포는 자동으로 시작되지 않습니다');
    expect(readme).toContain('macOS에서 생성한 검토 기준 이미지');
    expect(readme).toContain('실제 제품 성능이나 운영 보안을 검증한 결과도 아닙니다');
    expect(readme).toContain('GitHub가 접속 IP 등 방문 정보를 처리할 수');
  });
});
