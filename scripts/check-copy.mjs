import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import ts from 'typescript';

import {formatFindings, scanText} from './release-policy.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const FORBIDDEN_COPY = [
  ['em-dash', '—'],
  ['absolute-safety-claim', '100% 안전'],
  ['absolute-block-claim', '완전 차단'],
  ['zero-leak-claim', '유출 0'],
  ['production-complete-claim', '운영 완료'],
  ['validation-complete-claim', '검증 완료'],
  ['zero-knowledge-claim', 'Zero-Knowledge'],
  ['retired-brand', 'Aegis AI'],
  ['external-brand-chatgpt', 'ChatGPT'],
  ['external-brand-openai', 'OpenAI'],
  ['customer-brand-group', 'iM금융'],
  ['customer-brand-bank', 'iM뱅크'],
];

function lineAt(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

function collectStrings(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings);
  return [];
}

const copySource = await readFile(path.join(ROOT, 'src/content/copy.ts'), 'utf8');
const transpiled = ts.transpileModule(copySource, {
  compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022},
  fileName: 'copy.ts',
}).outputText;
const copyModule = await import(
  `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`
);
const fixture = JSON.parse(
  await readFile(path.join(ROOT, 'src/demo/fixtures/synthetic-consultation-v1.json'), 'utf8'),
);
const rendered = collectStrings(copyModule.COPY).concat(collectStrings(fixture)).join('\n');
const findings = scanText('rendered-copy', rendered);
for (const [rule, phrase] of FORBIDDEN_COPY) {
  let offset = rendered.indexOf(phrase);
  while (offset >= 0) {
    findings.push({file: 'rendered-copy', rule, line: lineAt(rendered, offset)});
    offset = rendered.indexOf(phrase, offset + phrase.length);
  }
}

if (findings.length > 0) {
  process.stderr.write(`${formatFindings(findings)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Rendered copy and synthetic fixture scan passed.\n');
}
