import type { CalcConfig } from "./config.js";
import { defaultConfig } from "./config.js";
import createLexer, { Lexer } from "./lexer.js";
import type {
  NumberToken,
  NumberWithUnitToken,
  StringToken,
  Token,
} from "./lexer.js";
import type { MathNodeBase } from "./utils/types.d.js";
import type { IUnitValue } from "./utils/units.d.js";
import { UnitValue } from "./units.js";

type ParseFunction = (rbp?: number) => ASTNode;

interface BaseNode {
  type: string;
}

interface StringNode extends BaseNode {
  type: "string";
  value: string;
}

// Math nodes

interface IdNode extends BaseNode {
  type: "id";
  ref: number | Function;
  id: string;
}

type BinaryOpType = "+" | "-" | "*" | "/" | "^";

interface BinaryOpNode extends BaseNode {
  type: BinaryOpType;
  left: MathNode;
  right: MathNode;
}

interface FunctionCallNode extends BaseNode {
  type: "()";
  target: IdNode;
  args: MathNode[];
}

interface NegationNode extends BaseNode {
  type: "neg";
  value: MathNode;
}

type MathNode =
  | IdNode
  | BinaryOpNode
  | FunctionCallNode
  | NegationNode
  | (IUnitValue & MathNodeBase)
  | number;

type ASTNode = MathNode | StringNode;

type NudFunction = (
  token: Token,
  bp: number,
  parse: ParseFunction,
  lexer: Lexer,
  config: CalcConfig
) => ASTNode;

type LedFunction = (
  left: ASTNode,
  token: Token,
  bp: number,
  parse: ParseFunction,
  lexer: Lexer,
  config: CalcConfig
) => ASTNode;

const BPS = {
  EOF: 0,
  NUMBER: 0,
  NUMBER_WITH_UNIT: 0,
  FUNCTION_ID: 0,
  CONSTANT_ID: 0,
  ")": 0,
  "+": 20,
  "-": 20,
  "*": 30,
  "/": 30,
  "^": 40,
  "(": 50,
};

function getBp(token: Token): number {
  return BPS[token.type as keyof typeof BPS] || 0;
}

const NUDS: Record<string, NudFunction> = {
  NUMBER_WITH_UNIT: (t, _bp, _parse, _lexer, config) =>
    new UnitValue(
      (t as NumberWithUnitToken).value,
      (t as NumberWithUnitToken).unit,
      config
    ),
  NUMBER: (t, _bp, _parse, _lexer, config) =>
    new UnitValue((t as NumberToken).value, null, config),
  STRING: (t, _bp, _parse, _lexer, _config) => {
    return {
      type: "string",
      value: (t as StringToken).value,
    } as StringNode;
  },
  FUNCTION_ID: (t, _bp, _parse, _lexer, config) => {
    const id = t.match!;
    return {
      type: "id",
      ref: config.mathFunctions[id],
      id,
    } as IdNode;
  },
  CONSTANT_ID: (t, _bp, _parse, _lexer, config) => {
    const id = t.match!;
    return {
      type: "id",
      ref: config.mathConstants[id],
      id,
    } as IdNode;
  },
  "+": (_t, bp, parse, _lexer, _config) => parse(bp),
  "-": (_t, bp, parse, _lexer, _config) =>
    ({ type: "neg", value: parse(bp) } as NegationNode),
  "(": (_t, _bp, parse, lexer, _config) => {
    const inner = parse();
    lexer.expect(")");
    return inner;
  },
};

const createBinaryOp =
  (type: BinaryOpType): LedFunction =>
  (left, _t, bp, parse, _lexer, _config) =>
    ({ type, left, right: parse(bp) } as BinaryOpNode);

