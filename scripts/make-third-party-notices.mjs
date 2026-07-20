import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

import {ALLOWED_LICENSES} from './release-policy.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const NOTICE_PATH = path.join(ROOT, 'THIRD_PARTY_NOTICES.md');
const START = '<!-- BEGIN GENERATED NPM DEPENDENCIES -->';
const END = '<!-- END GENERATED NPM DEPENDENCIES -->';

function packageName(lockPath, metadata) {
  if (typeof metadata.name === 'string') return metadata.name;
  return lockPath.slice(lockPath.lastIndexOf('node_modules/') + 'node_modules/'.length);
}

function escapeCell(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ');
}

async function packageNotice(lockPath, metadata) {
  const packageDirectory = path.join(ROOT, lockPath);
  const lockIdentity = JSON.stringify({
    name: packageName(lockPath, metadata),
    version: metadata.version,
    license: metadata.license,
    integrity: metadata.integrity || null,
  });
  let packageJsonBytes;
  let packageJson;
  if (!metadata.optional) {
    try {
      packageJsonBytes = await readFile(path.join(packageDirectory, 'package.json'));
      packageJson = JSON.parse(packageJsonBytes.toString('utf8'));
    } catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  const candidates = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'NOTICE'];
  let licenseBytes;
  let licenseFile;
  if (!metadata.optional && packageJson) {
    for (const candidate of candidates) {
      try {
        licenseBytes = await readFile(path.join(packageDirectory, candidate));
        licenseFile = candidate;
        break;
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') continue;
        throw error;
      }
    }
  }
  const declarationOnly = !licenseBytes || !licenseFile;
  if (declarationOnly) {
    licenseBytes = Buffer.from(lockIdentity, 'utf8');
    licenseFile = 'package-lock.json#packages';
  }

  const copyrightLines = declarationOnly
    ? []
    : licenseBytes
    .toString('utf8')
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => /^(?:copyright|©)/iu.test(line));
  const author =
    typeof packageJson?.author === 'string'
      ? packageJson.author
      : packageJson?.author?.name;
  const notice = declarationOnly
    ? `SPDX declaration: ${metadata.license}; Registry integrity: ${metadata.integrity || 'not recorded'}`
    : [...new Set(copyrightLines)].join('; ') || `Author: ${author || packageJson.name}`;

  return {
    name: packageName(lockPath, metadata),
    version: metadata.version,
    license: metadata.license,
    development: metadata.dev === true,
    licenseFile,
    licenseSha256: createHash('sha256').update(licenseBytes).digest('hex'),
    notice,
  };
}

export async function buildDependencySection() {
  const lock = JSON.parse(await readFile(path.join(ROOT, 'package-lock.json'), 'utf8'));
  const packages = [];
  for (const [lockPath, metadata] of Object.entries(lock.packages)) {
    if (!lockPath || !metadata.version) continue;
    if (typeof metadata.license !== 'string' || !ALLOWED_LICENSES.has(metadata.license)) {
      throw new Error(`Dependency license is not allowlisted: ${packageName(lockPath, metadata)}`);
    }
    packages.push(await packageNotice(lockPath, metadata));
  }

  const deduplicated = new Map();
  for (const item of packages) {
    const key = `${item.name}@${item.version}`;
    const prior = deduplicated.get(key);
    if (!prior || (prior.development && !item.development)) deduplicated.set(key, item);
  }
  const sorted = [...deduplicated.values()].sort((left, right) => {
    const leftKey = `${left.name}@${left.version}`;
    const rightKey = `${right.name}@${right.version}`;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  const rows = sorted.map(
    (item) =>
      `| \`${escapeCell(`${item.name}@${item.version}`)}\` | ${item.development ? '개발' : '실행'} | ` +
      `${escapeCell(item.license)} | \`${item.licenseFile}\`, \`${item.licenseSha256}\` | ` +
      `${escapeCell(item.notice)} |`,
  );

  return [
    START,
    '',
    '## NPM Dependencies',
    '',
    `아래 ${sorted.length}개 항목은 고정된 package-lock.json과 설치 가능한 패키지의 라이선스 자료에서 생성했습니다. 현재 운영체제에 설치되지 않는 선택 패키지는 잠금 파일의 SPDX 선언과 무결성 값을 기록합니다.`,
    '',
    '| 패키지 | 구분 | 라이선스 | 라이선스 파일·SHA-256 | 저작권 또는 작성자 고지 |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
    END,
    '',
  ].join('\n');
}

export async function expectedNoticeDocument() {
  const current = await readFile(NOTICE_PATH, 'utf8');
  const generated = await buildDependencySection();
  const startOffset = current.indexOf(START);
  if (startOffset < 0) return `${current.trimEnd()}\n\n${generated}`;
  const endOffset = current.indexOf(END, startOffset);
  if (endOffset < 0) throw new Error('Generated dependency notice end marker is missing');
  return `${current.slice(0, startOffset)}${generated}${current.slice(endOffset + END.length).trimStart()}`;
}

async function main() {
  const expected = await expectedNoticeDocument();
  if (process.argv.includes('--check')) {
    const current = await readFile(NOTICE_PATH, 'utf8');
    if (current !== expected) {
      const currentLines = current.split('\n');
      const expectedLines = expected.split('\n');
      const limit = Math.max(currentLines.length, expectedLines.length);
      let firstDifference = 0;
      while (
        firstDifference < limit &&
        currentLines[firstDifference] === expectedLines[firstDifference]
      ) {
        firstDifference += 1;
      }
      const lineNumber = firstDifference + 1;
      process.stderr.write(
        `THIRD_PARTY_NOTICES.md first differs at line ${lineNumber}.\n` +
          `Current: ${currentLines[firstDifference] ?? '<missing>'}\n` +
          `Expected: ${expectedLines[firstDifference] ?? '<missing>'}\n`,
      );
      throw new Error('THIRD_PARTY_NOTICES.md is out of date');
    }
    process.stdout.write('Dependency notices match the lockfile and installed license files.\n');
    return;
  }
  await writeFile(NOTICE_PATH, expected, 'utf8');
  process.stdout.write('Dependency notices updated.\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
