import {createHash} from 'node:crypto';

export const EXPECTED_CSP =
  "default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src-elem 'self'; style-src-attr 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'none'; media-src 'none'; frame-src 'none'; worker-src 'none'; child-src 'none'; manifest-src 'none'; form-action 'none'; object-src 'none'; base-uri 'none'";

export const APPROVED_ACTION_PINS = new Map([
  ['actions/checkout', 'df4cb1c069e1874edd31b4311f1884172cec0e10'],
  ['actions/setup-node', '249970729cb0ef3589644e2896645e5dc5ba9c38'],
  ['actions/configure-pages', '45bfe0192ca1faeb007ade9deae92b16b8254a0d'],
  ['actions/upload-pages-artifact', 'fc324d3547104276b827a68afc52ff2a11cc49c9'],
  ['actions/deploy-pages', 'cd2ce8fcbc39b97be8ca5fce6e763baed58fa128'],
]);

export const ALLOWED_LICENSES = new Set([
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BlueOak-1.0.0',
  'CC-BY-4.0',
  'CC0-1.0',
  'ISC',
  'MIT',
  'MIT-0',
  'MPL-2.0',
]);

const ROOT_FILES = new Set([
  '.gitattributes',
  '.gitignore',
  'FONT-LICENSE.txt',
  'LICENSE',
  'README.md',
  'THIRD_PARTY_NOTICES.md',
  'eslint.config.js',
  'index.html',
  'package-lock.json',
  'package.json',
  'playwright.config.ts',
  'release-manifest.json',
  'tsconfig.json',
  'vite.config.ts',
]);

const SOURCE_PATHS = [
  /^\.github\/CODEOWNERS$/u,
  /^\.github\/workflows\/(?:ci|pages)\.yml$/u,
  /^public\/favicon\.svg$/u,
  /^public\/fonts\/PrivacyDemoSans-(?:Regular|Bold)\.woff2$/u,
  /^artifacts\/regression\/(?:07-type-protection-detail|08-explicit-block)\.png$/u,
  /^scripts\/[a-z0-9-]+\.mjs$/u,
  /^scripts\/fonts\/[a-z0-9-]+\.py$/u,
  /^src\/.+\.(?:css|json|ts|tsx)$/u,
  /^tests\/.+\.(?:png|ts)$/u,
];

const ARTIFACT_PATHS = [
  /^artifacts\/recording-check\.md$/u,
  /^artifacts\/regression\/(?:07-type-protection-detail|08-explicit-block)\.png$/u,
  /^artifacts\/submission\/0[1-6]-[a-z0-9-]+\.png$/u,
];

const SECRET_AND_PATH_RULES = [
  {name: 'github-token', pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/gu},
  {name: 'aws-access-key', pattern: /\bAKIA[0-9A-Z]{16}\b/gu},
  {name: 'private-key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu},
  {name: 'mac-user-path', pattern: /\/Users\/[^/\s]+\//gu},
  {name: 'linux-user-path', pattern: /\/home\/[^/\s]+\//gu},
  {name: 'windows-user-path', pattern: /[A-Za-z]:\\Users\\[^\\\s]+\\/gu},
  {name: 'parent-repository-path', pattern: /(?:^|\/)privacy-agent(?:\/|$)/gu},
];

const IDENTIFIER_RULES = [
  {name: 'phone-number', pattern: /\b01[016789][ -]?\d{3,4}[ -]?\d{4}\b/gu},
  {name: 'resident-number', pattern: /\b\d{6}[ -]?[1-4]\d{6}\b/gu},
  {name: 'card-number', pattern: /\b(?:\d{4}[ -]?){3}\d{4}\b/gu},
  {name: 'account-number', pattern: /\b\d{2,6}[ -]\d{2,6}[ -]\d{5,8}\b/gu},
];

function lineAt(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

export function hashBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function hashSourceEntries(entries) {
  const digest = createHash('sha256');
  for (const entry of [...entries].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  )) {
    digest.update(entry.path, 'utf8');
    digest.update('\0');
    digest.update(String(entry.bytes.byteLength), 'utf8');
    digest.update('\0');
    digest.update(entry.bytes);
    digest.update('\0');
  }
  return digest.digest('hex');
}

export function isAllowedSourcePath(path) {
  if (path === 'release-manifest.json') return false;
  return ROOT_FILES.has(path) || SOURCE_PATHS.some((pattern) => pattern.test(path));
}

export function isAllowedRepositoryPath(path) {
  return (
    ROOT_FILES.has(path) ||
    SOURCE_PATHS.some((pattern) => pattern.test(path)) ||
    ARTIFACT_PATHS.some((pattern) => pattern.test(path))
  );
}

export function scanText(file, source) {
  return scanRules(file, source, [...SECRET_AND_PATH_RULES, ...IDENTIFIER_RULES]);
}

export function scanSecretsAndPaths(file, source) {
  return scanRules(file, source, SECRET_AND_PATH_RULES);
}

function scanRules(file, source, rules) {
  const findings = [];
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    for (const match of source.matchAll(rule.pattern)) {
      findings.push({file, rule: rule.name, line: lineAt(source, match.index)});
    }
  }
  return findings;
}

export function actionPinFindings(file, source) {
  const findings = [];
  for (const [index, line] of source.split('\n').entries()) {
    const match = line.match(/\buses:\s+([^\s#]+)/u);
    if (!match || match[1].startsWith('./')) continue;
    const reference = match[1];
    const separator = reference.lastIndexOf('@');
    const action = separator >= 0 ? reference.slice(0, separator) : reference;
    const revision = separator >= 0 ? reference.slice(separator + 1) : '';
    if (APPROVED_ACTION_PINS.get(action) !== revision) {
      findings.push({file, rule: 'unapproved-action-pin', line: index + 1});
    }
  }
  return findings;
}

export function approvalStateFindings(manifest, deployment) {
  const findings = [];
  const approved = manifest.status === 'public-release-approved';
  const local = manifest.status === 'local-preflight-only';
  const reviewerPresent = typeof manifest.reviewer === 'string' && manifest.reviewer.trim().length >= 2;
  const approvalMilliseconds =
    typeof manifest.approvedAt === 'string' ? Date.parse(manifest.approvedAt) : Number.NaN;
  const approvalDateValid =
    Number.isFinite(approvalMilliseconds) &&
    new Date(approvalMilliseconds).toISOString() === manifest.approvedAt;

  if (!approved && !local) {
    findings.push({file: 'release-manifest.json', rule: 'manifest-status', line: 1});
  }
  if (deployment && !approved) {
    findings.push({file: 'release-manifest.json', rule: 'public-approval-required', line: 1});
  }
  if (approved || deployment) {
    if (!reviewerPresent) {
      findings.push({file: 'release-manifest.json', rule: 'reviewer-required', line: 1});
    }
    if (!approvalDateValid) {
      findings.push({file: 'release-manifest.json', rule: 'approval-date-required', line: 1});
    }
  } else if (local && (manifest.reviewer !== null || manifest.approvedAt !== null)) {
    findings.push({file: 'release-manifest.json', rule: 'local-preflight-state', line: 1});
  }
  return findings;
}

export function formatFindings(findings) {
  return findings.map(({file, rule, line}) => `${file}:${line} [${rule}]`).join('\n');
}
