import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, resolve} from 'node:path';

import {ESLint} from 'eslint';
import {describe, expect, it} from 'vitest';

import {
  findMotionPolicyViolations,
  findPrototypeSourcePolicyViolations,
} from './motion-source-policy';

const ALLOWED_WRAPPER = `
  import {motion} from 'motion/react';
  const calculatedStyle = {opacity: 0.5};
  export const Panel = () => (
    <motion.div style={calculatedStyle} className="panel" data-testid="panel" />
  );
`;

const ALLOWED_WRAPPER_WITH_CHILDREN = `
  import {motion} from 'motion/react';
  const calculatedStyle = {transform: 'translateX(16px)'};
  export const Panel = () => (
    <motion.section style={calculatedStyle} aria-hidden="true">
      <span>frame-calculated content</span>
    </motion.section>
  );
`;

const ALLOWED_UNRELATED_MOTION_NAMES = `
  import {motion} from 'motion/react';
  const metadata = {motion: 'plain label'};
  const echo = (motion: string) => motion;
  export const Panel = () => (
    <motion.div style={{opacity: 1}} data-label={echo(metadata.motion)} />
  );
`;

const BYPASS_FIXTURES = [
  {
    name: 'aliased animate import and function call',
    file: 'src/alias.ts',
    source: `import {animate as run} from 'motion/react'; run(0, 1);`,
  },
  {
    name: 'aliased wrapper import',
    file: 'src/wrapper-import-alias.tsx',
    source: `import {motion as m} from 'motion/react'; export const View = () => <m.div style={{opacity: 1}} />;`,
  },
  {
    name: 'framer-motion hook alias',
    file: 'src/framer-hook.ts',
    source: `import {useSpring as springValue} from 'framer-motion'; export const helper = () => springValue(0);`,
  },
  {
    name: 'motion-dom animation helpers',
    file: 'src/motion-dom.ts',
    source: `import {animateValue, attachSpring, motionValue} from 'motion-dom'; export const helpers = [animateValue, attachSpring, motionValue];`,
  },
  {
    name: 'motion-utils helper',
    file: 'src/motion-utils.ts',
    source: `import {clamp} from 'motion-utils'; export const value = clamp(0, 1, 2);`,
  },
  {
    name: 'Motion ecosystem subpaths',
    file: 'src/motion-subpaths.ts',
    source: `import {animate} from 'motion/dom'; import {frame} from 'motion-dom/client'; import {clamp} from 'motion-utils/subpath'; import {useSpring} from 'framer-motion/client'; export const helpers = [animate, frame, clamp, useSpring];`,
  },
  {
    name: 'motion value helper in a .ts file',
    file: 'src/helper.ts',
    source: `import {useMotionValue as value} from 'motion/react'; export const helper = () => value(0);`,
  },
  {
    name: 'root-package function call',
    file: 'src/root.ts',
    source: `import {motionValue} from 'motion'; motionValue(0);`,
  },
  {
    name: 'namespace member alias',
    file: 'src/namespace.ts',
    source: `import * as Motion from 'motion/react'; const run = Motion.animate; run(0, 1);`,
  },
  {
    name: 'dynamic Motion import',
    file: 'src/dynamic.ts',
    source: `export const load = () => import('motion/react');`,
  },
  {
    name: 're-exported function alias',
    file: 'src/re-export.ts',
    source: `export {animate as run} from 'motion/react';`,
  },
  {
    name: 'wrapper component alias',
    file: 'src/wrapper-alias.tsx',
    source: `import {motion} from 'motion/react'; const Box = motion.div; export const View = () => <Box style={{opacity: 1}} />;`,
  },
  {
    name: 'wrapper destructuring alias',
    file: 'src/wrapper-destructure.tsx',
    source: `import {motion} from 'motion/react'; const {div: Box} = motion; export const View = () => <Box animate={{opacity: 1}} />;`,
  },
  {
    name: 'Reflect.get wrapper lookup',
    file: 'src/wrapper-reflect.ts',
    source: `import {motion} from 'motion/react'; export const Box = Reflect.get(motion, 'div');`,
  },
  {
    name: 'bare wrapper assignment',
    file: 'src/wrapper-assignment.ts',
    source: `import {motion} from 'motion/react'; export const wrapper = motion;`,
  },
  {
    name: 'wrapper passed to a function',
    file: 'src/wrapper-passed.ts',
    source: `import {motion} from 'motion/react'; const store = (value: unknown) => value; export const wrapper = store(motion);`,
  },
  {
    name: 'shadowed motion JSX object',
    file: 'src/wrapper-shadow.tsx',
    source: `import {motion} from 'motion/react'; const fake = {div: 'div'}; export const View = () => { const motion = fake; return <motion.div style={{opacity: 1}} />; };`,
  },
  {
    name: 'spread props on a motion element',
    file: 'src/spread.tsx',
    source: `import {motion} from 'motion/react'; const props = {animate: {opacity: 1}}; export const View = () => <motion.div style={{opacity: 1}} {...props} />;`,
  },
  {
    name: 'gesture prop',
    file: 'src/gesture.tsx',
    source: `import {motion} from 'motion/react'; export const View = () => <motion.div style={{opacity: 1}} whileTap={{scale: 1}} />;`,
  },
  {
    name: 'animation prop',
    file: 'src/animation.tsx',
    source: `import {motion} from 'motion/react'; export const View = () => <motion.div style={{opacity: 1}} animate={{opacity: 1}} />;`,
  },
  {
    name: 'animation-frame hook call',
    file: 'src/frame.ts',
    source: `import {useAnimationFrame} from 'motion/react'; useAnimationFrame(() => undefined);`,
  },
] as const;

