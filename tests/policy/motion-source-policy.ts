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
const PROTOTYPE_GLOBAL_OBJECTS = new Set([
  'document',
  'globalThis',
  'navigator',
  'self',
  'window',
]);
const PROTOTYPE_COMPUTED_ROOTS = new Set([
  ...PROTOTYPE_GLOBAL_OBJECTS,
  'Date',
  'Math',
]);
// Prototype modules intentionally reject aliases for browser/network/time sources.
// This conservative boundary prevents computed-name bypasses; Math.imul is the one
// reviewed deterministic primitive used by the local mock engine.
const PROTOTYPE_FORBIDDEN_IDENTIFIERS = new Set([
  'Date',
  'EventSource',
  'RTCPeerConnection',
  'SharedWorker',
  'WebSocket',
  'Worker',
  'XMLHttpRequest',
  'caches',
  'crypto',
  'fetch',
  'indexedDB',
  'localStorage',
  'performance',
  'sendBeacon',
  'sessionStorage',
]);
const PROTOTYPE_CODE_GENERATION_IDENTIFIERS = new Set([
  'AsyncFunction',
  'AsyncGeneratorFunction',
  'Function',
  'GeneratorFunction',
  'WebAssembly',
  'eval',
  'setInterval',
  'setTimeout',
]);
const APPROVED_PROTOTYPE_IMPORTS = new Map<string, ReadonlySet<string>>([
  ['@/prototype/contracts', new Set(['MockBehavior', 'SyntheticCase'])],
  [
    '@/prototype/inspect',
    new Set([
      'CHECK_ORDER',
      'InspectionCheck',
      'InspectionOutcome',
      'VerifiedFields',
      'inspectAndRestoreResponse',
      'inspectResponse',
    ]),
  ],
  ['@/prototype/mockModel', new Set(['generateMockResponse'])],
  [
    '@/prototype/protect',
    new Set(['detectSyntheticIdentifiers', 'protectDetectedSpans']),
  ],
]);
const APPROVED_DIRECT_CALLS = new Set(['String']);
const APPROVED_CONSTRUCTORS = new Set(['Error', 'Map', 'RegExp', 'Set']);
const APPROVED_PURE_METHODS = new Set([
  'add',
  'charCodeAt',
  'clear',
  'every',
  'exec',
  'find',
  'flatMap',
  'get',
  'has',
  'imul',
  'includes',
  'indexOf',
  'join',
  'keys',
  'map',
  'match',
  'matchAll',
  'object',
  'padStart',
  'parse',
  'push',
  'replace',
  'set',
  'slice',
  'some',
  'sort',
  'split',
  'strict',
  'string',
  'stringify',
  'test',
  'trim',
  'values',
]);
const APPROVED_STRING_METHODS = new Set([
  'charCodeAt',
  'includes',
  'indexOf',
  'match',
  'matchAll',
  'padStart',
  'replace',
  'slice',
  'split',
  'trim',
]);
const APPROVED_ARRAY_METHODS = new Set([
  'every',
  'find',
  'flatMap',
  'indexOf',
  'join',
  'map',
  'push',
  'slice',
  'some',
  'sort',
]);
const APPROVED_MAP_METHODS = new Set(['clear', 'get', 'has', 'keys', 'set']);
const APPROVED_SET_METHODS = new Set(['add', 'has']);
const APPROVED_REGEXP_METHODS = new Set(['exec', 'test']);
const APPROVED_ZOD_METHODS = new Set(['object', 'parse', 'strict', 'string']);
const APPROVED_BUILTIN_METHODS = new Map<string, ReadonlySet<string>>([
  ['JSON', new Set(['parse', 'stringify'])],
  ['Math', new Set(['imul'])],
  ['Object', new Set(['values'])],
]);

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

function staticStringValue(node: ts.Expression): string | null {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isParenthesizedExpression(node)) return staticStringValue(node.expression);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = staticStringValue(node.left);
    const right = staticStringValue(node.right);
    return left === null || right === null ? null : left + right;
  }
  if (ts.isTemplateExpression(node)) {
    let value = node.head.text;
    for (const span of node.templateSpans) {
      const expression = staticStringValue(span.expression);
      if (expression === null) return null;
      value += expression + span.literal.text;
    }
    return value;
  }
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'join' &&
    ts.isArrayLiteralExpression(node.expression.expression) &&
    node.arguments.length <= 1
  ) {
    const values = node.expression.expression.elements.map((element) =>
      ts.isExpression(element) ? staticStringValue(element) : null,
    );
    const separator = node.arguments.length === 0 ? ',' : staticStringValue(node.arguments[0]);
    return values.some((value) => value === null) || separator === null
      ? null
      : (values as string[]).join(separator);
  }
  return null;
}

