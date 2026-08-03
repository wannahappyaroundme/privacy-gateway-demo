import {createHash} from 'node:crypto';

import ts from 'typescript';

export type PrototypePolicyViolation = {
  file: string;
  line: number;
  column: number;
  rule: string;
};

export type ReviewedPrototypeSource = Readonly<{
  file: string;
  source: string;
}>;

type ReviewedSource = Readonly<{
  sha256: string;
  imports: readonly string[];
  operations: Readonly<Record<string, number>>;
}>;

// This gate locks the exact reviewed five-file implementation. It is intentionally
// not a theorem about arbitrary TypeScript behavior or runtime value provenance.
// Any source, dependency, or operation change requires a new seal and ledger review.
const REVIEWED_PROTOTYPE_SOURCES: Readonly<Record<string, ReviewedSource>> = {
  'src/prototype/contracts.ts': {
    sha256: 'b7079459755b30864bca1bdd42848eb31bd0248256279eb8c6158d9ddf66e091',
    imports: [],
    operations: {
      'call:SYNTHETIC_REQUEST_PURPOSE.exec:direct:1': 1,
    },
  },
  'src/prototype/inspect.ts': {
    sha256: '741fcee254de0d4e5b06c01fbb68182adfcde0030942da7ec1de08807b443cc2',
    imports: ['zod|value:z', '@/prototype/contracts|value:extractSyntheticRequestPurpose'],
    operations: {
      'assign:=:checks[]': 6,
      'assign:=:fields': 1,
      'assign:=:restored': 1,
      'call:CHECK_ORDER.map:direct:1': 1,
      'call:JSON.parse:direct:1': 1,
      'call:Object.values().join:direct:1': 1,
      'call:Object.values:direct:1': 1,
      'call:ProtectedSummarySchema.parse:direct:1': 1,
      'call:RAW_SYNTHETIC_GRAMMAR.test:direct:1': 1,
      'call:SUMMARY_SENTENCE.exec:direct:1': 1,
      'call:array.sort:direct:0': 1,
      'call:checkList:direct:0': 1,
      'call:expected.every:direct:1': 1,
      'call:extractSyntheticRequestPurpose:direct:1': 1,
      'call:failAt:direct:2': 5,
      'call:fixedProfileOutputIsApproved:direct:1': 1,
      'call:input.chunks.join:direct:1': 1,
      'call:markerInventoryIsExact:direct:2': 1,
      'call:publicResult:direct:2': 2,
      'call:publicResult:direct:3': 1,
      'call:registry.keys:direct:0': 1,
      'call:restoreExactTokens:direct:2': 5,
      'call:restored.split().join:direct:1': 1,
      'call:restored.split:direct:1': 1,
      'call:sourceGroundingIsApproved:direct:3': 1,
      'call:sourceText.includes:direct:1': 1,
      'call:summaryText().match().sort:direct:0': 1,
      'call:summaryText().match:direct:1': 1,
      'call:summaryText:direct:1': 2,
      'call:validateResponse:direct:1': 2,
      'call:z.object().strict:direct:0': 1,
      'call:z.object:direct:1': 1,
      'call:z.string:direct:0': 5,
      'implicit:for-of:sync': 1,
      'implicit:spread:ArrayLiteralExpression': 1,
    },
  },
  'src/prototype/mockModel.ts': {
    sha256: '1f79a5f04c2f1c495eaa18b622751961f726970a25a9cc00dde78fa2259c79e8',
    imports: ['@/prototype/contracts|type:MockBehavior,value:extractSyntheticRequestPurpose'],
    operations: {
      'assign:+=:index': 1,
      'assign:+=:offset': 1,
      'assign:+=:slot': 1,
      'assign:=:hash': 1,
      'assign:=:start': 1,
      'assign:^=:hash': 1,
      'call:ACCOUNT_MARKER.test:direct:1': 1,
      'call:JSON.stringify:direct:1': 1,
      'call:Math.imul:direct:2': 1,
      'call:RAW_SYNTHETIC_GRAMMAR.test:direct:1': 1,
      'call:REVIEWED_EMPLOYEE_GUIDANCE.has:direct:1': 1,
      'call:SUMMARY_SENTENCE.exec:direct:1': 1,
      'call:addBoundary:direct:3': 1,
      'call:array.sort:direct:1': 1,
      'call:boundaries.add:direct:1': 1,
      'call:boundaries.has:direct:1': 1,
      'call:canonicalJson.indexOf:direct:1': 2,
      'call:canonicalJson.slice:direct:2': 1,
      'call:chunks.join:direct:1': 1,
      'call:chunks.push:direct:1': 1,
      'call:createSummary:direct:1': 1,
      'call:extractSyntheticRequestPurpose:direct:1': 1,
      'call:fnv1a32:direct:1': 1,
      'call:forcedReassemblyBoundary:direct:1': 1,
      'call:mutateOneAccountMarker:direct:1': 1,
      'call:protectedText.replace:direct:2': 1,
      'call:runFailed:direct:1': 7,
      'call:splitDeterministically:direct:2': 1,
      'call:value.charCodeAt:direct:1': 1,
      'implicit:for-of:sync': 1,
      'implicit:spread:ArrayLiteralExpression': 2,
      'new:Error:1': 1,
      'new:Set:1': 2,
    },
  },
  'src/prototype/protect.ts': {
    sha256: '142bbad6b1f548eea60537d7f40c12f277676ef96d0f4574783ca0821b4ce327',
    imports: [],
    operations: {
      'assign:-=:index': 1,
      'assign:=:previousEnd': 1,
      'assign:=:protectedText': 1,
      'call:RESERVED_OUTPUT.test:direct:1': 1,
      'call:RULES.find:direct:1': 1,
      'call:RULES.flatMap().sort:direct:1': 1,
      'call:RULES.flatMap:direct:1': 1,
      'call:RULES.some:direct:1': 1,
      'call:String().padStart:direct:2': 1,
      'call:String:direct:1': 1,
      'call:array.map:direct:1': 1,
      'call:array.sort:direct:1': 1,
      'call:counters.get:direct:1': 1,
      'call:counters.set:direct:2': 1,
      'call:detectSyntheticIdentifiers:direct:1': 1,
      'call:detection.rawValue.replace:direct:2': 1,
      'call:hasSyntheticResidue:direct:1': 1,
      'call:matchesFullGrammar:direct:2': 1,
      'call:matchingRule:direct:1': 1,
      'call:new:RegExp.test:direct:1': 2,
      'call:protectDetectedSpans:direct:2': 1,
      'call:protectSyntheticText:direct:1': 1,
      'call:protectedText.slice:direct:1': 1,
      'call:protectedText.slice:direct:2': 1,
      'call:protectedValueFor:direct:3': 1,
      'call:protection.registry.clear:direct:0': 1,
      'call:registry.set:direct:2': 1,
      'call:rule.pattern.flags.replace:direct:2': 1,
      'call:runFailed:direct:1': 8,
      'call:sortedDetections.map:direct:1': 1,
      'call:sortedDetections.some:direct:1': 1,
      'call:sourceText.matchAll:direct:1': 1,
      'call:sourceText.slice:direct:2': 1,
      'call:validateDetections:direct:2': 1,
      'call:validateSourceText:direct:1': 1,
      'call:valuesByRawIdentifier.get:direct:1': 1,
      'call:valuesByRawIdentifier.set:direct:2': 2,
      'implicit:for-of:sync': 1,
      'implicit:instanceof': 1,
      'implicit:spread:ArrayLiteralExpression': 2,
      'new:Error:1': 1,
      'new:Map:0': 3,
      'new:RegExp:2': 2,
    },
  },
  'src/prototype/run.ts': {
    sha256: '4218e4dd576b2dd0a97901f0847fe54b2350958a32ef27460a16d655635dce36',
    imports: [
      '@/prototype/contracts|type:SyntheticCase',
      '@/prototype/inspect|type:InspectionCheck,type:InspectionOutcome,type:VerifiedFields,value:CHECK_ORDER,value:inspectAndRestoreResponse,value:inspectResponse',
      '@/prototype/mockModel|value:generateMockResponse',
      '@/prototype/protect|value:detectSyntheticIdentifiers,value:protectDetectedSpans',
    ],
    operations: {
      'assign:+=:modelCallCount': 1,
      'assign:=:reachedStage': 5,
      'assign:=:registry': 1,
      'call:CHECK_ORDER.map:direct:1': 1,
      'call:RUN_STAGES.indexOf:direct:1': 2,
      'call:buildSnapshot:direct:6': 8,
      'call:buildSnapshot:direct:7': 1,
      'call:detectSyntheticIdentifiers:direct:1': 1,
      'call:failedSnapshot:direct:5': 1,
      'call:generateMockResponse:direct:2': 1,
      'call:inspectAndRestoreResponse:direct:1': 1,
      'call:inspectResponse:direct:1': 1,
      'call:notRunChecks:direct:0': 6,
      'call:protectDetectedSpans:direct:2': 1,
      'call:registry.clear:direct:0': 1,
      'call:stageRequested:direct:2': 6,
      'implicit:instanceof': 1,
      'new:Error:1': 1,
      'new:Map:1': 1,
    },
  },
};