function collectSourceFiles(root: string): string[] {
  if (!statSync(root).isDirectory()) return [];

  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) return collectSourceFiles(path);
    return /\.tsx?$/u.test(path) ? [path] : [];
  });
}

describe('Motion source policy analyzer', () => {
  it('allows a direct Motion wrapper with calculated style values', () => {
    expect(findMotionPolicyViolations(ALLOWED_WRAPPER, 'src/allowed.tsx')).toEqual([]);
    expect(
      findMotionPolicyViolations(ALLOWED_WRAPPER_WITH_CHILDREN, 'src/allowed-children.tsx'),
    ).toEqual([]);
    expect(
      findMotionPolicyViolations(ALLOWED_UNRELATED_MOTION_NAMES, 'src/allowed-names.tsx'),
    ).toEqual([]);
  });

  it.each(BYPASS_FIXTURES)('rejects $name', ({file, source}) => {
    expect(findMotionPolicyViolations(source, file)).not.toEqual([]);
  });

  it.each([
    'animate',
    'useAnimate',
    'motionValue',
    'useMotionValue',
    'useSpring',
    'useTime',
    'useAnimationFrame',
  ])('rejects direct %s calls from TypeScript helpers', (functionName) => {
    const violations = findMotionPolicyViolations(
      `export const helper = () => ${functionName}(0);`,
      `src/${functionName}.ts`,
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({rule: `motion-forbidden-call:${functionName}`}),
      ]),
    );
  });

  it('scans every TypeScript and TSX source file in src', () => {
    const violations = collectSourceFiles(resolve('src')).flatMap((path) =>
      findMotionPolicyViolations(readFileSync(path, 'utf8'), path),
    );

    expect(violations).toEqual([]);
  });
});