function rootIdentifierNode(node: ts.Expression): ts.Identifier | null {
  let current = node;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isPropertyAccessExpression(current) ||
    ts.isElementAccessExpression(current)
  ) {
    current = current.expression;
  }
  return ts.isIdentifier(current) ? current : null;
}

function rootIdentifier(node: ts.Expression): string | null {
  return rootIdentifierNode(node)?.text ?? null;
}

function isArrayLiteralJoin(node: ts.Node): node is ts.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'join' &&
    ts.isArrayLiteralExpression(node.expression.expression)
  );
}

function isStringConstructionOperand(node: ts.Expression): boolean {
  return (
    ts.isStringLiteralLike(node) ||
    ts.isTemplateExpression(node) ||
    staticStringValue(node) !== null
  );
}

function prototypeAstViolations(source: string, fileName: string): MotionPolicyViolation[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const violations: MotionPolicyViolation[] = [];
  const compilerOptions: ts.CompilerOptions = {
    noResolve: true,
    target: ts.ScriptTarget.Latest,
  };
  const defaultCompilerHost = ts.createCompilerHost(compilerOptions);
  const compilerHost: ts.CompilerHost = {
    ...defaultCompilerHost,
    fileExists: (path) => path === fileName || defaultCompilerHost.fileExists(path),
    getSourceFile: (path, languageVersion) =>
      path === fileName
        ? sourceFile
        : defaultCompilerHost.getSourceFile(path, languageVersion),
    readFile: (path) => path === fileName ? source : defaultCompilerHost.readFile(path),
  };
  const checker = ts.createProgram([fileName], compilerOptions, compilerHost).getTypeChecker();
  const report = (node: ts.Node, rule: string): void => {
    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    violations.push({
      file: fileName,
      line: position.line + 1,
      column: position.character + 1,
      rule,
    });
  };
  const containsForbiddenPublicContent = (value: string): boolean =>
    PUBLIC_CONTENT_RULES.some(({pattern}) => {
      pattern.lastIndex = 0;
      return pattern.test(value);
    });

  const importModuleForDeclaration = (declaration: ts.Declaration): string | null => {
    let current: ts.Node = declaration;
    while (!ts.isSourceFile(current)) {
      if (ts.isImportDeclaration(current)) {
        return ts.isStringLiteral(current.moduleSpecifier) ? current.moduleSpecifier.text : null;
      }
      current = current.parent;
    }
    return null;
  };

  const isStandardLibrarySymbol = (symbol: ts.Symbol | undefined): boolean => {
    const declarations = symbol?.declarations;
    return declarations !== undefined && declarations.length > 0 && declarations.every(
      (declaration) => {
        const declarationSource = declaration.getSourceFile();
        return declarationSource !== sourceFile && declarationSource.isDeclarationFile;
      },
    );
  };

  const hasAssertedReceiver = (node: ts.Expression): boolean => {
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) return true;
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node)
    ) {
      return hasAssertedReceiver(node.expression);
    }
    return false;
  };

  const hasNonConstTypeAssertion = (node: ts.Node): boolean => {
    let found = false;
    const inspect = (current: ts.Node): void => {
      if (found) return;
      if (ts.isTypeAssertionExpression(current)) {
        found = true;
        return;
      }
      if (ts.isAsExpression(current)) {
        if (current.type.getText(sourceFile) !== 'const') {
          found = true;
          return;
        }
        inspect(current.expression);
        return;
      }
      ts.forEachChild(current, inspect);
    };
    inspect(node);
    return found;
  };

  const validateImport = (node: ts.ImportDeclaration): void => {
    const module = ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : null;
    if (node.importClause === undefined) {
      report(node, 'prototype-import:side-effect');
      return;
    }
    if (module === null || module.startsWith('.') || module.startsWith('/') || module.startsWith('@/') && !module.startsWith('@/prototype/')) {
      report(node, 'prototype-import:relative-or-out-of-bound');
      return;
    }
    const approvedBindings = module === 'zod'
      ? new Set(['z'])
      : APPROVED_PROTOTYPE_IMPORTS.get(module);
    if (approvedBindings === undefined) {
      report(
        node,
        module.startsWith('@/prototype/')
          ? 'prototype-import:unreviewed-prototype-module'
          : 'prototype-import:external',
      );
      return;
    }
    const bindings = node.importClause.namedBindings;
    if (
      node.importClause.name !== undefined ||
      bindings === undefined ||
      !ts.isNamedImports(bindings)
    ) {
      report(node, 'prototype-import:unsupported-binding');
      return;
    }
    for (const element of bindings.elements) {
      const importedName = element.propertyName?.text ?? element.name.text;
      if (!approvedBindings.has(importedName)) {
        report(element, 'prototype-import:unreviewed-binding');
      }
    }
  };

  const validateDirectCall = (node: ts.CallExpression, callee: ts.Identifier): void => {
    if (PROTOTYPE_CODE_GENERATION_IDENTIFIERS.has(callee.text)) {
      report(node, `prototype-code-generation:${callee.text}`);
      return;
    }

    const symbol = checker.getSymbolAtLocation(callee);
    const declaration = symbol?.declarations?.[0];
    if (APPROVED_DIRECT_CALLS.has(callee.text) && isStandardLibrarySymbol(symbol)) return;
    if (declaration === undefined) {
      report(node, 'prototype-call:unresolved');
      return;
    }
    if (ts.isParameter(declaration)) {
      report(node, 'prototype-call:parameter');
      return;
    }
    if (ts.isFunctionDeclaration(declaration)) {
      if (
        symbol?.declarations?.every(
          (candidate) => ts.isFunctionDeclaration(candidate) && candidate.body !== undefined,
        )
      ) {
        return;
      }
      report(node, 'prototype-call:ambient-declaration');
      return;
    }
    if (ts.isImportSpecifier(declaration)) {
      const module = importModuleForDeclaration(declaration);
      if (module !== null && APPROVED_PROTOTYPE_IMPORTS.has(module)) return;
      report(node, 'prototype-call:external-or-unreviewed-import');
      return;
    }
    if (ts.isVariableDeclaration(declaration)) {
      if (
        declaration.initializer !== undefined &&
        (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))
      ) {
        return;
      }
      report(node, 'prototype-call:unresolved-alias');
      return;
    }
    report(node, 'prototype-call:unreviewed-callee');
  };

  const typeAllowsMethod = (node: ts.Expression, method: string): boolean => {
    const allows = (type: ts.Type): boolean => {
      if (type.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void)) {
        return true;
      }
      if (type.isUnion()) return type.types.every(allows);
      if (type.flags & ts.TypeFlags.StringLike) return APPROVED_STRING_METHODS.has(method);
      if (checker.isArrayType(type) || checker.isTupleType(type)) {
        return APPROVED_ARRAY_METHODS.has(method);
      }
      const typeName = type.aliasSymbol?.getName() ?? type.getSymbol()?.getName() ?? '';
      const typeSymbol = type.getSymbol();
      if (typeName === 'RegExpMatchArray') {
        return isStandardLibrarySymbol(typeSymbol) && APPROVED_ARRAY_METHODS.has(method);
      }
      if (typeName === 'Map' || typeName === 'ReadonlyMap') {
        return isStandardLibrarySymbol(typeSymbol) && APPROVED_MAP_METHODS.has(method);
      }
      if (typeName === 'Set' || typeName === 'ReadonlySet') {
        return isStandardLibrarySymbol(typeSymbol) && APPROVED_SET_METHODS.has(method);
      }
      if (typeName === 'RegExp') {
        return isStandardLibrarySymbol(typeSymbol) && APPROVED_REGEXP_METHODS.has(method);
      }
      return false;
    };
    const type = checker.getTypeAtLocation(node);
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return false;
    return allows(type);
  };

  const isZodExpression = (node: ts.Expression): boolean => {
    let current = node;
    while (ts.isParenthesizedExpression(current)) current = current.expression;
    if (ts.isCallExpression(current)) return isZodExpression(current.expression);
    if (ts.isPropertyAccessExpression(current)) return isZodExpression(current.expression);
    if (!ts.isIdentifier(current)) return false;
    const symbol = checker.getSymbolAtLocation(current);
    const declaration = symbol?.declarations?.[0];
    if (declaration !== undefined && ts.isImportSpecifier(declaration)) {
      return importModuleForDeclaration(declaration) === 'zod';
    }
    if (
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer !== undefined
    ) {
      return isZodExpression(declaration.initializer);
    }
    return false;
  };

  const validatePropertyCall = (
    node: ts.CallExpression,
    callee: ts.PropertyAccessExpression,
  ): void => {
    const method = callee.name.text;
    if (!APPROVED_PURE_METHODS.has(method)) {
      report(node, `prototype-call:unreviewed-method:${method}`);
      return;
    }
    const receiver = callee.expression;
    if (hasAssertedReceiver(receiver)) {
      report(node, 'prototype-call:asserted-receiver');
      return;
    }
    const root = rootIdentifier(receiver);
    const rootNode = rootIdentifierNode(receiver);
    const rootSymbol = rootNode === null ? undefined : checker.getSymbolAtLocation(rootNode);
    const rootDeclaration = rootSymbol?.declarations?.[0];
    if (root !== null) {
      const builtinMethods = APPROVED_BUILTIN_METHODS.get(root);
      if (builtinMethods?.has(method) && isStandardLibrarySymbol(rootSymbol)) return;
    }
    if (
      rootDeclaration !== undefined &&
      ts.isImportSpecifier(rootDeclaration) &&
      importModuleForDeclaration(rootDeclaration) === '@/prototype/inspect' &&
      (rootDeclaration.propertyName?.text ?? rootDeclaration.name.text) === 'CHECK_ORDER' &&
      APPROVED_ARRAY_METHODS.has(method)
    ) {
      return;
    }
    if (rootDeclaration !== undefined && ts.isVariableDeclaration(rootDeclaration)) {
      if (rootDeclaration.initializer === undefined) {
        report(node, 'prototype-call:unreviewed-receiver');
        return;
      }
      if (hasNonConstTypeAssertion(rootDeclaration.initializer)) {
        report(node, 'prototype-call:asserted-receiver');
        return;
      }
    }
    if (isZodExpression(receiver) && APPROVED_ZOD_METHODS.has(method)) {
      return;
    }
    if (typeAllowsMethod(receiver, method)) return;
    if (root === null) {
      report(node, 'prototype-call:unreviewed-receiver');
      return;
    }
    const declaration = rootDeclaration;
    if (declaration === undefined) {
      report(node, 'prototype-call:unresolved-receiver');
    } else if (ts.isParameter(declaration)) {
      report(node, 'prototype-call:parameter-receiver');
    } else if (ts.isImportSpecifier(declaration)) {
      report(node, 'prototype-call:external-or-unreviewed-import-receiver');
    } else {
      report(node, 'prototype-call:unreviewed-receiver');
    }
  };

  const validateCall = (node: ts.CallExpression): void => {
    const callee = node.expression;
    if (callee.kind === ts.SyntaxKind.ImportKeyword) {
      report(node, 'prototype-import:dynamic');
      return;
    }
    if (ts.isIdentifier(callee)) {
      validateDirectCall(node, callee);
      return;
    }
    if (ts.isPropertyAccessExpression(callee)) {
      validatePropertyCall(node, callee);
      return;
    }
    if (ts.isElementAccessExpression(callee)) {
      report(node, 'prototype-call:computed-callee');
      return;
    }
    report(node, 'prototype-call:dynamic-callee');
  };

  const validateConstructor = (node: ts.NewExpression): void => {
    const constructor = node.expression;
    if (ts.isIdentifier(constructor) && PROTOTYPE_CODE_GENERATION_IDENTIFIERS.has(constructor.text)) {
      report(node, `prototype-code-generation:${constructor.text}`);
      return;
    }
    if (ts.isIdentifier(constructor) && APPROVED_CONSTRUCTORS.has(constructor.text)) {
      const symbol = checker.getSymbolAtLocation(constructor);
      if (isStandardLibrarySymbol(symbol)) return;
    }
    report(node, 'prototype-constructor:unreviewed');
  };

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) validateImport(node);
    if (ts.isImportEqualsDeclaration(node)) report(node, 'prototype-import:import-equals');
    if (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined) {
      report(node, 'prototype-import:re-export');
    }
    if (ts.isCallExpression(node)) validateCall(node);
    if (ts.isNewExpression(node)) validateConstructor(node);
    if (ts.isTaggedTemplateExpression(node)) report(node, 'prototype-call:tagged-template');
    if (ts.isElementAccessExpression(node)) {
      const root = rootIdentifier(node.expression);
      if (root !== null && PROTOTYPE_COMPUTED_ROOTS.has(root)) {
        report(node, `prototype-computed-access:${root}`);
      }
    }
    if (ts.isIdentifier(node) && PROTOTYPE_GLOBAL_OBJECTS.has(node.text)) {
      report(node, `prototype-global-object:${node.text}`);
    }
    if (ts.isIdentifier(node) && PROTOTYPE_FORBIDDEN_IDENTIFIERS.has(node.text)) {
      report(node, `prototype-forbidden-identifier:${node.text}`);
    }
    if (ts.isIdentifier(node) && PROTOTYPE_CODE_GENERATION_IDENTIFIERS.has(node.text)) {
      report(node, `prototype-code-generation:${node.text}`);
    }
    if (
      ts.isIdentifier(node) &&
      node.text === 'Math' &&
      !(
        ts.isPropertyAccessExpression(node.parent) &&
        node.parent.expression === node &&
        node.parent.name.text === 'imul'
      )
    ) {
      report(node, 'prototype-global-object:Math');
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.PlusToken &&
      (isStringConstructionOperand(node.left) || isStringConstructionOperand(node.right))
    ) {
      report(node, 'prototype-dynamic-string:concatenation');
    }
    if (isArrayLiteralJoin(node)) {
      report(node, 'prototype-dynamic-string:array-join');
    }
    if (ts.isBinaryExpression(node) || ts.isTemplateExpression(node) || ts.isCallExpression(node)) {
      const value = staticStringValue(node);
      if (value !== null && containsForbiddenPublicContent(value)) {
        report(node, 'prototype-dynamic-string:forbidden-content');
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
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
    violations.push(...prototypeAstViolations(source, fileName));
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
