import ts from 'typescript';

export type MotionPolicyViolation = {
  file: string;
  line: number;
  column: number;
  rule: string;
};

type StaticRule = Readonly<{name: string; pattern: RegExp}>;

const PROTOTYPE_BOUNDARY_RULES: readonly StaticRule[] = [
  {name: 'prototype-network:fetch', pattern: /\bfetch\s*\(/gu},
  {name: 'prototype-network:XMLHttpRequest', pattern: /\bXMLHttpRequest\b/gu},
  {name: 'prototype-network:WebSocket', pattern: /\bWebSocket\b/gu},
  {name: 'prototype-network:EventSource', pattern: /\bEventSource\b/gu},
  {name: 'prototype-network:sendBeacon', pattern: /\bsendBeacon\s*\(/gu},
  {name: 'prototype-storage:web-storage', pattern: /\b(?:localStorage|sessionStorage)\b/gu},
  {name: 'prototype-storage:indexed-db', pattern: /\bindexedDB\b/gu},
  {name: 'prototype-storage:cache-api', pattern: /\bcaches\b/gu},
  {name: 'prototype-storage:cookie-write', pattern: /\bdocument\s*\.\s*cookie\s*=/gu},
  {
    name: 'prototype-storage:service-worker-register',
    pattern: /\bserviceWorker\s*\.\s*register\s*\(/gu,
  },
  {name: 'prototype-nondeterminism:wall-clock', pattern: /\bDate\s*\.\s*now\s*\(/gu},
  {name: 'prototype-nondeterminism:random', pattern: /\bMath\s*\.\s*random\s*\(/gu},
];

const PUBLIC_CONTENT_RULES: readonly StaticRule[] = [
  {name: 'prototype-brand:external-provider', pattern: /\b(?:OpenAI|ChatGPT)\b/gu},
  {name: 'prototype-brand:bank', pattern: /\b(?:KB|iM)\b/gu},
  {name: 'prototype-identifier:phone', pattern: /\b01[016789][ -]?\d{3,4}[ -]?\d{4}\b/gu},
  {name: 'prototype-identifier:resident', pattern: /\b\d{6}[ -]?[1-4]\d{6}\b/gu},
  {name: 'prototype-identifier:card', pattern: /\b(?:\d{4}[ -]?){3}\d{4}\b/gu},
  {name: 'prototype-identifier:account', pattern: /\b\d{2,6}[ -]\d{2,6}[ -]\d{5,8}\b/gu},
];

const FIXTURE_SHORTCUT_FIELDS = ['expectedOutcome', 'verifiedResult', 'mockResponse'] as const;

function staticRuleViolations(
  source: string,
  fileName: string,
  rules: readonly StaticRule[],
): MotionPolicyViolation[] {
  const violations: MotionPolicyViolation[] = [];
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    for (const match of source.matchAll(rule.pattern)) {
      const prefix = source.slice(0, match.index);
      const lines = prefix.split('\n');
      violations.push({
        file: fileName,
        line: lines.length,
        column: (lines.at(-1)?.length ?? 0) + 1,
        rule: rule.name,
      });
    }
  }
  return violations;
}

export function findPrototypeSourcePolicyViolations(
  source: string,
  fileName: string,
): MotionPolicyViolation[] {
  const normalized = fileName.replaceAll('\\', '/');
  const prototype = normalized.startsWith('src/prototype/') || normalized.includes('/src/prototype/');
  const fixture = normalized.endsWith('/src/demo/fixtures/synthetic-cases-v2.json') ||
    normalized === 'src/demo/fixtures/synthetic-cases-v2.json';
  if (!prototype && !fixture) return [];

  const violations = staticRuleViolations(source, fileName, PUBLIC_CONTENT_RULES);
  if (prototype) {
    violations.push(...staticRuleViolations(source, fileName, PROTOTYPE_BOUNDARY_RULES));
  }
  if (fixture) {
    const fixtureRules = FIXTURE_SHORTCUT_FIELDS.map((field) => ({
      name: `fixture-forbidden-field:${field}`,
      pattern: new RegExp(`"${field}"\\s*:`, 'gu'),
    }));
    violations.push(...staticRuleViolations(source, fileName, fixtureRules));
  }
  return violations;
}

const MOTION_MODULE = /^(?:motion|framer-motion|motion-dom|motion-utils)(?:\/|$)/u;
const FORBIDDEN_CALLS = new Set([
  'animate',
  'animateValue',
  'attachSpring',
  'motionValue',
  'useAnimate',
  'useAnimationFrame',
  'useMotionValue',
  'useSpring',
  'useTime',
]);
const FORBIDDEN_MOTION_PROPS = new Set([
  'animate',
  'custom',
  'drag',
  'dragConstraints',
  'dragControls',
  'dragDirectionLock',
  'dragElastic',
  'dragListener',
  'dragMomentum',
  'dragPropagation',
  'dragSnapToOrigin',
  'dragTransition',
  'exit',
  'inherit',
  'initial',
  'layout',
  'layoutDependency',
  'layoutId',
  'onAnimationComplete',
  'onAnimationStart',
  'onDirectionLock',
  'onDrag',
  'onDragEnd',
  'onDragStart',
  'onHoverEnd',
  'onHoverStart',
  'onPan',
  'onPanEnd',
  'onPanSessionStart',
  'onPanStart',
  'onTap',
  'onTapCancel',
  'onTapStart',
  'onUpdate',
  'transition',
  'variants',
  'viewport',
  'whileDrag',
  'whileFocus',
  'whileHover',
  'whileInView',
  'whileTap',
]);

function moduleName(node: ts.Expression | undefined): string | null {
  return node !== undefined && ts.isStringLiteral(node) ? node.text : null;
}

function isMotionModule(value: string | null): boolean {
  return value !== null && MOTION_MODULE.test(value);
}

function isDirectMotionTag(tag: ts.JsxTagNameExpression): tag is ts.JsxTagNamePropertyAccess {
  return (
    ts.isPropertyAccessExpression(tag) &&
    ts.isIdentifier(tag.expression) &&
    tag.expression.text === 'motion'
  );
}

function isDirectMotionTagAccess(node: ts.PropertyAccessExpression): boolean {
  const parent = node.parent;
  return (
    (ts.isJsxOpeningElement(parent) ||
      ts.isJsxSelfClosingElement(parent) ||
      ts.isJsxClosingElement(parent)) &&
    parent.tagName === node &&
    isDirectMotionTag(parent.tagName)
  );
}

function jsxAttributeName(attribute: ts.JsxAttribute): string {
  return attribute.name.getText();
}

function exactMotionImportSpecifier(node: ts.ImportDeclaration): ts.ImportSpecifier | null {
  const clause = node.importClause;
  const bindings = clause?.namedBindings;
  if (
    moduleName(node.moduleSpecifier) !== 'motion/react' ||
    clause === undefined ||
    clause.isTypeOnly ||
    clause.name !== undefined ||
    bindings === undefined ||
    !ts.isNamedImports(bindings) ||
    bindings.elements.length !== 1 ||
    bindings.elements[0].propertyName !== undefined ||
    bindings.elements[0].name.text !== 'motion'
  ) {
    return null;
  }

  return bindings.elements[0];
}

function createPolicyProgram(
  source: string,
  fileName: string,
): {sourceFile: ts.SourceFile; checker: ts.TypeChecker} {
  const scriptKind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKind);
  const options: ts.CompilerOptions = {
    jsx: ts.JsxEmit.Preserve,
    module: ts.ModuleKind.ESNext,
    noLib: true,
    noResolve: true,
    target: ts.ScriptTarget.Latest,
  };
  const host: ts.CompilerHost = {
    fileExists: (requestedFileName) => requestedFileName === fileName,
    getCanonicalFileName: (requestedFileName) => requestedFileName,
    getCurrentDirectory: () => '',
    getDefaultLibFileName: () => 'lib.d.ts',
    getNewLine: () => '\n',
    getSourceFile: (requestedFileName) =>
      requestedFileName === fileName ? sourceFile : undefined,
    readFile: (requestedFileName) => (requestedFileName === fileName ? source : undefined),
    useCaseSensitiveFileNames: () => true,
    writeFile: () => undefined,
  };
  const program = ts.createProgram({rootNames: [fileName], options, host});

  return {
    sourceFile: program.getSourceFile(fileName) ?? sourceFile,
    checker: program.getTypeChecker(),
  };
}

export function findMotionPolicyViolations(
  source: string,
  fileName: string,
): MotionPolicyViolation[] {
  const {sourceFile, checker} = createPolicyProgram(source, fileName);
  const violations: MotionPolicyViolation[] = [];
  const importedMotionBindings = new Set<ts.Symbol>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const specifier = exactMotionImportSpecifier(statement);
    const symbol = specifier === null ? undefined : checker.getSymbolAtLocation(specifier.name);
    if (symbol !== undefined) importedMotionBindings.add(symbol);
  }

  const report = (node: ts.Node, rule: string): void => {
    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    violations.push({
      file: fileName,
      line: position.line + 1,
      column: position.character + 1,
      rule,
    });
  };

  const inspectMotionElement = (node: ts.JsxOpeningLikeElement): void => {
    if (!isDirectMotionTag(node.tagName)) return;

    const tagObject = node.tagName.expression;
    const tagSymbol = checker.getSymbolAtLocation(tagObject);
    if (tagSymbol === undefined || !importedMotionBindings.has(tagSymbol)) {
      report(tagObject, 'motion-tag-binding');
    }

    let hasStyle = false;
    for (const attribute of node.attributes.properties) {
      if (ts.isJsxSpreadAttribute(attribute)) {
        report(attribute, 'motion-no-spread-props');
        continue;
      }

      const name = jsxAttributeName(attribute);
      if (name === 'style') hasStyle = true;
      if (FORBIDDEN_MOTION_PROPS.has(name)) report(attribute, `motion-forbidden-prop:${name}`);
    }

    if (!hasStyle) report(node, 'motion-style-required');
  };

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && isMotionModule(moduleName(node.moduleSpecifier))) {
      if (exactMotionImportSpecifier(node) === null) report(node, 'motion-import-boundary');
    }

    if (ts.isExportDeclaration(node) && isMotionModule(moduleName(node.moduleSpecifier))) {
      report(node, 'motion-export-boundary');
    }

    if (ts.isCallExpression(node)) {
      if (
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        isMotionModule(moduleName(node.arguments[0]))
      ) {
        report(node, 'motion-dynamic-import');
      }

      if (
        ts.isIdentifier(node.expression) &&
        (FORBIDDEN_CALLS.has(node.expression.text) || node.expression.text === 'motion')
      ) {
        report(node, `motion-forbidden-call:${node.expression.text}`);
      }

      if (
        ts.isPropertyAccessExpression(node.expression) &&
        FORBIDDEN_CALLS.has(node.expression.name.text)
      ) {
        report(node, `motion-forbidden-call:${node.expression.name.text}`);
      }

      if (
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'require' &&
        isMotionModule(moduleName(node.arguments[0]))
      ) {
        report(node, 'motion-require');
      }
    }

    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'motion' &&
      !isDirectMotionTagAccess(node)
    ) {
      report(node, 'motion-wrapper-alias');
    }

    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'motion'
    ) {
      report(node, 'motion-computed-access');
    }

    if (ts.isIdentifier(node) && node.text === 'motion') {
      let symbol = checker.getSymbolAtLocation(node);
      if (ts.isShorthandPropertyAssignment(node.parent)) {
        symbol = checker.getShorthandAssignmentValueSymbol(node.parent) ?? symbol;
      } else if (ts.isExportSpecifier(node.parent)) {
        symbol = checker.getExportSpecifierLocalTargetSymbol(node.parent) ?? symbol;
      }

      const isImportName = ts.isImportSpecifier(node.parent) && node.parent.name === node;
      const isDirectTagObject =
        ts.isPropertyAccessExpression(node.parent) &&
        node.parent.expression === node &&
        isDirectMotionTagAccess(node.parent);
      if (
        symbol !== undefined &&
        importedMotionBindings.has(symbol) &&
        !isImportName &&
        !isDirectTagObject
      ) {
        report(node, 'motion-binding-reference');
      }
    }

    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      inspectMotionElement(node);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return violations;
}