const LEDS: Record<string, LedFunction> = {
  "+": createBinaryOp("+"),
  "-": createBinaryOp("-"),
  "*": createBinaryOp("*"),
  "/": createBinaryOp("/"),
  "^": (left, _t, bp, parse, _lexer, _config) =>
    ({ type: "^", left, right: parse(bp - 1) } as BinaryOpNode),

  // Parse arguments (comma-separated)
  "(": (left, _t, _bp, parse, lexer, _config) => {
    if ((left as IdNode).type !== "id") {
      throw new Error("Cannot invoke expression as if it was a function");
    }

    const idNode = left as IdNode;
    if (typeof idNode.ref !== "function") {
      throw new Error(`Cannot invoke constant '${idNode.id}' as a function`);
    }

    const args: ASTNode[] = [];

    // Functions must have at least one argument
    if (lexer.peek().type === ")") {
      throw new Error(`Function ${idNode.id}() called with no arguments`);
    }

    // Parse first argument
    args.push(parse(0));

    // Parse additional arguments if any
    while (lexer.peek().type === ",") {
      lexer.next(); // consume comma
      args.push(parse(0));
    }

    lexer.expect(")");
    return { type: "()", target: idNode, args } as FunctionCallNode;
  },
};

const GROUP_END = new Set([
  "NUMBER",
  "NUMBER_WITH_UNIT",
  "CONSTANT_ID",
  "STRING",
  ")",
]);
const GROUP_START = new Set([
  "NUMBER",
  "NUMBER_WITH_UNIT",
  "STRING",
  "(",
  "FUNCTION_ID",
  "CONSTANT_ID",
]);
const isGroupSplit = (left: Token, right: Token): boolean =>
  GROUP_END.has(left.type) && GROUP_START.has(right.type);

function validateTokenStream(lexer: Lexer): Lexer[] {
  const expressions: Token[][] = [];
  let currentExpr: Token[] = [];
  let parenLevel = 0;

  for (let i = 0; i < lexer.tokens.length; i++) {
    const current = lexer.tokens[i];
    const next = lexer.tokens[i + 1];

    if (current.type === "," && parenLevel === 0) {
      throw new Error("Commas are only allowed inside function arguments");
    }

    if (current.type === "(") parenLevel++;
    currentExpr.push(current);

    if (current.type === ")") {
      parenLevel--;
      if (parenLevel < 0) throw new Error("Unmatched closing parenthesis");
    }

    // Split into new group when:
    // 1. We're not inside parentheses
    // 2. There's a next token
    // 3. Either it's a group split or we have a STRING token followed by another token
    if (
      parenLevel === 0 &&
      next &&
      (isGroupSplit(current, next) ||
        (current.type === "STRING" && next.type !== "EOF"))
    ) {
      expressions.push([...currentExpr]);
      currentExpr = [];
    }
  }

  if (parenLevel > 0) throw new Error("Unmatched opening parenthesis");
  if (currentExpr.length > 0) expressions.push(currentExpr);

  return expressions.map((tokens) => new Lexer(tokens));
}

function createParseFunction(lexer: Lexer, config: CalcConfig): ParseFunction {
  const nud = (token: Token): ASTNode => {
    const nudFn = NUDS[token.type];
    if (!nudFn)
      throw new Error(`NUD not defined for token type: ${token.type}`);
    return nudFn(token, getBp(token), parse, lexer, config);
  };

  const led = (left: ASTNode, token: Token): ASTNode => {
    const ledFn = LEDS[token.type];
    if (!ledFn)
      throw new Error(`LED not defined for token type: ${token.type}`);
    return ledFn(left, token, getBp(token), parse, lexer, config);
  };

  function parse(rbp = 0): ASTNode {
    const token = lexer.next();
    if (token.type === "EOF" && !lexer.eof()) {
      throw new Error("Unexpected token in expression");
    }

    let left = nud(token);
    while (getBp(lexer.peek()) > rbp) {
      left = led(left, lexer.next());
    }

    return left;
  }

  return parse;
}

function parse(s: string, options: Partial<CalcConfig> = {}): ASTNode[] {
  const config = { ...defaultConfig, ...options };
  return validateTokenStream(createLexer(s, options)).map((lexer) =>
    createParseFunction(lexer, config)()
  );
}