describe('functional prototype source policy', () => {
  it.each([
    ['fetch', `export const run = () => fetch('/api');`],
    ['XMLHttpRequest', 'export const run = () => new XMLHttpRequest();'],
    ['WebSocket', `export const run = () => new WebSocket('wss://example.invalid');`],
    ['EventSource', `export const run = () => new EventSource('/events');`],
    ['sendBeacon', `export const run = () => navigator.sendBeacon('/audit');`],
    ['localStorage write', `export const run = () => localStorage.setItem('key', 'value');`],
    ['sessionStorage write', `export const run = () => sessionStorage.clear();`],
    ['IndexedDB write', `export const run = () => indexedDB.open('demo');`],
    ['Cache API write', `export const run = () => caches.open('demo');`],
    ['service worker registration', `export const run = () => navigator.serviceWorker.register('/sw.js');`],
    ['wall-clock shortcut', 'export const run = () => Date.now();'],
    ['random shortcut', 'export const run = () => Math.random();'],
  ])('rejects %s in prototype engine source', (_name, source) => {
    expect(findPrototypeSourcePolicyViolations(source, 'src/prototype/run.ts')).not.toEqual([]);
  });

  it.each(['expectedOutcome', 'verifiedResult', 'mockResponse'])(
    'rejects the %s expected-output shortcut in a reviewed fixture',
    (field) => {
      const source = JSON.stringify({cases: [{[field]: 'shortcut'}]});
      expect(
        findPrototypeSourcePolicyViolations(
          source,
          'src/demo/fixtures/synthetic-cases-v2.json',
        ),
      ).toEqual([
        expect.objectContaining({rule: `fixture-forbidden-field:${field}`}),
      ]);
    },
  );

  it.each([
    ['external provider', ['Open', 'AI'].join('')],
    ['consumer chat product', ['Chat', 'GPT'].join('')],
    ['bank abbreviation', ['K', 'B'].join('')],
    ['financial group abbreviation', ['i', 'M'].join('')],
  ])('rejects %s branding in prototype and fixture sources', (_name, brand) => {
    expect(
      findPrototypeSourcePolicyViolations(
        `export const provider = '${brand}';`,
        'src/prototype/run.ts',
      ),
    ).not.toEqual([]);
    expect(
      findPrototypeSourcePolicyViolations(
        JSON.stringify({cases: [{label: brand}]}),
        'src/demo/fixtures/synthetic-cases-v2.json',
      ),
    ).not.toEqual([]);
  });

  it.each([
    ['phone', ['010', '1234', '5678'].join('-')],
    ['resident number', ['900101', '1234567'].join('-')],
    ['card number', ['1234', '5678', '9012', '3456'].join('-')],
    ['account number', ['123', '45', '6789012'].join('-')],
  ])('rejects an actual-looking %s in prototype and fixture sources', (_name, identifier) => {
    for (const file of [
      'src/prototype/run.ts',
      'src/demo/fixtures/synthetic-cases-v2.json',
    ]) {
      expect(findPrototypeSourcePolicyViolations(identifier, file)).not.toEqual([]);
    }
  });

  it('keeps every prototype engine and the reviewed v2 fixture inside the static boundary', () => {
    const prototypeViolations = collectSourceFiles(resolve('src/prototype')).flatMap((path) =>
      findPrototypeSourcePolicyViolations(readFileSync(path, 'utf8'), path),
    );
    const fixturePath = resolve('src/demo/fixtures/synthetic-cases-v2.json');
    const fixtureViolations = findPrototypeSourcePolicyViolations(
      readFileSync(fixturePath, 'utf8'),
      fixturePath,
    );

    expect([...prototypeViolations, ...fixtureViolations]).toEqual([]);
  });
});

describe('Motion import lint boundary', () => {
  it(
    'allows only the exact motion wrapper import',
    async () => {
      const eslint = new ESLint({overrideConfigFile: resolve('eslint.config.js')});
      const [allowed] = await eslint.lintText(ALLOWED_WRAPPER, {filePath: 'src/allowed.tsx'});
      const blockedFixtures = BYPASS_FIXTURES.filter(({name}) =>
        [
          'aliased animate import and function call',
          'aliased wrapper import',
          'framer-motion hook alias',
          'motion-dom animation helpers',
          'motion-utils helper',
          'Motion ecosystem subpaths',
        ].includes(name),
      );
      const blocked = await Promise.all(
        blockedFixtures.map(async ({file, source}) => {
          const [result] = await eslint.lintText(source, {filePath: file});
          return result;
        }),
      );

      expect(allowed.messages.filter(({severity}) => severity === 2)).toEqual([]);
      for (const result of blocked) {
        expect(result.messages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              ruleId: expect.stringMatching(/^no-restricted-(?:imports|syntax)$/u),
              severity: 2,
            }),
          ]),
        );
      }
    },
    15_000,
  );
});
