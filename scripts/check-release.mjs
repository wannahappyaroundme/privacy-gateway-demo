import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

import {expectedNoticeDocument} from './make-third-party-notices.mjs';
import {noticeDifferencePreview} from './dependency-notice-utils.mjs';
import {
  EXPECTED_CSP,
  actionPinFindings,
  approvalStateFindings,
  formatFindings,
  hashBytes,
  hashSourceEntries,
  isAllowedRepositoryPath,
  scanSecretsAndPaths,
  scanText,
} from './release-policy.mjs';
import {collectSourceEntries} from './release-workspace.mjs';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const TEXT_EXTENSIONS = new Set([
  '',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.py',
  '.ts',
  '.tsx',
  '.txt',
  '.yml',
]);

function finding(file, rule, line = 1) {
  return {file, rule, line};
}

function exactCsp(html) {
  const match = html.match(
    /<meta http-equiv="Content-Security-Policy" content="([^"]+)" \/>/u,
  );
  if (match?.[1] !== EXPECTED_CSP) return false;
  const cspOffset = html.indexOf('http-equiv="Content-Security-Policy"');
  const resourceOffsets = [
    html.indexOf('<script'),
    html.indexOf('<link'),
    html.indexOf('<style'),
    html.indexOf('<img'),
  ].filter((offset) => offset >= 0);
  return resourceOffsets.every((offset) => cspOffset < offset);
}

function isLowerSha256(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value);
}

function pngFindings(file, bytes) {
  const findings = scanSecretsAndPaths(file, bytes.toString('latin1'));
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!bytes.subarray(0, 8).equals(signature)) return [...findings, finding(file, 'png-signature')];
  let offset = 8;
  while (offset + 12 <= bytes.byteLength) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
    if (['eXIf', 'iTXt', 'tEXt', 'zTXt'].includes(type)) {
      findings.push(finding(file, `png-metadata-${type}`));
    }
    offset += 12 + length;
    if (type === 'IEND') return findings;
  }
  findings.push(finding(file, 'png-structure'));
  return findings;
}

async function trackedPaths() {
  const {stdout} = await execFileAsync('git', ['ls-files', '-z'], {
    cwd: ROOT,
    encoding: 'buffer',
    maxBuffer: 4 * 1024 * 1024,
  });
  return stdout.toString('utf8').split('\0').filter(Boolean);
}

async function main() {
  const deployment = process.argv.includes('--deployment');
  const findings = [];
  const sourceEntries = await collectSourceEntries(ROOT);
  const sourceSha256 = hashSourceEntries(sourceEntries);

  for (const entry of sourceEntries) {
    if (TEXT_EXTENSIONS.has(path.extname(entry.path))) {
      findings.push(...scanText(entry.path, entry.bytes.toString('utf8')));
    }
  }

  for (const workflow of ['.github/workflows/ci.yml', '.github/workflows/pages.yml']) {
    const source = await readFile(path.join(ROOT, workflow), 'utf8');
    findings.push(...actionPinFindings(workflow, source));
  }

  const tracked = await trackedPaths();
  for (const publicPath of tracked) {
    if (!isAllowedRepositoryPath(publicPath)) {
      findings.push(finding(publicPath, 'unapproved-public-path'));
    }
    if (publicPath.endsWith('.png') && publicPath.startsWith('artifacts/')) {
      findings.push(...pngFindings(publicPath, await readFile(path.join(ROOT, publicPath))));
    }
  }

  const ignore = await readFile(path.join(ROOT, '.gitignore'), 'utf8');
  for (const required of ['.superpowers/', '.DS_Store', 'artifacts/tmp/']) {
    if (!ignore.split(/\r?\n/u).includes(required)) {
      findings.push(finding('.gitignore', `missing-ignore-${required.replaceAll('/', '')}`));
    }
  }

  const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
  if (!exactCsp(html)) findings.push(finding('index.html', 'csp-contract'));

  const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
  if (Object.hasOwn(pkg.scripts, 'video')) {
    findings.push(finding('package.json', 'video-encoding-script'));
  }
  if (!pkg.scripts.verify?.includes('npm run record:check')) {
    findings.push(finding('package.json', 'record-check-missing-from-verify'));
  }
  if (pkg.scripts['release:notices'] !== 'node scripts/make-third-party-notices.mjs') {
    findings.push(finding('package.json', 'dependency-notice-script'));
  }

  const noticePath = path.join(ROOT, 'THIRD_PARTY_NOTICES.md');
  const currentNotice = await readFile(noticePath, 'utf8');
  const expectedNotice = await expectedNoticeDocument();
  if (currentNotice !== expectedNotice) {
    process.stderr.write(noticeDifferencePreview(currentNotice, expectedNotice));
    findings.push(finding('THIRD_PARTY_NOTICES.md', 'dependency-notice-out-of-date'));
  }

  const fixture = await readFile(
    path.join(ROOT, 'src/demo/fixtures/synthetic-consultation-v1.json'),
  );
  const copy = await readFile(path.join(ROOT, 'src/content/copy.ts'));
  const manifest = JSON.parse(
    await readFile(path.join(ROOT, 'release-manifest.json'), 'utf8'),
  );
  if (manifest.schemaVersion !== '1.0') {
    findings.push(finding('release-manifest.json', 'manifest-schema'));
  }
  if (manifest.fixtureSha256 !== hashBytes(fixture)) {
    findings.push(finding('release-manifest.json', 'fixture-hash-mismatch'));
  }
  if (manifest.copySha256 !== hashBytes(copy)) {
    findings.push(finding('release-manifest.json', 'copy-hash-mismatch'));
  }
  if (!isLowerSha256(manifest.approvedSourceSha256)) {
    findings.push(finding('release-manifest.json', 'source-hash-format'));
  } else if (manifest.approvedSourceSha256 !== sourceSha256) {
    findings.push(finding('release-manifest.json', 'source-hash-mismatch'));
  }

  findings.push(...approvalStateFindings(manifest, deployment));

  if (findings.length > 0) {
    process.stderr.write(`${formatFindings(findings)}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    deployment
      ? 'Public release approval and immutable source checks passed.\n'
      : 'Local public-release preflight passed; deployment approval remains closed.\n',
  );
}

await main();