const ASSIGNMENT_OPERATORS = new Set([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

function canonicalPrototypePath(file: string): string | null {
  const normalized = file.replaceAll('\\', '/');
  const offset = normalized.lastIndexOf('src/prototype/');
  return offset < 0 ? null : normalized.slice(offset);
}

function violation(file: string, rule: string, line = 1, column = 1): PrototypePolicyViolation {
  return {file, line, column, rule};
}

function expressionSignature(expression: ts.Expression): string {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  if (ts.isIdentifier(current) || ts.isPrivateIdentifier(current)) return current.text;
  if (ts.isPropertyAccessExpression(current)) {
    return `${expressionSignature(current.expression)}.${current.name.text}`;
  }
  if (ts.isElementAccessExpression(current)) return `${expressionSignature(current.expression)}[]`;
  if (ts.isCallExpression(current)) return `${expressionSignature(current.expression)}()`;
  if (ts.isNewExpression(current)) return `new:${expressionSignature(current.expression)}`;
  if (ts.isArrayLiteralExpression(current)) return 'array';
  if (ts.isStringLiteralLike(current)) return 'string';
  return ts.SyntaxKind[current.kind];
}

function importRecord(node: ts.ImportDeclaration): string {
  const module = ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : 'dynamic';
  const clause = node.importClause;
  if (clause === undefined) return `${module}|side-effect`;

  const bindings: string[] = [];
  if (clause.name !== undefined) bindings.push(`default:${clause.name.text}`);
  if (clause.namedBindings !== undefined) {
    if (ts.isNamespaceImport(clause.namedBindings)) {
      bindings.push(`namespace:${clause.namedBindings.name.text}`);
    } else {
      for (const element of clause.namedBindings.elements) {
        const imported = element.propertyName?.text ?? element.name.text;
        const local = element.name.text;
        const kind = clause.isTypeOnly || element.isTypeOnly ? 'type' : 'value';
        bindings.push(`${kind}:${imported}${local === imported ? '' : `>${local}`}`);
      }
    }
  }
  return `${module}|${bindings.sort().join(',')}`;
}

function operationInventory(sourceFile: ts.SourceFile): Readonly<Record<string, number>> {
  const operations = new Map<string, number>();
  const add = (record: string): void => {
    operations.set(record, (operations.get(record) ?? 0) + 1);
  };
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      add(
        node.expression.kind === ts.SyntaxKind.ImportKeyword
          ? `dynamic-import:${node.arguments.length}`
          : `call:${expressionSignature(node.expression)}:${node.questionDotToken ? 'optional' : 'direct'}:${node.arguments.length}`,
      );
    }
    if (ts.isNewExpression(node)) {
      add(`new:${expressionSignature(node.expression)}:${node.arguments?.length ?? 0}`);
    }
    if (ts.isBinaryExpression(node) && ASSIGNMENT_OPERATORS.has(node.operatorToken.kind)) {
      add(`assign:${node.operatorToken.getText(sourceFile)}:${expressionSignature(node.left)}`);
    }
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken)
    ) {
      add(`update:${ts.tokenToString(node.operator)}:${expressionSignature(node.operand)}`);
    }
    if (ts.isTaggedTemplateExpression(node)) add(`tagged:${expressionSignature(node.tag)}`);
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      add(`jsx:${node.tagName.getText(sourceFile)}`);
    }
    if (ts.isDecorator(node)) add(`decorator:${expressionSignature(node.expression)}`);
    if (ts.isForOfStatement(node)) add(`implicit:for-of:${node.awaitModifier ? 'await' : 'sync'}`);
    if (ts.isSpreadElement(node) || ts.isSpreadAssignment(node)) {
      add(`implicit:spread:${ts.SyntaxKind[node.parent.kind]}`);
    }
    if (ts.isYieldExpression(node) && node.asteriskToken !== undefined) add('implicit:yield-star');
    if (ts.isAwaitExpression(node)) add('implicit:await');
    if (ts.isDeleteExpression(node)) add('implicit:delete');
    if (
      ts.isBinaryExpression(node) &&
      (node.operatorToken.kind === ts.SyntaxKind.InKeyword ||
        node.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword)
    ) {
      add(`implicit:${node.operatorToken.getText(sourceFile)}`);
    }
    if (ts.isHeritageClause(node) && node.token === ts.SyntaxKind.ExtendsKeyword) {
      for (const type of node.types) add(`implicit:extends:${expressionSignature(type.expression)}`);
    }
    if (ts.isComputedPropertyName(node)) {
      add(`implicit:computed-property:${expressionSignature(node.expression)}`);
    }
    if (ts.isGetAccessorDeclaration(node)) add(`implicit:getter:${node.name.getText(sourceFile)}`);
    if (ts.isSetAccessorDeclaration(node)) add(`implicit:setter:${node.name.getText(sourceFile)}`);
    if (ts.isClassStaticBlockDeclaration(node)) add('implicit:class-static-block');
    if (ts.isWithStatement(node)) add('implicit:with');
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return Object.fromEntries(
    [...operations.entries()].sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)),
  );
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function findReviewedPrototypeSourceViolations(
  source: string,
  file: string,
): PrototypePolicyViolation[] {
  const path = canonicalPrototypePath(file);
  if (path === null) return [];
  const reviewed = REVIEWED_PROTOTYPE_SOURCES[path];
  if (reviewed === undefined) return [violation(file, 'prototype-inventory:unexpected-file')];

  const findings: PrototypePolicyViolation[] = [];
  const digest = createHash('sha256').update(source, 'utf8').digest('hex');
  if (digest !== reviewed.sha256) findings.push(violation(file, 'prototype-source-seal'));

  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const parseDiagnostics = (
    sourceFile as ts.SourceFile & {readonly parseDiagnostics?: readonly ts.Diagnostic[]}
  ).parseDiagnostics ?? [];
  if (parseDiagnostics.length > 0) {
    const diagnostic = parseDiagnostics[0];
    const position = sourceFile.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
    findings.push(violation(file, 'prototype-parse-error', position.line + 1, position.character + 1));
  }

  const imports: string[] = [];
  sourceFile.forEachChild((node) => {
    if (ts.isImportDeclaration(node)) imports.push(importRecord(node));
  });
  if (!sameJson(imports, reviewed.imports)) {
    findings.push(violation(file, 'prototype-import-ledger'));
  }
  if (!sameJson(operationInventory(sourceFile), reviewed.operations)) {
    findings.push(violation(file, 'prototype-operation-ledger'));
  }
  return findings;
}

export function findReviewedPrototypeGraphViolations(
  entries: readonly ReviewedPrototypeSource[],
): PrototypePolicyViolation[] {
  const findings: PrototypePolicyViolation[] = [];
  const byPath = new Map<string, ReviewedPrototypeSource>();

  for (const entry of entries) {
    const path = canonicalPrototypePath(entry.file);
    if (path === null || REVIEWED_PROTOTYPE_SOURCES[path] === undefined) {
      findings.push(violation(entry.file, 'prototype-inventory:unexpected-file'));
      continue;
    }
    if (byPath.has(path)) {
      findings.push(violation(entry.file, 'prototype-inventory:duplicate-file'));
      continue;
    }
    byPath.set(path, entry);
  }

  for (const path of Object.keys(REVIEWED_PROTOTYPE_SOURCES)) {
    const entry = byPath.get(path);
    if (entry === undefined) {
      findings.push(violation(path, 'prototype-inventory:missing-file'));
    } else {
      findings.push(...findReviewedPrototypeSourceViolations(entry.source, entry.file));
    }
  }
  return findings;
}
