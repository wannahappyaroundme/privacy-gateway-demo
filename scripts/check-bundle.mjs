import {readdir, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

import {EXPECTED_CSP, formatFindings, scanSecretsAndPaths} from './release-policy.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = path.join(ROOT, 'dist');
const REQUEST_PRIMITIVES = [
  ['fetch-call', /\bfetch\s*\(/gu],
  ['xml-http-request', /\bnew\s+XMLHttpRequest\b/gu],
  ['web-socket', /\bnew\s+WebSocket\b/gu],
  ['event-source', /\bnew\s+EventSource\b/gu],
  ['send-beacon', /\.sendBeacon\s*\(/gu],
  ['worker', /\bnew\s+(?:SharedWorker|Worker)\b/gu],
  ['peer-connection', /\b(?:RTCPeerConnection|webkitRTCPeerConnection)\b/gu],
  ['external-dynamic-import', /\bimport\s*\(\s*["']https?:\/\//gu],
];

async function walk(directory) {
  const results = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await walk(absolute)));
    if (entry.isFile()) results.push(absolute);
  }
  return results;
}

function lineAt(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

function addPatternFindings(findings, file, source, rules) {
  for (const [rule, pattern] of rules) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      findings.push({file, rule, line: lineAt(source, match.index)});
    }
  }
}

const files = await walk(DIST);
const findings = [];
for (const file of files) {
  const relative = path.relative(ROOT, file).split(path.sep).join('/');
  if (file.endsWith('.map')) findings.push({file: relative, rule: 'source-map-file', line: 1});
  if (!/\.(?:css|html|js)$/u.test(file)) continue;
  const source = await readFile(file, 'utf8');
  findings.push(...scanSecretsAndPaths(relative, source));
  if (/sourceMappingURL=/u.test(source)) {
    findings.push({file: relative, rule: 'source-map-reference', line: 1});
  }
  if (file.endsWith('.js')) addPatternFindings(findings, relative, source, REQUEST_PRIMITIVES);
  if (file.endsWith('.css')) {
    addPatternFindings(findings, relative, source, [
      ['external-css-import', /@import\s+(?:url\()?\s*["']?https?:\/\//gu],
      ['external-css-url', /url\(\s*["']?https?:\/\//gu],
    ]);
  }
}

const indexPath = path.join(DIST, 'index.html');
const index = await readFile(indexPath, 'utf8');
const csp = index.match(
  /<meta http-equiv="Content-Security-Policy" content="([^"]+)"\s*\/?>/u,
);
if (csp?.[1] !== EXPECTED_CSP) {
  findings.push({file: 'dist/index.html', rule: 'built-csp-contract', line: 1});
}
for (const match of index.matchAll(/(?:src|href)="([^"]+)"/gu)) {
  const resource = match[1];
  if (
    resource.startsWith('http:') ||
    resource.startsWith('https:') ||
    resource.startsWith('//') ||
    (resource.startsWith('/') && !resource.startsWith('/privacy-gateway-demo/'))
  ) {
    findings.push({
      file: 'dist/index.html',
      rule: 'external-or-wrong-base-resource',
      line: lineAt(index, match.index),
    });
  }
}

if (findings.length > 0) {
  process.stderr.write(`${formatFindings(findings)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Built bundle is self-contained and has no request primitives.\n');
}