function isStringNode(node: ASTNode): node is StringNode {
  return (
    node && typeof node === "object" && "type" in node && node.type === "string"
  );
}

function isMathNode(node: ASTNode): node is MathNode {
  return !isStringNode(node);
}

function evaluateMathNode(node: MathNode, config: CalcConfig): IUnitValue {
  if (typeof node === "number") return new UnitValue(node, null, config);
  if (node instanceof UnitValue) return node;

  const typedNode = node as
    | IdNode
    | BinaryOpNode
    | FunctionCallNode
    | NegationNode;

  switch (typedNode.type) {
    case "id":
      return new UnitValue((node as IdNode).ref as number, null, config);

    case "^": {
      const n = node as BinaryOpNode;
      const left = evaluateMathNode(n.left, config);
      const right = evaluateMathNode(n.right, config);

      if (!left.isUnitless() || !right.isUnitless()) {
        throw new Error(
          "Power operations can only be performed on unitless values"
        );
      }

      return new UnitValue(Math.pow(left.value, right.value), null, config);
    }

    case "+": {
      const n = node as BinaryOpNode;
      return evaluateMathNode(n.left, config).add(
        evaluateMathNode(n.right, config)
      );
    }

    case "-": {
      const n = node as BinaryOpNode;
      return evaluateMathNode(n.left, config).subtract(
        evaluateMathNode(n.right, config)
      );
    }

    case "*": {
      const n = node as BinaryOpNode;
      return evaluateMathNode(n.left, config).multiply(
        evaluateMathNode(n.right, config)
      );
    }

    case "/": {
      const n = node as BinaryOpNode;
      return evaluateMathNode(n.left, config).divide(
        evaluateMathNode(n.right, config)
      );
    }

    case "()": {
      const n = node as FunctionCallNode;
      const evaluatedArgs = n.args.map((arg) => evaluateMathNode(arg, config));

      // Handle constants
      if (typeof n.target.ref === "number") {
        return new UnitValue(n.target.ref, null, config);
      }

      const result = (n.target.ref as Function)(...evaluatedArgs);

      if (result instanceof UnitValue) {
        return result;
      }

      // Handle simple record format {value: number; unit: string | null}
      if (result && typeof result === "object" && "value" in result) {
        return new UnitValue(result.value, result.unit, config);
      }

      if (typeof result === "number") {
        // Use the first argument's unit
        const unit = evaluatedArgs[0].unit;
        // Create a UnitValue with the result and the unit from the first argument
        return new UnitValue(result, unit, config);
      }

      // If the result is something else (like a string), convert to number and use first arg's unit
      return new UnitValue(Number(result), evaluatedArgs[0].unit, config);
    }

    case "neg":
      return evaluateMathNode((node as NegationNode).value, config).negate();

    default:
      // At this point typedNode is never type due to exhaustive switch cases
      throw new Error(`Unknown node type: ${String((typedNode as any).type)}`);
  }
}

function evaluateParserNodes(
  node: ASTNode,
  config: CalcConfig
): IUnitValue | StringNode {
  if (isStringNode(node)) {
    return node;
  }

  return evaluateMathNode(node, config);
}

function isStringResult(result: IUnitValue | StringNode): result is StringNode {
  return "type" in result && result.type === "string";
}

export interface RunResult {
  parsers: ASTNode[];
  exec: () => (IUnitValue | StringNode)[];
}

export function run(s: string, options: Partial<CalcConfig> = {}): RunResult {
  const config = { ...defaultConfig, ...options };
  const parsers = parse(s, config);

  return {
    parsers,
    exec: (ps = parsers) => parsers.map((p) => evaluateParserNodes(p, config)),
  };
}

export function calc(
  s: string,
  options: Partial<CalcConfig> = {}
): (number | string)[] {
  const config = { ...defaultConfig, ...options };
  const parsers = parse(s, config);

  const results = parsers.map((p) => {
    const result = evaluateParserNodes(p, config);

    if (isStringResult(result)) return result.value;

    if (result.isUnitless()) return result.value;

    return result.toString();
  });

  return results;
}
